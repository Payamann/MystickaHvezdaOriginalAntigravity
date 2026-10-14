# Profil vykreslený ze skutečných dat účtu

14. 10. 2026 · navazující průzkum · bez produktových změn a nasazení.

## Rozsah a metoda

Na výslovnou žádost vlastníka byly z produkční databáze načtené pouze jeho profilové údaje, stav přístupu a uložené výklady. SQL bylo pouze SELECT, omezené na určený účet. Nebyla načtená hesla ani vytvořená autentizační session.

Skutečný lokální klient profilu z release kandidáta byl vykreslený nad těmito daty v soukromém náhledu na loopback adrese. Místní API pouze četlo připravená data; nemělo přeposílání do produkce a všechny zápisy odmítalo. To ověřuje vykreslení a chování klienta pro reálný stav účtu, **nikoli skutečné produkční přihlášení ani end-to-end autentizaci**.

Ověřené: desktop 1280 px a mobil 390 px, historie, prázdný filtr, detail skutečného výkladu, prázdné oblíbené, návrat do historie, nastavení, zavření detailu Escape a návrat fokusu. Soukromé snímky a datový podklad jsou mimo verzované dokumenty. Tento report neobsahuje identifikátor účtu, e-mail ani text výkladů.

Nebylo provedené ukládání údajů, změna hesla, zápis deníku, přidání oblíbených, smazání, otevření platebního portálu, zrušení členství ani odeslání e-mailu. Místní log obsahoval pouze GET požadavky.

## Seznam oprav

### P01 · P1 · Ručně přidělený přístup se tváří jako obnovované předplatné

**DB + místní UI + zdroj:** Zkoumaný aktivní historický přístup nemá Stripe customer ani subscription ID. Nastavení přesto ukazuje vzdálený konec přístupu jako „Další obnova“ a nabízí „Správa plateb“.

**Místo:** `js/profile/settings.js:289–352`, stavová odpověď `server/payment.js:1131–1191`.

**Návrh:** Rozlišit konec přístupu a skutečnou další platbu. Backend má poskytovat možnost platebního portálu podle skutečné vazby na Stripe. Historický přístup zachovat; neslibovat platbu ani portál tam, kde neexistuje.

### P02 · P2 · Profil neumí doplnit nebo opravit datum narození

**Místní UI + zdroj:** Nabízí čas a místo narození, ale chybí datum. Backend jej podporuje. Denní blok bez narození nabízí onboarding; výběr znamení v onboardingu je platná samostatná preference, nenahrazuje však editaci data.

**Místo:** `profil.html:247–259`, `js/profile/settings.js:44–87`, `server/auth.js:861–871`, fallback znamení `js/profile/dashboard.js:853–864`.

**Návrh:** Přidat dobrovolné datum vedle času a místa, vysvětlit použití. Současný payload datum nemaže; problém je chybějící možnost editace.

### P03 · P2 · Historie a nastavení jsou na mobilu příliš hluboko

**Místní UI:** Při 390 px začínají záložky přibližně 4172 px pod horním okrajem. Před nimi je uvítání, aktivace přístupu, identita, denní směr, checklist, paměť, statistiky a deník. Uživatel musí projít asi pět obrazovek, aby se dostal k vlastním výkladům.

**Návrh:** Nahoru dát identitu a záložky, pod ně právě vybraný obsah. Denní směr zkrátit na jeden blok; checklist po dokončení skrýt a deník přesunout do vlastní záložky. Zachovat dostupnost všech funkcí.

### P04 · P2 · Staré VIP názvy a více konkurenčních výzev

**Místní UI + zdroj:** Historický stav vyvolá výrazný banner „nejvyššího plánu“ a názvy VIP Majestát, přestože aktuální nabídka má jediné členství. Nad historií je několik opakovaných cest k nástrojům.

**Místo:** `js/profile/shared.js:50–67`, aktivační konfigurace `js/profile/dashboard.js:227` a navazující větve.

**Návrh:** Zákaznický název přístupu sjednotit s aktuální nabídkou, interní historické typy a oprávnění zachovat. Zobrazení konkrétního nástroje neodvozovat od marketingového tvrzení „nejvyšší plán“.

### P05 · P2 · Detail výkladu a části profilu zůstaly fialové

**Místní screenshot:** Detail skutečného horoskopu má výrazně fialový panel, vnitřní kartu a zpětnou vazbu. V účtu zůstává také fialová záře avatara a starší povrchy. Veřejná stránka už přitom používá navy a tlumené zlato.

