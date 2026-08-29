const PERIOD_SENTENCE_COUNTS = Object.freeze({
    daily: 3,
    weekly: 5,
    monthly: 7
});

const CZECH_SIGN_PROFILES = Object.freeze({
    Beran: {
        theme: 'odvážného začátku',
        signal: 'kde tě netrpělivost tlačí k odpovědi dřív, než máš jasno',
        action: 'Vyber jeden odkládaný krok a věnuj mu dnes dvacet soustředěných minut',
        relationship: 'řekni otevřeně, co potřebuješ, ale nech druhé domluvit',
        work: 'dej energii jedinému úkolu, který může skutečně pohnout výsledkem',
        body: 'střídej rozhodnou akci s krátkým pohybem a vědomým výdechem',
        challenge: 'zaměníš rychlost za skutečný pokrok',
        integration: 'pojmenuj, který odvážný krok ti přinesl nejvíc prostoru',
        affirmation: 'Má odvaha má směr a každý vědomý krok otevírá nový prostor.'
    },
    Býk: {
        theme: 'stability a smysluplného tempa',
        signal: 'co ti přináší klid a co už držíš jen ze zvyku',
        action: 'Dokonči jednu praktickou věc, která ti doma nebo v práci vytvoří pevnější půdu',
        relationship: 'dej blízkosti čas a své přání vyjádři jednoduše',
        work: 'upřednostni kvalitu, rozpočet a dlouhodobou hodnotu před rychlou odměnou',
        body: 'dopřej si pravidelné jídlo, pomalejší rytmus a kontakt s přírodou',
        challenge: 'zůstaneš u známého jen proto, že změna působí nepohodlně',
        integration: 'zachovej to, co je pevné, a uvolni jednu zbytečnou povinnost',
        affirmation: 'Moje trpělivost proměňuje malé kroky v pevné a krásné výsledky.'
    },
    Blíženci: {
        theme: 'jasné komunikace a zvídavosti',
        signal: 'která věta nebo informace se k tobě vrací z více stran',
        action: 'Zapiš si hlavní otázku a ověř ji jedním přímým rozhovorem',
        relationship: 'ptej se dřív, než si domyslíš cizí záměr',
        work: 'spoj dva nápady, ale stanov si jeden termín a jeden měřitelný výstup',
        body: 'odlož na chvíli obrazovku a dopřej hlavě ticho bez dalších podnětů',
        challenge: 'rozptýlíš pozornost mezi příliš mnoho otevřených možností',
        integration: 'vyber myšlenku, která obstála i po důkladném ověření',
        affirmation: 'Má zvídavost nachází souvislosti a má slova přinášejí jasno.'
    },
    Rak: {
        theme: 'bezpečí, hranic a citlivé péče',
        signal: 've které situaci tělo žádá klid, i když okolí tlačí na výkon',
        action: 'Vytvoř si dnes půlhodinu bez požadavků druhých a pojmenuj svou skutečnou potřebu',
        relationship: 'sdílej pocit bez obviňování a neschovávej potřebu za mlčení',
        work: 'chraň soustředění a nerozhoduj pod tlakem cizích nálad',
        body: 'vrať se k pravidelnému odpočinku, teplu a jednoduchému domácímu rituálu',
        challenge: 'převezmeš odpovědnost za emoce, které ti nepatří',
        integration: 'ponech si hranici, díky níž můžeš zůstat otevřeně a zároveň v bezpečí',
        affirmation: 'Má citlivost je moudrost a mé hranice chrání to, co miluji.'
    },
    Lev: {
        theme: 'tvořivosti a pravdivého sebevyjádření',
        signal: 'kde chceš zazářit a kde jen čekáš na vnější potvrzení',
        action: 'Ukaž dnes jeden rozpracovaný nápad člověku, jehož zpětné vazbě důvěřuješ',
        relationship: 'oceň druhé nahlas a pak stejně otevřeně řekni, po čem toužíš',
        work: 'vezmi vedení tam, kde umíš dodat směr i povzbuzení',
        body: 'obnov energii tvořivým pohybem a chvílí bez publika',
        challenge: 'spojíš vlastní hodnotu s potleskem nebo okamžitým výsledkem',
        integration: 'oslav pokrok a rozhodni, čemu chceš dát své světlo dál',
        affirmation: 'Mé světlo je nejjasnější, když tvořím pravdivě a s otevřeným srdcem.'
    },
    Panna: {
        theme: 'řádu, péče a užitečného detailu',
        signal: 'která drobná nepřesnost se opakuje a bere ti zbytečně energii',
        action: 'Uprav jeden proces tak, aby příští krok byl viditelný a snadno proveditelný',
        relationship: 'nahraď opravu druhého konkrétní nabídkou pomoci',
        work: 'dokonči důležitý detail, ale předem si stanov hranici dostatečně dobrého výsledku',
        body: 'podpoř nervový systém pravidelností, vodou a klidnou chůzí',
        challenge: 'budeš čekat na dokonalost místo odevzdání hotové práce',
        integration: 'ponech si systém, který ti opravdu uvolnil ruce',
        affirmation: 'Má pozornost dává chaosu řád a laskavost dává řádu smysl.'
    },
    Váhy: {
        theme: 'rovnováhy a poctivé dohody',
        signal: 'kde říkáš ano jen proto, aby na chvíli zmizelo napětí',
        action: 'V jednom rozhovoru vyslov svou preferenci dřív, než nabídneš kompromis',
        relationship: 'hledej dohodu, ve které jsou slyšet obě strany včetně tebe',
        work: 'porovnej dvě možnosti podle tří jasných kritérií a pak rozhodni',
        body: 'vyvaž společenský čas chvílí ticha a pomalým dechem',
        challenge: 'odložíš rozhodnutí tak dlouho, až ho za tebe udělají okolnosti',
        integration: 'potvrď volbu, která přinesla klid bez popření vlastních potřeb',
        affirmation: 'Tvořím rovnováhu, která ctí vztahy i mou vlastní pravdu.'
    },
    Štír: {
        theme: 'proměny, pravdy a vědomého uvolnění',
        signal: 'které téma v tobě vyvolává silnou reakci a žádá hlubší pojmenování',
        action: 'Napiš si bez cenzury, co potřebuje skončit, a zvol jeden bezpečný krok k uzavření',
        relationship: 'mluv o podstatě věci bez testování loajality nebo skrytých narážek',
        work: 'soustřeď se na kořen problému místo další povrchové opravy',
        body: 'uvolni nahromaděné napětí pohybem, vodou nebo vědomým tichem',
        challenge: 'budeš držet kontrolu i tam, kde už brání obnově',
        integration: 'uznej, co se proměnilo, a nevracej se k tomu jen ze strachu z prázdna',
        affirmation: 'Pouštím to, co dosloužilo, a svou sílu vedu k vědomé proměně.'
    },
    Střelec: {
        theme: 'směru, svobody a širšího pohledu',
        signal: 'která možnost rozšiřuje obzor a která je jen útěkem před závazkem',
        action: 'Proměň jeden velký plán v první konkrétní krok s datem v kalendáři',
        relationship: 'sdílej svou vizi a zároveň se ptej, jaký prostor potřebuje druhá strana',
        work: 'propoj dlouhodobý směr s úkolem, který lze dokončit tento týden',
        body: 'doplň energii pohybem venku a změnou prostředí',
        challenge: 'slíbíš víc, než unese tvůj skutečný čas a pozornost',
        integration: 'ponech si cíl, který stále dává smysl i po střetu s realitou',
        affirmation: 'Má svoboda roste z pravdivého směru a kroků, které dokážu nést.'
    },
    Kozoroh: {
        theme: 'disciplíny, hranic a dlouhodobé stavby',
        signal: 'která povinnost přináší skutečný výsledek a která jen udržuje dojem kontroly',
        action: 'Rozděl největší úkol na tři části a dokonči dnes první z nich',
        relationship: 'ukaž blízkost také přítomností, nejen řešením praktických věcí',
        work: 'chraň hlavní prioritu a odmítni úkol, který k ní nepřispívá',
        body: 'zařaď odpočinek do plánu stejně pevně jako pracovní závazek',
        challenge: 'budeš měřit svou hodnotu jen množstvím odvedené práce',
        integration: 'zhodnoť pokrok podle pevnosti základů, ne podle rychlosti',
        affirmation: 'Má vytrvalost buduje pevné výsledky a odpočinek je součástí mé síly.'
    },
    Vodnář: {
        theme: 'originality, svobody a užitečné změny',
        signal: 'který neobvyklý nápad se vrací a zároveň řeší skutečnou potřebu',
        action: 'Otestuj svůj nápad v malém a požádej jednoho člověka o konkrétní reakci',
        relationship: 'vysvětli svůj odstup místo toho, aby druhá strana hádala, co se děje',
        work: 'zpochybni zastaralý postup a navrhni jednoduchý ověřitelný experiment',
        body: 'střídej mentální stimulaci s tichem a vědomým kontaktem s tělem',
        challenge: 'odmítneš užitečnou strukturu jen proto, že působí příliš obvykle',
        integration: 'ponech si změnu, která prospěla nejen tobě, ale i celku',
        affirmation: 'Má originalita slouží změně, kterou lze převést do skutečného života.'
    },
    Ryby: {
        theme: 'intuice, soucitu a jasných hranic',
        signal: 'který pocit patří tobě a který jsi převzal z okolí',
        action: 'Zapiš si první intuitivní odpověď a ověř ji jedním konkrétním faktem',
        relationship: 'buď laskavě přítomně, ale neslibuj pomoc, na kterou nemáš sílu',
        work: 'dej představivosti jasný rámec, čas a viditelný výstup',
        body: 'omez zahlcení, dopřej si vodu, hudbu a chvíli tichého spočinutí',
        challenge: 'unikneš do představ místo malého kroku v přítomnosti',
        integration: 'propoj vnitřní vhled s rozhodnutím, které lze opravdu uskutečnit',
        affirmation: 'Má intuice je jemná a přesná, když ji opírám o zdravé hranice.'
    }
});

