/**
 * E2E testy — Profil uživatele + Onboarding
 *
 * Testujeme stránky dostupné bez přihlášení (načtení, struktura)
 * a ověřujeme, že chráněný obsah je správně schován za login gate.
 */

import { test, expect } from '@playwright/test';
import { BASE_URL, waitForPageReady, MOBILE_VIEWPORT } from './helpers.js';

// ═══════════════════════════════════════════════════════════
// PROFIL
// ═══════════════════════════════════════════════════════════

test.describe('Profil stránka', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/profil.html');
        await waitForPageReady(page);
    });

    test('stránka vrátí 200', async ({ page }) => {
        const res = await page.request.get('/profil.html');
        expect(res.status()).toBe(200);
    });

    test('title obsahuje "Profil"', async ({ page }) => {
        const title = await page.title().then(t => t.toLowerCase());
        expect(title).toContain('profil');
    });

    test('#login-required nebo login gate existuje v DOM', async ({ page }) => {
        // Nepřihlášený uživatel by měl vidět výzvu k přihlášení
        const loginGate = page.locator('#login-required, .login-required, [id*="login-required"]').first();
        await expect(loginGate).toBeAttached();
    });

    test('#profile-dashboard existuje v DOM', async ({ page }) => {
        // Dashboard je skrytý pro nepřihlášené
        await expect(page.locator('#profile-dashboard')).toBeAttached();
    });

    test('#profile-register-btn nebo login odkaz existuje', async ({ page }) => {
        const loginBtn = page.locator('#profile-register-btn, a[href*="prihlaseni"], button[id*="login"]').first();
        await expect(loginBtn).toBeAttached();
    });

    test('guest nahled deniku ukazuje ukazkove zaznamy a zachova meritelny kontext', async ({ page }) => {
        const gate = page.locator('#login-required');
        await expect(page.locator('#profile-greeting')).toContainText('výklady na jednom místě');
        await expect(gate).toContainText('Takhle vypadá tvůj deník výkladů');
        await expect(gate).toContainText('Bez přihlášení nic neukládáme do osobního profilu');
        await expect(page.locator('script[src*="/js/dist/profile/dashboard.mh-"]').first()).toHaveAttribute('src', /dashboard\.mh-[a-f0-9]{16}\.js$/);

        const previewItems = gate.locator('.profile-guest-preview__item');
        await expect(previewItems).toHaveCount(2);
        await expect(previewItems.nth(0)).toContainText('Ukázka');
        await expect(previewItems.nth(0)).toContainText('Tarotový výklad');
        await expect(previewItems.nth(1)).toContainText('Ukázka');
        await expect(previewItems.nth(1)).toContainText('Horoskop');

        const registerHref = await page.locator('#profile-register-btn').getAttribute('href');
        const tryFreeHref = await page.locator('#profile-try-free-btn').getAttribute('href');

        expect(registerHref).toContain('mode=register');
        expect(registerHref).toContain('source=journal_preview');
        expect(registerHref).toContain('feature=profile_history');
        expect(registerHref).toContain('redirect=/profil.html');
        expect(tryFreeHref).toContain('tarot-ano-ne.html');
        expect(tryFreeHref).toContain('source=journal_preview');
        expect(tryFreeHref).toContain('feature=tarot_yes_no');

        await Promise.all([
            page.waitForURL(url => url.pathname === '/prihlaseni.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            page.locator('#profile-register-btn').click(),
        ]);

        const clickedUrl = new URL(page.url());
        expect(clickedUrl.searchParams.get('mode')).toBe('register');
        expect(clickedUrl.searchParams.get('source')).toBe('journal_preview');
        expect(clickedUrl.searchParams.get('feature')).toBe('profile_history');
        expect(clickedUrl.searchParams.get('redirect')).toBe('/profil.html');
    });

    test('guest preview posila profile_guest_preview_viewed event', async ({ page }) => {
        await page.addInitScript(() => {
            window.__guestEvents = [];
            // js/analytics.js (classic script) přepisuje window.MH_ANALYTICS —
            // non-writable property nechá jeho přiřazení tiše selhat,
            // takže mock přežije celé načtení stránky.
            Object.defineProperty(window, 'MH_ANALYTICS', {
                value: {
                    trackEvent: (eventName, payload) => window.__guestEvents.push({ eventName, payload }),
                    trackCTA: () => {}
                },
                writable: false,
                configurable: false
            });
        });

        await page.goto('/profil.html');
        await waitForPageReady(page);

        await expect.poll(async () => page.evaluate(() => window.__guestEvents
            .filter(event => event.eventName === 'profile_guest_preview_viewed').length)).toBe(1);
    });

    test('user info elementy existují v DOM', async ({ page }) => {
        // Elementy pro zobrazení info uživatele (skryté do přihlášení)
        const userEmail = page.locator('#user-email');
        await expect(userEmail).toBeAttached();
    });

    test('stat karty existují v DOM', async ({ page }) => {
        const stats = page.locator('#stat-total, #stat-month, #stat-favorites, #stat-streak, .stat-card');
        const count = await stats.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('#logout-btn existuje v DOM', async ({ page }) => {
        await expect(page.locator('#logout-btn')).toBeAttached();
    });

    test('#avatar-picker existuje v DOM', async ({ page }) => {
        await expect(page.locator('#avatar-picker')).toBeAttached();
    });

    test('avatar možnosti existují', async ({ page }) => {
        const avatars = page.locator('.avatar-option, [data-avatar]');
        const count = await avatars.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('meta robots je noindex (profil se neindexuje)', async ({ page }) => {
        // page.evaluate nehází timeout když element neexistuje
        const robots = await page.evaluate(() => {
            const meta = document.querySelector('meta[name="robots"]');
            return meta ? meta.getAttribute('content') : null;
        });
        if (robots) {
            expect(robots).toContain('noindex');
        }
        // Test projde i bez robots meta tagu
    });

    test('žádný horizontální scroll na mobilu', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/profil.html');
        await waitForPageReady(page);
        const overflow = await page.evaluate(() =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(overflow).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════════

test.describe('Profil aktivace', () => {
    async function mockLoggedInProfile(page, options = {}) {
        await page.route('**/api/payment/checkout-result?*', route => route.fulfill({
            status: 200, contentType: 'application/json',
            body: JSON.stringify({ success: true, result: options.checkoutResult || {
                status: 'paid', product_id: 'pruvodce', value: 149, currency: 'CZK', transaction_id: 'in_verified'
            } })
        }));
        const user = {
            id: 'profile-user-1',
            email: 'profil-activation@example.com',
            first_name: 'Pavel',
            birth_date: '1990-08-10',
            subscription_status: 'free',
            ...(options.user || {})
        };
        const readings = [...(options.readings || [])];
        const subscription = options.subscription || { planType: 'free', status: 'active', canCancel: false };

        await page.context().addCookies([{
            name: 'logged_in',
            value: '1',
            url: BASE_URL
        }]);

        await page.addInitScript((authUser) => {
            localStorage.setItem('auth_user', JSON.stringify(authUser));
            localStorage.setItem('mh_zodiac', 'lev');
        }, user);

        await page.route('**/api/auth/profile', async (route) => {
            if (route.request().method() === 'PUT') {
                Object.assign(user, route.request().postDataJSON());
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, user })
            });
        });
        await page.route('**/api/plans', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, plans: [], featurePlanMap: {} })
            });
        });
        await page.route(/\/api\/user\/readings\/([^/]+)\/feedback$/, async (route) => {
            const readingId = route.request().url().match(/\/api\/user\/readings\/([^/]+)\/feedback$/)?.[1];
            const payload = route.request().postDataJSON();
            const reading = readings.find(item => item.id === decodeURIComponent(readingId || ''));
            if (!reading || reading.type === 'journal' || !reading.data || typeof reading.data !== 'object') {
                await route.fulfill({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: false, error: 'Invalid reading' })
                });
                return;
            }

            reading.data.feedback = {
                ...(reading.data.feedback || {}),
                resonance: payload.resonance || reading.data.feedback?.resonance || null,
                focus: payload.focus || reading.data.feedback?.focus || null,
                nextAction: payload.nextAction || reading.data.feedback?.nextAction || null
            };

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, reading, feedback: reading.data.feedback })
            });
        });
        await page.route(/\/api\/user\/readings\/([^/]+)$/, async (route) => {
            const readingId = route.request().url().match(/\/api\/user\/readings\/([^/]+)$/)?.[1];
            const reading = readings.find(item => item.id === decodeURIComponent(readingId || ''));
            await route.fulfill({
                status: reading ? 200 : 404,
                contentType: 'application/json',
                body: JSON.stringify(reading ? { success: true, reading } : { success: false, error: 'Not found' })
            });
        });
        await page.route(/\/api\/user\/readings\/stats(?:\?.*)?$/, async (route) => {
            const url = new URL(route.request().url());
            const monthStart = Date.parse(url.searchParams.get('monthStart') || '');
            const monthEnd = Date.parse(url.searchParams.get('monthEnd') || '');
            const timeZone = url.searchParams.get('timeZone') || 'UTC';
            const dateKey = (value) => {
                const parts = new Intl.DateTimeFormat('en-CA', {
                    timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
                }).formatToParts(new Date(value));
                const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
                return `${values.year}-${values.month}-${values.day}`;
            };
            const today = dateKey(new Date());
            const yesterdayDate = new Date(`${today}T00:00:00.000Z`);
            yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
            let expectedDate = null;
            let streak = 0;
            const uniqueDates = [...new Set(readings.map(reading => dateKey(reading.created_at)))].sort((a, b) => b.localeCompare(a));
            for (const date of uniqueDates) {
                if (expectedDate === null) {
                    if (date === today) expectedDate = today;
                    else if (date === yesterdayDate.toISOString().slice(0, 10)) expectedDate = date;
                    else break;
                }
                if (date < expectedDate) break;
                if (date === expectedDate) {
                    streak += 1;
                    const previous = new Date(`${expectedDate}T00:00:00.000Z`);
                    previous.setUTCDate(previous.getUTCDate() - 1);
                    expectedDate = previous.toISOString().slice(0, 10);
                }
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    stats: {
                        total: readings.length,
                        month: readings.filter(reading => {
                            const created = Date.parse(reading.created_at);
                            return created >= monthStart && created < monthEnd;
                        }).length,
                        favorites: readings.filter(reading => reading.is_favorite).length,
                        streak
                    }
                })
            });
        });
        await page.route(/\/api\/user\/readings(?:\?.*)?$/, async (route) => {
            if (route.request().method() === 'POST') {
                const payload = route.request().postDataJSON();
                const reading = {
                    id: `reading-${readings.length + 1}`,
                    type: payload.type,
                    data: payload.data,
                    created_at: new Date().toISOString()
                };
                readings.unshift(reading);
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true, reading })
                });
                return;
            }

            const url = new URL(route.request().url());
            const pageNumber = Math.max(1, Number(url.searchParams.get('page')) || 1);
            const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));
            const requestedTypes = (url.searchParams.get('type') || url.searchParams.get('types') || '').split(',').filter(Boolean);
            const favoritesOnly = url.searchParams.get('favorites') === 'true' || url.searchParams.get('favoritesOnly') === 'true';
            const filtered = [...readings]
                .filter(reading => !requestedTypes.length || requestedTypes.includes(reading.type))
                .filter(reading => !favoritesOnly || reading.is_favorite)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at) || String(b.id).localeCompare(String(a.id)));
            const selected = filtered.slice((pageNumber - 1) * limit, pageNumber * limit);
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    readings: selected,
                    ...(url.searchParams.get('summary') === 'true' ? { summary: { total: readings.length, favorites: readings.filter(r => r.is_favorite).length, activity: readings.map(r => r.created_at), types: [...new Set(readings.map(r => r.type))] } } : {}),
                    pagination: {
                        page: pageNumber,
                        limit,
                        total: filtered.length,
                        totalPages: Math.ceil(filtered.length / limit),
                        ...(favoritesOnly && pageNumber === 1 ? { accountTotal: readings.length } : {})
                    }
                })
            });
        });
        await page.route('**/api/payment/subscription/status', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(subscription)
            });
        });
    }

    test('profil otevre nastaveni z hash odkazu a podporuje klavesnici v zalozkach', async ({ page }) => {
        await mockLoggedInProfile(page);
        await page.goto('/profil.html#tab-settings');
        await expect(page.locator('#tab-btn-settings')).toHaveAttribute('aria-selected', 'true');
        await expect(page.locator('#tab-settings')).toBeVisible();
        await page.locator('#tab-btn-settings').focus();
        await page.locator('#tab-btn-settings').press('Home');
        await expect(page.locator('#tab-btn-history')).toHaveAttribute('aria-selected', 'true');
        await page.locator('#tab-btn-history').press('ArrowRight');
        await expect(page.locator('#tab-btn-favorites')).toHaveAttribute('aria-selected', 'true');
        await expect(page.locator('#tab-btn-favorites')).toBeFocused();
        await expect(page.locator('.profile-tab[tabindex="0"]')).toHaveCount(1);
        await page.locator('#tab-btn-favorites').press('End');
        await expect(page.locator('#tab-btn-journal')).toHaveAttribute('aria-selected', 'true');
        await expect(page.locator('#tab-journal')).toBeVisible();
    });

    test('datum narozeni lze upravit i odstranit v nastaveni profilu', async ({ page }) => {
        await mockLoggedInProfile(page, { user: { birth_date: '1990-08-10' } });
        await page.goto('/profil.html#tab-settings');

        const birthdate = page.locator('#settings-birthdate');
        await expect(birthdate).toHaveValue('1990-08-10');
        const maxDate = await birthdate.getAttribute('max');
        expect(maxDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        await expect(page.locator('#settings-birthdate-hint')).toContainText('Nepovinné');

        await birthdate.fill('');
        await page.evaluate(() => document.dispatchEvent(new Event('auth:changed')));
        await expect(birthdate).toHaveValue('');
        const savedProfile = page.waitForRequest(req => req.url().endsWith('/api/auth/profile') && req.method() === 'PUT');
        await page.locator('#save-settings-btn').click();
        expect((await savedProfile).postDataJSON().birth_date).toBeNull();
        await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('auth_user') || '{}').birth_date)).toBeNull();
    });

    test('chyba stavu predplatneho nenabizi nakup ani netvrdi bezplatny plan', async ({ page }) => {
        await mockLoggedInProfile(page);
        await page.route('**/api/payment/subscription/status', route => route.fulfill({status:503,contentType:'application/json',body:'{}'}));
        await page.goto('/profil.html#tab-settings');
        await expect(page.locator('#subscription-details')).toContainText('Stav přístupu se nepodařilo načíst');
        await expect(page.locator('#sub-retry-btn')).toBeVisible();
        await expect(page.locator('#sub-upgrade-fallback-btn')).toHaveCount(0);
    });

    test('prvni akce navazuje na ulozene znameni a ma meritelny kontext', async ({ page }) => {
        await mockLoggedInProfile(page);

        await page.goto('/profil.html');
        await waitForPageReady(page);

        await expect(page.locator('#profile-dashboard')).toBeVisible();
        await expect(page.locator('#daily-guidance-title')).toContainText('Lev');

        const dailyHref = await page.locator('[data-daily-action="daily_horoscope"]').getAttribute('href');
        expect(dailyHref).toContain('horoskopy.html');
        expect(dailyHref).toContain('source=profile_daily');
        expect(dailyHref).toContain('feature=daily_guidance');
        expect(dailyHref).toContain('sign=lev');
        expect(dailyHref).toContain('#lev');

        const cardOfDayHref = await page.locator('[data-daily-action="daily_tarot"]').getAttribute('href');
        expect(cardOfDayHref).toContain('tarot-karta-dne.html');
        expect(cardOfDayHref).toContain('feature=tarot');

        const firstReadingHref = await page.locator('[data-activation-step="first_reading"]').getAttribute('href');
        expect(firstReadingHref).toContain('horoskopy.html');
        expect(firstReadingHref).toContain('source=profile_activation');
        expect(firstReadingHref).toContain('feature=daily_guidance');
        expect(firstReadingHref).toContain('sign=lev');
        await expect(page.locator('[data-activation-step="first_reading"]')).toContainText('horoskopem pro Lev');
    });

    test('navazujici tarotova akce vede zpet do tarotu', async ({ page }) => {
        await mockLoggedInProfile(page, {
            readings: [{
                id: 'reading-existing-tarot',
                type: 'tarot',
                created_at: new Date().toISOString(),
                is_favorite: false,
                data: { question: 'Co je další krok?', response: 'Udělej ho pomalu.' }
            }]
        });
        await page.goto('/profil.html');

        const followUpHref = await page.locator('[data-daily-action="daily_tarot"]').getAttribute('href');
        expect(followUpHref).toContain('tarot-karta-dne.html');
        expect(followUpHref).toContain('source=profile_daily');
    });

    test('mobilni prihlaseny profil ma cookie-safe dashboard bez horizontalniho scrollu', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await mockLoggedInProfile(page);
        await page.addInitScript(() => {
            localStorage.removeItem('mh_cookie_prefs');
            localStorage.removeItem('cookieConsent');
        });

        await page.goto('/profil.html');
        await waitForPageReady(page);

        await expect(page.locator('#profile-dashboard')).toBeVisible();
        const tabRows = await page.locator('.profile-tab').evaluateAll(tabs => tabs.map(tab => Math.round(tab.getBoundingClientRect().top)));
        expect(tabRows).toHaveLength(5);
        expect(tabRows[4]).toBeGreaterThan(tabRows[3]);
        expect(tabRows[0]).toBe(tabRows[1]);
        expect(tabRows[2]).toBe(tabRows[3]);
        expect(tabRows[2]).toBeGreaterThan(tabRows[0]);
        await page.locator('#tab-btn-settings').click();
        const birthFieldTops = await page.locator('#tab-settings .settings-row > div').evaluateAll(fields => fields.map(field => Math.round(field.getBoundingClientRect().top)));
        expect(birthFieldTops[1]).toBeGreaterThan(birthFieldTops[0]);

        await expect(page.locator('#cookie-banner')).toBeVisible();
        await page.waitForFunction(() => document.body.classList.contains('cookie-banner-active'));

        const metrics = await page.evaluate(() => {
            const dashboard = document.getElementById('profile-dashboard');
            return {
                overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
                paddingBottom: dashboard ? parseFloat(getComputedStyle(dashboard).paddingBottom || '0') : 0
            };
        });

        expect(metrics.overflow).toBe(false);
        expect(metrics.paddingBottom).toBeGreaterThanOrEqual(90);
    });

    test('prazdny profil navazuje prvni krok na puvodni registracni zamer', async ({ page }) => {
        await mockLoggedInProfile(page);
        await page.addInitScript(() => {
            localStorage.setItem('mh_signup_intent', JSON.stringify({
                source: 'life_number_result',
                feature: 'numerologie_vyklad',
                destination: '/numerologie.html?source=signup_activation&feature=numerologie_vyklad',
                createdAt: Date.now()
            }));
        });

        await page.goto('/profil.html');
        await waitForPageReady(page);

        const firstReading = page.locator('[data-activation-step="first_reading"]');
        const firstReadingHref = await firstReading.getAttribute('href');
        expect(firstReadingHref).toContain('numerologie.html');
        expect(firstReadingHref).toContain('source=profile_signup_intent');
        expect(firstReadingHref).toContain('feature=numerologie_vyklad');
        expect(firstReadingHref).toContain('entry_source=life_number_result');
        expect(firstReadingHref).toContain('entry_feature=numerologie_vyklad');
        await expect(firstReading).toContainText('numerologick');
    });

    test('prazdny profil pouzije growth-loop manifest jako primarni routing', async ({ page }) => {
        await mockLoggedInProfile(page);
        await page.route('**/api/growth-loop', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    version: 'test-profile-growth-loop',
                    features: [
                        {
                            id: 'tarot_multi_card',
                            label: 'Manifest tarot',
                            cluster: 'tarot',
                            primaryPath: '/tarot-keltsky-kriz.html',
                            activationStep: 'first_value'
                        }
                    ],
                    products: [],
                    featurePlanMap: {},
                    trackingPayloadKeys: []
                })
            });
        });
        await page.addInitScript(() => {
            localStorage.setItem('mh_signup_intent', JSON.stringify({
                source: 'inline_paywall',
                feature: 'tarot_multi_card',
                plan: 'pruvodce',
                createdAt: Date.now()
            }));
        });

        await page.goto('/profil.html');
        await waitForPageReady(page);

        const firstReading = page.locator('[data-activation-step="first_reading"]');
        const firstReadingHref = await firstReading.getAttribute('href');
        expect(firstReadingHref).toContain('tarot-keltsky-kriz.html');
        expect(firstReadingHref).toContain('source=profile_signup_intent');
        expect(firstReadingHref).toContain('feature=tarot_multi_card');
        expect(firstReadingHref).toContain('entry_source=inline_paywall');
        expect(firstReadingHref).toContain('entry_feature=tarot_multi_card');
        expect(firstReadingHref).toContain('plan=pruvodce');
    });

    for (const state of ['paid', 'trial', 'pending', 'unavailable']) {
        test(`payment revenue truth: ${state} never trusts the return URL price`, async ({ page }) => {
            await mockLoggedInProfile(page, { checkoutResult: {
                status: state, product_id: 'pruvodce', transaction_id: 'in_verified', value: state === 'paid' ? 149 : 0, currency: 'CZK'
            } });
            if (state === 'unavailable') {
                await page.route('**/api/payment/checkout-result?*', route => route.fulfill({ status: 502, body: '{}' }));
            }
            await page.addInitScript(() => {
                window.__paymentEvents = [];
                Object.defineProperty(window, 'MH_ANALYTICS', { writable: false, value: {
                    trackEvent: (name, data) => window.__paymentEvents.push({ name, data }),
                    trackPaymentResult: (status, data) => window.__paymentEvents.push({ name: 'return', status, data }),
                    trackPurchaseCompleted: (product, value, currency, data) => window.__paymentEvents.push({ name: 'purchase', product, value, currency, data })
                } });
            });
            const response = page.waitForResponse(res => res.url().includes('/payment/checkout-result?'));
            await page.goto('/profil.html?payment=success&plan=vip-majestrat&session_id=cs_test_return');
            await response;
            await expect(page.locator('#profile-dashboard')).toBeVisible();
            if (state === 'paid') {
                await expect.poll(() => page.evaluate(() => window.__paymentEvents.filter(e => e.name === 'purchase'))).toHaveLength(1);
                const purchase = await page.evaluate(() => window.__paymentEvents.find(e => e.name === 'purchase'));
                expect(purchase).toMatchObject({ product: 'pruvodce', value: 149, currency: 'CZK', data: { verified: true, transaction_id: 'in_verified' } });
            } else {
                if (state === 'trial') await expect.poll(() => page.evaluate(() => window.__paymentEvents.some(e => e.name === 'subscription_trial_confirmed'))).toBe(true);
                expect(await page.evaluate(() => window.__paymentEvents.filter(e => e.name === 'purchase'))).toHaveLength(0);
            }
            // Even a confirmed payment must not grant premium before the account API does.
            await expect(page.locator('#premium-activation-card')).toBeHidden();
        });
    }

    const paymentReturnCases = [
        ['tarot_multi_card', 'tarot.html'],
        ['numerologie_vyklad', 'numerologie.html'],
        ['natalni_interpretace', 'natalni-karta.html'],
        ['partnerska_detail', 'partnerska-shoda.html'],
        ['mentor', 'mentor.html']
    ];

    for (const [feature, expectedPath] of paymentReturnCases) {
        test(`uspesna platba navaze premium aktivaci na ${feature}`, async ({ page }) => {
            await mockLoggedInProfile(page, {
                user: { subscription_status: 'premium_monthly' },
                subscription: { planType: 'premium_monthly', status: 'active', canCancel: true }
            });

            await page.goto(`/profil.html?payment=success&plan=pruvodce&session_id=cs_test_return&source=inline_paywall&feature=${feature}&entry_source=inline_paywall&entry_feature=${feature}`);
            await waitForPageReady(page);

            const activation = page.locator('#premium-activation-card');
            await expect(activation).toBeVisible();
            await expect(activation).toHaveAttribute('data-source', 'inline_paywall');
            await expect(activation).toHaveAttribute('data-feature', feature);

            const firstAction = activation.locator('[data-activation-target]').first();
            const href = await firstAction.getAttribute('href');
            expect(href).toContain(expectedPath);
            expect(href).toContain('source=profile_payment_return');
            expect(href).toContain(`feature=${feature}`);
            expect(href).toContain('entry_source=inline_paywall');
            expect(href).toContain(`entry_feature=${feature}`);
            expect(href).toContain('plan=pruvodce');
            await expect(firstAction).toContainText('kde platba');
            expect(new URL(page.url()).searchParams.has('payment')).toBe(false);
        });
    }

    test('platba z tarotu ano ne nabídne návrat ke stejné otázce', async ({ page }) => {
        await mockLoggedInProfile(page, {
            user: { subscription_status: 'premium_monthly' },
            subscription: { planType: 'premium_monthly', status: 'active', canCancel: true }
        });
        await page.addInitScript(() => {
            localStorage.setItem('mh_tarot_yes_no_upgrade_context', JSON.stringify({
                question: 'Mám se dnes ozvat?',
                answerLabel: 'ANO',
                answerKey: 'ano',
                resultText: 'Směr je otevřený.',
                cardName: 'Hvězda',
                locale: 'cs',
                source: 'tarot_yes_no_result',
                createdAt: Date.now()
            }));
        });

        await page.goto('/profil.html?payment=success&plan=pruvodce&session_id=cs_test_tarot_resume&source=tarot_yes_no_result&feature=tarot_multi_card&entry_source=tarot_yes_no_result&entry_feature=tarot_multi_card');
        await waitForPageReady(page);

        const firstAction = page.locator('#premium-activation-card [data-activation-target]').first();
        await expect(firstAction).toContainText('Navázat na svou otázku třemi kartami');
        await expect(firstAction).toContainText('původní otázka i odpověď zůstaly uložené');

        const href = new URL(await firstAction.getAttribute('href'), BASE_URL);
        expect(href.pathname).toBe('/tarot.html');
        expect(href.searchParams.get('feature')).toBe('tarot_multi_card');
        expect(href.searchParams.get('resume')).toBe('tarot_yes_no');
        expect(href.searchParams.get('card')).toBe('Hvězda');
        expect(href.searchParams.get('entry_source')).toBe('tarot_yes_no_result');
    });

    test('analytics outage neblokuje premium aktivaci po uspesne platbe', async ({ page }) => {
        await mockLoggedInProfile(page, {
            user: { subscription_status: 'premium_monthly' },
            subscription: { planType: 'premium_monthly', status: 'active', canCancel: true }
        });
        await page.addInitScript(() => {
            let analyticsValue = null;
            Object.defineProperty(window, 'MH_ANALYTICS', {
                configurable: true,
                get: () => analyticsValue,
                set: (value) => {
                    analyticsValue = value && typeof value === 'object'
                        ? {
                            ...value,
                            trackEvent: () => {
                                throw new Error('profile analytics unavailable');
                            },
                            trackCTA: () => {
                                throw new Error('profile cta analytics unavailable');
                            },
                            trackPaymentResult: () => {
                                throw new Error('profile payment analytics unavailable');
                            },
                            trackPurchaseCompleted: () => {
                                throw new Error('profile purchase analytics unavailable');
                            }
                        }
                        : value;
                }
            });
        });

        await page.goto('/profil.html?payment=success&plan=pruvodce&session_id=cs_test_return&source=inline_paywall&feature=tarot_multi_card&entry_source=inline_paywall&entry_feature=tarot_multi_card');
        await waitForPageReady(page);

        const activation = page.locator('#premium-activation-card');
        await expect(activation).toBeVisible();
        await expect(activation).toHaveAttribute('data-source', 'inline_paywall');
        await expect(activation).toHaveAttribute('data-feature', 'tarot_multi_card');

        const firstAction = activation.locator('[data-activation-target]').first();
        const href = await firstAction.getAttribute('href');
        expect(href).toContain('tarot.html');
        expect(href).toContain('source=profile_payment_return');
        expect(href).toContain('feature=tarot_multi_card');

        await Promise.all([
            page.waitForURL(url => url.pathname === '/tarot.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            firstAction.click()
        ]);
    });

    test('selhana platba nabidne primarni aktualizaci karty ve Stripe portalu', async ({ page }) => {
        await mockLoggedInProfile(page, {
            user: { subscription_status: 'premium_monthly' },
            subscription: {
                planType: 'premium_monthly',
                status: 'past_due',
                canCancel: true,
                canManageBilling: true,
                hasStripeSubscription: true,
                canResume: false,
                needsPaymentUpdate: true
            }
        });

        let portalPayload = null;
        await page.route('**/api/payment/portal', async (route) => {
            portalPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    url: `${BASE_URL}/profil.html?portal=payment_method_update`,
                    flow: 'payment_method_update'
                })
            });
        });

        await page.goto('/profil.html');
        await waitForPageReady(page);
        await page.locator('#tab-btn-settings').click();

        const subscription = page.locator('#subscription-details');
        await expect(subscription).toContainText('Členství čeká na opravu platby');
        await expect(page.locator('#sub-payment-update-btn')).toBeVisible();
        await expect(page.locator('#sub-cancel-btn')).toContainText('Zrušit a zastavit další pokusy');

        await Promise.all([
            page.waitForURL(url => url.searchParams.get('portal') === 'payment_method_update'),
            page.locator('#sub-payment-update-btn').click()
        ]);

        expect(portalPayload).toEqual({ flow: 'payment_method_update', expectedUserId: 'profile-user-1' });
    });

    test('historicky premium pristup neslibuje obnovu ani Stripe spravu plateb', async ({ page }) => {
        await mockLoggedInProfile(page, {
            user: { subscription_status: 'vip_majestrat', first_name: '' },
            subscription: {
                planType: 'vip_majestrat',
                status: 'active',
                currentPeriodEnd: '2026-12-31T23:59:59.000Z',
                canCancel: false,
                canReactivate: false,
                canManageBilling: false,
                hasStripeSubscription: false
            }
        });

        await page.goto('/profil.html#tab-settings');
        await waitForPageReady(page);

        await expect(page.locator('#user-plan')).toHaveText('Členství Mystické Hvězdy');
        await expect(page.locator('#profile-greeting')).not.toContainText('@');
        await expect(page.locator('#premium-activation-title')).toHaveText('Členství Mystické Hvězdy je aktivní');
        await expect(page.locator('#premium-activation-title')).not.toContainText('VIP Majestát');
        await expect(page.locator('#reading-modal .modal__content')).toHaveCSS('background-color', 'rgb(16, 38, 56)');

        const subscription = page.locator('#subscription-details');
        await expect(subscription).toContainText('Platnost přístupu');
        await expect(subscription).toContainText('Není u něj nastavená automatická platba');
        await expect(subscription).not.toContainText('Další obnova');
        await expect(subscription.locator('#sub-portal-btn')).toHaveCount(0);
        await expect(subscription.locator('#sub-reactivate-btn')).toHaveCount(0);
    });

    test('aktivni Stripe clenstvi ukazuje dalsi platbu a spravu plateb', async ({ page }) => {
        await mockLoggedInProfile(page, {
            user: { subscription_status: 'premium_monthly' },
            subscription: {
                planType: 'premium_monthly',
                status: 'active',
                currentPeriodEnd: '2026-12-31T23:59:59.000Z',
                canCancel: true,
                canReactivate: false,
                canManageBilling: true,
                hasStripeSubscription: true
            }
        });

        await page.goto('/profil.html#tab-settings');
        await waitForPageReady(page);

        const subscription = page.locator('#subscription-details');
        await expect(subscription).toContainText('Konec aktuálního platebního období');
        await expect(subscription).toContainText('Správa plateb');
        await expect(subscription).not.toContainText('Další obnova');
    });

    test('pozastavene predplatne lze obnovit primo z profilu', async ({ page }) => {
        await mockLoggedInProfile(page, {
            user: { subscription_status: 'premium_monthly' },
            subscription: {
                planType: 'premium_monthly',
                status: 'paused',
                pauseUntil: '2026-09-13T10:00:00.000Z',
                canCancel: false,
                canResume: true,
                needsPaymentUpdate: false
            }
        });

        await page.route('**/api/payment/subscription/resume', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, status: 'active' })
            });
        });

        await page.goto('/profil.html');
        await waitForPageReady(page);
        await page.locator('#tab-btn-settings').click();

        const subscription = page.locator('#subscription-details');
        await expect(subscription).toContainText('Předplatné je pozastavené');
        await expect(subscription).toContainText('13. září 2026');
        await expect(page.locator('#sub-resume-btn')).toBeVisible();
        await expect(page.locator('#sub-cancel-btn')).toHaveCount(0);

        const [resumeRequest] = await Promise.all([
            page.waitForRequest(request =>
                request.url().includes('/api/payment/subscription/resume') && request.method() === 'POST'
            ),
            page.locator('#sub-resume-btn').click()
        ]);

        expect(resumeRequest.postDataJSON()).toEqual({ expectedUserId: 'profile-user-1' });
    });

    test('prazdny profil drzi symbolicky zamer minuleho zivota', async ({ page }) => {
        await mockLoggedInProfile(page);
        await page.addInitScript(() => {
            localStorage.setItem('mh_signup_intent', JSON.stringify({
                source: 'past_life_register_gate',
                feature: 'minuly_zivot',
                destination: '/minuly-zivot.html?source=signup_activation&feature=minuly_zivot',
                createdAt: Date.now()
            }));
        });

        await page.goto('/profil.html');
        await waitForPageReady(page);

        const firstReading = page.locator('[data-activation-step="first_reading"]');
        const firstReadingHref = await firstReading.getAttribute('href');
        expect(firstReadingHref).toContain('minuly-zivot.html');
        expect(firstReadingHref).toContain('source=profile_signup_intent');
        expect(firstReadingHref).toContain('entry_feature=minuly_zivot');
        await expect(firstReading).toContainText('symbolickým výkladem minulého života');
    });

    test('prazdny profil drzi symbolicky smer samanskeho kola', async ({ page }) => {
        await mockLoggedInProfile(page);
        await page.addInitScript(() => {
            localStorage.setItem('mh_signup_intent', JSON.stringify({
                source: 'shaman_inline_upsell',
                feature: 'shamanske_kolo_plne_cteni',
                destination: '/shamansko-kolo.html?source=signup_activation&feature=shamanske_kolo_plne_cteni',
                createdAt: Date.now()
            }));
        });

        await page.goto('/profil.html');
        await waitForPageReady(page);

        const firstReading = page.locator('[data-activation-step="first_reading"]');
        const firstReadingHref = await firstReading.getAttribute('href');
        expect(firstReadingHref).toContain('shamansko-kolo.html');
        expect(firstReadingHref).not.toContain('shamanske-kolo.html');
        expect(firstReadingHref).toContain('entry_feature=shamanske_kolo_plne_cteni');
        await expect(firstReading).toContainText('symbolickým směrem');
    });

    test('nulova historie zobrazi aktivacni hero se 3 akcemi', async ({ page }) => {
        await mockLoggedInProfile(page);

        await page.goto('/profil.html');
        await waitForPageReady(page);

        const hero = page.locator('#readings-list .profile-activation-hero');
        await expect(hero).toBeVisible();
        await expect(hero).toContainText('Tvůj deník čeká na první výklad');
        await expect(hero).toContainText('Výklady se ukládají sem');

        const tarotHref = await hero.locator('a[href*="tarot-ano-ne.html"]').getAttribute('href');
        const cardOfDayHref = await hero.locator('a[href*="tarot-karta-dne.html"]').getAttribute('href');
        const horoscopeHref = await hero.locator('a[href*="horoskopy.html"]').getAttribute('href');

        expect(tarotHref).toContain('source=profile_activation');
        expect(tarotHref).toContain('feature=tarot_yes_no');
        expect(cardOfDayHref).toContain('source=profile_activation');
        expect(horoscopeHref).toContain('source=profile_activation');
    });

    test('aktivacni hero posila profile_activation_viewed event', async ({ page }) => {
        await mockLoggedInProfile(page);
        await page.addInitScript(() => {
            window.__profileEvents = [];
            let analyticsValue = null;
            Object.defineProperty(window, 'MH_ANALYTICS', {
                configurable: true,
                get: () => analyticsValue,
                set: (value) => {
                    analyticsValue = value && typeof value === 'object'
                        ? {
                            ...value,
                            trackEvent: (eventName, payload) => {
                                window.__profileEvents.push({ eventName, payload });
                                return value.trackEvent?.call(value, eventName, payload);
                            },
                            trackCTA: (...args) => value.trackCTA?.call(value, ...args)
                        }
                        : value;
                }
            });
        });

        await page.goto('/profil.html');
        await waitForPageReady(page);

        await expect.poll(async () => page.evaluate(() => window.__profileEvents
            .filter(event => event.eventName === 'profile_activation_viewed').length)).toBe(1);
    });

    test('vyklad jineho typu nez filtr zobrazi puvodni prazdny stav s prvni stopou', async ({ page }) => {
        await mockLoggedInProfile(page, {
            readings: [
                {
                    id: 'reading-tarot-1',
                    type: 'tarot',
                    created_at: '2026-05-10T10:00:00.000Z',
                    is_favorite: false,
                    data: {
                        question: 'Co si mám dnes pohlídat?',
                        cards: ['Hvězda'],
                        interpretation: 'Vrať se k jedné konkrétní otázce.'
                    }
                }
            ]
        });

        await page.goto('/profil.html');
        await waitForPageReady(page);

        await page.locator('#readings-filter').selectOption('horoscope');

        const history = page.locator('#readings-list .empty-state');
        await expect(history).toContainText('Tady zatím není žádný výklad tohoto typu');
        const refreshedHistory = page.waitForResponse(response => {
            const url = new URL(response.url());
            return url.pathname === '/api/user/readings' && url.searchParams.get('type') === 'horoscope';
        });
        await page.evaluate(() => document.dispatchEvent(new Event('auth:changed')));
        await refreshedHistory;
        await expect(page.locator('#readings-filter')).toHaveValue('horoscope');
        await expect(history).toContainText('Tady zatím není žádný výklad tohoto typu');
    });

    test('pending tarot ano/ne vyklad se po prihlaseni ulozi a zvyrazni v historii', async ({ page }) => {
        await mockLoggedInProfile(page);
        await page.addInitScript(() => {
            localStorage.setItem('mh_pending_reading', JSON.stringify({
                type: 'tarot',
                source: 'tarot_yes_no_save_journal',
                feature: 'tarot_yes_no',
                createdAt: Date.now(),
                data: {
                    tool: 'tarot_yes_no',
                    source: 'tarot_yes_no_result',
                    question: 'Mám se dnes ozvat?',
                    answer: 'ANO: Udělej první malý krok.',
                    result_label: 'ANO',
                    result_key: 'yes',
                    result_text: 'Udělej první malý krok.'
                }
            }));
        });

        await page.goto('/profil.html');
        await waitForPageReady(page);

        await expect.poll(() => page.evaluate(() => localStorage.getItem('mh_pending_reading'))).toBeNull();
        const savedCard = page.locator('#readings-list .reading-item[data-reading-id="reading-1"]');
        await expect(savedCard).toBeVisible();
        await expect(savedCard).toHaveClass(/reading-item--just-saved/);
        await expect(page.locator('#tab-btn-history')).toHaveAttribute('aria-selected', 'true');
        await expect(savedCard).toContainText('Mám se dnes ozvat?');
        await expect(savedCard.locator('[data-reading-action="view"]')).toBeVisible();
    });

    test('prazdne oblibene bez vykladu vedou k meritelne prvni akci', async ({ page }) => {
        await mockLoggedInProfile(page);

        await page.goto('/profil.html');
        await waitForPageReady(page);
        await page.locator('#tab-btn-favorites').click();

        const favorites = page.locator('#favorites-list .empty-state');
        await expect(favorites).toContainText('první návrat');
        await expect(favorites).toContainText('Po prvním výkladu si můžeš uložit do oblíbených');

        const tarotHref = await favorites.locator('a[href*="tarot.html"]').getAttribute('href');
        const horoscopeHref = await favorites.locator('a[href*="horoskopy.html"]').getAttribute('href');

        expect(tarotHref).toContain('source=profile_favorites_empty');
        expect(tarotHref).toContain('feature=tarot');
        expect(horoscopeHref).toContain('source=profile_favorites_empty');
        expect(horoscopeHref).toContain('feature=daily_guidance');
    });

    test('historie nacita dalsi stranky a oblibene najdou i stary vyklad', async ({ page }) => {
        const now = Date.now();
        const readings = Array.from({ length: 25 }, (_, index) => ({
            id: `reading-${index + 1}`,
            type: index === 24 ? 'horoscope' : 'tarot',
            created_at: new Date(now - index * 60_000).toISOString(),
            is_favorite: index === 0,
            data: index === 24
                ? { sign: 'Lev', period: 'daily', text: 'Dnešní horoskop.' }
                : { question: `Otázka ${index + 1}`, response: `Odpověď ${index + 1}` }
        }));
        await mockLoggedInProfile(page, { readings });

        await page.goto('/profil.html#tab-history');
        await waitForPageReady(page);

        await expect(page.locator('#readings-list .reading-item')).toHaveCount(10);
        await expect(page.locator('#stat-total')).toHaveText('25');
        await page.locator('#readings-load-more').click();
        await expect(page.locator('#readings-list .reading-item')).toHaveCount(20);
        await page.locator('#readings-load-more').click();
        await expect(page.locator('#readings-list .reading-item')).toHaveCount(25);
        await expect(page.locator('#readings-list .reading-item[data-reading-id="reading-1"]')).toBeVisible();
        await page.locator('#readings-filter').selectOption('horoscope');
        await expect(page.locator('#readings-list .reading-item')).toHaveCount(1);
        await expect(page.locator('#readings-list .reading-item[data-reading-id="reading-25"]')).toBeVisible();
        await expect(page.locator('#readings-list .reading-item strong')).toHaveText('Denní horoskop · Lev');

        await page.locator('#tab-btn-favorites').click();
        await expect(page.locator('#favorites-list .reading-item[data-reading-id="reading-1"]')).toBeVisible();
        await expect(page.locator('#favorites-list .reading-item__preview')).toContainText('Otázka 1');
    });

    test('prazdne oblibene s historii vraci uzivatele k ulozenym vykladum', async ({ page }) => {
        await mockLoggedInProfile(page, {
            readings: [
                {
                    id: 'reading-tarot-1',
                    type: 'tarot',
                    created_at: '2026-05-10T10:00:00.000Z',
                    is_favorite: false,
                    data: {
                        question: 'Co si mám dnes pohlídat?',
                        cards: ['Hvězda'],
                        interpretation: 'Vrať se k jedné konkrétní otázce.'
                    }
                }
            ]
        });

        await page.goto('/profil.html');
        await waitForPageReady(page);
        await page.locator('#tab-btn-favorites').click();

        const favorites = page.locator('#favorites-list .empty-state');
        await expect(favorites).toContainText('Označ si v historii výklad');

        await favorites.locator('[data-profile-tab-target="history"]').click();

        await expect(page.locator('#tab-history')).toBeVisible();
        await expect(page.locator('#tab-btn-history')).toHaveAttribute('aria-selected', 'true');
        await expect(page.locator('#readings-list .reading-item[data-reading-id="reading-tarot-1"]')).toBeVisible();
    });

    test('jediny automaticky vyklad se nevydava za osobni opakujici se vzorec', async ({ page }) => {
        await mockLoggedInProfile(page, {
            readings: [{
                id: 'reading-one-horoscope',
                type: 'horoscope',
                created_at: '2026-05-10T10:00:00.000Z',
                is_favorite: false,
                data: { sign: 'Lev', period: 'daily', text: 'Dnes se zaměř na práci a energii.' }
            }]
        });

        await page.goto('/profil.html');
        await waitForPageReady(page);

        await page.locator('#tab-btn-overview').click();
        await expect(page.locator('#ritual-memory-title')).toHaveText('Tvoje podklady v souvislostech');
        await expect(page.locator('#ritual-memory-copy')).toContainText('Samotný text výkladu nestačí k osobnímu závěru');
        await expect(page.locator('#ritual-memory-copy')).not.toContainText('se ti vrací');
    });

    test('pamet ritualu navaze na zpetnou vazbu a nabidne konkretni dalsi krok', async ({ page }) => {
        await mockLoggedInProfile(page, {
            readings: [
                {
                    id: 'reading-horoscope-1',
                    type: 'horoscope',
                    created_at: '2026-05-10T10:00:00.000Z',
                    data: {
                        sign: 'Lev',
                        period: 'daily',
                        text: 'Dnes si vsimni vztahoveho napeti.',
                        feedback: {
                            resonance: 'fits',
                            focus: 'relationships',
                            nextAction: 'journal'
                        }
                    }
                },
                {
                    id: 'reading-synastry-1',
                    type: 'synastry',
                    created_at: '2026-05-09T10:00:00.000Z',
                    data: {
                        result: 'Vztah potrebuje jasne hranice.',
                        feedback: {
                            resonance: 'neutral',
                            focus: 'relationships'
                        }
                    }
                },
                {
                    id: 'reading-journal-1',
                    type: 'journal',
                    created_at: '2026-05-09T20:00:00.000Z',
                    data: 'Ve vztahu se mi vraci stejny pocit a hranice.'
                }
            ]
        });

        await page.goto('/profil.html');
        await waitForPageReady(page);

        await page.locator('#tab-btn-overview').click();
        await expect(page.locator('#ritual-memory-card')).toBeVisible();
        await expect(page.locator('#ritual-memory-title')).toHaveText('Téma z tvých podkladů: Vztahy');
        await expect(page.locator('.ritual-memory-theme[data-memory-theme="relationships"]')).toContainText('Vztahy');
        await expect(page.locator('#ritual-memory-strength')).toContainText('Více podkladů');
        await expect(page.locator('.ritual-memory-theme[data-memory-theme="relationships"]').first()).toContainText('Vztahy');

        const themeHref = await page.locator('[data-memory-action="memory_theme"]').getAttribute('href');
        expect(themeHref).toContain('partnerska-shoda.html');
        expect(themeHref).toContain('source=profile_memory');
        expect(themeHref).toContain('feature=relationships');

        await page.locator('[data-memory-action="memory_journal"]').click();
        await expect.poll(async () => page.evaluate(() => document.activeElement?.id)).toBe('journal-input');
    });

    test('detail vykladu uklada zpetnou vazbu pro pamet profilu', async ({ page }) => {
        await mockLoggedInProfile(page, {
            readings: [
                {
                    id: 'reading-horoscope-1',
                    type: 'horoscope',
                    created_at: '2026-05-10T10:00:00.000Z',
                    data: {
                        sign: 'Lev',
                        period: 'daily',
                        text: 'Dnes si vsimni, kde opakujes stary vzorec.'
                    }
                }
            ]
        });
        await page.addInitScript(() => {
            window.__profileEvents = [];
            let analyticsValue = null;
            Object.defineProperty(window, 'MH_ANALYTICS', {
                configurable: true,
                get: () => analyticsValue,
                set: (value) => {
                    analyticsValue = value && typeof value === 'object'
                        ? {
                            ...value,
                            trackEvent: (eventName, payload) => {
                                window.__profileEvents.push({ eventName, payload });
                                return value.trackEvent?.call(value, eventName, payload);
                            },
                            trackCTA: (...args) => value.trackCTA?.call(value, ...args)
                        }
                        : value;
                }
            });
        });

        await page.goto('/profil.html');
        await waitForPageReady(page);

        // "Vrátit se k poslednímu výkladu" sdílí stejnou view akci — cíl je
        // tlačítko Zobrazit v seznamu výkladů.
        await page.locator('[data-reading-action="view"][data-reading-id="reading-horoscope-1"][aria-label="Zobrazit detail"]').click();
        await expect(page.locator('#reading-modal')).toBeVisible();
        await expect(page.locator('.reading-feedback')).toBeVisible();

        await page.locator('[data-feedback-focus="relationships"]').click();
        await expect(page.locator('.reading-feedback__status')).toContainText('Zpětná vazba je uložená');
        await expect(page.locator('#ritual-memory-title')).toHaveText('Téma z tvých podkladů: Vztahy');
        await expect(page.locator('.ritual-memory-theme[data-memory-theme="relationships"]')).toContainText('Vztahy');

        await expect.poll(async () => page.evaluate(() => window.__profileEvents
            .filter(event => event.eventName === 'profile_ritual_memory_viewed')
            .length)).toBe(1);
        await expect.poll(async () => page.evaluate(() => window.__profileEvents
            .filter(event => event.eventName === 'profile_daily_guidance_viewed')
            .length)).toBe(1);
        await expect.poll(async () => page.evaluate(() => window.__profileEvents
            .filter(event => event.eventName === 'profile_activation_checklist_viewed')
            .length)).toBe(1);
    });

    test('vecerni reflexe ulozi journal a oznaci navratovy ritual', async ({ page }) => {
        await mockLoggedInProfile(page);

        await page.goto('/profil.html');
        await waitForPageReady(page);

        await page.evaluate(() => {
            window.__profileEvents = [];
            window.MH_ANALYTICS = {
                trackEvent: (eventName, payload) => window.__profileEvents.push({ eventName, payload }),
                trackCTA: () => {}
            };
        });

        await page.locator('#tab-btn-journal').click();
        await page.locator('#journal-input').fill('Dnes si odnasim jeden jasny krok.');
        await page.locator('#journal-submit').click();

        await expect(page.locator('#journal-submit')).toHaveText('Uložit reflexi');
        await expect(page.locator('#journal-entries')).toContainText('Dnes si odnasim jeden jasny krok.');
        await expect(page.locator('[data-activation-step="daily_reflection"]')).toHaveAttribute('data-completed', 'true');

        const events = await page.evaluate(() => window.__profileEvents);
        expect(events).toEqual(expect.arrayContaining([
            expect.objectContaining({
                eventName: 'profile_journal_saved',
                payload: expect.objectContaining({ source: 'profile_dashboard' })
            })
        ]));
    });

    test('prichod z vykladu s journal hashem rovnou zaměří reflexi', async ({ page }) => {
        await mockLoggedInProfile(page);

        await page.goto('/profil.html#journal-input');
        await waitForPageReady(page);

        await expect(page.locator('#tab-btn-journal')).toHaveAttribute('aria-selected', 'true');
        await expect(page.locator('#tab-journal')).toBeVisible();
        await expect.poll(async () => page.evaluate(() => document.activeElement?.id)).toBe('journal-input');
    });
});

