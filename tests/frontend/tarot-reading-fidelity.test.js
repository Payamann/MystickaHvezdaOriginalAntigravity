import fs from 'node:fs';
import vm from 'node:vm';
import { jest } from '@jest/globals';
import { savedTarotCards, tarotCardPosition } from '../../js/utils/tarot-reading-data.js';

const cards = [
    { name: 'Hvězda', meaning: 'Dát prostor naději', interpretation: 'Původní význam Hvězdy.\nKonkrétní krok.', image: 'img/tarot-v2/tarot_hvezda.webp' },
    { name: 'Slunce', meaning: 'Vidět jasně', interpretation: 'Původní význam Slunce.', image: 'img/tarot-v2/tarot_slunce.webp' },
    { name: 'Mág', meaning: 'Použít dostupné možnosti', interpretation: 'Původní význam Mága.', image: 'img/tarot-v2/tarot_mag.webp' }
];
const source = fs.readFileSync(new URL('../../js/tarot.js', import.meta.url), 'utf8').replace(/^import\s+[\s\S]*?;\s*$/gm, '');

function summaryHarness() {
    const children = [];
    const container = {
        dataset: {}, attrs: {}, innerHTML: '', isConnected: true,
        setAttribute(key, value) { this.attrs[key] = value; },
        appendChild(child) { children.push(child); },
        parentElement: { classList: { add() {} }, querySelectorAll() { return []; }, appendChild(child) { children.push(child); } }
    };
    const fetch = jest.fn();
    const saveReading = jest.fn(async () => ({ id: 'reading-test' }));
    const showFallbackNotice = jest.fn();
    const context = vm.createContext({
        document: {
            body: { classList: { add() {}, remove() {} } },
            addEventListener() {},
            querySelector() { return null; },
            getElementById: id => id === 'ethereal-tarot-summary' ? container : null,
            createElement() {
                return { dataset: {}, addEventListener(_type, callback) { this.click = callback; }, setAttribute() {}, insertAdjacentElement() {}, querySelector() { return { addEventListener() {} }; } };
            }
        },
        window: { location: { pathname: '/tarot.html' }, Auth: { saveReading }, addEventListener() {}, removeEventListener() {} },
        localStorage: { getItem() { return null; }, removeItem() {}, setItem() {} },
        fetch, AbortController, savedTarotCards, tarotCardPosition, showFallbackNotice,
        formatReadingHtml: text => text,
        console: { error() {}, warn() {}, debug() {} },
        URLSearchParams, URL, setTimeout, clearTimeout
    });
    vm.runInContext(`${source}\n;globalThis.__prepareTarotReading = () => { tarotReadingGeneration = 1; displayedTarotReadingSession = { isLoggedIn: false }; activeTarotReadingSession = { isLoggedIn: false }; observedTarotReadingSession = captureTarotReadingSession(); tarotReadingSessionInitialized = true; };`, context);
    vm.runInContext('__prepareTarotReading()', context);
    return { container, children, fetch, saveReading, showFallbackNotice, context };
}

test('saved cards retain every displayed meaning, interpretation, image, and position', () => {
    const saved = savedTarotCards(cards, 'Tři karty');
    expect(saved.map(card => card.position)).toEqual(['Minulost', 'Přítomnost', 'Budoucnost']);
    saved.forEach((card, index) => {
        expect(card).toMatchObject(cards[index]);
        expect(card).not.toBe(cards[index]);
    });
    expect(savedTarotCards(cards.slice(0, 1), 'Jedna karta')[0]).toMatchObject({ ...cards[0], position: 'Jedna karta' });
    expect(tarotCardPosition('Celtic Cross', 9)).toBe('Výsledek');
});

test('a fallback summary is marked and saved with full card text and original question', async () => {
    const h = summaryHarness();
    h.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, response: 'Původní náhradní souhrn.', fallback: true }) });
    h.context.testCards = cards;
    await vm.runInContext("generateEtherealSummary(testCards, 'Tři karty', {question:'Co mohu změnit?', answerLabel:'ANO'})", h.context);
    expect(h.showFallbackNotice).toHaveBeenCalledWith(h.container, true);
    const sent = JSON.parse(h.fetch.mock.calls[0][1].body);
    expect(sent.cards.every(card => !('interpretation' in card))).toBe(true);
    const saved = h.saveReading.mock.calls[0][1];
    expect(saved).toMatchObject({ question: 'Co mohu změnit?', previousAnswer: 'ANO', response: 'Původní náhradní souhrn.', fallback: true });
    expect(saved.cards[0].interpretation).toBe(cards[0].interpretation);
    expect(h.container.attrs['aria-busy']).toBe('false');
});

test('summary retry reuses the same cards and question, without a new draw', async () => {
    const h = summaryHarness();
    h.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ success: false }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, response: 'Obnovený souhrn.', fallback: false }) });
    h.context.testCards = cards;
    await vm.runInContext("generateEtherealSummary(testCards, 'Tři karty', {question:'Co mohu změnit?'})", h.context);
    expect(h.container.innerHTML).toContain('role="alert"');
    expect(h.saveReading).not.toHaveBeenCalled();
    h.children[0].click();
    await new Promise(resolve => setImmediate(resolve));
    expect(h.fetch).toHaveBeenCalledTimes(2);
    expect(h.fetch.mock.calls[1][1].body).toBe(h.fetch.mock.calls[0][1].body);
    expect(h.showFallbackNotice).toHaveBeenLastCalledWith(h.container, false);
    expect(h.saveReading).toHaveBeenCalledTimes(1);
    expect(h.container.innerHTML).toContain('Obnovený souhrn.');
});

test('an abandoned result cannot overwrite the new result or save a misleading history entry', async () => {
    const h = summaryHarness();
    let finish;
    h.fetch.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    h.context.testCards = cards;
    const pending = vm.runInContext("generateEtherealSummary(testCards, 'Tři karty')", h.context);
    h.container.isConnected = false;
    finish({ ok: true, json: async () => ({ success: true, response: 'Opožděný souhrn.' }) });
    await pending;
    expect(h.saveReading).not.toHaveBeenCalled();
    expect(h.container.innerHTML).toBe('');
});
