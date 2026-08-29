import { CZECH_READING_VOICE_CONTRACT, SYSTEM_PROMPTS } from '../config/prompts.js';
import { buildOracleSystemPrompt } from '../routes/oracle.js';
import { assertCzechReadingVoice, inspectCzechReadingVoice } from '../services/reading-quality.js';

describe('shared Czech reading voice contract', () => {
    test('rejects formal address before generated content can be cached', () => {
        expect(() => assertCzechReadingVoice('Všimněte si, co vám dnes bere energii.')).toThrow(/formal Czech/iu);
        expect(() => assertCzechReadingVoice('Dnes můžete zpomalit a pak udělejte první krok.')).toThrow(/formal Czech/iu);
    });

    test('accepts direct, gender-neutral tykání with a concrete step', () => {
        expect(() => assertCzechReadingVoice('Všimni si, co ti bere energii, a dnes udělej jeden malý krok.')).not.toThrow();
    });

    test('detects voice across structured JSON output', () => {
        expect(inspectCzechReadingVoice({
            strengths: 'Tvou silou je klid.',
            message: 'Dnes si zvol jednu hranici.'
        })).toEqual(expect.objectContaining({
            hasFormalAddress: false,
            hasInformalAddress: true
        }));
    });

    test('numerology and briefing share the same current, concrete voice contract', () => {
        expect(CZECH_READING_VOICE_CONTRACT).toMatch(/co symbolika znamená právě teď/iu);
        expect(CZECH_READING_VOICE_CONTRACT).toMatch(/konkrétní, bezpečný krok/iu);
        expect(SYSTEM_PROMPTS.numerology).toContain(CZECH_READING_VOICE_CONTRACT);
        expect(SYSTEM_PROMPTS.briefing).toContain(CZECH_READING_VOICE_CONTRACT);
        expect(SYSTEM_PROMPTS.briefing).toMatch(/přesně třemi krátkými odstavci/iu);
    });

    test('oracle prompts enforce the Czech contract without conflicting with other languages', () => {
        const czech = buildOracleSystemPrompt(SYSTEM_PROMPTS.tarot, 'cs');
        const slovak = buildOracleSystemPrompt(SYSTEM_PROMPTS.tarot, 'sk');
        const unsupported = buildOracleSystemPrompt(SYSTEM_PROMPTS.tarot, 'de');

        expect(czech.lang).toBe('cs');
        expect(czech.systemPrompt).toContain(CZECH_READING_VOICE_CONTRACT);
        expect(czech.systemPrompt).toContain('Respond in češtině (CZ).');
        expect(slovak.lang).toBe('sk');
        expect(slovak.systemPrompt).not.toContain(CZECH_READING_VOICE_CONTRACT);
        expect(slovak.systemPrompt).toContain('Respond in slovenčine (SK).');
        expect(unsupported.lang).toBe('cs');
        expect(unsupported.systemPrompt).toContain(CZECH_READING_VOICE_CONTRACT);
    });
});
