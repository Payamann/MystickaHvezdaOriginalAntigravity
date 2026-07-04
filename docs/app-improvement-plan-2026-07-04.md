# App Improvement Plan - 2026-07-04

Mandate (per `docs/operator-context.md`): paid conversion over new features. This document is a full-codebase analysis focused on quick wins and highest-value items. It cross-references `docs/profit-growth-roadmap-2026-05-01.md` (strategy) and `tasks/todo.md` (live sprint log) rather than duplicating them.

## Current Read

- The conversion infrastructure is unusually complete: first-party funnel events (`funnel_events`), an admin funnel report with stage rates (`GET /api/admin/funnel`), segment diagnostics (`npm run analyze:funnel`), growth-loop attribution audits (`npm run audit:growth-loop`), and a hardened checkout handoff with 7-day trial surfacing (todo Faze 1-3, shipped 2026-07-03/04).
- The core documented leak remains the auth handoff: before the Faze 1 fixes, 67 visitors with purchase intent on the auth page produced 6 form submissions (91% loss) and `purchase_completed=0`. The fixes are fresh and unverified against live data.
- The single strongest pattern in the codebase right now is **built-but-dormant infrastructure**. Several complete systems (web push, newsletter, lifecycle emails, PWA install) collect input or hold templates but never fire. Activating them is days of work each, not weeks.
- The share-image growth loop that just shipped for tarot ANO/NE is a proven, reusable template that currently covers ~2 of ~30 tool pages.

## Tier 0 - Verify now (hours, do before anything else)

### 0.1 VIP plan checkout may dead-end (potential revenue bug)

**RESOLVED 2026-07-04 — false alarm.** `vip-majestrat` has a live price ID in `LIVE_STRIPE_PRICE_IDS` (`server/config/constants.js:40`), an env override (`STRIPE_PRICE_VIP_MAJESTRAT_MONTHLY`), and `buildSubscriptionLineItem()` in `server/payment.js` falls back to inline `price_data` even without a configured price. VIP checkout is safe on all three layers.

### 0.2 Re-measure the auth-handoff leak post-Faze-1

Run `npm run analyze:funnel` against live `funnel_events` for the window since the Faze 1 deploy. The diagnostic distinguishes navigation-loss vs form-friction vs email-verification loss at the `authHandoffToCheckoutRequestRate` stage.

- Action: confirm whether the 91% loss improved; pick the next checkout fix based on which sub-stage still bleeds, not on assumption.
- Value: keeps the highest-leverage funnel stage under active measurement instead of shipping blind.

## Tier 1 - Quick wins (days each, mostly activations of existing code)

### 1.1 Ship the daily push notification send job

State: subscriptions are collected (`server/routes/push.js` -> `push_subscriptions`), the service worker handles `push` and `notificationclick` (`service-worker.js:178-211`), and the opt-in banner in `js/push-notifications.js` promises "denni horoskop kazdy den rano v 8:00" - but the only send path is the manual admin `POST /api/push/send-test`. **No scheduled job sends anything.**

- Action: add a cron in `server/index.js` (mirror the daily horoscope email schedule around line 1079) that reuses the send logic from `server/routes/push.js` and the cached daily horoscope content from `send-daily-horoscope.js`. Handle expired/invalid subscriptions (410 cleanup).
- Also: `js/push-notifications.js` loads on only 4 pages (`tarot.html`, `lunace.html`, `pl/horoskopy.html`, `sk/horoskopy.html`) - it is missing from `index.html`, `horoskopy.html` and `profil.html`. Load it sitewide via the shared bootstrap.
- Value: a free daily-return channel that users were already promised. Directly serves the retention priority in the operator context.

### 1.2 Extend the PNG share-image growth loop beyond tarot ANO/NE

State: the watermarked 1080x1350 canvas share (real card image + teaser + URL + `navigator.share` with download fallback and share/cancel/download analytics) exists only in `js/tarot-ano-ne.js` (~lines 769-955, plus the SK variant) and a sign-card variant in `js/horoscope-share.js`. All other identity-expressive tools get only URL-copy via `js/share-result.js`.

