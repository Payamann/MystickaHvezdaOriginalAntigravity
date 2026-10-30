# Pokrytí nákupního měření — zdrojová kontrola 30. 10. 2026

Rozsah: lokální checkout `f6e76f52`, úkol M02. Kontrola zdrojů a existujících testů; bez síťových požadavků, živých dat GA/Stripe, změn kódu nebo nového běhu testů. Čísla řádků níže patří tomuto commitu.

**Výsledek:** kanonický klientský `purchase` už existuje pro vztahový výklad, Osobní mapu a první placený checkout členství. Událost závisí na návratu návštěvníka, úspěšném ověření a analytickém souhlasu. Automatické obnovení členství má backendový záznam, ale v prohlédnuté cestě nemá převod na GA `purchase`. Historické „GA 0 proti Stripe 3 / 547 Kč“ samo nedokazuje chybějící producer; bez shodného období a identifikace transakcí nejde určit příčinu rozdílu. Tato kontrola uzavírá zdrojové pokrytí, nikoli živou správnost GA.

## Produkty a důkaz platby

| Produkt | Producer a ověření | Hodnota a transaction_id | Omezení |
|---|---|---|---|
| Vztahový výklad | `js/vztahovy-vyklad.js:209–235`; `server/routes/vztahovy-vyklad.js:157–177` ověří browser proof cookie proti hashi v metadata a potom placenou session. | Klient posílá 149 CZK a ID vrácené checkout session z URL. Nejde o libovolnou katalogovou cenu: `server/services/relationship-tarot.js:22–27` vyžaduje complete + paid, správný productId/productType a přesně 14900 minor units v CZK. | Endpoint nevrací dynamickou částku ani PaymentIntent ID. Současný kontrakt odpovídá pevné ceně; případné slevy nebo změna ceny musí změnit ověřovací kontrakt i producer společně. Samotná URL nestačí. |
| Osobní mapa | `js/osobni-mapa.js:259–300`; `server/routes/pdf-checkout-result.js:24–53` ověří proof před jakýmkoli čtením objednávky, mode/product, complete + paid a succeeded PaymentIntent. | `payment.amount_received / 100`, CZK, `payment.id`. Klient vyžaduje paid, správný produkt, kladnou konečnou částku, CZK a ID. | Chybějící/expirovaná proof cookie, výpadek Stripe nebo nevrácení zákazníka zabrání browser purchase. Stav doručení je nezávislý: i unknown/failed může být řádně zaplacený nákup. Obnova doručení nevytváří další purchase v téže instanci stránky. |
| Členství — placený checkout | `js/profile/dashboard.js:831–876` a `js/profile/checkout-result.js`; `server/routes/checkout-result.js:75–145` vyžaduje přihlášení, shodu metadata userId/user_id s účtem a subscription mode. | Potvrzená paid invoice: skutečné `invoice.amount_paid / 100`, CZK a stabilní `invoice.id`. `amount_total` ani samotný aktivní plán nejsou důkazem zaplacení. | Návrat na profil, dostupné přihlášení a platná session jsou podmínkou této browser události. Nulové trial invoice vede k samostatnému `subscription_trial_confirmed`, ne purchase. |

Na všech třech stránkách jsou v HTML odkazy na sestavený analytics bundle a příslušný klient: `vztahovy-vyklad.html:16–17`, `osobni-mapa.html:494–500`, `profil.html:26,309`. To dokládá zapojení v repozitáři, nikoli aktuální obsah nasazených souborů nebo cache návštěvníka.

## Souhlas a doručení analytiky

- `js/analytics.js:89–100`: analytika je povolena jen přes `mh_cookie_prefs.analytics === true`, případně starší `cookieConsent=accepted`; nečitelná preference znamená false.
- `js/analytics.js:624–655`: `trackPurchaseCompleted` vyžaduje `verified: true`, transaction_id, konečnou kladnou hodnotu a třípísmennou měnu. Vytváří kanonický `purchase` s items, nikoli druhý klientský `purchase_completed`.
- `js/analytics.js:509–543,457–500`: event se nejdřív uloží do paměťové fronty; bez souhlasu se neodesílá providerům ani přes `/api/analytics/batch`. Pozdější souhlas může frontu přehrát v témže dokumentu. Odmítnutí ji vymaže (`:720–732`). Odchod před souhlasem nebo před odesláním může znamenat ztrátu události.
- `js/analytics.js:432–453`: GA dostává `gtag('event', 'purchase', ...)`, pokud je gtag dostupný. Interní `source` je pro GA přejmenován na `interaction_source`; nemá přepsat akviziční zdroj. Odeslání volání není důkaz přijetí GA.
- Provider dispatch probíhá před first-party POST a je označen WeakSetem. Fronta i označení jsou v paměti. Není zde potvrzení přijetí od GA ani garantovaný replay při pozdějším objevení provideru; to je konkrétní hranice pro následnou browser kontrolu, ne tvrzení, že k výpadku došlo.
- Profil krátce čeká na pozdě načtený analytics producer (`js/profile/dashboard.js:193–200`, až 12 opakování po 250 ms). Vztahový výklad a Osobní mapa volají analytics bezpečně/volitelně, ale nemají ekvivalentní čekání po úspěšném ověření. Po označení paymentTracked/verifiedPayment v téže instanci pozdější vznik analytics sám nákup nezopakuje.

## Backend, obnovení a deduplikace

