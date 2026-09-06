import vm from 'node:vm';
import fs from 'node:fs';
import { jest } from '@jest/globals';

function harness() {
    const listeners = {};
    const old = { status: 200, body: 'old' };
    const fresh = { status: 200, type: 'basic', body: 'fresh', headers: new Headers(), clone() { return this; } };
    const cache = { match: jest.fn(async () => old), put: jest.fn(async () => {}), keys: async () => [] };
    const fetch = jest.fn(async () => fresh);
    const context = vm.createContext({ URL, Request, console, fetch,
        caches: { open: async () => cache },
        self: { location: { origin: 'https://example.com' }, addEventListener: (name, fn) => { listeners[name] = fn; } }
    });
    vm.runInContext(fs.readFileSync('service-worker.js', 'utf8'), context);
    return { listeners, cache, fresh, fetch, context };
}
test('returning clients receive network JS instead of a stale cached copy', async () => {
    const h = harness();
    let response;
    h.listeners.fetch({ request: new Request('https://example.com/js/dist/core.js?v=new'), respondWith: p => { response = p; } });
    expect(await response).toBe(h.fresh);
    expect(h.fetch).toHaveBeenCalledWith(expect.any(Request), { cache: 'no-cache' });
});
test('query variants cannot fall back to a different precache version', async () => {
    const h = harness();
    h.cache.match.mockResolvedValue(undefined);
    await vm.runInContext("matchCachedRequest(new Request('https://example.com/js/dist/core.js?v=new'))", h.context);
    expect(h.cache.match).toHaveBeenCalledTimes(1);
});
