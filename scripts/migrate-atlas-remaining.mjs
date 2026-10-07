import {readFile,writeFile} from 'node:fs/promises';
import {atlasShell} from './atlas-shell.mjs';
const root=new URL('../',import.meta.url);
// Fixed, reviewed inventory. Never infer future migration targets from a marker count.
export const pages=[
 '404.html','admin.html','afirmace.html','andelska-posta.html','astro-mapa.html','aura.html','biorytmy.html','cenik.html','cinsky-horoskop.html','faq.html','horoscope-card-preview.html','horoskopy.html','jak-to-funguje.html','kontakt.html','mentor.html','mesicni-horoskop.html','minuly-zivot.html','natalni-karta.html','o-nas.html','ochrana-soukromi.html','offline.html','onboarding.html','osobni-mapa.html','osobni-rok-2026.html','partnerska-numerologie.html','podminky.html','prihlaseni.html','profil.html','rocni-horoskop.html','shamansko-kolo.html','soukromi.html','tydenni-horoskop.html','vyznam-data-narozeni.html',
 'pl/andelske-karty.html','pl/horoskopy.html','pl/index.html','pl/kristalova-koule.html','pl/natalni-karta.html','pl/tarot.html',
 'sk/andelske-karty.html','sk/horoskopy.html','sk/index.html','sk/kristalova-koule.html','sk/natalni-karta.html','sk/tarot-ano-nie.html','sk/tarot.html',
 'ritualy/index.html','ritualy/session.html',
 'testy/archetyp-duse.html','testy/barva-aury.html','testy/dar-intuice.html','testy/index.html','testy/karmicke-dedictvi.html','testy/stin-znameni.html','testy/totem-pruvodce.html','testy/zivlova-rovnovaha.html',
];
let changed=0;
for(const page of pages) {
 const file=new URL(page,root),before=await readFile(file,'utf8');
 let after=atlasShell(before,'atlas-remaining-page'+(/^(sk|pl)\//.test(page)?' atlas-language-page':''),'atlas-remaining.css');
 if(page==='sk/index.html' || page==='pl/index.html') {
  const sk=page.startsWith('sk/');
  after=after.replace(/<img src="\.\.\/img\/hero-3d\.webp"[^>]*>/,'<img src="/img/atlas/01-lucerna-na-rozcesti.webp" width="960" height="640" alt="'+(sk?'Lucerna osvetľujúca cestu nočnou krajinou':'Latarnia oświetlająca drogę przez nocny krajobraz')+'" class="hero__image atlas-language-hero">');
  after=after.replace('../img/icon-tarot.webp','/img/tarot-v2/tarot_card_back.webp');
 }
 if(after!==before) {await writeFile(file,after);changed++;}
}
console.log(`[atlas-remaining] ${pages.length} pages; changed ${changed}`);
