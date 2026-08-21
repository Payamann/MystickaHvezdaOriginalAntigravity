import schedule from 'node-schedule';
import { createHash } from 'node:crypto';
import { supabase } from '../db-supabase.js';
import { isPremiumPlanType } from '../config/constants.js';

/**
 * EMAIL QUEUE JOB PROCESSOR
 * Runs every 1 minute to check and send scheduled emails
 * Emails are scheduled in email_queue table with scheduled_for timestamp
 */

let jobRunning = false;
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'cancel_pending']);
const TERMINAL_EMAIL_STATUSES = new Set(['sent', 'skipped', 'failed']);

export class EmailQueuePersistenceError extends Error {
    constructor(operation, recordId, detail) {
        super(`[EMAIL_QUEUE_DB] ${operation} failed for ${recordId}: ${detail}`);
        this.name = 'EmailQueuePersistenceError';
        this.operation = operation;
        this.recordId = recordId;
    }
}

async function updateEmailQueueRecord(emailId, fields, operation, client = supabase) {
    let response;
    try {
        response = await client
            .from('email_queue')
            .update({
                ...fields,
                updated_at: fields.updated_at || new Date().toISOString()
            })
            .eq('id', emailId)
            .select('*')
            .maybeSingle();
    } catch (error) {
        throw new EmailQueuePersistenceError(operation, emailId, error.message || 'database request rejected');
    }

    const { data, error } = response || {};

    if (error) {
        throw new EmailQueuePersistenceError(operation, emailId, error.message || 'unknown database error');
    }
    if (!data) {
        throw new EmailQueuePersistenceError(operation, emailId, 'no email_queue row was updated');
    }

    return data;
}

export async function updateEmailQueueStatus(emailId, status, fields = {}, client = supabase) {
    if (!TERMINAL_EMAIL_STATUSES.has(status)) {
        throw new TypeError(`Unsupported terminal email status: ${status}`);
    }

    const updated = await updateEmailQueueRecord(emailId, { ...fields, status }, `mark_${status}`, client);
    if (updated.status !== status) {
        throw new EmailQueuePersistenceError(`mark_${status}`, emailId, `status verification returned ${updated.status || 'empty'}`);
    }
    return updated;
}

export function parseQueuedEmailData(data) {
    if (!data) return {};

    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch {
            return {};
        }
    }

    if (typeof data === 'object' && !Array.isArray(data)) {
        return data;
    }

    return {};
}

export function buildQueuedEmailIdempotencyKey(
    emailRecord,
    queuedData = parseQueuedEmailData(emailRecord?.data)
) {
    const storedDedupeKey = typeof emailRecord?.dedupe_key === 'string'
        ? emailRecord.dedupe_key.trim()
        : '';
    const payloadDedupeKey = typeof queuedData?.dedupeKey === 'string'
        ? queuedData.dedupeKey.trim()
        : '';
    const dedupeKey = storedDedupeKey || payloadDedupeKey;
    const identity = dedupeKey
        ? JSON.stringify([
            'dedupe',
            String(emailRecord?.template || ''),
            String(emailRecord?.email_to || '').trim().toLowerCase(),
            dedupeKey
        ])
        : JSON.stringify(['queue_row', String(emailRecord?.id || '')]);
    const scope = dedupeKey ? 'dedupe' : 'row';
    const digest = createHash('sha256').update(identity).digest('hex');
    return `mhq_${scope}_${digest}`;
}

function hasActivePremiumSubscription(subscription) {
    if (!subscription) return false;
    const statusIsActive = ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status);
    const periodIsCurrent = !subscription.current_period_end || new Date(subscription.current_period_end) > new Date();
    return statusIsActive && periodIsCurrent && isPremiumPlanType(subscription.plan_type);
}

