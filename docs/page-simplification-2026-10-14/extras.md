> Pomocná zdrojová inventura. Ověřený rozsah, konečné priority a opravené závěry jsou v [hlavním seznamu](README.md). Doporučení níže nejsou automatická instrukce k hromadným úpravám.

# Další funkční stránky: read only inventura

Datum 2026-10-14. Kandidát `release-20261012`, base HEAD `9d6814defaeaf493f207dcdc0b7b3192532d1d7a`. Kontrola proběhla ze zdrojového HTML a zdrojových JS; nebyl použit browser ani vizuální screenshot. Změny produktu, testy, síť a commit: žádné.

## Kvízy (`testy/`)

Všech sedm kvízů má stejnou funkční kostru: hero s jedním H1 na řádcích 40–44, `#quiz-box` na řádku 50, progress `#progress-bar` na řádku 51, sedm `.question-step[data-step]` (56–137) s tlačítky `.option-btn[data-score]`, loading stav `#loading-step` (140–146), výsledek `#result-step`/`#result-box` (149–157), dvě akce `#share-btn[data-action=shareResult]` a `data-action=reloadPage`. Každý výběr posouvá otázku, po sedmé odpovědi ukáže loading a JS po 2,5 s vloží kartu výsledku. Přiřazení skóre je v příslušném `js/quiz/*.js`; HTML se nemá zkracovat uvnitř otázek ani obalovat `#quiz-box` do details.

| Stránka | Text / sections | H1 a otázkový obsah | Loading/result a doporučení |
|---|---:|---|---|
| `testy/archetyp-duse.html` | cca 375 slov / 2 sekce | „Archetyp vaší duše“, 7 otázek, 5 odpovědí na otázku (`magician`, `priestess`, `empress`, `hermit`, `star`), zdroj `:40-137` | „Nahlížíme do vaší osudové knihy…“ `:140-146`; JS `js/quiz/archetyp-duse.js:76-114` generuje title/kicker/icon/subtitle/description/advice. KEEP quiz a výsledek; zvážit jen méně dekorativní loading text. |
| `testy/barva-aury.html` | cca 286 / 2 | „Barva vaší aury“, 7 × 4 odpovědi (`indigo`, `gold`, `green`, `red`), `:40-133` | „Snímáme barvy vaší duše…“ `:133-139`; JS `barva-aury.js:68-105`. KEEP; emoji CTA „Sdílet mé světlo 🔗“ `:147` je opakovaný vzor. |
| `testy/dar-intuice.html` | cca 316 / 2 | „Duchovní dar intuice“, 7 × 4 (`sentience`, `voyance`, `audience`, `cognizance`), `:40-133` | „Ladíme se na vaše frekvence…“ `:133-139`; JS `dar-intuice.js:64-101`. KEEP content; „frekvence“ je dekorativní claim vhodný k editorial review. |
| `testy/karmicke-dedictvi.html` | cca 320 / 2 | „Odkud kráčí vaše duše?“, 7 × 4 (`sage`, `wanderer`, `healer`, `warrior`), `:40-133` | „Otáčíme kolem času…“ `:133-139`; JS `karmicke-dedictvi.js:64-102`. KEEP; zkrácení odpovědí by měnilo scoring balance. |
| `testy/stin-znameni.html` | cca 291 / 2 | „Stín vašeho znamení“, 7 × 4 (`power`, `control`, `attention`, `detachment`), `:40-133` | „Ponořujeme se do hlubin podvědomí…“ `:133-139`; JS `stin-znameni.js:64-102`. KEEP; loading text je obrazný, ale nefunkční. |
| `testy/totem-pruvodce.html` | cca 269 / 2 | „Totemový průvodce“, 7 × 4 (`wolf`, `eagle`, `deer`, `bear`), `:40-133` | „Voláme vašeho ochránce…“ `:133-139`; JS `totem-pruvodce.js:64-102`. KEEP; výsledek a sdílení jsou hlavní pokračování. |
| `testy/zivlova-rovnovaha.html` | cca 288 / 2 | „Živlová rovnováha“, 7 × 4 (`fire`, `water`, `air`, `earth`), `:40-133` | „Mícháme esence vaší bytosti…“ `:133-139`; JS `zivlova-rovnovaha.js:64-102`. KEEP; dekorativní loading lze sjednotit později. |

