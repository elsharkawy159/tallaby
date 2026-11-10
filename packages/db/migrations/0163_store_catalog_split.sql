-- 0163_store_catalog_split.sql: fully separate stores, the catalog split
-- (ROADMAP.md F-87m; docs/plans/stores-separation.md §2.1, §3.2; owner 2026-11-10).
--
-- WHAT IT DOES
-- Every store keeps exactly the products it shows today. A product that N
-- stores show becomes N rows, one per store, each with its own stock. The
-- original row (and all its history: orders, stock movements, ad requests)
-- stays with one store; every other store gets a copy. Steps, in the plan's
-- order (§3.2):
--   1. Guards and locks. Skips everything when the switch is already on, or
--      when product_store_split already has rows (the split ran before).
--   2. Snapshot of the before state (temp tables): store membership
--      (catalog_mode 'all' = every live product of the seller, 'selected' =
--      store_products), the visible set, stock sums, money totals.
--   3. Kept store per product: its own products.store_id when that store shows
--      it, else the primary store when it shows it, else the oldest store that
--      shows it. Orphans (live, no store shows them) go to the primary store as
--      draft (prev_status in the map). Trashed: own store, else the store that
--      picked it, else primary. Purged: own store, else primary. No copies of
--      trashed or purged products. `products.store_id` is overwritten by this
--      rule even when already set (rows made since F-87c slice 1 name a store).
--   4. Seller categories and brands: the kept row goes to its own store_id
--      when valid, else the primary store; every other store of the seller
--      gets a copy (each store keeps the whole list). Per-store unique keys.
--      Every product points at its own store's category and brand.
--      seller_categories picks (no reader) go to the primary store, no copies.
--   5. Product copies: products, variants, translations, digital products and
--      files, quantity offers, category positions. Same stock numbers, same
--      status, same created_at. Stock movements are written with reason 'copy'.
--      The per-seller SKU index becomes per store.
--   6. Cross-sells (one row per store that shows both products), discount rule
--      ids, coupon product lists (copy ids added; coupons stay "every store"),
--      approved reviews and approved questions (with their answers) copied to
--      each copy (owner Q4: during the split only).
--   7. Remaps: open store carts (product, variant, cross-sell), open
--      back-in-stock alerts, email campaign products, and builder JSON (page
--      drafts, saved blocks, shared header/footer, template-undo drafts, store
--      settings). A live site whose snapshot changes gets a NEW revision
--      (revisions are append-only, 0051), published_by NULL, as the 2026-10-24
--      product-page backfill did.
--   8. Constraints and triggers: products_store_same_seller (fills a NULL
--      store_id from the primary store for old writers, refuses another
--      seller's store), products_taxonomy_same_store and
--      seller_taxonomy_store_in_use (F-87d), CHECK store_id IS NOT NULL on
--      products and taxonomy (NOT VALID, then VALIDATE).
--      record_stock_movement accepts 'copy' and takes the product's store when
--      the transaction names none; notify_admin_product_created reads
--      products.store_id first.
--   9. Invariants, each a RAISE EXCEPTION that rolls everything back (§3.2
--      step 9, plus "no money moved").
--  10. The LAST statement turns `stores_catalog_split` on.
-- No wallet, ledger or fee change (the wallet split is 0164). Notification
-- triggers on products, reviews and questions are disabled for the copies only
-- (inside this transaction), so no bell, push or admin row is sent for them.
--
-- LOCKS AND TIMING
-- One transaction. SHARE ROW EXCLUSIVE on the catalog tables from step 1
-- (reads go on, writes wait: product edits, add to cart, checkout's stock
-- update, taxonomy, reviews, builder saves). From step 4/5 the index swaps take
-- ACCESS EXCLUSIVE on products, seller_product_categories and
-- seller_product_brands, so storefront reads of those tables wait too until
-- COMMIT. At production size (277 products, 59 copies, 95 stores) the whole
-- file should take a few seconds. lock_timeout is 10 s: if a long transaction
-- holds a table, the file stops with "lock timeout" and changes nothing; run it
-- again. Run it at a LOW-TRAFFIC HOUR (Cairo night).
--
-- APPLY ORDER
--   staging: dry run (scripts/stores-split-dry-run.sql) → this file →
--   scripts/stores-split-verify.sql → manual E2E (docs/plans/stores-separation.md
--   §3.4) → owner approval → production: dry run → this file → verify →
--   purge the storefront cache tags the verify script prints.
--   The dark code (F-87a…e, already on main) must be deployed first, with the
--   restock-through-the-split-map change in packages/db/src/inventory/stock.ts
--   and the Shopify import's ON CONFLICT without a target.
--   psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f packages/db/migrations/0163_store_catalog_split.sql
--
-- ROLLBACK
-- Before 0165 only: packages/db/scripts/stores-split-rollback.sql. It refuses
-- to run once any copy has orders (or ad requests, or new customer reviews or
-- questions). After 0165 there is no rollback.
--
-- Idempotent: a second run is a no-op (switch on, or map rows present).

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '15min';

-- ═══ 0. Functions (idempotent; used by the steps and the triggers below) ═══

-- Stock history (0125): accepts 'copy', and takes the product's own store when
-- the transaction names no store and no order (after the split every product
-- has one). Otherwise the 0125 body unchanged.
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
  IF v_reason NOT IN ('order', 'cancel', 'return', 'edit', 'bulk_edit', 'import', 'other', 'copy') THEN
    v_reason := 'other';
  END IF;
  IF v_order IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = v_order) THEN
    v_order := NULL;
  END IF;
  IF v_store IS NULL AND v_order IS NOT NULL THEN
    SELECT o.store_id INTO v_store FROM public.orders o WHERE o.id = v_order;
  END IF;
  IF v_store IS NULL THEN
    SELECT p.store_id INTO v_store FROM public.products p WHERE p.id = p_product_id;
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

-- A product's store must be one of its seller's stores. A writer that omits
-- store_id (old code, scripts) gets the seller's primary store.
CREATE OR REPLACE FUNCTION public.products_store_same_seller()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.store_id IS NULL THEN
    SELECT st.id INTO NEW.store_id
    FROM stores st
    WHERE st.seller_id = NEW.seller_id AND st.is_primary AND st.deleted_at IS NULL;
  END IF;
  IF NEW.store_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM stores st WHERE st.id = NEW.store_id AND st.seller_id = NEW.seller_id
  ) THEN
    RAISE EXCEPTION 'products: store % does not belong to seller %', NEW.store_id, NEW.seller_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

-- A product may only use its own store's seller category and brand (F-87d).
-- Replaces 0068's same-seller check (that one is dropped in 0165).
CREATE OR REPLACE FUNCTION public.products_taxonomy_same_store()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.seller_category_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM seller_product_categories c
    WHERE c.id = NEW.seller_category_id
      AND c.seller_id = NEW.seller_id
      AND c.store_id = NEW.store_id          -- a NULL store on either side fails
  ) THEN
    RAISE EXCEPTION 'products: seller category % is not in store %', NEW.seller_category_id, NEW.store_id
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.seller_brand_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM seller_product_brands b
    WHERE b.id = NEW.seller_brand_id
      AND b.seller_id = NEW.seller_id
      AND b.store_id = NEW.store_id
  ) THEN
    RAISE EXCEPTION 'products: seller brand % is not in store %', NEW.seller_brand_id, NEW.store_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

-- The other direction: a category or brand can't move to another store (or
-- seller) while a product of a different store still uses it.
CREATE OR REPLACE FUNCTION public.seller_taxonomy_store_in_use()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.store_id IS DISTINCT FROM OLD.store_id OR NEW.seller_id IS DISTINCT FROM OLD.seller_id THEN
    IF (TG_TABLE_NAME = 'seller_product_categories' AND EXISTS (
          SELECT 1 FROM products p
          WHERE p.seller_category_id = OLD.id
            AND (p.store_id IS DISTINCT FROM NEW.store_id OR p.seller_id <> NEW.seller_id)))
       OR (TG_TABLE_NAME = 'seller_product_brands' AND EXISTS (
          SELECT 1 FROM products p
          WHERE p.seller_brand_id = OLD.id
            AND (p.store_id IS DISTINCT FROM NEW.store_id OR p.seller_id <> NEW.seller_id))) THEN
      RAISE EXCEPTION '%: % is used by products of another store', TG_TABLE_NAME, OLD.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 0116's admin "product created" bell, reading products.store_id first (after
-- the split a store in 'all' mode has no store_products row). Body otherwise
-- unchanged.
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
      SELECT x.id, x.name FROM public.stores x
      WHERE x.id = new.store_id
         OR x.id IN (SELECT sp.store_id FROM public.store_products sp WHERE sp.product_id = new.id)
      ORDER BY (x.id = new.store_id) IS TRUE DESC, x.is_primary DESC, x.created_at ASC
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

