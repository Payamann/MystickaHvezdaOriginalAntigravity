# Vizuální pravidla současné Mystické Hvězdy

Navazuje na schválené malované tarotové karty a současné atlas stránky. Žádný nový framework nebo knihovna ikon.

| Role | Existující hodnota / vzor |
|---|---|
| Pozadí | `#0b1929` |
| Plocha nástroje | `#102638` |
| Hlavní text | `#e9e3d7` |
| Vedlejší text | `#c3c9cb` |
| Akce a symboly | `#bd9b65`, hover `#d0b17c` |
| Rámeček | tlumené zlato s nižší průhledností, obvykle 1 px |
| Písmo | Cinzel pro krátké titulky, Inter pro texty, formuláře a ovládání |
| Tlačítko | existující `.btn`; jedno hlavní, následná akce sekundární; min. cca 44 px dotyková plocha |
| Formulář | viditelný label, nepovinné údaje přiznané, chyba u vstupu/výsledku, zachovaný obsah při selhání |
| Výklad | otázka/záměr, karta nebo symbol, celý dostupný výklad, praktický krok, dobrovolná návaznost |
| Reference | nativní `details` jen pro doplňky; neskrývat formulář, cenu, bezplatný slíbený výsledek ani potřebné podmínky |
| Ikony | `img/icons/mh-symbols.svg`; symboly znamení/run a věcné barvy aury/grafu jsou obsah |

Navy není důvod přebarvit skutečnou červenou křivku nebo zelený barevný portrét. Ilustrace má vyjadřovat konkrétní téma; v dlouhém textu patří klidná plocha a řádek přibližně 60–68 znaků. Není cílem obalit každou větu samostatnou kartou.

## Vlastnictví CSS

- `css/style.v2.css` — společný základ a ovládání; výstupy `style.v2.min.css`, `site.min.css`, `home.min.css` sestavit existujícím buildem.
- `css/atlas-web.css` — společné atlasové povrchy a vybrané nástroje.
- `css/atlas-remaining.css` — opt-in pro zbývající rodiny, bez přebarvování obsahových grafů/karet.
- `css/atlas-content.css`, `atlas-blog.css`, `atlas-astro.css`, `atlas-tools.css` — konkrétní rodiny.
- `css/pages/*`, `css/profile-refresh.css`, `tarot-atlas.css` — skutečně nutné lokální rozdíly. Nové profilové úryvky jsou lokálně v `profile-refresh.css`.

Duplicitní deklarace neodstraňovat bez doloženého použití a odpovídajícího náhledu. Základní tokeny staré kosmické varianty jsou stále přítomné pro některé větve; jejich existence není důkazem viditelné fialové stránky. Při dokončování přiřazovat skutečně používaný bundle a stav, ne spoléhat na název třídy.

## Pět rodin a pokrytí

Úvod/produkt, nástroj, výsledek, katalog a účet/objednávka. Zdrojové přiřazení je v `page-ledger.json`; jde o pracovní klasifikaci pro závěrečný průchod, nikoliv nový browserový důkaz všech URL. Každá položka zachovává původní auditní ID a samostatný stav. Malovaný materiál a jeho přímé reference jsou v `art-usage.json`; nepřímé runtime použití se nesmí označit za nulové podle pouhé textové shody.

Do finálního náhledu zahrnout: běžný prvek, focus, disabled/loading, chybu a úspěch; hosta/účet tam, kde se mění funkce; desktop a mobil. Novou ilustraci připravovat až pro konkrétní chybějící roli po tomto přiřazení.
