/**
 * E2E testy — Věštecké nástroje
 *
 * Pokrývá: Andělské karty, Křišťálová koule, Runy, Minulý život
 * Testuje: načtení, UI struktura, formuláře, interakce, mobile.
 * AI odpovědi netestujeme (fake API key v test env).
 */

import { test, expect } from '@playwright/test';
import { waitForPageReady, assertBasicSEO, getCsrfToken, MOBILE_VIEWPORT } from './helpers.js';

// ═══════════════════════════════════════════════════════════
// ANDĚLSKÉ KARTY
// ═══════════════════════════════════════════════════════════

test.describe('Andělské karty', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/andelske-karty.html');
        await waitForPageReady(page);
    });

    test('stránka vrátí 200', async ({ page }) => {
        const res = await page.request.get('/andelske-karty.html');
        expect(res.status()).toBe(200);
    });

    test('title obsahuje "Andělsk"', async ({ page }) => {
        const title = await page.title();
        expect(title.toLowerCase()).toContain('andělsk');
    });

    test('h1 je viditelný', async ({ page }) => {
        await expect(page.locator('h1').first()).toBeVisible();
        await expect(page.locator('h1').first()).toContainText('Andělská karta dne');
    });

    test('rozlišuje denní andělskou kartu od hlubšího výkladu', async ({ page }) => {
        const main = page.locator('main');
        // Statický title/meta je autoritativní — runtime přepis byl odstraněn,
        // aby SEO targeting "Andělská karta dne zdarma" přežil i vykreslení JS.
        await expect(page).toHaveTitle('Andělská karta dne zdarma – poselství pro tvůj dnešek');
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Andělská karta dne zdarma – poselství pro tvůj dnešek');
        const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
        expect(metaDescription).toContain('balíčku 44 karet');
        expect(metaDescription).toContain('hlubší výklad');
        await expect(page.locator('.hero__subtitle')).toContainText('hlubší andělský výklad');
        await expect(page).toHaveTitle(/Andělská karta dne zdarma/);
        await expect(main).not.toContainText('41 karet');
    });

    test('#main-content existuje', async ({ page }) => {
        await expect(page.locator('#main-content')).toBeAttached();
    });

    test('angel-card-container nebo karta existuje v DOM', async ({ page }) => {
        const card = page.locator('#angel-card-container, .angel-card-container, .angel-card').first();
        await expect(card).toBeAttached();
    });

    test('stranka vede k vhodnemu typu andelske podpory', async ({ page }) => {
        const cluster = page.locator('.angel-intent-section[aria-labelledby="angel-intent-title"]');
        await expect(cluster).toBeVisible();
        await expect(cluster.locator('.angel-intent-card')).toHaveCount(6);
        const drawIntent = cluster.locator('[data-analytics-cta="angel_intent_draw_card"]');
        await expect(drawIntent).toHaveAttribute('href', '#draw-btn');
        await expect(drawIntent).toHaveAttribute('data-analytics-feature', 'andelske_karty_hluboky_vhled');
        await expect(cluster.locator('[data-analytics-cta="angel_intent_how_it_works"]')).toHaveAttribute('href', /jak-funguji-andelske-karty\.html/);
        await expect(cluster.locator('[data-analytics-cta="angel_intent_crystal_ball"]')).toHaveAttribute('href', /kristalova-koule\.html/);
        await expect(cluster.locator('[data-analytics-cta="angel_intent_mentor"]')).toHaveAttribute('href', /mentor\.html/);
    });

    test('canonical link je nastaven', async ({ page }) => {
        const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
        expect(canonical).toBeTruthy();
    });

    test('stránka neobsahuje kritické JS errory', async ({ page }) => {
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto('/andelske-karty.html');
        await waitForPageReady(page);
        const critical = errors.filter(e => e.includes('SyntaxError'));
        expect(critical).toHaveLength(0);
    });

    test('žádný horizontální scroll na mobilu', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/andelske-karty.html');
        await waitForPageReady(page);
        const overflow = await page.evaluate(() =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(overflow).toBe(false);
    });

    test('po vytažení karty nabídne hluboký vhled', async ({ page }) => {
        await page.evaluate(() => localStorage.removeItem('angelCardDaily'));
        await page.reload();
        await waitForPageReady(page);

        await page.locator('#draw-btn').click();
        await expect.poll(() => page.locator('.angel-card-inner').evaluate(element => getComputedStyle(element).transform))
            .not.toBe('matrix(1, 0, 0, 1, 0, 0)');
        await expect(page.locator('#btn-deep-angel')).toBeVisible({ timeout: 3_000 });
    });

    for (const failureMode of ['blocked', 'quota']) {
        test(`kartu lze vytáhnout i když prohlížeč nemůže uložit denní volbu (${failureMode})`, async ({ page }) => {
            await page.evaluate(() => localStorage.removeItem('angelCardDaily'));
            await page.addInitScript((mode) => {
                const originalGetItem = Storage.prototype.getItem;
                const originalSetItem = Storage.prototype.setItem;
                Storage.prototype.getItem = function getItem(key) {
                    if (key === 'angelCardDaily' && mode === 'blocked') throw new Error('Storage denied');
                    return originalGetItem.call(this, key);
                };
                Storage.prototype.setItem = function setItem(key, value) {
                    if (key === 'angelCardDaily') throw new Error(mode === 'blocked' ? 'Storage denied' : 'Quota exceeded');
                    return originalSetItem.call(this, key, value);
                };
            }, failureMode);
            await page.reload();
            await waitForPageReady(page);

            await page.locator('#draw-btn').click();
            await expect(page.locator('#draw-btn')).toHaveClass(/is-flipped/);
            await expect(page.locator('#angel-short-message')).not.toBeEmpty();
            await expect(page.locator('#angel-card-storage-note')).toBeVisible();
            await expect(page.locator('#angel-card-storage-note')).toContainText('Prohlížeč si dnešní kartu neuložil');
        });
    }

    test('SEO landing a vylozeni andelske karty se propisi do analytics a funnelu', async ({ page }) => {
        // Consented analytics normally flush immediately; keep events queued so attribution stays observable.
        await page.route('**/api/analytics/batch', route => route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: '{}'
        }));
        await page.addInitScript(() => {
            localStorage.setItem('mh_cookie_prefs', JSON.stringify({ necessary: true, analytics: true }));
            localStorage.removeItem('mh_attribution_first_touch');
            sessionStorage.removeItem('mh_attribution_last_touch');
        });
        await page.evaluate(() => localStorage.removeItem('angelCardDaily'));
        await page.goto('/andelske-karty.html?utm_source=google&utm_medium=organic&utm_campaign=andelska_karta_dne');
        await waitForPageReady(page);

        await page.evaluate(() => {
            window.__angelFunnelEvents = [];
            window.getCSRFToken = async () => 'e2e-angel-seo-token';

            const originalFetch = window.fetch.bind(window);
            window.fetch = async (input, init = {}) => {
                const url = typeof input === 'string' ? input : input?.url;
                if (url && url.includes('/api/payment/funnel-event')) {
                    window.__angelFunnelEvents.push(JSON.parse(init.body || '{}'));
                    return new Response(JSON.stringify({ success: true }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                return originalFetch(input, init);
            };
        });

        const seoLanding = await page.evaluate(() => window.MH_ANALYTICS_QUEUE.find((event) => event.name === 'seo_landing_viewed'));
        expect(seoLanding).toEqual(expect.objectContaining({
            source: 'seo_angel_card_daily',
            feature: 'daily_angel_card',
            seo_cluster: 'angel_cards',
            first_source: 'google',
            first_medium: 'organic',
            first_campaign: 'andelska_karta_dne'
        }));

        await page.locator('#draw-btn').click();
        await expect(page.locator('#btn-deep-angel')).toBeVisible({ timeout: 3_000 });
        await expect.poll(() => page.evaluate(() => window.__angelFunnelEvents.some((event) => event.eventName === 'first_value_completed'))).toBe(true);

        const events = await page.evaluate(() => ({
            firstValue: window.MH_ANALYTICS_QUEUE.find((event) => event.name === 'first_value_completed' && event.first_value_type === 'angel_card_result'),
            funnelEvents: window.__angelFunnelEvents
        }));

        expect(events.firstValue).toEqual(expect.objectContaining({
            source: 'angel_card_result',
            feature: 'andelske_karty_hluboky_vhled',
            first_value_type: 'angel_card_result',
            first_source: 'google',
            first_medium: 'organic',
            first_campaign: 'andelska_karta_dne'
        }));
        expect(events.funnelEvents).toContainEqual(expect.objectContaining({
            eventName: 'first_value_completed',
            source: 'angel_card_result',
            feature: 'andelske_karty_hluboky_vhled',
            planId: 'pruvodce'
        }));
    });

    test('hluboky vhled posila andelsky zamer, ne Kartu dne', async ({ page }) => {
        let payload = null;
        let requestCount = 0;
        let releaseResponse;
        const responseGate = new Promise(resolve => {
            releaseResponse = resolve;
        });
        await page.route('**/api/angel-card', async route => {
            requestCount += 1;
            payload = route.request().postDataJSON();
            await responseGate;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, response: 'Andělská odpověď pro test.' })
            });
        });

        await page.evaluate(() => {
            localStorage.removeItem('angelCardDaily');
            window.Auth = {
                ...(window.Auth || {}),
                isLoggedIn: () => true,
                isPremium: () => true,
                saveReading: async () => {
                    window.__angelSaveCount = (window.__angelSaveCount || 0) + 1;
                    return { id: 'test-angel-reading' };
                }
            };
            window.__angelSaveCount = 0;
            window.getCSRFToken = async () => 'csrf.test.token';
        });

        await page.locator('#draw-btn').click();
        await expect(page.locator('#btn-deep-angel')).toBeVisible({ timeout: 3_000 });
        await page.locator('#btn-deep-angel').click();
        await expect(page.locator('#angel-ai-status')).toHaveText('Načítám hluboký vhled k andělské kartě.');
        await expect(page.locator('#btn-deep-angel')).toHaveText('Připravuji hlubší výklad…');
        await expect(page.locator('#angel-ai-response')).toHaveText('Výklad k vytažené kartě se připravuje…');
        await expect(page.locator('#btn-deep-angel')).toHaveAttribute('aria-busy', 'true');
        releaseResponse();
        await expect(page.locator('#angel-ai-response')).toContainText('Andělská odpověď');
        await expect(page.locator('#angel-ai-status')).toHaveText('Hluboký vhled k andělské kartě je připraven.');
        await expect(page.locator('#btn-deep-angel')).not.toHaveAttribute('aria-busy', 'true');
        await expect(page.locator('#btn-deep-angel')).toBeDisabled();
        await expect(page.locator('#btn-deep-angel')).toHaveText('Hluboký vhled je připraven');

        await page.locator('#btn-deep-angel').evaluate(button => {
            button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
        expect(requestCount).toBe(1);
        expect(await page.evaluate(() => window.__angelSaveCount)).toBe(1);

        expect(payload?.intention).toBe('hluboký vhled k andělské kartě');
        expect(payload?.intention).not.toContain('kartě dne');
    });

    test('chyba uložení hluboký vhled nesmaže ani nepovolí duplicitní vytvoření', async ({ page }) => {
        await page.route('**/api/angel-card', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, response: 'Výklad zůstává viditelný i bez uložení.' })
        }));
        await page.evaluate(() => {
            window.Auth = {
                ...(window.Auth || {}),
                isLoggedIn: () => true,
                isPremium: () => true,
                saveReading: async () => null
            };
            window.getCSRFToken = async () => 'csrf.test.token';
        });

        await page.locator('#draw-btn').click();
        await expect(page.locator('#btn-deep-angel')).toBeVisible({ timeout: 3_000 });
        await page.locator('#btn-deep-angel').click();

        await expect(page.locator('#angel-ai-response')).toContainText('Výklad zůstává viditelný');
        await expect(page.locator('#angel-ai-status')).toContainText('nepodařilo uložit do profilu');
        await expect(page.locator('#btn-deep-angel')).toBeDisabled();
    });

    test('hluboký vhled po změně účtu nezobrazí ani neuloží pozdní odpověď, karta dne zůstane', async ({ page }) => {
        await page.evaluate(() => {
            localStorage.removeItem('angelCardDaily');
            window.Auth = {
                ...(window.Auth || {}),
                user: { ...(window.Auth?.user || {}), id: 'angel-user-a' },
                isLoggedIn: () => true,
                isPremium: () => true,
                saveReading: async () => {
                    window.__angelInsightSaveCount = (window.__angelInsightSaveCount || 0) + 1;
                    return { id: 'test-angel-reading' };
                }
            };
            window.__angelInsightRequestCount = 0;
            window.__angelInsightSaveCount = 0;
            const originalFetch = window.fetch.bind(window);
            window.fetch = (input, init) => {
                const url = new URL(typeof input === 'string' ? input : input.url, location.href);
                if (url.pathname.endsWith('/angel-card')) {
                    window.__angelInsightRequestCount += 1;
                    return new Promise(resolve => {
                        window.__releaseAngelInsight = () => resolve(new Response(JSON.stringify({
                            success: true,
                            response: 'STARÝ SOUKROMÝ ANDĚLSKÝ VHLED'
                        }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        }));
                    });
                }
                return originalFetch(input, init);
            };
            window.getCSRFToken = async () => 'csrf.test.token';
        });

        await page.locator('#draw-btn').click();
        await expect(page.locator('#btn-deep-angel')).toBeVisible({ timeout: 3_000 });
        const dailyCardMessage = await page.locator('#angel-short-message').textContent();
        await page.locator('#btn-deep-angel').click();
        await expect.poll(() => page.evaluate(() => window.__angelInsightRequestCount)).toBe(1);
        await expect(page.locator('#angel-ai-response')).toHaveText('Výklad k vytažené kartě se připravuje…');

        await page.evaluate(() => {
            window.Auth.user.id = 'angel-user-b';
            document.dispatchEvent(new CustomEvent('auth:changed'));
        });

        await expect(page.locator('#angel-ai-response')).toBeHidden();
        await expect(page.locator('#angel-ai-response')).toBeEmpty();
        await expect(page.locator('#angel-ai-status')).toBeHidden();
        await expect(page.locator('#favorite-angel-card-btn')).toHaveCount(0);
        await expect(page.locator('#btn-deep-angel')).toBeEnabled();
        await expect(page.locator('#btn-deep-angel')).not.toHaveAttribute('aria-busy', 'true');
        await expect(page.locator('#angel-results')).toHaveClass(/mh-block-visible/);
        await expect(page.locator('#angel-short-message')).toHaveText(dailyCardMessage);

        await page.evaluate(() => window.__releaseAngelInsight());
        await expect(page.locator('#angel-ai-response')).not.toContainText('STARÝ SOUKROMÝ ANDĚLSKÝ VHLED');
        await expect.poll(() => page.evaluate(() => window.__angelInsightSaveCount)).toBe(0);
        await expect(page.locator('#angel-results')).toHaveClass(/mh-block-visible/);
        await expect(page.locator('#angel-short-message')).toHaveText(dailyCardMessage);
    });

    test('pozdní uložení hlubokého vhledu po změně účtu nepřidá oblíbenou akci', async ({ page }) => {
        await page.route('**/api/angel-card', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, response: 'Soukromý vhled čeká na zápis.' })
        }));
        await page.evaluate(() => {
            localStorage.removeItem('angelCardDaily');
            window.Auth = {
                ...(window.Auth || {}),
                user: { id: 'angel-save-owner-a' },
                isLoggedIn: () => true,
                isPremium: () => true,
                saveReading: (...args) => {
                    window.__angelInsightSaveOwner = args[2];
                    return new Promise(resolve => {
                        window.__releaseAngelSave = () => resolve({ id: 'old-account-reading' });
                    });
                }
            };
            window.getCSRFToken = async () => 'csrf.test.token';
        });

        await page.locator('#draw-btn').click();
        await expect(page.locator('#btn-deep-angel')).toBeVisible({ timeout: 3_000 });
        await page.locator('#btn-deep-angel').click();
        await expect(page.locator('#angel-ai-response')).toContainText('Soukromý vhled čeká');
        await expect.poll(() => page.evaluate(() => window.__angelInsightSaveOwner)).toBe('angel-save-owner-a');

        await page.evaluate(() => {
            window.Auth.user.id = 'angel-save-owner-b';
            document.dispatchEvent(new CustomEvent('auth:changed'));
        });
        await expect(page.locator('#angel-ai-response')).toBeHidden();
        await expect(page.locator('#favorite-angel-card-btn')).toHaveCount(0);

        await page.evaluate(() => window.__releaseAngelSave());
        await page.waitForTimeout(0);
        await expect(page.locator('#angel-ai-response')).toBeHidden();
        await expect(page.locator('#favorite-angel-card-btn')).toHaveCount(0);
        await expect(page.locator('#angel-results')).toHaveClass(/mh-block-visible/);
    });

    test('mobilní výsledek po vytažení není překrytý cookie bannerem', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.evaluate(() => {
            localStorage.removeItem('mh_cookie_prefs');
            localStorage.removeItem('cookieConsent');
            localStorage.removeItem('angelCardDaily');
        });
        await page.goto('/andelske-karty.html');
        await waitForPageReady(page);
        await expect(page.locator('#cookie-banner')).toHaveClass(/visible/, { timeout: 3_000 });

        await page.locator('#draw-btn').click();
        await expect(page.locator('#btn-deep-angel')).toBeVisible({ timeout: 3_000 });
        await page.waitForTimeout(450);

        const metrics = await page.evaluate(() => {
            const cta = document.getElementById('btn-deep-angel')?.getBoundingClientRect();
            const banner = document.getElementById('cookie-banner')?.getBoundingClientRect();
            const overlapsCookie = !!(cta && banner && !(
                banner.right < cta.left
                || banner.left > cta.right
                || banner.bottom < cta.top
                || banner.top > cta.bottom
            ));

            return {
                ctaTop: Math.round(cta?.top || -1),
                ctaBottom: Math.round(cta?.bottom || 9999),
                cookieTop: Math.round(banner?.top || window.innerHeight),
                overlapsCookie,
                overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
            };
        });

        expect(metrics.overflow).toBe(false);
        expect(metrics.ctaTop).toBeGreaterThanOrEqual(0);
        expect(metrics.overlapsCookie).toBe(false);
        expect(metrics.ctaBottom).toBeLessThanOrEqual(metrics.cookieTop);
    });

    test('daily_card deep link opens the selected homepage card detail', async ({ page }) => {
        await page.evaluate(() => localStorage.clear());
        await page.goto('/andelske-karty.html?source=homepage_daily_card_detail&feature=daily_angel_card&daily_card=intuice');
        await waitForPageReady(page);

        await expect(page.locator('#draw-btn')).toHaveClass(/is-flipped/);
        await expect.poll(() => page.locator('.angel-card-inner').evaluate(element => getComputedStyle(element).transform))
            .not.toBe('matrix(1, 0, 0, 1, 0, 0)');
        await expect(page.locator('#angel-results')).toHaveClass(/mh-block-visible/);
        await expect(page.locator('#angel-results h3.wow-title')).toContainText('Poselství andělské karty');
        await expect(page.locator('.angel-return-message')).toContainText('Tvoje andělská karta: Intuice');
        await expect(page.locator('.angel-name')).toHaveText('Intuice');
        await expect(page.locator('.angel-theme')).toHaveText('Vhled');
        await expect(page.locator('#angel-short-message')).toContainText('smysl');
        await expect(page.locator('.angel-card-back')).toHaveClass(/angel-card-back--guidance/);

        const backgroundImage = await page.locator('.angel-card-back').evaluate(element => getComputedStyle(element).backgroundImage);
        expect(backgroundImage).toContain('/img/atlas/angels-v1/guidance.webp');
    });
});

