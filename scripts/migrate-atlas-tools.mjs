import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const pages = ['runy.html', 'kristalova-koule.html', 'numerologie.html', 'lunace.html'];
import { atlasShell } from './atlas-shell.mjs';
for (const file of pages) {
 const target = path.join(root, file);
 const before = await fs.readFile(target, 'utf8');
 const after = atlasShell(before, file === 'lunace.html' ? 'page-lunace' : (file === 'runy.html' ? 'page-runes' : file === 'numerologie.html' ? 'page-numerology' : 'page-crystal-ball'), 'atlas-tools.css');
 if (after !== before) await fs.writeFile(target, after);
 console.log(`${file}: ${after === before ? 'unchanged' : 'updated'}`);
}
