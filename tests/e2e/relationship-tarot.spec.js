import { test, expect } from '@playwright/test';

async function prepare(page, enabled = true, funnelEvents = null) {
    await page.addInitScript(() => {
        localStorage.setItem('mh_cookie_prefs', JSON.stringify({
            analytics: false,
            marketing: false,
            ts: Date.now()
        }));
        localStorage.removeItem('cookieConsent');
    });
    await page.route('**/api/vztahovy-vyklad/product', route => route.fulfill({ json: { enabled, amount: 14900, currency: 'czk' } }));
    await page.route('**/api/payment/funnel-event', route => {
        if (funnelEvents) funnelEvents.push(route.request().postDataJSON());
        return route.fulfill({ json: { success: true } });
    });
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
    expect(Object.keys(body).sort()).toEqual(['consent', 'email', 'flowId', 'question', 'source']);
    expect(body.flowId).toMatch(/^[a-z0-9_-]{16,80}$/i);
    await page.reload();
    await expect(page.locator('#question')).toHaveValue(body.question);
    await expect(page.locator('#consent')).not.toBeChecked();
});

test('only a verified payment shows success; errors offer retry without another payment', async ({ page }) => {
    await prepare(page);
    let paid = false;
    await page.addInitScript(() => {
        window.verifiedPurchases = [];
        document.addEventListener('DOMContentLoaded', () => {
            const analytics = window.MH_ANALYTICS;
            if (!analytics) return;
            analytics.trackPurchaseCompleted = (...args) => window.verifiedPurchases.push(args);
        });
    });
    await page.route('**/api/vztahovy-vyklad/checkout-result?*', route => paid ? route.fulfill({ json: { status: 'paid' } }) : route.fulfill({ status: 502 }));
    await page.goto('/vztahovy-vyklad.html?status=success&session_id=cs_test_example');
    await expect(page.locator('#payment-message')).toContainText('nemůžeme ověřit');
    await expect(page.locator('#objednavka')).toBeHidden();
    paid = true;
    await page.locator('#retry-payment').click();
    await expect(page.locator('#payment-message')).toContainText('Platba je potvrzená');
    await expect(page.locator('#retry-payment')).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.verifiedPurchases)).toContainEqual([
        'relationship_tarot',
        149,
        'CZK',
        expect.objectContaining({ verified: true, transaction_id: 'cs_test_example' })
    ]);
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
    const funnelEvents = [];
    await prepare(page, true, funnelEvents);
    await page.addInitScript(() => {
        sessionStorage.setItem('mh_relationship_draft', JSON.stringify({ question: 'Staré zadání, které již nechci řešit.', at: Date.now() }));
    });
    await page.goto('/tarot-ano-ne.html');
    await expect(page.locator('[data-relationship-offer]')).not.toHaveAttribute('hidden');
    await page.evaluate(() => {
        window.relationshipQAEvents = [];
        window.MH_ANALYTICS.trackAction = name => window.relationshipQAEvents.push(name);
        window.MH_ANALYTICS.trackEvent = (name, metadata) => window.relationshipQAEvents.push({ name, metadata });
    });
    const question = 'Jak mám otevřít rozhovor o tom, co mi ve vztahu chybí?';
    await page.locator('#question-input').fill(question);
    await page.locator('.tarot-card').first().click();
    const offer = page.locator('[data-relationship-offer]');
    await expect(offer).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-relationship-legacy]')).toBeHidden();
    await expect(page.locator('#result-text')).not.toBeEmpty();
    await expect(offer.locator('[data-relationship-question]')).toContainText(question);
    await expect(offer.locator('.relationship-offer__preview')).toContainText('UKÁZKA PODOBY VÝKLADU');
    await expect(offer.locator('.relationship-offer__preview-list')).toContainText('Blízkost, ve které může zaznít i nesouhlas.');
    await expect(offer.locator('.relationship-offer__preview-note')).toContainText('Modelový příklad pro otázku o opakovaných hádkách.');
    await expect(offer).toContainText('Nejdřív si prohlédneš ukázku výkladu');
    const cardName = await page.locator('#result-card-name').textContent();
    const answerLabel = await page.locator('#result-title').textContent();
    expect(await page.evaluate(() => window.relationshipQAEvents)).not.toContain('tarot_yes_no_upgrade_bridge_viewed');
    await offer.scrollIntoViewIfNeeded();
    await expect.poll(() => funnelEvents.filter(event => event.eventName === 'one_time_offer_viewed'
        && event.metadata?.feature === 'relationship_tarot'
        && event.metadata?.funnel_step === 'entry_offer').length).toBe(1);
    await offer.locator('a').click();
    await expect(page).toHaveURL(/vztahovy-vyklad.html\?source=tarot_yes_no_result$/);
    await expect(page.locator('#question')).toHaveValue(question);
    await expect(page.locator('#continuation-context')).toBeVisible();
    await expect(page.locator('#continuation-question')).toContainText(question);
    await expect(page.locator('#continuation-result')).toContainText(cardName);
    await expect(page.locator('#continuation-result')).toContainText(answerLabel);
    await expect(page.locator('[data-reading-cta-label]')).toHaveText('Rozvinout mou otázku');
    await expect.poll(() => funnelEvents.some(event => event.eventName === 'one_time_product_cta_clicked' && event.metadata?.funnel_step === 'entry_offer')).toBe(true);
    expect(JSON.stringify(funnelEvents)).not.toContain(question);
});

