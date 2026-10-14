> Pomocná zdrojová inventura. Ověřený rozsah, konečné priority a opravené závěry jsou v [hlavním seznamu](README.md). Doporučení níže nejsou automatická instrukce k hromadným úpravám.

# Astrology page inventory (research only)

Date: 2026-10-14. Candidate tree: `.codex-tmp/release-20261012`, HEAD `9d6814def` (`9d6814de`). No HTML, CSS, JS, server, generated output, tests, commits, network or browser UI were changed.

## Scope and evidence

Reviewed the nine assigned HTML pages, the zodiac index and all twelve static zodiac pages. The dated daily family is server rendered by `server/routes/horoscope-pages.js`, not stored as twelve-by-date HTML files. The API states are implemented in `js/horoscope.js` and the page shell is rendered by the route. Source files and line anchors below are from the candidate tree.

Shared visual cause for the “navy cards over vivid purple nebula” screenshot:

- The confirmed production dated-page mobile DOM has `body.atlas-page`, an active `.stars` element with `display:block` and `background-image:url(bg-cosmic-mobile.webp)`, while `body::before` is absent/disabled in that inspected state. The dated route source creates this layer at `server/routes/horoscope-pages.js:280` (`<div class="stars" ...>`). For dated pages, the visible nebula is therefore the `.stars` layer; old `html`/`body` pseudo-element declarations are overridden or inactive there and must not be treated as the observed cause.
- The sign index and sign pages load `css/pages/horoskop-index.css` or `css/pages/horoskop-znameni.css`, then `css/atlas-web.css` and `css/atlas-astro.css`. `atlas-astro.css:14-16` overrides `.sign-card`, `.hub-cta`, `.sign-cta` to navy `#102638` and removes the old glass shadow; the original inline/index rules remain in `horoskop/index.html` around lines 46-103 but lose the background to the later atlas selector.
- `atlas-astro.css:4` also gives `.sign-hero`, `.section--hero` and compatibility headers a navy radial background. `atlas-astro.css:14` adds the hub top spacing. The static index still needs separate DOM proof before attributing its visible purple field to the dated-page `.stars` layer. Candidate and production refs were available locally (`HEAD 9d6814def`, `origin/main 9782cab61`); the relevant `horoskop-index.css` and atlas overrides are identical between them, so this is a shared cascade issue, not a candidate-only regression.
- Pages using `atlas-remaining-page` load `css/atlas-remaining.css`; its `:is(... .horoscope-cluster-hero ...)` rule uses navy `#0b1929` with a restrained radial highlight. `lunace.html`/natální karta use atlas art backgrounds (`css/atlas-art.css`). Source declarations alone do not prove which legacy layer is visible on each page.

## Page-by-page top-to-bottom inventory

### `horoskopy.html` (source lines 146-715; dynamic daily hub)

Order: header placeholder → hero (title/subtitle, daily free-limit banner) → sign picker and twelve sign cards (lines 179-318) → SEO priority links (`#horoscope-priority-links`, lines 325-371) → time-horizon links (daily/weekly/monthly, lines 374-415) → subscription form section (lines 419-454) → result/detail section (`#horoscope-detail-section`, lines 456-585) → cross-link grid (lines 587-715) → footer.

Functional states: sign picker collapsed/expanded; free-limit banner count; initial welcome copy; loading (`#horoscope-loading`); daily result fields `#detail-date`, `#detail-text`, `#detail-work`, `#detail-relationships`, `#detail-numbers`; activation offer `#horoscope-activation-offer` with CTA and dismiss; natal-card CTA; subscription success `#horoscope-subscribed-msg`; API/error handling is in `js/horoscope.js`/`js/freemium-horoskopy.js`, with auth/premium modal injected by shared components. No export control is in this page.

Approximate visible copy: short hero plus 12 cards, two SEO/link sections, subscription explanation and a full result card; the cross-link grid is 10 unrelated cards. Repetition: the time-horizon links, result-side natal CTA, and the 10-card “Pokračujte ve své duchovní cestě” grid compete after the daily answer; the free-limit banner is operational and should remain.

