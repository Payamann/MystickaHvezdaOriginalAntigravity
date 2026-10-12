import { supabase } from '../db-supabase.js';
import { sendOperationalAlert } from './alerts.js';
import { randomUUID } from 'node:crypto';

export const DELIVERY_EVENTS = new Set(['email.sent', 'email.delivered', 'email.delivery_delayed', 'email.bounced', 'email.failed', 'email.suppressed', 'email.complained']);
const FAILURES = new Set(['email.bounced', 'email.failed', 'email.suppressed', 'email.complained']);
const RANK = { sent: 1, delivery_delayed: 2, delivered: 3, failed: 4, suppressed: 4, bounced: 4, complained: 5 };
const safeId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,200}$/.test(value);

// Derive status from immutable events, so concurrent callbacks and callbacks
// arriving before the send response cannot overwrite a more advanced state.
export function relationshipDeliveryState(order, events = []) {
    let selected = { status: order.email_id ? 'sent' : 'unknown', at: order.email_sent_at || null };
    for (const event of events) {
        if (event.email_id !== order.email_id || !DELIVERY_EVENTS.has(event.event_type)) continue;
        const status = event.event_type.slice(6);
        const rank = RANK[status];
        if (rank > (RANK[selected.status] || 0)
            || (rank === RANK[selected.status] && event.event_at > (selected.at || ''))) {
            selected = { status, at: event.event_at };
        }
    }
    return selected;
}

export function createRelationshipEmailDelivery({ db = supabase, alert = sendOperationalAlert } = {}) {
    async function recordAccepted(orderId, emailId) {
        if (!safeId(emailId)) throw new Error('Missing relationship email provider ID');
        const existing = await db.from('one_time_order_inputs').select('email_id,email_sent_at')
            .eq('id', orderId).eq('product_type', 'relationship_tarot').maybeSingle();
        if (existing.error || !existing.data) throw new Error('Could not load relationship email receipt');
        if (existing.data.email_id) {
            if (existing.data.email_id !== emailId) throw new Error('Relationship email provider ID mismatch');
        } else {
            const { data, error } = await db.from('one_time_order_inputs')
                .update({ email_id: emailId, email_sent_at: new Date().toISOString() })
                .eq('id', orderId).eq('product_type', 'relationship_tarot').select('id').maybeSingle();
            if (error || !data) throw new Error('Could not save relationship email provider ID');
        }
    }

    async function notifyFailures(emailId = null) {
        const expired = await db.from('relationship_email_events')
            .update({ alert_claim: 'idle', alert_claim_until: null })
            .eq('alert_pending', true).lt('alert_claim_until', new Date().toISOString());
        if (expired.error) throw new Error('Could not recover email alert claims');
        // Join before LIMIT. Unrelated account mail cannot starve paid-order
        // alerts, and an early event becomes visible as soon as email_id is saved.
        let query = db.from('relationship_pending_email_alerts').select('event_id,email_id,event_type,event_at,order_id')
            .order('event_at', { ascending: true }).limit(50);
        if (emailId) query = query.eq('email_id', emailId);
        const { data: events, error } = await query;
        if (error) throw new Error('Could not load relationship email alerts');
        for (const event of events || []) {
            const claim = randomUUID();
            const reserved = await db.from('relationship_email_events')
                .update({ alert_claim: claim, alert_claim_until: new Date(Date.now() + 600000).toISOString() })
                .eq('event_id', event.event_id).eq('alert_pending', true).eq('alert_claim', 'idle').select('event_id').maybeSingle();
            if (reserved.error) throw new Error('Could not reserve relationship email alert');
            if (!reserved.data) continue;
            let result;
            try { result = await alert('relationship_email_delivery_failed', {
                severity: event.event_type === 'email.complained' ? 'warning' : 'critical',
                summary: 'A paid relationship reading needs delivery support.',
                dedupeKey: `relationship_email_delivery_failed:${event.email_id}:${event.event_type}`,
                metadata: { orderId: event.order_id, deliveryState: event.event_type.slice(6) }
            }); } catch { result = { sent: false }; }
            const sent = result?.sent === true || result?.reason === 'deduped';
            const { error: saved } = await db.from('relationship_email_events')
                .update({ alert_pending: !sent, alert_claim: 'idle', alert_claim_until: null })
                .eq('event_id', event.event_id).eq('alert_claim', claim);
            if (saved) throw new Error('Could not confirm relationship email alert');
        }
    }

    async function recordEvent(event, eventId) {
        if (!DELIVERY_EVENTS.has(event?.type)) return { ignored: true };
        if (!safeId(eventId) || !safeId(event.data?.email_id) || !Number.isFinite(Date.parse(event.created_at))) {
            throw new Error('Invalid email delivery event');
        }
        // Never persist the raw body, addresses, subject or customer question.
        const { error } = await db.from('relationship_email_events').insert({
            event_id: eventId, email_id: event.data.email_id, event_type: event.type,
            event_at: new Date(event.created_at).toISOString(), alert_pending: FAILURES.has(event.type), alert_claim: 'idle'
        });
        if (error && error.code !== '23505') throw new Error('Could not save email delivery event');
        // Alert failures remain persisted and are retried by the recovery job.
        // An unavailable alert channel must not make Resend resend the email.
        try { await notifyFailures(event.data.email_id); }
        catch { console.warn('[RELATIONSHIP_EMAIL] Delivery alert remains pending'); }
        return { recorded: true, duplicate: error?.code === '23505' };
    }
    return { recordAccepted, recordEvent, notifyFailures };
}

export const relationshipEmailDelivery = createRelationshipEmailDelivery();
