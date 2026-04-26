# Mystická Hvězda - Improvement Analysis

A comprehensive analysis of the codebase identifying bugs, security issues, architectural weaknesses, performance bottlenecks, and feature opportunities.

---

## 1. CRITICAL: Security Issues

### 1.1 Hardcoded JWT Secret Fallback
**File:** `server/middleware.js:4`
```js
const JWT_SECRET = process.env.JWT_SECRET || 'tajne-heslo-hvezdy-123';
```
The middleware uses a hardcoded fallback secret. While `auth.js` correctly exits in production when `JWT_SECRET` is missing, the middleware file has its own independent fallback that would be used even in production if the env var is absent during import. These two files disagree on the default secret (`tajne-heslo-hvezdy-123` vs `dev-insecure-secret-placeholder`), which could cause token verification failures between modules.

**Fix:** Centralize the JWT secret into a single config module and import it everywhere. Remove all hardcoded fallbacks in production.

### 1.2 Gemini API Key Exposed in URL
**File:** `server/services/gemini.js:75`
```js
const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, { ... });
```
The API key is passed as a query parameter. This means it will appear in server logs, proxy logs, and potentially browser network tools if ever called client-side. Google's Gemini API supports header-based authentication.

**Fix:** Use the `x-goog-api-key` header instead of the query parameter.

### 1.3 XSS in Toast Notifications
**File:** `js/auth-client.js:128-133`
```js
toast.innerHTML = `
    <div class="toast__title">${title}</div>
    <div class="toast__message">${message}</div>
`;
```
The `showToast` method uses `innerHTML` with unsanitized input. If an API error message contains HTML/script content, it could lead to XSS. The same pattern appears in `premium-gates.js:74` with `displayMessage`.

**Fix:** Use `textContent` instead of `innerHTML`, or sanitize inputs before rendering.

### 1.4 Activate-Premium Endpoint is Unprotected
**File:** `server/auth.js:36-67` and `server/auth.js:241-271`
The `/activate-premium` route is defined **twice** and allows any authenticated user to upgrade themselves to premium without any payment verification. This is labeled "MVP simulation" but would be a critical exploit in production.

**Fix:** Remove or disable the activate-premium endpoint before production launch. Gate premium activation exclusively through the Stripe webhook flow.

### 1.5 Admin Email Allowlist is Hardcoded
**File:** `server/middleware.js:182-185`
```js
const ADMIN_EMAILS = [
    'pavel.hajek1989@gmail.com',
    'test_admin@example.com'
];
```
Admin emails are hardcoded including a test email. This should be environment-driven and the test email removed.

**Fix:** Move admin emails to environment variables or a database `roles` column.

### 1.6 Stripe Webhook Signature Bypass
**File:** `server/payment.js:119-122`
```js
} else {
    console.warn('[STRIPE] WARNING: STRIPE_WEBHOOK_SECRET not set...');
    event = JSON.parse(rawBody.toString());
}
```
When `STRIPE_WEBHOOK_SECRET` is not configured, the webhook blindly trusts the incoming payload. An attacker could forge webhook events to grant themselves premium access.

**Fix:** In production, refuse to process webhooks without signature verification. Fail closed, not open.

---

## 2. BUGS & Code Issues

### 2.1 Duplicate Route Definitions
**File:** `server/auth.js`
- `/activate-premium` is registered twice (lines 36-67 and 241-271) with slightly different implementations
- The second one uses callback-style `jwt.verify`, the first uses synchronous `try/catch`

**File:** `server/index.js`
- Routes are mounted twice:
  - Line 102: `app.use('/api/auth', authRoutes)`
  - Line 444: `app.use('/auth', authRoutes)` (without `/api` prefix)
  - Line 105: `app.use('/api/payment', paymentRoutes)`
  - Line 446: `app.use('/api/payment', paymentRoutes)` (duplicate)
- Admin routes are defined both in `admin.js` (mounted at line 106) AND inline in `index.js` (lines 454-503)

**Fix:** Audit all route registrations and remove duplicates. Ensure each endpoint is defined exactly once.

### 2.2 Duplicate Reading Endpoints
**File:** `server/auth.js:361-475` and `server/index.js:512-641`
The user readings CRUD endpoints (`POST /user/readings`, `GET /user/readings`, `PATCH /user/readings/:id/favorite`) are implemented in **both** `auth.js` and `index.js`. They have subtly different implementations (auth.js uses manual JWT verify, index.js uses `authenticateToken` middleware). Both sets are active due to the double mounting.

