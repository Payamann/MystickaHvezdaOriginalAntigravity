import {
    calculateLifePath,
    calculateDestiny,
    calculateSoul,
    calculatePersonality,
    NUMBER_MEANINGS
} from './utils/numerology-logic.js';

const NUMEROLOGY_RESULT_SOURCE = 'numerology_result';
let lastNumerologyShareResult = null;
let personalMapOfferViewed = false;
let accountGeneration = 0;
let resultGeneration = 0;
let profileGeneration = 0;
let activeOwner = getNumerologyOwner();

function getNumerologyOwner() {
    return window.Auth?.isLoggedIn?.() ? (window.Auth.user?.id || null) : null;
}

function captureNumerologyOwner() {
    const ownerId = getNumerologyOwner();
    if (ownerId !== activeOwner) {
        activeOwner = ownerId;
        accountGeneration += 1;
    }
    return { ownerId, generation: accountGeneration, result: resultGeneration };
}

function isNumerologyOwnerActive(owner) {
    return owner.ownerId === getNumerologyOwner()
        && owner.generation === accountGeneration
        && owner.result === resultGeneration;
}

function setNumerologyStatus(message) {
    let status = document.getElementById('num-status');
    if (!status) {
        status = document.createElement('p');
        status.id = 'num-status';
        status.setAttribute('role', 'status');
        document.getElementById('numerology-form')?.append(status);
    }
    status.textContent = message;
}

function resetNumerologyAccount() {
    const ownerId = getNumerologyOwner();
    if (ownerId === activeOwner) return;
    activeOwner = ownerId;
    accountGeneration += 1;
    resultGeneration += 1;
    profileGeneration += 1;
    for (const id of ['num-name', 'num-date', 'num-time']) {
        const input = document.getElementById(id);
        if (input) input.value = '';
    }
    const checkbox = document.getElementById('use-profile-num');
    if (checkbox) checkbox.checked = false;
    for (const id of ['daily-cycles', 'numerology-results', 'numerology-result-actions']) {
        const section = document.getElementById(id);
        if (section) {
            section.hidden = true;
            section.classList.remove('mh-block-visible');
        }
    }
    for (const id of ['val-py', 'val-pm', 'val-pd', 'current-date-display', 'num-interpretation',
        'card-lifepath', 'card-destiny', 'card-soul', 'card-personality']) {
        document.getElementById(id)?.replaceChildren();
    }
    lastNumerologyShareResult = null;
    window.__lastNumerologyShareResult = null;
    personalMapOfferViewed = false;
    setNumerologyStatus('');
}

document.addEventListener('auth:changed', resetNumerologyAccount);

function buildPersonalMapOfferMarkup() {
    return `
        <aside class="numerology-personal-map" aria-label="Jednorázová Osobní mapa na 12 měsíců">
            <div>
                <span class="numerology-personal-map__eyebrow">Raději jednorázový výklad?</span>
                <strong>Proměň svá čísla v mapu příštích 12 měsíců.</strong>
                <p>Osobní PDF začne dnem objednávky a rozpracuje jednu tvoji otázku měsíc po měsíci. Bez členství.</p>
            </div>
            <a class="btn btn--ghost" href="/osobni-mapa.html?source=numerology_result&amp;feature=osobni_mapa_2026" data-numerology-personal-map>Ukázka Osobní mapy · 299 Kč</a>
        </aside>
    `;
}

function wirePersonalMapOffer(container) {
    const cta = container?.querySelector?.('[data-numerology-personal-map]');
    if (!cta) return;

    const context = {
        source: 'numerology_result',
        feature: 'osobni_mapa_2026',
        planId: 'osobni_mapa_2026',
        planType: 'personal_map',
        metadata: {
            product_id: 'osobni_mapa_2026',
            product_type: 'personal_map',
            placement: 'numerology_result',
            path: window.location.pathname
        }
    };

    if (!personalMapOfferViewed) {
        personalMapOfferViewed = true;
        void window.Auth?.sendServerFunnelEvent?.({
            eventName: 'one_time_product_viewed',
            ...context
        });
    }

    cta.addEventListener('click', () => {
        void window.Auth?.sendServerFunnelEvent?.({
            eventName: 'pricing_product_cta_clicked',
            ...context
        });
    });
}

