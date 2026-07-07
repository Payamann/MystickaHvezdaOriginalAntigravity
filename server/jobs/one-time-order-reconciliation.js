import schedule from 'node-schedule';
import Stripe from 'stripe';
import {
    listStuckOneTimeOrderInputs,
    markOneTimeOrderInputFulfilled,
    markOneTimeOrderInputFailed,
    markOneTimeOrderInputExpired,
    recordOneTimeOrderInputAttemptFailure
} from '../services/one-time-orders.js';
import { fulfillOneTimeOrder } from '../services/one-time-fulfillment.js';
import { sendOperationalAlert } from '../services/alerts.js';

/**
 * ONE-TIME ORDER RECONCILIATION JOB
 *
 * Osobní mapa / Roční horoskop fulfillment (Claude generation + Playwright
 * render + Resend delivery) runs async right after the Stripe webhook
 * responds. If that fails — AI outage, renderer crash, email provider error,
 * or the webhook never arriving at all — the order stays stuck at
 * status='checkout_created' and the paying customer gets nothing.
 *
 * This job is the safety net. Because a row is created at checkout START
 * (before payment), a stuck 'checkout_created' order is ambiguous: it may be
 * PAID-but-undelivered (retry) or an ABANDONED cart that was never paid
 * (must NOT be fulfilled — that would hand out a free PDF). So the job first
 * verifies payment against Stripe, then:
 *   - paid    → (re)try fulfillment, retry budget + alert on exhaustion
 *   - expired → mark 'expired' (abandoned cart / dead Stripe session)
 *   - unpaid  → leave it; the customer might still pay before the session dies
 *   - unknown → leave it, unless it is old enough to be safely written off
 */

function positiveIntFromEnv(envKey, fallback) {
    const parsed = Number.parseInt(process.env[envKey], 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// 20 minutes matches the delivery-time expectation already set on
// osobni-mapa.html ("Pokud nedorazí do 20 minut...") — long enough that a
// normal in-flight webhook fulfillment has certainly finished by then.
// Env overrides follow the data-retention.js convention so ops can tune
// without a code change.
const GRACE_PERIOD_MS = positiveIntFromEnv('ONE_TIME_RECONCILIATION_GRACE_MINUTES', 20) * 60 * 1000;
const MAX_RETRIES = positiveIntFromEnv('ONE_TIME_RECONCILIATION_MAX_RETRIES', 3);
const BATCH_LIMIT = positiveIntFromEnv('ONE_TIME_RECONCILIATION_BATCH_LIMIT', 20);
// Safety net for orders we cannot verify at all (missing/garbage session id):
// write them off once they are clearly dead, so they stop churning the query.
const UNVERIFIABLE_EXPIRY_MS = positiveIntFromEnv('ONE_TIME_RECONCILIATION_UNVERIFIABLE_HOURS', 48) * 60 * 60 * 1000;

let jobRunning = false;
let stripeClient = null;

function getStripeClient() {
    if (stripeClient) return stripeClient;
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) return null;
    stripeClient = new Stripe(secretKey);
    return stripeClient;
}

/**
 * Ask Stripe whether the checkout behind this order was actually paid.
 * Returns 'paid' | 'expired' | 'unpaid' | 'unknown'. Throws on transient
 * Stripe API errors so the caller can leave the order for the next run
 * instead of guessing.
 */
export async function verifyOneTimeOrderPayment(order, stripe = getStripeClient()) {
    const sessionId = order?.stripe_session_id;
    if (!sessionId || !stripe) return 'unknown';

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session?.payment_status === 'paid' || session?.payment_status === 'no_payment_required') {
        return 'paid';
    }
    if (session?.status === 'expired') return 'expired';
    return 'unpaid';
}

/**
 * @param {object} [options]
 * @param {typeof fulfillOneTimeOrder} [options.fulfillFn] - Injectable for tests,
 *   mirroring the fetchImpl seam in services/alerts.js, so retry/exhaustion
 *   bookkeeping can be tested without making real Claude/Playwright/Resend calls.
 * @param {typeof verifyOneTimeOrderPayment} [options.verifyPaymentFn] - Injectable
 *   payment check, so tests exercise the paid/expired/unpaid branches without Stripe.
 */
