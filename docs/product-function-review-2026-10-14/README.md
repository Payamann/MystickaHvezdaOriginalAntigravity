# Funkce, smysl a styl Mystické Hvězdy · 14. 10. 2026

Navazující [společný TODO pro dokončení celého webu](../web-redesign-todo.md) určuje pořadí práce; níže zůstává původní datovaný audit a jeho rozsah důkazů.

## Závěr

Technický základ hlavních cest je použitelný, ale nelze poctivě říct, že je vše dotažené. Nejdůležitější další práce je konzistence výpočtů, pravdivé chování při výpadku a spolehlivé opakování placeného doručení. Další ilustrace samy tyto problémy nevyřeší.

Doporučené hlavní zaměření: **malovaný tarot pro každodenní otázky, vztahy a sebepoznání**. Podporovat jej denní kartou a praktickými významy karet; vztahový výklad za 149 Kč nabídnout tam, kde návštěvník opravdu řeší vztah. Horoskopy a numerologii zachovat jako smysluplné samostatné vstupy. Ostatní nástroje mohou být v přehledné knihovně, nemusí všechny soutěžit o první obrazovku.

Jde o hypotézu opřenou o vlastní návštěvnost a současný produkt, ne důkaz, že jiné zaměření nemůže fungovat. Není rozhodnuto mazat URL, rušit produkty ani měnit ceny.

## Rozsah a důkazy

- Kandidát `a6d9f96c` v `.codex-tmp/release-20261012`. Kořen má další rozpracované změny a nebyl zaměněn za čisté vydání.
- Inventář 59 unikátních hlavních vstupů z registru funkcí, navigace a doplněných nástrojů. Všechny soubory a jejich přímo uvedené lokální obrázky existují. [Inventář](inventory.md), [strojová data](inventory.json). Toto není ruční kontrola všech přibližně 900 generovaných URL.
- 34 existujících testovacích sad, **244 testů prošlo**: 61 engine/API/fallback, 159 placené cesty a účty, 24 klientské výpočty a platební stavy. Použity lokální mock služby, žádná skutečná platba, AI generování ani e-mail. [Výsledky](verification.json).
- Kontrola katalogu: 78 karet, 78 obrázků nalezeno, 0 chybějících.
- Ručně v prohlížeči: desktop/mobil přihlášení a navigace, slovníková plocha, model profilových komponent, denní tarot včetně stejné karty po reloadu, číselná kalkulačka, filtr snáře. Profilový model neprokazuje fungování skutečného přihlášeného účtu.
- Veřejné produkční GET endpointy 14. 10. v 18:02 UTC: health 200/ok, commit `9782cab61671200a57859f933621585b87a7b7c5`, vztahový produkt zapnutý za 149 Kč, mapa za 299 Kč/12 měsíců, veřejné členství 199 Kč/měsíc se 7 dny zkoušky. [Odpovědi](public-status.json). Health kontroluje mimo jiné konfiguraci; není důkazem úspěšného generování ani doručení každému zákazníkovi.
- Nejprve testům bránilo sandboxové `EACCES` na localhost. Stejné sady poté prošly s oprávněním pro lokální komunikaci. První neúspěch nebyl označen za závadu aplikace.
- Pokus o dva nezávislé pomocníky skončil jejich usage limitem; nezískané výsledky nejsou součástí auditu. Hlavní agent provedl níže uvedené kontroly sám.

## Nálezy podle priority

### P1 · Osobní mapa nemá stejně trvalé doručení jako vztahový výklad

`server/services/one-time-fulfillment.js:12` vždy znovu generuje obsah, PDF a odesílá e-mail. Do této větve se nepředává ID objednávky, ukládá se pouze vstup. `server/email-service.js:1938` neposílá idempotency key. Webhook `server/payment.js:2156` po odeslání volá `markOneTimeOrderInputFulfilled`, ale nekontroluje jeho vrácené false. Reconciliation `server/jobs/one-time-order-reconciliation.js:178` nevyřízený placený vstup zpracuje znovu.

Při selhání zápisu stavu po úspěšném odeslání tak existuje cesta k druhému generování a druhému e-mailu, případně jinému obsahu. Závěr je ze zdroje, nebyla vyvolána chyba na skutečné zákaznické objednávce. Vztahový výklad už má uložený výklad, provider ID a klíč `relationship-tarot-${orderId}`; tento vzor rozšířit na PDF. Přijetí: retry používá stejný uložený výsledek a provider receipt, a neúspěch finálního zápisu se řeší výslovně.

