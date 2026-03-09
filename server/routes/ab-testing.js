/**
 * A/B TESTING ROUTES
 * Endpoints for managing A/B test variants and tracking user interactions
 */

import express from 'express';
import { supabase } from '../db-supabase.js';
import { authenticateToken } from '../middleware.js';
import { getUserABTestVariant, trackABTestEvent } from '../services/analytics.js';

const router = express.Router();

/**
 * GET /api/ab-testing/active
 * Get current active A/B test variant for user
 * Returns: {variantId, variant_name, cta_text, subject_line, test_name}
 */
router.get('/active', authenticateToken, async (req, res) => {
    try {
        const { testFeature } = req.query;

        if (!testFeature) {
            return res.status(400).json({ error: 'testFeature query parameter required' });
        }

        const variant = await getUserABTestVariant(req.user.id, testFeature);

        if (!variant) {
            return res.status(404).json({ error: 'No active test found for feature' });
        }

        res.json({ success: true, variant });
    } catch (error) {
        console.error('[AB-TEST] Error fetching active variant:', error);
        res.status(500).json({ error: 'Failed to fetch variant' });
    }
});

/**
 * POST /api/ab-testing/event
 * Track user interaction with A/B test variant
 * Body: {variantId, eventType: 'shown|clicked|converted'}
 */
router.post('/event', authenticateToken, async (req, res) => {
    try {
        const { variantId, eventType } = req.body;

        if (!variantId || !eventType) {
            return res.status(400).json({ error: 'variantId and eventType required' });
        }

        if (!['shown', 'clicked', 'converted'].includes(eventType)) {
            return res.status(400).json({ error: 'Invalid eventType' });
        }

        const success = await trackABTestEvent(req.user.id, variantId, eventType);

        if (!success) {
            return res.status(500).json({ error: 'Failed to track event' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('[AB-TEST] Error tracking event:', error);
        res.status(500).json({ error: 'Failed to track event' });
    }
});

/**
 * GET /api/ab-testing/results
 * Get A/B test results and metrics (admin only)
 * Returns: {tests: [{testId, feature, variants: [{id, name, cta_text, conversions, views, conversionRate}]}]}
 */
router.get('/results', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
        if (!adminEmails.includes(req.user.email)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get all active tests with variants
        const { data: tests, error } = await supabase
            .from('ab_tests')
            .select(`
                id,
                feature,
                test_name,
                status,
                created_at,
                winning_variant,
                ab_test_variants(
                    id,
                    variant_name,
                    cta_text,
                    conversion_count,
                    view_count,
                    conversion_rate
                )
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Calculate conversion rates
        const results = tests?.map(test => ({
            ...test,
            ab_test_variants: test.ab_test_variants?.map(v => ({
                ...v,
                conversionRate: v.view_count > 0 ? ((v.conversion_count / v.view_count) * 100).toFixed(2) : 0
            }))
        }));

        res.json({ success: true, tests: results });
    } catch (error) {
        console.error('[AB-TEST] Error fetching results:', error);
        res.status(500).json({ error: 'Failed to fetch test results' });
    }
});

/**
 * POST /api/ab-testing/deploy
 * Deploy winning variant to all users (admin only)
 * Body: {testId, winningVariantName}
 */
router.post('/deploy', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
        const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
        if (!adminEmails.includes(req.user.email)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { testId, winningVariantName } = req.body;

        if (!testId || !winningVariantName) {
            return res.status(400).json({ error: 'testId and winningVariantName required' });
        }

        // Verify variant exists
        const { data: variant, error: variantError } = await supabase
            .from('ab_test_variants')
            .select('id')
            .eq('test_id', testId)
            .eq('variant_name', winningVariantName)
            .single();

        if (variantError || !variant) {
            return res.status(404).json({ error: 'Variant not found' });
        }

        // Update test status to completed and set winning variant
        const { error } = await supabase
            .from('ab_tests')
            .update({
                status: 'completed',
                winning_variant: winningVariantName,
                updated_at: new Date().toISOString()
            })
            .eq('id', testId);

        if (error) throw error;

        res.json({
            success: true,
            message: `Test completed. Winning variant: ${winningVariantName}`
        });
    } catch (error) {
        console.error('[AB-TEST] Error deploying variant:', error);
        res.status(500).json({ error: 'Failed to deploy variant' });
    }
});

/**
 * GET /api/ab-testing/user-variants
 * Get all variants assigned to current user
 * Returns: {variants: [{testFeature, variantName, variantId}]}
 */
router.get('/user-variants', authenticateToken, async (req, res) => {
    try {
        const { data: events, error } = await supabase
            .from('ab_test_events')
            .select(`
                variant_id,
                ab_test_variants(variant_name),
                ab_tests(feature)
            `)
            .eq('user_id', req.user.id)
            .eq('event_type', 'shown')
            .group_by('variant_id');

        if (error) throw error;

        const variants = events?.map(e => ({
            testFeature: e.ab_tests.feature,
            variantName: e.ab_test_variants.variant_name,
            variantId: e.variant_id
        })) || [];

        res.json({ success: true, variants });
    } catch (error) {
        console.error('[AB-TEST] Error fetching user variants:', error);
        res.status(500).json({ error: 'Failed to fetch variants' });
    }
});

export default router;
