import express from 'express';
import Stripe from 'stripe';
import rateLimit from 'express-rate-limit';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { pdfProofCookie, pdfProofHash } from './pdf-checkout-result.js';
import { createOneTimeOrderInput, attachStripeSessionToOrderInput } from '../services/one-time-orders.js';
import { RELATIONSHIP_TAROT as PRODUCT, drawRelationshipCards, isPaidRelationshipSession } from '../services/relationship-tarot.js';
import { recordFunnelEvent } from '../payment.js';

export const relationshipTarotEnabled = () => process.env.RELATIONSHIP_TAROT_ENABLED === 'true'
    && Boolean(process.env.STRIPE_SECRET_KEY && process.env.ANTHROPIC_API_KEY && process.env.RESEND_API_KEY);
const cleanSource = value => typeof value === 'string' && /^[a-z0-9_:-]{1,80}$/i.test(value) ? value : 'relationship_tarot_page';

export function createRelationshipTarotRouter(deps = {}) {
    const router = express.Router();
    let stripe;
    const getStripe = deps.getStripe || (() => stripe ||= new Stripe(process.env.STRIPE_SECRET_KEY));
    const enabled = deps.enabled || relationshipTarotEnabled;
    const createOrder = deps.createOrder || createOneTimeOrderInput;
    const attach = deps.attach || attachStripeSessionToOrderInput;
    const track = async (event, source, extra = {}) => {
        try { await (deps.track || recordFunnelEvent)(event, { source, feature: PRODUCT.id, planType: PRODUCT.type, ...extra }); } catch { /* Telemetry must never block payment. */ }
    };
    router.get('/product', (_req, res) => res.set('Cache-Control', 'no-store').json({ ...PRODUCT, enabled: enabled() }));
    router.post('/checkout', rateLimit({ windowMs: 15 * 60 * 1000, limit: 6, standardHeaders: 'draft-8', legacyHeaders: false }), async (req, res) => {
        res.set('Cache-Control', 'no-store');
        if (!enabled()) return res.status(503).json({ error: 'Výklad se připravuje. Platby zatím nejsou spuštěné.' });
        const { email, question, consent } = req.body || {};
        const source = cleanSource(req.body?.source);
        if (typeof email !== 'string' || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
            || typeof question !== 'string' || question.trim().length < 20 || question.length > 1000 || consent !== true) {
            await track('checkout_validation_failed', source);
            return res.status(400).json({ error: 'Zkontroluj e-mail, otázku (20–1000 znaků) a souhlas s dodáním výkladu.' });
        }
        try {
            const proof = randomBytes(32).toString('hex');
            const order = await createOrder({ productType: PRODUCT.type, productId: PRODUCT.id, customerEmail: email.trim(), customerName: '',
                payload: { question: question.trim(), cards: drawRelationshipCards(), consentAt: new Date().toISOString(), consentVersion: 'relationship-v1', source } });
            const appUrl = process.env.APP_URL || 'http://localhost:3001';
            const session = await getStripe().checkout.sessions.create({
                mode: 'payment', locale: 'cs', customer_email: email.trim().toLowerCase(),
                line_items: [{ quantity: 1, price_data: { currency: PRODUCT.currency, unit_amount: PRODUCT.amount, product_data: { name: PRODUCT.name, description: 'Tři karty a jedna vztahová otázka. Osobní výklad do e-mailu.' } } }],
                success_url: `${appUrl}/vztahovy-vyklad.html?status=success&source=${source}&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${appUrl}/vztahovy-vyklad.html?status=cancel&source=${source}`,
                metadata: { productType: PRODUCT.type, productId: PRODUCT.id, orderId: order.id, source, price: String(PRODUCT.amount), currency: PRODUCT.currency, returnProofHash: pdfProofHash(proof) }
            }, { idempotencyKey: `relationship-checkout-${order.id}` });
            if (!await attach(order.id, session.id)) {
                await getStripe().checkout.sessions.expire(session.id);
                throw new Error('Could not persist checkout');
            }
            await track('checkout_session_created', source, { stripeSessionId: session.id, metadata: { product_id: PRODUCT.id, amount: PRODUCT.amount, currency: PRODUCT.currency } });
            res.cookie(pdfProofCookie(session.id), proof, { httpOnly: true, secure: appUrl.startsWith('https://'), sameSite: 'lax', path: '/api/vztahovy-vyklad', maxAge: 7200000 });
            return res.json({ url: session.url });
        } catch {
            await track('checkout_session_failed', source);
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
            return res.json({ status: paid ? 'paid' : 'pending' });
        } catch { return res.sendStatus(502); }
    });
    return router;
}
export default createRelationshipTarotRouter();
