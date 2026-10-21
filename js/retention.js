/**
 * RETENTION: Churn Prevention Flows
 *
 * Cancellation Flow:
 * - Exit intent detection
 * - Pause instead of cancel option
 * - Feedback collection
 * - Win-back campaigns
 */

function assertRetentionOwner(ownerId) {
    if (ownerId && window.Auth?.user?.id !== ownerId) {
        throw new Error('Účet se během správy členství změnil. Obnov profil a zkus to znovu.');
    }
}

async function postRetentionJson(url, body, ownerId = null) {
    const csrfToken = window.getCSRFToken ? await window.getCSRFToken() : null;
    assertRetentionOwner(ownerId);
    return fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(csrfToken && { 'X-CSRF-Token': csrfToken })
        },
        body: JSON.stringify({ ...body, ...(ownerId ? { expectedUserId: ownerId } : {}) })
    });
}

function createRetentionSymbolIcon(symbolId, className = '') {
    const allowedSymbols = ['check', 'close', 'cycle', 'gem', 'heart', 'info', 'people', 'search', 'star', 'warning'];
    if (!allowedSymbols.includes(symbolId)) return null;

    const namespace = 'http://www.w3.org/2000/svg';
    const icon = document.createElementNS(namespace, 'svg');
    icon.setAttribute('class', `mh-symbol retention-icon${className ? ` ${className}` : ''}`);
    icon.setAttribute('viewBox', '0 0 48 48');
    icon.setAttribute('width', '24');
    icon.setAttribute('height', '24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '1.8');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');

    const use = document.createElementNS(namespace, 'use');
    use.setAttribute('href', `/img/icons/mh-symbols.svg#${symbolId}`);
    icon.appendChild(use);
    return icon;
}

