import { test, expect } from '@playwright/test';

async function fillMapForm(page) {
    await page.locator('#name').fill('Jana Testovací');
    await page.locator('#email').fill('jana@example.com');
    await page.locator('#birthDate').fill('1990-03-01');
    await page.locator('#focusArea').selectOption('relationships');
    await page.locator('#focus').fill('Jak mohu otevřeně mluvit o svých potřebách ve vztahu?');
}

for (const stalledStep of ['csrf-token', 'checkout', 'checkout-body']) {
    test(`personal map checkout recovers when ${stalledStep} stalls`, async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('mh_cookie_prefs', JSON.stringify({ analytics: false, marketing: false }));
        });
        await page.route('**/api/csrf-token', route => route.fulfill({ json: { csrfToken: 'test-token' } }));
        await page.goto('/osobni-mapa.html');
        await fillMapForm(page);
        await page.clock.install();
        await page.evaluate(step => {
            const original = window.fetch.bind(window);
            window.__mapRequests = [];
            window.__stallMapRequest = true;
            window.fetch = (input, options = {}) => {
                const url = String(input);
                if (url.includes('/api/osobni-mapa/checkout')) {
                    window.__mapRequests.push(JSON.parse(options.body));
                }
                if (window.__stallMapRequest && step === 'checkout-body' && url.includes('/api/osobni-mapa/checkout')) {
                    return Promise.resolve({ ok: true, json: () => new Promise((_resolve, reject) => {
                        options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
                    }) });
                }
                if (window.__stallMapRequest && url.includes(`/api/${step === 'checkout' ? 'osobni-mapa/checkout' : step}`)) {
                    return new Promise((_resolve, reject) => {
                        options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
                    });
                }
                if (url.includes('/api/osobni-mapa/checkout')) {
                    return Promise.resolve(new Response(JSON.stringify({ error: 'Testovací odpověď.' }), {
                        status: 502, headers: { 'Content-Type': 'application/json' }
                    }));
                }
                return original(input, options);
            };
        }, stalledStep);

        await page.locator('#submitBtn').click();
        await expect(page.locator('#submitBtn')).toBeDisabled();
        if (stalledStep !== 'csrf-token') await expect.poll(() => page.evaluate(() => window.__mapRequests.length)).toBe(1);
        await page.clock.fastForward(30000);
        await expect(page.locator('#submitBtn')).toBeEnabled();
        await expect(page.locator('#formError')).toBeVisible();
        await expect(page.locator('#formError')).toContainText('příliš dlouho');
        await expect(page.locator('#focus')).toHaveValue('Jak mohu otevřeně mluvit o svých potřebách ve vztahu?');

        await page.evaluate(() => { window.__stallMapRequest = false; });
        await page.locator('#submitBtn').click();
        await expect(page.locator('#formError')).toContainText('Testovací odpověď.');
        const attempts = await page.evaluate(() => window.__mapRequests);
        expect(attempts).toHaveLength(stalledStep === 'csrf-token' ? 1 : 2);
        if (stalledStep !== 'csrf-token') expect(attempts[1]).toEqual(attempts[0]);
    });
}

test('personal map checkout continues when the server responds normally', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('mh_cookie_prefs', JSON.stringify({ analytics: false, marketing: false }));
    });
    await page.route('**/api/csrf-token', route => route.fulfill({ json: { csrfToken: 'test-token' } }));
    await page.route('**/api/osobni-mapa/checkout', route => route.fulfill({ json: { url: '/cenik.html?source=mock_checkout' } }));
    await page.goto('/osobni-mapa.html');
    await fillMapForm(page);
    await page.locator('#submitBtn').click();
    await expect(page).toHaveURL(/\/cenik\.html\?source=mock_checkout/);
});
