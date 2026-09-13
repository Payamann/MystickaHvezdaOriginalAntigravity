const RELATIONSHIP_TAROT = 'relationship_tarot';

const EVENT_METRICS = Object.freeze({
    one_time_offer_viewed: 'offerViewed',
    one_time_product_viewed: 'productViewed',
    one_time_form_started: 'formStarted',
    one_time_form_submitted: 'formSubmitted',
    checkout_session_created: 'checkoutCreated'
});

const FLOW_METRIC_KEYS = Object.freeze([
    'offerViewed',
    'entryCtaClicked',
    'productViewed',
    'orderCtaClicked',
    'formStarted',
    'formSubmitted',
    'checkoutCreated'
]);

const CHECKOUT_FAILURE_EVENTS = new Set([
    'checkout_validation_failed',
    'checkout_session_failed',
    'one_time_form_validation_failed',
    'one_time_checkout_failed'
]);

const SOURCE_METRIC_KEYS = Object.freeze([
    'offerViewed',
    'ctaClicked',
    'entryCtaClicked',
    'orderCtaClicked',
    'unclassifiedCtaClicked',
    'productViewed',
    'formStarted',
    'formSubmitted',
    'checkoutCreated',
    'paidOrders',
    'deliveredOrders'
]);

function emptyMetrics() {
    return {
        offerViewed: 0,
        ctaClicked: 0,
        entryCtaClicked: 0,
        orderCtaClicked: 0,
        unclassifiedCtaClicked: 0,
        productViewed: 0,
        formStarted: 0,
        formSubmitted: 0,
        checkoutCreated: 0,
        checkoutFailed: 0,
        paidOrders: 0,
        paidOrdersWithFlow: 0,
        unmatchedPaidOrders: 0,
        deliveredOrders: 0,
        pendingDeliveryOrders: 0,
        fulfilledWithoutReceipt: 0,
        grossCzk: 0
    };
}

function cleanSource(value) {
    return typeof value === 'string' && value.trim() ? value.trim().slice(0, 80) : 'unknown';
}

function cleanFlowId(value) {
    return typeof value === 'string' && /^[a-z0-9_-]{16,80}$/i.test(value) ? value : null;
}

function eventMetadata(event) {
    return event?.metadata && typeof event.metadata === 'object' && !Array.isArray(event.metadata) ? event.metadata : {};
}

function flowIdForEvent(event) {
    const metadata = eventMetadata(event);
    return cleanFlowId(metadata.flow_id || metadata.flowId);
}

function isRelationshipRow(row) {
    return row?.product_type === RELATIONSHIP_TAROT && row?.product_id === RELATIONSHIP_TAROT;
}

function isKnownPaidCzkPurchase(purchase) {
    return isRelationshipRow(purchase)
        && typeof purchase.stripe_session_id === 'string'
        && purchase.stripe_session_id.startsWith('cs_live_')
        && purchase.status === 'paid'
        && String(purchase.currency || '').toLowerCase() === 'czk'
        && Number.isSafeInteger(purchase.amount_total)
        && purchase.amount_total > 0;
}

function sourceForPurchase(purchase, order) {
    return cleanSource(purchase?.source || purchase?.metadata?.source || order?.source || order?.payload?.source);
}

function sourceRow(source) {
    return {
        source,
        offerViewed: 0,
        ctaClicked: 0,
        entryCtaClicked: 0,
        orderCtaClicked: 0,
        unclassifiedCtaClicked: 0,
        productViewed: 0,
        formStarted: 0,
        formSubmitted: 0,
        checkoutCreated: 0,
        paidOrders: 0,
        deliveredOrders: 0,
        flowSets: Object.fromEntries(FLOW_METRIC_KEYS.map(key => [key, new Set()]))
    };
}