export async function reconcileStuckOneTimeOrders({
    fulfillFn = fulfillOneTimeOrder,
    verifyPaymentFn = verifyOneTimeOrderPayment
} = {}) {
    if (jobRunning) {
        console.log('[JOB] One-time order reconciliation already running, skipping...');
        return;
    }

    jobRunning = true;

    try {
        const stuckOrders = await listStuckOneTimeOrderInputs({
            olderThanMs: GRACE_PERIOD_MS,
            maxRetries: MAX_RETRIES,
            limit: BATCH_LIMIT
        });

        if (!stuckOrders.length) {
            console.log('[JOB] No stuck one-time orders found');
            return;
        }

        console.log(`[JOB] Reconciling ${stuckOrders.length} stuck one-time order(s)...`);

        let recovered = 0;
        let failed = 0;
        let expired = 0;
        let pending = 0;

        for (const order of stuckOrders) {
            // 1) Only paid orders may be fulfilled — an abandoned cart sits at
            //    the same status and must never receive a free PDF.
            let payment;
            try {
                payment = await verifyPaymentFn(order);
            } catch (verifyErr) {
                // Transient Stripe error — don't burn the retry budget on a
                // verification glitch; leave the order for the next run.
                console.warn(`[JOB] Payment check failed for order ${order.id}, leaving for next run:`, verifyErr.message);
                continue;
            }

            if (payment === 'expired') {
                await markOneTimeOrderInputExpired(order.id);
                expired++;
                console.log(`[JOB] ○ Order ${order.id} expired (checkout never paid)`);
                continue;
            }

            if (payment !== 'paid') {
                // 'unpaid' (session still open) or 'unknown' (no verifiable
                // session). Leave it — unless it is old enough to write off.
                const ageMs = Date.now() - new Date(order.created_at).getTime();
                if (payment === 'unknown' && ageMs > UNVERIFIABLE_EXPIRY_MS) {
                    await markOneTimeOrderInputExpired(order.id);
                    expired++;
                    console.log(`[JOB] ○ Order ${order.id} expired (unverifiable, older than write-off window)`);
                } else {
                    pending++;
                }
                continue;
            }

            // 2) Verified paid → (re)try fulfillment.
            try {
                await fulfillFn({
                    productType: order.product_type,
                    customerName: order.customer_name,
                    customerEmail: order.customer_email,
                    payload: order.payload || {}
                });
                await markOneTimeOrderInputFulfilled(order.id);
                recovered++;
                console.log(`[JOB] ✓ Recovered paid order ${order.id} (${order.product_type})`);
            } catch (err) {
                failed++;
                const { retryCount } = await recordOneTimeOrderInputAttemptFailure(order.id, err.message);
                console.error(`[JOB] ✗ Retry failed for paid order ${order.id} (attempt ${retryCount ?? '?'}/${MAX_RETRIES}):`, err.message);

                if ((retryCount || 0) >= MAX_RETRIES) {
                    await markOneTimeOrderInputFailed(order.id);
                    await sendOperationalAlert('one_time_order_fulfillment_failed', {
                        severity: 'critical',
                        summary: `${order.product_type} order ${order.id} failed to fulfill after ${MAX_RETRIES} attempts (customer paid)`,
                        dedupeKey: `one_time_order_fulfillment_failed:${order.id}`,
                        metadata: {
                            orderId: order.id,
                            productType: order.product_type,
                            productId: order.product_id,
                            retryCount,
                            error: err.message
                        }
                    }).catch(() => {});
                    console.warn(`[JOB] ✗ PAID order ${order.id} marked failed after ${MAX_RETRIES} attempts; admin alert sent`);
                }
            }
        }

        console.log(`[JOB] One-time order reconciliation done: ${recovered} recovered, ${expired} expired, ${pending} still pending payment, ${failed} failed`);
    } catch (error) {
        console.error('[JOB] Unexpected error in one-time order reconciliation:', error);
    } finally {
        jobRunning = false;
    }
}

/**
 * Initialize scheduled job runner.
 * Runs every 10 minutes, plus once immediately on startup to catch orders
 * left stuck by a restart mid-fulfillment.
 */
export function initializeOneTimeOrderReconciliationJob() {
    const job = schedule.scheduleJob('*/10 * * * *', () => {
        reconcileStuckOneTimeOrders().catch(err => {
            console.error('[JOB] Error on scheduled one-time order reconciliation run:', err);
        });
    });

    console.log('[JOB] One-time order reconciliation initialized (runs every 10 minutes)');

    reconcileStuckOneTimeOrders().catch(err => {
        console.error('[JOB] Error on initial one-time order reconciliation run:', err);
    });

    return job;
}

export default {
    reconcileStuckOneTimeOrders,
    initializeOneTimeOrderReconciliationJob
};
