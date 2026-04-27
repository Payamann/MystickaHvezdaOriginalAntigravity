import {
    calculateLifePath,
    calculateDestiny,
    calculateSoul,
    calculatePersonality,
    NUMBER_MEANINGS
} from './utils/numerology-logic.js';

function buildNumerologyUpgradeUrl(source = 'numerology_inline_gate') {
    const pricingUrl = new URL('/cenik.html', window.location.origin);
    pricingUrl.searchParams.set('plan', 'pruvodce');
    pricingUrl.searchParams.set('source', source);
    pricingUrl.searchParams.set('feature', 'numerologie_vyklad');
    return `${pricingUrl.pathname}${pricingUrl.search}`;
}

function startNumerologyUpgradeFlow(source = 'numerology_inline_gate', authMode = 'register') {
    window.MH_ANALYTICS?.trackCTA?.(source, {
        plan_id: 'pruvodce',
        feature: 'numerologie_vyklad'
    });

    if (window.Auth?.startPlanCheckout) {
        window.Auth.startPlanCheckout('pruvodce', {
            source,
            feature: 'numerologie_vyklad',
            redirect: '/cenik.html',
            authMode
        });
        return;
    }

    window.location.href = buildNumerologyUpgradeUrl(source);
}

// === FORM HANDLING ===
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('numerology-form');
    const useProfileCheckbox = document.getElementById('use-profile-num');

    // Auto-load Daily Vibrations if logged in
    if (window.Auth && window.Auth.isLoggedIn()) {
        try {
            const profile = await window.Auth.getProfile();
            if (profile && profile.birth_date) {
                // Pre-calculate daily vibes without form submission
                let bDate = profile.birth_date;
                if (bDate.includes('T')) bDate = bDate.split('T')[0];

                // Import logic and display
                import('./utils/numerology-logic.js').then(module => {
                    if (module.calculatePersonalCycles) {
                        const cycles = module.calculatePersonalCycles(bDate);
                        displayPersonalCycles(cycles);
                    }
                });
            }
        } catch (e) {
            console.warn('Auto-load daily vibes failed:', e);
        }
    }

    // Toggle visibility based on auth
    if (useProfileCheckbox) {
        const wrapper = useProfileCheckbox.closest('.checkbox-wrapper');
        if (wrapper) {
            const updateVisibility = () => {
                const isVisible = window.Auth && window.Auth.isLoggedIn();
                wrapper.hidden = !isVisible;
                wrapper.classList.toggle('mh-flex-visible', isVisible);
            };
            updateVisibility();
            document.addEventListener('auth:changed', updateVisibility);
        }
    }

    // Auto-fill from profile
    if (useProfileCheckbox) {
        useProfileCheckbox.addEventListener('change', async (e) => {
            if (e.target.checked) {
                if (!window.Auth || !window.Auth.isLoggedIn()) {
                    window.Auth?.showToast?.('Přihlášení vyžadováno', 'Pro tuto funkci se musíte přihlásit.', 'info');
                    e.target.checked = false;
                    return;
                }

                const profile = await window.Auth.getProfile();
                if (profile) {
                    document.getElementById('num-name').value = profile.first_name || '';

                    if (profile.birth_date) {
                        let bDate = profile.birth_date;
                        if (bDate.includes('T')) bDate = bDate.split('T')[0];
                        document.getElementById('num-date').value = bDate;
                    }

                    if (profile.birth_time) {
                        let bTime = profile.birth_time;
                        if (bTime.length > 5) bTime = bTime.substring(0, 5);
                        document.getElementById('num-time').value = bTime;
                    }
                }
            }
        });
    }

    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
});

