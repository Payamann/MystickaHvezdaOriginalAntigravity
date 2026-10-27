# OpenAI / Luna — příprava migrace, 27. 10. 2026

## Rozhodnutí a prostředí

Pavel výslovně požaduje **OpenAI pro celý projekt** a rozumný model řady Luna pro texty. Implementovaný model je `gpt-6-luna`; nesmí nastat automatický návrat k Anthropic, Gemini nebo jinému poskytovateli. Rozhodnutí je uložené i v existujícím produktovém kontextu.

Změny jsou lokální v izolované větvi `codex/sk-pl-seo-preparation`, navazují na lokalizační commit `e8926c61`. Produkce nebyla tímto úkolem nasazena ani přenastavena. Původní rozpracovaný hlavní workspace je zachovaný.

## Aktivní textové cesty

- Společný transport volá pouze `https://api.openai.com/v1/responses` s `OPENAI_API_KEY` v serverové Authorization hlavičce. Klíč se neposílá do prohlížeče, neukládá do zdrojů a neobjevuje v chybových výpisech.
- Všechny profily mají `provider: openai`, `modelTier: luna`, model `gpt-6-luna`. Výchozí reasoning je `none`: úlohy mají konkrétní zadání a nepotřebují spotřebovat výstupní limit na skryté uvažování. Dřívější délkové limity a timeouty zůstávají odlišné pro kartu, horoskop, členství a dlouhé placené PDF.
- Starý nebo dražší neodsouhlasený model v override způsobí srozumitelnou chybu před API požadavkem. Proměnné `ANTHROPIC_*` nejsou výběrem modelu ani fallbackem.
- Horoskopy, tarot, natál, numerologie, mentor, další orákula, osobní mapa, vztahový produkt a PDF používají tento společný transport. Zdravotní/produktové readiness kontroly vyžadují OpenAI klíč. Výpočetní astrologický engine a uložené vylosované karty se nemění.
- Denní e-mailový skript již nemá Gemini fallback. Při nedostupném AI zachovává existující místní fallback a skutečné chybové chování; změna žádný e-mail neposlala.
- Překladový bridge z [automatické lokalizace](automatic-localization-2026-10-27.md) používá stejný OpenAI transport. Hlídá rozpočet dávky a nezapíná API během obyčejného buildu.
- Samostatné reelové a večerní textové skripty mají vlastní OpenAI-only helper, jediný pokus, Luna model a omezený výstup. Nezapínají se jím sociální publikace ani další plánované úlohy.
- Starý SEO generátor zůstává chráněný proti zápisu/spuštění ve výchozím režimu; pokud je výslovně spuštěný, používá společné OpenAI, nikoli přímé Gemini.

## Kompatibilita a placené doručení

Kanoničtější import je `server/services/openai.js` (`callAI` / `callOpenAI`). Název `callClaude` a soubor `claude.js` zůstávají jako kompatibilní rozhraní pro existující importy a testy; skutečná funkce je stejný OpenAI transport. Stejně je historický `callGemini` jen wrapper do OpenAI. Tato jména nejsou alternativní poskytovatelé. Historický cenový estimator starých reportů zachovává původní význam, nepoužívá se pro nové OpenAI události.

Responses požadavky mají `store: false`. To vypíná uložení response state; není to tvrzení o nulové retenci všech provozních dat poskytovatele. Systémové instrukce zůstávají oddělené od nedůvěryhodného uživatelského kontextu a historie zachovává role.

Strukturované odpovědi používají `text.format` se striktním JSON schématem. Jako dokončený výstup lze přijmout jen dokončenou assistant message s `output_text`. Neúplný, odmítnutý, prázdný či nástrojový výstup není splněný placený výklad. Zachované validátory, uložený výsledek, idempotence a recovery mají zabránit falešnému úspěchu a novému losování při opakované platbě/doručení.

Přes provider, model, reasoning a schema je oddělená i AI cache, včetně callerem dodaného cacheInput. Starý cache klíč tak nemůže automaticky vrátit výstup jiného poskytovatele jako nový OpenAI výsledek.

## Náklady a chyby

Každý serverový síťový pokus si předem rezervuje společný denní limit. Výchozí limit zůstává 120 požadavků; změna poskytovatele ho nezvyšuje. Timeout pokrývá hlavičky i čtení těla, retry je omezený profilem a nevzniká pro běžnou validační chybu.

