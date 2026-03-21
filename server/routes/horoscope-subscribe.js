/**
 * Horoscope Email Subscription Routes
 * POST   /api/subscribe/horoscope  — subscribe
 * GET    /api/subscribe/horoscope/unsubscribe?token=xxx — one-click unsubscribe
 */
import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { supabase } from '../db-supabase.js';

const router = express.Router();

const subscribeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, error: 'Příliš mnoho pokusů. Zkuste to za 15 minut.' }
});

const VALID_SIGNS = ['Beran', 'Býk', 'Blíženci', 'Rak', 'Lev', 'Panna', 'Váhy', 'Štír', 'Střelec', 'Kozoroh', 'Vodnář', 'Ryby'];

// POST /api/subscribe/horoscope
router.post('/', subscribeLimiter, async (req, res) => {
    const { email, zodiac_sign } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, error: 'Neplatná emailová adresa.' });
    }
    if (!zodiac_sign || !VALID_SIGNS.includes(zodiac_sign)) {
        return res.status(400).json({ success: false, error: 'Neplatné znamení. Vyberte ze seznamu.' });
    }

    const token = crypto.randomBytes(32).toString('hex');

    try {
        const { error } = await supabase
            .from('horoscope_subscriptions')
            .upsert({
                email: email.toLowerCase().trim(),
                zodiac_sign,
                unsubscribe_token: token,
                active: true,
                subscribed_at: new Date().toISOString(),
                unsubscribed_at: null
            }, {
                onConflict: 'email',
                ignoreDuplicates: false
            });

        if (error) throw error;

        // Send confirmation email (non-blocking)
        sendConfirmationEmail(email, zodiac_sign).catch(e =>
            console.error('[HoroscopeSub] Confirmation email failed:', e.message)
        );

        res.json({ success: true, message: 'Odběr byl aktivován. Potvrzení přijde na email.' });
    } catch (err) {
        console.error('[HoroscopeSub] Subscribe error:', err);
        res.status(500).json({ success: false, error: 'Chyba serveru. Zkuste to prosím znovu.' });
    }
});

// GET /api/subscribe/horoscope/unsubscribe?token=xxx
router.get('/unsubscribe', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).send('<h2>Neplatný odkaz pro odhlášení.</h2>');
    }

    try {
        const { error } = await supabase
            .from('horoscope_subscriptions')
            .update({ active: false, unsubscribed_at: new Date().toISOString() })
            .eq('unsubscribe_token', token);

        if (error) throw error;

        res.send(`<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8">
            <title>Odhlášení — Mystická Hvězda</title>
            <style>body{font-family:sans-serif;background:#0a0a1a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
            .box{text-align:center;padding:2rem;} h1{color:#d4af37;} a{color:#d4af37;}</style>
            </head><body><div class="box">
            <h1>✅ Odhlášení úspěšné</h1>
            <p>Byl jsi odhlášen z denního horoskopu.</p>
            <a href="/">← Zpět na Mystickou Hvězdu</a>
            </div></body></html>`);
    } catch (err) {
        console.error('[HoroscopeSub] Unsubscribe error:', err);
        res.status(500).send('<h2>Chyba serveru. Zkuste to prosím znovu.</h2>');
    }
});

async function sendConfirmationEmail(email, sign) {
    const { sendEmail, EMAIL_TEMPLATES } = await import('../email-service.js');
    // Only send if template exists, otherwise skip silently
    if (!EMAIL_TEMPLATES['horoscope_subscription_confirm']) return;
    await sendEmail({ to: email, template: 'horoscope_subscription_confirm', data: { sign } });
}

export default router;
