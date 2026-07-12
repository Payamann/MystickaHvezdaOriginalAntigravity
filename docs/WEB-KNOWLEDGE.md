# WEB-KNOWLEDGE — znalostní báze webu Mystická Hvězda

| | |
|---|---|
| **Datum analýzy** | 2026-07-12 |
| **Commit** | `89fa8982` |
| **HTML stránek** | 908 (896 v sitemap.xml) |
| **Účel** | Výchozí mapa pro jakýkoli audit (konverze, SEO, výkon, UX) — číst PŘED analýzou, neobjevovat kód znovu |

Navazující dokumenty (neduplikovat, odkazovat): [docs/operator-context.md](operator-context.md) (funnel strategie, revenue-truth monitoring, decision rules), [docs/app-improvement-plan-2026-07-04.md](app-improvement-plan-2026-07-04.md) (stav vylepšení po tierech — ⚠️ status sekce stárnou, „unbuilt" tvrzení ověřit grepem), [docs/seo-growth-plan-2026-07-04.md](seo-growth-plan-2026-07-04.md) (SEO strategie + keyword mapa), `docs/analyza-webu-2026-07-11.md` (na origin/main: bodovaný audit 10 oblastí, thin content ~520 stránek, skóre 7,8/10), [tasks/lessons.md](../tasks/lessons.md) (zaplacené chyby — číst vždy).

> **Post-scriptum 2026-07-12:** origin/main mezitím na `e565256f` — 836 obsahových stránek přešlo na `js/dist/core.js` bundle (api-config+templates+auth-client+components, 6→3 script tagy; nástrojové stránky zatím ne), +11 blogových článků, `server/utils/sanitize-input.js` nahrazuje xss-clean. Tvrzení o script tazích v §2 platí pro nástrojové/funnel stránky; obsahové clustery už jedou přes core.js.

---

## 1. Přehled

Česká ezoterická platforma (astrologie, tarot, numerologie, runy…) monetizovaná předplatným přes Stripe + jednorázovými PDF produkty. Stack: **statické HTML + vanilla JS** (IIFE bundly přes esbuild do `js/dist/`), **Express server** (`server/index.js`, 1210 ř.), **Supabase** (DB), **Railway** (deploy, za Cloudflare), **Resend** (e-maily), **Anthropic API** (AI interpretace), **node-schedule** (cron joby), **web-push**. Doména `https://www.mystickahvezda.cz`.

- North star: `weekly_ritual_to_paid_intent` — uživatel dokončí osobní rituál v týdnu a vytvoří placený intent (`server/config/growth-loop.js:23`).
- Plány (`server/config/constants.js:43`): `poutnik` zdarma → `pruvodce` 199 Kč/měs (trial 7 dní) / 1 990 Kč/rok → `osviceni` 499/měs / 4 990/rok → `vip-majestrat` 999/měs (bez trialu). Live Stripe price ID v `constants.js:35`.
- Jednorázové produkty: `rocni_horoskop_2026`, `osobni_mapa_2026` (PDF přes headless Chromium na Railway).

## 2. Mapa stránek po vrstvách

| Vrstva | Počet | Kde | Šablona / generátor | Poznámka |
|---|---|---|---|---|
| Konverzní nástroje | ~30 | root (`natalni-karta.html`, `tarot*.html`, `partnerska-shoda.html`, `numerologie.html`, `runy.html`, `andelske-karty.html`, `kristalova-koule.html`, `minuly-zivot.html`, `mentor.html`, `lunace.html`, `shamansko-kolo.html`, `aura.html`, `biorytmy.html`, `astro-mapa.html`, `osobni-mapa.html`, `rocni-horoskop.html`, `cinsky-horoskop.html`…) | ruční | freemium gaty přes `js/premium-gates.js` + `js/freemium-*.js` |
| SEO cluster: jména | 281 | `jmena/` | `npm run jmena:generate` ← `data/jmena.json` | |
| SEO cluster: snář | 164 | `snar/` | `npm run snar:generate` ← `data/dreams.json` | |
| SEO cluster: partnerská shoda | 145 | `partnerska-shoda/` | generováno (12×12 párů + index) | duplicitní směry kanonizují, unikátních ~78 |
| SEO cluster: tarot významy | 78 | `tarot-vyznam/` | `npm run tarot:generate-meaning-hub` ← `data/tarot-cards.json` | |
| Blog | 63 | `blog/` | `templates/blog-post.html` + `npm run blog:cluster-links` | 1–2 posty/týden dle seo-growth-plan |
| SEO cluster: andělské karty | 44 | `andelske-karty/` | `npm run andelske-karty:generate` ← `data/angel-cards.json` | |
| Slovník | 30 | `slovnik/` | `templates/dictionary-term.html` ← `data/dictionary-index.json` | DefinedTerm schema |
| Horoskop znamení | 13 | `horoskop/` | `server/scripts/generate-zodiac-pages.js` | + dynamické denní stránky server-rendered (`server/routes/horoscope-pages.js`) |
| Numerologie čísla | 12 | `numerologie/` | `npm run numerologie:generate` ← `data/numerology-numbers.json` | |
| Kvízy | 8 | `testy/` | ruční + `js/dist/quiz/*` | |
| Rituály | 2 | `ritualy/` | ruční | rozšířit jen podle GSC dat (seo-plan bod 7) |
| Funnel/účet | 6 | `index`, `onboarding`, `prihlaseni`, `profil`, `cenik`, `jak-to-funguje` | ruční | onboarding/prihlaseni/profil = noindex |
| Právní/podpora | 8 | `podminky`, `ochrana-soukromi`, `soukromi`, `faq`, `kontakt`, `o-nas`, `404`, `offline` | ruční | |
| Mutace SK/PL | 7+6 | `sk/`, `pl/` | ruční překlady top nástrojů | hreflang cs/sk/pl/x-default; clustery NEpřeložené |
| ~~kompatibilita/~~ | 0 | smazáno (`fd1fcb49`) | — | server 301 → `partnerska-shoda/` (viz §6 redirecty) |

**Klíčová pravidla vrstvy:** (a) obsah generovaných stránek se mění v generátoru + `data/*.json`, ne v HTML; (b) každá stránka načítá `/js/dist/analytics-init.js`, nástroje navíc `analytics.js`, `auth-client.js`, `premium-gates.js` (viz `index.html` script blok); (c) sdílený header/footer v `components/`; (d) `*-copy-fixes.js` soubory **přepisují texty v HTML za běhu** — při změně copy vždy grep `js/` na tentýž element (lessons.md).

## 3. Funnel (runtime ověřeno 2026-07-12, test režim)

```
Vstup: SEO stránka (source=seo_* auto-kontext, js/analytics.js:25) nebo index.html
  │  nástroj zdarma → first_value_completed
  ▼
prihlaseni.html  … checkout_auth_required / checkout_auth_page_viewed
  │  POST /api/auth/register (CSRF z GET /api/csrf-token, header x-csrf-token)
  │  → httpOnly cookie `auth_token` (JWT, 7 dní) + JS-čitelný marker `logged_in=1`
  ▼
onboarding.html  … POST /api/auth/onboarding/complete
  │  → spouští aktivační lifecycle e-maily Day 0/1/3/6 (server/auth.js:809)
  ▼
profil.html (návratová destinace, dashboard = js/dist/profile/dashboard.js)
  ▼
cenik.html  … js/cenik.js čte GET /api/plans (manifest z constants.js) … pricing_plan_cta_clicked
  │  POST /api/payment/create-checkout-session (auth povinný) → Stripe Checkout
  ▼
Stripe → webhook /api/payment/webhook  +  fallback: success page → dashboard.js pošle session_id
       → jednorázové PDF: reconciliation job (verify přes Stripe API před fulfillmentem)
```

Runtime ověřeno (server v bezpečném e2e režimu, viz §7): stránky funnelu 200; registrace → onboarding → profil funguje včetně cookies; `POST /api/payment/funnel-event` přijímá **`eventName`** (ne eventType — `server/payment.js:965`); `POST /api/analytics/event` přijímá; redirecty 301 fungují.

**⚠️ Platby — kritický kontext (lessons 2026-07-07):** `payment_events` tabulka byla prázdná za celou historii = Stripe webhooky do produkce nikdy nedorazily (chybí/špatný endpoint na Stripe Dashboardu — může opravit jen Pavel). Předplatné se aktivuje jen success-page cestou; jednorázové PDF zachraňuje reconciliation job. Lokální `.env` = TEST klíč, produkce LIVE → Stripe dotazy z localu vidí jiná data.

Zachovávat napříč auth/onboarding/checkout: `source`, `feature`, `plan`, `redirect`, `entry_source`, `entry_feature` (guardrail v operator-context).

## 4. Analytika a měření

Tři vrstvy:

1. **GA4** (`G-H22CGHF34K`) — Consent Mode v2, default vše denied, opt-in (`js/analytics-init.js:48`; od commitu `89fa8982` je i cookie banner opt-in). Tag se načte až po souhlasu.
2. **First-party analytics** — `js/analytics.js` → `POST /api/analytics/event` → tabulka `analytics_events`. **Gated souhlasem** (`getAnalyticsPreference()`, `js/analytics.js:85` — čte `mh_cookie_prefs`). Attribution first/last touch s 30denním TTL, UTM + `source`/`feature` klíče, automatické SEO landing kontexty (`MH_SEO_LANDING_PAGES` + patterny, `js/analytics.js:25-76`).
3. **Funnel events** — server-owned kontrakt `server/config/growth-loop.js`: `CORE_FUNNEL_EVENTS` (21 eventů: `first_value_completed`, `activation_completed`, `paywall_viewed`, `pricing_plan_cta_clicked`, `checkout_auth_required` → … → `subscription_checkout_completed`, `one_time_purchase_completed`) + `REVENUE_HEALTH_EVENTS` (8). Klient: `js/growth-loop-client.js` → `POST /api/payment/funnel-event`; server zapisuje sám u webhooků. Tabulka `funnel_events`. Report: `GET /api/admin/funnel` (JSON/CSV, segmenty source×feature, trend) v `admin.html`.

**Známé mezery měření:** klientské eventy (vč. `purchase_completed` v GA4) jsou consent-gated → podhodnocené; server-side purchase eventy závisí na webhoocích, které nechodí (§3). Pravda o výnosech = `npm run monitor:revenue-truth:production` + Stripe API, ne GA4. Interpretační pravidla propadů: operator-context „Decision Rules".

Nástroje: `npm run analyze:funnel`, `export-live-funnel.mjs`, `revenue-truth-monitor.mjs`, `npm run audit:growth-loop` (hlídá slovník `data-*` atributů proti growth-loop.js).

## 5. Technický základ

**Server** (`server/index.js`): helmet + CSP skládané v `server/utils/csp.js` — **žádný inline JS** (jen per-page sha256 hashe pro inline JSON-LD), žádné inline styly; CSRF = HMAC token (`GET /api/csrf-token` → header `x-csrf-token`) pro mutující /api requesty; rate limity (global, AI, sensitive); non-www → www 301; HTML cache v produkci `s-maxage=600, stale-while-revalidate=86400` přes Cloudflare (→ deploy ověřovat cache-busterem, lessons.md).

**API mounty** (`server/index.js:872-944`): `/api/auth`, `/api/newsletter`, `/api/contact`, `/api/mentor`, `/api/payment`, `/api/admin`, `/api/docs`, `/api/analytics`, oracle (AI limiter), `/api/horoscope`, briefing, `/api/numerology`, `/api/user`, `/api/angel-post`, `/api/subscribe/horoscope`, `/api/push`, `/api/past-life`, `/api/medicine-wheel`, `/api/rocni-horoskop`, `/api/osobni-mapa`. Plné schéma: `server/openapi.yaml`; ověřené kontrakty: [web-knowledge/api-endpoints.md](web-knowledge/api-endpoints.md).

**Cron joby** (env-gated, běží při startu serveru — pozor při lokálním spouštění, §7): email-queue, data-retention, **one-time-order-reconciliation (startuje hned!)**, denní horoskop e-mail 07:00 UTC, denní push, týdenní newsletter, warmup horoskopových stránek 05:00, social agent (default vypnutý).

**DB (Supabase):** klient `server/db-supabase.js`. Migrace ve 3 složkách (`migrations/`, `server/migrations/`, `supabase/migrations/`) a **spouštějí se ručně v Supabase konzoli** — schéma se nemigruje automaticky. Klíčové tabulky: users + subscriptions, `funnel_events`, `analytics_events`, `payment_events`, `one_time_purchases`, `email_queue`, `email_preferences`, `newsletter_subscribers`, `push_subscriptions`, `login_attempts`.

**Build pipeline:** `npm run build:js` (esbuild → `js/dist/` IIFE; ⚠️ slovo `export`/`import` kdekoli ve zdroji vč. komentářů přepne na ES modul — lessons.md) a `npm run build:css` (cleancss → `css/*.min.css`); oba bumpnou `CACHE_NAME` service workeru hashem obsahu. Stránky načítají **jen `js/dist/`** s `?v=` verzí — po změně JS build + bump.

**E-maily (Resend):** šablony a sekvence v `server/email-service.js` (aktivační Day 0/1/3/6, churn recovery, trial reminder, upgrade, weekly digest, PDF doručení, newsletter welcome), fronta `server/jobs/email-queue.js` s preference gatingem. ⚠️ fake `RESEND_API_KEY` v testech není no-op — dělá reálný network call (lessons.md).

**PWA:** `service-worker.js` (precache, push handler), `manifest.json`, `js/pwa-install.js`, `js/push-notifications.js`; denní push job vyžaduje `VAPID_*` klíče v produkci.

**Deploy:** Railway sleduje `origin/main` (= `Payamann/MystickaHvezdaOriginalAntigravity`); nixpacks: npm install + build + **systémový chromium** pro PDF renderery. Deploy = `git push origin main` → `npm run deploy:guard` / `verify:production` / `verify:production:commit`.

**Testy:** Jest — 57 server specs (`server/tests/`) + 4 frontend (ve worktree nutný explicitní `--testMatch`, lessons.md); Playwright — 27 e2e specs v sekcích api/core/content/tools/checkout (`scripts/run-e2e-sections.mjs`), smoke skripty pro funnel. Brána před pushem: `npm run test:verify` (lint, encoding, hooks, auth-contexts, ai-cost, growth-loop, paywall-trust, unit, audit:site, tarot-assets, sitemap:check).

## 6. SEO infrastruktura

- **Sitemap:** `sitemap.xml` 896 URL, generovaná z canonicalů (`npm run sitemap:generate`, kontrola `sitemap:check`); dynamická `horoskop/sitemap-horoscopes.xml`. Obě v `robots.txt`.
- **Robots:** disallow `admin`, `/api/`, `profil`, `prihlaseni`, `onboarding`, `offline`, `404`.
- **Canonical disciplína:** vždy `https://www.mystickahvezda.cz`; `npm run audit:site` hlídá canonical↔sitemap soulad, JSON-LD validitu, lokální assety, og:image, duplicitní canonicaly, non-www originy, manifest ikony.
- **Strukturovaná data** (inline JSON-LD, CSP přes per-page hashe): FAQPage (nástroje), Article/BlogPosting + Person (blog), BreadcrumbList, DefinedTerm/DefinedTermSet (slovník), HowTo (nástroje), Offer + UnitPriceSpecification (ceník), WebApplication/SoftwareApplication, Organization, SpeakableSpecification.
- **hreflang** cs/sk/pl/x-default na hlavních stránkách; SK/PL mutace jen pro top nástroje.
- **AI-search:** `llms.txt` + `llms-full.txt`.
- **Redirect vrstvy** (`server/index.js:735-795`, runtime ověřeno): `STATIC_PAGE_REDIRECTS` (diakritika, přejmenované stránky), `kompatibilita/{cz}-{cz}.html` → 301 `partnerska-shoda/{en}-{en}.html` (formát `beran-byk`, ne `beran-a-byk`), `/jmena/{Jméno}` → 301 lowercase `.html`.
- ⚠️ **Statický preview server redirecty obchází** — servírování vždy ověřit přes Express/produkci (lessons.md incident: 330 odstavců investováno do 301-mrtvého clusteru).

## 7. Bezpečné lokální spouštění (runtime recept)

Nikdy nespouštět `node server/index.js` s reálným `.env` z worktree — startup joby (reconciliation) sahají na produkční Supabase/Resend (lessons.md #11). Bezpečný vzor = env z `playwright.config.js:88`:

```
NODE_ENV=test PORT=3123 MOCK_SUPABASE=true MOCK_AI=true \
DISABLE_SCHEDULED_JOBS=true DISABLE_DAILY_HOROSCOPE_EMAILS=true \
JWT_SECRET=x CSRF_SECRET=x SUPABASE_URL=https://test.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=x SUPABASE_ANON_KEY=x STRIPE_SECRET_KEY=sk_test_placeholder \
STRIPE_WEBHOOK_SECRET=whsec_placeholder ANTHROPIC_API_KEY=x RESEND_API_KEY=x SENTRY_DSN= \
node server/index.js
```

V tomto režimu funguje celý funnel (registrace, onboarding, funnel/analytics ingestion) proti mock DB — ověřeno 2026-07-12. Worktree nemá `node_modules`; Node si je vyřeší z nadřazeného repa.

## 8. Známé slabiny a dluhy

1. **Stripe webhooky nedoručené** — `payment_events` prázdná za celou historii; root cause = konfigurace Stripe Dashboardu (jen Pavel). Aktivace předplatného visí na success-page cestě. Nejvyšší riziko výnosů.
2. ~~Auth handoff leak (91% ztráta)~~ — **fix ověřen živými daty 2026-07-12** (7d okno: auth page 21 → form submit 18 = 94 %; checkout_requested 27 → checkout_started 27 = 100 %). **Leak se posunul na Stripe checkout: 27 vytvořených sessions → 0 nákupů (7 dní).** Ověřit v LIVE Stripe Dashboardu stav těch sessions (expired vs. failed vs. completed-bez-záznamu). Největší paywall plocha bez konverze: `tarot_yes_no_result → tarot_multi_card` (288 zobrazení → 0 pricing intentů/7d); druhá: `crystal_ball_limit_gate` (21 z 27 checkout sessions). Pozn.: `invoice_paid: 1` (199 Kč) v okně zaznamenán — webhook/reconciliace možná už funguje, ověřit `payment_events`.
3. **purchase eventy podhodnocené** — klientské consent-gated, serverové závislé na webhoocích (bod 1).
4. ~~`sendPersonalMapPdf`/`sendHoroscopePdf` bez `RESEND_API_KEY` tiše „uspějí"~~ — **opraveno 2026-07-12** (throw místo tichého return, guard test `server/tests/one-time-pdf-email-guard.test.js`).
5. Partnerská shoda: skóre jen z 9 živlových kombinací, není unikátní na pár (tasks/todo.md:202).
6. **Push notifikace v produkci potvrzeně mrtvé (ověřeno 2026-07-12):** `/api/health` hlásí job `dailyPushNotification: enabled`, ale `/api/config` vrací `vapidPublicKey: null` a `pushNotifications: false` → chybí `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` v Railway env. Klient bez public key nesbírá subscriptions, job nemá komu posílat. Oprava: vygenerovat pár (`npx web-push generate-vapid-keys`) a nastavit v Railway. E-mailová větev (daily horoskop, weekly newsletter) běží. `sentryDsn` je v produkci také `null`.
7. Ops hardening nedodělaný: alerting na webhook failures a 4xx/5xx spiky; Lighthouse/CWV pass na produkci (app-improvement-plan Tier 3).
8. `TECHNICAL_DEBT_BACKLOG.md` (2026-04-27) je v podstatě celý hotový — číst jako historický záznam, aktuální stav v `docs/TECHNICAL_DEBT_STATUS.md`.

## 9. Chybějící externí data (dodá Pavel — zpřesní každou analýzu)

1. **Stripe Dashboard:** existuje webhook endpoint? Jaká URL, jaké delivery logy? (odblokuje bod 8.1)
2. **GSC:** stav indexace clusterů `jmena/`, `snar/`, `numerologie/`, `andelske-karty/` (Discovered vs Indexed) + impressions/týden per cluster — Day-30/60 checkpointy ze seo-growth-plan.
3. **GA4 / first-party:** top 10 organických landing pages a jejich konverze do tool session.
4. **Railway env:** ověřeno 2026-07-12 přes `/api/config` — **VAPID klíče chybí** (bod 8.6), `sentryDsn` null. Zbývá: potvrdit, že Resend reálně doručuje (joby jsou enabled, ale doručení ověří až log/inbox).
5. **Objemy:** počet registrovaných uživatelů, newsletter subscriberů, push subscriptions, aktivních předplatných.

## 10. Checklist pro budoucí analýzy

| Otázka | Kde hledat |
|---|---|
| Konverzní audit | §3 + operator-context Decision Rules + `npm run analyze:funnel` + `GET /api/admin/funnel` |
| SEO audit | §6 + `npm run audit:site` + `sitemap:check` + seo-growth-plan + GSC data (§9) |
| Výkon | build pipeline §5, service-worker precache, WOFF2 fonty, Cloudflare cache headers (`getPublicHtmlCacheControl`) |
| Nová stránka | canonical + `sitemap:generate -- --write` + `audit:site` musí projít; generované clustery přes generátor |
| Změna copy | ⚠️ `js/*-copy-fixes.js` přepisují HTML texty za běhu — grep před editací |
| Změna JS | zdroják v `js/`, pak `build:js` + `?v=` bump; žádné slovo export/import v IIFE |
| Debug plateb | Stripe API live (`checkout.sessions.list`) + `payment_events` + lessons 2026-07-07; local klíč = TEST |
| Lokální runtime | recept §7; NIKDY reálný server z worktree |
| Co se nedávno dělo | `git log --oneline -30` + tasks/todo.md (sprint log) + tasks/lessons.md |

## 11. Jak tento dokument aktualizovat

Při další velké analýze: `git diff 89fa8982..HEAD --stat` → aktualizovat jen dotčené sekce → přepsat hlavičku (datum, commit, počty stránek: `find . -name "*.html" -not -path "./node_modules/*" -not -path "./docs/*" | wc -l` a `grep -c "<loc>" sitemap.xml`). Plný re-run není potřeba, dokud se nemění architektura (server framework, build, DB).