test('yes/no works with the keyboard, explains missing input and resets cleanly', async ({ page }) => {
    await prepare(page);
    await page.goto('/tarot-ano-ne.html');
    const card = page.getByRole('button', { name: 'Karta 1', exact: true });
    await card.press('Enter');
    await expect(page.locator('#question-error')).toBeVisible();
    await expect(page.locator('#question-input')).toBeFocused();
    await page.locator('#question-input').fill('Mám dnes otevřít rozhovor o společném čase?');
    await card.press('Space');
    await expect(page.locator('#result-title')).toBeFocused();
    await expect(page.locator('#question-error')).toBeHidden();
    await expect(page.locator('#result-next-step-text')).not.toBeEmpty();
    await expect(page.locator('[data-relationship-offer]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#btn-reset').click();
    await expect(page.locator('#result-panel')).toBeHidden();
    await expect(page.locator('#question-input')).toBeFocused();
    await expect(page.locator('#question-input')).toHaveValue('');
    await expect(card).not.toHaveAttribute('aria-disabled');
});

for (const available of [true, false]) {
    test(`single-card reading stays free and its personal offer respects availability=${available}`, async ({ page }) => {
        await prepare(page, available);
        await page.goto('/tarot.html');
        await expect(page.locator('[data-relationship-offer]')).toHaveCount(0);
        await page.locator('[data-spread-type="Jedna karta"]').click();
        await expect(page.locator('#interpretations-container')).not.toBeEmpty({ timeout: 15000 });
        const offer = page.locator('#tarot-results [data-relationship-offer]');
        await expect(offer).toHaveCount(1);
        if (available) {
            await expect(offer).toBeVisible();
            await offer.locator('a').click();
            await expect(page).toHaveURL(/vztahovy-vyklad.html\?source=tarot_single_card_result$/);
            await expect(page.locator('#checkout-button')).toBeEnabled();
        } else {
            await expect(offer).toBeHidden();
            await expect(page.locator('#tarot-results')).toBeVisible();
        }
    });
}

test('free landing offers a direct paid path with the price shown before navigation', async ({ page }) => {
    await prepare(page);
    await page.goto('/tarot-zdarma.html');
    const offer = page.locator('[data-relationship-offer]');
    await expect(offer).toContainText('149 Kč');
    await expect(offer).toContainText('Jednorázově');
    await offer.locator('a').click();
    await expect(page).toHaveURL(/vztahovy-vyklad.html\?source=tarot_free_landing$/);
});
