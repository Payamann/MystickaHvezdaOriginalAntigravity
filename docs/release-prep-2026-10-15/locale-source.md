# SK/PL stránky — zdrojová příprava W11

Projito všech 13 souborů: `sk/andelske-karty.html`, `sk/horoskopy.html`, `sk/index.html`, `sk/kristalova-koule.html`, `sk/natalni-karta.html`, `sk/tarot-ano-nie.html`, `sk/tarot.html`, `pl/andelske-karty.html`, `pl/horoskopy.html`, `pl/index.html`, `pl/kristalova-koule.html`, `pl/natalni-karta.html` a `pl/tarot.html`.

## Změny zdrojů

- V deseti stránkách s opakovaným katalogem dalších nástrojů (`andelske-karty`, `horoskopy`, `kristalova-koule`, `natalni-karta`, `tarot` v obou jazycích) jsou původní odkazy zachované a zavřené do nativního `<details>` s přeloženým popiskem „Ďalšie nástroje“ / „Inne narzędzia“.
- Dekorativní emoji odstraněna z odkazů v těchto katalozích a z popisku resetovacího tlačítka v `sk/tarot-ano-nie.html`. Ikony znamení a hvězdička u šťastných čísel zůstaly, protože nesou obsahový význam.
- Překlady, cíle odkazů, formuláře, ceny, canonical/hreflang, ID, hooky a JSON-LD nebyly změněny. Soubory `sk/index.html`, `pl/index.html`, `sk/tarot-ano-nie.html` a `pl` stránka křišťálové koule nebyly jinak upraveny. Skripty `type="module"` na stránce křišťálové koule nebyly měněny.

## Zbývá pro závěrečnou QA

- Všech 13 stránek nebylo načteno v prohlížeči; nebyla ověřena viditelnost/details, mobilní rozvržení ani společná navigace po načtení komponent.
- Skutečné runtime výsledky SK/PL nástrojů nebyly ověřeny. Zvlášť je potřeba zkontrolovat slovenský tarot ANO/NIE a CZ fallback či jazykové chování křišťálové koule. Zdrojový fallback samotný nedokazuje správnou lokalizaci generovaného výsledku.
- Nebyl spuštěn build, testy ani aplikace. Změny jsou pouze v HTML a reportu; jiné runtime soubory patří hlavní dávce.

Zdrojová kontrola `git diff --check -- sk pl` proběhla bez hlášených chyb. Stav zůstává lokální release kandidát bez nasazení.
