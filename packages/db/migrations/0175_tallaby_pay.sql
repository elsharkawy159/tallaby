-- 0175_tallaby_pay.sql: the Tallaby Pay earnings ledger foundation
-- (ROADMAP.md F-100a; docs/superpowers/specs/2026-11-18-tallaby-pay-design.md
-- §4, §7, §11 and the owner's answers in §14, 2026-11-18).
--
-- Shoppers of a store with Tallaby Pay pay on Tallaby's own EasyKash account.
-- Tallaby keeps a fee (billing_settings.tallaby_pay_fee_bps, default 3%) and
-- the seller's net goes to a per-store earnings wallet, separate from the
-- store wallet (seller_wallet / wallet_transactions) and from the customer
-- user_wallets. Nothing here touches either of those.
--
--  1. store_integrations_provider_check: the live list (0174's) plus
--     'tallaby_pay'. Skipped when the live check already has 'tallaby_pay', so
--     a re-run never narrows a list a later migration widened; a guard aborts
--     before any change if a row would fail the new check.
--  2. billing_settings: tallaby_pay_fee_bps (300 = 3%, 0–2000),
--     tallaby_pay_hold_days (owner 2026-11-18: 0, so the net is available on
--     delivery; kept as a setting, 0–60) and tallaby_pay_min_payout
--     (owner 2026-11-18: EGP 500).
--  3. platform_switches row 'tallaby_pay_live', off. The feature ships dark.
--  4. tallaby_pay_wallets: one per store (pending / available / reserved).
--     `available` may go negative, only through a refund or an admin
--     adjustment (checked in code by postTallabyPayEntry).
--  5. tallaby_pay_sales: one per paid order and purpose: the idempotency claim
--     (UNIQUE order + purpose, UNIQUE EasyKash reference), the seller's sales
--     list and the Fees box (sum of fee of non-refunded rows).
--  6. tallaby_pay_payouts: withdrawal requests (0117 shape, per store, one
--     open request per store). The logic is F-100e.
--  7. tallaby_pay_entries: the append-only ledger of every balance move
--     (UNIQUE kind + reference), with a trigger that rejects UPDATE and DELETE
--     except the clean-ups of a deleted user (0134 pattern).
--  8. tallaby_pay_kyc: the account's legal identity (owner 2026-11-18: legal
--     name + national ID or commercial register before the first withdrawal).
--     One row per seller account.
--
-- Delete rules (0134): rows are owned by the seller account, so seller_id is
-- ON DELETE CASCADE and deleting the user removes them. store_id on the wallet
-- is NO ACTION (as seller_wallet_top_ups.store_id, 0160): a store holding
-- earnings is never hard-deleted on its own, while a user delete still
-- cascades (the wallet goes in the same statement). Child rows point at their
-- wallet with a composite (wallet_id, store_id) key, so a row can never name
-- one store and another store's wallet. order_id is SET NULL: as for
-- wallet_transactions (0134), another party's ledger row outlives the order.
-- People pointers (admin, creator) are SET NULL.
--
-- Server-only: RLS on, no policies. Money is EGP numeric(10,2), computed in
-- integer piastres in code (CLAUDE.md rule 7).
--
-- Additive and idempotent. NOT applied anywhere yet. Apply on staging, then
-- production with owner approval, BEFORE deploying code that reads it
-- (Drizzle selects every billing_settings column). Rollback before any sale:
-- drop the five tables, the three columns and the switch row, and restore the
-- provider check. After a sale, never drop anything.

-- ── 1. store_integrations provider ───────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'store_integrations_provider_check'
      AND conrelid = 'public.store_integrations'::regclass
      AND pg_get_constraintdef(oid) LIKE '%''tallaby_pay''%'
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.store_integrations
    WHERE provider NOT IN (
      'meta_pixel', 'meta_capi', 'google_analytics', 'google_tag_manager',
      'tiktok_pixel', 'snapchat_pixel', 'google_sheets', 'shopify_import', 'bosta',
      'paymob', 'kashier', 'wassalha', 'easykash', 'tallaby_pay'
    )
  ) THEN
    RAISE EXCEPTION '0175: store_integrations has a provider outside the new check; nothing changed';
  END IF;

  ALTER TABLE public.store_integrations DROP CONSTRAINT IF EXISTS store_integrations_provider_check;
  ALTER TABLE public.store_integrations ADD CONSTRAINT store_integrations_provider_check CHECK (provider IN (
    'meta_pixel', 'meta_capi', 'google_analytics', 'google_tag_manager',
    'tiktok_pixel', 'snapchat_pixel', 'google_sheets', 'shopify_import', 'bosta',
    'paymob', 'kashier', 'wassalha', 'easykash', 'tallaby_pay'
  ));
