import express from 'express';
import { supabase } from './db-supabase.js';
import { authenticateToken } from './middleware.js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const APP_URL = process.env.APP_URL || 'http://localhost:3001';
const router = express.Router();

const PREMIUM_PLAN_TYPES = ['premium_monthly', 'premium_yearly', 'premium_pro', 'exclusive_monthly', 'vip'];

// Plan definitions (consistent with cenik.html)
const PLANS = {
    'poutnik': {
        name: 'Poutnik (Zaklad)',
        price: 0,
        type: 'free',
        interval: null
    },
    'pruvodce': {
        name: 'Hvezdny Pruvodce (Mesicni)',
        price: 19900, // 199 CZK in halere
        type: 'premium_monthly',
        interval: 'month'
    },
    'osviceni': {
        name: 'Osviceni (Rocni)',
        price: 119000, // 1190 CZK in halere
        type: 'premium_yearly',
        interval: 'year'
    }
};

// Helper to check premium status (aligned with middleware logic)
export async function isPremiumUser(userId) {
    try {
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan_type, status, current_period_end')
            .eq('user_id', userId)
            .single();

        if (!subscription) return false;

        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        const notExpired = new Date(subscription.current_period_end) > new Date();
        const isPremium = PREMIUM_PLAN_TYPES.includes(subscription.plan_type);

        return isActive && notExpired && isPremium;
    } catch (e) {
        console.error('Error checking premium status:', e);
        return false;
    }
}

/**
 * Get or create a Stripe customer for the user
 */
async function getOrCreateStripeCustomer(userId, email) {
    // Check if user already has a Stripe customer ID
    const { data: userData } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

    if (userData?.stripe_customer_id) {
        return userData.stripe_customer_id;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId }
    });

    // Save customer ID to users table
    await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);

    return customer.id;
}

// ============================================
// GET /subscription/status - Frontend calls this to check premium access
// ============================================
router.get('/subscription/status', authenticateToken, async (req, res) => {
    try {
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('plan_type, status, current_period_end, stripe_subscription_id')
            .eq('user_id', req.user.id)
            .single();

        if (!subscription) {
            return res.json({
                planType: 'free',
                status: 'active',
                currentPeriodEnd: null,
                canCancel: false
            });
        }

        const canCancel = !!subscription.stripe_subscription_id &&
            (subscription.status === 'active' || subscription.status === 'trialing');

        res.json({
            planType: subscription.plan_type || 'free',
            status: subscription.status || 'active',
            currentPeriodEnd: subscription.current_period_end,
            canCancel
        });
    } catch (error) {
        console.error('Subscription Status Error:', error);
        res.status(500).json({ error: 'Nepodařilo se načíst stav předplatného.' });
    }
});

