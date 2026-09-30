# Vizuální doladění SEO vstupů — 30. 9. 2026

Nejnovější doložený podklad je `docs/seo-priority-2026-09-29.md` v hlavní pracovní kopii: živá Search Console, webové vyhledávání, data do 27. 9. 2026. Za posledních 28 dní uvádí tarot na lásku 252 prokliků a tarot ano/ne 161. Nejde o úplný dnešní žebříček všech URL ani o unikátní návštěvníky.

Podle těchto dat se vizuální práce soustředila na dvě doložené hlavní vstupní stránky. Tarot na lásku má lokálně připravený texturovaný podklad a původní ilustrace karet (commit `3d14feb1`). Tarot ano/ne používá stejný optimalizovaný podklad, větší a kontrastnější pomocné popisky. H1, title, obsah výkladu a jeho rozložení se v tomto kroku neměnily.

Tarot ano/ne byl prohlédnut na desktopu 1440 × 900 a mobilu 390 × 844; obě zobrazení jsou bez vodorovného přetékání. `git diff --check` prošel. Pozadí využívá existující WebP 1600 × 900 px o velikosti 141 kB, nevznikl další obrazový soubor.

Inventuru zdrojů provedl pomocný agent `gpt-6-luna` s úsilím `low`; hlavní agent ověřil data přímo v uvedeném dokumentu. Surový aktuální export GSC nebyl nalezen. Změny jsou lokální, před produkčním nasazením.