OpenAI usage ukládá vstup/výstup a reportovaný cache read bez dvojího započítání. Odhad používá standardní krátký kontext Luny: $0.10 / milion vstupních tokenů, $0.01 cache read a $0.50 výstup. Jde o datovaný **odhad**, nikoli fakturu nebo garantovaný korunový rozpočet; ceny/servisní režim se mohou změnit. Samostatné Python obsahové skripty mají vlastní omezení požadavku; jejich spotřeba není vydávaná za transakci společného serverového denního čítače.

Ověřená primární dokumentace: [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs). Model podporuje Responses, multilingual text a strukturovaný výstup. HTTP chyby se logují bez těl poskytovatele a bez promptů/klíčů.

## Grafika

Luna vytváří text, nikoli obrázky. Samostatný starší social image generator je přepojený na OpenAI `gpt-image-2.5-flare`, bez Imagen/Hugging Face/Pollinations fallbacků. Zachová signaturu, brandový prompt a požadované poměry stran. Jeden požadavek vytvoří nejvýše jeden PNG, bez automatického retry; chybný nebo prázdný obrázek se nevydává za hotový. Šest mockovaných testů ověřilo všechny čtyři přesné poměry stran, validaci PNG, jediný požadavek i chybové stavy. Neaktivuje se tím žádný publikační plán a při této práci nevznikl žádný živě generovaný obrázek.

[Oficiální Image API](https://developers.openai.com/api/reference/resources/images/methods/generate) a [rozměry/quality](https://developers.openai.com/api/docs/guides/image-generation) byly ověřeny samostatně; textový Luna model není podstrčený do obrazového endpointu.

V původním checkpointu zůstal vlastní hlas Reels na ElevenLabs do odpovědi Pavla. Pavel následně výslovně schválil i tuto změnu. Navazující migrace hlasu a titulků má samostatný [checkpoint](openai-reels-audio-2026-10-27.md); neaktivuje plánování ani publikování a nepřenáší původní vlastní hlas. Původních 946 serverových testů níže není vydáváno za ověření nové audio integrace.

## Ověření a hranice

- **93 serverových sad / 946 testů prošlo** v testovacím prostředí: transport, limity, cache, horoskopy, všechny existující AI fallbacky, přihlášení, checkout, webhook, doručení, obnova a PDF. OpenAI HTTP je mockovaný; lokální HTTP testy vyžadovaly povolený loopback.
- Z toho nové transportní testy výslovně pokrývají pouze OpenAI endpoint, autorizaci, striktní schema, neúplné/refusal/tool výstupy, klíče cache, každou rezervaci limitu a bezpečné chyby. Nový překladový bridge byl ověřen sedmi mock testy.
- Samostatný textový Python helper má pět mockovaných testů; mimo jiné odmítá jiný model, chybějící klíč a neúplný/nástrojový výstup. Žádný skutečný post nevytvořil ani nepublikoval.
- Statická kontrola hlídá, že web nemá přímý přístup k Anthropic/Gemini a přístup k OpenAI je soustředěný do společného transportu. Cílený ESLint a syntax kontroly prošly.
- Přítomnost názvu `OPENAI_API_KEY` v cílové Railway službě byla zjištěna read-only bez vypsání či kopírování hodnoty. Lokálně reálný klíč nenalezen. Přístup konkrétního účtu k modelu ani kvalita živých odpovědí nebyly otestované API voláním. Staré produkční proměnné nebyly mazány, protože běžící stará verze může být stále potřebovat.

Před produkčním nasazením je třeba ověřit skutečné proměnné `OPENAI_MODEL=gpt-6-luna` (nebo nepřítomný override), případný `OPENAI_RELATIONSHIP_MODEL`, přístup klíče k modelu a vybranou syntetickou canary generaci v autorizovaném prostředí. To je provozní ověření konkrétního vydání, nikoli splněný krok tohoto lokálního checkpointu. Není tvrzená nová produkční verze, zaplacená zákaznická poptávka ani lepší kvalita modelu jen podle mocků.

Původní nezávislé P1 nálezy webhook ID osobní mapy a synastrického tichého skóre nejsou tímto transportním přepojením opravené. Jejich existence se nemá ztratit za úspěšným výsledkem regresních sad.

Delegace: Astra připravila kritický transport a jeho testy; Sol změnil okrajové cesty, klíče, skripty a následnou grafickou integraci; hlavní agent nezávisle zkontroloval provider kontrakt, modelové profily, náklady, úplnou serverovou regresi a navázal překladový systém. Úspora nebyla živě měřena.
