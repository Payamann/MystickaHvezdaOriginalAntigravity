import {
    calculateLifePath,
    calculateDestiny,
    calculateSoul,
    calculatePersonality,
    getTodayIsoDate,
    isValidBirthDate,
    NUMBER_MEANINGS
} from './utils/numerology-logic.js';
import { getFallbackMessage, showFallbackNotice, formatReadingHtml } from './utils/reading-display.js';

const NUMEROLOGY_RESULT_SOURCE = 'numerology_result';
let lastNumerologyShareResult = null;
let personalMapOfferViewed = false;
let latestNumerologySubmissionId = 0;
let latestNumerologyProfileRequestId = 0;
let numerologyAbortController = null;
let observedNumerologySession = null;

function captureNumerologySession() {
    const isLoggedIn = Boolean(window.Auth?.isLoggedIn?.());
    return { isLoggedIn, userId: isLoggedIn ? window.Auth?.user?.id : null };
}

function hasSameNumerologySession(session) {
    const current = captureNumerologySession();
    if (current.isLoggedIn !== session?.isLoggedIn) return false;
    if (!current.isLoggedIn) return true;
    return typeof session.userId === 'string' && session.userId.length > 0 && current.userId === session.userId;
}

function clearNumerologySessionData() {
    latestNumerologyProfileRequestId += 1;
    clearNumerologyResults();

    for (const id of ['num-name', 'num-date', 'num-time']) {
        const input = document.getElementById(id);
        if (input) input.value = '';
    }
    const useProfileCheckbox = document.getElementById('use-profile-num');
    if (useProfileCheckbox) useProfileCheckbox.checked = false;
}

function clearNumerologyResults({ clearCycles = true } = {}) {
    latestNumerologySubmissionId += 1;
    numerologyAbortController?.abort();
    numerologyAbortController = null;

    const results = document.getElementById('numerology-results');
    if (results) {
        results.hidden = true;
        results.classList.remove('mh-block-visible');
    }
    for (const id of ['card-lifepath', 'card-destiny', 'card-soul', 'card-personality']) {
        document.getElementById(id)?.replaceChildren();
    }
    const interpretation = document.getElementById('num-interpretation');
    interpretation?.replaceChildren();
    setNumerologyStatus('');
    const resultActions = document.getElementById('numerology-result-actions');
    if (resultActions) resultActions.hidden = true;
    if (clearCycles) {
        const cycles = document.getElementById('daily-cycles');
        if (cycles) {
            cycles.hidden = true;
            cycles.classList.remove('mh-block-visible');
        }
        for (const id of ['val-py', 'val-pm', 'val-pd']) {
            const value = document.getElementById(id);
            if (value) value.textContent = '';
        }
    }
    lastNumerologyShareResult = null;
    personalMapOfferViewed = false;
    window.__lastNumerologyShareResult = null;
}

function invalidateNumerologySessionChange() {
    const current = captureNumerologySession();
    const changed = observedNumerologySession && !hasSameNumerologySession(observedNumerologySession);
    observedNumerologySession = current;
    if (changed) clearNumerologySessionData();
}

function isCurrentNumerologySubmission(submissionId, session) {
    if (submissionId !== latestNumerologySubmissionId) return false;
    if (hasSameNumerologySession(session)) return true;
    invalidateNumerologySessionChange();
    return false;
}

document.addEventListener('auth:changed', invalidateNumerologySessionChange);
window.addEventListener('storage', (event) => {
    if (event.key === 'auth_user') invalidateNumerologySessionChange();
});
observedNumerologySession = captureNumerologySession();

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
        { key: 'life_path', label: 'Životní cesta', number: lifePath, color: '#d0b17c' },
        { key: 'destiny', label: 'Osud', number: destiny, color: '#a7bed2' },
        { key: 'soul', label: 'Duše', number: soul, color: '#b5c8ae' },
        { key: 'personality', label: 'Osobnost', number: personality, color: '#d0b17c' }
    ];

    return {
        displayName: getFirstNameForShare(name),
        lifePath,
        destiny,
        soul,
        personality,
        title: lifeMeaning.title || 'Osobní téma',
        short: lifeMeaning.short || 'Vnitřní rytmus a směr',
        numbers
    };
}

