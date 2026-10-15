# Natální výpočet pro SK/PL — zdrojový stav

Rozsah: `js/locale-natal.js`, `sk/natalni-karta.html`, `pl/natalni-karta.html`. Pouze zdrojová kontrola; aplikace, build, testy ani browser nebyly spuštěny.

- Obě stránky nyní používají sémantický form submit a načítají `js/dist/locale-natal.js`; zachovaly stávající pole, jejich ID, ceny, URL a astrolábovou ilustraci.
- Sdílený plain JS klient volá existující `GET /natal-chart/calculate` a čte `{ success, chart }`. Ověřený engine objekt obsahuje `planets` keyed `sun` až `pluto`, jejich `sign.name` a `degreeText`, a `houses.available` / `houses.ascendant`. Vykresluje lokalizovanou tabulku dostupných planet; ascendent ukáže jen při `houses.available` a vráceném znamení. Domy ani AI výklad nezobrazuje.
- SK/PL kopie mají vlastní loading, validaci, chybu a upozornění pro výpočet bez času. Při chybě zůstávají vstupy zachované a tlačítko umožní opakování. Po úspěchu se fokus přesune na výsledek. Požadavek má abort/stale ochranu; data se nepíšou do adresního řádku ani storage.
- Překlad českých serverových názvů znamení a planet je pevná mapa v `js/locale-natal.js`. Neznámé názvy znamení zůstanou z odpovědi serveru.

## Závěrečná QA — zatím neprovedeno

1. Vytvořit `js/dist/locale-natal.js` standardním release buildem.
2. Spustit poslední QA fázi v SK i PL: platný výpočet, neplatné datum, prázdné místo, síťová chyba a opakování; potvrdit zachování vstupů, správné lokalizované popisky a přesun fokusu.
3. Ověřit response z produkčně konfigurovaného API pro místo rozpoznané i nerozpoznané, s časem i bez něj; ověřit, že ascendent není zobrazen, když engine vrátí `houses.available: false`.
4. Zkontrolovat mobilní přetečení tabulky, klávesnici/screen reader a reduced-motion preference v browseru.

Zdrojová kontrola sama nepotvrzuje funkční deployment ani chování API v běhu. Endpoint přijímá vstupy v query stringu podle existujícího kontraktu `fetchCalculatedNatalChart`; stránka je neukládá do navigační URL ani browser storage.
