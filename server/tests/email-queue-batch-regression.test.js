import { jest } from '@jest/globals';
import { supabase } from '../db-supabase.js';
import { processEmailQueue, getEmailQueueRuntimeStatus, getEmailQueueHealth,
    getQueuedEmailExpiryReason } from '../jobs/email-queue.js';

// These tests exercise the real batch loop, not only its helper functions.
// setup.mjs forces the in-memory database; injected providers never send mail.
const firstId = 'batch-regression-first';
const secondId = 'batch-regression-second';

async function seedBatch(retryCount = 0) {
    await supabase.from('email_queue').insert([
        { id: firstId, email_to: 'first@example.invalid', template: 'payment_recovery',
            status: 'pending', scheduled_for: '2020-01-01T00:00:00Z',
            retry_count: retryCount, max_retries: 3, data: {} },
        { id: secondId, email_to: 'second@example.invalid', template: 'payment_recovery',
            status: 'pending', scheduled_for: '2020-01-02T00:00:00Z',
            retry_count: 0, max_retries: 3, data: {} }
    ]);
}

async function readRow(id) {
    const { data, error } = await supabase.from('email_queue').select('*').eq('id', id).maybeSingle();
    expect(error).toBeNull();
    return data;
}

afterEach(async () => {
    jest.restoreAllMocks();
    await supabase.from('email_queue').delete().in('id', [firstId, secondId]);
});

test.each([
    ['transient provider failure', 'Provider unavailable', 0, 'pending', 1],
    ['permanent invalid recipient', 'Invalid `to` field', 0, 'failed', 1],
    ['exhausted retries', 'Provider unavailable', 2, 'failed', 3]
])('%s persists the failure and continues to the next email', async (_name, message, retries, status, expectedRetries) => {
    await seedBatch(retries);
    const sendEmail = jest.fn()
        .mockRejectedValueOnce(new Error(message))
        .mockResolvedValueOnce({ emailId: 'provider-second' });

    await processEmailQueue({ sendEmail });

    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(await readRow(firstId)).toMatchObject({ status, retry_count: expectedRetries, last_error: message });
    expect(await readRow(secondId)).toMatchObject({ status: 'sent', email_id: 'provider-second' });
    expect(getEmailQueueRuntimeStatus()).toMatchObject({
        status: 'idle', lastBatchSize: 2, lastSent: 1, lastFailed: 1
    });
    expect(getEmailQueueRuntimeStatus().lastErrorCode).not.toBe('queue_run_failed');
});

test('a timeout persists a retry and does not prevent the next email from sending', async () => {
    await seedBatch();
    const sendEmail = jest.fn()
        .mockImplementationOnce(() => new Promise(() => {}))
        .mockResolvedValueOnce({ emailId: 'provider-second' });
    await processEmailQueue({ sendEmail, sendTimeoutMs: 10 });
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(await readRow(firstId)).toMatchObject({ status: 'pending', retry_count: 1 });
    expect(await readRow(secondId)).toMatchObject({ status: 'sent' });
    expect(getEmailQueueRuntimeStatus().lastErrorCode).toBe('email_send_timeout');
});

test('a later batch retries only the pending email with the same provider idempotency key', async () => {
    await seedBatch();
    const sendEmail = jest.fn()
        .mockRejectedValueOnce(new Error('Provider unavailable'))
        .mockResolvedValue({ emailId: 'provider-success' });
    await processEmailQueue({ sendEmail });
    await processEmailQueue({ sendEmail });
    expect(sendEmail).toHaveBeenCalledTimes(3);
    expect(sendEmail.mock.calls[2][0].to).toBe('first@example.invalid');
    expect(sendEmail.mock.calls[2][1]).toEqual(sendEmail.mock.calls[0][1]);
    expect(await readRow(firstId)).toMatchObject({ status: 'sent', retry_count: 1 });
    expect(getEmailQueueRuntimeStatus()).toMatchObject({ lastSent: 1, lastFailed: 0, lastErrorCode: null });
});

