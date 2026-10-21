import express from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { createPdfCheckoutResultRouter, pdfProofHash, pdfProofCookie } from './pdf-checkout-result.js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createIdempotentPersonalMapOrderInput, attachStripeSessionToOrderInput, listRecentLegacyOneTimeOrderInputs, markOneTimeOrderInputExpired } from '../services/one-time-orders.js';
import { recordFunnelEvent } from '../payment.js';
import { createPersonalMapPeriod } from '../services/personal-map-period.js';
import { getTodayIsoDate } from '../../js/utils/numerology-logic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const router = express.Router();
router.use(createPdfCheckoutResultRouter(getStripeClient));
const APP_URL = process.env.APP_URL || 'http://localhost:3001';
const LIVE_PERSONAL_MAP_PRICE_ID = 'price_1TRAzfAo8bdbnsKa82dgiM61';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const defaultPersonalMapPriceId = stripeSecretKey.startsWith('sk_live_') ? LIVE_PERSONAL_MAP_PRICE_ID : '';
const PRODUCT = {
    // Keep the historical ID because Stripe, analytics and delivered orders use it.
    // The customer-facing product is evergreen and no longer limited to 2026.
    id: 'osobni_mapa_2026',
    type: 'personal_map',
    name: 'Osobní mapa na 12 měsíců',
    price: 29900,
    currency: 'czk',
    periodMonths: 12,
    stripePriceId: process.env.STRIPE_PERSONAL_MAP_PRICE_ID || defaultPersonalMapPriceId
};

const VALID_GENDERS = ['feminine', 'masculine', 'neutral'];
const VALID_FOCUS_AREAS = ['relationships', 'work_money', 'change', 'energy_boundaries', 'self_direction', 'other'];
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

let stripeClient;

function getStripeClient() {
    if (stripeClient) return stripeClient;

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error('Missing STRIPE_SECRET_KEY');
    }

    stripeClient = new Stripe(secretKey);
    return stripeClient;
}

function cleanCheckoutSource(value) {
    if (typeof value !== 'string') return 'personal_map_page';
    const trimmed = value.trim();
    if (!trimmed) return 'personal_map_page';
    return trimmed.replace(/[^\w:-]/g, '_').slice(0, 80);
}

function cleanCheckoutFlowId(value) {
    if (typeof value !== 'string') return null;
    const flowId = value.trim();
    return /^[a-zA-Z0-9_-]{12,100}$/.test(flowId) ? flowId : null;
}

function personalMapCheckoutHash({ email, customerName, birthDate, birthTime, birthPlace, sign, grammaticalGender, focusArea, focus }) {
    return createHash('sha256').update(JSON.stringify({
        email,
        customerName,
        birthDate,
        birthTime,
        birthPlace,
        sign,
        grammaticalGender,
        focusArea,
        focus
    })).digest('hex');
}

export function isMatchingPersonalMapCheckoutOrderSession(session, order) {
    let validCheckoutUrl = !session?.url;
    if (session?.url) {
        try {
            const checkoutUrl = new URL(session.url);
            validCheckoutUrl = checkoutUrl.protocol === 'https:' && checkoutUrl.hostname === 'checkout.stripe.com';
        } catch {
            return false;
        }
    }

    const metadata = session?.metadata || {};
    return session.mode === 'payment'
        && metadata.productType === PRODUCT.type
        && metadata.productId === PRODUCT.id
        && metadata.orderId === order.id
        && metadata.productPeriodStart === order.payload?.productPeriodStart
        && metadata.productPeriodEnd === order.payload?.productPeriodEnd
        && metadata.price === String(PRODUCT.price)
        && metadata.currency === PRODUCT.currency
        && session.amount_total === PRODUCT.price
        && session.currency === String(PRODUCT.currency).toLowerCase()
        && validCheckoutUrl;
}

function isMatchingPersonalMapCheckoutSession(session, order, returnProof) {
    return isMatchingPersonalMapCheckoutOrderSession(session, order)
        && session.metadata?.flowId === order.payload?.flowId
        && session.metadata?.returnProofHash === pdfProofHash(returnProof);
}

