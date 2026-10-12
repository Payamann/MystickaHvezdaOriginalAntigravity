# Opravy placeného vztahového výkladu — 11. 10. 2026

Navazuje na [review první objednávky](relationship-tarot-review-2026-10-11.md). Stav: **implementováno a ověřeno lokálně, bez nasazení**. Produkční databáze se pouze četla pro ověření existence unikátního Stripe session constraintu. V tomto kole nevznikla platba, objednávka, placené AI volání ani zákaznický e-mail. Původní zákaznický výklad zůstává beze změny.

## Co je opravené

### Čeština

- Nové výklady odmítají doložené chybné oslovení ve středním rodě. Přirozené třetí osoby zůstávají povolené.
- Prompt požaduje přestavbu celé věty namísto náhrady rodové koncovky. Jen při této konkrétní jazykové chybě se provede jeden opravný pokus se stejnými kartami a zadáním; další chyba se propaguje do obvyklé obnovy objednávky.
- Uložený výklad se čte a vykresluje s vypnutou novou jazykovou kontrolou. Jeho struktura a dosavadní kontrola zůstávají aktivní. Nový parser tak nesmí zablokovat opakované doručení historického textu.

### Doručení e-mailu

- U objednávky se ukládá poskytovatelovo email_id a čas přijetí odeslání. Uložené ID brání druhému odeslání, když selže jen závěrečný zápis fulfilled.
- ID nelze přepsat na jiný e-mail: kontrola ve službě a databázový trigger chrání i souběžné procesy. Nemění se obsah žádosti o odeslání ani její původní idempotency key.
- Podepsaný Resend webhook ukládá jen ID události, ID e-mailu, typ a čas. Nikdy neukládá celé tělo webhooku, příjemce, předmět nebo zákaznickou otázku. Duplicitní Svix ID je chráněné primárním klíčem.
- Callback může přijít před odpovědí na odeslání: událost se uloží a po spárování ID je automaticky viditelná. Stav se odvozuje z historie; pozdní sent/delivery_delayed nepřepíše delivered.
- Administrace rozlišuje vyřízeno/odesláno, doručeno poštovnímu serveru, zpoždění a chybu doručení. Staré objednávky bez metadat mají doručení nepotvrzené, ne smyšlený úspěch.
- Chyby placeného e-mailu vytvářejí trvalé čekající provozní upozornění. Záchranná úloha jej opakuje, když kanál není dostupný. SQL pohled nejprve spáruje události s příslušnými objednávkami a teprve potom omezuje dávku; cizí e-maily ji nezablokují.
- Rezervace upozornění je atomická v DB a expiruje po deseti minutách. Chrání současně běžící workery. Pád mezi úspěšným externím POST a potvrzením v DB může po expiraci zopakovat provozní upozornění; nejde o znovuodeslání zákaznického výkladu. Přesně jedno externí doručení nelze slibovat bez idempotence cílového kanálu.

