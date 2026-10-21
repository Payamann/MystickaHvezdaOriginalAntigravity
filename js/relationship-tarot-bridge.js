(() => {
    if (!document.querySelector('[data-relationship-offer], #tarot-relationship-offer')) return;
    const initialized = new WeakSet();
    const flowKey = 'mh_relationship_flow_id';
    const relationshipIntents = new Set([
        'love_yes_no',
        'love_feelings',
        'relationship_return',
        'relationship_future',
        'relationship_yes_no'
    ]);
    let memoryFlowId = '';
    let productAvailable = false;
    let csrfPromise;
    function hasRelationshipIntent() {
        const intent = new URLSearchParams(window.location.search).get('intent');
        return relationshipIntents.has(String(intent || '').trim().toLowerCase());
    }
    function validFlowId(value) {
        return typeof value === 'string' && /^[a-z0-9_-]{16,80}$/i.test(value);
    }
    function createFlowId() {
        if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
        const bytes = new Uint8Array(16);
        globalThis.crypto?.getRandomValues?.(bytes);
        if (bytes.some(Boolean)) return `mh_${Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')}`;
        return `mh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
    }
    function flowId() {
        if (validFlowId(memoryFlowId)) return memoryFlowId;
        try {
            const stored = sessionStorage.getItem(flowKey);
            if (validFlowId(stored)) {
                memoryFlowId = stored;
                return stored;
            }
            const created = createFlowId();
            sessionStorage.setItem(flowKey, created);
            memoryFlowId = created;
            return created;
        } catch {
            memoryFlowId = createFlowId();
            return memoryFlowId;
        }
    }
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
    async function track(eventName, source, funnelStep) {
        const analyticsMetadata = {
            source,
            feature: 'relationship_tarot',
            product_id: 'relationship_tarot',
            product_type: 'relationship_tarot',
            price: 149,
            currency: 'CZK',
            placement: source,
            funnel_step: funnelStep,
            flow_id: flowId(),
            ...consentedAcquisition()
        };
        try {
            window.MH_ANALYTICS?.trackEvent?.(eventName, analyticsMetadata);
        } catch { /* Analytics must not affect the free reading. */ }
        try {
            const csrfToken = await csrf();
            await fetch('/api/payment/funnel-event', { method: 'POST', keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                body: JSON.stringify({ eventName, source, feature: 'relationship_tarot', metadata: analyticsMetadata }) });
        } catch { /* No effect on free tools or navigation. */ }
    }
    function safeCardImage(value) {
        if (typeof value !== 'string') return '';
        try {
            const url = new URL(value, location.origin);
            return url.origin === location.origin && /^\/img\/(?:tarot|tarot-v2)\/[a-z0-9_]+\.webp$/i.test(url.pathname) ? url.pathname : '';
        } catch {
            return '';
        }
    }
    function storeContinuation() {
        const result = window.__lastTarotYesNoShareResult;
        const question = String(result?.question || document.getElementById('question-input')?.value || '').trim();
        const context = {
            question: question.slice(0, 1000),
            flowId: flowId(),
            cardName: typeof result?.cardName === 'string' ? result.cardName.slice(0, 80) : '',
            answerLabel: typeof result?.label === 'string' ? result.label.slice(0, 40) : '',
            cardImage: safeCardImage(result?.image),
            at: Date.now()
        };
        try {
            if (context.question) sessionStorage.setItem('mh_relationship_question', JSON.stringify(context));
            else sessionStorage.removeItem('mh_relationship_question');
        } catch { /* Optional handoff. */ }
    }
    function updateOfferContext(offer) {
        const context = offer.querySelector('[data-relationship-question]');
        const quote = context?.querySelector('q');
        if (!context || !quote) return;
        const result = window.__lastTarotYesNoShareResult;
        const question = String(result?.question || document.getElementById('question-input')?.value || '').trim();
        if (!question) {
            context.hidden = true;
            quote.textContent = '';
            return;
        }
        quote.textContent = question.length > 120 ? `${question.slice(0, 117).trimEnd()}…` : question;
        context.hidden = false;
    }
    function revealOffers() {
        if (!productAvailable) return;
        const yesNoRelationshipOffer = document.querySelector('[data-relationship-offer="tarot_yes_no_result"]');
        const showYesNoRelationshipOffer = Boolean(yesNoRelationshipOffer && hasRelationshipIntent());
        if (showYesNoRelationshipOffer) {
            document.querySelectorAll('[data-relationship-legacy]').forEach(el => { el.hidden = true; });
        }
        document.querySelectorAll('[data-relationship-offer]').forEach(offer => {
            if (offer === yesNoRelationshipOffer && !showYesNoRelationshipOffer) return;
            updateOfferContext(offer);
            if (initialized.has(offer)) return;
            initialized.add(offer);
            offer.hidden = false;
            offer.querySelector('a').addEventListener('click', () => {
                storeContinuation();
                void track('one_time_product_cta_clicked', offer.dataset.relationshipOffer, 'entry_offer');
            });
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver(entries => {
                    if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .4)) {
                        void track('one_time_offer_viewed', offer.dataset.relationshipOffer, 'entry_offer');
                        observer.disconnect();
                    }
                }, { threshold: .4 });
                observer.observe(offer);
            }
        });
    }
    document.addEventListener('mh:relationship-offers-ready', revealOffers);
    document.addEventListener('mh:tarot-yes-no-context-changed', revealOffers);
    fetch('/api/vztahovy-vyklad/product', { cache: 'no-store' }).then(async response => {
        if (!response.ok) return;
        const product = await response.json();
        if (!product.enabled || product.amount !== 14900 || product.currency !== 'czk') return;
        productAvailable = true;
        document.querySelectorAll('[data-relationship-link]').forEach(link => {
            if (initialized.has(link)) return;
            initialized.add(link);
            link.addEventListener('click', () => {
                void track('one_time_product_cta_clicked', link.dataset.relationshipLink, 'entry_offer');
            });
        });
        void csrf().catch(() => {});
        revealOffers();
    }).catch(() => {});
})();
