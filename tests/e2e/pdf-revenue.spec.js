import { test, expect } from '@playwright/test';

for (const paid of [true, false]) {
    test(`PDF return requires verified payment: ${paid}`, async ({ page }, testInfo) => {
        await page.route('**/api/osobni-mapa/checkout-result?*', route => route.fulfill({
            status: paid ? 200 : 403, contentType: 'application/json', body: JSON.stringify({ success: paid, result: {
                status: 'paid', product_id: 'osobni_mapa_2026', transaction_id: 'pi_verified', value: 249, currency: 'CZK'
            } })
        }));
        await page.addInitScript(() => {
            window.__purchases = [];
            Object.defineProperty(window, 'MH_ANALYTICS', { writable: false, value: {
                trackEvent() {}, trackPurchaseCompleted: (...args) => window.__purchases.push(args)
            } });
        });
        await page.goto('/osobni-mapa.html?status=success&session_id=cs_test_pdf');
        if (paid) {
            await expect(page.locator('#bannerSuccess')).toBeVisible();
            const purchases = await page.evaluate(() => window.__purchases);
            expect(purchases).toHaveLength(1);
            expect(purchases[0]).toEqual(['osobni_mapa_2026', 249, 'CZK', expect.objectContaining({ verified: true, transaction_id: 'pi_verified' })]);
        } else {
            await expect(page.locator('#pdf-verification-retry')).toBeVisible();
            await expect(page.locator('#bannerSuccess')).not.toBeVisible();
            expect(await page.evaluate(() => window.__purchases)).toHaveLength(0);
        }
        await page.screenshot({ path: `.codex-tmp/pdf-return-${paid}-${testInfo.project.name}.png` });
    });
}
