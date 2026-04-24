document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetPasswordForm = document.getElementById('reset-password-form');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const backToLoginBtn = document.getElementById('back-to-login');
    const loginHeader = document.getElementById('login-page-title');
    const loginSubtitle = document.getElementById('login-page-subtitle');
    const authModeWrapper = document.getElementById('auth-mode-toggle')?.parentElement;
    const authSubmitBtn = document.getElementById('auth-submit');
    const toggleBtn = document.getElementById('auth-mode-toggle');
    const socialProofEl = document.getElementById('login-social-proof');
    const confirmPwWrapper = document.getElementById('confirm-password-field-wrapper');
    const confirmPwInput = document.getElementById('confirm-password-reg');
    const registerFields = document.getElementById('register-fields');
    const registerBirthDateInput = registerFields?.querySelector('input[name="birth_date"]');
    const gdprWrapper = document.getElementById('gdpr-consent-wrapper');
    const gdprConsent = document.getElementById('gdpr-consent');
    const urlParams = new URLSearchParams(window.location.search);
    const isResetMode = urlParams.get('reset') === 'true';
    const hash = window.location.hash;
    let isRegisterMode = urlParams.get('mode') === 'register' || urlParams.get('registrace') === '1';
    const redirectTarget = urlParams.get('redirect') || '/profil.html';
    const pendingPlan = sessionStorage.getItem('pending_plan') || null;

    const trackAuthView = (source = 'page_load') => {
        window.MH_ANALYTICS?.trackAuthViewed?.(isRegisterMode ? 'register' : 'login', {
            source,
            redirect_target: redirectTarget,
            pending_plan: pendingPlan
        });
    };

    const applyMode = () => {
        if (!authSubmitBtn) {
            return;
        }
        if (forgotPasswordLink) {
            forgotPasswordLink.style.display = isRegisterMode ? 'none' : 'block';
        }

        if (isRegisterMode) {
            if (loginHeader) loginHeader.textContent = 'Začněte svou cestu';
            if (loginSubtitle) loginSubtitle.textContent = 'Registrace je zdarma a zabere jen chvilku.';
            if (socialProofEl) socialProofEl.style.display = 'block';
            if (confirmPwWrapper) confirmPwWrapper.style.display = 'block';
            if (registerFields) registerFields.style.display = 'block';
            if (gdprWrapper) gdprWrapper.style.display = 'block';
            if (confirmPwInput) confirmPwInput.required = true;
            if (registerBirthDateInput) registerBirthDateInput.required = true;
            if (gdprConsent) gdprConsent.required = true;
            authSubmitBtn.textContent = 'Zaregistrovat';
            if (toggleBtn) toggleBtn.textContent = 'Máte účet? Přihlaste se';
        } else {
            if (loginHeader) loginHeader.textContent = 'Vítejte zpět';
            if (loginSubtitle) loginSubtitle.textContent = 'Přihlaste se ke svému účtu a pokračujte tam, kde jste skončili.';
            if (socialProofEl) socialProofEl.style.display = 'none';
            if (confirmPwWrapper) confirmPwWrapper.style.display = 'none';
            if (registerFields) registerFields.style.display = 'none';
            if (gdprWrapper) gdprWrapper.style.display = 'none';
            if (confirmPwInput) {
                confirmPwInput.required = false;
                confirmPwInput.value = '';
            }
            if (registerBirthDateInput) registerBirthDateInput.required = false;
            if (gdprConsent) {
                gdprConsent.required = false;
                gdprConsent.checked = false;
            }
            authSubmitBtn.textContent = 'Přihlásit se';
            if (toggleBtn) toggleBtn.textContent = 'Nemáte účet? Zaregistrujte se zdarma →';
        }
    };

    if (isResetMode && hash) {
        if (loginForm) loginForm.style.display = 'none';
        if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
        if (resetPasswordForm) resetPasswordForm.style.display = 'block';
        if (forgotPasswordLink) forgotPasswordLink.style.display = 'none';
        if (authModeWrapper) authModeWrapper.style.display = 'none';
        if (loginHeader) loginHeader.textContent = 'Obnovení hesla';
        if (loginSubtitle) loginSubtitle.textContent = 'Zadejte nové heslo a vraťte se zpět do svého účtu.';
    } else {
        applyMode();
        trackAuthView();
    }

    loginForm?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email')?.value?.trim();
        const password = document.getElementById('password')?.value || '';

        if (!window.Auth || !authSubmitBtn) {
            return;
        }

        authSubmitBtn.disabled = true;
        const originalText = authSubmitBtn.textContent;
        authSubmitBtn.textContent = isRegisterMode ? 'Registruji...' : 'Přihlašuji...';

        try {
            if (isRegisterMode) {
                const confirmPassword = confirmPwInput?.value || '';
                const birthDate = registerBirthDateInput?.value || '';
                const birthPlace = registerFields?.querySelector('input[name="birth_place"]')?.value || '';
                const firstName = registerFields?.querySelector('input[name="first_name"]')?.value || '';

                if (!birthDate) {
                    throw new Error('Datum narození je povinné.');
                }

                if (password !== confirmPassword) {
                    throw new Error('Hesla se neshodují.');
                }

                const result = await window.Auth.register(email, password, {
                    first_name: firstName || undefined,
                    birth_date: birthDate,
                    birth_place: birthPlace || undefined,
                    password_confirm: confirmPassword
                });

                if (!result.success) {
                    throw new Error(result.error || 'Registrace se nepodařila.');
                }

                window.MH_ANALYTICS?.trackAuthCompleted?.('register', {
                    method: 'email',
                    redirect_target: redirectTarget,
                    pending_plan: pendingPlan
                });
            } else {
                const result = await window.Auth.login(email, password);
                if (!result.success) {
                    throw new Error(result.error || 'Přihlášení se nepodařilo.');
                }

                window.MH_ANALYTICS?.trackAuthCompleted?.('login', {
                    method: 'email',
                    redirect_target: redirectTarget,
                    pending_plan: pendingPlan
                });

                window.Auth.showToast?.('Vítejte zpět', 'Byli jste úspěšně přihlášeni.', 'success');
            }
        } catch (error) {
            window.Auth.showToast?.('Chyba', error.message, 'error');
        } finally {
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = originalText;
        }
    });

    forgotPasswordLink?.addEventListener('click', () => {
        if (loginForm) loginForm.style.display = 'none';
        if (forgotPasswordForm) forgotPasswordForm.style.display = 'block';
        if (forgotPasswordLink) forgotPasswordLink.style.display = 'none';
        if (authModeWrapper) authModeWrapper.style.display = 'none';
        if (loginHeader) loginHeader.textContent = 'Zapomenuté heslo';
        if (loginSubtitle) loginSubtitle.textContent = 'Pošleme vám odkaz pro nastavení nového hesla.';
    });

    backToLoginBtn?.addEventListener('click', () => {
        if (loginForm) loginForm.style.display = 'block';
        if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
        if (authModeWrapper) authModeWrapper.style.display = 'block';
        applyMode();
    });

    forgotPasswordForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('forgot-email')?.value;
        const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
        const originalText = submitBtn?.textContent;

        if (!submitBtn) {
            return;
        }

        submitBtn.textContent = 'Odesílám...';
        submitBtn.disabled = true;

        try {
            const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                window.trackEvent?.('password_reset_requested', {
                    source: 'forgot_password_form'
                });
                window.Auth?.showToast?.('E-mail odeslán', data.message, 'success');
                backToLoginBtn?.click();
            } else {
                throw new Error(data.error || 'Nepodařilo se odeslat e-mail s obnovou hesla.');
            }
        } catch (error) {
            window.Auth?.showToast?.('Chyba', error.message, 'error');
        } finally {
            submitBtn.textContent = originalText || 'Odeslat odkaz pro obnovu';
            submitBtn.disabled = false;
        }
    });

    resetPasswordForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const newPassword = document.getElementById('new-password')?.value;
        const confirmPassword = document.getElementById('confirm-password')?.value;

        if (newPassword !== confirmPassword) {
            window.Auth?.showToast?.('Chyba', 'Hesla se neshodují.', 'error');
            return;
        }

        const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');
        const originalText = submitBtn?.textContent;

        if (!submitBtn) {
            return;
        }

        submitBtn.textContent = 'Ukládám...';
        submitBtn.disabled = true;

        try {
            const hashParams = new URLSearchParams(hash.substring(1));
            const accessToken = hashParams.get('access_token');

            if (!accessToken) {
                throw new Error('Neplatný odkaz pro obnovení hesla.');
            }

            const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                    ...(csrfToken && { 'X-CSRF-Token': csrfToken })
                },
                body: JSON.stringify({ password: newPassword })
            });

            const data = await response.json();

            if (data.success) {
                window.trackEvent?.('password_reset_completed', {
                    source: 'reset_password_form'
                });
                window.Auth?.showToast?.('Úspěch', 'Heslo bylo změněno. Můžete se přihlásit.', 'success');
                window.location.href = '/prihlaseni.html';
            } else {
                throw new Error(data.error || 'Nepodařilo se změnit heslo.');
            }
        } catch (error) {
            window.Auth?.showToast?.('Chyba', error.message, 'error');
        } finally {
            submitBtn.textContent = originalText || 'Nastavit nové heslo';
            submitBtn.disabled = false;
        }
    });

    toggleBtn?.addEventListener('click', () => {
        isRegisterMode = !isRegisterMode;
        applyMode();
        trackAuthView('toggle');
    });

    setTimeout(() => {
        if (window.Auth?.isLoggedIn()) {
            const redirect = urlParams.get('redirect');
            if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
                window.location.href = redirect;
            } else {
                window.location.href = '/profil.html';
            }
        }
    }, 500);
});

document.addEventListener('auth:changed', () => {
    if (window.Auth?.isLoggedIn()) {
        if (sessionStorage.getItem('pending_plan')) {
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        let redirect = urlParams.get('redirect') || '/profil.html';

        if (!redirect.startsWith('/') || redirect.startsWith('//')) {
            redirect = '/profil.html';
        }

        if (!redirect.includes('prihlaseni')) {
            window.location.href = redirect;
        }
    }
});
