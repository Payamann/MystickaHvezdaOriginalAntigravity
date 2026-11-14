import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers.js';

const CURRENT_MESSAGE = 'Hojení není slib ani povinnost cítit se lépe. Jakou podporu nebo péči můžeš bezpečně vyhledat?';

test('tažená karta používá nový pražský den před půlnocí UTC', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-15T23:15:00Z'));
    await page.goto('/andelske-karty.html');
    await waitForPageReady(page);
    await page.locator('#draw-btn').click();
    const daily = () => page.evaluate(() => JSON.parse(localStorage.getItem('angelCardDaily') || 'null'));
    await expect.poll(daily).toMatchObject({ date: '2026-11-16' });
    const saved = await daily();
    await page.reload();
    await waitForPageReady(page);
    await expect.poll(daily).toEqual(saved);
    await expect(page.locator('#angel-short-message')).toHaveText(saved.cardData.short_message);
});

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
