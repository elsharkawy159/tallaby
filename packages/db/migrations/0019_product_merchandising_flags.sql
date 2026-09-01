ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_trending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_seasonal boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS product_is_trending_idx
  ON products (is_trending)
  WHERE is_trending = true;

CREATE INDEX IF NOT EXISTS product_is_seasonal_idx
  ON products (is_seasonal)
  WHERE is_seasonal = true;
