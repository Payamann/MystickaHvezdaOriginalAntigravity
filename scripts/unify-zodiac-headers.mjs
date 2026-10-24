#!/usr/bin/env node

/** Use the shared site header on all twelve zodiac detail pages. */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SIGNS = [
  'beran', 'byk', 'blizenci', 'rak', 'lev', 'panna',
  'vahy', 'stir', 'strelec', 'kozoroh', 'vodnar', 'ryby',
];
const HEADER = '<div id="header-placeholder"></div>';
const HEADER_BLOCK = /<header\b[^>]*class="[^"]*\bheader\b[^"]*"[^>]*>[\s\S]*?<\/header>/g;

let changed = 0;
for (const sign of SIGNS) {
  const file = path.join(ROOT, 'horoskop', `${sign}.html`);
  const original = await readFile(file, 'utf8');
  const matches = original.match(HEADER_BLOCK) || [];
  if (matches.length === 0 && original.includes(HEADER)) continue;
  if (matches.length !== 1) {
    throw new Error(`${path.relative(ROOT, file)}: expected one static site header, found ${matches.length}`);
  }

  const updated = original.replace(HEADER_BLOCK, HEADER);
  if (updated !== original) {
    await writeFile(file, updated, 'utf8');
    changed += 1;
  }
}

console.log(`Unified ${changed} of ${SIGNS.length} zodiac detail header(s).`);
