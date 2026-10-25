import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mh_cookie_prefs', JSON.stringify({ analytics: false, marketing: false, ts: Date.now() })));
});

test('free synastry keeps a real result and a single membership action without invented personal text', async ({ page }, testInfo) => {
    await page.goto('/partnerska-shoda.html');
    await page.locator('#p1-name').fill('Model A');
    await page.locator('#p1-date').fill('1990-05-14');
    await page.locator('#p2-name').fill('Model B');
    await page.locator('#p2-date').fill('1992-02-08');
    await page.locator('#synastry-form button[type="submit"]').click();
    await expect(page.locator('#synastry-results')).toBeVisible();
    await expect(page.locator('#total-score')).toContainText('%');
    await expect(page.locator('#ai-synastry')).not.toContainText('nepotkali náhodou');
    await expect(page.locator('#astro-note')).not.toContainText('kvadraturu Saturnu');
    await expect(page.locator('.premium-lock-overlay .synastry-upgrade-btn')).toHaveCount(1);
    await expect(page.locator('#ai-synastry .synastry-upgrade-btn')).toHaveCount(0);
    await page.locator('.premium-lock-overlay').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('membership-offer.png') });
    await page.locator('.premium-lock-overlay .synastry-upgrade-btn').click();
    await expect(page).toHaveURL(/prihlaseni.html/);
    const target = new URL(page.url());
    expect(target.searchParams.get('feature')).toBe('partnerska_detail');
    expect(target.searchParams.get('entry_source')).toBe('synastry_detail_lock');
    expect(target.searchParams.get('plan')).toBe('pruvodce');
    expect(target.href).not.toMatch(/1990|1992|Model/);
});

test('natal computed values and chart remain inside a narrow mobile viewport', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/natalni-karta.html');
    await page.locator('#name').fill('Model');
    await page.locator('#birth-date').fill('1990-05-14');
    await page.locator('#birth-time').fill('12:00');
    await page.locator('#birth-place').fill('Praha');
    await page.locator('#natal-form button[type="submit"]').click();
    await expect(page.locator('#chart-results')).toBeVisible();
    for (const selector of ['#chart-results', '#res-sun', '#res-moon', '#res-asc', '.natal-chart-container']) {
        const bounds = await page.locator(selector).evaluate(el => {
            const r = el.getBoundingClientRect();
            return { left: r.left, right: r.right, width: innerWidth };
        });
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(bounds.width + 1);
    }
    await page.locator('#chart-results').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('natal-mobile.png') });
});
