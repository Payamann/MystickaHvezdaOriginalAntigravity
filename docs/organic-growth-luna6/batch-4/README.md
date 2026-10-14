# Organický růst · čtvrtá dávka · 14. 10. 2026

## Dokončený rozsah

Zbývajících deset katalogových detailů mečů má vlastní redakční význam, lásku, práci, ano/ne, praktický krok, obrácenou polohu, označenou modelovou situaci a otázku. Jde o Čtyřku, Pětku, Šestku, Sedmičku, Osmičku, Desítku, Páže, Rytíře, Královnu a Krále mečů. Spolu s předchozí dávkou je takto zpracováno **všech 14 mečových detailů**.

Všech 14 nyní také používá vlastní redakční téma pro title, meta/OG/X popisy, viditelný úvod, katalog a související odkazy. Generátor přijímá volitelný theme ve zdroji SEO; pro ostatní karty dál používá původní fallback. Výkladový engine a losování nezměněné. Není tím sjednocený generovaný runtime výklad, celý balíček 78 karet ani ostatní části webu.

Výběr dokončuje konkrétní problémy zaznamenané v [předchozí dávce](../batch-3/README.md). Nový GSC export nebyl získán, žádný nový růst ani změna CTR nejsou touto prací prokázané. Dřívější baseline nadále pochází z období 14. 9.–11. 10. 2026 vs. 17. 8.–13. 9. 2026.

## Opravy a návaznosti

- Osmička rozlišuje skutečná omezení a neověřené předpoklady. Odstraněné přisuzování viny návštěvníkovi a původní heslo „vlastní vězení“ z redakčních náhledů.
- Sedmička pracuje se strategií, soukromím a ověřením konkrétního rozporu. Karta není důkaz neupřímnosti ani nevěry.
- Desítka připomíná nefungující podmínky a možnost změny či ukončení, bez definitivního rozsudku nebo záruky budoucího zlepšení.
- Šestka neslibuje léčení, Čtyřka neurčuje zdravotní potřebu odpočinku, dvorní karty nejsou diagnózou či hodnocením určité osoby.
- Každý detail odkazuje na existující ilustrovaný průvodce všech 14 karet. Z něj už vedou odkazy zpět na konkrétní detail a na kartu dne.
- Katalog při filtrování nově zachovává také redakční téma, nikoli jen souhrn. Přepnutí filtru ani hledání tak nevrací staré heslo z engine dat.
- Změněno 17 HTML: katalog + 14 mečových detailů; Eso pentáklů a Král pohárů mají pouze aktualizovaný popisek související mečové karty. Žádný jejich vlastní výklad se nerevidoval.

## Skutečné ověření

- Nezávislý parser všech 17 změněných HTML v izolovaném kandidátu a po úzkém sloučení do rootu: jeden H1, původní canonical, platné JSON-LD a existující lokální odkazy/obrázky.
- Zdrojová kontrola: 14 kompletních redakčních záznamů, označené modelové příklady, dateModified 14. 10. 2026; ostatní override záznamy a engine data se proti HEAD nezměnily.
- Opakovaná regenerace 78 detailů změnila **0** souborů. Zdroj generator/hub JS i jejich syntax ověřené, konkrétní hub dist znovu sestavený.
- Skutečný prohlížeč na izolovaném portu 3345: desktop Osmička a Sedmička; filtr Meče → 14; hledání nového tématu „Rozlišit omezení“ → 1; nenalezená fráze → 0 a zobrazený empty state; vymazání → 14; Vše → 78 se zachovaným fallbackem Blázna. Při obnovení bylo ověřeno všech 14 redakčních témat v DOM.
- Mobil 390 × 844: detail Sedmičky a hledání Osmičky v katalogu bez vodorovného přetékání, nové téma zachované. Dočasný viewport resetován. [Skutečné screenshoty](overview.html).
- První otevření náhledu ukázalo offline fallback, protože předchozí lokální server neběžel. Obnoven statický server pouze na 127.0.0.1:3345; reload poté načetl nové stránky i nový skript. Nešlo o potvrzení problému produkce.
- Root sloučený třícestně se zachováním dřívějších vizuálních změn. Čtrnáct konfliktů se týkalo prázdné root sekce vs. tří doplněných meta tagů obrázku; vyřešeno úzce, bez přepsání celých stránek. Root JS dist sestavený z root zdroje.
- Sitemap **907 canonical URL včetně metadata PASS**; aktualizováno pouze 17 dotčených lastmod na 14. 10. 2026. Asset archiv zachoval všech **820** starších verzí a přidal pouze dva JS soubory; nyní 822. Service-worker generator hlásí aktuální cache. Whitespace kontrola diffu prošla.
- Pomocný gpt-6-luna / medium provedl read-only audit starých problémů a nového diffu bez blokujících nálezů. Hlavní agent nezávisle provedl implementaci, parser a prohlížeč. Drobná připomínka délky popisu Desítky vedla ke kratší první větě a nové regeneraci.

Aplikační testy se nepřidávaly ani nespouštěly; změněné filtrování ověřeno přímo v prohlížeči. Žádné platby, e-maily, FB publikace ani produkční zásahy.

## Uložení a další krok

Lokální větev codex/organic-growth-20261013 navazuje na c985f1f9; tato dávka nebyla pushnuta ani nasazena. Hlavní workspace obsahuje i starší rozpracované změny, pro vydání používat izolovaný kandidát s release guardem.

Mečový katalog je obsahově dokončený v uvedeném rozsahu. Další krok: prohlédnout celý lokální balík organických úprav a připravit konkrétní vydání, pokud Pavel zadá nasazení. Další tarotové barvy nejsou tímto označeny za revidované. Pro hodnocení výkonu je potřeba skutečné nasazení, crawl a nové srovnatelné období; automatický monitoring není nastavený.
