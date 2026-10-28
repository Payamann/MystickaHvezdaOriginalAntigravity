# Mystická Hvězda — celkový audit, 28. 10. 2026

**Hlavní závěr:** Web má zdravý základ technického SEO, rozpoznatelný vzhled a skutečnou organickou návštěvnost. Obchodní výsledek je zatím velmi malý a měření akvizice i nákupů má konkrétní vady. Největší příležitost je zlepšit spolehlivost a vysvětlení existujících služeb, správně měřit zaplacené a doručené objednávky a rozvíjet nejsilnější existující vstupy. Plošný redesign, další nástroje, reklamy ani stovky nových překladů nejsou první krok.

**Rozsah a důkazy.** Produkce ověřena přes `/api/health`: `8b4ba212526c45735a0ea7b23dcf4b0d49cf00d3`. Audit je čtecí, bez změn aplikace, nasazení, nastavení GA/GSC/Stripe, skutečné registrace, platby, generování výkladů nebo zákaznických e-mailů. Zahrnuje zdroj všech 916 URL v hlavní sitemapě, 21 živých HTML GET, robots a obě sitemap, desktopovou homepage a mobilní vzorky, GSC, GA4, Stripe live a agregace aplikační databáze. Strojová kontrola není redakční posouzení každého odstavce ani potvrzení všech uživatelských cest.

Srovnávací období: **29. 9.–26. 10. 2026 proti 1.–28. 9. 2026**. Přesná data byla ověřena v ovladačích GSC a GA. Aplikační a Stripe agregace používají hranice půlnoci Europe/Prague. Časové pásmo samotné GA property nebylo nezávisle ověřeno; okrajové dny se mohou mezi systémy lišit. Proto nevzniká společná „konverzní míra z GSC do nákupu“. Starý report indexace je aktualizovaný k 23. 10., ne k času auditu.

Strojová data: [metriky a omezení](comprehensive-audit-2026-10-28/metrics.json), [inventář zdroje](comprehensive-audit-2026-10-28/source-inventory.json), [živé vzorky](comprehensive-audit-2026-10-28/live-representative-urls.json). Tabulky GA/GSC jsou přečtené z UI; top seznamy nejsou úplný export všech řádků. Stripe seznamy charges a subscriptions byly úplné (`has_more=false`). Do reportu se neukládají jména, e-maily, otázky, klíče ani osobní výklady.

## 1. Jak na tom jsme v číslech

| Ukazatel | Nyní / aktuální období | Předchozí období nebo výklad |
|---|---:|---|
| GSC prokliky, webové hledání | **1 356** | 1 256; **+8,0 %** |
| GSC zobrazení | **45 301** | 45 958; −1,4 % |
| CTR | **2,99 %** | 2,73 % |
| Průměrná pozice, zaokrouhlená karta | **7,5** | 8,2; nejde o pozici každého dotazu |
| Mobilní prokliky | **1 143 / 84,3 %** | mobil je hlavní zařízení |
| GA4 relace / aktivní uživatelé | **779 / 531** | měřené návštěvy, ne všichni skuteční návštěvníci |
| GA4 Organic Search | **494 relací / 63,4 %** | ovlivňuje souhlas, blokování a atribuce |
| Registrace v aplikační DB | **18** | 19 |
| Úspěšně stržené Stripe platby | **3 / 547 Kč** | 2 / 398 Kč hrubých plateb |
| Z toho členství | **2 platby / 398 Kč** | neplést počet plateb s novými předplatiteli |
| Z toho vztahový výklad | **1 platba / 149 Kč** | Stripe potvrzuje produkt, DB stav fulfilled |
| Zaplacená Osobní mapa v období | **0 evidovaných objednávek** | oprava doručení sama neprokazuje poptávku |
| Aktivní placená předplatná k auditu | **2 × 199 Kč/měsíc** | nominální měsíční opakovaná částka 398 Kč |

Přesné souhrny GSC byly dopočítány ze všech tří vzájemně oddělených řádků zařízení; karty jsou zaokrouhlené. U CTR se dělí celkové prokliky celkovými zobrazeními. Graf GSC chybně uváděl Invalid Date/1970; pro období byl použit kalendář, nikoli tento popisek.

