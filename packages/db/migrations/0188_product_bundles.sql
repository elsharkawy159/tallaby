-- 0188: Product bundles (ROADMAP.md F-07f; docs/plans/bundles.md §1–§2,
-- owner 2026-11-27).
--
-- A bundle is a normal product with `is_bundle = true` whose stock is the
-- stock of its items. v1: a fixed variant per item, at most 10 items (in code),
-- no pre-order or digital items; items may be draft products, not trashed ones.
--
-- 1. `products.is_bundle` (default false: every existing product is unchanged).
-- 2. `product_bundle_items` (server-only: RLS on, no policies): the items of a
--    bundle, each a product of the same seller and store, an optional variant
--    and a quantity (1–99). One row per (bundle, item, variant); a NULL variant
--    counts as one value (coalesce to the nil uuid, as in 0171), so it works on
--    any Postgres version.
-- 3. `order_items.bundle_items` (nullable jsonb array): the snapshot of the
--    bundle's items written at order time
--    `[{productId, variantId, sku, name, variantName, quantity}]`, so cancel and
--    return restore what was sold even after the seller edits the bundle.
-- 4. Guard triggers (SQLSTATE 23514 check_violation, pattern of 0171):
--    * `product_bundle_items_guard`: the bundle has `is_bundle`, same seller and
--      store as the row; the item is of the same seller and store, not a bundle,
--      not the bundle itself, not in Trash or purged, not a pre-order, not
--      digital; the variant belongs to the item; an item with variants names
--      one. Both products are read FOR SHARE, so a concurrent flip of
--      `is_bundle` waits for this row.
--    * `products_bundle_guard`: `is_bundle` can't go on for a product that is an
--      item of a bundle or has variants, can't go off while it has items, and a
--      product in a bundle (either side) can't move to another store or seller.
--    * `product_variants_bundle_guard`: no variant on a bundle.
--    * `products_bundle_untracked`: forces `track_stock = false` while
--      `is_bundle` (like 0179 `products_preorder_untracked`), so code that
--      doesn't know bundles treats a bundle as unlimited and never throws.
--      Both triggers only ever set false, so they can't fight.
--    * `product_bundle_items_drafts_bundle` (AFTER DELETE): when an item row is
--      deleted because its product or its variant was deleted (FK cascade), the
--      bundle, if it still exists, goes `status = 'draft'` so it can't be sold
--      without that item. Never blocks the delete (RAISE WARNING).
-- 5. `order_items_link_stock_movement` (0125, not replaced since) is
--    re-created: its match is kept word for word, plus one more UPDATE, in its
--    own exception block, that links the 'order' movements of the items listed
--    in `NEW.bundle_items` to the same order. Like every 0125 trigger, it never
--    blocks a write.
--
-- Additive and idempotent: new columns with a constant default or nullable (no
-- table rewrite), a guarded CHECK (NOT VALID, then validated), a new table and
-- triggers that do nothing until a row has `is_bundle = true`. No row changes.
-- Drizzle selects every `products` and `order_items` column, so apply it on
-- staging, then production (owner approval), BEFORE deploying the code that
-- ships with it. Not applied anywhere yet.

-- ── Columns ───────────────────────────────────────────────────────────────
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bundle boolean NOT NULL DEFAULT false;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS bundle_items jsonb;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_bundle_items_check') THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_bundle_items_check
      CHECK (bundle_items IS NULL OR jsonb_typeof(bundle_items) = 'array') NOT VALID;
  END IF;
END $$;

ALTER TABLE public.order_items VALIDATE CONSTRAINT order_items_bundle_items_check;

-- ── Bundle items ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_bundle_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id         uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  store_id          uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  bundle_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  item_product_id   uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  item_variant_id   uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity          integer NOT NULL,
  position          integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_bundle_items_quantity_check CHECK (quantity BETWEEN 1 AND 99),
  CONSTRAINT product_bundle_items_not_self CHECK (item_product_id <> bundle_product_id)
);

