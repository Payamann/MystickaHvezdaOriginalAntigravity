const POSITIONS = {
    'Tři karty': ['Minulost', 'Přítomnost', 'Budoucnost'],
    'Celtic Cross': ['Situace', 'Výzva', 'Podvědomí', 'Základ', 'Minulost', 'Budoucnost', 'Postoj', 'Vliv okolí', 'Naděje/Obavy', 'Výsledek']
};

export function tarotCardPosition(spreadType, index) {
    if (spreadType === 'Jedna karta') return 'Jedna karta';
    return POSITIONS[spreadType]?.[index] || `Karta ${index + 1}`;
}

// Keep the displayed card text with the saved reading, independently of future
// catalogue edits. Callers exclude locked cards before creating this payload.
export function savedTarotCards(cards, spreadType) {
    return cards.map((card, index) => ({
        name: card.name,
        position: tarotCardPosition(spreadType, index),
        meaning: card.meaning || '',
        interpretation: card.interpretation || '',
        image: card.image || ''
    }));
}
