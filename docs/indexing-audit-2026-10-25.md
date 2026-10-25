# Indexace Mystické Hvězdy — 25. 10. 2026

## Doložený stav
Search Console: 1 460 neindexovaných, 1 290 indexovaných URL. Souhrn indexace aktualizován 16. 10. 2026; nejde o okamžitý stav produkce. Exporty všech kategorií a HTTP kontroly jsou v docs/indexing-2026-10-25 v hlavní pracovní kopii.

| Důvod | URL | Zjištění a zásah |
|---|---:|---|
| noindex | 469 | Vše datované denní horoskopy. Starý archiv a chybějící výklady mají být noindex. |
| Alternativa se správnou canonical | 261 | Převážně parametrické varianty veřejných nástrojů. Zachovat canonical. |
| robots.txt | 32 | 31 přihlašovacích URL a profil. Záměrné omezení. |
| Přesměrování | 26 | Staré adresy, host varianty a sjednocené stránky. Neodstraňovat funkční 301. |
| 5xx | 2 | Obě adresy tarot-karta-dne nyní 200. Historické záznamy z května. |
| 404 | 2 | Stará kompatibilita nyní přes 301 funguje; /cdn-cgi/l/email-protection zůstává správně 404, současný zdroj na ni neodkazuje. |
| 403 | 1 | Stará kompatibilita nyní přes 301 vede na funkční leo-virgo. |
| Procházeno, neindexováno | 222 | 23 datovaných horoskopů; ostatní vyžadují výběr/posouzení obsahu Googlem, ne plošné odstranění noindex. |
| Google vybral jinou canonical | 1 | Stará lev-vahy nyní 301 na canonical leo-libra, finální 200. |
| Objeveno, neindexováno | 444 | 405 datovaných horoskopů. Ostatní bez plošné technické blokace. |

Kategorie chyby přesměrování má 0 URL a dřívější úspěšné ověření. Z celkových 1 460 URL tvoří 897 datované horoskopy. Všech 238 odlišných nedatovaných kandidátů z kategorií objeveno/procházeno vrací po případném přesměrování 200 (jedna původní timeout adresa prošla opakovaným měřením).

## Oprava
Horoskopová sitemap nabízela vždy 732 kombinací 12 znamení × 61 dnů, přestože stránky bez validního uloženého výkladu mají noindex. Nově obsahuje jen veřejné cache klíče v povoleném období se stejnou validací odpovědi jako samotná stránka. Zachovává kontrolované redakční výklady. Nevolá placený model a nezpřístupňuje osobní kontexty. Dávkové čtení po 100 klíčích, při chybě databáze 503/no-store; kratší revalidační cache.

## Search Console
FAQ: Google ji při inspekci neznal. Živý test 25. 10. v 15:10 potvrdil dostupnost a indexovatelnost; žádost o indexaci přijata do prioritní fronty. Screenshot faq-indexing-request.png. Přijetí není potvrzením indexace.
Hlavní sitemap: úspěšná, naposledy čtena 23. 10., 907 URL. Horoskopová: úspěšná, čtena 25. 10., dosud 732 URL před opravou.

## Ověření a vydání
Cílené API testy kontrolují validní/missing/poškozenou/soukromou/budoucí/starou cache, robots HTML a žádné placené generování. První běh v omezeném prostředí selhal EACCES na localhost; běh s povolením a explicitním paměťovým mockem prošel. Automatická kontrola původně zamítla test kvůli obavě z mazání produkční cache; doložen setup.mjs a paměťový klient db-supabase.js, následný běh povolen. Žádná produkční data nebyla testem měněna.
Nasazení opravy: dosud čeká na finální ověření.

Předchozí celowebové opravy jsou v produkci jako 6c410ce89194eacb31c6c45c2e78e589d5117dfd; deploy guard i produkční health tento commit potvrdily.

## Co oprava negarantuje
Google znovu prochází a vybírá URL vlastním tempem. Správně vyřazené URL mají zůstat vyřazené. Zbylé obsahové kandidáty je vhodné hodnotit podle dotazů a hodnoty stránky; hromadné žádosti ani přidávání dalších stránek nejsou opravou technické indexace.
