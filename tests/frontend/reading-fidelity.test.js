import { jest } from '@jest/globals';

const originals = Object.fromEntries(['fetch', 'document', 'window', 'confirm', 'CustomEvent'].map(key => [key, globalThis[key]]));
const updateFavoriteSummary = jest.fn();

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

jest.unstable_mockModule('../../js/profile/shared.js', () => ({
    escapeHtml,
    apiUrl: () => '/api',
    authHeaders: () => ({}),
    authHeadersWithCsrf: async () => ({}),
    getReadingIcon: () => '',
    getReadingLabel: reading => reading.type,
    getReadingData: reading => {
        if (reading.type === 'journal' || typeof reading.data !== 'string') return reading.data;
        try { return JSON.parse(reading.data); } catch { return reading.data; }
    },
    profileIconMarkup: name => `<svg data-icon="${escapeHtml(name)}"></svg>`
}));
jest.unstable_mockModule('../../js/profile/readings.js', () => ({
    getAllReadings: () => [], updateReading: jest.fn(), renderReadings: jest.fn(), updateFavoriteSummary
}));
jest.unstable_mockModule('../../js/profile/favorites.js', () => ({ loadFavorites: jest.fn() }));
const { viewReading, closeReadingModal } = await import('../../js/profile/modal.js');

let nodes;
let trigger;
function element() {
    const classes = new Set();
    return {
        hidden: false, disabled: false, innerHTML: '', textContent: '', attrs: {}, isConnected: true,
        offsetParent: {}, dataset: {},
        classList: {
            add: (...values) => values.forEach(value => classes.add(value)),
            remove: (...values) => values.forEach(value => classes.delete(value)),
            contains: value => classes.has(value),
            toggle: (value, force) => force === undefined ? (classes.has(value) ? classes.delete(value) : classes.add(value)) : (force ? classes.add(value) : classes.delete(value))
        },
        setAttribute(key, value) { this.attrs[key] = value; },
        removeAttribute(key) { delete this.attrs[key]; },
        focus() { document.activeElement = this; },
        addEventListener() {},
        closest: () => null,
        querySelector: () => null,
        querySelectorAll: () => []
    };
}

