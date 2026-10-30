-- 0131: Browser/PWA push for every notification, in both back offices, and
-- admin messages to one seller (ROADMAP.md F-06d, F-06e, F-06f).
--
-- 1. `seller_push_settings.account`: the seller's switch for the bell types
--    that had no push yet (wallet top-ups, questions and reviews, affiliate,
--    welcome gift). Default on, like the other switches.
-- 2. `seller_notifications` type `admin_message`: a message the Tallaby team
--    sends to one seller from Admin › Sellers › <seller>. `data` holds
--    `title`, `body` and an optional dashboard `link` path. Written by the
--    admin app (audited in admin_audit_log), so the 0098 realtime trigger and
--    the 0124 push dispatcher pick it up like any other bell row.
-- 3. `admin_push_subscriptions`: one row per admin browser/device that turned
--    on alerts. Keyed by the admin's users.id; the dispatcher only sends to
--    users who are still verified, unsuspended admins.
-- 4. `admin_notifications.pushed_at`: the admin dispatcher's claim (same
--    pattern as seller_notifications.pushed_at in 0124). Rows older than an
--    hour are marked handled so nothing old is ever pushed.
--
-- The new table is server-only (RLS on, no policies). Additive and
-- idempotent; old code never reads the new columns or table.

-- 1 ────────────────────────────────────────────────────────────────────────
ALTER TABLE public.seller_push_settings ADD COLUMN IF NOT EXISTS account boolean NOT NULL DEFAULT true;

-- 2 ────────────────────────────────────────────────────────────────────────
-- Re-creates the check with every existing type (0098, 0106, 0117, 0119,
-- 0125) plus admin_message. Guarded so a re-run never narrows a list a later
-- migration widened.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'seller_notifications_type_check'
      AND pg_get_constraintdef(oid) LIKE '%admin_message%'
  ) THEN
    ALTER TABLE public.seller_notifications DROP CONSTRAINT IF EXISTS seller_notifications_type_check;
    ALTER TABLE public.seller_notifications ADD CONSTRAINT seller_notifications_type_check CHECK (type IN (
      'order_created', 'top_up_approved', 'top_up_rejected', 'question_received', 'review_received',
      'carrier_shipment_failed', 'carrier_needs_attention',
      'referral_commission_earned', 'referral_payout_paid', 'referral_payout_rejected',
      'welcome_gift_granted', 'welcome_gift_expiring', 'welcome_gift_expired',
      'low_stock',
      'admin_message'
    ));
  END IF;
END $$;

-- 3 ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_success_at timestamptz,
  CONSTRAINT admin_push_subscriptions_endpoint_key UNIQUE (endpoint),
  CONSTRAINT admin_push_subscriptions_endpoint_https CHECK (endpoint ~ '^https://' AND char_length(endpoint) <= 1000),
  CONSTRAINT admin_push_subscriptions_keys_length CHECK (char_length(p256dh) <= 200 AND char_length(auth) <= 100),
  CONSTRAINT admin_push_subscriptions_user_agent_length CHECK (user_agent IS NULL OR char_length(user_agent) <= 300)
);

CREATE INDEX IF NOT EXISTS admin_push_subscriptions_user_idx
  ON public.admin_push_subscriptions (user_id);

ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4 ────────────────────────────────────────────────────────────────────────
ALTER TABLE public.admin_notifications ADD COLUMN IF NOT EXISTS pushed_at timestamptz;

UPDATE public.admin_notifications
  SET pushed_at = created_at
  WHERE pushed_at IS NULL
    AND created_at < now() - interval '1 hour';

CREATE INDEX IF NOT EXISTS admin_notifications_push_pending_idx
  ON public.admin_notifications (created_at)
  WHERE pushed_at IS NULL;

-- Rollback:
--   DROP INDEX admin_notifications_push_pending_idx;
--   ALTER TABLE admin_notifications DROP COLUMN pushed_at;
--   DROP TABLE admin_push_subscriptions;
--   re-run 0125's seller_notifications_type_check block (without admin_message;
--   delete admin_message rows first);
--   ALTER TABLE seller_push_settings DROP COLUMN account;
