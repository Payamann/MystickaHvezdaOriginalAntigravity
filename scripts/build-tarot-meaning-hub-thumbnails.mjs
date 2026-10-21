import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const pagePath = path.join(root, 'tarot-vyznam-karet.html');
const widths = [240, 360];
const cardData = JSON.parse(await fs.readFile(path.join(root, 'data/tarot-card-hub.json'), 'utf8'));
const assets = new Map();

for (const card of Object.values(cardData)) {
  const source = String(card.image || '');
  if (!/^img\/tarot-v2\/tarot_[^/]+\.webp$/i.test(source)) throw new Error(`Unexpected card image: ${source}`);
  const sourcePath = path.resolve(root, source);
  const metadata = await sharp(sourcePath).metadata();
  if (metadata.width !== 600) throw new Error(`Expected a 600px card: ${source} (${metadata.width}px)`);

  const candidates = [];
  for (const width of widths) {
    const outputPath = sourcePath.replace(/\.webp$/i, `-${width}.webp`);
    try {
      await fs.access(outputPath);
    } catch {
      await sharp(sourcePath).resize({ width, withoutEnlargement: true }).webp({ quality: 83, effort: 6 }).toFile(outputPath);
    }
    candidates.push({ width, source: source.replace(/\.webp$/i, `-${width}.webp`), bytes: (await fs.stat(outputPath)).size });
  }
  candidates.push({ width: metadata.width, source, bytes: (await fs.stat(sourcePath)).size });
  assets.set(sourcePath, candidates);
}

const page = await fs.readFile(pagePath, 'utf8');
const tags = [...page.matchAll(/<img\b[^>]*\bsrc=["']([^"']*img\/tarot-v2\/tarot_[^"']+\.webp)["'][^>]*>/gi)];
let html = page;
for (const match of tags) {
  const source = match[1];
  const tag = match[0];
  const sourcePath = path.resolve(root, source);
  const candidates = assets.get(sourcePath);
  if (!candidates) throw new Error(`No variants built for gallery image: ${source}`);
  const srcset = candidates.map((candidate) => `${candidate.source} ${candidate.width}w`).join(', ');
  const updated = tag.replace(/\s+srcset=(['"])[^'"]*\1/i, '')
    .replace(/\s+sizes=(['"])[^'"]*\1/i, '')
    .replace(/\bsrc=(['"])[^'"]*\1/i, (srcAttribute) => srcAttribute + ' srcset="' + srcset + '" sizes="(max-width: 560px) 170px, 108px"');
  html = html.replace(tag, updated);
}

if (assets.size !== 78 || tags.length !== 12) throw new Error(`Expected 78 deck cards and 12 static hub images; found ${assets.size} and ${tags.length}`);
await fs.writeFile(pagePath, html, 'utf8');
console.log(`Built 240/360px derivatives for ${assets.size} card images and updated ${tags.length} static gallery tags.`);
