import { showFallbackNotice } from './utils/reading-display.js';

/**
 * Mysticka Hvezda - Horoscope Module (AI-Powered)
 * Supports Daily, Weekly, and Monthly horoscopes for all zodiac signs
 */

document.addEventListener('DOMContentLoaded', () => {
    initHoroscope();
});

function getPragueHoroscopeDate(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Prague',
        year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
}

function buildHoroscopeUpgradeUrl(period) {
    const feature = `${period}_horoscope`;
    const pricingUrl = new URL('/cenik.html', window.location.origin);
    pricingUrl.searchParams.set('plan', 'pruvodce');
    pricingUrl.searchParams.set('source', 'horoscope_inline_upsell');
    pricingUrl.searchParams.set('feature', feature);
    pricingUrl.searchParams.set('entry_source', 'horoscope_inline_upsell');
    pricingUrl.searchParams.set('entry_feature', feature);
    return `${pricingUrl.pathname}${pricingUrl.search}`;
}

function startHoroscopeUpgradeFlow(period, reason) {
    const feature = `${period}_horoscope`;
    const metadata = {
        entry_source: 'horoscope_inline_upsell',
        entry_feature: feature
    };

    window.MH_ANALYTICS?.trackCTA?.('horoscope_inline_upsell', {
        plan_id: 'pruvodce',
        period,
        reason,
        ...metadata
    });

    if (window.Auth?.startPlanCheckout) {
        window.Auth.startPlanCheckout('pruvodce', {
            source: 'horoscope_inline_upsell',
            feature,
            metadata,
            redirect: '/cenik.html',
            authMode: window.Auth?.isLoggedIn?.() ? 'login' : 'register'
        });
        return;
    }

    window.location.href = buildHoroscopeUpgradeUrl(period);
}

async function trackHoroscopeFunnelEvent(eventName, source, feature, metadata = {}) {
    try {
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (!csrfToken) return;

        await fetch(`${window.API_CONFIG?.BASE_URL || '/api'}/payment/funnel-event`, {
            method: 'POST',
            credentials: 'include',
            keepalive: true,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({
                eventName,
                source,
                feature,
                planId: 'pruvodce',
                metadata: {
                    path: window.location.pathname,
                    ...metadata
                }
            })
        });
    } catch (error) {
        console.warn('[Horoscope funnel] Could not record event:', error.message);
    }
}

function getSavedZodiacSign() {
    const hasLoginCookie = document.cookie.split(';').some((cookie) => cookie.trim() === 'logged_in=1');
    if (!hasLoginCookie || !window.Auth?.isLoggedIn?.()) return null;

    const personalizedSign = window.MH_PERSONALIZATION?.getSign?.();
    if (personalizedSign) return personalizedSign;

    try {
        const prefs = JSON.parse(localStorage.getItem('mh_user_prefs') || '{}');
        return prefs.sign || localStorage.getItem('mh_zodiac') || null;
    } catch {
        return localStorage.getItem('mh_zodiac') || null;
    }
}

function setHoroscopeFeedbackStatus(strip, message, state = 'neutral') {
    const status = strip?.querySelector?.('.horoscope-feedback__status');
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
}

async function saveHoroscopeFeedback(readingId, payload, strip, trigger) {
    if (!readingId || !window.Auth?.saveReadingFeedback) return null;

    if (trigger) trigger.disabled = true;
    setHoroscopeFeedbackStatus(strip, 'Ukládám zpětnou vazbu...', 'pending');

    const result = await window.Auth.saveReadingFeedback(readingId, {
        ...payload,
        feature: 'daily_guidance',
        source: 'horoscope_feedback_strip'
    });

    if (trigger) trigger.disabled = false;

    if (!result?.success) {
        setHoroscopeFeedbackStatus(strip, 'Nepodařilo se uložit. Zkus to znovu.', 'error');
        return null;
    }

    setHoroscopeFeedbackStatus(strip, 'Uloženo. Další vhledy se díky tomu můžou lépe zaměřit.', 'success');
    return result;
}

