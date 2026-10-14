# Navazující kontrola přihlášení, registrace a účtu

14. 10. 2026 · pouze průzkum · žádné produktové úpravy ani nasazení.

## Co bylo skutečně ověřené

- Veřejné login/register přepínání a prázdná inline validace na lokálním desktopu, mobilu a u konkrétní vady také na produkci.
- Přepnutí viditelnosti hesla mění typ pole, text tlačítka a aria-pressed; autocomplete login/current-password a register/new-password se správně přepíná. Registrace vyžaduje minimálně 8 znaků a souhlas, údaje narození nevyžaduje.
- Obnova: veřejný formulář, prázdná validace, návrat do loginu, vstup bez tokenu; lokálně také provider-error fragment. Nebyl poslán obnovovací e-mail ani změněné heslo.
- Ceník → registrace členství → existující účet: produkčně zachovaný plan=pruvodce, redirect, source, feature a billing_interval. Stripe checkout nebyl vytvořený ani potvrzený.
- Veřejný profil → registrace profilu zachovává profile_history a návrat na /profil.html. Ukázky jsou viditelně označené; bez účtu se netváří jako uložené skutečné výklady.
- Lokální simulace HTML odpovědi místo API JSON se smyšlenými údaji proti statickému serveru. Nejde o autentizaci na produkci ani ověření reálného backendu.
- 19 zaznamenaných stavů v [browser záznamu](account-browser-checks.json). Jde o varianty a kontroly, ne 19 nezávislých stránek nebo 19 kompletních zákaznických cest.

## Konkrétní problémy

### A01 · P1 · Chyby se přenášejí mezi přihlášením a registrací

**Ověření:** Lokální desktop i produkční mobil.

**Důkaz:** Prázdné Přihlásit se → přepnout na Registraci. Nový režim stále ukazuje shrnutí a dvě chyby Vyplňte prosím toto pole, i když v registraci ještě nic odeslané nebylo.

**Místo ve zdroji:** js/prihlaseni.js:710 applyMode, :1099 toggleBtn; js/ui/forms.js inline validation.

**Úprava:** Při změně režimu vyčistit souhrn i chyby všech polí; zachovat běžné hodnoty jen podle úmyslu uživatele a validovat až aktuální režim.

[Snímek daného stavu](screenshots/account-production-register-stale-errors-mobile.png)

### A02 · P2 · Přepnutí režimu nechá začátek nového formuláře mimo obrazovku

**Ověření:** Produkční mobil, též lokální přechody.

**Důkaz:** Po stejném přepnutí register bylo scrollY 353,6 px a nadpis začínal na −218,8 px. Fokus zůstává na přepínacím tlačítku; uživatel nevidí nový začátek.

**Místo ve zdroji:** js/prihlaseni.js:972–985 forgot/back handlers; :1099–1103 mode toggle.

**Úprava:** Po přepnutí přesunout fokus na nový nadpis nebo první pole a zajistit viditelnost pod pevným záhlavím. Nedělat plošný autoscroll během psaní.

[Snímek daného stavu](screenshots/account-forgot-mobile.png)

### A03 · P2 · Registrace míchá tykání, vykání a opakované vysvětlování

**Ověření:** Lokální i produkční veřejné režimy.

**Důkaz:** Vytvoř si účet / tvoje data vedle Vytvoříte účet, Profil doplníte a Po registraci vás provedeme. Několikrát opakuje zdarma, bez karty a doplnění údajů později.

**Místo ve zdroji:** prihlaseni.html:42–65 signup value panel; js/prihlaseni.js SIGNUP_CONTEXT_BY_FEATURE a applyMode.

**Úprava:** Sjednotit tykání a zkrátit obsah na jeden kontextový odstavec. Mobilní pole už jsou nahoře (e-mail kolem 312 px); nepřesouvat je kvůli source pořadí.

[Snímek daného stavu](screenshots/account-register-fresh-mobile.png)

### A04 · P2 · Text členství po přepnutí na login stále mluví o registraci

**Ověření:** Produkční mobil.

**Důkaz:** Ceník → Začít 7 dní za 0 Kč → Účet už mám. Nadpis i submit jsou pro přihlášení, ale banner stále říká Po registraci rovnou otevřeme bezpečný checkout. Main nepřipomíná následných 199 Kč/měsíc.

**Místo ve zdroji:** js/prihlaseni.js:38–43 getCheckoutPromiseCopy; :641–657 renderCheckoutContext.

**Úprava:** Text odvodit od aktuálního režimu. Vedle CTA stručně zopakovat aktuální cenu po zkoušce a požadavek karty, údaje převzít z manifestu. Samotný plán/redirect/source/billing interval se při přepnutí zachoval.

[Snímek daného stavu](screenshots/account-production-membership-login-mobile.png)

### A05 · P1 · Neplatný vstup do resetu nemá jasný recovery stav

**Ověření:** Produkce bez tokenu; lokální syntetický vypršelý fragment.

**Důkaz:** /prihlaseni.html?reset=true bez tokenu ukáže běžný login bez informace o obnově. Lokální reset=true#error=access_denied&error_code=otp_expired ukázal formulář nového hesla; po vyčištění URL zůstal formulář otevřený. Nebyl zadán ani změněn nový password.

