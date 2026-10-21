# Kontrola připravenosti vydání · 21. října 2026

Historie kontroly kandidáta `codex/organic-growth-20261013`, výchozí HEAD `87f1ea50`. Aktuální výsledky jsou v datovaných aktualizacích níže; první tabulka zachycuje původní stav před opravami. Počet 35 otevřených checkboxů společného TODO sám neurčuje blokery vydání.

## Provedené kontroly

| Kontrola | Výsledek |
|---|---|
| Úplná serverová Jest sada | 75 sad prošlo, 11 selhalo; 877 testů prošlo, 14 selhalo, celkem 891 |
| Úplná frontendová Jest sada | 9 sad prošlo, 9 selhalo; 58 testů prošlo, 53 selhalo, celkem 111; dvě selhavší sady se nepodařilo načíst |
| ESLint server/ a js/, limit pěti varování | Prošel |
| Kódování, hooks, auth feature contexts | Prošly; 44 auth kontextů |
| AI cost control a SEO semantics | Prošly |
| Úplný tracked diff proti HEAD | `git diff --check HEAD` prošel; pouze informace o CRLF/LF |
| Audit struktury webu | Po níže popsané opravě prošel |
| Sitemap | URL sada souhlasí; metadata/pořadí jsou zastaralé |
| Generátory obsahu | Řetězec skončil na blogových cluster odkazech: jeden článek nesouhlasí; pozdější generátory se tímto příkazem neprovedly |
| Paywall trust checker | Selhal na starém požadavku, aby Mentor monetizoval také HTTP 403; nejdřív opravit očekávání podle aktuální bezpečné logiky |

První serverový běh byl přerušen po `connect EACCES` na lokálním loopbacku. Výše uvedené úplné výsledky pocházejí až z opakování s povoleným loopbackem. Testovací setup používá `NODE_ENV=test`, testovací klíče a mockované služby. Skutečná platba, e-mail ani produkční změna nebyly součástí kontroly.

Lokální surové výsledky: `output/release-readiness-20261021/server-results.json`, `frontend-results.json` a odpovídající logy. Tento adresář je ignorovaný Gitem.

## Potvrzené blokery a potřebné rozlišení

- `static-html-csp.test.js`: živý `slovnik/akasicke-zaznamy.html` stále obsahuje `<style>` a načítá `../js/main.js` místo existujícího distribučního assetu. Nejde jen o zastaralý mock testu. Zkontrolovat a opravit příslušnou rodinu i její zdrojovou šablonu.
- Frontendové modely prostředí neodpovídají aktuálním browserovým API: chybí `removeAttribute`, `setAttribute`, `window.addEventListener` a mock export `getProfileScrollBehavior`. Runový VM harness navíc nenačte nový ESM import. Opravit modely při zachování skutečných behaviorálních očekávání; nezjednodušovat aplikační přístupnost kvůli testům.
- Mentor a DOMPurify mají stará zdrojová očekávání; ověřit jejich dnešní chování a přesun sanitizace do sdíleného helperu. HTTP 403 neměnit zpět na nabídku členství jen kvůli starému testu.
- Serverové neúspěšné sady: `static-html-csp`, `seo-ctr-sprint-static`, `personal-map-pdf`, `api`, `push`, `astrology-routes`, `auth-edge-cases`, `user-readings`, `relationship-tarot`, `email-service`, `script-guardrails`. Push případ padá na chybějícím importu `jest`; další zahrnují nesoulad stavů 400/403, očekávaného flow ID a textových kontraktů. Každý případ posoudit samostatně; 14 selhání nelze vydávat za 14 potvrzených vad aplikace.
- `blog/5-znaku-ze-potkavate-svou-spriznenou-dusi.html` má jiné tematické odkazy než očekává generátor. Neprovádět slepé přegenerování: současné vztahové odkazy nejdřív porovnat s kategorií/override generátoru.
- Po stabilizaci kandidáta obnovit metadata sitemap, zopakovat dotčené kontroly a dokončit browserovou QA změněných platebních, auth/profilových a mobilních cest. Aktuální kontrola ji nenahrazuje.

Platební sady `payment-checkout`, `payment-billing-state`, webhook reservation/entitlement failures, `one-time-orders`, reconciliation/fulfillment, `personal-map-fulfillment` a `relationship-tarot-webhook` prošly. To neuzavírá selhavší vztahový checkout test ani živé Stripe/doručovací přijetí.

## Oprava provedená během kontroly

`scripts/audit-site-structure.mjs` obsahoval syntakticky poškozenou mapu verzí assetů. Obnoveny jsou neversionované klíče a aktuální verze podle `refresh-auth-asset-versions.mjs`. Aktualizátor nyní tento audit vynechává: tabulka má obsahovat cesty, nikoli přepisované URL. Oba skripty prošly `node --check`; celý site audit po opravě prošel. Veřejné JS/CSS ani cache tato oprava nemění.

