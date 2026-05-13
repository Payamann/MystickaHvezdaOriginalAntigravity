import crypto from 'crypto';
import { jest } from '@jest/globals';

const TEST_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'test-webhook-secret';

const entitlementRuntime = {
    scenario: {},
    calls: {
        paymentEventMarkSuccess: 0,
        paymentEventMarkFailed: 0,
    },
};

function resetRuntime() {
    entitlementRuntime.scenario = {};
    entitlementRuntime.calls = {
        paymentEventMarkSuccess: 0,
        paymentEventMarkFailed: 0,
    };
}

function paymentEventsQuery() {
    return {
        insert: async () => ({ error: entitlementRuntime.scenario.paymentEventInsertError ?? null }),
        select: () => ({
            eq: () => ({
                maybeSingle: async () => ({
                    data: entitlementRuntime.scenario.existingReservation ?? null,
                    error: entitlementRuntime.scenario.existingReservationError ?? null,
                }),
            }),
        }),
        update: (payload) => {
            if (payload?.status === 'processing') {
                return {
                    eq: () => ({
                        neq: () => ({
                            select: async () => ({
                                data: entitlementRuntime.scenario.reclaimRows ?? [],
                                error: entitlementRuntime.scenario.reclaimError ?? null,
                            }),
                        }),
                    }),
                };
            }

            if (payload?.status === 'success') {
                entitlementRuntime.calls.paymentEventMarkSuccess += 1;
                return {
                    eq: async () => ({
                        error: entitlementRuntime.scenario.paymentEventSuccessUpdateError ?? null,
                    }),
                };
            }

            if (payload?.status === 'failed') {
                entitlementRuntime.calls.paymentEventMarkFailed += 1;
                return {
                    eq: () => ({
                        eq: async () => ({
                            error: entitlementRuntime.scenario.paymentEventFailedUpdateError ?? null,
                        }),
                    }),
                };
            }

            throw new Error(`Unexpected payment_events update payload: ${JSON.stringify(payload)}`);
        },
    };
}

function subscriptionsQuery() {
    return {
        select: () => ({
            eq: () => ({
                maybeSingle: async () => ({
                    data: entitlementRuntime.scenario.existingSubscription ?? null,
                    error: entitlementRuntime.scenario.existingSubscriptionError ?? null,
                }),
                single: async () => ({
                    data: entitlementRuntime.scenario.subscriptionLookup ?? null,
                    error: entitlementRuntime.scenario.subscriptionLookupError ?? null,
                }),
            }),
        }),
        upsert: async () => ({
            error: entitlementRuntime.scenario.subscriptionUpsertError ?? null,
        }),
        update: () => ({
            eq: async () => ({
                error: entitlementRuntime.scenario.subscriptionStatusUpdateError ?? null,
            }),
        }),
    };
}

function usersQuery() {
    return {
        update: (payload) => ({
            eq: async () => ({
                error: Object.prototype.hasOwnProperty.call(payload ?? {}, 'is_premium')
                    ? (entitlementRuntime.scenario.userPremiumWriteError ?? null)
                    : (entitlementRuntime.scenario.userWriteError ?? null),
            }),
        }),
    };
}

function funnelEventsQuery() {
    return {
        insert: async () => ({ error: entitlementRuntime.scenario.funnelEventInsertError ?? null }),
    };
}

const supabaseMock = {
    from: jest.fn((table) => {
        if (table === 'payment_events') return paymentEventsQuery();
        if (table === 'subscriptions') return subscriptionsQuery();
        if (table === 'users') return usersQuery();
        if (table === 'funnel_events') return funnelEventsQuery();
        throw new Error(`Unexpected table access: ${table}`);
    }),
};

jest.unstable_mockModule('../db-supabase.js', () => ({
    supabase: supabaseMock,
}));

jest.unstable_mockModule('../services/alerts.js', () => ({
    sendOperationalAlert: jest.fn().mockResolvedValue({ sent: false, reason: 'disabled' }),
}));