const MH_RETENTION = {
    /**
     * Show cancellation modal when user attempts to cancel subscription
     */
    showCancellationModal(onConfirm) {
        this.ownerId = window.Auth?.user?.id || null;
        this.onConfirm = typeof onConfirm === 'function' ? onConfirm : null;
        const modal = document.createElement('div');
        modal.className = 'retention-modal-overlay';
        modal.innerHTML = `
            <div class="retention-modal">
                <button class="retention-modal__close" type="button" data-retention-action="close" aria-label="Zavřít okno"><span data-retention-icon="close"></span></button>

                <h2 class="retention-modal__title"><span data-retention-icon="star"></span>Chceme se zlepšit!</h2>
                <p class="retention-modal__subtitle">Prosím řekněte nám, proč chcete odejít</p>

                <form id="cancellation-feedback-form" class="retention-form">
                    <!-- Cancellation reason options -->
                    <div class="retention-form__options">
                        <label class="retention-form__option">
                            <input type="radio" name="reason" value="too_expensive" required>
                            <span class="retention-form__label"><span data-retention-icon="gem"></span>Příliš drahé</span>
                            <span class="retention-form__hint">Nabídneme úspornější variantu</span>
                        </label>

                        <label class="retention-form__option">
                            <input type="radio" name="reason" value="not_using">
                            <span class="retention-form__label"><span data-retention-icon="cycle"></span>Nepoužívám</span>
                            <span class="retention-form__hint">Pozastavte na měsíc zdarma</span>
                        </label>

                        <label class="retention-form__option">
                            <input type="radio" name="reason" value="found_better">
                            <span class="retention-form__label"><span data-retention-icon="search"></span>Mám lepší alternativu</span>
                            <span class="retention-form__hint">Kterou aplikaci?</span>
                        </label>

                        <label class="retention-form__option">
                            <input type="radio" name="reason" value="personal">
                            <span class="retention-form__label"><span data-retention-icon="people"></span>Osobní důvody</span>
                            <span class="retention-form__hint">Můžete se vrátit později</span>
                        </label>

                        <label class="retention-form__option">
                            <input type="radio" name="reason" value="other">
                            <span class="retention-form__label"><span data-retention-icon="info"></span>Jiné</span>
                            <span class="retention-form__hint">Můžete napsat více</span>
                        </label>
                    </div>

                    <!-- Optional feedback text -->
                    <textarea
                        id="cancellation-feedback-text"
                        class="retention-form__textarea"
                        placeholder="Ostatní informace (volitelné)..."
                        rows="3"
                    ></textarea>

                    <!-- Action buttons -->
                    <div class="retention-form__actions">
                        <button type="button" class="btn btn--secondary" data-retention-action="cancel">
                            Zrušit
                        </button>
                        <button type="button" class="btn btn--primary" data-retention-action="offer">
                            Podívat se na nabídky
                        </button>
                    </div>
                </form>

                <!-- Pause subscription offer (appears after selecting reason) -->
                <div id="pause-offer" class="retention-offer" hidden>
                    <h3><span data-retention-icon="cycle"></span>Pozastavit místo zrušení?</h3>
                    <p>Tvoje předplatné bude pozastaveno na <strong>1 měsíc zdarma</strong>.</p>
                    <p>Vrať se, až ti budeme chybět — bez ztráty dat.</p>
                    <button class="btn btn--primary" type="button" data-retention-action="pause">
                        Pozastavit na měsíc
                    </button>
                </div>

                <!-- Discount offer (appears for "too expensive") -->
                <div id="discount-offer" class="retention-offer" hidden>
                    <h3><span data-retention-icon="heart"></span>Speciální nabídka</h3>
                    <p>Máme pro tebe <strong>25% slevu</strong> na příští 3 měsíce.</p>
                    <p class="retention-offer__code">Kód: <code>STAY25</code></p>
                    <button class="btn btn--primary" type="button" data-retention-action="discount">
                        Přijmout slevu
                    </button>
                </div>
            </div>
        `;

        modal.querySelectorAll('[data-retention-icon]').forEach((placeholder) => {
            const icon = createRetentionSymbolIcon(placeholder.dataset.retentionIcon);
            if (icon) placeholder.replaceWith(icon);
        });

        document.body.appendChild(modal);
        this.currentModal = modal;

        modal.addEventListener('click', (event) => {
            const action = event.target.closest('[data-retention-action]')?.dataset.retentionAction;
            if (!action) return;

            const handlers = {
                close: () => this.closeCancellationModal(),
                cancel: () => this.handleCancellation(),
                offer: () => this.handleOffer(),
                pause: () => this.handlePause(),
                discount: () => this.handleDiscountAccept()
            };

            handlers[action]?.();
        });

        // Form submit handler
        document.getElementById('cancellation-feedback-form').addEventListener('change', (e) => {
            const reason = e.target.value;
            this.showRelevantOffer(reason);
        });

        // Track that user is in churn flow
        trackEvent('churn_prevention_shown', { timestamp: new Date() });
    },

    /**
     * Show relevant offer based on cancellation reason
     */
    showRelevantOffer(reason) {
        document.getElementById('pause-offer').hidden = true;
        document.getElementById('discount-offer').hidden = true;

        if (reason === 'not_using') {
            document.getElementById('pause-offer').hidden = false;
            trackEvent('pause_offer_shown');
        } else if (reason === 'too_expensive') {
            document.getElementById('discount-offer').hidden = false;
            trackEvent('discount_offer_shown');
        }
    },

    /**
     * User confirmed cancellation (no option taken)
     */
    async handleCancellation() {
        const form = document.getElementById('cancellation-feedback-form');
        const reason = form.querySelector('input[name="reason"]:checked')?.value;
        const feedback = document.getElementById('cancellation-feedback-text').value;

        // Save feedback
        try {
            const response = await postRetentionJson('/api/payment/retention/feedback', {
                type: 'churn',
                reason: reason || 'not_provided',
                feedback: feedback,
                timestamp: new Date().toISOString()
            }, this.ownerId);

            if (response.ok) {
                trackEvent('churn_confirmed', { reason });
            }
        } catch (e) {
            console.warn('Failed to save churn feedback:', e);
        }

        // Proceed with cancellation
        this.closeCancellationModal();
        // Call parent cancellation handler
        this.onConfirm?.();
        this.onConfirm = null;
    },

    /**
     * User wants to pause subscription instead of cancel
     */
    async handlePause() {
        try {
            const response = await postRetentionJson('/api/payment/subscription/pause', {
                pauseDays: 30
            }, this.ownerId);

            const data = await response.json();

            if (response.ok) {
                this.showToast('Tvoje předplatné je pozastaveno na 1 měsíc!', 'success');
                trackEvent('pause_accepted');
                this.closeCancellationModal();

                // Redirect to account page
                setTimeout(() => {
                    window.location.href = '/profil.html';
                }, 2000);
            } else {
                this.showToast('Chyba: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (e) {
            this.showToast('Chyba při pozastavení: ' + e.message, 'error');
        }
    },

    /**
     * User accepts discount offer
     */
    async handleDiscountAccept() {
        try {
            const response = await postRetentionJson('/api/payment/subscription/apply-discount', {
                couponCode: 'STAY25'
            }, this.ownerId);

            if (response.ok) {
                this.showToast('Sleva byla aplikována! 25% na 3 měsíce.', 'success');
                trackEvent('discount_accepted');
                this.closeCancellationModal();

                // Send discount confirmation email
                this.sendDiscountEmail(this.ownerId);

                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        } catch (e) {
            this.showToast('Chyba při aplikování slevy: ' + e.message, 'error');
        }
    },

    /**
     * Show offer selection (called on form change)
     */
    handleOffer() {
        const reason = document.querySelector('input[name="reason"]:checked')?.value;

        if (!reason) {
            this.showToast('Prosím vyberte důvod odchodu', 'info');
            return;
        }

        if (reason === 'not_using') {
            this.handlePause();
        } else if (reason === 'too_expensive') {
            this.handleDiscountAccept();
        } else {
            this.handleCancellation();
        }
    },

    /**
     * Close cancellation modal
     */
    closeCancellationModal() {
        if (this.currentModal) {
            this.currentModal.classList.add('retention-modal-overlay--closing');
            setTimeout(() => {
                this.currentModal.remove();
                this.currentModal = null;
            }, 300);
        }
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `retention-toast retention-toast--${type}`;
        const iconName = type === 'success' ? 'check' : type === 'error' ? 'warning' : 'info';
        const icon = createRetentionSymbolIcon(iconName, 'retention-toast__icon');
        if (icon) toast.appendChild(icon);
        toast.appendChild(document.createTextNode(String(message)));
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('retention-toast--closing');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Send discount email notification
     */
    async sendDiscountEmail(ownerId = this.ownerId) {
        try {
            await postRetentionJson('/api/payment/email/send', {
                template: 'discount_applied',
                data: { discount: 25, months: 3 }
            }, ownerId);
        } catch (e) {
            console.warn('Failed to send discount email:', e);
        }
    }
};

// Export for use in subscription management pages
window.MH_RETENTION = MH_RETENTION;
