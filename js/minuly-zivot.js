import { showFallbackNotice } from './utils/reading-display.js';
import { getPragueDateKey } from './utils/prague-date.js';

(function () {
    'use strict';

    var selectedGender = '';
    var PAST_LIFE_BANNER_SOURCE = 'past_life_banner_upgrade';
    var PAST_LIFE_REGISTER_SOURCE = 'past_life_register_gate';
    var PENDING_CONTEXT_KEY = 'pendingPastLifeContext';
    var pastLifeRequestPending = false;
    var pastLifeGeneration = 0;
    var pastLifeRequestController = null;
    var activePastLifeSession = null;
    var displayedPastLifeSession = null;
    var observedPastLifeSession = null;
    var pastLifeSessionInitialized = Boolean(window.Auth);
    var pastLifeRequestStatusTimer = null;

    function capturePastLifeSession() {
        var isLoggedIn = Boolean(window.Auth?.isLoggedIn?.());
        return { isLoggedIn: isLoggedIn, userId: isLoggedIn ? window.Auth?.user?.id : null };
    }

    function hasSamePastLifeSession(session) {
        var current = capturePastLifeSession();
        if (current.isLoggedIn !== session?.isLoggedIn) return false;
        if (!current.isLoggedIn) return true;
        return typeof session.userId === 'string' && session.userId.length > 0 && current.userId === session.userId;
    }

    function apiBase() {
        return (window.API_CONFIG && window.API_CONFIG.BASE_URL) || '/api';
    }

    function setBlockVisible(element, visible) {
        if (!element) return;
        element.hidden = !visible;
        element.classList.toggle('mh-block-visible', visible);
    }

    function setInlineFlexVisible(element, visible) {
        if (!element) return;
        element.hidden = !visible;
        element.classList.toggle('mh-inline-flex-visible', visible);
    }

    function showError(msg, invalidControl) {
        var el = document.getElementById('pl-error');
        el.textContent = msg;
        setBlockVisible(el, true);
        if (invalidControl) {
            invalidControl.setAttribute('aria-invalid', 'true');
            invalidControl.setAttribute('aria-describedby', 'pl-error');
            invalidControl.focus();
        }
    }
    function hideError() {
        setBlockVisible(document.getElementById('pl-error'), false);
    }

    function clearPastLifeSessionResult() {
        var result = document.getElementById('pl-result');
        result?.classList.remove('visible');
        ['res-era', 'res-identity', 'res-karmic', 'res-gifts', 'res-patterns', 'res-mission', 'res-message'].forEach(function(id) {
            var element = document.getElementById(id);
            if (element) element.textContent = '';
        });
        result?.querySelectorAll('[data-reading-save-error]').forEach(function(notice) { notice.remove(); });
        showFallbackNotice(result, false);
        document.getElementById('favorite-past-life-action')?.remove();
        document.getElementById('share-image')?.remove();
        ['share-fb', 'share-x'].forEach(function(id) {
            document.getElementById(id)?.setAttribute('href', '#');
        });
        ['share-copy', 'share-native'].forEach(function(id) {
            var button = document.getElementById(id);
            if (button) button.onclick = null;
        });
    }

    function invalidatePastLifeSessionChange() {
        var current = capturePastLifeSession();
        if (!pastLifeSessionInitialized) {
            observedPastLifeSession = current;
            pastLifeSessionInitialized = true;
            return;
        }

        var observedChanged = observedPastLifeSession && !hasSamePastLifeSession(observedPastLifeSession);
        var activeChanged = activePastLifeSession && !hasSamePastLifeSession(activePastLifeSession);
        var displayedChanged = displayedPastLifeSession && !hasSamePastLifeSession(displayedPastLifeSession);
        observedPastLifeSession = current;
        if (!observedChanged && !activeChanged && !displayedChanged) return;

        pastLifeGeneration += 1;
        pastLifeRequestController?.abort();
        pastLifeRequestController = null;
        activePastLifeSession = null;
        displayedPastLifeSession = null;
        pastLifeRequestPending = false;
        window.clearTimeout(pastLifeRequestStatusTimer);
        pastLifeRequestStatusTimer = null;
        clearPendingContext();

        var form = document.getElementById('pl-form-wrap');
        if (form) {
            form.removeAttribute('aria-busy');
            var submitButton = document.getElementById('pl-submit');
            if (submitButton) submitButton.disabled = false;
            ['pl-name', 'pl-birth', 'pl-place'].forEach(function(id) {
                var field = document.getElementById(id);
                if (field) field.value = '';
            });
            selectedGender = '';
            var genderInput = document.getElementById('pl-gender');
            if (genderInput) genderInput.value = '';
            document.querySelectorAll('.gender-btn').forEach(function(button) {
                button.classList.remove('selected');
                button.setAttribute('aria-pressed', 'false');
            });
        }

        document.getElementById('past-life-preview-gate')?.remove();
        clearValidationState();
        var errorMessage = document.getElementById('pl-error');
        if (errorMessage) errorMessage.textContent = '';
        var contextStatus = document.getElementById('pl-context-status');
        if (contextStatus) {
            contextStatus.textContent = '';
            contextStatus.hidden = true;
        }
        setBlockVisible(document.getElementById('pl-loading'), false);
        setBlockVisible(document.getElementById('form-section'), true);
        clearPastLifeSessionResult();
    }

    function isCurrentPastLifeRequest(generation, session) {
        if (generation !== pastLifeGeneration) return false;
        if (hasSamePastLifeSession(session)) return true;
        invalidatePastLifeSessionChange();
        return false;
    }

    document.addEventListener('auth:changed', invalidatePastLifeSessionChange);
    window.addEventListener('storage', function(event) {
        if (event.key === 'auth_user') invalidatePastLifeSessionChange();
    });
    observedPastLifeSession = capturePastLifeSession();

    function clearValidationState() {
        ['pl-name', 'pl-birth', 'pl-gender-options'].forEach(function(id) {
            var element = document.getElementById(id);
            element?.removeAttribute('aria-invalid');
            element?.removeAttribute('aria-describedby');
        });
        document.querySelectorAll('.gender-btn').forEach(function(button) {
            button.removeAttribute('aria-invalid');
            button.removeAttribute('aria-describedby');
        });
        hideError();
    }

    function savePendingContext(payload) {
        try {
            sessionStorage.setItem(PENDING_CONTEXT_KEY, JSON.stringify({
                version: 1,
                savedAt: Date.now(),
                payload: payload
            }));
            return true;
        } catch (error) {
            console.warn('Past life form context could not be stored:', error.message);
            return false;
        }
    }

    function clearPendingContext() {
        try {
            sessionStorage.removeItem(PENDING_CONTEXT_KEY);
        } catch (error) {
            console.warn('Past life form context could not be cleared:', error.message);
        }
    }

    function invalidatePastLifePreview() {
        clearPendingContext();
        document.getElementById('past-life-preview-gate')?.remove();
    }

    function restorePendingContext() {
        var stored;
        try {
            stored = sessionStorage.getItem(PENDING_CONTEXT_KEY);
            if (!stored) return;
            clearPendingContext();
        } catch (error) {
            console.warn('Past life form context could not be restored:', error.message);
            return;
        }

        try {
            var parsed = JSON.parse(stored);
            var payload = parsed?.version === 1 ? parsed.payload : parsed;
            if (parsed?.version === 1 && (!Number.isFinite(parsed.savedAt)
                || Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000
                || parsed.savedAt > Date.now() + 60_000)) return;
            if (!payload || typeof payload !== 'object'
                || typeof payload.name !== 'string' || payload.name.trim().length < 2
                || typeof payload.birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(payload.birthDate)
                || !['muz', 'zena', 'neutral'].includes(payload.gender)) return;

            document.getElementById('pl-name').value = payload.name.slice(0, 80);
            document.getElementById('pl-birth').value = payload.birthDate;
            document.getElementById('pl-place').value = typeof payload.place === 'string' ? payload.place.slice(0, 100) : '';
            selectedGender = payload.gender;
            document.getElementById('pl-gender').value = selectedGender;
            document.querySelectorAll('.gender-btn').forEach(function(button) {
                var selected = button.dataset.gender === selectedGender;
                button.classList.toggle('selected', selected);
                button.setAttribute('aria-pressed', String(selected));
            });

            var status = document.getElementById('pl-context-status');
            status.textContent = 'Obnovili jsme údaje z rozepsaného výkladu. Před pokračováním je prosím zkontroluj.';
            setBlockVisible(status, true);
        } catch (error) {
            console.warn('Past life form context is invalid:', error.message);
        }
    }

    function escapeHtml(value) {
        var div = document.createElement('div');
        div.textContent = String(value || '');
        return div.innerHTML;
    }

    function hasPremiumAccess() {
        return !!(window.Auth && window.Auth.isLoggedIn && window.Auth.isLoggedIn()
            && window.Auth.isPremium && window.Auth.isPremium());
    }

    function buildPastLifeCheckoutUrl(source) {
        var pricingUrl = new URL('/cenik.html', window.location.origin);
        pricingUrl.searchParams.set('plan', 'pruvodce');
        pricingUrl.searchParams.set('source', source);
        pricingUrl.searchParams.set('feature', 'minuly_zivot');
        pricingUrl.searchParams.set('entry_source', source);
        pricingUrl.searchParams.set('entry_feature', 'minuly_zivot');
        return pricingUrl.pathname + pricingUrl.search;
    }

    function startPastLifeCheckout(source, authMode) {
        var checkoutSource = source || PAST_LIFE_BANNER_SOURCE;
        window.MH_ANALYTICS?.trackCTA?.(checkoutSource, {
            plan_id: 'pruvodce',
            feature: 'minuly_zivot'
        });

        if (window.Auth?.startPlanCheckout) {
            window.Auth.startPlanCheckout('pruvodce', {
                source: checkoutSource,
                feature: 'minuly_zivot',
                redirect: '/cenik.html',
                authMode: authMode || 'register',
                metadata: {
                    entry_source: checkoutSource,
                    entry_feature: 'minuly_zivot'
                }
            });
            return;
        }

        window.location.href = buildPastLifeCheckoutUrl(checkoutSource);
    }

    function startPastLifeLogin() {
        window.MH_ANALYTICS?.trackCTA?.(PAST_LIFE_REGISTER_SOURCE, {
            destination: '/prihlaseni.html',
            feature: 'minuly_zivot',
            auth_mode: 'login'
        });

        var authUrl = new URL('/prihlaseni.html', window.location.origin);
        authUrl.searchParams.set('mode', 'login');
        authUrl.searchParams.set('redirect', '/minuly-zivot.html');
        authUrl.searchParams.set('source', PAST_LIFE_REGISTER_SOURCE);
        authUrl.searchParams.set('feature', 'minuly_zivot');
        window.location.href = authUrl.pathname + authUrl.search;
    }

    function buildPastLifePayload() {
        return {
            name: document.getElementById('pl-name').value.trim(),
            birthDate: document.getElementById('pl-birth').value,
            place: (document.getElementById('pl-place').value || '').trim(),
            gender: selectedGender
        };
    }

    function getPreviewArchetype(payload) {
        var month = Number(String(payload.birthDate).split('-')[1]) || 1;
        var archetypes = [
            'strážce příběhů a rodové paměti',
            'poutník mezi dvěma světy',
            'léčitel tichých zlomů',
            'tvůrce, který hledá skrytý řád'
        ];
        var energy = payload.gender === 'muz'
            ? 'aktivní ochranná energie'
            : (payload.gender === 'zena' ? 'citlivá tvořivá energie' : 'vyvážená pozorující energie');

        return {
            archetype: archetypes[(month - 1) % archetypes.length],
            energy: energy
        };
    }

    function showPastLifeUpgradePreview(payload, source) {
        var formSection = document.getElementById('form-section');
        var existing = document.getElementById('past-life-preview-gate');
        var firstName = (payload.name || 'tvé jméno').split(/\s+/)[0];
        var preview = getPreviewArchetype(payload);

        if (!existing) {
            existing = document.createElement('div');
            existing.id = 'past-life-preview-gate';
            existing.className = 'past-life-preview-gate';
            formSection.appendChild(existing);
        }

        existing.innerHTML = `
            <div class="past-life-preview-gate__badge">Náhled před odemčením</div>
            <h3 id="past-life-preview-heading" tabindex="-1">Náhled symbolického výkladu pro ${escapeHtml(firstName)}</h3>
            <p>Plný výklad zatím nevznikl; tohle je místní ukázka jeho struktury. Údaje z formuláře se k vytvoření celého symbolického výkladu odešlou až po odemčení.</p>
            <div class="past-life-preview-gate__sample">
                <span>Možná stopa: ${escapeHtml(preview.archetype)}</span>
                <span>Forma výkladu: ${escapeHtml(preview.energy)}</span>
                <span>Odemkne se: éra, role duše, karmická lekce, dary, opakující vzorce a další krok.</span>
            </div>
            <div class="past-life-preview-gate__actions">
                <button type="button" class="btn btn--primary past-life-preview-gate__cta">Odemknout celý výklad</button>
                <button type="button" class="btn btn--secondary past-life-preview-gate__edit">Upravit údaje</button>
            </div>
        `;

        window.MH_ANALYTICS?.trackAction?.('paywall_viewed', {
            source: source,
            feature: 'minuly_zivot',
            plan_id: 'pruvodce',
            has_birth_date: Boolean(payload.birthDate),
            has_place: Boolean(payload.place)
        });

        existing.querySelector('.past-life-preview-gate__cta')?.addEventListener('click', function() {
            savePendingContext(payload);
            startPastLifeCheckout(source, window.Auth?.isLoggedIn?.() ? 'login' : 'register');
        });

        existing.querySelector('.past-life-preview-gate__edit')?.addEventListener('click', function() {
            window.MH_ANALYTICS?.trackAction?.('paywall_dismissed', {
                source: source,
                feature: 'minuly_zivot'
            });
            clearPendingContext();
            existing.remove();
            document.getElementById('pl-name')?.focus();
        });

        existing.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
        existing.querySelector('#past-life-preview-heading')?.focus({ preventScroll: true });
    }

    function appendPastLifeFavoriteAction(container, readingId) {
        if (!container || !readingId) return;

        document.getElementById('favorite-past-life-action')?.remove();

        var action = document.createElement('div');
        action.id = 'favorite-past-life-action';
        action.className = 'text-center favorite-reading-action mt-md';
        action.innerHTML = `
            <button id="favorite-past-life-btn" class="btn btn--glass favorite-reading-action__button">
                <svg class="mh-symbol mh-symbol--inline favorite-icon" viewBox="0 0 48 48" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg> Přidat do oblíbených
            </button>
        `;
        container.appendChild(action);

        action.querySelector('#favorite-past-life-btn')?.addEventListener('click', async function() {
            if (typeof window.toggleFavorite === 'function') {
                await window.toggleFavorite(readingId, 'favorite-past-life-btn');
            }
        });
    }

    function showPastLifeSaveFailure(container) {
        if (!container) return;
        container.querySelector('[data-reading-save-error]')?.remove();
        var notice = document.createElement('p');
        notice.dataset.readingSaveError = 'true';
        notice.className = 'result-context-notice';
        notice.setAttribute('role', 'status');
        notice.textContent = 'Výklad zůstává zobrazený, ale nepodařilo se ho uložit do profilu.';
        var shareBar = container.querySelector('.share-bar');
        if (shareBar) shareBar.before(notice);
        else container.appendChild(notice);
    }

    function init() {
        var upgradeBtn = document.getElementById('past-life-upgrade-btn');
        var registerBtn = document.getElementById('past-life-register-btn');
        var form = document.getElementById('pl-form-wrap');
        var submitButton = document.getElementById('pl-submit');
        var birthInput = document.getElementById('pl-birth');
        function syncBirthDateMaximum() {
            if (!birthInput) return '';
            var today = getPragueDateKey();
            birthInput.max = today;
            return today;
        }
        syncBirthDateMaximum();
        birthInput?.addEventListener('focus', syncBirthDateMaximum);

        restorePendingContext();

        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', function(event) {
                event.preventDefault();
                startPastLifeCheckout(PAST_LIFE_BANNER_SOURCE, 'register');
            });
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', function(event) {
                event.preventDefault();
                startPastLifeLogin();
            });
        }

        // Gender buttons
        document.querySelectorAll('.gender-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                invalidatePastLifePreview();
                clearValidationState();
                document.querySelectorAll('.gender-btn').forEach(function(b) {
                    b.classList.remove('selected');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('selected');
                btn.setAttribute('aria-pressed', 'true');
                selectedGender = btn.dataset.gender;
                document.getElementById('pl-gender').value = selectedGender;
            });
        });

        ['pl-name', 'pl-birth', 'pl-place'].forEach(function(id) {
            var field = document.getElementById(id);
            field?.addEventListener('input', function() {
                invalidatePastLifePreview();
                clearValidationState();
            });
            field?.addEventListener('change', invalidatePastLifePreview);
        });

        // Submit by button or Enter; retain the visitor's fields if validation or the API fails.
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            if (pastLifeRequestPending) return;
            clearValidationState();
            var payload = buildPastLifePayload();
            var name = payload.name;
            var birth = payload.birthDate;
            var place = payload.place;
            var gender = payload.gender;

            if (!name || name.length < 2) { showError('Zadej své jméno.', document.getElementById('pl-name')); return; }
            if (!birth) { showError('Zadej datum narození.', document.getElementById('pl-birth')); return; }
            var earliestAllowedBirthDate = birthInput?.min || '1900-01-01';
            if (birth < earliestAllowedBirthDate) {
                showError('Datum narození musí být 1. 1. 1900 nebo pozdější.', birthInput);
                return;
            }
            var latestAllowedBirthDate = syncBirthDateMaximum();
            if (birth > latestAllowedBirthDate) {
                showError('Datum narození nemůže být v budoucnosti.', birthInput);
                return;
            }
            if (!gender) {
                var firstGenderButton = document.querySelector('.gender-btn');
                var genderGroup = document.getElementById('pl-gender-options');
                genderGroup.setAttribute('aria-invalid', 'true');
                genderGroup.setAttribute('aria-describedby', 'pl-error');
                showError('Vyber formu výkladu.', firstGenderButton);
                return;
            }

            if (!hasPremiumAccess()) {
                savePendingContext(payload);
                showPastLifeUpgradePreview(payload, window.Auth?.isLoggedIn?.() ? 'past_life_free_submit_gate' : 'past_life_submit_gate');
                return;
            }

            pastLifeRequestPending = true;
            var generation = ++pastLifeGeneration;
            var readingSession = capturePastLifeSession();
            var readingOwnerId = readingSession.isLoggedIn ? readingSession.userId : null;
            if (readingSession.isLoggedIn && (typeof readingOwnerId !== 'string' || !readingOwnerId)) {
                pastLifeRequestPending = false;
                showError('Nepodařilo se ověřit přihlášený účet. Obnov stránku a zkus to znovu.');
                return;
            }
            var requestController = new AbortController();
            pastLifeRequestController = requestController;
            activePastLifeSession = readingSession;
            displayedPastLifeSession = null;
            var loadingMessage = document.querySelector('#pl-loading p');
            var requestStatusTimer = window.setTimeout(function() {
                if (pastLifeRequestPending && loadingMessage) {
                    loadingMessage.textContent = 'Výklad se tvoří déle než obvykle. Požadavek stále zpracováváme — nevytvářej ho prosím znovu.';
                }
            }, 60000);
            pastLifeRequestStatusTimer = requestStatusTimer;
            clearPendingContext();
            form.setAttribute('aria-busy', 'true');
            submitButton.disabled = true;
            // Show loading
            setBlockVisible(document.getElementById('form-section'), false);
            setBlockVisible(document.getElementById('pl-loading'), true);
            if (loadingMessage) loadingMessage.textContent = 'Skládám symbolický příběh duše…';
            document.getElementById('pl-result').classList.remove('visible');
            document.getElementById('pl-loading').focus();

            var csrfRequestTimedOut = false;
            try {
                // Get CSRF token
                var csrfTimer = window.setTimeout(function() {
                    csrfRequestTimedOut = true;
                    requestController.abort();
                }, 15000);
                var csrfData;
                try {
                    var csrfRes = await fetch(apiBase() + '/csrf-token', {
                        credentials: 'include',
                        signal: requestController.signal
                    });
                    if (!csrfRes.ok) throw new Error('CSRF token request failed');
                    csrfData = await csrfRes.json();
                } finally {
                    window.clearTimeout(csrfTimer);
                }
                if (!isCurrentPastLifeRequest(generation, readingSession)) return;
                if (!csrfData?.csrfToken) throw new Error('CSRF token is missing');

                var res = await fetch(apiBase() + '/past-life', {
                    method: 'POST',
                    credentials: 'include',
                    signal: requestController.signal,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfData.csrfToken || ''
                    },
                    body: JSON.stringify(payload)
                });

                var data = await res.json();
                if (!isCurrentPastLifeRequest(generation, readingSession)) return;

                setBlockVisible(document.getElementById('pl-loading'), false);

                if (!res.ok || !data.success) {
                    setBlockVisible(document.getElementById('form-section'), true);
                    showError(data.error || 'Chyba serveru. Zkus to prosím znovu.');
                    document.getElementById('pl-name').focus();
                    return;
                }

                // Fill result
                var r = data.result;
                showFallbackNotice(document.getElementById('pl-result'), data.fallback);
                document.getElementById('res-era').textContent = r.era || '';
                document.getElementById('res-identity').textContent = r.identity || '';
                document.getElementById('res-karmic').textContent = r.karmic_lesson || '';
                document.getElementById('res-gifts').textContent = r.gifts || '';
                document.getElementById('res-patterns').textContent = r.patterns || '';
                document.getElementById('res-mission').textContent = r.mission || '';
                document.getElementById('res-message').textContent = r.message || '';

                setupShare(name, r);

                var result = document.getElementById('pl-result');
                displayedPastLifeSession = readingSession;
                result.classList.add('visible');
                document.getElementById('pl-result-heading').focus();
                window.scrollTo({ top: result.offsetTop - 80, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

                if (window.Auth?.saveReading) {
                    try {
                        var savePromise = window.Auth.saveReading('past-life', {
                            name: name,
                            birthDate: birth,
                            gender: gender,
                            place: place,
                            result: r,
                            fallback: !!data.fallback
                        }, readingOwnerId);
                        Promise.resolve(savePromise).then(function(saveResult) {
                            if (!isCurrentPastLifeRequest(generation, readingSession)) return;
                            if (saveResult?.id) appendPastLifeFavoriteAction(result, saveResult.id);
                            else showPastLifeSaveFailure(result);
                        }).catch(function(saveError) {
                            if (!isCurrentPastLifeRequest(generation, readingSession)) return;
                            console.warn('Past life save failed:', saveError.message);
                            showPastLifeSaveFailure(result);
                        });
                    } catch (saveError) {
                        if (!isCurrentPastLifeRequest(generation, readingSession)) return;
                        console.warn('Past life save failed:', saveError.message);
                        showPastLifeSaveFailure(result);
                    }
                }

            } catch (e) {
                if (!isCurrentPastLifeRequest(generation, readingSession)) return;
                setBlockVisible(document.getElementById('pl-loading'), false);
                setBlockVisible(document.getElementById('form-section'), true);
                showError(csrfRequestTimedOut
                    ? 'Zabezpečené spojení neodpovědělo včas. Výklad jsme neodeslali; údaje zůstaly ve formuláři a můžeš to zkusit znovu.'
                    : 'Chyba připojení. Údaje zůstaly ve formuláři, zkus to prosím znovu.');
                document.getElementById('pl-name').focus();
            } finally {
                window.clearTimeout(requestStatusTimer);
                if (pastLifeRequestStatusTimer === requestStatusTimer) pastLifeRequestStatusTimer = null;
                if (generation === pastLifeGeneration) {
                    pastLifeRequestPending = false;
                    if (activePastLifeSession === readingSession) activePastLifeSession = null;
                    if (pastLifeRequestController === requestController) pastLifeRequestController = null;
                    form.removeAttribute('aria-busy');
                    submitButton.disabled = false;
                }
            }
        });

        // Reset
        document.getElementById('pl-reset').addEventListener('click', function() {
            pastLifeGeneration += 1;
            pastLifeRequestController?.abort();
            pastLifeRequestController = null;
            activePastLifeSession = null;
            displayedPastLifeSession = null;
            pastLifeRequestPending = false;
            window.clearTimeout(pastLifeRequestStatusTimer);
            pastLifeRequestStatusTimer = null;
            document.getElementById('pl-result').classList.remove('visible');
            setBlockVisible(document.getElementById('form-section'), true);
            var nameField = document.getElementById('pl-name');
            nameField?.focus({ preventScroll: true });
            nameField?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
        });
    }

    function setupShare(name, r) {
        var pageUrl = 'https://www.mystickahvezda.cz/minuly-zivot.html';
        var firstName = name.split(' ')[0];
        var shareText = firstName + ' má symbolický vhled minulého života: ' +
            (r.era ? 'V \u00E9\u0159e \u201E' + r.era + '\u201C ' : '') +
            (r.identity ? r.identity.substring(0, 60) + (r.identity.length > 60 ? '\u2026' : '') + '. ' : '') +
            'Vytvo\u0159 si vlastn\u00ED sebereflexn\u00ED v\u00FDklad.';

        // Facebook
        var fbBtn = document.getElementById('share-fb');
        fbBtn.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl) +
            '&quote=' + encodeURIComponent(shareText);

        // X (Twitter)
        var xBtn = document.getElementById('share-x');
        xBtn.href = 'https://x.com/intent/tweet?text=' + encodeURIComponent(shareText + '\n' + pageUrl);

        // Copy
        var copyBtn = document.getElementById('share-copy');
        var copyLabel = document.getElementById('copy-label');
        copyBtn.onclick = function() {
            var toCopy = shareText + '\n' + pageUrl;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(toCopy).then(function() {
                    showCopied(copyBtn, copyLabel);
                }).catch(function() {
                    fallbackCopy(toCopy, copyBtn, copyLabel);
                });
            } else {
                fallbackCopy(toCopy, copyBtn, copyLabel);
            }
        };

        // Native share (mobile)
        var nativeBtn = document.getElementById('share-native');
        if (navigator.share) {
            setInlineFlexVisible(nativeBtn, true);
            nativeBtn.onclick = function() {
                navigator.share({
                    title: 'M\u016Fj minul\u00FD \u017Eivot \u2014 Akashick\u00E9 Z\u00E1znamy',
                    text: shareText,
                    url: pageUrl
                }).catch(function() {});
            };
        } else {
            setInlineFlexVisible(nativeBtn, false);
        }

        setupImageShare(firstName, r);
    }

    function drawPastLifeResultCard(firstName, r) {
        var shareImage = window.MH_SHARE_IMAGE;
        var canvas = shareImage.createCanvas();
        var ctx = canvas.getContext('2d');
        var centerX = canvas.width / 2;
        var seed = String(r.era || '').length * 17 + String(r.identity || '').length;

        shareImage.drawBrandBackground(ctx, canvas, seed);

        ctx.fillStyle = '#d0b17c';
        ctx.font = '700 52px Cinzel, Georgia, serif';
        ctx.fillText('MINUL\u00DD \u017DIVOT', centerX, 240);

        ctx.fillStyle = '#c0c8ca';
        ctx.font = '500 32px Inter, Arial, sans-serif';
        ctx.fillText(firstName ? 'Symbolick\u00FD vhled pro ' + firstName : 'Symbolick\u00FD vhled', centerX, 300);

        var y = 410;
        if (r.era) {
            ctx.fillStyle = '#e9e3d7';
            ctx.font = '700 46px Cinzel, Georgia, serif';
            y = shareImage.drawCenteredLines(ctx, shareImage.wrapText(ctx, r.era, 840), centerX, y, 56, 2, 840) + 30;
        }

        if (r.identity) {
            ctx.fillStyle = '#e9e3d7';
            ctx.font = '500 36px Inter, Arial, sans-serif';
            y = shareImage.drawCenteredLines(ctx, shareImage.wrapText(ctx, r.identity, 840), centerX, y, 47, 5, 840) + 26;
        }

        ctx.fillStyle = 'rgba(208,177,124,0.86)';
        ctx.fillRect(170, y, 740, 3);
        y += 60;

        var closing = r.message || r.mission || r.karmic_lesson || '';
        if (closing) {
            ctx.fillStyle = '#e9e3d7';
            ctx.font = '500 32px Inter, Arial, sans-serif';
            shareImage.drawCenteredLines(ctx, shareImage.wrapText(ctx, closing, 840), centerX, y, 43, 5, 840);
        }

        shareImage.drawFooter(ctx, canvas, 'mystickahvezda.cz/minuly-zivot.html',
            'Zjisti, kdo jsi mohl b\u00FDt v minul\u00E9m \u017Eivot\u011B.');

        return canvas;
    }

    function setupImageShare(firstName, r) {
        if (!window.MH_SHARE_IMAGE || !window.MH_SHARE_IMAGE.shareOrDownload) return;

        var buttonsBar = document.querySelector('#share-bar .share-bar__buttons');
        if (!buttonsBar) return;

        var imageBtn = document.getElementById('share-image');
        if (!imageBtn) {
            imageBtn = document.createElement('button');
            imageBtn.id = 'share-image';
            imageBtn.type = 'button';
            imageBtn.className = 'share-btn share-btn--copy';
            buttonsBar.appendChild(imageBtn);
        }
        imageBtn.textContent = 'Ulo\u017Eit obr\u00E1zek';

        imageBtn.onclick = function () {
            imageBtn.disabled = true;
            imageBtn.textContent = 'P\u0159ipravuji obr\u00E1zek...';

            Promise.resolve()
                .then(function () {
                    var canvas = drawPastLifeResultCard(firstName, r);
                    return window.MH_SHARE_IMAGE.shareOrDownload({
                        canvas: canvas,
                        fileName: 'minuly-zivot.png',
                        shareTitle: 'M\u016Fj minul\u00FD \u017Eivot',
                        shareText: 'Podle Akashick\u00FDch z\u00E1znam\u016F m\u00E1m symbolick\u00FD vhled minul\u00E9ho \u017Eivota. Zkus to taky na mystickahvezda.cz',
                        eventBase: 'past_life_image',
                        metadata: {
                            source: 'past_life_result',
                            feature: 'minuly_zivot',
                            era: r.era || null
                        }
                    });
                })
                .catch(function (error) {
                    console.warn('[Minul\u00FD \u017Eivot] Image share failed:', error.message);
                })
                .then(function () {
                    imageBtn.disabled = false;
                    imageBtn.textContent = 'Ulo\u017Eit obr\u00E1zek';
                });
        };
    }

    function showCopied(btn, label) {
        btn.classList.add('copied');
        label.textContent = 'Zkop\u00EDrov\u00E1no!';
        setTimeout(function() {
            btn.classList.remove('copied');
            label.textContent = 'Kop\u00EDrovat odkaz';
        }, 2200);
    }

    function fallbackCopy(text, btn, label) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.className = 'clipboard-hidden-textarea';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showCopied(btn, label); } catch(e) {}
        document.body.removeChild(ta);
    }

    // Auth check
    function checkAuth() {
        var isLoggedIn = window.Auth && window.Auth.isLoggedIn && window.Auth.isLoggedIn();
        var isPremium = hasPremiumAccess();

        if (!isPremium) {
            setBlockVisible(document.getElementById('pl-form-wrap'), true);
            setBlockVisible(document.getElementById('premium-wall'), true);
            document.getElementById('past-life-register-btn').textContent = isLoggedIn
                ? 'Zkontrolovat účet'
                : 'Přihlásit se k aktivnímu účtu';
        } else {
            setBlockVisible(document.getElementById('pl-form-wrap'), true);
            setBlockVisible(document.getElementById('premium-wall'), false);
        }
    }

    document.addEventListener('auth:changed', checkAuth);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            init();
            setTimeout(checkAuth, 300);
        });
    } else {
        init();
        setTimeout(checkAuth, 300);
    }
})();
