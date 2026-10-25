# SEO růst — numerologie a partnerské shody, 25. 10. 2026

## Výchozí stav a důkaz
Práce navazuje na Pavlem zadané celowebové SEO a pokračování po revizi skillů. Izolovaný worktree .tmp/seo-growth-20261025, základ aktuální produkce ed1c5ff5bab2df7d29af4ba339d2c312971d442a. Rozpracovaná hlavní kopie ani lokální úpravy pracovních nástrojů nejsou součástí tohoto vydání.

Živá GSC: 26. 9.–23. 10. 2026 proti 29. 8.–25. 9., Web, přesná URL, bez filtru země/zařízení. Hranice ověřeny v dialogu; chybná osa Invalid Date/1970 se nepoužila. Podklady jsou uložené v hlavní pracovní kopii docs/seo-growth-2026-10-25, nikoli v tomto commitu.

Partnerská numerologie: 71 vs 21 prokliků, 866 vs 385 zobrazení, CTR 8,2 vs 5,5 %, pozice 7,4 vs 8,7. Dotazy: partnerská numerologie 12/2 kliků a 86/36 zobrazení; kompatibilita podle data narození 6/1 a 57/7; partnerská numerologie podle data narození 5/4 a 133/73; partnerská shoda podle data narození 4/1 a 17/7. Čtených prvních 10 z 29 dotazů není úplný rozklad celkového výkonu.

Kandidáti shody z celowebového přehledu: Střelec–Štír 13/5 prokliků a 310/232 zobrazení; Lev–Lev 10/2 a 252/138; Kozoroh–Býk 9/0 a 428/30. Štír–Lev ověřen i přes přesnou URL: 9/8 a 654/667, pozice 8,1/8,3, CTR 1,4/1,2 %. Jeho dotazy se týkají vztahu a obou pořadí názvů. Nízké CTR nebylo vydáváno za důkaz vadného titulku; metadata se nepřepisovala.

## Co se mění

- **partnerska-numerologie.html:** zachován právě nasazený párový formulář, matematika a úspěšný title. Doplněn rozdíl mezi numerologickým součtem a astrologickou shodou s konkrétním odkazem. V modelové dvojici 11/4 nové kontextové odkazy na existující významy obou čísel.
- **12 stránek životních čísel:** ve skutečné sekci Vztahy přirozený odkaz na bezplatný párový výpočet. Odkaz na rozšířený numerologický rozbor nyní říká, že jde o členství. Zdroj upraven v generate-numerologie-pages.mjs, nikoli jen ve vygenerovaných souborech; ostatní obsah zachován.
- **Čtyři konkrétní dvojice:** sagittarius-scorpio, leo-leo, scorpio-leo, capricorn-taurus. Nahrazeny kategorické soudy o lidech samostatnými symbolickými tématy, modelovými každodenními situacemi a otázkami k rozhovoru. Odstraněna nepodložená statická procenta a měřič, ne osobní výpočet synastrie. Nové popisy v hero jsou konkrétní podle dvojice. Hlavní témata mají H2; CTA, pair parametr, canonical, title a sibling odkazy zachované. Zpřesněné tipy nevyžadují luxus ani nepřiřazují lidem podle znamení preference. FAQ JSON-LD srovnáno s novým obsahem.
- **Sitemap:** zachováno 907 URL. lastmod zohledňuje změněné stránky a také dorovnává 4 starší záznamy homepage/natál/shoda/ceník na skutečnou změnu v předchozím dnešním vydání 6c410ce8. Nejde o plošné přepsání dat. Nepřibyla žádná nová URL ani produkt.

Výpočty, losování, ceny, oprávnění, platby, doručení a analytická smlouva se nemění. JS/CSS precache vstupy nejsou změněné, nebyl potřeba build assetů ani změna service-worker hashe.

## Ověření

- Generátor numerologie přegeneroval pouze 12 očekávaných detailů; kalkulačkový hub beze změny. Následné --check prošlo bez driftu.
- Sitemap --check 907 URL prošel; audit struktury webu prošel (odkazy, canonical, JSON-LD, meta obrázky, consent a kritické assety). ESLint změněného generátoru a diff --check prošly. Nové testy pouze opisující text se nepřidávaly.
- Oddělená kontrola čtyř HTML porovnala proti základně title, popis, H1, canonical a href včetně pair parametrů; zachované. JSON-LD parsovatelné; odstraněná čísla nejsou ani v jeho FAQ odpovědích. Nejde o nový výsledek Rich Results Testu ani garanci rich result.
- Skutečný lokální prohlížeč: cesta párový model → význam 11 a nový přechod k astrologickému nástroji. Mobil 390×844: všechny 4 dvojice bez vodorovného přetékání (obsah 382 px); vysvětlení numerologických metod čitelné. Desktop a mobilní náhledy v přiložené složce. Backend a skutečné nákupy pro tyto obsahové změny nebyly volány.
- Jeden pomocník gpt-6-luna medium provedl nezávislou kontrolu čtyř párů a jejich cílený přepis, hlavní agent ověřil diff, JSON-LD a prohlížeč. První verze ponechávala staré tipy a FAQ; byly opraveny v druhém průchodu. Žádná tvrzená úspora nákladů.

Nasazení této dávky zatím čeká na release kontrolu. Lokální náhled ani technický test není důkaz růstu prokliků či objednávek.

## Následné vyhodnocení
Po novém crawlu porovnat stejné URL a filtry v úplných obdobích, sledovat prokliky/zobrazení a odpovídající použití nástrojů. Historický růst není připsán dnešnímu vydání. Neopakovat hromadně indexační žádosti. Další kandidáti z kontrolovaných podkladů jsou starší články o mistrovských číslech a vztahu Štír–Panna; před jejich revizí je třeba sladit skutečný CMS zdroj a cílený renderer, ne přegenerovat celý blog s náhodnými related odkazy. Zbylých 140 párových stránek se v této dávce obsahově neupravuje.