export async function shouldSkipQueuedEmailForPremium(emailRecord, queuedData = parseQueuedEmailData(emailRecord?.data)) {
    const requiredStatuses = Array.isArray(queuedData?.requiredSubscriptionStatuses)
        ? queuedData.requiredSubscriptionStatuses.filter(status => typeof status === 'string')
        : [];
    const shouldCheckPremium = queuedData?.skipIfPremium === true;
    if ((!shouldCheckPremium && requiredStatuses.length === 0) || !emailRecord?.user_id) return false;

    if (shouldCheckPremium) {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('is_premium')
            .eq('id', emailRecord.user_id)
            .maybeSingle();

        if (userError) {
            console.warn(`[JOB] Could not check premium flag for queued email ${emailRecord.id}:`, userError.message);
        }

        if (user?.is_premium === true || user?.isPremium === true) {
            return true;
        }
    }

    const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('plan_type, status, current_period_end')
        .eq('user_id', emailRecord.user_id)
        .maybeSingle();

    if (subscriptionError) {
        console.warn(`[JOB] Could not check subscription for queued email ${emailRecord.id}:`, subscriptionError.message);
        return false;
    }

    if (requiredStatuses.length > 0 && !requiredStatuses.includes(subscription?.status)) {
        return true;
    }

    return shouldCheckPremium && hasActivePremiumSubscription(subscription);
}

/**
 * Map marketing/lifecycle templates to their email_preferences category.
 * Templates without a category are treated as transactional and always send.
 */
export function getTemplatePreferenceCategory(template = '') {
    const name = String(template);
    if (name.startsWith('upgrade_') || name.startsWith('trial_')) return 'upgrade_reminders';
    if (name.startsWith('churn_') || name.includes('winback')) return 'churn_recovery';
    if (name === 'feature_weekly' || name.startsWith('weekly_')) return 'weekly_features';
    if (name.startsWith('activation_') || name.startsWith('onboarding_')) return 'promotional';
    if (name.includes('_pruvodce_day') || name.includes('_reflection_day')) return 'promotional';
    return null;
}

export async function shouldSkipQueuedEmailForPreferences(emailRecord) {
    const userId = emailRecord?.user_id;
    if (!userId) return { skip: false };

    const { data: preferences, error } = await supabase
        .from('email_preferences')
        .select('upgrade_reminders, churn_recovery, weekly_features, promotional, unsubscribe_all')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.warn(`[JOB] Could not check email preferences for queued email ${emailRecord.id}:`, error.message);
        return { skip: false };
    }

    if (!preferences) return { skip: false };
    if (preferences.unsubscribe_all === true) {
        return { skip: true, reason: 'unsubscribe_all' };
    }

    const category = getTemplatePreferenceCategory(emailRecord.template);
    if (category && preferences[category] === false) {
        return { skip: true, reason: category };
    }

    return { skip: false };
}

/**
 * Rozliší trvale neplatného příjemce od dočasného výpadku. Resend takovou adresu
 * odmítne ještě před odesláním ("Invalid `to` field") — opakování nikdy nepomůže.
 * Záměrně úzké: cokoli jiného (výpadek sítě, rate limit, 5xx) se má zkoušet dál.
 */
export function isPermanentRecipientError(message) {
    return /invalid\s+`?to`?\s+field/i.test(String(message || ''));
}

export function isReservedTestRecipient(email) {
    return /@(?:example\.(?:com|org|net)|[^@]+\.invalid)$/i.test(String(email || '').trim());
}

export function isPermanentDeliveryFailure(message, email) {
    if (isPermanentRecipientError(message)) return true;

    // A Resend test-domain rejection may be a temporary account configuration
    // issue for real addresses. It is terminal only for RFC-reserved domains.
    return isReservedTestRecipient(email) &&
        /only send testing emails to your own email address/i.test(String(message || ''));
}

/**
 * Vyřadí adresu z odběrů, aby ji další rozesílka znovu nezařadila do fronty.
 * Bez toho se stejné selhání opakuje každý týden donekonečna.
 */
