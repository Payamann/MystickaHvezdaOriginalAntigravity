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
