-- 0106_bosta_shipping.sql: per-store Bosta shipping
-- (docs/superpowers/plans/2026-10-26-bosta-shipping.md, BS-03).
--
-- 1. store_integrations accepts provider 'bosta'. The seller's Bosta API key
--    and the per-store webhook token live in credentials_encrypted (AES-256-GCM,
--    app-side); config holds the pickup location and shipping options only.
-- 2. shipments gets the carrier's own delivery id and state, the integration
--    that created it, and an attention flag for the seller.
-- 3. shipment_carrier_events: the carrier's status history, one row per
--    (shipment, state, time), so a replayed webhook is a no-op. Server-only.
-- 4. seller_notifications accepts the two Bosta notification types.
--
-- Additive and idempotent: the code that does not know Bosta keeps working.

-- 1. Provider list (same list as 0056 plus 'bosta').
ALTER TABLE store_integrations DROP CONSTRAINT IF EXISTS store_integrations_provider_check;
ALTER TABLE store_integrations ADD CONSTRAINT store_integrations_provider_check CHECK (provider IN (
  'meta_pixel', 'meta_capi', 'google_analytics', 'google_tag_manager',
  'tiktok_pixel', 'snapchat_pixel', 'google_sheets', 'shopify_import', 'bosta'
));

-- 2. Carrier fields on shipments.
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS external_id text;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS external_state_code smallint;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS external_state text;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS store_integration_id uuid;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS needs_attention boolean NOT NULL DEFAULT false;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS last_error text;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS create_attempts smallint NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipments_store_integration_id_fkey') THEN
    ALTER TABLE shipments
      ADD CONSTRAINT shipments_store_integration_id_fkey
      FOREIGN KEY (store_integration_id) REFERENCES store_integrations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- One Tallaby shipment per carrier delivery.
CREATE UNIQUE INDEX IF NOT EXISTS shipments_carrier_external_id_key
  ON shipments (carrier, external_id) WHERE external_id IS NOT NULL;

-- The sync cron's work list: carrier shipments that are not final yet.
CREATE INDEX IF NOT EXISTS shipments_carrier_open_idx
  ON shipments (store_integration_id, last_synced_at)
  WHERE store_integration_id IS NOT NULL AND status NOT IN ('delivered', 'returned', 'cancelled');

-- The orders filter "Bosta: needs attention".
CREATE INDEX IF NOT EXISTS shipments_needs_attention_idx
  ON shipments (seller_id) WHERE needs_attention;

-- 3. Carrier status history.
CREATE TABLE IF NOT EXISTS shipment_carrier_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  carrier text NOT NULL,
  state_code smallint NOT NULL,
  state_text text,
  exception_code smallint,
  exception_reason text,
  occurred_at timestamptz NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shipment_carrier_events_dedupe_key UNIQUE (shipment_id, state_code, occurred_at)
);

CREATE INDEX IF NOT EXISTS shipment_carrier_events_shipment_idx
  ON shipment_carrier_events (shipment_id, occurred_at DESC);

ALTER TABLE shipment_carrier_events ENABLE ROW LEVEL SECURITY;

-- 4. Seller notification types (same list as 0098 plus the two Bosta ones).
ALTER TABLE seller_notifications DROP CONSTRAINT IF EXISTS seller_notifications_type_check;
ALTER TABLE seller_notifications ADD CONSTRAINT seller_notifications_type_check CHECK (type IN (
  'order_created', 'top_up_approved', 'top_up_rejected', 'question_received', 'review_received',
  'carrier_shipment_failed', 'carrier_needs_attention'
));

-- Rollback (only once no row uses the new values):
--   DROP TABLE shipment_carrier_events;
--   DROP INDEX shipments_carrier_external_id_key, shipments_carrier_open_idx, shipments_needs_attention_idx;
--   ALTER TABLE shipments DROP CONSTRAINT shipments_store_integration_id_fkey,
--     DROP COLUMN external_id, DROP COLUMN external_state_code, DROP COLUMN external_state,
--     DROP COLUMN store_integration_id, DROP COLUMN last_synced_at, DROP COLUMN needs_attention,
--     DROP COLUMN last_error, DROP COLUMN create_attempts;
--   Restore the 0056 provider check and the 0098 notification type check.
