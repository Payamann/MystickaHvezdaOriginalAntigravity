import { jest } from '@jest/globals';
import { loadProfileContext, PROFILE_CONTEXT_LIMIT } from '../../js/profile/context.js';
import { getReadingLabel, getReadingPreview, getReadingData, READING_FILTERS } from '../../js/profile/shared.js';
import { readJournalDraft, writeJournalDraft } from '../../js/profile/journal-draft.js';

const saved = { fetch: globalThis.fetch, window: globalThis.window, sessionStorage: globalThis.sessionStorage };
afterEach(() => Object.entries(saved).forEach(([key, value]) => {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
}));

test('profile context pages readings and journals independently of the first history page', async () => {
    globalThis.window = {};
    const rows = Array.from({ length: 250 }, (_, i) => ({
        id: `reading-${i}`, type: i < 125 ? 'tarot' : 'journal',
        created_at: new Date(Date.UTC(2026, 9, 15) - i * 3600000).toISOString(), data: `text ${i}`
    }));
    globalThis.fetch = jest.fn(async url => {
        const query = new URL(url, 'https://local.invalid').searchParams;
        const types = query.get('type').split(',');
        const filtered = rows.filter(row => types.includes(row.type));
        const page = Number(query.get('page'));
        const limit = Number(query.get('limit'));
        return { ok: true, json: async () => ({ success: true, readings: filtered.slice((page - 1) * limit, page * limit), pagination: { totalPages: Math.ceil(filtered.length / limit) } }) };
    });
    const result = await loadProfileContext();
    expect(result.journals).toHaveLength(PROFILE_CONTEXT_LIMIT);
    expect(result.readings).toHaveLength(PROFILE_CONTEXT_LIMIT * 2);
    expect(result.journals[0].id).toBe('reading-125');
    expect(result.readings.some(row => row.id === 'reading-125')).toBe(true);
    expect(result.journals.at(-1).id).toBe('reading-224');
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(fetch.mock.calls.every(([, options]) => options.credentials === 'include')).toBe(true);
});

test('a failed context request is unavailable rather than an empty personal history', async () => {
    globalThis.window = {};
    globalThis.fetch = jest.fn(async () => ({ ok: false }));
    expect(await loadProfileContext()).toBeNull();
});

test.each([
    [{ type: 'tarot', data: { tool: 'tarot_yes_no' } }, 'Tarot ano/ne'],
    [{ type: 'tarot', data: { spreadType: 'Tarot karta dne' } }, 'Tarot karta dne'],
    [{ type: 'tarot', data: { spreadType: 'Tři karty' } }, 'Tarot · tři karty'],
    [{ type: 'tarot', data: { spreadType: 'Celtic Cross' } }, 'Tarot · Keltský kříž'],
    [{ type: 'tarot', data: { spreadType: 'Tři karty (Ukázka)' } }, 'Tarot · tři karty · ukázka'],
    [{ type: 'horoscope', data: '{"sign":"Beran","period":"weekly"}' }, 'Týdenní horoskop · Beran']
])('saved formats retain a useful label: %j', (reading, expected) => {
    expect(getReadingLabel(reading)).toBe(expected);
});

test('previews preserve the question, named cards, and numeric journal text', () => {
    expect(getReadingPreview({ type: 'tarot', data: { question: '  Co\nzkusit dál?  ' } })).toBe('Co zkusit dál?');
    expect(getReadingPreview({ type: 'tarot', data: { cards: ['Hvězda', { name: 'Slunce' }] } })).toBe('Hvězda · Slunce');
    expect(getReadingData({ type: 'journal', data: '123' })).toBe('123');
    expect(getReadingPreview({ type: 'journal', data: '123' })).toBe('123');
    expect(getReadingPreview({ type: 'journal', data: 'x'.repeat(1000) })).toHaveLength(160);
    expect(READING_FILTERS.find(filter => filter.value === 'angel-card').types).toEqual(['angel-card', 'angel']);
    expect(READING_FILTERS.some(filter => filter.value === 'journal')).toBe(true);
});

test('journal drafts are scoped to a single account and removed after successful clearing', () => {
    const store = new Map();
    globalThis.sessionStorage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
    writeJournalDraft('user-a', 'rozepsaná poznámka');
    expect(readJournalDraft('user-a')).toBe('rozepsaná poznámka');
    expect(readJournalDraft('user-b')).toBe('');
    writeJournalDraft('user-a', '');
    expect(readJournalDraft('user-a')).toBe('');
});

test('blocked browser storage does not throw or prevent writing in the live form', () => {
    globalThis.sessionStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    expect(() => writeJournalDraft('user-a', 'text')).not.toThrow();
    expect(readJournalDraft('user-a')).toBe('');
});
