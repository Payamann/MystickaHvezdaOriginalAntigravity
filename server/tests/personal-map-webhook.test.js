import { jest } from '@jest/globals';
import Stripe from 'stripe';

// Actual signed webhook + in-memory order/reservation bookkeeping. All delivery
// and lifecycle boundaries are mocked: no provider, email, payment or live DB.
const deliver = jest.fn();
const lifecycle = jest.fn();
const orders = await import('../services/one-time-orders.js');
const markFulfilled = jest.fn(orders.markOneTimeOrderInputFulfilled);
jest.unstable_mockModule('../services/one-time-orders.js', () => ({
    ...orders, markOneTimeOrderInputFulfilled: markFulfilled
}));
jest.unstable_mockModule('../services/one-time-fulfillment.js', () => ({
    fulfillPersonalMapOrder: deliver,
    fulfillOneTimeOrder: ({ orderId }) => deliver({ orderId })
}));
jest.unstable_mockModule('../email-service.js', () => ({
    sendChurnRecoveryEmail: jest.fn(), sendDiscountEmail: jest.fn(), sendEmail: jest.fn(),
    sendOnboardingSequence: jest.fn(), sendPauseEmail: jest.fn(), sendCheckoutRecoveryEmail: jest.fn(),
    sendPaymentRecoverySequence: jest.fn(), sendTrialReminderEmails: jest.fn(), sendUpgradeReminders: jest.fn(),
    sendPersonalMapLifecycleSequence: lifecycle
}));
const { handleStripeWebhook } = await import('../payment.js');
const { reconcileStuckOneTimeOrders } = await import('../jobs/one-time-order-reconciliation.js');
const { supabase } = await import('../db-supabase.js');
let sequence = 0;
const flush = async () => {
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
};

async function fixture() {
    const order = await orders.createOneTimeOrderInput({
        productType: 'personal_map', productId: 'osobni_mapa_2026',
        customerEmail: 'webhook-map@example.com', customerName: 'Testovací osoba',
        payload: { birthDate: '1990-01-01', sign: 'kozoroh', focus: 'Jak si udělat prostor na odpočinek?' }
    });
    const session = {
        id: `cs_test_personal_map_${++sequence}`, mode: 'payment', status: 'complete',
        payment_status: 'paid', amount_total: 29900, currency: 'czk',
        payment_intent: `pi_test_personal_map_${sequence}`,
        metadata: { productType: 'personal_map', productId: 'osobni_mapa_2026', orderId: order.id }
    };
    await orders.attachStripeSessionToOrderInput(order.id, session.id);
    return { order, session };
}

function signedEvent(session, type = 'checkout.session.completed') {
    const raw = JSON.stringify({ id: `evt_test_map_${++sequence}`, type, data: { object: session } });
    return {
        raw: Buffer.from(raw),
        signature: Stripe.webhooks.generateTestHeaderString({ payload: raw, secret: process.env.STRIPE_WEBHOOK_SECRET })
    };
}

async function event(session, type) {
    const { raw, signature } = signedEvent(session, type);
    await handleStripeWebhook(raw, signature);
    await flush();
}

async function deliveredEvents(session) {
    const { data } = await supabase.from('funnel_events').select('*').eq('stripe_session_id', session.id);
    return data.filter(row => row.event_name === 'one_time_pdf_delivered');
}

beforeEach(() => {
    deliver.mockReset().mockResolvedValue({ emailId: 'test-provider-receipt' });
    lifecycle.mockReset().mockResolvedValue({ scheduled: false });
    markFulfilled.mockReset().mockImplementation(orders.markOneTimeOrderInputFulfilled);
});

test('paid signed webhook passes the durable order ID and confirms fulfillment', async () => {
    const { order, session } = await fixture();
    await event(session);
    expect(deliver).toHaveBeenCalledWith({ orderId: order.id });
    expect(await orders.getOneTimeOrderInput(order.id)).toMatchObject({ status: 'fulfilled' });
    expect(await deliveredEvents(session)).toHaveLength(1);
    expect(lifecycle).toHaveBeenCalledWith(expect.objectContaining({ orderId: order.id }));
});

