/**
 * GDPR opt-out: odhlásí e-mailovou adresu ze VŠECH odběrů napříč tabulkami.
 *   newsletter_subscribers (podle email)  -> is_active=false
 *   horoscope_subscriptions (podle email) -> active=false + unsubscribed_at
 *   email_preferences (podle user_id)      -> unsubscribe_all=true
 *
 * Použití (spouštět z rootu hlavního repa, kde je server/.env):
 *   node scripts/unsubscribe-email.mjs <email>            # DRY RUN — jen ukáže stav
 *   node scripts/unsubscribe-email.mjs <email> --write    # provede odhlášení
 *
 * Idempotentní. Service-role klíč obchází RLS. Produkce = LIVE data.
 */
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const email = String(process.argv[2] || '').toLowerCase().trim();
const doWrite = process.argv.includes('--write');

if (!email || !email.includes('@')) {
    console.error('Usage: node scripts/unsubscribe-email.mjs <email> [--write]');
    process.exit(1);
}

const envPath = path.join(process.cwd(), 'server', '.env');
if (!fs.existsSync(envPath)) {
    console.error(`server/.env nenalezen na ${envPath} — spusť z rootu hlavního repa.`);
    process.exit(1);
}
dotenv.config({ path: envPath });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
    console.error('Chybí SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY v server/.env');
    process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
const nowIso = new Date().toISOString();

async function main() {
    console.log(`\n=== Odhlášení: ${email} ===`);
    console.log(`Cíl DB: ${url}\nRežim: ${doWrite ? 'WRITE (provede změny)' : 'DRY RUN (jen čtení)'}\n`);

    // 1) newsletter_subscribers
    const nl = await sb.from('newsletter_subscribers').select('email, is_active').eq('email', email);
    if (nl.error) throw new Error(`newsletter_subscribers read: ${nl.error.message}`);
    const nlRows = nl.data || [];
    console.log(`newsletter_subscribers: ${nlRows.length} záznam(ů)` +
        (nlRows.length ? ` (is_active: ${nlRows.map((r) => r.is_active).join(', ')})` : ''));

    // 2) horoscope_subscriptions
    const hs = await sb.from('horoscope_subscriptions').select('email, active, zodiac_sign').eq('email', email);
    if (hs.error) throw new Error(`horoscope_subscriptions read: ${hs.error.message}`);
    const hsRows = hs.data || [];
    console.log(`horoscope_subscriptions: ${hsRows.length} záznam(ů)` +
        (hsRows.length ? ` (active: ${hsRows.map((r) => r.active).join(', ')}, znamení: ${hsRows.map((r) => r.zodiac_sign).join(', ')})` : ''));

    // 3) users -> email_preferences
    const usr = await sb.from('users').select('id, email').eq('email', email).maybeSingle();
    if (usr.error && usr.error.code !== 'PGRST116') throw new Error(`users read: ${usr.error.message}`);
    const userId = usr.data?.id || null;
    let prefUnsub = null;
    if (userId) {
        const pref = await sb.from('email_preferences').select('user_id, unsubscribe_all').eq('user_id', userId).maybeSingle();
        if (pref.error && pref.error.code !== 'PGRST116') throw new Error(`email_preferences read: ${pref.error.message}`);
        prefUnsub = pref.data?.unsubscribe_all ?? null;
    }
    console.log(`uživatelský účet: ${userId ? `ano (unsubscribe_all: ${prefUnsub})` : 'ne (jen e-mailové odběry)'}\n`);

    if (!doWrite) {
        console.log('DRY RUN — nic se nezměnilo. Pro odhlášení přidej --write.');
        return;
    }

    // WRITE
    const done = [];
    if (nlRows.length) {
        const r = await sb.from('newsletter_subscribers').update({ is_active: false }).eq('email', email);
        if (r.error) throw new Error(`newsletter update: ${r.error.message}`);
        done.push('newsletter_subscribers → is_active=false');
    }
    if (hsRows.length) {
        const r = await sb.from('horoscope_subscriptions').update({ active: false, unsubscribed_at: nowIso }).eq('email', email);
        if (r.error) throw new Error(`horoscope update: ${r.error.message}`);
        done.push('horoscope_subscriptions → active=false');
    }
    if (userId) {
        const r = await sb.from('email_preferences')
            .upsert({ user_id: userId, unsubscribe_all: true, updated_at: nowIso }, { onConflict: 'user_id' });
        if (r.error) throw new Error(`email_preferences upsert: ${r.error.message}`);
        done.push('email_preferences → unsubscribe_all=true');
    }

    console.log(done.length ? `✓ Odhlášeno:\n  - ${done.join('\n  - ')}` : '✓ Adresa nebyla nikde přihlášena — není co odhlašovat.');
}

main().catch((err) => { console.error('CHYBA:', err.message); process.exit(1); });
