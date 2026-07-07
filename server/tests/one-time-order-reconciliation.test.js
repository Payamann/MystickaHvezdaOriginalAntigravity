import { randomUUID } from 'node:crypto';
import { reconcileStuckOneTimeOrders, verifyOneTimeOrderPayment } from '../jobs/one-time-order-reconciliation.js';
import { listStuckOneTimeOrderInputs, getOneTimeOrderInput } from '../services/one-time-orders.js';
import { supabase } from '../db-supabase.js';

const TWENTY_ONE_MINUTES_AGO = () => new Date(Date.now() - 21 * 60 * 1000).toISOString();
const FIVE_MINUTES_AGO = () => new Date(Date.now() - 5 * 60 * 1000).toISOString();
const THREE_DAYS_AGO = () => new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

async function insertOrder(overrides = {}) {
    const id = randomUUID();
    const now = new Date().toISOString();
    await supabase.from('one_time_order_inputs').insert({
        id,
        product_type: 'personal_map',
        product_id: 'osobni_mapa_2026',
        customer_email: `test-${id}@example.com`,
        customer_name: 'Testovaci Osoba',
        payload: {},
        status: 'checkout_created',
        retry_count: 0,
        stripe_session_id: `cs_test_${id.slice(0, 8)}`,
        created_at: now,
        updated_at: now,
        ...overrides
    });
    return id;
}

async function readOrder(id) {
    const { data } = await supabase
        .from('one_time_order_inputs')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    return data;
}

// fulfillFn AND verifyPaymentFn are injected (mirrors the fetchImpl seam in
// services/alerts.js) so these tests exercise the job's own payment-gate and
// retry bookkeeping without calling Stripe / Claude / Playwright / Resend.
const PAID = async () => 'paid';

