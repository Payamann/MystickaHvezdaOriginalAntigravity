/**
 * E2E testy — Numerologie (numerologie.html)
 *
 * Testuje: načtení, formulář (jméno + datum + čas), HTML5 validace,
 * loading state element, premium gate, mobilní responsivitu.
 *
 * Poznámka: skutečný výpočet není testován (vyžaduje Claude API).
 * Testujeme UI vrstvu a klientskou validaci.
 */

import { test, expect } from '@playwright/test';
import { waitForPageReady, assertBasicSEO, MOBILE_VIEWPORT } from './helpers.js';

test.describe('Numerologie', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/numerologie.html');
        await waitForPageReady(page);
    });

    // ── Načtení ─────────────────────────────────────────────────────────────

    test('stránka vrátí 200', async ({ page }) => {
        const res = await page.request.get('/numerologie.html');
        expect(res.status()).toBe(200);
    });

    test('title obsahuje "Numerologi"', async ({ page }) => {
        const title = await page.title();
        expect(title.toLowerCase()).toContain('numerologi');
    });

    test('SEO snippet pojmenovává životní číslo a výklad zdarma', async ({ page }) => {
        await expect(page).toHaveTitle('Numerologie online: životní číslo a osud | Mystická Hvězda');
        await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /životní číslo/);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /zdarma/);
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
            'content',
            'Numerologie online: životní číslo a osud | Mystická Hvězda'
        );
    });

    test('h1 je viditelný', async ({ page }) => {
        const h1 = page.locator('h1').first();
        await expect(h1).toBeVisible();
    });

    // ── Formulář — struktura ─────────────────────────────────────────────────

    test('#numerology-form existuje', async ({ page }) => {
        await expect(page.locator('#numerology-form')).toBeAttached();
    });

    test('pole pro jméno (#num-name) je viditelné', async ({ page }) => {
        const nameInput = page.locator('#num-name');
        await expect(nameInput).toBeVisible();
        expect(await nameInput.getAttribute('required')).toBeDefined();
        expect(await nameInput.getAttribute('type')).toBe('text');
        await expect(nameInput).toHaveAttribute('autocomplete', 'name');
    });

    test('pole pro datum (#num-date) je viditelné', async ({ page }) => {
        const dateInput = page.locator('#num-date');
        await expect(dateInput).toBeVisible();
        expect(await dateInput.getAttribute('required')).toBeDefined();
        expect(await dateInput.getAttribute('type')).toBe('date');
        await expect(dateInput).toHaveAttribute('autocomplete', 'bday');
    });

    test('pole pro čas (#num-time) existuje (volitelné)', async ({ page }) => {
        const timeInput = page.locator('#num-time');
        await expect(timeInput).toBeAttached();
        expect(await timeInput.getAttribute('type')).toBe('time');
        // Čas je volitelný — nesmí mít required
        expect(await timeInput.getAttribute('required')).toBeNull();
    });

    test('submit tlačítko "Odhalit má čísla" je přítomné', async ({ page }) => {
        const submitBtn = page.locator('#numerology-form button[type="submit"]');
        await expect(submitBtn).toBeVisible();
        const text = await submitBtn.innerText();
        expect(text.toLowerCase()).toContain('čísla');
    });

    // ── Formulář — vstup ─────────────────────────────────────────────────────

    test('pole pro jméno přijímá text vstup', async ({ page }) => {
        const nameInput = page.locator('#num-name');
        await nameInput.fill('Jan Novák');
        await expect(nameInput).toHaveValue('Jan Novák');
    });

    test('pole pro datum přijímá datum vstup', async ({ page }) => {
        const dateInput = page.locator('#num-date');
        await dateInput.fill('1990-06-15');
        await expect(dateInput).toHaveValue('1990-06-15');
    });

    test('pole pro čas přijímá čas vstup', async ({ page }) => {
        const timeInput = page.locator('#num-time');
        await timeInput.fill('14:30');
        await expect(timeInput).toHaveValue('14:30');
    });

    // ── Klientská validace ────────────────────────────────────────────────────

    test('prázdný submit aktivuje HTML5 validaci (formulář nezmizel)', async ({ page }) => {
        const submitBtn = page.locator('#numerology-form button[type="submit"]');
        await submitBtn.click();
        await page.waitForTimeout(300);

        // Formulář musí zůstat přítomný (nebylo odesláno)
        await expect(page.locator('#numerology-form')).toBeVisible();
    });

    test('submit jen se jménem (bez data) aktivuje validaci', async ({ page }) => {
        await page.locator('#num-name').fill('Jan Novák');
        await page.locator('#numerology-form button[type="submit"]').click();
        await page.waitForTimeout(300);

        // Formulář musí zůstat
        await expect(page.locator('#numerology-form')).toBeVisible();
    });

    // ── Loading state ────────────────────────────────────────────────────────

    test('#num-loading element existuje v DOM', async ({ page }) => {
        await expect(page.locator('#num-loading')).toBeAttached();
    });

    test('.loading-spinner existuje v DOM', async ({ page }) => {
        await expect(page.locator('.loading-spinner')).toBeAttached();
    });

    // ── Dnešní vibrace sekce ─────────────────────────────────────────────────

    test('#daily-cycles element existuje v DOM (skrytý do výpočtu)', async ({ page }) => {
        await expect(page.locator('#daily-cycles')).toBeAttached();
    });

    test('odhlaseny navstevnik vidi zakladni cisla pred upgrade vyzvou', async ({ page }) => {
        await page.goto('/numerologie.html?source=life_number_result&feature=numerologie_vyklad');
        await waitForPageReady(page);

        await page.locator('#num-name').fill('Jana Novakova');
        await page.locator('#num-date').fill('1990-06-15');
        await page.locator('#num-time').fill('14:30');
        await page.locator('#numerology-form button[type="submit"]').click();

        await expect(page.locator('#numerology-results')).toBeVisible({ timeout: 2500 });
        await expect(page.locator('#card-lifepath .number-value')).toHaveText(/\d+/);
        await expect(page.locator('#card-destiny .number-value')).toHaveText(/\d+/);
        await expect(page.locator('#num-interpretation .numerology-premium-shell')).toBeVisible();
        await expect(page.locator('.numerology-calculator-card .card__title')).toHaveText('Vypočítej svá čísla');
        await expect(page.locator('#num-interpretation')).toContainText('Tvoje čísla');
        await expect(page.locator('#num-interpretation')).toContainText('Základní čísla už máš.');
        await expect(page.locator('#num-interpretation')).not.toContainText(/Vaše čísla|už máte/);
        await expect(page.locator('.numerology-upgrade-btn')).toContainText('Odemknout');
        expect(page.url()).toContain('/numerologie.html');
        expect(page.url()).not.toContain('/prihlaseni.html');
        expect(page.url()).not.toContain('/cenik.html');
    });

    test('premium výklad uloží výsledek pod účet aktivní při odeslání', async ({ page }) => {
        let releaseApiResponse;
        const apiResponseGate = new Promise(resolve => {
            releaseApiResponse = resolve;
        });
        await page.route('**/api/numerology', async route => {
            await apiResponseGate;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ response: 'Krátký symbolický výklad.', fallback: false })
            });
        });
        await page.evaluate(() => {
            window.getCSRFToken = async () => 'e2e-csrf-token';
            window.__numerologyReadingSaves = [];
            window.Auth = {
                isLoggedIn: () => true,
                isPremium: () => true,
                user: { id: 'numerology-owner-at-submit' },
                saveReading: async (type, data, ownerId) => {
                    window.__numerologyReadingSaves.push({ type, data, ownerId });
                    return { id: 'e2e-numerology-reading' };
                }
            };
        });

        await page.locator('#num-name').fill('Jana Nováková');
        await page.locator('#num-date').fill('1990-06-15');
        const responsePromise = page.waitForResponse(response => response.url().includes('/api/numerology'));
        await page.locator('#numerology-form button[type="submit"]').click();
        await expect(page.locator('#num-interpretation .interpretation-loading')).toBeVisible();
        await expect(page.locator('#num-status')).toHaveText('Připravuji symbolický výklad čtyř čísel.');
        releaseApiResponse();
        await responsePromise;

        await expect(page.locator('#num-status')).toHaveText('Výklad je hotový. Je zobrazený pod vypočtenými čísly.');
        await expect.poll(() => page.evaluate(() => window.__numerologyReadingSaves.length)).toBe(1);
        const saved = await page.evaluate(() => window.__numerologyReadingSaves[0]);
        expect(saved.type).toBe('numerology');
        expect(saved.ownerId).toBe('numerology-owner-at-submit');
        expect(saved.data).toMatchObject({ name: 'Jana Nováková', birthDate: '1990-06-15' });
    });

    test('chyba uložení do profilu nepřekryje hotový numerologický výklad', async ({ page }) => {
        await page.route('**/api/numerology', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ response: 'Tento hotový výklad zůstane viditelný.', fallback: false })
        }));
        await page.evaluate(() => {
            window.getCSRFToken = async () => 'e2e-csrf-token';
            window.Auth = {
                isLoggedIn: () => true,
                isPremium: () => true,
                user: { id: 'numerology-save-failure-owner' },
                saveReading: async () => {
                    throw new Error('profile storage unavailable');
                }
            };
        });

        await page.locator('#num-name').fill('Jana Nováková');
        await page.locator('#num-date').fill('1990-06-15');
        await page.locator('#numerology-form button[type="submit"]').click();

        await expect(page.locator('#num-interpretation')).toContainText('Tento hotový výklad zůstane viditelný.');
        await expect(page.locator('#num-interpretation [data-numerology-save-error]'))
            .toHaveText('Výklad je hotový, ale nepodařilo se ho uložit do profilu. Zůstává zobrazený tady.');
        await expect(page.locator('#num-status'))
            .toHaveText('Výklad je hotový, ale nepodařilo se ho uložit do profilu. Zůstává zobrazený tady.');
        await expect(page.locator('#num-interpretation .error-message')).toHaveCount(0);
    });

    test('opožděná numerologie se po změně účtu vyčistí a neuloží', async ({ page }) => {
        await page.evaluate(() => {
            window.getCSRFToken = async () => 'e2e-csrf-token';
            window.__numerologyFetchCount = 0;
            window.__numerologyReadingSaves = [];
            window.Auth = {
                ...(window.Auth || {}),
                user: { id: 'numerology-owner-before' },
                isLoggedIn: () => true,
                isPremium: () => true,
                saveReading: async (...args) => {
                    window.__numerologyReadingSaves.push(args);
                    return { id: 'stale-numerology-reading' };
                }
            };
            const nativeFetch = window.fetch.bind(window);
            window.fetch = async (input, options) => {
                if (String(input).includes('/numerology')) {
                    window.__numerologyFetchCount += 1;
                    return new Promise(resolve => {
                        window.__releaseNumerologyResponse = () => resolve({
                            ok: true,
                            status: 200,
                            json: async () => ({ response: 'SOUKROMÝ STARÝ NUMEROLOGICKÝ VÝKLAD' })
                        });
                    });
                }
                return nativeFetch(input, options);
            };
        });

        await page.locator('#num-name').fill('Jana Účet A');
        await page.locator('#num-date').fill('1990-06-15');
        await page.locator('#numerology-form button[type="submit"]').click();
        await expect(page.locator('#num-interpretation .interpretation-loading')).toBeVisible();
        await expect.poll(() => page.evaluate(() => window.__numerologyFetchCount)).toBe(1);

        await page.evaluate(() => {
            window.Auth.user = { id: 'numerology-owner-after' };
            document.dispatchEvent(new Event('auth:changed'));
            const cycles = document.getElementById('daily-cycles');
            cycles.hidden = false;
            for (const [id, value] of [['val-py', '2026'], ['val-pm', '10'], ['val-pd', '18']]) {
                document.getElementById(id).textContent = value;
            }
        });
        await expect(page.locator('#num-name')).toHaveValue('');
        await expect(page.locator('#num-date')).toHaveValue('');
        await expect(page.locator('#numerology-results')).toBeHidden();
        await expect(page.locator('#daily-cycles')).toBeHidden();
        for (const id of ['#val-py', '#val-pm', '#val-pd']) {
            await expect(page.locator(id)).toBeEmpty();
        }

        await page.evaluate(() => window.__releaseNumerologyResponse());
        await expect(page.locator('#num-interpretation')).not.toContainText('SOUKROMÝ STARÝ NUMEROLOGICKÝ VÝKLAD');
        expect(await page.evaluate(() => window.__numerologyReadingSaves.length)).toBe(0);
    });

    test('profilové datum se po přepnutí účtu nedoplní ze starého profilu', async ({ page }) => {
        await page.evaluate(() => {
            let releaseProfile;
            window.__numerologyProfilePromise = new Promise(resolve => {
                releaseProfile = resolve;
            });
            window.__releaseNumerologyProfile = () => releaseProfile({ birth_date: '1988-02-03' });
            window.Auth = {
                ...(window.Auth || {}),
                user: { id: 'numerology-profile-before' },
                isLoggedIn: () => true,
                getProfile: () => window.__numerologyProfilePromise
            };
            document.dispatchEvent(new Event('auth:changed'));
        });

        await page.locator('#use-profile-num').check();
        await page.evaluate(() => {
            window.Auth.user = { id: 'numerology-profile-after' };
            document.dispatchEvent(new Event('auth:changed'));
        });
        await page.evaluate(() => window.__releaseNumerologyProfile());

        await expect(page.locator('#num-date')).toHaveValue('');
        await expect(page.locator('#use-profile-num')).not.toBeChecked();
    });

    test('vysledek nabidne jednorazovou Osobni mapu a zmeri zobrazeni i klik', async ({ page }) => {
        await page.goto('/numerologie.html?source=e2e_personal_map');
        await waitForPageReady(page);
        await page.evaluate(() => {
            window.__personalMapFunnelEvents = [];
            window.Auth = {
                isLoggedIn: () => false,
                isPremium: () => false,
                sendServerFunnelEvent: async payload => window.__personalMapFunnelEvents.push(payload)
            };
        });

        await page.locator('#num-name').fill('Jana Novakova');
        await page.locator('#num-date').fill('1990-06-15');
        await page.locator('#num-time').fill('14:30');
        await page.locator('#numerology-form button[type="submit"]').click();

        const offer = page.locator('.numerology-personal-map');
        const cta = offer.locator('[data-numerology-personal-map]');
        await expect(offer).toContainText('příštích 12 měsíců');
        await expect(offer).toContainText('Bez členství');
        await expect(cta).toHaveAttribute('href', /osobni-mapa\.html\?source=numerology_result/);
        await cta.evaluate(element => element.addEventListener('click', event => event.preventDefault()));
        await cta.click();

        const events = await page.evaluate(() => window.__personalMapFunnelEvents);
        expect(events).toEqual(expect.arrayContaining([
            expect.objectContaining({ eventName: 'one_time_product_viewed', source: 'numerology_result' }),
            expect.objectContaining({ eventName: 'pricing_product_cta_clicked', source: 'numerology_result' })
        ]));
    });

    // ── Canonical a SEO ──────────────────────────────────────────────────────

    test('canonical link obsahuje "numerologi"', async ({ page }) => {
        const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
        expect(canonical.toLowerCase()).toContain('numerologi');
    });

    test('výsledek numerologie lze uložit jako sdílitelný obrázek', async ({ page }) => {
        await page.evaluate(() => {
            window.Auth = {
                isLoggedIn: () => true,
                isPremium: () => false,
                showToast: () => {},
                getProfile: async () => null,
                saveReading: async () => ({ id: 'test-numerology-reading' })
            };
            window.Premium = {
                trackPaywallHit: () => {},
                showTrialPaywall: () => {}
            };
            window.__numerologyAnalyticsEvents = [];
            window.MH_ANALYTICS = {
                trackAction: (eventName, payload) => {
                    window.__numerologyAnalyticsEvents.push({ eventName, payload });
                }
            };
        });

        await page.locator('#num-name').fill('Jana Nováková');
        await page.locator('#num-date').fill('1990-06-15');
        await page.locator('#numerology-form button[type="submit"]').click();

        await expect(page.locator('#numerology-results')).toBeVisible({ timeout: 2500 });
        await expect(page.locator('#btn-save-numerology-result')).toBeVisible();
        await expect.poll(() => page.evaluate(() => Boolean(window.__lastNumerologyShareResult))).toBe(true);

        const downloadPromise = page.waitForEvent('download');
        await page.locator('#btn-save-numerology-result').click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/^numerologie-zivotni-cesta-\d+\.png$/);

        const events = await page.evaluate(() => window.__numerologyAnalyticsEvents);
        expect(events).toContainEqual(expect.objectContaining({
            eventName: 'numerology_result_image_saved'
        }));
    });

    // ── Mobilní responsivita ─────────────────────────────────────────────────

    test('formulář je viditelný na mobilním viewportu', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/numerologie.html');
        await waitForPageReady(page);

        await expect(page.locator('#numerology-form')).toBeVisible();
    });

    test('žádný horizontální scroll na mobilním viewportu', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/numerologie.html');
        await waitForPageReady(page);

        const hasHorizontalScroll = await page.evaluate(() =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(hasHorizontalScroll).toBe(false);
    });

    test('mobilni cookie lista neprekryva submit CTA', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.evaluate(() => {
            localStorage.removeItem('mh_cookie_prefs');
            localStorage.removeItem('cookieConsent');
        });
        await page.goto('/numerologie.html?source=e2e_numerology_cookie');
        await waitForPageReady(page);

        await expect(page.locator('#cookie-banner')).toBeVisible();
        await expect(page.locator('#numerology-form button[type="submit"]')).toBeVisible();

        const metrics = await page.evaluate(() => {
            const cta = document.querySelector('#numerology-form button[type="submit"]')?.getBoundingClientRect();
            const cookie = document.getElementById('cookie-banner')?.getBoundingClientRect();
            const overlapsCookie = !!(cta && cookie && !(
                cookie.right < cta.left
                || cookie.left > cta.right
                || cookie.bottom < cta.top
                || cookie.top > cta.bottom
            ));

            return {
                ctaBottom: Math.round(cta?.bottom || 9999),
                cookieTop: Math.round(cookie?.top || window.innerHeight),
                overlapsCookie,
                overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
            };
        });

        expect(metrics.overflow).toBe(false);
        expect(metrics.overlapsCookie).toBe(false);
        expect(metrics.ctaBottom).toBeLessThanOrEqual(metrics.cookieTop);
    });
});
