-- 0124: New-order push alerts for the seller dashboard (ROADMAP.md F-06a/F-06b).
--
-- 1. `seller_push_subscriptions`: one row per browser/device that turned on
--    alerts (Web Push endpoint + its p256dh/auth keys). The endpoint is
--    unique: a device that subscribes again (or for another seller after a
--    sign-in switch) moves the row. `locale` is the dashboard language at
--    subscribe time, so the push text matches what the seller reads.
--    Rows answered 404/410 by the push service are deleted by the sender.
-- 2. `seller_push_settings`: the seller's per-type switches (one row per
--    seller; no row = everything on). `low_stock` has no notification type
--    yet: F-10 adds it, the switch is ready.
-- 3. `seller_notifications.pushed_at`: the push dispatcher's claim. It is set
--    once a row was handled (sent, skipped by a switch, no device, or too old
--    to push), with `UPDATE … WHERE pushed_at IS NULL … FOR UPDATE SKIP
--    LOCKED`, so two dispatcher runs never send the same row twice. Existing
--    rows older than an hour are marked handled so the partial index stays
--    small and nothing old is ever pushed.
--
-- Both tables are server-only (RLS on, no policies). Additive and
-- idempotent; old code never reads the new column or tables.

CREATE TABLE IF NOT EXISTS public.seller_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  locale text NOT NULL DEFAULT 'ar',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_success_at timestamptz,
  CONSTRAINT seller_push_subscriptions_endpoint_key UNIQUE (endpoint),
  CONSTRAINT seller_push_subscriptions_endpoint_https CHECK (endpoint ~ '^https://' AND char_length(endpoint) <= 1000),
  CONSTRAINT seller_push_subscriptions_keys_length CHECK (char_length(p256dh) <= 200 AND char_length(auth) <= 100),
  CONSTRAINT seller_push_subscriptions_user_agent_length CHECK (user_agent IS NULL OR char_length(user_agent) <= 300),
  CONSTRAINT seller_push_subscriptions_locale_check CHECK (locale IN ('ar', 'en'))
);

CREATE INDEX IF NOT EXISTS seller_push_subscriptions_seller_idx
  ON public.seller_push_subscriptions (seller_id);

ALTER TABLE public.seller_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.seller_push_settings (
  seller_id uuid PRIMARY KEY REFERENCES public.sellers(id) ON DELETE CASCADE,
  new_order boolean NOT NULL DEFAULT true,
  order_problem boolean NOT NULL DEFAULT true,
  low_stock boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_push_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.seller_notifications ADD COLUMN IF NOT EXISTS pushed_at timestamptz;

UPDATE public.seller_notifications
  SET pushed_at = created_at
  WHERE pushed_at IS NULL
    AND created_at < now() - interval '1 hour';

CREATE INDEX IF NOT EXISTS seller_notifications_push_pending_idx
  ON public.seller_notifications (created_at)
  WHERE pushed_at IS NULL;

-- Rollback:
--   DROP INDEX seller_notifications_push_pending_idx;
--   ALTER TABLE seller_notifications DROP COLUMN pushed_at;
--   DROP TABLE seller_push_settings; DROP TABLE seller_push_subscriptions;