Dynamic quiz states in every `js/quiz/*.js`: initial step 1, progress class `progress-width-*`, active question, loading, generated result card, share via `navigator.share` with clipboard fallback, reload. The result HTML is inserted into `#result-box` (`result-card`, header, kicker, icon, subtitle, description, quoted advice). There is no quiz paywall, form or error UI in these seven pages; data is local. Preserve `data-score`, step numbers, IDs, and `window.shareResult`.

### `testy/index.html`

Two sections, cca 166 words. Hero `:92-100` is „Pohleďte do Hvězdných Zrcadel“ with short intro. Card hub `:103-177` contains seven links, each with icon, H3 and description: archetyp, živly, stín, totem, karma, aura, intuice. Main action is selecting a quiz; no runtime states or form. The card descriptions repeat the same promise language (duše/energie/odhalte) and are the clearest text excess, but each card is a real route. Recommendation: KEEP all seven links, shorten descriptions only as a copy pass; do not collapse the hub.

## Rituály

### `ritualy/index.html`

Three sections, cca 241 words. Hero `:92-102`: moon icon/name/description (`#ritual-moon-icon`, `#ritual-moon-name`, `#ritual-moon-desc`) starts in loading text „Načítám…“. Sign selector `#sign-section` `:104-159` has 12 `.zodiac-btn[data-sign]`, a generated ritual card `#ritual-card` with `#rc-*` fields, checklist `#prep-list`, hint, and `#btn-enter-ritual`; three related links to lunace/afirmace/tarot at `:153-155`. FAQ `:161-187` has four native details. Main action is choose sign then enter session. KEEP moon/sign/card/checklist intact; COLLAPSE only FAQ if needed (already native details). The bottom three links are a secondary crossroads; keep as one related group, do not duplicate it elsewhere.

`js/ritualy.js:49-185` fills moon and ritual card, restores `mh_ritual_sign`, marks preferred sign, and builds `session.html?phase=...&sign=...`. `js/ritualy-content.js:486-510` supplies phase/sign content, six steps and journal prompts. Preserve all `#rc-*`, `#prep-list`, localStorage and query parameters. No paywall in source; FAQ says free without registration, Premium only adds journal/streak.

### `ritualy/session.html`

One `#session-main` with four mutually exclusive screen states: before check-in `#screen-checkin-before` (`:44-58`), six-step screen `#screen-step` with breath guide and `#btn-next` (`:60-76`), after check-in `#screen-checkin-after` (`:78-89`), completion `#screen-completion` (`:91-131`). Completion includes mood shift, streak, journal prompts/textarea/save target, three crosslinks and back link. Main action is one guided session; do not collapse screens or wrap the session in details. Emoji mood controls are repeated before/after; functional selectors are `.emoji-btn[data-mood]`, `#step-title`, `#step-text`, `#step-subtext`, `#step-counter`.

`js/ritualy-session.js:67-206` controls nine progress positions, breath gating, six ritual steps, and screen transitions. `:212-291` fills completion subtitle, mood shift, streak, journal prompts and either save/login action. The completion journal and save result are critical; crosslinks are optional continuation group. No error UI is defined for malformed phase/sign; fallback is `full-moon`/`beran` in JS `:44-46`.

## Hubs and lookup pages

### `blog.html`

Hero `:60-67` (cca 19 words), category filter `#categoryFilter` `:76-81`, featured container `#featuredContainer` with static Saturn feature `:84-100`, grid title `#gridTitle` and `#blogContainer` `:102-106`, initially many static blog cards `:109-829` (about 73 links), footer. `js/dist/blog.js` fetches `/data/blog-index.json`, clears/rebuilds the grid and dynamically adds category buttons; `all` shows featured + newest, category view hides featured and changes heading. Image load errors hide failed image and add fallback class. Main action is browse/filter article cards; no form, paywall or result state. The static cards are a large source fallback that JS replaces, and featured + newest creates a duplicate first-screen path; recommendation COLLAPSE is not suitable for a browse hub, but reduce duplicate static fallback or keep it only for no-JS resilience. Preserve `categoryFilter`, `blogContainer`, `featuredContainer`, `gridTitle`, category data and image fallback.

