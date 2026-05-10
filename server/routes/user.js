/**
 * User Readings Routes
 * CRUD for user reading history and profile operations
 * GET/POST/PATCH/DELETE /api/user/readings
 * PUT /api/user/password
 */
import express from 'express';
import { authenticateToken } from '../middleware.js';
import { generateToken } from '../auth.js';
import { supabase } from '../db-supabase.js';
import rateLimit from 'express-rate-limit';
import { validatePassword } from '../utils/validation.js';
import { blacklistToken, blacklistAllUserTokens } from '../utils/token-blacklist.js';
import { isProductionRuntime } from '../config/runtime.js';
import { recordFunnelEvent } from '../payment.js';

export const router = express.Router();

const sensitiveOpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: { error: 'Příliš mnoho pokusů. Zkuste to prosím později.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const VALID_READING_TYPES = new Set([
    'angel',
    'angel-card',
    'astrocartography',
    'crystal-ball',
    'daily-wisdom',
    'horoscope',
    'journal',
    'medicine-wheel',
    'natal',
    'natal-chart',
    'numerology',
    'oracle',
    'past-life',
    'runes',
    'synastry',
    'tarot'
]);
const MAX_READING_DATA_LENGTH = 50000;
const VALID_FEEDBACK_RESONANCE = new Set(['fits', 'neutral', 'miss']);
const VALID_FEEDBACK_FOCUS = new Set(['relationships', 'work', 'energy', 'self', 'timing']);
const VALID_FEEDBACK_NEXT_ACTION = new Set(['journal', 'weekly', 'premium', 'another_reading', 'none']);

function cleanFeedbackValue(value, maxLength = 80) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, maxLength);
}

function normalizeReadingFeedback(body = {}) {
    const resonance = cleanFeedbackValue(body.resonance);
    const focus = cleanFeedbackValue(body.focus);
    const nextAction = cleanFeedbackValue(body.nextAction);
    const note = cleanFeedbackValue(body.note, 240);

    if (!resonance && !focus && !nextAction && !note) {
        throw new Error('Feedback payload is required.');
    }

    if (resonance && !VALID_FEEDBACK_RESONANCE.has(resonance)) {
        throw new Error('Invalid feedback resonance.');
    }

    if (focus && !VALID_FEEDBACK_FOCUS.has(focus)) {
        throw new Error('Invalid feedback focus.');
    }

    if (nextAction && !VALID_FEEDBACK_NEXT_ACTION.has(nextAction)) {
        throw new Error('Invalid feedback next action.');
    }

    return {
        ...(resonance && { resonance }),
        ...(focus && { focus }),
        ...(nextAction && { nextAction }),
        ...(note && { note }),
        submittedAt: new Date().toISOString()
    };
}

