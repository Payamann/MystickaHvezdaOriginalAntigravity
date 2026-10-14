# Inventář ikon Mystická Hvězda

Audit je pouze read-only nad kandidátem `.codex-tmp/release-20261012`; produktové soubory jsem neměnil. Čísla níže jsou ověřena v kandidátovi 14. 10. 2026.

## Kde je screenshotová sada

Nejpřesnější shoda s popisem screenshotu (holubice, koule, tarot, hvězda, atom, srdce, čísla, glóbus, měsíc) je společný cross-link blok v `horoskopy.html:599–681`:

| pozice / cíl | aktuální vykreslení | význam |
|---|---|---|
| Andělská Karta | `🕊️` | tematický, ale pouze dekorativní odkaz |
| Křišťálová koule | `&#128302;` = 🔮 | tematický odkaz |
| Tarotový výklad | `🃏` | doménový symbol; tarot má vlastní karty |
| Hvězdný Průvodce | `🌟` | tematický odkaz |
| Natální karta | `⚛️` | tematický odkaz, významově nepřesný |
| Partnerská shoda | `&#128158;` = 💞 | tematický odkaz |
| Numerologie | `🔢` | tematický odkaz |
| Astro-mapa | `🌎` | tematický odkaz |
| Lexikon snů | `🌙` | tematický odkaz, sdílený s lunárními funkcemi |
| Biorytmy | `〰️` | tematický odkaz |
| Věštění z Run | `🪨` | tematický odkaz |

Stejný blok používá třídu `.cross-link-card__icon` ve **133 výskytech / 11 aktivních HTML stránkách**: `andelske-karty.html` (22; dvě kopie), `biorytmy.html`, `astro-mapa.html`, `horoskopy.html`, `kristalova-koule.html`, `mentor.html`, `numerologie.html`, `natalni-karta.html`, `partnerska-shoda.html`, `runy.html`, `tarot.html` (12; navíc karta dne). To je nejsilnější sdílená náhrada.

## Existing icon systems and reusable patterns

* `index.html:672,700,732,760` already uses monochrome inline SVG in `.feature-icon-wrapper`; the corresponding source pattern is stable and matches navy/gold brand styling. This is the best small icon pattern for UI affordances.
* `css/style.v2.css:4532–4535` styles `.cross-link-card__icon` as a bare `font-size:2rem`; there is no shared SVG sprite or icon map for this component.
* The atlas art system is active: `astro-mapa.html:312,330,347` uses `/img/atlas/tools-v1/*.webp` with `.card__icon-img`; available reusable objects include `01-astrolab`, `02-mesicni-krajina`, `03-numerologicky-zapisnik`, `04-runove-kameny`, `05-kristalova-koule`, `06-lesni-kruh`. These are illustrations, not 24px UI icons, so they should not be forced into every cross-link tile.
* `docs/tarot-deck-v2/atlas-preview-enhancements.js` contains an atlas-only `.atlas-tool-icon` image pattern. It is a preview, not an active shared component; do not couple production pages to it without a deliberate rollout.
* `home-intent-card__icon` exists only as CSS (`css/pages/index.css:665` and mobile duplicate around `1245`); the active homepage cards use `.atlas-intent-art` in `index.html:417–443`. Do not inventory the unused CSS hook as live emoji UI.

## Classification: what to replace

### Priority A — decorative cross-link emoji (replace as one bounded group)

All `.cross-link-card__icon` values above are decorative labels duplicated across pages. They are the source of platform-dependent colorful emoji and visual inconsistency. Add a small, explicit shared icon map (or inline SVG per link) keyed by destination, then update only these 11 cross-link blocks. Preserve the card title/text as the accessible name. Recommended mappings: angel = wing/feather outline, crystal = faceted sphere, daily horoscope/mentor = star or constellation, natal = orbit/chart, partner = two linked circles/heart outline, numerology = `1·2·3` glyph, astro-map = globe, dreams = crescent, biorytmy = wave, runes = rune mark. Keep stroke width and `currentColor`; let `.cross-link-card__icon` receive a fixed 2rem square box.