Keep: sign selection, free daily answer, loading/error/result hooks, subscription form and truthful activation offer. Collapse candidate: long SEO/link explanation blocks into `details.feature-reference` with meaningful summaries, while keeping the actual sign/time-horizon links available. Remove candidate: generic cross-link cards unrelated to horoscope intent, or reduce to one relevant next step (natální karta) after the result. Preserve every existing ID/data hook and metadata.

### `tydenni-horoskop.html` (lines 45-126)

Order: hero with title, subtitle and primary sign/period entry → explanatory section “Tři otázky před výběrem znamení” (71-78) → functional sign/period selector links (81-109) → short explanation section and four FAQ articles (113-126) → footer. The page itself delegates the generated weekly result to the daily hub/API route rather than embedding a result container.

Functional states: links to `horoskopy.html` with weekly period; auth/premium gate and login/register modal are shared, not inline. No local result/loading/error/export DOM hooks.

Keep the entry action and premium truth. Collapse the three-question explanatory block and FAQ into one `details.feature-reference`; remove duplicate navigation cards if added by shared header/footer only. The four FAQ answers are useful and should remain available.

### `mesicni-horoskop.html` (lines 45-126)

Same structure as weekly: hero → “Kdy měsíční horoskop dává největší smysl” (71-78) → sign/period links (81-109) → “Měsíční horoskop stručně” with four FAQ articles (113-126) → footer. Functional state is the monthly period handoff to `horoskopy.html`; premium/login modal is shared. No local result/loading/error/export hooks.

Keep the monthly handoff, period label and truth that it is a symbolic framework. Collapse explanatory/FAQ material into `details.feature-reference`; remove only duplicate cross-navigation.

### `lunace.html` (lines 150-357)

Order: lunar hero with phase/date/illumination and countdown boxes (150-213) → phase result card (`#phaseCard`, `#phaseTags`, `#phaseInterpretation`, `#phaseAdvice`, 214-264) → practical action section (232-264) → ritual/premium bridge (270-310) → lunar cycle grid → FAQ section with four native `details` items (311-357) → footer.

Functional states: initial phase placeholders (`🌑`, “Načítám…”, `--`); countdown pending values; phase interpretation loading text; populated phase/advice/cycle result; API/auth/premium gates and shared modals; ritual CTA and “Kompletní …” premium CTA. No export control in the HTML. The complete free phase explanation and advice are the primary result and must stay visible.

Keep all phase/date/illumination/countdown/result hooks and practical advice. Collapse long ritual marketing and FAQ/reference prose into one or two `feature-reference` details after the result, retaining the premium price/access truth beside its action. Remove duplicate “Měsíc je jen začátek” promotion if it repeats the premium bridge; do not hide the result card or cycle grid.

### `cinsky-horoskop.html` (lines 59-381)

Order: input hero/card with birth year and calculate button (59-121) → hidden/result section (`#result-section`, 122-214) with sign, element, characteristic, love, career, 2026 forecast and compatibility → Chinese synastry form/result (`#chinese-synastry`, 216-340; two year inputs, result IDs and title/description) → educational “Jak funguje čínský horoskop” section (341-350) → FAQ/continuation section (352-381) → footer.

Functional states: blank year form; twelve clickable animal buttons; result populated or validation/error state; synastry blank/loading/result/error; shared auth/premium/login modal; no export control in this page. Result hooks include `#result-section`, `#result-*`, `#compat-good`, `#compat-bad`, `#synastry-result`, `#syn-*`.

Keep both calculators and all result fields. Collapse the educational and FAQ prose into `details.feature-reference` after the usable result/synastry action. Remove generic “Pokračuj ve výkladu” cross-promo if it duplicates the shared navigation; preserve any direct, relevant next step.

### `natalni-karta.html` (lines 220-875)

