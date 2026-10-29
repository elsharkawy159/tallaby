-- More seller actions in the admin header bell (0098's `admin_notifications`):
--
--   product_created       a seller added a product. One row per seller per UTC
--                         hour: more products in the same hour raise its
--                         `count` and mark it unread again, so a Shopify import
--                         of 300 products is one row, not 300.
--   first_order_received  a seller's first real order (not an unpaid online
--                         payment, not a cancelled one).
--   integration_connected a store connected an integration (Bosta, a pixel,
--                         Google Sheets, ...) for the first time.
--   store_unpublished     a published store website was taken offline (the
--                         seller's "Website live" switch).
--   store_deleted         a store was deleted (soft delete, `deleted_at`).
--
-- Same rules as 0098: AFTER triggers, a `dedupe_key` per event, ON CONFLICT,
-- and every event function swallows its own errors so a notification never
-- blocks the write that caused it. Additive and idempotent.

ALTER TABLE public.admin_notifications DROP CONSTRAINT IF EXISTS admin_notifications_type_check;
ALTER TABLE public.admin_notifications ADD CONSTRAINT admin_notifications_type_check CHECK (
  type IN (
    'seller_created', 'store_created', 'store_published', 'top_up_requested', 'feature_request_created',
    'product_created', 'first_order_received', 'integration_connected', 'store_unpublished', 'store_deleted'
  )
);

-- A grouped `product_created` row is re-raised by an UPDATE (new `created_at`),
-- so the bell also gets a nudge then. Marking read only touches `read_at`, so it
-- never nudges.
DROP TRIGGER IF EXISTS admin_notifications_realtime_broadcast_raise ON public.admin_notifications;
CREATE TRIGGER admin_notifications_realtime_broadcast_raise
  AFTER UPDATE OF created_at ON public.admin_notifications
  FOR EACH ROW
  WHEN (old.created_at IS DISTINCT FROM new.created_at)
  EXECUTE FUNCTION public.broadcast_admin_notification();

-- ---------------------------------------------------------------------------
-- Product added
-- ---------------------------------------------------------------------------

-- Deferred to commit: the dashboard and the Shopify import insert the product
-- first and its translations and store links later in the same transaction.
CREATE OR REPLACE FUNCTION public.notify_admin_product_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    INSERT INTO public.admin_notifications AS n (type, data, seller_id, store_id, dedupe_key)
    SELECT
      'product_created',
      jsonb_build_object(
        'sellerName', coalesce(nullif(s.display_name, ''), s.business_name),
        'storeName', st.name,
        'productId', new.id,
        'title', t.title,
        'count', 1
      ),
      new.seller_id,
      st.id,
      'product_created:' || new.seller_id::text || ':' || to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24')
    FROM public.sellers s
    LEFT JOIN LATERAL (
      SELECT pt.title FROM public.product_translations pt
      WHERE pt.product_id = new.id
      ORDER BY (pt.locale = 'en') DESC, pt.created_at ASC
      LIMIT 1
    ) t ON true
    LEFT JOIN LATERAL (
      SELECT x.id, x.name FROM public.store_products sp
      JOIN public.stores x ON x.id = sp.store_id
      WHERE sp.product_id = new.id
      ORDER BY x.is_primary DESC, x.created_at ASC
      LIMIT 1
    ) st ON true
    WHERE s.id = new.seller_id
      -- Created and deleted in the same transaction: nothing to announce.
      AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = new.id)
    ON CONFLICT (dedupe_key) DO UPDATE SET
      data = excluded.data || jsonb_build_object(
        'count', coalesce((n.data->>'count')::int, 1) + 1
      ),
      store_id = excluded.store_id,
      created_at = now(),
      read_at = NULL,
      read_by = NULL;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_product_created: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS products_notify_admin_created ON public.products;
CREATE CONSTRAINT TRIGGER products_notify_admin_created
  AFTER INSERT ON public.products
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_product_created();

-- ---------------------------------------------------------------------------
-- First order
-- ---------------------------------------------------------------------------

