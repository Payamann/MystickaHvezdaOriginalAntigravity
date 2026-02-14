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

// Helper: Auth headers
export function authHeaders(json = false) {
    const headers = { 'Authorization': `Bearer ${window.Auth?.token}` };
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
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
