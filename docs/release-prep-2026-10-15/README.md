# Příprava vydání · 15. 10. 2026

**Pracovní kandidát. Závěrečná QA fáze probíhá, produkce beze změny.** Aktuální doložené výsledky z 15.–16. října jsou v [QA checkpointu](qa-results.md). Následující seznam zachovává plán zdrojových dávek a nepředstavuje automaticky splněné přijetí. Starší úspěch PF01 se nevydává za ověření všech pozdějších změn.

Druhá zdrojová dávka je podrobně v [checkpointu](source-batch-2.md). Následující tabulka zachovává první dávku; aktuální závěrečné výsledky budou doplněné zvlášť.

## Rozpracovaná realizace

| Oblast | Zdrojový stav | Zbývající přijetí |
|---|---|---|
| R01 | Odstraněné vymyšlené natální polohy, seedová 3D mapa a skóre shody odvozené ze jmen. Selhání oddělené od skutečného výsledku. [Detail](r01.md) | Úspěšná i chybová cesta, bez falešného výsledku, uložení a nabídky. |
| R02 | Uložené sekce i přesný e-mail/PDF, CAS claim, stabilní klíč a provider receipt. Produkční chyba generování už nevytvoří obecnou placenou mapu. [Detail a provozní omezení](r02.md) | Připravené regresní sady, návaznosti webhook/reconciliation a stav existujících DB sloupců. Staré nejasné zásilky vyžadují ruční kontrolu. |
| PF02/PF03 | Jedna obnova profilu; samostatně až 100 posledních výkladů a 100 poznámek, nezávisle na stránce a filtru historie. Rozsah uvedený v UI. | Smazaná modelová poznámka zmizí všude, staré poznámky zůstávají podkladem, změna profilu nevrátí starý stav. |
| PF04/PF05 | Filtry všech uložitelných nástrojů v jedné mapě včetně aliasů, přímé Moje poznámky, otevření poznámky a správné dokončení první reflexe. | Více než jedna stránka poznámek a jediná dnešní poznámka v jinak prázdném účtu. |
| PF06/PF09 | Šest SVG avatarů místo A–L; změna se projeví až po úspěchu a během PUT je výběr zamčený. | Odmítnuté uložení a rychlé dvě volby, souběh nastavení, reload. |
| PF07/PF10 | Redakční podnět označený pravdivě, žádná opakovanost odvozená z jedné poznámky. Poznámky v Přehledu před doplňky; statistiky dobrovolné. | Kontrola prázdného účtu, jednoho signálu a naplněného profilu. |
| PF11/PV04 | Rozlišení tarotových podtypů a vlastní otázky/úryvku v knihovně; detail zachovává otázku i u pole karet, starší JSON řetězce a strukturované výklady. Bezpečné HTML formátování. | Parita modelových uložených formátů všech skutečných nástrojů. |
| PV03 · část | Rozepsaná poznámka se uchovává v sessionStorage pro konkrétní účet. Při 401 viditelný návrat k přihlášení. Při změně účtu invalidace starého klientského stavu a odpovědí. | Vypršení session a návrat ve stejné kartě; platný reset hesla zůstává zvláštní ověření vlastníka. |
| R04 · část | Malá kalkulačka, plný klient a server sdílejí numerologický výpočet, vysvětlení je sjednocené. Prompty nepřikazují zapírání AI a nadpřirozené vědění. | Cílené engine/regresní sady a modelové výstupy; lunární okamžiky nyní sdílí zdroj USNO, viz R04; runtime přijetí čeká. |
| W01 · část | Homepage a společný header mají tlačítka dropdownů, shodné názvy a stav. Click/Enter/Space/šipka/Escape, návrat fokusu, mouse/keyboard CSS a staré anchor varianty. | Desktop/mobil, původní otevřená stránka a všechny původní cíle. Informační architektura se nepřestavovala hromadně. |
| W04/W05/W06/W07 · část | SVG v profilových výsledcích, čitelné náhledy a otázka, označený fallback ve čtyřech nástrojích i historii, přístupné chyby, respektování omezeného pohybu částic profilu. | Skutečný výsledek, chyba a klávesnice na desktopu/mobilu. Ostatní nástroje podle společného TODO. |
| W08 | Pro všech 78 karet samostatná otázka a krok, pozorovací text z existujícího kurátorovaného atlasu. Homepage a karta dne používají totožný obsah, datum Praha a původní pořadí karet. | Katalog, stejný den/reload, přechod půlnoci, návrat z registrace a export. |

## Zbývající práce před označením vydání za připravené

- Dokončit zdrojovou kontrolu navazujících částí W02–W13 a jejich konkrétních auditních bodů; nic neoznačovat za hotové podle existence třídy nebo jediného screenshotu.
- R04: připravené lunární regrese, ověření viditelného fallbacku a skutečné nové vzorky promptů. Změna modelu ani dat v produkční DB nebyla součástí této dávky.
- PF08: vazba poznámky na konkrétní výklad a její editace jsou volitelná rozšíření, nikoliv tvrzená hotová funkce. PF12: vlastní jednorázové objednávky v profilu nejsou přidané; nákup dál nevyžaduje účet.
- Po skončení zdrojových úprav sestavit používané JS/CSS bundly, cache a snapshot. Aktuální `js/dist` tuto rozpracovanou dávku zatím nereprezentuje.
- Potom jeden koordinovaný QA průchod níže; po skutečném selhání opravit příčinu a zopakovat selhanou dotčenou kontrolu. Povinné platební a přístupové kontroly se nevynechávají.

## Připravený závěrečný QA průchod

1. Cílený ESLint, kontrola diffu, kódování a existujících hooků; build JS/CSS a ověření SW assetů.
2. Frontendové regrese profilu, jeho podkladů, numerologie a denního tarotu; přiložené nové sady jsou zatím **nespuštěné**.
3. Serverové `user-readings`, numerologie/engine, auth/billing, nové `personal-map-fulfillment` a `personal-map-generation-failure`; navazující seznam mapy je v [R02](r02.md). Použít pouze mockované/neprodukční služby, žádnou skutečnou platbu ani e-mail.
4. Skutečný lokální klient nad syntetickou databází: naplněný/prázdný účet, jedna reflexe, starší poznámky, detail A/B a chyby, odmítnutý avatar, oblíbené/mazání, 401 a rozepsaný text. Desktop a 390/320 px pro změněné vzory.
5. Úspěch/chyba natálního výpočtu a shody, numerologie se shodným datem, označený fallback, denní karta na homepage i nástroji a čitelný PNG export.
6. Společná navigace, hlavní vstupy, interní odkazy a otevřená starší verze assetů. Zapsat konkrétní commit a důkaz; teprve potom předat k rozhodnutí o nasazení.

## Delegace

`gpt-5.6-sol`, medium: R01 a část W01. `gpt-6-astra`, medium: R02 a návrh jeho regresí. Další práce pomocníků skončila usage limitem; neexistující dokončení R04/W01 se nevydává za jejich výsledek. Hlavní agent převzal zdroje W01, profil, numerologii, pravdivé prompty/fallbacky a denní tarot. Žádná číselná úspora ani obchodní výkon nejsou tímto doložené.
