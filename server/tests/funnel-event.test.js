import request from 'supertest';
import app from '../index.js';

async function getCsrfToken() {
    const res = await request(app).get('/api/csrf-token').expect(200);
    return res.body.csrfToken;
}

describe('Public funnel event endpoint', () => {
    test('requires CSRF protection', async () => {
        const res = await request(app)
            .post('/api/payment/funnel-event')
            .send({
                eventName: 'paywall_viewed',
                source: 'inline_paywall',
                feature: 'tarot_multi_card',
                planId: 'pruvodce'
            });

        expect(res.status).toBe(403);
    });

    test('rejects non-whitelisted event names before writing', async () => {
        const csrfToken = await getCsrfToken();
        const res = await request(app)
            .post('/api/payment/funnel-event')
            .set('x-csrf-token', csrfToken)
            .send({
                eventName: 'arbitrary_event',
                source: 'inline_paywall',
                feature: 'tarot_multi_card',
                planId: 'pruvodce'
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});
