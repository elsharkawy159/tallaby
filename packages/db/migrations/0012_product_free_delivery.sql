ALTER TABLE products
  ADD COLUMN IF NOT EXISTS free_delivery boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS product_free_delivery_idx
  ON products (free_delivery)
  WHERE free_delivery = true;
