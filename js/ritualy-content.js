/**
 * Mystická Hvězda — Lunární Rituály: Content Engine
 * 8 fází × 12 znamení = 96 unikátních kombinací
 */
(function () {
    'use strict';

    /* ─── ZNAMENÍ ─────────────────────────────────────────────────── */
    const SIGNS = {
        beran:    { name: 'Beran',    emoji: '♈', element: 'Oheň',   barva: '#e74c3c',
                    focus: 'svou odvahu a přirozenou akčnost',
                    vizObraz: 'jasný plamen ve tvém srdci — čistý, pevný a nekontrolovatelný',
                    mantraSlovo: 'odvaze', ruler: 'Mars',
                    uzemeniVeta: 'Cítíš Martovu energii — připravenou k akci, ne k čekání.',
                    uzavreniVeta: 'Mars stojí za tebou. Jdeš vpřed.',
                    journalQ: 'Kde byla dnes moje reakce okamžitá a správná — bez přílišného přemýšlení?' },

        byk:      { name: 'Byk',      emoji: '♉', element: 'Země',   barva: '#27ae60',
                    focus: 'svou stabilitu a propojení s přírodou',
                    vizObraz: 'hluboké kořeny stromu, které drží pevně v zemi bez ohledu na vítr',
                    mantraSlovo: 'stabilitě', ruler: 'Venuše',
                    uzemeniVeta: 'Cítíš pevnou zemi pod nohama — tvůj přirozený zdroj síly.',
                    uzavreniVeta: 'Venuše tě provází každým klidným krokem kupředu.',
                    journalQ: 'Co mi dnes přineslo skutečný pocit bezpečí a vnitřního klidu?' },

        blizenci: { name: 'Blíženci', emoji: '♊', element: 'Vzduch', barva: '#f39c12',
                    focus: 'svou zvídavost a schopnost spojovat protiklady',
                    vizObraz: 'čistý horský vzduch, který pročišťuje každou myšlenku',
                    mantraSlovo: 'jasnosti', ruler: 'Merkur',
                    uzemeniVeta: 'Tvůj merkurovský um se čistí jako vzduch po dešti — pohyblivý a jasný.',
                    uzavreniVeta: 'Merkur nese tvoje záměry přesně tam, kam mají jít.',
                    journalQ: 'Jaká neočekávaná spojitost se mi dnes ukázala — a co by mohla znamenat?' },

        rak:      { name: 'Rak',      emoji: '♋', element: 'Voda',   barva: '#2980b9',
                    focus: 'svou intuici a schopnost pečovat o druhé i o sebe',
                    vizObraz: 'klidná hladina jezera, která zrcadlí hvězdy dokonale',
                    mantraSlovo: 'intuici', ruler: 'Měsíc',
                    uzemeniVeta: 'Jsi v domovině Měsíce — žádné jiné znamení necítí lunární energii tak přirozeně jako ty.',
                    uzavreniVeta: 'Tvůj Měsíc ti otevřel přesně to, co potřebuješ vidět.',
                    journalQ: 'Co mi dnes řekla moje intuice jako první — a jaká byla moje reakce?' },

        lev:      { name: 'Lev',      emoji: '♌', element: 'Oheň',   barva: '#e67e22',
                    focus: 'svou tvořivost a přirozené sebevyjádření',
                    vizObraz: 'zlaté sluneční světlo vycházející přímo z tvého srdce',
                    mantraSlovo: 'tvořivosti', ruler: 'Slunce',
                    uzemeniVeta: 'Sluneční záře ve tvém srdci svítí i v noci — to je tvůj přirozený stav.',
                    uzavreniVeta: 'Sluneční energie zůstává v tobě — ještě dlouho po zhasnuté svíčce.',
                    journalQ: 'Kde dnes moje světlo přirozeně zazářilo — a jak to ovlivnilo lidi kolem mě?' },

        panna:    { name: 'Panna',    emoji: '♍', element: 'Země',   barva: '#8e44ad',
                    focus: 'svou preciznost a schopnost vidět krásu v detailech',
                    vizObraz: 'čistá průzračná voda tekoucí přes hladké kameny',
                    mantraSlovo: 'péči', ruler: 'Merkur',
                    uzemeniVeta: 'Tvoje přirozená preciznost je dar — nech ji pracovat tiše a přesně pro tebe.',
                    uzavreniVeta: 'Každý detail, jemuž věnuješ péči, roste a přináší ovoce.',
                    journalQ: 'Jaký detail dnes zachytila moje pozornost, zatímco ostatní ho přehlédli — a co to odhalilo?' },

        vahy:     { name: 'Váhy',     emoji: '♎', element: 'Vzduch', barva: '#16a085',
                    focus: 'svou touhu po harmonii ve vztazích i v sobě',
                    vizObraz: 'dokonale vyvážené zlaté váhy klidně spočívající ve středu',
                    mantraSlovo: 'harmonii', ruler: 'Venuše',
                    uzemeniVeta: 'Tvoje vnitřní váhy se tiše vyrovnávají — Venuše tě v tom podporuje.',
                    uzavreniVeta: 'Harmonie, po které toužíš, vždy začíná uvnitř tebe.',
                    journalQ: 'Kde dnes vnáším rovnováhu do vztahů nebo situací — vědomě, nebo instinktivně?' },

        stir:     { name: 'Štír',     emoji: '♏', element: 'Voda',   barva: '#c0392b',
                    focus: 'svou hloubku a schopnost procházet transformací',
                    vizObraz: 'fénix stoupající z temné vody — proměněný, silnější, svobodný',
                    mantraSlovo: 'transformaci', ruler: 'Pluto',
                    uzemeniVeta: 'Temnota tě nestraší — přirozeně z ní čerpáš svou největší sílu.',
                    uzavreniVeta: 'Pluto stvrdil tvou proměnu. Jsi silnější než na začátku tohoto rituálu.',
                    journalQ: 'Co z toho, co dřív tvořilo nedílnou součást mě, dnes dokážu pustit?' },

        strelec:  { name: 'Střelec',  emoji: '♐', element: 'Oheň',   barva: '#d35400',
                    focus: 'svou touhu po expanzi, pravdě a svobodě',
                    vizObraz: 'šíp letící přesně a s jistotou k vzdálenému cíli',
                    mantraSlovo: 'svobodě', ruler: 'Jupiter',
                    uzemeniVeta: 'Jupiter rozšiřuje tvůj obzor — cítíš tu prostorovost a svobodu?',
                    uzavreniVeta: 'Tvůj šíp letí. Svoboda je vnitřní stav — a ty ji nosíš stále v sobě.',
                    journalQ: 'Kam přesně míří můj záměr — a je to stále pravda a svoboda, po níž skutečně toužím?' },

        kozoroh:  { name: 'Kozoroh',  emoji: '♑', element: 'Země',   barva: '#7f8c8d',
                    focus: 'svou disciplínu a vizi dlouhodobého záměru',
                    vizObraz: 'hora, která stojí pevně tisíce let — neochvějná a majestátní',
                    mantraSlovo: 'vytrvalosti', ruler: 'Saturn',
                    uzemeniVeta: 'Saturn ti dává dar trpělivosti — nejcennější ze všech zdrojů.',
                    uzavreniVeta: 'Kámen po kameni, krok po kroku — tak se staví hory i celé životy.',
                    journalQ: 'Jaký dlouhodobý záměr se dnes díky mně posunul o jeden konkrétní, měřitelný krok vpřed?' },

        vodnar:   { name: 'Vodnář',   emoji: '♒', element: 'Vzduch', barva: '#2471a3',
                    focus: 'svou originalitu a vizi lepšího světa',
                    vizObraz: 'hvězdy propojené světelnými vlákny do jednoho velkého vzoru',
                    mantraSlovo: 'vizi', ruler: 'Uran',
                    uzemeniVeta: 'Tvoje vize předbíhá dobu — Uran tě posílá tam, kde ostatní ještě nejsou.',
                    uzavreniVeta: 'Uran přináší revoluci. Ty ji vedeš — klidně, vědomě, s přehledem.',
                    journalQ: 'Jaká neobvyklá myšlenka mě dnes napadla — a co by se stalo, kdyby dostala plný prostor?' },

        ryby:     { name: 'Ryby',     emoji: '♓', element: 'Voda',   barva: '#1a5276',
                    focus: 'svůj soucit a intuici přesahující rozum',
                    vizObraz: 'tiché hluboké moře, jehož dno skrývá starodávnou moudrost',
                    mantraSlovo: 'soucitu', ruler: 'Neptun',
                    uzemeniVeta: 'Neptunova hlubina v tobě je bezpečná — nech ji prozářit tvoje tušení.',
                    uzavreniVeta: 'Tvoje intuice je most mezi světy. Důvěřuj jí — vede tě přesněji než jakákoliv logika.',
                    journalQ: 'Jaký sen, pocit nebo tušení dnes dostaly mou pozornost — a co mi tichým hlasem říkaly?' },
    };

    /* ─── FÁZE ────────────────────────────────────────────────────── */
    const PHASES = {
        'new-moon': {
            nazevPrefix: 'Rituál záměrů',
            tema: 'Nový začátek — setí záměrů do temnoty',
            popis: (s) => `Novoluní je kosmickým resetem. Prázdný Měsíc přijímá záměry jako úrodná půda semínka. ${s.element} tě dnes podporuje ve formulování toho, co skutečně chceš přivést do svého života.`,
            prepList: ['Svíčka (bílá nebo stříbrná)', 'Papír a tužka', 'Klidné místo na 10 minut', 'Sklenka vody'],
            duration: '8–10 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsviť svíčku a sedni si pohodlně. Třikrát zhluboka dýchej — nádech nosem na 4 doby, zadrž na 4, výdech ústy na 6. S každým výdechem pusť napětí tohoto dne. Nech ticho novolunění, aby tě zahalilo jako přikrývka. ${s.uzemeniVeta}`,
                    subtext: 'Příprava posvátného prostoru',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Polož ruku na srdce. V tichu se zeptej: "Co chci přivést do svého života v příštích 29 dnech?" Nech ${s.focus} mluvit jako první — bez cenzury, bez posuzování. Naslouchej.`,
                    subtext: 'Čas vnitřního naslouchání',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavři oči. Představ si ${s.vizObraz}. Pak si představ, jak tento obraz stoupá k temnému Měsíci na obloze. Měsíc přijímá tvůj záměr jako semínko do posvátné půdy. Vydrž u tohoto obrazu 2 minuty.`,
                    subtext: 'Setí záměrů do lunárního pole',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Vezmi papír a napiš 3 záměry v přítomném čase — jako by se už děly. Začni slovy "Jsem…", "Mám…", nebo "Přijímám…". Papír přelož a uschovej na bezpečném místě až do Úplňku — a sleduj, jak se záměry naplňují.`,
                    subtext: 'Záměry zapsané se stávají realitou',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakuj nahlas nebo v duchu:\n\n„V ${s.mantraSlovo} a tichu novoluní zasívám svou budoucnost.\nNechť přijde v pravý čas — pod vedením ${s.ruler}."`,
                    subtext: 'Opakuj třikrát — s plným přesvědčením',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Poděkuj Měsíci za jeho skrytou sílu temnoty. Poděkuj sobě za čas věnovaný této praxi. ${s.uzavreniVeta} Zhasni svíčku vědomě, jako akt uzavření posvátného prostoru. Tvůj záměr byl přijat.`,
                    subtext: 'Rituál je dokončen',
                },
            ],
            journalPrompts: (s) => [
                `Co se ve mně pohnulo při formulování záměrů? Co mě překvapilo?`,
                `Jaké části záměru mi jde nejhůř uvěřit — a co to říká o mé víře v sebe?`,
                `Co musím pustit, aby nový začátek mohl přijít?`,
                s.journalQ,
            ],
        },

        'waxing-crescent': {
            nazevPrefix: 'Rituál prvního kroku',
            tema: 'Dorůstající srpek — odvaha k první akci',
            popis: (s) => `Tenký srpek Měsíce se zjevuje jako první příslib. Je čas jednat na základě záměrů. Tvůj živel — ${s.element.toLowerCase()} — tě pohání: malý, ale reálný krok dnes může změnit vše.`,
            prepList: ['Svíčka', 'Papír a tužka', 'Pohodlné místo k sezení'],
            duration: '7–9 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsviť svíčku. Třikrát zhluboka dýchej. S každým výdechem propusť jeden strach nebo pochybnost. Nech dorůstající energii Měsíce proudit tvým tělem jako první ranní světlo. ${s.uzemeniVeta}`,
                    subtext: 'Příprava na akci',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Polož ruku na hrudník. Vzpomeň si na záměry ze začátku cyklu. Zeptej se: "Jaký JEDEN konkrétní krok můžu udělat ještě dnes?" Nech ${s.focus}, ať ti ukáže cestu. Věř první myšlence, která přijde.`,
                    subtext: 'Propojení se záměrem',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavři oči. Představ si ${s.vizObraz}. Tento obraz tě vede jako lucerna v šeru. Teď si vizualizuj sebe, jak děláš ten jeden krok — s lehkostí, s jistotou, bez váhání. Ciť tu lehkost v celém těle.`,
                    subtext: 'Vizualizace odhodlání',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Napiš na papír: "Dnes udělám: ___________." Vyplň jednu konkrétní, splnitelnou akci. Pak tento závazek nech na viditelném místě jako připomínku. A tu akci udělej — ještě dnes.`,
                    subtext: 'Závazek stvrzený písmem',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakuj:\n\n„V ${s.mantraSlovo} konám první krok.\nMěsíc roste se mnou — a ${s.ruler} mi dává sílu."`,
                    subtext: 'Opakuj třikrát',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Poděkuj si za odvahu začít. Každá velká cesta začíná krokem, který vypadá malý. ${s.uzavreniVeta} Zhasni svíčku vědomě. Tvoje odhodlání bylo stvrzeno.`,
                    subtext: 'Rituál dokončen',
                },
            ],
            journalPrompts: (s) => [
                `Co mě v prvním kroku nejvíce brzdí? Je to reálná překážka, nebo jen strach z neznámého?`,
                `Jak se budu cítit, až ten krok udělám — i kdyby se ukázalo, že byl špatný?`,
                `Komu můžu říct o svém záměru, aby mě ve správnou chvíli podpořil?`,
                s.journalQ,
            ],
        },

        'first-quarter': {
            nazevPrefix: 'Rituál rozhodnosti',
            tema: 'První čtvrť — vůle skrze překážky',
            popis: (s) => `Přesně polovina Měsíce je osvětlena — symbolické napětí mezi záměrem a realitou. Přichází první odpor. Tvůj živel — ${s.element.toLowerCase()} — ti dává sílu překážkou projít, ne se vrátit.`,
            prepList: ['Svíčka', 'Papír a tužka', 'Tiché místo'],
            duration: '8–10 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsviť svíčku. Stoupni si pevně nohama na zem. Třikrát zhluboka dýchej. Ciť stabilitu pod sebou. Žádná překážka tě nevykoření — stojíš pevně jako strom. ${s.uzemeniVeta}`,
                    subtext: 'Uzemění ve vůli',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Zavři oči a pojmenuj jednu překážku, která ti v tuto chvíli stojí v cestě. Buď co nejpřesnější — ne "nemám čas", ale "konkrétně XY mě blokuje, protože..." Nech ${s.focus} odhalit skutečnou příčinu.`,
                    subtext: 'Pojmenování překážky',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavři oči. Představ si ${s.vizObraz}. Teď si představ tu překážku jako zeď před sebou. A pak si představ, jak ji překračuješ — krok za krokem. Soustřeď se ne na zeď, ale na to, jak se cítíš na druhé straně.`,
                    subtext: 'Vizualizace průchodu',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Napiš překážku na papír. Pod ni napiš: "Moje řešení: ___________." Papír přelož na půl — symbolicky překonáváš tu hranici. Uschovej ho, nebo vyhoď podle pocitu. Překážka zapsaná je překážka napůl vyřešená.`,
                    subtext: 'Symbolické překonání hranice',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakuj:\n\n„V ${s.mantraSlovo} a odhodlání procházím překážkou.\nNic mě nezastavuje — ${s.ruler} stojí za mnou."`,
                    subtext: 'Opakuj třikrát s přesvědčením',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Poděkuj si za odvahu pojmenovat to, co tě brzdí. Překážka pojmenovaná je napůl překonaná. ${s.uzavreniVeta} Zhasni svíčku. Jdeš dál.`,
                    subtext: 'Rituál dokončen',
                },
            ],
            journalPrompts: (s) => [
                `Co tato překážka říká o mých skutečných hodnotách a o tom, co opravdu chci?`,
                `Kdo nebo co mi v minulosti pomohlo překonat podobnou situaci?`,
                `Jak vypadá verze mě, která stojí na druhé straně této výzvy?`,
                s.journalQ,
            ],
        },

        'waxing-gibbous': {
            nazevPrefix: 'Rituál vyladění',
            tema: 'Dorůstající měsíc — zdokonalování a vytrvalost',
            popis: (s) => `Měsíc je téměř plný a energie kulminuje. Je čas doladit, ne začínat znovu. Tvůj živel — ${s.element.toLowerCase()} — ti pomáhá vidět, co funguje, a s péčí to dovést k dokonalosti.`,
            prepList: ['Svíčka', 'Deník nebo papír', 'Klidné místo'],
            duration: '7–9 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsviť svíčku. Třikrát zhluboka dýchej — s vědomou vděčností za to, jak daleko od novolunění tvoje cesta došla. Ciť momentum tohoto cyklu: máš za sebou tři čtvrtiny cesty. ${s.uzemeniVeta}`,
                    subtext: 'Vděčné uzemění',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Vzpomeň si na záměr tohoto cyklu. Zeptej se: "Co funguje výborně? A co potřebuje malou, přesnou korekci?" Nech ${s.focus}, ať ti ukáže, kde je prostor pro zdokonalení. Malé vyladění může změnit vše.`,
                    subtext: 'Reflexe pokroku a korekce',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavři oči. Představ si ${s.vizObraz}. Teď si představ svůj záměr jako z 90 % dokončené umělecké dílo — jaký detail chybí? Co ho dokonale dokončí? Vizualizuj výsledek s precizní, radostnou jasností.`,
                    subtext: 'Vizualizace dokončení',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Napiš jednu konkrétní věc, kterou vyladíš nebo dokončíš před Úplňkem. Buď co nejkonkrétnější: ne "zlepším přístup", ale "udělám XY konkrétně dnes do 18:00." Přesnost je v této fázi nejsilnější zbraní.`,
                    subtext: 'Konkrétní závazek k dokončení',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakuj:\n\n„V ${s.mantraSlovo} a přesnosti dosahuji svého cíle.\nJsem téměř tam — ${s.ruler} mi ukazuje poslední krok."`,
                    subtext: 'Opakuj třikrát',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Poděkuj si za vytrvalost — je za tebou celý cyklus práce. Úplněk přichází a tvoje příprava je hotová. ${s.uzavreniVeta} Zhasni svíčku. Poslední krok tě čeká.`,
                    subtext: 'Rituál dokončen',
                },
            ],
            journalPrompts: (s) => [
                `Co mě v tomto cyklu nejvíce překvapilo — v dobrém i v náročném?`,
                `Jaký jeden detail, pokud ho vyladím, posune celý záměr na jinou úroveň?`,
                `Jak se budu cítit při Úplňku, až to bude hotové?`,
                s.journalQ,
            ],
        },

        'full-moon': {
            nazevPrefix: 'Rituál uvolnění',
            tema: 'Úplněk — vrchol energie, oslava a propuštění',
            popis: (s) => `Měsíc je plně osvětlen. Emoce jsou zesíleny, intuice naostřena. To, co bylo zaseto, se projevuje. Je čas slavit, vděčit — a vědomě propustit vše, co ti už neslouží. Tvůj živel — ${s.element.toLowerCase()} — je dnes na vrcholu.`,
            prepList: ['Svíčka (zlatá nebo bílá)', 'Papír a tužka', 'Sklenka vody', 'Bezpečné místo (případně pro spálení papíru)'],
            duration: '10–12 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsviť svíčku. Třikrát zhluboka dýchej. Ciť plnou energii Úplňku — jak proniká do každé buňky tvého těla. Jsi na vrcholu lunárního cyklu. Vše, co bylo zaseto, je nyní viditelné. ${s.uzemeniVeta}`,
                    subtext: 'Uzemění v plné energii',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Vzpomeň si na záměry ze začátku cyklu. Co se naplnilo? Co přišlo nečekaně? Přijmi s vděčností oboje. Pak se zeptej: "Co musím pustit, aby mohl přijít nový začátek?" Nech ${s.focus}, ať ti odpoví bez cenzury.`,
                    subtext: 'Sklizeň a vědomá volba propuštění',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavři oči. Představ si stříbrné světlo Úplňku, jak plní celou tvou místnost a pak i tebe. Pak si představ ${s.vizObraz}. Nech toto světlo projít každou buňkou — očistit, naplnit a osvobodit. Dýchej světlo dovnitř.`,
                    subtext: 'Vizualizace očisty a naplnění',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Napiš na papír, co chceš propustit — zvyk, myšlenku, vztah, strach, přesvědčení o sobě. Pak papír přetrhni na dvě části. Pokud máš možnost, spal ho bezpečně. Nebo ho vědomě hoď do koše. Propouštíš.`,
                    subtext: 'Rituální propuštění',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakuj:\n\n„V ${s.mantraSlovo} a vděčnosti propouštím staré.\nCítím volnost a připravenost — ${s.ruler} otevírá nový cyklus."`,
                    subtext: 'Opakuj třikrát — s lehkostí a vděčností',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Vezmi sklenku vody a podrž ji chvíli v dlaních. Představ si, jak do ní proudí světlo Úplňku. Vypij ji jako symbol přijetí nové energie. ${s.uzavreniVeta} Poděkuj Měsíci. Zhasni svíčku.`,
                    subtext: 'Rituál dokončen — cyklus se uzavírá',
                },
            ],
            journalPrompts: (s) => [
                `Co konkrétního se v tomto lunárním cyklu naplnilo nebo projevilo — i nečekaně?`,
                `Co propouštím a jak se cítím po tomto rozhodnutí? Co to uvolnění přinese?`,
                `Jaký je první záměr pro nový cyklus, který brzy začne?`,
                s.journalQ,
            ],
        },

        'waning-gibbous': {
            nazevPrefix: 'Rituál vděčnosti',
            tema: 'Ubývající měsíc — sdílení moudrosti a reflexe',
            popis: (s) => `Měsíc ubývá a energie se obrací dovnitř. Je čas integrovat to, co Úplněk přinesl, a sdílet moudrost. Tvůj živel — ${s.element.toLowerCase()} — tě zve k hluboké reflexi a předávání.`,
            prepList: ['Svíčka', 'Deník nebo papír', 'Tiché místo', 'Čaj nebo teplý nápoj (volitelně)'],
            duration: '8–10 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsviť svíčku. Třikrát zhluboka dýchej s vědomím, že ubývající světlo Měsíce nese tvou moudrost domů. Dovol si zpomalit — žádný spěch, žádné nároky. Jen přítomnost. ${s.uzemeniVeta}`,
                    subtext: 'Uzemění v reflexi a klidu',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Zaměř se na ${s.focus}. Zeptej se: "Co nového mě tento cyklus naučil? Jakou moudrost chci nést dál — a jakou sdílet s ostatními?" Setrvej v tichu, dokud nepřijde odpověď.`,
                    subtext: 'Integrování moudrosti cyklu',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavři oči. Představ si ${s.vizObraz}. Pak si představ, jak tuto kvalitu — svou moudrost z cyklu — předáváš jako dar někomu blízkému. Jak se tváří, když ji přijme? A jak se cítíš ty?`,
                    subtext: 'Vizualizace sdílení a předání',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Napiš 3 věci, za které v tomto cyklu cítíš hlubokou vděčnost. Pak napiš 1 konkrétní moudrost nebo zkušenost, kterou tento týden sdílíš s někým blízkým. Konkrétně: s kým a co.`,
                    subtext: 'Vděčnost stvrzená a sdílení naplánované',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakuj:\n\n„V ${s.mantraSlovo} a vděčnosti sdílím světlo, které ke mně přišlo.\nMá moudrost roste předáváním — tak jako ${s.ruler} naplňuje svůj cyklus."`,
                    subtext: 'Opakuj třikrát',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Poděkuj za vše, co tento cyklus přinesl — dobré i náročné. Obojí bylo tvým učitelem. ${s.uzavreniVeta} Zhasni svíčku. Neseš moudrost dál — to je to nejvzácnější, co můžeš dát.`,
                    subtext: 'Rituál dokončen',
                },
            ],
            journalPrompts: (s) => [
                `Jaká moudrost z tohoto cyklu mě nejvíce překvapila nebo zasáhla?`,
                `Komu můžu předat to, co mě tento cyklus naučil? Jak to udělám konkrétně?`,
                `Kde cítím nejhlubší vděčnost — i za to, co bylo těžké?`,
                s.journalQ,
            ],
        },

        'last-quarter': {
            nazevPrefix: 'Rituál čistění',
            tema: 'Poslední čtvrť — propuštění a příprava prostoru',
            popis: (s) => `Měsíc se vrací k temnotě. Je čas hlubokého úklidu — fyzického, emocionálního i mentálního. Tvůj živel — ${s.element.toLowerCase()} — ti pomáhá jasně vidět, co nést dál a co vědomě pustit.`,
            prepList: ['Svíčka', 'Papír a tužka', 'Tiché místo'],
            duration: '8–10 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsviť svíčku. Třikrát zhluboka dýchej. S každým výdechem si představ, jak vydechuješ vše staré, přebytečné a unavující. Cítíš se lehčí s každým dechem. Ubývající Měsíc nese staré pryč. ${s.uzemeniVeta}`,
                    subtext: 'Uzemění v očistě',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Polož si otázku: "Co v mém životě zabírá místo, aniž by mi přinášelo radost nebo smysl?" Nech ${s.focus}, ať ti pomůže rozlišit, co je skutečně tvoje — a co si jen neseš ze zvyku nebo ze strachu.`,
                    subtext: 'Inventura přebytečného',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavři oči. Představ si ${s.vizObraz}. Pak si představ, jak přes tento obraz prochází čistý vítr. Odnáší vše, co ti neslouží — bez dramatu, bez lítosti. Prostor po nich je světlý, čistý a připravený.`,
                    subtext: 'Vizualizace čistého prostoru',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Napiš na papír 3 věci, které vědomě propouštíš — myšlenky, návyky, předměty nebo vztahy, které tě už nevyživují. Pro každou napiš: "Propouštím _____, protože _____." Pak papír přetrhni nebo vyhoď.`,
                    subtext: 'Vědomé a konkrétní propuštění',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakuj:\n\n„V ${s.mantraSlovo} a jasnosti čistím svůj prostor.\nTo, co odchází, vytváří místo pro nové — a ${s.ruler} mi dává jasnost vidět, co si nést dál."`,
                    subtext: 'Opakuj třikrát',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Poděkuj si za odvahu pustit to, co bylo třeba. Každý odchod je pozvánka pro příchod. ${s.uzavreniVeta} Zhasni svíčku. Tvůj prostor — vnitřní i vnější — je čistší.`,
                    subtext: 'Rituál dokončen',
                },
            ],
            journalPrompts: (s) => [
                `Jak se cítím po tomto vědomém propuštění? Co se pohnulo?`,
                `Co si s sebou do nového cyklu beru jako poučení — ne jako břemeno?`,
                `Jaký prostor se ve mně dnes otevřel pro nové?`,
                s.journalQ,
            ],
        },

        'waning-crescent': {
            nazevPrefix: 'Rituál ticha',
            tema: 'Ubývající srpek — obnova, odpočinek a příprava',
            popis: (s) => `Měsíc téměř zmizel z oblohy. Cyklus se uzavírá. Toto je nejintrovertovanější fáze — čas skutečného odpočinku, regenerace a tiché přípravy. Tvůj živel — ${s.element.toLowerCase()} — si zaslouží klid.`,
            prepList: ['Svíčka', 'Pohodlné místo k sezení nebo lehnutí', 'Tichá místnost bez rušivých vlivů'],
            duration: '7–10 minut',
            kroky: [
                {
                    title: 'Uzemění',
                    text: (s) => `Rozsviť svíčku. Lehni si nebo se pohodlně posaď. Třikrát zhluboka dýchej bez jakéhokoli záměru — jen čisté dýchání. Dovol svému tělu a mysli odpočívat bez nároku na výkon. ${s.uzemeniVeta}`,
                    subtext: 'Uzemění v hlubokém klidu',
                },
                {
                    title: 'Záměr',
                    text: (s) => `Dnešní záměr je nejjednodušší ze všech: dovolit si opravdu odpočinout. Zeptej se tiše: "Co moje tělo a duše potřebují k zotavení a obnově?" Nech ${s.focus}, ať ukáže cestu k obnově.`,
                    subtext: 'Záměr v odpočinku bez výčitek',
                },
                {
                    title: 'Vizualizace',
                    text: (s) => `Zavři oči. Představ si ${s.vizObraz}. Tento obraz se pomalu rozplývá, jak Měsíc ubývá. Nech mysl spočinout v tichu — žádné plány, žádné úkoly, žádná analýza. Jen bytí v přítomném okamžiku.`,
                    subtext: 'Vizualizace hlubokého ticha',
                },
                {
                    title: 'Fyzický úkon',
                    text: (s) => `Zůstaň 3 minuty v absolutním tichu. Žádný telefon, žádná hudba, žádné zprávy. Jen ticho a svíčka. Pokud přijdou myšlenky, přijmi je laskavě a nech je odejít jako mraky po obloze.`,
                    subtext: '3 minuty vědomého ticha',
                },
                {
                    title: 'Mantra',
                    text: (s) => `Třikrát opakuj — pomalu, téměř šeptem:\n\n„V ${s.mantraSlovo} a tichu se obnovuji.\nNový cyklus začíná brzy — ${s.ruler} připravuje nový začátek."`,
                    subtext: 'Šeptej třikrát — jemně',
                },
                {
                    title: 'Uzavření',
                    text: (s) => `Poděkuj si za tuto chvíli zastavení. Odpočinek není slabost — je to příprava na vše, co přijde. ${s.uzavreniVeta} Zhasni svíčku. Novolunění se blíží a s ním nový začátek.`,
                    subtext: 'Rituál dokončen — cyklus se uzavírá',
                },
            ],
            journalPrompts: (s) => [
                `Jak se cítím, když si dovolím opravdu odpočinout — bez výčitek?`,
                `Co z tohoto lunárního cyklu si nesu jako dar a poučení do nového?`,
                `Co by novoluní mohlo přinést, kdyby vše bylo možné?`,
                s.journalQ,
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
