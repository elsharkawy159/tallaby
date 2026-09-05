-- product_variants.price was a bare numeric, so a variant could only ever
-- carry a single "final" price — there was nowhere to store its own list
-- price/discount, so the storefront could never show a variant-level
-- discount (only the parent product's price json supports that: it already
-- carries {base, list, final, discountType, discountValue}). Bring the
-- variant column to the same shape so variant discounts can be computed
-- and displayed the same way product discounts are.
ALTER TABLE product_variants
  ALTER COLUMN price DROP DEFAULT,
  ALTER COLUMN price TYPE jsonb USING (
    CASE
      WHEN price IS NULL THEN NULL
      ELSE jsonb_build_object(
        'base', price,
        'list', price,
        'final', price,
        'discountType', NULL,
        'discountValue', NULL
      )
    END
  );
