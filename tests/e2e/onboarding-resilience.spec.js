import { test, expect } from '@playwright/test';

async function prepare(page, failure) {
    await page.route('**/api/csrf-token', route => route.fulfill({
        status: 200, contentType: 'application/json', body: '{"csrfToken":"onboarding-test-token"}'
    }));
    await page.route('**/api/auth/onboarding/complete', route => route.fulfill({
        status: 200, contentType: 'application/json', body: '{"success":true}'
    }));
    await page.addInitScript((mode) => {
        if (location.pathname !== '/onboarding.html') return;
        if (mode === 'storage') {
            Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage denied'); } });
        } else if (mode === 'quota') {
            Storage.prototype.setItem = () => { throw new Error('Quota exceeded'); };
        } else if (mode === 'null') {
            localStorage.setItem('mh_user_prefs', 'null');
        }
    }, failure);
}

for (const failure of ['storage', 'quota', 'null']) {
    test(`quick onboarding reaches first result with ${failure}`, async ({ page }) => {
        await prepare(page, failure);
        await page.goto('/onboarding.html');
        await page.locator('.zodiac-btn[data-sign="beran"]').click();
        await expect(page.locator('#quick-finish-onboarding-btn')).toBeEnabled();
        await page.locator('#quick-finish-onboarding-btn').click();
        await expect(page).toHaveURL(/horoskopy\.html.*sign=beran/);
    });
}

for (const failure of ['throw', 'reject', 'hang', 'csrf']) {
    test(`guided onboarding reaches first result with ${failure} telemetry or token`, async ({ page }) => {
        await prepare(page);
        await page.goto('/onboarding.html?flow=guided');
        await page.evaluate(mode => {
            window.MH_ANALYTICS = { trackEvent() {
                if (mode === 'throw') throw new Error('Telemetry unavailable');
                if (mode === 'reject') return Promise.reject(new Error('Telemetry unavailable'));
                return new Promise(() => {});
            } };
            if (mode === 'csrf') window.getCSRFToken = () => new Promise(() => {});
        }, failure);
        await page.locator('#step-1 [data-action="goStep"][data-step="2"]').click();
        await page.locator('.zodiac-btn[data-sign="beran"]').click();
        await page.locator('#btn-step2').click();
        await page.locator('#finish-onboarding-btn').click();
        await expect(page).toHaveURL(/horoskopy\.html.*sign=beran/, { timeout: 6000 });
    });
}

test('skip survives blocked storage and preserves plan without forcing checkout', async ({ page }) => {
    await prepare(page, 'storage');
    await page.goto('/onboarding.html?plan=pruvodce&redirect=%2Fcenik.html&flow=guided');
    await page.locator('[data-action="skipOnboarding"]').first().click();
    await expect(page).toHaveURL(/horoskopy\.html/);
    expect(new URL(page.url()).searchParams.get('plan')).toBe('pruvodce');
    expect(new URL(page.url()).pathname).not.toBe('/cenik.html');
});

test('paid completion survives blocked storage and reports the actual return target once', async ({ page }) => {
    await prepare(page, 'storage');
    const completions = [];
    await page.route('**/api/auth/onboarding/complete', route => {
        completions.push(route.request().postDataJSON());
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    });
    await page.goto('/onboarding.html?flow=guided&plan=pruvodce&redirect=%2Fcenik.html&source=pricing');
    await page.evaluate(() => { window.getCSRFToken = async () => 'onboarding-test-token'; });
    await page.locator('#step-1 [data-action="goStep"][data-step="2"]').click();
    await page.locator('.zodiac-btn[data-sign="beran"]').click();
    await page.locator('#btn-step2').click();
    await page.locator('#finish-onboarding-btn').evaluate(button => { button.click(); button.click(); });
    await expect(page).toHaveURL(/cenik\.html/);
    expect(new URL(page.url()).searchParams.get('plan')).toBe('pruvodce');
    expect(completions).toHaveLength(1);
    expect(new URL(completions[0].destination, page.url()).pathname).toBe('/cenik.html');
    expect(completions[0].skipped).toBe(false);
});

test('stalled completion request cannot hold the first result hostage', async ({ page }) => {
    await prepare(page);
    await page.goto('/onboarding.html');
    await page.evaluate(() => {
        window.getCSRFToken = async () => 'test-token';
        const originalFetch = window.fetch;
        window.fetch = (...args) => String(args[0]).includes('/auth/onboarding/complete')
            ? new Promise(() => {}) : originalFetch(...args);
    });
    await page.locator('.zodiac-btn[data-sign="beran"]').click();
    await page.locator('#quick-finish-onboarding-btn').click();
    await expect(page).toHaveURL(/horoskopy\.html.*sign=beran/, { timeout: 6000 });
});
