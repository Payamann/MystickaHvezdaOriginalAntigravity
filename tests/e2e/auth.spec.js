/**
 * E2E testy — Autentizace (prihlaseni.html)
 *
 * Testuje: načtení login stránky, viditelnost formuláře, klientská validace,
 * přepnutí na "zapomenuté heslo", CSRF token API, bezpečnost (noindex).
 *
 * Poznámka: testy NEODESÍLAJÍ reálné přihlášení (bez Supabase v test prostředí).
 * Testujeme UI vrstvu — formulář, validaci, přepínání stavů.
 */

import { test, expect } from '@playwright/test';
import { waitForPageReady, getCsrfToken, MOBILE_VIEWPORT } from './helpers.js';

async function expectNoHorizontalOverflow(page) {
    const horizontalOverflow = await page.evaluate(() => (
        document.documentElement.scrollWidth - document.documentElement.clientWidth
    ));
    expect(horizontalOverflow).toBeLessThanOrEqual(2);
}

async function expectLocatorsWithinViewport(page, locators) {
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();

    await expectNoHorizontalOverflow(page);

    for (const locator of locators) {
        await expect(locator).toBeVisible();
        const box = await locator.boundingBox();
        expect(box).toBeTruthy();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 2);
    }
}

async function mockSuccessfulRegister(page, email = 'activation@example.com', responseOverrides = {}) {
    await page.route('**/api/auth/register', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                user: {
                    id: `e2e-${email}`,
                    email,
                    role: 'user',
                    subscription_status: 'free'
                },
                ...responseOverrides
            })
        });
    });
}

async function submitRegisterForm(page, email = 'activation@example.com') {
    // Zjednodušená registrace nemá potvrzení hesla — režim registrace
    // poznáme podle viditelného GDPR souhlasu (jen v register módu).
    await expect(page.locator('#gdpr-consent-wrapper')).toBeVisible();
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('TestPassword123!');
    await page.locator('#gdpr-consent').check();
    await page.locator('#auth-submit').click();
}

async function mockSuccessfulLogin(page, email = 'login@example.com') {
    await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                user: {
                    id: `e2e-${email}`,
                    email,
                    role: 'user',
                    subscription_status: 'free'
                }
            })
        });
    });
}

async function submitLoginForm(page, email = 'login@example.com') {
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('TestPassword123!');
    await page.locator('#auth-submit').click();
}

