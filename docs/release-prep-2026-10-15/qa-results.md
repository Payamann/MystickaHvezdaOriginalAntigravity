# Závěrečná QA fáze · 15.–16. října 2026

Lokální kandidát ve větvi `codex/organic-growth-20261013`, navazující na `4e15cc6b`. Produkce nebyla změněna. Toto je důkazní checkpoint; není to prohlášení, že celý společný TODO je dokončený.

## Automatické kontroly

- Server: úplný běh 86 sad / 806 testů měl 803 úspěchů a tři selhání. Dvě selhávající sady po opravách prošly **54/54**; následný cílený běh statických kontraktů, CSP a service workeru prošel **59/59**. Jedna skutečná CSP vada byla inline transformace ve shodě; ostatní očekávání odkazovala na dřívější texty/CTA. Přístupové, platební a doručovací regrese prošly už v úplném běhu. Podrobná evidence mapy je v [R02](r02-qa-evidence.md).
- Frontend: 11 sad / **65 testů** prošlo; po opravě SVG v detailu znovu 12/12 profilových regresí, po úpravě importů 5/5 lunárních a denních regresí, dále 13/13 kontextových/denních kontrol. Nová cílená sada exportu přidala **3/3**, mentor po odstranění neexistujícího greeting requestu 2/2. Jde o výsledky několika cílených běhů, nikoliv jeden nový součet opakovaných testů.
- Rituální deník: nová cílená sada **4/4** pokrývá potvrzený zápis, neúspěch a retry, dvojklik za běhu a nesoulad vlastníka. Kontroluje také 100% dokončení. První běh měl 3/4 kvůli příliš časnému assertionu testu; místo pevného počtu microtasků nyní čeká na skutečné zahájení mock zápisu.
- Build JS a tří základních CSS balíků prošel. ESLint, encoding, hooks, auth contexts, AI cost control, paywall trust, static hubs, SEO semantics, CSS transitions, sitemap, site audit, tarot assets a SW assets byly v této QA fázi zkontrolovány. Finální asset hash a poslední příkazy jsou v checkpointu níže.
- První serverový pokus narazil na sandboxový zákaz loopback socketů. Druhý běh měl povolený loopback a používá testovací mocky. Tato chyba prostředí se nevydává za vadu aplikace.

## Prohlížeč: skutečný rozsah

**166/166 funkčních vstupů** z existujícího inventáře bylo načteno na desktopu 1280 px a mobilu 390 px. Měřila se šířka dokumentu, přítomné obrázky a vybrané názvy starých pozadí v computed style. [Desktop](qa-evidence/browser-desktop.json), [mobil](qa-evidence/browser-mobile.json). V mobilním průchodu nebyl zjištěn overflow ani rozbitý viditelný obrázek. V desktopovém reportu je prázdné `src` před odkrytím tarotu a žádný H1 u aplikační rituální session; tyto dva signály nejsou samy chybou viditelného výsledku. Kontrola názvů pozadí není pixelový důkaz absence každého odstínu fialové.

Tento průchod je kontrolou načtení a rozložení všech vstupů. **Není úplným provedením všech kombinací každé funkce.** Interakce byly navíc provedeny v těchto změněných cestách:

- Skutečný klient profilu nad syntetickou databází: 63 záznamů, serverové stránkování, filtr starších poznámek, detail, přepnutí oblíbené, Escape/fokus; samostatný prázdný účet, první reflexe a následná reflexe po 401. Rozepsaný text se obnovil ve stejné kartě po návratu ke stejnému účtu a šel uložit.
- Avatar: úspěšné uložení a reload; při simulovaném PUT 500 zůstal původní symbol, následný pokus prošel. Identita ani skutečný zákaznický profil se neměnily.
- Český a slovenský natál: skutečné výpočetní API, záměrné HTTP 500, zachovaný formulář, retry a následný výsledek. Slovenský a polský renderer zobrazily všech deset planet; bez času se nepředstírá ascendent a uvádí se použitá časová zóna.
- Denní tarot: odkrytí, společná karta/otázka/krok na homepage a nástroji, skutečné stažení PNG. Ověřený soubor má 1080 × 1350 px, správnou diakritiku a viditelnou adresu uvnitř rámečku. [Výstup](qa-evidence/daily-card-export.png).
- Přihlášení: obnovovací formulář a trvalé potvrzení nad lokálně zachyceným požadavkem. Nebyl odeslán žádný recovery e-mail ani nastaveno nové heslo. [Mobilní stav](qa-evidence/recovery-mobile.png).
- Navigace homepage: mobilní otevření, šipka na první odkaz, Escape; desktopový dropdown a návrat fokusu. Profil byl navíc kontrolován při 320 px. Opravená společná hlavička při 320 px už nevyhrazuje prázdnému nav kontejneru druhé místo pro hamburger.
- [Výsledkové cesty dalších nástrojů](tool-results-qa.md): numerologie, aura, biorytmy, čínský horoskop, Průvodce, koule, runa, symbolické fallbacky, shoda, tarot ano/ne, tři karty a astro mapa. Všech **7 kvízů** bylo dokončeno přes 7 otázek. Nejde o všechny kombinace vstupů a oprávnění.
- Rituál prošel od volby znamení a počáteční nálady přes všech šest kroků až po reflexi. Skutečný serverový zápis byl otevřen v detailu deníku profilu. Vynucená POST 401 zachovala text; obnovení stejného účtu a retry bez reloadu uspěly. [Potvrzení](qa-evidence/ritual-journal-confirmed.png).

## Opravy nalezené během QA

