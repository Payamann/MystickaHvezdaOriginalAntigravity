// Návrh pro tests/e2e/relationship-draft-expiry.spec.js v release worktree.
import { test, expect } from '@playwright/test';

test('obnovení neprodlužuje životnost draftu a odeslání zachová flow', async ({ page }) => {
    const start = Date.UTC(2026, 10, 10, 10);
    const question = 'Jak mohu v našem vztahu lépe komunikovat o důležitých věcech?';
    const email = 'synthetic-draft@example.test';
    const requests = [];
    await page.addInitScript(initialTime => {
        const stored = localStorage.getItem('e2e_relationship_now');
        Date.now = () => stored === null ? initialTime : Number(stored);
        localStorage.setItem('mh_cookie_prefs', JSON.stringify({ analytics: false, marketing: false }));
        localStorage.removeItem('auth_user');
        document.cookie = 'logged_in=; Max-Age=0; path=/';
    }, start);
    await page.route('**/api/vztahovy-vyklad/product', route => route.fulfill({
        status: 200, json: { enabled: true, amount: 14900, currency: 'czk' }
    }));
    await page.route('**/api/csrf-token', route => route.fulfill({ status: 200, json: { csrfToken: 'synthetic-csrf' } }));
    await page.route('**/api/payment/funnel-event', route => route.fulfill({ status: 204, body: '' }));
    await page.route('**/api/vztahovy-vyklad/checkout', route => {
        requests.push(route.request().postDataJSON());
        return route.fulfill({ status: 502, json: { error: 'Syntetická chyba checkoutu.' } });
    });
    await page.goto('/vztahovy-vyklad.html');
    await expect(page.locator('#checkout-button')).toBeEnabled();
    await page.locator('#question').fill(question);
    await page.locator('#email').fill(email);
    await page.locator('#consent').check();
    await page.locator('#checkout-button').click();
    await expect(page.locator('#form-error')).toHaveText('Syntetická chyba checkoutu.');
    expect(requests).toHaveLength(1);
    const flow = requests[0].flowId;
    expect(flow).toMatch(/^[a-z0-9_-]{16,80}$/i);
    const draft = () => page.evaluate(() => JSON.parse(sessionStorage.getItem('mh_relationship_draft') || 'null'));
    expect(await draft()).toMatchObject({ at: start, flowId: flow, question, email });

    for (const minutes of [10, 20]) {
        await page.evaluate(now => localStorage.setItem('e2e_relationship_now', String(now)), start + minutes * 60_000);
        await page.reload();
        await expect(page.locator('#question')).toHaveValue(question);
        await expect(page.locator('#email')).toHaveValue(email);
        expect(await draft()).toMatchObject({ at: start, flowId: flow });
    }

    const retryTime = start + 30 * 60_000;
    await page.evaluate(now => localStorage.setItem('e2e_relationship_now', String(now)), retryTime);
    await page.reload();
    await expect(page.locator('#question')).toHaveValue('');
    await expect(page.locator('#email')).toHaveValue('');
    expect(await draft()).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem('mh_relationship_flow_id'))).toBe(flow);

    await expect(page.locator('#checkout-button')).toBeEnabled();
    await page.locator('#question').fill(question);
    await page.locator('#email').fill(email);
    await page.locator('#consent').check();
    await page.locator('#checkout-button').click();
    await expect(page.locator('#form-error')).toHaveText('Syntetická chyba checkoutu.');
    expect(requests).toHaveLength(2);
    expect(requests[1]).toEqual(requests[0]);
    expect(await draft()).toMatchObject({ at: retryTime, flowId: flow, question, email });
});
