# Mission Control Dashboard

Status: active maintenance

This file is a lightweight workspace index. Canonical technical debt tracking is
kept in `TECHNICAL_DEBT_BACKLOG.md` and `docs/TECHNICAL_DEBT_STATUS.md`.

## Active Strategy Documents

- `tasks/architecture.md`
- `tasks/debt.md`
- `tasks/lessons.md`
- `tasks/pre-mortem.md`
- `tasks/prediction.md`

## Current Checklist

- [x] Keep tests split into usable sections.
- [x] Keep `npm run test:verify` green before production pushes.
- [x] Verify Railway deploys with `npm run verify:production`.
- [x] Archive stale one-off scripts outside active tooling.
- [ ] Continue improving the astro engine only with transparent precision claims.
- [ ] Add new guardrails as automated checks instead of manual scripts.

## Product Direction

Build Mysticka Hvezda as a technically reliable esoteric platform: transparent
about symbolic or AI-assisted outputs, guarded by automated tests, and easy to
operate without stale manual tools.

## Fáze 1 — Revenue fixy (2026-07-03)

Datový podklad: funnel_events ukazují 67 lidí na auth stránce s nákupním
intentem → 6 odeslaných formulářů (91% ztráta). Trial (7 dní, constants.js)
není vidět na ceníku. purchase_completed=0 v analytics_events při reálném
nákupu (client event je závislý na consentu a návratu na profil).

### A. Checkout auth gate (prihlaseni)
- [x] prihlaseni.html: odstranit pole „Potvrďte heslo" z registračního formuláře (reset-password formulář beze změny)
- [x] js/prihlaseni.js: odstranit confirm-password logiku (applyMode, validateRegisterFields, submit, listenery)
- [x] js/prihlaseni.js: plan-mode copy — trial + „30 vteřin" reassurance (subtitle je na mobilu v plan módu skrytý CSS, trial proto přidán i do checkout-context banneru a safety note)
- [x] js/prihlaseni.js: autofocus na e-mail po načtení
- [x] e2e: odstraněno `.fill('#confirm-password-reg')` v 7 souborech, mismatch test v conversion-smoke.spec.js přepracován na short-password guard (native minlength validaci)

### B. Trial viditelný na prodejních místech
- [x] cenik.html: trial řádek pod cenou (Průvodce, Osvícení) — `.pricing-trial-note`, mimo [data-price-plan] div
- [x] cenik.html + js/cenik.js: CTA Průvodce → „Vyzkoušet 7 dní zdarma" (cenik.js přepisoval statický text!)
- [x] cenik.html + js/cenik.js: hero trust badge → „7 dní premium zdarma"; assurance krok 2 s trialem
- [x] tarot-ano-ne.html: bridge karta — „Prvních 7 dní zdarma."
- [x] tarot.html freemium banner: „Neomezené výklady — 7 dní zdarma ›"

### C. Analytika
- [x] server/payment.js: webhook subscription_checkout_completed → navíc insert purchase_completed do analytics_events
- [x] server/routes/analytics.js: 'cookie_consent_choice' v ALLOWED_EVENTS
- [x] js/cookie-handler.js: save() → reportConsentChoice() přes /api/csrf-token + /api/analytics/event, bez identifikátorů, fail-silent
- [x] upgrade_cta_viewed: BEZ zásahu — feca4659 (9.5.) záměrně odstranil header CTA

### D. Build + verifikace
- [x] build:js (2×), bump: prihlaseni.js?v=7, cenik.js?v=20260703-trial-visible, cookie-handler?v=20260703-consent-event, cenik.css?v=9
- [x] lint ✓, check:auth-feature-contexts ✓, check:paywall-trust ✓, check:hooks ✓, jest 459/459 ✓
- [x] Preview 390×844: auth plan-mód celý nad foldem, autofocus na e-mail, trial v banneru i pod CTA; ceník s trial notou a novým CTA; cookie reject flow bez chyb
- [x] E2E lokálně nelze (chybí .env) — specs upraveny textově, ověří CI/deploy-guard

## Fáze 2 — swarm (2026-07-04)

