import { jest } from '@jest/globals';
import {
    createOperationalAlertService,
    createServer5xxAlertMonitor,
    isPremiumOperationalPath,
    normalizeHttpPath,
    sanitizeAlertMetadata,
} from '../services/alerts.js';

describe('Operational alert service', () => {
    test('is a no-op unless a webhook URL is configured', async () => {
        const fetchMock = jest.fn();
        const service = createOperationalAlertService({
            env: { NODE_ENV: 'production' },
            fetchImpl: fetchMock,
            now: () => 1000,
        });

        const result = await service.send('checkout_session_failed', {
            metadata: { error: 'Stripe unavailable' },
        });

        expect(result).toEqual({ sent: false, reason: 'disabled' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    test('does not deliver during tests unless explicitly enabled', async () => {
        const fetchMock = jest.fn();
        const service = createOperationalAlertService({
            env: {
                NODE_ENV: 'test',
                OPERATIONAL_ALERT_WEBHOOK_URL: 'https://alerts.example.test/webhook',
            },
            fetchImpl: fetchMock,
            now: () => 1000,
        });

        const result = await service.send('server_5xx', {
            metadata: { path: '/api/payment/status' },
        });

        expect(result).toEqual({ sent: false, reason: 'disabled' });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    test('redacts sensitive metadata before sending', async () => {
        const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
        const service = createOperationalAlertService({
            env: {
                NODE_ENV: 'production',
                OPERATIONAL_ALERT_WEBHOOK_URL: 'https://alerts.example.test/webhook',
            },
            fetchImpl: fetchMock,
            now: () => 1000,
        });

        await service.send('checkout_session_failed', {
            severity: 'critical',
            metadata: {
                email: 'jana@example.com',
                stripeSessionId: 'cs_test_1234567890',
                error: 'Failed for jana@example.com with pi_test_abc123',
                checkoutUrl: 'https://example.test/pay?email=jana@example.com&plan=pruvodce',
                nested: {
                    token: 'abcdefghijklmnopqrstuvwxyz1234567890',
                    planId: 'pruvodce',
                },
            },
        });

        const payload = JSON.parse(fetchMock.mock.calls[0][1].body);

        expect(payload.alert.metadata.email).toBe('[redacted]');
        expect(payload.alert.metadata.stripeSessionId).toBe('[redacted]');
        expect(payload.alert.metadata.error).toContain('[redacted-email]');
        expect(payload.alert.metadata.error).toContain('[redacted-id]');
        expect(payload.alert.metadata.checkoutUrl).toContain('email=[redacted]');
        expect(payload.alert.metadata.nested.token).toBe('[redacted]');
        expect(payload.alert.metadata.nested.planId).toBe('pruvodce');
    });

    test('dedupes repeated alerts in-process', async () => {
        let timestamp = 1000;
        const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
        const service = createOperationalAlertService({
            env: {
                NODE_ENV: 'production',
                OPERATIONAL_ALERT_WEBHOOK_URL: 'https://alerts.example.test/webhook',
                OPERATIONAL_ALERT_DEDUPE_MS: '300000',
            },
            fetchImpl: fetchMock,
            now: () => timestamp,
        });

        const first = await service.send('stripe_webhook_failed', {
            dedupeKey: 'stripe_webhook_failed:invoice.paid',
            metadata: { eventType: 'invoice.paid' },
        });
        const second = await service.send('stripe_webhook_failed', {
            dedupeKey: 'stripe_webhook_failed:invoice.paid',
            metadata: { eventType: 'invoice.paid' },
        });
        timestamp += 300001;
        const third = await service.send('stripe_webhook_failed', {
            dedupeKey: 'stripe_webhook_failed:invoice.paid',
            metadata: { eventType: 'invoice.paid' },
        });

        expect(first.sent).toBe(true);
        expect(second).toEqual({ sent: false, reason: 'deduped' });
        expect(third.sent).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test('does not dedupe an alert when webhook delivery is rejected', async () => {
        const fetchMock = jest.fn()
            .mockResolvedValueOnce({ ok: false, status: 500 })
            .mockResolvedValueOnce({ ok: true, status: 200 });
        const service = createOperationalAlertService({
            env: {
                NODE_ENV: 'production',
                OPERATIONAL_ALERT_WEBHOOK_URL: 'https://alerts.example.test/webhook',
                OPERATIONAL_ALERT_DEDUPE_MS: '300000',
            },
            fetchImpl: fetchMock,
            now: () => 1000,
        });

        const first = await service.send('stripe_webhook_failed', {
            dedupeKey: 'stripe_webhook_failed:invoice.paid:rejected',
            metadata: { eventType: 'invoice.paid' },
        });
        const second = await service.send('stripe_webhook_failed', {
            dedupeKey: 'stripe_webhook_failed:invoice.paid:rejected',
            metadata: { eventType: 'invoice.paid' },
        });

        expect(first).toEqual({ sent: false, reason: 'webhook_rejected', status: 500 });
        expect(second.sent).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test('rate limits distinct alerts in-process', async () => {
        const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
        const service = createOperationalAlertService({
            env: {
                NODE_ENV: 'production',
                OPERATIONAL_ALERT_WEBHOOK_URL: 'https://alerts.example.test/webhook',
                OPERATIONAL_ALERT_RATE_LIMIT_MAX: '2',
                OPERATIONAL_ALERT_RATE_LIMIT_WINDOW_MS: '60000',
            },
            fetchImpl: fetchMock,
            now: () => 1000,
        });

        await service.send('server_5xx', { dedupeKey: 'a', metadata: { path: '/api/a' } });
        await service.send('server_5xx', { dedupeKey: 'b', metadata: { path: '/api/b' } });
        const third = await service.send('server_5xx', { dedupeKey: 'c', metadata: { path: '/api/c' } });

        expect(third).toEqual({ sent: false, reason: 'rate_limited' });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test('failed deliveries do not consume rate-limit slots', async () => {
        const fetchMock = jest.fn()
            .mockRejectedValueOnce(new Error('network down'))
            .mockResolvedValue({ ok: true, status: 200 });
        const service = createOperationalAlertService({
            env: {
                NODE_ENV: 'production',
                OPERATIONAL_ALERT_WEBHOOK_URL: 'https://alerts.example.test/webhook',
                OPERATIONAL_ALERT_RATE_LIMIT_MAX: '1',
                OPERATIONAL_ALERT_RATE_LIMIT_WINDOW_MS: '60000',
            },
            fetchImpl: fetchMock,
            now: () => 1000,
        });

        const first = await service.send('server_5xx', { dedupeKey: 'network-fail', metadata: { path: '/api/a' } });
        const second = await service.send('server_5xx', { dedupeKey: 'after-network-fail', metadata: { path: '/api/b' } });
        const third = await service.send('server_5xx', { dedupeKey: 'rate-limited-after-success', metadata: { path: '/api/c' } });

        expect(first).toEqual({ sent: false, reason: 'delivery_failed' });
        expect(second.sent).toBe(true);
        expect(third).toEqual({ sent: false, reason: 'rate_limited' });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test('sanitizer handles non-object and nested metadata defensively', () => {
        expect(sanitizeAlertMetadata(null)).toEqual({});
        expect(sanitizeAlertMetadata({
            userId: 'user-123',
            source: 'pricing',
            nested: {
                customerEmail: 'test@example.com',
                source: 'paywall',
            },
        })).toEqual({
            userId: '[redacted]',
            source: 'pricing',
            nested: {
                customerEmail: '[redacted]',
                source: 'paywall',
            },
        });
    });
});

describe('Server 5xx alert monitor', () => {
    test('normalizes paths and identifies premium/revenue endpoints', () => {
        expect(normalizeHttpPath('/api/payment/create-checkout-session?email=test@example.com')).toBe('/api/payment/create-checkout-session');
        expect(normalizeHttpPath('/api/user/readings/123456789')).toBe('/api/user/readings/:id');
        expect(isPremiumOperationalPath('/api/payment/create-checkout-session')).toBe(true);
        expect(isPremiumOperationalPath('/api/numerology/report')).toBe(true);
        expect(isPremiumOperationalPath('/api/health')).toBe(false);
    });

    test('alerts on 5xx responses and escalates premium endpoint spikes', async () => {
        let timestamp = 1000;
        const alertService = {
            send: jest.fn().mockResolvedValue({ sent: true, reason: 'sent' }),
        };
        const monitor = createServer5xxAlertMonitor({
            alertService,
            env: {
                OPERATIONAL_ALERT_PREMIUM_5XX_THRESHOLD: '2',
                OPERATIONAL_ALERT_PREMIUM_5XX_WINDOW_MS: '60000',
            },
            now: () => timestamp,
        });

        await monitor.recordResponse({
            method: 'POST',
            path: '/api/payment/create-checkout-session?email=test@example.com',
            statusCode: 500,
            userId: 'user-123',
            userAgent: 'jest',
        });
        timestamp += 1000;
        const second = await monitor.recordResponse({
            method: 'POST',
            path: '/api/numerology/report',
            statusCode: 502,
        });

        expect(second.premiumFailureCount).toBe(2);
        expect(second.spikeAlertSent).toBe(true);
        expect(alertService.send).toHaveBeenCalledTimes(3);
        expect(alertService.send.mock.calls[0][0]).toBe('server_5xx');
        expect(alertService.send.mock.calls[0][1].metadata.path).toBe('/api/payment/create-checkout-session');
        expect(alertService.send.mock.calls[2][0]).toBe('premium_endpoint_5xx_spike');
        expect(alertService.send.mock.calls[2][1].metadata.threshold).toBe(2);
    });

    test('ignores non-5xx responses', async () => {
        const alertService = {
            send: jest.fn(),
        };
        const monitor = createServer5xxAlertMonitor({ alertService });

        const result = await monitor.recordResponse({
            method: 'GET',
            path: '/api/payment/status',
            statusCode: 404,
        });

        expect(result).toEqual({ recorded: false, reason: 'not_5xx' });
        expect(alertService.send).not.toHaveBeenCalled();
    });
});
