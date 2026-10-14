> Pomocná zdrojová inventura. Ověřený rozsah, konečné priority a opravené závěry jsou v [hlavním seznamu](README.md). Doporučení níže nejsou automatická instrukce k hromadným úpravám.

# Shared UI and SK/PL inventory (read-only)

Date: 2026-10-14. Candidate tree: `.codex-tmp/release-20261012`, HEAD `9d6814def`. This block made no product edits, tests, network requests, browser/UI actions or commits. It records source declarations and separates them from the production DOM observations supplied by the main review.

## Localized public pages

There are 13 localized public HTML files: seven Slovak and six Polish.

| Locale | Files | Functional surface and source evidence |
|---|---|---|
| SK | `sk/index.html` | Landing/editorial hub. Four main promise cards, shared header/footer, no local form/result. `body.atlas-page.atlas-remaining-page.atlas-language-page`. |
| SK | `sk/horoskopy.html` | Daily horoscope selection/result shell; 12 sign cards, selected sign area and `subscribe-push-btn`. Shared auth/premium components. |
| SK | `sk/andelske-karty.html` | Angel card day page; generated card action and FAQ/reference content; shared components only. |
| SK | `sk/kristalova-koule.html` | Question tool with `question-input`, `ask-btn`, `reset-btn`; result/premium behavior is JS driven. |
| SK | `sk/natalni-karta.html` | Birth date/time/place form and `calculate-natal`; result is JS/API driven. |
| SK | `sk/tarot.html` | Tarot entry with one/three/Celtic links, FAQ/reference and shared components. |
| SK | `sk/tarot-ano-nie.html` | Full yes/no tarot flow; `question-input`, reset/save/share result buttons, long educational/reference content. |
| PL | `pl/index.html` | Landing/editorial hub. Same four promise-card structure as SK with Polish copy. |
| PL | `pl/horoskopy.html` | Daily horoscope selection/result shell; 12 sign cards and `subscribe-push-btn`. |
| PL | `pl/andelske-karty.html` | Angel card day page with FAQ/reference. |
| PL | `pl/kristalova-koule.html` | Question tool with `question-input`, `ask-btn`, `reset-btn`. |
| PL | `pl/natalni-karta.html` | Birth date/time/place form and `calculate-natal`. |
| PL | `pl/tarot.html` | Tarot entry with one/three/Celtic links and FAQ/reference. |

All localized pages declare the correct `<html lang>`, `og:locale`, canonical and three-way hreflang links. The SK yes/no page has an `x-default` alternate to the Czech canonical; the other localized variants use the expected Czech/SK/PL alternates. Keep these URL and metadata relationships intact in any later simplification.

Approximate source size and repeated UI signal:

- SK: `index` 6.1k chars, `horoskopy` 14.0k, `andelske-karty` 7.2k, `kristalova-koule` 8.3k, `natalni-karta` 8.8k, `tarot` 9.7k, `tarot-ano-nie` 24.5k.
- PL: `index` 6.2k, `horoskopy` 14.2k, `andelske-karty` 7.3k, `kristalova-koule` 8.4k, `natalni-karta` 8.8k, `tarot` 9.8k.
- The localized pages use shared placeholders and are not copied copies of the Czech page shell in the DOM: each uses `components/header.html` and `components/footer.html` through `js/components.js` or `js/dist/components.js`.

## Shared header and footer

Source: `components/header.html:2-106`, `components/footer.html:3-139`, loader `js/components.js:82-152` and `js/dist/components.js` equivalent.

Header order: logo → mobile hamburger → four large dropdown groups (Astrologie, Věštění & Tarot, Čísla & Energie, Poznání) → Premium dropdown → mobile auth links → desktop profile/register/login buttons. This is a large navigation surface repeated on every localized and Czech page. Keep the direct tool routes and language switcher; a later simplification can reduce duplicate category entries only after link analytics review.

