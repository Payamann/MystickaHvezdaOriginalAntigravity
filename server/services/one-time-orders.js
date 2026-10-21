import { createHash, randomUUID } from 'node:crypto';
import { supabase } from '../db-supabase.js';

const VALID_PRODUCT_TYPES = new Set(['rocni_horoskop', 'personal_map', 'relationship_tarot']);
const SAFE_METADATA_KEYS = new Set([
    'productType',
    'productId',
    'productYear',
    'source',
    'price',
    'currency',
    'orderId',
    'flowId'
]);

function cleanString(value, maxLength) {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLength);
}

function normalizePayload(payload = {}) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(payload)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [
                cleanString(key, 80),
                typeof value === 'string' ? cleanString(value, 1000) : value
            ])
            .filter(([key]) => key)
    );
}

export function sanitizeOneTimePurchaseMetadata(metadata = {}) {
    if (!metadata || typeof metadata !== 'object') return {};

    return Object.fromEntries(
        Object.entries(metadata)
            .filter(([key]) => SAFE_METADATA_KEYS.has(key))
            .map(([key, value]) => [key, typeof value === 'string' ? cleanString(value, 200) : value])
    );
}

export async function createOneTimeOrderInput({
    id,
    productType,
    productId,
    customerEmail,
    customerName,
    payload
}) {
    if (!VALID_PRODUCT_TYPES.has(productType)) {
        throw new Error('Invalid one-time product type.');
    }

    const orderId = cleanString(id, 80) || randomUUID();
    const record = {
        id: orderId,
        product_type: productType,
        product_id: cleanString(productId, 120),
        customer_email: cleanString(customerEmail, 254).toLowerCase(),
        customer_name: cleanString(customerName, 120),
        payload: {
            ...normalizePayload(payload),
            ...(productType === 'personal_map' ? { personalMapFulfillment: { version: 1, state: 'pending' } } : {})
        },
        status: 'checkout_created',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('one_time_order_inputs')
        .insert(record)
        .select('id')
        .single();

    if (error) throw error;
    return data || { id: orderId };
}

function stableOrderIdForFlow(productType, productId, flowId) {
    const hex = createHash('sha256')
        .update(`one-time-order:${productType}:${productId}:${flowId}`)
        .digest('hex')
        .slice(0, 32)
        .split('');
    hex[12] = '5';
    hex[16] = '89ab'[Number.parseInt(hex[16], 16) & 0x3];
    const value = hex.join('');
    return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function assertMatchingFlowOrder(order, { productType, productId, customerEmail, customerName, flowId, requestHash }) {
    const matches = order
        && order.product_type === productType
        && order.product_id === cleanString(productId, 120)
        && order.customer_email === cleanString(customerEmail, 254).toLowerCase()
        && order.customer_name === cleanString(customerName, 120)
        && order.payload?.flowId === flowId
        && order.payload?.checkoutInputHash === requestHash;

    if (!matches) {
        throw Object.assign(new Error('Checkout flow was already used with different order details.'), {
            code: 'PERSONAL_MAP_FLOW_CONFLICT'
        });
    }

    return order;
}

async function findOneTimeOrderByFlow(productType, productId, flowId, conflictCode) {
    const { data, error } = await supabase
        .from('one_time_order_inputs')
        .select('id, product_type, product_id, customer_email, customer_name, payload, status, stripe_session_id, fulfilled_at, updated_at, email_id, email_sent_at')
        .eq('product_type', productType)
        .eq('product_id', productId)
        .eq('payload->>flowId', flowId)
        .limit(2);

    if (error) throw error;
    if (data?.length > 1) {
        throw Object.assign(new Error('One-time checkout flow has multiple legacy orders and cannot be resumed safely.'), {
            code: conflictCode
        });
    }
    return data?.[0] || null;
}

/**
 * Reuses one private order row for retries of the same personal-map checkout.
 * The stable row ID also gives Stripe a stable idempotency key, including
 * when the first HTTP response was lost after Stripe created its session.
 */
export async function createIdempotentPersonalMapOrderInput({
    flowId,
    requestHash,
    productType,
    productId,
    customerEmail,
    customerName,
    payload
}) {
    const cleanFlowId = cleanString(flowId, 100);
    const cleanRequestHash = cleanString(requestHash, 64).toLowerCase();
    if (productType !== 'personal_map'
        || !cleanString(productId, 120)
        || !/^[a-zA-Z0-9_-]{12,100}$/.test(cleanFlowId)
        || !/^[a-f0-9]{64}$/.test(cleanRequestHash)) {
        throw new Error('Invalid personal-map checkout idempotency data.');
    }

    const input = { productType, productId, customerEmail, customerName, flowId: cleanFlowId, requestHash: cleanRequestHash };
    const id = stableOrderIdForFlow(productType, cleanString(productId, 120), cleanFlowId);
    const existing = await getOneTimeOrderInput(id);
    if (existing) return assertMatchingFlowOrder(existing, input);

    // Older deployments may have random order IDs but the same client flow ID.
    const legacyOrder = await findOneTimeOrderByFlow(productType, cleanString(productId, 120), cleanFlowId, 'PERSONAL_MAP_FLOW_CONFLICT');
    if (legacyOrder) return assertMatchingFlowOrder(legacyOrder, input);

    try {
        const inserted = await createOneTimeOrderInput({
            id,
            productType,
            productId,
            customerEmail,
            customerName,
            payload: {
                ...payload,
                flowId: cleanFlowId,
                checkoutInputHash: cleanRequestHash
            }
        });
        const order = await getOneTimeOrderInput(inserted.id);
        if (!order) throw new Error('Could not read back the created one-time order.');
        return assertMatchingFlowOrder(order, input);
    } catch (error) {
        if (error?.code !== '23505') throw error;
        const racedOrder = await getOneTimeOrderInput(id);
        if (!racedOrder) throw error;
        return assertMatchingFlowOrder(racedOrder, input);
    }
}

function assertMatchingRelationshipTarotFlowOrder(order, { customerEmail, flowId, productId, requestHash }) {
    const matches = order
        && order.product_type === 'relationship_tarot'
        && order.product_id === cleanString(productId, 120)
        && order.customer_email === cleanString(customerEmail, 254).toLowerCase()
        && order.payload?.flowId === flowId
        && order.payload?.checkoutInputHash === requestHash;

    if (!matches) {
        throw Object.assign(new Error('Relationship tarot checkout flow was already used with different order details.'), {
            code: 'RELATIONSHIP_TAROT_FLOW_CONFLICT'
        });
    }

    return order;
}

/**
 * Reuses one private relationship-reading order for retries of the same flow.
 * The stable row ID also provides a stable Stripe idempotency key after a lost
 * response, while the input hash prevents one flow from being reused for new
 * customer details.
 */
export async function createIdempotentRelationshipTarotOrderInput({
    flowId,
    requestHash,
    productType,
    productId,
    customerEmail,
    customerName,
    payload
}) {
    const cleanFlowId = cleanString(flowId, 100);
    const cleanRequestHash = cleanString(requestHash, 64).toLowerCase();
    if (productType !== 'relationship_tarot'
        || cleanString(productId, 120) !== 'relationship_tarot'
        || !/^[a-zA-Z0-9_-]{16,80}$/.test(cleanFlowId)
        || !/^[a-f0-9]{64}$/.test(cleanRequestHash)) {
        throw new Error('Invalid relationship-tarot checkout idempotency data.');
    }

    const input = { productId, customerEmail, flowId: cleanFlowId, requestHash: cleanRequestHash };
    const id = stableOrderIdForFlow(productType, cleanString(productId, 120), cleanFlowId);
    const existing = await getOneTimeOrderInput(id);
    if (existing) return assertMatchingRelationshipTarotFlowOrder(existing, input);

    // Older deployments used random order IDs and only stored flowId in the
    // JSON payload. Find those in-flight attempts before creating a new row.
    const legacyOrder = await findOneTimeOrderByFlow(productType, cleanString(productId, 120), cleanFlowId, 'RELATIONSHIP_TAROT_FLOW_CONFLICT');
    if (legacyOrder) return assertMatchingRelationshipTarotFlowOrder(legacyOrder, input);

    try {
        const inserted = await createOneTimeOrderInput({
            id,
            productType,
            productId,
            customerEmail,
            customerName,
            payload: {
                ...payload,
                flowId: cleanFlowId,
                checkoutInputHash: cleanRequestHash
            }
        });
        const order = await getOneTimeOrderInput(inserted.id);
        if (!order) throw new Error('Could not read back the created relationship-tarot order.');
        return assertMatchingRelationshipTarotFlowOrder(order, input);
    } catch (error) {
        if (error?.code !== '23505') throw error;
        const racedOrder = await getOneTimeOrderInput(id);
        if (!racedOrder) throw error;
        return assertMatchingRelationshipTarotFlowOrder(racedOrder, input);
    }
}

export async function attachStripeSessionToOrderInput(orderId, stripeSessionId) {
    if (!orderId || !stripeSessionId) return false;

    const { error } = await supabase
        .from('one_time_order_inputs')
        .update({
            stripe_session_id: stripeSessionId,
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

    if (error) {
        console.warn('[ONE_TIME_ORDER] Could not attach Stripe session:', error.message);
        return false;
    }

    return true;
}

export async function getOneTimeOrderInput(orderId) {
    const cleanOrderId = cleanString(orderId, 80);
    if (!cleanOrderId) return null;

    const { data, error } = await supabase
        .from('one_time_order_inputs')
        .select('id, product_type, product_id, customer_email, customer_name, payload, status, stripe_session_id, fulfilled_at, updated_at, email_id, email_sent_at')
        .eq('id', cleanOrderId)
        .maybeSingle();

    if (error) {
        console.warn('[ONE_TIME_ORDER] Could not load order input:', error.message);
        return null;
    }

    return data || null;
}

export async function listRecentLegacyOneTimeOrderInputs({ productType, productId, customerEmail, createdAfter } = {}) {
    const email = cleanString(customerEmail, 254).toLowerCase();
    if (productType !== 'personal_map' || !cleanString(productId, 120)
        || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
        || !Number.isFinite(Date.parse(createdAfter || ''))) {
        throw new Error('Invalid legacy one-time order lookup.');
    }

    const { data, error } = await supabase
        .from('one_time_order_inputs')
        .select('id, product_type, product_id, customer_email, customer_name, payload, status, stripe_session_id, created_at, updated_at')
        .eq('product_type', productType)
        .eq('product_id', cleanString(productId, 120))
        .eq('customer_email', email)
        .gte('created_at', createdAfter)
        .is('payload->>flowId', null)
        .neq('status', 'expired')
        .order('created_at', { ascending: false })
        .limit(21);

    if (error) throw error;
    if (data?.length > 20) {
        throw Object.assign(new Error('Too many recent legacy checkout attempts to resolve safely.'), {
            code: 'PERSONAL_MAP_LEGACY_ORDER_AMBIGUOUS'
        });
    }
    return data || [];
}

export async function markOneTimeOrderInputPaid(orderId) {
    const cleanOrderId = cleanString(orderId, 80);
    if (!cleanOrderId) return false;

    const { error } = await supabase
        .from('one_time_order_inputs')
        .update({
            status: 'paid',
            updated_at: new Date().toISOString()
        })
        .eq('id', cleanOrderId);

    if (error) {
        console.warn('[ONE_TIME_ORDER] Could not mark order paid:', error.message);
        return false;
    }

    return true;
}

export async function markOneTimeOrderInputFulfilled(orderId) {
    const cleanOrderId = cleanString(orderId, 80);
    if (!cleanOrderId) return false;

    const { data, error } = await supabase
        .from('one_time_order_inputs')
        .update({
            status: 'fulfilled',
            fulfilled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', cleanOrderId).select('id').maybeSingle();

    if (error || !data) {
        console.warn('[ONE_TIME_ORDER] Could not mark order fulfilled:', error?.message || 'Order not found');
        return false;
    }

    return true;
}

export async function markOneTimeOrderInputFailed(orderId) {
    const cleanOrderId = cleanString(orderId, 80);
    if (!cleanOrderId) return false;

    const { error } = await supabase
        .from('one_time_order_inputs')
        .update({
            status: 'failed',
            updated_at: new Date().toISOString()
        })
        .eq('id', cleanOrderId);

    if (error) {
        console.warn('[ONE_TIME_ORDER] Could not mark order failed:', error.message);
        return false;
    }

    return true;
}

/**
 * Terminal state for orders whose checkout was never paid (abandoned cart,
 * expired Stripe session). Distinct from 'failed' (paid but fulfillment
 * broke) so a human can tell a lost sale apart from a delivery incident.
 */
export async function markOneTimeOrderInputExpired(orderId) {
    const cleanOrderId = cleanString(orderId, 80);
    if (!cleanOrderId) return false;

    const { error } = await supabase
        .from('one_time_order_inputs')
        .update({
            status: 'expired',
            updated_at: new Date().toISOString()
        })
        .eq('id', cleanOrderId);

    if (error) {
        console.warn('[ONE_TIME_ORDER] Could not mark order expired:', error.message);
        return false;
    }

    return true;
}

/**
 * Orders whose checkout succeeded but whose async fulfillment (PDF
 * generation + email delivery) never confirmed — either because it crashed
 * before marking the order fulfilled, or because the process restarted
 * mid-flight. Excludes orders younger than the grace window, since normal
 * fulfillment can legitimately still be in progress.
 */
export async function listStuckOneTimeOrderInputs({ olderThanMs, maxRetries, limit = 20 } = {}) {
    const cutoffIso = new Date(Date.now() - olderThanMs).toISOString();

    const { data, error } = await supabase
        .from('one_time_order_inputs')
        .select('id, product_type, product_id, customer_email, customer_name, payload, retry_count, created_at, stripe_session_id')
        .eq('status', 'checkout_created')
        .lt('created_at', cutoffIso)
        .lt('retry_count', maxRetries)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) {
        console.warn('[ONE_TIME_ORDER] Could not list stuck orders:', error.message);
        return [];
    }

    return data || [];
}

export async function recordOneTimeOrderInputAttemptFailure(orderId, errorMessage) {
    const cleanOrderId = cleanString(orderId, 80);
    if (!cleanOrderId) return { retryCount: null };

    const { data: current, error: fetchError } = await supabase
        .from('one_time_order_inputs')
        .select('retry_count')
        .eq('id', cleanOrderId)
        .maybeSingle();

    if (fetchError) {
        console.warn('[ONE_TIME_ORDER] Could not read retry_count before recording failure:', fetchError.message);
    }

    const nextRetryCount = (current?.retry_count || 0) + 1;

    const { error } = await supabase
        .from('one_time_order_inputs')
        .update({
            retry_count: nextRetryCount,
            last_error: cleanString(String(errorMessage ?? ''), 2000),
            last_attempt_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', cleanOrderId);

    if (error) {
        console.warn('[ONE_TIME_ORDER] Could not record attempt failure:', error.message);
    }

    return { retryCount: nextRetryCount };
}
