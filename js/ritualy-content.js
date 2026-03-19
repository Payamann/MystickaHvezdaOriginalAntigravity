/**
 * Mystická Hvězda — Lunární Rituály: Content Engine
 * 8 fází × 12 znamení = 96 unikátních kombinací
 */
(function () {
    'use strict';

    /* ─── ZNAMEN Í ────────────────────────────────────────────────── */
    const SIGNS = {
        beran:    { name: 'Beran',    emoji: '♈', element: 'Oheň',   barva: '#e74c3c',
                    focus: 'svou odvahu a přirozenou akčnost',
                    vizObraz: 'jasný plamen ve vašem srdci — čistý, pevný a nekontrolovatelný',
                    mantraSlovo: 'odvaze', ruler: 'Mars' },

        byk:      { name: 'Byk',      emoji: '♉', element: 'Země',   barva: '#27ae60',
                    focus: 'svou stabilitu a propojení s přírodou',
                    vizObraz: 'hluboké kořeny stromu, které drží pevně v zemi bez ohledu na vítr',
                    mantraSlovo: 'stabilitě', ruler: 'Venuše' },

        blizenci: { name: 'Blíženci', emoji: '♊', element: 'Vzduch', barva: '#f39c12',
                    focus: 'svou zvídavost a schopnost spojovat protiklady',
                    vizObraz: 'čistý horský vzduch, který pročišťuje každou myšlenku',
                    mantraSlovo: 'jasnosti', ruler: 'Merkur' },

        rak:      { name: 'Rak',      emoji: '♋', element: 'Voda',   barva: '#2980b9',
                    focus: 'svou intuici a schopnost pečovat o druhé i o sebe',
                    vizObraz: 'klidná hladina jezera, která zrcadlí hvězdy dokonale',
                    mantraSlovo: 'intuici', ruler: 'Měsíc' },

        lev:      { name: 'Lev',      emoji: '♌', element: 'Oheň',   barva: '#e67e22',
                    focus: 'svou tvořivost a přirozené sebevyjádření',
                    vizObraz: 'zlaté sluneční světlo vycházející přímo z vašeho srdce',
                    mantraSlovo: 'tvořivosti', ruler: 'Slunce' },

        panna:    { name: 'Panna',    emoji: '♍', element: 'Země',   barva: '#8e44ad',
                    focus: 'svou preciznost a schopnost vidět krásu v detailech',
                    vizObraz: 'čistá průzračná voda tekoucí přes hladké kameny',
                    mantraSlovo: 'péči', ruler: 'Merkur' },

        vahy:     { name: 'Váhy',     emoji: '♎', element: 'Vzduch', barva: '#16a085',
                    focus: 'svou touhu po harmonii ve vztazích i v sobě',
                    vizObraz: 'dokonale vyvážené zlaté váhy klidně spočívající ve středu',
                    mantraSlovo: 'harmonii', ruler: 'Venuše' },

        stir:     { name: 'Štír',     emoji: '♏', element: 'Voda',   barva: '#c0392b',
                    focus: 'svou hloubku a schopnost procházet transformací',
                    vizObraz: 'fénix stoupající z temné vody — proměněný, silnější, svobodný',
                    mantraSlovo: 'transformaci', ruler: 'Pluto' },

        strelec:  { name: 'Střelec',  emoji: '♐', element: 'Oheň',   barva: '#d35400',
                    focus: 'svou touhu po expanzi, pravdě a svobodě',
                    vizObraz: 'šíp letící přesně a s jistotou k vzdálenému cíli',
                    mantraSlovo: 'svobodě', ruler: 'Jupiter' },

        kozoroh:  { name: 'Kozoroh',  emoji: '♑', element: 'Země',   barva: '#7f8c8d',
                    focus: 'svou disciplínu a vizi dlouhodobého záměru',
                    vizObraz: 'hora, která stojí pevně tisíce let — neochvějná a majestátní',
                    mantraSlovo: 'vytrvalosti', ruler: 'Saturn' },

        vodnar:   { name: 'Vodnář',   emoji: '♒', element: 'Vzduch', barva: '#2471a3',
                    focus: 'svou originalitu a vizi lepšího světa',
                    vizObraz: 'hvězdy propojené světelnými vlákny do jednoho velkého vzoru',
                    mantraSlovo: 'vizi', ruler: 'Uran' },

        ryby:     { name: 'Ryby',     emoji: '♓', element: 'Voda',   barva: '#1a5276',
                    focus: 'svůj soucit a intuici přesahující rozum',
                    vizObraz: 'tiché hluboké moře, jehož dno skrývá starodávnou moudrost',
                    mantraSlovo: 'soucitu', ruler: 'Neptun' },
    };

    /* ─── FÁZE ────────────────────────────────────────────────────── */
    const PHASES = {
        'new-moon': {
            nazevPrefix: 'Rituál záměrů',
            tema: 'Nový začátek — setí záměrů do temnoty',
            popis: (s) => `Novoluní je kosmickým resetem. Prázdný Měsíc přijímá záměry jako úrodná půda semínka. ${s.element} vás dnes podporuje v formulování toho, co skutečně chcete přivést do svého života.`,
            prepList: ['Svíčka (bílá nebo stříbrná)', 'Papír a tužka', 'Klidné místo na 10 minut', 'Sklenka vody'],
            duration: '8–10 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsvěťte svíčku a sedněte si pohodlně. Třikrát zhluboka dýchejte — nádech nosem na 4 doby, zadržte na 4, výdech ústy na 6. S každým výdechem pusťte napětí tohoto dne. Nechte ticho novolunění, aby vás zahalilo jako přikrývka.`,
                    subtext: 'Příprava posvátného prostoru',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Položte ruku na srdce. V tichu se zeptejte: "Co chci přivést do svého života v příštích 29 dnech?" Nechte ${s.focus} mluvit jako první — bez cenzury, bez posuzování. Naslouchejte.`,
                    subtext: 'Čas vnitřního naslouchání',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavřete oči. Představte si ${s.vizObraz}. Pak si představte, jak tento obraz stoupá k temnému Měsíci na obloze. Měsíc přijímá váš záměr jako semínko do posvátné půdy. Vydržte v tomto obrazci 2 minuty.`,
                    subtext: 'Setí záměrů do lunárního pole',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Vezměte papír a napište 3 záměry v přítomném čase — jako by se již děly. Začněte slovy "Jsem…", "Mám…", nebo "Přijímám…". Papír přeložte a uschovejte na bezpečném místě až do Úplňku — a sledujte, jak se záměry naplňují.`,
                    subtext: 'Záměry zapsané se stávají realitou',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakujte nahlas nebo v duchu:\n\n„V ${s.mantraSlovo} a tichu novoluní zasívám svou budoucnost.\nNechť přijde v pravý čas."`,
                    subtext: 'Opakujte třikrát — s plným přesvědčením',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Poděkujte Měsíci za jeho skrytou sílu temnoty. Poděkujte sobě za to, že jste udělali čas pro tuto praxi. Zhasněte svíčku vědomě, jako akt uzavření posvátného prostoru. Váš záměr byl přijat.`,
                    subtext: 'Rituál je dokončen',
                },
            ],
            journalPrompts: (s) => [
                `Co se ve mně pohnulo, když jsem formuloval/a záměry? Co mě překvapilo?`,
                `Jaké části záměru mi jde nejhůř uvěřit — a co to říká o mé víře v sebe?`,
                `Co musím pustit, aby nový začátek mohl přijít?`,
            ],
        },

        'waxing-crescent': {
            nazevPrefix: 'Rituál prvního kroku',
            tema: 'Dorůstající srpek — odvaha k první akci',
            popis: (s) => `Tenký srpek Měsíce se zjevuje jako první příslib. Je čas jednat na základě záměrů. Vaše ${s.element.toLowerCase()} vás pohání — malý, ale reálný krok dnes může změnit vše.`,
            prepList: ['Svíčka', 'Papír a tužka', 'Pohodlné místo k sezení'],
            duration: '7–9 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsvěťte svíčku. Třikrát zhluboka dýchejte. S každým výdechem propusťte jeden strach nebo pochybnost. Nechte dorůstající energii Měsíce proudit vašim tělem jako první ranní světlo.`,
                    subtext: 'Příprava na akci',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Položte ruku na hrudník. Vzpomeňte na záměry ze začátku cyklu. Zeptejte se: "Jaký JEDEN konkrétní krok mohu udělat ještě dnes?" Nechte ${s.focus} vám ukázat cestu. Věřte první myšlence, která přijde.`,
                    subtext: 'Propojení se záměrem',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavřete oči. Představte si ${s.vizObraz}. Tento obraz vás vede jako lampáš v semi-tmě. Nyní si vizualizujte sebe, jak děláte ten jeden krok — s lehkostí, s jistotou, bez váhání. Cítěte tu lehkost v celém těle.`,
                    subtext: 'Vizualizace odhodlání',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Napište na papír: "Dnes udělám: ___________." Vyplňte jednu konkrétní, splnitelnou akci. Pak tento závazek nechte na viditelném místě jako připomínku. A tu akci udělejte — ještě dnes.`,
                    subtext: 'Závazek stvrzený písmem',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakujte:\n\n„V ${s.mantraSlovo} a odvaze konám první krok.\nMěsíc roste se mnou."`,
                    subtext: 'Opakujte třikrát',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Poděkujte si za odvahu začít. Každá velká cesta začíná krokem, který vypadá malý. Zhasněte svíčku vědomě. Vaše odhodlání bylo stvrzeno.`,
                    subtext: 'Rituál dokončen',
                },
            ],
            journalPrompts: (s) => [
                `Co mě v prvním kroku nejvíce brzdí? Je to reálná překážka, nebo jen strach z neznámého?`,
                `Jak se budu cítit, až ten krok udělám — i kdyby se ukázalo, že byl špatný?`,
                `Komu mohu říct o svém záměru, aby mě ve správnou chvíli podpořil/a?`,
            ],
        },

        'first-quarter': {
            nazevPrefix: 'Rituál rozhodnosti',
            tema: 'První čtvrť — vůle skrze překážky',
            popis: (s) => `Přesně polovina Měsíce je osvětlena — symbolické napětí mezi záměrem a realitou. Přichází první odpor. Vaše ${s.element.toLowerCase()} vám dává sílu skrz překážku projít, ne se vrátit.`,
            prepList: ['Svíčka', 'Papír a tužka', 'Tiché místo'],
            duration: '8–10 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsvěťte svíčku. Stoupněte si pevně nohama na zem. Třikrát zhluboka dýchejte. Cítěte stabilitu pod sebou. Žádná překážka vás nevykoří — stojíte pevně jako strom.`,
                    subtext: 'Uzemění ve vůli',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Zavřete oči a pojmenujte jednu překážku, která vám v tuto chvíli stojí v cestě. Buďte přesní — ne "nemám čas", ale "konkrétně XY mě blokuje, protože..." Nechte ${s.focus} odhalit skutečnou příčinu.`,
                    subtext: 'Pojmenování překážky',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavřete oči. Představte si ${s.vizObraz}. Nyní si představte tu překážku jako zeď před vámi. A pak si představte, jak ji překračujete — krok za krokem. Soustřeďte se ne na zeď, ale na to, jak se cítíte na druhé straně.`,
                    subtext: 'Vizualizace průchodu',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Napište překážku na papír. Pod ni napište: "Moje řešení: ___________." Papír přeložte na půl — symbolicky překonáváte tu hranici. Uschovejte nebo vyhoďte dle pocitu. Překážka zapsaná je překážka napůl vyřešená.`,
                    subtext: 'Symbolické překonání hranice',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakujte:\n\n„V ${s.mantraSlovo} a odhodlání procházím překážkou.\nNic mě nezastavuje."`,
                    subtext: 'Opakujte třikrát s přesvědčením',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Poděkujte si za odvahu pojmenovat to, co vás brzdí. Překážka pojmenovaná je napůl překonaná. Zhasněte svíčku. Jdete dál.`,
                    subtext: 'Rituál dokončen',
                },
            ],
            journalPrompts: (s) => [
                `Co tato překážka říká o mých skutečných hodnotách a o tom, co opravdu chci?`,
                `Kdo nebo co mi v minulosti pomohlo překonat podobnou situaci?`,
                `Jak vypadá verze mě, která stojí na druhé straně této výzvy?`,
            ],
        },

        'waxing-gibbous': {
            nazevPrefix: 'Rituál vyladění',
            tema: 'Dorůstající měsíc — zdokonalování a vytrvalost',
            popis: (s) => `Měsíc je téměř plný a energie kulminuje. Je čas doladit, ne začínat znovu. Vaše ${s.element.toLowerCase()} vám pomáhá vidět, co funguje, a s péčí to dovést k dokonalosti.`,
            prepList: ['Svíčka', 'Deník nebo papír', 'Klidné místo'],
            duration: '7–9 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsvěťte svíčku. Třikrát zhluboka dýchejte — s vědomou vděčností za to, jak daleko jste od novolunění dospěli. Cítěte momentum tohoto cyklu: jsou za vámi tři čtvrtiny cesty. Poslední kousek jde nejlépe.`,
                    subtext: 'Vděčné uzemění',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Vzpomeňte na záměr tohoto cyklu. Zeptejte se: "Co funguje výborně? A co potřebuje malou, přesnou korekci?" Nechte ${s.focus} vám ukázat, kde je prostor pro zdokonalení. Malé vyladění může změnit vše.`,
                    subtext: 'Reflexe pokroku a korekce',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavřete oči. Představte si ${s.vizObraz}. Nyní si představte svůj záměr jako 90% dokončené umělecké dílo — jaký detail chybí? Co jej dokonale dokončí? Vizualizujte výsledek s precizní, radostnou jasností.`,
                    subtext: 'Vizualizace dokončení',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Napište jednu konkrétní věc, kterou vyladíte nebo dokončíte před Úplňkem. Buďte co nejkonkrétnější: ne "zlepším přístup", ale "udělám XY konkrétně dnes do 18:00." Přesnost je v této fázi nejsilnější zbraní.`,
                    subtext: 'Konkrétní závazek k dokončení',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakujte:\n\n„V ${s.mantraSlovo} a přesnosti dosahuji svého cíle.\nJsem téměř tam."`,
                    subtext: 'Opakujte třikrát',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Poděkujte si za vytrvalost — vydrželi jste celý tento cyklus. Úplněk přichází a vy jste připraveni. Zhasněte svíčku. Poslední krok vás čeká.`,
                    subtext: 'Rituál dokončen',
                },
            ],
            journalPrompts: (s) => [
                `Co mě v tomto cyklu nejvíce překvapilo — v dobrém i v náročném?`,
                `Jaký jeden detail, pokud ho vyladím, posune celý záměr na jinou úroveň?`,
                `Jak se budu cítit při Úplňku, až to bude hotové?`,
            ],
        },

        'full-moon': {
            nazevPrefix: 'Rituál uvolnění',
            tema: 'Úplněk — vrchol energie, oslava a propuštění',
            popis: (s) => `Měsíc je plně osvětlen. Emoce jsou zesíleny, intuice naostřena. To, co bylo zaseto, se projevuje. Je čas slavit, vděčit — a vědomě propustit vše, co vám již neslouží. Vaše ${s.element.toLowerCase()} je dnes na vrcholu.`,
            prepList: ['Svíčka (zlatá nebo bílá)', 'Papír a tužka', 'Sklenka vody', 'Bezpečné místo (případně pro spálení papíru)'],
            duration: '10–12 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsvěťte svíčku. Třikrát zhluboka dýchejte. Cítěte plnou energii Úplňku — jak proniká do každé buňky vašeho těla. Jste na vrcholu lunárního cyklu. Vše, co bylo zaseto, je nyní viditelné.`,
                    subtext: 'Uzemění v plné energii',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Vzpomeňte na záměry ze začátku cyklu. Co se naplnilo? Co přišlo nečekaně? Buďte vděční za oboje. Pak se zeptejte: "Co musím pustit, aby mohl přijít nový začátek?" Nechte ${s.focus} vám odpovědět bez cenzury.`,
                    subtext: 'Sklizeň a vědomá volba propuštění',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavřete oči. Představte si stříbrné světlo Úplňku, jak plní celou vaši místnost a pak i vás. Pak si představte ${s.vizObraz}. Nechte toto světlo projít každou buňkou — očistit, naplnit a osvobodit. Dýchejte světlo dovnitř.`,
                    subtext: 'Vizualizace očisty a naplnění',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Napište na papír, co chcete propustit — zvyk, myšlenku, vztah, strach, přesvědčení o sobě. Pak papír přetrhněte na dvě části. Pokud máte možnost, spalte jej bezpečně. Nebo jej vědomě hoďte do koše. Propouštíte.`,
                    subtext: 'Rituální propuštění',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakujte:\n\n„V ${s.mantraSlovo} a vděčnosti propouštím staré.\nJsem volný/á a připravený/á pro nový cyklus."`,
                    subtext: 'Opakujte třikrát — s lehkostí a vděčností',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Vezměte sklenku vody a podržte ji chvíli v dlaních. Představte si, jak do ní proudí světlo Úplňku. Vypijte ji jako symbol přijetí nové energie. Poděkujte Měsíci. Zhasněte svíčku.`,
                    subtext: 'Rituál dokončen — cyklus se uzavírá',
                },
            ],
            journalPrompts: (s) => [
                `Co konkrétního se v tomto lunárním cyklu naplnilo nebo projevilo — i nečekaně?`,
                `Co propouštím a jak se cítím po tomto rozhodnutí? Co to uvolnění přinese?`,
                `Jaký je první záměr pro nový cyklus, který brzy začne?`,
            ],
        },

        'waning-gibbous': {
            nazevPrefix: 'Rituál vděčnosti',
            tema: 'Ubývající měsíc — sdílení moudrosti a reflexe',
            popis: (s) => `Měsíc ubývá a energie se obrací dovnitř. Je čas integrovat to, co Úplněk přinesl, a sdílet moudrost. Vaše ${s.element.toLowerCase()} vás zve k hluboké reflexi a předávání.`,
            prepList: ['Svíčka', 'Deník nebo papír', 'Tiché místo', 'Čaj nebo teplý nápoj (volitelně)'],
            duration: '8–10 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsvěťte svíčku. Třikrát zhluboka dýchejte s vědomím, že ubývající světlo Měsíce nese vaši moudrost domů. Dovolte si zpomalit — žádný spěch, žádné nároky. Jen přítomnost.`,
                    subtext: 'Uzemění v reflexi a klidu',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Zaměřte se na ${s.focus}. Zeptejte se: "Čemu jsem se v tomto cyklu naučil/a? Jakou moudrost chci nést dál — a jakou sdílet s ostatními?" Sídlejte v tichu, dokud nepřijde odpověď.`,
                    subtext: 'Integrování moudrosti cyklu',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavřete oči. Představte si ${s.vizObraz}. Pak si představte, jak tuto kvalitu — vaši moudrost z cyklu — předáváte jako dar někomu blízkému. Jak se tváří, když ji přijme? Jak se cítíte vy?`,
                    subtext: 'Vizualizace sdílení a předání',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Napište 3 věci, za které jste v tomto cyklu hluboce vděční. Pak napište 1 konkrétní moudrost nebo zkušenost, kterou sdílíte s někým blízkým — ještě tento týden. Konkrétně: s kým a co.`,
                    subtext: 'Vděčnost stvrzená a sdílení naplánované',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakujte:\n\n„V ${s.mantraSlovo} a vděčnosti sdílím světlo, které jsem přijal/a.\nMá moudrost roste předáváním."`,
                    subtext: 'Opakujte třikrát',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Poděkujte za vše, co tento cyklus přinesl — dobré i náročné. Obojí bylo vaším učitelem. Zhasněte svíčku. Nesete moudrost dál — to je nejvzácnější věc, co můžete dát.`,
                    subtext: 'Rituál dokončen',
                },
            ],
            journalPrompts: (s) => [
                `Jaká moudrost z tohoto cyklu mě nejvíce překvapila nebo zasáhla?`,
                `Komu mohu předat to, co jsem se naučil/a? Jak to udělám konkrétně?`,
                `Za co jsem nejhlouběji vděčný/á — i za to, co bylo těžké?`,
            ],
        },

        'last-quarter': {
            nazevPrefix: 'Rituál čistění',
            tema: 'Poslední čtvrť — propuštění a příprava prostoru',
            popis: (s) => `Měsíc se vrací k temnotě. Je čas hlubokého úklidu — fyzického, emocionálního i mentálního. Vaše ${s.element.toLowerCase()} vám pomáhá jasně vidět, co nést dál a co vědomě pustit.`,
            prepList: ['Svíčka', 'Papír a tužka', 'Tiché místo'],
            duration: '8–10 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsvěťte svíčku. Třikrát zhluboka dýchejte. S každým výdechem si představte, jak vydechujete vše staré, přebytečné a unavující. Cítíte se lehčí s každým dechem. Ubývající Měsíc nese staré pryč.`,
                    subtext: 'Uzemění v očistě',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Zeptejte se sami sebe: "Co v mém životě zabírá místo, aniž by mi přinášelo radost nebo smysl?" Nechte ${s.focus} vám pomoci rozlišit, co je skutečně vaše — a co si jen nesete ze zvyku nebo ze strachu.`,
                    subtext: 'Inventura přebytečného',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavřete oči. Představte si ${s.vizObraz}. Pak si představte, jak přes tento obraz prochází čistý vítr. Odnáší vše, co vám neslouží — bez dramatu, bez lítosti. Prostor po nich je světlý, čistý a připravený.`,
                    subtext: 'Vizualizace čistého prostoru',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Napište na papír 3 věci, které vědomě propouštíte — myšlenky, návyky, předměty nebo vztahy, které vás již nevyživují. Pro každou napište: "Propouštím _____, protože _____." Pak papír přetrhněte nebo vyhoďte.`,
                    subtext: 'Vědomé a konkrétní propuštění',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakujte:\n\n„V ${s.mantraSlovo} a jasnosti čistím svůj prostor.\nTo, co odchází, vytváří místo pro nové."`,
                    subtext: 'Opakujte třikrát',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Poděkujte si za odvahu pustit to, co bylo třeba. Každý odchod je pozvánka pro příchod. Zhasněte svíčku. Váš prostor — vnitřní i vnější — je čistší.`,
                    subtext: 'Rituál dokončen',
                },
            ],
            journalPrompts: (s) => [
                `Jak se cítím po tomto vědomém propuštění? Co se pohnulo?`,
                `Co si s sebou do nového cyklu beru jako poučení — ne jako břemeno?`,
                `Jaký prostor jsem v sobě dnes otevřel/a pro nové?`,
            ],
        },

        'waning-crescent': {
            nazevPrefix: 'Rituál ticha',
            tema: 'Ubývající srpek — obnova, odpočinek a příprava',
            popis: (s) => `Měsíc téměř zmizel z oblohy. Cyklus se uzavírá. Toto je nejintrovertovanější fáze — čas skutečného odpočinku, regenerace a tiché přípravy. Vaše ${s.element.toLowerCase()} si zaslouží klid.`,
            prepList: ['Svíčka', 'Pohodlné místo k sezení nebo lehnutí', 'Tichá místnost bez rušivých vlivů'],
            duration: '7–10 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsvěťte svíčku. Lehněte si nebo pohodlně sedněte. Třikrát zhluboka dýchejte bez jakéhokoli záměru — jen čisté dýchání. Dovolte svému tělu a mysli odpočívat bez nároku na výkon.`,
                    subtext: 'Uzemění v hlubokém klidu',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Dnešní záměr je nejjednodušší ze všech: dovolit si opravdu odpočinout. Zeptejte se tiše: "Co mé tělo a duše potřebují, abych se zotavil/a a obnovil/a?" Nechte ${s.focus} ukázat cestu k obnově.`,
                    subtext: 'Záměr v odpočinku bez výčitek',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavřete oči. Představte si ${s.vizObraz}. Tento obraz se pomalu rozplývá, jak Měsíc ubývá. Nechte mysl spočinout v tichu — žádné plány, žádné úkoly, žádná analýza. Jen bytí v přítomném okamžiku.`,
                    subtext: 'Vizualizace hlubokého ticha',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Zůstaňte 3 minuty v absolutním tichu. Žádný telefon, žádná hudba, žádné zprávy. Jen ticho a svíčka. Pokud přijdou myšlenky, přijměte je laskavě a nechte odejít jako mraky po obloze.`,
                    subtext: '3 minuty vědomého ticha',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakujte — pomalu, téměř v šepotu:\n\n„V ${s.mantraSlovo} a tichu se obnovuji.\nNový cyklus začíná brzy."`,
                    subtext: 'Šeptejte třikrát — jemně',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Poděkujte si za to, že jste si dovolili zastavit. Odpočinek není slabost — je to příprava pro vše, co přijde. Zhasněte svíčku. Novolunění se blíží a vy budete připraveni.`,
                    subtext: 'Rituál dokončen — cyklus se uzavírá',
                },
            ],
            journalPrompts: (s) => [
                `Jak se cítím, když si dovolím opravdu odpočinout — bez výčitek?`,
                `Co z tohoto lunárního cyklu si nesu jako dar a poučení do nového?`,
                `Co by novoluní mohlo přinést, kdyby vše bylo možné?`,
            ],
        },
    };

    /* ─── HLAVNÍ FUNKCE ───────────────────────────────────────────── */

    /**
     * Vrátí kompletní rituál pro danou fázi a znamení.
     * @param {string} phaseSlug - např. 'full-moon'
     * @param {string} signSlug  - např. 'beran'
     * @returns {object}
     */
    function getRitual(phaseSlug, signSlug) {
        const phase = PHASES[phaseSlug] || PHASES['full-moon'];
        const sign  = SIGNS[signSlug]  || SIGNS['beran'];

        return {
            nazev:         `${phase.nazevPrefix} — ${sign.name}`,
            signName:      sign.name,
            signEmoji:     sign.emoji,
            signElement:   sign.element,
            signRuler:     sign.ruler,
            signBarva:     sign.barva,
            phaseSlug:     phaseSlug,
            signSlug:      signSlug,
            phaseTema:     phase.tema,
            popis:         phase.popis(sign),
            prepList:      phase.prepList,
            duration:      phase.duration,
            kroky: phase.kroky.map((krok, i) => ({
                cislo:   i + 1,
                title:   krok.title,
                text:    krok.text(sign),
                subtext: krok.subtext,
            })),
            journalPrompts: phase.journalPrompts(sign),
        };
    }

    function getAllSigns() { return SIGNS; }
    function getAllPhases() { return Object.keys(PHASES); }

    /* ─── EXPORT ──────────────────────────────────────────────────── */
    window.RitualContent = { getRitual, getAllSigns, getAllPhases };

})();
