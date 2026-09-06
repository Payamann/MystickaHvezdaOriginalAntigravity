import http from 'node:http';
import fs from 'node:fs';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

Object.assign(process.env, { NODE_ENV: 'test', MOCK_SUPABASE: 'true', MOCK_AI: 'true', DISABLE_SCHEDULED_JOBS: 'true',
    STRIPE_SECRET_KEY: 'test-cache-migration', JWT_SECRET: 'test-cache-migration', RESEND_API_KEY: 'test-cache-migration' });
const { default: app } = await import('../server/index.js');
const currentWorker = fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');
const legacyWorker = `
self.addEventListener('install', event => event.waitUntil((async () => {
 const cache = await caches.open('mysticka-hvezda-legacy-test');
 for (const path of ['/js/dist/core.js', '/js/dist/auth-client.js']) await cache.put(path, new Response('window.__staleAsset = true;', {headers: {'Content-Type':'application/javascript'}}));
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
    upgraded = true;
    await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration.update();
    });
    await page.waitForFunction(async () => !(await caches.keys()).includes('mysticka-hvezda-legacy-test'), { timeout: 30000 });
    assert.ok(await page.evaluate(async () => (await caches.keys()).includes('unrelated-application')));
    await page.goto(`${origin}/cenik.html`, { waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => Boolean(window.__staleAsset)), false);
    assert.ok(await page.locator('script[src*=".mh-"]').count());
    console.log('[cache-migration] PASS legacy worker → new content URLs → new worker, unrelated cache preserved');
} finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
}
