(function () {
    // Guard against double init (e.g. loaded by both index.html and components.js)
    if (window.MH_COOKIE_HANDLER_INIT) return;
    window.MH_COOKIE_HANDLER_INIT = true;

    var K = 'mh_cookie_prefs';

    /** Hide banner completely (after consent given) */
    function hide() {
        var b = document.getElementById('cookie-banner');
        if (b) {
            b.classList.remove('visible');
            b.hidden = true;
        }
        if (document.body) document.body.classList.remove('cookie-banner-active');
    }

    /** Show banner via CSS class (matches style.v2.css transform animation) */
    function show() {
        var b = document.getElementById('cookie-banner');
        if (b) {
            b.hidden = false;
            if (document.body) document.body.classList.add('cookie-banner-active');
            requestAnimationFrame(function () { b.classList.add('visible'); });
        }
    }

    /** Save consent, fire GA event immediately, hide banner */
    function save(analytics, marketing) {
        localStorage.setItem(K, JSON.stringify({ analytics: analytics, marketing: marketing, ts: Date.now() }));
        // Fire event so analytics-init.js grants analytics_storage immediately
        // (without this, GA only gets consent on the NEXT page load)
        window.dispatchEvent(new CustomEvent('mh_cookie_consent', {
            detail: { analytics: analytics, marketing: marketing }
        }));
        hide();
    }

    function getSavedPrefs() {
        try {
            var saved = JSON.parse(localStorage.getItem(K) || 'null');
            if (saved && typeof saved === 'object') {
                return {
                    analytics: !!saved.analytics,
                    marketing: !!saved.marketing
                };
            }
        } catch (e) {
            localStorage.removeItem(K);
        }

        return {
            analytics: true,
            marketing: false
        };
    }

    function applySavedPrefsToControls() {
        var prefs = getSavedPrefs();
        var a = document.getElementById('cookie-analytics');
        var m = document.getElementById('cookie-marketing');
        if (a) a.checked = prefs.analytics;
        if (m) m.checked = prefs.marketing;
    }

    /** Check if consent was already given (supports old 'cookieConsent' key too) */
    function alreadyConsented() {
        if (localStorage.getItem(K)) return true;
        // Migrate old key to new format
        var old = localStorage.getItem('cookieConsent');
        if (old === 'accepted') {
            save(true, true);
            return true;
        }
        if (old === 'rejected') {
            save(false, false);
            return true;
        }
        return false;
    }

    function bindControls() {
        var ac = document.getElementById('cookie-accept');
        var rj = document.getElementById('cookie-reject');
        var sv = document.getElementById('cookie-save');

        if (ac && !ac.dataset.mhBound) {
            ac.dataset.mhBound = '1';
            ac.addEventListener('click', function () { save(true, true); });
        }
        if (rj && !rj.dataset.mhBound) {
            rj.dataset.mhBound = '1';
            rj.addEventListener('click', function () { save(false, false); });
        }
        if (sv && !sv.dataset.mhBound) {
            sv.dataset.mhBound = '1';
            sv.addEventListener('click', function () {
                var a = document.getElementById('cookie-analytics');
                var m = document.getElementById('cookie-marketing');
                save(!!(a && a.checked), !!(m && m.checked));
            });
        }
    }

    function bindManageLinks() {
        document.querySelectorAll('a[href="#cookie-banner"]').forEach(function (link) {
            if (link.dataset.mhCookieManageBound) return;
            link.dataset.mhCookieManageBound = '1';
            link.addEventListener('click', function (event) {
                event.preventDefault();
                applySavedPrefsToControls();
                show();
                document.getElementById('cookie-analytics')?.focus();
            });
        });
    }

    function init() {
        bindControls();
        bindManageLinks();

        if (alreadyConsented()) {
            hide();
            return;
        }

        // Show banner after 1s on first visit
        setTimeout(function () {
            if (!alreadyConsented()) show();
        }, 1000);
    }

    // Handle both: script loaded before DOM ready AND after (dynamic injection)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-init after footer component is dynamically loaded into pages
    document.addEventListener('components:loaded', init);
})();
