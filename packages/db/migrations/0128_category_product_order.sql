-- 0128: Manual product order inside a seller category (ROADMAP.md F-24d).
--
-- Products › Categories › "Arrange products": the seller drags their
-- products into order inside one of their own categories
-- (seller_product_categories, 0068). The store's category pages and the
-- builder's category product lists use that order as their default sort
-- ("Featured"): positioned products first (position ascending), then the
-- rest newest first.
--
-- * One row per category + product. A product that later moves to another
--   category keeps its old row, which is simply never read (the storefront
--   joins on the product's current category); a deleted product or category
--   removes its rows (cascade).
-- * Positions are written only by the dashboard action, which checks that the
--   category and every product belong to the session's seller.
-- * A separate table (not a products column) so nothing that selects every
--   products column depends on it: additive, safe to apply before or after the
--   deploy (until it exists, the storefront query's "Featured" order fails, so
--   apply it before deploying).
--
-- Server-only (RLS on, no policies). Idempotent.

CREATE TABLE IF NOT EXISTS public.seller_category_product_positions (
  seller_category_id uuid NOT NULL REFERENCES public.seller_product_categories(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  position integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seller_category_product_positions_pkey PRIMARY KEY (seller_category_id, product_id),
  CONSTRAINT seller_category_product_positions_position_check CHECK (position >= 0)
);

-- Cascade from products, and the seller-scoped rewrite.
CREATE INDEX IF NOT EXISTS seller_category_product_positions_product_idx
  ON public.seller_category_product_positions (product_id);
CREATE INDEX IF NOT EXISTS seller_category_product_positions_seller_idx
  ON public.seller_category_product_positions (seller_id);

ALTER TABLE public.seller_category_product_positions ENABLE ROW LEVEL SECURITY;
