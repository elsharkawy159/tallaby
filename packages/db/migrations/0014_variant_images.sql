ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS images jsonb;

-- Backfill from legacy single image column
UPDATE product_variants
SET images = jsonb_build_array(image_url)
WHERE images IS NULL
  AND image_url IS NOT NULL
  AND image_url <> '';
