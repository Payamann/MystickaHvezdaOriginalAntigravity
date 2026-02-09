-- ============================================
-- Add Stripe IDs for subscription lifecycle management
-- ============================================

-- Add stripe_customer_id to users table
alter table users add column if not exists stripe_customer_id text;

-- Add stripe_subscription_id to subscriptions table
alter table subscriptions add column if not exists stripe_subscription_id text;

-- Index for looking up subscriptions by Stripe subscription ID (used in webhook handlers)
create index if not exists idx_subscriptions_stripe_sub_id on subscriptions(stripe_subscription_id);

-- Index for looking up users by Stripe customer ID
create index if not exists idx_users_stripe_customer_id on users(stripe_customer_id);
