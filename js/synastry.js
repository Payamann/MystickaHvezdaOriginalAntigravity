import { calculateSynastryScores } from './utils/synastry-logic.js';

/**
 * Mystická Hvězda - Synastry Calculator (AI-Powered)
 * Uses Gemini AI for detailed relationship analysis
 */

document.addEventListener('DOMContentLoaded', () => {
    initSynastry();
});

function startSynastryUpgradeFlow(source) {
    window.MH_ANALYTICS?.trackCTA?.(source, {
        plan_id: 'pruvodce',
        feature: 'partnerska_detail'
    });

    window.Auth?.startPlanCheckout?.('pruvodce', {
        source,
        feature: 'partnerska_detail',
        redirect: '/cenik.html',
        authMode: window.Auth?.isLoggedIn?.() ? 'login' : 'register'
    });
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

function animateScale(element, axis, value, duration = 1000) {
    if (!element) return;
    element.animate([
        { transform: `${axis}(0)` },
        { transform: `${axis}(${value})` }
    ], {
        duration,
        easing: 'ease-out',
        fill: 'forwards'
    });
}

function initSynastry() {
    const form = document.getElementById('synastry-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await calculateCompatibility();
    });

    // Handle "Use my profile" checkbox
    const useProfileCheckbox = document.getElementById('use-profile-p1');
    if (useProfileCheckbox) {
        useProfileCheckbox.addEventListener('change', async (e) => {
            const nameInput = document.getElementById('p1-name');
            const dateInput = document.getElementById('p1-date');

            if (e.target.checked) {
                if (!window.Auth?.isLoggedIn()) {
                    window.Auth?.showToast?.('Info', 'Pro použití profilu se prosím přihlaste.', 'info');
                    e.target.checked = false;
                    return;
                }

                try {
                    const user = await window.Auth.getProfile();
                    if (!user) throw new Error('Failed to load profile');

                    if (user.first_name) nameInput.value = user.first_name;

                    if (user.birth_date) {
                        try {
                            const d = new Date(user.birth_date);
                            if (!isNaN(d.getTime())) {
                                dateInput.value = d.toISOString().split('T')[0];
                            } else {
                                dateInput.value = user.birth_date;
                            }
                        } catch (parseErr) {
                            dateInput.value = user.birth_date;
                        }
                    }
                } catch (error) {
                    console.error('Synastry Autofill Error:', error);
                    window.Auth?.showToast?.('Chyba', 'Nepodařilo se načíst data.', 'error');
                    e.target.checked = false;
                }
            }
        });
    }
    // Check visibility on load & auth change
    updateProfileVisibility();
    document.addEventListener('auth:changed', updateProfileVisibility);
    document.addEventListener('auth:refreshed', updateProfileVisibility); // Handle status changes too
}

function updateProfileVisibility() {
    const wrapper = document.getElementById('profile-option-wrapper');
    if (!wrapper) return;

    if (window.Auth && window.Auth.isLoggedIn()) {
        setFlexVisible(wrapper, true);
    } else {
        setFlexVisible(wrapper, false);
        // Uncheck if hidden
        const checkbox = document.getElementById('use-profile-p1');
        if (checkbox) checkbox.checked = false;
    }
}

