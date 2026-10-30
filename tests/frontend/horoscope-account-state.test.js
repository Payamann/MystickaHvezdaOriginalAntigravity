import fs from 'node:fs';
import vm from 'node:vm';
import { jest } from '@jest/globals';

const source = fs.readFileSync(new URL('../../js/horoscope.js', import.meta.url), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

test('fallback is labeled and preserved in history metadata', async () => {
    const app = fixture();
    app.window.callAPI.mockResolvedValueOnce({ fallback: true, response: { prediction: 'General horoscope' } });
    await app.select();
    expect(app.nodes['detail-text'].innerText).toContain('předem připravený náhradní text');
    expect(app.nodes['detail-text'].innerText).toContain('General horoscope');
    expect(app.window.Auth.saveReading).toHaveBeenCalledWith('horoscope', expect.objectContaining({ fallback: true, prediction: 'General horoscope' }), 'account-a');
});
function fixture(owner = 'account-a') {
    const listeners = new Map();
    const node = () => ({
        textContent: '', innerText: '', innerHTML: '', dataset: {}, parentElement: {},
        classList: { add() {}, remove() {}, toggle() {} },
        querySelector: () => null, querySelectorAll: () => [],
        addEventListener(event, fn) { this[event] = fn; }, scrollIntoView() {}, remove() {},
        appendChild() {}, parentNode: { insertBefore() {} }
    });
    const nodes = Object.fromEntries(['horoscope-detail-section', 'detail-text', 'detail-date', 'detail-work', 'detail-numbers', 'favorite-horoscope-btn'].map(id => [id, node()]));
    const card = node();
    card.querySelector = selector => ({ innerText: selector.includes('name') ? 'Beran' : '♈' });
    card.getAttribute = () => '#beran';
    const content = node();
    const document = {
        documentElement: { lang: 'cs' },
        getElementById: id => nodes[id],
        querySelector: selector => selector === '.horoscope-content' ? content : null,
        querySelectorAll: selector => selector === '.zodiac-card' ? [card] : [],
        createElement: node,
        addEventListener(event, fn) { const list = listeners.get(event) || []; list.push(fn); listeners.set(event, list); }
    };
    const window = {
        location: { search: '', hash: '', pathname: '/horoskopy.html' }, addEventListener() {},
        Auth: { user: owner ? { id: owner } : null, isLoggedIn() { return Boolean(this.user); }, isPremium: () => true,
            saveReading: jest.fn(async () => ({ id: 'saved-id' })) },
        callAPI: jest.fn(async () => ({ response: { prediction: 'Private reading' } }))
    };
    const storage = new Map();
    const fetch = jest.fn(async () => ({ ok: true, json: async () => ({ readings: [] }) }));
    const context = vm.createContext({ window, document, fetch, URLSearchParams, URL, Intl,
        console: { warn() {}, error() {} }, setTimeout() {}, setInterval() {}, clearInterval() {},
        sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }
    });
    vm.runInContext(source, context);
    vm.runInContext('initHoroscope()', context);
    return { nodes, window, storage, fetch,
        select: async () => { await card.click({ preventDefault() {} }); await flush(); },
        changeOwner: id => { window.Auth.user = id ? { id } : null; for (const fn of listeners.get('auth:changed') || []) fn(); }
    };
}

test.each([null, 'throw'])('failed save (%s) retains result and allows retry', async failure => {
    const app = fixture();
    if (failure === 'throw') app.window.Auth.saveReading.mockRejectedValueOnce(new Error('offline'));
    else app.window.Auth.saveReading.mockResolvedValueOnce(null);
    await app.select();
    expect(app.nodes['detail-text'].innerText).toBe('Private reading');
    expect(app.nodes['horoscope-detail-section'].dataset.loaded).toBe('true');
    expect(app.storage.size).toBe(0);
    await app.select();
    expect(app.window.Auth.saveReading).toHaveBeenCalledTimes(2);
    expect(app.window.Auth.saveReading).toHaveBeenLastCalledWith('horoscope', expect.any(Object), 'account-a');
    expect([...app.storage.keys()][0]).toContain('account-a');
    expect([...app.storage.values()]).toEqual(['saved-id']);
});

test('saved marker is independent for each account; anonymous results are not saved', async () => {
    const app = fixture();
    await app.select();
    await app.select();
    expect(app.window.Auth.saveReading).toHaveBeenCalledTimes(1);
    app.changeOwner('account-b');
    await app.select();
    expect(app.storage.size).toBe(2);
    app.changeOwner(null);
    await app.select();
    expect(app.window.Auth.saveReading).toHaveBeenCalledTimes(2);
    expect(app.nodes['horoscope-detail-section'].dataset.loaded).toBe('true');
});

test.each(['journal', 'generation', 'save'])('A → B → A invalidates pending %s work', async stage => {
    const app = fixture();
    const pending = deferred();
    if (stage === 'journal') app.fetch.mockReturnValueOnce(pending.promise);
    if (stage === 'generation') app.window.callAPI.mockReturnValueOnce(pending.promise);
    if (stage === 'save') app.window.Auth.saveReading.mockReturnValueOnce(pending.promise);
    await app.select();
    app.changeOwner('account-b');
    app.changeOwner('account-a');
    pending.resolve(stage === 'journal' ? { ok: true, json: async () => ({ readings: [] }) }
        : stage === 'generation' ? { response: { prediction: 'Obsolete' } } : { id: 'obsolete-id' });
    await flush();
    expect(app.nodes['horoscope-detail-section'].dataset.loaded).toBe('false');
    expect(app.nodes['detail-text'].textContent).toBe('');
    expect(app.window.currentHoroscopeReadingId).toBeNull();
    expect(app.storage.size).toBe(0);
    if (stage === 'journal') expect(app.window.callAPI).not.toHaveBeenCalled();
    if (stage !== 'save') expect(app.window.Auth.saveReading).not.toHaveBeenCalled();
});

test('a late first selection cannot overwrite the next selection', async () => {
    const app = fixture();
    const pending = deferred();
    app.window.callAPI.mockReturnValueOnce(pending.promise);
    await app.select();
    await app.select();
    pending.resolve({ response: { prediction: 'Obsolete' } });
    await flush();
    expect(app.nodes['detail-text'].innerText).toBe('Private reading');
    expect(app.window.Auth.saveReading).toHaveBeenCalledTimes(1);
});

test('late generation failure cannot replace the new account result', async () => {
    const app = fixture();
    let reject;
    app.window.callAPI.mockReturnValueOnce(new Promise((resolve, fail) => { reject = fail; }));
    await app.select();
    app.changeOwner('account-b');
    await app.select();
    reject(new Error('old request failed'));
    await flush();
    expect(app.nodes['detail-text'].innerText).toBe('Private reading');
    expect(app.nodes['horoscope-detail-section'].dataset.loaded).toBe('true');
    expect(app.window.currentHoroscopeReadingId).toBe('saved-id');
    expect([...app.storage.keys()]).toEqual([expect.stringContaining('account-b')]);
});
