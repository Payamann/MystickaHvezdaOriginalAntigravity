import fs from 'node:fs';
import { getPragueDateKey, getDailyCardIndex, getDailyCardPractice } from '../../js/utils/daily-tarot.js';

const cards = JSON.parse(fs.readFileSync('data/tarot-cards.json', 'utf8'));

test('daily dates use Prague midnight, including winter and summer offsets', () => {
    expect(getPragueDateKey(new Date('2026-10-14T21:59:59Z'))).toBe('2026-10-14');
    expect(getPragueDateKey(new Date('2026-10-14T22:00:00Z'))).toBe('2026-10-15');
    expect(getPragueDateKey(new Date('2026-12-31T23:00:00Z'))).toBe('2027-01-01');
    expect(getDailyCardIndex(78, new Date('2026-10-14T22:00:00Z'))).toBe(getDailyCardIndex(78, new Date('2026-10-15T18:00:00Z')));
});

test('all 78 named cards have a distinct question and action plus a curated observation', () => {
    const names = Object.keys(cards);
    const practices = names.map(name => getDailyCardPractice(name));
    expect(names).toHaveLength(78);
    expect(new Set(practices.map(practice => practice.question)).size).toBe(78);
    expect(new Set(practices.map(practice => practice.action)).size).toBe(78);
    expect(practices.every(practice => practice.observation && practice.meaning && practice.action)).toBe(true);
});
