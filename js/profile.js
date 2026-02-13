/**
 * Mystická Hvězda - Profile Page Logic
 * Handles user dashboard, reading history, settings, biorhythms, and journal
 */

// Track if listeners are already attached to prevent duplicates
let listenersAttached = false;

// Reading state
let allReadings = [];
let currentFilter = 'all';
let displayedCount = 0;
const PAGE_SIZE = 10;

document.addEventListener('DOMContentLoaded', () => {
    initProfile();
    document.addEventListener('auth:changed', () => initProfile());
});

// Helper: Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper: API base URL
function apiUrl() {
    return window.API_CONFIG?.BASE_URL || 'http://localhost:3001/api';
}

// Helper: Auth headers
function authHeaders(json = false) {
    const headers = { 'Authorization': `Bearer ${window.Auth?.token}` };
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
}

async function initProfile() {
    // Wait for Auth to be ready with retry
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
        const displayName = user.first_name || user.email.split('@')[0];
        if (greeting) greeting.textContent = `Vítejte zpět, ${displayName}! ✨`;
        const emailEl = document.getElementById('user-email');
        if (emailEl) emailEl.textContent = user.email;

        const planEl = document.getElementById('user-plan');
        if (planEl) planEl.textContent = formatPlan(user.subscription_status);

        // Show avatar
        const avatarEl = document.getElementById('user-avatar');
        if (avatarEl && user.avatar) {
            avatarEl.textContent = user.avatar;
        }

        // Show zodiac sign if birth date available
        if (user.birth_date) {
            showZodiacSign(user.birth_date);
        }

        // Populate settings form
        const settingsEmail = document.getElementById('settings-email');
        if (settingsEmail) settingsEmail.value = user.email;

        if (document.getElementById('settings-name')) {
            document.getElementById('settings-name').value = user.first_name || '';
        }

        if (document.getElementById('settings-birthdate')) {
            let val = user.birth_date || '';
            if (val && val.includes('T')) val = val.split('T')[0];
            document.getElementById('settings-birthdate').value = val;
            document.getElementById('settings-birthdate').max = new Date().toISOString().split('T')[0];
        }

        if (document.getElementById('settings-birthtime')) {
            let val = user.birth_time || '';
            if (val && val.length > 5) val = val.substring(0, 5);
            document.getElementById('settings-birthtime').value = val;
        }

        if (document.getElementById('settings-birthplace')) {
            document.getElementById('settings-birthplace').value = user.birth_place || '';
        }
    }

    // Setup tabs (only once)
    initTabs();

    // Load data in parallel for performance
    const [readings] = await Promise.all([
        loadReadings(),
        loadJournal(),
        loadSubscriptionStatus()
    ]);
    updateStats(readings);

    // Load biorhythms (depends on Chart.js, not API)
    if (user && user.birth_date) {
        initBiorhythms(user.birth_date);
    } else {
        const bioContainer = document.getElementById('biorhythm-container');
        if (bioContainer) {
            bioContainer.style.display = 'block';
            bioContainer.innerHTML = `
                <h3 class="card-title">📉 Osobní Biorytmy</h3>
                <div class="empty-state">
                    <div class="empty-state__icon">📉</div>
                    <p class="empty-state__text">Vyplňte datum narození v Nastavení pro zobrazení biorytmů.</p>
                </div>
            `;
        }
    }

    // Setup event listeners ONLY ONCE
    if (!listenersAttached) {
        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

        // Save settings
        document.getElementById('save-settings-btn')?.addEventListener('click', saveSettings);

        // Journal submit
        document.getElementById('journal-submit')?.addEventListener('click', saveJournalEntry);

        // Reading filter
        document.getElementById('readings-filter')?.addEventListener('change', handleFilterChange);

        // Load more pagination
        document.getElementById('readings-load-more')?.addEventListener('click', showMoreReadings);

        // Modal buttons
        document.getElementById('reading-modal-close')?.addEventListener('click', closeReadingModal);
        document.getElementById('modal-favorite-btn')?.addEventListener('click', toggleFavoriteModal);
        document.getElementById('modal-delete-btn')?.addEventListener('click', deleteReading);

        // Close modal on backdrop click
        document.getElementById('reading-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'reading-modal') closeReadingModal();
        });

        // Close modal on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('reading-modal');
                if (modal && modal.style.display !== 'none') {
                    closeReadingModal();
                }
                // Also close avatar picker
                const picker = document.getElementById('avatar-picker');
                if (picker && picker.style.display !== 'none') {
                    picker.style.display = 'none';
                }
            }
        });

        // Avatar picker toggle
        document.getElementById('user-avatar')?.addEventListener('click', toggleAvatarPicker);

        // Avatar option clicks (event delegation)
        document.getElementById('avatar-picker')?.addEventListener('click', (e) => {
            const option = e.target.closest('.avatar-option');
            if (option) {
                selectAvatar(option.dataset.avatar);
            }
        });

        listenersAttached = true;
    }
}