// ═══════════════════════════════════════════════════════════
// KŘIŠŤÁLOVÁ KOULE
// ═══════════════════════════════════════════════════════════

test.describe('Křišťálová koule', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/kristalova-koule.html');
        await waitForPageReady(page);
    });

    test('stránka vrátí 200', async ({ page }) => {
        const res = await page.request.get('/kristalova-koule.html');
        expect(res.status()).toBe(200);
    });

    test('h1 je viditelný', async ({ page }) => {
        await expect(page.locator('h1').first()).toBeVisible();
    });

    test('#question-input nebo textarea pro otázku existuje', async ({ page }) => {
        const input = page.locator('#question-input, textarea[id*="question"], input[id*="question"]').first();
        await expect(input).toBeAttached();
    });

    test('#ask-btn nebo submit tlačítko existuje', async ({ page }) => {
        const btn = page.locator('#ask-btn, button[id*="ask"], button[type="submit"]').first();
        await expect(btn).toBeAttached();
    });

    test('#answer-container nebo answer element existuje', async ({ page }) => {
        const answer = page.locator('#answer-container, #answer-text, .answer-box').first();
        await expect(answer).toBeAttached();
    });

    test('#crystal-ball element existuje', async ({ page }) => {
        await expect(page.locator('#crystal-ball, .crystal-ball, .ball-container').first()).toBeAttached();
    });

    test('otázka pole přijímá vstup', async ({ page }) => {
        const input = page.locator('#question-input, textarea').first();
        await expect(input).toBeVisible();
        await input.fill('Co mě čeká v práci?');
        const value = await input.inputValue();
        expect(value).toContain('Co mě čeká');
    });

    test('prázdná otázka zobrazí přístupnou chybu bez volání API', async ({ page }) => {
        await page.evaluate(() => {
            localStorage.removeItem('crystalBall_lastUsage');
            window.__crystalApiCalls = 0;
            const nativeFetch = window.fetch.bind(window);
            window.fetch = (input, init) => {
                if (String(input).includes('/crystal-ball')) window.__crystalApiCalls += 1;
                return nativeFetch(input, init);
            };
        });

        const input = page.locator('#question-input');
        const error = page.locator('#question-error');
        await page.locator('#ask-btn').click();

        await expect(input).toBeFocused();
        await expect(input).toHaveAttribute('aria-invalid', 'true');
        await expect(input).toHaveAttribute('aria-describedby', 'question-instruction question-error');
        await expect(error).toBeVisible();
        await expect(error).toHaveText('Napiš otázku, na kterou chceš hledat nový úhel pohledu.');
        expect(await page.evaluate(() => window.__crystalApiCalls)).toBe(0);

        await input.fill('Co můžu ovlivnit?');
        await expect(input).toHaveAttribute('aria-invalid', 'false');
        await expect(error).toBeHidden();
    });

    test('opožděný výsledek se po změně účtu nezobrazí ani neuloží', async ({ page }) => {
        await page.evaluate(() => {
            for (const key of Object.keys(localStorage)) {
                if (key.startsWith('mh_daily_crystal_') || key === 'crystalBall_lastUsage') {
                    localStorage.removeItem(key);
                }
            }

            window.Auth = {
                ...(window.Auth || {}),
                user: { id: 'crystal-owner-before' },
                isLoggedIn: () => true,
                isPremium: () => true,
                saveReading: async () => {
                    window.__crystalSaveCount = (window.__crystalSaveCount || 0) + 1;
                    return { id: 'old-account-reading' };
                }
            };
            window.getCSRFToken = async () => 'csrf.crystal-session-test';
            window.__crystalFetchCount = 0;
            window.__crystalSaveCount = 0;
            const nativeFetch = window.fetch.bind(window);
            window.fetch = async (input, options) => {
                if (String(input).includes('/crystal-ball')) {
                    window.__crystalFetchCount += 1;
                    return new Promise(resolve => {
                        window.__releaseCrystalResponse = () => resolve({
                            status: 200,
                            json: async () => ({ success: true, response: 'SOUKROMÁ STARÁ ODPOVĚĎ' })
                        });
                    });
                }
                return nativeFetch(input, options);
            };
        });

        await page.locator('#question-input').fill('Co se mám zeptat pod účtem A?');
        await page.locator('#ask-btn').click();
        await expect.poll(() => page.evaluate(() => window.__crystalFetchCount)).toBe(1);

        await page.evaluate(() => {
            window.Auth.user = { id: 'crystal-owner-after' };
            document.dispatchEvent(new Event('auth:changed'));
        });
        await expect(page.locator('#question-input')).toHaveValue('');
        await expect(page.locator('#answer-container')).not.toHaveClass(/visible/);
        await expect(page.locator('#ask-btn')).not.toHaveAttribute('aria-busy', 'true');

        await page.evaluate(() => window.__releaseCrystalResponse());
        await expect(page.locator('#answer-text')).toBeEmpty();
        await expect(page.locator('#answer-text')).not.toContainText('SOUKROMÁ STARÁ ODPOVĚĎ');
        expect(await page.evaluate(() => window.__crystalSaveCount)).toBe(0);
        await expect(page.locator('#answer-container .favorite-reading-action')).toHaveCount(0);
    });

    test('neulozena odpoved koule zustane viditelna a je oznamena', async ({ page }) => {
        await page.route('**/api/crystal-ball', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, response: 'Odpověď vybízí k rozdělení velkého kroku na menší části.' })
        }));
        await page.evaluate(() => {
            for (const key of Object.keys(localStorage)) {
                if (key.startsWith('mh_daily_crystal_') || key === 'crystalBall_lastUsage') localStorage.removeItem(key);
            }
            window.Auth = {
                ...(window.Auth || {}),
                user: { id: 'crystal-save-failure-owner' },
                isLoggedIn: () => true,
                isPremium: () => true,
                saveReading: async () => null
            };
            window.getCSRFToken = async () => 'crystal-save-failure-token';
            document.dispatchEvent(new Event('auth:changed'));
        });

        await page.locator('#question-input').fill('Jak si mám rozdělit dnešní úkoly?');
        await page.locator('#ask-btn').click();

        await expect(page.locator('#answer-container')).toHaveClass(/visible/);
        await expect(page.locator('#answer-text'))
            .toContainText('Odpověď vybízí k rozdělení velkého kroku na menší části.');
        await expect(page.locator('#answer-container [data-reading-save-error]'))
            .toHaveAttribute('role', 'status');
        await expect(page.locator('#answer-container [data-reading-save-error]'))
            .toContainText('uložení do profilu se nepodařilo');
        await expect(page.locator('#answer-container .favorite-reading-action')).toHaveCount(0);
    });

    test('stranka vede dotaz na spravny typ vykladu', async ({ page }) => {
        const cluster = page.locator('.crystal-intent-section');
        await expect(cluster).toBeVisible();
        await expect(cluster.locator('.crystal-intent-card')).toHaveCount(6);
        await expect(cluster.locator('[data-analytics-cta="crystal_intent_open_question"]')).toHaveAttribute('href', '#question-input');
        await expect(cluster.locator('[data-analytics-cta="crystal_intent_scrying_guide"]')).toHaveAttribute('href', /tajemstvi-kristalove-koule-scrying\.html/);
        await expect(cluster.locator('[data-analytics-cta="crystal_intent_yes_no"]')).toHaveAttribute('href', /tarot-ano-ne\.html/);
        await expect(cluster.locator('[data-analytics-cta="crystal_intent_mentor"]')).toHaveAttribute('href', /mentor\.html/);
    });

    test('JSON-LD strukturovaná data existují', async ({ page }) => {
        const ldJson = page.locator('script[type="application/ld+json"]');
        expect(await ldJson.count()).toBeGreaterThanOrEqual(1);
    });

    test('meta popis drží symbolický rámec bez AI věštby', async ({ page }) => {
        // Statický title/meta je autoritativní — runtime přepis byl odstraněn,
        // aby SEO targeting "ano ne online zdarma" přežil i vykreslení JS.
        await expect(page).toHaveTitle('Křišťálová koule ano ne – odpověď na jednu otázku');
        await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /[Kk]řišťálová koule ano ne online/);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /symbolickou odpověď/);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /bez slibu pevné budoucnosti/);

        const ldBlocks = page.locator('script[type="application/ld+json"]');
        const structuredData = (await ldBlocks.allTextContents()).join('\n');
        expect(structuredData).toContain('Křišťálová koule ano ne online zdarma');
        expect(structuredData).toContain('symbolick');

        const headText = await page.locator('head').textContent();
        expect(headText).not.toContain('AI věštba');
        expect(headText).not.toContain('předpověď');
    });

    test('odhlaseny navstevnik dostane odpoved pred signupem', async ({ page }) => {
        await page.route('**/api/crystal-ball', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, response: 'Symbolická odpověď pro první hodnotu.' })
            });
        });

        await page.addInitScript(() => {
            Object.keys(localStorage)
                .filter(key => key.startsWith('mh_daily_crystal_') || key === 'crystalBall_lastUsage')
                .forEach(key => localStorage.removeItem(key));
        });

        await page.goto('/kristalova-koule.html?source=e2e_crystal_value_first&feature=kristalova_koule');
        await waitForPageReady(page);
        await page.locator('#question-input').fill('Co mám dnes udělat jako první krok?');
        await page.locator('#ask-btn').click();

        await expect(page.locator('#answer-container')).toHaveClass(/visible/, { timeout: 5000 });
        await expect(page.locator('#answer-text')).toContainText('Symbolická odpověď');
        // Anonymní návštěvník má 1 dotaz zdarma a pak registraci (CRYSTAL_BALL_ANON_FREE_LIMIT,
        // js/freemium-koule.js). Počítadlo "x / 3" se plní jen přihlášeným, proto se kontroluje
        // sdělení bannerem — hlídá, že se model "nejdřív hodnota, pak registrace" nerozbije.
        await expect(page.locator('#freemium-banner-text')).toContainText('zdarma');
        expect(page.url()).toContain('/kristalova-koule.html');
        expect(page.url()).not.toContain('/prihlaseni.html');
        expect(page.url()).not.toContain('/cenik.html');
    });

    test('odhlaseny limit po trech odpovedich smeruje do upgrade flow bez API volani', async ({ page }) => {
        let apiCalled = false;
        await page.route('**/api/crystal-ball', async route => {
            apiCalled = true;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, response: 'Nemelo by se volat.' })
            });
        });

        await page.addInitScript(() => {
            localStorage.setItem(`mh_daily_crystal_${new Date().toDateString()}`, '3');
            localStorage.removeItem('crystalBall_lastUsage');
        });

        await page.goto('/kristalova-koule.html?source=e2e_crystal_limit&feature=kristalova_koule');
        await waitForPageReady(page);
        await page.evaluate(() => {
            window.__crystalCheckoutPayloads = [];
            window.Auth = {
                isLoggedIn: () => false,
                isPremium: () => false,
                showToast: () => {},
                startPlanCheckout: (planId, context) => window.__crystalCheckoutPayloads.push({ planId, context })
            };
        });
        await page.locator('#question-input').fill('Můžu se zeptat počtvrté?');
        await page.locator('#ask-btn').click();

        await expect.poll(() => page.evaluate(() => window.__crystalCheckoutPayloads.length)).toBe(1);
        expect(apiCalled).toBe(false);
        const payload = await page.evaluate(() => window.__crystalCheckoutPayloads[0]);
        expect(payload).toEqual(expect.objectContaining({
            planId: 'pruvodce',
            context: expect.objectContaining({
                source: 'crystal_ball_limit_gate',
                feature: 'kristalova_koule'
            })
        }));
    });

    // API test — bez AI klíče vrátí chybu, ale CSRF musí být vyžadováno
    test('POST /api/crystal-ball bez CSRF vrátí 403', async ({ page }) => {
        const res = await page.request.post('/api/crystal-ball', {
            data: { question: 'Testovací otázka' },
        });
        expect(res.status()).toBe(403);
    });

    test('POST /api/crystal-ball s prázdnou otázkou vrátí 400', async ({ page }) => {
        const csrf = await getCsrfToken(page);
        const res = await page.request.post('/api/crystal-ball', {
            data: { question: '' },
            headers: { 'x-csrf-token': csrf },
        });
        expect(res.status()).toBe(400);
    });

    test('POST /api/crystal-ball s příliš dlouhou otázkou vrátí 400', async ({ page }) => {
        const csrf = await getCsrfToken(page);
        const res = await page.request.post('/api/crystal-ball', {
            data: { question: 'x'.repeat(1001) },
            headers: { 'x-csrf-token': csrf },
        });
        expect(res.status()).toBe(400);
    });

    test('žádný horizontální scroll na mobilu', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/kristalova-koule.html');
        await waitForPageReady(page);
        const overflow = await page.evaluate(() =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(overflow).toBe(false);
    });

    test('mobilní cookie lišta začíná kompaktně a nastavení se rozbalí až na vyžádání', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.addInitScript(() => {
            localStorage.removeItem('mh_cookie_prefs');
            localStorage.removeItem('cookieConsent');
        });
        await page.goto('/kristalova-koule.html?source=e2e_cookie_compact');
        await waitForPageReady(page);

        const banner = page.locator('#cookie-banner');
        await expect(banner).toHaveClass(/visible/, { timeout: 4_000 });
        await expect(page.locator('#cookie-save')).toHaveText('Nastavení');

        const collapsed = await page.evaluate(() => {
            const bannerRect = document.getElementById('cookie-banner')?.getBoundingClientRect();
            const prefs = document.querySelector('#cookie-banner .cookie-banner__preferences');
            return {
                height: Math.round(bannerRect?.height || 999),
                preferencesHidden: prefs?.hidden === true,
                overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
            };
        });

        expect(collapsed.overflow).toBe(false);
        expect(collapsed.preferencesHidden).toBe(true);
        expect(collapsed.height).toBeLessThanOrEqual(100);

        await page.locator('#cookie-save').click();
        await expect(page.locator('#cookie-banner .cookie-banner__preferences')).toBeVisible();
        await expect(page.locator('#cookie-save')).toHaveText('Uložit nastavení');

        // GDPR opt-in (commit 89fa8982): analytika je ve výchozím stavu VYPNUTÁ a uložení
        // bez zaškrtnutí ji zapnout nesmí. Regrese zpět na opt-out by byla GDPR problém.
        await page.locator('#cookie-save').click();
        await expect(banner).toBeHidden();
        const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('mh_cookie_prefs') || '{}'));
        expect(prefs.analytics).toBe(false);
        expect(prefs.marketing).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════
