# SK/PL sdílený header a footer — zdrojový stav

Změna je pouze v klasickém `js/components.js`: po načtení komponenty se přes explicitní slovník překládají známé textové uzly a `aria-label`; nejde o regex nad `innerHTML`. Struktura, classes, IDs, SVG, `<details>`, footer ani cookie consent hooky zůstávají zachované. Lokalizace je omezena na `document.documentElement.lang` `sk`/`pl`.

Odkazy se přepnou na SK/PL variantu jen pro dostupné stránky: úvod, horoskopy, tarot, natální kartu, andělské karty a křišťálovou kouli; SK navíc tarot ANO/NIE. Ostatní interní root odkazy dostanou `hreflang="cs"` a lokalizované `title` informující, že otevírají českou stránku. Jazykové přepínače, externí a mailto odkazy zůstávají beze změny. Brandname Mystická Hvězda zůstává vlastní jméno.

Cookie texty a volby jsou přeložené bez změny consent událostí nebo ukládání. Protože `cookie-handler.js` později mění text tlačítka nastavení, komponentový kód sleduje pouze tento popisek a znovu jej lokalizuje. `initStandaloneHeader` používá pro hamburger ARIA labely otevřít/zavřít podle locale.

## Navazující labely a finální QA

`js/auth-client.js` nyní sdílí locale copy pro dynamické přihlášení/odhlášení na desktopu i mobilu. Profil a registrace mají statické texty z lokalizované komponenty. Odpovídající runtime stav zatím čeká na QA.

Všech 13 SK/PL stránek načítá dist komponentu. `js/dist/components.js` se musí vytvořit v závěrečné QA/build fázi. Bez testů/build/browseru nelze potvrdit vykreslení ani odkazy v runtime.