- [x] Tarot ano/ne: skutečná karta ze 78 (35 ano/21 ne/22 nejasné, data/tarot-cards.json, obrázky ověřeny 78/78), zopakovaná otázka, mechanismus + další krok; karty na mobilu z 1546 px na 331 px; „Uložit odpověď do deníku" = primární CTA
- [x] Profil: guest náhled deníku (2 demo záznamy + Ukázka badge, eventy profile_guest_preview_viewed) + aktivační hero pro 0 výkladů (profile_activation_viewed); vrácen login odkaz pro vracející se
- [x] SK: sk/tarot-ano-nie.html (626 slov, FAQ schema, _sk analytics, vlastní JS) + title fix sk/kristalova-koule.html; sitemap 396 URL; hreflang cs↔sk na obou stranách
- [x] Homepage hero: primární CTA → tarot-ano-ne (value-first místo registrace), konzistentně v index.html + analytics.js + e2e
- [x] Integrace: oprava CSP (inline styly SK stránky → třída), centrální build:js, celá verifikační suite zelená, jest 459/459, vizuální kontrola všech ploch na mobilu 390×844

## Fáze 3 — růstová smyčka (2026-07-04)

- [x] Sdílitelný obrázek výsledku: Web Share API (nativní share sheet s PNG na mobilu) + download fallback na desktopu; capability-based label ("Sdílet výsledek" vs "Uložit obrázek"); oddělené eventy share/cancel/download; CZ + SK. Canvas už měl watermark+teaser z Fáze 2. Cíl: vytěžit FB publikum 6,6K jako growth loop.
- [x] Ověřeno v preview: desktop → download (tarot-ano-ne-nejasne.png), mobil (simulace) → navigator.share s image/png + teaser textem s URL
- [x] Verifikace: lint, CSP 27/27, audit:site, tarot-assets 78/78, jest 459/459

### Review Fáze 3
Malá strukturální změna, velká páka (sdílení do největšího assetu). Near-miss:
slovo "export" v řetězcích komentářů přepnulo build na ES modul → CSP test fail;
opraveno přeformulováním (viz lessons.md). Deploy zbývá.

### Review Fáze 2
Swarm 3× Sonnet paralelně (disjunktní soubory, bez commitů/buildů u agentů,
integrace centrálně) — fungovalo; náklady ~380k subagent tokenů. Agent A
narazil na session limit před závěrečnou zprávou, ale práce na disku byla
kompletní a kvalitní. Jediný integrační zásah: CSP inline styly na SK stránce
a vrácení login odkazu do profilové brány.

### Review Fáze 1
Změněno: prihlaseni (pole -1, trial copy, autofocus), cenik (trial 4×), tarot bridge
+ freemium banner, server purchase event, consent event. Vše ověřeno v preview
na mobilu, 459 unit testů zelených. Nečekané: cenik.js přepisuje statické texty
karet (near-miss zachycen verifikací) a jest má ve worktree rozbitý testMatch.
E2E checkout sekci spustit v CI před deployem.

## Fáze 4 — PDF fulfillment reconciliation (2026-07-06)

Zjištění z reviewu placeného PDF produktu (Osobní mapa 299 Kč, Roční horoskop
199 Kč): `handlePersonalMapPurchase`/`handleRocniHoroskopPurchase` v
server/payment.js generují PDF (Claude + Playwright) a posílají e-mail (Resend)
uvnitř `setImmediate` PO odpovědi na Stripe webhook. Když cokoliv uvnitř
selže, chyba se jen zaloguje — žádný retry, žádný admin alert, žádné avízo
zákazníkovi. Objednávka zůstane `one_time_order_inputs.status='checkout_created'`
navždy. Žádný cron job to nekontroluje, admin panel nemá pohled na tyto
objednávky.

Cíl: automatická reconciliace + admin alert při finálním selhání, beze změny
UX pro úspěšný běh (dnešní rychlá cesta zůstává nedotčená).

- [x] Migrace `migrations/20260706_one_time_order_retry_tracking.sql`: přidat
      `retry_count INT NOT NULL DEFAULT 0`, `last_error TEXT`,
      `last_attempt_at TIMESTAMPTZ` do `one_time_order_inputs` (mirror
      `email_queue` konvence z `20260309_create_email_queue.sql`)
- [x] `server/routes/osobni-mapa.js` + `server/routes/rocni-horoskop.js`:
      přidat `productYear: PRODUCT.year` do `payload` při vytváření objednávky,
      aby reconciliace nezávisela na živém Stripe session lookupu
- [x] Extrahovat fulfillment logiku (generate → render → send → mark fulfilled)
      z `payment.js` do `server/services/one-time-fulfillment.js` —
      `fulfillPersonalMapOrder()` a `fulfillRocniHoroskopOrder()`, sdílené mezi
      webhookem (rychlá cesta) a novým jobem (retry cesta)
