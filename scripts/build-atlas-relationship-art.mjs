import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(path.join(root,'img/atlas'),{recursive:true});
for (const name of ['atlas-mutuality-v1','atlas-bridge-v1','atlas-shared-path-v1']) {
 await sharp(path.join(root,'docs/tarot-deck-v2',`${name}.png`)).resize({width:720,withoutEnlargement:true}).webp({quality:82}).toFile(path.join(root,'img/atlas',`${name}.webp`));
 console.log(`${name}: WebP ready`);
}
