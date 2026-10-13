# Výchozí stav organického růstu · 13. 10. 2026

Implementace je založena na izolovaném checkoutu `.codex-tmp/release-20261012`, výchozí SHA `12ba756f6b22db07c01ec35e44bb83a8dd55b80d`. Lokální obsah není nasazení.

## Nový datový podklad

Přihlášená GSC, Web, bez filtru země/zařízení. Dialog potvrzuje **14. 9.–11. 10. 2026 vs. 17. 8.–13. 9. 2026**. CSV export stažen 13. 10., uložen v ignorovaném `tmp/organic-growth-20261013/gsc-monthly/`. [Agregátní report](gsc-monthly.md) vytvořil skutečný `scripts/analyze-gsc-search-performance.mjs`.

Souhrn z disjunktních řádků Zařízení: **1 462 vs. 1 001 prokliků; 51 719 vs. 35 308 zobrazení; CTR 2,83 vs. 2,84 %; vážená pozice 7,57 vs. 8,73**. Mobil 1 242 vs. 867 prokliků, Česko 1 227 vs. 725. Prokliky nejsou osoby ani nákupy. Export neobsahuje denní tabulku; nedává úplný důkaz o příčině poklesu.

| URL | Účel | Prokliky nyní/předtím; zobrazení nyní/předtím | Doložená obsahová mezera → akce |
|---|---|---|---|
| /tarot-laska.html | Vztahová otázka, bezplatný vstup | 293/144; 6705/3336 | Konkrétní karty v textu nemají vlastní odkaz; příklad lze převést do běžné situace → odkazy na Milence/Dvojku a krátké modelové situace ve stávajících sekcích |
| /tarot-vyznam/milenci.html | Rychlý katalog významu jedné karty | 1/1; 118/31 | Obecné šablonové love/work/action → vlastní stručný text a modelová ukázka přes zdroj generátoru |
| /blog/karta-milenci-tarot-vyznam.html | Praktické čtení symbolu a kombinací | 0/0; 84/57 | Sliby o budoucnosti, tlak na rozhodnutí a nejasná nabídka členství → konkrétní průvodce přitažlivostí/volbou, modelová situace, pravdivá návaznost na free/149 Kč |
| /tarot-vyznam/dvojka-poharu.html | Vzájemnost a iniciativa | 0/1; 46/18 | Generic text/„spojení duší“, bez praktické ukázky → pozorovatelné jednání, dohoda bez testování partnera |
| /blog/vyklad-tarotu-pro-zacatecniky.html | První otázka a práce s výkladem | 0/0; 2/0 | „Co musím v sobě změnit, aby vztah…“ přesouvá odpovědnost na jednoho → upravit pouze příklad otázky a krátkou návaznost |
| /tarot-karta-dne.html | Denní bezplatný výsledek a návrat | 151/97; 3767/2928 | Inline odběr je už připraven; ověřit jeho skutečné načasování po výsledku, chybu/success |

Katalog Milenců a blog mají odlišné role, překryv tématu není prokázaná kanibalizace. Malé počty detailů neprokazují obchodní efekt jejich změny. Prioritu podporuje rostoucí vztahový vstup a konkrétní čtenářské problémy v obsahu.

ANO/NE: 166/200 prokliků, 4464/5307 zobrazení; podrobnosti v [diagnostice](ano-ne-diagnosis.md). Měsíční součty dotazů nenahrazují souhrn služby. Historická objednávka z 11. 10. nemá prokázaný Google origin; tento krok nezískával nová zákaznická data.