- [x] `server/services/one-time-orders.js`: přidat `listStuckOneTimeOrderInputs()`
      (status=checkout_created, created_at starší než grace okno, retry_count <
      max), `recordOneTimeOrderInputAttemptFailure()` a `markOneTimeOrderInputFailed()`
- [x] Nový `server/jobs/one-time-order-reconciliation.js` po vzoru
      `email-queue.js` (jobRunning lock, `sendOperationalAlert` pro admin alert
      při vyčerpání retry budgetu). Grace okno 20 min (shoduje se s copy na
      osobni-mapa.html: "Pokud nedorazí do 20 minut..."), max 3 pokusy, běh
      každých 10 min + jednou při startu. `fulfillFn` injectovatelný (mirror
      `fetchImpl` vzoru z alerts.js) pro testovatelnost bez reálných volání.
- [x] Zapojeno do `server/index.js` vedle ostatních `initialize*Job()` volání
- [x] Testy: `server/tests/one-time-order-reconciliation.test.js` (stuck
      detekce, úspěšný retry, vyčerpání retry budgetu → status=failed,
      needotýká se čerstvých objednávek uvnitř grace okna) +
      `server/tests/one-time-fulfillment.test.js` (neznámý product_type vyhodí
      chybu, nemlčí)
- [x] Ověřeno: jest 495/495 zelených (celá sada), lint čistý, žádná regrese
      v personal-map-pdf.test.js / rocni-horoskop.test.js / payment*.test.js
- [x] Migraci uživatel spustil ručně v Supabase SQL editoru
- [x] Admin viditelnost bez závislosti na `OPERATIONAL_ALERT_WEBHOOK_URL`
      (potvrzeno: na Railway zatím není nastaven, takže žádné operační alerty
      včetně stávajících `social_agent_failed` tam dnes nechodí): nový
      `GET /api/admin/one-time-orders?status=failed|checkout_created|fulfilled|all`
      v `server/admin.js` (authenticateToken + requireAdmin, stejný vzor jako
      `/admin/angel-messages`) + sekce "Jednorázové PDF objednávky" v
      `admin.html`/`js/admin.js` (tabulka: čas, produkt, zákazník, stav,
      pokusy, poslední chyba). `js/dist/admin.js?v=3` po `npm run build:js`.
      Testy: `server/tests/admin-one-time-orders.test.js` (401 bez tokenu, 403
      bez admin role, 200 + správná data s filtrem).
- [x] Ověřeno: jest 499/499 (celá sada), lint čistý, `check:ai-cost-control`
      OK, static-html-csp + script-guardrails testy OK po JS/HTML změně

## Fáze 5 — Monetizace bez marketingového rozpočtu (2026-07-06)

Cíl: využít organický provoz, co už na web chodí zdarma, beze změny v marketingovém
rozpočtu (0 Kč). Dva kroky navazující na dřívější zjištění duplicitního obsahu.

- [x] Newsletter popup (`js/newsletter-popup.js`, exit-intent + 45s timer, už
      testovaný a nasazený na blogu/homepage) přidán na všechny 4 programmatické
      clustery, které ho dosud neměly: `jmena` (281), `snar` (164),
      `kompatibilita` (66), `partnerska-shoda` (145) = 656 souborů. Jen vložení
      `<script src="../js/dist/newsletter-popup.js" defer></script>` před
      `</body>` — CSS už bylo v globálním stylesheetu, žádný nový kód.
      Ověřeno v preview (exit-intent trigger, žádné console chyby, dismiss/
      session logika funguje) + static-html-csp/script-guardrails testy zelené.
- [x] Kompatibilita cluster (66 párů): nahrazeno 9 sdílených textových bloků
      (podle dvojice živlů) unikátním textem pro každý konkrétní pár znamení —
      5 sekcí (láska, komunikace, výzvy, silné stránky, tip na rande) × 66 =
      330 nových odstavců, psáno s ohledem na modality/vládnoucí planety/
      klasické astrologické dynamiky konkrétních dvojic. Skóre/label (55%/78%
      atd.) ZŮSTÁVÁ podle živlových bucketů — vědomě mimo scope, viz review.
      Ověřeno: 0 duplicitních textových hashů (dřív 9 skupin), jest 71/71 na
      static-html-csp/script-guardrails/seo-ctr-sprint, preview 2 stránky bez
      console chyb.

