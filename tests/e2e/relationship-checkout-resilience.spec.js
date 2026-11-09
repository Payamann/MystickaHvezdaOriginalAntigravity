import { test, expect } from '@playwright/test';

for (const stalledStep of ['csrf-token', 'checkout', 'checkout-body']) {
    test(`relationship checkout recovers when ${stalledStep} stalls`, async ({ page }) => {
        await page.clock.install();
        await page.addInitScript(step => {
            localStorage.setItem('mh_cookie_prefs', JSON.stringify({ analytics: false, marketing: false }));
            const original = window.fetch.bind(window);
            window.__relationshipRequests = [];
            window.__stallRelationshipRequest = true;
            window.fetch = (input, options = {}) => {
                const url = String(input);
                if (url.includes('/api/vztahovy-vyklad/checkout')) {
                    window.__relationshipRequests.push(JSON.parse(options.body));
                }
                if (window.__stallRelationshipRequest && step === 'checkout-body' && url.includes('/api/vztahovy-vyklad/checkout')) {
                    return Promise.resolve({ ok: true, json: () => new Promise((_resolve, reject) => {
                        options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
                    }) });
                }
                if (window.__stallRelationshipRequest && url.includes(`/api/${step === 'checkout' ? 'vztahovy-vyklad/checkout' : step}`)) {
                    return new Promise((_resolve, reject) => {
                        options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
                    });
                }
                if (url.includes('/api/vztahovy-vyklad/checkout')) {
                    return Promise.resolve(new Response(JSON.stringify({ error: 'Testovací odpověď.' }), {
                        status: 502, headers: { 'Content-Type': 'application/json' }
                    }));
                }
                return original(input, options);
            };
        }, stalledStep);
        await page.route('**/api/csrf-token', route => route.fulfill({ json: { csrfToken: 'test-token' } }));
        await page.route('**/api/vztahovy-vyklad/product', route => route.fulfill({ json: { enabled: true, amount: 14900, currency: 'czk' } }));
        await page.goto('/vztahovy-vyklad.html');
        await page.locator('#question').fill('Ve vztahu se opakují stejné hádky. Jak začít rozhovor?');
        await page.locator('#email').fill('test@example.com');
        await page.locator('#consent').check();
        await page.locator('#checkout-button').click();
        await expect(page.locator('#checkout-button')).toBeDisabled();
        if (stalledStep !== 'csrf-token') await expect.poll(() => page.evaluate(() => window.__relationshipRequests.length)).toBe(1);
        await page.clock.fastForward(30000);
        await expect(page.locator('#checkout-button')).toBeEnabled();
        await expect(page.locator('#form-error')).toContainText('příliš dlouho');
        await expect(page.locator('#question')).toHaveValue('Ve vztahu se opakují stejné hádky. Jak začít rozhovor?');

        await page.evaluate(() => { window.__stallRelationshipRequest = false; });
        await page.locator('#checkout-button').click();
        await expect(page.locator('#form-error')).toHaveText('Testovací odpověď.');
        const attempts = await page.evaluate(() => window.__relationshipRequests);
        expect(attempts).toHaveLength(stalledStep === 'csrf-token' ? 1 : 2);
        if (stalledStep !== 'csrf-token') expect(attempts[1]).toEqual(attempts[0]);
    });
}

test('relationship checkout continues when the server responds normally', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('mh_cookie_prefs', JSON.stringify({ analytics: false, marketing: false }));
    });
    await page.route('**/api/csrf-token', route => route.fulfill({ json: { csrfToken: 'test-token' } }));
    await page.route('**/api/vztahovy-vyklad/product', route => route.fulfill({ json: { enabled: true, amount: 14900, currency: 'czk' } }));
    await page.route('**/api/vztahovy-vyklad/checkout', route => route.fulfill({ json: { url: 'https://checkout.stripe.com/c/pay/mock' } }));
    await page.route('https://checkout.stripe.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Mock checkout</p>' }));
    await page.goto('/vztahovy-vyklad.html');
    await page.locator('#question').fill('Ve vztahu se opakují stejné hádky. Jak začít rozhovor?');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#consent').check();
    await page.locator('#checkout-button').click();
    await expect(page).toHaveURL('https://checkout.stripe.com/c/pay/mock');
    await expect(page.locator('p')).toHaveText('Mock checkout');
});
