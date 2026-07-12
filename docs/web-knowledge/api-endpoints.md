# API endpointy — příloha WEB-KNOWLEDGE (2026-07-12, commit 89fa8982)

Plné schéma API: `server/openapi.yaml` (servírované na `/api/docs`, v produkci za `DOCS_TOKEN`).
Tady jen mapa mountů + runtime-ověřené kontrakty.

## Mapa mountů (server/index.js:872-944)

| Mount | Soubor | Účel |
|---|---|---|
| `/api/auth` | `server/auth.js` | registrace, login, profil, onboarding |
| `/api/payment` | `server/payment.js` | Stripe checkout, webhook, funnel eventy, retention |
| `/api/analytics` | `server/routes/analytics.js` | first-party event ingestion |
| `/api/admin` | `server/admin.js` | funnel report, správa uživatelů (JWT admin) |
| `/api/newsletter` | `server/newsletter.js` | subscribe + welcome e-mail + HMAC unsubscribe |
| `/api/contact` | `server/contact.js` | kontaktní formulář (CSRF) |
| `/api/mentor` | `server/mentor.js` | AI Hvězdný průvodce |
| `/api/horoscope` | `server/routes/horoscope.js` | horoskopy (+ `horoscope-pages.js` server-rendered SEO stránky) |
| `/api/numerology`, oracle, briefing, `/api/past-life`, `/api/medicine-wheel` | `server/routes/*` | AI nástroje (za `aiLimiter`) |
| `/api/user` | `server/routes/user.js` | uložené výklady (`/api/user/readings`) |
| `/api/angel-post`, `/api/subscribe/horoscope` | `server/routes/*` | komunitní zeď, denní horoskop e-mail |
| `/api/push` | `server/routes/push.js` | push subscriptions + admin test send |
| `/api/rocni-horoskop`, `/api/osobni-mapa` | `server/routes/*` | jednorázové PDF produkty |
| `/api/docs` | `server/routes/docs.js` | Swagger UI |

## Ověřené kontrakty (runtime, mock režim)

**CSRF:** `GET /api/csrf-token` → `{csrfToken}`; mutující requesty posílají header `x-csrf-token` (HMAC, `server/index.js:435-546`).

**Registrace:** `POST /api/auth/register` `{email, password, name}` → 200 `{success, user{id, email, subscription_status, …}}`; nastaví **httpOnly `auth_token`** (JWT, exp 7 dní) + JS-čitelný **`logged_in=1`** (marker pro UI — CTA skrývání, `js/auth-client.js`). V testovacím env `emailVerificationSkipped: true`; v produkci e-mail verifikace + post-verification checkout recovery.

**Onboarding:** `POST /api/auth/onboarding/complete` (auth) → uloží zájem/znamení, spouští aktivační lifecycle sekvenci Day 0/1/3/6 (`server/auth.js:809`).

**Funnel event:** `POST /api/payment/funnel-event` — tělo **`{eventName, source, feature, planId, planType, metadata}`** (`server/payment.js:965`). `eventName` musí být v `PUBLIC_FUNNEL_EVENTS` (odvozeno z `server/config/growth-loop.js`), jinak 400 „Invalid funnel event." Bez auth funguje (optionalPremiumCheck).

**Analytics event:** `POST /api/analytics/event` `{eventName, page, sessionId, clientId, …}` → `{success, accepted: n}` (`server/routes/analytics.js`).

**Plan manifest:** `GET /api/plans` → `{currency, featurePlanMap, pricingPage, plans[]}` z `getPublicPlanManifest()` (`server/config/constants.js:130`). Čte `js/cenik.js` i `js/premium-gates.js` (fallback na statickou konfiguraci).

**Checkout:** `POST /api/payment/create-checkout-session` (auth povinný) `{planId, source, feature, billingInterval}` → Stripe session. Další: `/cancel`, `/reactivate`, `/portal`, `/subscription/status`, `/subscription/pause`, `/subscription/apply-discount`, `/retention/feedback` (`server/payment.js:905-2506`).

**Health:** `GET /api/health` → `{status, checks{db,ai}, features{…}, deployment{commit,branch}}` — používá `verify:production:commit` k ověření nasazeného commitu.

## Auth cookies — shrnutí

| Cookie | Typ | Účel |
|---|---|---|
| `auth_token` | httpOnly, 7 dní | JWT (id, email, subscription_status, isPremium) |
| `logged_in` | JS-čitelný marker | UI stav (skrývání registračních CTA); pozor na „stale" stav po expiraci auth_token (fix `9c3ee1cb`) |
