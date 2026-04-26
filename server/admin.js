import express from 'express';
import { supabase } from './db-supabase.js';
import { authenticateToken, requireAdmin } from './middleware.js';
import { SUBSCRIPTION_PLANS } from './config/constants.js';

const router = express.Router();

const DEFAULT_FUNNEL_DAYS = 30;
const MAX_FUNNEL_DAYS = 365;
const DEFAULT_FUNNEL_LIMIT = 1000;
const MAX_FUNNEL_LIMIT = 5000;

const FUNNEL_FAILURE_EVENTS = new Set([
    'checkout_validation_failed',
    'checkout_session_failed',
    'stripe_webhook_failed',
    'subscription_payment_failed',
]);

const FUNNEL_REFUND_EVENTS = new Set([
    'payment_refunded',
]);

function incrementCounter(counter, key) {
    const normalizedKey = key || 'unknown';
    counter[normalizedKey] = (counter[normalizedKey] || 0) + 1;
}

function topCounter(counter, limit = 8) {
    return Object.entries(counter)
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
        .slice(0, limit);
}

function normalizeDimension(value) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed || null;
}

function getMinorAmount(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
}

function estimateEventMinorValue(event) {
    const eventName = event?.event_name;
    const metadata = event?.metadata && typeof event.metadata === 'object' ? event.metadata : {};

    if (eventName === 'subscription_checkout_completed') {
        return SUBSCRIPTION_PLANS[event.plan_id]?.price || 0;
    }

    if (eventName === 'one_time_purchase_completed') {
        return getMinorAmount(metadata.amount || metadata.amount_total || metadata.price);
    }

    if (eventName === 'subscription_invoice_paid') {
        return getMinorAmount(metadata.amountPaid || metadata.amount_paid);
    }

    return 0;
}

function createDailyBucket(date) {
    return {
        date,
        paywallViewed: 0,
        checkoutStarted: 0,
        subscriptionCompleted: 0,
        oneTimeCompleted: 0,
        failures: 0,
        refunds: 0
    };
}

function getEventDate(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 10);
}

export function normalizeFunnelDays(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_FUNNEL_DAYS;
    return Math.min(MAX_FUNNEL_DAYS, Math.max(1, parsed));
}

export function normalizeFunnelLimit(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_FUNNEL_LIMIT;
    return Math.min(MAX_FUNNEL_LIMIT, Math.max(100, parsed));
}

export function buildFunnelReport(events = [], { days = DEFAULT_FUNNEL_DAYS, since = null, limit = DEFAULT_FUNNEL_LIMIT } = {}) {
    const byEvent = {};
    const bySource = {};
    const byFeature = {};
    const byPlan = {};
    const byDay = {};
    let estimatedMinorValue = 0;

    for (const event of events) {
        const eventName = normalizeDimension(event.event_name) || 'unknown';
        incrementCounter(byEvent, eventName);

        incrementCounter(bySource, normalizeDimension(event.source) || '(direct)');
        incrementCounter(byFeature, normalizeDimension(event.feature) || '(nezadano)');
        incrementCounter(byPlan, normalizeDimension(event.plan_id) || normalizeDimension(event.plan_type) || '(nezadano)');

        estimatedMinorValue += estimateEventMinorValue(event);

        const date = getEventDate(event.created_at);
        if (date) {
            if (!byDay[date]) byDay[date] = createDailyBucket(date);

            if (eventName === 'paywall_viewed' || eventName === 'login_gate_viewed') byDay[date].paywallViewed += 1;
            if (eventName === 'checkout_session_created') byDay[date].checkoutStarted += 1;
            if (eventName === 'subscription_checkout_completed') byDay[date].subscriptionCompleted += 1;
            if (eventName === 'one_time_purchase_completed') byDay[date].oneTimeCompleted += 1;
            if (FUNNEL_FAILURE_EVENTS.has(eventName)) byDay[date].failures += 1;
            if (FUNNEL_REFUND_EVENTS.has(eventName)) byDay[date].refunds += 1;
        }
    }

    const paywallViewed = (byEvent.paywall_viewed || 0) + (byEvent.login_gate_viewed || 0);
    const checkoutStarted = byEvent.checkout_session_created || 0;
    const subscriptionCompleted = byEvent.subscription_checkout_completed || 0;
    const oneTimeCompleted = byEvent.one_time_purchase_completed || 0;
    const invoicePaid = byEvent.subscription_invoice_paid || 0;
    const failures = [...FUNNEL_FAILURE_EVENTS].reduce((sum, eventName) => sum + (byEvent[eventName] || 0), 0);
    const refunds = [...FUNNEL_REFUND_EVENTS].reduce((sum, eventName) => sum + (byEvent[eventName] || 0), 0);
    const cancelRequests = byEvent.subscription_cancel_requested || 0;
    const conversionRate = checkoutStarted > 0
        ? Math.round((subscriptionCompleted / checkoutStarted) * 1000) / 10
        : 0;
    const paywallToCheckoutRate = paywallViewed > 0
        ? Math.round((checkoutStarted / paywallViewed) * 1000) / 10
        : 0;

    return {
        generatedAt: new Date().toISOString(),
        days,
        since,
        limit,
        totalEvents: events.length,
        metrics: {
            paywallViewed,
            checkoutStarted,
            subscriptionCompleted,
            oneTimeCompleted,
            invoicePaid,
            failures,
            refunds,
            cancelRequests,
            conversionRate,
            paywallToCheckoutRate,
            estimatedValueCzk: Math.round(estimatedMinorValue / 100)
        },
        byEvent,
        topSources: topCounter(bySource),
        topFeatures: topCounter(byFeature),
        topPlans: topCounter(byPlan),
        daily: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
        recentEvents: events.slice(0, 50).map(event => ({
            id: event.id,
            eventName: event.event_name,
            source: event.source,
            feature: event.feature,
            planId: event.plan_id,
            planType: event.plan_type,
            createdAt: event.created_at
        }))
    };
}

