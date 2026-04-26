(() => {
    const result = document.getElementById('activation-result');
    const statusResult = document.getElementById('status-result');
    const activationButton = document.getElementById('activate-premium-btn');

    function replaceChildren(target, children) {
        if (!target) return;
        target.replaceChildren(...children);
    }

    function textNode(tag, className, text) {
        const node = document.createElement(tag);
        node.className = className;
        node.textContent = text;
        return node;
    }

    function showActivationSuccess(message, expiresAt) {
        const wrapper = document.createElement('div');
        wrapper.className = 'mh-inline-b28f91cf9f';
        wrapper.append(document.createTextNode(`OK ${message || 'Premium aktivovano'}`));
        wrapper.append(document.createElement('br'));
        wrapper.append(document.createTextNode(`Vyprsi: ${new Date(expiresAt).toLocaleDateString('cs-CZ')}`));
        replaceChildren(result, [wrapper]);
    }

    function showActivationError(message) {
        replaceChildren(result, [textNode('div', 'mh-inline-f0d3c25a89', `Chyba: ${message || 'Neznama chyba'}`)]);
    }

    async function checkStatus() {
        if (!window.Premium?.checkStatus) return;

        const isPremium = await window.Premium.checkStatus();
        replaceChildren(statusResult, [
            textNode('span', isPremium ? 'mh-inline-b28f91cf9f' : 'mh-inline-1fd579808c', isPremium ? 'OK PREMIUM' : 'FREE')
        ]);
    }

    async function activatePremium() {
        const token = localStorage.getItem('token');

        if (!token) {
            alert('Musite byt prihlaseni');
            window.location.href = '/profil.html';
            return;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.id;

            const response = await fetch('http://localhost:3001/payment/subscription/activate-manual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId,
                    planType: 'premium_monthly',
                    durationDays: 30
                })
            });

            const data = await response.json();

            if (data.success) {
                showActivationSuccess(data.message, data.expiresAt);
                setTimeout(() => location.reload(), 2000);
                return;
            }

            showActivationError(data.error);
        } catch (error) {
            showActivationError(error.message);
        }
    }

    document.addEventListener('click', (event) => {
        const target = event.target.closest('[data-action]');
        if (!target) return;

        const action = target.getAttribute('data-action');
        if (action === 'showPaywall') {
            window.Premium?.showPaywall?.(target.getAttribute('data-feature'), target.getAttribute('data-message'));
        } else if (action === 'lockContent') {
            const targetId = target.getAttribute('data-target');
            window.Premium?.lockContent?.(document.getElementById(targetId), target.getAttribute('data-feature'));
        } else if (action === 'checkStatus') {
            checkStatus();
        }
    });

    activationButton?.addEventListener('click', activatePremium);
    setTimeout(checkStatus, 500);
})();
