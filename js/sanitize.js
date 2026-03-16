/**
 * HTML sanitization utility using DOMPurify
 * Provides safe HTML insertion to prevent XSS attacks
 */

export function safeHTML(dirty) {
  // Use DOMPurify if available (loaded via CDN)
  if (typeof DOMPurify !== 'undefined') {
    return DOMPurify.sanitize(dirty, { RETURN_DOM: false });
  }

  // Fallback: basic text-only safety (if DOMPurify fails to load)
  const div = document.createElement('div');
  div.textContent = dirty;
  return div.innerHTML;
}

/**
 * Set innerHTML safely
 * @param {HTMLElement} element - Target element
 * @param {string} html - HTML string to insert
 */
export function setInnerHTML(element, html) {
  if (!element) return;
  element.innerHTML = safeHTML(html);
}

/**
 * Set textContent safely (prevents HTML injection entirely)
 * Use this when you don't need HTML formatting
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text to insert
 */
export function setTextContent(element, text) {
  if (!element) return;
  element.textContent = text;
}
