-- 0137_plans_and_ai_credits.sql (owner, 2026-11-03; ROADMAP.md F-55, F-57; design:
-- docs/superpowers/specs/2026-11-03-usd-wallet-and-plans-design.md)
--
-- Additive and idempotent: nothing reads these until billing_settings.usd_live is
-- true. New tables are server-only (RLS on, no policies).

BEGIN;

ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS plan_cancel_at_period_end boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan_grace_until timestamptz,
  ADD COLUMN IF NOT EXISTS plan_admin_granted boolean NOT NULL DEFAULT false;

-- The account's credit balance: one row per seller, shared by everyone on it.
CREATE TABLE IF NOT EXISTS seller_ai_credits (
  seller_id uuid PRIMARY KEY REFERENCES sellers(id) ON DELETE CASCADE,
  monthly_remaining integer NOT NULL DEFAULT 0 CHECK (monthly_remaining >= 0),
  -- Which allowance is loaded: "free:2026-11" or "pro:<period start>".
  monthly_period text,
  purchased_remaining integer NOT NULL DEFAULT 0 CHECK (purchased_remaining >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE seller_ai_credits ENABLE ROW LEVEL SECURITY;

-- History. The unique claim makes every grant, purchase, use and refund happen once.
CREATE TABLE IF NOT EXISTS ai_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('monthly_grant', 'purchase', 'use', 'refund', 'admin')),
  monthly_delta integer NOT NULL DEFAULT 0,
  purchased_delta integer NOT NULL DEFAULT 0,
  feature text,
  reference text NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_credit_ledger_reference_once UNIQUE (seller_id, kind, reference)
);
ALTER TABLE ai_credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS ai_credit_ledger_seller_idx ON ai_credit_ledger (seller_id, created_at DESC);

-- Bell types for the plan's renewal.
DO $$
DECLARE
  def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def FROM pg_constraint WHERE conname = 'seller_notifications_type_check';
  IF def IS NOT NULL AND def NOT LIKE '%plan_renewal_failed%' THEN
    EXECUTE 'ALTER TABLE seller_notifications DROP CONSTRAINT seller_notifications_type_check';
    EXECUTE 'ALTER TABLE seller_notifications ADD CONSTRAINT seller_notifications_type_check ' ||
      regexp_replace(def, '\]', ', ''plan_renewed''::text, ''plan_renewal_failed''::text, ''plan_ended''::text]');
  END IF;
END $$;

-- A converted gift stays correct: its amounts move to USD with the wallet.
CREATE OR REPLACE FUNCTION billing_convert_open_gifts(p_market_rate numeric)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE seller_welcome_gifts
     SET amount = greatest(round(amount / p_market_rate, 2), 0.01),
         debt_cleared = least(round(debt_cleared / p_market_rate, 2), greatest(round(amount / p_market_rate, 2), 0.01))
   WHERE expired_at IS NULL;
$$;
REVOKE ALL ON FUNCTION billing_convert_open_gifts(numeric) FROM PUBLIC, anon, authenticated;

COMMIT;
