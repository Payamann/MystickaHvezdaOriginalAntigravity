# Mystická Hvězda — aktuální seznam práce

Aktualizace: 30. 10. 2026. Tento seznam řídí navazující práci podle [celkového auditu](comprehensive-audit-2026-10-28.md). Starší designové checklisty jsou historický podklad, nikoli automaticky znovu otevřené úkoly.

**Stavy:** Hotovo na produkci = ověřené vydání; Hotovo = dokončený výstup/analýza; Rozpracováno = ještě zbývá uvedená práce; Připraveno lokálně = implementace a cílené kontroly prošly, ale produkce není potvrzená; Čeká = nezačaté nebo závislé na předchozím kroku. Technická kontrola není doklad růstu nebo rentability.

## Hotové a ověřené

| ID | Stav | Výsledek | Důkaz |
|---|---|---|---|
| D01 | Hotovo na produkci | Osobní mapa: správná durable objednávka, ověření platby a vazby Stripe, obnova a idempotence doručení. | `df4e31ad`, [checkpoint](personal-map-webhook-fix-2026-10-27.md) |
| D02 | Hotovo na produkci | Průvodce a numerologie: izolace výsledků při změně účtu, ochrana opožděných odpovědí a ukládání. | `0f1e4d7c`, [checkpoint](account-result-isolation-2026-10-28.md) |
| D03 | Hotovo na produkci | Partnerská shoda nevyrábí náhradní procenta při chybě; zachová vstupy, umožní retry a vymaže staré sdílení. | `8b4ba212`, [checkpoint](synastry-calculation-errors-2026-10-28.md) |
| D04 | Hotovo na produkci | OpenAI a 22 SK/PL/EN vstupů; canonical/hreflang a hlavní sitemap. Nejde o překlad celé aplikace. | `c5925dae`, [vydání](locales-openai-deploy-2026-10-27.md) |
| D05 | Hotovo na produkci | Horoskopová sitemap nabízí způsobilé veřejné stránky; GSC přijalo sitemap. Neznamená indexaci každé URL. | [Audit indexace a dokončení](indexing-audit-2026-10-25.md) |
| D06 | Hotovo | Aktuální celkový audit a výchozí metriky GSC/GA/Stripe/objednávek, 916 zdrojových stránek a mobilní vzorky. | [Report](comprehensive-audit-2026-10-28.md), [data](comprehensive-audit-2026-10-28/metrics.json) |
| D07 | Hotovo — ověření zdroje | Nákupní událost už existuje: ověřená platba, skutečná částka, stabilní ID, vyloučení nulové zkoušky a souhlas. Další práci neurčuje pouhý historický rozdíl GA/Stripe. | `js/analytics.js`, návratové stránky produktů; zbývající pokrytí viz M02/M03 |

## Nejbližší práce v pořadí

