const PERIOD_MONTHS = 12;
const KEY_MONTH_OFFSETS = Object.freeze([1, 3, 5, 8, 11]);
const PRODUCT_TIME_ZONE = 'Europe/Prague';

function isValidIsoDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function toIsoDate(date) {
    return date.toISOString().slice(0, 10);
}

function addUtcMonths(date, months) {
    const sourceDay = date.getUTCDate();
    const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(sourceDay, lastDay));
    return target;
}

function dateAtUtcMidnightInTimeZone(date, timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day)));
}

function rollingPeriodEnd(start) {
    const anniversary = addUtcMonths(start, PERIOD_MONTHS);

    // A leap-day purchase should still include 28 February in the following
    // non-leap year. For every regular anniversary the period ends one day
    // before the same calendar date next year.
    if (anniversary.getUTCDate() === start.getUTCDate()) {
        anniversary.setUTCDate(anniversary.getUTCDate() - 1);
    }

    return anniversary;
}

function formatDateCz(date) {
    return new Intl.DateTimeFormat('cs-CZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(date);
}

function formatMonthCz(date) {
    return new Intl.DateTimeFormat('cs-CZ', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(date);
}

function legacyStartDate(year) {
    const numericYear = Number(year);
    if (!Number.isInteger(numericYear) || numericYear < 2000 || numericYear > 2200) return null;
    return new Date(Date.UTC(numericYear, 0, 1));
}

export function buildPersonalMapPeriod({
    periodStart = '',
    periodEnd = '',
    year,
    now = new Date()
} = {}) {
    const validNow = now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
    const start = isValidIsoDate(periodStart)
        ? new Date(`${periodStart}T00:00:00Z`)
        : legacyStartDate(year)
            || dateAtUtcMidnightInTimeZone(validNow, PRODUCT_TIME_ZONE);

    const defaultEnd = rollingPeriodEnd(start);

    const requestedEnd = isValidIsoDate(periodEnd)
        ? new Date(`${periodEnd}T00:00:00Z`)
        : null;
    const end = requestedEnd && requestedEnd >= start ? requestedEnd : defaultEnd;
    const keyMonths = KEY_MONTH_OFFSETS.map((offset) => formatMonthCz(addUtcMonths(start, offset)));

    return Object.freeze({
        start: toIsoDate(start),
        end: toIsoDate(end),
        label: `${formatDateCz(start)} - ${formatDateCz(end)}`,
        keyMonths,
        months: PERIOD_MONTHS
    });
}

export function createPersonalMapPeriod(now = new Date()) {
    return buildPersonalMapPeriod({ now });
}
