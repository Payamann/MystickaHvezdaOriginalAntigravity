# Kvízy — zdrojové úpravy

Upraveno sedm zadaných HTML stránek v `testy/` a pouze funkce `shareResult` v jejich sedmi zdrojích v `js/quiz/`.

- Úvodní texty, popisy stránky a Open Graph popisy nyní vysvětlují výsledky jako symbolické přiřazení podle odpovědí. Zvlášť je vyjasněno, že kvíz neměří auru, mimosmyslové schopnosti, osobnost ani životní rovnováhu a neurčuje minulé inkarnace či ochranné zvíře.
- Loading texty sjednoceny na přípravu výsledku z odpovědí; zmizely tvrzení o snímání energií, otevírání vesmírných kanálů, nahlížení do osudu a volání ochránce.
- Texty sdílení popisují výsledek jako symbolické propojení odpovědí s motivem/barvou/zvířetem/živlem.

Otázky, možnosti, datové atributy, ID, URL, formuláře a vyhodnocovací logika nebyly tímto krokem měněny. Neprováděl jsem build, testy ani kontrolu v prohlížeči; ty zůstávají pro závěrečnou QA fázi. HTML stránky načítají generované soubory pod `js/dist/quiz/`, které nebyly sestaveny.
