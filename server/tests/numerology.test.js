import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';

function createPremiumToken(overrides = {}) {
    return jwt.sign({
        id: 'numerology-test-user',
        email: 'numerology@example.com',
        role: 'user',
        isPremium: true,
        subscription_status: 'premium_monthly',
        ...overrides
    }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function getCsrfToken() {
    const res = await request(app).get('/api/csrf-token').expect(200);
    return res.body.csrfToken;
}

describe('Numerology route', () => {
    test('returns calculated fallback when AI service fails', async () => {
        const originalForceError = process.env.MOCK_AI_FORCE_ERROR;
        process.env.MOCK_AI_FORCE_ERROR = 'true';

        try {
            const csrfToken = await getCsrfToken();
            const token = createPremiumToken();

            const res = await request(app)
                .post('/api/numerology')
                .set('x-csrf-token', csrfToken)
                .set('Cookie', `auth_token=${token}`)
                .send({
                    name: 'Test User',
                    birthDate: '1990-01-01',
                    birthTime: '08:30'
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.fallback).toBe(true);
            expect(res.body.response).toContain('Životní cesta');
            expect(res.body.numbers).toEqual(expect.objectContaining({
                lifePath: expect.any(Number),
                destiny: expect.any(Number),
                soul: expect.any(Number),
                personality: expect.any(Number)
            }));
        } finally {
            if (originalForceError === undefined) {
                delete process.env.MOCK_AI_FORCE_ERROR;
            } else {
                process.env.MOCK_AI_FORCE_ERROR = originalForceError;
            }
        }
    });
});
