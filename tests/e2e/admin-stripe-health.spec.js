import { test, expect } from '@playwright/test';

async function openAdminWithStripeAudit(page, audit) {
    await page.context().addCookies([{
        name: 'logged_in',
        value: '1',
        url: process.env.PLAYWRIGHT_BASE_URL,
    }]);
    await page.route('**/api/auth/profile', route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
            success: true,
            user: { id: 'admin-e2e', email: 'admin@example.com', role: 'admin' },
        }),
    }));
    await page.route('**/api/admin/**', route => {
        if (route.request().url().includes('/stripe-webhook-health')) {
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, audit }),
            });
        }
        return route.fulfill({
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({ success: false, error: 'Mocked unrelated admin endpoint' }),
        });
    });
    await page.goto('/admin.html');
}

test.describe('Admin Stripe webhook health', () => {
    test('shows complete event coverage without horizontal mobile overflow', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await openAdminWithStripeAudit(page, {
            healthy: true,
            requiredEvents: Array.from({ length: 11 }, (_, index) => `event.${index}`),
            missingEvents: [],
            checkedAt: '2026-08-27T18:00:00.000Z',
            cached: false,
        });

        const health = page.locator('#stripe-webhook-health');
        await expect(health).toHaveClass(/admin-stripe-health--healthy/);
        await expect(health).toContainText('11/11 událostí');
        await expect(health.locator('button')).toHaveCSS('min-height', '44px');
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        expect(overflow).toBe(false);
    });

    test('names missing Stripe events and refreshes on demand', async ({ page }) => {
        const requests = [];
        await page.context().addCookies([{
            name: 'logged_in', value: '1', url: process.env.PLAYWRIGHT_BASE_URL,
        }]);
        await page.route('**/api/auth/profile', route => route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, user: { email: 'admin@example.com', role: 'admin' } }),
        }));
        await page.route('**/api/admin/**', route => {
            if (route.request().url().includes('/stripe-webhook-health')) {
                requests.push(route.request().url());
                return route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        audit: {
                            healthy: false,
                            requiredEvents: Array.from({ length: 11 }, (_, index) => `event.${index}`),
                            missingEvents: ['checkout.session.expired'],
                            checkedAt: '2026-08-27T18:00:00.000Z',
                        },
                    }),
                });
            }
            return route.fulfill({ status: 403, contentType: 'application/json', body: '{}' });
        });

        await page.goto('/admin.html');
        const health = page.locator('#stripe-webhook-health');
        await expect(health).toContainText('checkout.session.expired');
        await health.locator('button').click();
        await expect.poll(() => requests.some(url => url.endsWith('?refresh=1'))).toBe(true);
    });
});
