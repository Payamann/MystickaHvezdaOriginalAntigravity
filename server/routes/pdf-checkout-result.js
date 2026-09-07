import express from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';

export const pdfProofHash = value => createHash('sha256').update(value).digest('hex');
export const pdfProofCookie = sessionId => `mh_pdf_${pdfProofHash(sessionId).slice(0, 16)}`;

export function createPdfCheckoutResultRouter(getStripeClient) {
    const router = express.Router();
    router.get('/checkout-result', async (req, res) => {
        res.set('Cache-Control', 'no-store');
        const id = req.query.session_id;
        if (typeof id !== 'string' || !/^cs_[A-Za-z0-9_]{3,200}$/.test(id)) return res.sendStatus(400);
        const proof = req.cookies?.[pdfProofCookie(id)];
        if (typeof proof !== 'string' || !/^[a-f0-9]{64}$/.test(proof)) return res.sendStatus(403);
        try {
            const session = await getStripeClient().checkout.sessions.retrieve(id, { expand: ['payment_intent'] }, { timeout: 5000, maxNetworkRetries: 0 });
            const expected = session.metadata?.returnProofHash;
            if (typeof expected !== 'string' || !/^[a-f0-9]{64}$/.test(expected)
                || !timingSafeEqual(Buffer.from(expected), Buffer.from(pdfProofHash(proof)))) return res.sendStatus(403);
            if (session.mode !== 'payment' || session.metadata?.productId !== 'osobni_mapa_2026') return res.sendStatus(400);
            const payment = session.payment_intent;
            const paid = session.status === 'complete' && session.payment_status === 'paid'
                && payment?.status === 'succeeded' && payment.currency === 'czk'
                && Number.isSafeInteger(payment.amount_received) && payment.amount_received > 0;
            return res.json({ success: true, result: {
                status: paid ? 'paid' : 'pending', product_id: 'osobni_mapa_2026',
                transaction_id: paid ? payment.id : null,
                value: paid ? payment.amount_received / 100 : 0, currency: 'CZK'
            } });
        } catch {
            return res.status(502).json({ success: false });
        }
    });
    return router;
}
