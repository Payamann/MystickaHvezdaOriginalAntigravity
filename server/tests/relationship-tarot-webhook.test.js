import { jest } from '@jest/globals';
import Stripe from 'stripe';

const deliver = jest.fn(async () => {});
jest.unstable_mockModule('../services/relationship-tarot-fulfillment.js', () => ({ fulfillRelationshipTarotOrder: deliver }));
const { handleStripeWebhook } = await import('../payment.js');
const { createOneTimeOrderInput, attachStripeSessionToOrderInput, getOneTimeOrderInput } = await import('../services/one-time-orders.js');
const { supabase } = await import('../db-supabase.js');
let sequence = 0;

async function makeSession() {
    const order = await createOneTimeOrderInput({ productType: 'relationship_tarot', productId: 'relationship_tarot', customerEmail: 'webhook@example.com', customerName: '', payload: { question: 'Jak začít rozhovor o společném čase?' } });
    const session = { id: `cs_test_relationship_${++sequence}`, mode: 'payment', status: 'complete', payment_status: 'paid', amount_total: 14900, currency: 'czk', payment_intent: `pi_relationship_${sequence}`,
        metadata: { productType: 'relationship_tarot', productId: 'relationship_tarot', orderId: order.id, source: 'tarot_yes_no_result' } };
    await attachStripeSessionToOrderInput(order.id, session.id);
    return { order, session };
}

async function event(session, type = 'checkout.session.completed') {
    const payload = JSON.stringify({ id: `evt_relationship_${++sequence}`, type, data: { object: session } });
    const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });
    await handleStripeWebhook(Buffer.from(payload), signature);
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
}

beforeEach(() => deliver.mockClear());
test('signed paid webhook records revenue, delivers once and marks fulfillment', async () => {
    const { order, session } = await makeSession();
    await event(session);
    expect(deliver).toHaveBeenCalledWith({ orderId: order.id });
    expect((await getOneTimeOrderInput(order.id)).status).toBe('fulfilled');
    const { data } = await supabase.from('one_time_purchases').select('*').eq('stripe_session_id', session.id).maybeSingle();
    expect(data).toMatchObject({ product_id: 'relationship_tarot', amount_total: 14900 });
    await event(session);
    expect(deliver).toHaveBeenCalledTimes(1);
});
test('delayed unpaid checkout waits for the successful payment event', async () => {
    const { order, session } = await makeSession();
    await event({ ...session, payment_status: 'unpaid' });
    expect(deliver).not.toHaveBeenCalled();
    expect((await getOneTimeOrderInput(order.id)).status).toBe('checkout_created');
    await event(session, 'checkout.session.async_payment_succeeded');
    expect(deliver).toHaveBeenCalledTimes(1);
});
test('underpayment never starts delivery', async () => {
    const { session } = await makeSession();
    await expect(event({ ...session, amount_total: 1 })).rejects.toThrow('Invalid paid relationship');
    expect(deliver).not.toHaveBeenCalled();
});
test('delivery outage stays retryable and is recorded', async () => {
    const { order, session } = await makeSession();
    deliver.mockRejectedValueOnce(new Error('Test provider outage'));
    await event(session);
    const { data } = await supabase.from('one_time_order_inputs').select('*').eq('id', order.id).maybeSingle();
    expect(data.status).toBe('checkout_created');
    expect(data.retry_count).toBe(1);
});
