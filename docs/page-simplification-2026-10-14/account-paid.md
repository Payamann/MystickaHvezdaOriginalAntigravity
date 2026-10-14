> Pomocná zdrojová inventura. Ověřený rozsah, konečné priority a opravené závěry jsou v [hlavním seznamu](README.md). Doporučení níže nejsou automatická instrukce k hromadným úpravám.

# Account, paid and support page inventory

Datum: 2026-10-14  
Základ: `release-20261012` / `9d6814de`  
Rozsah: source-only průchod dostupných account, paid, checkout-like a support stránek shora dolů včetně přidružených rendererů. `objednavka.html`, `checkout.html` a `unsubscribe.html` v základu neexistují. Reálný účet ani browser nebyly otevřeny.

## `index.html` — 1807 řádků

**Inventura:** rozsáhlá homepage s navigací 167–280, hlavní vstup „S čím chceš začít?“ 407–456, karta dne 459–499, vysvětlení cesty 507–576, edukace/důvěra 594–777, vztahový teaser 794–817, Premium/pricing promo 818–870 a mapa 871–918, katalog funkcí 920–1310, další opakovaný pricing/account blok 1322–1450, FAQ 1466–1490, tarot CTA 1511–1530, footer link katalogy 1576–1640 a cookie consent 1664–1694.

**JS/stavy ze zdroje:** `tarot-karta-dne.js` má empty/drawn card, reveal a share/favorite; `platby-init.js` a `relationship-tarot-bridge.js` mají CTA/platební návaznosti; `personalization.js` a auth řídí guest/logged-in/premium varianty; cookie handler má necessary/analytics/marketing volby a save/reject/accept; error boundary je globální.

**Návrh:** KEEP první hlavní vstup, bezplatný výsledek/kartu, vztahový bridge, cookie privacy a jeden pricing CTA. COLLAPSE dlouhé edukativní bloky a sekundární katalogy do referenčních details pouze po ověření SEO; REMOVE je zatím jen source-candidate a vyžaduje DOM/CSS proof. Source-only legacy index sections nejsou automaticky viditelný clutter: screenshot evidence je nutná, protože původní desktopové měření 1280 px má přibližně 371 hlavních slov a 5758 px výšky proti 1233 source slovům, přičemž pricing/catalog bloky mohou být CSS skryté. Navigaci a funkční odkazy zachovat. Cena, bezplatná hodnota, cookies a soukromí jsou essential.

**Riziko:** homepage má mnoho JS hooků a analytických CTA; odstraňovat jen bloky bez `id`, `data-*` a event listenerů po DOM proof. Vizuální fialový background ani skutečná viditelnost legacy sekcí nejsou z tohoto source auditu potvrzené.

## `vztahovy-vyklad.html` — 97 řádků

**Inventura:** hero s jednorázovou cenou 149 Kč, bez členství/registrace (34–59), modelová ukázka tří karet (60–69), slíbený rozsah a bezpečnostní disclaimer (71), objednávkový formulář s availability, otázkou, e-mailem, souhlasem, cenou a Stripe notice (72–84), payment result/retry/help (87), čtyři FAQ details a footer (88–95).

**JS/stavy:** `vztahovy-vyklad.js` řeší continuation context, availability, validaci, disabled checkout, form error, payment pending/success/failure/retry a doručení. Source obsahuje jasné privacy/price/one-time notices.

**Návrh:** KEEP celý hero, ukázku, form, price, consent, payment result a support FAQ. COLLAPSE lze pouze FAQ ponechat jako stávající native details. REMOVE žádné. Příliš dlouhá ukázka je volitelný kandidát ke zkrácení až po vizuální kontrole, ale je hlavním důkazem hodnoty.

**Riziko:** cena 149 Kč, bez registrace/předplatného, souhlas a payment result jsou essential; nepřesouvat do details.

## `osobni-mapa.html` — 501 řádků

**Inventura:** status bannery verification/success/cancel (102–143), hero s CTA a cenovým metapoolem (145–213), example/preview s 20stránkovým PDF (214–260), breakdown šesti obsahových bodů (261–301), credibility/sample (302–320), process (321–344), privacy (345–355), order summary/cena/benefity a formulář (356–447), FAQ details (448+).

**JS/stavy:** `osobni-mapa.js` má payment verification pending/retry/success/cancel, period preview, sign preview, local restored draft, validation/form error, Stripe submit and redirect. Source-visible price, delivery, privacy and no-subscription claims are essential.

**Návrh:** KEEP all status banners, hero price/CTA, preview PDF, order form, payment/privacy notices and FAQ. COLLAPSE long example/breakdown/credibility/process into separate `feature-reference` only if visual density requires it; keep preview CTA visible. REMOVE duplicate CTAs only where they target same `data-scroll-target` and no new context.

