# GA: oddělení interního zdroje — 28. 10. 2026

Výchozí produkční stav: 8b4ba212. První ohraničený krok po schválení TODO z celkového auditu.

## Změna

`js/analytics.js` vytváří pro gtag samostatnou kopii payloadu bez interního `source`; hodnota je dostupná jako `interaction_source`. Výslovně dodané interaction_source se nepřepíše. Externí akvizici si GA dále odvozuje vlastními pravidly z kampaně/referreru. Vlastní first/last attribution metadata ani uložené backendové smlouvy se nemění. Mixpanel a Segment zachovávají původní payload.

Souhlas, pre-consent fronta, ochrana proti duplicitnímu dispatchi a nákupní podmínky nejsou měněné. Nenastavuje se campaign_source, nemažou se uživatelské cookies a neopravují se historické řádky GA. Oprava zdroje sama neřeší pokrytí obnov předplatného v GA.

## Ověření

Před změnou nové testy reprodukovaly dvě selhání: gtag dostával `tarot_yes_no_result` a `tarot_yes_no_card_pick` v parametru source. Po změně prošlo všech 8 cílených testů tests/frontend/analytics.test.js, včetně souhlasu/replay/rejection, nezměněného backendu a dalších providerů, chybějícího source, ověřeného purchase, jeho deduplikace a odmítnutí falešné nebo nulové tržby. Při přípravě pre-consent fixture byl doplněn správný počet přijatých událostí; produkční ochrana částečně přijaté fronty zůstala zachována.

Cílený ESLint a diff check prošly. Sestaven pouze analytics bundle se stejnými esbuild parametry jako projektový build, následně aktualizována SW cache a historie veřejných assetů. Nový veřejný skript je připravený lokálně; skutečný sběr/DebugView GA ani zlepšení atribuce v nových produkčních datech zatím není ověřené. Žádný skutečný nákup, placená AI nebo zákaznický e-mail.

## Navazující rozlišení nákupního měření

Nezávislá read-only kontrola Astrou našla existující kanonický purchase: analytics.js vyžaduje ověřenou platbu, částku >0 a stabilní transaction ID; vztahový výklad, PDF mapa a členská návratová stránka už tuto smlouvu používají. Implementace v repozitáři předchází auditovanému období. Nulový GA report proto sám nedokazuje chybějící kód nebo rozbitý checkout; sběr závisí na návratu prohlížeče a souhlasu. Obnovy mají backendové invoice receipts, nikoli nalezený GA producer. Nepřidával se druhý purchase ani automatický serverový přenos.

Samostatně potvrzený další úkol M03: server/payment.js používá u amount_paid výraz `|| null`, který ztratí číselnou nulu, zatímco revenue-summary umí nulovou fakturu odlišit. Oprava vyžaduje cílený producentový test a nepatří do tohoto frontendového diffu.

## Stav

Připraveno lokálně. Nasazení, přesný produkční hash a ověření nových dat jsou samostatné kroky, které se neoznačují hotové podle samotných jednotkových testů. Průběžný seznam: [web-todo.md](web-todo.md).
