import fs from 'node:fs';
import vm from 'node:vm';
import { jest } from '@jest/globals';

const source = fs.readFileSync(new URL('../../js/horoscope.js', import.meta.url), 'utf8');

function createRuntime({ lang = 'cs', pathname = '/horoskopy.html' } = {}) {
    const document = {
        documentElement: { lang },
        addEventListener: jest.fn()
    };
    const window = {
        location: { pathname, origin: 'https://www.mystickahvezda.cz' }
    };
    const context = vm.createContext({ document, window, URL, console });
    vm.runInContext(source, context);
    return { context, document, window };
}

test('keeps Czech horoscope client copy and behavior as the default', () => {
    const { context } = createRuntime();
    const copy = vm.runInContext('getHoroscopeUiCopy()', context);
    const markup = vm.runInContext("buildHoroscopeUpsell('weekly')", context);

    expect(vm.runInContext('getHoroscopeLanguage()', context)).toBe('cs');
    expect(copy.periodLabels.weekly).toBe('Tydenni horoskop');
    expect(copy.periodDateLabels.weekly).toBe('Tento tyden');
    expect(copy.loadError).toBe('Výklad se teď nepodařilo načíst. Zkus to prosím později.');
    expect(markup).toContain('Odemknout Hvezdneho Pruvodce');
    expect(markup).toContain('data-feature="weekly_horoscope"');
    expect(markup).toContain('/cenik.html?plan=pruvodce&source=horoscope_inline_upsell');
});

test.each([
    ['sk', '/sk/horoskopy.html', 'Týždenný horoskop', 'Tento týždeň', 'Načítavam horoskop…', 'Odomkni si týždenný výhľad'],
    ['pl', '/pl/horoskopy.html', 'Horoskop tygodniowy', 'W tym tygodniu', 'Wczytuję horoskop…', 'Odblokuj horoskop tygodniowy'],
    ['en', '/en/horoscopes.html', 'Weekly horoscope', 'This week', 'Loading horoscope…', 'Unlock your weekly outlook']
])('uses localized period, loading, error, and membership copy for %s', (lang, pathname, periodLabel, dateLabel, loadingLabel, upsellTitle) => {
    const { context } = createRuntime({ lang, pathname });
    const copy = vm.runInContext('getHoroscopeUiCopy()', context);
    const markup = vm.runInContext("buildHoroscopeUpsell('weekly')", context);

    expect(vm.runInContext('getHoroscopeLanguage()', context)).toBe(lang);
    expect(copy.periodLabels.weekly).toBe(periodLabel);
    expect(copy.periodDateLabels.weekly).toBe(dateLabel);
    expect(copy.loadingLabel).toBe(loadingLabel);
    if (lang === 'en') {
        expect(copy.loadingMessages.join(' ')).toContain('Loading your sign');
        expect(copy.loadError).toContain('could not be loaded');
        expect(copy.limitError).toContain('today’s horoscope limit');
        expect(copy.upsell.notice).toContain('currently in Czech');
    } else {
        expect(copy.loadingMessages.join(' ')).toContain(lang === 'sk' ? 'Načítavam horoskop' : 'Wczytuję horoskop');
        expect(copy.loadError).toContain(lang === 'sk' ? 'Horoskop sa teraz' : 'horoskopu');
        expect(copy.limitError).toContain(lang === 'sk' ? 'Dnešný limit horoskopov' : 'dzisiejszy limit horoskopów');
    }
    expect(markup).toContain(upsellTitle);
    expect(markup).toContain('data-feature="weekly_horoscope"');
    expect(markup).toContain('/cenik.html?plan=pruvodce&source=horoscope_inline_upsell');
});

test.each([
    ['sk', '/sk/horoskopy.html', 'Nepodarilo sa uložiť. Skús to znova.'],
    ['pl', '/pl/horoskopy.html', 'Nie udało się zapisać. Spróbuj ponownie.']
])('shows localized saved-feedback errors for %s', async (lang, pathname, errorText) => {
    const { context, window } = createRuntime({ lang, pathname });
    const status = { textContent: '', dataset: {} };
    const strip = { querySelector: () => status };
    const trigger = { disabled: false };
    context.strip = strip;
    context.trigger = trigger;
    window.Auth = { saveReadingFeedback: jest.fn().mockResolvedValue({ success: false }) };

    const result = await vm.runInContext("saveHoroscopeFeedback('reading-id', {}, strip, trigger)", context);

    expect(result).toBeNull();
    expect(status.textContent).toBe(errorText);
    expect(status.dataset.state).toBe('error');
    expect(trigger.disabled).toBe(false);
    expect(window.Auth.saveReadingFeedback).toHaveBeenCalledWith('reading-id', expect.objectContaining({
        feature: 'daily_guidance',
        source: 'horoscope_feedback_strip'
    }));
});

test('preserves path-based language selection if an older page has a mismatched html lang', () => {
    const { context } = createRuntime({ lang: 'cs', pathname: '/sk/horoskopy.html' });
    expect(vm.runInContext('getHoroscopeLanguage()', context)).toBe('sk');
});
