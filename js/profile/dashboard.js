/**
 * Profile Dashboard - Init, stats, tabs, and user display
 */

// Track if listeners are already attached to prevent duplicates
let listenersAttached = false;
let tabsInitialized = false;

// Helper: Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function initProfile() {
    // Wait for Auth to be ready with retry
    let retries = 0;
    while (!window.Auth && retries < 10) {
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
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.Auth?.openModal();
            });
            loginBtn.dataset.listenerAttached = 'true';
        }
        return;
    }

    // User is logged in
    if (loginRequired) loginRequired.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';

    // Populate user info
    if (user) {
        if (greeting) greeting.textContent = `Vítejte zpět, ${user.email.split('@')[0]}!`;
        const emailEl = document.getElementById('user-email');
        if (emailEl) emailEl.textContent = user.email;

        const planEl = document.getElementById('user-plan');
        if (planEl) planEl.textContent = formatPlan(user.subscription_status);

        const creditsEl = document.getElementById('user-credits');
        if (creditsEl) creditsEl.textContent = `${user.credits ?? '∞'} kreditů`;

        const settingsEmail = document.getElementById('settings-email');
        if (settingsEmail) settingsEmail.value = user.email;

        if (document.getElementById('settings-name')) document.getElementById('settings-name').value = user.first_name || '';

        if (document.getElementById('settings-birthdate')) {
            let val = user.birth_date || '';
            if (val && val.includes('T')) val = val.split('T')[0];
            document.getElementById('settings-birthdate').value = val;
        }

        if (document.getElementById('settings-birthtime')) {
            let val = user.birth_time || '';
            if (val && val.length > 5) val = val.substring(0, 5);
            document.getElementById('settings-birthtime').value = val;
        }

        if (document.getElementById('settings-birthplace')) document.getElementById('settings-birthplace').value = user.birth_place || '';

        if (user.subscription_status?.includes('premium')) {
            const upgradeCard = document.getElementById('upgrade-card');
            if (upgradeCard) upgradeCard.style.display = 'none';
        }
    }

    // Setup tabs (only once)
    initTabs();

    // Load reading history and stats
    const readings = await loadReadings();
    updateStats(readings);

    // Load Journal and Biorhythms
    if (user && user.birth_date) {
        initBiorhythms(user.birth_date);
    }
    loadJournal();

    // Setup event listeners ONLY ONCE
    if (!listenersAttached) {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        const saveBtn = document.getElementById('save-settings-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveSettings);
        }

        listenersAttached = true;
    }
}

function handleLogout() {
    if (confirm('Opravdu se chcete odhlásit?')) {
        window.Auth?.logout();
    }
}

function updateStats(readings) {
    if (!readings) readings = [];

    const total = readings.length;

    const now = new Date();
    const thisMonth = readings.filter(r => {
        const date = new Date(r.created_at);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    const favorites = readings.filter(r => r.is_favorite).length;
    const streak = calculateStreak(readings);

    animateCounter('stat-total', total);
    animateCounter('stat-month', thisMonth);
    animateCounter('stat-favorites', favorites);
    animateCounter('stat-streak', streak);
}

function calculateStreak(readings) {
    if (!readings.length) return 0;

    const dates = readings.map(r => new Date(r.created_at).toDateString());
    const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0;
    }

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

function formatPlan(plan) {
    const plans = {
        'free': 'Zdarma',
        'premium_monthly': 'Premium (měsíční)',
        'premium_yearly': 'Premium (roční)'
    };
    return plans[plan] || plan || 'Zdarma';
}

function initTabs() {
    if (tabsInitialized) return;

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

    tabsInitialized = true;
}

// Expose to global scope
window.escapeHtml = escapeHtml;
window.initProfile = initProfile;
