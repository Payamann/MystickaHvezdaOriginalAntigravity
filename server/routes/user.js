/**
 * User Readings Routes
 * CRUD for user reading history and profile operations
 * GET/POST/PATCH/DELETE /api/user/readings
 * PUT /api/user/password
 * GET /api/user/analytics/* (analytics endpoints)
 */
import express from 'express';
import { authenticateToken } from '../middleware.js';
import { supabase } from '../db-supabase.js';
import rateLimit from 'express-rate-limit';
import {
    updateAnalyticsSnapshot,
    aggregateHeatmapData,
    getRecommendations
} from '../services/analytics.js';

export const router = express.Router();

const sensitiveOpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { error: 'Příliš mnoho pokusů. Zkuste to prosím později.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Get user's reading history (with pagination)
router.get('/readings', authenticateToken, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;

        const { count, error: countError } = await supabase
            .from('readings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', req.user.id);

        if (countError) throw countError;

        const { data, error } = await supabase
            .from('readings')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            success: true,
            readings: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });
    } catch (error) {
        console.error('Get Readings Error:', error);
        res.status(500).json({ success: false, error: 'Nepodařilo se načíst historii.' });
    }
});

// Save a new reading
router.post('/readings', authenticateToken, async (req, res) => {
    try {
        const { type, data: readingData } = req.body;

        if (!type || !readingData) {
            return res.status(400).json({ error: 'Type and data are required.' });
        }

        const { data, error } = await supabase
            .from('readings')
            .insert({ user_id: req.user.id, type, data: readingData })
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, reading: data });
    } catch (error) {
        console.error('Save Reading Error:', error);
        res.status(500).json({ success: false, error: 'Nepodařilo se uložit výklad.' });
    }
});

// Get single reading by ID
router.get('/readings/:id', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('readings')
            .select('*')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ success: false, error: 'Výklad nenalezen.' });

        res.json({ success: true, reading: data });
    } catch (error) {
        console.error('Get Reading Error:', error);
        res.status(500).json({ success: false, error: 'Nepodařilo se načíst výklad.' });
    }
});

// Toggle reading favorite status
router.patch('/readings/:id/favorite', authenticateToken, async (req, res) => {
    try {
        const { data: current, error: fetchError } = await supabase
            .from('readings')
            .select('is_favorite')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (fetchError) throw fetchError;
        if (!current) return res.status(404).json({ success: false, error: 'Výklad nenalezen.' });

        const { data, error } = await supabase
            .from('readings')
            .update({ is_favorite: !current.is_favorite })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, is_favorite: data.is_favorite });
    } catch (error) {
        console.error('Toggle Favorite Error:', error);
        res.status(500).json({ success: false, error: 'Nepodařilo se změnit oblíbené.' });
    }
});

// Delete a reading
router.delete('/readings/:id', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('readings')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Delete Reading Error:', error);
        res.status(500).json({ success: false, error: 'Nepodařilo se smazat výklad.' });
    }
});

// Change user password
router.put('/password', sensitiveOpLimiter, authenticateToken, async (req, res) => {
    try {
        const { currentPassword, password } = req.body;

        if (!currentPassword) {
            return res.status(400).json({ success: false, error: 'Zadejte prosím aktuální heslo.' });
        }
        if (!password || password.length < 8) {
            return res.status(400).json({ success: false, error: 'Nové heslo musí mít alespoň 8 znaků.' });
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
            email: req.user.email,
            password: currentPassword
        });

        if (authError) {
            return res.status(403).json({ success: false, error: 'Aktuální heslo je nesprávné.' });
        }

        const { error } = await supabase.auth.admin.updateUserById(req.user.id, { password });
        if (error) throw error;

        res.json({ success: true, message: 'Heslo bylo úspěšně změněno.' });
    } catch (error) {
        console.error('Password Change Error:', error);
        res.status(500).json({ success: false, error: 'Nepodařilo se změnit heslo.' });
    }
});

// ============================================
// ANALYTICS ENDPOINTS (FÁZE 3)
// ============================================

/**
 * POST /api/user/track-action
 * Track feature usage and reading actions
 * Body: {feature, metadata?}
 */