The exact shared selector is `.cross-link-card__icon`; current CSS is only `font-size` in `css/style.v2.css:4532`. A safe implementation should be scoped to this class, not a global replacement of emoji text.

### Priority B — domain symbols (do not replace globally)

* Tarot cards (`tarot.html:506` `&#127183;`, elsewhere `🃏`) are meaningful domain cues and the tarot UI has actual card art in `img/tarot-v2/`. If changed, use a real card-back/thumbnail in the tarot-specific block, never a generic icon regex.
* Zodiac signs in `.zodiac-btn` (36 matches in 3 active HTML pages) are semantic astronomical glyphs; retain them or replace as a complete zodiac system.
* Runes such as `ᚱ` and planet symbols in `js/natal-chart.js` are data symbols, not decorative cross-link emoji.

### Priority C — functional or content emoji (separate audit)

Dynamic verdicts (`js/tarot-ano-ne.js:405–407`), mood buttons (`ritualy/session.html:45–86`), elemental/directional maps (`js/shamansko-kolo.js:220–226`) and generated angel content are functional/content symbols. They need their own semantics and QA; do not touch in the cross-link pass. Favicons are also separate: the candidate has many emoji data-URI favicons (for example `index.html:54`, `andelske-karty.html:185`), but changing them is a brand/PWA asset decision rather than a tile-icon fix.

## Recommended implementation order

1. Introduce one explicit cross-link icon representation and replace the 133 `.cross-link-card__icon` instances across the 11 listed pages. Keep tarot card and rune destinations keyed separately so future edits cannot flatten meaningful symbols.
2. Update `css/style.v2.css` for a fixed icon box (`width/height`, `display:grid`, `place-items:center`, `color:currentColor`) and an SVG descendant rule. Keep atlas page override `css/atlas-tools.css:94` (`.page-crystal-ball .cross-link-card__icon { display:none; }`) because that page intentionally hides cross-link icons.
3. Verify only the cross-link grid on desktop and narrow mobile, including `horoskopy.html` (the screenshot match), `tarot.html` (extra card), and `andelske-karty.html` (two grids). Check no horizontal overflow and that card titles remain the accessible link names.

Avoid a repository-wide emoji/content regex: it would alter favicons, social copy, tarot verdicts, zodiac/planet glyphs, mood controls, and generated angel text. No implementation was made in this audit.

## Rozšířený inventář živých UI kontejnerů

Vyhledání proběhlo v kandidátovi nad aktivními HTML, `js`, `scripts`, `templates` a `components`; vynechány byly `docs`, snapshoty, `js/dist` a prose bez ikon.