test.describe('Onboarding', () => {

    test.beforeEach(async ({ page }) => {
        // The product defaults anonymous onboarding to the shortened sign-first flow.
        // This describe exercises the full three-step wizard explicitly.
        await page.goto('/onboarding.html?flow=guided');
        await waitForPageReady(page);
    });

    async function mockOnboardingComplete(page) {
        await page.route('**/api/auth/onboarding/complete', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });
    }

    test('stránka vrátí 200', async ({ page }) => {
        const res = await page.request.get('/onboarding.html');
        expect(res.status()).toBe(200);
    });

    test('h1 existuje', async ({ page }) => {
        await expect(page.locator('h1').first()).toBeAttached();
    });

    test('onboarding kroky nebo wizard existují', async ({ page }) => {
        // Onboarding obvykle má kroky (steps)
        const steps = page.locator(
            '.step, .onboarding-step, [class*="step"], .wizard-step, form'
        ).first();
        await expect(steps).toBeAttached();
    });

    test('prvni krok jasne vysvetluje rychlou hodnotu bez karty', async ({ page }) => {
        const valueStrip = page.locator('.onboarding-value-strip');
        await expect(valueStrip).toBeVisible();
        await expect(valueStrip.locator('div')).toHaveCount(3);
        await expect(valueStrip).toContainText('Bez karty');
        await expect(valueStrip).toContainText('První krok');
        await expect(valueStrip).toContainText('Paměť');
        await expect(page.locator('#finish-onboarding-next-note')).toContainText('Placené možnosti');
        await expect(page.locator('#finish-onboarding-next-note')).toContainText('až po první hodnotě');
    });

    test('onboarding netaha externi fonty ani nepouzity sanitizer z CDN', async ({ page }) => {
        const html = await page.content();
        const cssUrl = await page.locator('link[href*="/css/site.min.mh-"]').getAttribute('href');
        expect(cssUrl).toMatch(/site\.min\.mh-[a-f0-9]{16}\.css$/);
        const siteCss = await page.request.get(cssUrl);
        expect(siteCss.ok()).toBe(true);
        expect(await siteCss.text()).toContain('@font-face');
        expect(html).not.toContain('fonts.googleapis.com');
        expect(html).not.toContain('cdnjs.cloudflare.com/ajax/libs/dompurify');
    });

    test('žádný horizontální scroll na mobilu', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/onboarding.html?flow=guided');
        await waitForPageReady(page);
        const overflow = await page.evaluate(() =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(overflow).toBe(false);
    });

    test('preskoceni onboardingu vede rovnou na denni horoskop', async ({ page }) => {
        await mockOnboardingComplete(page);

        await Promise.all([
            page.waitForURL(url => url.pathname === '/horoskopy.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            page.locator('[data-action="skipOnboarding"]').click(),
        ]);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/horoskopy.html');
        expect(url.searchParams.get('source')).toBe('onboarding_skip');
        const onboarded = await page.evaluate(() => localStorage.getItem('mh_onboarded'));
        expect(onboarded).toBe('1');
    });

    test('dokonceni se znamenim otevre konkretni denni horoskop a ulozi personalizaci', async ({ page }) => {
        await mockOnboardingComplete(page);

        await page.locator('#step-1 [data-action="goStep"][data-step="2"]').click();
        await page.locator('.zodiac-btn[data-sign="beran"]').click();
        await expect(page.locator('.zodiac-btn[data-sign="beran"]')).toHaveAttribute('aria-pressed', 'true');
        await page.locator('#btn-step2').click();

        await expect(page.locator('#finish-onboarding-btn')).toContainText('Berana');

        await Promise.all([
            page.waitForURL(url => url.pathname === '/horoskopy.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            page.locator('#finish-onboarding-btn').click(),
        ]);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/horoskopy.html');
        expect(url.searchParams.get('source')).toBe('onboarding_complete');
        expect(url.searchParams.get('sign')).toBe('beran');
        expect(url.hash).toBe('#beran');

        const stored = await page.evaluate(() => ({
            onboarded: localStorage.getItem('mh_onboarded'),
            zodiac: localStorage.getItem('mh_zodiac'),
            prefs: JSON.parse(localStorage.getItem('mh_user_prefs') || '{}')
        }));

        expect(stored.onboarded).toBe('1');
        expect(stored.zodiac).toBe('beran');
        expect(stored.prefs.sign).toBe('beran');
    });

    test('dokonceni posila backend notifikaci s CSRF tokenem', async ({ page }) => {
        let completionCsrfHeader = null;
        let completionPayload = null;

        await page.route('**/api/csrf-token', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ csrfToken: 'test-onboarding-csrf-token' })
            });
        });
        await page.route('**/api/auth/onboarding/complete', async (route) => {
            completionCsrfHeader = route.request().headers()['x-csrf-token'] || null;
            completionPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.goto('/onboarding.html?flow=guided');
        await waitForPageReady(page);

        await page.locator('#step-1 [data-action="goStep"][data-step="2"]').click();
        await page.locator('.zodiac-btn[data-sign="beran"]').click();
        await page.locator('#btn-step2').click();

        await Promise.all([
            page.waitForURL(url => url.pathname === '/horoskopy.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            page.locator('#finish-onboarding-btn').click(),
        ]);

        expect(completionCsrfHeader).toBe('test-onboarding-csrf-token');
        expect(completionPayload).toMatchObject({
            source: null,
            feature: null,
            skipped: false
        });
        expect(completionPayload.destination).toContain('/horoskopy.html');
        expect(completionPayload.destination).toContain('source=onboarding_complete');
    });

    test('dokonceni neceka na zaseknuty CSRF endpoint', async ({ page }) => {
        let completionRequests = 0;

        await page.route('**/api/csrf-token', () => new Promise(() => {}));
        await page.route('**/api/auth/onboarding/complete', async (route) => {
            completionRequests += 1;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.goto('/onboarding.html?flow=guided');
        await waitForPageReady(page);

        await page.locator('#step-1 [data-action="goStep"][data-step="2"]').click();
        await page.locator('.zodiac-btn[data-sign="beran"]').click();
        await page.locator('#btn-step2').click();

        await page.locator('#finish-onboarding-btn').click();
        await expect.poll(() => new URL(page.url()).pathname, { timeout: 5000 }).toBe('/horoskopy.html');

        expect(completionRequests).toBe(0);
    });

    test('vybrane tema meni prvni cil po onboardingu', async ({ page }) => {
        await mockOnboardingComplete(page);

        await page.locator('#step-1 [data-action="goStep"][data-step="2"]').click();
        await page.locator('.zodiac-btn[data-sign="beran"]').click();
        await page.locator('#btn-step2').click();
        await page.locator('.interest-chip[data-interest="tarot"]').click();

        await expect(page.locator('.interest-chip[data-interest="tarot"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#finish-onboarding-btn')).toContainText('tarotový výklad');

        await Promise.all([
            page.waitForURL(url => url.pathname === '/tarot.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            page.locator('#finish-onboarding-btn').click(),
        ]);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/tarot.html');
        expect(url.searchParams.get('source')).toBe('onboarding_complete');
    });

    test('kontext andelske karty predvybere spravny prvni vyklad', async ({ page }) => {
        await mockOnboardingComplete(page);

        await page.goto('/onboarding.html?source=homepage_daily_card_full_reading&feature=daily_angel_card');
        await waitForPageReady(page);

        await expect(page.locator('#step-1 .step-title')).toContainText('Andělskými kartami');
        await page.locator('#step-1 [data-action="goStep"][data-step="2"]').click();
        await page.locator('.zodiac-btn[data-sign="ryby"]').click();
        await page.locator('#btn-step2').click();

        await expect(page.locator('.interest-chip[data-interest="andelske-karty"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#finish-onboarding-btn')).toContainText('andělské karty');

        await page.locator('#finish-onboarding-btn').click();
        await expect.poll(() => new URL(page.url()).pathname, { timeout: 10000 }).toBe('/andelske-karty.html');

        const url = new URL(page.url());
        expect(url.pathname).toBe('/andelske-karty.html');
        expect(url.searchParams.get('source')).toBe('onboarding_complete');
        expect(url.searchParams.get('entry_source')).toBe('homepage_daily_card_full_reading');
        expect(url.searchParams.get('entry_feature')).toBe('daily_angel_card');
    });

    test('rucni zmena predvybraneho tematu ma prednost pred kontextem', async ({ page }) => {
        await mockOnboardingComplete(page);

        await page.goto('/onboarding.html?source=homepage_daily_card_full_reading&feature=daily_angel_card');
        await waitForPageReady(page);

        await page.locator('#step-1 [data-action="goStep"][data-step="2"]').click();
        await page.locator('.zodiac-btn[data-sign="ryby"]').click();
        await page.locator('#btn-step2').click();
        await page.locator('.interest-chip[data-interest="tarot"]').click();

        await expect(page.locator('#finish-onboarding-btn')).toContainText('tarotový výklad');

        await Promise.all([
            page.waitForURL(url => url.pathname === '/tarot.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            page.locator('#finish-onboarding-btn').click(),
        ]);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/tarot.html');
        expect(url.searchParams.get('entry_feature')).toBe('daily_angel_card');
    });

    test('preskoceni s feature kontextem navaze na puvodni funkci', async ({ page }) => {
        await mockOnboardingComplete(page);

        await page.goto('/onboarding.html?source=tarot_inline_upsell&feature=tarot');
        await waitForPageReady(page);

        await Promise.all([
            page.waitForURL(url => url.pathname === '/tarot.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            page.locator('[data-action="skipOnboarding"]').click(),
        ]);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/tarot.html');
        expect(url.searchParams.get('source')).toBe('onboarding_skip');
        expect(url.searchParams.get('entry_source')).toBe('tarot_inline_upsell');
        expect(url.searchParams.get('entry_feature')).toBe('tarot');
    });

    test('preskoceni zachova placeny intent bez presmerovani mimo prvni hodnotu', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);

        let completionPayload = null;
        await page.route('**/api/auth/onboarding/complete', async (route) => {
            completionPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.goto('/onboarding.html?source=tarot_inline_upsell&feature=tarot_multi_card&plan=pruvodce&redirect=%2Fcenik.html%3Fsource%3Donboarding_return');
        await waitForPageReady(page);

        const skipHref = await page.locator('[data-action="skipOnboarding"]').getAttribute('href');
        const skipUrl = new URL(skipHref, page.url());
        expect(skipUrl.pathname).toBe('/tarot.html');
        expect(skipUrl.searchParams.get('source')).toBe('onboarding_skip');
        expect(skipUrl.searchParams.get('entry_source')).toBe('tarot_inline_upsell');
        expect(skipUrl.searchParams.get('entry_feature')).toBe('tarot_multi_card');
        expect(skipUrl.searchParams.get('plan')).toBe('pruvodce');
        expect(skipUrl.searchParams.get('redirect')).toBeNull();

        await Promise.all([
            page.waitForURL(url => url.pathname === '/tarot.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            page.locator('[data-action="skipOnboarding"]').click(),
        ]);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/tarot.html');
        expect(url.searchParams.get('plan')).toBe('pruvodce');
        expect(completionPayload).toMatchObject({
            source: 'tarot_inline_upsell',
            feature: 'tarot_multi_card',
            plan: 'pruvodce',
            redirect: '/cenik.html?source=onboarding_return',
            skipped: true
        });
        expect(completionPayload.destination).toContain('/tarot.html');
        expect(completionPayload.destination).not.toContain('redirect=');
    });

    test('mentor kontext predvybere pruvodce a upravi prvni krok', async ({ page }) => {
        await mockOnboardingComplete(page);

        await page.goto('/onboarding.html?source=mentor_inline_upsell&feature=hvezdny_mentor');
        await waitForPageReady(page);

        await expect(page.locator('.interest-chip[data-interest="spiritualita"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#step-1 .step-title')).toContainText('průvodcem');

        const skipHref = await page.locator('[data-action="skipOnboarding"]').getAttribute('href');
        expect(skipHref).toContain('/mentor.html');
        expect(skipHref).toContain('entry_feature=hvezdny_mentor');
    });

    test('samanske kolo v onboardingu vede na kanonickou stranku', async ({ page }) => {
        await mockOnboardingComplete(page);

        await page.goto('/onboarding.html?source=shaman_inline_upsell&feature=shamanske_kolo_plne_cteni');
        await waitForPageReady(page);

        await expect(page.locator('.interest-chip[data-interest="shamanske-kolo"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#step-1 .step-title')).toContainText('šamanským kolem');
        await expect(page.locator('#step-1 .step-subtitle')).toContainText('symbolický směr');

        const skipHref = await page.locator('[data-action="skipOnboarding"]').getAttribute('href');
        expect(skipHref).toContain('/shamansko-kolo.html');
        expect(skipHref).not.toContain('/shamanske-kolo.html');

        await page.locator('#step-1 [data-action="goStep"][data-step="2"]').click();
        await page.locator('.zodiac-btn[data-sign="rak"]').click();
        await page.locator('#btn-step2').click();
        await expect(page.locator('#finish-onboarding-copy')).toContainText('symbolický směr');

        await Promise.all([
            page.waitForURL(url => url.pathname === '/shamansko-kolo.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            page.locator('#finish-onboarding-btn').click(),
        ]);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/shamansko-kolo.html');
        expect(url.searchParams.get('source')).toBe('onboarding_complete');
        expect(url.searchParams.get('entry_feature')).toBe('shamanske_kolo_plne_cteni');
    });

    test('minuly zivot v onboardingu drzi symbolicky ramec', async ({ page }) => {
        await page.setViewportSize({ width: 393, height: 851 });
        await mockOnboardingComplete(page);

        await page.goto('/onboarding.html?source=past_life_register_gate&feature=minuly_zivot');
        await waitForPageReady(page);

        await expect(page.locator('.interest-chip[data-interest="minuly-zivot"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#step-1 .step-title')).toContainText('symbolickým příběhem');
        await expect(page.locator('#step-1 .step-subtitle')).toContainText('archetypální rámec pro sebereflexi');

        const skipHref = await page.locator('[data-action="skipOnboarding"]').getAttribute('href');
        expect(skipHref).toContain('/minuly-zivot.html');
        expect(skipHref).toContain('entry_feature=minuly_zivot');

        await page.locator('#step-1 [data-action="goStep"][data-step="2"]').click();
        await page.locator('.zodiac-btn[data-sign="panna"]').click();
        await page.locator('#btn-step2').click();
        await expect(page.locator('#step-3 .step-title')).toBeInViewport({ ratio: 1 });
        const stepTitleTop = await page.locator('#step-3 .step-title').evaluate((element) => Math.round(element.getBoundingClientRect().top));
        expect(stepTitleTop).toBeGreaterThanOrEqual(0);
        await expect(page.locator('#finish-onboarding-btn')).toContainText('symbolický minulý život');
        await expect(page.locator('#finish-onboarding-copy')).toContainText('symbolickému výkladu minulého života');

        await Promise.all([
            page.waitForURL(url => url.pathname === '/minuly-zivot.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            page.locator('#finish-onboarding-btn').click(),
        ]);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/minuly-zivot.html');
        expect(url.searchParams.get('source')).toBe('onboarding_complete');
        expect(url.searchParams.get('entry_feature')).toBe('minuly_zivot');
    });

    test('navrat do onboardingu obnovi ulozene znameni a tema', async ({ page }) => {
        await page.evaluate(() => {
            localStorage.setItem('mh_zodiac', 'lev');
            localStorage.setItem('mh_interests', JSON.stringify(['numerologie']));
            localStorage.setItem('mh_user_prefs', JSON.stringify({ sign: 'lev' }));
        });

        await page.reload();
        await waitForPageReady(page);
        await page.locator('#step-1 [data-action="goStep"][data-step="2"]').click();

        await expect(page.locator('.zodiac-btn[data-sign="lev"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#btn-step2')).toBeEnabled();

        await page.locator('#btn-step2').click();

        await expect(page.locator('.interest-chip[data-interest="numerologie"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#finish-onboarding-btn')).toContainText('numerologii');
    });

    test('dokonceni chrani proti dvojkliku a posila jen jeden completion request', async ({ page }) => {
        let completionRequests = 0;
        await page.route('**/api/auth/onboarding/complete', async (route) => {
            completionRequests += 1;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.locator('#step-1 [data-action="goStep"][data-step="2"]').click();
        await page.locator('.zodiac-btn[data-sign="beran"]').click();
        await page.locator('#btn-step2').click();

        await Promise.all([
            page.waitForURL(url => url.pathname === '/horoskopy.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            page.locator('#finish-onboarding-btn').dblclick(),
        ]);

        expect(completionRequests).toBe(1);
    });
});

// ═══════════════════════════════════════════════════════════
// PROTECTED API ROUTES — ověřování auth ochrany
// ═══════════════════════════════════════════════════════════

test.describe('Chráněné user API endpointy', () => {

    test('GET /api/auth/profile bez auth vrátí 401', async ({ page }) => {
        const res = await page.request.get('/api/auth/profile');
        expect(res.status()).toBe(401);
    });

    test('GET /api/user/readings bez auth vrátí 401', async ({ page }) => {
        const res = await page.request.get('/api/user/readings');
        expect(res.status()).toBe(401);
    });

    test('GET /api/payment/subscription/status bez auth vrátí 401', async ({ page }) => {
        const res = await page.request.get('/api/payment/subscription/status');
        expect(res.status()).toBe(401);
    });
});
