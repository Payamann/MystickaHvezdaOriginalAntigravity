# Profil a přihlášení · mobilní přijetí · 17. října 2026

Lokální kandidát navazuje na `d9d9b346`. Skutečný klient a syntetické účty, bez produkčních údajů, plateb nebo e-mailů. Přijímá uvedené mobilní profilové a přihlašovací stavy; neuzavírá mobilní audit celého webu.

## Opravy podle skutečného zobrazení

- **Dvojí rolování detailu:** mobilní `.reading-detail__body` měla vlastní limit 400 px a `overflow-y:auto` uvnitř dalšího rolovatelného modalu. Při 390 px to bylo 400 px viditelného těla / 552 px obsahu. Na <=760 px nyní plyne celý výklad přirozeně v jednom rolování modalu. Desktopové pravidlo zůstává samostatné.
- **Malé dotykové cíle:** osm tlačítek zpětné vazby mělo 37 px na výšku. Na mobilu mají nejméně 44 px; ponechávají stejné chování a zalamování. Ověřeno po opravě na 320 i 390 px. [Detail 320](qa-evidence/profile-reading-mobile-320.png), [390](qa-evidence/profile-reading-mobile-390.png).

Jediná aplikační změna této dávky je lokální CSS. Nepřidává se další obsah, grafika ani nová přihlašovací logika.

## Skutečný rozsah mobilního průchodu

| Šířka | Stav a ověření |
|---|---|
| 390 px | Nastavení v jednom sloupci, členská karta trialu, prázdný Přehled, naplněný detail před/po opravě, přihlašovací chyba |
| 320 px | Historie, filtr starších poznámek, Oblíbené, Přehled s přímým návratem, uložený detail, Nastavení, přihlášení s chybou, registrační a obnovovací formulář |
| 768 px | Nastavení na tabletu, tři sloupce narození, čitelné záložky |

U zaznamenaných stavů nepřesahovala šířka dokumentu viewport: 382/390, 312/320 a 760/768 px. Rozdíl je prostor posuvníku. Tabletový modal se tímto průchodem netvrdí. [Naměřené stavy](qa-evidence/profile-auth-mobile-matrix.json), [členství na mobilu](qa-evidence/profile-membership-mobile-390.png), [nastavení tabletu](qa-evidence/profile-settings-tablet-768.png).

Klávesnice: mobilní menu otevřelo první odkaz a Escape vrátil fokus na hamburger. V detailu Shift+Tab z křížku přešel na poslední akci; Tab z poslední akce vrátil fokus na křížek. Escape zavřel detail a vrátil fokus na původní spouštěč. Nic se nemazalo.

## Přihlášení — potvrzení existujícího chování

Skutečná samostatná stránka už zobrazuje trvalé shrnutí chyby uvnitř formuláře s `role="alert"` a `aria-live="assertive"`. Původní domněnka pomocníka podle staré modalové submit větve byla po kontrole `prihlaseni.js` opravena; nevyvolala zbytečnou změnu zdrojů.

- Chyba zachovala modelový e-mail, znovu zpřístupnila Přihlásit se a byla viditelná i při 320 px. [Snímek](qa-evidence/login-error-mobile-320.png).
- Zobrazit/skrýt heslo přepnulo typ pole. Přepnutí na registraci zachovalo `autocomplete=new-password` a povinný souhlas; účet tímto formulářem nebyl vytvořen ani souhlas potvrzen. Obnovovací formulář se pouze otevřel, bez odeslání.
- První modelový pokus s novým e-mailem byl mockem přijat a přesměroval do prázdného profilu: testovací klient automaticky zakládá nové modelové identity. **Nešlo o důkaz odmítnutí neplatných údajů.** Následná chyba byla ověřena existujícím explicitním mock scénářem `wrong-password` proti skutečné login route. Všechny údaje byly vymyšlené a zůstaly v lokálním mock prostředí.

ARIA atributy jsou doložené v DOM; netvrdí se zde samostatná zvuková zkouška s konkrétní čtečkou obrazovky. Platný reset token, doručení obnovovacího e-mailu a změna reálného hesla nadále patří do PV03.

## Uzavření modelové matice PV01

Dosavadní důkazy nyní pokrývají celý uvedený seznam PV01, ne všechny kombinace celého produktu:

| Případ PV01 | Důkaz |
|---|---|
| Prázdný účet | Tento mobilní průchod a dřívější modelový profil v [QA](qa-results.md) |
| Jediná dnešní reflexe | [Přijetí PF05](reading-fidelity-qa.md), první zápis 1/5 → 2/5 |
| Starší poznámky mimo první historii | Aktuální filtr 10 starších journalů a [nezávislý profilový kontext](../../tests/frontend/profile-context.test.js) |
| Více druhů výkladů | Skutečné profilové tarot/horoskop/journal a [PV04 matice formátů](reading-fidelity-qa.md) |
| Chyba avataru | [QA 15.–16. 10.](qa-results.md): PUT 500 zachoval původní symbol, retry uspěl |
| Chyba detailu | [Skutečný modul modalu v modelovém DOM](../../tests/frontend/profile-modal.test.js): loading/error/wrong-id blokují akce, neúspěšná změna nabízí retry |
| Přerušení načítání | Stejná regresní sada: opožděné A nepřepíše B ani jeho loader; zavření zneplatní odpověď a vrátí fokus |

Starší úspěšné testy se neopakovaly jen kvůli tomuto soupisu. Po CSS opravě se znovu ověřil právě dotčený modal. Bez změny JS nebyl potřeba jeho nový build. Existující SW manifest **5/5**, kontrola encodingu změněných souborů a diffu. Cache `mysticka-hvezda-24ca976bd767`, snapshot **1126** veřejných verzí.

Viewport v předchozích pokusech ovlivňoval jiný vybraný panel. Tentokrát vlastní viditelně otevřená QA karta byla skutečně vybraná a naměřená šířka odpovídala zadání. Dočasná emulace byla na konci resetovaná. Pomocník Luna provedl ohraničené čtení zdrojů a opravil svůj mylný login nález; hlavní agent provedl CSS změny i browserové ověření. Číselná úspora se netvrdí.

## Další práce

PV01 je místně přijaté. PV02 ještě potřebuje skutečnou testovací Stripe návaznost a PV03 platný obnovovací token/doručení. W07/W13 zůstávají otevřené pro ostatní změněné rodiny stránek, včetně poslední horoskopové mřížky. Produkce se v této dávce neměnila.
