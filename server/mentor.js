import express from 'express';
import { calculateMoonPhase } from './services/astrology.js';
import { supabase } from './db-supabase.js';
import { authenticateToken, requirePremiumSoft, trackPaywallHit } from './middleware.js';
import { callClaude } from './services/claude.js';
import {
    buildCompactMentorHistory,
    buildCompactReadingContext
} from './services/mentor-context.js';
import { SYSTEM_PROMPTS } from './config/prompts.js';
import { finishUserDailyQuotaReservation, reserveUserDailyQuota } from './services/user-daily-quota.js';
import xss from 'xss';

const router = express.Router();

router.post('/chat', authenticateToken, requirePremiumSoft, async (req, res) => {
    let quotaReservationId = null;
    try {
        const { message } = req.body;
        const includeReadingContext = req.body?.includeReadingContext === true;
        const userId = req.user.id;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Zpráva chybí.' });
        }
        if (message.length > 2000) {
            return res.status(400).json({ error: 'Zpráva je příliš dlouhá (max 2000 znaků).' });
        }

        if (!req.isPremium) {
            try {
                const reservation = await reserveUserDailyQuota({ userId, feature: 'mentor' });
                if (!reservation.allowed) {
                    trackPaywallHit(userId, 'mentor_unlimited').catch(() => {});
                    return res.status(402).json({
                        error: 'Dnešní 3 bezplatné zprávy jsou vyčerpané. Ve členství můžeš pokračovat; i členské výklady podléhají provozním limitům.',
                        code: 'PREMIUM_REQUIRED',
                        feature: 'mentor_unlimited'
                    });
                }
                quotaReservationId = reservation.reservationId;
            } catch (limitError) {
                console.error('Mentor quota reservation unavailable:', limitError);
                const limitCheckMessages = {
                    cs: 'Denní limit se teď nepodařilo ověřit. Zkus to prosím za chvíli znovu.',
                    sk: 'Denný limit sa teraz nepodarilo overiť. Skús to, prosím, o chvíľu znova.',
                    pl: 'Nie udało się teraz sprawdzić limitu dziennego. Spróbuj ponownie za chwilę.'
                };
                return res.status(503).json({
                    error: limitCheckMessages[req.body?.lang] || limitCheckMessages.cs,
                    code: 'LIMIT_CHECK_UNAVAILABLE'
                });
            }
        }

        const sanitizedMessage = xss(message, {
            whiteList: {},
            stripIgnoredTag: true
        }).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            .trim();

        console.log(`[Mentor] Request received from user ${userId}`);

        let userContext = {};
        try {
            const { data: profile } = await supabase
                .from('users')
                .select('first_name, birth_date')
                .eq('id', userId)
                .single();

            if (profile) {
                userContext = {
                    name: profile.first_name,
                    birthDate: profile.birth_date,
                    zodiacSign: null
                };
            }
        } catch (error) {
            console.warn('[Mentor] Could not fetch profile for context', error);
        }

        let history = [];
        let historySummary = '';
        try {
            const { data: messages } = await supabase
                .from('mentor_messages')
                .select('role, content')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .order('id', { ascending: false })
                .limit(12);

            if (messages) {
                const compacted = buildCompactMentorHistory(messages.reverse());
                history = compacted.recent;
                historySummary = compacted.summary;
            }
        } catch (error) {
            console.warn('[Mentor] Could not fetch chat history', error);
        }

        const appContext = { currentMoonPhase: calculateMoonPhase() };
        if (historySummary) appContext.olderConversationSummary = historySummary;
        if (includeReadingContext) {
            try {
                const { data: readings } = await supabase
                    .from('readings')
                    .select('type, created_at, data')
                    .eq('user_id', userId)
                    .neq('type', 'journal')
                    .order('created_at', { ascending: false })
                    .limit(3);

                const readingContext = buildCompactReadingContext(readings || []);
                if (readingContext) appContext.recentReadingContext = readingContext;
            } catch (error) {
                console.warn('[Mentor] Could not fetch reading context', error);
            }
        }

        console.log('[Mentor] Calling Claude API with compact context...');
        let responseText;
        try {
            responseText = await callClaude(
                SYSTEM_PROMPTS.mentor,
                [...history, { role: 'user', content: sanitizedMessage }],
                { userContext, appContext },
                { feature: 'mentor' }
            );
            if (typeof responseText !== 'string' || !responseText.trim()) {
                throw new Error('Mentor returned an empty response.');
            }
        } catch (generationError) {
            if (quotaReservationId) {
                const reservationId = quotaReservationId;
                try {
                    await finishUserDailyQuotaReservation(reservationId, 'release');
                    quotaReservationId = null;
                } catch (releaseError) {
                    console.error('[Mentor] Could not release failed response quota:', releaseError);
                }
            }
            throw generationError;
        }

        if (quotaReservationId) {
            const reservationId = quotaReservationId;
            quotaReservationId = null;
            try {
                await finishUserDailyQuotaReservation(reservationId, 'commit');
            } catch (settleError) {
                // The counter already includes this successful reply; preserve the fail-closed limit.
                console.error('[Mentor] Could not commit response quota:', settleError);
            }
        }

        let historySaved = true;
        try {
            const { error: saveConversationError } = await supabase.from('mentor_messages').insert([
                {
                    user_id: userId,
                    role: 'user',
                    content: sanitizedMessage
                },
                {
                    user_id: userId,
                    role: 'mentor',
                    content: responseText
                }
            ]);
            if (saveConversationError) throw saveConversationError;
        } catch (saveError) {
            historySaved = false;
            console.error('[Mentor] Could not save the completed conversation:', saveError);
        }

        res.json({ success: true, reply: responseText, historySaved });
    } catch (error) {
        if (quotaReservationId) {
            const reservationId = quotaReservationId;
            try {
                await finishUserDailyQuotaReservation(reservationId, 'release');
                quotaReservationId = null;
            } catch (releaseError) {
                console.error('[Mentor] Could not release request quota:', releaseError);
            }
        }
        console.error('Mentor Chat API Critical Error:', error);
        res.status(500).json({ error: 'Spojení s mentorem se nezdařilo.' });
    }
});

router.get('/history', authenticateToken, requirePremiumSoft, async (req, res) => {
    try {
        const userId = req.user.id;
        const { data: messages, error } = await supabase
            .from('mentor_messages')
            .select('role, content, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .limit(50);

        if (error) throw error;
        res.json({ success: true, history: (messages || []).reverse() });
    } catch (error) {
        console.error('Mentor History Error:', error);
        res.status(500).json({ error: 'Historie se nepodařila načíst.' });
    }
});

export default router;
