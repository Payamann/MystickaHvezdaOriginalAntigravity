import { fulfillPersonalMapOrder } from './personal-map-fulfillment.js';
export { fulfillPersonalMapOrder } from './personal-map-fulfillment.js';

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

export async function fulfillRocniHoroskopOrder({ customerName, customerEmail, payload = {} }) {
    const { birthDate, sign } = payload;

    const { generateHoroscopeContent, renderPdf } = await import('./horoscope-pdf.js');
    const { sendHoroscopePdf } = await import('../email-service.js');

    const sections = await generateHoroscopeContent({ name: customerName, birthDate, sign });
    const pdfBuffer = await renderPdf({ name: customerName, sign, birthDate, sections });

    await sendHoroscopePdf({ to: customerEmail, name: customerName, sign, pdfBuffer });
}

export async function fulfillOneTimeOrder({ productType, customerName, customerEmail, payload, orderId }) {
    if (productType === 'relationship_tarot') {
        const { fulfillRelationshipTarotOrder } = await import('./relationship-tarot-fulfillment.js');
        return fulfillRelationshipTarotOrder({ orderId });
    }
    if (productType === 'personal_map') {
        return fulfillPersonalMapOrder({ orderId });
    }
    if (productType === 'rocni_horoskop') {
        return fulfillRocniHoroskopOrder({ customerName, customerEmail, payload });
    }
    throw new Error(`Unknown one-time product type: ${productType}`);
}
