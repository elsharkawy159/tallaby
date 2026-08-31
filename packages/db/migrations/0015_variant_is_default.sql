ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- One default per product: prefer position 1 when no flag is set yet
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY product_id
      ORDER BY position ASC NULLS LAST, created_at ASC
    ) AS rn
  FROM product_variants
  WHERE is_default = false
)
UPDATE product_variants pv
SET is_default = true
FROM ranked r
WHERE pv.id = r.id
  AND r.rn = 1
  AND NOT EXISTS (
    SELECT 1
    FROM product_variants other
    WHERE other.product_id = pv.product_id
      AND other.is_default = true
  );

CREATE UNIQUE INDEX IF NOT EXISTS product_variants_one_default_per_product_idx
  ON product_variants (product_id)
  WHERE is_default = true;
