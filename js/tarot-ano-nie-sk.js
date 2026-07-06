/**
 * tarot-ano-nie-sk.js - Logika pre Tarot ÁNO/NIE (slovenská verzia)
 */
(function () {
    const answers = {
        ano: {
            label: 'ÁNO', emoji: '✅', class: 'ano',
            texts: [
                'Hviezdy hovoria jasne — áno, je to správna cesta. Dôveruj svojmu instinktu.',
                'Karty naznačujú pozitívny výsledok. Konaj s dôverou.',
                'Energia je priaznivá. Toto je správny čas pre tvoj zámer.',
                'Vesmír ti dáva zelenú. Tvoja intuícia ťa vedie správne.',
                'Áno — ale pamätaj, že kroky sú v rukách tvojej slobodnej vôle.',
                'Výsledok bude pozitívny, ak budeš konať úprimne a odvážne.',
                'Karty vidia priaznivú cestu. Máš vnútornú silu to dokázať.',
                'Áno. Priprav sa prijať to, o čo si žiadal.',
                'Tarot súhlasí. Tvoje srdce pozná odpoveď.',
                'Áno — a skoré kroky túto šancu posilnia.',
            ]
        },
        skor_ano: {
            label: 'SKÔR ÁNO', emoji: '🌟', class: 'mozna',
            texts: [
                'Znamenia ukazujú skôr pozitívny výsledok, ale záleží na tvojich ďalších krokoch.',
                'Pravdepodobne áno — hoci cesta nemusí byť priamočiara.',
                'Šanca je na tvojej strane, ale buď trpezlivý.',
                'Karty vidia nádej. Veci sa vyvíjajú správnym smerom.',
                'Skôr áno, ak si zachováš jasnú myseľ a otvorenosť.',
            ]
        },
        nejasne: {
            label: 'NEJASNÉ', emoji: '🔮', class: 'mozna',
            texts: [
                'Budúcnosť je zatiaľ otvorená. Otázka možno ešte nie je zrelá.',
                'Karty vidia hmlu. Skús sa opýtať znovu inak alebo inokedy.',
                'Energie sú nevyvážené. Počkaj a potom sa znova opýtaj.',
                'Odpoveď ešte nie je pevná — záleží na mnohých faktoroch.',
                'Výsledok závisí od tvojich najbližších rozhodnutí.',
            ]
        },
        skor_nie: {
            label: 'SKÔR NIE', emoji: '⚠️', class: 'ne',
            texts: [
                'Karty varujú pred touto cestou. Zváž alternatívy.',
                'Skôr nie — ale nie je to definitívne. Okolnosti sa môžu zmeniť.',
                'Energia nie je priaznivá pre tento zámer v tejto chvíli.',
                'Tarot odporúča opatrnosť a prehodnotenie situácie.',
                'Možno nie je vhodný čas. Opýtaj sa, čo ťa brzdí.',
            ]
        },
        nie: {
            label: 'NIE', emoji: '🚨', class: 'ne',
            texts: [
                'Karty jasne varujú. Táto cesta nie je pre teba to pravé.',
                'Nie — ale každá zatvorená brána vedie k iným možnostiam.',
                'Tarot vidí prekážky. Prijmi túto odpoveď ako vedenie, nie ako trest.',
                'Tento zámer neprinesie dobré ovocie. Hľadaj inú cestu.',
                'Nie. Tvoja intuícia ti možno hovorí to isté.',
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

    let used = false;
    let lastResult = null;
    let savedReadingId = null;
    let firstValueTracked = false;

    const TAROT_YES_NO_FEATURE = 'tarot_multi_card';
    const TAROT_YES_NO_PLAN_ID = 'pruvodce';
    const TAROT_YES_NO_RESULT_SOURCE = 'tarot_yes_no_result_sk';
    const TAROT_YES_NO_TOOL = 'tarot_yes_no_sk';
    const PENDING_READING_STORAGE_KEY = 'mh_pending_reading';

    function buildTarotYesNoUpgradeUrl(source = TAROT_YES_NO_RESULT_SOURCE) {
        const pricingUrl = new URL('/cenik.html', window.location.origin);
        pricingUrl.searchParams.set('plan', TAROT_YES_NO_PLAN_ID);
        pricingUrl.searchParams.set('source', source);
        pricingUrl.searchParams.set('feature', TAROT_YES_NO_FEATURE);
        pricingUrl.searchParams.set('entry_source', source);
        pricingUrl.searchParams.set('entry_feature', TAROT_YES_NO_FEATURE);
        return `${pricingUrl.pathname}${pricingUrl.search}`;
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

    function startTarotYesNoUpgradeFlow(source = TAROT_YES_NO_RESULT_SOURCE) {
        window.MH_ANALYTICS?.trackCTA?.(source, {
            plan_id: TAROT_YES_NO_PLAN_ID,
            feature: TAROT_YES_NO_FEATURE
        });

        void trackTarotYesNoFunnelEvent('paywall_cta_clicked', source, {
            destination: '/cenik.html'
        });

        if (window.Auth?.startPlanCheckout) {
            window.Auth.startPlanCheckout(TAROT_YES_NO_PLAN_ID, {
                source,
                feature: TAROT_YES_NO_FEATURE,
                metadata: {
                    entry_source: source,
                    entry_feature: TAROT_YES_NO_FEATURE
                },
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

    function storePendingTarotYesNoReading(result = lastResult) {
        const readingData = buildTarotYesNoReadingData(result);
        if (!readingData) return false;

        try {
            localStorage.setItem(PENDING_READING_STORAGE_KEY, JSON.stringify({
                type: 'tarot',
                data: readingData,
                source: 'tarot_yes_no_save_journal_sk',
                feature: TAROT_YES_NO_TOOL,
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

    function drawTarotYesNoResultCard(result) {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#141038');
        gradient.addColorStop(0.48, '#070716');
        gradient.addColorStop(1, '#050510');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const seed = result.answerKey.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) + result.question.length;
        for (let i = 0; i < 220; i += 1) {
            const x = (Math.sin(seed + i * 12.9898) * 43758.5453) % 1;
            const y = (Math.sin(seed + i * 78.233) * 24634.6345) % 1;
            const px = Math.abs(x) * canvas.width;
            const py = Math.abs(y) * canvas.height * 0.72;
            const r = i % 9 === 0 ? 2.3 : 1.2;
            ctx.fillStyle = i % 7 === 0 ? 'rgba(230,195,80,0.75)' : 'rgba(235,240,255,0.72)';
            ctx.beginPath();
            ctx.arc(px, py, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = 'rgba(212,175,55,0.84)';
        ctx.lineWidth = 5;
        ctx.strokeRect(54, 54, canvas.width - 108, canvas.height - 108);
        ctx.strokeStyle = 'rgba(212,175,55,0.34)';
        ctx.lineWidth = 2;
        ctx.strokeRect(78, 78, canvas.width - 156, canvas.height - 156);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#d4af37';
        ctx.font = '600 42px Inter, Arial, sans-serif';
        ctx.fillText('Mystická Hviezda', centerX, 145);

        ctx.fillStyle = 'rgba(212,175,55,0.18)';
        ctx.beginPath();
        ctx.arc(centerX, 360, 190, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(212,175,55,0.78)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, 360, 160, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#f1d06b';
        ctx.font = '700 48px Cinzel, Georgia, serif';
        ctx.fillText('TAROT ÁNO/NIE', centerX, 280);

        ctx.fillStyle = result.answerClass === 'ne' ? '#ff9ea8' : (result.answerClass === 'ano' ? '#b9f3c2' : '#f1d06b');
        ctx.font = '700 92px Cinzel, Georgia, serif';
        ctx.fillText(result.label, centerX, 405);

        let y = 575;
        if (result.question) {
            ctx.fillStyle = 'rgba(255,255,255,0.72)';
            ctx.font = '500 34px Inter, Arial, sans-serif';
            ctx.fillText('Otázka', centerX, y);
            y += 52;

            ctx.fillStyle = '#ffffff';
            ctx.font = '600 38px Inter, Arial, sans-serif';
            const questionLines = wrapCanvasText(ctx, result.question, 820);
            y = drawCenteredLines(ctx, questionLines, centerX, y, 50, 3) + 28;
        }

        ctx.fillStyle = 'rgba(212,175,55,0.86)';
        ctx.fillRect(170, y, 740, 3);
        y += 70;

        ctx.fillStyle = '#f6f1ff';
        ctx.font = '500 42px Inter, Arial, sans-serif';
        const resultLines = wrapCanvasText(ctx, result.text, 820);
        y = drawCenteredLines(ctx, resultLines, centerX, y, 56, 6);

        ctx.fillStyle = 'rgba(255,255,255,0.78)';
        ctx.font = '500 32px Inter, Arial, sans-serif';
        ctx.fillText('mystickahvezda.cz/sk/tarot-ano-nie.html', centerX, 1215);

        ctx.fillStyle = 'rgba(212,175,55,0.9)';
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
            const canvas = drawTarotYesNoResultCard(lastResult);

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
        if (!nextStep) return;

        if (answerBadge) {
            answerBadge.textContent = ans.label.toLowerCase();
        }

        nextStep.dataset.answerKey = answerKey;
        setBlockVisible(nextStep, true);

        const metadata = getResultMetadata(answerKey, ans, question);
        window.MH_ANALYTICS?.trackAction?.('tarot_yes_no_result_bridge_viewed', {
            ...metadata,
            feature: TAROT_YES_NO_FEATURE,
            source: TAROT_YES_NO_RESULT_SOURCE
        });
        void trackTarotYesNoFunnelEvent('paywall_viewed', TAROT_YES_NO_RESULT_SOURCE, metadata);
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
                window.MH_ANALYTICS?.trackCTA?.('tarot_yes_no_save_profile_sk', {
                    intent: link.dataset.tarotYesNoRegister,
                    destination: link.getAttribute('href') || '',
                    source: TAROT_YES_NO_RESULT_SOURCE,
                    feature: TAROT_YES_NO_FEATURE
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

        const key = pool[Math.floor(Math.random() * pool.length)];
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
