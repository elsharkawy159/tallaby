-- Per-variant discount expiry, set from the vendor dashboard's product form
-- toggle. Null (the default) means "no expiry" — the storefront countdown
-- only renders when this (or, for the default variant / base product, the
-- `discount_ends_at` key inside `products.price` jsonb) is set and in the
-- future.
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS discount_ends_at timestamptz;
