// Návrh pro tests/e2e/astro-map-account-isolation.spec.js v release worktree.
import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

test('opožděný osobní výsledek A se po přepnutí na B nezobrazí ani neuloží', async ({ page }) => {
    const accountA = 'synthetic-astro-account-a';
    const accountB = 'synthetic-astro-account-b';
    const privateResponse = 'SYNTETICKÁ SOUKROMÁ ASTRO MAPA ÚČTU A';
    await page.goto('/astro-mapa.html');
    await waitForPageReady(page);
    await page.evaluate(owner => {
        window.__astroRequests = [];
        window.__astroSaves = [];
        window.Auth = {
            user: { id: owner },
            isLoggedIn() { return Boolean(this.user?.id); },
            isPremium: () => true,
            showToast: () => {},
            saveReading: async (...args) => {
                window.__astroSaves.push({ args, activeOwner: window.Auth.user.id });
                return { id: 'synthetic-astro-reading' };
            }
        };
        window.callAPI = (path, payload) => {
            window.__astroRequests.push({ path, payload });
            return new Promise(resolve => { window.__releaseAstro = resolve; });
        };
        document.dispatchEvent(new Event('auth:changed'));
    }, accountA);

    await page.locator('#astro-name').fill('Syntetické jméno A');
    await page.locator('#astro-date').fill('1990-04-15');
    await page.locator('#astro-time').fill('12:30');
    await page.locator('#astro-place').fill('Praha');
    await page.locator('#astro-form button[type=submit]').click();
    await expect.poll(() => page.evaluate(() => window.__astroRequests.length)).toBe(1);
    const request = await page.evaluate(() => window.__astroRequests[0]);
    expect(request).toMatchObject({ path: '/astrocartography', payload: {
        name: 'Syntetické jméno A', birthDate: '1990-04-15', birthTime: '12:30', birthPlace: 'Praha'
    } });

    await page.evaluate(({ nextOwner, response }) => {
        window.Auth.user = { id: nextOwner };
        document.dispatchEvent(new Event('auth:changed'));
        window.__releaseAstro({ success: true, response, astrocartography: { recommendations: [], angularLines: [] }, chart: {} });
    }, { nextOwner: accountB, response: privateResponse });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(page.locator('#astro-results')).not.toContainText(privateResponse);
    expect(await page.evaluate(() => window.__astroSaves)).toEqual([]);
});

const A = 'synthetic-astro-account-a';
const B = 'synthetic-astro-account-b';
const PRIVATE = 'SYNTETICKÝ OSOBNÍ VÝSLEDEK A';

async function setup(page, { deferSave = false } = {}) {
    await page.goto('/astro-mapa.html');
    await waitForPageReady(page);
    await page.evaluate(({ owner, defer }) => {
        window.__requests = [];
        window.__saves = [];
        window.__toasts = [];
        window.Auth = {
            user: { id: owner },
            isLoggedIn() { return Boolean(this.user?.id); },
            isPremium: () => true,
            showToast: (...args) => window.__toasts.push(args),
            saveReading: (...args) => {
                window.__saves.push({ args, activeOwner: window.Auth.user.id });
                if (!defer) return Promise.resolve({ id: 'synthetic-reading' });
                return new Promise(resolve => { window.__releaseSave = () => resolve({ id: 'synthetic-reading' }); });
            },
            getProfile: () => new Promise(resolve => { window.__releaseProfile = resolve; })
        };
        window.callAPI = (path, payload) => {
            window.__requests.push({ path, payload });
            return new Promise(resolve => { window.__releaseApi = resolve; });
        };
        document.dispatchEvent(new Event('auth:changed'));
    }, { owner: A, defer: deferSave });
}

async function submit(page) {
    await page.locator('#astro-name').fill('Syntetické jméno A');
    await page.locator('#astro-date').fill('1990-04-15');
    await page.locator('#astro-time').fill('12:30');
    await page.locator('#astro-place').fill('Praha');
    await page.locator('#astro-form button[type=submit]').click();
    await expect.poll(() => page.evaluate(() => window.__requests.length)).toBe(1);
}

async function changeOwner(page, owner) {
    await page.evaluate(id => {
        window.Auth.user = { id };
        document.dispatchEvent(new Event('auth:changed'));
    }, owner);
}

