# Jednotné ikony — 14. října 2026

## Ověřený stav
Lokálně hotovo. Tato dávka nebyla nasazena na produkci. Základ kandidáta je místní SEO commit 9d1a87c4, po posledním produkčním základu 9782cab6. Náhled běží na http://127.0.0.1:3346/docs/ui-symbol-review-2026-10-14/overview.html.

## Výsledek
- 51 vlastních vektorových symbolů v jednom místním SVG sprite: jednotná linka, navy/zlatá paleta, stejné zobrazení napříč platformami. Žádný nový balíček ikon ani závislost na externím obrázkovém API.
- Kandidát obsahuje 329 použití nové sady ve změněných HTML a společné patičce: navigační karty, slovník, testy, snář, statické doplňky nástrojů, profil a neutrální stavové ikony. Dynamické upozornění, varování a zamčený stav jsou také SVG z téže sady.
- 914 barevných nebo chybějících faviconů sjednoceno na zlatou hvězdu. Zbylé existující souborové brandové favicony nejsou emoji. PWA / Apple ikona zůstává stávající zlatý brandový znak.
- Odstraněny nadbytečné dekorativní emoji před textem tlačítek a odkazů. Samotný význam textu a cíle odkazů jsou zachované. Malé štítky souvisejících odkazů ve slovníku používají SVG knihy.
- Opraveny zdroje generovaných stránek, slovníkový generátor a HTML šablony. Opakovaný kontrolní režim migrace hlásí změny 0 a nezmapované symboly 0.
- Sprite a favicon jsou v offline manifestu; minifikované CSS/JS sestaveny ze zdroje a historie 845 veřejných verzí zachována. Nová verze URL patičky zabrání prvnímu načtení jejích starých emoji z cache.

## Co se sjednocuje a co nese vlastní význam
Dekorativní odkazy mají nové SVG. Existující Lucide ovládací prvky a jejich přístupné popisky zůstávají. Skutečné tarotové ilustrace, západní astrologické a planetární znaky, runová data, skutečné fáze Měsíce, čínská zvířata, výběr nálady a odpovědi testů jsou funkční/obsahová data; nebyly přepsány jedním obecným obrázkem. Emoji v autorském obsahu nejsou inventář navigačních ikon. Širší inventář obsahuje inventory.md; jeho poznámky o čtyřech zbylých dekorativních prvcích jsou starší checkpoint, tyto čtyři prvky jsou již v konečné dávce převedené.

## Kontrola
- Mechanicky porovnáno 919 změněných HTML souborů (včetně společné komponenty a šablon) proti předchozímu commitu. title, H1, canonical, URL odkazů, data atributy a JSON-LD se shodují. Žádná chyba. Počet veřejných HTML v migračním průchodu je 917; nejde o počet indexovaných ani ručně otevřených stránek.
- XML sprite i faviconu validní, všech 51 ID existuje a všechny nové odkazy do sprite odpovídají definici.
- Ruční náhled: problematický blok horoskopu na 1280 a 390 px, slovníkové karty, vstup testů, nepřihlášený profil, patička a celá sada symbolů. Mobil horoskopu šířka 390 / scrollWidth 382, viditelný fokus. Čtečky přeskočí dekorativní SVG a čtou názvy odkazů.
- JS syntax a build prošly. Toasty vkládají pouze pevné lokální SVG konstanty; uživatelské texty stále používají textContent. Jednorázová kontrola musela odlišit JSON-LD placeholdery šablon od skutečného JSON a normalizovat konce řádků; následná kontrola prošla.
- Root sloučen po souborech při zachování starších změn. Root má již dříve odstraněný druhý duplicitní blok andělských odkazů; počet nových statických ikon se proti izolovanému kandidátu proto liší. Kořen nebyl plošně resetován ani commitován.

## Rozsah a otevřené poznatky
Kontrola se týká prezentace ikon a souvisejících zdrojů. Nejde o novou zkoušku výpočtů, plateb, přihlášení nebo automatického doručení; tyto logiky se neměnily. Lokální statický náhled nemá produkční API. Před vydáním potřebujeme povinné release kontroly a následné ověření veřejného nasazení.
Na vstupu testů je v izolovaném kandidátu dřívější stísněné záhlaví; není způsobené ikonami a je zapsané k samostatnému doladění rozložení. Ve slovníku jsou zároveň obsahová tvrzení o andělských číslech, která zaslouží další redakční aktualizaci; ikonová migrace je nepřepisovala. Není tvrzeno, že celý web je tímto kompletně přístupný nebo obsahově dokončený.

## Údržba
Nové ID přidat do img/icons/mh-symbols.svg a scripts/lib/ui-symbols.mjs. Dekorativní SVG musí mít aria-hidden a nesmí nahrazovat textové jméno ovládacího prvku. Symbol vybírat podle cíle či skutečného významu. Po regeneraci lze použít node scripts/unify-ui-symbols.mjs pro kontrolu a --write pro explicitní migraci; výchozí kontrola produktové soubory nemění. Skript nepracuje s docs, historií, .agents ani .git.

## Delegace
gpt-5.6-luna / medium: ohraničený read-only inventář a následná kontrola zdrojů a mapování; hlavní agent současně dokončoval SEO dávku a poté implementoval SVG. Hlavní agent samostatně rozšířil vyhledání dalších kontejnerů, provedl porovnání celého HTML diffu, ruční vizuální kontrolu a opravu cache. Číselná úspora nebyla měřena.
