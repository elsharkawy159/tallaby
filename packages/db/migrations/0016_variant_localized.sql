ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS localized jsonb;
