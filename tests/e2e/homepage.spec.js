/**
 * E2E testy — Homepage (index.html)
 *
 * Testuje: načtení, SEO meta tagy, hero sekce, klíčové CTA, PWA manifest,
 * bezpečnostní hlavičky, mobilní responsivitu.
 */

import { test, expect } from '@playwright/test';
import { BASE_URL, waitForPageReady, assertBasicSEO, assertSecurityHeaders, MOBILE_VIEWPORT } from './helpers.js';

test.describe('Homepage', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await waitForPageReady(page);
    });

    // ── Základní načtení ────────────────────────────────────────────────────

    test('stránka se načte a vrátí 200', async ({ page }) => {
        const response = await page.request.get('/');
        expect(response.status()).toBe(200);
    });

    test('title obsahuje "Mystická Hvězda"', async ({ page }) => {
        await assertBasicSEO(page, { titleContains: 'Mystická Hvězda' });
    });

    test('meta description je neprázdný', async ({ page }) => {
        const desc = await page.getAttribute('meta[name="description"]', 'content');
        expect(desc).toBeTruthy();
        expect(desc.length).toBeGreaterThan(20);
    });

    test('lang atribut je nastaven na "cs"', async ({ page }) => {
        const lang = await page.getAttribute('html', 'lang');
        expect(lang).toBe('cs');
    });

    // ── Struktura stránky ────────────────────────────────────────────────────

    test('main#main-content nebo main existuje', async ({ page }) => {
        // Může být id="main-content" nebo prostý <main>
        const mainCount = await page.locator('main').count();
        expect(mainCount).toBeGreaterThanOrEqual(1);
    });

    test('hero sekce je viditelná', async ({ page }) => {
        // Hero section nebo první výrazná headline
        const hero = page.locator('.section--hero, .hero, [class*="hero"]').first();
        await expect(hero).toBeVisible();
    });

    test('hero CTA vede k první odpovědi bez registrace a zachovává měřicí kontext', async ({ page }) => {
        const heroCta = page.locator('#hero-cta-btn');
        await expect(heroCta).toBeVisible();
        await expect(heroCta).toHaveClass(/btn--primary/);
        const href = await heroCta.getAttribute('href');
        expect(href).toContain('tarot-ano-ne.html');
        expect(href).toContain('source=homepage_hero');
        expect(href).toContain('feature=tarot_yes_no');
        expect(href).toContain('variant=audience_intent_v1');
    });

    test('stary auth_user bez session cookie neprepina homepage do prihlaseneho stavu', async ({ page }) => {
        await page.evaluate(() => {
            localStorage.setItem('auth_user', JSON.stringify({
                id: 'stale-user',
                email: 'stale@example.com',
                subscription_status: 'free'
            }));
            localStorage.setItem('mh_user_prefs', JSON.stringify({ sign: 'lev' }));
        });

        await page.reload();
        await waitForPageReady(page);

        if ((page.viewportSize()?.width || 1024) <= MOBILE_VIEWPORT.width) {
            await expect(page.locator('#auth-register-btn')).toBeHidden();
            await expect(page.locator('#profile-link')).toBeHidden();

            await page.locator('.nav__toggle').click();
            await expect(page.locator('#mobile-auth-register-btn')).toBeVisible();
            await expect(page.locator('#mobile-profile-link')).toBeHidden();
        } else {
            await expect(page.locator('#auth-register-btn')).toBeVisible();
            await expect(page.locator('#profile-link')).toBeHidden();
        }

        await expect(page.locator('#personalized-greeting')).toHaveAttribute('aria-hidden', 'true');
        await expect.poll(() => page.evaluate(() => localStorage.getItem('auth_user'))).toBeNull();
    });

    test('prihlaseny uzivatel vidi navratovy ritual misto registracniho CTA', async ({ page }) => {
        await page.route('**/api/auth/profile', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    user: {
                        id: 'homepage-user',
                        email: 'homepage@example.com',
                        name: 'Pavel',
                        subscription_status: 'free'
                    }
                })
            });
        });

        await page.context().addCookies([{
            name: 'logged_in',
            value: '1',
            url: BASE_URL
        }]);
        await page.evaluate(() => {
            localStorage.setItem('auth_user', JSON.stringify({
                id: 'homepage-user',
                email: 'homepage@example.com',
                subscription_status: 'free'
            }));
        });

        await page.reload();
        await waitForPageReady(page);

        const loggedInCta = page.locator('#hero-cta-logged-in');
        await expect(loggedInCta).toBeVisible();
        await expect(page.locator('#hero-cta-container')).toBeHidden();
        await expect(loggedInCta.locator('a', { hasText: 'Otevřít dnešní rituál' })).toHaveAttribute('href', 'profil.html#daily-guidance-card');
    });

    test('hero rozcestnik ma vlastni analyticky signal', async ({ page }) => {
        await page.evaluate(() => {
            window.MH_ANALYTICS_QUEUE = [];
        });

        await page.locator('#hero-explore-link').click();

        const event = await page.evaluate(() => window.MH_ANALYTICS_QUEUE.find(
            (item) => item.name === 'cta_clicked' && item.location === 'homepage_explore'
        ));

        expect(event).toEqual(expect.objectContaining({
            destination: '#rychly-start',
            variant: 'audience_intent_v1'
        }));
    });

    test('odmitnute analyticke cookies neposilaji first-party analytics eventy', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.setItem('mh_cookie_prefs', JSON.stringify({
                analytics: false,
                marketing: false,
                ts: Date.now()
            }));
        });

        let analyticsPosts = 0;
        await page.route('**/api/analytics/event', async (route) => {
            analyticsPosts += 1;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, accepted: 1 })
            });
        });

        await page.goto('/');
        await waitForPageReady(page);
        await page.evaluate(() => {
            window.MH_ANALYTICS?.trackEvent('cta_clicked', { location: 'privacy_regression' });
        });
        await page.waitForTimeout(800);

        expect(analyticsPosts).toBe(0);
    });

    test('bez souhlasu neposila pasivni first-party analytics eventy', async ({ page }) => {
        await page.addInitScript(() => {
            localStorage.removeItem('mh_cookie_prefs');
            localStorage.removeItem('cookieConsent');
        });

        let analyticsPosts = 0;
        await page.route('**/api/analytics/event', async (route) => {
            analyticsPosts += 1;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, accepted: 1 })
            });
        });

        await page.goto('/');
        await waitForPageReady(page);
        await page.evaluate(() => {
            window.MH_ANALYTICS?.trackEvent('cta_clicked', { location: 'no_consent_regression' });
        });
        await page.waitForTimeout(800);

        expect(analyticsPosts).toBe(0);
    });

    test('first-party page view neprenasi citlive query parametry', async ({ page }) => {
        const analyticsPayloads = [];
        await page.addInitScript(() => {
            localStorage.setItem('mh_cookie_prefs', JSON.stringify({
                analytics: true,
                marketing: false,
                ts: Date.now()
            }));
        });

        await page.route('**/api/analytics/batch', async (route) => {
            const body = JSON.parse(route.request().postData() || '{}');
            analyticsPayloads.push(...(body.events || []));
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, accepted: 1 })
            });
        });

        await page.goto('/?email=jana@example.com&token=secret123&audit=page-view');
        await waitForPageReady(page);

        await expect.poll(() => analyticsPayloads.some((payload) => payload.eventName === 'page_view')).toBe(true);
        const pageView = analyticsPayloads.find((payload) => payload.eventName === 'page_view');

        expect(pageView.path).toBe('/');
        expect(pageView.metadata.url).not.toContain('email=');
        expect(pageView.metadata.url).not.toContain('token=');
    });

    test('first-party analytics pripoji kampanovou atribuci ke vsem eventum', async ({ page }) => {
        const analyticsPayloads = [];
        await page.addInitScript(() => {
            localStorage.removeItem('mh_attribution_first_touch');
            sessionStorage.removeItem('mh_attribution_last_touch');
            localStorage.setItem('mh_cookie_prefs', JSON.stringify({
                analytics: true,
                marketing: false,
                ts: Date.now()
            }));
            localStorage.removeItem('cookieConsent');
        });

        await page.route('**/api/analytics/batch', async (route) => {
            const body = JSON.parse(route.request().postData() || '{}');
            analyticsPayloads.push(...(body.events || []));
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, accepted: (body.events || []).length })
            });
        });

        await page.goto('/?utm_source=pinterest&utm_medium=organic&utm_campaign=tarot_meanings&utm_content=pin_v1&entry_feature=tarot');
        await waitForPageReady(page);
        await page.evaluate(() => {
            window.MH_ANALYTICS?.trackCTA('attribution_regression', { label: 'Test CTA' });
        });

        await expect.poll(() => analyticsPayloads.some((item) => item.eventName === 'page_view')).toBe(true);
        await expect.poll(() => analyticsPayloads.some((item) => item.eventName === 'cta_clicked')).toBe(true);

        const events = {
            pageView: analyticsPayloads.find((item) => item.eventName === 'page_view')?.metadata,
            cta: analyticsPayloads.find((item) => item.eventName === 'cta_clicked')?.metadata,
            context: await page.evaluate(() => window.MH_ANALYTICS?.getAttributionContext?.().metadata)
        };

        for (const event of [events.pageView, events.cta, events.context]) {
            expect(event).toEqual(expect.objectContaining({
                first_source: 'pinterest',
                first_medium: 'organic',
                first_campaign: 'tarot_meanings',
                last_source: 'pinterest',
                last_medium: 'organic',
                last_campaign: 'tarot_meanings',
                utm_content: 'pin_v1',
                entry_feature: 'tarot',
                landing_path: '/'
            }));
        }
    });

    test('mobilni cookie lista na homepage nezakryva prvni dojem', async ({ page }) => {
        await page.setViewportSize({ width: 393, height: 851 });
        await page.evaluate(() => {
            localStorage.removeItem('mh_cookie_prefs');
            localStorage.removeItem('cookieConsent');
        });
        await page.goto('/');
        await waitForPageReady(page);

        const banner = page.locator('#cookie-banner');
        await expect(banner).toBeVisible({ timeout: 4000 });
        await expect(banner).toHaveClass(/visible/, { timeout: 5000 });
        await page.waitForTimeout(650);

        const metrics = await page.evaluate(() => {
            const bannerRect = document.getElementById('cookie-banner').getBoundingClientRect();
            const acceptRect = document.getElementById('cookie-accept').getBoundingClientRect();
            const actionHeights = Array.from(document.querySelectorAll('.cookie-banner__actions .btn'))
                .map((button) => button.getBoundingClientRect().height);
            return {
                bannerHeight: bannerRect.height,
                acceptBottom: acceptRect.bottom,
                viewportHeight: window.innerHeight,
                actionHeights
            };
        });
        expect(metrics.bannerHeight).toBeLessThan(260);
        expect(metrics.acceptBottom).toBeLessThanOrEqual(metrics.viewportHeight);
        expect(metrics.actionHeights.every((height) => height >= 44)).toBe(true);
    });

    test('header a pricing CTA maji funkcni fallback odkazy bez JavaScriptu', async ({ page }) => {
        await expect(page.locator('#auth-register-btn')).toHaveAttribute('href', /source=header_register/);
        await expect(page.locator('#auth-btn')).toHaveAttribute('href', /prihlaseni\.html\?source=header_login/);
        await expect(page.locator('#mobile-auth-register-btn')).toHaveAttribute('href', /source=mobile_menu/);
        await expect(page.locator('#mobile-auth-btn')).toHaveAttribute('href', /source=mobile_menu_login/);

        await expect(page.locator('[data-plan="poutnik"]')).toHaveAttribute('href', /homepage_pricing_free_cta/);
        await expect(page.locator('[data-plan="pruvodce"]')).toHaveAttribute('href', /plan=pruvodce/);
        await expect(page.locator('[data-plan="pruvodce"]')).toHaveText(/Chci hlubší výklady/);
        await expect(page.locator('a[href*="homepage_pricing_full_compare"]')).toHaveAttribute('href', /cenik\.html\?source=homepage_pricing_full_compare/);
        await expect(page.locator('a[href*="homepage_pricing_full_compare"]')).toContainText('Otevřít celý ceník');
    });

    test('homepage viditelne propaguje Osobni mapu', async ({ page }) => {
        const spotlight = page.locator('.personal-map-spotlight');
        await expect(spotlight).toBeVisible();
        await expect(spotlight).toContainText('Osobní mapa');
        await expect(spotlight).toContainText('299 Kč');
        await expect(spotlight.locator('img[alt*="Osobní mapa"]')).toBeVisible();
        await expect(spotlight.locator('img[alt*="Osobní mapa"]')).toHaveAttribute('src', /personal-map-soft-v3\.webp/);
        await expect(spotlight.locator('a.btn--primary')).toHaveAttribute('href', /osobni-mapa\.html\?source=homepage_spotlight/);
        await expect(spotlight.locator('a.btn--primary')).toHaveAttribute('data-analytics-product', 'osobni_mapa_2026');
        await expect(spotlight.locator('a[href*="rocni-horoskop.html"]')).toHaveCount(0);
        await expect(page.locator('.nav__dropdown-link[href*="osobni-mapa.html"]').first()).toContainText('Osobní mapa');
        await expect(page.locator('.nav__dropdown-link[href*="rocni-horoskop.html"]')).toHaveCount(0);
    });

    test('homepage premium produkty posilaji produktovy analyticky signal', async ({ page }) => {
        await page.evaluate(() => {
            window.MH_ANALYTICS_QUEUE = [];
            document.querySelectorAll('.personal-map-spotlight a').forEach((link) => {
                link.addEventListener('click', (event) => event.preventDefault(), { capture: true });
            });
        });

        await page.locator('.personal-map-spotlight a.btn--primary').click();

        const events = await page.evaluate(() => window.MH_ANALYTICS_QUEUE.filter(
            (item) => item.name === 'cta_clicked' && item.intent === 'one_time_purchase'
        ));

        expect(events).toEqual(expect.arrayContaining([
            expect.objectContaining({
                location: 'homepage_personal_map_spotlight',
                product_id: 'osobni_mapa_2026',
                feature: 'osobni_mapa_2026',
                destination: 'osobni-mapa.html?source=homepage_spotlight'
            })
        ]));
        expect(events).toHaveLength(1);
    });

    test('header registrace neotevira stary modal a vede na dedikovanou registraci', async ({ page, isMobile }) => {
        test.skip(isMobile, 'Desktop header CTA is hidden on mobile; mobile menu registration is covered separately.');

        await Promise.all([
            page.waitForURL(url => url.pathname === '/prihlaseni.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            page.locator('#auth-register-btn').click(),
        ]);

        const url = new URL(page.url());
        expect(url.pathname).toBe('/prihlaseni.html');
        expect(url.searchParams.get('mode')).toBe('register');
        expect(url.searchParams.get('source')).toBe('header_register');
        await expect(page.locator('#login-page-title')).toContainText('účet zdarma');
    });

    test('mobilni registrace z menu vede na dedikovanou registraci', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/');
        await waitForPageReady(page);

        await page.locator('.nav__toggle').click();
        await expect(page.locator('.nav__toggle')).toHaveAttribute('aria-expanded', 'true');

        await Promise.all([
            page.waitForURL(url => url.pathname === '/prihlaseni.html', { timeout: 10000, waitUntil: 'domcontentloaded' }),
            page.locator('#mobile-auth-register-btn').click(),
        ]);

        const url = new URL(page.url());
        expect(url.searchParams.get('mode')).toBe('register');
        expect(url.searchParams.get('source')).toBe('mobile_menu');
        expect(url.searchParams.get('feature')).toBe('account');
        await expect(page.locator('#checkout-context-title')).toContainText('Účet zdarma');
    });

    test('homepage nabízí rychlé vstupy podle hlavních návštěvnických záměrů', async ({ page }) => {
        await expect(page.locator('#hero-explore-link')).toHaveAttribute('href', '#rychly-start');
        await expect(page.locator('[data-analytics-cta="homepage_quick_decision"]')).toHaveAttribute('href', /tarot-ano-ne\.html/);
        await expect(page.locator('[data-analytics-cta="homepage_quick_daily"]')).toHaveAttribute('href', /horoskopy\.html/);
        await expect(page.locator('[data-analytics-cta="homepage_quick_dream"]')).toHaveAttribute('href', /snar\.html/);

        await expect(page.locator('.hero__daily-preview')).toHaveCount(0);
    });

    test('h1 tag existuje a obsahuje text', async ({ page }) => {
        const h1 = page.locator('h1').first();
        await expect(h1).toBeVisible();
        const text = await h1.innerText();
        expect(text.trim().length).toBeGreaterThan(2);
    });

    // ── SEO & strukturovaná data ─────────────────────────────────────────────

    test('canonical link je nastaven', async ({ page }) => {
        const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
        expect(canonical).toBeTruthy();
        expect(canonical).toContain('mystickahvezda.cz');
    });

    test('Open Graph title je nastaven', async ({ page }) => {
        const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
        expect(ogTitle).toBeTruthy();
    });

    test('Open Graph image je nastaven', async ({ page }) => {
        const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
        expect(ogImage).toBeTruthy();
    });

    // ── PWA ─────────────────────────────────────────────────────────────────

    test('manifest.json je dostupný', async ({ page }) => {
        const response = await page.request.get('/manifest.json');
        expect(response.status()).toBe(200);
        const json = await response.json();
        expect(json.name).toBeTruthy();
    });

    test('theme-color meta tag existuje', async ({ page }) => {
        const themeColor = await page.getAttribute('meta[name="theme-color"]', 'content');
        expect(themeColor).toBeTruthy();
    });

    // ── Bezpečnostní hlavičky ────────────────────────────────────────────────

    test('bezpečnostní hlavičky jsou přítomny', async ({ page }) => {
        await assertSecurityHeaders(page, '/');
    });

    // ── Navigace ────────────────────────────────────────────────────────────

    test('stránka obsahuje odkaz na horoskopy', async ({ page }) => {
        const link = page.locator('a[href*="horoskop"]').first();
        await expect(link).toBeAttached();
    });

    test('stránka obsahuje odkaz na tarot', async ({ page }) => {
        const link = page.locator('a[href*="tarot"]').first();
        await expect(link).toBeAttached();
    });

    test('stránka obsahuje navigační odkaz na tarot kartu dne', async ({ page }) => {
        const link = page.locator('.nav__dropdown-link[href*="tarot-karta-dne.html"]').first();
        await expect(link).toContainText('Tarot karta dne');
    });

    test('spodní CTA vrací návštěvníka k odpovědi zdarma s měřicím kontextem', async ({ page }) => {
        const href = await page.locator('#cta-banner-btn').getAttribute('href');
        expect(href).toContain('tarot-ano-ne.html');
        expect(href).toContain('source=homepage_bottom_cta');
        expect(href).toContain('feature=tarot_yes_no');
        expect(href).toContain('variant=audience_intent_v1');
    });

    test('homepage nerusi registraci newsletterem ani marketingovym popupem', async ({ page }) => {
        await expect(page.locator('#newsletter-form')).toHaveCount(0);
        await expect(page.locator('#mh-newsletter-popup')).toHaveCount(0);
        await expect(page.locator('#exit-intent-modal')).toHaveCount(0);

        await page.mouse.move(200, 200);
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(700);

        const loadedScripts = await page.locator('script[src]').evaluateAll((scripts) => scripts.map((script) => script.src));
        expect(loadedScripts.some((src) => src.includes('newsletter-popup'))).toBe(false);
        expect(loadedScripts.some((src) => src.includes('exit-intent'))).toBe(false);
        expect(loadedScripts.some((src) => src.includes('push-notifications'))).toBe(false);
    });

    test('homepage copy nepouziva nedolozene NASA tvrzeni a nema duplicitni pricing nadpis', async ({ page }) => {
        const bodyText = await page.locator('body').innerText();
        expect(bodyText).not.toContain('efemeridami NASA');
        expect(bodyText).toContain('Najdi nový pohled na to, co právě řešíš.');
        expect(bodyText).toContain('Tarot, horoskopy, numerologie, sny i osobní výklady');
        expect(bodyText).toContain('Nejdřív odpověď. Profil až když chceš navázat.');
        expect(bodyText).toContain('Jedna odpověď zdarma. Premium, když chceš jít do hloubky.');
        expect(bodyText).toContain('Otevřít celý ceník');
        expect(bodyText).not.toContain('Ne další ezoterická stránka');
        expect(bodyText).not.toContain('S čím ti může Mystická Hvězda pomoci');
    });

    test('modelove priklady a carousel nejsou soucasti viditelne homepage', async ({ page }) => {
        const bodyText = await page.locator('body').innerText();
        await expect(page.locator('#reference')).toBeHidden();
        await expect(page.locator('.carousel-dot')).toHaveCount(0);
        expect(bodyText).not.toContain('Nadhled po rozchodu');
        expect(bodyText).not.toContain('Změna kariéry');
        expect(bodyText).not.toContain('Modelová situace');
    });

    test('homepage odpovida na hlavni otazky duvery pred registraci a platbou', async ({ page }) => {
        const bodyText = await page.locator('body').innerText();

        expect(bodyText).toContain('Bez platební karty');
        expect(bodyText).toContain('Jak chráníte moje údaje?');
        expect(bodyText).toContain('Můžu Premium kdykoliv zrušit?');
        expect(bodyText).toContain('nenahrazují odbornou pomoc');
        expect(bodyText).toContain('Provozovatel služby Mystická Hvězda');

        await expect(page.locator('.home-intent-grid')).toBeVisible();
        await expect(page.locator('.home-intent-card')).toHaveCount(3);
        await expect(page.locator('.homepage-faq-card')).toHaveCount(3);
        await expect(page.locator('.cancel-flow-card')).toBeHidden();
    });

    test('footer feedback na homepage odesle signal bez registrace', async ({ page }) => {
        const widget = page.locator('[data-feedback-widget]');
        await widget.scrollIntoViewIfNeeded();
        await expect(widget).toBeVisible();
        await expect(widget.locator('[data-feedback-value="yes"]')).toBeVisible();
        await expect(widget.locator('[data-feedback-value="no"]')).toBeVisible();

        await widget.locator('[data-feedback-value="yes"]').click();

        await expect(widget.locator('[data-feedback-status]')).toContainText('Díky');
        await expect(widget.locator('[data-feedback-value="yes"]')).toBeDisabled();
    });

    test('kompaktni cenik zachovava odkaz na detail tarifu', async ({ page }) => {
        const pricing = page.locator('#cenik');
        await expect(pricing).toBeVisible();
        await expect(pricing.locator('[data-plan="poutnik"]')).toBeVisible();
        await expect(pricing.locator('[data-plan="pruvodce"]')).toBeVisible();
        await expect(pricing.locator('a[href*="homepage_pricing_full_compare"]')).toBeVisible();
    });

    test('zkracena homepage drzi cenik pred jednorazovym PDF', async ({ page }) => {
        const positions = await page.evaluate(() => ({
            pricing: document.getElementById('cenik').getBoundingClientRect().top + window.scrollY,
            personalMap: document.getElementById('osobni-mapa-preview').getBoundingClientRect().top + window.scrollY
        }));
        expect(positions.pricing).toBeLessThan(positions.personalMap);
    });

    test('pricing preview free plan vede neprihlaseneho na aktivacni registraci', async ({ page }) => {
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.locator('[data-plan="poutnik"]').click();

        await page.waitForURL(url => url.pathname === '/prihlaseni.html', { timeout: 10000, waitUntil: 'domcontentloaded' });
        const url = new URL(page.url());
        expect(url.searchParams.get('mode')).toBe('register');
        expect(url.searchParams.get('redirect')).toBe('/horoskopy.html');
        expect(url.searchParams.get('source')).toBe('homepage_pricing_free_cta');
        expect(url.searchParams.get('feature')).toBe('daily_guidance');
    });

    test('pricing preview placeny plan ulozi checkout kontext pred registraci', async ({ page }) => {
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.locator('[data-plan="pruvodce"]').click();

        await page.waitForURL(url => url.pathname === '/prihlaseni.html', { timeout: 10000, waitUntil: 'domcontentloaded' });
        const url = new URL(page.url());
        expect(url.searchParams.get('mode')).toBe('register');
        expect(url.searchParams.get('redirect')).toBe('/cenik.html');
        expect(url.searchParams.get('plan')).toBe('pruvodce');
        expect(url.searchParams.get('source')).toBe('homepage_pricing_preview');
        expect(url.searchParams.get('feature')).toBe('premium_membership');
        expect(url.searchParams.get('entry_source')).toBe('homepage_pricing_preview');
        expect(url.searchParams.get('entry_feature')).toBe('premium_membership');

        const pendingContext = await page.evaluate(() => JSON.parse(sessionStorage.getItem('pending_checkout_context') || '{}'));
        expect(pendingContext).toEqual(expect.objectContaining({
            planId: 'pruvodce',
            source: 'homepage_pricing_preview',
            feature: 'premium_membership',
            redirect: '/cenik.html',
            authMode: 'register',
            metadata: expect.objectContaining({
                entry_source: 'homepage_pricing_preview',
                entry_feature: 'premium_membership'
            })
        }));
    });

    test('pricing preview prihlaseneho posila checkout metadata', async ({ page, context }) => {
        let checkoutPayload = null;

        await context.addCookies([{
            name: 'logged_in',
            value: '1',
            url: BASE_URL
        }]);
        await page.addInitScript(() => {
            localStorage.setItem('auth_user', JSON.stringify({
                id: 'homepage-pricing-user',
                email: 'pricing-user@example.com',
                subscription_status: 'free'
            }));
        });

        await page.route('**/api/payment/create-checkout-session', async (route) => {
            checkoutPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'cs_homepage_pricing_preview',
                    url: '/profil.html?payment=success&plan=pruvodce&session_id=cs_homepage_pricing_preview'
                })
            });
        });

        // auth-client na initu volá GET /auth/profile; bez tohoto mocku vrátí mock backend
        // 401 → clearStaleSession() → logged-out, takže [data-plan] klik spadne do register větve.
        await page.route('**/api/auth/profile', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    user: { id: 'homepage-pricing-user', email: 'pricing-user@example.com', subscription_status: 'free' }
                })
            });
        });

        // Přihlášený stav (cookie + auth_user) musí být připraven PŘED během page skriptů,
        // proto čerstvá navigace místo evaluate+reload.
        await page.goto('/');
        await waitForPageReady(page);

        await Promise.all([
            page.waitForURL(
                url => url.pathname === '/profil.html' && url.searchParams.get('session_id') === 'cs_homepage_pricing_preview',
                { timeout: 10000, waitUntil: 'domcontentloaded' }
            ),
            page.locator('[data-plan="pruvodce"]').click(),
        ]);

        expect(checkoutPayload).toEqual(expect.objectContaining({
            planId: 'pruvodce',
            source: 'homepage_pricing_preview',
            feature: 'premium_membership',
            metadata: expect.objectContaining({
                entry_source: 'homepage_pricing_preview',
                entry_feature: 'premium_membership'
            })
        }));
    });

    test('pricing preview posila vyssi plany do celeho ceniku', async ({ page }) => {
        const fullPricingLink = page.locator('a[href*="homepage_pricing_full_compare"]');
        await expect(fullPricingLink).toBeVisible();
        await expect(fullPricingLink).toHaveAttribute('href', /cenik\.html\?source=homepage_pricing_full_compare/);
        await expect(page.locator('[data-plan="osviceni"]')).toHaveCount(0);
        await expect(page.locator('[data-plan="vip-majestrat"]')).toHaveCount(0);
    });

    test('karta dne vede do andelskych karet a sdileni funguje i bez Web Share API', async ({ page }) => {
        await page.evaluate(() => {
            const now = new Date();
            const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
            localStorage.setItem('mh_kdd_date', today);
            localStorage.setItem('mh_kdd_index', '27');
            localStorage.removeItem('mh_kdd_last_flip_date');
        });

        await page.reload();
        await waitForPageReady(page);

        const card = page.locator('#kdd-card');
        await card.scrollIntoViewIfNeeded();
        await card.click();

        await expect(page.locator('#kdd-message')).toBeVisible();
        await expect(page.locator('#kdd-name')).toHaveText('Hravost');

        const detailHref = await page.locator('#kdd-lexicon-link').getAttribute('href');
        await expect(page.locator('#kdd-lexicon-link')).toHaveText(/Andělské karty/);
        await expect(card).toHaveAttribute('aria-label', /Otevřít denní symbol Hravost v Andělských kartách/);
        expect(detailHref).toContain('andelske-karty.html');
        expect(detailHref).toContain('source=homepage_daily_card_detail');
        expect(detailHref).toContain('feature=daily_angel_card');
        expect(detailHref).toContain('daily_card=hravost');
        expect(detailHref).not.toContain('tarot');

        const fullReadingHref = await page.locator('#kdd-full-reading-link').getAttribute('href');
        expect(fullReadingHref).toContain('andelske-karty.html');
        expect(fullReadingHref).toContain('source=homepage_daily_card_full_reading');
        expect(fullReadingHref).toContain('feature=andelske_karty_hluboky_vhled');
        expect(fullReadingHref).toContain('daily_card=hravost');
        expect(fullReadingHref).not.toContain('tarot');

        await page.evaluate(() => {
            Object.defineProperty(navigator, 'share', {
                configurable: true,
                value: undefined
            });
            Object.defineProperty(navigator, 'clipboard', {
                configurable: true,
                value: {
                    writeText: async (text) => {
                        window.__dailyCardShareText = text;
                    }
                }
            });
        });

        await page.locator('#kdd-share-btn').click();

        await expect.poll(() => page.evaluate(() => window.__dailyCardShareText || '')).toContain('Hravost');
        await expect.poll(() => page.evaluate(() => window.__dailyCardShareText || '')).toContain('andelske-karty.html');

        await card.click();
        await expect(page).toHaveURL(/andelske-karty\.html\?source=homepage_daily_card_card_click/);
        await expect(page).toHaveURL(/daily_card=hravost/);
    });

    test('sdileni karty dne ma textarea fallback pri nedostupne clipboard API', async ({ page }) => {
        await page.evaluate(() => {
            const now = new Date();
            const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
            localStorage.setItem('mh_kdd_date', today);
            localStorage.setItem('mh_kdd_index', '27');
            localStorage.removeItem('mh_kdd_last_flip_date');
        });

        await page.reload();
        await waitForPageReady(page);

        const card = page.locator('#kdd-card');
        await card.scrollIntoViewIfNeeded();
        await card.click();
        await expect(page.locator('#kdd-message')).toBeVisible();

        await page.evaluate(() => {
            Object.defineProperty(navigator, 'share', {
                configurable: true,
                value: undefined
            });
            Object.defineProperty(navigator, 'clipboard', {
                configurable: true,
                value: {
                    writeText: async () => {
                        throw new Error('clipboard denied');
                    }
                }
            });
            document.execCommand = (command) => {
                if (command !== 'copy') return false;
                window.__dailyCardFallbackText = document.activeElement?.value || '';
                return true;
            };
        });

        await page.locator('#kdd-share-btn').click();

        await expect(page.locator('#kdd-share-btn')).toContainText('Zkopírováno');
        await expect.poll(() => page.evaluate(() => window.__dailyCardFallbackText || '')).toContain('Hravost');
        await expect.poll(() => page.evaluate(() => window.__dailyCardFallbackText || '')).toContain('andelske-karty.html');
    });

    test('sdileni karty dne ukaze rucni odkaz kdyz automaticke kopirovani selze', async ({ page }) => {
        await page.evaluate(() => {
            const now = new Date();
            const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
            localStorage.setItem('mh_kdd_date', today);
            localStorage.setItem('mh_kdd_index', '27');
            localStorage.removeItem('mh_kdd_last_flip_date');
        });

        await page.reload();
        await waitForPageReady(page);

        const card = page.locator('#kdd-card');
        await card.scrollIntoViewIfNeeded();
        await card.click();
        await expect(page.locator('#kdd-message')).toBeVisible();

        await page.evaluate(() => {
            Object.defineProperty(navigator, 'share', {
                configurable: true,
                value: undefined
            });
            Object.defineProperty(navigator, 'clipboard', {
                configurable: true,
                value: {
                    writeText: async () => {
                        throw new Error('clipboard denied');
                    }
                }
            });
            document.execCommand = () => false;
        });

        await page.locator('#kdd-share-btn').click();

        await expect(page.locator('#kdd-share-btn')).toContainText('Odkaz připraven');
        await expect(page.locator('.kdd-share-fallback')).toBeVisible();
        await expect(page.locator('.kdd-share-fallback input')).toHaveValue(/andelske-karty\.html/);
    });

    test('skip-link pro přístupnost existuje', async ({ page }) => {
        const skipLink = page.locator('.skip-link, a[href="#main-content"]').first();
        await expect(skipLink).toBeAttached();
    });

    // ── Mobilní responsivita ────────────────────────────────────────────────

    test('homepage nemá horizontální scroll na mobilním viewportu', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/');
        await waitForPageReady(page);

        const hasHorizontalScroll = await page.evaluate(() =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(hasHorizontalScroll).toBe(false);
    });

    test('h1 je viditelný na mobilním viewportu', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/');
        await waitForPageReady(page);

        const h1 = page.locator('h1').first();
        await expect(h1).toBeVisible();
    });
});