async function getExistingValueReadingCount(userId) {
    const { count, error } = await supabase
        .from('readings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('type', 'journal');

    if (error) {
        console.warn('[READINGS] Could not count previous value readings:', error.message);
        return null;
    }

    return count || 0;
}

function normalizeReadingData(readingData) {
    if (readingData === undefined || readingData === null) {
        throw new Error('Reading data is required.');
    }

    if (typeof readingData === 'string') {
        const trimmed = readingData.trim();
        if (!trimmed) throw new Error('Reading data is required.');
        if (trimmed.length > MAX_READING_DATA_LENGTH) throw new Error('Reading data is too large.');
        return trimmed;
    }

    if (typeof readingData !== 'object' || Array.isArray(readingData)) {
        throw new Error('Reading data must be an object or string.');
    }

    const serialized = JSON.stringify(readingData);
    if (!serialized || serialized.length > MAX_READING_DATA_LENGTH) {
        throw new Error('Reading data is too large.');
    }

    return readingData;
}

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
        const cleanType = typeof type === 'string' ? type.trim() : '';

        if (!cleanType || readingData === undefined || readingData === null) {
            return res.status(400).json({ error: 'Type and data are required.' });
        }

        // Validate type against allowlist
        if (!VALID_READING_TYPES.has(cleanType)) {
            return res.status(400).json({ error: 'Invalid reading type.' });
        }

        let validatedData;
        try {
            validatedData = normalizeReadingData(readingData);
        } catch (validationError) {
            return res.status(400).json({ error: validationError.message });
        }

        const previousValueReadingCount = cleanType !== 'journal'
            ? await getExistingValueReadingCount(req.user.id)
            : null;

        const { data, error } = await supabase
            .from('readings')
            .insert({ user_id: req.user.id, type: cleanType, data: validatedData })
            .select()
            .single();

        if (error) throw error;

        if (cleanType === 'journal') {
            await recordFunnelEvent('daily_ritual_completed', {
                userId: req.user.id,
                source: 'profile_journal',
                feature: 'journal',
                metadata: {
                    reading_id: data.id
                }
            });
        } else if (previousValueReadingCount === 0) {
            await recordFunnelEvent('first_value_completed', {
                userId: req.user.id,
                source: 'reading_save',
                feature: cleanType,
                metadata: {
                    reading_id: data.id
                }
            });
            await recordFunnelEvent('activation_completed', {
                userId: req.user.id,
                source: 'reading_save',
                feature: cleanType,
                metadata: {
                    reading_id: data.id,
                    activation_type: 'first_saved_reading'
                }
            });
        }

        res.json({ success: true, reading: data, id: data.id });
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

// Save lightweight feedback on a reading without creating a separate table
router.patch('/readings/:id/feedback', authenticateToken, async (req, res) => {
    try {
        let feedback;
        try {
            feedback = normalizeReadingFeedback(req.body || {});
        } catch (validationError) {
            return res.status(400).json({ success: false, error: validationError.message });
        }

        const { data: current, error: fetchError } = await supabase
            .from('readings')
            .select('id,type,data')
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .single();

        if (fetchError?.code === 'PGRST116' || !current) {
            return res.status(404).json({ success: false, error: 'Reading not found.' });
        }
        if (fetchError) throw fetchError;

        if (current.type === 'journal') {
            return res.status(400).json({ success: false, error: 'Journal entries do not accept reading feedback.' });
        }

        if (!current.data || typeof current.data !== 'object' || Array.isArray(current.data)) {
            return res.status(400).json({ success: false, error: 'Reading data cannot accept feedback.' });
        }

        const previousFeedback = current.data.feedback
            && typeof current.data.feedback === 'object'
            && !Array.isArray(current.data.feedback)
            ? current.data.feedback
            : {};
        const updatedData = {
            ...current.data,
            feedback: {
                ...previousFeedback,
                ...feedback
            }
        };

        const { data, error } = await supabase
            .from('readings')
            .update({ data: updatedData })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        const feedbackFeature = cleanFeedbackValue(req.body?.feature, 120) || current.type;

        await recordFunnelEvent('reading_feedback_submitted', {
            userId: req.user.id,
            source: cleanFeedbackValue(req.body?.source, 120) || 'reading_feedback',
            feature: feedbackFeature,
            metadata: {
                reading_id: current.id,
                resonance: feedback.resonance || null,
                focus: feedback.focus || null,
                next_action: feedback.nextAction || null
            }
        });

        res.json({ success: true, reading: data, feedback: data.data.feedback });
    } catch (error) {
        console.error('Reading Feedback Error:', error);
        res.status(500).json({ success: false, error: 'Could not save reading feedback.' });
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
        const { currentPassword, password, password_confirm } = req.body;

        // Validate currentPassword is provided
        if (!currentPassword || typeof currentPassword !== 'string') {
            return res.status(400).json({ success: false, error: 'Zadejte prosím aktuální heslo.' });
        }

        // Validate password confirmation
        if (!password_confirm || typeof password_confirm !== 'string') {
            return res.status(400).json({ success: false, error: 'Heslo potvrzení je povinné.' });
        }
        if (password !== password_confirm) {
            return res.status(400).json({ success: false, error: 'Hesla se neshodují.' });
        }

        // Validate new password
        let validatedPassword;
        try {
            validatedPassword = validatePassword(password);
        } catch (validationError) {
            return res.status(400).json({ success: false, error: validationError.message });
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
            email: req.user.email,
            password: currentPassword
        });

        if (authError) {
            return res.status(403).json({ success: false, error: 'Aktuální heslo je nesprávné.' });
        }

        const { error } = await supabase.auth.admin.updateUserById(req.user.id, { password: validatedPassword });
        if (error) throw error;

        // Blacklist all existing tokens for this user (force re-authentication on all devices)
        await blacklistAllUserTokens(req.user.id);

        // Clear auth cookie on this device as well
        res.clearCookie('auth_token', {
            httpOnly: true,
            secure: isProductionRuntime(),
            sameSite: 'strict',
            path: '/'
        });

        res.json({
            success: true,
            message: 'Heslo bylo úspěšně změněno. Prosím přihlaste se znovu.',
            requireReLogin: true
        });
    } catch (error) {
        console.error('Password Change Error:', error);
        res.status(500).json({ success: false, error: 'Nepodařilo se změnit heslo.' });
    }
});

export default router;
