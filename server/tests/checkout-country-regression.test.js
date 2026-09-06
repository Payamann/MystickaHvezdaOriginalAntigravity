import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const createSession = jest.fn(async params => {
    // Reproduce the provider rejection observed on the production account.
    if (params.consent_collection?.promotions) {
        throw new Error('`consent_collection.promotions` is not available in your country.');
    }
    return { id: 'cs_test_country_regression', url: 'https://checkout.stripe.com/c/pay/cs_test_country_regression' };
});
jest.unstable_mockModule('stripe', () => ({
    default: class {
        customers = { create: jest.fn(async () => ({ id: 'cus_test_country_regression' })) };
        checkout = { sessions: { create: createSession } };
    }
}));
const { default: app } = await import('../index.js');
const { supabase } = await import('../db-supabase.js');
const { SUBSCRIPTION_PLANS } = await import('../config/constants.js');

describe('Checkout country compatibility through the HTTP endpoint', () => {
    test.each(Object.entries(SUBSCRIPTION_PLANS).filter(([, plan]) => plan.price > 0))(
        '%s creates a subscription session without unsupported promotional consent',
        async (planId, plan) => {
            createSession.mockClear();
            const userId = `country-regression-${planId}`;
            await supabase.from('users').insert({ id: userId, email: 'checkout-test@example.com' });
            const token = jwt.sign({ id: userId, email: 'checkout-test@example.com', role: 'user' }, process.env.JWT_SECRET);
            const csrf = await request(app).get('/api/csrf-token').expect(200);
            const response = await request(app).post('/api/payment/create-checkout-session')
                .set('Authorization', `Bearer ${token}`)
                .set('x-csrf-token', csrf.body.csrfToken)
                .send({ planId, source: 'tarot_auth_gate', feature: 'tarot_multi_card' });
            expect(response.status).toBe(200);
            expect(response.body.url).toBe('https://checkout.stripe.com/c/pay/cs_test_country_regression');
            expect(createSession).toHaveBeenCalledTimes(1);
            const params = createSession.mock.calls[0][0];
            expect(params).not.toHaveProperty('consent_collection');
            expect(params.mode).toBe('subscription');
            expect(params.metadata).toMatchObject({ planId, source: 'tarot_auth_gate', feature: 'tarot_multi_card' });
            expect(params.subscription_data.trial_period_days).toBe(plan.trialDays > 0 ? plan.trialDays : undefined);
            expect(params.after_expiration.recovery).toEqual({ enabled: true, allow_promotion_codes: false });
        }
    );
});
