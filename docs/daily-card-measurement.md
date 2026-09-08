# Daily tarot card measurement

The free widget on `/tarot-karta-dne.html` emits `first_value_completed`
after its first manual reveal in a page instance. Source is
`tarot_daily_card_widget`, feature is `tarot`, and `first_value_type` is
`tarot_daily_card_result`. It uses the existing consent-aware analytics client
and the existing CSRF-protected first-party funnel endpoint independently.
Neither channel may block revealing, saving or sharing the card.

Repeated clicks scroll to the existing result without another reveal event.
Automatic restoration after signup emits the specialized reveal event with
`reveal_reason=profile_save_return`, but never another `first_value_completed`,
including when the visitor subsequently clicks the reveal button.

Counting is per page instance, not per unique person or calendar day. A reload
followed by a manual reveal can produce another event. Missing consent, blocked
analytics, unavailable CSRF and network failures can leave gaps; the event is
best-effort and has no background retries. Aggregate counts do not prove a
unique visitor's later purchase or revenue. No question text, email or other
visitor-provided content is sent in this event.
