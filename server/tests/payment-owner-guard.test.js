import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';

async function getCsrfToken() {
    const response = await request(app).get('/api/csrf-token').expect(200);
    return response.body.csrfToken;
}

function createUserToken(id) {
    return jwt.sign({
        id,
        email: `${id}@example.com`,
        role: 'user',
        isPremium: true,
        subscription_status: 'premium_monthly'
    }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const billingMutations = [
    { path: '/api/payment/cancel', body: {} },
    { path: '/api/payment/reactivate', body: {} },
    { path: '/api/payment/portal', body: {} },
    { path: '/api/payment/subscription/pause', body: { pauseDays: 30 } },
    { path: '/api/payment/subscription/resume', body: {} },
    { path: '/api/payment/subscription/apply-discount', body: { couponCode: 'STAY25' } },
    { path: '/api/payment/retention/feedback', body: { type: 'churn', reason: 'other' } },
    { path: '/api/payment/email/send', body: { template: 'discount_applied' } }
];

describe('Payment owner binding', () => {
    test.each(billingMutations)('$path rejects a stale account before provider or database mutation', async ({ path, body }) => {
        const csrfToken = await getCsrfToken();
        const ownerId = `billing-owner-${billingMutations.findIndex(item => item.path === path)}`;

        const response = await request(app)
            .post(path)
            .set('Cookie', `auth_token=${createUserToken(ownerId)}`)
            .set('x-csrf-token', csrfToken)
            .send({ ...body, expectedUserId: 'different-account' })
            .expect(409);

        expect(response.body).toMatchObject({ success: false });
    });

    test.each(billingMutations)('$path rejects a missing account binding', async ({ path, body }) => {
        const csrfToken = await getCsrfToken();
        const ownerId = `billing-unbound-${billingMutations.findIndex(item => item.path === path)}`;

        const response = await request(app)
            .post(path)
            .set('Cookie', `auth_token=${createUserToken(ownerId)}`)
            .set('x-csrf-token', csrfToken)
            .send(body)
            .expect(409);

        expect(response.body).toMatchObject({ success: false });
    });

    test('legacy duplicate pause email can omit the binding because it has no side effects', async () => {
        const csrfToken = await getCsrfToken();
        const ownerId = 'billing-pause-email-owner';

        const response = await request(app)
            .post('/api/payment/email/send')
            .set('Cookie', `auth_token=${createUserToken(ownerId)}`)
            .set('x-csrf-token', csrfToken)
            .send({ template: 'subscription_paused' })
            .expect(200);

        expect(response.body).toMatchObject({ success: true, skipped: true });
    });
});
