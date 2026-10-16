# Lokální nástroje — výsledková QA, 16. října 2026

Skutečný klient a API kandidáta na `localhost:3348`, syntetické účty a `MOCK_AI`. Modelový text není důkaz kvality živých výkladů. Žádné skutečné nákupy, odeslané e-maily ani zákaznické údaje.

## Provedené výsledkové cesty hlavního agenta

| Nástroj | Pozorovaný výsledek / rozsah |
|---|---|
| Numerologie | Modelová ukázka, 12. 5. 1990 → životní cesta 9, osud 5, duše 5, osobnost 9; cykly a modelový komentář |
| Aura | Stejné datum → bílý symbolický portrét, neměří energetické pole; reset vrátil formulář |
| Biorytmy | Tři hodnoty a skutečný graf cyklů 23/28/33; mobilní canvas 230 px ve viewportu 320 px, bez overflow |
| Čínský horoskop | 1990 → Kovový Kůň, omezení ročního přiřazení; nikoli všechny roky nebo páry |
| Průvodce | Pracovní otázka → modelová odpověď, pole vyprázdněné a prázdné odeslání zakázané |
| Koule | Konkrétní otázka → celý modelový text, nová otázka, krátký cooldown |
| Runy | Základní denní tah Gebo; hluboký výsledek v tomto průchodu nepřijatý |
| Šamanské kolo | Modelová ukázka, 12. 5. 1990 → Bobr/Východ/Země; pravdivý status náhradního výkladu |
| Minulý život | Stejné údaje, neutrální forma → symbolický fallback, přidání do oblíbených; následný detail historie ještě neověřený |
| Shoda | Model A 12. 5. 1990, Model B 21. 8. 1992 bez časů → serverový model 67 %, souhrn a modelový výklad; po opravě člen bez nabídky opětovného odemknutí |
| Tarot ano/ne | Pracovní otázka → Král pohárů, ANO, symbolický význam a krok; uložení skončilo „Uloženo v deníku“ |
| Tři karty | Tři ilustrace, pozice a modelová interpretace, bez chyby v konzoli; ne všechny rozklady |
| Astro mapa | 12. 5. 1990, 10:30, Praha → mapa, znamení, destinace a omezení přesnosti linií; mobil bez overflow |
| Lunace | Fáze, cyklus a návazný rituál se načetly; nikoliv všechny časové kombinace |
| Rituál | Výběr Býka → počáteční nálada → všech 6 kroků → závěrečná nálada → serverový deník a detail v profilu. Vynucená 401 zachovala text a retry po návratu stejného účtu uspěl |
| Slovenský a polský horoskop | Po opravě loaderů hlavička správně ukazuje člena; Býk/Byk otevřel denní, týdenní a měsíční výsledek, lokalizované období a popisky. Testovací AI text je pevně český; živá jazyková kvalita tím ověřená není |

Výsledky byly procházené při 320 px. Nativní sdílení nebylo odeslané. Nejde o všechny možné vstupy, chyby a přístupové stavy. [Další evidence](qa-results.md).

## Sedm dokončených kvízů

Každý přes všech sedm otázek, vždy první odpověď. Archetyp → Mág, barva → Indigo, intuice → Vnímání pocitů, karmické dědictví → Strážce vědění, stín → Téma vlivu, totem → Vlk, živly → Oheň. Reset archetypu znovu zobrazil první otázku. [Zachované otázky a výsledkové DOM](qa-evidence/quiz-results.json).

Neověřené všechny kombinace, remízy ani nativní sdílení. U barvy aury nalezen a opraven nadpis šesté otázky mimo vlastní krok; cílený průchod po opravě potvrdil jednu otázku na začátku, správnou šestou otázku a čistý výsledek. Zdrojový audit potvrdil 7 kroků s jedním H3 na každé stránce.

## Opravy a zbývající přijetí

- Odstraněná stálá falešná poznámka o Saturnu a nabídka odemknutí členu ve shodě; opravy znovu viděné v prohlížeči. Hostovská varianta po odstranění smyšleného rozmazaného textu ukazuje skutečný výpočet a jednu nabídku; v DOM není žádný blur ani starý overlay.
- Rozcestníky u horoskopů, run, andělských karet, minulého života, biorytmů a tarotu jsou rozbalovací; hlavní akce i výsledek zůstávají otevřené.
- Opraveny rozpory symbolických výsledků s hero/FAQ, dekorativní emoji v ovládání a falešný „online“ avatar Průvodce.
- Členské pokračování tarotu bylo po buildu prokliknuté: bez opakované ceny, stejná pracovní otázka na navazujícím tarotu. Rituál má Býka s diakritikou, číselnou škálu nálady a 100% postup při dokončení.
- Dřívější pomocník neměl browser; tento dokument nyní zachycuje skutečné scénáře hlavního agenta. Obnovení místního spojení/serveru není vada aplikace.
