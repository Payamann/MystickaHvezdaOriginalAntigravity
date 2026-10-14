> Pomocná zdrojová inventura. Ověřený rozsah, konečné priority a opravené závěry jsou v [hlavním seznamu](README.md). Doporučení níže nejsou automatická instrukce k hromadným úpravám.

# Inventory kandidátů zjednodušení nástrojů

Datum: 2026-10-14  
Základ: `release-20261012` / `9d6814de` (čistý stav)  
Rozsah: zdrojový průchod všech 14 přidělených HTML a jejich stránkových rendererů v `js/dist/`.  
Omezení: pouze inventura a návrhy; HTML, JS, CSS ani server nebyly změněny. Vizuální stav v prohlížeči nebyl kontrolován, proto jsou poznámky o fialovém pozadí pouze podle tříd a zdrojového CSS kontextu.

## Společné nálezy

- Většina stránek má funkční nástroj nahoře, potom jeden nebo více bloků „Pokračujte ve své duchovní cestě“ s 8–12 odkazy. To je hlavní kandidát na zkrácení na jednu relevantní návaznost.
- Dlouhé vysvětlení a FAQ jsou často až za nástrojem. Kandidát: obalit pouze samostatný referenční/SEO text nativním `<details class="feature-reference">` se smysluplným `summary`; existující FAQ `details`/akordeony ponechat a nevkládat je do dalšího wrapperu. Neskrývat formulář, bezplatný výsledek, bezpečnost, cenu, přihlášení nebo paywall.
- Zachovat všechny existující `id`, `data-*`, selektory rendererů, JSON-LD, canonical URL, placeholdery, hodnoty formulářů a odkazy na ceny/přístup.
- Třídy `atlas-art-*`, `section--alt`, `mh-inline-*` a starší promo/landing bloky jsou pozorování ze zdroje. Bez browseru nelze potvrdit skutečný odstín ani hustotu layoutu.

## Source validace dřívějších kandidátů

- `andelske-karty.html:337–429` obsahuje první intent grid a `:430–528` první 11karetní cross-link blok; další promo/reference obsah je `:529–700` a druhý cross-link grid `:701–766`. Jde o dvě různé sekce na jedné stránce, nikoli o dva samostatné katalogy. Adresář `andelske-karty/` obsahuje detailní stránky jednotlivých andělů; není to druhý renderer hlavní stránky.
- `andelske-karty.html:595–692` má šest samostatných nativních `<details>` s `<summary>`. Neobalovat celý FAQ do dalšího `feature-reference`; lze řešit pouze okolní promo/reference text a seznam významů.
- `snar.js:31`, `:82–97` potvrzuje skutečný load-more: počáteční limit se zvětšuje o 24 přes tlačítko `Načíst další symboly`. Snář tedy už má postupné načítání; další návrh na nový load-more není opodstatněný. `snar.html:227–322` je samostatný FAQ accordion s buttony, nikoli seznam symbolů.
- `tarot-vyznam/smrt.html:245–260` a stejný template v ostatních tarotových detailech používá čtyři nativní `<details class="faq-item">`; FAQ nelze označit za nesbalený blok.
- Runtime emoji jsou datová pole pro zobrazení symbolů/znamení, např. `server/data/zodiac-signs.js:6–218` a `js/daily-card.js:19`; `export` výskyty v `server/*.js` jsou modulové exporty. Ani jedno samo o sobě není vizuální clutter kandidát.

## Stránky

### `numerologie.html` (574 řádků)

**Inventura shora dolů:** hero (120), kalkulačka se jménem, datem a volitelným časem (144–224), skrytý `#daily-cycles` se třemi kartami (226–332), skrytý `#numerology-results` se čtyřmi čísly, save/share akcí a `#num-interpretation` (334–363), obrázkový interlude (365), vysvětlení čtyř čísel + Master Numbers (368–404), numerology-cluster otázky se třemi odkazy (406–433), velký cross-link grid s 11 kartami (434–499), dlouhé SEO vysvětlení + FAQ + related chips (501–540).

