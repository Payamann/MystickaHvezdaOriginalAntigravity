import { supabase } from '../db-supabase.js';
import { calculateMoonPhase } from '../services/astrology.js';
import { SEND_WINDOW_TIME_ZONE } from '../utils/send-window.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * WEEKLY NEWSLETTER DIGEST ("Hvězdný týden")
 * Assembles a deterministic weekly digest from existing content (moon
 * phase, latest blog post, rotating tool tip) and enqueues it for all
 * active newsletter subscribers. Sending exactly once per ISO week is
 * guaranteed by the email queue's dedupeKey, so catch-up runs after
 * restarts or downtime are always safe.
 */

const SUBSCRIBER_PAGE_SIZE = 500;

// Rotating weekly tool tips — deterministic by ISO week number.
const WEEKLY_TOOL_TIPS = [
    {
        title: 'Tarot ANO / NE',
        text: 'Máš před sebou rozhodnutí? Polož jednu konkrétní otázku a vytáhni kartu s rychlou odpovědí.',
        url: '/tarot-ano-ne.html?source=newsletter_digest&feature=tarot_yes_no&utm_source=email&utm_campaign=weekly_digest'
    },
    {
        title: 'Tarot karta dne',
        text: 'Jeden symbol na dnešek. Vytáhni si kartu dne a nech ji projít celým dnem.',
        url: '/tarot-karta-dne.html?source=newsletter_digest&feature=tarot_karta_dne&utm_source=email&utm_campaign=weekly_digest'
    },
    {
        title: 'Číslo osudu',
        text: 'Spočítej si za pár vteřin své životní číslo — a přečti si, co o tobě říká.',
        url: '/kalkulacka-cisla-osudu.html?source=newsletter_digest&feature=numerologie_vyklad&utm_source=email&utm_campaign=weekly_digest'
    },
    {
        title: 'Andělská karta dne',
        text: 'Jemné poselství na dnešek. Vytáhni si andělskou kartu zdarma.',
        url: '/andelske-karty.html?source=newsletter_digest&feature=daily_angel_card&utm_source=email&utm_campaign=weekly_digest'
    },
    {
        title: 'Partnerská shoda',
        text: 'Zadej dvě data narození a zjisti, jak si s protějškem sedíte podle hvězd.',
        url: '/partnerska-shoda.html?source=newsletter_digest&feature=partnerska_detail&utm_source=email&utm_campaign=weekly_digest'
    },
    {
        title: 'Runa dne',
        text: 'Prastarý symbol severu na tvůj týden. Vytáhni si runu zdarma.',
        url: '/runy.html?source=newsletter_digest&feature=runy_hluboky_vyklad&utm_source=email&utm_campaign=weekly_digest'
    },
    {
        title: 'Snář',
        text: 'Zdál se ti výrazný sen? Vyhledej jeho symbol ve snáři se 164 výklady.',
        url: '/snar.html?source=newsletter_digest&feature=snar_vyklad&utm_source=email&utm_campaign=weekly_digest'
    },
    {
        title: 'Lunární kalendář',
        text: 'Sleduj fáze Měsíce a plánuj podle nich — kdy začínat, kdy dokončovat, kdy odpočívat.',
        url: '/lunace.html?source=newsletter_digest&feature=lunarni_kalendar&utm_source=email&utm_campaign=weekly_digest'
    }
];

// Rotating premium spotlight — the digest otherwise only promotes free
// tools, so paid one-time products get one soft-promo slot per week,
// alternating deterministically by ISO week.
const PREMIUM_SPOTLIGHTS = [
    {
        title: 'Osobní mapa',
        text: '20 stran osobního výkladu pro tvoje znamení, téma a aktuální období. Ne obecný horoskop — mapa, ke které se vracíš.',
        price: '299 Kč · jednorázově · PDF do e-mailu',
        url: '/osobni-mapa.html?source=newsletter_digest&feature=osobni_mapa_2026&utm_source=email&utm_campaign=weekly_digest'
    },
    {
        title: 'Roční horoskop na míru 2026',
        text: 'Personalizovaný roční výklad pro tvoje datum narození — láska, kariéra, klíčové měsíce a slovo pro tento rok.',
        price: '199 Kč · jednorázově · PDF do e-mailu',
        url: '/rocni-horoskop.html?source=newsletter_digest&feature=rocni_horoskop_2026&utm_source=email&utm_campaign=weekly_digest'
    }
];

let weeklyNewsletterJobRunning = false;
let cachedBlogIndex = null;