- JSON import attributes nebyly kompatibilní se stávajícím ESLint parserem. JSON zůstává jediným redakčním zdrojem, build z něj připravuje běžné ESM soubory v `data/generated`.
- Odstraněný starý auth-copy wrapper už nepřepisuje nové režimy a lokalizované popisky. Doplněné překlady zápatí.
- Profilové oblíbené používají společné SVG a `aria-pressed`; členství nemá vnořený dvojitý štítek a e-mail starý zlatý gradient.
- Profil bez vlastního data narození nepřebírá znamení z globální preference prohlížeče, která mohla pocházet od jiného účtu.
- Lokalizovaný natál měl absolutně umístěný starý placeholder překrývající tlačítko; opraveno rozložení formuláře a skrytí placeholderu po výsledku.
- PNG export místo nepřipojeného data URL používá připojený blob odkaz, po chvíli uvolňuje URL; „Uložit obrázek“ přímo stahuje a neotevírá sdílení. Export byl sladěn s navy/krémovou/zlatou paletou, bez původního hvězdného dekoru.
- Obnova přístupu ponechá trvalé potvrzení a neslibuje doručení na neexistující účet. Telemetrie nemůže potvrzení zablokovat.
- Průvodce už nevolá neexistující `/mentor/greeting`. Natální texty nepředstírají tip konkrétního astrologa; odstraněné zbylé dekorativní emoji z těchto cest a čínského UI.
- Rituální poznámky už nejsou zapisované do společného `mh_ritual_journal` v localStorage. Nové zápisy jdou do existujícího serverového deníku konkrétního přihlášeného účtu; historické společné lokální poznámky se automaticky nikomu nepřiřazují. Falešné potvrzení bez úspěšného zápisu, opakovaný dvojklik a 89% stav na hotové session jsou opravené.
- Shoda nemá stálou smyšlenou poznámku o Saturnu ani rozmazaný karmický filler. Host má skutečný základní výpočet a jednu nabídku; člen vidí své podrobnosti bez opakovaného nákupu. Členské pokračování tarotu zachovává otázku a vede přímo na tři karty.
- Jedenáct lokalizovaných stránek vůbec nenačítalo Auth klienta. Doplněný před společnými komponentami; zbývající dvě už mají `core.js`. Nová statická regrese kontroluje všech 13 vstupů a pořadí loaderů. Slovenský i polský horoskop po opravě rozpoznal prémiový modelový účet a otevřel denní, týdenní i měsíční výsledek. Čeština v samotném generovaném textu zde pochází z pevné testovací šablony `MOCK_AI`, nikoliv z testu živého překladu.
- Doplňující rozcestníky jsou rozbalovací; mobilní výběr znamení má dvě čitelné kolony při 320 px. U barevného kvízu se šestá otázka již zobrazuje jen ve svém kroku; opravou byl znovu proveden průchod 1 → 6 → výsledek.

## Databáze a provoz

16. 10. byly **pouze přečteny metadata schématu** produkčního Supabase projektu: potřebné JSONB/receipt sloupce existují, RLS odmítá přímý přístup, existují unikátní provider ID a trigger jeho neměnnosti. Žádné zákaznické řádky ani produkční zápisy. Podrobnosti a hranice jsou v [R02 evidence](r02-qa-evidence.md).

Skutečný produkční CAS zápis, obnovení po restartu, reálné doručení do schránky, platný recovery token a historické nejasné objednávky se tímto neprohlašují za otestované.

## Co zůstává v TODO

- Dopsat přijetí ostatních výsledkových stavů napříč rodinami. Inventář a načtení všech URL nejsou náhradou za celý výsledek každého nástroje.
- W12: klientský výkon/CLS/LCP zatím nemá nový důkaz. Prohlížečová automatizace neposkytla Performance API; není důvod vymýšlet skóre nebo označit lokální rychlost za produkční Core Web Vitals.
- Ověřit nové vzorky skutečných AI výkladů odděleně od `MOCK_AI`; testovací text není důkaz kvality živého poskytovatele.
- PF08 a PF12 jsou volitelná následná rozšíření, nikoliv již existující editace poznámek či knihovna placených objednávek.
- Nasazení, konkrétní vzdálené CI a následné produkční ověření čekají na samostatné vydání. V této fázi nebyl proveden push ani deploy.

Lokální mock server používá neplatné testovací klíče a syntetické účty `example.invalid`; soukromé QA ovladače nejsou součástí commitu ani veřejné aplikace.

## Technický checkpoint · 16. října

- Poslední build JS úspěšný; původní tři CSS balíky mají úspěšný build, další změny jsou v přímo načítaných CSS.
- ESLint celého source prošel; po posledních změnách navíc cílený lint shody, tarotu, astro mapy a session. Encoding, hooks, paywall trust a sitemap prošly v této fázi. Úspěšné vzdálené CI se tím netvrdí.
- Cache `mysticka-hvezda-82f854a7799c`; hash platí pro existující seznam SW assetů, není otiskem celého webu. Snapshot zachovává **1091** verzí veřejných assetů; validace SW vrací prázdný seznam chyb.
- Zdrojový ledger: **917** stran, **166** funkčních vstupů s připojeným důkazem úvodního desktopového a mobilního načtení; **42** atlasových ilustrací s literálními odkazy. Ne všechny klasifikace a výtvarné role jsou finálně přijaté.
- Levné pomocné agenty využila zdrojová kontrola a ohraničené úpravy; poslední Luna vytvořila rituální regresní test, ale skončila na usage limitu před předáním. Hlavní agent test převzal, opravil jeho synchronizaci a ověřil 4/4. Spotřeba ani úspora se číselně neodhadují.
- Navazující locale oprava: cíleně 1/1 nový test loaderů (27 ostatních v této sadě úmyslně přeskočeno), kontrola 45 auth kontextů a lint horoskopu prošly. Předchozí checkpoint oprav je `f5d4512b`; tato navazující oprava nepředstavuje nový úplný běh 806 testů.
