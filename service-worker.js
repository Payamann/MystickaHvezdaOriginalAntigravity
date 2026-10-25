/**
 * Mystická Hvězda - Service Worker
 * Provides offline caching with stale-while-revalidate strategy
 */

const CACHE_NAME = 'mysticka-hvezda-27b1a338ac73';
const MAX_RUNTIME_CACHE_SIZE = 150;
const STATIC_ASSETS = [
    '/img/icons/mh-favicon.svg',
    '/img/icons/mh-symbols.svg',
    '/css/atlas-polish-v1.css',
    '/js/dist/moon-phase-illustration.js',
    '/img/atlas/chinese-zodiac-v1.webp',
    '/img/atlas/western-zodiac-v1.webp',
    '/fonts/local-fonts.css',
    '/fonts/cinzel-latin-ext.woff2',
    '/fonts/cinzel-latin.woff2',
    '/fonts/inter-latin-ext.woff2',
    '/fonts/inter-latin.woff2',
    '/css/style.v2.min.css',
    '/css/home.min.css',
    '/css/site.min.css',
    '/css/profile-refresh.css',
    '/css/pages/index.css',
    '/css/pages/horoskop-index.css',
    '/css/pages/horoskop-znameni-art-v1.css',
    '/css/pages/tarot-karta-dne.css',
    '/css/tarot-atlas.css',
    '/css/atlas-web.css',
    '/css/atlas-blog.css',
    '/css/atlas-content.css',
    '/css/atlas-tools.css',
    '/css/atlas-astro.css',
    '/css/atlas-angels.css',
    '/css/pages/andelske-karty.css',
    '/css/atlas-remaining.css',
    '/css/pages/offline.css',
    '/css/atlas-art.css',
    '/css/pages/cenik.css',
    '/css/pages/rocni-horoskop.css',
    '/css/pages/osobni-mapa.css',
    '/js/dist/analytics-init.js',
    '/js/dist/analytics.js',
    '/js/dist/core.js',
    '/js/dist/main.js',
    '/js/dist/components.js',
    '/js/dist/api-config.js',
    '/js/dist/favorites-helper.js',
    '/js/dist/localized-natal-chart.js',
    '/js/dist/templates.js',
    '/js/dist/auth-client.js',
    '/js/dist/cenik.js',
    '/js/dist/cookie-handler.js',
    '/js/dist/crystal-ball.js',
    '/js/dist/daily-card.js',
    '/js/dist/angel-cards.js',
    '/js/dist/horoscope-share.js',
    '/js/dist/share-image-canvas.js',
    '/js/dist/tarot-ano-ne.js',
    '/js/dist/tarot-ano-nie-sk.js',
    '/js/dist/tarot-karta-dne.js',
    '/js/dist/index-lazy-load.js',
    '/js/gemini-service.js',
    '/js/dist/mobile-nav.js',
    '/js/dist/page-extras.js',
    '/js/dist/premium-gates.js',
    '/js/dist/retention.js',
    '/js/dist/prihlaseni.js',
    '/js/dist/profile/dashboard.js',
    '/js/dist/rocni-horoskop.js',
    '/js/dist/osobni-mapa.js',
    '/img/logo-3d.webp',
    '/img/atlas/01-lucerna-na-rozcesti.webp',
    '/img/atlas/tools-v1/02-mesicni-krajina.webp',
    '/img/atlas/angels-v1/back.webp',
    '/img/atlas/angels-v1/abundance.webp',
    '/img/atlas/angels-v1/guidance.webp',
    '/img/atlas/angels-v1/healing.webp',
    '/img/atlas/angels-v1/love.webp',
    '/img/atlas/angels-v1/nature.webp',
    '/img/atlas/angels-v1/peace.webp',
    '/img/atlas/angels-v1/purpose.webp',
    '/img/atlas/angels-v1/strength.webp',
    '/img/icon-192.webp',
    '/img/icon-192.png',
    '/img/personal-map/personal-map-soft-v3.webp',
    '/img/personal-map/preview-cover.webp',
    '/img/personal-map/preview-signature.webp',
    '/img/personal-map/preview-mantra.webp',
    '/img/personal-map/preview-actions.webp',
    '/img/personal-map/preview-contact-sheet.webp',
    '/data/tarot-cards.json?v=20261007-deck-v2',
    '/data/runes.json',
    '/js/dist/runes.js',
    '/js/dist/platby-init.js',
    '/js/dist/analytics-page-init.js',
    '/manifest.json',
    '/offline.html'
];

function isHtmlNavigation(request) {
    const accept = request.headers.get('accept') || '';
    const pathname = new URL(request.url).pathname;
    return request.mode === 'navigate' || accept.includes('text/html') || pathname.endsWith('.html');
}

function isCacheableResponse(response) {
    if (!response || response.status !== 200 || response.type !== 'basic') {
        return false;
    }

    const cacheControl = response.headers.get('cache-control') || '';
    return !/\b(?:no-store|private)\b/i.test(cacheControl);
}

