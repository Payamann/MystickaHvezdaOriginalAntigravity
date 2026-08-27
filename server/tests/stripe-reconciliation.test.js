import { readFileSync } from 'node:fs';
import { inferPlanFromStripeSubscription } from '../../scripts/reconcile-stripe-subscriptions.mjs';
import {
    REQUIRED_STRIPE_WEBHOOK_EVENTS,
    evaluateStripeWebhookEndpoints,
} from '../config/stripe-webhooks.js';

function subscription(overrides = {}) {
    return {
        metadata: {},
        items: { data: [] },
        ...overrides,
    };
}

describe('Stripe subscription reconciliation helpers', () => {
    test('prefers explicit subscription metadata planType', () => {
        const result = inferPlanFromStripeSubscription(subscription({
            metadata: {
                planType: 'exclusive_monthly',
                planId: 'osviceni',
            },
            items: {
                data: [{ price: { id: 'price_unknown' } }],
            },
        }));

        expect(result).toEqual(expect.objectContaining({
            planId: 'osviceni',
            planType: 'exclusive_monthly',
            source: 'subscription.metadata.planType',
            priceId: 'price_unknown',
        }));
        expect(result.warnings).toEqual([]);
    });

    test('maps configured Stripe price id to internal plan type', () => {
        const result = inferPlanFromStripeSubscription(subscription({
            metadata: {},
            items: {
                data: [{ price: { id: 'price_live_pruvodce_monthly' } }],
            },
        }), {
            priceIdPlanMap: new Map([
                ['price_live_pruvodce_monthly', 'pruvodce'],
            ]),
        });

        expect(result).toEqual(expect.objectContaining({
            planId: 'pruvodce',
            planType: 'premium_monthly',
            source: 'price.id',
            priceId: 'price_live_pruvodce_monthly',
        }));
        expect(result.warnings).toEqual([]);
    });

    test('falls back to default premium plan when Stripe metadata and price are unknown', () => {
        const result = inferPlanFromStripeSubscription(subscription({
            metadata: {},
            items: {
                data: [{ price: { id: 'price_unmapped' } }],
            },
        }), {
            priceIdPlanMap: new Map(),
        });

        expect(result).toEqual(expect.objectContaining({
            planId: null,
            planType: 'premium_monthly',
            source: 'fallback',
            priceId: 'price_unmapped',
        }));
        expect(result.warnings[0]).toMatch(/Could not map Stripe price/i);
    });
});

describe('Stripe webhook coverage audit', () => {
    test('every required event remains implemented by the signed webhook handler', () => {
        const paymentSource = readFileSync(new URL('../payment.js', import.meta.url), 'utf8');
        for (const eventName of REQUIRED_STRIPE_WEBHOOK_EVENTS) {
            expect(paymentSource).toContain(`case '${eventName}':`);
        }
    });

    test('accepts an enabled all-events endpoint on the apex production host', () => {
        const result = evaluateStripeWebhookEndpoints([{
            id: 'we_123456789012345',
            url: 'https://mystickahvezda.cz/webhook/stripe',
            status: 'enabled',
            enabled_events: ['*'],
        }]);

        expect(result).toMatchObject({
            healthy: true,
            missingEvents: [],
            expectedPath: '/webhook/stripe',
        });
        expect(result.matching[0].id).toBe('we_123...2345');
    });

    test('reports critical missing events without exposing unrelated endpoints', () => {
        const enabledEvents = REQUIRED_STRIPE_WEBHOOK_EVENTS.filter(
            (eventName) => eventName !== 'checkout.session.expired'
        );
        const result = evaluateStripeWebhookEndpoints([
            {
                id: 'we_live_missing_expired',
                url: 'https://www.mystickahvezda.cz/webhook/stripe/',
                status: 'enabled',
                enabled_events: enabledEvents,
            },
            {
                id: 'we_unrelated',
                url: 'https://attacker.example/webhook/stripe',
                status: 'enabled',
                enabled_events: ['*'],
            },
        ]);

        expect(result.healthy).toBe(false);
        expect(result.missingEvents).toEqual(['checkout.session.expired']);
        expect(result.matching).toHaveLength(1);
    });

    test('requires an enabled HTTPS production endpoint', () => {
        const result = evaluateStripeWebhookEndpoints([{
            id: 'we_disabled',
            url: 'http://www.mystickahvezda.cz/webhook/stripe',
            status: 'disabled',
            enabled_events: ['*'],
        }]);

        expect(result.healthy).toBe(false);
        expect(result.matching).toHaveLength(0);
        expect(result.missingEvents).toEqual(REQUIRED_STRIPE_WEBHOOK_EVENTS);
    });
});
