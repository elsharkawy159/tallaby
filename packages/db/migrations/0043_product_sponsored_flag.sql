ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sponsored boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS product_sponsored_idx
  ON products (sponsored)
  WHERE sponsored = true;
