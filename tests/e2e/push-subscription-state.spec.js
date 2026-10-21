import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const pushBundlePath = fileURLToPath(new URL('../../js/dist/push-notifications.js', import.meta.url));
const fixturePath = '/__push-subscription-fixture';

async function preparePushFixture(page, { storedStatus, subscription, lookupFails = false }) {
    await page.route(`**${fixturePath}`, (route) => route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: '<!doctype html><html lang="cs"><body><button id="subscribe-push-btn" type="button" hidden>Odebírat</button></body></html>'
    }));
    await page.goto(fixturePath);
    await page.evaluate(({ storedStatus: status, currentSubscription, lookupFails: shouldFail }) => {
        if (status) localStorage.setItem('mh_push_subscribed', status);
        else localStorage.removeItem('mh_push_subscribed');

        Object.defineProperty(navigator, 'serviceWorker', {
            configurable: true,
            value: {
                ready: Promise.resolve({
                    pushManager: {
                        getSubscription: async () => {
                            if (shouldFail) throw new Error('Synthetic subscription lookup failure');
                            return currentSubscription;
                        }
                    }
                })
            }
        });
        Object.defineProperty(window, 'PushManager', {
            configurable: true,
            value: function PushManager() {}
        });
    }, { storedStatus, currentSubscription: subscription, lookupFails });

    await page.addScriptTag({ path: pushBundlePath });
}

test('clears a stale local active flag when the browser has no subscription', async ({ page }) => {
    await preparePushFixture(page, { storedStatus: 'active', subscription: null });

    const button = page.locator('#subscribe-push-btn');
    await expect(button).toBeVisible();
    await expect(button).toContainText('Odebírat denní horoskop');
    await expect(button).not.toHaveClass(/btn--active/);
    expect(await page.evaluate(() => localStorage.getItem('mh_push_subscribed'))).toBeNull();
});

test('shows the active action when a browser subscription exists but localStorage is empty', async ({ page }) => {
    await preparePushFixture(page, {
        storedStatus: null,
        subscription: { endpoint: 'https://push.example/subscription' }
    });

    const button = page.locator('#subscribe-push-btn');
    await expect(button).toBeVisible();
    await expect(button).toContainText('Zrušit odběr horoskopu');
    await expect(button).toHaveClass(/btn--active/);
    expect(await page.evaluate(() => localStorage.getItem('mh_push_subscribed'))).toBe('active');
});

test('uses localStorage only when the browser cannot read its subscription', async ({ page }) => {
    await preparePushFixture(page, {
        storedStatus: 'active',
        subscription: null,
        lookupFails: true
    });

    const button = page.locator('#subscribe-push-btn');
    await expect(button).toBeVisible();
    await expect(button).toContainText('Zrušit odběr horoskopu');
    await expect(button).toHaveClass(/btn--active/);
});
