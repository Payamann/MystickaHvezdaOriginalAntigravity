import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';

function createPremiumToken(overrides = {}) {
    return jwt.sign({
        id: 'medicine-wheel-test-user',
        email: 'medicine-wheel@example.com',
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

describe('Medicine wheel route', () => {
    test('returns symbolic fallback when mocked AI response is not JSON', async () => {
        const csrfToken = await getCsrfToken();
        const token = createPremiumToken();

        const res = await request(app)
            .post('/api/medicine-wheel')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                name: 'Test User',
                birthDate: '1990-01-01',
                totem: 'Vlk'
            })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.fallback).toBe(true);
        expect(res.body.cached).toBe(false);
        expect(res.body.result).toEqual(expect.objectContaining({
            strengths: expect.any(String),
            challenges: expect.any(String),
            message: expect.any(String)
        }));
        expect(res.body.result.message).toContain('Vlk');
    });

    test('returns symbolic fallback when AI call fails', async () => {
        const originalForceError = process.env.MOCK_AI_FORCE_ERROR;
        process.env.MOCK_AI_FORCE_ERROR = 'true';

        try {
            const csrfToken = await getCsrfToken();
            const token = createPremiumToken({ id: 'medicine-wheel-ai-error-user' });

            const res = await request(app)
                .post('/api/medicine-wheel')
                .set('x-csrf-token', csrfToken)
                .set('Cookie', `auth_token=${token}`)
                .send({
                    name: 'AI Error User',
                    birthDate: '1991-02-03',
                    totem: 'Sova'
                })
                .expect(200);

            expect(res.body.success).toBe(true);
            expect(res.body.fallback).toBe(true);
            expect(res.body.result).toEqual(expect.objectContaining({
                strengths: expect.any(String),
                challenges: expect.any(String),
                message: expect.any(String)
            }));
            expect(res.body.result.message).toContain('Sova');
        } finally {
            if (originalForceError === undefined) {
                delete process.env.MOCK_AI_FORCE_ERROR;
            } else {
                process.env.MOCK_AI_FORCE_ERROR = originalForceError;
            }
        }
    });
});
