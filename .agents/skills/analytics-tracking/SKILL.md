---
name: analytics-tracking
description: Use to implement, debug or evaluate Mysticka Hvezda funnel measurement and purchase attribution. Reuse
  existing events and distinguish verified paid and delivered orders from page views or repeated client events.
metadata:
  author: internal-team
  license: Internal
  tags:
  - analytics
  - technical
  - setup
  version: 1.1.0
---

# Analytics Tracking — Mystická Hvězda

Nejprve určete rozhodnutí, které mají data umožnit. Cíl a výchozí nejistoty jsou v [produktovém kontextu](../../product-marketing-context.md); existující události a omezení jsou v [dokumentaci pilotu](../../../docs/relationship-tarot-pilot.md). Nezjišťuj známé věci znovu dotazníkem.

## Použij existující měření

Projekt už používá `funnel_events`. Před přidáním události najdi její současný producer, payload, povolené hodnoty a spotřebitele. Nový tracker, GA4 property, GTM či přejmenování událostí nejsou výchozí řešení.

Vztahový produkt filtruj přes `feature=relationship_tarot`. Existující kroky: `one_time_offer_viewed`, `one_time_product_cta_clicked`, `one_time_product_viewed`, `one_time_form_started`, `one_time_form_submitted`, `checkout_session_created`, `one_time_purchase_completed`, `one_time_reading_delivered`. Zdroje odlišují jednotlivé vstupy; zachovej dosavadní názvy a ověř, které už běží v produkci a které jsou zatím lokální.

- Zobrazení nabídky znamená skutečně viditelnou nabídku, ne pouhé vložení do DOM. U dynamických nabídek kontroluj registraci listenerů a duplicity.
- Úspěšná URL ani klik na platbu není nákup. Unikátní platby ověř přes `stripe_session_id` v `one_time_purchases` a Stripe, doručení přes stav objednávky.
- Reconciliation může dokončit objednávku bez stejné sady analytických událostí jako webhook. Chybějící event proto sám neprokazuje ztracenou objednávku; porovnej i `one_time_order_inputs`.
- Změna analytiky nesmí blokovat bezplatný výsledek, checkout nebo doručení. Otázku, e-mail a text výkladu neposílej do analytiky, URL, Stripe metadata ani diagnostických výpisů.
- Zachovej existující režim souhlasu a pravidla přístupu. Potřeba analýzy neopravňuje obcházet souhlas nebo rozšiřovat sběr osobních údajů.

## Vyhodnocení bez falešné přesnosti

Uváděj období, prostředí, zdroj, absolutní počty, definici jmenovatele a případnou deduplikaci. Odděl eventy, relace, osoby a objednávky. GSC prokliky nespojuj s registracemi z jiného období jako hotovou konverzní míru.

Příjem sleduj podle skutečných plateb a vratek. Náklady zahrnují poplatky, model, doručení a obsluhu; tržba není zisk. Malý počet nákupů či odpovědí je podklad pro učení, nikoli potvrzení vítězné varianty. Pokud potřebný jmenovatel chybí, řekni to a navrhni nejmenší doplnění měření.

Pro změnu události stačí cíleně ověřit správný okamžik, payload, nepřítomnost citlivých dat a chování při výpadku či opakování. Nepouštěj reálné platby a e-maily kvůli samotné analytice. Nové reporty nebo dashboardy vytvářej jen pokud řeší konkrétní rozhodnutí, které nejde rozumně zodpovědět stávajícím výstupem.

Jen při práci s daným nástrojem načti [GA4 implementaci](references/ga4-implementation.md), [GTM implementaci](references/gtm-implementation.md) nebo [obecnou knihovnu událostí](references/event-library.md). Tyto příklady nemění existující smlouvu událostí projektu; aktuální API ověř v oficiální dokumentaci podle potřeby.
