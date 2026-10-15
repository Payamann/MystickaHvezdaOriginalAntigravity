import { apiUrl, authHeaders, READING_FILTERS } from './shared.js';

// An explicit scope, independent of history pagination or the selected filter.
export const PROFILE_CONTEXT_LIMIT = 100;
const PAGE_LIMIT = 50;

async function loadRecent(type) {
    const readings = new Map();
    for (let page = 1; page <= PROFILE_CONTEXT_LIMIT / PAGE_LIMIT; page++) {
        const query = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
        if (type) query.set('type', type);
        const response = await fetch(`${apiUrl()}/user/readings?${query}`, {
            credentials: 'include', headers: authHeaders(), cache: 'no-store'
        });
        if (!response.ok) throw new Error('Nepodařilo se načíst podklady profilu.');
        const data = await response.json();
        if (!data.success || !Array.isArray(data.readings)) throw new Error('Neplatné podklady profilu.');
        data.readings.forEach(reading => readings.set(reading.id, reading));
        if (page >= (data.pagination?.totalPages || 1)) break;
    }
    return [...readings.values()].slice(0, PROFILE_CONTEXT_LIMIT);
}

export async function loadProfileContext() {
    try {
        const types = [...new Set(READING_FILTERS.filter(filter => !['all', 'journal'].includes(filter.value)).flatMap(filter => filter.types))];
        const [recent, journals] = await Promise.all([loadRecent(types.join(',')), loadRecent('journal')]);
        const combined = new Map([...recent, ...journals].map(reading => [reading.id, reading]));
        return {
            readings: [...combined.values()].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
            journals
        };
    } catch (error) {
        console.warn('[Profile] Context unavailable:', error.message);
        return null;
    }
}
