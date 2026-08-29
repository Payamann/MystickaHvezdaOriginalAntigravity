import { countSentences, normalizeHoroscopeAiResponse } from '../services/horoscope-response.js';

function responseWithPrediction(prediction) {
    return JSON.stringify({
        prediction,
        affirmation: 'Má pozornost vede můj další krok.',
        luckyNumbers: [3, 7, 12, 21]
    });
}

describe('horoscope AI response contract', () => {
    test('accepts the requested number of sentences', () => {
        const result = normalizeHoroscopeAiResponse(
            responseWithPrediction('První věta. Druhá věta. Třetí věta.'),
            { expectedSentenceCount: 3 }
        );

        expect(countSentences(result.parsed.prediction)).toBe(3);
    });

    test('rejects a structurally valid response with the wrong sentence count', () => {
        expect(() => normalizeHoroscopeAiResponse(
            responseWithPrediction('První věta. Druhá věta.'),
            { expectedSentenceCount: 3 }
        )).toThrow(/sentence count/iu);
    });

    test('keeps sentence validation optional for legacy cached content', () => {
        expect(() => normalizeHoroscopeAiResponse(
            responseWithPrediction('Jedna starší věta.')
        )).not.toThrow();
    });
});