**Renderer:** `numerology.js` používá `numerology-form`, `use-profile-num`, `num-loading`, `daily-cycles`, `numerology-results`, čtyři `card-*`, `numerology-result-actions` a `num-interpretation`. Výsledek se zobrazí po submitu; nečlen vidí základní výpočet a Premium gate, člen API interpretaci; chyba API má inline error; save vyžaduje účet. `share-image-canvas.js` obsluhuje sdílení obrázku.

**Návrh:** KEEP hero, celý formulář, loading, cykly, výsledky, save/share a Premium gate. KEEP jeden blok „Vyberte si konkrétní otázku“ se třemi numerologickými odkazy. COLLAPSE vysvětlení čtyř čísel, Master Numbers a SEO odstavec do `feature-reference`; FAQ-like otázky řešit samostatně pouze pokud jsou skutečně viditelné a nejsou už native details. REMOVE nebo MOVE velký 11karetní cross-link grid; ponechat maximálně jednu návaznost na partnerskou numerologii. Neodstraňovat odkaz na osobní mapu generovaný rendererem.

**Riziko:** skrytí `#num-interpretation` nebo změna wrapperu může rozbít gate/scroll; dlouhý SEO text je v JSON-LD FAQ, proto při vizuálním zkrácení zachovat strukturovaná data.

### `kalkulacka-cisla-osudu.html` (434 řádků)

**Inventura:** hero s „Zdarma • Bez registrace“ (127–141), kalkulační karta se třemi číselnými poli a `#calc-error` (143–201), skrytý `#calc-result` s číslem, názvem, traits a share tlačítky (203–267), intent blok se třemi navazujícími kartami (269–305), edukace o výpočtu + dvě details FAQ (307–388), seznam významů čísel 1–33 (390–407).

**Renderer:** `kalkulacka-cisla-osudu.js` zapisuje `inp-day/month/year`, `calc-error`, `calc-result`, `res-number/name/traits`; výsledky se generují lokálně, share používá tři tlačítka. `personalization.js`/`retention.js`/newsletter popup jsou doplňkové stavy.

**Návrh:** KEEP hero, pole, error, celý result/share. KEEP intent grid, protože je to jediná relevantní další cesta. COLLAPSE edukaci a seznam všech významů do jednoho `feature-reference`; stávající dvě details ponechat jako vnořené pouze pokud nový wrapper nezpůsobí nested accordion, jinak ponechat jako samostatné details. REMOVE žádné funkční části.

**Riziko:** `#calc-result` nesmí být uvnitř `details`, protože výsledek musí zůstat viditelný po výpočtu.

### `partnerska-numerologie.html` (148 řádků)

**Inventura:** hero a hlavní CTA kalkulačky (126), vysvětlení co se počítá (127), modelový výpočet dvou osob s praktickým rozhovorem a CTA (128), tři další souvislosti (129), FAQ s pěti nativními details (130–134).

**Renderer:** stránka nemá vlastní kalkulační JS; pouze společný analytics/components. Všechny CTA jsou statické.

**Návrh:** KEEP hero, modelový příklad a první CTA. KEEP blok tří relevantních souvislostí, ale zredukovat na jednu primární návaznost na kalkulačku a jednu na partnerskou shodu. COLLAPSE dlouhé vysvětlení „Co vlastně počítáme“ a modelový rozhovor pouze pokud je na vizuálu příliš dlouhý; FAQ details ponechat, jsou už přirozeně sbalené. REMOVE žádné.

**Riziko:** jde o SEO cluster page s krátkým obsahem; přílišné zkrácení by odstranilo vysvětlení symbolického a nevědeckého charakteru.

### `andelske-karty.html` (852 řádků)

**Inventura:** hero (227), draw karta s `#draw-btn`/`#angel-results` a share/premium/profile hooks (249–336), dva intent gridy (337–429), první cross-link grid 11 karet (430–528), další promo/reference sekce (529–700) včetně šesti details, druhý téměř stejný cross-link grid (701–766), seznam všech významů karet (767–817).