function createDiv() {
    let text = '';
    return {
        set textContent(value) { text = String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
        get textContent() { return text; },
        get innerHTML() { return text; },
        set innerHTML(value) { text = String(value ?? ''); }
    };
}

function detail(id, type, data) {
    return { ok: true, json: async () => ({ reading: {
        id, type, data, is_favorite: false, created_at: '2026-10-15T09:00:00Z'
    } }) };
}

async function open(type, data) {
    fetch.mockResolvedValueOnce(detail('reading-1', type, data));
    await viewReading('reading-1');
    return nodes['reading-modal-content'].innerHTML;
}

function noRawJson(html) {
    expect(html).not.toContain('class="reading-json"');
}

beforeEach(() => {
    jest.clearAllMocks();
    nodes = Object.fromEntries([
        'reading-modal', 'reading-modal-content', 'modal-favorite-btn', 'modal-delete-btn', 'reading-modal-close'
    ].map(id => [id, element()]));
    trigger = element();
    globalThis.document = {
        activeElement: trigger,
        getElementById: id => nodes[id] || null,
        createElement: () => createDiv(),
        querySelector: () => null,
        querySelectorAll: () => [],
        dispatchEvent: jest.fn(),
        addEventListener() {},
        removeEventListener() {}
    };
    nodes['reading-modal'].querySelector = selector => selector === '.modal__close' ? nodes['reading-modal-close'] : null;
    nodes['reading-modal'].querySelectorAll = () => [nodes['reading-modal-close'], nodes['modal-favorite-btn'], nodes['modal-delete-btn']];
    globalThis.window = { Auth: { user: { id: 'user-1' }, showToast: jest.fn() } };
    globalThis.confirm = jest.fn(() => true);
    globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
    globalThis.fetch = jest.fn();
});

afterEach(() => closeReadingModal());
afterAll(() => Object.entries(originals).forEach(([key, value]) => {
    if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
}));

test('numerology renders all persisted metrics, interpretation, and fallback provenance', async () => {
    const html = await open('numerology', {
        lifePath: 11, destiny: 7, soul: 3, personality: 4,
        response: 'Zpráva od čísel.', fallback: true
    });
    for (const fragment of ['Životní cesta', '>11<', 'Osud', '>7<', 'Duše', '>3<', 'Osobnost', '>4<', 'Zpráva od čísel.', 'Osobní generování teď není dostupné']) {
        expect(html).toContain(fragment);
    }
    noRawJson(html);
});

test('natal chart retains chart summary, interpretation, and fallback provenance', async () => {
    const html = await open('natal-chart', {
        interpretation: 'Natální výklad', fallback: true,
        chart: { summary: { sunSign: 'Býk', moonSign: 'Rak', ascendantSign: 'Lev', dominantElement: 'Voda', dominantQuality: 'Pevná' } }
    });
    for (const fragment of ['Býk', 'Rak', 'Lev', 'Voda', 'Natální výklad', 'Osobní generování teď není dostupné']) expect(html).toContain(fragment);
    noRawJson(html);
});

test('past-life object renders all current flat fields with human labels', async () => {
    const html = await open('past-life', { fallback: false, result: {
        era: '14. století', identity: 'Zapisovatel', karmic_lesson: 'Hranice', gifts: 'Paměť',
        patterns: 'Mlčení', mission: 'Vyslovit pravdu', message: 'Malý krok'
    } });
    for (const fragment of ['Období', '14. století', 'Identita', 'Zapisovatel', 'Karmická lekce', 'Hranice', 'Dary', 'Paměť', 'Vzorce', 'Mlčení', 'Mise', 'Vyslovit pravdu', 'Poselství', 'Malý krok']) expect(html).toContain(fragment);
    noRawJson(html);
});

test('medicine-wheel shows totem and current result fields', async () => {
    const html = await open('medicine-wheel', {
        totem: 'Vlk', fallback: false,
        result: { strengths: 'Pozornost', challenges: 'Hranice', message: 'Jeden krok' }
    });
    for (const fragment of ['Původní symbol', 'Vlk', 'Silné stránky', 'Pozornost', 'Výzvy', 'Hranice', 'Poselství', 'Jeden krok']) expect(html).toContain(fragment);
    noRawJson(html);
});

test('crystal reading preserves question and answer', async () => {
    const html = await open('crystal-ball', { question: 'Co si všimnout?', answer: 'Zpomal a pojmenuj fakt.', fallback: false });
    expect(html).toContain('Tvoje otázka');
    expect(html).toContain('Co si všimnout?');
    expect(html).toContain('Zpomal a pojmenuj fakt.');
    noRawJson(html);
});

test('astro map shows full response and current recommendation and line summaries', async () => {
    const html = await open('astrocartography', {
        intention: 'Tvořivost', response: 'Mapa je symbolický podnět.', fallback: false,
        chart: { summary: { sunSign: 'Panna' } },
        astrocartography: {
            recommendations: [{ city: 'Brno', score: 82, primaryPlanet: { name: 'Venuše' } }],
            angularLines: [{ planetName: 'Jupiter', angle: 'MC', longitude: 14.4 }]
        }
    });
    for (const fragment of ['Tvořivost', 'Mapa je symbolický podnět.', 'Panna', 'Astro mapa', 'Brno', '82 / 100', 'Venuše', 'Jupiter MC', '14.4°']) expect(html).toContain(fragment);
    noRawJson(html);
});

test('rune history shows intention, rune details, response, and fallback notice', async () => {
    const html = await open('runes', {
        intention: 'Udělat první krok', rune: { name: 'Fehu', symbol: 'ᚠ', meaning: 'Začátek' },
        response: 'Začni malým činem.', fallback: true
    });
    for (const fragment of ['Původní záměr', 'Udělat první krok', 'Fehu', 'Začátek', 'Začni malým činem.', 'Osobní generování teď není dostupné']) expect(html).toContain(fragment);
    noRawJson(html);
});

test('angel-card history renders card metadata and interpretation', async () => {
    const html = await open('angel-card', {
        card: { name: 'Strážkyně prahu', theme: 'Odvaha', message: 'Zvol si tempo.' },
        intention: 'Změna práce', response: 'Všímej si svých hranic.', fallback: false
    });
    for (const fragment of ['Strážkyně prahu', 'Odvaha', 'Zvol si tempo.', 'Změna práce', 'Všímej si svých hranic.']) expect(html).toContain(fragment);
    noRawJson(html);
});

test('daily tarot card retains named card, meaning, reflection question, and full response', async () => {
    const html = await open('tarot', {
        spreadType: 'Tarot karta dne', source: 'tarot_daily_card', dateKey: '2026-10-15',
        cards: [{ name: 'Hvězda', position: 'Karta dne', meaning: 'Naděje' }],
        reflectionQuestion: 'Co tě dnes podpírá?', response: 'Pozorování.\n\nOtázka k zamyšlení: Co tě dnes podpírá?\n\nKonkrétní krok: Ozvi se blízkému.'
    });
    for (const fragment of ['Hvězda', 'Karta dne', 'Naděje', 'Pozorování.', 'Otázka k zamyšlení', 'Co tě dnes podpírá?', 'Konkrétní krok: Ozvi se blízkému.']) expect(html).toContain(fragment);
    noRawJson(html);
});

test('tarot multi-card keeps positions and meanings, full summary, and per-card interpretation after it', async () => {
    const html = await open('tarot', {
        spreadType: 'Tři karty', question: 'Jak začít?', response: 'Souhrn celého výkladu.',
        cards: [
            { name: 'Poustevník', position: 'Minulost', meaning: 'Ztišení', interpretation: 'Dříve jsi potřeboval odstup.' },
            { name: 'Slunce', position: 'Přítomnost', meaning: 'Jasnost', interpretation: 'Teď můžeš mluvit otevřeně.' },
            { name: 'Hvězda', position: 'Budoucnost', meaning: 'Naděje', interpretation: 'Další krok může být malý.' }
        ]
    });
    for (const fragment of ['Tvoje otázka', 'Jak začít?', 'Poustevník', 'Minulost', 'Ztišení', 'Slunce', 'Přítomnost', 'Jasnost', 'Hvězda', 'Budoucnost', 'Souhrn celého výkladu.', 'Význam karty Poustevník', 'Dříve jsi potřeboval odstup.', 'Význam karty Slunce', 'Teď můžeš mluvit otevřeně.']) expect(html).toContain(fragment);
    expect(html.indexOf('Souhrn celého výkladu.')).toBeLessThan(html.indexOf('Význam karty Poustevník'));
    noRawJson(html);
});

test('yes/no historical card_name and answer shape renders a card image, question, and full answer', async () => {
    const answer = 'Jedna jasná odpověď.\n\nProtože můžeš začít tím, že si vybereš jeden konkrétní krok a ověříš ho v praxi.';
    const html = await open('tarot', { card_name: 'Mág', answer, question: 'Mám začít?', tool: 'tarot_yes_no' });
    expect(html).toContain('Mám začít?');
    expect(html).toContain('src="img/tarot-v2/tarot_mag.webp"');
    expect(html).toContain(answer.replace(/\n/g, '<br>'));
    expect(html).not.toContain('<pre');
});

test.each([
    ['legacy tarot string', 'tarot', 'Dříve uložený tarotový text.'],
    ['legacy journal string', 'journal', 'Krátká poznámka z deníku.']
])('%s remains readable', async (_label, type, data) => {
    const html = await open(type, data);
    expect(html).toContain(data);
    noRawJson(html);
});

test.each([
    { total: 71, emotion: 72, communication: 73, passion: 74, stability: 75 },
    { totalScore: 71, emotionScore: 72, commScore: 73, passionScore: 74, stabilityScore: 75 }
])('synastry preserves calculated scores, participants, interpretation, and fallback: %j', async scores => {
    const html = await open('synastry', {
        person1: { name: 'Model A' }, person2: { name: 'Model B' }, scores,
        interpretation: 'Původní rozbor vztahu.', fallback: true
    });
    for (const fragment of ['Model A', 'Model B', '71 %', '72 %', '73 %', '74 %', '75 %', 'Původní rozbor vztahu.', 'Osobní generování teď není dostupné']) expect(html).toContain(fragment);
    noRawJson(html);
});

test('horoscope preserves period, sign, full text, affirmation, and numbers', async () => {
    const html = await open('horoscope', {
        sign: 'Beran', period: 'weekly', prediction: 'Původní týdenní text.',
        affirmation: 'Dám si čas.', luckyNumbers: [3, 7, 12], fallback: true
    });
    for (const fragment of ['Beran', 'Týdenní horoskop', 'Původní týdenní text.', 'Dám si čas.', '3,7,12', 'Osobní generování teď není dostupné']) expect(html).toContain(fragment);
    noRawJson(html);
});

test('JSON-string reading payload is parsed, while a remote tarot image is rejected', async () => {
    const html = await open('tarot', JSON.stringify({
        cards: [{ name: 'Slunce', position: 'Výsledek', meaning: 'Jas', image: 'https://evil.invalid/card.webp' }],
        response: 'Výsledek & bezpečí'
    }));
    expect(html).toContain('src="img/tarot-v2/tarot_slunce.webp"');
    expect(html).not.toContain('evil.invalid');
    expect(html).toContain('Výsledek &amp; bezpečí');
    noRawJson(html);
});
