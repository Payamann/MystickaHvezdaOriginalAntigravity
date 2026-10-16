// js/cinsky-horoskop.js

const CHINESE_ANIMALS = {
    krysa: {
        name: 'Krysa', symbol: '子', fixedElement: 'Voda', years: '1900,1912,1924,1936,1948,1960,1972,1984,1996,2008,2020',
        desc: 'Krysa v tradiční symbolice představuje všímavost a hledání dostupných možností. Kde ti dnes pomůže dobře položená otázka?',
        love: 'Všimni si, co si s druhým člověkem opravdu říkáte a co si jen domýšlíš. Jednu nejasnost pojmenuj přímo.',
        career: 'Před dalším úkolem si sepiš, co už máš k dispozici. Třeba chybí jeden rozhovor, ne celý nový plán.',
        y2026: 'V tradičním čínském zvěrokruhu se rok Koně spojuje s pohybem a samostatností. Jako Krysa můžeš tenhle motiv využít k zamyšlení: kde ti prospívá plán a kde větší pružnost?',
        good: ['Drak', 'Opice', 'Buvol'], bad: ['Kůň', 'Kohout']
    },
    buvol: {
        name: 'Buvol', symbol: '丑', fixedElement: 'Země', years: '1901,1913,1925,1937,1949,1961,1973,1985,1997,2009,2021',
        desc: 'Buvol nabízí obraz vytrvalosti a práce, která dozrává postupně. Zvaž, co chceš držet pravidelně a co už děláš jen ze zvyku.',
        love: 'Spolehlivost má konkrétní podobu: malou dohodu, kterou oba znáte. U jedné takové dohody si ověř vzájemné očekávání.',
        career: 'Vyber jeden rozpracovaný úkol a dokonči jeho nejmenší užitečnou část.',
        y2026: 'Motiv roku Koně v čínské tradici zdůrazňuje pohyb, zatímco Buvol bývá spojován s vytrvalostí. Můžeš si položit otázku, kde se vyplatí držet plán a kde připustit změnu.',
        good: ['Had', 'Kohout', 'Krysa'], bad: ['Koza', 'Pes']
    },
    tygr: {
        name: 'Tygr', symbol: '寅', fixedElement: 'Dřevo', years: '1902,1914,1926,1938,1950,1962,1974,1986,1998,2010,2022',
        desc: 'Tygr může připomenout odvahu postavit se za důležitou věc. Odvaha přitom nemusí být nejhlasitější hlas v místnosti.',
        love: 'Pojmenuj jednu vlastní potřebu tak, aby v rozhovoru zůstal prostor i pro potřebu druhého.',
        career: 'U záměru, který odkládáš, si urči malý pokus a bezpečnou hranici.',
        y2026: 'Tygr i Kůň se v tradičních výkladech pojí s pohybem a nezávislostí. Ber to jako symbolický podnět k zamyšlení, jakou změnu chceš sám promyslet.',
        good: ['Kůň', 'Pes', 'Drak'], bad: ['Opice', 'Buvol']
    },
    zajic: {
        name: 'Zajíc', symbol: '卯', fixedElement: 'Dřevo', years: '1903,1915,1927,1939,1951,1963,1975,1987,1999,2011,2023',
        desc: 'Zajíc v symbolickém čtení otevírá téma jemnosti, klidu a citlivosti k prostředí. Klid ale nemusí znamenat vyhnout se potřebnému rozhovoru.',
        love: 'Zkus říct jednu nepříjemnou věc laskavě a konkrétně. Zároveň si všimni, zda je pro rozhovor bezpečný prostor.',
        career: 'Uprav jeden detail místa, kde trávíš čas, aby se ti v něm lépe soustředilo.',
        y2026: 'Rychlý Kůň a klidnější Zajíc vytvářejí v symbolickém čtení zajímavý kontrast. Může připomenout, že vlastní tempo si můžeš zvolit podle situace.',
        good: ['Koza', 'Prase', 'Pes'], bad: ['Kohout', 'Drak']
    },
    drak: {
        name: 'Drak', symbol: '辰', fixedElement: 'Země', years: '1904,1916,1928,1940,1952,1964,1976,1988,2000,2012,2024',
        desc: 'Drak představuje výrazný záměr a chuť něco vytvořit. Symbol může podpořit představivost; proveditelnost nápadu ověřují skutečné podmínky.',
        love: 'Vedle vlastního velkého plánu se zeptej, jak ho prožívá druhý člověk. Odpověď nech skutečně zaznít.',
        career: 'Převeď jeden nápad na první krok, potřebný čas a údaj, který si ještě ověříš.',
        y2026: 'Drak a Kůň jsou v čínské tradici výrazné symboly pohybu a síly. Jejich spojení může posloužit jako podnět k úvaze, které nápady chceš převést do konkrétního plánu.',
        good: ['Krysa', 'Opice', 'Kůň'], bad: ['Pes', 'Zajíc']
    },
    had: {
        name: 'Had', symbol: '巳', fixedElement: 'Oheň', years: '1905,1917,1929,1941,1953,1965,1977,1989,2001,2013,2025',
        desc: 'Had může být obrazem rozvahy a pozorného pozorování. Tichý dojem stojí za zaznamenání, ale sám neprokazuje, co se děje kolem.',
        love: 'Odděl vlastní pocit od toho, co víš z rozhovoru. U citlivé otázky pomůže ověření víc než domněnka.',
        career: 'U jednoho rozhodnutí si dopřej čas na chybějící informaci.',
        y2026: 'Had se v tradiční symbolice pojí s rozvahou, Kůň s pohybem. Tenhle kontrast může otevřít otázku, kdy chceš nejdřív pozorovat a kdy jednat.',
        good: ['Buvol', 'Kohout', 'Drak'], bad: ['Tygr', 'Prase']
    },
    kun: {
        name: 'Kůň', symbol: '午', fixedElement: 'Oheň', years: '1906,1918,1930,1942,1954,1966,1978,1990,2002,2014,2026',
        desc: 'Kůň v tradiční symbolice přináší motiv pohybu a samostatnosti. Nabízí otázku, kam chceš jít a co pro tu cestu potřebuješ.',
        love: 'Promluvte si o prostoru pro sebe i pro společný čas. Vlastní potřeba volnosti nemusí být pro oba stejná.',
        career: 'Projděte se nebo na chvíli změň prostředí a potom si zapiš jeden proveditelný další krok.',
        y2026: 'Rok 2026 je v čínském zvěrokruhu rokem Koně. Tradiční symbolika tohoto znamení zdůrazňuje pohyb a samostatnost; můžeš ji využít jako podnět k vlastnímu zamyšlení.',
        good: ['Tygr', 'Koza', 'Drak'], bad: ['Krysa', 'Buvol']
    },
    koza: {
        name: 'Koza', symbol: '未', fixedElement: 'Země', years: '1907,1919,1931,1943,1955,1967,1979,1991,2003,2015,2027',
        desc: 'Koza může otevřít téma tvořivosti, péče a příjemného prostředí. Drobné zlepšení někdy potřebuje víc pozornosti než další velký projekt.',
        love: 'Vyjádři jednu konkrétní věc, které si na druhém vážíš, bez očekávání okamžité odpovědi.',
        career: 'Věnuj deset minut něčemu, co tvoříš vlastníma rukama.',
        y2026: 'Koza bývá spojována s tvořivostí, Kůň s pohybem. V symbolickém čtení se tyto motivy mohou doplnit; konkrétní rozhodnutí ale záleží na tvé situaci.',
        good: ['Zajíc', 'Prase', 'Kůň'], bad: ['Buvol', 'Pes']
    },
    opice: {
        name: 'Opice', symbol: '申', fixedElement: 'Kov', years: '1908,1920,1932,1944,1956,1968,1980,1992,2004,2016,2028',
        desc: 'Opice představuje vynalézavost a pohled z jiného úhlu. Hravý nápad může odemknout možnost, kterou pak ověříš v praxi.',
        love: 'Zkus se na jednu společnou situaci podívat z pohledu druhého. Pak si svůj odhad ověř rozhovorem.',
        career: 'Najdi druhý způsob řešení jednoho malého problému a porovnej skutečný výsledek.',
        y2026: 'Opice a Kůň představují v čínské symbolice odlišné způsoby pohybu a řešení situací. Můžeš si všimnout, zda ti teď víc pomáhá vynalézavost, nebo přímý postup.',
        good: ['Krysa', 'Drak', 'Tygr'], bad: ['Prase', 'Had']
    },
    kohout: {
        name: 'Kohout', symbol: '酉', fixedElement: 'Kov', years: '1909,1921,1933,1945,1957,1969,1981,1993,2005,2017,2029',
        desc: 'Kohout může připomenout všímavost k detailu a srozumitelné pojmenování. Užitečná přesnost má pomáhat, ne vyžadovat dokonalost.',
        love: 'U jedné výtky nejdřív pojmenuj, co potřebuješ. Rozhovor je snazší než seznam chyb.',
        career: 'Vyber jeden detail, který má skutečný dopad. Ostatní může počkat.',
        y2026: 'Kohout se v tradiční symbolice pojí s přesností, Kůň s volnějším pohybem. Jejich kontrast může být pozvánkou k úvaze, kde chceš mít jasno a kde nechat prostor změně.',
        good: ['Buvol', 'Had', 'Drak'], bad: ['Zajíc', 'Kůň']
    },
    pes: {
        name: 'Pes', symbol: '戌', fixedElement: 'Země', years: '1910,1922,1934,1946,1958,1970,1982,1994,2006,2018,2030',
        desc: 'Pes v symbolickém čtení představuje důvěru a péči o společné dohody. Je také podnětem rozlišit podporu od přebírání cizí odpovědnosti.',
        love: 'Všimni si jedné vzájemné dohody: je stále jasná a přijatelná pro oba?',
        career: 'Nabídni konkrétní pomoc jen v rozsahu, který můžeš opravdu dodržet.',
        y2026: 'Pes a Kůň se v některých tradičních výkladech pojí s pohybem a věrností. Ber to jako symbolický podnět k zamyšlení, čemu chceš věnovat svou energii.',
        good: ['Tygr', 'Zajíc', 'Kůň'], bad: ['Drak', 'Koza']
    },
    prase: {
        name: 'Prase', symbol: '亥', fixedElement: 'Voda', years: '1911,1923,1935,1947,1959,1971,1983,1995,2007,2019,2031',
        desc: 'Prase bývá symbolem štědrosti a radosti z obyčejného pohodlí. Může připomenout péči, která počítá i s vlastními možnostmi.',
        love: 'Zeptej se, jakou podobu podpory druhý skutečně ocení. Nemusí to být ta, kterou bys zvolil pro sebe.',
        career: 'Dopřej si malou příjemnou věc a vědomě si na ni udělej prostor.',
        y2026: 'Prase bývá spojováno se štědrostí, Kůň s pohybem. Jejich symboly mohou otevřít úvahu o rovnováze mezi péčí o blízké a vlastním prostorem.',
        good: ['Zajíc', 'Koza', 'Tygr'], bad: ['Had', 'Opice']
    }
};