Footer order: brand/trust/support/social links → astrology links → tarot/reading links → numbers/tools → learning links → support/legal links → support email and language switcher. It is deliberately link dense. On mobile, preserve 44px link targets and the language/legal/support paths; reduce visual grouping or copy only with a focused footer review.

Declared protections:

- `css/atlas-web.css:45-50` fixes the loaded header at the viewport top, gives header/nav/dropdowns/footer a navy background and adds bottom margin to the footer grid.
- `css/atlas-web.css:113-117` changes the mobile footer to a two-column grid and gives links `min-height:44px`.
- `css/style.v2.css:1219-1260` declares the global fixed header; `:1293-1391`, `:6269-6373` manage mobile navigation, auth buttons and open state.
- `js/components.js:160-305` closes the mobile menu on link/click/Escape, sets `aria-expanded`/`aria-hidden`, and updates header scroll state. Preserve these attributes and behavior.

The main production review confirmed the mobile header is fixed and the atlas header/body combination is active. That is a visual/runtime finding. The CSS statements above are source declarations and do not by themselves prove every viewport rendering detail.

## Shared auth modal and account flow

Source: `js/templates.js:214-263`, `js/auth-client.js:251-294`, `js/auth-client.js:1423-1705`, styles `css/style.v2.css:12826-12976`.

The lazy modal has login, registration, forgot-password and reset-password states. Registration has optional birth date, GDPR consent and the submit/toggle controls. The modal is injected only on demand and is shared by localized pages even where no modal markup exists in the HTML. Preserve IDs (`auth-modal`, `auth-title`, `auth-submit`, `auth-mode-toggle`, reset/register wrappers), focus/close behavior and the optional birth-date privacy text.

## Premium/paywall UI

Source: `js/premium-gates.js:287-330` overlay builder, `:399-466` inline/exclusive paywalls, `:466-521` login gate/lock overlay, `:552-595` trial paywall; CSS `css/style.v2.css:13278-13560`.

States: plan manifest loading/fallback; inline premium overlay; exclusive paywall; login gate; lock overlay; trial badge; close/backdrop dismissal; checkout CTA. The builder reads actual plan labels/price/footer from `/api/plans` and falls back to conservative copy. It tracks paywall hit and CTA events before routing to login/checkout. Preserve the access truth, plan/price footer, close control and checkout metadata. Never move a premium gate into a generic collapsed reference block.

The production DOM review confirmed atlas pages use the navy paywall surface. Source declaration alone does not prove all plan variants were rendered in the inspected page.

## Toasts, share, subscribe and exit-intent

### Toasts

Global toast styles are in `css/style.v2.css:8759-8811`, success/error/icon/title/message variants around `:8975-9011`, plus retention toast styles `:14481-14539`. `Auth.showToast` is used by subscription and auth actions. Toasts are transient status UI with live-region semantics where the feature supplies them; keep readable contrast and do not duplicate a persistent inline success message.

### Generic result sharing

Source `js/share-result.js:9-54,119-232`, mirrored in `js/dist/share-result.js`; CSS `css/style.v2.css:12665-12752`. It watches result containers (`.result-section`, `#chart-results`, `#phaseCard`, `#astro-results`, `#horoscope-result`, and others), injects one share button, uses Web Share or clipboard, then shows a three-second `.share-toast`. It deliberately inserts before trailing profile/signup CTAs when present. Preserve result container selectors and avoid wrapping injected share UI in an inaccessible/hidden accordion.

### Horoscope share panel

Source `js/horoscope-share.js:286-405,410-466`, styles in the same file and `css/atlas-astro.css:48`; panel ID `#horoscope-share-panel`, options for native share/Facebook/WhatsApp/copy/download, and `#hs-toast`. It is generated after a daily horoscope canvas/result is available. Keep the result container and its insertion point after `#detail-numbers`/prediction content.

### Horoscope subscription

