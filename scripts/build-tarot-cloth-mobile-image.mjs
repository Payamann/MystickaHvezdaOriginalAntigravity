import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../img/search-preview/tarot-cloth-hero-optimized.webp', import.meta.url));
const output = fileURLToPath(new URL('../img/search-preview/tarot-cloth-hero-mobile-800.webp', import.meta.url));
const sourceMetadata = await sharp(source).metadata();

if (sourceMetadata.width !== 1600 || sourceMetadata.height !== 900) {
    throw new Error(`Unexpected tarot cloth source dimensions: ${sourceMetadata.width}x${sourceMetadata.height}`);
}

await sharp(source)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(output);

const [outputMetadata, outputStats, sourceStats] = await Promise.all([
    sharp(output).metadata(),
    stat(output),
    stat(source)
]);

if (outputMetadata.width !== 800 || outputMetadata.height !== 450 || outputStats.size >= sourceStats.size) {
    throw new Error(`Unexpected mobile tarot cloth output: ${outputMetadata.width}x${outputMetadata.height}, ${outputStats.size} B`);
}

console.log(`${output}: ${outputMetadata.width}x${outputMetadata.height}, ${outputStats.size} B (source ${sourceStats.size} B)`);
