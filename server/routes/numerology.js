/**
 * Numerology Routes
 * POST /api/numerology
 * Premium only, with database caching
 */
import express from 'express';
import crypto from 'crypto';
import { authenticateToken, requirePremium } from '../middleware.js';
import { callGemini } from '../services/gemini.js';
import { SYSTEM_PROMPTS } from '../config/prompts.js';
import { supabase } from '../db-supabase.js';

export const router = express.Router();

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
                name: inputs.name,
                birth_date: inputs.birthDate,
                birth_time: inputs.birthTime,
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

router.post('/', authenticateToken, requirePremium, async (req, res) => {
    try {
        const { name, birthDate, birthTime, lifePath, destiny, soul, personality } = req.body;

        const cacheKey = crypto.createHash('md5')
            .update(`${name}_${birthDate}_${birthTime || 'notime'}_${lifePath}_${destiny}_${soul}_${personality}`)
            .digest('hex');

        const cachedData = await getCachedNumerology(cacheKey);
        if (cachedData) {
            console.log(`📦 Numerology Cache HIT (DB): ${cacheKey}`);
            return res.json({ success: true, response: cachedData.response, cached: true });
        }

        console.log(`🔄 Numerology Cache MISS: ${cacheKey} - Generating new interpretation...`);

        const message = `Jméno: ${name}\nDatum narození: ${birthDate}${birthTime ? `\nČas narození: ${birthTime}` : ''}\n\nVypočítaná čísla:\n- Číslo životní cesty: ${lifePath}\n- Číslo osudu: ${destiny}\n- Číslo duše: ${soul}\n- Číslo osobnosti: ${personality}\n\nVytvoř komplexní interpretaci tohoto numerologického profilu.${birthTime ? ' Vezmi v potaz i čas narození pro hlubší výklad.' : ''}`;

        const response = await callGemini(SYSTEM_PROMPTS.numerology, message);

        await saveCachedNumerology(cacheKey, { name, birthDate, birthTime, lifePath, destiny, soul, personality }, response);
        console.log(`💾 Numerology cached in DB: ${cacheKey}`);

        res.json({ success: true, response });
    } catch (error) {
        console.error('Numerology Error:', error);
        res.status(500).json({ success: false, error: 'Čísla momentálně nemohou promluvit...' });
    }
});

export default router;
