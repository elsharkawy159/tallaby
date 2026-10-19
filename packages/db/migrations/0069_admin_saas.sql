-- 0069_admin_saas.sql (docs/admin-saas.md §4.4, P9B-03)
--
-- 1. admin_audit_log can also record platform-wide admin actions that belong
--    to no seller (template gallery changes). seller_id becomes nullable and
--    two optional target columns describe what was changed. Seller rows keep
--    working exactly as before. Non-destructive: no column is dropped or
--    renamed and no row is rewritten.
-- 2. One partial index for the admin integration error list and badge.
--
-- Idempotent. Not applied anywhere yet: staging first, after owner approval.

ALTER TABLE admin_audit_log ALTER COLUMN seller_id DROP NOT NULL;
ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS target_type text;
ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS target_id text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_audit_log_target_check') THEN
    -- A row is about a seller, or (platform rows) names its target and has no store.
    ALTER TABLE admin_audit_log ADD CONSTRAINT admin_audit_log_target_check CHECK (
      seller_id IS NOT NULL
      OR (store_id IS NULL AND target_type IS NOT NULL AND target_id IS NOT NULL)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_audit_log_target_type_check') THEN
    ALTER TABLE admin_audit_log ADD CONSTRAINT admin_audit_log_target_type_check CHECK (
      target_type IS NULL OR target_type ~ '^[a-z][a-z_]{2,31}$'
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON admin_audit_log (created_at DESC);

-- Same rules as 0063, plus: a platform row (seller_id NULL) is never deleted.
-- 0063's delete rule ("the seller is gone") would otherwise match NULL.
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
    IF OLD.seller_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sellers WHERE id = OLD.seller_id) THEN
      RETURN OLD;
    END IF;
  END IF;
  RAISE EXCEPTION 'admin_audit_log is append-only (%)', TG_OP USING ERRCODE = 'check_violation';
END;
$$;

-- Admin integrations badge and error tab (P9B-08).
CREATE INDEX IF NOT EXISTS store_integrations_error_idx
  ON store_integrations (updated_at DESC) WHERE status = 'error';

-- Rollback (only while no platform rows exist):
--   DELETE is blocked by the trigger, so first check: SELECT count(*) FROM admin_audit_log WHERE seller_id IS NULL;
--   ALTER TABLE admin_audit_log DROP CONSTRAINT admin_audit_log_target_check,
--     DROP CONSTRAINT admin_audit_log_target_type_check, DROP COLUMN target_type, DROP COLUMN target_id;
--   ALTER TABLE admin_audit_log ALTER COLUMN seller_id SET NOT NULL;
--   DROP INDEX admin_audit_log_created_idx, store_integrations_error_idx;
--   Re-run 0063's admin_audit_log_guard() definition.
