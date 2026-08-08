import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const blogDir = path.join(rootDir, 'blog');
const files = fs.readdirSync(blogDir).filter((name) => name.endsWith('.html')).sort();
const structuredAuthorPattern = /\"author\"\s*:\s*\{[^{}]*\}/gs;
const canonicalAuthor = '"author": {"@type": "Organization", "name": "Mystická Hvězda", "url": "https://www.mystickahvezda.cz/#organization"}';
let changed = 0;

for (const fileName of files) {
    const file = path.join(blogDir, fileName);
    const source = fs.readFileSync(file, 'utf8');
    const normalized = source
        .replace(structuredAuthorPattern, canonicalAuthor)
        .replace(/<meta property="article:author" content="[^"]*">/g, '<meta property="article:author" content="Mystická Hvězda">')
        .replace(/Napsal:\s*(?:Mystická Hvězda|Mystický Průvodce|Průvodkyně Světla|Astrolog Pavel)/g, 'Připravil tým Mystická Hvězda');

    if (normalized !== source) {
        fs.writeFileSync(file, normalized, 'utf8');
        changed += 1;
    }
}

console.log(`[blog-authors] Normalized brand authorship in ${changed} file(s).`);
