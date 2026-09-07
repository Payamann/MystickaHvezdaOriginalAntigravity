import express from 'express';
import Stripe from 'stripe';
import { authenticateToken } from '../middleware.js';

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_SESSION_ID_LENGTH = 255;
const SESSION_ID_RE = /^cs_[A-Za-z0-9_-]{3,200}$/;

function configuredTimeout(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 250 && parsed <= 10000
        ? parsed
        : DEFAULT_TIMEOUT_MS;
}

function withTimeout(promise, timeoutMs) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('stripe_timeout')), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function amountAndCurrency(session) {
    const invoice = session?.invoice && typeof session.invoice === 'object'
        ? session.invoice
        : null;
    // For subscriptions invoice.amount_paid is the confirmed, discount-aware
    // amount. Do not treat amount_total as paid when Stripe supplied an invoice
    // with amount_paid === 0 (for example, a free/trial invoice).
    if (invoice && invoice.status === 'paid' && Number.isSafeInteger(invoice.amount_paid)) {
        return {
            amount: invoice.amount_paid,
            currency: invoice.currency || session.currency || null,
            confirmed: true,
        };
    }
    return { amount: 0, currency: session?.currency || null, confirmed: false };
}

function productIdFromSession(session) {
    const metadata = session?.metadata || {};
    if (typeof metadata.planId === 'string' && metadata.planId) return metadata.planId;
    if (typeof metadata.product_id === 'string' && metadata.product_id) return metadata.product_id;
    if (typeof metadata.productId === 'string' && metadata.productId) return metadata.productId;
    const item = session?.line_items?.data?.[0];
    const product = item?.price?.product;
    return typeof product === 'string' ? product : product?.id || null;
}

function ownerIdFromSession(session) {
    const metadata = session?.metadata || {};
    // The checkout creator currently writes userId (camelCase); user_id is
    // accepted for older sessions and for migrations, but ownership is never
    // inferred from customer email or an untrusted query parameter.
    return typeof metadata.user_id === 'string' && metadata.user_id
        ? metadata.user_id
        : typeof metadata.userId === 'string' && metadata.userId
            ? metadata.userId
            : null;
}

export function createCheckoutResultRouter({
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || ''),
    authenticate = authenticateToken,
    timeoutMs = configuredTimeout(process.env.STRIPE_CHECKOUT_RESULT_TIMEOUT_MS),
} = {}) {
    const router = express.Router();

    router.get('/checkout-result', (req, res, next) => {
        res.set('Cache-Control', 'no-store');
        next();
    }, authenticate, async (req, res) => {
        const sessionId = typeof req.query.session_id === 'string' ? req.query.session_id : '';
        if (!sessionId || sessionId.length > MAX_SESSION_ID_LENGTH || !SESSION_ID_RE.test(sessionId)) {
            return res.status(400).json({ success: false, error: 'Invalid checkout session.' });
        }

        try {
            const session = await withTimeout(
                stripeClient.checkout.sessions.retrieve(sessionId, {
                    expand: ['invoice', 'subscription', 'line_items.data.price.product'],
                }, { timeout: timeoutMs, maxNetworkRetries: 0 }),
                timeoutMs,
            );

            const ownerId = ownerIdFromSession(session);
            if (!ownerId || ownerId !== req.user?.id) {
                return res.status(403).json({ success: false, error: 'Checkout session is not available.' });
            }
            if (session.mode !== 'subscription') {
                return res.status(400).json({ success: false, error: 'Unsupported checkout session.' });
            }

            const { amount, currency, confirmed } = amountAndCurrency(session);
            const subscription = session.subscription && typeof session.subscription === 'object'
                ? session.subscription
                : null;
            const isTrial = session.status === 'complete'
                && session.payment_status === 'no_payment_required'
                && subscription?.status === 'trialing'
                && confirmed
                && amount === 0;

            let status = 'pending';
            if (isTrial) {
                status = 'trial';
            } else if (
                session.status === 'complete'
                && session.payment_status === 'paid'
                && confirmed
                && amount > 0
                // Current catalog bills CZK. Fail closed for unknown currency
                // exponents instead of inventing a conversion for analytics.
                && currency?.toLowerCase() === 'czk'
                && typeof session.invoice?.id === 'string'
            ) {
                status = 'paid';
            }

            return res.json({
                success: true,
                result: {
                    status,
                    transaction_id: status === 'paid' ? session.invoice.id : session.id,
                    product_id: productIdFromSession(session),
                    value: status === 'paid' ? amount / 100 : 0,
                    currency: typeof currency === 'string' ? currency.toUpperCase() : null,
                },
            });
        } catch (error) {
            const statusCode = error?.code === 'resource_missing' ? 404 : 502;
            if (statusCode === 502) console.warn('[STRIPE] Checkout result lookup unavailable');
            return res.status(statusCode).json({ success: false, error: 'Checkout result is temporarily unavailable.' });
        }
    });

    return router;
}

export default createCheckoutResultRouter;
