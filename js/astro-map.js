/**
 * Astrocartography - Interactive Map Feature
 * Mystická Hvězda
 */

// API Configuration
const API_URL = window.API_CONFIG?.BASE_URL || '/api';

// DOM Elements
const form = document.getElementById('astro-form');
const resultsContainer = document.getElementById('astro-results');
const loadingIndicator = document.getElementById('astro-loading');
const astroMapStatus = document.getElementById('astro-status');
const mapContainer = document.querySelector('.map-container');
let astroMapRequestInProgress = false;
let activeAstroMapRequest = null;
let activeAstroMapProfileAutofill = null;
let astroMapProfileDataSession = null;
let displayedAstroMapSession = null;
let astroMapFormInputRevision = 0;

function getTodayIsoDatePrague() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Prague',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());
    const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function refreshAstroMapBirthDateMaximum() {
    const birthDateInput = document.getElementById('astro-date');
    if (birthDateInput) birthDateInput.max = getTodayIsoDatePrague();
}

function captureAstroMapSession() {
    const isLoggedIn = Boolean(window.Auth?.isLoggedIn?.());
    return {
        isLoggedIn,
        userId: isLoggedIn ? window.Auth?.user?.id : null
    };
}

function hasSameAstroMapSession(session) {
    const current = captureAstroMapSession();
    if (current.isLoggedIn !== session?.isLoggedIn) return false;
    if (!current.isLoggedIn) return true;

    return typeof session.userId === 'string'
        && session.userId.length > 0
        && current.userId === session.userId;
}

function clearAstroMapPersonalInputs() {
    ['astro-name', 'astro-date', 'astro-time', 'astro-place'].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
    const useProfile = document.getElementById('use-profile-astro');
    if (useProfile) useProfile.checked = false;
    astroMapProfileDataSession = null;
}

function clearAstroMapResultVisuals() {
    displayedAstroMapSession = null;
    hideLoading();
    clearAngularLines();
    document.querySelectorAll('.city-marker').forEach((marker) => marker.remove());
    setMapTooltip('', false);
    document.getElementById('favorite-astrocartography-action')?.remove();
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
        setBlockVisible(resultsContainer, false);
    }
}

function clearAstroMapResultAfterInputChange(event) {
    if (event?.target?.id === 'use-profile-astro') return;
    if (event) astroMapFormInputRevision += 1;
    if (astroMapRequestInProgress || !resultsContainer?.classList.contains('mh-block-visible')) return;

    clearAstroMapResultVisuals();
    setAstroMapStatus('Údaje se změnily. Spusť nový výpočet, aby mapa odpovídala aktuálnímu zadání.');
}

function invalidateAstroMapProfileAutofillAfterSessionChange() {
    const request = activeAstroMapProfileAutofill;
    if (request && !hasSameAstroMapSession(request.session)) {
        request.cancelled = true;
        activeAstroMapProfileAutofill = null;
        clearAstroMapPersonalInputs();
        return;
    }
    if (astroMapProfileDataSession && !hasSameAstroMapSession(astroMapProfileDataSession)) {
        clearAstroMapPersonalInputs();
    }
}

function invalidateAstroMapRequestAfterSessionChange(request = activeAstroMapRequest) {
    if (!request || request.cancelled || hasSameAstroMapSession(request.session)) return false;

    request.cancelled = true;
    clearAstroMapPersonalInputs();
    clearAstroMapResultVisuals();
    showError('Účet se během výpočtu změnil. Zadané údaje jsme odstranili; spusť nový výpočet.');
    releaseAstroMapRequestForm(request);
    return false;
}

function releaseAstroMapRequestForm(request) {
    if (!request || request.uiReleased || activeAstroMapRequest !== request) return;

    request.uiReleased = true;
    astroMapRequestInProgress = false;
    activeAstroMapRequest = null;
    if (request.previousBusy === null || request.previousBusy === undefined) {
        request.form?.removeAttribute('aria-busy');
    } else {
        request.form?.setAttribute('aria-busy', request.previousBusy);
    }
    request.formControls?.forEach((control, index) => {
        control.disabled = request.previouslyDisabled[index];
    });
}

function handleAstroMapSessionChange() {
    invalidateAstroMapProfileAutofillAfterSessionChange();
    invalidateAstroMapRequestAfterSessionChange();

    if (displayedAstroMapSession && !hasSameAstroMapSession(displayedAstroMapSession)) {
        clearAstroMapPersonalInputs();
        clearAstroMapResultVisuals();
        showError('Účet se změnil. Předchozí výsledek jsme skryli a zadané údaje odstranili.');
    }
}

