/**
 * USER PREFERENCES ROUTES
 * Endpoints for managing user settings (dark mode, language, notifications)
 */

import express from 'express';
import { supabase } from '../db-supabase.js';
import { authenticateToken } from '../middleware.js';

const router = express.Router();

/**
 * GET /api/user/preferences
 * Get user's theme and preference settings
 * Returns: {dark_mode_enabled, theme, language, notifications_enabled, email_digest, analytics_consent}
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { data: preferences, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            return res.status(500).json({ error: 'Failed to fetch preferences' });
        }

        // Return default preferences if none exist
        const defaultPreferences = {
            user_id: req.user.id,
            dark_mode_enabled: false,
            theme: 'auto',
            language: 'cs',
            notifications_enabled: true,
            email_digest: 'weekly',
            analytics_consent: true
        };

        res.json(preferences || defaultPreferences);
    } catch (error) {
        console.error('[PREFERENCES] Error fetching preferences:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/user/preferences
 * Update user's preferences
 * Body: {dark_mode_enabled?, theme?, language?, notifications_enabled?, email_digest?, analytics_consent?}
 */
router.patch('/', authenticateToken, async (req, res) => {
    try {
        const {
            dark_mode_enabled,
            theme,
            language,
            notifications_enabled,
            email_digest,
            analytics_consent
        } = req.body;

        // Validate inputs
        if (theme && !['light', 'dark', 'auto'].includes(theme)) {
            return res.status(400).json({ error: 'Invalid theme value' });
        }

        if (language && !['cs', 'en', 'de', 'fr'].includes(language)) {
            return res.status(400).json({ error: 'Invalid language value' });
        }

        if (email_digest && !['daily', 'weekly', 'monthly', 'never'].includes(email_digest)) {
            return res.status(400).json({ error: 'Invalid email_digest value' });
        }

        // Build update object with only provided fields
        const updateData = { user_id: req.user.id };

        if (dark_mode_enabled !== undefined) updateData.dark_mode_enabled = dark_mode_enabled;
        if (theme !== undefined) updateData.theme = theme;
        if (language !== undefined) updateData.language = language;
        if (notifications_enabled !== undefined) updateData.notifications_enabled = notifications_enabled;
        if (email_digest !== undefined) updateData.email_digest = email_digest;
        if (analytics_consent !== undefined) updateData.analytics_consent = analytics_consent;

        const { data: preferences, error } = await supabase
            .from('user_preferences')
            .upsert(updateData, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to update preferences' });
        }

        res.json({ success: true, preferences });
    } catch (error) {
        console.error('[PREFERENCES] Error updating preferences:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/user/preferences/export
 * Export user's preferences and settings (GDPR compliance)
 * Returns: JSON with all user data
 */
router.post('/export', authenticateToken, async (req, res) => {
    try {
        // Get user preferences
        const { data: preferences } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        // Get email preferences
        const { data: emailPrefs } = await supabase
            .from('email_preferences')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        // Get analytics snapshot
        const { data: analytics } = await supabase
            .from('user_analytics_snapshot')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        // Get A/B test assignments
        const { data: abTests } = await supabase
            .from('ab_test_events')
            .select('*')
            .eq('user_id', req.user.id);

        const exportData = {
            exportedAt: new Date().toISOString(),
            userId: req.user.id,
            preferences: preferences || {},
            emailPreferences: emailPrefs || {},
            analytics: analytics || {},
            abTestAssignments: abTests || []
        };

        res.json({ success: true, data: exportData });
    } catch (error) {
        console.error('[PREFERENCES] Error exporting data:', error);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

export default router;
