import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { jest } from '@jest/globals';
import { createPdfCheckoutResultRouter, pdfProofHash, pdfProofCookie } from '../routes/pdf-checkout-result.js';

const proof = 'a'.repeat(64);
const id = 'cs_test_pdf';
function setup(patch = {}) {
    const session = { id, status: 'complete', payment_status: 'paid', mode: 'payment',
        metadata: { productId: 'osobni_mapa_2026', returnProofHash: pdfProofHash(proof), orderId: 'order-1' },
        payment_intent: { id: 'pi_verified', status: 'succeeded', amount_received: 24900, currency: 'czk' }, ...patch };
    const retrieve = jest.fn().mockResolvedValue(session);
    const getOrder = jest.fn().mockResolvedValue(null);
    const app = express(); app.use(cookieParser()); app.use(createPdfCheckoutResultRouter(() => ({ checkout: { sessions: { retrieve } } }), { getOrder }));
    return { app, retrieve, getOrder, get: () => request(app).get(`/checkout-result?session_id=${id}`).set('Cookie', `${pdfProofCookie(id)}=${proof}`) };
}
test('guest PDF verification uses actual received amount without exposing personal data', async () => {
    const res = await setup().get().expect(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toEqual({ success: true, result: { status: 'paid', delivery_status: 'unknown', product_id: 'osobni_mapa_2026', transaction_id: 'pi_verified', value: 249, currency: 'CZK' } });
});
test('missing proof is rejected before contacting Stripe', async () => {
    const h = setup(); await request(h.app).get(`/checkout-result?session_id=${id}`).expect(403);
    expect(h.retrieve).not.toHaveBeenCalled();
    expect(h.getOrder).not.toHaveBeenCalled();
});
test.each([{}, { productId: 'osobni_mapa_2026', returnProofHash: pdfProofHash('b'.repeat(64)) }])('rejects foreign or legacy session %j', async metadata => {
    const h = setup({ metadata }); await h.get().expect(403);
    expect(h.getOrder).not.toHaveBeenCalled();
});
test.each([{ status: 'open' }, { payment_status: 'unpaid' }, { payment_intent: null },
    { payment_intent: { status: 'processing', amount_received: 24900, currency: 'czk' } },
    { payment_intent: { status: 'succeeded', amount_received: 0, currency: 'czk' } }
])('does not invent revenue for incomplete payment %j', async patch => {
    const res = await setup(patch).get().expect(200); expect(res.body.result.status).toBe('pending');
});
test('provider error fails closed', async () => {
    const h = setup(); h.retrieve.mockRejectedValue(new Error('secret')); const res = await h.get().expect(502);
    expect(res.body).toEqual({ success: false });
});

const order = { id: 'order-1', stripe_session_id: id, product_type: 'personal_map', product_id: 'osobni_mapa_2026',
    status: 'checkout_created', customer_email: 'private@example.test', customer_name: 'Private Person',
    payload: { focus: 'Private question', personalMapFulfillment: { version: 1, state: 'pending' } } };

test.each(['pending', 'generating', 'generated', 'ready', 'sending'])('reports durable %s as preparing without private data', async state => {
    const h = setup(); h.getOrder.mockResolvedValue({ ...order, retry_count: 1, last_error: 'private error',
        payload: { ...order.payload, personalMapFulfillment: { version: 1, state } } });
    const res = await h.get().expect(200);
    expect(h.getOrder).toHaveBeenCalledWith('order-1');
    expect(res.body.result.delivery_status).toBe('preparing');
    expect(Object.keys(res.body.result).sort()).toEqual(['currency', 'delivery_status', 'product_id', 'status', 'transaction_id', 'value']);
    expect(JSON.stringify(res.body)).not.toMatch(/Private|private|order-1/);
});

test.each([{ status: 'fulfilled' }, { email_id: 'provider-receipt' }])('reports confirmed provider acceptance %j', async patch => {
    const h = setup(); h.getOrder.mockResolvedValue({ ...order, ...patch });
    expect((await h.get().expect(200)).body.result.delivery_status).toBe('fulfilled');
});

test('exhausted retries are failed, while an individual retryable failure stays preparing', async () => {
    const h = setup(); h.getOrder.mockResolvedValue({ ...order, status: 'failed' });
    expect((await h.get().expect(200)).body.result.delivery_status).toBe('failed');
    h.getOrder.mockResolvedValue({ ...order, retry_count: 1, last_error: 'temporary error' });
    expect((await h.get().expect(200)).body.result.delivery_status).toBe('preparing');
});

test.each([{ id: 'foreign' }, { stripe_session_id: 'cs_foreign' }, { product_id: 'other' }, { product_type: 'relationship_tarot' }, { payload: {} }])('does not disclose state for invalid linkage or legacy state %j', async patch => {
    const h = setup(); h.getOrder.mockResolvedValue({ ...order, ...patch });
    const res = await h.get().expect(200);
    expect(res.body.result.status).toBe('paid');
    expect(res.body.result.delivery_status).toBe('unknown');
});

test('unpaid and wrong-product sessions do not read private orders', async () => {
    const h = setup({ payment_status: 'unpaid' }); await h.get().expect(200);
    expect(h.getOrder).not.toHaveBeenCalled();
    const other = setup({ metadata: { productId: 'other', orderId: 'order-1', returnProofHash: pdfProofHash(proof) } });
    await other.get().expect(400); expect(other.getOrder).not.toHaveBeenCalled();
});

test('delivery lookup failure preserves verified purchase', async () => {
    const h = setup(); h.getOrder.mockRejectedValue(new Error('private database details'));
    const res = await h.get().expect(200);
    expect(res.body.result).toMatchObject({ status: 'paid', transaction_id: 'pi_verified', value: 249, delivery_status: 'unknown' });
});
