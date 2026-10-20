-- 0057_store_shipping.sql (PLAN.md §8.7, §11.8b, P1-02; UI in P3-08)
--
-- Own-delivery shipping zones per store. Governorates use the canonical keys
-- from packages/lib/src/shipping. Store-level rules (method tallaby | own,
-- handling days, store-wide free-over offer) live in stores.settings.shipping.
-- Money is numeric(10,2); the app computes in integer piastres.
--
-- Idempotent. RLS enabled with no policies (server-side Drizzle only).

CREATE TABLE IF NOT EXISTS store_shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name jsonb NOT NULL,                                  -- {ar, en}
  governorates text[] NOT NULL,
  price numeric(10,2) NOT NULL,
  per_kg_surcharge numeric(10,2) NOT NULL DEFAULT 0,
  free_over numeric(10,2),                              -- NULL = never free
  delivery_days_min integer NOT NULL DEFAULT 1,
  delivery_days_max integer NOT NULL DEFAULT 3,
  cod_enabled boolean NOT NULL DEFAULT true,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_shipping_zones_price_check CHECK (price >= 0),
  CONSTRAINT store_shipping_zones_per_kg_check CHECK (per_kg_surcharge >= 0),
  CONSTRAINT store_shipping_zones_free_over_check CHECK (free_over IS NULL OR free_over >= 0),
  CONSTRAINT store_shipping_zones_days_check CHECK (delivery_days_min >= 0 AND delivery_days_max >= delivery_days_min),
  CONSTRAINT store_shipping_zones_governorates_check CHECK (cardinality(governorates) > 0)
);

CREATE INDEX IF NOT EXISTS store_shipping_zones_store_idx ON store_shipping_zones (store_id);

ALTER TABLE store_shipping_zones ENABLE ROW LEVEL SECURITY;

-- A governorate may belong to only one ENABLED zone per store (also checked in
-- the app). Deferred, so a save that moves a governorate between two zones in
-- one transaction is checked once at commit.
CREATE OR REPLACE FUNCTION store_shipping_zones_no_overlap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  cur store_shipping_zones%ROWTYPE;
BEGIN
  -- Deferred: check the row as it is at commit time, not as it was queued.
  SELECT * INTO cur FROM store_shipping_zones WHERE id = NEW.id;
  IF FOUND AND cur.enabled AND EXISTS (
    SELECT 1 FROM store_shipping_zones z
    WHERE z.store_id = cur.store_id AND z.id <> cur.id AND z.enabled
      AND z.governorates && cur.governorates
  ) THEN
    RAISE EXCEPTION 'store_shipping_zones: a governorate is already in another enabled zone of store %', cur.store_id
      USING ERRCODE = 'exclusion_violation';
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS store_shipping_zones_no_overlap ON store_shipping_zones;
CREATE CONSTRAINT TRIGGER store_shipping_zones_no_overlap
  AFTER INSERT OR UPDATE ON store_shipping_zones
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION store_shipping_zones_no_overlap();

-- Rollback: DROP TABLE store_shipping_zones; DROP FUNCTION store_shipping_zones_no_overlap.
