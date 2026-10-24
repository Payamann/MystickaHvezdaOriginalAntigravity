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

// Artwork data must follow the same release as newly versioned browser code.
test('returning clients receive fresh tarot artwork metadata instead of stale cache', async () => {
    const h = harness();
    let response;
    h.listeners.fetch({ request: new Request('https://example.com/data/tarot-cards.json?v=20261007-deck-v2'), respondWith: p => { response = p; } });
    expect(await response).toBe(h.fresh);
    expect(h.fetch).toHaveBeenCalledWith(expect.any(Request), { cache: 'no-cache' });
});

test('offline fallback precaches its exact production-hashed stylesheets', async () => {
    const h = harness();
    const versionedOfflineStyles = [
        '/fonts/local-fonts.mh-0123456789abcdef.css?theme=atlas',
        '/css/pages/offline.mh-1123456789abcdef.css',
        '/css/atlas-web.mh-2123456789abcdef.css?v=1',
        '/css/atlas-remaining.mh-3123456789abcdef.css?v=2'
    ];
    h.context.offlineCache = h.cache;
    h.context.offlinePage = {
        clone: () => ({ text: async () => versionedOfflineStyles.map(href => `<link rel="stylesheet" href="${href}">`).join('') })
    };

    await vm.runInContext('precacheVersionedOfflineAssets(offlineCache, offlinePage)', h.context);

    const requestedUrls = h.fetch.mock.calls.map(([request]) => request.url);
    expect(requestedUrls).toEqual(versionedOfflineStyles.map(href => `https://example.com${href}`));
    for (const href of versionedOfflineStyles) {
        expect(h.cache.put).toHaveBeenCalledWith(`https://example.com${href}`, h.fresh);
    }
});