**Riziko:** do not hide `#order`, `#formError`, verification statuses or `personalMapPeriodPreview`; do not obscure the no-subscription/delivery text.

## `cenik.html` — 182 řádků

**Inventura:** hero/offer with membership CTA and one-time relationship CTA (72–91), membership card with 7-day trial, billing and account CTA (93–131), legal links, relationship one-time CTA (142–151), four FAQ rows (159–164).

**JS/stavy:** `cenik.js` and auth/components render plan availability, logged-in/register/checkout variants and Stripe price state.

**Návrh:** KEEP plan name, exact trial/billing amount, cancellation, card requirement, one-time alternative and legal links. KEEP FAQ visible as short native details/rows. REMOVE repeated CTA only if exact duplicate; preserve one membership and one one-time path.

**Riziko:** pricing and billing copy is essential and must stay above the fold or close to CTA; do not collapse price or cancellation terms.

## `prihlaseni.html` — 162 řádků; modes `register`, `forgotpassword`, `signupsuccess`

**Inventura:** one source shell with login form (email/password, show password, consent, submit, forgot link; 32–97), password recovery form (100–127), register link and registration fields (127–161). Mode content is switched by `prihlaseni.js`/`core.js` based on query state.

**Source states:** login empty/invalid/loading/error, forgot password email submit/success/error, register fields and validation, signup success/redirect, password visibility toggles, auth redirect and plan/source parameters. These are source states only; no actual account was used.

**Návrh:** KEEP one active mode, its fields, labels, errors, consent/privacy and redirect. COLLAPSE inactive modes via existing JS state; do not add nested accordions. REMOVE decorative duplicate copy only if confirmed outside mode content.

**Riziko:** preserve `mode`, `redirect`, `plan`, `source`, `feature` query handling and all form IDs expected by `prihlaseni.js`.

## `profil.html` — 301 řádků

**Inventura:** guest login-required preview and logged-in dashboard shell (39–95), Premium banner (95–106), profile stats/avatar/zodiac and dynamic daily guidance (107–158), activation/memory/journal cards (158–198), tabs History/Favorites/Settings (199–263), subscription card (262–270), reading modal/favorite/delete (272–279).

**Source states from `profile/dashboard.js`:** guest logged-out preview; loading auth; signed-in profile; history loading/error/empty/filter/pagination; favorites loading/error/empty/populated; settings save/error; avatar picker; journal empty/saving/success/error; daily guidance and activation checklist variants; reading modal loading/error/detail; favorite/delete/feedback; subscription loading. These are not observations of a real account.

**Návrh:** KEEP auth gate, dashboard, all tabs, empty/loading/error states, journal, billing/subscription, avatar and reading modal. COLLAPSE secondary explanatory copy inside activation/memory cards if visually excessive; do not collapse tabs or dynamic containers. REMOVE only duplicate static CTA cards; renderer-generated next-step cards are functional and must remain.

**Riziko:** IDs/data attributes are heavily used by dashboard JS. Do not change `tab-*`, `readings-*`, `favorites-list`, `journal-*`, settings IDs, modal IDs or subscription container.

## `kontakt.html` — 273 řádků

**Inventura:** legal-style hero (92–116), two-column contact details and form with name/email/subject/message/submit (118–216), quick FAQ CTA (218–240).

**JS/states:** `kontakt.js` handles empty/validation/submitting/success/error status for `contact-form`; support email and response time are static.

**Návrh:** KEEP contact details, form, status and FAQ CTA. REMOVE no functional content. If source or visual density is high, shorten only generic intro sentence.

**Riziko:** response-time and support email are useful expectation-setting; preserve them.

## `faq.html` — 287 řádků

**Inventura:** hero (106–129), FAQ categories Astrologické služby (135–171), Účet & Soukromí (173–199), Předplatné & Podpora (201–229), support CTA (233–257), footer.

**JS/states:** native details with `lucide-init`, no account state. Seven FAQ details are already collapsed by default.

**Návrh:** KEEP all categories/details and support CTA. No additional wrapper details; no removal without checking duplicate questions against homepage and pricing.

**Riziko:** privacy, payment and cancellation answers are essential support content.

## `jak-to-funguje.html` — 157 řádků

**Inventura:** hero (60–71), three process cards (73–104), four approach/ethics cards (106–138), register CTA and one-minute note (143–145).

**JS/states:** static page with shared components; no form or account state.

**Návrh:** KEEP three steps, privacy/ethical boundaries and one register CTA. COLLAPSE the four approach cards only if the page is visually too long; use one reference details section, but keep privacy and ethical boundaries visible before CTA. REMOVE none.

## Absent requested pages

`objednavka.html`, `checkout.html`, `unsubscribe.html` were checked and do not exist in the assigned base. No source inventory or proposal was fabricated for them.

## Ověření

Read-only source and associated JS inspection only. No browser/UI, account access, network call, tests, HTML/JS/CSS change or commit.
