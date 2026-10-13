# Organický růst · checkpoint 13. 10. 2026

## Hotový ověřený krok

Realizace první dávky podle `docs/organic-growth-luna6-plan-2026-10-13.md`, vedená hlavním agentem podle Pavlova nového pokynu. Pomocný **gpt-6-luna / medium** prověřil a opravil ohraničenou návratovou cestu a provedl read-only kontrolu obsahu; hlavní agent nezávisle ověřil výstupy, GSC, skutečné náhledy, odkazy a testy. Číselná úspora není vyčíslena.

0. **Data:** čerstvý CSV export GSC do 11. 10., skutečný parser a mapa šesti obsahových URL v baseline.
1. **Obsah:** aktualizované existující tarotové stránky, per-card zdroje, zachované URL/canonical/nabídka; běžná modelová situace, lepší přirozená návaznost. Opraven drift generátoru a návrat starých textů při filtrování hubu.
2. **ANO/NE:** nový uzavřený týden, crawl a aktuální ruční SERP. Bez prokázané technické blokace; další okamžitý přepis titulků nedělat.
3. **Social:** tři hotové odlišné drafty a skutečná existující grafika, QA/preview je načetly všechny. Nejsou zaznamenané jako approved ani plánované.
4. **Návrat:** inline odběr nyní až po odhalení karty, existing mock scénář chyby a úspěchu prošel desktop/mobil.

## Důkazy a stav

[Náhled](overview.html), [změny a kontroly](content-changes.md), [diagnostika](ano-ne-diagnosis.md), [návratová cesta](return-path-check.md), [výsledky k doplnění](results.md). Celkem **4 cílené E2E běhy PASS** a **2 cílené Python testy PASS**; JSON-LD/odkazy/canonical i regenerování zkontrolované. Selhání sandboxových E2E běhů zachované v reportu, úspěšný finální běh proběhl mimo sandbox. Žádná skutečná platba ani e-mail.

Oddělený kandidát: `.codex-tmp/release-20261012`, základ `12ba756f6b22db07c01ec35e44bb83a8dd55b80d`. Obsahové změny jsou úzce přeneseny i do hlavního workspace se zachováním rozpracovaných vizuálních změn. Root je dál špinavý kvůli dřívější práci; pro vydání používat izolovaného kandidáta, nestagovat hlavní workspace plošně.

## Otevřené hranice

- Tato dávka není nasazená; nový title ANO/NE je z předchozího vydání. Nehodnotit jeho efekt z předchozích dat.
- FB drafty nejsou schválené ani publikované a nepřekrývají existující schválený týdenní plán.
- Meta guide byl v rešerši za login/blokací; skutečný Meta crop před zveřejněním není potvrzen.
- Odběrový API success je záznam odběru, ne důkaz email delivery. Celý audit textu/verze souhlasu není uložen ve stávajícím DB schématu; DB migrace nebyla provedena.
- Úplný nový denní query × URL × mobil/Česko export nebyl získán. Příčina ANO/NE poklesu a dopad úprav na růst zatím nejsou prokázané.

## Další krok první dávky (historický checkpoint)

Prohlédnout hotový obsah a tři návrhy. Po konkrétním zadání nasazení použít release guard nad izolovaným diffem; po schválení textů publikovat/naplánovat konkrétní FB objekty s reálným náhledem. Poté doplnit results až ze skutečného crawl a provozu. Žádné automatické budoucí sledování není nastavené.

## Uložený kandidát

Obsahový commit `bf8002cec17f2dbafce35005eafc07ed6d22eb87`, lokální větev `codex/organic-growth-20261013`. Žádný push ani deploy. Závěrečná sitemap kontrola odhalila starý lastmod horoskopy.html z předchozího mobilního vydání; jeho oprava je doložená Git historií a nemění stránku ani URL set.

## Druhá dávka · 13. 10. 2026

Tarotový rozcestník, 3 karty a Slunce blog/detail/katalog dokončené lokálně. Opraven runtime návrat starých textů, neodpovídající denní počítadlo a konkrétní tvrzení/průchod do free a členství. Čtyři cílené existující E2E PASS, parser pěti HTML v izolovaném kandidátu i rootu PASS, opakovaná regenerace 78 detailů změnila 0, sitemap 907 URL PASS. [Přehled a důkazy druhé dávky](batch-2/README.md), [skutečné náhledy](batch-2/overview.html). Žádný push/deploy/publikování. Root změny úzce sloučené, starší práce zachovaná; engine v izolovaném diffu beze změny. Další krok: navazující existující karta/průvodce podle dat, nebo konkrétně autorizované vydání obou dávek z izolovaného kandidáta. Výsledky růstu po těchto dávkách ještě nejsou.

## Třetí dávka · 13. 10. 2026

Ilustrovaný průvodce všech 14 mečových karet a čtyři vlastní katalogové detaily (Eso/Dvojka/Trojka/Devítka), zdroje a blog index hotové lokálně. Manuální desktop/mobil a článek → detail → průvodce klávesnicí → karta dne → výsledek PASS; parser šesti HTML a asset/index kontrola PASS. Opakovaná regenerace 78 detailů změnila 0, sitemap 907 včetně metadata PASS, všech 819 předchozích asset verzí zachovaných +1 CSS. Root úzce sloučený se staršími atlas změnami. [Přehled a přesné hranice](batch-3/README.md), [náhled](batch-3/overview.html). Žádný push/deploy/publikování. Další krok: deset ostatních mečových detailů, zejména Osmička/Sedmička/Desítka; jejich původní texty nejsou tímto revidované. Výkon po změnách zatím neznámý.
