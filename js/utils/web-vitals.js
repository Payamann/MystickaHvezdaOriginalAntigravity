/**
 * Core Web Vitals monitoring
 * Reports LCP, FID, CLS, INP, TTFB to console and optional endpoint
 */
(function () {
    'use strict';

    const VITALS_ENDPOINT = null; // Set to '/api/telemetry/vitals' to enable server reporting
    const metrics = {};

    function reportMetric(name, value, rating) {
        metrics[name] = { value: Math.round(value), rating };

        if (rating === 'poor') {
            console.warn('[Web Vitals]', name, '=', Math.round(value), '(' + rating + ')');
        }

        if (VITALS_ENDPOINT && navigator.sendBeacon) {
            navigator.sendBeacon(VITALS_ENDPOINT, JSON.stringify({
                name,
                value: Math.round(value),
                rating,
                page: location.pathname,
                timestamp: Date.now()
            }));
        }
    }

    function getRating(name, value) {
        const thresholds = {
            LCP: [2500, 4000],
            FID: [100, 300],
            CLS: [0.1, 0.25],
            INP: [200, 500],
            TTFB: [800, 1800]
        };
        const t = thresholds[name];
        if (!t) return 'unknown';
        if (value <= t[0]) return 'good';
        if (value <= t[1]) return 'needs-improvement';
        return 'poor';
    }

    // LCP - Largest Contentful Paint
    if (PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')) {
        new PerformanceObserver(function (list) {
            var entries = list.getEntries();
            var last = entries[entries.length - 1];
            reportMetric('LCP', last.startTime, getRating('LCP', last.startTime));
        }).observe({ type: 'largest-contentful-paint', buffered: true });
    }

    // FID - First Input Delay
    if (PerformanceObserver.supportedEntryTypes?.includes('first-input')) {
        new PerformanceObserver(function (list) {
            var entry = list.getEntries()[0];
            var fid = entry.processingStart - entry.startTime;
            reportMetric('FID', fid, getRating('FID', fid));
        }).observe({ type: 'first-input', buffered: true });
    }

    // CLS - Cumulative Layout Shift
    if (PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
        var clsValue = 0;
        new PerformanceObserver(function (list) {
            for (var entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            reportMetric('CLS', clsValue * 1000, getRating('CLS', clsValue));
        }).observe({ type: 'layout-shift', buffered: true });
    }

    // TTFB - Time to First Byte
    if (performance.getEntriesByType) {
        var nav = performance.getEntriesByType('navigation')[0];
        if (nav) {
            reportMetric('TTFB', nav.responseStart, getRating('TTFB', nav.responseStart));
        }
    }
})();
