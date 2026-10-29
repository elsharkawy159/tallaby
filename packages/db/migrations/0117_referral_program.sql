-- 0117: Tallaby affiliate program (ROADMAP.md F-37,
-- docs/superpowers/specs/2026-10-29-affiliate-program-design.md).
--
-- A seller shares tallaby.com/?ref=<referral_code>. A seller who signs up
-- through it gets `referred_by_seller_id` (set once, at account creation).
-- Every succeeded store-wallet top-up of a referred seller earns the referrer
-- 20 % in `referral_commissions` (one row per top-up, unique `top_up_id`),
-- posted in the same transaction that marks the top-up succeeded. Commissions
-- are paid in cash: the referrer asks for a withdrawal (`referral_payouts`,
-- one open request at a time, at least EGP 500) and an admin marks it paid
-- with the transfer reference. Its own ledger: no wallet table is touched.
--
-- `referral_unlocked_at` is set once the referrer reaches 10 successful
-- referrals and 10 stores; only an admin re-lock clears it.
-- `referral_excluded_at` marks a referred seller an admin found to be fake:
-- their commissions are reversed and they stop counting toward the unlock.
--
-- Both tables are server-only (RLS on, no policies). A payout request drops a
-- row into the admin bell; commissions and payout decisions go to the seller
-- bell (0098). Additive and idempotent.

