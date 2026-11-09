import fs from 'fs';
import path from 'path';
import vm from 'vm';

const ROOT_DIR = path.resolve(process.cwd());

function readDailyCardSource() {
    return fs.readFileSync(path.join(ROOT_DIR, 'js', 'daily-card.js'), 'utf8');
}

function extractDailyCardImageSlugs(source) {
    const match = source.match(/const CARD_IMAGES = \{([\s\S]*?)\};/);
    if (!match) {
        throw new Error('CARD_IMAGES map not found in js/daily-card.js');
    }

    return [...match[1].matchAll(/:\s*'([^']+)'/g)].map((slugMatch) => slugMatch[1]);
}

describe('Daily card homepage assets', () => {
    test('every daily card image slug references an existing webp asset', () => {
        const slugs = extractDailyCardImageSlugs(readDailyCardSource());

        expect(slugs.length).toBeGreaterThan(20);

        for (const slug of slugs) {
            const assetPath = path.join(ROOT_DIR, 'img', 'daily-cards', `${slug}.webp`);
            expect(fs.existsSync(assetPath)).toBe(true);
        }
    });

    test('daily card copy does not contain known trust-breaking typos', () => {
        const source = readDailyCardSource();

        expect(source).not.toContain('energia');
        expect(source).not.toContain('poviností');
        expect(source).not.toContain('Hrej si');
        expect(source).not.toContain('Ukotví se');
    });

    test('linked card details use the same current names, themes and messages as the homepage', () => {
        const homepage = readDailyCardSource();
        const detail = fs.readFileSync(path.join(ROOT_DIR, 'js', 'angel-cards.js'), 'utf8');
        const cards = vm.runInNewContext(homepage.match(/const CARDS = (\[[\s\S]*?\n    \]);/)[1]);
        const slugs = vm.runInNewContext(`(${homepage.match(/const CARD_IMAGES = (\{[\s\S]*?\n    \});/)[1]})`);
        const fallbacks = vm.runInNewContext(`(${detail.match(/const DAILY_CARD_FALLBACKS = (\{[\s\S]*?\n\});/)[1]})`);

        expect(Object.keys(fallbacks)).toHaveLength(cards.length);
        for (const card of cards) {
            const fallback = fallbacks[slugs[card.name]];
            expect(fallback).toBeDefined();
            expect(fallback.name).toBe(card.name);
            expect(fallback.keyword).toBe(card.keyword);
            expect(fallback.text).toBe(card.text);
        }
    });
});