router.post('/track-action', authenticateToken, async (req, res) => {
    try {
        const { feature, metadata = {} } = req.body;

        if (!feature) {
            return res.status(400).json({ error: 'feature parameter required' });
        }

        // Validate metadata is object
        if (metadata && typeof metadata !== 'object') {
            return res.status(400).json({ error: 'metadata must be an object' });
        }

        // Insert into reading history
        const { error } = await supabase
            .from('user_reading_history')
            .insert({
                user_id: req.user.id,
                reading_type: feature,
                feature_name: feature,
                metadata: JSON.stringify(metadata)
            });

        if (error) throw error;

        // Update feature usage stats (upsert)
        const { data: existing } = await supabase
            .from('feature_usage_stats')
            .select('total_uses')
            .eq('user_id', req.user.id)
            .eq('feature', feature)
            .single();

        const newCount = (existing?.total_uses || 0) + 1;

        await supabase
            .from('feature_usage_stats')
            .upsert({
                user_id: req.user.id,
                feature,
                total_uses: newCount,
                last_used: new Date().toISOString()
            }, { onConflict: 'user_id,feature' });

        res.json({ success: true });
    } catch (error) {
        console.error('[ANALYTICS] Error tracking action:', error);
        res.status(500).json({ error: 'Failed to track action' });
    }
});

/**
 * GET /api/user/analytics/dashboard
 * Get full user analytics dashboard data
 * Returns: {totalReadings, readingsThisMonth, favoriteFeature, streak, retention, churnRisk, heatmap}
 */
router.get('/analytics/dashboard', authenticateToken, async (req, res) => {
    try {
        // Update snapshot first
        await updateAnalyticsSnapshot(req.user.id);

        // Get snapshot data
        const { data: snapshot } = await supabase
            .from('user_analytics_snapshot')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        // Get heatmap data
        const heatmap = await aggregateHeatmapData(req.user.id, 30);

        // Get feature usage
        const { data: features } = await supabase
            .from('feature_usage_stats')
            .select('feature, total_uses')
            .eq('user_id', req.user.id)
            .order('total_uses', { ascending: false });

        const dashboardData = {
            totalReadings: snapshot?.total_readings || 0,
            readingsThisMonth: snapshot?.readings_this_month || 0,
            readingsThisWeek: snapshot?.readings_this_week || 0,
            favoriteFeature: snapshot?.favorite_feature || null,
            streak: snapshot?.streak_days || 0,
            retentionScore: snapshot?.retention_score || 50,
            churnRiskScore: snapshot?.churn_risk_score || 50,
            activityTrend: snapshot?.activity_trend || 'stable',
            heatmap,
            features: features || []
        };

        res.json({ success: true, dashboard: dashboardData });
    } catch (error) {
        console.error('[ANALYTICS] Error fetching dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});

/**
 * GET /api/user/analytics/heatmap
 * Get feature usage heatmap (when user is most active)
 * Query: days=30 (optional)
 * Returns: {hourly, daily, totalReadings}
 */
router.get('/analytics/heatmap', authenticateToken, async (req, res) => {
    try {
        const days = Math.min(90, Math.max(7, parseInt(req.query.days) || 30));
        const heatmap = await aggregateHeatmapData(req.user.id, days);

        res.json({ success: true, heatmap });
    } catch (error) {
        console.error('[ANALYTICS] Error fetching heatmap:', error);
        res.status(500).json({ error: 'Failed to fetch heatmap' });
    }
});

/**
 * GET /api/user/analytics/recommendations
 * Get personalized feature recommendations
 * Returns: {recommendations: [{feature, title, description, icon}]}
 */
router.get('/analytics/recommendations', authenticateToken, async (req, res) => {
    try {
        const recommendations = await getRecommendations(req.user.id);
        res.json({ success: true, recommendations });
    } catch (error) {
        console.error('[ANALYTICS] Error fetching recommendations:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

/**
 * GET /api/user/analytics/history
 * Get reading history with optional filtering
 * Query: type=tarot, feature=tarot, limit=50, offset=0
 * Returns: {history: [], total, pagination}
 */
router.get('/analytics/history', authenticateToken, async (req, res) => {
    try {
        const { type, feature, limit = 50, offset = 0 } = req.query;

        let query = supabase
            .from('user_reading_history')
            .select('*', { count: 'exact' })
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (type) {
            query = query.eq('reading_type', type);
        }

        if (feature) {
            query = query.eq('feature_name', feature);
        }

        const { data, count, error } = await query
            .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

        if (error) throw error;

        res.json({
            success: true,
            history: data || [],
            total: count || 0,
            pagination: {
                offset: parseInt(offset),
                limit: parseInt(limit),
                total: count || 0
            }
        });
    } catch (error) {
        console.error('[ANALYTICS] Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

export default router;