const ZODIAC_ORDER = ['krysa', 'buvol', 'tygr', 'zajic', 'drak', 'had', 'kun', 'koza', 'opice', 'kohout', 'pes', 'prase'];

/**
 * Returns Chinese Animal object based on birth year.
 */
function getChineseAnimalData(year) {
    if (!year || isNaN(year)) return null;
    const baseYear = 1900;
    // V cinske astrologii rok 1900 byl rokem Krysy. 
    // Spocitame zbytek a pripadne ho znormalizujeme do kladnych hodnot 0-11
    const idx = ((year - baseYear) % 12 + 12) % 12;
    const slug = ZODIAC_ORDER[idx];
    return {
        slug: slug,
        ...CHINESE_ANIMALS[slug]
    };
}

/**
 * Returns Element of the specific birth year (depends on the last digit of the year).
 * Voda (0-1), Dřevo (2-3) - Wait!
 * Podle čínské astrologie (poslení číslo roku):
 * 0, 1: Kov
 * 2, 3: Voda
 * 4, 5: Dřevo
 * 6, 7: Oheň
 * 8, 9: Země
 */
function getChineseElement(year) {
    if (!year || isNaN(year)) return null;
    const lastDigit = parseInt(year.toString().slice(-1), 10);

    switch (lastDigit) {
        case 0:
        case 1:
            return { name: 'Kov', suffix: 'Kovový', icon: '⚔️', color: '#B0C4DE' }; // Light Steel Blue
        case 2:
        case 3:
            return { name: 'Voda', suffix: 'Vodní', icon: '🌊', color: '#3498DB' }; // Blue
        case 4:
        case 5:
            return { name: 'Dřevo', suffix: 'Dřevěný', icon: '🌳', color: '#2ECC71' }; // Green
        case 6:
        case 7:
            return { name: 'Oheň', suffix: 'Ohnivý', icon: '🔥', color: '#E74C3C' }; // Red
        case 8:
        case 9:
            return { name: 'Země', suffix: 'Zemní', icon: '🌍', color: '#F39C12' }; // Orange/Brown
    }
    return null;
}

