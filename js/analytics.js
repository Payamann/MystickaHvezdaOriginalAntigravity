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