### P1 · Výpadek natálního výpočtu vytváří zdánlivou mapu

`js/natal-chart.js:701` při selhání API pokračuje se seedem `name.length + birthDate.length`. `generatePlanets` na řádku 287 používá místo výpočtu `(seed * 37 + index * 55) % 360`. Trojrozměrná varianta `js/natal-3d.js:66` dostává pouze seed i při úspěšném výpočtu (`js/natal-chart.js:718`).

Výsledný obrázek nesmí působit jako poloha planet vypočtená z narození. Přijetí: při chybě zobrazit srozumitelnou nedostupnost a možnost opakovat; čistě dekorativní model výslovně označit nebo odstranit z výsledku. Server má vlastní efemeridu nižší přesnosti a domy Whole Sign; nejde o astronomický certifikát přesnosti.

### P1 · Partnerská shoda při výpadku ukazuje skóre odvozené ze jmen

`js/synastry.js:623` inicializuje skóre klientskou funkcí a při chybě serveru je ponechá. `js/utils/synastry-logic.js:14` hash zahrnuje jména; výsledky 55–95 nejsou z planetárních aspektů. To může měnit „kompatibilitu“ pouhou změnou jména. Nejde o důkaz, že serverová úspěšná větev používá jména pro astronomický výpočet.

Přijetí: žádné náhradní procento; viditelná chyba nebo jasně jinak označený symbolický nástroj. Ani vypočtené skóre neprezentovat jako šanci na úspěch vztahu.

### P1 · Dva různé výsledky životního čísla

Samostatná kalkulačka `js/kalkulacka-cisla-osudu.js:128` sčítá všechny číslice. Plná numerologie `js/utils/numerology-logic.js:32` a server `server/routes/numerology.js:39` redukují den/měsíc/rok zvlášť a zachovávají mistrovská čísla i mezikroků. Pro syntetické datum **1. 1. 1980 vrací první 2 a druhá 11**; kalkulačka ověřena i ručně v prohlížeči. Další příklady v [porovnání](numeric-consistency.json).

Různé numerologické školy nejsou samy programátorská chyba. Na jednom webu bez vysvětlení metody ale uživatel dostává protichůdný výsledek. Přijetí: zvolit a popsat jednu metodu, sdílet stejnou funkci nebo výrazně označit varianty; přidat případ do existující regrese.

### P1 · Některé prompty odporují pravdivému hlasu služby

`server/config/prompts.js:106` dává mentorovi roli entity vidící čas/prostor a příkaz „nejsi robot“. `dreamAnalysis` na řádku 128 nařizuje nikdy nepřiznat AI; některé další části vynucují emotikony. `server/mentor.js:126` tento mentor prompt skutečně používá. Textový český kontrakt v jiných routách nezruší všechnu předstíranou autoritu.

Přijetí: vřelý symbolický průvodce, který pravdivě vysvětlí automatický vznik a znalost historie z uložených údajů. Historii nepřipisovat schopnosti hvězd něco odhalit. Zkontrolovat skutečné vzorky po opravě, nikoli jen délku a tykání. Silnější model sám tento konflikt nevyřeší.

### P2 · Nouzový obsah vypadá jako osobní výklad

Routy vracejí `fallback: true`, ale klient např. `js/minuly-zivot.js:271`, `js/angel-cards.js:639`, `js/numerology.js:623` a `js/crystal-ball.js:227` standardně zobrazí text; některé příznak uloží jen do historie. U mapy minulého života je nouzový archetyp vybrán podle měsíce narození. Nejde o nový osobní výklad vytvořený pro všechny vstupy.

Přijetí: jemný viditelný štítek „Základní symbolický výklad; osobní generování teď není dostupné“ a možnost dalšího pokusu. Placený jednorázový produkt nesplnit vydáváním generického nouzového textu za objednávku.

### P2 · Karta dne funguje, ale návratová hodnota je slabá

Karta pro 14. 10. byla Sedmička pentáklů, po reloadu stejná. `js/tarot-karta-dne.js:136` však pro všechny karty nabízí stejnou větu s vloženým krátkým významem: „všimněte si tématu… udělejte jednu malou věc“. Žádný konkrétní krok pro tuto kartu. Střídá se tykání a vykání; datum je podle zařízení, nikoli jednotně Europe/Prague.

