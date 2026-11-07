import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

const ACCOUNT_A = 'synthetic-past-life-account-a';
const ACCOUNT_B = 'synthetic-past-life-account-b';
const PRIVATE_NAME = 'Jana Účet A';
const PRIVATE_RESULT = 'SOUKROMÝ SYMBOLICKÝ VÝSLEDEK ÚČTU A';

const MOCK_RESULT = {
    era: 'Mockovaná éra dávného příběhu',
    identity: 'Pozorovatel, který hledá souvislosti.',
    karmic_lesson: 'Učit se rozlišovat vlastní odpovědnost.',
    gifts: 'Trpělivost a schopnost naslouchat.',
    patterns: 'Opakující se motiv změny směru.',
    mission: 'Hledat praktický další krok.',
    message: PRIVATE_RESULT
};

async function preparePremiumForm(page, { deferSave = false } = {}) {
    await page.route('**/api/csrf-token', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ csrfToken: 'e2e-past-life-csrf' })
    }));

    await page.goto('/minuly-zivot.html');
    await waitForPageReady(page);
    await page.evaluate(({ ownerId, shouldDeferSave }) => {
        window.__pastLifeSaveCalls = [];
        window.__resolvePastLifeSave = null;
        window.Auth = {
            user: { id: ownerId },
            isLoggedIn() { return Boolean(this.user?.id); },
            isPremium: () => true,
            showToast: () => {},
            saveReading: async (...args) => {
                window.__pastLifeSaveCalls.push(args);
                if (!shouldDeferSave) return { id: 'synthetic-past-life-reading' };
                return new Promise(resolve => {
                    window.__resolvePastLifeSave = () => resolve({ id: 'synthetic-past-life-reading' });
                });
            }
        };
        document.dispatchEvent(new Event('auth:changed'));
    }, { ownerId: ACCOUNT_A, shouldDeferSave: deferSave });

    await expect(page.locator('#pl-form-wrap')).toBeVisible();
    await page.locator('#pl-name').fill(PRIVATE_NAME);
    await page.locator('#pl-birth').fill('1990-06-15');
    await page.locator('#pl-place').fill('Praha');
    await page.locator('[data-gender="neutral"]').click();
}

