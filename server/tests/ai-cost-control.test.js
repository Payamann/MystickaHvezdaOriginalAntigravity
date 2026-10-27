import {
    getAIProfile,
    listAIProfiles
} from '../config/ai-profiles.js';
import {
    estimateClaudeCostMicroUsd,
    estimateOpenAICostMicroUsd
} from '../services/ai-budget.js';
import {
    createAIResponseCacheKey,
    resetAIResponseMemoryCache
} from '../services/ai-response-cache.js';
import {
    buildCompactMentorHistory,
    buildCompactReadingContext
} from '../services/mentor-context.js';

describe('AI cost control', () => {
    beforeEach(() => {
        resetAIResponseMemoryCache();
    });

    test('uses OpenAI Luna for all work while retaining per-feature output caps', () => {
        expect(getAIProfile('briefing')).toMatchObject({
            provider: 'openai', model: 'gpt-6-luna', modelTier: 'luna', reasoningEffort: 'none',
            maxTokens: 700
        });
        expect(getAIProfile('daily_wisdom').modelTier).toBe('luna');
        expect(getAIProfile('annual_horoscope_pdf')).toMatchObject({
            modelTier: 'luna',
            maxTokens: 4096
        });
        expect(getAIProfile('personal_map_pdf')).toMatchObject({
            modelTier: 'luna',
            maxTokens: 12288
        });
        expect(listAIProfiles().mentor.maxTokens).toBeLessThan(2048);
        for (const feature of Object.keys(listAIProfiles())) expect(getAIProfile(feature).model).toBe('gpt-6-luna');
        expect(() => getAIProfile('default', { model: 'claude-sonnet-4-5' })).toThrow(/OpenAI/);
        expect(() => getAIProfile('default', { modelTier: 'sonnet' })).toThrow(/OpenAI/);
    });

    test('estimates model cost from aggregate usage without prompt data', () => {
        expect(estimateOpenAICostMicroUsd({ inputTokens: 1000, outputTokens: 100 })).toBe(150);
        expect(estimateOpenAICostMicroUsd({ inputTokens: 1000, outputTokens: 100, cacheReadInputTokens: 400 })).toBe(114);
        expect(estimateOpenAICostMicroUsd({ inputTokens: 1000, outputTokens: 100, cacheReadInputTokens: 2000 })).toBe(60);
        // Historical estimators retain their old meaning for stored reports.
        expect(estimateClaudeCostMicroUsd({
            modelTier: 'haiku',
            inputTokens: 1000,
            outputTokens: 100
        })).toBe(1500);
        expect(estimateClaudeCostMicroUsd({
            modelTier: 'sonnet',
            inputTokens: 1000,
            outputTokens: 100
        })).toBe(4500);
    });

    test('cache keys are deterministic, order independent and non-reversible', () => {
        const first = createAIResponseCacheKey('natal', { name: 'Jana', date: '1990-01-01' });
        const second = createAIResponseCacheKey('natal', { date: '1990-01-01', name: 'Jana' });

        expect(first).toBe(second);
        expect(first).not.toContain('Jana');
        expect(first).not.toContain('1990-01-01');
    });

    test('mentor sends four recent turns and a bounded older summary', () => {
        const messages = Array.from({ length: 12 }, (_, index) => ({
            role: index % 2 === 0 ? 'user' : 'mentor',
            content: `Zprava ${index} ${'x'.repeat(250)}`
        }));
        const compacted = buildCompactMentorHistory(messages);

        expect(compacted.recent).toHaveLength(4);
        expect(compacted.recent[0].content).toContain('Zprava 8');
        expect(compacted.summary.length).toBeLessThanOrEqual(1200);
        expect(compacted.summary).toContain('Zprava 0');
    });

    test('mentor reading context is limited to three concise items', () => {
        const readings = Array.from({ length: 5 }, (_, index) => ({
            type: 'tarot',
            created_at: `2026-06-0${index + 1}T10:00:00.000Z`,
            data: {
                cards: [
                    { name: `Karta ${index}-1` },
                    { name: `Karta ${index}-2` },
                    { name: `Karta ${index}-3` },
                    { name: `Karta ${index}-4` }
                ]
            }
        }));
        const context = buildCompactReadingContext(readings);

        expect(context.split('\n')).toHaveLength(3);
        expect(context).toContain('Karta 0-3');
        expect(context).not.toContain('Karta 0-4');
        expect(context).not.toContain('Karta 3-1');
    });
});
