import { test, expect } from '@playwright/test';
import { waitForPageReady, ZODIAC_SIGNS } from './helpers.js';

test('datovaný horoskop drží změnu znamení sbalenou a zachová stejné datum', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    const response = await page.goto('/horoskop/beran/2026-10-01');
    expect(response?.status()).toBe(200);
    await waitForPageReady(page);

    const picker = page.locator('.horoscope-day-sign-picker');
    await expect(picker.locator('summary')).toHaveText('Změnit znamení');
    await expect(picker).not.toHaveAttribute('open', '');

    const signLinks = picker.locator('a.zodiac-card');
    await expect(signLinks).toHaveCount(11);
    const hrefs = await signLinks.evaluateAll(links => links.map(link => link.getAttribute('href')));
    expect(hrefs).toContain('/horoskop/blizenci/2026-10-01');
    expect(hrefs).not.toContain('/horoskop/beran/2026-10-01');
    expect(hrefs.every(href => /^\/horoskop\/[a-z-]+\/2026-10-01$/.test(href))).toBe(true);

    await expect(page.locator('.horoscope-day-nav__link').filter({ hasText: 'Předchozí den' }))
        .toHaveAttribute('href', '/horoskop/beran/2026-09-30');
    await expect(page.locator('.horoscope-day-nav__link').filter({ hasText: 'Následující den' }))
        .toHaveAttribute('href', '/horoskop/beran/2026-10-02');

    await picker.locator('summary').click();
    await expect(picker).toHaveAttribute('open', '');
    await expect(signLinks.first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(pageErrors).toEqual([]);
});

test('všech 12 datovaných horoskopů používá atlasový hero bez staré mlhoviny', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    for (const sign of ZODIAC_SIGNS) {
        const response = await page.goto(`/horoskop/${sign.slug}/2026-10-01`);
        expect(response?.status(), sign.slug).toBe(200);
        await waitForPageReady(page);

        await expect(page.locator('body'), sign.slug).toHaveClass(/atlas-astro-page/);
        await expect(page.locator('.horoscope-day-hero.atlas-art-hero.atlas-art-astrolab'), sign.slug).toHaveCount(1);
        await expect(page.locator('.horoscope-day-breadcrumb'), sign.slug).toContainText(sign.cs);
        await expect(page.locator('.stars'), sign.slug).toHaveCount(0);
        await expect(page.locator('.horoscope-day-sign-picker a.zodiac-card'), sign.slug).toHaveCount(11);
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), sign.slug).toBe(true);
    }

    expect(pageErrors).toEqual([]);
});