// RUNY
// ═══════════════════════════════════════════════════════════

test.describe('Runy', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/runy.html');
        await waitForPageReady(page);
    });

    test('stránka vrátí 200', async ({ page }) => {
        const res = await page.request.get('/runy.html');
        expect(res.status()).toBe(200);
    });

    test('h1 je viditelný', async ({ page }) => {
        await expect(page.locator('h1').first()).toBeVisible();
    });

    test('SEO snippet cílí na denní runu zdarma', async ({ page }) => {
        await expect(page).toHaveTitle('Runy online: denní runa zdarma | Mystická Hvězda');
        await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /denní runu zdarma/);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Elder Futhark/);
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'Runy online: denní runa zdarma | Mystická Hvězda');
    });

    test('denní tah se řídí pražským datem i před půlnocí UTC', async ({ page }) => {
        await page.clock.install({ time: new Date('2026-10-17T22:30:00.000Z') });
        await page.addInitScript(() => {
            localStorage.setItem('runeDaily', JSON.stringify({
                date: '2026-10-18',
                runeData: {
                    name: 'Fehu',
                    symbol: 'ᚠ',
                    meaning: 'Začátek a zdroje',
                    description: 'Zaměř se na to, co máš k dispozici.'
                }
            }));
        });
        await page.reload();

        await expect(page.locator('#rune-result')).toHaveClass(/visible/);
        await expect(page.locator('#rune-name')).toContainText('Fehu');
        await expect(page.locator('#btn-draw')).toBeHidden();
    });

    test('#btn-draw nebo tlačítko pro vytažení runy existuje', async ({ page }) => {
        const btn = page.locator('#btn-draw, button[id*="draw"], button[id*="rune"]').first();
        await expect(btn).toBeAttached();
    });

    test('#rune-result nebo result container existuje v DOM', async ({ page }) => {
        const result = page.locator('#rune-result, .rune-result-frame, .rune-result').first();
        await expect(result).toBeAttached();
    });

    test('#active-rune nebo rune display existuje', async ({ page }) => {
        const rune = page.locator('#active-rune, .active-rune, #rune-symbol').first();
        await expect(rune).toBeAttached();
    });

    test('stranka vede uzivatele k jasnemu runovemu zameru', async ({ page }) => {
        const cluster = page.locator('.runes-intent-section');
        await expect(cluster).toBeVisible();
        await expect(cluster.locator('.runes-intent-card')).toHaveCount(6);
        await expect(cluster.locator('[data-analytics-cta="runes_intent_daily"]')).toHaveAttribute('href', '#btn-draw');
        await expect(cluster.locator('[data-analytics-cta="runes_intent_home_spread"]')).toHaveAttribute('href', /runovy-vyklad-doma-pruvodce\.html/);
        await expect(cluster.locator('[data-analytics-cta="runes_intent_crystal_ball"]')).toHaveAttribute('href', /kristalova-koule\.html/);
    });

    test('kliknutí na tlačítko runy nezpůsobí JS crash', async ({ page }) => {
        const btn = page.locator('#btn-draw, button[id*="draw"]').first();
        if (await btn.isVisible()) {
            await btn.click();
            await page.waitForTimeout(500);
        }
        await expect(page.locator('body')).toBeVisible();
    });

    test('hluboký výklad volá správný /api/runes endpoint', async ({ page }) => {
        await page.evaluate(() => localStorage.removeItem('runeDaily'));
        await page.reload();
        await waitForPageReady(page);

        await page.route('**/api/runes', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, response: 'Testovací runový vhled.' }),
            });
        });

        const apiCall = page.waitForRequest(request =>
            request.url().endsWith('/api/runes') && request.method() === 'POST'
        );

        await page.evaluate(() => {
            window.Auth = {
                isLoggedIn: () => true,
                showToast: () => {},
                startPlanCheckout: () => {}
            };
            window.getCSRFToken = async () => 'test-csrf';
        });

        await page.locator('#btn-draw').click();
        await expect(page.locator('#rune-result')).toHaveClass(/visible/, { timeout: 4_000 });
        await page.locator('#btn-deep-reading').click();
        await apiCall;
        await expect(page.locator('#ai-response-container')).toContainText('Testovací runový vhled.');
    });

    test('hluboký runový výklad zůstane viditelný při neúspěšném uložení', async ({ page }) => {
        await page.evaluate(() => localStorage.removeItem('runeDaily'));
        await page.reload();
        await waitForPageReady(page);

        await page.route('**/api/runes', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, response: 'Hotový runový výklad zůstává dostupný.' })
        }));

        await page.evaluate(() => {
            window.Auth = {
                ...(window.Auth || {}),
                user: { id: 'rune-save-failure-user' },
                isLoggedIn: () => true,
                isPremium: () => true,
                showToast: () => {},
                saveReading: async () => null
            };
            window.getCSRFToken = async () => 'csrf.rune-save-failure-test';
        });

        await page.locator('#btn-draw').click();
        await expect(page.locator('#rune-result')).toHaveClass(/visible/, { timeout: 4_000 });
        await page.locator('#btn-deep-reading').click();

        await expect(page.locator('#ai-response-container')).toContainText('Hotový runový výklad zůstává dostupný.');
        await expect(page.locator('#rune-result [data-reading-save-error]')).toBeVisible();
        await expect(page.locator('#runes-deep-error')).toHaveCount(0);
        await expect(page.locator('#btn-deep-reading')).not.toHaveAttribute('aria-busy', 'true');
    });

    test('opožděný osobní runový výklad se po změně účtu nezobrazí ani neuloží', async ({ page }) => {
        await page.evaluate(() => localStorage.removeItem('runeDaily'));
        await page.reload();
        await waitForPageReady(page);

        await page.evaluate(() => {
            window.Auth = {
                ...(window.Auth || {}),
                user: { id: 'rune-owner-before' },
                isLoggedIn: () => true,
                isPremium: () => true,
                showToast: () => {},
                saveReading: async () => {
                    window.__runeSaveCount = (window.__runeSaveCount || 0) + 1;
                    return { id: 'old-account-rune-reading' };
                }
            };
            window.getCSRFToken = async () => 'csrf.rune-session-test';
            window.__runeFetchCount = 0;
            window.__runeSaveCount = 0;
            const nativeFetch = window.fetch.bind(window);
            window.fetch = async (input, options) => {
                if (String(input).includes('/runes')) {
                    window.__runeFetchCount += 1;
                    return new Promise(resolve => {
                        window.__releaseRuneResponse = () => resolve({
                            status: 200,
                            json: async () => ({ success: true, response: 'SOUKROMÝ STARÝ RUNOVÝ VÝKLAD' })
                        });
                    });
                }
                return nativeFetch(input, options);
            };
        });

        await page.locator('#btn-draw').click();
        await expect(page.locator('#rune-result')).toHaveClass(/visible/, { timeout: 4_000 });
        await page.locator('#rune-intention').fill('Soukromý záměr účtu A');
        await page.locator('#btn-deep-reading').click();
        await expect.poll(() => page.evaluate(() => window.__runeFetchCount)).toBe(1);

        await page.evaluate(() => {
            window.Auth.user = { id: 'rune-owner-after' };
            document.dispatchEvent(new Event('auth:changed'));
        });
        await expect(page.locator('#rune-intention')).toHaveValue('');
        await expect(page.locator('#ai-response-container')).toBeHidden();
        await expect(page.locator('#btn-deep-reading')).not.toHaveAttribute('aria-busy', 'true');

        await page.evaluate(() => window.__releaseRuneResponse());
        await expect(page.locator('#ai-response-container')).not.toContainText('SOUKROMÝ STARÝ RUNOVÝ VÝKLAD');
        expect(await page.evaluate(() => window.__runeSaveCount)).toBe(0);
        await expect(page.locator('#favorite-rune-action')).toHaveCount(0);
    });

    test('odhlaseny hluboky vyklad ukaze preview paywall bez okamziteho checkoutu', async ({ page }) => {
        await page.evaluate(() => localStorage.removeItem('runeDaily'));
        await page.reload();
        await waitForPageReady(page);

        let apiCalled = false;
        await page.route('**/api/runes', route => {
            apiCalled = true;
            return route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ success: false })
            });
        });

        await page.evaluate(() => {
            window.__runesCheckoutPayloads = [];
            window.Auth = {
                isLoggedIn: () => false,
                isPremium: () => false,
                showToast: () => {},
                startPlanCheckout: (planId, context) => window.__runesCheckoutPayloads.push({ planId, context })
            };
            window.MH_ANALYTICS = {
                trackAction: () => {},
                trackCTA: () => {}
            };
        });

        await page.locator('#btn-draw').click();
        await expect(page.locator('#rune-result')).toHaveClass(/visible/, { timeout: 4_000 });
        await page.locator('#rune-intention').fill('potrebuji jasno v rozhodnuti');
        await page.locator('#btn-deep-reading').click();

        await expect(page.locator('.runes-upgrade-preview')).toBeVisible();
        await expect(page.locator('.runes-upgrade-preview')).toContainText('Odemknout');
        await expect(page.locator('.runes-upgrade-preview__reassurance')).toContainText('Cena se zobraz\u00ed ve Stripe p\u0159ed potvrzen\u00edm. Zru\u0161en\u00ed najdete v profilu.');
        expect(apiCalled).toBe(false);
        expect(page.url()).toContain('/runy.html');
        expect(await page.evaluate(() => window.__runesCheckoutPayloads.length)).toBe(0);

        await page.locator('.runes-upgrade-preview__cta').click();
        expect(await page.evaluate(() => window.__runesCheckoutPayloads[0])).toMatchObject({
            planId: 'pruvodce',
            context: {
                source: 'runes_auth_gate',
                feature: 'runy_hluboky_vyklad'
            }
        });
    });

    test('free uzivatel po 402 vidi preview paywall a checkout az po CTA', async ({ page }) => {
        await page.evaluate(() => localStorage.removeItem('runeDaily'));
        await page.reload();
        await waitForPageReady(page);

        await page.route('**/api/runes', async route => {
            await route.fulfill({
                status: 402,
                contentType: 'application/json',
                body: JSON.stringify({ success: false, error: 'Premium required' })
            });
        });

        await page.evaluate(() => {
            window.__runesCheckoutPayloads = [];
            window.Auth = {
                isLoggedIn: () => true,
                isPremium: () => false,
                showToast: () => {},
                startPlanCheckout: (planId, context) => window.__runesCheckoutPayloads.push({ planId, context })
            };
            window.getCSRFToken = async () => 'test-csrf';
            window.MH_ANALYTICS = {
                trackAction: () => {},
                trackCTA: () => {}
            };
        });

        await page.locator('#btn-draw').click();
        await expect(page.locator('#rune-result')).toHaveClass(/visible/, { timeout: 4_000 });
        await page.locator('#rune-intention').fill('chci pochopit vztah');
        await page.locator('#btn-deep-reading').click();

        await expect(page.locator('.runes-upgrade-preview')).toBeVisible();
        await expect(page.locator('.runes-upgrade-preview__reassurance')).toContainText('Cena se zobraz\u00ed ve Stripe p\u0159ed potvrzen\u00edm. Zru\u0161en\u00ed najdete v profilu.');
        expect(await page.evaluate(() => window.__runesCheckoutPayloads.length)).toBe(0);

        await page.locator('.runes-upgrade-preview__cta').click();
        expect(await page.evaluate(() => window.__runesCheckoutPayloads[0])).toMatchObject({
            planId: 'pruvodce',
            context: {
                source: 'runes_premium_gate',
                feature: 'runy_hluboky_vyklad'
            }
        });
    });

    test('#loading element existuje v DOM', async ({ page }) => {
        await expect(page.locator('#loading, .loading, .loading-spinner').first()).toBeAttached();
    });

    test('canonical link existuje', async ({ page }) => {
        const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
        expect(canonical).toBeTruthy();
    });

    test('runes bundle ma cache-busting verzi', async ({ page }) => {
        const src = await page.locator('script[src*="runes"]').first().getAttribute('src');
        expect(src).toMatch(/\/runes\.mh-[a-f0-9]{16}\.js$/);
    });

    test('žádný horizontální scroll na mobilu', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/runy.html');
        await waitForPageReady(page);
        const overflow = await page.evaluate(() =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(overflow).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════
// MINULÝ ŽIVOT (Akashické záznamy)
// ═══════════════════════════════════════════════════════════

test.describe('Minulý život', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/minuly-zivot.html');
        await waitForPageReady(page);
    });

    test('stránka vrátí 200', async ({ page }) => {
        const res = await page.request.get('/minuly-zivot.html');
        expect(res.status()).toBe(200);
    });

    test('h1 je viditelný', async ({ page }) => {
        await expect(page.locator('h1').first()).toBeVisible();
    });

    test('#pl-name vstupní pole existuje', async ({ page }) => {
        const nameInput = page.locator('#pl-name');
        await expect(nameInput).toBeAttached();
    });

    test('#pl-birth datum pole existuje', async ({ page }) => {
        const dateInput = page.locator('#pl-birth');
        await expect(dateInput).toBeAttached();
        const type = await dateInput.getAttribute('type');
        expect(type).toBe('date');
    });

    test('gender výběr tlačítka existují', async ({ page }) => {
        const genderBtns = page.locator('[data-gender]');
        expect(await genderBtns.count()).toBeGreaterThanOrEqual(2);
    });

    test('#pl-submit tlačítko existuje', async ({ page }) => {
        await expect(page.locator('#pl-submit')).toBeAttached();
    });

    test('#pl-loading element existuje', async ({ page }) => {
        await expect(page.locator('#pl-loading')).toBeAttached();
    });

    test('#pl-result container existuje', async ({ page }) => {
        await expect(page.locator('#pl-result')).toBeAttached();
    });

    test('#premium-wall nebo premium element existuje', async ({ page }) => {
        const premiumEl = page.locator('#premium-wall, .premium-wall, .premium-gate').first();
        await expect(premiumEl).toBeAttached();
    });

    test('premium wall CTA odkazy nesou tracking kontext', async ({ page }) => {
        const upgradeHref = await page.locator('#past-life-upgrade-btn').getAttribute('href');
        expect(upgradeHref).toContain('plan=pruvodce');
        expect(upgradeHref).toContain('source=past_life_banner_upgrade');
        expect(upgradeHref).toContain('feature=minuly_zivot');
        expect(upgradeHref).toContain('entry_source=past_life_banner_upgrade');
        expect(upgradeHref).toContain('entry_feature=minuly_zivot');
        await expect(page.locator('#past-life-upgrade-btn')).toContainText('Odemknout Hvězdného Průvodce');
        await expect(page.locator('#premium-wall')).toContainText('Cena a případné zkušební období se zobrazí ve Stripe před potvrzením.');
        await expect(page.locator('#premium-wall')).not.toContainText('199 Kč');

        const registerHref = await page.locator('#past-life-register-btn').getAttribute('href');
        expect(registerHref).toContain('mode=login');
        expect(registerHref).toContain('redirect=/minuly-zivot.html');
        expect(registerHref).toContain('source=past_life_register_gate');
        expect(registerHref).toContain('feature=minuly_zivot');
    });

    test('odhlaseny navstevnik vyplni formular a vidi zamceny preview bez API volani', async ({ page }) => {
        let apiCalled = false;
        await page.route('**/api/past-life', route => {
            apiCalled = true;
            return route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ success: false })
            });
        });

        await page.evaluate(() => {
            window.__pastLifeCheckoutPayloads = [];
            window.Auth = {
                isLoggedIn: () => false,
                isPremium: () => false,
                showToast: () => {},
                startPlanCheckout: (planId, context) => window.__pastLifeCheckoutPayloads.push({ planId, context })
            };
            window.MH_ANALYTICS = {
                trackAction: () => {},
                trackCTA: () => {}
            };
            window.dispatchEvent(new Event('auth:changed'));
        });

        await expect(page.locator('#pl-form-wrap')).toBeVisible();
        await expect(page.locator('#premium-wall')).toBeVisible();
        await page.locator('#pl-name').fill('Jana Testovaci');
        await page.locator('#pl-birth').fill('1992-03-15');
        await page.locator('[data-gender="neutral"]').click();
        await page.locator('#pl-name').press('Enter');

        await expect(page.locator('#past-life-preview-gate')).toBeVisible();
        await expect(page.locator('#past-life-preview-gate')).toContainText('Odemknout');
        await expect(page.locator('#past-life-preview-heading')).toHaveAttribute('tabindex', '-1');
        await expect(page.locator('#past-life-preview-heading')).toBeFocused();
        expect(apiCalled).toBe(false);
        expect(await page.evaluate(() => window.__pastLifeCheckoutPayloads.length)).toBe(0);

        await page.locator('.past-life-preview-gate__cta').click();
        expect(await page.evaluate(() => window.__pastLifeCheckoutPayloads[0])).toMatchObject({
            planId: 'pruvodce',
            context: expect.objectContaining({
                source: 'past_life_submit_gate',
                feature: 'minuly_zivot',
                metadata: expect.objectContaining({
                    entry_source: 'past_life_submit_gate',
                    entry_feature: 'minuly_zivot'
                })
            })
        });
    });

    test('formulář ohlásí chybu a zaměří první chybějící údaj', async ({ page }) => {
        await page.locator('#pl-submit').click();

        await expect(page.locator('#pl-error')).toHaveAttribute('role', 'alert');
        await expect(page.locator('#pl-error')).toContainText('Zadej své jméno.');
        await expect(page.locator('#pl-name')).toHaveAttribute('aria-invalid', 'true');
        await expect(page.locator('#pl-name')).toHaveAttribute('aria-describedby', 'pl-error');
        await expect(page.locator('#pl-name')).toBeFocused();

        await page.locator('#pl-name').fill('Jana Testovací');
        await page.locator('#pl-birth').fill('1992-03-15');
        await page.locator('#pl-submit').click();
        await expect(page.locator('#pl-error')).toContainText('Vyber formu výkladu.');
        await expect(page.locator('#pl-gender-options')).toHaveAttribute('aria-invalid', 'true');
        await expect(page.locator('[data-gender="muz"]')).toBeFocused();
        await page.locator('[data-gender="neutral"]').click();
        await expect(page.locator('[data-gender="neutral"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#pl-error')).toBeHidden();
    });

    test('po návratu obnoví rozpracované údaje a jednorázový kontext smaže', async ({ page }) => {
        await page.evaluate(() => sessionStorage.setItem('pendingPastLifeContext', JSON.stringify({
            version: 1,
            savedAt: Date.now(),
            payload: { name: 'Jana Návratová', birthDate: '1991-04-12', place: 'Brno', gender: 'neutral' }
        })));

        await page.goto('/minuly-zivot.html');
        await waitForPageReady(page);

        await expect(page.locator('#pl-name')).toHaveValue('Jana Návratová');
        await expect(page.locator('#pl-birth')).toHaveValue('1991-04-12');
        await expect(page.locator('#pl-place')).toHaveValue('Brno');
        await expect(page.locator('[data-gender="neutral"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#pl-context-status')).toContainText('Obnovili jsme údaje');
        expect(await page.evaluate(() => sessionStorage.getItem('pendingPastLifeContext'))).toBeNull();
    });

    test('výsledek se zobrazí i když se uložení do historie nedokončí', async ({ page }) => {
        await page.route('**/csrf-token', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ csrfToken: 'past-life-test-token' })
        }));
        await page.route('**/past-life', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                result: {
                    era: 'Renesanční město', identity: 'Pozorovatel příběhů',
                    karmic_lesson: 'Důvěra', gifts: 'Trpělivost', patterns: 'Hledání jistoty',
                    mission: 'Dávat věcem čas', message: 'Všímej si, kde už dnes jednáš jinak.'
                }
            })
        }));

        await page.evaluate(() => {
            window.Auth = {
                user: { id: 'past-life-result-owner' },
                isLoggedIn: () => true,
                isPremium: () => true,
                saveReading: () => new Promise(() => {})
            };
            window.dispatchEvent(new Event('auth:changed'));
        });
        await page.locator('#pl-name').fill('Jana Testovací');
        await page.locator('#pl-birth').fill('1992-03-15');
        await page.locator('[data-gender="neutral"]').click();
        await page.locator('#pl-submit').click();

        await expect(page.locator('#pl-result')).toHaveClass(/visible/);
        await expect(page.locator('#res-era')).toHaveText('Renesanční město');
        await expect(page.locator('#pl-result-heading')).toBeFocused();
        await page.locator('#pl-reset').click();
        await expect(page.locator('#pl-submit')).toBeEnabled();
        await expect(page.locator('#pl-name')).toBeFocused();
    });

    test('chyba ulozeni minulého zivota ponecha výklad a ukáže upozornění', async ({ page }) => {
        await page.route('**/csrf-token', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ csrfToken: 'past-life-save-failure-token' })
        }));
        await page.route('**/past-life', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                result: {
                    era: 'Příběh z horské vesnice', identity: 'Pozorovatelka změn',
                    karmic_lesson: 'Důvěra', gifts: 'Cit pro souvislosti', patterns: 'Přílišná opatrnost',
                    mission: 'Všímat si dnešních možností', message: 'Zkušenost může být podnětem k zamyšlení.'
                }
            })
        }));
        await page.evaluate(() => {
            window.Auth = {
                user: { id: 'past-life-save-failure-owner' },
                isLoggedIn: () => true,
                isPremium: () => true,
                saveReading: async () => { throw new Error('history unavailable'); }
            };
            window.dispatchEvent(new Event('auth:changed'));
        });

        await page.locator('#pl-name').fill('Jana Testovací');
        await page.locator('#pl-birth').fill('1992-03-15');
        await page.locator('[data-gender="neutral"]').click();
        await page.locator('#pl-submit').click();

        await expect(page.locator('#pl-result')).toHaveClass(/visible/);
        await expect(page.locator('#res-era')).toHaveText('Příběh z horské vesnice');
        await expect(page.locator('#res-message')).toHaveText('Zkušenost může být podnětem k zamyšlení.');
        await expect(page.locator('#pl-result [data-reading-save-error]'))
            .toContainText('nepodařilo se ho uložit do profilu');
    });

    test('chyba API formulář obnoví, zachová údaje a dovolí opakování', async ({ page }) => {
        await page.route('**/csrf-token', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ csrfToken: 'past-life-test-token' })
        }));
        await page.route('**/past-life', route => route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, error: 'Výklad se teď nepodařilo připravit.' })
        }));
        await page.evaluate(() => {
            window.Auth = { user: { id: 'past-life-error-owner' }, isLoggedIn: () => true, isPremium: () => true };
            window.dispatchEvent(new Event('auth:changed'));
        });

        await page.locator('#pl-name').fill('Jana Testovací');
        await page.locator('#pl-birth').fill('1992-03-15');
        await page.locator('#pl-place').fill('Brno');
        await page.locator('[data-gender="neutral"]').click();
        await page.locator('#pl-submit').click();

        await expect(page.locator('#pl-error')).toContainText('Výklad se teď nepodařilo připravit.');
        await expect(page.locator('#pl-form-wrap')).toBeVisible();
        await expect(page.locator('#pl-name')).toHaveValue('Jana Testovací');
        await expect(page.locator('#pl-birth')).toHaveValue('1992-03-15');
        await expect(page.locator('#pl-place')).toHaveValue('Brno');
        await expect(page.locator('#pl-submit')).toBeEnabled();
    });

    test('zaseknutý požadavek na CSRF bezpečně obnoví formulář před odesláním výkladu', async ({ page }) => {
        let generationRequested = false;
        await page.route('**/csrf-token', async route => {
            await new Promise(resolve => setTimeout(resolve, 100));
            try {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ csrfToken: 'past-life-test-token' })
                });
            } catch {
                // The page should abort this safe preflight before generation starts.
            }
        });
        await page.route('**/past-life', route => {
            generationRequested = true;
            return route.fulfill({ status: 500, body: '{}' });
        });
        await page.evaluate(() => {
            const nativeSetTimeout = window.setTimeout.bind(window);
            window.setTimeout = (callback, delay, ...args) => nativeSetTimeout(callback, delay === 15000 ? 10 : delay, ...args);
            window.Auth = { user: { id: 'past-life-csrf-owner' }, isLoggedIn: () => true, isPremium: () => true };
            window.dispatchEvent(new Event('auth:changed'));
        });

        await page.locator('#pl-name').fill('Jana Testovací');
        await page.locator('#pl-birth').fill('1992-03-15');
        await page.locator('[data-gender="neutral"]').click();
        await page.locator('#pl-submit').click();

        await expect(page.locator('#pl-error')).toContainText('Výklad jsme neodeslali');
        await expect(page.locator('#pl-name')).toHaveValue('Jana Testovací');
        await expect(page.locator('#pl-submit')).toBeEnabled();
        expect(generationRequested).toBe(false);
    });

    test('pozdni odpoved minuleho zivota se po zmene uctu neukaze ani neulozi', async ({ page }) => {
        await page.evaluate(() => {
            window.Auth = {
                ...(window.Auth || {}),
                user: { id: 'past-life-owner-a' },
                isLoggedIn: () => true,
                isPremium: () => true,
                saveReading: async () => {
                    window.__pastLifeSaveCount = (window.__pastLifeSaveCount || 0) + 1;
                    return { id: 'old-past-life-reading' };
                }
            };
            window.__pastLifeSaveCount = 0;
            window.dispatchEvent(new Event('auth:changed'));
            const nativeFetch = window.fetch.bind(window);
            window.fetch = (input, options) => {
                const url = new URL(typeof input === 'string' ? input : input.url, location.href);
                if (url.pathname.endsWith('/past-life')) {
                    return new Promise(resolve => {
                        window.__releasePastLifeResponse = () => resolve(new Response(JSON.stringify({
                            success: true,
                            result: {
                                era: 'STARÁ OSOBNÍ ÉRA', identity: 'Soukromá identita',
                                karmic_lesson: 'Soukromá lekce', gifts: 'Soukromé dary',
                                patterns: 'Soukromý vzorec', mission: 'Soukromý úkol', message: 'Soukromá zpráva'
                            }
                        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
                    });
                }
                if (url.pathname.endsWith('/csrf-token')) {
                    return Promise.resolve(new Response(JSON.stringify({ csrfToken: 'past-life-session-token' }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    }));
                }
                return nativeFetch(input, options);
            };
        });

        await page.locator('#pl-name').fill('Jana Soukromá');
        await page.locator('#pl-birth').fill('1992-03-15');
        await page.locator('#pl-place').fill('Brno');
        await page.locator('[data-gender="neutral"]').click();
        await page.locator('#pl-submit').click();
        await expect(page.locator('#pl-loading')).toBeVisible();
        await expect.poll(() => page.evaluate(() => typeof window.__releasePastLifeResponse)).toBe('function');

        await page.evaluate(() => {
            window.Auth.user.id = 'past-life-owner-b';
            document.dispatchEvent(new Event('auth:changed'));
        });
        await expect(page.locator('#pl-name')).toHaveValue('');
        await expect(page.locator('#pl-birth')).toHaveValue('');
        await expect(page.locator('#pl-place')).toHaveValue('');
        await expect(page.locator('#pl-loading')).toBeHidden();
        await expect(page.locator('#form-section')).toBeVisible();
        await expect(page.locator('#pl-result')).not.toHaveClass(/visible/);

        await page.evaluate(() => window.__releasePastLifeResponse());
        await expect(page.locator('#res-era')).toBeEmpty();
        await expect(page.locator('#pl-result')).not.toHaveClass(/visible/);
        await expect.poll(() => page.evaluate(() => window.__pastLifeSaveCount)).toBe(0);
        await expect(page.locator('#favorite-past-life-action')).toHaveCount(0);
    });

    test('zmena uctu odstrani hotovy minuly zivot i pozdni akci ulozeni', async ({ page }) => {
        await page.route('**/csrf-token', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ csrfToken: 'past-life-save-session-token' })
        }));
        await page.route('**/past-life', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                success: true,
                result: {
                    era: 'Symbolická doba', identity: 'Příběh citlivého pozorovatele',
                    karmic_lesson: 'Trpělivost', gifts: 'Naslouchání',
                    patterns: 'Hledání jistoty', mission: 'Všímat si dnešních voleb', message: 'Výklad pro účet A.'
                }
            })
        }));
        await page.evaluate(() => {
            window.Auth = {
                ...(window.Auth || {}),
                user: { id: 'past-life-save-owner-a' },
                isLoggedIn: () => true,
                isPremium: () => true,
                saveReading: (...args) => {
                    window.__pastLifeSaveOwner = args[2];
                    return new Promise(resolve => {
                        window.__releasePastLifeSave = () => resolve({ id: 'old-past-life-reading' });
                    });
                }
            };
            window.dispatchEvent(new Event('auth:changed'));
        });

        await page.locator('#pl-name').fill('Jana Soukromá');
        await page.locator('#pl-birth').fill('1992-03-15');
        await page.locator('[data-gender="neutral"]').click();
        await page.locator('#pl-submit').click();
        await expect(page.locator('#pl-result')).toHaveClass(/visible/);
        await expect(page.locator('#res-era')).toHaveText('Symbolická doba');
        await expect.poll(() => page.evaluate(() => window.__pastLifeSaveOwner)).toBe('past-life-save-owner-a');

        await page.evaluate(() => {
            window.Auth.user.id = 'past-life-save-owner-b';
            document.dispatchEvent(new Event('auth:changed'));
        });
        await expect(page.locator('#pl-result')).not.toHaveClass(/visible/);
        await expect(page.locator('#res-era')).toBeEmpty();
        await expect(page.locator('#favorite-past-life-action')).toHaveCount(0);
        await expect(page.locator('#share-fb')).toHaveAttribute('href', '#');
        await expect(page.locator('#share-x')).toHaveAttribute('href', '#');

        await page.evaluate(() => window.__releasePastLifeSave());
        await page.waitForTimeout(0);
        await expect(page.locator('#favorite-past-life-action')).toHaveCount(0);
        await expect(page.locator('#pl-result')).not.toHaveClass(/visible/);
    });

    test('free prihlaseny uzivatel vidi preview a checkout zdroj free gate', async ({ page }) => {
        await page.evaluate(() => {
            window.__pastLifeCheckoutPayloads = [];
            window.Auth = {
                isLoggedIn: () => true,
                isPremium: () => false,
                showToast: () => {},
                startPlanCheckout: (planId, context) => window.__pastLifeCheckoutPayloads.push({ planId, context })
            };
            window.MH_ANALYTICS = {
                trackAction: () => {},
                trackCTA: () => {}
            };
            window.dispatchEvent(new Event('auth:changed'));
        });

        await page.locator('#pl-name').fill('Pavel Test');
        await page.locator('#pl-birth').fill('1988-11-20');
        await page.locator('[data-gender="muz"]').click();
        await page.locator('#pl-submit').click();

        await expect(page.locator('#past-life-preview-gate')).toBeVisible();
        await page.locator('.past-life-preview-gate__cta').click();
        expect(await page.evaluate(() => window.__pastLifeCheckoutPayloads[0])).toMatchObject({
            planId: 'pruvodce',
            context: expect.objectContaining({
                source: 'past_life_free_submit_gate',
                feature: 'minuly_zivot',
                metadata: expect.objectContaining({
                    entry_source: 'past_life_free_submit_gate',
                    entry_feature: 'minuly_zivot'
                })
            })
        });
    });

    test('symbolický intent cluster vede na správné další kroky', async ({ page }) => {
        await expect(page.locator('.past-life-hero p, .hero__subtitle').first()).toContainText('symbolický obraz');

        const section = page.locator('.past-life-intent-section');
        await expect(section).toBeVisible();
        await expect(section).toContainText('archetypální příběh, ne doslovný důkaz');
        await expect(section.locator('.past-life-intent-card')).toHaveCount(6);

        await expect(section.locator('[data-analytics-cta="past_life_intent_symbolic"]')).toHaveAttribute('href', '#form-section');
        await expect(section.locator('[data-analytics-cta="past_life_intent_mentor"]')).toHaveAttribute('href', /mentor\.html\?source=past_life_intent_cluster/);
        await expect(section.locator('[data-analytics-cta="past_life_intent_natal"]')).toHaveAttribute('href', /natalni-karta\.html\?source=past_life_intent_cluster/);
        await expect(section.locator('[data-analytics-cta="past_life_intent_relationship"]')).toHaveAttribute('href', /partnerska-shoda\.html\?source=past_life_intent_cluster/);
    });

    test('mobilní premium CTA není překryté cookie bannerem', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/minuly-zivot.html');
        await waitForPageReady(page);

        await expect(page.locator('#premium-wall')).toBeVisible();
        await expect(page.locator('#past-life-upgrade-btn')).toContainText('Odemknout');

        await page.locator('#past-life-upgrade-btn').scrollIntoViewIfNeeded();
        await page.waitForTimeout(100);

        const metrics = await page.evaluate(() => {
            const cta = document.getElementById('past-life-upgrade-btn')?.getBoundingClientRect();
            const banner = document.getElementById('cookie-banner')?.getBoundingClientRect();
            const overlapsCookie = !!(cta && banner && !(
                banner.right < cta.left
                || banner.left > cta.right
                || banner.bottom < cta.top
                || banner.top > cta.bottom
            ));

            return {
                ctaTop: Math.round(cta?.top || 9999),
                ctaBottom: Math.round(cta?.bottom || 9999),
                cookieTop: Math.round(banner?.top || window.innerHeight),
                overlapsCookie,
                overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
            };
        });

        expect(metrics.overflow).toBe(false);
        expect(metrics.overlapsCookie).toBe(false);
        expect(metrics.ctaBottom).toBeLessThanOrEqual(metrics.cookieTop);
    });

    test('sdílecí tlačítka existují v DOM', async ({ page }) => {
        const shareBtns = page.locator('#share-native, #share-fb, #share-x, #share-copy');
        const count = await shareBtns.count();
        // Aspoň jedno tlačítko
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('past-life bundle ma cache-busting verzi', async ({ page }) => {
        const src = await page.locator('script[src*="minuly-zivot"]').first().getAttribute('src');
        expect(src).toMatch(/\/minuly-zivot\.mh-[a-f0-9]{16}\.js$/);
    });

    test('vstupní pole přijímají data', async ({ page }) => {
        const nameInput = page.locator('#pl-name');
        if (await nameInput.isVisible()) {
            await nameInput.fill('Jana Nováková');
            await expect(nameInput).toHaveValue('Jana Nováková');
        }
        const dateInput = page.locator('#pl-birth');
        if (await dateInput.isVisible()) {
            await dateInput.fill('1992-03-15');
            await expect(dateInput).toHaveValue('1992-03-15');
        }
    });

    // API test
    test('POST /api/past-life bez CSRF vrátí 403', async ({ page }) => {
        const res = await page.request.post('/api/past-life', {
            data: { name: 'Test', birth: '1990-01-01' },
        });
        expect(res.status()).toBe(403);
    });

    test('POST /api/past-life bez auth vrátí 401 nebo 402', async ({ page }) => {
        const csrf = await getCsrfToken(page);
        const res = await page.request.post('/api/past-life', {
            data: { name: 'Test', birth: '1990-01-01', gender: 'muz' },
            headers: { 'x-csrf-token': csrf },
        });
        // Bez přihlášení: 401 (neautorizováno) nebo 402 (premium required)
        expect([401, 402, 400]).toContain(res.status());
    });

    test('žádný horizontální scroll na mobilu', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/minuly-zivot.html');
        await waitForPageReady(page);
        const overflow = await page.evaluate(() =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(overflow).toBe(false);
    });
});
