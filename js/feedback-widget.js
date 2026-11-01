(function () {
    if (window.MH_FEEDBACK_WIDGET_INIT) return;
    window.MH_FEEDBACK_WIDGET_INIT = true;

    let csrfPromise = null;

    const feedbackCopy = {
        cs: {
            saving: 'Ukládám odpověď...',
            successYes: 'Díky, tohle nám pomáhá držet kvalitu.',
            successNo: 'Díky, podíváme se, kde stránka ztrácí jasnost.',
            error: 'Zpětnou vazbu se nepodařilo uložit.'
        },
        sk: {
            saving: 'Ukladám odpoveď...',
            successYes: 'Ďakujeme, pomáha nám to udržať kvalitu.',
            successNo: 'Ďakujeme, pozrieme sa, kde stránka stráca zrozumiteľnosť.',
            error: 'Spätnú väzbu sa nepodarilo uložiť.'
        },
        pl: {
            saving: 'Zapisuję odpowiedź...',
            successYes: 'Dziękujemy, to pomaga nam dbać o jakość.',
            successNo: 'Dziękujemy, sprawdzimy, co na stronie jest niejasne.',
            error: 'Nie udało się zapisać opinii.'
        },
        en: {
            saving: 'Saving your feedback...',
            successYes: 'Thank you. Your feedback helps us maintain quality.',
            successNo: 'Thank you. We’ll look into what could be clearer on the page.',
            error: 'Your feedback could not be saved.'
        }
    };

    function getFeedbackCopy() {
        const language = document.documentElement.lang.toLowerCase().slice(0, 2);
        return feedbackCopy[language] || feedbackCopy.cs;
    }

    function getCsrfToken() {
        if (window.getCSRFToken) return window.getCSRFToken();
        if (csrfPromise) return csrfPromise;
        csrfPromise = fetch('/api/csrf-token', { credentials: 'include' })
            .then((response) => response.json())
            .then((data) => data.csrfToken || null)
            .catch(() => null)
            .finally(() => {
                csrfPromise = null;
            });
        return csrfPromise;
    }

    async function sendFeedback(value, widget) {
        const copy = getFeedbackCopy();
        const status = widget.querySelector('[data-feedback-status]');
        const buttons = widget.querySelectorAll('[data-feedback-value]');

        buttons.forEach((button) => {
            button.disabled = true;
        });
        if (status) status.textContent = copy.saving;

        try {
            const csrfToken = await getCsrfToken();
            if (!csrfToken) throw new Error('missing_csrf');

            const response = await fetch('/api/analytics/event', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({
                    eventName: 'feedback_submitted',
                    path: window.location.pathname,
                    page: document.title,
                    metadata: {
                        value,
                        path: window.location.pathname,
                        component: 'footer_feedback'
                    }
                })
            });

            if (!response.ok) throw new Error(`http_${response.status}`);

            widget.dataset.feedbackSubmitted = 'true';
            if (status) status.textContent = value === 'yes'
                ? copy.successYes
                : copy.successNo;
        } catch {
            if (status) status.textContent = copy.error;
            buttons.forEach((button) => {
                button.disabled = false;
            });
        }
    }

    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-feedback-value]');
        if (!button) return;
        const widget = button.closest('[data-feedback-widget]');
        if (!widget || widget.dataset.feedbackSubmitted === 'true') return;
        sendFeedback(button.dataset.feedbackValue, widget);
    });
})();
