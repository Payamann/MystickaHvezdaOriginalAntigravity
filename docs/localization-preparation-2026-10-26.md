# Příprava SK / PL / EN — 26. 10. 2026

## Rozsah a stav

Pavel požádal o přípravu slovenských a polských stránek pro SEO a následně přidal angličtinu. Čeština zůstává hlavní trh; další jazyky rozvíjíme postupně. Změny vycházejí z produkčního commitu `d688396016bd78738fc5d723ba30cc21fe8538ad`, v izolované větvi `codex/sk-pl-seo-preparation`. Produkce se v tomto kroku nemění.

Připraveno **19 lokalizovaných stránek: 7 SK, 6 PL a 6 EN**. Nejde o překlad celého webu, členství nebo plateb.

| Obsah | SK | PL | EN |
|---|---|---|---|
| Úvod | `/sk/` | `/pl/` | `/en/` |
| Horoskopy | `/sk/horoskopy.html` | `/pl/horoskopy.html` | `/en/horoscopes.html` |
| Natální karta | `/sk/natalni-karta.html` | `/pl/natalni-karta.html` | `/en/birth-chart.html` |
| Křišťálová koule | `/sk/kristalova-koule.html` | `/pl/kristalova-koule.html` | `/en/crystal-ball.html` |
| Tarotový průvodce | `/sk/tarot.html` | `/pl/tarot.html` | `/en/tarot.html` |
| Průvodce andělskými kartami | `/sk/andelske-karty.html` | `/pl/andelske-karty.html` | `/en/angel-cards.html` |
| Tarot ANO/NE | `/sk/tarot-ano-nie.html` | není | není |

## Co se změnilo

- Existující SK/PL stránky mají přesnější titulky, popisy, OG/Twitter metadata, související odkazy a viditelné FAQ shodné s JSON-LD. Natál slibuje skutečně dostupný základní přehled poloh, nikoli plný osobní rozbor. Tarotové a andělské vstupy jasně označují české samotné výklady.
- Šest EN stránek má vlastní anglické URL, obsah, metadata, FAQ, canonical a hreflang. Používají existující veřejné obrázky a CSS; nevznikl nový produkt.
- Navigace obsahuje nativní jazykový výběr, ovladatelný klávesnicí a dostupný i v mobilním menu. Přepínač i patička čtou ekvivalenty ze skutečných hreflang v hlavičce. Zachovají odpovídající stránku; chybějící překlad vede na jasně označený jazykový úvod. Nevytvářejí neexistující URL, nepřenášejí otázky či rodné údaje přes query a nevynucují jazyk podle IP.
- Šest společných sad má reciproční `cs/sk/pl/en` a české `x-default`. ANO/NE zůstává poctivě jen cs/sk. Českým protějškům byly přidány anglické alternativy.
- Dynamické stavy horoskopu jsou přeložené pro SK/PL/EN: období, načítání, limity, chyby, zpětná vazba a nabídka pokračování. Anglický klient posílá `lang=en`; natál má anglické planety/znamení i stavy, koule anglické ovládání/chyby.
- Server podporuje angličtinu v horoskopech i kouli: jazyk promptu, bezpečné symbolické vymezení, náhradní texty při nedostupnosti, validace a limitní hlášky. Dvanáct anglických znamení se normalizuje na existující kanonické klíče; cache odděluje jazyky. Plány, ceny, kvóty, souhlas s osobním kontextem a přístupová pravidla se nemění.
- Vizuální kontrola odhalila přetékající vodorovný natální formulář; pole jsou nyní pod sebou a výsledek má vlastní relativně umístěný prostor. Společná oprava platí pro SK/PL/EN. Anglické názvy kategorií v menu byly zkráceny, aby se nepřekrývaly s přihlášením.
- Sitemap obsahuje **913 URL (původních 907 + 6 EN)**. Lastmod se aktualizoval pouze podle skutečně změněných HTML. JS/CSS build, service-worker cache a archiv veřejných assetů jsou aktualizované.

## Ověření

- Zdrojová kontrola všech 19 lokalizovaných stránek: vlastní canonical, jeden H1, existující jazykové cíle, návratové hreflang a validní JSON-LD. Samostatně byly zkontrolovány odkazy/assety, metadata a viditelné FAQ.
- `scripts/audit-site-structure.mjs`: prošel kontrolou sitemap, canonical/hreflang, místních odkazů a srcset, metadat obrázků, JSON-LD, analytického souhlasu, fontů a verzí assetů.
- `scripts/generate-sitemap-from-canonicals.mjs --check`: 913 indexovatelných canonical URL, bez rozdílu proti sitemapě.
- Frontend Jest: **9 testů / 2 sady** pro češtinu, SK/PL/EN horoskopový text a chyby, jazykové API hodnoty a skutečně vykreslené anglické polohy natálu.
- Server Jest: **56 testů / 5 sad** pro anglické routy, všechna znamení a období, kontext/souhlas, oddělení cache, odpovědi a již existující oracle fallbacky. Použity mocky AI a Supabase. Testy lokálního HTTP potřebovaly povolenou loopback síť po sandboxovém EACCES.
- Playwright: **25 testů** lokální aplikace, včetně mobilní navigace na všech 19 stránkách, zpátečního přepnutí CZ→SK→PL→EN→CZ, nepřeloženého nástroje, SK-only tarotu a obou opravených horoskopových CTA. Po následné vizuální opravě natálu a menu prošel opakovaně zasažený test desktopového/mobilního rozložení, včetně nepřekrývání anglického menu s přihlášením.
- Cílený ESLint změněného klientského a serverového JS a `git diff --check`: bez chyb.
- Nebyla provedena skutečná registrace, platba, živá AI generace, odeslání e-mailu ani zásah do produkční databáze. Mockovaný úspěšný anglický modelový výstup není důkazem kvality každého budoucího živého výkladu.

## Zbývající hranice před expanzí

Účet, ceník, checkout, profil, podpora a následné transakční zprávy nejsou kompletně lokalizované; odkazy do těchto částí jsou označené jako české a lokalizované nabídky na tuto hranici upozorňují. Cena zůstává CZK. Tarotové rozklady a losování andělských karet na těchto přeložených průvodcích otevírají českou službu; PL/EN ANO/NE nebylo vymyšleno ani deklarováno jako hotové.

Po nasazení je potřeba ověřit konkrétní produkční commit a assety, teprve potom zaslat aktualizovanou sitemapu do GSC. Tento checkpoint netvrdí indexaci, růst organické návštěvnosti ani rodilou redakční kontrolu všech překladů. Aktuální úkol přípravy lokalizací také neopravuje samostatné P1 nálezy osobní mapy a chybové větve synastrie z [hloubkového auditu](deep-audit-2026-10-26.md).

## Předání práce

Podklady a screenshoty jsou v hlavním workspace `docs/sk-pl-preparation-2026-10-26/`. Přesný aplikační diff je v uvedené větvi a čistém worktree `.tmp/seo-growth-20261025`; původní rozpracovaný hlavní workspace zůstal zachovaný.

Delegace: Luna připravila klientské slovníky a izolované testy, Sol HTML a samostatný Sol anglické serverové cesty s regresí. Hlavní agent zkontroloval zdroje, SEO vazby, integraci a skutečné screenshoty; nalezené vizuální chyby opravil. Úspora spotřeby se bez měření netvrdí.