function setYearInputInvalid(input, invalid) {
    if (!input) return;
    input.classList.toggle('year-input--invalid', invalid);
    input.closest('.year-input-wrapper')?.classList.toggle('year-input-wrapper--invalid', invalid);
}

function getElementClass(elementName) {
    return {
        Kov: 'chinese-element--metal',
        Voda: 'chinese-element--water',
        Dřevo: 'chinese-element--wood',
        Oheň: 'chinese-element--fire',
        Země: 'chinese-element--earth'
    }[elementName] || 'chinese-element--neutral';
}

const CHINESE_BRANCH_SYMBOLS = {
    krysa: '子', buvol: '丑', tygr: '寅', zajic: '卯', drak: '辰', had: '巳',
    kun: '午', koza: '未', opice: '申', kohout: '酉', pes: '戌', prase: '亥'
};

function renderChineseSymbol(host, slug) {
    if (!host) return;
    const symbol = CHINESE_BRANCH_SYMBOLS[slug] || '';
    host.replaceChildren();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 64 64');
    svg.setAttribute('class', 'chinese-animal-symbol');
    svg.setAttribute('aria-hidden', 'true');
    const circle = document.createElementNS(svg.namespaceURI, 'circle');
    circle.setAttribute('cx', '32'); circle.setAttribute('cy', '32'); circle.setAttribute('r', '29');
    circle.setAttribute('fill', 'none'); circle.setAttribute('stroke', 'currentColor'); circle.setAttribute('stroke-width', '1.5');
    const text = document.createElementNS(svg.namespaceURI, 'text');
    text.setAttribute('x', '32'); text.setAttribute('y', '43'); text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '34'); text.setAttribute('font-family', 'serif'); text.textContent = symbol;
    svg.append(circle, text); host.appendChild(svg);
}