describe('one-time order reconciliation', () => {
    test('listStuckOneTimeOrderInputs excludes fresh orders and orders past the retry budget', async () => {
        const freshId = await insertOrder({ created_at: FIVE_MINUTES_AGO() });
        const stuckId = await insertOrder({ created_at: TWENTY_ONE_MINUTES_AGO() });
        const exhaustedId = await insertOrder({ created_at: TWENTY_ONE_MINUTES_AGO(), retry_count: 3 });

        const stuck = await listStuckOneTimeOrderInputs({ olderThanMs: 20 * 60 * 1000, maxRetries: 3, limit: 20 });
        const stuckIds = stuck.map((order) => order.id);

        expect(stuckIds).toContain(stuckId);
        expect(stuckIds).not.toContain(freshId);
        expect(stuckIds).not.toContain(exhaustedId);
    });

    test('fulfills a PAID stuck order and marks it fulfilled', async () => {
        const orderId = await insertOrder({ created_at: TWENTY_ONE_MINUTES_AGO() });
        const fulfillFn = jestSafeResolve();

        await reconcileStuckOneTimeOrders({ fulfillFn, verifyPaymentFn: PAID });

        expect(fulfillFn.calls.length).toBeGreaterThanOrEqual(1);
        const call = fulfillFn.calls.find((args) => args.customerEmail?.includes(orderId));
        expect(call).toMatchObject({ productType: 'personal_map', customerName: 'Testovaci Osoba' });

        await expect(getOneTimeOrderInput(orderId)).resolves.toMatchObject({
            id: orderId,
            status: 'fulfilled'
        });
    });

    test('NEVER fulfills an unpaid abandoned cart — marks it expired, no free PDF', async () => {
        const orderId = await insertOrder({ created_at: TWENTY_ONE_MINUTES_AGO() });
        const fulfillFn = jestSafeReject('fulfillment must not run for unpaid orders');

        await reconcileStuckOneTimeOrders({ fulfillFn, verifyPaymentFn: async () => 'expired' });

        expect(fulfillFn.calls).toHaveLength(0);
        expect(await readOrder(orderId)).toMatchObject({ status: 'expired', retry_count: 0 });
    });

    test('leaves an unpaid-but-open order pending (customer may still pay)', async () => {
        const orderId = await insertOrder({ created_at: TWENTY_ONE_MINUTES_AGO() });
        const fulfillFn = jestSafeReject('must not run while payment is still open');

        await reconcileStuckOneTimeOrders({ fulfillFn, verifyPaymentFn: async () => 'unpaid' });

        expect(fulfillFn.calls).toHaveLength(0);
        expect(await readOrder(orderId)).toMatchObject({ status: 'checkout_created', retry_count: 0 });
    });

    test('writes off an unverifiable order only once it is past the write-off window', async () => {
        const recentId = await insertOrder({ created_at: TWENTY_ONE_MINUTES_AGO() });
        const ancientId = await insertOrder({ created_at: THREE_DAYS_AGO() });
        const fulfillFn = jestSafeReject('must not run for unverifiable orders');

        await reconcileStuckOneTimeOrders({ fulfillFn, verifyPaymentFn: async () => 'unknown' });

        expect(fulfillFn.calls).toHaveLength(0);
        expect(await readOrder(recentId)).toMatchObject({ status: 'checkout_created' });
        expect(await readOrder(ancientId)).toMatchObject({ status: 'expired' });
    });

    test('a transient payment-check error leaves the order untouched for the next run', async () => {
        const orderId = await insertOrder({ created_at: TWENTY_ONE_MINUTES_AGO() });
        const fulfillFn = jestSafeResolve();
        const verifyPaymentFn = async () => { throw new Error('Stripe timeout'); };

        await reconcileStuckOneTimeOrders({ fulfillFn, verifyPaymentFn });

        expect(fulfillFn.calls).toHaveLength(0);
        expect(await readOrder(orderId)).toMatchObject({ status: 'checkout_created', retry_count: 0 });
    });

    test('a failed fulfillment of a PAID order increments retry_count and stays retryable', async () => {
        const orderId = await insertOrder({ created_at: TWENTY_ONE_MINUTES_AGO(), retry_count: 0 });
        const fulfillFn = jestSafeReject('boom');

        await reconcileStuckOneTimeOrders({ fulfillFn, verifyPaymentFn: PAID });

        const data = await readOrder(orderId);
        expect(data).toMatchObject({ status: 'checkout_created' });
        expect(data.retry_count).toBeGreaterThanOrEqual(1);
        expect(data.last_error).toBe('boom');
    });

    test('exhausting the retry budget on a PAID order marks it failed', async () => {
        const orderId = await insertOrder({ created_at: TWENTY_ONE_MINUTES_AGO(), retry_count: 2 });
        const fulfillFn = jestSafeReject('still broken');

        await reconcileStuckOneTimeOrders({ fulfillFn, verifyPaymentFn: PAID });

        expect(await readOrder(orderId)).toMatchObject({ status: 'failed', retry_count: 3 });
    });

    test('does not touch orders still within the grace window', async () => {
        const orderId = await insertOrder({ created_at: FIVE_MINUTES_AGO() });
        const fulfillFn = jestSafeReject('should never be called for this order');

        await reconcileStuckOneTimeOrders({ fulfillFn, verifyPaymentFn: PAID });

        expect(await readOrder(orderId)).toMatchObject({ status: 'checkout_created', retry_count: 0 });
    });

    test('verifyOneTimeOrderPayment maps Stripe session states to a payment verdict', async () => {
        const stub = (session) => ({ checkout: { sessions: { retrieve: async () => session } } });

        await expect(verifyOneTimeOrderPayment({ stripe_session_id: 'cs_1' }, stub({ payment_status: 'paid', status: 'complete' }))).resolves.toBe('paid');
        await expect(verifyOneTimeOrderPayment({ stripe_session_id: 'cs_1' }, stub({ payment_status: 'no_payment_required', status: 'complete' }))).resolves.toBe('paid');
        await expect(verifyOneTimeOrderPayment({ stripe_session_id: 'cs_1' }, stub({ payment_status: 'unpaid', status: 'expired' }))).resolves.toBe('expired');
        await expect(verifyOneTimeOrderPayment({ stripe_session_id: 'cs_1' }, stub({ payment_status: 'unpaid', status: 'open' }))).resolves.toBe('unpaid');
        await expect(verifyOneTimeOrderPayment({ stripe_session_id: null }, stub({}))).resolves.toBe('unknown');
    });
});

function jestSafeResolve() {
    const fn = async (args) => {
        fn.calls.push(args);
    };
    fn.calls = [];
    return fn;
}

function jestSafeReject(message) {
    const fn = async (args) => {
        fn.calls.push(args);
        throw new Error(message);
    };
    fn.calls = [];
    return fn;
}
