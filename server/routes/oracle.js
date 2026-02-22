/**
 * Oracle Routes — Crystal Ball, Tarot, Natal Chart, Synastry, Astrocartography
 * Groups smaller AI-powered features that don't warrant individual files
 */
import express from 'express';
import { authenticateToken, requirePremium, optionalPremiumCheck } from '../middleware.js';
import { callGemini } from '../services/gemini.js';
import { SYSTEM_PROMPTS } from '../config/prompts.js';
import { calculateMoonPhase } from '../services/astrology.js';
import { isPremiumUser } from '../payment.js';
import { supabase } from '../db-supabase.js';

export const router = express.Router();

// ─── Crystal Ball ──────────────────────────────────────────────────────────────

router.post('/crystal-ball', optionalPremiumCheck, async (req, res) => {
    try {
        const { question, history = [] } = req.body;

        if (!question || typeof question !== 'string' || question.length > 1000) {
            return res.status(400).json({ success: false, error: 'Otázka je povinná (max 1000 znaků).' });
        }

        // PREMIUM GATE: Free logged-in users limited to 3 questions per day
        if (!req.isPremium && req.user?.id) {
            try {
                const today = new Date().toISOString().split('T')[0];
                const { data } = await supabase
                    .from('readings')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', req.user.id)
                    .eq('type', 'crystal-ball')
                    .gte('created_at', `${today}T00:00:00`);

                const count = data?.length || 0;
                if (count >= 3) {
                    return res.status(402).json({
                        success: false,
                        error: 'Denní limit 3 otázek byl vyčerpán. Upgrade na Premium pro neomezený přístup.',
                        code: 'PREMIUM_REQUIRED',
                        feature: 'crystal_ball_unlimited'
                    });
                }
            } catch (limitError) {
                console.warn('Crystal Ball limit check failed:', limitError);
            }
        }

        const safeHistory = Array.isArray(history) ? history.slice(0, 10) : [];
        let contextMessage = question;
        if (safeHistory.length > 0) {
            contextMessage = `Předchozí otázky v této seanci: ${safeHistory.join(', ')}\n\nNová otázka: ${question}`;
        }

        const moonPhase = calculateMoonPhase();
        const systemPrompt = SYSTEM_PROMPTS.crystalBall.replace('{MOON_PHASE}', moonPhase);

        const response = await callGemini(systemPrompt, contextMessage);
        res.json({ success: true, response });
    } catch (error) {
        console.error('Crystal Ball Error:', error);
        res.status(500).json({ success: false, error: 'Křišťálová koule je zahalena mlhou...' });
    }
});

// ─── Tarot ────────────────────────────────────────────────────────────────────

router.post('/tarot', authenticateToken, async (req, res) => {
    try {
        const { question, cards, spreadType = 'tříkartový' } = req.body;
        const userId = req.user.id;

        const userIsPremium = await isPremiumUser(userId);

        // Free users can only do 1-card spreads
        if (!userIsPremium && cards.length > 1) {
            return res.status(403).json({
                success: false,
                error: 'Komplexní výklady jsou dostupné pouze pro Hvězdné Průvodce (Premium).',
                code: 'PREMIUM_REQUIRED'
            });
        }

        const message = `Typ výkladu: ${spreadType}\nOtázka: "${question}"\nVytažené karty: ${cards.join(', ')}`;
        const response = await callGemini(SYSTEM_PROMPTS.tarot, message);
        res.json({ success: true, response });
    } catch (error) {
        console.error('Tarot Error:', error);
        res.status(500).json({ success: false, error: 'Karty odmítají promluvit...' });
    }
});

