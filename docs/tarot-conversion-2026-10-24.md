# Tarot: srozumitelnější cesta k výkladu za 149 Kč
24. 10. 2026. Lokální ověřená změna v izolované větvi codex/tarot-conversion-20261024, základ 283cf457. Nenasazeno.

## Změna
- Přímý vstup na tarot ano/ne má nepovinnou volbu vztahového tématu, ve výchozím stavu vypnutou. Vztahové URL ji předvolí; návštěvník ji může vypnout. Zadání se nekategorizuje ani neposílá do analytiky.
- Nabídka ukazuje výstup, cenu a doručení před rozbalovací modelovou ukázkou. Celý bezplatný výsledek zůstává.
- Landing page popisuje konkrétní výstup a automatický vznik před nákupem; CTA přidané po ukázce používá existující měření product_to_form.
- Cena, platby, generování, oprávnění a doručovací server se neměnily.

## Ověření
Existující relationship-tarot E2E: 34 případů prošlo při prvním běhu; dvě kontroly očekávaly původní větu v leadu. Informace o automatickém vzniku je nyní v disclosure a kontrola byla přesunuta tam. Opravené dva případy prošly na desktopu i mobilu.
Nový případ přímého vstupu ověřuje zapnutí/vypnutí nabídky, zachování bezplatného výsledku a přenos otázky; poslední běh 2/2 prošel. Celkem všech 36 případů má úspěšný výsledek, nejde o jediný čistý hromadný běh.
Vizuálně zkontrolován desktop i mobil produktu a nabídky. Build, asset snapshot, service worker kontrola a git diff --check prošly. Nebyla provedena skutečná platba ani odeslán zákaznický e-mail.

## Vyhodnocení po případném nasazení
Zaznamenat datum nasazení a sledovat stejné kroky po dobu 30 dní: offer_viewed → entry_offer click → form_start → unikátní zaplacená a doručená objednávka. Nová explicitní volba rozšiřuje dostupnost relevantní nabídky, proto nesrovnávat prosté procento kliknutí bez složení zdrojů. Cíl je prvních 10 zaplacených, prokazatelně doručených výkladů se skutečnou zpětnou vazbou, nikoli příslib růstu konverze.

Samostatný read-only průzkum provedl gpt-5.6-sol medium; doložil omezení nabídky pouze na URL intent a relevantní stávající testy. Hlavní agent upravil izolované soubory a ověřil výsledek.
