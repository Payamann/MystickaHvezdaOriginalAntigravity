// The return URL is a navigation hint, never evidence of a payment.
export async function verifyCheckoutResult(sessionId, { baseUrl = '/api', headers = {}, timeoutMs = 6000 } = {}) {
    if (typeof sessionId !== 'string' || !/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) return null;
    const controller = new AbortController();
    let timer;
    try {
        const request = fetch(`${baseUrl}/payment/checkout-result?session_id=${encodeURIComponent(sessionId)}`, {
            credentials: 'include', cache: 'no-store', headers, signal: controller.signal
        }).then(async response => {
            if (!response.ok) return null;
            const body = await response.json();
            const result = body.success === true ? body.result : null;
            if (!result || !['paid', 'trial', 'pending'].includes(result.status)) return null;
            if (result.status === 'paid' && (
                typeof result.transaction_id !== 'string' || !result.transaction_id
                || typeof result.product_id !== 'string' || !result.product_id
                || !Number.isFinite(result.value) || result.value <= 0
                || typeof result.currency !== 'string' || !/^[A-Z]{3}$/.test(result.currency)
            )) return null;
            return result;
        }).catch(() => null);
        return await Promise.race([request, new Promise(resolve => {
            timer = setTimeout(() => { controller.abort(); resolve(null); }, timeoutMs);
        })]);
    } finally {
        clearTimeout(timer);
    }
}
