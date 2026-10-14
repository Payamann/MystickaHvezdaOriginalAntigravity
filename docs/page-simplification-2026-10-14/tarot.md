> Pomocná zdrojová inventura. Ověřený rozsah, konečné priority a opravené závěry jsou v [hlavním seznamu](README.md). Doporučení níže nejsou automatická instrukce k hromadným úpravám.

# Tarot stránky: read only inventura

Datum: 2026-10-14. Kandidát: `release-20261012`, HEAD `9d6814defaeaf493f207dcdc0b7b3192532d1d7a`, před kontrolou čistý. Inventura je ze zdrojového HTML a načítaných JS rendererů; neobsahuje tvrzení o vizuálním náhledu.

## Souhrn

| Stránka | Zdrojový text | Sekce v pořadí | Hlavní akce / výsledek | Doporučení |
|---|---:|---:|---|---|
| `tarot.html` | cca 601 slov | 6 | výběr rozkladu; dynamický výsledek | KEEP nástroj a ukázku; COLLAPSE křížení a FAQ; zvaž REMOVE obecný katalog 12 odkazů |
| `tarot-karta-dne.html` | cca 527 slov | 6 | otočit dnešní kartu; výsledek s významem, krokem, uložením a sdílením | KEEP tool/result; COLLAPSE primer, další cesty a FAQ |
| `tarot-ano-ne.html` | cca 485 slov | 2 + výsledkové podstromy | otázka + 5 karet; celý bezplatný výsledek | KEEP input/result/gates; COLLAPSE průvodce/FAQ/related |
| `tarot-laska.html` | cca 692 slov | 5 | ANO/NE otázka; SEO vztahové odpovědi | KEEP důvěryhodné limity a bezpečnostní poznámku; COLLAPSE intent/FAQ; delší otázky ponechat dostupné |
| `tarot-tri-karty.html` | cca 412 slov | 5 | vstup do tříkaretního Premium rozkladu | KEEP nabídku a pozice; COLLAPSE use/intent/FAQ |
| `tarot-keltsky-kriz.html` | cca 390 slov | 5 | vstup do členského Keltského kříže | KEEP nabídku a pozice; COLLAPSE use/intent/FAQ |
| `tarot-zdarma.html` | cca 434 slov | 6 | bezplatná ukázka a volba nástroje | KEEP demo; COLLAPSE metody, intent, rady a druhé CTA; vztahový aside je runtime gate |
| `tarot-vyznam-karet.html` | cca 2 198 slov | 5 | hledání/filtr 78 karet | KEEP katalog, search, filters, detail links; COLLAPSE pouze výkladové vysvětlení a barvy, nikdy katalog |

## Per page

### `tarot.html` — tarot hub

Source anchors: hero `tarot.html:237-331`; ukázka `:335-409`; intent grid `:411-455`; deck interaction `:459-486`; obecný cross-linking `:496-569`; FAQ `:571-581`; hidden relationship template `:625-635`.

