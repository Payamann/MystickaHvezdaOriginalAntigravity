> Pomocná zdrojová inventura. Ověřený rozsah, konečné priority a opravené závěry jsou v [hlavním seznamu](README.md). Doporučení níže nejsou automatická instrukce k hromadným úpravám.

# Dynamic account and runtime HTML gap inventory

Datum: 2026-10-14  
Základ: `release-20261012` / `9d6814de`  
Režim: readonly source audit. Nebyl proveden login, signup, reset, platba, e-mail, browser ani network request.

Poznámka k manifestu: úplný manifest je nyní součástí tohoto reportového adresáře. Tento dokument doplňuje pouze runtime/account gap audit.

## `onboarding.html` (229 řádků)

**Zdroj shora dolů:** shell/progress 37–53; krok 1 s kontextovým titulkem, ikonou, skip odkazem a privacy note 57–89; krok 2 s 12 znameními, disabled next/quick finish a quick-flow note 91–156; krok 3 s 15 interest chips, finish CTA a dynamic next note 158–214; scripts 216–229.

**Renderer `js/dist/onboarding.js`:** source evidence ukazuje guided a quick flow. Query `source`, `feature`, `plan`, `redirect`, `flow` volí návratovou cestu; localStorage obnovuje znamení/interests. Stavy: initial step, step transition/back, sign selected, interest selected, disabled/enabled next, quick flow variant, finishing `aria-busy`/disabled/loading copy, skipped flow and completed flow. Completion POSTuje `/api/auth/onboarding/complete`, ale UI pokračuje po krátkém timeoutu i při backend warningu. Redirect vede podle feature na horoskopy, tarot, numerologii, vztahy, natální kartu, snář, mentora, runy, šamanské kolo, minulý život nebo křišťálovou kouli.

**Návrh:** KEEP all three steps, sign grid, interests, privacy/payment note, skip and destination-specific CTA. COLLAPSE only explanatory subtitle text in step 1/3 if visual pass confirms density. REMOVE no fields or destinations. Do not wrap active step/result in details.

**Riziko/mismatch:** HTML has `data-action` hooks and disabled buttons; renderer dynamically changes headings and CTA labels. Any source simplification must preserve all `id`, `data-step`, `data-interest`, `data-action`, query parameter propagation and localStorage keys.

## `rocni-horoskop.html` (312 řádků; retired entry)

**Static source:** status success 80–95, cancel/recovery 97–113, hero 116–192, model sample 194–212, order form 213–306. Form fields are name, birth date, sign, email and submit; `#formError` is an error surface.

**Runtime route evidence:** `server/index.js:767–770` redirects all new requests to `/osobni-mapa.html?source=annual_horoscope_retired`. Only requests with `status=success` and `session_id` pass through to the static success page. `server/routes/rocni-horoskop.js:1+` maps the retired product to `/osobni-mapa.html` for product configuration. `js/dist/rocni-horoskop.js?v=4` remains attached to the static file.

**Návrh:** Do not simplify this as an active purchase funnel. Keep legacy success state reachable for existing Stripe sessions, preserve redirect behavior and noindex/source rules. If visual cleanup is later requested, collapse only sample/reference copy; retain status, form error and payment recovery hooks.

**Riziko/mismatch:** source still presents an order form and a comparison CTA while the server redirects new visitors. This is a source/runtime mismatch that should be handled as a retirement/redirect decision, not by hiding the form in CSS or details.

## Runtime HTML routes found by source inspection

### `GET /horoskopy.html?znak=<sign>`

`server/index.js:683–731` reads static `horoskopy.html`, injects sign-specific Open Graph/Twitter metadata, sets HTML cache/CSP headers and sends the modified document. Source states are sign-valid injection or `next()` to static handling for missing/invalid sign. This route changes metadata only; no extra visible tool section is generated.

### `GET /rocni-horoskop.html`

`server/index.js:767–770` sends new requests to Personal Map; success requests with both `status=success` and `session_id` continue to the legacy static HTML. This is the only runtime branch for the retired annual product found in the public HTML path.

The paired API routes in `server/routes/rocni-horoskop.js:10–21` return JSON `410` for both `GET /product` and `POST /checkout`, with replacement `osobni_mapa_2026`; they do not produce HTML.

### `GET /vztahovy-vyklad.html?status=...` / `session_id=...`

`server/index.js:891–894` serves the same static page but forces private cache and `noindex, nofollow` when payment state parameters exist. The visible result state is in the page (`#payment-result`, retry, support); `js/dist/vztahovy-vyklad.js` resolves actual status. No separate server-generated template was found.

### Newsletter unsubscribe HTML: `GET /api/newsletter/unsubscribe`

`server/newsletter.js:113–145` calls `renderUnsubscribePage` for invalid token (400), successful signed token, and server error (500). `server/utils/unsubscribe-page.js:7–17` emits a minimal standalone Czech HTML page: title, one message paragraph and link back to `/`. It includes local fonts/style sheets, no inline script/style.

### Daily horoscope unsubscribe HTML: `GET /api/subscribe/horoscope/unsubscribe`

`server/routes/horoscope-subscribe.js:87–116` uses the same renderer for missing token (400), unknown/used token (404), success and server error (500). POST at lines 118–130 is JSON only and is not an HTML page.

## Explicitly absent guessed files

`objednavka.html`, `checkout.html` and root `unsubscribe.html` do not exist in this checkout. Payment result is embedded in `vztahovy-vyklad.html` and `osobni-mapa.html`; unsubscribe HTML is generated at the two API routes above.

## Ověření

Read-only inspection of `onboarding.html`, `rocni-horoskop.html`, their JS, `server/index.js`, `server/routes/rocni-horoskop.js`, `server/newsletter.js`, `server/routes/horoscope-subscribe.js` and `server/utils/unsubscribe-page.js`. No product/UI/code edits, tests, browser, network, login, payment or email actions.
