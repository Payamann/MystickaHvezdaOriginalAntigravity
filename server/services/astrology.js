import { supabase } from '../db-supabase.js';

// ============================================
// MOON PHASE CALCULATIONS
// ============================================

// In-memory cache: store moon phase result for each day
// This avoids recalculating the same phase multiple times per day
let cachedMoonPhase = null;
let cachedMoonDate = null;

export function calculateMoonPhase(dateInput) {
    const now = dateInput === undefined ? new Date() : new Date(dateInput);
    if (Number.isNaN(now.getTime())) {
        throw new Error('Invalid date passed to calculateMoonPhase');
    }

    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const shouldUseCache = dateInput === undefined;

    // Return cached result if it's still the same day
    if (shouldUseCache && cachedMoonDate === today && cachedMoonPhase) {
        return cachedMoonPhase;
    }

    const synodic = 29.53058867; // Synodic month (new moon to new moon)
    const knownNewMoon = new Date('2024-01-11T11:57:00Z'); // Known New Moon reference in UTC
    const diffDays = (now - knownNewMoon) / (1000 * 60 * 60 * 24);
    const phaseIndex = (diffDays % synodic);

    // Normalize to 0-29.5
    let currentPhase = phaseIndex;
    if (currentPhase < 0) currentPhase += synodic;

    // Determine simplified phase name
    let phaseName;
    if (currentPhase < 1.5 || currentPhase > 28) phaseName = 'Nov (Znovuzrození, nové začátky)';
    else if (currentPhase < 7) phaseName = 'Dorůstající srpek (Budování, sbírání sil)';
    else if (currentPhase < 9) phaseName = 'První čtvrť (Překonávání překážek)';
    else if (currentPhase < 14) phaseName = 'Dorůstající měsíc (Zdokonalování)';
    else if (currentPhase < 16) phaseName = 'Úplněk (Vyvrcholení, odhalení pravdy)';
    else if (currentPhase < 21) phaseName = 'Couvající měsíc (Uvolňování, vděčnost)';
    else if (currentPhase < 23) phaseName = 'Poslední čtvrť (Odpouštění)';
    else phaseName = 'Couvající srpek (Očista, odpočinek)';

    if (shouldUseCache) {
        // Cache the result for this day
        cachedMoonPhase = phaseName;
        cachedMoonDate = today;
    }

    return phaseName;
}

// ============================================
// NATAL / SYNASTRY ASTRO ENGINE
// ============================================

const J2000_JULIAN_DAY = 2451545.0;
const SCHLYTER_EPOCH_JULIAN_DAY = 2451543.5;

const ZODIAC_SIGNS = [
    { id: 'aries', name: 'Beran', symbol: '♈', element: 'fire', quality: 'cardinal', start: 0 },
    { id: 'taurus', name: 'Býk', symbol: '♉', element: 'earth', quality: 'fixed', start: 30 },
    { id: 'gemini', name: 'Blíženci', symbol: '♊', element: 'air', quality: 'mutable', start: 60 },
    { id: 'cancer', name: 'Rak', symbol: '♋', element: 'water', quality: 'cardinal', start: 90 },
    { id: 'leo', name: 'Lev', symbol: '♌', element: 'fire', quality: 'fixed', start: 120 },
    { id: 'virgo', name: 'Panna', symbol: '♍', element: 'earth', quality: 'mutable', start: 150 },
    { id: 'libra', name: 'Váhy', symbol: '♎', element: 'air', quality: 'cardinal', start: 180 },
    { id: 'scorpio', name: 'Štír', symbol: '♏', element: 'water', quality: 'fixed', start: 210 },
    { id: 'sagittarius', name: 'Střelec', symbol: '♐', element: 'fire', quality: 'mutable', start: 240 },
    { id: 'capricorn', name: 'Kozoroh', symbol: '♑', element: 'earth', quality: 'cardinal', start: 270 },
    { id: 'aquarius', name: 'Vodnář', symbol: '♒', element: 'air', quality: 'fixed', start: 300 },
    { id: 'pisces', name: 'Ryby', symbol: '♓', element: 'water', quality: 'mutable', start: 330 }
];

const PLANET_DEFINITIONS = [
    { id: 'sun', name: 'Slunce', symbol: '☉', weight: 2.2, group: 'luminary' },
    { id: 'moon', name: 'Měsíc', symbol: '☽', weight: 2.0, group: 'luminary' },
    { id: 'mercury', name: 'Merkur', symbol: '☿', weight: 1.25, group: 'personal' },
    { id: 'venus', name: 'Venuše', symbol: '♀', weight: 1.35, group: 'personal' },
    { id: 'mars', name: 'Mars', symbol: '♂', weight: 1.35, group: 'personal' },
    { id: 'jupiter', name: 'Jupiter', symbol: '♃', weight: 1.0, group: 'social' },
    { id: 'saturn', name: 'Saturn', symbol: '♄', weight: 1.0, group: 'social' },
    { id: 'uranus', name: 'Uran', symbol: '♅', weight: 0.65, group: 'generational' },
    { id: 'neptune', name: 'Neptun', symbol: '♆', weight: 0.65, group: 'generational' },
    { id: 'pluto', name: 'Pluto', symbol: '♇', weight: 0.55, group: 'generational' }
];

const ORBITAL_ELEMENTS = {
    mercury: (d) => ({
        N: 48.3313 + 3.24587e-5 * d,
        i: 7.0047 + 5.00e-8 * d,
        w: 29.1241 + 1.01444e-5 * d,
        a: 0.387098,
        e: 0.205635 + 5.59e-10 * d,
        M: 168.6562 + 4.0923344368 * d
    }),
    venus: (d) => ({
        N: 76.6799 + 2.46590e-5 * d,
        i: 3.3946 + 2.75e-8 * d,
        w: 54.8910 + 1.38374e-5 * d,
        a: 0.723330,
        e: 0.006773 - 1.302e-9 * d,
        M: 48.0052 + 1.6021302244 * d
    }),
    earth: (d) => ({
        N: 0,
        i: 0,
        w: 282.9404 + 4.70935e-5 * d,
        a: 1.000000,
        e: 0.016709 - 1.151e-9 * d,
        M: 356.0470 + 0.9856002585 * d
    }),
    mars: (d) => ({
        N: 49.5574 + 2.11081e-5 * d,
        i: 1.8497 - 1.78e-8 * d,
        w: 286.5016 + 2.92961e-5 * d,
        a: 1.523688,
        e: 0.093405 + 2.516e-9 * d,
        M: 18.6021 + 0.5240207766 * d
    }),
    jupiter: (d) => ({
        N: 100.4542 + 2.76854e-5 * d,
        i: 1.3030 - 1.557e-7 * d,
        w: 273.8777 + 1.64505e-5 * d,
        a: 5.20256,
        e: 0.048498 + 4.469e-9 * d,
        M: 19.8950 + 0.0830853001 * d
    }),
    saturn: (d) => ({
        N: 113.6634 + 2.38980e-5 * d,
        i: 2.4886 - 1.081e-7 * d,
        w: 339.3939 + 2.97661e-5 * d,
        a: 9.55475,
        e: 0.055546 - 9.499e-9 * d,
        M: 316.9670 + 0.0334442282 * d
    }),
    uranus: (d) => ({
        N: 74.0005 + 1.3978e-5 * d,
        i: 0.7733 + 1.9e-8 * d,
        w: 96.6612 + 3.0565e-5 * d,
        a: 19.18171 - 1.55e-8 * d,
        e: 0.047318 + 7.45e-9 * d,
        M: 142.5905 + 0.011725806 * d
    }),
    neptune: (d) => ({
        N: 131.7806 + 3.0173e-5 * d,
        i: 1.7700 - 2.55e-7 * d,
        w: 272.8461 - 6.027e-6 * d,
        a: 30.05826 + 3.313e-8 * d,
        e: 0.008606 + 2.15e-9 * d,
        M: 260.2471 + 0.005995147 * d
    })
};

const ASPECT_DEFINITIONS = [
    { id: 'conjunction', name: 'Konjunkce', angle: 0, orb: 8, polarity: 'intense' },
    { id: 'opposition', name: 'Opozice', angle: 180, orb: 8, polarity: 'dynamic' },
    { id: 'trine', name: 'Trigon', angle: 120, orb: 6, polarity: 'harmonious' },
    { id: 'square', name: 'Kvadratura', angle: 90, orb: 6, polarity: 'tense' },
    { id: 'sextile', name: 'Sextil', angle: 60, orb: 5, polarity: 'supportive' }
];

