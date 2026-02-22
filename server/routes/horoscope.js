/**
 * Horoscope Routes
 * GET/POST /api/horoscope
 * Includes daily/weekly/monthly horoscope with database caching
 */
import express from 'express';
import { optionalPremiumCheck } from '../middleware.js';
import { callGemini } from '../services/gemini.js';
import { SYSTEM_PROMPTS } from '../config/prompts.js';
import { getHoroscopeCacheKey, getCachedHoroscope, saveCachedHoroscope } from '../services/astrology.js';

export const router = express.Router();

const VALID_ZODIAC_SIGNS = ['Beran', 'Býk', 'Blíženci', 'Rak', 'Lev', 'Panna', 'Váhy', 'Štír', 'Střelec', 'Kozoroh', 'Vodnář', 'Ryby'];

router.post('/', optionalPremiumCheck, async (req, res) => {
    try {
        const { sign, period = 'daily', context = [] } = req.body;

        if (!sign || !VALID_ZODIAC_SIGNS.includes(sign)) {
            return res.status(400).json({ success: false, error: 'Neplatné znamení zvěrokruhu.' });
        }

        if (!['daily', 'weekly', 'monthly'].includes(period)) {
            return res.status(400).json({ success: false, error: 'Neplatné období.' });
        }

        // PREMIUM GATE: Free users can only access daily horoscope
        if (!req.isPremium && period !== 'daily') {
            return res.status(402).json({
                success: false,
                error: 'Týdenní a měsíční horoskopy jsou dostupné pouze pro Premium uživatele.',
                code: 'PREMIUM_REQUIRED',
                feature: 'horoscope_extended'
            });
        }

        // Generate cache key (include context hash to avoid stale cache if context changes)
        const contextHash = Array.isArray(context) && context.length > 0
            ? Buffer.from(context.join('')).toString('base64').substring(0, 10)
            : 'nocontext';
        const cacheKey = getHoroscopeCacheKey(sign, period) + `-${contextHash}`;

        // Check database cache first
        const cachedData = await getCachedHoroscope(cacheKey);
        if (cachedData) {
            console.log(`📦 Horoscope Cache HIT: ${cacheKey}`);
            return res.json({
                success: true,
                response: cachedData.response,
                period: cachedData.period_label,
                cached: true
            });
        }

        console.log(`🔄 Horoscope Cache MISS: ${cacheKey} - Generating new...`);

        let periodPrompt;
        let periodLabel;
        let contextInstruction = '';

        if (context && Array.isArray(context) && context.length > 0) {
            const sanitized = context
                .slice(0, 5)
                .map(c => String(c).replace(/[\r\n\t]/g, ' ').substring(0, 300))
                .filter(c => c.trim().length > 0);

            if (sanitized.length > 0) {
                contextInstruction = `\nCONTEXT (Z uživatelova deníku):\n"${sanitized.join('", "')}"\nINSTRUKCE PRO SYNERGII: Pokud je to relevantní, jemně a nepřímo nawazuj na témata z deníku. Neříkej "V deníku vidím...", ale spíše "Hvězdy naznačují posun v tématech, která tě trápí...". Buď empatický.`;
            }
        }

        if (period === 'weekly') {
            periodLabel = 'Týdenní horoskop';
            periodPrompt = `Jsi inspirativní astrologický průvodce.\nGeneruj týdenní horoskop ve formátu JSON.\nOdpověď MUSÍ být validní JSON objekt bez markdown formátování (žádné \`\`\`json).\nStruktura:\n{\n  "prediction": "Text horoskopu (5-6 vět). Zaměř se na hlavní energii, lásku, kariéru a jednu výzvu.",\n  "affirmation": "Krátká, úderná afirmace pro tento týden.",\n  "luckyNumbers": [číslo1, číslo2, číslo3, číslo4]\n}\nText piš česky, poeticky a povzbudivě.${contextInstruction}`;
        } else if (period === 'monthly') {
            periodLabel = 'Měsíční horoskop';
            periodPrompt = `Jsi moudrý astrologický průvodce.\nGeneruj měsíční horoskop ve formátu JSON.\nOdpověď MUSÍ být validní JSON objekt bez markdown formátování (žádné \`\`\`json).\nStruktura:\n{\n  "prediction": "Text horoskopu (7-8 vět). Zahrň úvod, lásku, kariéru, zdraví a klíčová data.",\n  "affirmation": "Silná afirmace pro tento měsíc.",\n  "luckyNumbers": [číslo1, číslo2, číslo3, číslo4]\n}\nText piš česky, inspirativně a hluboce.${contextInstruction}`;
        } else {
            periodLabel = 'Denní inspirace';
            periodPrompt = `Jsi laskavý astrologický průvodce.\nGeneruj denní horoskop ve formátu JSON.\nOdpověď MUSÍ být validní JSON objekt bez markdown formátování (žádné \`\`\`json).\nStruktura:\n{\n  "prediction": "Text horoskopu (3-4 věty). Hlavní energie dne a jedna konkrétní rada.",\n  "affirmation": "Krátká pozitivní afirmace pro dnešek.",\n  "luckyNumbers": [číslo1, číslo2, číslo3, číslo4]\n}\nText piš česky, poeticky a povzbudivě.${contextInstruction}`;
        }

        const today = new Date();
        const message = `Znamení: ${sign}\nDatum: ${today.toLocaleDateString('cs-CZ')}`;

        const response = await callGemini(periodPrompt, message);

        await saveCachedHoroscope(cacheKey, sign, period, response, periodLabel);
        console.log(`💾 Horoscope cached in DB: ${cacheKey}`);

        res.json({ success: true, response, period: periodLabel });
    } catch (error) {
        console.error('Horoscope Error:', error);
        res.status(500).json({ success: false, error: 'Předpověď není dostupná...' });
    }
});

export default router;