function isCurrentAstroMapRequest(request) {
    if (!request || request.cancelled || activeAstroMapRequest !== request) return false;
    if (hasSameAstroMapSession(request.session)) return true;
    invalidateAstroMapRequestAfterSessionChange(request);
    return false;
}

document.addEventListener('auth:changed', handleAstroMapSessionChange);
window.addEventListener('storage', (event) => {
    if (event.key === 'auth_user') handleAstroMapSessionChange();
});

function buildAstroMapPricingUrl(source) {
    const pricingUrl = new URL('/cenik.html', window.location.origin);
    pricingUrl.searchParams.set('plan', 'pruvodce');
    pricingUrl.searchParams.set('source', source);
    pricingUrl.searchParams.set('feature', 'astrocartography');
    pricingUrl.searchParams.set('entry_source', source);
    pricingUrl.searchParams.set('entry_feature', 'astrocartography');
    return `${pricingUrl.pathname}${pricingUrl.search}`;
}

function setBlockVisible(element, visible) {
    if (!element) return;
    element.hidden = !visible;
    element.classList.toggle('mh-block-visible', visible);
}

function setFlexVisible(element, visible) {
    if (!element) return;
    element.hidden = !visible;
    element.classList.toggle('mh-flex-visible', visible);
}

function cityMarkerClass(city) {
    return `city-marker--${city.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}`;
}

function formatPrecisionLabel(precision) {
    const labels = {
        birth_time_location_timezone: 'čas + rozpoznané místo',
        birth_time_utc: 'čas bez rozpoznaného místa',
        date_noon_location_timezone: 'datum + místo, bez přesného času',
        date_noon_utc: 'pouze datum'
    };

    return labels[precision] || precision || '--';
}

function formatAstroEngineNote(note) {
    const rawNote = String(note || '').trim();
    if (!rawNote) {
        return 'Doporučení jsou symbolická a slouží jako podpůrná vrstva pro úvahu o místě.';
    }
    if (/MC\/IC.*low-precision.*ASC\/DSC.*nejsou přesné/i.test(rawNote)) {
        return 'MC/IC meridiány jsou orientační výpočetní vrstva s omezenou přesností. Přesné ASC/DSC křivky mapa zatím neobsahuje.';
    }
    return rawNote;
}

// Intention select for personalized results
const INTENTIONS = {
    'obecny': 'Obecná analýza',
    'kariera': 'Kariéra a úspěch',
    'laska': 'Láska a vztahy',
    'zdravi': 'Zdraví a vitalita',
    'duchovno': 'Duchovní růst'
};

