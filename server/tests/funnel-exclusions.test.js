/**
 * Guard: test/internal traffic must be strippable from funnel reports via
 * MH_FUNNEL_EXCLUDED_USER_IDS so conversion metrics reflect real users, and the
 * filter must stay a no-op (default behaviour) when the list is unset.
 */
import { jest } from '@jest/globals';

const ORIGINAL = process.env.MH_FUNNEL_EXCLUDED_USER_IDS;

const {
    filterExcludedFunnelEvents,
    countExcludedFunnelEvents,
    getExcludedFunnelUserIds
} = await import('../config/funnel-exclusions.js');

afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.MH_FUNNEL_EXCLUDED_USER_IDS;
    else process.env.MH_FUNNEL_EXCLUDED_USER_IDS = ORIGINAL;
});

const events = [
    { user_id: 'tester-1', event_name: 'paywall_viewed' },
    { user_id: 'real-user', event_name: 'paywall_viewed' },
    { user_id: null, event_name: 'first_value_completed' },
    { event_name: 'checkout_session_created' }
];

describe('funnel exclusions', () => {
    test('unset list is a no-op — every event survives', () => {
        delete process.env.MH_FUNNEL_EXCLUDED_USER_IDS;
        expect(getExcludedFunnelUserIds().size).toBe(0);
        expect(filterExcludedFunnelEvents(events)).toHaveLength(events.length);
        expect(countExcludedFunnelEvents(events)).toBe(0);
    });

    test('drops only events authored by excluded users; keeps anonymous ones', () => {
        process.env.MH_FUNNEL_EXCLUDED_USER_IDS = 'tester-1, tester-2';
        const filtered = filterExcludedFunnelEvents(events);
        expect(filtered.map((event) => event.user_id)).toEqual(['real-user', null, undefined]);
        expect(countExcludedFunnelEvents(events)).toBe(1);
    });

    test('parses comma- and whitespace-separated ids', () => {
        process.env.MH_FUNNEL_EXCLUDED_USER_IDS = 'a b,c\nd';
        expect([...getExcludedFunnelUserIds()].sort()).toEqual(['a', 'b', 'c', 'd']);
    });
});
