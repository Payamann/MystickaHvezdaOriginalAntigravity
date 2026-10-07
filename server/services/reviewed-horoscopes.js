/**
 * Optional, versioned editorial layer for Czech public daily horoscopes.
 * It is disabled unless explicitly selected, and draft bundles never serve.
 * The existing cache remains untouched and is the immediate rollback path.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const VERSION = 'pilot-v2';
const BUNDLE_PATH = fileURLToPath(new URL('../../docs/horoscope-pilot-week-2026-09-29_2026-10-05-v2.json', import.meta.url));
const SIGNS = ['beran', 'byk', 'blizenci', 'rak', 'lev', 'panna', 'vahy', 'stir', 'strelec', 'kozoroh', 'vodnar', 'ryby'];
const DATES = ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'];
let loadedBatch;

function normalizeSign(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function pragueDate(now) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function loadApprovedBatch() {
    if (loadedBatch !== undefined) return loadedBatch;
    try {
        const bundle = JSON.parse(readFileSync(BUNDLE_PATH, 'utf8'));
        loadedBatch = parseApprovedBatch(bundle);
    } catch (error) {
        console.error('[HOROSCOPE] Reviewed batch unavailable:', error.message);
        loadedBatch = null;
    }
    return loadedBatch;
}

export function parseApprovedBatch(bundle) {
    if (bundle?.version !== VERSION || bundle.status !== 'approved' || !Array.isArray(bundle.items) || bundle.items.length !== 84) {
        throw new Error('Bundle is not an approved 84-item pilot-v2 release');
    }
    const entries = new Map();
    for (const item of bundle.items) {
        const sign = normalizeSign(item.sign);
        const key = `${sign}:${item.date}`;
        if (!SIGNS.includes(sign) || !DATES.includes(item.date) ||
            typeof item.prediction !== 'string' || item.prediction.trim().length < 100 || entries.has(key)) {
            throw new Error('Bundle contains an invalid or duplicate entry');
        }
        entries.set(key, item.prediction.trim());
    }
    if (entries.size !== 84) throw new Error('Bundle has missing entries');
    return entries;
}

export function getReviewedHoroscopeFromBatch(cacheKey, now, entries) {
    const match = /^([a-z]+)_daily_(\d{4}-\d{2}-\d{2})_v3-cs-(?:nocontext|[a-f0-9]{32})$/.exec(String(cacheKey));
    if (!match || match[2] > pragueDate(now)) return null;
    const prediction = entries?.get(`${match[1]}:${match[2]}`);
    if (!prediction) return null;
    return {
        cache_key: cacheKey,
        source: 'reviewed:pilot-v2',
        response: JSON.stringify({ prediction }),
        period_label: 'Denní inspirace',
        generated_at: null
    };
}

export function getReviewedHoroscope(cacheKey, now = new Date()) {
    if (process.env.HOROSCOPE_REVIEWED_BATCH_VERSION !== VERSION) return null;
    return getReviewedHoroscopeFromBatch(cacheKey, now, loadApprovedBatch());
}
