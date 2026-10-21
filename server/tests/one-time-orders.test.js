import { randomUUID } from 'node:crypto';
import { supabase } from '../db-supabase.js';
import {
    attachStripeSessionToOrderInput,
    createOneTimeOrderInput,
    createIdempotentPersonalMapOrderInput,
    createIdempotentRelationshipTarotOrderInput,
    getOneTimeOrderInput,
    listRecentLegacyOneTimeOrderInputs,
    markOneTimeOrderInputFulfilled,
    sanitizeOneTimePurchaseMetadata
} from '../services/one-time-orders.js';

describe('One-time order inputs', () => {
    test('sanitizeOneTimePurchaseMetadata keeps only non-sensitive Stripe metadata keys', () => {
        const sanitized = sanitizeOneTimePurchaseMetadata({
            productType: 'rocni_horoskop',
            productId: 'rocni_horoskop_2026',
            productYear: '2026',
            orderId: 'order-123',
            source: 'pricing',
            price: '19900',
            currency: 'czk',
            email: 'test@example.com',
            customerName: 'Test User',
            birthDate: '1990-01-01',
            sign: 'beran'
        });

        expect(sanitized).toEqual({
            productType: 'rocni_horoskop',
            productId: 'rocni_horoskop_2026',
            productYear: '2026',
            orderId: 'order-123',
            source: 'pricing',
            price: '19900',
            currency: 'czk'
        });
    });

    test('one-time sensitive inputs are stored separately and can be fulfilled', async () => {
        const order = await createOneTimeOrderInput({
            productType: 'personal_map',
            productId: 'osobni_mapa_2026',
            customerEmail: 'Test@Example.com',
            customerName: 'Test User',
            payload: {
                birthDate: '1990-01-01',
                birthTime: '12:30',
                birthPlace: 'Praha',
                ignored: null
            }
        });

        expect(order.id).toBeTruthy();
        await expect(attachStripeSessionToOrderInput(order.id, 'cs_test_123')).resolves.toBe(true);

        const loaded = await getOneTimeOrderInput(order.id);
        expect(loaded).toMatchObject({
            id: order.id,
            product_type: 'personal_map',
            product_id: 'osobni_mapa_2026',
            customer_email: 'test@example.com',
            customer_name: 'Test User',
            status: 'checkout_created',
            payload: {
                birthDate: '1990-01-01',
                birthTime: '12:30',
                birthPlace: 'Praha'
            }
        });

        await expect(markOneTimeOrderInputFulfilled(order.id)).resolves.toBe(true);
        await expect(getOneTimeOrderInput(order.id)).resolves.toMatchObject({
            id: order.id,
            status: 'fulfilled'
        });
    });

    test('personal-map checkout retries reuse the same private order and reject changed details', async () => {
        const flowId = `pm_${randomUUID().replace(/-/g, '')}`;
        const requestHash = 'a'.repeat(64);
        const input = {
            flowId,
            requestHash,
            productType: 'personal_map',
            productId: 'osobni_mapa_2026',
            customerEmail: 'Map@example.com',
            customerName: 'Testovací Osoba',
            payload: {
                birthDate: '1990-01-01',
                checkoutReturnProof: 'b'.repeat(64)
            }
        };

        const first = await createIdempotentPersonalMapOrderInput(input);
        const retry = await createIdempotentPersonalMapOrderInput({
            ...input,
            payload: { ...input.payload, checkoutReturnProof: 'c'.repeat(64) }
        });

        expect(retry.id).toBe(first.id);
        await expect(getOneTimeOrderInput(first.id)).resolves.toMatchObject({
            customer_email: 'map@example.com',
            payload: {
                flowId,
                checkoutInputHash: requestHash,
                checkoutReturnProof: 'b'.repeat(64)
            }
        });
        await expect(createIdempotentPersonalMapOrderInput({
            ...input,
            requestHash: 'd'.repeat(64)
        })).rejects.toMatchObject({ code: 'PERSONAL_MAP_FLOW_CONFLICT' });
    });

    test('legacy personal-map checkout flow prevents a second private order', async () => {
        const flowId = `old_pm_${randomUUID().replace(/-/g, '')}`;
        const legacy = await createOneTimeOrderInput({
            productType: 'personal_map',
            productId: 'osobni_mapa_2026',
            customerEmail: 'map@example.com',
            customerName: 'Testovací Osoba',
            payload: { flowId, birthDate: '1990-01-01' }
        });

        await expect(createIdempotentPersonalMapOrderInput({
            flowId,
            requestHash: '3'.repeat(64),
            productType: 'personal_map',
            productId: 'osobni_mapa_2026',
            customerEmail: 'map@example.com',
            customerName: 'Testovací Osoba',
            payload: { flowId, birthDate: '1990-01-01', checkoutReturnProof: '4'.repeat(64) }
        })).rejects.toMatchObject({ code: 'PERSONAL_MAP_FLOW_CONFLICT' });

        await expect(getOneTimeOrderInput(legacy.id)).resolves.toMatchObject({
            id: legacy.id,
            payload: { flowId }
        });
        const { data } = await supabase.from('one_time_order_inputs').select('id')
            .eq('product_type', 'personal_map')
            .eq('product_id', 'osobni_mapa_2026')
            .eq('payload->>flowId', flowId);
        expect(data).toHaveLength(1);
    });

    test('legacy personal-map lookup includes checkout attempts before Stripe session attachment', async () => {
        const createdAt = new Date().toISOString();
        const legacy = await createOneTimeOrderInput({
            productType: 'personal_map',
            productId: 'osobni_mapa_2026',
            customerEmail: 'legacy@example.com',
            customerName: 'Legacy User',
            payload: { birthDate: '1990-01-01' }
        });
        const expired = await createOneTimeOrderInput({
            productType: 'personal_map',
            productId: 'osobni_mapa_2026',
            customerEmail: 'legacy@example.com',
            customerName: 'Legacy User',
            payload: { birthDate: '1990-01-02' }
        });
        await supabase.from('one_time_order_inputs').update({ created_at: createdAt }).eq('id', legacy.id);
        await supabase.from('one_time_order_inputs').update({ created_at: createdAt }).eq('id', expired.id);
        await supabase.from('one_time_order_inputs').update({ status: 'expired' }).eq('id', expired.id);

        const found = await listRecentLegacyOneTimeOrderInputs({
            productType: 'personal_map',
            productId: 'osobni_mapa_2026',
            customerEmail: 'LEGACY@example.com',
            createdAfter: new Date(Date.now() - 60_000).toISOString()
        });

        expect(found.map(order => order.id)).toEqual([legacy.id]);
        expect(found[0].stripe_session_id).toBeUndefined();
    });

    test('legacy personal-map attempt limit ignores modern flow-ID orders', async () => {
        const suffix = randomUUID().replace(/-/g, '');
        const customerEmail = `many_${suffix}@example.com`;
        const orders = await Promise.all(Array.from({ length: 21 }, (_, index) => {
            const flowId = `pm_${suffix}_${index}`;
            return createIdempotentPersonalMapOrderInput({
                flowId,
                requestHash: '7'.repeat(64),
                productType: 'personal_map',
                productId: 'osobni_mapa_2026',
                customerEmail,
                customerName: 'Modern User',
                payload: { flowId, birthDate: '1990-01-01' }
            });
        }));

        const found = await listRecentLegacyOneTimeOrderInputs({
            productType: 'personal_map',
            productId: 'osobni_mapa_2026',
            customerEmail,
            createdAfter: new Date(Date.now() - 60_000).toISOString()
        });

        expect(orders).toHaveLength(21);
        expect(found).toEqual([]);
    });

    test('relationship-tarot checkout retries reuse the same private order and reject changed details', async () => {
        const flowId = `rt_${randomUUID().replace(/-/g, '')}`;
        const requestHash = 'e'.repeat(64);
        const input = {
            flowId,
            requestHash,
            productType: 'relationship_tarot',
            productId: 'relationship_tarot',
            customerEmail: 'Reading@example.com',
            customerName: '',
            payload: {
                question: 'Jak začít rozhovor o společném čase?',
                cards: [{ name: 'Hvězda', position: 'Co potřebuješ' }],
                checkoutReturnProof: 'a'.repeat(64)
            }
        };

        const first = await createIdempotentRelationshipTarotOrderInput(input);
        const retry = await createIdempotentRelationshipTarotOrderInput({
            ...input,
            payload: { ...input.payload, checkoutReturnProof: 'b'.repeat(64), cards: [] }
        });

        expect(retry.id).toBe(first.id);
        await expect(getOneTimeOrderInput(first.id)).resolves.toMatchObject({
            customer_email: 'reading@example.com',
            payload: {
                flowId,
                checkoutInputHash: requestHash,
                checkoutReturnProof: 'a'.repeat(64),
                cards: [{ name: 'Hvězda', position: 'Co potřebuješ' }]
            }
        });
        await expect(createIdempotentRelationshipTarotOrderInput({
            ...input,
            requestHash: 'f'.repeat(64)
        })).rejects.toMatchObject({ code: 'RELATIONSHIP_TAROT_FLOW_CONFLICT' });
    });

    test('legacy relationship checkout flow prevents a second private order', async () => {
        const flowId = `old_${randomUUID().replace(/-/g, '')}`;
        const legacy = await createOneTimeOrderInput({
            productType: 'relationship_tarot',
            productId: 'relationship_tarot',
            customerEmail: 'reading@example.com',
            customerName: '',
            payload: { flowId, question: 'Jak začít rozhovor o společném čase?' }
        });

        await expect(createIdempotentRelationshipTarotOrderInput({
            flowId,
            requestHash: '1'.repeat(64),
            productType: 'relationship_tarot',
            productId: 'relationship_tarot',
            customerEmail: 'reading@example.com',
            customerName: '',
            payload: { question: 'Jak začít rozhovor o společném čase?', checkoutReturnProof: '2'.repeat(64) }
        })).rejects.toMatchObject({ code: 'RELATIONSHIP_TAROT_FLOW_CONFLICT' });

        await expect(getOneTimeOrderInput(legacy.id)).resolves.toMatchObject({
            id: legacy.id,
            payload: { flowId }
        });
        const { data } = await supabase.from('one_time_order_inputs').select('id')
            .eq('product_type', 'relationship_tarot')
            .eq('product_id', 'relationship_tarot')
            .eq('payload->>flowId', flowId);
        expect(data).toHaveLength(1);
    });
});
