import { test, expect } from '@playwright/test';

for (const path of ['/horoskopy.html', '/partnerska-shoda.html', '/cenik.html']) {
    test(`browsing ${path} never opens an unsolicited promotion`, async ({ page }) => {
        await page.clock.install();
        await page.goto(path);
        await page.addScriptTag({ url: '/js/dist/exit-intent.js' });
        await page.addScriptTag({ url: '/js/dist/newsletter-popup.js' });
        await page.clock.fastForward(65000);
        await page.evaluate(() => {
            document.dispatchEvent(new MouseEvent('mouseleave', { clientY: 0 }));
            document.dispatchEvent(new Event('visibilitychange'));
        });
        await expect(page.locator('#exit-intent-modal, #mh-newsletter-popup, #mh-popup-overlay, #mh-push-banner, #mh-pwa-banner')).toHaveCount(0);
    });
}

test('installation waits for an explicit click, even on a repeat visit', async ({ page }) => {
    await page.clock.install();
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.setItem('mh_pwa_visits', '10');
        const button = document.createElement('button');
        button.id = 'install-app-btn';
        button.textContent = 'Install test';
        button.hidden = true;
        document.body.append(button);
    });
    await page.addScriptTag({ url: '/js/dist/pwa-install.js' });
    await page.evaluate(() => {
        window.__installCalls = 0;
        const event = new Event('beforeinstallprompt', { cancelable: true });
        event.prompt = async () => { window.__installCalls++; };
        event.userChoice = Promise.resolve({ outcome: 'dismissed' });
        window.dispatchEvent(event);
    });
    await page.clock.fastForward(65000);
    expect(await page.evaluate(() => window.__installCalls)).toBe(0);
    await expect(page.locator('#mh-pwa-banner')).toHaveCount(0);
    await page.locator('#install-app-btn').click();
    expect(await page.evaluate(() => window.__installCalls)).toBe(1);
});

test('Slovak entry loads shared navigation and consent assets from the site root', async ({ page }) => {
    const incorrect = [];
    page.on('request', request => {
        if (/\/sk\/(js\/|components\/)/.test(new URL(request.url()).pathname)) incorrect.push(request.url());
    });
    await page.goto('/sk/tarot-ano-nie.html');
    await expect(page.locator('.header nav')).toBeAttached();
    await expect.poll(() => page.evaluate(() => Boolean(window.MH_COOKIE_HANDLER_INIT))).toBe(true);
    expect(incorrect).toEqual([]);
});