Další krok: opravit konkrétní selhání, zopakovat příslušné testy a následně dokončit browserové přijetí jednoho stabilního kandidáta. Ostatní otevřené designové nápady lze podle rizika odložit do dalšího vydání.

## Aktualizace kontrolovaného release – 21. 10. 2026

Původní neúspěšné výsledky výše zachycují první kontrolu, nikoli aktuální stav kandidáta.

- Úplná serverová sada po opravách: 86 sad, 891 testů prošlo, žádné selhání (`server-final-results.json`).
- Úplná frontendová jednotková sada: 18 sad, 147 testů prošlo, žádné selhání (`frontend-fixed-results.json`).
- Opraven CSP slovníku v šabloně i generátoru, oddělen reset-password limiter, sjednoceny generátory a asset manifesty. Lint, audit struktury, obsahové generátory, statické huby a kontrola CSS transitions prošly.
- Databázová migrace denních rezervací prošla 20 izolovanými SQL kontrolami; test neověřuje souběh více databázových spojení.
- Browserová kontrola profilu se dokončuje po opravách zastaralých testovacích fixtures. První částečné výsledky nejsou úplnou akceptací kandidáta.
- Produkční migrace dosud neprovedena. Konektor dvakrát vrátil Invalid or expired requestState. Automatická kontrola odmítla OAuth přihlášení do Supabase přes GitHub; čeká se na výslovné povolení tohoto přihlášení nebo ruční přihlášení uživatele.
- Aplikační release dosud nebyl pushnut ani nasazen. Kód vyžadující nové RPC nesmí být nasazen před úspěšnou migrací a ověřením oprávnění.

Oddělený release checkout: `.codex-tmp/controlled-release-20261021`, větev `codex/controlled-release-20261021`. Původní rozpracovaný index zůstává zachovaný. Finální nasazení musí projít deploy guardem a kontrolou veřejné produkce.

### Produkční databáze – migrace dokončena

Po ručním přihlášení Pavla byla přes SQL Editor provedena ověřená migrace `20261018075356_user_daily_quota_reservations.sql`, včetně stejné verze v `supabase_migrations.schema_migrations`, v jedné transakci. Editor vrátil Success. Nezávislý read-only dotaz potvrdil obě tabulky s RLS, tři SECURITY DEFINER funkce s prázdným search_path a rezervaci dostupnou service_role, nikoli anon/authenticated. Bylo odesláno obnovení PostgREST schema cache. Stávající zákaznické tabulky nebyly mazány. Doklad: lokální `output/release-readiness-20261021/supabase-migration-success.png`.

Zbývá opravit a cíleně ověřit mobilní uložení data narození v profilu. Aplikační nasazení dosud neproběhlo.

### Závěrečné cílené opravy

- Mobilní datum narození: desktop i mobil prošly uložením i odebráním (`profile-dob-final.json`, 2/2). Problém byl v interakci testu s nativním datovým polem; běžný klik na další popisek pole před odesláním umožnil skutečný klik a PUT bez vynucených událostí. Aplikační formulář nebyl kvůli testu oslaben. Dočasná diagnostika EventTarget byla odstraněna.
- Growth-loop audit našel tři neznámé feature parametry u bezplatných blogových odkazů. Odstraněny pouze tyto parametry; cílové URL a source zůstávají. Opraven i zdroj blogových dat. Growth-loop audit nyní prochází, všech 78 tarotových obrázků existuje.
- Probíhá poslední ověření 17 původně selhavších profilových scénářů na obou zařízeních; dosavadní cílené opravy nejsou vydávány za úplnou E2E kontrolu celého webu.

### Akceptace kandidáta před pushem

Všechny původní browserové neúspěchy mají po opravách testovacích fixtures potvrzený úspěšný výsledek. Poslední běh opravených profilových scénářů: 32/34 prošlo; zbývající 2 případy opravila běžná interakce s rozbalovací sekcí Paměť rituálů (otevření přes summary) a cílené opakování prošlo 2/2 na desktopu i mobilu. Souhrn aktuálních výsledků podle názvu scénáře a projektu je uložen v `browser-acceptance-summary.json`; nejde o celou plánovanou E2E sadu webu. Platební kontroly používaly testovací služby a neprovedly skutečný nákup ani odeslání e-mailu.

Release je přijatý k autorizovanému pushi; produkční aplikace ještě musí projít GitHub CI, Railway a veřejným smoke ověřením. Zbývající produktový TODO zůstává otevřený pro další dávky.