test('unpaid checkout waits for a paid asynchronous success event', async () => {
    const { order, session } = await fixture();
    await event({ ...session, payment_status: 'unpaid' });
    expect(deliver).not.toHaveBeenCalled();
    expect(markFulfilled).not.toHaveBeenCalled();
    expect(lifecycle).not.toHaveBeenCalled();
    expect(await orders.getOneTimeOrderInput(order.id)).toMatchObject({ status: 'checkout_created' });
    const { data } = await supabase.from('one_time_purchases').select('*').eq('stripe_session_id', session.id);
    expect(data).toHaveLength(0);
    await event(session, 'checkout.session.async_payment_succeeded');
    expect(deliver).toHaveBeenCalledTimes(1);
    expect(deliver).toHaveBeenCalledWith({ orderId: order.id });
    expect(await orders.getOneTimeOrderInput(order.id)).toMatchObject({ status: 'fulfilled' });
});

test('completed duplicate and replayed event do not deliver the same order twice', async () => {
    const { session } = await fixture();
    const first = signedEvent(session);
    await handleStripeWebhook(first.raw, first.signature);
    await flush();
    await handleStripeWebhook(first.raw, first.signature);
    await event(session);
    expect(deliver).toHaveBeenCalledTimes(1);
    expect(await deliveredEvents(session)).toHaveLength(1);
});

test('order remains unfulfilled while delivery is still running', async () => {
    const { order, session } = await fixture();
    let finish;
    deliver.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    await event(session);
    expect(deliver).toHaveBeenCalledTimes(1);
    expect(markFulfilled).not.toHaveBeenCalled();
    expect(await deliveredEvents(session)).toHaveLength(0);
    expect(lifecycle).not.toHaveBeenCalled();
    expect(await orders.getOneTimeOrderInput(order.id)).toMatchObject({ status: 'checkout_created' });
    finish({ emailId: 'test-provider-receipt' });
    await flush();
    expect(await orders.getOneTimeOrderInput(order.id)).toMatchObject({ status: 'fulfilled' });
});

test('delivery failure stays retryable and reconciliation receives the same order ID', async () => {
    const { order, session } = await fixture();
    deliver.mockRejectedValueOnce(new Error('Synthetic delivery outage'));
    await event(session);
    expect(await orders.getOneTimeOrderInput(order.id)).toMatchObject({ status: 'checkout_created', retry_count: 1 });
    expect(markFulfilled).not.toHaveBeenCalled();
    expect(await deliveredEvents(session)).toHaveLength(0);
    expect(lifecycle).not.toHaveBeenCalled();
    await supabase.from('one_time_order_inputs').update({
        created_at: new Date(Date.now() - 21 * 60 * 1000).toISOString()
    }).eq('id', order.id);
    await reconcileStuckOneTimeOrders({
        verifyPaymentFn: async row => row.id === order.id ? 'paid' : 'unpaid',
        notifyDeliveryFailures: async () => {}
    });
    expect(deliver).toHaveBeenNthCalledWith(2, { orderId: order.id });
    expect(await orders.getOneTimeOrderInput(order.id)).toMatchObject({ status: 'fulfilled' });
});

test('failed fulfillment write does not report delivery or schedule lifecycle', async () => {
    const { order, session } = await fixture();
    markFulfilled.mockResolvedValueOnce(false);
    await event(session);
    expect(await orders.getOneTimeOrderInput(order.id)).toMatchObject({ status: 'checkout_created', retry_count: 1 });
    expect(await deliveredEvents(session)).toHaveLength(0);
    expect(lifecycle).not.toHaveBeenCalled();
});

test('invalid signature never starts fulfillment', async () => {
    const { session } = await fixture();
    const { raw } = signedEvent(session);
    await expect(handleStripeWebhook(raw, 'invalid-signature')).rejects.toThrow('signature verification failed');
    expect(deliver).not.toHaveBeenCalled();
});

test.each(['session', 'product', 'type'])('paid webhook rejects conflicting durable %s before duplicate handling', async kind => {
    const { order, session } = await fixture();
    const conflict = kind === 'session' ? { stripe_session_id: 'cs_test_other_session' }
        : kind === 'product' ? { product_id: 'different_product' }
            : { product_type: 'rocni_horoskop' };
    await supabase.from('one_time_order_inputs').update({ ...conflict, status: 'fulfilled' }).eq('id', order.id);
    await expect(event(session)).rejects.toThrow('Invalid paid personal map order');
    expect(deliver).not.toHaveBeenCalled();
    expect(markFulfilled).not.toHaveBeenCalled();
    expect(lifecycle).not.toHaveBeenCalled();
});
