import request from 'supertest';
import app from '../index.js';

async function getCsrfToken() {
    const res = await request(app).get('/api/csrf-token').expect(200);
    return res.body.csrfToken;
}

describe('Push notification API', () => {
    test('POST /api/push/subscribe rejects missing CSRF', async () => {
        const res = await request(app)
            .post('/api/push/subscribe')
            .send({
                subscription: {
                    endpoint: 'https://push.example.test/no-csrf',
                    keys: { p256dh: 'test-p256dh', auth: 'test-auth' }
                }
            });

        expect(res.status).toBe(403);
    });

    test('POST /api/push/subscribe validates subscription payload', async () => {
        const csrfToken = await getCsrfToken();

        const res = await request(app)
            .post('/api/push/subscribe')
            .set('x-csrf-token', csrfToken)
            .send({ subscription: {} });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('POST /api/push/unsubscribe validates endpoint payload', async () => {
        const csrfToken = await getCsrfToken();

        const res = await request(app)
            .post('/api/push/unsubscribe')
            .set('x-csrf-token', csrfToken)
            .send({ endpoint: '' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('can subscribe and unsubscribe a browser push endpoint', async () => {
        const csrfToken = await getCsrfToken();
        const subscription = {
            endpoint: `https://push.example.test/${Date.now()}`,
            keys: {
                p256dh: 'test-p256dh',
                auth: 'test-auth'
            }
        };

        const subscribeRes = await request(app)
            .post('/api/push/subscribe')
            .set('x-csrf-token', csrfToken)
            .send({ subscription })
            .expect(200);

        expect(subscribeRes.body.success).toBe(true);

        const unsubscribeRes = await request(app)
            .post('/api/push/unsubscribe')
            .set('x-csrf-token', csrfToken)
            .send({ endpoint: subscription.endpoint })
            .expect(200);

        expect(unsubscribeRes.body.success).toBe(true);
    });
});
