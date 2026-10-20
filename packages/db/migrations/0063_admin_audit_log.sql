-- 0063_admin_audit_log.sql (PLAN.md §17 "Admin plan changes are audited", P9-02)
--
-- Append-only log of admin overrides on a seller account or one of its
-- stores: plan, store-limit exception (D27), fee plan, fee trial, commission
-- exemption, store-wallet negative limit, store unpublish/suspend and wallet
-- adjustments. Written by @workspace/lib/admin/server in the SAME transaction
-- as the change it describes. `before` / `after` hold only the changed
-- fields; never secrets, credentials or payment details.
--
-- Idempotent. RLS enabled with no policies (server-side Drizzle only).

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  action text NOT NULL,
  before jsonb NOT NULL DEFAULT '{}',
  after jsonb NOT NULL DEFAULT '{}',
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_audit_log_action_check CHECK (action ~ '^[a-z][a-z_]{2,63}$'),
  CONSTRAINT admin_audit_log_reason_check CHECK (char_length(btrim(reason)) BETWEEN 3 AND 1000)
);

CREATE INDEX IF NOT EXISTS admin_audit_log_seller_idx ON admin_audit_log (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_store_idx ON admin_audit_log (store_id) WHERE store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_idx ON admin_audit_log (actor_id) WHERE actor_id IS NOT NULL;

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Rows are never edited or deleted. Allowed exceptions: the FK "SET NULL"
-- clean-ups of actor_id / store_id, and the cascade when the seller account
-- itself is deleted. On insert, store_id must belong to seller_id.
CREATE OR REPLACE FUNCTION admin_audit_log_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.store_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM stores WHERE id = NEW.store_id AND seller_id = NEW.seller_id) THEN
      RAISE EXCEPTION 'admin_audit_log: store % does not belong to seller %', NEW.store_id, NEW.seller_id
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (to_jsonb(NEW) - 'actor_id' - 'store_id') = (to_jsonb(OLD) - 'actor_id' - 'store_id')
       AND (NEW.actor_id IS NULL OR NEW.actor_id IS NOT DISTINCT FROM OLD.actor_id)
       AND (NEW.store_id IS NULL OR NEW.store_id IS NOT DISTINCT FROM OLD.store_id) THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (SELECT 1 FROM sellers WHERE id = OLD.seller_id) THEN
      RETURN OLD;
    END IF;
  END IF;
  RAISE EXCEPTION 'admin_audit_log is append-only (%)', TG_OP USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS admin_audit_log_guard ON admin_audit_log;
CREATE TRIGGER admin_audit_log_guard
  BEFORE INSERT OR UPDATE OR DELETE ON admin_audit_log
  FOR EACH ROW EXECUTE FUNCTION admin_audit_log_guard();

-- Rollback: DROP TABLE admin_audit_log; DROP FUNCTION admin_audit_log_guard().