// ==========================================
// ZODIAC SIGN
// ==========================================
function getZodiacSign(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

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

function showZodiacSign(birthDate) {
    const zodiacEl = document.getElementById('user-zodiac');
    if (!zodiacEl) return;

    const sign = getZodiacSign(birthDate);
    if (sign) {
        zodiacEl.textContent = `${sign.symbol} ${sign.name}`;
        zodiacEl.style.display = 'block';
    }
}

// ==========================================
// NAMED HANDLERS
// ==========================================
function handleLogout() {
    if (confirm('Opravdu se chcete odhlásit?')) {
        window.Auth?.logout();
    }
}

// ==========================================
// STATS
// ==========================================
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

    // Respect prefers-reduced-motion
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

function formatPlan(plan) {
    const plans = {
        'free': '🆓 Zdarma',
        'premium_monthly': '⭐ Premium (měsíční)',
        'premium_yearly': '💎 Premium (roční)'
    };
    return plans[plan] || plan || 'Zdarma';
}

// ==========================================
// TABS
// ==========================================
let tabsInitialized = false;

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

// ==========================================
// READINGS - LOAD, FILTER, PAGINATE
// ==========================================
async function loadReadings() {
    const container = document.getElementById('readings-list');

    try {
        const response = await fetch(`${apiUrl()}/user/readings`, {
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Failed to load readings');

        const data = await response.json();
        allReadings = data.readings || [];
        displayedCount = 0;

        renderReadings();
        return allReadings;

    } catch (error) {
        console.error('Error loading readings:', error);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">⚠️</div>
                    <p class="empty-state__text">Nepodařilo se načíst historii.</p>
                    <button class="btn btn--glass btn--sm" onclick="location.reload()">Zkusit znovu</button>
                </div>
            `;
        }
        return [];
    }
}

function handleFilterChange(e) {
    currentFilter = e.target.value;
    displayedCount = 0;
    renderReadings();
}

function getFilteredReadings() {
    if (currentFilter === 'all') return allReadings;
    return allReadings.filter(r => r.type === currentFilter);
}

function renderReadings() {
    const container = document.getElementById('readings-list');
    if (!container) return;

    const filtered = getFilteredReadings();

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">🔮</div>
                <h4 class="empty-state__title">${currentFilter === 'all' ? 'Zatím nemáte žádné výklady' : 'Žádné výklady tohoto typu'}</h4>
                <p class="empty-state__text">${currentFilter === 'all' ? 'Vydejte se na cestu za poznáním hvězd!' : 'Zkuste jiný typ výkladu.'}</p>
                ${currentFilter === 'all' ? `
                    <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem;">
                        <a href="tarot.html" class="btn btn--primary btn--sm">🃏 Tarot</a>
                        <a href="kristalova-koule.html" class="btn btn--glass btn--sm">🔮 Křišťálová koule</a>
                        <a href="horoskopy.html" class="btn btn--glass btn--sm">⭐ Horoskop</a>
                    </div>
                ` : ''}
            </div>
        `;
        updatePagination(0, 0);
        return;
    }

    // Show paginated results
    const toShow = filtered.slice(0, displayedCount + PAGE_SIZE);
    displayedCount = toShow.length;

    container.innerHTML = toShow.map(reading => `
        <div class="reading-item card" onclick="viewReading('${escapeHtml(reading.id)}')">
            <div class="reading-item__inner">
                <div class="reading-item__left">
                    <span class="reading-item__icon" aria-hidden="true">${getReadingIcon(reading.type)}</span>
                    <div>
                        <strong>${escapeHtml(getReadingTitle(reading.type))}</strong>
                        <p class="reading-item__date">
                            ${new Date(reading.created_at).toLocaleDateString('cs-CZ', {
                                day: 'numeric', month: 'long', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
                <div class="reading-item__actions">
                    <button class="btn btn--sm btn--glass" onclick="event.stopPropagation(); toggleFavorite('${escapeHtml(reading.id)}', this)"
                        title="${reading.is_favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}"
                        aria-label="${reading.is_favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených'}">
                        ${reading.is_favorite ? '⭐' : '☆'}
                    </button>
                    <button class="btn btn--sm btn--glass" onclick="event.stopPropagation(); viewReading('${escapeHtml(reading.id)}')" aria-label="Zobrazit detail">Zobrazit</button>
                </div>
            </div>
        </div>
    `).join('');

    updatePagination(displayedCount, filtered.length);
}

function showMoreReadings() {
    renderReadings();
}

function updatePagination(shown, total) {
    const paginationEl = document.getElementById('readings-pagination');
    if (!paginationEl) return;

    if (shown < total) {
        paginationEl.style.display = 'block';
        const btn = document.getElementById('readings-load-more');
        if (btn) btn.textContent = `Načíst další (${total - shown} zbývá)`;
    } else {
        paginationEl.style.display = 'none';
    }
}

// ==========================================
// FAVORITES
// ==========================================
async function loadFavorites() {
    const container = document.getElementById('favorites-list');
    if (!container) return;

    container.innerHTML = '<p style="text-align: center; opacity: 0.6;">Načítání...</p>';

    try {
        const response = await fetch(`${apiUrl()}/user/readings`, {
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Failed to load readings');

        const data = await response.json();
        const favorites = (data.readings || []).filter(r => r.is_favorite);

        if (favorites.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">⭐</div>
                    <h4 class="empty-state__title">Žádné oblíbené výklady</h4>
                    <p class="empty-state__text">Klikněte na ☆ u výkladu pro přidání do oblíbených</p>
                </div>
            `;
            return;
        }

        container.innerHTML = favorites.map(reading => `
            <div class="reading-item card" onclick="viewReading('${escapeHtml(reading.id)}')">
                <div class="reading-item__inner">
                    <div class="reading-item__left">
                        <span class="reading-item__icon" aria-hidden="true">${getReadingIcon(reading.type)}</span>
                        <div>
                            <strong>${escapeHtml(getReadingTitle(reading.type))}</strong>
                            <p class="reading-item__date">
                                ${new Date(reading.created_at).toLocaleDateString('cs-CZ', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                    <div class="reading-item__actions">
                        <button class="btn btn--sm btn--glass" onclick="event.stopPropagation(); toggleFavorite('${escapeHtml(reading.id)}', this)" title="Odebrat z oblíbených" aria-label="Odebrat z oblíbených">⭐</button>
                        <button class="btn btn--sm btn--glass" onclick="event.stopPropagation(); viewReading('${escapeHtml(reading.id)}')" aria-label="Zobrazit detail">Zobrazit</button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading favorites:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">⚠️</div>
                <p class="empty-state__text">Nepodařilo se načíst oblíbené.</p>
            </div>
        `;
    }
}

// ==========================================
// READING TYPES
// ==========================================
function getReadingIcon(type) {
    const icons = {
        'tarot': '🃏', 'horoscope': '♈', 'natal': '🌌', 'natal-chart': '🌌',
        'numerology': '🔢', 'synastry': '💕', 'crystal': '🔮', 'journal': '📖'
    };
    return icons[type] || '✨';
}

function getReadingTitle(type) {
    const titles = {
        'tarot': 'Tarotový výklad', 'horoscope': 'Horoskop', 'natal': 'Natální karta',
        'natal-chart': 'Natální karta', 'numerology': 'Numerologie',
        'synastry': 'Partnerská shoda', 'crystal': 'Křišťálová koule', 'journal': 'Manifestační deník'
    };
    return titles[type] || 'Výklad';
}

// ==========================================
// READING MODAL
// ==========================================
let currentReadingId = null;
let currentReadingIsFavorite = false;

async function viewReading(id) {
    const modal = document.getElementById('reading-modal');
    const content = document.getElementById('reading-modal-content');
    if (!modal || !content) return;

    currentReadingId = id;
    modal.style.display = 'flex';
    content.innerHTML = '<p style="text-align: center; opacity: 0.6;">Načítání...</p>';

    // Trap focus inside modal
    trapFocus(modal);

    try {
        const response = await fetch(`${apiUrl()}/user/readings/${id}`, {
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Failed to fetch reading');

        const data = await response.json();
        const reading = data.reading;

        currentReadingIsFavorite = reading.is_favorite;
        updateFavoriteButton();

        content.innerHTML = renderReadingContent(reading);

    } catch (error) {
        console.error('Error loading reading:', error);
        content.innerHTML = `<p style="color: #e74c3c;">Nepodařilo se načíst výklad.</p>`;
    }
}

function renderReadingContent(reading) {
    const date = new Date(reading.created_at).toLocaleDateString('cs-CZ', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let contentHtml = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <span style="font-size: 3rem;" aria-hidden="true">${getReadingIcon(reading.type)}</span>
            <h2 style="margin: 0.5rem 0;">${escapeHtml(getReadingTitle(reading.type))}</h2>
            <p style="opacity: 0.6; font-size: 0.9rem;">${date}</p>
        </div>
        <div class="reading-content" style="background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 10px; max-height: 400px; overflow-y: auto;">
    `;

    const data = reading.data || {};

    function getTarotImageByName(name) {
        if (!name) return 'img/tarot/tarot_placeholder.webp';
        const normalized = name.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/ /g, '_');
        return `img/tarot/tarot_${normalized}.webp`;
    }

    if (reading.type === 'tarot' && data.cards) {
        contentHtml += `<div style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; margin-bottom: 1.5rem;">`;
        data.cards.forEach(card => {
            const imagePath = getTarotImageByName(card.name);
            contentHtml += `
                <div style="text-align: center; width: 100px; display: flex; flex-direction: column; align-items: center;">
                    <div style="position: relative; width: 80px; height: 120px; margin-bottom: 0.5rem;">
                         <img src="${escapeHtml(imagePath)}"
                              alt="${escapeHtml(card.name)}"
                              loading="lazy"
                              onerror="this.onerror=null;this.src='img/tarot/tarot_placeholder.webp';"
                              style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                    </div>
                    <p style="font-size: 0.75rem; margin: 0; font-weight: 600; color: var(--color-mystic-gold); line-height: 1.2;">${escapeHtml(card.name)}</p>
                    ${card.position ? `<small style="font-size: 0.65rem; opacity: 0.7;">${escapeHtml(card.position)}</small>` : ''}
                </div>
            `;
        });
        contentHtml += `</div>`;

        const summary = data.response || data.interpretation;
        if (summary) {
            contentHtml += `
                <div style="background: rgba(255,255,255,0.05); padding: 1.25rem; border-radius: 8px; border-left: 3px solid var(--color-mystic-gold);">
                    <h4 style="color: var(--color-mystic-gold); margin-bottom: 0.75rem; font-size: 1rem;">VÝKLAD KARET</h4>
                    <div style="line-height: 1.8; font-size: 1rem; color: var(--color-silver-mist);">
                        ${summary.replace(/\n/g, '<br>')}
                    </div>
                </div>
            `;
        }
    } else if (reading.type === 'horoscope' && (data.text || data.prediction)) {
        const text = data.text || data.prediction;
        const periodMap = { 'daily': 'Denní horoskop', 'weekly': 'Týdenní horoskop', 'monthly': 'Měsíční horoskop' };
        const periodLabel = periodMap[data.period] || data.period || 'Horoskop';

        contentHtml += `
            <div style="text-align: center; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <h3 style="color: var(--color-mystic-gold); font-size: 1.5rem; margin-bottom: 0.2rem;">${escapeHtml(data.sign || 'Znamení')}</h3>
                <span style="text-transform: uppercase; letter-spacing: 2px; font-size: 0.75rem; opacity: 0.7;">${escapeHtml(periodLabel)}</span>
            </div>
            <div style="font-size: 1.05rem; line-height: 1.8; color: var(--color-starlight); margin-bottom: 1.5rem;">
                ${escapeHtml(text)}
            </div>
        `;

        if (data.luckyNumbers) {
            contentHtml += `
                <div style="background: rgba(212, 175, 55, 0.1); padding: 0.75rem; border-radius: 8px; text-align: center;">
                    <span style="display: block; font-size: 0.8rem; text-transform: uppercase; color: var(--color-mystic-gold); margin-bottom: 0.25rem;">Šťastná čísla</span>
                    <span style="font-family: var(--font-heading); font-size: 1.2rem; letter-spacing: 1px;">${escapeHtml(data.luckyNumbers.toString())}</span>
                </div>
            `;
        }
    } else if (data.answer) {
        if (data.question) {
            contentHtml += `
                <div style="margin-bottom: 1.5rem; padding: 1rem; border-left: 3px solid var(--color-mystic-gold); background: rgba(255,255,255,0.03);">
                    <small style="text-transform: uppercase; color: var(--color-mystic-gold); font-size: 0.7rem; display: block; margin-bottom: 0.3rem;">Otázka</small>
                    <p style="font-style: italic; opacity: 0.9; margin: 0; font-family: var(--font-heading); font-size: 1.1rem;">"${escapeHtml(data.question)}"</p>
                </div>
            `;
        }
        contentHtml += `
            <div style="font-size: 1.05rem; line-height: 1.8; color: var(--color-starlight);">
                ${escapeHtml(data.answer)}
            </div>
        `;
    } else if (data.interpretation || data.text || data.result) {
        let content = data.interpretation || data.text || data.result;

        if (typeof content === 'string' && /<[a-z][\s\S]*>/i.test(content)) {
            content = content.replace(/<\/?(?:html|head|body|script|iframe|object|embed|form|input|link|meta|style)[^>]*>/gi, '');
            content = content.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
            contentHtml += `<div class="formatted-content" style="line-height: 1.7; color: var(--color-starlight);">${content}</div>`;
        } else {
            contentHtml += `<p style="line-height: 1.7;">${escapeHtml(content)}</p>`;
        }
    } else {
        contentHtml += `<pre style="white-space: pre-wrap; font-size: 0.85rem;">${escapeHtml(JSON.stringify(data, null, 2))}</pre>`;
    }

    contentHtml += `</div>`;
    return contentHtml;
}

function closeReadingModal() {
    const modal = document.getElementById('reading-modal');
    if (modal) modal.style.display = 'none';
    currentReadingId = null;
    releaseFocus();
}

function updateFavoriteButton() {
    const btn = document.getElementById('modal-favorite-btn');
    if (btn) {
        btn.textContent = currentReadingIsFavorite ? '⭐ V oblíbených' : '☆ Přidat do oblíbených';
        btn.setAttribute('aria-label', currentReadingIsFavorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených');
    }
}

async function toggleFavoriteModal() {
    if (!currentReadingId) return;
    await toggleFavorite(currentReadingId);
    currentReadingIsFavorite = !currentReadingIsFavorite;
    updateFavoriteButton();
}

async function toggleFavorite(id, buttonEl = null) {
    try {
        const response = await fetch(`${apiUrl()}/user/readings/${id}/favorite`, {
            method: 'PATCH',
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Failed to toggle favorite');

        const data = await response.json();

        if (buttonEl) {
            buttonEl.textContent = data.is_favorite ? '⭐' : '☆';
            buttonEl.title = data.is_favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených';
            buttonEl.setAttribute('aria-label', data.is_favorite ? 'Odebrat z oblíbených' : 'Přidat do oblíbených');
        }

        // Update local data and re-render
        const reading = allReadings.find(r => r.id === id);
        if (reading) reading.is_favorite = data.is_favorite;
        updateStats(allReadings);

        // Refresh favorites tab if visible
        const favoritesTab = document.getElementById('tab-favorites');
        if (favoritesTab && favoritesTab.style.display !== 'none') {
            loadFavorites();
        }

    } catch (error) {
        console.error('Error toggling favorite:', error);
        window.Auth?.showToast?.('Chyba', 'Nepodařilo se změnit oblíbené.', 'error');
    }
}

async function deleteReading() {
    if (!currentReadingId) return;

    if (!confirm('Opravdu chcete smazat tento výklad? Tuto akci nelze vrátit.')) {
        return;
    }

    try {
        const response = await fetch(`${apiUrl()}/user/readings/${currentReadingId}`, {
            method: 'DELETE',
            headers: authHeaders()
        });

        if (!response.ok) throw new Error('Failed to delete reading');

        closeReadingModal();
        window.Auth?.showToast?.('Smazáno', 'Výklad byl úspěšně smazán.', 'success');

        // Remove from local data and re-render without re-fetching
        allReadings = allReadings.filter(r => r.id !== currentReadingId);
        displayedCount = Math.max(0, displayedCount - 1);
        renderReadings();
        updateStats(allReadings);

    } catch (error) {
        console.error('Error deleting reading:', error);
        window.Auth?.showToast?.('Chyba', 'Nepodařilo se smazat výklad.', 'error');
    }
}

// ==========================================
// FOCUS TRAP (Accessibility)
// ==========================================
let previousFocus = null;

function trapFocus(modal) {
    previousFocus = document.activeElement;
    const closeBtn = modal.querySelector('.modal__close');
    if (closeBtn) closeBtn.focus();
}

function releaseFocus() {
    if (previousFocus) {
        previousFocus.focus();
        previousFocus = null;
    }
}

// ==========================================
// AVATAR PICKER
// ==========================================
function toggleAvatarPicker() {
    const picker = document.getElementById('avatar-picker');
    if (!picker) return;
    const isHidden = picker.style.display === 'none' || !picker.style.display;
    picker.style.display = isHidden ? 'block' : 'none';

    // Highlight current avatar
    if (isHidden) {
        const currentAvatar = document.getElementById('user-avatar')?.textContent?.trim();
        picker.querySelectorAll('.avatar-option').forEach(opt => {
            opt.classList.toggle('avatar-option--active', opt.dataset.avatar === currentAvatar);
        });
    }
}

async function selectAvatar(emoji) {
    const avatarEl = document.getElementById('user-avatar');
    const picker = document.getElementById('avatar-picker');

    // Optimistic UI update
    if (avatarEl) avatarEl.textContent = emoji;
    if (picker) picker.style.display = 'none';

    // Highlight selected
    picker?.querySelectorAll('.avatar-option').forEach(opt => {
        opt.classList.toggle('avatar-option--active', opt.dataset.avatar === emoji);
    });

    try {
        const res = await fetch(`${apiUrl()}/auth/profile`, {
            method: 'PUT',
            headers: authHeaders(true),
            body: JSON.stringify({ avatar: emoji })
        });

        if (res.ok) {
            // Update local storage
            let currentUser = {};
            try { currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}'); } catch (e) { /* */ }
            currentUser.avatar = emoji;
            localStorage.setItem('auth_user', JSON.stringify(currentUser));
            if (window.Auth) window.Auth.user = currentUser;
            window.Auth?.showToast?.('Avatar změněn', `Váš nový avatar: ${emoji}`, 'success');
        } else {
            throw new Error('Failed to save avatar');
        }
    } catch (e) {
        console.error('Error saving avatar:', e);
        window.Auth?.showToast?.('Chyba', 'Nepodařilo se uložit avatar.', 'error');
    }
}

// ==========================================
// SUBSCRIPTION MANAGEMENT
// ==========================================
async function loadSubscriptionStatus() {
    const container = document.getElementById('subscription-details');
    if (!container) return;

    try {
        const res = await fetch(`${apiUrl()}/payment/subscription/status`, {
            headers: authHeaders()
        });

        if (!res.ok) throw new Error('Failed to load subscription');

        const data = await res.json();
        renderSubscriptionCard(data);

    } catch (e) {
        console.error('Subscription status error:', e);
        container.innerHTML = `
            <div class="subscription-info">
                <div class="subscription-plan">
                    <span class="subscription-plan__name">🆓 Poutník (Zdarma)</span>
                </div>
                <div class="subscription-actions">
                    <a href="cenik.html" class="btn btn--gold btn--sm">🚀 Upgradovat</a>
                </div>
            </div>
        `;
    }
}

function renderSubscriptionCard(sub) {
    const container = document.getElementById('subscription-details');
    if (!container) return;

    const planNames = {
        'free': '🆓 Poutník (Zdarma)',
        'premium_monthly': '⭐ Hvězdný Průvodce (Měsíční)',
        'premium_yearly': '💎 Osvícení (Roční)',
        'premium_pro': '🚀 Premium Pro',
        'exclusive_monthly': '✨ Exclusive',
        'vip': '👑 VIP Privátní'
    };

    const statusLabels = {
        'active': { text: 'Aktivní', class: 'badge--success' },
        'trialing': { text: 'Zkušební období', class: 'badge--info' },
        'cancel_pending': { text: 'Zrušeno (aktivní do konce období)', class: 'badge--warning' },
        'past_due': { text: 'Platba selhala', class: 'badge--danger' },
        'cancelled': { text: 'Zrušeno', class: 'badge--danger' }
    };

    const planName = planNames[sub.planType] || sub.planType || 'Zdarma';
    const statusInfo = statusLabels[sub.status] || { text: sub.status, class: '' };
    const isPremium = sub.planType !== 'free';
    const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
    const periodEndStr = periodEnd ? periodEnd.toLocaleDateString('cs-CZ', {
        day: 'numeric', month: 'long', year: 'numeric'
    }) : null;

    let html = `<div class="subscription-info">`;

    // Plan name and status
    html += `
        <div class="subscription-plan">
            <span class="subscription-plan__name">${planName}</span>
            <span class="badge ${statusInfo.class}">${statusInfo.text}</span>
        </div>
    `;

    // Period end
    if (isPremium && periodEndStr) {
        const label = sub.status === 'cancel_pending'
            ? 'Přístup končí'
            : 'Další platba';
        html += `<p class="subscription-period">${label}: <strong>${periodEndStr}</strong></p>`;
    }

    // Actions
    html += `<div class="subscription-actions">`;

    if (!isPremium) {
        html += `<a href="cenik.html" class="btn btn--gold btn--sm">🚀 Upgradovat na Premium</a>`;
    } else {
        if (sub.canCancel && sub.status !== 'cancel_pending') {
            html += `<button id="sub-cancel-btn" class="btn btn--sm btn--glass">Zrušit předplatné</button>`;
        }
        if (sub.status === 'cancel_pending') {
            html += `<button id="sub-reactivate-btn" class="btn btn--sm btn--primary">Obnovit předplatné</button>`;
        }
        html += `<button id="sub-portal-btn" class="btn btn--sm btn--glass">Správa plateb</button>`;
    }

    html += `</div></div>`;

    container.innerHTML = html;

    // Bind subscription action buttons
    document.getElementById('sub-cancel-btn')?.addEventListener('click', cancelSubscription);
    document.getElementById('sub-reactivate-btn')?.addEventListener('click', reactivateSubscription);
    document.getElementById('sub-portal-btn')?.addEventListener('click', openStripePortal);
}

async function cancelSubscription() {
    if (!confirm('Opravdu chcete zrušit předplatné? Přístup budete mít do konce aktuálního období.')) {
        return;
    }

    const btn = document.getElementById('sub-cancel-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Ruším...'; }

    try {
        const res = await fetch(`${apiUrl()}/payment/cancel`, {
            method: 'POST',
            headers: authHeaders(true)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Cancel failed');

        window.Auth?.showToast?.('Zrušeno', data.message || 'Předplatné bude zrušeno na konci období.', 'success');
        await loadSubscriptionStatus();

    } catch (e) {
        console.error('Cancel error:', e);
        window.Auth?.showToast?.('Chyba', e.message || 'Nepodařilo se zrušit předplatné.', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Zrušit předplatné'; }
    }
}

async function reactivateSubscription() {
    const btn = document.getElementById('sub-reactivate-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Obnovuji...'; }

    try {
        const res = await fetch(`${apiUrl()}/payment/reactivate`, {
            method: 'POST',
            headers: authHeaders(true)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Reactivate failed');

        window.Auth?.showToast?.('Obnoveno', data.message || 'Předplatné bylo obnoveno.', 'success');
        await loadSubscriptionStatus();

    } catch (e) {
        console.error('Reactivate error:', e);
        window.Auth?.showToast?.('Chyba', e.message || 'Nepodařilo se obnovit předplatné.', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Obnovit předplatné'; }
    }
}

async function openStripePortal() {
    const btn = document.getElementById('sub-portal-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Otevírám...'; }

    try {
        const res = await fetch(`${apiUrl()}/payment/portal`, {
            method: 'POST',
            headers: authHeaders(true)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Portal failed');

        if (data.url) {
            window.location.href = data.url;
        }

    } catch (e) {
        console.error('Portal error:', e);
        window.Auth?.showToast?.('Chyba', e.message || 'Nepodařilo se otevřít správu plateb.', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Správa plateb'; }
    }
}

// ==========================================
// SETTINGS
// ==========================================
async function saveSettings() {
    const saveBtn = document.getElementById('save-settings-btn');
    const newPassword = document.getElementById('settings-password').value;
    const currentPassword = document.getElementById('settings-current-password')?.value || '';

    // Add loading state
    if (saveBtn) {
        saveBtn.classList.add('btn--loading');
        saveBtn.disabled = true;
    }

    // Validate password change
    if (newPassword) {
        if (!currentPassword) {
            window.Auth?.showToast?.('Chyba', 'Pro změnu hesla vyplňte aktuální heslo.', 'error');
            if (saveBtn) { saveBtn.classList.remove('btn--loading'); saveBtn.disabled = false; }
            return;
        }
        if (newPassword.length < 8) {
            window.Auth?.showToast?.('Chyba', 'Nové heslo musí mít alespoň 8 znaků.', 'error');
            if (saveBtn) { saveBtn.classList.remove('btn--loading'); saveBtn.disabled = false; }
            return;
        }

        try {
            const res = await fetch(`${apiUrl()}/user/password`, {
                method: 'PUT',
                headers: authHeaders(true),
                body: JSON.stringify({ currentPassword, password: newPassword })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Password update failed');
            }
            // Clear password fields on success
            document.getElementById('settings-password').value = '';
            document.getElementById('settings-current-password').value = '';
        } catch (e) {
            console.error(e);
            window.Auth?.showToast?.('Chyba hesla', e.message || 'Heslo se nepodařilo změnit.', 'error');
            if (saveBtn) { saveBtn.classList.remove('btn--loading'); saveBtn.disabled = false; }
            return;
        }
    }

    const data = {
        first_name: document.getElementById('settings-name').value,
        birth_date: document.getElementById('settings-birthdate').value,
        birth_time: document.getElementById('settings-birthtime').value,
        birth_place: document.getElementById('settings-birthplace').value
    };

    try {
        const res = await fetch(`${apiUrl()}/auth/profile`, {
            method: 'PUT',
            headers: authHeaders(true),
            body: JSON.stringify(data)
        });

        if (res.ok) {
            const updatedUser = await res.json();
            // Update local storage and in-memory state (no page reload needed)
            let currentUser = {};
            try { currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}'); } catch (e) { /* corrupted */ }
            const newUser = { ...currentUser, ...updatedUser.user };
            localStorage.setItem('auth_user', JSON.stringify(newUser));
            if (window.Auth) window.Auth.user = newUser;

            window.Auth?.showToast?.('Uloženo', 'Profil byl úspěšně aktualizován.', 'success');

            // Update greeting with new name
            const greeting = document.getElementById('profile-greeting');
            if (greeting) {
                const displayName = newUser.first_name || newUser.email.split('@')[0];
                greeting.textContent = `Vítejte zpět, ${displayName}! ✨`;
            }

            // Update zodiac sign
            if (data.birth_date) {
                showZodiacSign(data.birth_date);
                initBiorhythms(data.birth_date);
            }
        } else {
            throw new Error('Update failed');
        }
    } catch (e) {
        console.error(e);
        window.Auth?.showToast?.('Chyba', 'Nepodařilo se uložit nastavení.', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.classList.remove('btn--loading');
            saveBtn.disabled = false;
        }
    }
}

// ==========================================
// BIORHYTHMS LOGIC
// ==========================================
function initBiorhythms(birthDate) {
    const container = document.getElementById('biorhythm-container');
    if (!container || !birthDate) {
        if (container) container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    // Wait for Chart.js to be available before proceeding
    if (typeof Chart === 'undefined') {
        if (!window._bioRetries) window._bioRetries = 0;
        if (window._bioRetries < 10) {
            window._bioRetries++;
            setTimeout(() => initBiorhythms(birthDate), 300);
            return;
        }
        container.innerHTML = `
            <h3 class="card-title">📉 Osobní Biorytmy</h3>
            <div class="empty-state">
                <div class="empty-state__icon">⚠️</div>
                <p class="empty-state__text">Nepodařilo se načíst knihovnu grafu. Zkuste obnovit stránku.</p>
            </div>
        `;
        return;
    }
    window._bioRetries = 0;

    try {
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) throw new Error('INVALID_DATE');

        const today = new Date();
        const daysSinceBirth = Math.floor((today - birth) / (1000 * 60 * 60 * 24));
        if (daysSinceBirth < 0) throw new Error('FUTURE_DATE');

        const labels = [];
        const physical = [];
        const emotional = [];
        const intellectual = [];

        for (let i = -15; i <= 15; i++) {
            const days = daysSinceBirth + i;
            if (i === 0) {
                labels.push('Dnes');
            } else {
                const date = new Date(today);
                date.setDate(date.getDate() + i);
                labels.push(`${date.getDate()}.${date.getMonth() + 1}.`);
            }

            physical.push(Math.sin(2 * Math.PI * days / 23) * 100);
            emotional.push(Math.sin(2 * Math.PI * days / 28) * 100);
            intellectual.push(Math.sin(2 * Math.PI * days / 33) * 100);
        }

        // Ensure canvas exists
        let canvas = document.getElementById('bio-canvas');
        if (!canvas) {
            container.innerHTML = `
                <h3 class="card-title">📉 Osobní Biorytmy</h3>
                <div class="biorhythm-chart"><canvas id="bio-canvas"></canvas></div>
                <div id="bio-summary"></div>
            `;
            canvas = document.getElementById('bio-canvas');
        }

        const ctx = canvas.getContext('2d');

        if (window.biorhythmChart) {
            window.biorhythmChart.destroy();
            window.biorhythmChart = null;
        }

        window.biorhythmChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: '💪 Fyzický',
                        data: physical,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2, tension: 0.4, fill: false
                    },
                    {
                        label: '❤️ Emocionální',
                        data: emotional,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2, tension: 0.4, fill: false
                    },
                    {
                        label: '🧠 Intelektuální',
                        data: intellectual,
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 2, tension: 0.4, fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600 },
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#fff', font: { size: 11 }, usePointStyle: true }
                    },
                    tooltip: {
                        mode: 'index', intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#d4af37', bodyColor: '#fff',
                        borderColor: 'rgba(212, 175, 55, 0.3)', borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        min: -100, max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            font: { size: 10 },
                            callback: (value) => value === 0 ? '0' : value === 100 ? '+100' : value === -100 ? '-100' : ''
                        }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                        ticks: { color: 'rgba(255, 255, 255, 0.6)', font: { size: 9 }, maxRotation: 45, minRotation: 0 }
                    }
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });

        // Summary
        const summaryDiv = document.getElementById('bio-summary');
        if (summaryDiv) {
            const todayPhysical = physical[15];
            const todayEmotional = emotional[15];
            const todayIntellectual = intellectual[15];

            const getLevel = (value) => {
                if (value > 50) return '🔥 Vysoká';
                if (value > 0) return '✅ Dobrá';
                if (value > -50) return '⚠️ Nízká';
                return '❌ Kritická';
            };

            summaryDiv.innerHTML = `
                <div class="bio-summary-card">
                    <p class="bio-summary-label"><strong>Dnes:</strong></p>
                    <p>💪 Fyzicky: ${getLevel(todayPhysical)}</p>
                    <p>❤️ Emoce: ${getLevel(todayEmotional)}</p>
                    <p>🧠 Intelekt: ${getLevel(todayIntellectual)}</p>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error initializing biorhythms:', error);

        let errorMessage;
        if (error.message === 'INVALID_DATE') {
            errorMessage = 'Neplatné datum narození. Zkontrolujte nastavení.';
        } else if (error.message === 'FUTURE_DATE') {
            errorMessage = 'Datum narození nemůže být v budoucnosti.';
        } else {
            errorMessage = 'Nepodařilo se načíst biorytmy. Zkuste obnovit stránku.';
        }

        container.innerHTML = `
            <h3 class="card-title">📉 Osobní Biorytmy</h3>
            <div class="empty-state">
                <div class="empty-state__icon">⚠️</div>
                <p class="empty-state__text">${errorMessage}</p>
            </div>
        `;
    }
}

// ==========================================
// MANIFESTATION JOURNAL
// ==========================================
async function loadJournal() {
    const list = document.getElementById('journal-entries');
    if (!list) return;

    try {
        const response = await fetch(`${apiUrl()}/user/readings`, {
            headers: authHeaders()
        });
        const data = await response.json();
        const entries = (data.readings || []).filter(r => r.type === 'journal');

        if (entries.length === 0) {
            list.innerHTML = `<p class="journal-empty">Zatím žádné záznamy. Napište své první přání...</p>`;
            return;
        }

        list.innerHTML = entries.map(e => {
            const text = e.data?.text || '';
            return `
                <div class="journal-entry">
                    <p class="journal-entry__date">${new Date(e.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <p class="journal-entry__text">"${escapeHtml(text)}"</p>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error('Journal load error', e);
    }
}

async function saveJournalEntry() {
    const input = document.getElementById('journal-input');
    if (!input || !input.value.trim()) return;

    const text = input.value.trim();
    const btn = document.getElementById('journal-submit');

    if (btn) {
        btn.innerHTML = '✨ Odesílání...';
        btn.disabled = true;
    }

    input.style.transition = 'all 0.5s';
    input.style.transform = 'scale(0.98)';
    input.style.opacity = '0.5';

    try {
        const savedEntry = await window.Auth.saveReading('journal', { text });
        if (!savedEntry) throw new Error('Failed to save');

        window.Auth?.showToast?.('Odesláno', 'Vaše přání bylo vysláno do Vesmíru ✨', 'success');

        // Optimistic UI update
        const list = document.getElementById('journal-entries');
        if (list) {
            const emptyState = list.querySelector('.journal-empty');
            if (emptyState) list.innerHTML = '';

            const newEntryHtml = `
                <div class="journal-entry journal-entry--new">
                    <p class="journal-entry__date">${new Date().toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <p class="journal-entry__text">"${escapeHtml(text)}"</p>
                </div>
            `;
            list.insertAdjacentHTML('afterbegin', newEntryHtml);
        }

        input.value = '';
        input.style.transform = 'scale(1)';
        input.style.opacity = '1';

        setTimeout(loadJournal, 1500);

    } catch (e) {
        console.error(e);
        window.Auth?.showToast?.('Chyba', 'Nepodařilo se uložit záznam.', 'error');
        input.style.transform = 'scale(1)';
        input.style.opacity = '1';
    } finally {
        if (btn) {
            btn.innerHTML = '✨ Vyslat přání';
            btn.disabled = false;
        }
    }
}