router.post('/tarot-summary', authenticateToken, async (req, res) => {
    try {
        const { cards, spreadType } = req.body;

        if (!Array.isArray(cards) || cards.length === 0 || cards.length > 20) {
            return res.status(400).json({ success: false, error: 'Neplatná data karet.' });
        }

        const safeSpreadType = String(spreadType || 'obecný').substring(0, 100);
        const cardContext = cards.map(c => {
            const pos = String(c?.position || '').substring(0, 100);
            const name = String(c?.name || '').substring(0, 100);
            const meaning = String(c?.meaning || '').substring(0, 200);
            return `${pos}: ${name} (${meaning})`;
        }).join(', ');
        const message = `Typ výkladu: ${safeSpreadType}\n\nKarty v kontextu pozic:\n${cardContext}\n\nVytvoř krásný, hluboký souhrn tohoto výkladu.`;

        const response = await callGemini(SYSTEM_PROMPTS.tarotSummary, message);
        res.json({ success: true, response });
    } catch (error) {
        console.error('Tarot Summary Error:', error);
        res.status(500).json({ success: false, error: 'Hlas vesmíru je nyní tichý...' });
    }
});

// ─── Natal Chart ──────────────────────────────────────────────────────────────

router.post('/natal-chart', optionalPremiumCheck, async (req, res) => {
    try {
        const { birthDate, birthTime, birthPlace, name } = req.body;

        if (!birthDate || typeof birthDate !== 'string') {
            return res.status(400).json({ success: false, error: 'Datum narození je povinné.' });
        }

        if (!req.isPremium) {
            return res.json({
                success: true,
                isTeaser: true,
                response: null,
                message: 'Detailní interpretace natální karty je dostupná pouze pro Premium uživatele.'
            });
        }

        const safeName = String(name || 'Tazatel').substring(0, 100);
        const message = `Jméno: ${safeName}\\nDatum narození: ${String(birthDate).substring(0, 30)}\\nČas narození: ${String(birthTime || '').substring(0, 20)}\\nMísto narození: ${String(birthPlace || '').substring(0, 200)}`;

        const response = await callGemini(SYSTEM_PROMPTS.natalChart, message);
        res.json({ success: true, response, isTeaser: false });
    } catch (error) {
        console.error('Natal Chart Error:', error);
        res.status(500).json({ success: false, error: 'Hvězdy nejsou v tuto chvíli čitelné...' });
    }
});

// ─── Synastry ─────────────────────────────────────────────────────────────────

router.post('/synastry', authenticateToken, async (req, res) => {
    try {
        const { person1, person2 } = req.body;
        const userId = req.user.id;

        const safeName1 = String(person1?.name || '').substring(0, 100);
        const safeDate1 = String(person1?.birthDate || '').substring(0, 30);
        const safeName2 = String(person2?.name || '').substring(0, 100);
        const safeDate2 = String(person2?.birthDate || '').substring(0, 30);

        const userIsPremium = await isPremiumUser(userId);

        if (!userIsPremium) {
            return res.json({ success: true, isTeaser: true, response: null });
        }

        const message = `Osoba A: ${safeName1}, narozena ${safeDate1}\nOsoba B: ${safeName2}, narozena ${safeDate2}`;
        const response = await callGemini(SYSTEM_PROMPTS.synastry, message);
        res.json({ success: true, response, isTeaser: false });
    } catch (error) {
        console.error('Synastry Error:', error);
        res.status(500).json({ success: false, error: 'Hvězdná spojení jsou dočasně zahalena...' });
    }
});

// ─── Astrocartography ─────────────────────────────────────────────────────────

router.post('/astrocartography', authenticateToken, requirePremium, async (req, res) => {
    try {
        const { birthDate, birthTime, birthPlace, name, intention = 'obecný' } = req.body;

        if (!birthDate || typeof birthDate !== 'string') {
            return res.status(400).json({ success: false, error: 'Datum narození je povinné.' });
        }

        const message = `Jméno: ${String(name || 'Tazatel').substring(0, 100)}\nDatum narození: ${String(birthDate).substring(0, 30)}\nČas narození: ${String(birthTime || '').substring(0, 20)}\nMísto narození: ${String(birthPlace || '').substring(0, 200)}\nZáměr analýzy: ${String(intention).substring(0, 200)}\n\nVytvoř personalizovanou astrokartografickou mapu s doporučenými lokalitami.`;

        const response = await callGemini(SYSTEM_PROMPTS.astrocartography, message);
        res.json({ success: true, response });
    } catch (error) {
        console.error('Astrocartography Error:', error.message);
        res.status(500).json({ success: false, error: 'Planetární linie jsou momentálně zahaleny mlhou...' });
    }
});

export default router;
