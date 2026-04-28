/* ============================================
   MYSTICKÁ HVĚZDA - JavaScript (Refactored)
   Entry point for UI modules
   ============================================ */

import { initStars } from './ui/stars.js';
import { initHeader, initMobileNav } from './ui/header.js';
import { initScrollAnimations, initCustomCursor } from './ui/animations.js';
import { initFAQ, initTabs, initCarousel, initCookieBanner } from './ui/components.js';
import { initSmoothScroll } from './utils/helpers.js';
import { initEmailForms, initDateValidation } from './ui/forms.js';

function safeInit(name, fn) {
    try { fn(); } catch (e) { console.error(`[Init] ${name} failed:`, e); }
}

function runWhenIdle(fn, timeout = 1200) {
    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(fn, { timeout });
        return;
    }

    window.setTimeout(fn, 150);
}

function initInteractiveCards() {
    if (window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('a.card').forEach((card) => {
        if (card.dataset.hoverInit === 'true') return;
        card.dataset.hoverInit = 'true';
        card.classList.add('card--interactive-hover');
    });
}

function formatCzechDecimal(value) {
    return value.toFixed(1).replace('.', ',');
}

function setReviewSummaryValue(key, value) {
    const element = document.querySelector(`[data-review-summary="${key}"]`);
    if (element) element.textContent = value;
}

function initReviewSummary() {
    const ratings = Array.from(document.querySelectorAll('[data-review-rating]'))
        .map((item) => Number(item.dataset.reviewRating))
        .filter((rating) => Number.isFinite(rating) && rating > 0);

    if (!ratings.length) return;

    const total = ratings.reduce((sum, rating) => sum + rating, 0);
    const average = total / ratings.length;
    const fiveStarCount = ratings.filter((rating) => rating === 5).length;
    const fourStarCount = ratings.filter((rating) => rating === 4).length;

    setReviewSummaryValue('avg', `${formatCzechDecimal(average)}/5`);
    setReviewSummaryValue('count', String(ratings.length));
    setReviewSummaryValue('five', `${fiveStarCount}×`);
    setReviewSummaryValue('four', `${fourStarCount}×`);

    const summary = document.querySelector('.testimonial-summary');
    if (summary) {
        summary.dataset.reviewCount = String(ratings.length);
        summary.dataset.reviewAverage = average.toFixed(2);
    }
}

let deferredInitsScheduled = false;

function scheduleDeferredInits() {
    if (deferredInitsScheduled) return;
    deferredInitsScheduled = true;

    runWhenIdle(() => {
        safeInit('Stars', initStars);
        safeInit('ScrollAnimations', initScrollAnimations);
        safeInit('FAQ', initFAQ);
        safeInit('Tabs', initTabs);
        safeInit('SmoothScroll', initSmoothScroll);
        safeInit('CustomCursor', initCustomCursor);
        safeInit('DateValidation', initDateValidation);
        safeInit('Carousel', initCarousel);
        safeInit('CookieBanner', initCookieBanner);
    });
}

function initApp() {
    // Critical for first interaction
    safeInit('Header', initHeader);
    safeInit('MobileNav', initMobileNav);
    safeInit('EmailForms', initEmailForms);
    safeInit('InteractiveCards', initInteractiveCards);
    safeInit('ReviewSummary', initReviewSummary);

    // Non-critical and visual work should stay off the critical path, but must
    // not depend on catching window.load after this module has executed.
    scheduleDeferredInits();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp, { once: true });
} else {
    initApp();
}

// Listen for dynamically loaded components (Header/Footer)
document.addEventListener('components:loaded', () => {
    safeInit('Header', initHeader);
    safeInit('MobileNav', initMobileNav);
    safeInit('InteractiveCards', initInteractiveCards);
});

// Fallback: If components:loaded already fired before this module ran,
// check if header exists and initialize anyway
setTimeout(() => {
    const header = document.querySelector('.header');
    if (header && !header.dataset.headerInitialized) {
        console.warn('[main.js] Fallback init for header');
        safeInit('Header', initHeader);
        safeInit('MobileNav', initMobileNav);
        header.dataset.headerInitialized = 'true';
    }
}, 500);
