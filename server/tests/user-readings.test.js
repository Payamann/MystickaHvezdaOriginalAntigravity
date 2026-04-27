import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import {
    calculateAstrocartographyInsights,
    calculateNatalChart,
    calculateSynastryChart
} from '../services/astrology.js';

function createUserToken(overrides = {}) {
    return jwt.sign({
        id: 'reading-history-test-user',
        email: 'reading-history@example.com',
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

describe('User readings route', () => {
    test('saves structured frontend reading data for current feature types', async () => {
        const csrfToken = await getCsrfToken();
        const token = createUserToken();

        const res = await request(app)
            .post('/api/user/readings')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                type: 'natal-chart',
                data: {
                    name: 'Test User',
                    chart: {
                        sun: { sign: 'Beran' },
                        moon: { sign: 'Rak' }
                    },
                    response: 'Strukturovany testovaci vyklad.'
                }
            })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.id).toBe(res.body.reading.id);
        expect(res.body.reading).toEqual(expect.objectContaining({
            type: 'natal-chart',
            user_id: 'reading-history-test-user'
        }));
        expect(res.body.reading.data.chart.sun.sign).toBe('Beran');
    });

    test('saves realistic astro engine artifacts from frontend readings', async () => {
        const csrfToken = await getCsrfToken();
        const token = createUserToken({ id: 'reading-history-astro-artifact-user' });
        const person = {
            name: 'Test User',
            birthDate: '1990-05-17',
            birthTime: '14:30',
            birthPlace: 'Praha'
        };
        const partner = {
            name: 'Partner',
            birthDate: '1991-08-21',
            birthTime: '09:15',
            birthPlace: 'Brno'
        };
        const chart = calculateNatalChart(person);
        const synastry = calculateSynastryChart(person, partner);
        const astrocartography = calculateAstrocartographyInsights(person, 'laska', chart);

        expect(JSON.stringify({ chart }).length).toBeGreaterThan(9000);

        const payloads = [
            {
                type: 'natal-chart',
                data: {
                    ...person,
                    interpretation: 'Strukturovany natalni vyklad.',
                    chart
                }
            },
            {
                type: 'synastry',
                data: {
                    person1: person,
                    person2: partner,
                    interpretation: 'Strukturovany synastricky vyklad.',
                    scores: synastry.scores,
                    synastry
                }
            },
            {
                type: 'astrocartography',
                data: {
                    ...person,
                    intention: 'laska',
                    response: 'Strukturovany astrocartograficky vyklad.',
                    chart,
                    astrocartography
                }
            }
        ];

        for (const payload of payloads) {
            const res = await request(app)
                .post('/api/user/readings')
                .set('x-csrf-token', csrfToken)
                .set('Cookie', `auth_token=${token}`)
                .send(payload)
                .expect(200);

            expect(res.body.reading.type).toBe(payload.type);
            expect(res.body.reading.data).toEqual(expect.objectContaining(payload.data));
        }
    });

    test('rejects oversized reading data with 400 instead of 500', async () => {
        const csrfToken = await getCsrfToken();
        const token = createUserToken({ id: 'reading-history-large-test-user' });

        const res = await request(app)
            .post('/api/user/readings')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                type: 'tarot',
                data: { response: 'x'.repeat(51000) }
            })
            .expect(400);

        expect(res.body.error).toMatch(/too large/i);
    });
});