export async function deactivateInvalidRecipient(email, reason, client = supabase) {
    if (!email) return { deactivated: false, verifiedTables: [] };

    const failures = [];
    const verifiedTables = [];

    for (const [table, activeColumn] of [['newsletter_subscribers', 'is_active'], ['horoscope_subscriptions', 'active']]) {
        let updateResponse;
        try {
            updateResponse = await client
                .from(table)
                .update({ [activeColumn]: false })
                .eq('email', email)
                .eq(activeColumn, true);
        } catch (error) {
            failures.push(`${table} update: ${error.message || 'database request rejected'}`);
            continue;
        }

        const updateError = updateResponse?.error;

        if (updateError) {
            failures.push(`${table} update: ${updateError.message || 'unknown database error'}`);
            continue;
        }

        let verificationResponse;
        try {
            verificationResponse = await client
                .from(table)
                .select('id', { count: 'exact', head: true })
                .eq('email', email)
                .eq(activeColumn, true);
        } catch (error) {
            failures.push(`${table} verification: ${error.message || 'database request rejected'}`);
            continue;
        }

        const { count, error: verificationError } = verificationResponse || {};

        if (verificationError) {
            failures.push(`${table} verification: ${verificationError.message || 'unknown database error'}`);
            continue;
        }
        if (count !== 0) {
            failures.push(`${table} verification: ${String(count)} active row(s) remain`);
            continue;
        }

        verifiedTables.push(table);
    }

    if (failures.length > 0) {
        const operationalError = new EmailQueuePersistenceError(
            'deactivate_invalid_recipient',
            'subscription tables',
            failures.join('; ')
        );
        console.error('[JOB][OPERATIONAL] Invalid recipient deactivation incomplete:', {
            verifiedTables,
            failures
        });
        throw operationalError;
    }

    console.warn('[JOB][OPERATIONAL] Invalid recipient deactivated and verified:', {
        verifiedTables,
        reason: isPermanentRecipientError(reason) ? 'permanent_recipient_error' : 'unspecified'
    });
    return { deactivated: true, verifiedTables };
}

export async function processEmailQueue(options = {}) {
    // Prevent concurrent execution
    if (jobRunning) {
        console.log('[JOB] Email queue processor already running, skipping...');
        return;
    }

    jobRunning = true;

    try {
        // Get all pending emails that are due to be sent
        const { data: emails, error } = await supabase
            .from('email_queue')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_for', new Date().toISOString())
            .order('scheduled_for', { ascending: true })
            .limit(50); // Process max 50 per run to avoid overload

        if (error) {
            console.error('[JOB] Error fetching email queue:', error.message);
            return;
        }

        if (!emails || emails.length === 0) {
            console.log('[JOB] No emails to process');
            jobRunning = false;
            return;
        }

        console.log(`[JOB] Processing ${emails.length} scheduled emails...`);

        let successCount = 0;
        let failureCount = 0;
        let skippedCount = 0;

        // Process each email
        for (const emailRecord of emails) {
            try {
                const { id, email_to, template, data } = emailRecord;
                const queuedData = parseQueuedEmailData(data);

                if (await shouldSkipQueuedEmailForPremium(emailRecord, queuedData)) {
                    await updateEmailQueueStatus(id, 'skipped', {
                        sent_at: new Date().toISOString(),
                        last_error: 'Skipped because the current subscription state no longer matches this email.'
                    });

                    skippedCount++;
                    console.log(`[JOB] ↷ Email skipped for premium user: ${template} to ${email_to}`);
                    continue;
                }

                const preferenceCheck = await shouldSkipQueuedEmailForPreferences(emailRecord);
                if (preferenceCheck.skip) {
                    await updateEmailQueueStatus(id, 'skipped', {
                        sent_at: new Date().toISOString(),
                        last_error: `Skipped by email preferences (${preferenceCheck.reason}).`
                    });

                    skippedCount++;
                    console.log(`[JOB] ↷ Email skipped by preferences (${preferenceCheck.reason}): ${template} to ${email_to}`);
                    continue;
                }

                // Dynamically import sendEmail to avoid circular dependency.
                const sendQueuedEmail = typeof options.sendEmail === 'function'
                    ? options.sendEmail
                    : (await import('../email-service.js')).sendEmail;
                const idempotencyKey = buildQueuedEmailIdempotencyKey(emailRecord, queuedData);

                // Send email via Resend
                const result = await sendQueuedEmail({
                    to: email_to,
                    template,
                    data: queuedData
                }, { idempotencyKey });

                // Mark as sent in database
                await updateEmailQueueStatus(id, 'sent', {
                    sent_at: new Date().toISOString(),
                    email_id: result.emailId
                });

                successCount++;
                console.log(`[JOB] ✓ Email sent: ${template} to ${email_to}`);

            } catch (emailErr) {
                failureCount++;

                if (emailErr instanceof EmailQueuePersistenceError) {
                    console.error('[JOB][OPERATIONAL] Email queue state persistence failed:', emailErr.message);
                    continue;
                }

                console.error(`[JOB] ✗ Failed to send email ${emailRecord.id}:`, emailErr.message);

                const permanent = isPermanentDeliveryFailure(emailErr.message, email_to);
                const nextRetryCount = (emailRecord.retry_count || 0) + 1;
                const maxRetries = Number.isFinite(Number(emailRecord.max_retries))
                    ? Number(emailRecord.max_retries)
                    : 3;

                // Trvale neplatnou adresu nemá smysl zkoušet znovu — a hlavně se musí
                // vyřadit odběratel, jinak ho další rozesílka zařadí do fronty zas
                // a selhání se hromadí donekonečna (viz 120 selhani za 6 dni).
                if (permanent) {
                    try {
                        await updateEmailQueueStatus(emailRecord.id, 'failed', {
                            retry_count: nextRetryCount,
                            last_error: emailErr.message
                        });
                    } catch (persistenceError) {
                        console.error('[JOB][OPERATIONAL] Could not persist permanent email failure:', persistenceError.message);
                    }

                    try {
                        await deactivateInvalidRecipient(email_to, emailErr.message);
                    } catch (deactivationError) {
                        console.error('[JOB][OPERATIONAL] Invalid recipient still requires manual cleanup:', deactivationError.message);
                    }
                } else if (nextRetryCount >= maxRetries) {
                    try {
                        await updateEmailQueueStatus(emailRecord.id, 'failed', {
                            retry_count: nextRetryCount,
                            last_error: emailErr.message
                        });
                        console.warn(`[JOB] ✗ Email ${emailRecord.id} marked as failed after ${maxRetries} retries`);
                    } catch (persistenceError) {
                        console.error('[JOB][OPERATIONAL] Could not persist exhausted email retries:', persistenceError.message);
                    }
                } else {
                    try {
                        await updateEmailQueueRecord(emailRecord.id, {
                            retry_count: nextRetryCount,
                            last_error: emailErr.message
                        }, 'increment_retry');
                    } catch (persistenceError) {
                        console.error('[JOB][OPERATIONAL] Could not persist email retry:', persistenceError.message);
                    }
                }
            }
        }

        console.log(`[JOB] Email queue processed: ${successCount} sent, ${skippedCount} skipped, ${failureCount} failed`);

    } catch (error) {
        console.error('[JOB] Unexpected error in email queue processor:', error);
    } finally {
        jobRunning = false;
    }
}

