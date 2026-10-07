import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../', import.meta.url);
const targets = ['blog.html', ...(await readdir(new URL('blog/', root))).filter((name) => name.endsWith('.html')).map((name) => `blog/${name}`)];

import { atlasShell } from './atlas-shell.mjs';
let changed = 0;
for (const relative of targets) {
 const file = new URL(relative, root);
 const before = await readFile(file, 'utf8');
 const after = atlasShell(before, 'atlas-blog', 'atlas-blog.css');
 if (after !== before) { await writeFile(file, after); changed++; }
}
console.log(`[atlas-blog] ${targets.length} pages; changed ${changed}`);
