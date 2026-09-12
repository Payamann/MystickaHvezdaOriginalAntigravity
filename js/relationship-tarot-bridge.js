(() => {
    const offers = document.querySelectorAll('[data-relationship-offer]');
    if (!offers.length) return;
    let csrfPromise;
    function csrf() {
        if (!csrfPromise) csrfPromise = fetch('/api/csrf-token', { credentials: 'same-origin' }).then(async response => {
            if (!response.ok) throw new Error('csrf');
            return (await response.json()).csrfToken;
        }).catch(error => { csrfPromise = null; throw error; });
        return csrfPromise;
    }
    async function track(eventName, source) {
        try {
            const csrfToken = await csrf();
            await fetch('/api/payment/funnel-event', { method: 'POST', keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                body: JSON.stringify({ eventName, source, feature: 'relationship_tarot', metadata: { product_id: 'relationship_tarot', placement: source } }) });
        } catch { /* No effect on free tools or navigation. */ }
    }
    fetch('/api/vztahovy-vyklad/product', { cache: 'no-store' }).then(async response => {
        if (!response.ok) return;
        const product = await response.json();
        if (!product.enabled || product.amount !== 14900 || product.currency !== 'czk') return;
        void csrf().catch(() => {});
        document.querySelectorAll('[data-relationship-legacy]').forEach(el => { el.hidden = true; });
        offers.forEach(offer => {
            offer.hidden = false;
            offer.querySelector('a').addEventListener('click', () => {
                const question = document.getElementById('question-input')?.value?.trim();
                if (question) {
                    try { sessionStorage.setItem('mh_relationship_question', JSON.stringify({ question: question.slice(0, 1000), at: Date.now() })); } catch { /* Optional handoff. */ }
                }
                void track('one_time_product_cta_clicked', offer.dataset.relationshipOffer);
            });
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver(entries => {
                    if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .4)) {
                        void track('one_time_offer_viewed', offer.dataset.relationshipOffer);
                        observer.disconnect();
                    }
                }, { threshold: .4 });
                observer.observe(offer);
            }
        });
    }).catch(() => {});
})();
