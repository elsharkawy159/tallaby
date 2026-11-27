-- 0190_digital_orders_one_per_line.sql (ROADMAP.md F-108d: digital delivery from the seller's order screen)
--
-- One download link (digital_orders row) per digital order line. Since F-108d
-- the seller can press "Payment received" or "Create links" on an order, so
-- fulfillDigitalOrderItems now runs from the dashboard too, not only from the
-- payment webhooks and Admin. It already takes a per-order advisory lock, which
-- is what prevents duplicates; this unique partial index is the second guard.
-- order_item_id stays nullable (older rows may have none), so NULLs are left out.
--
-- Additive and idempotent. The index is created only when no order line has
-- two rows today; if some do, it says how many with a NOTICE and creates
-- nothing. No row is ever changed or deleted here: duplicates are for a person
-- to look at. No deploy-order dependency: the code works with or without it.
-- Not applied anywhere yet: staging first, then production with owner approval.

DO $$
DECLARE
  duplicate_lines integer;
BEGIN
  IF to_regclass('public.digital_orders') IS NULL THEN
    RAISE NOTICE '0190: public.digital_orders does not exist, nothing to do';
    RETURN;
  END IF;

  IF to_regclass('public.digital_orders_order_item_id_key') IS NOT NULL THEN
    RAISE NOTICE '0190: digital_orders_order_item_id_key already exists';
    RETURN;
  END IF;

  SELECT count(*) INTO duplicate_lines
  FROM (
    SELECT order_item_id
    FROM public.digital_orders
    WHERE order_item_id IS NOT NULL
    GROUP BY order_item_id
    HAVING count(*) > 1
  ) AS dup;

  IF duplicate_lines > 0 THEN
    RAISE NOTICE '0190: % order line(s) have more than one digital_orders row; index NOT created. Review them, then re-run.', duplicate_lines;
    RETURN;
  END IF;

  CREATE UNIQUE INDEX digital_orders_order_item_id_key
    ON public.digital_orders USING btree (order_item_id)
    WHERE order_item_id IS NOT NULL;
END
$$;
