# Organický růst · druhá dávka · 13. 10. 2026

## Výsledek a rozsah

Hotová lokální dávka navazuje na první obsahové kolo. Upraveno pět existujících HTML stránek: tarotový rozcestník, tříkartový vstup, článek o Slunci, katalogový detail Slunce a souhrn Slunce v katalogu. K tomu zdrojové texty katalogu, blogový index a runtime skript rozcestníku. Zachované URL a canonical.

Priorita vychází ze stejného exportu GSC jako první dávka: **14. 9.–11. 10. 2026 vs. 17. 8.–13. 9. 2026**, Web, bez filtru země a zařízení. Rozcestník má 59/27 kliků a 1 958/1 072 zobrazení; tříkartový vstup 29/21 kliků a 1 459/869 zobrazení. Zdroj: [uložený agregátní report](../gsc-monthly.md). Tyto počty předcházejí úpravám, nejsou jejich výsledkem.

## Opravené konkrétní problémy

- Rozcestník vysvětluje bezplatnou jednu kartu a členský vícekartový výklad. Zavádějící denní počítadlo odstraněno: banner používal klíč mh_daily_tarot, zatímco omezená ukázka používá tarot_free_usage. Samotný limit a přístup se neměnily.
- Tři karty mají jasný proklik, dostupnost ukázky po přihlášení a odkaz na cenu/podmínky. Původní nabídka sedmidenního zkušebního období není označena za nepravdivou; skutečný ceník ji obsahuje.
- FAQ rozcestníku je skutečně viditelné a odpovídá JSON-LD. FAQ slouží lidem; Google ukončil jeho rich results. [Oficiální změny Google Search](https://developers.google.com/search/updates).
- Slunce místo slibů o partnerových citech, těhotenství a finančním úspěchu popisuje konkrétní symboly vlastní ilustrace, běžné situace a praktické otázky. Příklad je výslovně modelový. Obrácená poloha a kombinace mají svůj kontext.
- Blog odkazuje na bezplatnou kartu dne a dobrovolné členství. Výklad už není vydávaný za osobní práci kartářky. Publikační datum zůstává původní; skutečná aktualizace je uvedena samostatně.
- Detail Slunce, statický katalog a zdroj pro filtrování používají nové texty; blogový index odpovídá článku. Social preview používá existující náhled Slunce.
- V prohlížeči odhaleno přepisování nové hero copy a metadata skriptem tool-pages-copy-fixes. Opraven zdroj i konkrétní dist soubor, výsledný DOM ověřen po reloadu.

## Ověření

**4 existující cílené Chromium E2E scénáře PASS (2,6 min):** metadata rozcestníku, konkrétní interpretace jedné karty, indexovatelný tříkartový vstup a mobil bez vodorovného scrollu. Testovací server měl mock AI/Supabase, testovací klíče a vypnuté plánované úlohy. Žádná skutečná platba ani e-mail.

Pět změněných HTML parsováno nezávisle: jeden H1, zachovaný canonical, platné JSON-LD a existující lokální odkazy/obrázky. Kontrola opakována po úzkém přenosu do rootu. Root obsahuje také dřívější změny tarot engine dat; jejich diff není součástí této dávky. V izolovaném kandidátu je engine data diff prázdný.

Manuálně ověřen desktop: rozcestník/otevření FAQ, tříkartový vstup, Slunce blog a detail s odkazem na průvodce. Mobil 390 × 844: tříkartový vstup a Slunce blog bez overflow. Ilustrace načtená; další obrázky na detailu jsou lazy. [Skutečné screenshoty a náhledy](overview.html).

Regenerování 78 detailů podruhé změnilo **0** souborů. Sitemap kontrola potvrzuje **907** canonical URL včetně metadata; tři skutečně změněná lastmod opravena. Asset archiv zachovává všech **817** předchozích verzí a přidává jen dvě nové varianty zdroje/dist runtime skriptu. Service worker cache generator hlásí aktuální název. JS syntax a git diff whitespace kontrola prošly.

Pomocný gpt-6-luna / medium provedl ohraničený read-only audit přístupu a diffu; hlavní agent nezávisle prověřil kód, ceník a výstup. Počáteční domněnka pomocníka o nepodloženém trialu byla opravena podle ceníku. Runtime přepis byl nalezen hlavním agentem při manuální kontrole.

Diagnostické neúspěchy: první pokus o sitemap použil neexistující název skriptu; opraven na generate-sitemap-from-canonicals.mjs. Automatická aplikace některých root patchů narazila na dřívější copy/design a CRLF; provedeno úzké třícestné sloučení se zachováním atlas tříd a názvu členství. Root engine assert proti HEAD zachytil dřívější změny, proto se jeho čistota dokládá pouze v izolovaném kandidátu. Výsledné root HTML kontroly prošly.

## Stav a další krok

**Lokální, bez push/deploy/publikování.** Izolovaný kandidát je na větvi codex/organic-growth-20261013 a navazuje na cc8e36b3. Hlavní workspace obsahuje i starší rozpracované změny; pro vydání použít izolovaný kandidát a release guard. Dřívější tři FB návrhy zůstávají drafty.

Další ohraničená obsahová dávka: z existujících GSC dat vybrat další kartu s konkrétním čtenářským problémem, opravit katalogový zdroj a jeho existující průvodce. Dopad předchozích dávek hodnotit až po jejich skutečném nasazení a crawlu; automatický budoucí monitoring nebyl nastaven.
