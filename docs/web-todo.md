# Mystická Hvězda — aktuální seznam práce

Aktualizace: 28. 10. 2026. Tento seznam řídí navazující práci podle [celkového auditu](comprehensive-audit-2026-10-28.md). Starší designové checklisty jsou historický podklad, nikoli automaticky znovu otevřené úkoly.

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
| M02 | P1 · Čeká | Dohledat pokrytí existujícího `purchase`: návrat z platby, souhlas, jednorázové produkty vs. obnovení členství. | Popsané limity a porovnání se Stripe/objednávkami; žádné falešné nákupy z URL, nulové zkoušky nebo samotného aktivního členství. Nový serverový přenos není automaticky nutný. |
| M03 | P1 · Čeká | Opravit ztrátu nulové faktury v metadatech webhooku (`amount_paid || null`). | Číselná nula se zachová, souhrn ji odliší od neznámé částky; producentový test, bez skutečné platby a bez označení nuly za tržbu. |
| B01 | P2 · Čeká | Prověřit dvě historické neshody stavů Stripe/DB a připravit cílenou opravu synchronizace. | Aktuální stav zdroje platby se správně promítá do reportu; žádné opětovné zapnutí zrušeného předplatného nebo platby. |
| B02 | P2 · Čeká | Ukázat skutečný stav doručení Osobní mapy po návratu z platby. | Bezpečně rozlišené preparing/fulfilled/failed a cesta na podporu; ověřit modelovými objednávkami. |
| F01 | P2 · Čeká | Sjednotit bezplatnou kvótu koule se serverem. | První i další pokus ukazují skutečný nárok; přihlášený/odhlášený stav a vyčerpaný limit mají cílené ověření. |
| F02 | P2 · Čeká | Pravdivě označit náhradní obsah při výpadku AI u koule a horoskopu. | Návštěvník pozná univerzální náhradní podnět; prověřena spotřeba kvóty a zachování užitečného výsledku. |
| F03 | P2 · Čeká | Ukládat horoskop a jeho příznak historie až po potvrzení, vázané na účet. | Neúspěšný save lze zopakovat; výsledek zůstane viditelný; starý účet neoznačí historii novému. |
| F04 | P2 · Čeká na reprodukci | Cíleně prověřit změnu účtu během odpovědi horoskopu/koule. | Opožděný výsledek se nezobrazí ani neuloží jinému účtu; teprve podle výsledku určit změnu. Není to zatím potvrzená zranitelnost. |
| C01 | P2 · Čeká | Vyhodnotit propojené toky nabídka → formulář → platba → doručení a skutečnou zpětnou vazbu. | Odlišené osoby/toky/eventy, deduplikované objednávky a doložená zpětná vazba. Oslovení zákazníků se neodesílá bez konkrétního zadání. |
| S01 | P2 · Čeká | Rozpad dotazů pro tarot láska, ano/ne, slovenské vstupy a rostoucí numerologii. | Vybrané konkrétní dotazy a užitečné úpravy existujících URL; žádná domnělá kanibalizace bez důkazů. |
| S02 | P2 · Čeká | Redakčně opravit doložená ochranná/léčivá tvrzení a nevysvětlená procenta statických párových stránek. | Pravdivý viditelný text, schema a generátor souhlasí; bez plošného přepisu všeho. |
| S03 | P2 · Čeká | Rozdělit zbývající neindexované veřejné kandidáty podle hodnoty a rodin. | Oddělený záměrný archiv/parametry od užitečných stránek; zlepšený obsah a relevantní odkazy, ne odstranění všech noindex. |
| L01 | P2 · Čeká | Zobrazit skutečnou přesnost a rozpoznání místa v lokalizovaném natálu. | SK/PL/EN výsledek rozlišuje rozpoznané město a nouzový UTC; dva mock payloady. |
| L02 | P2 · Čeká | Sjednotit objevitelnost EN odkazu na české homepage. | Jazykové odkazy vedou na dostupný protějšek nebo jasně označený úvod. |
| L03 | P2 · Čeká | Dokončit jednu slovenskou cestu včetně výsledků, chyb a případné nabídky. | Konzistentní jazyk od vstupu k výsledku/podpoře; CZ zůstává hlavní. PL/EN rozšiřovat postupně podle dat. |
| V01 | P2 · Čeká | Pořídit aktuální mobilní výkonnostní baseline hlavních vstupů. | Reprodukovatelný laboratorní report; field CWV uvést jen z dostupných dat. Předchozí PageSpeed API429 nebyl výsledek měření. |

## Pravidla průběžné aktualizace

**Právě dokončený krok:** 28. 10. M01 — interní zdroj se přejmenuje pouze v GA kopii payloadu. Backend, Mixpanel a Segment dostávají původní `source`. Dva nové regresní testy před změnou skutečně selhaly na nechtěném GA `source`; po opravě prošla celá zasažená sada. Hotové nákupní ochrany se nepřepisovaly. Historické GA údaje se zpětně neopravují a aktuální změna ještě není v produkci.

- Při dokončení kroku doplnit datum, soubory/commit, rozsah ověření a lokální/produkční stav. Zelený test není automaticky dokončený produktový nebo obchodní úkol.
- Nenasazovat rozpracované úkoly společně jen proto, že jsou v tomto seznamu. Produkci ověřovat pro přesný commit podle deploy guardu.
- Historická data GA se tímto seznamem ani budoucí opravou nezmění. Úspěch nové atribuce vyžaduje nová data; příjmy se nadále ověřují přes Stripe a objednávky.
- Seznam není pokyn ke změně cen, plateb, souhlasů, přístupů nebo k rozesílání zpráv zákazníkům. Takové kroky musí mít vlastní konkrétní rozsah.
