/**
 * Shared utility functions for profile modules
 */

// Helper: Escape HTML to prevent XSS
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper: API base URL
export function apiUrl() {
    return window.API_CONFIG?.BASE_URL || 'http://localhost:3001/api';
}

// Helper: Auth headers (Authorization kept as fallback during cookie migration)
export function authHeaders(json = false) {
    const token = window.Auth?.token;
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
}

// Helper: Fetch options with credentials for HttpOnly cookie auth
export function authFetchOptions(opts = {}) {
    return {
        credentials: 'include',
        headers: authHeaders(opts.json || false),
        ...opts
    };
}

// Get icon for reading type
export function getReadingIcon(type) {
    const icons = {
        'tarot': '🃏', 'horoscope': '♈', 'natal': '🌌', 'natal-chart': '🌌',
        'numerology': '🔢', 'synastry': '💕', 'crystal': '🔮', 'journal': '📖'
    };
    return icons[type] || '✨';
}

// Get title for reading type
export function getReadingTitle(type) {
    const titles = {
        'tarot': 'Tarotový výklad', 'horoscope': 'Horoskop', 'natal': 'Natální karta',
        'natal-chart': 'Natální karta', 'numerology': 'Numerologie',
        'synastry': 'Partnerská shoda', 'crystal': 'Křišťálová koule', 'journal': 'Manifestační deník'
    };
    return titles[type] || 'Výklad';
}
