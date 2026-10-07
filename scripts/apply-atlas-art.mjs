import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
// Explicit editorial mapping: decorative illustrations never replace calculated results.
const pages = [
  ['natalni-karta.html', 'astrolab'],
  ['numerologie.html', 'notebook', '01-dva-hrnky', 'Dva hrnky na terase v ranním světle', 'section section--alt'],
  ['lunace.html', 'moon'],
  ['runy.html', 'runes', '07-volavka', 'Volavka u klidného jezera', 'section runes-intent-section'],
  ['shamansko-kolo.html', 'forest'],
  ['minuly-zivot.html', 'mirror'],
  ['biorytmy.html', 'rest', '05-kocka-u-okna', 'Kočka odpočívající u otevřeného okna', 'section cross-linking-section'],
  ['aura.html', null, '10-sova', 'Sova v koruně stromu za soumraku', 'section'],
  ['kristalova-koule.html', 'crystal'],
  ['sk/kristalova-koule.html', 'crystal'],
  ['pl/kristalova-koule.html', 'crystal'],
  ['o-nas.html', 'about'],
];
let changed = 0;
for (const [file, theme, image, alt, sectionClass] of pages) {
  const path = root + file;
  let html = fs.readFileSync(path, 'utf8');
  const before = html;
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  html = html.replace(/\s*<link rel="stylesheet" href="\/css\/atlas-art\.css\?v=1">/g, '');
  html = html.replace('</head>', `    <link rel="stylesheet" href="/css/atlas-art.css?v=1">${nl}</head>`);
  if (theme) {
    html = html.replace(/(<main\b[^>]*>[\s\S]*?<section\b[^>]*class=")([^"]*)/, (_, prefix, classes) =>
      prefix + [...new Set([...classes.split(/\s+/).filter(Boolean), 'atlas-art-hero', `atlas-art-${theme}`])].join(' '));
  }
  if (image) {
    html = html.replace(/<figure class="atlas-art-interlude" data-atlas-interlude>[\s\S]*?<\/figure>\s*/g, '');
    // Find a specific explanatory section, never inject into forms or result containers.
    const marker = `<section class="${sectionClass}"`;
    let start = html.indexOf(marker, html.indexOf('<main'));
    if (start < 0) throw new Error(`Missing editorial section: ${file}`);
    const figure = `<figure class="atlas-art-interlude" data-atlas-interlude>${nl}            <img src="/img/atlas/social-v1/${image}.webp" alt="${alt}" width="1080" height="1080" loading="lazy" decoding="async">${nl}        </figure>${nl}        `;
    html = html.slice(0, start) + figure + html.slice(start);
  }
  if (theme === 'crystal') {
    html = html.replace(/src="(?:\.\.\/)?img\/crystal-ball-3d.webp"/, 'src="/img/atlas/tools-v1/05-kristalova-koule.webp"')
      .replace('alt="Magická Křišťálová Koule"', 'alt="Křišťálová koule u okna ve světle svíčky"')
      .replace('alt="Magická Krištáľová Guľa"', 'alt="Krištáľová guľa pri okne vo svetle sviečky"')
      .replace('alt="Magiczna Kryształowa Kula"', 'alt="Kryształowa kula przy oknie w świetle świecy"')
      .replace(/class="ball-image"(?: width="\d+" height="\d+")?/, 'class="ball-image" width="1200" height="800"');
  }
  if (theme === 'about') {
    html = html.replace('src="img/hero-3d.webp" alt="Mystická Hvězda"', 'src="/img/atlas/tools-v1/01-astrolab.webp" alt="Mosazný astroláb v malované noční krajině"')
      .replace('width="800" height="751"', 'width="1200" height="800"');
  }
  if (html !== before) { fs.writeFileSync(path, html); changed++; }
}
console.log(`Atlas art: ${pages.length} explicit pages, ${changed} changed.`);
