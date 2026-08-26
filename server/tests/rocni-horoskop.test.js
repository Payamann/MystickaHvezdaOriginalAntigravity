/**
 * One-time annual horoscope product tests
 */

import request from 'supertest';
import app from '../index.js';
import { supabase } from '../db-supabase.js';
import { calculatePersonalMapZodiacSign } from '../routes/osobni-mapa.js';

async function getCsrfToken() {
    const res = await request(app).get('/api/csrf-token').expect(200);
    return res.body.csrfToken;
}

describe('Roční horoskop one-time product', () => {
    test.each([
        ['1990-01-19', 'kozoroh'], ['1990-01-20', 'vodnar'],
        ['1990-02-18', 'vodnar'], ['1990-02-19', 'ryby'],
        ['1990-03-20', 'ryby'], ['1990-03-21', 'beran'],
        ['1990-04-19', 'beran'], ['1990-04-20', 'byk'],
        ['1990-05-20', 'byk'], ['1990-05-21', 'blizenci'],
        ['1990-06-20', 'blizenci'], ['1990-06-21', 'rak'],
        ['1990-07-22', 'rak'], ['1990-07-23', 'lev'],
        ['1990-08-22', 'lev'], ['1990-08-23', 'panna'],
        ['1990-09-22', 'panna'], ['1990-09-23', 'vahy'],
        ['1990-10-22', 'vahy'], ['1990-10-23', 'stir'],
        ['1990-11-21', 'stir'], ['1990-11-22', 'strelec'],
        ['1990-12-21', 'strelec'], ['1990-12-22', 'kozoroh'],
    ])('derives zodiac sign at boundary %s as %s', (birthDate, expectedSign) => {
        expect(calculatePersonalMapZodiacSign(birthDate)).toBe(expectedSign);
    });

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
