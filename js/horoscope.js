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

const HOROSCOPE_UI_COPY = {
    cs: {
        periodLabels: { daily: 'Denni horoskop', weekly: 'Tydenni horoskop', monthly: 'Mesicni horoskop' },
        periodDateLabels: { daily: 'Dnes', weekly: 'Tento tyden', monthly: 'Tento mesic' },
        loadingMessages: [
            'Načítám výklad pro tvé znamení…',
            'Připravuji jeho zobrazení…'
        ],
        loadingLabel: 'Načítám výklad…',
        missingPrediction: 'Energie jsou dnes nejasne...',
        loadDateError: 'Výklad se nepodařilo načíst.',
        limitError: 'Dnešní limit výkladů je vyčerpaný. Další výklad bude dostupný zítra.',
        loadError: 'Výklad se teď nepodařilo načíst. Zkus to prosím později.',
        feedback: {
            eyebrow: 'Další krok',
            prompt: 'Co s tebou tenhle vhled udělal?',
            resonanceLabel: 'Zpětná vazba k výkladu',
            focusLabel: 'Téma pro navazující vhled',
            fits: 'Sedí', neutral: 'Ještě nevím', miss: 'Netrefilo se',
            relationships: 'Vztahy', work: 'Práce', energy: 'Energie',
            journal: 'Zapsat reflexi', weekly: 'Odemknout týdenní souvislost',
            saving: 'Ukládám zpětnou vazbu...',
            saved: 'Uloženo. Další vhledy se díky tomu můžou lépe zaměřit.',
            saveError: 'Nepodařilo se uložit. Zkus to znovu.',
            favorite: 'Pridat do oblibenych'
        },
        upsell: {
            authReason: 'Pro tento typ horoskopu je potřeba účet, protože pracuje s hlubším osobním kontextem.',
            weeklyTitle: 'Odemknete tydenni vyhled',
            weeklyCopy: 'Tydenni horoskop spojuje jednotlive dny do jednoho smeru a ukaze, kde ma smysl pridat a kde ubrat.',
            monthlyTitle: 'Odemknete mesicni vyhled',
            monthlyCopy: 'Mesicni horoskop dava sirsi kontext a pomuze vam cist delsi cyklus misto jedine dnesni nalady.',
            eyebrow: 'Premium odemkne vic',
            button: 'Odemknout Hvezdneho Pruvodce',
            plans: 'Nejdriv si projit plany'
        }
    },
    sk: {
        periodLabels: { daily: 'Denný horoskop', weekly: 'Týždenný horoskop', monthly: 'Mesačný horoskop' },
        periodDateLabels: { daily: 'Dnes', weekly: 'Tento týždeň', monthly: 'Tento mesiac' },
        loadingMessages: [
            'Načítavam horoskop pre tvoje znamenie…',
            'Pripravujem dnešný výklad…',
            'Spájam jednotlivé témy…',
            'Už len chvíľu…'
        ],
        loadingLabel: 'Načítavam horoskop…',
        missingPrediction: 'Dnešný výklad sa nepodarilo pripraviť.',
        loadDateError: 'Horoskop sa nepodarilo načítať.',
        limitError: 'Dnešný limit horoskopov je vyčerpaný. Ďalší výklad bude dostupný zajtra.',
        loadError: 'Horoskop sa teraz nepodarilo načítať. Skús to prosím neskôr.',
        feedback: {
            eyebrow: 'Ďalší krok',
            prompt: 'Čo v tebe tento výklad zanechal?',
            resonanceLabel: 'Spätná väzba k výkladu',
            focusLabel: 'Téma pre ďalší pohľad',
            fits: 'Sedí', neutral: 'Ešte neviem', miss: 'Nesedí',
            relationships: 'Vzťahy', work: 'Práca', energy: 'Energia',
            journal: 'Zapísať reflexiu', weekly: 'Odomknúť týždenný kontext',
            saving: 'Ukladám spätnú väzbu…',
            saved: 'Uložené. Ďalšie pohľady sa vďaka tomu môžu lepšie zamerať.',
            saveError: 'Nepodarilo sa uložiť. Skús to znova.',
            favorite: 'Pridať medzi obľúbené'
        },
        upsell: {
            authReason: 'Na tento typ horoskopu potrebuješ účet, pretože pracuje s hlbším osobným kontextom.',
            weeklyTitle: 'Odomkni si týždenný výhľad',
            weeklyCopy: 'Týždenný horoskop spája jednotlivé dni do spoločného smeru a pomáha rozpoznať, kde pridať a kde ubrať.',
            monthlyTitle: 'Odomkni si mesačný výhľad',
            monthlyCopy: 'Mesačný horoskop prináša širší kontext a pomôže ti vnímať dlhší cyklus, nielen dnešnú náladu.',
            eyebrow: 'Členstvo ponúka viac',
            button: 'Odomknúť Hviezdneho sprievodcu',
            plans: 'Najprv si pozrieť plány',
            notice: 'Účet, cenník, platba a správy k členstvu sú zatiaľ v češtine. Cena je uvedená v českých korunách.'
        }
    },
    pl: {
        periodLabels: { daily: 'Horoskop dzienny', weekly: 'Horoskop tygodniowy', monthly: 'Horoskop miesięczny' },
        periodDateLabels: { daily: 'Dzisiaj', weekly: 'W tym tygodniu', monthly: 'W tym miesiącu' },
        loadingMessages: [
            'Wczytuję horoskop dla Twojego znaku…',
            'Przygotowuję dzisiejszy odczyt…',
            'Łączę poszczególne wątki…',
            'Jeszcze chwila…'
        ],
        loadingLabel: 'Wczytuję horoskop…',
        missingPrediction: 'Nie udało się przygotować dzisiejszego horoskopu.',
        loadDateError: 'Nie udało się wczytać horoskopu.',
        limitError: 'Wykorzystano dzisiejszy limit horoskopów. Kolejny będzie dostępny jutro.',
        loadError: 'Nie udało się teraz wczytać horoskopu. Spróbuj ponownie później.',
        feedback: {
            eyebrow: 'Co dalej?',
            prompt: 'Co zostało z Tobą po tym odczycie?',
            resonanceLabel: 'Twoja opinia o odczycie',
            focusLabel: 'Temat kolejnego odczytu',
            fits: 'Pasuje', neutral: 'Jeszcze nie wiem', miss: 'Nie pasuje',
            relationships: 'Relacje', work: 'Praca', energy: 'Energia',
            journal: 'Zapisz refleksję', weekly: 'Odblokuj szerszy kontekst tygodnia',
            saving: 'Zapisuję opinię…',
            saved: 'Zapisano. Dzięki temu kolejne odczyty mogą lepiej odpowiadać Twoim potrzebom.',
            saveError: 'Nie udało się zapisać. Spróbuj ponownie.',
            favorite: 'Dodaj do ulubionych'
        },
        upsell: {
            authReason: 'Do tego typu horoskopu potrzebujesz konta, ponieważ korzysta z szerszego kontekstu osobistego.',
            weeklyTitle: 'Odblokuj horoskop tygodniowy',
            weeklyCopy: 'Horoskop tygodniowy łączy poszczególne dni w szerszy obraz i pomaga zobaczyć, gdzie warto dodać, a gdzie odpuścić.',
            monthlyTitle: 'Odblokuj horoskop miesięczny',
            monthlyCopy: 'Horoskop miesięczny daje szerszy kontekst i pomaga spojrzeć na dłuższy cykl zamiast tylko na dzisiejszy nastrój.',
            eyebrow: 'Członkostwo daje więcej',
            button: 'Odblokuj Gwiezdnego Przewodnika',
            plans: 'Najpierw zobacz plany',
            notice: 'Konto, cennik, płatność i wiadomości dotyczące członkostwa są na razie po czesku. Cena jest podana w koronach czeskich.'
        }
    },
    en: {
        periodLabels: { daily: 'Daily horoscope', weekly: 'Weekly horoscope', monthly: 'Monthly horoscope' },
        periodDateLabels: { daily: 'Today', weekly: 'This week', monthly: 'This month' },
        loadingPrompt: 'Tuning in to your sign’s themes…',
        activationLoadingTitle: sign => `Preparing your first personal horoscope — ${sign}`,
        activationLoadingCopy: 'Your account is ready. There is nothing else to set up; your reading will appear here.',
        activationCompleteTitle: sign => `Today’s horoscope is ready — ${sign}`,
        activationCompleteCopy: 'Your reading is just below. Tomorrow, your sign will be selected automatically.',
        loadingMessages: [
            'Loading your sign’s horoscope…',
            'Preparing today’s reading…',
            'Bringing the themes together…',
            'Just a moment…'
        ],
        loadingLabel: 'Loading horoscope…',
        missingPrediction: 'Today’s horoscope could not be prepared.',
        loadDateError: 'The horoscope could not be loaded.',
        limitError: 'You have reached today’s horoscope limit. Your next reading will be available tomorrow.',
        loadError: 'The horoscope could not be loaded right now. Please try again later.',
        feedback: {
            eyebrow: 'Next step',
            prompt: 'What did this reading bring up for you?',
            resonanceLabel: 'Feedback on this reading',
            focusLabel: 'Topic for a follow-up reading',
            fits: 'It resonates', neutral: 'I’m not sure yet', miss: 'It doesn’t fit',
            relationships: 'Relationships', work: 'Work', energy: 'Energy',
            journal: 'Write a reflection', weekly: 'Unlock the weekly context',
            saving: 'Saving your feedback…',
            saved: 'Saved. This can help shape future readings around your interests.',
            saveError: 'Could not save your feedback. Please try again.',
            favorite: 'Add to favorites'
        },
        upsell: {
            authReason: 'An account is needed for this horoscope because it uses a broader personal context.',
            weeklyTitle: 'Unlock your weekly outlook',
            weeklyCopy: 'The weekly horoscope brings the days together and helps you notice where it may be useful to lean in or ease off.',
            monthlyTitle: 'Unlock your monthly outlook',
            monthlyCopy: 'The monthly horoscope offers a wider frame for reflecting on a longer cycle, beyond today’s mood.',
            eyebrow: 'Membership offers more',
            button: 'Unlock the Star Guide',
            plans: 'View membership plans first',
            notice: 'Account setup, plans, payment, and membership messages are currently in Czech. Prices are shown in Czech koruna.'
        }
    }
};

