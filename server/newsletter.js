import express from 'express';
import crypto from 'crypto';
import { supabase } from './db-supabase.js';
import rateLimit from 'express-rate-limit'; // Security
import { validateEmail } from './utils/validation.js';
import { JWT_SECRET } from './config/jwt.js';
import { renderUnsubscribePage } from './utils/unsubscribe-page.js';

const router = express.Router();

// Specific Rate Limit for Newsletter: 5 requests per hour per IP
const newsletterLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { success: false, error: 'Příliš mnoho pokusů. Zkuste to prosím později.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Stateless one-click unsubscribe token: HMAC of the lowercased email keyed
 * by JWT_SECRET. No schema change needed and the link cannot be forged for
 * other addresses.
 */
export function buildNewsletterUnsubscribeToken(email) {
    return crypto
        .createHmac('sha256', String(JWT_SECRET || ''))
        .update(String(email || '').toLowerCase().trim())
        .digest('hex');
}

export function verifyNewsletterUnsubscribeToken(email, token) {
    const expected = buildNewsletterUnsubscribeToken(email);
    const provided = String(token || '');
    if (provided.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

export function buildNewsletterUnsubscribePath(email) {
    const normalized = String(email || '').toLowerCase().trim();
    return `/api/newsletter/unsubscribe?email=${encodeURIComponent(normalized)}&token=${buildNewsletterUnsubscribeToken(normalized)}`;
}

async function sendWelcomeEmail(email) {
    const { sendEmail, EMAIL_TEMPLATES } = await import('./email-service.js');
    if (!EMAIL_TEMPLATES.newsletter_welcome) return;
    await sendEmail({
        to: email,
        template: 'newsletter_welcome',
        data: {
            unsubscribe_url: buildNewsletterUnsubscribePath(email)
        }
    });
}

// POST /subscribe
router.post('/subscribe', newsletterLimiter, async (req, res) => {
    const { email: rawEmail, source: rawSource = 'web_footer' } = req.body;

    try {
        // 1. Validate Input using centralized validator
        const validatedEmail = validateEmail(rawEmail);

        // Validate source
        const VALID_SOURCES = ['web_footer', 'web_popup', 'web_cenik', 'web_landing'];
        const validatedSource = VALID_SOURCES.includes(rawSource) ? rawSource : 'web_footer';

        // 2. Insert into Supabase
        const { error } = await supabase
            .from('newsletter_subscribers')
            .insert([
                { email: validatedEmail, source: validatedSource }
            ])
            .select();

        if (error) {
            // Handle duplicate email unique constraint violation
            if (error.code === '23505') { // Postgres code for unique_violation
                return res.status(409).json({
                    success: false,
                    error: 'Tento email je již přihlášen k odběru.'
                });
            }
            throw error;
        }

        // 3. Welcome email (non-blocking)
        sendWelcomeEmail(validatedEmail).catch((e) =>
            console.error('[Newsletter] Welcome email failed:', e.message)
        );

        // 4. Success
        res.status(201).json({
            success: true,
            message: 'Úspěšně přihlášeno k odběru! Děkujeme.'
        });

    } catch (validationError) {
        if (validationError.message) {
            return res.status(400).json({
                success: false,
                error: validationError.message
            });
        }
        console.error('Newsletter Subscribe Error:', validationError);
        res.status(500).json({
            success: false,
            error: 'Omlouváme se, došlo k chybě serveru. Zkuste to prosím později.'
        });
    }
});

// GET /unsubscribe?email=...&token=... — one-click unsubscribe from emails
router.get('/unsubscribe', async (req, res) => {
    const email = String(req.query.email || '').toLowerCase().trim();
    const token = String(req.query.token || '');

    if (!email || !token || !verifyNewsletterUnsubscribeToken(email, token)) {
        return res.status(400).send(renderUnsubscribePage({
            title: 'Neplatný odkaz',
            message: 'Odkaz pro odhlášení není kompletní nebo je neplatný.'
        }));
    }

    try {
        const { error } = await supabase
            .from('newsletter_subscribers')
            .update({ is_active: false })
            .eq('email', email);

        if (error) throw error;

        // Always render success for a valid signed link to prevent enumeration.
        res.send(renderUnsubscribePage({
            title: 'Odhlášení úspěšné',
            message: 'Byl jsi odhlášen z newsletteru Mystické Hvězdy.'
        }));
    } catch (err) {
        console.error('[Newsletter] Unsubscribe error:', err);
        res.status(500).send(renderUnsubscribePage({
            title: 'Chyba serveru',
            message: 'Zkuste to prosím znovu.'
        }));
    }
});

// POST /unsubscribe (GDPR compliance)
router.post('/unsubscribe', newsletterLimiter, async (req, res) => {
    const { email: rawEmail } = req.body;

    try {
        // Validate email
        const validatedEmail = validateEmail(rawEmail);

        const { error } = await supabase
            .from('newsletter_subscribers')
            .update({ is_active: false })
            .eq('email', validatedEmail)
            .select();

        if (error) {
            throw error;
        }

        // Always return success to prevent email enumeration (GDPR)
        res.status(200).json({
            success: true,
            message: 'Pokud je email registrován, byl úspěšně odhlášen z odběru.'
        });

    } catch (validationError) {
        if (validationError.message && (validationError.message.includes('Invalid') || validationError.message.includes('required'))) {
            return res.status(400).json({
                success: false,
                error: validationError.message
            });
        }
        console.error('Newsletter Unsubscribe Error:', validationError);
        res.status(500).json({
            success: false,
            error: 'Omlouváme se, došlo k chybě serveru. Zkuste to prosím později.'
        });
    }
});

export default router;