### `slovnik.html`

Hero `:52-65` (cca 17 words), one lookup section `:68-229` with `#searchInput` `:74-78` and `#termsContainer` initially containing 29 term cards. `js/dist/slovnik.js` fetches `/data/dictionary-index.json`, replaces cards, filters title/description/category on input, and renders no-results or fetch-error messages. Main action is search; KEEP search and grid. Initial static card list is useful no-JS fallback but duplicates runtime data; do not add another explanatory section. Potential source clutter is only the large static fallback and broad hero copy, not the lookup result.

### `jmena/index.html`

Hero/search `:51-65`: H1, `#name-search`, `#btn-search-name`, `#autocomplete-results`. Alphabet filter `#alphabet-bar` `:67-70`; hidden/empty result `#name-result` `:72-97` with meaning, personality, nameday, numerology, aura, element, love and career fields, plus two related CTAs (`:93-94`). Names grid `#names-grid` `:99-103`; SEO all-names section `#jmena-vsechna` `:105-389` with hundreds of linked chips. `js/dist/jmena.js` fetches `/data/jmena.json`, creates alphabet buttons, filters names (max 120), populates result, and selects exact name on input/button. Main action is search/select name; preserve every result ID and alphabet/search hook. The all-names section is a very long duplicate browse surface after the dynamic grid; recommendation COLLAPSE it as reference or render it only when JS is unavailable, retaining links for SEO. Result card and CTAs stay visible when selected.

### `vyznam-data-narozeni.html`

Five sections, cca 371 words. Hero `:47-67` has primary life-number calculator link and secondary full numerology link; no local input. Sequential explanation `:69-94`; number cards `:96-112` for 1,2,3,4,5,8; continuation intent grid `:114-143` with calculator, personal year, natal chart and pricing; FAQ `:145-158` with four articles. This is informational SEO support, not a functional input page; main action is external calculator. Recommendation COLLAPSE the three explanatory sections/FAQ into reference groups while keeping hero CTA and the accurate distinction that birth time is for natal chart. Preserve analytics attrs, canonical, JSON-LD and links.

## Shared risk and hook checklist

- Do not wrap quiz `#quiz-box`, ritual screens, result cards, lookup grids, name result, or search controls in `details`.
- Preserve all IDs and data attrs listed above; the JS relies on exact selectors and localStorage/query parameters.
- Keep full quiz result descriptions/advice and ritual journal functionality; they are the useful result, not SEO filler.
- Repeated emoji in quiz share labels, ritual moon/sign controls, mood controls and crosslinks is source-confirmed. This is a style review item, not a read-only code change.
- No old-purple literal was identified in these HTML inventories; actual color/background review requires CSS or browser review.
- No production state or screenshot conclusion is included.

## Newly closed source targets

### osobni-rok-2026.html

Four content sections plus a legal/footer shell, 172 source lines and approximately 520 text words. The hero section (numerology-cluster-hero) contains the H1 “Osobní rok 2026 ukáže, jaký cyklus se vám otevírá”, explanatory copy and links to the calculator and broader numerology path; it has no local form or input. The following sections explain calculation, list personal-year meanings, connect the yearly cycle to a personal reading, and end with five FAQ headings. Main action is the calculator link. KEEP the hero distinction between this page and the calculator; COLLAPSE the explanatory and FAQ tail into native reference groups if visual review confirms excess length. Preserve canonical/meta/JSON-LD, URLs and analytics attributes.

### ochrana-soukromi.html

Legal page with 300 source lines and approximately 319 text words. Hero section (section--hero hero--legal) contains the H1 “Ochrana soukromí”; the content section contains seven numbered headings covering controller, processed data, purpose, security/retention, rights, cookies and contact. It has no form or input and only three links. KEEP all legal sections and contact/privacy links exposed; do not collapse rights, cookies or retention language solely for visual brevity. Any visual simplification must preserve scanable numbered headings and legal meaning.

