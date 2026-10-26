import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

const localizedPages = [
    ['/sk/index.html', 'sk'],
    ['/sk/horoskopy.html', 'sk'],
    ['/sk/andelske-karty.html', 'sk'],
    ['/sk/kristalova-koule.html', 'sk'],
    ['/sk/natalni-karta.html', 'sk'],
    ['/sk/tarot.html', 'sk'],
    ['/sk/tarot-ano-nie.html', 'sk'],
    ['/pl/index.html', 'pl'],
    ['/pl/horoskopy.html', 'pl'],
    ['/pl/andelske-karty.html', 'pl'],
    ['/pl/kristalova-koule.html', 'pl'],
    ['/pl/natalni-karta.html', 'pl'],
    ['/pl/tarot.html', 'pl'],
    ['/en/', 'en'],
    ['/en/horoscopes.html', 'en'],
    ['/en/birth-chart.html', 'en'],
    ['/en/crystal-ball.html', 'en'],
    ['/en/tarot.html', 'en'],
    ['/en/angel-cards.html', 'en']
];

for (const [route, locale] of localizedPages) {
    test(`${route} renders its localized mobile shell and menu`, async ({ page }) => {
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        await page.setViewportSize({ width: 390, height: 844 });
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
        expect(response?.status()).toBe(200);
        await waitForPageReady(page);
        await expect(page.locator('header.header')).toBeVisible();

        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator('header.header')).toBeVisible();
        await expect(page.locator('header.header .logo')).toHaveAttribute('href', `/${locale}/`);
        await expect(page.locator('main h1').first()).toBeVisible();

        const menuButton = page.locator('header.header .nav__toggle');
        const menu = page.locator('header.header .nav__list');
        const menuBounds = await menuButton.boundingBox();
        expect(menuBounds.x).toBeGreaterThanOrEqual(0);
        expect(menuBounds.x + menuBounds.width).toBeLessThanOrEqual(390);
        await expect(menuButton).toBeVisible();
        await menuButton.click();
        await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
        await expect(menu).toHaveAttribute('aria-hidden', 'false');
        await page.keyboard.press('Escape');
        await expect(menuButton).toHaveAttribute('aria-expanded', 'false');

        const layout = await page.evaluate(() => ({
            viewport: document.documentElement.clientWidth,
            content: document.documentElement.scrollWidth
        }));
        expect(layout.content).toBeLessThanOrEqual(layout.viewport + 1);
        expect(pageErrors).toEqual([]);
    });
}
