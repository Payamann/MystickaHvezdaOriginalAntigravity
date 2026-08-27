export const REQUIRED_STRIPE_WEBHOOK_EVENTS = Object.freeze([
    'checkout.session.completed',
    'checkout.session.expired',
    'invoice.paid',
    'invoice.payment_failed',
    'invoice.payment_action_required',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'customer.subscription.trial_will_end',
    'charge.refunded',
    'refund.created',
]);

function normalizeEndpointUrl(value) {
    try {
        const url = new URL(value);
        return {
            protocol: url.protocol,
            hostname: url.hostname.toLowerCase(),
            pathname: url.pathname.replace(/\/+$/, '') || '/',
        };
    } catch {
        return null;
    }
}

function getAllowedHosts(baseUrl) {
    const target = normalizeEndpointUrl(baseUrl);
    if (!target) return new Set();
    const apex = target.hostname.startsWith('www.')
        ? target.hostname.slice(4)
        : target.hostname;
    return new Set([apex, `www.${apex}`]);
}

function maskStripeId(value) {
    const text = String(value || '');
    if (text.length <= 10) return text || null;
    return `${text.slice(0, 6)}...${text.slice(-4)}`;
}

export function evaluateStripeWebhookEndpoints(endpoints, {
    baseUrl = 'https://www.mystickahvezda.cz',
    requiredEvents = REQUIRED_STRIPE_WEBHOOK_EVENTS,
} = {}) {
    const allowedHosts = getAllowedHosts(baseUrl);
    const expectedPath = '/webhook/stripe';
    const matching = (Array.isArray(endpoints) ? endpoints : [])
        .map((endpoint) => {
            const normalizedUrl = normalizeEndpointUrl(endpoint?.url);
            const enabledEvents = Array.isArray(endpoint?.enabled_events)
                ? endpoint.enabled_events
                : [];
            const receivesAllEvents = enabledEvents.includes('*');
            const missingEvents = receivesAllEvents
                ? []
                : requiredEvents.filter((eventName) => !enabledEvents.includes(eventName));
            const matchesProductionUrl = Boolean(
                normalizedUrl
                && normalizedUrl.protocol === 'https:'
                && allowedHosts.has(normalizedUrl.hostname)
                && normalizedUrl.pathname === expectedPath
            );
            const enabled = endpoint?.status === 'enabled';

            return {
                id: maskStripeId(endpoint?.id),
                url: endpoint?.url || null,
                enabled,
                enabledEvents: [...enabledEvents],
                matchesProductionUrl,
                receivesAllEvents,
                missingEvents,
                healthy: matchesProductionUrl && enabled && missingEvents.length === 0,
            };
        })
        .filter((endpoint) => endpoint.matchesProductionUrl);

    const enabledMatching = matching.filter((endpoint) => endpoint.enabled);
    const receivesAllEvents = enabledMatching.some((endpoint) => endpoint.receivesAllEvents);
    const deliveredEvents = new Set(
        enabledMatching.flatMap((endpoint) => endpoint.missingEvents.length === 0
            ? requiredEvents
            : requiredEvents.filter((eventName) => !endpoint.missingEvents.includes(eventName)))
    );
    const missingEvents = receivesAllEvents
        ? []
        : requiredEvents.filter((eventName) => !deliveredEvents.has(eventName));
    return {
        healthy: enabledMatching.length > 0 && missingEvents.length === 0,
        expectedPath,
        requiredEvents: [...requiredEvents],
        matching,
        missingEvents,
    };
}
