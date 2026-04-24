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

        const initialTransform = card.style.transform;
        const initialBorderColor = card.style.borderColor;

        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
            card.style.borderColor = 'rgba(235,192,102,0.5)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = initialTransform;
            card.style.borderColor = initialBorderColor || 'rgba(235,192,102,0.2)';
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Critical for first interaction
    safeInit('Header', initHeader);
    safeInit('MobileNav', initMobileNav);
    safeInit('EmailForms', initEmailForms);
    safeInit('InteractiveCards', initInteractiveCards);

    // Non-critical and visual work should stay off the critical path.
    const scheduleDeferredInits = () => runWhenIdle(() => {
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

    if (document.readyState === 'complete') {
        scheduleDeferredInits();
    } else {
        window.addEventListener('load', scheduleDeferredInits, { once: true });
    }
});

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