const ELEMENT_TRANSLATIONS = {
    fire: 'oheň',
    earth: 'země',
    air: 'vzduch',
    water: 'voda'
};

const QUALITY_TRANSLATIONS = {
    cardinal: 'kardinální',
    fixed: 'fixní',
    mutable: 'proměnlivá'
};

const KNOWN_BIRTH_LOCATIONS = [
    { name: 'Praha', country: 'CZ', latitude: 50.0755, longitude: 14.4378, timeZone: 'Europe/Prague', aliases: ['praha', 'prague'] },
    { name: 'Brno', country: 'CZ', latitude: 49.1951, longitude: 16.6068, timeZone: 'Europe/Prague', aliases: ['brno'] },
    { name: 'Ostrava', country: 'CZ', latitude: 49.8209, longitude: 18.2625, timeZone: 'Europe/Prague', aliases: ['ostrava'] },
    { name: 'Plzeň', country: 'CZ', latitude: 49.7384, longitude: 13.3736, timeZone: 'Europe/Prague', aliases: ['plzen', 'plzeň', 'pilsen'] },
    { name: 'Liberec', country: 'CZ', latitude: 50.7663, longitude: 15.0543, timeZone: 'Europe/Prague', aliases: ['liberec'] },
    { name: 'Olomouc', country: 'CZ', latitude: 49.5938, longitude: 17.2509, timeZone: 'Europe/Prague', aliases: ['olomouc'] },
    { name: 'České Budějovice', country: 'CZ', latitude: 48.9745, longitude: 14.4743, timeZone: 'Europe/Prague', aliases: ['ceske budejovice', 'české budějovice'] },
    { name: 'Hradec Králové', country: 'CZ', latitude: 50.2104, longitude: 15.8252, timeZone: 'Europe/Prague', aliases: ['hradec kralove', 'hradec králové'] },
    { name: 'Pardubice', country: 'CZ', latitude: 50.0343, longitude: 15.7812, timeZone: 'Europe/Prague', aliases: ['pardubice'] },
    { name: 'Zlín', country: 'CZ', latitude: 49.2244, longitude: 17.6628, timeZone: 'Europe/Prague', aliases: ['zlin', 'zlín'] },
    { name: 'Jihlava', country: 'CZ', latitude: 49.3961, longitude: 15.5903, timeZone: 'Europe/Prague', aliases: ['jihlava'] },
    { name: 'Karlovy Vary', country: 'CZ', latitude: 50.2319, longitude: 12.8710, timeZone: 'Europe/Prague', aliases: ['karlovy vary', 'carlsbad'] },
    { name: 'Ústí nad Labem', country: 'CZ', latitude: 50.6611, longitude: 14.0324, timeZone: 'Europe/Prague', aliases: ['usti nad labem', 'ústí nad labem'] },
    { name: 'Kladno', country: 'CZ', latitude: 50.1473, longitude: 14.1029, timeZone: 'Europe/Prague', aliases: ['kladno'] },
    { name: 'Mladá Boleslav', country: 'CZ', latitude: 50.4114, longitude: 14.9032, timeZone: 'Europe/Prague', aliases: ['mlada boleslav', 'mladá boleslav'] },
    { name: 'Teplice', country: 'CZ', latitude: 50.6404, longitude: 13.8245, timeZone: 'Europe/Prague', aliases: ['teplice'] },
    { name: 'Bratislava', country: 'SK', latitude: 48.1486, longitude: 17.1077, timeZone: 'Europe/Bratislava', aliases: ['bratislava'] },
    { name: 'Košice', country: 'SK', latitude: 48.7164, longitude: 21.2611, timeZone: 'Europe/Bratislava', aliases: ['kosice', 'košice'] },
    { name: 'Varšava', country: 'PL', latitude: 52.2297, longitude: 21.0122, timeZone: 'Europe/Warsaw', aliases: ['varsava', 'varšava', 'warsaw', 'warszawa'] },
    { name: 'Krakov', country: 'PL', latitude: 50.0647, longitude: 19.9450, timeZone: 'Europe/Warsaw', aliases: ['krakov', 'krakow', 'kraków'] },
    { name: 'Vídeň', country: 'AT', latitude: 48.2082, longitude: 16.3738, timeZone: 'Europe/Vienna', aliases: ['viden', 'vídeň', 'vienna', 'wien'] },
    { name: 'Berlín', country: 'DE', latitude: 52.5200, longitude: 13.4050, timeZone: 'Europe/Berlin', aliases: ['berlin', 'berlín'] },
    { name: 'Londýn', country: 'GB', latitude: 51.5072, longitude: -0.1276, timeZone: 'Europe/London', aliases: ['londyn', 'londýn', 'london'] },
    { name: 'Paříž', country: 'FR', latitude: 48.8566, longitude: 2.3522, timeZone: 'Europe/Paris', aliases: ['pariz', 'paříž', 'paris'] },
    { name: 'New York', country: 'US', latitude: 40.7128, longitude: -74.0060, timeZone: 'America/New_York', aliases: ['new york', 'nyc'] },
    { name: 'Los Angeles', country: 'US', latitude: 34.0522, longitude: -118.2437, timeZone: 'America/Los_Angeles', aliases: ['los angeles', 'la'] }
];

export function getKnownBirthLocationNames() {
    return KNOWN_BIRTH_LOCATIONS.map((location) => location.name);
}

export function getKnownBirthLocationSuggestions() {
    return KNOWN_BIRTH_LOCATIONS.map((location) => ({
        name: location.name,
        country: location.country
    }));
}

const ASTRO_INTENTION_PROFILES = {
    obecny: {
        label: 'obecný směr',
        planets: ['sun', 'jupiter', 'moon'],
        theme: 'celkový růst'
    },
    kariera: {
        label: 'kariéra a úspěch',
        planets: ['sun', 'jupiter', 'mars', 'mercury'],
        theme: 'viditelnost, tah na branku a nové příležitosti'
    },
    laska: {
        label: 'láska a vztahy',
        planets: ['venus', 'moon', 'sun'],
        theme: 'blízkost, harmonie a citové bezpečí'
    },
    zdravi: {
        label: 'zdraví a vitalita',
        planets: ['sun', 'moon', 'jupiter'],
        theme: 'regenerace, rytmus a tělesná energie'
    },
    duchovno: {
        label: 'duchovní růst',
        planets: ['neptune', 'jupiter', 'uranus', 'pluto'],
        theme: 'intuice, smysl a vnitřní proměna'
    },
    rodina: {
        label: 'domov a rodina',
        planets: ['moon', 'venus', 'saturn'],
        theme: 'zakořenění, vztahy a stabilita'
    }
};

