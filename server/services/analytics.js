/**
 * ANALYTICS SERVICE
 * Helper functions for calculating user engagement metrics
 * Used by user routes and scheduled jobs
 */

import { supabase } from '../db-supabase.js';

/**
 * Calculate retention score (0-100) based on activity patterns
 * Factors: frequency, recency, consistency
 */
export async function calculateRetentionScore(userId) {
    try {
        const { data: analytics, error } = await supabase
            .from('user_reading_history')
            .select('created_at', { count: 'exact' })
            .eq('user_id', userId)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

        if (error) throw error;

        const readingsLast30 = analytics?.length || 0;

        // Get streak
        const { data: streakData } = await supabase
            .from('user_analytics_snapshot')
            .select('streak_days')
            .eq('user_id', userId)
            .single();

        const streakDays = streakData?.streak_days || 0;

        // Calculate score (0-100)
        // - Readings per month: 0-40 points (10 readings = 40 points)
        // - Streak: 0-40 points (30+ days = 40 points)
        // - Consistency: 0-20 points (regular pattern = 20 points)
        const readingScore = Math.min((readingsLast30 / 10) * 40, 40);
        const streakScore = Math.min((streakDays / 30) * 40, 40);
        const consistencyScore = readingsLast30 > 0 ? 20 : 0;

        const retentionScore = Math.round(readingScore + streakScore + consistencyScore);
        return Math.min(retentionScore, 100);
    } catch (error) {
        console.error('[ANALYTICS] Error calculating retention score:', error);
        return 50; // Default neutral score
    }
}

/**
 * Calculate churn risk score (0-100)
 * High score = high risk of churning
 */
export async function calculateChurnRiskScore(userId) {
    try {
        const { data: snapshot } = await supabase
            .from('user_analytics_snapshot')
            .select('last_activity_date, readings_this_month, activity_trend')
            .eq('user_id', userId)
            .single();

        if (!snapshot) return 50;

        const lastActivityDate = snapshot.last_activity_date ? new Date(snapshot.last_activity_date) : null;
        const daysSinceActivity = lastActivityDate ? Math.floor((Date.now() - lastActivityDate.getTime()) / (24 * 60 * 60 * 1000)) : 999;
        const readingsThisMonth = snapshot.readings_this_month || 0;
        const trend = snapshot.activity_trend || 'stable';

        // Calculate churn risk (0-100, inverted)
        // - Days since activity: 0-40 (30+ days = 40 risk)
        // - Low activity this month: 0-35 (0 readings = 35 risk)
        // - Declining trend: 0-25 (declining = 25 risk)
        const recencyRisk = Math.min((daysSinceActivity / 30) * 40, 40);
        const activityRisk = readingsThisMonth === 0 ? 35 : Math.max(35 - (readingsThisMonth * 3.5), 0);
        const trendRisk = trend === 'declining' ? 25 : (trend === 'increasing' ? 0 : 12.5);

        const churnRiskScore = Math.round(recencyRisk + activityRisk + trendRisk);
        return Math.min(churnRiskScore, 100);
    } catch (error) {
        console.error('[ANALYTICS] Error calculating churn risk score:', error);
        return 50;
    }
}

/**
 * Update user's analytics snapshot (denormalized view)
 * Aggregates from reading_history for fast dashboard queries
 * Called by scheduled job or on-demand
 */