/**
 * Schedule email to be sent later
 * Used by payment.js and other endpoints
 */
async function findLegacyDedupeMatch(client, email, template, dedupeKey) {
    const { data: existingEmails, error } = await client
        .from('email_queue')
        .select('id, data, scheduled_for, status')
        .eq('email_to', email)
        .eq('template', template)
        .in('status', ['pending', 'sent', 'skipped', 'failed'])
        .limit(50);

    if (error) throw error;

    return (existingEmails || []).find((emailRecord) => (
        parseQueuedEmailData(emailRecord.data).dedupeKey === dedupeKey
    )) || null;
}

async function findDedupeConflictRecord(client, email, template, dedupeKey) {
    const { data: existingEmails, error } = await client
        .from('email_queue')
        .select('id, email_to, scheduled_for, status, dedupe_key')
        .eq('template', template)
        .eq('dedupe_key', dedupeKey)
        .limit(10);

    if (error) throw error;

    const normalizedEmail = String(email || '').trim().toLowerCase();
    return (existingEmails || []).find((emailRecord) => (
        String(emailRecord.email_to || '').trim().toLowerCase() === normalizedEmail
    )) || null;
}

function isDedupeUniqueViolation(error) {
    if (error?.code !== '23505') return false;
    const details = `${error.constraint || ''} ${error.message || ''} ${error.details || ''}`;
    return /email_queue_recipient_template_dedupe|dedupe_key/i.test(details);
}

function isMissingDedupeColumn(error) {
    if (!['42703', 'PGRST204'].includes(error?.code)) return false;
    return /dedupe_key/i.test(`${error.message || ''} ${error.details || ''}`);
}

