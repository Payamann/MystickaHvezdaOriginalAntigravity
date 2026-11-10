const FORMAL_CZECH_ADDRESS = /(?<![\p{L}\p{N}_])(?:vy|vás|vám|váš|vaše|vaši|vašeho|vašem|jste|buďte|udělejte|využijte|nebojte|věnujte|všimněte|hledejte|důvěřujte|můžete|potřebujete|mlčíte|dáte|držte)(?![\p{L}\p{N}_])/iu;
const INFORMAL_CZECH_ADDRESS = /(?<![\p{L}\p{N}_])(?:ty|tě|ti|tvůj|tvá|tvé|svůj|svou|můžeš|potřebuješ|udělej|všimni|zvol|pojmenuj|nech|hledej|vyber|mlčíš|dáš|drž se|vracíš|rozhoduješ|projevuješ|působíš|nastavíš)(?![\p{L}\p{N}_])/iu;
const ADDITIONAL_INFORMAL_CZECH = /(?<![\p{L}\p{N}_])(?:tvou|tvého|tvému|tvém|tvých|tvým|tvými|tvoje|tvoji|tvojí|jsi|bys|máš|chceš|víš|nevíš|cítíš|vnímáš|hledáš|prožíváš|očekáváš|zkus|zvaž|řekni|napiš|dovol|zamysli|uvědom|přijmi|zkoumej|polož)(?![\p{L}\p{N}_])/iu;
const ADDITIONAL_FORMAL_CZECH = /(?<![\p{L}\p{N}_])(?:máte|chcete|víte|nevíte|cítíte|vnímáte|hledáte|prožíváte|očekáváte|věříte|rozumíte|zkuste|zvažte|řekněte|napište|dovolte|zamyslete|uvědomte|přijměte|zkoumejte|položte)(?![\p{L}\p{N}_])/iu;

function toReadingText(value) {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object') return '';
    return Object.values(value)
        .map((entry) => toReadingText(entry))
        .filter(Boolean)
        .join(' ');
}

export function inspectCzechReadingVoice(value) {
    const text = toReadingText(value);
    const originalInformal = INFORMAL_CZECH_ADDRESS.test(text);
    // New vocabulary must not turn previously accepted output into a fallback.
    // For the new path, ignore bounded quotations: they may address someone else.
    const outsideQuotes = text.replace(/„[^“\n]{0,500}“|“[^”\n]{0,500}”|"[^"\n]{0,500}"/gu, ' ');
    return {
        text,
        hasFormalAddress: FORMAL_CZECH_ADDRESS.test(text) || (!originalInformal && ADDITIONAL_FORMAL_CZECH.test(outsideQuotes)),
        hasInformalAddress: originalInformal || ADDITIONAL_INFORMAL_CZECH.test(outsideQuotes)
    };
}

export function assertCzechReadingVoice(value) {
    const inspection = inspectCzechReadingVoice(value);

    if (inspection.hasFormalAddress) {
        throw new Error('Generated reading uses formal Czech address.');
    }
    if (!inspection.hasInformalAddress) {
        throw new Error('Generated reading does not address the reader in Czech tykání.');
    }

    return inspection.text;
}