function renderHoroscopeFeedbackAction(container, readingId, period) {
    if (!container || !readingId) return;

    container.querySelector('.horoscope-feedback')?.remove();

    const showWeeklyUpgrade = !window.Auth?.isPremium?.();
    const wrapper = document.createElement('div');
    wrapper.className = 'horoscope-feedback';
    wrapper.innerHTML = `
        <div class="horoscope-feedback__header">
            <span class="horoscope-feedback__eyebrow">Další krok</span>
            <strong>Co s tebou tenhle vhled udělal?</strong>
        </div>
        <div class="horoscope-feedback__chips" aria-label="Zpětná vazba k výkladu">
            <button type="button" class="horoscope-feedback__chip" data-resonance="fits">Sedí</button>
            <button type="button" class="horoscope-feedback__chip" data-resonance="neutral">Ještě nevím</button>
            <button type="button" class="horoscope-feedback__chip" data-resonance="miss">Netrefilo se</button>
        </div>
        <div class="horoscope-feedback__chips" aria-label="Téma pro navazující vhled">
            <button type="button" class="horoscope-feedback__chip" data-focus="relationships">Vztahy</button>
            <button type="button" class="horoscope-feedback__chip" data-focus="work">Práce</button>
            <button type="button" class="horoscope-feedback__chip" data-focus="energy">Energie</button>
        </div>
        <div class="horoscope-feedback__actions">
            <a class="btn btn--glass btn--sm" href="/profil.html#journal-input" data-next-action="journal">Zapsat reflexi</a>
            ${showWeeklyUpgrade ? '<button type="button" class="btn btn--secondary btn--sm" data-next-action="premium">Odemknout týdenní souvislost</button>' : ''}
        </div>
        <p class="horoscope-feedback__status" aria-live="polite"></p>
    `;

    wrapper.addEventListener('click', async (event) => {
        const resonanceBtn = event.target.closest('[data-resonance]');
        const focusBtn = event.target.closest('[data-focus]');
        const nextActionEl = event.target.closest('[data-next-action]');
        const clickedEl = resonanceBtn || focusBtn || nextActionEl;
        if (!clickedEl) return;

        const payload = {};
        if (resonanceBtn) payload.resonance = resonanceBtn.dataset.resonance;
        if (focusBtn) payload.focus = focusBtn.dataset.focus;
        if (nextActionEl) payload.nextAction = nextActionEl.dataset.nextAction;

        wrapper.querySelectorAll('.horoscope-feedback__chip').forEach((chip) => {
            if ((payload.resonance && chip.dataset.resonance)
                || (payload.focus && chip.dataset.focus)) {
                chip.classList.toggle('is-selected', chip === clickedEl);
            }
        });

        if (nextActionEl?.tagName === 'A') {
            event.preventDefault();
            await saveHoroscopeFeedback(readingId, payload, wrapper, null);
            window.location.href = nextActionEl.getAttribute('href');
            return;
        }

        if (payload.nextAction === 'premium') {
            await saveHoroscopeFeedback(readingId, payload, wrapper, clickedEl);
            startHoroscopeUpgradeFlow('weekly', period === 'daily' ? 'feedback_weekly_context' : 'feedback_premium_context');
            return;
        }

        await saveHoroscopeFeedback(readingId, payload, wrapper, clickedEl);
    });

    container.appendChild(wrapper);
}

function buildHoroscopeUpsell(period) {
    const isWeekly = period === 'weekly';
    const title = isWeekly ? 'Odemknete tydenni vyhled' : 'Odemknete mesicni vyhled';
    const copy = isWeekly
        ? 'Tydenni horoskop spojuje jednotlive dny do jednoho smeru a ukaze, kde ma smysl pridat a kde ubrat.'
        : 'Mesicni horoskop dava sirsi kontext a pomuze vam cist delsi cyklus misto jedine dnesni nalady.';

    return `
        <div class="card glass-card horoscope-upsell">
            <div class="horoscope-upsell__eyebrow">Premium odemkne vic</div>
            <h3 class="horoscope-upsell__title">${title}</h3>
            <p class="horoscope-upsell__copy">${copy}</p>
            <div class="horoscope-upsell__actions">
                <button type="button" class="btn btn--primary horoscope-upsell-btn" data-plan="pruvodce" data-source="horoscope_inline_upsell" data-feature="${period}_horoscope">Odemknout Hvezdneho Pruvodce</button>
                <a href="${buildHoroscopeUpgradeUrl(period)}" class="btn btn--glass">Nejdriv si projit plany</a>
            </div>
        </div>
    `;
}

function normalizeHoroscopePeriod(period) {
    return ['daily', 'weekly', 'monthly'].includes(period) ? period : null;
}

