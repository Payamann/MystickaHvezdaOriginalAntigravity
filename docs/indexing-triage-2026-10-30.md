# Indexace — rozdělení kandidátů 30. 10. 2026

## Aktuální důkazy a jejich stáří

Google Search Console v souhrnu stále uvádí aktualizaci **23. 10. 2026**. Dnes byly přes její UI staženy kompletní dostupné CSV exporty kategorií Procházeno (196 URL) a Objeveno (487 URL). ZIPy, původní řádky a strojová triáž jsou v `docs/indexing-2026-10-30/`. Jde o nejnovější dostupný export tohoto reportu, nikoli o okamžitý stav každé URL.

Přímá URL inspekce poskytla novější rozhodnutí:

- **FAQ je na Googlu.** Úspěšné procházení 25. 10. v 15:14:11, smartphone Googlebot, procházení i indexování povoleny. Google přijal self-canonical. V inspekci je u sitemap uvedena dočasná chyba zpracování; tato zpráva současně neznamená, že FAQ není indexovaná.
- **Soud je na Googlu.** Úspěšné procházení 24. 10. v 14:39:59, procházení i indexování povoleny, přijatý self-canonical. Nalezen přes hlavní sitemapu a hub významů tarotových karet. Stejná URL ještě figuruje v exportu vyloučených příkladů — tyto dvě informace se nesmějí zaměnit.
- Obě veřejné stránky dnes vracejí HTTP 200, mají H1 a správný canonical. Jediný timeout v historickém exportu (`partnerska-shoda/leo-aries.html`) dnes rovněž vrací 200, self-canonical a `index, follow`.

Podrobnosti: [HTTP a URL inspekce](indexing-live-samples-2026-10-30.json). Nebyla podána další žádost o indexaci ani spuštěno plošné ověřování oprav. Ze dvou indexovaných vzorků nevyvozujeme zlepšení všech URL ani příčinný vliv předchozích žádostí.

## Rozdělení nyní dostupného exportu

683 řádků = **468 datovaných horoskopů + 215 nedatovaných URL**. Data v cestách horoskopů sahají od 6. 5. do 21. 10. 2026. Jejich způsobilost závisí na aktuálně povoleném období a validní veřejné cache; neodvozujeme z pouhého data, že se všechny mají indexovat nebo že jsou všechny záměrně vyloučené. Existující oprava horoskopové sitemapy tyto podmínky již respektuje.

| Rodina nedatovaných URL | Počet |
|---|---:|
| Jména | 55 |
| Partnerské dvojice | 41 |
| Blog | 38 |
| Snář | 30 |
| Významy tarotových karet | 11 |
| Stránky znamení v `/horoskop/` | 10 |
| Samostatné stránky a parametrická varianta nástroje | 10 |
| Andělské karty | 8 |
| Slovník — jednotlivá hesla | 6 |
| Testy | 5 |
| Slovenský úvod | 1 |
| **Celkem** | **215** |

Pět adres je varianta jiného preferovaného URL podle místního canonical nebo dřívějšího ověřeného přesměrování: `/sk/index.html`, parametrická stránka tarotu, non-www heslo lucidního snu, parametrický blog o synastrii a stará adresa ochrany soukromí. Tyto adresy nepotřebují vlastní indexaci; hodnotí se jejich kanonický protějšek. Tato triáž není novým HTTP ověřením všech pěti přesměrování.

## Interní odkazy a rozhodnutí

Historický soubor z 25. 10. obsahoval 238 nedatovaných URL, z toho 237 tehdejších HTTP 200 a jeden timeout. Jeho rozdělení i odkazy jsou zachovány v [historické triáži](indexing-candidate-families-2026-10-30.json). Při kontrole skutečných HTML anchorů přes 916 stránek inventury má každý z těchto 238 cílů nejméně jeden odkaz z jiné stránky. Pro 207 z nynějších 215 řádků je tento výsledek přímo mapovatelný. U osmi nových/nepárovaných cest nebyl počet převzat; `null` není nula. Graf zahrnuje zdrojové HTML, nikoli všechny runtime odkazy a není potvrzením jejich procházení Googlem.

V ověřeném rozsahu tedy není důkaz plošně osiřelých stránek ani nového robots/canonical bloku. Nepřidáváme mechanicky další seznamy odkazů a neodstraňujeme noindex, ochranu účtů nebo funkční přesměrování.

Další obsahovou kontrolu má smysl začít **významy tarotových karet**: je to ohraničená rodina s návazností na existující bezplatný výsledek a dohledatelným hubem. Soud se z aktuálních problémů vyřazuje; u ostatních je nejprve potřeba ověřit aktuální URL rozhodnutí. U párových stránek už lokální větev obsahuje odstranění nepodložených procent; neopakovat stejnou práci jako nový SEO zásah. Jména a snář posuzovat podle užitku konkrétní odpovědi, nikoli jen podle počtu slov. Blog přednostně vybírat podle existujících dotazů a přirozené návaznosti na nástroj.

## Stav a ověření

Dokončena triáž obou dostupných kategorií a ověření vybraných živých URL. V tomto kroku nevznikla změna webového kódu, produkce ani placená generace. Obsahová revize všech kandidátů a jejich úplná aktuální URL inspekce nejsou hotové. JSON/CSV počty byly ověřeny součty a exporty zachovány pro kontrolu.

Pomocník Luna byl zadán pro nezávislou klasifikaci, ale skončil na limitu bez výstupu. Triáž i ověření dokončil hlavní agent; žádné nevrácené tvrzení pomocníka není použité jako důkaz.
