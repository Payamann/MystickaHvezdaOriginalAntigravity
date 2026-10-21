const VALID_YEAR_RE = /^(?:19|20|21)\d{2}$/;

function parseYear(value) {
    const normalized = String(value ?? '').trim();
    if (!VALID_YEAR_RE.test(normalized)) return null;
    return Number(normalized);
}

/**
 * Resolve the calendar year promised by an annual-horoscope purchase.
 * The durable product ID wins so a later webhook/retry cannot silently turn
 * a 2026 order into a 2027 reading after the calendar changes.
 */
export function resolveAnnualHoroscopeYear({
    productId,
    productYear,
    payloadYear,
    createdAt,
    fallbackYear = new Date().getFullYear()
} = {}) {
    const productYearFromId = String(productId ?? '').match(/^rocni_horoskop_(\d{4})$/)?.[1];
    const productYearNumber = parseYear(productYearFromId);
    if (productYearNumber) return productYearNumber;

    const explicitProductYear = parseYear(productYear);
    if (explicitProductYear) return explicitProductYear;

    const storedPayloadYear = parseYear(payloadYear);
    if (storedPayloadYear) return storedPayloadYear;

    const orderDateYear = createdAt ? parseYear(String(createdAt).slice(0, 4)) : null;
    if (orderDateYear) return orderDateYear;

    return parseYear(fallbackYear) || new Date().getFullYear();
}
