import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { createCheckoutResultRouter } from '../routes/checkout-result.js';

const paid = () => ({
    id: 'cs_test_result', mode: 'subscription', status: 'complete', payment_status: 'paid',
    metadata: { userId: 'owner', planId: 'pruvodce' },
    invoice: { id: 'in_confirmed', status: 'paid', amount_paid: 14900, currency: 'czk' },
    amount_total: 19900, currency: 'czk', subscription: { status: 'active' }
});
function harness(session = paid()) {
    const retrieve = jest.fn().mockResolvedValue(session);
    const app = express();
    app.use(createCheckoutResultRouter({ stripeClient: { checkout: { sessions: { retrieve } } },
        timeoutMs: 25,
        authenticate: (req, res, next) => {
            if (!req.headers.authorization) return res.sendStatus(401);
            req.user = { id: req.headers.authorization }; next();
        }
    }));
    return { retrieve, get: () => request(app).get('/checkout-result?session_id=cs_test_result').set('Authorization', 'owner'), app };
}
test('returns invoice amount in CZK, stable invoice ID, no customer data and no cache', async () => {
    const h = harness(); const res = await h.get().expect(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toEqual({ success: true, result: { status: 'paid', transaction_id: 'in_confirmed', product_id: 'pruvodce', value: 149, currency: 'CZK' } });
    expect(h.retrieve.mock.calls[0][2]).toEqual({ timeout: 25, maxNetworkRetries: 0 });
});
test('authentication and ID validation happen before Stripe', async () => {
    const h = harness();
    await request(h.app).get('/checkout-result?session_id=cs_test_result').expect(401);
    await request(h.app).get('/checkout-result?session_id=invalid').set('Authorization', 'owner').expect(400);
    expect(h.retrieve).not.toHaveBeenCalled();
});
test.each([{}, { userId: 'other' }])('rejects missing or foreign ownership %j', async metadata => {
    await harness({ ...paid(), metadata }).get().expect(403);
});
test.each([
    { status: 'open' }, { payment_status: 'unpaid' }, { invoice: null },
    { invoice: { id: 'in_x', status: 'open', amount_paid: 19900, currency: 'czk' } },
    { invoice: { id: 'in_x', status: 'paid', amount_paid: 0, currency: 'czk' } },
    { invoice: { id: 'in_x', status: 'paid', amount_paid: 19900, currency: 'jpy' } }
])('does not call unconfirmed or unsupported amounts revenue %j', async patch => {
    const res = await harness({ ...paid(), ...patch }).get().expect(200);
    expect(res.body.result.status).toBe('pending'); expect(res.body.result.value).toBe(0);
});
test('verified trial is separate from paid revenue', async () => {
    const session = paid(); session.payment_status = 'no_payment_required';
    session.subscription.status = 'trialing'; session.invoice.amount_paid = 0;
    const res = await harness(session).get().expect(200);
    expect(res.body.result.status).toBe('trial'); expect(res.body.result.value).toBe(0);
});
test('one-time sessions are not accepted by subscription verification', async () => {
    await harness({ ...paid(), mode: 'payment' }).get().expect(400);
});
test('provider errors and timeouts fail closed without leaking details', async () => {
    const h = harness(); h.retrieve.mockRejectedValueOnce(new Error('sensitive detail'));
    const res = await h.get().expect(502); expect(JSON.stringify(res.body)).not.toContain('sensitive');
    h.retrieve.mockImplementationOnce(() => new Promise(() => {}));
    await h.get().expect(502);
});
