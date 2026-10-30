import fs from 'node:fs';
import vm from 'node:vm';
import { jest } from '@jest/globals';

const source = fs.readFileSync(new URL('../../js/crystal-ball.js', import.meta.url), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
function fixture(owner = 'a') {
    const listeners = new Map();
    const node = () => ({ value: '', textContent: '', children: [],
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener(event, fn) { this[event] = fn; }, focus() {},
        querySelectorAll() { return this.children; },
        appendChild(child) { this.children.push(child); }, remove() {}
    });
    const nodes = Object.fromEntries(['crystal-ball', 'answer-container', 'answer-text', 'reset-btn', 'question-input', 'ask-btn', 'favorite-crystal-btn'].map(id => [id, node()]));
    const document = { documentElement: { lang: 'cs' }, getElementById: id => nodes[id], createElement: node,
        addEventListener(event, fn) { const list = listeners.get(event) || []; list.push(fn); listeners.set(event, list); }
    };
    const window = {
        location: { pathname: '/kristalova-koule.html', search: '', origin: 'https://example.test' }, addEventListener() {},
        getCSRFToken: jest.fn(async () => 'token'),
        Auth: { user: owner ? { id: owner } : null, isLoggedIn() { return Boolean(this.user); },
            saveReading: jest.fn(async () => ({ id: 'saved' })), showToast: jest.fn(), startPlanCheckout: jest.fn() },
        MH_ANALYTICS: { trackAction: jest.fn() }
    };
    const fetch = jest.fn(async () => ({ json: async () => ({ success: true, response: 'Visible answer' }) }));
    const storage = new Map();
    const timers = [];
    const context = vm.createContext({ window, document, fetch, URLSearchParams, URL, navigator: {},
        console: { warn() {}, error() {} },
        setTimeout: (fn, delay) => { timers.push({ fn, delay }); return timers.length; }, clearTimeout() {},
        localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }
    });
    vm.runInContext(source, context);
    vm.runInContext('initCrystalBall()', context);
    return { nodes, window, fetch, storage,
        ask: async () => { nodes['question-input'].value = 'Private question'; nodes['ask-btn'].click(); await flush(); },
        changeOwner: id => { window.Auth.user = id ? { id } : null; for (const fn of listeners.get('auth:changed') || []) fn(); },
        finishTyping: async () => {
            for (let i = 0; i < 400; i++) {
                const index = timers.findIndex(timer => timer.delay === 30);
                if (index < 0) break;
                timers.splice(index, 1)[0].fn(); await flush();
            }
        },
        runTimers: delay => { for (const timer of timers.filter(item => item.delay === delay)) timer.fn(); },
        history: () => Array.from(vm.runInContext('questionHistory', context))
    };
}

test.each(['csrf', 'fetch', 'typing', 'save'])('A → B → A cancels pending %s effects', async stage => {
    const app = fixture();
    const pending = deferred();
    if (stage === 'csrf') app.window.getCSRFToken.mockReturnValueOnce(pending.promise);
    if (stage === 'fetch') app.fetch.mockReturnValueOnce(pending.promise);
    if (stage === 'save') app.window.Auth.saveReading.mockReturnValueOnce(pending.promise);
    await app.ask();
    if (stage === 'save') await app.finishTyping();
    app.changeOwner('b'); app.changeOwner('a');
    pending.resolve(stage === 'fetch' ? { json: async () => ({ success: true, response: 'Obsolete' }) } : stage === 'save' ? { id: 'obsolete' } : 'csrf');
    await flush(); await app.finishTyping();
    expect(app.nodes['answer-text'].textContent).toBe('');
    expect(app.nodes['question-input'].value).toBe('');
    expect(app.nodes['answer-container'].children).toHaveLength(0);
    expect(app.window.currentCrystalReadingId).toBeNull();
    expect(app.history()).toEqual([]);
    if (stage === 'csrf') expect(app.fetch).not.toHaveBeenCalled();
    if (stage !== 'save') {
        expect(app.window.Auth.saveReading).not.toHaveBeenCalled();
        expect(app.window.MH_ANALYTICS.trackAction).not.toHaveBeenCalled();
    }
});

test.each([null, 'throw'])('history failure (%s) preserves completed answer', async failure => {
    const app = fixture();
    if (failure === 'throw') app.window.Auth.saveReading.mockRejectedValueOnce(new Error('offline'));
    else app.window.Auth.saveReading.mockResolvedValueOnce(null);
    await app.ask(); await app.finishTyping();
    expect(app.nodes['answer-text'].textContent).toBe('Visible answer');
    expect(app.window.Auth.saveReading).toHaveBeenCalledWith('crystal-ball', { question: 'Private question', answer: 'Visible answer' }, 'a');
    expect(app.window.currentCrystalReadingId).toBeNull();
});

test('new account request contains no former question history', async () => {
    const app = fixture();
    await app.ask(); await app.finishTyping();
    expect(app.history()).toEqual(['Private question']);
    app.changeOwner('b');
    app.storage.delete('crystalBall_lastUsage');
    await app.ask(); await app.finishTyping();
    expect(JSON.parse(app.fetch.mock.calls[1][1].body).history).toEqual([]);
    expect(app.window.Auth.saveReading).toHaveBeenLastCalledWith('crystal-ball', expect.any(Object), 'b');
});

test('anonymous answer remains visible without saving', async () => {
    const app = fixture(null);
    await app.ask(); await app.finishTyping();
    expect(app.nodes['answer-text'].textContent).toBe('Visible answer');
    expect(app.window.Auth.saveReading).not.toHaveBeenCalled();
});

test('fallback is labeled and stays identifiable in saved history', async () => {
    const app = fixture();
    app.fetch.mockResolvedValueOnce({ json: async () => ({ success: true, fallback: true, response: 'General prompt' }) });
    await app.ask(); await app.finishTyping();
    expect(app.nodes['answer-text'].textContent).toContain('náhradní obecný podnět');
    expect(app.nodes['answer-text'].textContent).toContain('General prompt');
    expect(app.window.Auth.saveReading).toHaveBeenCalledWith('crystal-ball', { question: 'Private question', answer: 'General prompt', fallback: true }, 'a');
});

test('stale local quota cannot block the server or send an anonymous visitor to paid checkout', async () => {
    const app = fixture(null);
    app.storage.set(`mh_daily_crystal_${new Date().toDateString()}`, '99');
    app.fetch.mockResolvedValueOnce({ status: 402, json: async () => ({ success: false, code: 'REGISTRATION_REQUIRED' }) });
    await app.ask();
    expect(app.fetch).toHaveBeenCalledTimes(1);
    expect(app.window.Auth.startPlanCheckout).not.toHaveBeenCalled();
    app.runTimers(1600);
    expect(app.window.location.href).toContain('/prihlaseni.html?mode=register');
});

test('scheduled registration redirect is discarded after login', async () => {
    const app = fixture(null);
    app.fetch.mockResolvedValueOnce({ json: async () => ({ success: false, code: 'REGISTRATION_REQUIRED' }) });
    await app.ask();
    app.changeOwner('b');
    app.runTimers(1600);
    expect(app.window.location.href).toBeUndefined();
});

test('old network error cannot reappear after an account change', async () => {
    const app = fixture();
    let reject;
    app.fetch.mockReturnValueOnce(new Promise((resolve, fail) => { reject = fail; }));
    await app.ask();
    app.changeOwner('b');
    reject(new Error('offline'));
    await flush();
    expect(app.nodes['answer-text'].textContent).toBe('');
    expect(app.window.Auth.saveReading).not.toHaveBeenCalled();
});