1. Hero (cca 73 slov): `Tarot Online`, krátké vysvětlení a tři spread cards: Jedna karta zdarma, Tři karty Premium, Keltský kříž členství. Tři `button.spread-trigger` jsou hlavní nástroje; zachovat `data-spread-type`, ceny, tracking a selected state.
2. Ukázka interpretace (cca 132): Hvězda, čtyři odstavce modelové interpretace a odkaz na `tarot-vyznam-karet.html`. Je to užitečná ukázka, ale dlouhá před nástrojem; doporučení COLLAPSE jako `details.feature-reference` se summary „Jak může vypadat výklad“; zachovat označení ukázky a odkaz.
3. Intent grid (cca 133): šest karet na tarot zdarma, kartu dne, tři karty, Keltský kříž, lásku a ANO/NE. Každý odkaz má skutečný `data-analytics-*` hook. KEEP jako jeden související continuation group, případně COLLAPSE až pod první použití.
4. Deck interaction (cca 6 textových slov + 4 karty): „Klikněte na kartu pro zamíchání balíčku“, `.tarot-card` elements. KEEP, je to funkční alternativní start; neobalovat výsledkový container.
5. Cross-linking section (cca 65 slov, 12 dlaždic): Tarot karta dne, Andělská karta, Křišťálová koule, horoskop, průvodce, natální karta, partnerská shoda, numerologie, astro-mapa, sny, biorytmy, runy. Vše jsou odkazy, ale jde o jasný obecný katalog mimo tarotový intent; doporučení REMOVE nebo zredukovat na jednu related skupinu. Pokud se ponechá kvůli SEO, COLLAPSE s meaningful summary.
6. FAQ (cca 129): tři existující `details.faq-item` a odstavcový odkaz na ANO/NE, kartu dne a ceník. KEEP content, COLLAPSE celou sekci do `details.feature-reference`; pozor, už obsahuje native details, takže obalovat by znamenalo nested details. Bez změny CSS raději jen skládat jednotlivé FAQ do stávajícího disclosure patternu.

States and hooks: `#freemium-banner` může zobrazit „Tarot ANO/NE zdarma“ a členství (`tarot.html:217-225`); `js/dist/tarot.js` vytvoří `#tarot-results` po výběru. `template#tarot-relationship-offer` je hidden a bridge jej klonuje jen po výsledku jedné karty. Zachovat canonical, JSON-LD, spread selectors, `#tarot-results` insertion point a template ID.

Style flags: source emoji `⭐` v ukázce (`:361`), dynamické `✨` v result title, pozice používají emoji v `js/tarot.js:707-711`, lock používá `🔒` (`:612`). Nenašel jsem explicitní old purple literal v HTML; barvu určuje CSS mimo scope. Emoji jsou dekorativní, nejsou důvodem k HTML změně v read only auditu.

### `tarot-karta-dne.html` — daily card

Source anchors: hero `:48-71`; tool/result `:73-141`; steps `:143-166`; primer `:168-194`; continuation `:196-227`; FAQ `:229-255`.

1. Hero (cca 46 slov): jedna krátká promise, primary anchor na `#denni-karta`, secondary ANO/NE link, trust strip a tři preview images. KEEP; dominant action je anchor na nástroj.
2. Tool/result (cca 148): `#tarot-daily-reveal`, waiting state `#tarot-daily-card-result[data-state=waiting]`, image/name/meaning/advice, links na tarot hub a význam, hidden buttons save profile/image/share, hidden email bridge and form. KEEP whole functional block; do not fold or wrap.
3. Steps (cca 77): tři articles „Polož otázku“, „Vytáhni kartu“, „Navazuj podle potřeby“. COLLAPSE as feature-reference after result; continuation links duplicate lower intent section.
4. Primer (cca 103): large/small arcana and one card is beginning, each with link. COLLAPSE; it repeats `tarot-vyznam-karet`, free tarot and three-card CTAs.
5. „Když jedna karta nestačí“ (cca 65): four intent cards: three cards, ANO/NE, angel cards, pricing. KEEP at most one related continuation group; it is useful but competes with hero secondary CTA.
6. FAQ (cca 75): four articles with free/use/comparison/next step. COLLAPSE; the answers are useful reference but duplicate sections 3–5.

States/hooks: JS `js/tarot-karta-dne.js:494-510` switches result to `data-state=revealed`, fills image/name/meaning/advice, reveals profile/image/share controls and the email bridge. Load failure redirects to tarot hub (`:558-563`). Preserve all IDs and hidden attributes.

Style flags: no explicit old-purple literal; no runtime emoji in page source. Export/share uses `share-image-canvas.js`; no source action should be hidden by simplification.

### `tarot-ano-ne.html` — free yes/no tool

Source anchors: tool/result `:45-142`; guide and FAQ `:143-178`; related links `:181-188`.