| rodina / selector | počet / rozsah | rendering origin | klasifikace |
|---|---:|---|---|
| `.cross-link-card__icon` | 133 / 11 HTML | statické cross-link bloky | dekorativní; priorita A výše |
| `.feature-icon` | 98 / 33 HTML | `cenik.html` používá Lucide `data-lucide="check"`; slovníkové stránky mají emoji v `slovnik/*.html` | smíšené: Lucide funkční výhody, slovník dekorativní/tematické |
| `.faq-icon`, `.faq-icon-chevron`, `.faq-category__icon` | 11 / 2 HTML | `cenik.html`, `faq.html`, Lucide CDN 1.13.0 + `js/dist/lucide-init.js` | funkční expand/collapse a kategorie; zachovat Lucide |
| `.process-card__icon`, `.stat-icon`, `.reading-item__icon`, `.profile-zodiac-icon` | 4 process + 4 stats + dynamické profile ikony | Lucide `data-lucide` v `jak-to-funguje.html`, `o-nas.html`, `profil.html`, `js/profile/shared.js`, `js/profile/dashboard.js` | existující sdílený SVG systém; vhodný vzor |
| `.zodiac-card__symbol` | 36 / 3 HTML | dvanáct západních znamení v `horoskopy.html`, `sk/horoskopy.html` a podobných kartách | významový zodiac glyph; neměnit společně s dekorativními emoji |
| `.sign-card__emoji` | 12 / `horoskop/index.html`; `.sign-emoji` 14 / 14 HTML | statické nebo runtime zodiac data | významové; pouze případný kompletní zodiac redesign |
| `.lucky-icon` | 6 / `blog/cinsky-horoskop-2026-rok-ohniveho-kone.html` | statický obsahový blok | tematické lucky symbols; samostatný obsahový audit |
| `.planet-icon` | 6 / `blog/co-je-synastrie-jak-funguje-partnerska-astrologie.html` | statické planet symbols | významové astrologické glyphs |
| `.test-card__icon` | 7 / `testy/index.html` | statické test cards | tematické vstupy; nepatří do cross-link mapy |
| `.t-spread-icon` | 3 / `tarot.html:264,286,308` | actual `/img/tarot-v2/tarot_card_back.webp` | významová tarot art; zachovat |
| `.card__icon-img` | 3 / `astro-mapa.html:312,330,347` | `/img/atlas/tools-v1/*.webp` | existing atlas illustration system; reuse selectively |
| `.card__icon-3d` | 3 / `sk/index.html` | atlas images + tarot card back | existing art, not emoji |
| `.emoji-btn` | 10 / `ritualy/session.html` | mood selection emoji buttons | functional user input; do not replace in tile pass |
| `.page-404__icon` | 1 / `404.html` | 🔮 static error-state decoration | decorative, but isolated |
| `.ritual-moon-emoji`, `#moon-badge`, `.completion-icon` | 1, 2, 1 / `ritualy/index.html`, `afirmace.html`, `ritualy/session.html` | dynamic moon phase / ritual status | mixed; moon phase has data meaning |
| `.icon` in partner index / blog | many repeated; zodiac index uses 12 signs, blog uses 4 icons | static generated content | mixed; do not target generic `.icon` |

### Dynamic and generated origins

* `js/afirmace.js:7–18,29–36`, `js/lunace.js:5–75`, `js/moon-phase.js:20–28` and `js/ritualy.js:17–25` recreate zodiac and eight moon-phase symbols. These are data fields (`emoji`/`icon`), not one shared decorative container.
* `js/cinsky-horoskop.js:5–93,137–149` supplies Chinese zodiac animals and element icons; `js/daily-card.js:4–34` supplies 31 daily-card emoji values. Both are content data and need a product-specific art decision if ever changed.
* `js/quiz/*.js` defines icon values for six tests (five choices each); these are answer-category illustrations, not global UI chrome.
* `js/tarot-ano-ne.js:405–407,452,1162,1221` supplies verdict/card emoji. Keep tied to verdict semantics and tarot art.
* `js/natal-chart.js:12–33` supplies zodiac and planet symbols; `js/profile/dashboard.js:281–292,1611–1623` and `js/profile/shared.js:192–204` supply zodiac symbols for Lucide/profile output.
* `scripts/generate-andelske-karty-pages.mjs:137,209` generates angel-page headings/content with emoji. It is a generator source and should be updated only in an angel-specific visual task, not by replacing output HTML alone.
* `js/auth-client.js:385–391` creates `.toast__icon` with info/success/error emoji; `js/astro-map.js:578–579` creates `.error-icon`. These are status feedback and should remain semantically distinct.

## Additional safe update groups

1. **Cross-link group (133):** shared destination-keyed SVG map, as documented above. This is the only broad, low-risk replacement group.
2. **Dictionary feature cards:** audit the repeated `.feature-icon` trio (`🔢`/`📝`/`📖`) in `slovnik/*.html` as a separate generated/template family. A shared monochrome SVG trio could remove colorful emoji while preserving the card meanings; avoid touching zodiac/rune/tarot-specific first icons (`♈`, `ᚱ`, `🃏`, `⭐`, `🌙`, etc.) until classified per term.
3. **Existing Lucide surfaces:** keep and extend the established Lucide pipeline (`lucide@1.13.0` with SRI and `js/dist/lucide-init.js`) for functional affordances. Do not introduce a second icon package or convert Lucide to image art.
4. **Isolated utility surfaces:** `404.html`, `testy/index.html`, lucky/planet blocks and ritual mood controls can be handled in separate page-specific passes. Their meaning and interaction differ from shared navigation tiles.

