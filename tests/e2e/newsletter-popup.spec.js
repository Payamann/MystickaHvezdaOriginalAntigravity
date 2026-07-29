import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

test.describe('Newsletter popup', () => {
    test('po odberu nabidne registraci s predvyplnenym e-mailem a aktivacnim kontextem', async ({ page }) => {
        let subscribePayload = null;
        let horoscopePayload = null;

        await page.route('**/api/csrf-token', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ csrfToken: 'test.csrf.token' })
            });
        });

        await page.route('**/api/newsletter/subscribe', async (route) => {
            subscribePayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.route('**/api/subscribe/horoscope', async (route) => {
            horoscopePayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.goto('/tarot.html');
        await waitForPageReady(page);

        await page.dispatchEvent('body', 'mouseleave', { clientY: 0 });
        await expect(page.locator('#mh-newsletter-popup')).toBeVisible();

        await page.locator('#mh-popup-email').fill('lead@example.com');
        await page.locator('#mh-popup-submit').click();

        // Popup je dvoukrokový (js/newsletter-popup.js): po odběru newsletteru
        // nabídne ještě výběr znamení pro denní horoskop a teprve po něm ukáže
        // registrační CTA. Test dřív čekal starý text "Skvělé" a odkaz hned
        // po prvním kroku — proto padal každou noc.
        await expect(page.locator('.mh-popup-msg--success')).toContainText('Odběr aktivní');

        // Krok 2 — výběr znamení
        await page.selectOption('#mh-popup-sign', 'Lev');
        await page.locator('#mh-popup-sign-submit').click();

        await expect(page.locator('.mh-popup-msg--success')).toContainText('Hotovo');
        expect(horoscopePayload).toEqual({ email: 'lead@example.com', zodiac_sign: 'Lev' });

        const registerLink = page.locator('.mh-popup-register-link');
        await expect(registerLink).toBeVisible();

        const href = await registerLink.getAttribute('href');
        const registerUrl = new URL(href, page.url());
        expect(registerUrl.pathname).toBe('/prihlaseni.html');
        expect(registerUrl.searchParams.get('mode')).toBe('register');
        expect(registerUrl.searchParams.get('redirect')).toBe('/horoskopy.html');
        expect(registerUrl.searchParams.get('source')).toBe('newsletter_popup');
        expect(registerUrl.searchParams.get('feature')).toBe('daily_guidance');
        expect(registerUrl.searchParams.get('email')).toBe('lead@example.com');
        expect(subscribePayload).toEqual({
            email: 'lead@example.com',
            source: 'web_popup'
        });
    });
});
