import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const source = fs.readFileSync(path.resolve(process.cwd(), 'js/runes.js'), 'utf8')
    .replace(/^import\s+[\s\S]*?;\s*$/gm, '');

const FEHU = {
    name: 'Fehu', symbol: 'ᚠ', meaning: 'Katalogový význam', description: 'Katalogový popis', element: 'fire'
};
const URUZ = {
    name: 'Uruz', symbol: 'ᚢ', meaning: 'Síla a vytrvalost', description: 'Druhý popis', element: 'earth'
};

function makeElement(id = '') {
    const classes = new Set();
    return {
        id, value: '', hidden: false, textContent: '', innerHTML: '',
        classList: {
            add: (...values) => values.forEach(value => classes.add(value)),
            remove: (...values) => values.forEach(value => classes.delete(value)),
            contains: value => classes.has(value)
        },
        scrollIntoView() {},
        addEventListener() {},
        setAttribute() {},
        removeAttribute() {}
    };
}

function createSession({ pending = null, drawn = null, sessionStorageThrows = false } = {}) {
    const nodes = Object.fromEntries([
        'active-rune', 'btn-draw', 'rune-symbol', 'rune-result', 'rune-name', 'rune-meaning', 'rune-desc', 'rune-intention'
    ].map(id => [id, makeElement(id)]));
    const sessionData = new Map();
    if (pending !== null) sessionData.set('pendingRuneContext', pending);
    const localData = new Map();
    const writes = [];
    const storage = {
        getItem(key) {
            if (sessionStorageThrows) throw new Error('Storage disabled');
            return sessionData.get(key) ?? null;
        },
        setItem(key, value) {
            if (sessionStorageThrows) throw new Error('Storage disabled');
            sessionData.set(key, String(value));
            writes.push([key, String(value)]);
        },
        removeItem(key) {
            if (sessionStorageThrows) throw new Error('Storage disabled');
            sessionData.delete(key);
        }
    };
    const localStorage = {
        getItem: key => localData.get(key) ?? null,
        setItem: (key, value) => localData.set(key, String(value)),
        removeItem: key => localData.delete(key)
    };
    const document = {
        documentElement: { lang: 'cs' },
        getElementById: id => nodes[id] || null,
        createElement: () => ({ set textContent(value) { this._text = value; }, get innerHTML() { return this._text || ''; } }),
        addEventListener() {}
    };
    const context = vm.createContext({
        document,
        window: { addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: true }) },
        getPragueDateKey: () => new Date().toISOString().slice(0, 10),
        sessionStorage: storage,
        localStorage,
        fetch: async () => ({ ok: true, json: async () => [FEHU, URUZ] }),
        Date,
        Math,
        setTimeout: callback => { callback?.(); return 0; },
        clearTimeout() {},
        console: { error() {}, warn() {}, log() {} },
        alert() {},
        URL,
        URLSearchParams
    });
    vm.runInContext(`${source}\n;globalThis.__runeTest = { restorePendingRuneContext, stashPendingRuneContext, setRunes(data) { runesData = data; }, setDrawn(rune) { drawnRune = rune; }, getDrawn() { return drawnRune; } };`, context);
    context.__runeTest.setRunes([FEHU, URUZ]);
    if (drawn) context.__runeTest.setDrawn(drawn);
    return { context, nodes, sessionData, localData, writes, storage };
}

function pendingContext({ rune = FEHU, date = new Date().toISOString().slice(0, 10), intention = 'Co mohu změnit?' } = {}) {
    return JSON.stringify({ date, rune, intention });
}

