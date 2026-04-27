import request from 'supertest';
import app from '../index.js';

async function getCsrfToken() {
    const res = await request(app).get('/api/csrf-token').expect(200);
    return res.body.csrfToken;
}

describe('Briefing route', () => {
    test('POST /api/briefing returns fallback when AI fails', async () => {
        const originalForceError = process.env.MOCK_AI_FORCE_ERROR;
        process.env.MOCK_AI_FORCE_ERROR = 'true';

        try {
            const csrfToken = await getCsrfToken();
            const res = await request(app)
                .post('/api/briefing')
                .set('x-csrf-token', csrfToken)
                .send({
                    zodiacSign: 'Beran',
                    name: 'Anna',
                    tarotCard: 'The Star',
                    birthDate: '1990-01-01'
                })
                .expect(200);

            expect(res.body.fallback).toBe(true);
            expect(res.body.text).toEqual(expect.stringContaining('Anna'));
            expect(res.body.text).toEqual(expect.stringContaining('Beran'));
            expect(res.body.text).toEqual(expect.stringContaining('The Star'));
        } finally {
            if (originalForceError === undefined) {
                delete process.env.MOCK_AI_FORCE_ERROR;
            } else {
                process.env.MOCK_AI_FORCE_ERROR = originalForceError;
            }
        }
    });
});