export async function updateAnalyticsSnapshot(userId) {
    try {
        // Get total readings
        const { count: totalReadings, error: countError } = await supabase
            .from('user_reading_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (countError) throw countError;

        // Get readings this month
        const monthStart = new Date();
        monthStart.setDate(1);
        const { count: readingsThisMonth } = await supabase
            .from('user_reading_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', monthStart.toISOString());

        // Get readings this week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const { count: readingsThisWeek } = await supabase
            .from('user_reading_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', weekStart.toISOString());

        // Get favorite feature
        const { data: favData } = await supabase
            .from('user_reading_history')
            .select('feature_name')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        const featureCounts = {};
        favData?.forEach(row => {
            featureCounts[row.feature_name] = (featureCounts[row.feature_name] || 0) + 1;
        });
        const favoriteFeature = Object.keys(featureCounts).sort((a, b) => featureCounts[b] - featureCounts[a])[0];
        const favoriteFeatureCount = featureCounts[favoriteFeature] || 0;

        // Calculate streak
        const streakDays = await calculateStreak(userId);

        // Get last activity
        const { data: lastActivity } = await supabase
            .from('user_reading_history')
            .select('created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const lastActivityDate = lastActivity?.created_at ? new Date(lastActivity.created_at).toISOString().split('T')[0] : null;

        // Calculate trend (comparing last 7 days vs previous 7 days)
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const { count: recent7Days } = await supabase
            .from('user_reading_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', sevenDaysAgo.toISOString());

        const { count: previous7Days } = await supabase
            .from('user_reading_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', fourteenDaysAgo.toISOString())
            .lt('created_at', sevenDaysAgo.toISOString());

        let activityTrend = 'stable';
        if (recent7Days > previous7Days * 1.2) activityTrend = 'increasing';
        else if (recent7Days < previous7Days * 0.8) activityTrend = 'declining';

        // Calculate scores
        const retentionScore = await calculateRetentionScore(userId);
        const churnRiskScore = await calculateChurnRiskScore(userId);

        // Upsert snapshot
        const { error: upsertError } = await supabase
            .from('user_analytics_snapshot')
            .upsert({
                user_id: userId,
                total_readings: totalReadings || 0,
                readings_this_month: readingsThisMonth || 0,
                readings_this_week: readingsThisWeek || 0,
                favorite_feature: favoriteFeature || null,
                favorite_feature_count: favoriteFeatureCount || 0,
                streak_days: streakDays,
                last_activity_date: lastActivityDate,
                retention_score: retentionScore,
                churn_risk_score: churnRiskScore,
                activity_trend: activityTrend
            }, { onConflict: 'user_id' });

        if (upsertError) throw upsertError;

        console.log(`[ANALYTICS] Snapshot updated for user ${userId}: ${totalReadings} readings, retention=${retentionScore}, churn_risk=${churnRiskScore}`);
        return { success: true };
    } catch (error) {
        console.error('[ANALYTICS] Error updating snapshot:', error);
        throw error;
    }
}

/**
 * Calculate consecutive days with reading activity (streak)
 */
export async function calculateStreak(userId) {
    try {
        const { data: readings } = await supabase
            .from('user_reading_history')
            .select('created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100); // Get last 100 readings

        if (!readings || readings.length === 0) return 0;

        let streak = 0;
        let previousDate = null;

        for (const reading of readings) {
            const readingDate = new Date(reading.created_at).toISOString().split('T')[0];

            if (!previousDate) {
                previousDate = readingDate;
                streak = 1;
                continue;
            }

            const prevDate = new Date(previousDate);
            const currDate = new Date(readingDate);
            const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));

            if (dayDiff === 1) {
                streak++;
                previousDate = readingDate;
            } else if (dayDiff === 0) {
                // Same day, skip
                continue;
            } else {
                // Streak broken
                break;
            }
        }

        return streak;
    } catch (error) {
        console.error('[ANALYTICS] Error calculating streak:', error);
        return 0;
    }
}

/**
 * Aggregate hourly heatmap data for feature usage
 * Shows when user is most active
 */
export async function aggregateHeatmapData(userId, days = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: readings } = await supabase
            .from('user_reading_history')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

        // Initialize heatmap arrays
        const hourly = new Array(24).fill(0); // 0-23 hours
        const daily = new Array(7).fill(0); // 0-6 days of week

        readings?.forEach(reading => {
            const date = new Date(reading.created_at);
            const hour = date.getHours();
            const day = date.getDay();

            hourly[hour]++;
            daily[day]++;
        });

        return {
            hourly,
            daily,
            totalReadings: readings?.length || 0,
            period: `${days} days`
        };
    } catch (error) {
        console.error('[ANALYTICS] Error aggregating heatmap:', error);
        return { hourly: new Array(24).fill(0), daily: new Array(7).fill(0), totalReadings: 0 };
    }
}

/**
 * Get personalized feature recommendations
 * Suggest underused features and new content
 */
export async function getRecommendations(userId) {
    try {
        // Get user's feature usage
        const { data: usageStats } = await supabase
            .from('feature_usage_stats')
            .select('feature, total_uses')
            .eq('user_id', userId)
            .order('total_uses', { ascending: true });

        // Get favorite feature
        const { data: snapshot } = await supabase
            .from('user_analytics_snapshot')
            .select('favorite_feature')
            .eq('user_id', userId)
            .single();

        const allFeatures = ['tarot', 'horoscope', 'numerology', 'astrology', 'compatibility'];
        const usedFeatures = usageStats?.map(s => s.feature) || [];
        const unusedFeatures = allFeatures.filter(f => !usedFeatures.includes(f));

        const recommendations = [];

        // Recommend least-used features
        if (usageStats && usageStats.length > 0) {
            const leastUsed = usageStats[0];
            recommendations.push({
                type: 'underused_feature',
                feature: leastUsed.feature,
                title: `Vyzkouš ${leastUsed.feature}`,
                description: `Nepoužíváš ${leastUsed.feature} často. Zkus to znovu!`,
                icon: getFeatureIcon(leastUsed.feature)
            });
        }

        // Recommend completely unused features
        for (const feature of unusedFeatures.slice(0, 2)) {
            recommendations.push({
                type: 'new_feature',
                feature,
                title: `Objevi ${feature}`,
                description: `Zatím jsi nevyzkoušel ${feature}. Pojď se podívat!`,
                icon: getFeatureIcon(feature)
            });
        }

        // Recommend related to favorite feature
        if (snapshot?.favorite_feature) {
            recommendations.push({
                type: 'related_content',
                feature: snapshot.favorite_feature,
                title: `Více o ${snapshot.favorite_feature}`,
                description: `Tvůj oblíbený nástroj - zkus nové funkce!`,
                icon: getFeatureIcon(snapshot.favorite_feature)
            });
        }

        return recommendations;
    } catch (error) {
        console.error('[ANALYTICS] Error getting recommendations:', error);
        return [];
    }
}

