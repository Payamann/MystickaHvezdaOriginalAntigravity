#!/usr/bin/env node
/** Idempotently adds the atlas visual shell to the bounded content migration. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const groups = [
  'snar.html',
  'slovnik.html',
  ...fs.readdirSync(path.join(ROOT, 'snar')).filter((f) => f.endsWith('.html')).map((f) => path.join('snar', f)),
  ...fs.readdirSync(path.join(ROOT, 'slovnik')).filter((f) => f.endsWith('.html')).map((f) => path.join('slovnik', f)),
  ...fs.readdirSync(path.join(ROOT, 'jmena')).filter((f) => f.endsWith('.html')).map((f) => path.join('jmena', f))
];

import { atlasShell } from './atlas-shell.mjs';
let changed = 0;
for (const relative of groups) {
 const file = path.join(ROOT, relative);
 const before = fs.readFileSync(file, 'utf8');
 const detail = relative.includes(path.sep) && path.basename(relative) !== 'index.html';
 const after = atlasShell(before, detail ? 'atlas-content-page atlas-content-detail' : 'atlas-content-page', 'atlas-content.css');
 if (after !== before) { fs.writeFileSync(file, after, 'utf8'); changed++; }
}
console.log(`[atlas-content] ${groups.length} pages; changed ${changed}`);
