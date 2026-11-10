import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

for (const fallback of [true, false]) test(`runový výklad správně označí fallback=${fallback}`, async ({ page }) => {
    const account = 'synthetic-rune-fallback-account';
    const intention = 'Syntetický záměr pro test runy';
    await page.addInitScript(() => {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit'
        }).formatToParts(new Date());
        const part = type => parts.find(item => item.type === type)?.value || '';
        localStorage.setItem('runeDaily', JSON.stringify({
            date: `${part('year')}-${part('month')}-${part('day')}`,
            runeData: {
                id: 'fehu', name: 'Fehu', symbol: 'ᚠ',
                meaning: 'Bohatství, hojnost, nové hmotné začátky.',
                description: 'Předtažená testovací runa.', element: 'oheň'
            }
        }));
        sessionStorage.removeItem('pendingRuneContext');
    });
    await page.goto('/runy.html');
    await waitForPageReady(page);
    await expect(page.locator('#rune-result')).toHaveClass(/visible/, { timeout: 8000 });
    await expect(page.locator('#rune-name')).toContainText('Fehu');
    await page.evaluate(owner => {
        window.__runeReadingSaves = [];
        window.getCSRFToken = async () => 'synthetic-csrf';
        window.Auth = {
            user: { id: owner },
            isLoggedIn() { return Boolean(this.user?.id); },
            isPremium: () => true,
            showToast: () => {},
            saveReading: async (...args) => {
                window.__runeReadingSaves.push(args);
                return { id: 'synthetic-rune-reading' };
            }
        };
        document.dispatchEvent(new Event('auth:changed'));
    }, account);

    let requests = 0;
    await page.route('**/api/runes', route => {
        requests += 1;
        return route.fulfill({ status: 200, json: {
            success: true,
            response: fallback ? 'Syntetický náhradní výklad.' : 'Syntetický běžný výklad.',
            fallback
        } });
    });
    await page.locator('#rune-intention').fill(intention);
    const result = page.locator('#ai-response-container');
    const notice = result.locator('[data-reading-fallback-notice]');
    await page.locator('#btn-deep-reading').click();
    const response = fallback ? 'Syntetický náhradní výklad.' : 'Syntetický běžný výklad.';
    await expect(result).toContainText(response);
    if (fallback) {
        await expect(notice).toBeVisible();
        await expect(notice).toHaveAttribute('role', 'status');
    } else {
        await expect(notice).toHaveCount(0);
    }
    await expect.poll(() => page.evaluate(() => window.__runeReadingSaves.length)).toBe(1);
    const first = await page.evaluate(() => window.__runeReadingSaves[0]);
    expect(first[0]).toBe('runes');
    expect(first[1]).toMatchObject({ intention, response, fallback });
    expect(first[2]).toBe(account);

    expect(requests).toBe(1);
});
