# Mystická Hvězda — společný TODO pro dokončení webu

15. 10. 2026 · výchozí lokální kandidát `6df8ecdf` · **plán a soupis práce, nikoliv nové nasazení nebo nový úplný audit**.

Tento dokument určuje pořadí práce napříč webem. Podrobné důkazy a dílčí úkoly zůstávají v [průzkumu všech funkčních vstupů](page-simplification-2026-10-14/README.md), [funkčním review](product-function-review-2026-10-14/README.md) a [profilovém TODO PF/PV](page-simplification-2026-10-14/profile-followup-todo.md). [Dosavadní implementace](profile-unification-2026-10-14/README.md) rozlišuje dokončené body od zbývajících.

## Vizuální směr

Malovaná večerní krajina a vlastní tarotové ilustrace, hluboká navy, krémový text a tlumené zlato. Mystika vychází z konkrétního symbolu a příběhu obrázku. Čitelné titulky, vzdušný rytmus a klidné ovládání mají držet celý web pohromadě.

- Hlavní obsah má jasnou hierarchii: krátký úvod → použitelný nástroj → celý výsledek → dobrovolné pokračování → reference.
- Cinzel ponechat pro kratší nadpisy, Inter pro formuláře a čtení. Delší výklad potřebuje pohodlnou šířku a odstavce, ne další obalové karty kolem každé věty.
- Ilustrace má přidat orientaci, téma nebo náladu. Volit roli podle stránky; někde velká scéna, jinde detail objektu nebo malý symbol. Nezakrývat jimi nejasný obsah.
- Používat existující CSS proměnné, SVG sadu a současné HTML/JS komponenty. Případné technické sjednocení dělat po rodinách stránek.
- Ostatní nástroje zůstávají dostupné. Zaměření navigace a úvodních obrazovek je pracovní návrh; URL, obsah, ceny a oprávnění se tím automaticky neruší ani nemění.

## 0. Nejprve spolehlivost a pravdivé výsledky

Tyto body už jsou doložené v navazovaných auditech. Nejde o nově vymyšlené funkce ani znovu otevřené hotové vizuální opravy.

| ID | Stav / priorita | Úkol a vazba | Přijetí |
|---|---|---|---|
| R01 | Cílené regrese + natální retry v browseru; přijetí pokračuje · P1 | Výpadkové větve natální karty a partnerské shody; viz funkční review | Selhání výpočtu nevytváří zdánlivou osobní mapu nebo procento odvozené ze jmen. Vstup zůstane zachovaný a uživatel dostane pravdivý stav a možnost opakovat. |
| R02 | Regrese a DB metadata ověřené; živé doručení/CAS čeká · P1 | Trvale uložený výsledek a opakování doručení osobní mapy; viz funkční review | Retry používá stejný výsledek objednávky; potvrzení odeslání i neúspěch zápisu stavu se řeší výslovně. Ověřit cíleně v testovacím prostředí. |
| R03 | PF01–PF07/PF09–PF11 a základní matice PV01 místně přijaté; závěrečný mobil PV01 a PV02/PV03/PV04 čekají · P1/P2 | Profil: bezpečné detaily, aktuální stav, poznámky a věrné uložené výsledky | [Profilový TODO PF/PV](page-simplification-2026-10-14/profile-followup-todo.md), [mobilní přijetí](release-prep-2026-10-15/profile-auth-mobile-qa.md) |
| R04 | Metody/unit + modelové výsledky ověřené; živá AI čeká · P1/P2 | Sjednotit numerologickou metodu, lunární referenční okamžiky a pravdivé prompty; označování fallbacků | Stejný vstup má vysvětlenou a konzistentní metodu. Generický náhradní obsah se nevydává za čerstvou osobní interpretaci. |

**Výchozí R01 je zdrojově opravený:** falešná mapa, klientské skóre a náhradní tranzitové tvrzení jsou odstraněné. Český i slovenský natál prošel skutečným lokálním výpočtem a chybou/retry, shoda členskou a hostovskou variantou. Podrobný rozsah a neověřené stavy jsou v [QA checkpointu](release-prep-2026-10-15/qa-results.md).

## 1. Společný vzhled a orientace

### W01 · P2 · Jasná hlavní cesta a kratší navigace

- [ ] Navrhnout stručný rozcestník podle potřeby: položit otázku, vytáhnout kartu dne, najít horoskop nebo se vrátit k vlastnímu výkladu. Knihovnu ostatních nástrojů zpřístupnit přehledně.
- **Dílčí W01 · homepage:** přihlášená varianta hero nabízí přímý odkaz „Moje výklady“ na `profil.html#tab-history`; hostům je skrytý a používá existující analytiku. Tři hlavní rychlé volby jsou nyní v pojmenovaném navigačním landmarku a širší nástroje zůstávají pod „Prozkoumat dál“ a ve sdílené navigaci. Cíle, hash handler, CSS i zdrojové rozvržení byly ověřeny; browserové přijetí landmarků a finální posouzení přehlednosti čekají na závěrečný QA běh. [Historie](release-prep-2026-10-15/homepage-reading-history-shortcut-2026-10-20.md), [rychlé volby](release-prep-2026-10-15/homepage-quick-start-landmark-2026-10-20.md), [hlavní cesty](release-prep-2026-10-15/homepage-primary-path-review-2026-10-19.md). První bod W01 jako celek zůstává otevřený.
- **Dílčí W01 · rychlá volba Tarot karta dne · 21. 10.:** třetí hlavní karta nyní vede na denní tarot místo Snáře. Volby pokrývají konkrétní otázku, horoskop a denní kartu; Snář zůstává v hlavní navigaci a patičce. Používá existující atlasový kompas v přirozených velikostech 360×360/600×600/640×640 a existující souhlasové CTA měření. Očekávání E2E scénářů byla přepsána, testy ani browser QA neběží. [Checkpoint](release-prep-2026-10-15/homepage-daily-tarot-quick-path-2026-10-21.md). W01 i finální responsive přijetí zůstávají otevřené; produkce beze změny.
- **Dílčí W01/W10 · sekundární CTA týdenního horoskopu · 21. 10.:** obecné „Odemknout souvislosti“ nyní říká „Prohlédnout členství“ a přesně popisuje cíl na stránce ceníku. Cíl, plán `pruvodce` a souhlasové měření zůstaly beze změny; zdrojově ověřeno, že ceník nabízí jedno členství za 199 Kč měsíčně. Chování odkazu čeká na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/weekly-horoscope-membership-cta-2026-10-21.md). W01 zůstává otevřené; produkce beze změny.
- [ ] Sjednotit hlavní a vedlejší akce na každé rodině stránek; popisek má říkat, co se skutečně otevře. Cenu a podmínky nabídky ponechat dostupné před rozhodnutím.
- [ ] Porovnat navigaci homepage s načítaným headerem, včetně hosta, přihlášeného účtu, mobilního menu a klávesnice. Aktuální statické porovnání celých hlaviček má 44 odkazů v každé; text i cílová cesta souhlasí a jediný URL rozdíl u Osobní mapy je měřicí `source` parametr. Samostatná kontrola existence našla všech 47 jedinečných lokálních cest z `index.html` a 39 z `components/header.html` v aktuálním kandidátovi. Inicializace modulu i samostatného header skriptu má společné ochrany proti dvojímu navázání. CTA, profilové SVG a odlišení „Mystické testy“ jsou sjednocené. Desktopové ArrowDown/Space/Escape a mobilní Escape/fokus/ARIA prošly lokálně; pro přihlášený stav desktopu i mobilu je připravený regresní scénář, ale zatím neběžel. Z 29 živých detailů Slovníku a všech tří zdrojových šablon byl odstraněn starý navigační blok; místo něj používají sdílený načítaný header. Statický scan už nenašel staré menu s popiskem „Menu“. Skutečné HTTP cíle, browserové přijetí, resize a závěrečné spuštění scénářů zůstávají otevřené. [Existence cílů a porovnání hlaviček](release-prep-2026-10-15/homepage-primary-path-review-2026-10-19.md).

**Podklad:** `index.html:178` má vlastní header, `components/header.html` další variantu. Menu obsahuje několik tematických skupin; jejich existence sama není chyba. `js/components.js` a `js/ui/header.js` mají odlišné větve ovládání dropdownů. Není doloženo, že by všechny desktopové dropdowny byly pouze hoverové — komponentová větev má click handler i pro desktop. Ověřit skutečnou aktivní větev, nikoliv závěr z jednoho souboru.

**Přijetí:** návštěvník najde nástroj i cestu zpět; Enter/Space/Escape a `aria-expanded` odpovídají stavu. Stejný nástroj se v různých místech nejmenuje jinak. Hlavní URL a interní odkazy zůstávají procházetelné.

**Dílčí W01 · stavový proužek homepage pro hosty · 21. 10.:** „Bez registrace“ už nezůstává pod přihlášenou variantou hero. Samostatný skript homepage vyhodnotí stav přes existující `Auth.isLoggedIn()` při načtení a po události `auth:changed`; cache revize skriptu, Service Worker a asset snapshot byly aktualizovány. Statické kontroly prošly, přijetí obou stavů v browseru čeká na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/homepage-guest-trust-strip-auth-2026-10-21.md). W01 zůstává otevřené.

**Dílčí W01 · analytika odkazu Osobní mapa ve sdíleném headeru · 21. 10.:** načítaná šablona nyní zaznamenává kliknutí zvláštní akcí `site_nav_personal_map` a posílá zdroj `site_nav` spolu s již používaným kontextem funkce, produktu a jednorázového záměru. Stejný zdroj a funkce jsou také v query parametrech, aby se atribuce přenesla na stránku a její další funnel kroky. Nepoužívá se homepage název události, který by nesprávně označil kliky z jiných stránek. Cílová stránka i popisek odkazu se nezměnily. Zdrojová kontrola analytického handleru potvrzuje, že existující delegovaný listener tyto atributy zpracuje. Browserová kontrola události zůstává na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/homepage-personal-map-nav-analytics-2026-10-21.md). W01 zůstává otevřené.

### W02 · P2 · Sjednotit existující styly a základní prvky

- [x] Zapsat specifikaci atlasové rodiny barev, typografie, mezer, povrchů, akcí, formulářů, odkazů a ikon; vymezit její rozsah a zachovat semantické barvy výsledků. [Specifikace a otevřené hranice](release-prep-2026-10-15/visual-language-spec-2026-10-17.md).
- [x] Zmapovat, který base bundle patří ke které rodině, jeho zdrojový build a obsahové výjimky; ověřit, že stránky nepřekrývají raw i minifikovaný základ. [Mapa a meze](release-prep-2026-10-15/css-bundle-ownership-2026-10-17.md).
- [ ] Po ověření konkrétních selektorů a pořadí načtení postupně odstranit skutečně duplicitní definice; samotné podobné barvy nejsou důkaz nepoužití. Jedenáct ověřených redundancí ve sdílených Atlas stylech bylo odstraněno; širší kontrola zůstává otevřená. [Cookie plocha](release-prep-2026-10-15/css-cookie-banner-dedup-2026-10-18.md), [footer margin](release-prep-2026-10-15/css-footer-list-margin-dedup-2026-10-18.md), [mobilní footer](release-prep-2026-10-15/css-atlas-footer-duplicates-2026-10-18.md), [později přepsané hodnoty](release-prep-2026-10-15/css-atlas-late-overrides-2026-10-18.md), [Atlas remaining karta](release-prep-2026-10-15/css-atlas-remaining-card-background-2026-10-18.md), [root background](release-prep-2026-10-15/css-atlas-root-background-dedup-2026-10-20.md), [mobilní tarot hero](release-prep-2026-10-15/css-atlas-mobile-hero-padding-dedup-2026-10-20.md), [mobilní významy tarotu](release-prep-2026-10-15/css-atlas-mobile-meaning-hero-padding-dedup-2026-10-20.md).
- [ ] Sdílený `css/style.v2.css` ještě obsahuje původní fialovou paletu a kosmické `html::before` pozadí. Statický scan 18. 10. našel 923 HTML dokumentů, z toho 918 se `body.atlas-page` a `atlas-web.css`; tato vrstva vypíná globální pseudo-element a nastavuje navy. Homepage je samostatná rodina `body.atlas-home` a `home.min.css`. Tarot karta dne stále načítá starší `style.v2.min.css`, ale vizuálně je už sjednocená s Atlasem: stránkový CSS vypíná starý kosmický root a hvězdy, zatímco `tarot-atlas.css` nastavuje navy/zlato. Zaoblení karet a referenčních panelů je nyní lokálně srovnané; úplné odstranění starého bundle zůstává otevřené, protože dodává současné komponentové styly. Stránka záměrně nepoužívá `atlas-page`; `tarot-atlas.css` obsluhuje i homepage náhled a změny musí zůstat omezené na `body.page-tarot-daily`. Druhý neatlasový konzument `/tests/premium-test.html` je interní. Blogová a slovníková šablona i 104 statických detailů načítají odpovídající Atlas rodinu. Staré deklarace v base CSS zůstávají kvůli skutečně používaným cestám; před jejich odstraněním je nutná cílená kontrola.
- **W02 follow-up · CSS asset tokens · 19. 10.:** statická kontrola chybně označovala dva novější cache tokeny za zastaralé a její zápisový režim by je snížil. Skript nyní respektuje novější datované tokeny; read-only kontrola potvrzuje nulu zastaralých odkazů. [Evidence](release-prep-2026-10-15/css-asset-version-monotonicity-2026-10-19.md).
- **W02 follow-up · cache verze astrologických stylů · 20. 10.:** odkazy na změněný `atlas-astro.css` byly rozdělené mezi zastaralé `v=1` a `v=2`. Aktivní HTML i šablona nyní používají `20261020-01-western-zodiac-image-cards`; stejnou výchozí verzi má společný atlas shell. Kontrolní skript atlas-astro odkazy zahrnuje a zachovává novější číselnou sekvenci. 161 odkazů sjednoceno, opakovaný read-only scan hlásí nulu zastaralých CSS referencí. [Checkpoint](release-prep-2026-10-15/css-atlas-astro-cache-token-2026-10-20.md).
- **W02 follow-up · cache verze Atlas dekorací a zbytkových stylů · 20. 10.:** mobilní `image-set` v `atlas-art.css` a nové komponentové styly v `atlas-remaining.css` měly pod sebou starší tokeny. Všech 12 art a 56 remaining odkazů nyní používá datované verze; generátory i verzovací skript je zachovají. Nula zastaralých CSS referencí; Service Worker a asset snapshot obnoveny. [Checkpoint](release-prep-2026-10-15/css-atlas-remaining-art-cache-token-2026-10-20.md).
- **W02 follow-up · výjimka staré základní CSS rodiny · 20. 10.:** aktuální přímý scan našel 907 HTML odkazů na `style.v2.css`/`.min.css`. Dvě stránky nemají obecný Atlas/Home stylesheet: Tarot karta dne má vlastní lokální override `tarot-karta-dne.css` a `tarot-atlas.css`; druhá je interní `tests/premium-test.html`. Tím se nepotvrdil další veřejný konzument s neřízeným fialovým základem. Samotný bundle zůstává, protože ještě obsluhuje používané komponenty. [Evidence a meze](release-prep-2026-10-15/css-legacy-base-coverage-2026-10-20.md).
- **W02 follow-up · cache verze Tarot karty dne · 20. 10.:** jeho dvě veřejné `tarot-atlas.css` reference byly `v=1` a `20261018-individual-faq`, přestože CSS dostalo další styly FAQ, header placeholderu a okrajů obrázků. Obě nyní používají `20261020-01-tarot-daily-surfaces`; obecný refresh skript rodinu hlídá. Read-only scan našel 0 zastaralých CSS odkazů. [Checkpoint](release-prep-2026-10-15/css-tarot-daily-cache-token-2026-10-20.md).
- **W02 follow-up · `atlas-remaining.css` · 20. 10.:** cílený read-only scan nenašel aktivní starou fialovou dekoraci ani bezpečný další duplicitní styl k odstranění. Soubor používá navy/zlato/neutrální plochy a nevkládá další stylesheet; `.ball-glow` nebyl doložen jako prvek stránky s touto třídou těla, proto se jeho podobný styl v `atlas-tools.css` nepovažoval za aktivní nález. Stavové barvy zůstávají sémantické. Bez změny kódu; podrobnosti v [QA výsledku](release-prep-2026-10-15/qa-results.md#2026-10-20-w02-atlas-remaining-css).
- **W02 follow-up · `atlas-tools.css` · 20. 10.:** všechny čtyři přímé konzumenty (Runy, Křišťálová koule, Numerologie, Lunace) načítají pravidla po stránkovém CSS a `atlas-web.css`; žádný starý fialový motiv ani bezpečná redundantní deklarace se nepotvrdily. Dekorativní přechody a záře odpovídají prvkům na svých stránkách. Beze změny kódu; podrobnosti v [QA výsledku](release-prep-2026-10-15/qa-results.md#2026-10-20-w02-atlas-tools-css).
- **W02 follow-up · `atlas-art.css` · 20. 10.:** všech 12 přímých HTML konzumentů má odpovídající třídy; sedm desktopových a sedm mobilních obrázků odkazovaných stylesheetem existuje. Pravidla používají navy/zlatou/neutrální a mapují se na aktivní hero/art prvky; další bezpečná duplicita se nepotvrdila. Bez změny kódu; vykreslení zůstává pro závěrečnou browser QA. [QA výsledek](release-prep-2026-10-15/qa-results.md#2026-10-20-w02-atlas-art-css).
- [x] Pro kontrolu použít malý místní přehled existujících komponent se všemi stavy: klid, hover, focus, disabled, loading, chyba, úspěch. [Lokální přehled](release-prep-2026-10-15/component-states-preview.html); při jeho přípravě byla doplněna i sdílená podoba `button:disabled` pro Atlas.

- [x] Odstranit osiřelý desktopový a mobilní blok `.home-daily-feature` ze zdrojového CSS homepage; aktuální HTML/JS jej nepoužívá. Přestavět `home.min.css` a aktualizovat jeho cache token, Service Worker a asset snapshot. Statická shoda zdroje s bundlem ověřena 18. 10.
- [x] Odstranit další osiřelé styly předchozí andělské denní karty z homepage CSS. Aktuální HTML má tarotový widget a žádný z 17 starých `mh-inline-*`/`kdd-*` háčků; byl odstraněn i jejich odkaz na staré kosmické fialové pozadí. `home.min.css` přestavěn, oba odkazy na něj mají společný nový token. Cache `mysticka-hvezda-a9e1fe4ff475`, snapshot **1 824** verzí. [Rozsah a důkaz](release-prep-2026-10-15/home-legacy-daily-card-cleanup-2026-10-18.md). Browserové přijetí zůstává v závěrečném běhu.

**Podklad:** souběžné `style.v2.css`, `atlas-web.css`, `atlas-remaining.css`, lokální styly a generované bundly. Zdrojové velikosti 193 524 B / 21 065 B / 9 633 B nejsou měření skutečného přenosu ani důkaz pomalého webu. Duplicitní deklarace samy neprokazují viditelnou závadu.

**Přijetí:** žádná další barva nebo varianta tlačítka bez konkrétní funkce; změna sdíleného prvku se propíše předvídatelně. Barvy výsledků s významem, například aura nebo nálada, nezaměňovat s dekorací UI.

**Dílčí oprava W02 · slovník a generátor · 19. 10.:** štítky, zvýraznění souvisejících pojmů, blogové odkazy a hover souvisejících aplikací používají atlasové navy, tlumené zlato a decentní modrozelenou místo fialové a ostrého zlata. Upraveny zdrojová šablona, generátor, šest ručně definovaných souvisejících boxů a 29 statických detailů. Generátor nyní také odstraní koncové mezery, které vkládal do výstupu při vícerádkové náhradě. Syntaxe, cílený lint, diff check a scan starých akcentů prošly; výstup nebyl vizuálně prohlédnut a patří do závěrečné QA. [Checkpoint](release-prep-2026-10-15/dictionary-atlas-related-cards-2026-10-19.md). Kandidát lokální, produkce beze změny.

**Dílčí W02 · barevný jazyk Šamanského kola · 21. 10.:** stránkový CSS už nepoužívá starou fialovou: západní směr zůstává samostatně rozlišený, ale používá atlasovou modrozelenou; stejná změna sjednocuje i načítací kroužek a kartu západu. CSS revize a archiv assetů byly obnoveny. Zdrojový scan této stránky potvrdil nulu fialových dekorativních deklarací; browserové přijetí čeká na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/shaman-wheel-atlas-direction-colors-2026-10-21.md). W02 zůstává otevřené.

### W03 · P2 · Sedm vzorů stránek

| Rodina | Požadovaný vzor |
|---|---|
| Úvodní a produktová stránka | Výrazná tematická ilustrace, jasné vysvětlení a jedna hlavní akce; nabídka a ukázka mají svoje místo. |
| Nástroj | Krátký úvod, formulář nebo výběr ihned dostupný, výsledek blízko akce. Dlouhé reference dostupné na vyžádání. |
| Výsledek nástroje | Největší pozornost vlastní odpovědi a otázce; čitelný text, karta/symbol a konkrétní krok. Sekundární akce pod výsledkem. |
| Obsahový detail / reference | Čitelný samostatný článek, význam karty nebo profil znamení; jasná hierarchie, tematický obraz a odkazy na skutečně související obsah. Nepředstírat osobní výsledek. |
| Katalog / blog / slovník | Rozpoznatelné náhledy, hledání či relevantní filtry, čitelný počet a dávkování. Mobil nesmí být nekonečná úvodní mřížka. |
| Komunita / příspěvek | Oddělit čtení příspěvků od psaní, srozumitelně popsat viditelnost a stav odeslání; nepřebírat rozložení kalkulačky. |
| Účet / objednávka / potvrzení | Klidné pracovní rozhraní, stručný stav a jasný další krok. Kontaktní a platební informace bez dekorativních překážek. |

- [x] Zařadit všech 166 funkčních vstupů z inventáře do ověřené rodiny a evidovat výjimky. Draft pole v původním ledgeru zůstalo zachované pro dohledání zdroje; výsledná klasifikace a přesuny jsou v [rodinném review](release-prep-2026-10-15/functional-page-family-review-2026-10-18.md).
- [ ] Po úpravě vzoru použít existující generátor jen pro odpovídající rodinu; předem ověřit rozsah zápisu, idempotenci a zachování specifického obsahu, ID a URL. [Zdrojový přehled generátorů a rizik](release-prep-2026-10-15/page-family-generator-review-2026-10-18.md). Generátory s podporou `--check` lze ověřovat bez zápisu; úplnou shodu rodin je třeba ověřit v závěrečné QA. Blogový generátor zastaví při nedostupném nebo prázdném zdroji, povolí ukázková data pouze výslovně pro lokální náhled a ověří bezpečnost i jedinečnost slugů; slovníkový generátor před zápisem validuje vstup a jeho `--check` je zapojen do `check:content-generators`. Behaviorální guardraily a shoda generovaných výstupů zůstávají na závěrečný test. Tarot při běžném běhu extra HTML nemaže; explicitní `--prune` vyžaduje review konkrétních cest. Snář je dílčím způsobem srovnaný: `npm run snar:check` 18. 10. prošel pro 164 detailů a rozcestník bez zápisu. Zbývá závěrečné ověření ostatních rodin a celého kandidáta.
- [x] Zkontrolovat mrtvé/skryté bloky a po kontrole hooků odstranit skrytou starou kopii `#cenik-legacy` z `index.html`; aktuální viditelná cenová sekce a CTA zůstaly zachované. [Evidence kontroly](release-prep-2026-10-15/legacy-hidden-pricing-review-2026-10-17.md).

**Kontrolní zjištění W03 · 18. 10.:** zdroj generátoru znamení nyní zachovává vlastní SEO metadata Berana i aktuální favicon, OG/Twitter metadata, asset verze a patičku. `npm run zodiac:check` bez zápisu prošel pro **12 profilů a sitemap**. Diakritická adresa Vodnáře je přesměrována na kanonické `vodnar.html`, proto se nadbytečný aliasový soubor negeneruje. Stále zbývá závěrečné ověření všech rodin a kandidáta; tento dílčí průchod sám W03 neuzavírá.

**Dílčí kontrola generátorů W03 · 18. 10.:** zdroj jmenných profilů teď zachovává aktuální opatrnější texty numerologie, OG/Twitter náhledy a cache verze; 280 statických profilů bylo synchronizováno a `jmena:check` pro všechny prošel. Obecné blogové odkazy byly zúženy podle skutečného tématu: články o biorytmech odkazují na sebe navzájem a článek o auře zachovává vlastní kalkulačku bez duplicitního obecného bloku. Celé `npm run check:content-generators` nyní prošlo bez zápisu; úplná shoda ostatních rodin šablon i závěrečná prohlížečová QA zůstávají otevřené.

**Dílčí pojistka W03 · blogový generátor · 19. 10.:** `server/scripts/generate-blog.js` už při chybě Supabase nebo prázdné tabulce nevkládá testovací příspěvky. Ukázková data lze použít jen s `--use-dummy-data` mimo `NODE_ENV=production` a mimo Railway; výstupní adresář se vytváří až po ověření zdroje. Připojený Supabase projekt nemá očekávanou tabulku `public.blog_posts`, proto se generátor nespouštěl a do databáze ani souborů článků se nezapisovalo. Zdrojová kontrola je hotová; regression test a závěrečná kontrola generátorů zůstávají v dohodnutém společném běhu.

## 2. Grafika, čitelnost a pocit z používání

### W04 · P2 · Využití malovaných ilustrací a dokončení ikon

- [x] Udělat přiřazení stránka/sekce → konkrétní ilustrace a její role. Ověřený inventář má **121 WebP souborů ve 52 motivových rodinách**; jeden master slouží jen jako vstup generátoru spritu, a proto se nemaže. [Mapa, použití a hranice](release-prep-2026-10-15/atlas-art-usage-2026-10-17.md).
- [ ] Dokončit V11: SVG pro ovládání, loading, chyby, potvrzení a výsledkové štítky, včetně JS šablon a exportů. Audit 17. 10. potvrdil, že čínská znamení zobrazují významové znaky pozemských větví, které mají zůstat; nepoužívaná emoji pole pěti živlů byla odstraněna z `getChineseElement`.
  - Dílčí úprava 19. 10. · numerologie: výsledkový export nově používá sdílené malované brandové pozadí, tlumený overlay a jediný společný rámeček. Čtyři dlaždice i výsledkové texty zůstaly. [Checkpoint](release-prep-2026-10-15/numerology-share-background-2026-10-19.md).
  - Dílčí úprava 19. 10. · Tarot karta dne: PNG export používá sdílené malované navy/zlaté pozadí místo vlastního gradientu a druhého rámečku; při nedostupném helperu zůstává lokální fallback. Výběr, výklad a umístění karty se nemění. [Checkpoint](release-prep-2026-10-15/tarot-daily-share-background-2026-10-19.md). Kontrast a výsledek staženého obrázku ověřit v závěrečné QA.
  - Dílčí úprava 18.–19. 10.: neaktivní střed kompasu používá SVG `compass`; po výsledku se v centru i banneru ukazuje vlastní jednotný SVG symbol každého z 12 zvířat. Zdroj i aktivní bundle jsou sestavené, cache verze obnovené. Vizuální přijetí všech totemů zůstává na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/shaman-totem-svg-icons-2026-10-19.md).
  - Read-only recheck 20. 10. potvrdil současný stav HTML, rendereru i mapování sprite; předchozí záznam o emoji kompasu v ikonovém inventáři je zastaralý. Bez změny kódu; stále čeká jen vizuální přijetí v závěrečné QA. [Aktualizovaný inventář](ui-symbol-review-2026-10-14/inventory.md), [checkpoint](release-prep-2026-10-15/shaman-totem-svg-icons-2026-10-19.md).
  - Dílčí úprava 19. 10. · sdílení Šamanského kola: odstraněna platformní emoji kompasu/zvířete i přenos prvního jména z formuláře. Sdílení teď popisuje symbolický totem, směr a živel; připravená regrese čeká na závěrečný běh. [Checkpoint](release-prep-2026-10-15/shaman-wheel-share-copy-2026-10-19.md).
  - Dílčí úprava 18. 10.: ovládací ikony nativního sdílení, Facebooku a kopírování na Šamanském kole používají `share`, `facebook` a `copy` ze společného SVG spritu. Značka X zůstává samostatná jako logotyp platformy. Připravena cílená E2E kontrola symbolů; build, testy a vizuální přijetí patří do závěrečné QA.
  - Dílčí W11 · horoskopové sdílení · 20. 10.: možnost nativního sdílení nyní používá stejný lokální SVG `share` jako hlavní akce a ostatní prostředky ve třech jazykových mutacích; textové popisky a chování se nezměnily. Cílený bundle je sestaven, česká/slovenská/polská HTML reference obnovené, Service Worker cache přepočítaná a archiv má 2 112 verzí. Statická kontrola zdroje, distribuce a verzí prošla; testy i vizuální přijetí čekají na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/horoscope-native-share-icon-2026-10-20.md). Lokální kandidát, produkce beze změny.
  - Dílčí úprava 18. 10.: potvrzení odběru ranního horoskopu na Tarotu karta dne používá SVG `check` místo systémové emoji fajfky. Přístupný text a stav `role="status"` zůstávají zachovány; cílená E2E kontrola připravena pro závěrečný běh.
  - Dílčí úprava 18. 10.: onboardingové CTA používají `star` a FAQ lunárního kalendáře `info` ze společného spritu místo systémových emoji. Text akcí i výběr zůstávají beze změny; cílené kontroly čekají na závěrečný běh.
  - Dílčí úprava 18. 10.: interní administrační nadpis používá lokální `settings` místo dekorativní emoji nářadí; přidána kontrola odkazu na symbol do existující správy Stripe testu.
  - Dílčí úprava 18. 10.: pět statických stránek s Lucide neblokuje parser; `cenik.html` a `jak-to-funguje.html` navíc spouštějí existující inicializátor ikon, který jim chyběl. Přijetí ikon v prohlížeči zůstává otevřené. [Rozsah a omezení](release-prep-2026-10-15/performance-lucide-defer-2026-10-18.md).
  - Dílčí úprava 18. 10.: metadata rituálu používají místní SVG `hourglass`, `energy` a `star`; pevný znak vody už se nemění proti dynamickému živlu. Dynamická ID i text zůstaly zachované. [Kontrolní bod](release-prep-2026-10-15/qa-results.md).
  - Dílčí úprava 18. 10.: dekorativní fialové záře Šamanského kola jsou nyní tlumeně modrozelené/zlaté; fialová barva západního směru zůstala jako významová hodnota výsledku. Vizuální přijetí čeká na závěrečnou QA.
  - Dílčí úprava 18. 10.: aktivní styl staré návratové cesty ročního horoskopu používá stejnou navy/modrozelenou/zlatou paletu. Přesměrování nových návštěv i obsluha již zaplacené Stripe relace zůstaly nedotčené.
  - Dílčí úprava 19. 10.: tlačítko odeslání v Hvězdném průvodci používá nově přidaný symbol `send` ze společného SVG spritu místo dekorativní textové hvězdičky. Přístupný název tlačítka zůstal zachovaný; vizuální přijetí čeká na závěrečnou QA.
  - Dílčí úprava V11/W10 · záložní sdílecí text runy už nepřidává systémové emoji ani neslibuje kámen, který má uživatele čekat. Název, symbol a význam zůstaly; CTA vede ke skutečnému losování run. Cílený bundle, Service Worker a archiv assetů byly obnoveny; aplikační a vizuální přijetí čeká na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/rune-share-copy-2026-10-19.md). Produkce beze změny.
  - Dílčí úprava V11/W10 · sdílení Andělské karty používá v obrázkové i textové variantě stejný neutrální titul a pravdivý popis symbolického tématu; odstraněna první osoba, emoji a tvrzení, že karta na člověka „čeká“. Cílený bundle, Service Worker a archiv assetů byly obnoveny; výsledek sdílení čeká na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/angel-card-share-copy-2026-10-19.md). Produkce beze změny.
  - Dílčí úprava 19. 10.: poslední uživatelská bublina Hvězdného průvodce už nepoužívá starý fialový gradient; tlumená zlatá a modrozelená ji odlišují při zachování světlého textu. CSS dostalo nový cache token; kontrast a vykreslení ověřit ve společné browser QA.
  - Dílčí úprava 18. 10.: dekorativní fialové přechody na stránce Minulý život jsou nahrazeny tlumenou modrozelenou a zlatou, včetně nativní sdílecí akce; obsah ani funkce se nezměnily.
  - Dílčí úprava 18. 10.: drobné dekorativní fialové akcenty Křišťálové koule, Jak to funguje, O nás, profilu a snáře jsou srovnané s navy/modrozelenou/zlatou paletou. Jejich významové barvy ani funkce se nezměnily; přijetí čeká na závěrečnou QA.
- **Aktualizace V08 · 19. 10.:** původní snímek starého Měsíce je zastaralý. Lunární kalendář i rituál nyní používají SVG sprite s osmi vybranými fázemi ze společného výpočtu; symbolika má navy, krémovou a zlatou paletu. Omezený pohyb vypíná společné Atlas CSS. Nová grafika není potřeba, dokud finální mobilní/desktopová kontrola neukáže konkrétní problém. [Rozsah a důkaz](page-simplification-2026-10-14/README.md).
- **Aktuální inventář V11 · 19. 10.:** omezená kontrola veřejných HTML uzlů označených `icon`, `emoji`, `symbol` nebo `badge` našla jen významové glyfy znamení/planet a typografickou hvězdičku, ne další dekorativní emoji. `scripts/unify-ui-symbols.mjs --check` uvádí 917 HTML, 0 změn a 0 nezmapovaných symbolů. Dynamické JS šablony a exportní obrázky tím nejsou pokryté; V11 zůstává otevřené pro tyto povrchy a závěrečnou QA. [Inventář a meze](ui-symbol-review-2026-10-14/inventory.md).
- **V11 follow-up · běhové JS · 19. 10.:** rozšířený Unicode sken 16 zdrojových souborů klasifikoval významové glyfy znamení, interní klíče lunárních fází mapované na SVG a zastaralý nepoužívaný `daily-card.js`. V aktivních zdrojích nezůstal další nalezený dekorativní emoji výstup; exportní canvasy a serverové/runtime texty jsou mimo rozsah skenu. [Klasifikace a omezení](ui-symbol-review-2026-10-14/inventory.md).
  - W11 follow-up · neznámý klíč fáze Měsíce · 20. 10.: `js/moon-art.js` při neznámé hodnotě už nevypisuje vstup jako text/emoji. Vyčistí symbol a pro viditelný prvek zachová přístupný název fáze; osm platných sprite symbolů ani jejich výpočet se nemění. Cílený bundle a cache odkazy tří stránek jsou obnovené. Statická kontrola a syntaktické ověření prošly; browserové přijetí zůstává na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/moon-art-invalid-key-guard-2026-10-20.md). Lokální kandidát, produkce beze změny.
- W04 follow-up · profilové ikony · 20. 10.: read-only průchod pomocníka `gpt-6-luna` (low) a nezávislá kontrola zdrojů potvrdily, že avatary, záložky, statistiky a zavírací ovládání používají společný SVG sprite. Parametr `emoji` ve výběru avataru je jen zavádějící interní název; jeho hodnota je omezena na povolená `symbol:<id>` a systémová emoji se nezobrazují. Bez změny kódu; velikost, kontrast a běhové vykreslení profilu patří do závěrečné QA. [Statická kontrola a meze](release-prep-2026-10-15/profile-settings-symbols-readonly-2026-10-20.md).
- W04 follow-up · datovaná stránka horoskopu · 20. 10.: detail znamení nyní používá stejnou obsahovou plochu a jemné 5px zaoblení jako sousední Atlas karty. Po obnovení 918 HTML odkazů jsem opravil také společný `atlasShell`: generátor znamení nyní převezme jeho aktuální CSS token bez křehkého přepisu. Verifikační skript kontroluje také atlasové URL v `.mjs` šablonách a hlásí 0 zastaralých referencí. Service Worker cache `mysticka-hvezda-003426895d73`, asset archiv 2 153 verzí. Kód route zároveň potlačuje starou `.stars` vrstvu a vypíná globální pozadí. Skutečný mobilní/desktopový výsledek čeká na závěrečnou browser QA. [Zdrojový průchod, změna a omezení](release-prep-2026-10-15/horoscope-dated-switcher-atlas-2026-10-20.md).
- W04/V11 follow-up · patička Keltského kříže · 21. 10.: dva dekorativní znaky `✧` v `Templates.renderSummaryCeltic()` používají společný SVG symbol `star`; viditelný text i rozvržení patičky zůstaly stejné. Přestavěny JS svazky, obnoveno 360 sdílených asset odkazů; kontrolní skript hlásí 0 zastaralých odkazů. Service Worker cache `mysticka-hvezda-0c167437bed7` je potvrzená generátorem a archiv obsahuje 2 244 verzí. Zdroj a distribuce jsou ověřené staticky; běhové a vizuální přijetí čeká na závěrečnou QA, W04/V11 zůstává otevřené. [Checkpoint](release-prep-2026-10-15/tarot-celtic-footer-stars-svg-2026-10-21.md). Lokální kandidát; produkce beze změny.
- W04/V11 follow-up · exportní symboly · 21. 10.: statický průchod našel monochromatické znaky v PDF výkladech Roční horoskop a Osobní mapa a zlatou typografickou hvězdu v doručovacích e-mailech. Jde o znakové motivy, ne o platformní emoji; jejich vhodnost a vykreslení je třeba posoudit ve skutečných PDF a e-mailových náhledech. Bez změny kódu, otevřené do závěrečné QA. [Klasifikace v inventáři](ui-symbol-review-2026-10-14/inventory.md).
- [ ] Použít decentní tematické pozadí tam, kde pomáhá kompozici; v dlouhém výkladu dát přednost klidné ploše. Zkontrolovat výřezy na mobilu, jednotnou výtvarnou teplotu a ostrý text.
- [ ] Až po přiřazení určit skutečně chybějící motivy. Generovat cílenou sadu podle potřeby, nikoliv další zásobu obrázků bez umístění.

**Oprava generátoru 17. 10.:** `scripts/apply-atlas-art.mjs` nyní zachovává správnou verzi atlasového CSS, vytváří responzivní zdroje pro vložené scény a má read-only `--check`. Všech 12 mapovaných stránek prošlo kontrolou idempotence po synchronizaci čtyř výřezů. Mobilní vizuální přijetí zůstává otevřené.

**Dílčí sjednocení ikon 17. 10.:** výběr témat v `onboarding.html` používá pro všech 15 voleb existující SVG symboly místo nesourodých emoji a textových mezer. V rozcestníku 404 dostalo stejný styl všech 10 navigačních odkazů; tlačítko Andělské pošty a sdílecí toast používají symboly ze stejné sady a její nativní kategorie už nepoužívají emoji. `data-interest`, cílové URL, popisky a obsahové znaky znamení zůstaly zachované. Vizuální přijetí a širší audit ikon zůstávají otevřené.

**Dílčí sjednocení ikon 18. 10.:** slovenský tarot ÁNO/NIE používá pro všech pět výsledků existující SVG symboly (potvrzení, hvězda, křišťál, varování, chyba) místo systémových emoji. Textové štítky a významové barvy zůstávají zachované; změna je omezena na lokalizovanou stránku a její dynamické otočení karty/výsledkovou ikonu. Související odkazy na `kristalova-koule.html` teď používají symboly `tarot` a `angel` místo emoji; cílové URL a texty zůstaly stejné. Zdroj a distribuční bundle jsou sestavené; verze assetů odpovídají změně. Vizuální přijetí čeká na závěrečnou společnou QA.

**Další dílčí sjednocení 18. 10.:** sdílení výsledku v kalkulačce Čísla osudu používá symboly `copy`, `check` a `error` z jednotné sady. Kopírování oznamuje stav také přes přístupnou živou oblast a selhání už nezůstává nezachycenou chybou. Emoji bylo odstraněno jen z tohoto ovládacího prvku; obsahové sdílecí sdělení zůstalo beze změny. Zdrojová ikona byla přidána do sprite; běhová a vizuální kontrola je odložená na závěrečnou QA.

**Dílčí oprava 18. 10.:** audit runtime kopírovacích oprav zjistil, že `js/secondary-pages-copy-fixes.js` znovu přepisoval SVG/štítky v 404, afirmacích a Andělské poště a vracel emoji do voleb astro mapy. Oprava zachovává ikony a fázi Měsíce, mění jen textové uzly, odstranila emoji z nativních voleb a případných návazných karet už nepřepisuje ikonový blok. Cílený build JS, asset snapshot, ESLint, syntaxe a statická kontrola současného hashe v archivu prošly; kompletní ikonové i běhové přijetí zůstává otevřené do závěrečné QA.

**Dílčí copy úprava 18. 10.:** při stejné kontrole byl odstraněn dekorativní emoji úvod z krátkého načítacího textu denní afirmace. Stav teď konkrétně říká, že se připravuje afirmace pro zvolené znamení. Zdroj i dist mají současnou verzi v asset archivu; plné UI ověření odloženo do společného závěru.

**Dílčí sjednocení 18. 10.:** 283 ikon v 74 statických blogových tematických blocích se nyní vybírá podle cílového nástroje a používá místní SVG sprite. Text odkazu zůstává názvem odkazu; číselná hodnota zůstala v textu místo klávesnicové emoji, významový runový/znamení symbol je přiřazen podle cíle. Generatorový běh je opakovatelný; browserové rozměry a vizuální přijetí zůstávají ve společné QA.

**Další dílčí sjednocení 18. 10.:** stránka `/tarot-zdarma.html` používá pro čtyři funkční karty existující symboly tarotu, křišťálu, hvězdy a anděla. Opakované CTA andělských karet sdílí stejný andělský znak. Ikony jsou skryté před asistivními technologiemi, názvy funkcí zůstávají textové. Verze stránky i odkazy na sprite mají nový cache token; vizuální přijetí čeká na závěrečnou QA.

**Další dílčí sjednocení 18. 10.:** hero šamanského kola místo emoji peří používá novou linkovou ikonu pírka. Čtyři směry mají jednotně kreslené symboly živlů, přičemž názvy světových stran i živlů zůstávají textem a jsou dostupné čtečkám obrazovky. SVG odkazy i stránkový CSS asset jsou verzované. Barvy nástroje zůstaly zachované: `atlas-art.css` výslovně ponechává barvy grafů konkrétním funkcím. Jejich kontrast se ověří při finální obrazové QA.

**Read-only průzkum další dávky:** pomocník `gpt-5.6-luna` (low) našel jako další kandidáty dekorativní peří a významové značky směrů v `shamansko-kolo.html` a ikonu andělských karet v `tarot-zdarma.html`. Obsahové značky směrů vyžadují při náhradě zachovat význam; změna zatím neprovedena.

**Dílčí typografické sjednocení 17. 10.:** z opakovaných nadpisů „Tip na rande“ bylo na všech 144 statických stránkách partnerských dvojic a v existující HTML šabloně odstraněno emoji žárovky; text i tipový obsah zůstaly. Automatické přegenerování této SEO rodiny není ověřené.

**Další dílčí sjednocení ikon 18. 10.:** premium banner Hvězdného průvodce používá symboly `star` a `gem`, kontaktní údaje `hourglass` a `globe`, ukázka tarotu `star` a blok tranzitů `chart` ze společného SVG sprite. Významové texty, počítadlo, odkazy i obsah znamení zůstaly. V cíleném scanu těchto čtyř stránek už hledané emoji nejsou; mobilní rozměry, kontrast a vizuální přijetí patří do závěrečné QA.

**Dílčí sjednocení lexikonu jmen 17. 10.:** šest opakovaných dekorativních emoji zmizelo z nadpisů všech 280 detailů a ze šablony `scripts/generate-jmena-pages.mjs`. Zachované jsou texty sekcí; další obsahové symboly zůstávají posuzované podle významu, ne plošně nahrazované.

Sdílecí toast teď používá kontrolní SVG a atlasový tmavomodrý podklad; HTML, bundle i CSS prošly cílenou statickou/build kontrolou. Přepnutí na nativní sdílení a vizuální přijetí čeká na závěrečnou QA.

**Drobné sjednocení cache 17. 10.:** na 12 stránkách byl zdvojený řetězec verze pro `js/dist/share-result.js`; opraven na společné `20261017-icons`. Kontrola zdrojů potvrdila nulový zbytek vadného parametru. Samotné ikonové chování se tím nemění.

**Dílčí úprava sdílecí grafiky numerologie 17. 10.:** exportní karta používá klidnou navy/krémovou/tlumeně zlatou paletu místo fialového gradientu, řidší hvězdné detaily a menší rámečky; popisek výslovně říká, že obrázek neobsahuje datum narození. Zdroj i distribuční modul prošly syntax/build kontrolou. Vizuální náhled exportu čeká na závěrečnou QA.

**Dílčí sjednocení Andělské pošty 17. 10.:** stavové zprávy i autor a ovládání podpory používají existující SVG symboly, text serverové chyby zůstává textovým uzlem, tlačítko podpory má `aria-pressed`, viditelný fokus a dotykovou plochu alespoň 44 px. Kategorie ve vzkazech jsou textové stejně jako nabídka formuláře. Zdroj a build jsou ověřené; interakce v prohlížeči čekají na závěrečnou QA.

**Další dílčí sjednocení 18. 10.:** afirmace používají ve funkčních akcích kopírování, sdílení a přechodu na horoskop ikony `copy`, `share` a `star`; potvrzení kopírování má symbol `check`. Profil jmen používá ikony kalendáře, numerologie, spektra, listu, srdce a kompasu. Popisky, ID výsledkových polí a chování tlačítek zůstaly zachované. Ikonové odkazy jsou verzované; statická kontrola symbolů a ID prošla. Vizuální kontrola zůstává ve finální společné QA.

**Další dílčí sjednocení 18. 10.:** kalendář, lunární rituál a afirmace vykreslují aktuální fázi přes existující lokální SVG sprite. Fázová data a názvy zůstaly zachované; statické fallbacky, odznaky, označení sekcí i vstupní CTA už nepoužívají systémové měsíční emoji. U odznaků s vedlejším viditelným názvem je ikona skrytá pro čtečky, samotný ukazatel fáze zůstává pojmenovaný. V11 zůstává otevřené a kontrola v prohlížeči patří do závěrečné QA.

**Další dílčí sjednocení 18. 10.:** 65 redakčních avatarů na 64 článcích nyní používá značku Mystické Hvězdy ze společného SVG spritu místo směsi lunárního, Venušina a jiskřivého emoji. Generátor článků dostal stejný brandový symbol a `atlas-blog.css` novou velikost/zlatou barvu; 75 odkazů na stylesheet bylo verzováno. Jména autorů ani texty článků se neměnily. Vizuální přijetí zůstává ve společné závěrečné QA.

**Další dílčí sjednocení 18. 10.:** šest planet v článku o synastrii nyní používá monochromatické astrologické glyfy ve stejné velikosti a tlumeně zlaté barvě místo mixu barevných emoji a znaků. Každý symbol je dekorativní a sousedí s viditelným názvem planety. Výklad a jeho nadpisy se neměnily; stylesheet stránky má aktuální token `20261018-planet-glyphs`.

**Další dílčí sjednocení 18. 10.:** 42 souvisejících odkazů na lunární kalendář, snář, Měsíc a Tmu nyní používá kreslené místní SVG. V textu odkazu zůstaly názvy i stávající cílové URL. Zdrojový generátor blogových tematických odkazů nyní tvoří stejnou značku; všech 74 článků bylo zpracováno a opakovaný průchod nezměnil obsah mimo generovaný blok.

**Dílčí sjednocení fallbacku 18. 10.:** ukázkové rubové karty na `tarot-zdarma.html` už při nedostupném obrázku nepoužijí starý fialový přechod ani fialový hover stín. Záložní povrch má navy/modrozelený tón a tlumený zlatý stín; skutečný rub, otáčení i výsledek zůstaly beze změny. Asset token stránky byl obnoven. Změna je malá, protože obrázek běžně plochu zakrývá; vizuální a funkční přijetí zůstává na závěrečné QA.

**Dílčí sjednocení W02/W04 · horoskopové stránky · 18. 10.:** renderer denních SEO horoskopů i zdroj generátoru 12 statických znamení už nevkládají starou dekorativní `.stars` vrstvu. Aktuální statické výstupy ji nemají; Atlas ji předtím jen vizuálně přebíjel. Obsah, výklady, URL i slugy zůstaly nedotčené. Runtime/browser přijetí čeká na společnou QA. Znovugenerování zatím blokuje nesoulad starších asset tokenů popsaný v W03.

**Další dílčí sjednocení W04 · profil · 18. 10.:** dekorativní hvězdička v prázdném deníku výkladů používá stávající SVG `star` místo textového glyfu. Aktivní hashovaný profilový chunk, dělený dashboard bundle, Service Worker a asset snapshot jsou aktualizované. [Evidence](release-prep-2026-10-15/profile-empty-state-icon-2026-10-18.md). Následně byly sjednocené i dva další dekorativní nálezy z téhož scanu — emoji výsledku Minulého života a hvězda v orbitu vztahového výkladu — viz [checkpointy](release-prep-2026-10-15/past-life-result-decoration-2026-10-18.md) a [vztahový výklad](release-prep-2026-10-15/relationship-orbit-svg-2026-10-18.md). Browserové přijetí zůstává otevřené.

**Další dílčí sjednocení W04 · Minulý život · 18. 10.:** z každé výsledkové zprávy byla odstraněna automaticky přidávaná dekorativní ✨; vlastní sdělení a jeho styl zůstaly. [Evidence](release-prep-2026-10-15/past-life-result-decoration-2026-10-18.md). Prohlížečové přijetí zůstává na společnou závěrečnou QA.

**Další dílčí sjednocení W04 · vztahový výklad · 18. 10.:** znak `✦` v dekorativním orbitu tří tarotových karet nyní používá místní SVG `star`; kruhy, karty i jejich popisy zůstaly. [Evidence](release-prep-2026-10-15/relationship-orbit-svg-2026-10-18.md). Vizuální přijetí čeká na společnou QA.

**Release build 18. 10.:** po změnách sdílených stylů a přihlašovacích šablon byly cache tokeny CSS, `core.js`, `auth-client.js` a přímých `templates.js` obnovené na `20261018-release-candidate`. Oba verifikační skripty hlásí nula zastaralých odkazů. `npm run build:js` i `npm run build:css` doběhly; aktuální Service Worker cache `mysticka-hvezda-97a8c87c2edf`, asset snapshot **1 667** veřejných verzí. To dokládá lokální sestavení, nikoli browserové přijetí. Aplikační testy, finální vizuální kontrola a produkce zůstávají beze změny.

**Dílčí sjednocení push ovládání 18. 10.:** tlačítko denního horoskopu používá SVG `bell`, `bell-off`, `hourglass` a `error`; popisek i stav jsou dostupné v češtině, slovenštině a polštině. Během požadavku se ovládání zamkne a oznámí stav přes `aria-live`. Opakovaný pokus znovu použije už vytvořené předplatné prohlížeče; odhlášení změní stav až po potvrzené odpovědi serveru. Push route nyní předá chybu vrácenou Supabase jako neúspěšný HTTP stav místo falešného úspěchu. Změněné stránky mají nový JS cache token; build a statické kontroly prošly. Připravená serverová regrese i interakční/browserové ověření čekají na společnou závěrečnou QA.

**Přijetí:** ikonky mají společnou kresbu, optickou velikost a význam; obsahové runy/znamení mají vhodný popisek. Obrázek nepřekrývá text ani neodsouvá hlavní akci o několik obrazovek. Dekorace a skutečný obsah mají odpovídající alternativní popis.

### W05 · P2 · Čitelnější výklady a kratší doplňující obsah

- [ ] Sjednotit šířku textového sloupce, odstavce, nadpisy a klíčová shrnutí. Na mobilu prověřit delší výklad i dlouhou vlastní otázku.
- [ ] Výsledku dát jasnou strukturu: otázka → symbol/karty → výklad → praktický krok → volitelné uložení/poznámka. U různých nástrojů zachovat jejich skutečný obsah.
- [ ] Pokračovat ve V02/V06/V14 u zbývajících stránek; odstranit duplicitní rozcestníky a opakované výzvy. Krátké užitečné vysvětlení a ceny neskrývat mechanicky.

**Přijetí:** celá slíbená odpověď je dostupná před dobrovolnou nabídkou. Čtenář rozliší vlastní výsledek od reference a reklamy. Významové texty 78 karet a hodnotný obsah zůstávají zachované.

**Aktualizace V14 · 19. 10.:** původní snímky otevřených FAQ jsou zastaralé. Cílové FAQ na auře, biorytmech, čínském horoskopu, týdenním/měsíčním horoskopu a denní kartě jsou v aktuálním zdroji jednotlivými nativními `<details>`. Textová a JSON-LD shoda se tímto checkpointem znovu nevaliduje; mobilní, klávesnicové a vizuální přijetí zůstává pro závěrečný průchod. Dlouhé obsahové bloky se neskrývají bez konkrétního důvodu. [Aktuální zdrojový stav](page-simplification-2026-10-14/README.md).

**Aktualizace V14/W10 · 21. 10.:** zdrojová kontrola potvrdila přesnou shodu všech čtyř viditelných FAQ položek a FAQPage JSON-LD na šesti cílových stránkách. Týdenní/měsíční hero texty, FAQ, meta popisy, nadpisy a informační karty nyní tykají a výklad popisují jako obecný symbolický rámec, ne instrukci. Měsíční stránka neodkazuje čtenáře na neověřené ukládání tématu v profilu. Bez browserové nebo funkční QA; ta zůstává součástí závěrečného průchodu. [Checkpoint](release-prep-2026-10-15/horoscope-faq-voice-and-schema-2026-10-21.md).

**Dílčí zjednodušení W05 · partnerská shoda · 19. 10.:** obecný seznam rozborů dvojic už neopakuje tři odkazy ze specializovaného seznamu Štíra. Všechny tři cíle zůstaly v tematickém seznamu, další karty ani obsah detailů nebyly odstraněny. Z 11 obecných karet zůstalo 8; zdrojová kontrola potvrdila 0 duplicit mezi oběma seznamy a existenci všech cílů. [Checkpoint](release-prep-2026-10-15/synastry-link-list-dedup-2026-10-19.md). Vizuální/klávesnicové přijetí zůstává na závěrečnou QA.

**Dílčí zjednodušení W05 · andělské karty · 19. 10.:** úplný katalog 44 významů je nyní v zavřeném nativním rozbalovacím seznamu pod hlavním nástrojem a FAQ. Všechna cílová URL zůstala dostupná a generátor je zachovává. `andelske-karty:generate` změnil pouze hub; `andelske-karty:check` potvrdil 44 detailů i shodu rozcestníku. Browserové přijetí čeká na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/angel-card-meanings-disclosure-2026-10-19.md).

**Read-only kontrola W05/V06 · Hvězdný průvodce · 19. 10.:** pomocný agent `gpt-6-luna` (low) neobjevil duplicitní katalog ani dlouhý referenční blok ke sbalení. Zdrojové ověření potvrdilo, že volba předání souhrnů výkladů se zobrazí přihlášeným, začíná vypnutá a obsahuje popis přímo vedle souhlasu. Neprovedla se změna. [Rozsah kontroly](release-prep-2026-10-15/footer-mentor-source-review-2026-10-19.md).

**Dílčí úprava 18. 10.:** na `tarot-karta-dne.html` zůstal tah karty a výsledek včetně všech runtime hooků viditelný. Kroky, vysvětlující primer a FAQ jsou nativními rozbalovacími referencemi; související cesty zůstaly jednou viditelnou skupinou. FAQ JSON-LD nyní přesně odpovídá čtyřem viditelným odpovědím. Stránkový CSS je verzovaný. Statická kontrola dokončená; mobilní/klávesnicové vizuální přijetí a běh nástroje jsou odložené na finální společnou QA.

**Dílčí úprava 18. 10.:** dlouhá modelová interpretace Hvězdy na `tarot.html` je dostupná po otevření nativního disclosure „Ukázka výkladu karty Hvězda“. Nabídka významů karet zůstala uvnitř; výběr rozkladu, cena ani jeho trackovací hooky se neměnily. Příklad má sjednocené tykání. Strukturální statická kontrola a ID zůstala beze změny; vizuální přijetí patří do finální QA.

**Dílčí úprava 18. 10.:** tři navazující odkazy na `tarot-ano-ne.html` jsou nyní pod stručným „Kam pokračovat“ disclosure. Stávající otázky a jejich vlastní FAQ disclosure zůstaly samostatně přístupné; žádné vnořené disclosure nevzniklo. Odkazy ani měření se neměnily; lokální vizuální ověření patří do finální QA.

**Dílčí úprava 18. 10.:** `numerologie.html` ponechává výpočet a výsledek viditelné; vysvětlení číslic a čtyři FAQ jsou na vyžádání v samostatných nativních disclosure. Tři numerologické návaznosti zůstávají vidět a existující SEO text je přepsaný jako symbolický, nikoli osobnostní jistota. FAQ odpověď o rozdílu životní cesty a osudu teď souhlasí s JSON-LD. ID i analytické hooky zachované; vizuální a výpočtová kontrola patří do finální QA.

**Dílčí úprava 18. 10.:** `kristalova-koule.html` má dlouhé tipy a FAQ v jednom nativním rozbalovacím bloku; hlavní otázkový nástroj a rozcestník podle záměru zůstaly přímo dostupné. Text odstranil spekulaci o strachu uživatele a jasně označuje výsledek jako symbolický podnět, ne předpověď. Čtyři viditelné FAQ odpovídají JSON-LD. V navazujících odkazech jsou sjednocené symboly tarot/anděl bez změny URL. Výsledek hlásí asynchronní stav čtečce obrazovky a limit 200 znaků odpovídá ověření v JS. Závěrečná klávesnicová a mobilní kontrola zůstává odložená.

**Dílčí úprava 18. 10.:** `runy.html` už neopakuje dolní obecný blok odkazů za šesti volbami podle záměru. Čtyři FAQ zůstávají ve zdroji i JSON-LD, ale jsou jednotlivě rozbalovací; statická kontrola potvrdila přesnou shodu obou verzí a zachované funkční ID. Výsledek runy, formulář, limity, souhlas a hlubší výklad zůstaly mimo disclosure. Mobilní a klávesnicová kontrola čeká na společnou závěrečnou QA. [Evidence](release-prep-2026-10-15/runic-page-simplification-2026-10-18.md).

**Dílčí úprava 18. 10.:** `tarot-karta-dne.html` teď nabízí čtyři FAQ v samostatných nativních disclosure; nadpis sekce zůstává otevřený a odpovědi souhlasí s FAQPage JSON-LD. Mobilní a klávesnicové přijetí čeká na společnou závěrečnou QA. [Evidence](release-prep-2026-10-15/tarot-daily-individual-faq-2026-10-18.md).

**Další dílčí W05 · Tarot karta dne · 20. 10.:** odstraněn opakující se krok a duplicitní členská výzva; rozložení zbylých dvou informačních karet je srovnané. Odpověď k tříkartovému tarotu nyní odpovídá nadpisu, uvádí členství a vede na ceník; FAQ a JSON-LD jsou ve shodě. Statická kontrola prošla. Mobilní/klávesnicové vykreslení a nástroj čekají na společný QA běh. [Evidence](release-prep-2026-10-15/tarot-daily-content-pruning-2026-10-20.md). Kandidát lokální, produkce beze změny.

**Dílčí úprava 18. 10.:** `tydenni-horoskop.html` a `mesicni-horoskop.html` už nemají osm otevřených FAQ karet. Každá otázka je samostatný disclosure; Q&A v JSON-LD odpovídá viditelným textům. Statická kontrola prošla; společné mobilní/klávesnicové přijetí zůstává otevřené. FAQ rich results Google od května 2026 nezobrazuje, schéma ponecháváme pro přesné popsání obsahu. [Evidence](release-prep-2026-10-15/horoscope-faq-disclosures-2026-10-18.md).

**Dílčí úprava 18. 10.:** ve Snáři po FAQ zůstala jedna tematická návaznost na Tarot ze čtyř původních obecných nástrojů. Jediná karta je vycentrovaná a její popis vysvětluje souvislost; seznam snových symbolů, vyhledávání, abeceda a FAQ zůstaly nedotčené. [Evidence a hranice](release-prep-2026-10-15/dream-page-simplification-2026-10-18.md).

**Dílčí zjednodušení W05 · Osobní mapa · 20. 10.:** u přehledu všech 20 stran zůstal obrázek i hlavní modelový příklad; jeho doprovodný text se zkrátil na jednu konkrétní otázku k zamyšlení. Tím se neopakuje úvodní ukázka vztahového zadání. Cena, rozsah PDF, doručení a informace o soukromí zůstaly zachované. [Checkpoint](release-prep-2026-10-15/personal-map-contact-sheet-copy-2026-10-20.md). Pouze lokální kandidát; mobilní a vizuální přijetí patří do závěrečné společné QA.

### W06 · P2 · Jeden srozumitelný jazyk formulářů a stavů

**Dílčí přijetí 17. 10.:** profil má sjednocené štítky přístupu, pravdivý text ukončení a zkušebního období a dostupné faktury i po zrušení členství. [Lokální členská matice a hranice PV02](release-prep-2026-10-15/profile-membership-qa.md). Neuzavírá další formuláře ani celou oblast W06.

**Dílčí oprava W06 18. 10. — SK/PL natální výpočet:** při každém novém odeslání formulář nejdřív zneplatní a přeruší předchozí požadavek a vyprázdní předchozí výsledek, teprve potom ověří aktuální datum a místo. Neplatný vstup tak nemůže ponechat ani později znovu zobrazit výsledek pro stará data. Přidána cílená Playwright regrese pro oba jazyky a opožděnou odpověď; zatím nebyla spuštěna. Výpočet a jeho vstupy se neměnily; lokální behaviorální ověření je odložené do závěrečné společné QA.

**Dílčí oprava W06 18. 10.:** registrační a přihlašovací modal už při síťové chybě nebo neplatném JSON nevypíše surovou anglickou výjimku. Serverem vrácené chyby a jejich kódy zůstávají zachované. Upraven je jen fallback ve zdroji `js/auth-client.js`; sestavený `js/dist` a 67 referencí zůstávají pro finální build/cache verzi. Přidána cílená E2E regrese přihlášení i registrace při nečitelném API výsledku; test čeká na společný závěrečný běh.

**Dílčí oprava 17. 10.:** sdílený e-mailový most k dennímu horoskopu už nebere trvalý browserový příznak jako důkaz aktivního odběru. Chyby vstupu a API jsou inline a přístupné; neúspěšný požadavek zachová údaje. Po úspěšném odeslání lze změnit znamení pro stejnou e-mailovou adresu; stav je oznámen přes `role=status`. Celá cílená E2E sada k tarotu dne prošla na desktopu i Mobile Chrome (**24/24**), včetně odběru, chyb, změny znamení a navazujících cest. Ostatní asynchronní formuláře zůstávají otevřené.

- [ ] Doplnit u každého asynchronního nástroje stavy prázdný/vyplněný/načítání/výsledek/chyba/opakování. Chyba zachová vstupy, odstraní zavádějící starý výsledek a řekne, co jde udělat.
- [ ] Ověřit popisky, vysvětlení nepovinných údajů, autocomplete, Enter a fokus. Chyba má být i u pole nebo výsledku, nejen v krátkém toastu.
- [ ] Zpřesnit čekání a chyby: žádné nepravdivé „naši mágové již pracují“. Rychlý lokální výsledek nebrzdit předstíraným výpočtem.
- [ ] Horoskopový deník — CZ/SK/PL mají nepředvolený souhlas, který se vypíná při změně účtu/přístupu; server použije nejvýše tři položky (max. 300 znaků každá) jen pro přihlášený účet s přesným souhlasem a oprávněným obdobím/jazykem, jinak vytvoří horoskop bez osobního kontextu. Z logů je odstraněn kontextový hash cache klíče. Soukromí popisuje předání serveru/AI i uložení výsledku do cache. Následný prompt označuje zápisky jako nedůvěryhodná data a zakazuje plnit jejich instrukce, vyvozovat diagnózy, potíže či závěry o třetích osobách nebo připisovat obsah astrologickému důkazu. `js/dist/horoscope.js` odpovídá klientskému zdroji; cache verze zůstává `20261020-journal-context-consent`, protože poslední změna je pouze serverová. Ve společné závěrečné QA ověřit auth/přístup, změnu účtu, chyby a cache hit/miss i výstup AI s injekčním a nesouvisejícím zápisem. [Souhlas a server](release-prep-2026-10-15/horoscope-context-server-consent-2026-10-19.md), [bezpečné hranice promptu](release-prep-2026-10-15/horoscope-journal-prompt-boundaries-2026-10-20.md).
- [ ] Hvězdný průvodce — zdrojová oprava připravena: souhrny až tří nejnovějších uložených výkladů se server načte a předá AI pouze při výslovně zapnuté, ve výchozím stavu vypnuté volbě; plný text deníku se vylučuje. Volba je dostupná jen přihlášeným a při změně účtu se resetuje. Zásady soukromí nyní popisují zprávu, omezenou historii chatu, případné profilové jméno/datum narození, ukládání konverzace i volitelný kontext výkladů. `js/dist/mentor.js` je sestaven a `mentor.html` načítá nový cache token; ověřit stav hosta, zapnutí/vypnutí, změnu účtu a skutečný payload ve společné závěrečné QA.

**Dílčí oprava W06 · Biorytmy · 20. 10.:** při úpravě nebo vymazání data narození se nyní skryje výsledek vypočtený pro předchozí datum, smažou se číselné hodnoty, zruší graf a vymaže stav načítání. Zneplatní se i čekající vykreslení, takže pozdě načtený Chart.js neukáže starý graf znovu. Nový platný submit výsledek vytvoří znovu. Zdroj a distribuce byly sestaveny; `biorytmy.html` načítá `20261020-stale-result-clear-on-date-change`. Statické kontroly a `node --check` prošly, asset snapshot obsahuje 2 136 verzí; stránka není v Service Worker precache. [Checkpoint](release-prep-2026-10-15/biorhythm-stale-result-date-change-2026-10-20.md). Interakční a browserová QA čeká na společný závěr.

**Dílčí oprava W06 · Runy · 20. 10.:** při úpravě záměru se odstraní navázaný paywall náhled, chyba i akce oblíbených, obnoví se nabídka hlubšího výkladu a smaže se čekající kontext starého záměru. Před novým požadavkem se starý stav vyčistí. Zdroj a distribuce byly sestaveny, `runy.html` načítá nový token, Service Worker hash je `mysticka-hvezda-f5264d40d69a`; `node --check` a `git diff --check` prošly. Interakční kontrola čeká na společnou závěrečnou QA. [Checkpoint](release-prep-2026-10-15/runes-stale-intention-result-2026-10-20.md). Pouze lokální kandidát; produkce beze změny.

**Dílčí oprava W06 · Partnerská shoda · 20. 10.:** při změně jména, data, času, místa či volby profilu se skryje předchozí skóre a výklad, odstraní CTA a sdílecí payload a zachovají se upravené vstupy. Ruční editace zároveň ruší čekající profilový autofill, aby pozdní profil nepřepsal ruční hodnoty. Během výpočtu zůstávají pole uzamčená; stávající request-identity kontrola zahodí neaktuální dokončení. Zdroj a distribuce byly sestaveny; stránka načítá nový token `20261020-stale-input-invalidation`. Modul není v Service Worker precache. `node --check` a `git diff --check` prošly. [Checkpoint](release-prep-2026-10-15/synastry-stale-result-after-input-change-2026-10-20.md). Interakční ověření čeká na společnou závěrečnou QA; pouze lokální kandidát.

**Podklad:** `js/error-boundary.js` řeší jen velmi malý/prázdný `main`; existence globálního panelu nezaručuje ošetření dílčího API výpadku. Ověření 17. 10. opravuje starou poznámku o 2 500ms čekání na kvízu: aktuální `js/quiz/archetyp-duse.js` nemá časovač, `showLoading()` ihned volá `showResult()` a žádná falešná prodleva tam není. Samostatná loading obrazovka se tedy ani nezobrazí; ověřit její smysl při závěrečné kontrole, jiné API nástroje zůstávají otevřené.

**Dílčí oprava 17. 10.:** tarot ANO/NE ruší odložené zobrazení výsledku při resetu a hlídá generaci tahu i během asynchronního načítání kartotéky. Starý tah tak po resetu nemůže znovu ukázat výsledek, přesunout fokus ani vykázat `reading_complete`; navazující načtení obrázku a posun stránky také ignorují zastaralý tah. Zdroj a build jsou staticky ověřené; skutečný reset/nový tah v prohlížeči čeká na závěrečnou QA.

**Dílčí oprava 17. 10.:** numerologie nyní při novém platném odeslání zneplatní starší AI požadavek. Jeho opožděná odpověď ani chyba nepřepíše aktuální výklad a zastaralý výsledek se neuloží do historie. Zastaralá importovaná osobní cyklická data se rovněž nevykreslí. Ověřeno staticky; rychlé opakované odeslání a chování API čekají na závěrečnou QA.

**Dílčí oprava 17. 10.:** tarotový výklad na `/tarot.html` zamyká další spuštění synchronně ještě před kontrolou denní ukázky; rozestřené karty tak nemohou překrýt jiný právě probíhající výklad ani opakovaně odečíst ukázku při rychlém klikání. Zastaralý AI souhrn má generační kontrolu, při novém tahu se jeho požadavek ruší a pozdní výsledek nemění aktuální obsah ani ovládání oblíbených výkladů. Zdroj a build jsou staticky ověřené; souběžné klikání, abort API a uložení zůstávají na závěrečnou QA.

**Dílčí oprava 17. 10.:** Křišťálová koule na resetu zneplatní a zruší právě probíhající požadavek, vyčistí výsledek i kontext předchozích otázek, ukončí stav načítání a umožní položit novou otázku. Kontroly generace po čekání na CSRF a odpověď brání starému výsledku, chybě nebo redirectu změnit nový stav. Zdroj a sestavený modul jsou staticky ověřené; reset během API/ukládání a nová otázka čekají na závěrečnou QA.

**Dílčí oprava 17. 10.:** astrokartografie během výpočtu zamkne samotný submit handler i všechna pole, takže Enter ani rychlé opakované odeslání nespustí souběžné placené výpočty nad sdíleným výsledkem. Původní povolení polí se obnoví v `finally` po výsledku i chybě. `astro-mapa.html` načítá verzi `20261017-submit-lock`; souběžné odeslání, chybové odpovědi a profilové automatické doplnění čekají na závěrečnou QA.

**Dílčí oprava 17. 10.:** stejný souběh byl odstraněn v partnerské shodě a hlavním výpočtu natální karty. Zámek se nastaví synchronně před prvním `await`; formulář při běhu oznámí `aria-busy` a v `finally` obnoví původní disabled stavy i původní hodnotu `aria-busy`. Stránky používají `20261017-submit-lock`. Read-only kontrola pomocníka `gpt-5.6-luna` potvrdila obnovení formuláře i při chybě. Výsledky, opakovaný Enter a API chyby zůstávají na závěrečnou QA.

**Dílčí oprava 17. 10.:** denní tah runy má logický zámek ještě před 1,5sekundovou animací; dvojklik na kámen ani tlačítko tak nemůže vytáhnout a uložit jinou runu souběžně. Během tahu je stav oznámen přes `aria-busy`; při chybě se zámek uvolní a tlačítko vrátí. Selhání `localStorage` už neschová vytažený symbol ani výsledek. `runy.html` načítá build `20261017-draw-lock`. Read-only audit `gpt-5.6-luna` nenašel další souběžný požadavek v placeném výkladu. Skutečný průběh animace a ukládání zůstává na závěrečnou QA.

**Dílčí oprava 17. 10.:** Šamanské kolo blokuje opakovaný submit před prvním čekáním a každá odpověď kontroluje generaci před zobrazením i uložením oblíbeného výkladu. Reset zneplatní starou odpověď; pokud už POST běží, klient ho nepovažuje za zrušený a drží nové odeslání zamčené, dokud požadavek a případné uložení neskončí. Stav formuláře je oznámen a vysvětlen. `shamansko-kolo.html` načítá `20261017-request-guard`. Skutečný souběh, reset během API a profilové uložení čekají na závěrečnou QA.

**Dílčí oprava 17. 10.:** hluboký andělský výklad dostal samostatnou skrytou pro zrakové účely stavovou oblast, která oznamuje načítání, připravený výsledek i chybu bez toho, aby čtečka nahlas přečetla celý dlouhý výklad. Tlačítko současně hlásí `aria-busy`; při chybě se odemkne pro opakování. Test zpožděné odpovědi je připraven, ale běh aplikace zůstává na závěrečnou QA. Zdroj i dist jsou staticky ověřené; stránka používá `20261017-deep-status`.

**Dílčí oprava 17. 10.:** Hvězdný průvodce nyní nejdřív načte historii, než dovolí odeslat novou otázku. Během čekání vstup zůstává upravitelný, tlačítko je zamčené a stav je oznámen; po chybě se zobrazí možnost pokračovat v novém chatu bez ztráty napsaného textu. Připravená E2E pokrývá opožděnou historii, správné pořadí zpráv i chybu historie. Samostatný read-only review v přesném release kandidátu nezjistil další problém; interakční testy zůstávají na závěrečnou QA. Zdroj, dist a cache token `20261017-history-order` jsou sjednocené.

### W07 · P2 · Mobil, klávesnice a klidný pohyb

**Dílčí přijetí 17. 10.:** profil/přihlášení prošly uvedenými stavy při 320/390 px, nastavení navíc při 768 px. Detail má jediné mobilní rolování a 44px zpětnou vazbu; menu a modal vracejí fokus. [Přesná matice, snímky a hranice](release-prep-2026-10-15/profile-auth-mobile-qa.md). Ostatní rodiny stránek a zvětšený text stále patří do W07/W13.

**Zdrojová přístupnost 18. 10.:** směry a živly v hero šamanského kola jsou nyní dostupným textem pro asistivní technologie; skryté zůstávají jen dekorativní SVG. Změna neuzavírá mobilní ani klávesnicové přijetí této stránky.

**Další dílčí přijetí 17. 10.:** rozcestník, týdenní a měsíční horoskop i detail Berana byly prohlédnuty v lokálním prohlížeči. Kontrolované šířky: 320, 390, 768 a 1280 px podle stránky. Přepínání horizontu, návaznost týdenní/měsíční CTA, velikost ilustrací a klávesnicový odkaz na obsah mají doložené snímky. [Rozsah a limity přijímací kontroly](release-prep-2026-10-15/horoscope-mobile-qa.md). Nejde o vizuální přijetí všech dvanácti detailů ani všech mobilních rodin.

**Zdrojový audit omezeného pohybu 19. 10.:** v aktivních JS zdrojích (bez `dist` a `vendor`) nebylo nalezeno přímé `behavior: smooth` bez volby podle omezeného pohybu. Čtyři CSS deklarace plynulého rolování jsou v průvodci, osobní mapě, ročním horoskopu a partnerském výkladu; společný základ i tři samostatné šablony mají override `scroll-behavior: auto` pro `prefers-reduced-motion`. Ošetření plynulého rolování je tak doložené ve zdroji, jeho browserové přijetí a ostatní body W07 zůstávají otevřené.

**Dílčí W07 · čitelnost formuláře Šamanského kola · 21. 10.:** podnadpis, popisky polí a drobný stavový/vysvětlující text byly zesvětleny na existující neutrální text Atlasu; vysvětlující text má navíc větší písmo a pohodlnější řádkování. Samostatná stránka načítá novou revizi CSS. Vizuální, mobilní a klávesnicové přijetí zůstává v závěrečné QA; [checkpoint](release-prep-2026-10-15/shaman-wheel-form-contrast-2026-10-21.md). W07 zůstává otevřené.

**Dílčí W07 · dotykové cíle sdílení Šamanského kola · 21. 10.:** odkazy a tlačítka sdílení mají zaručenou minimální plochu 44 × 44 px; Atlas už jim dává viditelný fokus a ovládací prvky mají textové popisky. Závěrečné mobilní přijetí zůstává otevřené; [checkpoint](release-prep-2026-10-15/shaman-wheel-share-targets-2026-10-21.md).

- [ ] Ověřit mobilní menu, formuláře, výsledek, modal, patičku a cookie lištu při 320/390 px a rozumném zvětšení textu; tablet a desktop podle breakpointů konkrétního vzoru.
- [ ] Přibližně 44px dotykové plochy, viditelný fokus a popisky ikon; obsah nesmí zakrývat pevná hlavička nebo lišty.
- [ ] Respektovat omezený pohyb i v JavaScriptu. Používat jemné a účelné přechody; informace musí být dostupná i bez animace.

**Aktualizace 17. 10.:** původní poznámka o částicích odkazovala na zastaralý řádek a její závěr už neplatí. Aktuální `js/profile/dashboard.js` kontroluje `prefers-reduced-motion` přímo v `celebrateReflection` před spuštěním animací. Tuto konkrétní větev lze považovat za zdrojově ošetřenou; W07 dál zůstává otevřené pro kontrolu zbytku webu, zejména zvětšení textu a dalších rodin.

**Dílčí W07 · Andělské karty — 18. 10.:** při `prefers-reduced-motion: reduce` se vypne otočení/pulzování/přechod výsledku i nepotřebné čekání 800 ms; výsledek se zobrazí hned. Při běžném nastavení zůstává dosavadní pohyb. Ve stejném CSS se opravily dvě neplatné hodnoty ozdobných uvozovek kolem poselství. Cílený build, lint a CSS parser prošly; Service Worker `mysticka-hvezda-b04a9326c852`, snapshot **1 822** verzí. [Důkaz a hranice](release-prep-2026-10-15/reduced-motion-angel-cards-2026-10-18.md). Společná klávesnicová, mobilní a vizuální přejímka zůstává otevřená.

## 3. Dokončení zážitku napříč službou

### W08 · P2 · Užitečný důvod vrátit se

- [x] Každá z 78 karet dne má vlastní otázku, pozorovatelný podnět a uskutečnitelný krok v `data/tarot-daily-practice.json`. Existující regrese kontroluje všech 78 různých otázek a kroků; homepage, nástroj, uložení a PNG mají doložený společný denní výsledek. [QA](release-prep-2026-10-15/qa-results.md).
- [x] Při opakovaném otevření dne zůstává karta stejná a datum je čitelné česky. `getDailyCardIndex` vychází z pražského data a aktuální distribuovaný modul obsahuje stejné časové pásmo i dlouhý český zápis data.
- [x] Návrat k poslednímu uloženému výkladu používá existující profilovou cestu PF10/PF11 a otevře konkrétní uložený záznam; karta dne nevyžaduje opakované losování ani zakoupení dalšího výkladu. [Lokální přijetí profilu](release-prep-2026-10-15/profile-refresh-return-qa.md).
- [ ] PF08 — připojení a editace vlastní poznámky u konkrétní karty — je dobrovolné rozšíření, ne release blocker. Poznámka zůstává samostatně dostupná v profilu; nákup nevyžaduje účet.
- [x] Prověřit osiřelou návštěvní sérii v `js/personalization.js`: `MH_STREAK` a navázané klikací ukládání odstraněny, protože badge nemělo žádné volání ani dalšího konzumenta. Odstraněno také jeho nepoužité CSS; samostatná denní série u Karty dne zůstává vlastní funkcí.
- [x] Dokončený denní výsledek je dostupný bez registrace a bez podmínky denní série nebo dalšího nákupu; dobrovolné uložení v profilu a další tarot jsou až následná volba.

**Kontrola W08 18. 10.:** zdroj i distribuovaný `js/dist/tarot-karta-dne.js` používají `Europe/Prague` pro klíč dne; hash klíče vybírá stejný index z nezměněného seznamu karet. Zobrazené i exportní datum používá český název měsíce. Návrat k uloženému výkladu již přijímá PF10 v lokálním profilu. Mobilní/klávesnicové přijetí denní karty a celé W08 zůstává v závěrečné QA; PF08 je oddělené volitelné rozšíření.

### W09 · P2 · Web, profil, e-mail, PDF a sdílení spolu souhlasí

- [ ] Ověřit PV04: uložení nevynechá otázku, karty, podstatný text nebo označení fallbacku. Porovnat stejné modelové zadání napříč výstupy, nikoliv různé generace.

  **Dílčí statická kontrola tarotu 20. 10.:** standardní historie zachovává i vykreslí kartu, pozici, význam, interpretaci, obrázek a souhrn. U Karty dne se ilustrace dohledá podle jména: ověřeno všech **78/78** položek a existujících souborů. Seznam i detail profilu jsou omezené na vlastníka. Testy, browser a neznámé staré formáty zůstávají otevřené dle závěrečného QA. [Checkpoint](release-prep-2026-10-15/profile-reading-tarot-fidelity-static-review-2026-10-20.md).
- [ ] Na skutečných šablonách sladit názvy produktů, logo, paletu, obrázky, typografii a tón. E-mail/PDF mají vlastní omezení a musí zůstat pohodlně čitelné.
- [ ] Dokončit exporty a náhledy sdílení, včetně dlouhého textu, diakritiky, chybějícího obrázku a stažení v podporovaném prostředí. OG náhled není záruka stejné grafiky ve výsledcích Googlu.
- [ ] PF12 ponechat jako následné prověření dobrovolného návratu k zakoupenému výkladu. Současný jednorázový nákup nevyžaduje účet.

**Dílčí oprava W09 18. 10.:** sdílený renderer nyní při omezení počtu řádků viditelně označuje vynechaný text výpustkou a přizpůsobí ji šířce řádku. Používají ho sdílecí karty andělských karet, čínského horoskopu, Minulého života, run a partnerské shody. Stejné chování mají samostatné exporty slovenské karty ANO/NE, denní tarotové karty a numerologie; dlaždice numerologie označí i dlouhý význam. Přidána cílená regrese společného rendereru. Testy nebyly spuštěny, jak je domluveno pro společný konečný průchod. Vizuální kontrola a exportní chování zůstávají na závěrečnou QA; W09 zůstává otevřené.

**Navazující sjednocení W09 19. 10.:** PNG Tarotu karta dne nyní volá stejný `drawBrandBackground` jako další výsledkové exporty; fallback bez helperu zůstává funkční podle zdrojové větve. Zdroj a cílový distribuovaný modul byly sestaveny a HTML cache token obnoven. Samotné stažení, kontrast nad malovanou vrstvou a selhání načtení helperu se ověří v závěrečné QA.

**Navazující sestavení W09 18. 10.:** celý projektový JS build proběhl úspěšně a sestavil aktuální `js/dist`; cache Service Workeru je `mysticka-hvezda-5cfd5fb9c8aa` a archiv zachovává **1 830** veřejných verzí assetů. Manifest obsahuje `share-image-canvas.js`. Exportní testy nebyly spuštěny; výpustka při diakritice, dlouhém textu a mobilním vykreslení čeká na dohodnutý závěrečný průchod. Kandidát zůstává lokální, produkce beze změny.

**Navazující CSS build 18. 10.:** `npm run build:css` úspěšně obnovil sdílené `style.v2.min.css`, `home.min.css` a `site.min.css`; cache Service Workeru je nyní `mysticka-hvezda-060532512f12`, archiv obsahuje **1 832** veřejných verzí. Společná JS/CSS distribuce je připravená pro závěrečnou QA; funkční testy a browserové přijetí se stále odkládají. Kandidát lokální, produkce beze změny.

**Dílčí oprava W04 18. 10.:** v osmi starších článcích blogu byly odstraněny dekorativní emoji pouze z metadat data, délky čtení a kategorie. Obsahové symboly uvnitř článků a samotné hodnoty metadat zůstaly. Změna je statická HTML bez změny layoutu; vizuální návaznost ověří závěrečný browserový běh.

**V11 · read-only průchod runtime/export ikon · 20. 10.:** cílený scan aktivních JS šablon, exportů a relevantních serverových služeb nenašel další dekorativní emoji k výměně. PDF ročního horoskopu používá typografické symboly sekcí (hvězda, srdce, diamant, půlměsíc); ty zůstaly jako tematické orientační značky, jejich vykreslení patří do závěrečné PDF QA. Významové znaky znamení a denních karet zůstaly beze změny. Průzkum `gpt-6-luna` (low), nezávisle zkontrolovaný hlavním agentem; plný rozsah a limity jsou v [checkpointu](release-prep-2026-10-15/horoscope-pdf-prompt-and-symbol-review-2026-10-20.md).

**Dílčí oprava W09 · zachování roku ročního PDF a vstupní kontrola fulfillmentu · 21. 10.:** roční nabídka i produktové ID určují rok 2026, ale opožděný Stripe webhook/retry mohl při fulfillmentu použít aktuální kalendářní rok. Rok se nyní odvozuje z trvalého ID objednaného produktu a předává promptu, obálce/sekcím PDF, názvu přílohy, doručovacímu e-mailu i následným e-mailům. Reconciliation předává ID produktu z uložené objednávky. Neúplné údaje či neplatné datum, e-mail nebo znamení nyní zastaví generování; webhook už tuto chybu tiše nepřeskočí. W09 zůstává otevřené do společné závěrečné QA. [Checkpoint](release-prep-2026-10-15/annual-horoscope-fixed-order-year-2026-10-21.md).

**Dílčí oprava V11 · horoskopové e-maily · 20. 10.:** nové JSON výklady se v e-mailech zobrazí s prostými textovými štítky „Afirmace“ a „Čísla štěstí“, bez platformních emoji. Historické prosté texty se vracejí beze změny. Očekávání formátovací a šablonové regrese jsou upravena; jejich běh i vykreslení v e-mailových klientech zůstávají na závěrečnou QA. [Checkpoint a rozsah](release-prep-2026-10-15/horoscope-email-symbols-2026-10-20.md). Kandidát lokální, produkce beze změny.

**Dílčí sjednocení W02 · horoskopový rozcestník · 20. 10.:** odstraněny poslední doložené fialové povrchy ze stránkového CSS: hero překryv a přihlašovací panel nyní používají navy/gold paletu Atlasu, formulářové pole má stejný tmavě modrý povrch a tlumené zlaté okraje. Obsah stránky, sazba nabídky, odkazy i formulář zůstaly beze změny. HTML používá nový CSS token; prohlížečové ověření čeká na závěrečnou QA. [Checkpoint a hranice](release-prep-2026-10-15/horoscope-hub-navy-gold-2026-10-20.md). Lokální kandidát, produkce beze změny.

**Dílčí sjednocení W02 · výběr znamení v afirmacích · 20. 10.:** aktivní i základní volba znamení nyní používá navy povrch, jemné zlaté orámování a bezpohybovou změnu zvýraznění místo fialového pozadí a poskoku. Znamení, jejich glyphy, výsledek a pořadí zůstaly stejné. [Checkpoint a hranice](release-prep-2026-10-15/affirmation-sign-picker-atlas-2026-10-20.md). Lokální kandidát, produkce beze změny.

**Dílčí oprava W02/W07 · fokus karet Tarotu dne · 20. 10.:** pozdější Atlas override už nepřepisuje zlaté pozadí a okraj karet při hoveru/fokusu. Stav dostal vyšší, stránkově omezenou specificitu; posun zůstává v původní nižší vrstvě, aby ho `prefers-reduced-motion` dál vypnul, a viditelný Atlas focus outline zůstal aktivní. [Checkpoint a kaskáda](release-prep-2026-10-15/tarot-daily-intent-focus-2026-10-20.md). Pouze lokální kandidát, produkce beze změny.

### W10 · P2 · Redakční dotažení hlasu

- [ ] Tykání a konkrétní čeština v nadpisech, formulářích, výsledcích i chybách. Odstranit interní SEO/technické popisky z návštěvnického textu.
- [ ] Prověřit celý slovník tarotu ano/ne, čínské výsledky, numerologii, bioritmy, auru a perexy označené v auditech. Přehnané jistoty a nucené motivace nahradit skutečně užitečným symbolickým podnětem.
- [ ] U členství, jednorázového výkladu a mapy zachovat odlišný rozsah, cenu a doručení. Ukázky označit a automatický vznik popsat pravdivě.
  - **Dílčí W10 · 21. 10.:** statická kontrola potvrdila soulad viditelných cen, jednorázového/předplatného režimu, automatického vzniku a e-mailového doručení se současnými route/service konfiguracemi. Odstraněny nedoložené odhady doby doručení z obou nabídek a FAQ schema. Serverová 20minutová reconciliace zůstává pouze interní prodlevou. Zbývá ověřit skutečnou Stripe částku a fyzické stránkování PDF v závěrečné QA. [Evidence](release-prep-2026-10-15/paid-offers-truth-review-2026-10-21.md). W10 zůstává otevřené.

**Dílčí oprava W10/V13 · polský a slovenský Tarot · 21. 10.:** úvody už nepřisuzují kartám znalost cesty návštěvníka. Pokyny ke konkrétní otázce a FAQPage JSON-LD mluví o vztahování symbolů k vlastní situaci, bez slibu přesnější či jistější odpovědi. U Keltského kříže je odstraněná „hluboká analýza“ a nahrazená popisem širšího pohledu. Rozsah, losování, odkazy, cena a nabídka se neměnily. Zdrojově porovnáno viditelné FAQ a JSON-LD obou jazyků; browserová a jazyková QA zůstává na společný závěrečný průchod. [Checkpoint](release-prep-2026-10-15/pl-tarot-symbolic-copy-2026-10-21.md). Kandidát lokální, produkce beze změny.

**Dílčí korektura W10/V13 · 19. 10.:** polská a slovenská stránka horoskopů i FAQ JSON-LD už netvrdí, že ascendent „často přesněji“ popisuje vnější události. Říkají, že jde o další astrologickou interpretaci a symbolický podnět, nikoli předpověď. Viditelná odpověď a FAQPage mají synchronizované znění. Současně jsou vstupní title/description/OG v obou jazycích zbavené tvrzení o přesnosti a jisté predikci. Statický zdrojový průchod potvrdil odstranění starých formulací; funkční, prohlížečové a lokalizační přijetí zůstává na závěr. [Evidence](release-prep-2026-10-15/localized-home-preview-polish-2026-10-19.md).

**Dílčí oprava 18. 10. — slovenské ÁNO/NIE:** zdrojová kontrola ukázala, že nástroj vybírá výsledek ze stávajícího váženého náhodného poolu; text otázky kategorii ani výklad neovlivňuje. Opraveno všech 30 textových variant a vysvětlení na stránce, ve viditelném FAQ, FAQ JSON-LD a sdílecím PNG, aby výsledek nepůsobil jako skutečný tarotový rozklad nebo predikce. Váhy i náhodný výběr zůstaly nedotčené. Ověření je statické; chování a vzhled zůstávají na společný závěrečný běh.

**Dílčí oprava 18. 10. — FAQ a podmínky členství:** na `faq.html` je sjednocené tykání v úvodu, relevantních odpovědích a závěrečné kontaktní výzvě; tvrzení o nedoloženém „týmu podpory“ zmizelo. Odpověď o zrušení nyní rozlišuje aktivní předplatné (obnova se zastaví, přístup trvá do konce období) a neúspěšnou platbu (předplatné končí ihned a zastaví se další pokusy), jak odpovídají endpoint `/payment/cancel` a entitlement logika. FAQPage JSON-LD bylo zastaralé, mělo šest místo sedmi otázek a nabízelo už neaktuální „prémiové balíčky“; nyní pořadím i textem odpovídá všem sedmi viditelným Q&A. Statická kontrola JSON-LD a formulářů vykání prošla; browserové přijetí zůstává na společnou závěrečnou QA. [Evidence](release-prep-2026-10-15/faq-voice-and-billing-terms-2026-10-18.md).

**Dílčí oprava 18. 10. — astro-mapa:** validační hláška pro prázdná povinná pole i výzva k přihlášení při volbě údajů z profilu nyní tykají stejně jako nadpisy a úvod stránky. Logika validace, přihlášení ani načtení profilu se neměnily; browserová a behaviorální kontrola čeká na společnou závěrečnou QA. [Evidence](release-prep-2026-10-15/astro-map-validation-voice-2026-10-18.md).

**W10 · roční horoskop v PDF · 20. 10.:** prompt už nepožaduje „co přijde“ ani rady, kdy riskovat nebo šetřit. Používá sdílený `HOROSCOPE_VOICE_CONTRACTS.cs`; výklad zůstává v šesti sekcích a stejném rozsahu, ale budoucí události, city jiných lidí a finanční/zdravotní doporučení jsou výslovně mimo výstup. Datum a znamení se nesmějí vydávat za důkaz vlastností člověka. Zdrojová změna bez spuštění testů/PDF renderu podle dohody; závěrečná kontrola čeká. [Checkpoint](release-prep-2026-10-15/horoscope-pdf-prompt-and-symbol-review-2026-10-20.md). Kandidát lokální, produkce beze změny.

**Dílčí oprava 18. 10. — Andělská pošta:** chyby načítání a odesílání i potvrzení příjmu používají tykání a popisují stav zprávy podle serverové moderace. [Evidence](release-prep-2026-10-15/angel-post-voice-2026-10-18.md). Behaviorální a vizuální přijetí zůstává v závěrečné QA.

**Dílčí korektura W10 · Slovník 11:11 · 19. 10.:** záznam už neoznačuje opakovaný čas za jisté znamení, „energetický portál“, okamžitou manifestaci ani potvrzení od strážců. Výklad ho nyní rámuje jako osobní duchovní symbol a nabízí konkrétní otázku k vlastní pozornosti. Sjednoceny jsou detail, krátký popis, SEO/OG/JSON-LD a odkaz na Andělskou poštu; text i odkaz odpovídají věcnějšímu blogovému článku 11:11. Zdroj a statický detail byly sestaveny; testy a vizuální přijetí zůstávají ve společné závěrečné QA. [Checkpoint](release-prep-2026-10-15/dictionary-1111-trust-copy-2026-10-19.md). Produkce beze změny.

**Navazující W10 · Slovník Andělská čísla · 19. 10.:** starý popis tvrdil, že opakovaná čísla jsou nevyhnutelné zprávy od duchovních průvodců a předpovídají ochranu, změny i hojnost. Náhrada označuje významy jako různé symbolické tradice a mění seznam čísel na konkrétní otázky k zamyšlení; negarantuje budoucnost ani bezpečí. Zdroj, krátký popis, SEO/OG/JSON-LD a statický detail jsou synchronizované. Syntaxe, lint, scan původních tvrzení a diff check prošly; závěrečná vizuální a aplikační QA čeká. [Checkpoint](release-prep-2026-10-15/dictionary-angel-numbers-trust-copy-2026-10-19.md). Produkce beze změny.

**Navazující W10 · hesla Synchronicita a Akášické záznamy · 19. 10.:** odstraněno tvrzení, že synchronicita dokládá zprávu zvenčí nebo je mechanismem věštění, i popis Akášických záznamů jako přesně dostupného archivu faktů. Výklady jsou pojmenované jako osobní/duchovní představy, s oddělením od ověřitelných informací; generované SEO/OG/JSON-LD texty odpovídají zdroji. Syntaxe, lint, cílený scan a diff check prošly; vizuální kontrola zůstává ve společném závěru. [Checkpoint](release-prep-2026-10-15/dictionary-synchronicity-akashic-trust-copy-2026-10-19.md). Produkce beze změny.

**Navazující W10 · výsledky čínského horoskopu · 21. 10.:** prošel jsem popisy, vztahy, práci a rok 2026 pro všech 12 znamení. U Koně jsem sjednotil dvě věty s přepnutým vykáním na tykání; cílený scan už nenašel další formální imperativy. Výpočty ani tradiční kombinace se neměnily. JS syntaxe, reprodukovatelný bundle, asset hash a diff check prošly; testy a browser QA čekají na společný závěrečný běh. [Checkpoint](release-prep-2026-10-15/chinese-horoscope-synastry-voice-2026-10-21.md). W10 zůstává otevřené, produkce beze změny.

**Navazující W10 · numerologie · 21. 10.:** dvě validační hlášky nyní tykají; sdílecí PNG nabízí téma jako námět k zamyšlení místo povinného kroku na dnešek. Zdroj i ESM bundle jsou sestavené a ověřené reprodukovatelným buildem; cache token i asset archiv odpovídají, bundle není v Service Worker precache. Testy a browser QA zůstávají na společný závěr. [Checkpoint](release-prep-2026-10-15/numerology-voice-and-share-copy-2026-10-21.md). W10 zůstává otevřené, produkce beze změny.

**Read-only kontrola W10 · biorytmy · 21. 10.:** stránka, aktivní výsledkové texty a vysvětlení konzistentně tykají a označují cykly jako matematický model bez důkazů o měření nálady, zdraví či výkonu. Ve zkontrolovaném rozsahu nebyla potřebná úprava; browserová a funkční QA zůstává na závěr. [Checkpoint](release-prep-2026-10-15/biorhythm-copy-review-2026-10-21.md). W10 zůstává otevřené.

**Navazující W10 · Tarot ANO/NE · 21. 10.:** generické imperativy u náhodné karty už nejsou prezentované jako „tvůj další krok“. Výsledek je označen jako možný podnět a připomíná, že los otázku nevyužil; stejný volitelný jazyk má modelová ukázka vztahového výkladu. Losování, kategorie a slovník zůstaly beze změny. Statická kontrola a bundle ověření prošly; browser QA čeká na závěr. [Checkpoint](release-prep-2026-10-15/tarot-yes-no-optional-prompt-2026-10-21.md). W10 zůstává otevřené, produkce beze změny.

### W11 · P2 · SK/PL a společné komponenty

- [ ] Dokončit V13 pro všech 13 lokalizovaných souborů: struktura, obrázky, UI stavy a přirozený jazyk. Zachovat fungující jazykové odkazy, canonical a hreflang.
- [ ] Přezkoumat výsledky a hlavičku načítané z JS; samotný překlad statického hero nestačí.

**Dílčí oprava W11/W10 · PL/SK natální karta · 20. 10.:** lokalizované stránky už neslibují interpretaci ani závěry o silných stránkách, které jejich výpočet poloh planet neposkytuje. Bez času narození nyní popisují orientační polohy planet a správně uvádějí, že ascendent a domy nejsou dostupné. Viditelné FAQ a FAQPage JSON-LD jsou synchronizované. Zdrojová kontrola a parsování JSON-LD prošly; dynamický výsledek a lokalizační/browser QA zůstávají na společný závěr. [Checkpoint](release-prep-2026-10-15/localized-natal-result-copy-2026-10-20.md). Lokální kandidát, produkce beze změny.

**Dílčí oprava W11 při W03 review 18. 10.:** polská a slovenská stránka `/pl/andelske-karty.html` a `/sk/andelske-karty.html` teď shodně v metadatech, viditelném textu i FAQ/JSON-LD říkají, že losování i poselství jsou zatím česky a CTA otevře českou funkci. Zbývající lokalizační přijetí dalších stránek ve W11 je otevřené; skutečný polský/slovenský nástroj tím nevznikl.

**Další dávka W11 — 18. 10.:** PL/SK tarot metadata, viditelná jazyková poznámka a FAQ/JSON-LD teď přiznávají, že samotný rozklad i výsledek jsou česky. Slovenský tarot ANO/NIE v metadata, úvodu a postupu shodně uvádí skutečných pět možností ze skriptu; související andělský odkaz upozorňuje na češtinu. Zdrojově jsem prošel všech 13 PL/SK vstupů včetně interních odkazů a jazykových URL; dynamická a vizuální přejímka zůstává na závěr. [Lokalizované funkční review](release-prep-2026-10-15/localized-functional-review-2026-10-18.md). W11 zůstává otevřené.

### W11/W02 · lokální opravy PL/SK shellu a textů · 19. října 2026

- Polské stránky Andělských karet, Křišťálové koule, Natální karty a Tarotu nyní načítají lokální fonty značky před globálními styly.
- Sdílené PL/SK menu a patička překládají i původní titulkové varianty šesti názvů. Alternativní text loga se teď lokalizuje stejnou mapou jako další texty komponent.
- Slovenský obsah sjednocuje tykání na Křišťálové kouli a Natální kartě; Tarot ÁNO/NIE už netvrdí, že se vytáhla konkrétní karta. Lokalizovaná horoskopová nabídka nemá chybné označení jazyka jako čeština.
- Cílený build components.js a horoscope.js proběhl bez varování; core.js byl znovu sestaven ze sdílených vstupů. node --check pro všechny tři bundly a statická kontrola 13 konzumentů prošly. Cache Service Workeru: mysticka-hvezda-45c21ea9779a; snapshot: 1 941 verzí.
- Browserové/klávesnicové a přístupové ověření je odložené na společný závěrečný QA průchod. Změna je pouze v lokálním kandidátovi; produkce beze změny. [Checkpoint](release-prep-2026-10-15/localized-shell-fixes-2026-10-19.md).

**Dílčí oprava W11 · sdílení lokalizovaných horoskopů · 19. 10.:** SK/PL horoskopy nyní načítají sdílecí panel až po úspěšném vykreslení skutečného výsledku. Odkaz zachovává jazykovou stránku, místní slug znamení i denní/týdenní/měsíční volbu; server mapuje všechny lokalizované slugs na společnou ilustraci znamení a generuje odpovídající lokalizovaná OG/Twitter metadata. Zavřené volby jsou také `inert` a tlačítko synchronizuje `aria-expanded`. Při úvodní výzvě, načítání, paywallu, chybě a rychlé změně znamení panel nezobrazuje zastaralý výsledek. [Checkpoint](release-prep-2026-10-15/localized-horoscope-sharing-2026-10-19.md). Klávesnicové, vizuální a crawler ověření čeká na společnou závěrečnou QA; produkce beze změny.

**Dílčí úprava V13 · 19. 10.:** title, description a OG texty polské a slovenské homepage nyní popisují symbolické nástroje bez tvrzení „profesionální astrologie“ a bez slibu, co hvězdy připravily. Stejně byly upravené metadata vstupních stránek horoskopů; odstraněna tvrzení o přesnosti a predikci. Slovenský OG obrázek měl překlep v názvu značky; opravená verze `home-sk-v2.webp` je 1200×630 WebP (138 KB), starý asset zůstal zachovaný a `og:image`/Twitter odkazují na novou cestu. Alt texty odpovídají grafice. Asset snapshot, náhled sociálního sdílení a prohlížečové přijetí patří do společné závěrečné QA; W11 zůstává otevřené. [Checkpoint](release-prep-2026-10-15/localized-home-preview-polish-2026-10-19.md).

**Dílčí korektura W10/W11 · slovenská Křišťálová koule · 19. 10.:** nabídka nyní výslovně rozlišuje jednu anonymní otázku zdarma a až tři otázky denně po bezplatné registraci. Stejné znění je v meta description, Open Graph, úvodu, FAQ i FAQPage JSON-LD. Serverový limit ani registrace se neměnily; dynamická výzva v klientovi již registraci před dalšími otázkami vyžaduje. Statické ověření a checkpoint: [rozsah a meze](release-prep-2026-10-15/sk-crystal-ball-free-quota-copy-2026-10-19.md). Browserová QA zůstává společná závěrečná.

**Dílčí korektura W11 · slovenské horoskopy · 21. 10.:** meta description, Open Graph a úvodní prázdný stav nyní důsledně tykají, stejně jako hlavní text a FAQ. Přesné věty před výběrem znamení už navíc neslibují „predpoveď“. Statické zdrojové porovnání; jazyková, vizuální a interakční QA zůstávají ve společném závěru. [Checkpoint](release-prep-2026-10-15/localized-horoscope-voice-sk-2026-10-21.md). Lokální kandidát, produkce beze změny.

**Dílčí oprava W11 · PL/SK text sdíleného footeru · 21. 10.:** nově sestavená patička obsahovala textový uzel „Provozovatel služby Mystická Hvězda. Podpora:“, který už neměl přesnou položku v překladové mapě; v lokalizovaných stránkách proto zůstal česky. Přidal jsem slovenské a polské znění, znovu sestavil `components.js` i společný `core.js` a obnovil asset verze. Kontrola sdílených odkazů nyní vrací 0 zastaralých referencí; všech 13 PL/SK stránek používá nový token. Service Worker: `mysticka-hvezda-0f9f2e95ef6b`; asset snapshot: 2 249 verzí. Diff check prošel. Funkční a vizuální kontrola patičky zůstává na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/localized-footer-contact-row-2026-10-21.md). Lokální kandidát, produkce beze změny.

## 4. Výkon, údržba a dokončení vydání

### W12 · P2 · Změřit a zlepšit skutečnou rychlost

- [x] Datovaný zdrojový rozpočet sedmi vzorů a navazující konkrétní opravy: nepoužitý Three.js na natálu, menší portréty znamení, skutečný hero preload a zrušení cosmic pozadí pro Atlas. [Evidence a meze](release-prep-2026-10-15/performance-source-audit.md).
- [x] Připojené screenshoty a browserové assety; následné zdrojové testy a build/cache/snapshot. Jde o zdrojovou zátěž, nikoli naměřené CWV.

- [x] Pořídit lokální laboratorní vzorek osmi hlavních/upravených URL v desktopovém i mobilním Chromium; zahrnuje resource bytes, první obsah, CLS a konkrétní zdroje posunů. [Metoda, výsledky a meze](release-prep-2026-10-15/performance-local-baseline-2026-10-17.md); nejde o produkční CWV.
- [x] Zopakovat CLS při nové a uložené volbě cookies na desktopu i mobilu a zaznamenat dostupný Event Timing hlavního tlačítka. Nová volba: CLS 0,0305 desktop / 0,0095–0,0097 mobil, pokaždé hlášený u cookie lišty; uložená volba 0 ve všech bězích. Laboratorní klik na kartu dne 96–160 ms, bez tvrzení o polním INP. [Metoda a evidence](release-prep-2026-10-15/performance-cookie-interaction-2026-10-17.md).
- [x] Ověřit page-level polní CWV/CrUX pro jednu reprezentativní URL: `tarot-ano-ne.html`, telefony, okno končící 17. 10. 2026; interpretaci a mez srovnání s originem uvádí [evidence](release-prep-2026-10-15/crux-field-data-2026-10-19.md). Další šablony nebyly součástí tohoto bodu.
- [x] Na vztahové nabídce doplnit responzivní 240/480w tarotové obrázky pro hero i ukázku. Prohlížeč volí zdroj podle 1×/2× hustoty; lokální podzdroje klesly z 927 991 B na 354 771 B (1×) a 630 733 B (2×). [Evidence a meze](release-prep-2026-10-15/performance-responsive-images-2026-10-17.md).
- [x] Na homepage doplnit responzivní 400/800/960w varianty hlavní lucerny a ověřit volbu 1×, 2× i 2,75×. Lokální podzdroje: původních 1 037 978 B → 781 658 B na mobilu 1× a 941 382 B na mobilu 2,75×; 2× desktop správně zachová plný soubor. [Evidence a meze](release-prep-2026-10-15/performance-home-responsive-2026-10-17.md).
- [x] Na kartě dne a jejím homepage náhledu doplnit responzivní rub 240/480/600w; u tří ilustrací denní karty ověřit hustotu 1× až 2,75×. Mobilní 1× ušetří 143 663 B proti základu, 2,75× nově volí 480w Slunce a snižuje přenos o 113 362 B proti předchozí variantě. Po vytažení zůstává plný obrázek skutečné karty. [Evidence a meze](release-prep-2026-10-15/performance-daily-card-responsive-2026-10-17.md).
- [x] Na tarotu ano/ne zmenšit rub pěti zakrytých karet podle viewportu a hustoty. Mobilní profil používá 240w, desktop 2×/3× 480w; proti původním 140 798 B se mobilní obrázky karet celkem snížily o 127 763 B. Šest místních Chromium profilů po výběru ověřilo zobrazení plné tažené karty. [Evidence a meze](release-prep-2026-10-15/performance-yes-no-responsive-2026-10-17.md).
- [x] Na natální kartě a šamanském kole doplnit 800w pozadí pro mobilní 1×. Prohlížeč zachovává plný originál pro vysokou hustotu i desktop; dva mobilní hero obrázky přenesly dohromady o 187 668 B méně. [Evidence a meze](release-prep-2026-10-15/performance-atlas-hero-responsive-2026-10-17.md).
- [x] Na týdenním a měsíčním horoskopu přidat 480/800w hero varianty podle skutečné šířky. Osm profilů ověřilo obě stránky při 1×, 2× a 2,75×; mobilní 1× ušetří 109 064 B na každé stránce a mobilní 2,75× ušetří 76 706 B. [Evidence a meze](release-prep-2026-10-15/performance-horoscope-cluster-responsive-2026-10-17.md).
- [x] Na horoskopovém rozcestníku vybrat 800w hero pro mobilní 1× a sladit ho s odpovídajícím preloadem. Pět profilů ověřilo výběr bez dvojího stažení; hero přenese o 159 746 B méně. [Evidence a meze](release-prep-2026-10-15/performance-horoscope-hub-responsive-2026-10-17.md).
- [x] Na 12 detailních stránkách znamení vyměnit celý 12karetní sprite za kartu příslušného znamení. Mobilní kontrola všech 12 stránek ověřila správný obrázek bez načtení sprite; přenos obrázku klesl v průměru o 133 494 B (73 %). Rozcestník si zachovává celý sprite. [Evidence a meze](release-prep-2026-10-15/performance-zodiac-detail-images-2026-10-17.md).
- [x] Na horoskopovém rozcestníku dodat menší 192px sprite pro mobilní 1×. Čtyři profily ověřily správný zdroj; přenos sprite klesl o 158 052 B (86,5 %) a vysoká hustota zachovává plný obrázek. Nový soubor je v offline pre-cache. [Evidence a meze](release-prep-2026-10-15/performance-zodiac-hub-mobile-2026-10-17.md).
- [x] Doplnit na 60 stránkách blogu responzivní výběr pro 69 statických obrázků: 10 motivů `social-v1` a 6 ilustrací `tools-v1`, včetně dynamických karet. Ověřená mobilní úspora přehledu je 80,4 %; 11:11 dál používá existující 480/960px ilustrace. [Evidence a omezení](release-prep-2026-10-15/performance-blog-responsive-images-2026-10-17.md).
- [x] Na stránkách Runy, Numerologie, Aura a Biorytmy doplnit responzivní ilustrace; osm Chromium profilů potvrdilo mobilní úsporu 79,5 % a zachování plného zdroje na desktopu 1120px. [Evidence](release-prep-2026-10-15/performance-feature-page-responsive-images-2026-10-17.md).
- [x] Na rozcestníku významů tarotu přidat 240/360px varianty pro všech 78 karet do statického i dynamického rendereru. Chromem ověřených 12 karet při 1× přenese o 87,1 % méně; karta po „Načíst další“ také funguje. [Evidence](release-prep-2026-10-15/performance-tarot-meaning-hub-thumbnails-2026-10-17.md).
- [x] Na 78 detailních stránkách tarotu nabídnout 240/360px zdroje pro 234 malých souvisejících karet a upravit i generátor stránek. Chromium ověřilo výběr a vykreslení všech tří na dvou profilech. [Evidence a rozsah](release-prep-2026-10-15/performance-tarot-detail-thumbnails-2026-10-17.md).
- [ ] Stejnou kontrolu velikosti, variant, lazy načítání a priority dokončit na dalších obrazově nejtěžších stránkách. Lazy-loading nepoužívat plošně a skutečné hlavní obrázky nepřibrzdit.
  - Dílčí oprava 19. 10.: křišťálová koule měla v CZ/SK/PL `sizes="360px"`, přestože atlasový CSS renderer vykresluje obrázek až do 540 px. Všechny tři stránky nyní mají odpovídající velikostní pravidlo a variantu 600w; statický soubor je o 30,5 % menší než 800w varianta při zachování vyššího rozlišení než 480w zdroj. Browserový výběr a skutečný přenos zůstávají ve finální QA. [Evidence](release-prep-2026-10-15/crystal-ball-responsive-hero-2026-10-19.md).
  - Dílčí optimalizace 19. 10.: mobilní CSS pozadí pěti Atlas hero stránek nyní volí existující 800px ilustraci při 1× a plný zdroj při 2×. Kandidáty pro 1× jsou dohromady o 50,5 % menší; velikosti a poměry stran byly staticky ověřené. [Evidence a meze](release-prep-2026-10-15/performance-atlas-art-mobile-backgrounds-2026-10-19.md). Browserový výběr, přenos a vizuální přijetí čekají na závěrečnou QA.
  - Navazující optimalizace 19. 10.: společná textilie Tarotu na lásku a CZ/SK ANO/NE má 800×450 variantu pro mobilní 1×; o 64,5 % menší než předchozí 1600×900 optimalizovaný zdroj. Vyšší hustota si zachovává plný obrázek. [Evidence a meze](release-prep-2026-10-15/tarot-cloth-mobile-background-2026-10-19.md). Vizuální kontrola a skutečný přenos čekají na závěrečnou QA.
  - Průběžný výsledek 17. 10.: homepage, blog, Keltský kříž a výklad tří karet teď mají menší varianty tarotových ilustrací; dynamický seznam blogu je vybírá také. Je to dílčí pokrytí; další těžké stránky a reálný browserový přenos zůstávají k ověření. [Měření souborů a omezení](release-prep-2026-10-15/performance-tarot-home-blog-responsive-2026-10-17.md).
  - Další dílčí výsledek 17. 10.: 80px ikona relokace na `astro-mapa.html` teď má odpovídající 240w zdroj; 7,8 KB oproti 191 KB originálu. [Metoda a omezení](release-prep-2026-10-15/performance-astro-mapa-icon-responsive-2026-10-17.md).
  - Další dílčí výsledek 17. 10.: homepage a Osobní mapa používají 380/570/760w varianty obálky. 1× kandidát má o 73,8 % méně bajtů; originál zůstává pro vysoké hustoty. [Měření a omezení](release-prep-2026-10-15/performance-personal-map-responsive-cover-2026-10-17.md).
  - Další dílčí výsledek 17. 10.: šest ilustrací rychlé volby a tří kroků homepage má 360/600w varianty; součet 360w kandidátů je o 69,2 % menší než šest originálů, pokud se všechny načtou. Obrázky zůstávají líně načítané. [Měření a omezení](release-prep-2026-10-15/performance-home-intent-and-steps-responsive-2026-10-17.md).
  - Další dílčí výsledek 17. 10.: 14 tarotových článků nabízí 240/360/480/600w obrázek hlavní karty pro CSS šířku do 360px; součet 360w kandidátů je o 74,5 % menší než původní zdroje. Generátor článků s atlasovou grafikou nyní vytváří stejné responzivní značky. [Měření a omezení](release-prep-2026-10-15/performance-blog-tarot-feature-responsive-2026-10-17.md).
  - Další dílčí výsledek 17. 10.: 19 menších ilustrací a lokalizovaných produktových vstupů nabízí varianty odpovídající skutečné šířce. Nejmenší kandidáty mají v součtu o 91,7 % méně bajtů než zdrojové originály. Dva další obrázky bez atributu `srcset` už mají responsive `<source>` v rodičovském `<picture>`. [Rozsah a omezení](release-prep-2026-10-15/performance-supporting-and-localized-images-2026-10-17.md).
  - Další dílčí výsledek 17. 10.: ilustrace členství a dvě menší ilustrace na stránce O nás používají navíc 480w kandidáta, ze stejného ořezu jako originál. Nový soubor má o 64,5 % méně bajtů než 600w originál. [Měření a omezení](release-prep-2026-10-15/performance-pricing-about-tarot-art-2026-10-17.md).
  - Další dílčí výsledek 17. 10.: průvodci všemi čtyřmi barvami Malé arkány a Velkou arkánou pro začátečníky nabízejí 240/360/600w pro 78 náhledů při CSS velikosti 72 × 120 px. Součet všech 240w kandidátů je o 87,2 % nižší; lazy loading a zavřená sekce článku znamenají, že se nepřenáší celý soubor hned při otevření. [Měření a omezení](release-prep-2026-10-15/performance-tarot-suit-guides-responsive-2026-10-17.md).
  - Další dílčí výsledek 17. 10.: sedm rubových ikon v `tarot.html` má varianty 240/480/600w pro 60px zobrazení; 240w kandidát je o 88,9 % menší. Losovatelné karty zůstaly nedotčené. [Měření a omezení](release-prep-2026-10-15/performance-tarot-spread-icons-2026-10-17.md).
  - Další dílčí výsledek 17. 10.: slovenský a polský tarotový vstup nabízí responzivní zdroje pro tři statické karty; součet kandidátů 240w na stránku je o 87,5 % menší než originály. [Měření a omezení](release-prep-2026-10-15/performance-localized-tarot-entry-2026-10-17.md).
    - Stejná 240w varianta je nasazená i na tarotové ikoně jejich homepage; 84px zobrazení má kandidát o 88,9 % menší než originál.
  - Další dílčí výsledek 17. 10.: hlavní ilustrace všech 78 významů karet nyní nabízí 240/360/480/600w; varianty 480w jsou vytvořené ze stejného originálu, aby mobilní 2× nemusel přeskakovat na plný zdroj. Generátor i statické stránky mají shodnou šablonu. [Měření a omezení](release-prep-2026-10-15/performance-tarot-detail-hero-responsive-2026-10-17.md).
  - Široký statický sken mimo dokumentační/build složky ověřil 1 897 lokálních `srcset` kandidátů na 187 stránkách; nechybí soubor ani nesouhlasí deklarovaná šířka. Bez `srcset` zůstalo šest 1 820B logotypů. Výběr zdroje a přenos v browseru jsou pro závěrečnou QA. [Evidence skenu](release-prep-2026-10-15/qa-evidence/responsive-image-source-scan-2026-10-17.json).
- [ ] Prověřit zbytečně načítané knihovny a staré bloky, vlastnictví bundle a font fallback. `font-display: optional` v lokálních fontech není automatická chyba; porovnat skutečné chování a české znaky před změnou.
  - Dílčí úprava 18. 10.: z 27 veřejných stránek načítajících DOMPurify jej 16 nepoužívalo a CDN tag byl odstraněn; na zbývajících 11 stránkách zůstává s `defer`. V rituálu je opraven fallback při výpadku CDN; JS build doběhl a skript má novou query verzi. Přínos a chyby sítě ověří společná browser QA. [Mapa konzumentů a hranice](release-prep-2026-10-15/performance-dompurify-inventory-2026-10-18.md).
  - Dílčí úprava 18. 10.: stejný parser-blocking vzor Lucide byl odstraněn na pěti stránkách. Dvě z nich nyní také volají existující inicializátor, takže jejich statické ikony se vykreslí. [Evidence a omezení](release-prep-2026-10-15/performance-lucide-defer-2026-10-18.md).
- [x] Po změně veřejných assetů použít existující cache hash a snapshot workflow a ověřit upgrade s již otevřenou starší stránkou. Lokální Chromium ověřilo, že stará stránka i její načtená ilustrace přežijí aktivaci workeru, stará URL zůstane online dostupná a nesouvisející cache se zachová; aktuální manifest přednačítá zmenšený sprite. [QA důkaz](release-prep-2026-10-15/qa-results.md).

  - Další dílčí výsledek 17. 10.: tři rubové karty na `tarot-zdarma.html` sdílejí responzivní zdroj 240/480/600w; otočení dál odstraní `srcset` a použije plnou lícovou kartu. Cílový JS build a statické kontroly prošly; E2E otočení zůstává pro závěrečnou QA. [Evidence a omezení](release-prep-2026-10-15/performance-tarot-demo-back-responsive-2026-10-17.md).
  - Další dílčí výsledek 17. 10.: slovenská a polská homepage znovupoužívají varianty 400/800/960/1200w lucerny podle rozměrů české homepage. 400w zdroj má o 86,6 % méně bajtů než originál. Browserový výběr zdroje nebyl v této dávce změřen. [Evidence a omezení](release-prep-2026-10-15/performance-localized-home-hero-responsive-2026-10-17.md).

  - Další dílčí výsledek 17. 10.: hlavní obrázek Křišťálové koule při zobrazení 360px nabízí existující 480/800/1200w varianty a zachovává eager načítání i vysokou prioritu. Kandidát 480w je o 84,7 % menší než originál. [Evidence a omezení](release-prep-2026-10-15/performance-crystal-ball-hero-responsive-2026-10-17.md).
  - Navazující kontrola 18. 10.: profilový graf po dělení má 94 579 B (78 892 B entry + 15 687 B sdílený chunk); modal 20 952 B zůstává on-demand. Proti monolitu 107 983 B jde o 12,4 % méně dat na disku při prvním importu; nejde o HTTP přenos. Jediný soubor nad 100 KiB v `js/dist` je Three.js vendor 603 445 B; aktuální stránky ho nenačítají, ale URL existují v asset history a smoke test je filtruje. Před úklidem ověřit kompatibilitu se starými klienty. [Aktualizovaný audit](release-prep-2026-10-15/performance-font-and-bundle-review-2026-10-17.md).
  - Česká diakritika je v lokálních Latin/Latin Extended fontech staticky přítomná, ale `font-display: optional`, první vykreslení, fallback a posun layoutu dál čekají na browser QA. W12 proto zůstává otevřené.
  - Další dílčí výsledek 17. 10.: `biorytmy.html` odkládá lokální grafovou knihovnu 204 948 B až po platné odeslání data; číselný výsledek se vykreslí i při chybě načtení grafu. Dynamické načtení je deduplikované a lze ho opakovat po chybě. [Evidence a omezení](release-prep-2026-10-15/performance-biorhythm-chart-on-demand-2026-10-17.md). Funkční ověření je ve společné závěrečné QA.

  - Další dílčí výsledek 17. 10.: tři dekorativní rubové karty u výkladu tří karet nabízejí existující 240/480/600w varianty při CSS šířce 84px; zachoval se prázdný alt a lazy loading. Kandidát 240w je o 88,9 % menší než originál. [Evidence a omezení](release-prep-2026-10-15/performance-tarot-three-spread-illustrations-2026-10-17.md).

  - Další dílčí výsledek 18. 10.: rub Andělských karet nyní vybírá existující 240/480/600w soubor podle hustoty; osmi možným lícům přibyly 360w varianty pro kartu zobrazenou na šířku 250–280 px. Jeden líc při 1× ušetří 96–132 kB (souhrn všech osmi variant klesl o 69,4 %). Nové i stávající menší zdroje jsou v offline precache; jeho obrazový rozpočet se zvýšil o 520 320 B. [Metoda a meze](release-prep-2026-10-15/performance-angel-card-backgrounds-2026-10-18.md). Výběr podle DPI a offline stav ověří závěrečná browser QA.

  - Další dílčí výsledek 17. 10.: hero astrolábu na `o-nas.html` nabízí 480/800/1200w varianty pro šířku do 540px; mobilní 1× kandidát je o 84,4 % menší než originál a vysoká priorita načítání zůstala zachována. [Evidence a omezení](release-prep-2026-10-15/performance-about-hero-responsive-2026-10-17.md).

  - Další dílčí výsledek 17. 10.: dvě zbývající ikony Astrolábu a Měsíční krajiny na `astro-mapa.html` používají 480/800/1200w varianty pro 80px zobrazení. Proti originálům jsou mobilní kandidáti o 84,4 % a 83,9 % menší; třetí ikona už byla responzivní. [Evidence a omezení](release-prep-2026-10-15/performance-astro-map-service-icons-2026-10-17.md).

  - Další dílčí výsledek 17. 10.: čtyři karty v náhledu balíčku na `tarot.html` používají 240/480/600w ruby při 150px zobrazení; akce karet a lazy loading zůstaly beze změny. Kandidát 240w je o 88,9 % menší než originál. [Evidence a omezení](release-prep-2026-10-15/performance-tarot-deck-preview-2026-10-17.md).

  - Další dílčí výsledek 17. 10.: interaktivní mapa na `astro-mapa.html` má 400/800/1024w zdroje; 400w mapa je o 72,6 % menší než originál a byla vizuálně zkontrolována. [Evidence a omezení](release-prep-2026-10-15/performance-astro-map-world-map-responsive-2026-10-17.md).

  - Další dílčí výsledek 17. 10.: tři líně načítané ilustrace příběhových karet na `tarot-laska.html` mají 360/600/720w varianty; pokud se načtou všechny, 360w kandidáty mají souhrnně o 72,3 % méně bajtů. Vizuálně zkontrolována jedna varianta. [Evidence a omezení](release-prep-2026-10-15/performance-love-tarot-story-art-responsive-2026-10-17.md).

  - Další dílčí výsledek 17. 10.: Osobní mapa nabízí responzivní obrázky dvou vzorových stran a přehledového listu 20 stran; kandidáty 380/416w jsou o 71–74 % menší než originály. Vizuálně zkontrolována stránka i kontaktní přehled. [Evidence a omezení](release-prep-2026-10-15/performance-personal-map-previews-responsive-2026-10-17.md).

### W13 · P1 pro vydání · Přesné přijetí a dohledatelný stav

- [x] Každá ze 166 funkčních URL má v [ledgeru](release-prep-2026-10-15/page-ledger.json) zdrojově zkontrolovanou rodinu (`familyReviewed`), aktuální stav a odkaz na důkaz počátečního načtení. [Rodinné review](release-prep-2026-10-15/functional-page-family-review-2026-10-18.md) popisuje přesuny a výjimky. Úvodní načtení není konečné přijetí každé funkce; to zůstává v následujícím bodu.
- [ ] Každý změněný vzor ověřit v běžném i relevantním chybovém/prázdném stavu. Opravy platby, oprávnění a enginu mají vlastní cílenou regresi; samotná barva nepotřebuje novou sadu testů.
- [ ] Předat místní vizuální přehled: desktop, mobil, vstup a výsledek. U známých zbývajících vad uvést stav, ne označit celé vydání za perfektní podle screenshotu.
- [ ] Produkci měnit po výslovném pokynu k vydání; následně ověřit konkrétní commit a zasažené cesty. Tato dokumentace není nasazení.

## Nejbližší ohraničený krok

**Aktualizace stavu kandidáta · 20. 10. 2026:** po předchozím souhrnu 18. 10. pokračovaly lokální opravy v navigaci, ikonách, stylových vrstvách, profilech, datových formulářích, e-mailových šablonách, sdílecích výstupech i textové důvěryhodnosti. Každá má datumovaný rozsah v následujících dílčích záznamech a [QA výsledcích](release-prep-2026-10-15/qa-results.md); žádný z nich sám o sobě neuzavírá širší oblast W01–W13. Dnešní kontrola například zpřesnila výsledek lokalizované natální karty a ukázkový obsah ručního newsletteru. Aplikační testy ani souhrnná browserová QA nebyly spuštěny, protože Pavel požádal spojit je až do závěrečného běhu. Změny zůstávají v lokálním kandidátu; produkce nebyla nasazena.

**Závěrečný krok:** až se dokončí zdrojové opravy a uzavře jejich evidence, proběhne jeden společný běh testů a cílená browserová kontrola dotčených stránek včetně prázdného, chybového a běžného stavu. Každý checkpoint zde výslovně uvádí, co zatím bylo ověřeno jen staticky. Samotný úspěšný build ani kontrola zdrojů není výsledná přejímka.

**Co zůstává otevřené:** plná závěrečná vizuální a funkční přejímka, otevřené checkboxy W01–W13 a oddělená ověření R01–R04, včetně živé AI a testovací platební/doručovací cesty. Bez těchto kroků nelze redesign označit za připravený k vydání. Výkonové evidence a jejich limity zůstávají v jednotlivých [QA a měřicích záznamech](release-prep-2026-10-15/qa-results.md); produkce se nezměnila.

### W07 follow-up · omezený pohyb na Tarotu karta dne · 18. října 2026

- Stránka `/tarot-karta-dne.html` při `prefers-reduced-motion: reduce` nyní vypíná zvednutí karty po otočení, přechody jejího obrázku a posun intent karet při hoveru/fokusu. Výsledek a ovládání zůstávají stejné; upravené je pouze stránkové CSS.
- Ověřeno: CleanCSS parsuje soubor bez chyb, HTML odkazuje na `20261018-reduced-motion`, `git diff --check` prošel. Service Worker používá `mysticka-hvezda-4ae3a2e4b9b9`, asset archiv uchovává 1 692 veřejných verzí. Prohlížečové přijetí zůstává v dohodnutém závěrečném QA; produkce beze změny.

### W02 · výsledek read-only kontroly CSS duplicit · 18. října 2026

- Pomocník `gpt-5.6-luna` (low, read-only) našel v `css/atlas-web.css` redundantní `html:has(> body.atlas-page) { background: #0b1929; }`; pozdější důležitější pravidlo pokrývá stejnou běžnou strukturu DOM. Odstranění by neviditelně změnilo nic a vyžadovalo revizi cache tokenu na 906 odkazech, proto zůstává jako kandidát pro další společné čištění assetů. Nic nebylo změněno ani přegenerováno kvůli tomuto nálezu.

**W02 follow-up · 19. října 2026:** pomocník `gpt-6-luna` (low, read-only) znovu prošel sdílený Atlas CSS a nenašel další bezpečný duplicitní selektor. Jediný nález je již evidovaný řádek 3 `css/atlas-web.css`, překrytý řádkem 51; plošné odstranění stále není zdůvodněné bez revize 906 odkazů. Žádný soubor nebyl v tomto auditu změněn.
### Navazující checkpoint · W06 · ochrana hlubokého andělského výkladu · 17. října 2026

- Tentýž výklad ke stejné kartě nyní během požadavku nepřijme další klik a po validním úspěchu zůstane tlačítko zamčené. Nový tah stav vynuluje; při chybě API zůstává bezpečně dostupný retry. Ochrana je pro právě otevřenou stránku; serverovou idempotenci přes opakované otevření stránky tento checkpoint nepřidává.
- Výsledek se vykreslí nezávisle na ukládání do profilu. Když `Auth.saveReading` vrátí `null` nebo selže, čtenář o výklad nepřijde, tlačítko nevyvolá druhé placené generování a stav vysvětlí, že se výsledek nepodařilo uložit do profilu. Úspěšné uložení nadále přidá akci oblíbení.
- Připravené regresní scénáře ověřují opožděný jediný API požadavek i profilový zápis a zachování textu při neúspěšném uložení. Aplikační/browserové testy jsou podle dohody odložené na závěrečnou QA. `npm run build:js`, cílený ESLint, syntaxe zdroje/buildu/specifikace a `git diff --check` prošly. Snapshot eviduje **1 270** verzí veřejných assetů; Service Worker cache je `mysticka-hvezda-59342863013f`. Produkce se nezměnila. Podrobnosti: [QA výsledky](release-prep-2026-10-15/qa-results.md).

### Navazující checkpoint · W06 · stránkování historie po změně účtu · 17. října 2026

- Pokud se uživatel změnil během načítání další stránky historie, globální zámek mohl zůstat obsazený starým requestem. `js/profile/readings.js` ho při resetu historie uvolní; starší request ve `finally` už nemůže uvolnit ani manipulovat s tlačítkem nové relace, protože ověří verzi.
- Připravený E2E scénář drží odpověď prvního účtu, přepne na druhý účet, zahájí jeho stránkování a ověří, že pozdní první odpověď nové načítání neodemkne. Test nebyl spuštěn podle dohody o společné závěrečné QA.
- `npm run build:js`, cílený ESLint, syntaxe zdroje/buildu/specifikace a `git diff --check` prošly. Produkce se nezměnila; celé W06 zůstává otevřené. [Podrobnosti v QA výsledcích](release-prep-2026-10-15/qa-results.md).

### Navazující checkpoint · W06 · soukromý deník při změně účtu · 17. října 2026

- Uložení reflexe v profilu teď po asynchronním získání CSRF tokenu ověří, že přihlášení i právě zobrazený profil patří účtu, který poznámku napsal. Požadavek nese `expectedUserId`; server jej porovnává s vlastníkem ověřené relace. Při změně účtu se poznámka neodešle a zůstane jako rozepsaná u původního účtu.
- E2E regrese pozastaví získání CSRF, přepne účet a ověří nulový počet zápisů pod druhý účet i zachování původního konceptu. Úspěšná cesta kontroluje odeslané ID. Read-only review nenalezl problém. Browserové testy jsou odložené do závěrečné QA.
- Build, syntaxe zdroje/buildu/specifikace, cílený ESLint a `git diff --check` prošly. Archiv assetů byl po chybě přímého zápisu obnoven atomickou výměnou dočasného souboru a nyní obsahuje **1 278** verzí; dashboard bundle je archivován a Service Worker používá `mysticka-hvezda-7ffd631ae38c`. Produkce se nezměnila. Celé W06 zůstává otevřené.

**Autonomní realizace přešla do jedné závěrečné QA fáze.** Doložené výsledky, opravy i hranice jsou v [QA checkpointu](release-prep-2026-10-15/qa-results.md), jednotlivé nástroje v [cestách výsledků](release-prep-2026-10-15/tool-results-qa.md). Načtení všech 166 funkčních URL při dvou šířkách je doložené; všech sedm kvízů a hlavní výsledkové rodiny navíc prošly interakcí. Nově rituální zápisky skutečně navazují do serverového deníku profilu, včetně chyby a retry. Slovenský i polský horoskop prošel všemi třemi obdobími; doplněné Auth loadery na 11 stránkách pokrývá regrese všech 13 lokalizovaných vstupů. Nejbližší krok: zbývající přístupové/chybové výjimky, W12 výkon, kvalita živých AI výstupů a uzavření přijímacího seznamu; následně konkrétní vydání. Checkboxy celého seznamu se neodškrtávají hromadně podle několika úspěšných scénářů.

PF01 byl před touto dávkou místně ověřen: 11/11 cílených regresí a skutečný profil nad syntetickou databází; [původní checkpoint](profile-unification-2026-10-14/pf01/README.md). Nyní navazující změny vyžadují znovu dotčenou závěrečnou regresi. Produkce se neměnila.

**Navazující W06 checkpoint 17. 10.:** Šamanské kolo zamyká souběžné odeslání a po resetu ignoruje zastaralou odpověď; biorytmový graf ignoruje starší vykreslení, které se vrátí až po načtení Chart.js. Stejná ochrana resetu byla přenesena do slovenského ANO/NE, kde 800ms callback mohl znovu otevřít smazaný výsledek. Ověření znovu potvrdilo již hotové zrušení timeoutu při resetu českého ANO/NE i SVG chybových/úspěšných stavů Andělské pošty. Přidaly se cache verze dotčených tarotových modulů. Build, cílená syntaxe/lint a diff check prošly; snapshot assetů při dvou pokusech selhal systémovým `UNKNOWN` při zápisu `server/config/asset-history.json`, proto se jeho archivní počet v tomto checkpointu neaktualizuje. Prohlížečové a aplikační ověření zůstává odložené do společné závěrečné QA; produkce se nezměnila. Podrobnosti: [QA výsledky](release-prep-2026-10-15/qa-results.md).

**Navazující W06 checkpoint 17. 10.:** placená Osobní mapa dostala retry-safe Checkout. První odeslání vytvoří stabilní flow ID a deterministické UUID objednávky; shodné retry najde tutéž privátní objednávku a Stripe session, konfliktní formulář nezaloží druhou platbu. Server ověřuje identitu uložené relace, dokončenou/čekající platbu i výsledek expirace. Klient zamyká submit, po síťové chybě ponechá identitu pokusu; novou povolí až po potvrzené expiraci. Flow ID žije 25 hodin od prvního odeslání nad standardní 24hodinovou expirací Stripe, citlivý návrh nejvýše tři hodiny. Primární klíč tabulky už umožňuje závodní deduplikaci bez migrace. Build JS, syntaxe, cílený ESLint a diff check prošly; cílené serverové testy jsou připravené, ale zůstávají odložené na závěrečný společný běh. Produkce se nezměnila. Podrobnosti: [QA výsledky](release-prep-2026-10-15/qa-results.md).

**Navazující W06 checkpoint 17. 10.:** Andělská karta dne používá místní kalendářní datum namísto UTC a zvládne i zakázané nebo zaplněné `localStorage`; při nemožnosti zapamatovat výsledek ukáže přístupné upozornění. HTML načítá novou verzi skriptu a CSS. Připravené Playwright pokrytí dvou selhání úložiště zůstává odložené na závěrečnou společnou QA. Zdroj, build, syntaxe, cílený ESLint a diff check prošly; produkce se nezměnila. Podrobnosti: [QA výsledky](release-prep-2026-10-15/qa-results.md).

## Co je již doloženě hotové

**Další dávka 16. 10. · výsledek a profil:** nové tarotové záznamy uchovávají plné původní významy, shodné ilustrace a souhrn; retry souhrnu nemění karty. Tarot, natál a shoda přenášejí fallback příznak. Numerologie v profilu ukazuje čtyři uložené hodnoty, starší formát skóre shody má správný renderer. Cíleně **45/45 testů** a skutečné lokální porovnání tarotu, natálu a numerologie. Sedm dříve otevřených profilových checkboxů je nyní podloženě uzavřeno; nejsou vykazované jako sedm nových implementací. [Evidence a hranice PV04](release-prep-2026-10-15/reading-fidelity-qa.md).

**Navazující dávka 16. 10.:** runy zachovají otázku při chybě a nově ji obnoví po návratu z přihlašovací/členské brány. Náhradní text má označení na nástroji i v uložené historii. Shoda má přístupné chyby a ověřené opakování. Horoskopy mají čitelnější desktopovou mřížku a lehčí portréty, natál o 606 kB méně přímého JS. [Aktuální lokální checkpoint a zbývající hranice](release-prep-2026-10-15/qa-results.md). Další krok: skutečný mobil/tablet posledního vzoru a živé AI vzorky; celý TODO ani vydání nejsou označené za hotové.

Zůstává uzavřená předchozí dávka: základní přesun profilových záložek, serverové stránkování historie, upravená patička, dávkování blogu/atlasu, méně CTA na 78 detailech, SVG fáze Měsíce a odstranění mlhoviny z datované šablony. Detaily a omezení jsou v [implementačním reportu](profile-unification-2026-10-14/README.md). Navazující chyby mají vlastní PF/W ID; nevrací celý dřívější úkol automaticky do stavu „nic hotovo“.

**Metoda posledního doplnění:** statické ověření zdrojů a generátoru plus jeden read-only audit pomocníka `gpt-5.6-luna`. Upraven byl generátor Atlas grafiky, čtyři výřezy a šest obrázkových atributů na polské/slovenské homepage; nebyly spuštěné aplikační testy, znovu vizuálně procházeny všechny stránky ani načítaná osobní či produkční data. Změny jsou jen v lokálním kandidátu. Tento plán negarantuje návštěvnost, prodeje ani úplnou přístupnost.

### Navazující checkpoint · přístupové hrany přihlášení · 17. října 2026

- Lokální kandidát sanitizuje návratové adresy na same-origin cestu v klientovi/serveru i při čtení staršího checkout kontextu; POST formuláře obnovy a resetu hesla mají stejnou validaci limitu, serverové validační chyby vracejí 400 a úspěšný reset zobrazuje potvrzení bez okamžitého odchodu ze stránky.
- Build klientských bundleů proběhl, 840 odkazů na společný `core.js` a 55 přímých `auth-client.js` odkazů mají sjednocenou cache verzi. Read-only kontrola asset verzí hlásí nula zastaralých odkazů; service worker cache je `mysticka-hvezda-9c56bb2dd811`, snapshot eviduje 1 189 veřejných asset verzí.
- Syntaxe dotčených zdrojů/bundleů a `git diff --check` prošly. Přidané regresní případy, kompletní testovací sadu, živé e-mailové doručení a skutečný reset účtu ověřím až v závěrečné QA. Změny jsou pouze v lokálním kandidátu; produkce se nezměnila.

### Navazující checkpoint · profilový detail výkladu · 17. října 2026

- Modal detailu výkladu se teď dělí do on-demand chunku. Počáteční nekomprimovaný graf má 89 895 B proti dřívějším 107 983 B (−16,7 %); detail má samostatných 19 132 B. Síťový přenos, offline klik a interakce ještě nejsou ověřené.
- Build správně zahrnuje aktuální hashované chunky do Service Worker manifestu; `mysticka-hvezda-468cd64ad4c7`, snapshot eviduje 1 193 veřejných verzí. Build, syntaxe a whitespace kontrola jsou doloženy v [QA výsledcích](release-prep-2026-10-15/qa-results.md) a [měření](release-prep-2026-10-15/performance-profile-reading-modal-2026-10-17.md). Regresní testy a vizuální/funkční přijetí zůstávají odložené do závěrečné QA; produkce se nezměnila.
- Cache generátor teď čte jen aktuální importy z entry; statická kontrola ověřila přesnou shodu dvou importů s manifestem, i kdyby v output adresáři zůstala stará kopie chunku.

### Navazující checkpoint · W02 · vizuální přehled komponent · 17. října 2026

- Už existující [`components.html`](release-prep-2026-10-15/components.html) pokrývá akce, disabled/loading, formulář, chybu, úspěch, výsledek, ikony i prázdný stav a používá atlasové CSS; novou duplicitní ukázku jsem odstranil. Prohlédl jsem zdroj, ne browserový render.
- Lokální serveru se nepodařilo otevřít soket a bezpečnostní politika browseru zamítla přímé `file:` URL. Neobcházel jsem omezení. W02 vizuální přijetí zůstává otevřené; aplikační testy i produkce beze změny.

### Navazující checkpoint · W01 · výchozí stav profilu v homepage hlavičce · 17. října 2026

- Oba profilové odkazy v hardcoded hlavičce `index.html` teď mají `hidden`, stejně jako ve společné hlavičce. Auth klient je odkryje až po potvrzeném přihlášení; statická kontrola ověřila unikátní ID a obě větve přepínání.
- Source-only porovnání našlo shodných 37/37 názvů a cílových cest v navigaci a stejných pět názvů skupin; osobní mapa si zachovala původní tracking query na homepage.
- Browserové přihlášení/odhlášení, mobilní navigace a klávesnice zůstávají pro závěrečnou QA. Celé W01 není uzavřené; produkce se nezměnila. [Důkaz a hranice](release-prep-2026-10-15/qa-results.md).

### Navazující checkpoint · W06 · čekající výklad při registraci · 17. října 2026

- Výsledek tarot ANO/NE se při přechodu k registraci ukládá do `sessionStorage`, pokud prohlížeč nedovolí `localStorage`; profil umí po návratu načíst obě varianty a po potvrzeném uložení odstranit dostupné kopie. Pokud selžou obě úložiště, uživatel zůstane u výsledku místo ztráty obsahu po přesměrování. Ukládací tlačítko v CZ/SK se zamkne ještě před čekáním na analytiku, blokuje reset a zapisuje snímek původního výsledku, aby dvojklik ani nový tah nevytvořily chybný či duplicitní záznam; HTML načítá nové cache tokeny. Čtyři regresní scénáře jsou připravené, ale odložené do závěrečné QA. Build, cílená syntaxe/ESLint a `git diff --check` prošly. Celé W06 zůstává otevřené; produkce se nezměnila. [Detail v QA checkpointu](release-prep-2026-10-15/qa-results.md).

### Navazující checkpoint · W06 · opakovaný POST výkladu · 17. října 2026

- Ověřené produkční schéma má UUID primární klíč `readings.id`. Přímé i čekající uložení tarot ANO/NE proto používá stabilní UUID pokusu; profil jej doplní i starším položkám před opakováním. Duplicitní request vrací původní řádek pouze stejnému uživateli a pro stejný typ výkladu.
- Připravené regresní scénáře pokrývají retry po ztrátě odpovědi v profilu i opakovaný serverový POST. Testy zůstávají odložené do společné závěrečné QA. Build, statická syntaxe/lint a diff check prošly; produkce se nezměnila. [Evidence a omezení](release-prep-2026-10-15/qa-results.md).

**Navazující W06 checkpoint 17. 10.:** po read-only review se čekající i přímý tarotový výklad v CZ/SK znovu váže na účet při akci, po čekání kontroluje aktuální relaci a posílá `expectedUserId`; server jej ověřuje vůči autentizovanému uživateli ještě před zápisem. Profil po úspěchu odstraňuje pouze tutéž čekající položku podle stabilního `requestId`, takže starší odpověď nesmaže novější výklad z další karty. Přidané testy pro retry, účetní nesoulad, přepnutí během CSRF a souběžnou výměnu položky čekají na společnou závěrečnou QA. Build, syntaxe, cílený lint, asset tokeny a whitespace kontrola prošly; Service Worker cache `mysticka-hvezda-a2b1e8695823`. Produkce se nezměnila. [Evidence](release-prep-2026-10-15/qa-results.md).

### Navazující checkpoint · W06 · přístupný náhled minulého života · 17. října 2026

- Náhled před odemčením i návrat z hotového výsledku teď předají fokus na aktuální nadpis nebo první pole. Připravené regresní kontroly ověřují také Enter, návrat formuláře, obnovu údajů a chybové stavy; aplikační/browserové testy zůstávají odložené do společné závěrečné QA.
- `minuly-zivot.html` načítá nový token `20261017-focus-flow` pro CSS i JS. Build JS, syntaxe zdroje/buildu/specifikace, cílený ESLint a `git diff --check` prošly; snapshot eviduje 1 268 veřejných verzí. Změny jsou pouze v lokálním kandidátu.
- CSRF preflight se po 15 sekundách bezpečně přeruší ještě před odesláním AI POSTu; stránka obnoví formulář, zachová vstupy a jasně řekne, že výklad nebyl odeslán. E2E regrese je připravená, ale odložená do závěrečné QA. Po 60 sekundách běžícího POSTu se změní stavová zpráva; generaci klient automaticky neruší a bezpečný retry bez serverové idempotence nenabízí. Modelová služba má vlastní omezený timeout/retry; síťovou cestu a chování při ztrátě odpovědi ověří závěrečná QA. Produkce se nezměnila.

### Navazující checkpoint · W06 · zápisy profilu a členství po přepnutí účtu · 17. října 2026

- Nastavení profilu, změna hesla, avatar, zrušení/obnovení/pozastavení členství, retenční nabídky i platební portál zachovávají ID účtu při zahájení akce, po čekání na CSRF i v serverovém požadavku. Server teď odmítá nesoulad i chybějící `expectedUserId` před změnou profilu, hesla, Stripe, retenčního záznamu nebo e-mailu; starší otevřená karta tak nepoužije relaci nově přihlášeného účtu. Jediná výjimka je legacy potvrzení o pozastavení, které pouze vrací idempotentní odpověď a nic nemění ani neposílá.
- Připravené regrese ověřují chybějící i cizí ID na dotčených serverových trasách a přepnutí účtu během nastavení nebo retenčního dialogu. Opravena také očekávání payloadu portálu/obnovení členství a test změny hesla. Aplikační a browserové testy zůstávají odložené do společné závěrečné QA.
- Cílený ESLint, syntaxe všech dotčených zdrojů/bundlů/specifikací a `git diff --check` prošly. Aktuální profilový dashboard (`9dee9d7a584d1ac0`) a retention bundle (`27954a2f541d833b`) jsou v archivu; `asset-history.json` obsahuje **1 283** verzí a Service Worker cache je `mysticka-hvezda-d34958807518`. Změny zůstávají pouze v lokálním kandidátu; produkce ani osobní databáze se nezměnily.


### Navazující checkpoint · W06 · centrální uložení výkladu po přepnutí účtu · 17. října 2026

- `Auth.saveReading()` zachytí ID vlastníka před asynchronním CSRF preflightem, ověří relaci a uživatelskou cache před POSTem i po odpovědi a posílá `expectedUserId`. Route `/api/user/readings` tento údaj vyžaduje a porovnává s autentizovaným `req.user.id` před databázovým čtením i zápisem.
- Aktualizována regresní očekávání pro legitimní ukládání; přidány scénáře chybějící vazby a přepnutí účtu během CSRF čekání. Aplikační a browserové testy zůstávají odložené do společné závěrečné QA.
- `npm run build:js` proběhl. Archiv obsahuje Auth klient (`644d19328034352f`) a `core.js` (`511e23ef1eb01363`); `asset-history.json` má **1 289** verzí. Service Worker cache je `mysticka-hvezda-33bb76cf67a8`. Cache token `20261017-reading-owner` sjednocuje přímý Auth klient a core bundle; read-only kontrola hlásí nula zastaralých odkazů. Cílený ESLint, syntaxe zdrojů/bundlů/specifikací a `git diff --check` prošly. Pouze lokální kandidát; produkce ani osobní databáze se nezměnily.


### Navazující checkpoint · W06 · synchronizace účtu mezi kartami · 17. října 2026

- Storage listener v Auth klientovi nyní přebírá novou platnou identitu z jiné karty a vyvolá `auth:changed`, takže otevřený profil zahodí staré načítání a znovu načte data pod novým účtem. Událost odhlášení vyčistí lokálního uživatele bez závislosti na tom, zda už se stihl propsat stav přihlašovací cookie. Stejná cache kontrola teď zastaví uložení výkladu, pokud se mezi kartami vymění vlastník.
- Přidaný E2E scénář simuluje změnu uloženého účtu v jiné kartě a kontroluje aktualizaci identity i stavovou událost; čeká na závěrečný běh. Aplikační a browserové testy zatím nebyly spuštěny.
- Cílený ESLint, syntaxe zdroje/bundlu/specifikací a `git diff --check` prošly. Auth klient a `core.js` mají archivované hashe `ba2cc4d86aad7c08` a `6b2bb297b65f1110`; asset archiv obsahuje **1 292** verzí a Service Worker cache `mysticka-hvezda-d7841ba30bec`. Cache token `20261017-reading-owner` nemá zastaralé reference. Lokální kandidát; produkce ani osobní databáze se nezměnily.

### Navazující checkpoint · W06 · vlastník výkladu od zahájení generování · 17. října 2026

- Každá hlavní cesta automatického ukládání předává `Auth.saveReading()` účet zachycený při zahájení výpočtu. To brání tomu, aby opožděný výsledek po přepnutí účtu skončil u nově přihlášeného člověka. Pokryté jsou andělské karty, astro mapa, křišťálová koule, horoskop, minulý život, natální karta, numerologie, rituály, runy, šamanské kolo, partnerská shoda, karta dne a tarot včetně pozdějšího shrnutí.
- Serverová route `/api/user/readings` vyžaduje `expectedUserId` shodné s autentizovaným účtem ještě před databázovou operací. Regrese pro chybějící ID, nesoulad a výměnu účtu během CSRF čekání jsou připravené; aplikační/browserové testy čekají na společný závěrečný běh.
- `npm run build:js`, cílený ESLint, `node --check` dotčených zdrojů/bundlů/specifikací a `git diff --check` prošly. Cache token funkcí je `20261017-owner-bound-save`, Auth/core token `20261017-reading-owner`; archiv eviduje **1 321** verzí a všech **15/15** změněných bundle souborů. Hash Auth klienta `a54ba4dd128dbd0f`, `core.js` `0056daaa7db6695f`; Service Worker cache `mysticka-hvezda-40223f16936d`. Pouze lokální kandidát; produkce ani osobní databáze se nezměnily. Podrobnosti jsou v [QA checkpointu](release-prep-2026-10-15/qa-results.md).
### Navazující checkpoint · W06 · mutace historie při přepnutí účtu · 17. října 2026

- Zpětná vazba, změna oblíbeného a smazání uloženého výkladu nyní vyžadují vlastníka zachyceného při spuštění akce. Klient i server odmítnou akci po výměně identity; server dál odvozuje skutečné vlastnictví výhradně z ověřené session. Neexistující záznam pro oblíbené vrací srozumitelnou 404.
- Připravené regrese kontrolují chybějící/cizí `expectedUserId` pro všechny tři mutace, změnu účtu během CSRF čekání u feedbacku a chybějící oblíbený záznam. Jejich běh zůstává odložený do finální QA.
- Build, cílený ESLint, syntaxe dotčených zdrojů/dist/testů a `git diff --check` prošly; Service Worker cache `mysticka-hvezda-dda371e69c0e`, archiv **1 332** verzí. Verze `20261017-reading-mutation-owner` je aktuální ve všech nalezených HTML odkazech pro auth, feedback, favorite helper a horoskopy. Pouze lokální kandidát, bez zásahu do produkce nebo soukromých dat. Podrobnosti: [QA výsledky](release-prep-2026-10-15/qa-results.md).

### Navazující checkpoint · W06 · obnova přihlášení při rozepsané reflexi · 17. října

- Zápis reflexe po 401 nebo ztrátě přihlášení během CSRF preflightu zachová koncept pouze v sessionStorage jeho vlastníka, vyčistí zastaralý Auth stav a zobrazí návrat do profilu s fokusem na rozepsanou poznámku. Guest profil dostane srozumitelný stav; běžné chyby 403/500 se dál zobrazují jako opakovatelná chyba bez odhlašování.
- Resetovací callback už nenechá společný Auth klient zaměnit recovery token za ověření e-mailu. Po úspěšné změně hesla lze pokračovat zpět k rozepsané reflexi, pokud žádost o reset vznikla z tohoto profilu; cíl je lokální pevná cesta s 24hodinovou expirací. Před novou žádostí se starý cíl smaže a nový se uloží až po potvrzené úspěšné odpovědi. Testovací návrh pokrývá stale session před POSTem, serverové 401 i mockovaný reset bez reálného e-mailu i neúspěšné odeslání bez starého návratového cíle. Aplikační/browserové testy zůstávají odložené na závěrečný společný běh; PV03 proto zůstává otevřené.
- `npm run build:js`, cílený ESLint, syntaxe zdrojů/bundlů/specifikací a `git diff --check` prošly. Archiv assetů se nyní přegeneruje přes dočasný soubor a atomickou výměnu; obsahuje **1 351** verzí a aktuální bundle a lazy chunk hashe (`core.js` `da10fe34c472863b`, Auth klient `29a9501fcdda7dc3`, přihlášení `718168aecd5f055f`, profilový dashboard `0d6f104c20c43df4`, lazy detail `modal-EQ6NP3YL.js` `0da68c4845c59526`). Auth token `20261017-journal-session-recovery` nemá zastaralé odkazy; přihlášení načítá `20261017-password-reset-return`. Service Worker cache `mysticka-hvezda-52f96b462404`. Pouze lokální release kandidát; produkce, reálný reset hesla ani osobní databáze nebyly změněny.

### Navazující checkpoint · profilový PV04 · věrné zobrazení uloženého obsahu · 17. října 2026

- Profilový detail nyní samostatně popíše uložený praktický krok, zachová odstavce a zobrazí neznámé starší objekty jako čitelná pole místo JSON bloku. Připravené regrese pokrývají aliasy kroku, duplicitu, zalomenou odpověď a vnořenou strukturu; podle dohody se spustí až v jednom závěrečném testovacím běhu.
- `npm run build:js`, cílený ESLint, `node --check`, kontrola auth asset verzí (**0 zastaralých odkazů**) a cílená kontrola diffu prošly. Snapshot **1 355** veřejných verzí; cache `mysticka-hvezda-ed3c8ca174e2`; aktuální profilový dashboard `2dabc74479657d43`, detail `modal.js` `2fbd7c8956618234`, lazy modul `modal-JPVN4ZWS.js` `0ecf8b607fdc70dc`.
- PV02 potřebuje ověření synchronizace ve Stripe testovacím prostředí. PV03 potřebuje závěrečný resetovací e-mail a návrat. PV04 čeká na společnou regresi a přesné historické tvary; produkční zákaznické řádky se nečetly. Produkce zůstala beze změny. Podrobnosti: [profilový TODO](page-simplification-2026-10-14/profile-followup-todo.md) a [PV04 evidence](release-prep-2026-10-15/reading-fidelity-qa.md).

### Navazující checkpoint · W07 · názvosloví kalkulačky numerologie · 18. října 2026

- Kalkulačka počítá číslo životní cesty z data narození; její dřívější označení „číslo osudu“ si odporovalo s numerologií webu, kde číslo osudu vychází z celého jména. Sjednoceny viditelné popisky, metadata, sdílený text, navigace a překlady. Statická kontrola ověřila **313 interních odkazů v 309 HTML souborech**: cíle existují a všechny popisky odpovídají kalkulačce; stará URL zůstává zachována. Opraveno také názvosloví u 280 vygenerovaných stránek jmen včetně FAQ a JSON-LD, generátorů jmen a numerologických detailů, partnerské numerologie a dvou souvisejících článků. Vstup nově přijímá jen skutečné datum, které už nastalo, a maximální rok se nastavuje podle aktuálního roku místo pevného 2026. Chyba se oznámí čtečce obrazovky, je propojená s poli a označí i vizuálně vstup, na který je potřeba se zaměřit.
- Zkrácen vysvětlující text, odstraněno nedoložené historické tvrzení a výklad je popsaný jako symbolický podnět, ne jako jistá vlastnost či předpověď. Dvě FAQ položky nyní přesně odpovídají viditelným rozbalovacím odpovědím. Výpočet a formulářové/analytické háčky nebyly měněny.
- Cílený esbuild kalkulačky a `npm run build:js` proběhly; společný `core.js` i Service Worker se aktualizovaly. Statická kontrola odkazů a jejich cílů, 280 detailů jmen, zdrojů/bundlů a `git diff --check` proběhla; browserové a aplikační testy zůstávají na závěrečnou společnou QA. Pouze lokální release kandidát; produkce beze změny.

### Navazující checkpoint · W04/W06 · stavové ikony a ovládání · 18. října 2026

- Odběr denního horoskopu lze odeslat také Enterem z e-mailového pole; použije stejnou validaci a API cestu jako tlačítko. Cache odkaz byl srovnán na 80 HTML stránkách a v generátoru tarotových detailů. Existující E2E scénář nyní ověřuje Enter a zůstává odložený do společné QA.
- Výsledky Šamanského kola už při výpočtu nepřepíší vstupní SVG ikony zpět na emoji. Směr používá kompas a živly existující symboly plamene, listu, pírka a vlny; názvy i významové zvířecí znaky zůstávají. Oblíbené výklady používají jednotnou SVG hvězdu, `aria-pressed` a během zápisu blokují další kliknutí, aby se přepínací mutace neprovedla dvakrát. Chyba databáze push odběru/odhlášení už nemůže být vrácena jako úspěch; připravený serverový test čeká na finální běh.
- `npm run build:js` a `node scripts/snapshot-assets.mjs` prošly; archiv má **1 393** veřejných asset verzí a Service Worker cache `mysticka-hvezda-9f6a61a35d33`. Cílený ESLint, `node --check`, XML parser SVG, audit 17 změněných odkazů na funkční bundle a 81 odkazů na odběrový bundle prošly bez zastaralé verze. `git diff --check` skončil úspěšně; Git upozornil na existující CRLF normalizaci v pracovním stromu. Aplikační/browserové testy zůstávají odložené do jednoho závěrečného běhu; produkce se nezměnila.

### Navazující checkpoint · W04 · vizuální stavy členství · 18. října 2026

- Paywall, benefitní seznam, zkušební nabídka, štítek Premium v navigaci a zamčený obsah teď používají existující SVG symboly místo dekorativních emoji. Změna se týká ikon a stylu; plán, cena, trial podmínky, text nabídky, analytika a checkout tok zůstaly beze změny.
- CSS cache token `20261018-paywall-svg` byl obnoven pro **730 HTML/generator souborů**; sdílený core token pro **915 HTML/generator souborů**. Oba verifikátory potvrdily nula zastaralých odkazů. Nový skript `scripts/refresh-css-asset-versions.mjs` pokrývá tři společné CSS bundle.
- `npm run build:css`, cílený ESLint, `node --check` dotčených zdrojů/bundlů/specifikací a `git diff --check` prošly. Archiv assetů eviduje **1 402** veřejných verzí; Service Worker cache `mysticka-hvezda-0708689c3b08`. Aplikační/browserové testy zůstávají na závěrečný společný běh. W04 je stále otevřené; produkce se nezměnila.

### Navazující checkpoint · W04 · vizuální sjednocení odchodu z členství · 18. října 2026

- Zrušovací dialog převádí důvody odchodu a nabídky na stávající SVG symboly; jeho povrch je nově v navy/zlaté paletě webu. Toasty používají SVG podle výsledku, `role=status`/`alert` a odpovídající živé oznámení. Důvody, texty, identifikátory formuláře a postupy pauzy/slevy/zrušení zůstaly zachované.
- CSS verze `20261018-retention-icons` platí pro **730 HTML/generator souborů**; nový bundle `retention.js` je načten ve všech pěti stránkách, které jej používají. CSS a JS buildy prošly, archiv má **1 410** asset verzí, Service Worker cache `mysticka-hvezda-b1d16e04827f`.
- Cílený ESLint, syntaxe, kontrola 9 SVG symbolů, kontrola všech pěti bundle odkazů, oba cache verifikátory (0 zastaralých) a `git diff --check` prošly. Pouze lokální kandidát; aplikační/browserové testy čekají na společný závěrečný běh a produkce zůstává beze změny.

### Navazující checkpoint · W04 · stavové ikony v přihlášení a branách · 18. října 2026

- Dvě zprávy po registraci už neopakují symbol emailu/hvězdy v textu; toast má vlastní SVG úspěchu. Numerologický náhled používá SVG zámek z existující sady a vstupní věta k lunárním rituálům je bez dekorativního emoji. Významové symboly tarotu, lunárních fází, znamení a denních karet zůstaly nedotčené.
- Aktualizovány přímý Numerology/ritualy bundle i Auth/core cache tokeny. Statická kontrola ověřila všech 66 přímých Auth odkazů, 840 core odkazů, oba nové specifické bundle odkazy a nulu zastaralých odkazů. JS build a snapshot proběhly; archiv má **1 417** verzí, Service Worker cache `mysticka-hvezda-7f1eb5251934`.
- Cílený ESLint, `node --check`, scan upravených UI souborů bez dekorativních emoji, oba cache verifikátory a `git diff --check` prošly. V11 jako celek zůstává otevřené; aplikační/browserové testy patří do společné závěrečné QA. Pouze lokální kandidát; produkce beze změny.

### Navazující checkpoint · W04 · kontrola ikon a ochranná poznámka objednávky · 18. října 2026

- Roční PDF má ve formulářové poznámce stejný SVG zámek jako ostatní omezené/stavové prvky; text o Stripe a soukromí zůstal beze změny. CSS stránky má nový token `v=7`.
- Aktualizoval jsem [inventář ikon](ui-symbol-review-2026-10-14/inventory.md): převedené 404/slovníkové/profilové/stavové symboly už nejsou vedené jako otevřené emoji. Přibylo upozornění, že `js/daily-card.js` stále obsahuje starý datový balíček, ale nemá nalezené načítání z HTML/generátoru; zdroj ani offline položka nebyly odstraněny, protože jejich vlastnictví je třeba rozhodnout zvlášť.
- Service Worker cache je `mysticka-hvezda-cc8c847970d6`, archiv má **1 418** veřejných asset verzí. Kontrola konkrétního annual CSS odkazu, obou cache verifierů a `git diff --check` prošla; testy zůstávají odložené a produkce nezměněná.

### Navazující checkpoint · W04 · dokončení tematických SVG odkazů · 18. října 2026

- Všech **283/283** souvisejících tematických odkazů v 74 blogových článcích používá SVG podle cílové funkce. Texty, číselné hodnoty 11/7, cílové URL a source parametry zůstaly zachované. Opakovaný běh generátoru ponechal 74/74 souborů beze změny.
- V seznamu tarotu má uzamčená karta společný SVG zámek a toast limitu už neopakuje emoji vedle vlastní stavové ikony. Podrobnosti, hash archivu a cílené kontroly jsou v [QA výsledcích](release-prep-2026-10-15/qa-results.md). Browserové testy zůstávají odložené; změny jsou lokální a produkce beze změny.

### Navazující checkpoint · W04 · zámek uzamčené tarotové karty · 18. října 2026

- Uzamčené karty v tarotovém výkladu používají společný SVG symbol zámku; chybový toast limitu již neopakuje emoji, protože toast vykresluje vlastní stavovou ikonu. Limit, cena i nabídka pokračování zůstaly stejné.
- Odkazy na `tarot.js` a `tarot.css` mají nové verze. JS build a asset snapshot proběhly; archiv má **1 440** verzí a aktuální `/js/dist/tarot.js` hash `07f0a1b507b33886` je uložený. Cílený lint zdroje, syntaxe zdroje/bundlu, kontrola spritu/velikosti ikony a `git diff --check` prošly. Prohlížečové a aplikační testy čekají na závěrečnou QA; změna je lokální, produkce nedotčená.

### Navazující checkpoint · W04 · ověřovací toasty bez duplicitních emoji · 18. října 2026

- Toasty po úspěšném ověření e-mailu a po chybě ověření teď spoléhají na vlastní SVG symbol stavu; titulek už druhou emoji nepřidává. Význam, text zprávy a otevírání přihlášení se nezměnily.
- Po sestavení JS bylo obnoveno verzování sdílených balíků v **915** HTML/generátor souborech. Verifikátor hlásí **0** zastaralých odkazů; JS asset snapshot obsahuje **1 443** verzí. Aktuální hashe `core.js` (`e141bfae58bd6260`), `auth-client.js` (`3903fe3fd23ef8a6`) i `tarot.js` (`07f0a1b507b33886`) jsou archivované. Cílený ESLint a statické kontroly prošly; aplikace/prohlížeč zůstávají do závěrečné QA, produkce se nezměnila.

### Evidence update · V11 · kvízový rozcestník · 18. října 2026

- Znovu ověřený `testy/index.html` už před touto dávkou používá pro všech sedm tematických karet lokální SVG (`tarot`, `flame`, `dream`, `wolf`, `hourglass`, `spectrum`, `eye`). Každá karta má existující cíl a sdílený stylesheet. Opravil jsem zastaralý stav v [inventáři ikon](ui-symbol-review-2026-10-14/inventory.md); do HTML nebylo potřeba zasahovat.
- Statická kontrola: 7/7 ikon/symbolů, 7/7 lokálně existujících cílů, žádné emoji v ikonových obalech. Prohlížečová kontrola zůstává pro finální QA.

### Navazující checkpoint · W04 · ilustrace Andělské karty · 18. října 2026

- Dekorativní jiskru na rubu Andělské karty nahradil zlatý SVG symbol `star` z místního sprite. Skutečná ilustrace, obsah karty i znění sdílení se nemění. Atlasové detailní stránky, které tuto ozdobu záměrně skrývají, ji skrývají dál.
- JS build a asset snapshot proběhly; archiv má **1 446** verzí, `angel-cards.js` hash `6fbe9e497108df8f` je archivovaný a Service Worker cache je `mysticka-hvezda-5c95a637d5cd`. Stránka má nové verze CSS/JS odkazů; cílený ESLint, syntaxe a statická kontrola symbolu, rozměru a atlasového skrytí prošly. Vizuální a aplikační QA zůstává do závěrečného běhu; lokální kandidát.

### Evidence update · V11 · současný rozsah SVG a generátorů · 18. října 2026

- `node scripts/unify-ui-symbols.mjs --check` nad 917 veřejnými HTML soubory hlásí 0 změn a 0 nepřiřazených ikon. Samostatný read-only scan ikonových tříd našel jen významové glyphy znamení/planet a typografickou hvězdu; další dekorativní emoji v těchto obalech nezjistil.
- Generátor blogových tematických odkazů má bezpečný npm check režim: 74/74 článků aktuálních, bez zápisu. W03 zůstává otevřené pro šest generátorů s širokým přepisem výstupních stránek.

### Navazující checkpoint · W04 · jednotná hvězda u oblíbených výkladů · 18. října 2026

- Dynamické akce „Přidat do oblíbených“ v natální kartě a výkladu minulého života teď používají sdílenou SVG hvězdu místo odlišného emoji/znaku. Text tlačítka, identifikátory a ukládací handlery zůstaly zachované.
- JS build a snapshot proběhly; archiv má **1 450** verzí. Bundle `natal-chart.js` hash `fb2cab73855c24ff` a `minuly-zivot.js` hash `5a5d4fa7793968d8` jsou uložené. Stránky mají token `20261018-favorite-icons`; cílený ESLint, syntaxe a statické kontroly šablon/spritu/archivu prošly. Browserovou a aplikační regresi záměrně nechávám na závěr.

### Navazující checkpoint · W04 · ikony detailů Andělských karet · 18. října 2026

- Všech 44 českých detailních stránek a jejich generátor používají SVG `angel`, `heart` a `compass` v titulku a tematických nadpisech. Redundantní ozdoba u „Duše a praxe“ zmizela; text karet a odkazy zůstaly beze změny.
- Nové styly v `atlas-content.css?v=2` omezují ikony na velikost nadpisu a tlumenou zlatou. Verze sdílených CSS odkazů byla srovnána v 536 HTML/generátor souborech; read-only kontrola hlásí nulu zastaralých cest. Vizuální kontrola patří do závěrečné QA.

### Navazující checkpoint · W05/V05 · opakované odkazy v detailu tarotu · 18. října 2026

- V šabloně a všech 78 českých detailech tarotu jsem odstranil duplicitní sekundární odkazy „Zpět na všech 78 karet“ a „Prohlédnout všechny karty“. Hub zůstává dosažitelný přes drobečkovou navigaci i katalog souvisejících karet. Hlavní akce „Otevřít tarotový výklad“ zůstala před obsahem i po FAQ; významy, FAQ, obrázky a source parametry hlavní CTA se nezměnily.
- Read-only porovnání všech 78 výstupů a vizuální/konverzní přijetí patří do závěrečné QA.
- Navazující zjednodušení 18. 10.: generované H1 nyní přirozeně zní „[název karty] v tarotu: význam karty“ a rychlý přehled už neopakuje téma z hero úvodu. Read-only kontrola potvrdila změnu na všech 78 detailech; obě CTA se zachovanými zdroji měření zůstaly. [Evidence](release-prep-2026-10-15/tarot-detail-copy-simplification-2026-10-18.md).

### Navazující checkpoint · W05 · Biorytmy · 18. října 2026

- Po výpočtu zůstávají přehled tří cyklů, graf, legenda i CTA k bezplatnému profilu přímo u výsledku. Odstranil jsem spodní generický rozcestník s 11 kartami a čtyři nesouvisející chip odkazy.
- Čtyři dlouhé FAQ karty jsou nyní samostatná nativní rozbalovací pole. Vzdělávací text už byl v `details`; jeho obsah se neměnil. FAQ otázky i odpovědi přesně odpovídají FAQPage JSON-LD.
- Statická kontrola funkčních ID, profilového odkazu, značek SEO textu a FAQ parity prošla; `git diff --check` prošel. Prohlížečové, klávesnicové a aplikační ověření zůstává na finální společný průchod. Kandidát lokální; produkce beze změny. [Evidence](release-prep-2026-10-15/biorhythm-page-simplification-2026-10-18.md).

### Navazující checkpoint · W05 · Minulý život · 18. října 2026

- Dlouhé vysvětlení a čtyři FAQ jsou nyní nativní disclosure. Čtyři obecné návaznosti se zkrátily na jediný související Tarotový výklad s vysvětleným kontextem.
- Premium brána, formulář, výsledek, sdílení, oblíbené položky a všechna DOM ID zůstaly nedotčené. Statická kontrola potvrdila paritu FAQ s JSON-LD i zachování runtime háčků; `git diff --check` prošel.
- Cena, trial, přístup a generovaný výsledek je třeba ověřit funkčně v koordinovaném QA; tato úprava jejich logiku neměnila. Vizuální, mobilní a klávesnicové přijetí čeká na společný běh. Kandidát lokální. [Evidence](release-prep-2026-10-15/past-life-page-simplification-2026-10-18.md).

### Navazující checkpoint · W05 · Aura · 18. října 2026

- Vysvětlení modelu aury je nyní rozbalovací reference. Spodní čtyřkaretní rozcestník zmizel; přímá Numerologie CTA v samotném výsledku zůstává.
- Statická kontrola ověřila výpočetní ID, vyvážené sekce, čtyři FAQ přesně shodné s JSON-LD a odstranění opakovaného odkazu. Opravil se také nalezený jednoslovný rozdíl mezi FAQ odpovědí a schématem.
- Klientský výpočet a vizuální, mobilní a klávesnicové přijetí se ověří až v závěrečné společné QA. Kandidát je lokální; produkce beze změny. [Evidence](release-prep-2026-10-15/aura-page-simplification-2026-10-18.md).

### Navazující checkpoint · W05 · Šamanské kolo · 18. října 2026

- Před formulářem zůstává jedna primární karta vedoucí k výpočtu; pět dalších tematických cest se otevře až v „Potřebuješ jiný druh podpory?“. Všechny interní cíle i `data-analytics-*` atributy zůstaly zachované.
- Formulář, bezplatné karty, prémiový obsah a paywall zůstaly mimo disclosure. Upravené rozvržení má nový cache token; stránkový CSS soubor není v Service Worker precache.
- Staticky prošel počet/umístění všech šesti odkazů, přítomnost formulářových a výsledkových háčků, CleanCSS parser a `git diff --check`. Vizuální, mobilní, klávesnicové a funkční ověření je odložené na společný závěrečný běh. Kandidát lokální. [Evidence](release-prep-2026-10-15/shamanic-wheel-intent-simplification-2026-10-18.md).

## Aktuální stav kandidáta · 18. října 2026

- Release kandidát obsahuje lokální vizuální úpravu ikon 44 detailů Andělských karet a zjednodušení sekundární navigace na 78 detailech tarotu; obsah a hlavní funkční odkazy jsou zachované. Obsahové generátory mají read-only kontrolní režim a tarotové mazání je explicitní.
- Navazující úpravy sjednotily CTA/profilovou ikonu v homepage hlavičce, paletu lunárního kalendáře a rozcestníku rituálů a přístupné ovládání přípravného seznamu. Veřejný vstup do šesti kroků rituálu nyní nevyžaduje účet; členské ukládání poznámek se neměnilo.
- Souhrnný `check:content-generators` (blogové clustery, šest generátorů a CSS verze) je zapojený do `test:verify`. První souhrnný běh, aplikační/browserová QA a vizuální přijetí jsou stále otevřené a proběhnou spolu až po dokončení úprav.
- Navazující W05 zkrátil Runy a Snář bez změny výsledků/nástrojů; W12 zmenšil obrázky Andělských karet. Historický checkpoint těchto změn měl 1 796 verzí a Service Worker `mysticka-hvezda-149e8f14f27c`; DPI, offline a vizuální přijetí čekají na finální browser QA.
- Aktuální dávka sjednotila lokální den ve výpočtu biorytmů, denním tahu run, limitu tarotového teaseru a maximálním datu objednávky Osobní mapy. Další úprava natální karty odstraňuje nepoužívaný klientský odhad znamení; server dál odvozuje znamení i prompt ze své vypočtené mapy. Cílené buildy, syntaxe a ESLint prošly; E2E nebylo spuštěno. Service Worker cache je `mysticka-hvezda-f2c27c0ab767` a asset snapshot uchovává **1 818** verzí. Testy, browserová kontrola a mobilní přijetí jsou odloženy do jediného závěrečného průchodu.
- Kandidát je pouze lokální; produkce nebyla změněna.

### Navazující checkpoint · W04 · nadpisy souvisejících článků · 18. října 2026

- Opakovaný nadpis „Čtěte také“ v 72 blogových článcích nyní používá místní SVG `book` ve stejné 18px inline sadě jako odkazy v těle článku. Emoji knihy zmizela z 53 nadpisů; zbývajících 19 textových nadpisů má teď stejnou ikonu. Text i související cíle jsou zachované.
- Úprava zasáhla jen přesně odpovídající nadpisy ve veřejném `blog/`; společný obsahový generátor této sekce nalezen nebyl. Přehled a vizuální ověření jsou součástí závěrečné QA.

### Navazující checkpoint · V09/W07 · rituální seance a omezený pohyb · 18. října 2026

- Rituální seance používá tlumenou navy/zlatou paletu bez fialového přechodu a vrstvy umělých hvězd. Číselné volby nálady, text kroků, pořadí, časování, ukládání a odkazy se neměnily; ovládací odkazy a pole mají jasný fokus.
- Při prefers-reduced-motion: reduce se vypnou animace plamene, náběhu obrazovek a kruhu; textové pokyny a časování dechového průvodce zůstávají. Lokální CSS má cache token 20261018-atlas-motion. Vizuální a funkční kontrola čeká na společnou závěrečnou QA.

**Dílčí oprava V09/W07 · 19. 10.:** původní vzhledový nález fialového pozadí je zastaralý; aktuální CSS má navy a tlumené modrozelené světlo. Při `prefers-reduced-motion` už JS místo skrytého 42sekundového čekání nabídne statickou dobrovolnou instrukci a ihned zpřístupní „Pokračovat“. Aktivní dist bundle byl sestaven a HTML cache token obnoven; připravená cílená regrese i browserová QA čekají na společný závěrečný průchod. [Checkpoint](release-prep-2026-10-15/reduced-motion-breath-guide-2026-10-19.md).

## 2026-10-18 — Offline fallback V10 / W07

- Sjednocen lokální offline fallback do tmavě modré a tlumeně zlaté; odstraněna stará dekorativní hvězdná vrstva.
- Stránka může při zvětšení písma a úzkém viewportu svisle rolovat; zachována minimální výška malé obrazovky a viditelný focus.
- CSS dostalo verzi 20261018-offline-scroll; produkce nezměněna. Testy a prohlížečová kontrola odloženy do závěrečného QA dle zadání.

### Navazující checkpoint · V10/W07 · onboarding · 18. října 2026

- Onboardingové kroky, výběr znamení a témat jsou sjednocené do navy a tlumené zlaté. Stav vybraných tlačítek je čitelný, ovládací plochy mají nejméně 44 px, focus zůstává viditelný a kroková animace respektuje omezený pohyb.
- Rozměry karty a mřížky jsou upravené pro úzké obrazovky; text, cíle, hodnoty data-interest a chování toku se nezměnily. Stránka načítá nový CSS token 20261018-atlas-onboarding.
- Jde o lokální CSS/HTML změnu bez ověření v prohlížeči; finální interakční a mobilní QA zůstává na závěr. Produkce beze změny.

**V10/W07 follow-up 18. 10.:** kroky onboardingu oznamují čtečce aktuální pozici a po uživatelské volbě přesouvají fokus na nový nadpis. Automatický start rychlé větve zůstává bez přesunu fokusu. Zdrojový JS build a asset snapshot jsou hotové; aktuální Service Worker cache je `mysticka-hvezda-1f1b3098ef18`, archiv má 1 460 verzí. Interakční a vizuální přijetí zůstává na závěrečnou QA.

**V10 follow-up 18. 10.:** offline fallback odstranil skript, který pracoval se zrušenou dekorací a současně zpracovával klik na odkaz domů přes location.reload(). CTA teď používá přímou kořenovou navigaci; offline návrat čeká na závěrečné ověření se Service Workerem.

**Zdrojová kontrola V10 · 19. 10.:** staré důkazy `??`, fialového tlačítka a odkrytého skip linku se v `/offline.html` už nepotvrzují. Onboarding i offline stránka načítají Atlas vrstvu; offline používá SVG `#warning`, navy a tlumené zlato. V10 je zdrojově sjednocené, ale mobilní/klávesové přijetí a offline návrat přes Service Worker zůstávají otevřené pro společnou závěrečnou QA. Produkce beze změny. [Aktualizovaný průzkum](page-simplification-2026-10-14/README.md).

### V09/V10 follow-up · lunární kalendář a rituál · 18. října 2026

- `lunace.css` už nemá fialovou výzvu „Měsíc je jen začátek“ ani staré syté zlato; odpočty, karta fáze a hlavní denní CTA mají navy/tlumené zlato. `ritualy-index.css` používá stejnou paletu pro vybranou kartu, štítek fáze a vstupní tlačítko. Výpočty fází, výběr znamení, texty i analytické cíle zůstaly nedotčené.
- CSS cache tokeny jsou `20261018-atlas-lunar-cta` a `20261018-atlas-ritual-a11y`. Service Worker cache `mysticka-hvezda-1f1b3098ef18`; snapshot uchovává 1 465 veřejných verzí. Statický scan těchto dvou stylů nenašel starou fialovou/zlatou paletu. Browserová QA je odložená do společného závěru; produkce beze změny.

### V01/W04/W06 follow-up · homepage hlavička a vstup do rituálu · 18. října 2026

- CTA a profilové ikony homepage odpovídají sdílené hlavičce; odlišné zvýraznění „Mystické testy“ bylo odstraněno. URL, analytické parametry a pořadí navigace se neměnily. Read-only porovnání pomocníka `gpt-5.6-luna` nenašlo nefunkční cíl; jeho podezření na dropdown selektor vyvrací zdrojový selektor, který zahrnuje i `.nav__dropdown-link`.
- Veřejná stránka rituálů slibuje šest bezplatných kroků bez registrace, zatímco JS předtím otevíral login/členskou bránu. Tato vstupní brána je odstraněná; členství nadále chrání uložení zápisků do profilu. Přípravné položky oznamují stav checkboxu a lze je přepínat myší, Enterem i mezerníkem. Vstupní CTA zůstává sémantickým odkazem a má bezpečný výchozí cíl, než jej JS personalizuje.
- Statický scan zdroje i buildu nenašel přihlašovací/platební bránu na vstupu; build JS a asset snapshot proběhly. CTA nemá falešné `role="button"`, FAQ a JSON-LD uvádějí stejné podmínky a výběr znamení odráží aktivní stav přes `aria-pressed`. Stránka má JS token `20261018-ritual-sign-state`. `index.html`, rituální vstup a samotná seance čekají na cílenou závěrečnou browserovou kontrolu včetně guest cesty a členského zápisu. Kandidát je lokální; produkce beze změny.

### V04/W07 follow-up · zbytky staré fialové grafiky · 18. října 2026

- Aktivní uvítací panel po registraci na horoskopech a loader kvízu „Stín znamení“ už nepoužívají fialovou. Loader místo lunární emoji používá jednoduchý kruhový indikátor a při `prefers-reduced-motion` se nepohybuje.
- Zdroj `css/pages/index.css` už nemá svou redundantní kosmickou tapetu ani starou základní paletu; novou homepage ilustraci a atlasovou kompozici zachovává. Rozšířený scan ale ukázal, že společný `css/style.v2.css` stále obsahuje původní paletu a obrázkové pozadí; homepage je přepíše pravidly `home-atlas.css`. Další změna musí vycházet z mapy všech konzumentů tohoto globálního CSS.
- HTML načítá nové CSS verze pro homepage, horoskopový panel a kvíz. `npm run build:css`, aktualizace cache Service Workeru a asset snapshot proběhly; cache je `mysticka-hvezda-a13e74846d6a`, archiv uchovává **1 472** verzí. V samotných upravených stránkových stylech nezůstaly vyhledávané fialové hodnoty; staré hodnoty jsou stále v kombinovaném CSS kvůli společnému základu. Browserové ověření zůstává až na společný závěr.

### V04/W07 follow-up · Tarot karta dne · 18. října 2026

- Veřejná stránka ještě načítala globální hvězdné a fialové pozadí, protože neměla atlasový override. Zachoval jsem tři tarotové karty v hero; starou galaxii a DOM vrstvu hvězd jsem odstranil a gradienty stránky sjednotil do navy/tlumeného zlata.
- Stránkový CSS token je `20261018-atlas-cosmic-cleanup`; `theme-color` odpovídá tmavému navy. Statický scan stylu nevrací staré fialové/zářivě zlaté hodnoty a HTML už nevkládá `.stars`. Service Worker cache `mysticka-hvezda-a13e74846d6a`; asset snapshot **1 472** verzí. Vizuální kontrola je odložena do společné závěrečné QA.

### V04/W04 follow-up · blogové a slovníkové šablony · 18. října 2026

- Šablony budoucích článků a slovníkových hesel teď nastavují odpovídající Atlas body class, sdílené `atlas-web.css` a rodinné CSS. Odstranil jsem z nich starou DOM vrstvu `.stars` a doplnil přeskočení navigace.
- Stejnou přístupnost dostalo 64 ze 74 blogových článků, které ji dosud neměly, a všech 30 slovníkových detailů. Každý odkaz míří na jediný existující `main#main-content`; ostatní Atlas odkazy zůstaly zachované. Read-only kontrolu pokrytí nezávisle zopakoval pomocník a všech 104 statických výstupů i obě šablony prošly.
- Service Worker hash zůstal `mysticka-hvezda-a13e74846d6a`; asset snapshot uchovává **1 472** veřejných verzí. Žádný generátor ani aplikace nebyly spuštěny. Závěrečná browserová QA zůstává odložená, kandidát je pouze lokální.

### W04/W01 follow-up · skip navigace napříč Atlas stránkami · 18. října 2026

- Skip odkaz a cíl hlavního obsahu doplněn do 145 vztahových profilů, osmi kvízů, sedmi slovenských a šesti polských stránek; také do rozcestníků znamení a jmen, rituální seance a šablony kompatibility. Ve vztahových profilech se cíl jmenuje `main-content` a je jeden na stránku.
- Široký statický scan 918 Atlas dokumentů našel 916 odkazů `.skip-link`; všechny fragmenty míří na existující ID. Vztahový výklad používá vlastní správný odkaz `class="skip"` na `#obsah`. Jedinou výjimkou bez skip navigace je čistě plátěný náhled karty `horoscope-card-preview.html`, který nemá navigaci ani hlavní text.
- Lokalizované odkazy mají vlastní popisky „Preskočiť na obsah“ a „Przejdź do treści“. Následující kontrola v prohlížeči zůstává ve společné závěrečné QA; testy a aplikace se nespouštěly. Kandidát je místní.

### V04 follow-up · rozcestník 404 · 18. října 2026

- Číselný motiv přestal míchat fialovou s modrou; používá tlumené zlato a krémovou. Navigační odkazy mají navy povrch, tlumené zlaté okraje, hranatý Atlas tvar a 44px minimum. Nadpis už nezůstane průhledný kvůli starému textovému gradientu.
- Stránkový CSS token je `20261018-atlas-404`; `atlas-remaining.css` má nový token `20261018-404-atlas-tuning` na 55 HTML/generátorových odkazech. Service Worker cache `mysticka-hvezda-90d5dfd7466d`; asset snapshot **1 474** verzí. Statické skeny potvrdily 916 standardních Atlas skip odkazů bez chybného cíle; vztahový výklad používá správný vlastní cíl a výjimkou zůstává pouze plátěný náhled karty. Browserové přijetí je odložené do společného závěru.

### W04 follow-up · tlumenější zvýraznění lunárního kalendáře · 18. října 2026

- Hover, focus, aktivní fáze, štítky a zvýrazněná karta lunárního kalendáře používají tlumené zlato Atlasu místo jasnější žluté. Zlatá záře kolem měsíční ilustrace zůstává zachovaná jako součást symbolu.
- CSS odkaz má token `20261018-atlas-lunar-polish`; statický asset snapshot nyní uchovává **1 475** veřejných verzí. Service Worker hash zůstal `mysticka-hvezda-90d5dfd7466d`, protože tato stránková CSS vrstva není v jeho statickém precache manifestu. Prohlížečová kontrola hover/focus zůstává odložená do společné závěrečné QA.

### W07 follow-up · omezení pohybu pro Atlas stránky · 18. října 2026

- `prefers-reduced-motion: reduce` nyní v Atlas vrstvě vypíná animace a přechody všech potomků, vypíná plynulé rolování a odstraňuje statické posuny tarotových ilustrací. Přístupnostní nastavení se tak neomezuje jen na několik jednotlivých karet či nástrojů.
- Verzi `/css/atlas-web.css?v=20261018-reduced-motion` načítá 925 odkazů ve 923 HTML a generátorových zdrojích. Aktuální Service Worker cache je `mysticka-hvezda-42bab7be202f`; asset snapshot uchovává **1 476** veřejných verzí. Počet odkazů a pravidlo jsou ověřeny staticky; chování v prohlížeči zůstává ve společném závěrečném běhu.

### W01/W07 follow-up · přístupný cíl skip navigace · 18. října 2026

- Všech **914/914** elementů `main#main-content` teď má `tabindex="-1"`; doplnil jsem stejný atribut i do obou dalších hlavních cílů skip navigace, rituální seance `#session-main` a vztahového výkladu `#obsah`.
- Tři jiné cíle (dva `div` elementy a sekce horního rozcestníku horoskopu) už tabindex měly. Statický scan potvrdil 919/919 odkazů na existující fokusovatelný cíl, 914/914 `main#main-content` a žádný duplicitní hlavní obsah. Klávesnici a čtečku obrazovky je třeba ověřit v závěrečné QA; URL ani běžné pořadí tabulátoru se nemění.

### W04 evidence · alternativní text obrázků · 18. října 2026

- Statický scan 924 HTML souborů našel 602 obrazových prvků; každý má atribut `alt`. Prázdný alternativní text má 287 prvků. Žádný odkaz složený jen z obrázků s prázdným `alt` nezůstal bez popisku nebo jiného textového názvu.
- Samotný atribut nedokládá, že každý neprázdný popis věrně vystihuje obrázek. Význam a ořezy nejnavštěvovanějších obrazů proto zůstávají v závěrečné vizuální QA.

### W03/W07 follow-up · nadpis vedené rituální seance · 18. října 2026

- `ritualy/session.html` teď má jediný skutečný `<h1>` v záhlaví seance. Začíná jako „Lunární rituál“ a po načtení scénáře se stejný nadpis aktualizuje názvem vybraného rituálu; přibyla jen potřebná typografická normalizace, rozložení hlavičky se nemění.
- CSS verze je `20261018-atlas-session-heading`; snapshot uchovává **1 477** veřejných verzí. Je to lokální zdrojová oprava noindex funkční stránky; aktualizaci dynamického titulku ověří společná závěrečná QA.

### W07 evidence · názvy ovládacích tlačítek · 18. října 2026

- Heuristický scan 924 HTML souborů našel 579 tlačítek a žádné bez textového názvu, `aria-label`, `aria-labelledby` nebo `title`. Je to zdrojová kontrola statického názvu; přístupnost dynamicky vykreslených stavů stále čeká na společnou QA.

### W05 evidence · rozbalovací obsah · 18. října 2026

- Scan 924 HTML souborů našel 540 nativních `<details>` prvků; každý začíná neprázdným `<summary>`. Tím je ověřená jejich dostupná popiska, ne vhodnost konkrétního obsahu ani ovládání na mobilu.

### W07 follow-up · přístupné názvy tří formulářových polí · 18. října 2026

- Doplnil jsem programatický název vyhledávání jmen, otázky v polské křišťálové kouli a zápisků po rituálu. Každé pole dál používá stejný identifikátor a vstupní funkci; viditelný placeholder ani žádný text stránky se neměnil.
- První statický scan formulářů našel jen tato tři pole bez přidruženého labelu či ARIA názvu. Po opravě má všech 267 statických polí pojmenování podle zdrojové kontroly; skutečné čtení názvů přes asistivní technologii zůstává závěrečné QA.

### W07 follow-up · fokus při postupu rituální seancí · 18. října 2026

- Po výběru nálady, přechodu mezi kroky, otevření závěrečné reflexe a dokončení rituálu se fokus přesune na nadpis nového stavu. Nadpisy jsou fokusovatelné bez přidání do běžného pořadí tabulátoru a mají zřetelný `:focus-visible` okraj. Z hlavního obalu jsem odstranil široké `aria-live`, protože celý rituál nemá být znovu čten po každé změně; stručný čítač a dechový průvodce zůstávají samostatně oznámené.
- Zdroj a distribuční skript byly sestaveny cíleným esbuild během. Aktuální CSS/JS tokeny jsou `20261018-session-focus-flow` a `20261018-focus-transfer`; snapshot drží **1 480** veřejných verzí. Klávesnicové přijetí a skutečná odezva zůstávají v závěrečné QA.

### W07 follow-up · omezený pohyb v profilu a společném carouselu · 18. října 2026

- Profil používá jeden helper, který při každém programovém posunu kontroluje aktuální `prefers-reduced-motion`; při omezení zvolí okamžitý posun. Opravené cesty zahrnují přepnutí panelu, návrat k objednanému výkladu, potvrzení objednávky, deník a aktivační navigaci. Stejnou volbu nyní respektuje i sdílený carousel.
- Sestavené moduly `main.js` a profilový dashboard/modal prošly cíleným esbuildem. Cache token hlavního bundle je sjednocen na `20261018-reduced-motion-scroll` v **851/851 HTML souborech**; Service Worker manifest odkazuje na právě sestavené profilové chunky a má cache `mysticka-hvezda-1c69c585ade7`. Snapshot drží **1 488** veřejných asset verzí.
- Statická kontrola ověřila jednotný token, helper ve zdroji i bundlech, nové chunky v Service Workeru a `git diff --check`. Vizuální ověření v prohlížeči ani běh interakcí neproběhl; další JavaScriptové animace a scroll cesty zůstávají k auditu. W07 tedy zůstává otevřené do společné závěrečné QA. Produkce beze změny.

### W07 · další omezení pohybu v JavaScriptu · 18. října 2026

- Statický audit našel 42 přímých voleb `behavior: 'smooth'` v 25 veřejných JS modulech. Všechny nyní volí `auto`, pokud systém hlásí `prefers-reduced-motion: reduce`; jinak zachovávají plynulé rolování. Stejná preference je použita jako výchozí v andělských kartách a slovenském tarotu ano/ne.
- Odstranil jsem také prezentační pohyb, který nebyl pokryt CSS: andělská karta při omezeném pohybu nepoužije tilt; tarot přeskočí čekání na zamíchání a postupné obracení; animace skóre ve shodě párů zobrazí konečnou hodnotu bez přechodu. Logiku losování a výsledné hodnoty změny nemění.
- `node scripts/build-js.mjs` proběhl úspěšně. Statické ověření našlo 0 nezajištěných doslovných `behavior: 'smooth'`; verze hlavního JS sedí v 851/851 HTML stránkách a aktualizované bundle verze v 33/33 kontrolovaných odkazech. Cache Service Workeru je `mysticka-hvezda-6792b1d922da`; snapshot archivuje 1 552 veřejných verzí. `git diff --check` nehlásí chyby.
- Prohlížečové ověření skutečného chování s oběma nastaveními pohybu zůstává součástí jedné závěrečné QA podle dohody. W07 tedy zůstává otevřené. Kandidát je lokální; produkce beze změny.

### W07 follow-up · okamžité zobrazení partnerského výkladu · 18. října 2026

- Doplnil jsem větev `prefers-reduced-motion: reduce` do `typewriterEffect` na stránce partnerské shody. Při této volbě vloží celý již získaný text hned; výchozí postupné vypisování při běžném nastavení zůstává stejné. Výpočet skóre, obsah i načtení výkladu se nemění.
- Nezávislá read-only kontrola pomocného agenta nad přesným kandidátem potvrdila předchozí úpravy rolování a odhalila právě tuto zbývající animaci. Zdroj i `js/dist/synastry.js` byly sestaveny; stránka má nový token `20261018-reduced-motion-complete`. Build JS uspěl, Service Worker hash zůstává `mysticka-hvezda-6792b1d922da`, asset snapshot uchovává 1 554 verzí.
- Browserová kontrola obou preferencí čeká na společnou závěrečnou QA. `js/natal-3d.js` obsahuje nepřetržitou animaci, ale v aktuálním veřejném HTML ani generátorech není načítán; zůstává dormantní zdroj a neměnil jsem jej. W07 zůstává otevřené do ověření celé stránky a zbytku aktivních animací. Kandidát je lokální, produkce beze změny.

### W04 follow-up · SVG v metadatech blogových karet · 18. října 2026

- Výpis doby čtení v hlavním článku i kartách blogu nyní používá lokální symbol `book`; datum používá `calendar` ze společného SVG sprite. Ikony jsou skryté před čtečkou, viditelná metadata zůstávají textem. Pokud článek nemá dobu čtení, karta už nevykreslí osamocenou dekorativní ikonu.
- Upravený `js/blog.js` a verze `blog.html` používá token `20261018-blog-meta-icons`. Build JS uspěl; Service Worker cache `mysticka-hvezda-6792b1d922da`; asset snapshot obsahuje 1 556 veřejných verzí. Tato malá změna nemění navigaci, obsah ani data článků.
- Byla provedena jen statická kontrola zdroje a výstupního bundlu. Vizuální čitelnost na úzkém mobilu ověříme v jednom závěrečném browserovém průchodu; kandidát je lokální, produkce beze změny.

### W04/W06 · stavové ikony a pravdivá nouzová zpráva · 18. října 2026

- Newsletterové tlačítko nyní v průběhu odesílání, úspěchu a chyby používá lokální SVG symboly `hourglass`, `check` a `error` místo emoji. Stav je pojmenovaný i textem; při požadavku má tlačítko `aria-busy=true` a po výsledku jej uvolní. Původní zpráva čtečce zůstala zachovaná.
- Globální nouzový panel homepage už netvrdí, že „naši mágové“ chybu opravují. Oznamuje, že stránku se nepodařilo načíst, a nabízí obnovu i návrat na úvod. `index.html` používá token `20261018-plain-recovery`.
- Hlavní JS bundle byl sestaven a všech 849/849 aktivních HTML odkazů na něj přešlo na token `20261018-status-icons`; počet zastaralých odkazů je 0. Statické ověření potvrdilo texty a ikony v distribučním bundlu, čerstvé verze blogu/partnerské shody, a `git diff --check` nehlásí whitespace chyby. Při prvním ověření kontrolní skript očekával neescapeovanou češtinu v minifikovaném souboru; přímá kontrola výstupu ukázala escape sekvence a následná kontrola na ně již správně mířila.
- Build JS uspěl; Service Worker cache `mysticka-hvezda-392c4ca51c3c`; asset snapshot uchovává 1 561 veřejných verzí. Newsletterové API ani skutečný odběr nebyly testovány; mobilní a screen-reader kontrola patří do společné závěrečné QA. Lokální release kandidát, produkce beze změny.

### W04 · sjednocený zavírací symbol přihlašovacího okna · 18. října 2026

- Zavírací tlačítko sdíleného přihlašovacího modalu nyní používá nový tenký symbol `close` z místního `mh-symbols.svg`. Přístupný název „Zavřít přihlášení“ a chování tlačítka zůstaly zachovány.
- Build aktualizoval `templates.js` i společný `core.js`. Statická kontrola potvrdila symbol ve sprite, šabloně a obou výstupech, 840/840 nových odkazů na core a 42/42 na samostatnou šablonu; starých tokenů zůstalo 0. Service Worker cache `mysticka-hvezda-430f75364181`; asset snapshot uchovává 1 564 verzí.
- Vizuální velikost křížku a fokus/klávesnicové chování přihlášení ověří společný závěrečný browserový průchod. Produkce nedotčena.

### W04/W07 · zavírací ikona v dialogu členství · 18. října 2026

- Dialog pro zpětnou vazbu při správě členství nyní používá stejný lokální symbol `close` jako přihlášení. Doplnil jsem tlačítku jméno „Zavřít okno“; 20px SVG odpovídá velikosti ovládání v Atlas vzhledu. Tok pozastavení a zrušení členství se neměnil.
- `retention.js` se načítá na pěti relevantních stránkách; jejich všech 5/5 odkazů míří na nový bundle `20261018-retention-close`. Atlas CSS má nový token ve všech 918/918 stránkách a šablonách v inventáři, staré cílené odkazy jsou 0. Statická kontrola potvrdila symbol, název tlačítka, CSS i výstupní bundle; `git diff --check` nehlásí whitespace chyby.
- Build JS uspěl; Service Worker cache `mysticka-hvezda-840f5c8ef1ea`; snapshot archivuje 1 567 veřejných verzí. Samotný dialog, dotykovou velikost a klávesnicové zavření ověří závěrečný browserový běh. Kandidát lokální, produkce beze změny.

### QA oprava důkazu · cache verze hlavního JS · 18. října 2026

- Následný širší scan odkazů našel ještě 60 veřejných HTML stránek bez cache query, které předchozí hledání starého verzovaného tokenu nezahrnovalo (blog, homepage, zodiakální detaily, překlady a další katalogy). Doplnil jsem jim stejný token jako ostatním stránkám.
- Opakovaný statický scan teď potvrzuje všech 909/909 referencí na hlavní JS v 909 HTML souborech s tokenem `20261018-status-icons`, 0 starých tokenů a 0 nezverzovaných odkazů. Předchozí evidence 849 se týkala jen již verzovaných odkazů; nyní je úplné pokrytí doložené.

### W06 · zastaralá odpověď afirmace po změně znamení · 18. října 2026

- Při rychlém přepnutí znamení mohla pomalejší starší odpověď `/horoscope` přepsat afirmaci nově vybraného znamení; starší běh mohl také uložit chybné „naposledy zvolené“ znamení. `js/afirmace.js` nyní každému výběru přiřadí pořadové ID. Zastaralý úspěšný výsledek si ponechá cache pro své vlastní znamení, ale nepřepíše zobrazený text ani uloženou poslední volbu; zastaralý fallback se zahodí.
- `npm run build:js` uspěl a v `afirmace.html` je jediný odkaz na sestavený modul, nově s tokenem `20261018-request-order` (1/1 nových, 0 starých a 0 bez verze). Bundle staticky obsahuje guard před renderem, Service Worker zůstává `mysticka-hvezda-840f5c8ef1ea` a snapshot uchovává **1 569** veřejných verzí.
- `git diff --check` prošel; behaviorální závod a úložiště zatím nebyly testovány dle dohody o společném závěrečném průchodu. Kandidát je lokální, produkce beze změny; W06 zůstává otevřené do finální QA.

### W06 · zachování nové zprávy Andělské pošty při pomalém načtení · 18. října 2026

- Počáteční GET mohl doběhnout až po úspěšném POSTu a nahradit seznam staršími schválenými vzkazy. Klient nyní drží zprávy právě odeslané v této relaci zvlášť a při příchodu serverového seznamu je zachová, dokud se v něm neobjeví jejich ID (například po schválení). Neúspěšné GET už lokálně potvrzené zprávy nemaže; chybové upozornění se zobrazí nad nimi.
- `npm run build:js` uspěl; jediná HTML reference na modul dostala token `20261018-post-load-race` (1/1 nových, 0 starých a 0 bez verze). Minifikovaný bundle byl ověřen přímo přes větev GET, sloučení serverových a místních zpráv i zachování při chybě. Service Worker zůstává `mysticka-hvezda-840f5c8ef1ea`; asset snapshot uchovává **1 571** verzí. `git diff --check` prošel.
- Síťový závod, moderaci a zobrazení v prohlížeči ověříme v závěrečném QA dle dohody. Kandidát je lokální, produkce beze změny; W06 zůstává otevřené.

### W06 · stale odpověď při předvyplnění z profilu · 18. října 2026

- V natální kartě i partnerské shodě mohl pozdní `Auth.getProfile()` po odškrtnutí volby „Použít můj profil“ přepsat ručně upravená pole. Oba formuláře teď číslují požadavky a po čekání ověří, že běh je stále aktuální a checkbox zůstává zaškrtnutý; zastaralá odpověď ani její chyba už formulář nezmění.
- Úzký read-only audit potvrdil obě reprodukovatelné cesty. `npm run build:js` uspěl; jediný veřejný odkaz na každý modul používá token `20261018-profile-autofill-guard` (natál 1/1, synastrie 1/1). Přímá kontrola sestavených bundle potvrdila guard před prvním zapsáním do polí. `git diff --check` prošel; Service Worker zůstává `mysticka-hvezda-840f5c8ef1ea`, snapshot **1 575** verzí.
- Přepnutí checkboxu, ruční editaci a opětovné zaškrtnutí ověříme v závěrečném browserovém běhu. Kandidát lokální, produkce beze změny; W06 zůstává otevřené.

### W04 · zbývající stavové a zavírací ikony · 18. října 2026

- Pět zavíracích tlačítek prémiových/freemium bannerů už místo samotného znaku `×` používá sdílený SVG symbol `close`; popisky tlačítek a stávající dotykové rozměry zůstaly zachované. Úspěch horoskopového odběru zobrazuje společný symbol `check` a čitelný stavový text. Ikona se vytváří bezpečně přes DOM a zůstane i po odeslání formuláře, které původně nahrazovalo celý obsah odstavce.
- `npm run build:js` uspěl; 80/80 veřejných odkazů na `horoscope-subscribe.js` nyní používá token `20261018-success-svg`, starých je 0 a nezverzovaných 0. Statický scan potvrdil všech 5/5 bannerových SVG místo starého křížku i symbol úspěchu ve výstupním bundlu. Service Worker cache zůstává `mysticka-hvezda-840f5c8ef1ea`; asset snapshot uchovává **1 577** verzí. `git diff --check` prošel.
- Vizuální zarovnání zavíracích ikon a úspěšného stavu v úzkém viewportu patří do závěrečné společné QA. Lokální kandidát, produkce beze změny; W04 zůstává otevřené.

### W06 · stav čekajícího vzkazu a čistá cache profilu · 18. října 2026

- Andělská pošta nyní u lokálně zachovaného vzkazu s `pendingReview` nevykresluje akci se srdíčkem; podpora zůstává dostupná jen pro veřejné schválené vzkazy. `andelska-posta.html` používá token `20261018-pending-post-state`.
- Uložení nastavení profilu stále posílá `expectedUserId` API, ale při aktualizaci `Auth.user`, `localStorage.auth_user` a události `profile:updated` se interní pole odfiltruje. `profil.html` načítá dashboard s tokenem `20261018-cache-metadata-filter`.
- `npm run build:js` uspěl. Statická kontrola výstupů potvrdila podmínku `!pendingReview` před tvorbou akce i filtr `expectedUserId` při slučování cache. Service Worker cache je `mysticka-hvezda-18404b8b8923`; snapshot uchovává **1 582** veřejných verzí. `git diff --check` prošel pro dotčené zdroje a distribuční soubory.
- Moderaci a cache uživatele ověříme v závěrečném browserovém průchodu dle dohody; nyní neproběhly behaviorální testy. Kandidát je lokální, produkce beze změny; W06 zůstává otevřené.

### W06 · srdíčko dostupné jen u schváleného vzkazu · 18. října 2026

- Veřejný endpoint srdíčka nyní před RPC ověří, že požadované ID patří existujícímu schválenému záznamu; jinak vrátí 404. Nouzové ruční navýšení používá stejnou podmínku a kontroluje, zda se aktualizovaný záznam stále našel.
- `node --check server/routes/angel-post.js` a cílený ESLint prošly. API regresi a souběh se změnou moderace odkládám na závěrečný běh. Změna je lokální, nevyžaduje migraci ani změnu produkční databáze; produkce beze změny.

### W06 · zamezit duplicitnímu odeslání nastavení a změny hesla · 18. října 2026

- `saveSettings()` i `changePassword()` nyní nastaví synchronní module-level zámek před prvním asynchronním čekáním; opakovaný submit během čekání na CSRF nebo API se ignoruje. `finally` zámek uvolní po výsledku i chybě. Dashboard bundle v `profil.html` používá token `20261018-profile-submit-guards`.
- `npm run build:js` uspěl; Service Worker cache je `mysticka-hvezda-bc8cd03c1623` a snapshot uchovává **1 585** veřejných verzí. Cílený ESLint pro nastavení profilu/Andělskou poštu a serverovou cestu prošel; `node --check` i `git diff --check` prošly. Dvojitý Enter a neúspěšné retry ověří závěrečná regresní/browserová QA. Kandidát lokální, produkce beze změny.

### W10 · pravdivé označení kalkulačky aury · 18. října 2026

- Stránka podle zdrojového kódu sčítá číslice data narození a vrací jednu z devíti předem daných barev. Původní title, popis, Open Graph i tlačítko mohly naznačovat měření skutečné aury, přestože viditelný text už výsledek označoval za symbolický portrét.
- Metadata, WebApplication JSON-LD, hlavní nadpis, CTA a obě viditelné/strukturované FAQ nyní shodně popisují symbolický portrét z číslic narození a výslovně říkají, že neměří auru ani osobnost. Zachoval jsem dohledatelné téma „aura kalkulačka“ bez přehnaného příslibu. Statická kontrola JSON-LD prošla: oba bloky parsují, všechna 4 FAQ jsou viditelná a otázky odpovídají schématu; v kontrolovaných polích nezůstaly původní zavádějící fráze. Obsahové a vizuální přijetí zůstává na závěrečnou QA.

### W10 · jednotky výsledků biorytmů · 18. října 2026

- Křivka je normalizovaná matematická hodnota od −100 do +100, ale graf, osa i karty ji zobrazovaly jako procento. Odstranil jsem znak `%`, tooltip a asistivní popisek nyní hodnotu vysvětlují jako body modelové křivky; krátká poznámka přímo nad grafem říká, že nejde o kondici, náladu ani schopnosti. Výpočet sinusových cyklů a výkladové texty se nezměnily.
- OG text už neslibuje „silné a slabé dny“; description a WebApplication schema shodně vysvětlují matematický model. `biorytmy.html` načítá CSS i JS s tokenem `20261018-model-index-values`. `npm run build:js`, cílený ESLint, syntaxe JS a `git diff --check` prošly; snapshot eviduje **1 588** veřejných verzí. Výsledek, graf a úzký viewport ověříme při společné závěrečné QA.

### W10 · přesný a bezpečný výklad ANO/NE · 18. října 2026

- FAQ tarotu ano/ne doporučovalo ptát se na přijetí nabídky a označovalo výsledek jako „ještě ne“, ačkoli skutečné tři kategorie jsou ANO, NE a NEJASNÉ. Zpřesnil jsem průvodce na malý vratný krok a sjednotil FAQ, metadata i FAQ JSON-LD s kategoriemi, které vrací `js/tarot-ano-ne.js`. Výpočet ani přiřazení karet se nezměnily.
- Statická kontrola parsovala oba JSON-LD bloky a potvrdila shodu všech 5 viditelných FAQ s otázkami i odpověďmi ve schématu. Nenašla starý příklad přijetí nabídky ani štítek „ještě ne“. Neprováděl jsem browserové ani behaviorální testy; jazyk a zobrazení ověříme v závěrečné QA. Kandidát je lokální, produkce beze změny.

### W10 · pravdivé výsledky čínského zvěrokruhu · 18. října 2026

- Odstranil jsem z metadat slib „prognózy na rok 2026“. Vysvětlení i FAQ nyní označují znamení/živel za zjednodušenou symboliku, popisují, že nástroj používá jen rok a nepočítá začátek čínského nového roku pro lednové/únorové narození. Seznam kompatibility a živelné popisy nepředstírají ověřené vlastnosti ani hodnocení vztahu. Dynamický text rozdílných dvojic už nepředpovídá vášeň či nutné kompromisy; otázku obrací k rozhovoru a skutečné zkušenosti. Samotné přiřazení znamení a živlů zůstalo stejné; rozporná či jednostranná vztahová data jsou sjednocena pro obě pořadí zadání, rozporná dvojice zůstává bez jednoznačné klasifikace.
- Metadata, viditelné FAQ a FAQ JSON-LD byly sjednoceny; názvy trojic nyní používají stejné názvy zvířat jako kalkulačka. Kontrola mapy našla 13 jednostranných nebo rozporných dvojic; normalizace je teď zrcadlová a konfliktní páry ponechává bez jednoznačné klasifikace, takže pořadí partnerů už výsledek nemění. `npm run build:js` a cílený ESLint prošly; stránka načítá nový JS token `20261018-symbolic-copy`. Service Worker cache je `mysticka-hvezda-bc8cd03c1623`, snapshot **1 594** veřejných verzí. Browserové ověření výpočtu, lednového/únorového upozornění, obou typů párů, PNG a fontů zůstává ve společné závěrečné QA. Kandidát lokální, produkce beze změny.

### W10 · pravdivý vstup a symbolický výklad numerologie · 18. října 2026

- Čas narození sliboval „přesnější výpočet“, přesto výpočty čtyř numerologických hodnot nepoužívaly čas. Pole i jeho automatické předvyplnění z profilu jsem odstranil. Profilová volba nyní doplní jen datum; nepřepíše celé požadované rodné jméno uloženým křestním jménem. Opožděný požadavek z profilu už nepřepíše ručně zadané datum po odškrtnutí volby.
- Serverový prompt už dostává pouze vypočtené čtyři hodnoty, ne jméno, datum ani čas; fallback má stejné symbolické vymezení a nevymýšlí časový nebo roční cyklus. Nové řádky numerologické cache neukládají jméno, datum ani čas; verze SHA-256 klíče odděluje nový výklad od starých uložených odpovědí. Staré cache záznamy zůstaly nedotčené.
- `npm run build:js`, cílený ESLint a syntaxe serverových souborů prošly; statická kontrola nenašla v tomto toku čas narození ani falešný příslib přesnějšího výpočtu. Service Worker zůstává `mysticka-hvezda-bc8cd03c1623`, asset snapshot eviduje **1 596** verzí. Formulář, předvyplnění a nový výklad ověříme při závěrečné QA. Kandidát je lokální; produkce beze změny.

### W10 · sjednocení výpočtu a výkladu životního čísla · 18. října 2026

- Slovníkové heslo tvrdilo, že kalkulačka redukuje všechny číslice data postupně; ve skutečnosti nástroj redukuje den, měsíc a rok zvlášť, ponechává 11/22/33 v mezikrocích a následně redukuje jejich součet. Zdroj hesla, obě statické slovníkové stránky, index a navázaný blogový článek nyní uvádějí stejný postup a připouštějí odlišné numerologické školy.
- Zkrátil jsem článek a nahradil nepodložené charakteristiky lidí symbolickými tématy a otázkami k vlastní zkušenosti. Opravený CTA vede přímo na bezplatnou kalkulačku životní cesty; její title, popis i `BlogPosting` schema odpovídají. Opravil jsem i odhad čtení na dvě minuty a zafixoval fallbackové datum publikace na původní čas místo jeho automatického posouvání při příštím generování.
- Společná šablona a 45 existujících blogových výstupů už nepřisuzují týmu neověřenou „hlubokou znalost“; byline popisuje redakční tým a symbolický charakter témat. `generate-blog.js` ani `generate-dictionary.js` jsem nespouštěl, protože zapisují více výstupů a blogový generátor navíc načítá databázi.
- `node --check` pro oba zdrojové datové moduly, parse indexů/JSON-LD, porovnání zdroje se statickým článkem, názvy/popisy/index/schema i kontrola původního data prošly. Článek má 329 slov; stránka i index uvádějí 2 minuty. Kontrola potvrdila i novou společnou byline ve všech 45 odpovídajících statických článcích. Kalkulačka životní cesty zůstává se symbolickými tématy a praktickými otázkami. Behaviorální ani browserové testy zůstávají odložené do společné závěrečné QA. Kandidát lokální; produkce beze změny.
- Na [partnerské numerologii](../partnerska-numerologie.html) byl chybný návod, FAQ/JSON-LD i oba výpočty používaly součet všech číslic, ač odkazovaná kalkulačka samostatně redukuje den, měsíc a rok. Sjednotil jsem vysvětlení i příklady s reálnou metodou a oboustranně ověřil pět viditelných FAQ proti FAQPage JSON-LD. Datum změny stránky opraveno na 18. 10. 2026. Závěrečné browserové přijetí zůstává otevřené.
- Výsledkové štítky bezplatné kalkulačky byly bez označení snadno čitelné jako osobnostní vlastnosti; přímo před nimi se nyní zobrazí „Symbolická témata pro zamyšlení“. Výpočet i samotná témata zůstaly stejné.
- Audit 12 podstránek životních čísel našel výroky o vrozených schopnostech, předurčených vztazích a kariérách. Upravil jsem jejich společný zdroj `data/numerology-numbers.json` a šablonu: každý výsledek teď nabízí symbolické téma, otázky pro vztahy/práci a malý vratný krok; stránka výslovně odmítá osobnostní měření, skóre kompatibility i předpověď. Názvy/URL zůstaly. Generátor vytvořil 12 stránek a aktualizoval označený rozcestník; `numerologie:check` nechávám do společného závěru.
- Uzamčený náhled placené numerologie sliboval osobní cyklus a načasování, zatímco API generuje výklad ze čtyř čísel bez uživatelovy aktuální situace. Opravil jsem náhled na skutečný obsah služby a výslovně vyloučil cyklus i osobní předpověď. Zdroj `js/numerology.js` ještě musí projít společným JS buildem při závěrečném sestavení.

### W10 · přesný rozsah numerologických výkladů a osobního roku · 18. října 2026

- V rozcestníku a FAQ bylo napsáno, že členství obsahuje výklad všech čísel a osobních cyklů a že AI navazuje na konkrétní otázku. API ve skutečnosti generuje jen ze čtyř vypočtených hodnot jména a data. Viditelný text a FAQPage JSON-LD teď rozsah popisují přesně; navazující výkladové karty už netvrdí, že partnerská numerologie přidává skóre shody nebo dynamiku, kterou výpočet neposkytuje.
- Bezplatná kalkulačka životní cesty nabízela členský AI výklad „včetně osobních cyklů“. Nabídku jsem sjednotil se skutečným rozsahem AI; sdílené názvy 1–9 a 11/22/33 teď označují témata, ne předem dané osobnostní archetypy.
- Stránka osobního roku 2026 nyní popisuje postup používaný `calculatePersonalCycles` (samostatné redukce dne, měsíce a roku, zachování 11/22/33 v mezikrocích a redukce součtu). Příklad 14. 8. 2026 dává `5 + 8 + 1 = 14 → 5`. Doplňuje všech devět symbolických témat jako otázky, sjednocuje metadata a viditelné FAQ s FAQPage JSON-LD a odstraňuje tvrzení, že číslo předpovídá podporu nebo energii konkrétního roku.
- Zatím bez browserového/behaviorálního testu a bez JS buildu. Před závěrečnou QA je nutný `npm run build:js`, protože se změnil `js/utils/numerology-logic.js`; ověřit také `numerologie:check`. Kandidát zůstává lokální, produkce beze změny.

**Doplnění téže dávky:** zamčený i načítací stav nyní říká „AI výklad čtyř čísel“, místo neurčitého „plného/hloubkového rozboru“; opravený komentář už nesprávně neříká, že historie ukládá čas narození. Numerologická stránka odkazuje na nový token `20261018-symbolic-offer-copy`. Social preview osobního roku používá existující numerologickou grafiku místo obecného `other.webp`. Před finální QA stále zbývá sestavit distributované JS soubory a ověřit jejich verze.

**Další oprava numerologie:** cyklický panel už neoznačuje vypočtená čísla jako „dnešní vibrace“, „energii“ nebo „dlouhodobý vliv“; vysvětluje metodu a říká, že nejde o předpověď. Sjednotil jsem také zdrojová a runtime metadata numerologické stránky. U `/kalkulacka-cisla-osudu.html` runtime přepis nesprávně tvrdil, že datum narození vypočítá číslo osudu; nyní souhlasí se skutečným číslem životní cesty. Úprava `js/numerology.js`, `js/tool-pages-copy-fixes.js` a `js/secondary-pages-copy-fixes.js` vyžaduje finální build a aktualizované assety. Zatím bez buildu a bez behaviorálního/browserového ověření; kandidát lokální, produkce beze změny.

**Oprava společného runtime SEO přepisu:** `js/secondary-pages-copy-fixes.js` přepisoval už opravená metadata a WebApplication schema na `aura.html`, `biorytmy.html` a `cinsky-horoskop.html`: znovu sliboval měření aury/životní poslání, silné a slabé dny a předpověď na rok 2026. Přepsané title, description, OG i odpovídající schema nyní říkají, že jde o symbolickou barvu z data, matematický model a čínskou symboliku podle ročníku. Tyto tři stránky a numerologická kalkulačka už odkazují na novou verzi společného skriptu `20261018-symbolic-tool-metadata`. Zatím bez buildu a browserového ověření; W10 zůstává otevřené do finální QA.

**Doplnění numerologické dávky:** opraveno také FAQ na statické stránce osobního roku: popisuje postup, který stránka vysvětluje, a už netvrdí, že sama obsahuje kalkulačku. Zdroj `js/secondary-pages-copy-fixes.js` je opravený, ale jeho distribuovaný `js/dist/secondary-pages-copy-fixes.js` zatím zůstává starý; stejně tak čekají na závěrečný build další upravené JS zdroje. Všechny příslušné HTML reference mají nový cache token. Build a behaviorální/browserová kontrola zůstávají odložené na společný závěrečný průchod; kandidát lokální, produkce beze změny.

### W10 · osobní mapa: přirozenější a bezpečnější výklad · 18. října 2026

- Potvrdil jsem ve zdroji, že mapa má 20 stránkových sekcí, její období se ukládá při zahájení objednávky a uložená data se znovu používají při doručení; PDF i e-mail neslibují jiné datum ani obsah. Volitelný čas/místo narození API stále přijímá pro staré či přímé klienty, ale veřejný formulář je nepožaduje ani nepropaguje.
- Upravil jsem AI prompt: výslovně označuje datum/znamení za symbolický rámec, zakazuje odvozovat povahu, zdravotní stav či pocity druhých jako fakta, chrání proti pokynům vloženým do otázky a u měsíčních bodů žádá reflexi místo událostních předpovědí. Odstranil jsem i nucené opakování frází typu „poznáš to podle“, které výstupy šablonovalo.
- Změnil jsem několik pevných PDF postranních textů, které připisovaly napětí v těle jednoznačný význam nebo tvrdily, že určitý vztah „unese“ pravdu. Kroky nyní výslovně můžeš přeskočit; tělesné pocity samy neurčují příčinu ani rozhodnutí. Časové body jsou sjednocené jako pět zastavení uvnitř celého období, ne jako osobní kalendářní rok.
- Doručovací e-mail a FAQ už nenaznačují, že se věta výkladu později sama „naplní“. Oba texty nechávají čtenáři volbu, co přijme a zda se k PDF vrátí. Zatím bez testů, buildu PDF či živého modelu dle dohody o jednom závěrečném běhu; změny jsou pouze lokální a produkce beze změny.

### W10 · veřejná ukázka osobní mapy sladěna s novým promptem · 18. října 2026

- Fiktivní PDF ukázka nyní navazuje na otázku o hranicích ve vztazích místo nepodložených tvrzení o povaze Jany. Odstranil jsem slib nalezení partnera, finančního zlepšení a předpovídání vztahových či pracovních událostí; tělesné pocity už nejsou vydávány za důkaz nebo příčinu. Pět měsíčních bodů nabízí otázky k vlastní zkušenosti. Akční návrhy a rituál výslovně zůstávají volitelné.
- Opravil jsem zdvojený odstavec v pracovní části a zjemnil opakované pokyny. Změněna jsou jen data veřejného vzorku v `samplePersonalMapData`; struktura 20stránkového PDF a fulfillment se neměnily.
- Veřejná modelová PDF ukázka i obrazové náhledy jsou znovu vygenerované z opraveného `samplePersonalMapData` skriptem `npm run render:personal-map-assets`; aktualizované jsou oba PDF soubory, obálka, tři ukázkové strany, kontaktní přehled, sdílecí obrázek i všechny používané `srcset` varianty. Renderer nyní responzivní soubory tvoří při každém běhu, takže odpovídají novému originálu. V prostředí chyběl Playwright Chromium, proto renderer použil místní Chrome přes podporovaný executable override. Vizuální přijetí a regresní test zůstávají na závěrečný společný běh. Kandidát lokální, produkce beze změny.

### W11 · lokalizace společného přihlašovacího modalu · 18. října 2026

- Přihlášení, registrace a obnova hesla ve slovenštině a polštině nyní používají překlady štítků, stavů, validace a klientských chyb. Chyby zůstávají viditelné i přímo ve formuláři jako přístupný alert; chybové odpovědi API se mapují podle kódu/stavu na srozumitelný text příslušného jazyka. Čeština zůstává pro české stránky beze změny.
- Stav formuláře je nyní `data-mode` (`login`, `register`, `reset`), takže volba režimu nezávisí na textu tlačítka. Odkazy na dosud pouze české podmínky a zásady soukromí to otevřeně uvádějí u odkazů.
- Přidána cílená E2E regrese pro SK/PL texty, přepínání režimů, označení jazyka právních dokumentů a obnovu hesla. Test nebyl spuštěn. `npm run build:js` nyní sestavil `js/dist/templates.js`, `js/dist/auth-client.js` i `js/dist/prihlaseni.js`; Auth kontrola našla nula zastaralých referencí. Závěrečná browserová a aplikační QA zůstává otevřená, proto W11 není uzavřené. Kandidát je lokální, produkce beze změny.

### W04 · poslední nalezený dekorativní symbol v blogových metadatech · 18. října 2026

- Následná kontrola našla po osmi původních článcích ještě datum s emoji v `blog/uplnek-v-kozorohovi-ritual-a-vyznam.html`; odstraněno bylo pouze `📅` před datem. Článek, jeho obsah i rozvržení se nezměnily.
- Statická plošná kontrola metadat a vizuální kontrola zůstávají součástí závěrečné QA. Kandidát lokální, produkce beze změny.

### W09 · dlouhý nerozdělitelný text ve sdíleném exportu · 18. října 2026

- Sdílecí canvas nyní dělí příliš dlouhé tokeny po grafémových shlucích, pokud jsou dostupné, a kontroluje šířku každého viditelného řádku. Výpustka tak ošetří i přetečení textu bez vynechaných řádků.
- Doplněna cílená regrese pro zalomení dlouhého tokenu a oříznutí přetékajícího viditelného řádku. Test zůstává nespouštěný do závěrečného běhu. Navazující projektový build 18. 10. úspěšně sestavil `js/dist`, cache Service Workeru je `mysticka-hvezda-5cfd5fb9c8aa` a archiv zachovává **1 830** verzí; `share-image-canvas.js` je v precache. Vizuální kontrola čeká. Kandidát lokální, produkce beze změny.

### W11 · vyčištění chyb při přepnutí režimu a sladění povrchu modalu · 18. října 2026

- Po neúspěšném přihlášení nebo registraci se inline chyba nyní smaže při přepnutí mezi těmito režimy. Lokalizační E2E regrese ověří slovenskou i polskou zprávu o chybném přihlášení i její skrytí po přepnutí na registraci; test zůstává odložený do závěrečného běhu.
- Společný přihlašovací modal už nepoužívá starou fialovou plochu: pozadí a zlatý okraj odpovídají současnému atlasovému povrchu. Při odesílání přihlášení/registrace se submit synchronně zamkne, režim nelze změnit během čekající odpovědi a formulář oznámí `aria-busy`; chyba se před novým požadavkem smaže a tlačítko se uvolní i při chybě. Přidaná regrese duplicitního odeslání a změny režimu čeká na závěrečný běh.
- Zdrojové CSS, distribuované bundle/cache verze, vizuální kontrola a všechny testy čekají na finální QA. Kandidát lokální, produkce beze změny; W11 zůstává otevřené.

**Navazující kontrola přihlášení:** během přihlášení/registrace v modalu už nejde upravit žádné vstupní pole; reset hesla zamyká e-mail a oznamuje `aria-busy`. Přidaná E2E regrese ověřuje zamčení a obnovení polí při selhání přihlášení i čekajícím resetu, včetně jediného reset requestu. Testy se spustí až v závěrečném průchodu; build, vizuální kontrola a produkce beze změny.

### W06 · souběžné odeslání na samostatné přihlašovací stránce · 18. října 2026

- Samostatný formulář `/prihlaseni.html` nyní synchronně zamkne opakovaný submit při čekajícím přihlášení/registraci. Režim, odkaz na obnovu a přechod z checkoutu na přihlášení se během požadavku nepřepnou; `aria-busy` a tlačítko se obnoví v `finally`, včetně registrační obnovy pro existující účet.
- E-mail, heslo a souhlas při registraci jsou během požadavku také zamčené; chybný výsledek tak nemůže patřit k jiným údajům, než které jsou právě vidět. V `finally` se obnoví jejich předchozí disabled stav.
- Přidána cílená E2E regrese pro pomalou odpověď, zamčená pole, pokus o druhé odeslání a přepnutí režimu. Test nebyl spuštěn dle dohody o jednom závěrečném běhu. Distribuovaný bundle/cache refresh a browser QA čekají na závěrečný průchod; kandidát lokální, produkce beze změny.

### W06 · souběžný reset hesla · 18. října 2026

- Obnova hesla v `/prihlaseni.html` nyní zablokuje druhé odeslání, během čekání uzamkne obě pole hesla a oznámí `aria-busy`. `finally` obnoví původní stav polí a tlačítka i při chybě.
- Přidána cílená E2E regrese pro pomalou odpověď, právě jeden požadavek a obnovení stavu po úspěchu. Zatím nespouštěna; distribuovaný bundle a cache verze, vizuální kontrola resetu a závěrečný testovací běh zůstávají otevřené. Kandidát lokální, produkce beze změny.

### W06 · žádost o obnovu hesla během čekajícího API · 18. října 2026

- Formulář „Zapomenuté heslo“ nyní u čekající žádosti zamkne e-mail, ohlásí stav `aria-busy` a nepřijme opakovaný submit ani programově vyvolaný. Po výsledku obnoví předchozí stav e-mailu a tlačítka.
- Přidána cílená E2E regrese pro odloženou odpověď, jediný požadavek a odemčení po úspěchu. Test čeká na společnou závěrečnou QA; distribuovaný bundle, cache verze a browserová kontrola zůstávají otevřené. Kandidát lokální, produkce beze změny.

### W10 · pravdivé očekávání při obnově hesla · 18. října 2026

- `/api/auth/forgot-password` záměrně vrací obecný úspěch kvůli ochraně účtů, i když Supabase hlásí chybu při žádosti o e-mail. Ve formuláři, modalu i v CS/SK/PL textech proto už není zaručené, že odkaz přijde; zpráva zachovává soukromí a říká, že žádost lze opakovat, pokud odkaz nedorazí.
- Cílená E2E očekávání pokrývají českou, slovenskou a polskou zprávu; nebyla spuštěna. Build/cache refresh a závěrečné zobrazení v prohlížeči čekají na společnou QA. Kandidát lokální, produkce beze změny.


**W10 · hlas numerologie:** následná kontrola našla vykání v runtime titulku formuláře a v dynamickém nečlenském náhledu, přestože zbytek stránky tyká. Zdrojové texty jsou sjednocené; připravená E2E regrese kontroluje titulek i náhled. Build, testy a vizuální přijetí jsou odložené do jednoho závěrečného průchodu. Kandidát lokální, produkce beze změny.


**W10 · hlas Hvězdného průvodce:** runtime přepis vracel vykání a slib „najít klid“, který neodpovídal tónu ani přesnému popisu automatického chatu na stránce. Text nyní tyká a říká, že průvodce nabídne podněty podle popsané situace. Připravená E2E kontrola čeká na jediný závěrečný běh.


**W06 · uložení premium numerologie:** read-only audit `gpt-5.6-luna` našel `readingOwnerId` zachycené ve submit handleru, ale nepředané do funkce s AI výkladem. Premium uložení by kvůli `ReferenceError` selhalo. ID se nyní předává explicitně až do `Auth.saveReading`; připravená regresní E2E kontrola ověřuje zachování účtu i dat. Test/build čekají na závěrečný průchod.


### W06 · skrytí natálního výsledku po změně účtu · 18. října 2026

- Zdrojový audit potvrdil, že `Auth.saveReading` odmítne zapsat výklad pod jiný účet, ale natální graf a opožděný AI text se před tím mohly vykreslit do nově přihlášené relace. `js/natal-chart.js` teď ukládá snímek přihlášení a ID uživatele na začátku výpočtu a ověřuje jej po výpočtu mapy, po AI odpovědi a po zápisu do profilu.
- Při změně relace se zahodí planetární mapa, výklad i tranzity, zneplatní se opožděné vykreslení tranzitů a formulář zobrazí možnost výpočet zopakovat. Přidána E2E regrese s odloženou AI odpovědí a změnou účtu; očekává skrytí starého výsledku a obnovené tlačítko. Test nebyl spuštěn.
- Build, testy a browserové ověření zůstávají odložené do společného závěrečného průchodu. Kandidát lokální, produkce beze změny.


### W06 · soukromí partnerské shody při změně účtu · 18. října 2026

- Zdrojový audit našel, že kontrola při uložení chránila vlastníka záznamu, ale dříve zobrazené skóre, čekající AI výklad i profilové předvyplnění mohly po změně účtu obsahovat data předchozí relace. `js/synastry.js` nyní ověřuje relaci při načítání profilu, výpočtu, API, postupném vykreslování i uložení.
- Při změně relace se zruší čekající předvyplnění, skryje starý výsledek, odstraní osobní vstupy a tlačítko oblíbených; opožděná odpověď se už nevykreslí ani neuloží. Dvě E2E regrese pokrývají pozdní předvyplnění i pozdržený AI výklad. Nebyly spuštěny.
- Read-only review pomocníka `gpt-5.6-luna` (low) potvrdil kontroly na všech asynchronních hranicích a věrnost testovací simulace; navrhl žádnou změnu zdroje ani testu.
- Build, test, browserová kontrola a produkce zůstávají beze změny do společného závěrečného průchodu.

**Doplnění partnerské shody:** ochrana nyní sleduje i profilové údaje, které se načetly úspěšně před změnou účtu. Přidána třetí cílená E2E regrese pro vymazání jména, data, času a místa po změně relace. Read-only review `gpt-5.6-luna` potvrdil vyčištění načtených údajů; test nebyl spuštěn.

### W06 · ochrana astrokartografie při změně účtu · 18. října 2026

- `js/astro-map.js` nyní ověřuje identitu relace při profilovém předvyplnění, po odpovědi mapového API, před uložením výsledku i po něm. Změna účtu ruší čekající práci; při návratu staré odpovědi se její výsledek už nezobrazí ani nepřidá mezi oblíbené.
- Při přepnutí se vyčistí osobní vstupy, předchozí výklad, planetární čáry, městské značky, tooltip i tlačítko oblíbených. Nové načítání také odstraní vizuální zbytky předchozí mapy. Běžící výpočet synchronně blokuje druhý submit, uzamkne formulář a oznámí `aria-busy`; `finally` obnoví původní stav.
- Přidány tři cílené E2E scénáře: opožděné profilové předvyplnění, úspěšně načtené profilové údaje po změně účtu a pozdržený premium výsledek. Read-only review `gpt-5.6-luna` nenašel konkrétní problém. Testy ani build nebyly spuštěny.
- Změny jsou pouze v lokálním kandidátu; společný závěrečný build, testy, browserová kontrola a produkce zůstávají beze změny.

### W06 · ochrana Křišťálové koule při změně účtu · 18. října 2026

- `js/crystal-ball.js` váže čekající i zobrazený výklad na přihlášení a ID účtu, které požadavek zahájily. Relaci ověřuje po CSRF, odpovědi API, animaci textu i uložení do historie; `auth:changed` a změna `auth_user` v jiném okně zneplatní čekající odpověď.
- Při přepnutí účtu se vyčistí otázka, předchozí odpověď, historie navazujících dotazů i akce oblíbených. Pozdní odpověď se nevykreslí a neuloží pod druhý účet.
- Přidána E2E regrese s pozdrženou odpovědí, změnou identity a ověřením nulového uložení. Test nebyl spuštěn; build, browser QA a společná závěrečná sada zůstávají odložené. Změna je lokální, produkce beze změny.

### W06 · ochrana runového výkladu při změně účtu · 18. října 2026

- `js/runes.js` svazuje osobní runový výklad s relací, která ho vyžádala; kontroluje ji po CSRF, odpovědi API a uložení. Při změně účtu odstraní záměr, odpověď, chybový stav, oblíbenou akci a rozpracovaný kontext návratu.
- Uložení používá zachycené ID vlastníka. Zrušený požadavek už po pozdním návratu nemůže zobrazit výklad ani tlačítko pod jiným účtem; běžný denní tah runy zůstává zachovaný, protože není osobní.
- Přidána cílená E2E regrese s pozdrženou odpovědí a přepnutím účtu. Test, build a browser QA zůstávají odložené do společného závěrečného průchodu; lokální kandidát, produkce beze změny.

### W06 · ochrana numerologických údajů při změně účtu · 18. října 2026

- `js/numerology.js` svazuje výpočet i profilové předvyplnění s relací, která je zahájila. Změna identity zneplatní čekající AI odpověď a profilový požadavek, vyčistí formulář, zobrazená čísla, osobní cykly i sdílecí náhled; starý výklad se neuloží pod další účet.
- Přidány cílené E2E regrese pro pozdržený výklad i opožděné profilové datum. Stávající kontrola předání vlastníka při uložení zůstává, ale nově nezkouší zachovat starý výsledek po skutečné změně účtu.
- Testy, build a browser QA zůstávají odložené do společné závěrečné fáze. Změny jsou lokální, produkce beze změny.

### W06 · doplnění resetu osobních cyklů numerologie · 18. října 2026

- Cílený E2E scénář nyní kontroluje, že po změně účtu nezůstanou v DOM ani hodnoty osobního roku, měsíce a dne. Rozšířená kontrola navazuje na již implementované skrytí a vyčištění numerologických cyklů.
- Testy/build zůstávají odložené do společného závěrečného průchodu.

### W06 · ochrana Šamanského kola při změně účtu · 18. října 2026

- `js/shamansko-kolo.js` nyní váže čekající i zobrazený osobní výsledek na přihlášení a ID účtu. Změna relace zruší požadavek, obnoví ovládání formuláře a odstraní jméno, datum narození, výsledek, prémiový text, zvýraznění kompasu, oblíbenou akci i osobní sdílecí odkazy.
- Přidána E2E regrese s pozdrženou odpovědí, přepnutím účtu a návratem starého API mocku; ověřuje vyčištění formuláře, skrytí výsledku a nulové uložení pod jinou relaci.
- Testy/build/browser QA čekají na společný závěrečný průchod. Kandidát zůstává lokální, produkce beze změny.

### W06 · ochrana tarotového rozkladu při změně účtu · 18. října 2026

- `js/tarot.js` nyní kontroluje relaci během míchání, otáčení karet, tvorby souhrnu i po zápisu do historie. Změna účtu zneplatní právě běžící tah, přeruší čekající souhrn a vymaže zobrazený rozklad, otázku navazující z ANO/NE, oblíbenou akci i uložené ID výsledku.
- Inicializační událost autentizace pouze nastaví výchozí relaci, aby se neztratil záměrně předaný kontext otázky po návratu z registrace; další skutečné přepnutí jej vyčistí.
- Přidány E2E regrese pro přepnutí během animace, po zobrazení výsledku a během pozdrženého AI souhrnu tří karet. Starý výsledek se nemá vykreslit ani zůstat dostupný po změně relace.
- Testy, build a browser QA zůstávají odložené na společný závěrečný průchod. Pouze lokální kandidát; produkce beze změny.

### W06 · osobní hluboký vhled andělské karty · 18. října 2026

- Hluboký AI vhled se nyní váže na účet, který jej vyžádal. Změna relace přeruší požadavek, vyčistí osobní odpověď a stav načítání, odstraní oblíbenou akci; pozdní odpověď se nevykreslí ani neuloží do jiné relace.
- Obecná Karta dne a její zobrazený výsledek při přepnutí zůstávají zachované. Dvě E2E regrese pokrývají opožděnou odpověď i opožděné uložení a ověřují, že se pod novým účtem neobjeví starý vhled ani oblíbená akce.
- Read-only review `gpt-5.6-luna` nenašel konkrétní problém. Opraven starší E2E čítač uložení, který chybně odkazoval na proměnnou z jiné JavaScriptové stránky.
- Test, build a browser QA čekají na společný závěrečný průchod. Kandidát lokální, produkce beze změny.

### W06 · ochrana minulého života při změně účtu · 18. října 2026

- `js/minuly-zivot.js` váže osobní formulář a výsledek na relaci, která zahájila výklad. Při změně účtu se zruší běžící požadavek, smažou osobní vstupy, rozepsaný kontext, náhled i výsledek; opožděná odpověď nebo zápis už nepřidá obsah k jinému účtu.
- Opraven také timeout 15 s při získání CSRF: nyní ruší stejný `AbortController`, jehož signál používá skutečné CSRF i následné API volání. Read-only druhá kontrola potvrdila propojení timeoutu, generace relace i obou připravených E2E regresí.
- E2E scénáře pokrývají opožděnou odpověď a opožděné uložení po změně účtu. Nebyly spuštěny; distribuovaný bundle, závěrečný test a browser QA čekají na společný průchod. Kandidát lokální, produkce beze změny.

### W06 · soukromí konverzace Hvězdného průvodce · 18. října 2026

- `js/mentor.js` při změně identity přeruší historii i chat, vymaže zprávy, předvyplněnou otázku a limitní stav předchozí relace, obnoví formulář a načte historii nového účtu. Pozdní odpověď starého účtu už nesmí změnit nový chat.
- Přidány dvě E2E regrese pro opožděnou historii a opožděnou chat odpověď. Read-only review zdroje, dist, cache odkazu a testovacích mocků nenašel konkrétní chybu.
- Cíleně sestaven `js/dist/mentor.js` z aktuálního zdroje; `mentor.html` načítá token `20261018-session-privacy`. Testy ani browser QA neběžely. Kandidát lokální, produkce beze změny.

### W06 · ochrana horoskopu a rituálního deníku při změně účtu · 18. října 2026

- Horoskop při změně identity zneplatní čekající výklad, vyčistí osobní obsah, oblíbené a zpětnou vazbu. Výchozí text obnovuje z původního HTML, aby reset zůstal správně česky, slovensky i polsky. Připraveny E2E regrese pro zobrazený výklad a pozdní odpověď.
- Rituální seance při změně účtu vyčistí zápisek, náladu i stav uložení a vrátí průběh na začátek. Opožděné uložení nemůže změnit UI nové relace; připraveny dvě cílené regresní kontroly.
- Read-only audit `gpt-5.6-luna` nenašel další konkrétní chybu. `js/dist/ritualy-session.js` cíleně sestaven, cache token stránky aktualizován. Testy a browser QA zůstávají odložené na závěrečný společný průchod; lokální kandidát, produkce beze změny.

### W06 · profilové relace, stránkování a návrat z platby · 18. října 2026

- Opravené závody v historii při změně filtru a změně účtu z jiné karty; opožděná stránka už nemůže ponechat stránkování zamčené ani přidat záznam do nové relace.
- Opožděné ověření Checkoutu váže aktivační stav na původní účet. Numerologie při změně účtu maže osobní rok, měsíc i den.
- Připraveny E2E regrese; scénář Šamanského kola nyní simuluje skutečnou `StorageEvent`. Testy a browser QA zůstávají odložené na závěrečný společný průchod.
- Cíleně sestaveny profilový a numerologický bundle, obnoven manifest Service Workeru a asset snapshot (1 630 verzí; cache `mysticka-hvezda-c55dacd4fa4c`). Změna je lokální, produkce beze změny.

### W06 · obnova relace po přepnutí účtu v jiné kartě · 18. října 2026

- Opraven sdílený Auth klient: opožděná obnova profilu, 401 ani čekající odhlášení účtu A nesmějí přepsat či odhlásit účet B.
- Připraveny tři cílené E2E regrese; nezpuštěné do závěrečného společného testování. Read-only kontrola pomocným agentem nenašla problém v ochranách ani mocku.
- Auth/core bundle sestaven, cache verze sjednocena na `20261018-auth-session-guard` v 915 HTML/generátorech, Service Worker obnoven (cache `mysticka-hvezda-ac6840e7f2a9`, archiv 1 634 assetů). Kandidát zůstává lokální.

### W06 · vlastník čekajícího tarotového výkladu · 18. října 2026

- Česká a slovenská ANO/NE stránka teď při uložení čekajícího výkladu zachytí `userId`, pokud byl uživatel přihlášený. Profil při obnově odmítá výklad, jehož uložené ID neodpovídá aktuálnímu účtu; anonymní výklad lze po přihlášení dál uložit.
- Když server potvrdí uložení právě probíhajícího požadavku, ale mezitím se změní relace, profil odstraní jen shodný dokončený požadavek a novému účtu neukáže ID výkladu ani potvrzovací zprávu. Serverová kontrola `expectedUserId` zůstává autoritativní.
- Přidány E2E regrese pro zachování vlastníka při vytvoření čekající položky a pro opožděné potvrzení po přepnutí účtu. Testy a browser QA čekají na společný závěrečný průchod.
- Cíleně sestaven český modul a slovenský skript; obě stránky načítají `20261018-pending-owner`. Service Worker cache zůstala `mysticka-hvezda-ac6840e7f2a9` (měněné skripty nejsou v precache manifestu), asset snapshot uchovává 1 639 veřejných verzí. Lokální kandidát, produkce beze změny.

### W06 · pravdivé limity a odolnost úložiště ve freemium bannerech · 18. října 2026

- Odstraněny lokální odpočty, které neodpovídaly serveru: horoskopy nemají kvótu 3 denních výkladů; křišťálová koule zobrazuje skutečné podmínky (první bezplatná otázka bez registrace, až 3 otázky denně pro bezplatný účet) bez odhadu z `localStorage`; Hvězdný průvodce už neukazuje počet z nesprávného klíče ani místní časové zóny.
- Tarotový a runový banner už nevyžadují `localStorage`. Tarotový jednorázový náhled pokračuje i při blokovaném úložišti; kontrola uložené runy při blokaci storage neshodí inicializaci stránky. Runový banner popisuje bezplatný základní tah a členský hlubší výklad; každodenní blokace tahu zůstává jen v prohlížeči.
- Přihlášený limit Křišťálové koule spoléhá na DB kvótu; anonymní registrační brána používá jen měkký httpOnly cookie čítač, bez DB kontroly. Cookie lze smazat nebo obejít souběžnými požadavky, takže nejde o pevnou ani účtovou kvótu. Změněné odkazy JS mají nové cache tokeny v českých, slovenských a polských stránkách.
- Read-only audit `gpt-5.6-luna` (low) porovnal klientské bannery se serverovými limity; upozornil na falešný horoskopový čítač, nesoulad křišťálové koule, lokální povahu limitu run a časový rozdíl mentora. Návrhy byly zohledněny; žádná databáze ani produkce nebyla čtena či měněna.
- Cíleně sestaveno 8 klientských JS entry z aktuálních zdrojů; Service Worker má cache `mysticka-hvezda-f182d28de6a4`, asset snapshot uchovává 1 683 veřejných verzí. Aplikační testy a browser QA nebyly spuštěny a zůstávají na společný závěrečný průchod. Kandidát lokální, produkce beze změny.

### W06 · atomické denní kvóty AI nástrojů · 18. října 2026 · nejnovější checkpoint

- Přihlášená bezplatná použití Hvězdného průvodce a Křišťálové koule nyní před generováním rezervuje server v samostatných denních DB čítačích. Rezervace se po výsledku potvrdí a při chybě generování mentora uvolní. Úspěšný výsledek mentora se zobrazí i při výpadku ukládání historie a odpověď klienta tento stav vysvětlí. Historie mentora řadí zprávy podle času a databázového ID, takže otázka zůstane před odpovědí i při stejném časovém razítku.
- Přidána migrace `supabase/migrations/20261018075356_user_daily_quota_reservations.sql`: RLS tabulky bez přímého přístupu uživatelů, RPC s pevným `search_path` a `EXECUTE` jen pro `service_role`, backfill dnešní spotřeby z uložené historie a úklid rezervací starších 90 dnů. Backfill zachytí jen dříve uložené výklady; nepersistované požadavky nelze zpětně rekonstruovat. Nevyřízený slot po tvrdém pádu procesu zůstane v čítači do půlnoci UTC; tím zůstává limit fail-closed, i když dočasně může ubýt jedno bezplatné použití. CLI v2.121.0 migraci vytvořilo. **Migrace je pouze lokální; nebyla spuštěna v žádné DB.** Před nasazením serveru ji musí obsluha aplikovat a ověřit v izolovaném prostředí.
- Upravený mock Supabase věrněji simuluje kvóty. Připraveny regresní scénáře pro čtyři souběžné požadavky mentora i Křišťálové koule, opakování po chybě modelu, backfill stávající spotřeby a selhání kvótového RPC. Nejsou spuštěné; podle Pavlova pokynu zůstávají aplikační testy a browser QA na jediný společný závěrečný běh.
- `js/dist/mentor.js` byl znovu sestaven z `js/mentor.js`; `mentor.html` odkazuje na token `20261018-atomic-quota-v2`. Zastaralé E2E fixture pro klientský čítač, přihlášení a překryvný paywall jsou upravené na skutečný serverový 402 a zprávu v chatu; přidána kontrola, že 403 zůstane chybou, ne paywallem. Service Worker zůstal `mysticka-hvezda-f182d28de6a4`; asset snapshot uchovává 1 687 verzí. Cílený Jest: **21/21**; lint, syntaxe a diff check prošly. Širší Chromium výběr měl nejprve 28/36 kvůli zastaralým fixture; všech 8 tehdy selhávajících scénářů po opravě cíleně prošlo. Celý 36-testový sweep po opravě nebyl znovu spuštěn. Migrace neověřená proti DB; browser testy používají lokální mock API.
- Zbývá ověřit selhání RPC/DB, hranici 3./4. použití pro oba nástroje, souběh na skutečném Postgresu, UTC přechod dne a UI zprávy. Fallback Křišťálové koule se počítá jako doručená odpověď a spotřebuje jedno použití. Anonymní Křišťálová koule používá měkkou httpOnly cookie; smazáním/úpravou cookie nebo souběžnými požadavky lze registrační bránu obejít. Pokud má být 1 otázka skutečnou kvótou, je potřeba serverové úložiště svázané s identitou či jiný sdílený mechanismus; současný stav je pouze UX brána.
- Kandidát je pouze lokální. Produkční DB ani aplikace se nezměnily. Nová serverová větev vyžaduje migraci aplikovanou před deployem.

### W06 follow-up · pravdivé FAQ pro tarot a křišťálovou kouli · 18. října 2026

- `tarot-zdarma.html` už neslibuje bezplatným účtům tři denní výklady ani historii; text nyní odpovídá nabídce jedné bezplatné karty a členským vícekaretním rozkladům.
- `kristalova-koule.html` i FAQ strukturovaná data popisují první otázku bez registrace, až tři otázky denně s bezplatným účtem a provozní limity členství. Dřívější obecné „můžeš se ptát opakovaně“ mohlo mylně naznačovat neomezené bezplatné použití.
- Zdrojové ověření: `server/routes/oracle.js` limity křišťálové koule a tarotu; klientský tarot dovoluje měkký náhled jedné karty a server odmítá vícekaretný požadavek bez Premium. Chyba nebo neplatný výsledek DB dotazu na přihlášený denní limit nyní vrací lokalizovanou dočasnou chybu 503 místo pokračování bez ověřené kvóty. Anonymní cookie je pouze měkká registrační brána a lze ji resetovat.
- **Původní P1 – vyřešeno v lokálním kandidátu:** přihlášené účty rezervují denní použití atomicky přes DB RPC; dočasná migrace vznikla přes Supabase CLI v2.121.0. Databáze ale zatím nebyla migrována, takže novou serverovou větev nelze nasadit před aplikací migrace.
- Před rolloutem ověřit fail-closed chování při DB chybě a 3./4. použití. Anonymní první/druhá otázka nadále používá httpOnly cookie a je pouze měkkou registrační bránou; nejde o účtovou kvótu. Aplikační testy a browser QA čekají na společný závěrečný běh. Kandidát lokální, produkce beze změny.

### W06 follow-up · srozumitelná chyba a počítání zpráv mentora · 18. října 2026

- `server/mentor.js` při chybě nebo neplatném počtu zpráv vrací 503 místo pokračování bez ověřené kvóty. U bezplatného účtu také ověřuje výsledek vložení uživatelské zprávy; při chybě zápisu nevolá model.
- Obě počítací kontroly nyní používají konečné UTC okno `[dnešní půlnoc, zítřejší půlnoc)`, takže budoucí záznamy neovlivní dnešní limit. Read-only kontrola `gpt-5.6-luna` potvrdila, že současné 503 a ověření zápisu u mentora jsou fail-closed.
- `js/mentor.js` posílá jazyk stránky a zobrazuje chybu `error` z API; při síťové chybě ponechá obecné vysvětlení a otázku ve formuláři. Stránka používá `js/dist/mentor.js`, proto je nutné po dokončení změn zdroje obnovit bundle i cache token před závěrečnou QA.
- **Původní P1 – implementováno lokálně:** mentor i přihlášená Křišťálová koule používají serverovou atomickou rezervaci. Úspěšný výsledek se započítá bez ohledu na uložení historie; neúspěšné generování mentora rezervaci uvolní. Před nasazením je nutné aplikovat migraci `20261018075356_user_daily_quota_reservations.sql` a potvrdit ji v izolovaném prostředí.
- Aplikační testy ani browser QA zatím neběžely podle dohody o jednom společném závěrečném průchodu. Ověřit DB/RPC chyby, třetí/čtvrté použití, souběh, selhání generování, anonymní cookie, půlnoc UTC a zobrazení 503/402 v UI. Anonymní cookie zůstává měkkou registrační bránou; `reserve_ai_daily_request` je samostatný globální AI rozpočet. Kandidát lokální, produkce beze změny.

### W06 závěrečné ověření kandidáta · 18. října 2026

- Po úpravě E2E fixture proběhl celý cílený Chromium výběr mentora a souvisejících paywall scénářů: **36/36 prošlo** (`test-results/.last-run.json`: `passed`, žádná selhání). Cílené Jest serverové regrese: **21/21 prošly**; ESLint, `node --check` a `git diff --check` prošly.
- Jde o lokální mock API, nikoli ověření proti Supabase. Migrace `20261018075356_user_daily_quota_reservations.sql` zůstává neaplikovaná a vyžaduje kontrolu v izolované testovací databázi před případným vydáním. Produkce nebyla změněna.

### W12/W13 navazující krok · sjednocení distribuovaných assetů · 18. října 2026

- Po posledních zdrojových změnách proběhly `npm run build:js` a `npm run build:css`. Service Worker hash je `mysticka-hvezda-8c3fd28f8b7b`, asset archiv obsahuje **1 691** veřejných verzí; updater potvrdil, že manifest už odpovídá výstupu.
- Kontrola verzí CSS našla **0** zastaralých odkazů. Po rebuildu prošel cílený Chromium výběr **37/37**; navazující desktopový keyboard/Escape test sdílené hlavičky také **1/1**. ESLint dotčených E2E souborů a diff check prošly. Ověření zahrnulo oba header vstupy (pevný na homepage, načítaný na `/horoskopy.html`), avšak ne všechny stavy přihlášeného účtu, cílové URL ani legacy šablony.
- Toto připravuje jen lokální kandidát. Migrace denní kvóty i produkční rollout zůstávají neověřené a nedotčené.

### W12/W13 · společný JS/CSS build po posledních změnách · 18. října 2026

- `npm run build:js` a `npm run build:css` doběhly bez chyby. Kontrola `npm run css:asset-versions:check` našla **0** zastaralých CSS odkazů; cache Service Workeru je `mysticka-hvezda-4ae3a2e4b9b9` a snapshot uchovává **1 692** veřejných verzí assetů.
- Změna aktualizovala pouze lokální distribuované soubory a archiv assetů. Aplikační/browserové testy zůstávají odložené na jeden závěrečný společný průchod. Kandidát lokální, produkce beze změny.

### W04/W07 · SVG zavírací ikona detailu výkladu v profilu · 18. října 2026

- Modal v `profil.html` nahradil samotné „X“ stejným lokálním symbolem `close`, který používá přihlášení a dialog členství. Název tlačítka „Zavřít“, rozměr 44 × 44 px a fokusové styly zůstaly zachované; SVG je skryté před čtečkou.
- Statická kontrola potvrdila vazbu na existující symbol ve sprite a `git diff --check` prošel. Změna HTML nevyžadovala další JS/CSS build. Vizuální a klávesnicové přijetí čeká na závěrečnou společnou QA; lokální kandidát, produkce beze změny.

### W04/W07 · zbývající Lucide ikony profilu · 18. října 2026

- Profil nyní používá místní SVG sprite pro ukázkové i dynamické ikony výkladů, tlačítko odhlášení a skutečné astrologické glyfy znamení. Nepřesné ilustrativní ikony typu „ryba“ nebo „hora“ už znamení nenahrazují. Odstraněno načítání Lucide CDN i `lucide-init.js` z `profil.html` a nepotřebné překreslování ve třech profilech modulech.
- `profileIconMarkup` povoluje pouze pevně vyjmenované symboly a jednu známou variantu třídy; všechny statické odkazy a povolené dynamické názvy existují ve sprite. Read-only kontrola `gpt-5.6-sol` (low) potvrdila správnost aktivního import grafu, velikostí ikon a bezpečné interpolace.
- `npm run build:js` a `npm run build:css` uspěly; CSS kontrola našla **0** zastaralých referencí. Aktivní HTML/moduly a načítané profilové bundle/chunky neobsahují Lucide volání. Service Worker cache je `mysticka-hvezda-5fcb04320bf7`; asset snapshot uchovává **1 705** verzí.
- Závěrečná vizuální/klávesnicová QA profilu zůstává odložená podle dohody o jednom společném testovacím průchodu. Změna je jen v lokálním kandidátu, produkce beze změny; širší W04 audit ikon zůstává otevřený.

### W04 · stavová ikona uložených zápisků rituálu · 18. října 2026

- Potvrzení i chyba uložení zápisků používají společné symboly `check` a `warning` ze sprite. Skript mění pouze textový uzel a chybový symbol; české hlášení, `role="status"`/`role="alert"` i skrytý počáteční stav zůstávají zachované.
- Statická kontrola potvrdila vazby na existující SVG symboly a oddělený textový uzel. `npm run build:js` proběhl úspěšně, stránka načítá nový bundle a Service Worker cache zůstala aktuální (`mysticka-hvezda-fc5cb06366d0`). Přidána cílená regrese pro přepnutí ikony i role mezi chybou a potvrzením; běh testu i browser QA zůstávají odložené na závěrečný společný průchod. Lokální kandidát, produkce beze změny.

### W07 · statická kontrola reduced-motion v aktivním JavaScriptu · 18. října 2026

- Pomocník `gpt-6-luna` (low) read-only prověřil aktivní JS scroll a Web Animations API. Přímá animace částic profilu, tilt Andělských karet i animace partnerské shody mají větev pro `prefers-reduced-motion`; prohlédnuté smooth scroll cesty také respektují volbu. Neaktivní kurzor a nenapojený modul natální 3D animace nejsou veřejné běhy.
- Hlavní agent přímo ověřil uvedené zdrojové úseky a současnou CSS výjimku pro dechovou animaci rituálu. Nebyla potvrzena bezpečná zdrojová oprava. Jde pouze o statický audit; skutečné chování při zapnutém omezení pohybu zůstává v závěrečné W07/W13 browser QA. Produkce beze změny.

### W05/W10 · pravdivější vysvětlení Andělských karet · 18. října 2026

- V `andelske-karty.html` byla opakovaná jistota „vždy“ a „bezpodmínečná podpora“ nahrazena popisem symbolického podnětu k zamyšlení. Odstranil jsem i léčebné tvrzení o „uzdravení“ a zkrátil tři dlouhé odstavce na konkrétní vysvětlení balíčku, lokálního denního uložení a automaticky vznikajícího členského výkladu.
- Odpověď FAQ o rozdílu tarotu a andělských karet je stejná ve viditelném obsahu i FAQ JSON-LD; oba výklady jsou rámovány symbolicky, bez jistého tvrzení o budoucnosti. Statický `git diff --check` prošel. Testy ani browser QA neběžely, protože jsou vyhrazené na závěrečný průchod. HTML změna je lokální, produkce beze změny.

### W10 · cílená kontrola jistot v hlavních nástrojích · 18. října 2026

- Read-only vyhledání výrazů zaručujících budoucnost, léčbu nebo bezpodmínečné výsledky v 13 hlavních HTML nástrojích (tarot, horoskopy, natální karta, Křišťálová koule, runy, numerologie a Andělské karty) po konkrétní opravě Andělských karet neodhalilo další doložený slib. Výraz „budoucnost“ u tarotu je název pozice výkladu; stejná stránka výslovně říká, že karta budoucnost neurčuje.
- Jde pouze o statický textový průchod vybranými HTML soubory; dynamické výsledky modelů, databázové texty ani všechny detaily nejsou tímto uzavřené. Bez dalších úprav či testů.

### W06/W10 · pravdivé stavy hlubší andělské karty · 18. října 2026

- Načítací tlačítko a oblast výsledku už nepředstírají, že andělé osobně předávají či „šeptají“ sdělení. Stránka pravdivě oznamuje přípravu automatického výkladu k vytažené kartě; neúspěšný stav nyní používá stejné tykání v obou živých oblastech. API, generování a `aria-busy` zůstaly stejné.
- `andelske-karty.html` načítá nový token `20261018-angel-loading-copy`. `npm run build:js` proběhl úspěšně; statická kontrola potvrdila nové řetězce ve zdroji a escapeované podobě v minifikovaném bundle. Service Worker cache je `mysticka-hvezda-9ac2bc90c2b5`; `node scripts/snapshot-assets.mjs` uchoval **1 731** veřejných verzí.
- Do existujících E2E scénářů byly přidány/přesunuty aserce obou načítacích hlášek. Testy a browser QA zůstávají odložené na společný závěrečný průchod. `git diff --check` prošel; lokální kandidát, produkce beze změny.

### W06/W10 · pravdivé čekání u astro-mapy a horoskopu · 18. října 2026

- Astro-mapa nejdřív lokálně počítá mapové podklady a potom žádá model o jejich interpretaci. Obě viditelná místa (HTML fallback a pozdější přepis ve `secondary-pages-copy-fixes.js`) teď říkají „Počítám mapu a připravuji její symbolický výklad…“. Všech **23** HTML odkazů na tento společný bundle používá nový cache token `20261018-honest-astro-copy`.
- U aktivace horoskopu zmizelo tvrzení, že vzniká „první osobní horoskop“; skutečný výsledek je podle znamení a zvoleného období. Čekací nadpis teď jasně pojmenovává horoskop i znamení a je lokalizovaný pro CS/SK/PL. Stránka a bundle používají token `20261018-honest-activation-copy`.
- Read-only pomocník `gpt-6-luna` (low) našel dva kandidáty; hlavní agent ověřil runtime přepis astro-mapy a API tok. Existující horoskopový E2E scénář nyní drží odpověď, aby při finální QA ověřil skutečně viditelný čekací stav. `npm run build:js` uspěl, statická shoda zdrojů/bundlů a nových tokenů prošla. Service Worker cache zůstala `mysticka-hvezda-9ac2bc90c2b5` (tyto dva moduly nejsou v precache manifestu); asset snapshot uchovává **1 735** veřejných verzí.
- E2E ani browserová kontrola neběžely podle dohody. `git diff --check` prošel; lokální kandidát, produkce beze změny.

### W06 follow-up · prázdné datum po předchozím výpočtu a kontrola rendereru · 18. října 2026

- Read-only kontrola `gpt-6-luna` (low) našla, že prázdné datum v Aura kalkulačce ponechá předchozí viditelný portrét. Zdroj jsem ověřil a opravil: při editaci/vymazání data se předchozí výsledek i koule skryjí a vyčistí; pokus o výpočet bez data zobrazí chybu při poli, nastaví `aria-invalid` a ponechá možnost zadat datum znovu. Přidal jsem cílenou E2E regresi; podle dohody neběžela.
- V `numerologie.html` a společném `formatReadingHtml` jsem ověřil předběžný XSS nález: AI/cache text prochází DOMPurify s allowlistem, při jeho nedostupnosti se značky odstraní a obsah escapuje přes `textContent`. Potvrzenou injekční chybu jsem nenašel, zdroj jsem neměnil. Read-only kontrola biorytmů také nepotvrdila chybu asynchronního stavu.
- `npm run build:js` proběhl úspěšně; `aura.html` používá nový token `20261018-empty-date-validation`, Service Worker hash zůstává `mysticka-hvezda-9ac2bc90c2b5`, snapshot uchovává **1 737** veřejných verzí. Závěrečný test a browser QA zůstávají odložené; kandidát lokální, produkce beze změny.

### W06 follow-up · neplatné nové datum životního čísla · 18. října 2026

- Read-only kontrola `gpt-6-luna` (low) potvrdila, že po editaci vstupu a neplatném pokusu kalkulačka životního čísla nechala na stránce výsledek předchozího data. Teď se výsledek zneplatní při změně každého pole i před výpočtem; neplatné datum ponechá jen vysvětlující chybu a opravený vstup lze znovu spočítat. Přidána cílená E2E regrese.
- `npm run build:js` proběhl úspěšně. `kalkulacka-cisla-osudu.html` používá `20261018-stale-result-validation`; spolu s dřívější opravou aury jsou oba formulářové stavy zahrnuté v závěrečném výběru. `git diff --check` prošel, snapshot nyní uchovává **1 739** verzí; Service Worker hash zůstal `mysticka-hvezda-9ac2bc90c2b5`. Testy/prohlížeč odložené do konce; kandidát lokální, produkce beze změny.

### W06 follow-up · neplatný rok čínského horoskopu · 18. října 2026

- Read-only kontrola potvrdila, že prázdný/neplatný rok mohl ponechat předchozí výsledek viditelný a chyba byla signalizována jen barvou. Změna vstupu teď výsledek zneplatní; prázdný rok a desetinné nebo rozsahově neplatné hodnoty dostanou textovou chybu, `aria-invalid` a fokus se vrátí k poli. Výpočet přijímá jen celé roky 1900–2100. Rychlá volba zvířete zůstává dostupná.
- Přidán cílený E2E scénář pro předchozí výsledek, prázdný/desetinný vstup a úspěšné opakování; nebyl spuštěn podle dohody. `npm run build:js`, syntax check obou změněných JS souborů, statické ověření bundle/tokenu a `git diff --check` prošly. HTML token je `20261018-year-validation`; SW cache `mysticka-hvezda-9ac2bc90c2b5`, asset snapshot **1 741** verzí.
- Browser QA a všechny testy zůstávají odložené do jednoho závěrečného průchodu. Změna je lokální kandidát, produkce beze změny.

### W06 follow-up · čínská partnerská shoda · 18. října 2026

- Stejná stale-state chyba byla přítomná i v partnerské shodě na stránce čínského horoskopu. Po změně některého roku nebo po chybném odeslání se teď předchozí shoda schová; obě pole mají vlastní textovou chybovou hlášku propojenou s `aria-describedby` a přijímají jen celé roky 1900–2100. Výsledek je v HTML skrytý už při prvním načtení.
- Přidaná E2E regrese ověřuje platný výpočet, prázdný rok partnera, odstranění staré shody a nový výpočet. Test zůstává odložený na závěrečný běh. JS build, syntax checks, statické kontroly bundle/markup a `git diff --check` prošly. SW cache zůstala `mysticka-hvezda-9ac2bc90c2b5`; asset snapshot nyní obsahuje **1 743** verzí. Lokální kandidát, produkce beze změny.

### W06 follow-up · validace otázky Křišťálové koule · 18. října 2026

- Prázdný dotaz už nekončí jen vizuálním zatřesením koule nebo tichým návratem. V CS/SK/PL dostane textovou hlášku propojenou s polem; fokus se vrátí do otázky a chyba zmizí při psaní. Vstup i tlačítko/klávesa používají stejnou validaci a prázdný dotaz nevolá API.
- Přidán E2E scénář pro fokus, `aria-invalid`, chybovou zprávu a nulový počet API volání; nebyl spuštěn. `npm run build:js`, syntax checks obou zdrojů a E2E souborů, statická kontrola HTML/bundle a `git diff --check` prošly. Token `20261018-accessible-question-validation`; SW cache `mysticka-hvezda-b81572ba1a14`; asset snapshot **1 745** verzí. Testy/browser QA čekají na závěrečný průchod; pouze lokální kandidát.
- Read-only přezkoumání Minulého života vyvrátilo dílčí nález pomocníka: `#pl-error` už má `role="alert"` a `showError` při validaci dynamicky přiřadí `aria-describedby` neplatnému poli/skupině. Kód kvůli tomuto nálezu změněn nebyl.

### W06 · přístupný stav výpočtu astrokartografie · 18. října 2026

- `astro-mapa.html` nyní obsahuje samostatnou skrytou živou oblast. Když začne výpočet, oznámí přípravu; po úspěchu oznámí, kde je výsledek; při chybě přečte stručnou chybu, nikoli dlouhý výklad. Gate členství dostane vlastní srozumitelné oznámení. Vizuální loading ani dlouhý výsledek se čtečce nepřehrávají jako jediný blok.
- Přidána cílená E2E regrese načítání → chyba; nebyla spuštěna podle dohody o společném závěrečném běhu. `npm run build:js`, `node --check` zdroje, dist a E2E testu, statická kontrola odkazu/cache tokenu a `git diff --check` prošly. Service Worker cache `mysticka-hvezda-b81572ba1a14`, asset snapshot **1 747** verzí.
- Read-only nález, že biorytmy zobrazují prázdné výsledky při prvním načtení, se nepotvrdil: `css/pages/biorytmy.css` skrývá výstupní blok přes `display:none` a po výpočtu jej JS odkryje třídou `.mh-block-visible`. HTML ani CSS kvůli tomu změněny nebyly.
- Kandidát zůstává lokální. Produkce ani databáze se nezměnily; testy a browser QA čekají na společný závěrečný průchod.

### W06 · stručný asynchronní stav numerologického AI výkladu · 18. října 2026

- Přihlášený výsledek numerologie má samostatnou skrytou živou oblast: oznámí přípravu AI výkladu, hotový výsledek nebo bezpečný fallback; při chybě nabídne opakování a zachová vypočtená čísla. Samotný dlouhý výklad není vložen do `aria-live`.
- Rozšířena existující E2E regrese úspěšného prémiového výkladu o ověření zprávy při čekání a po dokončení. Běh zůstává odložený na společnou závěrečnou QA. `npm run build:js`, syntax checks zdrojů, dist a E2E souborů, statická kontrola tokenů/markup a snapshot prošly; Service Worker `mysticka-hvezda-b81572ba1a14`, asset snapshot **1 749** verzí.
- Kandidát je lokální; databáze a produkce beze změny. Závěrečné testy a asistivní technologie/prohlížeč zůstávají otevřené.

### W06 · živý stav partnerské shody · 18. října 2026

- Partnerská shoda nyní oznámí výpočet modelu, přípravu slovní analýzy a dostupný souhrn/výklad přes samostatnou skrytou živou oblast. Dlouhý text výkladu se nepřidává do oblasti; známé chyby dál používají vlastní `role="alert"` a při zneplatnění účtu se zastaralé „připravuji“ oznámení smaže.
- Rozšířeny existující E2E scénáře o kontrolu čekajícího stavu a dokončeného základního souhrnu; běh zůstává na jeden společný závěrečný průchod. `npm run build:js`, `node --check` zdroje, dist a E2E souboru, snapshot a statické ověření prošly. Service Worker `mysticka-hvezda-b81572ba1a14`, asset snapshot **1 751** verzí.
- Lokální kandidát; produkce beze změny. Asistivní technologie a browserové přijetí zůstávají otevřené.

### W06 · kontrola cache odkazů klientských stavů · 18. října 2026

- Po sestavení se ukázalo, že HTML numerologie a partnerské shody stále odkazovalo na předchozí query token, přestože dist soubor už obsahoval nové živé stavy. Odkazy nyní používají `20261018-live-status`; `astro-mapa.html` už má `20261018-accessible-map-status`.
- Statická kontrola ověřila, že všechny tři veřejné stránky mají vlastní očekávaný bundle a aktuální token. Bez dalších změn JS/Service Workeru; pouze lokální HTML kandidát.

### W06 · autofill osobních údajů ve výpočtových formulářích · 18. října 2026

- Astrokartografie a numerologie teď správně označují jméno a narozeniny pro browserový autofill; čas narození astrokartografie jej nepoužívá a zůstává vypnutý. Partnerská shoda povoluje autofill jen u návštěvníka v poli Osoba 1; druhou osobu browser nemá zaměnit za data majitele zařízení.
- Přidány statické E2E aserce pro autocomplete hodnoty. HTML stránkové tokeny klientských stavů zůstávají aktuální; JavaScript ani produkční data se neměnily. E2E běh čeká na společný konečný průchod.

### W06 · bezpečné vykreslení chyb astrokartografie · 18. října 2026

- Nabídka členství je nyní jediná větev, která smí předat předem sestavené HTML, a označuje se explicitním interním příznakem. Chyba z API se vždy vykreslí jako prostý text; její obsah už nerozhoduje o tom, zda se interpretuje jako markup.
- Přidána cílená E2E regrese s chybnou zprávou obsahující napodobení `<img onerror>` a `class="btn"`; test nebyl spuštěn. `npm run build:js`, syntaxe zdroje/dist/testu, verze stránky a asset snapshot prošly. `astro-mapa.html` nyní používá `20261018-safe-error-rendering`; Service Worker cache `mysticka-hvezda-b81572ba1a14`, snapshot **1 753** verzí.
- Pouze lokální kandidát. Aplikace, DB ani produkce se nezměnily; regrese zůstává na společný závěrečný běh.

### W06 · přístupný průběh natální karty · 18. října 2026

- Natální karta oznamuje čtečce obrazovky výpočet planet, připravenou základní mapu, čekání na osobní výklad, přihlášení/členství i připravený výsledek. Krátká oblast `#natal-status` je mimo výstupní blok, který je na začátku skrytý. Při změně účtu se její starý stav vymaže.
- Rozšířeny existující E2E scénáře o stav po výpočtu a vymazání při změně účtu; testy nebyly spuštěny. `npm run build:js`, syntax checks zdroje, dist a E2E souboru a statická kontrola HTML/bundlu prošly. Service Worker `mysticka-hvezda-b81572ba1a14`; asset snapshot **1 755** verzí.
- Pouze lokální kandidát, bez databázových nebo produkčních změn. Browser QA a E2E zůstávají na společný závěrečný průchod.

### W06/W10 · stav a označení náhradní afirmace · 18. října 2026

- Afirmace oznamují přípravu a hotový výsledek přes krátkou skrytou živou oblast. Při nedostupné službě oblast sdělí, že se zobrazuje připravená náhradní věta; věta se nevydává za právě vytvořený osobní text.
- Přidán odložený E2E scénář pro čekání a dokončení. Nebyl spuštěn. `npm run build:js`, syntax checks zdroje, dist a E2E souboru, kontrola cílového HTML/bundlu a `git diff --check` prošly. Service Worker `mysticka-hvezda-b81572ba1a14`; asset snapshot **1 757** verzí.
- Lokální kandidát. E2E a browserová kontrola zůstávají součástí jednoho závěrečného průchodu.

### W06 · přístupný průběh vícekartového tarotu · 18. října 2026

- Tarot nyní stručně oznamuje míchání, připravenou jednu kartu nebo členskou ukázku a přípravu/dokončení společného souhrnu. Dlouhý text zůstává mimo živou oblast; neúspěšný souhrn nadále hlásí existující `role="alert"`. Při změně účtu se status vyčistí.
- Pokud se souhrn podaří vytvořit, ale neuložit do profilu, výklad zůstane viditelný a zobrazí se samostatná zpráva o neúspěšném uložení. Dřívější `role="status"` na kontejneru dlouhého textu Keltského kříže bylo odstraněno.
- Přidány odložené E2E regrese pro čekání/hotový výsledek a zachování souhrnu při neúspěšném uložení; E2E nebylo spuštěno. `npm run build:js`, syntax checks zdrojů, dist a testů, `node scripts/refresh-auth-asset-versions.mjs` (0 zastaralých odkazů) a statické kontroly prošly. 54 HTML referencí používá nyní token `20261018-tarot-summary-a11y`; Service Worker `mysticka-hvezda-77f41448c5b4`; asset snapshot **1 764** verzí.
- Kandidát je lokální. Interakce a čtečka obrazovky čekají na závěrečnou QA.

### W06 · zachování horoskopu při chybě uložení do profilu · 18. října 2026

- Po vygenerování horoskopu zůstane výsledek viditelný i tehdy, když se jej nepodaří uložit do profilu. Stránka zobrazí krátkou lokalizovanou zprávu pro CS/SK/PL; při výběru dalšího znamení nebo změně účtu se zpráva odstraní.
- Přidána cílená E2E regrese pro neúspěšné uložení, podle dohody nebyla spuštěna. `npm run build:js`, syntax checks zdroje, dist, testu a skriptu pro cache verze prošly; `node scripts/refresh-auth-asset-versions.mjs` hlásí 0 zastaralých odkazů. Tři horoskopové stránky používají token `20261018-save-failure-status`; Service Worker `mysticka-hvezda-77f41448c5b4`; snapshot **1 766** veřejných verzí assetů.
- Změna je pouze lokální. Závěrečné aplikační/E2E/browser QA i produkční nasazení zůstávají otevřené.

### W06 · oddělení výkladu numerologie od uložení do profilu · 18. října 2026

- Prémiový numerologický výklad se vykreslí ještě před zápisem do historie. Když `Auth.saveReading` vrátí prázdný výsledek nebo vyhodí chybu, hotový text už nepřekryje obecná zpráva o selhání generování; stránka výsledek ponechá a přístupně oznámí, že se jej nepodařilo uložit do profilu.
- Přidán E2E scénář pro výjimku při ukládání; podle dohody nebyl spuštěn. `node --check` zdroje, dist a scénáře prošly. `npm run build:js` skončil chybou Windows `EBUSY` při kopírování nezměněného `js/three.min.js`; cílený esbuild pro `js/numerology.js` následně uspěl. `numerologie.html` používá token `20261018-save-failure-status`; helper sdílených verzí hlásí 0 zastaralých odkazů, Service Worker `mysticka-hvezda-77f41448c5b4`, snapshot **1 768** veřejných verzí.
- Pouze lokální kandidát. E2E/browserová QA a opakování úplného sestavení čekají na závěrečný průchod; produkce beze změny.

### W06 follow-up · zachování natálního výkladu při chybě historie · 18. října 2026

- Selhání `Auth.saveReading` už nespadne do obecné chyby generování a nepřepíše hotový osobní výklad tlačítkem k opakování. Výklad zůstává viditelný, stránka oznámí, že se jej nepodařilo uložit do profilu; změna účtu během zápisu dál skryje výsledek původní relace.
- Přidána cílená E2E regrese, podle dohody nebyla spuštěna do závěrečné QA. `node --check` zdroje, bundlu a testu prošel; cílený esbuild `natal-chart.js` uspěl. `natalni-karta.html` používá token `20261018-save-failure-status-natal`.
- Kandidát lokální; produkce beze změny. Celé sestavení stále čeká na závěrečný průchod, protože předchozí `npm run build:js` selhal při kopírování nezměněného `js/three.min.js` s Windows `EBUSY`.

### W06 follow-up · upozornění na neuložený výklad run · 18. října 2026

- Společná funkce ukládání run nyní zachytí výjimku i neúspěšnou odpověď a vloží dostupnou zprávu pod výsledek. Hotový hluboký výklad zůstane zobrazený a už se neukáže matoucí chyba, že se ho nepodařilo načíst; stejné upozornění dostane i ruční uložení do profilu.
- Přidána cílená E2E regrese. Podle dohody nebyla spuštěna. Cílený esbuild `runes.js`, syntax checks zdrojů/bundlů/testů a `git diff --check` prošly. `runy.html` používá token `20261018-save-failure-status`; Service Worker hash je `mysticka-hvezda-7c4ed3b64724`, asset archiv uchovává **1 772** verzí.
- Read-only pomocník `gpt-5.6-sol` (low) navrhl i Andělské karty a Křišťálovou kouli; kontrola zdrojů v tomto checkoutu potvrdila, že obě už při selhání zachovávají odpověď a zobrazují zprávu, proto se jejich kód neměnil. Runy byly jediný nový potvrzený případ.
- Pouze lokální kandidát; produkce beze změny. E2E/browserová kontrola zůstává na společnou závěrečnou QA.

### W06 follow-up · oddělení hotového výsledku od selhání historie · astrokartografie a šamanské kolo · 18. října 2026

- Astrokartografie při neúspěšném zápisu do historie zobrazí upozornění přímo pod mapou a živá oblast oznámí stav. Šamanské kolo stejnou situaci vysvětlí viditelným stavem, aniž by použilo obecnou chybu, která schovává hotový doplňující výklad. U šamanského kola se zápis nově pokouší jen pro známou přihlášenou relaci.
- Přidány cílené E2E regrese pro oba výsledky; podle dohody zatím neběžely. Cílené esbuildy obou bundlů, `node --check` zdrojů/dist/testu i `git diff --check` prošly. HTML používá token `20261018-save-failure-status`; Service Worker zůstává `mysticka-hvezda-7c4ed3b64724`, asset archiv má **1 776** verzí.
- Změny zůstávají lokální. E2E a browser QA čekají na společný závěrečný průchod; produkce beze změny.

### W06 follow-up · viditelné upozornění při neuložení partnerské shody a minulého života · 18. října 2026

- Partnerská shoda i minulý život nyní výsledek ponechají a zobrazí krátkou zprávu, když uložení vrátí prázdný výsledek nebo skončí výjimkou. U minulého života se upozornění vloží před sdílecí ovládání; u partnerské shody přímo pod slovní výklad. Relace uživatele se po asynchronním uložení dál kontroluje.
- Tarot jsem v tomto checkoutu ověřil ve zdroji: jednorázový i společný výklad už mají viditelnou zprávu pro prázdný výsledek i výjimku, proto jsem jej znovu neupravoval.
- Přidány dvě odložené E2E regrese. Cílené esbuildy pro `synastry.js` a `minuly-zivot.js`, `node --check` zdrojů, bundlů a E2E souborů i `git diff --check` prošly. Obě HTML stránky používají cache token `20261018-save-failure-status`; Service Worker tyto moduly nepřednačítá. Asset archiv nyní uchovává **1 780** verzí.
- E2E a browserová kontrola zůstávají na jeden závěrečný běh podle dohody. Změny jsou pouze lokální; produkce ani databáze se nezměnily.

### W06 follow-up · přístupné upozornění na neuloženou odpověď Křišťálové koule · 18. října 2026

- Upozornění na selhání uložení zůstává lokalizované a viditelné; nyní navíc používá sdílenou třídu výsledkového kontextu a `role="status"`, aby změnu správně oznámila i asistivní technologie. Při novém dotazu se upozornění dál uklidí.
- Přidána odložená E2E regrese pro prázdný výsledek uložení: odpověď zůstává viditelná, upozornění se oznámí a nevznikne oblíbená položka. Cílený esbuild `crystal-ball.js`, `node --check` zdroje/bundlu/scénáře a `git diff --check` prošly. `kristalova-koule.html` používá token `20261018-save-status-accessible`; asset archiv uchovává **1 782** verzí, Service Worker tento modul nepřednačítá.
- E2E a browserová kontrola zůstávají odloženy do společného závěrečného průchodu. Lokální kandidát; produkce beze změny.

### W06 follow-up · přístupná toast oznámení a import čekajícího výkladu · 18. října 2026

- Sdílený `Auth.showToast()` nyní před přidáním zprávy nastavuje kontejneru `role="status"`, `aria-live="polite"` a `aria-atomic="false"`. Oprava pokrývá dynamicky vytvořené i statické toast kontejnery; verzované Auth/core reference byly obnoveny v **915** HTML a generátorových souborech.
- Když profil nepotvrdí import čekajícího tarotového výkladu, výklad zůstane uložený v prohlížeči a zobrazí se srozumitelná zpráva s bezpečným opakováním. Při změně účtu se ukáže oddělené upozornění, aby se stav nepřipsal novému účtu.
- Přidány odložené E2E regrese pro přístupnost sdíleného toastu a neúspěšný import. Cílený build `auth-client.js`, společného `core.js` i profilového dashboardu, `node --check` zdrojů/bundlů/specifikací a kontrola zastaralých Auth asset odkazů prošly. Service Worker cache `mysticka-hvezda-651bed402bf6`; asset archiv má **1 787** verzí.
- E2E a browserové přijetí zůstávají na jeden společný závěrečný běh. Jde o lokálního kandidáta; produkce ani databáze se nezměnily.

### W04 · jednotný zámek členského čtení Šamanského kola · 18. října 2026

- Emoji zámku v členské nabídce Šamanského kola nahradilo SVG `lock` z místního symbolového sprite. Velikost, zlatý odstín, centrování i popisek nabídky jsou zachované; přístupný název zůstává v textu nadpisu.
- Stránka používá nový CSS cache token `20261018-atlas-icon-lock`. Kontrola diffu a existence symbolu prošla; Service Worker cache zůstává `mysticka-hvezda-651bed402bf6`, snapshot uchovává **1 788** verzí. Vizuální ověření odloženo do závěrečné browser QA; produkce beze změny.

### W04/W06 follow-up · ovládání znamení a stavové štítky rituálu · 18. října 2026

- Tlačítko změny znamení nyní používá místní SVG `pen`; lunární CTA na horoskopy používá odpovídající `chart` místo emoji křišťálové koule. Rituální hlášky „Vše připraveno“ a „Hotovo“ už nemají ozdobný znak `✦`.
- Read-only scan pomocným `gpt-5.6-sol` (low) nenašel další surové emoji v aktivních loading/error/success/retry/save/share/favorite ovládacích prvcích. `node scripts/unify-ui-symbols.mjs --check` prošel pro **917** veřejných HTML, změn **0**, nezmapovaných symbolů **0**.
- Cílené buildy `personalization.js`, `ritualy.js` a `ritualy-session.js`, syntax checks zdrojů/dist a `git diff --check` prošly. Aktualizovány cache tokeny v šesti stránkách se personalizací a ve dvou stránkách rituálu; Service Worker cache zůstává `mysticka-hvezda-651bed402bf6`, snapshot má **1 794** verzí. E2E a vizuální kontrola zůstávají na závěrečný průchod; kandidát je pouze lokální.

### W12 · responzivní pozadí Andělských karet · 18. října 2026

- Rub na kartě 280/250 px nyní používá existující varianty 240/480/600 px podle hustoty displeje; osm líců dostalo nové 360 × 600 varianty. Při 1× se přenáší o 96–132 kB méně pro jednu zvolenou kartu. Všech osm 360px variant společně má 425 698 B místo 1 389 172 B originálů (−69,4 %).
- Přednačtení Service Workeru nyní obsahuje nové varianty a menší rubové zdroje, aby zůstalo možné vyložit kartu offline; přírůstek souborů v cache činí 520 320 B. Originály i fallback deklarace zůstaly zachované. Generátor, CleanCSS parser, 19 CSS cest, 98 SW položek a `git diff --check` prošly. Hash SW: `mysticka-hvezda-149e8f14f27c`; snapshot: 1 795 verzí.
- Rozměry a úsporu ověřila tvorba souborů, nikoli browserová síť. DPI výběr, obrazová kvalita a offline odpojení čekají na společnou závěrečnou QA. Kandidát lokální; produkce beze změny. [Evidence](release-prep-2026-10-15/performance-angel-card-backgrounds-2026-10-18.md).

### W05 · zkrácení vysvětlení kalkulačky životního čísla · 18. října 2026

- Vysvětlení významu, metody a výpočtového příkladu je v nativním disclosure; dvě kratší FAQ zůstávají samostatná a všech 12 významových odkazů i výpočtové hooky zůstaly.
- Statický HTMLParser potvrdil 3 samostatná disclosure, žádná duplicitní ID a přítomnost očekávaných hooků; `git diff --check` prošel.
- Funkční výpočet, vizuální, mobilní a klávesnicové ověření patří do závěrečné QA. Změna pouze lokální; produkce beze změny. [Evidence](release-prep-2026-10-15/life-number-calculator-simplification-2026-10-18.md).

### W05 · zkrácení rozcestníku Křišťálové koule · 18. října 2026

- Hlavní formulář a odpověď zůstaly nahoře; šest následných cest se otevírá až po vyžádání. Všechny odkazy a jejich analytické hodnoty zůstaly.
- Statický HTMLParser potvrdil potřebná ID, kompletní atributy všech šesti cest, žádná duplicitní ID ani vnořená disclosure; `git diff --check` prošel.
- Aplikační, mobilní, klávesnicové a vizuální přijetí je odložené na společnou závěrečnou QA. Kandidát pouze lokální; produkce beze změny. [Evidence](release-prep-2026-10-15/crystal-ball-page-simplification-2026-10-18.md).

### W06 · odstranění duplicitního odhadu znamení natální karty · 18. října 2026

- Klient už neposílá své datumové pole `sunSign`; server znamení i celý prompt dál odvozuje z vlastního výpočtu mapy. Tím se odstranila nepoužitá hodnota, která se mohla lišit od serverového výpočtu.
- Přidán odložený E2E scénář pro hraniční datum v `America/Los_Angeles`; simuluje odpověď mapy a ověřuje, že duplicitní pole `sunSign` není v klientském AI requestu. Opakované `node --check`, cílený ESLint, IIFE build, kontrola cache a `git diff --check` prošly. Stránka používá cache token `20261018-calculated-sun-sign`; Service Worker zůstává `mysticka-hvezda-f2c27c0ab767`, snapshot obsahuje **1 818** verzí. [Evidence](release-prep-2026-10-15/natal-sun-sign-from-chart-2026-10-18.md).
- E2E/browserové ověření je odložené na společnou závěrečnou QA. Kandidát je pouze lokální; produkce beze změny.

### W05 · zkrácení spodní části Čínského horoskopu · 18. října 2026

- Čtyři FAQ karty jsou samostatná rozbalení; obecný čtyřodkazový blok byl odstraněn, protože horoskopy a partnerská shoda už jsou volbou u výsledku.
- Statický parser potvrdil přesnou shodu čtyř FAQ s FAQPage JSON-LD, 12 zvířecích voleb a zachovaná kalkulačková ID. `git diff --check` prošel.
- Výpočet a synastrie nebyly spuštěny; funkční, mobilní, klávesnicové a vizuální přijetí čeká na závěrečný společný QA. Kandidát lokální; produkce beze změny. [Evidence](release-prep-2026-10-15/chinese-horoscope-page-simplification-2026-10-18.md).

### W05 · odstranění opakovaného CTA v Lunárním kalendáři · 18. října 2026

- Spodní blok opakoval stejné dva cíle i vysvětlení z konkrétnějších doporučení k fázi. Zůstal jeden čtyřkaretní praktický výběr a samostatný lunární rituál.
- Statický HTMLParser potvrdil tracking všech čtyř praktických odkazů, 4 samostatná FAQ, rituální CTA a žádná duplicitní ID; `git diff --check` prošel.
- Lunární výpočet a rituál nebyly spuštěny; browserové a aplikační přijetí čeká na společný závěrečný QA. Kandidát lokální; produkce beze změny. [Evidence](release-prep-2026-10-15/lunar-calendar-simplification-2026-10-18.md).

### W05 · zjednodušení Numerologie a srovnání schemat Natální karty · 18. října 2026

- Na Numerologii zůstal jeden detailní přehled významů místo dvou překrývajících se vysvětlení. Spodní sekce nyní nabízí jen dvě unikátní cesty; odkazy na partnerskou numerologii a význam data narození zůstávají v horním tematickém rozcestníku.
- Z Natální karty odstraněny neviditelné FAQPage a nepodložené HowTo schema; WebApplication schema a viditelný nástroj zůstaly. Read-only scan pomocným agentem `gpt-6-luna` (low) prošel Natální kartu, Astro-mapu, Numerologii, Tarot na lásku a Tarot 3 karty: nalezený bezpečný zásah se týkal právě schema Natální karty a duplicitní prezentace Numerologie; na ostatních čtyřech stránkách nenašel bezpečný W05 obsah k odstranění.
- Statický HTMLParser ověřil všechna runtime ID obou nástrojů, platnost JSON-LD, nulové duplicitní ID a žádná vnořená disclosure. Čtyři FAQPage otázky Numerologie odpovídají viditelným FAQ. `git diff --check` prošel.
- Výpočetní funkce, denní cykly a ukládání nebyly spuštěny. Mobilní, klávesnicové a vizuální přijetí zůstává pro společnou závěrečnou QA; kandidát lokální a produkce beze změny. [Natální karta](release-prep-2026-10-15/natal-chart-schema-alignment-2026-10-18.md), [Numerologie](release-prep-2026-10-15/numerology-page-simplification-2026-10-18.md).

### W05/W06/W10 follow-up · kontrola zbývajících jednoduchých zásahů · 18. října 2026

- V profilu je „Místo narození“ nyní označené jako nepovinné stejně jako datum a čas; žádné API, přihlašovací údaje ani profilová data jsem neotevíral. Statické ověření popisků, autocomplete a formulářových hooků prošlo. [Evidence](release-prep-2026-10-15/profile-optional-birthplace-2026-10-18.md).
- Kontrola W05 pomocným `gpt-6-luna` (low) prošla `andelske-karty.html`, `partnerska-shoda.html`, `mentor.html`, `runy.html` a `tarot-vyznam-karet.html`; bezpečná duplicita se nenašla. Horní a dolní Tarot CTA na katalogu karet mají různý měřicí kontext, proto zůstaly obě. Žádné další změny ani testy.
- V10 auditní zmínka o `offline.html` je zastaralá: zdroj nyní používá SVG `warning` ze symbolové sady, sdílené atlasové CSS a lokální navy/zlatý fallback včetně zlaté akce; statický skip link vede na obsah. Žádný kódový zásah nebyl potřeba. Browserová kontrola offline režimu zůstává na závěrečný průchod.
- Produkční, testovací platební, resetovací e-mailové i klientské browserové větve zůstávají odložené podle plánu; kandidát lokální.

### W02/W05 · Tarot karta dne sjednocena s Atlasem · 18. října 2026

- Zdrojový audit potvrdil, že stránka už nemá fialovou galaxii; root je navy, staré hvězdy jsou skryté a styl přepisují lokální Tarot/Atlas pravidla. Není nutné přehazovat celý legacy bundle, který dodává současné komponenty.
- Zaoblení malovaných karet a referenčních detailů je nyní 4px, výslovně scoped na stránku. `dateModified` JSON-LD odpovídá dnešnímu obsahovému zásahu. Tah, výsledky a trackované odkazy zůstaly nedotčené.
- Staticky ověřena platnost JSON-LD a draw/result ID. Cache Service Workeru obnovena na `mysticka-hvezda-a0eca0c1cfad`; asset snapshot drží 1 798 verzí. [Evidence](release-prep-2026-10-15/tarot-daily-atlas-finetune-2026-10-18.md).
- Read-only kontrola pomocným `gpt-6-luna` (low) potvrdila, že migrace na `atlas-page` by byla riziková: společný atlasový CSS soubor zároveň obsluhuje homepage náhled. Vizuální, interakční a offline přijetí zůstává na společný finální běh. Pouze lokální změna.

### W06/W13 · statické zpřísnění přístupu k denním kvótám · 18. října 2026

- Migrace denních kvót nyní odebírá přímá tabulková oprávnění i `service_role`; aplikace má používat pouze tři povolené RPC. Read-only kontrola zdroje/helperem `gpt-6-luna` (low) neodhalila chybu v atomické rezervaci nebo uvolnění. Oficiální dokumentace potvrzuje, že starší Supabase projekty mohou mít pro nové tabulky automatické granty `service_role`.
- `supabase test db`, dotaz na efektivní ACL, databázové advisories i testy jsou odloženy na společný závěrečný průchod dle zadání. Migrace je neaplikovaná; lokální změna sama neověřuje oprávnění, RPC ani souběh v databázi.
- Otevřená produktová volba: denní limit se obnovuje o UTC půlnoci (v Česku obvykle 01:00/02:00). [Statická kontrola a hranice](release-prep-2026-10-15/quota-migration-static-review-2026-10-18.md).

### W10 · kontrola hlavních tvrzení o členství · 18. října 2026

- Read-only porovnání `cenik.html`, `horoskopy.html` a homepage s `server/config/constants.js` nepotvrdilo rozdíl v ceně 199 Kč/měsíc ani sedmidenní zkušební době. Veřejná nabídka dál obsahuje jedno placené měsíční členství; interní roční konfigurace není v ceníku ani veřejném manifestu.
- Podmínky zrušení a přesný průběh karetní autorizace nelze potvrdit jen z lokální konfigurace; neoznačuji je za ověřené. Bez změn, bez testovací platby a bez kontaktu s produkcí.

### W04/W12 · sjednocení vztahové nabídky v Tarotu · 18. října 2026

- Sdílená nabídka na čtyřech tarotových stránkách přešla z fialových panelů a přechodového zlatého CTA na navy, tlumené zlato, krémový text a menší rohy. Text, ceny, odkazy, podmínky, analytics a chování zůstaly beze změny; stylesheet má nový token `v=3` ve všech čtyřech odkazech.
- Statická kontrola potvrdila 38 vyvážených CSS bloků, odstranění sledovaných fialových tokenů a aktuální CSS verzi na `tarot.html`, `tarot-zdarma.html`, `tarot-laska.html` a `tarot-ano-ne.html`. Service Worker cache zůstala `mysticka-hvezda-a0eca0c1cfad`; asset snapshot má 1 799 verzí.
- Vizuální přijetí desktopu a mobilu čeká na společný závěrečný průchod; žádné aplikační testy ani produkční změny.

### W05/W07/W10 · FAQ a čitelnost podmínek na ceníku · 18. října 2026

- Read-only obsahová kontrola nenašla bezpečný blok k odstranění: cena, zkušební období, způsob zrušení, potřeba platební karty a rozdíl oproti jednorázovému vztahovému výkladu vysvětlují odlišné podmínky v různých rozhodovacích místech.
- Čtyři FAQ ovládací prvky výslovně nastavují `type="button"`, aby se nestaly odesílacími tlačítky při budoucím vložení do formuláře. Sdílená FAQ inicializace doplňuje `aria-controls`, `aria-expanded`, ID a klávesnicové ovládání.
- Aplikaci, klávesnici, mobil a čtečku obrazovky jsem netestoval; patří do společné závěrečné kontroly. Změna je pouze lokální a produkce beze změny.

### W06/W10 · kalendářní den v modelu biorytmů · 18. října 2026

- Statický audit odhalil, že výpočet používal `Math.abs` a `Math.ceil` mezi časovými razítky, zatímco datumové pole, graf a souhrn pracovaly s různými lokálními/UTC okamžiky. Narozeninový den se proto mohl posunout na den 1, graf a čísla se mohly rozcházet a v některých pásmech mohlo datum sklouznout o den.
- Výpočet nyní používá podepsaný rozdíl místních kalendářních dnů; datum z formuláře se parsuje jako místní den, maximální datum je lokální dnešek a graf i souhrn sdílejí stejnou půlnoc. Perioda a sinusový vzorec zůstaly stejné; biorytmy jsou nadále popsané jako matematický model, ne měření zdraví či výkonu.
- Přidána cílená E2E regrese dne 0 pro tři cykly i soulad grafu se souhrnem; nebyla spuštěna. Cílený esbuild pro `biorhythms.js` vytvořil distribuovaný modul; `node scripts/update-service-worker-cache.mjs` potvrdil beze změny hash `mysticka-hvezda-a0eca0c1cfad` a snapshot nyní uchovává **1 801** verzí. Build úspěch neznamená ověření výpočtu v prohlížeči. Změna zůstává lokální; produkce beze změny.

### W06 · pražská hranice denního tahu run · 18. října 2026

- Denní klíč run už nepoužívá UTC datum: zámek, losování, uložení i návratový kontext sdílejí `Europe/Prague` helper. Tarotová karta dne používá stejnou utilitu a zachovává svůj veřejný export.
- Přidána odložená E2E regrese pro 00:30 v Praze, kdy je v UTC ještě předchozí datum. Cílený esbuild vytvořil oba moduly; `node --check` zdrojů a scénáře prošel, `git diff --check` bez chyb. Service Worker cache `mysticka-hvezda-95e39d088c91`; snapshot: **1 806** verzí.
- Browserové chování a E2E zůstávají ve společném závěrečném průchodu. Kandidát je pouze lokální; produkce beze změny. [Evidence](release-prep-2026-10-15/rune-prague-day-boundary-2026-10-18.md).

### W06 · pražské datum bezplatné ukázky Tarotu · 18. října 2026

- Denní limit vícekaretního teaseru nyní ukládá a porovnává datum v `Europe/Prague`; předchozí UTC klíč mohl otevřít další ukázku před českou půlnocí.
- Přidána odložená E2E regrese, která v pražských 00:30 ověřuje zachování vyčerpaného limitu. Cílený IIFE build pro `tarot.js` úspěšně vytvořen; cache token HTML obnoven. Service Worker hash zůstává `mysticka-hvezda-95e39d088c91`, snapshot má **1 808** verzí.
- Výpočet ani checkout nebyly v prohlížeči spuštěny; E2E, mobil a nákupní cesta zůstávají na společnou závěrečnou QA. Změna je lokální, produkce beze změny. [Evidence](release-prep-2026-10-15/tarot-prague-daily-limit-2026-10-18.md).

### W06/W10 · dnešní datum v objednávce Osobní mapy · 18. října 2026

- `max` pole data narození už neodvozuje den z UTC, které v Česku po půlnoci vracelo datum včerejška. Používá stejný kalendářní den `Europe/Prague`.
- Přidána odložená E2E regrese na pražskou 00:30. Cílený IIFE build proběhl; Service Worker cache `mysticka-hvezda-f2c27c0ab767`, snapshot **1 810** asset verzí.
- Objednávku, validaci formuláře ani nákupní cestu jsem netestoval; patří do společného závěrečného průchodu. Změna je lokální a produkce beze změny. [Evidence](release-prep-2026-10-15/personal-map-date-limit-2026-10-18.md).

### W05/W10 · rozsah bezplatného výpočtu numerologie · 18. října 2026

- FAQ na `numerologie.html` nyní přesně rozlišuje bezplatný výpočet životní cesty z data narození a tří čísel ze jména od placeného AI výkladu všech čtyř hodnot. Předtím text nesprávně naznačoval, že bezplatná je jen kalkulačka životní cesty a že všechny čtyři hodnoty vycházejí ze jména i data narození.
- Viditelná odpověď i FAQPage JSON-LD byly porovnány statickým parsováním; otázka i celý text odpovědi souhlasí. Výpočet, členský přístup ani skutečné UI nebyly spuštěny. Změna je lokální; produkce beze změny.
### W05/W06 · stručnější uvítání Hvězdného průvodce · 18. října 2026

- Odstraněno klišé „Vítej, poutníku“; chat teď hned vybízí k popisu skutečné situace a výslovně označuje odpověď jako symbolický pohled. Nový uvítací blok má sémantický `data-mentor-welcome` marker, takže načtená historie ho odstraní bez závislosti na přesné české formulaci.
- Opětovná inventura `mentor.html` potvrdila, že dříve zdokumentovaný 11karetní katalog pokračování už v živém souboru není; ponechané jsou hero, čtyři starter otázky, chat a jeho stavy. Stará inventura ve `docs/page-simplification-2026-10-14/tools.md` je historická.
- `npm run build:js` prošel a sestavil distribuci; snapshot nyní uchovává **1 834** verzí. Existující E2E scénář kontroly historie očekává, že po načtení zůstanou jen uložené zprávy, ale nebyl spuštěn. Browserová kontrola zůstává v závěrečné QA; kandidát lokální, produkce beze změny.
### W02/W05 · odstranění duplicitního rozcestníku Andělských karet · 18. října 2026

- Dvě skryté sekce nabízely stejné návaznosti na vysvětlení karet, ochranu energie, Křišťálovou kouli, Tarot a Hvězdného průvodce; druhá kopírovala pět z šesti voleb. Zůstává jeden šestikaretní blok hlavních záměrů a samostatný krátký odkaz na unikátní článek o 11:11. Text i cílové stránky zůstávají dostupné, opakované karty a jejich druhá měřicí větev zmizely.
- Statický průchod potvrdil šest hlavních CTA, jeden unikátní follow-up, zachované ID `angel-topic-links` a nepřítomnost duplicitních karet. Očekávání SEO statického testu bylo přepsáno na novou strukturu; testy ani browser neběžely. Produkce beze změny.

### W04 · jednotné ikony Snáře · 18. října 2026

- Zdrojem systémových emoji bylo vykreslení dat v hlavním slovníku i generátor všech 164 statických snových stránek. Renderer teď drží názvy a popisy jako čistý text, nadpisy a tematické odkazy vygenerují bez emoji; karta „Symbol dne“ používá existující SVG `dream`. Ručně přidané dekorativní emoji na rozcestníku Snáře také zmizely. Významy snů a cíle odkazů se neměnily.
- Vygenerováno všech 164 stránek. `node scripts/generate-snar-pages.mjs --check` potvrdil aktuálnost; statická kontrola našla 0 emoji v nadpisech a souvisejících odkazech, ani dynamické renderery už emoji z dat nečtou. JS build úspěšný, asset snapshot **1 841** verzí; Service Worker zůstává `mysticka-hvezda-060532512f12`.
- Browserovou, vizuální a funkční QA nechávám na společný závěrečný průchod. Kandidát je lokální, produkce beze změny. [Evidence](release-prep-2026-10-15/snar-unified-symbols-2026-10-18.md).

### W10 · omezení numerologických dat v analytice · 18. října 2026

- Události zobrazení numerologického výsledku a sdílení obrázku už do analytiky neposílají odvozená čísla životní cesty, osudu, duše ani osobnosti. Zůstává zdroj a stav přihlášení/formát/cíl sdílení; samotná čísla zůstávají ve výsledku, obrázku a výslovně sdíleném textu pro uživatele.
- Kontrola producentů a konzumentů nenašla numerologickou metriku využívající tato čtyři pole. Stránka používá nový asset token `20261018-minimal-analytics`; build i statická kontrola payloadů prošly. Aplikace a souhlas s analytikou nebyly spouštěny; změna je lokální. [Evidence](release-prep-2026-10-15/numerology-analytics-minimization-2026-10-18.md).

### V04 · kratší první dávka článků na Blogu · 18. října 2026

- První pohled nyní obsahuje jeden vybraný článek a sedm dalších místo jedenácti. Tlačítko přidává další osmikaretní dávku; filtr stále pracuje nad celým pořadím článků. Statický generator zachovává sedm přímých odkazů pro případ bez JavaScriptu.
- Opraven výpadkový stav načtení indexu: místo vymazání statických článků a zprávy „žádné články“ se zachovají dostupné odkazy a zobrazí pravdivé oznámení o nedostupném aktuálním seznamu. Všech 74 URL blogu zůstává v sitemapě.
- Staticky potvrzen generátor, 7 karet + vybraný článek, 74 položek indexu i 74 sitemap URL; JS build úspěšný, asset snapshot **1 843** verzí. Browser/JS failure simulaci nechávám na společnou závěrečnou QA. Kandidát lokální, produkce beze změny. [Evidence](release-prep-2026-10-15/blog-progressive-list-2026-10-18.md).


### W05 · důvěryhodnost článků o biorytmech · 18. října 2026

- Dva indexované články byly přepracovány: jeden věcně popisuje matematický model, druhý nabízí praktický osobní deník bez předpovědí. Odstraněna nepodložená tvrzení o zdraví, náladě, schopnostech a riziku nehod; zachované URL nyní mají sladěné viditelné titulky, metadata, JSON-LD a blogový index.
- Druhý článek má nyní správně uzavřenou HTML strukturu. Nezávisle zkontrolovat obsah řádků Supabase před dalším spuštěním `server/scripts/generate-blog.js`; databázový zdroj nebyl přístupný v této lokální práci. [Evidence](release-prep-2026-10-15/biorhythm-articles-trust-and-structure-2026-10-18.md).
- Prohlížečová a aplikační QA zůstává v závěrečném průchodu. Kandidát lokální, produkce beze změny.

### W10 · přesný text sdílení Tarotu ANO/NE · 18. října 2026

- Sdílecí popisek už netvrdí, že karty analyzovaly a zodpověděly vlastní otázku. Popisuje výsledek jedné symbolické karty jako podnět k zamyšlení; výběr z poolu ani kategorie ANO/NE/NEJASNÉ se neměnily.
- Zdrojový modul byl sestaven do načítaného ESM bundlu a stránka odkazuje na novou verzi. Service Worker zůstal beze změny; aktualizovaný archiv obsahuje **1 848** verzí. Funkční, vizuální a sdílecí ověření zůstává v závěrečné QA. [Evidence](release-prep-2026-10-15/qa-results.md).

### W05/W10 · důvěryhodnost čínského horoskopu a blogových CTA · 18. října 2026

- Článek o Roku Ohnivého Koně už neslibuje předpovědi ani přesný osobní horoskop. Obsahuje kalendářní kontext, zdroje a 12 krátkých autorských otázek k zamyšlení. Metadata, JSON-LD a blogový index jsou synchronizované.
- Opakované blogové CTA rozlišují horoskop podle znamení od samostatné natální karty; odstraněn nepatřičný text o personalizaci podle natální karty a zrušení předplatného. SVG dalekohled nahradila hvězda ve 43 článcích.
- Statická kontrola obsahu/JSON-LD/indexu, počtu karet, strukturálních značek a diffu prošla. Browser, aplikace a testy čekají na společnou QA; databázi ani produkci jsem neměnil. [Evidence](release-prep-2026-10-15/chinese-horoscope-article-trust-2026-10-18.md).

### W05/W10 · faktický přehled zatmění roku 2026 · 18. října 2026

- Článek nyní uvádí všechna čtyři data a typy zatmění podle NASA a rozlišuje astronomická fakta od symbolické astrologické interpretace. Odstraněny nepodložené předpovědi a direktivní rada měnit vztahy či projekty.
- Title, H1, meta, OG, BlogPosting JSON-LD a blogový index jsou synchronizované; původní datum vydání i kanonická URL zůstaly. Statické ověření prošlo; prohlížeč, aplikace a testy čekají na společnou QA. Produkce beze změny. [Evidence](release-prep-2026-10-15/eclipse-article-trust-2026-10-18.md).

### W05/W10 · přesnost článku o osobním roce · 18. října 2026

- Článek teď vysvětluje stejnou kalendářní metodu jako numerologická kalkulačka; tvrzení o přechodu na narozeniny a předpovědi pro peníze, vztahy, kariéru či zdraví zmizely. Text je zkrácen přibližně na 320 slov a témata 1–9/11/22/33 odpovídají labelům nástroje.
- Metadata, JSON-LD a blogový index jsou sladěné. Statická kontrola prošla; browser a výpočet patří do společné závěrečné QA. Obsah Supabase nebyl prověřen a může být autoritou při budoucím běhu blogového generátoru. Produkce beze změny. [Evidence](release-prep-2026-10-15/personal-year-article-reality-2026-10-18.md).


### W05/W10 · důvěryhodnost článku o retrográdní Venuši · 18. října 2026

- Článek zkrácen na přehled skutečných dat (3. října–14. listopadu 2026, Štír zpět do Vah), astronomického zdánlivého pohybu a symbolické astrologické tradice. Odstraněny chybný Beran, neověřené předpovědi, nátlakové zákazy a nefunkční/nepřirozené copy.
- H1, OG titulek, JSON-LD headline a titul v blogovém indexu se shodují; HTML `<title>` přidává značku. Popisy jsou synchronizované, datum vydání sladěno s indexem a doba čtení snížena na 2 minuty. Statické ověření prošlo. Evidence: [venus-article-trust-2026-10-18.md](release-prep-2026-10-15/venus-article-trust-2026-10-18.md).
- Zdrojový obsah Supabase nebyl zkontrolován; další běh `server/scripts/generate-blog.js` může změnu přepsat. Kandidát je lokální. Testy a browser QA čekají na jeden společný závěrečný průchod.


### W05/W10 · archivní článek o zatmění Slunce 2026 · 18. října 2026

- Článek z 12. srpna byl převeden z budoucího upoutávkového textu na přibližně 300slovný historický přehled. NASA potvrzuje trasu úplného zatmění přes Grónsko, Island, severní Rusko, Španělsko a malou část Portugalska; částečná fáze byla vidět ve velké části Evropy.
- Odstraněno zavádějící tvrzení o prvním zatmění v Evropě po desítkách let, jisté astrologické předpovědi pro znamení a CTA k již proběhlé události. Bezpečnostní poznámka se vztahuje k budoucím pozorováním a vede na NASA.
- H1/index/schema headline se shodují; HTML `<title>`/OG titulek přidává značku. Meta/OG/schema/index popisy i sitemap `lastmod` jsou synchronizované. Statická kontrola prošla; zdrojový text Supabase nebyl změněn a generátor jej může obnovit. [Evidence](release-prep-2026-10-15/solar-eclipse-article-archive-2026-10-18.md). Browser/testy/produkce zůstávají beze změny do finálního průchodu.
### W05/W10 · přesnost a tón článku o retrográdním Merkuru · 18. října 2026

- Opraveny tři chybné intervaly a znamení Merkuru pro rok 2026; astronomická data jsou oddělena od astrologické symboliky. Odstraněny zákazy smluv/nákupů, zbytečný strach a neověřená tvrzení o problémech v „shadow periods“.
- Zachována URL i datum vydání. HTML, OG, JSON-LD a blogový index mají sladěný titulek/popis; sitemap `lastmod` je 2026-10-18. 242 slov hlavního textu odpovídá odhadu čtení 2 minuty.
- Statická kontrola a `git diff --check` prošly. Záznam Supabase nebyl načten ani upraven a generátor může lokální výstup přepsat. Browser, funkční testy a produkce zůstávají na společný závěrečný průchod. [Evidence](release-prep-2026-10-15/mercury-retrograde-dates-and-claims-2026-10-18.md).


**Dílčí obsahová oprava 18. 10.:** druhý článek o retrográdním Merkuru byl zkrácen na 276 slov. Odstraněny stejné předpovědi pro 12 slunečních znamení, chybně přidělené astrologické domy, zákazy běžných rozhodnutí a nepřesné osobní tranzitní CTA. Lokálně sjednocen i jeho závěrečný CTA do navy/zlatého Atlas stylu; URL zůstala zachována. Metadata a blogový index jsou synchronizované. Databáze nebyla změněna a prohlížečová kontrola čeká na závěrečné QA. [Evidence](release-prep-2026-10-15/mercury-signs-article-cleanup-2026-10-18.md).
**Dílčí pokračování 18. 10.:** článek o auře a všech devět štítků kalkulačky nyní odpovídají skutečnému nástroji; odstraněné jsou nepodložené zdravotní, diagnostické a léčebné sliby. Změna je lokální, evidence v [kontrolním checkpointu](release-prep-2026-10-15/aura-article-trust-2026-10-18.md). Celkový checkboxový součet zůstává 31/66; širší TODO položky zůstávají otevřené do závěrečné společné QA.
**Dílčí pokračování 18. 10.:** zdrojové i statické texty Anděla Zdraví a Archanděla Rafaela odpovídají náhodnému symbolickému losování a neslibují zdravotní výsledek. Detail a rozsah kontroly: [checkpoint](release-prep-2026-10-15/angel-health-and-raphael-copy-2026-10-18.md). Checkboxový součet zůstává 31/66; širší položky TODO čekají na dokončení a společné závěrečné QA.
**Dílčí pokračování 18. 10.:** Anděl Radosti a Anděl Soustředění už čtenářům nepřisuzují všeobecné potíže ani nedostatek vůle jako „diagnózu“; místo toho nabízejí dobrovolný podnět k zamyšlení. [Checkpoint](release-prep-2026-10-15/angel-joy-focus-copy-2026-10-18.md). Checkboxový součet zůstává 31/66.
**Dílčí pokračování 18. 10.:** ze všech 44 andělských karet odstraněna opakovaná sekce, která vykládala sny, pocity a náhody jako osobní znamení. Zdroj i generátor jsou srovnané; hlavní výklad a nástroje zůstaly. [Checkpoint](release-prep-2026-10-15/angel-card-signs-section-2026-10-18.md). TODO součet 31/66; závěrečné generování a QA zůstávají otevřené.
**Dílčí pokračování 18. 10.:** krátký i dlouhý obsah Anděla Snů a Vděčnosti už neslibuje předpověď, léčebný ani zdravotní efekt, nebo přitažení dalších výsledků. [Checkpoint](release-prep-2026-10-15/angel-dreams-gratitude-copy-2026-10-18.md). Checkboxový součet zůstává 31/66.
**Dílčí pokračování W05/W10 · 18. 10.:** dalších 30 andělských detailů i 31 živých fallback textů je převedeno na přirozenější symbolický jazyk; starší `localStorage` už nepřebíjí známé sdílené odkazy. Kontrola generátoru všech 44 stránek prošla a nepoužívaný `js/daily-card.js` je obsahově synchronizovaný, ačkoli ho žádná HTML stránka nenačítá. [Evidence](release-prep-2026-10-15/angel-card-copy-trust-batches-2026-10-18.md). Browserové a behaviorální přijetí zůstává odložené na závěrečný průchod; npm umbrella build stále končí chybou zápisu `service-worker.js`.

**Dílčí pokračování W06 · 19. 10.:** Křišťálová koule oznamuje výsledek přes jedinou živou oblast, bez předvyplněného oznámení při otevření; česká, slovenská a polská stránka sdílejí stejné status chování a verzi bundlu. [Checkpoint](release-prep-2026-10-15/crystal-ball-single-live-status-2026-10-19.md). Prohlížečové ověření čeká na společnou závěrečnou QA; široký W06 zůstává otevřený.

**Read-only follow-up W06/W11 · SK/PL Křišťálová koule · 19. 10.:** při chybě generování server vrací výslovně základný podnět / podstawową wskazówkę do refleksji; oba jazyky současně zobrazí lokalizovaný štítek „základní symbolický výklad, osobní generování není dostupné“. Denní limit tří přihlášených otázek odpovídá konfiguraci i serverové kontrole. Samostatné upozornění před zadáním otázky by duplicitně opakovalo stav, který se zobrazuje až při skutečném fallbacku; bez změny kódu. Chování v prohlížeči zůstává na společnou závěrečnou QA.

**Dílčí pokračování W06 · 19. 10.:** pole záměru na stránce Run je výslovně nepovinné, jeho nápověda je přístupně propojená a limit 500 znaků odpovídá serveru, který jinak delší text tiše zkracuje. [Checkpoint](release-prep-2026-10-15/rune-intention-limit-and-hint-2026-10-19.md). Odeslání i výklad zůstaly beze změny; browserové ověření čeká na závěrečný průchod.

**Dílčí korektura W05/W10 · 18. 10.:** při následném přečtení všech 44 karet opraveno osm jazykových detailů v sedmi delších textech a jednom krátkém poselství. Kontrola generátoru, JS bundle a cache byly zopakovány úspěšně; detail je v [checkpointu](release-prep-2026-10-15/angel-card-copy-trust-batches-2026-10-18.md). Browserová kontrola zůstává na závěrečný průchod; produkce beze změny.

**Dílčí korektura W05/W10 · 18. 10.:** opraven český název a štítek jednoho historického fallbacku, aniž se změnil slug nebo cíl starého odkazu. Aktivní fallback i záložní data jsou synchronizované; podrobnosti a build/cache stav jsou v [checkpointu](release-prep-2026-10-15/angel-card-copy-trust-batches-2026-10-18.md). Browserové ověření zůstává na závěrečný průchod.

**Dílčí zjednodušení W05 · 18. 10.:** na všech 78 detailech tarotových karet zůstala jediná CTA k výkladu v úvodu; opakovaná spodní CTA a nesouvisející formulář denního horoskopu byly odstraněny z generátoru i výstupů. Významy karet, FAQ, strukturovaná data i hlavní analytický zdroj odkazu zůstaly. [Evidence a rozsah](release-prep-2026-10-15/tarot-detail-cta-cleanup-2026-10-18.md). Finální vizuální a behaviorální QA zůstává otevřená.

**Dílčí zjednodušení W05 · 18. 10.:** obecný blok „Další nástroje“ na `horoskopy.html` nyní zobrazuje kompaktní přístupný seznam místo 11 velkých karet. Názvy a cílové URL zůstaly totožné; obecné popisky a dekorativní SVG se odstranily. [Evidence a nezávislé porovnání](release-prep-2026-10-15/horoscope-related-tools-compact-2026-10-18.md). Vizuální a klávesnicové přijetí zůstává otevřené.

**Dílčí korektura W10 · 18. 10.:** tarotový rozcestník používá pro oba vícekartové rozklady stejné označení „Členství“ a české větné psaní nadpisů. Přístupný popisek zavření banneru odpovídá upozornění o členství. Funkční atributy zůstaly zachované. [Evidence](release-prep-2026-10-15/tarot-hub-membership-labels-2026-10-18.md).

**Dílčí korektura W10 · 18. 10.:** statická kontrola všech 78 otázek a kroků Tarotu ANO/NE/Karty dne našla a opravila několik přechodů do množného čísla a neosobních formulací. Audit zdrojové logiky také doložil, že otázka neovlivňuje volný výběr karty ani výklad; tato podstatná informace je teď vidět přímo u pole a shoduje se s metadaty i FAQ. Slovenská varianta už stejnou skutečnost popisuje správně. Přiřazení odpovědí ani tah se nezměnily. Zdroj, generovaný slovník a oba načítané tarotové balíčky jsou synchronizované; finální browserová QA zůstává na závěr. [Evidence](release-prep-2026-10-15/tarot-card-practice-voice-2026-10-18.md). W10 zůstává otevřené.

**Dílčí oprava W05/W10 · 18. 10.:** placený vztahový výklad za 149 Kč se po výsledku Tarotu ANO/NE ukazuje jen při explicitním vztahovém záměru. Obecný vstup už nedostane nesouvisející vztahovou nabídku a zachová obecnou cestu k výkladu tří karet. Ověřeny vstupní `intent` hodnoty, JS syntaxe a shoda zdroje s načítaným souborem. E2E/browser ověření zůstává na společný závěrečný průchod; W05/W10 zůstávají otevřené. [Evidence](release-prep-2026-10-15/tarot-yesno-upsell-intent-2026-10-18.md).

**Dílčí zjednodušení W05/W10 · 18. 10.:** na `tarot-zdarma.html` byl odstraněn duplicitní blok metod a upřesněna bezplatná nabídka. Šest hlavních cest zůstává, členské rozklady jsou tak označené a praktické tipy zůstaly v rozbalovacím bloku. Statická kontrola odkazů, JSON-LD, JS syntaxe a diffu prošla. Snapshot assetů obsahuje 1 868 verzí; Service Worker cache se nezměnila. Browserová/E2E QA zůstává na závěrečný společný průchod; žádný široký checkbox nebyl uzavřen. [Checkpoint](release-prep-2026-10-15/tarot-free-landing-streamline-2026-10-18.md).

**Dílčí optimalizace W12 · 18. 10.:** dynamická karta v Tarotu ANO/NE nyní používá responsive 240/360/600px varianty podle šířky místa; všech 78 karet má varianty ověřené. Průměr originálu 207 KB, malá varianta 27 KB. Zdroj i modulový bundle jsou synchronní a mají nový cache token. Reálný přenos/LCP nebyl měřen; browserová kontrola zůstává na závěr. [Evidence](release-prep-2026-10-15/tarot-yesno-responsive-images-2026-10-18.md). W12 zůstává otevřené.

**Další dílčí optimalizace W12 · 18. 10.:** otočené ilustrační karty na `tarot-zdarma.html` už také vybírají 240/360/600px obraz podle místa; u tří ukázkových karet činí kandidát 240px dohromady 78 KB oproti 603 KB originálů. [Evidence a omezení](release-prep-2026-10-15/tarot-demo-face-responsive-2026-10-18.md). Browserové ověření zůstává ve společné závěrečné QA.

### W02 · přehled komponentových stavů a disabled akce · 18. října 2026

- Připraven místní přehled skutečných sdílených komponent pro klidový stav, hover, klávesnicový fokus, disabled, načítání, chybu a úspěch. Ukázka je statická dokumentace, neinteraguje s produkčním formulářem a není v navigaci ani sitemap.
- Ve sdíleném `atlas-web.css` doplněn čitelný disabled stav tlačítek, který potlačí zlatý lesk, hover posun i stín. 918 veřejných HTML používá nové `atlas-web.css?v=20261018-disabled-button-state`; generační šablony jsou synchronizované a kontrola CSS verzí hlásí 0 zastaralých odkazů.
- Service Worker cache `mysticka-hvezda-01c4a9f72483`, asset archiv obsahuje **1 910** verzí. Statická kontrola prošla. Prohlížečové ověření a závěrečné testy zůstávají ve společné QA; kandidát je lokální, produkce beze změny. [Checkpoint a rozsah](release-prep-2026-10-15/component-states-preview-2026-10-18.md).
- Po tomto kroku TODO obsahuje 32/66 hotových checkboxů a 34 otevřených.

### W02 · ověřené duplicitní pravidlo sdílené plochy · 18. října 2026

- V `atlas-web.css` sloučena přesná duplicitní definice `.cookie-banner`: výsledné pozadí, linka, radius a stín se nezměnily. `horoskopy.html` načítá sdílenou Atlas vrstvu; stránkové a navazující Atlas CSS tento selector dále nepřepisují.
- Cache Service Workeru `mysticka-hvezda-369b5b6b27c2`, asset archiv **1 911** verzí. Přehled zbývajících skutečných duplicit je stále otevřený; bez browser/E2E testu do společné závěrečné QA. [Evidence](release-prep-2026-10-15/css-cookie-banner-dedup-2026-10-18.md).

### W02 · opakovaný mobilní margin footeru · 18. října 2026

- Z mobilního `@media(max-width:760px)` odstraněno duplicitní `margin:0` pro `.footer__links li`. Pozdější společné pravidlo stejného selectoru už nastavuje `margin:0` na všech šířkách; ostatní mobilní vlastnosti footeru zůstaly.
- Service Worker cache `mysticka-hvezda-2443aab5067e`, asset archiv **1 912** verzí. Širší W02 scan zůstává otevřený; finální browserové ověření stále čeká na společnou závěrečnou QA. [Důkaz](release-prep-2026-10-15/css-footer-list-margin-dedup-2026-10-18.md).

### W02 · další redundance mobilního footeru · 18. října 2026

- Odstraněn úplně přepsaný mobilní blok odkazů a dvě duplicitní deklarace ve druhém `@media(max-width:760px)`: stejné `grid-template-columns` a `grid-column` už zůstávají v prvním bloku stejného breakpointu. Mobilní `gap`, spodní mezera a uvolnění maximální šířky značky zůstaly.
- Service Worker cache `mysticka-hvezda-e0f03117abd0`, asset archiv **1 913** verzí. Zbývající opakované selektory zahrnují skutečné breakpointové úpravy a zůstávají k samostatnému ověření. [Důkaz](release-prep-2026-10-15/css-atlas-footer-duplicates-2026-10-18.md).

**Dílčí oprava W05/W10 · 18. 10.:** placený vztahový výklad za 149 Kč se po výsledku Tarotu ANO/NE ukazuje jen při explicitním vztahovém záměru. Obecný vstup už nedostane nesouvisející vztahovou nabídku a zachová obecnou cestu k výkladu tří karet. Ověřeny vstupní `intent` hodnoty, JS syntaxe a shoda zdroje s načítaným souborem. E2E/browser ověření zůstává na společný závěrečný průchod; W05/W10 zůstávají otevřené. [Evidence](release-prep-2026-10-15/tarot-yesno-upsell-intent-2026-10-18.md).


**Dílčí oprava W06 · 18. 10.:** sedm krátkých kvízů už neukazuje nepravdivý text o skládání výsledku, který se ve skutečnosti zobrazil okamžitě. Skórování ani výsledek se nezměnily; source a distribuce jsou staticky srovnané. Odstraněné jsou i osiřelé loader styly a nepoužívané animace výsledků; styly použité HTML zůstaly. Browserové/E2E ověření zůstává v závěrečné společné QA, široký W06 checkbox zůstává otevřený. [Checkpoint](release-prep-2026-10-15/quiz-immediate-results-2026-10-18.md).

### W02 · odstranění později přepsaných hodnot patičky · 18. října 2026

- Ze sdíleného `atlas-web.css` odstraněny dvě hodnoty bez výsledného účinku: časné `margin-bottom:48px` pro `.footer__grid` přepisuje pozdější společné `32px` a mobilních `20px`; časné `gap:16px 24px` pro `.footer__bottom` přepisuje pozdější `12px 20px` a mobilních `4px 12px`. `flex-wrap:wrap` a všechna výsledná pravidla zůstávají.
- Statický scan odkazů na CSS potvrdil 0 zastaralých referencí. Service Worker cache `mysticka-hvezda-c557830bbe24`, archiv veřejných assetů **1 914** verzí. W02 i browserové ověření patičky zůstávají otevřené do závěrečné QA; kandidát je lokální, produkce beze změny. [Checkpoint](release-prep-2026-10-15/css-atlas-late-overrides-2026-10-18.md).

### W02 · redundantní pozadí natální výukové karty · 18. října 2026

- V `atlas-remaining.css` přesunutí `.natal-learning-card` z pozdější skupiny pozadí zachovalo její odlišný okraj a stín; karta nadále dostává stejné pozadí z dřívější sdílené definice. Výsledná kaskáda se nemění.
- Cache token vrstvy byl sjednocen na 56 HTML stránkách a v `scripts/atlas-shell.mjs`, který dříve generoval zastaralé `?v=1`; cache Service Workeru je `mysticka-hvezda-016a1ca0c124`, archiv **1 915** assetů. [Checkpoint](release-prep-2026-10-15/css-atlas-remaining-card-background-2026-10-18.md). Browserové ověření zůstává na společný závěrečný průchod; produkce beze změny.

### W04 · SVG symboly souhrnu Keltského kříže · 18. října 2026

- Tři ozdobné znakové hvězdičky v šabloně výsledkového souhrnu Keltského kříže používají místní SVG `star` (24 × 24 px) se zachovanou zlatou barvou. Text, význam i výklad zůstaly beze změny.
- Cílený JS build a statická kontrola zdroje, výstupu a sprite prošly. Odkaz na `templates.js` dostal novou verzi na **54** stránkách; Service Worker cache `mysticka-hvezda-576cd4f51ede`, snapshot **1 917** assetů. Podrobnosti: [checkpoint](release-prep-2026-10-15/tarot-celtic-summary-svg-2026-10-18.md).
- Browserové a klávesnicové přijetí čeká na společnou závěrečnou QA. W04 zůstává otevřené; kandidát lokální, produkce beze změny.

### W06 follow-up · nativní počáteční skrytí výsledků biorytmů · 19. října 2026

- `#biorhythm-results` má vedle již existujícího CSS skrytí také nativní HTML atribut `hidden`. Výpočetní JS ho odstraní až po platném datu narození; výpočet, validace a obsah se nemění.
- Jde o dílčí zpevnění stavu W06, ne o uzavření širokého checkboxu. Statická kontrola CSS/JS a browserová kontrola čekají na závěrečný společný průchod. [Checkpoint](release-prep-2026-10-15/biorhythm-native-hidden-state-2026-10-19.md).

### W06 follow-up · chybové stavy kopírování a sdílení afirmace · 19. října 2026

- Selhání Clipboard API vede k přístupné instrukci pro ruční kopírování. Zrušení systémového dialogu sdílení je tiché; jeho jiné selhání zobrazí návod použít „Kopírovat“. Výsledek výpočtu, výběr znamení a obsah afirmace se nemění.
- Zdroj a načítaný ESM bundle jsou staticky ověřené. Browserové ověření všech stavů čeká na společnou závěrečnou QA; široký W06 checkbox zůstává otevřený. [Checkpoint](release-prep-2026-10-15/affirmation-clipboard-feedback-2026-10-19.md).

### W07 · okamžité odhalení Run při omezeném pohybu · 19. října 2026

- Tah Run už při zapnutém omezení pohybu nečeká 1,5 sekundy na dekorativní animaci, kterou stránkový styl potlačil. Běžná volba runy, uložení a animace při výchozím nastavení zůstávají stejné.
- Cílený ESM build a kontrola syntaxe zdroje/bundlu prošly; nová verze Run je v HTML i lokálním bundle. Service Worker cache `mysticka-hvezda-08d372c28cb5`, snapshot **1 927** verzí. Společná závěrečná browser QA zůstává otevřená; tato oprava neuzavírá W07. Produkce beze změny. [Evidence](release-prep-2026-10-15/rune-reduced-motion-draw-2026-10-19.md).

### W07 follow-up · ochrana ručního rolování v mobilních Andělských kartách · 19. října 2026

- Opožděné korekce pozice výsledku se nyní ruší při kolečku, dotyku, klepnutí, klávese nebo změně velikosti okna. Generační čítač zneplatní i starší callback, který již mohl být zařazen ke spuštění.
- Cílený build modulu a kontrola syntaxe zdroje/bundlu prošly. Aktivní stránka má nový JS token; cache Service Workeru `mysticka-hvezda-b8340804e4f6`, snapshot **1 929** assetů. Mobilní přijetí čeká na závěrečný browserový průchod, W07 zůstává otevřené. Kandidát lokální; produkce beze změny. [Evidence](release-prep-2026-10-15/angel-mobile-scroll-cancellation-2026-10-19.md).


**Dílčí optimalizace W12 · 19. 10.:** společné látkové pozadí Tarotu na lásku a CZ/SK Tarotu ANO/NE zmenšeno o 24,1 % při stejných rozměrech. Původní asset zachován pro staré CSS; nové styly mají cache verze. Není to měření LCP ani uzavření W12. Prohlížečové ověření čeká na závěrečnou QA. [Evidence](release-prep-2026-10-15/tarot-background-webp-recompression-2026-10-19.md).


**Dílčí optimalizace W12 · 19. 10.:** hlavní pozadí homepage zmenšeno o 19,7 % při stejném rozměru 1600 × 900; původní asset zůstává pro staré URL. Cílený build homepage bundle, cache Service Workeru a snapshot verzí prošly. Širší build CSS měl samostatnou chybu Node při zápisu nesouvisejícího `site.min.css`; přijetí v prohlížeči čeká na závěrečnou QA. W12 zůstává otevřené. [Evidence](release-prep-2026-10-15/homepage-hero-webp-recompression-2026-10-19.md).


**Dílčí optimalizace W12 · 19. 10.:** hlavní pozadí homepage zmenšeno o 19,7 % při rozměru 1600 × 900; asset a jeho cache URL jsou verzované. Cílený build home.min.css, aktualizace Service Workeru a archiv CSS/JS proběhly. Širší CSS build zaznamenal chybu Node při zápisu nesouvisejícího site.min.css; přijetí homepage v prohlížeči je odložené do závěrečné QA. [Evidence](release-prep-2026-10-15/homepage-hero-webp-recompression-2026-10-19.md). W12 zůstává otevřené.


**Dílčí optimalizace W12 · 19. 10.:** při mobilním zobrazení vztahového spotu na homepage se z existující 600px ilustrace místo 720px background stáhne o 38,7 % méně dat; gradient a desktop zůstaly zachované. Zdroj/bundle, cache a snapshot prošly. Spotlight začíná skrytý, takže úspora platí až po jeho zobrazení. Browserová kontrola čeká na konec. [Evidence](release-prep-2026-10-15/homepage-relationship-mobile-background-2026-10-19.md). W12 zůstává otevřené.


**Dílčí optimalizace W12 · 19. 10.:** článek o biorytmech nyní používá existující responzivní 480/800px varianty; 480px kandidát je o 81,9 % menší než původní 1080px obrázek. Generátor doplní chybějící varianty k již vloženému motivu a zachová alt; po opravě jeho chybné větve úspěšně prošel celý mapovaný běh. Přenos se změří až v závěrečné browser QA. [Evidence](release-prep-2026-10-15/blog-biorhythms-featured-responsive-2026-10-19.md). W12 zůstává otevřené.


**Dílčí optimalizace W12 · 19. 10.:** statické HTML 12 tarotových karet nyní používá responzivní 240/360/600w varianty stejně jako JavaScriptový renderer. Generátor i builder zapisují stabilní shodný markup; 240px kandidát dohromady je o 87,1 % menší než původní soubory. Číslo je velikost kandidáta, nikoli nové měření přenosu. Browser QA čeká na závěr. [Evidence](release-prep-2026-10-15/tarot-meaning-hub-static-responsive-2026-10-19.md). W12 zůstává otevřené.


**Read-only W12 scan · 19. 10.:** mezi veřejnými HTML obrázky ≥90 KB bez vlastního srcset zbývají jen dva, oba jsou v picture s responzivními source variantami. CSS pozadí a skutečný přenos zůstávají zvláštní kontrolou. [Rozsah a omezení](release-prep-2026-10-15/large-html-image-srcset-scan-2026-10-19.md). W12 zůstává otevřené.

**Read-only W12 CSS background scan · 19. 10.:** zdrojové CSS odkazuje na jedno desktopové starší kosmické pozadí nad 60 KB; PL/SK homepage mají stejnou deklaraci, ale pozdější `atlas-web.css` ji podle kaskády potlačuje. URL v CSS sama neprokazuje síťové načtení. Ostatní rastrové backgroundy jsou pod zvoleným prahem. [Inventář a omezení](release-prep-2026-10-15/css-background-image-scan-2026-10-19.md). Zbývá rozlišit další neatlasské konzumenty, polní měření a závěrečné ověření požadavků; W12 je otevřené.

**Dílčí W02/W11 · PL/SK homepage · 19. 10.:** zlatý akcent zvýrazněného slova v hero titulku je obnoven úzkým markerem jen na polské a slovenské úvodní stránce. Ověřeno bez zásahu do textu, odkazů, CTA nebo ostatních lokalizovaných stránek; společná cache a snapshot jsou aktualizované. Vykreslení čeká na závěrečnou vizuální QA. [Checkpoint](release-prep-2026-10-15/localized-home-title-accent-2026-10-19.md).

**Dílčí W10/W11 · PL/SK copy korektura · 19. 10.:** odstraněna duplicitní věta z polské FAQ o opakování dotazu a slovenský úvod Tarotu sjednocen na tykání. FAQ JSON-LD zůstává shodné s viditelnou odpovědí; jazykové a vizuální přijetí čeká na společnou závěrečnou QA. Produkce beze změny. [Checkpoint](release-prep-2026-10-15/localized-crystal-tarot-trust-copy-2026-10-19.md).

**Dílčí W10/W11 · pravdivý základ PL/SK horoskopu · 19. 10.:** otázka o tranzitech byla chybná: API připravuje text ze znamení, období, data a archetypu znamení, nikoli z aktuálních efemerid. PL/SK vysvětlení i FAQ teď popisují automatický symbolický text, ne výpočet tranzitů či individuálního kosmogramu. Při téže kontrole se potvrdilo skryté automatické předávání až tří nejnovějších deníkových záznamů v části přihlášených požadavků; samostatná úloha výše nyní vyžaduje výslovný opt-in. [Checkpoint](release-prep-2026-10-15/localized-horoscope-basis-copy-2026-10-19.md).

### W06 · odemknutí formulářů po změně relace · 19. října 2026

- Astro mapa a Partnerská shoda po změně účtu teď ihned uvolní formulář k novému výpočtu. Pozdní `finally` staršího požadavku smí obnovit ovládání pouze tehdy, pokud stále vlastní aktivní běh; synastrie kontroluje i identitu požadavku. Cílené buildy, syntaxe zdroje/bundlů a `git diff --check` prošly.
- Prohlížečová kontrola visícího požadavku, nového výpočtu a návratu staré odpovědi čeká na závěrečnou společnou QA. W06 zůstává otevřené, lokální kandidát; produkce beze změny. [Evidence](release-prep-2026-10-15/session-change-form-unlock-2026-10-19.md).

### W06 · zotavení po chybě načtení vícekaretního Tarotu · 19. října 2026

- Rozklady se inicializují až po načtení použitelného balíčku; chyba má viditelný přístupný retry a nepoužitelný/krátký katalog nemůže vytvořit prázdný výklad. Text přihlášení odpovídá akci a nový tah odstraní starý výsledek, ale zachová kontext navazující otázky.
- Cílený ESM build, syntaxe zdroje/bundlu, kontrola 78 obrazových karet i `git diff --check` prošly. Retry a výsledek čekají na finální browser QA; W06 zůstává otevřené, produkce beze změny. [Evidence](release-prep-2026-10-15/tarot-deck-load-recovery-2026-10-19.md).

### W06 · stavy Run a ovládání Šamanského kola · 19. října 2026

- Runy mají retry při chybě katalogu, viditelné a přístupné míchání, neinteraktivní kartu výsledku a neměnný záměr během výkladu. Záměrně prázdná Wyrd zůstává v 34položkovém katalogu.
- Šamanské kolo přijímá Enter přes formulář; kopírování oznamuje pravdivý výsledek i při selhání fallbacku. Buildy, syntaxe a statická kontrola prošly; browserové ověření čeká na společný konec. W06 otevřené, lokální kandidát. [Evidence](release-prep-2026-10-15/runes-shaman-states-2026-10-19.md).

### W06 · platnost odkazu obnovy před zadáním nového hesla · 19. října 2026

- Přihlašovací stránka už nezobrazuje formulář nového hesla jen proto, že URL obsahuje `access_token`. Nejdřív ověří token přes nový read-only serverový endpoint; ten vrací pouze `{ valid: true|false }`, odpověď má `Cache-Control: no-store` a endpoint má vlastní limit požadavků. Expirovaný odkaz vrátí uživatele k žádosti o nový odkaz ještě před vyplněním hesla. Pokud token vyprší až mezi kontrolou a odesláním, stejný srozumitelný návrat funguje i z odpovědi na změnu hesla.
- Připravené API a E2E regrese pro platný a expirovaný token. Cílený build přihlašovacího bundlu, syntaxe zdrojů/bundlu/testů a `git diff --check` prošly; Service Worker cache `mysticka-hvezda-6da2f64f5c3a`, snapshot 1 957 verzí.
- Testy ani browserová QA neběžely podle dohody; živý e-mail ani heslo nebyly použity. PV03/W06 zůstává otevřené do společného závěrečného průchodu. Změna je jen v lokálním kandidátovi, produkce beze změny. [Checkpoint](release-prep-2026-10-15/recovery-token-preflight-2026-10-19.md).

### V01 · zdrojové sjednocení pozadí datovaných horoskopů · 19. října 2026

- Aktuální serverová šablona načítá `atlas-web.css` po `style.v2.min.css`, používá `body.atlas-astro-page--dated` a globální `.stars` vrstva je pro tuto třídu skrytá. Sdílený Atlas stylesheet také nahrazuje kořenové kosmické pozadí jednolitým navy povrchem; hero používá malovanou ilustraci. Původní nález z 14. 10. je v aktuálním zdroji překonaný.
- Potvrzeno statickým porovnáním šablony, pořadí stylů a pravidel. Vykreslení všech 12 znamení na mobilu/desktopu ani produkční verze nebyly znovu ověřeny. V01 je zdrojově připravené, W07/W13 vizuální a produkční přijetí zůstává otevřené. Produkce beze změny.

### W10 · symbolické pojetí čakrové vizualizace · 19. října 2026

- Článek `blog/cakrove-leceni-navod.html` nyní rámuje čakry jako symbolickou sebereflexi. Odstraněny nepodložené sliby tělesných účinků, intenzivní dechová technika i seznam očekávaných reakcí a svévolná třídenní lhůta před konzultací. Do skriptového guardrailu přibyly kontroly proti starým tvrzením a za zachování bezpečnostní věty.
- Úpravu podpořila kontrola doporučení NHS k pohodlnému dýchání bez nucení a k naléhavým dechovým potížím. Obecný generátor může článek obnovit z `blog_posts`, ale připojený Supabase projekt tuto veřejnou tabulku nyní nemá a jeho lokální fallback daný slug neobsahuje; generátor jsme nespouštěli. Testy ani browser neběžely podle dohody. Článek zůstává v lokálním kandidátovi, produkce beze změny. [Checkpoint](release-prep-2026-10-15/chakra-article-claim-2026-10-19.md).

### W10 · tykání v potvrzení zrušení členství · 19. října 2026

- Obě potvrzovací hlášky v profilu nyní odpovídají tykání zbytku účtu. Upraven byl jen text; rozlišení okamžitého zrušení a ukončení na konci období, podmínky, požadavek i zachování přístupu se neměnily.
- Staticky zkontrolována přesná větev potvrzení. Testy, build a browserová kontrola jsou odložené do společné závěrečné QA. Lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/profile-cancellation-confirmation-copy-2026-10-19.md).

### W10 · přesné označení podkladů osobního přehledu · 19. října 2026

- Profilové souvislosti se počítají z vlastních poznámek i uložené zpětné vazby. Dynamický nadpis i viditelný štítek nyní označují souhrn jako „podklady“; podmínka počtu signálů ani odvozování témat se nezměnily. Původní interní hodnota analytické dimenze zůstala zachována.
- Zdrojově ověřeny oba vstupní zdroje a zobrazované hodnoty. Testy, build a browserová kontrola jsou odložené do společné závěrečné QA. Lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/profile-memory-source-copy-2026-10-19.md).

### W10/W11 · PL/SK přístup k horoskopům a slovenská CTA natálnej karty · 19. října 2026

- Polský i slovenský horoskopový rozcestník před týdenním/měsíčním přepínačem nově jasně sděluje, že tyto části patří k členství, a odkazuje na české podmínky členství. Viditelná FAQ i FAQPage JSON-LD na obou stránkách používají stejné znění. Slovenská CTA už neslibuje kompletní kartu; vybízí k výpočtu základného prehľadu, který tato stránka skutečně nabízí. Funkce, přístupová pravidla ani výpočet se neměnily.
- Statická kontrola, lokální mobilní/dynamické přijetí čeká na finální QA; W11 zůstává otevřené. [Checkpoint](release-prep-2026-10-15/localized-horoscope-access-and-natal-cta-2026-10-19.md).

### W10/W11 · čitelný a pravdivý úvod lokalizovaných horoskopů · 19. října 2026

- PL/SK hero nyní přímo pojmenovává denní horoskop. Viditelný úvod ladí s již upravenými metadaty: jde o symbolický podnět, nikoli o příslib prospěchu, klidu či pevné předpovědi.
- Čistě textová úprava bez zásahu do výpočtu a UI stavů. Staticky porovnáno s titulkem a description; vizuální zalomení, jazyková a funkční kontrola čeká na společnou QA. W11 zůstává otevřené. [Checkpoint](release-prep-2026-10-15/localized-horoscope-hero-copy-2026-10-19.md).


### W10/W11 · pravdivá PL/SK nabídka křišťálové koule a tarotové stránky · 19. října 2026

- Na PL/SK křišťálové kouli je výslovně uvedena jedna otázka zdarma bez účtu a registrace pro další otázky. Stejná informace je u formuláře, v metadatech a ve viditelném FAQ i FAQPage JSON-LD. Text uvádí až tři otázky denně po registraci, shodně s `DAILY_QUOTA_LIMITS.crystal_ball`; anonymní limit je konfigurovatelný a jeho výchozí hodnota je jedna.
- PL/SK homepage už netvrdí, že karty nelžou nebo dávají jasné odpovědi. Horoskopové karty nabízejí symbolický podnět bez tvrzení o vlivu planet. Slovenská homepage sjednocuje formální a neformální oslovení. Hero obou verzí navíc rámuje astrologii jako symbolickou inspiraci, ne jistotu danou hvězdami. Tarotové stránky popisují výklad jako symbolickou reflexi a neslibují směr, výsledek ani dobu, kdy se údajně projeví význam karty. Viditelné FAQ a JSON-LD jsou sjednocené.
- Bez změny přístupové logiky. Statická kontrola obsahu, FAQ JSON-LD a `git diff --check` prošly; testy, build a browserová QA čekají na společný závěrečný běh. Lokální release kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/localized-crystal-tarot-trust-copy-2026-10-19.md).

**Dílčí korektura W11 · polské CTA z horoskopu na kosmogram · 19. 10.:** polský rozcestník už neslibuje kompletní natální kartu; odkazuje k výpočtu základního kosmogramu, který cílová stránka skutečně nabízí. Staticky ověřeno proti polské cílové stránce; [checkpoint](release-prep-2026-10-15/pl-horoscope-natal-cta-range-2026-10-19.md). Testy, build a prohlížečová QA čekají na závěrečný průchod.

**Dynamické symboly V11 · 19. 10.:** starý `js/daily-card.js` není načítán žádnou HTML stránkou; měsíční fáze se v aktivním rozhraní převádějí na SVG. Následné opravy odstranily emoji také ze sdílení andělské karty i Šamanského kola. Interní canvas náhled je `noindex`. Přehled potvrzuje, že není důvod nahrazovat významové/datové znaky ani generovat další grafiku; exporty a browserové přijetí zůstávají otevřené. [Původní přehled a doplnění](release-prep-2026-10-15/ui-symbols-dynamic-source-review-2026-10-19.md), [andělská karta](release-prep-2026-10-15/angel-card-share-copy-2026-10-19.md), [Šamanské kolo](release-prep-2026-10-15/shaman-wheel-share-copy-2026-10-19.md).

**Statický audit W11 · 19. 10.:** nezávislý průchod všech 13 PL/SK stránek a relevantních sdílených JS vstupů nenašel potvrzený nesoulad jazyka, cílové nabídky, interních URL ani canonical/hreflang. Označení českých cílových funkcí je zachované. Vykreslení a dynamické stavy čekají na závěrečnou QA; W11 zůstává otevřené. [Rozsah a meze](release-prep-2026-10-15/localized-pages-static-audit-2026-10-19.md).

### W01 · zdrojová kontrola hlavní cesty homepage · 19. října 2026

- Host má jednu primární CTA na bezplatný Tarot ano/ne, tři rychlé volby a oddělený seznam dalších nástrojů. Přihlášený uživatel dostane vlastní návratové CTA profilu a tarotu.
- Jednorázový vztahový výklad se zobrazuje až při potvrzené serverové dostupnosti ceny 149 Kč a zůstává odlišený od členství. Statický zdrojový průchod nenašel chybně popsanou cílovou cestu.
- Jde o kontrolu zdrojů, nikoli přihlášeného browserového stavu nebo živého endpointu; W01 zůstává otevřené pro ostatní rodiny navigace. [Checkpoint](release-prep-2026-10-15/homepage-primary-path-review-2026-10-19.md).

### W10 · tykání a kratší popisy na natální kartě · 19. října 2026

- Formulář a popisy aspektů/domů/tranzitů nyní odpovídají tykání zbytku stránky; texty jsou stručnější a popisují planetární postavení vůči natální mapě.
- Zásah je pouze statický copy edit bez změny formuláře nebo výpočtu. [Checkpoint](release-prep-2026-10-15/natal-chart-copy-tone-2026-10-19.md). Vizuální zalomení a další interakce čekají na společnou závěrečnou QA.

### V11 · sjednocení zvířecích symbolů Šamanského kola · 19. října 2026

- Všech 12 výsledků už používá vlastní sdílený SVG symbol ve středu kompasu i v banneru; emoji se ponechávají pouze ve sdílecím textu. Přidáno 10 nových symbolů, dva existující odpovídají hadovi a vlkovi.
- Zdroje jsou sestavené do aktivního JS bundle a verze sprite/CSS/JS jsou obnovené. Prohlížečové zobrazení a závěrečné testy čekají na společnou QA; lokální release kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/shaman-totem-svg-icons-2026-10-19.md).

**Navazující oprava W09/W10 19. 10.:** sdílení horoskopů nyní zachovává denní/týdenní/měsíční volbu v textu WhatsAppu, nativního sdílení, URL i serverových Open Graph metadatech. Parametr období je omezen na podporované volby; klient už uměl stejný parametr při otevření odkazu přečíst. Cíleně sestaven `js/dist/horoscope-share.js` a obnoven jeho HTML cache token. Browserové sdílení a Facebook scraper ověřit až ve společné závěrečné QA; produkce beze změny. [Checkpoint](release-prep-2026-10-15/horoscope-share-period-context-2026-10-19.md).

**Navazující oprava W09 · věrnost e-mailu u vztahového výkladu · 19. 10.:** fulfillment i HTML renderer nyní použijí normalizovaný tvar validátoru. Tím se při opakovaném doručení zachová obsah i tehdy, když uložený výklad používá kompatibilní pole `card1`–`card3`/`question1`–`question3`. Výsledek se znovu negeneruje ani se znovu nelosují karty. Staticky ověřena syntaxe obou serverových modulů a cílový diff; automatický běh, skutečný e-mail a browserová přejímka patří do závěrečné QA. [Checkpoint](release-prep-2026-10-15/relationship-reading-legacy-normalization-2026-10-19.md). Produkce beze změny.

**Dílčí oprava W06/W09 · sdílení Tarotu karta dne · 19. 10.:** tlačítko nyní oznámí nedostupné či neúspěšné sdílení, po operaci se odemkne a úspěch měří až po skutečném sdílení nebo kopírování. Bundle, cache SW `mysticka-hvezda-e0e5b02d052c` a archiv **1 980** verzí jsou aktualizované; syntaxe a diff prošly. Interakční scénáře čekají na dohodnutou společnou závěrečnou QA; produkce beze změny. [Checkpoint](release-prep-2026-10-15/tarot-daily-share-fallback-2026-10-19.md).

**Delegovaný W02 read-only scan · 19. 10.:** pomocník `gpt-6-luna` (low) nedodal CSS nález; ve své izolované kontrole uvedl, že nenašel TODO soubor. Jeho poznámka o `.cookie-banner` nebyla důkazem redundance, protože pozdější deklarace mění výsledné vlastnosti. CSS zůstává beze změny; další W02 kandidát musí vycházet z kontroly skutečného worktree.

**Dílčí W04/W09 · Andělská karta, sdílecí grafika · 19. 10.:** export PNG používá společné malované navy pozadí se zlatým rámem; horní značkové záhlaví je kvůli velké ilustraci vypnuté, ostatní exporty zachovávají výchozí vzhled. Cílený build, syntaxe, lint, diff, Service Worker cache `mysticka-hvezda-e853876297ea` a snapshot **1 984** verzí prošly. Vizuální exportní kontrola čeká na závěrečnou QA; produkce beze změny. [Checkpoint](release-prep-2026-10-15/angel-card-share-background-2026-10-19.md).


**Dílčí W04/W09/W11 · slovenský export Tarot ÁNO/NIE · 19. 10.:** výstupní PNG opustil fialový gradient, 220 dekorativních hvězd a dvojitý rámeček; používá stejné malované navy pozadí, krémový text a zlatý rám jako sdílené exporty. Odpověď, otázka, text i analytika zůstaly beze změny. Cílený build, syntaxe, lint a diff prošly; test a vizuální PNG kontrola čekají na závěrečnou QA. Produkce beze změny. [Checkpoint](release-prep-2026-10-15/sk-tarot-yes-no-share-style-2026-10-19.md).


**Interní W04/W09 follow-up · náhled horoskopového sdílení · 19. 10.:** noindex canvas už nepoužívá fialovou mlhovinu, hvězdy ani neověřený příklad s Marsem. Zobrazuje atlasovou krajinu, tlumený navy/zlatý styl a výslovně ukázkový text; doplněný název canvasu. Build, syntaxe, lint a diff prošly; vizuální ověření na závěrečnou QA. Jde o interní ilustrativní náhled, ne důkaz shody s produkčním exportem. [Checkpoint](release-prep-2026-10-15/horoscope-share-preview-cleanup-2026-10-19.md).

**Dílčí W02/W09 · osiřelý generátor hvězd v horoskopovém exportu · 19. 10.:** aktivní `js/horoscope-share.js` kreslí malovanou krajinu, ale obsahoval nevolanou funkci `drawStars`. Byla odstraněna ze zdroje i aktualizovaného bundlu; obsah sdílení a renderovací výsledek se nemění. Syntaxe, cílený ESLint, verze stránky, cache SW `mysticka-hvezda-2d63cea360f1` a asset archiv **1 992** verzí prošly. Bez testů a vizuální QA do společného konce; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/horoscope-share-dead-stars-cleanup-2026-10-19.md).

**Dílčí W07/W09 · e-maily sjednocené s Atlasem · 19. 10.:** sdílený základ i inline akcenty modulu `server/email-service.js` nyní používají navy, krémovou a tlumené zlato místo fialové a zářivě žluté. Hlavní tabulka má prezentační roli a barevný fallback; doplněno `lang`/`dir`. Text, ceny, podmínky, přílohy ani cílové odkazy se neměnily. Syntaxe, ESLint, diff check, statický scan a kontrasty nové palety prošly. E-mailové klienty a tmavý režim je nutné posoudit ve společné QA; produkce beze změny. [Checkpoint](release-prep-2026-10-15/transactional-email-atlas-refresh-2026-10-19.md).

**Navazující průzkum W09 · 19. 10.:** zdrojový scan dalších serverových šablon našel staré zlaté akcenty v `server/services/horoscope-pdf.js` a `server/scripts/send-newsletter.js`. Aktivní cesta newsletterového skriptu ani výsledný PDF výstup v tomto kroku ověřené nejsou; před jejich úpravou je nutné určit, které šablony jsou používané a jak se vykreslují.

**Dílčí oprava W09 · roční horoskop PDF · 19. 10.:** potvrzená aktivní šablona `server/services/horoscope-pdf.js` nyní používá atlasové navy pozadí, tlumené zlato a modrozelený akcent místo staré fialové/ostře zlaté palety. Text výkladu, struktura stran a produktová cesta se neměnily. Syntaxe, ESLint, diff check a scan původních barev prošly. Výsledné PDF nebylo generováno ani vizuálně přijato; to patří do společné závěrečné QA. Newsletterový skript zůstává neověřeným kandidátem. [Checkpoint](release-prep-2026-10-15/annual-horoscope-pdf-atlas-palette-2026-10-19.md). Produkce beze změny.

**Navazující ověření W09 · plánovaný newsletter · 19. 10.:** repozitářová cesta `server/index.js` → `server/jobs/weekly-newsletter.js` → `server/jobs/email-queue.js` → `server/email-service.js` skutečně enqueueuje `newsletter_weekly_digest`; jeho tělo používá aktualizovaný společný základ Atlas. Samostatný `server/scripts/send-newsletter.js` není zapojený do této plánované cesty ani do package/CI registrace; je to ruční CLI, které vyžaduje `--send` a rozesílá přímo aktivním odběratelům. Neprověřovali jsme externí operátorské spouštění. Skript zůstává odděleným ručním nástrojem se starým vzhledem a bez nynější úpravy; před jeho případným použitím je třeba posoudit jeho samostatnou šablonu a obsah. [Důkaz](release-prep-2026-10-15/transactional-email-atlas-refresh-2026-10-19.md). Produkční běh jobu není potvrzen bez kontroly runtime konfigurace.

**Dílčí oprava W09 · ruční newsletterový e-mail · 19. 10.:** samostatná HTML šablona v `server/scripts/send-newsletter.js` sjednocena s Atlas navy, krémovou a tlumeným zlatem; záložní barvy jsou doplněny přes `bgcolor` a rychlé odkazy používají tabulkovou strukturu místo `flex`. Příjemci, obsah i přímý způsob odesílání se neměnily. Syntaxe, lint, diff check a scan původní palety prošly. Skript se nespouštěl; jeho statický lunární obsah a tvrzení je nutné před jakýmkoli ručním odesláním aktualizovat a ověřit. Náhled v e-mailových klientech patří do závěrečné QA. [Checkpoint](release-prep-2026-10-15/manual-newsletter-atlas-refresh-2026-10-19.md). Produkce beze změny.

**Dílčí oprava W10 · karma a reinkarnace · 19. 10.:** slovník už nepopisuje karmu jako přesný univerzální zákon nebo vysvětlení cizího utrpení karmickým dluhem. Reinkarnaci uvádí jako duchovní představu s různými výklady a astrologický výklad uzlů jako symbolickou interpretaci, ne důkaz minulých životů. Zdrojové záznamy, dva vygenerované články a index byly synchronizovány. Statická kontrola syntaxe, ESLint, cílený scan odstraněných tvrzení a diff check prošly; browserová QA zůstává na závěrečný společný průchod. Lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dictionary-karma-reincarnation-trust-copy-2026-10-19.md).

**Navazující oprava W10 · Dračí uzly · 19. 10.:** související pojem už nevydává minulé životy za vysvětlení vrozených reakcí, osobní stagnaci ani zatmění za předzvěst nevyhnutelných přelomových událostí. Astrologický význam obou uzlů je označen jako symbolická interpretace a zakončen otázkou pro vlastní reflexi. Záznam, stránka i index byly synchronizovány. Syntaxe, ESLint, cílený scan odstraněných tvrzení a diff check prošly; společná funkční/vizuální QA a produkční nasazení zůstávají otevřené. [Checkpoint](release-prep-2026-10-15/dictionary-dragon-nodes-trust-copy-2026-10-19.md).

**Dílčí oprava W10 · natální karta a Saturnský návrat · 19. 10.:** slovník už nevydává natální mapu za otisk duše nebo nástroj, který odhalí poslání, karmickou minulost a talenty; její oblasti jsou popsány jako astrologická symbolika k zamyšlení. Saturnský návrat už neslibuje krizi, ztrátu ani zásadní životní transformaci. Dvě stránky a index byly vygenerovány ze společného zdroje. Statické kontroly prošly, funkční a vizuální QA zůstává na závěr; produkce beze změny. [Checkpoint](release-prep-2026-10-15/dictionary-natal-saturn-trust-copy-2026-10-19.md).

**Dílčí oprava W10 · tarotový slovník · 19. 10.:** Velká a Malá Arkána i Blázen už netvrdí, že karty zobrazují univerzální psychické archetypy, mapu lidského vývoje nebo téměř jistě předpovídají začátek a výsledek události. Významy jsou uvedeny jako různorodé tradice a podněty k zamyšlení. Tři stránky a index byly synchronizovány; syntaxe, ESLint, cílený scan původních tvrzení a diff check prošly. Závěrečná funkční/vizuální QA a produkce zůstávají otevřené. [Checkpoint](release-prep-2026-10-15/dictionary-tarot-basics-trust-copy-2026-10-19.md).

**Dílčí oprava W10 · Descendent a Chiron · 19. 10.:** slovník už nepředpovídá, koho bude člověk milovat, jaký bude mít vztah ani jaké trauma či „léčitelský dar“ Chiron odhalí. Astrologické asociace jsou označeny jako symbolika; CTA slibují jen otevření odpovídající funkce. Dvě stránky a index byly synchronizovány. Syntaxe, ESLint, scan starých tvrzení a diff check prošly; funkční/vizuální QA zůstává na závěr. Produkce beze změny. [Checkpoint](release-prep-2026-10-15/dictionary-descendent-chiron-trust-copy-2026-10-19.md).

**Dílčí W05/W10 · spánková paralýza · 19. 10.:** vysvětlení nyní popisuje přechod mezi REM spánkem a bděním, ne „evoluční ochranný mechanismus“ ani prokázanou bránu do astrálu. Příčiny jsou formulovány jako souvislosti, ne jistota; CTA Snáře už neslibuje odhalení podvědomí. Zdroj, detail a index byly synchronizovány, syntaxe, ESLint, cílený scan a diff check prošly. Závěrečná funkční/vizuální QA zůstává otevřená. [Checkpoint](release-prep-2026-10-15/dictionary-sleep-paralysis-accuracy-2026-10-19.md). Produkce beze změny.

**Dílčí W05/W10 · lucidní snění · 19. 10.:** definice už nezaměňuje uvědomění, že člověk sní, s úplnou kontrolou snu. Neobvyklý obsah není vydáván za důkaz lucidity a cvičební postupy neslibují výsledek. Stránka a index byly vygenerovány; syntaxe, ESLint, scan původních tvrzení a diff check prošly. [Checkpoint](release-prep-2026-10-15/dictionary-lucid-dream-accuracy-2026-10-19.md). Produkce beze změny; funkční a vizuální QA zůstává na společný konec.

**Dílčí W05/W10 · slovník čaker · 19. 10.:** tři hesla už nepředstavují čakry jako anatomické nebo zdravotní systémy, nemluví o „blokacích“ jako příčině potíží a neslibují léčení ani bezpečí pomocí barev, minerálů a manter. Výklady jsou jasně zasazené do různých duchovních tradic, s volitelnými otázkami pro reflexi. Tři stránky a index synchronizovány; statické kontroly prošly. [Checkpoint](release-prep-2026-10-15/dictionary-chakra-trust-copy-2026-10-19.md). Produkce beze změny; funkční/vizuální QA na závěr.

**Dílčí W05/W10 · tři runová hesla · 19. 10.:** Fehu, Hagalaz a Tiwaz už nepředpovídají peníze, krizi ani vítězství ve sporu. Text rozlišuje pojmenování run od současných esoterických asociací a nabízí pouze otázky k vlastní úvaze. Tři stránky a index byly synchronizovány; syntaxe, ESLint, cílený scan a diff check prošly. [Checkpoint](release-prep-2026-10-15/dictionary-runes-trust-copy-2026-10-19.md). Produkce beze změny; závěrečná vizuální/funkční QA otevřená.

**Dílčí W10 · základní astrologické pojmy · 19. 10.:** Ascendent už neurčuje, jak člověka vidí ostatní; aspekty nepřinášejí objektivní dary nebo překážky a retrográdní pohyb planet neslibuje komplikace ani návrat bývalých partnerů. Oddělena geometrie od astrologické interpretace. Tři stránky a index obnoveny, statické kontroly prošly. [Checkpoint](release-prep-2026-10-15/dictionary-astrology-basics-trust-copy-2026-10-19.md). Produkce beze změny; závěrečná QA otevřená.
**Navazující W05/W10 · článek a slovníkové heslo o Lilith · 19. 10.:** odstraněny výroky, které určovaly trauma, sexualitu nebo skrytou povahu podle znamení či domu, a neověřený slib, že natální kalkulačka zobrazuje Lilith. Text nyní rozlišuje výpočtovou variantu od symbolického výkladu; slovník a blogový index jsou synchronizované. Konkrétní ilustrace používá správné OG rozměry. Blogový generátor se nespouštěl: propojený Supabase projekt nemá očekávanou tabulku a článek chybí i v lokální demo sadě. Browserová QA a ověření kanonického publikačního zdroje zůstávají otevřené. Lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/lilith-article-trust-refresh-2026-10-19.md).

**Navazující W05/W10 · článek a edukační karty k Chironovi · 19. 10.:** článek už nevyvozuje trauma, osobnost, léčebnou roli nebo krizi z Chirona; 12 znamení nabízí jen symbolické otázky. Natální stránka nyní přesněji označuje Chiron/Lilith jako edukační témata a nepředstírá, že je kalkulačka počítá. Slovníkový odkaz, blogový index i nová odlišná atlasová ilustrace jsou synchronizované. Zdroj článků v Supabase není potvrzen, proto nebyl spuštěn blogový generátor. Statické kontroly prošly; browserová QA a produkční zdroj zůstávají otevřené. Lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/chiron-article-claim-refresh-2026-10-19.md).

**Navazující W05/W10 · článek o spřízněné duši · 19. 10.:** pět emocí a okolností setkání už nejsou vydávané za důkaz karmického pouta, minulých životů nebo kompatibility. Text vede čtenáře k posouzení skutečného chování, respektu, hranic a bezpečí; opakovaná CTA a nesouvisející odkazy byly zredukovány na jednu přesnou nabídku a tři vztahové návaznosti. Titulek, index a konkrétní obrázek se shodují. Statické kontroly prošly, blogový generátor ani Supabase nebyly použity kvůli chybějícímu zdroji `public.blog_posts`. Lokální kandidát; produkce beze změny. [Checkpoint](release-prep-2026-10-15/soulmate-article-claim-refresh-2026-10-19.md).

### W05/W10 · zjednodušení vztahových článků a důvěryhodné CTA · 19. října 2026

- Článek o attachmentu už neslouží jako sebetest ani nedovozuje styl z dětství, jednoho chování nebo astrologie. Odstraněny nepodložené počty, univerzální párové vzorce a terapeutické sliby; CTA popisuje jen symbolickou partnerskou shodu.
- Článek o synastrii odděluje astrologické asociace od ověřitelných vlastností vztahu. Odebrány predikce kompatibility a dlouhodobosti, skrytá FAQ strukturovaná data a slib plné synastrie u základního nástroje. Oba texty mají specifické sladěné náhledy a indexové údaje. Datum publikace synastrie má ve statickém HTML a indexu rozpor a čeká na potvrzení kanonického zdroje.
- Staticky ověřena shoda H1/title/indexu, OG obrázků, JSON-LD, cílové cesty a odstraněných claimů. Browserová/funkční QA čeká na společný závěrečný průchod. [Checkpoint](release-prep-2026-10-15/relationship-article-trust-refresh-2026-10-19.md). Lokální kandidát, produkce beze změny.

### W09/W10 · správná nabídka po Tarotu ANO/NE · 19. října 2026

- Odstraněn veřejný fallback na členství za 199 Kč/měsíc z výsledku bezplatného ANO/NE. Hosté uvidí vztahový výklad za 149 Kč jen pro vztahový záměr a při potvrzené dostupnosti produktu; při výpadku zůstane bezplatný výsledek bez náhradního prodeje.
- Už ve výsledkové nabídce je jasně uvedeno, že placený výklad vzniká automaticky podle otázky a tří náhodně vybraných karet, stejně jako na objednávkové stránce.
- Na přímé objednávkové stránce je automatický vznik uvedený v úvodu i u ceny, nejen v rozbalovacím FAQ.
- Nabídka je rámovaná jako další pohled na otázku, ne jako jistá odpověď na její výsledek.
- Aktivní člen má samostatné přímé pokračování do tří karet. Připravené regrese pokrývají obecný záměr bez upsellu i neplatnou cenu/měnu z API; nebyly spuštěny. Starý členský upsell a jeho impression event jsou odstraněné; jednorázové funnel události zůstaly zachované.
- Zdroj a aktivní bundle prošly kontrolou syntaxe, cílený diff nemá whitespace chyby. Připravené regresní scénáře, browserová/vizuální QA a ověření účtu čekají na jeden společný závěrečný běh. [Checkpoint](release-prep-2026-10-15/tarot-yes-no-offer-separation-2026-10-19.md). Lokální kandidát, produkce beze změny.

  - Dílčí úprava 19. 10.: pět slovníkových CTA nadpisů nyní používá sdílené SVG symboly partner, chart, dream, angel a wave; zdroj i pět generovaných detailů jsou synchronizované. Syntaxe a node server/scripts/generate-dictionary.js --check prošly. Přístupnost a vykreslení čekají na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/dictionary-cta-svg-symbols-2026-10-19.md).

**Dílčí W11 · patička exportu sdíleného horoskopu · 19. 10.:** dvě dekorativní znakové hvězdy kolem domény byly odstraněny ze zdroje i aktivního bundlu; zlatá linka, doména, středový diamant a významový glyf znamení zůstaly. Cache token stránky, Service Worker otisk i archiv assetů jsou obnovené. Syntaxe, cílený ESLint a diff check prošly; výsledný canvas se neotevíral a vizuální sdílení čeká na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/horoscope-share-brand-footer-symbols-2026-10-19.md). W11 zůstává otevřený; produkce beze změny.

**Dílčí W05/W10 · lokalizovaná Křišťálová koule · 19. 10.:** slovenský a polský dlouhý popis už neslibují potvrzení toho, čemu návštěvník předem věří; výsledek popisují jako jiný úhel pohledu a u důležitých rozhodnutí připomínají ověření faktů. Samostatně ověřeno, že fallback odpověď už klient označuje lokalizovanou poznámkou. [Checkpoint](release-prep-2026-10-15/crystal-ball-localized-confirmation-copy-2026-10-19.md). Statická kontrola změněného textu zůstává jediným ověřením této dílčí úpravy; browser QA až na závěr, produkce beze změny.

**Dílčí oprava W01/W06 · homepage Tarot karta dne · 19. 10.:** tři staré homepage E2E scénáře závisely na odstraněném andělském widgetu. Nahradil je aktuální scénář tarotové karty dne a jejích navázaných odkazů; současně přibyly samostatné regrese pro kopírování a chybové stavy sdílení na stránce karty dne. Testy se podle dohody nespouštěly; chování se ověří při společné závěrečné QA. [Checkpoint](release-prep-2026-10-15/homepage-tarot-daily-regression-2026-10-19.md). Produkce beze změny.

**Dílčí W06 · zdrojový review natálního formuláře · 19. 10.:** pomocník `gpt-6-luna` (low) porovnal stránku, zdroj i aktivní bundle; nenašel konkrétní nesoulad v načítání, chybě/retry ani ochraně relace. Beze změny zdroje, testy odloženy na společný závěrečný běh. [Záznam review](release-prep-2026-10-15/natal-chart-form-source-review-2026-10-19.md).

**Navazující optimalizace W12 · mobilní tarotová textilie · 19. 10.:** Tarot na lásku a český/slovenský Tarot ANO/NE teď na mobilu 1× načítají 800×450 pozadí s 38 820 B místo 109 226 B; 2× dál používá optimalizovaný originál. CSS/HTML tokeny jsou synchronizované a asset snapshot obsahuje **2 014** verzí. CSS parser a diff check prošly; prohlížečové přijetí, skutečný přenos a vizuální kvalita čekají na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/tarot-cloth-mobile-background-2026-10-19.md). Produkce beze změny.

**Dílčí úprava W05/W10 · Šamanské kolo · 19. 10.:** úvodní odstavec nyní jasně popisuje, co nástroj odvozuje z data narození, používá tykání a rámuje výsledek jako námět k sebereflexi. Sjednotil jsem také tři popisky výsledku a přístupný název kompasu. Metadata jsou s hlasem stránky sladěná. Při současném zdrojovém průchodu jsem potvrdil, že biorytmy už nemají původně auditovaný obecný 11karetní katalog a Aura už má jednu návaznost i sbalené vysvětlení; tyto staré kandidáty se znovu neimplementují. Funkční a vizuální QA zůstává na společný závěr. [Checkpoint](release-prep-2026-10-15/shaman-wheel-hero-copy-2026-10-19.md). Kandidát lokální, produkce beze změny.

**Dílčí W10 · hlavní stránky a profil · 19. 10.:** Hvězdný průvodce a profil mají popisy sladěné s tykáním a skutečným obsahem; neutrální e-mailový příklad v odběru horoskopu už neoslovuje vykáním a placeholder aktuálního hesla v profilu odpovídá sousedním formulářovým popiskům. V partnerské shodě ponecháno „Hodíte se k sobě?“ — přirozeně oslovuje oba členy páru a není to vykání. Staticky ověřeny HTML hodnoty a že stránku průvodce nepřepisuje jiný metadata skript; starý `profile-copy-fixes.js` se z `profil.html` nenačítá a nebyl upravován. Vizuální a funkční kontrola textu čeká na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/main-page-meta-voice-2026-10-19.md). Lokální kandidát, produkce beze změny.

**W05/W10 · Minulý život · 19. 10.:** Úvod a metadata teď jasně říkají, že jde o automaticky sestavený symbolický příběh, ne ověřitelnou vzpomínku či regresi; odstraněno tvrzení, že může něco „odhalit“. Přeformulována výzva k vyplnění i sdělení, kdy se údaje odešlou. Lokální náhled před odemčením už není označen jako hotový výklad. FAQ viditelně i v JSON-LD popisuje stejný automatický symbolický výstup. Opraven také aktivní přepis hero/metadat, sestaveny cílené JS bundly a uložen asset snapshot (2 018 verzí); Service Worker už měl aktuální cache hash. [Checkpoint](release-prep-2026-10-15/past-life-trust-copy-2026-10-19.md). Browserové a funkční ověření zůstává na společný závěrečný běh; lokální kandidát, produkce beze změny.

**Dílčí W05/W10 · Snář a denní afirmace · 19. 10.:** Snář už neprezentuje snové symboly jako univerzální psychologické závěry; upraveny meta/OG, hero a šest odpovědí, které se přesně shodují s JSON-LD. Prompt rozboru snu žádá možné interpretace bez tvrzení o skrytém obsahu podvědomí. Denní afirmace je podle vybraného znamení; fáze Měsíce se zobrazuje samostatně, ne jako vstup generování. HTML a runtime copy jsou sladěné, CTA používá název „členství“. Bundly sestaveny, Service Worker hash zůstal aktuální, asset snapshot má 2 024 verzí. JSON-LD, FAQ shoda a cílený diff check prošly. Výkladové regrese a browserová/funkční QA čekají na společný závěrečný běh. [Checkpoint](release-prep-2026-10-15/dreams-affirmations-copy-claims-2026-10-19.md). Lokální kandidát, produkce beze změny.

**Dílčí W05/W10 · snář: pět symbolů s nepodloženými tvrzeními · 19. 10.:** upraveny popisy dárků, krve, nemoci, křišťálové koule a komety. Text připouští osobní asociace a kulturní symboliku, ale neslibuje budoucnost, jasnovidnost ani neurčuje psychický či zdravotní stav. Generátor změnil přesně pět z 164 hesel. Zdrojová a generovaná znění souhlasí; test generátoru i browserová QA jsou odložené na společný závěrečný běh. [Checkpoint](release-prep-2026-10-15/dream-symbols-claims-batch-2026-10-19.md). Lokální kandidát, produkce beze změny.

**Navazující W05/W10 · snář: cesta, maska, labuť, výhra a auto · 19. 10.:** dalších pět hesel opustilo předpovědi a jisté závěry o důvěře, vztazích či psychice. Generované stránky přesně odpovídají zdrojům; cílený diff check prošel. Zbývající auditované symboly a závěrečná QA jsou stále otevřené. [Checkpoint](release-prep-2026-10-15/dream-symbols-claims-batch-2-2026-10-19.md). Lokální kandidát, produkce beze změny.

**Navazující W05/W10 · snář: nestíhání, dům, pláč, škola a tarot · 19. 10.:** pět dalších hesel teď nabízí možné asociace a otázky místo diagnóz, tvrzení o traumatu či objektivním poselství. Zdroj a všech pět detailů souhlasí; zbytek slovníku i závěrečná QA zůstávají otevřené. [Checkpoint](release-prep-2026-10-15/dream-symbols-claims-batch-3-2026-10-19.md). Lokální kandidát, produkce beze změny.

**Další W05/W10 · šest nejnavštěvovanějších hesel snáře · 19. 10.:** zuby, těhotenství, smrt, padání, létání a bývalý partner už nepředstavují jednotný psychologický závěr ani předpověď; jejich výklady zdůrazňují osobní kontext. Vygenerováno 6/164 detailů a zdrojová shoda ověřena. Úplný audit ostatních hesel a finální testy jsou otevřené. [Checkpoint](release-prep-2026-10-15/dream-symbols-top-six-trust-2026-10-19.md). Lokální kandidát, produkce beze změny.

**Navazující W05/W10 · hádka, kočka a peníze ve snáři · 19. 10.:** zbývající tři prioritní kandidáty z read-only auditu jsme přepsali jako možné asociace, ne univerzální diagnózy či předpovědi. Rozšířený text a generované detaily odpovídají zdrojům. Tím je zpracována první prioritní dávka auditu; zbývá projít i jiné formulace mimo ni a ověřit vše v závěrečné QA. [Checkpoint](release-prep-2026-10-15/dream-symbols-claims-batch-4-2026-10-19.md). Lokální kandidát, produkce beze změny.

**Dílčí W05 · zjednodušení detailu Snáře · 19. 10.:** na všech 164 stránkách jsou čtyři doplňující výklady sbalené do nativního rozbalovacího prvku. Jedna praktická otázka nahradila tři obecné; duplicitní výchozí FAQ text i markup odstraněny, vlastní viditelné FAQ Run zůstalo. Strukturální JSON-LD/parita, 24 prioritních definic, cache a asset snapshot jsou staticky ověřené. Mobilní, klávesnicová a vizuální přejímka i test generátoru patří do závěrečné QA. [Checkpoint](release-prep-2026-10-15/snar-details-and-duplicate-content-2026-10-19.md). Lokální kandidát, produkce beze změny.

**Dílčí W05/W10 · důvěryhodnost osmi hesel Snáře · 19. 10.:** opraveny stručné i rozšířené výklady sopky, těla, vody, útěku, zrcadla, hada, prstenu a zesnulých. Odstraněny skryté psychologické diagnózy, zdravotní mapování, vztahové věštby a tvrzení o ověřitelných zprávách; symbolika je nyní osobní či kulturní metafora. Read-only průzkum provedl gpt-5.6-sol (low). Osm detailů bylo znovu vygenerováno a 40 zdrojových polí staticky ověřeno proti stránkám; diff check prošel. Úplný audit Snáře i závěrečná funkční/vizuální QA zůstávají otevřené. Lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-2026-10-19.md).

**Další dílčí W05/W10 · důvěryhodnost osmi hesel Snáře · 19. 10.:** upraveny stručné i rozšířené výklady moře, myši, nahoty, ohně, vlka, potopy, zemětřesení a zlaté rybky. Odstraněny psychické diagnózy, skryté příčiny, předtuchy a genderové soudy; kulturní a pohádková symbolika zůstala jako metafora. Read-only audit provedl gpt-5.6-sol (low). Osm detailů bylo přegenerováno a 40 zdrojových polí staticky ověřeno proti stránkám. Celkový test a browserová QA zůstávají na závěr; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-2-2026-10-19.md).

**Třetí dílčí W05/W10 · dalších osm hesel Snáře · 19. 10.:** upraveny stručné i rozšířené výklady koně, léku, psa, bouře, démona, miminka, polibku a květin. Odstraněny zdravotní/psychické závěry, sliby uzdravení, předpovědi zrady či vztahu a jisté příčiny snu. Read-only audit provedl gpt-5.6-sol (low). Osm detailů bylo přegenerováno, všech 40 zdrojových polí staticky ověřeno. Funkční a browserová QA čekají na závěr; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-3-2026-10-19.md).

**Čtvrtá dílčí W05/W10 · důvěryhodnost dalších osmi hesel Snáře · 19. 10.:** aktualizovány stručné i rozšířené výklady ducha, hrobu, medvěda, porodu, svatby, pavouka, sněhu a měsíce. Odebrány skryté psychologické závěry, předpovědi i tvrzení o zprávách od zemřelých; symbolika je uvedená jako možná osobní či kulturní metafora. Přegenerováno osm detailů a ověřeno všech 40 polí proti zdrojům. Celková funkční a browserová QA čeká na závěr; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-4-2026-10-19.md).

**Pátá dílčí W05/W10 · důvěryhodnost dalších osmi hesel Snáře · 19. 10.:** přepracovány stručné i rozšířené výklady strážného anděla, výtahu, kadidla, lucidního snění, slunce, včely, ledu a zvonu. Jisté výroky o nadpřirozené ochraně, účinku rituálů, psychickém stavu a budoucích událostech byly nahrazeny osobními asociacemi nebo kulturní symbolikou. Osm detailů je přegenerováno; všech 40 polí odpovídá zdrojům. Funkční a browserová QA čekají na společný závěr. Lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-5-2026-10-19.md).

**Šestá dílčí W05/W10 · duchovní motivy ve Snáři · 19. 10.:** přepracováno osm hesel: Bůh, andělé, požehnání, kletba, kyvadlo, bílé světlo, fénix a červená barva. Odstraněna tvrzení o skutečném nadpřirozeném kontaktu, ochraně, účinnosti rituálů, neomylnosti intuice, diagnózách a předpovědích; víra a mytologie jsou označené jako tradice či metafora. Osm detailů je přegenerováno, všech 40 polí odpovídá zdrojům. Funkční a browserová QA čekají na společný závěr; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-6-2026-10-19.md).

**Sedmá dílčí W05/W10 · symbolické výklady Snáře · 19. 10.:** upraveno osm hesel: osud, přesýpací hodiny, sfinga, jin-jang, strom života, květ života, pohár a delfín. Jisté předpovědi, pokyny, psychologické závěry a tvrzení o kosmickém řádu jsou nahrazené osobními asociacemi či kulturní symbolikou. Přegenerováno osm detailů; všech 40 polí odpovídá zdrojům. Funkční/browserová QA stále čeká na společný závěr; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-7-2026-10-19.md).

**Osmá dílčí W05/W10 · důvěryhodnost dalších osmi hesel Snáře · 19. 10.:** upraveny černá barva, havran, blesk, velryba, zlatý klíč, sova, růže a maják. Odstraněny psychické závěry, jisté skryté pravdy, věštby a vztahové předpovědi; tradice zůstávají označené jako kulturní symboly. Osm detailů je přegenerováno, všech 40 textových polí odpovídá zdrojům. Funkční/browserová QA čeká na společný závěr; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-8-2026-10-19.md).

**Devátá dílčí W05/W10 · důvěryhodnost dalších osmi hesel Snáře · 19. 10.:** přepracovány jezero, záchrana, loď, strom, ryba, lev, hvězdy a čísla. Odstraněny psychologické závěry a předpovědi; numerologie i další symbolické systémy jsou označené jako víra či kulturní rámec. Osm detailů je přegenerováno a 40 textových polí odpovídá zdrojům. Funkční a browserová QA čekají na společný závěr; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-9-2026-10-19.md).

**Desátá dílčí W05/W10 · důvěryhodnost dalších osmi hesel Snáře · 19. 10.:** upraveny duha, drak, krabice, slon, klíč, hora, boty a bílá barva. Odstraněny sliby výsledku, psychické diagnózy, jisté skryté obsahy a nadpřirozené vedení; mýty a tradice zůstávají označené jako symboly. Osm detailů je přegenerováno a všech 40 polí souhlasí se zdrojem. Funkční/browserová QA čeká na závěr; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-10-2026-10-19.md).

**Jedenáctá dílčí W05/W10 · důvěryhodnost dalších osmi hesel Snáře · 19. 10.:** upraveny okno, plavání, bloudění, telefon, modrá barva, hmyz, tanec a dveře. Odstraněny psychické diagnózy, vztahové závěry, kontakt se zesnulými vydávaný za ověřený i pokyny k jednání podle snu. Osm detailů je přegenerováno a 40 polí odpovídá zdrojům. Funkční/browserová QA čeká na závěr; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-11-2026-10-19.md).

**Dvanáctá dílčí W05/W10 · důvěryhodnost dalších osmi hesel Snáře · 19. 10.:** upraveny vězení, policie, most, poklad, schody, kniha, bludiště a orel. Odstraněny závěry o vině, osobnosti, skrytém talentu, vztazích a budoucím pokroku; symbolika je možný kulturní rámec. Osm detailů je přegenerováno a všech 40 polí odpovídá zdrojům. Funkční/browserová QA čeká na závěr; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-12-2026-10-19.md).


**Třináctá dílčí W05/W10 · důvěryhodnost dalších osmi hesel Snáře · 19. 10.:** upraveny vlna, ostrov, poušť, oltář, jablko, les, svíčka a vítr. Odstraněny nepodložené předpovědi, psychologické závěry, podezřívavá varování i sliby úlevy. Osm detailů je přegenerováno a všech 40 polí odpovídá zdrojům. Funkční/browserová QA čeká na závěr; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-13-2026-10-19.md).


**Čtrnáctá dílčí W05/W10 · důvěryhodnost dalších osmi hesel Snáře · 19. 10.:** upraveny hlad, studna/pramen, hodiny, poutník, zahrada, zřícenina, chrám a želva. Odstraněny diagnózy, proroctví a rady odvozené ze snu. Všech 40 polí odpovídá zdrojům; izolovaný render porovnán se všemi 164 stránkami. Přímý generátor skončil na zápisu snar/hodiny.html, výstup byl aplikován přes .NET writer a dočasné soubory odstraněny. Závěrečné testy a browser QA čekají; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-14-2026-10-19.md).


**Patnáctá dílčí W05/W10 · důvěryhodnost dalších osmi hesel Snáře · 19. 10.:** upraveny tma, vlasy, zapomenuté dítě, nůž, rodina, křižovatka, jednorožec a pohádkové bytosti. Odstraněny diagnózy, podezření na zradu, nátlakové rady a tvrzení o nadpřirozenu jako faktu. Všech 40 polí sedí se zdroji; render 164 stránek i rozcestník souhlasí. Přímý zápis generátoru do existujícího HTML stále vrací Windows UNKNOWN; výstup přenesen .NET writerem. Závěrečné testy/browser QA čekají; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-15-2026-10-19.md).


**Šestnáctá dílčí W05/W10 · důvěryhodnost dalších osmi hesel Snáře · 19. 10.:** upraveny svítání, blesk, vlak, rozbité zrcadlo, samotářský vlk, bezpečný přístav, jeskyně a motýl. Odstraněny jisté přísliby, diagnózy, vztahové závěry a rady podle snu; tradice zůstávají označené jako symbolika. Všech 40 polí souhlasí se zdrojem, všech 164 detailů i rozcestník odpovídají izolovanému renderu. Kvůli známému problému přímého zápisu byly výstupy přeneseny přes .NET; izolované soubory uklizeny. Závěrečné testy/browser QA čekají; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-16-2026-10-19.md).


**Sedmnáctá dílčí W05/W10 · důvěryhodnost dalších osmi hesel Snáře · 19. 10.:** upraveny pták, vesmír, hvězdný prach, kotva, labyrint, medúza, brána a meč. Odstraněny vztahové závěry, diagnózy, přísliby a naléhavé rady odvozené ze snu. Všech 40 polí souhlasí se zdrojem; izolovaný render všech 164 stránek i rozcestníku nemá rozdíly. Kvůli známé chybě přímého zápisu byly výstupy přeneseny přes .NET writer. Závěrečné testy/browser QA čekají; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-17-2026-10-19.md).


**Osmnáctá a závěrečná auditovaná W05/W10 · Snář · 19. 10.:** upraveny poslední tři nalezené položky: hvězdárna, pyramida a jelen; nepodložené předpovědi, nadpřirozené zprávy a závěry o intuici nahradily osobní či kulturní asociace. Úplný read-only audit snáře je dokončen, runy byly zkontrolovány a zásah nepotřebovaly. Všech 15 polí souhlasí se zdrojem; všech 164 stránek i rozcestník odpovídají izolovanému renderu. Závěrečné testy/browser QA čekají na společný běh; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/dream-symbols-trust-batch-18-2026-10-19.md).

**W10 · read-only kontrola Tarotu ANO/NE · 19. 10.:** zdroj, aktivní bundle, FAQ/JSON-LD, náhodný výběr i všech 78 kategorií a praktických kroků jsou ve shodě. Výsledek je popsaný jako symbolický a otázka jej nemění; vztahová nabídka je omezená na vztahový záměr a potvrzenou cenu 149 Kč. Významný problém nebyl nalezen, doslovné ANO/NE je dostatečně vymezené sousedním textem. Bez editací/testů; funkční a browser QA čeká na společný závěr. [Checkpoint](release-prep-2026-10-15/tarot-yes-no-copy-trust-review-2026-10-19.md).

**Navazující W10 · čínský zvěrokruh · 19. 10.:** sdílený výsledek i obrázek zachovávají upozornění, že samotný rok dává orientační znamení a u ledna/února je nutné ověřit datum čínského nového roku. Zobrazené souladné dvojice jsou sjednoceny s přesně čtyřmi trojicemi ve FAQ. Osobní rok i oba roky partnerů mají dynamický limit do aktuálního roku. Začátek čínského roku Koně je správně uveden jako 17. 2. 2026 ([Smithsonian](https://www.si.edu/spotlight/lunar-year-horse)). Build a cílená statická kontrola prošly; aplikační/browser QA čeká na společný závěr. [Checkpoint](release-prep-2026-10-15/chinese-zodiac-sharing-and-year-cutoff-2026-10-19.md). Kandidát lokální, produkce beze změny.

**Dílčí oprava W02 · záložní povrch členství na ceníku · 20. 10.:** jediná primární členská karta měla ve starší stránkové vrstvě fialový gradient, který v normálním načtení přebíjí pozdější navy Atlas komponenta. Fallback byl srovnán na navy a tlumené zlato; obsah, cena a checkout se neměnily. CSS token obnoven, browser QA čeká na společný závěr. [Checkpoint](release-prep-2026-10-15/cenik-membership-atlas-fallback-2026-10-20.md). Lokální kandidát, produkce beze změny.

**Dílčí oprava W06 · budoucí datum při registraci · 20. 10.:** samostatný registrační formulář i dynamický auth modal nyní omezují nepovinné datum narození na pražský dnešní den; při opětovném zaměření se limit aktualizuje. Serverová validace zůstává autoritativní. Cíleně sestaveny společné auth bundle, všech 914 HTML/generátorových referencí má aktuální verzi a read-only kontrola nenašla zastaralý odkaz. [Checkpoint](release-prep-2026-10-15/auth-birthdate-maximum-2026-10-20.md). Pouze lokální kandidát, produkce beze změny.
**W10 · numerologie — data a symbolické sdílení · 20. 10.:** budoucí datum narození odmítá klient i API; výpočet osobních cyklů, validace a viditelné datum používají jednotně pražské pásmo. Cache v3 obsahuje jen hash čtyř výsledných čísel a neobsahuje jméno ani datum; sdílený obrázek i text označují výklad jako symbolický. Build a cílená statická kontrola prošly, nezávislý read-only audit po změnách nenašel regresi. Funkční/browser QA čeká na závěrečný společný běh. Kandidát lokální, produkce beze změny. [Checkpoint](release-prep-2026-10-15/numerology-symbolic-trust-and-date-2026-10-20.md).

**W10/W06 · kalkulačka aury · 20. 10.:** budoucí datum narození blokuje pražský limit i samostatná validační větev; při chybě se starý výsledek skryje. Odstraněn jasmín z výčtu krystalů a fialové FAQ sjednoceno mezi viditelným textem a JSON-LD v opatrném symbolickém znění. Build, statická kontrola devíti výsledků a nezávislý read-only audit prošly. Testy/browser QA čekají na společný závěr; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/aura-date-and-output-consistency-2026-10-20.md).

**W10/W06 · zdrojový audit biorytmů · 20. 10.:** perioda, vzorec, kalendářní výpočet, texty a aktivní bundle jsou ve shodě. Výsledek i „kritický den“ zůstávají výslovně matematickým modelem bez tvrzení o kondici, náladě či předpovědi. Nativní `max` blokuje budoucí datum v běžném formuláři; opakovaný JS guard je pouze nízkoprioritní hardening pro programově vyvolaný submit. Bez změny kódu, testy a browser QA čekají na závěrečný společný běh. [Checkpoint](release-prep-2026-10-15/biorhythm-source-review-2026-10-20.md). Kandidát lokální, produkce beze změny.

**W02 · mobilní tarot hero padding · 20. 10.:** odstraněna jedna duplicitní deklarace `padding-top:96px` z dřívějšího bloku `@media(max-width:760px)`. Pozdější pravidlo ve stejném rozsahu už zahrnuje všechny původní selektory; jedinečné `min-height` vizuálu Keltického kříže zůstalo. CSS token dostal revizi `20261020-01-mobile-hero-padding-dedup`; verzovací skript nyní porovnává i číselnou revizi stejného dne. Skript aktualizoval 918 HTML/generátorů a read-only kontrola má potvrdit nulu zastaralých odkazů. Testy a browser QA zůstávají na závěrečný průchod. Lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/css-atlas-mobile-hero-padding-dedup-2026-10-20.md).

**Navazující W02 · mobilní hero významů tarotu · 20. 10.:** odstraněn samostatný `padding-top:96px` blok pro `.tarot-meaning-hero` a `.tarot-card-detail-hero`. Pozdější pravidlo ve stejném rozsahu obsahuje oba cíle a má stejnou či vyšší specificitu. CSS token se posunul na `20261020-02-mobile-hero-padding-dedup`; skript obnovil 918 HTML/generátorů a opakovaná read-only kontrola hlásí nulu zastaralých odkazů. Service Worker cache `mysticka-hvezda-8be8e5b240c5`, asset historie 2 045 verzí. Testy a browser QA čekají na společný závěr; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/css-atlas-mobile-meaning-hero-padding-dedup-2026-10-20.md).

Read-only scan `css/atlas-web.css` po těchto opravách nenašel další plně redundantní blok. Částečně překrývající se pravidla hlavičky zůstala, protože mají rozdílný media scope nebo další aktivní deklarace. W02 dál zůstává otevřené pro společný legacy bundle a jiné rodiny stylů.

### W06 · budoucí datum v astrologických výpočtech · 20. října 2026

Natální mapa, tranzity, partnerská shoda i astrokartografie nyní odmítají budoucí datum podle pražského dne. Hranice je také v date inputs české Natální karty, Partnerské shody, Astrokartografie a SK/PL natálních formulářů. Regresní případy jsou přidány, ale nebyly spuštěny; W06 a závěrečná QA zůstávají otevřené. [Checkpoint](release-prep-2026-10-15/natal-birth-date-cutoff-2026-10-20.md). Lokální kandidát, produkce beze změny.

**Navazující W06 · stejný limit data narození v profilu · 20. října 2026:** profil nyní nastavuje horní mez podle stejného pražského data jako astrologické formuláře. Sdílená serverová validace pro registraci i změnu profilu také porovnává kalendářní den v `Europe/Prague`, takže půlnoc UTC nemůže chybně odmítnout dnešní české datum. Regresní případ nyní skutečně posílá platný budoucí den a pokrývá i přijetí dneška; testy nebyly spuštěny. Cíleně sestaven profilový dashboard, browserová i závěrečná funkční QA čekají na společný běh. [Checkpoint](release-prep-2026-10-15/birth-date-profile-timezone-2026-10-20.md). Lokální kandidát, produkce beze změny.

**W06 doplnění profilu · 21. října 2026:** potvrzené maximum je dnešní pražské datum; neplatí věková hranice ani pevné datum `2010-12-31`. Pole místa narození nyní omezuje vstup na stejných 100 znaků, které backend dříve tiše zkracoval. Nápověda data narození je propojena přes `aria-describedby`; validátor formulářů toto propojení zachovává při přidání chybové zprávy. Statická kontrola a společná browser QA čekají na závěrečný průchod. [Checkpoint](release-prep-2026-10-15/profile-birth-fields-accessibility-2026-10-21.md). Lokální kandidát, produkce beze změny.

**W06 · pražská hranice narozeninových formulářů a API · 20. října 2026:** Osobní mapa, Minulý život a Šamanské kolo pracují s kalendářním dnem v Praze; výkladové endpointy odmítají budoucí data i při přímém požadavku mimo formulář. Po Pavlově odpovědi „ok“ bylo nedoložené pevné UI maximum `2010-12-31` odstraněno a příslušná pole dostávají dynamické dnešní datum přes sdílený helper. Nová kontrola zjistila, že pole Šamanského kola výslovně uvádí minimum `1900-01-01`, zatímco API je dosud přijímalo; endpoint nyní zachovává stejnou hranici. Regresní případy jsou připravené, ale testy a browserové ověření čekají na společný závěrečný běh. Žádná další věková hranice nebyla zavedena. [Checkpoint data](release-prep-2026-10-15/birthdate-tool-endpoint-boundaries-2026-10-20.md), [oprava API Šamanského kola](release-prep-2026-10-15/medicine-wheel-birthdate-minimum-2026-10-20.md). Lokální kandidát, produkce beze změny.

**W02 · starý neúčinný fialový selektor na Tarotu na lásku · 20. října 2026:** Odstraněno pouze pravidlo `.page-tarot-love .stars`; žádný takový uzel není v aktuálním HTML a načítaný inicializátor hvězd bez kontejneru nic nevykreslí. CSS odkaz má nový token. Tato úprava neprokazuje celkové vykreslení stránky; browser QA zůstává na společný závěr. [Evidence](release-prep-2026-10-15/css-tarot-love-unused-stars-2026-10-20.md). Kandidát lokální, produkce beze změny.

### W03/V03 · zkrácení opakovaného kontaktu v patičce · 20. října 2026

Sdílená patička nyní ukazuje e-mail podpory jednou v provozním sdělení místo tří opakování. Odkaz na stránku Kontakt, čtyři tematické skupiny, právní odkazy a přepnutí jazyka zůstávají. Sestaveny aktivní JS distribuce, obnoveny cache verze a Service Worker. Původní měření výšky je zastaralé; V03 se uzavře až po závěrečném mobilním měření a kontrole cookie panelu. [Checkpoint](release-prep-2026-10-15/footer-contact-compact-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W04 · sjednocení dekorativních značek v e-mailech · 20. října 2026

Prémiové uvítací a navazující e-maily už nepoužívají směs emoji u jednotlivých položek nebo v předmětu. Značky loga nejsou druhým H1 a společná patička má čitelnější text 14 px. Významový symbol tarotové karty zůstává. Syntaxe zdroje prošla; skutečné vykreslení e-mailových klientů a závěrečné QA čekají. [Checkpoint](release-prep-2026-10-15/lifecycle-email-visual-polish-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W05 · Křišťálová koule — jedna relevantní návaznost · 20. října 2026

Samostatnou kartu se čtyřmi obecnými odkazy pod FAQ nahradil jediný krátký odkaz na Tarot ANO / NE. Stránka už tento nástroj nabízí mezi volbami podle záměru; nabídka, limity, FAQ, vstupní volby ani navigace se neměnily. Cílová URL existuje a parametry `source`/`feature` zůstaly. [Evidence](release-prep-2026-10-15/crystal-ball-follow-up-links-2026-10-20.md). Mobilní a klávesnicové přijetí čeká na společnou závěrečnou QA; lokální kandidát, produkce beze změny.

### V11/W02 · odstranění nepoužívaného bundle z offline precache · 20. října 2026

Aktuální HTML nikde nenačítá `js/dist/daily-card.js`; zdrojový scan nenašel runtime import a soubor byl jedině v Service Worker `STATIC_ASSETS`. Odebrána jen tato položka, bundle ani jeho zdrojové soubory se nemažou. Cache manifest přepočítán skriptem na `mysticka-hvezda-f79a431c5ff9`; závěrečné testy a browser QA zůstávají odložené. [Evidence](release-prep-2026-10-15/daily-card-precache-cleanup-2026-10-20.md). Kandidát lokální, produkce beze změny.

### W06 · pražský den v kalkulačce biorytmů · 20. října 2026

Pole data narození, číselný výsledek a graf nyní používají stejný kalendářní den v `Europe/Prague`; limit pole se obnoví i při návratu fokusu na dlouho otevřené stránce. Výpočetní cykly a jejich vzorec se nezměnily. Aktivní bundle je sestaven a stránka načítá token `20261020-prague-calendar-day`; asset snapshot uchovává 2 073 verzí. Hraniční ověření při rozdílném místním a pražském datu i browser QA zůstávají na společný závěrečný běh. [Checkpoint](release-prep-2026-10-15/biorhythm-prague-day-boundary-2026-10-20.md). Kandidát lokální, produkce beze změny.

### W06 · klientská kontrola budoucího data u Minulého života · 20. října 2026

Formulář má `novalidate`, proto jeho nativní `min`/`max` samy o sobě neblokovaly chybné datum při odeslání. Hranice `1900-01-01` je nyní výslovně kontrolována klientem i API; maximum se obnovuje při zaměření pole a před odesláním a budoucí den klient odmítne s konkrétní přístupnou chybou před náhledem nebo API. Serverová validace v pražském pásmu zůstává autoritativní. Cílený esbuild vytvořil `js/dist/minuly-zivot.js` (20 672 B) a bundle byl bajt po bajtu porovnán s nezávislým výstupem esbuild; stránka používá token `20261020-prague-birth-validation`. Statická kontrola a snapshot (2 077 veřejných asset verzí) prošly. Aplikační testy a browser QA zůstávají na společný závěr. [Checkpoint](release-prep-2026-10-15/past-life-client-birthdate-boundary-2026-10-20.md). Kandidát lokální, produkce beze změny.

### W06 · obnova horního data v dlouho otevřených formulářích · 20. října 2026

Astrokartografie, Numerologie a Natální karta obnovují pražské maximum data nejen při načtení, ale i při interakci před nativní validací a při návratu do otevřené karty. Tím dnešní datum nezůstane zablokované po půlnoci; existující klientské/serverové odmítnutí budoucího dne zůstává zachované. Cílené bundly jsou nezávisle bajtově shodné (20 420 / 23 424 / 28 154 B), zdroj i distribuce prošly `node --check`, cache tokeny jsou obnovené, snapshot drží 2 083 veřejných verzí. Testy ani browser QA neběžely a zůstávají na závěrečný průchod. [Checkpoint](release-prep-2026-10-15/birthdate-max-refresh-2026-10-20.md). Kandidát lokální, produkce beze změny.

**W06 follow-up · Aura · 20. 10.:** také místní kalkulačka Aury obnovuje pražské maximum při zaměření data, návratu do karty a před výpočtem tlačítkem/Enterem. Změněný bundle se nezávisle shoduje s esbuild výstupem (8 390 B), `node --check` a diff check prošly. Service Worker nemá tento bundle v `STATIC_ASSETS`, proto se jeho cache hash neměnil; asset snapshot drží 2 085 verzí. Přijetí scénáře po půlnoci čeká na společný testovací běh. [Checkpoint](release-prep-2026-10-15/aura-birthdate-max-refresh-2026-10-20.md). Produkce beze změny.

**W06 follow-up · polská a slovenská Natální karta · 20. 10.:** obě lokalizované stránky zachovávají validaci data v pražském pásmu i serverové odmítnutí budoucího dne; sdílené klientské maximum se nyní obnovuje při práci s kalendářem, před odesláním a po návratu do karty. Zdroj a cílený ESM bundle jsou syntakticky v pořádku a shodují se bajt po bajtu (6 301 B); obě URL mají nový token. Service Worker zůstal aktuální, snapshot drží 2 087 verzí. Read-only audit `gpt-6-luna` (low) nepotvrdil další nesoulad API pravidel; jeho výstup root ověřil proti současným trasám. Přijetí browseru i finální funkční testy čekají na závěrečný průchod. [Checkpoint](release-prep-2026-10-15/locale-natal-birthdate-max-refresh-2026-10-20.md). Produkce beze změny.

### W06 · obnova horního data Šamanského kola · 20. října 2026

- Datumové maximum se nyní obnovuje při formulářové interakci, návratu do okna/karty a při zpracování odeslání. Dolní hranice `1900-01-01` i serverové kontroly zůstávají zachované.
- Zdroj a distribuce prošly `node --check`; cílený ESM build se nezávisle shoduje bajt po bajtu (17 058 B). `shamansko-kolo.html` používá nový cache token, Service Worker zůstal na `mysticka-hvezda-f79a431c5ff9`, snapshot má 2 089 verzí.
- Funkční/browser QA odložena na společný závěrečný běh. [Checkpoint](release-prep-2026-10-15/shaman-wheel-birthdate-max-refresh-2026-10-20.md). Pouze lokální kandidát, produkce beze změny.

### W06 · obnova pražského maxima dalších datumových formulářů · 20. října 2026

- Osobní mapa, obě data Partnerské shody, Nastavení profilu a kalkulačka biorytmů obnovují `max` při interakci před nativní validací a po návratu do karty; logika se nemění.
- Zdrojové a distribuční skripty prošly `node --check`; nezávislý esbuild odpovídá sedmi výstupům včetně chunků dashboardu. Nové tokeny jsou v HTML; Service Worker `mysticka-hvezda-0fbe842aa66f`, snapshot 2 097 verzí.
- Funkční/browser QA včetně cílové cesty checkoutu Osobní mapy zůstává na závěrečný běh. [Checkpoint](release-prep-2026-10-15/birthdate-max-refresh-followup-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W09 · read-only kontrola záměru nabídky po Tarotu ANO/NE · 20. října 2026

Statická kontrola nezávisle potvrdila, že vztahová nabídka za 149 Kč je v HTML skrytá a zobrazí se jen po explicitním vztahovém `intent` z allowlistu; obecné `intent=yes_no` je vyloučené v aktivním zdroji i distribuci. Helper `gpt-6-luna` (low, read-only) nejprve upozornil na možný únik pro obecný vstup, ale root kontrola tento problém pro obecnou trasu vyvrátila. Vstupní záměr se neporovnává se sémantikou uživatelem dopsané otázky; tato hranice je popsána v checkpointu. Bez změny kódu. Statická kontrola prošla; funkční/browser QA zůstává na společný závěrečný průchod. [Checkpoint](release-prep-2026-10-15/tarot-yes-no-offer-intent-audit-2026-10-20.md). Lokální kandidát, produkce beze změny.
### W04 · sjednocení ikony v horoskopovém sdílecím panelu · 20. října 2026

Hlavní tlačítko českého, slovenského i polského horoskopového sdílení nyní používá společný SVG sprite `share` místo vlastní kreslené ikony. Text, lokalizované potvrzení, stav panelu i funkční handlery zůstaly zachované. Nezávislý esbuild odpovídá distribuci bajt po bajtu; zdroj a dist prošly `node --check`, statická kontrola všech tří odkazů prošla. Service Worker `mysticka-hvezda-9b97f0441db2`; asset snapshot 2 100 verzí. Funkční/browser QA odložena do společného závěru. [Checkpoint](release-prep-2026-10-15/horoscope-share-sprite-2026-10-20.md). Kandidát lokální, produkce beze změny.

### W03 · cache token sdíleného modulu Tarot karty dne · 20. října 2026

Homepage a stránka Tarot karty dne načítají stejný JS bundle; homepage měla starší revizní query. `index.html` nyní používá stejný `20261019-share-feedback` jako aktuální samostatná stránka. Ověřeno statickým HTML scanem; bundle ani Service Worker nebyly změněny. [Checkpoint](release-prep-2026-10-15/homepage-tarot-daily-cache-token-2026-10-20.md). Browserová kontrola cache čeká na společnou QA; lokální kandidát, produkce beze změny.

### W03 · oprava kontroly kritické cache verze · 20. října 2026

Strukturální audit nyní kontroluje pět sdílených JS verzí (`core`, `components`, `auth-client`, `templates`, `horoscope`). Opravena byla i stará verze horoskopového modulu v zápisovém refresh skriptu, který by ji jinak vrátil zpět. Předchozí auth klíč obsahoval query, takže audit nic nevymáhal. Statický scan potvrdil 1 036 správně verzovaných HTML odkazů. [Evidence](release-prep-2026-10-15/site-audit-auth-asset-version-2026-10-20.md). Spuštění auditních skriptů a závěrečné testy čekají na společný QA běh; produkce beze změny.

### W03 · odstranění osiřelého homepage copy skriptu · 20. října 2026

`js/index-copy-fixes.js` a jeho distribuce nebyly nikde načítané ani součástí Service Worker precache; odstraněny jsou pouze tyto dva soubory. Historický hash v asset historii zůstal zachovaný. Aktivní reference po změně zůstávají nulové. [Evidence](release-prep-2026-10-15/index-copy-fixes-orphan-cleanup-2026-10-20.md). Aplikační/browser QA čeká na společný závěrečný běh; lokální kandidát, produkce beze změny.

### V11 · oprava zastaralé evidence denní karty · 20. října 2026

Ikonový inventář stále tvrdil, že neaktivní `js/dist/daily-card.js` zůstává v Service Worker precache. Aktuální `service-worker.js` ani HTML/JS runtime reference jej už neobsahují; dohledatelný zůstává zdrojový modul a `server/tests/daily-card-assets.test.js`, který ověřuje jeho mapu obrázků a textové guardy. Inventář nyní rozlišuje historický zdroj od aktivního UI a dokumentuje důvod, proč se zdroj zatím nemaže. [Kontrolní důkaz](release-prep-2026-10-15/daily-card-precache-cleanup-2026-10-20.md). Bez změny veřejného kódu; testy i browser QA zůstávají na společný závěrečný běh, produkce beze změny.

### W03 · read-only ověření hashe Service Workeru · 20. října 2026

Aktuální offline manifest v lokálním kandidátovi obsahuje 97 unikátních assetů po odvození chunků profilového dashboardu. Nezávislý výpočet přes jejich skutečný obsah souhlasí s `CACHE_NAME` `mysticka-hvezda-4433a09ea5fe`; offline bundle denní karty v seznamu není. Service Worker se neměnil a toto ověření nedokládá instalaci v prohlížeči ani produkční stav. [Rozsah a metoda](release-prep-2026-10-15/service-worker-cache-consistency-2026-10-20.md). Funkční testy a browser QA zůstávají na společný závěrečný běh.

### W10 · srozumitelná pravidla nového hesla v profilu · 20. října 2026

V nastavení profilu je u nového hesla trvale vidět rozsah 8–128 znaků a informace, že běžně používaná hesla nejsou povolena. Pole nápovědu zpřístupňuje přes `aria-describedby`; stávající styly profilu zůstávají použité. Rozsah a bloklist odpovídají serverové validaci v `server/utils/validation.js`. Statická kontrola zdroje a `git diff --check` prošly; funkční a browserové ověření zůstává na společný závěrečný běh. [Checkpoint](release-prep-2026-10-15/profile-password-policy-hint-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W10/W13 · pravidla hesla v registraci · 20. října 2026

Auth modal v češtině, slovenštině a polštině nyní před registrací sděluje rozsah 8–128 znaků a upozorňuje na blokovaná běžná hesla. Pomocný text je spojený s heslem přes `aria-describedby`. `maxlength` a potvrzovací `minlength` se zapínají jen při registraci; při přepnutí do přihlášení se odstraní a pole se vrátí na `autocomplete="current-password"`, aby omezení neblokovala starší přihlašovací údaje. Server zůstává autoritou pro běžná hesla; překlad jeho chyb pro běžné a příliš dlouhé heslo je doplněný pro SK/PL. JS build uspěl; nové auth/template/core bundle revize jsou sjednocené v HTML a kontrola verzí hlásí 0 zastaralých referencí. Service Worker cache `mysticka-hvezda-6dac6718a418`; asset archiv má 2 108 verzí. [Checkpoint a rozsah](release-prep-2026-10-15/auth-modal-password-policy-2026-10-20.md). Společné funkční/browser QA čeká na závěrečný běh; lokální kandidát, produkce beze změny.

### W06 · historická data Hvězdného průvodce jako nedůvěryhodný vstup · 20. října 2026

Profil, starší konverzace a volitelné souhrny výkladů se předávají v odděleném JSON bloku uživatelské zprávy, mimo systémová pravidla. Prompt rozlišuje aktuální požadavek od historických údajů a zakazuje, aby pokyny vložené v historii, profilu nebo uloženém výkladu měnily roli průvodce. Výběr historie a podmínky souhlasu se neměnily. Syntaxe serverových souborů, statická kontrola serializace a `git diff --check` prošly; AI výstupy a funkční/browser QA čekají na společný závěrečný běh. [Checkpoint](release-prep-2026-10-15/mentor-history-prompt-boundaries-2026-10-20.md). Lokální kandidát, produkce beze změny.

### V11 · read-only průchod aktivních sdílecích rendererů · 20. října 2026

Pomocník `gpt-6-luna` (low, read-only) prošel sdílené canvas pozadí číselného výsledku a horoskopový export. Root ověřil, že `numerologie.html` skutečně načítá `js/dist/share-image-canvas.js` a aktivní distribuci numerologie, a horoskopy načítají `js/dist/horoscope-share.js`. Oba výstupy používají navy, malovanou krajinu a tlumené zlato; záměrný glyf znamení zůstává obsahovým symbolem. Nebyl nalezen doložitelný aktivní nesoulad, takže se nic neměnilo. Ostatní specializované exporty i skutečný vykreslený PNG zůstávají mimo tento úzký průchod a patří do závěrečné QA. [Evidence](release-prep-2026-10-15/share-export-renderers-readonly-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W04/W11 · barevná paleta slovenského exportu Tarot ÁNO/NIE · 20. října 2026

Slovenský stažený obrázek nyní sdílí tlumenou zlatou `#d0b17c`, krémovou a šedomodrou paletu českého exportu. Odstraněno pouze výrazné žluté, růžové a mátové zvýraznění uvnitř canvasu; text výsledku i barevné stavy ovládání stránky zůstaly zachované. Cíleně sestaven `js/dist/tarot-ano-nie-sk.js`, HTML odkaz dostal revizi `20261020-atlas-share-palette` a archiv zachycuje 2 110 verzí. Cílená syntaxe, renderer scan a diff check prošly. Service Worker hash se nezměnil, protože tato stránková distribuce není v jeho statickém precache. PNG ani prohlížeč se neotevíraly; vizuální přijetí je součástí závěrečné QA. [Checkpoint](release-prep-2026-10-15/sk-tarot-yesno-export-palette-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W04 · sjednocení ikony uvítacího e-mailu newsletteru · 20. října 2026

Uvítací e-mail novinek už u odkazu „Tarot karta dne“ nepoužívá samostatnou systémovou emoji. Název nástroje a jeho popis zůstaly; šablona teď odpovídá textovému stylu týdenního digestu. Statická kontrola cílové šablony a `git diff --check` prošly. E-mailoví klienti a skutečné doručení se netestovali; zůstávají v závěrečné QA. [Checkpoint](release-prep-2026-10-15/newsletter-welcome-card-icon-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W04/W10 · výchozí obsah ručního newsletteru · 20. října 2026

Samostatný `server/scripts/send-newsletter.js` už jako ukázku nepoužívá zastaralé tvrzení o Měsíci v Rybách, nepřirozenou větu „nabitá 10×“ ani systémové emoji. Nabízí krátké cvičení oddělující fakta od domněnek a vede na existující Tarot ANO / NE. Zpráva má vzhled kandidátního Atlasu, textové odkazy, prezentační tabulky a zachovanou možnost odhlášení. Počítadlo týdne bylo odstraněno; ukázkový obsah tím nepředstírá čerstvý astrologický přehled. `--send` zůstává jedinou cestou k rozeslání; skript nebyl spuštěn. Statická kontrola a kontrola syntaxe jsou součástí cílené kontroly změny; e-mailový klient a finální QA zůstávají odložené. [Checkpoint](release-prep-2026-10-15/manual-newsletter-example-copy-2026-10-20.md). Lokální kandidát, produkce beze změny.
### W04/W11 · sjednocení palety dalších sdílecích grafik · 20. října 2026

Exporty run a Minulého života používají tlumené zlato a krémovou paletu Atlasu; podtitulek Minulého života má šedomodrý odstín. Zdrojové renderery a distribuce prošly syntax kontrolou a nezávislé porovnání potvrdilo shodné barvy. Runy jsou pokryté aktuální Service Worker cache `mysticka-hvezda-9b65366f3a3d`; asset historie obsahuje 2 118 verzí. PNG a browserové přijetí čekají na společnou závěrečnou QA. [Checkpoint](release-prep-2026-10-15/share-export-atlas-palette-2026-10-20.md). Lokální kandidát, produkce beze změny.
### W04/W11 · Atlas paleta exportu Andělské karty · 20. října 2026

Aktivní exportní renderer Andělské karty používal starší zlaté akcenty; tři barvy nyní odpovídají tlumenému Atlas zlatu. Zdroj i cílená distribuce prošly syntax kontrolou a statickým porovnáním. HTML revize je `20261020-atlas-share-palette`, Service Worker cache `mysticka-hvezda-551e3928ee20`, asset historie 2 120 verzí. Vizuální přijetí PNG čeká na společné závěrečné QA. [Checkpoint](release-prep-2026-10-15/angel-card-share-atlas-palette-2026-10-20.md). Lokální kandidát, produkce beze změny.
### W04/W11 · Atlas paleta exportu partnerské shody · 20. října 2026

Sdílecí grafika partnerské shody používá Atlas zlato, krémový text a šedomodrý popisek. Zelená/zlatá/červená barva procenta zůstala jako významový stav. Zdroj i bundle prošly syntax/statickou kontrolou; HTML načítá novou revizi. Bundle není v Service Worker precache, jeho hash zůstává aktuální `mysticka-hvezda-551e3928ee20`; asset historie má 2 122 verzí. PNG a browserové přijetí čekají na závěrečné společné QA. [Checkpoint](release-prep-2026-10-15/synastry-share-atlas-palette-2026-10-20.md). Lokální kandidát, produkce beze změny.
### W04/W11 · Atlas paleta fallbacku exportu Tarotu karty dne · 20. října 2026

Záložní exportní větev teď používá Atlas krémovou, šedomodrou a tlumenou zlatou; původní pozadí a výsledek zůstaly. Zdroj a dist prošly syntax/statickou kontrolou, stránka má novou revizi. Bundle je v Service Workeru, jeho aktuální hash je `mysticka-hvezda-2b9f22ca2efd`; snapshot má 2 124 verzí. PNG a uživatelské přijetí čekají na společnou QA. [Checkpoint](release-prep-2026-10-15/tarot-daily-share-fallback-palette-2026-10-20.md). Lokální kandidát, produkce beze změny.
### W04/W11 · vedlejší barvy exportů Andělských karet, čínského horoskopu a numerologie · 20. října 2026

Vedlejší popisky Andělské karty a čínského horoskopu nyní používají Atlas šedomodrou. Numerologie má sjednocené zlato/krémovou/šedomodrou v rámečcích, hlavním čísle i poznámkách; odlišená modrá a zelená kategorie zůstaly. Zdroje a bundly prošly syntax/statickou kontrolou; tři HTML revize jsou aktualizované. Service Worker cache `mysticka-hvezda-29b1903911f6`, archiv 2 130 verzí. PNG čekají na finální vizuální QA. [Checkpoint](release-prep-2026-10-15/share-export-muted-text-palette-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W05 · zjednodušení rozcestníků horoskopového hubu · 20. října 2026

Z české, slovenské a polské stránky byly odstraněny obecné seznamy dalších nástrojů pod FAQ. Česká stránka už má tematické odkazy na znamení a vztahové dvojice, týdenní/měsíční horoskop, Osobní mapu, natální kartu, lunární kalendář a Tarot ANO/NE; ostatní cíle jsou i ve společné navigaci/patičce. Na slovenské stránce zůstal jeden krátký odkaz na unikátní lokalizovaný Tarot ÁNO/NIE; ostatní karty byly duplicity. Odstraněny jsou také nepoužívané české CSS selektory a stránkový CSS token byl obnoven. Statické kontroly zachovaných FAQ, lokálních cílů a diff check prošly; browserová a funkční QA čeká na společný závěr. [Checkpoint](release-prep-2026-10-15/horoscope-hub-generic-link-cleanup-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W05 · stavová deduplikace návaznosti kalkulačky životního čísla · 20. října 2026

Numerologie z dolní intent karty je skrytá jen ve chvíli, kdy uživatel vidí výsledek se stejným odkazem na plnou numerologii. Před výpočtem je karta dostupná; po změně vstupu nebo vymazání výsledku se vrátí. Partnerská shoda a Osobní mapa zůstaly. Aktivní JS bundle byl cíleně sestaven ze zdroje a HTML token obnoven; zdrojová i distribuční logika jsou v souladu. Statická syntaxe a diff check proběhly; test interakce a vizuální přijetí čekají na společnou závěrečnou QA. [Checkpoint](release-prep-2026-10-15/life-number-intent-duplicate-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W06 · ochrana ručně upravených údajů při načítání profilu · 20. října 2026

Natální karta a Astro mapa nyní kontrolují, zda se vstupy nezměnily, než doplní pozdě načtené údaje profilu. Ruční změna zůstane zachovaná a formulář zobrazí krátké vysvětlení; pozdní odpověď už nepřepíše aktuální zadání. Oba aktivní JS bundly byly cíleně sestavené, zdroje i distribuce prošly `node --check`, nové HTML tokeny a 2 140 assetů byly staticky ověřeny. Bundly nejsou v Service Worker precache. Prohlížečové ověření souběhu zůstává na společnou závěrečnou QA. [Checkpoint](release-prep-2026-10-15/profile-autofill-input-race-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W06 · skrytí zastaralé natální mapy po změně vstupu · 20. října 2026

Po změně jména, data, času nebo místa narození se odstraní mapa, tranzity, výklad, vykreslené vrstvy i vazba na uložené čtení; asistenční oblast oznámí, že je třeba spustit výpočet znovu. Zdroj i načítaný `js/dist/natal-chart.js` mají obsluhu `input`, HTML odkazuje na novou cache verzi. Zdrojová funkce obsluhuje také `change`. Statická kontrola zdrojů, bundle a HTML; interakční/browser QA odložená na závěrečný společný běh. [Checkpoint](release-prep-2026-10-15/natal-result-invalidated-on-input-change-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W06 · stav členství po přepnutí profilu · 20. října 2026

Při změně účtu se dosavadní karta členství ihned vyčistí a nahradí stavem načítání. Stejný přístupný stav se zobrazí při každém načtení; `aria-busy` se odstraní po úspěchu nebo chybě. Ochrana opožděné odpovědi podle vlastníka a verze požadavku zůstává zachovaná. Rozpracované ukládání nastavení se oddělí, při změně účtu se vymažou heslová pole a zavře se výběr avataru. Nový účet může hned uložit vlastní údaje; pozdní odpověď už nepřepíše jeho formulář, nezobrazí chybu ani nespustí cizí automatické odhlášení. Datum narození v nastavení profilu už má maximum dnešní datum, proto nebylo třeba měnit limit. Build proběhl; Service Worker hash `mysticka-hvezda-507a03214441`, archiv má 2 152 verzí. Syntaxe a statické návaznosti prošly; interakční/browser QA je odložená na společný závěr. [Checkpoint](release-prep-2026-10-15/subscription-card-owner-change-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W02 · odstranění přepsaného mobilního pravidla na homepage · 20. října 2026

Z `css/pages/home-atlas.css` byla odstraněna neúčinná mobilní deklarace pro panel Tarotu karty dne; kaskáda ji později přepisovala. Závěrečné mobilní pravidlo s jedním sloupcem zůstalo. `css/home.min.css` je přegenerované. CSS build narazil na `UNKNOWN` při otevření `css/site.min.css`; cílový soubor byl sestaven přes dočasný výstup. Browserové ověření čeká na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/home-tarot-dead-mobile-rule-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W06 · odstraňování zastaralých výsledků Numerologie a Křišťálové koule · 20. října 2026

Numerologie nyní při změně jména nebo data skryje předchozí číselné výsledky a přeruší zastaralý výklad; cykly zůstanou jen při nezměněném datu. Ruční změna data zneplatní rozpracované načtení profilu a vypne volbu údajů z profilu. Křišťálová koule skryje minulou odpověď i akce uloženého výkladu při úpravě otázky a uzamyká pole během probíhající odpovědi. Oba zdroje a distribuce prošly `node --check`; Service Worker je `mysticka-hvezda-a82f3036c2bd`, snapshot drží 2 163 verzí. Testy ani browserová kontrola neběžely a čekají na společný QA běh. [Checkpoint](release-prep-2026-10-15/stale-results-numerology-crystal-ball-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W06 · spárování otázky a výsledku v Tarotu ANO/NE · 20. října 2026

Po vytažení karty se otázka uzamkne pro čtení, takže zůstane vidět přesné zadání odpovědi. Stávající reset ji smaže a odemkne pro nový tah. Zdroj a distribuce prošly syntaxí, aktivní HTML odkaz používá novou revizi. Modul není v Service Worker precache; asset snapshot obsahuje 2 165 verzí včetně nového bundlu. Browserová QA zůstává odložená. [Checkpoint](release-prep-2026-10-15/tarot-yes-no-question-result-consistency-2026-10-20.md). Lokální kandidát, produkce beze změny.

### W06 · Minulý život a Osobní mapa: aktuální údaje v náhledu a checkoutu · 20. října 2026

Úprava jména, data, místa nebo formy oslovení na Minulém životě nyní odstraní předchozí náhled a jeho uložený kontext; nové odeslání vytvoří náhled z aktuálních údajů. Osobní mapa zachytí validní `FormData` před uzamčením formuláře, pak během přípravy Stripe checkoutu znepřístupní všechna pole. Při chybě obnoví jejich předchozí stav; při úspěchu přesměrování zůstává payload neměnný. Oba zdroje a distribuce prošly `node --check`, HTML tokeny byly obnoveny a `git diff --check` nenašel whitespace chyby. Service Worker cache je `mysticka-hvezda-dca792b11364`, asset snapshot drží 2 173 veřejných verzí. Testy ani browserová/platební QA neběžely podle dohody a čekají na společný závěr. [Checkpoint](release-prep-2026-10-15/past-life-preview-and-personal-map-checkout-form-lock-2026-10-20.md). Lokální kandidát, produkce beze změny; široký W06 zůstává otevřený.

### W06 · obnova načtení balíčku Andělských karet · 20. října 2026

Chyba načtení karet se zobrazuje inline místo zavíratelného alertu a má akci „Zkusit znovu“. Losovací karta je do ověření dat nepřístupná; úspěšný retry obnoví ovládání a vrátí fokus na kartu. Platný výběr je kontrolován jako neprázdné pole karet s potřebnými poli; všech 44 současných statických položek tomuto formátu odpovídá. Zdroj a aktivní distribuce prošly `node --check`, HTML používá nové CSS/JS tokeny. Service Worker cache `mysticka-hvezda-a20a58044115`, asset snapshot 2 176 verzí. Retry a vykreslení v prohlížeči čekají na společnou závěrečnou QA; produkce beze změny. [Checkpoint](release-prep-2026-10-15/angel-card-data-load-retry-2026-10-20.md). Široký W06 zůstává otevřený.

### W06/W09 · bezpečné opakování checkoutu Osobního vztahového výkladu · 21. října 2026

Statický audit našel, že opakovaný požadavek na 149 Kč vytvářel pokaždé novou objednávku a tím i nové Stripe idempotency key; po ztrátě odpovědi proto šlo založit druhé zaplatitelné okno. Objednávka nyní používá stabilní ID podle produktového flow a hash normalizovaného e-mailu, otázky a souhlasu. Závod souběžných vložení načte stejnou soukromou objednávku, včetně původně uložených karet a důkazu návratu. Před vložením vyhledá také staré objednávky pod náhodným ID: dosud otevřený formulář z předchozí verze tak bezpečně zablokuje místo založení druhé platby. Otevřené uložené Stripe okno se znovu načte a ověří proti objednávce, ceně, měně a proof; zaplacená, rozpracovaná, expirovaná nebo neověřitelná okna novou platbu neotevřou. Při souběžném připojení Stripe session se stejné okno neexpiruje, pokud druhý požadavek prokáže, že je už uložené. Změněné údaje pod stejným flow ID skončí bezpečnou odpovědí 409. Klient po editaci otázky skryje předchozí kartu, při checkoutu posílá jeden zachycený payload a během čekání zamkne vstupy; při chybě je obnoví, při expirovaném okně připraví nový flow.

Změněný JS bundle je `js/dist/vztahovy-vyklad.js`, stránka používá `20261021-relationship-checkout-idempotency`; tento bundle není v Service Worker precache. Asset snapshot nyní drží 2 178 veřejných verzí. Zdroj, dist, route, order helper a dotčené testové soubory prošly `node --check`; `git diff --check` prošel. Přidány unit a E2E regresní scénáře, ale nebyly spuštěny podle domluvy na společné závěrečné QA. Konflikt s už použitým flow zůstává bezpečně zablokovaný a posílá zákazníka na podporu; žádný nový checkout se v tomto stavu nevytvoří. Pouze lokální release kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/relationship-tarot-checkout-idempotency-2026-10-21.md). W06 i W09 zůstávají otevřené.

Read-only průchod placeným doručením 21. 10. potvrdil uložený výsledek, stabilní klíč odeslání a pozdější reconciliaci stavů doručení e-mailu. Žádná další změna ani živé volání neproběhlo; podrobnosti a omezení jsou v témže [checkpointu](release-prep-2026-10-15/relationship-tarot-checkout-idempotency-2026-10-21.md).

### W06/W09 · stabilní flow checkoutu Osobní mapy · 21. října 2026

API už při chybějícím flow ID negeneruje pokaždé nové ID pro novou objednávku; stará klientská verze je bezpečně odmítnutá před vložením a musí se obnovit. Sdílený order helper zachytí také starší náhodně identifikovaný řádek, pokud v něm předchozí verze flow ID uložila. Při konfliktu se klientská akce zamkne a odkáže na ověření původního pokusu přes Kontakt. Bundle má token `20261021-personal-map-flow-safety`, Service Worker cache `mysticka-hvezda-cddb9d97d4aa`, asset snapshot **2 180**. Syntaxe, cílený ESLint a `git diff --check` prošly; nové regressions jsou připravené, nespouštěné dle dohody o společné závěrečné QA. Původní route neukládala flow ID; starší objednávky potřebují migrační kontrolu popsanou v dodatku níže. Produkce beze změny. [Checkpoint](release-prep-2026-10-15/personal-map-flow-safety-2026-10-21.md). W06 i W09 zůstávají otevřené.

**Dodatečná migrační ochrana 21. 10.:** kontrola nyní pokrývá i objednávky z původní route bez jakéhokoli flow ID. Nedávné pokusy stejného produktu a e-mailu se nejprve ověří proti Stripe: původní okno lze vrátit jen s totožnými vstupy a jeho platným návratovým cookie; řádek bez Stripe session, změněné údaje, chybějící důkaz či nečitelný stav vedou k 409 bez druhé platby. Expirovaný Stripe checkout se bezpečně označí jako expirovaný. Přidaný regresní případ kontroluje výběr neuzavřeného legacy řádku i částku v haléřích. Testy a Stripe volání čekají na společnou závěrečnou QA; samotný kandidát zůstává lokální a produkce beze změny. Podrobnosti a přesné hranice jsou v [checkpointu](release-prep-2026-10-15/personal-map-flow-safety-2026-10-21.md).

**Nezávislá druhá revize legacy dotazu 21. 10.:** pomocný `gpt-6-luna` (low, read-only) našel, že limit 21 řádků původně počítal i moderní objednávky. Filtr chybějícího `payload.flowId` se přesunul do dotazu před limit; přidán scénář s 21 moderními objednávkami. Statická kontrola také zachytila chybný násobek ceny; `amount_total` se nyní porovnává přímo s 29 900 haléři. Syntaxe devíti souborů, cílený ESLint a diff check prošly, testy neběžely. Checkout QA a produkce zůstávají nedotčeny. [Podrobnosti a evidence](release-prep-2026-10-15/personal-map-flow-safety-2026-10-21.md).

### W06 · read-only kontrola dobrovolného kontextu deníku · 21. října 2026

Statický průchod `server/routes/horoscope.js`, `js/horoscope.js`, `server/mentor.js`, `js/mentor.js`, `server/services/mentor-context.js`, `server/services/claude.js` a CZ/SK/PL horoskopových šablon potvrdil shodu základních hranic: nezaškrtnutá volba nic neposílá; změna uživatele zneplatní opožděný horoskop a resetuje souhlas; server horoskopu vyžaduje přihlášení, přesný příznak souhlasu, podporované období/jazyk a přístup, jinak kontext vynechá; Průvodce načítá nejvýše tři souhrny jen při zapnuté volbě. Osobní kontext v cache je oddělený neprůhledným hashem včetně ID uživatele a klíč se neloguje. Prompt označuje kontext i předchozí historii jako nedůvěryhodná data a odmítá jejich instrukce. Novou funkční změnu jsem nenašel; API, změna účtu, cache hit/miss a injekční vstupy zůstávají na dohodnuté závěrečné QA. Produkce beze změny.

### W06 · okamžité zobrazení hotového výkladu Partnerské shody · 21. října 2026

Po návratu úspěšné odpovědi uživatel dříve čekal na zbytečné vypisování textu znak po znaku. Nyní se výklad zobrazí hned, stav se označí jako připravený a případné následné uložení do historie má vlastní pravdivý popisek. Bundle `js/dist/synastry.js` byl cíleně sestaven a HTML používá token `20261021-instant-result`; bundle ani stránka nejsou v Service Worker precache. Statická syntaxe a `git diff --check` prošly. Pomocný `gpt-6-luna` (low, read-only) našel prodlevu a neměnil soubory. Testy ani browserová QA neběžely podle dohody o společném závěru. Lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/synastry-instant-result-2026-10-21.md).

### W06/W07 · skutečná animace a zkrácení denního tahu runy · 21. října 2026

Denní tah čekal 1,5 sekundy, ale kámen se během „míchání“ nehýbal, ačkoli odpovídající CSS animace existovala. JavaScript ji nyní skutečně zapíná na 700 ms; v režimu omezeného pohybu nebo bez kamene se výsledek ukáže bez prodlevy. CSS v tomtéž režimu vypíná také dýchání skrytého kamene a jeho přechody. Zdroj a aktivní bundle byly sestaveny, `runy.html` používá nové JS/CSS tokeny; Service Worker cache je `mysticka-hvezda-a8997c042708` a snapshot obsahuje **2 187** verzí. Statická syntaxe, cílené guardy a `git diff --check` prošly. Testy a browserové ověření čekají na společný závěr. Lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/rune-draw-shuffle-feedback-2026-10-21.md).

### W06 · statická kontrola chyb a opakování na Minulém životě · 21. října 2026

Viditelný formulář, načítaný bundle a API používají shodné meze data narození (1. 1. 1900 až dnešek v Praze). Při neúspěchu zůstávají vstupy zachované, během požadavku se submit zamyká a po dokončení se zámek obnoví. Delší generování má oznámení po 60 sekundách; serverová AI používá vlastní časový limit a retry cyklus, proto nebyl přidán konkurenční klientský timeout. `node --check` i statické kontroly zdroje/bundlu prošly. Interakční a browserová QA čekají na společný závěrečný běh; W06 zůstává otevřené. Lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/past-life-form-states-static-review-2026-10-21.md).

### W06 · statická kontrola chatu Hvězdného průvodce · 21. října 2026

Nezávislá čtecí kontrola pomocného agenta a následné ověření citovaných úseků potvrdily, že submit se zamkne před prvním čekáním, neúspěch zachová otázku, úspěch nemaže nově rozepsaný text a změna účtu ruší čekající chat/historii i souhlas s kontextem. HTML načítá bundle se shodnou logikou. Nenašel jsem konkrétní zdrojovou chybu; chování historie a relace v prohlížeči a API zůstává na společnou závěrečnou QA. W06 zůstává otevřené; kandidát lokální, produkce beze změny. [Checkpoint](release-prep-2026-10-15/mentor-chat-states-static-review-2026-10-21.md).

### W06 · ověření návratu ze starého checkoutu Ročního horoskopu · 21. října 2026

Historická URL s `status=success` dříve sama zobrazila potvrzení a odeslala nákupní analytiku bez kontroly Stripe. Přidán serverový endpoint pro ověření starého produktu, částky 199 Kč a dokončeného PaymentIntent; zachován fallback ID produktu používaný starým webhookem. Klient potvrdí platbu a zaznamená nákup až po úspěšném ověření, jinak nabídne opakování kontroly nebo Kontakt. Nové nákupy zůstávají vypnuté a webhook se neměnil. Přidány serverové a E2E regresní případy, zatím nespouštěné podle dohody o společném závěrečném testování. Bundle byl cíleně sestaven; Service Worker cache `mysticka-hvezda-dbdd61a1e668`, snapshot má **2 189** verzí. Zbývá závěrečné testování a ověření proti Stripe. Kandidát lokální, produkce beze změny. [Checkpoint](release-prep-2026-10-15/annual-horoscope-payment-return-2026-10-21.md).

### W06/W07 · návaznost fokusu a průběh sedmi kvízů · 21. října 2026

Všech sedm kvízů teď po volbě přesune fokus na nadpis další otázky a plynule k ní přejede; výsledek dál dostává fokus samostatně. Progress bar má český přístupný název i aktuální hodnotu a počítá dokončené otázky; při výsledku ukáže 100 %. Zdroje i cílené bundly prošly syntax kontrolou, markup/source/dist i cache tokeny byly staticky porovnány. Přidána E2E regrese pro všech sedm kvízů, zatím nespouštěná podle dohody o společném závěrečném testování. Asset snapshot obsahuje **2 217** verzí; bundly nejsou v Service Worker precache. Čtečky, klávesnice a vykreslení čekají na závěrečnou browser QA. Lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/quiz-progress-focus-accessibility-2026-10-21.md).


### W07 follow-up · viditelnost fokusu a odsazení další otázky v kvízech · 21. října 2026

Po přidání programového fokusu do sedmi kvízů bylo doplněno odsazení nadpisu proti pevné hlavičce a zlatý :focus-visible indikátor. Všechny aktivní kvízy načítají novou CSS revizi; CleanCSS parser a statické srovnání sedmi odkazů prošly. Asset snapshot: 2 218 verzí; CSS není v Service Worker precache. Vizuální/klávesnicové QA čeká na závěrečný společný běh, testy neběžely a produkce je beze změny. [Checkpoint](release-prep-2026-10-15/quiz-progress-focus-accessibility-2026-10-21.md).

### W06 · pravdivý stav push odběru v profilu · 21. října 2026

Stav tlačítka denního horoskopu se při otevření profilu nyní odvozuje ze skutečné browserové PushSubscription; zastaralý `localStorage` se srovná a použije se jen jako nouzový fallback při chybě čtení. Tlačítko zůstává skryté a vypnuté během načítání. Všech šest stránek načítajících sdílený skript používá token `20261021-subscription-state`; bundle byl cíleně sestaven a snapshot zachovává **2 220** verzí. Statická syntaxe a diff check prošly. Připraveny tři E2E regrese, nespouštěné podle dohody o společném závěrečném QA. Push asset není v SW pre-cache. Produkce beze změny. [Checkpoint](release-prep-2026-10-15/push-subscription-ui-state-2026-10-21.md). W06 zůstává otevřené.

### W06 follow-up · návrat ze staré platby Ročního horoskopu · 21. října 2026

Nové návštěvy staré URL už server přesměruje na Osobní mapu; pouze historický Stripe návrat zůstává přístupný pro ověření. Pro tuto návratovou obrazovku se nyní skryje vyřazená cena, ukázka a objednávkový formulář, aby zákazník viděl výsledek původní platby bez nabídky nefunkčního produktu. Přidána E2E regrese, testy čekají na společnou závěrečnou QA. Cílený bundle, Service Worker cache `mysticka-hvezda-55aec90c0b7f` a asset snapshot **2 222** verzí jsou aktualizované. Statické syntaxe a diff check prošly. Lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/annual-horoscope-payment-return-2026-10-21.md).

### W10 · hlas a důvěryhodnost stránky O nás · 21. října 2026

Na `o-nas.html` se sjednotilo vykání na tykání. Věta o výkladu teď jasně říká, že symbolický podnět nepřebírá rozhodnutí za návštěvníka. Závěrečný blok už neslibuje nedoložený „tým podpory“; odkaz na stávající stránku Kontakt zůstal zachovaný. Dvě nepřipsané věty v uvozovkách byly změněny na věcný popis; tvrzení o výpočtu se výslovně vztahuje k natální kartě. Odstraněna i poslední formální výzva v meta description a popisek „Jak držíme kvalitu“, který naznačoval lidský dohled. Zdrojový scan této stránky už nenachází formální oslovení, původní claim ani pseudo-citace. Závěrečné vizuální přijetí zůstává v QA; kandidát lokální, produkce beze změny. [Checkpoint](release-prep-2026-10-15/about-page-trust-voice-2026-10-21.md).

### W11 follow-up · lokalizovaná zpětná vazba a pravdivější PL/SK texty · 21. října 2026

Zpětná vazba k uloženému horoskopu se zobrazuje i na polské a slovenské stránce; kopie už neslibuje, že změní budoucí výklady. PL prázdný stav a úvod natální karty teď odpovídají symbolickému výkladu a základním polohám planet, SK natalní formulář sjednocuje tykání. Zdroj a bundle mají shodné texty, tři stránky horoskopu načítají `20261021-localized-feedback`; asset snapshot má 2 224 verzí. Statický diff check prošel. Funkční a browserová QA čeká na závěrečný průchod; W11 zůstává otevřená. Kandidát lokální, produkce beze změny. [Checkpoint](release-prep-2026-10-15/localized-horoscope-feedback-and-natal-copy-2026-10-21.md).

### W06 · chybové stavy Křišťálové koule nevydávají technickou chybu za vyčerpanou kvótu · 21. října 2026

Členský checkout se nyní otevře jen při odpovědi `402 / LIMIT_REACHED`. CSRF 403 a nedostupná kontrola kvóty 503 zobrazují lokalizovanou možnost opakovat pokus; otázka zůstává ve formuláři. Anonymní `REGISTRATION_REQUIRED` dál směřuje na registraci zdarma. Zdroj a aktivní bundle prošly syntaxí, HTML verze a Service Worker cache jsou aktualizované a ověřené; asset historie má 2 231 verzí. Testy a browserová QA zůstávají na společný závěrečný běh. W06 otevřené, lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/crystal-ball-quota-vs-request-errors-2026-10-21.md).

### W10 · tykání v české nabídce po registraci · 21. října 2026

Uvítání, dynamický stav načítání/výsledku i nabídka členství na českém horoskopu nově tykají. Podmínky zůstávají 7 dní za 0 Kč s platební kartou, potom 199 Kč měsíčně, pokud členství uživatel před koncem zkoušky nezruší. Týdenní a měsíční paywall mají opravenou češtinu a navazují na jednu nabídku členství. Změněný ESM bundle je reprodukovatelný, uložený v asset historii (2 235 verzí) a token mají všechny tři lokalizované stránky horoskopu. Syntaxe a `git diff --check` prošly; testy a browserová kontrola čekají na společný závěrečný běh. W10 zůstává otevřené. Kandidát lokální, produkce beze změny. [Checkpoint](release-prep-2026-10-15/horoscope-activation-copy-voice-2026-10-21.md).

### W10 · čínský horoskop a vztahová shoda · 21. října 2026

Úvod vztahové shody, označení roku a alt text čínského horoskopu nyní tykají. Tři dynamické výsledky zůstávají symbolickým podnětem; text jasně nepřisuzuje znamením hodnocení skutečného vztahu. Výpočet ani skupiny kompatibility se neměnily. JS bundle byl cíleně sestaven a nezávisle reprodukován, token má jediná používající stránka; asset historie zahrnuje 2 237 verzí. Syntaxe, kontrola hashe a scan starých forem vykání prošly; testy a browser QA jsou odložené. W10 zůstává otevřené, lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/chinese-horoscope-synastry-voice-2026-10-21.md).

**W02 navazující kontrola · 21. 10.:** Ověřil jsem výjimku `tarot-karta-dne.html` přímo v aktuálním kandidátovi: po `style.v2.min.css` se načítá stránkový override a `tarot-atlas.css`; stránka má vlastní `body.page-tarot-daily`. Oba lokální styly nastavují navy povrch a vypínají staré kořenové pozadí i hvězdy/částice. Interní `tests/premium-test.html` zůstává jedinou další neatlasovou výjimkou v evidenci. Zdrojový stav neukazuje veřejný únik staré fialové plochy; starý bundle zůstává, protože stále dodává sdílené komponenty. Vykreslení musí potvrdit společná závěrečná browser QA. [Aktuální kontrola](release-prep-2026-10-15/css-legacy-base-followup-2026-10-21.md), [počty a meze původního scanu](release-prep-2026-10-15/css-legacy-base-coverage-2026-10-20.md). Lokální kandidát, produkce beze změny.

**W01 · CTA měsíčního horoskopu k Osobní mapě · 21. 10.:** Sekundární CTA nyní říká „Prohlédnout Osobní mapu“ místo „Chci vlastní mapu na 12 měsíců“, aby nejdřív vedlo k přehledu skutečné nabídky. Cíl `osobni-mapa.html`, query parametry i analytické atributy zůstaly beze změny; cílová stránka uvádí jednorázovou cenu a rozsah před checkoutem. Zdrojově ověřeno, browser QA odložena na společný závěrečný průchod. [Checkpoint](release-prep-2026-10-15/monthly-horoscope-personal-map-cta-2026-10-21.md). Lokální kandidát, produkce beze změny.

**Dílčí W01 · nabídka vztahového výkladu z Tarotu · 21. 10.:** odkaz u výsledku jedné karty nyní přesněji říká „Pokračovat k výkladu tří karet · 149 Kč“ místo neurčitého „Rozvinout výklad“. Odkaz vede na informační/objednávkovou stránku; cena, jednorázovost, tři karty a e-mailové doručení jsou tam uvedené před objednávkou. URL a `source=tarot_single_card_result` zůstaly beze změny. Zdrojově ověřeno, bez browser QA a testů. [Checkpoint](release-prep-2026-10-15/tarot-single-card-reading-cta-2026-10-21.md). Lokální kandidát, produkce beze změny.

**Dílčí W01 · CTA vedoucí na jediné členství · 21. 10.:** Afirmace, Křišťálová koule, Runy a Hvězdný průvodce teď místo „Vyzkoušet členství“/„Získat Premium“ používají „Prohlédnout členství“, protože první klik vede na ceník, ne rovnou k zahájení zkoušky. `cenik.html` před rozhodnutím uvádí jediné členství, 7 dní za 0 Kč a následně 199 Kč/měsíc. Cílové URL, plán, source/feature parametry i existující ikona a HTML struktura zůstaly. Zdrojová kontrola nenašla aktivní runtime přepis těchto čtyř štítků. Blogové články mají další generické odkazy na ceník; jejich zdroj a rozsah budou ověřeny zvlášť před hromadnou změnou. [Checkpoint](release-prep-2026-10-15/membership-cta-labels-2026-10-21.md). W01 zůstává otevřené; lokální kandidát, produkce beze změny.

**W01 · blogové CTA na jediné členství · 21. 10.:** 21 aktivních statických článků mělo odkaz na `cenik.html?plan=pruvodce` označený „Zobrazit plány“. V každém souboru byl právě jeden takový odkaz; popisek je nyní „Prohlédnout členství“ a cílová cesta, query parametry, třída i umístění zůstaly. Stejné úzké pravidlo je v `server/scripts/generate-blog.js`, takže případné budoucí generování z `content_html` normalizuje jen přesný text „Zobrazit plány“ uvnitř odkazu na ceník. Zdroj `public.blog_posts` je stále nedostupný, proto se generátor nespouštěl a žádný obsah databáze se neměnil. Statický scan HTML už nenašel tento starý štítek; 12 přesných „Zobrazit ceník“ odkazů zůstává pravdivých a beze změny. Bez testů/browser QA; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/blog-membership-cta-2026-10-21.md).

### W01 · podmínky členství na Šamanském kole · 21. října 2026

Placené pokračování nyní používá stejné znění zkušební nabídky jako ceník: 7 dní za 0 Kč a poté 199 Kč/měsíc, pokud členství uživatel nezruší. Staré veřejné pojmenování plánu „Hvězdný Průvodce“ z CTA zmizelo; interní ID `pruvodce`, přihlášení/checkout, URL i atribuce zůstaly. CSS token je obnoven, protože stránka načítá tento stylesheet přímo; soubor není v seznamu offline precache Service Workeru. Statické ověření provedeno, automatické testy a browser QA čekají na společný závěrečný průchod. [Checkpoint](release-prep-2026-10-15/shamanic-wheel-membership-terms-2026-10-21.md). Lokální kandidát, produkce beze změny.


### W01 · CTA k členství na navazujících stránkách · 21. října 2026

Zastaralé pojmenování členství a CTA na třech stránkách jsou sjednocené s aktuální nabídkou. `minuly-zivot.html` jasně popisuje obsah a tlačítko „Pokračovat k členství“ odpovídá handleru, který vede přes registraci na ceník; pod CTA jsou uvedené podmínky: 7 dní za 0 Kč a poté 199 Kč/měsíc, pokud členství předem nezruší. `o-nas.html` a potvrzovací stav `rocni-horoskop.html` odkazují přímo na ceník a používají „Prohlédnout členství“. Po zakoupení Ročního horoskopu doprovodný text už nepojmenovává členství starým plánem. URL a atribuce zůstaly beze změny; zdrojové kontroly nenalezly runtime přepis těchto textů. Bez testů a browser QA podle dohody; lokální kandidát, produkce beze změny. [Checkpoint](release-prep-2026-10-15/membership-cta-consistency-followup-2026-10-21.md).


### W01 · sjednocení dalších cest k členství · 21. října 2026

Homepage vedle ceny členství uvádí i 7 dní za 0 Kč, navazujících 199 Kč/měsíc a zrušení. CTA vedoucí na ceník na osobní mapě, dvou numerologických stránkách a třech tarotových stránkách nyní mluví o členství místo starých názvů či příslibu okamžitého odemčení. Nabídka po prvním horoskopu už nemluví o „Průvodci“; tam ponechané „Vyzkoušet 7 dní za 0 Kč“ odpovídá handleru, který opravdu startuje checkout, a podmínky jsou přímo vedle něj. URL, source/feature i analytické intent parametry zůstaly. Zdrojové texty a relevantní handler byly přečteny; bez testů/browser QA podle dohody. [Checkpoint](release-prep-2026-10-15/membership-copy-followup-2026-10-21.md). Lokální kandidát, produkce beze změny.


### W01/W07 · veřejný název jediného členství · 21. října 2026

Domovská stránka, FAQ a Tarot 3 karty už nepoužívají „Premium“/starý plán jako veřejný název členství. Homepage jasně ukazuje bezplatnou zkoušku a navazující cenu; její otázka o zrušení a odpověď jsou srovnané s FAQ JSON-LD. Stránka FAQ popisuje jedno členství konzistentně ve viditelném textu a strukturovaných datech. Tarot 3 karty používá stejnou nabídku v SEO/social metadatech, obsahu i JSON-LD; denní náhled a bezplatné alternativy jsou popsané shodně. URL a interní plán se neměnily. Read-only zdrojová kontrola hotová, schema parser/testy/browser QA čekají na společný závěrečný běh. [Checkpoint](release-prep-2026-10-15/membership-public-copy-home-faq-tarot-2026-10-21.md). Lokální kandidát, produkce beze změny.


**W10 · fallback stavu aktivního členství v profilu · 21. 10.:** výchozí titulek, popis i štítek aktivační karty v `profil.html` teď odpovídají textům, které po potvrzeném návratu nastavuje dashboard. Jde o statický fallback; plánové ID, stav předplatného ani řízení přístupu se neměnily. [Společný checkpoint](release-prep-2026-10-15/membership-public-copy-home-faq-tarot-2026-10-21.md). Lokální kandidát, produkce beze změny.


### W05 · čitelná šířka dlouhých textů v profilu · 21. října 2026

Detail uloženého výkladu v profilu nyní omezuje souvislý text na 72ch a otázku na 68ch; dlouhé řetězce se bezpečně zalomí místo vytékání z karty. Nic se nezkracuje ani nemění v uloženém obsahu. `profil.html` načítá CSS novým tokenem a Service Worker precache byl přepočítán; archiv má 2 251 verzí. Zdrojová kontrola potvrzuje selektory a asset reference; prohlížeč a testy čekají na závěrečnou společnou QA. [Checkpoint](release-prep-2026-10-15/profile-reading-text-width-2026-10-21.md). Lokální kandidát, produkce beze změny.
**Dílčí pojistka W05 · dlouhé tarotové otázky · 21. 10.:** dvě výsledkové varianty, které zobrazují vlastní otázku uživatele, nyní omezují šířku textu na 68ch a zalamují i řetězce bez mezer. Otázka se nezkracuje ani nemění. `tarot.html` načítá stylesheet novým tokenem; archiv veřejných CSS/JS verzí byl aktualizován. Toto řeší jen přetečení otázky; další úpravy hierarchie výsledku zůstávají otevřené. Browser QA a testy čekají na společný závěrečný běh.

**Dílčí pojistka W05 · přehlednější výsledek natální karty · 21. 10.:** doplňující seznam planet a aspektů je pod nativním rozbalením; klíčové prvky i stručné údaje o elementu a tempu zůstávají viditelné. Osobní výklad omezuje řádek na 70ch a zalamuje dlouhé řetězce. Výpočet ani obsah výsledku se neměnily. Stránka používá nový CSS token; styl není v Service Worker precache; asset archiv obsahuje 2 254 verzí. Testy a browser QA čekají na závěrečný průchod. [Checkpoint](release-prep-2026-10-15/natal-reading-width-2026-10-21.md). Lokální kandidát; produkce beze změny.

**Read-only kontrola W05 · Numerologie · 21. 10.:** delší přehled významů už je zavřený v nativním rozbalení. Zbývající tři odkazy vedou na různé další cesty a FAQ pokrývá různé otázky včetně metodiky a ceny; další schování by zhoršilo přístup k odpovědím nebo navigaci. Bez změny zdroje. [Předchozí zjednodušení](release-prep-2026-10-15/numerology-page-simplification-2026-10-18.md); celková funkční a vizuální QA zůstává otevřená.

**Dílčí W05/W06 · úspěšný výsledek Aura · 21. 10.:** krátký název výsledku se oznamuje přes `role="status"`, zatímco podrobný obsah zůstává mimo live region. Změna data, reset i chyba stav vyčistí; výpočet a stávající chybová hláška zůstaly. Zdroj/bundle a HTML token jsou sladěné; testy a browser/screen-reader přijetí čekají na závěrečnou QA. [Checkpoint](release-prep-2026-10-15/aura-result-status-announcement-2026-10-21.md). Lokální kandidát, produkce beze změny.

**Dílčí W05/W06 · výsledek Biorytmů · 21. 10.:** po výpočtu je nyní čtečce oznámeno, že číselný přehled je připraven; dlouhé karty zůstávají mimo live region a graf má vlastní oznámení načítání/chyby. Změna data oznámení vymaže. Zdroj/bundle a HTML cache token jsou sladěné; automatické testy a screen-reader/browser QA čekají na společný závěrečný běh. [Checkpoint](release-prep-2026-10-15/biorhythm-result-status-announcement-2026-10-21.md). Lokální kandidát, produkce beze změny.

**Dílčí W05/W06/W07 · Čínský horoskop · 21. 10.:** výběr znamení i partnerské srovnání mají stručné přístupné oznámení mimo dlouhý výklad. Fokus přejde na výsledek s viditelným zlatým indikátorem; všech 12 zvířat synchronizuje `aria-pressed` a nový rok výběr i oznámení vymaže. Zdroj/bundle a HTML JS/CSS tokeny jsou sladěné; automatické a screen-reader/browser QA čekají na společný závěr. [Checkpoint](release-prep-2026-10-15/chinese-horoscope-result-status-2026-10-21.md). Lokální kandidát, produkce beze změny.

**Read-only W06 kontrola · Tarot ANO/NE · 21. 10.:** pomocný `gpt-6-luna` (low) ověřil přístupnou chybu prázdné otázky, živý úspěšný výsledek, přesun fokusu na nadpis a vyčištění při resetu. Konkrétní vadu ve stavech ani mazání zastaralého výsledku nenašel; kód se neměnil. Závěrečné chování v prohlížeči a testy zůstávají otevřené. [Statický audit a odkazy na důkazy](release-prep-2026-10-15/tarot-yesno-result-status-review-2026-10-21.md).

**Dílčí W07 · Astrokartografie · 21. 10.:** po úspěšném výpočtu se klávesnicový fokus přesune na nadpis mapy; nadpis má zlatý viditelný indikátor. Stávající živý status a rolování s respektováním omezeného pohybu zůstaly. Zdroj/bundle, CSS parser a nové HTML cache tokeny byly staticky ověřeny; browser/klávesnicová QA čeká na závěr. [Checkpoint](release-prep-2026-10-15/astro-map-result-focus-2026-10-21.md). Lokální kandidát, produkce beze změny.

**Dílčí W07 · kalkulačka čísla životní cesty · 21. 10.:** fokus se po výpočtu přesune na pojmenovaný nadpis výsledku se zlatým indikátorem; krátká živá oblast oznámí číslo a název a při změně data se vyčistí. Zdroj/bundle a CSS parser, statické reference i token `20261021-result-focus` byly ověřeny. Assety nejsou v SW precache; veřejný archiv obsahuje 2 269 verzí. Testy a browser/klávesnicová QA čekají na společný závěr. [Checkpoint](release-prep-2026-10-15/life-number-result-focus-2026-10-21.md). Lokální kandidát, produkce beze změny.

**Kontrola vydání · 21. 10.:** aktuální úplné serverové testy mají 877 úspěchů / 14 selhání a frontendové 58 / 53; část selhání jsou zastaralé mocky a textové kontrakty, ale potvrzené zbytky inline stylů a zdrojového JS ve Slovníku vyžadují zdrojovou opravu. Lint a další statické kontroly prošly. Opravena syntaktická chyba auditního manifestu a jeho přepisování aktualizátorem; site audit poté prošel. Zůstává nesoulad jednoho blogového generátoru, metadat sitemap, trust checkeru a závěrečné browserové přijetí. Počet otevřených checkboxů sám není seznamem blokérů vydání. [Aktuální konkrétní blokery a důkazy](release-prep-2026-10-15/release-readiness-2026-10-21.md). Kandidát lokální, nasazení zatím nepřijaté.
