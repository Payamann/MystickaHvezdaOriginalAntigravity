# Dotazy a obsahové priority — 30. 10. 2026

Zdroj: přihlášená Google Search Console, doménová služba `mystickahvezda.cz`, Web. Vlastní porovnání **29. 9.–26. 10.** proti **1.–28. 9. 2026** bylo ověřeno v dialogu i popiscích reportu. Bez filtru země či zařízení; každá stránka filtrována přesnou URL. Nejde o nové, posunuté „poslední čtyři týdny“.

[Přepsaná vybraná data](gsc-query-review-2026-10-30.json) zachovávají současnou i předchozí hodnotu. Bylo přečteno prvních deset dostupných dotazů u čtyř stránek; české ano/ne také podle předchozích kliknutí. Není to kompletní export dotazů. Tabulka dotazů nepokrývá všechny kliky ze souhrnu stránky; zejména slovenské viditelné řádky jsou velmi malý vzorek. Pozice a CTR ze souhrnných karet jsou zaokrouhlené. Nesčítáme různé způsoby agregace GSC do nového celku.

## Co ukazují data

| Stránka | Kliknutí nyní / dříve | Zobrazení nyní / dříve | Závěr pro další práci |
|---|---:|---:|---|
| Tarot na lásku | 210 / 266 | 3 673 / 6 505 | Hlavní vztahové dotazy nejsou plošně na ústupu. |
| CZ ano/ne | 122 / 158 | 3 185 / 3 998 | Smíšený vývoj dotazů; průměrná pozice mírně lepší 6,2 / 6,4. |
| SK áno/nie | 60 / 82 | 1 042 / 1 776 | CTR lepší 5,8 / 4,6 %, pozice mírně horší 6,9 / 6,5; dostupné dotazy nevysvětlují celý pokles. |
| Partnerská numerologie | 67 / 30 | 842 / 487 | Roste základní záměr, CTR i pozice; současné zaměření zachovat. |

**Láska:** „výklad karet na lásku zdarma“ roste z 43 na 52 kliknutí, „výklad karet na vztah zdarma“ z 1 na 6. Obecný dotaz „výklad karet zdarma“ na této stránce klesá z 52 na 12 a odpovídá 40 z celkových 56 ztracených kliknutí. Jeho zobrazení klesají z 2 390 na 537, CTR zůstává přibližně 2,2 % a pozice se horší z 9 na 9,9. V rozdílu příspěvků dotazů to není důkaz příčiny poklesu poptávky či změny algoritmu.

Pro stejný obecný dotaz bylo zkontrolováno rozdělení mezi URL: `/tarot.html` 9→6 kliknutí, `/tarot-zdarma.html` 0→3 a láska 52→12. V tomto výřezu není doloženo přelití ztráty na jinou naši stránku. Samotné překrytí URL se stejným dotazem nedokazuje škodlivou kanibalizaci. Titulek ani obsah lásky proto nepřepisujeme směrem k obecnému tarotu.

**CZ ano/ne:** „výklad karet ano ne“ roste 4→16 při téměř stejných zobrazeních (276→271), delší „výklad karet ano ne online zdarma“ 3→10. „tarot ano ne“ klesá 14→9 a 591→468 zobrazení. „ano ne“ 11→2. „věštba ano ne zdarma“ 12→4 při růstu zobrazení 27→44, ale jde o malá čísla, která neopravňují rozsáhlý přepis. Neměníme silné zaměření stránky ani titulek na základě jedné agregované CTR.

**SK:** dostupný „ano nie gula“ klesá 6→1 a 266→92 zobrazení. Záměr koule nelze zaměnit s tarotem; případné úpravy musí respektovat dvě existující funkce. Viditelné query řádky mají příliš málo kliknutí na úplné vysvětlení rozdílu 82→60. Není podklad k nové stránce ani k automatickému překládání dalšího obsahu.

**Numerologie:** „partnerská numerologie“ 3→11, „kompatibilita podle data narození“ 2→5, „partnerská shoda podle data narození“ 1→4 a „partnerská numerologie online zdarma“ 0→3. Stránka již obsahuje bezplatný výpočet dvou životních čísel, modelový příklad a rozlišení od astrologické shody. Dotaz podle jména má pouze 1 kliknutí; nezakládáme kvůli němu další kalkulačku ani stránku.

## Provedená konkrétní změna

Při kontrole skutečného klienta se potvrdil nesoulad českého ano/ne: `js/tarot-ano-ne.js` definuje ANO / NE / NEJASNÉ, zatímco metadata, průvodce a FAQ nabízely „ještě ne“. V `tarot-ano-ne.html` jsou nyní sjednocené skutečné názvy a vysvětlení nejednoznačného směru. Meta a OG popis také pravdivě zmiňují význam karty a podnět pro další krok. Titulek, URL, canonical, losování, nabídka i hranice zdarma se nemění.

Lokální náhled ověřil otevření průvodce, čitelný text „Nejasné“ a shodu JSON-LD s FAQ. JSON-LD je validní; canonical zůstává původní. Pro čistě textovou změnu nebyly přidány nové testy ani znovu spouštěny sady výpočtů. Tato změna opravuje přesnost očekávání, **není důkazem budoucího růstu CTR**.

Zdrojovou kontrolu čtyř stránek provedl pomocník `gpt-6-luna`; hlavní agent vyhodnotil GSC a nezávisle porovnal skutečné kategorie výsledku. Pět nabízených zakrytých karet není pět kategorií odpovědi; tento původní podnět pomocníka nebyl bez ověření přijat.

## Následující ověření

Po konkrétním nasazení sledovat shodné query/page kombinace a rozlišovat zobrazení, CTR a pozici. Neměřit vliv opravy podle historického období před nasazením. Zbývající technické úkoly a kandidáty neindexace řeší aktuální TODO; tato analýza nepřidává další objemové stránky ani neodstraňuje noindex.

Stav: analýza dokončena, jedna obsahová oprava připravena lokálně; žádné nasazení ani nové sbírání dat mimo již dostupnou GSC.
