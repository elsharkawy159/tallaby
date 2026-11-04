-- 0145: cross-sell offers under a product (ROADMAP.md F-32,
-- docs/superpowers/specs/2026-10-30-cross-sell-design.md).
--
-- The seller links an offer in the product form. The discount is computed in
-- place-order and comes out of the seller's own line. cart_items.cross_sell_id
-- records that the customer took the offer; the price on the cart stays full.
--
-- Additive and idempotent. Apply before deploying: the Drizzle queries on stores
-- and cart_items select every column.

CREATE TABLE IF NOT EXISTS public.product_cross_sells (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id        uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  -- NULL = every store of the seller.
  store_id         uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  offer_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- NULL = any variant of the offer product.
  offer_variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  discount_type    text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value   numeric(10,2) NOT NULL CHECK (discount_value > 0),
  is_active        boolean NOT NULL DEFAULT true,
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_cross_sells_not_self CHECK (product_id <> offer_product_id),
  CONSTRAINT product_cross_sells_percent CHECK (discount_type <> 'percent' OR discount_value <= 90)
);

CREATE UNIQUE INDEX IF NOT EXISTS product_cross_sells_unique
  ON public.product_cross_sells (
    seller_id,
    coalesce(store_id, '00000000-0000-0000-0000-000000000000'::uuid),
    product_id,
    offer_product_id,
    coalesce(offer_variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
CREATE INDEX IF NOT EXISTS product_cross_sells_product_idx
  ON public.product_cross_sells (product_id) WHERE is_active;

-- Server-only.
ALTER TABLE public.product_cross_sells ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS cross_sell_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS cross_sell_id uuid
  REFERENCES public.product_cross_sells(id) ON DELETE SET NULL;

-- Rollback: ALTER TABLE cart_items DROP COLUMN cross_sell_id;
-- ALTER TABLE stores DROP COLUMN cross_sell_enabled; DROP TABLE product_cross_sells;
