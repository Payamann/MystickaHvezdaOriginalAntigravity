import reference from '../../data/generated/moon-primary-phases.js';

const DAY_MS = 86400000;
const MEAN_CYCLE_DAYS = 29.53058867;
const REFERENCE_NEW_MOON = Date.parse('2026-02-17T12:01:00Z');
const quarter = { 'New Moon': 0, 'First Quarter': .25, 'Full Moon': .5, 'Last Quarter': .75 };
const events = reference.events.map(event => ({ ...event, time: Date.parse(event.at) }));
const phases = [
    ['Novoluní', 'new-moon', '🌑'], ['Dorůstající srpek', 'waxing-crescent', '🌒'],
    ['První čtvrť', 'first-quarter', '🌓'], ['Dorůstající měsíc', 'waxing-gibbous', '🌔'],
    ['Úplněk', 'full-moon', '🌕'], ['Ubývající měsíc', 'waning-gibbous', '🌖'],
    ['Poslední čtvrť', 'last-quarter', '🌗'], ['Ubývající srpek', 'waning-crescent', '🌘']
];

// Exact primary instants are from USNO; interpolation/illumination are an estimate.
// Missing years and dates outside the table use an explicitly approximate mean cycle.
export function getLunarState(input = new Date()) {
    const time = new Date(input).getTime();
    if (!Number.isFinite(time)) throw new Error('Invalid date passed to lunar state');
    const meanAge = (((time - REFERENCE_NEW_MOON) / DAY_MS) % MEAN_CYCLE_DAYS + MEAN_CYCLE_DAYS) % MEAN_CYCLE_DAYS;
    let fraction = meanAge / MEAN_CYCLE_DAYS;
    let source = 'mean-cycle';
    const nextIndex = events.findIndex(event => event.time > time);
    const previous = events[nextIndex - 1];
    const next = events[nextIndex];
    if (previous && next && next.time - previous.time < 10 * DAY_MS) {
        fraction = (quarter[previous.phase] + .25 * (time - previous.time) / (next.time - previous.time)) % 1;
        source = 'usno-primary-phases';
    }
    const exact = events.find(event => event.time === time);
    if (exact) { fraction = quarter[exact.phase]; source = 'usno-primary-phases'; }
    const previousNew = events.findLast(event => event.phase === 'New Moon' && event.time <= time);
    const measuredAge = previousNew ? (time - previousNew.time) / DAY_MS : Infinity;
    const age = source === 'usno-primary-phases' && measuredAge < 32 ? measuredAge : meanAge;
    const index = fraction < .03 || fraction >= .97 ? 0 : fraction < .22 ? 1 : fraction < .28 ? 2
        : fraction < .47 ? 3 : fraction < .53 ? 4 : fraction < .72 ? 5 : fraction < .78 ? 6 : 7;
    const [name, slug, icon] = phases[index];
    return { name, slug, icon, index, age, fraction, illumination: Math.round((1 - Math.cos(2 * Math.PI * fraction)) * 50), source, approximate: true };
}

export function getPrimaryPhaseEvents(phase) {
    return events.filter(event => event.phase === phase).map(event => ({ ...event }));
}

export function getNextPrimaryPhase(phase, input = new Date()) {
    const time = new Date(input).getTime();
    const event = events.find(event => event.phase === phase && event.time > time);
    return event && event.time - time <= 35 * DAY_MS ? { ...event } : null;
}