const FALLBACK_LABELS = Object.freeze({
    cs: Object.freeze({ daily: 'Denní inspirace', weekly: 'Týdenní horoskop', monthly: 'Měsíční horoskop' }),
    sk: Object.freeze({ daily: 'Denná inšpirácia', weekly: 'Týždenný horoskop', monthly: 'Mesačný horoskop' }),
    pl: Object.freeze({ daily: 'Dzienna inspiracja', weekly: 'Horoskop tygodniowy', monthly: 'Horoskop miesięczny' })
});

const FALLBACK_SIGN_NORMALIZATION = Object.freeze({
    Baran: 'Beran',
    Škorpión: 'Štír',
    Strelec: 'Střelec',
    Kozorožec: 'Kozoroh',
    Vodnár: 'Vodnář',
    Byk: 'Býk',
    Bliźnięta: 'Blíženci',
    Lew: 'Lev',
    Waga: 'Váhy',
    Skorpion: 'Štír',
    Strzelec: 'Střelec',
    Koziorożec: 'Kozoroh',
    Wodnik: 'Vodnář'
});

function buildCzechPrediction(profile, period) {
    if (period === 'weekly') {
        return [
            `Tento týden ti energie znamení pomáhá rozvíjet téma ${profile.theme}.`,
            `Ve vztazích ${profile.relationship}.`,
            `V práci a financích ${profile.work}.`,
            `Výzvou bude, že ${profile.challenge}.`,
            `${profile.action}.`
        ].join(' ');
    }

    if (period === 'monthly') {
        return [
            `Tento měsíc tě vede k tématu ${profile.theme}.`,
            `Ve vztazích ${profile.relationship}.`,
            `V práci a financích ${profile.work}.`,
            `Pro svou energii ${profile.body}.`,
            `Nenech se stáhnout k tomu, že ${profile.challenge}.`,
            `V první polovině měsíce pozoruj, ${profile.signal}.`,
            `Na konci měsíce ${profile.integration}.`
        ].join(' ');
    }

    return [
        `Dnešní energie zvýrazňuje téma ${profile.theme}.`,
        `Všimni si, ${profile.signal}.`,
        `${profile.action}.`
    ].join(' ');
}