async function releaseApi(page) {
    await page.evaluate(response => window.__releaseApi({
        success: true, response, astrocartography: { recommendations: [], angularLines: [] }, chart: {}
    }), PRIVATE);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

test('běžný výsledek se zobrazí a uloží pro vlastníka A', async ({ page }) => {
    await setup(page);
    await submit(page);
    await releaseApi(page);
    await expect(page.locator('#astro-results')).toContainText(PRIVATE);
    await expect.poll(() => page.evaluate(() => window.__saves.length)).toBe(1);
    const saved = await page.evaluate(() => window.__saves[0]);
    expect(saved.args[0]).toBe('astrocartography');
    expect(saved.args[1]).toMatchObject({ name: 'Syntetické jméno A', response: PRIVATE });
    expect(saved.args[2]).toBe(A);
    expect(saved.activeOwner).toBe(A);
});

test('opožděná odpověď A→B→A zůstane zneplatněná', async ({ page }) => {
    await setup(page);
    await submit(page);
    await changeOwner(page, B);
    await changeOwner(page, A);
    await releaseApi(page);
    await expect(page.locator('#astro-results')).not.toContainText(PRIVATE);
    expect(await page.evaluate(() => window.__saves)).toEqual([]);
});

test('změna účtu během ukládání odstraní výsledek a neukáže potvrzení', async ({ page }) => {
    await setup(page, { deferSave: true });
    await submit(page);
    await releaseApi(page);
    await expect.poll(() => page.evaluate(() => typeof window.__releaseSave)).toBe('function');
    const save = await page.evaluate(() => window.__saves[0]);
    expect(save.args[2]).toBe(A);
    expect(save.activeOwner).toBe(A);
    await changeOwner(page, B);
    await page.evaluate(() => window.__releaseSave());
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(page.locator('#astro-results')).not.toContainText(PRIVATE);
    await expect(page.locator('#favorite-astrocartography-action')).toHaveCount(0);
    expect(await page.evaluate(() => window.__saves)).toHaveLength(1);
});

test('změna cache v jiné kartě zneplatní opožděnou odpověď i při zastaralém Auth', async ({ page }) => {
    await setup(page);
    await submit(page);
    await page.evaluate(({ oldId, newId }) => {
        const oldValue = JSON.stringify({ id: oldId });
        const newValue = JSON.stringify({ id: newId });
        localStorage.setItem('auth_user', newValue);
        window.dispatchEvent(new StorageEvent('storage', { key: 'auth_user', oldValue, newValue, storageArea: localStorage }));
    }, { oldId: A, newId: B });
    await releaseApi(page);
    await expect(page.locator('#astro-results')).not.toContainText(PRIVATE);
    expect(await page.evaluate(() => window.__saves)).toEqual([]);
});

test('skutečná změna v druhé kartě zneplatní čekající výsledek', async ({ page, context }) => {
    await setup(page);
    await submit(page);
    const secondPage = await context.newPage();
    await secondPage.goto('/');
    await page.evaluate(() => {
        window.__astroStorageSeen = new Promise(resolve => {
            window.addEventListener('storage', event => {
                if (event.key === 'auth_user' && JSON.parse(event.newValue || 'null')?.id === 'synthetic-astro-account-b') resolve();
            });
        });
    });
    await secondPage.evaluate(owner => localStorage.setItem('auth_user', JSON.stringify({ id: owner })), B);
    await page.evaluate(() => window.__astroStorageSeen);
    await releaseApi(page);
    await expect(page.locator('#astro-results')).not.toContainText(PRIVATE);
    expect(await page.evaluate(() => window.__saves)).toEqual([]);
    await secondPage.close();
});

test('opožděný profil A po přepnutí na B nevyplní osobní údaje', async ({ page }) => {
    await setup(page);
    await page.locator('#use-profile-astro').check();
    await expect.poll(() => page.evaluate(() => typeof window.__releaseProfile)).toBe('function');
    await changeOwner(page, B);
    await expect(page.locator('#use-profile-astro')).not.toBeChecked();
    await page.evaluate(() => window.__releaseProfile({
        first_name: 'Syntetický profil A', birth_date: '1990-04-15', birth_time: '12:30', birth_place: 'Praha'
    }));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(page.locator('#astro-name')).not.toHaveValue('Syntetický profil A');
    await expect(page.locator('#astro-date')).not.toHaveValue('1990-04-15');
    await expect(page.locator('#astro-time')).not.toHaveValue('12:30');
    await expect(page.locator('#astro-place')).not.toHaveValue('Praha');
});