async function installDeferredPastLifeApi(page) {
    let resolveRequestSeen;
    let releaseRoute;
    const requestSeen = new Promise(resolve => { resolveRequestSeen = resolve; });

    await page.route('**/api/past-life', async route => {
        resolveRequestSeen(route.request().postDataJSON());
        await new Promise(resolve => {
            releaseRoute = async () => {
                try {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({ success: true, result: MOCK_RESULT, fallback: false })
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
            if (!releaseRoute) throw new Error('Past-life API request has not reached the deferred route.');
            await releaseRoute();
        }
    };
}

async function switchAccount(page, ownerId) {
    await page.evaluate(nextOwnerId => {
        window.Auth.user = { id: nextOwnerId };
        document.dispatchEvent(new Event('auth:changed'));
    }, ownerId);
}

async function submitAndExpectPayload(page, requestSeen) {
    await page.locator('#pl-submit').click();
    const payload = await requestSeen;
    expect(payload).toMatchObject({
        name: PRIVATE_NAME,
        birthDate: '1990-06-15',
        place: 'Praha',
        gender: 'neutral'
    });
}

test.describe('Minulý život — izolace účtů', () => {
    test('přihlášení návštěvníka zachová jeho rozpracované zadání', async ({ page }) => {
        await page.goto('/minuly-zivot.html');
        await waitForPageReady(page);
        await page.evaluate(() => {
            window.Auth = { isLoggedIn: () => false, isPremium: () => false, showToast: () => {} };
            document.dispatchEvent(new Event('auth:changed'));
        });
        await page.locator('#pl-name').fill(PRIVATE_NAME);
        await page.locator('#pl-birth').fill('1990-06-15');
        await page.locator('#pl-place').fill('Praha');
        await page.locator('[data-gender="neutral"]').click();
        await page.locator('#pl-submit').click();
        await expect(page.locator('#past-life-preview-gate')).toBeVisible();
        await page.evaluate(ownerId => {
            window.Auth = { user: { id: ownerId }, isLoggedIn: () => true, isPremium: () => true, showToast: () => {} };
            document.dispatchEvent(new Event('auth:changed'));
        }, ACCOUNT_A);
        await expect(page.locator('#pl-name')).toHaveValue(PRIVATE_NAME);
        await expect(page.locator('#pl-birth')).toHaveValue('1990-06-15');
        await expect(page.locator('#pl-place')).toHaveValue('Praha');
        expect(await page.evaluate(() => Boolean(sessionStorage.getItem('pendingPastLifeContext')))).toBe(true);
    });

    test('prémiový výklad se vykreslí a uloží s expected ownerem', async ({ page }) => {
        await preparePremiumForm(page);
        await page.route('**/api/past-life', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, result: MOCK_RESULT, fallback: false })
        }));

        await page.locator('#pl-submit').click();

        await expect(page.locator('#pl-result')).toHaveClass(/visible/);
        await expect(page.locator('#res-message')).toContainText(PRIVATE_RESULT);
        await expect.poll(() => page.evaluate(() => window.__pastLifeSaveCalls.length)).toBe(1);
        const saved = await page.evaluate(() => window.__pastLifeSaveCalls[0]);
        expect(saved[0]).toBe('past-life');
        expect(saved[1]).toMatchObject({
            name: PRIVATE_NAME,
            birthDate: '1990-06-15',
            gender: 'neutral',
            place: 'Praha',
            result: { message: PRIVATE_RESULT },
            fallback: false
        });
        expect(saved[2]).toBe(ACCOUNT_A);
        await expect(page.locator('#pl-loading')).toBeHidden();
    });

    test('opožděná odpověď A→B se nevykreslí a neuloží pod účet B', async ({ page }) => {
        await preparePremiumForm(page);
        const deferred = await installDeferredPastLifeApi(page);

        await submitAndExpectPayload(page, deferred.requestSeen);
        const responseSeen = page.waitForResponse(response => response.url().endsWith('/api/past-life'));
        await switchAccount(page, ACCOUNT_B);
        await deferred.release();
        await responseSeen;
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

        await expect(page.locator('#pl-result')).toBeHidden();
        await expect(page.locator('#res-message')).not.toContainText(PRIVATE_RESULT);
        expect(await page.evaluate(() => window.__pastLifeSaveCalls)).toEqual([]);
        await expect(page.locator('#pl-name')).toHaveValue('');
        await expect(page.locator('#pl-birth')).toHaveValue('');
        await expect(page.locator('#pl-place')).toHaveValue('');
    });

    test('opožděná odpověď A→B→A se nevykreslí ani po návratu na původní identitu', async ({ page }) => {
        await preparePremiumForm(page);
        const deferred = await installDeferredPastLifeApi(page);

        await submitAndExpectPayload(page, deferred.requestSeen);
        const responseSeen = page.waitForResponse(response => response.url().endsWith('/api/past-life'));
        await switchAccount(page, ACCOUNT_B);
        await switchAccount(page, ACCOUNT_A);
        await deferred.release();
        await responseSeen;
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

        await expect(page.locator('#pl-result')).toBeHidden();
        await expect(page.locator('#res-message')).not.toContainText(PRIVATE_RESULT);
        expect(await page.evaluate(() => window.__pastLifeSaveCalls)).toEqual([]);
    });

    test('změna účtu v jiné kartě zastaví odpověď a dovolí pokračovat po sjednocení identity', async ({ page }) => {
        await preparePremiumForm(page);
        const deferred = await installDeferredPastLifeApi(page);
        await submitAndExpectPayload(page, deferred.requestSeen);
        const responseSeen = page.waitForResponse(response => response.url().endsWith('/api/past-life'));
        await page.evaluate(({ accountA, accountB }) => {
            const oldValue = JSON.stringify({ id: accountA });
            const newValue = JSON.stringify({ id: accountB });
            localStorage.setItem('auth_user', newValue);
            window.dispatchEvent(new StorageEvent('storage', { key: 'auth_user', oldValue, newValue }));
        }, { accountA: ACCOUNT_A, accountB: ACCOUNT_B });
        await deferred.release();
        await responseSeen;
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await expect(page.locator('#pl-result')).toBeHidden();
        await expect(page.locator('#res-message')).not.toContainText(PRIVATE_RESULT);
        await expect(page.locator('#pl-name')).toHaveValue('');
        expect(await page.evaluate(() => window.__pastLifeSaveCalls)).toEqual([]);

        await page.unroute('**/api/past-life');
        await page.route('**/api/past-life', route => route.fulfill({
            status: 200, contentType: 'application/json',
            body: JSON.stringify({ success: true, result: { ...MOCK_RESULT, message: 'Výklad účtu B' } })
        }));
        await switchAccount(page, ACCOUNT_B);
        await page.locator('#pl-name').fill('Test účtu B');
        await page.locator('#pl-birth').fill('1991-04-12');
        await page.locator('[data-gender="neutral"]').click();
        await page.locator('#pl-submit').click();
        await expect(page.locator('#res-message')).toContainText('Výklad účtu B');
        await expect.poll(() => page.evaluate(() => window.__pastLifeSaveCalls[0]?.[2])).toBe(ACCOUNT_B);
    });

    test('změna účtu během CSRF zabrání odeslání původních údajů', async ({ page }) => {
        await preparePremiumForm(page);
        let releaseCsrf;
        let csrfSeenResolve;
        const csrfSeen = new Promise(resolve => { csrfSeenResolve = resolve; });
        await page.route('**/api/csrf-token', async route => {
            csrfSeenResolve();
            await new Promise(resolve => {
                releaseCsrf = async () => {
                    try { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ csrfToken: 'test' }) }); }
                    finally { resolve(); }
                };
            });
        });
        let requests = 0;
        await page.route('**/api/past-life', route => {
            requests += 1;
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, result: MOCK_RESULT }) });
        });
        await page.locator('#pl-submit').click();
        await csrfSeen;
        const responseSeen = page.waitForResponse(response => response.url().endsWith('/api/csrf-token'));
        await switchAccount(page, ACCOUNT_B);
        await releaseCsrf();
        await responseSeen;
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        expect(requests).toBe(0);
        expect(await page.evaluate(() => window.__pastLifeSaveCalls)).toEqual([]);
        await expect(page.locator('#pl-name')).toHaveValue('');
    });

    test('změna účtu během ukládání nenechá starý výsledek viditelný ani pod novým účtem', async ({ page }) => {
        await preparePremiumForm(page, { deferSave: true });
        await page.route('**/api/past-life', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, result: MOCK_RESULT, fallback: false })
        }));

        await page.locator('#pl-submit').click();
        await expect.poll(() => page.evaluate(() => window.__pastLifeSaveCalls.length)).toBe(1);
        const saveStarted = await page.evaluate(() => ({
            ownerId: window.__pastLifeSaveCalls[0][2],
            hasRelease: typeof window.__resolvePastLifeSave === 'function'
        }));
        expect(saveStarted.hasRelease).toBe(true);

        await switchAccount(page, ACCOUNT_B);
        await expect(page.locator('#pl-result')).toBeHidden();
        await expect(page.locator('#res-message')).not.toContainText(PRIVATE_RESULT);
        await expect(page.locator('#pl-name')).toHaveValue('');
        await expect(page.locator('#pl-place')).toHaveValue('');
        await expect(page.locator('#share-fb')).not.toHaveAttribute('href');
        await page.evaluate(() => window.__resolvePastLifeSave());

        await expect(page.locator('#pl-result')).toBeHidden();
        await expect(page.locator('#res-message')).not.toContainText(PRIVATE_RESULT);
        const saves = await page.evaluate(() => window.__pastLifeSaveCalls);
        expect(saves).toHaveLength(1);
        expect(saves[0][2]).toBe(ACCOUNT_A);
    });

    test('změna účtu během vytváření obrázku zastaví sdílení původního výkladu', async ({ page }) => {
        await preparePremiumForm(page);
        await page.route('**/api/past-life', route => route.fulfill({
            status: 200, contentType: 'application/json',
            body: JSON.stringify({ success: true, result: MOCK_RESULT })
        }));
        await page.evaluate(() => {
            window.__pastLifeShares = 0;
            window.MH_SHARE_IMAGE = {
                createCanvas: () => ({ width: 1080, height: 1080, getContext: () => ({ fillText() {}, fillRect() {} }) }),
                drawBrandBackground: () => new Promise(resolve => { window.__resolvePastLifeImage = resolve; }),
                wrapText: () => [],
                drawCenteredLines: () => 0,
                drawFooter: () => {},
                shareOrDownload: () => { window.__pastLifeShares += 1; }
            };
        });
        await page.locator('#pl-submit').click();
        await expect(page.locator('#pl-result')).toHaveClass(/visible/);
        await page.locator('#share-image').click();
        await expect.poll(() => page.evaluate(() => typeof window.__resolvePastLifeImage)).toBe('function');
        await switchAccount(page, ACCOUNT_B);
        await page.evaluate(() => window.__resolvePastLifeImage());
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        expect(await page.evaluate(() => window.__pastLifeShares)).toBe(0);
        await expect(page.locator('#share-image')).toHaveCount(0);
    });
});
