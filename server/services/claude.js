// Native fetch is used in Node 18+
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-5';

const REQUEST_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;
const DEFAULT_DAILY_AI_CALL_LIMIT = 120;
const MAX_DAILY_AI_CALL_LIMIT = 10000;
const USE_MOCK_AI = process.env.MOCK_AI === 'true' || process.env.NODE_ENV === 'test';
let aiBudgetDate = null;
let aiRequestsReserved = 0;

const API_KEY = (() => {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
        console.error('WARNING: ANTHROPIC_API_KEY is not defined in environment variables.');
    }
    return key;
})();

export function normalizeDailyAICallLimit(value) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return DEFAULT_DAILY_AI_CALL_LIMIT;
    return Math.min(MAX_DAILY_AI_CALL_LIMIT, Math.max(1, parsed));
}

export function reserveDailyAIRequest({
    now = new Date(),
    limit = normalizeDailyAICallLimit(process.env.AI_DAILY_CALL_LIMIT)
} = {}) {
    const dateKey = now.toISOString().slice(0, 10);
    if (aiBudgetDate !== dateKey) {
        aiBudgetDate = dateKey;
        aiRequestsReserved = 0;
    }

    if (aiRequestsReserved >= limit) {
        const error = new Error(`Daily AI request limit reached (${limit}).`);
        error.code = 'AI_DAILY_BUDGET_EXHAUSTED';
        throw error;
    }

    aiRequestsReserved += 1;
    return {
        date: aiBudgetDate,
        limit,
        used: aiRequestsReserved,
        remaining: limit - aiRequestsReserved
    };
}

export function resetDailyAIRequestBudget() {
    aiBudgetDate = null;
    aiRequestsReserved = 0;
}

/**
 * Calls the Claude API with a system prompt and user message.
 * Drop-in replacement for callGemini.
 */
export async function callClaude(systemPrompt, messageOrHistory, contextData = null) {
    if (USE_MOCK_AI) {
        if (process.env.MOCK_AI_FORCE_ERROR === 'true') {
            throw new Error('Forced mock AI error.');
        }
        return buildMockClaudeResponse(systemPrompt);
    }

    if (!API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not defined in environment variables.');
    }

    let fullSystem = systemPrompt;
    if (contextData) {
        const { userContext, appContext } = contextData;
        if (userContext) {
            fullSystem += `\n\nPROFIL UŽIVATELE:\nJméno: ${userContext.name || 'Neznámé'}\nZnamení: ${userContext.zodiacSign || 'Neznámé'}\nDatum narození: ${userContext.birthDate || 'Neznámé'}\n`;
        }
        if (appContext) {
            fullSystem += `\n\nKONTEXT APLIKACE:\n${appContext}`;
        }
    }

    let messages;
    if (Array.isArray(messageOrHistory)) {
        messages = messageOrHistory.map(msg => ({
            role: msg.role === 'mentor' || msg.role === 'model' ? 'assistant' : 'user',
            content: msg.content
        }));
    } else {
        messages = [{ role: 'user', content: messageOrHistory }];
    }

    const requestBody = {
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: fullSystem,
        messages
    };

    let lastError;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            reserveDailyAIRequest();
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

            const response = await fetch(CLAUDE_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const status = response.status;
                if ((status === 429 || status === 529) && attempt < MAX_RETRIES) {
                    const delay = Math.pow(2, attempt + 1) * 1000;
                    console.warn(`[Claude Service] ${status} error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                const errorText = await response.text();
                throw new Error(`Claude API Error (${status}): ${errorText}`);
            }

            const data = await response.json();
            const text = data.content?.[0]?.text;

            if (!text) {
                throw new Error('No content returned from Claude.');
            }

            return text;

        } catch (error) {
            lastError = error;
            if (error.code === 'AI_DAILY_BUDGET_EXHAUSTED') {
                console.error('[Claude Service] Daily request budget exhausted');
                throw error;
            }
            if (error.name === 'AbortError') {
                console.error('[Claude Service] Request timed out');
                if (attempt < MAX_RETRIES) {
                    const delay = Math.pow(2, attempt + 1) * 1000;
                    console.warn(`[Claude Service] Retrying after timeout (attempt ${attempt + 1}/${MAX_RETRIES})`);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                throw new Error('Claude API request timed out');
            }
            if (attempt >= MAX_RETRIES) {
                console.error('[Claude Service] Error:', error.message);
                throw error;
            }
        }
    }

    throw lastError;
}

function buildMockClaudeResponse(systemPrompt = '') {
    if (process.env.MOCK_AI_FORCE_INVALID_JSON === 'true') {
        return 'Testovaci AI odpoved pro invalidni JSON fallback.';
    }

    if (systemPrompt.includes('"prediction"') && systemPrompt.includes('"affirmation"')) {
        return JSON.stringify({
            prediction: 'Testovaci horoskop prinasi klidnou energii, jasne priority a jeden prakticky krok pro dnesni den.',
            affirmation: 'Dnes postupuji klidne, jasne a duveruji vlastnimu vnitrnimu vedeni.',
            luckyNumbers: [3, 7, 12, 21]
        });
    }

    return 'Testovaci AI odpoved pro izolovane automatizovane testy.';
}