**Místo ve zdroji:** js/prihlaseni.js:404–405, :844–854 — režim vyžaduje jen neprázdný hash; :1056–1061 validuje token až při submitu; js/auth-client.js:221–249.

**Úprava:** Rozlišit platný recovery vstup, chybějící token a provider error před zobrazením polí. Neplatný odkaz musí nabídnout vyžádání nového odkazu. Skutečný platný e-mailový reset se musí ověřit zvlášť.

[Snímek daného stavu](screenshots/account-reset-expired-local-mobile.png)

### A06 · P2 · Při odpovědi API mimo JSON se zákazníkovi ukáže technická chyba

**Ověření:** Lokální simulace nedostupného API.

**Důkaz:** Smyšlené přihlášení audit@example.invalid proti statickému lokálnímu serveru zobrazilo anglický JSON parse error: Unexpected token < … is not valid JSON. Toto není důkaz výpadku produkce.

**Místo ve zdroji:** js/auth-client.js:413–442 login res.json/catch; js/prihlaseni.js:946–961 převzetí error.message.

**Úprava:** Ošetřit neočekávaný formát/HTTP odpověď; zobrazit srozumitelnou českou chybu a ponechat možnost zopakovat. Technický detail logovat zvlášť, bez hesel/tokenů.

[Snímek daného stavu](screenshots/account-api-unavailable-local-mobile.png)

### A07 · P2 · Starší auth modal má slabší přístupnost než samostatná stránka

**Ověření:** Zdroj; aktivní modal nebyl v této kontrole vyvolán.

**Důkaz:** Close je span bez keyboard role/tabindex, labely nejsou svázané s poli, obal nemá dialog/aria-modal. Auth-copy-fixes dodává close aria-label, nikoli keyboard button. Auth-client otevření nemá vlastní fokus/Escape management.

**Místo ve zdroji:** js/templates.js:214–265; js/auth-client.js:1654–1697; js/auth-copy-fixes.js:21–25.

**Úprava:** Buď sjednotit aktivní vstupy na samostatnou stránku, nebo doplnit skutečný dialog s tlačítkem zavření, názvy polí, fokusovým cyklem a návratem fokusu. Nejprve určit, které vstupy legacy modal používají.

### A08 · P2 · Potvrzení úspěšného resetu zmizí při okamžité navigaci

**Ověření:** Zdroj; skutečné heslo se neměnilo.

**Důkaz:** Po data.success vytvoří stránka toast a ihned nastaví location.href na login. Potvrzení v původním dokumentu nepřežije reload.

**Místo ve zdroji:** js/prihlaseni.js:1077–1081.

**Úprava:** Předat potvrzení do nové přihlašovací obrazovky a ukázat ho jako trvalou srozumitelnou informaci. Nenastavovat fiktivní úspěch podle samotného query parametru.

### A09 · P2 · Účet potřebuje kratší společnou patičku a sjednocený onboarding

**Ověření:** Lokální veřejný profil a onboarding.

**Důkaz:** Guest profil má hezky označené ukázky a funkční odkazy na registraci/free tarot. Hlavní clutter je společná dlouhá patička; onboarding má jiné fialové povrchy. Profil za přihlášením nebyl vizuálně otevřený.

**Místo ve zdroji:** components/footer.html; css/pages/onboarding.css; profil.html:39–95.

**Úprava:** Použít úpravy V03/V10; zachovat veřejnou ukázku a jedno hlavní CTA. Historii, oblíbené, deník, nastavení a billing doladit až v odpovídajícím testovacím účtu.

[Snímek daného stavu](screenshots/account-profile-guest-mobile.png)

## Co zatím nelze označit za ověřené

Úspěšné přihlášení skutečného účtu, doručení a průchod platným recovery e-mailem, úspěšná registrace/ověření e-mailu, členský profil, skutečná historie/oblíbené/zápis deníku a zrušení předplatného. Nebyl použit účet zákazníka ani soukromá data. Tyto stavy byly posouzené ze zdroje; současná kontrola nenahrazuje bezpečný testovací účet a sandbox platby.

Zdroj profilu již má loading/error/empty stavy, stránkování historie a ve `js/profile/modal.js` také fokusový cyklus a návrat fokusu. Proto není správné přenášet slabiny starého auth modalu na profilový modal automaticky.

Čitelný cookie indikátor přihlášení je pomůcka UI; sám nedokazuje bezpečnostní vadu. `clearStaleSession()` a serverové session kontroly se musí brát v úvahu. V této kontrole nebyl potvrzen auth bypass.

## Co opravit první

1. A01/A02: čisté přepnutí formulářů, chyby a fokus.
2. A05/A08: jasná obnova pro neplatný odkaz a trvalé potvrzení skutečného úspěchu.
3. A03/A04/A06: sjednocený hlas, správný text členství a české chybové hlášky.
4. Aktivní auth modal a společné povrchy; potom chráněný profil v testovacím účtu.

Novou ilustraci pro login nyní nepotřebujeme. Navy karta, zlatý symbol a čitelná pole již ladí; důležitější je odstranit opakované texty a opravit stavy.

[Hlavní seznam celého webu](README.md) · [Zdrojové poznámky pomocníka](source-account-followup.md)
