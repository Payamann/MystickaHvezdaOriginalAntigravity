import express from 'express';

const router = express.Router();
const REPLACEMENT = Object.freeze({
    id: 'osobni_mapa_2026',
    name: 'Osobní mapa na 12 měsíců',
    path: '/osobni-mapa.html'
});

function retiredProductResponse(res) {
    return res.status(410).json({
        error: 'Mini Roční horoskop už nenabízíme. Pokračujte k Osobní mapě na celých 12 měsíců od nákupu.',
        retired: true,
        replacement: REPLACEMENT
    });
}

// Historical fulfillment remains in the Stripe webhook and reconciliation
// services. These endpoints only prevent creating any new fixed-year sale.
router.get('/product', (_req, res) => retiredProductResponse(res));
router.post('/checkout', (_req, res) => retiredProductResponse(res));

export default router;
