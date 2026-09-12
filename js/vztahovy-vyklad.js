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
    try {
        const raw = sessionStorage.getItem('mh_relationship_question') || sessionStorage.getItem(draftKey);
        const draft = raw ? JSON.parse(raw) : null;
        if (draft && Date.now() - draft.at < 30 * 60 * 1000) {
            form.question.value = String(draft.question || '').slice(0, 1000);
            form.email.value = String(draft.email || '').slice(0, 254);
        }
        sessionStorage.removeItem('mh_relationship_question');
        if (draft && Date.now() - draft.at >= 30 * 60 * 1000) sessionStorage.removeItem(draftKey);
    } catch { /* Storage may be unavailable. */ }
    function csrf() {
        if (!csrfPromise) csrfPromise = fetch('/api/csrf-token', { credentials: 'same-origin' }).then(async response => {
            if (!response.ok) throw new Error('csrf');
            return (await response.json()).csrfToken;
        }).catch(error => { csrfPromise = null; throw error; });
        return csrfPromise;
    }
    function track(eventName) {
        try { window.MH_ANALYTICS?.trackEvent?.(eventName, { source, product_id: 'relationship_tarot', price: 149, currency: 'CZK' }); } catch { /* non-blocking */ }
        void csrf().then(token => fetch('/api/payment/funnel-event', { method: 'POST', keepalive: true, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: JSON.stringify({ eventName, source, feature: 'relationship_tarot', planType: 'relationship_tarot', metadata: { product_id: 'relationship_tarot', price: 149, currency: 'CZK' } }) })).catch(() => {});
    }
    track('one_time_product_viewed');
    form.addEventListener('input', () => track('one_time_form_started'), { once: true });
    document.querySelectorAll('[data-reading-cta]').forEach(link => link.addEventListener('click', () => track('one_time_product_cta_clicked')));
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
        button.disabled = true;
        error.textContent = '';
        try { sessionStorage.setItem(draftKey, JSON.stringify({ question: form.question.value, email: form.email.value, at: Date.now() })); } catch { /* Preserve in the DOM when storage is unavailable. */ }
        track('one_time_form_submitted');
        try {
            const response = await fetch('/api/vztahovy-vyklad/checkout', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': await csrf() },
                body: JSON.stringify({ email: form.email.value.trim(), question: form.question.value.trim(), consent: document.getElementById('consent').checked, source }) });
            if (response.status === 403) csrfPromise = null;
            const result = await response.json().catch(() => ({ error: 'Platbu se nepodařilo otevřít. Zkus to za chvíli.' }));
            if (!response.ok) throw new Error(result.error || 'Platbu se nepodařilo otevřít.');
            const url = new URL(result.url);
            if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('Platební odkaz se nepodařilo ověřit.');
            location.assign(url.href);
        } catch (failure) {
            error.textContent = failure.message === 'csrf' ? 'Platbu se nepodařilo připravit. Zkus to znovu.' : failure.message;
            button.disabled = false;
            track('one_time_checkout_failed');
        }
    });
    async function checkPayment() {
        const message = document.getElementById('payment-message');
        const retry = document.getElementById('retry-payment');
        document.getElementById('payment-result').hidden = false;
        document.getElementById('objednavka').hidden = true;
        message.textContent = 'Ověřujeme platbu. Samotný návrat ze Stripe ji ještě nepotvrzuje.';
        retry.disabled = true;
        try {
            const response = await fetch(`/api/vztahovy-vyklad/checkout-result?session_id=${encodeURIComponent(params.get('session_id') || '')}`, { credentials: 'same-origin', cache: 'no-store' });
            if (!response.ok) throw new Error('verify');
            const result = await response.json();
            if (result.status === 'paid') { try { sessionStorage.removeItem(draftKey); } catch { /* optional */ } }
            message.textContent = result.status === 'paid' ? 'Platba je potvrzená. Výklad se připravuje a dorazí do e-mailu. Pokud do 20 minut nedorazí, zkontroluj spam a napiš podpoře.' : 'Platba zatím není potvrzená. Ověř stav znovu za chvíli; další objednávku nevytvářej.';
            retry.hidden = result.status === 'paid';
        } catch { message.textContent = 'Platbu teď nemůžeme ověřit. To neznamená, že neproběhla. Zkus ověření znovu nebo kontaktuj podporu; zatím neplať podruhé.'; }
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