1. Tool intro and question (cca 147 including empty result shell): `#question-input`, hint/error, five keyboard buttons `.tarot-card[data-index]`, result panel `#result-panel[aria-live]`. KEEP exactly; this is the page promise.
2. Empty/result shell: `#result-card-image`, card name, title, question, result text, practical next step, save journal, reset, save image. KEEP; do not collapse result/form/actions.
3. Hidden relationship offer: `data-relationship-offer=tarot_yes_no_result`, question context, model preview, 149 Kč link. KEEP hidden runtime gate and trust copy; legacy membership bridge `data-relationship-legacy` is also hidden and JS suppresses it when the new offer is shown.
4. Optional profile continuation `#tarot-yes-no-next-step` is hidden until save intent. KEEP.
5. Guide (cca 225): two openable guides (question writing; meanings Ano/Ne/Ještě ne plus trust note), five FAQ details, then „Kam pokračovat“ links. COLLAPSE the guide/FAQ and related links behind one `details.feature-reference` only if implementation can avoid nested details; otherwise keep existing inner details and collapse just related links.

States/hooks: `js/tarot-ano-ne.js` has missing-question error (`:1177-1195`), card/result reveal and reset (`:1198-1360`), save journal/profile, PNG/share fallback (`:978-1053`), relationship offer view (`:1064-1086`), load fallback from `CARD_VERDICTS` to card JSON (`:444-460`). Preserve `#question-error`, `hidden`, `aria-live`, button IDs, `data-relationship-*`, and `localStorage` continuation context.

Style flags: source uses no old-purple literal; dynamic canvas/share copy is textual. Existing emoji is not present in the visible HTML result shell.

### `tarot-laska.html` — relationship landing

Source anchors: hero `:44-69`; hidden personal offer `:71-80`; alternative details `:84-116`; question guides `:118-140`; three long SEO question cards `:142-181`; FAQ `:183-213`.

1. Hero (cca 63): primary ANO/NE CTA, secondary partnerská shoda CTA, explicit 149 Kč one-time personal reading link, trust strip and visual. KEEP, but the two primary-looking actions plus inline paid link create three paths; retain the ANO/NE primary and the one paid link, make partnerská shoda a related continuation.
2. Hidden relationship offer (runtime, not user-visible initially): `data-relationship-offer=tarot_love_landing`, 149 Kč link. KEEP hidden state and selector.
3. Existing disclosure `details.love-tarot-other` contains five alternative cards (ANO/NE, 3 cards, synastry, mentor, membership). KEEP disclosure; it already prevents the crossroad from dominating. Check that it is not wrapped in another details.
4. Question guide (cca 49): three short rewrites of vague love questions. KEEP or COLLAPSE with summary „Jak položit vztahovou otázku?“; it is practical and short.
5. SEO question cards (cca 336): three long, substantive cards with IDs `co-ke-mne-citi`, `vrati-se-ke-mne`, `budoucnost-vztahu`, concrete limits, card links and free CTAs; safety note for pressure/fear/violence. KEEP substantive text and safety notice. If first-screen density matters, move whole section into `details.feature-reference` but do not remove card IDs/links.
6. FAQ (cca 102): five articles, first includes 149 Kč offer and free tarot link. COLLAPSE; it repeats hero and question links.

States/hooks: no local input/result; `relationship-tarot-bridge.js` reveals the hidden offer only in relevant runtime contexts. Preserve `data-relationship-link`, analytics attributes, canonical and JSON-LD.

Style flags: no explicit old-purple literal. Source has no runtime emoji in CTA text; images are atlas story assets.

### `tarot-tri-karty.html` — premium three cards landing

Source anchors: hero `:47-72`; positions `:74-103`; use cases `:105-128`; intent group `:130-161`; FAQ `:163-188`.

