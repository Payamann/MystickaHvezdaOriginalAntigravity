/**
 * Mystická Hvězda - Service Worker
 * Provides offline caching with stale-while-revalidate strategy
 */

const CACHE_NAME = 'mysticka-hvezda-v9';
const MAX_RUNTIME_CACHE_SIZE = 100;
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/style.v2.css',
    '/css/premium.css',
    '/js/main.js',
    '/js/components.js',
    '/js/api-config.js',
    '/js/templates.js',
    '/js/auth-client.js',
    '/js/utils/error-handler.js',
    '/js/services/api.js',
    '/js/premium-gates.js',
    '/img/logo-3d.webp',
    '/img/hero-3d.webp',
    '/manifest.json'
];

// Image cache with longer TTL
const IMAGE_CACHE = 'mysticka-images-v1';
const MAX_IMAGE_CACHE_SIZE = 60;

// Install - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
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
                const validCaches = [CACHE_NAME, IMAGE_CACHE];
                return Promise.all(
                    cacheNames
                        .filter((name) => !validCaches.includes(name))
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

// Check if request is for an image
function isImageRequest(request) {
    const url = new URL(request.url);
    return url.pathname.match(/\.(webp|png|jpg|jpeg|gif|svg|ico)$/i);
}

// Fetch - stale-while-revalidate for cached content
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and API calls
    if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
        return;
    }

    // Image requests: cache-first with dedicated image cache
    if (isImageRequest(event.request)) {
        event.respondWith(
            caches.open(IMAGE_CACHE).then((cache) =>
                cache.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    return fetch(event.request).then((response) => {
                        if (response && response.status === 200) {
                            cache.put(event.request, response.clone());
                            trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE);
                        }
                        return response;
                    });
                })
            )
        );
        return;
    }

    // All other requests: stale-while-revalidate
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Start network fetch regardless (for revalidation)
                const networkFetch = fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful or non-basic responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
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
                return cachedResponse || networkFetch;
            })
    );
});
