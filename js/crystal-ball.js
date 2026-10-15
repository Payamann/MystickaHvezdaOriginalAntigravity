/**
 * Mystická Hvězda - Crystal Ball (AI-Powered)
 * Uses the server AI API for mystical, contextual oracle responses.
 */

import { showFallbackNotice } from './utils/reading-display.js';

let questionHistory = [];
const COOLDOWN_SECONDS = 10;
const CRYSTAL_DAILY_LIMIT = 3;
function readStorage(key) {
    try { return localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key, value) {
    try { localStorage.setItem(key, value); } catch { /* Server remains authoritative for access limits. */ }
}
const CRYSTAL_UI_COPY = {
    cs: {
        cooldown: seconds => `Další otázka za ${seconds} s`,
        loading: 'Připravuje se odpověď…',
        ask: 'Zeptat se koule',
        limitTitle: 'Limit dosažen',
        anonymousLimit: 'Dnešní ukázky zdarma jsou vyčerpané. Další odpovědi jsou součástí členství a podléhají provozním limitům.',
        questionTooLongTitle: 'Příliš dlouhá',
        questionTooLong: 'Zkrať otázku na nejvýš 200 znaků.',
        favorite: 'Přidat do oblíbených',
        registrationTitle: 'První otázka zdarma využita',
        registrationMessage: 'Zaregistruj se zdarma a ptej se dál — účet zdarma dává 3 otázky denně.',
        memberLimit: 'Ve členství můžeš pokračovat v rámci provozních limitů.',
        silent: 'Odpověď se nepodařilo načíst. Zkus to znovu.',
        disconnected: 'Spojení se přerušilo. Otázka zůstává ve formuláři, můžeš to zkusit znovu.',
        saveFailed: 'Odpověď je dostupná tady, uložení do profilu se nepodařilo.'
    },
    sk: {
        cooldown: seconds => `Ďalšia otázka o ${seconds} s`,
        loading: 'Pripravuje sa odpoveď…',
        ask: 'Opýtať sa gule',
        limitTitle: 'Limit dosiahnutý',
        anonymousLimit: 'Dnešné ukážky zadarmo sú vyčerpané. Ďalšie odpovede sú súčasťou členstva a podliehajú prevádzkovým limitom.',
        questionTooLongTitle: 'Príliš dlhá otázka',
        questionTooLong: 'Otázka je príliš dlhá. Prosím, skráť ju.',
        favorite: 'Pridať medzi obľúbené',
        registrationTitle: 'Prvá otázka zadarmo využitá',
        registrationMessage: 'Zaregistruj sa zadarmo a pýtaj sa ďalej — bezplatný účet ponúka 3 otázky denne.',
        memberLimit: 'V členstve môžeš pokračovať v rámci prevádzkových limitov.',
        silent: 'Odpoveď sa nepodarilo načítať. Skús to znova.',
        disconnected: 'Spojenie sa prerušilo. Otázka zostáva vo formulári, môžeš to skúsiť znova.',
        saveFailed: 'Odpoveď je dostupná tu, uloženie do profilu sa nepodarilo.'
    },
    pl: {
        cooldown: seconds => `Kolejne pytanie za ${seconds} s`,
        loading: 'Przygotowywanie odpowiedzi…',
        ask: 'Zapytaj kulę',
        limitTitle: 'Limit wykorzystany',
        anonymousLimit: 'Bezpłatne odpowiedzi na dziś zostały wykorzystane. Dalszy dostęp w ramach członkostwa podlega limitom korzystania.',
        questionTooLongTitle: 'Zbyt długie pytanie',
        questionTooLong: 'Skróć pytanie do maksymalnie 200 znaków.',
        favorite: 'Dodaj do ulubionych',
        registrationTitle: 'Pierwsze bezpłatne pytanie wykorzystane',
        registrationMessage: 'Załóż bezpłatne konto, aby skorzystać z 3 pytań dziennie.',
        memberLimit: 'W ramach członkostwa możesz kontynuować do limitu korzystania.',
        silent: 'Nie udało się wczytać odpowiedzi. Spróbuj ponownie.',
        disconnected: 'Połączenie zostało przerwane. Pytanie pozostaje w formularzu, możesz spróbować ponownie.',
        saveFailed: 'Odpowiedź jest dostępna tutaj, ale nie udało się zapisać jej w profilu.'
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initCrystalBall();
});

function initCrystalBall() {
    const requestedLocale = document.documentElement.lang.toLowerCase().slice(0, 2);
    const locale = Object.hasOwn(CRYSTAL_UI_COPY, requestedLocale) ? requestedLocale : 'cs';
    const copy = CRYSTAL_UI_COPY[locale];
    const ballContainer = document.getElementById('crystal-ball');
    // Note: 'answer' ID is now below the ball in the HTML update
    const answerContainer = document.getElementById('answer-container');
    const answerText = document.getElementById('answer-text');
    const resetBtn = document.getElementById('reset-btn');
    const questionInput = document.getElementById('question-input');
    const askBtn = document.getElementById('ask-btn');
    const bannerUpgradeBtn = document.getElementById('crystal-banner-upgrade');

    if (!ballContainer) return;
    answerContainer?.setAttribute('role', 'status');
    if (questionInput) {
        questionInput.maxLength = 200;
        if (!questionInput.labels?.length) questionInput.setAttribute('aria-label', { cs: 'Tvoje otázka', sk: 'Tvoja otázka', pl: 'Twoje pytanie' }[locale]);
    }

    let isThinking = false;
    let cooldownTimer = null;

    function buildCrystalCheckoutUrl(source) {
        const pricingUrl = new URL('/cenik.html', window.location.origin);
        pricingUrl.searchParams.set('plan', 'pruvodce');
        pricingUrl.searchParams.set('source', source);
        pricingUrl.searchParams.set('feature', 'kristalova_koule');
        pricingUrl.searchParams.set('entry_source', source);
        pricingUrl.searchParams.set('entry_feature', 'kristalova_koule');
        return `${pricingUrl.pathname}${pricingUrl.search}`;
    }

    function getDailyUsageKey() {
        return `mh_daily_crystal_${new Date().toDateString()}`;
    }

    function getLocalDailyUsage() {
        const parsed = Number.parseInt(readStorage(getDailyUsageKey()) || '0', 10);
        return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    }

    function updateFreemiumCounter() {
        const countEl = document.getElementById('freemium-count');
        if (!countEl) return;

        const remaining = Math.max(0, CRYSTAL_DAILY_LIMIT - getLocalDailyUsage());
        countEl.textContent = `${remaining} / ${CRYSTAL_DAILY_LIMIT}`;
    }

    function incrementLocalDailyUsage() {
        writeStorage(getDailyUsageKey(), String(getLocalDailyUsage() + 1));
        updateFreemiumCounter();
    }

    function startCrystalCheckout(source, authMode = 'register') {
        window.MH_ANALYTICS?.trackCTA?.(source, {
            plan_id: 'pruvodce',
            feature: 'kristalova_koule'
        });

        if (window.Auth?.startPlanCheckout) {
            window.Auth.startPlanCheckout('pruvodce', {
                source,
                feature: 'kristalova_koule',
                redirect: '/cenik.html',
                authMode,
                metadata: {
                    entry_source: source,
                    entry_feature: 'kristalova_koule'
                }
            });
            return;
        }

        window.location.href = buildCrystalCheckoutUrl(source);
    }

    if (bannerUpgradeBtn) {
        bannerUpgradeBtn.addEventListener('click', (event) => {
            event.preventDefault();
            startCrystalCheckout('crystal_ball_banner_upgrade', 'register');
        });
    }

    function setResetVisible(visible) {
        if (!resetBtn) return;
        resetBtn.classList.toggle('crystal-reset--visible', visible);
    }

    // Check availability based on last usage
    function getRemainingCooldown() {
        const lastUsage = readStorage('crystalBall_lastUsage');
        if (!lastUsage) return 0;

        const elapsed = (Date.now() - parseInt(lastUsage)) / 1000;
        return Math.max(0, Math.ceil(COOLDOWN_SECONDS - elapsed));
    }

    // Update UI based on cooldown
    function updateCooldownUI() {
        if (isThinking) {
            if (askBtn) { askBtn.disabled = true; askBtn.textContent = copy.loading; }
            return;
        }
        const remaining = getRemainingCooldown();
        if (remaining > 0) {
            if (askBtn) {
                askBtn.disabled = true;
                askBtn.innerText = copy.cooldown(remaining);
                askBtn.classList.add('crystal-action--cooldown');
            }
            if (ballContainer) ballContainer.classList.add('ball-container--cooldown');

            // Re-check every second
            clearTimeout(cooldownTimer);
            cooldownTimer = setTimeout(updateCooldownUI, 1000);
        } else {
            if (askBtn) {
                askBtn.disabled = false;
                askBtn.innerText = copy.ask;
                askBtn.classList.remove('crystal-action--cooldown');
            }
            if (ballContainer) ballContainer.classList.remove('ball-container--cooldown');
        }
    }

    // Initial check
    updateCooldownUI();
    updateFreemiumCounter();

    // Function to ask the oracle
    async function askOracle(question) {
        const isLoggedIn = Boolean(window.Auth?.isLoggedIn?.());

        if (!isLoggedIn && getLocalDailyUsage() >= CRYSTAL_DAILY_LIMIT) {
            window.Auth?.showToast?.(copy.limitTitle, copy.anonymousLimit, 'info');
            startCrystalCheckout('crystal_ball_limit_gate', 'register');
            return;
        }

        const remaining = getRemainingCooldown();
        if (remaining > 0) return; // Prevent spam

        if (isThinking || !question.trim()) return;

        if (question.length > 200) {
            window.Auth?.showToast?.(copy.questionTooLongTitle, copy.questionTooLong, 'info');
            return;
        }

        isThinking = true;
        updateCooldownUI();
        askBtn?.setAttribute('aria-busy', 'true');

        // Reset state
        if (answerContainer) answerContainer.classList.remove('visible');
        answerContainer?.querySelectorAll('.favorite-reading-action, [data-reading-save-error]').forEach(element => element.remove());
        showFallbackNotice(answerContainer, false);
        if (answerText) answerText.textContent = '';
        setResetVisible(false);

        // Animation
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) ballContainer.classList.add('shaking');

        try {
            const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
            const response = await fetch(`${window.API_CONFIG?.BASE_URL || '/api'}/crystal-ball`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                },
                body: JSON.stringify({
                    question: question.trim(),
                    lang: locale,
                    history: questionHistory.slice(-5)
                })
            });

            const data = await response.json();

            ballContainer.classList.remove('shaking');

            // Record usage time for cooldown
            if (data.success) {
                writeStorage('crystalBall_lastUsage', Date.now().toString());
                questionHistory.push(question.trim());
                if (!isLoggedIn) {
                    incrementLocalDailyUsage();
                } else {
                    updateFreemiumCounter();
                }
                if (answerContainer) answerContainer.classList.add('visible');
                showFallbackNotice(answerContainer, data.fallback);
                if (answerText) await typewriterEffect(answerText, data.response);
                window.MH_ANALYTICS?.trackAction?.('crystal_ball_answer_viewed', {
                    feature: 'kristalova_koule',
                    source: new URLSearchParams(window.location.search).get('source') || 'crystal_ball_question',
                    auth_state: isLoggedIn ? 'logged_in' : 'anonymous',
                    question_length: question.trim().length
                });

                // Save to history if logged in
                if (isLoggedIn && window.Auth?.saveReading) {
                    const saveResult = await window.Auth.saveReading('crystal-ball', {
                        question: question.trim(),
                        answer: data.response,
                        fallback: !!data.fallback
                    }).catch(() => null);

                    // Store reading ID and add favorite button
                    if (saveResult && saveResult.id) {
                        window.currentCrystalReadingId = saveResult.id;

                        // Add favorite button after answer
                        const favoriteBtn = document.createElement('div');
                        favoriteBtn.className = 'text-center favorite-reading-action';
                        favoriteBtn.innerHTML = `
                            <button id="favorite-crystal-btn" class="btn btn--glass favorite-reading-action__button">
                                <svg class="mh-symbol" width="24" height="24" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><use href="/img/icons/mh-symbols.svg#bookmark"></use></svg> ${copy.favorite}
                            </button>
                        `;
                        answerContainer.appendChild(favoriteBtn);

                        // Attach listener
                        document.getElementById('favorite-crystal-btn').addEventListener('click', async () => {
                            await window.toggleFavorite?.(saveResult.id, 'favorite-crystal-btn');
                        });
                    } else {
                        const notice = document.createElement('p');
                        notice.dataset.readingSaveError = 'true';
                        notice.textContent = copy.saveFailed;
                        answerContainer?.append(notice);
                    }
                }
            } else {
                if (data.code === 'REGISTRATION_REQUIRED') {
                    // Anonymní vyčerpal free otázku — pošli na registraci zdarma, ne do premium checkoutu.
                    if (answerContainer) answerContainer.classList.remove('visible');
                    window.Auth?.showToast?.(copy.registrationTitle, copy.registrationMessage, 'info');
                    window.MH_ANALYTICS?.trackCTA?.('crystal_ball_register_gate', { feature: 'kristalova_koule' });
                    const backTo = encodeURIComponent(window.location.pathname);
                    setTimeout(() => {
                        window.location.href = `/prihlaseni.html?mode=register&source=crystal_ball_register_gate&feature=kristalova_koule&redirect=${backTo}`;
                    }, 1600);
                } else if (response.status === 402 || response.status === 403 || (data.error && data.error.toLowerCase().includes('limit'))) {
                    if (answerContainer) answerContainer.classList.remove('visible');
                    window.Auth?.showToast?.(copy.limitTitle, copy.memberLimit, 'info');
                    startCrystalCheckout('crystal_ball_limit_gate', 'register');
                } else {
                    if (answerContainer) answerContainer.classList.add('visible');
                    if (answerText) answerText.textContent = data.error || copy.silent;
                }
            }

        } catch (error) {
            console.error('Oracle Error:', error);
            ballContainer.classList.remove('shaking');
            if (answerContainer) answerContainer.classList.add('visible');
            if (answerText) answerText.textContent = copy.disconnected;
        }

        setResetVisible(true);
        isThinking = false;
        askBtn?.removeAttribute('aria-busy');
        updateCooldownUI();
    }

    async function typewriterEffect(element, text) {
        // A whole answer remains easy to read and available without animation.
        element.textContent = String(text || '');
    }

    // Events
    ballContainer.addEventListener('click', () => {
        if (getRemainingCooldown() > 0) return; // Ignore clicks during cooldown

        if (questionInput && questionInput.value.trim()) {
            askOracle(questionInput.value);
        } else {
            questionInput.focus();
            questionInput.classList.add('shake-input'); // Visual cue (needs CSS)
            setTimeout(() => questionInput.classList.remove('shake-input'), 500);
        }
    });

    if (askBtn) {
        askBtn.addEventListener('click', () => {
            if (questionInput) askOracle(questionInput.value);
        });
    }

    if (questionInput) {
        questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') askOracle(questionInput.value);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (answerContainer) {
                answerContainer.classList.remove('visible');
                // Remove accumulated favorite buttons
                answerContainer.querySelectorAll('.favorite-reading-action').forEach(el => el.remove());
            }
            if (questionInput) {
                questionInput.value = '';
                questionInput.focus();
            }
            setResetVisible(false);
        });
    }
}