-- Session-only helpers (pg_temp: gone when the connection closes).
-- The insertable columns of a public table, minus p_skip, optionally prefixed.
CREATE OR REPLACE FUNCTION pg_temp.s163_cols(p_table text, p_skip text[], p_prefix text DEFAULT '')
RETURNS text
LANGUAGE sql
STABLE
AS $f$
  SELECT coalesce(string_agg(p_prefix || quote_ident(a.attname), ', ' ORDER BY a.attnum), '')
  FROM pg_attribute a
  WHERE a.attrelid = ('public.' || quote_ident(p_table))::regclass
    AND a.attnum > 0 AND NOT a.attisdropped
    AND a.attgenerated = '' AND a.attidentity = ''
    AND NOT (a.attname = ANY (p_skip))
$f$;

-- Replaces every old id of `pairs` ({"old": "new", …}) anywhere in a JSON
-- document. Ids are uuids, so a text replace can only hit that id.
CREATE OR REPLACE FUNCTION pg_temp.s163_replace_ids(doc jsonb, pairs jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $f$
DECLARE
  t text;
  k text;
  v text;
BEGIN
  IF doc IS NULL OR pairs IS NULL OR pairs = '{}'::jsonb THEN
    RETURN doc;
  END IF;
  t := doc::text;
  FOR k, v IN SELECT key, value FROM jsonb_each_text(pairs) LOOP
    IF position(k IN t) > 0 THEN
      t := replace(t, k, v);
    END IF;
  END LOOP;
  RETURN t::jsonb;
END;
$f$;

-- A coupon list ({"productIds": [...]}) plus the copies of every product in
-- it, appended after the existing ids. Unchanged when no id has a copy.
CREATE OR REPLACE FUNCTION pg_temp.s163_add_copy_ids(j jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $f$
DECLARE
  extra jsonb;
BEGIN
  IF j IS NULL OR jsonb_typeof(j -> 'productIds') IS DISTINCT FROM 'array' THEN
    RETURN j;
  END IF;
  SELECT jsonb_agg(to_jsonb(c.new_id::text) ORDER BY e.o, c.new_id)
    INTO extra
    FROM jsonb_array_elements(j -> 'productIds') WITH ORDINALITY AS e(v, o)
    JOIN s163_pcopy c ON jsonb_typeof(e.v) = 'string' AND c.old_id::text = lower(e.v #>> '{}')
   WHERE NOT (j -> 'productIds') @> jsonb_build_array(c.new_id::text);
  IF extra IS NULL THEN
    RETURN j;
  END IF;
  RETURN jsonb_set(j, '{productIds}', (j -> 'productIds') || extra);
END;
$f$;

-- ═══ 1. Guards and locks ═══════════════════════════════════════════════════
DO $$
DECLARE
  v_on boolean;
  v_rows bigint;
  v_bad bigint;
BEGIN
  PERFORM set_config('tallaby.split_0163', 'skip', true);

  SELECT enabled INTO v_on FROM public.platform_switches WHERE key = 'stores_catalog_split';
  IF NOT FOUND THEN
    RAISE EXCEPTION '0163: platform_switches has no stores_catalog_split row. Apply 0160 first.';
  END IF;
  IF v_on THEN
    RAISE NOTICE '0163: stores_catalog_split is already on. Nothing to do.';
    RETURN;
  END IF;
  SELECT count(*) INTO v_rows FROM public.product_store_split;
  IF v_rows > 0 THEN
    RAISE NOTICE '0163: product_store_split already has % rows (the split ran; the switch was turned off by hand). Nothing to do. To split again, run packages/db/scripts/stores-split-rollback.sql first.', v_rows;
    RETURN;
  END IF;

  LOCK TABLE
    public.stores, public.store_products, public.products, public.product_variants,
    public.product_translations, public.digital_products, public.digital_files,
    public.seller_product_categories, public.seller_product_brands, public.seller_categories,
    public.seller_category_product_positions, public.product_quantity_offers,
    public.product_cross_sells, public.store_discount_rules, public.coupons,
    public.reviews, public.product_questions, public.product_answers, public.cart_items,
    public.store_stock_subscriptions, public.store_email_campaigns, public.store_pages,
    public.store_site_revisions, public.saved_blocks, public.template_installs, public.categories
  IN SHARE ROW EXCLUSIVE MODE;

  -- Every seller with products, taxonomy or stores has exactly one live primary store.
  SELECT count(*) INTO v_bad
  FROM public.sellers se
  WHERE (EXISTS (SELECT 1 FROM public.products p WHERE p.seller_id = se.id)
         OR EXISTS (SELECT 1 FROM public.seller_product_categories c WHERE c.seller_id = se.id)
         OR EXISTS (SELECT 1 FROM public.seller_product_brands b WHERE b.seller_id = se.id)
         OR EXISTS (SELECT 1 FROM public.stores st WHERE st.seller_id = se.id AND st.deleted_at IS NULL))
    AND (SELECT count(*) FROM public.stores st
         WHERE st.seller_id = se.id AND st.is_primary AND st.deleted_at IS NULL) <> 1;
  IF v_bad > 0 THEN
    RAISE EXCEPTION '0163: % seller(s) with products, categories or stores do not have exactly one live primary store (dry run result set 4). Fix them first.', v_bad;
  END IF;

  PERFORM set_config('tallaby.split_0163', 'run', true);
END $$;

-- ═══ 2. Snapshot of the before state ═══════════════════════════════════════
DO $$
DECLARE
  v_copies bigint;
BEGIN
  IF current_setting('tallaby.split_0163', true) IS DISTINCT FROM 'run' THEN RETURN; END IF;

  CREATE TEMP TABLE s163_store ON COMMIT DROP AS
    SELECT st.id AS store_id, st.seller_id, st.is_primary, st.created_at, st.catalog_mode
    FROM public.stores st
    WHERE st.deleted_at IS NULL;
  CREATE UNIQUE INDEX ON s163_store (store_id);

  CREATE TEMP TABLE s163_primary ON COMMIT DROP AS
    SELECT seller_id, store_id FROM s163_store WHERE is_primary;
  CREATE UNIQUE INDEX ON s163_primary (seller_id);

  -- Membership today, as the dry run and productInStore('shown') with the switch off.
  CREATE TEMP TABLE s163_member ON COMMIT DROP AS
    SELECT s.store_id, p.id AS product_id
    FROM s163_store s
    JOIN public.products p ON p.seller_id = s.seller_id
    WHERE s.catalog_mode = 'all' AND p.deleted_at IS NULL AND p.purged_at IS NULL
    UNION
    SELECT s.store_id, p.id
    FROM s163_store s
    JOIN public.store_products sp ON sp.store_id = s.store_id
    JOIN public.products p ON p.id = sp.product_id AND p.seller_id = s.seller_id
    WHERE s.catalog_mode = 'selected' AND p.deleted_at IS NULL AND p.purged_at IS NULL;
  CREATE UNIQUE INDEX ON s163_member (product_id, store_id);
  CREATE INDEX ON s163_member (store_id);

  CREATE TEMP TABLE s163_before_visible ON COMMIT DROP AS
    SELECT m.store_id, m.product_id
    FROM s163_member m JOIN public.products p ON p.id = m.product_id
    WHERE p.status = 'active';

  CREATE TEMP TABLE s163_before_stock ON COMMIT DROP AS
    SELECT m.store_id,
           coalesce(sum(p.quantity), 0) AS qty,
           coalesce(sum((SELECT coalesce(sum(v.stock), 0) FROM public.product_variants v WHERE v.product_id = p.id)), 0) AS variant_stock
    FROM s163_member m JOIN public.products p ON p.id = m.product_id
    GROUP BY m.store_id;

  CREATE TEMP TABLE s163_before_tax ON COMMIT DROP AS
    SELECT se.id AS seller_id,
           (SELECT count(*) FROM public.seller_product_categories c WHERE c.seller_id = se.id) AS categories,
           (SELECT count(*) FROM public.seller_product_brands b WHERE b.seller_id = se.id) AS brands
    FROM public.sellers se
    WHERE EXISTS (SELECT 1 FROM s163_store s WHERE s.seller_id = se.id);

  -- Open store cart lines whose product the cart's store shows: each must end on that store's row.
  CREATE TEMP TABLE s163_before_cart ON COMMIT DROP AS
    SELECT ci.id AS cart_item_id, c.store_id, ci.product_id
    FROM public.cart_items ci
    JOIN public.carts c ON c.id = ci.cart_id
    JOIN s163_member m ON m.store_id = c.store_id AND m.product_id = ci.product_id
    WHERE c.status = 'active' AND c.store_id IS NOT NULL;

  CREATE TEMP TABLE s163_before_money ON COMMIT DROP AS
    SELECT (SELECT coalesce(sum(balance), 0) FROM public.seller_wallet) AS wallet_sum,
           (SELECT count(*) FROM public.seller_wallet) AS wallets,
           (SELECT count(*) FROM public.wallet_transactions) AS ledger_rows,
           (SELECT coalesce(sum(amount), 0) FROM public.wallet_transactions) AS ledger_sum,
           (SELECT coalesce(sum(wallet_balance), 0) FROM public.sellers) AS mirror_sum,
           (SELECT count(*) FROM public.orders) AS orders,
           (SELECT count(*) FROM public.order_items) AS order_items;

  SELECT count(*) INTO v_copies
  FROM s163_member m
  WHERE (SELECT count(*) FROM s163_member x WHERE x.product_id = m.product_id) > 1;
  IF v_copies > 50000 THEN
    RAISE EXCEPTION '0163: % memberships in multi-store products, more than one transaction should hold. Split per seller instead (plan §3.2).', v_copies;
  END IF;
END $$;

-- ═══ 3. Kept store per product ═════════════════════════════════════════════
DO $$
DECLARE
  v_missing bigint;
BEGIN
  IF current_setting('tallaby.split_0163', true) IS DISTINCT FROM 'run' THEN RETURN; END IF;

  CREATE TEMP TABLE s163_kept ON COMMIT DROP AS
    SELECT p.id AS product_id,
           p.seller_id,
           p.status::text AS status,
           p.category_id,
           p.seller_category_id,
           p.seller_brand_id,
           (p.deleted_at IS NULL AND p.purged_at IS NULL
            AND NOT EXISTS (SELECT 1 FROM s163_member m WHERE m.product_id = p.id)) AS orphan,
           CASE
             WHEN p.deleted_at IS NULL AND p.purged_at IS NULL THEN coalesce(
               (SELECT s.store_id
                  FROM s163_member m JOIN s163_store s ON s.store_id = m.store_id
                 WHERE m.product_id = p.id
                 ORDER BY (s.store_id = p.store_id) IS TRUE DESC, s.is_primary DESC, s.created_at, s.store_id
                 LIMIT 1),
               pr.store_id)
             WHEN p.purged_at IS NULL THEN coalesce(
               (SELECT s.store_id FROM s163_store s WHERE s.store_id = p.store_id AND s.seller_id = p.seller_id),
               (SELECT s.store_id
                  FROM public.store_products sp JOIN s163_store s ON s.store_id = sp.store_id
                 WHERE sp.product_id = p.id AND s.seller_id = p.seller_id
                 ORDER BY s.is_primary DESC, s.created_at, s.store_id
                 LIMIT 1),
               pr.store_id)
             ELSE coalesce(
               (SELECT s.store_id FROM s163_store s WHERE s.store_id = p.store_id AND s.seller_id = p.seller_id),
               pr.store_id)
           END AS store_id
    FROM public.products p
    LEFT JOIN s163_primary pr ON pr.seller_id = p.seller_id;
  CREATE UNIQUE INDEX ON s163_kept (product_id);

  SELECT count(*) INTO v_missing FROM s163_kept WHERE store_id IS NULL;
  IF v_missing > 0 THEN
    RAISE EXCEPTION '0163: % product(s) have no store to keep them (seller without a live primary store).', v_missing;
  END IF;

  UPDATE public.products p
     SET store_id = k.store_id
    FROM s163_kept k
   WHERE p.id = k.product_id AND p.store_id IS DISTINCT FROM k.store_id;

  -- Orphans: kept by the primary store as drafts (owner Q2-b).
  UPDATE public.products p
     SET status = 'draft'
    FROM s163_kept k
   WHERE p.id = k.product_id AND k.orphan AND p.status <> 'draft';

  -- Tallaby category counters (packages/db/src/categories/product-count.ts): an orphan leaves 'active'.
  UPDATE public.categories c
     SET product_count = GREATEST(0, c.product_count - x.n)
    FROM (SELECT category_id, count(*) AS n FROM s163_kept WHERE orphan AND status = 'active' GROUP BY category_id) x
   WHERE c.id = x.category_id;

  INSERT INTO public.product_store_split (entity, old_id, store_id, new_id, kind, prev_status)
  SELECT 'product', k.product_id, k.store_id, k.product_id,
         CASE WHEN k.orphan THEN 'orphan' ELSE 'kept' END,
         CASE WHEN k.orphan THEN k.status END
  FROM s163_kept k;
END $$;

-- ═══ 4. Seller categories and brands per store ═════════════════════════════
DO $$
DECLARE
  v_cols text;
  v_pcols text;
BEGIN
  IF current_setting('tallaby.split_0163', true) IS DISTINCT FROM 'run' THEN RETURN; END IF;

  -- One list per store from now on: the unique keys move from seller to store
  -- (recreated per store in step 8, after the copies).
  DROP INDEX IF EXISTS public.seller_product_categories_name_key;
  DROP INDEX IF EXISTS public.seller_product_categories_source_key;
  DROP INDEX IF EXISTS public.seller_product_brands_name_key;
  DROP INDEX IF EXISTS public.seller_product_brands_source_key;

  CREATE TEMP TABLE s163_tmap (
    entity text NOT NULL,
    old_id uuid NOT NULL,
    store_id uuid NOT NULL,
    new_id uuid NOT NULL,
    kind text NOT NULL
  ) ON COMMIT DROP;

  -- Kept rows: their own store when valid, else the primary store.
  INSERT INTO s163_tmap (entity, old_id, store_id, new_id, kind)
  SELECT 'seller_category', c.id,
         coalesce((SELECT s.store_id FROM s163_store s WHERE s.store_id = c.store_id AND s.seller_id = c.seller_id), pr.store_id),
         c.id, 'kept'
  FROM public.seller_product_categories c
  JOIN s163_primary pr ON pr.seller_id = c.seller_id;
  INSERT INTO s163_tmap (entity, old_id, store_id, new_id, kind)
  SELECT 'seller_brand', b.id,
         coalesce((SELECT s.store_id FROM s163_store s WHERE s.store_id = b.store_id AND s.seller_id = b.seller_id), pr.store_id),
         b.id, 'kept'
  FROM public.seller_product_brands b
  JOIN s163_primary pr ON pr.seller_id = b.seller_id;

  UPDATE public.seller_product_categories c SET store_id = t.store_id
    FROM s163_tmap t
   WHERE t.entity = 'seller_category' AND t.old_id = c.id AND c.store_id IS DISTINCT FROM t.store_id;
  UPDATE public.seller_product_brands b SET store_id = t.store_id
    FROM s163_tmap t
   WHERE t.entity = 'seller_brand' AND t.old_id = b.id AND b.store_id IS DISTINCT FROM t.store_id;

  -- A copy for every other live store of the seller (each store keeps the whole list).
  INSERT INTO s163_tmap (entity, old_id, store_id, new_id, kind)
  SELECT t.entity, t.old_id, s.store_id, gen_random_uuid(), 'copy'
  FROM s163_tmap t
  JOIN public.seller_product_categories c ON t.entity = 'seller_category' AND c.id = t.old_id
  JOIN s163_store s ON s.seller_id = c.seller_id AND s.store_id <> t.store_id
  WHERE t.kind = 'kept';
  INSERT INTO s163_tmap (entity, old_id, store_id, new_id, kind)
  SELECT t.entity, t.old_id, s.store_id, gen_random_uuid(), 'copy'
  FROM s163_tmap t
  JOIN public.seller_product_brands b ON t.entity = 'seller_brand' AND b.id = t.old_id
  JOIN s163_store s ON s.seller_id = b.seller_id AND s.store_id <> t.store_id
  WHERE t.kind = 'kept';
  CREATE UNIQUE INDEX ON s163_tmap (entity, old_id, store_id);

  v_cols := pg_temp.s163_cols('seller_product_categories', ARRAY['id', 'store_id']);
  v_pcols := pg_temp.s163_cols('seller_product_categories', ARRAY['id', 'store_id'], 'c.');
  EXECUTE format(
    'INSERT INTO public.seller_product_categories (id, store_id, %s)
     SELECT t.new_id, t.store_id, %s
     FROM s163_tmap t JOIN public.seller_product_categories c ON c.id = t.old_id
     WHERE t.entity = ''seller_category'' AND t.kind = ''copy''', v_cols, v_pcols);

  v_cols := pg_temp.s163_cols('seller_product_brands', ARRAY['id', 'store_id']);
  v_pcols := pg_temp.s163_cols('seller_product_brands', ARRAY['id', 'store_id'], 'c.');
  EXECUTE format(
    'INSERT INTO public.seller_product_brands (id, store_id, %s)
     SELECT t.new_id, t.store_id, %s
     FROM s163_tmap t JOIN public.seller_product_brands c ON c.id = t.old_id
     WHERE t.entity = ''seller_brand'' AND t.kind = ''copy''', v_cols, v_pcols);

  INSERT INTO public.product_store_split (entity, old_id, store_id, new_id, kind)
  SELECT entity, old_id, store_id, new_id, kind FROM s163_tmap;

  -- Every product (live, trashed or purged) uses its own store's category and brand.
  UPDATE public.products p
     SET seller_category_id = t.new_id
    FROM s163_kept k, s163_tmap t
   WHERE k.product_id = p.id
     AND t.entity = 'seller_category' AND t.old_id = k.seller_category_id AND t.store_id = k.store_id
     AND p.seller_category_id IS DISTINCT FROM t.new_id;
  UPDATE public.products p
     SET seller_brand_id = t.new_id
    FROM s163_kept k, s163_tmap t
   WHERE k.product_id = p.id
     AND t.entity = 'seller_brand' AND t.old_id = k.seller_brand_id AND t.store_id = k.store_id
     AND p.seller_brand_id IS DISTINCT FROM t.new_id;

  -- Tallaby category picks: no code reads them (F-87d); they go to the primary store.
  UPDATE public.seller_categories sc
     SET store_id = pr.store_id
    FROM s163_primary pr
   WHERE pr.seller_id = sc.seller_id
     AND (sc.store_id IS NULL OR NOT EXISTS (
           SELECT 1 FROM s163_store s WHERE s.store_id = sc.store_id AND s.seller_id = sc.seller_id));
END $$;

-- ═══ 5. Product copies ═════════════════════════════════════════════════════
DO $$
DECLARE
  v_t record;
BEGIN
  IF current_setting('tallaby.split_0163', true) IS DISTINCT FROM 'run' THEN RETURN; END IF;

  -- SKUs become unique per store (a copy keeps its SKU). The live index may be
  -- a plain unique index or a constraint, depending on how it was created.
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_product_seller_sku_idx'
               AND conrelid = 'public.products'::regclass) THEN
    ALTER TABLE public.products DROP CONSTRAINT unique_product_seller_sku_idx;
  END IF;
  DROP INDEX IF EXISTS public.unique_product_seller_sku_idx;

  -- No bell, push, admin row or fee-trial start for copied rows. Only triggers
  -- that are enabled now are switched off, and step 6 switches them back on.
  CREATE TEMP TABLE s163_off_triggers ON COMMIT DROP AS
    SELECT c.relname AS tbl, t.tgname AS trg
    FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
    WHERE NOT t.tgisinternal AND t.tgenabled <> 'D'
      AND (c.relname, t.tgname) IN (
        ('products', 'products_notify_admin_created'),
        ('products', 'products_start_fee_trial_insert'),
        ('reviews', 'reviews_notify_seller'),
        ('product_questions', 'product_questions_notify_seller'));
  FOR v_t IN SELECT * FROM s163_off_triggers LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER %I', v_t.tbl, v_t.trg);
  END LOOP;

  -- Stock history (0125): every copied stock row is a 'copy' movement in its own store.
  PERFORM set_config('tallaby.stock_reason', 'copy', true),
          set_config('tallaby.stock_actor', '', true),
          set_config('tallaby.stock_order_id', '', true),
          set_config('tallaby.stock_store_id', '', true);

  CREATE TEMP TABLE s163_pcopy ON COMMIT DROP AS
    SELECT m.product_id AS old_id, m.store_id, gen_random_uuid() AS new_id
    FROM s163_member m
    JOIN s163_kept k ON k.product_id = m.product_id
    WHERE m.store_id <> k.store_id;
  CREATE UNIQUE INDEX ON s163_pcopy (old_id, store_id);
  CREATE UNIQUE INDEX ON s163_pcopy (new_id);

  EXECUTE format(
    'INSERT INTO public.products (id, store_id, seller_category_id, seller_brand_id, %s)
     SELECT c.new_id, c.store_id, tc.new_id, tb.new_id, %s
     FROM s163_pcopy c
     JOIN public.products p ON p.id = c.old_id
     JOIN s163_kept k ON k.product_id = c.old_id
     LEFT JOIN s163_tmap tc ON tc.entity = ''seller_category'' AND tc.old_id = k.seller_category_id AND tc.store_id = c.store_id
     LEFT JOIN s163_tmap tb ON tb.entity = ''seller_brand'' AND tb.old_id = k.seller_brand_id AND tb.store_id = c.store_id',
    pg_temp.s163_cols('products', ARRAY['id', 'store_id', 'seller_category_id', 'seller_brand_id']),
    pg_temp.s163_cols('products', ARRAY['id', 'store_id', 'seller_category_id', 'seller_brand_id'], 'p.'));

  -- Variants (ids mapped), translations (same slugs on purpose), digital rows.
  CREATE TEMP TABLE s163_vcopy ON COMMIT DROP AS
    SELECT v.id AS old_id, c.store_id, gen_random_uuid() AS new_id, c.new_id AS new_product_id
    FROM s163_pcopy c JOIN public.product_variants v ON v.product_id = c.old_id;
  CREATE UNIQUE INDEX ON s163_vcopy (old_id, store_id);
  EXECUTE format(
    'INSERT INTO public.product_variants (id, product_id, %s)
     SELECT c.new_id, c.new_product_id, %s
     FROM s163_vcopy c JOIN public.product_variants v ON v.id = c.old_id',
    pg_temp.s163_cols('product_variants', ARRAY['id', 'product_id']),
    pg_temp.s163_cols('product_variants', ARRAY['id', 'product_id'], 'v.'));

  EXECUTE format(
    'INSERT INTO public.product_translations (id, product_id, %s)
     SELECT gen_random_uuid(), c.new_id, %s
     FROM s163_pcopy c JOIN public.product_translations t ON t.product_id = c.old_id',
    pg_temp.s163_cols('product_translations', ARRAY['id', 'product_id']),
    pg_temp.s163_cols('product_translations', ARRAY['id', 'product_id'], 't.'));

  CREATE TEMP TABLE s163_dcopy ON COMMIT DROP AS
    SELECT d.id AS old_id, gen_random_uuid() AS new_id, c.new_id AS new_product_id
    FROM s163_pcopy c JOIN public.digital_products d ON d.product_id = c.old_id;
  EXECUTE format(
    'INSERT INTO public.digital_products (id, product_id, %s)
     SELECT c.new_id, c.new_product_id, %s
     FROM s163_dcopy c JOIN public.digital_products d ON d.id = c.old_id',
    pg_temp.s163_cols('digital_products', ARRAY['id', 'product_id']),
    pg_temp.s163_cols('digital_products', ARRAY['id', 'product_id'], 'd.'));
  EXECUTE format(
    'INSERT INTO public.digital_files (id, digital_product_id, %s)
     SELECT gen_random_uuid(), c.new_id, %s
     FROM s163_dcopy c JOIN public.digital_files f ON f.digital_product_id = c.old_id',
    pg_temp.s163_cols('digital_files', ARRAY['id', 'digital_product_id']),
    pg_temp.s163_cols('digital_files', ARRAY['id', 'digital_product_id'], 'f.'));

  -- Quantity offers (0147) per copy.
  CREATE TEMP TABLE s163_qcopy ON COMMIT DROP AS
    SELECT q.id AS old_id, c.store_id, gen_random_uuid() AS new_id, c.new_id AS new_product_id
    FROM s163_pcopy c JOIN public.product_quantity_offers q ON q.product_id = c.old_id;
  EXECUTE format(
    'INSERT INTO public.product_quantity_offers (id, product_id, %s)
     SELECT c.new_id, c.new_product_id, %s
     FROM s163_qcopy c JOIN public.product_quantity_offers q ON q.id = c.old_id',
    pg_temp.s163_cols('product_quantity_offers', ARRAY['id', 'product_id']),
    pg_temp.s163_cols('product_quantity_offers', ARRAY['id', 'product_id'], 'q.'));

  PERFORM set_config('tallaby.stock_reason', '', true);

  -- Lookup maps "this old id, in store X" for products and variants (kept rows included).
  CREATE TEMP TABLE s163_pmap ON COMMIT DROP AS
    SELECT k.product_id AS old_id, k.store_id, k.product_id AS new_id, 'kept'::text AS kind FROM s163_kept k
    UNION ALL
    SELECT old_id, store_id, new_id, 'copy' FROM s163_pcopy;
  CREATE UNIQUE INDEX ON s163_pmap (old_id, store_id);

  CREATE TEMP TABLE s163_vmap ON COMMIT DROP AS
    SELECT v.id AS old_id, k.store_id, v.id AS new_id, 'kept'::text AS kind
    FROM public.product_variants v JOIN s163_kept k ON k.product_id = v.product_id
    UNION ALL
    SELECT old_id, store_id, new_id, 'copy' FROM s163_vcopy;
  CREATE UNIQUE INDEX ON s163_vmap (old_id, store_id);

  INSERT INTO public.product_store_split (entity, old_id, store_id, new_id, kind)
  SELECT 'product', old_id, store_id, new_id, 'copy' FROM s163_pcopy
  UNION ALL
  SELECT 'variant', old_id, store_id, new_id, kind FROM s163_vmap
  UNION ALL
  SELECT 'quantity_offer', old_id, store_id, new_id, 'copy' FROM s163_qcopy;

  -- Tallaby category counters: each active copy is one more active product.
  UPDATE public.categories c
     SET product_count = c.product_count + x.n
    FROM (SELECT p.category_id, count(*) AS n
            FROM s163_pcopy cp JOIN public.products p ON p.id = cp.new_id
           WHERE p.status = 'active'
           GROUP BY p.category_id) x
   WHERE c.id = x.category_id;

  -- Manual order in a category (0128): each store's category copy gets the
  -- same order for that store's products. The original rows stay as they are.
  INSERT INTO public.seller_category_product_positions (seller_category_id, product_id, seller_id, position, updated_at)
  SELECT t.new_id, pm.new_id, pos.seller_id, pos.position, pos.updated_at
  FROM public.seller_category_product_positions pos
  JOIN s163_pmap pm ON pm.old_id = pos.product_id
  JOIN s163_tmap t ON t.entity = 'seller_category' AND t.old_id = pos.seller_category_id AND t.store_id = pm.store_id
  ON CONFLICT (seller_category_id, product_id) DO NOTHING;
END $$;

-- ═══ 6. Cross-sells, discount rules, coupons, reviews, questions ═══════════
DO $$
DECLARE
  v_t record;
BEGIN
  IF current_setting('tallaby.split_0163', true) IS DISTINCT FROM 'run' THEN RETURN; END IF;

  -- Cross-sells (0145). A store-specific row is remapped to that store's ids.
  -- A NULL-store row ("every store") becomes one row per store that shows both
  -- products (no copy where a store-specific twin exists). The original row
  -- goes to the store where both ids are already the kept rows when there is
  -- one, else to the first such store (primary first). A row whose products
  -- never met in one store could not show anywhere: it is left as it is.
  CREATE TEMP TABLE s163_xplan ON COMMIT DROP AS
  WITH cand AS (
    SELECT x.id AS xid, x.store_id IS NULL AS was_null, s.store_id, s.is_primary, s.created_at,
           pp.new_id AS new_product_id, po.new_id AS new_offer_id,
           coalesce(vv.new_id, x.offer_variant_id) AS new_variant_id,
           (pp.new_id = x.product_id AND po.new_id = x.offer_product_id) AS both_kept
    FROM public.product_cross_sells x
    JOIN s163_store s ON s.seller_id = x.seller_id AND (x.store_id IS NULL OR x.store_id = s.store_id)
    JOIN s163_pmap pp ON pp.old_id = x.product_id AND pp.store_id = s.store_id
    JOIN s163_pmap po ON po.old_id = x.offer_product_id AND po.store_id = s.store_id
    LEFT JOIN s163_vmap vv ON vv.old_id = x.offer_variant_id AND vv.store_id = s.store_id
    WHERE x.store_id IS NOT NULL
       OR NOT EXISTS (
            SELECT 1 FROM public.product_cross_sells y
            WHERE y.store_id = s.store_id AND y.product_id = x.product_id
              AND y.offer_product_id = x.offer_product_id
              AND y.offer_variant_id IS NOT DISTINCT FROM x.offer_variant_id)
  ), ranked AS (
    SELECT cand.*, row_number() OVER (
             PARTITION BY xid ORDER BY both_kept DESC, is_primary DESC, created_at, store_id) AS rn
    FROM cand
  )
  SELECT xid, was_null, store_id, new_product_id, new_offer_id, new_variant_id,
         rn = 1 AS is_home,
         CASE WHEN rn = 1 THEN xid ELSE gen_random_uuid() END AS new_id
  FROM ranked;

  EXECUTE format(
    'INSERT INTO public.product_cross_sells (id, store_id, product_id, offer_product_id, offer_variant_id, %s)
     SELECT c.new_id, c.store_id, c.new_product_id, c.new_offer_id, c.new_variant_id, %s
     FROM s163_xplan c JOIN public.product_cross_sells x ON x.id = c.xid
     WHERE NOT c.is_home',
    pg_temp.s163_cols('product_cross_sells', ARRAY['id', 'store_id', 'product_id', 'offer_product_id', 'offer_variant_id']),
    pg_temp.s163_cols('product_cross_sells', ARRAY['id', 'store_id', 'product_id', 'offer_product_id', 'offer_variant_id'], 'x.'));

  UPDATE public.product_cross_sells x
     SET store_id = c.store_id,
         product_id = c.new_product_id,
         offer_product_id = c.new_offer_id,
         offer_variant_id = c.new_variant_id
    FROM s163_xplan c
   WHERE c.is_home AND x.id = c.xid
     AND (x.store_id, x.product_id, x.offer_product_id, x.offer_variant_id)
         IS DISTINCT FROM (c.store_id, c.new_product_id, c.new_offer_id, c.new_variant_id);

  INSERT INTO public.product_store_split (entity, old_id, store_id, new_id, kind, prev_status)
  SELECT 'cross_sell', xid, store_id, new_id,
         CASE WHEN is_home THEN 'kept' ELSE 'copy' END,
         CASE WHEN is_home AND was_null THEN 'every_store' END
  FROM s163_xplan;

  -- Discount rules (0148) are already per store: their category and gift ids
  -- become that store's ids. An id with no row in the store is left as it is
  -- (checkout already refuses it there).
  UPDATE public.store_discount_rules r
     SET category_ids = x.category_ids, gift_product_ids = x.gift_product_ids
    FROM (
      SELECT r2.id,
             coalesce((SELECT array_agg(coalesce(t.new_id, e.id) ORDER BY e.ord)
                         FROM unnest(r2.category_ids) WITH ORDINALITY AS e(id, ord)
                         LEFT JOIN s163_tmap t ON t.entity = 'seller_category' AND t.old_id = e.id AND t.store_id = r2.store_id),
                      '{}'::uuid[]) AS category_ids,
             coalesce((SELECT array_agg(coalesce(pm.new_id, e.id) ORDER BY e.ord)
                         FROM unnest(r2.gift_product_ids) WITH ORDINALITY AS e(id, ord)
                         LEFT JOIN s163_pmap pm ON pm.old_id = e.id AND pm.store_id = r2.store_id),
                      '{}'::uuid[]) AS gift_product_ids
      FROM public.store_discount_rules r2
    ) x
   WHERE x.id = r.id
     AND (r.category_ids IS DISTINCT FROM x.category_ids OR r.gift_product_ids IS DISTINCT FROM x.gift_product_ids);

  -- Coupons stay "every store" (store_id NULL, plan §2.1.4): a product list
  -- gains the copies of each product in it, so the coupon works in every store
  -- as before. Same for exclude_items.
  CREATE TEMP TABLE s163_coupon_ids ON COMMIT DROP AS
    SELECT co.id,
           pg_temp.s163_add_copy_ids(co.applicable_to) AS applicable_to,
           pg_temp.s163_add_copy_ids(co.exclude_items) AS exclude_items
    FROM public.coupons co
    WHERE jsonb_typeof(co.applicable_to -> 'productIds') = 'array'
       OR jsonb_typeof(co.exclude_items -> 'productIds') = 'array';
  UPDATE public.coupons co
     SET applicable_to = x.applicable_to, exclude_items = x.exclude_items
    FROM s163_coupon_ids x
   WHERE x.id = co.id
     AND (co.applicable_to IS DISTINCT FROM x.applicable_to OR co.exclude_items IS DISTINCT FROM x.exclude_items);

  -- Reviews and questions (owner Q4): each copy shows what the product page
  -- shows today, the approved reviews (both sources) and approved questions
  -- with their answers. Ratings and counters were copied with the product.
  -- Votes and review comments are not copied.
  CREATE TEMP TABLE s163_rcopy ON COMMIT DROP AS
    SELECT rv.id AS old_id, c.store_id, gen_random_uuid() AS new_id, c.new_id AS new_product_id
    FROM s163_pcopy c JOIN public.reviews rv ON rv.product_id = c.old_id AND rv.status = 'approved';
  EXECUTE format(
    'INSERT INTO public.reviews (id, product_id, %s)
     SELECT c.new_id, c.new_product_id, %s
     FROM s163_rcopy c JOIN public.reviews rv ON rv.id = c.old_id',
    pg_temp.s163_cols('reviews', ARRAY['id', 'product_id']),
    pg_temp.s163_cols('reviews', ARRAY['id', 'product_id'], 'rv.'));

  CREATE TEMP TABLE s163_qacopy ON COMMIT DROP AS
    SELECT q.id AS old_id, c.store_id, gen_random_uuid() AS new_id, c.new_id AS new_product_id
    FROM s163_pcopy c JOIN public.product_questions q ON q.product_id = c.old_id AND q.status = 'approved';
  EXECUTE format(
    'INSERT INTO public.product_questions (id, product_id, %s)
     SELECT c.new_id, c.new_product_id, %s
     FROM s163_qacopy c JOIN public.product_questions q ON q.id = c.old_id',
    pg_temp.s163_cols('product_questions', ARRAY['id', 'product_id']),
    pg_temp.s163_cols('product_questions', ARRAY['id', 'product_id'], 'q.'));
  EXECUTE format(
    'INSERT INTO public.product_answers (id, question_id, %s)
     SELECT gen_random_uuid(), c.new_id, %s
     FROM s163_qacopy c JOIN public.product_answers a ON a.question_id = c.old_id',
    pg_temp.s163_cols('product_answers', ARRAY['id', 'question_id']),
    pg_temp.s163_cols('product_answers', ARRAY['id', 'question_id'], 'a.'));

  INSERT INTO public.product_store_split (entity, old_id, store_id, new_id, kind)
  SELECT 'review', old_id, store_id, new_id, 'copy' FROM s163_rcopy
  UNION ALL
  SELECT 'question', old_id, store_id, new_id, 'copy' FROM s163_qacopy;

  -- Notifications back on (only the ones this file switched off).
  FOR v_t IN SELECT * FROM s163_off_triggers LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER %I', v_t.tbl, v_t.trg);
  END LOOP;
END $$;

-- ═══ 7. Remap references to the store's own rows ══════════════════════════
DO $$
DECLARE
  v_s record;
  v_snap jsonb;
  v_rev uuid;
  v_n bigint;
BEGIN
  IF current_setting('tallaby.split_0163', true) IS DISTINCT FROM 'run' THEN RETURN; END IF;

  -- Open store carts: product, variant (cart_items.variant->>'id') and cross-sell.
  UPDATE public.cart_items ci
     SET product_id = pm.new_id
    FROM public.carts c, s163_pcopy pm
   WHERE c.id = ci.cart_id AND c.status = 'active' AND c.store_id IS NOT NULL
     AND pm.store_id = c.store_id AND pm.old_id = ci.product_id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE '0163: % open store cart line(s) now point at their store''s copy', v_n;

  UPDATE public.cart_items ci
     SET variant = jsonb_set(ci.variant, '{id}', to_jsonb(vm.new_id::text))
    FROM public.carts c, s163_vcopy vm
   WHERE c.id = ci.cart_id AND c.status = 'active' AND c.store_id IS NOT NULL
     AND jsonb_typeof(ci.variant) = 'object'
     AND vm.store_id = c.store_id AND vm.old_id::text = lower(ci.variant ->> 'id');

  UPDATE public.cart_items ci
     SET cross_sell_id = xp.new_id
    FROM public.carts c, s163_xplan xp
   WHERE c.id = ci.cart_id AND c.status = 'active' AND c.store_id IS NOT NULL
     AND xp.xid = ci.cross_sell_id AND xp.store_id = c.store_id AND xp.new_id <> ci.cross_sell_id;

  -- Open back-in-stock alerts (0126) follow their store's copy.
  UPDATE public.store_stock_subscriptions s
     SET product_id = pm.new_id
    FROM s163_pcopy pm
   WHERE pm.store_id = s.store_id AND pm.old_id = s.product_id
     AND s.notified_at IS NULL AND s.cancelled_at IS NULL;
  UPDATE public.store_stock_subscriptions s
     SET variant_id = vm.new_id
    FROM s163_vcopy vm
   WHERE vm.store_id = s.store_id AND vm.old_id = s.variant_id
     AND s.notified_at IS NULL AND s.cancelled_at IS NULL;

  -- Email campaign products (0129), per campaign store.
  UPDATE public.store_email_campaigns ec
     SET product_ids = x.product_ids
    FROM (
      SELECT e2.id,
             coalesce((SELECT array_agg(coalesce(pm.new_id, e.id) ORDER BY e.ord)
                         FROM unnest(e2.product_ids) WITH ORDINALITY AS e(id, ord)
                         LEFT JOIN s163_pmap pm ON pm.old_id = e.id AND pm.store_id = e2.store_id),
                      '{}'::uuid[]) AS product_ids
      FROM public.store_email_campaigns e2
      WHERE cardinality(e2.product_ids) > 0
    ) x
   WHERE x.id = ec.id AND ec.product_ids IS DISTINCT FROM x.product_ids;

  -- Builder JSON (R4): every id copied into a store is replaced in that store's
  -- own documents.
  CREATE TEMP TABLE s163_pairs ON COMMIT DROP AS
    SELECT store_id, jsonb_object_agg(old_id::text, new_id::text) AS pairs
    FROM public.product_store_split
    WHERE kind = 'copy'
    GROUP BY store_id;

  UPDATE public.store_pages sp
     SET draft_content = x.doc, draft_version = sp.draft_version + 1
    FROM (SELECT sp2.id, pg_temp.s163_replace_ids(sp2.draft_content, p.pairs) AS doc
            FROM public.store_pages sp2 JOIN s163_pairs p ON p.store_id = sp2.store_id) x
   WHERE x.id = sp.id AND x.doc IS DISTINCT FROM sp.draft_content;

  UPDATE public.saved_blocks b
     SET content = x.doc
    FROM (SELECT b2.id, pg_temp.s163_replace_ids(b2.content, p.pairs) AS doc
            FROM public.saved_blocks b2 JOIN s163_pairs p ON p.store_id = b2.store_id) x
   WHERE x.id = b.id AND x.doc IS DISTINCT FROM b.content;

  UPDATE public.template_installs ti
     SET previous_draft = x.doc
    FROM (SELECT t2.id, pg_temp.s163_replace_ids(t2.previous_draft, p.pairs) AS doc
            FROM public.template_installs t2 JOIN s163_pairs p ON p.store_id = t2.store_id
           WHERE t2.previous_draft IS NOT NULL) x
   WHERE x.id = ti.id AND x.doc IS DISTINCT FROM ti.previous_draft;

  UPDATE public.stores st
     SET shared_header = x.h, shared_footer = x.f, settings = x.s, chrome_version = st.chrome_version + 1
    FROM (SELECT st2.id,
                 pg_temp.s163_replace_ids(st2.shared_header, p.pairs) AS h,
                 pg_temp.s163_replace_ids(st2.shared_footer, p.pairs) AS f,
                 pg_temp.s163_replace_ids(st2.settings, p.pairs) AS s
            FROM public.stores st2 JOIN s163_pairs p ON p.store_id = st2.id) x
   WHERE x.id = st.id
     AND (x.h IS DISTINCT FROM st.shared_header OR x.f IS DISTINCT FROM st.shared_footer OR x.s IS DISTINCT FROM st.settings);

  -- Live sites: a new revision with the remapped snapshot (append-only, 0051).
  FOR v_s IN
    SELECT st.id AS store_id, rev.id AS rev_id, rev.schema_version, rev.template_key, rev.snapshot, p.pairs
    FROM public.stores st
    JOIN s163_pairs p ON p.store_id = st.id
    JOIN public.store_site_revisions rev ON rev.id = st.published_revision_id
  LOOP
    v_snap := pg_temp.s163_replace_ids(v_s.snapshot, v_s.pairs);
    IF v_snap IS DISTINCT FROM v_s.snapshot THEN
      INSERT INTO public.store_site_revisions (store_id, revision_number, schema_version, template_key, snapshot, published_by)
      VALUES (v_s.store_id,
              (SELECT coalesce(max(revision_number), 0) + 1 FROM public.store_site_revisions WHERE store_id = v_s.store_id),
              v_s.schema_version, v_s.template_key, v_snap, NULL)
      RETURNING id INTO v_rev;
      UPDATE public.stores SET published_revision_id = v_rev WHERE id = v_s.store_id;
      RAISE NOTICE '0163: store % live site: new revision % (was %)', v_s.store_id, v_rev, v_s.rev_id;
    END IF;
  END LOOP;
END $$;

-- ═══ 8. Constraints and triggers ═══════════════════════════════════════════
DO $$
BEGIN
  IF current_setting('tallaby.split_0163', true) IS DISTINCT FROM 'run' THEN RETURN; END IF;

  CREATE UNIQUE INDEX IF NOT EXISTS unique_product_store_sku_idx
    ON public.products (store_id, sku);

  CREATE UNIQUE INDEX IF NOT EXISTS seller_product_categories_store_name_key
    ON public.seller_product_categories (store_id, lower(btrim(name)));
  CREATE UNIQUE INDEX IF NOT EXISTS seller_product_categories_store_source_key
    ON public.seller_product_categories (store_id, source_category_id) WHERE source_category_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS seller_product_brands_store_name_key
    ON public.seller_product_brands (store_id, lower(btrim(name)));
  CREATE UNIQUE INDEX IF NOT EXISTS seller_product_brands_store_source_key
    ON public.seller_product_brands (store_id, source_brand_id) WHERE source_brand_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS seller_product_categories_store_idx
    ON public.seller_product_categories (store_id, position);
  CREATE INDEX IF NOT EXISTS seller_product_brands_store_idx
    ON public.seller_product_brands (store_id, position);

  DROP TRIGGER IF EXISTS products_store_same_seller ON public.products;
  CREATE TRIGGER products_store_same_seller
    BEFORE INSERT OR UPDATE OF store_id, seller_id ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.products_store_same_seller();

  DROP TRIGGER IF EXISTS products_taxonomy_same_store ON public.products;
  CREATE TRIGGER products_taxonomy_same_store
    BEFORE INSERT OR UPDATE OF seller_category_id, seller_brand_id, seller_id, store_id ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.products_taxonomy_same_store();

  DROP TRIGGER IF EXISTS seller_product_categories_store_in_use ON public.seller_product_categories;
  CREATE TRIGGER seller_product_categories_store_in_use
    BEFORE UPDATE OF store_id, seller_id ON public.seller_product_categories
    FOR EACH ROW EXECUTE FUNCTION public.seller_taxonomy_store_in_use();
  DROP TRIGGER IF EXISTS seller_product_brands_store_in_use ON public.seller_product_brands;
  CREATE TRIGGER seller_product_brands_store_in_use
    BEFORE UPDATE OF store_id, seller_id ON public.seller_product_brands
    FOR EACH ROW EXECUTE FUNCTION public.seller_taxonomy_store_in_use();

  -- NOT NULL as checks for now (0165 makes them column constraints).
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_store_id_not_null') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_store_id_not_null CHECK (store_id IS NOT NULL) NOT VALID;
  END IF;
  ALTER TABLE public.products VALIDATE CONSTRAINT products_store_id_not_null;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seller_product_categories_store_id_not_null') THEN
    ALTER TABLE public.seller_product_categories
      ADD CONSTRAINT seller_product_categories_store_id_not_null CHECK (store_id IS NOT NULL) NOT VALID;
  END IF;
  ALTER TABLE public.seller_product_categories VALIDATE CONSTRAINT seller_product_categories_store_id_not_null;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'seller_product_brands_store_id_not_null') THEN
    ALTER TABLE public.seller_product_brands
      ADD CONSTRAINT seller_product_brands_store_id_not_null CHECK (store_id IS NOT NULL) NOT VALID;
  END IF;
  ALTER TABLE public.seller_product_brands VALIDATE CONSTRAINT seller_product_brands_store_id_not_null;
END $$;

-- ═══ 9. Invariants (any mismatch rolls the whole file back) ═══════════════
DO $$
DECLARE
  n bigint;
  v_money record;
BEGIN
  IF current_setting('tallaby.split_0163', true) IS DISTINCT FROM 'run' THEN RETURN; END IF;

  -- 9.1 Every product has a store, of its own seller, not deleted.
  SELECT count(*) INTO n
  FROM public.products p LEFT JOIN public.stores st ON st.id = p.store_id
  WHERE p.store_id IS NULL OR st.seller_id IS DISTINCT FROM p.seller_id OR st.deleted_at IS NOT NULL;
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.1: % product(s) without a live store of their seller', n; END IF;

  -- 9.2 Every store shows exactly the products it showed (active, not trashed),
  -- read back to the original ids through the map, and no product twice.
  CREATE TEMP TABLE s163_after_visible ON COMMIT DROP AS
    SELECT p.store_id, coalesce(c.old_id, p.id) AS product_id
    FROM public.products p
    LEFT JOIN s163_pcopy c ON c.new_id = p.id
    WHERE p.status = 'active' AND p.deleted_at IS NULL AND p.purged_at IS NULL;
  SELECT count(*) INTO n FROM (
    (SELECT store_id, product_id FROM s163_after_visible EXCEPT SELECT store_id, product_id FROM s163_before_visible)
    UNION ALL
    (SELECT store_id, product_id FROM s163_before_visible EXCEPT SELECT store_id, product_id FROM s163_after_visible)
  ) d;
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.2: % (store, product) pair(s) visible before and after differ', n; END IF;
  SELECT count(*) - count(DISTINCT (store_id, product_id)) INTO n FROM s163_after_visible;
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.2: % duplicate product(s) in one store', n; END IF;
  SELECT count(*) INTO n FROM (
    SELECT store_id, count(*) FROM s163_after_visible GROUP BY store_id
    EXCEPT SELECT store_id, count(*) FROM s163_before_visible GROUP BY store_id
  ) d;
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.2: % store(s) with a different visible count', n; END IF;

  -- 9.3 Same for every live product (any status); orphans are now the primary store's drafts.
  SELECT count(*) INTO n FROM (
    (SELECT p.store_id, coalesce(c.old_id, p.id)
       FROM public.products p LEFT JOIN s163_pcopy c ON c.new_id = p.id
      WHERE p.deleted_at IS NULL AND p.purged_at IS NULL
     EXCEPT
     (SELECT store_id, product_id FROM s163_member
      UNION SELECT store_id, product_id FROM s163_kept WHERE orphan))
    UNION ALL
    ((SELECT store_id, product_id FROM s163_member
      UNION SELECT store_id, product_id FROM s163_kept WHERE orphan)
     EXCEPT
     SELECT p.store_id, coalesce(c.old_id, p.id)
       FROM public.products p LEFT JOIN s163_pcopy c ON c.new_id = p.id
      WHERE p.deleted_at IS NULL AND p.purged_at IS NULL)
  ) d;
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.3: % live (store, product) pair(s) differ from the memberships', n; END IF;
  SELECT count(*) INTO n FROM public.products p JOIN s163_kept k ON k.product_id = p.id
   WHERE k.orphan AND p.status <> 'draft';
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.3: % orphan(s) not saved as draft', n; END IF;

  -- 9.4 Every copy has as many variants, translations, digital rows and
  -- quantity offers as its source, and the same quantity, status and stock.
  SELECT count(*) INTO n
  FROM s163_pcopy c
  JOIN public.products src ON src.id = c.old_id
  JOIN public.products cp ON cp.id = c.new_id
  WHERE cp.quantity IS DISTINCT FROM src.quantity
     OR cp.status IS DISTINCT FROM src.status
     OR (SELECT count(*) FROM public.product_variants v WHERE v.product_id = cp.id)
        <> (SELECT count(*) FROM public.product_variants v WHERE v.product_id = src.id)
     OR (SELECT coalesce(sum(v.stock), 0) FROM public.product_variants v WHERE v.product_id = cp.id)
        <> (SELECT coalesce(sum(v.stock), 0) FROM public.product_variants v WHERE v.product_id = src.id)
     OR (SELECT count(*) FROM public.product_translations t WHERE t.product_id = cp.id)
        <> (SELECT count(*) FROM public.product_translations t WHERE t.product_id = src.id)
     OR (SELECT count(*) FROM public.digital_products d WHERE d.product_id = cp.id)
        <> (SELECT count(*) FROM public.digital_products d WHERE d.product_id = src.id)
     OR (SELECT count(*) FROM public.product_quantity_offers q WHERE q.product_id = cp.id)
        <> (SELECT count(*) FROM public.product_quantity_offers q WHERE q.product_id = src.id);
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.4: % copy(ies) differ from their source', n; END IF;

  -- 9.5 Same stock numbers: per store, the sum over its products equals the
  -- before sum over its memberships.
  SELECT count(*) INTO n FROM (
    SELECT b.store_id
    FROM s163_before_stock b
    LEFT JOIN LATERAL (
      SELECT coalesce(sum(p.quantity), 0) AS qty,
             coalesce(sum((SELECT coalesce(sum(v.stock), 0) FROM public.product_variants v WHERE v.product_id = p.id)), 0) AS variant_stock
      FROM s163_member m
      JOIN s163_pmap pm ON pm.old_id = m.product_id AND pm.store_id = m.store_id
      JOIN public.products p ON p.id = pm.new_id
      WHERE m.store_id = b.store_id
    ) a ON true
    WHERE a.qty IS DISTINCT FROM b.qty OR a.variant_stock IS DISTINCT FROM b.variant_stock
  ) d;
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.5: % store(s) with different stock sums', n; END IF;

  -- 9.6 No open store cart line points at another store's row when its store has one.
  SELECT count(*) INTO n
  FROM s163_before_cart b
  JOIN public.cart_items ci ON ci.id = b.cart_item_id
  JOIN public.products p ON p.id = ci.product_id
  WHERE p.store_id <> b.store_id;
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.6: % open store cart line(s) point at another store''s product', n; END IF;
  SELECT count(*) INTO n
  FROM public.cart_items ci
  JOIN public.carts c ON c.id = ci.cart_id
  JOIN s163_xplan xa ON xa.new_id = ci.cross_sell_id
  JOIN s163_xplan xb ON xb.xid = xa.xid AND xb.store_id = c.store_id
  WHERE c.status = 'active' AND c.store_id IS NOT NULL AND ci.cross_sell_id <> xb.new_id;
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.6: % open cart line(s) keep another store''s cross-sell', n; END IF;

  -- 9.7 No category or brand is shared across stores; every store has the whole list.
  SELECT count(*) INTO n
  FROM public.products p
  LEFT JOIN public.seller_product_categories c ON c.id = p.seller_category_id
  LEFT JOIN public.seller_product_brands b ON b.id = p.seller_brand_id
  WHERE (p.seller_category_id IS NOT NULL AND c.store_id IS DISTINCT FROM p.store_id)
     OR (p.seller_brand_id IS NOT NULL AND b.store_id IS DISTINCT FROM p.store_id);
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.7: % product(s) use a category or brand of another store', n; END IF;
  SELECT count(*) INTO n
  FROM s163_pcopy c JOIN s163_kept k ON k.product_id = c.old_id JOIN public.products p ON p.id = c.new_id
  WHERE (k.seller_category_id IS NOT NULL AND p.seller_category_id IS NULL)
     OR (k.seller_brand_id IS NOT NULL AND p.seller_brand_id IS NULL);
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.7: % copy(ies) lost their category or brand', n; END IF;
  SELECT count(*) INTO n FROM (
    SELECT s.store_id
    FROM s163_store s JOIN s163_before_tax bt ON bt.seller_id = s.seller_id
    WHERE (SELECT count(*) FROM public.seller_product_categories c WHERE c.store_id = s.store_id) <> bt.categories
       OR (SELECT count(*) FROM public.seller_product_brands b WHERE b.store_id = s.store_id) <> bt.brands
  ) d;
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.7: % store(s) without the seller''s whole category/brand list', n; END IF;
  SELECT count(*) INTO n
  FROM public.seller_product_categories c LEFT JOIN public.stores st ON st.id = c.store_id
  WHERE st.seller_id IS DISTINCT FROM c.seller_id OR st.deleted_at IS NOT NULL;
  SELECT n + count(*) INTO n
  FROM public.seller_product_brands b LEFT JOIN public.stores st ON st.id = b.store_id
  WHERE st.seller_id IS DISTINCT FROM b.seller_id OR st.deleted_at IS NOT NULL;
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.7: % category/brand row(s) not in a live store of their seller', n; END IF;

  -- 9.8 Every planned cross-sell row pairs products (and variant) of its own store.
  SELECT count(*) INTO n
  FROM s163_xplan xp
  JOIN public.product_cross_sells x ON x.id = xp.new_id
  JOIN public.products a ON a.id = x.product_id
  JOIN public.products o ON o.id = x.offer_product_id
  LEFT JOIN public.product_variants v ON v.id = x.offer_variant_id
  WHERE x.store_id IS DISTINCT FROM xp.store_id OR a.store_id <> x.store_id OR o.store_id <> x.store_id
     OR (x.offer_variant_id IS NOT NULL AND v.product_id IS DISTINCT FROM x.offer_product_id);
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.8: % cross-sell(s) cross a store', n; END IF;

  -- 9.9 Each copy has the approved reviews and questions of its source.
  SELECT count(*) INTO n
  FROM s163_pcopy c
  WHERE (SELECT count(*) FROM public.reviews r WHERE r.product_id = c.new_id AND r.status = 'approved')
        <> (SELECT count(*) FROM public.reviews r WHERE r.product_id = c.old_id AND r.status = 'approved')
     OR (SELECT count(*) FROM public.product_questions q WHERE q.product_id = c.new_id AND q.status = 'approved')
        <> (SELECT count(*) FROM public.product_questions q WHERE q.product_id = c.old_id AND q.status = 'approved');
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.9: % copy(ies) with different reviews or questions', n; END IF;

  -- 9.10 Map: one kept/orphan row per product, one copy row per extra membership.
  SELECT count(*) INTO n FROM public.products p
  WHERE NOT EXISTS (SELECT 1 FROM public.product_store_split m
                     WHERE m.entity = 'product' AND m.new_id = p.id AND m.store_id = p.store_id);
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.10: % product(s) missing from the split map', n; END IF;
  SELECT abs((SELECT count(*) FROM public.product_store_split WHERE entity = 'product' AND kind = 'copy')
             - (SELECT coalesce(sum(cnt - 1), 0) FROM (SELECT count(*) AS cnt FROM s163_member GROUP BY product_id) x))
    INTO n;
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.10: copies made differ from the memberships by %', n; END IF;

  -- 9.11 Category positions follow each store's copies.
  SELECT count(*) INTO n
  FROM public.seller_category_product_positions pos
  JOIN s163_pmap pm ON pm.old_id = pos.product_id
  JOIN s163_tmap t ON t.entity = 'seller_category' AND t.old_id = pos.seller_category_id AND t.store_id = pm.store_id
  WHERE NOT EXISTS (SELECT 1 FROM public.seller_category_product_positions x
                     WHERE x.seller_category_id = t.new_id AND x.product_id = pm.new_id AND x.position = pos.position);
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.11: % category position(s) not copied', n; END IF;

  -- 9.12 Discount rules and builder documents hold no id that has a copy in their store.
  SELECT count(*) INTO n
  FROM public.store_discount_rules r
  WHERE EXISTS (SELECT 1 FROM unnest(r.category_ids) e(id)
                  JOIN s163_tmap t ON t.entity = 'seller_category' AND t.kind = 'copy' AND t.old_id = e.id AND t.store_id = r.store_id)
     OR EXISTS (SELECT 1 FROM unnest(r.gift_product_ids) e(id)
                  JOIN s163_pcopy c ON c.old_id = e.id AND c.store_id = r.store_id);
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.12: % discount rule(s) still use another store''s ids', n; END IF;
  SELECT count(*) INTO n
  FROM s163_pairs p
  JOIN public.stores st ON st.id = p.store_id
  LEFT JOIN public.store_site_revisions rev ON rev.id = st.published_revision_id
  WHERE pg_temp.s163_replace_ids(rev.snapshot, p.pairs) IS DISTINCT FROM rev.snapshot
     OR pg_temp.s163_replace_ids(st.shared_header, p.pairs) IS DISTINCT FROM st.shared_header
     OR pg_temp.s163_replace_ids(st.shared_footer, p.pairs) IS DISTINCT FROM st.shared_footer
     OR EXISTS (SELECT 1 FROM public.store_pages sp WHERE sp.store_id = p.store_id
                  AND pg_temp.s163_replace_ids(sp.draft_content, p.pairs) IS DISTINCT FROM sp.draft_content)
     OR EXISTS (SELECT 1 FROM public.saved_blocks b WHERE b.store_id = p.store_id
                  AND pg_temp.s163_replace_ids(b.content, p.pairs) IS DISTINCT FROM b.content);
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.12: % store(s) whose builder documents still name copied ids', n; END IF;

  -- 9.13 No money moved, no order changed.
  SELECT * INTO v_money FROM s163_before_money;
  IF v_money.wallet_sum IS DISTINCT FROM (SELECT coalesce(sum(balance), 0) FROM public.seller_wallet)
     OR v_money.wallets <> (SELECT count(*) FROM public.seller_wallet)
     OR v_money.ledger_rows <> (SELECT count(*) FROM public.wallet_transactions)
     OR v_money.ledger_sum IS DISTINCT FROM (SELECT coalesce(sum(amount), 0) FROM public.wallet_transactions)
     OR v_money.mirror_sum IS DISTINCT FROM (SELECT coalesce(sum(wallet_balance), 0) FROM public.sellers)
     OR v_money.orders <> (SELECT count(*) FROM public.orders)
     OR v_money.order_items <> (SELECT count(*) FROM public.order_items) THEN
    RAISE EXCEPTION '0163 invariant 9.13: wallet, ledger or order totals changed';
  END IF;

  -- 9.14 Stock history: this transaction wrote only 'copy' movements, each in its product's store.
  SELECT count(*) INTO n
  FROM public.stock_movements sm JOIN public.products p ON p.id = sm.product_id
  WHERE sm.created_at = now() AND (sm.reason <> 'copy' OR sm.store_id IS DISTINCT FROM p.store_id
                                   OR NOT EXISTS (SELECT 1 FROM s163_pcopy c WHERE c.new_id = sm.product_id));
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.14: % unexpected stock movement(s)', n; END IF;

  -- 9.15 Notifications are back on.
  SELECT count(*) INTO n
  FROM s163_off_triggers o
  JOIN pg_trigger t ON t.tgname = o.trg AND t.tgrelid = ('public.' || quote_ident(o.tbl))::regclass
  WHERE t.tgenabled = 'D';
  IF n > 0 THEN RAISE EXCEPTION '0163 invariant 9.15: % notification trigger(s) still disabled', n; END IF;

  RAISE NOTICE '0163: split done: % product copies, % variant copies, % category/brand copies, % cross-sell copies, % review copies, % question copies',
    (SELECT count(*) FROM s163_pcopy), (SELECT count(*) FROM s163_vcopy),
    (SELECT count(*) FROM s163_tmap WHERE kind = 'copy'),
    (SELECT count(*) FROM s163_xplan WHERE NOT is_home),
    (SELECT count(*) FROM s163_rcopy), (SELECT count(*) FROM s163_qacopy);
END $$;

-- ═══ 10. The switch (last statement) ══════════════════════════════════════
UPDATE public.platform_switches
   SET enabled = true, changed_at = now(), changed_by = NULL
 WHERE key = 'stores_catalog_split'
   AND current_setting('tallaby.split_0163', true) = 'run';

COMMIT;
