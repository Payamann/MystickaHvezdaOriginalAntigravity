import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

// Explicit editorial mapping for the remaining secondary pages. These are
// decorative replacements only; calculated maps and functional links stay as-is.
const mappings = [
  {
    file: 'sk/index.html',
    replacements: {
      '../img/icon-zodiac.webp': '/img/atlas/tools-v1/02-mesicni-krajina.webp',
      '/img/tarot-v2/tarot_card_back.webp': '/img/tarot-v2/tarot_card_back.webp',
      '/img/atlas/tools-v1/04-runove-kameny.webp': '/img/tarot-v2/tarot_card_back.webp',
      '../img/icon-crystal.webp': '/img/atlas/tools-v1/05-kristalova-koule.webp',
    },
  },
  {
    file: 'pl/index.html',
    replacements: {
      '../img/icon-zodiac.webp': '/img/atlas/tools-v1/02-mesicni-krajina.webp',
      '/img/tarot-v2/tarot_card_back.webp': '/img/tarot-v2/tarot_card_back.webp',
      '/img/atlas/tools-v1/04-runove-kameny.webp': '/img/tarot-v2/tarot_card_back.webp',
      '../img/icon-crystal.webp': '/img/atlas/tools-v1/05-kristalova-koule.webp',
    },
  },
  {
    file: 'sk/natalni-karta.html',
    replacements: { '../img/icon-natal.webp': '/img/atlas/tools-v1/01-astrolab.webp' },
  },
  {
    file: 'pl/natalni-karta.html',
    replacements: { '../img/icon-natal.webp': '/img/atlas/tools-v1/01-astrolab.webp' },
  },
  {
    file: 'o-nas.html',
    replacements: {
      'img/icon-zodiac.webp': '/img/atlas/tools-v1/01-astrolab.webp',
      'img/icon-tarot.webp': '/img/tarot-v2/tarot_hvezda.webp',
      '/img/atlas/tools-v1/04-runove-kameny.webp': '/img/tarot-v2/tarot_hvezda.webp',
      'img/icon-crystal.webp': '/img/atlas/tools-v1/05-kristalova-koule.webp',
      'img/icon-natal.webp': '/img/atlas/tools-v1/01-astrolab.webp',
      'img/icon-ancient-scroll.webp': '/img/atlas/tools-v1/03-numerologicky-zapisnik.webp',
    },
  },
  {
    file: 'astro-mapa.html',
    replacements: {
      'img/icon-astrocartography.webp': '/img/atlas/tools-v1/01-astrolab.webp',
      'img/icon-relocation.webp': '/img/atlas/tools-v1/06-lesni-kruh.webp',
      'img/icon-travel.webp': '/img/atlas/tools-v1/02-mesicni-krajina.webp',
    },
  },
  {
    file: 'tydenni-horoskop.html',
    replacements: { 'img/icon-zodiac.webp': '/img/atlas/tools-v1/02-mesicni-krajina.webp' },
  },
  {
    file: 'mesicni-horoskop.html',
    replacements: { 'img/icon-zodiac.webp': '/img/atlas/tools-v1/02-mesicni-krajina.webp' },
  },
  {
    file: 'osobni-rok-2026.html',
    replacements: { 'img/icon-numerology.webp': '/img/atlas/tools-v1/03-numerologicky-zapisnik.webp' },
  },
  {
    file: 'partnerska-numerologie.html',
    replacements: { 'img/icon-numerology.webp': '/img/atlas/tools-v1/03-numerologicky-zapisnik.webp' },
  },
  {
    file: 'vyznam-data-narozeni.html',
    replacements: { 'img/icon-numerology.webp': '/img/atlas/tools-v1/03-numerologicky-zapisnik.webp' },
  },
  {
    file: 'ochrana-soukromi.html',
    replacements: {
      'https://www.mystickahvezda.cz/img/hero-3d.webp': 'https://www.mystickahvezda.cz/img/search-preview/other.webp',
      'https://www.mystickahvezda.cz/img/atlas/tools-v1/03-numerologicky-zapisnik.webp': 'https://www.mystickahvezda.cz/img/search-preview/other.webp',
    },
  },
  {
    file: 'prihlaseni.html',
    replacements: {
      'https://www.mystickahvezda.cz/img/hero-3d.webp': 'https://www.mystickahvezda.cz/img/search-preview/other.webp',
      'https://www.mystickahvezda.cz/img/atlas/tools-v1/01-astrolab.webp': 'https://www.mystickahvezda.cz/img/search-preview/other.webp',
    },
  },
  {
    file: 'profil.html',
    replacements: {
      'https://www.mystickahvezda.cz/img/hero-3d.webp': 'https://www.mystickahvezda.cz/img/search-preview/other.webp',
      'https://www.mystickahvezda.cz/img/atlas/tools-v1/03-numerologicky-zapisnik.webp': 'https://www.mystickahvezda.cz/img/search-preview/other.webp',
    },
  },
  {
    file: 'rocni-horoskop.html',
    replacements: {
      'https://www.mystickahvezda.cz/img/og-horoskop.jpg': 'https://www.mystickahvezda.cz/img/search-preview/horoscopes.webp',
      'https://www.mystickahvezda.cz/img/atlas/tools-v1/02-mesicni-krajina.webp': 'https://www.mystickahvezda.cz/img/search-preview/horoscopes.webp',
    },
  },
];

const assetPaths = [...new Set(mappings.flatMap(({ replacements }) => Object.values(replacements)))].map((value) => {
  const pathname = new URL(value, 'https://www.mystickahvezda.cz/').pathname.replace(/^\//, '');
  return pathname;
});
for (const asset of assetPaths) {
  if (!fs.existsSync(path.join(root, asset))) throw new Error(`Missing atlas asset: ${asset}`);
}

let changed = 0;
let replacements = 0;
for (const { file, replacements: pageMappings } of mappings) {
  const target = path.join(root, file);
  let html = fs.readFileSync(target, 'utf8');
  const before = html;
  for (const [from, to] of Object.entries(pageMappings)) {
    if (from === to) continue;
    const count = html.split(from).length - 1;
    if (count === 0) continue;
    html = html.split(from).join(to);
    replacements += count;
  }
  if (html !== before) {
    fs.writeFileSync(target, html);
    changed++;
  }
}

console.log(`Atlas secondary art: ${changed}/${mappings.length} pages changed, ${replacements} references replaced.`);
