import { showFallbackNotice } from './utils/reading-display.js';
import { getPragueDateKey } from './utils/prague-date.js';

(function () {
    'use strict';

    let medicineWheelRequestVersion = 0;
    let medicineWheelActiveRequestId = null;
    let medicineWheelRequestInProgress = false;
    let medicineWheelRequestPhase = null;
    let medicineWheelController = null;
    let medicineWheelControlSnapshot = null;
    let activeMedicineWheelSession = null;
    let displayedMedicineWheelSession = null;
    let observedMedicineWheelSession = null;
    let shareCopyFeedbackTimer = null;
    const ICON_SPRITE_URL = '/img/icons/mh-symbols.svg?v=20261019-shaman-totems';

    function captureMedicineWheelSession() {
        const isLoggedIn = Boolean(window.Auth?.isLoggedIn?.());
        return { isLoggedIn, userId: isLoggedIn ? window.Auth?.user?.id : null };
    }

    function hasSameMedicineWheelSession(session) {
        const current = captureMedicineWheelSession();
        if (current.isLoggedIn !== session?.isLoggedIn) return false;
        if (!current.isLoggedIn) return true;
        return typeof session.userId === 'string' && session.userId.length > 0 && current.userId === session.userId;
    }

    // 12 měsíčních totemů – inspirováno tradicí Sun Beara (Earth Astrology)
    const TOTEMS = [
        {
            name: 'Sokol',
            native: 'Wambli (Lakota)',
            icon: 'eagle',
            direction: 'Východ',
            element: 'Oheň',
            season: 'Jaro',
            from: { month: 3, day: 21 },
            to:   { month: 4, day: 19 }
        },
        {
            name: 'Bobr',
            native: 'Čápa (Algonquin)',
            icon: 'beaver',
            direction: 'Východ',
            element: 'Země',
            season: 'Jaro',
            from: { month: 4, day: 20 },
            to:   { month: 5, day: 20 }
        },
        {
            name: 'Jelen',
            native: 'Tahca (Lakota)',
            icon: 'deer',
            direction: 'Jih',
            element: 'Vzduch',
            season: 'Léto',
            from: { month: 5, day: 21 },
            to:   { month: 6, day: 20 }
        },
        {
            name: 'Datlovník',
            native: 'Pekpek (Ojibwe)',
            icon: 'woodpecker',
            direction: 'Jih',
            element: 'Voda',
            season: 'Léto',
            from: { month: 6, day: 21 },
            to:   { month: 7, day: 21 }
        },
        {
            name: 'Losos',
            native: 'Namewini (Ojibwe)',
            icon: 'salmon',
            direction: 'Jih',
            element: 'Oheň',
            season: 'Léto',
            from: { month: 7, day: 22 },
            to:   { month: 8, day: 21 }
        },
        {
            name: 'Medvěd',
            native: 'Mato (Lakota)',
            icon: 'bear',
            direction: 'Západ',
            element: 'Země',
            season: 'Podzim',
            from: { month: 8, day: 22 },
            to:   { month: 9, day: 21 }
        },
        {
            name: 'Vrána',
            native: 'Kangí (Lakota)',
            icon: 'crow',
            direction: 'Západ',
            element: 'Vzduch',
            season: 'Podzim',
            from: { month: 9, day: 22 },
            to:   { month: 10, day: 22 }
        },
        {
            name: 'Had',
            native: 'Zuzeca (Lakota)',
            icon: 'snake',
            direction: 'Západ',
            element: 'Voda',
            season: 'Podzim',
            from: { month: 10, day: 23 },
            to:   { month: 11, day: 22 }
        },
        {
            name: 'Sova',
            native: 'Hinhan (Lakota)',
            icon: 'owl',
            direction: 'Sever',
            element: 'Oheň',
            season: 'Zima',
            from: { month: 11, day: 23 },
            to:   { month: 12, day: 21 }
        },
        {
            name: 'Sněžná Husa',
            native: 'Wabizii (Ojibwe)',
            icon: 'goose',
            direction: 'Sever',
            element: 'Vzduch',
            season: 'Zima',
            from: { month: 12, day: 22 },
            to:   { month: 1, day: 19 }
        },
        {
            name: 'Vydra',
            native: 'Nigig (Ojibwe)',
            icon: 'otter',
            direction: 'Sever',
            element: 'Voda',
            season: 'Zima',
            from: { month: 1, day: 20 },
            to:   { month: 2, day: 18 }
        },
        {
            name: 'Vlk',
            native: 'Sungmanitu (Lakota)',
            icon: 'wolf',
            direction: 'Východ',
            element: 'Vzduch',
            season: 'Zima → Jaro',
            from: { month: 2, day: 19 },
            to:   { month: 3, day: 20 }
        }
    ];

    const DIRECTION_SEGMENT_IDS = {
        'Východ': 'seg-east',
        'Jih':    'seg-south',
        'Západ':  'seg-west',
        'Sever':  'seg-north'
    };

    const DIRECTION_LABEL_IDS = {
        'Východ': 'lbl-east',
        'Jih':    'lbl-south',
        'Západ':  'lbl-west',
        'Sever':  'lbl-north'
    };

    function apiBase() {
        return (window.API_CONFIG && window.API_CONFIG.BASE_URL) || '/api';
    }

    function setBlockVisible(id, visible) {
        const el = document.getElementById(id);
        if (!el) return;
        el.hidden = !visible;
        el.classList.toggle('mh-block-visible', visible);
    }

    function setInlineFlexVisible(id, visible) {
        const el = document.getElementById(id);
        if (!el) return;
        el.hidden = !visible;
        el.classList.toggle('mh-flex-visible', visible);
    }

    function showError(msg) {
        const el = document.getElementById('mw-error');
        el.textContent = msg;
        setBlockVisible('mw-error', true);
    }

    function hideError() {
        setBlockVisible('mw-error', false);
        setBlockVisible('mw-result-status', false);
    }

    function clearMedicineWheelSessionData() {
        for (const id of ['mw-name', 'mw-birth']) {
            const input = document.getElementById(id);
            if (input) input.value = '';
        }

        document.getElementById('mw-result')?.classList.remove('visible');
        setBlockVisible('mw-form-section', true);
        setBlockVisible('mw-loading', false);
        setBlockVisible('mw-error', false);
        setBlockVisible('mw-result-status', false);
        setBlockVisible('mw-premium-content', false);
        setBlockVisible('mw-premium-wall', false);
        document.getElementById('mw-request-status')?.setAttribute('hidden', '');

        for (const id of ['res-animal', 'res-totem', 'res-native', 'res-direction', 'res-element', 'res-strengths', 'res-challenges', 'res-message']) {
            const value = document.getElementById(id);
            if (value) value.textContent = '';
        }
        const resultStatus = document.getElementById('mw-result-status');
        if (resultStatus) resultStatus.textContent = '';
        const error = document.getElementById('mw-error');
        if (error) error.textContent = '';
        document.querySelector('#mw-premium-content [data-reading-fallback-notice]')?.remove();

        const directionCard = document.getElementById('mw-direction-card');
        if (directionCard) {
            Object.values(DIRECTION_CARD_CLASSES).forEach(className => directionCard.classList.remove(className));
        }
        const result = document.getElementById('mw-result');
        if (result) {
            result.removeAttribute('data-direction');
            delete result.dataset.direction;
        }
        ['east', 'south', 'west', 'north'].forEach(direction => {
            document.getElementById(`seg-${direction}`)?.classList.remove('active');
            document.getElementById(`seg-${direction}-glow`)?.classList.remove('active');
        });
        Object.values(DIRECTION_LABEL_IDS).forEach(id => document.getElementById(id)?.classList.remove('active'));
        const centerSymbol = document.getElementById('mw-center-symbol-use');
        if (centerSymbol) centerSymbol.setAttribute('href', `${ICON_SPRITE_URL}#compass`);
        document.getElementById('favorite-medicine-wheel-action')?.remove();

        const fbBtn = document.getElementById('share-fb');
        const xBtn = document.getElementById('share-x');
        const copyBtn = document.getElementById('share-copy');
        const nativeBtn = document.getElementById('share-native');
        if (fbBtn) fbBtn.href = '#';
        if (xBtn) xBtn.href = '#';
        if (copyBtn) copyBtn.onclick = null;
        if (nativeBtn) nativeBtn.onclick = null;
        setInlineFlexVisible('share-native', false);
        displayedMedicineWheelSession = null;
    }

    function invalidateMedicineWheelSessionChange() {
        const current = captureMedicineWheelSession();
        const observedChanged = observedMedicineWheelSession && !hasSameMedicineWheelSession(observedMedicineWheelSession);
        const activeChanged = activeMedicineWheelSession && !hasSameMedicineWheelSession(activeMedicineWheelSession);
        const displayedChanged = displayedMedicineWheelSession && !hasSameMedicineWheelSession(displayedMedicineWheelSession);
        observedMedicineWheelSession = current;
        if (!observedChanged && !activeChanged && !displayedChanged) return;

        if (activeChanged) {
            const activeRequestId = medicineWheelActiveRequestId;
            medicineWheelRequestVersion += 1;
            medicineWheelController?.abort();
            restoreMedicineWheelRequestState(activeRequestId);
            activeMedicineWheelSession = null;
        }
        clearMedicineWheelSessionData();
    }

    function isCurrentMedicineWheelRequest(requestId, session) {
        if (requestId !== medicineWheelRequestVersion) return false;
        if (hasSameMedicineWheelSession(session)) return true;
        invalidateMedicineWheelSessionChange();
        return false;
    }

    function restoreMedicineWheelRequestState(requestId) {
        if (medicineWheelActiveRequestId !== requestId) return;

        const snapshot = medicineWheelControlSnapshot;
        snapshot?.controls.forEach(({ control, disabled }) => {
            control.disabled = disabled;
        });
        if (snapshot?.formSection) {
            if (snapshot.previousBusy === null) snapshot.formSection.removeAttribute('aria-busy');
            else snapshot.formSection.setAttribute('aria-busy', snapshot.previousBusy);
        }

        const status = document.getElementById('mw-request-status');
        if (status) status.hidden = true;
        medicineWheelControlSnapshot = null;
        medicineWheelActiveRequestId = null;
        medicineWheelRequestInProgress = false;
        medicineWheelRequestPhase = null;
        medicineWheelController = null;
    }

    function showResultError(message) {
        const status = document.getElementById('mw-result-status');
        if (status) status.textContent = message;
        setBlockVisible('mw-result-status', true);
        setBlockVisible('mw-premium-content', false);
        setBlockVisible('mw-premium-wall', false);
    }

    function showReadingSaveFailure() {
        const status = document.getElementById('mw-result-status');
        if (!status) return;
        status.textContent = 'Doplňující výklad je hotový, ale nepodařilo se ho uložit do profilu.';
        setBlockVisible('mw-result-status', true);
    }

    function getTotemByDate(dateStr) {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDate();

        for (const totem of TOTEMS) {
            const { from, to } = totem;
            // Handle year wrap (Sněžná Husa: 22.12 – 19.1)
            if (from.month > to.month) {
                if (month === from.month && day >= from.day) return totem;
                if (month === to.month   && day <= to.day)   return totem;
            } else {
                if (
                    (month === from.month && day >= from.day) ||
                    (month === to.month   && day <= to.day)   ||
                    (month > from.month   && month < to.month)
                ) return totem;
            }
        }
        // Fallback: Vlk
        return TOTEMS[11];
    }

    function highlightWheel(direction) {
        const dirs = ['east', 'south', 'west', 'north'];
        const dirMap = { 'Východ': 'east', 'Jih': 'south', 'Západ': 'west', 'Sever': 'north' };
        const activeDir = dirMap[direction] || '';

        dirs.forEach(d => {
            const seg  = document.getElementById('seg-' + d);
            const glow = document.getElementById('seg-' + d + '-glow');
            if (seg)  seg.classList.toggle('active',  d === activeDir);
            if (glow) glow.classList.toggle('active', d === activeDir);
        });

        Object.values(DIRECTION_LABEL_IDS).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
        const lblId = DIRECTION_LABEL_IDS[direction];
        if (lblId) {
            const lbl = document.getElementById(lblId);
            if (lbl) lbl.classList.add('active');
        }
    }

    const ELEMENT_ICON_IDS = {
        'Oheň': 'flame',
        'Země': 'leaf',
        'Vzduch': 'feather',
        'Voda': 'wave'
    };
    const DIRECTION_CARD_CLASSES = {
        'Východ': 'mw-card--east',
        'Jih':    'mw-card--south',
        'Západ':  'mw-card--west',
        'Sever':  'mw-card--north'
    };

    function showFreeResult(name, totem) {
        // Keep the revealed totem artwork consistent with the shared SVG icon set.
        const centerSymbol = document.getElementById('mw-center-symbol-use');
        if (centerSymbol) centerSymbol.setAttribute('href', `${ICON_SPRITE_URL}#${totem.icon}`);

        // Highlight wheel
        highlightWheel(totem.direction);

        // Direction color class on cards
        const dirCard = document.getElementById('mw-direction-card');
        if (dirCard) {
            Object.values(DIRECTION_CARD_CLASSES).forEach(c => dirCard.classList.remove(c));
            dirCard.classList.add(DIRECTION_CARD_CLASSES[totem.direction] || '');
        }

        // Keep the dynamic result icons in the same SVG set as the page chrome.
        const dirIcon = document.getElementById('mw-direction-icon');
        if (dirIcon) renderSymbol(dirIcon, 'compass');

        const elIcon = document.getElementById('mw-element-icon');
        if (elIcon) renderSymbol(elIcon, ELEMENT_ICON_IDS[totem.element] || 'wave');

        // data-direction for CSS theming
        document.getElementById('mw-result').dataset.direction = totem.direction;

        // Totem banner
        renderSymbol(document.getElementById('res-animal'), totem.icon, 72);
        document.getElementById('res-totem').textContent = totem.name;
        document.getElementById('res-native').textContent = totem.native;

        // Free cards
        document.getElementById('res-direction').textContent =
            totem.direction + ' — strana ' + directionMeaning(totem.direction);
        document.getElementById('res-element').textContent =
            totem.element + ' · ' + totem.season;
    }

    function renderSymbol(container, symbolId, size = 48) {
        const namespace = 'http://www.w3.org/2000/svg';
        const icon = document.createElementNS(namespace, 'svg');
        icon.setAttribute('class', 'mh-symbol');
        icon.setAttribute('viewBox', '0 0 48 48');
        icon.setAttribute('width', String(size));
        icon.setAttribute('height', String(size));
        icon.setAttribute('fill', 'none');
        icon.setAttribute('stroke', 'currentColor');
        icon.setAttribute('stroke-width', '1.8');
        icon.setAttribute('stroke-linecap', 'round');
        icon.setAttribute('stroke-linejoin', 'round');
        icon.setAttribute('aria-hidden', 'true');
        icon.setAttribute('focusable', 'false');

        const use = document.createElementNS(namespace, 'use');
        use.setAttribute('href', `${ICON_SPRITE_URL}#${symbolId}`);
        icon.appendChild(use);
        container.replaceChildren(icon);
    }

    function directionMeaning(direction) {
        const meanings = {
            'Východ':  'úsvitu a nových začátků',
            'Jih':     'tepla, růstu a srdce',
            'Západ':   'introspekce a proměny',
            'Sever':   'moudrosti a vnitřní síly'
        };
        return meanings[direction] || direction;
    }

    function setupShare(totem) {
        const pageUrl = 'https://www.mystickahvezda.cz/shamansko-kolo.html';
        const shareText = 'Symbolický měsíční totem: ' + totem.name +
            ' · světová strana: ' + totem.direction +
            ' · živel: ' + totem.element +
            '. Podívej se, jaké téma ti vyjde podle data narození ↓';

        const fbBtn = document.getElementById('share-fb');
        fbBtn.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl) +
            '&quote=' + encodeURIComponent(shareText);

        const xBtn = document.getElementById('share-x');
        xBtn.href = 'https://x.com/intent/tweet?text=' + encodeURIComponent(shareText + '\n' + pageUrl);

        const copyBtn  = document.getElementById('share-copy');
        const copyLabel = document.getElementById('copy-label');
        copyBtn.onclick = function () {
            const toCopy = shareText + '\n' + pageUrl;
            void copyShareText(toCopy, copyBtn, copyLabel);
        };

        const nativeBtn = document.getElementById('share-native');
        if (navigator.share) {
            setInlineFlexVisible('share-native', true);
            nativeBtn.onclick = function () {
                navigator.share({
                    title: 'Mé Šamanské Kolo — ' + totem.name,
                    text: shareText,
                    url: pageUrl
                }).catch(function () {});
            };
        } else {
            setInlineFlexVisible('share-native', false);
        }
    }

    function announceCopyStatus(message) {
        const status = document.getElementById('share-copy-status');
        if (!status) return;
        status.textContent = '';
        window.setTimeout(() => { status.textContent = message; }, 0);
    }

    function showCopied(btn, label) {
        window.clearTimeout(shareCopyFeedbackTimer);
        btn.classList.remove('copy-failed');
        btn.classList.add('copied');
        label.textContent = 'Zkopírováno!';
        announceCopyStatus('Text byl zkopírován do schránky.');
        shareCopyFeedbackTimer = setTimeout(function () {
            btn.classList.remove('copied');
            label.textContent = 'Kopírovat odkaz';
            shareCopyFeedbackTimer = null;
        }, 2200);
    }

    function showCopyFailure(btn, label) {
        window.clearTimeout(shareCopyFeedbackTimer);
        btn.classList.remove('copied');
        btn.classList.add('copy-failed');
        label.textContent = 'Kopírování se nezdařilo';
        announceCopyStatus('Text se nepodařilo zkopírovat. Zkus to znovu nebo zkopíruj adresu stránky ručně.');
        shareCopyFeedbackTimer = setTimeout(function () {
            btn.classList.remove('copy-failed');
            label.textContent = 'Kopírovat odkaz';
            shareCopyFeedbackTimer = null;
        }, 3500);
    }

    async function copyShareText(text, btn, label) {
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                showCopied(btn, label);
                return;
            } catch (error) {
                console.warn('Native clipboard write failed; trying fallback:', error);
            }
        }

        if (fallbackCopy(text)) showCopied(btn, label);
        else showCopyFailure(btn, label);
    }

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.className = 'clipboard-hidden-textarea';
        document.body.appendChild(ta);
        let copied = false;
        try {
            ta.focus();
            ta.select();
            ta.setSelectionRange(0, ta.value.length);
            copied = document.execCommand('copy') === true;
        } catch (error) {
            console.warn('Fallback clipboard write failed:', error);
        } finally {
            ta.remove();
        }
        return copied;
    }

    function buildMedicineWheelUpgradeUrl() {
        const pricingUrl = new URL('/cenik.html', window.location.origin);
        pricingUrl.searchParams.set('plan', 'pruvodce');
        pricingUrl.searchParams.set('source', 'medicine_wheel_premium_wall');
        pricingUrl.searchParams.set('feature', 'shamanske_kolo_plne_cteni');
        pricingUrl.searchParams.set('entry_source', 'medicine_wheel_premium_wall');
        pricingUrl.searchParams.set('entry_feature', 'shamanske_kolo_plne_cteni');
        return `${pricingUrl.pathname}${pricingUrl.search}`;
    }

    function startMedicineWheelUpgradeFlow() {
        window.MH_ANALYTICS?.trackCTA?.('medicine_wheel_premium_wall', {
            plan_id: 'pruvodce',
            feature: 'shamanske_kolo_plne_cteni'
        });

        if (window.Auth?.startPlanCheckout) {
            window.Auth.startPlanCheckout('pruvodce', {
                source: 'medicine_wheel_premium_wall',
                feature: 'shamanske_kolo_plne_cteni',
                metadata: {
                    entry_source: 'medicine_wheel_premium_wall',
                    entry_feature: 'shamanske_kolo_plne_cteni'
                },
                redirect: '/cenik.html',
                authMode: window.Auth?.isLoggedIn?.() ? 'login' : 'register'
            });
            return;
        }

        window.location.href = buildMedicineWheelUpgradeUrl();
    }

    function appendMedicineWheelFavoriteAction(container, readingId) {
        if (!container || !readingId) return;

        document.getElementById('favorite-medicine-wheel-action')?.remove();

        const action = document.createElement('div');
        action.id = 'favorite-medicine-wheel-action';
        action.className = 'text-center favorite-reading-action mt-md';
        action.innerHTML = `
            <button id="favorite-medicine-wheel-btn" type="button" aria-pressed="false" class="btn btn--glass favorite-reading-action__button">
                <svg class="mh-symbol mh-symbol--inline favorite-icon" viewBox="0 0 48 48" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/img/icons/mh-symbols.svg#star"></use></svg> Přidat do oblíbených
            </button>
        `;
        container.appendChild(action);

        action.querySelector('#favorite-medicine-wheel-btn')?.addEventListener('click', async () => {
            if (typeof window.toggleFavorite === 'function') {
                await window.toggleFavorite(readingId, 'favorite-medicine-wheel-btn');
            }
        });
    }

    function showPremiumContent(data) {
        document.getElementById('res-strengths').textContent = data.strengths || '';
        document.getElementById('res-challenges').textContent = data.challenges || '';
        document.getElementById('res-message').textContent = data.message || '';
        setBlockVisible('mw-premium-content', true);
        setBlockVisible('mw-premium-wall', false);
    }

    function showPremiumWall() {
        setBlockVisible('mw-premium-content', false);
        setBlockVisible('mw-premium-wall', true);
        document
            .querySelector('#mw-premium-wall .medicine-wheel-upgrade-btn')
            ?.addEventListener('click', (event) => {
                event.preventDefault();
                startMedicineWheelUpgradeFlow();
            }, { once: true });
    }

    function init() {
        const form = document.getElementById('mw-form');
        const submitButton = document.getElementById('mw-submit');
        const formSection = document.getElementById('mw-form-section');
        const birthDateInput = document.getElementById('mw-birth');
        const refreshBirthDateMaximum = () => {
            if (birthDateInput) birthDateInput.max = getPragueDateKey();
        };
        refreshBirthDateMaximum();
        form.addEventListener('focusin', refreshBirthDateMaximum);
        form.addEventListener('pointerdown', refreshBirthDateMaximum);
        form.addEventListener('keydown', refreshBirthDateMaximum);
        birthDateInput?.addEventListener('change', refreshBirthDateMaximum);
        window.addEventListener('focus', refreshBirthDateMaximum);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') refreshBirthDateMaximum();
        });

        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            refreshBirthDateMaximum();
            if (medicineWheelRequestInProgress) return;
            hideError();

            const nameInput = document.getElementById('mw-name');
            const birthInput = document.getElementById('mw-birth');
            const name = nameInput.value.trim();
            const birth = birthInput.value;

            if (!name || name.length < 2) { showError('Zadej své jméno (alespoň 2 znaky).'); return; }
            if (!birth) { showError('Zadej datum narození.'); return; }

            const requestId = ++medicineWheelRequestVersion;
            const readingSession = captureMedicineWheelSession();
            const readingOwnerId = readingSession.isLoggedIn ? readingSession.userId : null;
            activeMedicineWheelSession = readingSession;
            displayedMedicineWheelSession = null;
            medicineWheelActiveRequestId = requestId;
            medicineWheelRequestInProgress = true;
            medicineWheelRequestPhase = 'csrf';
            medicineWheelController = new AbortController();
            const controls = [nameInput, birthInput, submitButton];
            medicineWheelControlSnapshot = {
                formSection,
                previousBusy: formSection?.getAttribute('aria-busy') ?? null,
                controls: controls.map(control => ({ control, disabled: control.disabled }))
            };
            controls.forEach(control => { control.disabled = true; });
            formSection?.setAttribute('aria-busy', 'true');
            const requestStatus = document.getElementById('mw-request-status');
            if (requestStatus) requestStatus.hidden = true;

            try {
            showFallbackNotice(document.getElementById('mw-premium-content'), false);

            // Show loading
            setBlockVisible('mw-form-section', false);
            setBlockVisible('mw-loading', true);
            document.getElementById('mw-result').classList.remove('visible');

            // Determine totem locally (always available)
            const totem = getTotemByDate(birth);

            try {
                // Get CSRF token
                const csrfRes = await fetch(apiBase() + '/csrf-token', {
                    credentials: 'include',
                    signal: medicineWheelController.signal
                });
                if (!isCurrentMedicineWheelRequest(requestId, readingSession)) return;
                const csrfData = await csrfRes.json();
                if (!isCurrentMedicineWheelRequest(requestId, readingSession)) return;

                medicineWheelRequestPhase = 'api';
                const res = await fetch(apiBase() + '/medicine-wheel', {
                    method: 'POST',
                    credentials: 'include',
                    signal: medicineWheelController.signal,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfData.csrfToken || ''
                    },
                    body: JSON.stringify({ name, birthDate: birth, totem: totem.name })
                });
                if (!isCurrentMedicineWheelRequest(requestId, readingSession)) return;

                const data = await res.json();
                if (!isCurrentMedicineWheelRequest(requestId, readingSession)) return;

                setBlockVisible('mw-loading', false);

                // Show free result regardless of API outcome
                showFreeResult(name, totem);
                displayedMedicineWheelSession = readingSession;

                if (res.ok && data.success && data.result && data.result.strengths) {
                    showPremiumContent(data.result);
                    showFallbackNotice(document.getElementById('mw-premium-content'), data.fallback);
                    if (readingOwnerId && window.Auth?.saveReading) {
                        try {
                            const saveResult = await window.Auth.saveReading('medicine-wheel', {
                                name,
                                birthDate: birth,
                                totem,
                                result: data.result,
                                fallback: !!data.fallback
                            }, readingOwnerId);

                            if (!isCurrentMedicineWheelRequest(requestId, readingSession)) return;
                            if (saveResult?.id) {
                                appendMedicineWheelFavoriteAction(document.getElementById('mw-result'), saveResult.id);
                            } else {
                                showReadingSaveFailure();
                            }
                        } catch (saveError) {
                            if (!isCurrentMedicineWheelRequest(requestId, readingSession)) return;
                            console.warn('Medicine wheel save failed:', saveError.message);
                            showReadingSaveFailure();
                        }
                    }
                } else {
                    if (!isCurrentMedicineWheelRequest(requestId, readingSession)) return;
                    showPremiumWall();
                    if (![401, 402, 403].includes(res.status)) showResultError('Doplňující výklad se nepodařilo načíst. Základní symbol podle data je dostupný. Pro další pokus se vrať k údajům tlačítkem pod výsledkem.');
                }

            } catch (e) {
                if (!isCurrentMedicineWheelRequest(requestId, readingSession)) return;
                setBlockVisible('mw-loading', false);
                // Network error – show free (local) result, premium wall
                showFreeResult(name, totem);
                displayedMedicineWheelSession = readingSession;
                showResultError('Spojení se přerušilo. Základní symbol podle data je dostupný, doplňující výklad se nenačetl. Pro další pokus se vrať k údajům tlačítkem pod výsledkem.');
            }

            if (!isCurrentMedicineWheelRequest(requestId, readingSession)) return;
            setupShare(totem);
            document.getElementById('mw-result').classList.add('visible');
            window.scrollTo({ top: document.getElementById('mw-result').offsetTop - 80, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
            } finally {
                restoreMedicineWheelRequestState(requestId);
                if (medicineWheelActiveRequestId === null) activeMedicineWheelSession = null;
            }
        });

        // Reset
        document.getElementById('mw-reset').addEventListener('click', function () {
            const requestIsPending = medicineWheelRequestInProgress;
            ++medicineWheelRequestVersion;
            if (requestIsPending && medicineWheelRequestPhase === 'csrf') {
                medicineWheelController?.abort();
            }
            document.getElementById('mw-result').classList.remove('visible');
            setBlockVisible('mw-loading', false);
            setBlockVisible('mw-form-section', true);
            const requestStatus = document.getElementById('mw-request-status');
            if (requestStatus) {
                requestStatus.hidden = !requestIsPending;
            }
            window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        });
    }

    document.addEventListener('auth:changed', invalidateMedicineWheelSessionChange);
    window.addEventListener('storage', event => {
        if (event.key === 'auth_user') invalidateMedicineWheelSessionChange();
    });
    observedMedicineWheelSession = captureMedicineWheelSession();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