Přijetí: pro každou ze 78 karet vlastní stručná otázka, pozorovatelný podnět a proveditelný krok. Ráno rychlý výsledek, večer dobrovolná reflexe „co se z toho ukázalo užitečné“. Neslibovat předpověď. Výsledek na desktopu je dlouhý kvůli sloupci pěti akcí a odběru; hlavní obsah a sekundární akce uspořádat úsporněji.

### P2 · Výsledky ještě nemají všude společnou grafiku

Static SVG náhrady neřeší všechny dynamické výstupy. `js/snar.js:76` vrací emoji z dat; `js/snar-inline.js:29` jím znovu přepíše symbol dne. Ověřeno Had/Medvěd. Kalkulačka po výpočtu stále ukazuje emoji na Kopírovat. `js/numerology.js:209` kreslí export do fialového gradientu. Staré instrukce nadpisových emoji v AI mohou vracet další nesourodé symboly.

Přijetí: společná sada SVG pro ovládání a štítky; kontextové symboly jako znamení či runy zachovat. Výsledek, profilová historie, export a e-mail mají používat stejné jméno nástroje a rozpoznatelnou navy/zlatou rodinu. Nelze z pouhé chybějící `atlas-page` třídy usoudit, že se stránka vykreslí starým stylem: denní karta má vlastní přepis a ručně byla navy.

### P2 · Tvrzení o schopnostech a zdraví potřebují sjednotit

`js/aura.js:108` uvádí telepatii/jasnovidnost jako silné stránky vypočtené aury. `biorytmy.html:88` i FAQ používají „prokazatelně pomáhá“ a doporučení odkládat riskantní rozhodnutí podle kritických dnů bez uvedeného podkladu. Snář a starý slovníkový obsah někdy přecházejí od možného symbolu k jistému významu.

Přijetí: symbolické pojmenování, možnost vlastní interpretace, žádná diagnostika ani záruka ochrany či schopností. Barevnost aury sama je obsahový význam, nemusí být násilně přebarvena na zlatou.

### P2 · Měření úspěchu a pojmenování produktu jsou ještě rozkročené

`server/config/growth-loop.js:25` hlavní metriku nazývá týdenní rituál → paid intent. To není totéž co zaplacený a užitečně doručený výklad. `server/payment.js:2227` zapisuje `one_time_reading_delivered` po přijetí poskytovatelem a mark-fulfilled; samostatný `relationshipDeliveryState` správně rozezná sent/delivered/bounced. Reporty se musí opírat o skutečný stav, nejen o název události.

Veřejný manifest a ceník mají jedno členství; staré interní plány jsou zachovány pro historické předplatitele a testy ověřují veřejnou nabídku. Samotná jejich přítomnost není chyba. Některé statické CTA ale stále říkají „Hvězdný Průvodce“, což lze zaměnit s chatovým nástrojem.

Webové výklady v tomto kandidátu používají `callClaude`/Anthropic. Vztahový výklad explicitně preferuje Sonnet 4.6 s možností env override. Není doloženo, že se webové výklady generují Lunou jen proto, že existuje OpenAI klíč nebo jsou Lunou řízeni pomocníci či social agent. Modely neměnit globálně bez odděleného porovnání kvality a nákladů.

## Funkční pokrytí podle rodin

„Testy“ níže znamenají aktuální mock regresi, „zdroj“ prověřenou implementaci. Zdroj není úspěšné skutečné použití v produkci. Společné vizuální vstupy a obrázky navíc zachycuje inventář.

