> Pomocná zdrojová kontrola. Ověřené runtime nálezy a omezení jsou v [navazujícím review účtu](account-review.md).

# Source follow-up: přihlášení a účet

Datum: 2026-10-14  
Rozsah: readonly průchod zdrojů v `release-20261012`; bez env/secrets, zákaznických dat, API volání, testů a produktových úprav.

## Konkrétní nálezy

### UX/accessibility: auth modal má neovladatelný close prvek a nesvázané labely

- `js/templates.js:218` vykresluje zavření modalu jako `<span class="modal__close">✕</span>`, bez `button`, `role` a `tabindex`. `js/auth-copy-fixes.js:21–25` později dodává aria-label; samotná klávesová ovladatelnost tím doplněná není.
- `js/auth-client.js:262–269` binduje pouze kliknutí na overlay; v tomto místě není vidět klávesové zavření ani focus management pro modal.
- `js/templates.js:221–227,230` obsahuje labely bez `for` a inputy bez odpovídajícího `id`.

Dopad: klávesnice a screen reader nemusí nabídnout zavření ani správné pojmenování polí. Jde o UX/accessibility v dynamickém modalu, ne o autentizační bypass.

### UX: reset hesla po úspěchu okamžitě naviguje pryč od potvrzení

- `js/prihlaseni.js:1077–1081` zobrazí success toast a ihned nastaví `window.location.href = '/prihlaseni.html'`.

Dopad: toast je v původním dokumentu a při navigaci může zmizet dřív, než jej uživatel přečte. Samotný reset request používá hash access token a `Authorization` (`:1056–1069`); v source není důkaz serverové chyby.

### Stavová integrita: client UI považuje čitelný cookie indikátor za přihlášení

- `js/auth-client.js:58–60` určuje `hasLoginCookie()` podle `document.cookie === 'logged_in=1'`.
- `js/auth-client.js:272–280` vrací tuto hodnotu z `isLoggedIn()` a podle ní přepíná UI; skutečný profil se načítá až následně v `refreshSession()` (`:170–194`).

Dopad: podvržený nebo zastaralý indikátor může krátce zobrazit přihlášené UI, i když serverové API session odmítne. To není přímý bypass serverové autorizace, ale zdroj zvyšuje riziko matoucího loading/error stavu; server musí zůstat jediným rozhodovatelem přístupu.

## Potvrzené ochrany a cesty

- `js/prihlaseni.js:1115–1124` a `:1142–1151` odmítají redirect bez počátečního `/` nebo s `//`; zůstává interní fallback `/profil.html`.
- `js/onboarding.js:171–180` kontroluje lokální redirect přes `startsWith('/')`, zákaz `//` a `parsed.origin === window.location.origin`.
- `js/onboarding.js:675–711` posílá completion jako credentialed POST s CSRF tokenem; dokončení i přeskočení mají vlastní redirect flow (`:739–771`).
- `js/profile/dashboard.js:1731–1748` rozlišuje guest preview od dashboardu; guest CTA vede na registraci nebo login. Historie má explicitní load-more tlačítko z HTML `profil.html:219–220` a listener v `dashboard.js:1821`.
- `js/cenik.js:415–462` sanitizuje recovery URL/context a ukládá recovery context jen do session storage s TTL; `:684–708` renderuje cancel/failure recovery s cenou a pokračováním.

## Nejisté body k vizuálnímu ověření

- Přihlašovací stránka načítá `js/dist/prihlaseni.js` a `js/dist/core.js` (`prihlaseni.html:152–159`); source a dist by měly být před produktovou opravou porovnány. Tento report nepředstírá runtime shodu.
- U reset flow je hash uložen do lokální konstanty (`prihlaseni.js:405`, `:1056`), zatímco core zpracovává auth hash (`auth-client.js:221–249`). Zdrojový pořadník defer skriptů naznačuje zamýšlený flow, ale bez runtime nelze potvrdit souhru v každém reset/verification režimu.
- `profil.html:272–278` má modal s tlačítkem zavření, ale report netvrdí chybu fokusového návratu bez browserového ověření.

## Klasifikace

- **Bezpečnost:** nebyl potvrzen přímý auth bypass ani otevřený redirect; cookie indikátor je stavové riziko klientského UI, ne autorizace.
- **UX/accessibility:** potvrzené jsou modal close/label markup a krátce žijící success toast po resetu.