test('failure to persist sent state stays visible and does not abort the batch', async () => {
    await seedBatch();
    const originalFrom = supabase.from.bind(supabase);
    let failNextSentWrite = true;
    jest.spyOn(supabase, 'from').mockImplementation((table) => {
        const query = originalFrom(table);
        if (table !== 'email_queue') return query;
        const originalUpdate = query.update.bind(query);
        query.update = (fields) => {
            originalUpdate(fields);
            if (fields.status === 'sent' && failNextSentWrite) {
                failNextSentWrite = false;
                query.maybeSingle = async () => ({ data: null, error: { message: 'Database unavailable' } });
            }
            return query;
        };
        return query;
    });
    const sendEmail = jest.fn().mockResolvedValue({ emailId: 'provider-success' });
    await processEmailQueue({ sendEmail });
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(await readRow(firstId)).toMatchObject({ status: 'pending', retry_count: 0 });
    expect(await readRow(secondId)).toMatchObject({ status: 'sent' });
    expect(getEmailQueueRuntimeStatus().lastErrorCode).toBe('queue_persistence_failed');
});

test('an obsolete weekly digest is retained as skipped while an old transactional email still sends', async () => {
    await seedBatch();
    await supabase.from('email_queue').update({ template: 'newsletter_weekly_digest' }).eq('id', firstId);
    const sendEmail = jest.fn().mockResolvedValue({ emailId: 'provider-transactional' });
    await processEmailQueue({ sendEmail });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0].to).toBe('second@example.invalid');
    expect(await readRow(firstId)).toMatchObject({
        status: 'skipped', retry_count: 0,
        last_error: 'Skipped without sending (expired_weekly_digest).'
    });
    expect((await readRow(firstId)).sent_at).toBeUndefined();
    expect(await readRow(secondId)).toMatchObject({ status: 'sent' });
    expect(getEmailQueueRuntimeStatus()).toMatchObject({ lastSkipped: 1, lastSent: 1, lastFailed: 0 });
});

test('a current weekly digest is delivered', async () => {
    await seedBatch();
    await supabase.from('email_queue').update({ template: 'newsletter_weekly_digest',
        scheduled_for: new Date(Date.now() - 1000).toISOString() }).eq('id', firstId);
    const sendEmail = jest.fn().mockResolvedValue({ emailId: 'provider-success' });
    await processEmailQueue({ sendEmail });
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(await readRow(firstId)).toMatchObject({ status: 'sent' });
});

test('weekly expiry has an explicit seven-day boundary and does not expire other templates', () => {
    const scheduled_for = '2026-08-26T12:00:00Z';
    const boundary = Date.parse('2026-09-02T12:00:00Z');
    const record = { template: 'newsletter_weekly_digest', scheduled_for };
    expect(getQueuedEmailExpiryReason(record, boundary - 1)).toBeNull();
    expect(getQueuedEmailExpiryReason(record, boundary)).toBe('expired_weekly_digest');
    expect(getQueuedEmailExpiryReason({ ...record, scheduled_for: 'invalid' }, boundary)).toBe('invalid_newsletter_schedule');
    expect(getQueuedEmailExpiryReason({ ...record, template: 'payment_recovery' }, boundary)).toBeNull();
});

test.each([
    [{ status: 'disabled' }, 'disabled'],
    [{ status: 'waiting' }, 'ok'],
    [{ status: 'idle', lastFailed: 0, lastErrorCode: null }, 'ok'],
    [{ status: 'idle', lastFailed: 1 }, 'degraded'],
    [{ status: 'idle', lastFailed: 0, lastErrorCode: 'queue_fetch_failed' }, 'degraded'],
    [{ status: 'running', lastFailed: 1 }, 'degraded']
])('queue health evaluates %j as %s', (runtime, health) => {
    expect(getEmailQueueHealth(runtime)).toBe(health);
});