1. Hero (cca 91): Premium claim, explanation, primary link to `tarot.html?...spread=three_cards`, secondary link to ANO/NE, trust strip and visual. KEEP; dominant action is primary.
2. Positions (cca 77): Past/Present/Next step, three cards and concrete descriptions. KEEP as substantive product explanation; it should remain near hero.
3. Use cases (cca 80): relationship, work, personal theme. COLLAPSE feature-reference; it restates when three cards help.
4. Intent group (cca 75): same three-card primary, ANO/NE, love tarot, pricing. COLLAPSE to one continuation group; primary duplicates hero CTA.
5. FAQ (cca 78): four articles about price/access, positions, one-card limit and Celtic cross. COLLAPSE; retain claims for access and pricing.

States/hooks: page has no local form/result; link opens `tarot.html` and runtime auth/premium gate. Preserve `spread=three_cards`, `data-analytics-*`, canonical and JSON-LD.

Style flags: no old-purple literal or runtime emoji in this HTML.

### `tarot-keltsky-kriz.html` — Celtic Cross landing

Source anchors: hero `:47-71`; positions `:72-95`; use cases `:97-120`; intent group `:122-153`; FAQ `:155-181`.

1. Hero (cca 65): membership explanation, primary open link with `spread=celtic_cross`, secondary three cards, trust strip and visual. KEEP; primary is clear.
2. Position explanation (cca 84): three grouped explanations for core/challenge, roots/development, surroundings/fears/outcome. KEEP near hero; it is the main substantive promise.
3. Use cases (cca 85): relationship loop, work risk, recurring personal issue. COLLAPSE feature-reference.
4. Intent group (cca 67): Celtic primary, three cards, ANO/NE, pricing. COLLAPSE; primary duplicates hero.
5. FAQ (cca 77): four access/use/future claims. COLLAPSE while keeping member access and non-predictive trust wording.

States/hooks: no local result; open action routes to `tarot.html` and premium gate. Preserve `spread=celtic_cross`, analytics attrs, canonical and JSON-LD.

Style flags: no old-purple literal or runtime emoji in source HTML.

### `tarot-zdarma.html` — free tarot entry

Source anchors: hero/demo `:100-149`; hidden relationship offer `:151-161`; methods `:166-254`; intent `:258-316`; FAQ `:318-378`; advice `:382-434`; final CTA `:438-454`.

1. Hero/demo (cca 42): title, free promise, hub CTA, trust line and three preview-card buttons with live caption. KEEP demo and its `data-preview-card` selectors.
2. Hidden relationship offer: runtime aside `data-relationship-offer=tarot_free_landing`, 149 Kč. KEEP hidden and bridge hook.
3. Methods (cca 65): four cards (karta dne, 3 cards, Celtic Cross, angel cards). COLLAPSE feature-reference or reduce to one related group; links are real but repeat intent section.
4. Intent (cca 100): five cards (ANO/NE, karta dne, 3 cards, love, angel, meanings). KEEP one continuation group, but avoid showing methods and intent both expanded.
5. FAQ (cca 96): three native details. KEEP answers, COLLAPSE section only if native nested disclosure is avoided.
6. Advice (cca 62): three „testimonial“ blocks labeled Otázka, Kontext, Hranice. COLLAPSE; content is useful but secondary.
7. Final CTA (cca 16): tarot hub plus angel cards. REMOVE second angel CTA or collapse with related group if no distinct hook; primary tarot link is duplicate of hero.

States/hooks: `js/tarot-zdarma.js:8-12` flips preview cards and updates `#tarot-demo-caption`; relationship bridge may reveal offer. Preserve IDs, `data-action=flipCard`, `data-preview-card`, canonical and JSON-LD.

Style flags: source emoji `🃏`, `⭐`, `👼` at `:182`, `:218`, `:236`, `:452`; this is a source-level decorative pattern worth reviewing. No explicit old-purple literal.

### `tarot-vyznam-karet.html` — 78-card meaning lookup

Source anchors: hero `:91-110`; reading guidance `:112-137`; interactive catalog `:139-1220` (78 initial articles; cards are regenerated by JS); suit explainer `:1222-1278`; FAQ `:1280-1347`.

