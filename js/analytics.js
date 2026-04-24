/**
 * ANALYTICS & EVENT TRACKING
 * Supports multiple analytics providers (Google Analytics, Mixpanel, Segment)
 */

const MH_ANALYTICS = {
    /**
     * Track custom event
     * @param {string} eventName - Event identifier (e.g., 'churn_prevention_shown')
     * @param {object} data - Additional event data
     */
    trackEvent(eventName, data = {}) {
        const event = {
            name: eventName,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ...data
        };

        // 1. Google Analytics (if available)
        if (window.gtag) {
            gtag('event', eventName, data);
        }

        // 2. Console logging (development)
        console.log(`[Analytics] ${eventName}`, event);

        // 3. Queue for backend analytics (optional)
        if (window.MH_ANALYTICS_QUEUE) {
            window.MH_ANALYTICS_QUEUE.push(event);
        }

        // 4. Mixpanel (if integrated)
        if (window.mixpanel) {
            mixpanel.track(eventName, data);
        }

        // 5. Segment (if integrated)
        if (window.analytics) {
            window.analytics.track(eventName, data);
        }
    },

    /**
     * Track page view
     */
    trackPageView(pageName = document.title) {
        this.trackEvent('page_view', {
            page: pageName,
            url: window.location.href
        });
    },

    /**
     * Track user action with context
     */
    trackAction(action, context = {}) {
        this.trackEvent(`action_${action}`, context);
    },

    trackCTA(location, context = {}) {
        this.trackEvent('cta_clicked', {
            location,
            ...context
        });
    },

    trackPricingViewed(selectedPlan = null, context = {}) {
        this.trackEvent('pricing_viewed', {
            selected_plan: selectedPlan,
            ...context
        });
    },

    trackAuthViewed(mode = 'login', context = {}) {
        this.trackEvent('auth_viewed', {
            auth_mode: mode,
            ...context
        });
    },

    trackAuthCompleted(mode = 'login', context = {}) {
        const eventName = mode === 'register' ? 'signup_completed' : 'login_completed';
        this.trackEvent(eventName, {
            auth_mode: mode,
            ...context
        });
    },

    trackCheckoutStarted(planId = 'unknown', context = {}) {
        this.trackEvent('begin_checkout', {
            plan_id: planId,
            ...context
        });
    },

    trackPaymentResult(status = 'unknown', context = {}) {
        this.trackEvent('payment_returned', {
            payment_status: status,
            ...context
        });
    },

    trackBillingPortalOpened(context = {}) {
        this.trackEvent('billing_portal_opened', context);
    },

    trackSubscriptionAction(action, context = {}) {
        this.trackEvent('subscription_action', {
            action,
            ...context
        });
    },

    /**
     * Track error
     */
    trackError(error, context = {}) {
        this.trackEvent('error', {
            message: error.message,
            stack: error.stack,
            ...context
        });
    }
};

// Create global aliases
window.trackEvent = window.trackEvent || ((eventName, data) => MH_ANALYTICS.trackEvent(eventName, data));
window.MH_ANALYTICS = MH_ANALYTICS;

document.addEventListener('click', (event) => {
    const target = event.target.closest(
        '#hero-cta-btn, #cta-banner-btn, #auth-register-btn, #mobile-auth-register-btn, #auth-btn, #mobile-auth-btn, a[data-plan]'
    );
    if (!target) return;

    const href = target.getAttribute('href') || '';
    const label = target.textContent?.trim() || target.id || 'unknown';

    if (target.matches('#hero-cta-btn')) {
        MH_ANALYTICS.trackCTA('homepage_hero', { label, destination: href || '/prihlaseni.html?mode=register' });
        return;
    }

    if (target.matches('#cta-banner-btn')) {
        MH_ANALYTICS.trackCTA('homepage_cta_banner', { label, destination: href || '/cenik.html' });
        return;
    }

    if (target.matches('#auth-register-btn, #mobile-auth-register-btn')) {
        MH_ANALYTICS.trackCTA('header_register', { label, destination: href || 'auth_modal_register' });
        return;
    }

    if (target.matches('#auth-btn, #mobile-auth-btn') && !(window.Auth?.isLoggedIn?.())) {
        MH_ANALYTICS.trackCTA('header_login', { label, destination: href || 'auth_modal_login' });
        return;
    }

    if (target.matches('a[data-plan]')) {
        MH_ANALYTICS.trackCTA('homepage_pricing_preview', {
            label,
            plan_id: target.dataset.plan || null,
            destination: href || '/cenik.html'
        });
    }
});

// Track uncaught errors
window.addEventListener('error', (event) => {
    MH_ANALYTICS.trackError(event.error, {
        type: 'uncaught_error',
        filename: event.filename,
        lineno: event.lineno
    });
});

// Track unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    MH_ANALYTICS.trackError(event.reason, {
        type: 'unhandled_rejection'
    });
});

// Initialize analytics queue for batching
window.MH_ANALYTICS_QUEUE = [];
