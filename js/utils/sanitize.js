/**
 * HTML sanitization utilities to prevent XSS attacks.
 * Use safeHTML() when inserting untrusted data into innerHTML.
 * Prefer setText() when no HTML rendering is needed.
 */

const ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
};

const ESCAPE_RE = /[&<>"'/]/g;

/**
 * Escape HTML special characters in a string.
 * @param {string} str - Untrusted string
 * @returns {string} - Escaped safe string
 */
export function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(ESCAPE_RE, char => ESCAPE_MAP[char]);
}

/**
 * Sanitize HTML string by escaping dangerous characters.
 * Preserves line breaks by converting \n to <br>.
 * @param {string} dirty - Untrusted HTML/text
 * @returns {string} - Safe HTML string
 */
export function safeHTML(dirty) {
    if (typeof dirty !== 'string') return '';
    return escapeHTML(dirty).replace(/\n/g, '<br>');
}

/**
 * Safely set text content of an element (no HTML interpretation).
 * @param {HTMLElement} el - Target element
 * @param {string} text - Text to set
 */
export function setText(el, text) {
    if (el) el.textContent = text;
}

// Expose globally for non-module scripts
window.SanitizeUtils = { escapeHTML, safeHTML, setText };