1. Hero (cca 43): title and short lookup promise. KEEP.
2. „Tři vrstvy jedné tarotové karty“ (cca 88): theme/context/practical step. COLLAPSE feature-reference; it is educational preface, not the lookup task.
3. Catalog (cca 1,895 source words): search field, count, six filter buttons (`data-tarot-filter`), loading/error/no-results states, grid of 78 `.tarot-meaning-card` articles. KEEP fully; this is the functional result and SEO inventory. Do not wrap the grid or remove card IDs/`data-group`/`data-card`/detail and tarot links.
4. Suit explainer (cca 62): Hůlky, Poháry, Meče, Pentákly. COLLAPSE feature-reference; keep headings and text for SEO.
5. FAQ (cca 99): three native `details.faq-item` about one card, memorization, negative cards. KEEP content; if collapsed, avoid nesting another details.

States/hooks: `js/tarot-meaning-hub.js:149-190` renders search/filter results, toggles loading/error/no-results and preserves editorial copy from initial cards. Preserve `data-tarot-meaning-grid`, `data-tarot-meaning-loading`, `data-tarot-meaning-error`, `data-tarot-no-results`, search input and filter buttons. No form/payment/result gate.

Style flags: no old-purple literal and no runtime emoji in page source; card data comes from `/data/tarot-cards.json` and image fallback is in JS (`:118-123`).

## Dynamic renderer and state inventory

- `js/tarot.js:366-375` creates hidden `#tarot-results`; `:596-647` renders face-down cards, optional ANO/NE resume context, locked-card overlays and soft gate; `:714-750` injects card interpretations, summary and profile signup; `:794-895` asynchronously fills `#ethereal-tarot-summary` or error text. Results, gates, signup and hidden relationship offer must stay outside any explanatory disclosure.
- `js/templates.js:14-50` renders each card result with card title, position, interpretation and practical advice; `:57-150` renders three-card/Celtic/default summaries; `:152-180` renders summary loading container. `:214-265` renders the auth modal and its login/register/reset states. This is shared runtime, not assigned HTML; inventory only.
- `js/tarot-ano-ne.js:1177-1360` covers empty input, validation error, card reveal, result, reset and save states; `:978-1053` covers image share/download/cancel/error; `:1064-1086` shows the current relationship offer and hides legacy bridge; `:1315-1338` clears result image and state. Do not collapse result/actions or hidden state containers.
- `js/tarot-karta-dne.js:494-510` fills revealed daily result and reveals profile/save-image/share/email controls; `:537-563` covers card data failure and hub redirect.
- `js/freemium-tarot.js:16-35` reveals `#freemium-banner` when a usage limit is reached. It is a global contextual banner, not editorial content.
- `js/relationship-tarot-bridge.js:91-127` reads the last ANO/NE result and toggles contextual paid offers; hidden relationship offer selectors are functional hooks.
- `js/share-image-canvas.js:147-179` is shared share-first/download fallback. `js/tarot-karta-dne.js:314-354` and `js/tarot-ano-ne.js:978-1053` preserve share/download/cancel/error paths.
- Lookup has loading, successful filtered result, no result, card image fallback and fetch error states (`js/tarot-meaning-hub.js:118-190`).

## Remaining risks and hook checklist

- Recheck any future disclosure wrapper against native inner `details`; nested details are explicitly undesirable.
- Do not move or rename IDs, classes, `data-*` attrs, query parameters, canonical URLs, JSON-LD entities, hidden relationship offers, result containers, forms or buttons.
- A content reduction that hides the full free ANO/NE result, daily-card result, lookup cards, safety note or access explanation would violate the page promise.
- Pricing/access copy differs by product: personal relationship reading is one-time 149 Kč; three cards and Celtic Cross are membership/Premium. Keep these distinctions.
- No screenshot or browser visual conclusion is included in this inventory. No production state was checked.
