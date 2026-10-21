import http from 'node:http';
import fs from 'node:fs';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

Object.assign(process.env, { NODE_ENV: 'test', MOCK_SUPABASE: 'true', MOCK_AI: 'true', DISABLE_SCHEDULED_JOBS: 'true',
    STRIPE_SECRET_KEY: 'test-cache-migration', JWT_SECRET: 'test-cache-migration', RESEND_API_KEY: 'test-cache-migration' });
const { default: app } = await import('../server/index.js');
const currentWorker = fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
assert.match(currentWorker, /'\/img\/atlas\/western-zodiac-v1-grid\.webp'/, 'Current sprite should be present in the precache manifest');
assert.doesNotMatch(currentWorker, /'\/img\/atlas\/western-zodiac-v1\.webp'/, 'Unused large sprite should no longer be precached');
assert.match(currentWorker, /'\/img\/atlas\/tools-v1\/02-mesicni-krajina-480\.webp'/, 'Mobile horoscope art should be available offline');
assert.match(currentWorker, /'\/img\/atlas\/tools-v1\/02-mesicni-krajina-800\.webp'/, 'High-density horoscope art should be available offline');
assert.match(currentWorker, /'\/img\/atlas\/western-zodiac-v1-grid-mobile-192\.webp'/, 'Small mobile zodiac sprite should be available offline');
const legacyWorker = `
self.addEventListener('install', event => event.waitUntil((async () => {
 const cache = await caches.open('mysticka-hvezda-legacy-test');
 for (const path of ['/js/dist/core.js?v=20261021-footer-support-locale '/js/dist/auth-client.js?v=20261020-02-register-password-policy await cache.put(path, new Response('window.__staleAsset = true;', {headers: {'Content-Type':'application/javascript'}}));
 const oldZodiacImage = await fetch('/img/atlas/western-zodiac-v1.webp');
 if (!oldZodiacImage.ok) throw new Error('Legacy zodiac image could not be cached');
 await cache.put('/img/atlas/western-zodiac-v1.webp', oldZodiacImage);
 await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => { if(event.request.method === 'GET') event.respondWith((async () => {
 return await caches.match(new URL(event.request.url).pathname) || fetch(event.request);
})()); });`;
let upgraded = false;
const server = http.createServer((req, res) => {
    if (req.url.split('?')[0] === '/service-worker.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-store' });
        res.end(upgraded ? currentWorker : legacyWorker);
    } else app(req, res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
try {
    const context = await browser.newContext({ serviceWorkers: 'allow' });
    context.on('serviceworker', (worker) => {
        console.log(`[SW target] ${worker.url()}`);
        worker.on('console', (message) => console.log(`[SW console] ${message.text()}`));
    });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const page = await context.newPage();
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
        await navigator.serviceWorker.register('/service-worker.js');
        await navigator.serviceWorker.ready;
        await caches.open('unrelated-application');
    });
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => Boolean(window.__staleAsset)), false, 'Legacy worker served stale code for a hashed URL');
    assert.ok(await page.evaluate(async () => (await caches.keys()).includes('mysticka-hvezda-legacy-test')));
    await page.goto(`${origin}/horoskopy.html`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
        const image = new Image();
        image.id = 'legacy-open-tab-zodiac';
        image.src = '/img/atlas/western-zodiac-v1.webp';
        await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; });
        document.body.append(image);
    });
    assert.equal(await page.locator('#legacy-open-tab-zodiac').evaluate((image) => image.naturalWidth > 0), true);
    upgraded = true;
    await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration.update();
    });
    await page.waitForFunction(async () => !(await caches.keys()).includes('mysticka-hvezda-legacy-test'), { timeout: 30000 });
    assert.ok(await page.evaluate(async () => (await caches.keys()).includes('unrelated-application')));
    assert.equal(await page.locator('#legacy-open-tab-zodiac').evaluate((image) => image.complete && image.naturalWidth > 0), true, 'Already-open legacy page should keep its loaded zodiac art');
    const oldAssetRequest = await page.evaluate(async () => {
        const response = await fetch(`/img/atlas/western-zodiac-v1.webp?open-tab-check=${Date.now()}`, { cache: 'no-store' });
        return { status: response.status, bytes: (await response.arrayBuffer()).byteLength };
    });
    assert.equal(oldAssetRequest.status, 200, 'Legacy image URL should remain available to an open tab after cache upgrade');
    assert.ok(oldAssetRequest.bytes > 0);
    await page.goto(`${origin}/cenik.html`, { waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => Boolean(window.__staleAsset)), false);
    assert.ok(await page.locator('script[src*=".mh-"]').count());
    console.log('[cache-migration] PASS open legacy page survives upgrade, old art fetches online, optimized sprite is in manifest, unrelated cache preserved');
} finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
}
