/**
 * E2E testy — Mentor (Hvězdný průvodce) + Šamanské kolo
 *
 * Mentor: AI chat UI — testujeme strukturu chatu, vstup, odeslání.
 * Šamanské kolo: formulář pro medicina wheel.
 */

import { test, expect } from '@playwright/test';
import { BASE_URL, waitForPageReady, getCsrfToken, MOBILE_VIEWPORT } from './helpers.js';

async function activateMentorTestSession(page) {
    await page.evaluate(() => {
        const user = { id: 'e2e-mentor-user', email: 'mentor-e2e@example.com', subscription_status: 'free' };
        Object.assign(window.Auth, {
            user,
            isLoggedIn: () => true,
            isPremium: () => false,
            getProfile: async () => user
        });
        document.dispatchEvent(new Event('auth:changed'));
    });
}

// ═══════════════════════════════════════════════════════════
// MENTOR — Hvězdný průvodce (AI Chat)
// ═══════════════════════════════════════════════════════════

test.describe('Mentor — Hvězdný průvodce', () => {

    test.beforeEach(async ({ page }) => {
        await page.context().addCookies([{
            name: 'logged_in',
            value: '1',
            url: BASE_URL
        }]);

        await page.addInitScript(() => {
            localStorage.setItem('auth_user', JSON.stringify({
                id: 'e2e-mentor-user',
                email: 'mentor-e2e@example.com',
                subscription_status: 'free'
            }));
        });
        await page.goto('/mentor.html');
        await waitForPageReady(page);
    });

    test('stránka vrátí 200', async ({ page }) => {
        const res = await page.request.get('/mentor.html');
        expect(res.status()).toBe(200);
    });

    test('title obsahuje "Průvodce" nebo "Mentor"', async ({ page }) => {
        const title = await page.title().then(t => t.toLowerCase());
        expect(title.includes('průvodce') || title.includes('mentor')).toBe(true);
    });

    test('h1 je viditelný', async ({ page }) => {
        await expect(page.locator('h1').first()).toBeVisible();
    });

    test('hero popisuje automatický průvodce přirozeně a bez slibu výsledku', async ({ page }) => {
        const subtitle = page.locator('.hero__subtitle').first();
        await expect(subtitle).toContainText('Polož otázku o vztazích, práci nebo dalším směru.');
        await expect(subtitle).toContainText('podle situace, kterou popíšeš.');
        await expect(subtitle).not.toContainText(/Zeptejte se|vám pomůže najít klid/);
    });

    test('chat-container nebo chat UI existuje', async ({ page }) => {
        const chat = page.locator('.chat-container, #chat-container, .chat').first();
        await expect(chat).toBeAttached();
    });

    test('#chat-input nebo textarea pro zprávu existuje', async ({ page }) => {
        const input = page.locator('#chat-input, textarea[id*="chat"], textarea').first();
        await expect(input).toBeAttached();
    });

    test('send-btn nebo tlačítko pro odeslání existuje', async ({ page }) => {
        const btn = page.locator('.send-btn, button[class*="send"], button[id*="send"]').first();
        await expect(btn).toBeAttached();
    });

    test('chat-messages kontejner existuje', async ({ page }) => {
        const msgs = page.locator('.chat-messages, #chat-messages').first();
        await expect(msgs).toBeAttached();
    });

    test('chat input přijímá text', async ({ page }) => {
        const input = page.locator('#chat-input, textarea').first();
        if (await input.isVisible()) {
            await input.fill('Jaký je můj horoskop dnes?');
            const val = await input.inputValue();
            expect(val).toContain('horoskop');
        }
    });

    test('starter otazky vyplni chat a povoli odeslani', async ({ page }) => {
        const starters = page.locator('.mentor-starter-card');
        await expect(starters).toHaveCount(4);

        await starters.filter({ hasText: 'Rozhodnutí' }).click();

        const input = page.locator('#chat-input');
        await expect(input).toHaveValue(/strach a co intuice/);
        await expect(page.locator('#send-btn')).toBeEnabled();
    });

    test('předchozí historie se načte před odesláním nové otázky', async ({ page }) => {
        let releaseHistory;
        const historyGate = new Promise(resolve => {
            releaseHistory = resolve;
        });

        await page.route('**/api/mentor/history?*', async route => {
            await historyGate;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    history: [
                        { role: 'user', content: 'Starší otázka' },
                        { role: 'mentor', content: 'Starší odpověď' }
                    ]
                })
            });
        });
        await page.route('**/api/mentor/chat', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ reply: 'Nová odpověď' })
        }));

        await page.reload();
        await activateMentorTestSession(page);
        await expect(page.locator('#mentor-history-status')).toBeVisible();
        await expect(page.locator('#mentor-history-status')).toHaveText('Načítám předchozí konverzaci…');
        await page.locator('#chat-input').fill('Nová otázka');
        await expect(page.locator('#send-btn')).toBeDisabled();

        releaseHistory();
        await expect(page.locator('#mentor-history-status')).toBeHidden();
        await expect(page.locator('#send-btn')).toBeEnabled();
        await page.locator('#send-btn').click();
        await expect(page.locator('#chat-messages .message').last()).toHaveText('Nová odpověď');

        const messages = await page.locator('#chat-messages .message').allTextContents();
        expect(messages).toEqual(['Starší otázka', 'Starší odpověď', 'Nová otázka', 'Nová odpověď']);
    });

    test('chyba při načítání historie zachová vstup a dovolí pokračovat', async ({ page }) => {
        await page.route('**/api/mentor/history?*', route => route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ success: false })
        }));
        await page.route('**/api/mentor/chat', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ reply: 'Můžeš pokračovat.' })
        }));

        await page.reload();
        await activateMentorTestSession(page);
        const input = page.locator('#chat-input');
        const sendButton = page.locator('#send-btn');
        await expect(page.locator('#mentor-history-status')).toContainText('Novou otázku můžeš poslat i tak.');
        await input.fill('Moje nová otázka zůstane zachovaná');
        await expect(sendButton).toBeEnabled();
        await sendButton.click();
        await expect(page.locator('#chat-messages .message').last()).toHaveText('Můžeš pokračovat.');
    });

    test('po změně účtu se opožděná historie předchozího účtu nezobrazí', async ({ page }) => {
        let releaseOldHistory;
        const oldHistoryGate = new Promise(resolve => {
            releaseOldHistory = resolve;
        });
        let historyRequestCount = 0;

        await page.route('**/api/auth/profile', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, user: { id: 'e2e-mentor-user', subscription_status: 'free' } })
        }));
        await page.route('**/api/mentor/history?*', async route => {
            historyRequestCount += 1;
            if (historyRequestCount === 1) {
                await oldHistoryGate;
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ success: true, history: [{ role: 'mentor', content: 'Soukromá historie účtu A' }] })
                }).catch(() => {});
                return;
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, history: [{ role: 'mentor', content: 'Historie účtu B' }] })
            });
        });

        await page.reload();
        await activateMentorTestSession(page);
        await expect(page.locator('#mentor-history-status')).toHaveText('Načítám předchozí konverzaci…');
        await page.evaluate(() => {
            window.Auth.user = { id: 'e2e-mentor-user-b', email: 'mentor-b@example.com', subscription_status: 'free' };
            localStorage.setItem('auth_user', JSON.stringify(window.Auth.user));
            document.dispatchEvent(new Event('auth:changed'));
        });

        await expect(page.locator('#chat-messages')).toContainText('Historie účtu B');
        releaseOldHistory();
        await expect(page.locator('#chat-messages')).not.toContainText('Soukromá historie účtu A');
        expect(historyRequestCount).toBe(2);
    });

    test('opožděná odpověď chatu se po změně účtu nevykreslí', async ({ page }) => {
        let releaseOldReply;
        const oldReplyGate = new Promise(resolve => {
            releaseOldReply = resolve;
        });

        await page.route('**/api/auth/profile', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, user: { id: 'e2e-mentor-user', subscription_status: 'free' } })
        }));
        await page.route('**/api/mentor/history?*', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, history: [] })
        }));
        await page.route('**/api/mentor/chat', async route => {
            await oldReplyGate;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ reply: 'Odpověď patří účtu A' })
            }).catch(() => {});
        });

        await page.reload();
        await activateMentorTestSession(page);
        await page.evaluate(() => { window.getCSRFToken = async () => 'mentor-session-test-token'; });
        await page.locator('#chat-input').fill('Otázka účtu A');
        await expect(page.locator('#send-btn')).toBeEnabled();
        await page.locator('#send-btn').click();
        await expect(page.locator('#typing-indicator')).toBeVisible();
        await page.evaluate(() => {
            window.Auth.user = { id: 'e2e-mentor-user-b', email: 'mentor-b@example.com', subscription_status: 'free' };
            localStorage.setItem('auth_user', JSON.stringify(window.Auth.user));
            document.dispatchEvent(new Event('auth:changed'));
        });

        await expect(page.locator('#chat-input')).toHaveValue('');
        await expect(page.locator('#typing-indicator')).toBeHidden();
        releaseOldReply();
        await expect(page.locator('#chat-messages')).not.toContainText('Otázka účtu A');
        await expect(page.locator('#chat-messages')).not.toContainText('Odpověď patří účtu A');
    });

    test('neuložená hotová odpověď zůstane viditelná a změna účtu vymaže i rozepsanou otázku', async ({ page }) => {
        await page.route('**/api/mentor/history?*', route => route.fulfill({
            json: { success: true, history: [] }
        }));
        await page.route('**/api/mentor/chat', route => route.fulfill({
            json: { reply: 'Hotová soukromá odpověď účtu A', historySaved: false }
        }));
        await activateMentorTestSession(page);
        await page.evaluate(() => { window.getCSRFToken = async () => 'test-csrf'; });
        await page.locator('#chat-input').fill('Soukromá otázka účtu A');
        await page.locator('#send-btn').click();
        await expect(page.locator('#chat-messages')).toContainText('Hotová soukromá odpověď účtu A');
        await expect(page.locator('#mentor-history-status')).toContainText('nepodařilo se ji uložit');
        await expect(page.locator('#chat-input')).toHaveValue('');
        await expect(page.locator('#typing-indicator')).toBeHidden();
        await page.locator('#chat-input').fill('Další soukromá otázka');
        await page.evaluate(() => {
            sessionStorage.setItem('mentor_pending_prompt_v1', JSON.stringify({ prompt: 'Soukromý koncept', createdAt: Date.now() }));
            window.Auth.user = { id: 'e2e-mentor-user-b', subscription_status: 'free' };
            document.dispatchEvent(new Event('auth:changed'));
        });
        await expect(page.locator('#chat-input')).toHaveValue('');
        await expect(page.locator('#chat-messages')).not.toContainText('účtu A');
        expect(await page.evaluate(() => sessionStorage.getItem('mentor_pending_prompt_v1'))).toBeNull();
    });

    test('změna účtu během CSRF zabrání odeslání staré otázky pod novým účtem', async ({ page }) => {
        let chatRequests = 0;
        await page.route('**/api/mentor/history?*', route => route.fulfill({ json: { success: true, history: [] } }));
        await page.route('**/api/mentor/chat', route => {
            chatRequests++;
            return route.fulfill({ json: { reply: 'Nemá vzniknout' } });
        });
        await activateMentorTestSession(page);
        await page.evaluate(() => {
            window.getCSRFToken = () => new Promise(resolve => { window.releaseMentorCsrf = resolve; });
        });
        await page.locator('#chat-input').fill('Otázka pouze pro účet A');
        await page.locator('#send-btn').click();
        await expect(page.locator('#typing-indicator')).toBeVisible();
        await page.evaluate(async () => {
            window.Auth.user = { id: 'e2e-mentor-user-b', subscription_status: 'free' };
            document.dispatchEvent(new Event('auth:changed'));
            window.releaseMentorCsrf('test-csrf');
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        expect(chatRequests).toBe(0);
        await expect(page.locator('#chat-input')).toHaveValue('');
        await expect(page.locator('#typing-indicator')).toBeHidden();
    });

    test('odhlaseny navstevnik vidi hodnotu pred registraci a prompt se ulozi bez planu', async ({ page }) => {
        await page.context().clearCookies();
        await page.goto('/mentor.html?source=e2e_mentor_value_first');
        await waitForPageReady(page);

        await expect(page).toHaveURL(/mentor\.html/);
        await expect(page.locator('.mentor-starter-card')).toHaveCount(4);

        await page.locator('#chat-input').fill('Jaký další krok mám dnes udělat?');
        await expect(page.locator('#send-btn')).toBeEnabled();
        await Promise.all([
            page.waitForURL(/prihlaseni\.html.*source=mentor_entry_auth_gate/),
            page.locator('#send-btn').click()
        ]);

        const url = new URL(page.url());
        expect(url.searchParams.get('mode')).toBe('register');
        expect(url.searchParams.get('redirect')).toBe('/mentor.html');
        expect(url.searchParams.get('feature')).toBe('mentor');
        expect(url.searchParams.has('plan')).toBe(false);

        const pendingPrompt = await page.evaluate(() => JSON.parse(sessionStorage.getItem('mentor_pending_prompt_v1') || 'null'));
        expect(pendingPrompt.prompt).toContain('další krok');
        expect(pendingPrompt.source).toBe('mentor_entry_auth_gate');
    });

    test('mentor bundle uses the server quota and does not keep a client-side daily counter', async ({ page }) => {
        const response = await page.request.get('/js/dist/mentor.js');
        expect(response.status()).toBe(200);
        const source = await response.text();

        expect(source).toContain('/mentor/chat');
        expect(source).not.toContain('mh_daily_mentor_');
        expect(source).toContain('historySaved');
        expect(source).toContain('mentor-paywall-upgrade-btn');
        expect(source).not.toContain('Lorem ipsum');
    });

    test('mentor treats a 403 authorization error as an error, not as a quota paywall', async ({ page }) => {
        await page.route('**/api/mentor/history?*', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, history: [] })
        }));
        await page.route('**/api/mentor/chat', route => route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Požadavek se nepodařilo ověřit.' })
        }));
        await activateMentorTestSession(page);
        await page.evaluate(() => { window.getCSRFToken = async () => 'mentor-test-csrf'; });
        await page.locator('#chat-input').fill('Zachovej otázku při chybě ověření.');
        await expect(page.locator('#send-btn')).toBeEnabled();
        await page.locator('#send-btn').click();

        await expect(page.locator('#chat-messages')).toContainText('Požadavek se nepodařilo ověřit.');
        await expect(page.locator('[data-mentor-limit]')).toHaveCount(0);
        await expect(page.locator('#chat-input')).toHaveValue('Zachovej otázku při chybě ověření.');
    });

    // API test
    test('POST /api/mentor/chat bez CSRF vrátí 403', async ({ page }) => {
        const res = await page.request.post('/api/mentor/chat', {
            data: { message: 'Ahoj, poraď mi' },
        });
        expect(res.status()).toBe(403);
    });

    test('POST /api/mentor/chat bez auth vrátí 401 nebo 402', async ({ page }) => {
        const csrf = await getCsrfToken(page);
        const res = await page.request.post('/api/mentor/chat', {
            data: { message: 'Testovací zpráva' },
            headers: { 'x-csrf-token': csrf },
        });
        // Bez přihlášení
        expect([400, 401, 402]).toContain(res.status());
    });

    test('žádný horizontální scroll na mobilu', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/mentor.html');
        await waitForPageReady(page);
        const overflow = await page.evaluate(() =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(overflow).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════
// ŠAMANSKÉ KOLO (Medicine Wheel)
// ═══════════════════════════════════════════════════════════

test.describe('Šamanské kolo', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/shamansko-kolo.html');
        await waitForPageReady(page);
    });

    test('stránka vrátí 200', async ({ page }) => {
        const res = await page.request.get('/shamansko-kolo.html');
        expect(res.status()).toBe(200);
    });

    test('title obsahuje "Šamanské" nebo "kolo"', async ({ page }) => {
        const title = await page.title().then(t => t.toLowerCase());
        expect(title.includes('šamanské') || title.includes('kolo') || title.includes('shaman')).toBe(true);
    });

    test('h1 je viditelný', async ({ page }) => {
        await expect(page.locator('h1').first()).toBeVisible();
    });

    test('#mw-form nebo formulář existuje', async ({ page }) => {
        const form = page.locator('#mw-form, form[id*="mw"], .mw-form').first();
        await expect(form).toBeAttached();
    });

    test('stranka rozlisuje kdy pouzit samanske kolo', async ({ page }) => {
        const cluster = page.locator('.mw-intent-section');
        await expect(cluster).toBeVisible();
        await expect(cluster.locator('.mw-intent-card')).toHaveCount(6);
        await expect(cluster.locator('[data-analytics-cta="shaman_wheel_intent_birth"]')).toHaveAttribute('href', '#mw-form-section');
        await expect(cluster.locator('[data-analytics-cta="shaman_wheel_intent_runes"]')).toHaveAttribute('href', /runy\.html/);
        await expect(cluster.locator('[data-analytics-cta="shaman_wheel_intent_mentor"]')).toHaveAttribute('href', /mentor\.html/);
    });

    test('.mw-submit-btn nebo submit tlačítko existuje', async ({ page }) => {
        const btn = page.locator('.mw-submit-btn, button[class*="mw-submit"], button[type="submit"]').first();
        await expect(btn).toBeAttached();
    });

    test('#mw-result-content nebo result container existuje', async ({ page }) => {
        const result = page.locator('#mw-result-content, .mw-result-section, .mw-result').first();
        await expect(result).toBeAttached();
    });

    test('neaktivní kompas používá sdílené SVG místo platformního emoji', async ({ page }) => {
        await expect(page.locator('#mw-center-compass use')).toHaveAttribute('href', '/img/icons/mh-symbols.svg#compass');
        await expect(page.locator('#mw-center-emoji')).toHaveAttribute('display', 'none');
    });

    test('ovládací ikony sdílení používají společný SVG sprite', async ({ page }) => {
        await expect(page.locator('#share-native use')).toHaveAttribute('href', '/img/icons/mh-symbols.svg#share');
        await expect(page.locator('#share-fb use')).toHaveAttribute('href', '/img/icons/mh-symbols.svg#facebook');
        await expect(page.locator('#share-copy use')).toHaveAttribute('href', '/img/icons/mh-symbols.svg#copy');
    });

    test('sdílení totemu nepoužívá systémové emoji ani jméno z formuláře', async ({ page }) => {
        await page.route('**/api/csrf-token', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ csrfToken: 'shaman-share-test-token' })
        }));
        await page.route('**/api/medicine-wheel', route => route.fulfill({
            status: 402,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Premium access required' })
        }));

        await page.locator('#mw-name').fill('Jana Nováková');
        await page.locator('#mw-birth').fill('1988-09-21');
        await page.locator('#mw-submit').click();
        await expect(page.locator('#mw-result')).toHaveClass(/visible/);

        const quote = await page.locator('#share-fb').evaluate(element =>
            new URL(element.href).searchParams.get('quote')
        );
        expect(quote).toContain('Symbolický měsíční totem:');
        expect(quote).toContain('světová strana:');
        expect(quote).not.toContain('Jana');
        expect(quote).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    });

    test('premium gate nebo result container existuje v DOM', async ({ page }) => {
        // Premium wall nebo výsledkový kontejner — jeden z nich musí být přítomen
        const el = page.locator('#mw-premium-wall, .mw-premium-wall, #mw-result, .mw-result').first();
        await expect(el).toBeAttached();
    });

    test('datum pole existuje', async ({ page }) => {
        const dateInput = page.locator('input[type="date"]').first();
        await expect(dateInput).toBeAttached();
    });

    test('datum pole přijímá hodnotu', async ({ page }) => {
        const dateInput = page.locator('input[type="date"]').first();
        if (await dateInput.isVisible()) {
            await dateInput.fill('1988-09-21');
            await expect(dateInput).toHaveValue('1988-09-21');
        }
    });

    // API
    test('POST /api/medicine-wheel bez CSRF vrátí 403', async ({ page }) => {
        const res = await page.request.post('/api/medicine-wheel', {
            data: { birthDate: '1990-01-01' },
        });
        expect(res.status()).toBe(403);
    });

    test('POST /api/medicine-wheel bez auth vrátí 401 nebo 402', async ({ page }) => {
        const csrf = await getCsrfToken(page);
        const res = await page.request.post('/api/medicine-wheel', {
            data: { birthDate: '1990-01-01', name: 'Test' },
            headers: { 'x-csrf-token': csrf },
        });
        expect([400, 401, 402]).toContain(res.status());
    });

    test('žádný horizontální scroll na mobilu', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.goto('/shamansko-kolo.html');
        await waitForPageReady(page);
        const overflow = await page.evaluate(() =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(overflow).toBe(false);
    });
});