/**
 * Helper function to get icon/emoji for each feature
 */
function getFeatureIcon(feature) {
    const icons = {
        'tarot': '🃏',
        'horoscope': '♈',
        'numerology': '🔢',
        'astrology': '⭐',
        'compatibility': '💕',
        'mentorship': '🤖'
    };
    return icons[feature] || '✨';
}

/**
 * Get user's A/B test variant
 * Assigns variant if not already assigned
 */
export async function getUserABTestVariant(userId, testFeature) {
    try {
        // Get test ID
        const { data: test } = await supabase
            .from('ab_tests')
            .select('id')
            .eq('feature', testFeature)
            .eq('status', 'active')
            .single();

        if (!test) {
            console.warn(`[ANALYTICS] No active A/B test for feature: ${testFeature}`);
            return null;
        }

        // Check if user already has a variant assignment
        const { data: existingEvent } = await supabase
            .from('ab_test_events')
            .select('variant_id, ab_test_variants(variant_name, cta_text, subject_line)')
            .eq('user_id', userId)
            .eq('test_id', test.id)
            .eq('event_type', 'shown')
            .limit(1)
            .single();

        if (existingEvent) {
            return {
                variantId: existingEvent.variant_id,
                ...existingEvent.ab_test_variants
            };
        }

        // Assign new variant (randomly)
        const { data: variants } = await supabase
            .from('ab_test_variants')
            .select('id, variant_name, cta_text, subject_line')
            .eq('test_id', test.id)
            .order('id', { ascending: true });

        if (!variants || variants.length === 0) {
            console.warn(`[ANALYTICS] No variants found for test: ${testFeature}`);
            return null;
        }

        const randomVariant = variants[Math.floor(Math.random() * variants.length)];

        // Record assignment
        await supabase
            .from('ab_test_events')
            .insert({
                user_id: userId,
                variant_id: randomVariant.id,
                test_id: test.id,
                event_type: 'shown',
                metadata: { assigned_at: new Date().toISOString() }
            });

        console.log(`[ANALYTICS] Assigned user ${userId} to variant ${randomVariant.variant_name} for test ${testFeature}`);

        return {
            variantId: randomVariant.id,
            variant_name: randomVariant.variant_name,
            cta_text: randomVariant.cta_text,
            subject_line: randomVariant.subject_line
        };
    } catch (error) {
        console.error('[ANALYTICS] Error getting A/B variant:', error);
        return null;
    }
}

/**
 * Track A/B test event (shown, clicked, converted)
 */
export async function trackABTestEvent(userId, variantId, eventType) {
    try {
        // Get test_id from variant
        const { data: variant } = await supabase
            .from('ab_test_variants')
            .select('test_id')
            .eq('id', variantId)
            .single();

        if (!variant) {
            console.warn(`[ANALYTICS] Variant not found: ${variantId}`);
            return false;
        }

        // Insert event
        const { error } = await supabase
            .from('ab_test_events')
            .insert({
                user_id: userId,
                variant_id: variantId,
                test_id: variant.test_id,
                event_type: eventType,
                metadata: { tracked_at: new Date().toISOString() }
            });

        if (error) throw error;

        // Update conversion counts if converted
        if (eventType === 'converted') {
            await supabase
                .from('ab_test_variants')
                .update({
                    conversion_count: supabase.rpc('increment_conversion_count', { variant_id: variantId })
                })
                .eq('id', variantId);
        }

        // Update view count if shown
        if (eventType === 'shown') {
            await supabase
                .from('ab_test_variants')
                .update({
                    view_count: supabase.rpc('increment_view_count', { variant_id: variantId })
                })
                .eq('id', variantId);
        }

        console.log(`[ANALYTICS] Tracked ${eventType} event for user ${userId} variant ${variantId}`);
        return true;
    } catch (error) {
        console.error('[ANALYTICS] Error tracking A/B event:', error);
        return false;
    }
}

export default {
    calculateRetentionScore,
    calculateChurnRiskScore,
    updateAnalyticsSnapshot,
    calculateStreak,
    aggregateHeatmapData,
    getRecommendations,
    getUserABTestVariant,
    trackABTestEvent
};
