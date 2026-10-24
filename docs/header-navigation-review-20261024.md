# Header a navigace — 24. 10. 2026

Stav: lokálně připraveno na větvi codex/todo-production-20261024, nad produkčním fdfc70ef. Změny tohoto review zatím nejsou nasazené.

## Opravy
- Členství vede přímo na ceník. Jednorázová mapa je u astrologie; jednorázový vztahový výklad u tarotu.
- Hvězdný průvodce je v Poznání, bez zavádějícího prémiového diamantu.
- Snář, slovník a afirmace přesunuty do Poznání, minulý život mezi symbolické výklady.
- Sjednocené názvy a kapitalizace. Specializované tříkartové rozložení a Keltský kříž zůstávají dostupné z tarotového rozcestníku místo zahlcení globálního menu.
- Homepage používá obsahově totožný header jako sdílená komponenta, včetně SVG profilu a absolutních odkazů.
- Lokalizace kategorií nezávisí na jejich pořadí; nové názvy využívají existující překlady.
- Desktopová menu respektují otevření klávesnicí, Escape a kliknutí mimo header. Dlouhá menu mají omezenou výšku a posouvání.

## Ověření
- Existující navigation.spec.js a localized-shell-runtime.spec.js: 128/128 na Chromium a mobile-chrome. Běh probíhal souběžně se závěrečnou úpravou ovládání, proto následovala samostatná kontrola konečných assetů.
- Závěrečná kontrola v prohlížeči: všechna čtyři menu Enter/Escape, výška při desktopu 1365 × 650, mobil 390 × 844, bez horizontálního přetečení, přímý odkaz členství, žádné data-premium v headeru.
- Desktopový dropdown po přechodu: opacity 1, visibility visible, spodní hrana 508.7 px při výšce 650 px.
- Všechny cílové lokální stránky headeru existují, homepage a komponenta jsou totožné.
- Build JS/CSS, archivace assetů a git diff --check úspěšné.

Platební logika, přístupová oprávnění a ceny nebyly měněny. Produkce vyžaduje samostatné vydání.

## Oprava při vydání
CI 559420c4: 88 serverových sad prošlo, catalog-focus odhalil ztracený source=homepage_nav při sjednocení headeru. Parametr obnoven na homepage; příslušný test nyní očekává absolutní URL. Homepage a sdílený header se záměrně liší tímto měřicím parametrem.