// City coordinates for map visualization (approximate positions as %)
const CITY_POSITIONS = {
    'praha': { x: 52, y: 34, aliases: ['praha', 'praze', 'prague'] },
    'londýn': { x: 47, y: 32, aliases: ['londýn', 'londýně', 'london'] },
    'paříž': { x: 48, y: 34, aliases: ['paříž', 'paříži', 'paris'] },
    'new york': { x: 26, y: 37, aliases: ['new york', 'new yorku', 'nyc'] },
    'los angeles': { x: 15, y: 39, aliases: ['los angeles', 'la', 'kalifornie'] },
    'tokyo': { x: 85, y: 38, aliases: ['tokyo', 'tokiu', 'tokyu', 'japonsko'] },
    'sydney': { x: 89, y: 72, aliases: ['sydney', 'austrálie'] },
    'perth': { x: 80, y: 68, aliases: ['perth', 'perthu', 'západní austrálie'] },
    'borabora': { x: 5, y: 60, aliases: ['bora bora', 'francouzská polynésie'] },
    'barcelona': { x: 47, y: 37, aliases: ['barcelona', 'barceloně', 'španělsko'] },
    'berlín': { x: 51, y: 32, aliases: ['berlín', 'berlíně', 'německo'] },
    'řím': { x: 52, y: 37, aliases: ['řím', 'římě', 'itálie'] },
    'florencie': { x: 51, y: 36, aliases: ['florencie', 'florencii', 'toskánsko'] },
    'benátky': { x: 52, y: 35, aliases: ['benátky', 'benátkách'] },
    'dubaj': { x: 62, y: 44, aliases: ['dubaj', 'dubaji', 'sae'] },
    'singapur': { x: 78, y: 55, aliases: ['singapur', 'singapuru'] },
    'mumbai': { x: 68, y: 48, aliases: ['mumbai', 'bombaj', 'bombaji', 'indie'] },
    'bali': { x: 82, y: 60, aliases: ['bali', 'indonésie'] },
    'bangkok': { x: 77, y: 50, aliases: ['bangkok', 'thajsko'] },
    'istanbul': { x: 56, y: 37, aliases: ['istanbul', 'turecko'] },
    'vídeň': { x: 53, y: 35, aliases: ['vídeň', 'vídni', 'rakousko'] },
    'amsterdam': { x: 48, y: 31, aliases: ['amsterdam', 'nizozemsko'] },
    'toronto': { x: 25, y: 34, aliases: ['toronto', 'kanada'] },
    'san francisco': { x: 14, y: 38, aliases: ['san francisco', 'sf'] },
    'miami': { x: 25, y: 45, aliases: ['miami', 'florida'] },
    'rio de janeiro': { x: 36, y: 65, aliases: ['rio de janeiro', 'rio', 'brazílie'] },
    'buenos aires': { x: 32, y: 72, aliases: ['buenos aires', 'argentina'] },
    'kapské město': { x: 55, y: 75, aliases: ['kapské město', 'johannesburg', 'jižní afrika'] },
    'káhira': { x: 56, y: 42, aliases: ['káhira', 'egypt'] },
    'moskva': { x: 60, y: 28, aliases: ['moskva', 'rusko'] },
    'reykjavík': { x: 40, y: 22, aliases: ['reykjavík', 'reykjavik', 'island'] },
    'havaj': { x: 3, y: 45, aliases: ['havaj', 'hawaii', 'honolulu'] }
};

function startAstroMapUpgradeFlow(source) {
    window.MH_ANALYTICS?.trackCTA?.(source, {
        plan_id: 'pruvodce',
        feature: 'astrocartography'
    });

    if (window.Auth?.startPlanCheckout) {
        window.Auth.startPlanCheckout('pruvodce', {
            source,
            feature: 'astrocartography',
            redirect: '/cenik.html',
            authMode: window.Auth?.isLoggedIn?.() ? 'login' : 'register',
            metadata: {
                entry_source: source,
                entry_feature: 'astrocartography'
            }
        });
        return;
    }

    window.location.href = buildAstroMapPricingUrl(source);
}

function showAstroMapUpgradeGate() {
    const source = 'astro_map_exclusive_gate';
    showError(`
        <div class="text-center">
            <h3>Součást členství</h3>
            <p class="mb-lg">Astrokartografie je součástí členství Mystické Hvězdy. Podmínky najdeš v ceníku.</p>
            <a href="${buildAstroMapPricingUrl(source)}" class="btn btn--primary astro-map-upgrade-btn">Prohlédnout členství</a>
        </div>
    `, { trustedMarkup: true });

    resultsContainer
        ?.querySelector('.astro-map-upgrade-btn')
        ?.addEventListener('click', (event) => {
            event.preventDefault();
            startAstroMapUpgradeFlow(source);
        });
}

/**
 * Initialize the astrocartography feature
 */