function buildGenericLocalizedPrediction(sign, period, lang) {
    const localized = {
        sk: {
            daily: [
                `Dnešná energia znamenia ${sign} ťa pozýva vrátiť pozornosť k tomu, čo je teraz podstatné.`,
                'Všimni si, kde reaguješ zo zvyku namiesto vedomej voľby.',
                'Vyber si jeden malý krok a urob ho ešte dnes.'
            ],
            weekly: [
                `Tento týždeň ti energia znamenia ${sign} pomáha spresniť smer.`,
                'Vo vzťahoch pomenuj potrebu bez domýšľania cudzieho zámeru.',
                'V práci daj prednosť jednej dokončiteľnej priorite.',
                'Výzvou bude neplytvať silou na to, čo nevieš ovplyvniť.',
                'Do konca týždňa urob krok, ktorého výsledok dokážeš rozpoznať.'
            ],
            monthly: [
                `Tento mesiac ti energia znamenia ${sign} prináša priestor na vedomú zmenu.`,
                'Vo vzťahoch hovori otvorene a zostaň zvedavý na odpoveď.',
                'V práci prepoj dlhší smer s jedným merateľným cieľom.',
                'Pre svoju energiu striedaj sústredenie s pravidelným odpočinkom.',
                'Nedovoľ, aby neistota rozhodovala namiesto teba.',
                'V polovici mesiaca skontroluj, čo sa opakuje a čo potrebuje úpravu.',
                'Na konci mesiaca si ponechaj návyk, ktorý priniesol skutočný posun.'
            ]
        },
        pl: {
            daily: [
                `Dzisiejsza energia znaku ${sign} zaprasza cię do skupienia na tym, co jest teraz najważniejsze.`,
                'Zauważ, gdzie reagujesz z przyzwyczajenia zamiast dokonać świadomego wyboru.',
                'Wybierz jeden mały krok i wykonaj go jeszcze dziś.'
            ],
            weekly: [
                `W tym tygodniu energia znaku ${sign} pomaga ci doprecyzować kierunek.`,
                'W relacjach nazwij swoją potrzebę bez zgadywania cudzych intencji.',
                'W pracy wybierz jeden priorytet, który możesz naprawdę ukończyć.',
                'Wyzwaniem będzie nie tracić siły na to, czego nie możesz kontrolować.',
                'Do końca tygodnia wykonaj krok, którego efekt potrafisz rozpoznać.'
            ],
            monthly: [
                `W tym miesiącu energia znaku ${sign} otwiera przestrzeń na świadomą zmianę.`,
                'W relacjach mów otwarcie i zachowaj ciekawość wobec odpowiedzi.',
                'W pracy połącz dłuższy kierunek z jednym mierzalnym celem.',
                'Dla swojej energii przeplataj skupienie regularnym odpoczynkiem.',
                'Nie pozwól, aby niepewność podejmowała decyzje za ciebie.',
                'W połowie miesiąca sprawdź, co się powtarza i wymaga korekty.',
                'Pod koniec miesiąca zachowaj nawyk, który przyniósł rzeczywistą zmianę.'
            ]
        }
    };

    return localized[lang][period].join(' ');
}

