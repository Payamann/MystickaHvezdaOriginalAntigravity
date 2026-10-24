export const MAIN_POLISH_PAGES = new Set([
 'index.html','tarot-ano-ne.html','tarot.html','tarot-laska.html','tarot-tri-karty.html','tarot-keltsky-kriz.html','tarot-karta-dne.html','tarot-vyznam-karet.html','vztahovy-vyklad.html',
 'horoskopy.html','horoskop/index.html','natalni-karta.html','partnerska-shoda.html','lunace.html','astro-mapa.html','cinsky-horoskop.html','numerologie.html','kalkulacka-cisla-osudu.html','aura.html','biorytmy.html',
 'andelske-karty.html','runy.html','shamansko-kolo.html','kristalova-koule.html','mentor.html','minuly-zivot.html','osobni-mapa.html','blog.html','snar.html','slovnik.html','testy/index.html',
 'cenik.html','prihlaseni.html','jak-to-funguje.html','o-nas.html','faq.html','kontakt.html','afirmace.html','andelska-posta.html','podminky.html','soukromi.html','profil.html','jmena/index.html','ritualy/index.html','onboarding.html'
]);

export function polishMainPage(html, explicitPath) {
 let page = explicitPath;
 if (!page) {
  const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i)?.[1];
  if (!canonical) return html;
  try { page = new URL(canonical).pathname; } catch { return html; }
 }
 page = page.replace(/^\//,'');
 if (!page || page.endsWith('/')) page += 'index.html';
 if (!MAIN_POLISH_PAGES.has(page)) return html;
 const slug = page.replace(/\.html$/,'').replaceAll('/','-');
 let next = html.replace(/<body([^>]*)>/i, (_,attrs) => `<body${attrs.replace(/\sdata-atlas-polish="[^"]*"/i,'')} data-atlas-polish="${slug}">`);
 next = next.replace(/\s*<link\b[^>]*href="[^"]*atlas-polish-v1\.css[^\"]*"[^>]*>/gi,'');
 return next.replace(/\s*<\/head>/i,'\n<link rel="stylesheet" href="/css/atlas-polish-v1.css?v=20261009">\n</head>');
}
