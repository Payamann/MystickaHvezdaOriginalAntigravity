# Co na webu ještě nesedí — úplný průzkum

14. října 2026 · pouze průzkum, produktové soubory beze změny · lokální kandidát `9d6814de`.

**Navazující implementace 15. 10.:** [co už je opravené a co zbývá](../profile-unification-2026-10-14/README.md), [nové snímky](../profile-unification-2026-10-14/overview.html). Následující text popisuje původní auditovaný stav.

## Rozsah a důkazy

- Zdrojově inventarizováno **917 veřejných HTML souborů**: 166 funkčních, přehledových a podpůrných vstupů, 749 obsahových souborů a 2 interní stránky.
- **Všech 166 vstupů** načteno v lokálním prohlížeči na mobilu 390 px a desktopu 1280 px. Zaznamenán celý DOM a celostránkové snímky mobilu. Pro výpis byl posouzen zdroj jednotlivých sekcí a 21 přehledových listů se začátkem a koncem hlavního obsahu. Nejde o ruční vizuální kontrolu každého pixelu 917 stránek.
- Produkce: veřejné GET HTML všech 166 cest skončilo 200; starý roční produkt a alias soukromí přesměrují. HTTP 200 nedokazuje funkční výpočet ani dokončení nákupu.
- Navíc přímo v produkčním prohlížeči zkontrolováno **všech 12 znamení denního horoskopu pro 1. 10. 2026**. Další data používají stejný renderer; nebylo předstíráno ruční otevření všech možných dat.
- Přihlášené, členské, platební a doručovací stavy byly v tomto průzkumu posouzené ze zdroje. Nebyly provedeny skutečné platby, registrace, odeslání zprávy/e-mailu ani použití osobních dat. Statický náhled nemá API; jeho chyby načítání nejsou automaticky chyby produkce.
- V ověřených vstupních DOM nebylo naměřené vodorovné přetečení při 390 ani 1280 px. To není úplná certifikace přístupnosti.

## Doplnění: přihlášení a účet

**Navazující funkční review profilu 15. 10.:** [aktuální TODO PF01–PF12 a ověření PV01–PV04](profile-followup-todo.md). Obsahuje oddělené potvrzené modelové interakce, zdrojové závady a produktové návrhy.

Navazující samostatná kontrola má 19 zaznamenaných stavů a 9 konkrétních bodů: [review účtu](account-review.md), [vizuální přehled](account-overview.html). Zahrnuje také prázdnou produkční validaci; žádný produkční auth účet, e-mail, nové heslo ani platba nebyly vytvořené. Lokální simulace nedostupného API je zvlášť označená.

## Seznam problémů podle priority

### V01 · P1 · Stará mlhovina v denních horoskopech s datem

**Kde:** /horoskop/:sign/:date

**Důkaz (produkční DOM + zdroj):** Produkční DOM: všech 12 znamení pro 1. 10. 2026 má viditelnou .stars s bg-cosmic-mobile.webp. Šablona server/routes/horoscope-pages.js:280; css/style.v2.css:6017–6059.

**Navržená změna:** Vypnout starou dekorativní vrstvu pro tuto šablonu a použít stejné malované navy pozadí. Zkontrolovat mobil i desktop a každý serverový stav této rodiny.

### V02 · P1 · Celý katalog dalších služeb pod jednotlivými nástroji

**Kde:** Tarot, andělské karty, numerologie, natální karta, partnerská shoda, astro-mapa, runy, koule, mentor

**Důkaz (lokální DOM + zdroj):** Zdroj i vykreslené stránky: např. mentor.html:152–199, tarot.html:500, numerologie.html:434–499; andelske-karty.html má dvě různé cross-link sekce.

**Navržená změna:** Nahradit katalog jednou smysluplnou návazností. Všechny nástroje zpřístupnit přes navigaci nebo samostatný přehled. Zachovat přístupové informace a hlavní výsledek.

