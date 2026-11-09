import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

const CURRENT_MESSAGE = 'Hojení není slib ani povinnost cítit se lépe. Jakou podporu nebo péči můžeš bezpečně vyhledat?';

test('detail denní karty bez uložených dat zobrazí aktuální obsah', async ({ page }) => {
    await page.goto('/andelske-karty.html?daily_card=hojeni');
    await waitForPageReady(page);
    await expect(page.locator('#angel-short-message')).toHaveText(CURRENT_MESSAGE);
});

test('zastaralá uložená karta nepřebije aktuální obsah známého odkazu', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('mh_kdd_card', JSON.stringify({
            date: '2000-01-01', slug: 'hojeni',
            card: { name: 'Hojení', keyword: 'Uzdravení', text: 'Zastaralá uložená verze.' }
        }));
    });
    await page.goto('/andelske-karty.html?daily_card=hojeni');
    await waitForPageReady(page);
    await expect(page.locator('#angel-short-message')).toHaveText(CURRENT_MESSAGE);
});