END $$;

-- ── 2. billing_settings ──────────────────────────────────────────────────
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS tallaby_pay_fee_bps integer NOT NULL DEFAULT 300;
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS tallaby_pay_hold_days integer NOT NULL DEFAULT 0;
ALTER TABLE public.billing_settings ADD COLUMN IF NOT EXISTS tallaby_pay_min_payout numeric(10,2) NOT NULL DEFAULT 500;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_settings_tallaby_pay_fee_bps_check') THEN
    ALTER TABLE public.billing_settings ADD CONSTRAINT billing_settings_tallaby_pay_fee_bps_check
      CHECK (tallaby_pay_fee_bps BETWEEN 0 AND 2000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_settings_tallaby_pay_hold_days_check') THEN
    ALTER TABLE public.billing_settings ADD CONSTRAINT billing_settings_tallaby_pay_hold_days_check
      CHECK (tallaby_pay_hold_days BETWEEN 0 AND 60);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'billing_settings_tallaby_pay_min_payout_check') THEN
    ALTER TABLE public.billing_settings ADD CONSTRAINT billing_settings_tallaby_pay_min_payout_check
      CHECK (tallaby_pay_min_payout >= 1);
  END IF;
END $$;

-- ── 3. Launch switch (off) ───────────────────────────────────────────────
INSERT INTO public.platform_switches (key, enabled)
VALUES ('tallaby_pay_live', false)
ON CONFLICT (key) DO NOTHING;

