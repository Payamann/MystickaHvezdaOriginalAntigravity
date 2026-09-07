# Observed revenue report

The admin report summarizes the fetched funnel event window, not the complete
Stripe ledger. The existing `estimatedValueCzk` API field is retained for
compatibility; its value now sums deduplicated, valid CZK receipt amounts only.

- Subscription checkout completion contributes no revenue.
- Paid invoices are deduplicated by invoice ID; one-time receipts by session ID.
- Missing identity, currency or minor-unit amount is excluded, not inferred from
  the plan price. Conflicting amounts/currencies exclude the entire receipt.
- Other currencies are retained separately in `metrics.revenue.byCurrency`.
- Initial invoice means `subscription_create` with a positive amount. It does
  not represent every customer's first paid invoice.
- `subscription_cycle` remains unclassified: renewal and first charge following
  a trial cannot be distinguished reliably from this window alone.
- A zero invoice is neither revenue nor proof of a trial.
- One-time receipts include historical products. Older metadata amounts may
  originate from a catalog-price fallback, so these are not audited cash totals.
- Failed invoices are deduplicated separately. A matching positive receipt is
  an observed payment; absence of one is not evidence of current unpaid debt.
- Refunds, Stripe fees, taxes and payouts are not subtracted from these totals.
- Duplicate receipts spanning different query windows can appear in both
  windows. Do not sum windows as an accounting ledger.

Full trial conversion classification requires complete subscription/invoice
history. Complete reconciliation with Stripe remains a separate task; a sampled
dashboard check does not establish agreement for the whole account.

Tests: `npm test -- --runTestsByPath server/tests/revenue-summary.test.js server/tests/admin-funnel.test.js`.
