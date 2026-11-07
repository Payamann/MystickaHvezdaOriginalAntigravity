import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

const ACCOUNT_A = 'synthetic-angel-account-a';
const ACCOUNT_B = 'synthetic-angel-account-b';
const PRIVATE_RESPONSE = 'SOUKROMÝ HLUBOKÝ VÝKLAD INTUICE ÚČTU A';
const CARD_INTENTION = 'hluboký vhled k andělské kartě';

async function openPreDrawnAngelCard(page, { deferSave = false } = {}) {
    await page.goto('/andelske-karty.html?source=e2e_account_isolation&feature=daily_angel_card&daily_card=intuice');
    await waitForPageReady(page);
    await expect(page.locator('#angel-results')).toHaveClass(/mh-block-visible/, { timeout: 8000 });
    await expect(page.locator('.angel-name')).toHaveText('Intuice');
    await expect(page.locator('#btn-deep-angel')).toBeVisible();

    await page.evaluate(({ ownerId, shouldDeferSave }) => {
        window.__angelReadingSaves = [];
        window.__resolveAngelSave = null;
        window.getCSRFToken = async () => 'e2e-angel-csrf';
        window.Auth = {
            user: { id: ownerId },
            isLoggedIn() { return Boolean(this.user?.id); },
            isPremium: () => true,
            showToast: () => {},
            saveReading: async (...args) => {
                window.__angelReadingSaves.push(args);
                if (!shouldDeferSave) return { id: 'synthetic-angel-reading' };
                return new Promise(resolve => {
                    window.__resolveAngelSave = () => resolve({ id: 'synthetic-angel-reading' });
                });
            }
        };
        document.dispatchEvent(new Event('auth:changed'));
    }, { ownerId: ACCOUNT_A, shouldDeferSave: deferSave });
}

async function installDeferredAngelApi(page) {
    let resolveRequestSeen;
    let releaseRoute;
    const requestSeen = new Promise(resolve => { resolveRequestSeen = resolve; });

    await page.route('**/api/angel-card', async route => {
        resolveRequestSeen(route.request().postDataJSON());
        await new Promise(resolve => {
            releaseRoute = async () => {
                try {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({ success: true, response: PRIVATE_RESPONSE, fallback: false })
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
            if (!releaseRoute) throw new Error('Angel-card request has not reached the deferred route.');
            await releaseRoute();
        }
    };
}

async function installImmediateAngelApi(page) {
    await page.route('**/api/angel-card', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, response: PRIVATE_RESPONSE, fallback: false })
    }));
}

async function submitAndObserveRequest(page, requestSeen) {
    await page.locator('#btn-deep-angel').click();
    const requestPayload = await requestSeen;
    expect(requestPayload).toMatchObject({
        card: { name: 'Intuice', theme: 'Vhled', isDailyCardDetail: true },
        intention: CARD_INTENTION
    });
}

async function switchAccount(page, ownerId) {
    await page.evaluate(nextOwnerId => {
        window.Auth.user = { id: nextOwnerId };
        document.dispatchEvent(new Event('auth:changed'));
    }, ownerId);
}

async function waitForBrowserTick(page) {
    await page.evaluate(() => new Promise(resolve => {
        requestAnimationFrame(() => setTimeout(resolve, 0));
    }));
}

async function releaseAndWait(page, deferred, responseSeen) {
    await deferred.release();
    await responseSeen;
    await waitForBrowserTick(page);
}