**Renderer:** `angel-cards.js` používá `angel-intro`, `draw-btn`, `angel-results`, short message, deep action, profile CTA, share, favorite a Premium gate. Výsledek je po tahu; hlubší výklad může být gated; save/favorite vyžaduje účet; chyby hlubšího výkladu zobrazí text „…nepodařilo načíst…“.

**Návrh:** KEEP draw flow, výsledek, share/favorite, profile CTA a Premium gate. KEEP jeden intent grid (ten, který bezprostředně navazuje na výsledek). REMOVE druhý duplicitní cross-link grid (701–766) a z prvního 11karetního gridu ponechat nejvýše jednu relevantní kartu. Šest FAQ/reference položek je už native `details`, takže je ponechat samostatně; `feature-reference` použít nanejvýš pro seznam významů všech 44 karet. Odstranit pouze duplicitní promo bloky bez hooků. `#angel-results` nesmí být zabalen do details.

**Riziko:** stránka má nejvyšší redundanci; ověřit, že odstraněný blok neobsahuje `id`/CTA používané `angel-cards.js`. Seznam významů může být SEO obsah, proto zachovat v DOM nebo v details.

### `runy.html` (451 řádků)

**Inventura:** freemium banner (88–104), hero a tah runy (108–214), výsledkový kámen/loading/meaning, intention textarea a hluboký výklad, promo continuation grid (216–256), edukace o runách a použití (258–306), cross-link grid (308–380), SEO vysvětlení + FAQ + related chips (382–419).

**Renderer:** `runes.js` používá `active-rune`, `btn-draw`, `loading`, `rune-result`, `rune-intention`, deep/save/share/favorite a `premium-upsell`; hluboký výklad má Premium gate a error „Nepodařilo se načíst…“. Freemium count/banner řídí `freemium-runy.js`.

**Návrh:** KEEP banner, tah, loading, runu, intention, deep gate, save/share/favorite. KEEP jeden relevantní odkaz na hlubší výklad. COLLAPSE pouze dlouhou edukaci a SEO text do `feature-reference`; existující FAQ details ponechat samostatně. REMOVE jeden z duplicitních continuation/cross-link gridů; zachovat nejvýš jednu kartu pro šamanské kolo nebo křišťálovou kouli.

**Riziko:** banner je přístup/cost notice; neskrývat ani neměnit jeho počítadlo.

### `kristalova-koule.html` (390 řádků)

**Inventura:** hero/otázkový nástroj s `#question-input`, answer container a reset (113–171), freemium upgrade banner (173–187), inline guidance (189–241), cross-link grid (243–311), dlouhé vysvětlení jak se ptát + FAQ + related links (313–349).

**Renderer:** `crystal-ball.js` ovládá input, `answer-container`, `ask-btn`, reset, freemium count, favorite; registrace gate se odkazuje na `/prihlaseni.html`; API error se zobrazí v answer/error vrstvě. `freemium-koule.js` rozlišuje anonymní 1 a přihlášené 3 použití.

**Návrh:** KEEP input, ask, odpověď, reset, usage notice, favorite a registrační cestu. KEEP jednu návaznost na Tarot ANO/NE. COLLAPSE guidance a dlouhé vysvětlení do `feature-reference`; existující FAQ accordion ponechat samostatně. REMOVE velký cross-link grid kromě jedné relevantní karty.

**Riziko:** usage count a registrační CTA jsou přístupová informace; neskrývat je ve details.

### `mentor.html` (255 řádků)

**Inventura:** hlavní section obsahuje hero text (75–86), čtyři starter prompt buttons (87–115), chat s uvítací zprávou, typing indicator, textarea a disabled send (117–150). Druhá sekce je 11karetní continuation grid (152–199); zbytek footer.