Doručeno znamená doručeno poštovnímu serveru, nikoli zaručenou složku doručené pošty či přečtení. Kontrakt vychází z [dokumentace Resend](https://resend.com/docs/webhooks/event-types).

### Obnova objednávky

- Úloha zvýší recovered jen po potvrzeném zápisu fulfilled. Chyba DB i neexistující řádek vrací neúspěch a zůstávají evidované.
- Při úplně vynechaném Stripe webhooku se po striktním ověření produktu, objednávky, částky a měny uloží také platební doklad. Upsert s ignoreDuplicates na unikátní stripe_session_id nepřepisuje původní doklad.
- Kontrola původní ceny 149 Kč, browser proof a podepsaných platebních událostí zůstává zachovaná.

## Ověření

1. Sedm cílených serverových sad v prvním souvislém běhu: **60 testů prošlo**. Po dalších opravách byly znovu spuštěny pouze přímo zasažené sady; všechny nové případy rovněž prošly. Poslední kontroly: 24 testů doručování/recovery a 34 testů recovery/platby (tyto počty se překrývají).
2. Přibyla kontrola časného webhooku, priority stavů, ochrany soukromých dat, neuloženého provider ID, zachování historického výkladu, izolace ostatních e-mailů, souběhu upozornění, expirace rezervace, nezapsaného fulfilled a dokladu z vynechaného webhooku.
3. Cílený ESLint prošel. Diff kontrola bez chyb, pouze upozornění Git na již používané CRLF v admin.html.
4. Skutečný SQL skript prošel na izolovaném in-memory PostgreSQL přes PGlite: dvojí aplikace, časná událost, join před LIMIT, unikátní event, neměnné email_id, atomická rezervace a zamítnutí přístupu anon i authenticated. Produkční DB se tím neměnila.
5. Admin JS byl sestaven do js/dist/admin.js skutečnými IIFE parametry projektu a dostal nový cache token. Existující service-worker updater oznámil aktuální cache; tento admin bundle není důvodem změnit její jméno.

PGlite bylo instalováno bez instalačních skriptů jen v ignorované `.codex-tmp/pglite-review`, nikoli do projektových závislostí. Opakovatelné ověření:

```text
node scripts/verify-relationship-delivery-schema.mjs .codex-tmp/pglite-review/node_modules/@electric-sql/pglite/dist/index.js
```

Pomocník gpt-6-sol medium upravil jazyk a cílené testy; hlavní agent je ověřil. Pomocník pak nezávisle našel dvě krajní chyby a souběh upozornění v prvním návrhu doručovací služby. Hlavní agent je opravil a ověřil novými případy a skutečným SQL. Bez tvrzení o naměřené finanční úspoře.

## Přesný postup aktivace v produkci

Tento checkpoint připravuje nasazení; žádný následující bod nebyl v produkci proveden:

1. Oddělit tento balíček od rozpracovaného redesignu a změn členství. V pracovní kopii jsou další starší úpravy i v admin.html; necommitovat je automaticky. Splnit release kontroly podle railway-deploy-guard.
2. **Před novým serverovým kódem** aplikovat `server/scripts/sql/relationship-email-delivery.sql`. Skript je aditivní a nepřepisuje otázky, výklady ani staré statusy. Nové sloupce jsou potřeba i pro loader objednávek a administraci; špatné pořadí nasazení by je rozbilo.
3. Nasadit přesně tuto serverovou a admin změnu, ověřit konkrétní commit a health/produkt. Neprovádět skutečný nákup jako běžný smoke test.
4. Nastavit jediný Resend webhook na `https://www.mystickahvezda.cz/webhook/resend` pro `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.failed`, `email.suppressed`, `email.complained`. Použít jeho skutečný signing secret v `RESEND_WEBHOOK_SECRET` na Railway, bez výpisu či vložení do repozitáře. V tomto kole nový webhook ani secret nevznikly.
5. Ověřit provozní alert kanál. Pokud není nastavený nebo je vypnutý, upozornění zůstávají čekající v DB a doručovací stav je stále dostupný administraci; netvrdit, že obsluha automaticky dostává externí zprávy. Nenastavovat nevyžádaného příjemce.
6. Bez nové zákaznické rozesílky ověřit podpis, přijetí události, ID vazbu a administrativní stav. Pro první již doručenou objednávku lze samostatně autorizovaně doplnit známé provider ID a stav z přímého Resend důkazu. Neoznačovat ostatní staré objednávky jako delivered hromadně.

Pro uložení provozních událostí platí [ověřování webhooků Resend](https://resend.com/docs/webhooks/introduction), soukromé tabulky a invoker pohled podle [Supabase RLS dokumentace](https://supabase.com/docs/guides/database/postgres/row-level-security). Podklady jsou připravené; skutečný produkční monitoring je až dokončením uvedené aktivace.