**Fix:** Keep only the `index.js` versions (which use the `authenticateToken` middleware properly) and remove duplicates from `auth.js`.

### 2.3 Missing `supabase` Import in index.js
**File:** `server/index.js:323`
The `getCachedNumerology` function at line 323 uses `supabase` but the import from `db-supabase.js` doesn't appear until line 506. Due to ES module hoisting this works, but it makes the code fragile and hard to follow.

**Fix:** Move all imports to the top of the file.

### 2.4 Premium Check Inconsistency
**File:** `server/middleware.js:52` vs `server/payment.js:30-31`
The `requirePremium` middleware checks plan types with strict array matching:
```js
['premium_monthly', 'exclusive_monthly', 'vip'].includes(subscription.plan_type)
```
While `isPremiumUser` in payment.js uses loose `.includes()` matching and includes additional types:
```js
['premium_monthly', 'exclusive_monthly', 'vip', 'premium_yearly', 'premium_pro'].some(p =>
    subscription.plan_type && subscription.plan_type.toLowerCase().includes(p)
)
```
This means `premium_yearly` users would pass the payment check but get **blocked** by the middleware. Users who pay for an annual plan cannot access premium features.

**Fix:** Centralize the premium plan type list and checking logic into one shared utility. The middleware is missing `premium_yearly` and `premium_pro`.

### 2.5 Dead Code: Credits System
**Files:** `server/middleware.js:119-146`, `server/middleware.js:195-198`
The `checkFeatureAccess` middleware and `billCredits` function are remnants of a removed credits system. They make database calls that accomplish nothing.

**Fix:** Remove dead code entirely or implement the intended functionality.

### 2.6 Service Worker Caches Wrong Files
**File:** `service-worker.js:13`
```js
'/js/components.js',
```
This file doesn't exist at that path (the actual components are in `/js/ui/components.js`). This would cause the service worker installation to fail silently.

**Fix:** Update the static asset list to match actual file paths.

---

## 3. ARCHITECTURE Improvements

### 3.1 Monolithic index.js (695 lines)
The main server file contains inline route handlers, cache logic, database queries, and inline admin routes. This makes it difficult to test, maintain, or modify individual features.

**Recommendation:** Extract each feature into its own route module:
- `routes/crystal-ball.js`
- `routes/tarot.js`
- `routes/horoscope.js`
- `routes/numerology.js`
- `routes/astrocartography.js`
- `routes/readings.js`
- `services/cache.js` (for numerology cache functions)

### 3.2 No Input Validation Layer
API endpoints accept user input without structured validation. For example:
- `POST /api/crystal-ball` accepts any `question` string without length limits
- `POST /api/tarot` doesn't validate that `cards` is actually an array
- `POST /api/natal-chart` doesn't validate date formats

**Recommendation:** Add a validation library (e.g., `zod`, `joi`, or `express-validator`) and define schemas for each endpoint.

### 3.3 Inconsistent Auth Patterns
Some routes use the `authenticateToken` middleware, others manually extract and verify JWT tokens:
- `index.js` endpoints: use middleware
- `auth.js` endpoints: manual JWT extraction in each handler

**Recommendation:** Use the `authenticateToken` middleware consistently across all protected routes.

### 3.4 No Centralized Error Handling
Each endpoint has its own try/catch with inline error responses. There's no global error handler.

**Recommendation:** Add Express error-handling middleware that catches unhandled errors, logs them consistently, and returns standardized error responses.

### 3.5 Frontend JavaScript is Not Bundled
The app loads 15+ separate JS files via `<script>` tags. This means:
- Many HTTP requests on each page load
- No tree-shaking or minification
- Tight coupling to global `window` objects (`window.Auth`, `window.Premium`, etc.)

**Recommendation:** Consider a lightweight bundler (Vite, esbuild) for production builds while keeping the simple development workflow.

---

## 4. PERFORMANCE Improvements

### 4.1 N+1 Queries in Premium Checks
**File:** `server/index.js:143`, `server/index.js:206`
For tarot and synastry endpoints, the premium check is done via a dynamic import + function call:
```js
const isPremium = await import('./payment.js').then(m => m.isPremiumUser(userId));
```
This re-imports the module on every request and makes a separate database call that duplicates what `requirePremium` middleware already does.

