-- Horoscope Email Subscriptions
-- Stores email subscribers for daily horoscope delivery
CREATE TABLE IF NOT EXISTS horoscope_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  zodiac_sign VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  unsubscribe_token VARCHAR(64) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT horoscope_subscriptions_email_key UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS horoscope_subscriptions_active_idx
  ON horoscope_subscriptions(active) WHERE active = true;
