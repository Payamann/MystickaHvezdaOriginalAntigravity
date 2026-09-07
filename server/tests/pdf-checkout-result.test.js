import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { jest } from '@jest/globals';
import { createPdfCheckoutResultRouter, pdfProofHash, pdfProofCookie } from '../routes/pdf-checkout-result.js';

const proof = 'a'.repeat(64);
const id = 'cs_test_pdf';
function setup(patch = {}) {
    const session = { status: 'complete', payment_status: 'paid', mode: 'payment',
        metadata: { productId: 'osobni_mapa_2026', returnProofHash: pdfProofHash(proof) },
        payment_intent: { id: 'pi_verified', status: 'succeeded', amount_received: 24900, currency: 'czk' }, ...patch };
    const retrieve = jest.fn().mockResolvedValue(session);
    const app = express(); app.use(cookieParser()); app.use(createPdfCheckoutResultRouter(() => ({ checkout: { sessions: { retrieve } } })));
    return { app, retrieve, get: () => request(app).get(`/checkout-result?session_id=${id}`).set('Cookie', `${pdfProofCookie(id)}=${proof}`) };
}
test('guest PDF verification uses actual received amount without exposing personal data', async () => {
    const res = await setup().get().expect(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toEqual({ success: true, result: { status: 'paid', product_id: 'osobni_mapa_2026', transaction_id: 'pi_verified', value: 249, currency: 'CZK' } });
});
test('missing proof is rejected before contacting Stripe', async () => {
    const h = setup(); await request(h.app).get(`/checkout-result?session_id=${id}`).expect(403);
    expect(h.retrieve).not.toHaveBeenCalled();
});
test.each([{}, { productId: 'osobni_mapa_2026', returnProofHash: pdfProofHash('b'.repeat(64)) }])('rejects foreign or legacy session %j', async metadata => {
    await setup({ metadata }).get().expect(403);
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