Order: atlas art hero/title/subtitle → input card/form (`#natal-form`, lines 244-367) with profile checkbox and name/date/time/place → chart results (`#chart-results`, 368-639) with Sun/Moon/Ascendant summary, element/quality, planets, aspects, engine note, astrologer tip, 3D container and SVG chart/tooltip → current transits section (`#transits-now`, 640-719) → explanatory cards for aspects/houses/transits (720-754) → learning section (755-801) → large cross-link grid (803-875) → footer.

Functional states: empty form, profile autofill, validation errors, submitting/loading, populated engine summary/SVG/3D/tooltip, current transit loading/result, and shared auth/premium modal. The engine note explicitly communicates calculation limits. No export button is visible in the inspected HTML; share/favorites helpers are loaded by JS.

Keep input, chart/result, transit result and calculation-limit note visible near the chart. Collapse explanatory cards and long “Co si přečíst…” copy into `feature-reference` after the result. Remove generic 10-card cross-link grid or keep one relevant next step. Never wrap `#chart-results`, SVG, tooltip or transit hooks in a hidden accordion.

### `astro-mapa.html` (lines 44-347)

Order: compact hero → birth-data form (`#astro-form`, profile checkbox, name/date/time/place/intention) → map container (`#astro-map-container`) and tooltip/loading/results (`#astro-loading`, `#astro-results`) → three explanatory cards “Co je Astrokartografie?”, “Relokace”, “Cestování” → cross-linking title/grid → footer.

Functional states: blank form/profile autofill, validation/submitting, map loading, populated map/tooltip, and premium gate in `js/astro-map.js` (`PREMIUM CHECK` around source lines 232-243) with shared paywall/login modal. No local export control in the HTML.

Keep form, map, tooltip, loading/result and premium explanation/action visible. Collapse the three explanatory cards into one `feature-reference` details block after the map; remove generic cross-link cards. Do not hide the map or premium gate.

### `partnerska-shoda.html` (lines 45-416)

Order: hero → two-person synastry form card (`#synastry-form-card`, lines 64-209) → intent explanation (`#synastry-intent-title`) → result (`#synastry-results`, lines 214-310) with score, verdict, four dimensions, bars and note → premium next step (`#synastry-next-step`, lines 311-340) → SEO relationship clusters/index (341 onward) → FAQ (around 560 onward) → cross-link title/grid → footer.

Functional states: blank two-person form/profile autofill, validation/submitting, result score/verdict/detail bars, hidden-to-visible premium next step (`hidden`, `#synastry-next-score`), shared premium/login modal. No export control in the page HTML.

Keep the full free score/detail result and the premium next step with truthful access/pricing copy adjacent to the result. Collapse SEO sign-pair clusters and FAQ into `feature-reference` details blocks after the result; remove duplicated generic cross-link grid. Do not hide result or premium CTA.

### `horoskop/index.html` (lines 39-267)

Order: hub hero/title/subtitle → one section with a 12-card signs grid (each card includes symbol, date, element/modality metadata and direct link/button) → footer. No forms, result, loading, error, premium, modal or export controls in this static index.

Keep all 12 direct sign links and metadata. The page has no redundant narrative section to collapse. Candidate simplification is visual density only: reduce card padding/gap if a future CSS change is authorized. Preserve navy card override and atlas background decision separately from content simplification.

## All twelve static sign pages (read-only family check)

Files explicitly inspected: `horoskop/beran.html`, `byk.html`, `blizenci.html`, `rak.html`, `lev.html`, `panna.html`, `vahy.html`, `stir.html`, `strelec.html`, `kozoroh.html`, `vodnar.html`, `ryby.html`.

Each file has the same top-to-bottom structure and source anchors (minor copy/line shifts only): head metadata/canonical/JSON-LD → shared header/auth buttons (roughly 1-90) → `sign-hero` (91-119: symbol, Czech/English sign name, date range, quick answer, element/modality/ruler metadata) → `sign-section` (120-149: main “X ve vztazích” prose plus strong/weak points) → compatibility panel (150-161) → lucky numbers (163-167) → one natální karta CTA panel (168-172) → three-item native FAQ details (174-189) → footer.

