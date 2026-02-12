/**
 * Mystická Hvězda - API Configuration
 * Centralized API URL configuration for all frontend modules
 */

const API_CONFIG = {
    // Use environment-appropriate URL
    // Change this when deploying to production
    BASE_URL: (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'file:' // Handle Opening index.html directly
    ) ? 'http://localhost:3001/api' : '/api',

    // Stripe publishable key - loaded from server via /api/config
    STRIPE_PUBLISHABLE_KEY: null,

    // API Endpoints
    ENDPOINTS: {
        CRYSTAL_BALL: '/crystal-ball',
        TAROT: '/tarot',
        NATAL_CHART: '/natal-chart',
        SYNASTRY: '/synastry',
        HOROSCOPE: '/horoscope'
    }
};

// Load runtime config from server (Stripe key, etc.)
(async function loadConfig() {
    try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/config`);
        if (res.ok) {
            const config = await res.json();
            if (config.stripePublishableKey) {
                API_CONFIG.STRIPE_PUBLISHABLE_KEY = config.stripePublishableKey;
            }
        }
    } catch (e) {
        console.warn('Could not load server config:', e.message);
    }
})();

/**
 * Helper function to call API endpoints
 * @param {string} endpoint - API endpoint path
 * @param {Object} data - Request body data
 * @returns {Promise<Object>} - API response
 */
async function callAPI(endpoint, data) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Neznámá chyba');
        }

        return result;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
    }
}

// Make available globally
window.API_CONFIG = API_CONFIG;
window.callAPI = callAPI;