Source `js/horoscope-subscribe.js:39-143`. It validates email/sign, requests CSRF, posts `/subscribe/horoscope`, changes `#horoscope-subscribed-msg` to visible and calls `Auth.showToast`. The localized horoscope pages only expose push subscription (`subscribe-push-btn`); do not assume the Czech email form or its IDs exist in SK/PL.

### Exit intent and newsletter

`js/exit-intent.js:1-2` explicitly states that leaving the page or switching tabs never opens an upgrade dialog. `js/newsletter-popup.js:1-2` likewise states browsing, elapsed time and leaving never open a signup dialog. This is a source declaration and should remain documented; no exit-intent/signup popup should be reintroduced while simplifying pages.

## Legacy decorative background inventory

The raw candidate-tree scan saw 937 `.html` files because it includes internal docs, templates and preview material. The authoritative public inventory is `docs/page-simplification-2026-10-14/public-pages.json`: 917 public static files, with 3 exact `.stars` layers (plus separate `.stars-bg` and `.personal-map-stars` decorations). Do not describe the raw 7 matching markup files as seven public pages.

Raw scan matches (internal/template scope, not public-page count):

| File | Markup | Source styling/visibility |
|---|---|---|
| `index.html:173` | `.stars` | Home-specific atlas CSS hides `.stars`; global cosmic `html::before` remains. |
| `offline.html:28` | `.stars#stars` | `css/pages/offline.css` owns its decorative pseudo-elements. |
| `ritualy/session.html:27` | `.stars-bg` | `css/pages/ritualy-session.css` owns `.stars-bg`; this is a different selector. |
| `tarot-karta-dne.html:44` | `.stars` | `css/tarot-atlas.css:4` hides it for `body.page-tarot-daily`. |
| `templates/blog-post.html:307` | `.stars` | Template declaration; concrete generated blog pages may inherit it. |
| `templates/dictionary-term.html:296` | `.stars` | Template declaration; concrete generated dictionary pages may inherit it. |
| `osobni-mapa.html:98` | `.personal-map-stars` | Contains “stars” in the name but is not the exact `.stars` selector; `css/pages/osobni-mapa.css` owns it and later hides it for the atlas body. |

Exact `.stars` class occurs in 3 public static files (home, offline, daily tarot) and 2 non-public HTML templates. The authoritative public inventory has 917 files and 3 exact `starsLayers`. Broad names such as `.stars-bg` or `.personal-map-stars` are different layers. The production review confirmed the dated daily page does have an active `.stars` element showing `bg-cosmic-mobile.webp`; `body::before` was absent in that inspected state. This runtime finding is separate from the source declaration in `style.v2.css:6017`, where `.stars` is still defined for legacy pages.

Global background declarations that can look like legacy purple/nebula UI:

- `css/style.v2.css:281-333,376-446` sets the fixed global image layer and violet/cyan radial pseudo-elements; mobile switches to `bg-cosmic-mobile.webp`.
- `css/style.v2.css:6017-6059` defines `.stars` with a fixed background image and mobile override.
- `css/style.v2.css:12515` defines `.stars-canvas` for canvas-based decoration.
- `css/pages/home-atlas.css:4` hides `.stars`, `.nebula`, `.cosmic-particles` only on `body.atlas-home`.
- `css/atlas-remaining.css:3` hides `.stars` only on `body.atlas-remaining-page`.
- `css/tarot-atlas.css:4` hides `.stars` only on `body.page-tarot-daily`.

These are selector declarations, not proof that each old gradient or particle layer is visible on every page. The main production observation should take precedence for the dated-page DOM.

## Guardrails for later simplification

Keep fixed-header top spacing, mobile menu focus/ARIA state, 44px touch targets, footer bottom spacing and footer language/legal/support links. Keep localized canonical/hreflang metadata. Keep result hooks used by generic share injection and preserve paywall/checkout access truth. Remove or collapse only page-specific editorial duplication after confirming that the shared injected UI still has a result container and a usable next action.