const ASTRO_DESTINATION_CATALOG = [
    {
        id: 'praha',
        name: 'Praha',
        country: 'Česko',
        region: 'střední Evropa',
        latitude: 50.0755,
        longitude: 14.4378,
        map: { x: 52, y: 34 },
        planets: ['moon', 'venus', 'saturn'],
        themes: ['obecny', 'rodina', 'duchovno'],
        elements: ['earth', 'water'],
        use: 'zakořenění, pomalé dozrávání a návrat k vlastnímu středu',
        caution: 'Nesnažte se uspěchat rozhodnutí, která potřebují zrát.'
    },
    {
        id: 'london',
        name: 'Londýn',
        country: 'Velká Británie',
        region: 'západní Evropa',
        latitude: 51.5072,
        longitude: -0.1276,
        map: { x: 47, y: 32 },
        planets: ['mercury', 'saturn', 'jupiter'],
        themes: ['kariera', 'obecny'],
        elements: ['air', 'earth'],
        use: 'kontakty, disciplínu a profesionální síťování',
        caution: 'Hlídejte si přetížení a tlak na výkon.'
    },
    {
        id: 'paris',
        name: 'Paříž',
        country: 'Francie',
        region: 'západní Evropa',
        latitude: 48.8566,
        longitude: 2.3522,
        map: { x: 48, y: 34 },
        planets: ['venus', 'sun', 'mercury'],
        themes: ['laska', 'kariera'],
        elements: ['air', 'fire'],
        use: 'viditelnost, estetiku a odvahu ukázat vlastní hodnotu',
        caution: 'Nezaměňujte obdiv okolí za skutečnou blízkost.'
    },
    {
        id: 'berlin',
        name: 'Berlín',
        country: 'Německo',
        region: 'střední Evropa',
        latitude: 52.52,
        longitude: 13.405,
        map: { x: 51, y: 32 },
        planets: ['uranus', 'mercury', 'mars'],
        themes: ['kariera', 'duchovno'],
        elements: ['air', 'fire'],
        use: 'experimenty, nové komunity a mentální restart',
        caution: 'Příliš mnoho možností může tříštit energii.'
    },
    {
        id: 'vienna',
        name: 'Vídeň',
        country: 'Rakousko',
        region: 'střední Evropa',
        latitude: 48.2082,
        longitude: 16.3738,
        map: { x: 53, y: 35 },
        planets: ['venus', 'saturn', 'moon'],
        themes: ['laska', 'rodina', 'zdravi'],
        elements: ['earth', 'water'],
        use: 'klid, kulturu, vztahovou kultivaci a stabilní tempo',
        caution: 'Vyhněte se pohodlí, které by zastavilo růst.'
    },
    {
        id: 'barcelona',
        name: 'Barcelona',
        country: 'Španělsko',
        region: 'jižní Evropa',
        latitude: 41.3874,
        longitude: 2.1686,
        map: { x: 47, y: 37 },
        planets: ['sun', 'venus', 'mars'],
        themes: ['laska', 'zdravi', 'obecny'],
        elements: ['fire', 'air'],
        use: 'radost, tělo, kreativitu a lehčí sociální rytmus',
        caution: 'Nepřepalte tempo jen proto, že energie působí lehce.'
    },
    {
        id: 'new-york',
        name: 'New York',
        country: 'USA',
        region: 'severní Amerika',
        latitude: 40.7128,
        longitude: -74.006,
        map: { x: 26, y: 37 },
        planets: ['sun', 'jupiter', 'mars'],
        themes: ['kariera', 'obecny'],
        elements: ['fire', 'air'],
        use: 'ambici, rychlé příležitosti a schopnost být vidět',
        caution: 'Nenechte tempo města převzít rozhodování za vás.'
    },
    {
        id: 'los-angeles',
        name: 'Los Angeles',
        country: 'USA',
        region: 'severní Amerika',
        latitude: 34.0522,
        longitude: -118.2437,
        map: { x: 15, y: 39 },
        planets: ['sun', 'venus', 'neptune'],
        themes: ['kariera', 'laska', 'duchovno'],
        elements: ['fire', 'water'],
        use: 'tvorbu, sebevyjádření a práci s obrazem',
        caution: 'Držte pevnou hranici mezi vizí a iluzí.'
    },
    {
        id: 'bali',
        name: 'Bali',
        country: 'Indonésie',
        region: 'jihovýchodní Asie',
        latitude: -8.3405,
        longitude: 115.092,
        map: { x: 82, y: 60 },
        planets: ['neptune', 'venus', 'moon'],
        themes: ['duchovno', 'laska', 'zdravi'],
        elements: ['water', 'earth'],
        use: 'ztišení, citlivost, rituál a obnovu těla',
        caution: 'Uzemňujte intuici konkrétním denním režimem.'
    },
    {
        id: 'tokyo',
        name: 'Tokyo',
        country: 'Japonsko',
        region: 'východní Asie',
        latitude: 35.6762,
        longitude: 139.6503,
        map: { x: 85, y: 38 },
        planets: ['mercury', 'uranus', 'saturn'],
        themes: ['kariera', 'obecny'],
        elements: ['air', 'earth'],
        use: 'systém, inovaci, učení a technologickou disciplínu',
        caution: 'Nepotlačte citovou potřebu jen kvůli efektivitě.'
    },
    {
        id: 'sydney',
        name: 'Sydney',
        country: 'Austrálie',
        region: 'Oceánie',
        latitude: -33.8688,
        longitude: 151.2093,
        map: { x: 89, y: 72 },
        planets: ['sun', 'jupiter', 'moon'],
        themes: ['zdravi', 'obecny', 'rodina'],
        elements: ['fire', 'water'],
        use: 'nový začátek, vitalitu a širší životní horizont',
        caution: 'Velký restart plánujte postupně, ne impulzivně.'
    },
    {
        id: 'reykjavik',
        name: 'Reykjavík',
        country: 'Island',
        region: 'severní Atlantik',
        latitude: 64.1466,
        longitude: -21.9426,
        map: { x: 40, y: 22 },
        planets: ['moon', 'neptune', 'pluto'],
        themes: ['duchovno', 'zdravi'],
        elements: ['water', 'earth'],
        use: 'ticho, regeneraci a hlubší emoční očistu',
        caution: 'Vnitřní procesy tu mohou být silnější než vnější akce.'
    }
];

function round(value, digits = 2) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

export function normalizeDegrees(value) {
    return ((value % 360) + 360) % 360;
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
}

function signedDegreeDelta(from, to) {
    const delta = normalizeDegrees(to - from);
    return delta > 180 ? delta - 360 : delta;
}

export function angularDistance(a, b) {
    const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
    return diff > 180 ? 360 - diff : diff;
}

function formatDegree(degreeInSign) {
    const wholeDegrees = Math.floor(degreeInSign);
    const minutes = Math.round((degreeInSign - wholeDegrees) * 60);
    if (minutes === 60) {
        return `${wholeDegrees + 1}°00'`;
    }
    return `${wholeDegrees}°${String(minutes).padStart(2, '0')}'`;
}

export function getZodiacSignByLongitude(longitude) {
    const normalized = normalizeDegrees(longitude);
    const signIndex = Math.floor(normalized / 30);
    const sign = ZODIAC_SIGNS[signIndex];
    const degreeInSign = normalized - sign.start;

    return {
        ...sign,
        longitude: round(normalized, 2),
        degree: round(degreeInSign, 2),
        degreeText: formatDegree(degreeInSign)
    };
}

export function calculateJulianDay(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        throw new Error('Invalid Date passed to calculateJulianDay');
    }

    return date.getTime() / 86400000 + 2440587.5;
}

function normalizeSearchText(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ');
}

function normalizeAstroIntention(value = 'obecny') {
    const search = normalizeSearchText(value);

    if (search.includes('karier') || search.includes('uspech') || search.includes('prace')) return 'kariera';
    if (search.includes('laska') || search.includes('vztah')) return 'laska';
    if (search.includes('zdravi') || search.includes('vitalita') || search.includes('relax')) return 'zdravi';
    if (search.includes('duchovn') || search.includes('smysl') || search.includes('rust')) return 'duchovno';
    if (search.includes('rodina') || search.includes('domov')) return 'rodina';
    return ASTRO_INTENTION_PROFILES[search] ? search : 'obecny';
}

function isFiniteCoordinate(value, min, max) {
    const number = Number(value);
    return Number.isFinite(number) && number >= min && number <= max;
}

export function resolveBirthLocation(input = {}) {
    if (
        isFiniteCoordinate(input.latitude, -90, 90) &&
        isFiniteCoordinate(input.longitude, -180, 180)
    ) {
        return {
            name: input.birthPlace ? String(input.birthPlace).substring(0, 100) : 'Vlastni souradnice',
            country: input.country || null,
            latitude: round(Number(input.latitude), 5),
            longitude: round(Number(input.longitude), 5),
            timeZone: input.timeZone || 'UTC',
            source: 'coordinates'
        };
    }

    const search = normalizeSearchText(input.birthPlace);
    if (!search) return null;

    const location = KNOWN_BIRTH_LOCATIONS.find((candidate) => (
        candidate.aliases.some((alias) => {
            const normalizedAlias = normalizeSearchText(alias);
            if (normalizedAlias.length <= 2) {
                return search === normalizedAlias || search.split(' ').includes(normalizedAlias);
            }
            return search === normalizedAlias || search.includes(normalizedAlias);
        })
    ));

    if (!location) return null;

    return {
        name: location.name,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
        timeZone: location.timeZone,
        source: 'local_city_database'
    };
}

function getTimeZoneOffsetMinutes(date, timeZone) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    });
    const parts = Object.fromEntries(
        formatter.formatToParts(date)
            .filter((part) => part.type !== 'literal')
            .map((part) => [part.type, Number(part.value)])
    );
    const localAsUtc = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second
    );

    return Math.round((localAsUtc - date.getTime()) / 60000);
}

