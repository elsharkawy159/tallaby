-- 0119: Welcome gift (owner, 2026-10-29;
-- docs/superpowers/specs/2026-10-29-welcome-gift-design.md, PLAN.md §13).
--
-- A seller whose account is created after this ships gets EGP 100 in the store
-- wallet once they finish setup (a template they chose, an active product, a
-- published website), valid for 30 days. On expiry the unspent part (EGP 100
-- minus fees and service charges since the grant, and minus any debt the
-- gift cleared) is taken back, never more than the positive balance. New
-- sellers no longer get the 7-day fee trial; existing sellers keep theirs.
--
-- The money moves only through postStoreWalletEntry (`adjustment` entries,
-- claims welcome_gift:<seller> and welcome_gift_expiry:<seller>). This table
-- tracks the gift; its primary key is the one-gift-per-seller guarantee.
-- Server-only (RLS on, no policies). Additive and idempotent.

-- 1. Seller flags --------------------------------------------------------------
-- Every existing seller is NOT eligible (the column is added with false); only
-- rows created afterwards get true from the new default.
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS welcome_gift_eligible boolean NOT NULL DEFAULT false;
ALTER TABLE public.sellers ALTER COLUMN welcome_gift_eligible SET DEFAULT true;

-- The 7-day trial is paused for new sellers. Existing rows are not touched, so
-- running trials and sellers who have not created a store yet keep it
-- (start_fee_trial_if_needed already checks fee_trial_eligible).
ALTER TABLE public.sellers ALTER COLUMN fee_trial_eligible SET DEFAULT false;

-- 2. Gifts ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.seller_welcome_gifts (
  seller_id uuid PRIMARY KEY REFERENCES public.sellers(id) ON DELETE RESTRICT,
  -- The published store that completed setup (informational).
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  -- Debt the gift cleared at grant time (max(0, -balance_before)).
  debt_cleared numeric(10,2) NOT NULL DEFAULT 0,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  wallet_entry_id uuid REFERENCES public.wallet_transactions(id) ON DELETE RESTRICT,
  reminded_at timestamptz,
  expired_at timestamptz,
  expired_amount numeric(10,2),
  expiry_entry_id uuid REFERENCES public.wallet_transactions(id) ON DELETE RESTRICT,
  popup_seen_at timestamptz,
  CONSTRAINT seller_welcome_gifts_amount_positive CHECK (amount > 0),
  CONSTRAINT seller_welcome_gifts_debt_range CHECK (debt_cleared >= 0 AND debt_cleared <= amount),
  CONSTRAINT seller_welcome_gifts_expiry_after_grant CHECK (expires_at > granted_at),
  CONSTRAINT seller_welcome_gifts_expired_amount CHECK (
    expired_amount IS NULL OR (expired_amount >= 0 AND expired_amount <= amount)
  )
);

-- The daily job looks for gifts to remind about or expire.
CREATE INDEX IF NOT EXISTS seller_welcome_gifts_open_idx
  ON public.seller_welcome_gifts (expires_at) WHERE expired_at IS NULL;

ALTER TABLE public.seller_welcome_gifts ENABLE ROW LEVEL SECURITY;

-- 3. Seller bell types ---------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'seller_notifications_type_check'
      AND pg_get_constraintdef(oid) LIKE '%welcome_gift_granted%'
  ) THEN
    ALTER TABLE public.seller_notifications DROP CONSTRAINT IF EXISTS seller_notifications_type_check;
    ALTER TABLE public.seller_notifications ADD CONSTRAINT seller_notifications_type_check CHECK (type IN (
      'order_created', 'top_up_approved', 'top_up_rejected', 'question_received', 'review_received',
      'carrier_shipment_failed', 'carrier_needs_attention',
      'referral_commission_earned', 'referral_payout_paid', 'referral_payout_rejected',
      'welcome_gift_granted', 'welcome_gift_expiring', 'welcome_gift_expired'
    ));
  END IF;
END $$;

-- Rollback (only before any gift is granted):
--   DROP TABLE seller_welcome_gifts;
--   ALTER TABLE sellers DROP COLUMN welcome_gift_eligible;
--   ALTER TABLE sellers ALTER COLUMN fee_trial_eligible SET DEFAULT true;
--   re-run 0117 section for seller_notifications_type_check without the welcome_gift_* values.
