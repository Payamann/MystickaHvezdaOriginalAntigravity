import { test, expect } from '@playwright/test';

async function prepare(page, enabled = true) {
    await page.route('**/api/vztahovy-vyklad/product', route => route.fulfill({ json: { enabled, amount: 14900, currency: 'czk' } }));
    await page.route('**/api/payment/funnel-event', route => route.fulfill({ json: { success: true } }));
}

test('sample, images, legal links and mobile layout are usable before purchase', async ({ page, request }, testInfo) => {
    await prepare(page, false);
    await page.goto('/vztahovy-vyklad.html');
    await expect(page.locator('#availability')).toContainText('zatím nejsou spuštěné');
    await expect(page.locator('#checkout-button')).toBeDisabled();
    await expect(page.locator('#ukazka')).toContainText('Modelové zadání');
    for (const img of await page.locator('.hero-art img').all()) {
        expect(await img.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
    }
    for (const href of ['/podminky.html', '/soukromi.html', '/kontakt.html']) {
        expect((await request.get(href)).status()).toBe(200);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('relationship-page.png'), fullPage: true });
});

test('checkout sends only required fields and preserves input after a failure', async ({ page }) => {
    await prepare(page);
    let body;
    await page.route('**/api/vztahovy-vyklad/checkout', route => { body = route.request().postDataJSON(); return route.fulfill({ status: 502, json: { error: 'Dočasná chyba platby.' } }); });
    await page.goto('/vztahovy-vyklad.html?source=tarot_yes_no_result');
    await page.locator('#question').fill('Ve vztahu se opakují stejné hádky. Jak začít rozhovor?');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#consent').check();
    await page.locator('#checkout-button').click();
    await expect(page.locator('#form-error')).toHaveText('Dočasná chyba platby.');
    await expect(page.locator('#question')).toHaveValue(body.question);
    expect(Object.keys(body).sort()).toEqual(['consent', 'email', 'question', 'source']);
    await page.reload();
    await expect(page.locator('#question')).toHaveValue(body.question);
    await expect(page.locator('#consent')).not.toBeChecked();
});

test('only a verified payment shows success; errors offer retry without another payment', async ({ page }) => {
    await prepare(page);
    let paid = false;
    await page.route('**/api/vztahovy-vyklad/checkout-result?*', route => paid ? route.fulfill({ json: { status: 'paid' } }) : route.fulfill({ status: 502 }));
    await page.goto('/vztahovy-vyklad.html?status=success&session_id=cs_test_example');
    await expect(page.locator('#payment-message')).toContainText('nemůžeme ověřit');
    await expect(page.locator('#objednavka')).toBeHidden();
    paid = true;
    await page.locator('#retry-payment').click();
    await expect(page.locator('#payment-message')).toContainText('Platba je potvrzená');
    await expect(page.locator('#retry-payment')).toBeHidden();
});

test('tarot entry is gated by availability and carries only source in the URL', async ({ page }) => {
    await prepare(page, false);
    await page.goto('/tarot-laska.html');
    await expect(page.locator('[data-relationship-offer]')).toBeHidden();
    await prepare(page, true);
    await page.reload();
    const offer = page.locator('[data-relationship-offer]');
    await expect(offer).toBeVisible();
    await offer.locator('a').click();
    await expect(page).toHaveURL(/vztahovy-vyklad.html\?source=tarot_love_landing$/);
    await expect(page.locator('#checkout-button')).toBeEnabled();
});

test('yes/no free result leads to the new question, without counting the hidden membership offer', async ({ page }) => {
    await prepare(page);
    await page.addInitScript(() => {
        sessionStorage.setItem('mh_relationship_draft', JSON.stringify({ question: 'Staré zadání, které již nechci řešit.', at: Date.now() }));
    });
    await page.goto('/tarot-ano-ne.html');
    await expect(page.locator('[data-relationship-offer]')).not.toHaveAttribute('hidden');
    await page.evaluate(() => {
        window.relationshipQAEvents = [];
        window.MH_ANALYTICS.trackAction = name => window.relationshipQAEvents.push(name);
    });
    const question = 'Jak mám otevřít rozhovor o tom, co mi ve vztahu chybí?';
    await page.locator('#question-input').fill(question);
    await page.locator('.tarot-card').first().click();
    const offer = page.locator('[data-relationship-offer]');
    await expect(offer).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-relationship-legacy]')).toBeHidden();
    await expect(page.locator('#result-text')).not.toBeEmpty();
    expect(await page.evaluate(() => window.relationshipQAEvents)).not.toContain('tarot_yes_no_upgrade_bridge_viewed');
    await offer.locator('a').click();
    await expect(page).toHaveURL(/vztahovy-vyklad.html\?source=tarot_yes_no_result$/);
    await expect(page.locator('#question')).toHaveValue(question);
});
