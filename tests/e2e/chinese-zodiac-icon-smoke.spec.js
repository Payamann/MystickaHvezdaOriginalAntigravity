import { test, expect } from '@playwright/test';

test('čínské zvíře má jednotný atlasový portrét, čistý přístupný název a SVG akci', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('/cinsky-horoskop.html');
    const animals = [
        ['krysa', 'Krysa'], ['buvol', 'Buvol'], ['tygr', 'Tygr'], ['zajic', 'Zajíc'],
        ['drak', 'Drak'], ['had', 'Had'], ['kun', 'Kůň'], ['koza', 'Koza'],
        ['opice', 'Opice'], ['kohout', 'Kohout'], ['pes', 'Pes'], ['prase', 'Prase']
    ];
    for (const [slug, name] of animals) {
        await expect(page.locator(`#btn-${slug}`)).toHaveAccessibleName(name);
    }

    const ratButton = page.locator('#btn-krysa');
    const portraitBackground = await ratButton.locator('span').evaluate(element => getComputedStyle(element).backgroundImage);
    expect(portraitBackground).toContain('/img/atlas/chinese-zodiac-v1.webp');

    await ratButton.click();
    await expect(page.locator('#result-section')).toBeVisible();
    const resultPortrait = page.locator('#result-emoji');
    await expect(resultPortrait).toHaveAttribute('role', 'img');
    await expect(resultPortrait).toHaveAttribute('aria-label', 'Krysa');
    await expect(resultPortrait).toHaveCSS('background-image', /chinese-zodiac-v1\.webp/);

    const saveImageButton = page.locator('#chinese-share-image-btn');
    await expect(saveImageButton).toContainText('Uložit obrázek znamení');
    await expect(saveImageButton.locator('svg use')).toHaveAttribute('href', '/img/icons/mh-symbols.svg#camera');
    await page.screenshot({ path: testInfo.outputPath('chinese-zodiac-result-mobile.png'), fullPage: true });

    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(pageErrors).toEqual([]);
});
