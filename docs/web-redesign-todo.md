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
| R03 | Unit + syntetický profil v browseru; částečně přijaté · P1/P2 | Profil: PF01–PF07, otázka a rozlišení výkladu PF11 | Detail, jeho akce, historie, deník, oblíbené a odvozené bloky pracují se stejným aktuálním stavem. |
| R04 | Metody/unit + modelové výsledky ověřené; živá AI čeká · P1/P2 | Sjednotit numerologickou metodu, lunární referenční okamžiky a pravdivé prompty; označování fallbacků | Stejný vstup má vysvětlenou a konzistentní metodu. Generický náhradní obsah se nevydává za čerstvou osobní interpretaci. |

**Výchozí R01 je zdrojově opravený:** falešná mapa, klientské skóre a náhradní tranzitové tvrzení jsou odstraněné. Český i slovenský natál prošel skutečným lokálním výpočtem a chybou/retry, shoda členskou a hostovskou variantou. Podrobný rozsah a neověřené stavy jsou v [QA checkpointu](release-prep-2026-10-15/qa-results.md).

## 1. Společný vzhled a orientace

### W01 · P2 · Jasná hlavní cesta a kratší navigace

- [ ] Navrhnout stručný rozcestník podle potřeby: položit otázku, vytáhnout kartu dne, najít horoskop nebo se vrátit k vlastnímu výkladu. Knihovnu ostatních nástrojů zpřístupnit přehledně.
- [ ] Sjednotit hlavní a vedlejší akce na každé rodině stránek; popisek má říkat, co se skutečně otevře. Cenu a podmínky nabídky ponechat dostupné před rozhodnutím.
- [ ] Porovnat navigaci homepage s načítaným headerem, včetně hosta, přihlášeného účtu, mobilního menu a klávesnice.

**Podklad:** `index.html:178` má vlastní header, `components/header.html` další variantu. Menu obsahuje několik tematických skupin; jejich existence sama není chyba. `js/components.js` a `js/ui/header.js` mají odlišné větve ovládání dropdownů. Není doloženo, že by všechny desktopové dropdowny byly pouze hoverové — komponentová větev má click handler i pro desktop. Ověřit skutečnou aktivní větev, nikoliv závěr z jednoho souboru.

**Přijetí:** návštěvník najde nástroj i cestu zpět; Enter/Space/Escape a `aria-expanded` odpovídají stavu. Stejný nástroj se v různých místech nejmenuje jinak. Hlavní URL a interní odkazy zůstávají procházetelné.

### W02 · P2 · Sjednotit existující styly a základní prvky

- [ ] Zapsat jednu krátkou specifikaci barev povrchů, typografie, mezer, rámečků, tlačítek, formulářů, odkazů, štítků a ikon podle schválených současných stránek.
- [ ] Určit, který základní CSS bundle patří ke které rodině; společná pravidla a stránkové výjimky mají jasné místo. Postupně odstranit zbytečně překrývající se definice po ověření použití.
- [ ] Pro kontrolu použít malý místní přehled existujících komponent se všemi stavy: klid, hover, focus, disabled, loading, chyba, úspěch. Z toho vycházet při dalších úpravách.

**Podklad:** souběžné `style.v2.css`, `atlas-web.css`, `atlas-remaining.css`, lokální styly a generované bundly. Zdrojové velikosti 193 524 B / 21 065 B / 9 633 B nejsou měření skutečného přenosu ani důkaz pomalého webu. Duplicitní deklarace samy neprokazují viditelnou závadu.

**Přijetí:** žádná další barva nebo varianta tlačítka bez konkrétní funkce; změna sdíleného prvku se propíše předvídatelně. Barvy výsledků s významem, například aura nebo nálada, nezaměňovat s dekorací UI.

### W03 · P2 · Pět vzorů stránek

