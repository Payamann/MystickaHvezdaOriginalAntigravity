import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { createRelationshipTarotRouter } from '../routes/vztahovy-vyklad.js';
import { drawRelationshipCards, parseRelationshipReading, buildRelationshipReadingHtml, isPaidRelationshipSession } from '../services/relationship-tarot.js';
import { pdfProofHash, pdfProofCookie } from '../routes/pdf-checkout-result.js';
import { createRelationshipFulfillment } from '../services/relationship-tarot-fulfillment.js';
import { createOneTimeOrderInput, getOneTimeOrderInput } from '../services/one-time-orders.js';
import { verifyOneTimeOrderPayment } from '../jobs/one-time-order-reconciliation.js';

const paragraph = 'Výklad je symbolickou reflexí tvé situace. Vrať se k tomu, co popisuješ, a zkus pojmenovat jednu vlastní potřebu, o které můžeš v klidu mluvit.';
const reading = { introduction: paragraph, cards: [paragraph, paragraph, paragraph], connection: paragraph, nextStep: paragraph, questions: ['Co pro tebe znamená blízkost?', 'Co potřebuješ pojmenovat?', 'Jakou dohodu můžeš navrhnout?'] };
const orderInput = { email: 'buyer@example.com', question: 'Po hádce se usmíříme, ale nemluvíme o tom. Co mohu udělat?', consent: true, source: 'tarot_yes_no_result' };
const proof = 'a'.repeat(64);
const paidSession = { id: 'cs_test_relationship', mode: 'payment', status: 'complete', payment_status: 'paid', currency: 'czk', amount_total: 14900,
    metadata: { productId: 'relationship_tarot', productType: 'relationship_tarot', orderId: 'order-1', returnProofHash: pdfProofHash(proof) } };

function setup({ enabled = true, attachResult = true, telemetryFails = false } = {}) {
    const stripe = { checkout: { sessions: { create: jest.fn(async () => ({ id: paidSession.id, url: 'https://checkout.stripe.com/c/pay/test' })), retrieve: jest.fn(async () => paidSession), expire: jest.fn(async () => ({})) } } };
    const createOrder = jest.fn(async () => ({ id: 'order-1' }));
    const attach = jest.fn(async () => attachResult);
    const track = jest.fn(async () => { if (telemetryFails) throw new Error('telemetry unavailable'); });
    const app = express().use(express.json(), cookieParser(), createRelationshipTarotRouter({ getStripe: () => stripe, enabled: () => enabled, createOrder, attach, track }));
    return { app, stripe, createOrder, attach, track };
}

describe('Relationship tarot checkout', () => {
    test('disabled launch does not create an order or a charge', async () => {
        const { app, createOrder, stripe } = setup({ enabled: false });
        await request(app).post('/checkout').send(orderInput).expect(503);
        expect(createOrder).not.toHaveBeenCalled();
        expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
    });
    test.each([{ consent: false }, { email: 'invalid' }, { question: 'krátká' }, { question: 'a'.repeat(1001) }])('rejects invalid input: %j', async patch => {
        const { app, createOrder } = setup();
        await request(app).post('/checkout').send({ ...orderInput, ...patch }).expect(400);
        expect(createOrder).not.toHaveBeenCalled();
    });
    test('price is server-owned; question is stored privately and not sent to Stripe or telemetry', async () => {
        const { app, createOrder, stripe, track } = setup({ telemetryFails: true });
        const response = await request(app).post('/checkout').send({ ...orderInput, price: 1, productId: 'personal_map' }).expect(200);
        const [payload, options] = stripe.checkout.sessions.create.mock.calls[0];
        expect(payload.mode).toBe('payment');
        expect(payload.line_items[0].price_data.unit_amount).toBe(14900);
        expect(payload.metadata.productId).toBe('relationship_tarot');
        expect(JSON.stringify(payload)).not.toContain(orderInput.question);
        expect(JSON.stringify(track.mock.calls)).not.toContain(orderInput.email);
        expect(JSON.stringify(track.mock.calls)).not.toContain(orderInput.question);
        expect(createOrder.mock.calls[0][0].payload.question).toBe(orderInput.question);
        expect(options.idempotencyKey).toBe('relationship-checkout-order-1');
        expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
        expect(response.headers['set-cookie'][0]).toContain('Path=/api/vztahovy-vyklad');
    });
    test('an unpersisted checkout is expired instead of exposing its link', async () => {
        const { app, stripe } = setup({ attachResult: false });
        const response = await request(app).post('/checkout').send(orderInput).expect(502);
        expect(response.body.url).toBeUndefined();
        expect(stripe.checkout.sessions.expire).toHaveBeenCalledWith(paidSession.id);
    });
    test('return requires a valid browser proof and a matching paid product', async () => {
        const { app, stripe } = setup();
        await request(app).get('/checkout-result?session_id=cs_test_relationship').expect(403);
        expect(stripe.checkout.sessions.retrieve).not.toHaveBeenCalled();
        const cookie = `${pdfProofCookie(paidSession.id)}=${proof}`;
        const verified = await request(app).get('/checkout-result?session_id=cs_test_relationship').set('Cookie', cookie).expect(200);
        expect(verified.body.status).toBe('paid');
        stripe.checkout.sessions.retrieve.mockResolvedValueOnce({ ...paidSession, payment_status: 'unpaid' });
        const pending = await request(app).get('/checkout-result?session_id=cs_test_relationship').set('Cookie', cookie).expect(200);
        expect(pending.body.status).toBe('pending');
        await request(app).get('/checkout-result?session_id=cs_test_relationship').set('Cookie', `${pdfProofCookie(paidSession.id)}=${'b'.repeat(64)}`).expect(403);
    });
});

