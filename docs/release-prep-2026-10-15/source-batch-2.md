# Druhá zdrojová dávka · před společnou QA

15. 10. 2026. Navazuje na `1a39d191`. Do tohoto checkpointu nebyl proveden nový build, test aplikace ani browserový průchod; `git diff --check` kontroloval pouze whitespace. Žádná produkční změna.

## Implementované zdroje

- **R04:** společné numerologické počítání z první dávky doplnil sdílený lunární stav pro server, widget, lunace, rituály a afirmace. Skutečné okamžiky USNO 2024/2026, jasně orientační mezifáze a žádný vymyšlený přesný odpočet mimo tabulku; [původ a omezení](r04.md).
- **R01:** i tranzity natální karty při výpadku ukazují chybu a retry, žádné náhradní tvrzení podle kalendářních znamení. Opožděná stará odpověď nesmí přepsat nový výpočet.
- **PF/PV:** profil doplnil původní záměr, runu/totem/andělskou kartu, podnět horoskopu a per-card výklad. Doplněk karty lze rozbalit; pokud je jediným uloženým výkladem, je otevřený. Chyba souhrnu neukazuje staré počty. Avatar a osobní údaje neztratí přihlášenou identitu při blokovaném localStorage; stav členství chrání vlastníka a poslední požadavek.
- **W08/W10:** všechny 78 původní karty mají shodný kurátorovaný motiv a vlastní otázku/krok. Stejný podklad využívá denní tarot, obecná kartotéka a slovník ANO/NE; verdiktové směry i losování zůstaly. Významové detailní SEO stránky se nezkracovaly. Aura a biorytmy mají symbolické či matematické vysvětlení; čínské výsledky nepředepisují povolání, investice ani partnera podle roku.
- **W04/W06:** čínská zvířata používají medailon se znakem zemské větve, kvízy vlastní SVG; obecné tarotové šablony nemluví o ruční interpretaci astrologa. Sedm kvízů nečeká 2500 ms, ukáže remízu a popisuje pouze odpovědi. Runy a šamanské kolo označují fallback i při uložení; síťová chyba se nevydává za požadavek koupit členství.
- **W06/W09:** koule posílá skutečný CS/SK/PL jazyk, při chybě uložení zachová odpověď a nezdržuje ji psaním písmeno po písmenu. Horoskop chrání rychlé přepínání znamení/období, nepřebírá staré číslo/reflexi, ukládá otázku i fallback a nepovažuje neúspěšné uložení za hotové. Staré datum a odpověď v otevřené stránce patří do finální QA.
- **Průvodce:** klient neblokuje podle potenciálně zastaralého lokálního počtu. Server dál určuje kvótu a oprávnění. Žádné čekání na falešnou analýzu po limitu, žádná vymyšlená osobní ukázka ani rozmazání dosavadních odpovědí. Během požadavku brání dvojímu odeslání, po chybě zachová text. Serverový způsob počítání uživatelských zpráv ani cen se neměnil.
- **A07/A08:** starší auth dialog má popisky polí, tlačítko zavření, Escape/Tab/fokus, oddělený reset stav a trvalé potvrzení žádosti. Skutečný recovery e-mail ani platný reset token nebyl použit. Samostatná přihlašovací stránka zůstává hlavní cestou.
- **W11:** [všech 13 HTML](locale-source.md), [sdílený shell](locale-shell.md), připojený renderer horoskopů a [skutečný základní natální výpočet](locale-natal.md) pro SK/PL. Tarotové stránky jsou rozcestníky s výslovnou českou návazností, nikoliv nefunkční losovací aplikace. Nabídka bez karty ve dvou locale home byla nahrazena fungujícím bezplatným vstupem.
- **W02/W03/W13:** [pravidla](design-contract.md), [modelový přehled prvků](components.html), evidence 917 stránek / 166 funkčních vstupů a přímého použití 42 atlas ilustrací. Reprodukovatelný `scripts/build-release-source-ledger.py` generuje pouze zdrojový inventář, nedokazuje runtime. Nepřímé použití obrázku ani potřebu nového motivu neurčuje samotná textová shoda.

## Ještě není potvrzené přijetí

Připravené regresní sady nejsou spuštěné, generované bundly jsou před buildem, všechny nové stavy čekají na společnou QA. Nelze hlásit hotový release nebo nový úplný audit 917 stránek. Priorita je nyní sestavení, relevantní automatické regrese a skutečný prohlížeč nad syntetickými daty; chyba se opraví a její dotčená kontrola zopakuje.

PF08 (editace/vazba poznámek) a PF12 (placené objednávky v dobrovolném účtu) zůstávají volitelná rozšíření. Nedoplňuje se kvůli nim povinný účet do nákupu. Staré nejasné doručení mapy, produkční DB předpoklady a skutečné recovery vyžadují svoje explicitní provozní ověření; lokální mock je nenahradí.

Pomocník `gpt-6-luna`, medium: ohraničené zdrojové úpravy čínských symbolů, statických kvízů, SK/PL HTML, základního natálu a shellu. Hlavní agent změny četl a dále upravil copy, úplnost planety/ascendent, skutečný výpočetní čas, auth popisky a `hreflang`. Žádná kvantifikovaná úspora ani zvýšení konverzí se netvrdí.
