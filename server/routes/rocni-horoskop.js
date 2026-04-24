import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const APP_URL = process.env.APP_URL || 'http://localhost:3001';

const PRICE_CZK = 19900; // 199 Kč in haléře

// POST /api/rocni-horoskop/checkout
// Creates Stripe one-time payment session. No auth required.
router.post('/checkout', async (req, res) => {
    const { name, birthDate, sign, email } = req.body;

    if (!name || !birthDate || !sign || !email) {
        return res.status(400).json({ error: 'Vyplňte všechna pole.' });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return res.status(400).json({ error: 'Neplatná e-mailová adresa.' });
    }
    if (typeof name !== 'string' || name.length > 100) {
        return res.status(400).json({ error: 'Neplatné jméno.' });
    }

    const VALID_SIGNS = ['beran','byk','blizenci','rak','lev','panna','vahy','stir','strelec','kozoroh','vodnar','ryby'];
    if (!VALID_SIGNS.includes(sign)) {
        return res.status(400).json({ error: 'Neplatné znamení.' });
    }

    // birthDate must be YYYY-MM-DD and a real past date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || isNaN(Date.parse(birthDate)) || new Date(birthDate) >= new Date()) {
        return res.status(400).json({ error: 'Neplatné datum narození.' });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: email,
            line_items: [{
                price_data: {
                    currency: 'czk',
                    product_data: {
                        name: 'Roční Horoskop na míru 2026',
                        description: `Personalizovaný horoskop pro ${name} — ${new Date().getFullYear()}`,
                    },
                    unit_amount: PRICE_CZK,
                },
                quantity: 1,
            }],
            mode: 'payment',
            locale: 'cs',
            success_url: `${APP_URL}/rocni-horoskop.html?status=success`,
            cancel_url: `${APP_URL}/rocni-horoskop.html?status=cancel`,
            metadata: {
                productType: 'rocni_horoskop',
                customerName: name,
                birthDate,
                sign,
                email,
            },
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error('[HOROSKOP] Checkout session error:', err.message);
        res.status(500).json({ error: 'Platba se nezdařila. Zkuste to prosím znovu.' });
    }
});

export default router;
