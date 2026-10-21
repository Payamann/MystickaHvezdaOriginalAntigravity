import { test, expect } from '@playwright/test';

async function prepare(page, enabled = true, funnelEvents = null, productOverrides = {}) {
    await page.addInitScript(() => {
        localStorage.setItem('mh_cookie_prefs', JSON.stringify({
            analytics: false,
            marketing: false,
            ts: Date.now()
        }));
        localStorage.removeItem('cookieConsent');
    });
    await page.route('**/api/vztahovy-vyklad/product', route => route.fulfill({ json: { enabled, amount: 14900, currency: 'czk', ...productOverrides } }));
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
    await expect(page.locator('.lead')).toContainText('podle tvé otázky z nich automaticky připraví výklad');
    await expect(page.locator('#objednavka')).toContainText('automaticky připraví výklad a pošle ti ho e-mailem');
    await expect(page.locator('#ukazka')).toContainText('Modelové zadání');
    const heroCards = page.locator('.hero-art .card');
    await expect(heroCards).toHaveCount(3);
    for (const img of await heroCards.all()) {
        const imageState = await img.evaluate(el => ({
            loaded: el.complete && el.naturalWidth > 0,
            source: new URL(el.currentSrc).pathname
        }));
        expect(imageState.loaded).toBe(true);
        expect(imageState.source).toMatch(/tarot_(?:milenci|mirnost|spravedlnost)-mobile(?:-480)?\.webp$/);
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
    let releaseCheckout;
    await page.route('**/api/vztahovy-vyklad/checkout', async route => {
        body = route.request().postDataJSON();
        await new Promise(resolve => { releaseCheckout = resolve; });
        await route.fulfill({ status: 502, json: { error: 'Dočasná chyba platby.' } });
    });
    await page.goto('/vztahovy-vyklad.html?source=tarot_yes_no_result');
    await page.locator('#question').fill('Ve vztahu se opakují stejné hádky. Jak začít rozhovor?');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#consent').check();
    await page.locator('#checkout-button').click();
    await expect.poll(() => Boolean(releaseCheckout)).toBe(true);
    await expect(page.locator('#question')).toBeDisabled();
    await expect(page.locator('#email')).toBeDisabled();
    await expect(page.locator('#consent')).toBeDisabled();
    releaseCheckout();
    await expect(page.locator('#form-error')).toHaveText('Dočasná chyba platby.');
    await expect(page.locator('#question')).toHaveValue(body.question);
    await expect(page.locator('#question')).toBeEnabled();
    expect(Object.keys(body).sort()).toEqual(['consent', 'email', 'flowId', 'question', 'source']);
    expect(body.flowId).toMatch(/^[a-z0-9_-]{16,80}$/i);
    await page.reload();
    await expect(page.locator('#question')).toHaveValue(body.question);
    await expect(page.locator('#consent')).not.toBeChecked();
});

