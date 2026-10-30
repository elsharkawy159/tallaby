-- 0125: Stock history and low-stock alerts (ROADMAP.md F-10a/F-10b).
--
-- 1. `stock_movements`: one row per change of a product's own stock
--    (`products.quantity`, used when the product has no variants) or of a
--    tracked variant's stock (`product_variants.stock`, NULL = untracked).
--    Rows are written by triggers, so no stock change is missed, whichever
--    code path made it (checkout, cancel, product form, bulk edit, import,
--    admin). The code that changes stock tells the trigger why and who
--    through transaction-local settings (`set_config(..., true)`, see
--    packages/db/src/inventory/stock-context.ts):
--      tallaby.stock_reason   'order' | 'cancel' | 'return' | 'edit' |
--                             'bulk_edit' | 'import' | 'other' (unset → 'other')
--      tallaby.stock_actor    user id (optional)
--      tallaby.stock_order_id order id (optional; the store comes from it)
--      tallaby.stock_store_id store id (optional)
--    Checkout decrements stock BEFORE it inserts the order, so an 'order'
--    row is linked to its order (and store and buyer) by an AFTER INSERT
--    trigger on order_items, matching product/variant within the same
--    transaction (`created_at = now()`, the transaction's start time).
--    `variant_id` has no foreign key on purpose: the history keeps the id
--    of a variant that was later removed. Server-only: RLS on, no policies.
--
-- 2. Seller bell type `low_stock`: when a stock change takes an active,
--    not-trashed product (no variants) or a tracked variant from ABOVE its
--    threshold to AT/BELOW it. The threshold is the product's
--    `low_stock_threshold` (0122, shared with the store badge; NULL = 5) and
--    applies to each of its variants too (no per-variant threshold, kept
--    simple). At most one alert per product/variant per Cairo day
--    (dedupe_key), and only on the downward crossing, so it never spams.
--    F-06 push (0124) has a `low_stock` switch ready for this type.
--
-- Every trigger body catches its own errors (RAISE WARNING): history and
-- alerts must never block a sale or a product save. Additive, idempotent;
-- old code is unaffected (it just records reason 'other' / 'order').

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid,
  delta integer NOT NULL,
  stock_after integer NOT NULL,
  reason text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  actor_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stock_movements_reason_check CHECK (
    reason IN ('order', 'cancel', 'return', 'edit', 'bulk_edit', 'import', 'other')
  ),
  CONSTRAINT stock_movements_delta_check CHECK (delta <> 0)
);

CREATE INDEX IF NOT EXISTS stock_movements_product_created_idx
  ON public.stock_movements (product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stock_movements_seller_created_idx
  ON public.stock_movements (seller_id, created_at DESC);
-- Checkout rows waiting for their order link (filled in the same transaction).
CREATE INDEX IF NOT EXISTS stock_movements_order_link_idx
  ON public.stock_movements (product_id, created_at)
  WHERE reason = 'order' AND order_id IS NULL;
CREATE INDEX IF NOT EXISTS stock_movements_order_idx
  ON public.stock_movements (order_id)
  WHERE order_id IS NOT NULL;

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- ── Bell type ─────────────────────────────────────────────────────────────
-- Re-creates the check with every existing type (0098, 0106, 0117, 0119)
-- plus low_stock.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'seller_notifications_type_check'
      AND pg_get_constraintdef(oid) LIKE '%low_stock%'
  ) THEN
    ALTER TABLE public.seller_notifications DROP CONSTRAINT IF EXISTS seller_notifications_type_check;
    ALTER TABLE public.seller_notifications ADD CONSTRAINT seller_notifications_type_check CHECK (type IN (
      'order_created', 'top_up_approved', 'top_up_rejected', 'question_received', 'review_received',
      'carrier_shipment_failed', 'carrier_needs_attention',
      'referral_commission_earned', 'referral_payout_paid', 'referral_payout_rejected',
      'welcome_gift_granted', 'welcome_gift_expiring', 'welcome_gift_expired',
      'low_stock'
    ));
  END IF;
END $$;

-- ── Helpers ───────────────────────────────────────────────────────────────