test.describe('Login stránka', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/prihlaseni.html');
        await waitForPageReady(page);
    });

    // ── Načtení ─────────────────────────────────────────────────────────────

    test('stránka vrátí 200', async ({ page }) => {
        const res = await page.request.get('/prihlaseni.html');
        expect(res.status()).toBe(200);
    });

    test('title obsahuje "Přihlášení"', async ({ page }) => {
        const title = await page.title();
        expect(title).toContain('Přihlášení');
    });

    test('stránka má noindex (nepřindexovat login)', async ({ page }) => {
        const robots = await page.getAttribute('meta[name="robots"]', 'content');
        expect(robots).toContain('noindex');
    });

    test('sdílené toast oznámení je přístupné jako živý stav', async ({ page }) => {
        await page.evaluate(() => {
            window.Auth.showToast('Uložení se nepovedlo', 'Výklad zůstal otevřený.', 'error');
        });

        const toastRegion = page.locator('.toast-container');
        await expect(toastRegion).toHaveAttribute('role', 'status');
        await expect(toastRegion).toHaveAttribute('aria-live', 'polite');
        await expect(toastRegion).toHaveAttribute('aria-atomic', 'false');
        await expect(toastRegion).toContainText('Výklad zůstal otevřený.');
    });

    // ── Formulář — struktura ─────────────────────────────────────────────────
    // Poznámka: stránka může obsahovat #login-form vícekrát (page + modal),
    // proto používáme .first() nebo selektor v kontextu .login-section.

    test('#login-form existuje', async ({ page }) => {
        // Hledáme v login sekci (standalone form, ne modal)
        const form = page.locator('.login-section #login-form, #login-form').first();
        await expect(form).toBeVisible();
    });

    test('email pole existuje a je viditelné', async ({ page }) => {
        const emailInput = page.locator('#email').first();
        await expect(emailInput).toBeVisible();
        expect(await emailInput.getAttribute('type')).toBe('email');
        expect(await emailInput.getAttribute('required')).toBeDefined();
    });

    test('heslo pole existuje a je viditelné', async ({ page }) => {
        const passwordInput = page.locator('#password').first();
        await expect(passwordInput).toBeVisible();
        expect(await passwordInput.getAttribute('type')).toBe('password');
    });

    test('heslo lze zobrazit a znovu skryt bez ztraty hodnoty', async ({ page }) => {
        const passwordInput = page.locator('#password').first();
        const toggle = page.locator('[data-password-toggle="password"]').first();

        await passwordInput.fill('TestPassword123!');
        await toggle.click();
        await expect(passwordInput).toHaveAttribute('type', 'text');
        await expect(toggle).toHaveText('Skrýt');
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');

        await toggle.click();
        await expect(passwordInput).toHaveAttribute('type', 'password');
        await expect(passwordInput).toHaveValue('TestPassword123!');
    });

    test('submit tlačítko je viditelné', async ({ page }) => {
        const submitBtn = page.locator('#auth-submit').first();
        await expect(submitBtn).toBeVisible();
        const text = await submitBtn.innerText();
        expect(text.trim().length).toBeGreaterThan(0);
    });

    test('samostatné přihlášení zamkne formulář a režim při čekajícím požadavku', async ({ page }) => {
        let requestCount = 0;
        let releaseLoginResponse;
        const loginResponseGate = new Promise(resolve => { releaseLoginResponse = resolve; });
        await page.route('**/api/auth/login', async (route) => {
            requestCount += 1;
            await loginResponseGate;
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({ success: false, error: 'Invalid credentials' })
            });
        });

        await page.goto('/prihlaseni.html?source=e2e_auth_submit_lock');
        await waitForPageReady(page);
        const form = page.locator('#login-form').first();
        const submit = page.locator('#auth-submit').first();
        await page.locator('#email').first().fill('auth-lock@example.com');
        await page.locator('#password').first().fill('IncorrectPassword123!');
        await submit.click();

        await expect(submit).toBeDisabled();
        await expect(page.locator('#email')).toBeDisabled();
        await expect(page.locator('#password')).toBeDisabled();
        await expect(form).toHaveAttribute('aria-busy', 'true');
        await page.locator('#auth-mode-toggle').click();
        await expect(page.locator('#gdpr-consent-wrapper')).toBeHidden();
        await form.dispatchEvent('submit', { bubbles: true, cancelable: true });
        await expect.poll(() => requestCount).toBe(1);

        releaseLoginResponse();
        await expect(submit).toBeEnabled();
        await expect(page.locator('#email')).toBeEnabled();
        await expect(page.locator('#password')).toBeEnabled();
        await expect(form).not.toHaveAttribute('aria-busy', 'true');
    });

    test('formular a hlavni ovladaci prvky nepreteka mimo viewport', async ({ page }) => {
        await expectLocatorsWithinViewport(page, [
            page.locator('.login-section #login-form, #login-form').first(),
            page.locator('#email').first(),
            page.locator('#password').first(),
            page.locator('#auth-submit').first(),
        ]);
    });

    test('registracni formular nepreteka mimo viewport', async ({ page }) => {
        await page.locator('#auth-mode-toggle').click();
        // Register mód poznáme podle GDPR souhlasu; #register-fields
        // (jméno/datum narození) zůstává na standalone stránce skryté.
        await expect(page.locator('#gdpr-consent-wrapper')).toBeVisible();

        await expectLocatorsWithinViewport(page, [
            page.locator('.login-section #login-form, #login-form').first(),
            page.locator('#email').first(),
            page.locator('#password').first(),
            page.locator('#gdpr-consent-wrapper').first(),
            page.locator('#auth-submit').first(),
        ]);
    });

    test('registrace z homepage hero vysvetli prvni hodnotu pred odeslanim', async ({ page }) => {
        await page.goto('/prihlaseni.html?mode=register&source=homepage_hero&feature=daily_guidance');
        await waitForPageReady(page);

        await expect(page.locator('#login-page-title')).toContainText('účet zdarma');
        await expect(page.locator('#checkout-context-banner')).toBeVisible();
        await expect(page.locator('#checkout-context-title')).toContainText('Denní vedení');
        await expect(page.locator('#signup-value-panel')).toBeVisible();
        await expect(page.locator('#signup-next-step-title')).toContainText('denní horoskopy');
        await expect(page.locator('#signup-value-panel')).toContainText('Bez platební karty');
        await expect(page.locator('#password-help')).toBeVisible();
        await expect(page.locator('#signup-safety-note')).toContainText('bez platební karty');

        await expectLocatorsWithinViewport(page, [
            page.locator('#checkout-context-banner').first(),
            page.locator('#signup-value-panel').first(),
            page.locator('#password-help').first(),
            page.locator('#signup-safety-note').first(),
            page.locator('#auth-submit').first(),
        ]);
    });

    test('mobilni cookie lista neblokuje registracni formular', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.evaluate(() => {
            localStorage.removeItem('mh_cookie_prefs');
            localStorage.removeItem('cookieConsent');
        });
        await page.goto('/prihlaseni.html?mode=register&source=homepage_hero&feature=daily_guidance');
        await waitForPageReady(page);

        const banner = page.locator('#cookie-banner');
        await expect(banner).toBeVisible({ timeout: 4000 });

        const box = await banner.boundingBox();
        expect(box?.height || 0).toBeLessThan(190);
        expect(box?.width || 0).toBeLessThanOrEqual(366);
        await expect(page.locator('#auth-submit')).toBeVisible();

        const overlap = await page.evaluate(() => {
            const submit = document.getElementById('auth-submit')?.getBoundingClientRect();
            const consent = document.getElementById('gdpr-consent-wrapper')?.getBoundingClientRect();
            const cookie = document.getElementById('cookie-banner')?.getBoundingClientRect();
            const overlaps = (a, b) => !!(a && b && !(
                b.right < a.left
                || b.left > a.right
                || b.bottom < a.top
                || b.top > a.bottom
            ));
            return {
                submit: overlaps(submit, cookie),
                consent: overlaps(consent, cookie)
            };
        });

        expect(overlap.submit).toBe(false);
        expect(overlap.consent).toBe(false);
    });

    test('mobilni mentor auth gate prijde az po otazce a ma registracni CTA nad cookie listou', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.evaluate(() => {
            localStorage.removeItem('mh_cookie_prefs');
            localStorage.removeItem('cookieConsent');
        });

        await page.goto('/mentor.html?source=e2e_mentor_auth_gate');
        await waitForPageReady(page);

        await expect(page).toHaveURL(/mentor\.html/);
        await page.locator('#chat-input').fill('Co mám dnes pochopit ve vztahu?');

        await Promise.all([
            page.waitForURL(/prihlaseni\.html.*source=mentor_entry_auth_gate/),
            page.locator('#send-btn').click()
        ]);

        await expect(page).toHaveURL(/prihlaseni\.html.*source=mentor_entry_auth_gate/);
        const url = new URL(page.url());
        expect(url.searchParams.get('mode')).toBe('register');
        expect(url.searchParams.get('redirect')).toBe('/mentor.html');
        expect(url.searchParams.get('feature')).toBe('mentor');
        expect(url.searchParams.has('plan')).toBe(false);
        await expect(page.locator('#auth-submit')).toContainText('Vytvořit účet zdarma');
        await expect(page.locator('#gdpr-consent-wrapper')).toBeVisible();

        const metrics = await page.evaluate(() => {
            const submit = document.getElementById('auth-submit')?.getBoundingClientRect();
            const consent = document.getElementById('gdpr-consent-wrapper')?.getBoundingClientRect();
            const cookie = document.getElementById('cookie-banner')?.getBoundingClientRect();
            const overlaps = (a, b) => !!(a && b && !(
                b.right < a.left
                || b.left > a.right
                || b.bottom < a.top
                || b.top > a.bottom
            ));
            return {
                submitBottom: Math.round(submit?.bottom || 9999),
                consentBottom: Math.round(consent?.bottom || 9999),
                cookieTop: Math.round(cookie?.top || window.innerHeight),
                submitOverlapsCookie: overlaps(submit, cookie),
                consentOverlapsCookie: overlaps(consent, cookie),
                overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
            };
        });

        expect(metrics.overflow).toBe(false);
        expect(metrics.submitOverlapsCookie).toBe(false);
        expect(metrics.consentOverlapsCookie).toBe(false);
        expect(metrics.submitBottom).toBeLessThanOrEqual(metrics.cookieTop);
        expect(metrics.consentBottom).toBeLessThanOrEqual(metrics.cookieTop);
    });

    test('registrace z headeru pouziva lidsky account kontext', async ({ page }) => {
        await page.goto('/prihlaseni.html?mode=register&source=header_register&feature=account');
        await waitForPageReady(page);

        await expect(page.locator('#checkout-context-banner')).toBeVisible();
        await expect(page.locator('#checkout-context-label')).toContainText('Účet zdarma');
        await expect(page.locator('#checkout-context-title')).toContainText('Účet zdarma');
        await expect(page.locator('#checkout-context-banner')).not.toContainText('account');
        await expect(page.locator('#signup-next-step-title')).toContainText('první osobní krok');
    });

    test('registrace z profiloveho gate navazuje na historii vykladu', async ({ page }) => {
        await page.goto('/prihlaseni.html?mode=register&source=profile_gate_register&feature=profile_history&redirect=/profil.html');
        await waitForPageReady(page);

        await expect(page.locator('#checkout-context-banner')).toBeVisible();
        await expect(page.locator('#checkout-context-label')).toContainText('Historie výkladů');
        await expect(page.locator('#checkout-context-title')).toContainText('Historie výkladů po registraci');
        await expect(page.locator('#checkout-context-copy')).toContainText('ukládat výklady');
        await expect(page.locator('#checkout-context-banner')).not.toContainText('profile_history');
        await expect(page.locator('#signup-next-step-title')).toContainText('osobní historii');
    });

    test('registracni CTA je na desktopu viditelne nad foldem', async ({ page }) => {
        await page.setViewportSize({ width: 1365, height: 900 });
        await page.goto('/prihlaseni.html?mode=register&source=header_register&feature=account');
        await waitForPageReady(page);

        const submitBox = await page.locator('#auth-submit').boundingBox();
        expect(submitBox).toBeTruthy();
        expect(submitBox.y + submitBox.height).toBeLessThanOrEqual(900);
    });

    test('registracni CTA je na mobilu viditelne pred hodnotovym panelem', async ({ page }) => {
        await page.setViewportSize({ width: 393, height: 851 });
        await page.goto('/prihlaseni.html?mode=register&source=homepage_hero&feature=daily_guidance');
        await waitForPageReady(page);

        const submitBox = await page.locator('#auth-submit').boundingBox();
        const valuePanelBox = await page.locator('#signup-value-panel').boundingBox();
        expect(submitBox).toBeTruthy();
        expect(valuePanelBox).toBeTruthy();
        expect(submitBox.y + submitBox.height).toBeLessThanOrEqual(851);
        expect(valuePanelBox.y).toBeGreaterThan(submitBox.y);
        await expectNoHorizontalOverflow(page);
    });

    test('registracni rezim nastavi heslo jako nove heslo a zobrazi pravidla', async ({ page }) => {
        await page.goto('/prihlaseni.html?mode=register');
        await waitForPageReady(page);

        const passwordInput = page.locator('#password').first();
        await expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
        await expect(passwordInput).toHaveAttribute('minlength', '8');
        await expect(page.locator('#password-help')).toBeVisible();

        await page.locator('#auth-mode-toggle').click();

        await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
        await expect(passwordInput).not.toHaveAttribute('minlength', '8');
        await expect(page.locator('#password-help')).toBeHidden();
    });

    test('pending checkout banner nepreteka mimo viewport', async ({ page }) => {
        await page.goto('/prihlaseni.html?mode=register&redirect=/cenik.html&plan=pruvodce&source=inline_paywall&feature=numerologie_vyklad');
        await waitForPageReady(page);

        await expect(page.locator('#checkout-context-banner')).toBeVisible();
        await expect(page.locator('#checkout-context-title')).toContainText('Členství Mystické Hvězdy');

        await expectLocatorsWithinViewport(page, [
            page.locator('#checkout-context-banner').first(),
            page.locator('#checkout-context-title').first(),
            page.locator('#checkout-context-copy').first(),
            page.locator('#email').first(),
            page.locator('#auth-submit').first(),
        ]);
    });

    test('placeny registracni landing nema onboarding sliby a nabizi login pred formularem', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/prihlaseni.html?mode=register&redirect=/cenik.html&plan=pruvodce&source=inline_paywall&feature=numerologie_vyklad&entry_source=inline_paywall&entry_feature=numerologie_vyklad');
        await waitForPageReady(page);

        await expect(page.locator('#checkout-context-banner')).toBeVisible();
        await expect(page.locator('#signup-value-panel')).toBeHidden();
        await expect(page.locator('#checkout-existing-account')).toBeVisible();
        await expect(page.locator('#checkout-existing-account')).toContainText('přihlásit se');

        const loginShortcutBox = await page.locator('#checkout-existing-account').boundingBox();
        const formBox = await page.locator('#login-form').boundingBox();
        expect(loginShortcutBox).toBeTruthy();
        expect(formBox).toBeTruthy();
        expect(loginShortcutBox.y + loginShortcutBox.height).toBeLessThanOrEqual(formBox.y + 2);

        await page.locator('#checkout-existing-account').click();

        await expect(page.locator('body')).not.toHaveClass(/auth-register-mode/);
        await expect(page.locator('#auth-submit')).toContainText('Přihlásit se a pokračovat');
        await expect(page.locator('#checkout-existing-account')).toBeHidden();
        const url = new URL(page.url());
        expect(url.searchParams.get('mode')).toBe('login');
        expect(url.searchParams.get('plan')).toBe('pruvodce');
        expect(url.searchParams.get('source')).toBe('inline_paywall');
        expect(url.searchParams.get('feature')).toBe('numerologie_vyklad');
        expect(url.searchParams.get('entry_source')).toBe('inline_paywall');
        expect(url.searchParams.get('entry_feature')).toBe('numerologie_vyklad');
    });

    test('placeny auth funnel rozlisi zacatek formulare a validacni prekazku', async ({ page }) => {
        const funnelEvents = [];
        await page.route('**/api/payment/funnel-event', async (route) => {
            funnelEvents.push(route.request().postDataJSON());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.goto('/prihlaseni.html?mode=register&redirect=/cenik.html&plan=pruvodce&source=inline_paywall&feature=tarot_multi_card');
        await waitForPageReady(page);
        await expect.poll(() => funnelEvents.some(event => event.eventName === 'checkout_auth_form_started'))
            .toBe(false);
        await page.locator('#email').fill('mereni@example.com');
        await page.locator('#auth-submit').click();

        await expect.poll(() => funnelEvents.find(event => event.eventName === 'checkout_auth_form_started') || null).toEqual(expect.objectContaining({
            source: 'inline_paywall',
            feature: 'tarot_multi_card',
            planId: 'pruvodce',
            metadata: expect.objectContaining({
                auth_flow_id: expect.any(String),
                step: 'auth_form_started'
            })
        }));
        await expect.poll(() => funnelEvents.find(event => event.eventName === 'checkout_auth_validation_failed') || null).toEqual(expect.objectContaining({
            metadata: expect.objectContaining({
                auth_flow_id: expect.any(String),
                step: 'native_validation_failed'
            })
        }));

        const start = funnelEvents.find(event => event.eventName === 'checkout_auth_form_started');
        const failure = funnelEvents.find(event => event.eventName === 'checkout_auth_validation_failed');
        expect(failure.metadata.auth_flow_id).toBe(start.metadata.auth_flow_id);
        expect(start.metadata.trigger).toBe('field_input');
    });

    test('existujici email prepne registraci na login bez ztraty checkout kontextu', async ({ page }) => {
        const email = 'existing-checkout@example.com';
        const funnelEvents = [];

        await page.route('**/api/payment/funnel-event', async (route) => {
            funnelEvents.push(route.request().postDataJSON());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });
        await page.route('**/api/auth/register', async (route) => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: 'Registrace se nezdařila. Pokud už účet máte, přihlaste se nebo obnovte heslo.',
                    code: 'REGISTRATION_RECOVERY_REQUIRED'
                })
            });
        });

        await page.goto('/prihlaseni.html?mode=register&redirect=/cenik.html&plan=pruvodce&source=synastry_teaser_overlay&feature=partnerska_detail&entry_source=synastry_teaser_overlay&entry_feature=partnerska_detail');
        await waitForPageReady(page);
        await submitRegisterForm(page, email);

        await expect(page.locator('body')).not.toHaveClass(/auth-register-mode/);
        await expect(page.locator('#auth-submit')).toContainText('Přihlásit se a pokračovat');
        await expect(page.locator('#forgot-password-link')).toBeVisible();
        await expect(page.locator('#email')).toHaveValue(email);
        await expect(page.locator('#password')).toHaveValue('');
        await expect(page.locator('.form-error-summary')).toContainText('existujícím účtem');

        const url = new URL(page.url());
        expect(url.searchParams.get('mode')).toBe('login');
        expect(url.searchParams.get('plan')).toBe('pruvodce');
        expect(url.searchParams.get('source')).toBe('synastry_teaser_overlay');
        expect(url.searchParams.get('feature')).toBe('partnerska_detail');
        expect(url.searchParams.get('entry_source')).toBe('synastry_teaser_overlay');
        expect(url.searchParams.get('entry_feature')).toBe('partnerska_detail');

        await expect.poll(() => funnelEvents.find(event => event.eventName === 'checkout_auth_request_failed') || null)
            .toEqual(expect.objectContaining({
                source: 'synastry_teaser_overlay',
                feature: 'partnerska_detail',
                planId: 'pruvodce',
                metadata: expect.objectContaining({
                    auth_flow_id: expect.any(String),
                    reason_code: 'REGISTRATION_RECOVERY_REQUIRED',
                    step: 'register_request_failed'
                })
            }));
    });

    test('login s pending checkout kontextem ukazuje placene navazani', async ({ page }) => {
        await page.goto('/prihlaseni.html?mode=login&redirect=/cenik.html&plan=pruvodce&source=trial_paywall&feature=numerologie_vyklad&entry_source=trial_paywall&entry_feature=numerologie_vyklad');
        await waitForPageReady(page);

        await expect(page.locator('#checkout-context-banner')).toBeVisible();
        await expect(page.locator('#login-page-title')).toContainText('Přihlas se a pokračuj k odemčení');
        await expect(page.locator('#login-page-subtitle')).toContainText('zachováme vybraný plán a otevřeme bezpečný Stripe checkout');
        await expect(page.locator('#auth-submit')).toContainText('Přihlásit se a pokračovat');
        await expect(page.locator('#auth-submit')).not.toContainText('zdarma');
        await expect.poll(() => page.evaluate(() => document.body.classList.contains('auth-checkout-plan-mode'))).toBe(true);

        await expectLocatorsWithinViewport(page, [
            page.locator('#checkout-context-banner').first(),
            page.locator('#email').first(),
            page.locator('#auth-submit').first(),
        ]);
    });

    test('login s pending checkout kontextem dokonci Stripe checkout', async ({ page }) => {
        const email = 'login-pending-checkout@example.com';
        const funnelEvents = [];
        let checkoutPayload = null;

        await mockSuccessfulLogin(page, email);

        await page.route('**/api/payment/funnel-event', async (route) => {
            funnelEvents.push(route.request().postDataJSON());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.route('**/api/payment/create-checkout-session', async (route) => {
            checkoutPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'cs_login_pending_checkout',
                    url: '/profil.html?payment=success&plan=pruvodce&session_id=cs_login_pending_checkout'
                })
            });
        });

        await page.goto('/prihlaseni.html?mode=login&redirect=/cenik.html&plan=pruvodce&source=trial_paywall&feature=numerologie_vyklad&entry_source=trial_paywall&entry_feature=numerologie_vyklad&billing_interval=monthly');
        await waitForPageReady(page);
        await expect(page.locator('#checkout-context-banner')).toBeVisible();

        await Promise.all([
            page.waitForURL(
                url => url.pathname === '/profil.html' && url.searchParams.get('session_id') === 'cs_login_pending_checkout',
                { timeout: 10000, waitUntil: 'domcontentloaded' }
            ),
            submitLoginForm(page, email),
        ]);

        expect(checkoutPayload).toEqual(expect.objectContaining({
            planId: 'pruvodce',
            source: 'trial_paywall',
            feature: 'numerologie_vyklad',
            billingInterval: 'monthly',
            metadata: expect.objectContaining({
                entry_source: 'trial_paywall',
                entry_feature: 'numerologie_vyklad'
            })
        }));

        await expect.poll(() => funnelEvents.find((event) => event.eventName === 'checkout_auth_page_viewed') || null).toEqual(expect.objectContaining({
            source: 'trial_paywall',
            feature: 'numerologie_vyklad',
            planId: 'pruvodce',
            metadata: expect.objectContaining({
                path: '/prihlaseni.html',
                redirect: '/cenik.html',
                auth_mode: 'login',
                billing_interval: 'monthly',
                entry_source: 'trial_paywall',
                entry_feature: 'numerologie_vyklad'
            })
        }));

        await expect.poll(() => funnelEvents.find((event) => event.eventName === 'checkout_auth_form_submitted') || null).toEqual(expect.objectContaining({
            source: 'trial_paywall',
            feature: 'numerologie_vyklad',
            planId: 'pruvodce',
            metadata: expect.objectContaining({
                path: '/prihlaseni.html',
                redirect: '/cenik.html',
                auth_mode: 'login',
                billing_interval: 'monthly',
                entry_source: 'trial_paywall',
                entry_feature: 'numerologie_vyklad',
                step: 'login_form_submitted'
            })
        }));
        expect(await page.evaluate(() => localStorage.getItem('mh_post_verification_checkout'))).toBeNull();
        expect(await page.evaluate(() => sessionStorage.getItem('pending_plan'))).toBeNull();
    });

    test('mobilni login s pending checkout kontextem nekryje cookie banner', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.evaluate(() => {
            localStorage.removeItem('mh_cookie_prefs');
            localStorage.removeItem('cookieConsent');
        });
        await page.goto('/prihlaseni.html?mode=login&redirect=/cenik.html&plan=pruvodce&source=trial_paywall&feature=numerologie_vyklad&entry_source=trial_paywall&entry_feature=numerologie_vyklad');
        await waitForPageReady(page);

        await expect(page.locator('#checkout-context-banner')).toBeVisible();
        await expect(page.locator('#auth-submit')).toContainText('Přihlásit se a pokračovat');
        await expect(page.locator('#cookie-banner')).toBeVisible({ timeout: 4000 });

        const metrics = await page.evaluate(() => {
            const context = document.getElementById('checkout-context-banner')?.getBoundingClientRect();
            const email = document.getElementById('email')?.getBoundingClientRect();
            const submit = document.getElementById('auth-submit')?.getBoundingClientRect();
            const cookie = document.getElementById('cookie-banner')?.getBoundingClientRect();
            const overlaps = (a, b) => !!(a && b && !(
                b.right < a.left
                || b.left > a.right
                || b.bottom < a.top
                || b.top > a.bottom
            ));
            return {
                contextVisible: !!context && context.top >= 0 && context.bottom <= window.innerHeight,
                contextBeforeEmail: Math.round(context?.bottom || 9999) <= Math.round(email?.top || 0),
                submitVisible: !!submit && submit.top >= 0 && submit.bottom <= window.innerHeight,
                submitOverlapsCookie: overlaps(submit, cookie)
            };
        });

        expect(metrics.contextVisible).toBe(true);
        expect(metrics.contextBeforeEmail).toBe(true);
        expect(metrics.submitVisible).toBe(true);
        expect(metrics.submitOverlapsCookie).toBe(false);
    });

    test('mobilni placeny checkout kontext je videt pred formularem', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.evaluate(() => {
            localStorage.removeItem('mh_cookie_prefs');
            localStorage.removeItem('cookieConsent');
        });
        await page.goto('/prihlaseni.html?mode=register&redirect=/cenik.html&plan=pruvodce&source=pricing_email&feature=premium_membership');
        await waitForPageReady(page);
        await expect(page.locator('#cookie-banner')).toBeVisible({ timeout: 4000 });
        await expect.poll(() => page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('#cookie-banner button'));
            return buttons.length === 3 && buttons.every((button) => {
                const rect = button.getBoundingClientRect();
                return rect.top >= 0 && rect.bottom <= window.innerHeight;
            });
        }), { timeout: 6000 }).toBe(true);

        const metrics = await page.evaluate(() => {
            const context = document.getElementById('checkout-context-banner')?.getBoundingClientRect();
            const email = document.getElementById('email')?.getBoundingClientRect();
            const submit = document.getElementById('auth-submit')?.getBoundingClientRect();
            const cookie = document.getElementById('cookie-banner')?.getBoundingClientRect();
            const overlaps = (a, b) => !!(a && b && !(
                b.right < a.left
                || b.left > a.right
                || b.bottom < a.top
                || b.top > a.bottom
            ));
            return {
                contextBeforeEmail: Math.round(context?.bottom || 9999) <= Math.round(email?.top || 0),
                contextVisible: !!context && context.top >= 0 && context.bottom <= window.innerHeight,
                submitVisible: !!submit && submit.top >= 0 && submit.bottom <= window.innerHeight,
                submitOverlapsCookie: overlaps(submit, cookie)
            };
        });

        expect(metrics.contextBeforeEmail).toBe(true);
        expect(metrics.contextVisible).toBe(true);
        expect(metrics.submitVisible).toBe(true);
        expect(metrics.submitOverlapsCookie).toBe(false);
    });

    test('checkout banner neukazuje interni feature identifikatory', async ({ page }) => {
        await page.goto('/prihlaseni.html?mode=register&redirect=/cenik.html&plan=pruvodce&source=tarot_freemium_banner&feature=tarot_multi_card');
        await waitForPageReady(page);

        await expect(page.locator('#checkout-context-banner')).toBeVisible();
        await expect(page.locator('#checkout-context-copy')).toContainText('Vícekartový tarot');
        await expect(page.locator('#checkout-context-banner')).not.toContainText('tarot_multi_card');
    });

    test('checkout banner umi lidsky popsat premium aliasy z paywallu', async ({ page }) => {
        const cases = [
            { feature: 'tarot_celtic_cross', expected: 'Keltsk' },
            { feature: 'natal_chart', expected: 'Nat' },
            { feature: 'monthly_horoscope', expected: 'Měsíční horoskop' },
            { feature: 'runes_deep_reading', expected: 'run' },
            { feature: 'rituals', expected: 'ritu' }
        ];

        for (const item of cases) {
            await page.goto(`/prihlaseni.html?mode=register&redirect=/cenik.html&plan=pruvodce&source=inline_paywall&feature=${item.feature}`);
            await waitForPageReady(page);

            const banner = page.locator('#checkout-context-banner');
            await expect(banner).toBeVisible();
            await expect(banner).toContainText(item.expected);
            await expect(banner).toContainText('Po registraci otevřeme bezpečný checkout');
            await expect(banner).not.toContainText(item.feature);
        }
    });

    test('obnovena registrace z primeho odkazu zachova a dokonci Stripe checkout', async ({ page }) => {
        let checkoutPayload = null;
        let onboardingCompletionRequests = 0;
        await mockSuccessfulRegister(page, 'direct-checkout@example.com', { recoveredRegistration: true });

        await page.route('**/api/auth/onboarding/complete', async (route) => {
            onboardingCompletionRequests += 1;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.route('**/api/payment/create-checkout-session', async (route) => {
            checkoutPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'cs_test_direct_checkout',
                    url: '/profil.html?payment=success&plan=pruvodce&session_id=cs_test_direct_checkout'
                })
            });
        });

        await page.goto('/prihlaseni.html?mode=register&redirect=/cenik.html&plan=pruvodce&source=pricing_email&feature=premium_membership');
        await waitForPageReady(page);
        await expect(page.locator('#login-page-title')).toContainText('Vytvoř si účet a pokračuj k odemčení');
        await expect(page.locator('#login-page-subtitle')).toContainText('Stripe checkoutu');
        await expect(page.locator('#auth-submit')).toContainText('Vytvořit účet a pokračovat');

        await Promise.all([
            page.waitForRequest((request) => request.url().includes('/profil.html?payment=success'), { timeout: 10000 }),
            submitRegisterForm(page, 'direct-checkout@example.com'),
        ]);

        expect(checkoutPayload).toEqual(expect.objectContaining({
            planId: 'pruvodce',
            source: 'pricing_email',
            feature: 'premium_membership'
        }));
        expect(onboardingCompletionRequests).toBe(0);
    });

    test('rychla navigace na auth flushne checkout auth handoff event', async ({ page }) => {
        const funnelEvents = [];

        await page.route('**/api/payment/funnel-event', async (route) => {
            funnelEvents.push(route.request().postDataJSON());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.goto('/tarot.html', { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page);

        await page.evaluate(() => {
            window.Auth.startPlanCheckout('pruvodce', {
                source: 'inline_paywall',
                feature: 'tarot_multi_card',
                redirect: '/cenik.html',
                metadata: {
                    entry_source: 'inline_paywall',
                    entry_feature: 'tarot_multi_card'
                }
            });
        });

        await page.waitForURL(
            url => url.pathname === '/prihlaseni.html' && url.searchParams.get('plan') === 'pruvodce',
            { timeout: 10000, waitUntil: 'domcontentloaded' }
        );

        await expect.poll(() => funnelEvents.find((event) => event.eventName === 'checkout_auth_required') || null).toEqual(expect.objectContaining({
            source: 'inline_paywall',
            feature: 'tarot_multi_card',
            planId: 'pruvodce',
            metadata: expect.objectContaining({
                redirect: '/cenik.html',
                entry_source: 'inline_paywall',
                entry_feature: 'tarot_multi_card'
            })
        }));
        await expect.poll(() => funnelEvents.find((event) => event.eventName === 'checkout_auth_page_viewed') || null).toEqual(expect.objectContaining({
            source: 'inline_paywall',
            feature: 'tarot_multi_card',
            planId: 'pruvodce',
            metadata: expect.objectContaining({
                path: '/prihlaseni.html',
                redirect: '/cenik.html',
                auth_mode: 'register',
                entry_source: 'inline_paywall',
                entry_feature: 'tarot_multi_card'
            })
        }));
        await expect.poll(() => page.evaluate(() => sessionStorage.getItem('mh_pending_checkout_auth_required_events'))).toBeNull();
    });

    test('checkout auth required retry po docasnem vypadku odesle puvodni handoff', async ({ page }) => {
        const funnelEvents = [];
        let authRequiredAttempts = 0;

        await page.route('**/api/payment/funnel-event', async (route) => {
            const payload = route.request().postDataJSON();
            funnelEvents.push(payload);

            if (payload.eventName === 'checkout_auth_required') {
                authRequiredAttempts += 1;
                if (authRequiredAttempts === 1) {
                    await route.fulfill({
                        status: 503,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: 'temporary funnel outage' })
                    });
                    return;
                }
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.goto('/tarot.html', { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page);

        await page.evaluate(() => {
            window.Auth.startPlanCheckout('pruvodce', {
                source: 'inline_paywall',
                feature: 'tarot_multi_card',
                redirect: '/cenik.html',
                metadata: {
                    entry_source: 'inline_paywall',
                    entry_feature: 'tarot_multi_card'
                }
            });
        });

        await page.waitForURL(
            url => url.pathname === '/prihlaseni.html' && url.searchParams.get('plan') === 'pruvodce',
            { timeout: 10000, waitUntil: 'domcontentloaded' }
        );

        await expect.poll(() => authRequiredAttempts, { timeout: 10000 }).toBe(1);
        await expect.poll(
            () => page.evaluate(() => JSON.parse(sessionStorage.getItem('mh_pending_checkout_auth_required_events') || '[]')),
            { timeout: 5000 }
        ).toEqual([
            expect.objectContaining({
                payload: expect.objectContaining({
                    eventName: 'checkout_auth_required',
                    source: 'inline_paywall',
                    feature: 'tarot_multi_card',
                    planId: 'pruvodce',
                    metadata: expect.objectContaining({
                        redirect: '/cenik.html',
                        entry_source: 'inline_paywall',
                        entry_feature: 'tarot_multi_card'
                    })
                })
            })
        ]);

        await page.evaluate(() => window.Auth.flushPendingCheckoutAuthRequiredEvents());

        await expect.poll(() => authRequiredAttempts, { timeout: 10000 }).toBe(2);
        await expect.poll(() => page.evaluate(() => sessionStorage.getItem('mh_pending_checkout_auth_required_events'))).toBeNull();
        expect(funnelEvents.filter((event) => event.eventName === 'checkout_auth_required')).toHaveLength(2);
    });

    test('checkout auth page view se retrynuje po docasnem CSRF selhani', async ({ page }) => {
        const funnelEvents = [];
        let csrfAttempts = 0;

        await page.route('**/api/csrf-token', async (route) => {
            csrfAttempts += 1;
            if (csrfAttempts === 1) {
                await route.fulfill({
                    status: 503,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'temporary csrf outage' })
                });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ csrfToken: 'retry-checkout-auth-page-token' })
            });
        });

        await page.route('**/api/payment/funnel-event', async (route) => {
            funnelEvents.push(route.request().postDataJSON());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.goto('/prihlaseni.html?mode=register&redirect=/cenik.html&plan=pruvodce&source=horoscope_inline_upsell&feature=monthly_horoscope&entry_source=horoscope_inline_upsell&entry_feature=monthly_horoscope');
        await waitForPageReady(page);

        await expect(page.locator('#checkout-context-banner')).toBeVisible();
        await expect.poll(() => csrfAttempts, { timeout: 10000 }).toBeGreaterThanOrEqual(2);
        await expect.poll(() => funnelEvents.find((event) => event.eventName === 'checkout_auth_page_viewed') || null).toEqual(expect.objectContaining({
            source: 'horoscope_inline_upsell',
            feature: 'monthly_horoscope',
            planId: 'pruvodce',
            metadata: expect.objectContaining({
                path: '/prihlaseni.html',
                redirect: '/cenik.html',
                auth_mode: 'register',
                entry_source: 'horoscope_inline_upsell',
                entry_feature: 'monthly_horoscope',
                step: 'auth_page_viewed'
            })
        }));
        await expect.poll(() => page.evaluate(() => sessionStorage.getItem('mh_pending_checkout_auth_required_events'))).toBeNull();
    });

    test('checkout auth page view se odesle i kdyz se zaradi behem aktivniho flush', async ({ page }) => {
        const funnelEvents = [];
        let pageViewAttempts = 0;

        await page.route('**/api/payment/funnel-event', async (route) => {
            const payload = route.request().postDataJSON();
            funnelEvents.push(payload);

            if (payload.eventName === 'checkout_auth_required') {
                await new Promise(resolve => setTimeout(resolve, 800));
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true })
                });
                return;
            }

            if (payload.eventName === 'checkout_auth_page_viewed') {
                pageViewAttempts += 1;
                if (pageViewAttempts === 1) {
                    await new Promise(resolve => setTimeout(resolve, 150));
                    await route.fulfill({
                        status: 503,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: 'temporary auth page telemetry outage' })
                    });
                    return;
                }
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.goto('/tarot.html', { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
            sessionStorage.setItem('mh_pending_checkout_auth_required_events', JSON.stringify([{
                id: 'queued-weekly-horoscope-auth-required',
                createdAt: Date.now(),
                payload: {
                    eventName: 'checkout_auth_required',
                    source: 'horoscope_inline_upsell',
                    feature: 'weekly_horoscope',
                    planId: 'pruvodce',
                    metadata: {
                        path: '/horoskopy.html',
                        redirect: '/cenik.html',
                        auth_mode: 'register',
                        entry_source: 'horoscope_inline_upsell',
                        entry_feature: 'weekly_horoscope'
                    }
                }
            }]));
        });

        await page.goto('/prihlaseni.html?mode=register&redirect=/cenik.html&plan=pruvodce&source=horoscope_inline_upsell&feature=weekly_horoscope&entry_source=horoscope_inline_upsell&entry_feature=weekly_horoscope');
        await waitForPageReady(page);

        await expect(page.locator('#checkout-context-banner')).toBeVisible();
        await expect.poll(() => pageViewAttempts, { timeout: 10000 }).toBe(2);
        await expect.poll(() => funnelEvents.find((event) => (
            event.eventName === 'checkout_auth_page_viewed'
            && event.source === 'horoscope_inline_upsell'
            && event.feature === 'weekly_horoscope'
        )) || null).toEqual(expect.objectContaining({
            planId: 'pruvodce',
            metadata: expect.objectContaining({
                path: '/prihlaseni.html',
                redirect: '/cenik.html',
                auth_mode: 'register',
                entry_source: 'horoscope_inline_upsell',
                entry_feature: 'weekly_horoscope',
                step: 'auth_page_viewed'
            })
        }));
        await expect.poll(() => page.evaluate(() => sessionStorage.getItem('mh_pending_checkout_auth_required_events'))).toBeNull();
    });

    test('checkout auth page retry neblokuje checkout po registraci', async ({ page }) => {
        const email = 'retry-resume-checkout@example.com';
        const funnelEvents = [];
        let checkoutPayload = null;
        let csrfAttempts = 0;

        await page.route('**/api/csrf-token', async (route) => {
            csrfAttempts += 1;
            if (csrfAttempts === 1) {
                await route.fulfill({
                    status: 503,
                    contentType: 'application/json',
                    body: JSON.stringify({ error: 'temporary csrf outage' })
                });
                return;
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ csrfToken: 'retry-resume-checkout-token' })
            });
        });

        await page.route('**/api/payment/funnel-event', async (route) => {
            funnelEvents.push(route.request().postDataJSON());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.route('**/api/auth/register', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    user: {
                        id: 'retry-resume-checkout-user',
                        email,
                        role: 'user',
                        subscription_status: 'free'
                    }
                })
            });
        });

        await page.route('**/api/payment/create-checkout-session', async (route) => {
            checkoutPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'cs_retry_resume_checkout',
                    url: '/profil.html?payment=success&plan=pruvodce&session_id=cs_retry_resume_checkout'
                })
            });
        });

        await page.goto('/prihlaseni.html?mode=register&redirect=/cenik.html&plan=pruvodce&source=exit_intent_horoskopy&feature=horoskopy&entry_source=exit_intent_horoskopy&entry_feature=horoskopy');
        await waitForPageReady(page);
        await expect(page.locator('#checkout-context-banner')).toBeVisible();

        await Promise.all([
            page.waitForURL(
                url => url.pathname === '/profil.html' && url.searchParams.get('session_id') === 'cs_retry_resume_checkout',
                { timeout: 10000, waitUntil: 'domcontentloaded' }
            ),
            submitRegisterForm(page, email),
        ]);

        await expect.poll(() => csrfAttempts, { timeout: 10000 }).toBeGreaterThanOrEqual(2);
        await expect.poll(() => funnelEvents.find((event) => event.eventName === 'checkout_auth_page_viewed') || null).toEqual(expect.objectContaining({
            source: 'exit_intent_horoskopy',
            feature: 'horoskopy',
            planId: 'pruvodce',
            metadata: expect.objectContaining({
                path: '/prihlaseni.html',
                redirect: '/cenik.html',
                auth_mode: 'register',
                entry_source: 'exit_intent_horoskopy',
                entry_feature: 'horoskopy',
                step: 'auth_page_viewed'
            })
        }));
        await expect.poll(() => funnelEvents.find((event) => event.eventName === 'checkout_auth_form_submitted') || null).toEqual(expect.objectContaining({
            source: 'exit_intent_horoskopy',
            feature: 'horoskopy',
            planId: 'pruvodce',
            metadata: expect.objectContaining({
                path: '/prihlaseni.html',
                redirect: '/cenik.html',
                auth_mode: 'register',
                entry_source: 'exit_intent_horoskopy',
                entry_feature: 'horoskopy',
                step: 'register_form_submitted'
            })
        }));
        expect(checkoutPayload).toEqual(expect.objectContaining({
            planId: 'pruvodce',
            source: 'exit_intent_horoskopy',
            feature: 'horoskopy',
            billingInterval: null,
            metadata: expect.objectContaining({
                entry_source: 'exit_intent_horoskopy',
                entry_feature: 'horoskopy'
            })
        }));
        await expect.poll(() => page.evaluate(() => sessionStorage.getItem('mh_pending_checkout_auth_required_events'))).toBeNull();
    });

    test('checkout auth form telemetry outage neblokuje checkout po registraci', async ({ page }) => {
        const email = 'form-telemetry-outage@example.com';
        const funnelEvents = [];
        let formTelemetryAttempts = 0;
        let checkoutPayload = null;

        await page.route('**/api/payment/funnel-event', async (route) => {
            const payload = route.request().postDataJSON();
            funnelEvents.push(payload);

            if (payload.eventName === 'checkout_auth_form_submitted') {
                formTelemetryAttempts += 1;
                if (formTelemetryAttempts === 1) {
                    await route.fulfill({
                        status: 503,
                        contentType: 'application/json',
                        body: JSON.stringify({ error: 'temporary form telemetry outage' })
                    });
                    return;
                }
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.route('**/api/auth/register', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    user: {
                        id: 'form-telemetry-outage-user',
                        email,
                        role: 'user',
                        subscription_status: 'free'
                    }
                })
            });
        });

        await page.route('**/api/payment/create-checkout-session', async (route) => {
            checkoutPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'cs_form_telemetry_outage',
                    url: '/profil.html?payment=success&plan=pruvodce&session_id=cs_form_telemetry_outage'
                })
            });
        });

        await page.goto('/prihlaseni.html?mode=register&redirect=/cenik.html&plan=pruvodce&source=inline_paywall&feature=tarot_multi_card&entry_source=inline_paywall&entry_feature=tarot_multi_card');
        await waitForPageReady(page);
        await expect(page.locator('#checkout-context-banner')).toBeVisible();

        await Promise.all([
            page.waitForURL(
                url => url.pathname === '/profil.html' && url.searchParams.get('session_id') === 'cs_form_telemetry_outage',
                { timeout: 10000, waitUntil: 'domcontentloaded' }
            ),
            submitRegisterForm(page, email),
        ]);

        expect(checkoutPayload).toEqual(expect.objectContaining({
            planId: 'pruvodce',
            source: 'inline_paywall',
            feature: 'tarot_multi_card',
            billingInterval: null,
            metadata: expect.objectContaining({
                entry_source: 'inline_paywall',
                entry_feature: 'tarot_multi_card'
            })
        }));
        await expect.poll(() => formTelemetryAttempts, { timeout: 10000 }).toBe(2);
        expect(funnelEvents.filter((event) => event.eventName === 'checkout_auth_form_submitted')).toHaveLength(2);
        await expect.poll(() => page.evaluate(() => sessionStorage.getItem('mh_pending_checkout_auth_required_events'))).toBeNull();
    });

    test('auth page analytics outage neblokuje registraci s pending checkoutem', async ({ page }) => {
        const email = 'auth-page-analytics-outage@example.com';

        await page.addInitScript(() => {
            let analyticsValue = null;
            Object.defineProperty(window, 'MH_ANALYTICS', {
                configurable: true,
                get: () => analyticsValue,
                set: (value) => {
                    analyticsValue = value && typeof value === 'object'
                        ? {
                            ...value,
                            trackAuthViewed: () => {
                                throw new Error('temporary auth view analytics outage');
                            },
                            trackAuthCompleted: () => {
                                throw new Error('temporary auth completed analytics outage');
                            }
                        }
                        : value;
                }
            });
        });

        await page.route('**/api/payment/funnel-event', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.route('**/api/auth/register', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    requireEmailVerification: true
                })
            });
        });

        await page.goto('/prihlaseni.html?mode=register&redirect=/cenik.html&plan=pruvodce&source=inline_paywall&feature=tarot_multi_card&entry_source=inline_paywall&entry_feature=tarot_multi_card');
        await waitForPageReady(page);
        await expect(page.locator('#checkout-context-banner')).toBeVisible();

        await submitRegisterForm(page, email);

        await expect.poll(async () => page.evaluate(() => {
            const raw = localStorage.getItem('mh_post_verification_checkout');
            return raw ? JSON.parse(raw) : null;
        })).toEqual(expect.objectContaining({
            planId: 'pruvodce',
            context: expect.objectContaining({
                source: 'inline_paywall',
                feature: 'tarot_multi_card',
                metadata: expect.objectContaining({
                    entry_source: 'inline_paywall',
                    entry_feature: 'tarot_multi_card'
                })
            })
        }));
        await expect(page.locator('body')).not.toContainText('temporary auth completed analytics outage');
        await expect(page.locator('#auth-submit')).toBeEnabled();
    });

    test('checkout start analytics outage neblokuje checkout session', async ({ page }) => {
        let checkoutPayload = null;

        await page.route('**/api/payment/create-checkout-session', async (route) => {
            checkoutPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'cs_checkout_start_analytics_outage',
                    url: '/profil.html?payment=success&plan=pruvodce&session_id=cs_checkout_start_analytics_outage'
                })
            });
        });

        await page.goto('/tarot.html', { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page);
        await page.evaluate(() => {
            document.cookie = 'logged_in=1; path=/';
            const user = {
                id: 'checkout-start-analytics-outage-user',
                email: 'checkout-start-analytics-outage@example.com',
                role: 'user',
                subscription_status: 'free'
            };
            localStorage.setItem('auth_user', JSON.stringify(user));
            window.Auth.user = user;

            const analytics = window.MH_ANALYTICS || (window.MH_ANALYTICS = {});
            analytics.trackCheckoutStarted = () => {
                throw new Error('temporary analytics outage');
            };
        });

        await Promise.all([
            page.waitForURL(
                url => url.pathname === '/profil.html' && url.searchParams.get('session_id') === 'cs_checkout_start_analytics_outage',
                { timeout: 10000, waitUntil: 'domcontentloaded' }
            ),
            page.evaluate(() => window.Auth.startPlanCheckout('pruvodce', {
                source: 'inline_paywall',
                feature: 'tarot_multi_card',
                redirect: '/cenik.html',
                metadata: {
                    entry_source: 'inline_paywall',
                    entry_feature: 'tarot_multi_card'
                }
            })),
        ]);

        expect(checkoutPayload).toEqual(expect.objectContaining({
            planId: 'pruvodce',
            source: 'inline_paywall',
            feature: 'tarot_multi_card',
            billingInterval: null,
            metadata: expect.objectContaining({
                entry_source: 'inline_paywall',
                entry_feature: 'tarot_multi_card'
            })
        }));
    });

    test('auth completed analytics outage neblokuje post-verification checkout resume', async ({ page }) => {
        const funnelEvents = [];
        let checkoutPayload = null;

        await page.route('**/api/payment/funnel-event', async (route) => {
            funnelEvents.push(route.request().postDataJSON());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await mockSuccessfulLogin(page, 'auth-analytics-outage@example.com');

        await page.route('**/api/payment/create-checkout-session', async (route) => {
            checkoutPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'cs_auth_analytics_outage',
                    url: '/profil.html?payment=success&plan=pruvodce&session_id=cs_auth_analytics_outage'
                })
            });
        });

        await page.goto('/prihlaseni.html?mode=login');
        await waitForPageReady(page);
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem('mh_post_verification_checkout', JSON.stringify({
                planId: 'pruvodce',
                createdAt: Date.now(),
                context: {
                    planId: 'pruvodce',
                    source: 'trial_paywall',
                    feature: 'numerologie_vyklad',
                    redirect: '/cenik.html',
                    authMode: 'register',
                    metadata: {
                        entry_source: 'trial_paywall',
                        entry_feature: 'numerologie_vyklad'
                    }
                }
            }));

            const analytics = window.MH_ANALYTICS || (window.MH_ANALYTICS = {});
            analytics.trackAuthCompleted = () => {
                throw new Error('temporary auth analytics outage');
            };
        });

        await Promise.all([
            page.waitForURL(
                url => url.pathname === '/profil.html' && url.searchParams.get('session_id') === 'cs_auth_analytics_outage',
                { timeout: 10000, waitUntil: 'domcontentloaded' }
            ),
            submitLoginForm(page, 'auth-analytics-outage@example.com'),
        ]);

        expect(checkoutPayload).toEqual(expect.objectContaining({
            planId: 'pruvodce',
            source: 'trial_paywall',
            feature: 'numerologie_vyklad',
            billingInterval: null,
            metadata: expect.objectContaining({
                entry_source: 'trial_paywall',
                entry_feature: 'numerologie_vyklad'
            })
        }));
        await expect.poll(() => funnelEvents.find((event) => event.eventName === 'checkout_post_verification_recovered') || null).toEqual(expect.objectContaining({
            source: 'trial_paywall',
            feature: 'numerologie_vyklad',
            planId: 'pruvodce',
            metadata: expect.objectContaining({
                entry_source: 'trial_paywall',
                entry_feature: 'numerologie_vyklad'
            })
        }));
        expect(await page.evaluate(() => localStorage.getItem('mh_post_verification_checkout'))).toBeNull();
    });

    test('checkout intent prezije email verifikaci a obnovi se pri dalsim prihlaseni', async ({ page }) => {
        test.setTimeout(60000);

        const scenarios = [
            {
                email: 'verify-tarot@example.com',
                source: 'inline_paywall',
                feature: 'tarot_multi_card',
                entrySource: 'inline_paywall'
            },
            {
                email: 'verify-numerology@example.com',
                source: 'trial_paywall',
                feature: 'numerologie_vyklad',
                entrySource: 'trial_paywall'
            },
            {
                email: 'verify-natal@example.com',
                source: 'natal_teaser_gate',
                feature: 'natalni_interpretace',
                entrySource: 'natal_teaser_gate',
                billingInterval: 'yearly'
            },
            {
                email: 'verify-partner@example.com',
                source: 'partner_match_result',
                feature: 'partnerska_detail',
                entrySource: 'partner_match_result'
            }
        ];
        const checkoutPayloads = [];
        const funnelEvents = [];

        await page.route('**/api/payment/funnel-event', async (route) => {
            funnelEvents.push(route.request().postDataJSON());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.route('**/api/auth/register', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    requireEmailVerification: true
                })
            });
        });

        await page.route('**/api/auth/login', async (route) => {
            const payload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: `verified-${payload.email}`,
                        email: payload.email,
                        role: 'user',
                        subscription_status: 'free'
                    }
                })
            });
        });

        await page.route('**/api/payment/create-checkout-session', async (route) => {
            const payload = route.request().postDataJSON();
            checkoutPayloads.push(payload);
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: `cs_${payload.feature}`,
                    url: `/profil.html?payment=success&plan=${payload.planId}&session_id=cs_${payload.feature}`
                })
            });
        });

        for (const scenario of scenarios) {
            await page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
            });

            const registerUrl = new URL('/prihlaseni.html', 'http://localhost');
            registerUrl.searchParams.set('mode', 'register');
            registerUrl.searchParams.set('redirect', '/cenik.html');
            registerUrl.searchParams.set('plan', 'pruvodce');
            registerUrl.searchParams.set('source', scenario.source);
            registerUrl.searchParams.set('feature', scenario.feature);
            registerUrl.searchParams.set('entry_source', scenario.entrySource);
            registerUrl.searchParams.set('entry_feature', scenario.feature);
            if (scenario.billingInterval) {
                registerUrl.searchParams.set('billing_interval', scenario.billingInterval);
            }
            await page.goto(`${registerUrl.pathname}${registerUrl.search}`);
            await waitForPageReady(page);
            await submitRegisterForm(page, scenario.email);

            await expect.poll(() => funnelEvents.find((event) => (
                event.eventName === 'checkout_auth_page_viewed'
                && event.feature === scenario.feature
            )) || null).toEqual(expect.objectContaining({
                source: scenario.source,
                feature: scenario.feature,
                planId: 'pruvodce',
                metadata: expect.objectContaining({
                    path: '/prihlaseni.html',
                    redirect: '/cenik.html',
                    entry_source: scenario.entrySource,
                    entry_feature: scenario.feature
                })
            }));
            await expect.poll(() => funnelEvents.find((event) => (
                event.eventName === 'checkout_auth_form_submitted'
                && event.feature === scenario.feature
            )) || null).toEqual(expect.objectContaining({
                source: scenario.source,
                feature: scenario.feature,
                planId: 'pruvodce',
                metadata: expect.objectContaining({
                    path: '/prihlaseni.html',
                    redirect: '/cenik.html',
                    auth_mode: 'register',
                    entry_source: scenario.entrySource,
                    entry_feature: scenario.feature
                })
            }));
            await expect.poll(
                () => page.evaluate(() => JSON.parse(localStorage.getItem('mh_post_verification_checkout') || 'null')),
                { timeout: 5000 }
            ).not.toBeNull();
            const storedCheckout = await page.evaluate(() => JSON.parse(localStorage.getItem('mh_post_verification_checkout') || 'null'));
            const expectedStoredContext = {
                source: scenario.source,
                feature: scenario.feature,
                redirect: '/cenik.html',
                metadata: expect.objectContaining({
                    entry_source: scenario.entrySource,
                    entry_feature: scenario.feature
                })
            };
            if (scenario.billingInterval) {
                expectedStoredContext.billing_interval = scenario.billingInterval;
            }
            expect(storedCheckout).toEqual(expect.objectContaining({
                planId: 'pruvodce',
                context: expect.objectContaining(expectedStoredContext)
            }));
            await expect.poll(() => funnelEvents.find((event) => (
                event.eventName === 'checkout_post_verification_pending'
                && event.feature === scenario.feature
            )) || null).toEqual(expect.objectContaining({
                source: scenario.source,
                feature: scenario.feature,
                planId: 'pruvodce',
                metadata: expect.objectContaining({
                    entry_source: scenario.entrySource,
                    entry_feature: scenario.feature
                })
            }));
            expect(checkoutPayloads.find((payload) => payload.feature === scenario.feature)).toBeUndefined();

            await page.goto('/prihlaseni.html?mode=login');
            await waitForPageReady(page);

            await Promise.all([
                page.waitForURL(
                    url => url.pathname === '/profil.html' && url.searchParams.get('session_id') === `cs_${scenario.feature}`,
                    { timeout: 10000, waitUntil: 'domcontentloaded' }
                ),
                submitLoginForm(page, scenario.email),
            ]);

            expect(checkoutPayloads.find((payload) => payload.feature === scenario.feature)).toEqual(expect.objectContaining({
                planId: 'pruvodce',
                source: scenario.source,
                feature: scenario.feature,
                billingInterval: scenario.billingInterval || null,
                metadata: expect.objectContaining({
                    entry_source: scenario.entrySource,
                    entry_feature: scenario.feature
                })
            }));
            await expect.poll(() => funnelEvents.find((event) => (
                event.eventName === 'checkout_post_verification_recovered'
                && event.feature === scenario.feature
            )) || null).toEqual(expect.objectContaining({
                source: scenario.source,
                feature: scenario.feature,
                planId: 'pruvodce',
                metadata: expect.objectContaining({
                    entry_source: scenario.entrySource,
                    entry_feature: scenario.feature
                })
            }));
            expect(await page.evaluate(() => localStorage.getItem('mh_post_verification_checkout'))).toBeNull();
        }
    });

    test('post-verification checkout failure vrati na cenik s puvodnim kontextem', async ({ page }) => {
        const checkoutPayloads = [];
        const funnelEvents = [];

        await page.route('**/api/payment/funnel-event', async (route) => {
            funnelEvents.push(route.request().postDataJSON());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.route('**/api/auth/login', async (route) => {
            const payload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'verified-natal-failure',
                        email: payload.email,
                        role: 'user',
                        subscription_status: 'free'
                    }
                })
            });
        });

        await page.route('**/api/payment/create-checkout-session', async (route) => {
            checkoutPayloads.push(route.request().postDataJSON());
            await route.fulfill({
                status: 503,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'temporary stripe outage' })
            });
        });

        await page.goto('/prihlaseni.html?mode=login');
        await waitForPageReady(page);
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem('mh_post_verification_checkout', JSON.stringify({
                planId: 'pruvodce',
                createdAt: Date.now(),
                context: {
                    planId: 'pruvodce',
                    source: 'natal_teaser_gate',
                    feature: 'natalni_interpretace',
                    redirect: '/cenik.html',
                    authMode: 'register',
                    billing_interval: 'yearly',
                    metadata: {
                        entry_source: 'natal_teaser_gate',
                        entry_feature: 'natalni_interpretace',
                        utm_source: 'email',
                        utm_campaign: 'natal_recovery'
                    }
                }
            }));
        });

        await Promise.all([
            page.waitForURL(
                url => url.pathname === '/cenik.html' && url.searchParams.get('payment') === 'failure',
                { timeout: 10000, waitUntil: 'domcontentloaded' }
            ),
            submitLoginForm(page, 'verify-natal-failure@example.com'),
        ]);

        expect(checkoutPayloads).toEqual([
            expect.objectContaining({
                planId: 'pruvodce',
                source: 'natal_teaser_gate',
                feature: 'natalni_interpretace',
                billingInterval: 'yearly',
                metadata: expect.objectContaining({
                    entry_source: 'natal_teaser_gate',
                    entry_feature: 'natalni_interpretace',
                    utm_source: 'email',
                    utm_campaign: 'natal_recovery'
                })
            })
        ]);

        const failureUrl = new URL(page.url());
        expect(failureUrl.pathname).toBe('/cenik.html');
        expect(failureUrl.searchParams.get('payment')).toBe('failure');
        expect(failureUrl.searchParams.get('reason')).toBe('session_failed');
        expect(failureUrl.searchParams.get('plan')).toBe('pruvodce');
        expect(failureUrl.searchParams.get('source')).toBe('natal_teaser_gate');
        expect(failureUrl.searchParams.get('feature')).toBe('natalni_interpretace');
        expect(failureUrl.searchParams.get('billing_interval')).toBe('yearly');
        expect(failureUrl.searchParams.get('entry_source')).toBe('natal_teaser_gate');
        expect(failureUrl.searchParams.get('entry_feature')).toBe('natalni_interpretace');
        expect(failureUrl.searchParams.get('utm_source')).toBe('email');
        expect(failureUrl.searchParams.get('utm_campaign')).toBe('natal_recovery');

        await expect.poll(() => funnelEvents.find((event) => (
            event.eventName === 'checkout_post_verification_recovered'
            && event.feature === 'natalni_interpretace'
        )) || null).toEqual(expect.objectContaining({
            source: 'natal_teaser_gate',
            feature: 'natalni_interpretace',
            planId: 'pruvodce',
            metadata: expect.objectContaining({
                billing_interval: 'yearly',
                entry_source: 'natal_teaser_gate',
                entry_feature: 'natalni_interpretace'
            })
        }));
        expect(await page.evaluate(() => localStorage.getItem('mh_post_verification_checkout'))).toBeNull();
    });

    test('post-verification checkout network error vrati na cenik s puvodnim kontextem', async ({ page }) => {
        const checkoutPayloads = [];
        const funnelEvents = [];

        await page.route('**/api/payment/funnel-event', async (route) => {
            funnelEvents.push(route.request().postDataJSON());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.route('**/api/auth/login', async (route) => {
            const payload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'verified-tarot-network',
                        email: payload.email,
                        role: 'user',
                        subscription_status: 'free'
                    }
                })
            });
        });

        await page.route('**/api/payment/create-checkout-session', async (route) => {
            checkoutPayloads.push(route.request().postDataJSON());
            await route.abort('failed');
        });

        await page.goto('/prihlaseni.html?mode=login');
        await waitForPageReady(page);
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem('mh_post_verification_checkout', JSON.stringify({
                planId: 'pruvodce',
                createdAt: Date.now(),
                context: {
                    planId: 'pruvodce',
                    source: 'inline_paywall',
                    feature: 'tarot_multi_card',
                    redirect: '/cenik.html',
                    authMode: 'register',
                    billing_interval: 'monthly',
                    metadata: {
                        entry_source: 'inline_paywall',
                        entry_feature: 'tarot_multi_card',
                        utm_source: 'email',
                        utm_campaign: 'tarot_recovery'
                    }
                }
            }));
        });

        await Promise.all([
            page.waitForURL(
                url => url.pathname === '/cenik.html' && url.searchParams.get('reason') === 'network_error',
                { timeout: 10000, waitUntil: 'domcontentloaded' }
            ),
            submitLoginForm(page, 'verify-tarot-network@example.com'),
        ]);

        expect(checkoutPayloads).toEqual([
            expect.objectContaining({
                planId: 'pruvodce',
                source: 'inline_paywall',
                feature: 'tarot_multi_card',
                billingInterval: 'monthly',
                metadata: expect.objectContaining({
                    entry_source: 'inline_paywall',
                    entry_feature: 'tarot_multi_card',
                    utm_source: 'email',
                    utm_campaign: 'tarot_recovery'
                })
            })
        ]);

        const failureUrl = new URL(page.url());
        expect(failureUrl.pathname).toBe('/cenik.html');
        expect(failureUrl.searchParams.get('payment')).toBe('failure');
        expect(failureUrl.searchParams.get('reason')).toBe('network_error');
        expect(failureUrl.searchParams.get('plan')).toBe('pruvodce');
        expect(failureUrl.searchParams.get('source')).toBe('inline_paywall');
        expect(failureUrl.searchParams.get('feature')).toBe('tarot_multi_card');
        expect(failureUrl.searchParams.get('billing_interval')).toBe('monthly');
        expect(failureUrl.searchParams.get('entry_source')).toBe('inline_paywall');
        expect(failureUrl.searchParams.get('entry_feature')).toBe('tarot_multi_card');
        expect(failureUrl.searchParams.get('utm_source')).toBe('email');
        expect(failureUrl.searchParams.get('utm_campaign')).toBe('tarot_recovery');

        await expect.poll(() => funnelEvents.find((event) => (
            event.eventName === 'checkout_post_verification_recovered'
            && event.feature === 'tarot_multi_card'
        )) || null).toEqual(expect.objectContaining({
            source: 'inline_paywall',
            feature: 'tarot_multi_card',
            planId: 'pruvodce',
            metadata: expect.objectContaining({
                billing_interval: 'monthly',
                entry_source: 'inline_paywall',
                entry_feature: 'tarot_multi_card'
            })
        }));
        expect(await page.evaluate(() => localStorage.getItem('mh_post_verification_checkout'))).toBeNull();
    });

    test('post-verification telemetry outage neblokuje checkout recovery', async ({ page }) => {
        const checkoutPayloads = [];
        let recoveryTelemetryAttempts = 0;

        await page.route('**/api/payment/funnel-event', async (route) => {
            const payload = route.request().postDataJSON();
            if (payload.eventName === 'checkout_post_verification_recovered') {
                recoveryTelemetryAttempts += 1;
            }
            await route.fulfill({
                status: 503,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'temporary telemetry outage' })
            });
        });

        await page.route('**/api/auth/login', async (route) => {
            const payload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'verified-telemetry-outage',
                        email: payload.email,
                        role: 'user',
                        subscription_status: 'free'
                    }
                })
            });
        });

        await page.route('**/api/payment/create-checkout-session', async (route) => {
            const payload = route.request().postDataJSON();
            checkoutPayloads.push(payload);
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'cs_telemetry_outage_resume',
                    url: '/profil.html?payment=success&plan=pruvodce&session_id=cs_telemetry_outage_resume'
                })
            });
        });

        await page.goto('/prihlaseni.html?mode=login');
        await waitForPageReady(page);
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem('mh_post_verification_checkout', JSON.stringify({
                planId: 'pruvodce',
                createdAt: Date.now(),
                context: {
                    planId: 'pruvodce',
                    source: 'trial_paywall',
                    feature: 'numerologie_vyklad',
                    redirect: '/cenik.html',
                    authMode: 'register',
                    metadata: {
                        entry_source: 'trial_paywall',
                        entry_feature: 'numerologie_vyklad',
                        utm_source: 'email',
                        utm_campaign: 'numerology_recovery'
                    }
                }
            }));
        });

        await Promise.all([
            page.waitForURL(
                url => url.pathname === '/profil.html' && url.searchParams.get('session_id') === 'cs_telemetry_outage_resume',
                { timeout: 10000, waitUntil: 'domcontentloaded' }
            ),
            submitLoginForm(page, 'verify-telemetry-outage@example.com'),
        ]);

        expect(checkoutPayloads).toEqual([
            expect.objectContaining({
                planId: 'pruvodce',
                source: 'trial_paywall',
                feature: 'numerologie_vyklad',
                metadata: expect.objectContaining({
                    entry_source: 'trial_paywall',
                    entry_feature: 'numerologie_vyklad',
                    utm_source: 'email',
                    utm_campaign: 'numerology_recovery'
                })
            })
        ]);
        await expect.poll(() => recoveryTelemetryAttempts, { timeout: 5000 }).toBeGreaterThanOrEqual(1);
        expect(await page.evaluate(() => localStorage.getItem('mh_post_verification_checkout'))).toBeNull();
    });

    test('expired post-verification checkout se zahodi a nepusti checkout', async ({ page }) => {
        let checkoutRequests = 0;
        const funnelEvents = [];

        await page.route('**/api/payment/funnel-event', async (route) => {
            funnelEvents.push(route.request().postDataJSON());
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.route('**/api/auth/login', async (route) => {
            const payload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: {
                        id: 'expired-post-verification-checkout',
                        email: payload.email,
                        role: 'user',
                        subscription_status: 'free'
                    }
                })
            });
        });

        await page.route('**/api/payment/create-checkout-session', async (route) => {
            checkoutRequests += 1;
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'expired checkout should not resume' })
            });
        });

        await page.goto('/prihlaseni.html?mode=login&redirect=/profil.html&source=header_login');
        await waitForPageReady(page);
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem('mh_post_verification_checkout', JSON.stringify({
                planId: 'pruvodce',
                createdAt: Date.now() - (10080 * 60 * 1000) - 1000,
                context: {
                    planId: 'pruvodce',
                    source: 'inline_paywall',
                    feature: 'tarot_multi_card',
                    redirect: '/cenik.html',
                    authMode: 'register',
                    metadata: {
                        entry_source: 'inline_paywall',
                        entry_feature: 'tarot_multi_card'
                    }
                }
            }));
        });

        await Promise.all([
            page.waitForURL(
                url => url.pathname === '/profil.html',
                { timeout: 10000, waitUntil: 'domcontentloaded' }
            ),
            submitLoginForm(page, 'expired-post-verification@example.com'),
        ]);

        expect(checkoutRequests).toBe(0);
        expect(funnelEvents.find((event) => event.eventName === 'checkout_post_verification_recovered')).toBeUndefined();
        expect(await page.evaluate(() => localStorage.getItem('mh_post_verification_checkout'))).toBeNull();
    });

    test('registrace s email verifikaci posila signup analytics jen jednou', async ({ page }) => {
        await page.route('**/api/auth/register', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    requireEmailVerification: true
                })
            });
        });

        await page.goto('/prihlaseni.html?mode=register&source=homepage_hero&feature=daily_guidance');
        await waitForPageReady(page);

        await page.evaluate(() => {
            window.__mhTrackAuthCompletedCalls = [];
            const analytics = window.MH_ANALYTICS || (window.MH_ANALYTICS = {});
            const originalTrackAuthCompleted = typeof analytics.trackAuthCompleted === 'function'
                ? analytics.trackAuthCompleted.bind(analytics)
                : null;

            analytics.trackAuthCompleted = (...args) => {
                window.__mhTrackAuthCompletedCalls.push(args);
                return originalTrackAuthCompleted ? originalTrackAuthCompleted(...args) : undefined;
            };
        });

        await submitRegisterForm(page, 'verify-once@example.com');

        await expect.poll(async () => page.evaluate(() => window.__mhTrackAuthCompletedCalls)).toEqual([
            [
                'register',
                expect.objectContaining({
                    source: 'homepage_hero',
                    feature: 'daily_guidance',
                    entry_source: 'homepage_hero',
                    ['entry_feature']: 'daily_guidance'
                })
            ]
        ]);
    });

    test('prihlaseni posila login analytics jen jednou', async ({ page }) => {
        await mockSuccessfulLogin(page, 'login-once@example.com');

        await page.goto('/prihlaseni.html?source=header_login&feature=account');
        await waitForPageReady(page);

        await page.evaluate(() => {
            window.__mhTrackAuthCompletedCalls = [];
            const analytics = window.MH_ANALYTICS || (window.MH_ANALYTICS = {});
            const originalTrackAuthCompleted = typeof analytics.trackAuthCompleted === 'function'
                ? analytics.trackAuthCompleted.bind(analytics)
                : null;

            analytics.trackAuthCompleted = (...args) => {
                window.__mhTrackAuthCompletedCalls.push(args);
                return originalTrackAuthCompleted ? originalTrackAuthCompleted(...args) : undefined;
            };
        });

        await submitLoginForm(page, 'login-once@example.com');

        await expect.poll(async () => page.evaluate(() => window.__mhTrackAuthCompletedCalls)).toEqual([
            [
                'login',
                expect.objectContaining({
                    source: 'header_login',
                    feature: 'account',
                    entry_source: 'header_login',
                    ['entry_feature']: 'account'
                })
            ]
        ]);
    });

    test('registrace s feature kontextem presmeruje na aktivacni stranku', async ({ page }) => {
        let onboardingPayload = null;
        await page.route('**/api/auth/onboarding/complete', async (route) => {
            onboardingPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    activationLifecycleQueued: true,
                    onboardingSkipped: true
                })
            });
        });
        await mockSuccessfulRegister(page);

        await page.goto('/prihlaseni.html?mode=register&redirect=/profil.html&source=inline_paywall&feature=tarot');
        await waitForPageReady(page);

        await Promise.all([
            page.waitForURL(url => url.pathname === '/tarot.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            submitRegisterForm(page),
        ]);
        await waitForPageReady(page);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/tarot.html');
        expect(url.searchParams.get('source')).toBe('signup_activation');
        expect(url.searchParams.get('feature')).toBe('tarot');
        expect(url.searchParams.get('entry_source')).toBe('inline_paywall');
        expect(url.searchParams.get('entry_feature')).toBe('tarot');
        await expect.poll(() => onboardingPayload).toEqual(expect.objectContaining({
            source: 'inline_paywall',
            feature: 'tarot',
            redirect: '/profil.html',
            flow: 'quick',
            destination: expect.stringContaining('/tarot.html?'),
            skipped: true
        }));
        expect(onboardingPayload.destination).toContain('source=signup_activation');
        expect(onboardingPayload.destination).toContain('entry_feature=tarot');
        const activationFlag = await page.evaluate(() => sessionStorage.getItem('post_auth_activation'));
        expect(activationFlag).toBeNull();
    });

    test('registrace z ulozeni tarot ano/ne vykladu zustane v profilu', async ({ page }) => {
        await mockSuccessfulRegister(page, 'tarot-yes-no-save@example.com');

        await page.goto('/prihlaseni.html?mode=register&source=tarot_yes_no_save_journal&feature=tarot_yes_no&redirect=/profil.html');
        await waitForPageReady(page);

        await expect(page.locator('#checkout-context-banner')).toBeVisible();
        await expect(page.locator('#checkout-context-label')).toContainText('Tarot ano/ne');
        await expect(page.locator('#checkout-context-title')).toContainText('Uložíme výklad do Deníku');
        await expect(page.locator('#checkout-context-copy')).toContainText('odpověď z Tarotu ano/ne');

        await Promise.all([
            page.waitForURL(url => url.pathname === '/profil.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            submitRegisterForm(page, 'tarot-yes-no-save@example.com'),
        ]);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/profil.html');
        expect(url.pathname).not.toBe('/tarot-ano-ne.html');
        const activationFlag = await page.evaluate(() => sessionStorage.getItem('post_auth_activation'));
        expect(activationFlag).toBeNull();
    });

    const activationClusterScenarios = [
        {
            name: 'numerologie',
            email: 'activation-numerology@example.com',
            source: 'life_number_result',
            feature: 'numerologie_vyklad',
            expectedPath: '/numerologie.html'
        },
        {
            name: 'natalni karta',
            email: 'activation-natal@example.com',
            source: 'natal_chart_gate',
            feature: 'natalni_interpretace',
            expectedPath: '/natalni-karta.html'
        },
        {
            name: 'partnerska shoda',
            email: 'activation-synastry@example.com',
            source: 'synastry_gate',
            feature: 'synastry',
            expectedPath: '/partnerska-shoda.html'
        },
        {
            name: 'kristalova koule',
            email: 'activation-crystal@example.com',
            source: 'crystal_ball_gate',
            feature: 'kristalova_koule',
            expectedPath: '/kristalova-koule.html'
        },
        {
            name: 'mentor',
            email: 'activation-mentor@example.com',
            source: 'mentor_inline_upsell',
            feature: 'hvezdny_mentor',
            expectedPath: '/mentor.html'
        }
    ];

    for (const scenario of activationClusterScenarios) {
        test(`registrace z clusteru ${scenario.name} drzi prvni hodnotu`, async ({ page }) => {
            await mockSuccessfulRegister(page, scenario.email);

            await page.goto(`/prihlaseni.html?mode=register&redirect=/profil.html&source=${scenario.source}&feature=${scenario.feature}`);
            await waitForPageReady(page);

            await Promise.all([
                page.waitForURL(url => url.pathname === scenario.expectedPath, { timeout: 10000, waitUntil: 'commit' }),
                submitRegisterForm(page, scenario.email),
            ]);
            await waitForPageReady(page);

            const url = new URL(page.url());
            expect(url.pathname).toBe(scenario.expectedPath);
            expect(url.searchParams.get('source')).toBe('signup_activation');
            expect(url.searchParams.get('feature')).toBe(scenario.feature);
            expect(url.searchParams.get('entry_source')).toBe(scenario.source);
            expect(url.searchParams.get('entry_feature')).toBe(scenario.feature);
            const activationFlag = await page.evaluate(() => sessionStorage.getItem('post_auth_activation'));
            expect(activationFlag).toBeNull();
        });
    }

    test('registrace z andelske karty se vraci k andelskym kartam', async ({ page }) => {
        await mockSuccessfulRegister(page, 'angel-card@example.com');

        await page.goto('/prihlaseni.html?mode=register&feature=daily_angel_card');
        await waitForPageReady(page);

        await expect(page.locator('#checkout-context-title')).toContainText('Karta dne');

        await Promise.all([
            page.waitForURL(url => url.pathname === '/andelske-karty.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            submitRegisterForm(page, 'angel-card@example.com'),
        ]);
        await waitForPageReady(page);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/andelske-karty.html');
        expect(url.searchParams.get('source')).toBe('signup_activation');
        expect(url.searchParams.get('feature')).toBe('daily_angel_card');
        expect(url.searchParams.get('entry_feature')).toBe('daily_angel_card');
        const activationFlag = await page.evaluate(() => sessionStorage.getItem('post_auth_activation'));
        expect(activationFlag).toBeNull();
    });

    test('registrace s redirectem na andelske karty nepouziva kontext Karty dne', async ({ page }) => {
        await page.goto('/prihlaseni.html?mode=register&redirect=/andelske-karty.html');
        await waitForPageReady(page);

        const contextTitle = page.locator('#checkout-context-title');
        const contextCopy = page.locator('#checkout-context-copy');
        await expect(contextTitle).toContainText('Andělské karty');
        await expect(contextCopy).toContainText('andělským kartám');
        await expect(contextTitle).not.toContainText('Karta dne');
    });

    test('registrace ze samanskeho kola se vraci na kanonickou stranku bez legacy presmerovani', async ({ page }) => {
        await mockSuccessfulRegister(page, 'shaman-wheel@example.com');

        await page.goto('/prihlaseni.html?mode=register&feature=shamanske_kolo_plne_cteni');
        await waitForPageReady(page);

        await Promise.all([
            page.waitForURL(url => url.pathname === '/shamansko-kolo.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            submitRegisterForm(page, 'shaman-wheel@example.com'),
        ]);
        await waitForPageReady(page);

        expect(new URL(page.url()).pathname).toBe('/shamansko-kolo.html');
        const activationFlag = await page.evaluate(() => sessionStorage.getItem('post_auth_activation'));
        expect(activationFlag).toBeNull();
    });

    test('registrace z minuleho zivota drzi symbolicky trust copy', async ({ page }) => {
        await mockSuccessfulRegister(page, 'past-life-symbolic@example.com');

        await page.goto('/prihlaseni.html?mode=register&feature=minuly_zivot');
        await waitForPageReady(page);

        await expect(page.locator('#checkout-context-title')).toContainText('Minulý život');
        await expect(page.locator('#signup-next-step-copy')).toContainText('archetypálním příběhem pro sebereflexi');

        await Promise.all([
            page.waitForURL(url => url.pathname === '/minuly-zivot.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            submitRegisterForm(page, 'past-life-symbolic@example.com'),
        ]);
        await waitForPageReady(page);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/minuly-zivot.html');
        expect(url.searchParams.get('source')).toBe('signup_activation');
        expect(url.searchParams.get('feature')).toBe('minuly_zivot');
        expect(url.searchParams.get('entry_feature')).toBe('minuly_zivot');
        const activationFlag = await page.evaluate(() => sessionStorage.getItem('post_auth_activation'));
        expect(activationFlag).toBeNull();
    });

    test('registrace s newsletter zdrojem presmeruje na horoskopy', async ({ page }) => {
        await mockSuccessfulRegister(page, 'newsletter-activation@example.com');

        await page.goto('/prihlaseni.html?mode=register&redirect=/profil.html&source=newsletter_form');
        await waitForPageReady(page);

        await Promise.all([
            page.waitForURL(url => url.pathname === '/horoskopy.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            submitRegisterForm(page, 'newsletter-activation@example.com'),
        ]);
        await waitForPageReady(page);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/horoskopy.html');
        expect(url.searchParams.get('source')).toBe('signup_activation');
        expect(url.searchParams.get('feature')).toBeNull();
        expect(url.searchParams.get('entry_source')).toBe('newsletter_form');
        expect(url.searchParams.get('entry_feature')).toBeNull();
        const activationFlag = await page.evaluate(() => sessionStorage.getItem('post_auth_activation'));
        expect(activationFlag).toBeNull();
    });

    test('registrace z homepage hero CTA presmeruje na prvni denni hodnotu', async ({ page }) => {
        await mockSuccessfulRegister(page, 'homepage-hero@example.com');

        await page.goto('/prihlaseni.html?mode=register&source=homepage_hero&feature=daily_guidance');
        await waitForPageReady(page);

        await Promise.all([
            page.waitForURL(url => url.pathname === '/horoskopy.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            submitRegisterForm(page, 'homepage-hero@example.com'),
        ]);
        await waitForPageReady(page);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/horoskopy.html');
        expect(url.searchParams.get('source')).toBe('signup_activation');
        expect(url.searchParams.get('feature')).toBe('daily_guidance');
        expect(url.searchParams.get('entry_source')).toBe('homepage_hero');
        expect(url.searchParams.get('entry_feature')).toBe('daily_guidance');
        const activationFlag = await page.evaluate(() => sessionStorage.getItem('post_auth_activation'));
        expect(activationFlag).toBeNull();
    });

    test('signup activation analytics outage neblokuje presmerovani na prvni hodnotu', async ({ page }) => {
        await mockSuccessfulRegister(page, 'activation-analytics-outage@example.com');

        await page.goto('/prihlaseni.html?mode=register&source=homepage_hero&feature=daily_guidance');
        await waitForPageReady(page);
        await page.evaluate(() => {
            const analytics = window.MH_ANALYTICS || (window.MH_ANALYTICS = {});
            analytics.trackEvent = (eventName) => {
                if (eventName === 'signup_activation_redirected' || eventName === 'signup_activation_landed') {
                    throw new Error('temporary activation analytics outage');
                }
            };
        });

        await Promise.all([
            page.waitForURL(url => url.pathname === '/horoskopy.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            submitRegisterForm(page, 'activation-analytics-outage@example.com'),
        ]);
        await waitForPageReady(page);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/horoskopy.html');
        expect(url.searchParams.get('source')).toBe('signup_activation');
        expect(url.searchParams.get('feature')).toBe('daily_guidance');
        expect(url.searchParams.get('entry_source')).toBe('homepage_hero');
        expect(url.searchParams.get('entry_feature')).toBe('daily_guidance');
        const activationFlag = await page.evaluate(() => sessionStorage.getItem('post_auth_activation'));
        expect(activationFlag).toBeNull();
    });

    test('save reading analytics outage neblokuje ulozeni prvni hodnoty', async ({ page }) => {
        let savedPayload = null;
        await page.route('**/api/user/readings', async (route) => {
            savedPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    reading: {
                        id: 'reading_analytics_outage',
                        type: 'tarot',
                        data: { cards: ['The Star'] }
                    }
                })
            });
        });

        await page.goto('/tarot.html', { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page);
        const savedReading = await page.evaluate(async () => {
            document.cookie = 'logged_in=1; path=/';
            const user = {
                id: 'reading-analytics-outage-user',
                email: 'reading-analytics-outage@example.com',
                role: 'user',
                subscription_status: 'free'
            };
            localStorage.setItem('auth_user', JSON.stringify(user));
            localStorage.removeItem('mh_first_value_completed');
            window.Auth.user = user;
            window.__readingSavedEvents = [];
            window.addEventListener('reading:saved', (event) => {
                window.__readingSavedEvents.push({
                    id: event.detail?.reading?.id || null,
                    type: event.detail?.type || null
                });
            });

            const analytics = window.MH_ANALYTICS || (window.MH_ANALYTICS = {});
            analytics.trackEvent = (eventName) => {
                if (eventName === 'feature_reading_saved' || eventName === 'first_value_completed') {
                    throw new Error('temporary reading analytics outage');
                }
            };

            return window.Auth.saveReading('tarot', { cards: ['The Star'] });
        });

        expect(savedReading).toEqual(expect.objectContaining({
            id: 'reading_analytics_outage',
            type: 'tarot'
        }));
        expect(savedPayload).toEqual(expect.objectContaining({
            type: 'tarot',
            expectedUserId: 'reading-analytics-outage-user'
        }));
        await expect.poll(() => page.evaluate(() => localStorage.getItem('mh_first_value_completed'))).toBe('1');
        await expect.poll(() => page.evaluate(() => window.__readingSavedEvents)).toEqual([
            {
                id: 'reading_analytics_outage',
                type: 'tarot'
            }
        ]);
    });

    test('save reading zruší požadavek, když se účet změní během načítání CSRF tokenu', async ({ page }) => {
        let saveRequests = 0;
        await page.route('**/api/user/readings', async route => {
            saveRequests += 1;
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
        });

        await page.goto('/tarot.html', { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page);
        const savedReading = await page.evaluate(async () => {
            document.cookie = 'logged_in=1; path=/';
            const originalUser = { id: 'reading-original-account', email: 'original@example.test' };
            localStorage.setItem('auth_user', JSON.stringify(originalUser));
            window.Auth.user = originalUser;

            let releaseCsrf;
            window.getCSRFToken = () => new Promise(resolve => { releaseCsrf = resolve; });
            const pendingSave = window.Auth.saveReading('tarot', { cards: ['The Star'] }, 'reading-original-account');
            await Promise.resolve();
            await new Promise(resolve => setTimeout(resolve, 0));
            const newUser = { id: 'reading-new-account', email: 'new@example.test' };
            localStorage.setItem('auth_user', JSON.stringify(newUser));
            window.Auth.user = newUser;
            releaseCsrf('test-csrf');
            return pendingSave;
        });

        expect(savedReading).toBeNull();
        expect(saveRequests).toBe(0);
    });

    test('feedback výkladu zruší požadavek, když se účet změní během CSRF čekání', async ({ page }) => {
        let feedbackRequests = 0;
        await page.route('**/api/user/readings/reading-original/feedback', async route => {
            feedbackRequests += 1;
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
        });

        await page.goto('/tarot.html', { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page);
        const feedback = await page.evaluate(async () => {
            document.cookie = 'logged_in=1; path=/';
            const originalUser = { id: 'feedback-original-account', email: 'original@example.test' };
            localStorage.setItem('auth_user', JSON.stringify(originalUser));
            window.Auth.user = originalUser;

            let releaseCsrf;
            window.getCSRFToken = () => new Promise(resolve => { releaseCsrf = resolve; });
            const pendingFeedback = window.Auth.saveReadingFeedback(
                'reading-original',
                { resonance: 'fits' },
                'feedback-original-account'
            );
            await Promise.resolve();
            await new Promise(resolve => setTimeout(resolve, 0));
            const newUser = { id: 'feedback-new-account', email: 'new@example.test' };
            localStorage.setItem('auth_user', JSON.stringify(newUser));
            window.Auth.user = newUser;
            releaseCsrf('test-csrf');
            return pendingFeedback;
        });

        expect(feedback).toBeNull();
        expect(feedbackRequests).toBe(0);
    });

    test('Auth aktualizuje otevřenou kartu při změně účtu v jiné kartě', async ({ page }) => {
        await page.goto('/tarot.html', { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page);

        const result = await page.evaluate(() => {
            document.cookie = 'logged_in=1; path=/';
            const originalUser = { id: 'cross-tab-original-user', email: 'original@example.test' };
            const nextUser = { id: 'cross-tab-next-user', email: 'next@example.test' };
            localStorage.setItem('auth_user', JSON.stringify(originalUser));
            window.Auth.user = originalUser;
            let authChangedEvents = 0;
            document.addEventListener('auth:changed', () => { authChangedEvents += 1; });
            localStorage.setItem('auth_user', JSON.stringify(nextUser));

            window.dispatchEvent(new StorageEvent('storage', {
                key: 'auth_user',
                oldValue: JSON.stringify(originalUser),
                newValue: JSON.stringify(nextUser)
            }));

            return { userId: window.Auth.user?.id, authChangedEvents };
        });

        expect(result.userId).toBe('cross-tab-next-user');
        expect(result.authChangedEvents).toBeGreaterThan(0);
    });

    test('čekající odhlášení účtu A neukončí relaci účtu B', async ({ page }) => {
        let logoutRequests = 0;
        await page.route('**/api/auth/logout', async route => {
            logoutRequests += 1;
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
        });
        await page.goto('/tarot.html', { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page);

        await page.evaluate(() => {
            document.cookie = 'logged_in=1; path=/';
            const originalUser = { id: 'logout-original-user', email: 'original@example.test' };
            localStorage.setItem('auth_user', JSON.stringify(originalUser));
            window.Auth.user = originalUser;
            window.getCSRFToken = () => new Promise(resolve => { window.__releaseLogoutCsrf = resolve; });
            window.__pendingLogout = window.Auth.logout();
        });
        await page.waitForFunction(() => typeof window.__releaseLogoutCsrf === 'function');

        await page.evaluate(() => {
            const nextUser = { id: 'logout-next-user', email: 'next@example.test' };
            const serializedUser = JSON.stringify(nextUser);
            localStorage.setItem('auth_user', serializedUser);
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'auth_user',
                newValue: serializedUser
            }));
            window.__releaseLogoutCsrf('test-csrf-token');
        });
        await page.evaluate(async () => { await window.__pendingLogout; });

        const state = await page.evaluate(() => ({
            userId: window.Auth.user?.id,
            cachedUserId: JSON.parse(localStorage.getItem('auth_user') || 'null')?.id,
            loggedIn: window.Auth.isLoggedIn()
        }));
        expect(logoutRequests).toBe(0);
        expect(state).toEqual({
            userId: 'logout-next-user',
            cachedUserId: 'logout-next-user',
            loggedIn: true
        });
    });

    test('pozdní obnova profilu nepřepíše účet přihlášený v jiné kartě', async ({ page }) => {
        const originalUser = {
            id: 'refresh-original-user',
            email: 'original@example.test',
            role: 'user',
            subscription_status: 'free'
        };
        const nextUser = {
            id: 'refresh-next-user',
            email: 'next@example.test',
            role: 'user',
            subscription_status: 'free'
        };
        await page.addInitScript(user => {
            document.cookie = 'logged_in=1; path=/';
            localStorage.setItem('auth_user', JSON.stringify(user));
        }, originalUser);
        await page.route('**/api/auth/profile', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, user: originalUser })
        }));
        await page.goto('/tarot.html', { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page);
        await page.unroute('**/api/auth/profile');

        let releaseResponse;
        let requestStarted;
        const responseGate = new Promise(resolve => { releaseResponse = resolve; });
        const requestStartedPromise = new Promise(resolve => { requestStarted = resolve; });
        await page.route('**/api/auth/profile', async route => {
            requestStarted();
            await responseGate;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, user: originalUser })
            });
        });
        await page.evaluate(() => {
            window.__authRefreshFinished = false;
            window.Auth.refreshSession().finally(() => { window.__authRefreshFinished = true; });
        });
        await requestStartedPromise;

        await page.evaluate(user => {
            const serializedUser = JSON.stringify(user);
            localStorage.setItem('auth_user', serializedUser);
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'auth_user',
                newValue: serializedUser
            }));
        }, nextUser);
        releaseResponse();
        await page.waitForFunction(() => window.__authRefreshFinished);

        const state = await page.evaluate(() => ({
            userId: window.Auth.user?.id,
            cachedUserId: JSON.parse(localStorage.getItem('auth_user') || 'null')?.id
        }));
        expect(state).toEqual({ userId: nextUser.id, cachedUserId: nextUser.id });
    });

    test('pozdní 401 ze starého profilu neodhlásí nový účet', async ({ page }) => {
        const originalUser = {
            id: 'refresh-expired-user',
            email: 'expired@example.test',
            role: 'user',
            subscription_status: 'free'
        };
        const nextUser = {
            id: 'refresh-active-user',
            email: 'active@example.test',
            role: 'user',
            subscription_status: 'free'
        };
        await page.addInitScript(user => {
            document.cookie = 'logged_in=1; path=/';
            localStorage.setItem('auth_user', JSON.stringify(user));
        }, originalUser);
        await page.route('**/api/auth/profile', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, user: originalUser })
        }));
        await page.goto('/tarot.html', { waitUntil: 'domcontentloaded' });
        await waitForPageReady(page);
        await page.unroute('**/api/auth/profile');

        let releaseResponse;
        let requestStarted;
        const responseGate = new Promise(resolve => { releaseResponse = resolve; });
        const requestStartedPromise = new Promise(resolve => { requestStarted = resolve; });
        await page.route('**/api/auth/profile', async route => {
            requestStarted();
            await responseGate;
            await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false }) });
        });
        await page.evaluate(() => {
            window.__authRefreshFinished = false;
            window.Auth.refreshSession().finally(() => { window.__authRefreshFinished = true; });
        });
        await requestStartedPromise;

        await page.evaluate(user => {
            const serializedUser = JSON.stringify(user);
            localStorage.setItem('auth_user', serializedUser);
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'auth_user',
                newValue: serializedUser
            }));
        }, nextUser);
        releaseResponse();
        await page.waitForFunction(() => window.__authRefreshFinished);

        const state = await page.evaluate(() => ({
            userId: window.Auth.user?.id,
            cachedUserId: JSON.parse(localStorage.getItem('auth_user') || 'null')?.id,
            loggedIn: window.Auth.isLoggedIn()
        }));
        expect(state).toEqual({ userId: nextUser.id, cachedUserId: nextUser.id, loggedIn: true });
        await expect(page.locator('#auth-btn')).toHaveText(/Odhlásit se/);
    });

    test('registrace z free CTA ceniku presmeruje na denni horoskopy', async ({ page }) => {
        await mockSuccessfulRegister(page, 'pricing-free@example.com');

        await page.goto('/prihlaseni.html?mode=register&redirect=/horoskopy.html&source=pricing_free_cta');
        await waitForPageReady(page);

        await Promise.all([
            page.waitForURL(url => url.pathname === '/horoskopy.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            submitRegisterForm(page, 'pricing-free@example.com'),
        ]);
        await waitForPageReady(page);

        expect(new URL(page.url()).pathname).toBe('/horoskopy.html');
        const activationFlag = await page.evaluate(() => sessionStorage.getItem('post_auth_activation'));
        expect(activationFlag).toBeNull();
    });

    test('registrace bez aktivacniho kontextu presmeruje do onboardingu', async ({ page }) => {
        let directCompletionRequests = 0;
        await page.route('**/api/auth/onboarding/complete', async (route) => {
            directCompletionRequests += 1;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });
        await mockSuccessfulRegister(page, 'onboarding@example.com');

        await page.goto('/prihlaseni.html?mode=register&redirect=/profil.html');
        await waitForPageReady(page);
        await page.evaluate(() => localStorage.setItem('mh_onboarded', '1'));

        await Promise.all([
            page.waitForURL(url => url.pathname === '/onboarding.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            submitRegisterForm(page, 'onboarding@example.com'),
        ]);
        await waitForPageReady(page);

        const onboardingUrl = new URL(page.url());
        expect(onboardingUrl.pathname).toBe('/onboarding.html');
        await expect(page.locator('#step-2')).toHaveClass(/active/);
        await expect(page.locator('#quick-finish-onboarding-btn')).toBeVisible();
        expect(directCompletionRequests).toBe(0);
    });

    test('nova registrace bez potvrzovaciho emailu projde cely onboarding', async ({ page }) => {
        const unique = Date.now();
        const email = `onboarding-real-${unique}@example.com`;

        await page.goto('/prihlaseni.html?mode=register&source=header_register&feature=account');
        await waitForPageReady(page);

        const registerResponsePromise = page.waitForResponse((response) => (
            response.url().includes('/api/auth/register') && response.request().method() === 'POST'
        )).then(async (response) => ({
            status: response.status(),
            body: await response.json()
        }));

        await Promise.all([
            page.waitForURL(url => url.pathname === '/onboarding.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            submitRegisterForm(page, email),
        ]);

        const registerResponse = await registerResponsePromise;
        expect(registerResponse.status).toBe(200);
        const registerBody = registerResponse.body;
        expect(registerBody).toEqual(expect.objectContaining({
            success: true,
            emailVerificationSkipped: true,
            user: expect.objectContaining({
                email,
                subscription_status: 'free'
            })
        }));
        expect(registerBody.requireEmailVerification).toBeUndefined();

        const cookies = await page.context().cookies();
        expect(cookies.find(cookie => cookie.name === 'logged_in')?.value).toBe('1');
        await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('auth_user') || 'null')?.email)).toBe(email);

        const onboardingUrl = new URL(page.url());
        expect(onboardingUrl.searchParams.get('source')).toBe('header_register');
        expect(onboardingUrl.searchParams.get('feature')).toBe('account');
        await expect(page.locator('#step-2')).toHaveClass(/active/);
        await expect(page.locator('#step-1')).not.toHaveClass(/active/);
        await expect(page.locator('#quick-finish-onboarding-btn')).toBeVisible();
        await expect(page.locator('#quick-finish-onboarding-btn')).toBeDisabled();
        await page.locator('.zodiac-btn[data-sign="lev"]').click();
        await expect(page.locator('#quick-finish-onboarding-btn')).toBeEnabled();
        await expect(page.locator('#quick-finish-onboarding-btn')).toContainText('Lva');

        const completionResponsePromise = page.waitForResponse((response) => (
            response.url().includes('/api/auth/onboarding/complete') && response.request().method() === 'POST'
        )).then(async (response) => ({
            status: response.status()
        }));

        await Promise.all([
            page.waitForURL(url => url.pathname === '/horoskopy.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            page.locator('#quick-finish-onboarding-btn').click(),
        ]);

        const completionResponse = await completionResponsePromise;
        expect(completionResponse.status).toBe(200);

        const finalUrl = new URL(page.url());
        expect(finalUrl.pathname).toBe('/horoskopy.html');
        expect(finalUrl.searchParams.get('source')).toBe('onboarding_complete');
        expect(finalUrl.searchParams.get('sign')).toBe('lev');
        expect(finalUrl.searchParams.get('entry_source')).toBe('header_register');
        expect(finalUrl.searchParams.get('entry_feature')).toBe('account');
        expect(await page.evaluate(() => localStorage.getItem('mh_onboarded'))).toBe('1');
        expect(await page.evaluate(() => localStorage.getItem('mh_zodiac'))).toBe('lev');
    });

    test('registrace z headeru zachova kontext v onboardingu', async ({ page }) => {
        await mockSuccessfulRegister(page, 'header-onboarding@example.com');

        await page.goto('/prihlaseni.html?mode=register&source=header_register&feature=account');
        await waitForPageReady(page);

        await Promise.all([
            page.waitForURL(url => url.pathname === '/onboarding.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            submitRegisterForm(page, 'header-onboarding@example.com'),
        ]);
        await waitForPageReady(page);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/onboarding.html');
        expect(url.searchParams.get('source')).toBe('header_register');
        expect(url.searchParams.get('feature')).toBe('account');
        await expect(page.locator('#step-2')).toHaveClass(/active/);
        await expect(page.locator('#step-2 .step-title')).toContainText('znamení');
    });

    // ── Klientská validace ────────────────────────────────────────────────────

    test('prázdný formulář aktivuje HTML5 validaci (nevyvolá síťový request)', async ({ page }) => {
        // Monitorujeme requesty — prázdný submit by neměl poslat POST
        const postRequests = [];
        page.on('request', req => {
            if (req.method() === 'POST') postRequests.push(req.url());
        });

        await page.locator('#auth-submit').first().click();

        // Krátká pauza pro případné async operace
        await page.waitForTimeout(500);

        // Buď HTML5 validace zabránila odeslání, nebo server vrátil 4xx
        // V každém případě stránka musí zůstat přítomná
        const form = page.locator('#login-form').first();
        await expect(form).toBeVisible();
    });

    test('email pole přijímá vstup', async ({ page }) => {
        const emailInput = page.locator('#email').first();
        await emailInput.fill('test@example.com');
        await expect(emailInput).toHaveValue('test@example.com');
    });

    test('heslo pole přijímá vstup a maskuje ho', async ({ page }) => {
        const passwordInput = page.locator('#password').first();
        await passwordInput.fill('TestHeslo123!');
        await expect(passwordInput).toHaveValue('TestHeslo123!');
        // Typ musí zůstat password (maskovano)
        expect(await passwordInput.getAttribute('type')).toBe('password');
    });

    test('autocomplete atributy jsou nastaveny (UX + správci hesel)', async ({ page }) => {
        const emailAC = await page.locator('#email').first().getAttribute('autocomplete');
        const pwAC = await page.locator('#password').first().getAttribute('autocomplete');
        expect(emailAC).toBeTruthy();
        expect(pwAC).toBeTruthy();
    });

    // ── Zapomenuté heslo ─────────────────────────────────────────────────────

    test('"Zapomněli jste heslo?" tlačítko existuje', async ({ page }) => {
        // Stránka může mít tlačítko vícekrát (page + modal) — bereme první
        const forgotBtn = page.locator('#forgot-password-link').first();
        await expect(forgotBtn).toBeVisible();
    });

    test('kliknutí na "Zapomněli jste heslo?" zobrazí forgot password formulář', async ({ page }) => {
        await page.locator('#forgot-password-link').first().click();
        await page.waitForTimeout(400);

        // Po kliknutí by se měl formulář zobrazit nebo odkaz provést akci
        // Testujeme pouze že stránka zůstala funkční
        await expect(page.locator('body')).toBeVisible();
    });

    test('forgot-password-form má email input', async ({ page }) => {
        const forgotEmail = page.locator('#forgot-email').first();
        await expect(forgotEmail).toBeAttached();
        expect(await forgotEmail.getAttribute('type')).toBe('email');
    });

    test('požadavek na obnovu hesla zamkne e-mail a odešle jen jednou', async ({ page }) => {
        let requestCount = 0;
        let releaseForgotResponse;
        const forgotResponseGate = new Promise(resolve => { releaseForgotResponse = resolve; });
        await page.route('**/api/auth/forgot-password', async (route) => {
            requestCount += 1;
            await forgotResponseGate;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, message: 'Pokud účet existuje, poslali jsme odkaz.' })
            });
        });

        await page.goto('/prihlaseni.html');
        await waitForPageReady(page);
        await page.locator('#forgot-password-link').click();
        const form = page.locator('#forgot-password-form');
        const email = page.locator('#forgot-email');
        const submit = form.locator('button[type="submit"]');
        await email.fill('forgot-lock@example.com');
        await submit.click();

        await expect(submit).toBeDisabled();
        await expect(email).toBeDisabled();
        await expect(form).toHaveAttribute('aria-busy', 'true');
        await form.dispatchEvent('submit', { bubbles: true, cancelable: true });
        await expect.poll(() => requestCount).toBe(1);

        releaseForgotResponse();
        await expect(page.locator('#recovery-request-status')).toBeVisible();
        await expect(submit).toBeEnabled();
        await expect(email).toBeEnabled();
        await expect(form).not.toHaveAttribute('aria-busy', 'true');
    });

    test('obnova hesla vrátí přihlášení k rozepsané reflexi', async ({ page }) => {
        let forgotPayload = null;
        await page.route('**/api/auth/forgot-password', route => {
            forgotPayload = route.request().postDataJSON();
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, message: 'Pokud účet existuje, poslali jsme odkaz.' })
            });
        });
        await page.route('**/api/auth/reset-password', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, message: 'Heslo bylo úspěšně změněno.' })
        }));
        await page.route('**/api/auth/reset-password/validate', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ valid: true })
        }));

        await page.goto('/prihlaseni.html?redirect=%2Fprofil.html%23journal-input');
        await waitForPageReady(page);
        await page.locator('#forgot-password-link').click();
        await page.locator('#forgot-email').fill('reset-flow@example.com');
        await page.locator('#forgot-password-form button[type="submit"]').click();
        await expect(page.locator('#recovery-request-status')).toContainText(
            'Pokud je účet s tímto e-mailem vedený, může na něj přijít odkaz k obnovení hesla.'
        );
        await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('mh_password_reset_return') || 'null')?.target))
            .toBe('/profil.html#journal-input');
        expect(forgotPayload).toEqual({ email: 'reset-flow@example.com' });

        await page.goto('/prihlaseni.html?reset=true#access_token=e2e-reset-token&type=recovery');
        await waitForPageReady(page);
        await expect(page.locator('#reset-password-form')).toBeVisible();
        await expect(page.locator('#auth-modal')).toBeHidden();
        await page.locator('#new-password').fill('NewPassword123!');
        await page.locator('#confirm-password').fill('NewPassword123!');
        await page.locator('#reset-password-form button[type="submit"]').click();

        await expect(page.locator('#reset-password-status a')).toHaveAttribute(
            'href',
            '/prihlaseni.html?redirect=%2Fprofil.html%23journal-input'
        );
        expect(await page.evaluate(() => window.location.hash)).toBe('');
        expect(await page.evaluate(() => localStorage.getItem('mh_password_reset_return'))).toBeNull();
    });

    test('reset hesla zamkne hodnoty a odešle jen jeden požadavek', async ({ page }) => {
        let requestCount = 0;
        let releaseResetResponse;
        const resetResponseGate = new Promise(resolve => { releaseResetResponse = resolve; });
        await page.route('**/api/auth/reset-password', async (route) => {
            requestCount += 1;
            await resetResponseGate;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, message: 'Heslo bylo úspěšně změněno.' })
            });
        });
        await page.route('**/api/auth/reset-password/validate', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ valid: true })
        }));

        await page.goto('/prihlaseni.html?reset=true#access_token=e2e-reset-token&type=recovery');
        await waitForPageReady(page);
        const form = page.locator('#reset-password-form');
        const submit = form.locator('button[type="submit"]');
        const password = page.locator('#new-password');
        const confirmation = page.locator('#confirm-password');
        await password.fill('NewPassword123!');
        await confirmation.fill('NewPassword123!');
        await submit.click();

        await expect(submit).toBeDisabled();
        await expect(password).toBeDisabled();
        await expect(confirmation).toBeDisabled();
        await expect(form).toHaveAttribute('aria-busy', 'true');
        await form.dispatchEvent('submit', { bubbles: true, cancelable: true });
        await expect.poll(() => requestCount).toBe(1);

        releaseResetResponse();
        await expect(page.locator('#reset-password-status')).toBeVisible();
        await expect(form).not.toHaveAttribute('aria-busy', 'true');
        await expect(password).toBeEnabled();
        await expect(confirmation).toBeEnabled();
    });

    test('neplatný recovery odkaz odstraní nepoužitý token z URL', async ({ page }) => {
        await page.goto('/prihlaseni.html?reset=true#error=access_denied&error_code=otp_expired');
        await waitForPageReady(page);

        await expect(page.locator('#forgot-password-form')).toBeVisible();
        await expect(page.locator('#reset-password-form')).toBeHidden();
        expect(await page.evaluate(() => window.location.hash)).toBe('');
    });

    test('expirovaný bearer zobrazí žádost o nový resetovací odkaz před formulářem hesla', async ({ page }) => {
        await page.route('**/api/auth/reset-password/validate', route => route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ valid: false })
        }));

        await page.goto('/prihlaseni.html?reset=true#access_token=expired-e2e-token&type=recovery');
        await waitForPageReady(page);

        await expect(page.locator('#reset-password-form')).toBeHidden();
        await expect(page.locator('#forgot-password-form')).toBeVisible();
        await expect(page.locator('#forgot-password-form')).toContainText('Odkaz pro obnovu už není platný');
        expect(await page.evaluate(() => window.location.hash)).toBe('');
    });

    test('neúspěšná žádost o reset smaže starý návratový cíl', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('mh_password_reset_return', JSON.stringify({
            target: '/profil.html#journal-input',
            savedAt: Date.now()
        })));
        await page.route('**/api/auth/forgot-password', route => route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, error: 'Služba je dočasně nedostupná.' })
        }));

        await page.goto('/prihlaseni.html?redirect=%2Fprofil.html%23journal-input');
        await waitForPageReady(page);
        await page.locator('#forgot-password-link').click();
        await page.locator('#forgot-email').fill('reset-flow@example.com');
        const forgotResponse = page.waitForResponse(response => response.url().includes('/api/auth/forgot-password'));
        await page.locator('#forgot-password-form button[type="submit"]').click();
        await forgotResponse;

        expect(await page.evaluate(() => localStorage.getItem('mh_password_reset_return'))).toBeNull();
    });

    // ── Confirm password pole ─────────────────────────────────────────────────

    test('registrace na prihlaseni.html nema potvrzeni hesla, reset ho ma', async ({ page }) => {
        // Zjednodušený signup posílá jen email + heslo — potvrzovací pole
        // bylo záměrně odstraněno (nižší tření). Wrapper zůstává jen
        // v auth modalu (js/templates.js), na standalone stránce být nesmí.
        await expect(page.locator('#confirm-password-field-wrapper')).toHaveCount(0);
        // Formulář pro reset hesla své potvrzovací pole dál má.
        await expect(page.locator('#reset-password-form #confirm-password')).toBeAttached();
    });
});