/**
 * Exposed to global scope for HTML inline calls (or ideally migrated later)
 */
window.calculateAnimal = function () {
    const input = document.getElementById('birth-year');
    if (!input) return;

    setYearInputInvalid(input, false);
    const year = parseInt(input.value);

    if (!year || year < 1900 || year > 2100) {
        setYearInputInvalid(input, true);
        return;
    }
    window.showAnimal(null, year);
};

window.showAnimal = function (slugOverride, exactYear = null) {
    let data;
    let computedElement = null;
    let isSpecificYear = false;

    if (exactYear) {
        // Zavolano pres tlacitko formular s rocnikem (Ma zivel!)
        data = getChineseAnimalData(exactYear);
        computedElement = getChineseElement(exactYear);
        isSpecificYear = true;
    } else if (slugOverride) {
        // Zavolano jen pres ikonku (nema zivel, nevime presny rocnik)
        data = CHINESE_ANIMALS[slugOverride];
        data.slug = slugOverride;
    }

    if (!data) return;

    // Reset buttons
    document.querySelectorAll('.animal-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById('btn-' + data.slug);
    if (activeBtn) activeBtn.classList.add('active');

    // Display Hero Section
    const hero = document.getElementById('result-hero');
    hero.classList.add('result-hero--active');

    renderChineseSymbol(document.getElementById('result-emoji'), data.slug);

    // Customization based on Element
    if (isSpecificYear && computedElement) {
        document.getElementById('result-name').textContent = `${computedElement.suffix} ${data.name}`;
        const rawElement = `Aktivní živel: <strong class="${getElementClass(computedElement.name)}">${computedElement.name}</strong>`;
        document.getElementById('result-element').innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rawElement) : rawElement;
        document.getElementById('result-years').textContent = `Ročník: ${exactYear}`;
    } else {
        document.getElementById('result-name').textContent = data.name;
        document.getElementById('result-element').textContent = `Fixní Živel: ${data.fixedElement}`;
        document.getElementById('result-years').textContent = 'Roky: ' + data.years;
    }

    // Assign text nodes
    document.getElementById('result-desc').textContent = data.desc;
    document.getElementById('result-love').textContent = data.love;
    document.getElementById('result-career').textContent = data.career;
    document.getElementById('result-2026').textContent = data.y2026;

    // Compatibility badges (sanitized HTML)
    const elGood = document.getElementById('compat-good');
    const elBad = document.getElementById('compat-bad');
    if (elGood) {
        const rawGood = data.good.map(a => `<span class="compat-badge compat-good">${a}</span>`).join('');
        elGood.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rawGood) : rawGood;
    }
    if (elBad) {
        const rawBad = data.bad.map(a => `<span class="compat-badge compat-bad">${a}</span>`).join('');
        elBad.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rawBad) : rawBad;
    }

    // Vztahova analyza zobrazeni/schovani containeru "Rozsirena AI"
    const resultSec = document.getElementById('result-section');
    resultSec.classList.add('show');

    setupChineseImageShare({
        symbol: data.symbol,
        name: isSpecificYear && computedElement ? `${computedElement.suffix} ${data.name}` : data.name,
        elementLabel: isSpecificYear && computedElement ? `Aktivní živel: ${computedElement.name}` : `Fixní živel: ${data.fixedElement}`,
        yearsLabel: isSpecificYear ? `Ročník: ${exactYear}` : `Roky: ${data.years}`,
        desc: data.desc,
        slug: data.slug
    });

    // Smart scroll k precteni horoskopu
    setTimeout(() => {
        resultSec.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    }, 100);
};

