import { readFile, writeFile } from 'node:fs/promises';

// Explicit batches: shared shell only. Tool logic and checkout stay in their sources.
const pages = ['tarot.html', 'tarot-zdarma.html', 'tarot-keltsky-kriz.html', 'vztahovy-vyklad.html'];
for (const page of pages) {
  const before = await readFile(page, 'utf8');
  let after = before.replace(/<body([^>]*)>/, (tag, attrs) => {
    if (/class="[^"]*\batlas-page\b/.test(attrs)) return tag;
    return /class="/.test(attrs)
      ? `<body${attrs.replace(/class="([^"]*)"/, 'class="$1 atlas-page"')}>`
      : `<body${attrs} class="atlas-page">`;
  });
  after = after.replace(/\s*<div class="stars" aria-hidden="true"><\/div>/g, '');
  if (!after.includes('/css/atlas-web.css')) {
    after = after.replace('</head>', '    <link rel="stylesheet" href="/css/atlas-web.css?v=1">\n</head>');
  }
  if (page === 'vztahovy-vyklad.html') {
    after = after.replace('class="atlas-page"', 'class="atlas-page atlas-reading-order"');
  }
  if (page === 'tarot-zdarma.html') {
    let cardIndex = 0;
    after = after.replace(/<div class="demo-card[^\"]*" data-action="flipCard"[\s\S]*?<\/div>/g, () =>
      `<button class="demo-card" type="button" data-action="flipCard" data-preview-card="${cardIndex++}" aria-label="Otočit ukázkovou kartu"><img src="/img/tarot-v2/tarot_card_back.webp" width="120" height="200" alt="Rub tarotové karty"></button>`);
    if (!after.includes('id="tarot-demo-caption"')) after = after.replace('Klikněte na kartu pro ukázku</p>', 'Klikněte na kartu pro ukázku</p>\n<p id="tarot-demo-caption" class="atlas-demo-caption" aria-live="polite"></p>');
  }
  after = after.replace(/(<meta name="theme-color" content=")[^"]+/, '$1#0b1929');
  if (page === 'tarot.html') {
    after = after.replace('✨ Interpretace od našeho astrologa:', 'Ukázková symbolická interpretace:');
    after = after.replace(/<div class="t-spread-icon">\s*<img[^>]+src="img\/icon-tarot-(one|three|celtic)\.webp"[^>]*>\s*<\/div>/g, (_, type) => {
      const count = type === 'one' ? 1 : 3;
      return `<div class="t-spread-icon atlas-spread-art" aria-hidden="true">${Array.from({length:count}, () => '<img loading="lazy" src="/img/tarot-v2/tarot_card_back.webp" alt="" width="60" height="100">').join('')}</div>`;
    });
  }
  if (after !== before) await writeFile(page, after);
  console.log(`${page}: ${after === before ? 'unchanged' : 'updated'}`);
}
