# Mobilní baseline — 1. 11. 2026

Nové reporty PageSpeed Insights přes veřejné UI, nikoli předchozí neúspěšný API429. Jeden běh na URL, 17:15–17:16 SEČ; Lighthouse 13.6.0, HeadlessChromium 153.0.8010.36, emulovaný Moto G Power, první načtení, Slow 4G. Jednorázové laboratorní měření je orientační a není tvrzením o všech návštěvách.

| URL | Výkon | FCP | LCP | TBT | CLS | Speed Index |
|---|---:|---:|---:|---:|---:|---:|
| [Homepage](https://pagespeed.web.dev/analysis/https-www-mystickahvezda-cz/ncbf9j9atx?form_factor=mobile) | 86 | 0,9 s | 4,1 s | 0 ms | 0,08 | 1,4 s |
| [Tarot ano/ne](https://pagespeed.web.dev/analysis/https-www-mystickahvezda-cz-tarot-ano-ne-html/stfu8mgswd?form_factor=mobile) | 100 | 1,1 s | 1,1 s | 0 ms | 0,004 | 1,1 s |
| [Vztahový formulář](https://pagespeed.web.dev/analysis/https-www-mystickahvezda-cz-vztahovy-vyklad-html/hom40g6y90?form_factor=mobile) | 100 | 0,9 s | 0,9 s | 0 ms | 0 | 0,9 s |

Automatické kategorie přístupnost / best practices / SEO vykázaly na všech třech URL 100. Nejde o úplný audit přístupnosti, kvalitu obsahu ani doklad pořadí ve vyhledávání. U formuláře jedna dílčí diagnostika latence dokumentu ukazuje Chyba; nenahrazovat to vymyšlenou hodnotou.

## Reálná data: URL proti doméně

PSI nyní ukazuje mobilní CrUX za posledních 28 dní. Homepage a formulář nemají dostupná vlastní URL data: tlačítko URL je disabled a odkaz na historii má identifier=origin. Doménový fallback má LCP 0,9 s / INP 158 ms / CLS 0,04 a CWV vyhovuje. Nelze jej vydávat za vlastní čísla formuláře nebo homepage.

**Tarot ano/ne má vlastní URL data** (historie identifier=url): LCP 0,7 s / INP 199 ms / CLS 0,14, CWV nevyhovuje kvůli CLS. To je nový doložený problém oproti starému GSC reportu bez CWV dat. Lab CLS 0,004 na prvním načtení se s tím nevylučuje: field zahrnuje různé klienty, starší vydání a celou návštěvu. Příčina ani dopad posledního vydání nejsou určeny. Další krok: cíleně sledovat dynamické výsledky, fonty a komponenty při používání ano/ne; nepředstírat opravu jen podle lab 100.

## Konkrétní lokální zlepšení homepage

PSI jmenuje úvodní lucernu jako LCP prvek; zdroj 288,9 KiB a potenciální image úspora 244,8 KiB (odhad auditu, ne garantovaná úspora). Projekt již obsahuje shodné menší varianty: 400w 39 550 B, 800w 147 524 B, 960w 199 274 B, originál 1200w 295 870 B. Do index.html přidán srcset/sizes a fallback 800w, bez nové grafiky nebo změny obsahu.

Lokální browser ověření přes HTTP: při viewportu390 px img.currentSrc vybral 400w, skutečný slot340×255px, bez vodorovného přetékání; při1440 px vybral800w, slot496×496px, bez přetékání. Oba náhledy vizuálně zkontrolovány, poměr/crop zachován styly. Výběr závisí také na DPR a prohlížeči, proto 86,6% menší soubor 400w není slib pro všechny návštěvy. Nový produkční Lighthouse po této úpravě dosud neběžel; změna je pouze lokální.

Report dále doporučuje kompresi dalších obrázků a omezení render-blocking CSS. Tyto širší zásahy nejsou součástí malé opravy a bez dalšího ověření se netvrdí zlepšení LCP ani obchodní přínos.
