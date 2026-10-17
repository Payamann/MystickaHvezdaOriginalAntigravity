# Závěrečná QA fáze · 15.–16. října 2026

Aktuální doplnění 17. 10.: [mobilní profil/přihlášení a uzavření PV01](profile-auth-mobile-qa.md). Nová evidence 320/390 px, nastavení tabletu 768 px; jediná app změna je odstranění vnořeného rolování a zvětšení feedback tlačítek na mobilu. Cache `mysticka-hvezda-24ca976bd767`, snapshot 1126, SW **5/5**. Neuzavírá zbytek W07, živé Stripe/AI ani platný reset.

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
- W12: zdrojový rozpočet a konkrétní assety mají novou evidenci níže. Klientský CLS/LCP/INP zatím nemá nové měření; prohlížeč neposkytl Performance API. Zdrojové bajty nejsou produkční Core Web Vitals.
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

## Navazující checkpoint · W12, chybové stavy a návrat k runě

- [Zdrojový asset rozpočet před/po](performance-source-audit.md) pro sedm vzorů je opakovatelný. Natál už nenačítá nepoužívané Three.js + natal-3d: odstraněno **605 809 B zdrojového JS** z přímých importů. Skutečný 2D natální výpočet po odebrání zobrazil všech deset planet, domy i aspekty. Žádná změna výpočetního enginu.
- Náhledy znamení používají zmenšeninu stávající ilustrace: **701 618 → 182 496 B (−74 %)**. Původní ilustrace zůstává. Čtyři desktopové kolony mají při 1280 px všech 12 karet bez vnitřního overflow; stísněné názvy jsou opravené. Po rozšíření kompaktního desktopového breakpointu má nav od profilu odstup přibližně 31 px. [Desktopový důkaz](qa-evidence/horoscope-grid-optimized-desktop.png).
- Atlasové stránky ruší staré kořenové cosmic pozadí, horoskopy preloadují svůj skutečný hero. [Pozorované browserové assety](qa-evidence/asset-observations-w12.json) neobsahují na natálu Three/natal-3d/cosmic a na horoskopech potvrzují nový sprite a hero. Evidence nezaznamenává přenosové bajty, výkon ani produkční návštěvu.
- Nové chybové scénáře shody, retry run a uložení náhradního výkladu do profilu jsou v [nástrojovém checkpointu](tool-results-qa.md). Návrat runy po přihlášení už obnovuje původní záměr, ne jen kámen; kontroluje datum i katalog a sám nic negeneruje.
- Frontendové cílené sady: **14/14** (11 nových testů obnovení runy včetně oddělení účtů + 3 existující testy skóre shody). Statické CSP, SW manifest a SW runtime prošly; asset-versioning nejprve narazil čtyřikrát na sandboxové `connect EACCES`, po povolení loopbacku samostatně **6/6**. Není to nový úplný test všech funkcí. První pokusy o frontendový běh potřebovaly cestu k existující kořenové instalaci Jest a explicitní frontendový testMatch; závislosti se neinstalovaly.
- JS build a cílený ESLint run/shody prošly. Cache nyní **`mysticka-hvezda-740a7a58a440`**, snapshot **1099** veřejných JS/CSS verzí; 907 canonical URL vygenerováno do sitemap bez změny URL sady. Atlas má **43 fyzických WebP souborů: 42 původních motivů a jednu technickou zmenšeninu**, nejde o novou ilustraci.
- Ohraničený pomocník `gpt-6-luna` medium připravil zdrojový rozpočet, našel chybějící návrat ke kontextu a napsal 9 cílených testů; hlavní agent provedl app změny a ověřil výsledky. Číselná úspora modelů se netvrdí.

**Otevřené hranice:** nové rozložení je zde doložené na desktopu. Požadovaný mobilní viewport se na testovací panel neaplikoval, proto nebyl jeho 1280px screenshot označen za mobilní a chybný název souboru byl odstraněn. Závěrečný mobil/tablet tohoto vzoru, měření runtime výkonu, otevřená starší stránka po vydání a vzorky živého AI poskytovatele stále čekají. Produkce zůstala beze změny; soukromé QA ovladače ani dočasné logy nejsou součástí vydání.

## Navazující checkpoint · zachování výsledků PV04

Následný stav 17. 10.: [PF02/PF10 — obnova profilu a přímý návrat](profile-refresh-return-qa.md) uzavírá aktuální stav historie/poznámek po změnách a návrat k původnímu výkladu. **29/29** cílených profilových testů, skutečná lokální cesta oblíbených a desktopová kontrola kompaktních zavřených panelů. Nová cache `mysticka-hvezda-c917eee9ca6a`, snapshot 1120, SW **5/5**. Produkce a otevřené mobilní/členské hranice se tím nemění.

[Přesný rozsah, opravy a evidence](reading-fidelity-qa.md): nové tarotové zápisy zachovávají i plné významy; retry používá stejný rozklad. Fallback je přenášený u tarotu, natálu a shody; numerologie má v detailu uložená čísla. Historický formát skóre a pojmenování karet má odpovídající renderer. **45/45 cílených testů**, skutečný browserový návrat tarotu/natálu/numerologie a první reflexe prázdného účtu. Živé AI vzorky, nové mobilní přijetí a produkční provoz tím nejsou pokryté. Výsledek na stránce i v uloženém detailu používá stejný text; nové generování pro porovnání se neprovádělo.

## Navazující checkpoint · členské UI PV02 · 17. října

[Členská matice a opravy](profile-membership-qa.md): dostupné faktury po ukončení členství, oba profilové štítky podle aktuálního stavu, české a bezpečné popisky, kompaktní trial a návrat tlačítka po chybě. **29/29** cílených frontendových kontrol a skutečný lokální klient nad osmi modelovými payloady; modelový portál 503/retry. JS build a lint prošly, cache `mysticka-hvezda-77aa257fccbf`, snapshot **1125**, SW **5/5**. Skutečný Stripe testovací portál/webhook, nové mobilní přijetí a produkce se tím netvrdí.