-- ── 4. tallaby_pay_wallets ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tallaby_pay_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  currency text NOT NULL DEFAULT 'EGP',
  pending numeric(10,2) NOT NULL DEFAULT 0,
  available numeric(10,2) NOT NULL DEFAULT 0,
  reserved numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  frozen_reason text,
  frozen_by uuid,
  frozen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tallaby_pay_wallets_store_key UNIQUE (store_id),
  -- Target of the children's composite (wallet_id, store_id) keys.
  CONSTRAINT tallaby_pay_wallets_id_store_key UNIQUE (id, store_id),
  CONSTRAINT tallaby_pay_wallets_store_id_fkey FOREIGN KEY (store_id)
    REFERENCES public.stores(id) ON DELETE NO ACTION,
  CONSTRAINT tallaby_pay_wallets_seller_id_fkey FOREIGN KEY (seller_id)
    REFERENCES public.sellers(id) ON DELETE CASCADE,
  CONSTRAINT tallaby_pay_wallets_frozen_by_fkey FOREIGN KEY (frozen_by)
    REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT tallaby_pay_wallets_currency_check CHECK (currency = 'EGP'),
  CONSTRAINT tallaby_pay_wallets_pending_check CHECK (pending >= 0),
  CONSTRAINT tallaby_pay_wallets_reserved_check CHECK (reserved >= 0),
  CONSTRAINT tallaby_pay_wallets_status_check CHECK (status IN ('active', 'frozen')),
  CONSTRAINT tallaby_pay_wallets_frozen_check CHECK (status <> 'frozen' OR (frozen_reason IS NOT NULL AND frozen_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS tallaby_pay_wallets_seller_idx ON public.tallaby_pay_wallets (seller_id);

ALTER TABLE public.tallaby_pay_wallets ENABLE ROW LEVEL SECURITY;

-- ── 5. tallaby_pay_sales ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tallaby_pay_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL,
  store_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  -- NULL only after the order row was deleted (SET NULL); always set on insert.
  order_id uuid,
  purpose text NOT NULL DEFAULT 'order',
  easykash_ref text NOT NULL,
  customer_reference text,
  payment_method text,
  gross numeric(10,2) NOT NULL,
  fee numeric(10,2) NOT NULL,
  net numeric(10,2) NOT NULL,
  fee_bps integer NOT NULL,
  hold_days integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz NOT NULL,
  release_at timestamptz,
  released_at timestamptz,
  refund_state text,
  refund_requested_at timestamptz,
  refund_requested_by uuid,
  refund_reason text,
  refunded_at timestamptz,
  refunded_by uuid,
  refund_reference text,
  refund_reason_admin text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- One credit per order or deposit; one credit per EasyKash payment.
  CONSTRAINT tallaby_pay_sales_order_purpose_key UNIQUE (order_id, purpose),
  CONSTRAINT tallaby_pay_sales_easykash_ref_key UNIQUE (easykash_ref),
  -- Target of the entries' composite (sale_id, wallet_id) key.
  CONSTRAINT tallaby_pay_sales_id_wallet_key UNIQUE (id, wallet_id),
  CONSTRAINT tallaby_pay_sales_wallet_fkey FOREIGN KEY (wallet_id, store_id)
    REFERENCES public.tallaby_pay_wallets(id, store_id) ON DELETE CASCADE,
  CONSTRAINT tallaby_pay_sales_seller_id_fkey FOREIGN KEY (seller_id)
    REFERENCES public.sellers(id) ON DELETE CASCADE,
  CONSTRAINT tallaby_pay_sales_order_id_fkey FOREIGN KEY (order_id)
    REFERENCES public.orders(id) ON DELETE SET NULL,
  CONSTRAINT tallaby_pay_sales_refund_requested_by_fkey FOREIGN KEY (refund_requested_by)
    REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT tallaby_pay_sales_refunded_by_fkey FOREIGN KEY (refunded_by)
    REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT tallaby_pay_sales_purpose_check CHECK (purpose IN ('order', 'deposit')),
  CONSTRAINT tallaby_pay_sales_ref_check CHECK (length(easykash_ref) BETWEEN 1 AND 200),
  CONSTRAINT tallaby_pay_sales_amounts_check CHECK (gross = fee + net AND fee >= 0 AND net >= 0 AND gross > 0),
  CONSTRAINT tallaby_pay_sales_fee_bps_check CHECK (fee_bps BETWEEN 0 AND 2000),
  CONSTRAINT tallaby_pay_sales_hold_days_check CHECK (hold_days BETWEEN 0 AND 60),
  CONSTRAINT tallaby_pay_sales_status_check CHECK (status IN ('pending', 'available', 'refunded')),
  CONSTRAINT tallaby_pay_sales_refund_state_check CHECK (refund_state IS NULL OR refund_state IN ('requested', 'declined')),
  CONSTRAINT tallaby_pay_sales_released_check CHECK (status <> 'available' OR released_at IS NOT NULL),
  CONSTRAINT tallaby_pay_sales_refunded_check CHECK (status <> 'refunded' OR refunded_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS tallaby_pay_sales_store_paid_idx ON public.tallaby_pay_sales (store_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS tallaby_pay_sales_wallet_idx ON public.tallaby_pay_sales (wallet_id);
CREATE INDEX IF NOT EXISTS tallaby_pay_sales_seller_idx ON public.tallaby_pay_sales (seller_id);
-- The release job's queue.
CREATE INDEX IF NOT EXISTS tallaby_pay_sales_pending_idx
  ON public.tallaby_pay_sales (paid_at) WHERE status = 'pending';
-- The Admin refund queue.
CREATE INDEX IF NOT EXISTS tallaby_pay_sales_refund_requested_idx
  ON public.tallaby_pay_sales (refund_requested_at) WHERE refund_state = 'requested';

ALTER TABLE public.tallaby_pay_sales ENABLE ROW LEVEL SECURITY;

-- ── 6. tallaby_pay_payouts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tallaby_pay_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL,
  store_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  amount numeric(10,2) NOT NULL,
  method text NOT NULL,
  -- Full destination (InstaPay address, bank holder + IBAN or account, or the
  -- wallet provider + phone). Server-only, masked in every list.
  destination jsonb NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  reference text,
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  reversed_at timestamptz,
  reversal_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tallaby_pay_payouts_id_wallet_key UNIQUE (id, wallet_id),
  CONSTRAINT tallaby_pay_payouts_wallet_fkey FOREIGN KEY (wallet_id, store_id)
    REFERENCES public.tallaby_pay_wallets(id, store_id) ON DELETE CASCADE,
  CONSTRAINT tallaby_pay_payouts_seller_id_fkey FOREIGN KEY (seller_id)
    REFERENCES public.sellers(id) ON DELETE CASCADE,
  CONSTRAINT tallaby_pay_payouts_reviewed_by_fkey FOREIGN KEY (reviewed_by)
    REFERENCES public.users(id) ON DELETE SET NULL,
  -- A floor only; the real minimum is billing_settings.tallaby_pay_min_payout, checked in code.
  CONSTRAINT tallaby_pay_payouts_amount_check CHECK (amount >= 1),
  CONSTRAINT tallaby_pay_payouts_method_check CHECK (method IN ('instapay', 'bank', 'mobile_wallet')),
  CONSTRAINT tallaby_pay_payouts_destination_check CHECK (jsonb_typeof(destination) = 'object'),
  CONSTRAINT tallaby_pay_payouts_status_check CHECK (status IN ('requested', 'paid', 'rejected', 'cancelled', 'reversed')),
  CONSTRAINT tallaby_pay_payouts_paid_check CHECK (status NOT IN ('paid', 'reversed') OR (reference IS NOT NULL AND reviewed_at IS NOT NULL)),
  CONSTRAINT tallaby_pay_payouts_rejected_check CHECK (status <> 'rejected' OR (rejection_reason IS NOT NULL AND reviewed_at IS NOT NULL)),
  CONSTRAINT tallaby_pay_payouts_reversed_check CHECK (status <> 'reversed' OR (reversed_at IS NOT NULL AND reversal_reason IS NOT NULL))
);

-- One open request per store; a double submit loses on this index.
CREATE UNIQUE INDEX IF NOT EXISTS tallaby_pay_payouts_one_open
  ON public.tallaby_pay_payouts (store_id) WHERE status = 'requested';
CREATE INDEX IF NOT EXISTS tallaby_pay_payouts_store_idx ON public.tallaby_pay_payouts (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tallaby_pay_payouts_status_idx ON public.tallaby_pay_payouts (status, created_at);
CREATE INDEX IF NOT EXISTS tallaby_pay_payouts_wallet_idx ON public.tallaby_pay_payouts (wallet_id);
CREATE INDEX IF NOT EXISTS tallaby_pay_payouts_seller_idx ON public.tallaby_pay_payouts (seller_id);

ALTER TABLE public.tallaby_pay_payouts ENABLE ROW LEVEL SECURITY;

-- ── 7. tallaby_pay_entries ───────────────────────────────────────────────
-- Deltas per kind (design §4.5; payout_reserve / payout_unreserve record the
-- withdrawal hold, so every move of every bucket has an entry):
--   sale              +pending
--   release           −pending, +available (same amount)
--   refund            −pending, or −available (may go below zero)
--   payout_reserve    +reserved
--   payout_unreserve  −reserved (rejected or cancelled request)
--   payout            −available, −reserved (same amount)
--   payout_reversal   +available (a paid transfer came back)
--   adjustment        ±pending and/or ±available, reason required
CREATE TABLE IF NOT EXISTS public.tallaby_pay_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL,
  store_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  sale_id uuid,
  payout_id uuid,
  kind text NOT NULL,
  pending_delta numeric(10,2) NOT NULL DEFAULT 0,
  available_delta numeric(10,2) NOT NULL DEFAULT 0,
  reserved_delta numeric(10,2) NOT NULL DEFAULT 0,
  -- From the balance UPDATE … RETURNING, never a re-read.
  pending_after numeric(10,2) NOT NULL,
  available_after numeric(10,2) NOT NULL,
  reserved_after numeric(10,2) NOT NULL,
  reference_type text NOT NULL,
  reference_id text NOT NULL,
  description text,
  metadata jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- The idempotency claim: a domain event is applied once.
  CONSTRAINT tallaby_pay_entries_reference_key UNIQUE (kind, reference_type, reference_id),
  CONSTRAINT tallaby_pay_entries_wallet_fkey FOREIGN KEY (wallet_id, store_id)
    REFERENCES public.tallaby_pay_wallets(id, store_id) ON DELETE CASCADE,
  CONSTRAINT tallaby_pay_entries_seller_id_fkey FOREIGN KEY (seller_id)
    REFERENCES public.sellers(id) ON DELETE CASCADE,
  -- A sale or payout of the same wallet only.
  CONSTRAINT tallaby_pay_entries_sale_fkey FOREIGN KEY (sale_id, wallet_id)
    REFERENCES public.tallaby_pay_sales(id, wallet_id) ON DELETE CASCADE,
  CONSTRAINT tallaby_pay_entries_payout_fkey FOREIGN KEY (payout_id, wallet_id)
    REFERENCES public.tallaby_pay_payouts(id, wallet_id) ON DELETE CASCADE,
  CONSTRAINT tallaby_pay_entries_created_by_fkey FOREIGN KEY (created_by)
    REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT tallaby_pay_entries_kind_check CHECK (kind IN (
    'sale', 'release', 'refund', 'payout_reserve', 'payout_unreserve', 'payout', 'payout_reversal', 'adjustment'
  )),
  CONSTRAINT tallaby_pay_entries_deltas_check CHECK (
       (kind = 'sale' AND pending_delta > 0 AND available_delta = 0 AND reserved_delta = 0)
    OR (kind = 'release' AND pending_delta < 0 AND available_delta = -pending_delta AND reserved_delta = 0)
    OR (kind = 'refund' AND reserved_delta = 0
        AND ((pending_delta < 0 AND available_delta = 0) OR (pending_delta = 0 AND available_delta < 0)))
    OR (kind = 'payout_reserve' AND pending_delta = 0 AND available_delta = 0 AND reserved_delta > 0)
    OR (kind = 'payout_unreserve' AND pending_delta = 0 AND available_delta = 0 AND reserved_delta < 0)
    OR (kind = 'payout' AND pending_delta = 0 AND available_delta < 0 AND reserved_delta = available_delta)
    OR (kind = 'payout_reversal' AND pending_delta = 0 AND available_delta > 0 AND reserved_delta = 0)
    OR (kind = 'adjustment' AND reserved_delta = 0 AND (pending_delta <> 0 OR available_delta <> 0))
  ),
  CONSTRAINT tallaby_pay_entries_sale_ref_check CHECK (kind NOT IN ('sale', 'release', 'refund') OR sale_id IS NOT NULL),
  CONSTRAINT tallaby_pay_entries_payout_ref_check CHECK (
    kind NOT IN ('payout_reserve', 'payout_unreserve', 'payout', 'payout_reversal') OR payout_id IS NOT NULL
  ),
  CONSTRAINT tallaby_pay_entries_adjustment_reason_check CHECK (
    kind <> 'adjustment' OR length(btrim(coalesce(metadata->>'reason', ''))) > 0
  ),
  CONSTRAINT tallaby_pay_entries_after_check CHECK (pending_after >= 0 AND reserved_after >= 0),
  CONSTRAINT tallaby_pay_entries_reference_check CHECK (length(reference_type) > 0 AND length(reference_id) > 0)
);

CREATE INDEX IF NOT EXISTS tallaby_pay_entries_wallet_created_idx ON public.tallaby_pay_entries (wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tallaby_pay_entries_seller_idx ON public.tallaby_pay_entries (seller_id);
CREATE INDEX IF NOT EXISTS tallaby_pay_entries_sale_idx ON public.tallaby_pay_entries (sale_id) WHERE sale_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS tallaby_pay_entries_payout_idx ON public.tallaby_pay_entries (payout_id) WHERE payout_id IS NOT NULL;

ALTER TABLE public.tallaby_pay_entries ENABLE ROW LEVEL SECURITY;

-- Append-only. Allowed only: clearing created_by when that user is deleted
-- (SET NULL), and deleting the rows of a deleted seller account (CASCADE).
CREATE OR REPLACE FUNCTION public.tallaby_pay_entries_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.created_by IS NULL
       AND (to_jsonb(NEW) - 'created_by') = (to_jsonb(OLD) - 'created_by') THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (SELECT 1 FROM public.sellers WHERE id = OLD.seller_id) THEN
      RETURN OLD;
    END IF;
  END IF;
  RAISE EXCEPTION 'tallaby_pay_entries is append-only; post a compensating entry instead of %', TG_OP
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS tallaby_pay_entries_immutable ON public.tallaby_pay_entries;
CREATE TRIGGER tallaby_pay_entries_immutable
  BEFORE UPDATE OR DELETE ON public.tallaby_pay_entries
  FOR EACH ROW EXECUTE FUNCTION public.tallaby_pay_entries_immutable();

-- ── 8. tallaby_pay_kyc ───────────────────────────────────────────────────
-- The account's legal identity, required before the first withdrawal; every
-- payout destination must be in this name (checked in code, F-100e).
CREATE TABLE IF NOT EXISTS public.tallaby_pay_kyc (
  seller_id uuid PRIMARY KEY,
  legal_name text NOT NULL,
  id_type text NOT NULL,
  id_number text NOT NULL,
  status text NOT NULL DEFAULT 'submitted',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  verified_by uuid,
  rejection_reason text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tallaby_pay_kyc_seller_id_fkey FOREIGN KEY (seller_id)
    REFERENCES public.sellers(id) ON DELETE CASCADE,
  CONSTRAINT tallaby_pay_kyc_verified_by_fkey FOREIGN KEY (verified_by)
    REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT tallaby_pay_kyc_legal_name_check CHECK (length(btrim(legal_name)) BETWEEN 2 AND 200),
  CONSTRAINT tallaby_pay_kyc_id_type_check CHECK (id_type IN ('national_id', 'commercial_register')),
  -- An Egyptian national ID is 14 digits; a commercial register number is free form.
  CONSTRAINT tallaby_pay_kyc_id_number_check CHECK (
    CASE id_type
      WHEN 'national_id' THEN id_number ~ '^[0-9]{14}$'
      ELSE length(btrim(id_number)) BETWEEN 1 AND 40
    END
  ),
  CONSTRAINT tallaby_pay_kyc_status_check CHECK (status IN ('submitted', 'verified', 'rejected')),
  CONSTRAINT tallaby_pay_kyc_verified_check CHECK (status <> 'verified' OR verified_at IS NOT NULL),
  CONSTRAINT tallaby_pay_kyc_rejected_check CHECK (status <> 'rejected' OR rejection_reason IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS tallaby_pay_kyc_submitted_idx
  ON public.tallaby_pay_kyc (submitted_at) WHERE status = 'submitted';

ALTER TABLE public.tallaby_pay_kyc ENABLE ROW LEVEL SECURITY;