async function handleFormSubmit(e) {
    e.preventDefault();

    // Restriction: Must be logged in
    if (!window.Auth || !window.Auth.isLoggedIn()) {
        window.Auth?.showToast?.('Přihlášení vyžadováno', 'Pro výpočet numerologie se prosím přihlaste.', 'info');
        startNumerologyUpgradeFlow('numerology_auth_gate', 'register');
        return;
    }

    const name = document.getElementById('num-name').value.trim();
    const birthDate = document.getElementById('num-date').value;
    const birthTime = document.getElementById('num-time').value;

    if (!name || !birthDate) {
        window.Auth?.showToast?.('Chybějící údaje', 'Vyplňte prosím jméno a datum narození.', 'error');
        return;
    }

    // Calculate numbers
    const lifePath = calculateLifePath(birthDate);
    const destiny = calculateDestiny(name);
    const soul = calculateSoul(name);
    const personality = calculatePersonality(name);

    // Calculate Personal Cycles (New Feature)
    // We import this dynamically or assume it's available via the updated logic file
    import('./utils/numerology-logic.js')
        .then(module => {
            if (module.calculatePersonalCycles) {
                const cycles = module.calculatePersonalCycles(birthDate);
                displayPersonalCycles(cycles);
            }
        })
        .catch(err => console.error('Nepodařilo se načíst numerology-logic:', err));

    // Display results
    displayResults(lifePath, destiny, soul, personality);

    // Show AI interpretation (with premium gate)
    await displayInterpretation(name, birthDate, birthTime, lifePath, destiny, soul, personality);
}

function displayPersonalCycles(cycles) {
    if (!cycles) return;

    const section = document.getElementById('daily-cycles');
    if (!section) return;

    const { personalYear, personalMonth, personalDay } = cycles;

    // Update Values
    document.getElementById('val-pd').textContent = personalDay;
    document.getElementById('val-pm').textContent = personalMonth;
    document.getElementById('val-py').textContent = personalYear;

    // Update Date Display
    const dateDisplay = document.getElementById('current-date-display');
    if (dateDisplay) {
        dateDisplay.textContent = new Date().toLocaleDateString('cs-CZ');
    }

    // Show Section
    section.hidden = false;
    section.classList.add('mh-block-visible');
}