| ID | Priorita / stav | Úkol | Kdy je hotovo |
|---|---|---|---|
| M01 | P1 · Připraveno lokálně | Oddělit interní `source` od akvizice v adaptéru GA. | Zdroj a veřejný bundle opraveny, 8 cílených testů + lint prošly; souhlas, fronta a nákupní ochrany zachovány. Zbývá produkční vydání a ověření nových GA dat. [Checkpoint](analytics-source-fix-2026-10-28.md) |
| M02 | P1 · Hotovo — analýza pokrytí | Dohledat pokrytí existujícího `purchase`: návrat z platby, souhlas, jednorázové produkty vs. obnovení členství. | Zdrojové pokrytí všech tří produktů, souhlasu, návratu, ID a obnov zdokumentováno. Živá shoda GA/Stripe ještě není ověřena; další kroky v purchase-measurement-coverage-2026-10-30.md. |
| M03 | P1 · Připraveno lokálně | Opravit ztrátu nulové faktury v metadatech webhooku (`amount_paid || null`). | Webhook zachovává nulu i v události obnovené platby. Podepsaný test prošel pro 0 / 19900 / chybějící částku; 16 testů plateb a souhrnu + lint. Bez skutečné platby; nula není tržba. |
| B01 | P2 · Čeká | Prověřit dvě historické neshody stavů Stripe/DB a připravit cílenou opravu synchronizace. | Aktuální stav zdroje platby se správně promítá do reportu; žádné opětovné zapnutí zrušeného předplatného nebo platby. |
| B02 | P2 · Připraveno lokálně | Ukázat skutečný stav doručení Osobní mapy po návratu z platby. | Po ověření platby a browser proof se ověří vazba objednávky/session/produktu. Zobrazen preparing/fulfilled/failed/unknown, podpora a obnova bez další purchase události; 25 serverových + 8 klientských testů. |
| F01 | P2 · Připraveno lokálně | Sjednotit bezplatnou kvótu koule se serverem. | Odstraněn neověřený zůstatek 3 a klientská blokace; dostupnost rozhoduje server. Regrese ověřuje registraci místo placeného checkoutu i při starém čítači. |
| F02 | P2 · Připraveno lokálně | Pravdivě označit náhradní obsah při výpadku AI u koule a horoskopu. | Náhradní odpověď označena ve 4 jazycích a historii. Koule při fallbacku vrací rezervaci účtu a nespotřebuje anonymní ukázku; běžný limit i ochrana při selhání DB ověřeny (24 + 1 testů). |
| F03 | P2 · Připraveno lokálně | Ukládat horoskop a jeho příznak historie až po potvrzení, vázané na účet. | Marker se zapisuje až po ID uložení a obsahuje účet. Selhání lze zopakovat; 19 cílených testů horoskopu + lint. |
| F04 | P2 · Připraveno lokálně | Cíleně prověřit změnu účtu během odpovědi horoskopu/koule. | Horoskop i koule chrání vlastníka a revizi požadavku včetně A→B→A; regrese pokrývají generování, historii, psaní odpovědi i odložené akce. Bez tvrzení o doloženém incidentu v produkci. |
| C01 | P2 · Čeká | Vyhodnotit propojené toky nabídka → formulář → platba → doručení a skutečnou zpětnou vazbu. | Odlišené osoby/toky/eventy, deduplikované objednávky a doložená zpětná vazba. Oslovení zákazníků se neodesílá bez konkrétního zadání. |
| S01 | P2 · Hotovo — analýza; oprava lokálně | Rozpad dotazů pro tarot láska, ano/ne, slovenské vstupy a rostoucí numerologii. | Přesné GSC porovnání čtyř URL a vybraných dotazů v gsc-query-review-2026-10-30.md/.json. Zachováno rostoucí zaměření numerologie a vztahové dotazy; opraven nesoulad ještě ne / NEJASNÉ v českém ano/ne. |
| S02 | P2 · Připraveno lokálně | Redakčně opravit doložená ochranná/léčivá tvrzení a nevysvětlená procenta statických párových stránek. | Opraveny dva FAQ texty i JSON-LD; z párových stránek odstraněna nepodložená procenta, zachován obsah a URL. 144 stránek prošlo kontrolou JSON-LD/canonical/H1 a idempotence skriptu. Desktopový i mobilní náhled nyní ověřen; mobil 390 px bez přetékání. Odkaz vede do formuláře se zachovaným kontextem dvojice. |
| S03 | P2 · Čeká | Rozdělit zbývající neindexované veřejné kandidáty podle hodnoty a rodin. | Oddělený záměrný archiv/parametry od užitečných stránek; zlepšený obsah a relevantní odkazy, ne odstranění všech noindex. |
| L01 | P2 · Připraveno lokálně | Zobrazit skutečnou přesnost a rozpoznání místa v lokalizovaném natálu. | SK/PL/EN vysvětlují skutečný stupeň přesnosti a nepřítomný ascendent. 12 scénářů + anglická regrese; výpočty beze změny. |
| L02 | P2 · Připraveno lokálně | Sjednotit objevitelnost EN odkazu na české homepage. | Česká homepage nově odkazuje i na /en/. Existující EN úvod má lang=en a odpovídající canonical/hreflang; bez přesměrování do českého nástroje. |
| L03 | P2 · Čeká | Dokončit jednu slovenskou cestu včetně výsledků, chyb a případné nabídky. | Konzistentní jazyk od vstupu k výsledku/podpoře; CZ zůstává hlavní. PL/EN rozšiřovat postupně podle dat. |
| V01 | P2 · Čeká | Pořídit aktuální mobilní výkonnostní baseline hlavních vstupů. | Reprodukovatelný laboratorní report; field CWV uvést jen z dostupných dat. Předchozí PageSpeed API429 nebyl výsledek měření. |

## Pravidla průběžné aktualizace

**Právě dokončený krok:** 30. 10. S01 — analyzovány skutečné dotazy čtyř vstupů za shodná období; jedna doložená oprava názvu výsledku v metadatech, průvodci a FAQ. [Podklad a rozhodnutí](gsc-query-review-2026-10-30.md). Změna je lokální; produkce ani růst nejsou potvrzené.

- Při dokončení kroku doplnit datum, soubory/commit, rozsah ověření a lokální/produkční stav. Zelený test není automaticky dokončený produktový nebo obchodní úkol.
- Nenasazovat rozpracované úkoly společně jen proto, že jsou v tomto seznamu. Produkci ověřovat pro přesný commit podle deploy guardu.
- Historická data GA se tímto seznamem ani budoucí opravou nezmění. Úspěch nové atribuce vyžaduje nová data; příjmy se nadále ověřují přes Stripe a objednávky.
- Seznam není pokyn ke změně cen, plateb, souhlasů, přístupů nebo k rozesílání zpráv zákazníkům. Takové kroky musí mít vlastní konkrétní rozsah.
