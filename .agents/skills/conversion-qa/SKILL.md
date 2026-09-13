---
name: conversion-qa
description: Use to verify a changed Mysticka Hvezda CTA, form, free-to-paid path, registration, checkout or fulfillment
  flow. Choose coverage from the actual diff; not a site-wide audit for a cosmetic edit.
metadata:
  author: internal-team
  license: Internal
  tags:
  - cro
  - qa
  - checkout
  - onboarding
  version: 1.1.0
---

# Conversion QA

Rozsah vychází ze změny a nejbližšího návazného kroku. Aktuální produkt je popsán v [kontextu](../../product-marketing-context.md); není nutné znovu procházet homepage, účty i všechny nástroje.

## Nejmenší smysluplné ověření

| Změna | Výchozí ověření |
|---|---|
| Dokumentace nebo skills | Formát a relevantní odkazy; žádné testy aplikace. |
| Text, barvy, mezery | Náhled zasaženého místa; při změně rozložení desktop a mobil. Nepřidávat test kopírující nový text či barvu. |
| CTA, formulář, dynamický výsledek | Jedna úplná cesta včetně cíle odkazu a relevantního chybového stavu. Použít existující cílený test, pokud toto chování pokrývá. |
| Platba, webhook, doručení | Cílené serverové testy ceny, ověření platby, idempotence a obnovy po chybě; návazný test klienta jen pokud se změnil. |
| Přihlášení, oprávnění, společná infrastruktura | Pokrýt dotčené hranice přístupu a skutečné návaznosti; širší sadu zvolit podle dopadu. |

Před příkazem zkontroluj existující test a konfiguraci. Například `npx playwright test tests/e2e/relationship-tarot.spec.js --project=chromium --grep "relevantní název"` nebo `npm run test:unit:server -- --runTestsByPath server/tests/relationship-tarot-webhook.test.js`. Nahraď filtr skutečným názvem a ověř, že se nějaký test spustil. Mobil přidej pro změněné responzivní chování, ne automaticky ke každé serverové úpravě.

Pokud kontrola prošla a její vstupy se nezměnily, skonči. Po opravě nejprve zopakuj selhaný test a bezprostředně dotčené chování. Nerozšiřuj kontroly jen pro další jistotu bez konkrétního důvodu. Povinné CI kontroly neobcházej; `test:verify` ani všechny E2E sekce nespouštěj automaticky při každém dokončení úkolu.

## Na co se zaměřit v prohlížeči

- SEO návštěvník dostane slíbený bezplatný výsledek před případnou navazující nabídkou. Jednorázový produkt nevyžaduje účet ani předplatné.
- Text CTA odpovídá cíli, cena a podmínky jsou před platbou. Zachová se relevantní `source` a jen nezbytný kontext.
- Klávesnice, fokus, formulářová chyba a dostupný stav výsledku fungují; nabídka nepřekrývá obsah a nevytváří přetékání na mobilu.
- Po příchodu z jiného vstupu i po dynamickém vykreslení funguje dostupnost produktu. Nedostupný produkt nesmí nabízet funkční platbu.
- Pouhý návrat na URL s `status=success` není ověřená platba; analytický výpadek nesmí zablokovat nákup ani doručení.

Použij existující lokální server po ověření adresy. Platební zkoušky izoluj do testovacího prostředí; skutečnou placenou generaci nebo e-mail neposílej opakovaně jako běžný smoke test. Reálné doručení provozovateli ověř jen když je potřebné a v autorizovaném rozsahu.

Předání: co funguje, co skutečně prošlo a případné podstatné omezení. Nasazení řeší samostatně [railway-deploy-guard](../railway-deploy-guard/SKILL.md).