async function calculateCompatibility() {
    const btn = document.querySelector('#synastry-form button');
    const resultsDiv = document.getElementById('synastry-results');
    const originalText = btn.textContent;

    btn.textContent = 'Analyzuji hvězdy...';
    btn.disabled = true;

    // Get form data
    const person1 = {
        name: document.getElementById('p1-name').value,
        birthDate: document.getElementById('p1-date').value
    };
    const person2 = {
        name: document.getElementById('p2-name').value,
        birthDate: document.getElementById('p2-date').value
    };

    // Calculate scores using imported logic
    const scores = calculateSynastryScores(person1, person2);
    const { emotion: emotionScore, communication: commScore, passion: passionScore, total: totalScore } = scores;
    const viewerProfile = window.Auth?.isLoggedIn?.() ? await window.Auth.getProfile() : null;
    const hasActiveSession = !!viewerProfile;

    // Show results with animation
    setBlockVisible(resultsDiv, true);
    resultsDiv.scrollIntoView({ behavior: 'smooth' });

    // Animate scores
    // Check Premium Status for Visuals
    const isPremium = hasActiveSession && window.Auth && window.Auth.isPremium();

    // Animate Total Score (Always visible)
    animateValue('total-score', 0, totalScore, 2000);
    const heartFill = document.getElementById('heart-anim');
    if (heartFill) {
        animateScale(heartFill, 'scaleY', totalScore / 100, 1500);
    }

    // Detailed Scores - Gated
    const cardTitle = document.querySelector('.card__title');
    const detailCard = cardTitle ? cardTitle.closest('.card') : null;
    if (!detailCard) {
        btn.textContent = originalText;
        btn.disabled = false;
        return;
    }

    // Reset previous state
    const existingOverlay = detailCard.querySelector('.premium-lock-overlay');
    if (existingOverlay) existingOverlay.remove();
    detailCard.classList.remove('blur-content');

    if (isPremium) {
        // Show Real Data
        animateValue('score-emotion', 0, emotionScore, 1500);
        animateValue('score-comm', 0, commScore, 1700);
        animateValue('score-passion', 0, passionScore, 1900);

        animateScale(document.getElementById('bar-emotion'), 'scaleX', emotionScore / 100);
        animateScale(document.getElementById('bar-comm'), 'scaleX', commScore / 100);
        animateScale(document.getElementById('bar-passion'), 'scaleX', passionScore / 100);
    } else {
        // Soft Gate - Obscure Details
        document.getElementById('score-emotion').textContent = '🔒';
        document.getElementById('score-comm').textContent = '🔒';
        document.getElementById('score-passion').textContent = '🔒';

        animateScale(document.getElementById('bar-emotion'), 'scaleX', 0);
        animateScale(document.getElementById('bar-comm'), 'scaleX', 0);
        animateScale(document.getElementById('bar-passion'), 'scaleX', 0);

        // Add Overlay
        detailCard.classList.add('premium-lock-host');

        const overlay = document.createElement('div');
        overlay.className = 'premium-lock-overlay';
        overlay.innerHTML = `
            <div class="lock-icon">🔒</div>
            <h3 class="synastry-lock-title">Detailní rozbor</h3>
            <p class="synastry-lock-copy">Emoce, komunikace a vášeň jsou dostupné pouze pro Hvězdné Průvodce.</p>
            <button class="btn btn--primary btn--sm mt-md synastry-upgrade-btn">🌟 Vyzkoušet 7 dní zdarma</button>
        `;
        detailCard.appendChild(overlay);

        overlay.querySelector('.synastry-upgrade-btn').addEventListener('click', () => {
            startSynastryUpgradeFlow('synastry_detail_lock');
        });
    }



    // Get or create AI results container
    let aiResultsDiv = document.getElementById('ai-synastry');
    if (!aiResultsDiv) {
        aiResultsDiv = createAIResultsContainer();
    }
    setBlockVisible(aiResultsDiv, false);

    if (!hasActiveSession) {
        document.getElementById('total-score').textContent = `${totalScore}%`;
        document.getElementById('verdict-text').textContent =
            `Celková kompatibilita ${totalScore}% - `;
        setBlockVisible(aiResultsDiv, true);
        renderTeaser(aiResultsDiv, totalScore);
        btn.textContent = originalText;
        btn.disabled = false;
        return;
    }

    try {
        // Call AI for detailed analysis
        btn.textContent = 'Generuji hlubokou analýzu...';

        // Call API via Auth Wrapper (Protected)
        const response = await window.Auth.fetchProtected('synastry', {
            person1,
            person2
        });
        const data = await response.json();

        if (data.success) {
            // Update verdict
            document.getElementById('verdict-text').textContent =
                `Celková kompatibilita ${totalScore}% - `;

            // Show AI interpretation
            setBlockVisible(aiResultsDiv, true);

            if (data.isTeaser) {
                // RENDER TEASER (Blurred)
                document.getElementById('total-score').textContent = `${totalScore}%`;
                renderTeaser(aiResultsDiv);
            } else {
                // RENDER FULL CONTENT
                const contentDiv = aiResultsDiv.querySelector('.ai-content');
                // Remove blur classes if they exist from previous runs
                contentDiv.classList.remove('blur-content');
                const overlay = aiResultsDiv.querySelector('.teaser-overlay');
                if (overlay) overlay.remove();

                await typewriterEffect(contentDiv, data.response);

                // Save to history if logged in
                if (window.Auth && window.Auth.saveReading && !data.isTeaser) {
                    try {
                        await window.Auth.saveReading('synastry', {
                            person1,
                            person2,
                            interpretation: data.response,
                            scores: { totalScore, emotionScore, commScore, passionScore }
                        });
                        // Add favorite button for synastry? Maybe later.
                    } catch (e) {
                        console.warn('Failed to auto-save synastry reading:', e);
                    }
                }
            }
        } else {
            throw new Error(data.error);
        }

    } catch (error) {
        console.error('Synastry Error:', error);

        // Fallback to static verdict
        let verdict = "";
        if (totalScore > 85) verdict = "Osudové spojení! Hvězdy vám přejí.";
        else if (totalScore > 70) verdict = "Velmi silný pár s harmonickými aspekty.";
        else verdict = "Vztah s potenciálem, který vyžaduje práci.";
        document.getElementById('verdict-text').textContent = verdict;

        setBlockVisible(aiResultsDiv, true);
        aiResultsDiv.querySelector('.ai-content').textContent =
            'Hlubší analýza momentálně není dostupná. Zkuste to prosím později.';
    }

    btn.textContent = originalText;
    btn.disabled = false;
}

