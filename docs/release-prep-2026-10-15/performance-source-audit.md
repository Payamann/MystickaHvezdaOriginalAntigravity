# W12 · Zdrojový rozpočet assetů

**Datum:** 16. 10. 2026 · **rozsah:** statický audit kandidáta `release-20261012`; pouze sedm zadaných HTML stránek a lokální CSS dosažitelné přes jejich stylesheet odkazy. Žádný browser, server, síť, deploy ani runtime měření.

## Metoda a meze

Opakovatelný read-only skript je [audit-release-asset-budget.py](../../scripts/audit-release-asset-budget.py); úplný strojově čitelný seznam cest, velikostí a výskytů je [evidence JSON](performance-source-audit-evidence.json). Skript prochází `script/src`, `link/href`, `img/source/video` asset URL a `srcset`, dále lokální CSS `url()` a `@import`. Počítá velikost souboru na disku a zvlášť lokální gzip kompresi každého souboru.

Nalezeno **104 unikátních souborů**, **315 výskytů** v HTML/CSS closure. Součet unikátních zdrojů je **6 913 155 B raw / 5 510 226 B gzip**; součet všech výskytů je **17 877 741 B raw / 15 518 230 B gzip**. Z toho **293 výskytů** je eager/default nebo CSS URL bez lazy hintu a **22** má HTML `loading="lazy"`. Výskytový součet opakovaně započítává stejný soubor napříč stránkami i vícenásobné CSS `url()`; není to součet očekávaného přenosu jedné návštěvy.

Gzip číslo je komprese lokálních bytů přes Python gzip, nikoliv velikost HTTP odpovědi. Audit nezahrnuje runtime requesty skládané JavaScriptem, vzdálené skripty/fonty, kompresi/serverní hlavičky, cache, viewportové rozhodnutí browseru ani skutečný počet stažených bajtů. Není to měření LCP, CLS, INP, CWV ani Lighthouse skóre. Evidence obsahuje jen lokální statické soubory; vzdálené CDN assety jsou záměrně mimo součet.

## Konkrétní zdrojoví kandidáti

1. **Three.js se načítá na natální stránce, přestože 3D třída není v prohledaném zdroji instancovaná.** `natalni-karta.html:812–813` bez podmínky načítá `js/dist/three.min.js` (**603 445 B raw / 149 375 B gzip**) i `natal-3d.js`. `natal-3d.js` definuje `window.Natal3D` a konstruktor používající `THREE`; `rg` v HTML a `js/` ale nenašel `new Natal3D` ani jiný call-site. HTML obsahuje prázdný `#natal-3d-container` na řádku 460. To je konkrétní silný kandidát na odstranění z počátečního načtení, ale před změnou je třeba ještě ověřit zamýšlený hook/kontrakt; audit nic neopravuje.

2. **Velký zodiac sprite se stáhne eager přes CSS, ač patří do mřížky znamení níže na stránce.** `css/pages/horoskopy.css:376` odkazuje `.zodiac-grid .zodiac-card::before` na `img/atlas/western-zodiac-v1.webp` (**701 618 B / 701 851 B lokální gzip**). Je to zdaleka největší nalezený obrázek; CSS background nemá HTML lazy-loading. Prověřit zmenšenou/optimalizovanou sprite variantu nebo jiný způsob odloženého načtení. Je použitý asset, nikoli mrtvý soubor.

3. **Atlasové ilustrace jsou velké a sdílené napříč stránkami.** Například `img/atlas/social-v1/05-kocka-u-okna.webp` je **299 938 B**, `social-v1/08-zrcadlo.webp` **255 248 B**, `tools-v1/06-lesni-kruh.webp` **191 230 B**, `tools-v1/04-runove-kameny.webp` **181 274 B** a `tools-v1/01-astrolab.webp` **157 698 B**. CSS/HTML reference jsou v evidenci. Při změně prověřit skutečné zobrazené rozměry a vytvořit vhodné varianty, nikoli plošně lazy-loadovat všechny prvky.

4. **Homepage ukázka placené mapy je 168 240 B a označená `loading="lazy"` s `fetchpriority="low"`** (`index.html:893`). Je mimo hlavní hero a její rozměry jsou uvedeny (760×1075), takže zdroj už odkládá její prioritu. Nejde o kandidáta k agresivnímu preloadu.

5. **Skutečný hero obrázek horoskopů je CSS background, ne preload.** `css/pages/horoskopy.css:8` používá `img/search-preview/astrology-hero.webp` (**248 138 B raw**) jako vrstvu hero. Současně `horoskopy.html:88` preloaduje `img/bg-cosmic-hd.webp` (**91 608 B**), sdílené dekorativní pozadí z CSS, nikoli specifický hero obrázek. Při ověřování priority porovnat tento preload se skutečným hero a mobilní CSS variantou; nejde automaticky o chybu, protože browserové priority a skutečný LCP nebyly měřeny. CSS backgroundy nemají intrinsické HTML rozměry.

