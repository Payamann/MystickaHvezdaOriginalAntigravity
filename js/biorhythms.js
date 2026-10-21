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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getTodayIsoDatePrague(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Prague',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);
    const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function getTodayPragueDate(date = new Date()) {
    return parseLocalDate(getTodayIsoDatePrague(date));
}

function localCalendarDayNumber(date) {
    const day = new Date(0);
    day.setUTCHours(0, 0, 0, 0);
    day.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    return day.getTime() / MS_PER_DAY;
}

function parseLocalDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const dayOfMonth = Number(match[3]);
    const date = new Date(0);
    date.setHours(0, 0, 0, 0);
    date.setFullYear(year, month - 1, dayOfMonth);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== dayOfMonth) {
        return null;
    }

    return date;
}

// Calculate biorhythm values for a specific date
function getBiorhythmValue(birthDate, targetDate, cycleLength) {
    const diffDays = localCalendarDayNumber(targetDate) - localCalendarDayNumber(birthDate);
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
let chartJsLoadPromise = null;
let biorhythmRenderVersion = 0;

function loadChartJs() {
    if (window.Chart) return Promise.resolve();
    if (chartJsLoadPromise) return chartJsLoadPromise;

    chartJsLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = new URL('/js/vendor/chart.js', document.baseURI).href;
        script.async = true;
        script.onload = () => {
            if (window.Chart) {
                resolve();
                return;
            }
            script.remove();
            reject(new Error('Chart.js loaded without exposing Chart.'));
        };
        script.onerror = () => {
            script.remove();
            reject(new Error('Chart.js failed to load.'));
        };
        document.head.appendChild(script);
    }).catch((error) => {
        chartJsLoadPromise = null;
        throw error;
    });

    return chartJsLoadPromise;
}

function drawBiorhythmChart(birthDate, today = getTodayPragueDate()) {
    const ctx = document.getElementById('bio-canvas');
    if (!ctx) return;

    if (!window.Chart) {
        console.error('Chart.js is not loaded.');
        return;
    }

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
                            return `${context.dataset.label}: ${Math.round(context.raw)} bodů modelové křivky`;
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
                            return value;
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

    return true;
}

async function renderBiorhythmChart(birthDate) {
    const renderVersion = ++biorhythmRenderVersion;
    const today = getTodayPragueDate();
    updateTodayStats(birthDate, today);
    const resultStatus = document.getElementById('bio-result-status');
    if (resultStatus) resultStatus.textContent = 'Číselný přehled biorytmů pro dnešní den je připraven.';
    const status = document.getElementById('bio-chart-status');
    if (status) status.textContent = 'Načítám graf…';

    try {
        await loadChartJs();
        if (renderVersion !== biorhythmRenderVersion) return false;
        drawBiorhythmChart(birthDate, today);
        if (renderVersion === biorhythmRenderVersion && status) status.textContent = '';
        return true;
    } catch (error) {
        if (renderVersion !== biorhythmRenderVersion) return false;
        console.warn('Biorhythm chart could not be loaded.', error);
        if (status) {
            status.textContent = 'Graf se nepodařilo načíst. Číselný přehled zůstává k dispozici; zkus formulář odeslat znovu.';
        }
        return false;
    }
}

function getInterpretation(type, value) {
    const region = value >= 80 ? 'blízko horního bodu' : value >= 25 ? 'v kladné části'
        : value > -25 ? 'blízko nulové osy' : value > -80 ? 'v záporné části' : 'blízko dolního bodu';
    const labels = { physical: 'Fyzická', emotional: 'Emoční', intellectual: 'Intelektuální' };
    return `${labels[type] || 'Modelová'} křivka je ${region}. Jde o matematický model z data narození, ne měření dnešní kondice, nálady nebo soustředění.`;
}

function updateTodayStats(birthDate, today) {
    const vals = calculateBiorhythmsForDate(birthDate, today);
    const statsContainer = document.getElementById('bio-stats-container');

    if (!statsContainer) return;

    const physicalValue = Math.round(vals.physical);
    const emotionalValue = Math.round(vals.emotional);
    const intellectualValue = Math.round(vals.intellectual);
    statsContainer.innerHTML = `
        <div class="bio-stat-card">
            <div class="bio-stat-label">Fyzický</div>
            <div class="bio-stat-value bio-stat-value--physical">${physicalValue}<span class="sr-only"> bodů modelové křivky</span></div>
            <p class="bio-stat-description">${getInterpretation('physical', vals.physical)}</p>
        </div>
        <div class="bio-stat-card">
            <div class="bio-stat-label">Emoční</div>
            <div class="bio-stat-value bio-stat-value--emotional">${emotionalValue}<span class="sr-only"> bodů modelové křivky</span></div>
            <p class="bio-stat-description">${getInterpretation('emotional', vals.emotional)}</p>
        </div>
        <div class="bio-stat-card">
            <div class="bio-stat-label">Intelektuální</div>
            <div class="bio-stat-value bio-stat-value--intellectual">${intellectualValue}<span class="sr-only"> bodů modelové křivky</span></div>
            <p class="bio-stat-description">${getInterpretation('intellectual', vals.intellectual)}</p>
        </div>
    `;
}

function clearBiorhythmResult() {
    biorhythmRenderVersion += 1;
    if (bioChart) {
        bioChart.destroy();
        bioChart = null;
    }

    const resultsSection = document.getElementById('biorhythm-results');
    if (resultsSection) {
        resultsSection.hidden = true;
        resultsSection.classList.remove('mh-block-visible');
    }

    document.getElementById('bio-stats-container')?.replaceChildren();
    const resultStatus = document.getElementById('bio-result-status');
    if (resultStatus) resultStatus.textContent = '';
    const status = document.getElementById('bio-chart-status');
    if (status) status.textContent = '';
}

document.addEventListener('DOMContentLoaded', () => {
    const birthdateInput = document.getElementById('birthdate');
    const form = document.getElementById('biorhythm-form');
    if (birthdateInput) {
        const syncBirthDateMaximum = () => {
            birthdateInput.max = getTodayIsoDatePrague();
        };
        const handleBirthDateChange = () => {
            syncBirthDateMaximum();
            clearBiorhythmResult();
        };
        syncBirthDateMaximum();
        birthdateInput.addEventListener('focus', syncBirthDateMaximum);
        birthdateInput.addEventListener('input', clearBiorhythmResult);
        birthdateInput.addEventListener('change', handleBirthDateChange);
        form?.addEventListener('pointerdown', syncBirthDateMaximum);
        form?.addEventListener('keydown', syncBirthDateMaximum);
        window.addEventListener('focus', syncBirthDateMaximum);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') syncBirthDateMaximum();
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (birthdateInput) birthdateInput.max = getTodayIsoDatePrague();
            const dateVal = birthdateInput.value;
            const birthDate = parseLocalDate(dateVal);
            if (birthDate) {
                const resultsSection = document.getElementById('biorhythm-results');
                resultsSection.hidden = false;
                resultsSection.classList.add('mh-block-visible');

                // Smooth scroll to results
                resultsSection.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'end' });

                renderBiorhythmChart(birthDate);
            }
        });
    }

    // Allow testing logic
    window.renderBiorhythmChart = renderBiorhythmChart;
});
