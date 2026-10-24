import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

test('rituální sezení zachová mobilní vzhled, všech šest kroků i závěrečnou reflexi', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.clock.install({ time: new Date('2026-10-22T10:00:00+02:00') });

    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    const response = await page.goto('/ritualy/session.html?phase=full-moon&sign=beran');
    expect(response?.status()).toBe(200);
    await waitForPageReady(page);

    await expect(page.locator('body')).toHaveClass(/atlas-ritual-session/);
    await expect(page.locator('#screen-checkin-before')).toBeVisible();
    await expect(page.locator('#screen-checkin-before .emoji-btn')).toHaveCount(5);
    await expect(page.locator('#header-ritual-name')).toContainText('Rituál uvolnění');

    const header = page.locator('.session-header');
    const headerBounds = await header.boundingBox();
    expect(headerBounds).not.toBeNull();
    expect(headerBounds.x).toBeGreaterThanOrEqual(0);
    expect(headerBounds.x + headerBounds.width).toBeLessThanOrEqual(390);
    await page.screenshot({ path: testInfo.outputPath('ritual-session-mobile.png'), fullPage: true });

    await page.locator('#screen-checkin-before .emoji-btn[data-mood="3"]').click();
    await expect(page.locator('#screen-step')).toBeVisible();
    await expect(page.locator('#step-label')).toHaveText('Krok 1 / 6');
    await expect(page.locator('#breath-container')).toBeVisible();
    await expect(page.locator('#btn-next')).toBeHidden();

    await page.clock.runFor(45_000);
    await expect(page.locator('#breath-container')).toBeHidden();
    await expect(page.locator('#btn-next')).toBeVisible();

    for (let step = 2; step <= 6; step += 1) {
        await page.locator('#btn-next').click();
        await expect(page.locator('#step-label')).toHaveText(`Krok ${step} / 6`);
    }

    await page.locator('#btn-next').click();
    await expect(page.locator('#screen-checkin-after')).toBeVisible();
    await expect(page.locator('#progress-bar')).toHaveAttribute('aria-valuenow', '88');
    await page.locator('#screen-checkin-after .emoji-btn[data-mood="4"]').click();

    await expect(page.locator('#screen-completion')).toBeVisible();
    await expect(page.locator('#mood-shift')).toContainText('😌');
    await expect(page.locator('#mood-shift')).toContainText('🌟');
    await expect(page.locator('#journal-notes')).toBeVisible();
    await expect(page.locator('#journal-action .journal-premium-gate')).toBeVisible();
    await expect(page.locator('#streak-number')).toHaveText('1');
    expect(await page.evaluate(() => localStorage.getItem('mh_ritual_last_date'))).toBe('2026-10-22');
    expect(pageErrors).toEqual([]);
});
