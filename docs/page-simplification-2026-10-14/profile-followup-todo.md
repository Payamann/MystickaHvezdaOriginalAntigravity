# Profil — navazující funkční review a TODO

15. 10. 2026 · kontrolovaný kandidát `007612ec` · **pouze review a dokumentace, bez oprav produktu a nasazení**.

Navazuje na [původní P01–P10](profile-authenticated-review.md) a [jejich implementaci](../profile-unification-2026-10-14/README.md). Dřívější opravy zde znovu nevydáváme za otevřené závady.

## Dává profil jako produkt smysl?

**Ano: jako knihovna vlastních výkladů a poznámek s jednoduchou správou účtu.** Historie jako výchozí záložka je správně. Oblíbené jsou užitečná zkratka, Nastavení přirozené místo pro osobní údaje a členství. Přehled je nyní dostupný dobrovolně a nezdržuje přístup k historii.

Nejslabší část je Přehled: kombinuje obecný denní tip, statistiky, checklist, odvozená témata a vlastní deník. Pro další návštěvu je nejcennější najít konkrétní výklad a vlastní poznámku. Po odstranění funkčních chyb doporučuji zvýraznit poznámky a návrat k poslednímu výkladu; statistiky a checklist ponechat jako doplněk. Není důvod přidávat další produkt nebo vynucený onboarding.

## Co bylo tentokrát skutečně ověřeno

- Skutečný lokální klient a API nad **syntetickou mock databází**, bez produkčních účtů. Na začátku 63 záznamů, 32 oblíbených a 10 poznámek; po dvou modelových zápisech a odebrání jedné hvězdičky 65 záznamů, 31 oblíbených a 12 poznámek. Tyto počty potvrdilo API.
- Vytvoření reflexe, zobrazení mezi posledními poznámkami a otevření jejího textu z historie; po uložení se statistiky aktualizují. Během animace krátce ukazují mezihodnoty — to není chyba počtu.
- Odebrání oblíbeného záznamu, návrat do historie a detailu; změna avataru na modelovou volbu B a zachování po reloadu.
- Uložení nezměněných nastavení na modelovém účtu. Sledovaný pokus s dvěma reflexemi **nepotvrdil regresi témat paměti po uložení nastavení**; listener je v této větvi ani nepřekresluje. Zdrojový nález staré reference se týká denního bloku a checklistu, ne tohoto tvrzení.
- Předchozí ověření stránkování, filtru 23 horoskopů, všech 32 oblíbených, data narození, Escape, mobilu a ručního přístupu zůstává v implementačním reportu. Neopakoval se celý testovací balík.
- Nic se nemaže v reálném účtu; nebylo měněné heslo, rušené členství, otevíraný Stripe portál ani povolené push notifikace. Destruktivní a platební větve jsou níže odlišené jako zdrojové nálezy nebo potřebné ověření.

## Funkční TODO podle priority

### PF01 · P1 · Ochránit detail a jeho akce před opožděnou odpovědí

- [ ] V detailu navázat načtený obsah i akce na stejné ID a aktuální požadavek. Během načítání/chyby vypnout mazání a oblíbené; opožděnou odpověď ignorovat po zavření nebo otevření jiného detailu.

**Důkaz: zdroj.** `js/profile/modal.js:30–63` nastaví `currentReadingId` před GET, ale výsledek nekontroluje proti aktuálnímu ID ani pořadí požadavku. `deleteReading` a `toggleFavoriteModal` používají aktuální ID, zatímco zobrazený obsah může patřit opožděné odpovědi jiného požadavku. Po chybě navíc akce nezmizí. Toto je riziko práce s nesprávným záznamem v tomtéž účtu, nikoli potvrzený přístup k cizím datům.

**Přijetí:** pomalé A → zavřít → otevřít B → doběhne A: zůstane B a akce pracují s B. Při chybě GET není možné záznam smazat. Ověřit na modelových záznamech s řízeným pořadím odpovědí; žádný skutečný výklad kvůli testu nemazat.

### PF02 · P2 · Sjednotit obnovování stavu po změně záznamu

