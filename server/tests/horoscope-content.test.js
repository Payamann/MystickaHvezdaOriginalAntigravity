import { buildHoroscopeFallback, PERIOD_SENTENCE_COUNTS } from '../services/horoscope-content.js';
import { HOROSCOPE_VOICE_CONTRACTS, SYSTEM_PROMPTS } from '../config/prompts.js';

const SIGNS = ['Beran', 'Býk', 'Blíženci', 'Rak', 'Lev', 'Panna', 'Váhy', 'Štír', 'Střelec', 'Kozoroh', 'Vodnář', 'Ryby'];
const PERIODS = ['daily', 'weekly', 'monthly'];
const FORMAL_CZECH = /\b(?:vás|vám|váš|vaše|vaši|vašeho|vašem|jste|buďte|udělejte|využijte|nebojte|věnujte|všimněte|hledejte|důvěřujte)\b/iu;

function countSentences(value) {
    return (value.match(/[.!?](?=\s|$)/g) || []).length;
}

describe('horoscope fallback content contract', () => {
    test.each(SIGNS)('%s has useful Czech fallback for all periods', (sign) => {
        const predictions = new Set();

        for (const period of PERIODS) {
            const fallback = buildHoroscopeFallback({ sign, period, lang: 'cs' });

            expect(countSentences(fallback.prediction)).toBe(PERIOD_SENTENCE_COUNTS[period]);
            expect(fallback.prediction).not.toMatch(FORMAL_CZECH);
            expect(fallback.prediction).toMatch(/\b(?:ti|tě|tvou|svou|vyber|udělej|všimni|řekni|zapiš|uprav|ukaž|rozděl|otestuj)\b/iu);
            expect(fallback.affirmation).toMatch(/^M|^Tvořím|^Pouštím/u);
            expect(fallback.luckyNumbers).toHaveLength(4);
            expect(new Set(fallback.luckyNumbers).size).toBe(4);
            predictions.add(fallback.prediction);
        }

        expect(predictions.size).toBe(3);
    });

    test.each(['sk', 'pl'])('%s fallback keeps period-specific sentence counts', (lang) => {
        for (const period of PERIODS) {
            const fallback = buildHoroscopeFallback({ sign: 'Beran', period, lang });
            expect(countSentences(fallback.prediction)).toBe(PERIOD_SENTENCE_COUNTS[period]);
        }
    });

    test('unknown inputs fall back safely to Czech daily Beran content', () => {
        const fallback = buildHoroscopeFallback({ sign: 'Unknown', period: 'yearly', lang: 'de' });

        expect(fallback.periodLabel).toBe('Denní inspirace');
        expect(countSentences(fallback.prediction)).toBe(3);
        expect(fallback.luckyNumbers).toHaveLength(4);
    });

    test('shared Czech prompt contract requires tykání, a concrete current step and symbolic framing', () => {
        expect(HOROSCOPE_VOICE_CONTRACTS.cs).toMatch(/vždy tykej/iu);
        expect(HOROSCOPE_VOICE_CONTRACTS.cs).toMatch(/konkrétní.+krok/iu);
        expect(HOROSCOPE_VOICE_CONTRACTS.cs).toMatch(/symbolický rámec/iu);
        expect(HOROSCOPE_VOICE_CONTRACTS.cs).toMatch(/Nevymýšlej přesné planetární aspekty/iu);
        expect(SYSTEM_PROMPTS.horoscope).toContain(HOROSCOPE_VOICE_CONTRACTS.cs);
    });
});
