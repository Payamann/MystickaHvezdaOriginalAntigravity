/**
 * Mystická Hvězda - Public Biorhythms Calculator
 * Separated from profile for easy SEO access.
 */

// Biorhythm periods
const CYCLES = {
    physical: 23,
    emotional: 28,
    intellectual: 33
};

// Calculate biorhythm values for a specific date
function getBiorhythmValue(birthDate, targetDate, cycleLength) {
    const diffTime = Math.abs(targetDate - birthDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.sin((2 * Math.PI * diffDays) / cycleLength) * 100;
}

function calculateBiorhythmsForDate(birthDate, targetDate) {
    return {
        physical: getBiorhythmValue(birthDate, targetDate, CYCLES.physical),
        emotional: getBiorhythmValue(birthDate, targetDate, CYCLES.emotional),
        intellectual: getBiorhythmValue(birthDate, targetDate, CYCLES.intellectual)
    };
}

let bioChart = null;

function renderBiorhythmChart(birthDate) {
    const ctx = document.getElementById('bio-canvas');
    if (!ctx) return;

    if (!window.Chart) {
        console.error('Chart.js is not loaded.');
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const labels = [];
    const dataPhysical = [];
    const dataEmotional = [];
    const dataIntellectual = [];

    // Generate data for -7 to +14 days relative to today
    for (let i = -7; i <= 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        // Format label nicely (e.g., "15.3.")
        labels.push(`${d.getDate()}.${d.getMonth() + 1}.`);

        const vals = calculateBiorhythmsForDate(birthDate, d);
        dataPhysical.push(vals.physical);
        dataEmotional.push(vals.emotional);
        dataIntellectual.push(vals.intellectual);
    }

    // Modern configuration for mysterious look
    const config = {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Fyzický (23 dnů)',
                    data: dataPhysical,
                    borderColor: '#ff4b4b', // Danger color
                    backgroundColor: 'rgba(255, 75, 75, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 6
                },
                {
                    label: 'Emoční (28 dnů)',
                    data: dataEmotional,
                    borderColor: '#4caf50', // Success color
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 6
                },
                {
                    label: 'Intelektuální (33 dnů)',
                    data: dataIntellectual,
                    borderColor: '#00bcd4', // Info color
                    backgroundColor: 'rgba(0, 188, 212, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: false // We use custom HTML legend in CSS
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 10, 26, 0.9)',
                    titleColor: '#D4AF37',
                    bodyColor: '#e0e0e0',
                    borderColor: 'rgba(212, 175, 55, 0.2)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${Math.round(context.raw)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#a0a0b0',
                        maxTicksLimit: 10
                    }
                },
                y: {
                    min: -100,
                    max: 100,
                    grid: {
                        color: (context) => context.tick.value === 0 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#a0a0b0',
                        stepSize: 50,
                        callback: function (value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    };

    if (bioChart) {
        bioChart.destroy();
    }
    bioChart = new Chart(ctx, config);

    // Update today's stats UI
    updateTodayStats(birthDate);
}

function getInterpretation(type, value) {
    if (type === 'physical') {
        if (value >= 80) return "Jste na vrcholu sil! Ideální čas pro sport a fyzickou námahu.";
        if (value >= 25) return "Máte dostatek energie pro běžné i náročnější dny.";
        if (value > -25) return "Neutrální fáze. Nenasazujte zbytečně rychlé tempo.";
        if (value > -80) return "Cítíte únavu. Dopřejte tělu čas na regeneraci a odpočinek.";
        return "Kritické dny. Dbejte na zdraví, hrozí absolutní vyčerpání.";
    }
    if (type === 'emotional') {
        if (value >= 80) return "Skvělá nálada a emoční stabilita. Cítíte se skvěle ve společnosti.";
        if (value >= 25) return "Jste v pohodě a pozitivně naladěni. Dobrý čas pro vztahy.";
        if (value > -25) return "Občasné výkyvy nálad. Snažte se udržet si vnitřní klid.";
        if (value > -80) return "Cítíte se zranitelnější. Můžete být náladoví, vyhněte se konfliktům.";
        return "Náročné období pro psychiku. Buďte k sobě i ostatním co nejvíce laskaví.";
    }
    if (type === 'intellectual') {
        if (value >= 80) return "Vaše mysl pracuje na plné obrátky! Skvělý čas na učení a těžká rozhodnutí.";
        if (value >= 25) return "Jasná mysl a dobré soustředění na každodenní problémy.";
        if (value > -25) return "Rutinní úkoly zvládnete, ale pro dnešek se raději vyhněte složitým konceptům.";
        if (value > -80) return "Horší koncentrace. Dělejte věci pomaleji, pečlivěji a pište si poznámky.";
        return "Útlum pozornosti. Nedělejte závažná rozhodnutí, mysl nyní potřebuje odpočinek.";
    }
    return "";
}

function updateTodayStats(birthDate) {
    const vals = calculateBiorhythmsForDate(birthDate, new Date());
    const statsContainer = document.getElementById('bio-stats-container');

    if (!statsContainer) return;

    statsContainer.innerHTML = `
        <div class="bio-stat-card">
            <div class="bio-stat-label">Fyzický</div>
            <div class="bio-stat-value" style="color: #ff4b4b; margin-bottom: 8px;">${Math.round(vals.physical)}%</div>
            <p style="font-size: 0.85rem; color: var(--color-silver-mist); margin: 0; line-height: 1.4;">${getInterpretation('physical', vals.physical)}</p>
        </div>
        <div class="bio-stat-card">
            <div class="bio-stat-label">Emoční</div>
            <div class="bio-stat-value" style="color: #4caf50; margin-bottom: 8px;">${Math.round(vals.emotional)}%</div>
            <p style="font-size: 0.85rem; color: var(--color-silver-mist); margin: 0; line-height: 1.4;">${getInterpretation('emotional', vals.emotional)}</p>
        </div>
        <div class="bio-stat-card">
            <div class="bio-stat-label">Intelektuální</div>
            <div class="bio-stat-value" style="color: #00bcd4; margin-bottom: 8px;">${Math.round(vals.intellectual)}%</div>
            <p style="font-size: 0.85rem; color: var(--color-silver-mist); margin: 0; line-height: 1.4;">${getInterpretation('intellectual', vals.intellectual)}</p>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const birthdateInput = document.getElementById('birthdate');
    if (birthdateInput) {
        birthdateInput.max = today;
    }

    const form = document.getElementById('biorhythm-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const dateVal = birthdateInput.value;
            if (dateVal) {
                const resultsSection = document.getElementById('biorhythm-results');
                resultsSection.style.display = 'block';

                // Smooth scroll to results
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'end' });

                renderBiorhythmChart(new Date(dateVal));
            }
        });
    }

    // Allow testing logic
    window.renderBiorhythmChart = renderBiorhythmChart;
});