- [ ] Po smazání obnovit i poslední poznámky a aktivní oblíbené, nejen historii a statistiky.
- [ ] Udržovat aktuální stav výkladů pro denní blok a checklist i po uložení osobních údajů.

**Důkaz: zdroj.** `modal.js:131–152` po DELETE zavolá historii; listener `dashboard.js:1921–1928` neobnovuje journal panel. Smazaná poznámka tak v jeho DOM zůstane do reloadu. Zároveň `profile:updated` v `dashboard.js:1859–1868` používá původní `readings` z inicializace, ačkoli zápis nebo feedback načtou jiné pole. V testovaném naplněném účtu změna nastavení nepřepsala paměť; ta v tomto listeneru vůbec není.

**Přijetí:** jedna konzistentní obnova historie, oblíbených, poznámek a odvozených bloků. Smazaný modelový journal není nikde vidět; po novém prvním výkladu a uložení nastavení se checklist nevrátí k prázdnému účtu.

### PF03 · P2 · Paměť a checklist nesmějí záviset na první stránce historie

- [ ] Odvozené poznámky/feedback načítat v určeném a srozumitelném rozsahu, nezávisle na právě načtené historii. Propojit zvlášť načtené poznámky s pamětí; případné omezení uvést pravdivě.

**Důkaz: zdroj + modelový prohlížeč.** `dashboard.js:1795–1807` načte `readings` a `journals` zvlášť. Paměti a checklistu předá jen první stránku `readings`; `journals` slouží pouze seznamu pěti poznámek. Model měl 10 starších poznámek mimo prvních 20 položek: seznam je ukázal, paměť je nezahrnula. Po první nové reflexi zůstal štítek „Zatím málo podkladů“, přestože už existovalo 11 poznámek. Souhrnné statistiky celého účtu tím dotčené nejsou.

**Přijetí:** více než 20 nových výkladů nepřekryje starší vlastní poznámky. Výsledek paměti se nemění jen proto, že uživatel načte další stránku historie.

### PF04 · P2 · Doplnit filtry a přístup ke starším poznámkám

- [ ] Nabídnout filtr Poznámky a všechny skutečně ukládané nástroje; aliasy sjednotit v jedné mapě. Zachovat možnost projít všechny starší položky.

**Důkaz: zdroj + UI.** `profil.html:151–159` má šest kategorií nástrojů. Server v `server/routes/user.js:27–44` podporuje i runy, andělské karty, astro-mapu, minulý život, journal a další. Tyto záznamy nezmizely, ale jsou dostupné jen přes „Vše“. Přehled nabízí pouze posledních pět poznámek (`dashboard.js:1641–1659`) a není zde odkaz „Všechny poznámky“.

**Přijetí:** uživatel najde jedenáctou starší poznámku bez procházení všech typů výkladů. Filtr zobrazí i starší záznamy nad první serverovou stránkou. Fulltextové hledání je případné další vylepšení, ne podmínka této opravy.

### PF05 · P2 · Opravit dokončení kroku s vlastní reflexí

- [ ] V checklistu zjišťovat existenci journalu přímo, nespoléhat na seznam typů, ze kterého jsou journaly odstraněné.

**Důkaz: zdroj.** `getReadingKinds` v `dashboard.js:864` journal výslovně vyřazuje; `dashboard.js:1410` přesto používá `kinds.has('journal')`. Člověk s jednou dnešní reflexí bez vícedenní série tento krok nesplní. Model s vícedenní historií tuto větev maskuje.

**Přijetí:** jediná uložená reflexe splní příslušný krok; samotné vytvoření účtu jej nesplní. Pokud krok ve skutečnosti vyžaduje dva dny, musí tak být pojmenovaný.

### PF06 · P2 · Vracet avatar při selhání uložení

- [ ] Při chybě PUT obnovit původní avatar a výběr, případně změnu zobrazit až po úspěchu. Během ukládání zabránit soupeřícím změnám.

**Důkaz: zdroj.** `js/profile/settings.js:201–245` mění DOM před požadavkem; catch pouze ukáže chybu. Úspěšné uložení B a reload v modelovém účtu fungovaly. Chybová větev nebyla v prohlížeči simulovaná.

