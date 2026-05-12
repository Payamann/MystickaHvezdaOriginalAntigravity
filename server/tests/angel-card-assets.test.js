import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve(process.cwd());

function readAngelCards() {
    const filePath = path.join(ROOT_DIR, 'data', 'angel-cards.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readAngelCardCss() {
    return fs.readFileSync(path.join(ROOT_DIR, 'css', 'pages', 'andelske-karty.css'), 'utf8');
}

describe('Angel card deck assets', () => {
    test('main angel deck contains exactly 44 complete unique cards', () => {
        const cards = readAngelCards();
        const ids = new Set(cards.map((card) => card.id));

        expect(cards).toHaveLength(44);
        expect(ids.size).toBe(cards.length);

        for (const card of cards) {
            expect(typeof card.id).toBe('string');
            expect(card.id.trim()).toBe(card.id);
            expect(card.id).not.toHaveLength(0);
            expect(typeof card.name).toBe('string');
            expect(card.name.trim()).not.toHaveLength(0);
            expect(typeof card.theme).toBe('string');
            expect(card.theme.trim()).not.toHaveLength(0);
            expect(typeof card.short_message).toBe('string');
            expect(card.short_message.trim()).not.toHaveLength(0);
            expect(typeof card.archetype).toBe('string');
            expect(card.archetype.trim()).not.toHaveLength(0);
        }
    });

    test('every main angel archetype has a CSS card class and webp asset', () => {
        const cards = readAngelCards();
        const css = readAngelCardCss();
        const archetypes = [...new Set(cards.map((card) => card.archetype))].sort();

        expect(archetypes.length).toBeGreaterThan(4);

        for (const archetype of archetypes) {
            expect(css).toContain(`.angel-card-back--${archetype}`);
            expect(fs.existsSync(path.join(ROOT_DIR, 'img', 'angel-archetypes', `${archetype}.webp`))).toBe(true);
        }
    });
});
