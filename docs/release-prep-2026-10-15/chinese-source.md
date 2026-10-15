# Čínský horoskop — zdrojová příprava W04/W10

Rozsah: pouze zdrojové soubory nástroje. Neprováděl jsem build, testy ani kontrolu v prohlížeči podle pokynů k závěrečné QA fázi.

## Změny

- `cinsky-horoskop.html`: odstraněny platformní emoji ze seznamu zvířat a tlačítka výpočtu. Seznam používá dvanáct tradičních znaků zemských větví, každý skrytý před čtečkou obrazovky; český název zvířete zůstává viditelný.
- `js/cinsky-horoskop.js`: výsledky, kompatibilita a obrázek ke sdílení používají stejnou sadu znaků v tenkém zlatém SVG medailonu. Kompatibilitní odznaky zachovávají názvy zvířat bez emoji. Texty pro rok 2026 už nepředpovídají osobní budoucnost, finance, vztahy ani zdraví; představují tradiční symboliku jako podnět k zamyšlení. Popisky kompatibility nyní označují tradiční klasifikaci a výslovně ji neprezentují jako hodnocení skutečného vztahu.
- `css/pages/cinsky-horoskop.css`: přidány lokální rozměry a barva pro SVG medailony; znakům v tlačítkách je určen font s CJK fallbackem.

## Zachováno

Výpočet znamení a živlu, roky, přístup k výsledkům, ceny, URL, datové řady a analytické události zůstaly beze změny. Nebyl upravován obsah článků ani jiné stránky.

## Před závěrečnou QA

Stránka načítá `js/dist/cinsky-horoskop.js`, který nebyl v této zdrojové fázi generován. Při finální QA je potřeba standardním projektem schváleným buildem aktualizovat dist a potom ověřit výběr zvířete, výpočet podle roku, oba výsledky kompatibility a sdílený obrázek. Je třeba vizuálně zkontrolovat vykreslení znaků na desktopu i mobilu a ověřit, že fallback font znaky pokrývá.
