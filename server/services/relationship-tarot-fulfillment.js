import { supabase } from '../db-supabase.js';
import { getOneTimeOrderInput } from './one-time-orders.js';
import { generateRelationshipReading, parseRelationshipReading } from './relationship-tarot.js';
import { sendEmail } from '../email-service.js';

export function createRelationshipFulfillment({ getOrder = getOneTimeOrderInput, generate = generateRelationshipReading, send = sendEmail, db = supabase } = {}) {
const inFlight = new Map();
// Webhook and reconciliation share the same promise on this process. A persisted
// reading and provider idempotency key also make later retries repeatable.
return async function fulfillRelationshipTarotOrder({ orderId }) {
    if (!orderId) throw new Error('Missing relationship order ID');
    if (inFlight.has(orderId)) return inFlight.get(orderId);
    const work = (async () => {
        const order = await getOrder(orderId);
        if (!order || order.product_type !== 'relationship_tarot' || !order.customer_email
            || !order.payload?.question || order.payload?.cards?.length !== 3) throw new Error('Invalid relationship order');
        if (order.status === 'fulfilled') return;
        let reading = order.payload.reading;
        if (reading) parseRelationshipReading(reading);
        else {
            reading = await generate(order.payload);
            parseRelationshipReading(reading);
            const { data, error } = await db.from('one_time_order_inputs')
                .update({ payload: { ...order.payload, reading }, updated_at: new Date().toISOString() })
                .eq('id', orderId).eq('updated_at', order.updated_at).select('id').maybeSingle();
            if (error) throw new Error('Could not save relationship reading');
            if (!data) {
                // Another worker won the optimistic write. All deliveries must use
                // that same saved content so the provider idempotency key matches.
                reading = (await getOrder(orderId))?.payload?.reading;
                parseRelationshipReading(reading);
            }
        }
        await send({ to: order.customer_email, template: 'relationship_tarot', data: { ...order.payload, reading } }, { idempotencyKey: `relationship-tarot-${orderId}` });
    })();
    inFlight.set(orderId, work);
    try { return await work; } finally { inFlight.delete(orderId); }
};
}
export const fulfillRelationshipTarotOrder = createRelationshipFulfillment();
