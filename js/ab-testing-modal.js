/**
 * A/B TESTING MODAL
 * Handles variant assignment, display, and event tracking
 */

class ABTestingModal {
    static variantCache = {};

    /**
     * Initialize A/B testing system
     * Call this on page load before showing any modals
     */
    static async init() {
        console.log('[AB-TEST] Initializing A/B testing system');
    }

    /**
     * Get current variant for a test feature
     * Returns: {variantId, variant_name, cta_text, subject_line}
     * Handles variant assignment and caching
     */
    static async getVariant(testFeature) {
        try {
            // Check cache first
            if (this.variantCache[testFeature]) {
                return this.variantCache[testFeature];
            }

            // Check session storage
            const cached = sessionStorage.getItem(`ab_test_${testFeature}`);
            if (cached) {
                const variant = JSON.parse(cached);
                this.variantCache[testFeature] = variant;
                return variant;
            }

            // Fetch from backend
            const token = localStorage.getItem('auth_token');
            if (!token) {
                console.warn('[AB-TEST] User not authenticated, skipping variant assignment');
                return null;
            }

            const response = await fetch(`/api/ab-testing/active?testFeature=${testFeature}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get variant: ${response.status}`);
            }

            const data = await response.json();
            const variant = data.variant;

            // Cache the variant
            sessionStorage.setItem(`ab_test_${testFeature}`, JSON.stringify(variant));
            this.variantCache[testFeature] = variant;

            // Track the 'shown' event
            await this.trackEvent(variant.variantId, 'shown');

            console.log(`[AB-TEST] User assigned to variant: ${variant.variant_name} for ${testFeature}`);

            return variant;
        } catch (error) {
            console.error('[AB-TEST] Error getting variant:', error);
            return null;
        }
    }

    /**
     * Track A/B test event (shown, clicked, converted)
     */
    static async trackEvent(variantId, eventType) {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return false;

            const response = await fetch('/api/ab-testing/event', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    variantId,
                    eventType
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to track event: ${response.status}`);
            }

            console.log(`[AB-TEST] Tracked event: ${eventType} for variant ${variantId}`);
            return true;
        } catch (error) {
            console.error('[AB-TEST] Error tracking event:', error);
            return false;
        }
    }

    /**
     * Render upgrade modal with variant-specific CTA text
     * Should be called by existing upgrade modal code
     */
    static async showUpgradeModal(modalElement) {
        try {
            const variant = await this.getVariant('upgrade_modal');
            if (!variant) return;

            // Find CTA button in modal
            const ctaButton = modalElement.querySelector('[data-ab-test-cta]');
            if (ctaButton) {
                ctaButton.textContent = variant.cta_text;
                ctaButton.setAttribute('data-variant-id', variant.variantId);
            }

            // Track click on CTA button
            const allCtaButtons = modalElement.querySelectorAll('[data-ab-test-cta]');
            allCtaButtons.forEach(button => {
                button.addEventListener('click', () => {
                    this.trackEvent(variant.variantId, 'clicked');
                });
            });

            return variant;
        } catch (error) {
            console.error('[AB-TEST] Error showing upgrade modal:', error);
        }
    }

    /**
     * Track conversion event (user completed purchase)
     * Called from payment success handler
     */
    static trackConversion(variantId) {
        return this.trackEvent(variantId, 'converted');
    }
}

export default ABTestingModal;
