---
name: astro-engine-regression
description: Use when changing Mysticka Hvezda astrology calculations, tarot draws, generated interpretations, prompts,
  output validation or feature access logic. Purely cosmetic tarot page edits do not need engine regression.
metadata:
  author: internal-team
  license: Internal
  tags:
  - astrology
  - regression
  - content-quality
  - qa
  version: 1.1.0
---

# Astro Engine Regression

Ověř změněný výpočet nebo výklad, jeho vstupy a přímo navazující výstup. Přehled obchodního cíle je v [kontextu](../../product-marketing-context.md). Samotná úprava CSS nebo marketingového textu nevyžaduje testování astrologického enginu.

## Invarianty podle dotčené funkce

- Astrologie: správné datum, místo a časové pásmo; přesnost tvrzení odpovídá dostupným vstupům. Chybějící čas narození nenahrazovat předstíranou jistotou. Změnu algoritmu srovnat s důvěryhodnou referencí nebo existujícími nezávislými fixture daty.
- Tarot: karta, její ID, název, obrázek a význam si odpovídají. Plný katalog má 78 karet. U vztahové objednávky jsou tři různé karty uloženy jednou; retry platby nebo doručení je znovu nelosuje.
- Generovaný výklad: česky, tykání, konkrétní vazba na otázku, bez předstírání znalosti partnerových pocitů či jisté budoucnosti. Validovat požadovaná pole, délkové limity a strukturu; příjemná ukázka sama neprokazuje spolehlivost.
- Placené doručení: model ani prompt globálně neměnit kvůli jednomu produktu. Zachovat rozpočty, uložený výklad, idempotenci a obnovu po selhání. U osobního produktu nenahrazovat chybu obecným výkladem vydávaným za splněnou objednávku.
- Přístupy: změněná funkce respektuje svůj plán či jednorázový nákup; veřejný klient nesmí dostat cizí otázku nebo výklad.

## Cílené kontroly

Vyber pouze testy dotčené vrstvy. Pro vztahový produkt existují `server/tests/relationship-tarot.test.js`, `relationship-tarot-ai.test.js`, `relationship-tarot-webhook.test.js` ve stejném adresáři a `tests/e2e/relationship-tarot.spec.js`. Pro výpočty začni u `server/tests/astrology-engine.test.js` a podle změny u rout.

`npm run audit:tarot-assets` je vhodné při změně katalogu nebo cest obrázků, nikoli po každé úpravě nadpisu. Celou serverovou sadu nespouštěj kvůli jedné změně promptu bez dalšího dopadu. Nový regresní test má ověřovat skutečnou chybu či invariant, ne jen opisovat implementaci.

Začni existujícími testy a syntetickými vstupy. Placený model volej jen pokud je skutečně nutné ověřit změněnou kvalitu, v malé omezené sadě; neopakuj generování pro nesouvisející úpravu. Odděl „prošlo ověření formátu“ od „posoudili jsme kvalitu ukázky“ a od „zákazník dostal e-mail“.

Další rozsah a pravidlo ukončení ověření popisuje [conversion-qa](../conversion-qa/SKILL.md); neotevírej jej znovu, pokud už je načtené.
