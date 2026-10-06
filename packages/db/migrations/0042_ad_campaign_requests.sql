-- Seller ad campaign requests ("Advertise your products").
--
-- A seller picks an ad package, picks one of their products, pays by Vodafone
-- Cash and submits the number they paid from. The row is a REQUEST: the team
-- checks the transfer, then moves it pending -> approved -> active ->
-- completed (or rejected). The package catalog lives in code
-- (apps/dashboard/lib/ad-packages.ts); `amount` snapshots the price at submit
-- time so a later price change never rewrites history.
--
-- One open request per product (pending/approved/active) so a seller can't
-- pay twice for the same product by accident.
--
-- Idempotent, like 0040. Server-side (Drizzle) access only.

DO $$ BEGIN
  CREATE TYPE ad_request_status AS ENUM ('pending', 'approved', 'active', 'completed', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ad_campaign_requests (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_id          uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  package_key         text NOT NULL,
  amount              numeric(10, 2) NOT NULL,
  currency            text NOT NULL DEFAULT 'EGP',
  payment_method      text NOT NULL DEFAULT 'vodafone_cash',
  payer_phone         text NOT NULL,
  transfer_reference  text,
  status              ad_request_status NOT NULL DEFAULT 'pending',
  admin_notes         text,
  starts_at           timestamptz,
  ends_at             timestamptz,
  reviewed_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_campaign_requests_seller_created_idx
  ON ad_campaign_requests (seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ad_campaign_requests_status_idx
  ON ad_campaign_requests (status);

CREATE UNIQUE INDEX IF NOT EXISTS ad_campaign_requests_open_product_idx
  ON ad_campaign_requests (product_id)
  WHERE status IN ('pending', 'approved', 'active');

ALTER TABLE ad_campaign_requests ENABLE ROW LEVEL SECURITY;
