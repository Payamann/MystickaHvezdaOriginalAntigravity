# Komplexní analýza webu Mystická Hvězda — 2026-07-11

Provedeno podle promptu v `docs/prompt-komplexni-analyza-webu.md`. Analýza kódu v repozitáři + běh všech auditních skriptů. Živý web (Core Web Vitals, reálný traffic) nebyl součástí — doporučení doplnit o PageSpeed Insights.

## Executive summary

Web je technicky ve výrazně nadprůměrném stavu — bezpečnost, platební pipeline a testovací infrastruktura jsou na úrovni, kterou má málokterý projekt této velikosti. Všech 9 auditních skriptů prošlo čistě a 492 z 494 unit testů prochází (2 selhání jsou jen chybějící Chromium v testovacím kontejneru, ne chyba kódu). Největší riziko není technické, ale obsahové: **cca 520 z 896 indexovaných stránek je thin content** (jména ~150 slov, snář ~166, slovník ~181, andělské karty ~144 slov unikátního textu), což může u Googlu stáhnout hodnocení celé domény. Druhý problém: **blog od dubna 2026 prakticky nepublikuje** (březen 27 článků → duben 3 → květen–červenec 0). Třetí: výkonové drobnosti — 24–26 `<script>` tagů na stránku a 66 MB nepoužívaných Pinterest obrázků v deployi. Celkové skóre: **7,8/10**.

## Hodnocení po oblastech

| Oblast | Známka | Nejzávažnější nález | Quick win |
|---|---|---|---|
| 1. Architektura | 8/10 | ~900 statických stránek se sdíleným chrome — drift hlídají regresní testy, ale backlog neaktualizován od 27. 4. | Aktualizovat `TECHNICAL_DEBT_BACKLOG.md` |
| 2. SEO | 6/10 | ~520 thin content stránek v indexu (jmena/snar/slovnik/andelske-karty) | Noindex nejslabších, než se rozšíří obsah |
| 3. Výkon | 7/10 | 24–26 script tagů na stránku; 137–152 KB CSS všude; 66 MB mrtvých Pinterest PNG v deployi | `.railwayignore` pro `img/pinterest/` |
| 4. Bezpečnost | 9/10 | Deprecated balíček `xss-clean` (bez údržby od 2021) | Nahradit vlastní sanitizací / `xss` (už v deps) |
| 5. Platby | 9/10 | Bez nálezu — signature verification, idempotence, reconciliace, alerty | — |
| 6. UX / konverze | 7/10 | Z kódu nelze plně ověřit; funnel má smoke testy a 45 pokrytých auth kontextů | Lighthouse na produkci |
| 7. Přístupnost | 7/10 | Základ solidní (skip-linky, alt texty, aria) — kontrast tmavého theme neověřen | axe-core sken klíčových stránek |
| 8. Obsah / brand | 6/10 | Blog mrtvý od dubna 2026; tykání konzistentní, encoding čistý | Obnovit publikaci 1–2 článků/týden |
| 9. AI funkce | 8/10 | Cost control i rate limity v pořádku, žádné klientské API klíče | — |
| 10. Testy / provoz | 9/10 | 2 PDF testy padají na chybějící Chromium binárce v CI/sandboxu | Pin Playwright browser revize v CI |

## Detailní nálezy

### 1. Architektura a technický dluh — 8/10
- Struktura je disciplinovaná: generátory (`scripts/generate-*.mjs`) drží šablony konzistentní, `audit:site` hlídá canonicaly, SRI, JSON-LD, manifest i asset verze — vše prošlo.
- `TECHNICAL_DEBT_BACKLOG.md` je vzorně vedený (položky mají stav + regresní testy), ale poslední aktualizace 2026-04-27 — 2,5 měsíce stará.
- Riziko rozjetí generátorů a ručních úprav je reálně ošetřeno regresními testy (inline styly, asset strategy, SW cache).

