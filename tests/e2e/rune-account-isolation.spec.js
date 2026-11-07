import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

const ACCOUNT_A = 'synthetic-rune-account-a';
const ACCOUNT_B = 'synthetic-rune-account-b';
const RUNE_INTENTION = 'Soukromý záměr účtu A: změna práce';

async function openPreDrawnRune(page) {
    await page.addInitScript(() => {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Europe/Prague',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(new Date());
        const part = (type) => parts.find(item => item.type === type)?.value || '';
        const today = `${part('year')}-${part('month')}-${part('day')}`;
        localStorage.setItem('runeDaily', JSON.stringify({
            date: today,
            runeData: {
                id: 'fehu',
                name: 'Fehu',
                symbol: 'ᚠ',
                meaning: 'Bohatství, hojnost, nové hmotné začátky.',
                description: 'Předtažená testovací runa.',
                element: 'oheň'
            }
        }));
        sessionStorage.removeItem('pendingRuneContext');
    });

    await page.goto('/runy.html');
    await waitForPageReady(page);
    await expect(page.locator('#rune-result')).toHaveClass(/visible/, { timeout: 8000 });
    await expect(page.locator('#rune-name')).toContainText('Fehu');

    await page.evaluate((ownerId) => {
        window.__runeReadingSaves = [];
        window.getCSRFToken = async () => 'e2e-rune-csrf';
        window.Auth = {
            user: { id: ownerId },
            isLoggedIn() { return Boolean(this.user?.id); },
            isPremium: () => true,
            showToast: () => {},
            saveReading: async (...args) => {
                window.__runeReadingSaves.push(args);
                return { id: 'synthetic-rune-reading' };
            }
        };
        document.dispatchEvent(new Event('auth:changed'));
    }, ACCOUNT_A);

    await page.locator('#rune-intention').fill(RUNE_INTENTION);
}

async function installDeferredRuneApi(page, responseText) {
    let resolveRequestSeen;
    let releaseRoute;
    const requestSeen = new Promise(resolve => { resolveRequestSeen = resolve; });

    await page.route('**/api/runes', async route => {
        resolveRequestSeen(route.request().postDataJSON());
        await new Promise(resolve => {
            releaseRoute = async () => {
                try {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({ success: true, response: responseText, fallback: false })
                    });
                } finally {
                    resolve();
                }
            };
        });
    });

    return {
        requestSeen,
        release: async () => {
            if (!releaseRoute) throw new Error('Rune API request has not reached the deferred route.');
            await releaseRoute();
        }
    };
}

async function switchAccount(page, ownerId) {
    await page.evaluate((nextOwnerId) => {
        window.Auth.user = { id: nextOwnerId };
        document.dispatchEvent(new Event('auth:changed'));
    }, ownerId);
}

