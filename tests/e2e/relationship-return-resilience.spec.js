import { test, expect } from '@playwright/test';

test('a stalled payment status can be retried without a new payment', async ({ page }) => {
    await page.clock.install();
    await page.addInitScript(() => {
        const original = window.fetch.bind(window);
        window.__stallStatus = true;
        window.__checkoutStarts = 0;
        window.fetch = (input, options = {}) => {
            const url = String(input);
            if (url.includes('/api/vztahovy-vyklad/checkout?') || url.endsWith('/api/vztahovy-vyklad/checkout')) window.__checkoutStarts++;
            if (url.includes('/api/vztahovy-vyklad/checkout-result')) {
                if (window.__stallStatus) return new Promise((_resolve, reject) => {
                    options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
                });
                return Promise.resolve(new Response(JSON.stringify({ status: 'paid', deliveryState: 'delivered', orderRef: 'order-test' }), {
                    status: 200, headers: { 'Content-Type': 'application/json' }
                }));
            }
            return original(input, options);
        };
    });
    await page.route('**/api/vztahovy-vyklad/product', route => route.fulfill({ json: { enabled: true, amount: 14900, currency: 'czk' } }));
    await page.goto('/vztahovy-vyklad.html?status=success&session_id=cs_test_stalled');
    await expect(page.locator('#retry-payment')).toBeDisabled();
    await page.clock.fastForward(30000);
    await expect(page.locator('#retry-payment')).toBeEnabled();
    await expect(page.locator('#payment-message')).toContainText('nemůžeme ověřit');
    await expect(page.locator('#payment-message')).toContainText('neplať podruhé');
    await page.evaluate(() => { window.__stallStatus = false; });
    await page.locator('#retry-payment').click();
    await expect(page.locator('#payment-message')).toContainText('Platba je potvrzená');
    expect(await page.evaluate(() => window.__checkoutStarts)).toBe(0);
});
