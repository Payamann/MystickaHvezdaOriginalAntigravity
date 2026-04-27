/**
 * Converts angel archetype PNG images to WebP format using sharp.
 * Run from the MystickaHvezda root: node server/scripts/convert-angel-archetypes.js
 */

import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');

const ARCHETYPES_DIR = join(ROOT, 'img', 'angel-archetypes');
const IMG_DIR = join(ROOT, 'img');

async function convertToWebP(inputPath, outputPath, quality = 85) {
    await sharp(inputPath)
        .webp({ quality })
        .toFile(outputPath);

    const { size: inSize } = (await import('fs')).statSync(inputPath);
    const { size: outSize } = (await import('fs')).statSync(outputPath);
    const saved = Math.round((1 - outSize / inSize) * 100);
    console.log(`✅ ${basename(inputPath)} → ${basename(outputPath)} (ušetřeno ${saved}%, ${Math.round(outSize / 1024)}KB)`);
}

async function main() {
    console.log('🔄 Konverze andělských obrázků na WebP...\n');

    // 1. Archetype images
    const files = await readdir(ARCHETYPES_DIR);
    const pngs = files.filter(f => extname(f).toLowerCase() === '.png');

    for (const file of pngs) {
        const inputPath = join(ARCHETYPES_DIR, file);
        const outputPath = join(ARCHETYPES_DIR, file.replace('.png', '.webp'));
        await convertToWebP(inputPath, outputPath, 85);
    }

    // 2. angel-card-back.png
    const backPng = join(IMG_DIR, 'angel-card-back.png');
    const backWebp = join(IMG_DIR, 'angel-card-back.webp');
    try {
        await convertToWebP(backPng, backWebp, 90);
    } catch (e) {
        console.warn('⚠️ angel-card-back.png nenalezen:', e.message);
    }

    console.log('\n✨ Hotovo! Aktualizuj reference v angel-cards.js z .png → .webp');
}

main().catch(console.error);
