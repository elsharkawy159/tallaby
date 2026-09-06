-- Convert product_variants.price from numeric to jsonb (same shape as products.price).
ALTER TABLE product_variants
  ALTER COLUMN price TYPE jsonb
  USING CASE
    WHEN price IS NULL THEN NULL
    ELSE jsonb_build_object(
      'base', price::numeric,
      'list', price::numeric,
      'final', price::numeric,
      'discountType', null,
      'discountValue', null
    )
  END;

-- Enrich default variants from parent products.price (list / discount metadata).
UPDATE product_variants pv
SET price = jsonb_build_object(
  'base', COALESCE((p.price->>'base')::numeric, (pv.price->>'final')::numeric),
  'list', COALESCE((p.price->>'list')::numeric, (pv.price->>'final')::numeric),
  'final', (pv.price->>'final')::numeric,
  'discountType', p.price->'discountType',
  'discountValue', p.price->'discountValue'
)
FROM products p
WHERE pv.product_id = p.id
  AND pv.is_default IS TRUE
  AND p.price IS NOT NULL;
