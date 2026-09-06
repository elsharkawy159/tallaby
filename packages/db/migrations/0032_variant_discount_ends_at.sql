-- Vendor-set discount expiry on variant price; null = no expiry.
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS discount_ends_at timestamptz;