-- 1. Seller columns -----------------------------------------------------------
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS referred_by_seller_id uuid;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS referred_at timestamptz;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS referral_unlocked_at timestamptz;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS referral_excluded_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sellers_referred_by_seller_id_fkey') THEN
    ALTER TABLE public.sellers ADD CONSTRAINT sellers_referred_by_seller_id_fkey
      FOREIGN KEY (referred_by_seller_id) REFERENCES public.sellers(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sellers_referral_code_format') THEN
    ALTER TABLE public.sellers ADD CONSTRAINT sellers_referral_code_format
      CHECK (referral_code IS NULL OR referral_code ~ '^[A-HJ-NP-Z2-9]{7}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sellers_not_self_referred') THEN
    ALTER TABLE public.sellers ADD CONSTRAINT sellers_not_self_referred
      CHECK (referred_by_seller_id IS NULL OR referred_by_seller_id <> id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS sellers_referral_code_key
  ON public.sellers (referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS sellers_referred_by_idx
  ON public.sellers (referred_by_seller_id) WHERE referred_by_seller_id IS NOT NULL;

-- 2. Commissions ---------------------------------------------------------------
-- RESTRICT on every seller/top-up key: money records are never lost silently.
CREATE TABLE IF NOT EXISTS public.referral_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,
  referred_seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,
  top_up_id uuid NOT NULL REFERENCES public.seller_wallet_top_ups(id) ON DELETE RESTRICT,
  top_up_amount numeric(10,2) NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'earned',
  reversed_at timestamptz,
  reversed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reversal_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_commissions_top_up_key UNIQUE (top_up_id),
  CONSTRAINT referral_commissions_status_check CHECK (status IN ('earned', 'reversed')),
  CONSTRAINT referral_commissions_amount_check CHECK (amount >= 0 AND top_up_amount > 0),
  CONSTRAINT referral_commissions_not_self CHECK (referrer_seller_id <> referred_seller_id),
  CONSTRAINT referral_commissions_reversed_check CHECK (status <> 'reversed' OR reversed_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS referral_commissions_referrer_idx
  ON public.referral_commissions (referrer_seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS referral_commissions_referred_idx
  ON public.referral_commissions (referred_seller_id);

ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- 3. Payouts -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referral_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE RESTRICT,
  amount numeric(10,2) NOT NULL,
  method text NOT NULL,
  -- Full destination (holder, bank + account, or wallet phone). Server-only.
  destination jsonb NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  reference text,
  rejection_reason text,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referral_payouts_amount_check CHECK (amount >= 500),
  CONSTRAINT referral_payouts_method_check CHECK (method IN ('bank', 'vodafone_cash')),
  CONSTRAINT referral_payouts_status_check CHECK (status IN ('requested', 'paid', 'rejected')),
  CONSTRAINT referral_payouts_paid_check CHECK (status <> 'paid' OR (reference IS NOT NULL AND reviewed_at IS NOT NULL)),
  CONSTRAINT referral_payouts_rejected_check CHECK (status <> 'rejected' OR (rejection_reason IS NOT NULL AND reviewed_at IS NOT NULL))
);

-- One open request per referrer; a double submit loses on this index.
CREATE UNIQUE INDEX IF NOT EXISTS referral_payouts_one_open
  ON public.referral_payouts (referrer_seller_id) WHERE status = 'requested';
CREATE INDEX IF NOT EXISTS referral_payouts_referrer_idx
  ON public.referral_payouts (referrer_seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS referral_payouts_status_idx
  ON public.referral_payouts (status, created_at DESC);

ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;

-- 4. Admin bell: a referrer asked for a withdrawal ---------------------------
-- The type list is 0116's plus the new type. Guarded so a re-run never narrows
-- a list a later migration widened.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'admin_notifications_type_check'
      AND pg_get_constraintdef(oid) LIKE '%referral_payout_requested%'
  ) THEN
    ALTER TABLE public.admin_notifications DROP CONSTRAINT IF EXISTS admin_notifications_type_check;
    ALTER TABLE public.admin_notifications ADD CONSTRAINT admin_notifications_type_check CHECK (
      type IN (
        'seller_created', 'store_created', 'store_published', 'top_up_requested', 'feature_request_created',
        'product_created', 'first_order_received', 'integration_connected', 'store_unpublished', 'store_deleted',
        'referral_payout_requested'
      )
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.notify_admin_referral_payout_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, dedupe_key)
    VALUES (
      'referral_payout_requested',
      jsonb_build_object(
        'amount', new.amount::text,
        'payoutId', new.id,
        'storeName', (
          SELECT s.name FROM public.stores s
          WHERE s.seller_id = new.referrer_seller_id AND s.deleted_at IS NULL
          ORDER BY s.is_primary DESC, s.created_at ASC
          LIMIT 1
        )
      ),
      new.referrer_seller_id,
      'referral_payout_requested:' || new.id::text
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_referral_payout_requested: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS referral_payouts_notify_admin_requested ON public.referral_payouts;
CREATE TRIGGER referral_payouts_notify_admin_requested
  AFTER INSERT ON public.referral_payouts
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_referral_payout_requested();

-- 5. Seller bell types (0106's list plus the three referral ones) ------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'seller_notifications_type_check'
      AND pg_get_constraintdef(oid) LIKE '%referral_commission_earned%'
  ) THEN
    ALTER TABLE public.seller_notifications DROP CONSTRAINT IF EXISTS seller_notifications_type_check;
    ALTER TABLE public.seller_notifications ADD CONSTRAINT seller_notifications_type_check CHECK (type IN (
      'order_created', 'top_up_approved', 'top_up_rejected', 'question_received', 'review_received',
      'carrier_shipment_failed', 'carrier_needs_attention',
      'referral_commission_earned', 'referral_payout_paid', 'referral_payout_rejected'
    ));
  END IF;
END $$;

-- Rollback (only once no row uses the new values):
--   DROP TABLE referral_payouts; DROP TABLE referral_commissions;
--   DROP FUNCTION notify_admin_referral_payout_requested();
--   ALTER TABLE sellers DROP CONSTRAINT sellers_referred_by_seller_id_fkey,
--     DROP CONSTRAINT sellers_referral_code_format, DROP CONSTRAINT sellers_not_self_referred,
--     DROP COLUMN referral_code, DROP COLUMN referred_by_seller_id, DROP COLUMN referred_at,
--     DROP COLUMN referral_unlocked_at, DROP COLUMN referral_excluded_at;
--   Restore the 0116 admin and 0106 seller notification type checks.
