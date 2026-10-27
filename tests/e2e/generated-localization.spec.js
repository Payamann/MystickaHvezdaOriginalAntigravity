import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const variants = [
    ['sk', '/sk/ako-to-funguje.html', 'Ako to funguje', '/sk/horoskopy.html'],
    ['pl', '/pl/jak-to-dziala.html', 'Jak to działa', '/pl/horoskopy.html'],
    ['en', '/en/how-it-works.html', 'How it works', '/en/horoscopes.html']
];

for (const [locale, route, heading, horoscope] of variants) {
    test(`${locale} generated page preserves SEO and its localized next step`, async ({ page }) => {
        const response = await page.goto(route);
        expect(response.status()).toBe(200);
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('main h1')).toContainText(heading);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://www.mystickahvezda.cz${route}`);
        await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(5);
        await expect(page.locator(`footer a[href="${route}"]:not([lang])`)).toHaveAttribute('href', route);
        const cta = page.locator('main a.btn').first();
        await expect(cta).toHaveAttribute('href', `${horoscope}?source=how_it_works_cta&feature=daily_guidance`);
        await expect(cta.locator('.destination-language')).toHaveCount(0);
        await cta.click();
        await expect.poll(() => new URL(page.url()).pathname).toBe(horoscope);
    });
}

test('generated routes are available from Czech and fit English desktop/mobile', async ({ page }) => {
    await page.goto('/jak-to-funguje.html');
    await page.locator('[data-language-select]').selectOption('en');
    await expect(page).toHaveURL(/\/en\/how-it-works\.html$/);
    const directory = new URL('../../../../docs/translation-system-2026-10-26/', import.meta.url);
    await fs.mkdir(directory, { recursive: true });
    await expect(page.locator('header.header')).toBeVisible();
    await page.screenshot({ path: fileURLToPath(new URL('en-how-it-works-desktop.png', directory)) });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
    await page.screenshot({ path: fileURLToPath(new URL('en-how-it-works-mobile.png', directory)) });
});