**Renderer:** `mentor.js` používá `chat-input`, `send-btn`, `chat-messages`, `typing-indicator`; freemium banner je v `freemium-mentor.js`. Při nepremium odpovědi se zobrazí premium lock/paywall; při 402/403 jde do gate; API chyba se vrací jako chatová chyba.

**Návrh:** KEEP hero, čtyři starter prompts a celý chat/error/loading/paywall. REMOVE nebo MOVE continuation grid a ponechat jedinou návaznost na Tarot nebo vlastní vztahový výklad. Neobalovat chat details.

**Riziko:** starter tlačítka mají `data-mentor-prompt-*`, nesmí se měnit ani skrýt.

### `snar.html` (552 řádků)

**Inventura:** aplikace s hero, statistickým barem, symbol dne, popular dreams grid, hledání, abecední navigace a `#dict-grid` (118–226), FAQ (227–322), crosslinks (325–356), seznam všech symbolů 359–528.

**Renderer:** `snar.js` plní `dream-search`, `alphabet-nav`, `dict-grid`; `snar-inline.js` plní symbol dne. Stav „načítám“/no-results a API error jsou v `dict-grid`; filtrace je hlavní funkce.

**Návrh:** KEEP hero, symbol dne, search, alphabet, výsledky i no-results/error. KEEP stávající FAQ accordion samostatně (nezakrývat vyhledávání ani neobalovat celý FAQ). COLLAPSE dlouhý seznam všech symbolů do `feature-reference` pouze pokud seznam není cílovým SEO vstupem; bezpečnější je ponechat seznam ve výchozím DOM a zkrátit crosslinks na jednu návaznost. REMOVE crosslinks kromě jedné karty.

**Riziko:** seznam je pravděpodobně indexovatelný obsah a současně může být zdroj pro JS; před případným details ověřit `snar.js` načítání dat, neskrývat `#dict-grid`.

### `minuly-zivot.html` (316 řádků)

**Inventura:** hero s bezpečnostním archetypálním upozorněním (68–78), intent cards (79–125), premium wall s login/register a cenou v Stripe (126–141), formulář jméno/date/place/gender + error/loading (142–189), result s érou, pěti kartami, message, share/favorite a resetem (190–257), dlouhé vysvětlení + FAQ + related links (258–301).

**Renderer:** `minuly-zivot.js` řídí `premium-wall`, `pl-form-wrap`, `pl-error`, `pl-loading`, `pl-result`, všech pět result polí, share buttons, favorite, reset. Nepřihlášený/nepremium uživatel vidí wall/register/login; chyba se zobrazí v `pl-error`; výsledek je API/AI a může být uložen.

**Návrh:** KEEP bezpečnostní disclaimer, premium wall, všechny fields, error/loading, celý result/share/favorite/reset a jeden intent CTA. COLLAPSE pouze vysvětlení do `feature-reference`; existující FAQ details ponechat samostatně. Continuation zkrátit na jednu relevantní kartu. Nezasahovat do wall/form/result wrapperů.

**Riziko:** nejvyšší přístupové riziko; změna pořadí nebo skrytí wall může obejít očekávanou cestu. Cena a zkušební podmínky jsou dynamicky potvrzované přes Stripe.

### `shamansko-kolo.html` (429 řádků)

**Inventura:** hero s vysvětlením cyklu (67–95), intent cards (96–142), formulář jméno/date, error/loading a safety text (143–175), result s wheel/totem/free cards (176–346), premium section/wall s full reading, share/favorite a reset (346–415).

**Renderer:** `shamansko-kolo.js` řídí `mw-error`, loading, result, free result fields, Premium content/wall, share/favorite, reset. Výsledek má bezplatné dvě karty a prémiové silné stránky/výzvy; API/AI error je `mw-error`.

**Návrh:** KEEP hero, intent (max jeden doplňkový CTA), form, safety, free result, premium wall/content, share/favorite/reset. COLLAPSE nebo REMOVE jakýkoli opakovaný promo blok mimo tyto části; podle source je největší prostor v intent cards. Neobalovat result ani premium wall details.