Backendové platební záznamy nejsou totéž jako GA událost a nevznikají přes browser analytický souhlas:

- Jednorázové platby: `server/payment.js:2186,2250` zapisuje `one_time_purchase_completed` do funnelu. `:2265–2283` zapisuje `one_time_purchases` se Stripe session, PaymentIntent, částkou a stavem. Pro provozní/revenue kontrolu je potřeba porovnávat tyto objednávky s potvrzenými platbami, ne počítat návraty na URL.
- Checkout členství: `server/payment.js:2413–2445` zapisuje `subscription_checkout_completed` a backendový `analytics_events.event_type=purchase_completed`. Tento záznam nemá v ukázaném payloadu skutečnou peněžní částku ani invoice ID a není přenosem GA purchase; nepovažovat ho bez dalšího za součet tržeb. Může popisovat i subscription checkout se zkušebním obdobím.
- `invoice.paid`: `server/payment.js:1770,2557–2603` aktualizuje členství a zaznamenává `subscription_invoice_paid` s `amountPaid`, currency, invoiceId a billingReason. billingReason je nutný pro odlišení první faktury, obnovy a dalších důvodů; každá invoice.paid není automaticky další obnova. Při obnově běžně není nový browser checkout return. V prohlédnutém handleru není GA Measurement Protocol ani jiný převod tohoto eventu na GA purchase.
- `server/routes/analytics.js:149–179` ukládá first-party klientské eventy; výslovnou deduplikaci zde má signup_completed, nikoli purchase. Nejde o účetní ledger ani doklad serverového přeposlání do GA.
- `js/analytics.js:86–87,629–636`: transaction ID je deduplikováno jen Setem v aktuálním JS runtime. Opakované zavolání v témže dokumentu je pokryto; reload, jiný prohlížeč nebo jiná karta mohou odeslat znovu. Nevyvozovat z toho ověřené chování deduplikace na straně GA. Pro srovnání nezaměňovat identifikátory: vztahový produkt používá `cs_`, mapa `pi_`, členství `in_`.
- ID je v Setu již při zařazení do fronty, nikoli až po potvrzeném přijetí providerem. Počty volání produceru, first-party řádků, GA eventů a unikátních plateb proto nejsou zaměnitelné.

## Existující důkazy z testů

Testy byly v tomto kroku pouze přečteny, ne znovu spuštěny:

- `tests/frontend/analytics.test.js:154,193,211,243`: žádné providery před souhlasem, replay po souhlasu, vymazání po odmítnutí, jedna kanonická purchase pro opakované ID a odmítnutí nepotvrzených/nulových nákupů.
- `server/tests/checkout-result.test.js:24–64`: skutečná částka invoice, vlastnictví, trial, pending, nepodporovaný produkt a bezpečné selhání.
- `server/tests/pdf-checkout-result.test.js`: proof a částka PaymentIntent; delivery lookup nepoškodí potvrzenou platbu. `tests/frontend/personal-map-delivery-status.test.js:40–76`: refresh neduplikuje nákup, neověřená platba není purchase a chyba refresh zachová potvrzení.
- `tests/e2e/relationship-tarot.spec.js:98–125`: browser volání purchase až po mockovaném potvrzení, s 149 CZK a ověřenou session. `server/tests/relationship-tarot.test.js` kontroluje platební kontrakt. Mocky nedokazují přijetí eventu reálnou GA property.

## Přesné další ověření

1. **Navázat na browser QA, nevytvářet další producer.** U každého produktu zachytit jednu mockovanou verified return cestu se souhlasem, bez souhlasu a s udělením souhlasu až po ověření. Zkontrolovat právě jedno volání kanonického purchase, jeho ID/hodnotu/měnu/items, absenci citlivých údajů a pořadí načtení analytics/gtag. Samostatně opakovat refresh a odmítnutí souhlasu. Jestli to již doloží souběžná QA, kontrolu neopakovat.
2. **Před tvrzením o produkci ověřit nasazený commit/bundle a cílovou GA property.** Zdrojový producer sám neprokazuje, že se spouští v konkrétním prohlížeči, že nezasáhl blokátor, že se odesílá do správné property nebo že GA event přijala. Žádná nová skutečná platba není potřebná pro pouhou kontrolu browser kontraktu.
3. **Pro vysvětlení historického rozdílu vytvořit jeden read-only průnik existujících záznamů.** Stejné časové období a časová zóna, pouze příslušný live/test režim; unikátní uhrazené transakce podle produktu, minor-unit částky/měna, případné vratky, trial/renewal/first checkout. Teprve poté porovnat dostupná GA transaction_id a first-party/funnel záznamy. U každé nedohledané GA platby rozlišit obnovu bez návratu, neověřený návrat/proof/auth, souhlas a neznámou příčinu; chybějící souhlas nelze vymýšlet zpětně z absence eventu.
4. **O serverovém GA přenosu rozhodnout až podle měřicího cíle.** Pokud má GA zahrnovat i obnovy bez návratu, současná browser cesta to nedělá. Návrh nové cesty by potřeboval samostatný kontrakt souhlasu, attribution a jednotných transaction ID/deduplikace. Není to automatický závěr tohoto auditu a nebyl implementován.

M02 lze označit jako dokončenou analýzu pokrytí. Živá shoda GA/Stripe, rozsah historického podměření a produkční doručitelnost eventů zůstávají neověřené.
