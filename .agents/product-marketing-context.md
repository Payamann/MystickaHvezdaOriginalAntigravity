# Mystická Hvězda — společný produktový kontext

Aktualizováno 13. 9. 2026 z rozhodnutí Pavla v tomto projektu a z [dokumentace pilotu](../docs/relationship-tarot-pilot.md). Jde o pracovní kontext; novější rozhodnutí a ověřená data jej mohou změnit.

## Aktuální priorita po rešerši 13. 9. 2026

Nejbližší obchodní priorita je jeden souvislý funnel **Tarot ano/ne → placené pokračování stejné vztahové otázky za 149 Kč**. Nezakládat další produkt ani nerozšiřovat členství, dokud tento směr nezíská rozhodnutelný vzorek. Detailní podklady, tržní srovnání, 30denní plán a rozhodovací hranice jsou v [strategické rešerši](../docs/deep-research-priorita-2026-09-13.md).

Vydání 13. 9. 2026 zpřesňuje měření a přidává administrativní report. `one_time_product_cta_clicked` rozlišuje přechod z bezplatného tarotu na produkt od interního posunu z produktové stránky k formuláři. Jednu cestu propojuje krátkodobé anonymní `flow_id` bez e-mailu a otázky. Nejbližší validační milník je 10 unikátních zaplacených a doručených výkladů se skutečnou zpětnou vazbou; nejde ještě o důkaz rentability.

## Co má podnikání přinášet

Srozumitelnou službu, za kterou lidé rádi zaplatí a dostanou užitečný výsledek. Příjem má vznikat prodejem služby, bez reklam. SEO je distribuční výhoda. Další funkce, registrace a návštěvnost samy o sobě nejsou obchodním výsledkem.

Pavel nechce dál rozšiřovat web, ve kterém je všechno a návštěvník se ztratí. Výchozí volba je zjednodušit jednu existující cestu a ověřit její hodnotu. Celý web nepřepisovat ani nezakládat nový produkt jen proto, že jej umíme rychle vytvořit.

## Co víme a co teprve ověřujeme

- Search Console za 9. 6.–8. 9. 2026: 3 187 prokliků, z toho podle zapsané analýzy 1 293 na český tarot ano/ne a 285 na tarot na lásku. Proklik není unikátní návštěvník ani důkaz ochoty platit.
- Pavel uvedl přibližně 4 registrace týdně, žádný prodej dosavadní osobní mapy a poslední nákup členství přibližně dva měsíce před touto debatou. Dva placení uživatelé skončili; jeden neměl na další platbu, druhý chtěl členství zrušit. Jde o malý vzorek a sdělení provozovatele, nikoliv aktuální export plateb.
- Pracovní hypotéza: části návštěvníků s konkrétní vztahovou otázkou bude dávat větší smysl jednorázový osobní výklad než obecné členství. Ještě nemáme důkaz, že se nabídka bude prodávat nebo vydělávat.
- Návštěvník tarotu ano/ne nemusí řešit vztah. Nejprve má dostat celý slíbený bezplatný výsledek; vztahová nabídka je dobrovolné pokračování pro relevantní situaci.

## Současný pilot

[Osobní vztahový výklad](../vztahovy-vyklad.html): jedna vlastní vztahová otázka, tři karty, souvislý český výklad, jeden praktický další krok a tři otázky k zamyšlení. Celý výklad přijde e-mailem. Cena v době tohoto zápisu je **149 Kč jednorázově, bez registrace a předplatného**; při změně nabídky ověřit serverovou konfiguraci a aktualizovat kontext.

Cesta: relevantní SEO vstup → bezplatná hodnota → srozumitelná osobní nabídka → otázka a e-mail → platba → doručení → skutečná zpětná vazba. Nevkládat povinný účet nebo členství do této cesty. Stávající placené závazky jiných produktů musí zůstat funkční.

Úspěch posuzovat podle unikátních zaplacených a doručených objednávek, užitečnosti podle zákazníků a příspěvku po odečtení poplatků, generování, e-mailu, vratek a obsluhy. Rozlišovat tržby, příspěvek a celkový zisk. Metriky kroků cesty pomáhají najít místo problému, samy úspěch nedokazují.

Existující měření a jeho omezení jsou v [dokumentaci pilotu](../docs/relationship-tarot-pilot.md). Nákupní pravdu ověřovat přes objednávky a Stripe; součet analytických událostí není počet zákazníků. Při malém vzorku používat absolutní počty a zpětnou vazbu, neslibovat procentní růst ani statisticky průkazný A/B test.

## Jazyk, důvěra a vzhled

- Česky, tykání, konkrétní a klidná řeč. Přirozené formulace bez lomítek typu „šel/šla“.
- Vzhled vychází ze značky: tmavé vesmírné pozadí `#050510`, fialové světlo, zlaté akcenty, Cinzel pro nadpisy a Inter pro čtení. Přednost mají existující komponenty a vlastní ilustrace karet.
- Krátký úvod, jedna hlavní akce, čitelný výsledek, doplňující vysvětlení dostupné v rozbalovacích částech. Zachovat hodnotný SEO obsah a fungující URL.
- Prodejní text může mluvit o propojení tarotové tradice s moderní technologií. FAQ pravdivě vysvětluje automatické vytvoření podle zadání. Nevydávat produkt za ruční konzultaci člověka.
- Tarot zde slouží k zamyšlení; neslibovat jistou budoucnost, znalost pocitů partnera nebo terapeutický účinek. Netlačit na nákup strachem, žárlivostí ani opakovaným losováním „lepší“ odpovědi.
- Modelová ukázka musí být označena jako ukázka. Reference, počty zákazníků a garance vycházejí pouze ze skutečnosti.

## Pracovní stav a preference

- Pavel požaduje minimum nutných testů a úspornou práci. Rozsah ověření odvozovat od změny; neopakovat úspěšné testy bez další změny či nového problému.
- Původní vztahový pilot byl v této konverzaci nasazen a aktivován 12. 9. 2026; provozovatel potvrdil zkušební doručení. To není důkaz placené zákaznické poptávky ani čerstvá kontrola provozu.
- Pavel 13. 9. 2026 výslovně schválil nasazení navazujícího redesignu tarotu ano/ne a cesty k osobnímu výkladu pokynem „pojďme nasadit na produkci“. Dřívější zákaz je tím pro toto vydání odvolán. Dokončení se ověřuje pro konkrétní commit podle `railway-deploy-guard`; samotný souhlas ani push nejsou potvrzením běžící verze.
- Stav produkce, aktuální port náhledu a ceny při práci znovu zjistit podle potřeby; datum tohoto zápisu není živý monitoring. Neprovádět produkční kontrolu při nesouvisející úpravě dokumentace.
