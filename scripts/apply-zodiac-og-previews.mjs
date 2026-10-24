#!/usr/bin/env node

/** Assign each zodiac detail page its matching 1200x630 Open Graph image. */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = 'https://www.mystickahvezda.cz/img/og';
const SIGNS = [
  ['beran', 'Berana'], ['byk', 'Býka'], ['blizenci', 'Blíženců'], ['rak', 'Raka'],
  ['lev', 'Lva'], ['panna', 'Panny'], ['vahy', 'Vah'], ['stir', 'Štíra'],
  ['strelec', 'Střelce'], ['kozoroh', 'Kozoroha'], ['vodnar', 'Vodnáře'], ['ryby', 'Ryb'],
];

function replaceSingle(html, expression, replacement, label, file) {
  const matches = [...html.matchAll(expression)];
  if (matches.length !== 1) {
    throw new Error(`${file}: expected exactly one ${label} tag, found ${matches.length}`);
  }
  return html.replace(expression, replacement);
}

let changed = 0;
for (const [sign, genitive] of SIGNS) {
  const file = path.join(ROOT, 'horoskop', `${sign}.html`);
  const original = await readFile(file, 'utf8');
  const imageUrl = `${BASE_URL}/horoskop-${sign}.jpg`;
  let html = replaceSingle(
    original,
    /<meta property="og:image" content="[^"]+">/g,
    `<meta property="og:image" content="${imageUrl}">`,
    'og:image',
    path.relative(ROOT, file),
  );
  html = replaceSingle(
    html,
    /<meta name="twitter:image" content="[^"]+">/g,
    `<meta name="twitter:image" content="${imageUrl}">`,
    'twitter:image',
    path.relative(ROOT, file),
  );
  const alt = `Malovaná karta znamení ${genitive} ve stylu tarotového atlasu.`;
  html = replaceSingle(
    html,
    /<meta property="og:image:alt" content="[^"]+">/g,
    `<meta property="og:image:alt" content="${alt}">`,
    'og:image:alt',
    path.relative(ROOT, file),
  );
  html = replaceSingle(
    html,
    /<meta name="twitter:image:alt" content="[^"]+">/g,
    `<meta name="twitter:image:alt" content="${alt}">`,
    'twitter:image:alt',
    path.relative(ROOT, file),
  );

  if (html !== original) {
    await writeFile(file, html, 'utf8');
    changed += 1;
  }
}

console.log(`Updated ${changed} of ${SIGNS.length} zodiac page(s).`);
