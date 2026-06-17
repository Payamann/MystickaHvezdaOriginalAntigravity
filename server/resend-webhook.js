import { Resend } from 'resend';

const DEFAULT_FORWARD_FROM = 'Mysticka Hvezda <noreply@mystickahvezda.cz>';
const SAME_DOMAIN_FORWARD_ALLOWED = process.env.ALLOW_SAME_DOMAIN_SUPPORT_FORWARD === 'true';

let resend = null;

function getResend() {
    if (!resend) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is required for Resend webhooks');
        }
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

function getHeader(headers = {}, name) {
    return headers[name] || headers[name.toLowerCase()] || headers[name.toUpperCase()] || '';
}

function parseAddressList(value) {
    const values = Array.isArray(value) ? value : String(value || '').split(',');
    return values
        .map((item) => String(item || '').trim())
        .filter(Boolean);
}

function extractEmailAddress(value) {
    const match = String(value || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return match ? match[0].toLowerCase() : '';
}

function normalizeEmailList(value) {
    return parseAddressList(value)
        .map(extractEmailAddress)
        .filter(Boolean);
}

function unique(values) {
    return [...new Set(values.filter(Boolean))];
}

export function getInboundForwardRecipients(originalTo = []) {
    const configured = [
        process.env.SUPPORT_FORWARD_EMAIL,
        process.env.ADMIN_EMAIL,
        process.env.ADMIN_EMAILS
    ].filter(Boolean).join(',');

    const recipients = unique(normalizeEmailList(configured));
    const originalRecipients = new Set(normalizeEmailList(originalTo));

    return recipients.filter((email) => {
        if (originalRecipients.has(email)) return false;
        if (!SAME_DOMAIN_FORWARD_ALLOWED && email.endsWith('@mystickahvezda.cz')) return false;
        return true;
    });
}

function getForwardFrom() {
    return process.env.INBOUND_FORWARD_FROM ||
        process.env.FROM_EMAIL ||
        DEFAULT_FORWARD_FROM;
}

export async function handleResendWebhook(rawBody, headers = {}) {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
        throw new Error('RESEND_WEBHOOK_SECRET is required for Resend inbound email webhooks');
    }

    const payload = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody || '');
    const event = getResend().webhooks.verify({
        payload,
        headers: {
            id: getHeader(headers, 'svix-id'),
            timestamp: getHeader(headers, 'svix-timestamp'),
            signature: getHeader(headers, 'svix-signature')
        },
        webhookSecret
    });

    if (event.type !== 'email.received') {
        return {
            ignored: true,
            type: event.type
        };
    }

    const emailId = event.data?.email_id || event.data?.id || '';
    if (!emailId) {
        throw new Error('Resend email.received webhook is missing data.email_id');
    }

    const to = getInboundForwardRecipients(event.data?.to || []);
    if (!to.length) {
        throw new Error('SUPPORT_FORWARD_EMAIL or ADMIN_EMAIL must point to a real external support inbox');
    }

    const response = await getResend().emails.receiving.forward({
        emailId,
        to,
        from: getForwardFrom(),
        passthrough: true
    });

    if (response.error) {
        throw response.error;
    }

    return {
        forwarded: true,
        emailId,
        forwardId: response.data?.id || null,
        to
    };
}