### V03 · P1 · Patička zabírá na mobilu více než dvě obrazovky

**Kde:** Stránky se společnou patičkou, včetně loginu, profilu, detailů karet, chybové stránky

**Důkaz (lokální DOM):** Měřený společný footer má na mnoha stránkách 1882–2052 px při šířce 390 px; domovská stránka má vlastní kratší footer. components/footer.html, css/atlas-web.css:50.

**Navržená změna:** Zkrátit svislé mezery a složit rozcestníky do jasných skupin. Kontakt, soukromí, podmínky a jazyk ponechat dostupné; zachovat dotykové plochy.

### V04 · P1 · Blog a galerie karet načítají celý katalog do jedné dlouhé stránky

**Kde:** /blog.html, /tarot-vyznam-karet.html

**Důkaz (lokální DOM + zdroj):** Blog: 41 574 px, js/blog.js:75 posts.slice(1) a renderPostsGrid všech položek. Význam karet: 46 294 px, js/tarot-meaning-hub.js renderCards mapuje všech 78.

**Navržená změna:** Použít menší první dávku, hledání/filtry a dostupné další stránky nebo načíst další. Zachovat procházetelné odkazy na všechny články a karty. Snář už načítání dalších položek má.

### V05 · P2 · Na detailech 78 karet se opakuje několik cest k témuž výkladu

