const COPY = {
    sk: {
        loading: 'Počítam polohy planét…',
        invalidDate: 'Zadajte platný dátum narodenia.',
        missingPlace: 'Zadajte miesto narodenia.',
        error: 'Výpočet sa nepodarilo načítať. Vaše údaje zostali vo formulári; skúste to znova.',
        title: 'Vypočítané polohy planét',
        planet: 'Planéta', sign: 'Znamenie a stupeň',
        asc: 'Ascendent', unavailable: 'Ascendent nie je k dispozícii; bez presného času sa nevypočítava.',
        noAsc: 'Ascendent sa nepodarilo vypočítať pre zadané miesto a čas.',
        symbols: 'Ide o orientačný astrologický výpočet. Bez známeho času sa používa poludnie v časovom pásme rozpoznaného miesta, inak UTC. Ascendent a domy vyžadujú presný čas a rozpoznané miesto.',
        usedTime: 'Čas použitý na výpočet'
    },
    pl: {
        loading: 'Obliczam położenia planet…',
        invalidDate: 'Wpisz prawidłową datę urodzenia.',
        missingPlace: 'Wpisz miejsce urodzenia.',
        error: 'Nie udało się pobrać obliczenia. Dane pozostały w formularzu; spróbuj ponownie.',
        title: 'Obliczone położenia planet',
        planet: 'Planeta', sign: 'Znak i stopień',
        asc: 'Ascendent', unavailable: 'Ascendent jest niedostępny; bez dokładnej godziny nie jest obliczany.',
        noAsc: 'Nie udało się obliczyć ascendentu dla podanego miejsca i czasu.',
        symbols: 'To orientacyjne obliczenie astrologiczne. Bez znanej godziny stosowane jest południe w strefie rozpoznanego miejsca, a w pozostałych przypadkach UTC. Ascendent i domy wymagają dokładnej godziny i rozpoznanego miejsca.',
        usedTime: 'Czas użyty do obliczenia'
    }
};

const SIGN_NAMES = {
    'beran': { sk: 'Baran', pl: 'Baran' }, 'byk': { sk: 'Býk', pl: 'Byk' },
    'blizenci': { sk: 'Blíženci', pl: 'Bliźnięta' }, 'rak': { sk: 'Rak', pl: 'Rak' },
    'lev': { sk: 'Lev', pl: 'Lew' }, 'panna': { sk: 'Panna', pl: 'Panna' },
    'vahy': { sk: 'Váhy', pl: 'Waga' }, 'stir': { sk: 'Škorpión', pl: 'Skorpion' },
    'strelec': { sk: 'Strelec', pl: 'Strzelec' }, 'kozoroh': { sk: 'Kozorožec', pl: 'Koziorożec' },
    'vodnar': { sk: 'Vodnár', pl: 'Wodnik' }, 'ryby': { sk: 'Ryby', pl: 'Ryby' }
};
const PLANET_NAMES = {
    sun: { sk: 'Slnko', pl: 'Słońce' }, moon: { sk: 'Mesiac', pl: 'Księżyc' },
    mercury: { sk: 'Merkúr', pl: 'Merkury' }, venus: { sk: 'Venuša', pl: 'Wenus' },
    mars: { sk: 'Mars', pl: 'Mars' }, jupiter: { sk: 'Jupiter', pl: 'Jowisz' },
    saturn: { sk: 'Saturn', pl: 'Saturn' }, uranus: { sk: 'Urán', pl: 'Uran' },
    neptune: { sk: 'Neptún', pl: 'Neptun' }, pluto: { sk: 'Pluto', pl: 'Pluton' }
};
const ORDER = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