function init() {
    if (!form) return;

    refreshAstroMapBirthDateMaximum();
    form.addEventListener('focusin', refreshAstroMapBirthDateMaximum);
    form.addEventListener('pointerdown', refreshAstroMapBirthDateMaximum, true);
    form.addEventListener('keydown', refreshAstroMapBirthDateMaximum, true);
    window.addEventListener('focus', refreshAstroMapBirthDateMaximum);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) refreshAstroMapBirthDateMaximum();
    });

    form.addEventListener('input', clearAstroMapResultAfterInputChange);
    form.addEventListener('change', clearAstroMapResultAfterInputChange);
    form.addEventListener('submit', handleFormSubmit);

    // Add hover effects to existing lines
    initMapInteractions();

    // Handle "Use my profile" checkbox
    const useProfileCheckbox = document.getElementById('use-profile-astro');
    if (useProfileCheckbox) {
        // Toggle visibility based on auth
        const wrapper = useProfileCheckbox.closest('.checkbox-wrapper');
        if (wrapper) {
            const updateVisibility = () => {
                setFlexVisible(wrapper, Boolean(window.Auth && window.Auth.isLoggedIn()));
            };
            updateVisibility();
            document.addEventListener('auth:changed', updateVisibility);
        }

        useProfileCheckbox.addEventListener('change', async (e) => {
            const previousRequest = activeAstroMapProfileAutofill;
            if (previousRequest) {
                previousRequest.cancelled = true;
                activeAstroMapProfileAutofill = null;
            }

            if (!e.target.checked) return;

            if (!window.Auth?.isLoggedIn?.()) {
                if (window.Auth?.showToast) {
                    window.Auth.showToast('Info', 'Pro použití údajů z profilu se nejdřív přihlas.', 'info');
                } else {
                    alert('Pro použití údajů z profilu se nejdřív přihlas.');
                }
                e.target.checked = false;
                return;
            }

            clearAstroMapResultAfterInputChange();

            const request = {
                session: captureAstroMapSession(),
                cancelled: false
            };
            activeAstroMapProfileAutofill = request;
            const inputRevision = astroMapFormInputRevision;

            try {
                const user = await window.Auth.getProfile();
                if (request.cancelled || activeAstroMapProfileAutofill !== request || !e.target.checked) return;
                if (!hasSameAstroMapSession(request.session)) {
                    invalidateAstroMapProfileAutofillAfterSessionChange();
                    return;
                }
                if (inputRevision !== astroMapFormInputRevision) {
                    setAstroMapStatus('Údaje se během načítání změnily. Zkontroluj je a spusť výpočet s aktuálními hodnotami.');
                    e.target.checked = false;
                    return;
                }
                if (!user) throw new Error('Nepodařilo se načíst profil.');

                if (user.first_name) {
                    const nameInput = document.getElementById('astro-name');
                    if (nameInput) nameInput.value = user.first_name;
                }

                if (user.birth_date) {
                    const dateInput = document.getElementById('astro-date');
                    if (dateInput) {
                        try {
                            const d = new Date(user.birth_date);
                            dateInput.value = !isNaN(d.getTime())
                                ? d.toISOString().split('T')[0]
                                : user.birth_date;
                        } catch (err) {
                            console.warn('Error formatting birth_date:', err);
                        }
                    }
                }

                if (user.birth_time) {
                    const timeInput = document.getElementById('astro-time');
                    if (timeInput) {
                        const time = user.birth_time.toString();
                        timeInput.value = time.length > 5 ? time.substring(0, 5) : time;
                    }
                }

                if (user.birth_place) {
                    const placeInput = document.getElementById('astro-place');
                    if (placeInput) placeInput.value = user.birth_place;
                }

                astroMapProfileDataSession = request.session;
            } catch (error) {
                if (request.cancelled || !hasSameAstroMapSession(request.session)) {
                    invalidateAstroMapProfileAutofillAfterSessionChange();
                    return;
                }
                console.error('Autofill Error:', error);
                window.Auth?.showToast?.('Chyba', 'Nepodařilo se stáhnout data z profilu.', 'error');
                e.target.checked = false;
            } finally {
                if (activeAstroMapProfileAutofill === request) {
                    activeAstroMapProfileAutofill = null;
                }
            }
        });
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    if (astroMapRequestInProgress) return;
    if (activeAstroMapProfileAutofill) {
        showError('Počkej, až se údaje z profilu načtou, potom spusť výpočet.');
        return;
    }

    // PREMIUM CHECK
    // Astro Cartography is Premium Only feature
    if (!window.Auth || !window.Auth.isLoggedIn()) {
        window.Auth?.showToast('Přihlášení vyžadováno', 'Pro zobrazení vaší hvězdné mapy se musíte přihlásit.', 'info');
        startAstroMapUpgradeFlow('astro_map_auth_gate');
        return;
    }

    if (!window.Auth.isPremium()) {
        // Show Osvícení-tier paywall
        if (window.Premium) {
            window.Premium.showExclusivePaywall('astrocartography');
        } else {
            showAstroMapUpgradeGate();
        }
        return;
    }

    const requestSession = captureAstroMapSession();
    const readingOwnerId = requestSession.userId;
    if (typeof readingOwnerId !== 'string' || !readingOwnerId) return;

    const name = document.getElementById('astro-name')?.value;
    const birthDate = document.getElementById('astro-date')?.value;
    const birthTime = document.getElementById('astro-time')?.value;
    const birthPlace = document.getElementById('astro-place')?.value;
    const intention = document.getElementById('astro-intention')?.value || 'obecny';

    if (!birthDate || !birthTime || !birthPlace) {
        showError('Vyplň všechna povinná pole.');
        return;
    }

    astroMapRequestInProgress = true;
    const request = {
        session: requestSession,
        cancelled: false,
        form,
        formControls: [...new Set([
            ...form.querySelectorAll('input, select, textarea, button'),
            document.getElementById('use-profile-astro')
        ].filter(Boolean))],
        previousBusy: form.getAttribute('aria-busy'),
        uiReleased: false
    };
    activeAstroMapRequest = request;
    request.previouslyDisabled = request.formControls.map((control) => control.disabled);
    request.formControls.forEach((control) => { control.disabled = true; });
    form.setAttribute('aria-busy', 'true');

    try {
        // Show loading state
        showLoading();

        const data = await window.callAPI('/astrocartography', {
            name,
            birthDate,
            birthTime,
            birthPlace,
            intention: INTENTIONS[intention] || intention
        });

        if (!isCurrentAstroMapRequest(request)) return;

        if (data.success) {
            displayedAstroMapSession = request.session;
            displayResults(data.response, data.astrocartography, data.chart);
            drawAngularLines(data.astrocartography?.angularLines);
            setAstroMapStatus('Mapa je připravená. Výsledek je zobrazen pod formulářem.');
            if (window.Auth?.saveReading) {
                try {
                    if (!isCurrentAstroMapRequest(request)) return;
                    const saveResult = await window.Auth.saveReading('astrocartography', {
                        name,
                        birthDate,
                        birthTime,
                        birthPlace,
                        intention: INTENTIONS[intention] || intention,
                        response: data.response,
                        chart: data.chart,
                        astrocartography: data.astrocartography,
                        fallback: !!data.fallback
                    }, readingOwnerId);

                    if (!isCurrentAstroMapRequest(request)) return;
                    if (saveResult?.id) {
                        appendAstroFavoriteAction(resultsContainer, saveResult.id);
                    } else {
                        showAstroSaveFailure();
                    }
                } catch (saveError) {
                    if (!isCurrentAstroMapRequest(request)) return;
                    console.warn('Astrocartography save failed:', saveError.message);
                    showAstroSaveFailure();
                }
            }
            if (!isCurrentAstroMapRequest(request)) return;
            highlightCitiesFromResponse(data.response, data.astrocartography?.recommendations);
            window.MH_ANALYTICS?.trackEvent?.('astrocartography_calculated', {
                engine_version: data.astrocartography?.engine?.version || data.chart?.engine?.version || null,
                method: data.astrocartography?.engine?.method || null,
                precision: data.astrocartography?.precision || data.chart?.engine?.precision || null,
                location_resolved: Boolean(data.astrocartography?.location || data.chart?.location),
                intention,
                recommendations_count: data.astrocartography?.recommendations?.length || 0,
                angular_lines_count: data.astrocartography?.angularLines?.length || 0,
                top_recommendation_score: data.astrocartography?.recommendations?.[0]?.score ?? null
            });
        } else {
            displayedAstroMapSession = null;
            showError(data.error || 'Něco se pokazilo...');
        }
    } catch (error) {
        if (!isCurrentAstroMapRequest(request)) return;
        console.error('Astrocartography Error:', error);
        displayedAstroMapSession = null;
        showError(error.message || 'Nepodařilo se spojit s hvězdným serverem. Zkuste to později.');
    } finally {
        releaseAstroMapRequestForm(request);
    }
}

