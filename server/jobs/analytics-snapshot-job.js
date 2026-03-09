/**
 * ANALYTICS SNAPSHOT JOB
 * Runs periodically to update user analytics snapshots
 * Calculates retention scores, churn risk, and identifies at-risk users
 */

import schedule from 'node-schedule';
import { supabase } from '../db-supabase.js';
import { updateAnalyticsSnapshot } from '../services/analytics.js';

let jobRunning = false;

/**
 * Process all user analytics snapshots
 * Called by scheduler job
 */
export async function processAnalyticsSnapshots() {
    if (jobRunning) {
        console.log('[JOB] Analytics snapshot job already running, skipping...');
        return;
    }

    jobRunning = true;

    try {
        // Get all active users
        const { data: users, error } = await supabase
            .from('users')
            .select('id')
            .eq('status', 'active');

        if (error) {
            console.error('[JOB] Error fetching users:', error.message);
            return;
        }

        if (!users || users.length === 0) {
            console.log('[JOB] No users to process for analytics');
            jobRunning = false;
            return;
        }

        console.log(`[JOB] Processing analytics for ${users.length} users...`);

        let successCount = 0;
        let errorCount = 0;

        // Process each user's snapshot
        for (const user of users) {
            try {
                await updateAnalyticsSnapshot(user.id);
                successCount++;
            } catch (error) {
                console.error(`[JOB] Error processing user ${user.id}:`, error.message);
                errorCount++;
            }
        }

        console.log(`[JOB] Analytics snapshots processed: ${successCount} succeeded, ${errorCount} failed`);

        // Identify and notify high churn risk users
        await identifyChurnRiskUsers();

    } catch (error) {
        console.error('[JOB] Unexpected error in analytics processor:', error);
    } finally {
        jobRunning = false;
    }
}

/**
 * Identify users at high risk of churning
 * High risk = churn_risk_score > 75
 */
export async function identifyChurnRiskUsers() {
    try {
        const { data: riskUsers, error } = await supabase
            .from('user_analytics_snapshot')
            .select('user_id, churn_risk_score, email: users(email)')
            .gt('churn_risk_score', 75);

        if (error) {
            console.error('[JOB] Error identifying churn risk users:', error);
            return;
        }

        if (riskUsers && riskUsers.length > 0) {
            console.log(`[JOB] Identified ${riskUsers.length} users at churn risk`);

            // TODO: Queue churn prevention emails for these users
            // This would be integrated with the email system from FÁZE 2
            // Example: await sendChurnPreventionEmail(user.user_id, user.email);

            // Log for monitoring
            riskUsers.forEach(user => {
                console.warn(`[JOB] Churn risk user: ${user.user_id} (score: ${user.churn_risk_score})`);
            });
        }
    } catch (error) {
        console.error('[JOB] Error in churn risk identification:', error);
    }
}

/**
 * Initialize scheduled job runner
 * Runs every 6 hours to update analytics
 */
export function initializeAnalyticsJob() {
    // Every 6 hours (at 0, 6, 12, 18 hours)
    const job = schedule.scheduleJob('0 */6 * * *', async () => {
        await processAnalyticsSnapshots();
    });

    console.log('[JOB] Analytics snapshot job initialized (runs every 6 hours)');

    // Also run once immediately on startup (async, don't block)
    setImmediate(() => {
        processAnalyticsSnapshots().catch(err => {
            console.error('[JOB] Error on initial analytics run:', err);
        });
    });

    return job;
}

/**
 * Manual trigger to process analytics for a specific user
 * Used by admin endpoints or immediate recalculation
 */
export async function triggerAnalyticsUpdate(userId) {
    try {
        await updateAnalyticsSnapshot(userId);
        console.log(`[JOB] Analytics updated for user: ${userId}`);
        return { success: true };
    } catch (error) {
        console.error(`[JOB] Error updating analytics for user ${userId}:`, error);
        throw error;
    }
}

export default {
    processAnalyticsSnapshots,
    identifyChurnRiskUsers,
    initializeAnalyticsJob,
    triggerAnalyticsUpdate
};
