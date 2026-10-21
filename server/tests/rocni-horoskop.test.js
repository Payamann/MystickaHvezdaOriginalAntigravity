/**
 * Retired annual horoscope product tests
 */

import request from 'supertest';
import express from 'express';
import app from '../index.js';
import { supabase } from '../db-supabase.js';
import { calculatePersonalMapZodiacSign, isMatchingPersonalMapCheckoutOrderSession } from '../routes/osobni-mapa.js';
import { createRetiredAnnualHoroscopeRouter } from '../routes/rocni-horoskop.js';

function annualCheckoutSession(overrides = {}) {
    return {
        id: 'cs_test_annual_result',
        mode: 'payment',
        status: 'complete',
        payment_status: 'paid',
        amount_total: 19900,
        currency: 'czk',
        metadata: { productType: 'rocni_horoskop', productId: 'rocni_horoskop_2026' },
        payment_intent: {
            id: 'pi_test_annual_result',
            status: 'succeeded',
            amount_received: 19900,
            currency: 'czk'
        },
        ...overrides
    };
}

function createAnnualResultTestApp(sessionOrError, orderInput = null) {
    const testApp = express();
    const stripeClient = { checkout: { sessions: { retrieve: async () => {
        if (sessionOrError instanceof Error) throw sessionOrError;
        return sessionOrError;
    } } } };
    testApp.use('/api/rocni-horoskop', createRetiredAnnualHoroscopeRouter({
        getStripeClient: () => stripeClient,
        getOrderInput: async () => orderInput
    }));
    return testApp;
}

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

    test('checkout result confirms the retired product only after a paid Stripe session', async () => {
        const res = await request(createAnnualResultTestApp(annualCheckoutSession()))
            .get('/api/rocni-horoskop/checkout-result?session_id=cs_test_annual_result')
            .expect(200);

        expect(res.headers['cache-control']).toContain('no-store');
        expect(res.body).toMatchObject({
            success: true,
            result: {
                status: 'paid',
                product_id: 'rocni_horoskop_2026',
                transaction_id: 'pi_test_annual_result',
                value: 199,
                currency: 'CZK'
            }
        });
    });

    test('checkout result keeps the historical webhook product fallback for paid sessions', async () => {
        const session = annualCheckoutSession({
            metadata: { productType: 'rocni_horoskop', orderId: 'legacy-annual-order' }
        });
        const res = await request(createAnnualResultTestApp(session, {
            product_type: 'rocni_horoskop',
            product_id: 'rocni_horoskop_2026'
        }))
            .get('/api/rocni-horoskop/checkout-result?session_id=cs_test_annual_result')
            .expect(200);

        expect(res.body.result).toMatchObject({ status: 'paid', product_id: 'rocni_horoskop_2026' });
    });

    test.each([
        ['open session', { status: 'open', payment_status: 'unpaid' }, 'not_paid'],
        ['async payment', { status: 'complete', payment_status: 'unpaid' }, 'pending'],
        ['wrong product', { metadata: { productType: 'personal_map', productId: 'osobni_mapa_2026' } }, 404],
        ['wrong amount', { amount_total: 29900, payment_intent: { id: 'pi_wrong', status: 'succeeded', amount_received: 29900, currency: 'czk' } }, 'not_paid'],
        ['unsettled intent', { payment_intent: { id: 'pi_pending', status: 'processing', amount_received: 0, currency: 'czk' } }, 'not_paid']
    ])('does not confirm %s as paid', async (_name, overrides, expectedStatus) => {
        const res = await request(createAnnualResultTestApp(annualCheckoutSession(overrides)))
            .get('/api/rocni-horoskop/checkout-result?session_id=cs_test_annual_result')
            .expect(typeof expectedStatus === 'number' ? expectedStatus : 200);

        if (typeof expectedStatus === 'number') {
            expect(res.body.success).toBe(false);
        } else {
            expect(res.body.result.status).toBe(expectedStatus);
        }
    });

    test('checkout result fails closed when Stripe cannot be reached or session ID is invalid', async () => {
        const stripeFailure = new Error('Stripe unavailable');
        const failed = await request(createAnnualResultTestApp(stripeFailure))
            .get('/api/rocni-horoskop/checkout-result?session_id=cs_test_annual_result')
            .expect(502);
        expect(failed.body.success).toBe(false);

        const invalidId = await request(createAnnualResultTestApp(annualCheckoutSession()))
            .get('/api/rocni-horoskop/checkout-result?session_id=not-a-session')
            .expect(400);
        expect(invalidId.body.success).toBe(false);
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

    test('Personal Map checkout validation uses Stripe minor units as configured', () => {
        const order = {
            id: 'personal-map-order-1',
            payload: {
                productPeriodStart: '2026-10-21',
                productPeriodEnd: '2027-10-20'
            }
        };
        const session = {
            mode: 'payment',
            metadata: {
                productType: 'personal_map',
                productId: 'osobni_mapa_2026',
                orderId: order.id,
                productPeriodStart: order.payload.productPeriodStart,
                productPeriodEnd: order.payload.productPeriodEnd,
                price: '29900',
                currency: 'czk'
            },
            amount_total: 29900,
            currency: 'czk',
            url: 'https://checkout.stripe.com/c/pay/cs_test_personal_map'
        };

        expect(isMatchingPersonalMapCheckoutOrderSession(session, order)).toBe(true);
        expect(isMatchingPersonalMapCheckoutOrderSession({ ...session, amount_total: 2990000 }, order)).toBe(false);
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
                source,
                flowId: `pm_${Date.now()}_rollover`
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

    test('POST /api/osobni-mapa/checkout rejects a future Prague birth date before Stripe', async () => {
        const csrfToken = await getCsrfToken();
        const res = await request(app)
            .post('/api/osobni-mapa/checkout')
            .set('x-csrf-token', csrfToken)
            .send({
                name: 'Test User',
                email: 'test@example.com',
                birthDate: '9999-12-31',
                birthTime: '12:30',
                birthPlace: 'Praha',
                sign: 'beran',
                grammaticalGender: 'neutral',
                focusArea: 'change',
                focus: 'Chci pochopit hlavni tema roku.',
                source: `personal_map_future_date_${Date.now()}`,
                flowId: `pm_${Date.now()}_future`
            })
            .expect(400);

        expect(res.body.error).toMatch(/datum/i);
    });

    test('POST /api/osobni-mapa/checkout requires a stable client flow ID', async () => {
        const csrfToken = await getCsrfToken();
        const source = `personal_map_missing_flow_${Date.now()}`;
        const res = await request(app)
            .post('/api/osobni-mapa/checkout')
            .set('x-csrf-token', csrfToken)
            .send({
                name: 'Test User',
                email: 'test@example.com',
                birthDate: '1990-01-01',
                birthTime: '12:30',
                birthPlace: 'Praha',
                sign: 'kozoroh',
                grammaticalGender: 'neutral',
                focusArea: 'change',
                focus: 'Chci pochopit hlavni tema roku.',
                source
            })
            .expect(400);

        expect(res.body.error).toMatch(/bezpečně připravit/i);
        const { data } = await supabase.from('one_time_order_inputs').select('id')
            .eq('product_type', 'personal_map')
            .eq('product_id', 'osobni_mapa_2026')
            .eq('payload->>source', source);
        expect(data).toHaveLength(0);
    });
});