547 Kč jsou úspěšné hrubé platby, **nikoli zisk**. Chybí alokace poplatků, AI, hostingu, e-mailů, obsluhy a ověření, které živé nákupy mohl provést provozovatel. Předchozí období obsahuje i částečně vrácenou platbu, ale čas vratky nebyl samostatně vyhodnocen; z částky vrácené na starém charge nelze dělat čisté tržby daného období. Poslední faktury obou aktivních předplatných jsou zaplacené, bez zbývající dlužné částky. Nominální opakovaná částka není garance další platby.

Za aktuální období vznikly 3 nové objekty předplatného a 3 předplatná skončila. Dva ze tří nových objektů jsou k auditu zrušené. To je důvod prověřit aktivaci a důvody odchodu, ale vzorek je příliš malý pro spolehlivou procentní míru churnu nebo závěr o ceně. Všech 13 historických objektů předplatného není 13 současných zákazníků.

## 2. SEO: celkově mírný růst, rozdílné výsledky jednotlivých částí

| Stránka | Prokliky nyní | Dříve | Co z toho plyne |
|---|---:|---:|---|
| `/tarot-laska.html` | 210 | 266 | −21,1 %; hlavní ztráta významného vstupu |
| `/tarot-karta-dne.html` | 157 | 141 | +11,3 %; fungující vstup k návratům |
| `/tarot-ano-ne.html` | 122 | 158 | −22,8 %; prověřit mix dotazů a pozice |
| `/partnerska-numerologie.html` | 67 | 30 | +123,3 %; příležitost mimo tarot |
| `/tarot.html` | 64 | 51 | +25,5 % |
| `/sk/tarot-ano-nie.html` | 60 | 82 | −26,8 % |
| `/kristalova-koule.html` | 53 | 85 | −37,6 %; zároveň má konkrétní problém kvót |
| `/sk/kristalova-koule.html` | 41 | 54 | −24,1 % |
| Homepage | 40 | 10 | malý základ, nelze extrapolovat +300 % |
| `/andelske-karty.html` | 33 | 12 | růst při téměř stejném počtu zobrazení |

U tarotu na lásku poklesla zobrazení z 6 505 na 3 673, zatímco CTR se zlepšilo přibližně ze 4,09 % na 5,72 %. Samotný přepis titulku tedy není podložené vysvětlení celé ztráty. Další krok je rozpad dotaz × stránka × zařízení: zjistit, které dotazy ztratily zobrazení, zda změnily pozici a zda nezískává provoz jiná vlastní stránka. Kanibalizace nebyla tímto auditem prokázána.

Podle země má Česko 1 178 vs. 1 018 prokliků, Slovensko 126 vs. 173 a Polsko 7 vs. 11. Země návštěvníka není totéž co jazyk URL. Český trh je nejsilnější; slovenský už má doloženou poptávku, ale oslabil. Polský vzorek zatím nestačí k velké obsahové investici. Anglické stránky nasazené 27. 10. leží mimo vyhodnocované období; tento report nehodnotí jejich úspěch ani neúspěch.

**Doporučení:** zachovat URL, nejprve opravit konkrétní slabiny na důležitých vstupech, poté připravit obsahové zlepšení pro tarot láska/ano-ne a partnerskou numerologii podle skutečných dotazů. Nové rodiny stránek nevytvářet jen kvůli počtu.

## 3. Indexace a technické SEO

V hlavní sitemapě je živě **916 URL**, v datované horoskopové sitemapě **84 URL**. Počet datovaných URL se mění podle dostupných způsobilých veřejných výkladů; není přímo srovnatelný se statickou sitemapou nebo starým počtem 732 kombinací. Všech 916 canonical stránek má ve zdroji title, description, správnou canonical, lang a jeden H1, bez noindex. Nebyly nalezeny přesně shodné title. **1 922 JSON-LD bloků** je syntakticky validních; to neověřuje jejich pravdivost, vhodný typ ani nárok na rich result.

21 živých HTML vzorků zahrnuje hlavní nástroje, oba jednorázové produkty, ceník, jazyky a obsahové rodiny. Všechny HTTP200 se správnou canonical, bez noindex/X-Robots-Tag. Robots dovoluje běžné veřejné procházení a záměrně omezuje účet, profil, administraci a API. Není zde důkaz plošného blokování veřejného webu.

