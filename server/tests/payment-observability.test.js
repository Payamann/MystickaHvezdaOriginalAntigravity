import request from 'supertest';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import app from '../index.js';
import { supabase } from '../db-supabase.js';

async function getCsrfToken() {
    const res = await request(app).get('/api/csrf-token').expect(200);
    return res.body.csrfToken;
}

function makeToken(userId, email = `${userId}@example.com`) {
    return jwt.sign(
        { id: userId, email, role: 'user', subscription_status: 'free', isPremium: false },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function getBillingPortalSessionsPrototype() {
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || 'test-stripe-key');
    return Object.getPrototypeOf(stripeClient.billingPortal.sessions);
}

function getSubscriptionsPrototype() {
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || 'test-stripe-key');
    return Object.getPrototypeOf(stripeClient.subscriptions);
}

async function getEvents(userId, eventName) {
    const { data } = await supabase
        .from('funnel_events')
        .select('*')
        .eq('user_id', userId)
        .eq('event_name', eventName);

    return data || [];
}

describe('Checkout observability', () => {
    test('expired local collection pause is reconciled from Stripe before status is returned', async () => {
        const userId = `expired-pause-${Date.now()}`;
        const customerId = `cus_expired_pause_${Date.now()}`;
        const subscriptionId = `sub_expired_pause_${Date.now()}`;
        const token = makeToken(userId);

        await supabase.from('users').insert({
            id: userId,
            email: `${userId}@example.com`,
            stripe_customer_id: customerId,
            is_premium: false
        });
        await supabase.from('subscriptions').insert({
            user_id: userId,
            plan_type: 'premium_monthly',
            status: 'paused',
            stripe_subscription_id: subscriptionId,
            pause_until: new Date(Date.now() - 60_000).toISOString(),
            current_period_end: new Date(Date.now() + 7 * 86400_000).toISOString()
        });

        const subscriptionsPrototype = getSubscriptionsPrototype();
        const list = subscriptionsPrototype.list;
        const listCalls = [];
        subscriptionsPrototype.list = async (params) => {
            listCalls.push(params);
            return {
                data: [{
                    id: subscriptionId,
                    customer: customerId,
                    status: 'active',
                    cancel_at_period_end: false,
                    current_period_end: Math.floor(Date.now() / 1000) + 7 * 86400,
                    metadata: { planId: 'pruvodce', planType: 'premium_monthly' },
                    items: { data: [] },
                    pause_collection: null,
                    created: Math.floor(Date.now() / 1000) - 86400
                }]
            };
        };

        let res;
        try {
            res = await request(app)
                .get('/api/payment/subscription/status')
                .set('Authorization', `Bearer ${token}`);
        } finally {
            subscriptionsPrototype.list = list;
        }

        expect(listCalls).toEqual([{ customer: customerId, status: 'all', limit: 10 }]);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            planType: 'premium_monthly',
            status: 'active',
            pauseUntil: null,
            canResume: false,
            needsPaymentUpdate: false
        });
    });

    test('invalid checkout plan records a validation funnel event with safe context', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `checkout-invalid-${Date.now()}`;
        const token = makeToken(userId);

        const res = await request(app)
            .post('/api/payment/create-checkout-session')
            .set('x-csrf-token', csrfToken)
            .set('Authorization', `Bearer ${token}`)
            .send({
                planId: '<script>bad-plan</script>',
                source: 'inline_paywall',
                feature: 'mentor',
                metadata: {
                    entry_source: 'mentor_limit_modal',
                    utm_campaign: 'a'.repeat(300),
                    email: 'private@example.com',
                    path: '/mentor.html'
                }
            });

        expect(res.status).toBe(400);

        const events = await getEvents(userId, 'checkout_validation_failed');
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            source: 'inline_paywall',
            feature: 'mentor'
        });
        expect(events[0].metadata).toMatchObject({
            reason: 'invalid_plan_id',
            entry_source: 'mentor_limit_modal',
            utm_campaign: 'a'.repeat(240)
        });
        expect(events[0].metadata.email).toBeUndefined();
        expect(events[0].metadata.path).toBeUndefined();
    });

    test('free plan checkout attempt records blocked-free-plan reason', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `checkout-free-${Date.now()}`;
        const token = makeToken(userId);

        const res = await request(app)
            .post('/api/payment/create-checkout-session')
            .set('x-csrf-token', csrfToken)
            .set('Authorization', `Bearer ${token}`)
            .send({
                planId: 'poutnik',
                source: 'pricing_free_cta',
                feature: 'premium_membership',
                metadata: {
                    entry_feature: 'mentor',
                    requested_card: 'Hvezda',
                    path: '/cenik.html'
                }
            });

        expect(res.status).toBe(400);

        const events = await getEvents(userId, 'checkout_validation_failed');
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            source: 'pricing_free_cta',
            feature: 'premium_membership',
            plan_id: 'poutnik',
            plan_type: 'free'
        });
        expect(events[0].metadata).toMatchObject({
            reason: 'free_plan_checkout_blocked',
            entry_feature: 'mentor',
            requested_card: 'Hvezda'
        });
        expect(events[0].metadata.path).toBeUndefined();
    });

    test('duplicate subscription checkout block returns 409 with null portalUrl fallback and logs blocked reason', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `checkout-duplicate-blocked-${Date.now()}`;
        const token = makeToken(userId);

        await supabase.from('users').insert({
            id: userId,
            email: `${userId}@example.com`,
            stripe_customer_id: `cus_existing_${Date.now()}`
        });

        await supabase.from('subscriptions').insert({
            user_id: userId,
            plan_type: 'pruvodce',
            status: 'active',
            stripe_subscription_id: `sub_active_${Date.now()}`,
            current_period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

        const portalSessionsPrototype = getBillingPortalSessionsPrototype();
        const portalCreate = portalSessionsPrototype.create;
        portalSessionsPrototype.create = async () => {
            throw new Error('billing portal disabled');
        };

        let res;
        try {
            res = await request(app)
                .post('/api/payment/create-checkout-session')
                .set('x-csrf-token', csrfToken)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    planId: 'pruvodce',
                    source: 'pricing_upgrade_cta',
                    feature: 'premium_membership',
                    metadata: {
                        entry_source: 'pricing_upgrade_cta'
                    }
                });
        } finally {
            portalSessionsPrototype.create = portalCreate;
        }

        expect(res.status).toBe(409);
        expect(res.body.code).toBe('SUBSCRIPTION_ALREADY_ACTIVE');
        expect(res.body.portalUrl).toBeNull();

        const events = await getEvents(userId, 'checkout_validation_failed');
        expect(events).toHaveLength(1);
        expect(events[0].metadata).toMatchObject({
            reason: 'existing_subscription_checkout_blocked'
        });
    });

    test('duplicate subscription checkout block returns portalUrl when billing portal session succeeds', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `checkout-duplicate-portal-${Date.now()}`;
        const token = makeToken(userId);
        const expectedPortalUrl = `https://billing.example.test/session/${Date.now()}`;

        await supabase.from('users').insert({
            id: userId,
            email: `${userId}@example.com`,
            stripe_customer_id: `cus_existing_${Date.now()}`
        });

        await supabase.from('subscriptions').insert({
            user_id: userId,
            plan_type: 'pruvodce',
            status: 'active',
            stripe_subscription_id: `sub_active_${Date.now()}`,
            current_period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

        const portalSessionsPrototype = getBillingPortalSessionsPrototype();
        const portalCreate = portalSessionsPrototype.create;
        portalSessionsPrototype.create = async () => ({
            url: expectedPortalUrl
        });

        let res;
        try {
            res = await request(app)
                .post('/api/payment/create-checkout-session')
                .set('x-csrf-token', csrfToken)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    planId: 'pruvodce',
                    source: 'pricing_upgrade_cta',
                    feature: 'premium_membership'
                });
        } finally {
            portalSessionsPrototype.create = portalCreate;
        }

        expect(res.status).toBe(409);
        expect(res.body.code).toBe('SUBSCRIPTION_ALREADY_ACTIVE');
        expect(res.body.portalUrl).toBe(expectedPortalUrl);

        const events = await getEvents(userId, 'checkout_validation_failed');
        expect(events).toHaveLength(1);
        expect(events[0].metadata).toMatchObject({
            reason: 'existing_subscription_checkout_blocked'
        });
    });

    test('past_due checkout block opens the payment-method-update portal flow', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `checkout-past-due-${Date.now()}`;
        const token = makeToken(userId);
        const customerId = `cus_past_due_${Date.now()}`;

        await supabase.from('users').insert({
            id: userId,
            email: `${userId}@example.com`,
            stripe_customer_id: customerId
        });
        await supabase.from('subscriptions').insert({
            user_id: userId,
            plan_type: 'pruvodce',
            status: 'past_due',
            stripe_subscription_id: `sub_past_due_${Date.now()}`,
            current_period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

        const portalSessionsPrototype = getBillingPortalSessionsPrototype();
        const portalCreate = portalSessionsPrototype.create;
        const portalParams = [];
        portalSessionsPrototype.create = async (params) => {
            portalParams.push(params);
            return { url: 'https://billing.example.test/payment-update' };
        };

        let res;
        try {
            res = await request(app)
                .post('/api/payment/create-checkout-session')
                .set('x-csrf-token', csrfToken)
                .set('Authorization', `Bearer ${token}`)
                .send({ planId: 'pruvodce', source: 'pricing_recovery', feature: 'premium_membership' });
        } finally {
            portalSessionsPrototype.create = portalCreate;
        }

        expect(res.status).toBe(409);
        expect(res.body.portalUrl).toBe('https://billing.example.test/payment-update');
        expect(res.body.code).toBe('PAYMENT_METHOD_UPDATE_REQUIRED');
        expect(res.body.error).toBe('Platbu předplatného je potřeba dokončit. Aktualizuj platební metodu v zákaznickém portálu.');
        expect(portalParams[0]).toMatchObject({
            customer: customerId,
            return_url: expect.stringMatching(/\/profil\.html\?source=payment_recovery$/),
            flow_data: { type: 'payment_method_update' }
        });
        expect(portalParams[0].return_url).not.toContain('payment=cancel');
    });

    test('legacy client pause-email request is acknowledged without sending a duplicate', async () => {
        const csrfToken = await getCsrfToken();
        const userId = `pause-email-dedupe-${Date.now()}`;
        const token = makeToken(userId);

        const res = await request(app)
            .post('/api/payment/email/send')
            .set('x-csrf-token', csrfToken)
            .set('Authorization', `Bearer ${token}`)
            .send({ template: 'subscription_paused', data: { daysUntilResume: 30 } });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            success: true,
            skipped: true,
            managedBy: 'subscription/pause'
        });
    });
});
