import schedule from 'node-schedule';
import {
    listStuckOneTimeOrderInputs,
    markOneTimeOrderInputFulfilled,
    markOneTimeOrderInputFailed,
    recordOneTimeOrderInputAttemptFailure
} from '../services/one-time-orders.js';
import { fulfillOneTimeOrder } from '../services/one-time-fulfillment.js';
import { sendOperationalAlert } from '../services/alerts.js';

/**
 * ONE-TIME ORDER RECONCILIATION JOB
 *
 * Osobní mapa / Roční horoskop fulfillment (Claude generation + Playwright
 * render + Resend delivery) runs async right after the Stripe webhook
 * responds. If that fails — AI outage, renderer crash, email provider error —
 * the failure was previously only console.error'd: no retry, no alert, and
 * the order stayed stuck at status='checkout_created' forever.
 *
 * This job finds orders past the grace window, retries fulfillment using the
 * same logic the webhook uses, and after the retry budget is exhausted marks
 * the order 'failed' and sends an operational alert so a human can follow up.
 */

// 20 minutes matches the delivery-time expectation already set on
// osobni-mapa.html ("Pokud nedorazí do 20 minut...") — long enough that a
// normal in-flight webhook fulfillment has certainly finished by then.
const GRACE_PERIOD_MS = 20 * 60 * 1000;
const MAX_RETRIES = 3;
const BATCH_LIMIT = 20;

let jobRunning = false;

/**
 * @param {object} [options]
 * @param {typeof fulfillOneTimeOrder} [options.fulfillFn] - Injectable for tests,
 *   mirroring the fetchImpl seam in services/alerts.js, so retry/exhaustion
 *   bookkeeping can be tested without making real Claude/Playwright/Resend calls.
 */
export async function reconcileStuckOneTimeOrders({ fulfillFn = fulfillOneTimeOrder } = {}) {
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

        console.log(`[JOB] Retrying ${stuckOrders.length} stuck one-time order(s)...`);

        let recovered = 0;
        let failed = 0;

        for (const order of stuckOrders) {
            try {
                await fulfillFn({
                    productType: order.product_type,
                    customerName: order.customer_name,
                    customerEmail: order.customer_email,
                    payload: order.payload || {}
                });
                await markOneTimeOrderInputFulfilled(order.id);
                recovered++;
                console.log(`[JOB] ✓ Recovered stuck order ${order.id} (${order.product_type})`);
            } catch (err) {
                failed++;
                const { retryCount } = await recordOneTimeOrderInputAttemptFailure(order.id, err.message);
                console.error(`[JOB] ✗ Retry failed for order ${order.id} (attempt ${retryCount ?? '?'}/${MAX_RETRIES}):`, err.message);

                if ((retryCount || 0) >= MAX_RETRIES) {
                    await markOneTimeOrderInputFailed(order.id);
                    await sendOperationalAlert('one_time_order_fulfillment_failed', {
                        severity: 'critical',
                        summary: `${order.product_type} order ${order.id} failed to fulfill after ${MAX_RETRIES} attempts`,
                        dedupeKey: `one_time_order_fulfillment_failed:${order.id}`,
                        metadata: {
                            orderId: order.id,
                            productType: order.product_type,
                            productId: order.product_id,
                            retryCount,
                            error: err.message
                        }
                    }).catch(() => {});
                    console.warn(`[JOB] ✗ Order ${order.id} marked failed after ${MAX_RETRIES} attempts; admin alert sent`);
                }
            }
        }

        console.log(`[JOB] One-time order reconciliation done: ${recovered} recovered, ${failed} failed`);
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
