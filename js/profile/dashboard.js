/**
 * Main dashboard controller for Profile page
 */

import { escapeHtml, apiUrl, authHeaders, getZodiacSign, getZodiacIconName } from './shared.js';
import { loadReadings, showMoreReadings, handleFilterChange } from './readings.js';
import { loadFavorites } from './favorites.js';
import { toggleAvatarPicker, selectAvatar, loadSubscriptionStatus, initSettingsForm, saveSettings } from './settings.js';
import { viewReading, closeReadingModal, toggleFavoriteModal, deleteReading } from './modal.js';

const PREMIUM_ACTIVATION_KEY = 'mh_premium_activation_seen';
const PREMIUM_ACTIONS = {
    premium_monthly: [
        {
            href: '/mentor.html',
            title: 'Otevřít Hvězdného Průvodce',
            description: 'Začněte otázkou, která vás teď nejvíc táhne.'
        },
        {
            href: '/natalni-karta.html',
            title: 'Spustit natální kartu',
            description: 'Využijte jeden z nejsilnějších důvodů, proč lidé zůstávají.'
        },
        {
            href: '/horoskopy.html',
            title: 'Otevřít plné horoskopy',
            description: 'Denní, týdenní i měsíční vedení už máte odemčené.'
        }
    ],
    exclusive_monthly: [
        {
            href: '/astro-mapa.html',
            title: 'Spustit astrokartografii',
            description: 'Teď dává největší smysl vyzkoušet funkci, která se právě odemkla.'
        },
        {
            href: '/mentor.html',
            title: 'Otevřít Hvězdného Průvodce',
            description: 'Použijte prioritní odpovědi rovnou na konkrétní téma.'
        },
        {
            href: '/natalni-karta.html',
            title: 'Jít hlouběji do natální karty',
            description: 'Propojte základní vhled s pokročilým výkladem.'
        }
    ],
    vip_majestrat: [
        {
            href: '/mentor.html',
            title: 'Začít VIP konzultaci',
            description: 'Nejrychlejší cesta k první silné hodnotě po nákupu.'
        },
        {
            href: '/rocni-horoskop.html',
            title: 'Otevřít roční mapu',
            description: 'Využijte plán na dlouhodobý směr, ne jen jednorázový vhled.'
        },
        {
            href: '/profil.html#tab-settings',
            title: 'Dokončit nastavení profilu',
            description: 'Čím víc údajů doplníte, tím přesnější bude vedení.'
        }
    ]
};

function initTabs() {
    const tabs = document.querySelectorAll('.tab[data-tab], .profile-tab[data-tab]');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;

            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            contents.forEach(c => {
                c.style.display = c.id === `tab-${targetId}` ? 'block' : 'none';
            });

            if (targetId === 'favorites') {
                loadFavorites();
            }
        });
    });
}

function openProfileTab(tabId) {
    const tab = document.querySelector(`.profile-tab[data-tab="${tabId}"]`);
    tab?.click();
}

