-- 0072_newsletter_subscribers.sql (owner request 2026-10-19)
--
-- The tallaby.com newsletter (blog page "One useful email, every other week").
-- Sign-ups arrive through a rate-limited server action in apps/ecommerce
-- (components/marketing/blog/newsletter.server.ts) over Drizzle, so the table
-- is server-only: RLS on, no policies. One row per address (case-insensitive);
-- signing up again re-subscribes an address that had unsubscribed.
-- Additive and idempotent.

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  locale text NOT NULL DEFAULT 'ar',
  source text NOT NULL DEFAULT 'blog',
  status text NOT NULL DEFAULT 'subscribed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  CONSTRAINT newsletter_subscribers_email_check CHECK (length(email) BETWEEN 3 AND 200 AND email = lower(email)),
  CONSTRAINT newsletter_subscribers_locale_check CHECK (locale IN ('ar', 'en')),
  CONSTRAINT newsletter_subscribers_source_check CHECK (source ~ '^[a-z][a-z_-]{1,31}$'),
  CONSTRAINT newsletter_subscribers_status_check CHECK (status IN ('subscribed', 'unsubscribed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_key ON newsletter_subscribers (email);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_created_idx ON newsletter_subscribers (created_at DESC);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Rollback: DROP TABLE newsletter_subscribers;
