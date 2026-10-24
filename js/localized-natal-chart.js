(() => {
    const copyByLanguage = {
        sk: {
            loading: 'Počítam natálnu kartu…',
            title: 'Tvoja natálna karta',
            sun: 'Slnko',
            moon: 'Mesiac',
            ascendant: 'Ascendent',
            unavailable: 'Nedá sa určiť',
            more: 'Zobraziť ďalšie planéty',
            note: 'Výsledok je orientačná, symbolická mapa. Na výpočet ascendentu a domov je potrebný čo najpresnejší čas a rozpoznané miesto narodenia.',
            error: 'Kartu sa teraz nepodarilo vypočítať. Skontroluj údaje a skús to znova.',
            signs: {
                aries: 'Baran', taurus: 'Býk', gemini: 'Blíženci', cancer: 'Rak',
                leo: 'Lev', virgo: 'Panna', libra: 'Váhy', scorpio: 'Škorpión',
                sagittarius: 'Strelec', capricorn: 'Kozorožec', aquarius: 'Vodnár', pisces: 'Ryby'
            },
            planets: {
                sun: 'Slnko', moon: 'Mesiac', mercury: 'Merkúr', venus: 'Venuša', mars: 'Mars',
                jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Urán', neptune: 'Neptún', pluto: 'Pluto'
            }
        },
        pl: {
            loading: 'Obliczam kosmogram…',
            title: 'Twój kosmogram',
            sun: 'Słońce',
            moon: 'Księżyc',
            ascendant: 'Ascendent',
            unavailable: 'Nie można określić',
            more: 'Pokaż pozostałe planety',
            note: 'Wynik to orientacyjna, symboliczna mapa. Do obliczenia ascendentu i domów potrzebna jest możliwie dokładna godzina oraz rozpoznane miejsce urodzenia.',
            error: 'Nie udało się teraz obliczyć kosmogramu. Sprawdź dane i spróbuj ponownie.',
            signs: {
                aries: 'Baran', taurus: 'Byk', gemini: 'Bliźnięta', cancer: 'Rak',
                leo: 'Lew', virgo: 'Panna', libra: 'Waga', scorpio: 'Skorpion',
                sagittarius: 'Strzelec', capricorn: 'Koziorożec', aquarius: 'Wodnik', pisces: 'Ryby'
            },
            planets: {
                sun: 'Słońce', moon: 'Księżyc', mercury: 'Merkury', venus: 'Wenus', mars: 'Mars',
                jupiter: 'Jowisz', saturn: 'Saturn', uranus: 'Uran', neptune: 'Neptun', pluto: 'Pluton'
            }
        }
    };

    const onReady = () => {
        const form = document.getElementById('natal-form');
        const result = document.getElementById('natal-result');
        const date = document.getElementById('birth-date');
        const time = document.getElementById('birth-time');
        const place = document.getElementById('birth-place');
        const button = document.getElementById('calculate-natal');
        if (!form || !result || !date || !time || !place || !button) return;

        const language = copyByLanguage[document.documentElement.lang] || copyByLanguage.sk;
        const initialButtonText = button.textContent;

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!form.reportValidity()) return;

            const params = new URLSearchParams({
                birthDate: date.value,
                birthTime: time.value,
                birthPlace: place.value.trim()
            });
            const apiBase = String(window.API_CONFIG?.BASE_URL || '/api').replace(/\/$/, '');
            button.disabled = true;
            button.textContent = language.loading;
            result.setAttribute('aria-busy', 'true');

            try {
                const response = await fetch(`${apiBase}/natal-chart/calculate?${params}`, {
                    credentials: 'include'
                });
                const payload = await response.json();
                const chart = payload?.chart;
                if (!response.ok || payload?.success !== true || !chart?.planets) {
                    throw new Error('Natal calculation unavailable');
                }

                renderResult(result, chart, language);
            } catch {
                result.replaceChildren();
                const message = document.createElement('p');
                message.className = 'natal-local-result__note';
                message.textContent = language.error;
                result.appendChild(message);
            } finally {
                button.disabled = false;
                button.textContent = initialButtonText;
                result.removeAttribute('aria-busy');
            }
        });
    };

    function renderResult(root, chart, language) {
        root.replaceChildren();
        const section = document.createElement('section');
        section.className = 'natal-local-result';
        const heading = document.createElement('h3');
        heading.textContent = language.title;
        section.appendChild(heading);

        const facts = document.createElement('dl');
        facts.className = 'natal-local-result__facts';
        const core = [
            ['sun', language.sun],
            ['moon', language.moon],
            ['ascendant', language.ascendant]
        ];
        core.forEach(([id, label]) => {
            const entry = document.createElement('div');
            entry.className = 'natal-local-result__fact';
            const term = document.createElement('dt');
            term.textContent = label;
            const value = document.createElement('dd');
            const planet = id === 'ascendant' ? chart.houses?.ascendant : chart.planets?.[id];
            value.textContent = planet ? formatPlacement(planet, language) : language.unavailable;
            entry.append(term, value);
            facts.appendChild(entry);
        });
        section.appendChild(facts);

        const details = document.createElement('details');
        details.className = 'natal-local-result__more';
        const summary = document.createElement('summary');
        summary.textContent = language.more;
        const list = document.createElement('ul');
        Object.entries(language.planets).forEach(([id, planetName]) => {
            if (id === 'sun' || id === 'moon') return;
            const planet = chart.planets?.[id];
            if (!planet) return;
            const item = document.createElement('li');
            item.textContent = `${planetName}: ${formatPlacement(planet, language)}`;
            list.appendChild(item);
        });
        details.append(summary, list);
        section.appendChild(details);

        const note = document.createElement('p');
        note.className = 'natal-local-result__note';
        note.textContent = language.note;
        section.appendChild(note);
        root.appendChild(section);
    }

    function formatPlacement(planet, language) {
        const signId = planet?.sign?.id;
        const sign = language.signs[signId] || '';
        const degree = planet?.degreeText || '';
        return [sign, degree].filter(Boolean).join(' ');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady, { once: true });
    } else {
        onReady();
    }
})();
