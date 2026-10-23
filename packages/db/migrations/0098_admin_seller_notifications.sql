-- In-app notifications for the two back offices: the admin app's header bell
-- (`admin_notifications`) and the seller dashboard's header bell
-- (`seller_notifications`).
--
-- The existing `notifications` table is NOT touched: it is the storefront
-- customer bell (returns, affiliate commissions, shipment updates; 0023 adds
-- its realtime trigger), and repurposing it would break that bell.
--
-- Rows are written by AFTER triggers on the source tables, not by app code:
-- orders reach the database from the marketplace, storefronts, external orders
-- and admin, and a trigger covers every path inside the same transaction (a
-- rolled-back order leaves no notification). Each row carries a `dedupe_key`
-- and is inserted with ON CONFLICT DO NOTHING, so one event is one row however
-- many times the trigger fires (one order with three items from the same
-- seller is one "new order").
--
-- Rows hold a `type` and `data`, not rendered text: each app renders the
-- message in the viewer's language (the dashboard is Arabic-first).
--
-- Both tables are server-only: RLS on with no policies (CLAUDE.md rule 6). An
-- insert broadcasts a content-free nudge on a private realtime topic so the
-- bell refetches through its session-scoped server action; nothing about the
-- notification crosses the socket.
--
-- Additive and idempotent.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  seller_id uuid REFERENCES public.sellers(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  dedupe_key text NOT NULL,
  -- One shared inbox for the admin team: whoever reads it marks it read for all.
  read_at timestamptz,
  read_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_notifications_dedupe_key UNIQUE (dedupe_key),
  CONSTRAINT admin_notifications_type_check CHECK (
    type IN ('seller_created', 'store_created', 'store_published', 'top_up_requested')
  )
);

CREATE INDEX IF NOT EXISTS admin_notifications_created_idx
  ON public.admin_notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_notifications_unread_idx
  ON public.admin_notifications (created_at DESC) WHERE read_at IS NULL;

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.seller_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seller_notifications_dedupe_key UNIQUE (seller_id, dedupe_key),
  CONSTRAINT seller_notifications_type_check CHECK (
    type IN ('order_created', 'top_up_approved', 'top_up_rejected', 'question_received', 'review_received')
  )
);

CREATE INDEX IF NOT EXISTS seller_notifications_seller_created_idx
  ON public.seller_notifications (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS seller_notifications_seller_unread_idx
  ON public.seller_notifications (seller_id) WHERE read_at IS NULL;

ALTER TABLE public.seller_notifications ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Realtime nudges (same pattern as 0023's customer bell)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.broadcast_admin_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    PERFORM realtime.send(
      jsonb_build_object('type', new.type),
      'admin_notification',
      'admin:notifications',
      true
    );
  EXCEPTION WHEN others THEN
    NULL;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS admin_notifications_realtime_broadcast ON public.admin_notifications;
CREATE TRIGGER admin_notifications_realtime_broadcast
  AFTER INSERT ON public.admin_notifications
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_admin_notification();

-- sellers.id = users.id, so the seller's own `user:<id>` topic is reused; 0023's
-- "user_reads_own_topic" policy already lets only that user listen. A distinct
-- event name keeps it apart from the customer bell's `notification` event.
CREATE OR REPLACE FUNCTION public.broadcast_seller_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    PERFORM realtime.send(
      jsonb_build_object('type', new.type),
      'seller_notification',
      'user:' || new.seller_id::text,
      true
    );
  EXCEPTION WHEN others THEN
    NULL;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS seller_notifications_realtime_broadcast ON public.seller_notifications;
CREATE TRIGGER seller_notifications_realtime_broadcast
  AFTER INSERT ON public.seller_notifications
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_seller_notification();

-- Verified, unsuspended platform admins (is_platform_admin(), 0073) may listen
-- on the admin topic.
DROP POLICY IF EXISTS "admins_read_admin_topic" ON realtime.messages;
CREATE POLICY "admins_read_admin_topic" ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    realtime.topic() = 'admin:notifications'
    AND (SELECT public.is_platform_admin())
  );

-- ---------------------------------------------------------------------------
-- Admin events
-- ---------------------------------------------------------------------------

-- A notification must never block the write that caused it, so every event
-- function swallows its own errors.

-- New seller signed up.
CREATE OR REPLACE FUNCTION public.notify_admin_seller_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, dedupe_key)
    VALUES (
      'seller_created',
      jsonb_build_object('sellerName', coalesce(nullif(new.display_name, ''), new.business_name)),
      new.id,
      'seller_created:' || new.id::text
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_seller_created: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS sellers_notify_admin_created ON public.sellers;
CREATE TRIGGER sellers_notify_admin_created
  AFTER INSERT ON public.sellers
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_seller_created();

-- An extra store was opened. The primary store comes with the seller, so it is
-- covered by `seller_created`.
CREATE OR REPLACE FUNCTION public.notify_admin_store_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  IF new.is_primary THEN
    RETURN NULL;
  END IF;
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, store_id, dedupe_key)
    VALUES (
      'store_created',
      jsonb_build_object('storeName', new.name, 'subdomain', new.subdomain),
      new.seller_id,
      new.id,
      'store_created:' || new.id::text
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_store_created: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS stores_notify_admin_created ON public.stores;
CREATE TRIGGER stores_notify_admin_created
  AFTER INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_store_created();

-- A store's website went live for the first time (republishing is routine and
-- is not announced).
CREATE OR REPLACE FUNCTION public.notify_admin_store_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, store_id, dedupe_key)
    VALUES (
      'store_published',
      jsonb_build_object('storeName', new.name, 'subdomain', new.subdomain),
      new.seller_id,
      new.id,
      'store_published:' || new.id::text
    )
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_store_published: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS stores_notify_admin_published ON public.stores;
CREATE TRIGGER stores_notify_admin_published
  AFTER UPDATE OF first_published_at ON public.stores
  FOR EACH ROW
  WHEN (old.first_published_at IS NULL AND new.first_published_at IS NOT NULL)
  EXECUTE FUNCTION public.notify_admin_store_published();

