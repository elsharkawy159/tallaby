-- 0147: quantity offers on a product (ROADMAP.md F-07,
-- docs/superpowers/specs/2026-11-04-quantity-offers-design.md).
--
-- "Buy 2, save 10%". The seller sets tiers in the product form. The discount is
-- computed in place-order from these rows and comes out of the seller's own line.
-- The cart never stores a tier, so a tier that changes charges the current one.
--
-- Additive and idempotent. Nothing selects it until the code that reads it is
-- deployed, so apply on staging, then production, before deploying.

CREATE TABLE IF NOT EXISTS public.product_quantity_offers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id      uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  product_id     uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  min_quantity   integer NOT NULL CHECK (min_quantity BETWEEN 2 AND 1000),
  discount_type  text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric(10,2) NOT NULL CHECK (discount_value > 0),
  is_active      boolean NOT NULL DEFAULT true,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_quantity_offers_percent CHECK (discount_type <> 'percent' OR discount_value BETWEEN 1 AND 90)
);

CREATE UNIQUE INDEX IF NOT EXISTS product_quantity_offers_unique
  ON public.product_quantity_offers (seller_id, product_id, min_quantity);
CREATE INDEX IF NOT EXISTS product_quantity_offers_product_idx
  ON public.product_quantity_offers (product_id) WHERE is_active;

-- Server-only.
ALTER TABLE public.product_quantity_offers ENABLE ROW LEVEL SECURITY;

-- Rollback: DROP TABLE public.product_quantity_offers;