function initLocaleNatal() {
    const locale = document.documentElement.lang === 'pl' ? 'pl' : 'sk';
    const copy = COPY[locale];
    const form = document.getElementById('natal-form');
    const status = document.getElementById('locale-natal-status');
    const output = document.getElementById('locale-natal-output');
    const result = document.getElementById('natal-result');
    if (!form || !status || !output || !result) return;

    let activeController = null;
    let requestId = 0;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const birthDate = form.elements.birthDate.value;
        const birthTime = form.elements.birthTime.value;
        const birthPlace = form.elements.birthPlace.value.trim();
        const date = new Date(`${birthDate}T00:00:00Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== birthDate) {
            status.textContent = copy.invalidDate;
            form.elements.birthDate.focus();
            return;
        }
        if (!birthPlace) {
            status.textContent = copy.missingPlace;
            form.elements.birthPlace.focus();
            return;
        }

        activeController?.abort();
        activeController = new AbortController();
        const thisRequest = ++requestId;
        const button = form.querySelector('[type="submit"]');
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        status.textContent = copy.loading;
        output.replaceChildren();
        try {
            const params = new URLSearchParams({ birthDate, birthTime, birthPlace });
            const apiBase = window.API_CONFIG?.BASE_URL || '/api';
            const response = await fetch(`${apiBase}/natal-chart/calculate?${params}`, {
                credentials: 'include', signal: activeController.signal
            });
            const data = await response.json();
            if (!response.ok || !data.success || !ORDER.every(id => Number.isFinite(data.chart?.planets?.[id]?.longitude) && data.chart.planets[id].sign?.name)) throw new Error('calculation unavailable');
            if (thisRequest !== requestId) return;
            renderChart(data.chart, locale, copy, output);
            status.textContent = '';
            result.focus({ preventScroll: true });
        } catch (error) {
            if (error.name !== 'AbortError' && thisRequest === requestId) {
                output.replaceChildren();
                status.textContent = copy.error;
            }
        } finally {
            if (thisRequest === requestId) {
                button.disabled = false;
                button.removeAttribute('aria-busy');
            }
        }
    });
}

function translatedSign(name, locale) {
    const key = String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return SIGN_NAMES[key]?.[locale] || name || '';
}

function renderChart(chart, locale, copy, output) {
    const heading = document.createElement('h3');
    heading.textContent = copy.title;
    const table = document.createElement('table');
    const thead = table.createTHead();
    const headRow = thead.insertRow();
    for (const label of [copy.planet, copy.sign]) {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = label;
        headRow.appendChild(th);
    }
    const body = table.createTBody();
    for (const id of ORDER) {
        const planet = chart.planets[id];
        if (!planet?.sign?.name) continue;
        const row = body.insertRow();
        row.insertCell().textContent = PLANET_NAMES[id]?.[locale] || planet.name || id;
        row.insertCell().textContent = `${translatedSign(planet.sign.name, locale)} ${planet.degreeText || ''}`.trim();
    }
    const note = document.createElement('p');
    note.textContent = copy.symbols;
    const fragment = document.createDocumentFragment();
    fragment.append(heading, table);
    const ascendant = chart.houses?.available && chart.houses?.ascendant?.sign?.name;
    const ascText = document.createElement('p');
    if (ascendant) {
        const label = document.createElement('strong');
        label.textContent = `${copy.asc}: `;
        ascText.append(label, `${translatedSign(chart.houses.ascendant.sign.name, locale)} ${chart.houses.ascendant.degreeText || ''}`.trim());
    } else {
        ascText.textContent = chart.input?.birthTime ? copy.noAsc : copy.unavailable;
    }
    fragment.append(ascText, note);
    if (chart.calculatedForUtc) {
        const time = new Date(chart.calculatedForUtc);
        const timeZone = chart.location?.timeZone || 'UTC';
        if (Number.isFinite(time.getTime())) {
            const usedTime = document.createElement('p');
            usedTime.textContent = `${copy.usedTime}: ${time.toLocaleString(locale === 'pl' ? 'pl-PL' : 'sk-SK', { timeZone, dateStyle: 'long', timeStyle: 'short' })} (${timeZone}).`;
            fragment.append(usedTime);
        }
    }
    output.replaceChildren(fragment);
}

document.addEventListener('DOMContentLoaded', initLocaleNatal);

