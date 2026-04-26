import { buildFunnelReport, normalizeFunnelDays, normalizeFunnelLimit } from '../admin.js';
import request from 'supertest';
import app from '../index.js';
import jwt from 'jsonwebtoken';

describe('Admin funnel report helpers', () => {
    test('normalizes report query bounds', () => {
        expect(normalizeFunnelDays(undefined)).toBe(30);
        expect(normalizeFunnelDays('0')).toBe(1);
        expect(normalizeFunnelDays('999')).toBe(365);
        expect(normalizeFunnelDays('90')).toBe(90);

        expect(normalizeFunnelLimit(undefined)).toBe(1000);
        expect(normalizeFunnelLimit('12')).toBe(100);
        expect(normalizeFunnelLimit('9000')).toBe(5000);
        expect(normalizeFunnelLimit('1500')).toBe(1500);
    });

    test('aggregates monetization events into dashboard metrics', () => {
        const report = buildFunnelReport([
            {
                id: 'evt-1',
                event_name: 'checkout_session_created',
                source: 'pricing',
                feature: 'tarot',
                plan_id: 'pruvodce',
                created_at: '2026-04-20T10:00:00.000Z',
                metadata: { amount: 19900 }
            },
            {
                id: 'evt-2',
                event_name: 'checkout_session_created',
                source: 'pricing',
                feature: 'mentor',
                plan_id: 'osviceni',
                created_at: '2026-04-20T10:10:00.000Z',
                metadata: { amount: 49900 }
            },
            {
                id: 'evt-3',
                event_name: 'subscription_checkout_completed',
                source: 'pricing',
                feature: 'tarot',
                plan_id: 'pruvodce',
                plan_type: 'premium_monthly',
                created_at: '2026-04-20T10:20:00.000Z',
                metadata: { status: 'active' }
            },
            {
                id: 'evt-4',
                event_name: 'one_time_purchase_completed',
                source: 'rocni-horoskop',
                feature: 'rocni_horoskop',
                created_at: '2026-04-21T08:00:00.000Z',
                metadata: { amount: 29900 }
            },
            {
                id: 'evt-5',
                event_name: 'checkout_session_failed',
                source: 'pricing',
                feature: 'mentor',
                plan_id: 'osviceni',
                created_at: '2026-04-21T09:00:00.000Z',
                metadata: {}
            },
            {
                id: 'evt-6',
                event_name: 'subscription_payment_failed',
                source: 'email',
                feature: 'renewal',
                plan_type: 'premium_monthly',
                created_at: '2026-04-22T09:00:00.000Z',
                metadata: {}
            },
            {
                id: 'evt-7',
                event_name: 'payment_refunded',
                source: 'support',
                feature: 'refund',
                created_at: '2026-04-23T09:00:00.000Z',
                metadata: {}
            },
            {
                id: 'evt-8',
                event_name: 'subscription_cancel_requested',
                source: 'profile',
                feature: 'billing',
                created_at: '2026-04-24T09:00:00.000Z',
                metadata: {}
            }
        ], {
            days: 30,
            since: '2026-03-26T00:00:00.000Z',
            limit: 1000
        });

        expect(report.totalEvents).toBe(8);
        expect(report.metrics.checkoutStarted).toBe(2);
        expect(report.metrics.paywallViewed).toBe(0);
        expect(report.metrics.paywallToCheckoutRate).toBe(0);
        expect(report.metrics.subscriptionCompleted).toBe(1);
        expect(report.metrics.oneTimeCompleted).toBe(1);
        expect(report.metrics.failures).toBe(2);
        expect(report.metrics.refunds).toBe(1);
        expect(report.metrics.cancelRequests).toBe(1);
        expect(report.metrics.conversionRate).toBe(50);
        expect(report.metrics.estimatedValueCzk).toBe(498);
        expect(report.topSources[0]).toEqual({ key: 'pricing', count: 4 });
        expect(report.topPlans).toContainEqual({ key: 'pruvodce', count: 2 });
        expect(report.daily).toContainEqual(expect.objectContaining({
            date: '2026-04-20',
            checkoutStarted: 2,
            subscriptionCompleted: 1,
            oneTimeCompleted: 0,
            failures: 0,
            refunds: 0
        }));
        expect(report.recentEvents).toHaveLength(8);
    });

    test('calculates paywall to checkout rate', () => {
        const report = buildFunnelReport([
            { event_name: 'paywall_viewed', source: 'inline_paywall', feature: 'tarot', created_at: '2026-04-20T10:00:00.000Z' },
            { event_name: 'paywall_viewed', source: 'inline_paywall', feature: 'tarot', created_at: '2026-04-20T10:01:00.000Z' },
            { event_name: 'login_gate_viewed', source: 'inline_login_gate', feature: 'mentor', created_at: '2026-04-20T10:02:00.000Z' },
            { event_name: 'login_gate_viewed', source: 'inline_login_gate', feature: 'mentor', created_at: '2026-04-20T10:03:00.000Z' },
            { event_name: 'checkout_session_created', source: 'inline_paywall', feature: 'tarot', created_at: '2026-04-20T10:04:00.000Z' },
            { event_name: 'checkout_session_created', source: 'inline_login_gate', feature: 'mentor', created_at: '2026-04-20T10:05:00.000Z' },
        ]);

        expect(report.metrics.paywallViewed).toBe(4);
        expect(report.metrics.checkoutStarted).toBe(2);
        expect(report.metrics.paywallToCheckoutRate).toBe(50);
        expect(report.daily[0]).toEqual(expect.objectContaining({
            date: '2026-04-20',
            paywallViewed: 4,
            checkoutStarted: 2
        }));
    });
});

describe('Admin funnel API access control', () => {
    test('requires authentication', async () => {
        const res = await request(app).get('/api/admin/funnel');

        expect(res.status).toBe(401);
    });

    test('requires admin privileges', async () => {
        const token = jwt.sign(
            { id: 'user-1', email: 'user@example.com', role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const res = await request(app)
            .get('/api/admin/funnel')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(403);
    });
});