- Action: extract the canvas generator into a shared module, then roll out to the three most shareable results first:
  1. `partnerska-shoda.html` - compatibility percentage (most inherently shareable result on the site),
  2. `tarot-karta-dne.html` - daily card (habit surface; repeat shares),
  3. `minuly-zivot.html` - past-life archetype (identity-expressive).
  Later wave: `andelske-karty.html`, `runy.html`, `numerologie.html`, `cinsky-horoskop.html`.
- Keep `data-*` attribution vocabulary aligned with `server/config/growth-loop.js` so `npm run audit:growth-loop` stays green; reuse the `*_image_shared` event naming from tarot ANO/NE.
- Value: replication of a proven acquisition loop; zero new concept risk.

### 1.3 Newsletter welcome email

State: `server/newsletter.js` stores emails into `newsletter_subscribers` and sends **nothing** - no confirmation, no welcome, no broadcast - despite ~20 ready templates in `server/email-service.js` and a working `email_queue` job (`server/jobs/email-queue.js`).

- Action: on subscribe, enqueue a welcome email (existing queue + a small template) that routes to the top free tools with proper `source` attribution. Include unsubscribe handling consistent with `docs/email-operations.md`.
- Value: stops wasting every captured email address; opens the door to Tier 2 lifecycle sequences.

### 1.4 SEO hygiene: duplicate page + compatibility cluster overlap

**RESOLVED 2026-07-04 — both already handled by earlier work.**
- `horoskop/vodnár.html` is a deliberate legacy page: `noindex, follow`, canonical to `vodnar.html`, excluded from the sitemap, and 301-redirected via `STATIC_PAGE_REDIRECTS` in `server/index.js`. Generated intentionally by `server/scripts/generate-zodiac-pages.js`.
- `kompatibilita/*` pages canonicalize to their `partnerska-shoda/*` counterparts (see commit "Consolidate partner compatibility SEO cluster"), so there is no cannibalization.

### 1.5 PWA install prompt

State: the PWA is fully installable (valid `manifest.json`, offline fallback, precache) but there is **no `beforeinstallprompt` handler anywhere** - installation is never suggested.

- Action: add a small module that captures `beforeinstallprompt` and surfaces a subtle install CTA on the 2nd+ visit or from `profil.html`, with analytics on prompt shown/accepted/dismissed.
- Value: home-screen presence feeds the daily-ritual retention loop (streaks, daily card, push).

## Tier 2 - High value (1-2 weeks each)

### 2.1 Free-user lifecycle email sequence (roadmap P1, still unbuilt)

State: onboarding/upgrade-reminder/churn-recovery/trial-reminder emails exist as templates and admin-manual endpoints (`server/routes/email-automation.js`), but automated sequences fire **only from the Stripe purchase webhook** (`server/payment.js:1888-1909`) - paid users only. Free registered users receive nothing after signup.

- Action: implement the Day 0/1/3/6 sequence keyed to the user's first-interest feature (already captured by onboarding in `js/onboarding.js` and stored server-side), delivered through `email_queue`, respecting the existing `email_preferences` table.
- Value: this is the missing conversion mechanism between free signup and paid - the roadmap's own top unbuilt P1 item.

### 2.2 Post-purchase bridge from one-time products to subscription

State: `PRODUCT_CATALOG` entries for `rocni_horoskop_2026` and `osobni_mapa_2026` describe a "bridge into Premium", but no shipped flow upsells a completed one-time buyer into a subscription.

- Action: after one-time purchase delivery, show an in-product CTA and enqueue a follow-up email offering the trial with the buyer's feature context; track with dedicated funnel events.
- Value: one-time buyers are proven payers - the cheapest audience to convert to recurring revenue.

### 2.3 Generate the `jmena/` programmatic cluster

State: `data/jmena.json` holds ~280 Czech names (112 KB) and `llms.txt` advertises "280+ names", but `jmena/` contains only an index page. Generator patterns already exist (`scripts/generate-seo-pages.js`, `scripts/update-partnerska-shoda-seo.mjs`).

- Action: generate per-name pages (meaning, numerology, name-day, zodiac affinity) with canonical/sitemap/audit integration (`npm run audit:site`, `npm run sitemap:generate`), interlinked with the numerology tools with proper `source` attribution.
- Value: the largest ready-made SEO surface in the repo at near-zero content cost. (Per operator context, sequence this after the conversion items above.)

