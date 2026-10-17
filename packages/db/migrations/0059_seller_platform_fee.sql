-- 0059_seller_platform_fee.sql (PLAN.md §11.9, §13, P6-02)
--
-- Per-order platform fee max(EGP 5, 2%) for every seller (D1) and a 30-day
-- no-fee trial for new sellers (D5). The fee itself is computed in
-- @workspace/lib/orders/platform-fee and snapshotted on order lines; nothing
-- here touches existing orders, which keep their 5% snapshots.
--
-- Idempotent. No new table, so no RLS change.

ALTER TABLE sellers ADD COLUMN IF NOT EXISTS fee_plan text NOT NULL DEFAULT 'standard_2pct_min5';

-- Existing sellers are filled with false (no trial, D5). New sellers default
-- to true, whatever path creates them (dashboard signup or the legacy
-- /onboarding wizard). Admins may grant it before a trial starts.
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS fee_trial_eligible boolean NOT NULL DEFAULT false;
ALTER TABLE sellers ALTER COLUMN fee_trial_eligible SET DEFAULT true;

-- Written once by startFeeTrialIfNeeded (P6-03); never restarted.
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS fee_trial_started_at timestamptz;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS fee_trial_ends_at timestamptz;

-- When the seller's current fee plan took effect. For existing sellers this is
-- the moment the migration ran: apply it together with the P6-04 deploy, and
-- record that time in PLAN.md §23 as the switch-over.
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS fee_plan_effective_at timestamptz DEFAULT now();

DO $$ BEGIN
  ALTER TABLE sellers ADD CONSTRAINT sellers_fee_plan_check
    CHECK (fee_plan IN ('standard_2pct_min5'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE sellers ADD CONSTRAINT sellers_fee_trial_dates_check
    CHECK (
      (fee_trial_started_at IS NULL) = (fee_trial_ends_at IS NULL)
      AND (fee_trial_ends_at IS NULL OR fee_trial_ends_at > fee_trial_started_at)
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- What started the trial (audit): 'publish' (first builder publish),
-- 'product_active' (first active product) or 'admin'.
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS fee_trial_start_trigger text;

DO $$ BEGIN
  ALTER TABLE sellers ADD CONSTRAINT sellers_fee_trial_start_trigger_check
    CHECK (fee_trial_start_trigger IS NULL OR fee_trial_start_trigger IN ('publish', 'product_active', 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Trial start (D20, P6-03): the first of the first builder publish or the
-- first active product. Written once per seller account (D25); the row lock
-- of the UPDATE makes concurrent triggers start it exactly once. Returns true
-- only for the call that started it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION start_fee_trial_if_needed(p_seller_id uuid, p_trigger text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  started boolean;
BEGIN
  UPDATE sellers
     SET fee_trial_started_at = now(),
         fee_trial_ends_at = now() + interval '30 days',
         fee_trial_start_trigger = p_trigger
   WHERE id = p_seller_id
     AND fee_trial_eligible
     AND fee_trial_started_at IS NULL
  RETURNING true INTO started;
  RETURN coalesce(started, false);
END;
$$;

REVOKE ALL ON FUNCTION start_fee_trial_if_needed(uuid, text) FROM PUBLIC, anon, authenticated;

-- Every path that activates a product (dashboard, admin approval, imports)
-- goes through the products table, so the trigger covers them all.
CREATE OR REPLACE FUNCTION products_start_fee_trial()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM start_fee_trial_if_needed(NEW.seller_id, 'product_active');
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS products_start_fee_trial_insert ON products;
CREATE TRIGGER products_start_fee_trial_insert
  AFTER INSERT ON products
  FOR EACH ROW WHEN (NEW.status = 'active')
  EXECUTE FUNCTION products_start_fee_trial();

DROP TRIGGER IF EXISTS products_start_fee_trial_update ON products;
CREATE TRIGGER products_start_fee_trial_update
  AFTER UPDATE OF status ON products
  FOR EACH ROW WHEN (NEW.status = 'active' AND OLD.status IS DISTINCT FROM 'active')
  EXECUTE FUNCTION products_start_fee_trial();

-- Rollback: DROP TRIGGER products_start_fee_trial_insert/_update ON products;
--   DROP FUNCTION products_start_fee_trial(), start_fee_trial_if_needed(uuid, text);
--   ALTER TABLE sellers DROP CONSTRAINT sellers_fee_trial_start_trigger_check,
--   DROP COLUMN fee_trial_start_trigger, DROP CONSTRAINT sellers_fee_trial_dates_check,
--   DROP CONSTRAINT sellers_fee_plan_check, DROP COLUMN fee_plan_effective_at,
--   DROP COLUMN fee_trial_ends_at, DROP COLUMN fee_trial_started_at,
--   DROP COLUMN fee_trial_eligible, DROP COLUMN fee_plan;
-- The code ignores the columns when reverted (5% constant in git history).
