import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'docs/tarot-deck-v2/art-library-v1');
const target = path.join(root, 'img/atlas');
await mkdir(target, { recursive: true });
const artworks = [
  ['01-lucerna-na-rozcesti', 1200], ['15-zlaty-klic', 720],
  ['10-hory-pred-svitanim', 720], ['05-studna-hvezd', 720],
  ['16-kompas-oliva', 640], ['08-seminko-mezi-kameny', 640],
  ['18-zapisnik-pero', 640], ['09-nocni-zahrada', 1200]
];
for (const [name, width] of artworks) {
  const destination = path.join(target, `${name}.webp`);
  await sharp(path.join(source, `${name}.png`)).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(destination);
  console.log(`${name}: ${Math.round((await stat(destination)).size / 1024)} kB`);
}
