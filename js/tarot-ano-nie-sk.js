/**
 * tarot-ano-nie-sk.js - Logika pre Tarot ÁNO/NIE (slovenská verzia)
 */
(function () {
    const answers = {
        ano: {
            label: 'ÁNO', symbol: 'check', class: 'ano',
            texts: [
                'Výsledok sa prikláňa k áno. Čo na tejto možnosti považuješ za najdôležitejšie?',
                'Áno je jeden z náhodne zvolených smerov. Pred krokom si over aj jeho podmienky.',
                'Kladný smer môže byť začiatkom úvahy. Ktorý malý krok ti pomôže zistiť, či ti táto možnosť sedí?',
                'Tento výsledok nie je zárukou. Rozhodnutie opri o to, čo vieš a čo môžeš ovplyvniť.',
                'Ak sa s áno stotožňuješ, pomenuj si dôvod. Čo ťa na tejto možnosti priťahuje?',
                'Kladný výsledok nehovorí, čo sa stane. Čo potrebuješ ešte preveriť?',
                'Skús si predstaviť prvý uskutočniteľný krok. Vieš ho urobiť bez neprimeraného rizika?',
                'Tento smer môže otvoriť otázku: čo potrebuješ, aby si sa rozhodol s väčším pokojom?',
                'Možnosť stojí za preskúmanie. Ktorá informácia by ti pomohla rozhodnúť sa?',
                'Skôr než povieš áno, skontroluj, či ti vyhovujú aj záväzky, ktoré s ním prichádzajú.',
            ]
        },
        skor_ano: {
            label: 'SKÔR ÁNO', symbol: 'star', class: 'mozna',
            texts: [
                'Výsledok sa prikláňa skôr k áno. Ktorú podmienku si ešte potrebuješ vyjasniť?',
                'Je tu priestor preskúmať túto možnosť bez unáhleného záväzku.',
                'Skôr áno neznamená istý výsledok. Začni tým, čo si vieš bezpečne overiť.',
                'Všímaj si, čo ťa vedie k áno a čo v tebe vyvoláva pochybnosti; oboje je užitočný signál.',
                'Možno sa prikláňaš k súhlasu, ale potrebuješ čas alebo viac informácií. Čo ti chýba?',
            ]
        },
        nejasne: {
            label: 'NEJASNÉ', symbol: 'crystal', class: 'mozna',
            texts: [
                'Pomôcka nezvolila jasný smer. Čo si potrebuješ o situácii ešte zistiť?',
                'Nejasný výsledok nie je dôvod pýtať sa znova a znova. Skús pomenovať, čo ti bráni rozhodnúť sa.',
                'Viac možností zostáva otvorených. Ak môžeš, dopraj si čas a over dôležité fakty.',
                'Možno je otázka príliš široká. Skús ju rozdeliť na jeden konkrétny krok.',
                'Tento výsledok nič nepredpovedá. Pomôže ti spísať, čo vieš a čo zatiaľ nevieš?',
            ]
        },
        skor_nie: {
            label: 'SKÔR NIE', symbol: 'warning', class: 'ne',
            texts: [
                'Pomôcka sa prikláňa skôr k nie. Ktoré riziko alebo podmienku chceš ešte preveriť?',
                'Skôr nie môže byť podnetom spomaliť; neznamená, že je cesta definitívne uzavretá.',
                'Čo ti na tejto možnosti nesedí? Pomenovanie dôvodu môže pomôcť viac než samotný výsledok.',
                'Pred ďalším krokom si over okolnosti, ktoré by z rozhodnutia mohli urobiť väčší záväzok.',
                'Výsledok naznačuje opatrnosť, nie predpoveď neúspechu. Akú inú možnosť máš?',
            ]
        },
        nie: {
            label: 'NIE', symbol: 'error', class: 'ne',
            texts: [
                'Výsledok sa prikláňa k nie, no nerozhoduje za teba. Čo by pre teba na tejto ceste bolo najťažšie?',
                'Táto odpoveď môže pripomenúť, aby si si najprv vyjasnil riziká a vlastné hranice.',
                'Neber výsledok ako rozsudok. Ktorá iná cesta by lepšie zodpovedala tomu, čo potrebuješ?',
                'Ak aj ty cítiš skôr nie, skús pomenovať dôvod: je to prekážka, málo informácií alebo tlak?',
                'Pred odmietnutím aj súhlasom si môžeš overiť, čo sa dá zmeniť a čo nie.',
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
    let pendingResultTimeout = null;
    let resultGeneration = 0;
    let savedReadingId = null;
    let readingSaveInFlight = false;
    let firstValueTracked = false;

    const TAROT_YES_NO_FEATURE = 'tarot_multi_card';
    const TAROT_YES_NO_PLAN_ID = 'pruvodce';
    const TAROT_YES_NO_RESULT_SOURCE = 'tarot_yes_no_result_sk';
    const TAROT_YES_NO_TOOL = 'tarot_yes_no_sk';
    const PENDING_READING_STORAGE_KEY = 'mh_pending_reading';
    const TAROT_YES_NO_UPGRADE_CONTEXT_KEY = 'mh_tarot_yes_no_upgrade_context';

    function createTarotAnswerSymbol(symbolId) {
        const svgNamespace = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNamespace, 'svg');
        svg.setAttribute('class', 'mh-symbol tarot-yes-no-answer-symbol');
        svg.setAttribute('viewBox', '0 0 48 48');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '1.8');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');

        const use = document.createElementNS(svgNamespace, 'use');
        use.setAttribute('href', `/img/icons/mh-symbols.svg#${symbolId}`);
        svg.append(use);
        return svg;
    }

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

    function scrollTarotResultIntoView(panel, behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth') {
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
                source: options.source || 'tarot_yes_no_save_journal_sk',
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
            console.warn('[Tarot ANO/NIE SK] Could not store pending reading:', error.message);
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
            window.Auth?.showToast?.('Už uložené', 'Tento výklad už je v denníku.', 'success');
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
        button.textContent = 'Ukladám...';
        if (resetButton) resetButton.disabled = true;

        try {
            try {
                trackTarotYesNoEvent('save_click', metadata);
            } catch (analyticsError) {
                console.warn('[Tarot ANO/NIE SK] Save-click analytics unavailable:', analyticsError.message);
            }
            await trackTarotYesNoFunnelEvent('reading_save_clicked', 'tarot_yes_no_save_journal_sk', metadata, TAROT_YES_NO_TOOL, null);

            const loggedInNow = Boolean(window.Auth?.isLoggedIn?.());
            const userIdNow = window.Auth?.user?.id || null;
            if (loggedInNow !== loggedInAtClick
                || (loggedInAtClick && (!userIdAtClick || userIdNow !== userIdAtClick))) {
                window.Auth?.showToast?.(
                    'Prihlásenie sa zmenilo',
                    'Výsledok zostal otvorený. Over účet a potom uloženie skús znova.',
                    'error'
                );
                return;
            }

            if (!loggedInAtClick) {
                if (!storePendingTarotYesNoReading(readingToSave)) {
                    window.Auth?.showToast?.(
                        'Výklad zostáva otvorený',
                        'Ak ho chceš uložiť do profilu, povoľ úložisko pre túto stránku a skús to znova.',
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
                    console.warn('[Tarot ANO/NIE SK] Login-click analytics unavailable:', analyticsError.message);
                }
                redirecting = true;
                window.location.href = '/prihlaseni.html?mode=register&source=tarot_yes_no_save_journal_sk&feature=tarot_yes_no&redirect=/profil.html';
                return;
            }

            const payload = await postTarotYesNoReading(readingToSave, userIdAtClick);
            savedReadingId = payload.id || payload.reading?.id || true;
            button.textContent = 'Uložené v denníku';
            window.Auth?.showToast?.('Výklad uložený', 'Nájdeš ho v profile v histórii výkladov.', 'success');
            try {
                trackTarotYesNoEvent('reading_saved', {
                    ...metadata,
                    reading_id: payload.id || payload.reading?.id || null
                });
            } catch (analyticsError) {
                console.warn('[Tarot ANO/NIE SK] Saved-reading analytics unavailable:', analyticsError.message);
            }
            void trackTarotYesNoFunnelEvent('reading_saved', 'tarot_yes_no_save_journal_sk', {
                ...metadata,
                reading_id: payload.id || payload.reading?.id || null
            }, TAROT_YES_NO_TOOL, null);
        } catch (error) {
            console.warn('[Tarot ANO/NIE SK] Could not save reading:', error.message);
            if (error?.code === 'ACCOUNT_CHANGED') {
                window.Auth?.showToast?.('Prihlásenie sa zmenilo', 'Výsledok zostal otvorený. Over účet a potom uloženie skús znova.', 'error');
            } else {
                window.Auth?.showToast?.('Nepodarilo sa uložiť', 'Skús to prosím znova o chvíľu.', 'error');
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

    function ellipsizeCanvasLine(ctx, line, maxWidth) {
        const characters = Array.from(String(line || '').trimEnd());
        while (characters.length > 0 && ctx.measureText(`${characters.join('')}…`).width > maxWidth) {
            characters.pop();
        }
        return `${characters.join('').trimEnd()}…`;
    }

    function drawCenteredLines(ctx, lines, centerX, startY, lineHeight, maxLines = lines.length, maxWidth = Infinity) {
        const visibleLines = lines.slice(0, maxLines);
        if (lines.length > visibleLines.length && visibleLines.length > 0 && Number.isFinite(maxWidth) && maxWidth > 0) {
            const lastIndex = visibleLines.length - 1;
            visibleLines[lastIndex] = ellipsizeCanvasLine(ctx, visibleLines[lastIndex], maxWidth);
        }
        visibleLines.forEach((line, index) => {
            ctx.fillText(line, centerX, startY + index * lineHeight);
        });
        return startY + visibleLines.length * lineHeight;
    }

    function drawTarotYesNoResultCard(result) {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;

        const shareImage = window.MH_SHARE_IMAGE;
        if (typeof shareImage?.drawBrandBackground === 'function') {
            shareImage.drawBrandBackground(ctx, canvas);
        } else {
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#0b1929');
            gradient.addColorStop(0.52, '#102638');
            gradient.addColorStop(1, '#07121f');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(208,177,124,0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(54, 54, canvas.width - 108, canvas.height - 108);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#d0b17c';
            ctx.font = '600 38px Inter, Arial, sans-serif';
            ctx.fillText('Mystická Hviezda', centerX, 130);
        }

        ctx.fillStyle = 'rgba(208,177,124,0.12)';
        ctx.beginPath();
        ctx.arc(centerX, 360, 190, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(208,177,124,0.58)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, 360, 160, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#d0b17c';
        ctx.font = '700 48px Cinzel, Georgia, serif';
        ctx.fillText('TAROT ÁNO/NIE', centerX, 280);

        ctx.fillStyle = '#d0b17c';
        ctx.font = '700 92px Cinzel, Georgia, serif';
        ctx.fillText(result.label, centerX, 405);

        ctx.fillStyle = '#c0c8ca';
        ctx.font = '500 28px Inter, Arial, sans-serif';
        ctx.fillText('Náhodne zvolený smer · nie je to predpoveď', centerX, 478);

        let y = 575;
        if (result.question) {
            ctx.fillStyle = '#c0c8ca';
            ctx.font = '500 34px Inter, Arial, sans-serif';
            ctx.fillText('Otázka', centerX, y);
            y += 52;

            ctx.fillStyle = '#e9e3d7';
            ctx.font = '600 38px Inter, Arial, sans-serif';
            const questionLines = wrapCanvasText(ctx, result.question, 820);
            y = drawCenteredLines(ctx, questionLines, centerX, y, 50, 3, 820) + 28;
        }

        ctx.fillStyle = 'rgba(208,177,124,0.86)';
        ctx.fillRect(170, y, 740, 3);
        y += 70;

        ctx.fillStyle = '#e9e3d7';
        ctx.font = '500 42px Inter, Arial, sans-serif';
        const resultLines = wrapCanvasText(ctx, result.text, 820);
        y = drawCenteredLines(ctx, resultLines, centerX, y, 56, 6, 820);

        ctx.fillStyle = '#e9e3d7';
        ctx.font = '500 32px Inter, Arial, sans-serif';
        ctx.fillText('mystickahvezda.cz/sk/tarot-ano-nie.html', centerX, 1215);

        ctx.fillStyle = '#d0b17c';
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
        const drawGeneration = ++resultGeneration;
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
            question: q,
            saveRequestId: createTarotReadingRequestId(),
            savedAt: new Date().toISOString()
        };
        const resultForDraw = lastResult;
        window.__lastTarotYesNoShareResult = lastResult;

        const front = card.querySelector('.card-front');
        front.classList.add(ans.class);
        const answerIcon = document.createElement('span');
        answerIcon.className = 'card-answer-symbol';
        answerIcon.append(createTarotAnswerSymbol(ans.symbol));
        const answerLabel = document.createElement('span');
        answerLabel.className = 'answer-label';
        answerLabel.textContent = ans.label;
        front.replaceChildren(answerIcon, answerLabel);

        card.classList.add('flipped');

        pendingResultTimeout = setTimeout(() => {
            pendingResultTimeout = null;
            if (drawGeneration !== resultGeneration || lastResult !== resultForDraw || !used) return;

            const resultSymbol = document.getElementById('result-symbol');
            resultSymbol.className = `tarot-result-symbol tarot-result-symbol--${ans.class === 'ano' ? 'yes' : (ans.class === 'ne' ? 'no' : 'maybe')}`;
            resultSymbol.setAttribute('aria-hidden', 'true');
            resultSymbol.replaceChildren(createTarotAnswerSymbol(ans.symbol));
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
        const resetGeneration = resultGeneration;
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
            if (resultGeneration === resetGeneration && !used) {
                window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
            }
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
                btnSaveResultImage.textContent = 'Zdieľať výsledok';
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
