import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { jest } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const analyticsSource = fs.readFileSync(path.resolve(__dirname, '../../js/analytics.js'), 'utf8');
const analyticsInitSource = fs.readFileSync(path.resolve(__dirname, '../../js/analytics-init.js'), 'utf8');

function createStorage(initial = {}) {
    const values = new Map(Object.entries(initial));
    return {
        getItem: jest.fn((key) => values.get(key) ?? null),
        setItem: jest.fn((key, value) => values.set(key, String(value))),
        removeItem: jest.fn((key) => values.delete(key))
    };
}

function loadAnalytics({ analyticsConsent = null, search = '?utm_source=google&utm_medium=organic', googleInit = false } = {}) {
    const localStorage = createStorage(analyticsConsent === null
        ? {}
        : { mh_cookie_prefs: JSON.stringify({ analytics: analyticsConsent, marketing: false }) });
    const sessionStorage = createStorage();
    const windowListeners = new Map();
    const documentListeners = new Map();
    const gtag = jest.fn();
    const mixpanelTrack = jest.fn();
    const segmentTrack = jest.fn();
    const idleCallbacks = [];
    const appendScript = jest.fn();
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
        querySelector: () => null,
        createElement: () => ({}),
        head: { appendChild: appendScript },
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
    window.requestIdleCallback = callback => idleCallbacks.push(callback);
    window.window = window;

    const context = vm.createContext({
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
    if (googleInit) vm.runInContext(analyticsInitSource, context);
    vm.runInContext(analyticsSource, context);

    return {
        window,
        localStorage,
        sessionStorage,
        fetch,
        gtag,
        mixpanelTrack,
        segmentTrack,
        idleCallbacks,
        appendScript
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
    test('separates internal interaction source from GA attribution without changing backend or other providers', async () => {
        const harness = loadAnalytics({ analyticsConsent: true });
        await harness.window.MH_ANALYTICS.flushQueuedEvents();
        harness.fetch.mockClear();
        harness.gtag.mockClear();
        harness.mixpanelTrack.mockClear();
        harness.segmentTrack.mockClear();

        harness.window.MH_ANALYTICS.trackEvent('reading_complete', {
            source: 'tarot_yes_no_result', feature: 'tarot'
        });
        await harness.window.MH_ANALYTICS.flushQueuedEvents();

        const gaPayload = harness.gtag.mock.calls[0][2];
        expect(gaPayload).not.toHaveProperty('source');
        expect(gaPayload).toMatchObject({
            interaction_source: 'tarot_yes_no_result',
            first_source: 'google', first_medium: 'organic'
        });
        expect(harness.mixpanelTrack).toHaveBeenCalledWith('reading_complete', expect.objectContaining({ source: 'tarot_yes_no_result' }));
        expect(harness.segmentTrack).toHaveBeenCalledWith('reading_complete', expect.objectContaining({ source: 'tarot_yes_no_result' }));
        const batch = JSON.parse(harness.fetch.mock.calls[0][1].body);
        expect(batch.events[0].metadata).toMatchObject({ source: 'tarot_yes_no_result', first_source: 'google' });
        expect(batch.events[0].metadata).not.toHaveProperty('interaction_source');
    });

    test('replayed pre-consent internal sources are safe for GA and do not override an explicit interaction source', async () => {
        const harness = loadAnalytics({ search: '?source=homepage_quick_decision' });
        harness.window.MH_ANALYTICS.trackEvent('cta_clicked', {
            source: 'tarot_yes_no_card_pick', interaction_source: 'explicit_context'
        });
        expect(harness.gtag).not.toHaveBeenCalled();
        harness.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, accepted: 2 }) });
        grantAnalyticsConsent(harness);
        await harness.window.MH_ANALYTICS.flushQueuedEvents();
        const [, , payload] = harness.gtag.mock.calls.find(call => call[1] === 'cta_clicked');
        expect(payload).not.toHaveProperty('source');
        expect(payload.interaction_source).toBe('explicit_context');
        expect(harness.window.MH_ANALYTICS_QUEUE).toHaveLength(0);
    });

    test('GA does not invent interaction source for events without one', async () => {
        const harness = loadAnalytics({ analyticsConsent: true });
        await harness.window.MH_ANALYTICS.flushQueuedEvents();
        const payload = harness.gtag.mock.calls[0][2];
        expect(payload).not.toHaveProperty('source');
        expect(payload).not.toHaveProperty('interaction_source');
    });

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
            verified: true,
            transaction_id: 'checkout-session-1',
            product_name: 'Hvezdny pruvodce'
        })).toBe(true);
        expect(harness.window.MH_ANALYTICS.trackPurchaseCompleted('pruvodce', 199, 'CZK', {
            verified: true,
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

    test('does not manufacture purchases from URL context, zero amounts or missing IDs', async () => {
        const harness = loadAnalytics();
        for (const context of [{ transaction_id: 'fake' }, { verified: true }, {}]) {
            expect(harness.window.MH_ANALYTICS.trackPurchaseCompleted('pruvodce', 199, 'CZK', context)).toBe(false);
        }
        expect(harness.window.MH_ANALYTICS.trackPurchaseCompleted('pruvodce', 0, 'CZK', { verified: true, transaction_id: 'trial' })).toBe(false);
        expect(harness.window.MH_ANALYTICS_QUEUE.filter(event => event.name === 'purchase')).toHaveLength(0);
    });

    test('buffers one consented verified purchase in the init stub before the delayed Google library loads', async () => {
        const harness = loadAnalytics({ googleInit: true });
        const purchaseCommands = () => harness.window.dataLayer.filter(command => command[0] === 'event' && command[1] === 'purchase');
        expect(typeof harness.window.gtag).toBe('function');
        const purchase = { verified: true, transaction_id: 'checkout-delayed-ga', source: 'profile_verified_payment' };
        expect(harness.window.MH_ANALYTICS.trackPurchaseCompleted('pruvodce', 199, 'CZK', purchase)).toBe(true);
        await harness.window.MH_ANALYTICS.flushQueuedEvents();
        expect(purchaseCommands()).toHaveLength(0);
        expect(harness.fetch).not.toHaveBeenCalled();
        expect(harness.mixpanelTrack).not.toHaveBeenCalled();
        expect(harness.segmentTrack).not.toHaveBeenCalled();
        expect(harness.appendScript).not.toHaveBeenCalled();
        expect(harness.idleCallbacks).toHaveLength(0);

        harness.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, accepted: 2 }) });
        grantAnalyticsConsent(harness);
        await harness.window.MH_ANALYTICS.flushQueuedEvents();
        expect(harness.fetch).toHaveBeenCalledTimes(1);
        const batch = JSON.parse(harness.fetch.mock.calls[0][1].body);
        expect(batch.events.filter(event => event.eventName === 'purchase')).toEqual([expect.objectContaining({
            eventName: 'purchase',
            metadata: expect.objectContaining({ transaction_id: 'checkout-delayed-ga' })
        })]);
        expect(harness.window.MH_ANALYTICS_QUEUE).toHaveLength(0);
        expect(harness.appendScript).not.toHaveBeenCalled();
        expect(purchaseCommands()).toHaveLength(1);
        expect(purchaseCommands()[0][2]).toMatchObject({
            transaction_id: 'checkout-delayed-ga', value: 199, currency: 'CZK',
            interaction_source: 'profile_verified_payment'
        });

        // Run only the local loader callback; no Google script is fetched or executed.
        expect(harness.idleCallbacks).toHaveLength(1);
        harness.idleCallbacks[0]();
        expect(harness.appendScript).toHaveBeenCalledWith(expect.objectContaining({
            src: expect.stringContaining('https://www.googletagmanager.com/gtag/js?id=')
        }));
        await harness.window.MH_ANALYTICS.flushQueuedEvents();
        await harness.window.MH_ANALYTICS.flushQueuedEvents();
        expect(harness.window.MH_ANALYTICS.trackPurchaseCompleted('pruvodce', 199, 'CZK', purchase)).toBe(false);
        expect(purchaseCommands()).toHaveLength(1);
        expect(harness.fetch).toHaveBeenCalledTimes(1);
        expect(harness.mixpanelTrack.mock.calls.filter(call => call[0] === 'purchase')).toHaveLength(1);
        expect(harness.segmentTrack.mock.calls.filter(call => call[0] === 'purchase')).toHaveLength(1);
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
