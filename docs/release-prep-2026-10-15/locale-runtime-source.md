# SK/PL runtime jazyk — zdrojový audit

Read-only kontrola všech 13 locale HTML; bez aplikace, browseru, buildů, testů a síťových volání. Současné HTML správně nastavuje `lang="sk"` / `lang="pl"` na řádku 2 každé stránky.

## Potvrzené zjištění

- **Sdílená navigace zůstává česky na všech 13 stránkách.** `js/components.js:85` načítá stejný `/components/header.html` bez výběru jazyka. Šablona obsahuje české texty menu a přihlášení, např. `components/header.html:11,17,19,22,97,106`. `js/components.js:346–354` určuje jazyk podle URL pouze pro přepínač jazyků; nepřekládá obsah hlavičky. V žádném ze 13 HTML není lokální header.
- **`<html lang>` není obecný zdroj jazyka API.** Sdílený `js/api-config.js:81–88` odvozuje `lang` z cesty `/sk/` nebo `/pl/`. To na těchto stránkách odpovídá `lang` dokumentu, ale je to nezávislé odvození podle URL.
- **Horoskop:** zdrojový `js/horoscope.js:507–509,544,583,587,596,630` má kopii SK/PL a odešle vybraný jazyk. Ani `sk/horoskopy.html:229`, ani `pl/horoskopy.html:229` ale tento klient nenačítají; načítají pouze `main.js`. `js/main.js:7–10` importuje jen obecné UI moduly, ne `horoscope.js`. V těchto HTML tedy není připojený zdrojový renderer, který by použil lokalizované loading texty nebo jazyk požadavku.
- **Tarotové rozcestníky:** `sk/tarot.html` a `pl/tarot.html` jsou navigační stránky s českými odkazy a jazykovou poznámkou; nepředpokládají spuštění lokálního tarotu. Absence `tarot.js` zde není runtime chyba.
- **Natální karta:** tento kandidát nyní připojuje lokalizovaný základní klient `js/dist/locale-natal.js` ve SK/PL HTML na řádku 138. Zdroj `js/locale-natal.js` volí kopii podle `document.documentElement.lang` a mapuje názvy planet/znamení. Dist soubor musí vzniknout v závěrečné QA fázi; klient nebyl spuštěn.
- **Andělské karty:** obě stránky výslovně uvádějí, že losování je zatím dostupné pouze česky (`sk/andelske-karty.html:52–53`, `pl/andelske-karty.html:52–53`). V jejich HTML není načten `angel-cards.js`; obsah tedy neslibuje SK/PL výsledek.
- **Čínská koule:** jediný klient, jehož aktuální zdroj přímo čte `document.documentElement.lang`, je `js/crystal-ball.js:73–75`; kopii UI volí z `cs/sk/pl` a API request posílá stejné `locale` na `:248`. SK a PL HTML ale odkazují na `js/dist/crystal-ball.js` (`sk/kristalova-koule.html:131`, `pl/kristalova-koule.html:131`). Nahraná dist kopie je v tomto kandidátu starší než právě upravený zdroj a neobsahuje nový `requestedLocale`/SK/PL UI výběr; její runtime chování jsem bez build/browseru neověřoval. Před vydáním je nutné vytvořit dist z aktuálního zdroje.
- **SK tarot ANO/NIE:** `sk/tarot-ano-nie.html:283` načítá specializovaný `tarot-ano-nie-sk.js`; klient používá pevnou `locale: 'sk'` (např. `js/tarot-ano-nie-sk.js:148,262,391`). Jeho jazyk tedy není odvozen z `document.lang`, ale odpovídá jediné SK stránce. Mezi 13 soubory není PL varianta ANO/NIE.

## Zbylé stránky a vstupy

`sk/index.html:120`, `pl/index.html:120` načítají jen obecný `main.js`; nemají výsledek nástroje. Zbývající stránky v auditu používají stejné obecné `components.js` a `main.js`; souhrn všech 13 HTML je v [locale-source.md](locale-source.md). Neověřoval jsem navigaci ani výsledky v runtime.

Stav je lokální release kandidát. Žádné JS ani HTML soubory nebyly změněny.
