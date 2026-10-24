(() => {
    const API_URL = window.API_CONFIG?.BASE_URL || '/api';
    const PENDING_PLAN_KEY = 'pending_plan';
    const PENDING_CONTEXT_KEY = 'pending_checkout_context';
    const PENDING_AUTH_REQUIRED_EVENTS_KEY = 'mh_pending_checkout_auth_required_events';
    const POST_VERIFICATION_CHECKOUT_KEY = 'mh_post_verification_checkout';
    const POST_VERIFICATION_CHECKOUT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
    const POST_VERIFICATION_EVENT_FLUSH_TIMEOUT_MS = 600;
    const POST_AUTH_ACTIVATION_KEY = 'post_auth_activation';
    const POST_AUTH_REDIRECT_PENDING_KEY = 'post_auth_redirect_pending';
    const SIGNUP_INTENT_KEY = 'mh_signup_intent';
    const PASSWORD_MIN_LENGTH = 8;
    const CHECKOUT_METADATA_PARAM_KEYS = [
        'entry_source',
        'entry_feature',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'requested_card',
        'card_param'
    ];

    function setHidden(element, hidden) {
        if (element) element.hidden = hidden;
    }

    function setGdprRequirement(required) {
        const gdprInput = document.getElementById('gdpr-consent');
        if (!gdprInput) return;

        if (required) {
            gdprInput.setAttribute('required', 'required');
            return;
        }

        gdprInput.removeAttribute('required');
        gdprInput.checked = false;
    }

    function setAuthButtonPremiumLabel(button, isPremium) {
        if (!button) return;
        button.textContent = 'Odhlásit';
        if (!isPremium) return;

        const badge = document.createElement('span');
        badge.className = 'auth-premium-label';
        badge.textContent = '(Členství)';
        button.append(' ', badge);
    }

    function hasStandaloneAuthHref(button) {
        const href = button?.getAttribute('href') || '';
        const blockedScriptScheme = ['java', 'script:'].join('');
        return href && href !== '#' && !href.startsWith('#') && !href.toLowerCase().startsWith(blockedScriptScheme);
    }

    function hasLoginCookie() {
        return document.cookie.split(';').some((cookie) => cookie.trim() === 'logged_in=1');
    }

    function sanitizeCheckoutMetadataValue(value, maxLength = 120) {
        if (value == null) return null;

        const cleaned = String(value).trim().replace(/[^\w.:-]/g, '');
        if (!cleaned) return null;

        return cleaned.slice(0, maxLength);
    }

    function setCheckoutMetadataValue(metadata, key, value) {
        const sanitized = sanitizeCheckoutMetadataValue(value);
        if (sanitized) metadata[key] = sanitized;
    }

    function getCheckoutMetadataFromParams(params, context = {}) {
        const metadata = {};
        const contextMetadata = context.metadata && typeof context.metadata === 'object' && !Array.isArray(context.metadata)
            ? context.metadata
            : {};

        setCheckoutMetadataValue(
            metadata,
            'entry_source',
            params.get('entry_source') || contextMetadata.entry_source || params.get('source') || context.source
        );
        setCheckoutMetadataValue(
            metadata,
            'entry_feature',
            params.get('entry_feature') || contextMetadata.entry_feature || params.get('feature') || context.feature
        );

        [
            'utm_source',
            'utm_medium',
            'utm_campaign',
            'utm_content',
            'requested_card'
        ].forEach((key) => {
            setCheckoutMetadataValue(metadata, key, params.get(key) || contextMetadata[key]);
        });
        setCheckoutMetadataValue(metadata, 'card_param', params.get('card') || params.get('card_param') || contextMetadata.card_param);

        return metadata;
    }

    function appendCheckoutContextToAuthUrl(authUrl, context = {}) {
        const params = new URLSearchParams();
        const metadata = getCheckoutMetadataFromParams(params, context);
        const billingInterval = context.billing_interval || context.billingInterval || null;

        if (billingInterval) {
            authUrl.searchParams.set('billing_interval', billingInterval);
        }

        const paramMap = {
            entry_source: 'entry_source',
            entry_feature: 'entry_feature',
            utm_source: 'utm_source',
            utm_medium: 'utm_medium',
            utm_campaign: 'utm_campaign',
            utm_content: 'utm_content',
            requested_card: 'requested_card',
            card_param: 'card'
        };

        CHECKOUT_METADATA_PARAM_KEYS.forEach((key) => {
            if (metadata[key]) {
                authUrl.searchParams.set(paramMap[key] || key, metadata[key]);
            }
        });
    }

    function readCachedUser() {
        if (!hasLoginCookie()) {
            localStorage.removeItem('auth_user');
            return null;
        }

        try {
            return JSON.parse(localStorage.getItem('auth_user') || 'null');
        } catch {
            localStorage.removeItem('auth_user');
            return null;
        }
    }

    const Auth = {
        // Token is stored in HttpOnly cookie (secure, XSS-proof)
        // JS cannot read it - that's the point. Use the server-set login
        // indicator cookie as the source of truth and treat auth_user as cache.
        user: readCachedUser(),
        modalReturnFocusElement: null,
        modalAddedBodyScrollLockClass: false,
        modalBackgroundInertState: null,

        isStandaloneAuthPage() {
            return document.body?.classList.contains('page-login') || window.location.pathname.endsWith('/prihlaseni.html') || window.location.pathname.endsWith('prihlaseni.html');
        },

        init() {
            this.updateUI();
            this.setupListeners();
            this.handleRedirect();
            void this.flushPendingCheckoutAuthRequiredEvents();
            this.maybeShowPostAuthActivation();
            this.refreshSession(); // Auto-sync profile on load
            // Auto-refresh token every 15 minutes (faster detection of trial expiration)
            setInterval(() => this.refreshSession(), 900000);
        },

        async refreshSession() {
            if (!this.isLoggedIn()) return;
            try {
                // Session refresh now relies on HttpOnly cookies

                const ownerSnapshot = this.user;
                const oldStatus = ownerSnapshot?.subscription_status;
                const user = await this.getProfile();
                // A local save or account switch owns newer state than this request.
                if (this.user !== ownerSnapshot || !this.isLoggedIn()) return;

                if (user) {
                    this.user = user;
                    localStorage.setItem('auth_user', JSON.stringify(user));
                    this.updateUI();

                    // Only emit if status changed to avoid infinite reload loops
                    if (oldStatus !== user.subscription_status) {
                        document.dispatchEvent(new Event('auth:refreshed'));
                    }
                }
            } catch (e) {
                console.warn('Session refresh failed:', e);
                // If profile fetch fails, user might be logged out (token expired)
                if (e.message === 'Session expired') {
                    this.logout();
                }
            }
        },

        async _refreshToken() {
            try {
                const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
                const res = await fetch(`${API_URL}/auth/refresh-token`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    this.user = data.user;
                    localStorage.setItem('auth_user', JSON.stringify(data.user));
                } else if (res.status === 401 || res.status === 403) {
                    // Token invalid/expired, force logout
                    this.logout();
                }
            } catch (e) {
                // Network error, retry on next interval
                console.warn('Token refresh failed:', e);
            }
        },

        handleRedirect() {
            // The dedicated recovery page owns its token and focus lifecycle.
            if (this.isStandaloneAuthPage() && new URLSearchParams(window.location.search).get('reset') === 'true') return;
            const hash = window.location.hash;
            // ... (rest of handleRedirect logic)

            // Handle Success
            if (hash && hash.includes('access_token')) {
                history.replaceState(null, null, ' ');
                setTimeout(() => {
                    this.showToast('Ověřeno', 'E-mail je potvrzený. Teď se můžeš přihlásit.', 'success');
                    this.openModal('login');
                }, 500);
            }

            // Handle Errors (e.g. expired link)
            if (hash && hash.includes('error=')) {
                console.warn('Auth Error in URL:', hash);

                // Extract error description if possible
                let msg = 'Odkaz je neplatný nebo vypršel.';
                if (hash.includes('otp_expired')) {
                    msg = 'Odkaz pro ověření vypršel. Prosím, zkuste to znovu.';
                }

                history.replaceState(null, null, ' '); // Clear URL
                setTimeout(() => {
                    this.showToast('Chyba ověření ❌', msg, 'error');
                }, 500);
            }
        },

        injectModal() {
            if (document.getElementById('auth-modal')) return;

            const modalHtml = window.Templates ? window.Templates.renderAuthModal() : '';
            if (modalHtml) {
                document.body.insertAdjacentHTML('beforeend', modalHtml);
            } else {
                console.error('Templates library not loaded!');
            }
        },

        bindModalListeners() {
            const modal = document.getElementById('auth-modal');
            if (!modal || modal.dataset.modalListenersAttached === 'true') return;

            modal.dataset.modalListenersAttached = 'true';
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
            modal.addEventListener('keydown', (event) => {
                if (modal.hidden) return;
                if (event.key === 'Escape') {
                    event.preventDefault();
                    this.closeModal();
                    return;
                }
                if (event.key !== 'Tab') return;

                const focusable = this.getModalFocusableElements(modal);
                if (!focusable.length) {
                    event.preventDefault();
                    modal.focus({ preventScroll: true });
                    return;
                }

                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (!modal.contains(document.activeElement)) {
                    event.preventDefault();
                    (event.shiftKey ? last : first).focus();
                } else if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            });
        },

        getModalFocusableElements(modal) {
            if (!modal) return [];
            return [...modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
                .filter((element) => !element.closest('[hidden]')
                    && element.getAttribute('aria-hidden') !== 'true'
                    && element.getClientRects().length > 0);
        },

        setModalBackgroundInert(modal, inert) {
            if (inert) {
                this.modalBackgroundInertState = [...document.body.children]
                    .filter((element) => element !== modal)
                    .map((element) => ({ element, wasInert: element.inert }));
                this.modalBackgroundInertState.forEach(({ element }) => {
                    element.inert = true;
                });
                return;
            }

            this.modalBackgroundInertState?.forEach(({ element, wasInert }) => {
                if (element.isConnected) element.inert = wasInert;
            });
            this.modalBackgroundInertState = null;
        },

        isLoggedIn() {
            const loggedIn = hasLoginCookie();
            if (!loggedIn && this.user) {
                this.user = null;
                localStorage.removeItem('auth_user');
            }
            return loggedIn;
        },

        isPremium() {
            if (!this.user || !this.user.subscription_status) return false;
            if (typeof this.user.isPremium === 'boolean') return this.user.isPremium;
            const s = this.user.subscription_status.toLowerCase();
            if (!s.includes('premium') && !s.includes('exclusive') && !s.includes('vip')) return false;
            // Check expiration if available
            if (this.user.premiumExpires) {
                const expires = new Date(this.user.premiumExpires);
                if (expires < new Date()) return false;
            }
            return true;
        },

        // Compatibility alias: all active paid memberships have the same access.
        isExclusive() {
            return this.isPremium();
        },

        async register(email, password, additionalData = {}) {
            try {
                const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
                const res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    credentials: 'include', // Send cookies (auth_token will be set by server)
                    headers: {
                        'Content-Type': 'application/json',
                        ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                    },
                    body: JSON.stringify({ email, password, ...additionalData })
                });
                const data = await res.json();
                if (!res.ok) {
                    return {
                        success: false,
                        error: data.error || 'Registrace se nepodařila.',
                        code: data.code || 'REGISTRATION_FAILED',
                        retryAfter: Number.parseInt(res.headers.get('retry-after') || '', 10) || null
                    };
                }

                if (data.requireEmailVerification) {
                    const standaloneContext = this.getStandaloneAuthContext();
                    const pendingPlan = this.getPendingCheckoutPlan();
                    const standalonePlan = !pendingPlan && standaloneContext?.plan ? standaloneContext.plan : null;
                    const checkoutContext = pendingPlan
                        ? this.getPendingCheckoutContext()
                        : standalonePlan
                            ? {
                                source: standaloneContext.source || 'standalone_auth_plan',
                                feature: standaloneContext.feature || null,
                                metadata: standaloneContext.metadata || {},
                                billing_interval: standaloneContext.billing_interval || null,
                                redirect: typeof standaloneContext.redirect === 'string'
                                    && standaloneContext.redirect.startsWith('/')
                                    && !standaloneContext.redirect.startsWith('//')
                                    ? standaloneContext.redirect
                                    : '/cenik.html',
                                authMode: standaloneContext.mode || 'register'
                            }
                            : null;
                    const checkoutPlan = pendingPlan || standalonePlan;
                    if (checkoutPlan && checkoutContext) {
                        this.rememberPostVerificationCheckout(checkoutPlan, checkoutContext);
                        void this.trackCheckoutPostVerificationEvent(
                            'checkout_post_verification_pending',
                            checkoutPlan,
                            checkoutContext
                        );
                        if (pendingPlan) {
                            this.clearPendingCheckout();
                        }
                    }
                    const authSource = checkoutContext?.source || standaloneContext?.source || null;
                    const authFeature = checkoutContext?.feature || standaloneContext?.feature || null;
                    const analyticsTracked = this.trackAuthCompletedSafely('register', {
                        source: authSource,
                        feature: authFeature,
                        entry_source: authSource,
                        entry_feature: authFeature
                    });
                    this.showToast('Ověření e-mailu', 'Potvrď svůj e-mail a dokonči registraci. 📧', 'success');
                    this.closeModal(); // Close modal but don't login yet
                    return { success: true, verificationRequired: true, analyticsTracked };
                }

                this.loginSuccess(data, { mode: 'register' });
                this.showToast('Registrace hotová', 'Účet je připravený.', 'success');
                return { success: true, analyticsTracked: true };
            } catch (e) {
                return { success: false, error: e.message, code: 'REGISTRATION_NETWORK_ERROR', retryAfter: null };
            }
        },

        showToast(title, message, type = 'info') {
            let container = document.querySelector('.toast-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'toast-container';
                document.body.appendChild(container);
            }

            const toast = document.createElement('div');
            toast.className = `toast toast--${type}`;

            const icons = {"info":"<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><use href=\"/img/icons/mh-symbols.svg#info\"></use></svg>","success":"<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><use href=\"/img/icons/mh-symbols.svg#check\"></use></svg>","error":"<svg class=\"mh-symbol\" viewBox=\"0 0 48 48\" width=\"48\" height=\"48\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\" focusable=\"false\"><use href=\"/img/icons/mh-symbols.svg#error\"></use></svg>"};
            const icon = type === 'success' ? icons.success : type === 'error' ? icons.error : icons.info;

            // Only fixed local SVG markup goes into the icon; user-facing text remains textContent.
            const iconDiv = document.createElement('div');
            iconDiv.className = 'toast__icon';
            iconDiv.innerHTML = icon;
            const textDiv = document.createElement('div');
            const titleDiv = document.createElement('div');
            titleDiv.className = 'toast__title';
            titleDiv.textContent = title;
            const msgDiv = document.createElement('div');
            msgDiv.className = 'toast__message';
            msgDiv.textContent = message;
            textDiv.appendChild(titleDiv);
            textDiv.appendChild(msgDiv);
            toast.appendChild(iconDiv);
            toast.appendChild(textDiv);

            container.appendChild(toast);

            // Auto remove
            setTimeout(() => {
                toast.classList.add('toast--leaving');
                setTimeout(() => toast.remove(), 300);
            }, 5000);
        },

        async login(email, password) {
            try {
                const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    credentials: 'include', // Send cookies (auth_token will be set by server)
                    headers: {
                        'Content-Type': 'application/json',
                        ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                    },
                    body: JSON.stringify({ email, password })
                });

                let data = null;
                try {
                    data = await res.json();
                } catch (parseError) {
                    console.warn('[AUTH] Login API returned a non-JSON response', {
                        status: res.status,
                        errorType: parseError?.name || 'ParseError'
                    });
                    const retryAfter = Number.parseInt(res.headers.get('retry-after') || '', 10) || null;
                    const error = res.status === 429
                        ? 'Příliš mnoho pokusů o přihlášení. Chvíli počkej a zkus to znovu.'
                        : res.status >= 500
                            ? 'Přihlášení je teď dočasně nedostupné. Zkus to prosím za chvíli znovu.'
                            : 'Přihlášení se nepodařilo ověřit. Zkus to prosím znovu.';
                    return {
                        success: false,
                        error,
                        code: res.status === 429 ? 'LOGIN_RATE_LIMITED' : res.status >= 500 ? 'LOGIN_SERVICE_UNAVAILABLE' : 'LOGIN_INVALID_RESPONSE',
                        retryAfter
                    };
                }

                if (!res.ok) {
                    return {
                        success: false,
                        error: data?.error || (res.status === 429
                            ? 'Příliš mnoho pokusů o přihlášení. Chvíli počkej a zkus to znovu.'
                            : res.status >= 500
                                ? 'Přihlášení je teď dočasně nedostupné. Zkus to prosím za chvíli znovu.'
                                : 'Přihlášení se nepodařilo. Zkontroluj e-mail a heslo a zkus to znovu.'),
                        code: data?.code || 'LOGIN_FAILED',
                        retryAfter: Number.parseInt(res.headers.get('retry-after') || '', 10) || null
                    };
                }

                if (!data || typeof data !== 'object' || Array.isArray(data)
                    || !data.user || typeof data.user !== 'object' || Array.isArray(data.user)) {
                    console.warn('[AUTH] Login API returned an unexpected JSON shape', { status: res.status });
                    return {
                        success: false,
                        error: 'Přihlášení se nepodařilo ověřit. Zkus to prosím znovu.',
                        code: 'LOGIN_INVALID_RESPONSE',
                        retryAfter: null
                    };
                }

                this.loginSuccess(data, { mode: 'login' });
                return { success: true, analyticsTracked: true };
            } catch (e) {
                console.warn('[AUTH] Login request could not be completed', { errorType: e?.name || 'NetworkError' });
                return {
                    success: false,
                    error: 'Při přihlášení se nepodařilo spojit se serverem. Zkontroluj připojení a zkus to znovu.',
                    code: 'LOGIN_NETWORK_ERROR',
                    retryAfter: null
                };
            }
        },

        trackAuthCompletedSafely(authMode, payload = {}) {
            try {
                window.MH_ANALYTICS?.trackAuthCompleted?.(authMode, payload);
                return true;
            } catch (analyticsError) {
                console.warn('[FUNNEL] Auth completion analytics failed:', analyticsError.message);
                return false;
            }
        },

        trackEventSafely(eventName, payload = {}) {
            try {
                window.MH_ANALYTICS?.trackEvent?.(eventName, payload);
                return true;
            } catch (analyticsError) {
                console.warn('[FUNNEL] Analytics event failed:', eventName, analyticsError.message);
                return false;
            }
        },

        loginSuccess(data, options = {}) {
            // Token is now in HttpOnly cookie (set by server)
            // We only store user data in localStorage
            const pendingPlan = this.getPendingCheckoutPlan();
            const standaloneContext = this.getStandaloneAuthContext();
            const standalonePlan = !pendingPlan && standaloneContext?.plan ? standaloneContext.plan : null;
            // Post-verification checkout recovery is a login-only path: it exists so
            // a user who registered with a plan, left to verify their email, and came
            // back to log in can resume the interrupted checkout. A fresh registration
            // must never inherit a stale checkout intent that an earlier abandoned
            // attempt left in localStorage — that would hijack an unrelated signup
            // (e.g. via the plain header link) straight into Stripe.
            const postVerificationCheckout = !pendingPlan && !standalonePlan && options.mode !== 'register'
                ? this.getPostVerificationCheckout()
                : null;
            if (options.mode === 'register' && !pendingPlan && !standalonePlan) {
                // A plan-less registration means this browser now belongs to a user
                // with no checkout intent — drop any leftover entry entirely so it
                // cannot hijack their next login either.
                this.clearPostVerificationCheckout();
            }
            const checkoutPlan = pendingPlan || standalonePlan || postVerificationCheckout?.planId;
            const checkoutContext = pendingPlan
                ? this.getPendingCheckoutContext()
                : standalonePlan
                    ? {
                        planId: standalonePlan,
                        source: standaloneContext.source || 'standalone_auth_plan',
                        feature: standaloneContext.feature || null,
                        metadata: standaloneContext.metadata || {},
                        billing_interval: standaloneContext.billing_interval || null,
                        redirect: typeof standaloneContext.redirect === 'string'
                            && standaloneContext.redirect.startsWith('/')
                            && !standaloneContext.redirect.startsWith('//')
                            && standaloneContext.redirect !== '/profil.html'
                            ? standaloneContext.redirect
                            : '/cenik.html',
                        authMode: standaloneContext.mode || options.mode || 'register'
                    }
                    : postVerificationCheckout?.context || null;
            const postAuthRedirect = checkoutPlan ? null : this.resolvePostAuthRedirect(options);
            if (postAuthRedirect) {
                sessionStorage.setItem(POST_AUTH_REDIRECT_PENDING_KEY, postAuthRedirect);
            } else {
                sessionStorage.removeItem(POST_AUTH_REDIRECT_PENDING_KEY);
            }
            this.user = data.user;
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            if (options.mode === 'register' && standaloneContext) {
                this.rememberSignupIntent(standaloneContext, postAuthRedirect || checkoutContext?.redirect || null);
            }
            this.updateUI();
            this.closeModal();

            const authMode = options.mode === 'register' ? 'register' : 'login';
            const authSource = checkoutContext?.source || standaloneContext?.source || null;
            const authFeature = checkoutContext?.feature || standaloneContext?.feature || null;
            this.trackAuthCompletedSafely(authMode, {
                source: authSource,
                feature: authFeature,
                entry_source: authSource,
                entry_feature: authFeature
            });

            // After login/register success: check for pending plan redirect
            if (checkoutPlan) {
                sessionStorage.removeItem(POST_AUTH_REDIRECT_PENDING_KEY);
                if (postVerificationCheckout) {
                    void this.flushCheckoutPostVerificationEvent(
                        'checkout_post_verification_recovered',
                        checkoutPlan,
                        checkoutContext
                    ).finally(() => {
                        this._startCheckout(checkoutPlan, checkoutContext);
                    });
                    return;
                }
                this._startCheckout(checkoutPlan, checkoutContext);
                return;
            }

            if (postAuthRedirect) {
                if (options.mode === 'register' && standaloneContext) {
                    void this.completeDirectSignupActivation(standaloneContext, postAuthRedirect);
                }

                setTimeout(() => {
                    sessionStorage.removeItem(POST_AUTH_REDIRECT_PENDING_KEY);
                    window.location.href = postAuthRedirect;
                }, 500);
            }
        },

        async completeDirectSignupActivation(context = {}, destination = '') {
            let safeDestination;

            try {
                const parsedDestination = new URL(destination, window.location.origin);
                if (parsedDestination.origin !== window.location.origin) return false;
                if (parsedDestination.pathname === '/onboarding.html') return false;
                safeDestination = `${parsedDestination.pathname}${parsedDestination.search}${parsedDestination.hash}`;
            } catch {
                return false;
            }

            const safeRedirect = typeof context.redirect === 'string'
                && context.redirect.startsWith('/')
                && !context.redirect.startsWith('//')
                ? context.redirect
                : null;

            try {
                const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
                const response = await fetch(`${API_URL}/auth/onboarding/complete`, {
                    method: 'POST',
                    credentials: 'include',
                    keepalive: true,
                    headers: {
                        'Content-Type': 'application/json',
                        ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                    },
                    body: JSON.stringify({
                        source: context.source || null,
                        feature: context.feature || null,
                        plan: context.plan || null,
                        redirect: safeRedirect,
                        flow: 'quick',
                        destination: safeDestination,
                        skipped: true
                    })
                });

                if (!response.ok) {
                    console.warn('Failed to complete direct signup activation:', response.status);
                    return false;
                }

                localStorage.setItem('mh_onboarded', '1');
                return true;
            } catch (error) {
                console.warn('Error completing direct signup activation:', error.message);
                return false;
            }
        },

        getStandaloneAuthContext() {
            if (!this.isStandaloneAuthPage()) return null;

            const params = new URLSearchParams(window.location.search);
            const mode = params.get('mode') === 'register' ? 'register' : 'login';
            const redirect = params.get('redirect') || '/profil.html';
            const source = params.get('source') || null;
            const feature = params.get('feature') || null;
            const plan = params.get('plan') || null;
            const billingInterval = params.get('billing_interval') || params.get('billingInterval') || null;
            const metadata = getCheckoutMetadataFromParams(params, { source, feature });

            return {
                mode,
                redirect,
                source,
                feature,
                plan,
                billing_interval: billingInterval,
                metadata
            };
        },

        getPostAuthActivationConfig(context = {}) {
            const feature = context.feature || '';
            const source = context.source || '';

            const featureMap = {
                partnerska_detail: {
                    path: '/partnerska-shoda.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Pokračuj k partnerské shodě a prozkoumej, jak se vaše horoskopy doplňují.'
                },
                synastry: {
                    path: '/partnerska-shoda.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Pokračuj k partnerské shodě a prozkoumej, jak se vaše horoskopy doplňují.'
                },
                natalni_interpretace: {
                    path: '/natalni-karta.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Pokračuj k natální kartě a připrav si údaje potřebné pro její výpočet.'
                },
                numerologie_vyklad: {
                    path: '/numerologie.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Pokračuj k numerologii a podívej se na rozbor svého data narození.'
                },
                annual_horoscope: {
                    path: '/osobni-mapa.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Roční horoskop už nenabízíme. Tady si můžeš prohlédnout aktuální nabídku Osobní mapy.'
                },
                personal_map: {
                    path: '/osobni-mapa.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Pokračuj k Osobní mapě a prohlédni si, co její výklad obsahuje.'
                },
                tarot: {
                    path: '/tarot.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Vyber si rozklad a polož otázku, kterou chceš prozkoumat.'
                },
                tarot_yes_no: {
                    path: '/tarot-ano-ne.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Polož jednu konkrétní otázku ano/ne a podívej se, co ti karta nabídne k zamyšlení.'
                },
                tarot_love: {
                    path: '/tarot-laska.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Otevři tarot na lásku a zaměř se na otázku, kterou teď řešíš.'
                },
                dream_dictionary: {
                    path: '/snar.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Vrať se k symbolu ze svého snu a prozkoumej, co pro tebe může znamenat.'
                },
                tarot_multi_card: {
                    path: '/tarot.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Vyber si rozklad z více karet a prohlédni si, jak se jejich významy doplňují.'
                },
                tarot_daily_card_profile_save: {
                    path: '/tarot-karta-dne.html',
                    title: 'Karta je připravená k uložení',
                    message: 'Vrať se ke kartě dne a ulož si ji do profilu, ať ji později snadno najdeš.'
                },
                horoskopy: {
                    path: '/horoskopy.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Vyber si znamení a přečti si dnešní horoskop.'
                },
                astrocartography: {
                    path: '/astro-mapa.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Pokračuj k astro mapě a prozkoumej místa, která tě zajímají.'
                },
                premium_membership: {
                    path: '/cenik.html',
                    title: 'Členství Mystické Hvězdy',
                    message: 'Prohlédni si obsah členství, cenu i podmínky.'
                },
                subscription_management: {
                    path: '/profil.html#tab-settings',
                    title: 'Nastavení členství',
                    message: 'V nastavení profilu můžeš zkontrolovat své členství a správu plateb.'
                },
                vip_membership: {
                    path: '/cenik.html',
                    title: 'Členství Mystické Hvězdy',
                    message: 'Prohlédni si aktuální nabídku členství a jeho podmínky.'
                },
                daily_guidance: {
                    path: '/horoskopy.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Vyber si své znamení a otevři dnešní horoskop.'
                },
                daily_angel_card: {
                    path: '/andelske-karty.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Vrať se k denní kartě a prozkoumej její význam.'
                },
                andelske_karty_hluboky_vhled: {
                    path: '/andelske-karty.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Prohlédni si andělské karty a vyber si výklad, který tě zajímá.'
                },
                weekly_horoscope: {
                    path: '/tydenni-horoskop.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Tady najdeš týdenní výhled. Vyber si znamení; plný obsah je součástí členství.'
                },
                monthly_horoscope: {
                    path: '/mesicni-horoskop.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Tady najdeš měsíční výhled. Vyber si znamení; plný obsah je součástí členství.'
                },
                lunar_calendar: {
                    path: '/lunace.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Prohlédni si lunární kalendář a vyber si fázi, kterou chceš sledovat.'
                },
                zodiac_signs: {
                    path: '/horoskop/',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Vyber si znamení a otevři jeho horoskop.'
                },
                ritual_memory: {
                    path: '/profil.html',
                    title: 'Co se ti opakuje',
                    message: 'Po prvním uloženém výkladu nebo reflexi si tady můžeš všimnout opakujících se témat.'
                },
                profile_history: {
                    path: '/profil.html',
                    title: 'Historie výkladů',
                    message: 'V profilu najdeš výklady, které sis uložil, a můžeš se k nim vracet.'
                },
                another_reading: {
                    path: '/tarot.html',
                    title: 'Další tarotový výklad',
                    message: 'Vyber si další výklad podle otázky, kterou chceš prozkoumat.'
                },
                mentor: {
                    path: '/mentor.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Polož Hvězdnému Průvodci otázku, kterou právě řešíš.'
                },
                hvezdny_mentor: {
                    path: '/mentor.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Polož Hvězdnému Průvodci otázku, kterou právě řešíš.'
                },
                runy_hluboky_vyklad: {
                    path: '/runy.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Pokračuj k runám a prozkoumej výklad ke své otázce.'
                },
                shamanske_kolo_plne_cteni: {
                    path: '/shamansko-kolo.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Otevři šamanské kolo a prozkoumej symbolický výklad ke svému tématu.'
                },
                minuly_zivot: {
                    path: '/minuly-zivot.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Symbolický výklad minulého života můžeš vzít jako podnět k sebereflexi.'
                },
                kristalova_koule: {
                    path: '/kristalova-koule.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Polož otázku a prozkoumej symbolický vhled z křišťálové koule.'
                }
            };

            Object.assign(featureMap, {
                angel_card_deep: featureMap.andelske_karty_hluboky_vhled,
                angel_numbers: featureMap.andelske_karty_hluboky_vhled,
                crystal_ball_unlimited: featureMap.kristalova_koule,
                compatibility: featureMap.partnerska_detail,
                journal_insights: featureMap.mentor,
                medicine_wheel: featureMap.shamanske_kolo_plne_cteni,
                natal_chart: featureMap.natalni_interpretace,
                numerology: featureMap.numerologie_vyklad,
                osobni_mapa_2026: featureMap.personal_map,
                rocni_horoskop_2026: featureMap.personal_map,
                past_life: featureMap.minuly_zivot,
                rituals: {
                    path: '/ritualy/',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Prohlédni si lunární rituály a vyber si ten, který se hodí k tvému záměru.'
                },
                runes_deep_reading: featureMap.runy_hluboky_vyklad,
                synastry: featureMap.partnerska_detail,
                tarot_celtic_cross: featureMap.tarot_multi_card
            });

            const sourceMap = {
                homepage_hero: {
                    path: '/tarot-ano-ne.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Polož jednu konkrétní otázku ano/ne a otevři tarotový výklad.'
                },
                pricing_free_cta: {
                    path: '/horoskopy.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Vyber si znamení a přečti si dnešní horoskop.'
                },
                homepage_pricing_free_cta: {
                    path: '/horoskopy.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Vyber si znamení a otevři dnešní horoskop.'
                },
                tarot_daily_card_profile_save: {
                    path: '/tarot-karta-dne.html',
                    title: 'Karta je připravená k uložení',
                    message: 'Vrať se ke kartě dne a ulož si ji do profilu, ať ji později snadno najdeš.'
                },
                newsletter_form: {
                    path: '/horoskopy.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Vyber si znamení a přečti si dnešní horoskop.'
                },
                newsletter_popup: {
                    path: '/horoskopy.html',
                    title: 'Vítej v Mystické Hvězdě',
                    message: 'Vyber si znamení a otevři dnešní horoskop.'
                }
            };

            const manifestActivation = window.MH_GROWTH_LOOP?.getPostSignupActivation?.({
                ...context,
                source,
                feature
            });
            const copyConfig = featureMap[feature] || sourceMap[source] || null;

            if (manifestActivation?.path) {
                return {
                    path: manifestActivation.path,
                    title: copyConfig?.title || 'Vítej v Mystické Hvězdě',
                    message: copyConfig?.message || 'Vyber si výklad podle otázky, kterou chceš prozkoumat.'
                };
            }

            return copyConfig;
        },

        setPostAuthActivation(context = {}) {
            if (!context?.path) return;

            sessionStorage.setItem(POST_AUTH_ACTIVATION_KEY, JSON.stringify({
                path: context.path,
                title: context.title || 'Vítej',
                message: context.message || '',
                source: context.source || null,
                feature: context.feature || null
            }));
        },

        rememberSignupIntent(context = {}, destination = null) {
            if (!context.source && !context.feature && !destination) return;

            try {
                const intent = window.MH_GROWTH_LOOP?.buildSignupIntent?.(context, destination) || {
                    source: context.source || null,
                    feature: context.feature || null,
                    plan: context.plan || null,
                    redirect: context.redirect || null,
                    destination: destination || context.redirect || null,
                    createdAt: Date.now()
                };
                localStorage.setItem(SIGNUP_INTENT_KEY, JSON.stringify(intent));
            } catch (error) {
                console.warn('Unable to remember signup intent:', error);
            }
        },

        buildPostAuthActivationUrl(path, context = {}) {
            const activationUrl = window.MH_GROWTH_LOOP?.buildActivationUrl?.(path, context, {
                source: 'signup_activation',
                preserveFeature: true
            });
            if (activationUrl) return activationUrl;

            const url = new URL(path || '/profil.html', window.location.origin);
            url.searchParams.set('source', 'signup_activation');

            if (context.feature) {
                url.searchParams.set('feature', context.feature);
                url.searchParams.set('entry_feature', context.feature);
            }

            if (context.source) {
                url.searchParams.set('entry_source', context.source);
            }

            return `${url.pathname}${url.search}${url.hash}`;
        },

        maybeShowPostAuthActivation() {
            try {
                const raw = sessionStorage.getItem(POST_AUTH_ACTIVATION_KEY);
                if (!raw) return;

                const activation = JSON.parse(raw);
                const activationPath = activation?.path
                    ? new URL(activation.path, window.location.origin).pathname
                    : '';
                if (!activationPath || window.location.pathname !== activationPath) {
                    return;
                }

                sessionStorage.removeItem(POST_AUTH_ACTIVATION_KEY);

                if (activation.title || activation.message) {
                    this.showToast(
                        activation.title || 'Vítej',
                        activation.message || 'Vyber si výklad podle otázky, kterou chceš prozkoumat.',
                        'success'
                    );
                }

                this.trackEventSafely('signup_activation_landed', {
                    source: activation.source || 'direct',
                    feature: activation.feature || null,
                    destination: activation.path
                });
            } catch (error) {
                console.warn('Post-auth activation handling failed:', error);
                sessionStorage.removeItem(POST_AUTH_ACTIVATION_KEY);
            }
        },

        resolvePostAuthRedirect(options = {}) {
            const context = this.getStandaloneAuthContext();
            if (!context) return null;

            const safeRedirect = typeof context.redirect === 'string' && context.redirect.startsWith('/') && !context.redirect.startsWith('//')
                ? context.redirect
                : '/profil.html';
            const buildOnboardingRedirect = () => {
                const onboardingUrl = new URL('/onboarding.html', window.location.origin);
                if (context.source) onboardingUrl.searchParams.set('source', context.source);
                if (context.feature) onboardingUrl.searchParams.set('feature', context.feature);
                if (context.plan) onboardingUrl.searchParams.set('plan', context.plan);
                if (safeRedirect) onboardingUrl.searchParams.set('redirect', safeRedirect);
                return `${onboardingUrl.pathname}${onboardingUrl.search}`;
            };

            if (options.mode === 'register') {
                if (context.source === 'tarot_yes_no_save_journal' && safeRedirect === '/profil.html') {
                    return safeRedirect;
                }

                const activation = this.getPostAuthActivationConfig(context);
                if (activation?.path) {
                    this.setPostAuthActivation({
                        ...activation,
                        source: context.source,
                        feature: context.feature
                    });

                    this.trackEventSafely('signup_activation_redirected', {
                        source: context.source || 'register',
                        feature: context.feature || null,
                        destination: activation.path
                    });

                    return this.buildPostAuthActivationUrl(activation.path, context);
                }

                if (safeRedirect === '/profil.html') {
                    return buildOnboardingRedirect();
                }
            }

            return safeRedirect;
        },

        getPendingCheckoutPlan() {
            return sessionStorage.getItem(PENDING_PLAN_KEY);
        },

        getPendingCheckoutContext() {
            try {
                return JSON.parse(sessionStorage.getItem(PENDING_CONTEXT_KEY) || '{}');
            } catch {
                return {};
            }
        },

        sanitizeCheckoutContextForStorage(planId, context = {}) {
            const metadata = {};
            const rawMetadata = getCheckoutMetadataFromParams(new URLSearchParams(), context);
            CHECKOUT_METADATA_PARAM_KEYS.forEach((key) => {
                setCheckoutMetadataValue(metadata, key, rawMetadata[key]);
            });

            const redirect = typeof context.redirect === 'string'
                && context.redirect.startsWith('/')
                && !context.redirect.startsWith('//')
                ? context.redirect
                : '/cenik.html';
            const storedContext = {
                planId: sanitizeCheckoutMetadataValue(planId, 80),
                source: sanitizeCheckoutMetadataValue(context.source, 120) || 'auth_pending_plan',
                feature: sanitizeCheckoutMetadataValue(context.feature, 120),
                redirect,
                authMode: context.authMode === 'login' ? 'login' : 'register',
                metadata
            };
            const billingInterval = sanitizeCheckoutMetadataValue(
                context.billing_interval || context.billingInterval,
                40
            );
            if (billingInterval) storedContext.billing_interval = billingInterval;

            return storedContext;
        },

        rememberPostVerificationCheckout(planId, context = {}) {
            const storedContext = this.sanitizeCheckoutContextForStorage(planId, context);
            if (!storedContext.planId) return;

            try {
                localStorage.setItem(POST_VERIFICATION_CHECKOUT_KEY, JSON.stringify({
                    planId: storedContext.planId,
                    context: storedContext,
                    createdAt: Date.now()
                }));
            } catch (error) {
                console.warn('Unable to remember post-verification checkout:', error);
            }
        },

        getPostVerificationCheckout() {
            try {
                const raw = localStorage.getItem(POST_VERIFICATION_CHECKOUT_KEY);
                if (!raw) return null;

                const parsed = JSON.parse(raw);
                if (!parsed?.planId || !parsed?.context) {
                    localStorage.removeItem(POST_VERIFICATION_CHECKOUT_KEY);
                    return null;
                }

                if (Date.now() - Number(parsed.createdAt || 0) > POST_VERIFICATION_CHECKOUT_TTL_MS) {
                    localStorage.removeItem(POST_VERIFICATION_CHECKOUT_KEY);
                    return null;
                }

                return {
                    planId: parsed.planId,
                    context: parsed.context
                };
            } catch {
                localStorage.removeItem(POST_VERIFICATION_CHECKOUT_KEY);
                return null;
            }
        },

        clearPostVerificationCheckout() {
            localStorage.removeItem(POST_VERIFICATION_CHECKOUT_KEY);
        },

        getQueuedCheckoutAuthRequiredEvents() {
            try {
                const parsed = JSON.parse(sessionStorage.getItem(PENDING_AUTH_REQUIRED_EVENTS_KEY) || '[]');
                return Array.isArray(parsed) ? parsed.filter((event) => event?.id && event?.payload) : [];
            } catch {
                sessionStorage.removeItem(PENDING_AUTH_REQUIRED_EVENTS_KEY);
                return [];
            }
        },

        setQueuedCheckoutAuthRequiredEvents(events = []) {
            const cleanEvents = Array.isArray(events) ? events.slice(-8) : [];
            if (!cleanEvents.length) {
                sessionStorage.removeItem(PENDING_AUTH_REQUIRED_EVENTS_KEY);
                return;
            }
            sessionStorage.setItem(PENDING_AUTH_REQUIRED_EVENTS_KEY, JSON.stringify(cleanEvents));
        },

        queueCheckoutFunnelEvent(payload) {
            if (!payload?.eventName) return null;
            const event = {
                id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
                payload,
                createdAt: Date.now()
            };
            this.setQueuedCheckoutAuthRequiredEvents([
                ...this.getQueuedCheckoutAuthRequiredEvents(),
                event
            ]);
            return event.id;
        },

        buildCheckoutAuthRequiredPayload(planId, context = {}) {
            const storedContext = this.sanitizeCheckoutContextForStorage(planId, context);
            return {
                eventName: 'checkout_auth_required',
                source: storedContext.source || 'auth_pending_plan',
                feature: storedContext.feature || null,
                planId: storedContext.planId || planId,
                metadata: {
                    path: window.location.pathname,
                    redirect: storedContext.redirect || null,
                    auth_mode: storedContext.authMode || null,
                    billing_interval: storedContext.billing_interval || null,
                    ...(storedContext.metadata || {})
                }
            };
        },

        queueCheckoutAuthRequiredEvent(planId, context = {}) {
            const payload = this.buildCheckoutAuthRequiredPayload(planId, context);
            return this.queueCheckoutFunnelEvent(payload);
        },

        async sendServerFunnelEvent(payload) {
            const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
            if (!csrfToken) return false;

            const res = await fetch(`${API_URL}/payment/funnel-event`, {
                method: 'POST',
                credentials: 'include',
                keepalive: true,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(payload)
            });

            return res.ok;
        },

        async flushPendingCheckoutAuthRequiredEvents() {
            if (this._flushingCheckoutAuthRequiredEvents) {
                this._flushCheckoutAuthRequiredEventsAgain = true;
                return;
            }
            const queuedEvents = this.getQueuedCheckoutAuthRequiredEvents();
            if (!queuedEvents.length) return;

            this._flushingCheckoutAuthRequiredEvents = true;
            const remaining = [];
            const attemptedIds = new Set(queuedEvents.map((event) => event.id));
            try {
                for (const event of queuedEvents) {
                    try {
                        const sent = await this.sendServerFunnelEvent(event.payload);
                        if (!sent) remaining.push(event);
                    } catch {
                        remaining.push(event);
                    }
                }
                const newlyQueuedEvents = this
                    .getQueuedCheckoutAuthRequiredEvents()
                    .filter((event) => !attemptedIds.has(event.id));
                this.setQueuedCheckoutAuthRequiredEvents([
                    ...remaining,
                    ...newlyQueuedEvents
                ]);
            } finally {
                this._flushingCheckoutAuthRequiredEvents = false;
                if (this._flushCheckoutAuthRequiredEventsAgain) {
                    this._flushCheckoutAuthRequiredEventsAgain = false;
                    if (this.getQueuedCheckoutAuthRequiredEvents().length) {
                        window.setTimeout(() => {
                            void this.flushPendingCheckoutAuthRequiredEvents();
                        }, 0);
                    }
                }
            }
        },

        setPendingCheckout(planId, context = {}) {
            if (!planId) return;

            const storedContext = this.sanitizeCheckoutContextForStorage(planId, context);
            if (!storedContext.planId) return;

            sessionStorage.setItem(PENDING_PLAN_KEY, storedContext.planId);
            sessionStorage.setItem(PENDING_CONTEXT_KEY, JSON.stringify(storedContext));
        },

        clearPendingCheckout() {
            sessionStorage.removeItem(PENDING_PLAN_KEY);
            sessionStorage.removeItem(PENDING_CONTEXT_KEY);
        },

        async trackCheckoutAuthRequired(planId, context = {}) {
            try {
                await this.sendServerFunnelEvent(this.buildCheckoutAuthRequiredPayload(planId, context));
            } catch (error) {
                console.warn('[FUNNEL] Could not record checkout auth requirement:', error.message);
            }
        },

        async trackCheckoutPostVerificationEvent(eventName, planId, context = {}) {
            try {
                const storedContext = this.sanitizeCheckoutContextForStorage(planId, context);
                await this.sendServerFunnelEvent({
                    eventName,
                    source: storedContext.source || 'auth_pending_plan',
                    feature: storedContext.feature || null,
                    planId: storedContext.planId || planId,
                    metadata: {
                        path: window.location.pathname,
                        redirect: storedContext.redirect || null,
                        auth_mode: storedContext.authMode || null,
                        billing_interval: storedContext.billing_interval || null,
                        ...(storedContext.metadata || {})
                    }
                });
            } catch (error) {
                console.warn('[FUNNEL] Could not record post-verification checkout event:', error.message);
            }
        },

        flushCheckoutPostVerificationEvent(eventName, planId, context = {}) {
            return Promise.race([
                this.trackCheckoutPostVerificationEvent(eventName, planId, context),
                new Promise((resolve) => {
                    window.setTimeout(resolve, POST_VERIFICATION_EVENT_FLUSH_TIMEOUT_MS);
                })
            ]);
        },

        startPlanCheckout(planId, context = {}) {
            if (!planId) return;

            if (!this.isLoggedIn()) {
                const redirectTarget = typeof context.redirect === 'string' && context.redirect.startsWith('/') && !context.redirect.startsWith('//')
                    ? context.redirect
                    : '/cenik.html';
                const authMode = context.authMode === 'login' ? 'login' : 'register';
                const checkoutContext = {
                    ...context,
                    redirect: redirectTarget,
                    authMode
                };

                this.setPendingCheckout(planId, checkoutContext);
                this.queueCheckoutAuthRequiredEvent(planId, checkoutContext);

                const authUrl = new URL('/prihlaseni.html', window.location.origin);
                authUrl.searchParams.set('mode', authMode);
                authUrl.searchParams.set('redirect', redirectTarget);
                authUrl.searchParams.set('plan', planId);

                if (context.source) authUrl.searchParams.set('source', context.source);
                if (context.feature) authUrl.searchParams.set('feature', context.feature);
                appendCheckoutContextToAuthUrl(authUrl, checkoutContext);

                window.location.href = `${authUrl.pathname}${authUrl.search}`;
                return;
            }

            this._startCheckout(planId, context);
        },

        buildCheckoutRecoveryUrl(planId, context = {}, reason = 'session_failed') {
            const target = typeof context.redirect === 'string' && context.redirect.startsWith('/') && !context.redirect.startsWith('//')
                ? context.redirect
                : '/cenik.html';
            const url = new URL(target, window.location.origin);
            const metadata = context.metadata && typeof context.metadata === 'object' && !Array.isArray(context.metadata)
                ? context.metadata
                : {};
            const source = context.source || this.getPendingCheckoutContext().source || 'auth_pending_plan';
            const feature = context.feature || metadata.entry_feature || null;

            url.searchParams.set('payment', 'failure');
            url.searchParams.set('reason', reason);
            if (planId) url.searchParams.set('plan', planId);
            if (source) url.searchParams.set('source', source);
            if (feature) url.searchParams.set('feature', feature);
            const billingInterval = context.billing_interval || context.billingInterval || null;
            if (billingInterval) url.searchParams.set('billing_interval', String(billingInterval));

            const paramMap = {
                entry_source: 'entry_source',
                'entry_feature': 'entry_feature',
                utm_source: 'utm_source',
                utm_medium: 'utm_medium',
                utm_campaign: 'utm_campaign',
                utm_content: 'utm_content',
                requested_card: 'card',
                card_param: 'card'
            };

            Object.entries(paramMap).forEach(([key, param]) => {
                if (metadata[key] && !url.searchParams.has(param)) {
                    url.searchParams.set(param, String(metadata[key]));
                }
            });

            return `${url.pathname}${url.search}${url.hash}`;
        },

        async logout() {
            // Call server logout endpoint to clear HttpOnly cookie
            const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                }
            }).catch(e => console.warn('Logout API call failed:', e));

            // Clear local state
            this.user = null;
            localStorage.removeItem('auth_user');
            this.updateUI();
            window.location.reload();
        },

        // Indicator cookie přežila, ale server session je neplatná (401/403 z profilu).
        // Lokální úklid bez volání serveru a bez reloadu — jinak by uživatel viděl
        // přihlášené UI bez funkčního účtu a bez CTA na registraci/login.
        clearStaleSession() {
            document.cookie = 'logged_in=; Max-Age=0; path=/';
            this.user = null;
            localStorage.removeItem('auth_user');
            this.updateUI();
        },

        // Premium activation removed - redirects to pricing page
        async activatePremium() {
            window.location.href = 'cenik.html';
        },

        updateUI() {
            // Desktop auth buttons
            const authBtn = document.getElementById('auth-btn');
            const regBtn = document.getElementById('auth-register-btn');
            const profileLink = document.getElementById('profile-link');

            // Mobile auth buttons (inside hamburger menu)
            const mobileAuthBtn = document.getElementById('mobile-auth-btn');
            const mobileRegBtn = document.getElementById('mobile-auth-register-btn');
            const mobileProfileLink = document.getElementById('mobile-profile-link');

            if (!authBtn && !mobileAuthBtn) return;

            if (this.isLoggedIn()) {
                // Desktop
                if (authBtn) {
                    setAuthButtonPremiumLabel(authBtn, this.isPremium());
                }
                setHidden(regBtn, true);
                setHidden(profileLink, false);

                // Mobile
                if (mobileAuthBtn) {
                    mobileAuthBtn.textContent = 'Odhlásit se';
                }
                setHidden(mobileRegBtn, true);
                setHidden(mobileProfileLink, false);
            } else {
                // Desktop
                if (regBtn) {
                    regBtn.href = '/prihlaseni.html?mode=register&source=header_register&feature=account';
                }
                if (authBtn) {
                    authBtn.textContent = 'Přihlásit';
                    authBtn.href = '/prihlaseni.html?source=header_login';
                }
                setHidden(regBtn, false);
                setHidden(profileLink, true);

                // Mobile
                if (mobileRegBtn) {
                    mobileRegBtn.href = '/prihlaseni.html?mode=register&source=mobile_menu&feature=account';
                }
                if (mobileAuthBtn) {
                    mobileAuthBtn.textContent = 'Přihlásit se';
                    mobileAuthBtn.href = '/prihlaseni.html?source=mobile_menu_login';
                }
                setHidden(mobileRegBtn, false);
                setHidden(mobileProfileLink, true);
            }

            // Hero CTA Logic
            const heroCta = document.getElementById('hero-cta-container');
            const heroCtaLoggedIn = document.getElementById('hero-cta-logged-in');
            setHidden(heroCta, this.isLoggedIn());
            setHidden(heroCtaLoggedIn, !this.isLoggedIn());

            // Notify other components (like profile.js) that auth state changed
            document.dispatchEvent(new Event('auth:changed'));
        },

        // Modal Logic
        setupListeners() {
            // Global Delegation for dynamic elements (Header + Mobile buttons)
            document.body.addEventListener('click', (e) => {
                // Register Button (Header or Mobile)
                const registerBtn = e.target.closest('#auth-register-btn, #mobile-auth-register-btn');
                if (registerBtn) {
                    if (hasStandaloneAuthHref(registerBtn)) {
                        return;
                    }
                    e.preventDefault();
                    this.openModal('register');
                    return;
                }

                // Hero CTA Button (Index) now uses dedicated registration page
                const heroBtn = e.target.closest('#hero-cta-btn');
                if (heroBtn) {
                    return;
                }

                // Guest profile CTA uses dedicated login page with redirect back
                const profileLoginBtn = e.target.closest('#profile-login-btn');
                if (profileLoginBtn) {
                    return;
                }

                // Login/Logout Button (Header or Mobile)
                const authBtn = e.target.closest('#auth-btn, #mobile-auth-btn');
                if (authBtn) {
                    if (!this.isLoggedIn() && hasStandaloneAuthHref(authBtn)) {
                        return;
                    }
                    e.preventDefault();
                    if (this.isLoggedIn()) {
                        this.logout();
                    } else {
                        this.openModal('login');
                    }
                    return;
                }

                // Modal Close Button
                const closeBtn = e.target.closest('.modal__close');
                if (closeBtn) {
                    this.closeModal();
                    return;
                }
            });

            // Forms (Static inside modal, safe to bind directly if modal exists)
            // But better to delegate too in case injectModal hasn't run yet? 
            // The modal is now injected lazily, so delegated listeners stay safest.
            // Let's keep form listener simple or delegate it too.
            // Actually, let's look at the existing form listener...
            // It relies on getElementById('login-form').

            // Let's bind the form listener to document as well for safety
            document.body.addEventListener('submit', async (e) => {
                if (e.target.id === 'login-form') {
                    if (this.isStandaloneAuthPage()) return;

                    e.preventDefault();
                    const form = e.target;
                    const btn = document.getElementById('auth-submit');

                    // Password reset mode
                    if (btn && btn.dataset.mode === 'reset') {
                        const resetEmail = form.reset_email?.value || form.email.value;
                        if (resetEmail) await this.resetPassword(resetEmail);
                        return;
                    }

                    const email = form.email.value;
                    const password = form.password.value;
                    const isRegister = btn && btn.textContent === 'Zaregistrovat';

                    if (isRegister) {
                        const confirmPassword = form.confirm_password?.value;
                        const birthDate = form.birth_date?.value;
                        const legalConsent = form.gdpr_consent?.checked === true;

                        if (password.length < PASSWORD_MIN_LENGTH) {
                            this.showToast('Chyba', `Heslo musí mít alespoň ${PASSWORD_MIN_LENGTH} znaků.`, 'error');
                            return;
                        }
                        if (password !== confirmPassword) {
                            this.showToast('Chyba', 'Hesla se neshodují.', 'error');
                            return;
                        }
                        if (!legalConsent) {
                            this.showToast(
                                'Souhlas je potřeba',
                                'Pro vytvoření účtu přijměte obchodní podmínky a potvrďte seznámení se zásadami soukromí.',
                                'error'
                            );
                            form.gdpr_consent?.focus();
                            return;
                        }
                        const res = await this.register(email, password, {
                            first_name: form.first_name?.value || undefined,
                            birth_date: birthDate,
                            birth_place: form.birth_place?.value || undefined,
                            password_confirm: confirmPassword,
                            gdpr_consent: legalConsent,
                            terms_consent: legalConsent
                        });
                        if (!res.success) this.showToast('Chyba registrace', res.error, 'error');
                    } else {
                        const res = await this.login(email, password);
                        if (!res.success) this.showToast('Chyba přihlášení', res.error, 'error');
                        else this.showToast('Vítej zpět', 'Přihlášení proběhlo úspěšně.', 'success');
                    }
                }
            });



            // Toggle Button inside Modal
            document.body.addEventListener('click', (e) => {
                if (this.isStandaloneAuthPage()) return;

                if (e.target.id === 'auth-mode-toggle') {
                    e.preventDefault();
                    this.toggleMode();
                }
                // Forgot Password Link
                if (e.target.id === 'auth-forgot-password') {
                    e.preventDefault();
                    this.openForgotPassword();
                }
            });
        },

        openForgotPassword() {
            const title = document.getElementById('auth-title');
            const btn = document.getElementById('auth-submit');
            const toggleBtn = document.getElementById('auth-mode-toggle');
            const pwField = document.getElementById('password-field-wrapper');
            const forgotLink = document.getElementById('forgot-password-link');
            const resetFields = document.getElementById('reset-password-fields');
            const registerFields = document.getElementById('register-fields');

            if (title) title.textContent = 'Obnovení hesla';
            if (btn) { btn.textContent = 'Odeslat odkaz'; btn.dataset.mode = 'reset'; }
            if (toggleBtn) toggleBtn.textContent = 'Zpět na přihlášení';
            setHidden(pwField, true);
            setHidden(forgotLink, true);
            setHidden(resetFields, false);
            setHidden(registerFields, true);
        },

        async resetPassword(email) {
            try {
                const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
                const res = await fetch(`${API_URL}/auth/forgot-password`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                    },
                    body: JSON.stringify({ email })
                });
                if (res.ok) {
                    this.showToast('E-mail odeslán', 'Odkaz pro obnovení hesla najdeš ve své e-mailové schránce.', 'success');
                    this.closeModal();
                } else {
                    this.showToast('Chyba', 'E-mail se nepodařilo odeslat. Zkus to znovu.', 'error');
                }
            } catch (e) {
                this.showToast('Chyba připojení', 'Ověř připojení k internetu.', 'error');
            }
        },


        toggleMode() {
            const title = document.getElementById('auth-title');
            const btn = document.getElementById('auth-submit');
            const toggleBtn = document.getElementById('auth-mode-toggle');

            if (!title || !btn || !toggleBtn) return;

            // If in reset mode, go back to login
            if (btn.dataset.mode === 'reset') {
                delete btn.dataset.mode;
                const pwField = document.getElementById('password-field-wrapper');
                const forgotLink = document.getElementById('forgot-password-link');
                const resetFields = document.getElementById('reset-password-fields');
                const registerFields = document.getElementById('register-fields');
                const confirmPwField = document.getElementById('confirm-password-field-wrapper');
                const gdprWrapper = document.getElementById('gdpr-consent-wrapper');
                title.textContent = 'Přihlášení';
                btn.textContent = 'Přihlásit se';
                toggleBtn.textContent = 'Nemáš účet? Zaregistruj se';
                setHidden(pwField, false);
                setHidden(forgotLink, false);
                setHidden(resetFields, true);
                setHidden(registerFields, true);
                setHidden(confirmPwField, true);
                setHidden(gdprWrapper, true);
                setGdprRequirement(false);
                return;
            }

            const isLogin = btn.textContent === 'Přihlásit se';

            const fields = document.getElementById('register-fields');
            const confirmPwField = document.getElementById('confirm-password-field-wrapper');
            const gdprWrapper = document.getElementById('gdpr-consent-wrapper');

            if (isLogin) {
                title.textContent = 'Registrace';
                btn.textContent = 'Zaregistrovat';
                toggleBtn.textContent = 'Už máš účet? Přihlas se';
                setHidden(fields, false);
                setHidden(confirmPwField, false);
                setHidden(gdprWrapper, false);
                setGdprRequirement(true);
            } else {
                title.textContent = 'Přihlášení';
                btn.textContent = 'Přihlásit se';
                toggleBtn.textContent = 'Nemáš účet? Zaregistruj se';
                setHidden(fields, true);
                setHidden(confirmPwField, true);
                setHidden(gdprWrapper, true);
                setGdprRequirement(false);
            }
        },


        openModal(mode = 'login') {
            // Auto-inject if missing
            if (!document.getElementById('auth-modal')) this.injectModal();
            this.bindModalListeners();

            const modal = document.getElementById('auth-modal');
            if (modal) {
                const title = document.getElementById('auth-title');
                const btn = document.getElementById('auth-submit');
                const toggleBtn = document.getElementById('auth-mode-toggle');
                if (!title || !btn || !toggleBtn) return;

                const wasHidden = modal.hidden;
                if (wasHidden) {
                    this.modalReturnFocusElement = document.activeElement instanceof HTMLElement
                        ? document.activeElement
                        : null;
                    this.modalAddedBodyScrollLockClass = !document.body.classList.contains('auth-modal-open');
                }
                modal.hidden = false;

                // Set correct mode
                if (wasHidden) {
                    this.setModalBackgroundInert(modal, true);
                    document.body.classList.add('auth-modal-open');
                }

                const fields = document.getElementById('register-fields');
                const confirmPwField = document.getElementById('confirm-password-field-wrapper');
                const gdprWrapper = document.getElementById('gdpr-consent-wrapper');

                if (mode === 'register') {
                    title.textContent = 'Registrace';
                    btn.textContent = 'Zaregistrovat';
                    toggleBtn.textContent = 'Už máš účet? Přihlas se';
                    setHidden(fields, false);
                    setHidden(confirmPwField, false);
                    setHidden(gdprWrapper, false);
                    setGdprRequirement(true);
                } else {
                    title.textContent = 'Přihlášení';
                    btn.textContent = 'Přihlásit se';
                    toggleBtn.textContent = 'Nemáš účet? Zaregistruj se';
                    setHidden(fields, true);
                    setHidden(confirmPwField, true);
                    setHidden(gdprWrapper, true);
                    setGdprRequirement(false);
                }

                const firstInput = this.getModalFocusableElements(modal)
                    .find((element) => element.matches('input:not([type="hidden"])'));
                window.requestAnimationFrame(() => {
                    if (modal.hidden) return;
                    (firstInput || modal).focus({ preventScroll: true });
                });
            }
        },

        closeModal() {
            const modal = document.getElementById('auth-modal');
            if (!modal || modal.hidden) return;

            modal.hidden = true;
            this.setModalBackgroundInert(modal, false);
            if (this.modalAddedBodyScrollLockClass) {
                document.body.classList.remove('auth-modal-open');
            }
            this.modalAddedBodyScrollLockClass = false;

            const returnFocus = this.modalReturnFocusElement;
            this.modalReturnFocusElement = null;
            if (returnFocus?.isConnected) {
                window.requestAnimationFrame(() => returnFocus.focus({ preventScroll: true }));
            }
        },

        // API Wrapper for protected calls
        async fetchProtected(endpoint, body) {
            if (!this.isLoggedIn()) {
                this.openModal();
                throw new Error('Auth Required');
            }

            const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
            const res = await fetch(`${API_URL}/${endpoint}`, {
                method: 'POST',
                credentials: 'include', // Send auth_token cookie
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                    // No longer need Authorization header - token is in cookie
                },
                body: JSON.stringify(body)
            });

            if (res.status === 401) {
                this.logout();
                throw new Error('Session expired');
            }
            if (res.status === 402 || res.status === 403) {
                this.showToast('Je potřeba členství', 'Tato funkce je součástí členství Mystické Hvězdy.', 'info');
                throw new Error('Premium Required');
            }

            return res;
        },


        async saveReading(type, data) {
            if (!this.isLoggedIn()) return null;

            try {
                const headers = { 'Content-Type': 'application/json' };
                const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
                if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

                const res = await fetch(`${API_URL}/user/readings`, {
                    method: 'POST',
                    credentials: 'include', // Send auth_token cookie
                    headers,
                    body: JSON.stringify({ type, data })
                });

                if (!res.ok) {
                    const err = await res.json();
                    console.warn('Failed to save reading:', err);
                    return null;
                } else {
                    const savedData = await res.json();
                    const savedReading = savedData.reading || savedData;
                    this.trackEventSafely('feature_reading_saved', {
                        feature: type,
                        reading_type: type,
                        source: 'auth_save_reading',
                        has_saved_id: Boolean(savedReading?.id)
                    });

                    if (type !== 'journal') {
                        try {
                            if (!localStorage.getItem('mh_first_value_completed')) {
                                localStorage.setItem('mh_first_value_completed', '1');
                                this.trackEventSafely('first_value_completed', {
                                    feature: type,
                                    reading_type: type,
                                    source: 'auth_save_reading'
                                });
                            }
                        } catch {
                            this.trackEventSafely('first_value_completed', {
                                feature: type,
                                reading_type: type,
                                source: 'auth_save_reading'
                            });
                        }
                    }

                    window.dispatchEvent?.(new CustomEvent('reading:saved', {
                        detail: { reading: savedReading, type }
                    }));

                    return savedReading; // Return saved reading with ID
                }
            } catch (e) {
                console.error('Error saving reading:', e);
                return null;
            }
        },

        async saveReadingFeedback(readingId, feedback = {}) {
            if (!this.isLoggedIn() || !readingId) return null;

            try {
                const headers = { 'Content-Type': 'application/json' };
                const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
                if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

                const res = await fetch(`${API_URL}/user/readings/${encodeURIComponent(readingId)}/feedback`, {
                    method: 'PATCH',
                    credentials: 'include',
                    headers,
                    body: JSON.stringify(feedback)
                });

                const result = await res.json().catch(() => ({}));
                if (!res.ok) {
                    console.warn('Failed to save reading feedback:', result);
                    return null;
                }

                this.trackEventSafely('reading_feedback_submitted', {
                    feature: feedback.feature || null,
                    resonance: feedback.resonance || null,
                    focus: feedback.focus || null,
                    next_action: feedback.nextAction || null,
                    source: feedback.source || 'reading_feedback'
                });

                return result;
            } catch (e) {
                console.error('Error saving reading feedback:', e);
                return null;
            }
        },

        async getProfile() {
            if (!this.isLoggedIn()) return null;
            const ownerId = this.user?.id;
            try {
                const res = await fetch(`${API_URL}/auth/profile`, {
                    credentials: 'include', // Send auth_token cookie
                    headers: { 'Content-Type': 'application/json' }
                });
                if (this.user?.id !== ownerId || !this.isLoggedIn()) return null;
                if (res.status === 401 || res.status === 403) {
                    this.clearStaleSession();
                    return null;
                }
                const data = await res.json();
                if (data.success) return data.user;
                return null;
            } catch (e) {
                console.error('getProfile failed', e);
                return null;
            }
        },

        getSafeBillingPortalUrl(portalUrl) {
            if (typeof portalUrl !== 'string' || !portalUrl.trim()) return null;

            try {
                const url = new URL(portalUrl, window.location.origin);
                const isSameOrigin = url.origin === window.location.origin;
                const isStripeBillingPortal = url.protocol === 'https:' && url.hostname === 'billing.stripe.com';
                return isSameOrigin || isStripeBillingPortal ? url.href : null;
            } catch {
                return null;
            }
        },

        getCheckoutConflictRedirect(data = {}) {
            if (data.code === 'SUBSCRIPTION_PAUSED') {
                return '/profil.html?source=subscription_paused#subscription-card';
            }

            if (data.code === 'PAYMENT_METHOD_UPDATE_REQUIRED') {
                return this.getSafeBillingPortalUrl(data.portalUrl)
                    || '/profil.html?source=payment_recovery#subscription-card';
            }

            if (data.code === 'SUBSCRIPTION_ALREADY_ACTIVE') {
                return this.getSafeBillingPortalUrl(data.portalUrl)
                    || '/profil.html?source=subscription_management#subscription-card';
            }

            return null;
        },

        async _startCheckout(planId, context = {}) {
            try {
                const source = context.source || this.getPendingCheckoutContext().source || 'auth_pending_plan';
                const checkoutMetadata = getCheckoutMetadataFromParams(new URLSearchParams(), {
                    ...context,
                    source
                });
                try {
                    window.MH_ANALYTICS?.trackCheckoutStarted?.(planId, {
                        ...checkoutMetadata,
                        source,
                        feature: context.feature || null
                    });
                } catch (analyticsError) {
                    console.warn('[FUNNEL] Checkout start analytics failed:', analyticsError.message);
                }
                const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
                const res = await fetch(`${API_URL}/payment/create-checkout-session`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                    },
                    body: JSON.stringify({
                        planId,
                        source,
                        feature: context.feature || null,
                        metadata: checkoutMetadata,
                        billingInterval: context.billing_interval || context.billingInterval || null,
                        ...(context.offer && { offer: context.offer })
                    })
                });
                const data = await res.json();
                if (res.ok && data.url) {
                    this.clearPendingCheckout();
                    this.clearPostVerificationCheckout();
                    window.location.href = data.url;
                } else {
                    const conflictRedirect = res.status === 409
                        ? this.getCheckoutConflictRedirect(data)
                        : null;
                    if (conflictRedirect) {
                        this.clearPendingCheckout();
                        this.clearPostVerificationCheckout();
                        window.location.href = conflictRedirect;
                        return;
                    }
                    console.warn('Checkout session failed:', data);
                    this.clearPostVerificationCheckout();
                    window.location.href = this.buildCheckoutRecoveryUrl(planId, context, 'session_failed');
                }
            } catch (e) {
                console.error('Checkout error:', e);
                this.clearPostVerificationCheckout();
                window.location.href = this.buildCheckoutRecoveryUrl(planId, context, 'network_error');
            }
        },
    };

    // Expose to window
    window.Auth = Auth;

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        Auth.init();
    });

    // When components load, just update the UI state (buttons text)
    document.addEventListener('components:loaded', () => {
        Auth.updateUI();
    });

    // Cross-tab logout: Sync logout across browser tabs/windows
    // When auth_user is removed from localStorage in another tab, log out here too
    window.addEventListener('storage', (event) => {
        if (event.key === 'auth_user') {
            // Check if the key was removed (logout in another tab)
            if (event.newValue === null && Auth.isLoggedIn()) {
                if (window.MH_DEBUG) console.debug('Logout detected in another tab, logging out here...');
                Auth.user = null;
                Auth.updateUI();
                // Optionally show a message
                Auth.showToast('Odhlášení z jiného okna', 'V jiném okně prohlížeče proběhlo odhlášení.', 'info');
                // Don't reload - just update UI so user can login again if needed
            }
        }

        // Handle onboarding completion in another tab
        if (event.key === 'mh_onboarded' && event.newValue === '1') {
            if (window.MH_DEBUG) console.debug('Onboarding completed in another tab');
            // Could redirect if needed
        }
    });

})();
