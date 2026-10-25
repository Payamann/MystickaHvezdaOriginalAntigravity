(() => {
    const form = document.getElementById('reading-form');
    const button = document.getElementById('checkout-button');
    const error = document.getElementById('form-error');
    const params = new URLSearchParams(location.search);
    const rawSource = params.get('source') || '';
    const source = /^[a-z0-9_:-]{1,80}$/i.test(rawSource) ? rawSource : 'relationship_tarot_page';
    let enabled = false;
    let csrfPromise;
    const draftKey = 'mh_relationship_draft';
    const flowKey = 'mh_relationship_flow_id';
    const validFlowId = value => typeof value === 'string' && /^[a-z0-9_-]{16,80}$/i.test(value);
    const createFlowId = () => {
        if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
        const bytes = new Uint8Array(16);
        globalThis.crypto?.getRandomValues?.(bytes);
        if (bytes.some(Boolean)) return `mh_${Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')}`;
        return `mh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
    };
    let flowId = createFlowId();
    let continuation = null;
    try {
        const raw = sessionStorage.getItem('mh_relationship_question') || sessionStorage.getItem(draftKey);
        const draft = raw ? JSON.parse(raw) : null;
        if (draft && Date.now() - draft.at < 30 * 60 * 1000) {
            form.question.value = String(draft.question || '').slice(0, 1000);
            form.email.value = String(draft.email || '').slice(0, 254);
            flowId = validFlowId(draft.flowId) ? draft.flowId : flowId;
            continuation = {
                flowId,
                question: form.question.value,
                cardName: typeof draft.cardName === 'string' ? draft.cardName.slice(0, 80) : '',
                answerLabel: typeof draft.answerLabel === 'string' ? draft.answerLabel.slice(0, 40) : '',
                cardImage: typeof draft.cardImage === 'string' && /^\/img\/(?:tarot|tarot-v2)\/[a-z0-9_]+\.webp$/i.test(draft.cardImage) ? draft.cardImage : ''
            };
            sessionStorage.setItem(draftKey, JSON.stringify({ ...draft, flowId, at: Date.now() }));
        }
        const storedFlowId = sessionStorage.getItem(flowKey);
        if (!validFlowId(continuation?.flowId) && validFlowId(storedFlowId)) flowId = storedFlowId;
        sessionStorage.setItem(flowKey, flowId);
        sessionStorage.removeItem('mh_relationship_question');
        if (draft && Date.now() - draft.at >= 30 * 60 * 1000) sessionStorage.removeItem(draftKey);
    } catch { /* Storage may be unavailable. */ }
    function renderContinuation() {
        if (!continuation?.question || source !== 'tarot_yes_no_result') return;
        const context = document.getElementById('continuation-context');
        const question = document.getElementById('continuation-question');
        const result = document.getElementById('continuation-result');
        const image = document.getElementById('continuation-card-image');
        const compactQuestion = continuation.question.length > 180 ? `${continuation.question.slice(0, 177).trim()}…` : continuation.question;
        question.textContent = `„${compactQuestion}“`;
        if (continuation.cardName && continuation.answerLabel) {
            result.textContent = `Karta ${continuation.cardName} ukázala odpověď ${continuation.answerLabel}. Tři nové karty rozvinou, co potřebuješ, co si zaslouží pozornost a jaký krok můžeš udělat.`;
        } else {
            result.textContent = 'Jedna karta ukázala směr. Tři nové karty rozvinou, co potřebuješ, co si zaslouží pozornost a jaký krok můžeš udělat.';
        }
        if (continuation.cardImage) {
            image.src = continuation.cardImage;
            image.alt = continuation.cardName ? `Tvoje vytažená karta ${continuation.cardName}` : 'Tvoje vytažená tarotová karta';
            image.hidden = false;
        }
        document.querySelectorAll('[data-reading-cta-label]').forEach(label => { label.textContent = 'Rozvinout mou otázku'; });
        context.hidden = false;
    }
    renderContinuation();
    form.question.addEventListener('input', () => {
        if (!continuation || form.question.value === continuation.question) return;
        continuation = null;
        const context = document.getElementById('continuation-context');
        const image = document.getElementById('continuation-card-image');
        context.hidden = true;
        image.hidden = true;
        image.removeAttribute('src');
        image.alt = '';
        document.querySelectorAll('[data-reading-cta-label]').forEach(label => { label.textContent = 'Chci svůj výklad'; });
    });
    function csrf() {
        if (!csrfPromise) csrfPromise = fetch('/api/csrf-token', { credentials: 'same-origin' }).then(async response => {
            if (!response.ok) throw new Error('csrf');
            return (await response.json()).csrfToken;
        }).catch(error => { csrfPromise = null; throw error; });
        return csrfPromise;
    }
    function consentedAcquisition() {
        try {
            const raw = localStorage.getItem('mh_cookie_prefs');
            const allowed = raw ? JSON.parse(raw)?.analytics === true : localStorage.getItem('cookieConsent') === 'accepted';
            if (!allowed) return {};
            const meta = window.MH_ANALYTICS?.getAttributionContext?.()?.metadata;
            if (!meta) return {};
            const origin = String(meta.referrer_host || meta.first_source || '').toLowerCase();
            let channel = 'direct_or_unknown';
            if (/^(?:www\.)?google\.(?:com|cz|sk)$/.test(origin) || origin === 'google') channel = 'google';
            else if (/(?:^|\.)seznam\.cz$/.test(origin) || origin === 'seznam') channel = 'seznam';
            else if (/(?:^|\.)bing\.com$/.test(origin) || origin === 'bing') channel = 'bing';
            else if (/(?:^|\.)(?:facebook\.com|instagram\.com|tiktok\.com)$/.test(origin) || /^(?:facebook|instagram|tiktok)$/.test(origin)) channel = 'social';
            else if (origin) channel = 'other';
            return { acquisition_channel: channel };
        } catch { return {}; }
    }
    function track(eventName, details = {}) {
        const metadata = { product_id: 'relationship_tarot', price: 149, currency: 'CZK', flow_id: flowId, ...details, ...consentedAcquisition() };
        try { window.MH_ANALYTICS?.trackEvent?.(eventName, { source, ...metadata }); } catch { /* non-blocking */ }
        void csrf().then(token => fetch('/api/payment/funnel-event', { method: 'POST', keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: JSON.stringify({ eventName, source, feature: 'relationship_tarot', planType: 'relationship_tarot', metadata }) })).catch(() => {});
    }
    // Finish the entry-click receipt after navigation so the event cannot be lost on unload.
    try {
        const receiptKey = 'mh_relationship_entry_click';
        const receipt = JSON.parse(sessionStorage.getItem(receiptKey) || 'null');
        sessionStorage.removeItem(receiptKey);
        if (receipt?.source === source && source === 'partner_match_result'
            && receipt.flowId === flowId && receipt.placement === 'synastry_result_next_step'
            && Number.isFinite(receipt.at) && Date.now() >= receipt.at && Date.now() - receipt.at < 5 * 60 * 1000) {
            track('one_time_product_cta_clicked', { funnel_step: 'entry_offer', placement: receipt.placement });
        }
    } catch { /* Optional analytics must never block the order page. */ }
    track('one_time_product_viewed', { funnel_step: 'product_page' });
    form.addEventListener('input', () => track('one_time_form_started', { funnel_step: 'form_start' }), { once: true });
    document.querySelectorAll('[data-reading-cta]').forEach(link => link.addEventListener('click', () => track('one_time_product_cta_clicked', { funnel_step: 'product_to_form', placement: link.dataset.readingCta || 'unknown' })));
    fetch('/api/vztahovy-vyklad/product', { cache: 'no-store' }).then(async response => {
        if (!response.ok) throw new Error('product');
        const product = await response.json();
        enabled = product.enabled === true && product.amount === 14900 && product.currency === 'czk';
        button.disabled = !enabled;
        document.getElementById('availability').textContent = enabled ? 'Tři karty, jedna otázka. Výklad dostaneš do e-mailu.' : 'Ukázka připravované služby. Objednávky zatím nejsou spuštěné.';
    }).catch(() => { document.getElementById('availability').textContent = 'Dostupnost se nepodařilo ověřit. Zkus stránku načíst znovu.'; });
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!enabled || button.disabled || !form.reportValidity()) return;
        const checkoutPayload = {
            email: form.email.value.trim(),
            question: form.question.value.trim(),
            consent: document.getElementById('consent').checked,
            source,
            flowId
        };
        const controls = Array.from(form.querySelectorAll('input, textarea, select, button'));
        const previousDisabledStates = controls.map(control => control.disabled);
        button.disabled = true;
        controls.forEach(control => { control.disabled = true; });
        error.textContent = '';
        try { sessionStorage.setItem(draftKey, JSON.stringify({ ...continuation, question: checkoutPayload.question, email: checkoutPayload.email, flowId, at: Date.now() })); } catch { /* Preserve in the DOM when storage is unavailable. */ }
        track('one_time_form_submitted', { funnel_step: 'form_submit' });
        try {
            const response = await fetch('/api/vztahovy-vyklad/checkout', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': await csrf() },
                body: JSON.stringify(checkoutPayload) });
            if (response.status === 403) csrfPromise = null;
            const result = await response.json().catch(() => ({ error: 'Platbu se nepodařilo otevřít. Zkus to za chvíli.' }));
            if (!response.ok) {
                const failure = new Error(result.error || 'Platbu se nepodařilo otevřít.');
                failure.code = result.code;
                throw failure;
            }
            const url = new URL(result.url);
            if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Platební odkaz se nepodařilo ověřit.');
            location.assign(url.href);
        } catch (failure) {
            error.textContent = failure.message === 'csrf' ? 'Platbu se nepodařilo připravit. Zkus to znovu.' : failure.message;
            controls.forEach((control, index) => { control.disabled = previousDisabledStates[index]; });
            if (failure.code === 'checkout_session_expired') {
                flowId = createFlowId();
                try {
                    sessionStorage.setItem(flowKey, flowId);
                    sessionStorage.setItem(draftKey, JSON.stringify({ ...continuation, question: checkoutPayload.question, email: checkoutPayload.email, flowId, at: Date.now() }));
                } catch { /* The visible form remains available for a fresh attempt. */ }
            } else if (['checkout_already_completed', 'checkout_payment_pending', 'checkout_session_unavailable', 'checkout_flow_conflict'].includes(failure.code)) {
                button.disabled = true;
            }
            track('one_time_checkout_failed', { funnel_step: 'checkout_create', flow_id: checkoutPayload.flowId });
        }
    });
    let paymentTracked = false;
    let lastPaidResult = null;
    let deliveryPollTimer = null;
    let deliveryPollsRemaining = 4;
    const deliveryMessages = {
        preparing: 'Platba je potvrzená. Výklad se připravuje.',
        provider_accepted: 'Platba je potvrzená. E-mail s výkladem byl předán k odeslání; doručení zatím není potvrzené.',
        delivered: 'Platba je potvrzená a doručení výkladu do e-mailu bylo potvrzeno.',
        delivery_delayed: 'Platba je potvrzená. Doručení e-mailu má zpoždění. Další objednávku nevytvářej.',
        failed: 'Platba je potvrzená, ale doručení výkladu selhalo. Kontaktuj podporu a další objednávku nevytvářej.',
        unavailable: 'Platba je potvrzená. Stav doručení teď nemůžeme ověřit; další objednávku nevytvářej.'
    };
    function scheduleDeliveryCheck(deliveryState) {
        clearTimeout(deliveryPollTimer);
        if (!['preparing', 'provider_accepted', 'delivery_delayed', 'unavailable'].includes(deliveryState) || deliveryPollsRemaining <= 0) return;
        deliveryPollsRemaining -= 1;
        deliveryPollTimer = setTimeout(() => void checkPayment({ automatic: true }), 5000);
    }
    function renderPaidDelivery(result, message, retry) {
        const deliveryState = Object.hasOwn(deliveryMessages, result.deliveryState) ? result.deliveryState : 'unavailable';
        const orderRef = typeof result.orderRef === 'string' && /^[a-z0-9_-]{1,80}$/i.test(result.orderRef) ? result.orderRef : '';
        message.textContent = `${deliveryMessages[deliveryState]}${orderRef ? ` Reference objednávky: ${orderRef}.` : ''}`;
        retry.textContent = 'Zkontrolovat stav znovu';
        retry.hidden = deliveryState === 'delivered';
        scheduleDeliveryCheck(deliveryState);
        lastPaidResult = { status: 'paid', deliveryState, ...(orderRef ? { orderRef } : {}) };
    }
    async function checkPayment({ automatic = false } = {}) {
        const message = document.getElementById('payment-message');
        const retry = document.getElementById('retry-payment');
        clearTimeout(deliveryPollTimer);
        if (!automatic) deliveryPollsRemaining = 4;
        document.getElementById('payment-result').hidden = false;
        document.getElementById('objednavka').hidden = true;
        if (!automatic) message.textContent = 'Ověřujeme platbu. Samotný návrat ze Stripe ji ještě nepotvrzuje.';
        retry.disabled = true;
        try {
            const response = await fetch(`/api/vztahovy-vyklad/checkout-result?session_id=${encodeURIComponent(params.get('session_id') || '')}`, { credentials: 'same-origin', cache: 'no-store' });
            if (!response.ok) throw new Error('verify');
            const result = await response.json();
            if (result.status === 'paid' && !paymentTracked) {
                const transactionId = params.get('session_id') || '';
                try {
                    window.MH_ANALYTICS?.trackPaymentResult?.('paid', {
                        verified: true,
                        transaction_id: transactionId,
                        product_id: 'relationship_tarot',
                        product_type: 'relationship_tarot',
                        source,
                        feature: 'relationship_tarot'
                    });
                    window.MH_ANALYTICS?.trackPurchaseCompleted?.('relationship_tarot', 149, 'CZK', {
                        verified: true,
                        transaction_id: transactionId,
                        product_type: 'relationship_tarot',
                        source,
                        feature: 'relationship_tarot'
                    });
                } catch { /* Analytics must not affect delivery status. */ }
                try { sessionStorage.removeItem(draftKey); sessionStorage.removeItem(flowKey); } catch { /* optional */ }
                paymentTracked = true;
            }
            if (result.status === 'paid') {
                renderPaidDelivery(result, message, retry);
            } else {
                message.textContent = 'Platba zatím není potvrzená. Ověř stav znovu za chvíli; další objednávku nevytvářej.';
                retry.textContent = 'Ověřit platbu znovu';
                retry.hidden = false;
                scheduleDeliveryCheck('preparing');
            }
        } catch {
            if (lastPaidResult) {
                renderPaidDelivery({ ...lastPaidResult, deliveryState: 'unavailable' }, message, retry);
            } else {
                message.textContent = 'Platbu teď nemůžeme ověřit. To neznamená, že neproběhla. Zkus ověření znovu nebo kontaktuj podporu; zatím neplať podruhé.';
                retry.hidden = false;
                retry.textContent = 'Ověřit platbu znovu';
            }
        }
        finally { retry.disabled = false; }
    }
    document.getElementById('retry-payment').addEventListener('click', checkPayment);
    if (params.get('status') === 'success') {
        document.querySelectorAll('[data-reading-cta]').forEach(link => { link.hidden = true; });
        void checkPayment();
        document.getElementById('payment-result').scrollIntoView();
    }
    if (params.get('status') === 'cancel') { error.textContent = 'Platba nebyla dokončená. K otázce se můžeš vrátit, až budeš chtít.'; form.scrollIntoView(); }
})();