function existingScheduleResult(existingEmail, reason = null) {
    return {
        success: true,
        scheduledFor: existingEmail?.scheduled_for ? new Date(existingEmail.scheduled_for) : null,
        skipped: true,
        existingId: existingEmail?.id || null,
        ...(reason ? { reason } : {})
    };
}

export async function scheduleEmailLater(emailConfig, client = supabase) {
    try {
        const {
            userId = null,
            email,
            template,
            data = {},
            delaySeconds = 0,
            dedupeKey = null
        } = emailConfig;
        const cleanDedupeKey = typeof dedupeKey === 'string' && dedupeKey.trim()
            ? dedupeKey.trim()
            : (typeof data?.dedupeKey === 'string' && data.dedupeKey.trim() ? data.dedupeKey.trim() : null);
        const queuedData = cleanDedupeKey && data && typeof data === 'object' && !Array.isArray(data)
            ? { ...data, dedupeKey: cleanDedupeKey }
            : data;

        if (template === 'newsletter_weekly_digest' && isReservedTestRecipient(email)) {
            console.warn('[JOB] Newsletter digest skipped for reserved test recipient.');
            return {
                success: true,
                scheduledFor: null,
                skipped: true,
                reason: 'reserved_test_recipient'
            };
        }

        const scheduledFor = new Date();
        scheduledFor.setSeconds(scheduledFor.getSeconds() + delaySeconds);

        if (cleanDedupeKey) {
            const existingEmail = await findLegacyDedupeMatch(client, email, template, cleanDedupeKey);

            if (existingEmail) {
                console.log(`[JOB] Email already scheduled: ${template} for ${email} (${cleanDedupeKey})`);
                return existingScheduleResult(existingEmail, 'dedupe_precheck');
            }
        }

        const insertPayload = {
            user_id: userId || null,
            email_to: email,
            template,
            data: queuedData,
            scheduled_for: scheduledFor.toISOString(),
            status: 'pending',
            retry_count: 0,
            created_at: new Date().toISOString(),
            ...(cleanDedupeKey ? { dedupe_key: cleanDedupeKey } : {})
        };
        const { data: insertedEmail, error } = await client
            .from('email_queue')
            .insert(insertPayload)
            .select('id, scheduled_for')
            .maybeSingle();

        if (error) {
            if (cleanDedupeKey && isDedupeUniqueViolation(error)) {
                const existingEmail = await findDedupeConflictRecord(
                    client,
                    email,
                    template,
                    cleanDedupeKey
                );
                console.log(`[JOB] Concurrent duplicate email suppressed: ${template} (${cleanDedupeKey})`);
                return existingScheduleResult(existingEmail, 'dedupe_unique_conflict');
            }

            if (cleanDedupeKey && isMissingDedupeColumn(error)) {
                const legacyExisting = await findLegacyDedupeMatch(client, email, template, cleanDedupeKey);
                if (legacyExisting) {
                    return existingScheduleResult(legacyExisting, 'legacy_dedupe_precheck');
                }
                throw new EmailQueuePersistenceError(
                    'schedule_deduplicated_email',
                    'email_queue',
                    'dedupe_key migration is missing; refusing a race-prone fallback insert'
                );
            }

            throw error;
        }

        const delayMinutes = Math.round(delaySeconds / 60);
        console.log(`[JOB] Email scheduled: ${template} for ${email} in ${delayMinutes} minutes`);

        return {
            success: true,
            scheduledFor,
            skipped: false,
            existingId: insertedEmail?.id || null
        };

    } catch (error) {
        console.error('[JOB] Error scheduling email:', error);
        throw error;
    }
}

/**
 * Initialize scheduled job runner
 * Runs every 1 minute to process email queue
 */
export function initializeEmailQueueJob() {
    // Every 1 minute, check for emails to send
    const job = schedule.scheduleJob('*/1 * * * *', () => {
        processEmailQueue().catch(err => {
            console.error('[JOB] Error on scheduled email queue run:', err);
        });
    });

    console.log('[JOB] Email queue processor initialized (runs every 1 minute)');

    // Also run once immediately on startup
    processEmailQueue().catch(err => {
        console.error('[JOB] Error on initial email queue run:', err);
    });

    return job;
}

export default {
    processEmailQueue,
    scheduleEmailLater,
    initializeEmailQueueJob
};
