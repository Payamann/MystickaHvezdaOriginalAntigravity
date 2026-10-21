import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

test.describe('Vyřazený Roční horoskop — bezpečné přesměrování', () => {
    test('nové návštěvy pokračují na nadčasovou Osobní mapu', async ({ page }) => {
        await page.goto('/rocni-horoskop.html?source=old_bookmark');
        await waitForPageReady(page);

        await expect(page).toHaveURL(/\/osobni-mapa\.html\?source=annual_horoscope_retired$/);
        await expect(page.locator('h1')).toContainText('Osobní mapa');
        await expect(page.locator('body')).toContainText('12 měsíců');
    });

    test('zrušený starý checkout už nenabízí vyřazený produkt', async ({ page }) => {
        await page.goto('/rocni-horoskop.html?status=cancel&source=pricing_addon');
        await waitForPageReady(page);

        await expect(page).toHaveURL(/\/osobni-mapa\.html\?source=annual_horoscope_retired$/);
        await expect(page.locator('#annualOrderForm')).toHaveCount(0);
    });

    test('potvrzení již zaplacené historické objednávky zůstává dostupné', async ({ page }) => {
        await page.route('**/api/rocni-horoskop/checkout-result**', (route) => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                result: {
                    status: 'paid',
                    product_id: 'rocni_horoskop_2026',
                    transaction_id: 'pi_test_annual',
                    value: 199,
                    currency: 'CZK'
                }
            })
        }));
        await page.goto('/rocni-horoskop.html?status=success&source=pricing_addon&session_id=cs_test_annual');
        await waitForPageReady(page);

        await expect(page).toHaveURL(/\/rocni-horoskop\.html\?status=success/);
        await expect(page.locator('#bannerSuccess')).toBeVisible();
        await expect(page.locator('#bannerVerification')).toBeHidden();
        await expect(page.locator('[data-annual-upgrade]')).toContainText('Průvodce');
        for (const selector of ['.hero', '.trust-strip', '.annual-product-bridge', '.sections-row', '.sample-section', '#form', '.faq-section']) {
            await expect(page.locator(selector)).toBeHidden();
        }
    });

    test('parametr success bez potvrzení Stripe nezobrazuje falešné potvrzení', async ({ page }) => {
        await page.route('**/api/rocni-horoskop/checkout-result**', (route) => route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, error: 'Platbu se nepodařilo ověřit.' })
        }));
        await page.goto('/rocni-horoskop.html?status=success&session_id=cs_test_unpaid');
        await waitForPageReady(page);

        await expect(page.locator('#bannerSuccess')).toBeHidden();
        await expect(page.locator('#bannerVerification')).toBeVisible();
        await expect(page.locator('#retryVerification')).toBeVisible();
    });
});