-- One row per (bundle, item, variant); NULL variant counts as one value.
CREATE UNIQUE INDEX IF NOT EXISTS product_bundle_items_bundle_item_key
  ON public.product_bundle_items (
    bundle_product_id,
    item_product_id,
    coalesce(item_variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
-- A bundle's items in order.
CREATE INDEX IF NOT EXISTS product_bundle_items_bundle_idx
  ON public.product_bundle_items (bundle_product_id, position);
-- "Is this product in a bundle?" and the FK cascade on product delete.
CREATE INDEX IF NOT EXISTS product_bundle_items_item_idx
  ON public.product_bundle_items (item_product_id);
-- The FK cascade on variant delete.
CREATE INDEX IF NOT EXISTS product_bundle_items_variant_idx
  ON public.product_bundle_items (item_variant_id) WHERE item_variant_id IS NOT NULL;
-- The FK cascade on store delete, and per-store reads.
CREATE INDEX IF NOT EXISTS product_bundle_items_store_idx
  ON public.product_bundle_items (store_id);

ALTER TABLE public.product_bundle_items ENABLE ROW LEVEL SECURITY;

-- ── Guard: an item row ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.product_bundle_items_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_bundle record;
  v_item record;
  v_variant_product uuid;
BEGIN
  IF NEW.item_product_id = NEW.bundle_product_id THEN
    RAISE EXCEPTION 'product_bundle_items: a bundle can''t contain itself'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT p.seller_id, p.store_id, p.is_bundle INTO v_bundle
  FROM products p
  WHERE p.id = NEW.bundle_product_id
  FOR SHARE;
  IF NOT FOUND THEN
    RETURN NEW; -- the FK reports a missing bundle
  END IF;
  IF NOT v_bundle.is_bundle THEN
    RAISE EXCEPTION 'product_bundle_items: product % is not a bundle', NEW.bundle_product_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF v_bundle.seller_id <> NEW.seller_id OR v_bundle.store_id IS DISTINCT FROM NEW.store_id THEN
    RAISE EXCEPTION 'product_bundle_items: bundle % is in another store', NEW.bundle_product_id
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT p.seller_id, p.store_id, p.is_bundle, p.deleted_at, p.purged_at, p.preorder_enabled, p.product_type
    INTO v_item
  FROM products p
  WHERE p.id = NEW.item_product_id
  FOR SHARE;
  IF NOT FOUND THEN
    RETURN NEW; -- the FK reports a missing item
  END IF;
  IF v_item.seller_id <> NEW.seller_id OR v_item.store_id IS DISTINCT FROM NEW.store_id THEN
    RAISE EXCEPTION 'product_bundle_items: item % is in another store', NEW.item_product_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF v_item.is_bundle THEN
    RAISE EXCEPTION 'product_bundle_items: item % is a bundle', NEW.item_product_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF v_item.deleted_at IS NOT NULL OR v_item.purged_at IS NOT NULL THEN
    RAISE EXCEPTION 'product_bundle_items: item % is in Trash', NEW.item_product_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF v_item.preorder_enabled THEN
    RAISE EXCEPTION 'product_bundle_items: item % is a pre-order', NEW.item_product_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF v_item.product_type::text = 'digital' THEN
    RAISE EXCEPTION 'product_bundle_items: item % is digital', NEW.item_product_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.item_variant_id IS NOT NULL THEN
    SELECT v.product_id INTO v_variant_product
    FROM product_variants v
    WHERE v.id = NEW.item_variant_id;
    IF FOUND AND v_variant_product IS DISTINCT FROM NEW.item_product_id THEN
      RAISE EXCEPTION 'product_bundle_items: variant % is not of item %', NEW.item_variant_id, NEW.item_product_id
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = NEW.item_product_id) THEN
    RAISE EXCEPTION 'product_bundle_items: item % has variants; choose one', NEW.item_product_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_bundle_items_guard ON public.product_bundle_items;
CREATE TRIGGER product_bundle_items_guard
  BEFORE INSERT OR UPDATE ON public.product_bundle_items
  FOR EACH ROW EXECUTE FUNCTION public.product_bundle_items_guard();

-- ── Guard: products ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.products_bundle_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_bundle AND NOT OLD.is_bundle THEN
    IF EXISTS (SELECT 1 FROM product_bundle_items b WHERE b.item_product_id = NEW.id) THEN
      RAISE EXCEPTION 'products: % is an item of a bundle and can''t be a bundle', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
    IF EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = NEW.id) THEN
      RAISE EXCEPTION 'products: % has variants and can''t be a bundle', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
  ELSIF OLD.is_bundle AND NOT NEW.is_bundle THEN
    IF EXISTS (SELECT 1 FROM product_bundle_items b WHERE b.bundle_product_id = NEW.id) THEN
      RAISE EXCEPTION 'products: bundle % still has items', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF (NEW.store_id IS DISTINCT FROM OLD.store_id OR NEW.seller_id IS DISTINCT FROM OLD.seller_id)
     AND EXISTS (
       SELECT 1 FROM product_bundle_items b
       WHERE b.bundle_product_id = NEW.id OR b.item_product_id = NEW.id
     ) THEN
    RAISE EXCEPTION 'products: % is in a bundle and can''t move to another store', NEW.id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_bundle_guard ON public.products;
CREATE TRIGGER products_bundle_guard
  BEFORE UPDATE OF is_bundle, store_id, seller_id ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_bundle_guard();

