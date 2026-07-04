import {
    buildDailyPushPayload,
    filterDuePushSubscriptions,
    getDailyPushDateKey,
    isPermanentPushFailure
} from '../jobs/daily-push.js';

describe('daily push notification job', () => {
    test('uses Prague calendar day for idempotency', () => {
        expect(getDailyPushDateKey(new Date('2026-07-04T06:30:00Z'))).toBe('2026-07-04');
        expect(getDailyPushDateKey(new Date('2026-07-03T22:30:00Z'))).toBe('2026-07-04');
    });

    test('filters out subscriptions already notified today', () => {
        const now = new Date('2026-07-04T06:05:00Z');
        const due = filterDuePushSubscriptions([
            { id: 'never', last_notified_at: null },
            { id: 'yesterday', last_notified_at: '2026-07-03T06:00:00Z' },
            { id: 'today', last_notified_at: '2026-07-04T06:00:00Z' },
            { id: 'invalid-date', last_notified_at: 'not-a-date' }
        ], now);

        expect(due.map(item => item.id)).toEqual(['never', 'yesterday', 'invalid-date']);
    });

    test('builds a payload matching the service worker contract', () => {
        const payload = buildDailyPushPayload(new Date('2026-07-04T06:00:00Z'));

        expect(payload.title).toContain('horoskop');
        expect(payload.body.length).toBeGreaterThan(10);
        expect(payload.url).toContain('/horoskopy.html');
        expect(payload.url).toContain('utm_source=push');
        expect(payload.icon).toBe('/img/icon-192.webp');
    });

    test('classifies permanent push failures for subscription cleanup', () => {
        expect(isPermanentPushFailure({ statusCode: 410 })).toBe(true);
        expect(isPermanentPushFailure({ statusCode: 404 })).toBe(true);
        expect(isPermanentPushFailure({ statusCode: 429 })).toBe(false);
        expect(isPermanentPushFailure({ status: 410 })).toBe(true);
        expect(isPermanentPushFailure(new Error('network'))).toBe(false);
    });
});