async function recordCheckoutValidationFailed(source, reason) {
    await recordFunnelEvent('checkout_validation_failed', {
        source,
        feature: PRODUCT.id,
        planId: PRODUCT.id,
        planType: PRODUCT.type,
        metadata: {
            product_id: PRODUCT.id,
            product_type: PRODUCT.type,
            reason
        }
    });
}

function cleanText(value, maxLength) {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function isValidIsoDate(value) {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function calculatePersonalMapZodiacSign(value) {
    const [, monthValue, dayValue] = value.split('-').map(Number);
    const boundary = monthValue * 100 + dayValue;

    if (boundary >= 321 && boundary <= 419) return 'beran';
    if (boundary >= 420 && boundary <= 520) return 'byk';
    if (boundary >= 521 && boundary <= 620) return 'blizenci';
    if (boundary >= 621 && boundary <= 722) return 'rak';
    if (boundary >= 723 && boundary <= 822) return 'lev';
    if (boundary >= 823 && boundary <= 922) return 'panna';
    if (boundary >= 923 && boundary <= 1022) return 'vahy';
    if (boundary >= 1023 && boundary <= 1121) return 'stir';
    if (boundary >= 1122 && boundary <= 1221) return 'strelec';
    if (boundary >= 1222 || boundary <= 119) return 'kozoroh';
    if (boundary <= 218) return 'vodnar';
    return 'ryby';
}

function buildLineItem(customerName) {
    if (PRODUCT.stripePriceId) {
        return {
            price: PRODUCT.stripePriceId,
            quantity: 1
        };
    }

    return {
        price_data: {
            currency: PRODUCT.currency,
            product_data: {
                name: PRODUCT.name,
                description: `Prémiový osobní PDF výklad pro ${customerName}`
            },
            unit_amount: PRODUCT.price
        },
        quantity: 1
    };
}

router.get('/product', (_req, res) => {
    const period = createPersonalMapPeriod();
    res.set('Cache-Control', 'no-store');
    res.json({
        id: PRODUCT.id,
        name: PRODUCT.name,
        price: PRODUCT.price,
        currency: PRODUCT.currency,
        periodMonths: PRODUCT.periodMonths,
        period: {
            start: period.start,
            end: period.end,
            label: period.label,
            months: period.months
        },
        stripePriceId: PRODUCT.stripePriceId
    });
});

router.post('/checkout', async (req, res) => {
    const customerName = cleanText(req.body.name, 100);
    const email = cleanText(req.body.email, 160).toLowerCase();
    const birthDate = typeof req.body.birthDate === 'string' ? req.body.birthDate.trim() : '';
    const birthTime = cleanText(req.body.birthTime, 20);
    const birthPlace = cleanText(req.body.birthPlace, 120);
    const grammaticalGender = typeof req.body.grammaticalGender === 'string' ? req.body.grammaticalGender.trim() : 'neutral';
    const focusArea = typeof req.body.focusArea === 'string' ? req.body.focusArea.trim() : 'other';
    const focus = cleanText(req.body.focus, 500);
    const source = cleanCheckoutSource(req.body.source);
    const period = createPersonalMapPeriod();
    const flowId = cleanCheckoutFlowId(req.body.flowId);

    if (!flowId) {
        return res.status(400).json({ error: 'Formulář se nepodařilo bezpečně připravit. Načti stránku znovu a zkus to znovu.' });
    }

    if (!customerName || !birthDate || !email || !focus) {
        await recordCheckoutValidationFailed(source, 'missing_required_fields');
        return res.status(400).json({ error: 'Vyplňte prosím všechna povinná pole.' });
    }

    if (!EMAIL_PATTERN.test(email)) {
        await recordCheckoutValidationFailed(source, 'invalid_email');
        return res.status(400).json({ error: 'Neplatná e-mailová adresa.' });
    }

    if (!VALID_GENDERS.includes(grammaticalGender)) {
        await recordCheckoutValidationFailed(source, 'invalid_gender');
        return res.status(400).json({ error: 'Neplatný způsob oslovení.' });
    }

    if (!VALID_FOCUS_AREAS.includes(focusArea)) {
        await recordCheckoutValidationFailed(source, 'invalid_focus_area');
        return res.status(400).json({ error: 'Vyberte prosím hlavní oblast výkladu.' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !isValidIsoDate(birthDate) || birthDate > getTodayIsoDate()) {
        await recordCheckoutValidationFailed(source, 'invalid_birth_date');
        return res.status(400).json({ error: 'Neplatné datum narození.' });
    }
    const sign = calculatePersonalMapZodiacSign(birthDate);

    if (birthTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime)) {
        await recordCheckoutValidationFailed(source, 'invalid_birth_time');
        return res.status(400).json({ error: 'Neplatný čas narození.' });
    }

    if (focus.length < 8) {
        await recordCheckoutValidationFailed(source, 'short_focus');
        return res.status(400).json({ error: 'Napište prosím alespoň krátce, co teď řešíte.' });
    }

    let order = null;
    let sessionWasAlreadyAttached = false;
    try {
        const checkoutReturnProof = randomBytes(32).toString('hex');
        const requestHash = personalMapCheckoutHash({
            email, customerName, birthDate, birthTime, birthPlace, sign,
            grammaticalGender, focusArea, focus
        });
        const legacyOrders = await listRecentLegacyOneTimeOrderInputs({
            productType: PRODUCT.type,
            productId: PRODUCT.id,
            customerEmail: email,
            createdAfter: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
        });
        for (const legacyOrder of legacyOrders) {
            if (['paid', 'fulfilled', 'failed'].includes(legacyOrder.status)) {
                return res.status(409).json({
                    code: 'checkout_already_completed',
                    error: 'Našli jsme starší objednávku, kterou je potřeba ověřit. Nezakládej novou platbu; napiš nám přes Kontakt.'
                });
            }
            if (legacyOrder.status !== 'checkout_created') {
                return res.status(409).json({
                    code: 'checkout_session_unavailable',
                    error: 'Našli jsme starší platební pokus, který teď nejde bezpečně ověřit. Nezakládej novou platbu; napiš nám přes Kontakt.'
                });
            }
            if (!legacyOrder.stripe_session_id) {
                return res.status(409).json({
                    code: 'checkout_session_unavailable',
                    error: 'Našli jsme starší platební pokus, který ještě nemá potvrzené platební okno. Nezakládej novou platbu; napiš nám přes Kontakt.'
                });
            }

            let legacySession;
            try {
                legacySession = await getStripeClient().checkout.sessions.retrieve(
                    legacyOrder.stripe_session_id,
                    {},
                    { timeout: 5000, maxNetworkRetries: 0 }
                );
            } catch {
                return res.status(409).json({
                    code: 'checkout_session_unavailable',
                    error: 'Našli jsme starší platební pokus, jehož stav teď nejde ověřit. Nezakládej novou platbu; napiš nám přes Kontakt.'
                });
            }

            if (!isMatchingPersonalMapCheckoutOrderSession(legacySession, legacyOrder)) {
                return res.status(409).json({
                    code: 'checkout_session_unavailable',
                    error: 'Našli jsme starší platební pokus, který teď nejde bezpečně ověřit. Nezakládej novou platbu; napiš nám přes Kontakt.'
                });
            }
            if (legacySession.status === 'expired') {
                await markOneTimeOrderInputExpired(legacyOrder.id);
                continue;
            }
            if (legacySession.status === 'complete' && legacySession.payment_status === 'paid') {
                return res.status(409).json({
                    code: 'checkout_already_completed',
                    error: 'Tato objednávka už byla zaplacena. Zkontroluj potvrzovací e-mail a novou platbu teď nezakládej.'
                });
            }
            if (legacySession.status === 'complete') {
                return res.status(409).json({
                    code: 'checkout_payment_pending',
                    error: 'Tahle platba se ještě zpracovává. Neplať znovu; stav ověříme a potvrzení přijde e-mailem.'
                });
            }
            if (legacySession.status !== 'open' || !legacySession.url) {
                return res.status(409).json({
                    code: 'checkout_session_unavailable',
                    error: 'Našli jsme starší platební pokus, který teď nejde bezpečně obnovit. Nezakládej novou platbu; napiš nám přes Kontakt.'
                });
            }

            const legacyProof = req.cookies?.[pdfProofCookie(legacySession.id)];
            const legacyPayload = legacyOrder.payload || {};
            const legacyRequestHash = personalMapCheckoutHash({
                email: legacyOrder.customer_email,
                customerName: legacyOrder.customer_name,
                birthDate: legacyPayload.birthDate,
                birthTime: legacyPayload.birthTime,
                birthPlace: legacyPayload.birthPlace,
                sign: legacyPayload.sign,
                grammaticalGender: legacyPayload.grammaticalGender,
                focusArea: legacyPayload.focusArea,
                focus: legacyPayload.focus
            });
            if (legacyRequestHash !== requestHash || !isMatchingPersonalMapCheckoutSession(legacySession, legacyOrder, legacyProof)) {
                return res.status(409).json({
                    code: 'personal_map_flow_conflict',
                    error: 'Tento platební pokus už byl použit a nelze jej bezpečně obnovit. Nezakládej další platbu; napiš nám přes Kontakt, ať ověříme původní pokus.'
                });
            }

            res.cookie(pdfProofCookie(legacySession.id), legacyProof, {
                httpOnly: true, secure: APP_URL.startsWith('https://'), sameSite: 'lax',
                path: '/api/osobni-mapa', maxAge: 2 * 60 * 60 * 1000
            });
            return res.json({ url: legacySession.url });
        }

        order = await createIdempotentPersonalMapOrderInput({
            flowId,
            requestHash,
            productType: PRODUCT.type,
            productId: PRODUCT.id,
            customerEmail: email,
            customerName,
            payload: {
                birthDate,
                birthTime,
                birthPlace,
                sign,
                grammaticalGender,
                focusArea,
                focus,
                productPeriodStart: period.start,
                productPeriodEnd: period.end,
                productYear: period.start.slice(0, 4),
                source,
                checkoutReturnProof
            }
        });
        sessionWasAlreadyAttached = Boolean(order.stripe_session_id);
        const stripe = getStripeClient();
        const returnProof = order.payload?.checkoutReturnProof;
        if (typeof returnProof !== 'string' || !/^[a-f0-9]{64}$/.test(returnProof)) {
            throw new Error('Missing personal-map checkout proof.');
        }
        const orderSource = cleanCheckoutSource(order.payload?.source || source);
        const orderPeriod = {
            start: order.payload?.productPeriodStart || period.start,
            end: order.payload?.productPeriodEnd || period.end
        };
        let session;

        if (!order.stripe_session_id && order.status !== 'checkout_created') {
            if (order.status === 'expired') {
                return res.status(409).json({
                    code: 'checkout_session_expired',
                    error: 'Předchozí pokus už vypršel. Odešli formulář znovu a připravíme nové platební okno.'
                });
            }
            return res.status(409).json({
                code: 'checkout_session_unavailable',
                error: 'Tuto objednávku teď nelze bezpečně obnovit. Neplať znovu a napiš na support@mystickahvezda.cz.'
            });
        }

        if (order.stripe_session_id) {
            session = await stripe.checkout.sessions.retrieve(order.stripe_session_id, {}, { timeout: 5000, maxNetworkRetries: 0 });
            if (!isMatchingPersonalMapCheckoutSession(session, order, returnProof)) {
                throw new Error('Stripe returned a mismatched saved personal-map checkout session.');
            }
            if (['paid', 'fulfilled'].includes(order.status)
                || (session.status === 'complete' && session.payment_status === 'paid')) {
                return res.status(409).json({
                    code: 'checkout_already_completed',
                    error: 'Tato objednávka už byla zaplacena. Zkontroluj potvrzovací e-mail a novou platbu teď nezakládej.'
                });
            }
            if (session.status === 'complete') {
                return res.status(409).json({
                    code: 'checkout_payment_pending',
                    error: 'Tahle platba se ještě zpracovává. Neplať znovu; stav ověříme a potvrzení přijde e-mailem.'
                });
            }
            if (session.status === 'expired') {
                return res.status(409).json({
                    code: 'checkout_session_expired',
                    error: 'Předchozí platební okno už vypršelo. Odešli formulář znovu a připravíme nové.'
                });
            }
            if (session.status !== 'open' || !session.url) {
                return res.status(409).json({
                    code: 'checkout_session_unavailable',
                    error: 'Předchozí platební okno se nepodařilo ověřit. Neplať znovu a zkus to prosím později nebo napiš na support@mystickahvezda.cz.'
                });
            }
        } else {
            session = await stripe.checkout.sessions.create({
                customer_email: order.customer_email,
                line_items: [buildLineItem(order.customer_name)],
                mode: 'payment',
                locale: 'cs',
                success_url: `${APP_URL}/osobni-mapa.html?status=success&source=${encodeURIComponent(orderSource)}&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${APP_URL}/osobni-mapa.html?status=cancel&source=${encodeURIComponent(orderSource)}`,
                metadata: {
                    productType: PRODUCT.type,
                    returnProofHash: pdfProofHash(returnProof),
                    productId: PRODUCT.id,
                    productYear: orderPeriod.start.slice(0, 4),
                    productPeriodStart: orderPeriod.start,
                    productPeriodEnd: orderPeriod.end,
                    orderId: order.id,
                    flowId,
                    source: orderSource,
                    price: String(PRODUCT.price),
                    currency: PRODUCT.currency
                }
            }, { idempotencyKey: `personal-map-checkout-${order.id}` });

            if (!isMatchingPersonalMapCheckoutSession(session, order, returnProof) || !session.url) {
                throw new Error('Stripe returned a mismatched personal-map checkout session.');
            }
            if (!await attachStripeSessionToOrderInput(order.id, session.id)) {
                throw new Error('Could not persist the personal-map checkout session.');
            }
        }

        if (!sessionWasAlreadyAttached) {
            try {
                await recordFunnelEvent('checkout_session_created', {
                    source: orderSource,
                    feature: PRODUCT.id,
                    planId: PRODUCT.id,
                    planType: PRODUCT.type,
                    stripeSessionId: session.id,
                    metadata: {
                        product_id: PRODUCT.id,
                        product_type: PRODUCT.type,
                        product_name: PRODUCT.name,
                        amount: PRODUCT.price,
                        currency: PRODUCT.currency,
                        order_id: order.id,
                        flow_id: flowId
                    }
                });
            } catch (trackingError) {
                console.warn('[PERSONAL_MAP] Checkout tracking failed:', trackingError.message);
            }
        }

        res.cookie(pdfProofCookie(session.id), returnProof, {
            httpOnly: true, secure: APP_URL.startsWith('https://'), sameSite: 'lax',
            path: '/api/osobni-mapa', maxAge: 2 * 60 * 60 * 1000
        });
        return res.json({ url: session.url });
    } catch (err) {
        console.error('[PERSONAL_MAP] Checkout session error:', err.message);
        if (err?.code === 'PERSONAL_MAP_FLOW_CONFLICT') {
            return res.status(409).json({
                code: 'personal_map_flow_conflict',
                error: 'Tento platební pokus už byl použit a nelze jej bezpečně obnovit. Nezakládej další platbu; napiš nám přes Kontakt, ať ověříme původní pokus.'
            });
        }
        if (err?.code === 'PERSONAL_MAP_LEGACY_ORDER_AMBIGUOUS') {
            return res.status(409).json({
                code: 'checkout_session_unavailable',
                error: 'Našli jsme několik starších platebních pokusů, které je potřeba ověřit. Nezakládej novou platbu; napiš nám přes Kontakt.'
            });
        }
        try {
            await recordFunnelEvent('checkout_session_failed', {
                source,
                feature: PRODUCT.id,
                planId: PRODUCT.id,
                planType: PRODUCT.type,
                metadata: {
                    product_id: PRODUCT.id,
                    product_type: PRODUCT.type,
                    order_id: order?.id || null,
                    flow_id: flowId,
                    error: err.message
                }
            });
        } catch (trackingError) {
            console.warn('[PERSONAL_MAP] Checkout failure tracking failed:', trackingError.message);
        }

        return res.status(500).json({ error: 'Platba se nezdařila. Zkuste to prosím znovu.' });
    }
});

export default router;
