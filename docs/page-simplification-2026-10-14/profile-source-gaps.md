# Source follow-up: profilové mezery

Datum: 2026-10-14  
Rozsah: readonly source audit `release-20261012`; bez DB, customer dat, auth tokenů, API volání, testů a produktových změn.

## Potvrzené source gaps

### Profil neumí upravit datum narození

- `profil.html:247–259` má osobní údaje `settings-name`, `settings-birthtime` a `settings-birthplace`, ale žádné pole `settings-birth-date`/`birth_date`.
- `js/profile/settings.js:44–56` načítá pouze jméno, email, čas a místo narození.
- `js/profile/settings.js:76–87` odesílá pouze `first_name`, volitelně `birth_time` a `birth_place`; `birth_date` se do PUT payloadu nikdy nepřidává.
- `js/onboarding.js:484–497,553–570` ukládá při onboardingu vybrané znamení/personalizaci (`mh_zodiac`), ne datum narození.
- `js/profile/dashboard.js:1405–1414` při chybějícím znamení odkazuje do onboardingu; to vysvětluje cestu k rychlému signálu, ale neřeší editaci skutečného data narození.

**Klasifikace:** UX/product consistency gap. Není to bezpečnostní chyba. Je to záměrné pouze tehdy, pokud profil garantuje editaci času/místa a znamení je vždy ruční preference; zdroj současně používá `user.birth_date` pro výpočet znamení (`dashboard.js:1787–1795`), takže chybí cesta k opravě již uloženého data.

### Historie se stránkuje jen klientsky a request nemá explicitní limit/page

- `js/profile/readings.js:34–47` volá `/user/readings` bez `limit`, `offset`, `page` nebo cursoru a převezme `data.readings`.
- `js/profile/readings.js:10` nastavuje `PAGE_SIZE = 10`; `:223–224` vykreslí pouze `filtered.slice(0, displayedCount + PAGE_SIZE)`.
- `js/profile/readings.js:261–274` jen mění lokální zobrazení přes „Načíst další“.
- `profil.html:219–220` má jedno load-more tlačítko.

**Klasifikace:** UX/data scalability gap. Pokud backend vrací defaultně prvních 20 záznamů, uživatel bez dalšího serverového page API nikdy neuvidí starší historii; pokud vrací vše, roste payload a client memory. Zdroj sám neprokazuje, kterou variantu server používá.

### Subscription card označuje každý premium period end jako „Další obnova“ a přidává Stripe portal podle plan typu

- `js/profile/settings.js:289–301` načítá `currentPeriodEnd` a pro každý premium stav kromě `cancel_pending`/`trialing` použije label `Další obnova` (`:320–327`). To může být nepřesné pro jednorázový, legacy nebo ručně přidělený premium stav bez automatické obnovy.
- `js/profile/settings.js:336–352` vykreslí pro každý `isPremium` plan tlačítko `Správa plateb`; `isPremium` je odvozeno z `normalizedPlanType !== 'free'` (`:282–286`), ne z přítomnosti Stripe customer/subscription ID.
- Handler `:489–523` volá `/payment/portal` bez dalšího lokálního rozlišení legacy/non-Stripe stavu.

**Klasifikace:** UX/access path mismatch, potenciálně support issue. Není potvrzené, že legacy stav v produkci existuje; source pouze dovoluje, aby ne-Stripe premium dostal Stripe portal CTA a aby period end vypadal jako obnova.

## Co jsem nepotvrdil jako vadu

- Stat cards (`profil.html:181–184`, `dashboard.js:1585–1600`) počítají z načteného pole; jejich správnost závisí na rozsahu API response, který tento source-only audit nezná.
- CSS má obecný `.settings-form` max-width a grid (`css/style.v2.css:11739–11770`), ale bez runtime screenshotu nelze tvrdit, že labely nebo inputy jsou zdrojově malé.
- Onboarding bezpečně validuje lokální redirect (`js/onboarding.js:171–180`) a vybraný sign ukládá odděleně; absence birth-date pole je výše uvedená produktová/UX mezera, ne redirect ani auth problém.
