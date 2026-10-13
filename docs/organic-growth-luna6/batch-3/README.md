# Organický růst · třetí dávka · 13. 10. 2026

## Hotový krok

Aktualizovaný existující průvodce mečovými kartami a čtyři katalogové detaily (Eso, Dvojka, Trojka, Devítka mečů). Katalogový souhrn a filtrovací zdroj navazují na nové texty. Celkem šest změněných HTML stránek, jedna lokální CSS vrstva a dva obsahové JSON zdroje. Použity vlastní existující ilustrace; nová generace obrázků nebyla potřeba.

Výběr podporuje dřívější export GSC, **14. 9.–11. 10. 2026 vs. 17. 8.–13. 9. 2026**, Web bez filtru země/zařízení, stažený 13. 10. Do této dávky nebyl získán nový export. Konkrétní řádky Stránky.csv:

| URL | Prokliky nyní/předtím | Zobrazení nyní/předtím |
|---|---:|---:|
| /tarot-vyznam/eso-mecu.html | 2/0 | 342/133 |
| /tarot-vyznam/dvojka-mecu.html | 0/0 | 52/26 |
| /blog/mecove-karty-tarot-vyznam.html | 0/0 | 15/19 |
| /tarot-vyznam/trojka-mecu.html | 0/0 | 4/2 |
| /tarot-vyznam/devitka-mecu.html | 0/0 | 4/13 |

Malé počty ostatních detailů neprokazují růstovou příležitost samy o sobě. U nich změnu odůvodňuje konkrétní problém v obsahu a návaznost na společného průvodce. Počty předcházejí implementaci; nový CTR ani obchodní efekt není známý. [Původní baseline](../baseline.md).

## Co se změnilo

- Průvodce má všech 14 mečových karet s obrázkem, odlišným tématem a otázkou k zamyšlení; názvy odkazují na existující detaily. Desktop používá dvě kolony, mobil jednu. Obsah lze projít přes čtyři kotvy, obrázky mají rozměry a lazy loading.
- Odstraněné záruky uzdravení a budoucího obratu, zdravotní varování, diagnózy skrze tarot, zlehčování skutečných obav a tvrzení, že omezení existuje pouze v mysli. Trojka nepotvrzuje zradu, Devítka neposuzuje závažnost potíží.
- Vysvětlený postup otázka → pozice → okolní karty → skutečnost; označená modelová ukázka zprávy bez odpovědi, rozdílné použití ve vztahu/práci a obrácené polohy. Zachována vlastní možnost rozhodnout.
- Čtyři detaily mají vlastní summary/love/work/yes-no/action/reversed/example/question ve zdroji generátoru. Ukázky jsou modelové. Každý detail odkazuje na společný průvodce.
- CTA skutečně otevírá bezplatnou kartu dne; popisuje automatický výklad a dobrovolné členství místo přímé práce kartářky nebo objednávky speciálního produktu na Meče.
- Title, popisy, článek i blogový index odpovídají. Publikace zůstává 17. 3. 2026; skutečná aktualizace je uvedena 13. 10. 2026. Odhad čtení v indexu upraven na 6 minut (1 118 slov / přibližně 200 slov za minutu; odhad, nikoli měření čtenářů).
- Sdílený náhled odpovídá Esu mečů, ne obecnému blogovému obrázku. URL a canonical se neměnily. Engine, losování, platby a práva přístupu nejsou v této dávce změněné.

## Ověřené výstupy

- Nezávislý parser všech šesti HTML v izolovaném kandidátu i po integraci do rootu: jeden H1, zachovaný canonical, platné JSON-LD a existující lokální cíle/obrázky.
- Přesně 14 ilustrovaných položek; všechny použité obrázky existují a mají 600 × 1000. Eso social preview má 1200 × 630. Index title/description/published date souhlasí s článkem.
- Manuální desktop a mobil 390 × 844: přehled, kotva, čitelnost, bez vodorovného přetékání. Proklik článek → Eso, návrat přes průvodce klávesnicí, CTA → karta dne → **odhalená Šestka pentáklů** bez účtu. Skutečný výsledek v lokálním statickém náhledu; žádná platba ani odeslaný odběr. Backendové měření a doručení se zde neověřovalo.
- Automatický klik na zalomený inline odkaz návratu nezměnil URL: jeho střed ležel v mezeře mezi řádky (DOM elementFromPoint ukázal p). Klávesnicový proklik Enter pak uspěl. Nenahlašujeme úspěch tohoto myšího automatického pokusu ani chybu backendu.
- Hlavní náhled na portu 3212 po sloučení obsahuje všech 14 položek, správné CTA a zachované starší atlas třídy / členství. Sloučení rootu bylo úzké; jediný textový konflikt CTA vyřešen se zachováním atlas-blog-primary.
- Opakovaná generace 78 detailů změnila **0** souborů. Sitemap **907 canonical URL včetně metadata PASS**; změněno pouze pět relevantních lastmod. Zachováno všech **819** předchozích verzí veřejných assetů, přidána jedna verze CSS. Service-worker generator hlásí aktuální cache. Whitespace diff kontrola prošla.
- gpt-6-luna / medium provedl read-only audit a kontrolu diffu; hlavní agent provedl implementaci a nezávislé ověření. Tři konkrétní copy nálezy opraveny: určete → stanov si, nepřirozený nadpis Devítky a zastaralý čas čtení. Číselná úspora není vyčíslena.

Aplikační testy nebyly přidávány ani spuštěny: mění se obsah a lokální rozložení, návazná bezplatná cesta byla ručně dokončena. [Skutečné náhledy](overview.html).

## Stav a pokračování

**Lokální, bez push/deploy/publikování.** Izolovaná větev codex/organic-growth-20261013 navazuje na f02d4710; hlavní workspace obsahuje i další dřívější nepublikované změny. Pro vydání použít izolovaného kandidáta a release guard.

Přehled článku pokrývá všech 14 karet. V této dávce do hloubky revidované pouze čtyři katalogové detaily; zbývajících deset detailů není tímto označeno za hotové. Další konkrétní krok může dokončit jejich vlastní love/work/praktické ukázky, zejména Osmičku, Sedmičku a Desítku, se zachováním engine dat. Žádná další série ani budoucí monitoring není automaticky nastavený.