function buildNumerologyUpgradeUrl(source = 'numerology_inline_gate') {
    const authUrl = new URL('/prihlaseni.html', window.location.origin);
    authUrl.searchParams.set('mode', 'register');
    authUrl.searchParams.set('redirect', '/cenik.html');
    authUrl.searchParams.set('plan', 'pruvodce');
    authUrl.searchParams.set('source', source);
    authUrl.searchParams.set('feature', 'numerologie_vyklad');
    authUrl.searchParams.set('entry_source', source);
    authUrl.searchParams.set('entry_feature', 'numerologie_vyklad');
    return `${authUrl.pathname}${authUrl.search}`;
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
            metadata: {
                entry_source: source,
                entry_feature: 'numerologie_vyklad'
            },
            redirect: '/cenik.html',
            authMode
        });
        return;
    }

    window.location.href = buildNumerologyUpgradeUrl(source);
}

function getFirstNameForShare(name) {
    const firstName = String(name || '').trim().split(/\s+/)[0] || '';
    return firstName.slice(0, 26);
}

function buildNumerologyShareResult(name, lifePath, destiny, soul, personality) {
    const lifeMeaning = NUMBER_MEANINGS[lifePath] || {};
    const numbers = [
        { key: 'life_path', label: 'Životní cesta', number: lifePath, color: '#bd9b65' },
        { key: 'destiny', label: 'Osud', number: destiny, color: '#6bb7ff' },
        { key: 'soul', label: 'Duše', number: soul, color: '#8ee6aa' },
        { key: 'personality', label: 'Osobnost', number: personality, color: '#f1c40f' }
    ];

    return {
        displayName: getFirstNameForShare(name),
        lifePath,
        destiny,
        soul,
        personality,
        title: lifeMeaning.title || 'Osobní vibrace',
        short: lifeMeaning.short || 'Vnitřní rytmus a směr',
        numbers
    };
}

function wrapCanvasText(ctx, text, maxWidth) {
    if (window.MH_SHARE_IMAGE?.wrapText) {
        return window.MH_SHARE_IMAGE.wrapText(ctx, text, maxWidth);
    }

    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';

    words.forEach((word) => {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width <= maxWidth) {
            current = test;
        } else {
            if (current) lines.push(current);
            current = word;
        }
    });

    if (current) lines.push(current);
    return lines;
}

function drawCenteredLines(ctx, lines, centerX, startY, lineHeight, maxLines = lines.length, maxWidth = Infinity) {
    if (window.MH_SHARE_IMAGE?.drawCenteredLines) {
        return window.MH_SHARE_IMAGE.drawCenteredLines(ctx, lines, centerX, startY, lineHeight, maxLines, maxWidth);
    }

    lines.slice(0, maxLines).forEach((line, index) => {
        ctx.fillText(line, centerX, startY + index * lineHeight);
    });
    return startY + Math.min(lines.length, maxLines) * lineHeight;
}

function drawRoundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawNumerologyTile(ctx, tile, x, y, width, height) {
    drawRoundRect(ctx, x, y, width, height, 28);
    ctx.fillStyle = 'rgba(11,25,41,0.78)';
    ctx.fill();
    ctx.strokeStyle = `${tile.color}cc`;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.74)';
    ctx.font = '600 29px Inter, Arial, sans-serif';
    ctx.fillText(tile.label, x + 34, y + 54, width - 68);

    ctx.fillStyle = tile.color;
    ctx.font = '700 82px Cinzel, Georgia, serif';
    ctx.fillText(String(tile.number), x + 34, y + 138);

    const meaning = NUMBER_MEANINGS[tile.number]?.short || '';
    ctx.fillStyle = '#e9e3d7';
    ctx.font = '500 27px Inter, Arial, sans-serif';
    wrapCanvasText(ctx, meaning, width - 68).slice(0, 2).forEach((line, index) => {
        ctx.fillText(line, x + 34, y + 188 + index * 34);
    });
}