test.describe('Andělská karta — izolace účtů', () => {
    test('hluboký vhled se vykreslí a uloží s expected ownerem', async ({ page }) => {
        await openPreDrawnAngelCard(page);
        await installImmediateAngelApi(page);

        await page.locator('#btn-deep-angel').click();

        await expect(page.locator('#angel-ai-response')).toContainText(PRIVATE_RESPONSE);
        await expect.poll(() => page.evaluate(() => window.__angelReadingSaves.length)).toBe(1);
        const saved = await page.evaluate(() => window.__angelReadingSaves[0]);
        expect(saved[0]).toBe('angel-card');
        expect(saved[1]).toMatchObject({
            card: { name: 'Intuice', theme: 'Vhled' },
            intention: CARD_INTENTION,
            response: PRIVATE_RESPONSE,
            fallback: false
        });
        expect(saved[2]).toBe(ACCOUNT_A);
    });

    test('opožděná odpověď A→B se nezobrazí ani neuloží pod účet B', async ({ page }) => {
        await openPreDrawnAngelCard(page);
        const deferred = await installDeferredAngelApi(page);
        await submitAndObserveRequest(page, deferred.requestSeen);
        const responseSeenPromise = page.waitForResponse(response => response.url().endsWith('/api/angel-card'));
        await switchAccount(page, ACCOUNT_B);
        await releaseAndWait(page, deferred, responseSeenPromise);

        await expect(page.locator('#angel-ai-response')).toBeHidden();
        await expect(page.locator('#angel-ai-response')).not.toContainText(PRIVATE_RESPONSE);
        expect(await page.evaluate(() => window.__angelReadingSaves)).toEqual([]);
    });

    test('opožděná odpověď A→B→A se nezobrazí po návratu ke stejné identitě', async ({ page }) => {
        await openPreDrawnAngelCard(page);
        const deferred = await installDeferredAngelApi(page);
        await submitAndObserveRequest(page, deferred.requestSeen);
        const responseSeenPromise = page.waitForResponse(response => response.url().endsWith('/api/angel-card'));
        await switchAccount(page, ACCOUNT_B);
        await switchAccount(page, ACCOUNT_A);
        await releaseAndWait(page, deferred, responseSeenPromise);

        await expect(page.locator('#angel-ai-response')).toBeHidden();
        await expect(page.locator('#angel-ai-response')).not.toContainText(PRIVATE_RESPONSE);
        expect(await page.evaluate(() => window.__angelReadingSaves)).toEqual([]);
    });

    test('změna účtu v jiné kartě pozastaví vhled do sjednocení identity', async ({ page }) => {
        await openPreDrawnAngelCard(page);
        const deferred = await installDeferredAngelApi(page);
        await submitAndObserveRequest(page, deferred.requestSeen);
        const responseSeen = page.waitForResponse(response => response.url().endsWith('/api/angel-card'));
        await page.evaluate(({ accountA, accountB }) => {
            const oldValue = JSON.stringify({ id: accountA });
            const newValue = JSON.stringify({ id: accountB });
            localStorage.setItem('auth_user', newValue);
            window.dispatchEvent(new StorageEvent('storage', { key: 'auth_user', oldValue, newValue }));
        }, { accountA: ACCOUNT_A, accountB: ACCOUNT_B });
        await releaseAndWait(page, deferred, responseSeen);
        await expect(page.locator('#angel-ai-response')).toBeHidden();
        await expect(page.locator('#angel-ai-response')).not.toContainText(PRIVATE_RESPONSE);
        expect(await page.evaluate(() => window.__angelReadingSaves)).toEqual([]);

        await page.evaluate(() => {
            window.__angelToasts = [];
            window.Auth.showToast = (...args) => window.__angelToasts.push(args);
        });
        let extraRequests = 0;
        page.on('request', request => { if (request.url().endsWith('/api/angel-card')) extraRequests += 1; });
        await page.locator('#btn-deep-angel').click();
        await expect.poll(() => page.evaluate(() => window.__angelToasts.length)).toBe(1);
        expect(extraRequests).toBe(0);

        await page.unroute('**/api/angel-card');
        await page.route('**/api/angel-card', route => route.fulfill({
            status: 200, contentType: 'application/json',
            body: JSON.stringify({ success: true, response: 'Nový vhled účtu B' })
        }));
        await switchAccount(page, ACCOUNT_B);
        await page.locator('#btn-deep-angel').click();
        await expect(page.locator('#angel-ai-response')).toContainText('Nový vhled účtu B');
        await expect.poll(() => page.evaluate(() => window.__angelReadingSaves[0]?.[2])).toBe(ACCOUNT_B);
    });

    test('změna účtu během získávání tokenu zastaví původní požadavek', async ({ page }) => {
        await openPreDrawnAngelCard(page);
        let angelRequests = 0;
        await page.route('**/api/angel-card', route => {
            angelRequests += 1;
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, response: 'Test' }) });
        });
        await page.evaluate(() => {
            window.getCSRFToken = () => new Promise(resolve => { window.__resolveAngelCsrf = () => resolve('test'); });
        });
        await page.locator('#btn-deep-angel').click();
        await expect.poll(() => page.evaluate(() => typeof window.__resolveAngelCsrf)).toBe('function');
        await switchAccount(page, ACCOUNT_B);
        await page.evaluate(() => window.__resolveAngelCsrf());
        await waitForBrowserTick(page);
        expect(angelRequests).toBe(0);
        expect(await page.evaluate(() => window.__angelReadingSaves)).toEqual([]);
    });

    test('změna účtu během uložení odstraní soukromý výsledek a zachová původního ownera save', async ({ page }) => {
        await openPreDrawnAngelCard(page, { deferSave: true });
        await installImmediateAngelApi(page);

        await page.locator('#btn-deep-angel').click();
        await expect.poll(() => page.evaluate(() => window.__angelReadingSaves.length)).toBe(1);
        await expect(page.locator('#angel-ai-response')).toContainText(PRIVATE_RESPONSE);
        const saveStarted = await page.evaluate(() => ({
            ownerId: window.__angelReadingSaves[0][2],
            hasRelease: typeof window.__resolveAngelSave === 'function'
        }));
        expect(saveStarted.hasRelease).toBe(true);

        await switchAccount(page, ACCOUNT_B);
        await expect(page.locator('#angel-ai-response')).toBeHidden();
        await expect(page.locator('#angel-ai-response')).not.toContainText(PRIVATE_RESPONSE);
        await page.evaluate(() => window.__resolveAngelSave());
        await waitForBrowserTick(page);

        await expect(page.locator('#angel-ai-response')).toBeHidden();
        await expect(page.locator('#angel-ai-response')).not.toContainText(PRIVATE_RESPONSE);
        const saves = await page.evaluate(() => window.__angelReadingSaves);
        expect(saves).toHaveLength(1);
        expect(saves[0][2]).toBe(ACCOUNT_A);
    });
});
