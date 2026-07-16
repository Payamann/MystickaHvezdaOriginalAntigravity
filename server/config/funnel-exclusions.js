/**
 * Test/internal accounts whose funnel_events must not pollute conversion
 * reports. Populate MH_FUNNEL_EXCLUDED_USER_IDS with a comma- or
 * whitespace-separated list of Supabase user IDs (server/.env locally,
 * Railway env in production). When unset the helpers are a no-op, so the
 * default behaviour is unchanged.
 *
 * Parsing is lazy (read from the environment on each call) so the list stays
 * correct regardless of dotenv load ordering and can be changed without a
 * rebuild.
 */

function parseExcludedUserIds(raw) {
    if (!raw) return new Set();
    return new Set(
        String(raw)
            .split(/[\s,]+/)
            .map((value) => value.trim())
            .filter(Boolean)
    );
}

export function getExcludedFunnelUserIds() {
    return parseExcludedUserIds(process.env.MH_FUNNEL_EXCLUDED_USER_IDS);
}

/**
 * Drop events authored by excluded (test/internal) users. Anonymous events
 * (no user_id) are always kept — only known internal accounts are removed.
 */
export function filterExcludedFunnelEvents(events = []) {
    const excluded = getExcludedFunnelUserIds();
    if (excluded.size === 0) return events;
    return events.filter((event) => !event?.user_id || !excluded.has(event.user_id));
}

/** How many events the exclusion list would remove — for transparency logging. */
export function countExcludedFunnelEvents(events = []) {
    const excluded = getExcludedFunnelUserIds();
    if (excluded.size === 0) return 0;
    return events.reduce((total, event) => (
        event?.user_id && excluded.has(event.user_id) ? total + 1 : total
    ), 0);
}