function utcDateFromLocalTime(parts, timeZone) {
    let utcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);

    for (let i = 0; i < 3; i += 1) {
        const offsetMinutes = getTimeZoneOffsetMinutes(new Date(utcMs), timeZone);
        const nextUtcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0) - offsetMinutes * 60000;
        if (nextUtcMs === utcMs) break;
        utcMs = nextUtcMs;
    }

    return new Date(utcMs);
}

function parseBirthDateTime({ birthDate, birthTime }, location = null) {
    const match = String(birthDate || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        throw new Error('birthDate must be in YYYY-MM-DD format');
    }

    const [, rawYear, rawMonth, rawDay] = match;
    const year = Number(rawYear);
    const month = Number(rawMonth);
    const day = Number(rawDay);
    let hour = 12;
    let minute = 0;
    let hasExactTime = false;
    const notes = [];

    const timeMatch = String(birthTime || '').match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
        const parsedHour = Number(timeMatch[1]);
        const parsedMinute = Number(timeMatch[2]);
        if (parsedHour <= 23 && parsedMinute <= 59) {
            hour = parsedHour;
            minute = parsedMinute;
            hasExactTime = true;
        } else {
            notes.push('Cas narozeni je mimo platny rozsah, vypocet pouzil poledne UTC.');
        }
    } else if (birthTime) {
        notes.push('Cas narozeni nema format HH:mm, vypocet pouzil poledne UTC.');
    } else {
        notes.push('Cas narozeni chybi, rychle planety a Mesic jsou pocitane pro poledne UTC.');
    }

    const dateOnly = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    if (
        dateOnly.getUTCFullYear() !== year ||
        dateOnly.getUTCMonth() !== month - 1 ||
        dateOnly.getUTCDate() !== day
    ) {
        throw new Error('birthDate is not a real calendar date');
    }

    let date;
    let timezoneOffsetMinutes = 0;
    if (location?.timeZone) {
        try {
            date = utcDateFromLocalTime({ year, month, day, hour, minute }, location.timeZone);
            timezoneOffsetMinutes = getTimeZoneOffsetMinutes(date, location.timeZone);
            notes.push(`Misto narozeni rozpoznano jako ${location.name}, cas interpretovan v zone ${location.timeZone}.`);
        } catch {
            date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
            notes.push('Casove pasmo rozpoznaneho mista se nepodarilo pouzit, vypocet pouzil UTC.');
        }
    } else {
        date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    }

    return {
        date,
        hasExactTime,
        notes,
        timezoneOffsetMinutes,
        localDateTime: { year, month, day, hour, minute }
    };
}

function solveEccentricAnomaly(meanAnomalyDegrees, eccentricity) {
    const meanAnomaly = degreesToRadians(normalizeDegrees(meanAnomalyDegrees));
    let eccentricAnomaly = meanAnomaly;

    for (let i = 0; i < 8; i += 1) {
        const delta = (
            eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly
        ) / (1 - eccentricity * Math.cos(eccentricAnomaly));
        eccentricAnomaly -= delta;
        if (Math.abs(delta) < 1e-7) break;
    }

    return eccentricAnomaly;
}

function heliocentricPosition(elements) {
    const eccentricAnomaly = solveEccentricAnomaly(elements.M, elements.e);
    const xv = elements.a * (Math.cos(eccentricAnomaly) - elements.e);
    const yv = elements.a * Math.sqrt(1 - elements.e * elements.e) * Math.sin(eccentricAnomaly);
    const trueAnomaly = Math.atan2(yv, xv);
    const radius = Math.sqrt(xv * xv + yv * yv);

    const N = degreesToRadians(elements.N);
    const i = degreesToRadians(elements.i);
    const w = degreesToRadians(elements.w);
    const vw = trueAnomaly + w;

    const x = radius * (Math.cos(N) * Math.cos(vw) - Math.sin(N) * Math.sin(vw) * Math.cos(i));
    const y = radius * (Math.sin(N) * Math.cos(vw) + Math.cos(N) * Math.sin(vw) * Math.cos(i));
    const z = radius * (Math.sin(vw) * Math.sin(i));

    return {
        x,
        y,
        z,
        longitude: normalizeDegrees(radiansToDegrees(Math.atan2(y, x))),
        radius
    };
}

function calculateMoonLongitude(daysSinceEpoch) {
    const elements = {
        N: 125.1228 - 0.0529538083 * daysSinceEpoch,
        i: 5.1454,
        w: 318.0634 + 0.1643573223 * daysSinceEpoch,
        a: 60.2666,
        e: 0.054900,
        M: 115.3654 + 13.0649929509 * daysSinceEpoch
    };

    const moon = heliocentricPosition(elements);
    return moon.longitude;
}

function calculatePlutoLongitude(daysSinceJ2000) {
    const meanLongitude = 238.92903833 + 0.00396 * daysSinceJ2000;
    const meanAnomaly = 14.882 + 0.0039757 * daysSinceJ2000;
    return normalizeDegrees(
        meanLongitude +
        10.2 * Math.sin(degreesToRadians(meanAnomaly)) +
        1.2 * Math.sin(degreesToRadians(2 * meanAnomaly))
    );
}

function calculateLongitudes(julianDay) {
    const daysSinceEpoch = julianDay - SCHLYTER_EPOCH_JULIAN_DAY;
    const daysSinceJ2000 = julianDay - J2000_JULIAN_DAY;
    const sunVector = heliocentricPosition(ORBITAL_ELEMENTS.earth(daysSinceEpoch));
    const longitudes = {
        sun: sunVector.longitude,
        moon: calculateMoonLongitude(daysSinceEpoch),
        pluto: calculatePlutoLongitude(daysSinceJ2000)
    };

    for (const planetId of ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']) {
        const planet = heliocentricPosition(ORBITAL_ELEMENTS[planetId](daysSinceEpoch));
        longitudes[planetId] = normalizeDegrees(
            radiansToDegrees(Math.atan2(planet.y + sunVector.y, planet.x + sunVector.x))
        );
    }

    return longitudes;
}

function calculatePlanetaryPositions(julianDay) {
    const longitudes = calculateLongitudes(julianDay);
    const previousLongitudes = calculateLongitudes(julianDay - 1);

    return PLANET_DEFINITIONS.reduce((positions, planet) => {
        const longitude = longitudes[planet.id];
        const previousLongitude = previousLongitudes[planet.id];
        const sign = getZodiacSignByLongitude(longitude);
        const speed = signedDegreeDelta(previousLongitude, longitude);

        positions[planet.id] = {
            id: planet.id,
            name: planet.name,
            symbol: planet.symbol,
            group: planet.group,
            longitude: round(longitude, 2),
            sign: {
                id: sign.id,
                name: sign.name,
                symbol: sign.symbol,
                element: sign.element,
                quality: sign.quality
            },
            degreeInSign: sign.degree,
            degreeText: sign.degreeText,
            speed: round(speed, 3),
            retrograde: !['sun', 'moon'].includes(planet.id) && speed < -0.01
        };

        return positions;
    }, {});
}

export function calculateAspects(planets) {
    const planetIds = Object.keys(planets);
    const aspects = [];

    for (let i = 0; i < planetIds.length; i += 1) {
        for (let j = i + 1; j < planetIds.length; j += 1) {
            const planetA = planets[planetIds[i]];
            const planetB = planets[planetIds[j]];
            const distance = angularDistance(planetA.longitude, planetB.longitude);

            for (const aspect of ASPECT_DEFINITIONS) {
                const hasLuminary = planetA.group === 'luminary' || planetB.group === 'luminary';
                const maxOrb = aspect.orb + (hasLuminary ? 1 : 0);
                const orb = Math.abs(distance - aspect.angle);

                if (orb <= maxOrb) {
                    aspects.push({
                        planetA: planetA.id,
                        planetB: planetB.id,
                        planetALabel: planetA.name,
                        planetBLabel: planetB.name,
                        aspect: aspect.id,
                        name: aspect.name,
                        polarity: aspect.polarity,
                        angle: aspect.angle,
                        exactAngle: round(distance, 2),
                        orb: round(orb, 2),
                        maxOrb
                    });
                    break;
                }
            }
        }
    }

    return aspects.sort((a, b) => a.orb - b.orb);
}