function getHoroscopeLanguage() {
    const path = window.location.pathname;
    if (path.includes('/sk/')) return 'sk';
    if (path.includes('/pl/')) return 'pl';
    if (path.includes('/en/')) return 'en';

    const documentLanguage = document.documentElement?.lang?.slice(0, 2).toLowerCase();
    if (documentLanguage === 'sk' || documentLanguage === 'pl' || documentLanguage === 'en') return documentLanguage;
    return 'cs';
}

function getHoroscopeUiCopy(language = getHoroscopeLanguage()) {
    return HOROSCOPE_UI_COPY[language] || HOROSCOPE_UI_COPY.cs;
}

function setHoroscopeFeedbackStatus(strip, message, state = 'neutral') {
    const status = strip?.querySelector?.('.horoscope-feedback__status');
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
}

async function saveHoroscopeFeedback(readingId, payload, strip, trigger) {
    if (!readingId || !window.Auth?.saveReadingFeedback) return null;

    const copy = getHoroscopeUiCopy().feedback;

    if (trigger) trigger.disabled = true;
    setHoroscopeFeedbackStatus(strip, copy.saving, 'pending');

    const result = await window.Auth.saveReadingFeedback(readingId, {
        ...payload,
        feature: 'daily_guidance',
        source: 'horoscope_feedback_strip'
    });

    if (trigger) trigger.disabled = false;

    if (!result?.success) {
        setHoroscopeFeedbackStatus(strip, copy.saveError, 'error');
        return null;
    }

    setHoroscopeFeedbackStatus(strip, copy.saved, 'success');
    return result;
}