| Rodina | Požadovaný vzor |
|---|---|
| Úvodní a produktová stránka | Výrazná tematická ilustrace, jasné vysvětlení a jedna hlavní akce; nabídka a ukázka mají svoje místo. |
| Nástroj | Krátký úvod, formulář nebo výběr ihned dostupný, výsledek blízko akce. Dlouhé reference dostupné na vyžádání. |
| Výsledek / význam karty | Největší pozornost vlastní odpovědi a otázce; čitelný text, karta/symbol a konkrétní krok. Sekundární akce pod výsledkem. |
| Katalog / blog / slovník | Rozpoznatelné náhledy, hledání či relevantní filtry, čitelný počet a dávkování. Mobil nesmí být nekonečná úvodní mřížka. |
| Účet / objednávka / potvrzení | Klidné pracovní rozhraní, stručný stav a jasný další krok. Kontaktní a platební informace bez dekorativních překážek. |

- [ ] Zařadit každý funkční vstup z existujícího inventáře do rodiny a evidovat výjimky.
- [ ] Po úpravě vzoru použít existující generátory pro obsahové rodiny; ověřit idempotenci a zachování specifického obsahu, ID a URL.
- [ ] Zkontrolovat mrtvé nebo skryté staré bloky před jejich odstraněním. `index.html` obsahuje např. skrytý `cenik-legacy`; není to důkaz viditelného dvojího ceníku. Mazat až po kontrole hooků a fallbacků.

## 2. Grafika, čitelnost a pocit z používání

### W04 · P2 · Využití malovaných ilustrací a dokončení ikon

- [ ] Udělat přiřazení stránka/sekce → konkrétní ilustrace a její role. Repo obsahuje **42 WebP souborů v `img/atlas`**; tento počet neříká, kolik jich je skutečně použito nebo nepoužito.
- [ ] Dokončit V11: SVG pro ovládání, loading, chyby, potvrzení a výsledkové štítky, včetně JS šablon a exportů. Zvlášť vyřešit čínská zvířata, aby se barevný emoji nevracel doprostřed malované grafiky.
- [ ] Použít decentní tematické pozadí tam, kde pomáhá kompozici; v dlouhém výkladu dát přednost klidné ploše. Zkontrolovat výřezy na mobilu, jednotnou výtvarnou teplotu a ostrý text.
- [ ] Až po přiřazení určit skutečně chybějící motivy. Generovat cílenou sadu podle potřeby, nikoliv další zásobu obrázků bez umístění.

**Přijetí:** ikonky mají společnou kresbu, optickou velikost a význam; obsahové runy/znamení mají vhodný popisek. Obrázek nepřekrývá text ani neodsouvá hlavní akci o několik obrazovek. Dekorace a skutečný obsah mají odpovídající alternativní popis.

### W05 · P2 · Čitelnější výklady a kratší doplňující obsah

- [ ] Sjednotit šířku textového sloupce, odstavce, nadpisy a klíčová shrnutí. Na mobilu prověřit delší výklad i dlouhou vlastní otázku.
- [ ] Výsledku dát jasnou strukturu: otázka → symbol/karty → výklad → praktický krok → volitelné uložení/poznámka. U různých nástrojů zachovat jejich skutečný obsah.
- [ ] Pokračovat ve V02/V06/V14 u zbývajících stránek; odstranit duplicitní rozcestníky a opakované výzvy. Krátké užitečné vysvětlení a ceny neskrývat mechanicky.

**Přijetí:** celá slíbená odpověď je dostupná před dobrovolnou nabídkou. Čtenář rozliší vlastní výsledek od reference a reklamy. Významové texty 78 karet a hodnotný obsah zůstávají zachované.

### W06 · P2 · Jeden srozumitelný jazyk formulářů a stavů

- [ ] Doplnit u každého asynchronního nástroje stavy prázdný/vyplněný/načítání/výsledek/chyba/opakování. Chyba zachová vstupy, odstraní zavádějící starý výsledek a řekne, co jde udělat.
- [ ] Ověřit popisky, vysvětlení nepovinných údajů, autocomplete, Enter a fokus. Chyba má být i u pole nebo výsledku, nejen v krátkém toastu.
- [ ] Zpřesnit čekání a chyby: žádné nepravdivé „naši mágové již pracují“. Rychlý lokální výsledek nebrzdit předstíraným výpočtem.

**Podklad:** `js/error-boundary.js` řeší jen velmi malý/prázdný `main`; existence globálního panelu nezaručuje ošetření dílčího API výpadku. Kvízy např. `js/quiz/archetyp-duse.js` používají pevné čekání 2500 ms a HTML loading nemá společné status semantics. Při implementaci prověřit aktuální konkrétní větev a zachovat poctivé vyhodnocení kvízu.

