import express from 'express';
import Stripe from 'stripe';
import { getOneTimeOrderInput } from '../services/one-time-orders.js';

const REPLACEMENT = Object.freeze({
    id: 'osobni_mapa_2026',
    name: 'Osobní mapa na 12 měsíců',
    path: '/osobni-mapa.html'
});
const SESSION_ID_RE = /^cs_[A-Za-z0-9_-]{3,200}$/;
const ANNUAL_PRODUCT_ID = 'rocni_horoskop_2026';
const ANNUAL_PRODUCT_TYPE = 'rocni_horoskop';
const ANNUAL_PRICE_CZK_MINOR = 19900;
const DEFAULT_STRIPE_TIMEOUT_MS = 5000;

function getConfiguredStripeClient() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('Stripe is not configured.');
    return new Stripe(key);
}

function withTimeout(promise, timeoutMs) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('stripe_timeout')), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function retiredProductResponse(res) {
    return res.status(410).json({
        error: 'Mini Roční horoskop už nenabízíme. Pokračujte k Osobní mapě na celých 12 měsíců od nákupu.',
        retired: true,
        replacement: REPLACEMENT
    });
}

export function createRetiredAnnualHoroscopeRouter({
    getStripeClient = getConfiguredStripeClient,
    getOrderInput = getOneTimeOrderInput,
    timeoutMs = DEFAULT_STRIPE_TIMEOUT_MS
} = {}) {
    const router = express.Router();

    router.get('/checkout-result', async (req, res) => {
        res.set('Cache-Control', 'no-store');
        const sessionId = typeof req.query.session_id === 'string' ? req.query.session_id : '';
        if (!SESSION_ID_RE.test(sessionId)) {
            return res.status(400).json({ success: false, error: 'Platbu se nepodařilo ověřit.' });
        }

        try {
            const session = await withTimeout(
                getStripeClient().checkout.sessions.retrieve(sessionId, {
                    expand: ['payment_intent']
                }, { timeout: timeoutMs, maxNetworkRetries: 0 }),
                timeoutMs
            );
            const metadata = session?.metadata || {};
            if (session?.mode !== 'payment' || metadata.productType !== ANNUAL_PRODUCT_TYPE) {
                return res.status(404).json({ success: false, error: 'Platbu se nepodařilo ověřit.' });
            }

            const orderInput = metadata.productId ? null : await getOrderInput(metadata.orderId);
            const productId = metadata.productId || orderInput?.product_id || ANNUAL_PRODUCT_ID;
            if (productId !== ANNUAL_PRODUCT_ID) {
                return res.status(404).json({ success: false, error: 'Platbu se nepodařilo ověřit.' });
            }

            const paymentIntent = session.payment_intent && typeof session.payment_intent === 'object'
                ? session.payment_intent
                : null;
            const amount = session.amount_total;
            const paid = session.status === 'complete'
                && session.payment_status === 'paid'
                && session.currency?.toLowerCase() === 'czk'
                && amount === ANNUAL_PRICE_CZK_MINOR
                && paymentIntent?.status === 'succeeded'
                && paymentIntent.amount_received === amount
                && paymentIntent.currency?.toLowerCase() === 'czk';

            if (!paid) {
                const pending = session.status === 'complete' && session.payment_status === 'unpaid';
                return res.json({ success: true, result: {
                    status: pending ? 'pending' : 'not_paid',
                    product_id: ANNUAL_PRODUCT_ID
                } });
            }

            return res.json({ success: true, result: {
                status: 'paid',
                product_id: ANNUAL_PRODUCT_ID,
                transaction_id: paymentIntent.id || session.id,
                value: amount / 100,
                currency: 'CZK'
            } });
        } catch (error) {
            if (error?.code === 'resource_missing') {
                return res.status(404).json({ success: false, error: 'Platbu se nepodařilo ověřit.' });
            }
            console.warn('[ANNUAL HOROSCOPE] Checkout result lookup unavailable.');
            return res.status(502).json({ success: false, error: 'Ověření platby je dočasně nedostupné.' });
        }
    });

    router.get('/product', (_req, res) => retiredProductResponse(res));
    router.post('/checkout', (_req, res) => retiredProductResponse(res));
    return router;
}

// Historical fulfillment remains in the Stripe webhook and reconciliation
// services. The result endpoint only confirms the exact old product and price;
// new checkout attempts remain disabled.
export default createRetiredAnnualHoroscopeRouter();
