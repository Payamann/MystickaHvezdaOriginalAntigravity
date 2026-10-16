# Výsledek → profil · PV04 · 16. října 2026

Lokální kandidát navazuje na `4f998c2a`. Syntetické účty `example.invalid`, skutečný klient/API a mock databáze. Žádné zákaznické údaje, produkční změny, skutečné platby ani odeslané e-maily. Toto je přijetí uvedených formátů, nikoli všech historických verzí dat nebo kvality živé AI.

## Opravené nesoulady

1. Jedna karta, ukázka a vícekartový tarot ukládaly pouze jméno a krátký motiv. Nové záznamy uchovávají také původní plný význam a obrázek. Zamčené karty z ukázky se do payloadu nedostanou. Serverové generování stále dostává jen dosavadní stručné vstupy; losování, přístup ani prompt se nezměnily.
2. Tarot, natální karta a shoda zahazovaly příznak `fallback`. Nyní jej ukazují na výsledku a ukládají do historie. Starým záznamům bez tohoto příznaku se původ zpětně nevymýšlí.
3. Numerologický detail nezobrazoval čtyři vypočtená čísla. Nový panel je čte z uložených hodnot; nic nepřepočítává.
4. Tarotové plné významy patří do rozbalení přes šířku výsledku, mimo úzké 100px náhledy. Historický tarot ano/ne s `card_name` má vedle původní otázky a odpovědi znovu ilustraci.
5. Prázdná otázka už nezakryje název karty/runy v náhledu historie. Starší shoda se skóre `totalScore/emotionScore/commScore/...` zobrazuje skutečně uložené hodnoty stejně jako serverový formát `total/emotion/communication/...`.
6. Výpadek tarotového souhrnu nabízí opakování nad stejnými kartami. Opožděná odpověď odstraněného výsledku nevytvoří nový viditelný výsledek ani záznam historie.

## Modelová matice rendereru

| Ukládaný obsah | Zahrnuté části |
|---|---|
| Tarot jedna/více karet a karta dne | Názvy, ilustrace, pozice, motivy, původní otázka, plné významy, souhrn a denní krok |
| Tarot ano/ne | `card_name`, otázka, celá původní odpověď; také starší textový a JSON-string formát |
| Horoskop | Znamení, období, text, podnět a čísla; příznak fallbacku |
| Natál | Uložené shrnutí mapy, celý text a fallback |
| Numerologie | Čtyři uložená čísla, celý text a fallback |
| Partnerská shoda | Osoby, všech pět skóre ve dvou formátech, celý text a fallback |
| Koule | Původní otázka a odpověď |
| Runy | Záměr, runa, celý text a fallback |
| Andělská karta | Jméno, téma, zpráva, záměr a výklad |
| Šamanské kolo | Totem a současná strukturovaná pole výsledku |
| Minulý život | Současná strukturovaná pole výsledku |
| Deník / rituální poznámka | Původní text; v této dávce se neměnil formát zápisu |

Průvodce používá samostatnou serverovou historii chatu `/mentor/history`, nikoli profilový `saveReading`; není vykazovaný jako chybějící profilový formát. Současné payloady uvedené v tabulce nekončí v nouzovém JSON výpisu. Výčet neznamená, že se četly reálné zákaznické historické řádky.

## Nezávislé ověření

- **45/45 cílených testů** ve čtyřech sadách: `reading-fidelity`, `tarot-reading-fidelity`, existující `profile-modal` a `profile-context`. Pokrývají obsah, staré text/JSON formáty, bezpečné lokální obrázky, retry bez nového losování, opožděnou odpověď a dosavadní detailové akce.
- První běh měl 29/30: modelový test nesprávně očekával zachování neznámého HTML tagu v textu bez DOMPurify. Existující fallback formatter tagy odstraňuje; fixture nyní používá obyčejný český text. Ochrana před cizí URL obrázku a HTML escaping v ostatních scénářích zůstaly. Nešlo o chybu výpočtu.
- Skutečný tříkartový výsledek: Sedmička holí / Pětka holí / Devítka holí. Nejprve HTTP 500, následně retry a řízený výpadek poskytovatele přes skutečnou fallback větev route. Stejné karty, tři shodné plné významy, shodný souhrn a označení náhradního textu v profilu. [Porovnání](qa-evidence/tarot-profile-fidelity.json), [detail](qa-evidence/tarot-profile-fidelity.png). Porovnání ignoruje pouze bílé znaky při vykreslování.
- Natál: modelové údaje 12. 5. 1990, 10:30, Praha. Řízený výpadek poskytovatele: označení náhradního textu na stránce i v následně otevřeném uloženém detailu.
- Numerologie: modelové jméno, stejné datum → **9 / 5 / 5 / 9** na stránce i v profilu. [Detail](qa-evidence/numerology-profile-metrics.png).
- Prázdný modelový profil: krok první reflexe před zápisem `data-completed=false`, po jediném serverově uloženém zápisu `true`; postup 1/5 → 2/5. Obecný tip je viditelně označený „Redakční podnět k zamyšlení“ a téma jediné poznámky netvrdí opakování. [Přehled](qa-evidence/first-reflection-checklist.png).

Browserové scénáře této dávky jsou **desktop 1280 px**. Mobil posledních změn je stále samostatný otevřený bod. Shoda má v této dávce zdrojovou opravu propagace fallbacku a modelovou regresi rendereru; nové skutečné vynucení jejího provider fallbacku v browseru se netvrdí. Původní HTTP 500/retry browserový důkaz zůstává v předchozím checkpointu.

## Stav profilového TODO

Uzavřené podle doložené implementace a cílených důkazů jsou PF03, PF04, PF05, PF06, PF07, PF09 a PF11; PF01 byl již uzavřený. Nejde o sedm nových oprav dnes: část byla hotová dříve a její checkboxy byly zastaralé. PF02 má ještě neuzavřený případ obnovení panelů po smazání; PF08/PF12 jsou dobrovolná rozšíření, PF10 širší návaznost návratu. PV02 a skutečný reset/doručení z PV03 zůstávají otevřené.

Finální build JS, cílený ESLint a encoding prošly. Aktualizace assetů: cache `mysticka-hvezda-1a809451116f`, snapshot **1116** veřejných JS/CSS verzí, následná regrese SW manifestu **5/5**. Hlavní TODO má **40 otevřených a 4 uzavřené checkboxy**; dva dnes uzavřené body se týkají již doložené sady 78 denních podnětů a evidence všech 166 funkčních vstupů. Nepočítají se jako dokončení celých oblastí W08/W13. Pomocník Luna provedl ohraničené porovnání payloadů, natální opravu a modelovou sadu rendereru; hlavní agent doplnil ostatní opravy, ověření a uzavření. Číselné úspory spotřeby se netvrdí.