function getPrecachedAssetKey(request) {
    const pathname = new URL(request.url).pathname;
    return STATIC_ASSETS.includes(pathname) ? pathname : null;
}

async function precacheVersionedOfflineAssets(cache, offlineResponse) {
    if (!offlineResponse) return;

    const html = await offlineResponse.clone().text();
    const references = [...html.matchAll(/\b(?:src|href)\s*=\s*(["'])([^"']+\.mh-[a-f0-9]{16}\.(?:js|css)(?:\?[^"']*)?)\1/gi)];
    const assets = new Map();

    for (const [, , value] of references) {
        const url = new URL(value.replace(/&amp;/g, '&'), self.location.origin);
        if (url.origin !== self.location.origin) continue;

        const match = url.pathname.match(/^(.*)\.mh-[a-f0-9]{16}\.(js|css)$/i);
        if (!match) continue;

        const sourceAsset = `${match[1]}.${match[2]}`;
        if (STATIC_ASSETS.includes(sourceAsset)) assets.set(url.href, sourceAsset);
    }

    await Promise.all([...assets.entries()].map(async ([versionedUrl, sourceAsset]) => {
        const request = new Request(versionedUrl, { cache: 'reload' });
        const response = await fetch(request);
        if (!isCacheableResponse(response)) {
            throw new Error(`Precache failed for versioned offline dependency ${sourceAsset}: ${response.status}`);
        }
        await cache.put(versionedUrl, response);
    }));
}

async function matchCachedRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    const exactMatch = await cache.match(request);
    if (exactMatch) return exactMatch;

    // Match only this release; never borrow entries from an older cache.
    // A query version is not interchangeable with an unversioned precache entry.
    const precachedKey = new URL(request.url).search ? null : getPrecachedAssetKey(request);
    return precachedKey ? cache.match(precachedKey) : null;
}

async function precacheFreshAssets(cache) {
    await Promise.all(STATIC_ASSETS.map(async (asset) => {
        const request = new Request(new URL(asset, self.location.origin), { cache: 'reload' });
        const response = await fetch(request);
        if (!isCacheableResponse(response)) {
            throw new Error(`Precache failed for ${asset}: ${response.status}`);
        }
        await cache.put(asset, response);
    }));

    // Production HTML rewrites CSS/JS references to immutable content hashes.
    // Cache those exact URLs too, so the offline shell can load its own styles/scripts.
    await precacheVersionedOfflineAssets(cache, await cache.match('/offline.html'));
}

// Install - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return precacheFreshAssets(cache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name.startsWith('mysticka-hvezda-') && name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Trim cache to max size
async function trimCache(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        // Delete oldest entries (first in, first out)
        const toDelete = keys.slice(0, keys.length - maxItems);
        await Promise.all(toDelete.map(key => cache.delete(key)));
    }
}

// Fetch - stale-while-revalidate for cached content
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests, API calls, and external domains (analytics, GTM, Stripe...)
    if (
        event.request.method !== 'GET' ||
        event.request.url.includes('/api/') ||
        new URL(event.request.url).origin !== self.location.origin
    ) {
        return;
    }

    if (isHtmlNavigation(event.request)) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('/offline.html'))
        );
        return;
    }

    event.respondWith(
        matchCachedRequest(event.request)
            .then((cachedResponse) => {
                // Start network fetch regardless (for revalidation)
                const pathname = new URL(event.request.url).pathname;
                // Editorial index must agree with the freshly rendered article art.
                const shouldRevalidateStaticCode = /\.(?:css|js)$/i.test(pathname) || pathname === '/data/blog-index.json' || pathname === '/data/tarot-cards.json';
                const networkFetch = fetch(event.request, shouldRevalidateStaticCode ? { cache: 'no-cache' } : undefined)
                    .then((response) => {
                        // Don't cache non-successful, non-basic or explicitly private responses
                        if (!isCacheableResponse(response)) {
                            return response;
                        }

                        // Update cache in background
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                                trimCache(CACHE_NAME, MAX_RUNTIME_CACHE_SIZE);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Network failed - serve offline fallback for HTML
                        if (!cachedResponse) {
                            const accept = event.request.headers.get('accept');
                            if (accept && accept.includes('text/html')) {
                                return caches.match('/offline.html');
                            }
                        }
                        return cachedResponse;
                    });

                // Return cached version immediately if available (stale-while-revalidate)
                // Otherwise wait for network
                return shouldRevalidateStaticCode ? networkFetch : (cachedResponse || networkFetch);
            })
    );
});

// Push notification handler
self.addEventListener('push', (event) => {
    let data = { title: 'Mystická Hvězda 🌙', body: 'Vaše hvězdná energie na dnešek čeká.', url: '/', icon: '/img/icon-192.webp' };
    
    if (event.data) {
        try { data = { ...data, ...event.data.json() }; } catch {}
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: data.icon,
            tag: 'daily-horoscope',
            renotify: true,
            data: { url: data.url }
        })
    );
});

// Notification click → open the app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(event.notification.data?.url || '/');
                    return client.focus();
                }
            }
            return clients.openWindow(event.notification.data?.url || '/');
        })
    );
});
