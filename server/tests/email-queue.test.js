import {
    getTemplatePreferenceCategory,
    parseQueuedEmailData,
    processEmailQueue,
    shouldSkipQueuedEmailForPreferences,
    shouldSkipQueuedEmailForPremium
} from '../jobs/email-queue.js';
import { supabase } from '../db-supabase.js';

describe('email queue helpers', () => {
    test('parses both historical JSON strings and Supabase JSONB objects', () => {
        expect(parseQueuedEmailData('{"plan":"pruvodce"}')).toEqual({ plan: 'pruvodce' });
        expect(parseQueuedEmailData({ plan: 'vip' })).toEqual({ plan: 'vip' });
        expect(parseQueuedEmailData(null)).toEqual({});
        expect(parseQueuedEmailData('not-json')).toEqual({});
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
            last_error: 'Skipped because user became premium before send.'
        });
    });

    test('maps marketing templates to preference categories and leaves transactional unmapped', () => {
        expect(getTemplatePreferenceCategory('upgrade_reminder_day3')).toBe('upgrade_reminders');
        expect(getTemplatePreferenceCategory('trial_ending_reminder')).toBe('upgrade_reminders');
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