**Fix:** Use middleware (`requirePremiumSoft`) and access `req.isPremium` instead of making redundant DB queries.

### 4.2 No Connection Pooling Awareness
The Supabase client is initialized once, but there's no retry logic for transient database errors, and no circuit breaker for the Gemini API. If Gemini is down, every request blocks for the full timeout.

**Recommendation:** Add timeout configuration to the Gemini fetch call and implement a circuit breaker pattern for external API calls.

### 4.3 Horoscope Cache Key Includes Context Hash
**File:** `server/index.js:237-238`
```js
const contextHash = context.length > 0 ? Buffer.from(context.join('')).toString('base64').substring(0, 10) : 'nocontext';
```
If users send personal journal context with horoscope requests, the cache becomes effectively per-user, defeating its purpose. Most horoscope requests with context will be cache misses.

**Recommendation:** Separate the cached base horoscope from the personalized layer. Generate the base horoscope from cache, then optionally personalize it with a lighter AI call.

### 4.4 Mentor Fetches Data Sequentially
**File:** `server/mentor.js:25-116`
The mentor endpoint makes 3 sequential database queries (profile, history, readings) before calling Gemini. These are independent and could run in parallel.

**Fix:**
```js
const [profile, history, readings] = await Promise.all([
    fetchProfile(userId),
    fetchHistory(userId),
    fetchReadings(userId)
]);
```

### 4.5 Large CSS File (78KB)
**File:** `css/style.v2.css`
A single 78KB CSS file with no code-splitting. Critical CSS for above-the-fold content is mixed with styles for all pages.

**Recommendation:** Extract critical CSS for the homepage and lazy-load page-specific styles.

---

## 5. RELIABILITY & Robustness

### 5.1 No Gemini API Retry or Fallback
**File:** `server/services/gemini.js`
If the Gemini API returns a 429 (rate limit) or 503 (service unavailable), the request fails immediately with no retry. For a user-facing product, this means intermittent failures.

**Recommendation:** Add exponential backoff retry (1-2 retries) for retriable HTTP status codes. Consider caching common AI responses more aggressively.

### 5.2 Silent Database Error Swallowing
**File:** `server/mentor.js:126`
```js
} catch (dbError) { }
```
Database errors when saving mentor messages are silently swallowed. If the messages table has issues, the chat appears to work but history is lost.

**Recommendation:** Log all database errors, even non-critical ones.

### 5.3 JWT Tokens Have 30-Day Expiry with No Refresh
**File:** `server/auth.js:219`
Tokens expire after 30 days with no refresh token mechanism. Users will be abruptly logged out after 30 days with no graceful recovery.

**Recommendation:** Implement a refresh token flow, or use shorter-lived access tokens (1 hour) with a refresh endpoint.

### 5.4 No Rate Limiting on AI Endpoints
**File:** `server/index.js:65-71`
The global rate limiter allows 100 requests per 15 minutes across ALL `/api/` routes. AI-powered endpoints (tarot, horoscope, mentor) are expensive and should have stricter per-endpoint limits to prevent abuse.

**Recommendation:** Add endpoint-specific rate limits for AI-powered routes (e.g., 10 AI requests per 15 minutes for free users).

---

## 6. FEATURE & UX Improvements

### 6.1 Payment Mode is One-Time, Not Subscription
**File:** `server/payment.js:85`
```js
mode: 'payment',
```
Stripe checkout is set to `payment` (one-time) mode, but the UI and plan names suggest recurring subscriptions ("monthly", "yearly"). Users pay once and get premium for the set period, but there's no auto-renewal. When the period expires, the user silently loses premium.

**Recommendation:** Switch to `mode: 'subscription'` with Stripe Price objects for true recurring billing, OR clearly communicate the one-time nature in the UI and add renewal reminders.

### 6.2 No Subscription Expiration Handling
There's no cron job or scheduled task that checks for expired subscriptions. The expiration check happens only at request time via middleware. This means:
- Users receive no warning before expiration
- No re-engagement emails are sent
- No graceful downgrade flow exists

**Recommendation:** Add a scheduled job (cron or Supabase edge function) that:
1. Sends a reminder email 3 days before expiration
2. Marks expired subscriptions as `inactive`
3. Optionally sends a "we miss you" email after expiration