### 2. SEO a indexace — 6/10
- **Technické SEO je výborné**: `sitemap:check` OK (896 URL), canonicaly unikátní, robots.txt, llms.txt, JSON-LD, OG tagy — vše validované automaticky.
- **Thin content je hlavní riziko celého webu.** Unikátní text po odečtení šablony: `jmena/` (281 stránek) ~150 slov, `snar/` (164) ~166 slov, `slovnik/` (30) ~181 slov, `andelske-karty/` (44) ~144 slov. Dohromady ~520 stránek = 58 % indexu. Google helpful content system tohle penalizuje na úrovni domény — může to brzdit i silné stránky (blog má průměr 1 079 slov).
- `partnerska-shoda/` (145 stránek, ~434 slov) a `tarot-vyznam/` (78, ~357 slov) jsou na hraně, ale přijatelné.
- Blog publikace: 2025-09→2026-04 rostla do 27 článků v březnu, pak útlum na 3 v dubnu a od května nic.

### 3. Výkon — 7/10
- Dobré: minifikované bundly (`home.min.css`, `site.min.css`), preload hero obrázku s `fetchpriority=high`, responzivní webp srcsety, verzovaný service worker s hash-based `CACHE_NAME` a produkčním smoke testem proti staré cache.
- `index.html` načítá 26 `<script>` tagů, `tarot.html` 25, `horoskopy.html` 24 — soubory jsou malé, ale parse/execute řetěz je dlouhý. Zvážit per-page bundle přes esbuild (už je v devDeps).
- CSS 137–152 KB na každé stránce — pro obsahové stránky (blog, jmena) je to hodně; kandidát na critical CSS split.
- `img/pinterest/` = **66 MB PNG, na které neodkazuje žádné HTML** — jede do každého Railway deploye (chybí `.railwayignore`).

### 4. Bezpečnost — 9/10
- Nadstandard: vlastní CSP skládaná per-page se sha256 hashi jen pro JSON-LD (`server/utils/csp.js`), žádné `unsafe-inline`, HSTS s preload, frameguard deny, HTTPS+www redirect, CSRF token s HMAC podpisem (`server/index.js:451`), oddělené rate limitery (global/static/AI/sensitive), CORS origin whitelist.
- Admin API kompletně za `authenticateToken + requireAdmin` (`server/admin.js`).
- Stripe webhook: ověření podpisu (`server/payment.js:1308`), rezervace eventů proti duplicitnímu zpracování, operační alerty s dedupe klíči.
- Žádné API klíče v klientském JS (ověřeno grepem na `AIza`/`apiKey`).
- Jediný nález: `xss-clean` je deprecated (archivovaný od 2021) — funguje, ale bez záplat; balíček `xss` už v dependencies je.

### 5. Platby a monetizace — 9/10
- Checkout recovery je promyšlený: pending checkout přežije registraci/login (dedikované E2E testy `test:e2e:checkout-recovery`), reconciliace `reconcile:stripe-subscriptions`, `revenue-truth-monitor` porovnává Stripe vs. DB.
- Paywall vynucen serverově (`requirePremium`, `requireExclusive` v `server/middleware.js:68`) — klientský freemium JS je jen UI vrstva, obejít nejde. Pozor jen na `isDevelopmentRuntime()` bypass — v pořádku, pokud runtime detekce nemůže na produkci selhnout.
- `check:paywall-trust` hlídá důvěryhodnost copy na 29 paywallech.

### 6. UX a konverzní cesta — 7/10
- 45 auth feature kontextů pokryto s aktivačními cíli (`check:auth-feature-contexts` OK), exit-intent, onboarding, funnel smoke testy.
- Z kódu nelze posoudit reálné chování (rychlost, srozumitelnost CTA na mobilu) — doporučuji Lighthouse + session recordingy.

