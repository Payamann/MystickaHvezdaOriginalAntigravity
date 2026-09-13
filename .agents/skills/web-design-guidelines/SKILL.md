---
name: web-design-guidelines
description: Use for Mysticka Hvezda visual design, responsive layout, accessibility or UI review. Prefer existing
  brand patterns and a focused local preview. Fetch external Web Interface Guidelines only for a requested standards
  review.
metadata:
  author: internal-team
  license: Internal
  tags:
  - design
  - ux
  - best-practices
  version: 1.1.0
---

# Web Design Guidelines — Mystická Hvězda

Značku a produktový směr popisuje [kontext](../../product-marketing-context.md). Cílem je přehledné použití skutečného nástroje a čitelný výsledek. Pro čistě vizuální úpravu nespouštěj zároveň obecný CRO či SEO audit.

## Před změnou

Zjisti z aktuálního zadání a diffu konkrétní stránku a stav. Prohlédni její HTML, lokální styly a potřebné společné komponenty. Je-li cíl známý, neptej se znovu na soubor. Použij existující náhled a jeho skutečný port; nový server spouštěj jen pokud vhodný neběží.

Zachovej technologii projektu: statické HTML, CSS a JavaScript. Nepřidávej framework, design systém ani balíček ikon pro lokální vizuální úpravu. Začni existujícími obrázky a komponentami; novou generovanou grafiku použij, když má konkrétní roli, ne jako automatickou povinnost.

## Vizuální rozhodnutí

- Navy pozadí, jemné fialové světlo, zlaté akcenty; Cinzel pro titulky a dobře čitelné tělo. Barvy a velikosti navazuj na skutečné styly značky.
- Kratší první obrazovka: jasný nadpis, krátké vysvětlení, hlavní akce. Nevrstvi několik rámečků a nabídek uvnitř sebe.
- Výklad má dostat prostor: přiměřená šířka řádku, odstavce a jasný rozdíl mezi výsledkem a dobrovolnou další nabídkou. Doplňující text zpřístupni pomocí nativního `details/summary`, pokud to situaci pomáhá.
- Karta se musí dát ovládat i klávesnicí; preferuj `button`, popisky formulářů, viditelný fokus a srozumitelné chyby. Animace respektují omezený pohyb.
- Zkontroluj mobil: žádné vodorovné přetékání, překryv pevným záhlavím, drobná ovládací místa nebo stísněný dlouhý výsledek. Použij rozumnou dotykovou plochu alespoň přibližně 44 px tam, kde ji lze zajistit.
- Lokální třídy izoluj od globálních pravidel; zkontroluj existující `.tarot-card` a další sdílené selektory před jejich znovupoužitím.

## Dokončení

Pro změnu rozložení jednou prohlédni relevantní desktopový i mobilní stav a hlavní interakci. Při opravě se vrať k místu problému; neopakuj celé proklikávání bez nové změny. Automatické testy vol podle [conversion-qa](../conversion-qa/SKILL.md), ne podle počtu dotčených CSS řádků.

U JavaScriptu zkontroluj, zda stránka načítá zdroj nebo `js/dist`. Upravuj zdroj a po dokončení potřebných změn použij existující build; vygenerované soubory nereviduj jako samostatnou implementaci. U CSS sestav bundle jen pokud jej daná stránka používá a změna jej ovlivňuje. Přezkoumej vedlejší změny cache a generovaných souborů.

Pokud uživatel výslovně žádá kontrolu proti aktuálním Web Interface Guidelines, načti [jejich primární zdroj](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) a aplikuj relevantní pravidla. Pro běžné ladění designu tento externí audit není povinný. Výsledek opři o konkrétní nalezené problémy; neoznač stránku za kompletně přístupnou jen podle screenshotu.
