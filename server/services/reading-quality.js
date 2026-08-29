const FORMAL_CZECH_ADDRESS = /(?<![\p{L}\p{N}_])(?:vy|vás|vám|váš|vaše|vaši|vašeho|vašem|jste|buďte|udělejte|využijte|nebojte|věnujte|všimněte|hledejte|důvěřujte|můžete|potřebujete|mlčíte|dáte|držte)(?![\p{L}\p{N}_])/iu;
const INFORMAL_CZECH_ADDRESS = /(?<![\p{L}\p{N}_])(?:ty|tě|ti|tvůj|tvá|tvé|svůj|svou|můžeš|potřebuješ|udělej|všimni|zvol|pojmenuj|nech|hledej|vyber|mlčíš|dáš|drž se|vracíš|rozhoduješ|projevuješ|působíš|nastavíš)(?![\p{L}\p{N}_])/iu;

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
    return {
        text,
        hasFormalAddress: FORMAL_CZECH_ADDRESS.test(text),
        hasInformalAddress: INFORMAL_CZECH_ADDRESS.test(text)
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