| Funkce / rodina | Získaná hodnota a současná cesta | Ověření a další práce |
|---|---|---|
| Tarot ANO/NE | Okamžitá zdarma losovaná karta; verdikt a význam jsou statické, nejsou interpretací soukromé otázky modelem | Zdroj 78 karet; asset audit. Zjemnit jisté formulace a u výsledku vysvětlit mechanismus |
| Tarot karta dne | Bez účtu stejná karta během dne; zdarma obrázek, význam, možnost uložení a odběru | Ruční otočení/reload; assets test. Vlastní konkrétní rady a úspornější výsledek |
| Tarot 1/3/10 karet | Jeden nástroj se spread variantami, různé karty; rozšířené výklady v členství | Zdroj, oracle/access testy. Prázdné a gated stavy hodnotit stejně pečlivě jako hero |
| Tarot na lásku / zdarma | Vstupní obsah a volba cesty pro otázku, ne samostatná nová platební služba | Zdroj. Důležitá SEO cesta; zachovat URL i bezplatnou odpověď |
| Významy 78 karet | Katalog a praktické vysvětlení malované sady | Zdroj a assets. Rozdílná hloubka textů, nejdřív kvalitně dopracovat často otevřené |
| Vztahový výklad 149 Kč | Jedna otázka, tři různé trvale uložené karty, automatický e-mail, bez účtu | Checkout, schema, retry/webhook a provider delivery testy. Produkční product enabled. Kvalita nové placené AI ukázky netestována |
| Osobní mapa 299 Kč | Automatické PDF, 12 měsíců od objednávky, jedna situace, bez předplatného | PDF render/checkout/reconciliation testy; live price. Dopracovat trvalý výsledek a idempotenci |
| Členství 199 Kč/měsíc | Jeden veřejný placený plán, 7 dnů zdarma, členské nástroje a historie | Manifest, billing, access a checkout testy; live manifest. Není důkaz dlouhodobé poptávky |
| Denní horoskopy | Znamení a datum, schválený resolver před cache/fallbackem | Reviewed/guard/response testy. Nekontrolován živý import každého budoucího dne |
| Týdenní / měsíční horoskopy | Delší období jako členský výklad | Zdroj, access/response testy; kvalita všech nových generovaných textů není ověřena |
| Znamení / denní SEO stránky | Stálý výklad znamení a datované vstupy | Zdroj šablon a hlavní soubory, nikoli manuálních 900 URL |
| Natální karta / tranzity | Veřejný základ a členská interpretace ze serverového enginu | Engine/routes testy. Vyřešit pseudo-výsledek při chybě a 3D model |
| Partnerská shoda / synastrie | Serverové skóre a aspekty, volitelná hlubší interpretace | Server i frontend testy. Náhradní hash-skóre zrušit či oddělit |
| Astrokartografie | Výpočtové MC/IC aproximace a tematická doporučení míst | Engine/API testy. Přesné ASC/DSC linie nejsou implementovaným příslibem; zachovat viditelné omezení |
| Numerologie plná | Datum/jméno → životní cesta, osud, duše, osobnost, cykly | API i frontend testy. Sjednotit redukční metodu a export |
| Kalkulačka / partnerská numerologie | Jedno číslo a průvodce porovnáním dvou čísel; vztahová stránka není další výpočtový engine | Ruční výpočet, offline porovnání. Rozdíl 2/11 na stejném datu |
| Lunární fáze / kalendář | Datum → fáze Měsíce, kalendářová inspirace | Engine moon fixtures + zdroj klienta. Nejistou přesnost nepřevést na slib konkrétní události |
| Lunární rituály | Dobrovolné krátké cvičení, reflexe a uložení návratu | Zdroj; v tomto kole bez ručního průchodu všech rituálů. Není nutné vynucovat rituál před nákupem |
| Andělské karty | Bezplatná karta/symbol a hlubší členský výklad | Asset a oracle fallback testy. Pravdivá AI informace a zobrazení nouzového obsahu |
| Runy | Volba/los symbolu a navazující výklad | Zdroj a oracle fallback testy. Rune glyph je smysluplný obsah, ne nežádoucí emoji ikona |
| Křišťálová koule | Symbolická odpověď; host má serverový limit, free účet denní kvótu, člen vyšší přístup | Anon-gate/fallback testy. Nouzový text jasně označit; zachovat SEO vstup s vlastní poptávkou |
| Hvězdný průvodce | Chat propojuje poslední výklady a historii; free účet 3 zprávy denně | Mentor/access testy, zdroj. Přepsat nepravdivou personu, nezastírat použití uložené historie |
| Snář / osobní sen | Zdarma hledání 164 datových symbolů; osobní generování je další členská větev | Ruční Had filtr; oracle fallback testy. Dynamické emoji, deterministické tvrzení a AI persona |
| Minulý život | Symbolický archetypální příběh v členství | API/error testy; prompt výslovně netvrdí historický důkaz. Označit nouzový archetyp |
| Šamanské kolo | Totem a směry jako symbolická reflexe; hlubší část členská | API/error testy; prompt nevydává obsah za přesnou domorodou tradici |
| Aura | Lokální symbolická barevná klasifikace podle vstupů | Zdroj, bez samostatného end-to-end testu v tomto kole. Není měření pole ani diagnostika |
| Biorytmy | Lokální sinusy 23/28/33 dnů a graf | Zdroj; nejde o validovanou předpověď výkonu. Odstranit nepodložené zdravotní/plánovací autority |
| Čínský horoskop | Datum/rok a obsahová charakteristika | Zdroj a vstupní stránka. V tomto kole neověřeny hranice všech lunárních nových roků; nezaměňovat za prokázaný přesný kalendář |
| Testy / kvízy | Obsahové sebepoznávací kvízy a výsledky | Zdroj hubu, ne každý výsledek osobně. Označit zábavní/symbolickou povahu, žádná psychodiagnostika |
| Blog / slovník / jména | Informační a SEO knihovna | Zdroj hlavních hubů, obrázkové vstupy. Starší obsah a DB-prioritní generátor je třeba aktualizovat po rodinách, ne přepsat slepě |
| Přihlášení / registrace / reset | Účet pro historii a členství, ne podmínka jednorázové otázky | Auth/access testy; ručně login/register vzhled a toggle hesla. Skutečný reset e-mail nebyl odeslán |
| Profil / oblíbené / historie | Soukromý přehled uložených výkladů, nastavení a billing | User-readings/access testy; pouze model vizuální části, ne zákaznická session |
| Odběry / push / kontakt | Souhlas, pravidelný návrat a podpora | Produkční health hlásí jobs enabled, veřejné konfigurace a zdroj. Nebyla rozeslána newsletterová dávka ani support formulář |