-- A transaction-local uuid setting, or NULL when unset/empty/invalid.
CREATE OR REPLACE FUNCTION public.stock_setting_uuid(p_name text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $fn$
DECLARE
  v text := nullif(current_setting(p_name, true), '');
BEGIN
  IF v IS NULL OR v !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN NULL;
  END IF;
  RETURN v::uuid;
END;
$fn$;

REVOKE ALL ON FUNCTION public.stock_setting_uuid(text) FROM PUBLIC, anon, authenticated;

-- Writes one movement with the transaction's reason/actor/order/store.
CREATE OR REPLACE FUNCTION public.record_stock_movement(
  p_seller_id uuid, p_product_id uuid, p_variant_id uuid, p_delta integer, p_stock_after integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_reason text := coalesce(nullif(current_setting('tallaby.stock_reason', true), ''), 'other');
  v_order uuid := public.stock_setting_uuid('tallaby.stock_order_id');
  v_store uuid := public.stock_setting_uuid('tallaby.stock_store_id');
BEGIN
  IF p_delta = 0 OR p_seller_id IS NULL THEN
    RETURN;
  END IF;
  IF v_reason NOT IN ('order', 'cancel', 'return', 'edit', 'bulk_edit', 'import', 'other') THEN
    v_reason := 'other';
  END IF;
  IF v_order IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = v_order) THEN
    v_order := NULL;
  END IF;
  IF v_store IS NULL AND v_order IS NOT NULL THEN
    SELECT o.store_id INTO v_store FROM public.orders o WHERE o.id = v_order;
  END IF;
  IF v_store IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = v_store) THEN
    v_store := NULL;
  END IF;

  INSERT INTO public.stock_movements
    (seller_id, store_id, product_id, variant_id, delta, stock_after, reason, order_id, actor_user_id)
  VALUES
    (p_seller_id, v_store, p_product_id, p_variant_id, p_delta, p_stock_after, v_reason, v_order,
     public.stock_setting_uuid('tallaby.stock_actor'));
END;
$fn$;

REVOKE ALL ON FUNCTION public.record_stock_movement(uuid, uuid, uuid, integer, integer) FROM PUBLIC, anon, authenticated;

-- One `low_stock` bell row per product/variant per Cairo day.
CREATE OR REPLACE FUNCTION public.notify_seller_low_stock(
  p_seller_id uuid, p_product_id uuid, p_variant_id uuid, p_stock integer, p_threshold integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_name text;
  v_variant_title text;
BEGIN
  SELECT t.title INTO v_name
  FROM public.product_translations t
  WHERE t.product_id = p_product_id
  ORDER BY (t.locale = 'ar') DESC, t.created_at
  LIMIT 1;
  IF p_variant_id IS NOT NULL THEN
    SELECT v.title INTO v_variant_title FROM public.product_variants v WHERE v.id = p_variant_id;
  END IF;

  INSERT INTO public.seller_notifications (seller_id, type, data, dedupe_key)
  VALUES (
    p_seller_id,
    'low_stock',
    jsonb_strip_nulls(jsonb_build_object(
      'productId', p_product_id,
      'variantId', p_variant_id,
      'name', left(coalesce(v_name, ''), 120),
      'variantTitle', left(v_variant_title, 80),
      'stock', p_stock,
      'threshold', p_threshold
    )),
    'low_stock:' || coalesce(p_variant_id, p_product_id)::text || ':'
      || to_char(now() AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD')
  )
  ON CONFLICT (seller_id, dedupe_key) DO NOTHING;
END;
$fn$;

REVOKE ALL ON FUNCTION public.notify_seller_low_stock(uuid, uuid, uuid, integer, integer) FROM PUBLIC, anon, authenticated;

-- ── products.quantity ─────────────────────────────────────────────────────
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

DROP TRIGGER IF EXISTS products_stock_movement ON public.products;
CREATE TRIGGER products_stock_movement
  AFTER INSERT OR UPDATE OF quantity ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_stock_movement();

-- ── product_variants.stock ────────────────────────────────────────────────
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

    SELECT p.seller_id, p.status, p.deleted_at, p.purged_at, p.low_stock_threshold
      INTO v_product
    FROM public.products p
    WHERE p.id = new.product_id;
    IF NOT FOUND THEN
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

DROP TRIGGER IF EXISTS product_variants_stock_movement ON public.product_variants;
CREATE TRIGGER product_variants_stock_movement
  AFTER INSERT OR UPDATE OF stock ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.product_variants_stock_movement();

-- ── Link checkout rows to their order ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.order_items_link_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    UPDATE public.stock_movements m
    SET order_id = new.order_id,
        store_id = coalesce(m.store_id, o.store_id),
        actor_user_id = coalesce(m.actor_user_id, o.user_id)
    FROM public.orders o
    WHERE o.id = new.order_id
      AND m.reason = 'order'
      AND m.order_id IS NULL
      AND m.product_id = new.product_id
      AND m.variant_id IS NOT DISTINCT FROM new.variant_id
      AND m.created_at = now();
  EXCEPTION WHEN others THEN
    RAISE WARNING 'order_items_link_stock_movement: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS order_items_link_stock_movement ON public.order_items;
CREATE TRIGGER order_items_link_stock_movement
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.order_items_link_stock_movement();

-- Rollback:
--   DROP TRIGGER order_items_link_stock_movement ON order_items;
--   DROP TRIGGER product_variants_stock_movement ON product_variants;
--   DROP TRIGGER products_stock_movement ON products;
--   DROP FUNCTION order_items_link_stock_movement(), product_variants_stock_movement(),
--     products_stock_movement(), notify_seller_low_stock(uuid, uuid, uuid, integer, integer),
--     record_stock_movement(uuid, uuid, uuid, integer, integer), stock_setting_uuid(text);
--   DELETE FROM seller_notifications WHERE type = 'low_stock';
--   re-run 0119's seller_notifications_type_check block (without low_stock);
--   DROP TABLE stock_movements;
