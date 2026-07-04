import { supabase } from '../db-supabase.js';

/**
 * DAILY PUSH NOTIFICATION JOB
 * Sends the daily horoscope nudge to stored Web Push subscriptions.
 * Dedupes per Prague calendar day via push_subscriptions.last_notified_at,
 * mirroring the daily horoscope email job. Subscriptions rejected by the
 * push service with a permanent status (404/410) are deleted.
 */

export const DAILY_PUSH_TIME_ZONE = 'Europe/Prague';

const SUBSCRIPTION_PAGE_SIZE = 500;
const PERMANENT_PUSH_FAILURE_STATUS_CODES = new Set([404, 410]);

let dailyPushJobRunning = false;

export function getDailyPushDateKey(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: DAILY_PUSH_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

export function filterDuePushSubscriptions(subscriptions = [], now = new Date()) {
    const todayKey = getDailyPushDateKey(now);
    return subscriptions.filter((subscription) => {
        if (!subscription?.last_notified_at) return true;

        const lastNotified = new Date(subscription.last_notified_at);
        if (Number.isNaN(lastNotified.getTime())) return true;

        return getDailyPushDateKey(lastNotified) !== todayKey;
    });
}

export function buildDailyPushPayload(now = new Date()) {
    const dateLabel = now.toLocaleDateString('cs-CZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: DAILY_PUSH_TIME_ZONE
    });

    return {
        title: '🌙 Tvůj denní horoskop je připraven',
        body: `Podívej se, co ti hvězdy přinášejí – ${dateLabel}.`,
        url: '/horoskopy.html?utm_source=push&utm_medium=notification&utm_campaign=daily_horoscope',
        icon: '/img/icon-192.webp'
    };
}

export function isPermanentPushFailure(error) {
    const statusCode = Number(error?.statusCode ?? error?.status);
    return PERMANENT_PUSH_FAILURE_STATUS_CODES.has(statusCode);
}

async function loadWebPush() {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.warn('[DailyPush] Skipped: VAPID keys are not configured.');
        return null;
    }

    let webpush;
    try {
        webpush = (await import('web-push')).default;
    } catch {
        console.warn('[DailyPush] Skipped: web-push package is not installed.');
        return null;
    }

    webpush.setVapidDetails(
        'mailto:admin@mystickahvezda.cz',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );

    return webpush;
}

async function fetchAllPushSubscriptions() {
    const subscriptions = [];

    for (let from = 0; ; from += SUBSCRIPTION_PAGE_SIZE) {
        const { data, error } = await supabase
            .from('push_subscriptions')
            .select('id, endpoint, subscription_json, last_notified_at')
            .order('created_at', { ascending: true })
            .range(from, from + SUBSCRIPTION_PAGE_SIZE - 1);

        if (error) {
            throw new Error(`Failed to fetch push subscriptions: ${error.message}`);
        }

        subscriptions.push(...(data || []));
        if (!data || data.length < SUBSCRIPTION_PAGE_SIZE) break;
    }

    return subscriptions;
}

export async function run(options = {}) {
    if (dailyPushJobRunning) {
        console.warn('[DailyPush] Skipped because a run is already active.');
        return { sent: 0, failed: 0, removed: 0, skipped: 0 };
    }

    dailyPushJobRunning = true;
    try {
        const now = options.now instanceof Date ? options.now : new Date();

        const webpush = await loadWebPush();
        if (!webpush) return { sent: 0, failed: 0, removed: 0, skipped: 0 };

        const subscriptions = await fetchAllPushSubscriptions();
        if (subscriptions.length === 0) {
            console.log('[DailyPush] No push subscriptions.');
            return { sent: 0, failed: 0, removed: 0, skipped: 0 };
        }

        const dueSubscriptions = options.force === true
            ? subscriptions
            : filterDuePushSubscriptions(subscriptions, now);

        if (dueSubscriptions.length === 0) {
            console.log(`[DailyPush] No subscriptions due for ${getDailyPushDateKey(now)}.`);
            return { sent: 0, failed: 0, removed: 0, skipped: subscriptions.length };
        }

        console.log(`[DailyPush] ${dueSubscriptions.length}/${subscriptions.length} subscriptions due.`);

        const payload = JSON.stringify(buildDailyPushPayload(now));
        let sent = 0, failed = 0, removed = 0;

        for (const subscription of dueSubscriptions) {
            let parsedSubscription;
            try {
                parsedSubscription = JSON.parse(subscription.subscription_json);
            } catch {
                await supabase.from('push_subscriptions').delete().eq('id', subscription.id);
                removed++;
                continue;
            }

            try {
                await webpush.sendNotification(parsedSubscription, payload);
                const { error: markError } = await supabase
                    .from('push_subscriptions')
                    .update({ last_notified_at: now.toISOString() })
                    .eq('id', subscription.id);
                if (markError) {
                    console.error(`[DailyPush] Sent but failed to mark ${subscription.id}:`, markError.message);
                    failed++;
                    continue;
                }
                sent++;
            } catch (error) {
                if (isPermanentPushFailure(error)) {
                    await supabase.from('push_subscriptions').delete().eq('id', subscription.id);
                    removed++;
                } else {
                    console.error(`[DailyPush] Failed to send to ${subscription.id}:`, error.message);
                    failed++;
                }
            }

            await new Promise((resolve) => setTimeout(resolve, 50));
        }

        console.log(`[DailyPush] Done — sent: ${sent}, failed: ${failed}, removed: ${removed}.`);
        return { sent, failed, removed, skipped: subscriptions.length - dueSubscriptions.length };
    } finally {
        dailyPushJobRunning = false;
    }
}
