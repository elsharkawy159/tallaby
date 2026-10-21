-- 0093: store shipping zones cover places (EG, EG/CAIRO, EG/CAIRO/nasr-city), not only governorates.
-- Additive and idempotent. `governorates` stays (older code still writes it); `per_kg_surcharge` is left alone.
-- No cardinality(places) > 0 CHECK: older code inserts zones without places. The app (zod) enforces non-empty places.
-- Order matters: the backfill UPDATE fires the deferred overlap trigger, and Postgres refuses ALTER TABLE on a
-- table with pending trigger events in the same transaction (55006). So every ALTER runs first, the UPDATE last.

ALTER TABLE store_shipping_zones ADD COLUMN IF NOT EXISTS places text[] NOT NULL DEFAULT '{}';
ALTER TABLE store_shipping_zones ALTER COLUMN governorates SET DEFAULT '{}';
ALTER TABLE store_shipping_zones DROP CONSTRAINT IF EXISTS store_shipping_zones_governorates_check;

-- Same-key overlap guard over both columns (legacy governorates read as EG/<g>), so rows written by older code still count.
CREATE OR REPLACE FUNCTION store_shipping_zones_no_overlap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  cur store_shipping_zones%ROWTYPE;
BEGIN
  SELECT * INTO cur FROM store_shipping_zones WHERE id = NEW.id;
  IF FOUND AND cur.enabled AND EXISTS (
    SELECT 1 FROM store_shipping_zones z
    WHERE z.store_id = cur.store_id AND z.id <> cur.id AND z.enabled
      AND (z.places || ARRAY(SELECT 'EG/' || g FROM unnest(z.governorates) AS g))
          && (cur.places || ARRAY(SELECT 'EG/' || g FROM unnest(cur.governorates) AS g))
  ) THEN
    RAISE EXCEPTION 'store_shipping_zones: a place is already in another enabled zone of store %', cur.store_id
      USING ERRCODE = 'exclusion_violation';
  END IF;
  RETURN NULL;
END;
$$;

UPDATE store_shipping_zones
SET places = ARRAY(SELECT 'EG/' || g FROM unnest(governorates) AS g)
WHERE places = '{}' AND cardinality(governorates) > 0;

-- Rollback: ALTER TABLE store_shipping_zones DROP COLUMN places; restore the 0057 function and governorates check.
