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

export async function fulfillPersonalMapOrder({ customerName, customerEmail, payload = {} }) {
    const {
        birthDate,
        birthTime = '',
        birthPlace = '',
        sign,
        grammaticalGender = 'neutral',
        focus,
        productYear
    } = payload;
    const year = Number(productYear) || new Date().getFullYear();

    const { generatePersonalMapContent, renderPersonalMapPdf } = await import('./personal-map-pdf.js');
    const { sendPersonalMapPdf } = await import('../email-service.js');

    const sections = await generatePersonalMapContent({
        name: customerName,
        birthDate,
        birthTime,
        birthPlace,
        sign,
        focus,
        grammaticalGender,
        year
    });

    const pdfBuffer = await renderPersonalMapPdf({
        name: customerName,
        sign,
        birthDate,
        focus,
        year,
        productName: `Osobní mapa zbytku roku ${year}`,
        sections
    });

    await sendPersonalMapPdf({ to: customerEmail, name: customerName, sign, pdfBuffer });
}

export async function fulfillRocniHoroskopOrder({ customerName, customerEmail, payload = {} }) {
    const { birthDate, sign } = payload;

    const { generateHoroscopeContent, renderPdf } = await import('./horoscope-pdf.js');
    const { sendHoroscopePdf } = await import('../email-service.js');

    const sections = await generateHoroscopeContent({ name: customerName, birthDate, sign });
    const pdfBuffer = await renderPdf({ name: customerName, sign, birthDate, sections });

    await sendHoroscopePdf({ to: customerEmail, name: customerName, sign, pdfBuffer });
}

export async function fulfillOneTimeOrder({ productType, customerName, customerEmail, payload }) {
    if (productType === 'personal_map') {
        return fulfillPersonalMapOrder({ customerName, customerEmail, payload });
    }
    if (productType === 'rocni_horoskop') {
        return fulfillRocniHoroskopOrder({ customerName, customerEmail, payload });
    }
    throw new Error(`Unknown one-time product type: ${productType}`);
}
