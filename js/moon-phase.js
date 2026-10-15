import { getLunarState } from './utils/lunar-state.js';
/**
 * Mystická Hvězda - Moon Phase Utility
 * Simple calculation of lunar phase based on date.
 */
export function getMoonPhase(date = new Date()) {
    return getLunarState(date);
}

export function getRitualDescription(phaseSlug) {
    const rituals = {
        'new-moon':        'Čas pro nové začátky, setí záměrů a vnitřní klid.',
        'waxing-crescent': 'Fáze růstu. Čas pro první kroky a odvahu k akci.',
        'first-quarter':   'Čas překonávat překážky, rozhodovat se a jednat s vůlí.',
        'waxing-gibbous':  'Fáze zdokonalování. Vylaď detail, který už máš rozpracovaný.',
        'full-moon':       'Vrchol energie. Čas pro oslavu, vděčnost a vědomé propuštění.',
        'waning-gibbous':  'Fáze reflexe. Připomeň si jednu zkušenost a podle chuti ji sdílej.',
        'last-quarter':    'Čas hlubokého čistění — vyber jednu drobnost, kterou chceš uzavřít.',
        'waning-crescent': 'Čas odpočinku, obnovy a tiché přípravy na nový cyklus.',
    };
    return rituals[phaseSlug] || 'Univerzální rituál pro harmonii s hvězdami.';
}

// Auto-update moon phase card on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMoonPhaseCard);
} else {
    initMoonPhaseCard();
}

function initMoonPhaseCard() {
    const card = document.getElementById('moon-phase-card');
    if (card) {
        const phase = getMoonPhase();
        card.textContent = phase.name;
        window.MH_MOON_ART?.render(card, phase.icon, phase.name);
    }
}
