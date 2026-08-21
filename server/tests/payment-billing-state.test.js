import { jest } from '@jest/globals';
import {
    buildBillingPortalSessionParams,
    isStaleStripeSubscriptionEvent,
    pauseSubscriptionCollection,
    resumeSubscriptionCollection
} from '../payment.js';

function createDb({ subscriptionError = null, userError = null, events = [] } = {}) {
    return {
        from(table) {
            return {
                update(payload) {
                    events.push({ type: `db:${table}`, payload });
                    return {
                        eq: async () => ({
                            error: table === 'subscriptions' ? subscriptionError : userError
                        })
                    };
                }
            };
        }
    };
}

describe('billing state transitions', () => {
    test('does not create a local pause when Stripe rejects the pause', async () => {
        const events = [];
        const stripeClient = {
            subscriptions: {
                update: jest.fn(async () => {
                    events.push({ type: 'stripe' });
                    throw new Error('Stripe pause failed');
                })
            }
        };

        await expect(pauseSubscriptionCollection({
            db: createDb({ events }),
            stripeClient,
            userId: 'user_stripe_failure',
            subscription: { stripe_subscription_id: 'sub_stripe_failure' },
            pauseDays: 30
        })).rejects.toThrow('Stripe pause failed');
        expect(events.map(event => event.type)).toEqual(['stripe']);
    });

    test('pause is Stripe-first, uses a free void pause, and stops after a local DB failure', async () => {
        const events = [];
        const stripeClient = {
            subscriptions: {
                update: jest.fn(async (_id, payload) => {
                    events.push({ type: 'stripe', payload });
                    return { status: 'active', pause_collection: payload.pause_collection };
                })
            }
        };
        const db = createDb({
            subscriptionError: { message: 'local subscription update failed' },
            events
        });

        await expect(pauseSubscriptionCollection({
            db,
            stripeClient,
            userId: 'user_pause',
            subscription: { stripe_subscription_id: 'sub_pause' },
            pauseDays: 30,
            now: new Date('2026-08-14T00:00:00.000Z')
        })).rejects.toThrow('local subscription update failed');

        expect(events.map(event => event.type)).toEqual(['stripe', 'db:subscriptions']);
        expect(stripeClient.subscriptions.update).toHaveBeenCalledWith('sub_pause', {
            pause_collection: {
                behavior: 'void',
                resumes_at: Math.floor(Date.parse('2026-09-13T00:00:00.000Z') / 1000)
            }
        });
    });

    test('pause rejects more than 90 days before touching Stripe', async () => {
        const stripeClient = { subscriptions: { update: jest.fn() } };

        await expect(pauseSubscriptionCollection({
            db: createDb(),
            stripeClient,
            userId: 'user_pause_limit',
            subscription: { stripe_subscription_id: 'sub_pause_limit' },
            pauseDays: 91
        })).rejects.toThrow(/between 1 and 90/);
        expect(stripeClient.subscriptions.update).not.toHaveBeenCalled();
    });

    test('resume unsets pause_collection and mirrors the returned active state locally', async () => {
        const events = [];
        const stripeClient = {
            subscriptions: {
                update: jest.fn(async (_id, payload) => {
                    events.push({ type: 'stripe', payload });
                    return { status: 'active', pause_collection: null };
                })
            }
        };
        const db = createDb({ events });

        await expect(resumeSubscriptionCollection({
            db,
            stripeClient,
            userId: 'user_resume',
            subscription: { stripe_subscription_id: 'sub_resume' }
        })).resolves.toEqual({ status: 'active' });

        expect(stripeClient.subscriptions.update).toHaveBeenCalledWith('sub_resume', {
            pause_collection: ''
        });
        expect(events.map(event => event.type)).toEqual(['stripe', 'db:subscriptions', 'db:users']);
        expect(events[1].payload).toEqual({ status: 'active', pause_until: null });
        expect(events[2].payload).toEqual({ is_premium: true });
    });

    test('identifies a customer-matched webhook for an older subscription as stale', () => {
        expect(isStaleStripeSubscriptionEvent({
            matchedBy: 'stripe_customer_id',
            currentStatus: 'active',
            currentStripeSubscriptionId: 'sub_current',
            incomingStripeSubscriptionId: 'sub_old'
        })).toBe(true);
        expect(isStaleStripeSubscriptionEvent({
            matchedBy: 'stripe_subscription_id',
            currentStatus: 'active',
            currentStripeSubscriptionId: 'sub_current',
            incomingStripeSubscriptionId: 'sub_current'
        })).toBe(false);
        expect(isStaleStripeSubscriptionEvent({
            matchedBy: 'stripe_customer_id',
            currentStatus: 'cancelled',
            currentStripeSubscriptionId: 'sub_cancelled',
            incomingStripeSubscriptionId: 'sub_new'
        })).toBe(false);
    });

    test('builds the Stripe payment-method-update portal deep link', () => {
        expect(buildBillingPortalSessionParams({
            customerId: 'cus_recovery',
            returnUrl: 'https://mystickahvezda.cz/profil.html',
            flow: 'payment_method_update'
        })).toEqual({
            customer: 'cus_recovery',
            return_url: 'https://mystickahvezda.cz/profil.html',
            flow_data: {
                type: 'payment_method_update',
                after_completion: {
                    type: 'redirect',
                    redirect: { return_url: 'https://mystickahvezda.cz/profil.html' }
                }
            }
        });
    });
});
