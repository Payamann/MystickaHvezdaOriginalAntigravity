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
    const region = value >= 80 ? 'blízko horního bodu' : value >= 25 ? 'v kladné části'
        : value > -25 ? 'blízko nulové osy' : value > -80 ? 'v záporné části' : 'blízko dolního bodu';
    const labels = { physical: 'Fyzická', emotional: 'Emoční', intellectual: 'Intelektuální' };
    return `${labels[type] || 'Modelová'} křivka je ${region}. Jde o matematický model z data narození, ne měření dnešní kondice, nálady nebo soustředění.`;
}

function updateTodayStats(birthDate) {
    const vals = calculateBiorhythmsForDate(birthDate, new Date());
    const statsContainer = document.getElementById('bio-stats-container');

    if (!statsContainer) return;

    statsContainer.innerHTML = `
        <div class="bio-stat-card">
            <div class="bio-stat-label">Fyzický</div>
            <div class="bio-stat-value bio-stat-value--physical">${Math.round(vals.physical)}%</div>
            <p class="bio-stat-description">${getInterpretation('physical', vals.physical)}</p>
        </div>
        <div class="bio-stat-card">
            <div class="bio-stat-label">Emoční</div>
            <div class="bio-stat-value bio-stat-value--emotional">${Math.round(vals.emotional)}%</div>
            <p class="bio-stat-description">${getInterpretation('emotional', vals.emotional)}</p>
        </div>
        <div class="bio-stat-card">
            <div class="bio-stat-label">Intelektuální</div>
            <div class="bio-stat-value bio-stat-value--intellectual">${Math.round(vals.intellectual)}%</div>
            <p class="bio-stat-description">${getInterpretation('intellectual', vals.intellectual)}</p>
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
                resultsSection.hidden = false;
                resultsSection.classList.add('mh-block-visible');

                // Smooth scroll to results
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'end' });

                renderBiorhythmChart(new Date(dateVal));
            }
        });
    }

    // Allow testing logic
    window.renderBiorhythmChart = renderBiorhythmChart;
});
