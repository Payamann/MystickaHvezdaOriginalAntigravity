import { randomUUID } from 'node:crypto';
import { supabase } from '../db-supabase.js';
import { getOneTimeOrderInput } from './one-time-orders.js';
import { sendOperationalAlert } from './alerts.js';

// Resend retains keys for 24h. Stop earlier rather than risk a second email
// after an ambiguous response or a failed receipt write.
const SAFE_SEND_RETRY_MS = 23 * 60 * 60 * 1000;

export function createPersonalMapFulfillment({
    db = supabase, getOrder = getOneTimeOrderInput,
    generate = async input => (await import('./personal-map-pdf.js')).generatePersonalMapContent(input),
    render = async input => (await import('./personal-map-pdf.js')).renderPersonalMapPdf(input),
    prepareEmail = async input => (await import('../email-service.js')).buildPersonalMapEmailPayload(input),
    send = async (input, options) => (await import('../email-service.js')).sendPersonalMapPdf(input, options),
    alert = sendOperationalAlert, now = () => Date.now()
} = {}) {
    const inFlight = new Map();

    async function save(order, fulfillment) {
        // A JSON revision keeps the CAS filter small even with the PDF saved.
        // Retry bookkeeping can independently change updated_at.
        const updatedAt = new Date(now()).toISOString();
        fulfillment = { ...fulfillment, revision: randomUUID() };
        let query = db.from('one_time_order_inputs').update({
            payload: { ...order.payload, personalMapFulfillment: fulfillment }, updated_at: updatedAt
        }).eq('id', order.id);
        const revision = order.payload.personalMapFulfillment?.revision;
        query = revision
            ? query.eq('payload->personalMapFulfillment->>revision', revision)
            : query.is('payload->personalMapFulfillment->>revision', null);
        const { data, error } = await query.select('id').maybeSingle();
        if (error || !data) throw new Error('Personal map state could not be saved; retry from stored order');
        return { ...order, updated_at: updatedAt, payload: { ...order.payload, personalMapFulfillment: fulfillment } };
    }

    async function manualReview(order, reason) {
        await alert('personal_map_manual_review', {
            severity: 'critical', summary: reason,
            dedupeKey: `personal_map_manual_review:${order.id}`,
            metadata: { orderId: order.id }
        }).catch(() => {});
        throw new Error(reason);
    }

    return async function fulfillPersonalMapOrder({ orderId }) {
        if (!orderId) throw new Error('Missing personal map order ID');
        if (inFlight.has(orderId)) return inFlight.get(orderId);
        const work = (async () => {
            let order = await getOrder(orderId);
            if (!order || order.product_type !== 'personal_map' || !order.customer_email
                || !order.customer_name || !order.payload?.birthDate || !order.payload?.sign || !order.payload?.focus) {
                throw new Error('Invalid durable personal map order');
            }
            if (order.status === 'fulfilled' || order.email_id) return { emailId: order.email_id };
            let saved = order.payload.personalMapFulfillment;
            if (!saved) {
                // Old code could send successfully without recording any attempt.
                // Absence of retry_count is therefore not proof of an unsent order.
                return manualReview(order, 'Legacy personal map lacks delivery evidence; verify provider before recovery');
            }
            if (saved?.state === 'generating') {
                // No lease takeover can prove the previous paid model result was
                // not produced. Avoid silent regeneration after a process crash.
                if (now() - Date.parse(saved.startedAt) < 20 * 60 * 1000) throw new Error('Personal map generation already in progress');
                return manualReview(order, 'Personal map generation interrupted; inspect stored state before recovery');
            }
            const input = {
                ...order.payload, name: order.customer_name,
                year: Number(order.payload.productYear) || new Date(now()).getFullYear(),
                periodStart: order.payload.productPeriodStart, periodEnd: order.payload.productPeriodEnd,
                productName: 'Osobní mapa na 12 měsíců'
            };
            if (saved.version === 1 && saved.state === 'pending') {
                order = await save(order, { version: 1, state: 'generating', startedAt: new Date(now()).toISOString() });
                let sections;
                try { sections = await generate(input); }
                catch (error) {
                    // A definite generation failure may be attempted again. A
                    // successful result followed by a DB failure keeps its claim.
                    await save(order, { version: 1, state: 'pending' });
                    throw error;
                }
                order = await save(order, { version: 1, state: 'generated', sections });
                saved = order.payload.personalMapFulfillment;
            }
            if (saved.version !== 1 || !['generated', 'ready', 'sending'].includes(saved.state) || !saved.sections) {
                return manualReview(order, 'Personal map stored result is invalid; manual recovery required');
            }
            if (saved.state === 'generated') {
                const pdfBuffer = await render({ ...input, sections: saved.sections });
                const emailPayload = await prepareEmail({
                    to: order.customer_email, name: order.customer_name, sign: input.sign, pdfBuffer,
                    periodStart: input.periodStart, periodEnd: input.periodEnd
                });
                // Save the exact provider request, including attachment bytes,
                // before any send. Future template/date changes cannot alter it.
                order = await save(order, { ...saved, state: 'ready', emailPayload });
                saved = order.payload.personalMapFulfillment;
            }
            if (!saved.emailPayload?.attachments?.[0]?.content) {
                return manualReview(order, 'Personal map saved attachment missing; manual recovery required');
            }
            if (saved.state === 'ready') {
                order = await save(order, { ...saved, state: 'sending', sendStartedAt: new Date(now()).toISOString() });
                saved = order.payload.personalMapFulfillment;
            }
            const age = now() - Date.parse(saved.sendStartedAt);
            if (!Number.isFinite(age) || age < 0 || age >= SAFE_SEND_RETRY_MS) {
                return manualReview(order, 'Personal map email acceptance unknown beyond safe retry window; check provider before resending');
            }
            const result = await send({}, { preparedPayload: saved.emailPayload, idempotencyKey: `personal-map-${orderId}` });
            if (!result?.id) throw new Error('Personal map provider receipt missing; retry with same idempotency key');
            const { data, error } = await db.from('one_time_order_inputs').update({
                email_id: result.id, email_sent_at: new Date(now()).toISOString()
            }).eq('id', orderId).select('id').maybeSingle();
            if (error || !data) {
                throw new Error('Personal map accepted by provider but receipt write failed; retry with same idempotency key');
            }
            return { emailId: result.id };
        })();
        inFlight.set(orderId, work);
        try { return await work; } finally { inFlight.delete(orderId); }
    };
}

export const fulfillPersonalMapOrder = createPersonalMapFulfillment();