## Kam se profilovat a proč

Datovaný GSC export 14. 9.–11. 10. 2026, získaný 13. 10., obsahuje 1 462 prokliků. Z toho tarot na lásku 293, ANO/NE 166 a karta dne 151: dohromady 610 prokliků (~42 % celku). S tarot hubem a třemi kartami 698 (~48 %). Mobil má 1 242 prokliků (~85 %). Zdrojem je `docs/organic-growth-luna6/gsc-monthly.md`; nejsou to unikátní lidé ani objednávky. Křišťálová koule má 92 a partnerská numerologie 65; není důvod je automaticky odstranit.

**Návrh informačního těžiště:**

1. **Dnes:** karta dne, její konkrétní otázka a smysluplný návrat. Rychlý mobile first výsledek.
2. **Co právě řeším:** tarotové otázky a vztahy; jasný bezplatný základ, volitelný výklad 149 Kč.
3. **Chci porozumět:** významy karet, praktické průvodce a horoskopy; ostatní nástroje v knihovně s popisem skutečné hodnoty.

Vztahový produkt 149 Kč je nejsrozumitelnější placená cesta a Pavel hlásil první prodej. Toto kolo nestáhlo nové objednávkové údaje, takže neprokazuje jeho konverzní poměr, marži ani Google původ nákupu. Mapu 299 Kč a členství zachovat, ale jejich růst řídit skutečnou užitečností a opakovaným použitím, ne větším počtem přepínačů a funkcí.

Pozicování může znít: **„Krásně zpracovaný tarot, který pomáhá položit lepší otázku a najít vlastní další krok.“** Vztahy jsou silný vstup, celá značka se nemusí omezit výhradně na partnerské problémy. Malované karty už dávají jednotný a rozpoznatelný důvod vrátit se; nepřidávat další generickou vesmírnou dekoraci bez významu.

## Doporučené pořadí další práce

1. Uzavřít P1 u PDF doručení, náhradních výpočtů a rozdílných čísel. Každý problém ověřit původním selhávajícím případem.
2. Sjednotit pravdivý hlas všech generovaných výkladů a jasně označit fallback. Zachovat současné modelové rozpočty.
3. Vytvořit konkrétní obsah všech 78 denních karet a sladit výsledek, obrázkový export a historii. Přednost před novou obrázkovou knihovnou.
4. Dokončit dynamické ikony a komponenty výsledků, teprve potom upravit váhu navigace podle navržených tří cest.
5. Vyhodnocovat zaplacené objednávky, providerem potvrzené doručení, zpětnou vazbu a návraty k výsledku. Paid intent, klik na tlačítko ani QA skóre nejsou výnos či užitek.

Nálezy nejsou opravené tím, že byly zapsány. Tato dávka dokončila pouze dříve rozpracované grafické detaily a audit; nové funkční změny ani nasazení se neprovedly.
