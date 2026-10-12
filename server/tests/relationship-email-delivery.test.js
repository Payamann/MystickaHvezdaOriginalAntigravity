import { jest } from '@jest/globals';
import { randomUUID } from 'node:crypto';
import { supabase } from '../db-supabase.js';
import { createRelationshipEmailDelivery, relationshipDeliveryState } from '../services/relationship-email-delivery.js';
import { createRelationshipFulfillment } from '../services/relationship-tarot-fulfillment.js';
import { markOneTimeOrderInputFulfilled } from '../services/one-time-orders.js';

const paragraph = 'Vrať se ke konkrétní otázce a pojmenuj jednu vlastní potřebu. Karta nabízí symbolický podnět, nikoli důkaz o druhém člověku.';
const reading = { introduction: paragraph, cards: [paragraph, paragraph, paragraph], connection: paragraph, nextStep: paragraph, questions: ['Co chceš dnes pojmenovat?', 'Jaký krok má pro tebe smysl?', 'Podle čeho poznáš posun?'] };
const event = (emailId, type = 'email.delivered', time = '2026-10-11T09:00:00Z') => ({ type, created_at: time, data: { email_id: emailId, to: ['private@example.com'], subject: 'PRIVATE_QUESTION' } });

test('out-of-order events cannot downgrade delivered status; same-rank events use event time', () => {
    const order = { email_id: 'email-1', email_sent_at: '2026-10-11T08:00:00Z' };
    const rows = ['email.delivered', 'email.delivery_delayed', 'email.sent'].map((event_type, i) => ({ email_id: 'email-1', event_type, event_at: `2026-10-11T09:0${i}:00Z` }));
    expect(relationshipDeliveryState(order, rows).status).toBe('delivered');
    expect(relationshipDeliveryState(order, rows.reverse()).status).toBe('delivered');
    expect(relationshipDeliveryState(order, [{ email_id: 'other', event_type: 'email.bounced', event_at: '2026-10-11T10:00:00Z' }]).status).toBe('sent');
    expect(relationshipDeliveryState({}).status).toBe('unknown');
});

test('callback arriving before send response is preserved, then correlated without storing personal content', async () => {
    const id = randomUUID();
    const emailId = `email-${id}`;
    const delivery = createRelationshipEmailDelivery();
    await delivery.recordEvent(event(emailId), `msg-${id}`);
    await supabase.from('one_time_order_inputs').insert({ id, product_type: 'relationship_tarot' });
    await delivery.recordAccepted(id, emailId);
    const { data: order } = await supabase.from('one_time_order_inputs').select('*').eq('id', id).maybeSingle();
    const { data: events } = await supabase.from('relationship_email_events').select('*').eq('email_id', emailId);
    expect(relationshipDeliveryState(order, events).status).toBe('delivered');
    expect(JSON.stringify(events)).not.toMatch(/private@example|PRIVATE_QUESTION/);
});

test('duplicate unique event is accepted and does not require a second insert', async () => {
    const insert = jest.fn(async () => ({ error: { code: '23505' } }));
    const db = { from: name => name === 'relationship_email_events' ? { insert } : { select: () => ({ order: () => ({ limit: () => ({ eq: async () => ({ data: [], error: null }) }) }) }) } };
    const result = await createRelationshipEmailDelivery({ db }).recordEvent(event('email-duplicate'), 'msg-duplicate');
    expect(result).toEqual({ recorded: true, duplicate: true });
});

test('database failure is retryable and invalid callbacks are rejected before writes', async () => {
    const insert = jest.fn(async () => ({ error: { code: 'DB_DOWN' } }));
    const delivery = createRelationshipEmailDelivery({ db: { from: () => ({ insert }) } });
    await expect(delivery.recordEvent(event('email-1'), 'msg-1')).rejects.toThrow('Could not save email delivery event');
    await expect(delivery.recordEvent({ ...event('email-1'), created_at: 'invalid' }, 'msg-2')).rejects.toThrow('Invalid email delivery event');
    expect(insert).toHaveBeenCalledTimes(1);
});

test('delivery failure alerts contain no customer content and failed alerts remain pending for recovery', async () => {
    const id = randomUUID();
    const emailId = `email-${id}`;
    await supabase.from('one_time_order_inputs').insert({ id, product_type: 'relationship_tarot', email_id: emailId });
    const alert = jest.fn().mockResolvedValueOnce({ sent: false, reason: 'disabled' }).mockResolvedValue({ sent: true });
    const delivery = createRelationshipEmailDelivery({ alert });
    await delivery.recordEvent(event(emailId, 'email.bounced', new Date().toISOString()), `msg-${id}`);
    let record = (await supabase.from('relationship_email_events').select('*').eq('event_id', `msg-${id}`).maybeSingle()).data;
    expect(record.alert_pending).toBe(true);
    await delivery.notifyFailures(emailId);
    record = (await supabase.from('relationship_email_events').select('*').eq('event_id', `msg-${id}`).maybeSingle()).data;
    expect(record.alert_pending).toBe(false);
    expect(JSON.stringify(alert.mock.calls)).not.toMatch(/private@example|PRIVATE_QUESTION/);
    await delivery.notifyFailures(emailId);
    expect(alert).toHaveBeenCalledTimes(2);
});

