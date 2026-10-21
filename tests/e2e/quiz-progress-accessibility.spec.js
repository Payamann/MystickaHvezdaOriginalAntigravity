import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

const quizPages = [
    '/testy/archetyp-duse.html',
    '/testy/barva-aury.html',
    '/testy/dar-intuice.html',
    '/testy/karmicke-dedictvi.html',
    '/testy/stin-znameni.html',
    '/testy/totem-pruvodce.html',
    '/testy/zivlova-rovnovaha.html'
];

test.describe('Přístupný průběh osobnostních kvízů', () => {
    for (const path of quizPages) {
        test(`${path} keeps keyboard focus and reports completed questions`, async ({ page }) => {
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await page.goto(path);
            await waitForPageReady(page);

            const progress = page.getByRole('progressbar', { name: 'Průběh kvízu' });
            await expect(progress).toHaveAttribute('aria-valuenow', '0');
            await expect(page.locator('.question-step.active h3')).toHaveAttribute('tabindex', '-1');

            for (let answered = 0; answered < 7; answered += 1) {
                await page.locator('.question-step.active .option-btn').first().click();

                if (answered < 6) {
                    const nextHeading = page.locator(`.question-step[data-step="${answered + 2}"] h3`);
                    await expect(nextHeading).toBeFocused();
                    if (answered === 0) {
                        await expect(progress).toHaveAttribute('aria-valuenow', '15');
                        await expect(progress).toHaveAttribute('aria-valuetext', '15% dokončeno');
                    }
                } else {
                    await expect(page.locator('#result-step')).toBeFocused();
                }
            }

            await expect(progress).toHaveAttribute('aria-valuenow', '100');
            await expect(progress).toHaveAttribute('aria-valuetext', '100% dokončeno');
        });
    }
});
