import { test, expect } from '@playwright/test';

test('love landing offers a genuinely free first step on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tarot-laska.html');
    const primary = page.locator('[data-analytics-cta="tarot_love_landing_primary"]');
    await expect(primary).toContainText('zdarma');
    const destination = new URL(await primary.getAttribute('href'), page.url());
    expect(destination.pathname).toBe('/tarot-ano-ne.html');
    expect(destination.searchParams.get('feature')).toBe('tarot');
    await expect(page.locator('.love-tarot-hero__copy')).toContainText('bez registrace a platební karty');
    await expect(page.locator('[data-analytics-cta="tarot_love_intent_three_cards"]')).toContainText('v členství');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('daily card distinguishes paid continuation and selects three cards', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/tarot-karta-dne.html');
    const continuation = page.locator('[data-analytics-cta="tarot_daily_card_intent_three_cards"]');
    await expect(continuation).toContainText('v členství');
    expect(new URL(await continuation.getAttribute('href'), page.url()).searchParams.get('spread')).toBe('three_cards');
    await expect(page.locator('.tarot-daily-primer')).toContainText('Karta dne zůstává zdarma');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
