import { summarizeRevenue } from '../services/revenue-summary.js';

const paid = (id, amount = 19900, currency = 'czk') => ({
    event_name: 'subscription_invoice_paid', metadata: { invoiceId: id, amountPaid: amount, currency }
});

describe('observed revenue', () => {
    test('conflicting billing reasons stay unclassified in any order', () => {
        const initial = paid('same'); initial.metadata.billingReason = 'subscription_create';
        const cycle = paid('same'); cycle.metadata.billingReason = 'subscription_cycle';
        for (const events of [[initial, cycle, initial], [cycle, initial, initial]]) {
            expect(summarizeRevenue(events).breakdown).toEqual({ otherInvoice: { count: 1, byCurrency: { CZK: 19900 } } });
        }
    });
    test('zero or conflicting receipts do not prove recovery', () => {
        const failures = ['zero', 'conflict'].map(invoiceId => ({ event_name: 'subscription_payment_failed', metadata: { invoiceId } }));
        expect(summarizeRevenue([...failures, paid('zero', 0), paid('conflict', 100), paid('conflict', 200)]).failures)
            .toMatchObject({ uniqueInvoices: 2, recoveredInvoices: 0, withoutObservedPayment: 2 });
    });
    test('separates billing reasons without guessing trial conversion', () => {
        const initial = paid('first'); initial.metadata.billingReason = 'subscription_create';
        const cycle = paid('cycle'); cycle.metadata.billingReason = 'subscription_cycle';
        const result = summarizeRevenue([initial, cycle, paid('zero', 0)]);
        expect(result.breakdown.initialInvoice.count).toBe(1);
        expect(result.breakdown.cycleUnclassified.count).toBe(1);
        expect(result.breakdown.zeroInvoice.count).toBe(1);
    });
    test('matches failed invoices to positive payments regardless of event order', () => {
        const failure = id => ({ event_name: 'subscription_payment_failed', metadata: { invoiceId: id } });
        const result = summarizeRevenue([paid('recovered'), failure('recovered'), failure('recovered'), failure('unpaid'), failure(null)]);
        expect(result.failures).toEqual({ uniqueInvoices: 2, recoveredInvoices: 1, withoutObservedPayment: 1, unidentifiedEvents: 1 });
    });
    test('counts an invoice once, never checkout catalog value or trial', () => {
        const events = [paid('in_1'), paid('in_1'), paid('in_trial', 0),
            { event_name: 'subscription_checkout_completed', plan_id: 'pruvodce' }];
        expect(summarizeRevenue(events).byCurrency).toEqual({ CZK: 19900 });
    });
    test('keeps currencies separate and PDF sessions unique', () => {
        const pdf = { event_name: 'one_time_purchase_completed', stripe_session_id: 'cs_1', metadata: { amount: 29950, currency: 'czk' } };
        expect(summarizeRevenue([pdf, pdf, paid('in_2', 100, 'eur')]).byCurrency).toEqual({ CZK: 29950, EUR: 100 });
    });
    test('does not guess missing amounts, currency, identity or invalid amounts', () => {
        const result = summarizeRevenue([paid(null), paid('a', null), paid('b', -1), paid('c', 1.5), paid('d', 10, ''), paid('e', '')]);
        expect(result.byCurrency).toEqual({});
        expect(result.excludedEvents).toBe(6);
    });
    test('excludes conflicting receipts independently of event order', () => {
        const events = [paid('same', 100), paid('same', 200), paid('other', 50)];
        expect(summarizeRevenue(events)).toEqual(summarizeRevenue([...events].reverse()));
        expect(summarizeRevenue(events)).toMatchObject({ byCurrency: { CZK: 50 }, conflictingReceipts: 1 });
    });
});
