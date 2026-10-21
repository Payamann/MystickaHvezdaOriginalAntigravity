/**
 * Shared fulfillment logic for one-time paid PDF products (Osobní mapa,
 * Roční horoskop). Generates content via Claude, renders it to PDF via
 * Playwright, and emails it via Resend.
 *
 * Used by both the Stripe webhook (payment.js, fast path right after
 * checkout) and the reconciliation job (jobs/one-time-order-reconciliation.js,
 * retry path for orders the fast path failed to deliver). Throws on any
 * failure — callers decide how to record/retry/alert.
 */

import { fulfillPersonalMapOrder } from './personal-map-fulfillment.js';
import { resolveAnnualHoroscopeYear } from './annual-horoscope-year.js';
import { validateBirthDate, validateEmail, validateName } from '../utils/validation.js';
export { fulfillPersonalMapOrder } from './personal-map-fulfillment.js';

export async function fulfillRocniHoroskopOrder({ customerName, customerEmail, payload = {}, productId = 'rocni_horoskop_2026', productYear, createdAt }) {
    const { birthDate, sign } = payload;
    const safeName = validateName(customerName);
    const safeEmail = validateEmail(customerEmail);
    const validBirthDate = validateBirthDate(birthDate);
    const year = resolveAnnualHoroscopeYear({
        productId,
        productYear,
        payloadYear: payload.productYear,
        createdAt
    });

    const { generateHoroscopeContent, renderPdf, isValidHoroscopeSign } = await import('./horoscope-pdf.js');
    const { sendHoroscopePdf } = await import('../email-service.js');

    if (!isValidHoroscopeSign(sign)) {
        throw new Error('Annual horoscope fulfillment has an invalid zodiac sign.');
    }

    const sections = await generateHoroscopeContent({ name: safeName, birthDate: validBirthDate, sign, year });
    const pdfBuffer = await renderPdf({ name: safeName, sign, birthDate: validBirthDate, sections, year });

    await sendHoroscopePdf({ to: safeEmail, name: safeName, sign, pdfBuffer, year });
}

export async function fulfillOneTimeOrder({ productType, productId, customerName, customerEmail, payload, orderId, createdAt }) {
    if (productType === 'relationship_tarot') {
        const { fulfillRelationshipTarotOrder } = await import('./relationship-tarot-fulfillment.js');
        return fulfillRelationshipTarotOrder({ orderId });
    }
    if (productType === 'personal_map') {
        return fulfillPersonalMapOrder({ orderId });
    }
    if (productType === 'rocni_horoskop') {
        return fulfillRocniHoroskopOrder({ customerName, customerEmail, payload, productId, createdAt });
    }
    throw new Error(`Unknown one-time product type: ${productType}`);
}