let lastChineseShareData = null;

function drawChineseZodiacImage(result) {
    const shareImage = window.MH_SHARE_IMAGE;
    const canvas = shareImage.createCanvas();
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const seed = String(result.name || '').length * 37 + String(result.yearsLabel || '').length;

    shareImage.drawBrandBackground(ctx, canvas, seed);

    ctx.fillStyle = '#d0b17c';
    ctx.font = '700 52px Cinzel, Georgia, serif';
    ctx.fillText('ČÍNSKÝ HOROSKOP', centerX, 244);

    ctx.font = '150px serif';
    ctx.fillText(result.symbol || '辰', centerX, 500);

    ctx.fillStyle = '#e9e3d7';
    ctx.font = '700 64px Cinzel, Georgia, serif';
    ctx.fillText(result.name || '', centerX, 640);

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '600 34px Inter, Arial, sans-serif';
    ctx.fillText(result.elementLabel || '', centerX, 706);
    ctx.font = '500 28px Inter, Arial, sans-serif';
    const years = String(result.yearsLabel || '').replace(/,\s*/g, ', ');
    shareImage.drawCenteredLines(ctx, shareImage.wrapText(ctx, years, 840), centerX, 752, 38, 2);

    ctx.fillStyle = 'rgba(208,177,124,0.86)';
    ctx.fillRect(170, 824, 740, 3);

    if (result.desc) {
        ctx.fillStyle = '#e9e3d7';
        ctx.font = '500 37px Inter, Arial, sans-serif';
        shareImage.drawCenteredLines(ctx, shareImage.wrapText(ctx, result.desc, 840), centerX, 880, 49, 6);
    }

    shareImage.drawFooter(ctx, canvas, 'mystickahvezda.cz/cinsky-horoskop.html',
        'Zjisti svoje znamení podle roku narození.');

    return canvas;
}

async function onChineseImageShareClick(event) {
    const button = event.currentTarget;
    if (!lastChineseShareData || !window.MH_SHARE_IMAGE?.shareOrDownload) return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Připravuji obrázek...';

    try {
        const canvas = drawChineseZodiacImage(lastChineseShareData);
        await window.MH_SHARE_IMAGE.shareOrDownload({
            canvas,
            fileName: `cinsky-horoskop-${lastChineseShareData.slug || 'znameni'}.png`,
            shareTitle: 'Můj čínský horoskop',
            shareText: `Moje znamení v čínském horoskopu je ${lastChineseShareData.name}. Zjisti to svoje na mystickahvezda.cz`,
            eventBase: 'chinese_zodiac_image',
            metadata: {
                source: 'chinese_zodiac_result',
                feature: 'zodiac_signs',
                animal: lastChineseShareData.slug || null
            }
        });
    } catch (error) {
        console.warn('[Čínský horoskop] Image share failed:', error.message);
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}

function setupChineseImageShare(result) {
    if (!window.MH_SHARE_IMAGE?.shareOrDownload) return;

    lastChineseShareData = result;

    const host = document.getElementById('result-hero');
    if (!host) return;

    let button = document.getElementById('chinese-share-image-btn');
    if (!button) {
        button = document.createElement('button');
        button.id = 'chinese-share-image-btn';
        button.type = 'button';
        button.className = 'btn btn--ghost mt-md';
        button.textContent = 'Uložit obrázek znamení';
        button.addEventListener('click', onChineseImageShareClick);
        host.appendChild(button);
    }
}

// Inicializace listeneru
document.addEventListener('DOMContentLoaded', () => {
    // Horoskop (Enter přes input)
    const input = document.getElementById('birth-year');
    if (input) {
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') window.calculateAnimal();
        });
    }

    // Hlavní tlačítko "Zjistit mé znamení"
    const btnCalculate = document.getElementById('btn-calculate');
    if (btnCalculate) {
        btnCalculate.addEventListener('click', () => window.calculateAnimal());
    }

    // Zvířecí tlačítka
    document.querySelectorAll('.animal-btn[data-slug]').forEach(btn => {
        btn.addEventListener('click', () => window.showAnimal(btn.dataset.slug));
    });

    // Synastrie button (prevence CSP onclick z HTML)
    const btnSynastry = document.getElementById('btn-synastry');
    if (btnSynastry) {
        btnSynastry.addEventListener('click', () => {
            window.calculateChineseSynastry();
        });
    }
});

