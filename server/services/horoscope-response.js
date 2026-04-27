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
