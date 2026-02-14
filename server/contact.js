import express from 'express';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Contact form rate limiter: 3 messages per hour per IP
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: { success: false, error: 'Příliš mnoho zpráv. Zkuste to prosím později.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Helper for email validation
const isValidEmail = (email) => {
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/.test(email);
};

// POST /contact
router.post('/contact', contactLimiter, async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Validate inputs
    if (!name || !email || !subject || !message) {
        return res.status(400).json({
            success: false,
            error: 'Všechna pole jsou povinná.'
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            error: 'Zadejte prosím platnou emailovou adresu.'
        });
    }

    // Sanitize inputs
    const safeName = String(name).substring(0, 100);
    const safeEmail = String(email).trim().toLowerCase().substring(0, 255);
    const safeSubject = String(subject).substring(0, 200);
    const safeMessage = String(message).substring(0, 2000);

    try {
        // Log contact form submission (you can later integrate email service)
        console.log('[Contact Form]', {
            name: safeName,
            email: safeEmail,
            subject: safeSubject,
            message: safeMessage,
            timestamp: new Date().toISOString()
        });

        // TODO: Send email notification to admin
        // For now, just return success
        res.status(200).json({
            success: true,
            message: 'Děkujeme za vaši zprávu! Ozveme se vám co nejdříve.'
        });

    } catch (e) {
        console.error('Contact Form Error:', e);
        res.status(500).json({
            success: false,
            error: 'Omlouváme se, došlo k chybě serveru. Zkuste to prosím později.'
        });
    }
});

export default router;
