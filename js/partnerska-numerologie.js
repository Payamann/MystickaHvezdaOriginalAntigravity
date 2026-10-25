import {
    NUMBER_MEANINGS,
    calculateLifePath,
    getTodayIsoDate,
    isValidBirthDate
} from './utils/numerology-logic.js';

const REFLECTION_QUESTIONS = {
    1: 'Kde potřebuješ vlastní prostor a kde se vám vyplatí rozhodovat společně?',
    2: 'Kdy je naslouchání oporou a kdy je potřeba říct vlastní přání nahlas?',
    3: 'Jak si dáváte prostor pro nápady a zároveň si ověřujete, že si rozumíte?',
    4: 'Která dohoda vám přináší oporu a kterou už potřebujete upravit?',
    5: 'Kde vztahu prospívá změna a kde naopak potřebujete pevnější bod?',
    6: 'Jak rozdělujete péči tak, aby měl každý také prostor pro sebe?',
    7: 'Kdy potřebuješ čas na vlastní přemýšlení a jak to můžeš druhému sdělit?',
    8: 'Jak spolu rozhodujete o času, penězích nebo jiných společných zdrojích?',
    9: 'Co už můžete uzavřít a čemu chcete věnovat pozornost dál?',
    11: 'Jak převádíš citlivé postřehy do slov, kterým může druhý rozumět?',
    22: 'Který společný nápad potřebuje jeden malý a proveditelný krok?',
    33: 'Jak můžeš nabídnout podporu bez přebírání odpovědnosti za druhého?'
};

const form = document.getElementById('partner-numerology-form');
const dateInputs = [
    document.getElementById('partner-date-a'),
    document.getElementById('partner-date-b')
].filter(Boolean);
const errorBox = document.getElementById('partner-form-error');
const result = document.getElementById('partner-numerology-result');
const resultCards = document.getElementById('partner-result-cards');

function clearError() {
    if (!errorBox) return;
    errorBox.textContent = '';
    errorBox.hidden = true;
}

function clearResult() {
    if (!result || result.hidden) return;
    result.hidden = true;
    resultCards?.replaceChildren();
}

function markFieldValid(input) {
    input.removeAttribute('aria-invalid');
}

function showError(message, input) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.hidden = false;
    input?.setAttribute('aria-invalid', 'true');
    input?.focus();
}

function validateDates(today) {
    for (const input of dateInputs) {
        markFieldValid(input);
        if (!input.value) {
            showError('Vyplň obě data narození.', input);
            return false;
        }
        if (!isValidBirthDate(input.value, today)) {
            showError('Zadej skutečné datum narození, které není v budoucnosti.', input);
            return false;
        }
    }
    return true;
}

function buildResultCard(number, label) {
    const meaning = NUMBER_MEANINGS[number];
    const card = document.createElement('article');
    card.className = 'partner-result-card';

    const personLabel = document.createElement('span');
    personLabel.className = 'partner-result-card__label';
    personLabel.textContent = label;

    const value = document.createElement('strong');
    value.className = 'partner-result-card__number';
    value.textContent = String(number);

    const title = document.createElement('h4');
    title.textContent = meaning?.title || 'Životní číslo';

    const summary = document.createElement('p');
    summary.className = 'partner-result-card__summary';
    summary.textContent = meaning?.short || '';

    const question = document.createElement('p');
    question.className = 'partner-result-card__question';
    question.textContent = REFLECTION_QUESTIONS[number] || 'Kde toto téma poznáváš ve vašich každodenních dohodách?';

    const link = document.createElement('a');
    link.href = `/numerologie/zivotni-cislo-${number}.html`;
    link.textContent = `Prozkoumat význam čísla ${number}`;

    card.append(personLabel, value, title, summary, question, link);
    return card;
}

function renderResult(numbers) {
    if (!result || !resultCards) return;
    resultCards.replaceChildren(
        buildResultCard(numbers[0], 'První osoba'),
        buildResultCard(numbers[1], 'Druhá osoba')
    );
    result.hidden = false;
    result.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    result.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

if (form && dateInputs.length === 2) {
    const today = getTodayIsoDate();
    dateInputs.forEach(input => {
        input.max = today;
        input.addEventListener('input', () => {
            markFieldValid(input);
            clearError();
            clearResult();
        });
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        clearError();
        clearResult();

        if (!validateDates(today)) return;

        const numbers = dateInputs.map(input => calculateLifePath(input.value, today));
        if (numbers.some(number => !number)) {
            showError('Výpočet se nepodařil. Zkontroluj prosím obě data.', dateInputs[0]);
            return;
        }

        renderResult(numbers);
    });
}
