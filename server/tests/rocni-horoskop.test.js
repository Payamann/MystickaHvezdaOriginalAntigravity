/**
 * One-time annual horoscope product tests
 */

import request from 'supertest';
import app from '../index.js';
import { supabase } from '../db-supabase.js';

async function getCsrfToken() {
    const res = await request(app).get('/api/csrf-token').expect(200);
    return res.body.csrfToken;
}

describe('Roční horoskop one-time product', () => {
    test('GET /api/rocni-horoskop/product retires the fixed-year offer', async () => {
        const res = await request(app)
            .get('/api/rocni-horoskop/product')
            .expect(410);

        expect(res.body).toMatchObject({
            retired: true,
            replacement: {
                id: 'osobni_mapa_2026',
                name: 'Osobní mapa na 12 měsíců',
                path: '/osobni-mapa.html'
            }
        });
        expect(res.body).not.toHaveProperty('price');
    });

    test('GET /api/osobni-mapa/product returns the evergreen 12-month product', async () => {
        const res = await request(app)
            .get('/api/osobni-mapa/product')
            .expect(200);

        expect(res.body).toMatchObject({
            id: 'osobni_mapa_2026',
            name: 'Osobní mapa na 12 měsíců',
            price: 29900,
            currency: 'czk',
            periodMonths: 12,
            period: {
                months: 12
            }
        });
        expect(res.headers['cache-control']).toContain('no-store');
        expect(res.body.period.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(res.body.period.end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(res.body.period.label).toMatch(/\d{4}.+\d{4}/);
        expect(res.body).not.toHaveProperty('year');
    });

    test('POST /api/rocni-horoskop/checkout requires CSRF token', async () => {
        const res = await request(app)
            .post('/api/rocni-horoskop/checkout')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                birthDate: '1990-01-01',
                sign: 'beran'
            });

        expect(res.status).toBe(403);
    });

    test('POST /api/rocni-horoskop/checkout cannot create any new fixed-year sale', async () => {
        const csrfToken = await getCsrfToken();
        const res = await request(app)
            .post('/api/rocni-horoskop/checkout')
            .set('x-csrf-token', csrfToken)
            .send({
                name: 'Test User',
                email: 'test@example.com',
                birthDate: '1990-01-01',
                sign: 'beran',
                source: 'old_page'
            });

        expect(res.status).toBe(410);
        expect(res.body).toMatchObject({
            retired: true,
            replacement: {
                id: 'osobni_mapa_2026',
                path: '/osobni-mapa.html'
            }
        });
    });

    test('POST /api/osobni-mapa/checkout rejects rollover birth date before Stripe', async () => {
        const csrfToken = await getCsrfToken();
        const source = `personal_map_validation_${Date.now()}`;
        const res = await request(app)
            .post('/api/osobni-mapa/checkout')
            .set('x-csrf-token', csrfToken)
            .send({
                name: 'Test User',
                email: 'test@example.com',
                birthDate: '1990-02-31',
                birthTime: '12:30',
                birthPlace: 'Praha',
                sign: 'beran',
                grammaticalGender: 'neutral',
                focusArea: 'change',
                focus: 'Chci pochopit hlavni tema roku.',
                source
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/datum/i);

        const { data } = await supabase
            .from('funnel_events')
            .select('*')
            .eq('source', source)
            .eq('event_name', 'checkout_validation_failed');

        expect(data).toContainEqual(expect.objectContaining({
            feature: 'osobni_mapa_2026',
            plan_id: 'osobni_mapa_2026',
            plan_type: 'personal_map',
            metadata: expect.objectContaining({
                product_id: 'osobni_mapa_2026',
                reason: 'invalid_birth_date'
            })
        }));
    });
});
