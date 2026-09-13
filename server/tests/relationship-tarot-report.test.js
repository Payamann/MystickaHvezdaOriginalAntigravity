import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { supabase } from '../db-supabase.js';
import { buildRelationshipTarotReport } from '../services/relationship-tarot-report.js';

const relationship = {
    product_type: 'relationship_tarot',
    product_id: 'relationship_tarot'
};

describe('Relationship tarot report aggregation', () => {
    test('deduplicates live paid sessions and exposes missing orders and receipts', () => {
        const report = buildRelationshipTarotReport({
            events: [
                { event_name: 'one_time_offer_viewed', source: 'tarot_yes_no_result', feature: 'relationship_tarot', metadata: { flow_id: 'flow_1234567890123456' } },
                { event_name: 'one_time_offer_viewed', source: 'tarot_yes_no_result', feature: 'relationship_tarot', metadata: { flow_id: 'flow_1234567890123456' } },
                { event_name: 'one_time_product_cta_clicked', source: 'tarot_yes_no_result', feature: 'relationship_tarot', metadata: { flow_id: 'flow_1234567890123456', funnel_step: 'entry_offer' } },
                { event_name: 'one_time_product_cta_clicked', source: 'relationship_tarot_page', feature: 'relationship_tarot', metadata: { flow_id: 'flow_1234567890123456', funnel_step: 'product_to_form' } },
                { event_name: 'one_time_product_cta_clicked', source: 'relationship_tarot_page', feature: 'relationship_tarot' },
                { event_name: 'one_time_product_viewed', source: 'relationship_tarot_page', feature: 'relationship_tarot', metadata: { flow_id: 'flow_1234567890123456' } },
                { event_name: 'one_time_form_started', source: 'relationship_tarot_page', feature: 'relationship_tarot', metadata: { flow_id: 'flow_1234567890123456' } },
                { event_name: 'one_time_form_submitted', source: 'relationship_tarot_page', feature: 'relationship_tarot', metadata: { flow_id: 'flow_1234567890123456' } },
                { event_name: 'checkout_session_created', source: 'relationship_tarot_page', feature: 'relationship_tarot', metadata: { flow_id: 'flow_1234567890123456' } },
                { event_name: 'checkout_session_failed', source: 'relationship_tarot_page', feature: 'relationship_tarot' },
                { event_name: 'checkout_validation_failed', source: 'relationship_tarot_page', feature: 'relationship_tarot' },
                { event_name: 'one_time_offer_viewed', source: 'other', feature: 'tarot' }
            ],
            purchases: [
                { ...relationship, stripe_session_id: 'cs_live_delivered', status: 'paid', amount_total: 14900, currency: 'czk', flow_id: 'flow_1234567890123456', metadata: { source: 'purchase_source' } },
                { ...relationship, stripe_session_id: 'cs_live_delivered', status: 'paid', amount_total: 14900, currency: 'czk', metadata: { source: 'duplicate_source' } },
                { ...relationship, stripe_session_id: 'cs_live_pending', status: 'paid', amount_total: 14900, currency: 'CZK', metadata: {} },
                { ...relationship, stripe_session_id: 'cs_test_testdata', status: 'paid', amount_total: 14900, currency: 'czk' },
                { ...relationship, stripe_session_id: 'cs_live_unlinked', status: 'paid', amount_total: 14900, currency: 'czk' },
                { ...relationship, stripe_session_id: 'cs_live_unpaid', status: 'unpaid', amount_total: 14900, currency: 'czk' },
                { ...relationship, stripe_session_id: 'cs_live_eur', status: 'paid', amount_total: 14900, currency: 'eur' },
                { product_type: 'personal_map', product_id: 'relationship_tarot', stripe_session_id: 'cs_live_other', status: 'paid', amount_total: 14900, currency: 'czk' }
            ],
            orders: [
                { ...relationship, stripe_session_id: 'cs_live_delivered', status: 'fulfilled', payload: { source: 'order_source' } },
                { ...relationship, stripe_session_id: 'cs_live_pending', status: 'checkout_created', payload: { source: 'order_fallback' } },
                { ...relationship, stripe_session_id: 'cs_test_testdata', status: 'fulfilled', payload: { source: 'test' } },
                { ...relationship, stripe_session_id: 'cs_live_reconciled_missing_purchase', status: 'fulfilled', payload: { source: 'reconciliation' } },
                { ...relationship, stripe_session_id: 'cs_live_reconciled_missing_purchase', status: 'fulfilled', source: 'reconciliation' },
                { ...relationship, stripe_session_id: 'cs_live_old_receipt', status: 'fulfilled', payload: { source: 'old_receipt' } }
            ],
            reconciliationPurchases: [
                { ...relationship, stripe_session_id: 'cs_live_old_receipt', status: 'paid', amount_total: 14900, currency: 'czk' }
            ]
        }, {
            since: '2026-09-01T00:00:00.000Z',
            until: '2026-09-13T00:00:00.000Z',
            days: 12,
            partial: true
        });

        expect(report).toMatchObject({
            since: '2026-09-01T00:00:00.000Z',
            until: '2026-09-13T00:00:00.000Z',
            days: 12,
            partial: true,
            metrics: {
                offerViewed: 2,
                ctaClicked: 3,
                entryCtaClicked: 1,
                orderCtaClicked: 1,
                unclassifiedCtaClicked: 1,
                productViewed: 1,
                formStarted: 1,
                formSubmitted: 1,
                checkoutCreated: 1,
                checkoutFailed: 2,
                paidOrders: 3,
                paidOrdersWithFlow: 1,
                unmatchedPaidOrders: 1,
                deliveredOrders: 1,
                pendingDeliveryOrders: 1,
                fulfilledWithoutReceipt: 1,
                grossCzk: 447
            }
        });
        expect(report.uniqueFlows).toEqual({
            offerViewed: 1,
            entryCtaClicked: 1,
            productViewed: 1,
            orderCtaClicked: 1,
            formStarted: 1,
            formSubmitted: 1,
            checkoutCreated: 1
        });
        expect(report.sources).toContainEqual(expect.objectContaining({
            source: 'purchase_source',
            offerViewed: 0,
            ctaClicked: 0,
            productViewed: 0,
            formStarted: 0,
            formSubmitted: 0,
            checkoutCreated: 0,
            paidOrders: 1,
            deliveredOrders: 1
        }));
        expect(report.sources).toContainEqual(expect.objectContaining({
            source: 'order_fallback',
            paidOrders: 1,
            deliveredOrders: 0
        }));
        expect(report.sources).not.toContainEqual(expect.objectContaining({ source: 'reconciliation' }));
        expect(report.sources).toContainEqual(expect.objectContaining({ source: 'unknown', paidOrders: 1 }));
        expect(JSON.stringify(report)).not.toContain('duplicate_source');
    });
});