function buildLuckyNumbers(sign, period) {
    const seed = [...`${sign}:${period}`].reduce((sum, char) => sum + char.codePointAt(0), 0);
    return Array.from({ length: 4 }, (_, index) => ((seed + (index * 11)) % 49) + 1);
}

export function buildHoroscopeFallback({ sign, period = 'daily', lang = 'cs' } = {}) {
    const normalizedPeriod = Object.hasOwn(PERIOD_SENTENCE_COUNTS, period) ? period : 'daily';
    const normalizedLang = Object.hasOwn(FALLBACK_LABELS, lang) ? lang : 'cs';
    const normalizedSign = FALLBACK_SIGN_NORMALIZATION[sign] || sign;
    const profile = CZECH_SIGN_PROFILES[normalizedSign] || CZECH_SIGN_PROFILES.Beran;
    const prediction = normalizedLang === 'cs'
        ? buildCzechPrediction(profile, normalizedPeriod)
        : buildGenericLocalizedPrediction(sign || normalizedSign || 'Beran', normalizedPeriod, normalizedLang);

    return {
        prediction,
        affirmation: normalizedLang === 'cs'
            ? profile.affirmation
            : normalizedLang === 'sk'
                ? 'Dôverujem svojmu vnútornému kompasu a premieňam dnešný vhľad na vedomý krok.'
                : 'Ufam swojemu wewnętrznemu kompasowi i zamieniam dzisiejszy wgląd w świadomy krok.',
        luckyNumbers: buildLuckyNumbers(normalizedSign || 'Beran', normalizedPeriod),
        periodLabel: FALLBACK_LABELS[normalizedLang][normalizedPeriod]
    };
}

export { PERIOD_SENTENCE_COUNTS };