**Riziko:** zdarma dostupné karty musí zůstat viditelné i bez Premium; paywall je funkční hook.

### `aura.html` (277 řádků)

**Inventura:** hlavní section s date inputem, calc button, orb a skrytý result (92–206); result má title/keyword/desc a pět detail cards: silné stránky, výzvy, krystal, čakra, povolání + reset; obrázkový interlude (207), edukace (210–239), related links (240–253).

**Renderer:** `aura.js` lokálně počítá barvu z data, plní všechna `aura-*` pole, přidává `.show`, reset vrací result do skrytého stavu a invalid date označí input.

**Návrh:** KEEP input, validation, result, všech pět hodnot a reset. COLLAPSE pouze edukaci a FAQ-like referenční text, pokud není už v native details; existující accordion ponechat samostatně. KEEP jednu návaznost na numerologii; REMOVE zbylé related chips, pokud nejsou nutné.

**Riziko:** `#aura-result` a `#aura-orb` musí zůstat ve stejném DOM kontextu kvůli rendereru.

### `biorytmy.html` (442 řádků)

**Inventura:** hero (113–135), date form + submit (137–169), skrytý result se stats, chart canvas, legend a profil CTA (171–241), interlude (243), 11karetní cross-link grid (246–372), edukace + FAQ + related links (373–412).

**Renderer:** `biorhythms.js` nastaví max datum, po submitu odhalí `biorhythm-results`, vytvoří Chart.js canvas a plní stats; pokud Chart.js chybí, loguje chybu. Profil CTA je samostatná cesta.

**Návrh:** KEEP form, result/stats/chart/legend a profil CTA. KEEP pouze profil jako relevantní continuation. REMOVE 11karetní cross-link grid. COLLAPSE pouze edukaci do `feature-reference`; existující FAQ details ponechat samostatně. Nevkládat result do details.

**Riziko:** canvas a `bio-stats-container` jsou dynamické; změna wrapperů může rozbít Chart.js sizing.

### `afirmace.html` (219 řádků)

**Inventura:** jediná section s intro, 12 zodiac buttons, skrytě/počátečně prázdná affirmation card, moon badge, copy/share/horoscope CTA, copy confirmation a Premium promo (67–195).

**Renderer:** `afirmace.js` obsluhuje sign buttons, API/fallback affirmation, session/localStorage posledního znamení, copy/share a krátký fallback. Výsledek se zobrazí okamžitě jako loading text, potom API nebo fallback; copy confirmation je dočasné.

**Návrh:** KEEP celý nástroj, 12 znamení, výsledek a copy/share/horoscope hooks. KEEP jediný Premium CTA, ale vizuálně ho držet pod výsledkem. Není zde další dlouhý SEO blok ani duplicitní crosslink; změna není nutná.

**Riziko:** skrytí `affirmation-card` nebo změna `btn-*` znefunkční automatické načtení posledního znamení a share.

### `andelska-posta.html` (196 řádků)

**Inventura:** jediná section s intro, formulářem nickname/text/category, 500znakovým counterem, submit/status (67–149) a `messages-wall` s `#messages-container` (151–169).

**Renderer:** `angel-post.js` načítá 20 zpráv, má loading/empty/error stavy, validaci min. 10 znaků, disabled submit během POST, pending review success, heart like s localStorage a serverovým POST. Chybové/success hlášky jsou `#submit-msg`.

**Návrh:** KEEP všechny fields, counter, submit/status, empty/error wall, like. Není zde opakovaný promo nebo SEO blok; stránku ponechat beze změny.

**Riziko:** jakékoli zkrácení textu v intro nesmí odstranit očekávání veřejného zobrazení a moderace zpráv.

## Ověření

Ověřeno čtením zdrojových HTML, odkazovaných stránkových rendererů a jejich DOM selektorů. Nebyl spuštěn prohlížeč, test ani síťový požadavek. Výše uvedené návrhy jsou kandidáti pro nadřazený implementační krok; tento krok neobsahuje žádnou produktovou úpravu.
