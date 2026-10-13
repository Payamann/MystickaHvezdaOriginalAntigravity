# Obsahová dávka · 13. 10. 2026

Stav: upraveno a ověřeno lokálně. Produkční základna pro izolovaný návrh `12ba756f6b22db07c01ec35e44bb83a8dd55b80d`. Stejné věcné změny jsou přeneseny do hlavního workspace po jednotlivých patchích; stávající rozpracované vizuální třídy zůstaly zachované.

## Co se změnilo

- **Tarot na lásku:** ve dvou existujících sekcích přibyly konkrétní modelové situace a přímé odkazy na význam Milenců a Dvojky pohárů. Celý bezplatný vstup a současná nabídka 149 Kč zůstaly zachované. Nové duplicitní sekce nevznikly.
- **Katalog Milenců:** přitažlivost, hodnoty a dohoda; vlastní text pro lásku, práci, ano/ne, obrácenou polohu, modelovou ukázku a praktický krok. Odlišný od delšího blogového článku. Odkaz na praktický průvodce.
- **Blog Milenci:** odstraněny sliby budoucího setkání, osudového partnerství a nátlak na rychlé rozhodnutí; nový průvodce obrazem na vlastní kartě, třemi rovinami vztahu, modelovým rozhovorem a kombinacemi jako tématy. Pravdivá návaznost na bezplatný vstup a automatický jednorázový výklad 149 Kč. Zachováno původní datum publikace, přidáno datum skutečné revize.
- **Dvojka pohárů:** vzájemná iniciativa, konkrétní dohoda bez počítání zpráv a bez testování partnera. Odstraněn neurčitý katalogový příslib „hlubokého spojení dvou duší“. Modelová ukázka je výslovně označená.
- **Začátečnický článek:** upraven pouze příklad vztahové otázky a návazný odstavec. Odpovědnost za společný vztah není přenášená na jednoho člověka.
- **Katalogový hub:** stručná shrnutí těchto dvou karet jsou sladěná s detaily. Filtrovací JS zachovává statický redakční text při překreslení místo návratu k původnímu engine textu. Nevznikl další request ani nová datová služba.

## Zdroj pravdy a regenerování

Obsah dvou karet je v `data/tarot-card-seo-overrides.json`, včetně `hubSummary`, `dateModified` a volitelného bezpečného odkazu na blog (`guidePath`, pouze `/blog/[slug].html`). `data/tarot-cards.json` nebyl změněn; losování a generované výklady nepřebírají nové SEO texty.

První regenerování odhalilo drift šablony: z 78 detailů by zmizely OG rozměry a twitter alt a jejich core script by se vrátil ke starému query v=1. Generátor nyní reprodukuje existující metadata a platnou verzi core scriptu. Po opravě je skutečný obsahový diff pouze na dvou detailech a hubu. Opakované generování hlásí **78 detailů, changed 0**; žádná karta nebyla smazána.

Cíleně sestaveny jen dva runtime soubory: `js/dist/tarot-meaning-hub.js` a `js/dist/tarot-karta-dne.js`, podle existujícího classic build nastavení (`minify`, `bundle:false`, `format:iife`, `platform:browser`). Lastmod v sitemapě je upraven jen u sedmi skutečně změněných stránek, původní URL set zůstává zachovaný. Podrobnosti k druhému jsou v [návratové cestě](return-path-check.md).

## Nezávislá kontrola

- HTML parser ověřil sedm zasažených veřejných stránek: všude jeden H1, canonical shodná se základnou a parsovatelný JSON-LD. **418 lokálních odkazů/obrázků** existuje v izolovaném checkoutu. Není to HTTP kontrola celého webu ani přesměrování všech variant.
- Mobil 390 × 844: pět obsahových stránek prohlédnuto, scrollWidth 382 při šířce 390, žádný v tu chvíli načtený rozbitý obrázek. Desktop 1280 × 900: zasažené části love, dvou katalogových detailů a blogu prohlédnuty, scrollWidth 1272; bez horizontálního přetékání.
- Existující E2E `seo-entry-clarity`: bezplatný první krok love landing **1 PASS**. Existující `tarot.spec`: načtení 78 karet a filtrování **1 PASS**. Návratový odběr desktop/mobil **2 PASS**, včetně API chyby a dalšího úspěchu; žádný skutečný odběr nebo email.
- Social QA: přesně tři drafty **QA PASS**. Reprodukované falešné chyby původního URL regexu opraveny pro vnořené skutečné cesty, explicitně přidány tři ověřené tarotové obsahové URL. Existující test ověřuje známou vnořenou URL i blokování neexistující cesty. **2 cílené Python testy PASS** v hlavním workspace i kandidátovi. Neznámé interní URL se dál odmítají.
- `node --check` relevantních zdrojů a `git diff --check` prošly. Service-worker kandidáta aktualizován na `mysticka-hvezda-3cd3bc00d7b3`. Z archivu **813 předchozích assetů zachováno beze změny + 4 nové verze**. První kontrolní čtení archivu narazilo na buffer limit; po navýšení pouze read bufferu kontrola prošla.

Obrázky jsou existující vlastní ilustrace. Nové generování nebylo potřebné. Náhled tří draftů je v [overview.html](overview.html); stav je draft a aktuální schválený týdenní plán nebyl měněn. Meta guide byl v rešerši za login/blokací, takže aktuální Meta náhled před samotným publikováním zůstává samostatná kontrola.

Vyhodnocení růstu čeká na nasazení, nový crawl a skutečné návštěvy. [Google doporučuje hodnotný obsah pro čtenáře](https://developers.google.com/search/docs/fundamentals/creating-helpful-content); tato technická kontrola nedokazuje růst ani nové objednávky.
