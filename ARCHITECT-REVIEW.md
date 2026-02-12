# Mystická Hvězda — Senior Architect Code Review

**Reviewer Role**: Senior Full Stack Software Architect & Security Auditor
**Date**: 2026-02-12
**Codebase**: MystickaHvezda (Node.js/Express + Vanilla JS/HTML/CSS)
**Stack**: Express 5, Supabase (Postgres), Stripe, Google Gemini AI, Vanilla JS PWA

---

## Executive Summary

Mystická Hvězda is a well-structured, full-stack Czech astrology/divination SaaS platform with a freemium monetization model. The codebase demonstrates **above-average security awareness** for a project of this scale — Helmet, CORS, rate limiting, XSS sanitization, input whitelisting, and prompt injection defenses are all present. The Stripe integration follows best practices (webhook signature verification, idempotent upserts). However, several **critical issues** remain that could lead to data exposure, subscription bypass, or cost abuse if left unaddressed.

---

## 🚨 Critical Issues (Must Fix Immediately)

### C1. JWT Secret Defined Three Times with Divergent Logic

**Files**: `server/middleware.js:8-17`, `server/auth.js:20-34`, `server/config/jwt.js:9-22`

The `JWT_SECRET` is independently loaded and validated in three separate modules. While each has the production guard (`process.exit(1)`), the duplication creates a maintenance hazard: a future developer could change the dev fallback in one file but not another, causing tokens signed in `auth.js` to fail verification in `middleware.js`.

**Impact**: Token verification mismatch between modules. Potential for hard-to-debug auth failures or, worse, a module silently falling back to the insecure placeholder.

**Fix**: Import `JWT_SECRET` from the single canonical source `server/config/jwt.js` in both `auth.js` and `middleware.js`. Delete the duplicated initialization logic from both consumers.

---

### C2. Supabase Service Role Key Used for All Operations (RLS Bypass)

**File**: `server/db-supabase.js:32-38`

The server creates a **single Supabase client** using the `SUPABASE_SERVICE_ROLE_KEY`, which bypasses Row Level Security (RLS) entirely. Every database query — including user-facing reads — runs with admin privileges.

```javascript
// db-supabase.js:33
export const supabase = createClient(projectUrl, serviceKey, { ... });
```

While the application code manually adds `.eq('user_id', req.user.id)` filters, this is a **defense-in-depth failure**. If any route forgets this filter, data from all users is exposed. The admin routes already show this pattern works, but the service key means RLS policies defined in Supabase migrations are effectively decorative.

**Impact**: A single missing `.eq('user_id', ...)` filter in any route leaks all user data. The RLS policies in `supabase/migrations/` give false confidence.

**Fix**: Create two Supabase clients:
1. A **service role client** for admin operations and webhooks only.
2. A **per-request client** using `supabase.auth.setSession()` or the user's JWT to enforce RLS at the database level for user-facing routes.

---

### C3. JWT Token Expiry Set to 30 Days with No Refresh/Revocation Mechanism

**File**: `server/auth.js:200-204`

```javascript
const token = jwt.sign({ id, email, subscription_status }, JWT_SECRET, { expiresIn: '30d' });
```

Tokens are valid for 30 days. There is **no token revocation list**, no refresh token flow, and no server-side session store. If a user's token is compromised, there is no way to invalidate it. Additionally, `subscription_status` is baked into the JWT at sign-in time — if a user upgrades to Premium, they must log out and back in to get a new token reflecting their status (the app mitigates this by checking the database in `requirePremium`, but the JWT payload itself is stale).

**Impact**: Compromised tokens remain valid for 30 days. No forced logout capability. Stale subscription status in JWT claims.