function sanitizeProfileUrl(url) {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.delete('payment');
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function handlePaymentReturnState() {
    const params = new URLSearchParams(window.location.search);
    const paymentState = params.get('payment');

    if (!paymentState) {
        return;
    }

    if (paymentState === 'success') {
        window.MH_ANALYTICS?.trackPaymentResult?.('success', {
            source: 'profile_return'
        });
        openProfileTab('settings');
        setTimeout(() => {
            document.getElementById('subscription-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
        window.Auth?.showToast?.(
            'Platba proběhla úspěšně',
            'Předplatné je aktivní. Správu svého plánu najdete níže v nastavení účtu.',
            'success'
        );
    }

    history.replaceState({}, document.title, sanitizeProfileUrl(window.location.href));
}

function getActivationStorageKey(planType) {
    return `${PREMIUM_ACTIVATION_KEY}:${planType || 'free'}`;
}

function hasSeenActivation(planType) {
    return localStorage.getItem(getActivationStorageKey(planType)) === '1';
}

function markActivationSeen(planType) {
    localStorage.setItem(getActivationStorageKey(planType), '1');
}

function renderPremiumActivation(sub, user) {
    const card = document.getElementById('premium-activation-card');
    const titleEl = document.getElementById('premium-activation-title');
    const copyEl = document.getElementById('premium-activation-copy');
    const badgeEl = document.getElementById('premium-activation-badge');
    const actionsEl = document.getElementById('premium-activation-actions');
    const dismissBtn = document.getElementById('premium-activation-dismiss');

    if (!card || !titleEl || !copyEl || !badgeEl || !actionsEl || !dismissBtn || !sub) {
        return;
    }

    const planType = sub.planType === 'vip' ? 'vip_majestrat' : (sub.planType || 'free');
    const isPremium = planType !== 'free';
    const paymentState = new URLSearchParams(window.location.search).get('payment');
    const shouldForceShow = paymentState === 'success';

    if (!isPremium) {
        card.style.display = 'none';
        return;
    }

    if (!shouldForceShow && hasSeenActivation(planType)) {
        card.style.display = 'none';
        return;
    }

    const displayName = user?.first_name || user?.email?.split('@')[0] || 'poutníku';
    const titleMap = {
        premium_monthly: `Vítejte v Hvězdném Průvodci, ${displayName}`,
        exclusive_monthly: `Odemkli jste Osvícení, ${displayName}`,
        vip_majestrat: `VIP Majestrát je aktivní, ${displayName}`
    };
    const copyMap = {
        premium_monthly: 'Největší šance na návrat je udělat teď první plný výklad. Začněte jedním z kroků níže.',
        exclusive_monthly: 'Právě jste odemkli pokročilé nástroje. Největší hodnotu teď přinese vyzkoušet funkci, kterou free plán neuměl.',
        vip_majestrat: 'Máte nejvyšší plán. Udělejte teď první krok, který z něj vytvoří každodenní oporu, ne jen aktivní členství.'
    };
    const badgeMap = {
        premium_monthly: 'Premium aktivní',
        exclusive_monthly: 'Osvícení aktivní',
        vip_majestrat: 'VIP aktivní'
    };

    titleEl.textContent = titleMap[planType] || 'Vítejte v Premium';
    copyEl.textContent = copyMap[planType] || 'Právě jste odemkli plné výklady a osobní vedení.';
    badgeEl.textContent = badgeMap[planType] || 'Premium aktivní';

    const actions = PREMIUM_ACTIONS[planType] || PREMIUM_ACTIONS.premium_monthly;
    actionsEl.innerHTML = actions.map((action) => `
        <a href="${action.href}" class="card glass-card premium-activation-action" data-activation-target="${action.href}" style="padding:1rem 1rem 1.1rem;text-decoration:none;color:inherit;border:1px solid rgba(255,255,255,0.08);">
            <strong style="display:block;color:#fff;margin-bottom:0.35rem;">${action.title}</strong>
            <span style="display:block;color:rgba(255,255,255,0.68);line-height:1.5;">${action.description}</span>
        </a>
    `).join('');

    card.style.display = 'block';
    card.dataset.planType = planType;
    card.dataset.source = paymentState === 'success' ? 'payment_return' : 'profile';

    if (!card.dataset.bound) {
        dismissBtn.addEventListener('click', () => {
            const activePlanType = card.dataset.planType || planType;
            const activeSource = card.dataset.source || 'profile';
            markActivationSeen(activePlanType);
            card.style.display = 'none';
            window.MH_ANALYTICS?.trackEvent?.('premium_activation_dismissed', {
                plan_type: activePlanType,
                source: activeSource
            });
        });

        actionsEl.addEventListener('click', (event) => {
            const link = event.target.closest('[data-activation-target]');
            if (!link) return;

            const activePlanType = card.dataset.planType || planType;
            const activeSource = card.dataset.source || 'profile';
            markActivationSeen(activePlanType);
            window.MH_ANALYTICS?.trackCTA?.('premium_activation_action', {
                destination: link.getAttribute('href'),
                plan_id: activePlanType,
                source: activeSource
            });
        });

        card.dataset.bound = 'true';
    }

    window.MH_ANALYTICS?.trackEvent?.('premium_activation_shown', {
        plan_type: planType,
        source: paymentState === 'success' ? 'payment_return' : 'profile'
    });

    if (shouldForceShow) {
        markActivationSeen(planType);
    }
}

function handleLogout() {
    if (confirm('Opravdu se chcete odhlásit?')) {
        window.Auth?.logout();
    }
}

function formatPlanLocal(plan) {
    const normalizedPlan = plan === 'vip' ? 'vip_majestrat' : plan;
    const plans = {
        free: 'Poutník',
        premium_monthly: 'Hvězdný Průvodce',
        exclusive_monthly: 'Exclusive',
        vip_majestrat: 'VIP Majestát'
    };

    return plans[plan] || 'Poutník';
}

function calculateStreak(readings) {
    if (!readings || !readings.length) return 0;

    const dates = readings.map(r => new Date(r.created_at).toDateString());
    const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0;
    }

    let streak = 0;
    let checkDate = new Date(uniqueDates[0]);

    for (const dateStr of uniqueDates) {
        if (new Date(dateStr).toDateString() === checkDate.toDateString()) {
            streak++;
            checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
            break;
        }
    }

    return streak;
}

function animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.textContent = target;
        return;
    }

    const duration = 1000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased);

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function updateStats(readings) {
    const safeReadings = readings || [];
    const total = safeReadings.length;
    const now = new Date();
    const thisMonth = safeReadings.filter(r => {
        const date = new Date(r.created_at);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    const favorites = safeReadings.filter(r => r.is_favorite).length;
    const streak = calculateStreak(safeReadings);

    animateCounter('stat-total', total);
    animateCounter('stat-month', thisMonth);
    animateCounter('stat-favorites', favorites);
    animateCounter('stat-streak', streak);
}

function getZodiacSignLocal(dateStr) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return null;

    const month = date.getMonth() + 1;
    const day = date.getDate();

    const signs = [
        { name: 'Kozoroh', symbol: '♑', start: [1, 1], end: [1, 19] },
        { name: 'Vodnář', symbol: '♒', start: [1, 20], end: [2, 18] },
        { name: 'Ryby', symbol: '♓', start: [2, 19], end: [3, 20] },
        { name: 'Beran', symbol: '♈', start: [3, 21], end: [4, 19] },
        { name: 'Býk', symbol: '♉', start: [4, 20], end: [5, 20] },
        { name: 'Blíženci', symbol: '♊', start: [5, 21], end: [6, 20] },
        { name: 'Rak', symbol: '♋', start: [6, 21], end: [7, 22] },
        { name: 'Lev', symbol: '♌', start: [7, 23], end: [8, 22] },
        { name: 'Panna', symbol: '♍', start: [8, 23], end: [9, 22] },
        { name: 'Váhy', symbol: '♎', start: [9, 23], end: [10, 22] },
        { name: 'Štír', symbol: '♏', start: [10, 23], end: [11, 21] },
        { name: 'Střelec', symbol: '♐', start: [11, 22], end: [12, 21] },
        { name: 'Kozoroh', symbol: '♑', start: [12, 22], end: [12, 31] }
    ];

    for (const sign of signs) {
        const [sm, sd] = sign.start;
        const [em, ed] = sign.end;
        if ((month === sm && day >= sd) || (month === em && day <= ed)) {
            return sign;
        }
    }

    return null;
}

function showZodiacSignLocal(birthDate) {
    const zodiacEl = document.getElementById('user-zodiac');
    if (!zodiacEl) return;

    const sign = getZodiacSignLocal(birthDate);
    if (sign) {
        zodiacEl.textContent = `${sign.symbol} ${sign.name}`;
        zodiacEl.style.display = 'block';
    }
}

function renderJournalEntries(readings) {
    const container = document.getElementById('journal-entries');
    if (!container) return;

    const entries = (readings || [])
        .filter(r => r.type === 'journal')
        .slice(0, 5);

    if (entries.length === 0) {
        container.innerHTML = '<p class="journal-empty">Zatím prázdno...</p>';
        return;
    }

    container.innerHTML = entries.map(e => `
        <div class="journal-entry">
            <span class="journal-entry__date">${new Date(e.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' })}</span>
            <p class="journal-entry__text">${escapeHtml(e.data)}</p>
        </div>
    `).join('');
}

let listenersAttached = false;

async function initProfile() {
    let retries = 0;
    while (!window.Auth && retries < 20) {
        await new Promise(r => setTimeout(r, 100));
        retries++;
    }

    const user = window.Auth?.user;
    const isLoggedIn = window.Auth?.isLoggedIn();

    const loginRequired = document.getElementById('login-required');
    const dashboard = document.getElementById('profile-dashboard');
    const greeting = document.getElementById('profile-greeting');

    if (!isLoggedIn) {
        if (loginRequired) loginRequired.style.display = 'block';
        if (dashboard) dashboard.style.display = 'none';
        if (greeting) greeting.textContent = 'Přihlaste se pro zobrazení vašeho profilu';

        const loginBtn = document.getElementById('profile-login-btn');
        if (loginBtn && !loginBtn.dataset.listenerAttached) {
            loginBtn.addEventListener('click', () => {
                window.location.href = 'prihlaseni.html?redirect=/profil.html';
            });
            loginBtn.dataset.listenerAttached = 'true';
        }
        return;
    }

    if (loginRequired) loginRequired.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';

    if (user) {
        const displayName = user.first_name || user.email.split('@')[0];
        if (greeting) greeting.textContent = `Vítejte zpět, ${displayName}! ✨`;

        const emailEl = document.getElementById('user-email');
        if (emailEl) emailEl.textContent = user.email;

        const rawPlan = user.subscription_status || user.subscriptions?.plan_type || 'free';
        const plan = rawPlan === 'vip' ? 'vip_majestrat' : rawPlan;
        const planClass = plan === 'free' ? 'badge--secondary' : 'badge--premium';
        const planLabel = formatPlanLocal(plan);

        const badgesContainer = document.getElementById('user-badges');
        if (badgesContainer) {
            badgesContainer.innerHTML = `<span id="user-plan" class="badge ${planClass}">${planLabel}</span>`;
        }

        const planEl = document.getElementById('user-plan');
        if (planEl) {
            planEl.textContent = planLabel;
            planEl.className = `badge ${planClass}`;
        }

        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl && user.avatar) {
            avatarEl.textContent = user.avatar;
        }

        if (user.birth_date) {
            const sign = getZodiacSign(user.birth_date);
            const zodiacEl = document.getElementById('user-zodiac');
            if (zodiacEl && sign) {
                zodiacEl.style.display = 'block';
                zodiacEl.innerHTML = `<i data-lucide="${getZodiacIconName(sign.symbol)}" style="width: 14px; height: 14px; margin-right: 4px; vertical-align: middle;"></i> ${sign.name}`;
            } else {
                showZodiacSignLocal(user.birth_date);
            }
        }
    }

    initTabs();
    initSettingsForm();

    const [readings, subscription] = await Promise.all([
        loadReadings(),
        loadSubscriptionStatus()
    ]);

    handlePaymentReturnState();
    renderPremiumActivation(subscription, user);
    updateStats(readings);
    renderJournalEntries(readings);

    if (!listenersAttached) {
        document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
        document.getElementById('readings-filter')?.addEventListener('change', handleFilterChange);
        document.getElementById('readings-load-more')?.addEventListener('click', showMoreReadings);

        document.getElementById('reading-modal-close')?.addEventListener('click', closeReadingModal);
        document.getElementById('modal-favorite-btn')?.addEventListener('click', toggleFavoriteModal);
        document.getElementById('modal-delete-btn')?.addEventListener('click', deleteReading);

        document.getElementById('reading-modal')?.addEventListener('click', e => {
            if (e.target.id === 'reading-modal') closeReadingModal();
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('reading-modal');
                if (modal && modal.style.display !== 'none') closeReadingModal();

                const picker = document.getElementById('avatar-picker');
                if (picker && picker.style.display !== 'none') picker.style.display = 'none';
            }
        });

        document.getElementById('save-settings-btn')?.addEventListener('click', saveSettings);
        document.getElementById('user-avatar')?.addEventListener('click', toggleAvatarPicker);
        document.getElementById('avatar-picker')?.addEventListener('click', e => {
            const option = e.target.closest('.avatar-option');
            if (option) selectAvatar(option.dataset.avatar);
        });

        const journalBtn = document.getElementById('journal-submit');
        if (journalBtn) {
            journalBtn.addEventListener('click', async () => {
                const input = document.getElementById('journal-input');
                const text = input?.value.trim();
                if (!text) return;

                journalBtn.disabled = true;
                journalBtn.innerHTML = '<span class="loading-spinner--sm"></span> Vysílám...';

                try {
                    const response = await fetch(`${apiUrl()}/user/readings`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: authHeaders(true),
                        body: JSON.stringify({ type: 'journal', data: text })
                    });

                    if (response.ok) {
                        input.value = '';
                        window.Auth?.showToast?.('Přání vysláno', 'Vaše slova se nesou ke hvězdám...', 'success');
                        if (window.createStardust) window.createStardust(journalBtn);
                        const refreshedReadings = await loadReadings();
                        updateStats(refreshedReadings);
                        renderJournalEntries(refreshedReadings);
                    } else {
                        const err = await response.json().catch(() => ({}));
                        window.Auth?.showToast?.('Chyba', err.error || 'Vesmír momentálně neodpovídá.', 'error');
                    }
                } catch (e) {
                    console.error('Journal error:', e);
                    window.Auth?.showToast?.('Chyba', 'Vesmír momentálně neodpovídá.', 'error');
                } finally {
                    journalBtn.disabled = false;
                    journalBtn.innerHTML = '✨ Vyslat přání';
                }
            });
        }

        document.addEventListener('reading:updated', e => {
            if (e.detail?.readings) {
                updateStats(e.detail.readings);
            }
        });

        listenersAttached = true;
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

window.createStardust = function(element) {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const count = 20;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'stardust-particle';

        const size = Math.random() * 4 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + Math.random() * rect.height;

        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        const tx = (Math.random() - 0.5) * 200;
        const ty = (Math.random() - 0.5) * 200 - 100;

        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.animation = `stardust-fade-out ${Math.random() * 1 + 0.5}s ease-out forwards`;

        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1500);
    }
};

window.viewReading = viewReading;
window.toggleFavorite = (id, el) => {
    import('./modal.js').then(m => m.toggleFavorite(id, el));
};

let profileInitRunning = false;

async function safeInitProfile() {
    if (profileInitRunning) return;
    profileInitRunning = true;

    try {
        await initProfile();
    } finally {
        profileInitRunning = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    safeInitProfile();
    document.addEventListener('auth:changed', () => safeInitProfile());
});