async function drawNumerologyResultCard(result) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    if (window.MH_SHARE_IMAGE?.drawBrandBackground) {
        await window.MH_SHARE_IMAGE.drawBrandBackground(ctx, canvas);
    } else {
        ctx.fillStyle = '#0b1929';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = 'rgba(11,25,41,0.74)';
    ctx.beginPath();
    ctx.arc(centerX, 366, 168, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(189,155,101,0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, 366, 140, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#d0b17c';
    ctx.font = '700 46px Cinzel, Georgia, serif';
    ctx.fillText('NUMEROLOGICKÝ OTISK', centerX, 190);

    ctx.fillStyle = '#e9e3d7';
    ctx.font = '700 92px Cinzel, Georgia, serif';
    ctx.fillText(String(result.lifePath), centerX, 394);

    ctx.fillStyle = '#d0b17c';
    ctx.font = '700 40px Cinzel, Georgia, serif';
    ctx.fillText(result.title.toUpperCase(), centerX, 462, 920);

    ctx.fillStyle = 'rgba(233,227,215,0.76)';
    ctx.font = '500 32px Inter, Arial, sans-serif';
    const subject = result.displayName ? `Pro ${result.displayName}` : 'Tvoje čísla';
    ctx.fillText(subject, centerX, 548, 820);

    drawNumerologyTile(ctx, result.numbers[0], 116, 575, 398, 238);
    drawNumerologyTile(ctx, result.numbers[1], 566, 575, 398, 238);
    drawNumerologyTile(ctx, result.numbers[2], 116, 848, 398, 238);
    drawNumerologyTile(ctx, result.numbers[3], 566, 848, 398, 238);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e9e3d7';
    ctx.font = '500 33px Inter, Arial, sans-serif';
    const guidance = `${result.short}. Vezmi si z toho jeden konkrétní krok pro dnešní den.`;
    drawCenteredLines(ctx, wrapCanvasText(ctx, guidance, 820), centerX, 1130, 42, 2, 820);

    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = '500 31px Inter, Arial, sans-serif';
    ctx.fillText('mystickahvezda.cz/numerologie.html', centerX, 1244);

    ctx.fillStyle = 'rgba(189,155,101,0.9)';
    ctx.font = '600 27px Inter, Arial, sans-serif';
    ctx.fillText('Bez data narození. Jen tvůj numerologický podpis.', centerX, 1284);

    return canvas;
}

async function saveNumerologyResultImage() {
    if (!lastNumerologyShareResult) return;

    const canvas = await drawNumerologyResultCard(lastNumerologyShareResult);
    const fileName = `numerologie-zivotni-cesta-${lastNumerologyShareResult.lifePath}.png`;
    const metadata = {
        source: NUMEROLOGY_RESULT_SOURCE,
        life_path: lastNumerologyShareResult.lifePath,
        destiny: lastNumerologyShareResult.destiny,
        soul: lastNumerologyShareResult.soul,
        personality: lastNumerologyShareResult.personality
    };

    if (window.MH_SHARE_IMAGE?.shareOrDownload) {
        await window.MH_SHARE_IMAGE.shareOrDownload({
            canvas,
            fileName,
            shareTitle: 'Moje numerologie',
            shareText: `Moje životní cesta je číslo ${lastNumerologyShareResult.lifePath}. Spočítej si tu svoji na mystickahvezda.cz`,
            eventBase: 'numerology_result_image',
            metadata
        });
        return;
    }

    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();

    window.MH_ANALYTICS?.trackAction?.('numerology_result_image_saved', {
        ...metadata,
        format: 'png'
    });
}

// === FORM HANDLING ===
document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('numerology-form');
    const useProfileCheckbox = document.getElementById('use-profile-num');
    const saveResultButton = document.getElementById('btn-save-numerology-result');

    // Register form/profile handlers before any asynchronous profile request.
    const initialOwner = captureNumerologyOwner();
    if (initialOwner.ownerId) {
        void (async () => {
            try {
                const profile = await window.Auth.getProfile();
                if (!isNumerologyOwnerActive(initialOwner) || !profile?.birth_date) return;
                const module = await import('./utils/numerology-logic.js');
                if (!isNumerologyOwnerActive(initialOwner)) return;
                displayPersonalCycles(module.calculatePersonalCycles(profile.birth_date.split('T')[0]));
            } catch (error) {
                console.warn('Auto-load daily vibes failed:', error);
            }
        })();
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
            const profileRequest = ++profileGeneration;
            const owner = captureNumerologyOwner();
            if (e.target.checked) {
                if (!window.Auth || !window.Auth.isLoggedIn()) {
                    window.Auth?.showToast?.('Přihlášení vyžadováno', 'Pro tuto funkci se musíte přihlásit.', 'info');
                    e.target.checked = false;
                    return;
                }

                let profile;
                try {
                    profile = await window.Auth.getProfile();
                } catch (error) {
                    if (isNumerologyOwnerActive(owner)) {
                        window.Auth?.showToast?.('Profil není dostupný', 'Údaje můžeš vyplnit ručně.', 'info');
                    }
                    return;
                }
                if (!isNumerologyOwnerActive(owner) || profileRequest !== profileGeneration || !useProfileCheckbox.checked) return;
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

    if (saveResultButton) {
        saveResultButton.addEventListener('click', saveNumerologyResultImage);
    }
});

async function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('num-name').value.trim();
    const birthDate = document.getElementById('num-date').value;
    const birthTime = document.getElementById('num-time').value;

    if (!name || !birthDate) {
        window.Auth?.showToast?.('Chybějící údaje', 'Vyplňte prosím jméno a datum narození.', 'error');
        return;
    }

    resultGeneration += 1;
    profileGeneration += 1;
    const owner = captureNumerologyOwner();

    // Calculate numbers
    const lifePath = calculateLifePath(birthDate);
    const destiny = calculateDestiny(name);
    const soul = calculateSoul(name);
    const personality = calculatePersonality(name);

    // Calculate Personal Cycles (New Feature)
    // We import this dynamically or assume it's available via the updated logic file
    import('./utils/numerology-logic.js')
        .then(module => {
            if (!isNumerologyOwnerActive(owner)) return;
            if (module.calculatePersonalCycles) {
                const cycles = module.calculatePersonalCycles(birthDate);
                displayPersonalCycles(cycles);
            }
        })
        .catch(err => console.error('Nepodařilo se načíst numerology-logic:', err));

    // Display results
    displayResults(name, lifePath, destiny, soul, personality);
    window.MH_ANALYTICS?.trackAction?.('numerology_result_viewed', {
        feature: 'numerologie_vyklad',
        source: new URLSearchParams(window.location.search).get('source') || NUMEROLOGY_RESULT_SOURCE,
        auth_state: window.Auth?.isLoggedIn?.() ? 'logged_in' : 'anonymous',
        life_path: String(lifePath),
        destiny: String(destiny),
        soul: String(soul),
        personality: String(personality)
    });

    // Show AI interpretation (with premium gate)
    await displayInterpretation(name, birthDate, birthTime, lifePath, destiny, soul, personality, owner);
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

function displayResults(name, lifePath, destiny, soul, personality) {
    const resultsSection = document.getElementById('numerology-results');
    if (!resultsSection) return;

    lastNumerologyShareResult = buildNumerologyShareResult(name, lifePath, destiny, soul, personality);
    window.__lastNumerologyShareResult = lastNumerologyShareResult;

    resultsSection.hidden = false;
    resultsSection.classList.add('mh-block-visible');

    const resultActions = document.getElementById('numerology-result-actions');
    if (resultActions) {
        resultActions.hidden = false;
    }

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

async function displayInterpretation(name, birthDate, birthTime, lifePath, destiny, soul, personality, owner) {
    const interpretationContainer = document.getElementById('num-interpretation');
    if (!interpretationContainer) return;

    // ==============================================
    // PREMIUM GATE: AI Interpretation
    // ==============================================
    const isPremium = window.Auth && window.Auth.isLoggedIn() && window.Auth.isPremium();

    if (!isPremium) {
        setNumerologyStatus('Základní čísla jsou hotová.');
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

                <div class="numerology-premium-shell">
                    <div class="premium-locked numerology-premium-preview">
                        <h4>Plný numerologický rozbor</h4>
                        <p>Základní čísla už máte. Plný rozbor propojí životní cestu, osud, duši a osobnost do jednoho doporučení pro aktuální období.</p>
                        <p class="numerology-premium-preview__muted">Pro životní cestu ${lifePath} by se odemkl konkrétní další krok, osobní cyklus a doporučení pro načasování.</p>
                        <p class="numerology-premium-preview__muted">Základní výpočet proběhl v prohlížeči. Plný AI výklad se odemyká až po pokračování.</p>
                    </div>

                    <div class="premium-lock-overlay">
                        <div class="lock-icon">🔒</div>
                        <p class="lock-text">Detailní rozbor je členská funkce</p>
                        <p class="text-sm">7 dní za 0 Kč, potom automaticky 199 Kč/měsíc, pokud nezrušíš. K aktivaci je potřeba karta.</p>
                        <button class="btn btn--gold unlock-btn numerology-upgrade-btn">Odemknout plný rozbor</button>
                    </div>
                </div>
                ${buildPersonalMapOfferMarkup()}
            </div>
        `;

        wirePersonalMapOffer(interpretationContainer);

        // The preview button opens the trial paywall; keep attribution on one segment.
        if (window.Premium?.trackPaywallHit) window.Premium.trackPaywallHit('numerologie_vyklad', 'trial_paywall');

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

    setNumerologyStatus('Připravuji symbolický výklad čtyř čísel.');
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
        if (!isNumerologyOwnerActive(owner)) return;
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
        if (!isNumerologyOwnerActive(owner)) return;

        // Display AI interpretation
        interpretationContainer.innerHTML = `
            <div class="interpretation-section">
                ${(data.cached || data.fromCache) ? '<span class="badge badge--cache">📦 Z cache (deterministic result)</span>' : ''}
                <div class="interpretation-content">
                    ${data.response.replace(/```html/g, '').replace(/```/g, '')}
                </div>
                ${buildPersonalMapOfferMarkup()}
            </div>
        `;
        wirePersonalMapOffer(interpretationContainer);

        setNumerologyStatus('Výklad je hotový. Je zobrazený pod vypočtenými čísly.');
        // Save only for the account that requested this interpretation.
        if (owner.ownerId && isNumerologyOwnerActive(owner) && window.Auth?.saveReading) {
            try {
            const saveResult = await window.Auth.saveReading('numerology', {
                name,
                birthDate,
                birthTime,
                lifePath,
                destiny,
                soul,
                personality,
                response: data.response
            }, owner.ownerId);
            if (!saveResult) throw new Error('Reading was not saved');
            if (window.MH_DEBUG) console.debug('Reading saved:', saveResult);
            } catch (error) {
                if (!isNumerologyOwnerActive(owner)) return;
                console.warn('Numerology history save failed:', error);
                const message = 'Výklad je hotový, ale nepodařilo se ho uložit do profilu. Zůstává zobrazený tady.';
                const warning = document.createElement('p');
                warning.dataset.numerologySaveError = '';
                warning.setAttribute('role', 'status');
                warning.textContent = message;
                interpretationContainer.append(warning);
                setNumerologyStatus(message);
            }
        }
    } catch (error) {
        if (!isNumerologyOwnerActive(owner)) return;
        setNumerologyStatus('Výklad se nepodařilo načíst. Základní čísla zůstávají zobrazená.');
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
