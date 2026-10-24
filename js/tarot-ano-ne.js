import { getDailyCardPractice } from './utils/daily-tarot.js';

/**
 * tarot-ano-ne.js - Logika pro Tarot ANO/NE
 */
(function () {
    // Verdikt, vysvětlení (proč) a konkrétní další krok pro každou ze 78 karet.
    // Jména karet odpovídají klíčům v data/tarot-cards.json (obrázek).
    const CARD_DIRECTIONS = {
    "Blázen": "ano",
    "Mág": "ano",
    "Velekněžka": "nejasne",
    "Císařovna": "ano",
    "Císař": "ano",
    "Velekněz": "nejasne",
    "Milenci": "ano",
    "Vůz": "ano",
    "Síla": "ano",
    "Poustevník": "nejasne",
    "Kolo štěstí": "ano",
    "Spravedlnost": "nejasne",
    "Viselec": "ne",
    "Smrt": "ne",
    "Mírnost": "nejasne",
    "Ďábel": "ne",
    "Věž": "ne",
    "Hvězda": "ano",
    "Luna": "nejasne",
    "Slunce": "ano",
    "Soud": "ano",
    "Svět": "ano",
    "Eso holí": "ano",
    "Dvojka holí": "nejasne",
    "Trojka holí": "nejasne",
    "Čtyřka holí": "ano",
    "Pětka holí": "ne",
    "Šestka holí": "ano",
    "Sedmička holí": "ne",
    "Osmička holí": "ne",
    "Devítka holí": "ne",
    "Desítka holí": "ne",
    "Páže holí": "nejasne",
    "Rytíř holí": "ano",
    "Královna holí": "ano",
    "Král holí": "ne",
    "Eso pohárů": "ano",
    "Dvojka pohárů": "ano",
    "Trojka pohárů": "ano",
    "Čtyřka pohárů": "ne",
    "Pětka pohárů": "ne",
    "Šestka pohárů": "nejasne",
    "Sedmička pohárů": "nejasne",
    "Osmička pohárů": "ne",
    "Devítka pohárů": "nejasne",
    "Desítka pohárů": "ano",
    "Páže pohárů": "nejasne",
    "Rytíř pohárů": "nejasne",
    "Královna pohárů": "ano",
    "Král pohárů": "ano",
    "Eso mečů": "ano",
    "Dvojka mečů": "nejasne",
    "Trojka mečů": "ne",
    "Čtyřka mečů": "nejasne",
    "Pětka mečů": "ne",
    "Šestka mečů": "ano",
    "Sedmička mečů": "ne",
    "Osmička mečů": "ne",
    "Devítka mečů": "ne",
    "Desítka mečů": "ne",
    "Páže mečů": "nejasne",
    "Rytíř mečů": "ano",
    "Královna mečů": "ano",
    "Král mečů": "nejasne",
    "Eso pentáklů": "ano",
    "Dvojka pentáklů": "nejasne",
    "Trojka pentáklů": "nejasne",
    "Čtyřka pentáklů": "nejasne",
    "Pětka pentáklů": "ne",
    "Šestka pentáklů": "ano",
    "Sedmička pentáklů": "nejasne",
    "Osmička pentáklů": "ano",
    "Devítka pentáklů": "ano",
    "Desítka pentáklů": "ano",
    "Páže pentáklů": "ano",
    "Rytíř pentáklů": "ne",
    "Královna pentáklů": "ano",
    "Král pentáklů": "ano"
};
    const CARD_VERDICTS = Object.fromEntries(Object.entries(CARD_DIRECTIONS).map(([name, verdict]) => {
        const practice = getDailyCardPractice(name);
        return [name, { verdict, proc: `${practice.observation} ${practice.question}`, krok: practice.action }];
    }));

    const VERDICT_META = {
        ano: { label: 'ANO', class: 'ano' },
        ne: { label: 'NE', class: 'ne' },
        nejasne: { label: 'NEJASNÉ', class: 'mozna' }
    };

    const CARD_DATA_URL = 'data/tarot-cards.json?v=20261007-deck-v2';
    const FALLBACK_CARD_IMAGE = 'img/tarot-v2/tarot_card_back.webp';

    function applyCardImageFallback(image) {
        image.onerror = () => {
            image.onerror = null;
            image.removeAttribute('srcset');
            image.removeAttribute('sizes');
            image.src = FALLBACK_CARD_IMAGE;
        };
    }

    let cardPool = [];
    let cardDataLoaded = false;
    let used = false;
    let lastResult = null;
    let pendingResultTimeout = null;
    let resultGeneration = 0;
    let savedReadingId = null;
    let readingSaveInFlight = false;
    let firstValueTracked = false;

    const TAROT_YES_NO_FEATURE = 'tarot_multi_card';
    const TAROT_YES_NO_RESULT_SOURCE = 'tarot_yes_no_result';
    const TAROT_YES_NO_TOOL = 'tarot_yes_no';
    const PENDING_READING_STORAGE_KEY = 'mh_pending_reading';
    const TAROT_YES_NO_UPGRADE_CONTEXT_KEY = 'mh_tarot_yes_no_upgrade_context';

    function createTarotReadingRequestId() {
        if (window.crypto?.randomUUID) return window.crypto.randomUUID();

        const bytes = new Uint8Array(16);
        if (window.crypto?.getRandomValues) {
            window.crypto.getRandomValues(bytes);
        } else {
            for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
        }
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }

    function getTarotReadingRequestId(result = lastResult) {
        if (!result) return null;
        if (!result.saveRequestId) result.saveRequestId = createTarotReadingRequestId();
        return result.saveRequestId;
    }

    // Karty, u kterých v CARD_VERDICTS chybí odpovídající záznam v data/tarot-cards.json,
    // se prostě přeskočí z losovacího poolu (obranné programování pro budoucí změny datasetu).
    async function loadCardPool() {
        if (cardDataLoaded) return cardPool;

        try {
            const response = await fetch(CARD_DATA_URL, { credentials: 'same-origin', cache: 'no-cache' });
            if (!response.ok) throw new Error(`Tarot data failed: ${response.status}`);
            const data = await response.json();

            cardPool = Object.entries(CARD_VERDICTS)
                .filter(([name]) => Boolean(data[name]))
                .map(([name, info]) => ({
                    name,
                    verdict: info.verdict,
                    proc: info.proc,
                    krok: info.krok,
                    image: data[name].image || FALLBACK_CARD_IMAGE
                }));
        } catch (error) {
            console.warn('[Tarot ANO/NE] Nepodařilo se načíst kartotéku, používám nouzový výběr:', error.message);
            cardPool = [];
        }

        cardDataLoaded = true;
        return cardPool;
    }

    function buildTarotYesNoResumeUrl(source = TAROT_YES_NO_RESULT_SOURCE) {
        const tarotUrl = new URL('/tarot.html', window.location.origin);
        tarotUrl.searchParams.set('source', 'tarot_yes_no_premium_resume');
        tarotUrl.searchParams.set('feature', TAROT_YES_NO_FEATURE);
        tarotUrl.searchParams.set('entry_source', source);
        tarotUrl.searchParams.set('entry_feature', TAROT_YES_NO_FEATURE);
        tarotUrl.searchParams.set('resume', 'tarot_yes_no');
        if (lastResult?.cardName) {
            tarotUrl.searchParams.set('card', lastResult.cardName);
        }
        return `${tarotUrl.pathname}${tarotUrl.search}`;
    }

    async function trackTarotYesNoFunnelEvent(eventName, source, metadata = {}, feature = TAROT_YES_NO_FEATURE, planId = null) {
        try {
            const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
            if (!csrfToken) return;

            const payload = {
                eventName,
                source,
                feature,
                metadata: {
                    path: window.location.pathname,
                    ...metadata
                }
            };
            if (planId) {
                payload.planId = planId;
            }

            await fetch(`${window.API_CONFIG?.BASE_URL || '/api'}/payment/funnel-event`, {
                method: 'POST',
                credentials: 'include',
                keepalive: true,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.warn('[Tarot ANO/NE funnel] Could not record event:', error.message);
        }
    }

    function storeTarotYesNoUpgradeContext(result = lastResult, source = TAROT_YES_NO_RESULT_SOURCE) {
        if (!result) return false;

        try {
            localStorage.setItem(TAROT_YES_NO_UPGRADE_CONTEXT_KEY, JSON.stringify({
                question: result.question,
                answerLabel: result.label,
                answerKey: result.answerKey,
                resultText: result.text,
                cardId: result.cardId || null,
                cardName: result.cardName || null,
                locale: 'cs',
                source,
                createdAt: Date.now()
            }));
            return true;
        } catch (error) {
            console.warn('[Tarot ANO/NE] Could not store upgrade context:', error.message);
            return false;
        }
    }

    function continueTarotYesNoAsMember(source = TAROT_YES_NO_RESULT_SOURCE) {
        if (!lastResult || !window.Auth?.isLoggedIn?.() || !window.Auth?.isPremium?.()) return;

        storeTarotYesNoUpgradeContext(lastResult, source);
        storePendingTarotYesNoReading(lastResult, {
            source,
            feature: TAROT_YES_NO_FEATURE
        });
        window.location.href = buildTarotYesNoResumeUrl(source);
    }

    function setBlockVisible(element, visible) {
        if (!element) return;
        element.hidden = !visible;
        element.classList.toggle('mh-block-visible', visible);
    }

    function getVisibleCookieBannerOffset() {
        const banner = document.getElementById('cookie-banner');
        if (!banner || banner.hidden || !banner.classList.contains('visible')) return 0;

        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const rect = banner.getBoundingClientRect();
        // Lišta najíždí translateY přechodem (0.5s) — rect.top je během
        // animace ještě dole a rezerva by vyšla nulová. Výška se transformem
        // nemění, takže rezervu počítej z konečné klidové polohy lišty.
        const restingTop = viewportHeight - 16 - rect.height;
        return Math.max(0, viewportHeight - Math.min(rect.top, restingTop) + 16);
    }

    function scrollTarotResultIntoView(panel, behavior = 'smooth') {
        if (!panel) return;

        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const reservedBottom = getVisibleCookieBannerOffset();
        const availableHeight = Math.max(320, viewportHeight - reservedBottom);
        // Align the free answer, not the much taller optional offer below it.
        const rect = (panel.querySelector('.yes-no-reading') || panel).getBoundingClientRect();
        let targetTop = window.scrollY + rect.top - Math.max(86, (availableHeight - rect.height) / 2);
        const resetButton = document.getElementById('btn-reset');

        if (reservedBottom && resetButton) {
            const bannerTop = viewportHeight - reservedBottom + 16;
            const resetRect = resetButton.getBoundingClientRect();
            const predictedResetBottom = resetRect.bottom - (targetTop - window.scrollY);
            const overlap = predictedResetBottom - (bannerTop - 8);
            if (overlap > 0 && resetRect.bottom - rect.top < availableHeight - 100) {
                targetTop += overlap;
            }
        }

        window.scrollTo({
            top: Math.max(0, targetTop),
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : behavior
        });
    }

    function getResultMetadata(answerKey, ans, question) {
        return {
            answer_key: answerKey,
            answer_label: ans.label,
            card_id: ans.cardId,
            card_name: ans.cardName,
            has_question: Boolean(question),
            question_length: Math.min((question || '').length, 200)
        };
    }

    function trackTarotYesNoEvent(eventName, metadata = {}) {
        window.MH_ANALYTICS?.trackEvent?.(eventName, {
            source: TAROT_YES_NO_RESULT_SOURCE,
            feature: TAROT_YES_NO_TOOL,
            seo_cluster: 'tarot',
            seo_page_type: 'free_tool',
            ...metadata
        });
    }

    function buildTarotYesNoReadingData(result = lastResult) {
        if (!result) return null;

        return {
            tool: TAROT_YES_NO_TOOL,
            source: TAROT_YES_NO_RESULT_SOURCE,
            question: result.question,
            answer: `${result.cardName} — ${result.label}: ${result.text}`,
            result_label: result.label,
            result_key: result.answerKey,
            result_text: result.text,
            card_id: result.cardId,
            card_name: result.cardName,
            saved_at: result.savedAt || new Date().toISOString()
        };
    }

    function storePendingTarotYesNoReading(result = lastResult, options = {}) {
        const readingData = buildTarotYesNoReadingData(result);
        if (!readingData) return false;

        try {
            const userId = window.Auth?.isLoggedIn?.() ? window.Auth?.user?.id || null : null;
            const serialized = JSON.stringify({
                type: 'tarot',
                data: readingData,
                requestId: getTarotReadingRequestId(result),
                userId,
                source: options.source || 'tarot_yes_no_save_journal',
                feature: options.feature || TAROT_YES_NO_TOOL,
                createdAt: Date.now()
            });

            try {
                localStorage.setItem(PENDING_READING_STORAGE_KEY, serialized);
                return true;
            } catch {
                sessionStorage.setItem(PENDING_READING_STORAGE_KEY, serialized);
            }

            return true;
        } catch (error) {
            console.warn('[Tarot ANO/NE] Could not store pending reading:', error.message);
            return false;
        }
    }

    function createTarotAccountChangedError() {
        const error = new Error('Authenticated account changed before reading save.');
        error.code = 'ACCOUNT_CHANGED';
        return error;
    }

    async function postTarotYesNoReading(result = lastResult, expectedUserId) {
        const readingData = buildTarotYesNoReadingData(result);
        if (!readingData) throw new Error('Missing tarot result');
        if (typeof expectedUserId !== 'string' || !expectedUserId) throw createTarotAccountChangedError();

        const headers = { 'Content-Type': 'application/json' };
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
        if (window.Auth?.user?.id !== expectedUserId || !window.Auth?.isLoggedIn?.()) {
            throw createTarotAccountChangedError();
        }

        const response = await fetch(`${window.API_CONFIG?.BASE_URL || '/api'}/user/readings`, {
            method: 'POST',
            credentials: 'include',
            headers,
            body: JSON.stringify({
                type: 'tarot',
                data: readingData,
                requestId: getTarotReadingRequestId(result),
                expectedUserId
            })
        });

        const payload = await response.json().catch(() => ({}));
        if (response.status === 409 && payload?.error === 'Reading belongs to a different account.') {
            throw createTarotAccountChangedError();
        }
        if (!response.ok || !payload?.success) {
            throw new Error(payload?.error || 'Reading save failed');
        }

        return payload;
    }

    async function saveTarotYesNoReading() {
        const button = document.getElementById('btn-save-reading');
        const readingToSave = lastResult;
        if (!readingToSave || !button || readingSaveInFlight) return;

        if (savedReadingId) {
            window.Auth?.showToast?.('Už uloženo', 'Tenhle výklad už je v deníku.', 'success');
            return;
        }

        const loggedInAtClick = Boolean(window.Auth?.isLoggedIn?.());
        const userIdAtClick = loggedInAtClick ? window.Auth?.user?.id || null : null;

        const metadata = {
            ...getResultMetadata(readingToSave.answerKey, readingToSave, readingToSave.question),
            save_target: 'profile_journal'
        };
        readingSaveInFlight = true;
        const originalText = button.textContent;
        const resetButton = document.getElementById('btn-reset');
        const resetWasDisabled = Boolean(resetButton?.disabled);
        let redirecting = false;
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.textContent = 'Ukládám...';
        if (resetButton) resetButton.disabled = true;

        try {
            try {
                trackTarotYesNoEvent('save_click', metadata);
            } catch (analyticsError) {
                console.warn('[Tarot ANO/NE] Save-click analytics unavailable:', analyticsError.message);
            }
            await trackTarotYesNoFunnelEvent('reading_save_clicked', 'tarot_yes_no_save_journal', metadata, TAROT_YES_NO_TOOL, null);

            const loggedInNow = Boolean(window.Auth?.isLoggedIn?.());
            const userIdNow = window.Auth?.user?.id || null;
            if (loggedInNow !== loggedInAtClick
                || (loggedInAtClick && (!userIdAtClick || userIdNow !== userIdAtClick))) {
                window.Auth?.showToast?.(
                    'Přihlášení se změnilo',
                    'Výklad zůstal otevřený. Ověř účet a potom uložení zkus znovu.',
                    'error'
                );
                return;
            }

            if (!loggedInAtClick) {
                if (!storePendingTarotYesNoReading(readingToSave)) {
                    window.Auth?.showToast?.(
                        'Výklad zůstává otevřený',
                        'Pro uložení do profilu povol úložiště pro tento web a zkus to znovu.',
                        'error'
                    );
                    return;
                }
                try {
                    trackTarotYesNoEvent('login_click', {
                        ...metadata,
                        auth_mode: 'register',
                        reason: 'save_reading'
                    });
                } catch (analyticsError) {
                    console.warn('[Tarot ANO/NE] Login-click analytics unavailable:', analyticsError.message);
                }
                redirecting = true;
                window.location.href = 'prihlaseni.html?mode=register&source=tarot_yes_no_save_journal&feature=tarot_yes_no&redirect=/profil.html';
                return;
            }

            const payload = await postTarotYesNoReading(readingToSave, userIdAtClick);
            savedReadingId = payload.id || payload.reading?.id || true;
            button.textContent = 'Uloženo v deníku';
            window.Auth?.showToast?.('Výklad uložen', 'Najdeš ho v profilu v historii výkladů.', 'success');
            try {
                trackTarotYesNoEvent('reading_saved', {
                    ...metadata,
                    reading_id: payload.id || payload.reading?.id || null
                });
            } catch (analyticsError) {
                console.warn('[Tarot ANO/NE] Saved-reading analytics unavailable:', analyticsError.message);
            }
            void trackTarotYesNoFunnelEvent('reading_saved', 'tarot_yes_no_save_journal', {
                ...metadata,
                reading_id: payload.id || payload.reading?.id || null
            }, TAROT_YES_NO_TOOL, null);
        } catch (error) {
            console.warn('[Tarot ANO/NE] Could not save reading:', error.message);
            if (error?.code === 'ACCOUNT_CHANGED') {
                window.Auth?.showToast?.('Přihlášení se změnilo', 'Výklad zůstal otevřený. Ověř účet a potom uložení zkus znovu.', 'error');
            } else {
                window.Auth?.showToast?.('Nepodařilo se uložit', 'Zkus to prosím znovu za chvíli.', 'error');
            }
        } finally {
            readingSaveInFlight = false;
            button.removeAttribute('aria-busy');
            button.disabled = Boolean(savedReadingId) || redirecting;
            if (!savedReadingId && !redirecting) button.textContent = originalText;
            if (resetButton) resetButton.disabled = resetWasDisabled;
        }
    }

    function trackTarotYesNoFirstValue(answerKey, ans, question) {
        if (firstValueTracked) return;
        firstValueTracked = true;

        const metadata = {
            ...getResultMetadata(answerKey, ans, question),
            source: TAROT_YES_NO_RESULT_SOURCE,
            feature: TAROT_YES_NO_FEATURE,
            first_value_type: 'tarot_yes_no_result',
            seo_cluster: 'tarot',
            seo_page_type: 'free_tool'
        };

        if (window.MH_ANALYTICS?.trackFirstValueCompleted) {
            window.MH_ANALYTICS.trackFirstValueCompleted(TAROT_YES_NO_FEATURE, metadata);
        } else {
            window.MH_ANALYTICS?.trackEvent?.('first_value_completed', metadata);
        }

        void trackTarotYesNoFunnelEvent('first_value_completed', TAROT_YES_NO_RESULT_SOURCE, metadata);
    }

    function wrapCanvasText(ctx, text, maxWidth) {
        const words = String(text || '').split(/\s+/).filter(Boolean);
        const lines = [];
        let current = '';

        words.forEach((word) => {
            const test = current ? `${current} ${word}` : word;
            if (ctx.measureText(test).width <= maxWidth) {
                current = test;
            } else {
                if (current) lines.push(current);
                current = word;
            }
        });

        if (current) lines.push(current);
        return lines;
    }

    function drawCenteredLines(ctx, lines, centerX, startY, lineHeight, maxLines = lines.length) {
        lines.slice(0, maxLines).forEach((line, index) => {
            ctx.fillText(line, centerX, startY + index * lineHeight);
        });
        return startY + Math.min(lines.length, maxLines) * lineHeight;
    }

    function loadCanvasImage(src) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Image failed: ${src}`));
            image.src = src;
        });
    }

    function drawImageContain(ctx, image, x, y, width, height) {
        const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
        const drawWidth = image.naturalWidth * ratio;
        const drawHeight = image.naturalHeight * ratio;
        const drawX = x + (width - drawWidth) / 2;
        const drawY = y + (height - drawHeight) / 2;
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    }

    function drawImageCover(ctx, image, x, y, width, height) {
        const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight);
        const drawWidth = image.naturalWidth * ratio;
        const drawHeight = image.naturalHeight * ratio;
        const drawX = x + (width - drawWidth) / 2;
        const drawY = y + (height - drawHeight) / 2;
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    }

    function limitCanvasLines(ctx, lines, maxLines, maxWidth) {
        if (lines.length <= maxLines) return lines;

        const visible = lines.slice(0, maxLines);
        let lastLine = visible[maxLines - 1].trimEnd();
        while (lastLine && ctx.measureText(`${lastLine}…`).width > maxWidth) {
            lastLine = lastLine.slice(0, -1).trimEnd();
        }
        visible[maxLines - 1] = `${lastLine}…`;
        return visible;
    }

    const PAINTED_EXPORT_BACKGROUND = '/img/atlas/tools-v1/02-mesicni-krajina.webp';
    let paintedExportBackgroundPromise = null;
    function loadPaintedExportBackground() {
        if (!paintedExportBackgroundPromise) {
            paintedExportBackgroundPromise = loadCanvasImage(PAINTED_EXPORT_BACKGROUND)
                .catch((error) => {
                    console.warn('[Tarot ANO/NE] Painted background fallback:', error.message);
                    return null;
                });
        }
        return paintedExportBackgroundPromise;
    }

    async function drawTarotYesNoResultCard(result) {
        const [paintedBackground] = await Promise.all([
            loadPaintedExportBackground(),
            document.fonts?.ready
        ]);
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0b1929');
        gradient.addColorStop(0.52, '#102638');
        gradient.addColorStop(1, '#07121f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (paintedBackground) {
            const artworkHeight = 620;
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, canvas.width, artworkHeight);
            ctx.clip();
            drawImageCover(ctx, paintedBackground, 0, 0, canvas.width, artworkHeight);
            const veil = ctx.createLinearGradient(0, 0, 0, artworkHeight);
            veil.addColorStop(0, 'rgba(11,25,41,0.88)');
            veil.addColorStop(0.48, 'rgba(11,25,41,0.3)');
            veil.addColorStop(1, '#102638');
            ctx.fillStyle = veil;
            ctx.fillRect(0, 0, canvas.width, artworkHeight);
            ctx.restore();
        }

        ctx.strokeStyle = 'rgba(208,177,124,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(54, 54, canvas.width - 108, canvas.height - 108);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#d0b17c';
        ctx.font = '600 38px Inter, Arial, sans-serif';
        ctx.fillText('Mystická Hvězda', centerX, 130);

        let cardImage = null;
        try {
            cardImage = await loadCanvasImage(result.image || FALLBACK_CARD_IMAGE);
        } catch (error) {
            console.warn('[Tarot ANO/NE] Image render fallback:', error.message);
        }

        const cardBox = { x: 440, y: 165, width: 200, height: 292 };
        ctx.fillStyle = 'rgba(208,177,124,0.12)';
        ctx.fillRect(cardBox.x - 12, cardBox.y - 12, cardBox.width + 24, cardBox.height + 24);
        ctx.strokeStyle = 'rgba(208,177,124,0.58)';
        ctx.lineWidth = 3;
        ctx.strokeRect(cardBox.x - 12, cardBox.y - 12, cardBox.width + 24, cardBox.height + 24);
        if (cardImage) {
            drawImageContain(ctx, cardImage, cardBox.x, cardBox.y, cardBox.width, cardBox.height);
        } else {
            ctx.fillStyle = 'rgba(233,227,215,0.08)';
            ctx.fillRect(cardBox.x, cardBox.y, cardBox.width, cardBox.height);
        }

        ctx.fillStyle = '#e9e3d7';
        ctx.font = '700 38px Cinzel, Georgia, serif';
        ctx.fillText(result.cardName, centerX, 512);

        ctx.fillStyle = '#d0b17c';
        ctx.font = '700 74px Cinzel, Georgia, serif';
        ctx.fillText(result.label, centerX, 605);

        let y = 700;
        if (result.question) {
            ctx.fillStyle = '#c0c8ca';
            ctx.font = '500 32px Inter, Arial, sans-serif';
            ctx.fillText('Ptáš se', centerX, y);
            y += 48;

            ctx.fillStyle = '#e9e3d7';
            ctx.font = '600 36px Inter, Arial, sans-serif';
            const questionLines = limitCanvasLines(ctx, wrapCanvasText(ctx, result.question, 820), 2, 820);
            y = drawCenteredLines(ctx, questionLines, centerX, y, 46, 2) + 24;
        }

        ctx.fillStyle = 'rgba(208,177,124,0.86)';
        ctx.fillRect(170, y, 740, 3);
        y += 58;

        ctx.fillStyle = '#e9e3d7';
        ctx.font = '500 36px Inter, Arial, sans-serif';
        const resultLines = limitCanvasLines(ctx, wrapCanvasText(ctx, result.text, 840), 5, 840);
        y = drawCenteredLines(ctx, resultLines, centerX, y, 47, 5);

        ctx.fillStyle = '#e9e3d7';
        ctx.font = '500 30px Inter, Arial, sans-serif';
        ctx.fillText('mystickahvezda.cz/tarot-ano-ne.html', centerX, 1240);

        ctx.fillStyle = '#d0b17c';
        ctx.font = '600 26px Inter, Arial, sans-serif';
        ctx.fillText('Ulož si výsledek nebo ho pošli někomu, kdo se ptá stejně.', centerX, 1280);

        return canvas;
    }

    // Capability probe so the button label matches what will actually happen:
    // mobile with the Web Share API can open a native share sheet, desktop falls
    // back to a file download. Tested with a dummy file because canShare depends
    // on the payload type, not just API presence.
    function deviceSupportsFileShare() {
        try {
            if (typeof navigator === 'undefined' || typeof navigator.share !== 'function' || !navigator.canShare) {
                return false;
            }
            const probe = new File([new Blob([''], { type: 'image/png' })], 'probe.png', { type: 'image/png' });
            return navigator.canShare({ files: [probe] });
        } catch {
            return false;
        }
    }

    function canvasToPngFile(canvas, fileName) {
        return new Promise((resolve, reject) => {
            if (!canvas.toBlob) {
                reject(new Error('canvas.toBlob unsupported'));
                return;
            }
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(new File([blob], fileName, { type: 'image/png' }));
                } else {
                    reject(new Error('Canvas render produced no blob.'));
                }
            }, 'image/png');
        });
    }

    function downloadCanvas(canvas, fileName) {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    async function saveTarotYesNoResultImage() {
        if (!lastResult) return;

        const button = document.getElementById('btn-save-result-image');
        const originalText = button ? button.textContent : null;
        if (button) {
            button.disabled = true;
            button.textContent = 'Připravuji obrázek...';
        }

        const baseMetadata = getResultMetadata(lastResult.answerKey, lastResult, lastResult.question);
        trackTarotYesNoEvent('save_click', {
            ...baseMetadata,
            save_target: 'result_image'
        });

        const fileName = `tarot-ano-ne-${lastResult.answerKey}.png`;

        try {
            const canvas = await drawTarotYesNoResultCard(lastResult);

            let file = null;
            try {
                file = await canvasToPngFile(canvas, fileName);
            } catch (blobError) {
                console.warn('[Tarot ANO/NE] Blob render fallback:', blobError.message);
            }

            const canShareFile = Boolean(
                file
                && typeof navigator.share === 'function'
                && navigator.canShare
                && navigator.canShare({ files: [file] })
            );

            if (canShareFile) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Tarot ANO / NE',
                        text: `Můj symbolický výsledek z jedné tarotové karty: ${lastResult.label}. Je to podnět k zamyšlení, ne jistá odpověď. Zkus si vlastní tah na mystickahvezda.cz.`
                    });
                    window.MH_ANALYTICS?.trackAction?.('tarot_yes_no_result_image_shared', {
                        ...baseMetadata,
                        source: TAROT_YES_NO_RESULT_SOURCE,
                        share_target: 'web_share',
                        format: 'png'
                    });
                } catch (shareError) {
                    if (shareError && shareError.name === 'AbortError') {
                        window.MH_ANALYTICS?.trackAction?.('tarot_yes_no_result_image_share_cancelled', {
                            ...baseMetadata,
                            source: TAROT_YES_NO_RESULT_SOURCE
                        });
                    } else {
                        downloadCanvas(canvas, fileName);
                        window.MH_ANALYTICS?.trackAction?.('tarot_yes_no_result_image_saved', {
                            ...baseMetadata,
                            source: TAROT_YES_NO_RESULT_SOURCE,
                            share_target: 'download_fallback',
                            format: 'png'
                        });
                    }
                }
            } else {
                downloadCanvas(canvas, fileName);
                window.MH_ANALYTICS?.trackAction?.('tarot_yes_no_result_image_saved', {
                    ...baseMetadata,
                    source: TAROT_YES_NO_RESULT_SOURCE,
                    share_target: 'download',
                    format: 'png'
                });
            }
        } catch (error) {
            console.warn('[Tarot ANO/NE] Could not build result image:', error.message);
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    }

    function revealTarotYesNoNextStep(answerKey, ans, question) {
        const nextStep = document.getElementById('tarot-yes-no-next-step');
        const answerBadge = document.getElementById('tarot-yes-no-next-answer');
        if (!nextStep) return;

        if (answerBadge) {
            answerBadge.textContent = ans.label.toLowerCase();
        }
        nextStep.dataset.answerKey = answerKey;
        setBlockVisible(nextStep, !window.Auth?.isLoggedIn?.());
        setBlockVisible(
            document.querySelector('[data-tarot-member-continuation]'),
            Boolean(window.Auth?.isLoggedIn?.() && window.Auth?.isPremium?.())
        );

        const metadata = getResultMetadata(answerKey, ans, question);
        // The yes/no answer remains complete and free. The paid path is a small,
        // optional bridge rather than a gate, so do not emit paywall_viewed here;
        // that previously overstated actual paywall volume roughly 15x.
        window.MH_ANALYTICS?.trackAction?.('tarot_yes_no_result_bridge_viewed', {
            ...metadata,
            feature: TAROT_YES_NO_FEATURE,
            source: TAROT_YES_NO_RESULT_SOURCE
        });
    }

    function bindTarotYesNoBridgeLinks() {
        document.querySelectorAll('[data-tarot-yes-no-member-continuation]').forEach((link) => {
            if (link.dataset.tarotYesNoBound === 'true') return;
            link.dataset.tarotYesNoBound = 'true';
            link.addEventListener('click', (event) => {
                event.preventDefault();
                continueTarotYesNoAsMember(link.dataset.tarotYesNoMemberContinuation || TAROT_YES_NO_RESULT_SOURCE);
            });
        });

        document.querySelectorAll('[data-tarot-yes-no-intent]').forEach((link) => {
            if (link.dataset.tarotYesNoBound === 'true') return;
            link.dataset.tarotYesNoBound = 'true';
            link.addEventListener('click', () => {
                window.MH_ANALYTICS?.trackCTA?.('tarot_yes_no_intent', {
                    intent: link.dataset.tarotYesNoIntent,
                    destination: link.getAttribute('href') || '',
                    source: TAROT_YES_NO_RESULT_SOURCE
                });
            });
        });

        document.querySelectorAll('[data-tarot-yes-no-register]').forEach((link) => {
            if (link.dataset.tarotYesNoBound === 'true') return;
            link.dataset.tarotYesNoBound = 'true';
            link.addEventListener('click', () => {
                const intent = link.dataset.tarotYesNoRegister;
                const destination = link.getAttribute('href') || '';
                const destinationUrl = new URL(destination, window.location.origin);
                const destinationSource = destinationUrl.searchParams.get('source') || TAROT_YES_NO_RESULT_SOURCE;
                const destinationFeature = destinationUrl.searchParams.get('feature') || TAROT_YES_NO_TOOL;
                if (lastResult && (intent === 'save_reading' || intent === 'save_profile')) {
                    storePendingTarotYesNoReading(lastResult, {
                        source: destinationSource,
                        feature: destinationFeature
                    });
                }
                window.MH_ANALYTICS?.trackCTA?.('tarot_yes_no_save_profile', {
                    intent,
                    destination,
                    source: TAROT_YES_NO_RESULT_SOURCE,
                    feature: destinationFeature
                });
                // Funnel-level capture metric: how many turn a free yes/no answer
                // into a free registration (email captured + activation sequence).
                void trackTarotYesNoFunnelEvent('reading_save_clicked', TAROT_YES_NO_RESULT_SOURCE, {
                    intent,
                    destination
                }, TAROT_YES_NO_TOOL, null);
            });
        });
    }

    function pickCard() {
        if (cardPool.length > 0) {
            return cardPool[Math.floor(Math.random() * cardPool.length)];
        }

        // Nouzový výběr, kdyby se kartotéka nepodařila načíst (offline/chyba sítě).
        const fallbackNames = Object.keys(CARD_VERDICTS);
        const name = fallbackNames[Math.floor(Math.random() * fallbackNames.length)];
        const info = CARD_VERDICTS[name];
        return {
            name,
            verdict: info.verdict,
            proc: info.proc,
            krok: info.krok,
            image: FALLBACK_CARD_IMAGE
        };
    }

    async function flipCard(card, index) {
        if (used) return;

        const inputEl = document.getElementById('question-input');
        const q = inputEl.value.trim();

        if (!q) {
            // Zobrazíme UX upozornění - uživatel musí vyplnit otázku
            inputEl.focus();
            inputEl.classList.add('input--invalid');
            inputEl.setAttribute('aria-invalid', 'true');
            const error = document.getElementById('question-error');
            if (error) error.hidden = false;

            // Přidat "shake" animaci k elementu
            inputEl.classList.remove('shake');
            void inputEl.offsetWidth; // trigger reflow
            inputEl.classList.add('shake');

            // Zpráva do konzole pro jistotu (lze pak ztlumit)
            console.warn('Tarot: Pokus o tažení karty bez zadané otázky.');
            return;
        }

        // Obnovíme původní barvu ohraničení InputBoxu
        inputEl.classList.remove('input--invalid');
        inputEl.classList.remove('shake');
        inputEl.removeAttribute('aria-invalid');
        const questionError = document.getElementById('question-error');
        if (questionError) questionError.hidden = true;

        used = true;
        inputEl.readOnly = true;
        const drawGeneration = ++resultGeneration;
        savedReadingId = null;
        trackTarotYesNoEvent('reading_start', {
            source: 'tarot_yes_no_card_pick',
            feature: TAROT_YES_NO_TOOL,
            has_question: true,
            question_length: Math.min(q.length, 200),
            selected_card_index: index
        });

        // Uzamčeme ostatní karty
        document.querySelectorAll('.tarot-card').forEach(c => {
            c.classList.add('tarot-card--locked');
            c.setAttribute('aria-disabled', 'true');
        });

        await loadCardPool();

        // Uživatel mohl výklad během načítání kartotéky resetovat.
        if (drawGeneration !== resultGeneration || !used) return;

        // Vyhodnocení - losujeme skutečnou kartu ze 78 karet
        const drawnCard = pickCard();
        const meta = VERDICT_META[drawnCard.verdict] || VERDICT_META.nejasne;
        const key = drawnCard.verdict;
        const ans = {
            label: meta.label,
            class: meta.class,
            cardId: drawnCard.name,
            cardName: drawnCard.name
        };
        const text = drawnCard.proc;
        lastResult = {
            answerKey: key,
            answerClass: ans.class,
            label: ans.label,
            text,
            question: q,
            cardId: drawnCard.name,
            cardName: drawnCard.name,
            saveRequestId: createTarotReadingRequestId(),
            savedAt: new Date().toISOString(),
            image: drawnCard.image,
            krok: drawnCard.krok
        };
        const resultForDraw = lastResult;
        window.__lastTarotYesNoShareResult = lastResult;
        document.dispatchEvent(new CustomEvent('mh:tarot-yes-no-context-changed'));

        // Přední líc karty ukáže skutečnou ilustraci a štítek výsledku.
        const front = card.querySelector('.card-front');
        front.classList.add(ans.class);
        front.innerHTML = '';

        const cardImage = document.createElement('img');
        cardImage.className = 'card-front-image';
        applyCardImageFallback(cardImage);
        cardImage.src = drawnCard.image;
        cardImage.alt = drawnCard.name;
        cardImage.width = 600;
        cardImage.height = 1000;
        cardImage.decoding = 'async';
        cardImage.loading = 'lazy';
        front.appendChild(cardImage);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'card-front-name';
        nameSpan.textContent = drawnCard.name;
        front.appendChild(nameSpan);

        const answerSpan = document.createElement('span');
        answerSpan.className = 'answer-label';
        answerSpan.textContent = ans.label;
        front.appendChild(answerSpan);

        // Otočení animací
        card.classList.add('flipped');

        // Mírné zpoždění na otočku a zobrazení panelu s textem
        pendingResultTimeout = setTimeout(() => {
            pendingResultTimeout = null;
            if (drawGeneration !== resultGeneration || lastResult !== resultForDraw) return;

            const resultImage = document.getElementById('result-card-image');
            if (resultImage) {
                applyCardImageFallback(resultImage);
                resultImage.src = drawnCard.image;
                resultImage.alt = `Tarotová karta: ${drawnCard.name}`;
                resultImage.hidden = false;
                // Obrázek karty se donačítá až po prvním scrollu — bez
                // přepočtu by tlačítka výsledku sjela pod cookie lištu.
                if (!resultImage.complete) {
                    resultImage.addEventListener('load', () => {
                        const shownPanel = document.getElementById('result-panel');
                        if (drawGeneration === resultGeneration && lastResult === resultForDraw && shownPanel?.classList.contains('show')) {
                            scrollTarotResultIntoView(shownPanel, 'auto');
                        }
                    }, { once: true });
                }
            }
            document.getElementById('result-card-name').textContent = drawnCard.name;
            document.getElementById('result-title').textContent = ans.label;
            const resultTitle = document.getElementById('result-title');
            resultTitle.classList.remove('result-title--yes', 'result-title--no', 'result-title--maybe');
            resultTitle.classList.add(ans.class === 'ano' ? 'result-title--yes' : (ans.class === 'ne' ? 'result-title--no' : 'result-title--maybe'));
            const resultQuestion = document.getElementById('result-question');
            if (resultQuestion) {
                resultQuestion.textContent = `Ptáš se: „${q}"`;
            }
            document.getElementById('result-text').textContent = text;
            const resultStep = document.getElementById('result-next-step-text');
            if (resultStep) {
                resultStep.textContent = drawnCard.krok;
            }
            const panel = document.getElementById('result-panel');
            panel.classList.add('show');
            document.getElementById('result-title').focus({ preventScroll: true });
            trackTarotYesNoEvent('reading_complete', {
                ...getResultMetadata(key, ans, q),
                selected_card_index: index
            });
            trackTarotYesNoFirstValue(key, ans, q);
            revealTarotYesNoNextStep(key, ans, q);
            scrollTarotResultIntoView(panel);
            setTimeout(() => {
                if (drawGeneration === resultGeneration && lastResult === resultForDraw && panel.classList.contains('show')) {
                    scrollTarotResultIntoView(panel);
                }
            }, 320);
        }, 800);
    }

    function resetCards() {
        if (readingSaveInFlight) return;
        if (pendingResultTimeout !== null) {
            clearTimeout(pendingResultTimeout);
            pendingResultTimeout = null;
        }
        resultGeneration += 1;
        used = false;
        lastResult = null;
        savedReadingId = null;
        window.__lastTarotYesNoShareResult = null;
        document.dispatchEvent(new CustomEvent('mh:tarot-yes-no-context-changed'));
        document.getElementById('question-input').value = '';
        document.getElementById('question-input').readOnly = false;
        const saveReadingButton = document.getElementById('btn-save-reading');
        if (saveReadingButton) {
            saveReadingButton.disabled = false;
            saveReadingButton.textContent = 'Uložit odpověď do deníku';
        }
        document.getElementById('question-input').classList.remove('input--invalid');
        document.getElementById('question-input').removeAttribute('aria-invalid');
        const questionError = document.getElementById('question-error');
        if (questionError) questionError.hidden = true;
        document.getElementById('result-panel').classList.remove('show');
        const resultImage = document.getElementById('result-card-image');
        if (resultImage) {
            resultImage.hidden = true;
            resultImage.removeAttribute('srcset');
            resultImage.removeAttribute('sizes');
            resultImage.src = '';
        }
        const resultQuestion = document.getElementById('result-question');
        if (resultQuestion) resultQuestion.textContent = '';
        const resultStep = document.getElementById('result-next-step-text');
        if (resultStep) resultStep.textContent = '';
        setBlockVisible(document.getElementById('tarot-yes-no-next-step'), false);

        document.querySelectorAll('.tarot-card').forEach(c => {
            c.classList.remove('flipped', 'tarot-card--locked');
            c.removeAttribute('aria-disabled');
            const front = c.querySelector('.card-front');
            front.className = 'card-front card-face';
            front.innerHTML = '';
        });

        // Smooth srcoll opět lehce zpátky k inputu po tichém doznění
        setTimeout(() => {
            document.getElementById('question-input').focus({ preventScroll: true });
            window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        }, 150);
    }

    function initTarotAnoNe() {
        const cardsArea = document.getElementById('cards-area');
        const btnReset = document.getElementById('btn-reset');
        const btnSaveReading = document.getElementById('btn-save-reading');
        const btnSaveResultImage = document.getElementById('btn-save-result-image');

        void loadCardPool();

        if (cardsArea) {
            cardsArea.addEventListener('click', (e) => {
                const card = e.target.closest('.tarot-card');
                if (card) {
                    const idx = card.getAttribute('data-index');
                    if (idx !== null) {
                        void flipCard(card, parseInt(idx));
                    }
                }
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', resetCards);
        }

        if (btnSaveReading) {
            btnSaveReading.addEventListener('click', saveTarotYesNoReading);
        }

        if (btnSaveResultImage) {
            if (deviceSupportsFileShare()) {
                btnSaveResultImage.textContent = 'Sdílet výsledek';
            }
            btnSaveResultImage.addEventListener('click', saveTarotYesNoResultImage);
        }

        bindTarotYesNoBridgeLinks();

        window.addEventListener('mh_cookie_banner_visible', () => {
            const panel = document.getElementById('result-panel');
            if (panel?.classList.contains('show')) {
                scrollTarotResultIntoView(panel);
            }
        });
    }

    // Spolehlivě ukotví listenery i pro případy dynamického loadu
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTarotAnoNe);
    } else {
        initTarotAnoNe();
    }
})();