### Explicit exclusions from a global replacement

Do not target generic `.icon`, `.emoji`, `icon:` or `emoji:` keys. They include zodiac, planets, moon phases, Chinese zodiac, quizzes, tarot verdicts, user mood input, status toasts, generated angel prose and social/content material. Do not replace `data-lucide`, `.t-spread-icon`, `.card__icon-img`, or actual tarot/atlas artwork with a generic SVG map.

## Review of the implemented icon pass

Reviewed read-only in `.codex-tmp/release-20261012` after the pass. No files were changed by this review.

### Confirmed sound

* `scripts/lib/ui-symbols.mjs` declares 51 IDs; all 51 have matching `<symbol id>` entries in `img/icons/mh-symbols.svg`. `scripts/unify-ui-symbols.mjs` check mode reports `changed: 0` and `unmapped: []` against the already migrated candidate.
* The pass replaces the shared cross-link family and dictionary cards with the same external sprite markup. A fresh search finds no remaining emoji in `.cross-link-card__icon` containers.
* `href` attributes in the changed HTML are only retained inside the new `<use href="/img/icons/mh-symbols.svg#…">` elements; the diff does not show edited page links, canonical URLs, titles, labels, or `data-*` values. Anchor accessible names remain the visible card titles; the SVGs are `aria-hidden="true"`.
* The meaningful families remain structurally separate: `.zodiac-card__symbol`/`.sign-emoji`, planet data in `js/natal-chart.js`, tarot spread art, rune data, moon-phase data, mood buttons, Chinese-animal data and quiz answer icons are not flattened into the cross-link map.
* `components/footer.html`, `js/auth-client.js`, `js/astro-map.js`, `js/mentor.js`, `js/onboarding.js` and dictionary generation now use fixed local SVG markup. User-facing toast/error strings remain `textContent`; only fixed local icon markup is inserted with `innerHTML`.
* Generator/template consistency is present for the inspected sources: `scripts/generate-andelske-karty-pages.mjs`, `generate-jmena-pages.mjs`, `generate-numerologie-pages.mjs`, `generate-snar-pages.mjs`, `generate-tarot-meaning-hub.mjs`, `server/scripts/generate-dictionary.js`, `templates/blog-post.html` and `templates/dictionary-term.html` reference the shared favicon/symbol approach.

### Decorative emoji still visible after the pass

These are separate from protected meaningful data and were not covered by the explicit selectors:

| location | remaining value | assessment |
|---|---|---|
| `profil.html:48` `.profile-guest-card__icon` | `✦` | decorative profile empty-state icon; safe candidate for `star` |
| `rocni-horoskop.html:82` `.status-icon` | `✦` | decorative status lead; safe candidate for `star` |
| `rocni-horoskop.html:99` `.status-icon` | `◌` | decorative/status progress mark; needs a dedicated `cycle` or `dot` choice |
| `ritualy/session.html:53–54,86–87` `.emoji-btn` | `🌟`, `✨` | functional mood input; do not replace in decorative pass (the other three mood faces are also intentional input) |
| `ritualy/session.html:93` `.completion-icon` | `✦` | decorative completion state; safe candidate for `star` |
| `blog/co-je-synastrie-jak-funguje-partnerska-astrologie.html:240` `.planet-icon` | `🌙` | meaningful planet/moon illustration; protected |

`js/auth-client.js` and `js/astro-map.js` no longer emit their previous status emoji; their fixed `toast__icon`/`error-icon` SVGs are covered by CSS. The Chinese-animal, moon-phase, zodiac, quiz-answer and tarot-verdict values remain data-driven and intentionally excluded.

### Review limitation / follow-up

The pass modifies a very large generated surface (943 files in the candidate diff), but the bounded checks here covered source maps, sprite ID parity, explicit selector residuals, changed JS snippets and link/name preservation. A narrow UI proof should still inspect one representative cross-link page, one dictionary page, one generated detail page, the profile/mentor status surfaces and mobile sizing; no browser or app test was run by this review.
