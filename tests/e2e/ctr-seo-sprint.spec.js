import { test, expect } from '@playwright/test';

test.describe('CTR SEO sprint smoke', () => {
    test('/horoskop/beran.html matches Aries intent and measured natal CTA', async ({ page }) => {
        const response = await page.goto('/horoskop/beran.html', { waitUntil: 'domcontentloaded' });
        expect(response.status()).toBe(200);

        await expect(page).toHaveTitle(/Beran \/ Aries znamení/);
        await expect(page.getByText('Beran je Aries, první znamení zvěrokruhu')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Vygenerovat Natální kartu' })).toHaveAttribute(
            'href',
            '../natalni-karta.html?source=seo_zodiac_sign&feature=natal_chart&sign=beran'
        );
    });

    test('/andelske-karty.html separates daily angel card from deeper reading', async ({ page }) => {
        const response = await page.goto('/andelske-karty.html', { waitUntil: 'domcontentloaded' });
        expect(response.status()).toBe(200);

        await expect(page).toHaveTitle(/Andělská karta dne online/);
        await expect(page.locator('h1').first()).toContainText('Andělská karta dne');
        await expect(page.locator('#draw-btn')).toHaveAttribute('aria-label', 'Vytáhnout andělskou kartu');
        await expect(page.getByText('Jaký je rozdíl mezi kartou dne a andělským výkladem?')).toBeVisible();
    });

    for (const slug of ['sagittarius-pisces', 'aquarius-taurus', 'capricorn-leo', 'virgo-leo']) {
        test(`/partnerska-shoda/${slug}.html keeps measured pair CTA`, async ({ page }) => {
            const response = await page.goto(`/partnerska-shoda/${slug}.html`, { waitUntil: 'domcontentloaded' });
            expect(response.status()).toBe(200);

            expect(await page.title()).toMatch(/ve vztahu \| Partnerská shoda/);
            await expect(page.getByRole('link', { name: 'Vypočítat Synastrii Zdarma' })).toHaveAttribute(
                'href',
                `../partnerska-shoda.html?source=seo_partner_pair&feature=compatibility&pair=${slug}#form`
            );
        });
    }

    for (const [path, intent] of [
        ['/sk/kristalova-koule.html', 'Krištáľová guľa áno alebo nie'],
        ['/pl/kristalova-koule.html', 'Kryształowa kula tak czy nie']
    ]) {
        test(`${path} keeps yes-no intent and hreflang`, async ({ page }) => {
            const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
            expect(response.status()).toBe(200);

            await expect(page).toHaveTitle(new RegExp(intent));
            await expect(page.getByText(intent)).toBeVisible();
            await expect(page.locator('link[rel="alternate"][hreflang="cs"]')).toHaveAttribute('href', /kristalova-koule\.html/);
            await expect(page.locator('link[rel="alternate"][hreflang="sk"]')).toHaveAttribute('href', /sk\/kristalova-koule\.html/);
            await expect(page.locator('link[rel="alternate"][hreflang="pl"]')).toHaveAttribute('href', /pl\/kristalova-koule\.html/);
        });
    }
});
