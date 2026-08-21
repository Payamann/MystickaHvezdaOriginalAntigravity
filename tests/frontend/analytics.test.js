import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { jest } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const analyticsSource = fs.readFileSync(path.resolve(__dirname, '../../js/analytics.js'), 'utf8');

function createStorage(initial = {}) {
    const values = new Map(Object.entries(initial));
    return {
        getItem: jest.fn((key) => values.get(key) ?? null),
        setItem: jest.fn((key, value) => values.set(key, String(value))),
        removeItem: jest.fn((key) => values.delete(key))
    };
}

function loadAnalytics({ analyticsConsent = null, search = '?utm_source=google&utm_medium=organic' } = {}) {
    const localStorage = createStorage(analyticsConsent === null
        ? {}
        : { mh_cookie_prefs: JSON.stringify({ analytics: analyticsConsent, marketing: false }) });
    const sessionStorage = createStorage();
    const windowListeners = new Map();
    const documentListeners = new Map();
    const gtag = jest.fn();
    const mixpanelTrack = jest.fn();
    const segmentTrack = jest.fn();
    const fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({ success: true, accepted: 1 })
    }));

    const addListener = (listeners) => (type, listener) => {
        const current = listeners.get(type) || [];
        current.push(listener);
        listeners.set(type, current);
    };
    const dispatch = (listeners) => (event) => {
        for (const listener of listeners.get(event.type) || []) listener(event);
    };

    const document = {
        readyState: 'complete',
        title: 'Test page',
        referrer: '',
        addEventListener: jest.fn(addListener(documentListeners))
    };
    const window = {
        localStorage,
        sessionStorage,
        location: {
            origin: 'https://www.mystickahvezda.cz',
            host: 'www.mystickahvezda.cz',
            pathname: '/test.html',
            search
        },
        addEventListener: jest.fn(addListener(windowListeners)),
        dispatchEvent: dispatch(windowListeners),
        getCSRFToken: jest.fn(async () => 'csrf-token'),
        fetch,
        gtag,
        mixpanel: { track: mixpanelTrack },
        analytics: { track: segmentTrack }
    };
    window.window = window;

    vm.runInNewContext(analyticsSource, {
        window,
        document,
        localStorage,
        sessionStorage,
        navigator: { userAgent: 'jest' },
        URL,
        URLSearchParams,
        Date,
        Math,
        Promise,
        Error,
        WeakSet,
        Set,
        console
    });

    return {
        window,
        localStorage,
        sessionStorage,
        fetch,
        gtag,
        mixpanelTrack,
        segmentTrack
    };
}

function grantAnalyticsConsent(harness) {
    harness.localStorage.setItem('mh_cookie_prefs', JSON.stringify({ analytics: true, marketing: false }));
    harness.window.dispatchEvent({
        type: 'mh_cookie_consent',
        detail: { analytics: true, marketing: false }
    });
}

