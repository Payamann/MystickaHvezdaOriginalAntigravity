# Profil · aktuální stav a návrat k výkladu · 17. října 2026

Lokální kandidát navazuje na `e06b0059`. Skutečný klient a API nad syntetickým účtem `example.invalid`; žádné produkční údaje, platby ani e-maily. Tento checkpoint uzavírá PF02 a funkční rozsah PF10. Nejde o dokončení celého webového TODO ani nasazení.

## PF02 · obnova po změně záznamu

- Nový test nejprve reprodukoval chybu: během rozpracovaného načtení historie proběhne úspěšná změna oblíbeného stavu, ale starší odpověď potom vrátí hvězdičku a souhrnný počet na původní hodnotu. Výchozí běh: **2/3**, jeden očekávaný neúspěch.
- `favoriteOnly` nyní počká na novou historii se zachovaným filtrem a případně aktivní oblíbené. Pořadí požadavků v `readings.js` odmítne starší snapshot. Tato větev nezneplatňuje souběžný úplný refresh kontextu, který musí stále obnovit poznámky například po smazání.
- Úplná obnova po DELETE a použití aktuálního `profileState` po nastavení už byly implementované. Nový test je ověřuje na úrovni dashboardu s opravdovým modulem historie, řízenými odpověďmi kontextu a vykreslením poznámek: původní ID poznámky po obnově není v HTML panelu; aktuální poznámka ano. Také se obnoví aktivní oblíbené. DELETE proti zákaznickému účtu se neprováděl; serverové mazání není nová část tohoto testu.
- V prohlížeči: po novém skutečně uloženém jednokartovém tarotu zůstal krok `first_reading` splněný také po uložení nastavení; starší vlastní poznámka zůstala v přehledu. [Důkaz](qa-evidence/profile-settings-current-context.json).
- Běžná modelová cesta: z detailu přidat Devítku pohárů → najít v Oblíbených → odebrat v aktivním seznamu → zobrazí se prázdný stav. Žádné mazání výkladu nebo účtu.

## PF10 · poslední výklad a vlastní poznámka

- Přehled stále začíná vlastní poznámkou. Následující karta má u účtu s historií hlavní akci **Otevřít uložený výklad**, datum, podtyp a náhled původního záznamu. Horoskop a karta dne zůstávají dvě vedlejší volby; nepřibyla čtvrtá akce ani nový produkt.
- Výběr vylučuje journal, záznam bez ID a neplatné datum; hledá nejnovější výklad bez změny pořadí vstupního pole. Prázdný účet či účet pouze s poznámkou si uchovává původní vstupy do nástrojů.
- Návrat používá existující detail konkrétního ID. Otázka ani ID nejdou do CTA analytiky; HTML ID i náhledu je escapované. Nic se znovu nelosuje ani negeneruje.
- Skutečné kliknutí v lokálním profilu otevřelo původní **Devítku pohárů**, její motiv a celý uložený význam. Statistiky, checklist a témata zůstávají rozbalovací.
- Vizuální kontrola odhalila globální `.card { height:100% }`, které natahovalo zavřený checklist. Lokální grid nyní zarovnává nahoře a jeho karty mají vlastní výšku. Při 1280 px má zavřený panel **85,6 px** místo 376,25 px. Žádné vodorovné přetékání. [Snímek](qa-evidence/profile-last-reading-return.png), [DOM evidence](qa-evidence/profile-last-reading-return.json).

## Ověření a hranice

- **29/29** cílených testů: `profile-refresh` (5), existující `profile-modal` a `profile-context`. Nová sada načítá celý dashboard do VM a skutečný modul historie; nemá kopii jeho refresh logiky. Závislé API/DOM jsou modelované.
- Build JS, cílený ESLint a kontrola diffu. Existující detektor encodingu prošel nad změněnými zdroji, testem a dokumentací; dlouhý celorepozitářový průchod byl přerušený, nepovažuje se za dokončenou kontrolu. SW manifest **5/5**. Cache `mysticka-hvezda-c917eee9ca6a`, snapshot **1120** veřejných JS/CSS verzí.
- Nová browserová evidence je desktop **1280 px**. Mobilní přijetí posledních úprav zůstává otevřené v závěrečném W07/W13; není nahrazené desktopovým snímkem. Také se netvrdí živé ověření všech členských stavů, resetu hesla nebo AI poskytovatele.
- Pomocník `gpt-6-luna` medium připravil ohraničenou regresní sadu a doložil původní chybu. Hlavní agent provedl implementaci, doplnil kontrolu skutečného vykreslení poznámek, nezávisle spustil cílené sady a provedl browserovou cestu. Spotřeba se číselně neodhaduje.

Další práce: neuzavřené PV02/PV03 a finální mobilní přijetí. PF08 (vazba/editace poznámek) a PF12 (návrat k jednorázovým objednávkám) zůstávají volitelné návrhy, nikoli skrytá hotová funkce.
