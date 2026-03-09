import { supabase } from '../db-supabase.js';

// ============================================
// MOON PHASE CALCULATIONS
// ============================================

// In-memory cache: store moon phase result for each day
// This avoids recalculating the same phase multiple times per day
let cachedMoonPhase = null;
let cachedMoonDate = null;

export function calculateMoonPhase() {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Return cached result if it's still the same day
    if (cachedMoonDate === today && cachedMoonPhase) {
        return cachedMoonPhase;
    }

    const synodic = 29.53058867; // Synodic month (new moon to new moon)
    const knownNewMoon = new Date('2024-01-11T11:57:00'); // Known New Moon reference
    const diffDays = (now - knownNewMoon) / (1000 * 60 * 60 * 24);
    const phaseIndex = (diffDays % synodic);

    // Normalize to 0-29.5
    let currentPhase = phaseIndex;
    if (currentPhase < 0) currentPhase += synodic;

    // Determine simplified phase name
    let phaseName;
    if (currentPhase < 1.5 || currentPhase > 28) phaseName = 'Nov (Znovuzrození, nové začátky)';
    else if (currentPhase < 7) phaseName = 'Dorůstající srpek (Budování, sbírání sil)';
    else if (currentPhase < 9) phaseName = 'První čtvrť (Překonávání překážek)';
    else if (currentPhase < 14) phaseName = 'Dorůstající měsíc (Zdokonalování)';
    else if (currentPhase < 16) phaseName = 'Úplněk (Vyvrcholení, odhalení pravdy)';
    else if (currentPhase < 21) phaseName = 'Couvající měsíc (Uvolňování, vděčnost)';
    else if (currentPhase < 23) phaseName = 'Poslední čtvrť (Odpouštění)';
    else phaseName = 'Couvající srpek (Očista, odpočinek)';

    // Cache the result for this day
    cachedMoonPhase = phaseName;
    cachedMoonDate = today;

    return phaseName;
}

// ============================================
// HOROSCOPE CACHE & UTILS
// ============================================

// Generate cache key based on sign, period, and date
export function getHoroscopeCacheKey(sign, period) {
    const now = new Date();
    const signNormalized = sign.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (period === 'weekly') {
        // ISO week number
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        return `${signNormalized}_weekly_${now.getFullYear()}-W${String(week).padStart(2, '0')}_v2`;
    } else if (period === 'monthly') {
        return `${signNormalized}_monthly_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}_v2`;
    } else {
        // Daily (default)
        return `${signNormalized}_daily_${now.toISOString().split('T')[0]}_v2`;
    }
}

// Get cached horoscope from database
export async function getCachedHoroscope(cacheKey) {
    try {
        const { data, error } = await supabase
            .from('cache_horoscopes')
            .select('cache_key, response, period_label, generated_at')
            .eq('cache_key', cacheKey)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw error;
        }

        return data;
    } catch (e) {
        console.warn('Cache get error:', e.message);
        return null;
    }
}

// Save horoscope to database cache
export async function saveCachedHoroscope(cacheKey, sign, period, response, periodLabel) {
    try {
        const { error } = await supabase
            .from('cache_horoscopes')
            .upsert({
                cache_key: cacheKey,
                sign,
                period,
                response,
                period_label: periodLabel,
                generated_at: new Date().toISOString()
            }, {
                onConflict: 'cache_key'
            });

        if (error) throw error;
    } catch (e) {
        console.warn('Cache save error:', e.message);
    }
}
