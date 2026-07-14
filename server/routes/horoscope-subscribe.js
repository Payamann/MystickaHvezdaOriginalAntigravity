/**
 * Horoscope Email Subscription Routes
 * POST   /api/subscribe/horoscope  — subscribe
 * GET    /api/subscribe/horoscope/unsubscribe?token=xxx — odhlášení přes odkaz (HTML stránka)
 * POST   /api/subscribe/horoscope/unsubscribe?token=xxx — one-click unsubscribe (RFC 8058, Gmail/Apple)
 */
import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { supabase } from '../db-supabase.js';
import { renderUnsubscribePage } from '../utils/unsubscribe-page.js';

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
        sendConfirmationEmail(email, zodiac_sign, token).catch(e =>
            console.error('[HoroscopeSub] Confirmation email failed:', e.message)
        );

        res.json({ success: true, message: 'Odběr byl aktivován. Potvrzení přijde na email.' });
    } catch (err) {
        console.error('[HoroscopeSub] Subscribe error:', err);
        res.status(500).json({ success: false, error: 'Chyba serveru. Zkuste to prosím znovu.' });
    }
});

// Deaktivuje odběr podle unsubscribe tokenu. Vrací 'ok' | 'not_found' | vyhodí chybu.
async function deactivateByToken(token) {
    const { data, error } = await supabase
        .from('horoscope_subscriptions')
        .update({ active: false, unsubscribed_at: new Date().toISOString() })
        .eq('unsubscribe_token', token)
        .eq('active', true)
        .select('id')
        .maybeSingle();

    if (error) throw error;
    return data ? 'ok' : 'not_found';
}

// GET /api/subscribe/horoscope/unsubscribe?token=xxx — klik na odkaz v patičce (vrací HTML stránku)
router.get('/unsubscribe', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).send(renderUnsubscribePage({
            title: 'Neplatný odkaz',
            message: 'Odkaz pro odhlášení není kompletní.'
        }));
    }

    try {
        const result = await deactivateByToken(token);
        if (result === 'not_found') {
            return res.status(404).send(renderUnsubscribePage({
                title: 'Odkaz neexistuje',
                message: 'Odkaz pro odhlášení neexistuje nebo už byl použit.'
            }));
        }
        res.send(renderUnsubscribePage({
            title: 'Odhlášení úspěšné',
            message: 'Byl jsi odhlášen z denního horoskopu.'
        }));
    } catch (err) {
        console.error('[HoroscopeSub] Unsubscribe error:', err);
        res.status(500).send(renderUnsubscribePage({
            title: 'Chyba serveru',
            message: 'Zkuste to prosím znovu.'
        }));
    }
});

// POST /api/subscribe/horoscope/unsubscribe?token=xxx — one-click unsubscribe (RFC 8058).
// Gmail/Apple Mail sem POSTují z tlačítka "Odhlásit odběr" (bez cookies/CSRF — endpoint je
// vyňatý z CSRF v server/index.js). Vrací 200 na jakýkoli zpracovaný požadavek (idempotentní);
// e-mailový klient chce jen 2xx a chyby uživateli nezobrazuje.
router.post('/unsubscribe', async (req, res) => {
    const token = req.query.token || req.body?.token;
    if (!token) {
        return res.status(400).json({ success: false, error: 'Chybí token.' });
    }

    try {
        await deactivateByToken(token);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('[HoroscopeSub] One-click unsubscribe error:', err);
        res.status(500).json({ success: false });
    }
});

async function sendConfirmationEmail(email, sign, token) {
    const { sendEmail, EMAIL_TEMPLATES } = await import('../email-service.js');
    // Only send if template exists, otherwise skip silently
    if (!EMAIL_TEMPLATES['horoscope_subscription_confirm']) return;
    await sendEmail({ to: email, template: 'horoscope_subscription_confirm', data: { sign, token } });
}

export default router;
