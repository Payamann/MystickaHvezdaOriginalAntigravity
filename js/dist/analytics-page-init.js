import { initAnalytics, trackPageLoadMetrics } from './ga-tracking.js';
document.addEventListener('DOMContentLoaded', () => {
    initAnalytics();
    trackPageLoadMetrics();
    console.log('[GA] Tracking initialized for:', window.location.pathname);
});
