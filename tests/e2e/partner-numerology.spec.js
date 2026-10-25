import { test, expect } from '@playwright/test';
import { waitForPageReady, MOBILE_VIEWPORT } from './helpers.js';

test.describe('Partnerská numerologie', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/partnerska-numerologie.html');
        await waitForPageReady(page);
    });

    test('spočítá modelovou dvojici 11 a 4 a odkáže na oba významy', async ({ page }, testInfo) => {
        await page.locator('#partner-date-a').fill('1990-05-14');
        await page.locator('#partner-date-b').fill('1992-02-08');
        await page.getByRole('button', { name: 'Spočítat životní čísla' }).click();

        const result = page.locator('#partner-numerology-result');
        const cards = result.locator('.partner-result-card');
        await expect(result).toBeVisible();
        await expect(result).toBeFocused();
        await expect(cards.nth(0).locator('.partner-result-card__number')).toHaveText('11');
        await expect(cards.nth(1).locator('.partner-result-card__number')).toHaveText('4');
        await expect(cards.nth(0).getByRole('link')).toHaveAttribute('href', '/numerologie/zivotni-cislo-11.html');
        await expect(cards.nth(1).getByRole('link')).toHaveAttribute('href', '/numerologie/zivotni-cislo-4.html');
        await expect(result).not.toContainText(/procent|skóre shody|vztah vydrží/i);
        expect(page.url()).not.toContain('1990-05-14');
        expect(page.url()).not.toContain('1992-02-08');
        await result.scrollIntoViewIfNeeded();
        await page.screenshot({ path: testInfo.outputPath('pair-result.png') });
        const storedValues = await page.evaluate(() => Object.values(localStorage));
        expect(storedValues.join(' ')).not.toContain('1990-05-14');
        expect(storedValues.join(' ')).not.toContain('1992-02-08');
    });

    test('zachová mistrovská čísla 22 a 33 podle sdíleného výpočtu', async ({ page }) => {
        await page.locator('#partner-date-a').fill('1970-03-11');
        await page.locator('#partner-date-b').fill('1970-03-22');
        await page.getByRole('button', { name: 'Spočítat životní čísla' }).click();

        await expect(page.locator('.partner-result-card__number')).toHaveText(['22', '33']);
    });

    test('odmítne budoucí datum a přesune fokus na chybné pole', async ({ page }) => {
        await page.locator('#partner-date-a').fill('1990-05-14');
        await page.locator('#partner-date-b').fill('2099-01-01');
        await page.getByRole('button', { name: 'Spočítat životní čísla' }).click();

        await expect(page.locator('#partner-form-error')).toContainText('není v budoucnosti');
        await expect(page.locator('#partner-date-b')).toHaveAttribute('aria-invalid', 'true');
        await expect(page.locator('#partner-date-b')).toBeFocused();
        await expect(page.locator('#partner-numerology-result')).toBeHidden();
    });

    test('po editaci data odstraní zastaralý výsledek', async ({ page }) => {
        await page.locator('#partner-date-a').fill('1990-05-14');
        await page.locator('#partner-date-b').fill('1992-02-08');
        await page.getByRole('button', { name: 'Spočítat životní čísla' }).click();
        await expect(page.locator('#partner-numerology-result')).toBeVisible();

        await page.locator('#partner-date-a').fill('1991-05-14');
        await expect(page.locator('#partner-numerology-result')).toBeHidden();
        await expect(page.locator('#partner-result-cards')).toBeEmpty();
    });

    test('formulář a výsledek na mobilu nepřetékají vodorovně', async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT);
        await page.reload();
        await waitForPageReady(page);
        await page.locator('#partner-date-a').fill('1990-05-14');
        await page.locator('#partner-date-b').fill('1992-02-08');
        await page.getByRole('button', { name: 'Spočítat životní čísla' }).click();

        await expect(page.locator('#partner-numerology-result')).toBeVisible();
        const hasHorizontalScroll = await page.evaluate(() =>
            document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(hasHorizontalScroll).toBe(false);
    });
});