test.describe('Runový výklad — izolace účtů', () => {
    test('členský výklad se zobrazí a uloží pod vlastníkem, který ho spustil', async ({ page }) => {
        const responseText = 'SOUKROMÁ MOCKOVANÁ ODPOVĚĎ RUNY FEHU';
        await openPreDrawnRune(page);
        await page.route('**/api/runes', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, response: responseText, fallback: false })
        }));

        await page.locator('#btn-deep-reading').click();

        await expect(page.locator('#ai-response-container')).toContainText(responseText);
        await expect.poll(() => page.evaluate(() => window.__runeReadingSaves.length)).toBe(1);
        const saved = await page.evaluate(() => window.__runeReadingSaves[0]);
        expect(saved[0]).toBe('runes');
        expect(saved[1]).toMatchObject({
            rune: { name: 'Fehu', symbol: 'ᚠ' },
            intention: RUNE_INTENTION,
            response: responseText,
            fallback: false
        });
        expect(saved[2]).toBe(ACCOUNT_A);
    });

    test('opožděná soukromá odpověď se po změně A na B nezobrazí ani neuloží', async ({ page }) => {
        const responseText = 'SOUKROMÁ ODPOVĚĎ ÚČTU A NESMÍ UNIKNOUT ÚČTU B';
        await openPreDrawnRune(page);
        const deferred = await installDeferredRuneApi(page, responseText);

        await page.locator('#btn-deep-reading').click();
        const request = await deferred.requestSeen;
        expect(request).toMatchObject({ rune: { name: 'Fehu' }, intention: RUNE_INTENTION });

        const responseSeen = page.waitForResponse(response => response.url().endsWith('/api/runes'));
        await switchAccount(page, ACCOUNT_B);
        await deferred.release();
        await responseSeen;
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

        await expect(page.locator('#ai-response-container')).not.toContainText(responseText);
        expect(await page.evaluate(() => window.__runeReadingSaves)).toEqual([]);
        await expect(page.locator('#rune-intention')).toHaveValue('');
    });

    test('opožděná odpověď se po změně A na B a zpět na A nezobrazí ani neuloží', async ({ page }) => {
        const responseText = 'SOUKROMÁ ODPOVĚĎ A-B-A NESMÍ BÝT OBNOVENA';
        await openPreDrawnRune(page);
        const deferred = await installDeferredRuneApi(page, responseText);

        await page.locator('#btn-deep-reading').click();
        const request = await deferred.requestSeen;
        expect(request).toMatchObject({ rune: { name: 'Fehu' }, intention: RUNE_INTENTION });

        const responseSeen = page.waitForResponse(response => response.url().endsWith('/api/runes'));
        await switchAccount(page, ACCOUNT_B);
        await switchAccount(page, ACCOUNT_A);
        await deferred.release();
        await responseSeen;
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

        await expect(page.locator('#ai-response-container')).not.toContainText(responseText);
        expect(await page.evaluate(() => window.__runeReadingSaves)).toEqual([]);
    });

    test('změna účtu v jiné kartě zastaví starou odpověď i při zastaralé lokální identitě', async ({ page }) => {
        const responseText = 'Soukromý výklad původního účtu';
        await openPreDrawnRune(page);
        const deferred = await installDeferredRuneApi(page, responseText);
        await page.locator('#btn-deep-reading').click();
        await deferred.requestSeen;
        const responseSeen = page.waitForResponse(response => response.url().endsWith('/api/runes'));
        await page.evaluate(({ accountA, accountB }) => {
            const oldValue = JSON.stringify({ id: accountA });
            const newValue = JSON.stringify({ id: accountB });
            localStorage.setItem('auth_user', newValue);
            window.dispatchEvent(new StorageEvent('storage', { key: 'auth_user', oldValue, newValue }));
        }, { accountA: ACCOUNT_A, accountB: ACCOUNT_B });
        await deferred.release();
        await responseSeen;
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await expect(page.locator('#ai-response-container')).not.toContainText(responseText);
        await expect(page.locator('#rune-intention')).toHaveValue('');
        expect(await page.evaluate(() => window.__runeReadingSaves)).toEqual([]);

        await page.evaluate(() => {
            window.__runeToasts = [];
            window.Auth.showToast = (...args) => window.__runeToasts.push(args);
        });
        let extraRequests = 0;
        page.on('request', request => { if (request.url().endsWith('/api/runes')) extraRequests += 1; });
        await page.locator('#rune-intention').fill('Nový záměr');
        await page.locator('#btn-deep-reading').click();
        await expect.poll(() => page.evaluate(() => window.__runeToasts.length)).toBe(1);
        expect(extraRequests).toBe(0);

        await page.unroute('**/api/runes');
        await page.route('**/api/runes', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, response: 'Nový výklad účtu B' })
        }));
        await switchAccount(page, ACCOUNT_B);
        await page.locator('#rune-intention').fill('Záměr účtu B');
        await page.locator('#btn-deep-reading').click();
        await expect(page.locator('#ai-response-container')).toContainText('Nový výklad účtu B');
        await expect.poll(() => page.evaluate(() => window.__runeReadingSaves[0]?.[2])).toBe(ACCOUNT_B);
    });

    test('změna účtu během ukládání odstraní výsledek a zabrání starému potvrzení', async ({ page }) => {
        await openPreDrawnRune(page);
        await page.route('**/api/runes', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, response: 'Soukromý výklad účtu A', fallback: false })
        }));
        await page.evaluate(() => {
            window.__runeToasts = [];
            window.Auth.showToast = (...args) => window.__runeToasts.push(args);
            window.Auth.saveReading = async (...args) => {
                window.__runeReadingSaves.push(args);
                return new Promise(resolve => { window.__resolveRuneSave = () => resolve({ id: 'synthetic-rune-reading' }); });
            };
        });
        await page.locator('#btn-deep-reading').click();
        await expect.poll(() => page.evaluate(() => typeof window.__resolveRuneSave)).toBe('function');
        await switchAccount(page, ACCOUNT_B);
        await page.evaluate(() => window.__resolveRuneSave());
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await expect(page.locator('#ai-response-container')).not.toContainText('Soukromý výklad účtu A');
        await expect(page.locator('#rune-intention')).toHaveValue('');
        expect(await page.evaluate(() => window.__runeToasts)).toEqual([]);
        await expect(page.locator('#favorite-rune-action')).toHaveCount(0);
    });

    test('změna účtu během získávání tokenu zabrání odeslání původního záměru', async ({ page }) => {
        await openPreDrawnRune(page);
        let runeRequests = 0;
        await page.route('**/api/runes', route => {
            runeRequests += 1;
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, response: 'Test' }) });
        });
        await page.evaluate(() => {
            window.getCSRFToken = () => new Promise(resolve => { window.__resolveRuneCsrf = () => resolve('test-csrf'); });
        });
        await page.locator('#btn-deep-reading').click();
        await expect.poll(() => page.evaluate(() => typeof window.__resolveRuneCsrf)).toBe('function');
        await switchAccount(page, ACCOUNT_B);
        await page.evaluate(() => window.__resolveRuneCsrf());
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        expect(runeRequests).toBe(0);
        expect(await page.evaluate(() => window.__runeReadingSaves)).toEqual([]);
        await expect(page.locator('#rune-intention')).toHaveValue('');
    });
});
