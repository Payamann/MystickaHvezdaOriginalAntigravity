import { jest } from '@jest/globals';
import {
    buildFallbackDailyHoroscope,
    filterDueSubscriptions,
    formatHoroscopeForEmail,
    getDailyHoroscopeDateKey,
    getOrGenerateHoroscope,
    normalizeSignKey,
    resolveSupabaseUrl
} from '../scripts/send-daily-horoscope.js';

describe('daily horoscope email script', () => {
    // Cache drží horoskop jako JSON; bez rozbalení by odběratelům přišel syrový JSON.
    test('rozbali JSON z cache do citelneho textu vcetne afirmace a cisel', () => {
        const raw = JSON.stringify({
            prediction: 'Dnes se ti vyplatí zpomalit.',
            affirmation: 'Volím klidný krok.',
            luckyNumbers: [3, 7, 11, 22]
        });

        const out = formatHoroscopeForEmail(raw);
        expect(out).toContain('Dnes se ti vyplatí zpomalit.');
        expect(out).toContain('Afirmace: Volím klidný krok.');
        expect(out).toContain('Čísla štěstí: 3, 7, 11, 22');
        expect(out).not.toMatch(/[✨🔢]/u);
        expect(out).not.toContain('{');
    });

    test('starsi zaznamy v prostem textu nechá beze zmeny', () => {
        expect(formatHoroscopeForEmail('Prostý text bez JSONu.')).toBe('Prostý text bez JSONu.');
        expect(formatHoroscopeForEmail('')).toBe('');
        expect(formatHoroscopeForEmail(null)).toBe('');
    });

    test('nevalidni nebo neuplny JSON neshodi formatovani', () => {
        expect(formatHoroscopeForEmail('{neplatny json')).toBe('{neplatny json');
        // objekt bez prediction se vrací tak, jak přišel (radši syrový než prázdný e-mail)
        const bezPredikce = JSON.stringify({ affirmation: 'x' });
        expect(formatHoroscopeForEmail(bezPredikce)).toBe(bezPredikce);
    });

    test('normalizes Supabase project refs for standalone script usage', () => {
        expect(resolveSupabaseUrl('abcd1234')).toBe('https://abcd1234.supabase.co');
        expect(resolveSupabaseUrl('https://example.supabase.co')).toBe('https://example.supabase.co');
    });

    test('uses Prague calendar day for idempotency', () => {
        expect(getDailyHoroscopeDateKey(new Date('2026-05-02T06:30:00Z'))).toBe('2026-05-02');
        expect(getDailyHoroscopeDateKey(new Date('2026-05-01T22:30:00Z'))).toBe('2026-05-02');
    });

    test('filters out subscribers already sent today', () => {
        const now = new Date('2026-05-02T07:05:00Z');
        const due = filterDueSubscriptions([
            { email: 'never@example.com', active: true, last_sent_at: null },
            { email: 'yesterday@example.com', active: true, last_sent_at: '2026-05-01T07:00:00Z' },
            { email: 'today@example.com', active: true, last_sent_at: '2026-05-02T07:00:00Z' },
            { email: 'inactive@example.com', active: false, last_sent_at: null },
            { email: 'invalid-date@example.com', active: true, last_sent_at: 'not-a-date' }
        ], now);

        expect(due.map(item => item.email)).toEqual([
            'never@example.com',
            'yesterday@example.com',
            'invalid-date@example.com'
        ]);
    });

    test('normalizes Czech sign names for fallback lookup', () => {
        expect(normalizeSignKey('Býk')).toBe('byk');
        expect(normalizeSignKey('Střelec')).toBe('strelec');
        expect(normalizeSignKey('Vodnář')).toBe('vodnar');
    });

    test('builds non-empty sign-specific fallback when AI providers are unavailable', () => {
        const now = new Date('2026-05-09T07:05:00Z');
        const beran = buildFallbackDailyHoroscope('Beran', now);
        const ryby = buildFallbackDailyHoroscope('Ryby', now);

        expect(beran).toContain('Beran');
        expect(ryby).toContain('Ryby');
        expect(beran).not.toBe(ryby);
        expect(beran.length).toBeGreaterThan(120);
    });
});


describe('daily horoscope OpenAI generation', () => {
    const now = new Date('2026-05-09T07:05:00Z');
    function dependencies() {
        return {
            callAI: jest.fn().mockResolvedValue('Čerstvý horoskop.'),
            callGemini: jest.fn(),
            SYSTEM_PROMPTS: { horoscope: 'System prompt' },
            getHoroscopeCacheKey: jest.fn().mockReturnValue('daily-key'),
            getCachedHoroscope: jest.fn().mockResolvedValue(null),
            saveCachedHoroscope: jest.fn().mockResolvedValue(undefined)
        };
    }
    test('cached content avoids generation', async () => {
        const deps = dependencies();
        deps.getCachedHoroscope.mockResolvedValue({ response: 'Uložený horoskop.' });
        await expect(getOrGenerateHoroscope('Beran', now, deps)).resolves.toBe('Uložený horoskop.');
        expect(deps.callAI).not.toHaveBeenCalled();
        expect(deps.callGemini).not.toHaveBeenCalled();
    });
    test('new generation uses shared OpenAI budget profile', async () => {
        const deps = dependencies();
        await expect(getOrGenerateHoroscope('Beran', now, deps)).resolves.toBe('Čerstvý horoskop.');
        expect(deps.callAI).toHaveBeenCalledWith('System prompt', expect.any(String), null, { feature: 'horoscope_daily' });
        expect(deps.callGemini).not.toHaveBeenCalled();
        expect(deps.saveCachedHoroscope).toHaveBeenCalledWith('daily-key-cs-nocontext', 'Beran', 'daily', 'Čerstvý horoskop.', expect.any(String));
    });
    test('OpenAI failure uses existing local fallback without another provider', async () => {
        const deps = dependencies();
        deps.callAI.mockRejectedValue(new Error('unavailable'));
        await expect(getOrGenerateHoroscope('Beran', now, deps)).resolves.toBe(buildFallbackDailyHoroscope('Beran', now));
        expect(deps.callGemini).not.toHaveBeenCalled();
        expect(deps.callAI).toHaveBeenCalledTimes(1);
    });
});