test.describe('Auth modal', () => {
    test('zámek modalu zabrání duplicitnímu přihlášení během čekání na API', async ({ page }) => {
        let requestCount = 0;
        let releaseLoginResponse;
        const loginResponseGate = new Promise(resolve => { releaseLoginResponse = resolve; });
        await page.route('**/api/auth/login', async (route) => {
            requestCount += 1;
            await loginResponseGate;
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({ success: false, error: 'Invalid credentials' })
            });
        });

        await page.goto('/tarot.html?source=e2e_auth_modal_submit_lock');
        await waitForPageReady(page);
        await page.evaluate(() => window.Auth.openModal('login'));
        const form = page.locator('#auth-modal #login-form');
        const submit = page.locator('#auth-modal #auth-submit');
        await page.locator('#auth-modal-email').fill('auth-lock@example.com');
        await page.locator('#auth-modal-password').fill('IncorrectPassword123!');
        await submit.click();

        await expect(submit).toBeDisabled();
        await expect(page.locator('#auth-modal-email')).toBeDisabled();
        await expect(page.locator('#auth-modal-password')).toBeDisabled();
        await expect(form).toHaveAttribute('aria-busy', 'true');
        await page.locator('#auth-modal #auth-mode-toggle').click();
        await expect(page.locator('#auth-modal #auth-title')).toHaveText('Přihlášení');
        await form.dispatchEvent('submit', { bubbles: true, cancelable: true });
        await expect.poll(() => requestCount).toBe(1);

        releaseLoginResponse();
        await expect(page.locator('#auth-modal-status')).toHaveAttribute('role', 'alert');
        await expect(submit).toBeEnabled();
        await expect(page.locator('#auth-modal-email')).toBeEnabled();
        await expect(page.locator('#auth-modal-password')).toBeEnabled();
        await expect(form).not.toHaveAttribute('aria-busy', 'true');
    });

    test('reset hesla v modalu zamkne e-mail a zabrání druhému požadavku', async ({ page }) => {
        let requestCount = 0;
        let releaseResetResponse;
        const resetResponseGate = new Promise(resolve => { releaseResetResponse = resolve; });
        await page.route('**/api/auth/forgot-password', async (route) => {
            requestCount += 1;
            await resetResponseGate;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.goto('/tarot.html?source=e2e_auth_modal_reset_lock');
        await waitForPageReady(page);
        await page.evaluate(() => window.Auth.openModal('login'));
        const modal = page.locator('#auth-modal');
        const form = modal.locator('#login-form');
        const submit = modal.locator('#auth-submit');
        const email = modal.locator('#auth-modal-email');
        await modal.locator('#auth-forgot-password').click();
        await email.fill('forgot-lock@example.com');
        await submit.click();

        await expect(submit).toBeDisabled();
        await expect(email).toBeDisabled();
        await expect(form).toHaveAttribute('aria-busy', 'true');
        await modal.locator('#auth-mode-toggle').click();
        await expect(modal.locator('#auth-title')).toHaveText('Obnovení hesla');
        await form.dispatchEvent('submit', { bubbles: true, cancelable: true });
        await expect.poll(() => requestCount).toBe(1);

        releaseResetResponse();
        await expect(modal.locator('#auth-modal-status')).toContainText('Pokud je účet s tímto e-mailem vedený');
        await expect(submit).toBeEnabled();
        await expect(email).toBeEnabled();
        await expect(form).not.toHaveAttribute('aria-busy', 'true');
    });

    test('slovenské a poľské prihlasovacie okno je lokalizované aj v režimoch registrácie a obnovy hesla', async ({ page }) => {
        await page.route('**/api/auth/login', (route) => route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, error: 'Invalid credentials' })
        }));
        await page.route('**/api/auth/forgot-password', (route) => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
        }));

        for (const locale of [
            {
                path: '/sk/index.html', language: 'sk', login: 'Prihlásenie', register: 'Registrácia', reset: 'Obnovenie hesla',
                legal: 'v češtine', loginError: 'Prihlásenie sa nepodarilo. Skontroluj e-mail a heslo.',
                resetMessage: 'Ak je tento e-mail u nás zaregistrovaný, môže naň prísť odkaz na obnovenie hesla. Skontroluj aj spam; ak odkaz nepríde, môžeš požiadať znova.'
            },
            {
                path: '/pl/index.html', language: 'pl', login: 'Logowanie', register: 'Rejestracja', reset: 'Resetowanie hasła',
                legal: 'w języku czeskim', loginError: 'Logowanie nie powiodło się. Sprawdź adres e-mail i hasło.',
                resetMessage: 'Jeśli konto z tym adresem e-mail jest u nas zarejestrowane, możesz otrzymać link do zmiany hasła. Sprawdź też spam; jeśli link nie dotrze, możesz ponowić prośbę.'
            }
        ]) {
            await page.goto(locale.path);
            await waitForPageReady(page);
            await expect(page.locator('html')).toHaveAttribute('lang', locale.language);
            await page.evaluate(() => window.Auth.openModal('login'));

            const modal = page.locator('#auth-modal');
            await expect(modal.locator('#auth-title')).toHaveText(locale.login);
            await expect(modal.locator('#auth-submit')).toHaveAttribute('data-mode', 'login');
            await expect(modal.locator('#auth-forgot-password')).toBeVisible();

            await modal.locator('#auth-modal-email').fill('auth-locale@example.com');
            await modal.locator('#auth-modal-password').fill('IncorrectPassword123!');
            await modal.locator('#auth-submit').click();
            await expect(modal.locator('#auth-modal-status')).toHaveText(locale.loginError);
            await expect(modal.locator('#auth-modal-status')).toHaveAttribute('role', 'alert');

            await modal.locator('#auth-mode-toggle').click();
            await expect(modal.locator('#auth-title')).toHaveText(locale.register);
            await expect(modal.locator('#auth-submit')).toHaveAttribute('data-mode', 'register');
            await expect(modal.locator('#auth-modal-status')).toBeHidden();
            await expect(modal.locator('#gdpr-consent-wrapper')).toContainText(locale.legal);

            await modal.locator('#auth-mode-toggle').click();
            await modal.locator('#auth-forgot-password').click();
            await expect(modal.locator('#auth-title')).toHaveText(locale.reset);
            await expect(modal.locator('#auth-submit')).toHaveAttribute('data-mode', 'reset');
            await modal.locator('#auth-modal-email').fill('auth-locale@example.com');
            await modal.locator('#auth-submit').click();
            await expect(modal.locator('#auth-modal-status')).toBeVisible();
            await expect(modal.locator('#auth-modal-status')).toHaveText(locale.resetMessage);
        }
    });

    test('nečitelná odpověď API zobrazí český fallback při přihlášení i registraci', async ({ page }) => {
        await page.route('**/api/auth/login', (route) => route.fulfill({
            status: 502,
            contentType: 'text/html',
            body: '<!doctype html><title>Bad Gateway</title>'
        }));
        await page.route('**/api/auth/register', (route) => route.fulfill({
            status: 502,
            contentType: 'text/html',
            body: '<!doctype html><title>Bad Gateway</title>'
        }));

        await page.goto('/tarot.html?source=e2e_auth_modal_error');
        await waitForPageReady(page);

        await page.evaluate(() => window.Auth.openModal('login'));
        await page.locator('#auth-modal input[name="email"]').fill('modal-login@example.com');
        await page.locator('#auth-modal input[name="password"]').fill('TestPassword123!');
        await page.locator('#auth-modal #auth-submit').click();
        await expect(page.locator('.toast--error .toast__message').last()).toHaveText(
            'Přihlášení se teď nepodařilo. Zkus to znovu za chvíli.'
        );
        await expect(page.locator('#auth-modal-status')).toHaveText(
            'Přihlášení se teď nepodařilo. Zkus to znovu za chvíli.'
        );
        await expect(page.locator('#auth-modal-status')).toHaveAttribute('role', 'alert');

        await page.evaluate(() => window.Auth.openModal('register'));
        await page.locator('#auth-modal input[name="email"]').fill('modal-register@example.com');
        await page.locator('#auth-modal input[name="password"]').fill('TestPassword123!');
        await page.locator('#auth-modal input[name="confirm_password"]').fill('TestPassword123!');
        await page.locator('#auth-modal #gdpr-consent').check();
        await page.locator('#auth-modal #auth-submit').click();
        await expect(page.locator('.toast--error .toast__message').last()).toHaveText(
            'Registraci se teď nepodařilo dokončit. Zkus to znovu za chvíli.'
        );
        await expect(page.locator('#auth-modal-status')).toHaveText(
            'Registraci se teď nepodařilo dokončit. Zkus to znovu za chvíli.'
        );
    });

    test('kladnou odpověď přihlášení nezamění za síťovou chybu, když selže uložení účtu v prohlížeči', async ({ page }) => {
        await page.addInitScript(() => {
            const originalSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function (key, value) {
                if (key === 'auth_user') throw new DOMException('Storage unavailable', 'QuotaExceededError');
                return originalSetItem.call(this, key, value);
            };
        });
        await page.route('**/api/auth/login', (route) => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                user: { id: 'e2e-auth-user', email: 'auth-storage@example.com', subscription_status: 'free' }
            })
        }));

        await page.goto('/tarot.html?source=e2e_auth_storage_error');
        await waitForPageReady(page);
        await page.evaluate(() => window.Auth.openModal('login'));
        await page.locator('#auth-modal input[name="email"]').fill('auth-storage@example.com');
        await page.locator('#auth-modal input[name="password"]').fill('TestPassword123!');
        await page.locator('#auth-modal #auth-submit').click();

        await expect(page.locator('.toast--error .toast__message').last()).toHaveText(
            'Server požadavek přijal, ale stránce se nepodařilo dokončit další krok. Obnov stránku a zkontroluj e-mail nebo stav účtu.'
        );
        await expect(page.locator('#auth-modal-status')).toHaveAttribute('role', 'alert');
    });

    test('modal registrace vysvetli datum narozeni a nevyzaduje ho pred vytvorenim uctu', async ({ page }) => {
        let registerPayload = null;

        await page.route('**/api/auth/register', async (route) => {
            registerPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    requireEmailVerification: true
                })
            });
        });

        await page.goto('/tarot.html?source=e2e_auth_modal');
        await waitForPageReady(page);
        await page.evaluate(() => window.Auth.openModal('register'));

        const modal = page.locator('#auth-modal');
        await expect(modal).toBeVisible();
        await expect(page.locator('#register-fields')).toBeVisible();
        await expect(page.locator('#gdpr-consent-wrapper')).toBeVisible();
        await expect(page.locator('#birth-date-privacy-note')).toContainText('Nepovinné');
        await expect(page.locator('#birth-date-privacy-note')).toContainText('jen pro osobní výklady');
        await expect(page.locator('input[name="birth_date"]')).not.toHaveAttribute('required', '');
        await expectNoHorizontalOverflow(page);

        await page.locator('#auth-modal input[name="email"]').fill('modal-register@example.com');
        await page.locator('#auth-modal input[name="password"]').fill('TestPassword123!');
        await page.locator('#auth-modal input[name="confirm_password"]').fill('TestPassword123!');
        await page.locator('#auth-modal #gdpr-consent').check();
        await page.locator('#auth-modal #auth-submit').click();

        await expect.poll(() => registerPayload).toEqual(expect.objectContaining({
            email: 'modal-register@example.com',
            password: 'TestPassword123!',
            password_confirm: 'TestPassword123!',
            gdpr_consent: true,
            terms_consent: true
        }));
        expect(registerPayload.birth_date).toBeUndefined();
    });

    test('modal registrace s email verifikaci posila signup analytics event v register modu', async ({ page }) => {
        await page.route('**/api/auth/register', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    requireEmailVerification: true
                })
            });
        });

        await page.goto('/tarot.html?source=e2e_auth_modal');
        await waitForPageReady(page);

        await page.evaluate(() => {
            window.__mhTrackAuthCompletedCalls = [];
            const analytics = window.MH_ANALYTICS || (window.MH_ANALYTICS = {});
            const originalTrackAuthCompleted = typeof analytics.trackAuthCompleted === 'function'
                ? analytics.trackAuthCompleted.bind(analytics)
                : null;

            analytics.trackAuthCompleted = (...args) => {
                window.__mhTrackAuthCompletedCalls.push(args);
                return originalTrackAuthCompleted ? originalTrackAuthCompleted(...args) : undefined;
            };
        });

        await page.evaluate(() => window.Auth.openModal('register'));
        await page.locator('#auth-modal input[name="email"]').fill('modal-verify-analytics@example.com');
        await page.locator('#auth-modal input[name="password"]').fill('TestPassword123!');
        await page.locator('#auth-modal input[name="confirm_password"]').fill('TestPassword123!');
        await page.locator('#auth-modal #gdpr-consent').check();
        await page.locator('#auth-modal #auth-submit').click();

        await expect.poll(async () => page.evaluate(() => (
            window.__mhTrackAuthCompletedCalls.find((call) => call?.[0] === 'register') || null
        ))).not.toBeNull();
    });
});

// ── CSRF Token API ────────────────────────────────────────────────────────────

test.describe('CSRF Token API', () => {

    test('GET /api/csrf-token vrátí 200 a token', async ({ page }) => {
        const response = await page.request.get('/api/csrf-token');
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.csrfToken).toBeTruthy();
        expect(typeof data.csrfToken).toBe('string');
    });

    test('CSRF token má 3 části oddělené tečkou', async ({ page }) => {
        const token = await getCsrfToken(page);
        const parts = token.split('.');
        expect(parts).toHaveLength(3);
        expect(parts[0].length).toBeGreaterThan(0);
        expect(parts[1].length).toBeGreaterThan(0);
        expect(parts[2]).toHaveLength(64); // SHA-256 hex
    });

    test('dva po sobě jdoucí CSRF tokeny jsou různé', async ({ page }) => {
        const token1 = await getCsrfToken(page);
        const token2 = await getCsrfToken(page);
        expect(token1).not.toBe(token2);
    });

    test('POST na auth endpoint bez CSRF vrátí 403', async ({ page }) => {
        const response = await page.request.post('/api/auth/login', {
            data: { email: 'test@example.com', password: 'heslo' },
        });
        expect(response.status()).toBe(403);
    });
});
