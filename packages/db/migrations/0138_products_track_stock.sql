-- 0138: Unlimited stock (ROADMAP.md F-51, spec 2026-11-03-unlimited-stock-design.md).
--
-- `products.track_stock` (default true): false means the seller does not count
-- this product: orders never take or give back stock and it can't sell out.
-- Its variants inherit the setting; there is no per-variant switch.
-- `products.quantity` and `product_variants.stock` are left exactly as stored,
-- so switching tracking back on carries on from the old count.
--
-- Additive: every existing row keeps tracking and behaves as before. The product
-- queries select every column, so apply before deploying the code.
--
-- The stock history triggers (0125) also write nothing for an untracked product,
-- and so send no low_stock bell. Only the guards below are new in their bodies.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS track_stock boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.products_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_old integer;
  v_new integer;
  v_threshold integer;
BEGIN
  BEGIN
    -- Untracked (0138): its stored count is not stock.
    IF new.track_stock = false THEN
      RETURN NULL;
    END IF;
    v_new := round(coalesce(new.quantity, 0))::integer;
    v_old := CASE WHEN tg_op = 'INSERT' THEN 0 ELSE round(coalesce(old.quantity, 0))::integer END;
    IF v_new = v_old THEN
      RETURN NULL;
    END IF;
    -- A product with variants sells from its variants; its own count is not stock.
    IF tg_op = 'UPDATE' AND EXISTS (SELECT 1 FROM public.product_variants v WHERE v.product_id = new.id) THEN
      RETURN NULL;
    END IF;

    PERFORM public.record_stock_movement(new.seller_id, new.id, NULL, v_new - v_old, v_new);

    v_threshold := coalesce(new.low_stock_threshold, 5);
    IF tg_op = 'UPDATE'
       AND v_old > v_threshold AND v_new <= v_threshold
       AND new.status = 'active' AND new.deleted_at IS NULL AND new.purged_at IS NULL THEN
      PERFORM public.notify_seller_low_stock(new.seller_id, new.id, NULL, greatest(v_new, 0), v_threshold);
    END IF;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'products_stock_movement: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.product_variants_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_old integer;
  v_new integer;
  v_product record;
  v_threshold integer;
BEGIN
  BEGIN
    IF new.stock IS NULL OR new.product_id IS NULL THEN
      RETURN NULL; -- untracked variant
    END IF;
    v_new := new.stock;
    v_old := CASE WHEN tg_op = 'INSERT' THEN 0 ELSE coalesce(old.stock, 0) END;
    IF v_new = v_old THEN
      RETURN NULL;
    END IF;

    SELECT p.seller_id, p.status, p.deleted_at, p.purged_at, p.low_stock_threshold, p.track_stock
      INTO v_product
    FROM public.products p
    WHERE p.id = new.product_id;
    IF NOT FOUND THEN
      RETURN NULL;
    END IF;
    -- Untracked product (0138): its variants inherit it.
    IF v_product.track_stock = false THEN
      RETURN NULL;
    END IF;

    PERFORM public.record_stock_movement(v_product.seller_id, new.product_id, new.id, v_new - v_old, v_new);

    v_threshold := coalesce(v_product.low_stock_threshold, 5);
    IF tg_op = 'UPDATE' AND old.stock IS NOT NULL
       AND v_old > v_threshold AND v_new <= v_threshold
       AND v_product.status = 'active' AND v_product.deleted_at IS NULL AND v_product.purged_at IS NULL THEN
      PERFORM public.notify_seller_low_stock(v_product.seller_id, new.product_id, new.id, v_new, v_threshold);
    END IF;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'product_variants_stock_movement: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;
