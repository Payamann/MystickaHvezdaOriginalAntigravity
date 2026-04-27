import { getRetentionCutoffDate, normalizeRetentionDays } from '../jobs/data-retention.js';

describe('Data retention helpers', () => {
    test('normalizes personal cache retention days with a safe minimum', () => {
        expect(normalizeRetentionDays(undefined)).toBe(180);
        expect(normalizeRetentionDays('7')).toBe(30);
        expect(normalizeRetentionDays('90')).toBe(90);
        expect(normalizeRetentionDays('bad')).toBe(180);
    });

    test('calculates cutoff date from retention window', () => {
        const now = new Date('2026-04-26T12:00:00.000Z');
        expect(getRetentionCutoffDate(30, now)).toBe('2026-03-27T12:00:00.000Z');
    });
});
