// Observed funnel receipts, not Stripe reconciliation or net revenue.
export function summarizeRevenue(events) {
    const receipts = new Map();
    const failedInvoices = new Set();
    let unidentifiedFailures = 0;
    let excludedEvents = 0;
    for (const event of events) {
        if (event.event_name === 'subscription_payment_failed') {
            const id = event.metadata?.invoiceId;
            if (typeof id === 'string' && id.trim()) failedInvoices.add(id);
            else unidentifiedFailures++;
        }
        const invoice = event.event_name === 'subscription_invoice_paid';
        if (!invoice && event.event_name !== 'one_time_purchase_completed') continue;
        const m = event.metadata || {};
        const id = invoice ? m.invoiceId : event.stripe_session_id;
        const raw = invoice ? (m.amountPaid ?? m.amount_paid) : (m.amount_total ?? m.amount);
        const amount = typeof raw === 'number' || (typeof raw === 'string' && raw.trim()) ? Number(raw) : NaN;
        const currency = typeof m.currency === 'string' ? m.currency.toUpperCase() : '';
        if (typeof id !== 'string' || !id.trim() || !Number.isSafeInteger(amount) || amount < 0 || !/^[A-Z]{3}$/.test(currency)) {
            excludedEvents++;
            continue;
        }
        const key = `${invoice ? 'invoice' : 'session'}:${id}`;
        // Cycle invoices also include the first charge after a trial. Never label
        // them renewals without a complete subscription history.
        const category = !invoice ? 'oneTime' : amount === 0 ? 'zeroInvoice'
            : m.billingReason === 'subscription_create' ? 'initialInvoice'
                : m.billingReason === 'subscription_cycle' ? 'cycleUnclassified' : 'otherInvoice';
        const previous = receipts.get(key);
        if (previous) {
            if (previous.amount !== amount || previous.currency !== currency) previous.conflict = true;
            if (previous.category !== category) previous.category = invoice ? 'otherInvoice' : 'oneTime';
            continue;
        }
        receipts.set(key, { id, invoice, amount, currency, category, conflict: false });
    }
    const byCurrency = {};
    let conflictingReceipts = 0;
    const breakdown = {};
    let recoveredInvoices = 0;
    for (const receipt of receipts.values()) {
        if (receipt.conflict) { conflictingReceipts++; continue; }
        byCurrency[receipt.currency] = (byCurrency[receipt.currency] || 0) + receipt.amount;
        const group = breakdown[receipt.category] ||= { count: 0, byCurrency: {} };
        group.count++;
        group.byCurrency[receipt.currency] = (group.byCurrency[receipt.currency] || 0) + receipt.amount;
        if (receipt.invoice && receipt.amount > 0 && failedInvoices.has(receipt.id)) recoveredInvoices++;
    }
    return { byCurrency, excludedEvents, conflictingReceipts, breakdown,
        failures: { uniqueInvoices: failedInvoices.size, recoveredInvoices,
            withoutObservedPayment: failedInvoices.size - recoveredInvoices, unidentifiedEvents: unidentifiedFailures } };
}
