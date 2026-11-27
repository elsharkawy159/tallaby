-- 0185: Downsell offers (ROADMAP.md F-114, owner 2026-11-27).
--
-- When a shopper tries to leave a store website's checkout without ordering,
-- the checkout shows one offer the seller picked for a product in the cart:
-- a cheaper product of the same store, or one of the store's coupons. The
-- offer is applied through the existing cart and coupon code, so no new price
-- or discount rule lives here. The app's on/off is its `store_app_installs`
-- row (`app_key = 'downsell'`).
--
-- Server-only (RLS on, no policies). One offer per product per store.
-- Additive and idempotent; the code reads "no table" as "no offers", so it
-- can be applied before or after the deploy. Not applied anywhere yet.

CREATE TABLE IF NOT EXISTS public.product_downsells (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id        uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  store_id         uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- Exactly one of these two.
  offer_product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  coupon_id        uuid REFERENCES public.coupons(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_downsells_one_offer CHECK (num_nonnulls(offer_product_id, coupon_id) = 1),
  CONSTRAINT product_downsells_not_self CHECK (offer_product_id IS NULL OR offer_product_id <> product_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS product_downsells_store_product_key
  ON public.product_downsells (store_id, product_id);
CREATE INDEX IF NOT EXISTS product_downsells_seller_store_idx
  ON public.product_downsells (seller_id, store_id);

ALTER TABLE public.product_downsells ENABLE ROW LEVEL SECURITY;

-- Rollback: DROP TABLE IF EXISTS public.product_downsells;
