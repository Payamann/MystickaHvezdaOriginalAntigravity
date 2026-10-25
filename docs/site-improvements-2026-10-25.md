# Tři opravy návštěvnických cest · 25. 10. 2026
Zadání: opravit tři priority celowebového auditu a nasadit je na produkci. Základ 0f314091, izolovaná větev codex/site-improvements-20261025.

- Členství: odstraněn pevný údajně osobní synastrický teaser a tvrzení o konkrétní kvadratuře Saturnu. Jedna primární členská výzva; související nástroje a registrační brána ukazují 199 Kč/měsíc, sedmidenní zkoušku, kartu a automatické obnovení. Homepage a ceník oddělují historii zdarma, navazující členské výklady a samostatné produkty. Přístupová práva a ceny se nemění.
- Natální karta: minimální šířky gridu a diagramu dovolují zobrazení při 360 px bez ořezaných pravých hodnot. Výpočty se nemění.
- Partnerská numerologie: dvě data v jednom místním formuláři, dvě čísla, jejich významy a podněty pro rozhovor. Používá nezměněný sdílený numerologický výpočet včetně 11/22/33. Chybné a budoucí datum se odmítne, editace odstraní zastaralý výsledek. Data se neukládají do URL, úložiště nebo analytiky.
- Existující regresní test zjistil chybějící spotřebu mh_relationship_entry_click. Cílová stránka teď jednou zpracuje anonymní vstupní klik při shodě zdroje, flow a stáří do pěti minut; navigace se nezdržuje. Nejde o potvrzený nákup.

## Ověření před vydáním
24 relevantních E2E případů má úspěšný výsledek na desktopu/mobilu (22 z kombinované sady a dva případy sdílené login gate). Poslední dva z původní sady vyžadovaly opravu zastaralé fixture: simulovanému účtu chybělo user.id a očekávaný text neodpovídal již existující větě. Produkční session guard nebyl oslaben. Samostatný původní souběžný běh numerologie ztratil server při ukončení první testovací sady; finální společný běh prošel.
14 frontend unit testů (numerology, synastry, mentor-paywall), cílený ESLint, build, kontrola paywall textů, encoding a diff whitespace prošly. Snímky desktop/mobile byly vizuálně posouzeny. Nebyla provedena skutečná platba, registrace, placená generace ani odeslán e-mail.
Asset historie a service-worker cache aktualizovány běžnými projektovými skripty.

Párový formulář implementoval gpt-5.6-sol medium v ohraničených souborech; hlavní agent provedl integraci, kontrolu diffu a skutečné E2E/visual QA. Produkční stav se doplní po deploy guardu.

Další autorizovaný úkol po dokončení vydání: Search Console – přibližně 1400 neindexovaných URL a kolem deseti důvodů. Prověřit všechny kategorie, vzorky, očekávané exclusions a skutečné opravy; neslibovat indexaci všech URL.
