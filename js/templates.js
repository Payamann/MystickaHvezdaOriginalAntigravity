/**
 * Templates.js
 * Centralized string templates for UI components.
 */

(() => {
class Templates {
    static symbol(name) {
        return `<svg class="mh-symbol" width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><use href="/img/icons/mh-symbols.svg#${name}"></use></svg>`;
    }
    static animationDelayClass(step) {
        const safeStep = Math.max(0, Math.min(10, Number.parseInt(step, 10) || 0));
        return `anim-delay-step-${safeStep}`;
    }

    /**
     * Renders a Tarot card HTML string for the result view
     */
    static renderTarotResult(card, index, isMajor = true, positionLabel = '') {
        const arcanaType = isMajor ? 'Velká arkána' : 'Malá arkána';
        const delayClass = this.animationDelayClass(index);

        return `
            <div class="tarot-result-card fade-in-up ${delayClass}">
                <!-- Header Section -->
                <div class="tarot-result-header">
                    <div class="flex-between tarot-result-header__top">
                        <div>
                            <h3 class="tarot-result-title">${this.escapeHtml(String(card.name || '').toUpperCase())}</h3>
                            <div class="tarot-result-meta">
                                <span>${arcanaType.toUpperCase()}</span>
                                ${positionLabel ? `<span class="text-gold tarot-result-meta__separator">•</span> <span class="text-gold">POZICE: ${this.escapeHtml(positionLabel.toUpperCase())}</span>` : ''}
                            </div>
                        </div>
                        <div class="tarot-result-star">${this.symbol('star')}</div>
                    </div>
                </div>

                <!-- Interpretation Body -->
                <div class="tarot-result-body">
                    <div class="astrologer-note">
                        <span class="astrologer-note__icon">${this.symbol('tarot')}</span>
                        <span class="text-xs uppercase tracking-wide text-silver">SYMBOLICKÝ VÝZNAM KARTY</span>
                    </div>
                    
                    <p class="tarot-main-text">
                        ${this.escapeHtml(card.interpretation)}
                    </p>

                    <!-- Practical Advice -->
                    <div class="tarot-practical-advice">
                        <strong class="text-starlight">Hlavní motiv:</strong>
                        <span class="tarot-practical-advice__text">${this.escapeHtml(card.meaning)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    static renderSummary3Card(drawnCards) {
        return `
            <div class="tarot-summary-enhanced tarot-summary-3card fade-in-up ${this.animationDelayClass(drawnCards.length)}">
                <div class="summary-header">
                    <div class="summary-icon">${this.symbol('tarot')}</div>
                    <h4>Souvislosti tří karet</h4>
                    <p class="summary-subtitle">Co bylo, co se děje a jaký krok může následovat</p>
                </div>
                <div class="summary-timeline">
                    <div class="timeline-item">
                        <span class="timeline-emoji">${this.symbol('book')}</span>
                        <span class="timeline-label">Minulost</span>
                        <span class="timeline-card">${this.escapeHtml(drawnCards[0]?.name || '')}</span>
                    </div>
                    <div class="timeline-connector">→</div>
                    <div class="timeline-item">
                        <span class="timeline-emoji">${this.symbol('compass')}</span>
                        <span class="timeline-label">Přítomnost</span>
                        <span class="timeline-card">${this.escapeHtml(drawnCards[1]?.name || '')}</span>
                    </div>
                    <div class="timeline-connector">→</div>
                    <div class="timeline-item">
                        <span class="timeline-emoji">${this.symbol('star')}</span>
                        <span class="timeline-label">Budoucnost</span>
                        <span class="timeline-card">${this.escapeHtml(drawnCards[2]?.name || '')}</span>
                    </div>
                </div>
                <!-- AI Summary container -->
                ${this.renderEtherealSummaryLoading()}
            </div>
        `;
    }

    static renderSummaryCeltic(drawnCards) {
        return `
            <div class="tarot-summary-enhanced tarot-summary-celtic fade-in-up ${this.animationDelayClass(drawnCards.length)}">
                <div class="celtic-header">
                    <div class="celtic-cross-icon">
                        <svg width="24" height="24" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg>
                        <svg width="24" height="24" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg>
                        <svg width="24" height="24" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg>
                    </div>
                    <h4>Souvislosti keltského kříže</h4>
                    <p class="summary-subtitle">Komplexní analýza keltského kříže</p>
                </div>
                
                <div class="celtic-grid">
                    <div class="celtic-section celtic-core">
                        <h5>Jádro situace</h5>
                        <div class="celtic-cards-mini">
                            <span>${this.escapeHtml(drawnCards[0]?.name || '')}</span>
                            <span class="card-separator">×</span>
                            <span>${this.escapeHtml(drawnCards[1]?.name || '')}</span>
                        </div>
                    </div>
                    <div class="celtic-section celtic-influences">
                        <h5>Skryté vlivy</h5>
                        <div class="celtic-cards-mini">
                            <span>${this.escapeHtml(drawnCards[2]?.name || '')}</span>
                            <span class="card-separator">&</span>
                            <span>${this.escapeHtml(drawnCards[3]?.name || '')}</span>
                        </div>
                    </div>
                    <div class="celtic-section celtic-timeline">
                        <h5>Tok času</h5>
                        <div class="celtic-cards-mini">
                            <span>${this.escapeHtml(drawnCards[4]?.name || '')}</span>
                            <span class="card-separator">→</span>
                            <span>${this.escapeHtml(drawnCards[5]?.name || '')}</span>
                        </div>
                    </div>
                    <div class="celtic-section celtic-outcome">
                        <h5>Cesta k výsledku</h5>
                        <div class="celtic-cards-mini">
                            <span>${this.escapeHtml(drawnCards[6]?.name || '')}</span>
                            <span>${this.escapeHtml(drawnCards[7]?.name || '')}</span>
                            <span>${this.escapeHtml(drawnCards[8]?.name || '')}</span>
                            <span class="card-separator">→</span>
                            <span class="outcome-card">${this.escapeHtml(drawnCards[9]?.name || '')}</span>
                        </div>
                    </div>
                </div>
                
                <!-- AI Summary container -->
                ${this.renderEtherealSummaryLoading()}
                
                <div class="celtic-footer">
                    <span aria-hidden="true"><svg width="14" height="14" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg></span>
                    <span>Keltský kříž – nejkomplexnější tarotový výklad</span>
                    <span aria-hidden="true"><svg width="14" height="14" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg></span>
                </div>
            </div>
        `;
    }

    static renderSummaryDefault(drawnCards) {
        return `
            <div class="interpretation-summary fade-in-up ${this.animationDelayClass(drawnCards.length)}">
                <h4>Souvislosti výkladu</h4>
                <div id="ethereal-tarot-summary">
                    <p class="text-center tarot-summary-loading-text">
                        <span class="loading-spinner" aria-hidden="true"></span> Připravuje se výklad…
                    </p>
                </div>
            </div>
        `;
    }

    static renderEtherealSummaryLoading() {
        return `
            <div class="summary-content" id="ethereal-tarot-summary">
                <div class="summary-loading">
                    <div class="loading-crystal">
                        <span>${this.symbol('tarot')}</span>
                    </div>
                    <p>Připravuje se společný výklad…</p>
                    <small>Podle vybraných karet a tvé otázky</small>
                </div>
            </div>
        `;
    }

    /**
     * Renders a multi-step AI progress indicator
     * @param {string[]} steps - Array of step labels
     * @param {string} containerId - ID to use for the container
     */
    static renderEtherealProgress(steps = [], containerId = 'ethereal-progress') {
        const stepsHtml = steps.map((step, i) => `
            <div class="ethereal-progress-step${i === 0 ? ' active' : ''}" data-step="${i}">
                <div class="ethereal-progress-step__dot"></div>
                <span class="ethereal-progress-step__label">${this.escapeHtml(step)}</span>
            </div>
        `).join('<div class="ethereal-progress-connector"></div>');

        return `
            <div class="ethereal-progress" id="${containerId}">
                ${stepsHtml}
            </div>
        `;
    }

    /**
     * Updates which step is active in the AI progress indicator
     * @param {string} containerId 
     * @param {number} activeIndex 
     */
    static updateEtherealProgress(containerId, activeIndex) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.querySelectorAll('.ethereal-progress-step').forEach((step, i) => {
            step.classList.remove('active', 'done');
            if (i < activeIndex) step.classList.add('done');
            else if (i === activeIndex) step.classList.add('active');
        });
    }

    static authCopy() {
        const language = document.documentElement?.lang?.slice(0, 2);
        const copy = {
            sk: {
                close: 'Zavrieť prihlásenie',
                loginTitle: 'Prihlásenie',
                registerTitle: 'Registrácia',
                resetTitle: 'Obnovenie hesla',
                password: 'Heslo',
                confirmPassword: 'Potvrď heslo',
                passwordPolicy: 'Zvoľ si heslo s dĺžkou 8 až 128 znakov. Niektoré bežné heslá nie sú povolené.',
                forgotPassword: 'Zabudnuté heslo?',
                resetHelp: 'Zadaj e-mail svojho účtu. Ak ho u nás evidujeme, môže ti prísť odkaz na obnovenie hesla.',
                resetSending: 'Odosiela sa žiadosť…',
                resetSent: 'Ak je tento e-mail u nás zaregistrovaný, môže naň prísť odkaz na obnovenie hesla. Skontroluj aj spam; ak odkaz nepríde, môžeš požiadať znova.',
                resetFailed: 'Žiadosť sa nepodarilo odoslať. E-mail zostal vo formulári. Skús to znova.',
                connectionInterrupted: 'Spojenie sa prerušilo. Skontroluj pripojenie a skús to znova.',
                birthDate: 'Dátum narodenia',
                birthDateNote: 'Voliteľné. Dátum použijeme iba pri osobných výkladoch a nastavení profilu. Môžeš ho doplniť neskôr pri nástroji, ktorý ho potrebuje.',
                consentHtml: 'Súhlasím s <a href="/podminky.html" target="_blank" rel="noopener">obchodnými podmienkami (v češtine)</a> a potvrdzujem oboznámenie sa so <a href="/soukromi.html" target="_blank" rel="noopener">zásadami ochrany osobných údajov (v češtine)</a>.',
                submitLogin: 'Prihlásiť sa',
                submitRegister: 'Zaregistrovať sa',
                submitReset: 'Odoslať odkaz',
                toggleLogin: 'Nemáš účet? Zaregistruj sa',
                toggleRegister: 'Už máš účet? Prihlás sa',
                toggleReset: 'Späť na prihlásenie',
                errorTitle: 'Chyba',
                registrationErrorTitle: 'Registrácia sa nepodarila',
                loginErrorTitle: 'Prihlásenie sa nepodarilo',
                registrationNetworkError: 'Registráciu sa teraz nepodarilo dokončiť. Skús to znova o chvíľu.',
                loginNetworkError: 'Prihlásenie sa teraz nepodarilo. Skús to znova o chvíľu.',
                authFinalizationError: 'Server požiadavku prijal, ale stránke sa nepodarilo dokončiť ďalší krok. Obnov stránku a skontroluj e-mail alebo stav účtu.',
                registrationFailed: 'Registrácia sa nepodarila. Skontroluj zadané údaje a skús to znova.',
                loginFailed: 'Prihlásenie sa nepodarilo. Skontroluj e-mail a heslo.',
                registrationRecovery: 'Účet už možno existuje. Prihlás sa alebo si obnov heslo.',
                registrationRateLimited: 'Z tohto pripojenia prebehlo príliš veľa registrácií. Skús to znova neskôr.',
                loginRateLimited: 'Príliš veľa neúspešných pokusov o prihlásenie. Skús to znova neskôr.',
                resetRateLimited: 'Odoslal sa príliš veľký počet žiadostí o obnovenie hesla. Skús to znova neskôr.',
                passwordMin: 'Heslo musí mať aspoň {length} znakov.',
                passwordTooLong: 'Heslo môže mať najviac 128 znakov.',
                passwordCommon: 'Toto heslo sa používa príliš často. Zvoľ si iné.',
                passwordMismatch: 'Heslá sa nezhodujú.',
                consentRequiredTitle: 'Vyžaduje sa súhlas',
                consentRequired: 'Na vytvorenie účtu prijmi obchodné podmienky a potvrď oboznámenie sa so zásadami ochrany osobných údajov.',
                verificationTitle: 'Overenie e-mailu',
                verificationMessage: 'Na dokončenie registrácie potvrď svoju e-mailovú adresu.',
                welcomeTitle: 'Vitaj!',
                registrationSuccess: 'Registrácia prebehla úspešne.',
                loginSuccessTitle: 'Vitaj späť',
                loginSuccess: 'Prihlásenie prebehlo úspešne.',
                verifiedTitle: 'Overené!',
                verifiedMessage: 'Tvoj e-mail bol úspešne overený. Teraz sa môžeš prihlásiť.',
                invalidLink: 'Odkaz je neplatný alebo jeho platnosť vypršala.',
                expiredLink: 'Platnosť odkazu na overenie vypršala. Skús to znova.'
            },
            pl: {
                close: 'Zamknij logowanie',
                loginTitle: 'Logowanie',
                registerTitle: 'Rejestracja',
                resetTitle: 'Resetowanie hasła',
                password: 'Hasło',
                confirmPassword: 'Potwierdź hasło',
                passwordPolicy: 'Wybierz hasło o długości od 8 do 128 znaków. Niektóre popularne hasła są niedozwolone.',
                forgotPassword: 'Nie pamiętasz hasła?',
                resetHelp: 'Wpisz adres e-mail swojego konta. Jeśli jest u nas zarejestrowany, możesz otrzymać link do zmiany hasła.',
                resetSending: 'Wysyłanie prośby…',
                resetSent: 'Jeśli konto z tym adresem e-mail jest u nas zarejestrowane, możesz otrzymać link do zmiany hasła. Sprawdź też spam; jeśli link nie dotrze, możesz ponowić prośbę.',
                resetFailed: 'Nie udało się wysłać prośby. Adres e-mail pozostał w formularzu. Spróbuj ponownie.',
                connectionInterrupted: 'Połączenie zostało przerwane. Sprawdź internet i spróbuj ponownie.',
                birthDate: 'Data urodzenia',
                birthDateNote: 'Opcjonalnie. Użyjemy tej daty tylko do spersonalizowanych interpretacji i ustawień profilu. Możesz dodać ją później przy narzędziu, które jej potrzebuje.',
                consentHtml: 'Akceptuję <a href="/podminky.html" target="_blank" rel="noopener">regulamin (w języku czeskim)</a> i potwierdzam zapoznanie się z <a href="/soukromi.html" target="_blank" rel="noopener">polityką prywatności (w języku czeskim)</a>.',
                submitLogin: 'Zaloguj się',
                submitRegister: 'Zarejestruj się',
                submitReset: 'Wyślij link',
                toggleLogin: 'Nie masz konta? Zarejestruj się',
                toggleRegister: 'Masz już konto? Zaloguj się',
                toggleReset: 'Wróć do logowania',
                errorTitle: 'Błąd',
                registrationErrorTitle: 'Rejestracja nie powiodła się',
                loginErrorTitle: 'Logowanie nie powiodło się',
                registrationNetworkError: 'Nie udało się teraz dokończyć rejestracji. Spróbuj ponownie za chwilę.',
                loginNetworkError: 'Nie udało się teraz zalogować. Spróbuj ponownie za chwilę.',
                authFinalizationError: 'Serwer przyjął żądanie, ale strona nie mogła dokończyć kolejnego kroku. Odśwież stronę i sprawdź e-mail lub stan konta.',
                registrationFailed: 'Rejestracja nie powiodła się. Sprawdź wpisane dane i spróbuj ponownie.',
                loginFailed: 'Logowanie nie powiodło się. Sprawdź adres e-mail i hasło.',
                registrationRecovery: 'Konto może już istnieć. Zaloguj się lub zresetuj hasło.',
                registrationRateLimited: 'Z tego połączenia wykonano zbyt wiele rejestracji. Spróbuj ponownie później.',
                loginRateLimited: 'Zbyt wiele nieudanych prób logowania. Spróbuj ponownie później.',
                resetRateLimited: 'Wysłano zbyt wiele próśb o zmianę hasła. Spróbuj ponownie później.',
                passwordMin: 'Hasło musi mieć co najmniej {length} znaków.',
                passwordTooLong: 'Hasło może mieć maksymalnie 128 znaków.',
                passwordCommon: 'To hasło jest zbyt często używane. Wybierz inne.',
                passwordMismatch: 'Hasła nie są takie same.',
                consentRequiredTitle: 'Wymagana zgoda',
                consentRequired: 'Aby utworzyć konto, zaakceptuj regulamin i potwierdź zapoznanie się z polityką prywatności.',
                verificationTitle: 'Potwierdzenie adresu e-mail',
                verificationMessage: 'Aby dokończyć rejestrację, potwierdź swój adres e-mail.',
                welcomeTitle: 'Witaj!',
                registrationSuccess: 'Rejestracja przebiegła pomyślnie.',
                loginSuccessTitle: 'Witaj ponownie',
                loginSuccess: 'Logowanie przebiegło pomyślnie.',
                verifiedTitle: 'Potwierdzono!',
                verifiedMessage: 'Twój adres e-mail został potwierdzony. Możesz się teraz zalogować.',
                invalidLink: 'Link jest nieprawidłowy lub wygasł.',
                expiredLink: 'Link potwierdzający wygasł. Spróbuj ponownie.'
            }
        };

        return copy[language] || {
            close: 'Zavřít přihlášení',
            loginTitle: 'Přihlášení',
            registerTitle: 'Registrace',
            resetTitle: 'Obnovení hesla',
            password: 'Heslo',
            confirmPassword: 'Potvrď heslo',
            passwordPolicy: 'Zvol heslo dlouhé 8 až 128 znaků. Některá běžná hesla nejsou povolena.',
            forgotPassword: 'Zapomněl jsi heslo?',
            resetHelp: 'Zadej e-mail svého účtu. Pokud je u nás vedený, může na něj přijít odkaz pro obnovení hesla.',
            resetSending: 'Odesílá se žádost…',
            resetSent: 'Pokud je účet s tímto e-mailem vedený, může na něj přijít odkaz k obnovení hesla. Zkontroluj i spam; pokud odkaz nedorazí, můžeš žádost zopakovat.',
            resetFailed: 'Žádost se nepodařilo odeslat. E-mail zůstává ve formuláři, zkus to znovu.',
            connectionInterrupted: 'Spojení se přerušilo. Zkontroluj připojení a zkus to znovu.',
            birthDate: 'Datum narození',
            birthDateNote: 'Nepovinné. Datum použijeme jen pro osobní výklady a nastavení profilu; můžeš ho doplnit později u nástroje, který ho opravdu potřebuje.',
            consentHtml: 'Souhlasím s <a href="/podminky.html" target="_blank" rel="noopener">obchodními podmínkami</a> a potvrzuji seznámení se <a href="/soukromi.html" target="_blank" rel="noopener">zásadami soukromí</a>.',
            submitLogin: 'Přihlásit se',
            submitRegister: 'Zaregistrovat',
            submitReset: 'Odeslat odkaz',
            toggleLogin: 'Nemáte účet? Zaregistrujte se',
            toggleRegister: 'Již máte účet? Přihlaste se',
            toggleReset: 'Zpět na přihlášení',
            errorTitle: 'Chyba',
            registrationErrorTitle: 'Chyba registrace',
            loginErrorTitle: 'Chyba přihlášení',
            registrationNetworkError: 'Registraci se teď nepodařilo dokončit. Zkus to znovu za chvíli.',
            loginNetworkError: 'Přihlášení se teď nepodařilo. Zkus to znovu za chvíli.',
            authFinalizationError: 'Server požadavek přijal, ale stránce se nepodařilo dokončit další krok. Obnov stránku a zkontroluj e-mail nebo stav účtu.',
            registrationFailed: 'Registrace se nepodařila. Zkontroluj zadané údaje a zkus to znovu.',
            loginFailed: 'Přihlášení se nepodařilo. Zkontroluj e-mail a heslo.',
            registrationRecovery: 'Účet už možná existuje. Přihlas se nebo si obnov heslo.',
            registrationRateLimited: 'Z tohoto připojení proběhlo příliš mnoho registrací. Zkus to znovu později.',
            loginRateLimited: 'Příliš mnoho neúspěšných pokusů o přihlášení. Zkus to znovu později.',
            resetRateLimited: 'Odeslalo se příliš mnoho žádostí o obnovení hesla. Zkus to znovu později.',
            passwordMin: 'Heslo musí mít alespoň {length} znaků.',
            passwordTooLong: 'Heslo může mít nejvýše 128 znaků.',
            passwordCommon: 'Toto heslo je příliš časté. Zvol jiné.',
            passwordMismatch: 'Hesla se neshodují.',
            consentRequiredTitle: 'Souhlas je potřeba',
            consentRequired: 'Pro vytvoření účtu přijmi obchodní podmínky a potvrď seznámení se zásadami soukromí.',
            verificationTitle: 'Ověření e-mailu',
            verificationMessage: 'Pro dokončení registrace potvrď svou e-mailovou adresu.',
            welcomeTitle: 'Vítej!',
            registrationSuccess: 'Registrace proběhla úspěšně.',
            loginSuccessTitle: 'Vítej zpět',
            loginSuccess: 'Přihlášení proběhlo úspěšně.',
            verifiedTitle: 'Ověřeno!',
            verifiedMessage: 'Tvůj e-mail byl úspěšně ověřen. Nyní se můžeš přihlásit.',
            invalidLink: 'Odkaz je neplatný nebo vypršel.',
            expiredLink: 'Odkaz pro ověření vypršel. Zkus to znovu.'
        };
    }

    static renderAuthModal(copy = Templates.authCopy()) {
        return `
  <div id="auth-modal" class="modal modal--auth" role="dialog" aria-modal="true" aria-labelledby="auth-title" hidden>
    <div class="modal__content auth-modal__content">
        <button type="button" class="modal__close auth-modal__close" aria-label="${copy.close}"><svg class="mh-symbol mh-symbol--inline" width="18" height="18" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#close"></use></svg></button>
        <h2 id="auth-title" class="auth-modal__title">${copy.loginTitle}</h2>
        <form id="login-form">
            <div class="auth-modal__field">
                <label class="auth-modal__label" for="auth-modal-email">E-mail</label>
                <input class="auth-modal__input" id="auth-modal-email" type="email" name="email" required autocomplete="email" inputmode="email">
            </div>
            <div id="password-field-wrapper" class="auth-modal__field auth-modal__field--compact">
                <label class="auth-modal__label" for="auth-modal-password">${copy.password}</label>
                <input class="auth-modal__input" id="auth-modal-password" type="password" name="password" required autocomplete="current-password">
                <p id="auth-password-policy" class="auth-modal__help-text" hidden>${copy.passwordPolicy}</p>
            </div>
            <div id="confirm-password-field-wrapper" class="auth-modal__field" hidden>
                <label class="auth-modal__label" for="auth-modal-password-confirm">${copy.confirmPassword}</label>
                <input class="auth-modal__input" id="auth-modal-password-confirm" type="password" name="confirm_password" autocomplete="new-password">
            </div>
            <div id="forgot-password-link" class="auth-modal__forgot">
                <a href="#" id="auth-forgot-password" class="auth-modal__muted-link">${copy.forgotPassword}</a>
            </div>

            <!-- Reset Password Fields (hidden by default) -->
            <div id="reset-password-fields" class="auth-modal__field" hidden>
                <p class="auth-modal__help-text">${copy.resetHelp}</p>
            </div>

            <!-- Optional profile fields. Keep birth data clearly explained and non-blocking. -->
            <div id="register-fields" class="auth-modal__field" hidden>
                <div class="auth-modal__field">
                    <label class="auth-modal__label" for="auth-modal-birthdate">${copy.birthDate}</label>
                    <input class="auth-modal__input" id="auth-modal-birthdate" type="date" name="birth_date" autocomplete="bday" aria-describedby="birth-date-privacy-note">
                    <p id="birth-date-privacy-note" class="auth-modal__help-text">${copy.birthDateNote}</p>
                </div>
            </div>

            <div id="gdpr-consent-wrapper" class="auth-modal__field" hidden>
                <label class="checkbox-label">
                    <input type="checkbox" id="gdpr-consent" name="gdpr_consent">
                <span>${copy.consentHtml}</span>
                </label>
            </div>

            <p id="auth-modal-status" class="auth-modal__help-text" role="status" hidden></p>
            <button type="submit" id="auth-submit" class="btn btn--primary auth-modal__submit" data-mode="login">${copy.submitLogin}</button>
            <p class="auth-modal__toggle-wrap">
                <a href="#" id="auth-mode-toggle" class="auth-modal__mode-toggle">${copy.toggleLogin}</a>
            </p>
        </form>
    </div>
  </div>`;
    }

    static renderAuthorBox(author) {
        if (!author) return '';
        
        return `
            <div class="author-box">
                <div class="author-box__avatar">
                    <img class="author-box__image" src="${author.image}" alt="${author.name}" width="80" height="80">
                </div>
                <div class="author-box__content">
                    <h4 class="author-box__name">${author.name}</h4>
                    <p class="author-box__role">${author.role}</p>
                    <p class="author-box__bio">${author.bio}</p>
                    ${author.links ? `
                        <div class="author-box__links">
                            ${author.links.instagram ? `<a class="author-box__link" href="${author.links.instagram}" target="_blank" rel="noopener">Instagram ↗</a>` : ''}
                            ${author.links.facebook ? `<a class="author-box__link" href="${author.links.facebook}" target="_blank" rel="noopener">Facebook ↗</a>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    static escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Attach to window for browser usage
if (typeof window !== 'undefined') {
    window.Templates = Templates;
}
})();
