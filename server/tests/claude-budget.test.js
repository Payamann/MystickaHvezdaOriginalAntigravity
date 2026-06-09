import {
    normalizeDailyAICallLimit,
    reserveDailyAIRequest,
    resetDailyAIRequestBudget
} from '../services/claude.js';

describe('Claude request budget', () => {
    beforeEach(() => {
        resetDailyAIRequestBudget();
    });

    test('uses a conservative default and clamps unsafe overrides', () => {
        expect(normalizeDailyAICallLimit(undefined)).toBe(120);
        expect(normalizeDailyAICallLimit('invalid')).toBe(120);
        expect(normalizeDailyAICallLimit('0')).toBe(1);
        expect(normalizeDailyAICallLimit('50000')).toBe(10000);
    });

    test('blocks requests after the daily limit is reserved', () => {
        const now = new Date('2026-06-09T10:00:00.000Z');

        expect(reserveDailyAIRequest({ now, limit: 2 })).toMatchObject({
            used: 1,
            remaining: 1
        });
        expect(reserveDailyAIRequest({ now, limit: 2 })).toMatchObject({
            used: 2,
            remaining: 0
        });
        expect(() => reserveDailyAIRequest({ now, limit: 2 })).toThrow(
            'Daily AI request limit reached (2).'
        );
    });

    test('resets the allowance on the next UTC day', () => {
        reserveDailyAIRequest({
            now: new Date('2026-06-09T23:59:59.000Z'),
            limit: 1
        });

        expect(reserveDailyAIRequest({
            now: new Date('2026-06-10T00:00:00.000Z'),
            limit: 1
        })).toMatchObject({
            date: '2026-06-10',
            used: 1,
            remaining: 0
        });
    });
});