GSC k 23. 10. hlásí **1 215 indexovaných a 1 636 neindexovaných URL**. Je to inventář všech známých URL včetně historie a parametrů, nikoli 1 636 chyb současných 916 stránek.

| Důvod | Počet | Vyhodnocení |
|---|---:|---|
| noindex | 607 | velká část starého archivu; neodstraňovat plošně |
| Alternativa se správnou canonical | 281 | typicky správná konsolidace variant |
| Blokováno robots | 32 | ověřovat konkrétní URL, účet/profile bývají záměrné |
| Přesměrování | 27 | samo není chyba |
| 404 | 2 | zkontrolovat současný stav konkrétní adresy |
| Procházeno, neindexováno | 196 | vybrat užitečné veřejné kandidáty, posoudit obsah a odkazy |
| Google zvolil jinou canonical | 1 | prověřit konkrétní variantu |
| 5xx | 2 | historické; validace oprav běží |
| 403 | 1 | historické; validace oprav běží |
| Chyba přesměrování | 0 | úspěšně ověřená |
| Objeveno, neindexováno | 487 | rozdělit archiv vs. skutečně hodnotné vstupy |

Navíc jedna URL je indexovaná i přes robots blokaci. Bez identifikace URL to není důkaz zveřejnění osobních dat.

