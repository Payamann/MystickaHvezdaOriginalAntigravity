/**
 * tarot-ano-ne.js - Logika pro Tarot ANO/NE
 */
(function () {
    // Verdikt, vysvětlení (proč) a konkrétní další krok pro každou ze 78 karet.
    // Jména karet odpovídají klíčům v data/tarot-cards.json (obrázek, emoji).
    const CARD_VERDICTS = {
        'Blázen': {
            verdict: 'ano',
            proc: 'Blázen je karta čistého začátku – stojíš na prahu něčeho nového a ještě nic není pokažené. Karty ti říkají, že strach z neznáma tě brzdí víc než reálné riziko. Skoč do toho s otevřenýma očima.',
            krok: 'Udělej dnes jeden malý krok směrem k tomu novému, i kdyby to byl jen telefonát nebo zpráva.'
        },
        'Mág': {
            verdict: 'ano',
            proc: 'Mág znamená, že máš teď po ruce všechno, co k rozhodnutí potřebuješ – schopnosti, informace i vůli. Odpověď je ano, protože otálení už nic nepřidá, jen jednání.',
            krok: 'Sepiš si tři konkrétní kroky, kterými dnes proměníš záměr v akci.'
        },
        'Velekněžka': {
            verdict: 'nejasne',
            proc: 'Velekněžka ukazuje, že podstatná část odpovědi je zatím skrytá – buď ti chybí informace, nebo je ještě nechceš vidět. Vynucené rozhodnutí teď by bylo unáhlené.',
            krok: 'Dej si pauzu a všímej si snů nebo pocitů, které k otázce přicházejí příští tři dny.'
        },
        'Císařovna': {
            verdict: 'ano',
            proc: 'Císařovna nese hojnost a růst – energie kolem tvé otázky je plodná a podporující. Cokoliv teď zaseješ, má šanci se rozrůst.',
            krok: 'Investuj dnes trochu času nebo péče do věci, na kterou se ptáš, ať vidíš první výsledky.'
        },
        'Císař': {
            verdict: 'ano',
            proc: 'Císař je karta struktury a pevného rozhodnutí. Když otázku podložíš jasným plánem a hranicemi, výsledek bude stabilní. Odpověď je ano, ale s řádem, ne z rozmaru.',
            krok: 'Napiš si jasné pravidlo nebo termín, podle kterého se budeš v této věci řídit.'
        },
        'Velekněz': {
            verdict: 'nejasne',
            proc: 'Velekněz radí ověřit si věc u někoho zkušenějšího nebo podle osvědčeného postupu, než uděláš vlastní závěr. Sám na to teď nemáš celý obrázek.',
            krok: 'Zeptej se někoho, komu věříš a kdo má s podobnou situací zkušenost.'
        },
        'Milenci': {
            verdict: 'ano',
            proc: 'Milenci mluví o souznění a volbě srdce, která odpovídá tvým hodnotám. Když je tvá otázka o vztahu nebo důležitém rozhodnutí, karta ukazuje na ano skrz upřímnost k sobě.',
            krok: 'Pojmenuj nahlas nebo písemně, co v této volbě opravdu chceš, bez ohledu na to, co čekají ostatní.'
        },
        'Vůz': {
            verdict: 'ano',
            proc: 'Vůz je karta vítězství vůlí a soustředěním. Máš teď dost hybné síly, aby ses dostal tam, kam potřebuješ, pokud udržíš směr.',
            krok: 'Odstraň dnes jednu rozptylující věc, která tě táhne mimo tvůj cíl.'
        },
        'Síla': {
            verdict: 'ano',
            proc: 'Síla neznamená tlačit silou, ale klidnou vnitřní jistotu, že to zvládneš. Odpověď je ano, protože máš trpělivost a odvahu, které tahle situace potřebuje.',
            krok: 'Než budeš jednat, jednou se zhluboka nadechni a jednej z klidu, ne ze strachu.'
        },
        'Poustevník': {
            verdict: 'nejasne',
            proc: 'Poustevník ukazuje, že odpověď teď nenajdeš venku u druhých lidí, ale v tichu sám u sebe. Otázka možná ještě nedozrála na jasné rozhodnutí.',
            krok: 'Vyhraď si dnes večer dvacet minut o samotě jen s touhle otázkou, bez telefonu.'
        },
        'Kolo štěstí': {
            verdict: 'ano',
            proc: 'Kolo štěstí signalizuje příznivý obrat, který právě teď nastává. Okolnosti se posouvají ve tvůj prospěch, i když to tak zatím nemusí vypadat.',
            krok: 'Buď připravený jednat rychle, až se objeví první náznak příležitosti.'
        },
        'Spravedlnost': {
            verdict: 'nejasne',
            proc: 'Spravedlnost váží fakta a důsledky – odpověď závisí na tom, jak férově se ke věci postavíš. Karta neradí ano ani ne, dokud nezvážíš obě strany.',
            krok: 'Sepiš si klady a zápory tak upřímně, jako by to posuzoval někdo jiný než ty.'
        },
        'Viselec': {
            verdict: 'ne',
            proc: 'Viselec ukazuje na pozastavení, ne na akci. Teď není čas tlačit věc dopředu – potřebuješ vidět situaci z jiného úhlu, než uděláš krok.',
            krok: 'Odlož rozhodnutí o pár dní a zkus se na otázku podívat očima někoho jiného.'
        },
        'Smrt': {
            verdict: 'ne',
            proc: 'Smrt neznamená konec všeho, ale konec této konkrétní podoby věci. Ne v té formě, v jaké se na to ptáš – něco se musí nejdřív uzavřít.',
            krok: 'Pojmenuj, co přesně už dosloužilo, a nech to jít, než začneš stavět nové.'
        },
        'Mírnost': {
            verdict: 'nejasne',
            proc: 'Mírnost žádá trpělivost a postupné slaďování, ne rychlé rozhodnutí. Výsledek se teprve vaří a potřebuje čas na správný poměr.',
            krok: 'Udělej jen malý krok směrem k rovnováze a zbytek nech dozrát.'
        },
        'Ďábel': {
            verdict: 'ne',
            proc: 'Ďábel upozorňuje na past, závislost nebo situaci, která tě svazuje víc, než si přiznáváš. To, co vypadá jako lákavá zkratka, tě může stát svobodu.',
            krok: 'Pojmenuj si, co konkrétně tě k této volbě táhne navzdory rozumu, a zeptej se proč.'
        },
        'Věž': {
            verdict: 'ne',
            proc: 'Věž znamená náhlý otřes – stavba, na které by tvá otázka teď stála, nemá pevné základy. Není to trest, je to nutné odhalení pravdy.',
            krok: 'Zjisti, kde je ve tvém plánu nejslabší místo, a oprav ho dřív, než půjdeš dál.'
        },
        'Hvězda': {
            verdict: 'ano',
            proc: 'Hvězda přináší naději a jemné uzdravení po těžším období. Odpověď je ano, protože se otevírá prostor pro to, aby se věci znovu daly do pohybu správným směrem.',
            krok: 'Napiš si, čemu právě teď věříš, a nech tu naději vést tvůj další krok.'
        },
        'Luna': {
            verdict: 'nejasne',
            proc: 'Luna zahaluje situaci mlhou – něco není takové, jak se zdá, nebo ti chybí jasné informace. Rozhodnutí udělané teď by stálo na domněnkách.',
            krok: 'Než se rozhodneš, ověř si fakta, na kterých teď stavíš svůj dojem.'
        },
        'Slunce': {
            verdict: 'ano',
            proc: 'Slunce je jedna z nejjasnějších karet v celém tarotu – úspěch, radost a otevřená cesta. Odpověď je jasné ano bez skrytých podmínek.',
            krok: 'Jednej otevřeně a bez váhání, energie je teď na tvé straně.'
        },
        'Soud': {
            verdict: 'ano',
            proc: 'Soud znamená probuzení a jasné rozhodnutí po zvážení všeho, co se stalo. Voláš sám sebe k odpovědnosti a odpověď na tvou otázku je ano.',
            krok: 'Udělej rozhodnutí, které jsi už vnitřně poznal, a přestaň ho odkládat.'
        },
        'Svět': {
            verdict: 'ano',
            proc: 'Svět je karta dokončení a naplnění – kruh se uzavírá úspěšně. Odpověď je ano, protože jsi udělal potřebnou práci a teď přichází odměna.',
            krok: 'Dovol si oslavit i malý úspěch, než se pustíš do další kapitoly.'
        },

        'Eso holí': {
            verdict: 'ano',
            proc: 'Eso holí je čistá jiskra nové energie a nadšení. Máš teď impuls, který stojí za to následovat – odpověď je ano.',
            krok: 'Začni ještě dnes, dokud je ta prvotní chuť do věci nejsilnější.'
        },
        'Dvojka holí': {
            verdict: 'nejasne',
            proc: 'Dvojka holí ukazuje na fázi plánování, ne konečného rozhodnutí. Díváš se na možnosti, ale ještě sis nevybral směr.',
            krok: 'Zúž si volbu na dvě konkrétní varianty a porovnej je vedle sebe.'
        },
        'Trojka holí': {
            verdict: 'nejasne',
            proc: 'Trojka holí ukazuje, že první krok je hotový, ale výsledek je ještě na cestě a nedá se uspěchat. Odpověď se ukáže, až dorazí to, na co teď čekáš.',
            krok: 'Podívej se dál za nejbližší krok a sleduj, co se z dálky teprve blíží.'
        },
        'Čtyřka holí': {
            verdict: 'ano',
            proc: 'Čtyřka holí je karta oslavy a stabilního základu. Máš pevnou půdu pod nohama, na které se dá stavět dál – odpověď je ano.',
            krok: 'Udělej si čas oslavit dosavadní pokrok s lidmi, kteří tě podporují.'
        },
        'Pětka holí': {
            verdict: 'ne',
            proc: 'Pětka holí ukazuje na tření a soupeření, kde nikdo pořádně nevyhrává. Teď to není hladká cesta a stojí za to počkat, až se prach usadí.',
            krok: 'Zjisti, kdo jsou skuteční spojenci v této věci, než uděláš další krok.'
        },
        'Šestka holí': {
            verdict: 'ano',
            proc: 'Šestka holí je jasné vítězství a uznání za odvedenou práci. Odpověď je ano, výsledek jde ve tvůj prospěch.',
            krok: 'Nahlas si přiznej svůj úspěch a použij ho jako odrazový můstek k dalšímu kroku.'
        },
        'Sedmička holí': {
            verdict: 'ne',
            proc: 'Sedmička holí znamená bránit pozici pod tlakem, ne získávat novou půdu. Teď je to spíš o obraně než o jasném postupu vpřed.',
            krok: 'Ujasni si, co je pro tebe v této věci nezpochybnitelné, a to hájuj jako první.'
        },
        'Osmička holí': {
            verdict: 'ne',
            proc: 'Osmička holí ukazuje na rychlý pohyb, který ještě nemá jasný cíl. Věci letí příliš rychle na to, aby šlo teď s jistotou říct ano.',
            krok: 'Než uděláš krok, na chvíli zpomal a ověř si, kam vlastně míříš.'
        },
        'Devítka holí': {
            verdict: 'ne',
            proc: 'Devítka holí je karta únavy a obezřetnosti po dlouhém boji. Nemáš teď v záloze dost sil na další velké rozhodnutí bez odpočinku.',
            krok: 'Dopřej si den na nabrání sil, než se do věci znovu pustíš.'
        },
        'Desítka holí': {
            verdict: 'ne',
            proc: 'Desítka holí ukazuje na přetížení – neseš víc, než je zdravé. Přidat další závazek teď by tě mohlo zlomit, ne posílit.',
            krok: 'Vyber jednu věc, kterou můžeš předat dál nebo odložit, než přijmeš něco nového.'
        },
        'Páže holí': {
            verdict: 'nejasne',
            proc: 'Páže holí přináší nadšenou zprávu nebo nápad, který je ale ještě nezralý. Je v tom potenciál, ne ještě jistota.',
            krok: 'Ověř si nový nápad na malém příkladu, než do něj vložíš víc energie.'
        },
        'Rytíř holí': {
            verdict: 'ano',
            proc: 'Rytíř holí je odvaha a chuť do dobrodružství. Když se ptáš, jestli jednat, odpověď je ano – váhání by tě teď stálo víc než odvaha.',
            krok: 'Udělej první odvážný krok dřív, než ti to rozum rozmluví.'
        },
        'Královna holí': {
            verdict: 'ano',
            proc: 'Královna holí je sebejistota, která přitahuje správné lidi a příležitosti. Odpověď je ano, protože věříš si přesně tolik, kolik je teď potřeba.',
            krok: 'Jednej dnes s jistotou, i kdyby to znamenalo být viditelný.'
        },
        'Král holí': {
            verdict: 'ne',
            proc: 'Král holí ve vypjaté podobě je netrpělivost a přílišná dominance, která teď spíš škodí. Odpověď je ne, dokud vedeš situaci silou místo přehledu.',
            krok: 'Ustup na chvíli z role vůdce a nech situaci projevit se bez tvého tlaku.'
        },

        'Eso pohárů': {
            verdict: 'ano',
            proc: 'Eso pohárů je nový příliv citu, lásky nebo hlubokého spojení. Srdce se otevírá a odpověď je ano.',
            krok: 'Dovol si dnes otevřeně projevit, co k té věci nebo osobě cítíš.'
        },
        'Dvojka pohárů': {
            verdict: 'ano',
            proc: 'Dvojka pohárů je vzájemné souznění – oba směry se potkávají. Odpověď je ano, protože je tu skutečné spojení, ne jednostranná snaha.',
            krok: 'Otevři upřímný rozhovor s druhou stranou o tom, co oba chcete.'
        },
        'Trojka pohárů': {
            verdict: 'ano',
            proc: 'Trojka pohárů znamená oslavu, přátelství a společnou radost. Odpověď je ano – tahle věc má oporu okolo tebe.',
            krok: 'Zapoj do rozhodnutí lidi, kteří ti fandí, ať sdílíš radost i podporu.'
        },
        'Čtyřka pohárů': {
            verdict: 'ne',
            proc: 'Čtyřka pohárů ukazuje na apatii – něco hodnotného ti stojí přímo před nosem, ale teď to nevidíš nebo o to nestojíš. Odpověď je spíš ne, dokud se neotevřeš.',
            krok: 'Podívej se ještě jednou na nabídku, kterou jsi možná automaticky odmítl.'
        },
        'Pětka pohárů': {
            verdict: 'ne',
            proc: 'Pětka pohárů je karta ztráty a zármutku, která zatím drží pozornost na tom, co se nepovedlo. Odpověď je ne, dokud si ten smutek nedovolíš procítit.',
            krok: 'Všimni si i toho, co ti přesto zůstalo, a odtud pokračuj dál.'
        },
        'Šestka pohárů': {
            verdict: 'nejasne',
            proc: 'Šestka pohárů táhne pozornost k minulosti a vzpomínkám místo k jasné budoucnosti. Odpověď zatím visí mezi tím, co bylo, a tím, co má přijít.',
            krok: 'Zeptej se sám sebe, jestli tuhle volbu děláš z nostalgie, nebo z toho, co dnes opravdu chceš.'
        },
        'Sedmička pohárů': {
            verdict: 'nejasne',
            proc: 'Sedmička pohárů je záplava možností a iluzí, ze kterých je těžké vybrat tu skutečnou. Rozhodnutí teď by mohlo stát na klamu.',
            krok: 'Vyřaď fantazie a napiš si jen možnosti, které jsou reálně dosažitelné.'
        },
        'Osmička pohárů': {
            verdict: 'ne',
            proc: 'Osmička pohárů znamená odejít od něčeho, co už nenaplňuje, i když to bylo cenné. Odpověď je ne – tahle cesta tě už netáhne správným směrem.',
            krok: 'Dovol si přiznat, že hledáš něco jiného, a udělej první krok pryč.'
        },
        'Devítka pohárů': {
            verdict: 'nejasne',
            proc: 'Devítka pohárů bývá karta spokojenosti, ale ptej se, jestli je to spokojenost z podstaty věci, nebo jen z povrchu. Odpověď závisí na tom, co si opravdu přeješ.',
            krok: 'Řekni nahlas, co konkrétně si přeješ, a ověř si, že to není jen dojem chvíle.'
        },
        'Desítka pohárů': {
            verdict: 'ano',
            proc: 'Desítka pohárů je rodinné štěstí a hluboká harmonie. Odpověď je ano, protože tahle cesta vede k trvalé spokojenosti, ne jen k dočasné radosti.',
            krok: 'Sdílej svůj záměr s lidmi nejbližšími, ať v tom nejsi sám.'
        },
        'Páže pohárů': {
            verdict: 'nejasne',
            proc: 'Páže pohárů přináší citlivou zprávu, která je ještě křehká a nezralá. Je v ní naděje, ale potřebuje čas.',
            krok: 'Nech nápad nebo nabídku ještě pár dní uležet, než se rozhodneš.'
        },
        'Rytíř pohárů': {
            verdict: 'nejasne',
            proc: 'Rytíř pohárů přináší krásnou nabídku, ale ta může být spíš idealizovaná představa než pevný slib. Odpověď záleží na tom, jestli za citem stojí i čin.',
            krok: 'Sleduj, jestli slova doprovázejí i skutky, než se rozhodneš věřit naplno.'
        },
        'Královna pohárů': {
            verdict: 'ano',
            proc: 'Královna pohárů je hluboká empatie a intuice, která tě teď dobře vede. Odpověď je ano, tvůj vnitřní pocit je spolehlivý.',
            krok: 'Důvěřuj prvnímu pocitu, který k této otázce máš, a jednej podle něj.'
        },
        'Král pohárů': {
            verdict: 'ano',
            proc: 'Král pohárů je emoční rovnováha – rozhoduješ se srdcem, ale s rozumem po boku. Odpověď je ano, zvládneš to klidně a moudře.',
            krok: 'Přistup k rozhodnutí klidně, bez unáhlené reakce na silné emoce.'
        },

        'Eso mečů': {
            verdict: 'ano',
            proc: 'Eso mečů přináší náhlou jasnost a pravdu, která rozetne pochybnosti. Odpověď je ano – teď vidíš situaci jasněji než kdy dřív.',
            krok: 'Pojmenuj pravdu, kterou jsi možná dosud odkládal, a jednej podle ní.'
        },
        'Dvojka mečů': {
            verdict: 'nejasne',
            proc: 'Dvojka mečů je patová situace, kdy zavíráš oči před rozhodnutím, aby ses mu vyhnul. Odpověď zůstává nejasná, dokud se nepodíváš pravdě do očí.',
            krok: 'Sundej si pomyslnou pásku z očí a podívej se na obě možnosti bez obav.'
        },
        'Trojka mečů': {
            verdict: 'ne',
            proc: 'Trojka mečů je bolest a zklamání, které tahle cesta zatím přináší. Odpověď je ne, protože srdce potřebuje nejdřív zahojit to, co bolí.',
            krok: 'Dovol si procítit zklamání, než uděláš další rozhodnutí ovlivněné bolestí.'
        },
        'Čtyřka mečů': {
            verdict: 'nejasne',
            proc: 'Čtyřka mečů žádá odpočinek před dalším krokem. Teprve po regeneraci uvidíš odpověď jasně – teď ještě ne.',
            krok: 'Dej si vědomou pauzu od tématu, i kdyby jen na jeden den.'
        },
        'Pětka mečů': {
            verdict: 'ne',
            proc: 'Pětka mečů ukazuje na konflikt, kde i vítězství bolí. Odpověď je ne – cena za tuhle cestu by byla vyšší než zisk.',
            krok: 'Zvaž, jestli se vyplatí trvat na svém, nebo je lepší nechat to být.'
        },
        'Šestka mečů': {
            verdict: 'ano',
            proc: 'Šestka mečů je přechod k mírnějším vodám po bouři. Odpověď je ano – směřuješ pryč od potíží k lepší situaci.',
            krok: 'Udělej krok pryč od toho, co tě zatěžovalo, i kdyby to bylo pomalé.'
        },
        'Sedmička mečů': {
            verdict: 'ne',
            proc: 'Sedmička mečů varuje před klamem nebo neupřímným přístupem – buď tvým, nebo od někoho jiného. Odpověď je ne, dokud se karty nevyloží na stůl.',
            krok: 'Zkontroluj si fakta a ujisti se, že nikdo (ani ty sám) nehraje nečestnou hru.'
        },
        'Osmička mečů': {
            verdict: 'ne',
            proc: 'Osmička mečů je past vlastní mysli – cítíš se svázaný, i když východisko existuje. Odpověď je ne, dokud věříš, že nemáš na výběr.',
            krok: 'Napiš si tři možnosti, které máš, i když se teď žádná nezdá snadná.'
        },
        'Devítka mečů': {
            verdict: 'ne',
            proc: 'Devítka mečů je úzkost a starosti, které v noci rostou víc, než odpovídá realitě. Odpověď je ne, dokud rozhoduješ ze strachu.',
            krok: 'Sdílej svoje obavy s někým, komu věříš, ať je vidíš v reálné velikosti.'
        },
        'Desítka mečů': {
            verdict: 'ne',
            proc: 'Desítka mečů je definitivní konec jedné kapitoly. Odpověď je ne v téhle podobě – něco tady musí skončit, aby mohlo začít nové.',
            krok: 'Přiznej si, že tahle etapa je uzavřená, a udělej první krok k něčemu novému.'
        },
        'Páže mečů': {
            verdict: 'nejasne',
            proc: 'Páže mečů radí bdělost a sběr informací dřív, než uděláš závěr. Odpověď zatím není jistá, protože nemáš celý obrázek.',
            krok: 'Zjisti si víc podrobností, než se rozhodneš, i kdyby to znamenalo položit nepříjemnou otázku.'
        },
        'Rytíř mečů': {
            verdict: 'ano',
            proc: 'Rytíř mečů je rychlé a rozhodné jednání, které teď dává výsledky. Odpověď je ano, pokud jednáš s jasnou hlavou, ne z popudu.',
            krok: 'Jednej rychle, ale nejdřív si ověř, že tvůj plán stojí na faktech.'
        },
        'Královna mečů': {
            verdict: 'ano',
            proc: 'Královna mečů je jasné, nezávislé myšlení bez sebeklamu. Odpověď je ano, pokud se rozhodneš rozumem a bez emočního zabarvení.',
            krok: 'Podívej se na situaci s odstupem, jako bys radil kamarádovi, ne sobě.'
        },
        'Král mečů': {
            verdict: 'nejasne',
            proc: 'Král mečů žádá chladný rozum tam, kde teď možná převažují emoce. Odpověď se ukáže, až oddělíš fakta od toho, co si jen myslíš nebo cítíš.',
            krok: 'Sepiš si jen ověřená fakta bez emočního komentáře a rozhodni se podle nich.'
        },

        'Eso pentáklů': {
            verdict: 'ano',
            proc: 'Eso pentáklů je nová hmotná příležitost s reálným potenciálem růstu. Odpověď je ano – základ pro úspěch je teď položený.',
            krok: 'Udělej první praktický krok k této příležitosti, i malý.'
        },
        'Dvojka pentáklů': {
            verdict: 'nejasne',
            proc: 'Dvojka pentáklů je žonglování mezi víc prioritami, kde rovnováha zatím kolísá. Odpověď závisí na tom, jestli uneseš další závazek.',
            krok: 'Zjisti, kolik času a energie máš teď reálně k dispozici, než řekneš ano.'
        },
        'Trojka pentáklů': {
            verdict: 'nejasne',
            proc: 'Trojka pentáklů ukazuje, že výsledek závisí na spolupráci s dalšími lidmi, ne jen na tobě. Bez shody všech stran zůstává odpověď otevřená.',
            krok: 'Domluv se s lidmi kolem sebe, kdo co udělá, než budeš počítat s hotovým výsledkem.'
        },
        'Čtyřka pentáklů': {
            verdict: 'nejasne',
            proc: 'Čtyřka pentáklů ukazuje na pevné sevření a strach něco pustit. Odpověď je nejasná, protože lpění může bránit i dobré změně.',
            krok: 'Zeptej se sám sebe, čeho se v této věci nejvíc bojíš pustit.'
        },
        'Pětka pentáklů': {
            verdict: 'ne',
            proc: 'Pětka pentáklů je pocit nedostatku a osamění v těžké chvíli. Odpověď je ne, dokud se necítíš dost podpořený na to jít dál.',
            krok: 'Vyhledej pomoc nebo radu, i když je těžké o ni požádat.'
        },
        'Šestka pentáklů': {
            verdict: 'ano',
            proc: 'Šestka pentáklů je štědrost a spravedlivá výměna – pomoc přichází ve správnou chvíli. Odpověď je ano, podpora je na dosah.',
            krok: 'Popros o pomoc nebo ji naopak nabídni, výměna teď funguje oběma směry.'
        },
        'Sedmička pentáklů': {
            verdict: 'nejasne',
            proc: 'Sedmička pentáklů je čekání na výsledek dlouhodobé práce, která ještě nedozrála. Odpověď se ukáže, až uplyne potřebný čas.',
            krok: 'Zhodnoť, jestli dosavadní úsilí jde správným směrem, a případně uprav postup.'
        },
        'Osmička pentáklů': {
            verdict: 'ano',
            proc: 'Osmička pentáklů je poctivá dřina, která se zúročuje. Odpověď je ano, pokud jsi ochotný do toho vložit soustředěnou práci.',
            krok: 'Věnuj této věci dnes soustředěný čas, ne jen roztříštěnou pozornost.'
        },
        'Devítka pentáklů': {
            verdict: 'ano',
            proc: 'Devítka pentáklů je nezávislost postavená na vlastní práci. Odpověď je ano, máš na to sám, bez závislosti na druhých.',
            krok: 'Dopřej si uznat vlastní úsilí a pokračuj ve věci vlastním tempem.'
        },
        'Desítka pentáklů': {
            verdict: 'ano',
            proc: 'Desítka pentáklů je dlouhodobá jistota a stabilita, která přesahuje jednu chvíli. Odpověď je ano, tahle cesta má trvalý základ.',
            krok: 'Mysli při rozhodování na dlouhodobý dopad, ne jen na okamžitý efekt.'
        },
        'Páže pentáklů': {
            verdict: 'ano',
            proc: 'Páže pentáklů je nová šance k učení s praktickým výsledkem. Odpověď je ano, tahle příležitost stojí za to prozkoumat.',
            krok: 'Začni s malým, konkrétním krokem k naučení nebo vyzkoušení nové věci.'
        },
        'Rytíř pentáklů': {
            verdict: 'ne',
            proc: 'Rytíř pentáklů je opatrný a pomalý postup, který teď brzdí spíš než pomáhá. Odpověď je ne, pokud čekáš rychlý výsledek – tahle energie spěch nezná.',
            krok: 'Přijmi, že tahle věc potřebuje víc času, a naplánuj si dlouhodobější tempo.'
        },
        'Královna pentáklů': {
            verdict: 'ano',
            proc: 'Královna pentáklů je praktická péče, která spojuje pohodlí s rozumem. Odpověď je ano, tahle cesta tě reálně podrží.',
            krok: 'Postarej se dnes o praktickou stránku věci, na kterou ses ptal.'
        },
        'Král pentáklů': {
            verdict: 'ano',
            proc: 'Král pentáklů je hmotný úspěch postavený na zkušenosti a trpělivosti. Odpověď je ano, máš na to zdroje i moudrost.',
            krok: 'Jednej s rozvahou zkušeného člověka, ne v spěchu za rychlým výsledkem.'
        }
    };

    const VERDICT_META = {
        ano: { label: 'ANO', emoji: '✅', class: 'ano' },
        ne: { label: 'NE', emoji: '🚨', class: 'ne' },
        nejasne: { label: 'NEJASNÉ', emoji: '🔮', class: 'mozna' }
    };

    const CARD_DATA_URL = 'data/tarot-cards.json';
    const FALLBACK_CARD_IMAGE = 'img/tarot/tarot_card_back_straight_v2.webp';

    let cardPool = [];
    let cardDataLoaded = false;
    let used = false;
    let lastResult = null;
    let savedReadingId = null;
    let firstValueTracked = false;

    const TAROT_YES_NO_FEATURE = 'tarot_multi_card';
    const TAROT_YES_NO_PLAN_ID = 'pruvodce';
    const TAROT_YES_NO_RESULT_SOURCE = 'tarot_yes_no_result';
    const TAROT_YES_NO_TOOL = 'tarot_yes_no';
    const PENDING_READING_STORAGE_KEY = 'mh_pending_reading';

    // Karty, u kterých v CARD_VERDICTS chybí odpovídající záznam v data/tarot-cards.json,
    // se prostě přeskočí z losovacího poolu (obranné programování pro budoucí změny datasetu).
    async function loadCardPool() {
        if (cardDataLoaded) return cardPool;

        try {
            const response = await fetch(CARD_DATA_URL, { credentials: 'same-origin' });
            if (!response.ok) throw new Error(`Tarot data failed: ${response.status}`);
            const data = await response.json();

            cardPool = Object.entries(CARD_VERDICTS)
                .filter(([name]) => Boolean(data[name]))
                .map(([name, info]) => ({
                    name,
                    verdict: info.verdict,
                    proc: info.proc,
                    krok: info.krok,
                    image: data[name].image || FALLBACK_CARD_IMAGE,
                    emoji: data[name].emoji || '🃏'
                }));
        } catch (error) {
            console.warn('[Tarot ANO/NE] Nepodařilo se načíst kartotéku, používám nouzový výběr:', error.message);
            cardPool = [];
        }

        cardDataLoaded = true;
        return cardPool;
    }

    function buildTarotYesNoUpgradeUrl(source = TAROT_YES_NO_RESULT_SOURCE) {
        const pricingUrl = new URL('/cenik.html', window.location.origin);
        pricingUrl.searchParams.set('plan', TAROT_YES_NO_PLAN_ID);
        pricingUrl.searchParams.set('source', source);
        pricingUrl.searchParams.set('feature', TAROT_YES_NO_FEATURE);
        pricingUrl.searchParams.set('entry_source', source);
        pricingUrl.searchParams.set('entry_feature', TAROT_YES_NO_FEATURE);
        return `${pricingUrl.pathname}${pricingUrl.search}`;
    }

    async function trackTarotYesNoFunnelEvent(eventName, source, metadata = {}, feature = TAROT_YES_NO_FEATURE, planId = TAROT_YES_NO_PLAN_ID) {
        try {
            const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
            if (!csrfToken) return;

            const payload = {
                eventName,
                source,
                feature,
                metadata: {
                    path: window.location.pathname,
                    ...metadata
                }
            };
            if (planId) {
                payload.planId = planId;
            }

            await fetch(`${window.API_CONFIG?.BASE_URL || '/api'}/payment/funnel-event`, {
                method: 'POST',
                credentials: 'include',
                keepalive: true,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.warn('[Tarot ANO/NE funnel] Could not record event:', error.message);
        }
    }

    function startTarotYesNoUpgradeFlow(source = TAROT_YES_NO_RESULT_SOURCE) {
        window.MH_ANALYTICS?.trackCTA?.(source, {
            plan_id: TAROT_YES_NO_PLAN_ID,
            feature: TAROT_YES_NO_FEATURE
        });

        void trackTarotYesNoFunnelEvent('paywall_cta_clicked', source, {
            destination: '/cenik.html'
        });

        if (window.Auth?.startPlanCheckout) {
            window.Auth.startPlanCheckout(TAROT_YES_NO_PLAN_ID, {
                source,
                feature: TAROT_YES_NO_FEATURE,
                metadata: {
                    entry_source: source,
                    entry_feature: TAROT_YES_NO_FEATURE
                },
                redirect: '/cenik.html',
                authMode: window.Auth?.isLoggedIn?.() ? 'login' : 'register'
            });
            return;
        }

        window.location.href = buildTarotYesNoUpgradeUrl(source);
    }

    function setBlockVisible(element, visible) {
        if (!element) return;
        element.hidden = !visible;
        element.classList.toggle('mh-block-visible', visible);
    }

    function getVisibleCookieBannerOffset() {
        const banner = document.getElementById('cookie-banner');
        if (!banner || banner.hidden || !banner.classList.contains('visible')) return 0;

        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const rect = banner.getBoundingClientRect();
        // Lišta najíždí translateY přechodem (0.5s) — rect.top je během
        // animace ještě dole a rezerva by vyšla nulová. Výška se transformem
        // nemění, takže rezervu počítej z konečné klidové polohy lišty.
        const restingTop = viewportHeight - 16 - rect.height;
        return Math.max(0, viewportHeight - Math.min(rect.top, restingTop) + 16);
    }

    function scrollTarotResultIntoView(panel, behavior = 'smooth') {
        if (!panel) return;

        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const reservedBottom = getVisibleCookieBannerOffset();
        const availableHeight = Math.max(320, viewportHeight - reservedBottom);
        const rect = panel.getBoundingClientRect();
        let targetTop = window.scrollY + rect.top - Math.max(86, (availableHeight - rect.height) / 2);
        const resetButton = document.getElementById('btn-reset');

        if (reservedBottom && resetButton) {
            const bannerTop = viewportHeight - reservedBottom + 16;
            const resetRect = resetButton.getBoundingClientRect();
            const predictedResetBottom = resetRect.bottom - (targetTop - window.scrollY);
            const overlap = predictedResetBottom - (bannerTop - 8);
            if (overlap > 0) {
                targetTop += overlap;
            }
        }

        window.scrollTo({
            top: Math.max(0, targetTop),
            behavior
        });
    }

    function getResultMetadata(answerKey, ans, question) {
        return {
            answer_key: answerKey,
            answer_label: ans.label,
            card_id: ans.cardId,
            card_name: ans.cardName,
            has_question: Boolean(question),
            question_length: Math.min((question || '').length, 200)
        };
    }

    function trackTarotYesNoEvent(eventName, metadata = {}) {
        window.MH_ANALYTICS?.trackEvent?.(eventName, {
            source: TAROT_YES_NO_RESULT_SOURCE,
            feature: TAROT_YES_NO_TOOL,
            seo_cluster: 'tarot',
            seo_page_type: 'free_tool',
            ...metadata
        });
    }

    function buildTarotYesNoReadingData(result = lastResult) {
        if (!result) return null;

        return {
            tool: TAROT_YES_NO_TOOL,
            source: TAROT_YES_NO_RESULT_SOURCE,
            question: result.question,
            answer: `${result.cardName} — ${result.label}: ${result.text}`,
            result_label: result.label,
            result_key: result.answerKey,
            result_text: result.text,
            card_id: result.cardId,
            card_name: result.cardName,
            saved_at: new Date().toISOString()
        };
    }

    function storePendingTarotYesNoReading(result = lastResult) {
        const readingData = buildTarotYesNoReadingData(result);
        if (!readingData) return false;

        try {
            localStorage.setItem(PENDING_READING_STORAGE_KEY, JSON.stringify({
                type: 'tarot',
                data: readingData,
                source: 'tarot_yes_no_save_journal',
                feature: TAROT_YES_NO_TOOL,
                createdAt: Date.now()
            }));
            return true;
        } catch (error) {
            console.warn('[Tarot ANO/NE] Could not store pending reading:', error.message);
            return false;
        }
    }

    async function postTarotYesNoReading(result = lastResult) {
        const readingData = buildTarotYesNoReadingData(result);
        if (!readingData) throw new Error('Missing tarot result');

        const headers = { 'Content-Type': 'application/json' };
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

        const response = await fetch(`${window.API_CONFIG?.BASE_URL || '/api'}/user/readings`, {
            method: 'POST',
            credentials: 'include',
            headers,
            body: JSON.stringify({
                type: 'tarot',
                data: readingData
            })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.success) {
            throw new Error(payload?.error || 'Reading save failed');
        }

        return payload;
    }

    async function saveTarotYesNoReading() {
        const button = document.getElementById('btn-save-reading');
        if (!lastResult || !button) return;

        const metadata = {
            ...getResultMetadata(lastResult.answerKey, lastResult, lastResult.question),
            save_target: 'profile_journal'
        };

        trackTarotYesNoEvent('save_click', metadata);
        await trackTarotYesNoFunnelEvent('reading_save_clicked', 'tarot_yes_no_save_journal', metadata, TAROT_YES_NO_TOOL, null);

        if (savedReadingId) {
            window.Auth?.showToast?.('Už uloženo', 'Tenhle výklad už je v deníku.', 'success');
            return;
        }

        if (!window.Auth?.isLoggedIn?.()) {
            storePendingTarotYesNoReading(lastResult);
            trackTarotYesNoEvent('login_click', {
                ...metadata,
                auth_mode: 'register',
                reason: 'save_reading'
            });
            window.location.href = 'prihlaseni.html?mode=register&source=tarot_yes_no_save_journal&feature=tarot_yes_no&redirect=/profil.html';
            return;
        }

        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Ukládám...';

        try {
            const payload = await postTarotYesNoReading(lastResult);
            savedReadingId = payload.id || payload.reading?.id || true;
            button.textContent = 'Uloženo v deníku';
            window.Auth?.showToast?.('Výklad uložen', 'Najdeš ho v profilu v historii výkladů.', 'success');
            trackTarotYesNoEvent('reading_saved', {
                ...metadata,
                reading_id: payload.id || payload.reading?.id || null
            });
            void trackTarotYesNoFunnelEvent('reading_saved', 'tarot_yes_no_save_journal', {
                ...metadata,
                reading_id: payload.id || payload.reading?.id || null
            }, TAROT_YES_NO_TOOL, null);
        } catch (error) {
            console.warn('[Tarot ANO/NE] Could not save reading:', error.message);
            button.disabled = false;
            button.textContent = originalText;
            window.Auth?.showToast?.('Nepodařilo se uložit', 'Zkus to prosím znovu za chvíli.', 'error');
        }
    }

    function trackTarotYesNoFirstValue(answerKey, ans, question) {
        if (firstValueTracked) return;
        firstValueTracked = true;

        const metadata = {
            ...getResultMetadata(answerKey, ans, question),
            source: TAROT_YES_NO_RESULT_SOURCE,
            feature: TAROT_YES_NO_FEATURE,
            first_value_type: 'tarot_yes_no_result',
            seo_cluster: 'tarot',
            seo_page_type: 'free_tool'
        };

        if (window.MH_ANALYTICS?.trackFirstValueCompleted) {
            window.MH_ANALYTICS.trackFirstValueCompleted(TAROT_YES_NO_FEATURE, metadata);
        } else {
            window.MH_ANALYTICS?.trackEvent?.('first_value_completed', metadata);
        }

        void trackTarotYesNoFunnelEvent('first_value_completed', TAROT_YES_NO_RESULT_SOURCE, metadata);
    }

    function wrapCanvasText(ctx, text, maxWidth) {
        const words = String(text || '').split(/\s+/).filter(Boolean);
        const lines = [];
        let current = '';

        words.forEach((word) => {
            const test = current ? `${current} ${word}` : word;
            if (ctx.measureText(test).width <= maxWidth) {
                current = test;
            } else {
                if (current) lines.push(current);
                current = word;
            }
        });

        if (current) lines.push(current);
        return lines;
    }

    function drawCenteredLines(ctx, lines, centerX, startY, lineHeight, maxLines = lines.length) {
        lines.slice(0, maxLines).forEach((line, index) => {
            ctx.fillText(line, centerX, startY + index * lineHeight);
        });
        return startY + Math.min(lines.length, maxLines) * lineHeight;
    }

    function loadCanvasImage(src) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Image failed: ${src}`));
            image.src = src;
        });
    }

    function drawImageContain(ctx, image, x, y, width, height) {
        const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
        const drawWidth = image.naturalWidth * ratio;
        const drawHeight = image.naturalHeight * ratio;
        const drawX = x + (width - drawWidth) / 2;
        const drawY = y + (height - drawHeight) / 2;
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    }

    async function drawTarotYesNoResultCard(result) {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#141038');
        gradient.addColorStop(0.48, '#070716');
        gradient.addColorStop(1, '#050510');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const seed = result.answerKey.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) + result.question.length;
        for (let i = 0; i < 220; i += 1) {
            const x = (Math.sin(seed + i * 12.9898) * 43758.5453) % 1;
            const y = (Math.sin(seed + i * 78.233) * 24634.6345) % 1;
            const px = Math.abs(x) * canvas.width;
            const py = Math.abs(y) * canvas.height * 0.72;
            const r = i % 9 === 0 ? 2.3 : 1.2;
            ctx.fillStyle = i % 7 === 0 ? 'rgba(230,195,80,0.75)' : 'rgba(235,240,255,0.72)';
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = 'rgba(212,175,55,0.84)';
        ctx.lineWidth = 5;
        ctx.strokeRect(54, 54, canvas.width - 108, canvas.height - 108);
        ctx.strokeStyle = 'rgba(212,175,55,0.34)';
        ctx.lineWidth = 2;
        ctx.strokeRect(78, 78, canvas.width - 156, canvas.height - 156);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#d4af37';
        ctx.font = '600 38px Inter, Arial, sans-serif';
        ctx.fillText('Mystická Hvězda', centerX, 130);

        let cardImage = null;
        try {
            cardImage = await loadCanvasImage(result.image || FALLBACK_CARD_IMAGE);
        } catch (error) {
            console.warn('[Tarot ANO/NE] Image render fallback:', error.message);
        }

        const cardBox = { x: 440, y: 165, width: 200, height: 292 };
        ctx.fillStyle = 'rgba(212,175,55,0.12)';
        ctx.fillRect(cardBox.x - 12, cardBox.y - 12, cardBox.width + 24, cardBox.height + 24);
        ctx.strokeStyle = 'rgba(212,175,55,0.58)';
        ctx.lineWidth = 3;
        ctx.strokeRect(cardBox.x - 12, cardBox.y - 12, cardBox.width + 24, cardBox.height + 24);
        if (cardImage) {
            drawImageContain(ctx, cardImage, cardBox.x, cardBox.y, cardBox.width, cardBox.height);
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(cardBox.x, cardBox.y, cardBox.width, cardBox.height);
        }

        ctx.fillStyle = '#fff7d6';
        ctx.font = '700 38px Cinzel, Georgia, serif';
        ctx.fillText(result.cardName, centerX, 512);

        ctx.fillStyle = result.answerClass === 'ne' ? '#ff9ea8' : (result.answerClass === 'ano' ? '#b9f3c2' : '#f1d06b');
        ctx.font = '700 74px Cinzel, Georgia, serif';
        ctx.fillText(result.label, centerX, 605);

        let y = 700;
        if (result.question) {
            ctx.fillStyle = 'rgba(255,255,255,0.72)';
            ctx.font = '500 32px Inter, Arial, sans-serif';
            ctx.fillText('Ptáš se', centerX, y);
            y += 48;

            ctx.fillStyle = '#ffffff';
            ctx.font = '600 36px Inter, Arial, sans-serif';
            const questionLines = wrapCanvasText(ctx, result.question, 820);
            y = drawCenteredLines(ctx, questionLines, centerX, y, 46, 2) + 24;
        }

        ctx.fillStyle = 'rgba(212,175,55,0.86)';
        ctx.fillRect(170, y, 740, 3);
        y += 58;

        ctx.fillStyle = '#f6f1ff';
        ctx.font = '500 36px Inter, Arial, sans-serif';
        const resultLines = wrapCanvasText(ctx, result.text, 840);
        y = drawCenteredLines(ctx, resultLines, centerX, y, 47, 5);

        ctx.fillStyle = 'rgba(255,255,255,0.78)';
        ctx.font = '500 30px Inter, Arial, sans-serif';
        ctx.fillText('mystickahvezda.cz/tarot-ano-ne.html', centerX, 1268);

        ctx.fillStyle = 'rgba(212,175,55,0.9)';
        ctx.font = '600 26px Inter, Arial, sans-serif';
        ctx.fillText('Ulož si výsledek nebo ho pošli někomu, kdo se ptá stejně.', centerX, 1304);

        return canvas;
    }

    // Capability probe so the button label matches what will actually happen:
    // mobile with the Web Share API can open a native share sheet, desktop falls
    // back to a file download. Tested with a dummy file because canShare depends
    // on the payload type, not just API presence.
    function deviceSupportsFileShare() {
        try {
            if (typeof navigator === 'undefined' || typeof navigator.share !== 'function' || !navigator.canShare) {
                return false;
            }
            const probe = new File([new Blob([''], { type: 'image/png' })], 'probe.png', { type: 'image/png' });
            return navigator.canShare({ files: [probe] });
        } catch {
            return false;
        }
    }

    function canvasToPngFile(canvas, fileName) {
        return new Promise((resolve, reject) => {
            if (!canvas.toBlob) {
                reject(new Error('canvas.toBlob unsupported'));
                return;
            }
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(new File([blob], fileName, { type: 'image/png' }));
                } else {
                    reject(new Error('Canvas render produced no blob.'));
                }
            }, 'image/png');
        });
    }

    function downloadCanvas(canvas, fileName) {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    async function saveTarotYesNoResultImage() {
        if (!lastResult) return;

        const button = document.getElementById('btn-save-result-image');
        const originalText = button ? button.textContent : null;
        if (button) {
            button.disabled = true;
            button.textContent = 'Připravuji obrázek...';
        }

        const baseMetadata = getResultMetadata(lastResult.answerKey, lastResult, lastResult.question);
        trackTarotYesNoEvent('save_click', {
            ...baseMetadata,
            save_target: 'result_image'
        });

        const fileName = `tarot-ano-ne-${lastResult.answerKey}.png`;

        try {
            const canvas = await drawTarotYesNoResultCard(lastResult);

            let file = null;
            try {
                file = await canvasToPngFile(canvas, fileName);
            } catch (blobError) {
                console.warn('[Tarot ANO/NE] Blob render fallback:', blobError.message);
            }

            const canShareFile = Boolean(
                file
                && typeof navigator.share === 'function'
                && navigator.canShare
                && navigator.canShare({ files: [file] })
            );

            if (canShareFile) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Tarot ANO / NE',
                        text: `Karty mi na moji otázku odpověděly ${lastResult.label}. Zeptej se taky na mystickahvezda.cz`
                    });
                    window.MH_ANALYTICS?.trackAction?.('tarot_yes_no_result_image_shared', {
                        ...baseMetadata,
                        source: TAROT_YES_NO_RESULT_SOURCE,
                        share_target: 'web_share',
                        format: 'png'
                    });
                } catch (shareError) {
                    if (shareError && shareError.name === 'AbortError') {
                        window.MH_ANALYTICS?.trackAction?.('tarot_yes_no_result_image_share_cancelled', {
                            ...baseMetadata,
                            source: TAROT_YES_NO_RESULT_SOURCE
                        });
                    } else {
                        downloadCanvas(canvas, fileName);
                        window.MH_ANALYTICS?.trackAction?.('tarot_yes_no_result_image_saved', {
                            ...baseMetadata,
                            source: TAROT_YES_NO_RESULT_SOURCE,
                            share_target: 'download_fallback',
                            format: 'png'
                        });
                    }
                }
            } else {
                downloadCanvas(canvas, fileName);
                window.MH_ANALYTICS?.trackAction?.('tarot_yes_no_result_image_saved', {
                    ...baseMetadata,
                    source: TAROT_YES_NO_RESULT_SOURCE,
                    share_target: 'download',
                    format: 'png'
                });
            }
        } catch (error) {
            console.warn('[Tarot ANO/NE] Could not build result image:', error.message);
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    }

    function revealTarotYesNoNextStep(answerKey, ans, question) {
        const nextStep = document.getElementById('tarot-yes-no-next-step');
        const answerBadge = document.getElementById('tarot-yes-no-next-answer');
        if (!nextStep) return;

        if (answerBadge) {
            answerBadge.textContent = ans.label.toLowerCase();
        }

        nextStep.dataset.answerKey = answerKey;
        setBlockVisible(nextStep, true);

        const metadata = getResultMetadata(answerKey, ans, question);
        window.MH_ANALYTICS?.trackAction?.('tarot_yes_no_result_bridge_viewed', {
            ...metadata,
            feature: TAROT_YES_NO_FEATURE,
            source: TAROT_YES_NO_RESULT_SOURCE
        });
        void trackTarotYesNoFunnelEvent('paywall_viewed', TAROT_YES_NO_RESULT_SOURCE, metadata);
    }

    function bindTarotYesNoBridgeLinks() {
        document.querySelectorAll('[data-tarot-yes-no-upgrade]').forEach((link) => {
            if (link.dataset.tarotYesNoBound === 'true') return;
            link.dataset.tarotYesNoBound = 'true';
            link.addEventListener('click', (event) => {
                event.preventDefault();
                startTarotYesNoUpgradeFlow(link.dataset.tarotYesNoUpgrade || TAROT_YES_NO_RESULT_SOURCE);
            });
        });

        document.querySelectorAll('[data-tarot-yes-no-intent]').forEach((link) => {
            if (link.dataset.tarotYesNoBound === 'true') return;
            link.dataset.tarotYesNoBound = 'true';
            link.addEventListener('click', () => {
                window.MH_ANALYTICS?.trackCTA?.('tarot_yes_no_intent', {
                    intent: link.dataset.tarotYesNoIntent,
                    destination: link.getAttribute('href') || '',
                    source: TAROT_YES_NO_RESULT_SOURCE
                });
            });
        });

        document.querySelectorAll('[data-tarot-yes-no-register]').forEach((link) => {
            if (link.dataset.tarotYesNoBound === 'true') return;
            link.dataset.tarotYesNoBound = 'true';
            link.addEventListener('click', () => {
                window.MH_ANALYTICS?.trackCTA?.('tarot_yes_no_save_profile', {
                    intent: link.dataset.tarotYesNoRegister,
                    destination: link.getAttribute('href') || '',
                    source: TAROT_YES_NO_RESULT_SOURCE,
                    feature: TAROT_YES_NO_FEATURE
                });
            });
        });
    }

    function pickCard() {
        if (cardPool.length > 0) {
            return cardPool[Math.floor(Math.random() * cardPool.length)];
        }

        // Nouzový výběr, kdyby se kartotéka nepodařila načíst (offline/chyba sítě).
        const fallbackNames = Object.keys(CARD_VERDICTS);
        const name = fallbackNames[Math.floor(Math.random() * fallbackNames.length)];
        const info = CARD_VERDICTS[name];
        return {
            name,
            verdict: info.verdict,
            proc: info.proc,
            krok: info.krok,
            image: FALLBACK_CARD_IMAGE,
            emoji: '🃏'
        };
    }

    async function flipCard(card, index) {
        if (used) return;

        const inputEl = document.getElementById('question-input');
        const q = inputEl.value.trim();

        if (!q) {
            // Zobrazíme UX upozornění - uživatel musí vyplnit otázku
            inputEl.focus();
            inputEl.classList.add('input--invalid');

            // Přidat "shake" animaci k elementu
            inputEl.classList.remove('shake');
            void inputEl.offsetWidth; // trigger reflow
            inputEl.classList.add('shake');

            // Zpráva do konzole pro jistotu (lze pak ztlumit)
            console.warn('Tarot: Pokus o tažení karty bez zadané otázky.');
            return;
        }

        // Obnovíme původní barvu ohraničení InputBoxu
        inputEl.classList.remove('input--invalid');
        inputEl.classList.remove('shake');

        used = true;
        savedReadingId = null;
        trackTarotYesNoEvent('reading_start', {
            source: 'tarot_yes_no_card_pick',
            feature: TAROT_YES_NO_TOOL,
            has_question: true,
            question_length: Math.min(q.length, 200),
            selected_card_index: index
        });

        // Uzamčeme ostatní karty
        document.querySelectorAll('.tarot-card').forEach(c => c.classList.add('tarot-card--locked'));

        await loadCardPool();

        // Vyhodnocení - losujeme skutečnou kartu ze 78 karet
        const drawnCard = pickCard();
        const meta = VERDICT_META[drawnCard.verdict] || VERDICT_META.nejasne;
        const key = drawnCard.verdict;
        const ans = {
            label: meta.label,
            emoji: meta.emoji,
            class: meta.class,
            cardId: drawnCard.name,
            cardName: drawnCard.name
        };
        const text = drawnCard.proc;
        lastResult = {
            answerKey: key,
            answerClass: ans.class,
            label: ans.label,
            text,
            question: q,
            cardId: drawnCard.name,
            cardName: drawnCard.name,
            image: drawnCard.image,
            krok: drawnCard.krok
        };
        window.__lastTarotYesNoShareResult = lastResult;

        // Vložení resultu na Front (Přední líc karty) - skutečná karta místo jen emoji
        const front = card.querySelector('.card-front');
        front.classList.add(ans.class);
        front.innerHTML = '';

        const cardImage = document.createElement('img');
        cardImage.className = 'card-front-image';
        cardImage.src = drawnCard.image;
        cardImage.alt = drawnCard.name;
        cardImage.loading = 'lazy';
        front.appendChild(cardImage);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'card-front-name';
        nameSpan.textContent = drawnCard.name;
        front.appendChild(nameSpan);

        const answerSpan = document.createElement('span');
        answerSpan.className = 'answer-label';
        answerSpan.textContent = ans.label;
        front.appendChild(answerSpan);

        // Otočení animací
        card.classList.add('flipped');

        // Mírné zpoždění na otočku a zobrazení panelu s textem
        setTimeout(() => {
            const resultImage = document.getElementById('result-card-image');
            if (resultImage) {
                resultImage.src = drawnCard.image;
                resultImage.alt = `Tarotová karta: ${drawnCard.name}`;
                resultImage.hidden = false;
                // Obrázek karty se donačítá až po prvním scrollu — bez
                // přepočtu by tlačítka výsledku sjela pod cookie lištu.
                if (!resultImage.complete) {
                    resultImage.addEventListener('load', () => {
                        const shownPanel = document.getElementById('result-panel');
                        if (shownPanel?.classList.contains('show')) {
                            scrollTarotResultIntoView(shownPanel, 'auto');
                        }
                    }, { once: true });
                }
            }
            document.getElementById('result-emoji').textContent = ans.emoji;
            document.getElementById('result-card-name').textContent = drawnCard.name;
            document.getElementById('result-title').textContent = ans.label;
            const resultTitle = document.getElementById('result-title');
            resultTitle.classList.remove('result-title--yes', 'result-title--no', 'result-title--maybe');
            resultTitle.classList.add(ans.class === 'ano' ? 'result-title--yes' : (ans.class === 'ne' ? 'result-title--no' : 'result-title--maybe'));
            const resultQuestion = document.getElementById('result-question');
            if (resultQuestion) {
                resultQuestion.textContent = `Ptáš se: „${q}"`;
            }
            document.getElementById('result-text').textContent = text;
            const resultStep = document.getElementById('result-next-step-text');
            if (resultStep) {
                resultStep.textContent = drawnCard.krok;
            }
            const panel = document.getElementById('result-panel');
            panel.classList.add('show');
            trackTarotYesNoEvent('reading_complete', {
                ...getResultMetadata(key, ans, q),
                selected_card_index: index
            });
            trackTarotYesNoFirstValue(key, ans, q);
            revealTarotYesNoNextStep(key, ans, q);
            scrollTarotResultIntoView(panel);
            setTimeout(() => scrollTarotResultIntoView(panel), 320);
        }, 800);
    }

    function resetCards() {
        used = false;
        lastResult = null;
        savedReadingId = null;
        window.__lastTarotYesNoShareResult = null;
        document.getElementById('question-input').value = '';
        const saveReadingButton = document.getElementById('btn-save-reading');
        if (saveReadingButton) {
            saveReadingButton.disabled = false;
            saveReadingButton.textContent = 'Uložit odpověď do deníku';
        }
        document.getElementById('question-input').classList.remove('input--invalid');
        document.getElementById('result-panel').classList.remove('show');
        const resultImage = document.getElementById('result-card-image');
        if (resultImage) {
            resultImage.hidden = true;
            resultImage.src = '';
        }
        const resultQuestion = document.getElementById('result-question');
        if (resultQuestion) resultQuestion.textContent = '';
        const resultStep = document.getElementById('result-next-step-text');
        if (resultStep) resultStep.textContent = '';
        setBlockVisible(document.getElementById('tarot-yes-no-next-step'), false);

        document.querySelectorAll('.tarot-card').forEach(c => {
            c.classList.remove('flipped', 'tarot-card--locked');
            const front = c.querySelector('.card-front');
            front.className = 'card-front card-face';
            front.innerHTML = '';
        });

        // Smooth srcoll opět lehce zpátky k inputu po tichém doznění
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 150);
    }

    function initTarotAnoNe() {
        const cardsArea = document.getElementById('cards-area');
        const btnReset = document.getElementById('btn-reset');
        const btnSaveReading = document.getElementById('btn-save-reading');
        const btnSaveResultImage = document.getElementById('btn-save-result-image');

        void loadCardPool();

        if (cardsArea) {
            cardsArea.addEventListener('click', (e) => {
                const card = e.target.closest('.tarot-card');
                if (card) {
                    const idx = card.getAttribute('data-index');
                    if (idx !== null) {
                        void flipCard(card, parseInt(idx));
                    }
                }
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', resetCards);
        }

        if (btnSaveReading) {
            btnSaveReading.addEventListener('click', saveTarotYesNoReading);
        }

        if (btnSaveResultImage) {
            if (deviceSupportsFileShare()) {
                btnSaveResultImage.textContent = '✨ Sdílet výsledek';
            }
            btnSaveResultImage.addEventListener('click', saveTarotYesNoResultImage);
        }

        bindTarotYesNoBridgeLinks();

        window.addEventListener('mh_cookie_banner_visible', () => {
            const panel = document.getElementById('result-panel');
            if (panel?.classList.contains('show')) {
                scrollTarotResultIntoView(panel);
            }
        });
    }

    // Spolehlivě ukotví listenery i pro případy dynamického loadu
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTarotAnoNe);
    } else {
        initTarotAnoNe();
    }
})();
