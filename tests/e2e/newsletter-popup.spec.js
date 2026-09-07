import { test, expect } from '@playwright/test';

test('horoscope email signup remains inline and available without a popup', async ({ page }) => {
    await page.goto('/horoskopy.html');
    await expect(page.locator('#horoscope-subscribe-form')).toBeAttached();
    await expect(page.locator('#horoscope-subscribe-btn')).toBeAttached();
    await expect(page.locator('#mh-newsletter-popup')).toHaveCount(0);
});
