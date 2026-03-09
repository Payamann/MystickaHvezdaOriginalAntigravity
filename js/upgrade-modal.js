/**
 * Upgrade Modal - Soft Wall Upsell
 * Shows premium offer when user hits feature limits
 * Instead of hard block: "You've hit daily limit" → "Upgrade for unlimited"
 */

export function showUpgradeModal(data) {
    const {
        title = 'Chcete Unlimited Přístup?',
        message = 'Jste dosáhli denního limitu. Upgrade na Premium pro neomezené možnosti.',
        feature = 'Unknown Feature',
        plan = 'pruvodce',
        price = 179,
        priceLabel = 'Kč/měsíc',
        upgradeUrl = '/cenik?selected=pruvodce',
        features = [
            '✓ Neomezené čtení',
            '✓ Personalizované analýzy',
            '✓ Sdílení výsledků'
        ]
    } = data;

    // Remove existing modal if any
    const existingModal = document.getElementById('upgrade-modal-overlay');
    if (existingModal) existingModal.remove();

    // Create modal HTML
    const modalHTML = `
        <div id="upgrade-modal-overlay" class="upgrade-modal-overlay">
            <div class="upgrade-modal-content">
                <!-- Close Button -->
                <button class="upgrade-modal-close" id="upgrade-close-btn" aria-label="Zavřít">×</button>

                <!-- Premium Badge -->
                <div class="upgrade-modal-badge">⭐ PREMIUM</div>

                <!-- Title -->
                <h2 class="upgrade-modal-title">${title}</h2>

                <!-- Message -->
                <p class="upgrade-modal-message">${message}</p>

                <!-- Features List -->
                <div class="upgrade-modal-features">
                    ${features.map(feature => `<div class="upgrade-feature-item">${feature}</div>`).join('')}
                </div>

                <!-- Price Display -->
                <div class="upgrade-modal-price">
                    <div class="price-number">${price}</div>
                    <div class="price-unit">${priceLabel}</div>
                </div>

                <!-- CTA Buttons -->
                <div class="upgrade-modal-buttons">
                    <a href="${upgradeUrl}" class="btn-upgrade-primary" id="upgrade-cta-btn">
                        Upgradovat Teď
                    </a>
                    <button class="btn-upgrade-secondary" id="upgrade-later-btn">
                        Později
                    </button>
                </div>

                <!-- Trust Indicators -->
                <div class="upgrade-modal-trust">
                    <span>💳 Zabezpečená platba</span>
                    <span>📞 24/7 podpora</span>
                    <span>↩️ 30 dní záruka</span>
                </div>
            </div>
        </div>
    `;

    // Insert modal into DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal elements
    const modal = document.getElementById('upgrade-modal-overlay');
    const closeBtn = document.getElementById('upgrade-close-btn');
    const laterBtn = document.getElementById('upgrade-later-btn');
    const ctaBtn = document.getElementById('upgrade-cta-btn');

    // Close modal handlers
    const closeModal = () => {
        modal.classList.add('closing');
        setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    laterBtn.addEventListener('click', closeModal);

    // Track upgrade modal view (analytics)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'upgrade_modal_shown', {
            feature: feature,
            plan: plan,
            price: price
        });
    }

    // Track CTA click
    ctaBtn.addEventListener('click', () => {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'upgrade_cta_clicked', {
                feature: feature,
                plan: plan
            });
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && document.body.contains(modal)) {
            closeModal();
        }
    });

    // Trigger animation
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });

    return modal;
}

/**
 * Helper: Check if user hit daily limit and show modal
 * Usage in your feature endpoints:
 *
 * if (!req.isPremium && count >= 3) {
 *     return res.status(402).json({
 *         success: false,
 *         upsell: {
 *             title: 'Chcete neomezené čtení?',
 *             feature: 'crystal_ball',
 *             plan: 'pruvodce',
 *             price: 179
 *         }
 *     });
 * }
 */
export function handleUpgradeResponse(response) {
    if (response && response.upsell) {
        showUpgradeModal(response.upsell);
        return true;
    }
    return false;
}
