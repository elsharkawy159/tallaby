-- 0144: manual orders (ROADMAP.md F-05, docs/superpowers/specs/2026-10-30-manual-orders-design.md).
--
-- A seller enters an order taken by phone or chat. It runs through the same
-- checkout code as a store order, so it needs a store id: the fill trigger now
-- copies carts.store_id for 'manual' orders too. Compared as text, because a new
-- enum value can't be used in the transaction that adds it.
--
-- Additive and idempotent. Old code never writes 'manual' and ignores the value.

ALTER TYPE public.order_source ADD VALUE IF NOT EXISTS 'manual';

CREATE OR REPLACE FUNCTION public.orders_fill_store_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.store_id IS NULL AND NEW.order_source::text IN ('storefront', 'manual') AND NEW.cart_id IS NOT NULL THEN
    SELECT store_id INTO NEW.store_id FROM carts WHERE id = NEW.cart_id;
  END IF;
  RETURN NEW;
END;
$$;

-- The auto-cancel job for order links that were never confirmed.
CREATE INDEX IF NOT EXISTS orders_manual_link_pending_idx
  ON public.orders (created_at)
  WHERE status = 'pending' AND metadata -> 'manualOrder' ->> 'awaitingCustomer' = 'true';

-- Rollback: an enum value can't be dropped. Restore the function from 0050 and
-- DROP INDEX orders_manual_link_pending_idx; old code ignores 'manual' rows.
