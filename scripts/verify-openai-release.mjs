import { pathToFileURL } from 'node:url';
import { getAIProfile } from '../server/config/ai-profiles.js';

export async function verifyOpenAIRelease({ generate } = {}) {
    if (!process.env.OPENAI_API_KEY?.trim()) throw new Error('OPENAI_API_KEY is missing.');
    if (process.env.MOCK_AI === 'true' || process.env.NODE_ENV === 'test') {
        throw new Error('Release verification requires the real OpenAI transport.');
    }
    const profile = getAIProfile('site_translation');
    getAIProfile('relationship_tarot', {
        model: process.env.OPENAI_RELATIONSHIP_MODEL || profile.model
    });
    const call = generate || (await import('../server/services/openai.js')).callAI;
    const result = await call(
        'This is a synthetic deployment connectivity check. Return only the requested JSON object.',
        'Return {"ok":true}.',
        null,
        {
            feature: 'site_translation', model: profile.model, reasoningEffort: 'none',
            maxTokens: 64, timeoutMs: 20000, maxRetries: 0,
            outputSchema: {
                type: 'object', properties: { ok: { type: 'boolean', enum: [true] } },
                required: ['ok'], additionalProperties: false
            }
        }
    );
    const parsed = JSON.parse(result);
    if (parsed.ok !== true || Object.keys(parsed).length !== 1) {
        throw new Error('OpenAI connectivity check returned an invalid result.');
    }
    return profile.model;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const timer = setTimeout(() => {
        console.error('[openai-release] Verification deadline exceeded. Deployment blocked.');
        process.exit(1);
    }, 45000);
    try {
        const model = await verifyOpenAIRelease();
        console.log(`[openai-release] Real OpenAI structured response verified: ${model}.`);
        clearTimeout(timer);
        process.exit(0);
    } catch (error) {
        console.error(`[openai-release] Deployment blocked (${error.code || 'verification_failed'}). Check model access, key and AI budget; no fallback provider used.`);
        clearTimeout(timer);
        process.exit(1);
    }
}
