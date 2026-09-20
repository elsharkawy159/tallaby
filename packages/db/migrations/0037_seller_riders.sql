-- Seller-owned riders. A rider is an ordinary platform user (role = 'driver');
-- this table links it to the one seller who manages it from the seller
-- dashboard's Shipping page. A rider belongs to at most one seller.
CREATE TABLE IF NOT EXISTS seller_riders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id  uuid NOT NULL REFERENCES sellers (id) ON DELETE CASCADE,
  rider_id   uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT seller_riders_rider_id_unique UNIQUE (rider_id)
);

CREATE INDEX IF NOT EXISTS seller_riders_seller_id_idx ON seller_riders (seller_id);

-- Server-side (Drizzle) access only; no PostgREST exposure.
ALTER TABLE seller_riders ENABLE ROW LEVEL SECURITY;