/**
 * Show loading indicator
 */
function showLoading() {
    displayedAstroMapSession = null;
    setAstroMapStatus('Připravuji mapu a její symbolický výklad.');
    setFlexVisible(loadingIndicator, true);
    clearAngularLines();
    document.querySelectorAll('.city-marker').forEach((marker) => marker.remove());
    setMapTooltip('', false);
    document.getElementById('favorite-astrocartography-action')?.remove();
    if (resultsContainer) {
        resultsContainer.innerHTML = '';
        setBlockVisible(resultsContainer, false);
    }
    // Animate map
    if (mapContainer) {
        mapContainer.classList.add('calculating');
    }
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    setFlexVisible(loadingIndicator, false);
    if (mapContainer) {
        mapContainer.classList.remove('calculating');
    }
}

const PLANET_INTENTIONS = {
    'obecny': ['slunce', 'jupiter', 'měsíc'],
    'kariera': ['slunce', 'jupiter', 'mars', 'merkur'],
    'laska': ['venuše', 'měsíc', 'neptun'],
    'zdravi': ['slunce', 'měsíc', 'jupiter'],
    'duchovno': ['neptun', 'jupiter', 'uran', 'pluto'],
    'rodina': ['měsíc', 'venuše'],
};

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function normalizeMapText(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function clearAngularLines() {
    document.querySelectorAll('.astro-angular-line').forEach((line) => line.remove());
}

function setMapTooltip(text, visible) {
    const tooltip = document.getElementById('map-tooltip');
    if (!tooltip) return;

    const tooltipText = tooltip.querySelector('p');
    if (tooltipText) tooltipText.textContent = text || '';
    tooltip.classList.toggle('is-visible', Boolean(visible));
}

function classToken(value) {
    return normalizeMapText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';
}

function linePositionClass(x) {
    const clamped = Math.max(0, Math.min(100, x));
    return `astro-angular-line--x-${Math.round(clamped / 5) * 5}`;
}

function drawAngularLines(lines = []) {
    clearAngularLines();
    if (!mapContainer || !Array.isArray(lines) || !lines.length) return;

    lines.slice(0, 10).forEach((line) => {
        const x = Number(line?.map?.x);
        if (!Number.isFinite(x)) return;

        const element = document.createElement('div');
        element.className = [
            'astro-angular-line',
            `astro-angular-line--${String(line.angle || '').toLowerCase()}`,
            `astro-angular-line--planet-${classToken(line.planetId || line.planetName)}`,
            linePositionClass(x)
        ].join(' ');
        element.tabIndex = 0;
        element.setAttribute('role', 'img');
        element.setAttribute('aria-label', `${line.planetName || 'Planeta'} ${line.angle || ''}`);
        element.innerHTML = `
            <span class="astro-angular-line__label">
                ${escapeHtml(line.planetName || 'Planeta')} ${escapeHtml(line.angle || '')}
            </span>
        `;

        const tooltip = `${line.planetName || 'Planeta'} ${line.angle || ''}: ${line.theme || 'planetární meridián'}`;
        element.addEventListener('mouseenter', () => setMapTooltip(tooltip, true));
        element.addEventListener('focus', () => setMapTooltip(tooltip, true));
        element.addEventListener('mouseleave', () => setMapTooltip('', false));
        element.addEventListener('blur', () => setMapTooltip('', false));

        mapContainer.appendChild(element);
    });
}

function appendAstroFavoriteAction(container, readingId) {
    if (!container || !readingId) return;

    document.getElementById('favorite-astrocartography-action')?.remove();

    const action = document.createElement('div');
    action.id = 'favorite-astrocartography-action';
    action.className = 'text-center favorite-reading-action mt-md';
    action.innerHTML = `
        <button id="favorite-astrocartography-btn" type="button" aria-pressed="false" class="btn btn--glass favorite-reading-action__button">
            <svg class="mh-symbol mh-symbol--inline favorite-icon" viewBox="0 0 48 48" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg> Přidat do oblíbených
        </button>
    `;
    container.appendChild(action);

    action.querySelector('#favorite-astrocartography-btn')?.addEventListener('click', async () => {
        if (typeof window.toggleFavorite === 'function') {
            await window.toggleFavorite(readingId, 'favorite-astrocartography-btn');
        }
    });
}

function formatAiResponse(response) {
    const cleanText = String(response || '').replace(/<[^>]*>?/gm, '');

    let formattedContent = cleanText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        .replace(/^(..)?(Zóna .*?)$/gm, '<h4 class="result-section-title">$1 $2</h4>')
        .replace(/\n\s*-\s*(.*?)/g, '<li>$1</li>')
        .replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    if (!formattedContent.startsWith('<h4')) {
        formattedContent = '<p>' + formattedContent + '</p>';
    }

    return window.DOMPurify
        ? window.DOMPurify.sanitize(formattedContent)
        : formattedContent;
}

function renderAstroEngineSummary(astrocartography, chart) {
    const recommendations = astrocartography?.recommendations || [];
    const angularLines = astrocartography?.angularLines || [];
    const chartSummary = chart?.summary || astrocartography?.chartSummary || {};
    const intention = astrocartography?.intention?.label || 'obecný směr';
    const precision = chart?.engine?.precision || astrocartography?.precision || null;
    const location = chart?.location?.name || astrocartography?.location?.name || 'místo nerozpoznáno';
    const note = formatAstroEngineNote(astrocartography?.engine?.note);

    if (!recommendations.length && !chartSummary.sunSign) {
        return '';
    }

    const topCards = recommendations.slice(0, 3).map((item) => `
        <article class="astro-destination-card">
            <div class="astro-destination-card__header">
                <strong>${escapeHtml(item.city)}</strong>
                <span>${escapeHtml(item.score)} / 100</span>
            </div>
            <p class="astro-destination-card__meta">
                ${escapeHtml(item.primaryPlanet?.name || 'Planeta')} v ${escapeHtml(item.primaryPlanet?.sign || 'mapě')} · ${escapeHtml(item.tone || 'rezonance')}
            </p>
            <p>${escapeHtml(item.reason || item.practicalUse || '')}</p>
        </article>
    `).join('');
    const lineCards = angularLines.slice(0, 4).map((line) => `
        <span class="astro-angular-summary__line">
            ${escapeHtml(line.planetName || 'Planeta')} ${escapeHtml(line.angle || '')}: ${escapeHtml(line.longitude ?? '--')}°
        </span>
    `).join('');

    return `
        <div class="astro-engine-summary">
            <div class="astro-engine-summary__header">
                <div>
                    <span class="eyebrow">Vypočteno z narození</span>
                    <h4>Top místa pro ${escapeHtml(intention)}</h4>
                </div>
                <div class="astro-engine-summary__pill">${escapeHtml(astrocartography?.engine?.version || chart?.engine?.version || 'astro-engine')}</div>
            </div>
            <div class="astro-engine-summary__facts">
                <span>Slunce: ${escapeHtml(chartSummary.sunSign || '--')}</span>
                <span>Měsíc: ${escapeHtml(chartSummary.moonSign || '--')}</span>
                <span>Ascendent: ${escapeHtml(chartSummary.ascendantSign || '--')}</span>
                <span>Místo: ${escapeHtml(location)}</span>
                <span>Přesnost: ${escapeHtml(formatPrecisionLabel(precision))}</span>
            </div>
            ${topCards ? `<div class="astro-destination-grid">${topCards}</div>` : ''}
            ${lineCards ? `<div class="astro-angular-summary">${lineCards}</div>` : ''}
            <p class="astro-engine-summary__note">${escapeHtml(note)}</p>
        </div>
    `;
}

/**
 * Display AI response
 */
function displayResults(response, astrocartography = null, chart = null) {
    hideLoading();

    // Get current intention
    const intentionSelect = document.getElementById('astro-intention');
    const currentIntention = intentionSelect ? intentionSelect.value : 'obecny';
    // const intentionName = INTENTIONS[currentIntention] || 'Obecná analýza';

    // Generate Tip - REMOVED per user request
    // const relevantPlanets = PLANET_INTENTIONS[currentIntention] || [];
    // let tipHtml = '';

    // Tip generation code removed
    /*
    if (relevantPlanets.length > 0) {
        // ... code removed ...
    }
    */

    if (resultsContainer) {
        const formattedContent = formatAiResponse(response);
        const engineSummary = renderAstroEngineSummary(astrocartography, chart);

        resultsContainer.innerHTML = `
            <div class="astro-result-card" data-animate>
                <h3 class="result-title" tabindex="-1">Tvoje symbolická astro mapa</h3>
                ${engineSummary}
                <div class="result-content">
                    ${formattedContent}
                </div>
            </div>
        `;
        setBlockVisible(resultsContainer, true);
        resultsContainer.querySelector('.result-title')?.focus({ preventScroll: true });
        resultsContainer.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
}

/**
 * Show error message
 */
function showError(message, { trustedMarkup = false } = {}) {
    displayedAstroMapSession = null;
    setAstroMapStatus(trustedMarkup
        ? 'Astrokartografie je součástí členství. Informace a odkaz na ceník jsou zobrazené pod formulářem.'
        : message);
    hideLoading();
    clearAngularLines();
    document.querySelectorAll('.city-marker').forEach((marker) => marker.remove());
    setMapTooltip('', false);
    document.getElementById('favorite-astrocartography-action')?.remove();

    if (resultsContainer) {
        resultsContainer.textContent = '';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'astro-error';
        // Only the locally constructed membership gate may supply markup.
        if (trustedMarkup) {
            errorDiv.innerHTML = `<span class="error-icon"><svg class="mh-symbol" viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#warning"></use></svg></span>${message}`;
        } else {
            const icon = document.createElement('span');
            icon.className = 'error-icon';
            icon.innerHTML = "<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><use href=\"/img/icons/mh-symbols.svg#warning\"></use></svg>";
            const p = document.createElement('p');
            p.textContent = message;
            errorDiv.append(icon, p);
        }
        resultsContainer.appendChild(errorDiv);
        setBlockVisible(resultsContainer, true);
    }
}

function setAstroMapStatus(message) {
    if (astroMapStatus) astroMapStatus.textContent = String(message || '');
}

function showAstroSaveFailure() {
    setAstroMapStatus('Mapa je připravená, ale nepodařilo se ji uložit do profilu.');
    if (!resultsContainer || resultsContainer.querySelector('[data-reading-save-error]')) return;

    const notice = document.createElement('p');
    notice.className = 'result-context-notice';
    notice.dataset.readingSaveError = 'true';
    notice.textContent = 'Mapa zůstává na stránce, ale nepodařilo se ji uložit do profilu.';
    resultsContainer.appendChild(notice);
}

/**
 * Highlight cities mentioned in the AI response on the map
 */
function highlightCitiesFromResponse(response, recommendations = []) {
    // Remove existing city markers
    document.querySelectorAll('.city-marker').forEach(m => m.remove());

    if (Array.isArray(recommendations) && recommendations.length) {
        recommendations.forEach((destination) => {
            addCityMarker(destination.city, Number(destination.score) >= 62);
        });
        return;
    }

    const lowerResponse = String(response || '').toLowerCase();

    // Find mentioned cities and add markers
    Object.entries(CITY_POSITIONS).forEach(([city, pos]) => {
        // Check primary key OR any alias
        const isMatch = lowerResponse.includes(city) || (pos.aliases && pos.aliases.some(alias => lowerResponse.includes(alias)));

        if (isMatch) {
            addCityMarker(city, isPraisedCity(lowerResponse, city, pos.aliases));
        }
    });
}

/**
 * Check if a city is mentioned positively in the response
 */
function isPraisedCity(response, city, aliases = []) {
    let closestIndex = -1;

    // Find matching index (try city name first, then aliases)
    const allNames = [city, ...aliases];
    for (const name of allNames) {
        const idx = response.indexOf(name);
        if (idx !== -1) {
            closestIndex = idx;
            break;
        }
    }

    if (closestIndex === -1) return false;

    // Check surrounding context for positive/negative words
    const context = response.substring(Math.max(0, closestIndex - 50), closestIndex + 50);
    const positiveWords = ['přízniv', 'ideální', 'doporuč', 'štěstí', 'lásk', 'úspěch', 'harmoni', 'pozitivní', 'růst', 'hojnost'];
    const negativeWords = ['náročn', 'výzv', 'konflikt', 'vyhnou', 'nebezpeč', 'obtížn', 'zkoušk'];

    const isPositive = positiveWords.some(word => context.includes(word));
    const isNegative = negativeWords.some(word => context.includes(word));

    if (isNegative && !isPositive) return false; // Lean towards positive/neutral unless explicitly negative
    return true;
}

/**
 * Add a city marker to the map
 */
function addCityMarker(city, isPositive) {
    if (!mapContainer) return;

    const marker = document.createElement('div');
    marker.className = `city-marker ${cityMarkerClass(city)} ${isPositive ? 'positive' : 'negative'}`;
    const label = String(city || '').charAt(0).toUpperCase() + String(city || '').slice(1);
    marker.innerHTML = `
        <span class="marker-dot"></span>
        <span class="marker-label">${escapeHtml(label)}</span>
    `;
    marker.title = city;

    mapContainer.appendChild(marker);

    // Animate marker appearance
    setTimeout(() => {
        marker.classList.add('visible');
    }, 100);
}

/**
 * Initialize map interactions (hover effects on existing lines)
 */
function initMapInteractions() {
    document.querySelectorAll('.planet-line').forEach(line => {
        line.addEventListener('mouseenter', (e) => {
            const tooltip = document.getElementById('map-tooltip');
            if (tooltip) {
                tooltip.querySelector('p').textContent = e.target.dataset.info;
                tooltip.classList.add('is-visible');
            }
        });
        line.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('map-tooltip');
            if (tooltip) {
                tooltip.classList.remove('is-visible');
            }
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
