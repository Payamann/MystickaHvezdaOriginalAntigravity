const PROFILES = Object.freeze({
    site_translation: { modelTier: 'luna', maxTokens: 3000, timeoutMs: 45000, maxRetries: 0 },
    default: { modelTier: 'luna', maxTokens: 1600, timeoutMs: 30000, maxRetries: 2 },
    briefing: { modelTier: 'luna', maxTokens: 700, timeoutMs: 20000, maxRetries: 1 },
    crystal_ball: { modelTier: 'luna', maxTokens: 700, timeoutMs: 20000, maxRetries: 1 },
    tarot_single: { modelTier: 'luna', maxTokens: 850, timeoutMs: 20000, maxRetries: 1 },
    tarot_multi: { modelTier: 'luna', maxTokens: 1400, timeoutMs: 30000, maxRetries: 2 },
    tarot_summary: { modelTier: 'luna', maxTokens: 1400, timeoutMs: 30000, maxRetries: 2 },
    relationship_tarot: { modelTier: 'luna', maxTokens: 4200, timeoutMs: 90000, maxRetries: 1 },
    angel_card: { modelTier: 'luna', maxTokens: 700, timeoutMs: 20000, maxRetries: 1 },
    runes: { modelTier: 'luna', maxTokens: 900, timeoutMs: 20000, maxRetries: 1 },
    daily_wisdom: { modelTier: 'luna', maxTokens: 550, timeoutMs: 20000, maxRetries: 1 },
    horoscope_daily: { modelTier: 'luna', maxTokens: 700, timeoutMs: 20000, maxRetries: 1 },
    horoscope_weekly: { modelTier: 'luna', maxTokens: 1000, timeoutMs: 30000, maxRetries: 2 },
    horoscope_monthly: { modelTier: 'luna', maxTokens: 1200, timeoutMs: 30000, maxRetries: 2 },
    dream_analysis: { modelTier: 'luna', maxTokens: 1400, timeoutMs: 30000, maxRetries: 2 },
    natal_chart: { modelTier: 'luna', maxTokens: 1800, timeoutMs: 30000, maxRetries: 2 },
    synastry: { modelTier: 'luna', maxTokens: 1800, timeoutMs: 30000, maxRetries: 2 },
    astrocartography: { modelTier: 'luna', maxTokens: 1800, timeoutMs: 30000, maxRetries: 2 },
    numerology: { modelTier: 'luna', maxTokens: 1600, timeoutMs: 30000, maxRetries: 2 },
    past_life: { modelTier: 'luna', maxTokens: 1800, timeoutMs: 30000, maxRetries: 2 },
    medicine_wheel: { modelTier: 'luna', maxTokens: 1500, timeoutMs: 30000, maxRetries: 2 },
    mentor: { modelTier: 'luna', maxTokens: 1400, timeoutMs: 30000, maxRetries: 2 },
    annual_horoscope_pdf: { modelTier: 'luna', maxTokens: 4096, timeoutMs: 90000, maxRetries: 1 },
    personal_map_pdf: { modelTier: 'luna', maxTokens: 12288, timeoutMs: 120000, maxRetries: 1 }
});

export function getAIProfile(feature = 'default', overrides = {}) {
    const base = PROFILES[feature] || PROFILES.default;
    const modelTier = 'luna';
    const model = overrides.model || process.env.OPENAI_MODEL || 'gpt-6-luna';
    // Keep the user-selected cost tier explicit. Stale provider/model overrides
    // must fail before an API request, never select a different paid provider.
    if (model !== 'gpt-6-luna' || (overrides.modelTier && overrides.modelTier !== 'luna')) {
        throw new Error('This site is configured for OpenAI gpt-6-luna only.');
    }
    const reasoningEffort = overrides.reasoningEffort || process.env.OPENAI_REASONING_EFFORT || 'none';
    if (!['none', 'low', 'medium', 'high', 'xhigh', 'max'].includes(reasoningEffort)) {
        throw new Error('Invalid OpenAI reasoning effort.');
    }

    return {
        feature,
        provider: 'openai',
        reasoningEffort,
        modelTier,
        model,
        maxTokens: overrides.maxTokens || base.maxTokens,
        timeoutMs: overrides.timeoutMs || base.timeoutMs,
        maxRetries: Number.isInteger(overrides.maxRetries)
            ? overrides.maxRetries
            : base.maxRetries
    };
}

export function listAIProfiles() {
    return PROFILES;
}
