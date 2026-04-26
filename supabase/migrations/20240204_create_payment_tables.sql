-- Migration: Create payment support tables
-- payment_events: idempotency tracking for Stripe webhooks
-- retention_feedback: churn prevention feedback

-- Table to track processed Stripe events for idempotency
create table if not exists payment_events (
  id uuid default uuid_generate_v4() primary key,
  event_id text not null unique,
  event_type text not null,
  processed_at timestamp with time zone default now(),
  status text default 'success'
);

create index if not exists idx_payment_events_event_id on payment_events(event_id);

-- Table to store user feedback during cancellation flow
create table if not exists retention_feedback (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('churn', 'pause', 'downgrade')),
  reason text not null check (reason in ('too_expensive', 'not_using', 'technical_issues', 'found_alternative', 'other')),
  feedback text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_retention_feedback_user_id on retention_feedback(user_id);
