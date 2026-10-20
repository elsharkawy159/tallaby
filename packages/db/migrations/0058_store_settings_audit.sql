-- 0058_store_settings_audit.sql (PLAN.md §8.6, P3-07)
--
-- Append-only log of sensitive store settings changes (payment methods first;
-- shipping and domains can reuse it). `changes` never holds full receiving
-- details: phone numbers, IBANs and InstaPay addresses are masked to their
-- last 4 characters by the application (maskPaymentDetails).
--
-- Idempotent. RLS enabled with no policies (server-side Drizzle only).

CREATE TABLE IF NOT EXISTS store_settings_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  section text NOT NULL,
  action text NOT NULL,
  changes jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_settings_audit_section_check CHECK (section IN ('payments', 'shipping', 'domain'))
);

CREATE INDEX IF NOT EXISTS store_settings_audit_store_idx ON store_settings_audit (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS store_settings_audit_seller_idx ON store_settings_audit (seller_id);

ALTER TABLE store_settings_audit ENABLE ROW LEVEL SECURITY;

-- seller_id must be the store's owner; rows are never edited (clearing
-- actor_id on user deletion is the only allowed update).
CREATE OR REPLACE FUNCTION store_settings_audit_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.actor_id IS NULL AND OLD.actor_id IS NOT NULL
       AND (to_jsonb(NEW) - 'actor_id') = (to_jsonb(OLD) - 'actor_id') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'store_settings_audit is append-only' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM stores WHERE id = NEW.store_id AND seller_id = NEW.seller_id) THEN
    RAISE EXCEPTION 'store_settings_audit: store % does not belong to seller %', NEW.store_id, NEW.seller_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS store_settings_audit_guard ON store_settings_audit;
CREATE TRIGGER store_settings_audit_guard
  BEFORE INSERT OR UPDATE ON store_settings_audit
  FOR EACH ROW EXECUTE FUNCTION store_settings_audit_guard();

-- Rollback: DROP TABLE store_settings_audit; DROP FUNCTION store_settings_audit_guard.
