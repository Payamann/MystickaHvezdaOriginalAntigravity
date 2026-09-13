(() => {
    if (!document.querySelector('[data-relationship-offer], #tarot-relationship-offer')) return;
    const initialized = new WeakSet();
    const flowKey = 'mh_relationship_flow_id';
    let memoryFlowId = '';
    let productAvailable = false;
    let csrfPromise;
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
    async function track(eventName, source, funnelStep) {
        try {
            const csrfToken = await csrf();
            await fetch('/api/payment/funnel-event', { method: 'POST', keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                body: JSON.stringify({ eventName, source, feature: 'relationship_tarot', metadata: { product_id: 'relationship_tarot', placement: source, funnel_step: funnelStep, flow_id: flowId() } }) });
        } catch { /* No effect on free tools or navigation. */ }
    }
    function safeCardImage(value) {
        if (typeof value !== 'string') return '';
        try {
            const url = new URL(value, location.origin);
            return url.origin === location.origin && /^\/img\/tarot\/[a-z0-9_]+\.webp$/i.test(url.pathname) ? url.pathname : '';
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
    function revealOffers() {
        if (!productAvailable) return;
        document.querySelectorAll('[data-relationship-legacy]').forEach(el => { el.hidden = true; });
        document.querySelectorAll('[data-relationship-offer]').forEach(offer => {
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
    fetch('/api/vztahovy-vyklad/product', { cache: 'no-store' }).then(async response => {
        if (!response.ok) return;
        const product = await response.json();
        if (!product.enabled || product.amount !== 14900 || product.currency !== 'czk') return;
        productAvailable = true;
        void csrf().catch(() => {});
        revealOffers();
    }).catch(() => {});
})();