### 2.4 Checkout-cancel save offer and annual-discount experiment

State: the checkout-cancel recovery panel on `cenik.html?payment=cancel` ships already (roadmap item), but the P2 monetization experiments - a save offer at cancel and an annual-plan discount after repeat sessions - are not built. The retention modal in `js/retention.js` already has STAY25 discount mechanics to reuse.

- Action: run one experiment at a time, measured via existing `sourceFeatureSegments` in the admin funnel report.
- Value: direct conversion lift at the single highest-intent moment in the funnel.

## Tier 3 - Later / bigger bets

- Deepen SK/PL localization using `sk/tarot-ano-nie.html` (626 words, FAQ schema, hreflang) as the template; current SK/PL pages are ~70-word stubs. Start with the 5 highest-traffic tools.
- Numerology-number and angel-card-meaning programmatic clusters (roadmap P2).
- Per-dream pages generated from `data/dreams.json` (split of `snar.html`); `ritualy/` expansion (currently 2 pages).
- Ops hardening from `docs/audit-hardening-2026-04-30.md`: alerting on Stripe webhook failures and 4xx/5xx spikes; a real Lighthouse/WebPageTest pass against production.

## Measurement

- Funnel items: `GET /api/admin/funnel` stage rates (`authHandoffToCheckoutRequestRate`, `checkoutRequestToSessionRate`, `conversionRate`) and `npm run analyze:funnel` segments; north-star events defined in `server/config/growth-loop.js`.
- Share loop: `*_image_shared` / share-cancel / download analytics events, per tool, matching the tarot ANO/NE pattern.
- Email and push: `email_queue` outcomes, `last_sent_at` dedup fields, unsubscribe rates; push delivery vs 410-expired cleanup counts.
- SEO: `npm run audit:site` and `npm run sitemap:check` stay green; Search Console impressions for new clusters after deploy.

## Implementation status (2026-07-04)

Tier 1 shipped in this branch:
- **1.1** `server/jobs/daily-push.js` + cron in `server/index.js` (06:00 UTC + startup/hourly catch-up, gated by `ENABLE/DISABLE_DAILY_PUSH_NOTIFICATIONS`), Prague-day dedup via new `push_subscriptions.last_notified_at` (`migrations/20260704_push_daily_notifications.sql`), 404/410 subscription cleanup. `push-notifications.js` now loads on `index.html`, `horoskopy.html`, `profil.html`. Requires `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` in production env.
- **1.2** Shared `js/share-image-canvas.js` (branded 1080x1350 canvas + share-first delivery with `*_image_shared|_share_cancelled|_saved` analytics). Wired into `partnerska-shoda.html` (score card, `partner_match_image_*`), `minuly-zivot.html` (past-life card, `past_life_image_*`), and `tarot-karta-dne.html` (existing canvas upgraded from download-only to native share, `tarot_daily_card_image_*`).
- **1.3** `newsletter_welcome` template in `server/email-service.js`, sent non-blocking on subscribe in `server/newsletter.js`; stateless HMAC one-click unsubscribe (`GET /api/newsletter/unsubscribe`) with shared CSP-safe renderer extracted to `server/utils/unsubscribe-page.js`.
- **1.4** Verified as already-handled (see above); no change needed.
- **1.5** `js/pwa-install.js`: captures `beforeinstallprompt`, offers install on 2nd+ visit after cookie consent, never stacks with the push banner, 30-day dismiss cooldown, `pwa_install_*` analytics. Loaded on index, horoskopy, profil, tarot.

Next up (not in this branch): Tier 0.2 funnel re-measurement against live data, then Tier 2 starting with the free-user lifecycle email sequence.

## Suggested sequence

1. Tier 0 both items (same day).
2. Tier 1 in order 1.1 -> 1.2 -> 1.3 -> 1.4 -> 1.5; each is independently shippable.
3. Tier 2 starting with 2.1 (lifecycle emails) as soon as 1.3 proves the email path end-to-end.
4. Revisit Tier 3 only when the funnel report shows the conversion items above have stabilized, per the operator-context guardrail against feature expansion during funnel work.