**Kde:** /tarot-vyznam/*.html — všech 78

**Důkaz (lokální DOM + zdroj):** Každý detail má hero CTA, další krok, rychlý přehled, spodní CTA a nabídku denního horoskopu; všechny 78 URL jsou uvedené v seznamu. Obsah karty a nativní FAQ jsou samostatné.

**Navržená změna:** Zachovat kvalitní ilustraci a vlastní význam, jeden hlavní přechod na výklad a související karty. Zmenšit opakované CTA; denní e-mail nabídnout jako vedlejší volbu. Existující FAQ znovu neobalovat.

### V06 · P2 · Dlouhé vysvětlovací a prodejní ocasy na nástrojích

**Kde:** Partnerská shoda, andělské karty, tarot, numerologie, runy, snář, astrologické nástroje

**Důkaz (lokální DOM + návrh):** Partnerská shoda 14 531 px; andělské karty 13 461 px; numerologie 8825 px; tarot 10 014 px. Jsou to celkové výšky včetně katalogů a footeru, ne samotný počet slov.

**Navržená změna:** Nástroj → celý výsledek → jedna návaznost → volitelné vysvětlení. Sbalovat jen dlouhý referenční text, který není už v details. Ceny, limity, souhlas a slíbený výsledek ponechat otevřené.

### V07 · P2 · Velké přepínání všech znamení převáží krátký denní výklad

**Kde:** Denní datované stránky, přehled /horoskop/index.html

**Důkaz (produkční DOM):** Produkční denní stránka má 12 velkých karet znamení a 5471–5579 px celkové výšky. Vlastní text pro Blížence je krátký podnět.

**Navržená změna:** Použít kompaktní přepínač „Změnit znamení“ s dostupnými odkazy. Předchozí/dnešní/následující den zachovat.

### V08 · P2 · Fialový plastový Měsíc neodpovídá malovaným ilustracím

**Kde:** /lunace.html, /ritualy/index.html

**Důkaz (lokální screenshot):** Mobilní snímky lunace.html a ritualy/index.html ukazují žluto-fialový prostorový Měsíc, zatímco okolí používá navy/malovanou krajinu.

**Navržená změna:** Nahradit čistým navy/zlatým vykreslením skutečné fáze nebo odpovídající ilustrací. Fázi a datum nadále určovat současným výpočtem; nepoužít obrázek s nesprávnou fází.

### V09 · P2 · Rituální sezení má vlastní starší vizuální jazyk

**Kde:** /ritualy/session.html

**Důkaz (lokální screenshot + zdroj):** ritualy/session.html: screenshot fialového pole, svíčka a barevné nálady; css/pages/ritualy-session.css:31–40 vlastní gradient a stars-bg.

**Navržená změna:** Sladit pozadí, typografii a ovládání s malovaným stylem. Zachovat kroky, nálady a ukončení sezení. Nálady jsou vstupní hodnoty, ne automaticky odstranitelná dekorace.

### V10 · P2 · Onboarding a offline stránka zůstaly mimo jednotnou úpravu

**Kde:** /onboarding.html, /offline.html

**Důkaz (lokální screenshot + zdroj):** onboarding: vlastní fialová plocha a vybrané hranice; css/pages/onboarding.css. offline.html:32 má doslovné ??, css/pages/offline.css:45 fialové tlačítko; ve snímku je vidět odkrytý skip link.

**Navržená změna:** Převzít společné navy/zlaté povrchy, nahradit ?? platnou ikonou a opravit viditelnost skip linku. Onboarding ponechat krátký, se zachovaným výběrem/odmítnutím.

### V11 · P2 · Barevné emoji se vracejí v CTA, datech a výsledkových šablonách

**Kde:** Čínský horoskop, malé CTA, runtime výsledky, SK/PL varianty

**Důkaz (lokální screenshot + zdroj):** Např. čínská znamení, menší „Pokračuj“ bloky, andělská pošta, testy a jejich výsledky; konkrétní původ je v HTML i JS datech. Není to jen hlavní mřížka SVG ikon.

**Navržená změna:** Rozlišit obsahový symbol od UI dekorace. Dekorativní ikonky převést na existující SVG; znamení, barvy a nálady ponechat s přístupným popiskem a významem.

### V12 · P2 · Některé exporty výsledků používají starší hvězdný canvas

**Kde:** Tarot ANO/NE a sdílený canvas dalších nástrojů

**Důkaz (zdroj; vizuální ověření exportů zbývá):** js/share-image-canvas.js:78–81 a js/tarot-ano-ne.js:846–860 kreslí tmavě fialový gradient a hvězdičky. Zdrojová kontrola, exporty zde nebyly všechny staženy. js/horoscope-share.js už používá malovanou krajinu a navy paletu.

**Navržená změna:** Navázat ostatní exporty na již upravený horoskopový styl; ověřit délku textu, diakritiku, ořez a skutečně stažený obrázek. Horoskopový export nevydávat za dosud starý.

### V13 · P2 · Jazykové varianty se liší od aktuální české cesty

**Kde:** Všech 7 SK a 6 PL souborů

**Důkaz (lokální screenshot + zdroj):** Všech 13 SK/PL stránek zachycených v mobile/desktop. Mají jiné hero, rozsáhlé související bloky a barevné emoji; lokalizované home používají starší text a odlišný rozcestník.

**Navržená změna:** Sladit strukturu a grafiku s českými vzory, zachovat přirozený překlad a hreflang. Zvlášť ověřit načítání společné navigace a text výsledků podle jazyka.

### V14 · P3 · Opakovaná plná vysvětlení v rámečcích působí těžkopádně

**Kde:** Aura, bioritmy, čínský horoskop, periodické horoskopy, denní tarot

**Důkaz (lokální screenshot + návrh):** Ve snímcích aura, čínský horoskop, bioritmy, měsíční/týdenní stránky a denní karta mají několik otevřených boxů otázek s odpovědí. FAQ jinde je již nativně sbalené.

**Navržená změna:** Tam, kde jde jen o FAQ, použít jednotné jednotlivé details. Nezmenšovat vše plošně; krátká informace o použitelnosti výsledku má zůstat.

### V15 · P3 · Za uživatele nelze rozhodnout podle délky textu

**Kde:** Přihlášení, kvízy, kontakty, soukromí/podmínky, placené produkty

**Důkaz (lokální DOM + zdroj):** Login má 28 viditelných slov v main; testy 54–80; vztahový výklad má důležitý popis, cenu a souhlas. Právní stránky jsou referenční obsah. Homepage má 371 viditelných main slov proti většímu počtu ve zdroji kvůli skrytým částem.

**Navržená změna:** Tyto stránky mechanicky nekrátit. Vylepšit návazné stavy a společné komponenty, zachovat jasnost nabídky a zákonné informace.

## Jak postupovat při úpravách

1. Opravit společnou šablonu denních horoskopů a viditelné výjimky (offline, rituály, onboarding).
2. Zkrátit opakované katalogy a společnou patičku. Ověřit zachování všech dostupných nástrojů a důležitých odkazů.
3. Upravit procházení blogu a 78 karet; potom referenční texty podle konkrétního nástroje.
4. Sladit výsledky, exporty a jazykové varianty. Před změnou chráněných stavů zajistit odpovídající testovací účet a bezpečný checkout.

Nová grafika není hlavní blokace. Použít existující malované ilustrace; konkrétní nová potřeba je jednotná vizualizace fází Měsíce. Vkládání dalších obrázků mezi všechny odstavce by nevyřešilo opakování a dlouhé katalogy.

Zachovat hlavní výsledek, cenu, limity, souhlas, doručení, chybové/recovery stavy, URL a interní odkazy. Nativní FAQ už je na mnoha stránkách sbalené; nevytvářet další obalový accordion. Delší články a významy karet jsou vlastní užitečný obsah, jejich délka sama o sobě není závada.

## Soubory průzkumu

- [Profil vykreslený ze skutečných dat vlastníka](profile-authenticated-review.md): deset konkrétních nálezů, rozlišení DB, místního UI a zdrojového ověření; soukromá data mimo verzovaný report.
- [Přehled s filtrem a všech 166 řádků](overview.html)
- [Seznam každé stránky](pages.md)
- [Všech 917 souborů (CSV)](all-files.csv)
- [Zdrojové kandidáty starých barev/pozadí](legacy-source-candidates.json): deklarace mohou být přepsané, neaktivní nebo skutečnou barvou výsledku; nejsou automaticky vizuální chyby.
- [Produkční denní horoskopy](production-dated.json), [veřejné produkční cesty](production-sources.json)
- [Mobilní DOM](browser-mobile.json), [desktopový DOM](browser-desktop.json), [seznam problémů](issues.json)
- Podrobné zdrojové inventury: [tarot](tarot.md), [78 detailů](tarot-details.md), [astrologie](astrology.md), [ostatní nástroje](tools.md), [kvízy/rituály/huby](extras.md), [účet a placené produkty](account-paid.md), [dynamické stavy](dynamic-account.md), [společné komponenty a jazyky](shared-locales.md).

Průzkum funkčních výpočtů a doručení je veden samostatně v [předchozím review](../product-function-review-2026-10-14/README.md). Zdejší seznam není potvrzení, že všechny tyto funkční nedostatky byly opravené.

## Checkpoint a oprava postupu

Tři levnější pomocníci `gpt-5.6-luna` provedli ohraničené inventury zdrojů. Hlavní agent nezávisle ověřil soubory, celkové pokrytí a produkční staré pozadí. Původní hromadné snímky byly skutečně desktopové, přestože byly zamýšlené jako mobilní. Závěry z těchto chybně označených listů byly vyřazené; mobilní průchod byl zopakován se striktní kontrolou šířky 390 px u každé stránky. Překrývající se horní/dolní výřez není důkaz duplicitního prvku. Skryté výsledky a obsah čekající na animaci/API se nepovažují za chybějící funkcionalitu.

Stav: průzkum dokončený pro deklarovaný rozsah; produktové HTML/CSS/JS/server nebyly změněné, nic nebylo nasazené. Další krok je oprava V01–V03 s cíleným ověřením.