### 6.3 No Loading States for AI Responses
AI generation takes 2-5 seconds. Without streaming, users see no feedback during this time.

**Recommendation:** Implement Gemini's streaming API (`streamGenerateContent`) to show responses as they arrive, dramatically improving perceived performance.

### 6.4 No Offline Functionality for Core Features
The PWA service worker caches static assets but none of the core features work offline. Previously generated readings could be cached locally for offline viewing.

**Recommendation:** Cache user readings in IndexedDB for offline access to their reading history.

### 6.5 No Email Verification Enforcement
**File:** `server/auth.js:80-93`
Registration triggers a Supabase email confirmation, but the login flow at `server/auth.js:130` uses `signInWithPassword` which succeeds even for unverified accounts in some Supabase configurations.

**Recommendation:** Explicitly check `authData.user.email_confirmed_at` before issuing a JWT.

### 6.6 Missing "Forgot Password" Flow
The `PUT /api/user/password` endpoint requires an existing valid token. There's no "forgot password" flow for users who can't log in.

**Recommendation:** Add a `POST /api/auth/forgot-password` endpoint that uses Supabase's `resetPasswordForEmail` method.

---

## 7. CODE QUALITY

### 7.1 Inconsistent Error Messages Language
Backend error messages are a mix of Czech and English:
- Czech: `'Křišťálová koule je zahalena mlhou...'`
- English: `'Failed to fetch users'`
- Mixed: `'Nepodařilo se uložit výklad: ' + error.message` (Czech prefix + English error)

**Recommendation:** Return error codes (`CRYSTAL_BALL_ERROR`, `AUTH_REQUIRED`) and let the frontend handle localization.

### 7.2 Console Logging in Production
Emoji-heavy `console.log` statements throughout the codebase:
```js
console.log(`🔮 Horoscope cache: Using database storage`);
console.log(`📍 Astrocartography request received:`, req.body);
```
These expose internal details and clutter logs in production.

**Recommendation:** Use a proper logging library (winston, pino) with log levels. Remove request body logging.

### 7.3 No TypeScript
The entire codebase is untyped JavaScript. For a production SaaS app handling payments, this increases the risk of runtime type errors.

**Recommendation:** Consider gradual TypeScript adoption, starting with the backend (API contracts, database types).

---

## 8. TESTING Gaps

### 8.1 No Integration Tests for Payment Flow
The Stripe checkout and webhook flow has no test coverage. This is the most critical business logic.

### 8.2 No Frontend Tests for Core Flows
Only numerology and synastry calculations have frontend tests. The auth flow, reading save/load, and premium gating have no test coverage.

### 8.3 Test Mocking is Fragile
Tests use `jest.unstable_mockModule` which is experimental and may break across Node.js versions.

**Recommendation:** Prioritize tests for:
1. Stripe webhook handling (premium activation)
2. Premium middleware (plan type validation)
3. Auth flow (register -> verify -> login -> token)
4. AI endpoint error handling

---

## Priority Matrix

| Priority | Issue | Impact | Effort |
|----------|-------|--------|--------|
| P0 | Premium plan type mismatch (2.4) | Users paying for yearly plans can't access premium | Low |
| P0 | Remove activate-premium bypass (1.4) | Any user can get free premium | Low |
| P0 | Stripe webhook signature bypass (1.6) | Attackers can forge premium access | Low |
| P1 | Duplicate route definitions (2.1, 2.2) | Unpredictable behavior, bugs | Medium |
| P1 | JWT secret inconsistency (1.1) | Auth failures between modules | Low |
| P1 | XSS in toast/paywall (1.3) | User security | Low |
| P1 | Gemini API key in URL (1.2) | Key exposure in logs | Low |
| P2 | Payment mode mismatch (6.1) | Business model confusion | Medium |
| P2 | No input validation (3.2) | Data integrity, potential crashes | Medium |
| P2 | Parallel DB queries in mentor (4.4) | Slow response times | Low |
| P2 | Service worker wrong paths (2.6) | Offline support broken | Low |
| P3 | Streaming AI responses (6.3) | UX improvement | Medium |
| P3 | Modularize index.js (3.1) | Maintainability | High |
| P3 | Subscription expiration handling (6.2) | Revenue retention | Medium |
| P3 | Add forgot-password flow (6.6) | UX completeness | Low |