### 7. Přístupnost — 7/10
- Klíčové stránky mají skip-linky, všechny `<img>` mají alt, aria-labels přítomné.
- Neověřeno: kontrastní poměry na tmavém kosmickém pozadí (#050510 + šedé texty bývají problém), focus management v modálech, klávesová ovladatelnost tarotových/runových nástrojů. Doporučen axe-core sken.

### 8. Obsah a brand — 6/10
- Tykání konzistentní (0 výskytů vykání na klíčových stránkách), `check:encoding` čistý, čeština bez mojibake.
- Blog je od dubna mrtvý — přitom je to nejsilnější SEO aktivum (průměr 1 079 slov/článek) a zdroj interních odkazů pro cluster linking (`blog:cluster-links`).
- Datované stránky (`osobni-rok-2026.html`, čínský horoskop 2026, retrográdní Venuše 2026) budou potřebovat plán obnovy na 2027.

### 9. AI funkce a náklady — 8/10
- `check:ai-cost-control` prošel, `aiLimiter` na AI endpointech, premium funkce vynuceny serverově, žádný klientský přístup k modelům.

### 10. Testy a provoz — 9/10
- 56 test suites / 494 unit testů, 27 E2E spec souborů rozdělených do sekcí (smoke/core/checkout/content/tools) + mobilní projekt, deploy-guard, produkční smoke testy (assets, auth handoff, pricing handoff, tool runtime), health check endpoint, revenue monitor.
- 2 selhávající testy (`server/tests/horoscope-pdf.test.js`) padají na `chromium.launch` — nekompatibilní browser revize v sandboxu, ne chyba aplikace. V CI ošetřit pin browser revize nebo `executablePath`.

## TOP 10 akcí podle dopadu (tržby/SEO)

| # | Akce | Pracnost | Soubory |
|---|---|---|---|
| 1 | Rozšířit thin content: šablony generátorů doplnit o 300+ slov unikátní hodnoty (numerologie jména do hloubky, FAQ sekce, souvislosti) | L | `scripts/generate-jmena-pages.mjs`, `-snar-`, `-andelske-karty-` |
| 2 | Do té doby: noindex pro nejslabší sekce (snar, slovnik) nebo konsolidace do hubů | S | generátory + `sitemap:generate` |
| 3 | Obnovit blog: 1–2 články/týdně, prioritně sezónní (zatmění, retrogrády H2 2026) | M | `blog/`, `blog:cluster-links` |
| 4 | Vyloučit `img/pinterest/` (66 MB) z deploye, ideálně přesunout mimo repo | S | `.railwayignore` / git-lfs |
| 5 | Per-page JS bundle — snížit 24–26 script tagů na ~5 | M | `scripts/build-js.mjs`, HTML šablony |
| 6 | Nahradit deprecated `xss-clean` (balíček `xss` už v deps) | S | `server/index.js:7,533`, `package.json` |
| 7 | Axe-core přístupnostní sken 10 klíčových stránek, opravit kontrasty | M | CSS, klíčové HTML |
| 8 | Critical CSS pro obsahové stránky (blog, generované) — nezatěžovat 137 KB CSS | M | `build:css`, šablony |
| 9 | Opravit/pinovat Chromium pro PDF testy v CI | S | `server/services/horoscope-pdf.js`, CI config |
| 10 | Aktualizovat `TECHNICAL_DEBT_BACKLOG.md` + naplánovat obnovu 2026-datovaných stránek na 2027 | S | backlog, `osobni-rok-2026.html` aj. |

## Co funguje dobře — neměnit

- **Bezpečnostní stack**: per-page CSP s hashi bez unsafe-inline, HMAC CSRF, rate limitery, HSTS — nadstandard.
- **Stripe pipeline**: signature verification, idempotentní zpracování eventů, reconciliace, revenue-truth monitor, operační alerty.
- **Automatizované guardy**: `audit:site`, `sitemap:check`, `check:*` skripty — všechny prošly; tohle je imunitní systém projektu.
- **Service worker**: hash-vázaná cache verze + produkční smoke proti staré cache.
- **Testovací kultura**: sekce E2E testů vč. checkout recovery scénářů, regresní testy na technický dluh.
- **Brand voice**: konzistentní tykání, čistý encoding.
