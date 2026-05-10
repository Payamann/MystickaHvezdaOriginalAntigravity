import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import {
    calculateAstrocartographyInsights,
    calculateNatalChart,
    calculateSynastryChart
} from '../services/astrology.js';
import { supabase } from '../db-supabase.js';

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

    test('records first value activation when a user saves their first non-journal reading', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `reading-activation-${Date.now()}`;
        const token = createUserToken({ id: userId, email: `${userId}@example.com` });

        await request(app)
            .post('/api/user/readings')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                type: 'horoscope',
                data: {
                    sign: 'Beran',
                    period: 'daily',
                    prediction: 'Testovaci denni vhled.'
                }
            })
            .expect(200);

        const { data: events } = await supabase
            .from('funnel_events')
            .select('*')
            .eq('user_id', userId);

        expect(events).toEqual(expect.arrayContaining([
            expect.objectContaining({
                event_name: 'first_value_completed',
                feature: 'horoscope'
            }),
            expect.objectContaining({
                event_name: 'activation_completed',
                feature: 'horoscope'
            })
        ]));
    });

    test('counts first value once and ignores earlier journal entries', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `reading-activation-once-${Date.now()}`;
        const token = createUserToken({ id: userId, email: `${userId}@example.com` });

        await request(app)
            .post('/api/user/readings')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                type: 'journal',
                data: 'Prvni vecerni reflexe pred vykladem.'
            })
            .expect(200);

        await request(app)
            .post('/api/user/readings')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                type: 'horoscope',
                data: {
                    sign: 'Beran',
                    period: 'daily',
                    prediction: 'Prvni skutecny vyklad.'
                }
            })
            .expect(200);

        await request(app)
            .post('/api/user/readings')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                type: 'tarot',
                data: {
                    question: 'Co dal?',
                    response: 'Druhy vyklad uz nema byt prvni hodnota.'
                }
            })
            .expect(200);

        const { data: events } = await supabase
            .from('funnel_events')
            .select('*')
            .eq('user_id', userId);

        expect(events.filter(event => event.event_name === 'daily_ritual_completed')).toHaveLength(1);
        expect(events.filter(event => event.event_name === 'first_value_completed')).toHaveLength(1);
        expect(events.filter(event => event.event_name === 'activation_completed')).toHaveLength(1);
        expect(events.find(event => event.event_name === 'first_value_completed')).toMatchObject({
            feature: 'horoscope'
        });
    });

    test('merges validated feedback into structured reading data', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `reading-feedback-${Date.now()}`;
        const token = createUserToken({ id: userId, email: `${userId}@example.com` });

        const saved = await request(app)
            .post('/api/user/readings')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                type: 'tarot',
                data: {
                    question: 'Co potrebuji vedet?',
                    response: 'Karta ukazuje konkretni dalsi krok.'
                }
            })
            .expect(200);

        const res = await request(app)
            .patch(`/api/user/readings/${saved.body.id}/feedback`)
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                resonance: 'fits',
                focus: 'relationships',
                nextAction: 'journal',
                feature: 'daily_guidance',
                source: 'horoscope_feedback_strip'
            })
            .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.feedback).toEqual(expect.objectContaining({
            resonance: 'fits',
            focus: 'relationships',
            nextAction: 'journal'
        }));
        expect(res.body.reading.data.response).toBe('Karta ukazuje konkretni dalsi krok.');

        const { data: events } = await supabase
            .from('funnel_events')
            .select('*')
            .eq('user_id', userId)
            .eq('event_name', 'reading_feedback_submitted');

        expect(events).toContainEqual(expect.objectContaining({
            source: 'horoscope_feedback_strip',
            feature: 'daily_guidance'
        }));
    });

    test('rejects invalid reading feedback values', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `reading-feedback-invalid-${Date.now()}`;
        const token = createUserToken({ id: userId, email: `${userId}@example.com` });

        const saved = await request(app)
            .post('/api/user/readings')
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                type: 'horoscope',
                data: { sign: 'Ryby', prediction: 'Test.' }
            })
            .expect(200);

        const res = await request(app)
            .patch(`/api/user/readings/${saved.body.id}/feedback`)
            .set('x-csrf-token', csrfToken)
            .set('Cookie', `auth_token=${token}`)
            .send({
                resonance: 'perfect_magic'
            })
            .expect(400);

        expect(res.body.error).toMatch(/invalid feedback resonance/i);
    });
});
