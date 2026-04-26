# Technical Debt Backlog

Aktualizace: 2026-04-26

## P0/P1 - nejblizsi sprinty

1. **Externalizovat inline skripty ze statickych stranek**
   - Stav: hotovo pro bezne produktove i kontrolni HTML. Executable inline JS a inline `on*` handlery jsou odstranene, CSP drzi `script-src-attr 'none'` a `script-src` nepouziva `unsafe-inline`.
   - Proc: stranky porad obsahuji inline JSON-LD bloky. Ty jsou ted povolene pres automaticky generovane `sha256` hashe.
   - Dalsi krok: pokud bude CSP header prilis dlouhy nebo budeme chtit jednodussi audit, presunout JSON-LD do server-side injection s nonce.

2. **Odstranit inline styly a zpresnit `style-src`**
   - Stav: hotovo. Verejne HTML stranky i kontrolni HTML jsou bez statickych `style` atributu, bez `<style>` bloku a bez inline handleru. Runtime renderery byly prepsane na CSS tridy / DOM API, buildovane JS vystupy jsou bez `.style.*` zapisu mimo explicitni vendor vyjimku `three.min.js`.
   - Proc: CSP uz muze bezet bez `style-src 'unsafe-inline'`; regresni test hlida, aby se inline styly nevratily.
   - Dalsi krok: pri dalsim UI refaktoru preferovat CSS tridy a DOM API, ne stringove `innerHTML` fragmenty se style atributy.

3. **Sjednotit asset strategy**
   - Stav: hotovo pro verejne stranky. JS build umi i podadresare, profil a testy jsou prepnute na `js/dist/profile/*` a `js/dist/quiz/*`. Regresni test hlida existenci lokalnich JS/CSS assetu, zakazuje navrat ke zdrojovym `js/*.js` referencim pro buildovane entrypointy a kontroluje, ze dist soubory s `import/export` syntaxi jsou nacitane jako `type="module"`.
   - Proc: mensi rozdil mezi vyvojem a produkci, konzistentnejsi caching a snazsi smoke testy.
   - Dalsi krok: `js/vendor/*` ponechat jako zamerne vendor vyjimky; pri pridani dalsich nested entrypointu je build zahrne automaticky.

4. **Zpresnit service worker caching**
   - Stav: hotovo. `build:css` i `build:js` spousti `scripts/update-service-worker-cache.mjs`, ktery validuje precache assety a vaze `CACHE_NAME` na hash jejich aktualniho obsahu.
   - Proc: pri dalsich zmenach buildu se cache verze meni deterministicky a test selze, pokud zustane zastarala.
   - Dalsi krok: pokud bude precache seznam rust, oddelit seznam assetu do samostatneho manifestu a generovat i `STATIC_ASSETS`, ne jen cache verzi.

## P2 - stredni priorita

5. **Dokoncit observabilitu business funnelu**
   - Stav: hotovo pro zakladni operativni reporting. Server-side audit log je pridany pres `funnel_events`; backend zapisuje paywall/login gate impressions, upgrade CTA views, checkout validation failures, checkout session created/failed, subscription checkout completed, one-time purchase completed, invoice paid/failed, refundy, cancel requesty, reaktivace, subscription updated/cancelled a webhook failures. Admin API ma `GET /api/admin/funnel`, ktere agreguje paywall views, checkouty, premium konverze, jednorazove nakupy, selhani, refundy, zdroje, funkce, plany a posledni udalosti. `admin.html` zobrazuje funnel prehled za 7-365 dni vcetne paywall -> checkout a checkout -> purchase pomeru.
   - Dalsi krok: jakmile bude dost dat, doplnit export/report po dnech a porovnavani zdroju mezi tydny.

6. **Konsolidovat plan naming**
   - Stav: hotovo pro server i cenik. `server/config/constants.js` drzi `PLAN_TYPES`, `PREMIUM_PLAN_TYPES`, `SUBSCRIPTION_PLANS`, legacy aliasy, normalizaci a verejny plan manifest. `GET /api/plans` vraci verejna data o planech a mapu pro cenikovou stranku; `js/cenik.js` z nej odvozuje ceny a checkout `planId` s fallbackem na statickou konfiguraci.
   - Dalsi krok: pri pridani dalsich placenych produktu napojit na stejny manifest i profilovy dashboard a upgrade/paywall modaly.

7. **Zlepsit test coverage pro frontend flow**
   - Stav: hotovo pro pricing checkout smoke i post-auth pending checkout. `tests/e2e/cenik-payment.spec.js` pokryva neprihlaseny redirect na prihlaseni, ulozeni pending planu, prihlaseny checkout s mocknutym Stripe endpointem vcetne `planId`, `source`, `feature` a `billingInterval` payloadu a registracni flow, kde se pending checkout po registraci automaticky dokonci se stejnym kontextem.
   - Dalsi krok: pri vetsich zmenach auth/onboardingu rozsirit jeste mobilni projekt nebo visual smoke pro prihlasovaci stranku.

## P3 - pozdeji

8. **Uklidit historicke audit dokumenty a worktree artefakty**
   - Stav: hotovo pro bezpecny uklid. Stare audit/report/setup dokumenty z korene jsou presunute do `docs/archive/2026-03-audits/`, koren ma zustat jen pro aktivni vstupni dokumenty. Tracked Python bytecode artefakty (`*.pyc`) byly odstranene z workspace a `.gitignore` doplnen o pytest docasne adresare.
   - Dalsi krok: pokud se budou generovat dalsi reporty, ukladat je rovnou do `docs/` nebo mimo repo.

9. **Zavest automatizovane link/schema kontroly**
   - Stav: hotovo pro staticky audit. `npm run audit:site` kontroluje sitemap URL, canonical targety, sitemap/canonical soulad, validni JSON-LD a existenci lokalnich `href`/`src` targetu. Opravene byly broken linky na `shamansko-kolo.html`, obracene kompatibilitni odkazy a favicon reference.
   - Dalsi krok: pred deployem poustet spolu s testy; pozdeji lze doplnit live HTTP status check proti stagingu.