The 12 pages have no form, dynamic result, loading/error, premium/paywall or export state. Their only functional actions are links to the partnerská shoda tool and natální karta; registration/auth is a shared modal triggered by header. Keep hero quick answer, sign facts, compatibility link, lucky numbers and natal CTA. Collapse the longer “X ve vztazích” editorial prose into `details.feature-reference` only if the shared CSS makes the closed summary useful; keep the quick answer visible. Do not remove the three FAQ answers because they answer date/element/compatibility queries. Remove no functional hooks.

Per-file evidence:

- Beran: hero/section lines 91/120; headings lines 95, 128, 135, 143, 152, 165, 170, 177.
- Býk: `horoskop/byk.html:91-189`.
- Blíženci: `horoskop/blizenci.html:91-187`.
- Rak: `horoskop/rak.html:91-187`.
- Lev: `horoskop/lev.html:91-187`.
- Panna: `horoskop/panna.html:91-187`.
- Váhy: `horoskop/vahy.html:91-187`.
- Štír: `horoskop/stir.html:91-188`.
- Střelec: `horoskop/strelec.html:91-187`.
- Kozoroh: `horoskop/kozoroh.html:91-187`.
- Vodnář: `horoskop/vodnar.html:91-187`.
- Ryby: `horoskop/ryby.html:91-187`.

## Generated daily/date route family (source only)

`server/routes/horoscope-pages.js` is the source template for `/horoskop/:sign/:date` (comment and route declarations lines 1-5, 118-142). It validates strict ISO dates, redirects `/horoskop/:sign` to today, reads cached daily content and builds unavailable fallback content (lines 143-180). It sets canonical/robots/JSON-LD/prev/next metadata (179-265).

Rendered order: atlas art daily hero/breadcrumb/symbol/title/date/today pill (286-304) → one daily prediction card with heading and prediction (306-318) → previous/today/next navigation (319-326) → lucky numbers and affirmation when data contains them (188-201, rendered in the card area) → “jiné znamení” grid (329-339) → natální karta CTA banner with copy/action (341-348) → footer. The route has usable and unavailable/fallback states; malformed or invalid dates fall through (65-72, 137-140), and future dates are noindex/no usable cache. There is no inline premium gate, modal or export control in this route template; shared auth may still inject a modal.

The route’s main prediction, date nav and fallback message must stay visible. Collapse only the secondary “other signs” grid if it is proven to duplicate the hub, and keep the natal CTA after the answer. Do not collapse the daily answer or navigation.

`js/horoscope.js` is the API-driven daily/weekly/monthly state source: it renders loading, success, fallback/error and period labels; `server/routes/horoscope.js:101-128` accepts the three periods and gates weekly/monthly for non-premium users. This is the source of the weekly/monthly premium state, not a separate HTML result template.

## Proposed priority for a later implementation

1. Reduce generic cross-link grids on `horoskopy.html`, `natalni-karta.html`, `astro-mapa.html` and `partnerska-shoda.html` after their result/CTA, preserving IDs and direct relevant links.
2. Convert the long reference/FAQ blocks on weekly/monthly, lunar, Chinese horoscope, astro-map, synastry and natal pages to native `details.feature-reference` blocks; leave free answers/results and access/pricing truth outside the accordion.
3. Treat the 12 sign pages as one family change: keep the quick answer and actions, optionally collapse only the long editorial body. Index page needs no content deletion.
4. If the screenshot concern remains, make a separate CSS-only atlas background decision after a focused mobile review; the evidence points to the global `html`/pseudo-element nebula plus later atlas navy card override.

## Risks and boundaries

Do not edit generated daily pages, `server/routes/horoscope-pages.js`, JavaScript, CSS, metadata, canonical URLs, JSON-LD, form IDs, data attributes, result hooks or calculation/premium logic as part of this inventory. Native `details` should be used only for explanatory/reference prose; hiding a result or loading/error state would break the tool contract. “CTA count” alone is not evidence of commercial performance; this document records observed structure and hypotheses for later review.