### W07 · P2 · Mobil, klávesnice a klidný pohyb

- [ ] Ověřit mobilní menu, formuláře, výsledek, modal, patičku a cookie lištu při 320/390 px a rozumném zvětšení textu; tablet a desktop podle breakpointů konkrétního vzoru.
- [ ] Přibližně 44px dotykové plochy, viditelný fokus a popisky ikon; obsah nesmí zakrývat pevná hlavička nebo lišty.
- [ ] Respektovat omezený pohyb i v JavaScriptu. Používat jemné a účelné přechody; informace musí být dostupná i bez animace.

**Konkrétní zdrojový kandidát:** `dashboard.js:1939` spouští dvacet částic přes Web Animations po uložení reflexe bez vlastní kontroly `prefers-reduced-motion`. CSS pravidlo pro pohyb samo tuto JS větev nedokládá jako vyřešenou. Nejde o novou ruční certifikaci přístupnosti celého webu.

## 3. Dokončení zážitku napříč službou

### W08 · P2 · Užitečný důvod vrátit se

- [ ] Dopracovat každou kartu dne: vlastní stručná otázka, pozorovatelný podnět a uskutečnitelný krok podle konkrétní karty. Navazuje na otevřený bod funkčního review.
- [ ] Volitelnou osobní reflexi a návrat k poslednímu výkladu napojit podle PF08/PF10/PF11. Při opakovaném otevření dne zachovat stejnou kartu a srozumitelné datum.
- [ ] Nevyžadovat denní sérii, další nákup nebo opakované losování, aby člověk získal uzavřený užitečný výsledek.

### W09 · P2 · Web, profil, e-mail, PDF a sdílení spolu souhlasí

- [ ] Ověřit PV04: uložení nevynechá otázku, karty, podstatný text nebo označení fallbacku. Porovnat stejné modelové zadání napříč výstupy, nikoliv různé generace.
- [ ] Na skutečných šablonách sladit názvy produktů, logo, paletu, obrázky, typografii a tón. E-mail/PDF mají vlastní omezení a musí zůstat pohodlně čitelné.
- [ ] Dokončit exporty a náhledy sdílení, včetně dlouhého textu, diakritiky, chybějícího obrázku a stažení v podporovaném prostředí. OG náhled není záruka stejné grafiky ve výsledcích Googlu.
- [ ] PF12 ponechat jako následné prověření dobrovolného návratu k zakoupenému výkladu. Současný jednorázový nákup nevyžaduje účet.

### W10 · P2 · Redakční dotažení hlasu

- [ ] Tykání a konkrétní čeština v nadpisech, formulářích, výsledcích i chybách. Odstranit interní SEO/technické popisky z návštěvnického textu.
- [ ] Prověřit celý slovník tarotu ano/ne, čínské výsledky, bioritmy, auru a perexy označené v auditech. Přehnané jistoty a nucené motivace nahradit skutečně užitečným symbolickým podnětem.
- [ ] U členství, jednorázového výkladu a mapy zachovat odlišný rozsah, cenu a doručení. Ukázky označit a automatický vznik popsat pravdivě.

### W11 · P2 · SK/PL a společné komponenty

- [ ] Dokončit V13 pro všech 13 lokalizovaných souborů: struktura, obrázky, UI stavy a přirozený jazyk. Zachovat fungující jazykové odkazy, canonical a hreflang.
- [ ] Přezkoumat výsledky a hlavičku načítané z JS; samotný překlad statického hero nestačí.

## 4. Výkon, údržba a dokončení vydání

### W12 · P2 · Změřit a zlepšit skutečnou rychlost

- [ ] Pořídit jeden datovaný výchozí vzorek pro homepage a zasažené vzory: přenos obrázků/fontů/CSS/JS, hlavní obsah, posuny rozložení a odezvu ovládání. Teprve podle něj odstraňovat skutečnou zátěž.
- [ ] Prověřit rozměry náhledů, vhodné varianty obrázků, načítání pod prvním pohledem a prioritu skutečného hlavního obrázku. Nenutit lazy-loading na všechno.
- [ ] Prověřit zbytečně načítané knihovny a staré bloky, vlastnictví bundle a font fallback. `font-display: optional` v lokálních fontech není automatická chyba; porovnat skutečné chování a české znaky před změnou.
- [ ] Po změně veřejných assetů používat existující build, cache hash a snapshot workflow. Zkouška musí zahrnout už otevřenou starší stránku, nejen nové anonymní okno.