Homepage hero v `index.html:291–367` obsahuje text a CTA bez vlastní `<img>` v hero. První atlasová ilustrace `01-lucerna-na-rozcesti.webp` (**295 870 B; 1200×800; `fetchpriority="high"`**) je dále v obsahu na řádku 376, ne v tomto hero. Není tedy zdrojově doložena samostatná obrazová LCP ilustrace homepage.

## Preloady, rozměry a duplicity

- Ve vybraných HTML jsou lokální preloady homepage CSS (`index.html:73`) a horoskopového `bg-cosmic-hd.webp` (`horoskopy.html:88`). Druhý je globální dekorativní background; skutečné hero je `astrology-hero.webp`. V navazujícím výkonovém měření ověřit request priority a mobilní variantu, než se preload změní.
- Všechny staticky dohledané lokální `<img>` zdroje, které skript rozpoznal, mají `width` i `height` (**0 chybějících párů**). To neprokazuje absenci layout shiftu z dynamicky vložených obrázků, CSS backgroundů či jiných elementů.
- Sdílené obrázky a fonty se mezi stránkami opakují; CSS bundle může navíc načítat společný background přes `html` i `html::before`, a proto se jejich reference v součtu násobí. JSON evidence dává počet výskytů a stránky každého assetu. Např. tarotové ilustrace opakují napříč homepage, tarot ano/ne a vztahovým výkladem. Cache hit, deduplikace a přenos při navigaci se statickou kontrolou neurčují.

**Závěr W12 baseline:** tehdejší zdrojová evidence ukazovala konkrétní kandidáty, hlavně neinstancovaný 603 KB Three.js balík a 702 KB eager CSS sprite znamení. Neprokazovala však, že jsou hlavní příčinou pomalého runtime nebo zhoršených CWV. Před/po source srovnání a aktuální omezení jsou uvedeny níže.

## Snapshot po zdrojových změnách

After snapshot byl vytvořen read-only stejným skriptem po úpravách v kandidátu; baseline JSON výše zůstal zachován. Úplné aktuální cesty a počty jsou v [performance-source-after.json](performance-source-after.json).

| Rozsah | Před | Po | Změna |
|---|---:|---:|---:|
| Unikátní lokální soubory ve statickém grafu | 104 | 102 | −2 |
| Unikátní zdrojové bajty raw | 6 913 155 B | 5 788 737 B | −1 124 418 B |
| Lokální gzip odhad unikátních souborů | 5 510 226 B | 4 840 647 B | −669 579 B |
| Výskyty HTML/CSS | 315 | 313 | −2 |
| Výskytové raw bajty | 17 877 741 B | 16 910 853 B | −966 888 B |
| Eager/default včetně CSS / HTML lazy | 293 / 22 | 291 / 22 | −2 / beze změny |

Na `natalni-karta.html` zmizely z přímo načítaných JS assetů `three.min.js` (**603 445 B raw / 149 375 B gzip**) a `natal-3d.js` (**2 364 B / 1 024 B gzip**). Dohromady to je **605 809 B raw / 150 399 B lokální gzip odhad**, snížení těchto dvou přímých zdrojů o **100 %**. Ostatní přímo načítané JS soubory stránky v obou statických výpisech zůstávají.

Horoskopový sprite mřížky znamení se změnil z `western-zodiac-v1.webp` (**701 618 B**) na `western-zodiac-v1-grid.webp` (**182 496 B**): **−519 122 B / −73,99 % raw** (zmenšenina je asi 26,0 % původní velikosti). Oba jsou WebP, takže lokální gzip není užitečný přenosový proxy: gzip estimate nového souboru je 182 574 B.

Horoskopy nyní staticky preloadují `astrology-hero.webp` (CSS background hero, **248 138 B**) místo `bg-cosmic-hd.webp`. Samotný starý cosmic asset stále figuruje ve statické CSS closure dalších stránek včetně natální stránky, protože CSS soubory obsahují obecná pravidla/varianty; proto jej statický source ledger nadále započítává. Oddělený browser `pageAssets` průchod hlavního agenta potvrdil, že natal stránka nevytvořila cosmic, Three.js ani natal-3d request a horoskopy načetly skutečný hero i nový sprite, které se také objevily v computed style. Tento browserový důkaz popisuje konkrétní asset requesty a styly, nikoli přenosové bajty, CLS, LCP, INP, CWV ani Lighthouse skóre.

Celková source delta míchá odstranění JS, výměnu obrázku a změny CSS/preloadů; jde o počty souborů v tomto kandidátu, ne o porovnání síťových waterfallů. Pořád není důkaz změny CWV ani produkční rychlosti. Pro takový závěr je nutný datovaný runtime vzorek před/po se stejným prostředím a stavy stránky.
