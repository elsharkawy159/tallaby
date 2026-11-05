-- 0151: Minimum order quantity per product.
--
-- `products.min_order_quantity` (default 1): the fewest units of this product a
-- customer can buy in one order, summed across its variants. Existing rows get 1
-- and behave as before. The upper bound matches max_order_quantity in the MCP tools.
--
-- Additive, but the product queries select every column, so apply it before
-- deploying the code. Idempotent.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_order_quantity integer NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_min_order_quantity_check') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_min_order_quantity_check
      CHECK (min_order_quantity BETWEEN 1 AND 10000);
  END IF;
END $$;
