/**
 * tarot-ano-nie-sk.js - Logika pre Tarot ÁNO/NIE (slovenská verzia)
 */
(function () {
    const answers = {
        ano: {
            label: 'ÁNO', emoji: '✅', class: 'ano',
            texts: [
                'Áno: čo konkrétne by ti tento krok mohol priniesť a čo od neho naozaj očakávaš?',
                'Skús si pomenovať, čo ťa k tomuto rozhodnutiu priťahuje. Platí to aj po pokojnom premyslení?',
                'Pred ďalším krokom si ujasni, čo potrebuješ vedieť, aby si sa rozhodol s dôverou.',
                'Táto odpoveď otvára možnosť. Ktorý malý krok si vieš bezpečne overiť?',
                'Čo by pre teba znamenalo povedať áno bez toho, aby si prekročil vlastné hranice?',
                'Všímaj si, či tvoje dôvody vychádzajú z toho, čo chceš, alebo z tlaku okolia.',
                'Ktorá časť tohto zámeru je v tvojej moci a ktorú nemôžeš zaručiť?',
                'Ak sa pre tento krok rozhodneš, čo si chceš vopred pripraviť?',
                'Čo ti na tejto možnosti dáva zmysel, keď odložíš strach aj očakávania?',
                'Skús si predstaviť prvý konkrétny krok a over, či je pre teba teraz primeraný.',
            ]
        },
        skor_ano: {
            label: 'SKÔR ÁNO', emoji: '🌟', class: 'mozna',
            texts: [
                'Skôr áno: čo si ešte potrebuješ overiť, aby si sa cítil rozhodnutý?',
                'Táto možnosť ťa zrejme oslovuje. Ktorú jej praktickú stránku si ešte nepreskúmal?',
                'Rozdeľ si rozhodnutie na menší krok a zisti, či ti stále dáva zmysel.',
                'Čo by ti pomohlo povedať áno bez zbytočného ponáhľania?',
                'Oddeľ vlastné dôvody od toho, čo od teba očakávajú ostatní.',
            ]
        },
        nejasne: {
            label: 'NEJASNÉ', emoji: '🔮', class: 'mozna',
            texts: [
                'Nejasné: ktorú časť otázky zatiaľ nevieš zodpovedať?',
                'Možno sa v jednej otázke skrýva viac rozhodnutí. Ktoré z nich riešiš ako prvé?',
                'Aké informácie ti chýbajú, aby si sa vedel rozhodnúť?',
                'Skús otázku zúžiť na jeden krok, ktorý máš skutočne vo vlastných rukách.',
                'Nemusíš mať odpoveď hneď. Čo by ti pomohlo získať viac jasno?',
            ]
        },
        skor_nie: {
            label: 'SKÔR NIE', emoji: '⚠️', class: 'ne',
            texts: [
                'Skôr nie: aké riziko alebo hranicu by bolo dobré vziať vážne?',
                'Čo ťa pri tejto možnosti zneisťuje? Skús to pomenovať bez prikrášlenia.',
                'Zváž, či je to tvoje vlastné želanie, alebo odpoveď na tlak niekoho iného.',
                'Ktorú inú možnosť by si mal preskúmať, kým sa rozhodneš?',
                'Nemusíš sa ponáhľať. Čo by sa zmenilo, keby si si nechal čas na premyslenie?',
            ]
        },
        nie: {
            label: 'NIE', emoji: '🚨', class: 'ne',
            texts: [
                'Nie: čo by si potreboval odmietnuť alebo ochrániť, aby si zostal verný svojim hraniciam?',
                'Čo ti na tejto možnosti nesedí, aj keď si to možno ešte nepovedal nahlas?',
                'Ktorú alternatívu môžeš zvážiť bez toho, aby si sa musel rozhodnúť okamžite?',
                'Je toto „nie“ tvoje vlastné rozhodnutie, alebo reakcia na obavu či tlak?',
                'Ak túto možnosť odmietneš, aký praktický ďalší krok ti zostáva?',
            ]
        }
    };

    // Distribúcia: 25% ÁNO, 20% SKÔR ÁNO, 20% NEJASNÉ, 20% SKÔR NIE, 15% NIE
    const pool = [
        'ano', 'ano', 'ano', 'ano', 'ano',
        'skor_ano', 'skor_ano', 'skor_ano', 'skor_ano',
        'nejasne', 'nejasne', 'nejasne', 'nejasne',
        'skor_nie', 'skor_nie', 'skor_nie', 'skor_nie',
        'nie', 'nie', 'nie'
    ];

    function createAnswerDeck() {
        const shuffled = [...pool];
        for (let index = shuffled.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
        }
        return shuffled.slice(0, 5);
    }

    let used = false;
    let cardAnswerKeys = createAnswerDeck();
    let lastResult = null;
    let savedReadingId = null;
    let firstValueTracked = false;

    const TAROT_YES_NO_FEATURE = 'tarot_multi_card';
    const TAROT_YES_NO_PLAN_ID = 'pruvodce';
    const TAROT_YES_NO_RESULT_SOURCE = 'tarot_yes_no_result_sk';
    const TAROT_YES_NO_TOOL = 'tarot_yes_no_sk';
    const PENDING_READING_STORAGE_KEY = 'mh_pending_reading';
    const TAROT_YES_NO_UPGRADE_CONTEXT_KEY = 'mh_tarot_yes_no_upgrade_context';

    function buildTarotYesNoUpgradeUrl(source = TAROT_YES_NO_RESULT_SOURCE) {
        const pricingUrl = new URL('/cenik.html', window.location.origin);
        pricingUrl.searchParams.set('plan', TAROT_YES_NO_PLAN_ID);
        pricingUrl.searchParams.set('source', source);
        pricingUrl.searchParams.set('feature', TAROT_YES_NO_FEATURE);
        pricingUrl.searchParams.set('entry_source', source);
        pricingUrl.searchParams.set('entry_feature', TAROT_YES_NO_FEATURE);
        return `${pricingUrl.pathname}${pricingUrl.search}`;
    }

    function buildTarotYesNoResumeUrl(source = TAROT_YES_NO_RESULT_SOURCE) {
        const tarotUrl = new URL('/tarot.html', window.location.origin);
        tarotUrl.searchParams.set('source', 'tarot_yes_no_premium_resume');
        tarotUrl.searchParams.set('feature', TAROT_YES_NO_FEATURE);
        tarotUrl.searchParams.set('entry_source', source);
        tarotUrl.searchParams.set('entry_feature', TAROT_YES_NO_FEATURE);
        tarotUrl.searchParams.set('resume', 'tarot_yes_no');
        return `${tarotUrl.pathname}${tarotUrl.search}`;
    }

    async function trackTarotYesNoFunnelEvent(eventName, source, metadata = {}, feature = TAROT_YES_NO_FEATURE, planId = TAROT_YES_NO_PLAN_ID) {
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
            console.warn('[Tarot ANO/NIE SK funnel] Could not record event:', error.message);
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
                cardId: null,
                cardName: null,
                locale: 'sk',
                source,
                createdAt: Date.now()
            }));
            return true;
        } catch (error) {
            console.warn('[Tarot ANO/NIE SK] Could not store upgrade context:', error.message);
            return false;
        }
    }

    function startTarotYesNoUpgradeFlow(source = TAROT_YES_NO_RESULT_SOURCE) {
        const checkoutMetadata = {
            entry_source: source,
            entry_feature: TAROT_YES_NO_FEATURE
        };

        storeTarotYesNoUpgradeContext(lastResult, source);
        storePendingTarotYesNoReading(lastResult, {
            source,
            feature: TAROT_YES_NO_FEATURE
        });

        window.MH_ANALYTICS?.trackCTA?.(source, {
            plan_id: TAROT_YES_NO_PLAN_ID,
            feature: TAROT_YES_NO_FEATURE,
            has_preserved_question: Boolean(lastResult?.question),
            ...checkoutMetadata
        });

        void trackTarotYesNoFunnelEvent('paywall_cta_clicked', source, {
            destination: window.Auth?.isPremium?.() ? '/tarot.html' : '/cenik.html',
            has_preserved_question: Boolean(lastResult?.question)
        });

        if (window.Auth?.isLoggedIn?.() && window.Auth?.isPremium?.()) {
            window.location.href = buildTarotYesNoResumeUrl(source);
            return;
        }

        if (window.Auth?.startPlanCheckout) {
            window.Auth.startPlanCheckout(TAROT_YES_NO_PLAN_ID, {
                source,
                feature: TAROT_YES_NO_FEATURE,
                metadata: checkoutMetadata,
                redirect: '/cenik.html',
                authMode: window.Auth?.isLoggedIn?.() ? 'login' : 'register'
            });
            return;
        }

        window.location.href = buildTarotYesNoUpgradeUrl(source);
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
        const rect = panel.getBoundingClientRect();
        let targetTop = window.scrollY + rect.top - Math.max(86, (availableHeight - rect.height) / 2);
        const resetButton = document.getElementById('btn-reset');

        if (reservedBottom && resetButton) {
            const bannerTop = viewportHeight - reservedBottom + 16;
            const resetRect = resetButton.getBoundingClientRect();
            const predictedResetBottom = resetRect.bottom - (targetTop - window.scrollY);
            const overlap = predictedResetBottom - (bannerTop - 8);
            if (overlap > 0) {
                targetTop += overlap;
            }
        }

        window.scrollTo({
            top: Math.max(0, targetTop),
            behavior
        });
    }

    function getResultMetadata(answerKey, ans, question) {
        return {
            answer_key: answerKey,
            answer_label: ans.label,
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
            locale: 'sk',
            ...metadata
        });
    }

    function buildTarotYesNoReadingData(result = lastResult) {
        if (!result) return null;

        return {
            tool: TAROT_YES_NO_TOOL,
            source: TAROT_YES_NO_RESULT_SOURCE,
            question: result.question,
            answer: `${result.label}: ${result.text}`,
            result_label: result.label,
            result_key: result.answerKey,
            result_text: result.text,
            saved_at: new Date().toISOString()
        };
    }

    function storePendingTarotYesNoReading(result = lastResult, options = {}) {
        const readingData = buildTarotYesNoReadingData(result);
        if (!readingData) return false;

        try {
            localStorage.setItem(PENDING_READING_STORAGE_KEY, JSON.stringify({
                type: 'tarot',
                data: readingData,
                source: options.source || 'tarot_yes_no_save_journal_sk',
                feature: options.feature || TAROT_YES_NO_TOOL,
                createdAt: Date.now()
            }));
            return true;
        } catch (error) {
            console.warn('[Tarot ANO/NIE SK] Could not store pending reading:', error.message);
            return false;
        }
    }

    async function postTarotYesNoReading(result = lastResult) {
        const readingData = buildTarotYesNoReadingData(result);
        if (!readingData) throw new Error('Missing tarot result');

        const headers = { 'Content-Type': 'application/json' };
        const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
        if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

        const response = await fetch(`${window.API_CONFIG?.BASE_URL || '/api'}/user/readings`, {
            method: 'POST',
            credentials: 'include',
            headers,
            body: JSON.stringify({
                type: 'tarot',
                data: readingData
            })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.success) {
            throw new Error(payload?.error || 'Reading save failed');
        }

        return payload;
    }

    async function saveTarotYesNoReading() {
        const button = document.getElementById('btn-save-reading');
        if (!lastResult || !button) return;

        const metadata = {
            ...getResultMetadata(lastResult.answerKey, lastResult, lastResult.question),
            save_target: 'profile_journal'
        };

        trackTarotYesNoEvent('save_click', metadata);
        await trackTarotYesNoFunnelEvent('reading_save_clicked', 'tarot_yes_no_save_journal_sk', metadata, TAROT_YES_NO_TOOL, null);

        if (savedReadingId) {
            window.Auth?.showToast?.('Už uložené', 'Tento výklad už je v denníku.', 'success');
            return;
        }

        if (!window.Auth?.isLoggedIn?.()) {
            storePendingTarotYesNoReading(lastResult);
            trackTarotYesNoEvent('login_click', {
                ...metadata,
                auth_mode: 'register',
                reason: 'save_reading'
            });
            window.location.href = '/prihlaseni.html?mode=register&source=tarot_yes_no_save_journal_sk&feature=tarot_yes_no&redirect=/profil.html';
            return;
        }

        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Ukladám...';

        try {
            const payload = await postTarotYesNoReading(lastResult);
            savedReadingId = payload.id || payload.reading?.id || true;
            button.textContent = 'Uložené v denníku';
            window.Auth?.showToast?.('Výklad uložený', 'Nájdeš ho v profile v histórii výkladov.', 'success');
            trackTarotYesNoEvent('reading_saved', {
                ...metadata,
                reading_id: payload.id || payload.reading?.id || null
            });
            void trackTarotYesNoFunnelEvent('reading_saved', 'tarot_yes_no_save_journal_sk', {
                ...metadata,
                reading_id: payload.id || payload.reading?.id || null
            }, TAROT_YES_NO_TOOL, null);
        } catch (error) {
            console.warn('[Tarot ANO/NIE SK] Could not save reading:', error.message);
            button.disabled = false;
            button.textContent = originalText;
            window.Auth?.showToast?.('Nepodarilo sa uložiť', 'Skús to prosím znova o chvíľu.', 'error');
        }
    }

    function trackTarotYesNoFirstValue(answerKey, ans, question) {
        if (firstValueTracked) return;
        firstValueTracked = true;

        const metadata = {
            ...getResultMetadata(answerKey, ans, question),
            source: TAROT_YES_NO_RESULT_SOURCE,
            feature: TAROT_YES_NO_FEATURE,
            first_value_type: 'tarot_yes_no_result_sk',
            seo_cluster: 'tarot',
            seo_page_type: 'free_tool',
            locale: 'sk'
        };

        if (window.MH_ANALYTICS?.trackFirstValueCompleted) {
            window.MH_ANALYTICS.trackFirstValueCompleted(TAROT_YES_NO_FEATURE, metadata);
        } else {
            window.MH_ANALYTICS?.trackEvent?.('first_value_completed', metadata);
        }

        void trackTarotYesNoFunnelEvent('first_value_completed', TAROT_YES_NO_RESULT_SOURCE, metadata);
    }

    function wrapCanvasText(ctx, text, maxWidth) {
        if (window.MH_SHARE_IMAGE?.wrapText) {
            return window.MH_SHARE_IMAGE.wrapText(ctx, text, maxWidth);
        }

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

    function drawCenteredLines(ctx, lines, centerX, startY, lineHeight, maxLines = lines.length, maxWidth = Infinity) {
        if (window.MH_SHARE_IMAGE?.drawCenteredLines) {
            return window.MH_SHARE_IMAGE.drawCenteredLines(ctx, lines, centerX, startY, lineHeight, maxLines, maxWidth);
        }

        lines.slice(0, maxLines).forEach((line, index) => {
            ctx.fillText(line, centerX, startY + index * lineHeight);
        });
        return startY + Math.min(lines.length, maxLines) * lineHeight;
    }

    async function drawTarotYesNoResultCard(result) {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;

        if (window.MH_SHARE_IMAGE?.drawBrandBackground) {
            await window.MH_SHARE_IMAGE.drawBrandBackground(ctx, canvas);
        } else {
            ctx.fillStyle = '#0b1929';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.fillStyle = '#d0b17c';
        ctx.font = '700 48px Cinzel, Georgia, serif';
        ctx.fillText('TAROT ÁNO/NIE', centerX, 280);

        ctx.fillStyle = result.answerClass === 'ne' ? '#ff9ea8' : (result.answerClass === 'ano' ? '#b9f3c2' : '#d0b17c');
        ctx.font = '700 92px Cinzel, Georgia, serif';
        ctx.fillText(result.label, centerX, 405);

        let y = 575;
        if (result.question) {
            ctx.fillStyle = 'rgba(233,227,215,0.72)';
            ctx.font = '500 34px Inter, Arial, sans-serif';
            ctx.fillText('Otázka', centerX, y);
            y += 52;

            ctx.fillStyle = '#e9e3d7';
            ctx.font = '600 38px Inter, Arial, sans-serif';
            const questionLines = wrapCanvasText(ctx, result.question, 820);
            y = drawCenteredLines(ctx, questionLines, centerX, y, 50, 3, 820) + 28;
        }

        ctx.fillStyle = 'rgba(189,155,101,0.86)';
        ctx.fillRect(170, y, 740, 3);
        y += 70;

        ctx.fillStyle = '#e9e3d7';
        ctx.font = '500 42px Inter, Arial, sans-serif';
        const resultLines = wrapCanvasText(ctx, result.text, 820);
        y = drawCenteredLines(ctx, resultLines, centerX, y, 56, 6, 820);

        ctx.fillStyle = 'rgba(233,227,215,0.78)';
        ctx.font = '500 32px Inter, Arial, sans-serif';
        ctx.fillText('mystickahvezda.cz/sk/tarot-ano-nie.html', centerX, 1215);

        ctx.fillStyle = 'rgba(208,177,124,0.94)';
        ctx.font = '600 28px Inter, Arial, sans-serif';
        ctx.fillText('Ulož si výsledok alebo ho pošli niekomu, kto sa pýta rovnako.', centerX, 1254);

        return canvas;
    }

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

        const baseMetadata = getResultMetadata(lastResult.answerKey, lastResult, lastResult.question);
        trackTarotYesNoEvent('save_click', {
            ...baseMetadata,
            save_target: 'result_image'
        });

        const fileName = `tarot-ano-nie-${lastResult.answerKey}.png`;

        try {
            const canvas = await drawTarotYesNoResultCard(lastResult);

            let file = null;
            try {
                file = await canvasToPngFile(canvas, fileName);
            } catch (blobError) {
                console.warn('[Tarot ÁNO/NIE] Blob render fallback:', blobError.message);
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
                        title: 'Tarot ÁNO / NIE',
                        text: `Karty mi na moju otázku odpovedali ${lastResult.label}. Opýtaj sa aj ty na mystickahvezda.cz`
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
            console.warn('[Tarot ÁNO/NIE] Could not build result image:', error.message);
        }
    }

    function revealTarotYesNoNextStep(answerKey, ans, question) {
        const nextStep = document.getElementById('tarot-yes-no-next-step');
        const answerBadge = document.getElementById('tarot-yes-no-next-answer');
        const upgradeAnswer = document.getElementById('tarot-result-upgrade-answer');
        if (!nextStep) return;

        if (answerBadge) {
            answerBadge.textContent = ans.label.toLowerCase();
        }
        if (upgradeAnswer) {
            upgradeAnswer.textContent = ans.label;
        }

        nextStep.dataset.answerKey = answerKey;
        setBlockVisible(nextStep, true);

        const metadata = getResultMetadata(answerKey, ans, question);
        window.MH_ANALYTICS?.trackAction?.('tarot_yes_no_result_bridge_viewed', {
            ...metadata,
            feature: TAROT_YES_NO_FEATURE,
            source: TAROT_YES_NO_RESULT_SOURCE
        });
        // Toto je voliteľná ponuka po hotovom bezplatnom výsledku, nie paywall.
        // Paywall metriku nechávame až skutočným zamknutým obrazovkám; inak sa
        // každý výsledok tváril ako návšteva paywallu a skresľoval konverziu.
        window.MH_ANALYTICS?.trackAction?.('tarot_yes_no_upgrade_bridge_viewed', {
            ...metadata,
            feature: TAROT_YES_NO_FEATURE,
            source: TAROT_YES_NO_RESULT_SOURCE,
            plan_id: TAROT_YES_NO_PLAN_ID
        });
    }

    function bindTarotYesNoBridgeLinks() {
        document.querySelectorAll('[data-tarot-yes-no-upgrade]').forEach((link) => {
            if (link.dataset.tarotYesNoBound === 'true') return;
            link.dataset.tarotYesNoBound = 'true';
            link.addEventListener('click', (event) => {
                event.preventDefault();
                startTarotYesNoUpgradeFlow(link.dataset.tarotYesNoUpgrade || TAROT_YES_NO_RESULT_SOURCE);
            });
        });

        document.querySelectorAll('[data-tarot-yes-no-intent]').forEach((link) => {
            if (link.dataset.tarotYesNoBound === 'true') return;
            link.dataset.tarotYesNoBound = 'true';
            link.addEventListener('click', () => {
                window.MH_ANALYTICS?.trackCTA?.('tarot_yes_no_intent_sk', {
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
                window.MH_ANALYTICS?.trackCTA?.('tarot_yes_no_save_profile_sk', {
                    intent,
                    destination,
                    source: TAROT_YES_NO_RESULT_SOURCE,
                    feature: destinationFeature
                });
            });
        });
    }

    function flipCard(card, index) {
        if (used) return;

        const inputEl = document.getElementById('question-input');
        const q = inputEl.value.trim();

        if (!q) {
            inputEl.focus();
            inputEl.classList.add('input--invalid');

            inputEl.classList.remove('shake');
            void inputEl.offsetWidth; // trigger reflow
            inputEl.classList.add('shake');

            console.warn('Tarot SK: Pokus o vytiahnutie karty bez zadanej otázky.');
            return;
        }

        inputEl.classList.remove('input--invalid');
        inputEl.classList.remove('shake');

        used = true;
        savedReadingId = null;
        trackTarotYesNoEvent('reading_start', {
            source: 'tarot_yes_no_card_pick_sk',
            feature: TAROT_YES_NO_TOOL,
            has_question: true,
            question_length: Math.min(q.length, 200),
            selected_card_index: index
        });

        document.querySelectorAll('.tarot-card').forEach(c => c.classList.add('tarot-card--locked'));

        const key = cardAnswerKeys[index] || cardAnswerKeys[0];
        const ans = answers[key];
        const text = ans.texts[Math.floor(Math.random() * ans.texts.length)];
        lastResult = {
            answerKey: key,
            answerClass: ans.class,
            label: ans.label,
            text,
            question: q
        };
        window.__lastTarotYesNoShareResult = lastResult;

        const front = card.querySelector('.card-front');
        front.classList.add(ans.class);
        front.innerHTML = `<span class="card-emoji">${ans.emoji}</span><span class="answer-label">${ans.label}</span>`;

        card.classList.add('flipped');

        setTimeout(() => {
            document.getElementById('result-emoji').textContent = ans.emoji;
            document.getElementById('result-title').textContent = ans.label;
            const resultTitle = document.getElementById('result-title');
            resultTitle.classList.remove('result-title--yes', 'result-title--no', 'result-title--maybe');
            resultTitle.classList.add(ans.class === 'ano' ? 'result-title--yes' : (ans.class === 'ne' ? 'result-title--no' : 'result-title--maybe'));
            document.getElementById('result-text').textContent = text;
            const panel = document.getElementById('result-panel');
            panel.classList.add('show');
            trackTarotYesNoEvent('reading_complete', {
                ...getResultMetadata(key, ans, q),
                selected_card_index: index
            });
            trackTarotYesNoFirstValue(key, ans, q);
            revealTarotYesNoNextStep(key, ans, q);
            scrollTarotResultIntoView(panel);
            setTimeout(() => scrollTarotResultIntoView(panel), 320);
        }, 800);
    }

    function resetCards() {
        used = false;
        cardAnswerKeys = createAnswerDeck();
        lastResult = null;
        savedReadingId = null;
        window.__lastTarotYesNoShareResult = null;
        document.getElementById('question-input').value = '';
        const saveReadingButton = document.getElementById('btn-save-reading');
        if (saveReadingButton) {
            saveReadingButton.disabled = false;
            saveReadingButton.textContent = 'Uložiť do denníka';
        }
        document.getElementById('question-input').classList.remove('input--invalid');
        document.getElementById('result-panel').classList.remove('show');
        setBlockVisible(document.getElementById('tarot-yes-no-next-step'), false);

        document.querySelectorAll('.tarot-card').forEach(c => {
            c.classList.remove('flipped', 'tarot-card--locked');
            const front = c.querySelector('.card-front');
            front.className = 'card-front card-face';
            front.innerHTML = '';
        });

        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 150);
    }

    function initTarotAnoNieSk() {
        const cardsArea = document.getElementById('cards-area');
        const btnReset = document.getElementById('btn-reset');
        const btnSaveReading = document.getElementById('btn-save-reading');
        const btnSaveResultImage = document.getElementById('btn-save-result-image');

        if (cardsArea) {
            cardsArea.addEventListener('click', (e) => {
                const card = e.target.closest('.tarot-card');
                if (card) {
                    const idx = card.getAttribute('data-index');
                    if (idx !== null) {
                        flipCard(card, parseInt(idx));
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
                btnSaveResultImage.textContent = '✨ Zdieľať výsledok';
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTarotAnoNieSk);
    } else {
        initTarotAnoNieSk();
    }
})();
