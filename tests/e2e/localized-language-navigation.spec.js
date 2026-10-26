import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

test('language choice follows the equivalent page in both directions', async ({ page }) => {
    await page.goto('/natalni-karta.html?source=test');
    const choice = page.locator('[data-language-select]');
    await expect(choice).toHaveValue('cs');
    await expect(page.locator('.footer__languages a[lang="sk"]')).toHaveAttribute('href', '/sk/natalni-karta.html');
    await choice.selectOption('sk');
    await expect(page).toHaveURL(/\/sk\/natalni-karta\.html$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'sk');
    await expect(page.locator('[data-language-select]')).toHaveValue('sk');
    await page.locator('[data-language-select]').selectOption('pl');
    await expect(page).toHaveURL(/\/pl\/natalni-karta\.html$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
    await expect(page.locator('.footer__languages a[lang="cs"]')).toHaveAttribute('href', '/natalni-karta.html');
    await page.locator('[data-language-select]').selectOption('en');
    await expect(page).toHaveURL(/\/en\/birth-chart\.html$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.footer__languages a[lang="sk"]')).toHaveAttribute('href', '/sk/natalni-karta.html');
    await page.locator('[data-language-select]').selectOption('cs');
    await expect.poll(() => new URL(page.url()).pathname).toBe('/natalni-karta.html');
});

test('locale homes and an untranslated tool use real, clearly labelled destinations', async ({ page }) => {
    await page.goto('/sk/');
    await expect(page.locator('.footer__languages a[lang="pl"]')).toHaveAttribute('href', '/pl/');
    await page.goto('/numerologie.html');
    await expect(page.locator('.footer__languages a[lang="cs"]')).toHaveAttribute('href', '/numerologie.html');
    const fallback = page.locator('.footer__languages a[lang="sk"]');
    await expect(fallback).toHaveAttribute('href', '/sk/');
    await expect(fallback).toHaveAttribute('title', /úvod/);
    await expect(fallback).toContainText('úvod');
    await page.locator('[data-language-select]').selectOption('sk');
    await expect(page).toHaveURL(/\/sk\/$/);
});

test('Slovak-only yes/no tarot never invents a Polish translation', async ({ page }) => {
    await page.goto('/sk/tarot-ano-nie.html');
    await expect(page.locator('.footer__languages a[lang="cs"]')).toHaveAttribute('href', '/tarot-ano-ne.html');
    await expect(page.locator('.footer__languages a[lang="pl"]')).toHaveAttribute('href', '/pl/');
    await expect(page.locator('.footer__languages a[lang="pl"]')).toHaveAttribute('title', /úvod/);
    await expect(page.locator('.footer__languages a[lang="en"]')).toHaveAttribute('href', '/en/');
});

for (const locale of ['sk', 'pl']) {
    test(`${locale} horoscope CTA stays in the same language`, async ({ page }) => {
        await page.goto(`/${locale}/horoskopy.html`);
        const cta = page.locator('main a[href="natalni-karta.html"]').first();
        await cta.click();
        await expect(page).toHaveURL(new RegExp(`/${locale}/natalni-karta\\.html$`));
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
    });
}

test('localized language control fits the desktop header and mobile menu', async ({ page }) => {
    const directory = new URL('../../../../docs/sk-pl-preparation-2026-10-26/', import.meta.url);
    await fs.mkdir(directory, { recursive: true });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/pl/natalni-karta.html');
    const choice = page.locator('[data-language-select]');
    await expect(choice).toBeVisible();
    const desktop = await choice.boundingBox();
    expect(desktop.x).toBeGreaterThanOrEqual(0);
    expect(desktop.x + desktop.width).toBeLessThanOrEqual(1280);
    const form = await page.locator('#natal-form').boundingBox();
    const date = await page.locator('#birth-date').boundingBox();
    const time = await page.locator('#birth-time').boundingBox();
    const submit = await page.locator('#calculate-natal').boundingBox();
    expect(time.y).toBeGreaterThan(date.y + date.height);
    expect(submit.x + submit.width).toBeLessThanOrEqual(form.x + form.width + 1);
    expect(submit.y).toBeGreaterThan(time.y + time.height);
    await page.screenshot({ path: fileURLToPath(new URL('pl-natal-desktop.png', directory)) });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.nav__toggle').click();
    await expect(choice).toBeVisible();
    await expect(page.locator('.nav__toggle')).toHaveAttribute('aria-expanded', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
    await page.screenshot({ path: fileURLToPath(new URL('pl-natal-mobile-menu.png', directory)) });
    await page.keyboard.press('Escape');
    await expect(page.locator('.nav__toggle')).toHaveAttribute('aria-expanded', 'false');
    const mobileInput = await page.locator('#birth-place').boundingBox();
    expect(mobileInput.x).toBeGreaterThanOrEqual(0);
    expect(mobileInput.x + mobileInput.width).toBeLessThanOrEqual(390);
    await page.screenshot({ path: fileURLToPath(new URL('pl-natal-mobile.png', directory)) });
    await page.goto('/en/birth-chart.html');
    await expect(page.locator('main h1')).toContainText('Birth chart');
    await page.screenshot({ path: fileURLToPath(new URL('en-birth-chart-mobile.png', directory)) });
    await page.setViewportSize({ width: 1280, height: 800 });
    const englishChoice = await page.locator('[data-language-select]').boundingBox();
    const register = await page.locator('#auth-register-btn').boundingBox();
    expect(englishChoice.x + englishChoice.width).toBeLessThanOrEqual(register.x);
    await page.screenshot({ path: fileURLToPath(new URL('en-birth-chart-desktop.png', directory)) });
});