test('same-day context restores canonical rune and intention, then removes pending storage', () => {
    const tampered = { ...FEHU, description: 'Podvržený popis', meaning: 'Podvržený význam' };
    const session = createSession({ pending: pendingContext({ rune: tampered }) });

    session.context.__runeTest.restorePendingRuneContext();

    expect(session.context.__runeTest.getDrawn().description).toBe(FEHU.description);
    expect(session.nodes['rune-intention'].value).toBe('Co mohu změnit?');
    expect(session.nodes['rune-name'].textContent).toBe('Fehu ᚠ');
    expect(session.nodes['rune-meaning'].textContent).toBe(FEHU.meaning);
    expect(session.nodes['active-rune'].classList.contains('rune-stone--drawn')).toBe(true);
    expect(JSON.parse(session.localData.get('runeDaily'))).toEqual({
        date: new Date().toISOString().slice(0, 10), runeData: FEHU
    });
    expect(session.sessionData.has('pendingRuneContext')).toBe(false);
});

test.each([
    ['stale date', () => pendingContext({ date: '2000-01-01' })],
    ['malformed JSON', () => '{not json'],
    ['unknown rune', () => pendingContext({ rune: { ...FEHU, name: 'Unknown' } })],
    ['name and symbol mismatch', () => pendingContext({ rune: { ...FEHU, symbol: URUZ.symbol } })],
    ['non-string intention', () => JSON.stringify({ date: new Date().toISOString().slice(0, 10), rune: FEHU, intention: 42 })]
])('%s context is discarded without restoring a rune', (_label, makePending) => {
    const session = createSession({ pending: makePending() });

    session.context.__runeTest.restorePendingRuneContext();

    expect(session.context.__runeTest.getDrawn()).toBeNull();
    expect(session.nodes['rune-intention'].value).toBe('');
    expect(session.localData.has('runeDaily')).toBe(false);
    expect(session.sessionData.has('pendingRuneContext')).toBe(false);
});

test('pending context cannot replace a different rune already drawn for today', () => {
    const session = createSession({ pending: pendingContext({ rune: FEHU }), drawn: URUZ });
    session.localData.set('runeDaily', JSON.stringify({ date: new Date().toISOString().slice(0, 10), runeData: URUZ }));

    session.context.__runeTest.restorePendingRuneContext();

    expect(session.context.__runeTest.getDrawn().name).toBe(URUZ.name);
    expect(session.nodes['rune-intention'].value).toBe('');
    expect(JSON.parse(session.localData.get('runeDaily')).runeData.name).toBe(URUZ.name);
    expect(session.sessionData.has('pendingRuneContext')).toBe(false);
});

test('session storage access denial fails softly', () => {
    const session = createSession({ sessionStorageThrows: true });

    expect(() => session.context.__runeTest.restorePendingRuneContext()).not.toThrow();
    expect(session.context.__runeTest.getDrawn()).toBeNull();
});

test('a saved member intention is not restored into a different account', () => {
    const pending = JSON.parse(pendingContext());
    pending.ownerId = 'original-member';
    const session = createSession({ pending: JSON.stringify(pending) });
    session.context.window.Auth = { user: { id: 'different-member' } };

    session.context.__runeTest.restorePendingRuneContext();

    expect(session.nodes['rune-intention'].value).toBe('');
    expect(session.context.__runeTest.getDrawn()).toBeNull();
});

test('a saved member intention resumes for the same account', () => {
    const pending = JSON.parse(pendingContext());
    pending.ownerId = 'original-member';
    const session = createSession({ pending: JSON.stringify(pending) });
    session.context.window.Auth = { user: { id: 'original-member' } };

    session.context.__runeTest.restorePendingRuneContext();

    expect(session.nodes['rune-intention'].value).toBe('Co mohu změnit?');
    expect(session.context.__runeTest.getDrawn().name).toBe(FEHU.name);
});

test('stashing writes a dated canonical rune payload and intention', () => {
    const tamperedDrawn = { ...FEHU, description: 'Tampered' };
    const session = createSession({ drawn: tamperedDrawn });

    session.context.__runeTest.stashPendingRuneContext('  Co dál?  ');

    const [key, serialized] = session.writes[0];
    const payload = JSON.parse(serialized);
    expect(key).toBe('pendingRuneContext');
    expect(payload.date).toBe(new Date().toISOString().slice(0, 10));
    expect(payload.rune).toEqual(FEHU);
    expect(payload.intention).toBe('  Co dál?  ');
});
