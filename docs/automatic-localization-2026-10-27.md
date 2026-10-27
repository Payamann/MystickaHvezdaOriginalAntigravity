# Překlady z českého zdroje — 27. 10. 2026

## Ověřený výsledek

Je implementovaný překladový a sestavovací systém, nikoli návštěvnický překladač v prohlížeči. Český HTML soubor je zdroj. Text, vybrané atributy, metadata a podporované textové části JSON-LD se extrahují do stabilních segmentů. Překlady SK/PL/EN se ukládají podle hashe textu, kontextu a verze pravidel; při běžném sestavení se žádný AI poskytovatel nevolá.

První zapojený zdroj je `jak-to-funguje.html`. Z něj se sestavují `sk/ako-to-funguje.html`, `pl/jak-to-dziala.html` a `en/how-it-works.html`. Jsou připravené v lokální větvi. Produkční nasazení, GSC ani plánované placené překlady se tímto krokem neaktivují.

Původních 19 ručně připravených lokalizovaných vstupů zůstává zachovaných. Nejsou potichu převedené na jinou šablonu ani označené za automaticky synchronizované. Pro jednotlivé další stránky se doplní záznam do manifestu; generátor odmítá přepsat ručně udržovanou lokalizaci. Statické články lze připojit stejným způsobem. U nástrojů se nejprve musí ověřit jejich jazykový klient a skutečný výstup; překlad HTML nedokončí jejich funkci, platbu nebo e-mail.

## Tok změny

1. Změní se český zdroj. `locales:plan` ukáže chybějící/neaktuální segmenty, jazyk a objem textu.
2. `locales:sync` přeloží jen chybějící segmenty a vytvoří neindexovatelné náhledy. Vyžaduje výslovně stanovený limit požadavků a zdrojových znaků, pokud je vůbec potřeba volat API. Beze změn použije cache a udělá **0 požadavků** i bez rozpočtu.
3. Náhled a význam textu se zkontrolují. `locales:approve` zaznamená přesný hash současného zdroje i překladu. Schválení neplatí po změně obsahu.
4. `locales:publish` sestaví všechny jazykové varianty stránky společně, české návratové hreflang a data jazykových tras. Změna může být zkontrolovaná a commitnutá bez ruční editace přeloženého HTML.
5. Běžný `build:js` tento cache-only krok provádí automaticky, vloží publikované trasy do společné navigace a odmítne chybějící nebo neschválené překlady. CI navíc kontroluje aktuálnost a offline regresní testy.

Příkazy v čistém projektovém worktree:

```powershell
npm run locales:plan
npm run locales:sync -- --page how-it-works --max-requests 6 --max-characters 6000
npm run locales:preview
# Po skutečné obsahové kontrole:
npm run locales:approve -- --page how-it-works
npm run locales:publish -- --page how-it-works
npm run build:js
npm run sitemap:generate -- --write
npm run locales:check
```

Limit znaků/požadavků není měsíční rozpočet v korunách. Před prvním API voláním se kontroluje celá požadovaná dávka; pokud se nevejde, neodešle se nic. Každá dávka má nejvýše jeden pokus u poskytovatele a zároveň používá sdílený denní AI limit aplikace. Validní dokončené dávky zůstávají v cache při pozdější chybě. Opakované viditelné/FAQ texty se v rámci stránky překládají společně.

## Poskytovatel

Podle výslovného rozhodnutí Pavla je **OpenAI, model `gpt-6-luna`**. CLI bridge používá stejný serverový OpenAI transport a účtování požadavků jako web. Nepoužívá Anthropic ani Gemini. Strukturovaná odpověď a její pole se ověřují před zápisem do cache; překlady nemají oprávnění měnit ceny, měny, proměnné, odkazy, HTML ani kód.

V tomto běhu se placené API nevolalo. Pilot má kontrolované importované překlady, následné `sync` doložilo 0 požadavků a 0 nových znaků. Mocky ověřily správný poskytovatelský kontrakt i aktualizaci pouze změněného textu. Kvalita živého modelového překladu ještě nebyla ověřena skutečným voláním.

## SEO a aktualizace

Publikované varianty mají vlastní canonical, jazyk, přeložené titulky/popisy/alt texty a textové schema, reciproční cs/sk/pl/en a české x-default. Překlady nevytvářejí URL odhadem; cíle určuje manifest. Odkazy na existující překlady se přepíšou včetně zachování query/fragmentu, nepřeložené české cíle jsou viditelně označené. Assety mají správné kořenové cesty, aby fungovaly i lokální náhledy.

Náhledy jsou mimo sitemapu v ignorovaném `.tmp/localization-preview/` s `noindex, follow`. Tři publikovatelné lokální varianty zvyšují sitemapu z 913 na **916 URL**. Zápis je připravený jako celá sada; při chybě zápisu se předchozí obsah dotčených souborů obnoví. Změna již vygenerovaného HTML ručně je odhalená kontrolou driftu.

## Důležité hranice

- Není zapnuté plošné překládání nebo publikování všech českých URL. Manifest zatím registruje jeden ověřený pilot; katalog ostatní veřejné české URL pouze inventarizuje.
- Dnešní dynamické nástroje mají své stávající jazykové slovníky/klienty. Tento krok jejich veškeré řetězce nepřesunul do společného katalogu. Osobní výklady používají cílový jazyk přes server; jde o jinou vrstvu než statický překlad stránky.
- Čísla, měny, URL a proměnné se zachovávají přesně. To může vyžadovat rozdělení nevhodně dlouhého zdrojového odstavce; nepřepočítávají se ceny ani legislativa.
- Inline HTML může rozdělit větu do více segmentů; vložení sourozeneckého elementu může změnit identifikátory dalších segmentů a vyžádat konzervativní nové překlady. Schéma se kontroluje strukturálně; význam a přirozenost je třeba skutečně posoudit.
- Účty, checkout a e-maily zůstávají české, jak uvádí předchozí lokalizační checkpoint. Nový překlad je nesmí vydávat za lokalizované služby.

## Ověření a checkpoint

25 Python testů pokrývá extrakci, přesné pokrytí, ochranu hodnot, schema/FAQ, URL, zneplatnění cache, dávkové limity, cenu vrácenou chybně poskytovatelem, schvalování, opakovatelné sestavení a obnovu při chybě zápisu. 7 mockovaných JS testů ověřilo bridge a byl následně přepojen na společný OpenAI transport. Čtyři lokální browserové testy prošly pro SK/PL/EN, CTA, přepínač jazyka a desktop/mobil. Sitemapová a celowebová statická kontrola prošly.

Český pilot současně odstranil nedoložený slib registrace do minuty a místo zbytečné registrace vede na skutečný bezplatný horoskop. Zbytek starších obsahových nálezů a P1 doručení/synastrie tímto krokem opravený není.

Zdrojové soubory: `scripts/localize_site.py`, `scripts/localization/html_document.py`, `scripts/localization/translate-batch.mjs`, `data/localization/manifest.json`, cache a přesné review hashe. Delegace: Sol vytvořil HTML jádro a izolovanou regresi; Luna připravila pilotní překlady; hlavní agent zkontroloval texty, integroval CLI, build, navigaci a skutečné browserové výsledky. Finanční úspora se bez reálného měření netvrdí.