## Fáze 6 — E-mailový stroj a úklid (2026-07-06, deploy fd1fcb49)

- [x] Etapa 1: Popup plní slib denního horoskopu — po newsletter opt-inu druhý
      krok s výběrem znamení → POST /api/subscribe/horoscope (existující
      endpoint + denní cron). Bez CSS změn (reuse .mh-popup-* tříd, CSP bez
      inline stylů). Bump ?v=20260706-sign-step na 726 stránkách (js 1y
      immutable cache). Ověřeno: mocknutý flow v preview + ASCII markery
      v živém bundlu (esbuild eskapuje diakritiku — grep českých řetězců
      v dist nefunguje, viz lessons).
- [x] Etapa 2: Týdenní digest má rotující prémiový spotlight (Osobní mapa /
      Roční horoskop, střídání po ISO týdnech, stejné utm konvence). Zpětně
      kompatibilní se staršími zařazenými e-maily bez spotlight dat.
- [x] Etapa 3: Pinterest — paměť byla zastaralá; skutečný stav: 60 promptů,
      ~300 pinů, 106 obrázků na webu (200 OK), bulk CSV hotové, publikováno 0.
      Jediný krok je ruční: Pavel nahraje pinterest_bulk_upload.csv přes
      Pinterest Bulk create. Paměť aktualizována.
- [x] Etapa 4: Smazán mrtvý kompatibilita cluster (134 souborů: 66 HTML +
      66 orphan CSS + generátor + data). Server 301 mapa zůstává (api.test),
      statický SEO test přepsán na "cluster zůstává pryč". Redirect ověřen
      živě po deployi.
- [x] Jest 501/501, lint, sitemap:check, audit:growth-loop — vše zelené;
      deploy fd1fcb49 živý za 120 s.

### Review Fáze 5
Obě části beze změny designu/struktury — jen vložení skriptu (newsletter) a
náhrada textového obsahu (kompatibilita), takže riziko regrese bylo nízké a
potvrzeno testy i preview. Vedlejší nález: skóre/label u kompatibility jsou
pořád jen z 9 živlových kombinací (55%/78%/62% atd.), ne unikátní na pár —
zůstává jako možný další krok, pokud bude chtít ještě přesnější diferenciaci.
Nedotčeno: `jmena/index.html` už má jiný mechanismus (`exit-intent.js`, přímý
upsell na registraci) — ponechán beze změny, newsletter popup se mu sám vyhne
(`shouldShow()` kontroluje přítomnost `#exit-intent-modal`).

**POST-DEPLOY KOREKCE (2026-07-06):** Celý kompatibilita cluster se v produkci
neservíruje — server/index.js ho 301-redirectuje na partnerska-shoda (regex
route + CZECH_COMPATIBILITY_SLUGS) a soubory mají noindex + canonical tamtéž.
Úpravy 66 kompatibilita souborů (texty, H1, newsletter) jsou tedy inertní.
Živá a funkční část Fáze 5: newsletter na jmena (281) + snar (164) +
partnerska-shoda (145) = ~590 skutečně servírovaných stránek; partnerska-shoda
už unikátní texty měla. Osud kompatibilita clusteru = samostatný follow-up
(smazat / zprovoznit / přenést obsah). Viz lessons.md incident.

### Review Fáze 4
Beze změny chování pro úspěšný webhook běh (jen extrahovaná stejná logika do
sdíleného modulu) — riziko regrese nízké, potvrzeno 495/495 testů. Nečekané:
`server/tests/setup.mjs` nastavuje fake, ale neprázdný `RESEND_API_KEY`, takže
testy co dojdou až k `email-service.js` send funkci dělají skutečný pomalý
síťový request na Resend (viz lessons.md near-miss) — vyřešeno injectovatelným
`fulfillFn` v jobu místo mockování modulu. Zbývá: uživatel musí ručně spustit
migraci v Supabase (schéma se v tomto repu nemigruje automaticky) a nasadit
(git push). Vedlejší zjištění mimo scope: `sendPersonalMapPdf`/`sendHoroscopePdf`
při chybějícím `RESEND_API_KEY` v produkci tiše "uspějí" (vrátí se bez chyby),
takže by objednávka mohla být označena fulfilled bez reálně odeslaného e-mailu
— existující chování, nedotčeno touto opravou, stojí za samostatný pohled.
