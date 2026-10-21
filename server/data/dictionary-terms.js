import { symbolMarkup } from '../../scripts/lib/ui-symbols.mjs';

const DICTIONARY_TERMS = [
    // ── ASTROLOGIE ──────────────────────────────────────────────────────────
    {
        slug: 'ascendent',
        title: 'Ascendent',
        category: 'Astrologie',
        short_description: 'Bod horoskopu vypočítaný z času a místa narození. Astrologie jej spojuje s vystupováním navenek, neurčuje ale, jak tě druzí skutečně vnímají.',
        content_html: `
            <p><strong>Ascendent</strong> je bod horoskopu, který v astrologickém výpočtu označuje východní obzor v čase a místě narození. Pro jeho určení je důležitý co nejpřesnější údaj o čase i místě; pokud narození připadá blízko hranice znamení, může nejistota v čase změnit výsledek.</p>
            <p>V astrologických výkladech se Ascendent často spojuje s prvním dojmem nebo způsobem, jak člověk vstupuje do nových situací. Jde o symbolickou interpretaci, ne ověřený popis osobnosti.</p>
            <h2>Ascendent vs. Sluneční znamení</h2>
            <p>Sluneční znamení a Ascendent jsou v astrologii dvě různé části natální mapy. Například některé výklady spojují Slunce ve Štíru s intenzitou a Ascendent ve Lvu s výraznějším vystupováním. Takové asociace ale nezaručují, jak konkrétního člověka uvidí okolí.</p>
            <p>Pokud čteš horoskop, který vychází jen ze Slunce, může být Ascendent dalším symbolem k prozkoumání. Ani jeden z těchto prvků však nevystihuje celou osobnost.</p>
        `,
        related_slugs: ['nativni-karta', 'slunecni-znameni', 'aspekty'],
        linked_blog_slug: 'tajemstvi-12-astrologickych-domu'
    },
    {
        slug: 'retrogradi-planeta',
        title: 'Retrográdní planeta',
        category: 'Astrologie',
        short_description: 'Zdánlivý zpětný pohyb planety pozorovaný ze Země. Astrologie mu přiřazuje symbolické významy; nejde o příčinu jistých komplikací.',
        content_html: `
            <p>Retrográdní pohyb je zdánlivé obrácení směru planety při pozorování ze Země. Planeta ve skutečnosti nezastaví ani se na své dráze neotočí; tento jev souvisí s relativním pohybem Země a planety kolem Slunce.</p>
            <p>Astrologie k retrográdním obdobím přiřazuje různé symbolické výklady. Není doloženo, že by samotný retrográd způsoboval potíže v komunikaci, vztazích, technice nebo rozhodování. Důležitou smlouvu či cestu proto posuzuj podle skutečných okolností, ne pouze podle kalendáře planet.</p>
            <h2>Časté astrologické asociace</h2>
            <ul>
                <li><strong>Merkur:</strong> V moderních výkladech témata komunikace, informací a plánování.</li>
                <li><strong>Venuše:</strong> Často vztahy, hodnoty a to, čemu přikládáš cenu.</li>
                <li><strong>Mars:</strong> Někdy iniciativa, energie a způsob jednání.</li>
            </ul>
            <p>Tyto asociace jsou tradicí, ne pokynem rušit plány ani předpovědí, že se někdo z minulosti vrátí.</p>
        `,
        related_slugs: ['merkur', 'tranizty'],
        linked_blog_slug: null
    },
    {
        slug: 'aspekty',
        title: 'Aspekty',
        category: 'Astrologie',
        short_description: 'Úhlové vztahy mezi planetami v horoskopu. Astrologické tradice je vykládají různými způsoby; samy o sobě nedokazují osobnostní vlastnosti ani události.',
        content_html: `
            <p>Aspekty jsou úhlové vzdálenosti mezi planetami v horoskopu. Astrologie je tradičně rozděluje do skupin a přiřazuje jim symbolické významy. Jde o jeden ze způsobů čtení mapy, nikoli o prokázaný mechanismus, který určuje povahu nebo životní události.</p>
            <h2>Hlavní aspekty</h2>
            <ul>
                <li><strong>Konjunkce (přibližně 0°):</strong> V řadě systémů se chápe jako propojení témat planet.</li>
                <li><strong>Trigon (přibližně 120°):</strong> Často se vykládá jako plynulejší soulad.</li>
                <li><strong>Opozice (přibližně 180°):</strong> Bývá spojována s polaritou nebo hledáním rovnováhy.</li>
                <li><strong>Kvadratura (přibližně 90°):</strong> Některé směry ji čtou jako napětí či otázku k řešení.</li>
                <li><strong>Sextil (přibližně 60°):</strong> V moderní astrologii se často popisuje jako možnost spolupráce mezi tématy.</li>
            </ul>
            <p>Názvy aspektů označují geometrii; jejich psychologický význam je součástí astrologického výkladu a může se lišit podle školy.</p>
        `,
        related_slugs: ['nativni-karta', 'tranizty'],
        linked_blog_slug: 'tajemstvi-12-astrologickych-domu'
    },
    {
        slug: 'nativni-karta',
        title: 'Natální karta (Horoskop)',
        category: 'Astrologie',
        short_description: 'Astrologický diagram polohy nebeských těles pro čas a místo narození. Astrologie jej vykládá symbolicky; není vědecky ověřeným popisem osobnosti ani osudu.',
        content_html: `
            <p>Natální karta (nebo natální horoskop) je astrologický diagram polohy Slunce, Měsíce, planet a dalších bodů pro datum, čas a místo narození. Astrologové jej interpretují pomocí znamení, domů a vzájemných aspektů. Přesnost času narození může ovlivnit výpočet některých částí mapy.</p>
            <p>Jde o rozsáhlejší symbolický systém než horoskop založený pouze na slunečním znamení. Jeho výklady mohou nabídnout témata k zamyšlení, ale nejde o vědecky ověřený test osobnosti ani spolehlivou předpověď budoucnosti.</p>
            <h2>Jaká témata v ní astrologie sleduje?</h2>
            <ul>
                <li><strong>Identita a odpovědnost</strong> (například Slunce a Saturn)</li>
                <li><strong>Prožívání a vztahy</strong> (v astrologické symbolice například Měsíc, Venuše a 7. dům)</li>
                <li><strong>Práce a veřejná role</strong> (například 10. dům a střed nebe)</li>
                <li><strong>Návyky a osobní směr</strong> (Dračí uzly; jejich karmický výklad je otázkou duchovní víry, ne ověřený údaj o minulosti)</li>
                <li><strong>Tvořivost a růst</strong> (v některých výkladech Jupiter a 5. dům)</li>
            </ul>
        `,
        related_slugs: ['ascendent', 'aspekty'],
        linked_blog_slug: 'tajemstvi-12-astrologickych-domu'
    },
    {
        slug: 'saturnosky-navrat',
        title: 'Saturnský návrat',
        category: 'Astrologie',
        short_description: 'Astrologický název pro období, kdy se Saturn vrací přibližně na svou polohu v natální mapě, zhruba po 29,5 letech. Jeho symbolický význam nepředpovídá konkrétní události.',
        content_html: `
            <p>Saturn oběhne Slunce přibližně za 29,5 roku. V astrologii se Saturnský návrat označuje období, kdy se Saturn vrací k poloze, kterou měl v natální mapě při tvém narození. Další návraty přicházejí přibližně v podobném odstupu; přesné načasování závisí na použitém výpočtu.</p>
            <p>Astrologická tradice tento cyklus často používá jako symbol pro bilancování, odpovědnost a změny priorit. Je to interpretační rámec, ne předpověď: nezaručuje krizi, rozchod, svatbu ani jinou konkrétní událost.</p>
            <p>Pokud je pro tebe tento motiv užitečný, můžeš ho využít jako podnět k otázkám: Které závazky si chceš ponechat? Co už ti neslouží? Odpovědi i rozhodnutí zůstávají na tobě.</p>
        `,
        related_slugs: ['aspekty', 'nativni-karta'],
        linked_blog_slug: null
    },

    // ── TAROT ──────────────────────────────────────────────────────────────
    {
        slug: 'velka-arkana',
        title: 'Velká Arkána',
        category: 'Tarot',
        short_description: '22 karet, které v běžném tarotovém balíčku tvoří Velkou Arkánu. V mnoha výkladech se spojují s širšími životními tématy; jejich význam závisí na systému a kontextu.',
        content_html: `
            <p>Běžný tarotový balíček se skládá ze 78 karet: Velkou Arkánu tvoří 22 karet a Malou Arkánu 56. Velká Arkána bývá v mnoha výkladových systémech spojována s výraznějšími životními tématy, ale její význam není ve všech tradicích stejný.</p>
            <p>Někteří autoři vykládají tarot pomocí archetypů a propojují jej s myšlenkami C. G. Junga. Jde o jeden z interpretačních přístupů, ne o vědecky potvrzený popis společné psychiky všech lidí.</p>
            <h2>Cesta Bláznova</h2>
            <p>„Cesta Bláznova“ je oblíbený moderní způsob, jak spojit pořadí karet Velké Arkány do symbolického příběhu. Čtenář v něm může sledovat motivy začátku, zkušeností a završení; nejde o závaznou strukturu všech tarotových tradic ani předpis, jak má probíhat lidský život.</p>
        `,
        related_slugs: ['mala-arkana', 'tarot-blazen', 'spreads'],
        linked_blog_slug: 'lekce-padajici-veze-tarot'
    },
    {
        slug: 'mala-arkana',
        title: 'Malá Arkána',
        category: 'Tarot',
        short_description: '56 karet ve čtyřech barvách: Hůlky, Meče, Číše a Pentakly. V mnoha tarotových systémech se jejich symboly používají k zamyšlení nad každodenními tématy.',
        content_html: `
            <p>Malá Arkána má čtyři barvy, každou se 14 kartami: eso, karty 2–10 a čtyři dvorní karty (Páže, Rytíř, Královna a Král). V řadě současných tarotových systémů se barvy propojují se čtyřmi živly a různými oblastmi života; podrobnosti se mohou lišit podle balíčku a tradice.</p>
            <ul>
                <li><strong>Hůlky (často Oheň):</strong> V některých výkladech inspirace, tvořivost a iniciativa.</li>
                <li><strong>Meče (často Vzduch):</strong> Myšlení, komunikace a rozhodování.</li>
                <li><strong>Číše (často Voda):</strong> Emoce, vztahy a představivost.</li>
                <li><strong>Pentakly (často Země):</strong> Zdroje, práce a praktické záležitosti.</li>
            </ul>
            <p>Tyto asociace mohou posloužit jako slovník symbolů při sebereflexi. Samotná karta ale nepotvrzuje, že se konkrétní hádka, pracovní nabídka nebo vztahová událost skutečně stane.</p>
        `,
        related_slugs: ['velka-arkana'],
        linked_blog_slug: null
    },
    {
        slug: 'tarot-blazen',
        title: 'Blázen (Tarot)',
        category: 'Tarot',
        short_description: 'Nultá karta Velké Arkány. V mnoha současných výkladech se spojuje s novým začátkem, otevřeností a nejistotou; sama o sobě nepředpovídá výsledek.',
        content_html: `
            <p>Blázen je v běžném tarotovém balíčku označen číslem 0. Jeho obraz se v různých balíčcích liší; často se vykládá jako symbol otevřenosti, začátku a vykročení do neznáma.</p>
            <p>V konkrétním výkladu může karta otevřít otázky kolem nové zkušenosti nebo nejistoty. Neznamená ale, že se nový projekt či vztah určitě objeví nebo dobře dopadne. Význam závisí na položené otázce, okolních kartách a použité tradici.</p>
            <p><strong>Obrácený Blázen</strong> se v některých systémech spojuje s neuvážeností nebo naopak váháním. Ber to jako jednu z možností k zamyšlení, ne jako varování před jistou událostí.</p>
        `,
        related_slugs: ['velka-arkana'],
        linked_blog_slug: 'lekce-padajici-veze-tarot'
    },

    // ── NUMEROLOGIE ─────────────────────────────────────────────────────────
    {
        slug: 'zivotni-cislo',
        title: 'Životní číslo',
        category: 'Numerologie',
        short_description: 'Číslo, které některé numerologické směry odvozují z data narození. Naše kalkulačka redukuje den, měsíc a rok zvlášť a v mezikrocích ponechává 11, 22 a 33; výklad je symbolický.',
        content_html: `
            <p>Životní číslo, označované také jako číslo životní cesty, je pojem používaný v numerologii. Různé školy mohou postupovat odlišně. Naše kalkulačka redukuje den, měsíc a rok narození zvlášť, přičemž v mezikrocích zachovává 11, 22 a 33, a pak redukuje jejich součet.</p>
            <h2>Příklad výpočtu</h2>
            <p>Pro datum 15. 8. 1992: den 1+5 = 6; měsíc = 8; rok 1+9+9+2 = 21 → 2+1 = 3. Součet 6+8+3 = 17 → 1+7 = <strong>8</strong>.</p>
            <p>Některé numerologické výklady spojují osmičku s tématy odpovědnosti, zdrojů nebo vlivu. Nejde o ověřený popis člověka. Jako podnět k zamyšlení může posloužit otázka: Jak zacházím se svou odpovědností a tím, co mám k dispozici?</p>
            <p>Číslo proto ber jako symbolický rámec pro vlastní úvahu, ne jako pevný popis osobnosti, životní úkol nebo předpověď.</p>
        `,
        related_slugs: ['mistrovska-cisla'],
        linked_blog_slug: 'zivotni-cislo-odhaleni-kodu-vasi-duse'
    },
    {
        slug: 'mistrovska-cisla',
        title: 'Mistrovská čísla (11, 22, 33)',
        category: 'Numerologie',
        short_description: 'Některé numerologické směry označují 11, 22 a 33 za mistrovská čísla a při redukci je ponechávají. Jejich významy jsou symbolické, ne ověřené vlastnosti člověka.',
        content_html: `
            <p>V některých numerologických směrech se čísla 11, 22 a 33 označují jako <strong>mistrovská čísla</strong> a při redukci se ponechávají. Jiné postupy se mohou lišit; i naše kalkulačka je zachovává v mezikrocích. Samotné označení ani tradiční výklady nejsou vědecky ověřeným měřením schopností nebo povahy.</p>
            <h2>Tradiční symbolická témata</h2>
            <ul>
                <li><strong>11:</strong> V některých výkladech se spojuje s inspirací a intuicí. Může otevřít otázku, kterým nápadům chceš věnovat pozornost.</li>
                <li><strong>22:</strong> Tradičně se spojuje s plánováním a uskutečňováním záměrů. Může připomenout otázku, jak převést důležitý záměr do malého konkrétního kroku.</li>
                <li><strong>33:</strong> Bývá spojováno s péčí a předáváním zkušeností. Může otevřít otázku, jak podporovat druhé a přitom respektovat vlastní hranice.</li>
            </ul>
            <p>Jde o náměty z numerologické tradice, nikoli o předpoklady o tom, kdo má dané číslo, ani o měřítko jeho hodnoty.</p>
        `,
        related_slugs: ['zivotni-cislo'],
        linked_blog_slug: 'zivotni-cislo-odhaleni-kodu-vasi-duse'
    },

    // ── KARMA & SPIRITUALITA ─────────────────────────────────────────────────
    {
        slug: 'karma',
        title: 'Karma',
        category: 'Spiritualita',
        short_description: 'Pojem pro jednání a jeho důsledky v různých indických náboženských a filozofických tradicích. Význam se mezi směry liší; nejde o ověřitelný zákon, že se každému vše vrátí stejnou měrou.',
        content_html: `
            <p>Slovo karma pochází ze sanskrtu a souvisí s činem či jednáním. V hinduistických, buddhistických, džinistických a dalších indických náboženských a filozofických tradicích se pojem vztahuje k jednání a jeho důsledkům. Konkrétní výklad se mezi směry liší.</p>
            <p>V populárním podání se karma někdy zjednodušuje na větu „co vyšleš, to se ti vrátí“. Tu můžeš brát jako osobní připomínku, že na jednání záleží; není to ale měřitelný ani pro každého ověřený zákon. Karmou proto nelze spolehlivě vysvětlovat, proč někdo trpí, ani jeho situaci označovat za zasloužený trest.</p>
            <h2>Karma a astrologie</h2>
            <p>V karmické astrologii se Severní a Jižní lunární uzel vykládají jako symbolická témata osobního příběhu. Jde o astrologickou interpretaci, ne o ověřitelný záznam minulých životů nebo předpověď toho, co se musí stát.</p>
        `,
        related_slugs: ['reinkarnace', 'draci-uzly'],
        linked_blog_slug: 'iluze-spriznene-duse-karmicke-vztahy'
    },
    {
        slug: 'reinkarnace',
        title: 'Reinkarnace',
        category: 'Spiritualita',
        short_description: 'Duchovní představa, že život po smrti pokračuje novým zrozením. Výklady se mezi tradicemi liší; astrologie ji nedokládá jako ověřenou skutečnost.',
        content_html: `
            <p>Reinkarnace označuje představu, že se život po smrti znovu rodí v novém těle. Související učení o znovuzrození se objevuje v hinduistických, džinistických a buddhistických tradicích, ale přesná představa o tom, co pokračuje, se liší. Nelze ji jednoduše shrnout jako stejnou víru v neměnnou duši.</p>
            <p>Někteří lidé chápou znovuzrození jako součást duchovní cesty a vycházejí přitom ze své víry. Není to obecně ověřená skutečnost. Výklad karet ani horoskop proto nemůže spolehlivě určit, kým jsi byl v minulém životě nebo jaké si z něj neseš „dluhy“.</p>
            <h2>Reinkarnace a astrologie</h2>
            <p>V karmické astrologii mohou lunární uzly sloužit jako symboly témat, která chceš prozkoumat v současném životě. Jde o astrologickou interpretaci, ne o důkaz minulých vtělení. Můžeš ji využít jako podnět k otázce: které svoje návyky chceš zachovat a které už ti neslouží?</p>
        `,
        related_slugs: ['karma', 'draci-uzly'],
        linked_blog_slug: null
    },
    {
        slug: 'draci-uzly',
        title: 'Dračí uzly (Severní a Jižní)',
        category: 'Astrologie',
        short_description: 'Dva matematické body v horoskopu. Astrologie je někdy vykládá jako symbol minulých návyků a směru osobního rozvoje; nejde o důkaz minulých životů.',
        content_html: `
            <p>Dračí uzly nejsou planety, ale dva matematické body: místa, kde dráha Měsíce protíná ekliptiku, tedy zdánlivou dráhu Slunce. V horoskopu leží proti sobě.</p>
            <ul>
                <li><strong>Jižní uzel:</strong> V některých astrologických výkladech symbolizuje známé vzorce, návyky nebo témata minulosti. Karmická astrologie jej může spojovat s minulými životy, ale tato interpretace je otázkou víry, ne ověřitelným údajem o tvé minulosti.</li>
                <li><strong>Severní uzel:</strong> Astrologie jej někdy používá jako symbol směru, který můžeš zkoumat při osobním rozvoji. Neurčuje jediný správný cíl ani nezaručuje, že určitá cesta přinese naplnění.</li>
            </ul>
            <p>Tranzity přes uzly ani zatmění samy o sobě nedokládají, že se blíží přelomová událost. Pokud ti tento symbolický rámec sedí, může posloužit k zamyšlení: který známý návyk ti pomáhá a který bys chtěl změnit?</p>
        `,
        related_slugs: ['karma', 'reinkarnace', 'nativni-karta'],
        linked_blog_slug: 'iluze-spriznene-duse-karmicke-vztahy'
    },

    // ── VĚŠTĚNÍ ─────────────────────────────────────────────────────────────
    {
        slug: 'synchronicita',
        title: 'Synchronicita',
        category: 'Spiritualita',
        short_description: 'Pojem pro události, které člověk vnímá jako smysluplnou shodu, i když mezi nimi není zřejmá příčinná souvislost.',
        content_html: `
            <p><em>Synchronicita</em> označuje události, které člověku připadají smysluplně propojené, přestože mezi nimi není zřejmý příčinný vztah. Osobní význam si můžeš všimnout, ale samotná shoda nedokazuje zprávu zvenčí.</p>
            <p>Například na někoho myslíš a on ti krátce poté napíše. Načasování může působit zvláštně; z jedné situace ale nelze určit, zda šlo o něco víc než náhodu.</p>
            <p>V duchovních tradicích se tarot, runy nebo numerologie někdy používají jako symbolická zrcadla pro otázku. Neověřují budoucnost a jejich výklad nemusí přesně popsat tvoji situaci.</p>
        `,
        related_slugs: ['akasicke-zaznamy'],
        linked_blog_slug: 'andelska-cisla-1111'
    },
    {
        slug: 'akasicke-zaznamy',
        title: 'Akášické záznamy',
        category: 'Spiritualita',
        short_description: 'Ezoterický pojem pro představu duchovního archivu všech událostí. Jde o duchovní tradici, ne ověřenou databázi informací.',
        content_html: `
            <p>V některých ezoterických směrech se <em>Akášické záznamy</em> popisují jako nehmotný archiv všech událostí. Jde o duchovní představu, ne o ověřený zdroj, ze kterého lze nezávisle zjišťovat fakta.</p>
            <p>Autoři a praktikující někdy mluví o přístupu přes meditaci, sny, regresi nebo channeling. Prožitek ani vzpomínku z těchto postupů ale nelze samy o sobě ověřit jako záznam minulého života nebo budoucnosti.</p>
            <h2>Jak s touto představou pracovat</h2>
            <p>Pokud tě tento pojem inspiruje, můžeš ho použít jako rámec k zamyšlení a přitom rozlišovat vlastní interpretaci od ověřitelných informací. U důležitých rozhodnutí se opři o konkrétní skutečnosti.</p>
        `,
        related_slugs: ['synchronicita', 'reinkarnace'],
        linked_blog_slug: 'tajemstvi-kristalove-koule-scrying'
    },

    // ── RUNY ────────────────────────────────────────────────────────────────
    {
        slug: 'fehu',
        title: 'Fehu (Runa)',
        category: 'Runosloví',
        short_description: 'První runa staršího Futharku se zvukovou hodnotou „f“. Její jméno se pojí s dobytkem či majetkem; dnešní věštecké významy jsou symbolické interpretace.',
        content_html: `
            <p><strong>Fehu</strong> je první runou staršího Futharku a označuje zvuk „f“. Její rekonstruované jméno souvisí s dobytkem či majetkem. Runy sloužily především jako písmo; jejich význam v dnešním věšteckém výkladu nelze odvodit jen z názvu.</p>
            <h2>Současné symbolické asociace</h2>
            <p>Některé moderní výklady spojují Fehu se zdroji, majetkem nebo péčí o to, co člověk vlastní. Je to podnět k úvaze, ne předpověď příjmu, úspěchu podnikání ani doporučení investovat.</p>
            <p>Obrácená poloha se v některých systémech čte jako otázka plýtvání či zacházení se zdroji. Ani ona sama nepředpovídá finanční ztrátu.</p>
        `,
        related_slugs: ['hagalaz', 'tiwaz'],
        linked_blog_slug: 'runy-severska-magie-v-modernim-svete'
    },
    {
        slug: 'hagalaz',
        title: 'Hagalaz (Runa)',
        category: 'Runosloví',
        short_description: 'Runa staršího Futharku spojená s hláskou „h“ a názvem pro krupobití. Její moderní věštecké významy neoznamují jistou krizi ani změnu.',
        content_html: `
            <p><strong>Hagalaz</strong> je runa staršího Futharku se zvukovou hodnotou „h“; její jméno souvisí s krupobitím. Z tohoto původu vycházejí některé dnešní symbolické výklady, nejde však o předpověď událostí.</p>
            <h2>Možný podnět k zamyšlení</h2>
            <p>V moderní runové symbolice se Hagalaz někdy spojuje s narušením plánů nebo změnou. Vytažená runa ale neznamená, že přijde krize, ani že těžká událost byla „nutná“ nebo zasloužená.</p>
            <p>Můžeš si položit otázku: Kterou změnu skutečně řeším a co je v mé moci udělat? Význam zůstává osobní interpretací, ne jistou zprávou o budoucnosti.</p>
        `,
        related_slugs: ['fehu', 'tiwaz'],
        linked_blog_slug: 'runy-severska-magie-v-modernim-svete'
    },
    {
        slug: 'tiwaz',
        title: 'Tiwaz (Runa)',
        category: 'Runosloví',
        short_description: 'Runa staršího Futharku pro zvuk „t“, jejíž jméno se spojuje s bohem Týrem. Dnešní výklady ji někdy pojí s odvahou a férovostí; nejsou věštbou výsledku.',
        content_html: `
            <p><strong>Tiwaz</strong> označuje runu pro zvuk „t“ ve starším Futharku. Její jméno se spojuje se severským bohem Týrem. Příběhy o Týrovi, včetně jeho vztahu k vlku Fenrirovi, patří do mytologie.</p>
            <h2>Současné výklady</h2>
            <p>V dnešních esoterických výkladech se Tiwaz někdy pojí s odvahou, odpovědností nebo férovostí. Nejde o doloženou věštbu ani záruku, že spor dopadne spravedlivě.</p>
            <p>Jako symbol si ji můžeš vzít k otázce: Které rozhodnutí odpovídá mým hodnotám a co potřebuji vědět, než jednám? Odpověď hledej také v konkrétních okolnostech, ne pouze v runě.</p>
        `,
        related_slugs: ['fehu', 'hagalaz'],
        linked_blog_slug: 'runy-severska-magie-v-modernim-svete'
    },

    // ── ČAKRY ───────────────────────────────────────────────────────────────
    {
        slug: 'muladhara',
        title: 'Muladhara – Kořenová čakra',
        category: 'Energie',
        short_description: 'Čakra v některých tantrických a moderních duchovních systémech. V často používaném sedmičkovém schématu se spojuje se stabilitou; nejde o anatomickou strukturu ani zdravotní měření.',
        content_html: `
            <p>Muladhara se objevuje v některých indických tantrických a jógových tradicích i v dnešních duchovních výkladech. Počet, umístění a významy čaker se mezi systémy liší; známé schéma sedmi čaker není jedinou podobou těchto učení.</p>
            <p>V současných výkladech se Muladhara často spojuje se stabilitou, bezpečím, červenou barvou nebo elementem země. Jde o symbolické asociace, nikoli o anatomický orgán, měřitelnou energii nebo ukazatel tělesného zdraví.</p>
            <h2>Otázky k zamyšlení</h2>
            <p>Pokud ti tento symbolický jazyk vyhovuje, můžeš si položit otázku: Co mi v běžném životě dává pocit opory? Odpověď může být konkrétní vztah, návyk nebo praktický plán; není třeba vysvětlovat nejistotu „blokovanou čakrou“.</p>
            <ul>
                <li>Zapsat si, o co se můžeš opřít právě teď.</li>
                <li>Všímat si, které malé každodenní návyky ti vyhovují.</li>
                <li>Pokud používáš meditaci nebo mantru, chápat ji jako osobní praxi, ne záruku bezpečí či léčby.</li>
            </ul>
        `,
        related_slugs: ['svadhisthana', 'anahata'],
        linked_blog_slug: 'zaklady-sedmi-caker-anatomie'
    },
    {
        slug: 'svadhisthana',
        title: 'Svadhisthana – Sakrální čakra',
        category: 'Energie',
        short_description: 'Čakra v některých duchovních systémech. V moderním sedmičkovém výkladu se symbolicky pojí s tvořivostí a emocemi; nejde o diagnózu ani tělesný orgán.',
        content_html: `
            <p>Svadhisthana se řadí do některých schémat čaker, ale jejich počet i podoba se podle tradice liší. V současném sedmičkovém výkladu se často kreslí v oblasti podbřišku a spojuje s vodou, oranžovou barvou, emocemi a tvořivostí. Jde o symboliku, ne o skutečné centrum, jehož „blokace“ by vysvětlovala psychické potíže.</p>
            <h2>Symbol tvořivosti a emocí</h2>
            <p>Motiv může posloužit jako podnět k zamyšlení: Která činnost ti dělá radost? Které emoce chceš bezpečně pojmenovat? Odpovědi ani případné obtíže nelze určit podle polohy čakry.</p>
        `,
        related_slugs: ['muladhara', 'anahata'],
        linked_blog_slug: 'zaklady-sedmi-caker-anatomie'
    },
    {
        slug: 'anahata',
        title: 'Anahata – Srdeční čakra',
        category: 'Energie',
        short_description: 'Čakra ve vybraných duchovních systémech, často symbolicky spojovaná se srdcem, soucitem a vztahy. Její výklad neurčuje zdraví ani schopnost milovat.',
        content_html: `
            <p>Anahata je součástí některých čakerových systémů. V běžném moderním sedmičkovém schématu se řadí jako čtvrtá a spojuje se se srdcem, soucitem a vztahy. Jiné tradice mohou čakerám přiřazovat odlišné významy, barvy nebo uspořádání.</p>
            <p>Tyto asociace můžeš použít jako symbolický podnět k otázce, jak chceš pečovat o vztahy a své hranice. Poloha čaker ale neměří zdraví, neurčuje schopnost milovat ani neodhaluje rodinné trauma.</p>
            <p>Pokud ti vyhovuje meditace nebo práce s obrazem zeleného světla, může jít o osobní duchovní praxi. Není to náhrada odborné péče ani slib, že se vyřeší psychické nebo tělesné obtíže.</p>
        `,
        related_slugs: ['muladhara', 'svadhisthana'],
        linked_blog_slug: 'zaklady-sedmi-caker-anatomie'
    },

    // ── SEN ─────────────────────────────────────────────────────────────────
    {
        slug: 'lucidni-sen',
        title: 'Lucidní sen',
        category: 'Snář',
        short_description: 'Ve snu si uvědomíš, že sníš. Někdy můžeš ovlivnit jeho průběh, ale kontrola obsahu není podmínkou lucidního snu.',
        content_html: `
            <p>Lucidní sen je sen, ve kterém si během snění uvědomíš, že právě sníš. Někdy se podaří ovlivnit, co se bude dít, ale míra kontroly se liší a není nutnou podmínkou lucidity. Samotný živý nebo neobvyklý sen tedy ještě neznamená, že byl lucidní.</p>
            <p>Ve spánkových studiích se někteří účastníci domluvili na jednoduchém pohybu očí, kterým dali vědcům během snu signál. Přístroje tento signál zachytily v průběhu REM spánku; lucidní snění se tak zkoumá i laboratorně.</p>
            <h2>Co někteří lidé zkoušejí</h2>
            <p>Následující postupy se používají pro lepší vybavení snů nebo jako pokus o rozpoznání snu. Nezaručují lucidní sen a výsledky se mohou lišit.</p>
            <ul>
                <li><strong>Zápis snů:</strong> Po probuzení si poznamenej, co si pamatuješ. Pomůže ti sledovat vlastní vzpomínky a opakující se motivy.</li>
                <li><strong>Všímání během dne:</strong> Někteří lidé si v bdělém stavu připomínají otázku „Sním právě teď?“. Přenos tohoto návyku do snu není jistý.</li>
                <li><strong>MILD:</strong> Před usnutím si můžeš připomenout záměr všimnout si, že sníš. Ani tato technika nezaručuje výsledek.</li>
            </ul>
        `,
        related_slugs: [],
        linked_blog_slug: 'psychologie-snu-stici-stromy'
    },

    // ── ANDĚLÉ & NUMEROLOGIE ─────────────────────────────────────────────────
    {
        slug: 'andelska-cisla',
        title: 'Andělská čísla',
        category: 'Numerologie',
        short_description: 'Některé duchovní směry vykládají opakující se čísla (111, 222, 333…) jako symboly. Jde o osobní interpretace, ne ověřené zprávy nebo předpovědi.',
        content_html: `
            <p>V některých numerologických a duchovních směrech se opakující čísla na hodinách, účtenkách nebo jinde vykládají jako takzvaná <strong>andělská čísla</strong>. Tyto významy jsou symbolickou tradicí, ne důkazem, že ti někdo posílá zprávu nebo předpovídá budoucnost.</p>
            <p>Číselný vzor si můžeš vzít jako připomínku zastavit se a všimnout si, co právě řešíš. Konkrétní výklady se mezi směry liší a žádný z nich nemůže sám potvrdit, co se stane.</p>
            <h2>Časté symbolické asociace</h2>
            <p>Následující témata jsou jen možné podněty k zamyšlení. Nejde o pevná poselství ani doporučení jednat bez ohledu na skutečné okolnosti.</p>
            <ul>
                <li><strong>111:</strong> Začátek nebo iniciativa – jaký malý první krok je teď proveditelný?</li>
                <li><strong>222:</strong> Spolupráce a trpělivost – čemu potřebuješ dát čas nebo jakou domluvu otevřít?</li>
                <li><strong>333:</strong> Podpora a tvořivost – na koho se můžeš obrátit nebo co chceš vyjádřit?</li>
                <li><strong>444:</strong> Stabilita – o jaký konkrétní fakt nebo návyk se můžeš opřít?</li>
                <li><strong>555:</strong> Změna – co máš ve své moci ovlivnit a co zatím nevíš?</li>
                <li><strong>777:</strong> Zkoumání a učení – co si chceš ověřit, než se rozhodneš?</li>
                <li><strong>888:</strong> Zdroje a rovnováha – jak zacházíš se svým časem, energií nebo penězi?</li>
                <li><strong>999:</strong> Dokončení – co můžeš uzavřít a co si ještě potřebuješ promyslet?</li>
            </ul>
        `,
        related_slugs: ['synchronicita', 'zivotni-cislo'],
        linked_blog_slug: 'andelska-cisla-1111'
    },
    {
        slug: 'lilith-cerna-luna',
        title: 'Lilith (Černá Luna)',
        category: 'Astrologie',
        short_description: 'Černá Luna Lilith je astrologický výpočtový bod spojený s apogeem Měsíce. Výklad je symbolický a může se lišit podle použité metody i astrologické školy.',
        content_html: `
            <p><strong>Černá Luna Lilith</strong> není planeta ani fyzické těleso. V astrologických mapách označuje vypočítaný bod spojený s apogeem Měsíce. Používají se různé varianty, například střední a pravé/oskulující apogeum, které nemusí mít stejnou polohu.</p>
            <p>Někteří astrologové spojují Lilith s autonomií, osobními hranicemi nebo tématy, o nichž se obtížně mluví. Jde o symbolické asociace, které se mezi školami liší; výpočet nedokládá trauma, skrytou povahu ani budoucí události.</p>
            <h2>Otázka k zamyšlení</h2>
            <p>Pokud ti tento symbolický jazyk vyhovuje, můžeš se zeptat: Kterou vlastní potřebu nebo hranici chci pojmenovat jasněji? Horoskop za tebe neurčí odpověď.</p>
        `,
        related_slugs: ['nativni-karta', 'ascendent'],
        linked_blog_slug: 'lilith-v-natalni-karte'
    },
    {
        slug: 'descendent',
        title: 'Descendent (DC)',
        category: 'Astrologie',
        short_description: 'Bod v horoskopu naproti Ascendentu, který označuje začátek 7. domu. Astrologie jej spojuje s blízkými vztahy; neurčuje partnera ani kompatibilitu.',
        content_html: `
            <p><strong>Descendent (DC)</strong> leží v horoskopu naproti Ascendentu a označuje začátek 7. domu. Astrologie jej symbolicky propojuje s blízkými vztahy a spoluprací. Výpočet závisí mimo jiné na čase a místě narození.</p>
            <h2>Jak se Descendent vykládá?</h2>
            <p>V astrologických tradicích může znamení Descendentu otevřít témata, nad kterými se chceš ve vztazích zamyslet. Samo o sobě ale neodhaluje, koho potkáš, jaké bude manželství ani zda se k sobě dva lidé hodí.</p>
            <ul>
                <li><strong>Vzájemnost:</strong> Jak ve vztazích hledáš rovnováhu mezi vlastními potřebami a potřebami druhého?</li>
                <li><strong>Spolupráce:</strong> Jaké dohody, hranice a očekávání chceš ve vztazích pojmenovat?</li>
                <li><strong>Rozdílnost:</strong> Co tě na druhých přitahuje nebo překvapuje, aniž by to muselo být předem dané horoskopem?</li>
            </ul>
            <p>Někteří astrologové porovnávají při synastrii dvě natální mapy. Jde o symbolický výklad, který nedokáže spolehlivě změřit kvalitu ani budoucnost vztahu.</p>
        <div style="margin-top:2rem; padding: 1.5rem; background: rgba(91,132,151,0.12); border-left: 3px solid #bd9b65; border-radius:0 4px 4px 0;">
        <p style="margin:0; font-size:1.1rem; color:var(--color-mystic-gold); font-family: 'Cinzel', serif;">${symbolMarkup('partner', true)} <strong>Chceš prozkoumat partnerskou shodu?</strong></p>
        <p style="margin:0.5rem 0 0 0; font-size:0.9rem; color:var(--color-text-mutated);">Otevři nástroj Partnerská shoda a podívej se na astrologický pohled na vaše data narození.</p>
        <div style="margin-top: 1rem;">
            <a href="../partnerska-shoda.html" class="btn btn--primary" style="font-size:0.9rem; padding: 0.5rem 1rem;">Otevřít Partnerskou shodu →</a>
        </div>
    </div>`,
        related_slugs: ['ascendent', 'nativni-karta'],
        linked_blog_slug: null
    },
    {
        slug: 'chiron',
        title: 'Chiron („Zraněný léčitel“)',
        category: 'Astrologie',
        short_description: 'Malé těleso ve Sluneční soustavě, které astrologie symbolicky spojuje s citlivostí a osobním růstem. Horoskop ale neurčuje trauma ani léčebný postup.',
        content_html: `
            <p><strong>Chiron</strong> je malé těleso Sluneční soustavy. V astrologii se mu říká „Zraněný léčitel“ podle postavy z řecké mytologie. Astrologické významy jsou symbolické a mezi autory se mohou lišit.</p>
            <h2>Symbolický výklad</h2>
            <p>V některých výkladech může Chiron představovat citlivé téma, nejistotu nebo zkušenost, které člověk věnuje pozornost. Z jeho polohy ale nelze určit, zda někdo prožil trauma, jaké má psychické potíže ani jakou podporu potřebuje.</p>
            <ul>
                <li><strong>Citlivost:</strong> Jaké téma v tobě vyvolává nejistotu a co ti pomáhá cítit se bezpečněji?</li>
                <li><strong>Zkušenost a empatie:</strong> Minulá zkušenost může ovlivnit, jak rozumíš druhým, ale není povinností proměnit bolest v „dar“.</li>
                <li><strong>Podpora:</strong> Astrologický symbol nenahrazuje rozhovor s odborníkem ani péči, kterou si sám zvolíš.</li>
            </ul>

        <div style="margin-top:2rem; padding: 1.5rem; background: rgba(91,132,151,0.12); border-left: 3px solid #bd9b65; border-radius:0 4px 4px 0;">
        <p style="margin:0; font-size:1.1rem; color:var(--color-mystic-gold); font-family: 'Cinzel', serif;">${symbolMarkup('chart', true)} <strong>Chceš se podívat na svou natální mapu?</strong></p>
        <p style="margin:0.5rem 0 0 0; font-size:0.9rem; color:var(--color-text-mutated);">Prozkoumej astrologický diagram a jeho symbolické souvislosti. Nejde o diagnózu ani jistý popis tvé osobnosti.</p>
        <div style="margin-top: 1rem;">
            <a href="../natalni-karta.html" class="btn btn--primary" style="font-size:0.9rem; padding: 0.5rem 1rem;">Otevřít natální kartu →</a>
        </div>
    </div>`,
        related_slugs: ['karma', 'karmicky-uzel'],
        linked_blog_slug: 'chiron-raneny-lecitel-natalni-karta'
    },
    {
        slug: 'spankova-paralyza',
        title: 'Spánková Paralýza',
        category: 'Snář',
        short_description: 'Krátká neschopnost pohnout se nebo promluvit při usínání či probouzení. Může být spojena se živými vjemy; nejde o důkaz nadpřirozeného dění.',
        content_html: `
            <p><strong>Spánková paralýza</strong> je krátkodobá neschopnost pohnout se nebo promluvit při usínání či probouzení. Člověk si přitom může uvědomovat okolí. Epizodu někdy doprovází pocit přítomnosti, tlak na hrudi nebo jiné živé vjemy a může působit děsivě.</p>
            <p>Dochází k ní při přechodu mezi spánkem a bděním, když se vědomí probouzí, zatímco dočasné znehybnění svalů spojené s REM spánkem ještě trvá. Přesná příčina není vždy jasná. S epizodami se pojí například nedostatek spánku, nepravidelný režim nebo spaní na zádech; nejde však o jistou příčinu každého případu. Pokud se opakují a výrazně narušují spánek nebo tě znepokojují, prober je s lékařem.</p>
            <h2>Jak se na zážitek dívat</h2>
            <p>Různé kultury si podobné vjemy vykládaly duchovně. Tyto příběhy mohou být součástí tradice, samy o sobě však nedokládají astrální cestování ani přítomnost bytosti.</p>
            <ul>
                <li><strong>Vjemy při probouzení:</strong> Někomu se může zdát, že je v místnosti další člověk, nebo může cítit tlak či pohyb. Vjem může být skutečně intenzivní, ale není spolehlivým důkazem, že tam někdo byl.</li>
                <li><strong>Osobní význam:</strong> Pokud si chceš zážitek symbolicky vyložit, odděl vlastní asociace od toho, co lze o spánkové paralýze doložit.</li>
            </ul>

        <div style="margin-top:2rem; padding: 1.5rem; background: rgba(91,132,151,0.12); border-left: 3px solid #bd9b65; border-radius:0 4px 4px 0;">
        <p style="margin:0; font-size:1.1rem; color:var(--color-mystic-gold); font-family: 'Cinzel', serif;">${symbolMarkup('dream', true)} <strong>Chceš si zážitek zapsat?</strong></p>
        <p style="margin:0.5rem 0 0 0; font-size:0.9rem; color:var(--color-text-mutated);">Digitální Snář může nabídnout možné symbolické asociace. Neurčí diagnózu ani jediný správný význam snu.</p>
        <div style="margin-top: 1rem;">
            <a href="../snar.html" class="btn btn--primary" style="font-size:0.9rem; padding: 0.5rem 1rem;">Otevřít Digitální Snář →</a>
        </div>
    </div>`,
        related_slugs: ['lucidni-sen', 'akasicke-zaznamy'],
        linked_blog_slug: null
    },
    {
        slug: 'andelske-cislo-1111',
        title: 'Andělské Číslo 11:11',
        category: 'Numerologie',
        short_description: 'V některých numerologických směrech se 11:11 vykládá jako symbol pozornosti, záměru a synchronicity. Jde o duchovní interpretaci, ne o důkaz nebo předpověď.',
        content_html: `
            <p>Opakovaný čas <strong>11:11</strong> někteří lidé vnímají jako smysluplnou shodu a spojují ho s takzvanými <strong>andělskými čísly</strong>. Samotný vzorec ale nedokazuje, že jde o zprávu, předpověď nebo zásah zvenčí.</p>

            <h2>Jak se 11:11 vykládá</h2>
            <p>V některých numerologických a duchovních směrech se jednička spojuje se začátkem a záměrem, zatímco 11 bývá označováno za mistrovské číslo. Výklad čtyř jedniček jako „energetického portálu“ je symbolická představa, ne ověřený jev.</p>

            <ul>
                <li><strong>Pozornost k záměru:</strong> Zastav se a všimni si, čemu právě věnuješ pozornost. Čas na hodinách sám o sobě nemění události, ale může připomenout, jaký krok chceš udělat.</li>
                <li><strong>Osobní souvislost:</strong> Pokud se ti 11:11 často připomíná, můžeš si zapsat, co se v tu chvíli děje a co je pro tebe důležité. Význam si vykládá každý po svém; není to potvrzení zvláštního stavu vědomí.</li>
                <li><strong>Duchovní interpretace:</strong> Některé směry spojují 11:11 s intuicí nebo podporou. Z čísla ale nelze ověřit, že ti někdo posílá zprávu nebo že jsi na určité životní cestě.</li>
            </ul>

        <div style="margin-top:2rem; padding: 1.5rem; background: rgba(91,132,151,0.12); border-left: 3px solid #bd9b65; border-radius:0 4px 4px 0;">
        <p style="margin:0; font-size:1.1rem; color:var(--color-mystic-gold); font-family: 'Cinzel', serif;">${symbolMarkup('angel', true)} <strong>Zajímají tě výklady andělských karet?</strong></p>
        <p style="margin:0.5rem 0 0 0; font-size:0.9rem; color:var(--color-text-mutated);">V Andělské poště můžeš prozkoumat tradiční duchovní výklady čísel. Ber je jako symbolický podnět, ne jako ověřenou zprávu zvenčí.</p>
        <div style="margin-top: 1rem;">
            <a href="../andelske-karty.html" class="btn btn--primary" style="font-size:0.9rem; padding: 0.5rem 1rem;">Otevřít Andělskou Poštu →</a>
        </div>
    </div>`,
        related_slugs: ['andelska-cisla', 'synchronicita', 'mistrovska-cisla'],
        linked_blog_slug: null
    },
    {
        slug: 'uplnek',
        title: 'Úplněk',
        category: 'Spiritualita',
        short_description: 'Fáze Měsíce s maximální světelnou a energetickou silou, ovlivňující emoce, spánek i duchovní projevy.',
        content_html: `
            <p><strong>Úplněk</strong>, známý z latinského plenilunium, je astronomicky momentem, kdy se Země ocitne přesně mezi Sluncem a Měsícem. Měsíční disk je plně osvětlen a svítí na obloze svou největší intenzitou. Astrologicky jde ale o velmi náročný aspekt – aspekt takzvané Opozice (napětí 180°) mezi Sluncem a Lunou.</p>

            <h2>Vliv Úplňku na Tělo a Psychiku</h2>
            <p>I vědecké studie prokazují, že gravitace fáze úplňku ovlivňuje lidské tělo. V mytologii a astrologii jde o čas napětí i zázraků:</p>
            <ul>
                <li><strong>Emoční exploze:</strong> Věci, které jsme po celý cyklus dusili dovnitř, mohou ve světle úplňku přerůst v dramatickou hádku nebo pláč. Odtud pochází historické mýty o vlkodlacích ("lunatics").</li>
                <li><strong>Problémy se spánkem:</strong> Je naprosto běžné pociťovat v den úplňku roztěkanost a mělký spánek plný živých a vizuálně jasných snů.</li>
                <li><strong>Dokončování a Propouštění:</strong> Úplněk je časem sklizně a uvolňování. Zatímco za novoluní si tvoříme nové cíle, o úplňku bychom měli odpouštět a opouštět návyky, ty které nám už neslouží.</li>
            </ul>

        <div style="margin-top:2rem; padding: 1.5rem; background: rgba(91,132,151,0.12); border-left: 3px solid #bd9b65; border-radius:0 4px 4px 0;">
        <p style="margin:0; font-size:1.1rem; color:var(--color-mystic-gold); font-family: 'Cinzel', serif;">${symbolMarkup('wave', true)} <strong>Cítíte se rozhození?</strong></p>
        <p style="margin:0.5rem 0 0 0; font-size:0.9rem; color:var(--color-text-mutated);">Ověřte si, v jaké fázi se právě nachází Měsíc, a zkontrolujte si svou emocionální, fyzickou a intelektuální křivku v naší sekci Biorytmy.</p>
        <div style="margin-top: 1rem;">
            <a href="../biorytmy.html" class="btn btn--primary" style="font-size:0.9rem; padding: 0.5rem 1rem;">Zjistit moji aktuální křivku a fázi měsíce →</a>
        </div>
    </div>`,
        related_slugs: ['aspekty', 'retrogradi-planeta'],
        linked_blog_slug: null
    }
];

export default DICTIONARY_TERMS;
