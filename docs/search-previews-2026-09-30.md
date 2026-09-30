# Náhledová grafika pro stránky Mystické Hvězdy

Stav 30. 9. 2026: lokální úprava metadat a obrázků. Produkční nasazení ani výběr obrázku Googlem tím nejsou potvrzeny.

## Rozhodnutí

- Sdílecí náhledy tvoří jedna malířská vizuální rodina v rozměru 1200 × 630 px. Sedm textově čistých obrazových podkladů je v `img/search-preview/art-v2/`; přesný český, slovenský a polský text se skládá až při renderu. Jde o styl podle dříve schválených redakčních ilustrací značky.
- Základní kategorie mají 30 lokalizovaných obrázků v `img/search-preview/`. Stránky 78 tarotových karet používají vlastní ilustraci karty zasazenou do stejného malířského prostředí v `img/search-preview/tarot-cards/`.
- Úvodní část české stránky horoskopů používá obraz ze stejného zdroje bez vloženého textu (`astrology-hero.webp`), aby přechod z náhledu na stránku působil souvisle. Nadpis a popis zůstávají čitelný HTML text.
- Produktový výklad `/vztahovy-vyklad.html` dostal náhled pro přímé sdílení odkazu. Jeho stávající `noindex,follow` zůstává podle pilotu zachováno.
- `og:image` a `twitter:image` používají absolutní veřejnou URL. U kategoriálních náhledů jsou uvedeny rozměry 1200 × 630 a textový popis obrázku.

## Údržba

Po regenerování statických stránek spusť z kořene projektu:

```powershell
python scripts/render-search-previews-v2.py
python scripts/apply-search-previews.py
```

První skript vyžaduje Pillow a používá zdrojové ilustrace a písma uložená v projektu. Druhý přiřadí náhledy URL v `sitemap.xml` a také placené produktové stránce. Je opakovatelný; opětovné spuštění bez změn má upravit nula souborů. Generátory jmen, snáře, numerologie, andělských karet, znamení, slovníku, blogu a tarotových karet mají opravený výchozí `og:image`; při dalších regeneracích použij druhý skript pro doplnění zbytku metadat.

## Ověřený lokální stav

- 906 URL v sitemapě a stránka placeného výkladu: 907 zkontrolovaných HTML souborů.
- 108 použitých obrázků; všechny cíle metadat existují jako lokální soubor.
- Každá kontrolovaná stránka má právě jeden `og:image`, `twitter:image` a `twitter:card`; obrázky OG a Twitter/X souhlasí.
- Všech 108 sdílecích obrázků má 1200 × 630 px a velikost 101–208 kB. Textově čistý podklad úvodu horoskopů má 1600 × 900 px a 242 kB. Náhledy hlavních kategorií a úvod horoskopů byly lokálně prohlédnuty na desktopu i mobilu.
- Kontrola opětovným spuštěním přiřazovacího skriptu: 0 dalších změn.

Google může ve výsledcích vybrat jiný obrázek z viditelného obsahu stránky a přepsat úryvek textu. Metadatům proto nelze připisovat zaručenou podobu výsledku vyhledávání. Po nasazení má smysl ověřit několik skutečných výsledků a sdílecích náhledů; indexované staré úryvky se mohou aktualizovat se zpožděním.

## Následné vizuální doladění 30. 9. 2026

- Základní náhledy a metadata běží na produkci v commitu `d0d84330`; Railway kontrola i přímé veřejné URL prošly.
- Lokálně je připravené sjednocení výběru znamení na `horoskopy.html`: tmavé karty ve dvou řadách, textové zlaté symboly, klidnější pozadí a na mobilu vodorovný přepínač období. `tarot-laska.html` používá optimalizovaný texturovaný podklad `tarot-cloth-hero.webp` z existující ilustrace.
- Lokální prohlídka proběhla pro obě stránky na desktopu 1440 px a mobilu 390 px. Bez vodorovného přetékání; přepnutí období, výběr znamení a fokus klávesnice fungují. Toto následné doladění zatím **není nasazené**.