Konkrétní vzorek `/tarot-vyznam/soud.html`: GSC uvádí procházeno, neindexováno, poslední procházení 16. 10., úspěšné načtení, procházení i indexování povolené a vlastní canonical. Zde není doložená technická blokace; další práce má řešit užitek stránky, vztah k rozcestníku a odlišnost obsahu. Samotné opakování žádosti indexaci negarantuje. [Google: žádost o opětovné procházení](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

## 4. Měření: nejdůležitější oprava před dalšími marketingovými rozhodnutími

**Potvrzená nesrovnalost:** Stripe má 547 Kč úspěšných plateb, GA4 pro stejné datum ukazuje 0 Kč a filtr názvu události `purchase` nenajde žádné události. Standardní uzavřená checkout cesta GA má 4 zahájení, pak krok „Přidat dopravu“ a nuly dále. Digitální výklad nevyžaduje dopravu; tato výchozí cesta tedy není použitelná jako doklad, že všechny skutečné platby selhaly.

**Potvrzená kontaminace akvizičního přehledu:** ve stejném 28denním GA reportu Relace–zdroj/médium jsou `tarot_yes_no_result / (not set)` (30 relací), `tarot_yes_no_card_pick` (16), `seo_tarot_yes_no` (13), `crystal_ball_question` (8), `relationship_tarot_page` (6) a `homepage_relationship_spotlight` (5). To jsou interní umístění a akce, nikoli externí zdroje návštěvy. Přehled má 100 relací Unassigned.

Zdroj `js/analytics.js:422–438` předává interní parametr `source` beze změny do gtag; producenti přesně odpovídají pozorovaným hodnotám (`js/tarot-ano-ne.js:861,972`, `js/crystal-ball.js:262`). To je silný kandidát příčiny. Přesný rozsah přepisování atribuce se musí potvrdit zachycením requestu a DebugView, ne pouze názvem parametru. Google rozlišuje pravidla atribuce jednotlivých událostí a relací; nejde automaticky tvrdit, že jedna akce pokaždé vytvoří novou relaci. [Google: kampaně a zdroje návštěvnosti](https://support.google.com/analytics/answer/11242841?hl=en).

Nejmenší oprava: oddělit interní `interaction_source` od marketingové atribuce v GA adaptéru, zachovat backendové názvy a anonymní identifikátory toků. Poté ověřit pravdivou nákupní událost s cenou, měnou a deduplikačním ID. Respektovat souhlas; neposílat otázky, e-maily ani text výkladu. Hlavní nákupní pravda má nadále stát na Stripe a uložených objednávkách, ne na návratu na success URL. Není nutné zakládat novou GA property nebo měnit celou měřicí infrastrukturu.

Pinterest má 72 relací, ale 0 zapojených relací, 0 s zapojení a přesně 3 události na relaci. To je kandidát ke kontrole kvality návštěv/automatizace/sběru, nikoli důkaz botů nebo dobrého sociálního kanálu. Nelze podle něj zatím navyšovat obsahovou práci na Pinterestu.

Přesnost přehledu: zobrazené kanálové řádky se sčítají na 778 relací, celková karta uvádí 779. Obě hodnoty jsou zachované; příčina rozdílu jedné relace nebyla nezávisle určena. V detailu zdroj/médium UI uvádělo téměř všechna dostupná data. Čísla se proto nevydávají za dokonale propojený účetní export.

## 5. Nabídka, prodej a doručení

Backend pro vztahový výklad ukazuje tyto nezávislé počty za období:

| Událost | Události | Rozlišené flow_id / Stripe relace |
|---|---:|---:|
| Viditelná nabídka | 478 | 359 toků |
| Klik na produkt | 10 | 8 toků |
| Zobrazení produktové stránky | 28 | 22 toků |
| Začátek formuláře | 3 | 2 toky |
| Odeslání formuláře | 2 | 1 tok |
| Checkout vytvořen | 2 | 1 tok / 2 Stripe relace |
| Zaplaceno | 1 | 1 tok / 1 Stripe relace |
| Událost doručení | 1 | 1 tok / 1 Stripe relace |

Flow není unikátní člověk a toto není spojená kohorta stejných návštěvníků. Produktová stránka má i jiné vstupy, proto se počty nemusí monotónně snižovat. Z těchto součtů nelze dělat definitivní konverzní míru. Přesto je zřejmé, že zatím chybí dostatek skutečných objednávek a největší prostor pro učení je mezi viditelnou nabídkou, klikem a začátkem formuláře.

Jediná platba 149 Kč je v Stripe ověřená jako `relationship_tarot`; DB má odpovídající paid objednávku a stav `fulfilled` i doručovací event. Historický řádek nemá `email_sent_at`. Tím není prokázáno nedoručení, ale report nemá nezávislé potvrzení převzetí zákazníkem. Neprováděl se resend ani nový placený test.

Osobní mapa má 132 eventů zobrazení produktu, 1 klik CTA a žádnou zaplacenou objednávku v období. Není tím doloženo 132 osob; u těchto eventů chybí flow identifikátor. Cena se nemá měnit jen podle tohoto malého a nedokonale propojeného vzorku.

V období je 17 neúspěšných Stripe pokusů, ale jen **2 odlišné PaymentIntenty**. Nesmí být prezentovány jako 17 neplatících zákazníků. Aktuální dva aktivní tarify mají poslední faktury paid. V aplikační DB zůstávají dvě historické neshody se Stripe: jeden `past_due` a jeden `cancel_pending`, které Stripe vede canceled, s již minulými obdobími. Prověřit synchronizaci a reporty; bez kontroly přístupové logiky to není důkaz neoprávněného přístupu. Nic automaticky neobnovovat ani neoslovovat zrušené zákazníky.

**Obchodní priorita:** před další expanzí získat rozhodnutelný vzorek zaplacených a doručených objednávek s reálnou zpětnou vazbou. Přetrvává dříve přijatý orientační milník 10 objednávek, nikoli tvrzení, že jde o statistický důkaz nebo rentabilní produkt. Relevantní bezplatné nástroje mají zachovat celý slíbený výsledek; ne každý návštěvník potřebuje vztahový produkt.

## 6. Použitelnost, vzhled a rychlost

Desktopová homepage má jasnou hlavní akci, rozcestník podle záměru, čitelné rozlišení bezplatné a jednorázové služby a žádnou reklamní plochu v kontrolovaném pohledu. Tmavá modrá/zlatá a vlastní ilustrace tvoří konzistentní základ. V kontrolovaných místech není vzhled důvodem pro nový plošný redesign.

Na mobilním viewportu 390 × 844 byly vizuálně a přes DOM ověřeny homepage, ceník, tarot ano/ne a vztahová produktová stránka/formulář. Nebylo zjištěno horizontální přetékání (clientWidth a scrollWidth shodné, 375–382 px podle scrollbarů). CTA a text jsou čitelné, u otázky, e-mailu a souhlasu existují popisky. Vyplnění souhlasu, vytvoření objednávky ani platba neproběhly. Nejde o kompletní WCAG audit nebo test všech telefonů.

Na členském ceníku jsou viditelně 7 dní zdarma, následných 199 Kč/měsíc, automatická obnova a zrušení v profilu. Jednorázový výklad jasně říká 149 Kč bez registrace a předplatného a automatické vytvoření podle zadání. Tyto vzorce zachovat. Hypotéza k ověření: posílit jeden relevantní přechod z výsledku do ukázky a formuláře, místo dalších nabídek; nutnost vychází z malého počtu kliků a začátků, ne z prokázané příčiny.

**Výkon zatím nelze uzavřít.** GSC neposkytuje field Core Web Vitals. Jeden nový PageSpeed API pokus skončil HTTP429 kvůli kvótě Google; nový Lighthouse výsledek nevznikl. Živý GET200 není důkaz dobrého LCP/INP/CLS. Další samostatný krok má být reprodukovatelný mobilní laboratorní baseline pro hlavní vstupy a sběr reálných CWV při dostatečné návštěvnosti. Do auditu se nepřebírají stará skóre jako aktuální.

## 7. Důvěryhodnost a konkrétní produktové závady, které zbývají

| Nález ve skutečném produkčním zdroji | Dopad a nejmenší oprava | Ověření |
|---|---|---|
| Horoskop a koule nerozlišují univerzální fallback po selhání AI (`server/routes/horoscope.js:340–355`, `js/horoscope.js:749–785`, `server/routes/oracle.js:243–271`, `js/crystal-ball.js:251–269`) | Náhradní podnět může působit jako běžná osobní generace; označit fallback a prověřit spotřebu kvóty. | Mock fallback:true a dostupná běžná odpověď; bez placeného modelu. |
| Koule lokálně ukazuje 3 otázky, anonymní server standardně dovoluje první (`js/crystal-ball.js:8,113–116`, `oracle.js:205–215`) | Návštěvník může vidět zbývající otázky a přesto narazit na gate. Sjednotit se skutečným serverovým nárokem. | Anonymní první/druhá otázka, přihlášený s vyčerpaným limitem. |
| Horoskop označí historii uloženou před potvrzením save; klíč neobsahuje účet (`js/horoscope.js:805–808`) | Dočasná chyba může zabránit opakovanému uložení ve stejné relaci. Zapsat až po ID a vázat na účet. | Save null → další save úspěch; výsledek zůstane viditelný. |
| Návrat z platby Osobní mapy zná platbu, ne stav doručení (`server/routes/pdf-checkout-result.js:24–28`, `js/osobni-mapa.js:254–264`) | Preparing/fulfilled/failed může uživateli působit stejně. Zobrazit bezpečný skutečný stav objednávky. | Tři stavy bez nové platby. |
| Konkrétní ochranná/léčivá a pevná procentní tvrzení v knihovně (`andelske-karty.html:587–589,153`, `numerologie.html:471,97`, `partnerska-shoda/aries-taurus.html:61,172,226`) | Disclaimer neodstraňuje zavádějící větu. Upravit viditelný text i schema/generátor a vysvětlit metodu místo nevysvětlených 65 %. | Redakční náhled a shoda FAQ se schematem. |

Toto nejsou znovu nahlášené opravy osobní mapy/webhooku, mentor/numerologie nebo odstraněný hash fallback synastrie. Ty jsou už v produkci. Další kandidát: některé starší klienty horoskopu/koule nezachycují vlastníka před async generací; bez cílené reprodukce není označen jako potvrzený přenos výsledku mezi účty.

Pro důvěryhodnost obsahové knihovny doporučuji u vzorků jmen, snů, párové shody a numerologie oddělit doložitelný fakt, kulturní tradici a otázku k zamyšlení; uvést skutečné zdroje a poctivý popis automatické tvorby. Nezakládat vymyšlené autory či reference. Přesně odlišný title a syntakticky validní schema samy neposkytují originalitu nebo užitečnost.

## 8. SK, PL a EN

Existuje **22 jazykových vstupů: SK8 / PL7 / EN7**, vedle 894 českých canonical URL. Jde o vybrané stránky a nástroje, ne plný překlad celé aplikace. Vzorky živých jazykových URL prošly. Účet, ceník, platby, e-maily a část tarotových/andělských výkladů zůstávají české; některé lokalizované vstupy tuto hranici poctivě uvádějí.

Konkrétní další nedostatek: `js/localized-natal-chart.js:116–163` neukazuje skutečný stav rozpoznání místa a přesnosti, který server vrací (`astrology.js:945–979`). Pevná obecná poznámka nestačí k rozlišení rozpoznaného města a nouzového UTC. Ověřit dvěma mock chart odpověďmi a přeložit skutečné statusy.

Na české homepage v kontrolovaném vykresleném footeru byly jen CZ/SK/PL odkazy; ceník a tarot ano/ne už ukazují také English a u chybějícího protějšku označení „úvod“. Sjednotit objevitelnost anglických stránek, ne tvrdit, že EN vůbec neexistuje. Automatická synchronizace z češtiny zatím pokrývá omezený registrovaný rozsah, nikoli všechny stránky.

Doporučené pořadí zůstává CZ → jedna úplná slovenská cesta → polština podle poptávky → omezený anglický pilot. U placené cesty je nutná návaznost výsledku, chyb, nabídky a podpory, ne jen SEO landing page. Nové EN vydání se nemá hodnotit podle období končícího před jeho nasazením.

## 9. Nejbližší pořadí práce

| Pořadí | Krok | Proč teď | Podmínka dokončení |
|---|---|---|---|
| 1 | Opravit GA adaptér akvizice a nákupní reporting; používat backendovou pravdu objednávek | Dnes nevíme spolehlivě, co přivádí a vytváří nákup. | Externí zdroj zůstane zachován, interní akce oddělená; zaplacená syntetická/testovací objednávka je deduplikovaná, souhlas respektován. |
| 2 | Srovnat staré Stripe/DB stavy a stav doručení v návratové stránce | Předejít chybnému reportování a nejistotě po platbě. | Žádné mylné aktivní reporty; preparing/fulfilled/failed rozlišeny. Bez obnovování zrušených plateb. |
| 3 | Koule: pravdivá kvóta a označení fallbacku; opravit ukládání horoskopu | Konkrétní potvrzené rozpory funkce a slibu. | Cílené mock regrese a čitelný chybový stav. |
| 4 | Zlepšit stávající nabídku a její relevantní přechod podle spojených toků a zpětné vazby | Málo kliků a skutečných objednávek; další traffic sám problém nerozhodne. | Propojené kroky a reálný vzorek doručených objednávek; žádný slib statistického vítěze. |
| 5 | SEO rozpad propadových dotazů a kvalitativní aktualizace důležitých vstupů | Celkový růst skrývá ztráty lásky/ano-ne/SK a růst numerologie. | Stejné URL, užitečnější obsah, publikace ověřená; potom úplná srovnatelná období. |
| 6 | Redakční oprava doložených tvrzení a vybraných neindexovaných stránek | Kvalita a důvěryhodnost jsou další limit, metadata už převážně existují. | Viditelný obsah a schema souhlasí; žádné nepodložené osobní diagnózy/procenta. |
| 7 | Dokončit jednu SK cestu a změřit mobilní výkon | Doložená slovenská poptávka a 84,3 % mobilních kliků. | Výsledek i chyby ve stejném jazyce, funkční mobilní cesta a aktuální výkonnostní baseline. |

Nedoporučuji nyní nové nástroje, plošné předělání vzhledu, masové změny canonical, odstraňování všech noindex, opakované hromadné žádosti o indexaci ani automatickou expanzi stovkami překladů. Jsou to neodůvodněné zásahy proti současným důkazům.

**Hranice závěru:** Audit nedokazuje rentabilitu, plnou bezpečnost, přesnost všech astrologických výpočtů, kvalitu všech 916 textů, převzetí všech e-mailů ani pořadí vůči konkurenci. Nebyl získán čerstvý backlinkový profil nebo SERP benchmark konkurentů; web proto nedostává vymyšlené SEO skóre ani označení „top v niche“. Má ověřený technický základ a jasně vybrané další kroky.