// ============================================
// POST /create-checkout-session - Create Stripe Checkout for subscription
// ============================================
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
    try {
        const { planId } = req.body;
        const user = req.user;

        const plan = PLANS[planId] || PLANS['pruvodce'];

        if (plan.price === 0) {
            return res.status(400).json({ error: 'Cannot create session for free plan' });
        }

        // Get or create Stripe customer to link subscriptions
        const customerId = await getOrCreateStripeCustomer(user.id, user.email);

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'czk',
                    product_data: {
                        name: plan.name,
                        description: 'Pristup ke vsem premiovym funkcim Mysticke Hvezdy',
                    },
                    unit_amount: plan.price,
                    recurring: {
                        interval: plan.interval
                    }
                },
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${APP_URL}/profil.html?payment=success`,
            cancel_url: `${APP_URL}/cenik.html?payment=cancel`,
            client_reference_id: user.id,
            metadata: {
                userId: user.id,
                planType: plan.type
            },
            subscription_data: {
                metadata: {
                    userId: user.id,
                    planType: plan.type
                }
            }
        });

        res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe Session Error:', error);
        res.status(500).json({ error: 'Platba se nezdařila. Zkuste to prosím později.' });
    }
});

// ============================================
// POST /cancel - Cancel active subscription
// ============================================
router.post('/cancel', authenticateToken, async (req, res) => {
    try {
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('stripe_subscription_id, status')
            .eq('user_id', req.user.id)
            .single();

        if (!subscription?.stripe_subscription_id) {
            return res.status(400).json({ error: 'Nemáte aktivní předplatné ke zrušení.' });
        }

        if (subscription.status !== 'active' && subscription.status !== 'trialing') {
            return res.status(400).json({ error: 'Předplatné již bylo zrušeno.' });
        }

        // Cancel at period end (user keeps access until current period expires)
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true
        });

        // Update local status to reflect pending cancellation
        await supabase
            .from('subscriptions')
            .update({ status: 'cancel_pending' })
            .eq('user_id', req.user.id);

        res.json({
            success: true,
            message: 'Předplatné bude zrušeno na konci aktuálního období.'
        });
    } catch (error) {
        console.error('Cancel Subscription Error:', error);
        res.status(500).json({ error: 'Nepodařilo se zrušit předplatné.' });
    }
});

// ============================================
// POST /reactivate - Reactivate a cancelled subscription before period end
// ============================================
router.post('/reactivate', authenticateToken, async (req, res) => {
    try {
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('stripe_subscription_id, status')
            .eq('user_id', req.user.id)
            .single();

        if (!subscription?.stripe_subscription_id) {
            return res.status(400).json({ error: 'Nemáte předplatné k obnovení.' });
        }

        if (subscription.status !== 'cancel_pending') {
            return res.status(400).json({ error: 'Předplatné není ve stavu čekajícího zrušení.' });
        }

        // Remove cancellation
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: false
        });

        await supabase
            .from('subscriptions')
            .update({ status: 'active' })
            .eq('user_id', req.user.id);

        res.json({
            success: true,
            message: 'Předplatné bylo úspěšně obnoveno.'
        });
    } catch (error) {
        console.error('Reactivate Subscription Error:', error);
        res.status(500).json({ error: 'Nepodařilo se obnovit předplatné.' });
    }
});

// ============================================
// POST /portal - Create Stripe Customer Portal session for self-service management
// ============================================
router.post('/portal', authenticateToken, async (req, res) => {
    try {
        const { data: userData } = await supabase
            .from('users')
            .select('stripe_customer_id')
            .eq('id', req.user.id)
            .single();

        if (!userData?.stripe_customer_id) {
            return res.status(400).json({ error: 'Nemáte propojený platební účet.' });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: userData.stripe_customer_id,
            return_url: `${APP_URL}/profil.html`
        });

        res.json({ url: portalSession.url });
    } catch (error) {
        console.error('Portal Session Error:', error);
        res.status(500).json({ error: 'Nepodařilo se otevřít správu předplatného.' });
    }
});

// ============================================
// Stripe Webhook Handler
// ============================================
export async function handleStripeWebhook(rawBody, sig) {
    let event;

    if (!STRIPE_WEBHOOK_SECRET) {
        console.error('[STRIPE] CRITICAL: STRIPE_WEBHOOK_SECRET not set. Rejecting webhook.');
        throw new Error('Webhook secret not configured');
    }
    try {
        event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('[STRIPE] Webhook signature verification failed:', err.message);
        throw new Error('Webhook signature verification failed');
    }

    console.log(`[STRIPE] Webhook received: ${event.type}`);

    switch (event.type) {
        case 'checkout.session.completed':
            await handleCheckoutCompleted(event.data.object);
            break;
        case 'invoice.paid':
            await handleInvoicePaid(event.data.object);
            break;
        case 'invoice.payment_failed':
            await handleInvoicePaymentFailed(event.data.object);
            break;
        case 'customer.subscription.updated':
            await handleSubscriptionUpdated(event.data.object);
            break;
        case 'customer.subscription.deleted':
            await handleSubscriptionDeleted(event.data.object);
            break;
        default:
            console.log(`[STRIPE] Unhandled event type: ${event.type}`);
    }
}

/**
 * Handle checkout.session.completed - initial subscription creation
 */
async function handleCheckoutCompleted(session) {
    const userId = session.client_reference_id || session.metadata?.userId;
    const planType = session.metadata?.planType || 'premium_monthly';
    const stripeSubscriptionId = session.subscription;
    const stripeCustomerId = session.customer;

    if (!userId) {
        console.error('[STRIPE] checkout.session.completed: no userId found');
        return;
    }

    console.log(`[STRIPE] Checkout completed for user ${userId}, plan: ${planType}`);

    // Fetch the subscription from Stripe to get period details
    let currentPeriodEnd;
    if (stripeSubscriptionId) {
        try {
            const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            currentPeriodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
        } catch (e) {
            console.error('[STRIPE] Failed to retrieve subscription details:', e.message);
            // Fallback to calculated expiry
            const expiry = new Date();
            if (planType === 'premium_yearly') {
                expiry.setFullYear(expiry.getFullYear() + 1);
            } else {
                expiry.setMonth(expiry.getMonth() + 1);
            }
            currentPeriodEnd = expiry.toISOString();
        }
    }

    // Save Stripe customer ID on the user
    if (stripeCustomerId) {
        await supabase
            .from('users')
            .update({ stripe_customer_id: stripeCustomerId, is_premium: true })
            .eq('id', userId);
    }

    // Upsert subscription record
    const subData = {
        user_id: userId,
        plan_type: planType,
        status: 'active',
        current_period_end: currentPeriodEnd,
        stripe_subscription_id: stripeSubscriptionId || null
    };

    const { error } = await supabase
        .from('subscriptions')
        .upsert(subData, { onConflict: 'user_id' });

    if (error) {
        console.error('[STRIPE] Supabase upsert error:', error);
    } else {
        console.log(`[STRIPE] User ${userId} upgraded to ${planType}.`);
    }
}

/**
 * Handle invoice.paid - recurring payment succeeded (subscription renewal)
 */
async function handleInvoicePaid(invoice) {
    const stripeSubscriptionId = invoice.subscription;
    if (!stripeSubscriptionId) return;

    // Find user by subscription ID
    const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .single();

    if (!sub) {
        console.log(`[STRIPE] invoice.paid: no local subscription found for ${stripeSubscriptionId}`);
        return;
    }

    // Fetch updated period from Stripe
    try {
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const currentPeriodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();

        await supabase
            .from('subscriptions')
            .update({
                status: 'active',
                current_period_end: currentPeriodEnd
            })
            .eq('stripe_subscription_id', stripeSubscriptionId);

        await supabase.from('users').update({ is_premium: true }).eq('id', sub.user_id);

        console.log(`[STRIPE] Subscription renewed for user ${sub.user_id} until ${currentPeriodEnd}`);
    } catch (e) {
        console.error('[STRIPE] Failed to process invoice.paid:', e.message);
    }
}

/**
 * Handle invoice.payment_failed - payment failed, mark as past_due
 */
async function handleInvoicePaymentFailed(invoice) {
    const stripeSubscriptionId = invoice.subscription;
    if (!stripeSubscriptionId) return;

    const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_subscription_id', stripeSubscriptionId);

    if (error) {
        console.error('[STRIPE] Failed to mark subscription as past_due:', error);
    } else {
        console.log(`[STRIPE] Subscription ${stripeSubscriptionId} marked as past_due`);
    }
}

/**
 * Handle customer.subscription.updated - plan changes, trial end, etc.
 */
async function handleSubscriptionUpdated(subscription) {
    const stripeSubscriptionId = subscription.id;

    const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .single();

    if (!sub) {
        console.log(`[STRIPE] subscription.updated: no local record for ${stripeSubscriptionId}`);
        return;
    }

    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    let status = subscription.status; // active, past_due, canceled, trialing, etc.

    // Map Stripe statuses to our internal statuses
    if (subscription.cancel_at_period_end && status === 'active') {
        status = 'cancel_pending';
    }

    await supabase
        .from('subscriptions')
        .update({
            status,
            current_period_end: currentPeriodEnd
        })
        .eq('stripe_subscription_id', stripeSubscriptionId);

    // Update is_premium flag
    const isPremium = (status === 'active' || status === 'trialing' || status === 'cancel_pending');
    await supabase.from('users').update({ is_premium: isPremium }).eq('id', sub.user_id);

    console.log(`[STRIPE] Subscription ${stripeSubscriptionId} updated: status=${status}`);
}

/**
 * Handle customer.subscription.deleted - subscription fully cancelled
 */
async function handleSubscriptionDeleted(subscription) {
    const stripeSubscriptionId = subscription.id;

    const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', stripeSubscriptionId)
        .single();

    if (!sub) {
        console.log(`[STRIPE] subscription.deleted: no local record for ${stripeSubscriptionId}`);
        return;
    }

    await supabase
        .from('subscriptions')
        .update({
            status: 'cancelled',
            plan_type: 'free',
            stripe_subscription_id: null
        })
        .eq('user_id', sub.user_id);

    await supabase.from('users').update({ is_premium: false }).eq('id', sub.user_id);

    console.log(`[STRIPE] Subscription cancelled for user ${sub.user_id}`);
}

// Legacy endpoint
router.post('/process', authenticateToken, async (req, res) => {
    res.status(410).json({ success: false, error: 'Tento endpoint byl nahrazen Stripe Checkout.' });
});

export default router;