function calculateBalance(planets, property) {
    const balance = Object.values(planets).reduce((acc, planet) => {
        const definition = PLANET_DEFINITIONS.find((item) => item.id === planet.id);
        const key = planet.sign[property];
        acc[key] = (acc[key] || 0) + (definition?.weight || 1);
        return acc;
    }, {});

    const total = Object.values(balance).reduce((sum, value) => sum + value, 0);
    const entries = Object.entries(balance)
        .map(([key, value]) => ({
            key,
            label: property === 'element'
                ? (ELEMENT_TRANSLATIONS[key] || key)
                : (QUALITY_TRANSLATIONS[key] || key),
            weight: round(value, 2),
            percentage: round((value / total) * 100, 1)
        }))
        .sort((a, b) => b.weight - a.weight);

    return {
        dominant: entries[0] || null,
        items: entries
    };
}

function calculateLocalSiderealTime(julianDay, longitude) {
    const t = (julianDay - J2000_JULIAN_DAY) / 36525;
    const gmst = 280.46061837 +
        360.98564736629 * (julianDay - J2000_JULIAN_DAY) +
        0.000387933 * t * t -
        (t * t * t) / 38710000;

    return normalizeDegrees(gmst + longitude);
}

function calculateAscendantLongitude(julianDay, latitude, longitude) {
    const t = (julianDay - J2000_JULIAN_DAY) / 36525;
    const obliquity = degreesToRadians(23.439291 - 0.0130042 * t);
    const sidereal = degreesToRadians(calculateLocalSiderealTime(julianDay, longitude));
    const latitudeRad = degreesToRadians(latitude);
    const ascendant = radiansToDegrees(Math.atan2(
        -Math.cos(sidereal),
        Math.sin(sidereal) * Math.cos(obliquity) + Math.tan(latitudeRad) * Math.sin(obliquity)
    ));

    return normalizeDegrees(ascendant);
}

function buildWholeSignHouses(ascendantLongitude) {
    const ascendantSign = getZodiacSignByLongitude(ascendantLongitude);
    const ascendantSignIndex = ZODIAC_SIGNS.findIndex((sign) => sign.id === ascendantSign.id);

    return Array.from({ length: 12 }, (_, index) => {
        const sign = ZODIAC_SIGNS[(ascendantSignIndex + index) % ZODIAC_SIGNS.length];
        return {
            house: index + 1,
            sign: {
                id: sign.id,
                name: sign.name,
                symbol: sign.symbol,
                element: sign.element,
                quality: sign.quality
            },
            cuspLongitude: sign.start
        };
    });
}

function calculateHouses({ julianDay, location, hasExactTime }) {
    if (!location) {
        return {
            available: false,
            system: null,
            ascendant: null,
            houses: [],
            reason: 'Misto narozeni nebylo rozpoznano, ascendent ani domy nejsou k dispozici.'
        };
    }

    if (!hasExactTime) {
        return {
            available: false,
            system: null,
            ascendant: null,
            houses: [],
            location,
            reason: 'Bez presneho casu narozeni nepocitame ascendent ani domy.'
        };
    }

    const ascendantLongitude = calculateAscendantLongitude(julianDay, location.latitude, location.longitude);
    const ascendantSign = getZodiacSignByLongitude(ascendantLongitude);

    return {
        available: true,
        system: 'whole_sign',
        ascendant: {
            longitude: round(ascendantLongitude, 2),
            sign: {
                id: ascendantSign.id,
                name: ascendantSign.name,
                symbol: ascendantSign.symbol,
                element: ascendantSign.element,
                quality: ascendantSign.quality
            },
            degreeInSign: ascendantSign.degree,
            degreeText: ascendantSign.degreeText
        },
        houses: buildWholeSignHouses(ascendantLongitude),
        location,
        reason: null
    };
}

function assignPlanetHouses(planets, houses) {
    if (!houses.available || !houses.houses?.length) return planets;
    const firstHouseSignIndex = ZODIAC_SIGNS.findIndex((sign) => sign.id === houses.houses[0].sign.id);

    return Object.fromEntries(Object.entries(planets).map(([planetId, planet]) => {
        const planetSignIndex = ZODIAC_SIGNS.findIndex((sign) => sign.id === planet.sign.id);
        const house = ((planetSignIndex - firstHouseSignIndex + 12) % 12) + 1;

        return [planetId, {
            ...planet,
            house
        }];
    }));
}

export function calculateNatalChart(input = {}) {
    const location = resolveBirthLocation(input);
    const { date, hasExactTime, notes, timezoneOffsetMinutes, localDateTime } = parseBirthDateTime(input, location);
    const julianDay = calculateJulianDay(date);
    const houses = calculateHouses({ julianDay, location, hasExactTime });
    const planets = assignPlanetHouses(calculatePlanetaryPositions(julianDay), houses);
    const aspects = calculateAspects(planets);
    const elementBalance = calculateBalance(planets, 'element');
    const qualityBalance = calculateBalance(planets, 'quality');
    const precision = location
        ? (hasExactTime ? 'birth_time_location_timezone' : 'date_noon_location_timezone')
        : (hasExactTime ? 'birth_time_utc' : 'date_noon_utc');
    const engineNotes = [
        'Planety jsou pocitane low-precision geocentrickou efemeridou vhodnou pro produktovou interpretaci.',
        houses.available
            ? 'Ascendent a domy jsou pocitane metodou whole-sign pro rozpoznane misto a casove pasmo.'
            : 'Ascendent, domy a presne astrokartograficke linie vyzaduji rozpoznane misto narozeni a presny cas.',
        ...notes
    ];

    if (input.birthPlace && !location) {
        engineNotes.push('Misto narozeni nebylo rozpoznano v lokalni databazi mest.');
    }

    const chart = {
        engine: {
            version: 'astro-engine-v1',
            method: 'low_precision_geocentric_ephemeris',
            precision,
            notes: engineNotes
        },
        input: {
            name: input.name ? String(input.name).substring(0, 100) : null,
            birthDate: input.birthDate,
            birthTime: input.birthTime || null,
            birthPlace: input.birthPlace ? String(input.birthPlace).substring(0, 200) : null
        },
        location,
        localDateTime,
        timezoneOffsetMinutes,
        calculatedForUtc: date.toISOString(),
        julianDay: round(julianDay, 5),
        planets,
        aspects,
        elementBalance,
        qualityBalance,
        houses,
        summary: {
            sunSign: planets.sun.sign.name,
            moonSign: planets.moon.sign.name,
            ascendantSign: houses.ascendant?.sign?.name || null,
            dominantElement: elementBalance.dominant?.label || null,
            dominantQuality: qualityBalance.dominant?.label || null,
            strongestAspects: aspects.slice(0, 5)
        }
    };

    return chart;
}

function destinationAnchorLongitude(destination) {
    return normalizeDegrees(destination.longitude + 180);
}

function normalizeMapLongitude(longitude) {
    const normalized = normalizeDegrees(longitude);
    return normalized > 180 ? normalized - 360 : normalized;
}

function longitudeToMapX(longitude) {
    return round(((normalizeMapLongitude(longitude) + 180) / 360) * 100, 2);
}

function eclipticLongitudeToRightAscension(longitude, julianDay) {
    const t = (julianDay - J2000_JULIAN_DAY) / 36525;
    const obliquity = degreesToRadians(23.439291 - 0.0130042 * t);
    const lambda = degreesToRadians(longitude);

    return normalizeDegrees(radiansToDegrees(Math.atan2(
        Math.sin(lambda) * Math.cos(obliquity),
        Math.cos(lambda)
    )));
}

function angularLineTheme(planet, angle) {
    const angleThemes = {
        MC: 'viditelnost, smer a verejna role',
        IC: 'domov, koreny a vnitrni stabilita'
    };
    const planetThemes = {
        sun: 'identita a zivotni energie',
        moon: 'emoce a potreba bezpeci',
        mercury: 'komunikace a uceni',
        venus: 'laska, estetika a prijemnost',
        mars: 'tah, odvaha a telo',
        jupiter: 'rust, duvera a prilezitosti',
        saturn: 'hranice, prace a zavazek',
        uranus: 'zmena, svoboda a experiment',
        neptune: 'intuice, vize a rozpousteni hranic',
        pluto: 'hloubka, moc a transformace'
    };

    return `${planetThemes[planet.id] || planet.name}; ${angleThemes[angle]}`;
}

