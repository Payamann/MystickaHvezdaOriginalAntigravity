// Legacy import compatibility: all text generation uses the shared OpenAI transport.
import { callAI } from './openai.js';

export function callGemini(systemPrompt, messageOrHistory, contextData = null) {
    return callAI(systemPrompt, messageOrHistory, contextData, {
        feature: 'legacy_text', maxTokens: 2048
    });
}