function createAIResultsContainer() {
    const container = document.createElement('div');
    container.id = 'ai-synastry';
    container.className = 'synastry-ai';
    container.innerHTML = `
        <h4 class="synastry-ai__title">
            💕 Hluboká analýza vašeho vztahu
        </h4>
        <div class="ai-content synastry-ai__content"></div>
    `;

    // Insert after synastry-results
    const results = document.getElementById('synastry-results');
    results.appendChild(container);

    return container;
}

async function typewriterEffect(element, text) {
    element.textContent = '';
    const chars = text.split('');
    for (let i = 0; i < chars.length; i++) {
        element.textContent += chars[i];
        if (i % 100 === 0) {
            element.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        await new Promise(resolve => setTimeout(resolve, 15));
    }
}

function renderTeaser(container, totalScore = null) {
    const contentDiv = container.querySelector('.ai-content');
    const scoreLabel = typeof totalScore === 'number'
        ? `${totalScore}%`
        : (document.getElementById('total-score')?.textContent || 'vaši');

    // 1. Add Blur
    contentDiv.classList.add('blur-content');

    // 2. Set Dummy Text for visual bulk
    contentDiv.innerHTML = `
        <p>Váš vztah vykazuje silné karmické propojení, které se projevuje zejména v oblasti emocí. Hvězdy naznačují, že jste se nepotkali náhodou.</p>
        <p>Ačkoliv je vaše komunikace dynamická, existují zde aspekty, na které si musíte dát pozor. Saturn ve vašem horoskopu vytváří...</p>
        <p>Pro dlouhodobou stabilitu je klíčové pochopit...</p>
        <br><br><br>
    `;

    // 3. Add Overlay Button
    // Check if overlay already exists
    if (!container.querySelector('.teaser-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'teaser-overlay';
        overlay.innerHTML = `
            <div class="synastry-teaser-card">
                <h3 class="synastry-teaser-card__title">Odemkněte tajemství vašeho vztahu</h3>
                <p class="synastry-teaser-card__copy">Zjistěte, proč máte ${document.getElementById('total-score').textContent} shodu a co vás čeká.</p>
                <a href="cenik.html" class="btn btn--primary">Odemknout plný rozbor (199 Kč)</a>
            </div>
        `;
        container.classList.add('teaser-overlay-host');
        container.appendChild(overlay);
        const teaserCopy = overlay.querySelector('p');
        if (teaserCopy) {
            teaserCopy.textContent = `Zjistěte, proč máte ${scoreLabel} shodu a co vás čeká.`;
        }
        overlay.querySelector('a[href="cenik.html"]')?.addEventListener('click', (event) => {
            event.preventDefault();
            startSynastryUpgradeFlow('synastry_teaser_overlay');
        });
    }
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;

    const range = end - start;
    if (range === 0) {
        obj.textContent = end + "%";
        return;
    }

    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.max(1, Math.abs(Math.floor(duration / range)));

    const timer = setInterval(function () {
        current += increment;
        obj.textContent = current + "%";
        if (current === end) {
            clearInterval(timer);
        }
    }, stepTime);
}
