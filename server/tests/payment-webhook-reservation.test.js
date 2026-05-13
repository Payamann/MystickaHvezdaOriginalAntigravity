import crypto from 'crypto';
import { jest } from '@jest/globals';

const TEST_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'test-webhook-secret';

const reservationRuntime = {
    scenario: {},
    calls: {
        insert: 0,
        duplicateLookup: 0,
        reclaimUpdate: 0,
        successUpdate: 0,
        failedUpdate: 0,
    },
};

function resetRuntime() {
    reservationRuntime.scenario = {};
    reservationRuntime.calls = {
        insert: 0,
        duplicateLookup: 0,
        reclaimUpdate: 0,
        successUpdate: 0,
        failedUpdate: 0,
    };
}

function createPaymentEventsQuery() {
    return {
        insert: async () => {
            reservationRuntime.calls.insert += 1;
            return { error: reservationRuntime.scenario.insertError ?? null };
        },
        select: () => ({
            eq: () => ({
                maybeSingle: async () => {
                    reservationRuntime.calls.duplicateLookup += 1;
                    return {
                        data: reservationRuntime.scenario.existingReservation ?? null,
                        error: reservationRuntime.scenario.lookupError ?? null,
                    };
                },
            }),
        }),
        update: (payload) => {
            if (payload?.status === 'processing') {
                reservationRuntime.calls.reclaimUpdate += 1;
                return {
                    eq: () => ({
                        neq: () => ({
                            select: async () => ({
                                data: reservationRuntime.scenario.reclaimRows ?? [],
                                error: reservationRuntime.scenario.reclaimError ?? null,
                            }),
                        }),
                    }),
                };
            }

            if (payload?.status === 'success') {
                reservationRuntime.calls.successUpdate += 1;
                return {
                    eq: async () => ({ error: reservationRuntime.scenario.successUpdateError ?? null }),
                };
            }

            if (payload?.status === 'failed') {
                reservationRuntime.calls.failedUpdate += 1;
                return {
                    eq: () => ({
                        eq: async () => ({ error: reservationRuntime.scenario.failedUpdateError ?? null }),
                    }),
                };
            }

            throw new Error(`Unexpected update payload status: ${String(payload?.status)}`);
        },
    };
}

const supabaseMock = {
    from: jest.fn((table) => {
        if (table !== 'payment_events') {
            throw new Error(`Unexpected table access in reservation test: ${table}`);
        }
        return createPaymentEventsQuery();
    }),
};

const sendOperationalAlertMock = jest.fn().mockResolvedValue({ sent: false, reason: 'disabled' });

jest.unstable_mockModule('../db-supabase.js', () => ({
    supabase: supabaseMock,
}));

jest.unstable_mockModule('../services/alerts.js', () => ({
    sendOperationalAlert: sendOperationalAlertMock,
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

function buildUnknownWebhookPayload(eventId) {
    return JSON.stringify({
        id: eventId,
        type: 'test.unknown.event',
        data: { object: {} },
        livemode: false,
    });
}

describe('Stripe webhook reservation duplicate decisioning', () => {
    beforeEach(() => {
        resetRuntime();
        supabaseMock.from.mockClear();
        sendOperationalAlertMock.mockClear();
    });

    test('duplicate with success status skips processing', async () => {
        const eventId = `evt_reservation_success_${Date.now()}`;
        const payload = buildUnknownWebhookPayload(eventId);
        const signature = computeStripeSignature(payload);

        reservationRuntime.scenario.insertError = { code: '23505', message: 'duplicate key' };
        reservationRuntime.scenario.existingReservation = {
            event_id: eventId,
            status: 'success',
            created_at: new Date().toISOString(),
            processed_at: new Date().toISOString(),
        };

        await expect(handleStripeWebhook(payload, signature)).resolves.toBeUndefined();
        expect(reservationRuntime.calls.insert).toBe(1);
        expect(reservationRuntime.calls.duplicateLookup).toBe(1);
        expect(reservationRuntime.calls.reclaimUpdate).toBe(0);
        expect(reservationRuntime.calls.successUpdate).toBe(0);
    });

    test('duplicate with fresh processing lock does not process yet', async () => {
        const eventId = `evt_reservation_fresh_${Date.now()}`;
        const payload = buildUnknownWebhookPayload(eventId);
        const signature = computeStripeSignature(payload);

        reservationRuntime.scenario.insertError = { code: '23505', message: 'duplicate key' };
        reservationRuntime.scenario.existingReservation = {
            event_id: eventId,
            status: 'processing',
            created_at: new Date(Date.now() - (60 * 1000)).toISOString(),
            processed_at: null,
        };

        await expect(handleStripeWebhook(payload, signature)).resolves.toBeUndefined();
        expect(reservationRuntime.calls.insert).toBe(1);
        expect(reservationRuntime.calls.duplicateLookup).toBe(1);
        expect(reservationRuntime.calls.reclaimUpdate).toBe(0);
        expect(reservationRuntime.calls.successUpdate).toBe(0);
    });

    test('duplicate with stale processing lock reclaims and processes', async () => {
        const eventId = `evt_reservation_stale_${Date.now()}`;
        const payload = buildUnknownWebhookPayload(eventId);
        const signature = computeStripeSignature(payload);

        reservationRuntime.scenario.insertError = { code: '23505', message: 'duplicate key' };
        reservationRuntime.scenario.existingReservation = {
            event_id: eventId,
            status: 'processing',
            created_at: new Date(Date.now() - (20 * 60 * 1000)).toISOString(),
            processed_at: null,
        };
        reservationRuntime.scenario.reclaimRows = [{ event_id: eventId }];

        await expect(handleStripeWebhook(payload, signature)).resolves.toBeUndefined();
        expect(reservationRuntime.calls.insert).toBe(1);
        expect(reservationRuntime.calls.duplicateLookup).toBe(1);
        expect(reservationRuntime.calls.reclaimUpdate).toBe(1);
        expect(reservationRuntime.calls.successUpdate).toBe(1);
    });

    test('duplicate with failed status reclaims immediately and processes', async () => {
        const eventId = `evt_reservation_failed_${Date.now()}`;
        const payload = buildUnknownWebhookPayload(eventId);
        const signature = computeStripeSignature(payload);

        reservationRuntime.scenario.insertError = { code: '23505', message: 'duplicate key' };
        reservationRuntime.scenario.existingReservation = {
            event_id: eventId,
            status: 'failed',
            created_at: new Date().toISOString(),
            processed_at: new Date().toISOString(),
        };
        reservationRuntime.scenario.reclaimRows = [{ event_id: eventId }];

        await expect(handleStripeWebhook(payload, signature)).resolves.toBeUndefined();
        expect(reservationRuntime.calls.insert).toBe(1);
        expect(reservationRuntime.calls.duplicateLookup).toBe(1);
        expect(reservationRuntime.calls.reclaimUpdate).toBe(1);
        expect(reservationRuntime.calls.successUpdate).toBe(1);
    });
});
