import { jest } from '@jest/globals';
import {
    auditStripeWebhookConfiguration,
    clearStripeWebhookAuditCache,
    getCachedStripeWebhookAudit,
} from '../services/stripe-webhook-audit.js';

function stripeClient(endpoints) {
    return {
        webhookEndpoints: {
            list: jest.fn().mockResolvedValue({ data: endpoints }),
        },
    };
}

describe('Stripe webhook audit service', () => {
    beforeEach(() => clearStripeWebhookAuditCache());

    test('returns a safe healthy live audit', async () => {
        const client = stripeClient([{
            id: 'we_123456789012345',
            url: 'https://www.mystickahvezda.cz/webhook/stripe',
            status: 'enabled',
            enabled_events: ['*'],
        }]);

        const result = await auditStripeWebhookConfiguration({
            stripeClient: client,
            stripeKey: 'sk_live_redacted',
            checkedAt: new Date('2026-08-27T18:00:00.000Z'),
        });

        expect(result).toMatchObject({
            healthy: true,
            stripeMode: 'live',
            checkedAt: '2026-08-27T18:00:00.000Z',
            cached: false,
            missingEvents: [],
        });
        expect(result.matching[0].id).toBe('we_123...2345');
        expect(result).not.toHaveProperty('stripeKey');
    });

    test('never marks a test Stripe account as production healthy', async () => {
        const result = await auditStripeWebhookConfiguration({
            stripeClient: stripeClient([{
                url: 'https://mystickahvezda.cz/webhook/stripe',
                status: 'enabled',
                enabled_events: ['*'],
            }]),
            stripeKey: 'sk_test_placeholder',
        });

        expect(result.healthy).toBe(false);
        expect(result.stripeMode).toBe('test');
    });

    test('caches successful checks and force refresh bypasses the cache', async () => {
        const client = stripeClient([{
            url: 'https://www.mystickahvezda.cz/webhook/stripe',
            status: 'enabled',
            enabled_events: ['*'],
        }]);
        const options = {
            stripeClient: client,
            stripeKey: 'sk_live_redacted',
            cacheMs: 300_000,
        };

        const first = await getCachedStripeWebhookAudit({ ...options, now: 1_000 });
        const cached = await getCachedStripeWebhookAudit({ ...options, now: 2_000 });
        const refreshed = await getCachedStripeWebhookAudit({ ...options, now: 3_000, force: true });

        expect(first.cached).toBe(false);
        expect(cached.cached).toBe(true);
        expect(refreshed.cached).toBe(false);
        expect(client.webhookEndpoints.list).toHaveBeenCalledTimes(2);
    });
});
