ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS free_delivery boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS seller_free_delivery_idx
  ON sellers (free_delivery)
  WHERE free_delivery = true;
