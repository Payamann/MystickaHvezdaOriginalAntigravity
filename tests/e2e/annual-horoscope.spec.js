import { test, expect } from '@playwright/test';
import { waitForPageReady, MOBILE_VIEWPORT } from './helpers.js';

test.describe('Roční horoskop — jednorázový checkout', () => {
    test('objednávkový formulář ukazuje hodnotu a jistotu platby', async ({ page }) => {
        await page.goto('/rocni-horoskop.html?source=pricing_addon');
        await waitForPageReady(page);

        await expect(page.locator('.order-summary')).toBeVisible();
        await expect(page.locator('.order-summary')).toContainText('199 Kč jednorázově');
        await expect(page.locator('.order-summary')).toContainText('PDF do e-mailu');
        await expect(page.locator('.form-note')).toContainText('žádné opakované strhávání');
    });

    test('mobilni CTA skok nezakryje formular fixni navigaci', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/rocni-horoskop.html?source=pricing_addon');
        await waitForPageReady(page);

        await page.locator('[data-scroll-target="form"]').click();
        await expect.poll(() => page.evaluate(() =>
            Math.round(document.getElementById('form')?.getBoundingClientRect().top || 9999)
        )).toBeLessThanOrEqual(150);

        const metrics = await page.evaluate(() => {
            const nav = document.querySelector('.site-nav')?.getBoundingClientRect();
            const form = document.getElementById('form')?.getBoundingClientRect();
            return {
                navBottom: nav?.bottom || 0,
                formTop: form?.top || 0,
                overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
            };
        });

        expect(metrics.formTop).toBeGreaterThan(metrics.navBottom + 12);
        expect(metrics.overflow).toBe(false);
    });

    test('odeslání formuláře posílá zdroj do one-time checkoutu', async ({ page }) => {
        let checkoutPayload = null;

        await page.route('**/api/rocni-horoskop/checkout', async (route) => {
            checkoutPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    url: '/rocni-horoskop.html?status=success&source=pricing_addon&session_id=cs_test_annual'
                })
            });
        });

        await page.goto('/rocni-horoskop.html?source=pricing_addon');
        await waitForPageReady(page);

        await page.locator('#name').fill('Jana');
        await page.locator('#birthDate').fill('1990-01-01');
        await page.locator('#sign').selectOption('beran');
        await page.locator('#email').fill('jana@example.cz');

        await Promise.all([
            page.waitForURL(/status=success/),
            page.locator('#submitBtn').click(),
        ]);

        expect(checkoutPayload).toEqual(expect.objectContaining({
            name: 'Jana',
            birthDate: '1990-01-01',
            sign: 'beran',
            email: 'jana@example.cz',
            source: 'pricing_addon'
        }));
    });

    test('úspěšný nákup nabízí přechod na Premium s konkrétním plánem', async ({ page }) => {
        await page.goto('/rocni-horoskop.html?status=success&source=pricing_addon&session_id=cs_test_annual');
        await waitForPageReady(page);

        await expect(page.locator('#bannerSuccess')).toBeVisible();
        const upgradeHref = await page.locator('[data-annual-upgrade]').getAttribute('href');
        expect(upgradeHref).toContain('plan=pruvodce');
        expect(upgradeHref).toContain('source=annual_horoscope_success');
        expect(upgradeHref).toContain('feature=daily_guidance');
    });
});