describe('Relationship tarot admin report route', () => {
    const adminId = 'relationship-report-admin';
    const userId = 'relationship-report-user';

    const token = id => jwt.sign(
        { id, email: `${id}@example.com` },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    beforeAll(async () => {
        await supabase.from('users').insert([
            { id: adminId, email: `${adminId}@example.com`, role: 'admin' },
            { id: userId, email: `${userId}@example.com`, role: 'user' }
        ]);
    });

    afterAll(async () => {
        await supabase.from('users').delete().in('id', [adminId, userId]);
    });

    test('requires authentication and current admin role', async () => {
        await request(app).get('/api/admin/relationship-tarot-report').expect(401);
        await request(app)
            .get('/api/admin/relationship-tarot-report')
            .set('Authorization', `Bearer ${token(userId)}`)
            .expect(403);
    });

    test('returns the bounded report without exposing order PII or payload details', async () => {
        const stamp = Date.now();
        const session = `cs_live_relationship_report_${stamp}`;
        const source = `route_source_${stamp}`;
        const createdAt = new Date().toISOString();
        await supabase.from('one_time_order_inputs').insert({
            id: `order-${stamp}`,
            ...relationship,
            stripe_session_id: session,
            status: 'fulfilled',
            customer_email: 'private@example.com',
            customer_name: 'Private Name',
            payload: { source, question: 'private question' },
            created_at: createdAt
        });
        await supabase.from('one_time_purchases').insert({
            ...relationship,
            stripe_session_id: session,
            status: 'paid',
            amount_total: 14900,
            currency: 'czk',
            customer_email: 'private@example.com',
            metadata: {},
            created_at: createdAt
        });

        const response = await request(app)
            .get('/api/admin/relationship-tarot-report?days=0')
            .set('Authorization', `Bearer ${token(adminId)}`)
            .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.report.days).toBe(1);
        expect(response.body.report.partial).toBe(false);
        expect(response.body.report.metrics).toMatchObject({
            paidOrders: 1,
            deliveredOrders: 1,
            pendingDeliveryOrders: 0,
            grossCzk: 149
        });
        expect(response.body.report.sources).toContainEqual(expect.objectContaining({
            source,
            paidOrders: 1,
            deliveredOrders: 1
        }));
        expect(JSON.stringify(response.body)).not.toContain('private@example.com');
        expect(JSON.stringify(response.body)).not.toContain('private question');
    });
});
