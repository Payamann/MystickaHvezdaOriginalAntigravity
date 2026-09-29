import { readFileSync } from 'node:fs';
import { parseApprovedBatch, getReviewedHoroscopeFromBatch } from '../services/reviewed-horoscopes.js';
import { normalizeHoroscopeAiResponse, formatHoroscopeForEmail } from '../services/horoscope-response.js';

const bundle = JSON.parse(readFileSync(new URL('../../docs/horoscope-pilot-week-2026-09-29_2026-10-05-v2.json', import.meta.url), 'utf8'));
const entries = parseApprovedBatch(bundle);

describe('reviewed Czech daily horoscope release', () => {
    test('contains exactly one approved text per sign and day', () => {
        expect(entries.size).toBe(84);
        expect(bundle.status).toBe('approved');
    });

    test('public page, contextual API and email render the same prediction', () => {
        const now = new Date('2026-09-29T10:00:00Z');
        for (const item of bundle.items.filter((entry) => entry.date === '2026-09-29')) {
            const slug = item.sign.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const base = `${slug}_daily_2026-09-29_v3-cs-`;
            const publicRow = getReviewedHoroscopeFromBatch(`${base}nocontext`, now, entries);
            const contextualRow = getReviewedHoroscopeFromBatch(`${base}${'a'.repeat(32)}`, now, entries);
            expect(publicRow).not.toBeNull();
            expect(contextualRow).not.toBeNull();
            const web = normalizeHoroscopeAiResponse(publicRow.response, { allowMissingSupplemental: true }).parsed.prediction;
            const api = normalizeHoroscopeAiResponse(contextualRow.response, { allowMissingSupplemental: true }).parsed.prediction;
            const email = formatHoroscopeForEmail(publicRow.response);
            expect([web, api, email]).toEqual([item.prediction, item.prediction, item.prediction]);
        }
    });

    test('does not publish future, other language or unapproved content', () => {
        const key = 'beran_daily_2026-09-30_v3-cs-nocontext';
        expect(getReviewedHoroscopeFromBatch(key, new Date('2026-09-29T10:00:00Z'), entries)).toBeNull();
        expect(getReviewedHoroscopeFromBatch('beran_daily_2026-09-29_v3-sk-nocontext', new Date('2026-09-29T10:00:00Z'), entries)).toBeNull();
        expect(() => parseApprovedBatch({ ...bundle, status: 'draft' })).toThrow(/approved/);
    });
});