-- Same two entry points as 0098's `notify_seller_order_created`: an order item
-- is inserted, or an online-payment order leaves `payment_processing`. The key
-- is per seller, so it fires once; the NOT EXISTS keeps sellers who already had
-- real orders before this migration from getting one on their next order.
CREATE OR REPLACE FUNCTION public.notify_admin_first_order(p_order_id uuid, p_seller_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  INSERT INTO public.admin_notifications (type, data, seller_id, store_id, dedupe_key)
  SELECT
    'first_order_received',
    jsonb_build_object(
      'sellerName', coalesce(nullif(s.display_name, ''), s.business_name),
      'storeName', st.name,
      'orderId', o.id,
      'orderNumber', o.order_number
    ),
    p_seller_id,
    o.store_id,
    'first_order_received:' || p_seller_id::text
  FROM public.orders o
  JOIN public.sellers s ON s.id = p_seller_id
  LEFT JOIN public.stores st ON st.id = o.store_id
  WHERE o.id = p_order_id
    AND o.status IS DISTINCT FROM 'payment_processing'
    AND o.status IS DISTINCT FROM 'cancelled'
    AND NOT EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.orders po ON po.id = oi.order_id
      WHERE oi.seller_id = p_seller_id
        AND oi.order_id <> p_order_id
        AND po.status NOT IN ('payment_processing', 'cancelled')
    )
  ON CONFLICT (dedupe_key) DO NOTHING;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_admin_first_order(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_admin_first_order_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    PERFORM public.notify_admin_first_order(new.order_id, new.seller_id);
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_first_order_item: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS order_items_notify_admin_first_order ON public.order_items;
CREATE TRIGGER order_items_notify_admin_first_order
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_first_order_item();

CREATE OR REPLACE FUNCTION public.notify_admin_first_order_paid()
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
      PERFORM public.notify_admin_first_order(new.id, v_seller_id);
    END LOOP;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_first_order_paid: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS orders_notify_admin_first_order_paid ON public.orders;
CREATE TRIGGER orders_notify_admin_first_order_paid
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (
    old.status = 'payment_processing'
    AND new.status IS DISTINCT FROM 'payment_processing'
    AND new.status IS DISTINCT FROM 'cancelled'
  )
  EXECUTE FUNCTION public.notify_admin_first_order_paid();

-- ---------------------------------------------------------------------------
-- Integration connected
-- ---------------------------------------------------------------------------

-- First connection only: an `error` → `connected` recovery is routine.
CREATE OR REPLACE FUNCTION public.notify_admin_integration_connected()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  IF new.status <> 'connected' OR (TG_OP = 'UPDATE' AND old.status = 'connected') THEN
    RETURN NULL;
  END IF;
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, store_id, dedupe_key)
    SELECT
      'integration_connected',
      jsonb_build_object(
        'provider', new.provider,
        'storeName', st.name,
        'sellerName', coalesce(nullif(s.display_name, ''), s.business_name)
      ),
      new.seller_id,
      new.store_id,
      'integration_connected:' || new.id::text
    FROM public.sellers s
    LEFT JOIN public.stores st ON st.id = new.store_id
    WHERE s.id = new.seller_id
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_integration_connected: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS store_integrations_notify_admin_connected ON public.store_integrations;
CREATE TRIGGER store_integrations_notify_admin_connected
  AFTER INSERT OR UPDATE OF status ON public.store_integrations
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_integration_connected();

-- ---------------------------------------------------------------------------
-- Store website taken offline / store deleted
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_admin_store_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  -- TG_ARGV[0] is the notification type.
  v_type text := TG_ARGV[0];
BEGIN
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, store_id, dedupe_key)
    SELECT
      v_type,
      jsonb_build_object(
        'storeName', new.name,
        'subdomain', new.subdomain,
        'sellerName', coalesce(nullif(s.display_name, ''), s.business_name)
      ),
      new.seller_id,
      new.id,
      -- A site can go offline many times; a store is deleted once.
      CASE v_type
        WHEN 'store_unpublished' THEN v_type || ':' || new.id::text || ':' || extract(epoch FROM now())::bigint::text
        ELSE v_type || ':' || new.id::text
      END
    FROM public.sellers s
    WHERE s.id = new.seller_id
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_store_lifecycle: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS stores_notify_admin_unpublished ON public.stores;
CREATE TRIGGER stores_notify_admin_unpublished
  AFTER UPDATE OF site_status ON public.stores
  FOR EACH ROW
  WHEN (old.site_status = 'published' AND new.site_status = 'unpublished' AND new.deleted_at IS NULL)
  EXECUTE FUNCTION public.notify_admin_store_lifecycle('store_unpublished');

DROP TRIGGER IF EXISTS stores_notify_admin_deleted ON public.stores;
CREATE TRIGGER stores_notify_admin_deleted
  AFTER UPDATE OF deleted_at ON public.stores
  FOR EACH ROW
  WHEN (old.deleted_at IS NULL AND new.deleted_at IS NOT NULL)
  EXECUTE FUNCTION public.notify_admin_store_lifecycle('store_deleted');