describe('consent-gated analytics queue', () => {
    test('does not contact providers before consent and replays queued events after consent', async () => {
        const harness = loadAnalytics();

        expect(harness.window.MH_ANALYTICS_QUEUE).toHaveLength(1);
        expect(harness.fetch).not.toHaveBeenCalled();
        expect(harness.gtag).not.toHaveBeenCalled();
        expect(harness.mixpanelTrack).not.toHaveBeenCalled();
        expect(harness.segmentTrack).not.toHaveBeenCalled();
        expect(harness.localStorage.setItem).not.toHaveBeenCalled();

        grantAnalyticsConsent(harness);
        await harness.window.MH_ANALYTICS.flushQueuedEvents();

        expect(harness.window.MH_ANALYTICS_QUEUE).toHaveLength(0);
        expect(harness.fetch).toHaveBeenCalledTimes(1);
        expect(harness.fetch).toHaveBeenCalledWith('/api/analytics/batch', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('page_view')
        }));
        const batchPayload = JSON.parse(harness.fetch.mock.calls[0][1].body);
        expect(batchPayload.events[0].metadata).toMatchObject({
            first_source: 'google',
            first_medium: 'organic',
            last_source: 'google',
            last_medium: 'organic'
        });
        expect(harness.localStorage.setItem).toHaveBeenCalledWith(
            'mh_attribution_first_touch',
            expect.stringContaining('google')
        );
        expect(harness.sessionStorage.setItem).toHaveBeenCalledWith(
            'mh_attribution_last_touch',
            expect.stringContaining('google')
        );
        expect(harness.gtag).toHaveBeenCalledTimes(1);
        expect(harness.mixpanelTrack).toHaveBeenCalledTimes(1);
        expect(harness.segmentTrack).toHaveBeenCalledTimes(1);
    });

    test('discards pre-consent events when analytics is rejected', async () => {
        const harness = loadAnalytics();

        harness.localStorage.setItem('mh_cookie_prefs', JSON.stringify({ analytics: false, marketing: false }));
        harness.window.dispatchEvent({
            type: 'mh_cookie_consent',
            detail: { analytics: false, marketing: false }
        });
        grantAnalyticsConsent(harness);
        await harness.window.MH_ANALYTICS.flushQueuedEvents();

        expect(harness.window.MH_ANALYTICS_QUEUE).toHaveLength(0);
        expect(harness.fetch).not.toHaveBeenCalled();
        expect(harness.gtag).not.toHaveBeenCalled();
        expect(harness.localStorage.removeItem).toHaveBeenCalledWith('mh_analytics_client_id');
        expect(harness.localStorage.removeItem).toHaveBeenCalledWith('mh_attribution_first_touch');
    });

    test('emits one canonical purchase for a repeated transaction id', async () => {
        const harness = loadAnalytics({ analyticsConsent: true });
        await harness.window.MH_ANALYTICS.flushQueuedEvents();
        harness.fetch.mockClear();
        harness.gtag.mockClear();

        expect(harness.window.MH_ANALYTICS.trackPurchaseCompleted('pruvodce', 199, 'CZK', {
            transaction_id: 'checkout-session-1',
            product_name: 'Hvezdny pruvodce'
        })).toBe(true);
        expect(harness.window.MH_ANALYTICS.trackPurchaseCompleted('pruvodce', 199, 'CZK', {
            transaction_id: 'checkout-session-1',
            product_name: 'Hvezdny pruvodce'
        })).toBe(false);

        await harness.window.MH_ANALYTICS.flushQueuedEvents();

        expect(harness.fetch).toHaveBeenCalledTimes(1);
        const request = harness.fetch.mock.calls[0][1];
        const payload = JSON.parse(request.body);
        expect(payload.events).toHaveLength(1);
        expect(payload.events[0]).toMatchObject({
            eventName: 'purchase',
            metadata: expect.objectContaining({ transaction_id: 'checkout-session-1' })
        });
        expect(request.body).not.toContain('purchase_completed');
        expect(harness.gtag).toHaveBeenCalledTimes(1);
        expect(harness.gtag).toHaveBeenCalledWith('event', 'purchase', expect.any(Object));
    });

    test('retains the full batch when the server only accepts part of it', async () => {
        const harness = loadAnalytics();
        harness.window.MH_ANALYTICS.trackEvent('cta_clicked', { location: 'test' });
        harness.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, accepted: 1 })
        });

        grantAnalyticsConsent(harness);
        await harness.window.MH_ANALYTICS.flushQueuedEvents();

        expect(harness.window.MH_ANALYTICS_QUEUE).toHaveLength(2);
        expect(harness.gtag).toHaveBeenCalledTimes(2);

        harness.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, accepted: 2 })
        });
        await harness.window.MH_ANALYTICS.flushQueuedEvents();

        expect(harness.window.MH_ANALYTICS_QUEUE).toHaveLength(0);
        expect(harness.gtag).toHaveBeenCalledTimes(2);
    });
});
