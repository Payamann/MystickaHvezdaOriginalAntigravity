// Same artwork and grid geometry; a smaller derivative for 56px card portraits.
import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../img/atlas/western-zodiac-v1.webp', import.meta.url));
const output = fileURLToPath(new URL('../img/atlas/western-zodiac-v1-grid.webp', import.meta.url));
const metadata = await sharp(source).metadata();
if (metadata.width !== 1024 || metadata.height !== 1536) {
    throw new Error('Unexpected source geometry; review the zodiac grid before resizing.');
}
await sharp(source).resize(512, 768, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88, effort: 6 }).toFile(output);
console.log(JSON.stringify({ sourceBytes: (await stat(source)).size, derivativeBytes: (await stat(output)).size, width: 512, height: 768 }));
