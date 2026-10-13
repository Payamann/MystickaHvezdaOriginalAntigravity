import express from 'express';
import Stripe from 'stripe';
import rateLimit from 'express-rate-limit';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { pdfProofCookie, pdfProofHash } from './pdf-checkout-result.js';
import { createOneTimeOrderInput, attachStripeSessionToOrderInput } from '../services/one-time-orders.js';
import { RELATIONSHIP_TAROT as PRODUCT, drawRelationshipCards, isPaidRelationshipSession } from '../services/relationship-tarot.js';
import { relationshipDeliveryState } from '../services/relationship-email-delivery.js';
import { supabase } from '../db-supabase.js';
import { recordFunnelEvent } from '../payment.js';

export const relationshipTarotEnabled = () => process.env.RELATIONSHIP_TAROT_ENABLED === 'true'
    && Boolean(process.env.STRIPE_SECRET_KEY && process.env.ANTHROPIC_API_KEY && process.env.RESEND_API_KEY);
const cleanSource = value => typeof value === 'string' && /^[a-z0-9_:-]{1,80}$/i.test(value) ? value : 'relationship_tarot_page';
const cleanFlowId = value => typeof value === 'string' && /^[a-z0-9_-]{16,80}$/i.test(value) ? value : null;
const cleanOrderRef = value => typeof value === 'string' && /^[a-z0-9_-]{1,80}$/i.test(value) ? value : null;
const DELIVERY_STATES = new Set(['preparing', 'provider_accepted', 'delivered', 'delivery_delayed', 'failed', 'unavailable']);

export function createRelationshipDeliveryStatusReader({ db = supabase } = {}) {
    return async ({ orderId, sessionId }) => {
        const orderRef = cleanOrderRef(orderId);
        if (!orderRef || typeof sessionId !== 'string') return { deliveryState: 'unavailable' };
        let orderQuery = db.from('one_time_order_inputs')
            .select('id,status,email_id,email_sent_at')
            .eq('id', orderRef)
            .eq('stripe_session_id', sessionId)
            .eq('product_type', PRODUCT.type)
            .eq('product_id', PRODUCT.id);
        if (typeof orderQuery.abortSignal === 'function') orderQuery = orderQuery.abortSignal(AbortSignal.timeout(2500));
        const orderResult = await orderQuery.maybeSingle();
        if (orderResult.error || !orderResult.data) return { deliveryState: 'unavailable' };
        const order = orderResult.data;
        if (order.status === 'failed' && !order.email_id) return { deliveryState: 'failed', orderRef };
        if (!order.email_id) return { deliveryState: order.status === 'fulfilled' ? 'unavailable' : 'preparing', orderRef };
        let eventsQuery = db.from('relationship_email_events')
            .select('email_id,event_type,event_at')
            .eq('email_id', order.email_id);
        if (typeof eventsQuery.abortSignal === 'function') eventsQuery = eventsQuery.abortSignal(AbortSignal.timeout(2500));
        const eventsResult = await eventsQuery;
        if (eventsResult.error) return { deliveryState: 'unavailable', orderRef };
        const state = relationshipDeliveryState(order, eventsResult.data || []).status;
        const deliveryState = state === 'sent' ? 'provider_accepted'
            : state === 'delivery_delayed' ? 'delivery_delayed'
                : state === 'delivered' ? 'delivered'
                    : ['failed', 'bounced', 'suppressed', 'complained'].includes(state) ? 'failed'
                        : 'preparing';
        return { deliveryState, orderRef };
    };
}

