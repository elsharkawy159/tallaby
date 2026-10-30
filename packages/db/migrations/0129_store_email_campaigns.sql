-- 0129: Store email campaigns and win-back emails (ROADMAP.md F-16a, F-16e).
--
-- A seller writes an email (subject + plain-text body with a tiny markdown
-- subset; never HTML) in Marketing › Email campaigns, picks an audience
-- (newsletter subscribers, buyers, all customers, customers with no order
-- in N days) and sends it. "Send now" snapshots the audience into
-- `store_email_campaign_recipients` (one row per lower-cased email, minus
-- unsubscribed and placeholder addresses) and queues the campaign; the
-- ecommerce cron (apps/ecommerce/app/api/cron/email-campaigns) claims
-- recipients in batches (status 'sending' + claimed_at, FOR UPDATE SKIP
-- LOCKED), asks the backend to send one store-branded email each (its
-- email_deliveries claim, type + recipient id, stops a second send) and gives
-- failed rows back (pending again, 'failed' after 3 tries).
--
-- Win-back (F-16e): settings live in stores.settings.winback (no column).
-- The same cron, once a day, adds one `store_winback_sends` row per customer
-- whose last order is older than N days, once per inactivity period (unique
-- store + email + last_order_at), and sends them like campaign recipients.
--
-- `store_email_unsubscribes`: per-store opt-out list, honoured by every
-- campaign and every win-back email (checked when the audience is built AND
-- again right before each send). The emails' unsubscribe link (a random
-- per-row token) leads to a confirm page on the store's own host.
--
-- Server-only (RLS on, no policies): the dashboard and the cron reach these
-- tables through Drizzle, every query scoped by the session's seller and an
-- explicit store. Additive and idempotent; the dashboard page reads them, so
-- apply before deploying.

CREATE TABLE IF NOT EXISTS public.store_email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  cta_label text,
  -- Up to 4 of the seller's own products shown under the text.
  product_ids uuid[] NOT NULL DEFAULT '{}',
  -- 'subscribers' | 'buyers' | 'all' | 'inactive' (no order in inactive_days).
  audience text NOT NULL DEFAULT 'subscribers',
  inactive_days integer,
  -- The email chrome language (the store's default language when queued).
  locale text NOT NULL DEFAULT 'ar',
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  queued_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  recipient_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  test_send_count integer NOT NULL DEFAULT 0,
  last_test_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_email_campaigns_subject_check CHECK (char_length(subject) <= 150),
  CONSTRAINT store_email_campaigns_body_check CHECK (char_length(body) <= 5000),
  CONSTRAINT store_email_campaigns_cta_check CHECK (cta_label IS NULL OR char_length(cta_label) <= 40),
  CONSTRAINT store_email_campaigns_products_check CHECK (cardinality(product_ids) <= 4),
  CONSTRAINT store_email_campaigns_audience_check CHECK (audience IN ('subscribers', 'buyers', 'all', 'inactive')),
  CONSTRAINT store_email_campaigns_inactive_days_check CHECK (inactive_days IS NULL OR inactive_days BETWEEN 7 AND 730),
  CONSTRAINT store_email_campaigns_locale_check CHECK (locale IN ('ar', 'en')),
  CONSTRAINT store_email_campaigns_status_check CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  CONSTRAINT store_email_campaigns_counts_check CHECK (
    recipient_count >= 0 AND sent_count >= 0 AND failed_count >= 0 AND skipped_count >= 0 AND test_send_count >= 0
  )
);

-- The dashboard list (per store, newest first) and the daily cap.
CREATE INDEX IF NOT EXISTS store_email_campaigns_store_created_idx
  ON public.store_email_campaigns (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS store_email_campaigns_store_queued_idx
  ON public.store_email_campaigns (store_id, queued_at)
  WHERE queued_at IS NOT NULL;
-- The cron's scan of campaigns waiting or in progress.
CREATE INDEX IF NOT EXISTS store_email_campaigns_active_idx
  ON public.store_email_campaigns (scheduled_at)
  WHERE status IN ('scheduled', 'sending');

ALTER TABLE public.store_email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.store_email_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.store_email_campaigns(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  email text NOT NULL,
  -- 'pending' | 'sending' (claimed) | 'sent' | 'failed' | 'skipped'
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  unsubscribe_token text NOT NULL
    DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  CONSTRAINT store_email_campaign_recipients_campaign_email_key UNIQUE (campaign_id, email),
  CONSTRAINT store_email_campaign_recipients_status_check CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped')),
  CONSTRAINT store_email_campaign_recipients_email_check CHECK (
    char_length(email) BETWEEN 3 AND 254 AND email = lower(email) AND position('@' IN email) > 1
  ),
  CONSTRAINT store_email_campaign_recipients_token_check CHECK (char_length(unsubscribe_token) >= 32),
  CONSTRAINT store_email_campaign_recipients_attempts_check CHECK (attempts >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS store_email_campaign_recipients_token_key
  ON public.store_email_campaign_recipients (unsubscribe_token);
-- The cron's claim (rows still to send) and the per-campaign counts.
CREATE INDEX IF NOT EXISTS store_email_campaign_recipients_open_idx
  ON public.store_email_campaign_recipients (campaign_id, created_at)
  WHERE status IN ('pending', 'sending');
CREATE INDEX IF NOT EXISTS store_email_campaign_recipients_campaign_status_idx
  ON public.store_email_campaign_recipients (campaign_id, status);

ALTER TABLE public.store_email_campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.store_email_unsubscribes (
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  email text NOT NULL,
  -- 'link' (the email's unsubscribe link) | 'seller' (added by the seller).
  source text NOT NULL DEFAULT 'link',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id, email),
  CONSTRAINT store_email_unsubscribes_source_check CHECK (source IN ('link', 'seller')),
  CONSTRAINT store_email_unsubscribes_email_check CHECK (
    char_length(email) BETWEEN 3 AND 254 AND email = lower(email) AND position('@' IN email) > 1
  )
);

ALTER TABLE public.store_email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.store_winback_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  email text NOT NULL,
  -- The customer's last order when this send was planned: one win-back per
  -- inactivity period (a new order starts a new period).
  last_order_at timestamptz NOT NULL,
  locale text NOT NULL DEFAULT 'ar',
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  unsubscribe_token text NOT NULL
    DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  CONSTRAINT store_winback_sends_period_key UNIQUE (store_id, email, last_order_at),
  CONSTRAINT store_winback_sends_status_check CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped')),
  CONSTRAINT store_winback_sends_locale_check CHECK (locale IN ('ar', 'en')),
  CONSTRAINT store_winback_sends_email_check CHECK (
    char_length(email) BETWEEN 3 AND 254 AND email = lower(email) AND position('@' IN email) > 1
  ),
  CONSTRAINT store_winback_sends_token_check CHECK (char_length(unsubscribe_token) >= 32),
  CONSTRAINT store_winback_sends_attempts_check CHECK (attempts >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS store_winback_sends_token_key
  ON public.store_winback_sends (unsubscribe_token);
CREATE INDEX IF NOT EXISTS store_winback_sends_open_idx
  ON public.store_winback_sends (created_at)
  WHERE status IN ('pending', 'sending');
-- The daily per-store cap and the dashboard's "sent in the last 30 days".
CREATE INDEX IF NOT EXISTS store_winback_sends_store_created_idx
  ON public.store_winback_sends (store_id, created_at DESC);

ALTER TABLE public.store_winback_sends ENABLE ROW LEVEL SECURITY;