function wrapCanvasText(ctx, text, maxWidth) {
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

function ellipsizeCanvasLine(ctx, line, maxWidth) {
    const characters = Array.from(String(line || '').trimEnd());
    while (characters.length > 0 && ctx.measureText(`${characters.join('')}…`).width > maxWidth) {
        characters.pop();
    }
    return `${characters.join('').trimEnd()}…`;
}

function limitCanvasLines(ctx, lines, maxLines, maxWidth) {
    const visibleLines = lines.slice(0, maxLines);
    if (visibleLines.length > 0 && Number.isFinite(maxWidth) && maxWidth > 0) {
        const lastIndex = visibleLines.length - 1;
        const omittedLines = lines.length > visibleLines.length;
        const lastLineOverflows = ctx.measureText(visibleLines[lastIndex]).width > maxWidth;
        if (omittedLines || lastLineOverflows) {
            visibleLines[lastIndex] = ellipsizeCanvasLine(ctx, visibleLines[lastIndex], maxWidth);
        }
    }
    return visibleLines;
}

function drawCenteredLines(ctx, lines, centerX, startY, lineHeight, maxLines = lines.length, maxWidth = Infinity) {
    const visibleLines = limitCanvasLines(ctx, lines, maxLines, maxWidth);
    visibleLines.forEach((line, index) => {
        ctx.fillText(line, centerX, startY + index * lineHeight);
    });
    return startY + visibleLines.length * lineHeight;
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
    drawRoundRect(ctx, x, y, width, height, 18);
    ctx.fillStyle = 'rgba(16,38,56,0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(208,177,124,0.44)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#c0c8ca';
    ctx.font = '600 29px Inter, Arial, sans-serif';
    ctx.fillText(tile.label, x + 34, y + 54);

    ctx.fillStyle = tile.color;
    ctx.font = '700 82px Cinzel, Georgia, serif';
    ctx.fillText(String(tile.number), x + 34, y + 138);

    const meaning = NUMBER_MEANINGS[tile.number]?.short || '';
    ctx.fillStyle = '#e9e3d7';
    ctx.font = '500 27px Inter, Arial, sans-serif';
    limitCanvasLines(ctx, wrapCanvasText(ctx, meaning, width - 68), 2, width - 68).forEach((line, index) => {
        ctx.fillText(line, x + 34, y + 188 + index * 34);
    });
}

function drawNumerologyResultCard(result) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;

    const shareImage = window.MH_SHARE_IMAGE;
    ctx.textAlign = 'center';
    if (shareImage?.drawBrandBackground) {
        shareImage.drawBrandBackground(ctx, canvas);
    } else {
        // Keep export usable when the shared helper failed to load.
        ctx.fillStyle = '#102638';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(208,177,124,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(54, 54, canvas.width - 108, canvas.height - 108);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#d0b17c';
        ctx.font = '600 38px Inter, Arial, sans-serif';
        ctx.fillText('Mystická Hvězda', centerX, 130);
    }

    ctx.fillStyle = 'rgba(208,177,124,0.12)';
    ctx.beginPath();
    ctx.arc(centerX, 366, 188, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(208,177,124,0.68)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, 366, 154, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#d0b17c';
    ctx.font = '700 38px Cinzel, Georgia, serif';
    ctx.fillText('SYMBOLICKÝ NUMEROLOGICKÝ PŘEHLED', centerX, 264, canvas.width - 108);

    ctx.fillStyle = '#e9e3d7';
    ctx.font = '700 92px Cinzel, Georgia, serif';
    ctx.fillText(String(result.lifePath), centerX, 394);

    ctx.fillStyle = '#d0b17c';
    ctx.font = '700 40px Cinzel, Georgia, serif';
    ctx.fillText(result.title.toUpperCase(), centerX, 462);

    ctx.fillStyle = '#c0c8ca';
    ctx.font = '500 32px Inter, Arial, sans-serif';
    const subject = result.displayName ? `Pro ${result.displayName}` : 'Tvoje čísla';
    ctx.fillText(subject, centerX, 522, canvas.width - 108);

    drawNumerologyTile(ctx, result.numbers[0], 116, 595, 398, 238);
    drawNumerologyTile(ctx, result.numbers[1], 566, 595, 398, 238);
    drawNumerologyTile(ctx, result.numbers[2], 116, 872, 398, 238);
    drawNumerologyTile(ctx, result.numbers[3], 566, 872, 398, 238);

    ctx.fillStyle = '#e9e3d7';
    ctx.font = '500 35px Inter, Arial, sans-serif';
    const guidance = `${result.short}. Ber to jako námět k zamyšlení.`;
    drawCenteredLines(ctx, wrapCanvasText(ctx, guidance, 820), centerX, 1170, 46, 2, 820);

    ctx.fillStyle = '#c0c8ca';
    ctx.font = '500 31px Inter, Arial, sans-serif';
    ctx.fillText('mystickahvezda.cz/numerologie.html', centerX, 1244);

    ctx.fillStyle = '#c0c8ca';
    ctx.font = '600 23px Inter, Arial, sans-serif';
    ctx.fillText('Témata k zamyšlení, ne popis osobnosti ani předpověď. Bez data narození.', centerX, 1284, canvas.width - 108);

    return canvas;
}

async function saveNumerologyResultImage() {
    if (!lastNumerologyShareResult) return;

    const canvas = drawNumerologyResultCard(lastNumerologyShareResult);
    const fileName = `numerologie-zivotni-cesta-${lastNumerologyShareResult.lifePath}.png`;
    const metadata = {
        source: NUMEROLOGY_RESULT_SOURCE
    };

    if (window.MH_SHARE_IMAGE?.shareOrDownload) {
        await window.MH_SHARE_IMAGE.shareOrDownload({
            canvas,
            fileName,
            shareTitle: 'Moje numerologie',
            shareText: `V symbolické numerologii mi vyšla životní cesta ${lastNumerologyShareResult.lifePath}. Spočítej si tu svoji na mystickahvezda.cz`,
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
function refreshNumerologyBirthDateMaximum() {
    const birthDateInput = document.getElementById('num-date');
    if (birthDateInput) birthDateInput.max = getTodayIsoDate();
}

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('numerology-form');
    const useProfileCheckbox = document.getElementById('use-profile-num');
    const saveResultButton = document.getElementById('btn-save-numerology-result');
    const initialCyclesRequestId = latestNumerologySubmissionId;
    const initialProfileRequestId = latestNumerologyProfileRequestId;
    const initialSession = captureNumerologySession();

    refreshNumerologyBirthDateMaximum();
    if (form) {
        form.addEventListener('focusin', refreshNumerologyBirthDateMaximum);
        form.addEventListener('pointerdown', refreshNumerologyBirthDateMaximum, true);
        form.addEventListener('keydown', refreshNumerologyBirthDateMaximum, true);
        form.addEventListener('input', (event) => {
            if (event.target?.id === 'num-name' && (lastNumerologyShareResult || numerologyAbortController)) {
                clearNumerologyResults({ clearCycles: false });
            }
            if (event.target?.id === 'num-date') {
                clearNumerologyResults();
                latestNumerologyProfileRequestId += 1;
                if (useProfileCheckbox?.checked) useProfileCheckbox.checked = false;
            }
        });
    }
    window.addEventListener('focus', refreshNumerologyBirthDateMaximum);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) refreshNumerologyBirthDateMaximum();
    });

    // Auto-load Daily Vibrations if logged in
    if (window.Auth && window.Auth.isLoggedIn()) {
        try {
            const profile = await window.Auth.getProfile();
            if (!hasSameNumerologySession(initialSession)
                || initialCyclesRequestId !== latestNumerologySubmissionId
                || initialProfileRequestId !== latestNumerologyProfileRequestId) {
                invalidateNumerologySessionChange();
            } else if (profile && profile.birth_date) {
                // Pre-calculate daily vibes without form submission
                let bDate = profile.birth_date;
                if (bDate.includes('T')) bDate = bDate.split('T')[0];

                // Import logic and display
                import('./utils/numerology-logic.js').then(module => {
                    if (module.calculatePersonalCycles
                        && initialCyclesRequestId === latestNumerologySubmissionId
                        && initialProfileRequestId === latestNumerologyProfileRequestId
                        && hasSameNumerologySession(initialSession)) {
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
            const requestId = ++latestNumerologyProfileRequestId;
            if (e.target.checked) {
                if (!window.Auth || !window.Auth.isLoggedIn()) {
                    window.Auth?.showToast?.('Přihlášení vyžadováno', 'Pro tuto funkci se musíte přihlásit.', 'info');
                    e.target.checked = false;
                    return;
                }

                clearNumerologyResults();
                const requestSession = captureNumerologySession();
                try {
                    const profile = await window.Auth.getProfile();
                    if (requestId !== latestNumerologyProfileRequestId || !e.target.checked) return;
                    if (!hasSameNumerologySession(requestSession)) {
                        invalidateNumerologySessionChange();
                        return;
                    }
                    if (profile?.birth_date) {
                        const birthDate = profile.birth_date.includes('T')
                            ? profile.birth_date.split('T')[0]
                            : profile.birth_date;
                        document.getElementById('num-date').value = birthDate;
                    }
                } catch (error) {
                    if (requestId === latestNumerologyProfileRequestId && e.target.checked && hasSameNumerologySession(requestSession)) {
                        e.target.checked = false;
                        window.Auth?.showToast?.('Datum se nepodařilo načíst', 'Zkus ho zadat ručně.', 'error');
                    }
                    console.warn('Numerology profile date could not be loaded:', error);
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
    const readingSession = captureNumerologySession();
    const readingOwnerId = readingSession.userId;

    const name = document.getElementById('num-name').value.trim();
    const birthDate = document.getElementById('num-date').value;

    if (!name || !birthDate) {
        window.Auth?.showToast?.('Chybějící údaje', 'Doplň jméno a datum narození.', 'error');
        return;
    }

    if (!isValidBirthDate(birthDate)) {
        const message = birthDate > getTodayIsoDate()
            ? 'Datum narození nemůže být v budoucnosti.'
            : 'Zkontroluj zadané datum narození.';
        window.Auth?.showToast?.('Neplatné datum', message, 'error');
        return;
    }

    const submissionId = ++latestNumerologySubmissionId;
    const requestAbortController = new AbortController();
    numerologyAbortController?.abort();
    numerologyAbortController = requestAbortController;

    // Calculate numbers
    const lifePath = calculateLifePath(birthDate);
    const destiny = calculateDestiny(name);
    const soul = calculateSoul(name);
    const personality = calculatePersonality(name);

    // Calculate Personal Cycles (New Feature)
    // We import this dynamically or assume it's available via the updated logic file
    import('./utils/numerology-logic.js')
        .then(module => {
            if (!isCurrentNumerologySubmission(submissionId, readingSession)) return;
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
        auth_state: window.Auth?.isLoggedIn?.() ? 'logged_in' : 'anonymous'
    });

    // Show AI interpretation (with premium gate)
    try {
        await displayInterpretation(name, birthDate, lifePath, destiny, soul, personality, submissionId, readingOwnerId, readingSession, requestAbortController.signal);
    } finally {
        if (numerologyAbortController === requestAbortController) numerologyAbortController = null;
    }
}

function displayPersonalCycles(cycles) {
    if (!cycles) return;

    const section = document.getElementById('daily-cycles');
    if (!section) return;

    const { personalYear, personalMonth, personalDay } = cycles;
    section.hidden = false;

    // Update Values
    document.getElementById('val-pd').textContent = personalDay;
    document.getElementById('val-pm').textContent = personalMonth;
    document.getElementById('val-py').textContent = personalYear;

    // Update Date Display
    const dateDisplay = document.getElementById('current-date-display');
    if (dateDisplay) {
        dateDisplay.textContent = new Date().toLocaleDateString('cs-CZ', { timeZone: 'Europe/Prague' });
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
        dailySection.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    } else {
        resultsSection.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
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

async function displayInterpretation(name, birthDate, lifePath, destiny, soul, personality, submissionId, readingOwnerId, readingSession, abortSignal) {
    const interpretationContainer = document.getElementById('num-interpretation');
    if (!interpretationContainer || !isCurrentNumerologySubmission(submissionId, readingSession)) return;

    // ==============================================
    // PREMIUM GATE: AI Interpretation
    // ==============================================
    const isPremium = window.Auth && window.Auth.isLoggedIn() && window.Auth.isPremium();

    if (!isPremium) {
        // FREE: Show numbers only + paywall for AI interpretation
        interpretationContainer.innerHTML = `
            <div class="interpretation-section">
                <h3>Tvoje čísla</h3>
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
                        <h4>AI výklad čtyř čísel</h4>
                        <p>Základní čísla už máš. Rozšířený AI výklad propojí životní cestu, osud, duši a osobnost do symbolického čtení s otázkami k zamyšlení a malým praktickým podnětem.</p>
                        <p class="numerology-premium-preview__muted">Nejde o výpočet osobního cyklu ani doporučení načasování. Výklad nezná tvoji aktuální situaci; výsledek proto ber jako obecný námět, ne jako osobní předpověď.</p>
                        <p class="numerology-premium-preview__muted">Základní výpočet proběhl v prohlížeči. Plný AI výklad se odemyká až po pokračování.</p>
                    </div>

                    <div class="premium-lock-overlay">
                        <div class="lock-icon" aria-hidden="true"><svg class="mh-symbol premium-lock-icon" viewBox="0 0 48 48" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><use href="/img/icons/mh-symbols.svg#lock"></use></svg></div>
                        <p class="lock-text">AI výklad čtyř čísel je funkcí členství</p>
                        <button class="btn btn--gold unlock-btn numerology-upgrade-btn">Odemknout AI výklad</button>
                    </div>
                </div>
                ${buildPersonalMapOfferMarkup()}
            </div>
        `;
        setNumerologyStatus('Základní čísla jsou vypočtená. Výsledek je zobrazen pod formulářem; rozšířený AI výklad je součástí členství.');

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

    // PREMIUM: Show full AI interpretation
    setNumerologyStatus('Připravuji symbolický výklad čtyř čísel.');
    interpretationContainer.innerHTML = `
        <div class="interpretation-loading">
            <div class="spinner"></div>
            <p class="interpretation-loading__text">Připravuji výklad čtyř čísel...</p>
        </div>
    `;

    try {
        // Call AI API for interpretation
        const apiUrl = window.API_CONFIG?.BASE_URL || '/api';
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (!isCurrentNumerologySubmission(submissionId, readingSession)) return;

        const response = await fetch(`${apiUrl}/numerology`, {
            method: 'POST',
            credentials: 'include',
            signal: abortSignal,
            headers: {
                'Content-Type': 'application/json',
                ...(csrfToken && { 'X-CSRF-Token': csrfToken })
            },
            body: JSON.stringify({
                name,
                birthDate,
                lifePath,
                destiny,
                soul,
                personality
            })
        });

        if (!isCurrentNumerologySubmission(submissionId, readingSession)) return;
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!isCurrentNumerologySubmission(submissionId, readingSession)) return;

        // Display AI interpretation
        interpretationContainer.innerHTML = `
            <div class="interpretation-section">
                <div class="interpretation-content">
                    ${formatReadingHtml(data.response)}
                </div>
                ${buildPersonalMapOfferMarkup()}
            </div>
        `;
        setNumerologyStatus(data.fallback
            ? getFallbackMessage(document.documentElement.lang)
            : 'Výklad je hotový. Je zobrazený pod vypočtenými čísly.');
        wirePersonalMapOffer(interpretationContainer);
        showFallbackNotice(interpretationContainer, data.fallback);

        // Save the generated numerology result to the member's reading history.
        if (isCurrentNumerologySubmission(submissionId, readingSession)
            && readingSession.isLoggedIn
            && window.Auth?.saveReading) {
            let saveResult = null;
            try {
                saveResult = await window.Auth.saveReading('numerology', {
                    name,
                    birthDate,
                    lifePath,
                    destiny,
                    soul,
                    personality,
                    response: data.response,
                    fallback: !!data.fallback
                }, readingOwnerId);
            } catch (saveError) {
                if (!isCurrentNumerologySubmission(submissionId, readingSession)) return;
                console.warn('Numerology reading could not be saved:', saveError);
            }
            if (!isCurrentNumerologySubmission(submissionId, readingSession)) return;
            if (window.MH_DEBUG) console.debug('Reading saved:', saveResult);
            if (!saveResult?.id) {
                const message = 'Výklad je hotový, ale nepodařilo se ho uložit do profilu. Zůstává zobrazený tady.';
                const notice = document.createElement('p');
                notice.dataset.numerologySaveError = 'true';
                notice.className = 'result-context-notice';
                notice.textContent = message;
                interpretationContainer.appendChild(notice);
                setNumerologyStatus(message);
            }
        }
    } catch (error) {
        if (error?.name === 'AbortError' || !isCurrentNumerologySubmission(submissionId, readingSession)) return;
        console.error('AI interpretation error:', error);
        interpretationContainer.innerHTML = `
            <div class="error-message error-message--inline">
                <p class="error-message__text" role="alert">Výklad se nepodařilo načíst. Vypočtená čísla zůstávají dostupná; zkus požadavek znovu.</p>
            </div>
        `;
        setNumerologyStatus('Výklad se nepodařilo načíst. Vypočtená čísla zůstávají dostupná; zkus požadavek znovu.');
    }
}

function setNumerologyStatus(message) {
    const status = document.getElementById('num-status');
    if (status) status.textContent = String(message || '');
}

// Global listener for auth refresh
// When session is updated (e.g. from User -> VIP), reload to reflect changes
document.addEventListener('auth:refreshed', () => {
    if (window.MH_DEBUG) console.debug('Auth refreshed, reloading to unlock content...');
    // Add a small delay to ensure local storage is flushed
    setTimeout(() => window.location.reload(), 500);
}, { once: true });