**Místo:** `js/profile/modal.js:501` a navazující renderery, společné dialogové styly a `css/profile-refresh.css`.

**Návrh:** Použít stejné navy povrchy, krémový text a tlumený zlatý akcent pro dialog, deník i nastavení. Další generovaná ilustrace pro tuto opravu není nutná.

### P06 · P2 · Tlačítko karty dne vede na obecný tarot

**Místní DOM + zdroj:** „Vyložit kartu dne“ v denním bloku odkazuje na `tarot.html`, nikoli na existující `tarot-karta-dne.html`.

**Místo:** `js/profile/dashboard.js:1336–1341`.

**Návrh:** Pro kartu dne použít správnou denní cestu; pro pokračování předchozího tarotu zachovat vlastní odpovídající odkaz a popisek.

### P07 · P2 · Paměť vykládá málo dat jako opakující se osobní vzorec

**DB + místní UI:** Z několika obecných automatických horoskopů bez deníku a zpětné vazby vzniká tvrzení „Co se ti opakuje“. To není dostatečný podklad pro osobní závěr.

**Místo:** `js/profile/dashboard.js:1087` a navazující skládání signálů.

**Návrh:** Rozlišit témata obsažená v textech a uživatelem potvrzené zkušenosti. Při malé historii nabídnout neutrální návrat k výkladu nebo vlastní poznámku; osobní vzorec netvrdit.

### P08 · P2 · Starší historie a oblíbené se nenačtou nad prvních 20 záznamů

**Potvrzené zdrojem, netestované na účtu s velkou historií:** Backend vrací ve výchozím stavu 20 záznamů a metadata stránkování. Klient volá jen první stránku; tlačítko načítá další položky pouze z místního pole. Oblíbené rovněž filtrují toto omezené pole. Statistiky z něj mohou být neúplné.

**Místo:** `server/routes/user.js:121–163`, `js/profile/readings.js:34–47,223–274`, `js/profile/favorites.js:33`.

**Návrh:** Skutečné serverové stránkování historie, samostatné načtení oblíbených a souhrny podle celého účtu. Malá ověřená historie tuto vadu nespouští; její zobrazené počty byly správné.

### P09 · P3 · Historické záznamy se špatně rozlišují

**Místní UI:** Různé horoskopy ze stejné minuty mají stejný titul „Horoskop“ i zobrazovaný čas. Detail teprve odhalí znamení a období. Texty nebyly totožné; nejde o potvrzenou duplicitní objednávku nebo duplicitní uložení.

**Návrh:** V kartě zobrazit již dostupné znamení a období, případně krátký náhled. Zachovat oblíbené a detail.

### P10 · P3 · Formulář a jazyk nejsou sladěné

**Místní UI:** Pole zůstávají malá vůči široké kartě; na mobilu je část popisků stísněná vedle polí. Profil často vyká, jiné bloky tykají. Při chybějícím jménu používá pozdrav část e-mailové adresy.

**Místo:** `profil.html:247–289`, `css/style.v2.css:11739–11770`, profilové renderery.

**Návrh:** Jednotné popisky nad poli, přiměřená šířka formuláře, oddělená dobrovolná změna hesla, tykání a neutrální pozdrav bez odvozeného jména.

## Co už funguje

Historie a detail se načtou, filtr bez výsledku má srozumitelný stav, prázdné oblíbené nabízejí návrat do historie. Profil neměl při 390 px vodorovné přetékání. Escape zavře detail a vrací fokus na jeho původní tlačítko na desktopu i mobilu. U zkoumané malé historie souhlasily počty. Nebyl potvrzený auth bypass ani ztráta uložených dat.

## Doporučené pořadí

1. P01 a P08: pravdivý billing a dostupnost celé historie.
2. P02/P06: dokončení osobních údajů a správné cíle tlačítek.
3. P03/P07: hlavní uživatelská úloha nahoře a přiměřené závěry z historie.
4. P04/P05/P09/P10: sjednocené názvy, barvy, karty a formulář.

Po implementaci ověřit ukládání a přístupové změny v odpovídajícím testovacím prostředí; reálné heslo, předplatné ani historii vlastníka neměnit jen kvůli kontrole.

[Celý seznam webu](README.md) · [Předchozí kontrola přihlášení](account-review.md) · [Zdrojové poznámky pomocníka](profile-source-gaps.md)