export function buildRelationshipTarotReport({
    events = [],
    purchases = [],
    orders = [],
    reconciliationPurchases = []
} = {}, {
    since,
    until,
    days,
    partial = false
} = {}) {
    const metrics = emptyMetrics();
    const flowSets = Object.fromEntries(FLOW_METRIC_KEYS.map(key => [key, new Set()]));
    const sources = new Map();
    const getSource = value => {
        const source = cleanSource(value);
        if (!sources.has(source)) sources.set(source, sourceRow(source));
        return sources.get(source);
    };

    for (const event of events) {
        if (event?.feature !== RELATIONSHIP_TAROT) continue;
        const metadata = eventMetadata(event);
        const flowId = flowIdForEvent(event);
        let metric = EVENT_METRICS[event.event_name];
        const isCtaClick = event.event_name === 'one_time_product_cta_clicked';
        if (isCtaClick) {
            metrics.ctaClicked += 1;
            if (metadata.funnel_step === 'entry_offer') metric = 'entryCtaClicked';
            else if (metadata.funnel_step === 'product_to_form') metric = 'orderCtaClicked';
            else metric = 'unclassifiedCtaClicked';
        }
        if (metric) {
            const source = getSource(event.source);
            if (isCtaClick) source.ctaClicked += 1;
            metrics[metric] += 1;
            source[metric] += 1;
            if (flowId && FLOW_METRIC_KEYS.includes(metric)) {
                flowSets[metric].add(flowId);
                source.flowSets[metric].add(flowId);
            }
        } else if (CHECKOUT_FAILURE_EVENTS.has(event?.event_name)) {
            metrics.checkoutFailed += 1;
        }
    }

    const ordersBySession = new Map();
    for (const order of orders) {
        if (!isRelationshipRow(order) || typeof order.stripe_session_id !== 'string') continue;
        if (!ordersBySession.has(order.stripe_session_id)) {
            ordersBySession.set(order.stripe_session_id, order);
        }
    }

    const countedSessions = new Set();
    for (const purchase of purchases) {
        if (!isKnownPaidCzkPurchase(purchase)) continue;
        const sessionId = purchase.stripe_session_id;
        const order = ordersBySession.get(sessionId);
        if (countedSessions.has(sessionId)) continue;
        countedSessions.add(sessionId);

        const source = getSource(sourceForPurchase(purchase, order));
        metrics.paidOrders += 1;
        if (cleanFlowId(purchase.flow_id || purchase.flowId || purchase.metadata?.flowId)) metrics.paidOrdersWithFlow += 1;
        metrics.grossCzk += purchase.amount_total / 100;
        source.paidOrders += 1;

        if (!order) {
            metrics.unmatchedPaidOrders += 1;
        } else if (order.status === 'fulfilled') {
            metrics.deliveredOrders += 1;
            source.deliveredOrders += 1;
        } else {
            metrics.pendingDeliveryOrders += 1;
        }
    }

    const receiptSessions = new Set([
        ...purchases,
        ...reconciliationPurchases
    ].filter(isKnownPaidCzkPurchase).map(row => row.stripe_session_id));
    for (const order of ordersBySession.values()) {
        if (order.status !== 'fulfilled') continue;
        const sessionId = order.stripe_session_id;
        if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_live_')) continue;
        if (!receiptSessions.has(sessionId)) metrics.fulfilledWithoutReceipt += 1;
    }

    return {
        since,
        until,
        days,
        partial: Boolean(partial),
        metrics,
        uniqueFlows: Object.fromEntries(FLOW_METRIC_KEYS.map(key => [key, flowSets[key].size])),
        sources: [...sources.values()]
            .sort((left, right) => right.paidOrders - left.paidOrders
                || right.offerViewed - left.offerViewed
                || left.source.localeCompare(right.source))
            .map(row => Object.fromEntries([
                ['source', row.source],
                ...SOURCE_METRIC_KEYS.map(key => [key, row[key]]),
                ['uniqueFlows', Object.fromEntries(FLOW_METRIC_KEYS.map(key => [key, row.flowSets[key].size]))]
            ]))
    };
}

export default buildRelationshipTarotReport;
