/**
 * Numerology Routes
 * POST /api/numerology
 * Premium only, with database caching
 */
import express from 'express';
import { calculateLifePath, calculateDestiny, calculateSoul, calculatePersonality, getTodayIsoDate } from '../../js/utils/numerology-logic.js';
import crypto from 'crypto';
import { aiLimiter, authenticateToken, requireFeature } from '../middleware.js';
import { callClaude } from '../services/claude.js';
import { SYSTEM_PROMPTS } from '../config/prompts.js';
import { assertCzechReadingVoice } from '../services/reading-quality.js';
import { supabase } from '../db-supabase.js';

export const router = express.Router();

function isValidIsoDate(value) {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function getCachedNumerology(cacheKey) {
    try {
        const { data, error } = await supabase
            .from('cache_numerology')
            .select('*')
            .eq('cache_key', cacheKey)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }
        return data;
    } catch (e) {
        console.warn('Numerology cache get error:', e.message);
        return null;
    }
}

async function saveCachedNumerology(cacheKey, inputs, response) {
    try {
        const { error } = await supabase
            .from('cache_numerology')
            .upsert({
                cache_key: cacheKey,
                life_path: inputs.lifePath,
                destiny: inputs.destiny,
                soul: inputs.soul,
                personality: inputs.personality,
                response,
                generated_at: new Date().toISOString()
            }, { onConflict: 'cache_key' });

        if (error) throw error;
    } catch (e) {
        console.warn('Numerology cache save error:', e.message);
    }
}

function buildFallbackNumerologyResponse({ lifePath, destiny, soul, personality }) {
    return [
        `V tomto numerologickém systému vyšly hodnoty: životní cesta ${lifePath}, osud ${destiny}, duše ${soul} a osobnost ${personality}. Jde o symbolický výklad, ne o ověřený popis povahy nebo budoucnosti.`,
        `Životní cesta ${lifePath} se v některých numerologických směrech spojuje s tématem směru. Můžeš ji vzít jako otázku: které volby jsou v souladu s tím, na čem ti záleží?`,
        `Číslo osudu ${destiny}, duše ${soul} a osobnosti ${personality} nabízejí tři další symbolické úhly pohledu. Neurčují, jaký jsi; mohou posloužit k vlastnímu zamyšlení.`,
        'Vyber si z těchto témat jedno, které teď považuješ za užitečné, a ověř ho na konkrétní zkušenosti.'
    ].join('\n\n');
}

router.post('/', authenticateToken, requireFeature('numerologie_vyklad'), aiLimiter, async (req, res) => {
    try {
        const { name, birthDate } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 120) {
            return res.status(400).json({ success: false, error: 'Zadejte platné jméno.' });
        }

        if (!birthDate || typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !isValidIsoDate(birthDate)) {
            return res.status(400).json({ success: false, error: 'Zadejte platné datum narození.' });
        }
        const todayInPrague = getTodayIsoDate();
        if (birthDate > todayInPrague) {
            return res.status(400).json({ success: false, error: 'Datum narození nemůže být v budoucnosti.' });
        }

        const cleanName = name.trim().substring(0, 120);
        const lifePath = calculateLifePath(birthDate, todayInPrague);
        const destiny = calculateDestiny(cleanName);
        const soul = calculateSoul(cleanName);
        const personality = calculatePersonality(cleanName);

        const cacheKey = crypto.createHash('sha256')
            .update(`numerology-symbolic-v3_${lifePath}_${destiny}_${soul}_${personality}`)
            .digest('hex');

        const cachedData = await getCachedNumerology(cacheKey);
        if (cachedData) {
            console.log(`📦 Numerology Cache HIT (DB): ${cacheKey}`);
            return res.json({ success: true, response: cachedData.response, cached: true });
        }

        console.log(`🔄 Numerology Cache MISS: ${cacheKey} - Generating new interpretation...`);

        const message = `Vypočítané symbolické hodnoty podle metody stránky:\n- Číslo životní cesty: ${lifePath}\n- Číslo osudu: ${destiny}\n- Číslo duše: ${soul}\n- Číslo osobnosti: ${personality}\n\nVytvoř srozumitelný výklad pouze těchto čtyř hodnot. Nepočítej další čísla ani osobní cykly.`;

        let response;
        let fallback = false;

        try {
            response = await callClaude(SYSTEM_PROMPTS.numerology, message, null, {
                feature: 'numerology'
            });
            assertCzechReadingVoice(response);

            await saveCachedNumerology(cacheKey, {
                lifePath,
                destiny,
                soul,
                personality
            }, response);
            console.log(`💾 Numerology cached in DB: ${cacheKey}`);
        } catch (aiError) {
            console.warn('Numerology AI fallback used:', aiError.message);
            fallback = true;
            response = buildFallbackNumerologyResponse({
                lifePath,
                destiny,
                soul,
                personality
            });
        }

        res.json({
            success: true,
            response,
            fallback,
            numbers: { lifePath, destiny, soul, personality }
        });
    } catch (error) {
        console.error('Numerology Error:', error);
        res.status(500).json({ success: false, error: 'Numerologický výklad se teď nepodařilo připravit. Zkus to znovu.' });
    }
});

export default router;
