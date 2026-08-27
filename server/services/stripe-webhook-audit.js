import Stripe from 'stripe';
import { evaluateStripeWebhookEndpoints } from '../config/stripe-webhooks.js';

const DEFAULT_CACHE_MS = 5 * 60 * 1000;
let cachedAudit = null;
let cachedUntil = 0;

function resolveCacheMs(value = process.env.STRIPE_WEBHOOK_AUDIT_CACHE_MS) {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_CACHE_MS;
}

export async function auditStripeWebhookConfiguration({
    stripeClient = null,
    stripeKey = process.env.STRIPE_SECRET_KEY || '',
    baseUrl = process.env.APP_URL || 'https://www.mystickahvezda.cz',
    checkedAt = new Date(),
} = {}) {
    const cleanStripeKey = String(stripeKey || '').trim();
    if (!stripeClient && !cleanStripeKey) {
        throw new Error('Stripe webhook audit is not configured.');
    }

    const client = stripeClient || new Stripe(cleanStripeKey);
    const response = await client.webhookEndpoints.list({ limit: 100 });
    const audit = evaluateStripeWebhookEndpoints(response?.data || [], { baseUrl });
    const liveMode = cleanStripeKey
        ? cleanStripeKey.startsWith('sk_live_')
        : null;

    return {
        ...audit,
        healthy: audit.healthy && liveMode !== false,
        stripeMode: liveMode === null ? 'injected' : (liveMode ? 'live' : 'test'),
        checkedAt: checkedAt.toISOString(),
        cached: false,
    };
}

export async function getCachedStripeWebhookAudit({
    force = false,
    now = Date.now(),
    cacheMs = resolveCacheMs(),
    ...auditOptions
} = {}) {
    if (!force && cachedAudit && now < cachedUntil) {
        return { ...cachedAudit, cached: true };
    }

    const result = await auditStripeWebhookConfiguration(auditOptions);
    cachedAudit = result;
    cachedUntil = now + cacheMs;
    return result;
}

export function clearStripeWebhookAuditCache() {
    cachedAudit = null;
    cachedUntil = 0;
}
