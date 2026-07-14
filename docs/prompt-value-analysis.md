# Prompt — Hodnotová analýza appky (value capture × value delivery)

Reusable prompt. Cíl: najít, kde se vytváří hodnota, která se nezachytává (uniká byznysu)
nebo nedoručuje (uniká uživateli), a seřadit zásahy podle skutečného dopadu.

```
Proveď analýzu "maximální hodnota appky × přidaná hodnota pro uživatele" pro Mystickou Hvězdu.
Cíl: najít, kde se v produktu vytváří hodnota, která se NEzachytává (uniká byznysu) nebo
NEdoručuje (uniká uživateli), a seřadit zásahy podle skutečného dopadu — ne podle toho, co
je zajímavé stavět.

POVINNÝ RÁMEC — hodnota má dvě strany, cíl je jejich PRŮNIK:
- Value capture = příjem (uživatel zaplatí za hodnotu, kterou dostal).
- Value delivery = užitek pro uživatele (vrací se, cítí, že mu produkt rozumí).
Nejvyšší priorita = zásahy, které zvednou OBOJÍ najednou.

ZAČNI Z DAT, NE Z NÁPADŮ (nejdřív přečti, neobjevuj znovu):
- docs/WEB-KNOWLEDGE.md, docs/operator-context.md, docs/profit-growth-roadmap,
  app-improvement-plan, seo-growth-plan, tasks/lessons.md.
- Živá funnel data: npm run analyze:funnel + export-live-funnel (se schválením uživatele).
- Ověř, co je BROKEN vs DORMANT vs MISSING — grepni kód, nespoléhej na "status" sekce plánů.

ROZDĚL PŘÍLEŽITOSTI DO TŘÍ VRSTEV:
1. ROZBITÝ ZÁCHYT HODNOTY (peníze vydělané, nevybrané) — nejvyšší ROI, žádná nová funkce.
2. DORMANTNÍ DORUČENÍ HODNOTY (hotová infra, co nestřílí) — retence skoro zdarma.
3. NOVÁ TVORBA HODNOTY (nový užitek, co monetizuje) — až po vrstvě 1 a 2.

PRO KAŽDOU: skóre = dopad × jistota × proveditelnost. Napiš hodnotu pro UŽIVATELE, důkaz,
úsilí, první krok.

VÝSTUP: docs/VALUE-ANALYSIS-<datum>.md. Nic neopravuj — jen analyzuj a napiš.
```
