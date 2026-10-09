-- Each seller storefront ({subdomain}.tallaby.com) has its own cart.
--
--   carts.store_seller_id   NULL  = the tallaby.com marketplace cart
--                           <id>  = the cart for that seller's storefront,
--                                   which only ever holds that seller's products
--
-- A shopper can therefore have one active marketplace cart plus one active
-- cart per storefront, and checking out on a storefront only orders what is in
-- that storefront's cart.
--
-- Orders placed from a storefront are tagged order_source = 'storefront' so
-- sellers and admins can tell them apart.
--
-- Idempotent. Server-side (Drizzle) access only.

ALTER TABLE carts
  ADD COLUMN IF NOT EXISTS store_seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE;

-- Active-cart lookup: (user, storefront, status).
CREATE INDEX IF NOT EXISTS carts_user_store_status_idx
  ON carts (user_id, store_seller_id, status);

-- Cannot run inside the same transaction that first uses the new value; the
-- app only writes it after this migration has been applied.
ALTER TYPE order_source ADD VALUE IF NOT EXISTS 'storefront';
