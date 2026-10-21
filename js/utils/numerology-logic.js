export const NUMBER_MEANINGS = {
    1: { title: 'Samostatnost', short: 'Začátek a vlastní směr' },
    2: { title: 'Spolupráce', short: 'Naslouchání a dohoda' },
    3: { title: 'Tvořivost', short: 'Vyjádření a nápady' },
    4: { title: 'Pevný základ', short: 'Řád a vytrvalost' },
    5: { title: 'Prostor pro změnu', short: 'Zvídavost a nové zkušenosti' },
    6: { title: 'Péče a hranice', short: 'Blízkost a odpovědnost' },
    7: { title: 'Prostor pro otázky', short: 'Pozornost a poznávání' },
    8: { title: 'Směr a odpovědnost', short: 'Zdroje a rozhodování' },
    9: { title: 'Dokončení', short: 'Nadhled a uzavření' },
    11: { title: 'Citlivost a inspirace', short: 'Podnět a uzemnění' },
    22: { title: 'Od nápadu k základu', short: 'Vize a proveditelný plán' },
    33: { title: 'Péče s mírou', short: 'Podpora a hranice' }
};

export function getTodayIsoDate(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Prague',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);
    const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

export function isValidBirthDate(birthDate, today = getTodayIsoDate()) {
    if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return false;
    const date = new Date(`${birthDate}T00:00:00Z`);
    if (Number(birthDate.slice(0, 4)) < 1 || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== birthDate) return false;
    return birthDate <= today;
}

export function reduceToSingleDigit(num, preserveMaster = true) {
    num = Number(num);
    if (!Number.isFinite(num) || num < 0 || !Number.isInteger(num)) return 0;
    while (num > 9) {
        if (preserveMaster && (num === 11 || num === 22 || num === 33)) {
            return num;
        }
        num = ('' + num).split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    }
    return num;
}

export function calculateLifePath(birthDate, today = getTodayIsoDate()) {
    if (!isValidBirthDate(birthDate, today)) return 0;
    const [year, month, day] = birthDate.split('-').map(Number);
    if (!year || !month || !day) return 0;

    const daySum = reduceToSingleDigit(day);
    const monthSum = reduceToSingleDigit(month);
    const yearSum = reduceToSingleDigit(year);
    return reduceToSingleDigit(daySum + monthSum + yearSum);
}

export function letterToNumber(letter) {
    const letterMap = {
        'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
        'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
        'S': 1, 'T': 2, 'U': 3, 'V': 4, 'W': 5, 'X': 6, 'Y': 7, 'Z': 8
    };
    // Basic normalization for accents
    const normalized = letter.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return letterMap[normalized.toUpperCase()] || 0;
}

export function calculateDestiny(name) {
    if (!name) return 0;
    const sum = name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Normalize accents
        .replace(/[^a-zA-Z]/g, '')
        .split('')
        .reduce((total, char) => total + letterToNumber(char), 0);
    return reduceToSingleDigit(sum);
}

export function calculateSoul(name) {
    if (!name) return 0;
    const vowels = 'AEIOUY';
    const sum = name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Normalize accents
        .toUpperCase()
        .split('')
        .filter(char => vowels.includes(char))
        .reduce((total, char) => total + letterToNumber(char), 0);
    return reduceToSingleDigit(sum);
}

export function calculatePersonality(name) {
    if (!name) return 0;
    const vowels = 'AEIOUY';
    const sum = name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Normalize accents
        .toUpperCase()
        .split('')
        .filter(char => !vowels.includes(char) && /[A-Z]/.test(char))
        .reduce((total, char) => total + letterToNumber(char), 0);
    return reduceToSingleDigit(sum);
}


export function calculatePersonalCycles(birthDate, targetDate = new Date()) {
    if (!isValidBirthDate(birthDate)) return null;
    const [bYear, bMonth, bDay] = birthDate.split('-').map(Number);
    if (!bMonth || !bDay) return null;

    // Use the same Czech calendar date as the input limit and server validation.
    const [currentYear, currentMonth, currentDay] = getTodayIsoDate(targetDate).split('-').map(Number);

    // Personal Year: Day + Month + Current Year
    // reduced to 1-9 (or 11, 22)
    const pyRaw = reduceToSingleDigit(bDay) + reduceToSingleDigit(bMonth) + reduceToSingleDigit(currentYear);
    const personalYear = reduceToSingleDigit(pyRaw, true);

    // Personal Month: Personal Year + Current Month
    const pmRaw = reduceToSingleDigit(personalYear) + reduceToSingleDigit(currentMonth);
    const personalMonth = reduceToSingleDigit(pmRaw, true);

    // Personal Day: Personal Month + Current Day
    const pdRaw = reduceToSingleDigit(personalMonth) + reduceToSingleDigit(currentDay);
    const personalDay = reduceToSingleDigit(pdRaw, true);

    return { personalYear, personalMonth, personalDay };
}
