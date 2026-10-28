import fs from 'node:fs';
import vm from 'node:vm';
import { jest } from '@jest/globals';

const source = fs.readFileSync(new URL('../../js/numerology.js', import.meta.url), 'utf8')
    .replace(/^import\s*\{[\s\S]*?from '\.\/utils\/numerology-logic.js';/, '');
const deferred = () => {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
};
const flush = () => new Promise(resolve => setImmediate(resolve));

function fixture(ownerId = 'account-a') {
    const listeners = new Map();
    const node = () => ({
        value: '', checked: false, hidden: false, innerHTML: '', textContent: '', dataset: {}, children: [],
        classList: { add() {}, remove() {}, toggle() {} },
        append(child) { this.children.push(child); },
        replaceChildren() { this.children = []; this.innerHTML = ''; this.textContent = ''; },
        setAttribute() {}, querySelector: () => null, addEventListener() {},
        scrollIntoView() {}
    });
    const ids = ['numerology-form', 'num-name', 'num-date', 'num-time', 'use-profile-num', 'num-status',
        'daily-cycles', 'numerology-results', 'numerology-result-actions', 'num-interpretation',
        'val-py', 'val-pm', 'val-pd', 'current-date-display', 'card-lifepath', 'card-destiny', 'card-soul', 'card-personality'];
    const nodes = Object.fromEntries(ids.map(id => [id, node()]));
    nodes['use-profile-num'].closest = () => node();
    nodes['use-profile-num'].addEventListener = (event, fn) => { nodes['use-profile-num'][event] = fn; };
    const document = {
        getElementById: id => nodes[id], createElement: node,
        addEventListener(event, fn) { const all = listeners.get(event) || []; all.push(fn); listeners.set(event, all); }
    };
    const window = {
        Auth: {
            user: ownerId ? { id: ownerId } : null,
            isLoggedIn() { return Boolean(this.user); }, isPremium: () => true,
            getProfile: jest.fn(async () => null), saveReading: jest.fn(async () => ({ id: 'saved' }))
        },
        location: { search: '', pathname: '/numerologie.html' }, getCSRFToken: async () => 'mock'
    };
    const fetch = jest.fn();
    const context = vm.createContext({ window, document, fetch, URLSearchParams, console: { error() {}, warn() {} }, setTimeout });
    vm.runInContext(source, context);
    const dispatch = async event => { for (const fn of listeners.get(event) || []) await fn(); };
    return {
        nodes, window, fetch, dispatch,
        owner: () => vm.runInContext('captureNumerologyOwner()', context),
        interpret: () => vm.runInContext("displayInterpretation('Jana', '1990-06-15', '', 4, 5, 6, 7, captureNumerologyOwner())", context),
        changeOwner: async id => { window.Auth.user = id ? { id } : null; await dispatch('auth:changed'); }
    };
}

const success = { ok: true, json: async () => ({ response: 'Private completed reading' }) };

test.each(['resolve', 'reject'])('old result cannot render or save after A → B → A (%s)', async outcome => {
    const app = fixture();
    const pending = deferred();
    app.fetch.mockReturnValue(pending.promise);
    const request = app.interpret();
    await flush();
    await app.changeOwner('account-b');
    await app.changeOwner('account-a');
    if (outcome === 'resolve') pending.resolve(success);
    else pending.resolve({ ok: false, status: 500 });
    await request;
    expect(app.nodes['num-interpretation'].innerHTML).toBe('');
    expect(app.window.Auth.saveReading).not.toHaveBeenCalled();
    expect(app.nodes['numerology-results'].hidden).toBe(true);
});

test('anonymous result and share/input data are removed on login', async () => {
    const app = fixture(null);
    app.nodes['num-name'].value = 'Previous visitor';
    app.nodes['num-date'].value = '1988-02-03';
    app.nodes['num-interpretation'].innerHTML = 'Previous anonymous result';
    app.nodes['val-pd'].textContent = '18';
    app.window.__lastNumerologyShareResult = { lifePath: 4 };
    await app.changeOwner('account-b');
    expect(app.nodes['num-name'].value).toBe('');
    expect(app.nodes['num-date'].value).toBe('');
    expect(app.nodes['num-interpretation'].innerHTML).toBe('');
    expect(app.nodes['val-pd'].textContent).toBe('');
    expect(app.window.__lastNumerologyShareResult).toBeNull();
});

test('account switch while CSRF is pending prevents interpretation request', async () => {
    const app = fixture();
    const csrf = deferred();
    app.window.getCSRFToken = () => csrf.promise;
    const request = app.interpret();
    await app.changeOwner('account-b');
    csrf.resolve('old-token');
    await request;
    expect(app.fetch).not.toHaveBeenCalled();
});

test.each([null, 'throw'])('failed history save (%s) keeps completed output and a useful warning', async outcome => {
    const app = fixture();
    app.fetch.mockResolvedValue(success);
    if (outcome === 'throw') app.window.Auth.saveReading.mockRejectedValue(new Error('offline'));
    else app.window.Auth.saveReading.mockResolvedValue(null);
    await app.interpret();
    expect(app.nodes['num-interpretation'].innerHTML).toContain('Private completed reading');
    expect(app.nodes['num-interpretation'].children[0].textContent).toContain('nepodařilo se ho uložit do profilu');
    expect(app.nodes['num-status'].textContent).toContain('Výklad je hotový');
    expect(app.window.Auth.saveReading.mock.calls[0][2]).toBe('account-a');
});

test('late profile autofill is ignored after account changes and checkbox is reset', async () => {
    const app = fixture(null);
    await app.dispatch('DOMContentLoaded');
    await app.changeOwner('account-a');
    const profile = deferred();
    app.window.Auth.getProfile = () => profile.promise;
    const checkbox = app.nodes['use-profile-num'];
    checkbox.checked = true;
    const fill = checkbox.change({ target: checkbox });
    await app.changeOwner('account-b');
    profile.resolve({ first_name: 'Old account', birth_date: '1988-02-03' });
    await fill;
    expect(app.nodes['num-name'].value).toBe('');
    expect(app.nodes['num-date'].value).toBe('');
    expect(checkbox.checked).toBe(false);
});
