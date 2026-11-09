-- Grace period before top-up (ROADMAP.md F-84, owner 2026-11-09).
--
-- A Free seller who isn't activated has a public store that takes real orders.
-- They see their orders until the grace window ends (14 days after
-- greatest(sellers.created_at, 2026-11-09 00:00 Cairo), or their second real
-- order, whichever comes first); after that only their first order stays
-- visible until a top-up. That rule lives in code (packages/lib/src/billing/
-- order-lock.lib.ts) and needs no column.
--
-- This migration only adds the bell row that tells them, on their first real
-- order, to top up to keep seeing new ones: seller notification type
-- `first_order_top_up` (data = { orderId, orderNumber }). The seller push
-- dispatcher pushes it like the other account types (0124/0131 webhook).
--
-- "Real order" here matches getOrderLock's loadGraceOrders: a line of this
-- seller, not a test order (0155), not an online payment still waiting
-- (payment_processing, as in 0098/0116), not one the seller typed in (manual,
-- 0144), created at or after the seller's grace start. Cancelled orders count
-- as an earlier order, so only the very first one notifies. "Not activated"
-- matches getOrderLock: USD switch on, no active Pro, no succeeded top-up, no
-- `top_up` ledger entry, balance not above zero now and no USD ledger entry
-- that ever left it above zero.
--
-- Same rules as 0098/0116: AFTER triggers on the same two entry points (an
-- order item is inserted; an online-payment order leaves payment_processing),
-- one row per seller through the `dedupe_key` and ON CONFLICT, and every event
-- function swallows its own errors so a bell never blocks an order.
-- Additive and idempotent: safe to re-run.

-- Seller bell type, widened from the live definition (a superset of it).
DO $$
DECLARE
  def text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO def FROM pg_constraint WHERE conname = 'seller_notifications_type_check';
  IF def IS NOT NULL AND def NOT LIKE '%first_order_top_up%' THEN
    EXECUTE 'ALTER TABLE public.seller_notifications DROP CONSTRAINT seller_notifications_type_check';
    EXECUTE 'ALTER TABLE public.seller_notifications ADD CONSTRAINT seller_notifications_type_check ' ||
      regexp_replace(def, '\]', ', ''first_order_top_up''::text]');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.notify_seller_first_order_top_up(p_order_id uuid, p_seller_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  INSERT INTO public.seller_notifications (seller_id, store_id, type, data, dedupe_key)
  SELECT
    p_seller_id,
    o.store_id,
    'first_order_top_up',
    jsonb_build_object('orderId', o.id, 'orderNumber', o.order_number),
    'first_order_top_up:' || p_seller_id::text
  FROM public.orders o
  JOIN public.sellers s ON s.id = p_seller_id
  CROSS JOIN LATERAL (
    SELECT greatest(coalesce(s.created_at, '-infinity'::timestamptz), '2026-11-09T00:00:00+02:00'::timestamptz) AS grace_start
  ) g
  WHERE o.id = p_order_id
    AND NOT o.is_test
    AND o.status IS DISTINCT FROM 'payment_processing'
    AND o.status IS DISTINCT FROM 'cancelled'
    AND o.order_source IS DISTINCT FROM 'manual'
    AND o.created_at >= g.grace_start
    -- USD switch on (before it, nothing waits for a top-up).
    AND coalesce((SELECT b.usd_live FROM public.billing_settings b LIMIT 1), false)
    -- Not activated.
    AND NOT (
      s.plan = 'pro'
      AND (
        (s.plan_expires_at IS NULL AND s.plan_grace_until IS NULL)
        OR greatest(coalesce(s.plan_expires_at, '-infinity'::timestamptz), coalesce(s.plan_grace_until, '-infinity'::timestamptz)) > now()
      )
    )
    AND NOT EXISTS (SELECT 1 FROM public.seller_wallet_top_ups t WHERE t.seller_id = p_seller_id AND t.status = 'succeeded')
    AND NOT EXISTS (SELECT 1 FROM public.wallet_transactions w WHERE w.seller_id = p_seller_id AND w.type = 'top_up')
    AND NOT EXISTS (SELECT 1 FROM public.seller_wallet sw WHERE sw.seller_id = p_seller_id AND sw.balance > 0)
    AND NOT EXISTS (
      SELECT 1 FROM public.wallet_transactions w
      WHERE w.seller_id = p_seller_id AND w.currency = 'USD' AND w.balance_after > 0
    )
    -- The first real order of the window.
    AND NOT EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders po ON po.id = oi.order_id
      WHERE oi.seller_id = p_seller_id
        AND oi.order_id <> p_order_id
        AND NOT po.is_test
        AND po.status IS DISTINCT FROM 'payment_processing'
        AND po.order_source IS DISTINCT FROM 'manual'
        AND po.created_at >= g.grace_start
    )
  ON CONFLICT (seller_id, dedupe_key) DO NOTHING;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_seller_first_order_top_up(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_seller_first_order_top_up_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    PERFORM public.notify_seller_first_order_top_up(new.order_id, new.seller_id);
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_seller_first_order_top_up_item: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS order_items_notify_seller_first_order_top_up ON public.order_items;
CREATE TRIGGER order_items_notify_seller_first_order_top_up
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.notify_seller_first_order_top_up_item();

CREATE OR REPLACE FUNCTION public.notify_seller_first_order_top_up_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_seller_id uuid;
BEGIN
  BEGIN
    FOR v_seller_id IN
      SELECT DISTINCT oi.seller_id FROM public.order_items oi WHERE oi.order_id = new.id
    LOOP
      PERFORM public.notify_seller_first_order_top_up(new.id, v_seller_id);
    END LOOP;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_seller_first_order_top_up_paid: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS orders_notify_seller_first_order_top_up_paid ON public.orders;
CREATE TRIGGER orders_notify_seller_first_order_top_up_paid
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (
    old.status = 'payment_processing'
    AND new.status IS DISTINCT FROM 'payment_processing'
    AND new.status IS DISTINCT FROM 'cancelled'
  )
  EXECUTE FUNCTION public.notify_seller_first_order_top_up_paid();
