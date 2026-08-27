import { readFileSync } from 'node:fs';
import { jest } from '@jest/globals';
import {
    buildQueuedEmailIdempotencyKey,
    deactivateInvalidRecipient,
    getTemplatePreferenceCategory,
    isPermanentDeliveryFailure,
    isPermanentRecipientError,
    isReservedTestRecipient,
    parseQueuedEmailData,
    processEmailQueue,
    scheduleEmailLater,
    shouldSkipQueuedEmailForPreferences,
    shouldSkipQueuedEmailForPremium,
    updateEmailQueueStatus
} from '../jobs/email-queue.js';
import { supabase } from '../db-supabase.js';

function createDbQuery(result) {
    const query = {
        insert: jest.fn(() => query),
        update: jest.fn(() => query),
        select: jest.fn(() => query),
        eq: jest.fn(() => query),
        in: jest.fn(() => query),
        limit: jest.fn(() => query),
        maybeSingle: jest.fn(() => Promise.resolve(result)),
        then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
    };
    return query;
}

function createSequencedDbClient(responses) {
    const remaining = [...responses];
    return {
        from: jest.fn(() => createDbQuery(remaining.shift() || { data: null, error: null, count: 0 }))
    };
}

describe('email queue helpers', () => {
    // Bez tohoto rozlišení se neplatná adresa zkouší při každé rozesílce znovu
    // a selhání se hromadí donekonečna (120 za 6 dní na produkci).
    test('rozpozna trvale neplatneho prijemce', () => {
        expect(isPermanentRecipientError('Invalid `to` field. Please use our testing email address instead of domains like `example.com`.')).toBe(true);
        expect(isPermanentRecipientError('Invalid `to` field. The email address needs to follow the `email@example.com` format.')).toBe(true);
    });

    test('docasne chyby se maji zkouset dal', () => {
        expect(isPermanentRecipientError('fetch failed')).toBe(false);
        expect(isPermanentRecipientError('Too many requests')).toBe(false);
        expect(isPermanentRecipientError('Internal server error')).toBe(false);
        expect(isPermanentRecipientError('')).toBe(false);
        expect(isPermanentRecipientError(null)).toBe(false);
    });

    test('Resend test-domain rejection is terminal only for reserved addresses', () => {
        const message = 'You can only send testing emails to your own email address';

        expect(isReservedTestRecipient('seed@example.com')).toBe(true);
        expect(isReservedTestRecipient('seed@example.net')).toBe(true);
        expect(isReservedTestRecipient('real@example.cz')).toBe(false);
        expect(isPermanentDeliveryFailure(message, 'seed@example.com')).toBe(true);
        expect(isPermanentDeliveryFailure(message, 'real@example.cz')).toBe(false);
    });

    test('weekly digest never queues an RFC-reserved placeholder address', async () => {
        await expect(scheduleEmailLater({
            email: 'seed@example.com',
            template: 'newsletter_weekly_digest',
            data: {},
            dedupeKey: 'newsletter_digest:seed@example.com:2026-W33'
        })).resolves.toMatchObject({
            success: true,
            skipped: true,
            reason: 'reserved_test_recipient'
        });
    });

    test('parses both historical JSON strings and Supabase JSONB objects', () => {
        expect(parseQueuedEmailData('{"plan":"pruvodce"}')).toEqual({ plan: 'pruvodce' });
        expect(parseQueuedEmailData({ plan: 'vip' })).toEqual({ plan: 'vip' });
        expect(parseQueuedEmailData(null)).toEqual({});
        expect(parseQueuedEmailData('not-json')).toEqual({});
    });

    test('builds a deterministic bounded provider idempotency key', () => {
        const data = { dedupeKey: `invoice:${'x'.repeat(1000)}` };
        const first = buildQueuedEmailIdempotencyKey({
            id: 'queue-row-1',
            email_to: 'Customer@Example.cz',
            template: 'payment_recovery',
            data
        });
        const sameLogicalEmail = buildQueuedEmailIdempotencyKey({
            id: 'different-row',
            email_to: 'customer@example.cz',
            template: 'payment_recovery',
            data
        });
        const fallback = buildQueuedEmailIdempotencyKey({
            id: 'queue-row-1',
            email_to: 'customer@example.cz',
            template: 'feature_weekly',
            data: {}
        });

        expect(first).toBe(sameLogicalEmail);
        expect(first.length).toBeLessThanOrEqual(256);
        expect(fallback).toBe(buildQueuedEmailIdempotencyKey({ id: 'queue-row-1', data: {} }));
        expect(fallback).not.toBe(buildQueuedEmailIdempotencyKey({ id: 'queue-row-2', data: {} }));
    });

    test('queue forwards its deterministic idempotency key to sendEmail', async () => {
        const email = `queue-idempotency-${Date.now()}@mystickahvezda.cz`;
        const dedupeKey = `payment_recovery:in_${Date.now()}:stage1`;
        await supabase.from('email_queue').insert({
            email_to: email,
            template: 'payment_recovery',
            data: { dedupeKey, stage: 1 },
            dedupe_key: dedupeKey,
            scheduled_for: new Date(Date.now() - 1000).toISOString(),
            status: 'pending',
            retry_count: 0
        });
        const sendEmail = jest.fn().mockResolvedValue({ emailId: 'email_idempotent_1' });

        await processEmailQueue({ sendEmail });

        const expectedKey = buildQueuedEmailIdempotencyKey({
            email_to: email,
            template: 'payment_recovery',
            dedupe_key: dedupeKey,
            data: { dedupeKey, stage: 1 }
        });
        expect(sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: email,
                template: 'payment_recovery'
            }),
            { idempotencyKey: expectedKey }
        );
    });

    test('database unique conflict is returned as an existing scheduled email', async () => {
        const email = 'atomic-dedupe@mystickahvezda.cz';
        const dedupeKey = 'payment_recovery:in_atomic:stage1';
        const client = createSequencedDbClient([
            { data: [], error: null },
            {
                data: null,
                error: {
                    code: '23505',
                    message: 'duplicate key value violates unique constraint "email_queue_recipient_template_dedupe_uidx"'
                }
            },
            {
                data: [{
                    id: 'existing-atomic-email',
                    email_to: email,
                    scheduled_for: '2026-08-15T10:00:00.000Z',
                    status: 'pending',
                    dedupe_key: dedupeKey
                }],
                error: null
            }
        ]);

        await expect(scheduleEmailLater({
            email,
            template: 'payment_recovery',
            data: { dedupeKey },
            dedupeKey
        }, client)).resolves.toMatchObject({
            success: true,
            skipped: true,
            existingId: 'existing-atomic-email',
            reason: 'dedupe_unique_conflict'
        });
    });

    test('missing dedupe column preserves recovery mail with provider idempotency', async () => {
        const client = createSequencedDbClient([
            { data: [], error: null },
            {
                data: null,
                error: {
                    code: 'PGRST204',
                    message: "Could not find the 'dedupe_key' column of 'email_queue' in the schema cache"
                }
            },
            { data: [], error: null },
            {
                data: { id: 'legacy-provider-idempotent-row', scheduled_for: '2026-08-15T10:00:00.000Z' },
                error: null
            }
        ]);

        await expect(scheduleEmailLater({
            email: 'migration-required@mystickahvezda.cz',
            template: 'payment_recovery',
            data: { dedupeKey: 'payment_recovery:in_missing:stage1' },
            dedupeKey: 'payment_recovery:in_missing:stage1'
        }, client)).resolves.toMatchObject({
            success: true,
            skipped: false,
            existingId: 'legacy-provider-idempotent-row',
            reason: 'legacy_schema_provider_idempotency'
        });
        expect(client.from).toHaveBeenCalledTimes(4);
    });

    test('dedupe treats a permanently failed email as already scheduled', async () => {
        const email = `failed-dedupe-${Date.now()}@example.com`;
        const dedupeKey = `payment-recovery:${Date.now()}:day1`;
        await supabase.from('email_queue').insert({
            email_to: email,
            template: 'payment_recovery_day1',
            data: { dedupeKey },
            scheduled_for: new Date(Date.now() - 60_000).toISOString(),
            status: 'failed',
            retry_count: 1
        });

        await expect(scheduleEmailLater({
            email,
            template: 'payment_recovery_day1',
            data: { dedupeKey },
            dedupeKey
        })).resolves.toMatchObject({
            success: true,
            skipped: true
        });

        const { data: matchingRows } = await supabase
            .from('email_queue')
            .select('*')
            .eq('email_to', email)
            .eq('template', 'payment_recovery_day1');
        expect(matchingRows).toHaveLength(1);
        expect(matchingRows[0].status).toBe('failed');
    });

    test.each(['sent', 'skipped', 'failed'])(
        'surfaces a database error while persisting terminal status %s',
        async (status) => {
            const client = createSequencedDbClient([
                { data: null, error: { message: 'database write unavailable' } }
            ]);

            await expect(updateEmailQueueStatus('queue-db-error', status, {}, client)).rejects.toMatchObject({
                name: 'EmailQueuePersistenceError',
                operation: `mark_${status}`,
                recordId: 'queue-db-error'
            });
        }
    );

    test('deactivation checks update errors across both subscription tables', async () => {
        const client = createSequencedDbClient([
            { data: null, error: { message: 'newsletter update failed' } },
            { data: null, error: null },
            { data: null, error: null, count: 0 }
        ]);

        await expect(deactivateInvalidRecipient(
            'invalid@example.com',
            'Invalid `to` field',
            client
        )).rejects.toThrow(/newsletter_subscribers update: newsletter update failed/);
        expect(client.from).toHaveBeenCalledTimes(3);
        expect(console.error).toHaveBeenCalledWith(
            '[JOB][OPERATIONAL] Invalid recipient deactivation incomplete:',
            expect.objectContaining({ failures: expect.any(Array) })
        );
    });

    test('deactivation verifies no active subscription row remains', async () => {
        const client = createSequencedDbClient([
            { data: null, error: null },
            { data: null, error: null, count: 1 },
            { data: null, error: null },
            { data: null, error: null, count: 0 }
        ]);

        await expect(deactivateInvalidRecipient(
            'still-active@example.com',
            'Invalid `to` field',
            client
        )).rejects.toThrow(/newsletter_subscribers verification: 1 active row/);
        expect(client.from).toHaveBeenCalledTimes(4);
    });

    test('skipped status migration safely replaces the historical status check', () => {
        const sql = readFileSync(
            new URL('../../migrations/20260814_allow_email_queue_skipped_status.sql', import.meta.url),
            'utf8'
        );

        expect(sql).toContain("'pending', 'sent', 'skipped', 'failed'");
        expect(sql).toContain("status_column.attnum = ANY (constraint_row.conkey)");
        expect(sql).toMatch(/CHECK[\s\S]+NOT VALID/);
        expect(sql).toContain('VALIDATE CONSTRAINT email_queue_status_check');
    });

    test('atomic dedupe migration backfills and neutralizes existing duplicates', () => {
        const sql = readFileSync(
            new URL('../../migrations/20260815_email_queue_atomic_dedupe.sql', import.meta.url),
            'utf8'
        );

        expect(sql).toContain('ADD COLUMN IF NOT EXISTS dedupe_key TEXT');
        expect(sql).toContain("data ->> 'dedupeKey'");
        expect(sql).toContain('ROW_NUMBER() OVER');
        expect(sql).toContain("WHEN queue_row.status = 'pending' THEN 'skipped'");
        expect(sql).toContain("CONCAT('legacy-duplicate:', queue_row.id)");
        expect(sql).toContain('email_queue_recipient_template_dedupe_uidx');
        expect(sql).toContain('LOWER(email_to), template, dedupe_key');
    });

    test('detects premium users for gated queued emails', async () => {
        const userId = `premium-email-skip-${Date.now()}`;
        await supabase.from('users').insert({
            id: userId,
            email: `${userId}@example.com`,
            is_premium: true
        });

        await expect(shouldSkipQueuedEmailForPremium(
            { id: 'queued-skip-test', user_id: userId },
            { skipIfPremium: true }
        )).resolves.toBe(true);

        await expect(shouldSkipQueuedEmailForPremium(
            { id: 'queued-no-flag-test', user_id: userId },
            { skipIfPremium: false }
        )).resolves.toBe(false);
    });

    test('skips premium-gated queued email before sending', async () => {
        const userId = `premium-process-skip-${Date.now()}`;
        const email = `${userId}@example.com`;
        await supabase.from('users').insert({
            id: userId,
            email,
            is_premium: true
        });
        await supabase.from('email_queue').insert({
            user_id: userId,
            email_to: email,
            template: 'activation_one_time_offer_day6',
            data: {
                skipIfPremium: true,
                dedupeKey: `activation:${userId}:day6`
            },
            scheduled_for: new Date(Date.now() - 1000).toISOString(),
            status: 'pending',
            retry_count: 0
        });

        await processEmailQueue();

        const { data: queued } = await supabase
            .from('email_queue')
            .select('*')
            .eq('email_to', email)
            .maybeSingle();

        expect(queued).toMatchObject({
            status: 'skipped',
            last_error: 'Skipped because the current subscription state no longer matches this email.'
        });
    });

    test('skips a recovery email after the subscription leaves a recoverable state', async () => {
        const userId = `recovery-state-skip-${Date.now()}`;
        await supabase.from('users').insert({
            id: userId,
            email: `${userId}@example.com`,
            is_premium: false
        });
        await supabase.from('subscriptions').upsert({
            user_id: userId,
            plan_type: 'premium_monthly',
            status: 'cancelled'
        }, { onConflict: 'user_id' });

        await expect(shouldSkipQueuedEmailForPremium(
            { id: 'queued-recovery-test', user_id: userId },
            { requiredSubscriptionStatuses: ['past_due', 'unpaid', 'incomplete'] }
        )).resolves.toBe(true);
    });

    test('maps marketing templates to preference categories and leaves transactional unmapped', () => {
        expect(getTemplatePreferenceCategory('upgrade_reminder_day3')).toBe('upgrade_reminders');
        expect(getTemplatePreferenceCategory('trial_ending_reminder')).toBe('upgrade_reminders');
        expect(getTemplatePreferenceCategory('checkout_recovery')).toBe('upgrade_reminders');
        expect(getTemplatePreferenceCategory('churn_recovery')).toBe('churn_recovery');
        expect(getTemplatePreferenceCategory('feature_weekly')).toBe('weekly_features');
        expect(getTemplatePreferenceCategory('activation_one_time_offer_day6')).toBe('promotional');
        expect(getTemplatePreferenceCategory('onboarding_features')).toBe('promotional');
        expect(getTemplatePreferenceCategory('personal_map_pruvodce_day3')).toBe('promotional');
        expect(getTemplatePreferenceCategory('annual_horoscope_reflection_day1')).toBe('promotional');
        expect(getTemplatePreferenceCategory('daily_horoscope')).toBeNull();
        expect(getTemplatePreferenceCategory('newsletter_welcome')).toBeNull();
    });

    test('respects unsubscribe_all and per-category opt-outs', async () => {
        const userId = `prefs-skip-${Date.now()}`;
        await supabase.from('email_preferences').insert({
            user_id: userId,
            upgrade_reminders: true,
            churn_recovery: true,
            weekly_features: true,
            promotional: false,
            unsubscribe_all: false
        });

        await expect(shouldSkipQueuedEmailForPreferences({
            id: 'q1', user_id: userId, template: 'activation_quick_win_day1'
        })).resolves.toEqual({ skip: true, reason: 'promotional' });

        await expect(shouldSkipQueuedEmailForPreferences({
            id: 'q2', user_id: userId, template: 'upgrade_reminder_day3'
        })).resolves.toEqual({ skip: false });

        const unsubUserId = `prefs-unsub-${Date.now()}`;
        await supabase.from('email_preferences').insert({
            user_id: unsubUserId,
            unsubscribe_all: true
        });

        await expect(shouldSkipQueuedEmailForPreferences({
            id: 'q3', user_id: unsubUserId, template: 'upgrade_reminder_day3'
        })).resolves.toEqual({ skip: true, reason: 'unsubscribe_all' });

        // Guests (no user_id) and users without a preferences row default to send.
        await expect(shouldSkipQueuedEmailForPreferences({
            id: 'q4', user_id: null, template: 'activation_quick_win_day1'
        })).resolves.toEqual({ skip: false });
        await expect(shouldSkipQueuedEmailForPreferences({
            id: 'q5', user_id: `missing-${Date.now()}`, template: 'activation_quick_win_day1'
        })).resolves.toEqual({ skip: false });
    });

    test('skips queued email when preferences opt the user out', async () => {
        const userId = `prefs-process-skip-${Date.now()}`;
        const email = `${userId}@example.com`;
        await supabase.from('users').insert({
            id: userId,
            email,
            is_premium: false
        });
        await supabase.from('email_preferences').insert({
            user_id: userId,
            unsubscribe_all: true
        });
        await supabase.from('email_queue').insert({
            user_id: userId,
            email_to: email,
            template: 'activation_quick_win_day1',
            data: {},
            scheduled_for: new Date(Date.now() - 1000).toISOString(),
            status: 'pending',
            retry_count: 0
        });

        await processEmailQueue();

        const { data: queued } = await supabase
            .from('email_queue')
            .select('*')
            .eq('email_to', email)
            .maybeSingle();

        expect(queued).toMatchObject({
            status: 'skipped',
            last_error: 'Skipped by email preferences (unsubscribe_all).'
        });
    });
});