// Get all users with their subscriptions (with pagination)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 50);
        const offset = (page - 1) * limit;

        // Fetch users with pagination
        const { data: users, error, count } = await supabase
            .from('users')
            .select(`
                id,
                email,
                first_name,
                created_at,
                subscriptions (
                    plan_type,
                    status,
                    current_period_end
                )
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            success: true,
            users,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Admin Users Error:', error);
        res.status(500).json({ success: false, error: 'Nepodařilo se načíst uživatele.' });
    }
});

// Monetization funnel report
router.get('/funnel', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const days = normalizeFunnelDays(req.query.days);
        const limit = normalizeFunnelLimit(req.query.limit);
        const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const since = sinceDate.toISOString();

        const { data: events, error } = await supabase
            .from('funnel_events')
            .select(`
                id,
                user_id,
                event_name,
                source,
                feature,
                plan_id,
                plan_type,
                stripe_session_id,
                stripe_event_id,
                metadata,
                created_at
            `)
            .gte('created_at', since)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        res.json({
            success: true,
            report: buildFunnelReport(events || [], { days, since, limit })
        });
    } catch (error) {
        console.error('Admin Funnel Error:', error);
        res.status(500).json({ success: false, error: 'Nepodařilo se načíst funnel report.' });
    }
});

// Update user subscription manually
router.post('/user/:userId/subscription', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { plan_type } = req.body;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
            return res.status(400).json({ success: false, error: 'Neplatné ID uživatele.' });
        }

        if (!plan_type || typeof plan_type !== 'string') {
            return res.status(400).json({ success: false, error: 'Typ plánu je povinný.' });
        }

        const VALID_PLAN_TYPES = ['free', 'premium_monthly', 'exclusive_monthly', 'vip_majestrat'];
        if (!VALID_PLAN_TYPES.includes(plan_type)) {
            return res.status(400).json({ success: false, error: `Neplatný typ plánu. Povolené hodnoty: ${VALID_PLAN_TYPES.join(', ')}` });
        }

        // Set expiry based on plan type
        const expiryDate = new Date();
        if (plan_type.includes('yearly')) {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else if (plan_type === 'free') {
            expiryDate.setFullYear(expiryDate.getFullYear() + 100);
        } else {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
        }
        console.log(`[ADMIN] Subscription override: user=${userId}, plan=${plan_type}, expires=${expiryDate.toISOString()}, by admin=${req.user.email}`);

        const subData = {
            user_id: userId,
            plan_type: plan_type,
            status: 'active',
            current_period_end: expiryDate.toISOString()
        };

        const { error } = await supabase
            .from('subscriptions')
            .upsert(subData, { onConflict: 'user_id' });

        if (error) throw error;

        // Also update is_premium flag in users table
        await supabase
            .from('users')
            .update({ is_premium: plan_type !== 'free' })
            .eq('id', userId);

        res.json({ success: true, message: `User plan updated to ${plan_type}` });
    } catch (error) {
        console.error('Admin Update Error:', error);
        res.status(500).json({ success: false, error: 'Nepodařilo se aktualizovat předplatné.' });
    }
});

export default router;
