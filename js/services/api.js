/**
 * Mystická Hvězda - Centralized API Client
 * Provides consistent fetch with timeouts, auth headers, and error handling.
 */

const DEFAULT_TIMEOUT = 15000;
const AI_TIMEOUT = 60000;

class ApiClient {
    constructor() {
        this.baseUrl = window.API_CONFIG?.BASE_URL || '/api';
    }

    /**
     * Core request method with timeout and auth.
     * @param {string} path - API path (e.g. '/horoscope')
     * @param {Object} options - fetch options
     * @param {number} timeout - timeout in ms
     * @returns {Promise<Response>}
     */
    async request(path, options = {}, timeout = DEFAULT_TIMEOUT) {
        const token = localStorage.getItem('auth_token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    ...options.headers,
                },
            });

            if (response.status === 401) {
                this._handleExpiredSession();
                throw new ApiError(401, 'Session expired');
            }

            return response;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new ApiError(0, 'Požadavek vypršel. Zkuste to znovu.');
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * GET request.
     * @param {string} path
     * @param {number} timeout
     * @returns {Promise<Object>}
     */
    async get(path, timeout = DEFAULT_TIMEOUT) {
        const res = await this.request(path, { method: 'GET' }, timeout);
        return res.json();
    }

    /**
     * POST request.
     * @param {string} path
     * @param {Object} body
     * @param {number} timeout
     * @returns {Promise<Object>}
     */
    async post(path, body, timeout = DEFAULT_TIMEOUT) {
        const res = await this.request(path, {
            method: 'POST',
            body: JSON.stringify(body),
        }, timeout);
        return res.json();
    }

    /**
     * POST to AI endpoint (longer timeout).
     * @param {string} path
     * @param {Object} body
     * @returns {Promise<Object>}
     */
    async postAI(path, body) {
        return this.post(path, body, AI_TIMEOUT);
    }

    /**
     * PUT request.
     * @param {string} path
     * @param {Object} body
     * @returns {Promise<Object>}
     */
    async put(path, body) {
        const res = await this.request(path, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
        return res.json();
    }

    /**
     * PATCH request.
     * @param {string} path
     * @returns {Promise<Object>}
     */
    async patch(path) {
        const res = await this.request(path, { method: 'PATCH' });
        return res.json();
    }

    /**
     * DELETE request.
     * @param {string} path
     * @returns {Promise<Object>}
     */
    async del(path) {
        const res = await this.request(path, { method: 'DELETE' });
        return res.json();
    }

    /**
     * Handle expired session — clear auth state and notify user.
     */
    _handleExpiredSession() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        if (window.Auth) {
            window.Auth.token = null;
            window.Auth.user = null;
            window.Auth.updateUI?.();
            window.Auth.showToast?.('Relace vypršela', 'Prosím, přihlaste se znovu.', 'error');
        }
    }
}

/**
 * Custom API error with status code.
 */
class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

// Singleton instance
const api = new ApiClient();

// Expose globally
window.api = api;
window.ApiError = ApiError;
