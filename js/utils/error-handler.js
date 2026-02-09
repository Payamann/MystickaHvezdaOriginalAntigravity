/**
 * Mystická Hvězda - Centralized Error Handler
 * Standardizes error handling across the application.
 */

/**
 * Handle errors with user-facing feedback.
 * @param {Error} error - The caught error
 * @param {string} context - Where the error occurred (e.g. 'horoscope', 'tarot')
 */
function handleError(error, context = '') {
    const prefix = context ? `[${context}]` : '';

    if (error.name === 'AbortError' || error.message?.includes('vypršel')) {
        console.warn(`${prefix} Request timed out`);
        showErrorToast('Požadavek vypršel. Zkuste to znovu.');
        return;
    }

    if (error.status === 401 || error.message?.includes('Session expired')) {
        console.warn(`${prefix} Session expired`);
        // Auth client handles 401 redirect
        return;
    }

    if (error.status === 402 || error.status === 403) {
        console.warn(`${prefix} Premium required`);
        showErrorToast('Tato funkce vyžaduje Premium předplatné.', 'info');
        return;
    }

    if (error.status === 429) {
        console.warn(`${prefix} Rate limited`);
        showErrorToast('Příliš mnoho požadavků. Zkuste to za chvíli.');
        return;
    }

    // Network errors
    if (!navigator.onLine || error.message?.includes('Failed to fetch')) {
        console.error(`${prefix} Network error:`, error.message);
        showErrorToast('Zkontrolujte připojení k internetu.');
        return;
    }

    // Generic error
    console.error(`${prefix} Error:`, error);
    showErrorToast('Něco se pokazilo. Zkuste to znovu.');
}

/**
 * Show error toast using Auth system or fallback.
 * @param {string} message
 * @param {string} type
 */
function showErrorToast(message, type = 'error') {
    if (window.Auth?.showToast) {
        window.Auth.showToast('Chyba', message, type);
    } else {
        console.error(message);
    }
}

/**
 * Safe JSON.parse from localStorage with fallback.
 * @param {string} key - localStorage key
 * @param {*} fallback - Default value on failure
 * @returns {*}
 */
function safeParseJSON(key, fallback = null) {
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : fallback;
    } catch (e) {
        console.warn(`Corrupted localStorage key "${key}", clearing.`);
        localStorage.removeItem(key);
        return fallback;
    }
}

/**
 * Global unhandled error/rejection handlers for monitoring.
 */
window.addEventListener('error', (event) => {
    console.error('[Global Error]', event.message, event.filename, event.lineno);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason);
});

// Expose globally
window.handleError = handleError;
window.safeParseJSON = safeParseJSON;
