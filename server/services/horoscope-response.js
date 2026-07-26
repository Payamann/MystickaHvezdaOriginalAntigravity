/**
 * Cache drží horoskop jako JSON `{prediction, affirmation, luckyNumbers}` (tak ho
 * ukládá web i prefill), ale e-mailové šablony čekají jeden textový blok. Bez tohoto
 * rozbalení by odběratelům přišel syrový JSON.
 * Starší záznamy jsou prostý text — ty se vrací beze změny.
 */
export function formatHoroscopeForEmail(raw) {
    const text = typeof raw === 'string' ? raw.trim() : '';
    if (!text) return '';
    if (!text.startsWith('{')) return text;

    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch {
        return text;
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.prediction) return text;

    const parts = [String(parsed.prediction).trim()];

    if (parsed.affirmation) {
        parts.push(`✨ Afirmace: ${String(parsed.affirmation).trim()}`);
    }

    if (Array.isArray(parsed.luckyNumbers) && parsed.luckyNumbers.length) {
        parts.push(`🔢 Čísla štěstí: ${parsed.luckyNumbers.join(', ')}`);
    }

    return parts.join('\n\n');
}

export function normalizeHoroscopeAiResponse(rawResponse) {
    const cleanResponse = String(rawResponse || '')
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();

    let parsed;
    try {
        parsed = JSON.parse(cleanResponse);
    } catch {
        throw new Error('Claude returned invalid horoscope JSON.');
    }

    const prediction = typeof parsed?.prediction === 'string' ? parsed.prediction.trim() : '';
    const affirmation = typeof parsed?.affirmation === 'string' ? parsed.affirmation.trim() : '';
    const luckyNumbers = Array.isArray(parsed?.luckyNumbers)
        ? parsed.luckyNumbers
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value >= 1 && value <= 99)
            .slice(0, 4)
        : [];

    if (!prediction || !affirmation || luckyNumbers.length < 4) {
        throw new Error('Claude returned incomplete horoscope JSON.');
    }

    return {
        parsed: { prediction, affirmation, luckyNumbers },
        serialized: JSON.stringify({ prediction, affirmation, luckyNumbers })
    };
}
