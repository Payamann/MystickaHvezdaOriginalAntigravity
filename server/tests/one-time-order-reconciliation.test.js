import { randomUUID } from 'node:crypto';
import { reconcileStuckOneTimeOrders } from '../jobs/one-time-order-reconciliation.js';
import { listStuckOneTimeOrderInputs, getOneTimeOrderInput } from '../services/one-time-orders.js';
import { supabase } from '../db-supabase.js';

const TWENTY_ONE_MINUTES_AGO = () => new Date(Date.now() - 21 * 60 * 1000).toISOString();
const FIVE_MINUTES_AGO = () => new Date(Date.now() - 5 * 60 * 1000).toISOString();

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
        created_at: now,
        updated_at: now,
        ...overrides
    });
    return id;
}

// fulfillFn is injected (mirrors the fetchImpl seam in services/alerts.js) so
// these tests exercise the job's own retry/exhaustion bookkeeping without
// making real Claude/Playwright/Resend calls for every order in the table.
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

    test('recovers a stuck order and marks it fulfilled when fulfillment succeeds', async () => {
        const orderId = await insertOrder({ created_at: TWENTY_ONE_MINUTES_AGO() });
        const fulfillFn = jestSafeResolve();

        await reconcileStuckOneTimeOrders({ fulfillFn });

        expect(fulfillFn.calls.length).toBeGreaterThanOrEqual(1);
        const call = fulfillFn.calls.find((args) => args.customerEmail?.includes(orderId));
        expect(call).toMatchObject({ productType: 'personal_map', customerName: 'Testovaci Osoba' });

        await expect(getOneTimeOrderInput(orderId)).resolves.toMatchObject({
            id: orderId,
            status: 'fulfilled'
        });
    });

    test('a failed retry increments retry_count and leaves the order retryable', async () => {
        const orderId = await insertOrder({ created_at: TWENTY_ONE_MINUTES_AGO(), retry_count: 0 });
        const fulfillFn = jestSafeReject('boom');

        await reconcileStuckOneTimeOrders({ fulfillFn });

        const { data } = await supabase
            .from('one_time_order_inputs')
            .select('*')
            .eq('id', orderId)
            .maybeSingle();

        expect(data).toMatchObject({ status: 'checkout_created' });
        expect(data.retry_count).toBeGreaterThanOrEqual(1);
        expect(data.last_error).toBe('boom');
    });

    test('exhausting the retry budget marks the order failed', async () => {
        const orderId = await insertOrder({ created_at: TWENTY_ONE_MINUTES_AGO(), retry_count: 2 });
        const fulfillFn = jestSafeReject('still broken');

        await reconcileStuckOneTimeOrders({ fulfillFn });

        const { data } = await supabase
            .from('one_time_order_inputs')
            .select('*')
            .eq('id', orderId)
            .maybeSingle();

        expect(data).toMatchObject({ status: 'failed', retry_count: 3 });
    });

    test('does not touch orders that are still within the grace window', async () => {
        const orderId = await insertOrder({ created_at: FIVE_MINUTES_AGO() });
        const fulfillFn = jestSafeReject('should never be called for this order');

        await reconcileStuckOneTimeOrders({ fulfillFn });

        const { data } = await supabase
            .from('one_time_order_inputs')
            .select('*')
            .eq('id', orderId)
            .maybeSingle();

        expect(data).toMatchObject({ status: 'checkout_created', retry_count: 0 });
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