test('an expired Stripe window starts a fresh idempotency flow on retry', async ({ page }) => {
    await prepare(page);
    const attempts = [];
    await page.route('**/api/vztahovy-vyklad/checkout', route => {
        attempts.push(route.request().postDataJSON());
        return attempts.length === 1
            ? route.fulfill({ status: 409, json: { code: 'checkout_session_expired', error: 'Předchozí platební okno už vypršelo.' } })
            : route.fulfill({ status: 502, json: { error: 'Dočasná chyba platby.' } });
    });
    await page.goto('/vztahovy-vyklad.html');
    await page.locator('#question').fill('Ve vztahu se opakují stejné hádky. Jak začít rozhovor?');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#consent').check();

    await page.locator('#checkout-button').click();
    await expect(page.locator('#form-error')).toContainText('platební okno už vypršelo');
    await page.locator('#checkout-button').click();
    await expect(page.locator('#form-error')).toHaveText('Dočasná chyba platby.');

    expect(attempts).toHaveLength(2);
    expect(attempts[0].flowId).not.toBe(attempts[1].flowId);
    expect(attempts[0].question).toBe(attempts[1].question);
    expect(attempts[0].email).toBe(attempts[1].email);
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
    await page.route('**/api/vztahovy-vyklad/checkout-result?*', route => paid ? route.fulfill({ json: { status: 'paid', deliveryState: 'delivered', orderRef: 'order-safe-1' } }) : route.fulfill({ status: 502 }));
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

test('a paid delivery failure is explicit and keeps safe support access without retrying payment', async ({ page }, testInfo) => {
    await prepare(page);
    let statusUnavailable = false;
    await page.route('**/api/vztahovy-vyklad/checkout-result?*', route => statusUnavailable
        ? route.fulfill({ status: 502 })
        : route.fulfill({ json: { status: 'paid', deliveryState: 'failed', orderRef: 'order-safe-2' } }));
    await page.goto('/vztahovy-vyklad.html?status=success&session_id=cs_test_private_session');
    await expect(page.locator('#payment-message')).toContainText('doručení výkladu selhalo');
    await expect(page.locator('#payment-message')).toContainText('order-safe-2');
    await expect(page.locator('#retry-payment')).toHaveText('Zkontrolovat stav znovu');
    await expect(page.locator('#retry-payment')).toBeVisible();
    const supportHref = await page.locator('#payment-result a').getAttribute('href');
    expect(supportHref).toBe('/kontakt.html');
    expect(supportHref).not.toContain('cs_test_private_session');
    expect(supportHref).not.toContain('mailto:');
    await page.screenshot({ path: testInfo.outputPath('paid-delivery-failed.png'), fullPage: true });
    statusUnavailable = true;
    await page.locator('#retry-payment').click();
    await expect(page.locator('#payment-message')).toContainText('Platba je potvrzená');
    await expect(page.locator('#payment-message')).toContainText('Stav doručení teď nemůžeme ověřit');
    await expect(page.locator('#payment-message')).toContainText('order-safe-2');
});

test('tarot entry is gated by availability and carries only source in the URL', async ({ page }) => {
    const funnelEvents = [];
    await prepare(page, false, funnelEvents);
    await page.goto('/tarot-laska.html?utm_source=google');
    await expect(page.locator('[data-relationship-offer]')).toBeHidden();
    await prepare(page, true, funnelEvents);
    await page.reload();
    const offer = page.locator('[data-relationship-offer]');
    await expect(offer).toBeVisible();
    await page.evaluate(() => {
        localStorage.setItem('mh_cookie_prefs', JSON.stringify({ analytics: true, marketing: false, ts: Date.now() }));
        window.dispatchEvent(new CustomEvent('mh_cookie_consent', { detail: { analytics: true, marketing: false } }));
    });
    await offer.locator('a').click();
    await expect(page).toHaveURL(/vztahovy-vyklad.html\?source=tarot_love_landing$/);
    await expect(page.locator('#checkout-button')).toBeEnabled();
    await expect.poll(() => funnelEvents.some(event => event.eventName === 'one_time_product_cta_clicked'
        && event.metadata?.acquisition_channel === 'google')).toBe(true);
});

test('yes/no free result leads to the one-time relationship offer without a membership upsell', async ({ page }) => {
    const funnelEvents = [];
    await prepare(page, true, funnelEvents);
    await page.addInitScript(() => {
        sessionStorage.setItem('mh_relationship_draft', JSON.stringify({ question: 'Staré zadání, které již nechci řešit.', at: Date.now() }));
    });
    await page.goto('/tarot-ano-ne.html?intent=relationship_yes_no');
    await expect(page.locator('[data-relationship-offer]')).not.toHaveAttribute('hidden');
    await page.evaluate(() => {
        window.relationshipQAEvents = [];
        window.MH_ANALYTICS.trackAction = name => window.relationshipQAEvents.push(name);
        window.MH_ANALYTICS.trackEvent = (name, metadata) => window.relationshipQAEvents.push({ name, metadata });
    });
    const question = 'Jak mám otevřít rozhovor s partnerem o tom, co mi ve vztahu chybí?';
    await page.locator('#question-input').fill(question);
    await page.locator('.tarot-card').first().click();
    const offer = page.locator('[data-relationship-offer]');
    await expect(offer).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-tarot-member-continuation]')).toBeHidden();
    await expect(page.locator('[data-relationship-legacy]')).toHaveCount(0);
    await expect(page.locator('#result-text')).not.toBeEmpty();
    await expect(offer.locator('[data-relationship-question]')).toContainText(question);
    await expect(offer.locator('.relationship-offer__preview')).toContainText('UKÁZKA PODOBY VÝKLADU');
    await expect(offer.locator('.relationship-offer__preview-list')).toContainText('Blízkost, ve které může zaznít i nesouhlas.');
    await expect(offer.locator('.relationship-offer__preview-note')).toContainText('Modelový příklad pro otázku o opakovaných hádkách.');
    await expect(offer).toContainText('Na další stránce si nejprve prohlédneš ukázku');
    await expect(offer).toContainText('vznikne automaticky podle otázky a tří náhodně vybraných karet');
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
    await page.locator('#question').fill('Chci si ujasnit, jak nastavit zdravější hranice.');
    await expect(page.locator('#continuation-context')).toBeHidden();
    await expect(page.locator('#continuation-card-image')).toBeHidden();
    await expect(page.locator('[data-reading-cta-label]')).toHaveText('Chci svůj výklad');
    await expect.poll(() => funnelEvents.some(event => event.eventName === 'one_time_product_cta_clicked' && event.metadata?.funnel_step === 'entry_offer')).toBe(true);
    expect(JSON.stringify(funnelEvents)).not.toContain(question);
    expect(funnelEvents.every(event => !Object.hasOwn(event.metadata || {}, 'acquisition_channel'))).toBe(true);
});

test('yes/no remains free without the optional offer, including keyboard use and reset', async ({ page }) => {
    await prepare(page, false);
    await page.goto('/tarot-ano-ne.html?intent=relationship_yes_no');
    const card = page.getByRole('button', { name: 'Karta 1', exact: true });
    await card.press('Enter');
    await expect(page.locator('#question-error')).toBeVisible();
    await expect(page.locator('#question-input')).toBeFocused();
    await page.locator('#question-input').fill('Mám dnes udělat tenhle malý krok?');
    await card.press('Space');
    await expect(page.locator('#result-title')).toBeFocused();
    await expect(page.locator('#question-error')).toBeHidden();
    await expect(page.locator('#result-next-step-text')).not.toBeEmpty();
    await expect(page.locator('#result-panel')).toBeVisible();
    await expect(page.locator('[data-relationship-offer="tarot_yes_no_result"]')).toBeHidden();
    await expect(page.locator('[data-tarot-member-continuation]')).toBeHidden();
    await expect(page.locator('[data-relationship-legacy]')).toHaveCount(0);
    await expect(page.locator('#result-panel')).not.toContainText('199 Kč/měsíc');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#btn-reset').click();
    await expect(page.locator('#result-panel')).toBeHidden();
    await expect(page.locator('#question-input')).toBeFocused();
    await expect(page.locator('#question-input')).toHaveValue('');
    await expect(card).not.toHaveAttribute('aria-disabled');
});

test('generic yes/no intent does not show a relationship offer', async ({ page }) => {
    await prepare(page, true);
    await page.goto('/tarot-ano-ne.html?intent=yes_no');
    await page.locator('#question-input').fill('Mám si na tento krok vyhradit čas?');
    await page.locator('.tarot-card').first().click();

    await expect(page.locator('#result-panel')).toBeVisible();
    await expect(page.locator('[data-relationship-offer="tarot_yes_no_result"]')).toBeHidden();
    await expect(page.locator('[data-tarot-member-continuation]')).toBeHidden();
});

for (const invalidProduct of [
    { amount: 19900, currency: 'czk' },
    { amount: 14900, currency: 'eur' }
]) {
    test(`yes/no offer stays hidden unless the API confirms 149 Kč in CZK (${invalidProduct.amount} ${invalidProduct.currency})`, async ({ page }) => {
        await prepare(page, true, null, invalidProduct);
        await page.goto('/tarot-ano-ne.html?intent=relationship_yes_no');
        await page.locator('#question-input').fill('Mám si na rozhovor nechat ještě chvíli?');
        await page.locator('.tarot-card').first().click();

        await expect(page.locator('#result-panel')).toBeVisible();
        await expect(page.locator('[data-relationship-offer="tarot_yes_no_result"]')).toBeHidden();
        await expect(page.locator('[data-tarot-member-continuation]')).toBeHidden();
        await expect(page.locator('#result-panel')).not.toContainText('199 Kč/měsíc');
    });
}

test('active members keep a direct three-card continuation without another checkout', async ({ page }) => {
    await prepare(page, false);
    await page.goto('/tarot-ano-ne.html?intent=yes_no');
    await page.evaluate(() => {
        document.cookie = 'logged_in=1; path=/';
        const user = {
            id: 'tarot-yes-no-member-user',
            email: 'member@example.test',
            role: 'user',
            subscription_status: 'premium'
        };
        localStorage.setItem('auth_user', JSON.stringify(user));
        window.Auth.user = user;
    });
    await page.locator('#question-input').fill('Mám otevřít rozhovor o společném čase?');
    await page.locator('.tarot-card').first().click();

    const continuation = page.locator('[data-tarot-member-continuation]');
    await expect(continuation).toBeVisible();
    await continuation.locator('a').click();
    await expect(page).toHaveURL(/\/tarot\.html\?/);
    const destination = new URL(page.url());
    expect(destination.searchParams.get('resume')).toBe('tarot_yes_no');
    expect(destination.searchParams.get('source')).toBe('tarot_yes_no_premium_resume');
    expect(destination.pathname).not.toBe('/cenik.html');
    expect(JSON.parse(await page.evaluate(() => localStorage.getItem('mh_tarot_yes_no_upgrade_context'))).question)
        .toBe('Mám otevřít rozhovor o společném čase?');
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
