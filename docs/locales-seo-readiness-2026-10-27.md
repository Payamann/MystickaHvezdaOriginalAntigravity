# Připravenost SK / PL / EN pro Google — 27. 10. 2026

## Rozhodnutí

Omezená sada lokalizovaných SEO vstupů je připravená lokálně; nejde o tři kompletně přeložené produkty. Nejbližší krok je autorizované nasazení, ověření konkrétního vydání a teprve následně případné opětovné odeslání aktualizované sitemap do stávající doménové GSC property. Tento audit nic nenasadil a o indexaci nepožádal.

| Jazyk | Připravené lokální stránky | Živé URL z této sady | Google potvrzená indexace |
|---|---:|---:|---|
| SK | 8 | 7 HTTP 200, nový průvodce 404 | `/sk/` indexována |
| PL | 7 | 6 HTTP 200, nový průvodce 404 | `/pl/` indexována |
| EN | 7 | 0; všech 7 vrací 404 | Nepotvrzená; nové URL ještě nežijí |

Indexace úvodů není důkaz indexace všech podstránek ani návštěvnosti. Kontrola GSC proběhla po obnovení existující přihlášené záložky; staré úspěšné potvrzení o odeslání nebylo vydáváno za novou akci.

## Produkční důkaz

Read-only Railway describe-service: produkční repo `Payamann/MystickaHvezdaOriginalAntigravity`, větev `main`, žádné staged změny. Poslední deployment `780bbff7-58d0-40bc-916f-941864e92bda`, SUCCESS, 25. 10. 2026. Veřejný `/api/health` vrátil HTTP 200 a commit `d688396016bd78738fc5d723ba30cc21fe8538ad`.

Živá hlavní sitemap má 907 URL, z toho SK 7, PL 6, EN 0. GSC: hlavní www sitemap úspěšná, poslední čtení 25. 10., 907 objevených stránek; samostatná horoskopová sitemap úspěšná, 120 objevených stránek. Non-www záznam hlavní sitemap má poslední čtení 27. 10. a rovněž 907 stránek. Objevené URL v sitemap nejsou počet indexovaných URL.

Živé robots.txt neblokuje `/sk/`, `/pl/` ani `/en/`. Na existujících jazykových odpovědích nebyl `X-Robots-Tag` nebo meta noindex, canonical odpovídá dané jazykové URL. Počáteční DNS chyba vznikla v síťovém sandboxu, opakovaná autorizovaná read-only kontrola veřejných URL uspěla; není to zjištěný výpadek webu.

## Lokální kontrola

Izolovaná větev `codex/sk-pl-seo-preparation`, výchozí auditovaný HEAD `caa809c1`. Nezávislá kontrola všech 22 lokalizovaných HTML potvrdila skutečný lokalizovaný obsah, vlastní canonical, html lang, vlastní i vzájemné hreflang, členství v sitemap a existující statické lokální HTML cíle. `audit-site-structure.mjs` i `localize_site.py check --publish` prošly.

`sitemap:check` odhalil čtyři data lastmod 26. 10. místo skutečného data posledního HTML commitu 27. 10. u českého Jak to funguje a jeho tří překladů. Standardní generátor metadata opravil; následný check prošel pro **916 URL**. Nejde o plošné přepisování dat nebo chybějící URL.

Připravené změny lokalizací (`e8926c61`), překladového systému a OpenAI (`8ad4a722`) i Reels (`caa809c1`) nejsou v uvedeném produkčním commitu. Při nasazení celé větve je tedy třeba zkontrolovat i OpenAI konfiguraci a živý syntetický výstup; lokální mocky samy přístup účtu k modelu nepotvrzují.

## Co zůstává nehotové

- Účet, ceník, checkout, profil, podpora a transakční zprávy jsou české, ceny CZK. Tarot/andělské karty jsou lokalizované průvodce s označeným přechodem na české výklady. Natál poskytuje lokalizovaný základní přehled poloh.
- Automatická synchronizace z CZ zahrnuje pouze Jak to funguje. Dalších 19 lokalizovaných vstupů je ručně udržovaných. Celý český web není přeložený.
- Nebyla ověřena kvalita živých modelových odpovědí ani rodilá redakční kontrola všech překladů.

Pro první SEO uvedení není nutné čekat na překlad celého webu: skutečně lokalizovaný užitečný obsah může mít samostatné URL a vzájemné hreflang. Je však nutné nejprve zveřejnit existující připravené stránky; odesílat dnešní anglické 404 nedává smysl. Není potřeba v GSC zapínat jednotlivé jazyky. Hlavní sitemap již obsahuje jazykové adresáře a její nová verze má obsahovat všechny publikované varianty. Sitemap ani žádost o indexaci negarantují přijetí nebo pozice.

Primární dokumentace: [Google: lokalizované verze](https://developers.google.com/search/docs/specialty/international/localized-versions), [vícejazyčné weby](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites).

Delegace: Sol provedl nezávislou read-only kontrolu lokálních souborů a statických auditů. Hlavní agent ověřil živé HTTP, konkrétní Railway verzi a indexaci úvodů v GSC a opravil čtyři metadata sitemap. Bez push, deploy, nákupu, živé AI generace nebo změny GSC konfigurace.