/**
 * Chinese Synastry Calculator
 */
window.calculateChineseSynastry = function () {
    const input1 = document.getElementById('synastry-year1');
    const input2 = document.getElementById('synastry-year2');

    // Reset borders
    setYearInputInvalid(input1, false);
    setYearInputInvalid(input2, false);

    const year1 = parseInt(input1.value);
    const year2 = parseInt(input2.value);

    let hasError = false;
    if (!year1 || year1 < 1900 || year1 > 2100) {
        setYearInputInvalid(input1, true);
        hasError = true;
    }
    if (!year2 || year2 < 1900 || year2 > 2100) {
        setYearInputInvalid(input2, true);
        hasError = true;
    }

    if (hasError) return;

    const data1 = getChineseAnimalData(year1);
    const data2 = getChineseAnimalData(year2);
    const elem1 = getChineseElement(year1);
    const elem2 = getChineseElement(year2);

    if (!data1 || !data2 || !elem1 || !elem2) return;

    // Populate UI
    renderChineseSymbol(document.getElementById('syn-emoji1'), data1.slug);
    document.getElementById('syn-name1').textContent = `${elem1.suffix} ${data1.name}`;

    renderChineseSymbol(document.getElementById('syn-emoji2'), data2.slug);
    document.getElementById('syn-name2').textContent = `${elem2.suffix} ${data2.name}`;

    // Determine compatibility level
    // Compatibility arrays contain animal names used by the visible badges.
    const isGood = data1.good.some(str => str.includes(data2.name));
    const isBad = data1.bad.some(str => str.includes(data2.name));

    const titleEl = document.getElementById('syn-title');
    const descEl = document.getElementById('syn-desc');
    titleEl.classList.remove('syn-title--good', 'syn-title--bad', 'syn-title--neutral');

    if (isGood) {
        titleEl.textContent = 'Tradičně souladná dvojice';
        titleEl.classList.add('syn-title--good');
        descEl.textContent = `V tradičním čínském zvěrokruhu se tato znamení řadí mezi souladné dvojice. ${data1.name} a ${data2.name} mohou posloužit jako symbolický podnět k zamyšlení nad tím, jak se vaše odlišnosti doplňují. O vztahu rozhoduje především vaše skutečná zkušenost.`;
    } else if (isBad) {
        titleEl.textContent = 'Tradičně opoziční dvojice';
        titleEl.classList.add('syn-title--bad');
        descEl.textContent = `V čínské astrologii jde o tzv. opoziční dvojici, která vidí svět jinýma očima. Může to být velmi vášnivé, ale vyžaduje to kompromisy. Zatímco ${data1.name} míří jedním směrem, ${data2.name} druhým. Interakce vašich živlů (${elem1.name} vs ${elem2.name}) hraje klíčovou roli v kompromisech.`;
    } else {
        titleEl.textContent = 'Bez tradičního zařazení';
        titleEl.classList.add('syn-title--neutral');
        descEl.textContent = `Podle zjednodušeného přehledu čínských znamení nejde o tradičně souladnou ani opoziční dvojici. Výsledek není hodnocením vašeho vztahu; může nabídnout jen podnět k rozhovoru o respektu a rozdílných potřebách. Živly ${elem1.name} a ${elem2.name} jsou součástí symbolického výkladu.`;
    }

    const res = document.getElementById('synastry-result');
    res.hidden = false;
    res.classList.add('mh-block-visible');
    setTimeout(() => {
        res.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
};

// Event delegation for +/- year input buttons
document.addEventListener('click', (e) => {
    const action = e.target.getAttribute('data-action');
    if (action === 'stepDown' || action === 'stepUp') {
        const input = e.target.parentNode.querySelector('input');
        if (action === 'stepDown') {
            input.stepDown();
        } else {
            input.stepUp();
        }
        input.dispatchEvent(new Event('change'));
    }
});
