import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../img/atlas/tools-v1/05-kristalova-koule.webp', import.meta.url));
const output = fileURLToPath(new URL('../img/atlas/tools-v1/05-kristalova-koule-600.webp', import.meta.url));
const sourceMetadata = await sharp(source).metadata();

if (!sourceMetadata.width || !sourceMetadata.height || sourceMetadata.width < 600) {
    throw new Error('Crystal ball source must be at least 600px wide.');
}

await sharp(source)
    .resize({ width: 600, withoutEnlargement: true })
    .webp({ quality: 86, effort: 6 })
    .toFile(output);

const [outputMetadata, outputStats] = await Promise.all([
    sharp(output).metadata(),
    stat(output)
]);

if (outputMetadata.width !== 600 || outputMetadata.height !== Math.round(600 * sourceMetadata.height / sourceMetadata.width)) {
    throw new Error(`Unexpected crystal ball variant dimensions: ${outputMetadata.width}x${outputMetadata.height}`);
}

console.log(`${output}: ${outputMetadata.width}x${outputMetadata.height}, ${outputStats.size} B`);