-- ── Guard: no variants on a bundle ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.product_variants_bundle_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_is_bundle boolean;
BEGIN
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT p.is_bundle INTO v_is_bundle FROM products p WHERE p.id = NEW.product_id FOR SHARE;
  IF v_is_bundle THEN
    RAISE EXCEPTION 'product_variants: product % is a bundle and can''t have variants', NEW.product_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_variants_bundle_guard ON public.product_variants;
CREATE TRIGGER product_variants_bundle_guard
  BEFORE INSERT OR UPDATE OF product_id ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.product_variants_bundle_guard();

-- ── A bundle never holds stock ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.products_bundle_untracked()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_bundle THEN
    NEW.track_stock := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_bundle_untracked ON public.products;
CREATE TRIGGER products_bundle_untracked
  BEFORE INSERT OR UPDATE OF is_bundle, track_stock ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_bundle_untracked();

-- ── A bundle that lost an item goes draft ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.product_bundle_items_drafts_bundle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.products p WHERE p.id = old.item_product_id)
       OR (old.item_variant_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM public.product_variants v WHERE v.id = old.item_variant_id)) THEN
      UPDATE public.products p
      SET status = 'draft'
      WHERE p.id = old.bundle_product_id
        AND p.status <> 'draft';
    END IF;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'product_bundle_items_drafts_bundle: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;

REVOKE ALL ON FUNCTION public.product_bundle_items_drafts_bundle() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS product_bundle_items_drafts_bundle ON public.product_bundle_items;
CREATE TRIGGER product_bundle_items_drafts_bundle
  AFTER DELETE ON public.product_bundle_items
  FOR EACH ROW EXECUTE FUNCTION public.product_bundle_items_drafts_bundle();

-- ── Link checkout rows to their order (0125, plus bundle items) ───────────
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

  -- 0188: a bundle line's stock moved on its items (the snapshot).
  IF new.bundle_items IS NOT NULL THEN
    BEGIN
      UPDATE public.stock_movements m
      SET order_id = new.order_id,
          store_id = coalesce(m.store_id, o.store_id),
          actor_user_id = coalesce(m.actor_user_id, o.user_id)
      FROM public.orders o,
        (
          SELECT DISTINCT
            CASE WHEN e->>'productId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                 THEN (e->>'productId')::uuid END AS product_id,
            CASE WHEN e->>'variantId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                 THEN (e->>'variantId')::uuid END AS variant_id
          FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(new.bundle_items) = 'array' THEN new.bundle_items ELSE '[]'::jsonb END
          ) e
          WHERE jsonb_typeof(e) = 'object'
        ) b
      WHERE o.id = new.order_id
        AND b.product_id IS NOT NULL
        AND m.reason = 'order'
        AND m.order_id IS NULL
        AND m.product_id = b.product_id
        AND m.variant_id IS NOT DISTINCT FROM b.variant_id
        AND m.created_at = now();
    EXCEPTION WHEN others THEN
      RAISE WARNING 'order_items_link_stock_movement (bundle): %', sqlerrm;
    END;
  END IF;

  RETURN NULL;
END;
$fn$;

-- The trigger itself is 0125's (AFTER INSERT ON order_items); unchanged.

COMMENT ON COLUMN public.products.is_bundle IS
  'Bundle (F-07f, 0188): sold as one product, stock from product_bundle_items; forces track_stock = false (trigger products_bundle_untracked).';
COMMENT ON COLUMN public.order_items.bundle_items IS
  'Snapshot of the bundle''s items when the order was placed (F-07f, 0188): [{productId, variantId, sku, name, variantName, quantity}]; null = not a bundle line.';

-- Rollback (only while no code reads the new columns):
--   re-run 0125's CREATE OR REPLACE FUNCTION public.order_items_link_stock_movement() block;
--   DROP TRIGGER IF EXISTS product_bundle_items_drafts_bundle ON public.product_bundle_items;
--   DROP TRIGGER IF EXISTS product_bundle_items_guard ON public.product_bundle_items;
--   DROP TRIGGER IF EXISTS products_bundle_untracked ON public.products;
--   DROP TRIGGER IF EXISTS products_bundle_guard ON public.products;
--   DROP TRIGGER IF EXISTS product_variants_bundle_guard ON public.product_variants;
--   DROP FUNCTION IF EXISTS public.product_bundle_items_drafts_bundle(),
--     public.product_bundle_items_guard(), public.products_bundle_untracked(),
--     public.products_bundle_guard(), public.product_variants_bundle_guard();
--   DROP TABLE IF EXISTS public.product_bundle_items;
--   ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_bundle_items_check;
--   ALTER TABLE public.order_items DROP COLUMN IF EXISTS bundle_items;
--   ALTER TABLE public.products DROP COLUMN IF EXISTS is_bundle;
--   (bundles keep track_stock = false after the rollback; set it back per product if needed.)
