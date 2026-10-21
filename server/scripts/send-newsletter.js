/**
 * Email newsletter service using Resend
 * Usage:
 *   node server/scripts/send-newsletter.js        # dry run
 *   node server/scripts/send-newsletter.js --send # send to active subscribers
 *
 * Setup:
 * 1. npm install resend
 * 2. Add RESEND_API_KEY=re_... to server/.env
 * 3. Add FROM_EMAIL=newsletter@mystickahvezda.cz to server/.env
 * 4. Verify domain in Resend dashboard
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

// ── Config ──────────────────────────────────────────────────────────────────
const FROM = process.env.FROM_EMAIL || 'Mystická Hvězda <newsletter@mystickahvezda.cz>';
const DOMAIN = 'https://www.mystickahvezda.cz';
const BATCH_SIZE = 50; // Resend free tier limit per request
const SHOULD_SEND = process.argv.includes('--send');

// ── Email HTML template ──────────────────────────────────────────────────────
function buildEmailHtml({ subject, preheader, headline, body, ctaText, ctaUrl }) {
    return `<!DOCTYPE html>
<html lang="cs" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0b1929;font-family:'Helvetica Neue',Arial,sans-serif;color:#e9e3d7;">
<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#0b1929" style="background:#0b1929;">
  <tr><td align="center" bgcolor="#0b1929" style="padding:40px 20px;background:#0b1929;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      
      <!-- Header -->
      <tr><td bgcolor="#173348" style="background:linear-gradient(135deg,#173348,#102638);border-radius:12px 12px 0 0;padding:40px 40px 30px;text-align:center;border-bottom:1px solid rgba(208,177,124,0.24);">
        <div style="font-family:Georgia,serif;font-size:1.5rem;color:#e1cba5;font-weight:bold;letter-spacing:1px;">Mystická Hvězda</div>
        <div style="font-size:0.8rem;color:rgba(233,227,215,0.68);margin-top:4px;letter-spacing:2px;text-transform:uppercase;">Chvíle pro vlastní otázku</div>
      </td></tr>
      
      <!-- Body -->
      <tr><td bgcolor="#102638" style="background:#102638;padding:40px;color:#e9e3d7;">
        <div style="font-size:0.75rem;color:#d0b17c;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Týdenní inspirace</div>
        <h1 style="font-family:Georgia,serif;font-size:1.8rem;color:#e9e3d7;margin:0 0 20px;line-height:1.3;">${headline}</h1>
        <div style="color:rgba(233,227,215,0.86);line-height:1.8;font-size:0.95rem;">${body}</div>
        
        <!-- CTA -->
        <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:32px auto;">
          <tr><td align="center" bgcolor="#bd9b65" style="background:#bd9b65;border-radius:4px;">
            <a href="${ctaUrl}" style="display:inline-block;color:#142032;text-decoration:none;padding:14px 32px;border-radius:4px;font-weight:bold;font-size:0.95rem;">${ctaText}</a>
          </td></tr>
        </table>

        <!-- Quick links -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#153149" style="background:#153149;border:1px solid rgba(208,177,124,0.18);border-radius:4px;margin-top:16px;">
          <tr><td style="padding:20px;">
          <div style="color:#c3c9cb;font-size:0.8rem;margin-bottom:12px;text-align:center;">Další nástroje</div>
          <table role="presentation" width="100%" cellpadding="4" cellspacing="0">
            <tr>
              <td width="50%" align="center"><a href="${DOMAIN}/tarot.html" style="display:block;color:#d0b17c;text-decoration:none;font-size:0.85rem;background:rgba(208,177,124,0.08);padding:8px 6px;border-radius:4px;border:1px solid rgba(208,177,124,0.24);">Tarot</a></td>
              <td width="50%" align="center"><a href="${DOMAIN}/horoskopy.html" style="display:block;color:#d0b17c;text-decoration:none;font-size:0.85rem;background:rgba(208,177,124,0.08);padding:8px 6px;border-radius:4px;border:1px solid rgba(208,177,124,0.24);">Horoskopy</a></td>
            </tr>
            <tr>
              <td width="50%" align="center"><a href="${DOMAIN}/lunace.html" style="display:block;color:#d0b17c;text-decoration:none;font-size:0.85rem;background:rgba(208,177,124,0.08);padding:8px 6px;border-radius:4px;border:1px solid rgba(208,177,124,0.24);">Lunární kalendář</a></td>
              <td width="50%" align="center"><a href="${DOMAIN}/kristalova-koule.html" style="display:block;color:#d0b17c;text-decoration:none;font-size:0.85rem;background:rgba(208,177,124,0.08);padding:8px 6px;border-radius:4px;border:1px solid rgba(208,177,124,0.24);">Křišťálová koule</a></td>
            </tr>
          </table>
          </td></tr>
        </table>
      </td></tr>
      
      <!-- Footer -->
      <tr><td bgcolor="#0b1929" style="background:#0b1929;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;border-top:1px solid rgba(233,227,215,0.08);">
        <p style="color:#c3c9cb;font-size:0.75rem;margin:0 0 8px;">Mystická Hvězda • ${DOMAIN}</p>
        <p style="color:rgba(195,201,203,0.72);font-size:0.72rem;margin:0;">
          Tento e-mail dostáváš, protože ses přihlásil k odběru novinek.
          <a href="${DOMAIN}/api/newsletter/unsubscribe?email={{EMAIL}}" style="color:#d0b17c;text-decoration:underline;">Odhlásit se</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Send newsletter ──────────────────────────────────────────────────────────
async function sendNewsletter(newsletterData) {
    let Resend;
    try {
        Resend = (await import('resend')).Resend;
    } catch {
        console.error('❌ Resend není nainstalován. Spusťte: npm install resend');
        process.exit(1);
    }

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ Chybí RESEND_API_KEY v .env souboru.');
        console.log('  1. Registrujte se na https://resend.com (zdarma)');
        console.log('  2. Přidejte API klíč do server/.env jako: RESEND_API_KEY=re_...');
        process.exit(1);
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Load subscribers from Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: subscribers, error } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .eq('is_active', true)
        .limit(10000);

    if (error) {
        console.error('❌ Chyba načítání odběratelů:', error.message);
        process.exit(1);
    }

    console.log(`📧 Odesílám newsletter ${subscribers.length} odběratelům...`);

    const html = buildEmailHtml(newsletterData);

    let sent = 0, failed = 0;

    // Send in batches
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
        const batch = subscribers.slice(i, i + BATCH_SIZE);
        for (const sub of batch) {
            try {
                await resend.emails.send({
                    from: FROM,
                    to: sub.email,
                    subject: newsletterData.subject,
                    html: html.replace('{{EMAIL}}', encodeURIComponent(sub.email))
                });
                sent++;
            } catch (err) {
                console.warn(`  ⚠️ Chyba pro ${sub.email}: ${err.message}`);
                failed++;
            }
        }
        // Small delay between batches
        await new Promise(r => setTimeout(r, 500));
        console.log(`  Odesláno: ${Math.min(i + BATCH_SIZE, subscribers.length)}/${subscribers.length}`);
    }

    console.log(`\n✅ Newsletter odeslán:`);
    console.log(`  Úspěšně: ${sent}`);
    console.log(`  Chyby: ${failed}`);
}

// ── Example newsletter content ──────────────────────────────────────────────
const defaultNewsletter = {
    subject: 'Týdenní podnět: co víš a co si domýšlíš',
    preheader: 'Krátká otázka, která může pomoct zpřesnit další krok.',
    headline: 'Mezi faktem a domněnkou',
    body: `<p>Když se před rozhodnutím v hlavě kupí několik možností, zkus je na chvíli oddělit. Do první kolonky napiš, co víš jistě. Do druhé, co si zatím jen domýšlíš.</p>
    <p><strong>Malý krok:</strong></p>
    <ul style="padding-left:1.2rem;">
      <li style="margin-bottom:8px;">Vyber jednu domněnku a napiš si otázku nebo informaci, která by ji mohla ověřit.</li>
      <li style="margin-bottom:8px;">Rozhodni, který další krok je vratný a skutečně v tvých možnostech.</li>
      <li>Pokud odpověď teď nemáš, nech otázku otevřenou a vrať se k ní později.</li>
    </ul>
    <p style="margin-top:16px;">Symbolický výklad může nabídnout další otázku k zamyšlení, ale nerozhoduje za tebe.</p>`,
    ctaText: 'Položit otázku v Tarotu ANO / NE →',
    ctaUrl: `${DOMAIN}/tarot-ano-ne.html?source=manual_newsletter&feature=tarot_yes_no`
};

if (SHOULD_SEND) {
    await sendNewsletter(defaultNewsletter);
} else {
    const html = buildEmailHtml(defaultNewsletter);
    console.log('[DRY RUN] Newsletter nebyl odeslán.');
    console.log(`[DRY RUN] Subject: ${defaultNewsletter.subject}`);
    console.log(`[DRY RUN] HTML size: ${(html.length / 1024).toFixed(1)} KB`);
    console.log('[DRY RUN] Pro skutečné odeslání spusťte: node server/scripts/send-newsletter.js --send');
}
