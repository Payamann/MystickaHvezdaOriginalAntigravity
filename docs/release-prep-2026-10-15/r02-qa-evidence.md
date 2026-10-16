# R02 QA evidence — 2026-10-15

Zdroj: `.tmp/release-qa-20261015/server-results.json` (lokální Jest běh, 15. 10. 2026).

Dne 16. 10. 2026 proběhla samostatná read-only kontrola Supabase MCP projektu `dybfmdtmmocrjbdfbxbb` (Mystická Hvězda). Nebyly čteny zákaznické řádky ani provedeny mutace.

## Výsledek relevantních kontrol

V celém běhu prošlo 803 z 806 testů ve 84 z 86 suitách. Relevantní one-time / Personal Map kontroly prošly takto:

| Suite | Výsledek | Pokrytí |
| --- | ---: | --- |
| `personal-map-fulfillment.test.js` | 9/9 | idempotentní retry po přijetí Resendem, bezpečné okno po timeoutu, oddělení generování/renderu/odeslání, persistence receipt, claim souběhu, legacy order bez delivery evidence |
| `personal-map-generation-failure.test.js` | 1/1 | placená chyba generování vyhodí chybu a nevrátí generický náhradní obsah |
| `one-time-order-reconciliation.test.js` | 13/13 | grace window, retry budget, PAID gate, expired/unpaid/unknown stav, transientní Stripe chyba, failed/fulfilled přechody, obnova receipt bez webhooku |
| `relationship-tarot-webhook.test.js` | 4/4 | podepsaný paid webhook, odložená platba, underpayment, retryable delivery outage |
| `one-time-pdf-email-guard.test.js` | 2/2 | bez `RESEND_API_KEY` se PDF odeslání nezdaří nahlas |
| `admin-one-time-orders.test.js` | 5/5 | auth/admin ochrana, failed queue, filtrování, rozlišení acceptance a potvrzeného delivery |
| `payment-webhook-reservation.test.js` | 5/5 | failed stav migrace a rozhodování při duplicitním, čerstvém, stale a failed reservation |
| `one-time-orders.test.js` | 2/2 | sanitizace Stripe metadat a oddělené uložení citlivého vstupu |

Doplňkově prošly `relationship-email-delivery.test.js` 12/12 a `email-service.test.js` 24/24; poslední sada ověřuje i stabilní provider idempotency key pro Personal Map.

## Ověřené produkční schema předpoklady

- `public.one_time_order_inputs` má `payload jsonb NOT NULL`, `email_id text` nullable, `email_sent_at timestamptz` nullable, `status text NOT NULL`, `stripe_session_id text` nullable a `fulfilled_at timestamptz` nullable.
- `public.one_time_order_inputs` i `public.one_time_purchases` mají `RLS enabled=true` a policy `No direct access` s `ALL`, `USING false`, `WITH CHECK false`.
- Existuje partial unique index `one_time_order_email_id_unique` na `email_id` pouze pro nenulové hodnoty a unique index na `stripe_session_id`.
- Existuje BEFORE UPDATE trigger `preserve_one_time_email_id` se stejným názvem funkce; ověřen byl pouze jeho existence a název.

## Co testy pokrývají

- Úspěšné odeslání se dá bezpečně opakovat bez nového generování PDF nebo duplicitního provider requestu.
- Selhání po přijetí providerem zůstává dohledatelné přes receipt a retry používá stejný artefakt i idempotency key.
- Chyba generování u placené objednávky se nepřeklápí do falešného obsahu.
- Reconciliation fulfillment spouští jen pro ověřenou platbu, respektuje grace period a retry limit a nepředá neuhrazenou nebo neověřitelnou objednávku zdarma.
- Webhook a delivery cesty zachovávají retryable stav při výpadku doručení a deduplikují opakovaný event.

## Hranice lokálního důkazu

Tento běh není produkční QA. Schema předpoklady výše jsou ověřené read-only dotazem, ale lokální testy s mocky, injektovanými funkcemi a testovacími fixtures stále nedokazují:

- skutečný PostgREST/SQL CAS zápis, souběh pracovníků a chování po restartu procesu v produkčním prostředí;
- že Resend v produkci zprávu skutečně přijme, doručí a vrátí callback, ani že callback projde reálným podpisem a síťovou konfigurací;
- správné rozhodnutí pro staré nejasné objednávky mimo nasimulované stavy, zejména historické řádky bez `personalMapFulfillment`, chybějícího `stripe_session_id`, neúplné receipt nebo nejednoznačného payment výsledku;
- skutečnou dostupnost Stripe, Claude, Playwright/PDF rendereru, Resendu ani produkčních secrets.

Produkční ověření CAS/restartu, doručitelnosti a starých objednávek proto zůstává samostatným release krokem.
