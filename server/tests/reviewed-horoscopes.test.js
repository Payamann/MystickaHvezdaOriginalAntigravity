import { getReviewedHoroscopeFromBatch, parseApprovedBatch } from '../services/reviewed-horoscopes.js';
import { normalizeHoroscopeAiResponse } from '../services/horoscope-response.js';

const signs = ['beran', 'byk', 'blizenci', 'rak', 'lev', 'panna', 'vahy', 'stir', 'strelec', 'kozoroh', 'vodnar', 'ryby'];
const dates = ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'];
const draft = {
    version: 'pilot-v2', status: 'draft',
    items: signs.flatMap(sign => dates.map(date => ({
        sign, date,
        prediction: 'Zkus se dnes vrátit k jedné rozpracované věci a vybrat další malý krok. Dopřej si čas na rozhodnutí a ponech ostatním prostor pro vlastní odpověď.'
    })))
};

describe('reviewed horoscope release guard', () => {
    test('rejects a draft bundle', () => {
        expect(() => parseApprovedBatch(draft)).toThrow(/approved/);
    });

    test('rejects an incomplete or duplicate approved bundle', () => {
        expect(() => parseApprovedBatch({ ...draft, status: 'approved', items: draft.items.slice(1) })).toThrow();
        const items = [...draft.items];
        items[1] = items[0];
        expect(() => parseApprovedBatch({ ...draft, status: 'approved', items })).toThrow(/duplicate/);
    });

    test('serves only matching public keys on or before the Prague date', () => {
        const entries = parseApprovedBatch({ ...draft, status: 'approved' });
        const key = 'beran_daily_2026-09-29_v3-cs-nocontext';
        const now = new Date('2026-09-28T22:30:00Z');
        const result = getReviewedHoroscopeFromBatch(key, now, entries);
        expect(result.source).toBe('reviewed:pilot-v2');
        expect(result.cache_key).toBe(key);
        expect(getReviewedHoroscopeFromBatch('beran_daily_2026-09-30_v3-cs-nocontext', now, entries)).toBeNull();
        expect(getReviewedHoroscopeFromBatch(`${key}_personal`, now, entries)).toBeNull();
        expect(getReviewedHoroscopeFromBatch('beran_daily_2026-10-06_v3-cs-nocontext', new Date('2026-10-06T10:00:00Z'), entries)).toBeNull();
        expect(() => normalizeHoroscopeAiResponse(result.response)).toThrow(/incomplete/);
        expect(normalizeHoroscopeAiResponse(result.response, { allowMissingSupplemental: result.source === 'reviewed:pilot-v2' }).parsed.prediction).toBeTruthy();
    });
});
