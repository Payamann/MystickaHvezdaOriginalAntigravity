# Slovenská cesta: natálna karta

Ověřeno 1. 11. 2026 na produkční /sk/natalni-karta.html přes přihlášený in-app browser. Jen syntetické údaje, žádné AI generování, nákup ani e-mail. Read-only zdrojovou kontrolu provedl pomocník gpt-6-luna medium, hlavní agent nezávisle ověřil živý výsledek.

- Vstup a lokální CTA jsou slovensky, navazující čtyři SK odkazy existují. FAQ i navigační popisy výslovně označují dosud český účet, ceny a další české služby.
- 1990-01-15 / 12:00 / Bratislava: výpočet uspěl, Slnko Kozorožec 25°03', Mesiac Panna 16°57', Ascendent Škorpión 20°11'. Jde o smoke funkční cesty, nikoli nezávislou astronomickou validaci stupňů.
- Bez času: slovenské vysvětlení poledne v rozpoznaném časovém pásmu a nedostupného ascendentu/domů; ascendent „Nedá sa určiť“.
- 2099-01-15: „Kartu sa teraz nepodarilo vypočítať. Skontroluj údaje a skús to znova.“ Formulář umožnil opravu.
- Po návratu na 1990-01-15: výpočet znovu uspěl, vstup místa zachován. Výsledek i omezení jsou slovensky.

Konkrétní závislost nalezená při navazující kontrole: společný footer feedback má slovenské otázky/tlačítka, ale produkční js/feedback-widget.js vrací české zprávy při ukládání, úspěchu a chybě. Lokálně opraveno pro cs/sk/pl/en s českým fallbackem, zachován endpoint/payload/CSRF/retry. Pomocník Luna připravil kód a 5 cílených testů; hlavní agent revidoval diff, sestavil veřejný bundle, ověřil lint/diff a společně 17 frontend testů (5 widget +12precision) prošlo. Žádný falešný hlas nebyl odeslán do produkce. L03 je připraveno lokálně; živé převzetí poslední opravy zbývá. Jiné SK nástroje a placená cesta nejsou tímto smoke ověřené.
