import { getLunarState } from './utils/lunar-state.js';

// 🌕 Lunar Phase Calculation (pure JS, no external API)
const PHASES = [
    {
        name: 'Novoluní',
        emoji: '🌑',
        minAge: 0,
        maxAge: 1.85,
        illumination: 0,
        tags: ['Nové začátky', 'Záměry', 'Introspekce', 'Ticho'],
        interpretation: 'Novoluní nabízí symbol prázdného místa a začátku. Nemusí se hned zaplnit velkým plánem. Podívej se, pro co chceš v běžném dni udělat prostor.',
        advice: 'Vyber jeden malý záměr a napiš, podle čeho poznáš první skutečný krok.'
    },
    {
        name: 'Dorůstající srpek',
        emoji: '🌒',
        minAge: 1.85,
        maxAge: 6.38,
        illumination: 25,
        tags: ['Akce', 'Iniciativa', 'Víra', 'Nadšení'],
        interpretation: 'Dorůstající srpek může připomenout křehký začátek. Po prvním nápadu obvykle pomůže malý pokus a prostor na zkušenost.',
        advice: 'Vyzkoušej jednu část svého plánu bez požadavku na dokonalý výsledek.'
    },
    {
        name: 'První čtvrť',
        emoji: '🌓',
        minAge: 6.38,
        maxAge: 8.0,
        illumination: 50,
        tags: ['Překážky', 'Rozhodnutí', 'Vůle', 'Konflikt'],
        interpretation: 'První čtvrť je vhodný obraz rozhodování mezi možnostmi. Lunární symbolika sama neříká, kterou cestu vybrat.',
        advice: 'Pojmenuj jednu překážku a zjisti údaj, který ti pomůže rozhodnout.'
    },
    {
        name: 'Dorůstající měsíc',
        emoji: '🌔',
        minAge: 8.0,
        maxAge: 13.77,
        illumination: 75,
        tags: ['Vytrvalost', 'Zdokonalování', 'Analýza', 'Dolaďování'],
        interpretation: 'Dorůstající měsíc může posloužit jako podnět k revizi rozpracovaného. Není potřeba přidávat další úkol jen kvůli fázi Měsíce.',
        advice: 'Vrať se k jednomu detailu a uprav ho podle skutečné zpětné vazby.'
    },
    {
        name: 'Úplněk',
        emoji: '🌕',
        minAge: 13.77,
        maxAge: 15.77,
        illumination: 100,
        tags: ['Vrchol', 'Manifestace', 'Emoce', 'Odhalení', 'Naplnění'],
        interpretation: 'Úplněk bývá symbolem viditelnosti a završení. Může nabídnout příležitost ohlédnout se za výsledkem; nepředpovídá zvýšené emoce ani odhalení tajemství.',
        advice: 'Zapiš jeden konkrétní pokrok a něco, co se při něm ukázalo jinak, než byl původní plán.'
    },
    {
        name: 'Ubývající měsíc',
        emoji: '🌖',
        minAge: 15.77,
        maxAge: 21.15,
        illumination: 75,
        tags: ['Sdílení', 'Moudrost', 'Vděčnost', 'Odpočinek'],
        interpretation: 'Ubývající měsíc může připomenout ohlédnutí a sdílení zkušenosti. Zastav se u toho, co pro tebe bylo opravdu použitelné.',
        advice: 'Vyber jednu zkušenost, kterou chceš zaznamenat pro příští podobnou situaci.'
    },
    {
        name: 'Poslední čtvrť',
        emoji: '🌗',
        minAge: 21.15,
        maxAge: 23.15,
        illumination: 50,
        tags: ['Propuštění', 'Čištění', 'Transformace', 'Přehodnocení'],
        interpretation: 'Poslední čtvrť nabízí obraz přehodnocení. Můžeš se podívat, které závazky ještě mají smysl a kde potřebuješ jinou dohodu.',
        advice: 'U jedné povinnosti pojmenuj její účel a možnost bezpečně upravit rozsah.'
    },
    {
        name: 'Ubývající srpek',
        emoji: '🌘',
        minAge: 23.15,
        maxAge: 28.5,
        illumination: 15,
        tags: ['Obnova', 'Odpočinek', 'Ticho', 'Příprava'],
        interpretation: 'Ubývající srpek může být symbolickou připomínkou odpočinku a prostoru bez dalšího výkonu. Řiď se především tím, co skutečně potřebuješ.',
        advice: 'Nech si krátkou chvíli bez nového úkolu. Poznámku nebo plán můžeš dopsat později.'
    }
];

function formatDate(date) {
    return date.toLocaleDateString('cs-CZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Prague' });
}

function renderCycleGrid(currentPhase) {
    const grid = document.getElementById('lunarCycleGrid');
    grid.innerHTML = PHASES.map(p => `
        <div class="cycle-item ${p.name === currentPhase.name ? 'active' : ''}">
            <span class="cycle-emoji" data-moon-phase="${p.emoji}">${p.emoji}</span>
            <div class="cycle-name">${p.name}</div>
        </div>
    `).join('');
    grid.querySelectorAll('[data-moon-phase]').forEach((element, index) => {
        window.MH_MOON_ART?.render(element, element.dataset.moonPhase, PHASES[index].name);
    });
}

function renderPhase() {
    const now = new Date();
    const state = getLunarState(now);
    const age = state.age;
    const phase = { ...PHASES[state.index], name: state.name, emoji: state.icon };
    const illumination = state.illumination;

    document.getElementById('moonEmoji').textContent = phase.emoji;
    window.MH_MOON_ART?.render(document.getElementById('moonEmoji'), phase.emoji, phase.name);
    document.getElementById('phaseName').textContent = phase.name;
    document.getElementById('phaseDate').textContent = formatDate(now) + ` · Orientační stáří Měsíce: ${age.toFixed(1)} dní`;
    const illuminationStep = Math.round(illumination / 5) * 5;
    document.getElementById('illuminationFill').dataset.illumination = String(illuminationStep);
    document.getElementById('illuminationLabel').textContent = `Orientační osvětlení: ${illumination} %`;

    document.getElementById('phaseIntroTitle').textContent = phase.name;
    document.getElementById('phaseTags').innerHTML = phase.tags.map(t => `<span class="tag">${t}</span>`).join('');
    document.getElementById('phaseInterpretation').textContent = phase.interpretation;
    document.getElementById('phaseAdvice').textContent = phase.advice;

    document.title = `${phase.name} – Dnešní lunární fáze | Mystická Hvězda`;

    renderCycleGrid(phase);
}

renderPhase();