export function createRelationshipTarotRouter(deps = {}) {
    const router = express.Router();
    let stripe;
    const getStripe = deps.getStripe || (() => stripe ||= new Stripe(process.env.STRIPE_SECRET_KEY));
    const enabled = deps.enabled || relationshipTarotEnabled;
    const createOrder = deps.createOrder || createOneTimeOrderInput;
    const attach = deps.attach || attachStripeSessionToOrderInput;
    const getDeliveryStatus = deps.getDeliveryStatus || createRelationshipDeliveryStatusReader();
    const track = async (event, source, extra = {}) => {
        try { await (deps.track || recordFunnelEvent)(event, { source, feature: PRODUCT.id, planType: PRODUCT.type, ...extra }); } catch { /* Telemetry must never block payment. */ }
    };
    router.get('/product', (_req, res) => res.set('Cache-Control', 'no-store').json({ ...PRODUCT, enabled: enabled() }));
    router.post('/checkout', rateLimit({ windowMs: 15 * 60 * 1000, limit: 6, standardHeaders: 'draft-8', legacyHeaders: false }), async (req, res) => {
        res.set('Cache-Control', 'no-store');
        if (!enabled()) return res.status(503).json({ error: 'Výklad se připravuje. Platby zatím nejsou spuštěné.' });
        const { email, question, consent } = req.body || {};
        const source = cleanSource(req.body?.source);
        const flowId = cleanFlowId(req.body?.flowId);
        if (typeof email !== 'string' || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
            || typeof question !== 'string' || question.trim().length < 20 || question.length > 1000 || consent !== true) {
            await track('checkout_validation_failed', source, { metadata: { ...(flowId ? { flow_id: flowId } : {}), funnel_step: 'checkout_validation' } });
            return res.status(400).json({ error: 'Zkontroluj e-mail, otázku (20–1000 znaků) a souhlas s dodáním výkladu.' });
        }
        try {
            const proof = randomBytes(32).toString('hex');
            const order = await createOrder({ productType: PRODUCT.type, productId: PRODUCT.id, customerEmail: email.trim(), customerName: '',
                payload: { question: question.trim(), cards: drawRelationshipCards(), consentAt: new Date().toISOString(), consentVersion: 'relationship-v1', source, ...(flowId ? { flowId } : {}) } });
            const appUrl = process.env.APP_URL || 'http://localhost:3001';
            const session = await getStripe().checkout.sessions.create({
                mode: 'payment', locale: 'cs', customer_email: email.trim().toLowerCase(),
                line_items: [{ quantity: 1, price_data: { currency: PRODUCT.currency, unit_amount: PRODUCT.amount, product_data: { name: PRODUCT.name, description: 'Tři karty a jedna vztahová otázka. Osobní výklad do e-mailu.' } } }],
                success_url: `${appUrl}/vztahovy-vyklad.html?status=success&source=${source}&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${appUrl}/vztahovy-vyklad.html?status=cancel&source=${source}`,
                metadata: { productType: PRODUCT.type, productId: PRODUCT.id, orderId: order.id, source, price: String(PRODUCT.amount), currency: PRODUCT.currency, returnProofHash: pdfProofHash(proof), ...(flowId ? { flowId } : {}) }
            }, { idempotencyKey: `relationship-checkout-${order.id}` });
            if (!await attach(order.id, session.id)) {
                await getStripe().checkout.sessions.expire(session.id);
                throw new Error('Could not persist checkout');
            }
            await track('checkout_session_created', source, { stripeSessionId: session.id, metadata: { product_id: PRODUCT.id, amount: PRODUCT.amount, currency: PRODUCT.currency, funnel_step: 'checkout_created', ...(flowId ? { flow_id: flowId } : {}) } });
            res.cookie(pdfProofCookie(session.id), proof, { httpOnly: true, secure: appUrl.startsWith('https://'), sameSite: 'lax', path: '/api/vztahovy-vyklad', maxAge: 7200000 });
            return res.json({ url: session.url });
        } catch {
            await track('checkout_session_failed', source, { metadata: { funnel_step: 'checkout_create', ...(flowId ? { flow_id: flowId } : {}) } });
            return res.status(502).json({ error: 'Platbu se nepodařilo otevřít. Zadání zůstává ve formuláři. Zkus to znovu.' });
        }
    });
    router.get('/checkout-result', async (req, res) => {
        res.set('Cache-Control', 'no-store');
        const id = req.query.session_id;
        if (typeof id !== 'string' || !/^cs_[A-Za-z0-9_]{3,200}$/.test(id)) return res.sendStatus(400);
        const proof = req.cookies?.[pdfProofCookie(id)];
        if (typeof proof !== 'string' || !/^[a-f0-9]{64}$/.test(proof)) return res.sendStatus(403);
        try {
            const session = await getStripe().checkout.sessions.retrieve(id, {}, { timeout: 5000, maxNetworkRetries: 0 });
            const hash = session.metadata?.returnProofHash;
            if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash) || !timingSafeEqual(Buffer.from(hash), Buffer.from(pdfProofHash(proof)))) return res.sendStatus(403);
            const paid = isPaidRelationshipSession(session);
            if (!paid) return res.json({ status: 'pending' });
            let delivery = { deliveryState: 'unavailable' };
            try { delivery = await getDeliveryStatus({ orderId: session.metadata.orderId, sessionId: session.id }); }
            catch { /* A delivery lookup failure must not erase verified payment status. */ }
            const deliveryState = DELIVERY_STATES.has(delivery?.deliveryState) ? delivery.deliveryState : 'unavailable';
            const orderRef = cleanOrderRef(delivery?.orderRef);
            return res.json({ status: 'paid', deliveryState, ...(orderRef ? { orderRef } : {}) });
        } catch { return res.sendStatus(502); }
    });
    return router;
}
export default createRelationshipTarotRouter();