export function getIsoWeekKey(date = new Date()) {
    // ISO week computed on the Prague calendar date.
    const pragueDateString = new Intl.DateTimeFormat('en-CA', {
        timeZone: SEND_WINDOW_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
    const d = new Date(`${pragueDateString}T00:00:00Z`);
    const dayNumber = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNumber);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function getWeeklyToolTip(date = new Date()) {
    const weekNumber = Number(getIsoWeekKey(date).split('-W')[1]) || 0;
    return WEEKLY_TOOL_TIPS[weekNumber % WEEKLY_TOOL_TIPS.length];
}

export function getWeeklyPremiumSpotlight(date = new Date()) {
    const weekNumber = Number(getIsoWeekKey(date).split('-W')[1]) || 0;
    return PREMIUM_SPOTLIGHTS[weekNumber % PREMIUM_SPOTLIGHTS.length];
}

function loadBlogIndex() {
    if (cachedBlogIndex) return cachedBlogIndex;
    try {
        const raw = fs.readFileSync(path.join(__dirname, '../../data/blog-index.json'), 'utf8');
        const parsed = JSON.parse(raw);
        cachedBlogIndex = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('[WeeklyNewsletter] Could not load blog index:', error.message);
        cachedBlogIndex = [];
    }
    return cachedBlogIndex;
}

export function getLatestBlogPost(now = new Date(), blogIndex = loadBlogIndex()) {
    const published = blogIndex
        .filter((post) => post?.slug && post?.title)
        .filter((post) => {
            const publishedAt = new Date(post.published_at || 0);
            return !Number.isNaN(publishedAt.getTime()) && publishedAt <= now;
        })
        .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

    return published[0] || null;
}

export function buildWeeklyDigestContent(now = new Date()) {
    const dateLabel = now.toLocaleDateString('cs-CZ', {
        day: 'numeric',
        month: 'long',
        timeZone: SEND_WINDOW_TIME_ZONE
    });

    let moonPhase = '';
    try {
        moonPhase = calculateMoonPhase(now);
    } catch (error) {
        console.warn('[WeeklyNewsletter] Moon phase unavailable:', error.message);
    }

    const blogPost = getLatestBlogPost(now);
    const toolTip = getWeeklyToolTip(now);
    const premium = getWeeklyPremiumSpotlight(now);

    return {
        week_key: getIsoWeekKey(now),
        date_label: dateLabel,
        moon_phase: moonPhase,
        blog_title: blogPost?.title || null,
        blog_description: blogPost?.short_description || null,
        blog_url: blogPost ? `/blog/${blogPost.slug}.html?utm_source=email&utm_campaign=weekly_digest` : null,
        tip_title: toolTip.title,
        tip_text: toolTip.text,
        tip_url: toolTip.url,
        premium_title: premium.title,
        premium_text: premium.text,
        premium_price: premium.price,
        premium_url: premium.url
    };
}

async function fetchActiveSubscribers() {
    const subscribers = [];

    for (let from = 0; ; from += SUBSCRIBER_PAGE_SIZE) {
        const { data, error } = await supabase
            .from('newsletter_subscribers')
            .select('email, is_active')
            .order('created_at', { ascending: true })
            .range(from, from + SUBSCRIBER_PAGE_SIZE - 1);

        if (error) {
            throw new Error(`Failed to fetch newsletter subscribers: ${error.message}`);
        }

        subscribers.push(...(data || []));
        if (!data || data.length < SUBSCRIBER_PAGE_SIZE) break;
    }

    return subscribers.filter((subscriber) => subscriber.is_active !== false && subscriber.email);
}

export async function run(options = {}) {
    if (weeklyNewsletterJobRunning) {
        console.warn('[WeeklyNewsletter] Skipped because a run is already active.');
        return { scheduled: 0, skipped: 0 };
    }

    weeklyNewsletterJobRunning = true;
    try {
        const now = options.now instanceof Date ? options.now : new Date();
        const content = buildWeeklyDigestContent(now);

        const [{ scheduleEmailLater }, { buildNewsletterUnsubscribePath }] = await Promise.all([
            import('./email-queue.js'),
            import('../newsletter.js')
        ]);

        const subscribers = await fetchActiveSubscribers();
        if (subscribers.length === 0) {
            console.log('[WeeklyNewsletter] No active subscribers.');
            return { scheduled: 0, skipped: 0 };
        }

        let scheduled = 0, skipped = 0;
        for (const subscriber of subscribers) {
            const email = subscriber.email.toLowerCase().trim();
            try {
                const result = await scheduleEmailLater({
                    email,
                    template: 'newsletter_weekly_digest',
                    data: {
                        ...content,
                        unsubscribe_url: buildNewsletterUnsubscribePath(email)
                    },
                    delaySeconds: 0,
                    dedupeKey: `newsletter_digest:${email}:${content.week_key}`
                });
                if (result.skipped) skipped++;
                else scheduled++;
            } catch (error) {
                console.error(`[WeeklyNewsletter] Failed to enqueue for ${email}:`, error.message);
            }
        }

        console.log(`[WeeklyNewsletter] ${content.week_key}: scheduled ${scheduled}, deduped ${skipped}.`);
        return { scheduled, skipped };
    } finally {
        weeklyNewsletterJobRunning = false;
    }
}