**Fix**: Reduce token expiry to 1-7 days and implement a refresh token flow. Alternatively, move to server-side sessions with a revocable session store. Remove `subscription_status` from the JWT payload (it's always re-checked from the database anyway).

---

### C4. Crystal Ball Endpoint Has No Authentication or Rate Limiting

**File**: `server/index.js:162-187`

The `/api/crystal-ball` endpoint requires no authentication and is only covered by the general `limiter` (100 req/15min per IP). It calls the Gemini API, which incurs real cost per request.

```javascript
app.post('/api/crystal-ball', async (req, res) => { ... });
```

An attacker can script 100 requests every 15 minutes from a single IP, or use distributed IPs to drain the Gemini API budget. The `aiLimiter` (30 req/15min) is applied to `/api/natal-chart` but **not** to `/api/crystal-ball`.

**Impact**: API cost abuse. At $0.001-0.01 per Gemini call, sustained automated abuse could cost hundreds of dollars per day.

**Fix**: Apply `aiLimiter` to `/api/crystal-ball`. Consider adding CAPTCHA or proof-of-work for unauthenticated AI endpoints, or require authentication.

---

### C5. Stripe Publishable Key Hardcoded in Source Control

**File**: `js/api-config.js:16`

```javascript
STRIPE_PUBLISHABLE_KEY: 'pk_test_51SvhkJPMTdHJh4NOR3GEkWs2lPjTEDURmFrYru5pcU6K90ZczeXUEGiQWoyxPe3W5xlzGmIjSL8Pr0hWbLzvMhOK00hVke56SN',
```

While Stripe publishable keys are designed to be public, **this is a test key** committed to version control. When the app goes to production, this must be swapped to the live key. Having the test key hardcoded means:
1. The production/test distinction is not environment-driven.
2. Someone could fork the repo and test against your Stripe account.

**Impact**: Test infrastructure exposure, no environment-driven key switching.

**Fix**: Inject the Stripe publishable key at build time or via a server-rendered config endpoint (`GET /api/config`). Never hardcode keys in client-side source files.

---

## ⚠️ Warnings (Fix Before Next Release)

### W1. `xss-clean` Package is Deprecated and Unmaintained

**File**: `package.json:22`, `server/index.js:6-107`

The `xss-clean` package (v0.1.4) has been deprecated since 2022 with no further updates. It uses a simplistic regex-based approach and is not considered reliable for production XSS protection.

**Suggestion**: Replace with a maintained sanitization library such as `express-xss-sanitizer`, `DOMPurify` (for HTML output), or use schema validation (Zod/Joi) to enforce expected input shapes and reject anything else.

---

### W2. Profile Endpoints Don't Use `authenticateToken` Middleware

**Files**: `server/auth.js:257-297` (GET `/profile`), `server/auth.js:301-337` (PUT `/profile`)

These routes manually extract and verify the JWT instead of using the shared `authenticateToken` middleware:

```javascript
router.get('/profile', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    // ... manual jwt.verify
});
```

This duplicates auth logic and does not specify `{ algorithms: ['HS256'] }` in the verify call (unlike `middleware.js:31`), making it potentially vulnerable to algorithm confusion attacks (e.g., `alg: none`).

**Suggestion**: Replace manual JWT handling with the `authenticateToken` middleware for consistency and security.

---

### W3. `isPremiumUser` Inconsistency — Missing `cancel_pending` Status

**File**: `server/payment.js:43-62`

The `isPremiumUser()` helper in `payment.js` checks for `active` and `trialing` but **not** `cancel_pending`:

```javascript
const isActive = subscription.status === 'active' || subscription.status === 'trialing';
```

But the middleware's `requirePremium` in `middleware.js:63` **does** include `cancel_pending`:

```javascript
const isActive = subscription.status === 'active' || subscription.status === 'trialing' || subscription.status === 'cancel_pending';
```

This means a user who cancels (but hasn't reached period end) could be denied premium features on routes that use `isPremiumUser()` (e.g., tarot card limits, synastry teaser logic) while being allowed through `requirePremium`.

**Suggestion**: Extract premium checking into a single shared function used by both middleware and route handlers. Ensure `cancel_pending` is consistently treated as active.

---

### W4. No Input Validation on Tarot `cards` Array

**File**: `server/index.js:190-215`

The `/api/tarot` endpoint destructures `cards` from the request body and directly accesses `cards.length` and `cards.join(', ')` without validating that `cards` is an array, that elements are strings, or capping the array length:

```javascript
const { question, cards, spreadType = 'tříkartový' } = req.body;
if (!userIsPremium && cards.length > 1) { ... }
const message = `... Vytažené karty: ${cards.join(', ')}`;
```

If `cards` is not an array (e.g., an object or number), `cards.length` and `cards.join` will throw, crashing the handler. If `cards` contains very long strings or many elements, the Gemini prompt could be inflated.

**Suggestion**: Add validation: `if (!Array.isArray(cards) || cards.length === 0 || cards.length > 20)`. Sanitize each element as done in `/api/tarot-summary`.

---

### W5. No Cache Expiration / Cleanup for Database Caches

**Files**: `server/services/astrology.js`, `server/index.js:410-454`

Horoscope and numerology caches are stored in the database with no TTL or cleanup mechanism. Old cache entries (e.g., daily horoscopes from months ago) will accumulate indefinitely.

**Suggestion**: Add a scheduled job (cron or pg_cron) to delete cache entries older than their period (e.g., daily caches > 2 days old, weekly > 2 weeks). Alternatively, add a `expires_at` column and filter on it.

---

### W6. `'unsafe-inline'` in CSP for Scripts

**File**: `server/index.js:64`

```javascript
scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
```

`'unsafe-inline'` in `script-src` significantly weakens CSP protection against XSS. Any injected inline script will execute.

**Suggestion**: Replace with `'nonce-{random}'` or `'strict-dynamic'` CSP directives. Generate a per-request nonce and attach it to inline `<script>` tags. This is a common Helmet pattern.

---

### W7. Mentor Chat History Has No Pagination and No Deletion Endpoint

**File**: `server/mentor.js:164-184`

The `/api/mentor/history` endpoint fetches the last 50 messages with no pagination. For active users, the message table could grow large, and there's no user-facing way to clear history (no DELETE endpoint is defined in `mentor.js`, though the route module description mentions one).

**Suggestion**: Add pagination parameters (page/limit) and implement a `DELETE /api/mentor/history` endpoint for GDPR compliance (right to erasure).

---

### W8. FOMO Feed Uses `innerHTML` with Hardcoded Data

**File**: `js/fomo-feed.js:81-87`

```javascript
notification.innerHTML = `
    <div class="fomo-icon">✨</div>
    <div class="fomo-content">
        <div class="fomo-text">${data.name} z ${data.city}</div>
        <div class="fomo-action">${data.action}</div>
    </div>
`;
```

While the data is currently hardcoded (not user-input), using `innerHTML` sets a dangerous pattern. If this data source ever changes to dynamic (e.g., real user activity), it becomes an XSS vector.

**Suggestion**: Use `textContent` and DOM APIs as done correctly in `auth-client.js:128-143` (`showToast`).

---

### W9. Admin Route Does Not Validate `plan_type` Against Whitelist

**File**: `server/admin.js:37-87`

The `POST /api/admin/user/:userId/subscription` endpoint accepts arbitrary `plan_type` strings:

```javascript
const { plan_type } = req.body;
if (!plan_type || typeof plan_type !== 'string') { ... }
```

No validation against the `PREMIUM_PLAN_TYPES` whitelist. An admin could accidentally set a plan type that doesn't match any gate logic, effectively creating an unrecognized subscription state.

**Suggestion**: Validate `plan_type` against the `PREMIUM_PLAN_TYPES` array plus `'free'`.

---

### W10. Synastry Endpoint Passes Unsanitized User Input to Gemini

**File**: `server/index.js:267-296`

```javascript
const message = `Osoba A: ${person1.name}, narozena ${person1.birthDate}\nOsoba B: ${person2.name}, narozena ${person2.birthDate}`;
```

Unlike other endpoints (natal-chart, astrocartography) that use `String().substring()` sanitization, the synastry endpoint directly interpolates `person1` and `person2` properties without length or type validation. This is both a prompt injection risk and a potential payload inflation vector.

**Suggestion**: Apply the same `String(value).substring(0, limit)` pattern used in natal-chart and astrocartography.

---

## 💡 Optimization Opportunities (Nice to Have)

### O1. Centralize API Error Handling with Express Error Middleware

Every route handler has its own `try/catch` block with `console.error` and a `res.status(500).json(...)` response. This is ~40 instances of duplicated error handling.

**Suggestion**: Create an async route wrapper and a centralized Express error handler:
```javascript
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);
app.use((err, req, res, next) => { /* centralized logging + response */ });
```

---

### O2. Replace Global `window.*` Pollution with ES Module Architecture

**Files**: `js/api-config.js:62-63`, `js/auth-client.js:475`, `js/premium-gates.js:9`, `js/gemini-service.js:122-131`

The frontend exposes `window.Auth`, `window.Premium`, `window.API_CONFIG`, `window.GeminiService`, `window.callAPI` as globals. This creates namespace collision risks and makes dependency relationships implicit.

**Suggestion**: Migrate to ES modules (`<script type="module">`) with explicit `import`/`export`. The `gemini-service.js` already exports as ES modules but also attaches to `window` as a fallback — remove the fallback once module loading is standardized.

---

### O3. Add Request Validation Schemas (Zod/Joi)

Input validation is currently hand-rolled across every endpoint. This leads to inconsistent validation depth (compare thorough validation in `/api/horoscope` vs. minimal validation in `/api/synastry`).

**Suggestion**: Define request schemas using Zod or Joi and validate as Express middleware. This provides type-safe parsing, consistent error messages, and self-documenting API contracts.

---

### O4. Implement Structured Logging

The application uses `console.log/warn/error` with emoji prefixes for log differentiation. In production, this makes log parsing and alerting difficult.

**Suggestion**: Use a structured logger (Pino or Winston) with JSON output, log levels, request correlation IDs, and integration with Railway's logging infrastructure.

---

### O5. Database Connection Pooling and Health Checks

The Supabase client is initialized once at module load. There's no connection health check beyond the initial validation.

**Suggestion**: Add a periodic health check (e.g., `SELECT 1` every 60s) and include database connectivity in the `/api/health` endpoint response.

---

### O6. Font Loading Optimization

**File**: `index.html:39-43`

Google Fonts are loaded synchronously via `<link rel="stylesheet">`, which blocks rendering. The Cinzel font is decorative and not critical for initial paint.

**Suggestion**: Load fonts asynchronously using `<link rel="preload" as="style" onload="this.rel='stylesheet'">` or use `font-display: swap` (already set via `&display=swap` — good). Consider self-hosting fonts to eliminate the third-party dependency.

---

### O7. Service Worker Could Serve Offline Page Instead of Index

**File**: `service-worker.js:101-104`

When offline and no cache match exists for an HTML request, the service worker falls back to `/index.html`. This works as a basic SPA fallback but could confuse users expecting a specific page.

**Suggestion**: Serve `/offline.html` (which already exists in the project) for offline HTML fallbacks instead of `/index.html`.

---

### O8. Consider Adding CSRF Protection for State-Changing Requests

While the application uses JWT Bearer tokens (which are not automatically attached by browsers like cookies), the CORS configuration allows `credentials: true`. If cookies are ever introduced for auth, CSRF becomes a risk.

**Suggestion**: Add CSRF tokens or ensure that Bearer token auth is the only mechanism. Document this decision.

---

## ✅ What is Done Well

### Security Strengths

- **Helmet.js with custom CSP**: Content Security Policy is configured with specific domain whitelists for scripts, styles, fonts, images, connections, and frames. Not just the defaults.
- **Tiered rate limiting**: Four different rate limiters (general 100/15min, AI 30/15min, auth 10/15min, sensitive ops 5/1hr) show thoughtful protection.
- **Stripe webhook signature verification**: The webhook handler properly verifies signatures before processing events and rejects webhooks when the secret is missing.
- **Prompt injection defense**: The `ROLE_PREAMBLE` in `config/prompts.js` prepends system-level instructions to every AI prompt, instructing the model to ignore attempts to change its role.
- **User enumeration prevention**: Registration errors return generic messages. Forgot-password always returns success regardless of whether the email exists.
- **Production fail-secure**: Missing `JWT_SECRET` or Supabase credentials in production cause `process.exit(1)`.
- **Payload size limits**: `express.json({ limit: '10kb' })` prevents large payload attacks.
- **UUID validation**: Admin routes validate UUID format before database queries.

### Architecture Strengths

- **Clean route modularization**: Auth, payment, mentor, newsletter, and admin routes are separated into distinct modules with clear responsibilities.
- **Database-backed caching**: Horoscope and numerology caches survive server restarts (unlike in-memory caches on ephemeral platforms like Railway).
- **Freemium gate architecture**: The hard gate (`requirePremium`) and soft gate (`requirePremiumSoft`) middleware pattern is well-designed, allowing flexible monetization per endpoint.
- **JIT user repair in login flow**: The login route handles the edge case where a Supabase auth user exists but the `public.users` record is missing, auto-creating it.
- **Idempotent webhook handling**: Stripe webhook handlers use `upsert` with `onConflict`, making them safe to process duplicate events.

### Frontend Strengths

- **XSS-safe toast notifications**: `auth-client.js` builds toast DOM elements using `textContent` instead of `innerHTML`.
- **Client-side premium verification**: The `Premium.checkStatus()` function validates against the server, not just local state.
- **Centralized API configuration**: `api-config.js` provides a single source of truth for API URLs with environment detection.
- **PWA support**: Service worker with stale-while-revalidate, manifest.json, and offline fallback are properly configured.
- **Accessible skip link**: `index.html:97` includes a "Skip to main content" link.

### SEO Strengths

- **Schema.org structured data**: Organization and WebSite schemas with SearchAction.
- **Open Graph and Twitter Card meta tags**: Proper social sharing metadata.
- **Semantic HTML**: Correct `lang="cs"`, viewport meta, robots meta.
- **Pre-generated compatibility pages**: 144 static HTML pages for `partnerska-shoda/` provide excellent SEO surface area for long-tail keywords.
- **Sitemap and robots.txt**: Both present and configured.

### Code Quality Strengths

- **Consistent error response format**: All endpoints return `{ success: boolean, error?: string }`.
- **Input sanitization in mentor chat**: Control character stripping before sending to AI.
- **Zodiac sign whitelisting**: Only the 12 valid Czech zodiac names are accepted.
- **Email validation**: Newsletter uses a proper regex with TLD length requirement.
- **Pagination with metadata**: Reading history returns `{ page, limit, total, totalPages }`.

---

## Risk Priority Matrix

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | C2 - Service role key bypass | Medium | Data leak |
| P0 | C4 - Crystal ball cost abuse | Low | Financial |
| P1 | C1 - JWT secret duplication | Low | Auth failure |
| P1 | C3 - 30-day token, no revocation | Medium | Account takeover |
| P1 | W2 - Profile endpoint auth bypass | Low | Auth weakness |
| P1 | W3 - isPremiumUser inconsistency | Low | Revenue loss |
| P2 | C5 - Hardcoded Stripe test key | Low | Deployment risk |
| P2 | W1 - Deprecated xss-clean | Medium | XSS risk |
| P2 | W4 - Tarot cards validation | Low | Server crash |
| P2 | W6 - unsafe-inline CSP | Medium | XSS risk |
| P2 | W10 - Synastry input sanitization | Low | Prompt injection |
| P3 | W5 - Cache cleanup | Low | DB bloat |
| P3 | W8 - FOMO innerHTML | Low | Future XSS |
| P3 | W9 - Admin plan_type validation | Low | Data integrity |

---

*Review conducted against commit HEAD on branch `claude/setup-architect-role-TVZyV`.*