describe('Paid reading and delivery', () => {
    test('three different cards retain their assigned positions', () => {
        const cards = drawRelationshipCards();
        expect(new Set(cards.map(card => card.name)).size).toBe(3);
        expect(cards.map(card => card.position)).toEqual(['Co potřebuješ', 'Co si zaslouží pozornost', 'Tvůj další krok']);
    });
    test('invalid AI content is rejected and HTML from the question is escaped', () => {
        expect(() => parseRelationshipReading('not JSON')).toThrow();
        expect(() => parseRelationshipReading({ ...reading, cards: ['one'] })).toThrow();
        const html = buildRelationshipReadingHtml({ question: '<script>alert(1)</script>', cards: drawRelationshipCards(), reading });
        expect(html).toContain('&lt;script&gt;');
        expect(html).not.toContain('<script>');
    });
    test.each([{ amount_total: 1 }, { currency: 'eur' }, { payment_status: 'unpaid' }, { payment_status: 'no_payment_required' }, { status: 'open' }, { metadata: { ...paidSession.metadata, orderId: 'other' } }])('reconciliation cannot fulfill a mismatched or unpaid session %j', async patch => {
        const session = { ...paidSession, ...patch };
        expect(isPaidRelationshipSession(session, 'order-1')).toBe(false);
        const result = await verifyOneTimeOrderPayment({ id: 'order-1', product_type: 'relationship_tarot', stripe_session_id: paidSession.id }, { checkout: { sessions: { retrieve: async () => session } } });
        expect(result).not.toBe('paid');
    });
    test('delivery failure retries the stored reading with the same email idempotency key', async () => {
        const order = await createOneTimeOrderInput({ productId: 'relationship_tarot', productType: 'relationship_tarot', customerEmail: orderInput.email, customerName: '', payload: { question: orderInput.question, cards: drawRelationshipCards() } });
        const generate = jest.fn(async () => reading);
        const send = jest.fn().mockRejectedValueOnce(new Error('provider down')).mockResolvedValue({ success: true });
        const fulfill = createRelationshipFulfillment({ generate, send });
        await expect(fulfill({ orderId: order.id })).rejects.toThrow('provider down');
        expect((await getOneTimeOrderInput(order.id)).payload.reading).toEqual(reading);
        await fulfill({ orderId: order.id });
        expect(generate).toHaveBeenCalledTimes(1);
        expect(send.mock.calls[0]).toEqual(send.mock.calls[1]);
        expect(send.mock.calls[0][1].idempotencyKey).toBe(`relationship-tarot-${order.id}`);
    });
    test('bad AI output and persistence failure never deliver filler', async () => {
        const order = await createOneTimeOrderInput({ productId: 'relationship_tarot', productType: 'relationship_tarot', customerEmail: orderInput.email, customerName: '', payload: { question: orderInput.question, cards: drawRelationshipCards() } });
        const send = jest.fn();
        const fulfill = createRelationshipFulfillment({ generate: async () => ({ cards: [] }), send });
        await expect(fulfill({ orderId: order.id })).rejects.toThrow();
        expect(send).not.toHaveBeenCalled();
    });
});
