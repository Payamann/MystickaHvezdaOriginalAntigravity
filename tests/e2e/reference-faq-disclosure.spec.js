import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

test.describe('sbalené FAQ zachovává hlavní nabídku i limity', () => {
    test('numerologie ponechá cenu viditelnou a doplňující odpověď ovladatelnou klávesnicí', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));

        await page.goto('/numerologie.html');
        await waitForPageReady(page);

        const questions = page.locator('details.faq-disclosure');
        await expect(questions).toHaveCount(3);
        for (let index = 0; index < 3; index += 1) {
            await expect(questions.nth(index)).not.toHaveAttribute('open', '');
        }
        await expect(page.getByText(/Základní výpočet čísel je zdarma/)).toBeVisible();
        await expect(page.getByText(/prémiového členství se 7 dny zdarma/)).toBeVisible();

        const firstSummary = questions.nth(0).locator('summary');
        await firstSummary.focus();
        await firstSummary.press('Enter');
        await expect(questions.nth(0)).toHaveAttribute('open', '');
        await expect(questions.nth(0)).toContainText('Kalkulačka to udělá za tebe.');
        await firstSummary.press('Space');
        await expect(questions.nth(0)).not.toHaveAttribute('open', '');
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        expect(pageErrors).toEqual([]);
    });

    test('runy ponechají bezplatný denní limit viditelný a vysvětlující FAQ sbalitelné', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));

        await page.goto('/runy.html');
        await waitForPageReady(page);

        const questions = page.locator('details.faq-disclosure');
        await expect(questions).toHaveCount(3);
        for (let index = 0; index < 3; index += 1) {
            await expect(questions.nth(index)).not.toHaveAttribute('open', '');
        }
        await expect(page.locator('article.card').filter({ hasText: 'Jak výklad run funguje?' }))
            .toContainText('Jednu runu denně si můžeš vytáhnout zdarma.');

        const summary = questions.nth(0).locator('summary');
        await summary.focus();
        await summary.press('Space');
        await expect(questions.nth(0)).toHaveAttribute('open', '');
        await expect(questions.nth(0)).toContainText('24 znaků');
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        expect(pageErrors).toEqual([]);
    });

    test('šest dalších tematických stránek drží 24 odpovědí zavřených a ovladatelných', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        const urls = [
            '/aura.html',
            '/biorytmy.html',
            '/cinsky-horoskop.html',
            '/tydenni-horoskop.html',
            '/mesicni-horoskop.html',
            '/tarot-karta-dne.html'
        ];
        let totalQuestions = 0;

        for (const url of urls) {
            const response = await page.goto(url);
            expect(response?.status(), url).toBe(200);
            await waitForPageReady(page);
            await expect(page.locator('h1').first(), url).toBeVisible();

            const questions = page.locator('details.faq-disclosure');
            const count = await questions.count();
            expect(count, url).toBe(4);
            totalQuestions += count;
            for (let index = 0; index < count; index += 1) {
                await expect(questions.nth(index), `${url} FAQ ${index + 1}`).not.toHaveAttribute('open', '');
            }

            const summary = questions.first().locator('summary');
            await summary.focus();
            await summary.press('Enter');
            await expect(questions.first()).toHaveAttribute('open', '');
            await expect(questions.first().locator('p').first()).toBeVisible();
            await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), url).toBe(true);
        }

        expect(totalQuestions).toBe(24);
        expect(pageErrors).toEqual([]);
    });
});
