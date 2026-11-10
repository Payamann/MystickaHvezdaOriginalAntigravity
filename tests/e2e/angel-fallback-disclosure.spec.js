// Návrh pro tests/e2e/angel-fallback-disclosure.spec.js v release worktree.
import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

test('andělský náhradní vhled je označen a další běžný vhled označení odstraní', async ({ page }) => {
    const owner = 'synthetic-angel-fallback-account';
    const intention = 'hluboký vhled k andělské kartě';
    await page.goto('/andelske-karty.html?source=e2e_account_isolation&feature=daily_angel_card&daily_card=intuice');
    await waitForPageReady(page);
    await expect(page.locator('#angel-results')).toHaveClass(/mh-block-visible/, { timeout: 8000 });
    await expect(page.locator('.angel-name')).toHaveText('Intuice');
    await expect(page.locator('#btn-deep-angel')).toBeVisible();

    await page.evaluate(account => {
        window.__angelReadingSaves = [];
        window.getCSRFToken = async () => 'synthetic-angel-csrf';
        window.Auth = {
            user: { id: account },
            isLoggedIn() { return Boolean(this.user?.id); },
            isPremium: () => true,
            showToast: () => {},
            saveReading: async (...args) => {
                window.__angelReadingSaves.push(args);
                return { id: 'synthetic-angel-reading' };
            }
        };
        document.dispatchEvent(new Event('auth:changed'));
    }, owner);

    const requests = [];
    await page.route('**/api/angel-card', route => {
        requests.push(route.request().postDataJSON());
        const fallback = requests.length === 1;
        return route.fulfill({ status: 200, json: {
            success: true,
            response: fallback ? 'Syntetický náhradní vhled.' : 'Syntetický běžný vhled.',
            fallback
        } });
    });
    const response = page.locator('#angel-ai-response');
    const notice = response.locator('[data-reading-fallback-notice]');
    await page.locator('#btn-deep-angel').click();
    await expect(response).toContainText('Syntetický náhradní vhled.');
    await expect(notice).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__angelReadingSaves.length)).toBe(1);
    const first = await page.evaluate(() => window.__angelReadingSaves[0]);
    expect(first[0]).toBe('angel-card');
    expect(first[1]).toMatchObject({ card: { name: 'Intuice', theme: 'Vhled' }, intention, response: 'Syntetický náhradní vhled.', fallback: true });
    expect(first[2]).toBe(owner);

    await page.locator('#btn-deep-angel').click();
    await expect(response).toContainText('Syntetický běžný vhled.');
    await expect(notice).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.__angelReadingSaves.length)).toBe(2);
    const second = await page.evaluate(() => window.__angelReadingSaves[1]);
    expect(second[0]).toBe('angel-card');
    expect(second[1]).toMatchObject({ card: { name: 'Intuice', theme: 'Vhled' }, intention, response: 'Syntetický běžný vhled.', fallback: false });
    expect(second[2]).toBe(owner);
    expect(requests).toHaveLength(2);
    for (const request of requests) {
        expect(request).toMatchObject({ card: { name: 'Intuice', theme: 'Vhled', isDailyCardDetail: true }, intention });
    }
});