test('saved provider ID prevents resending if fulfillment confirmation failed', async () => {
    const generate = jest.fn();
    const send = jest.fn();
    const getOrder = async () => ({ product_type: 'relationship_tarot', customer_email: 'buyer@example.com', email_id: 'saved-email', payload: { question: 'A private question', cards: [{}, {}, {}], reading } });
    await createRelationshipFulfillment({ getOrder, generate, send })({ orderId: 'order-1' });
    expect(generate).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
});

test('missing provider ID or failed receipt persistence cannot report successful fulfillment', async () => {
    const getOrder = async () => ({ product_type: 'relationship_tarot', customer_email: 'buyer@example.com', payload: { question: 'A private question', cards: [{}, {}, {}], reading } });
    const missingId = createRelationshipFulfillment({ getOrder, send: async () => ({ success: true }) });
    await expect(missingId({ orderId: 'order-1' })).rejects.toThrow('Missing relationship email provider ID');
    const delivery = { recordAccepted: jest.fn(async () => { throw new Error('receipt write failed'); }) };
    const send = jest.fn(async () => ({ emailId: 'email-accepted' }));
    const failed = createRelationshipFulfillment({ getOrder, send, delivery });
    await expect(failed({ orderId: 'order-1' })).rejects.toThrow('receipt write failed');
    expect(delivery.recordAccepted).toHaveBeenCalledWith('order-1', 'email-accepted');
});

test('a missing order does not report a successful fulfillment write', async () => {
    await expect(markOneTimeOrderInputFulfilled(randomUUID())).resolves.toBe(false);
});

test('a saved email identifier cannot be reassigned to a different email', async () => {
    const id = randomUUID();
    await supabase.from('one_time_order_inputs').insert({ id, product_type: 'relationship_tarot', email_id: 'original-email' });
    const delivery = createRelationshipEmailDelivery();
    await expect(delivery.recordAccepted(id, 'different-email')).rejects.toThrow('provider ID mismatch');
    await expect(delivery.recordAccepted(id, 'original-email')).resolves.toBeUndefined();
});

test('unrelated failures cannot fill the alert batch before a paid reading failure', async () => {
    const id = randomUUID();
    const alert = jest.fn(async () => ({ sent: true }));
    const delivery = createRelationshipEmailDelivery({ alert });
    for (let i = 0; i < 51; i++) {
        await supabase.from('relationship_email_events').insert({ event_id: `unrelated-${id}-${i}`, email_id: `other-${id}-${i}`, event_type: 'email.bounced', event_at: '2026-10-11T08:00:00Z', alert_pending: true, alert_claim: 'idle' });
    }
    // A failure arrived before the provider response; no alert yet.
    await delivery.recordEvent(event(`paid-${id}`, 'email.bounced'), `paid-event-${id}`);
    expect(alert).not.toHaveBeenCalled();
    await supabase.from('one_time_order_inputs').insert({ id, product_type: 'relationship_tarot' });
    await delivery.recordAccepted(id, `paid-${id}`);
    await delivery.notifyFailures();
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0][1].metadata.orderId).toBe(id);
});

test('concurrent workers reserve the same pending alert only once', async () => {
    const id = randomUUID();
    const emailId = `email-${id}`;
    await supabase.from('one_time_order_inputs').insert({ id, product_type: 'relationship_tarot', email_id: emailId });
    await supabase.from('relationship_email_events').insert({ event_id: `msg-${id}`, email_id: emailId, event_type: 'email.bounced', event_at: new Date().toISOString(), alert_pending: true, alert_claim: 'idle' });
    let finish;
    const held = new Promise(resolve => { finish = resolve; });
    const alert = jest.fn(() => held);
    const first = createRelationshipEmailDelivery({ alert }).notifyFailures(emailId);
    const second = createRelationshipEmailDelivery({ alert }).notifyFailures(emailId);
    await new Promise(resolve => setImmediate(resolve));
    expect(alert).toHaveBeenCalledTimes(1);
    finish({ sent: true });
    await Promise.all([first, second]);
});

test('a crashed worker claim expires and is retried', async () => {
    const id = randomUUID();
    await supabase.from('one_time_order_inputs').insert({ id, product_type: 'relationship_tarot', email_id: `email-${id}` });
    await supabase.from('relationship_email_events').insert({ event_id: `msg-${id}`, email_id: `email-${id}`, event_type: 'email.failed', event_at: new Date().toISOString(), alert_pending: true, alert_claim: 'crashed-worker', alert_claim_until: new Date(Date.now() - 10000).toISOString() });
    const alert = jest.fn(async () => ({ sent: true }));
    await createRelationshipEmailDelivery({ alert }).notifyFailures(`email-${id}`);
    expect(alert).toHaveBeenCalledTimes(1);
});