**Přijetí:** odmítnuté uložení neukazuje nový avatar jako uložený; rychlé dvě volby skončí stejnou hodnotou v UI a po reloadu.

### PF07 · P2 · Zpřesnit, co je opravdu osobní a opakované

- [ ] Denní obecný tip označit jako redakční inspiraci, nebo jej skutečně napojit na daný uložený horoskop. U témat z jedné poznámky nepoužívat „opakovaně“ a nenaznačovat osobní vzorec.

**Důkaz: zdroj + UI.** `DAILY_FOCUS` v `dashboard.js:295–303` jsou jen sedm vět vybíraných dnem v týdnu. Nejde o horoskop znamení ani vyhodnocení historie. `MEMORY_THEME_META` přesto popisuje práci jako téma objevující se „opakovaně“ i po jedné reflexi s pracovním klíčovým slovem; modelové zobrazení to potvrdilo. Hlavní text paměti je již opatrnější z minulé opravy, zbývají její popisy témat.

**Přijetí:** u jedné poznámky „V poznámce se objevuje téma…“. Případný opakovaný výskyt doložit několika různými poznámkami a umožnit je otevřít. Veřejný tip se netváří jako osobní výpočet.

## Menší produktové a designové úkoly

- [ ] **PF08 · P3:** zvážit samostatně dostupný Deník nebo aspoň jasný vstup „Moje poznámky“ v Přehledu. Poznámka by měla jít připojit ke konkrétnímu výkladu; nyní formulář ukládá pouze `{type:'journal', data:text}` bez vazby. Editace vlastní poznámky nyní není implementovaná — je to návrh rozšíření, ne nefunkční tlačítko.
- [ ] **PF09 · P3:** nahradit výběr avatarů A–L smysluplnými iniciálami nebo několika symboly z naší SVG sady. Není třeba dalších generovaných ilustrací; současná volba působí jako pracovní placeholder.
- [ ] **PF10 · P3:** pro návrat prioritizovat „poslední výklad + vlastní poznámka“. Statistiky, denní série a checklist ponechat dobrovolné. Označení „Poslední výklad“ nyní zahrnuje i Osobní poznámku (`getLastReadingLabel`); buď rozlišit, nebo přejmenovat na „Poslední záznam“.

## Ověření, která ještě nelze označit za hotová

- [ ] **PV01:** dokončit modelovou matici pro prázdný účet, pouze jednu dnešní reflexi, starší poznámky mimo první stránku, více druhů výkladů, chybu avataru a detailu, přerušení během načítání. Každý případ navázat na PF01–PF07; nepouštět opakovaně celý webový audit.
- [ ] **PV02:** v odpovídajícím testovacím prostředí ověřit skutečné členské UI pro trialing, active, cancel_pending, paused, past_due a canceled a návaznosti portálu. Dřívější serverové billing testy a ruční přístup bez Stripe ID nejsou živým potvrzením všech těchto klientských stavů. Neměnit skutečné předplatné kvůli auditu.
- [ ] **PV03:** cíleně ověřit vypršení session při práci s rozepsanou poznámkou, návrat po přihlášení a platný e-mailový reset. Změnu reálného hesla provádí vlastník; původní A07/A08 zůstávají ve společném seznamu účtu.

## Pořadí realizace

PF01 → společný stav PF02/PF03 → dostupnost poznámek a checklist PF04/PF05 → chybové stavy a pravdivé texty PF06/PF07 → teprve potom volitelné PF08–PF10. Ověření PV01–PV03 provádět podle zasažené větve, ne jako odklad všech drobných oprav.

Stav: **TODO zapsané, produktový kód v této kontrole nezměněný.** Soukromá produkční data nebyla načítaná. Snímky a záznam kontrolního pokusu jsou v [modelových podkladech](../profile-unification-2026-10-14/profile-followup/verification.json); tento konkrétní pokus změnu témat po uložení nastavení nepotvrdil, a proto není veden jako potvrzená UI závada.
