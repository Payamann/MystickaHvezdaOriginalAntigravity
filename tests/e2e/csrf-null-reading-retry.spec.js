import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

async function installMocks(page, endpoint) {
    await page.evaluate(target => {
        window.__readingCalls = [];
        window.__checkoutCalls = [];
        window.__tokenCalls = 0;
        window.Auth = {
            user: { id: 'synthetic-premium-user' },
            isLoggedIn() { return Boolean(this.user?.id); },
            isPremium: () => true,
            showToast: () => {},
            startPlanCheckout: (...args) => window.__checkoutCalls.push(args),
            saveReading: async () => ({ id: 'synthetic-reading' })
        };
        window.getCSRFToken = () => {
            window.__tokenCalls += 1;
            if (window.__tokenCalls === 1) return new Promise(resolve => setTimeout(() => resolve(null), 20_000));
            return Promise.resolve('synthetic-csrf-token');
        };
        const realFetch = window.fetch.bind(window);
        window.fetch = (input, options) => {
            const url = typeof input === 'string' ? input : input.url;
            if (new URL(url, location.href).pathname === target) {
                window.__readingCalls.push({ headers: options?.headers });
                if (!options?.headers?.['X-CSRF-Token']) {
                    return Promise.resolve({ ok: false, status: 403, json: async () => ({ success: false, error: 'CSRF token missing' }) });
                }
                return Promise.resolve({ ok: true, status: 200, json: async () => ({ success: true, response: 'Syntetický výklad', fallback: false }) });
            }
            return realFetch(input, options);
        };
        document.dispatchEvent(new Event('auth:changed'));
    }, endpoint);
}

async function assertRetry(page, button, expectedResult) {
    await button.click();
    await expect.poll(() => page.evaluate(() => window.__tokenCalls)).toBe(1);
    await page.clock.fastForward(20_000);
    await page.clock.runFor(1_000);
    await expect(button).toBeEnabled();
    expect(await page.evaluate(() => window.__readingCalls)).toEqual([]);
    expect(await page.evaluate(() => window.__checkoutCalls)).toEqual([]);
    await expect(page.locator('.runes-upgrade-preview, .angel-upgrade-preview, .premium-paywall, .paywall-overlay')).toHaveCount(0);
    await button.click();
    await expect.poll(() => page.evaluate(() => window.__readingCalls.length)).toBe(1);
    expect(await page.evaluate(() => window.__readingCalls[0].headers['X-CSRF-Token'])).toBe('synthetic-csrf-token');
    await page.clock.runFor(3_000);
    await expect(expectedResult).toContainText('Syntetický výklad', { timeout: 10_000 });
    expect(await page.evaluate(() => window.__checkoutCalls)).toEqual([]);
}

test('runa: chybějící token neotevře paywall a ruční opakování funguje', async ({ page }) => {
    await page.clock.install();
    await page.addInitScript(() => {
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
        const p = type => parts.find(item => item.type === type)?.value || '';
        localStorage.setItem('runeDaily', JSON.stringify({ date: `${p('year')}-${p('month')}-${p('day')}`, runeData: {
            id: 'fehu', name: 'Fehu', symbol: 'ᚠ', meaning: 'Syntetický význam', description: 'Testovací runa', element: 'oheň'
        } }));
        sessionStorage.removeItem('pendingRuneContext');
    });
    await page.goto('/runy.html');
    await waitForPageReady(page);
    await expect(page.locator('#rune-result')).toHaveClass(/visible/, { timeout: 8000 });
    await installMocks(page, '/api/runes');
    await page.locator('#rune-intention').fill('Syntetický záměr');
    await assertRetry(page, page.locator('#btn-deep-reading'), page.locator('#ai-response-container'));
});

test('andělská karta: chybějící token neotevře paywall a ruční opakování funguje', async ({ page }) => {
    await page.clock.install();
    await page.goto('/andelske-karty.html?source=e2e_account_isolation&feature=daily_angel_card&daily_card=intuice');
    await waitForPageReady(page);
    await expect(page.locator('#angel-results')).toHaveClass(/mh-block-visible/, { timeout: 8000 });
    await installMocks(page, '/api/angel-card');
    await assertRetry(page, page.locator('#btn-deep-angel'), page.locator('#angel-ai-response'));
});

test('koule: chybějící token neotevře paywall a ruční opakování funguje', async ({ page }) => {
    await page.clock.install();
    await page.goto('/kristalova-koule.html');
    await waitForPageReady(page);
    await installMocks(page, '/api/crystal-ball');
    await page.locator('#question-input').fill('Jak se mohu lépe soustředit?');
    await assertRetry(page, page.locator('#ask-btn'), page.locator('#answer-text'));
});