function displayResults(lifePath, destiny, soul, personality) {
    const resultsSection = document.getElementById('numerology-results');
    if (!resultsSection) return;

    resultsSection.hidden = false;
    resultsSection.classList.add('mh-block-visible');

    // Scroll to results (or daily cycles if visible)
    const dailySection = document.getElementById('daily-cycles');
    if (dailySection && !dailySection.hidden) {
        dailySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Populate cards
    const cardData = [
        { id: 'card-lifepath', number: lifePath, label: 'Životní cesta', colorClass: 'number-card--gold' },
        { id: 'card-destiny', number: destiny, label: 'Osud', colorClass: 'number-card--blue' },
        { id: 'card-soul', number: soul, label: 'Duše', colorClass: 'number-card--green' },
        { id: 'card-personality', number: personality, label: 'Osobnost', colorClass: 'number-card--starlight' }
    ];

    cardData.forEach(({ id, number, label, colorClass }) => {
        const card = document.getElementById(id);
        if (card) {
            const meaning = NUMBER_MEANINGS[number];
            const isMaster = number === 11 || number === 22 || number === 33;
            card.innerHTML = `
                <div class="number-card ${colorClass} ${isMaster ? 'master' : ''}">
                    <div class="number-value">${number}</div>
                    <div class="number-label">${label}</div>
                    <div class="number-title">${meaning?.title || ''}</div>
                    <div class="number-meaning">${meaning?.short || ''}</div>
                </div>
            `;
        }
    });
}

async function displayInterpretation(name, birthDate, birthTime, lifePath, destiny, soul, personality) {
    const interpretationContainer = document.getElementById('num-interpretation');
    if (!interpretationContainer) return;

    // ==============================================
    // PREMIUM GATE: AI Interpretation
    // ==============================================
    const isPremium = window.Auth && window.Auth.isLoggedIn() && window.Auth.isPremium();

    if (!isPremium) {
        // FREE: Show numbers only + paywall for AI interpretation
        interpretationContainer.innerHTML = `
            <div class="interpretation-section">
                <h3>✨ Vaše Čísla</h3>
                <div class="numerology-summary-grid">
                    <div class="number-card number-card--summary number-card--summary-life">
                      <div class="number-card__summary-label">Životní Cesta</div>
                        <div class="number-card__summary-value number-card__summary-value--gold">${lifePath}</div>
                    </div>
                    <div class="number-card number-card--summary number-card--summary-destiny">
                        <div class="number-card__summary-label">Osud</div>
                        <div class="number-card__summary-value number-card__summary-value--blue">${destiny}</div>
                    </div>
                    <div class="number-card number-card--summary number-card--summary-soul">
                        <div class="number-card__summary-label">Duše</div>
                        <div class="number-card__summary-value number-card__summary-value--green">${soul}</div>
                    </div>
                    <div class="number-card number-card--summary number-card--summary-personality">
                        <div class="number-card__summary-label">Osobnost</div>
                        <div class="number-card__summary-value number-card__summary-value--starlight">${personality}</div>
                    </div>
                </div>

                <div class="premium-locked numerology-premium-preview">
                    <h4>Hluboký Rozbor</h4>
                    <p>Objevte tajemství vašich čísel s pomocí starodávné moudrosti. Každé číslo nese v sobě mocné poselství...</p>
                    <p class="numerology-premium-preview__muted">Vaše životní cesta ${lifePath} symbolizuje...</p>
                </div>
                
                <div class="premium-lock-overlay">
                    <div class="lock-icon">🔒</div>
                    <p class="lock-text">Detailní rozbor je Premium funkce</p>
                    <button class="btn btn--gold unlock-btn numerology-upgrade-btn">🌟 Vyzkoušet 7 dní zdarma</button>
                </div>
            </div>
        `;

        // Track paywall hit (if premium-gates.js is loaded)
        if (window.Premium?.trackPaywallHit) window.Premium.trackPaywallHit('numerologie_vyklad');

        // Wire up the upgrade button to trial paywall
        const upgradeBtn = interpretationContainer.querySelector('.numerology-upgrade-btn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                if (window.Premium?.showTrialPaywall) {
                    window.Premium.showTrialPaywall('numerologie_vyklad');
                } else {
                    startNumerologyUpgradeFlow('numerology_inline_gate', 'register');
                }
            });
        }
        return;
    }

    // PREMIUM: Show full AI interpretation
    interpretationContainer.innerHTML = `
        <div class="interpretation-loading">
            <div class="spinner"></div>
            <p class="interpretation-loading__text">Generuji hloubkovou interpretaci...</p>
        </div>
    `;

    try {
        // Call AI API for interpretation
        const apiUrl = window.API_CONFIG?.BASE_URL || '/api';
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        const response = await fetch(`${apiUrl}/numerology`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            },
            body: JSON.stringify({
                name,
                birthDate,
                birthTime,
                lifePath,
                destiny,
                soul,
                personality
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Display AI interpretation
        interpretationContainer.innerHTML = `
            <div class="interpretation-section">
                ${(data.cached || data.fromCache) ? '<span class="badge badge--cache">📦 Z cache (deterministic result)</span>' : ''}
                <div class="interpretation-content">
                    ${data.response.replace(/```html/g, '').replace(/```/g, '')}
                </div>
            </div>
        `;

        // Save reading to history (with birth time)
        if (window.Auth && window.Auth.saveReading) {
            const saveResult = await window.Auth.saveReading('numerology', {
                name,
                birthDate,
                birthTime,
                lifePath,
                destiny,
                soul,
                personality,
                response: data.response
            });
            if (window.MH_DEBUG) console.debug('Reading saved:', saveResult);
        }
    } catch (error) {
        console.error('AI interpretation error:', error);
        interpretationContainer.innerHTML = `
            <div class="error-message error-message--inline">
                <p class="error-message__text">❌ Nepodařilo se načíst interpretaci. Zkuste to prosím znovu.</p>
            </div>
        `;
    }
}

// Global listener for auth refresh
// When session is updated (e.g. from User -> VIP), reload to reflect changes
document.addEventListener('auth:refreshed', () => {
    if (window.MH_DEBUG) console.debug('Auth refreshed, reloading to unlock content...');
    // Add a small delay to ensure local storage is flushed
    setTimeout(() => window.location.reload(), 500);
}, { once: true });
