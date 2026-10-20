-- 0056_store_integrations.sql (PLAN.md §9.1, §11.8, P1-02; UI in Phase 7)
--
-- One row per store and provider. config holds public identifiers only (pixel
-- id, GA4 measurement id, …). Secrets live in credentials_encrypted, encrypted
-- in the application (AES-256-GCM, INTEGRATIONS_ENCRYPTION_KEY, server-only).
-- seller_id is kept for ownership checks and audit.
--
-- Idempotent. RLS enabled with no policies (server-side Drizzle only).

CREATE TABLE IF NOT EXISTS store_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected',
  config jsonb NOT NULL DEFAULT '{}',
  credentials_encrypted text,
  scopes text[] NOT NULL DEFAULT '{}',
  external_account_id text,
  last_error text,
  last_synced_at timestamptz,
  connected_by uuid REFERENCES users(id) ON DELETE SET NULL,
  connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_integrations_store_provider_key UNIQUE (store_id, provider),
  CONSTRAINT store_integrations_status_check CHECK (status IN ('connected', 'error', 'disconnected')),
  CONSTRAINT store_integrations_provider_check CHECK (provider IN (
    'meta_pixel', 'meta_capi', 'google_analytics', 'google_tag_manager',
    'tiktok_pixel', 'snapchat_pixel', 'google_sheets', 'shopify_import'
  ))
);

CREATE INDEX IF NOT EXISTS store_integrations_seller_idx ON store_integrations (seller_id);

ALTER TABLE store_integrations ENABLE ROW LEVEL SECURITY;

-- seller_id must be the store's owner.
CREATE OR REPLACE FUNCTION store_integrations_same_seller()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM stores WHERE id = NEW.store_id AND seller_id = NEW.seller_id) THEN
    RAISE EXCEPTION 'store_integrations: store % does not belong to seller %', NEW.store_id, NEW.seller_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS store_integrations_same_seller ON store_integrations;
CREATE TRIGGER store_integrations_same_seller
  BEFORE INSERT OR UPDATE OF store_id, seller_id ON store_integrations
  FOR EACH ROW EXECUTE FUNCTION store_integrations_same_seller();

-- Rollback: DROP TABLE store_integrations; DROP FUNCTION store_integrations_same_seller.
