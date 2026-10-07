#!/usr/bin/env node

/**
 * Generate the 12 evergreen horoscope Open Graph cards.
 *
 * Run from anywhere with:
 *   node scripts/generate-og-horoscope-cards.mjs
 *
 * Source artwork and fonts are project owned. The output stays at the URLs
 * already referenced by the horoscope pages: img/og/horoskop-{slug}.jpg.
 */

import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ART = path.join(ROOT, 'img', 'atlas', 'tools-v1', '02-mesicni-krajina.webp');
const OUTPUT = path.join(ROOT, 'img', 'og');
const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  navy: '#0b1929',
  ivory: '#e9e3d7',
  antiqueGold: '#bd9b65',
};

const SIGNS = [
  ['beran', 'Beran', '♈'],
  ['byk', 'Býk', '♉'],
  ['blizenci', 'Blíženci', '♊'],
  ['rak', 'Rak', '♋'],
  ['lev', 'Lev', '♌'],
  ['panna', 'Panna', '♍'],
  ['vahy', 'Váhy', '♎'],
  ['stir', 'Štír', '♏'],
  ['strelec', 'Střelec', '♐'],
  ['kozoroh', 'Kozoroh', '♑'],
  ['vodnar', 'Vodnář', '♒'],
  ['ryby', 'Ryby', '♓'],
];

const escapeXml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const asDataUrl = (buffer) => `data:font/ttf;base64,${buffer.toString('base64')}`;

const [cinzel, interRegular, interSemiBold] = await Promise.all([
  readFile(path.join(ROOT, 'fonts', '8vIU7ww63mVu7gtR-kwKxNvkNOjw-jHgTYo.ttf')),
  readFile(path.join(ROOT, 'fonts', 'inter-regular.ttf')),
  readFile(path.join(ROOT, 'fonts', 'inter-semibold.ttf')),
]);

function titleSize(name) {
  if (name.length >= 8) return 70;
  if (name.length >= 7) return 76;
  return 86;
}

function overlay(name, symbol, ordinal) {
  const safeName = escapeXml(name.toLocaleUpperCase('cs-CZ'));
  const safeSymbol = escapeXml(symbol);
  const size = titleSize(name);
  const number = String(ordinal).padStart(2, '0');

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
      <defs>
        <style>
          @font-face { font-family: 'CinzelCard'; src: url('${asDataUrl(cinzel)}'); font-weight: 700; }
          @font-face { font-family: 'InterCard'; src: url('${asDataUrl(interRegular)}'); font-weight: 400; }
          @font-face { font-family: 'InterCard'; src: url('${asDataUrl(interSemiBold)}'); font-weight: 600; }
          .cinzel { font-family: 'CinzelCard', serif; }
          .inter { font-family: 'InterCard', sans-serif; }
        </style>
        <linearGradient id="wash" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="${COLORS.navy}" stop-opacity="0.99"/>
          <stop offset="0.38" stop-color="${COLORS.navy}" stop-opacity="0.94"/>
          <stop offset="0.61" stop-color="${COLORS.navy}" stop-opacity="0.56"/>
          <stop offset="0.84" stop-color="${COLORS.navy}" stop-opacity="0.12"/>
          <stop offset="1" stop-color="${COLORS.navy}" stop-opacity="0.04"/>
        </linearGradient>
        <linearGradient id="bottomWash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stop-color="${COLORS.navy}" stop-opacity="0"/>
          <stop offset="1" stop-color="${COLORS.navy}" stop-opacity="0.72"/>
        </linearGradient>
      </defs>

      <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.navy}" opacity="0.18"/>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#wash)"/>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bottomWash)"/>
      <rect x="22" y="22" width="1156" height="586" rx="3" fill="none" stroke="${COLORS.antiqueGold}" stroke-opacity="0.36"/>

      <text x="72" y="78" class="inter" fill="${COLORS.ivory}" font-size="17" font-weight="600" letter-spacing="3.4">MYSTICKÁ HVĚZDA</text>
      <line x1="72" y1="104" x2="133" y2="104" stroke="${COLORS.antiqueGold}" stroke-width="3"/>

      <text x="72" y="207" class="cinzel" fill="${COLORS.antiqueGold}" font-size="29" font-weight="700" letter-spacing="4.5">HOROSKOP</text>
      <text x="67" y="315" class="cinzel" fill="${COLORS.ivory}" font-size="${size}" font-weight="700" letter-spacing="0.5">${safeName}</text>
      <text x="73" y="362" class="inter" fill="${COLORS.ivory}" fill-opacity="0.78" font-size="18" letter-spacing="2.2">ZNAMENÍ ZVĚROKRUHU</text>

      <g transform="translate(73 455)">
        <circle cx="31" cy="31" r="30" fill="${COLORS.navy}" fill-opacity="0.42" stroke="${COLORS.antiqueGold}" stroke-opacity="0.82"/>
        <text x="31" y="42" text-anchor="middle" fill="${COLORS.antiqueGold}" font-family="'Segoe UI Symbol','Arial Unicode MS',sans-serif" font-size="31">${safeSymbol}</text>
        <line x1="83" y1="31" x2="137" y2="31" stroke="${COLORS.antiqueGold}" stroke-opacity="0.58"/>
        <text x="157" y="37" class="inter" fill="${COLORS.ivory}" fill-opacity="0.67" font-size="14" letter-spacing="2.4">${number} / 12</text>
      </g>

      <text x="1127" y="574" text-anchor="end" class="inter" fill="${COLORS.ivory}" fill-opacity="0.64" font-size="15" letter-spacing="1.5">MYSTICKAHVEZDA.CZ</text>
    </svg>
  `);
}

await mkdir(OUTPUT, { recursive: true });

const background = await sharp(ART)
  .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 94, chromaSubsampling: '4:4:4' })
  .toBuffer();

for (const [index, [slug, name, symbol]] of SIGNS.entries()) {
  const target = path.join(OUTPUT, `horoskop-${slug}.jpg`);
  await sharp(background)
    .composite([{ input: overlay(name, symbol, index + 1) }])
    .jpeg({ quality: 91, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toFile(target);
  console.log(`Generated ${path.relative(ROOT, target)}`);
}

const checks = await Promise.all(SIGNS.map(async ([slug]) => {
  const file = path.join(OUTPUT, `horoskop-${slug}.jpg`);
  const metadata = await sharp(file).metadata();
  if (metadata.width !== WIDTH || metadata.height !== HEIGHT || metadata.format !== 'jpeg') {
    throw new Error(`Invalid output ${file}: ${metadata.width}x${metadata.height} ${metadata.format}`);
  }
  return file;
}));

console.log(`Verified ${checks.length} JPEG cards at ${WIDTH}x${HEIGHT}.`);