function calculateAngularLines(chart, intentionProfile) {
    const gmst = calculateLocalSiderealTime(chart.julianDay, 0);
    const preferredPlanets = new Set(['sun', 'moon', ...(intentionProfile.planets || [])]);

    return PLANET_DEFINITIONS
        .filter((planet) => chart.planets[planet.id])
        .map((definition) => {
            const planet = chart.planets[definition.id];
            const rightAscension = eclipticLongitudeToRightAscension(planet.longitude, chart.julianDay);
            const mcLongitude = normalizeMapLongitude(rightAscension - gmst);
            const icLongitude = normalizeMapLongitude(mcLongitude + 180);
            const priority = preferredPlanets.has(definition.id) ? 0 : 1;

            return [
                {
                    planetId: definition.id,
                    planetName: definition.name,
                    planetSign: planet.sign.name,
                    angle: 'MC',
                    angleLabel: 'Medium Coeli',
                    longitude: round(mcLongitude, 2),
                    map: { x: longitudeToMapX(mcLongitude) },
                    theme: angularLineTheme(definition, 'MC'),
                    priority
                },
                {
                    planetId: definition.id,
                    planetName: definition.name,
                    planetSign: planet.sign.name,
                    angle: 'IC',
                    angleLabel: 'Imum Coeli',
                    longitude: round(icLongitude, 2),
                    map: { x: longitudeToMapX(icLongitude) },
                    theme: angularLineTheme(definition, 'IC'),
                    priority
                }
            ];
        })
        .flat()
        .sort((a, b) => a.priority - b.priority || a.planetName.localeCompare(b.planetName) || a.angle.localeCompare(b.angle));
}

