import fs from 'fs';
import path from 'path';

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
});