function initHoroscope() {
    const zodiacCards = document.querySelectorAll('.zodiac-card');
    const detailSection = document.getElementById('horoscope-detail-section');
    const tabs = document.querySelectorAll('.tab');
    const pageParams = new URLSearchParams(window.location.search);
    const entrySource = pageParams.get('source') || '';
    const requestedActivationSign = window.location.hash.substring(1)
        || pageParams.get('sign')
        || pageParams.get('znak')
        || '';
    const isSignupActivation = ['onboarding_complete', 'signup_activation'].includes(entrySource);
    const activationPanel = document.getElementById('horoscope-activation-welcome');
    const activationTitle = document.getElementById('horoscope-activation-title');
    const activationCopy = document.getElementById('horoscope-activation-copy');
    const activationOffer = document.getElementById('horoscope-activation-offer');
    const activationOfferCta = document.getElementById('horoscope-activation-offer-cta');
    const activationOfferDismiss = document.getElementById('horoscope-activation-offer-dismiss');
    const natalCta = document.getElementById('horoscope-natal-cta');

    let currentPeriod = 'daily';
    let selectionVersion = 0;
    const pageLanguage = ['cs', 'sk', 'pl'].includes(document.documentElement.lang.slice(0, 2)) ? document.documentElement.lang.slice(0, 2) : 'cs';
    const uiCopy = {
        cs: { loading: 'Načítá se horoskop…', error: 'Horoskop se nepodařilo načíst. Zkus znovu vybrat znamení.', limit: 'Pro dnešek je limit vyčerpaný. Další dostupnost najdeš ve svém účtu.', favorite: 'Přidat do oblíbených', retry: 'Zkusit znovu', offer: 'Tento typ horoskopu je součástí členství. Nabídka a správa účtu se otevřou v češtině.', membership: 'Podívat se na členství' },
        sk: { loading: 'Načítava sa horoskop…', error: 'Horoskop sa nepodarilo načítať. Skús znovu vybrať znamenie.', limit: 'Dnešný limit je vyčerpaný. Ďalšiu dostupnosť nájdeš vo svojom účte.', favorite: 'Pridať medzi obľúbené', retry: 'Skúsiť znovu', offer: 'Tento typ horoskopu je súčasťou členstva. Ponuka a správa účtu sa otvoria v češtine.', membership: 'Pozrieť členstvo' },
        pl: { loading: 'Wczytywanie horoskopu…', error: 'Nie udało się wczytać horoskopu. Wybierz znak ponownie.', limit: 'Dzisiejszy limit został wykorzystany. Dalszą dostępność znajdziesz na swoim koncie.', favorite: 'Dodaj do ulubionych', retry: 'Spróbuj ponownie', offer: 'Ten rodzaj horoskopu jest częścią członkostwa. Oferta i obsługa konta otworzą się po czesku.', membership: 'Zobacz członkostwo' }
    }[pageLanguage];
    let activationResultTracked = false;
    let activationOfferTracked = false;
    let activationSignName = '';

    const activationOfferDismissedKey = 'mh_horoscope_activation_offer_dismissed_until';
    const activationOfferCooldownMs = 7 * 24 * 60 * 60 * 1000;

    const isActivationOfferDismissed = () => {
        try {
            const dismissedUntil = Number(localStorage.getItem(activationOfferDismissedKey) || 0);
            return dismissedUntil > Date.now();
        } catch {
            return false;
        }
    };

    const setActivationOfferDismissed = () => {
        try {
            localStorage.setItem(
                activationOfferDismissedKey,
                String(Date.now() + activationOfferCooldownMs)
            );
        } catch {
            // The free path still works when storage is unavailable.
        }
    };

    const showActivationOffer = (signName) => {
        if (!activationOffer || isActivationOfferDismissed()) return;

        activationSignName = signName;
        activationOffer.hidden = false;
        if (natalCta) natalCta.hidden = true;

        if (!activationOfferTracked) {
            activationOfferTracked = true;
            const viewMetadata = {
                source: 'post_activation_horoscope',
                feature: 'daily_guidance',
                plan_id: 'pruvodce',
                sign: signName,
                period: currentPeriod,
                bridge_variant: 'first_value_context'
            };
            window.MH_ANALYTICS?.trackEvent?.('paywall_viewed', viewMetadata);
            trackHoroscopeFunnelEvent(
                'paywall_viewed',
                'post_activation_horoscope',
                'daily_guidance',
                viewMetadata
            );
        }
    };

    const dismissActivationOffer = () => {
        setActivationOfferDismissed();
        if (activationOffer) activationOffer.hidden = true;
        if (natalCta) natalCta.hidden = false;
        window.MH_ANALYTICS?.trackEvent?.('paywall_dismissed', {
            source: 'post_activation_horoscope',
            feature: 'daily_guidance',
            plan_id: 'pruvodce',
            sign: activationSignName || null,
            bridge_variant: 'first_value_context'
        });
    };

    const startActivationOfferCheckout = (event) => {
        if (!window.Auth?.startPlanCheckout) return;

        event.preventDefault();
        const metadata = {
            entry_source: 'post_activation_horoscope',
            entry_feature: 'daily_guidance',
            activation_source: entrySource,
            sign: activationSignName || null,
            bridge_variant: 'first_value_context'
        };

        window.MH_ANALYTICS?.trackCTA?.('post_activation_horoscope', {
            plan_id: 'pruvodce',
            feature: 'daily_guidance',
            ...metadata
        });
        trackHoroscopeFunnelEvent(
            'paywall_cta_clicked',
            'post_activation_horoscope',
            'daily_guidance',
            metadata
        );
        window.Auth.startPlanCheckout('pruvodce', {
            source: 'post_activation_horoscope',
            feature: 'daily_guidance',
            metadata,
            redirect: '/cenik.html',
            authMode: window.Auth?.isLoggedIn?.() ? 'login' : 'register'
        });
    };

    activationOfferCta?.addEventListener('click', startActivationOfferCheckout);
    activationOfferDismiss?.addEventListener('click', dismissActivationOffer);

    const detailSymbol = document.getElementById('detail-symbol');
    const detailName = document.getElementById('detail-name');
    const detailDate = document.getElementById('detail-date');
    const detailText = document.getElementById('detail-text');
    const detailWork = document.getElementById('detail-work');
    const detailRelationships = document.getElementById('detail-relationships');
    const detailNumbers = document.getElementById('detail-numbers');
    const sectionBadge = document.querySelector('.horoscope-wrapper .section__badge');
    const periodLabels = {
        cs: { daily: 'Denní horoskop', weekly: 'Týdenní horoskop', monthly: 'Měsíční horoskop' },
        sk: { daily: 'Denný horoskop', weekly: 'Týždenný horoskop', monthly: 'Mesačný horoskop' },
        pl: { daily: 'Horoskop dzienny', weekly: 'Horoskop tygodniowy', monthly: 'Horoskop miesięczny' }
    }[pageLanguage];

    const setActivePeriod = (period) => {
        currentPeriod = normalizeHoroscopePeriod(period) || 'daily';
        tabs.forEach((item) => {
            const isActive = item.dataset.tab === currentPeriod;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-selected', isActive ? 'true' : 'false');
            item.tabIndex = isActive ? 0 : -1;
        });

        if (sectionBadge) {
            sectionBadge.textContent = periodLabels[currentPeriod] || 'Denni horoskop';
        }
    };

    const contentContainer = document.querySelector('.horoscope-content');
    document.getElementById('horoscope-loading')?.remove();
    const loadingState = document.createElement('div');
    loadingState.className = 'horoscope-loading hidden';
    loadingState.setAttribute('role', 'status');
    loadingState.innerHTML = `
        <div class="text-center">
            <span class="loading-spinner horoscope-loading__spinner"></span>
            <p class="horoscope-loading__text">${uiCopy.loading}</p>
        </div>
    `;

    if (contentContainer) {
        contentContainer.parentNode.insertBefore(loadingState, contentContainer);
    }

    const isActivationCard = (card) => {
        if (!isSignupActivation) return false;
        const sign = card?.getAttribute('href')?.replace(/^#/, '') || '';
        return !requestedActivationSign || sign === requestedActivationSign;
    };

    const showActivationProgress = (signName) => {
        if (!activationPanel) return;
        activationPanel.hidden = false;
        activationPanel.dataset.state = 'loading';
        if (activationTitle) activationTitle.textContent = `Připravuji první osobní horoskop — ${signName}`;
        if (activationCopy) {
            activationCopy.textContent = 'Účet je hotový. Nic dalšího nenastavujete — výsledek se zobrazí rovnou tady.';
        }
    };

    const completeActivationResult = (signName) => {
        if (!activationPanel) return;
        activationPanel.hidden = false;
        activationPanel.dataset.state = 'complete';
        if (activationTitle) activationTitle.textContent = `Dnešní horoskop je připravený — ${signName}`;
        if (activationCopy) {
            activationCopy.textContent = 'Přečtěte si ho níže. Zítra se vaše znamení otevře automaticky, takže ho nemusíte vybírat znovu.';
        }

        showActivationOffer(signName);

        if (!activationResultTracked) {
            activationResultTracked = true;
            window.MH_ANALYTICS?.trackEvent?.('signup_activation_result_viewed', {
                source: entrySource,
                feature: 'daily_guidance',
                sign: signName,
                period: currentPeriod,
                entry_source: pageParams.get('entry_source') || null,
                entry_feature: pageParams.get('entry_feature') || null
            });
        }
    };

    const renderInlineUpsell = (period, reason = 'premium') => {
        if (!detailText) return;
        ++selectionVersion;
        loadingState.classList.add('hidden');
        contentContainer?.classList.remove('hidden');
        contentContainer?.querySelectorAll('.favorite-reading-action, .horoscope-feedback, [data-horoscope-retry]').forEach(element => element.remove());
        showFallbackNotice(contentContainer, false);

        const reasonText = reason === 'auth'
            ? '<p class="horoscope-upsell-reason">Pro tento horoskop je potřeba přihlášení a odpovídající členství.</p>'
            : '';

        detailText.innerHTML = pageLanguage === 'cs' ? `${reasonText}${buildHoroscopeUpsell(period)}` : `<p>${uiCopy.offer}</p><a class="btn btn--primary" href="${buildHoroscopeUpgradeUrl(period)}" lang="cs">${uiCopy.membership}</a>`;
        if (detailWork) {
            detailWork.innerHTML = '';
            detailWork.hidden = true;
        }
        if (detailRelationships) detailRelationships.hidden = true;
        if (detailNumbers) {
            detailNumbers.innerText = '';
            detailNumbers.parentElement.hidden = true;
        }

        const upsellBtn = detailText.querySelector('.horoscope-upsell-btn');
        upsellBtn?.addEventListener('click', () => {
            startHoroscopeUpgradeFlow(period, reason);
        });

        if (detailSection) {
            detailSection.dataset.loaded = 'false';
            detailSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    tabs.forEach((tab) => {
        tab.dataset.tabOwner = 'horoscope';
        tab.addEventListener('click', () => {
            const selectedTab = tab.dataset.tab;

            if (selectedTab === 'weekly' || selectedTab === 'monthly') {
                if (!window.Auth || !window.Auth.isLoggedIn()) {
                    renderInlineUpsell(selectedTab, 'auth');
                    return;
                }

                if (!window.Auth.isPremium()) {
                    renderInlineUpsell(selectedTab, 'premium');
                    return;
                }
            }

            setActivePeriod(selectedTab);

            const activeZodiac = document.querySelector('.zodiac-card.active');
            if (activeZodiac) {
                selectZodiac(activeZodiac, true);
            }
        });
        tab.addEventListener('keydown', event => {
            const index = [...tabs].indexOf(tab);
            const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
            if (next === null) return;
            event.preventDefault(); tabs[next].focus(); tabs[next].click();
        });
    });

    const requestedPeriod = normalizeHoroscopePeriod(new URLSearchParams(window.location.search).get('period'));
    if (requestedPeriod) {
        setActivePeriod(requestedPeriod);
    }

    const selectZodiac = async (card, skipScroll = false) => {
        const version = ++selectionVersion;
        const selectedPeriod = currentPeriod;
        const ownerId = window.Auth?.user?.id;
        const isCurrent = () => version === selectionVersion && ownerId === window.Auth?.user?.id;
        zodiacCards.forEach((item) => item.classList.remove('active'));
        card.classList.add('active');

        if (!skipScroll) {
            detailSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        const signName = card.querySelector('.zodiac-card__name').innerText;
        const signSymbol = card.querySelector('.zodiac-card__symbol').innerText;
        const activationSelection = isActivationCard(card);

        if (activationSelection) showActivationProgress(signName);

        if (detailName) detailName.innerText = signName;
        if (detailSymbol) detailSymbol.innerText = signSymbol;
        if (document.getElementById('bg-symbol')) {
            document.getElementById('bg-symbol').innerText = signSymbol;
        }

        const currentLang = pageLanguage;

        const periodLabels = {
            cs: { daily: 'Dnes', weekly: 'Tento týden', monthly: 'Tento měsíc' },
            sk: { daily: 'Dnes', weekly: 'Tento týždeň', monthly: 'Tento mesiac' },
            pl: { daily: 'Dzisiaj', weekly: 'W tym tygodniu', monthly: 'W tym miesiącu' }
        };

        if (contentContainer) contentContainer.classList.add('hidden');
        loadingState.classList.remove('hidden');

        contentContainer?.querySelectorAll('.favorite-reading-action, .horoscope-feedback, [data-horoscope-retry]').forEach(element => element.remove());
        showFallbackNotice(contentContainer, false);
        [detailWork, detailRelationships, detailNumbers?.parentElement].forEach(element => { if (element) element.hidden = true; });

        try {
            let context = [];
            try {
                if (window.Auth && window.Auth.isLoggedIn() && !(currentLang === 'cs' && selectedPeriod === 'daily')) {
                    const journalRes = await fetch(`${window.API_CONFIG?.BASE_URL || '/api'}/user/readings?type=journal&limit=3`, {
                        credentials: 'include'
                    });
                    if (!journalRes.ok) throw new Error(`Journal fetch failed: ${journalRes.status}`);
                    const journalData = await journalRes.json();
                    context = (journalData.readings || [])
                        .filter((reading) => reading.type === 'journal')
                        .slice(0, 3)
                        .map(reading => typeof reading.data === 'string' ? reading.data : reading.data?.text || '')
                        .filter(Boolean);
                }
            } catch (error) {
                console.warn('Failed to fetch journal context:', error);
            }

            if (!isCurrent()) return;
            const data = await window.callAPI('/horoscope', {
                sign: signName,
                period: selectedPeriod,
                context,
                lang: currentLang
            });
            if (!isCurrent()) return;
            showFallbackNotice(contentContainer, data.fallback);

            const dateLocales = { cs: 'cs-CZ', sk: 'sk-SK', pl: 'pl-PL' };
            const today = new Date().toLocaleDateString(dateLocales[currentLang] || 'cs-CZ', {
                timeZone: 'Europe/Prague',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                weekday: 'long'
            });

            if (detailDate) {
                detailDate.innerText = `${periodLabels[currentLang][selectedPeriod]} - ${today}`;
            }

            let predictionData;
            let extractedAffirmation = null;

            try {
                predictionData = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
            } catch {
                predictionData = { prediction: data.response, affirmation: null, luckyNumbers: null };
            }

            if (typeof predictionData?.prediction !== 'string' || !predictionData.prediction.trim()) throw new Error('Missing horoscope text');
            let cleanPrediction = predictionData.prediction;
            const affirmationPatterns = [
                /\*\*?(?:Afirmace|Afirmacia|Afirmacja):?\*?\*?\s*[^*]*\*?/gi,
                /(?:Afirmace|Afirmacia|Afirmacja):\s*.+$/gim
            ];

            for (const pattern of affirmationPatterns) {
                const match = cleanPrediction.match(pattern);
                if (match && !extractedAffirmation) {
                    extractedAffirmation = match[0]
                        .replace(/\*+/g, '')
                        .replace(/^(?:Afirmace|Afirmacia|Afirmacja):?\s*/i, '')
                        .trim();
                }
                cleanPrediction = cleanPrediction.replace(pattern, '').trim();
            }

            if (detailText) {
                detailText.innerText = cleanPrediction;
            }

            if (detailWork) {
                const affLabel = { cs: 'Afirmace', sk: 'Afirmacia', pl: 'Afirmacja' }[currentLang] || 'Afirmace';
                const affirmationText = predictionData.affirmation || extractedAffirmation;
                detailWork.hidden = !affirmationText;
                if (affirmationText) {
                    const rawHtml = `<strong class="horoscope-affirmation-label">&#10024; ${affLabel}:</strong> ${affirmationText}`;
                    const sanitized = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rawHtml) : rawHtml.replace(/<[^>]*>/g, '');
                    detailWork.innerHTML = sanitized;
                } else {
                    detailWork.textContent = '';
                }
            }

            if (detailRelationships) detailRelationships.hidden = true;

            if (detailNumbers) {
                const hasLuckyNumbers = Array.isArray(predictionData.luckyNumbers) && predictionData.luckyNumbers.length > 0;
                detailNumbers.parentElement.hidden = !hasLuckyNumbers;
                if (hasLuckyNumbers) {
                    detailNumbers.innerText = predictionData.luckyNumbers.join(', ');
                } else {
                    detailNumbers.innerText = '';
                }
            }

            if (detailSection) detailSection.dataset.loaded = 'true';
            if (activationSelection) completeActivationResult(signName);

            const saveKey = `horoscope_saved_${ownerId}_${signName}_${selectedPeriod}_${getPragueHoroscopeDate()}`;
            let alreadySaved = false;
            try { alreadySaved = Boolean(sessionStorage.getItem(saveKey)); } catch { /* Optional cache. */ }
            if (ownerId && window.Auth?.saveReading && !alreadySaved) {
                const saveResult = await window.Auth.saveReading('horoscope', {
                    sign: signName,
                    period: selectedPeriod,
                    prediction: cleanPrediction,
                    affirmation: predictionData.affirmation || extractedAffirmation,
                    luckyNumbers: predictionData.luckyNumbers || null,
                    fallback: !!data.fallback
                }).catch(() => null);
                if (!isCurrent()) return;

                if (saveResult && saveResult.id) {
                    try { sessionStorage.setItem(saveKey, '1'); } catch { /* Result remains available without storage. */ }
                    window.currentHoroscopeReadingId = saveResult.id;

                    const existingBtn = document.getElementById('favorite-horoscope-btn');
                    if (!existingBtn && contentContainer) {
                        const favoriteBtn = document.createElement('div');
                        favoriteBtn.className = 'text-center favorite-reading-action';
                        favoriteBtn.innerHTML = `
                            <button id="favorite-horoscope-btn" class="btn btn--glass favorite-reading-action__button">
                                ${uiCopy.favorite}
                            </button>
                        `;
                        contentContainer.appendChild(favoriteBtn);

                        document.getElementById('favorite-horoscope-btn').addEventListener('click', async () => {
                            await window.toggleFavorite?.(saveResult.id, 'favorite-horoscope-btn');
                        });
                    }

                    if (currentLang === 'cs') renderHoroscopeFeedbackAction(contentContainer, saveResult.id, selectedPeriod);
                }
            }
        } catch (error) {
            if (!isCurrent()) return;
            console.error('Horoscope error:', error);

            if (detailText) {
                if (error.status === 402 || error.code === 'PREMIUM_REQUIRED') {
                    renderInlineUpsell(selectedPeriod, 'premium');
                } else if (error.status === 429) {
                    detailText.innerText = uiCopy.limit;
                } else {
                    detailText.innerText = uiCopy.error;
                    const retry = document.createElement('button');
                    retry.type = 'button'; retry.className = 'btn btn--glass'; retry.dataset.horoscopeRetry = 'true'; retry.textContent = uiCopy.retry;
                    retry.addEventListener('click', () => selectZodiac(card, true));
                    detailText.insertAdjacentElement('afterend', retry);
                }
            }
        } finally {
            if (version === selectionVersion) {
                loadingState.classList.add('hidden');
                if (contentContainer) contentContainer.classList.remove('hidden');
            }
        }
    };

    zodiacCards.forEach((card) => {
        card.addEventListener('click', async (event) => {
            event.preventDefault();
            selectZodiac(card, false);
        });
    });

    const autoSelectSign = () => {
        const requestedSign = requestedActivationSign;

        if (requestedSign) {
            const card = Array.from(zodiacCards).find((item) => {
                const href = item.getAttribute('href');
                return href && href.substring(1) === requestedSign;
            });
            if (card) {
                selectZodiac(card, false);
                return true;
            }
        }

        const userSign = getSavedZodiacSign();
        if (userSign) {
            const card = Array.from(zodiacCards).find((item) => {
                const href = item.getAttribute('href');
                return href && href.substring(1) === userSign;
            });
            if (card) {
                selectZodiac(card, true);
                return true;
            }
        }
        return false;
    };

    setTimeout(autoSelectSign, 100);
}

function generateLuckyNumbers() {
    const nums = [];
    while (nums.length < 4) {
        const n = Math.floor(Math.random() * 90) + 1;
        if (!nums.includes(n)) nums.push(n);
    }
    return nums.join(', ');
}
