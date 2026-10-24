(() => {
    const isStandaloneAuthPage = () => document.body.classList.contains('page-login');

    const setText = (selector, value) => {
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
    };

    const patchModalTexts = () => {
        setText('#auth-title', 'Přihlášení');
        setText('#auth-submit', 'Přihlásit se');
        setText('#auth-mode-toggle', 'Nemáš účet? Zaregistruj se');
        setText('#auth-forgot-password', 'Zapomenuté heslo?');
        setText('#password-field-wrapper label', 'Heslo');
        setText('#confirm-password-field-wrapper label', 'Potvrď heslo');
        setText('#reset-password-fields p', 'Zadej svůj e-mail. Pošleme ti odkaz pro obnovení hesla.');

        const registerLabels = document.querySelectorAll('#register-fields label');
        if (registerLabels[0]) registerLabels[0].textContent = 'Datum narození';

        const close = document.querySelector('.modal__close');
        if (close) {
            close.textContent = '×';
            close.setAttribute('aria-label', 'Zavřít');
        }
    };

    const patchAuthUi = () => {
        const authBtn = document.getElementById('auth-btn');
        const mobileAuthBtn = document.getElementById('mobile-auth-btn');
        const premiumLogged = authBtn?.innerHTML?.includes('Premium') || window.Auth?.isPremium?.();

        if (authBtn) {
            authBtn.innerHTML = premiumLogged
                ? 'Odhlásit <span class="auth-premium-label">(Členství)</span>'
                : 'Přihlásit';
        }

        if (document.cookie.includes('logged_in=1') || window.Auth?.user) {
            if (authBtn) {
                authBtn.innerHTML = window.Auth?.isPremium?.()
                    ? 'Odhlásit <span class="auth-premium-label">(Členství)</span>'
                    : 'Odhlásit';
            }
            if (mobileAuthBtn) mobileAuthBtn.textContent = 'Odhlásit se';
        } else {
            if (authBtn) authBtn.textContent = 'Přihlásit';
            if (mobileAuthBtn) mobileAuthBtn.textContent = 'Přihlásit se';
        }
    };

    const normalizeToast = (title, message) => {
        const normalizeKey = (value) => String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
        const compactTitle = normalizeKey(title);
        const compactMessage = normalizeKey(message);

        if (compactTitle.startsWith('overeno')) {
            return ['Ověřeno', 'E-mail je potvrzený. Teď se můžeš přihlásit.'];
        }
        if (compactTitle.includes('email') && compactTitle.includes('odes')) {
            return ['E-mail odeslán', 'Odkaz pro obnovení hesla najdeš ve své e-mailové schránce.'];
        }
        if (compactTitle.includes('email')) {
            return ['Ověření e-mailu', 'Potvrď svůj e-mail a dokonči registraci.'];
        }
        if (compactTitle.includes('premium')) {
            return ['Členství je potřeba', 'Tato funkce je součástí členství.'];
        }
        if (compactTitle.includes('odhl')) {
            return ['Odhlášení z jiného okna', 'V jiném okně prohlížeče proběhlo odhlášení.'];
        }
        if (compactTitle.includes('prihl') && compactTitle.includes('chyba')) {
            return ['Chyba přihlášení', message];
        }
        if (compactTitle.includes('pripoj')) {
            return ['Chyba připojení', 'Ověř připojení k internetu.'];
        }
        if (compactTitle.includes('obnov')) {
            return ['Obnovení hesla', 'Zadej svůj e-mail. Pošleme ti odkaz pro obnovení hesla.'];
        }
        if (compactTitle.includes('vitejte') && compactMessage.includes('registr')) {
            return ['Registrace hotová', 'Účet je připravený.'];
        }
        if (compactTitle.includes('vitejte')) {
            return ['Vítej zpět', 'Přihlášení proběhlo úspěšně.'];
        }
        if (compactTitle.includes('chyba') && (compactTitle.includes('over') || compactMessage.includes('over'))) {
            return ['Chyba ověření', 'Odkaz je neplatný nebo vypršel.'];
        }

        return [title, message];
    };

    const patchToastCopy = () => {
        if (!window.Auth || window.Auth.__toastCopyFixesApplied) return;

        const originalShowToast = window.Auth.showToast?.bind(window.Auth);
        if (!originalShowToast) return;

        window.Auth.showToast = (title, message, type = 'info') => {
            const [nextTitle, nextMessage] = normalizeToast(title, message);
            return originalShowToast(nextTitle, nextMessage, type);
        };
        window.Auth.__toastCopyFixesApplied = true;
    };

    const patchAuth = () => {
        patchToastCopy();
        if (!window.Auth || isStandaloneAuthPage() || window.Auth.__copyFixesApplied) return;

        const wrap = (methodName, after) => {
            const original = window.Auth[methodName]?.bind(window.Auth);
            if (!original) return;
            window.Auth[methodName] = (...args) => {
                const result = original(...args);
                after(...args);
                return result;
            };
        };

        wrap('openModal', (mode) => {
            patchModalTexts();

            if (mode === 'register') {
                setText('#auth-title', 'Registrace');
                setText('#auth-submit', 'Zaregistrovat');
                setText('#auth-mode-toggle', 'Už máš účet? Přihlas se');
            }
        });
        wrap('openForgotPassword', () => {
            setText('#auth-title', 'Obnovení hesla');
            setText('#auth-submit', 'Odeslat odkaz');
            setText('#auth-mode-toggle', 'Zpět na přihlášení');
            patchModalTexts();
        });
        wrap('toggleMode', () => {
            patchModalTexts();

            const title = document.getElementById('auth-title');
            const submit = document.getElementById('auth-submit');
            const toggle = document.getElementById('auth-mode-toggle');
            const isRegister = submit?.textContent?.toLowerCase().includes('zaregistrovat');

            if (isRegister) {
                if (title) title.textContent = 'Registrace';
                if (toggle) toggle.textContent = 'Už máš účet? Přihlas se';
            } else if (submit?.dataset?.mode === 'reset') {
                if (title) title.textContent = 'Obnovení hesla';
                if (submit) submit.textContent = 'Odeslat odkaz';
                if (toggle) toggle.textContent = 'Zpět na přihlášení';
            } else {
                if (title) title.textContent = 'Přihlášení';
                if (submit) submit.textContent = 'Přihlásit se';
                if (toggle) toggle.textContent = 'Nemáš účet? Zaregistruj se';
            }
        });
        wrap('updateUI', patchAuthUi);

        window.Auth.__copyFixesApplied = true;
        patchModalTexts();
        patchAuthUi();
    };

    document.addEventListener('DOMContentLoaded', () => {
        const standaloneAuthPage = isStandaloneAuthPage();

        if (!standaloneAuthPage) {
            patchModalTexts();
            patchAuthUi();
        }

        const interval = window.setInterval(() => {
            patchAuth();
            if (window.Auth?.__copyFixesApplied || (standaloneAuthPage && window.Auth?.__toastCopyFixesApplied)) {
                window.clearInterval(interval);
            }
        }, 100);

        window.setTimeout(() => window.clearInterval(interval), 5000);
    });

    document.addEventListener('auth:changed', patchAuthUi);
    document.addEventListener('components:loaded', patchAuthUi);
})();
