# Doručení osobní mapy po platbě — 27. 10. 2026

## Rozsah

První ohraničený krok po doporučení priorit: opravit okamžité doručení osobní mapy. Vychází z nasazeného `c5925daee980b565d9385aeebb662c64801c6461`, v izolovaném worktree `.tmp/seo-growth-20261025`, lokální větev `codex/personal-map-webhook-fix`. Neproběhl push, deploy, reálná platba, živá generace, doručovací e-mail ani změna produkčních objednávek.

## Potvrzená chyba a oprava

Podepsaný webhook předával službě `fulfillPersonalMapOrder` staré argumenty se jménem, e-mailem a payloadem. Současná durable služba přijímá pouze `orderId`, podle kterého načte uložené zadání a pokračuje přes uložený výklad, PDF a potvrzení e-mailu. Bez ID končila chybou Missing personal map order ID.

Webhook nyní předává `{ orderId: orderInput.id }`. Data pro generování si služba nadále načítá ze své uložené objednávky; duplicitní kopie zadání ve webhooku se odstranila. Cena 299 Kč, checkout, platební metody a samotná tvorba výkladu/PDF se nemění.

Bezprostředně související bezpečné hranice:

- Samotné checkout.session.completed nestačí: musí jít o payment relaci s payment_status=paid. Dosud nezaplacená relace nespustí doručení ani evidenci zaplaceného nákupu.
- Osobní mapa se zpracuje také při checkout.session.async_payment_succeeded; platební metody se nerozšiřují, pouze se správně obslouží pozdější potvrzení existující platby.
- Produktový typ/ID a uložená Stripe session musí odpovídat události. Kontrola probíhá i před obsluhou již splněné objednávky.
- Událost doručení a následný lifecycle se zaznamenají až po úspěchu služby a potvrzeném zápisu fulfilled. Neúspěšný zápis ponechá obnovitelné selhání.
- Existující idempotence Stripe událostí, uložené artefakty a idempotency klíč e-mailu zůstávají zachované. Neprovádí se hromadné opakování starých objednávek; legacy stav bez důkazu o doručení dál vyžaduje kontrolu.

## Ověření

Před změnou nový test skutečného podepsaného handleru reprodukoval dvě chyby: služba dostala argumenty bez orderId a spustila se i pro unpaid relaci. Po opravě prošlo deset integračních regresí: placená objednávka, unpaid → později paid, duplikát/replay, čekání na dokončení doručení, chyba a následná reconciliation stejného ID, odmítnutý zápis fulfilled, neplatný podpis a tři neshody relace/produktu/typu.

Používá se existující testovací setup NODE_ENV=test a MOCK_SUPABASE=true, skutečná lokální kontrola Stripe podpisu a in-memory evidence objednávek/webhooků. Doručovací a e-mailové hranice jsou explicitní mocky; obnova má injektované ověření platby bez Stripe API.

Celkem **43 cílených testů v šesti sadách prošlo**: nových deset plus existující personal-map-fulfillment, one-time-order-reconciliation, relationship-tarot-webhook, one-time-pdf-email-guard a payment-webhook-reservation. Po posledním doplnění vazby relace byla znovu spuštěna zasažená desítka. Cílený ESLint a git diff --check prošly. Širší nesouvisející serverová/E2E sada se neopakovala.

Astra nezávisle ověřila kontrakt a bezpečnost platební větve, upozornila na unpaid relaci a doporučila kontrolu vazby relace na objednávku. Hlavní agent implementoval změny, reprodukoval původní selhání a spustil regresní sady. Úspora se bez měření netvrdí.

Tato lokální oprava nezjišťuje skutečný počet nedoručených objednávek a nepotvrzuje reálné doručení zákazníkovi. Starší nálezy přepínání účtů a synastrie nejsou tímto krokem opravené.