-- A manual (Vodafone Cash / InstaPay) top-up is waiting for review. Card
-- top-ups (Kashier) settle on their own and need no admin.
CREATE OR REPLACE FUNCTION public.notify_admin_top_up_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  IF new.status <> 'pending' OR new.provider NOT IN ('vodafone_cash', 'instapay') THEN
    RETURN NULL;
  END IF;
  BEGIN
    INSERT INTO public.admin_notifications (type, data, seller_id, dedupe_key)
    SELECT
      'top_up_requested',
      jsonb_build_object(
        'amount', new.amount::text,
        'method', new.provider,
        'sellerName', coalesce(nullif(s.display_name, ''), s.business_name)
      ),
      new.seller_id,
      'top_up_requested:' || new.id::text
    FROM public.sellers s
    WHERE s.id = new.seller_id
    ON CONFLICT (dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_admin_top_up_requested: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS seller_wallet_top_ups_notify_admin ON public.seller_wallet_top_ups;
CREATE TRIGGER seller_wallet_top_ups_notify_admin
  AFTER INSERT ON public.seller_wallet_top_ups
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_top_up_requested();

-- ---------------------------------------------------------------------------
-- Seller events
-- ---------------------------------------------------------------------------

-- One "new order" per (order, seller). Called when an order item is inserted
-- and when an online-payment order leaves `payment_processing` (it is not a
-- real order until it is paid; a failed payment never notifies).
CREATE OR REPLACE FUNCTION public.notify_seller_order_created(p_order_id uuid, p_seller_id uuid)
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
    'order_created',
    jsonb_build_object('orderId', o.id, 'orderNumber', o.order_number),
    'order_created:' || o.id::text
  FROM public.orders o
  WHERE o.id = p_order_id
    AND o.status IS DISTINCT FROM 'payment_processing'
    AND o.status IS DISTINCT FROM 'cancelled'
  ON CONFLICT (seller_id, dedupe_key) DO NOTHING;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_seller_order_created(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_seller_order_item_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    PERFORM public.notify_seller_order_created(new.order_id, new.seller_id);
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_seller_order_item_created: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS order_items_notify_seller ON public.order_items;
CREATE TRIGGER order_items_notify_seller
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.notify_seller_order_item_created();

CREATE OR REPLACE FUNCTION public.notify_seller_order_paid()
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
      PERFORM public.notify_seller_order_created(new.id, v_seller_id);
    END LOOP;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_seller_order_paid: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS orders_notify_seller_paid ON public.orders;
CREATE TRIGGER orders_notify_seller_paid
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (
    old.status = 'payment_processing'
    AND new.status IS DISTINCT FROM 'payment_processing'
    AND new.status IS DISTINCT FROM 'cancelled'
  )
  EXECUTE FUNCTION public.notify_seller_order_paid();

-- An admin approved or rejected the seller's manual top-up.
CREATE OR REPLACE FUNCTION public.notify_seller_top_up_reviewed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_type text := CASE new.status WHEN 'succeeded' THEN 'top_up_approved' ELSE 'top_up_rejected' END;
BEGIN
  BEGIN
    INSERT INTO public.seller_notifications (seller_id, type, data, dedupe_key)
    VALUES (
      new.seller_id,
      v_type,
      jsonb_build_object('amount', new.amount::text, 'method', new.provider, 'reason', new.failure_reason),
      v_type || ':' || new.id::text
    )
    ON CONFLICT (seller_id, dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_seller_top_up_reviewed: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS seller_wallet_top_ups_notify_seller ON public.seller_wallet_top_ups;
CREATE TRIGGER seller_wallet_top_ups_notify_seller
  AFTER UPDATE OF status ON public.seller_wallet_top_ups
  FOR EACH ROW
  WHEN (
    old.status = 'pending'
    AND new.status IN ('succeeded', 'failed')
    AND new.provider IN ('vodafone_cash', 'instapay')
  )
  EXECUTE FUNCTION public.notify_seller_top_up_reviewed();

-- A customer asked a question about one of the seller's products.
CREATE OR REPLACE FUNCTION public.notify_seller_question_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    INSERT INTO public.seller_notifications (seller_id, type, data, dedupe_key)
    SELECT
      p.seller_id,
      'question_received',
      jsonb_build_object('productId', p.id),
      'question_received:' || new.id::text
    FROM public.products p
    WHERE p.id = new.product_id
    ON CONFLICT (seller_id, dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_seller_question_received: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS product_questions_notify_seller ON public.product_questions;
CREATE TRIGGER product_questions_notify_seller
  AFTER INSERT ON public.product_questions
  FOR EACH ROW EXECUTE FUNCTION public.notify_seller_question_received();

-- A customer reviewed the seller (store review) or one of its products.
CREATE OR REPLACE FUNCTION public.notify_seller_review_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    INSERT INTO public.seller_notifications (seller_id, type, data, dedupe_key)
    SELECT
      coalesce(new.seller_id, p.seller_id),
      'review_received',
      jsonb_build_object('rating', new.rating, 'productId', p.id),
      'review_received:' || new.id::text
    FROM (SELECT 1) AS one
    LEFT JOIN public.products p ON p.id = new.product_id
    WHERE coalesce(new.seller_id, p.seller_id) IS NOT NULL
    ON CONFLICT (seller_id, dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_seller_review_received: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS reviews_notify_seller ON public.reviews;
CREATE TRIGGER reviews_notify_seller
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_seller_review_received();
