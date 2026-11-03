-- 0139_store_app_installs.sql (owner, 2026-11-03; ROADMAP.md F-47; design:
-- docs/superpowers/specs/2026-11-03-apps-marketplace-design.md)
--
-- Additive and idempotent. One row per install of a catalog app on a store, with
-- the price the seller agreed to. Connected integrations keep their
-- store_integrations rows; nothing here changes them. Server-only: RLS on, no
-- policies. The dashboard Apps page reads this table, so apply it before deploying.

BEGIN;

CREATE TABLE IF NOT EXISTS store_app_installs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  app_key text NOT NULL,
  pricing_model text NOT NULL
    CHECK (pricing_model IN ('free', 'one_time', 'monthly', 'per_order', 'usage')),
  price_usd_cents integer NOT NULL DEFAULT 0,
  usage_unit text CHECK (usage_unit IS NULL OR usage_unit IN ('action', 'minute', 'hour', 'day')),
  -- Monthly apps only: the paid period.
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  -- Set when the wallet couldn't pay; the app is removed once this has passed.
  grace_until timestamptz,
  installed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  installed_at timestamptz NOT NULL DEFAULT now(),
  uninstalled_at timestamptz,
  uninstall_reason text
    CHECK (uninstall_reason IS NULL OR uninstall_reason IN ('seller', 'payment_failed', 'retired')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_app_installs_price_check CHECK (
    (pricing_model = 'free' AND price_usd_cents = 0) OR (pricing_model <> 'free' AND price_usd_cents > 0)
  ),
  CONSTRAINT store_app_installs_usage_unit_pair_check CHECK ((pricing_model = 'usage') = (usage_unit IS NOT NULL)),
  CONSTRAINT store_app_installs_period_check CHECK (
    pricing_model <> 'monthly' OR (current_period_start IS NOT NULL AND current_period_end IS NOT NULL)
  )
);
ALTER TABLE store_app_installs ENABLE ROW LEVEL SECURITY;

-- One live install per store and app; history stays.
CREATE UNIQUE INDEX IF NOT EXISTS store_app_installs_live_once
  ON store_app_installs (store_id, app_key) WHERE uninstalled_at IS NULL;
CREATE INDEX IF NOT EXISTS store_app_installs_seller_idx ON store_app_installs (seller_id);
-- The daily job's two lists.
CREATE INDEX IF NOT EXISTS store_app_installs_renewal_idx
  ON store_app_installs (current_period_end) WHERE uninstalled_at IS NULL AND pricing_model = 'monthly';
CREATE INDEX IF NOT EXISTS store_app_installs_grace_idx
  ON store_app_installs (grace_until) WHERE uninstalled_at IS NULL AND grace_until IS NOT NULL;

-- Bell types for a paid app's renewal (superset of 0137's list).
DO $$
DECLARE
  def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def FROM pg_constraint WHERE conname = 'seller_notifications_type_check';
  IF def IS NOT NULL AND def NOT LIKE '%app_renewal_failed%' THEN
    EXECUTE 'ALTER TABLE seller_notifications DROP CONSTRAINT seller_notifications_type_check';
    EXECUTE 'ALTER TABLE seller_notifications ADD CONSTRAINT seller_notifications_type_check ' ||
      regexp_replace(def, '\]', ', ''app_renewed''::text, ''app_renewal_failed''::text, ''app_ended''::text]');
  END IF;
END $$;

COMMIT;