### W13 · P1 pro vydání · Přesné přijetí a dohledatelný stav

- [ ] U každé funkční URL z inventáře vést rodinu, aktuální stav a odkaz na důkaz. Nepřepsat všech 917 souborů podle jednoho náhodného vzoru; generované obsahové rodiny kontrolovat přes jejich šablonu, výjimky a odpovídající stránky.
- [ ] Každý změněný vzor ověřit v běžném i relevantním chybovém/prázdném stavu. Opravy platby, oprávnění a enginu mají vlastní cílenou regresi; samotná barva nepotřebuje novou sadu testů.
- [ ] Předat místní vizuální přehled: desktop, mobil, vstup a výsledek. U známých zbývajících vad uvést stav, ne označit celé vydání za perfektní podle screenshotu.
- [ ] Produkci měnit po výslovném pokynu k vydání; následně ověřit konkrétní commit a zasažené cesty. Tato dokumentace není nasazení.

## Nejbližší ohraničený krok

**Checkpoint 16. 10. 2026:** probíhá závěrečná QA fáze; [výsledky a zbývající přijetí](release-prep-2026-10-15/qa-results.md). Doložené je načtení všech 166 funkčních vstupů na desktopu/mobilu, serverové a frontendové regrese a konkrétní interakce profilu, natálu, obnovy přístupu a denního PNG. Celý seznam není dokončený jen podle těchto úspěchů. Další ohraničený krok jsou zbývající výsledkové stavy nástrojů a důkaz výkonu, potom závěrečné předání vydání. Produkce se nezměnila.

**Autonomní realizace přešla do jedné závěrečné QA fáze.** Doložené výsledky, opravy i hranice jsou v [QA checkpointu](release-prep-2026-10-15/qa-results.md), jednotlivé nástroje v [cestách výsledků](release-prep-2026-10-15/tool-results-qa.md). Načtení všech 166 funkčních URL při dvou šířkách je doložené; všech sedm kvízů a hlavní výsledkové rodiny navíc prošly interakcí. Nově rituální zápisky skutečně navazují do serverového deníku profilu, včetně chyby a retry. Slovenský i polský horoskop prošel všemi třemi obdobími; doplněné Auth loadery na 11 stránkách pokrývá regrese všech 13 lokalizovaných vstupů. Nejbližší krok: zbývající přístupové/chybové výjimky, W12 výkon, kvalita živých AI výstupů a uzavření přijímacího seznamu; následně konkrétní vydání. Checkboxy celého seznamu se neodškrtávají hromadně podle několika úspěšných scénářů.

PF01 byl před touto dávkou místně ověřen: 11/11 cílených regresí a skutečný profil nad syntetickou databází; [původní checkpoint](profile-unification-2026-10-14/pf01/README.md). Nyní navazující změny vyžadují znovu dotčenou závěrečnou regresi. Produkce se neměnila.

## Co je již doloženě hotové

Zůstává uzavřená předchozí dávka: základní přesun profilových záložek, serverové stránkování historie, upravená patička, dávkování blogu/atlasu, méně CTA na 78 detailech, SVG fáze Měsíce a odstranění mlhoviny z datované šablony. Detaily a omezení jsou v [implementačním reportu](profile-unification-2026-10-14/README.md). Navazující chyby mají vlastní PF/W ID; nevrací celý dřívější úkol automaticky do stavu „nic hotovo“.

**Metoda tohoto doplnění:** aktuální zdrojová kontrola hlavních komponent, propojení s datovanými audity a jeden ohraničený read-only průzkum pomocníka `gpt-5.6-luna`. Nebyly spuštěné nové testy aplikace, znovu procházené všechny stránky ani načítaná osobní nebo produkční data. Produktový kód zůstal beze změny. Tento plán negarantuje návštěvnost, prodeje ani úplnou přístupnost.
