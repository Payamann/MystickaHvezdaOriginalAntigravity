import { initPaymentButtons } from './platby.js';

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initPaymentButtons());
} else {
    initPaymentButtons();
}