function calculateDestinationPlanetMatches(chart, destination, intentionProfile) {
    return intentionProfile.planets
        .map((planetId, index) => {
            const planet = chart.planets[planetId];
            if (!planet) return null;

            const anchor = destinationAnchorLongitude(destination);
            const distance = angularDistance(planet.longitude, anchor);
            const closenessScore = Math.max(0, 1 - distance / 180) * 48;
            const themeScore = destination.themes.includes(intentionProfile.key)
                ? 22
                : (destination.themes.includes('obecny') ? 10 : 4);
            const planetScore = destination.planets.includes(planetId) ? 18 : 6;
            const elementScore = destination.elements.includes(planet.sign.element) ? 8 : 0;
            const priorityPenalty = index * 3;

            return {
                planetId,
                planetName: planet.name,
                sign: planet.sign.name,
                degreeText: planet.degreeText,
                distance: round(distance, 2),
                score: round(closenessScore + themeScore + planetScore + elementScore + 18 - priorityPenalty, 1)
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);
}

function buildDestinationReason(destination, intentionProfile, match) {
    return [
        `${destination.name} ladí hlavně přes planetu ${match.planetName} ve znamení ${match.sign}.`,
        `Pro záměr ${intentionProfile.label} podporuje ${destination.use}.`
    ].join(' ');
}

export function calculateAstrocartographyInsights(input = {}, intention = 'obecny', chartOverride = null) {
    const chart = chartOverride || calculateNatalChart(input);
    const intentionKey = normalizeAstroIntention(intention);
    const intentionProfile = {
        key: intentionKey,
        ...ASTRO_INTENTION_PROFILES[intentionKey]
    };

    const recommendations = ASTRO_DESTINATION_CATALOG
        .map((destination) => {
            const planetMatches = calculateDestinationPlanetMatches(chart, destination, intentionProfile);
            const primaryMatch = planetMatches[0];
            const secondaryMatch = planetMatches[1] || null;
            const score = clampScore(primaryMatch?.score || 0);

            return {
                id: destination.id,
                city: destination.name,
                country: destination.country,
                region: destination.region,
                latitude: destination.latitude,
                longitude: destination.longitude,
                map: destination.map,
                score,
                tone: score >= 76 ? 'silná rezonance' : (score >= 62 ? 'podpůrná rezonance' : 'jemná rezonance'),
                themes: destination.themes,
                primaryPlanet: primaryMatch ? {
                    id: primaryMatch.planetId,
                    name: primaryMatch.planetName,
                    sign: primaryMatch.sign,
                    degreeText: primaryMatch.degreeText,
                    distance: primaryMatch.distance
                } : null,
                secondaryPlanet: secondaryMatch ? {
                    id: secondaryMatch.planetId,
                    name: secondaryMatch.planetName,
                    sign: secondaryMatch.sign,
                    degreeText: secondaryMatch.degreeText,
                    distance: secondaryMatch.distance
                } : null,
                reason: primaryMatch
                    ? buildDestinationReason(destination, intentionProfile, primaryMatch)
                    : `Pro záměr ${intentionProfile.label} má toto místo spíše doplňkový význam.`,
                practicalUse: destination.use,
                caution: destination.caution
            };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    const angularLines = calculateAngularLines(chart, intentionProfile);

    return {
        engine: {
            version: 'astro-engine-v1',
            method: 'symbolic_destination_resonance',
            isSymbolic: true,
            note: 'Doporučení míst vychází z vypočtené natální mapy a tematického skóre destinací. MC/IC meridiány jsou low-precision aproximační vrstva; ASC/DSC křivky zatím nejsou přesné planetární linie.'
        },
        intention: {
            key: intentionKey,
            label: intentionProfile.label,
            theme: intentionProfile.theme,
            planets: intentionProfile.planets
        },
        precision: chart.engine.precision,
        location: chart.location ? {
            name: chart.location.name,
            country: chart.location.country,
            source: chart.location.source
        } : null,
        notes: chart.engine.notes,
        chartSummary: chart.summary,
        angularLines,
        recommendations
    };
}

function signCompatibilityScore(signA, signB) {
    if (signA.id === signB.id) return 84;
    if (signA.element === signB.element) return 88;

    const supportivePairs = new Set(['fire-air', 'air-fire', 'earth-water', 'water-earth']);
    const tensePairs = new Set(['fire-water', 'water-fire', 'earth-air', 'air-earth']);
    const pair = `${signA.element}-${signB.element}`;

    if (supportivePairs.has(pair)) return 76;
    if (tensePairs.has(pair)) return 48;
    if (signA.quality === signB.quality) return 62;

    return 58;
}

function aspectCompatibilityScore(aspect) {
    const baseScores = {
        trine: 90,
        sextile: 80,
        conjunction: 72,
        opposition: 60,
        square: 44
    };
    const exactnessBonus = Math.max(0, 1 - aspect.orb / aspect.maxOrb) * 8;
    return Math.min(95, Math.max(35, (baseScores[aspect.aspect] || 60) + exactnessBonus));
}

function average(values) {
    const numeric = values.filter((value) => typeof value === 'number' && Number.isFinite(value));
    if (!numeric.length) return null;
    return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function clampScore(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
}

const CHART_PRECISION_RANK = {
    birth_time_location_timezone: 4,
    birth_time_utc: 3,
    date_noon_location_timezone: 2,
    date_noon_utc: 1
};

function combineChartPrecision(...charts) {
    const precisions = charts
        .map((chart) => chart?.engine?.precision)
        .filter(Boolean);

    if (!precisions.length) return 'unknown';

    return precisions.reduce((lowest, precision) => (
        (CHART_PRECISION_RANK[precision] || 0) < (CHART_PRECISION_RANK[lowest] || 0)
            ? precision
            : lowest
    ), precisions[0]);
}

function calculateCrossAspects(chartA, chartB) {
    const aspects = [];

    for (const planetA of Object.values(chartA.planets)) {
        for (const planetB of Object.values(chartB.planets)) {
            const distance = angularDistance(planetA.longitude, planetB.longitude);

            for (const aspect of ASPECT_DEFINITIONS) {
                const hasLuminary = planetA.group === 'luminary' || planetB.group === 'luminary';
                const maxOrb = aspect.orb + (hasLuminary ? 1 : 0);
                const orb = Math.abs(distance - aspect.angle);

                if (orb <= maxOrb) {
                    aspects.push({
                        planetA: planetA.id,
                        planetB: planetB.id,
                        planetALabel: planetA.name,
                        planetBLabel: planetB.name,
                        aspect: aspect.id,
                        name: aspect.name,
                        polarity: aspect.polarity,
                        angle: aspect.angle,
                        exactAngle: round(distance, 2),
                        orb: round(orb, 2),
                        maxOrb,
                        score: round(aspectCompatibilityScore({ ...aspect, aspect: aspect.id, orb, maxOrb }), 1)
                    });
                    break;
                }
            }
        }
    }

    return aspects.sort((a, b) => a.orb - b.orb);
}

function getNatalTransitPoints(chart) {
    const points = { ...chart.planets };

    if (chart.houses?.ascendant) {
        points.ascendant = {
            id: 'ascendant',
            name: 'Ascendent',
            group: 'angle',
            longitude: chart.houses.ascendant.longitude,
            sign: chart.houses.ascendant.sign
        };
    }

    return points;
}

function calculateTransitAspects(natalChart, currentChart) {
    const currentPlanetIds = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    const natalPoints = getNatalTransitPoints(natalChart);
    const aspects = [];

    for (const currentId of currentPlanetIds) {
        const currentPlanet = currentChart.planets[currentId];
        if (!currentPlanet) continue;

        for (const natalPoint of Object.values(natalPoints)) {
            const distance = angularDistance(currentPlanet.longitude, natalPoint.longitude);

            for (const aspect of ASPECT_DEFINITIONS) {
                const hasLuminary = currentPlanet.group === 'luminary' || natalPoint.group === 'luminary';
                const maxOrb = aspect.orb + (hasLuminary ? 1 : 0);
                const orb = Math.abs(distance - aspect.angle);

                if (orb <= maxOrb) {
                    aspects.push({
                        transitPlanet: currentPlanet.id,
                        natalPoint: natalPoint.id,
                        transitPlanetLabel: currentPlanet.name,
                        natalPointLabel: natalPoint.name,
                        aspect: aspect.id,
                        name: aspect.name,
                        polarity: aspect.polarity,
                        angle: aspect.angle,
                        exactAngle: round(distance, 2),
                        orb: round(orb, 2),
                        maxOrb
                    });
                    break;
                }
            }
        }
    }

    return aspects.sort((a, b) => a.orb - b.orb);
}

function describeTransitAspect(aspect, currentChart) {
    if (!aspect) {
        return {
            title: `Slunce ve znamení ${currentChart.summary.sunSign}`,
            subtitle: 'aktuální obloha bez silného hlavního aspektu',
            message: 'Dnešní energie je spíše rozprostřená. Všímejte si drobných změn nálady, tempa a motivace místo jedné výrazné výzvy.'
        };
    }

    const polarityMessages = {
        harmonious: 'Tento aspekt přináší přirozenější tok energie. Je vhodný čas využít podporu, která už je dostupná.',
        supportive: 'Tento aspekt otevírá praktickou příležitost. Funguje nejlépe, když uděláte jeden konkrétní krok.',
        intense: 'Tento aspekt zesiluje dané téma. Všímejte si, co se opakuje, protože právě tam je dnešní hlavní lekce.',
        dynamic: 'Tento aspekt nastavuje zrcadlo. Vztahy a vnější události mohou ukázat, kde je potřeba vyrovnat síly.',
        tense: 'Tento aspekt přináší tlak k pohybu. Nemusí být pohodlný, ale pomáhá pojmenovat, co už nechcete odkládat.'
    };

    return {
        title: `${aspect.transitPlanetLabel} ${aspect.name.toLowerCase()} ${aspect.natalPointLabel}`,
        subtitle: `orb ${aspect.orb}° vůči vaší natální mapě`,
        message: polarityMessages[aspect.polarity] || 'Dnešní tranzit zvýrazňuje jedno z vašich natálních témat. Sledujte, kde se energie projevuje v konkrétních rozhodnutích.'
    };
}

export function calculateTransitSnapshot(input = {}, now = new Date()) {
    const natalChart = calculateNatalChart(input);
    const currentChart = calculateNatalChart({
        birthDate: now.toISOString().slice(0, 10),
        birthTime: now.toISOString().slice(11, 16),
        name: 'Aktuální obloha'
    });
    const aspects = calculateTransitAspects(natalChart, currentChart);
    const strongest = aspects[0] || null;
    const description = describeTransitAspect(strongest, currentChart);

    return {
        engine: {
            version: 'astro-engine-v1',
            method: 'current_planets_to_natal_aspects',
            calculatedAt: now.toISOString()
        },
        current: {
            sunSign: currentChart.summary.sunSign,
            moonSign: currentChart.summary.moonSign
        },
        natal: {
            sunSign: natalChart.summary.sunSign,
            moonSign: natalChart.summary.moonSign,
            ascendantSign: natalChart.summary.ascendantSign
        },
        strongestAspect: strongest,
        aspects: aspects.slice(0, 10),
        title: description.title,
        subtitle: description.subtitle,
        message: description.message
    };
}

function averageAspectForPairs(crossAspects, allowedA, allowedB) {
    const filtered = crossAspects.filter((aspect) => (
        allowedA.includes(aspect.planetA) && allowedB.includes(aspect.planetB)
    ) || (
        allowedA.includes(aspect.planetB) && allowedB.includes(aspect.planetA)
    ));

    return average(filtered.map((aspect) => aspect.score));
}

function calculateSynastryScoreBreakdown(chartA, chartB, crossAspects) {
    const emotionBase = average([
        signCompatibilityScore(chartA.planets.moon.sign, chartB.planets.moon.sign),
        signCompatibilityScore(chartA.planets.moon.sign, chartB.planets.sun.sign),
        signCompatibilityScore(chartA.planets.sun.sign, chartB.planets.moon.sign)
    ]);
    const communicationBase = average([
        signCompatibilityScore(chartA.planets.mercury.sign, chartB.planets.mercury.sign),
        signCompatibilityScore(chartA.planets.sun.sign, chartB.planets.mercury.sign),
        signCompatibilityScore(chartB.planets.sun.sign, chartA.planets.mercury.sign)
    ]);
    const passionBase = average([
        signCompatibilityScore(chartA.planets.venus.sign, chartB.planets.mars.sign),
        signCompatibilityScore(chartA.planets.mars.sign, chartB.planets.venus.sign),
        signCompatibilityScore(chartA.planets.venus.sign, chartB.planets.venus.sign)
    ]);
    const stabilityBase = average([
        signCompatibilityScore(chartA.planets.saturn.sign, chartB.planets.sun.sign),
        signCompatibilityScore(chartB.planets.saturn.sign, chartA.planets.sun.sign),
        signCompatibilityScore(chartA.planets.jupiter.sign, chartB.planets.jupiter.sign)
    ]);

    const emotionAspects = averageAspectForPairs(crossAspects, ['moon', 'venus'], ['moon', 'sun', 'venus']);
    const communicationAspects = averageAspectForPairs(crossAspects, ['mercury'], ['mercury', 'sun', 'moon']);
    const passionAspects = averageAspectForPairs(crossAspects, ['venus', 'mars'], ['venus', 'mars', 'sun']);
    const stabilityAspects = averageAspectForPairs(crossAspects, ['saturn', 'jupiter'], ['sun', 'moon', 'saturn', 'jupiter']);

    const emotion = clampScore((emotionBase * 0.7) + ((emotionAspects ?? emotionBase) * 0.3));
    const communication = clampScore((communicationBase * 0.72) + ((communicationAspects ?? communicationBase) * 0.28));
    const passion = clampScore((passionBase * 0.65) + ((passionAspects ?? passionBase) * 0.35));
    const stability = clampScore((stabilityBase * 0.72) + ((stabilityAspects ?? stabilityBase) * 0.28));
    const total = clampScore((emotion * 0.32) + (communication * 0.23) + (passion * 0.27) + (stability * 0.18));

    return { total, emotion, communication, passion, stability };
}

export function calculateSynastryChart(person1, person2) {
    const chartA = calculateNatalChart(person1);
    const chartB = calculateNatalChart(person2);
    const crossAspects = calculateCrossAspects(chartA, chartB);
    const scores = calculateSynastryScoreBreakdown(chartA, chartB, crossAspects);

    return {
        engine: {
            version: 'astro-engine-v1',
            method: 'natal_chart_cross_aspects',
            precision: combineChartPrecision(chartA, chartB),
            person1Precision: chartA.engine.precision,
            person2Precision: chartB.engine.precision
        },
        person1: {
            name: person1?.name ? String(person1.name).substring(0, 100) : 'Osoba A',
            chart: chartA
        },
        person2: {
            name: person2?.name ? String(person2.name).substring(0, 100) : 'Osoba B',
            chart: chartB
        },
        scores,
        crossAspects: crossAspects.slice(0, 24),
        summary: {
            sunSigns: `${chartA.summary.sunSign} + ${chartB.summary.sunSign}`,
            moonSigns: `${chartA.summary.moonSign} + ${chartB.summary.moonSign}`,
            strongestCrossAspects: crossAspects.slice(0, 6)
        }
    };
}

function formatPlanetLine(planet) {
    const retrograde = planet.retrograde ? ' R' : '';
    return `${planet.name}: ${planet.sign.name} ${planet.degreeText} (${planet.longitude}°)${retrograde}`;
}

function formatAspectLine(aspect) {
    return `${aspect.planetALabel} - ${aspect.planetBLabel}: ${aspect.name}, orb ${aspect.orb}°`;
}

function formatHouseLine(house) {
    return `${house.house}. dum: ${house.sign.name}`;
}

export function formatNatalChartForPrompt(chart) {
    const planetLines = PLANET_DEFINITIONS
        .map((planet) => chart.planets[planet.id])
        .filter(Boolean)
        .map(formatPlanetLine)
        .join('\n');
    const aspectLines = chart.aspects.slice(0, 10).map(formatAspectLine).join('\n') || 'Bez hlavních aspektů v nastaveném orbu.';
    const houseLines = chart.houses.available
        ? chart.houses.houses.map(formatHouseLine).join('\n')
        : chart.houses.reason;

    return [
        'Vypoctena natalni data z astro enginu:',
        `Presnost: ${chart.engine.precision}`,
        `Misto narozeni: ${chart.location?.name || 'nerozpoznano'}`,
        `Slunce: ${chart.summary.sunSign}`,
        `Mesic: ${chart.summary.moonSign}`,
        `Ascendent: ${chart.summary.ascendantSign || 'nevypocten'}`,
        `Dominantni element: ${chart.summary.dominantElement || 'neurceno'}`,
        `Dominantni modalita: ${chart.summary.dominantQuality || 'neurceno'}`,
        '',
        'Planety:',
        planetLines,
        '',
        'Nejsilnejsi aspekty:',
        aspectLines,
        '',
        'Domy:',
        houseLines,
        '',
        'Dulezite: Neprepocitavej planety podle obecnych tabulek. Pouzij vyse uvedena data.',
        chart.houses.available
            ? 'Ascendent a whole-sign domy muzes interpretovat. Presne astrokartograficke linie zatim nevydavej za vypoctene.'
            : 'Pokud zminujes ascendent, domy nebo presne astrocartograficke linie, vysvetli, proc zatim nejsou vypoctene.'
    ].join('\n');
}

export function formatSynastryForPrompt(synastry) {
    const crossAspectLines = synastry.crossAspects.slice(0, 12).map((aspect) => (
        `${synastry.person1.name} ${aspect.planetALabel} - ${synastry.person2.name} ${aspect.planetBLabel}: ${aspect.name}, orb ${aspect.orb}°, score ${aspect.score}`
    )).join('\n') || 'Bez hlavních křížových aspektů v nastaveném orbu.';
    const person1Location = synastry.person1.chart.location?.name || 'misto nerozpoznano';
    const person2Location = synastry.person2.chart.location?.name || 'misto nerozpoznano';

    return [
        'Vypoctena synastricka data z astro enginu:',
        `Presnost celkem: ${synastry.engine.precision}; osoba A: ${synastry.engine.person1Precision}; osoba B: ${synastry.engine.person2Precision}`,
        `${synastry.person1.name}: Slunce ${synastry.person1.chart.summary.sunSign}, Mesic ${synastry.person1.chart.summary.moonSign}, Ascendent ${synastry.person1.chart.summary.ascendantSign || 'nevypocten'}, misto ${person1Location}`,
        `${synastry.person2.name}: Slunce ${synastry.person2.chart.summary.sunSign}, Mesic ${synastry.person2.chart.summary.moonSign}, Ascendent ${synastry.person2.chart.summary.ascendantSign || 'nevypocten'}, misto ${person2Location}`,
        `Skore celkem: ${synastry.scores.total}`,
        `Emoce: ${synastry.scores.emotion}`,
        `Komunikace: ${synastry.scores.communication}`,
        `Vasen/chemie: ${synastry.scores.passion}`,
        `Stabilita: ${synastry.scores.stability}`,
        '',
        'Nejsilnejsi krizove aspekty:',
        crossAspectLines,
        '',
        'Dulezite: Interpretuj vztah nad temito vypoctenymi daty. Neuvadej fatalisticke soudy ani sliby jistych udalosti.'
    ].join('\n');
}

export function formatAstrocartographyForPrompt(insights) {
    const sourceLocation = insights.location
        ? `${insights.location.name}${insights.location.country ? ` (${insights.location.country})` : ''}`
        : 'misto narozeni nebylo rozpoznano';
    const destinationLines = insights.recommendations.map((destination, index) => (
        `${index + 1}. ${destination.city}, ${destination.country}: ${destination.score}/100, ${destination.tone}; ` +
        `hlavni planeta ${destination.primaryPlanet?.name || 'neurceno'} v ${destination.primaryPlanet?.sign || 'neurceno'} ${destination.primaryPlanet?.degreeText || ''}; ` +
        `${destination.reason} Prakticky: ${destination.practicalUse}. Pozor: ${destination.caution}`
    )).join('\n');
    const angularLineLines = (insights.angularLines || []).slice(0, 8).map((line) => (
        `${line.planetName} ${line.angle}: ${line.longitude}° zemepisne delky (${line.theme})`
    )).join('\n') || 'MC/IC meridiany nejsou dostupne.';

    return [
        'Vypoctena symbolicka astrokartograficka data z astro enginu:',
        `Metoda: ${insights.engine.method}`,
        `Zamer: ${insights.intention.label} (${insights.intention.theme})`,
        `Presnost zdrojove mapy: ${insights.precision || 'unknown'}`,
        `Misto narozeni: ${sourceLocation}`,
        `Natalni shrnuti: Slunce ${insights.chartSummary.sunSign}, Mesic ${insights.chartSummary.moonSign}, Ascendent ${insights.chartSummary.ascendantSign || 'nevypocten'}`,
        '',
        'Doporucena mista podle symbolicke rezonance:',
        destinationLines,
        '',
        'Aproximovane MC/IC meridiany planet:',
        angularLineLines,
        '',
        'Dulezite: Doporucena mista jsou symbolicka. MC/IC meridiany jsou low-precision vypocetni vrstva, ale ASC/DSC krivky zatim nejsou presne planetarni linie. Neslibuj jistou udalost.'
    ].join('\n');
}

// ============================================
// HOROSCOPE CACHE & UTILS
// ============================================

// Generate cache key based on sign, period, and date
export function getHoroscopeCacheKey(sign, period) {
    const now = new Date();
    const signNormalized = sign.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (period === 'weekly') {
        // ISO week number
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        return `${signNormalized}_weekly_${now.getFullYear()}-W${String(week).padStart(2, '0')}_v3`;
    } else if (period === 'monthly') {
        return `${signNormalized}_monthly_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}_v3`;
    } else {
        // Daily (default)
        return `${signNormalized}_daily_${now.toISOString().split('T')[0]}_v3`;
    }
}

// Get cached horoscope from database
export async function getCachedHoroscope(cacheKey) {
    try {
        const { data, error } = await supabase
            .from('cache_horoscopes')
            .select('cache_key, response, period_label, generated_at')
            .eq('cache_key', cacheKey)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }

        return data;
    } catch (e) {
        console.warn('Cache get error:', e.message);
        return null;
    }
}

// Save horoscope to database cache
export async function saveCachedHoroscope(cacheKey, sign, period, response, periodLabel) {
    try {
        const { error } = await supabase
            .from('cache_horoscopes')
            .upsert({
                cache_key: cacheKey,
                sign,
                period,
                response,
                period_label: periodLabel,
                generated_at: new Date().toISOString()
            }, {
                onConflict: 'cache_key'
            });

        if (error) throw error;
    } catch (e) {
        console.warn('Cache save error:', e.message);
    }
}
