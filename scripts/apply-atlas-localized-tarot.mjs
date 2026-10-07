import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const locales = {
  sk: ['Karty z nášho maľovaného tarotového balíčka', 'Podrobné výklady sa otvárajú v českej verzii webu.'],
  pl: ['Karty z naszej malowanej talii tarota', 'Szczegółowe odczyty otwierają się w czeskiej wersji strony.'],
};
for (const [locale, [caption, note]] of Object.entries(locales)) {
  const file = root + locale + '/tarot.html';
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('atlas-localized-tarot.css')) html = html.replace('</head>', '<link rel="stylesheet" href="/css/atlas-localized-tarot.css?v=1">\n</head>');
  html = html.replace(/<body class="([^"]*)"/, (_, classes) => `<body class="${[...new Set([...classes.split(/\s+/), 'atlas-localized-tarot'])].join(' ')}"`);
  const destinations = ['/tarot-karta-dne.html', '/tarot-tri-karty.html', '/tarot-keltsky-kriz.html'];
  let position = 0;
  html = html.replace(/<button\b[^>]*class="[^"]*spread-trigger[^>]*>([\s\S]*?)<\/button>/g, (_, label) => `<a class="btn btn--${position === 1 ? 'primary' : 'glass'} btn--full" href="${destinations[position++]}">${label}</a>`);
  html = html.replace(/(<div class="tarot-deck">)[\s\S]*?(<\/div>\s*<\/div>\s*<\/section>)/, (_, start, end) => `${start}\n${['tarot_hvezda', 'tarot_card_back', 'tarot_slunce'].map(name => `                    <div class="tarot-card" aria-hidden="true"><img src="/img/tarot-v2/${name}.webp" alt="" width="600" height="1000" loading="lazy" decoding="async"></div>`).join('\n')}\n                ${end}`);
  html = html.replace(/<p class="mb-xl">[^<]*<\/p>\s*(?=<div class="tarot-deck">)/, `<p class="mb-xl">${caption}</p>\n                `);
  if (!html.includes('tarot-language-note')) html = html.replace(/(<\/div>\s*<\/div>\s*<\/div>\s*<\/section>)/, `<p class="tarot-language-note">${note}</p>\n$1`);
  fs.writeFileSync(file, html);
}
console.log('Localized tarot: SK/PL card art, layout and reading destinations aligned.');
