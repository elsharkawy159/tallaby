-- 0067_flat_fee_7_day_trial.sql (owner decision 2026-10-18, PLAN.md §13)
--
-- Replaces the max(EGP 5, 2%) fee and the 30-day trial:
--   - Fee: a flat EGP 5 per seller per delivered order (plan 'flat_5'). The
--     amount lives in @workspace/lib/orders/platform-fee.lib.ts; this file
--     only renames the plan key.
--   - Trial: 7 days with no fee, per seller account, from the created_at of
--     the seller's first store. Orders placed on day 8 or later pay the fee.
--
-- Applies to every seller ("apply the new rule to all", owner 2026-10-18):
-- each seller's trial window is rewritten to first store + 7 days, which ends
-- any running 30-day trial and any admin extension. Orders already placed
-- keep their fee snapshots; nothing here touches order_items or the ledger.
--
-- Idempotent. No new table, so no RLS change.

-- ---------------------------------------------------------------------------
-- Fee plan: 'standard_2pct_min5' → 'flat_5'.
-- ---------------------------------------------------------------------------
ALTER TABLE sellers DROP CONSTRAINT IF EXISTS sellers_fee_plan_check;

UPDATE sellers
   SET fee_plan = 'flat_5',
       fee_plan_effective_at = now()
 WHERE fee_plan IS DISTINCT FROM 'flat_5';

ALTER TABLE sellers ALTER COLUMN fee_plan SET DEFAULT 'flat_5';

DO $$ BEGIN
  ALTER TABLE sellers ADD CONSTRAINT sellers_fee_plan_check CHECK (fee_plan IN ('flat_5'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Trial start trigger: new value 'store_created'.
-- ---------------------------------------------------------------------------
ALTER TABLE sellers DROP CONSTRAINT IF EXISTS sellers_fee_trial_start_trigger_check;

DO $$ BEGIN
  ALTER TABLE sellers ADD CONSTRAINT sellers_fee_trial_start_trigger_check
    CHECK (
      fee_trial_start_trigger IS NULL
      OR fee_trial_start_trigger IN ('store_created', 'publish', 'product_active', 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- The trial window is always [first store created_at, + 7 days). Deleted and
-- archived stores count too, so closing a store never moves the window. A
-- seller with no store yet (should not happen: signup creates one) starts now.
-- Still written once per account and only for eligible sellers; the publish
-- and product callers (0059) keep working and are no-ops once it is set.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION start_fee_trial_if_needed(p_seller_id uuid, p_trigger text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  started boolean;
  first_store_at timestamptz;
BEGIN
  SELECT min(created_at) INTO first_store_at FROM stores WHERE seller_id = p_seller_id;

  UPDATE sellers
     SET fee_trial_started_at = coalesce(first_store_at, now()),
         fee_trial_ends_at = coalesce(first_store_at, now()) + interval '7 days',
         fee_trial_start_trigger = CASE WHEN first_store_at IS NULL THEN p_trigger ELSE 'store_created' END
   WHERE id = p_seller_id
     AND fee_trial_eligible
     AND fee_trial_started_at IS NULL
  RETURNING true INTO started;
  RETURN coalesce(started, false);
END;
$$;

REVOKE ALL ON FUNCTION start_fee_trial_if_needed(uuid, text) FROM PUBLIC, anon, authenticated;

-- Every path that creates a store (signup, "new store", admin) inserts into
-- stores, so this trigger starts the trial for all of them.
CREATE OR REPLACE FUNCTION stores_start_fee_trial()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM start_fee_trial_if_needed(NEW.seller_id, 'store_created');
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS stores_start_fee_trial_insert ON stores;
CREATE TRIGGER stores_start_fee_trial_insert
  AFTER INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION stores_start_fee_trial();

-- ---------------------------------------------------------------------------
-- Backfill: every seller with a store gets the new window. For old sellers it
-- lies in the past, so they pay the fee on new orders straight away.
-- ---------------------------------------------------------------------------
WITH first_store AS (
  SELECT seller_id, min(created_at) AS created_at FROM stores GROUP BY seller_id
)
UPDATE sellers s
   SET fee_trial_eligible = true,
       fee_trial_started_at = f.created_at,
       fee_trial_ends_at = f.created_at + interval '7 days',
       fee_trial_start_trigger = 'store_created'
  FROM first_store f
 WHERE s.id = f.seller_id
   AND (
     s.fee_trial_started_at IS DISTINCT FROM f.created_at
     OR s.fee_trial_ends_at IS DISTINCT FROM f.created_at + interval '7 days'
   );

-- Rollback: re-apply the function and trigger-check from 0059, DROP TRIGGER
--   stores_start_fee_trial_insert ON stores, DROP FUNCTION
--   stores_start_fee_trial(), and restore fee_plan 'standard_2pct_min5' (its
--   CHECK and DEFAULT). The old trial dates are not kept; take a copy of
--   sellers(id, fee_trial_*) first if they may be needed.