function renderHoroscopeFeedbackAction(container, readingId, period) {
    if (!container || !readingId) return;

    const copy = getHoroscopeUiCopy().feedback;
    container.querySelector('.horoscope-feedback')?.remove();

    const showWeeklyUpgrade = !window.Auth?.isPremium?.();
    const wrapper = document.createElement('div');
    wrapper.className = 'horoscope-feedback';
    wrapper.innerHTML = `
        <div class="horoscope-feedback__header">
            <span class="horoscope-feedback__eyebrow">${copy.eyebrow}</span>
            <strong>${copy.prompt}</strong>
        </div>
        <div class="horoscope-feedback__chips" aria-label="${copy.resonanceLabel}">
            <button type="button" class="horoscope-feedback__chip" data-resonance="fits">${copy.fits}</button>
            <button type="button" class="horoscope-feedback__chip" data-resonance="neutral">${copy.neutral}</button>
            <button type="button" class="horoscope-feedback__chip" data-resonance="miss">${copy.miss}</button>
        </div>
        <div class="horoscope-feedback__chips" aria-label="${copy.focusLabel}">
            <button type="button" class="horoscope-feedback__chip" data-focus="relationships">${copy.relationships}</button>
            <button type="button" class="horoscope-feedback__chip" data-focus="work">${copy.work}</button>
            <button type="button" class="horoscope-feedback__chip" data-focus="energy">${copy.energy}</button>
        </div>
        <div class="horoscope-feedback__actions">
            <a class="btn btn--glass btn--sm" href="/profil.html#journal-input" data-next-action="journal">${copy.journal}</a>
            ${showWeeklyUpgrade ? `<button type="button" class="btn btn--secondary btn--sm" data-next-action="premium">${copy.weekly}</button>` : ''}
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

function buildHoroscopeUpsell(period, language = getHoroscopeLanguage()) {
    const isWeekly = period === 'weekly';
    const ui = getHoroscopeUiCopy(language).upsell;
    const title = isWeekly ? ui.weeklyTitle : ui.monthlyTitle;
    const copy = isWeekly ? ui.weeklyCopy : ui.monthlyCopy;

    return `
        <div class="card glass-card horoscope-upsell">
            <div class="horoscope-upsell__eyebrow">${ui.eyebrow}</div>
            <h3 class="horoscope-upsell__title">${title}</h3>
            <p class="horoscope-upsell__copy">${copy}</p>
            ${ui.notice ? `<p class="horoscope-upsell__copy">${ui.notice}</p>` : ''}
            <div class="horoscope-upsell__actions">
                <button type="button" class="btn btn--primary horoscope-upsell-btn" data-plan="pruvodce" data-source="horoscope_inline_upsell" data-feature="${period}_horoscope">${ui.button}</button>
                <a href="${buildHoroscopeUpgradeUrl(period)}" class="btn btn--glass">${ui.plans}</a>
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
    const currentLang = getHoroscopeLanguage();
    const uiCopy = getHoroscopeUiCopy(currentLang);
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
    const setActivePeriod = (period) => {
        currentPeriod = normalizeHoroscopePeriod(period) || 'daily';
        tabs.forEach((item) => {
            const isActive = item.dataset.tab === currentPeriod;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        if (sectionBadge) {
            sectionBadge.textContent = uiCopy.periodLabels[currentPeriod] || uiCopy.periodLabels.daily;
        }
    };

    const contentContainer = document.querySelector('.horoscope-content');
    const loadingState = document.createElement('div');
    loadingState.className = 'horoscope-loading hidden';
    loadingState.innerHTML = `
        <div class="text-center">
            <span class="loading-spinner horoscope-loading__spinner"></span>
            <p class="fade-in-text horoscope-loading__text">${uiCopy.loadingPrompt || 'Naladeni na energii vaseho znameni...'}</p>
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
        if (activationTitle) activationTitle.textContent = uiCopy.activationLoadingTitle?.(signName) || `Připravuji první osobní horoskop — ${signName}`;
        if (activationCopy) {
            activationCopy.textContent = uiCopy.activationLoadingCopy || 'Účet je hotový. Nic dalšího nenastavujete — výsledek se zobrazí rovnou tady.';
        }
    };

    const completeActivationResult = (signName) => {
        if (!activationPanel) return;
        activationPanel.hidden = false;
        activationPanel.dataset.state = 'complete';
        if (activationTitle) activationTitle.textContent = uiCopy.activationCompleteTitle?.(signName) || `Dnešní horoskop je připravený — ${signName}`;
        if (activationCopy) {
            activationCopy.textContent = uiCopy.activationCompleteCopy || 'Přečtěte si ho níže. Zítra se vaše znamení otevře automaticky, takže ho nemusíte vybírat znovu.';
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

        const reasonText = reason === 'auth'
            ? `<p class="horoscope-upsell-reason">${uiCopy.upsell.authReason}</p>`
            : '';

        detailText.innerHTML = `${reasonText}${buildHoroscopeUpsell(period, currentLang)}`;
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
    });

    const requestedPeriod = normalizeHoroscopePeriod(new URLSearchParams(window.location.search).get('period'));
    if (requestedPeriod) {
        setActivePeriod(requestedPeriod);
    }

    const selectZodiac = async (card, skipScroll = false) => {
        // Invalidate the previous result before observers see a different sign.
        if (detailSection) detailSection.dataset.loaded = 'false';
        if (detailDate) detailDate.textContent = uiCopy.loadingLabel;
        if (detailWork) { detailWork.textContent = ''; detailWork.hidden = true; }
        if (detailRelationships) detailRelationships.hidden = true;
        if (detailNumbers) detailNumbers.parentElement.hidden = true;
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
        if (detailSymbol) detailSymbol.innerText = signSymbol.replace(/[\uFE0E\uFE0F]/g, '') + '\uFE0E';
        const resultArt = document.getElementById('bg-symbol');
        if (resultArt) {
            resultArt.innerText = signSymbol;
            resultArt.dataset.sign = card.getAttribute('href')?.replace(/^#/, '') || '';
        }

        if (contentContainer) contentContainer.classList.add('hidden');
        loadingState.classList.remove('hidden');

        const currentMsgs = uiCopy.loadingMessages;
        const loadingText = loadingState.querySelector('p');
        let msgIndex = 0;

        if (loadingText) loadingText.innerText = currentMsgs[0];

        const loadingInterval = setInterval(() => {
            msgIndex = (msgIndex + 1) % currentMsgs.length;
            if (loadingText) {
                loadingText.classList.add('is-fading');
                setTimeout(() => {
                    loadingText.innerText = currentMsgs[msgIndex];
                    loadingText.classList.remove('is-fading');
                }, 300);
            }
        }, 2500);

        try {
            let context = [];
            try {
                if (window.Auth && window.Auth.isLoggedIn()) {
                    const journalRes = await fetch(`${window.API_CONFIG?.BASE_URL || '/api'}/user/readings`, {
                        credentials: 'include'
                    });
                    if (!journalRes.ok) throw new Error(`Journal fetch failed: ${journalRes.status}`);
                    const journalData = await journalRes.json();
                    context = (journalData.readings || [])
                        .filter((reading) => reading.type === 'journal')
                        .slice(0, 3)
                        .map((reading) => reading.data.text);
                }
            } catch (error) {
                console.warn('Failed to fetch journal context:', error);
            }

            const data = await window.callAPI('/horoscope', {
                sign: signName,
                period: currentPeriod,
                context,
                lang: currentLang
            });

            const dateLocales = { cs: 'cs-CZ', sk: 'sk-SK', pl: 'pl-PL', en: 'en-GB' };
            const today = new Date().toLocaleDateString(dateLocales[currentLang] || 'cs-CZ', {
                timeZone: 'Europe/Prague',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                weekday: 'long'
            });

            if (detailDate) {
                detailDate.innerText = `${uiCopy.periodDateLabels[currentPeriod] || uiCopy.periodDateLabels.daily} - ${today}`;
            }

            let predictionData;
            let extractedAffirmation = null;

            try {
                predictionData = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
            } catch {
                predictionData = { prediction: data.response, affirmation: null, luckyNumbers: null };
            }

            let cleanPrediction = predictionData.prediction || uiCopy.missingPrediction;
            const affirmationPatterns = [
                /\*\*?(?:Afirmace|Afirmacia|Afirmacja|Affirmation):?\*?\*?\s*[^*]*\*?/gi,
                /(?:Afirmace|Afirmacia|Afirmacja|Affirmation):\s*.+$/gim
            ];

            for (const pattern of affirmationPatterns) {
                const match = cleanPrediction.match(pattern);
                if (match && !extractedAffirmation) {
                    extractedAffirmation = match[0]
                        .replace(/\*+/g, '')
                        .replace(/^(?:Afirmace|Afirmacia|Afirmacja|Affirmation):?\s*/i, '')
                        .trim();
                }
                cleanPrediction = cleanPrediction.replace(pattern, '').trim();
            }

            if (detailText) {
                detailText.innerText = cleanPrediction;
            }

            if (detailWork) {
                const affLabel = { cs: 'Afirmace', sk: 'Afirmacia', pl: 'Afirmacja', en: 'Affirmation' }[currentLang] || 'Afirmace';
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

            const saveKey = `horoscope_saved_${signName}_${currentPeriod}_${getPragueHoroscopeDate()}`;
            if (window.Auth && window.Auth.saveReading && !sessionStorage.getItem(saveKey)) {
                sessionStorage.setItem(saveKey, '1');
                const saveResult = await window.Auth.saveReading('horoscope', {
                    sign: signName,
                    period: currentPeriod,
                    prediction: cleanPrediction,
                    affirmation: predictionData.affirmation || extractedAffirmation,
                    luckyNumbers: predictionData.luckyNumbers || null
                });

                if (saveResult && saveResult.id) {
                    window.currentHoroscopeReadingId = saveResult.id;

                    const existingBtn = document.getElementById('favorite-horoscope-btn');
                    if (!existingBtn && contentContainer) {
                        const favoriteBtn = document.createElement('div');
                        favoriteBtn.className = 'text-center favorite-reading-action';
                        favoriteBtn.innerHTML = `
                            <button id="favorite-horoscope-btn" class="btn btn--glass favorite-reading-action__button">
                                <span class="favorite-icon">&#9733;</span> ${uiCopy.feedback.favorite}
                            </button>
                        `;
                        contentContainer.appendChild(favoriteBtn);

                        document.getElementById('favorite-horoscope-btn').addEventListener('click', async () => {
                            await toggleFavorite(window.currentHoroscopeReadingId, 'favorite-horoscope-btn');
                        });
                    }

                    renderHoroscopeFeedbackAction(contentContainer, saveResult.id, currentPeriod);
                }
            }
        } catch (error) {
            console.error('Horoscope error:', error);
            if (detailDate) detailDate.textContent = uiCopy.loadDateError;

            if (detailText) {
                if (error.status === 402 || error.code === 'PREMIUM_REQUIRED') {
                    renderInlineUpsell(currentPeriod, 'premium');
                } else if (error.status === 429) {
                    detailText.innerText = uiCopy.limitError;
                } else {
                    detailText.innerText = uiCopy.loadError;
                }
            }
        } finally {
            loadingState.classList.add('hidden');
            if (contentContainer) {
                contentContainer.classList.remove('hidden');
                contentContainer.classList.add('fade-in');
            }
            clearInterval(loadingInterval);
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