jest.unstable_mockModule('../email-service.js', () => ({
    sendEmail: jest.fn().mockResolvedValue(undefined),
    sendPauseEmail: jest.fn().mockResolvedValue(undefined),
    sendDiscountEmail: jest.fn().mockResolvedValue(undefined),
    sendOnboardingSequence: jest.fn().mockResolvedValue(undefined),
    sendUpgradeReminders: jest.fn().mockResolvedValue(undefined),
    sendChurnRecoveryEmail: jest.fn().mockResolvedValue(undefined),
    sendTrialReminderEmails: jest.fn().mockResolvedValue(undefined),
}));

const { handleStripeWebhook } = await import('../payment.js');

function computeStripeSignature(payload, secret = TEST_WEBHOOK_SECRET) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('hex');
    return `t=${timestamp},v1=${signature}`;
}

describe('Stripe webhook entitlement write failures', () => {
    beforeEach(() => {
        resetRuntime();
        supabaseMock.from.mockClear();
    });

    test('checkout.session.completed fails when user mapping is missing', async () => {
        const eventId = `evt_checkout_missing_user_${Date.now()}`;
        const payload = JSON.stringify({
            id: eventId,
            type: 'checkout.session.completed',
            data: {
                object: {
                    id: `cs_test_missing_user_${Date.now()}`,
                    mode: 'subscription',
                    customer: null,
                    subscription: null,
                    subscription_details: {
                        current_period_end: Math.floor(Date.now() / 1000) + 86400,
                    },
                    metadata: {
                        planType: 'premium',
                        billingInterval: 'month',
                        source: 'pricing_page'
                    },
                },
            },
            livemode: false,
        });

        await expect(
            handleStripeWebhook(payload, computeStripeSignature(payload))
        ).rejects.toThrow(/missing userId mapping|no userId|missing user mapping/i);

        expect(entitlementRuntime.calls.paymentEventMarkSuccess).toBe(0);
        expect(entitlementRuntime.calls.paymentEventMarkFailed).toBe(1);
    });

    test('checkout.session.completed fails when subscription upsert fails', async () => {
        const eventId = `evt_checkout_upsert_fail_${Date.now()}`;
        entitlementRuntime.scenario.subscriptionUpsertError = { message: 'subscriptions upsert failed' };

        const payload = JSON.stringify({
            id: eventId,
            type: 'checkout.session.completed',
            data: {
                object: {
                    id: `cs_test_${Date.now()}`,
                    mode: 'subscription',
                    client_reference_id: 'user_checkout_1',
                    customer: null,
                    subscription: null,
                    subscription_details: {
                        current_period_end: Math.floor(Date.now() / 1000) + 86400,
                    },
                    metadata: {
                        userId: 'user_checkout_1',
                        planType: 'premium',
                        billingInterval: 'month',
                    },
                },
            },
            livemode: false,
        });

        await expect(
            handleStripeWebhook(payload, computeStripeSignature(payload))
        ).rejects.toThrow(/upsert|subscription/i);

        expect(entitlementRuntime.calls.paymentEventMarkSuccess).toBe(0);
        expect(entitlementRuntime.calls.paymentEventMarkFailed).toBe(1);
    });

    test('customer.subscription.updated fails when user premium write fails', async () => {
        const eventId = `evt_sub_updated_user_fail_${Date.now()}`;
        entitlementRuntime.scenario.subscriptionLookup = { user_id: 'user_sub_1' };
        entitlementRuntime.scenario.userPremiumWriteError = { message: 'users is_premium write failed' };

        const payload = JSON.stringify({
            id: eventId,
            type: 'customer.subscription.updated',
            data: {
                object: {
                    id: 'sub_test_123',
                    status: 'active',
                    cancel_at_period_end: false,
                    current_period_end: Math.floor(Date.now() / 1000) + 86400,
                },
            },
            livemode: false,
        });

        await expect(
            handleStripeWebhook(payload, computeStripeSignature(payload))
        ).rejects.toThrow(/premium|user|write|subscription/i);

        expect(entitlementRuntime.calls.paymentEventMarkSuccess).toBe(0);
        expect(entitlementRuntime.calls.paymentEventMarkFailed).toBe(1);
    });
});
