-- Undo 0163_store_catalog_split.sql (ROADMAP.md F-87m; docs/plans/stores-separation.md §3.2
-- "Rollback", §3.5). Only BEFORE 0165: 0165 drops store_products and
-- catalog_mode, which the switch-off code reads.
--
--   psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f packages/db/scripts/stores-split-rollback.sql
--
-- One transaction. Owner approval on production (CLAUDE.md rule 4).
--
-- It REFUSES (RAISE EXCEPTION, nothing changes) when undoing would lose real data:
--   * any order line points at a copied product or variant (deleting a copy
--     would CASCADE its order_items);
--   * any ad request points at a copied product (it was paid from the wallet);
--   * any customer review or question was written on a copy after the split
--     (it would be deleted with the copy);
--   * the split map has rows that 0163 did not write ("Copy to store", F-87j);
--   * restoring the per-seller unique keys would fail: two products of one
--     seller now share a SKU, or two categories/brands of one seller now share
--     a name or a Tallaby source (made in different stores after the split).
-- Each refusal says what to look at. Fix it (or ask the owner) and run again.
--
-- What it does, in order (references first, so no CASCADE eats them):
--   1. switch `stores_catalog_split` off;
--   2. drop the 0163 triggers and NOT NULL checks;
--   3. point everything back at the original rows: open and closed cart lines,
--      back-in-stock alerts, email campaigns, discount rules, coupon lists
--      (copy ids removed), products' categories and brands, cross-sells (copies
--      deleted, the original gets its ids and its "every store" NULL back),
--      category positions of products made after the split, builder JSON
--      (drafts, saved blocks, shared header/footer, template-undo drafts,
--      settings), and live sites (a new revision when the live snapshot names
--      a copy);
--   4. orphans get their old status back (only while still draft);
--   5. Tallaby category counters lose the active copies, regain restored orphans;
--   6. delete the copied products (variants, translations, digital rows,
--      quantity offers, copied reviews and questions, their stock movements go
--      with them) and the copied categories and brands;
--   7. per-store unique keys back to per seller (SKU, category and brand names
--      and sources);
--   8. empty product_store_split.
-- Left on purpose: products.store_id and the taxonomy store_id written by 0163
-- (nothing reads them with the switch off, and 0163 overwrites them by its own
-- rule if run again), record_stock_movement accepting 'copy', and the
-- notify_admin_product_created body (it still works without the split).
-- Wishlist lines and back-in-stock alerts made on a copy after the split that
-- could not be pointed back are deleted with the copy.
--
-- Idempotent: with no 0163 rows in the map it only makes sure the switch is
-- off, the triggers are gone and the per-seller keys are back.

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '15min';

CREATE OR REPLACE FUNCTION pg_temp.s163r_replace_ids(doc jsonb, pairs jsonb)
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

-- A coupon list without the copy ids 0163 appended.
CREATE OR REPLACE FUNCTION pg_temp.s163r_drop_copy_ids(j jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $f$
DECLARE
  kept jsonb;
BEGIN
  IF j IS NULL OR jsonb_typeof(j -> 'productIds') IS DISTINCT FROM 'array' THEN
    RETURN j;
  END IF;
  SELECT coalesce(jsonb_agg(e.v ORDER BY e.o), '[]'::jsonb)
    INTO kept
    FROM jsonb_array_elements(j -> 'productIds') WITH ORDINALITY AS e(v, o)
   WHERE NOT EXISTS (SELECT 1 FROM s163r_copy c
                      WHERE c.entity = 'product' AND jsonb_typeof(e.v) = 'string'
                        AND c.new_id::text = lower(e.v #>> '{}'));
  IF kept = (j -> 'productIds') THEN
    RETURN j;
  END IF;
  RETURN jsonb_set(j, '{productIds}', kept);
END;
$f$;

-- ── Guards ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_rows bigint;
  v_at timestamptz;
  n bigint;
  v_list text;
BEGIN
  LOCK TABLE
    public.platform_switches,
    public.stores, public.store_products, public.products, public.product_variants,
    public.product_translations, public.digital_products, public.digital_files,
    public.seller_product_categories, public.seller_product_brands, public.seller_categories,
    public.seller_category_product_positions, public.product_quantity_offers,
    public.product_cross_sells, public.store_discount_rules, public.coupons,
    public.reviews, public.product_questions, public.product_answers, public.cart_items,
    public.store_stock_subscriptions, public.store_email_campaigns, public.store_pages,
    public.store_site_revisions, public.saved_blocks, public.template_installs, public.categories,
    public.order_items, public.ad_campaign_requests, public.wishlist_items
  IN SHARE ROW EXCLUSIVE MODE;

  SELECT count(*), min(created_at) INTO v_rows, v_at FROM public.product_store_split;
  IF v_rows = 0 THEN
    PERFORM set_config('tallaby.split_rollback', 'ddl', true);
    RAISE NOTICE 'rollback: product_store_split is empty, no data to undo. Making sure the switch is off and the per-seller keys are back.';
    RETURN;
  END IF;

  -- Every 0163 row has the same created_at (one transaction's now()).
  SELECT count(*) INTO n FROM public.product_store_split WHERE created_at <> v_at;
  IF n > 0 THEN
    RAISE EXCEPTION 'rollback refused: % split map row(s) were written after 0163 (Copy to store, F-87j). Undo those copies first; this script only undoes 0163.', n;
  END IF;

  CREATE TEMP TABLE s163r_copy ON COMMIT DROP AS
    SELECT entity, old_id, store_id, new_id FROM public.product_store_split WHERE kind = 'copy';
  CREATE UNIQUE INDEX ON s163r_copy (entity, new_id);

  -- Orders on copies.
  SELECT count(DISTINCT oi.order_id),
         string_agg(DISTINCT oi.order_id::text, ', ')
    INTO n, v_list
    FROM public.order_items oi
   WHERE oi.product_id IN (SELECT new_id FROM s163r_copy WHERE entity = 'product')
      OR oi.variant_id IN (SELECT new_id FROM s163r_copy WHERE entity = 'variant');
  IF n > 0 THEN
    RAISE EXCEPTION 'rollback refused: % order(s) were placed on copied products since the split (%). Deleting the copies would delete those order lines. Leave the split in place, or ask the owner how to move those orders first.', n, left(v_list, 800);
  END IF;

  SELECT count(*) INTO n FROM public.ad_campaign_requests a
   WHERE a.product_id IN (SELECT new_id FROM s163r_copy WHERE entity = 'product');
  IF n > 0 THEN
    RAISE EXCEPTION 'rollback refused: % paid ad request(s) point at copied products. Deleting the copies would delete them.', n;
  END IF;

  SELECT count(*) INTO n FROM public.reviews r
   WHERE r.product_id IN (SELECT new_id FROM s163r_copy WHERE entity = 'product')
     AND r.id NOT IN (SELECT new_id FROM s163r_copy WHERE entity = 'review');
  SELECT n + count(*) INTO n FROM public.product_questions q
   WHERE q.product_id IN (SELECT new_id FROM s163r_copy WHERE entity = 'product')
     AND q.id NOT IN (SELECT new_id FROM s163r_copy WHERE entity = 'question');
  IF n > 0 THEN
    RAISE EXCEPTION 'rollback refused: % customer review(s)/question(s) were written on copied products since the split. They would be deleted with the copies.', n;
  END IF;

  -- The per-seller unique keys must fit the rows that remain.
  SELECT count(*) INTO n FROM (
    SELECT seller_id, sku FROM public.products
     WHERE sku IS NOT NULL AND id NOT IN (SELECT new_id FROM s163r_copy WHERE entity = 'product')
     GROUP BY seller_id, sku HAVING count(*) > 1) d;
  IF n > 0 THEN
    RAISE EXCEPTION 'rollback refused: % SKU(s) are now used by two products of one seller (made in different stores after the split). Rename one of each pair first: SELECT seller_id, sku, array_agg(id) FROM products GROUP BY 1, 2 HAVING count(*) > 1;', n;
  END IF;
  SELECT count(*) INTO n FROM (
    SELECT seller_id, lower(btrim(name)) FROM public.seller_product_categories
     WHERE id NOT IN (SELECT new_id FROM s163r_copy WHERE entity = 'seller_category')
     GROUP BY 1, 2 HAVING count(*) > 1
    UNION ALL
    SELECT seller_id, source_category_id::text FROM public.seller_product_categories
     WHERE source_category_id IS NOT NULL AND id NOT IN (SELECT new_id FROM s163r_copy WHERE entity = 'seller_category')
     GROUP BY 1, 2 HAVING count(*) > 1
    UNION ALL
    SELECT seller_id, lower(btrim(name)) FROM public.seller_product_brands
     WHERE id NOT IN (SELECT new_id FROM s163r_copy WHERE entity = 'seller_brand')
     GROUP BY 1, 2 HAVING count(*) > 1
    UNION ALL
    SELECT seller_id, source_brand_id::text FROM public.seller_product_brands
     WHERE source_brand_id IS NOT NULL AND id NOT IN (SELECT new_id FROM s163r_copy WHERE entity = 'seller_brand')
     GROUP BY 1, 2 HAVING count(*) > 1
  ) d;
  IF n > 0 THEN
    RAISE EXCEPTION 'rollback refused: % category/brand name(s) or source(s) now exist twice for one seller (added in different stores after the split). Rename or merge them first.', n;
  END IF;

  PERFORM set_config('tallaby.split_rollback', 'run', true);
END $$;

-- ── 1. Switch off ───────────────────────────────────────────────────────
UPDATE public.platform_switches
   SET enabled = false, changed_at = now(), changed_by = NULL
 WHERE key = 'stores_catalog_split' AND enabled;

-- ── 2. 0163 triggers and checks ─────────────────────────────────────────
DROP TRIGGER IF EXISTS products_taxonomy_same_store ON public.products;
DROP TRIGGER IF EXISTS products_store_same_seller ON public.products;
DROP TRIGGER IF EXISTS seller_product_categories_store_in_use ON public.seller_product_categories;
DROP TRIGGER IF EXISTS seller_product_brands_store_in_use ON public.seller_product_brands;
DROP FUNCTION IF EXISTS public.products_taxonomy_same_store();
DROP FUNCTION IF EXISTS public.products_store_same_seller();
DROP FUNCTION IF EXISTS public.seller_taxonomy_store_in_use();
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_store_id_not_null;
ALTER TABLE public.seller_product_categories DROP CONSTRAINT IF EXISTS seller_product_categories_store_id_not_null;
ALTER TABLE public.seller_product_brands DROP CONSTRAINT IF EXISTS seller_product_brands_store_id_not_null;

-- ── 3–6. Data ───────────────────────────────────────────────────────────
DO $$
DECLARE
  v_s record;
  v_snap jsonb;
  v_rev uuid;
  v_n bigint;
BEGIN
  IF current_setting('tallaby.split_rollback', true) IS DISTINCT FROM 'run' THEN RETURN; END IF;

  -- 3a. Cart lines (any cart status) back on the original rows.
  UPDATE public.cart_items ci SET product_id = c.old_id
    FROM s163r_copy c WHERE c.entity = 'product' AND c.new_id = ci.product_id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'rollback: % cart line(s) back on the original product', v_n;
  UPDATE public.cart_items ci SET variant = jsonb_set(ci.variant, '{id}', to_jsonb(c.old_id::text))
    FROM s163r_copy c
   WHERE c.entity = 'variant' AND jsonb_typeof(ci.variant) = 'object' AND c.new_id::text = lower(ci.variant ->> 'id');
  UPDATE public.cart_items ci SET cross_sell_id = c.old_id
    FROM s163r_copy c WHERE c.entity = 'cross_sell' AND c.new_id = ci.cross_sell_id;

  -- 3b. Back-in-stock alerts. An open alert that would clash with an open one
  -- already on the original is closed (cancelled) instead.
  UPDATE public.store_stock_subscriptions s SET cancelled_at = now()
    FROM s163r_copy c
   WHERE c.entity = 'product' AND c.new_id = s.product_id AND s.notified_at IS NULL AND s.cancelled_at IS NULL
     AND EXISTS (SELECT 1 FROM public.store_stock_subscriptions o
                  WHERE o.store_id = s.store_id AND o.product_id = c.old_id AND o.email = s.email
                    AND o.notified_at IS NULL AND o.cancelled_at IS NULL AND o.id <> s.id);
  UPDATE public.store_stock_subscriptions s SET product_id = c.old_id
    FROM s163r_copy c WHERE c.entity = 'product' AND c.new_id = s.product_id;
  UPDATE public.store_stock_subscriptions s SET variant_id = c.old_id
    FROM s163r_copy c WHERE c.entity = 'variant' AND c.new_id = s.variant_id;

  -- 3c. Campaign products, discount rule ids.
  UPDATE public.store_email_campaigns ec
     SET product_ids = (SELECT array_agg(coalesce(c.old_id, e.id) ORDER BY e.ord)
                          FROM unnest(ec.product_ids) WITH ORDINALITY AS e(id, ord)
                          LEFT JOIN s163r_copy c ON c.entity = 'product' AND c.new_id = e.id)
   WHERE ec.product_ids && (SELECT array_agg(new_id) FROM s163r_copy WHERE entity = 'product');
  UPDATE public.store_discount_rules r
     SET category_ids = coalesce((SELECT array_agg(coalesce(c.old_id, e.id) ORDER BY e.ord)
                                    FROM unnest(r.category_ids) WITH ORDINALITY AS e(id, ord)
                                    LEFT JOIN s163r_copy c ON c.entity = 'seller_category' AND c.new_id = e.id), '{}'::uuid[]),
         gift_product_ids = coalesce((SELECT array_agg(coalesce(c.old_id, e.id) ORDER BY e.ord)
                                        FROM unnest(r.gift_product_ids) WITH ORDINALITY AS e(id, ord)
                                        LEFT JOIN s163r_copy c ON c.entity = 'product' AND c.new_id = e.id), '{}'::uuid[])
   WHERE r.category_ids && (SELECT coalesce(array_agg(new_id), '{}') FROM s163r_copy WHERE entity = 'seller_category')
      OR r.gift_product_ids && (SELECT coalesce(array_agg(new_id), '{}') FROM s163r_copy WHERE entity = 'product');

  -- 3d. Coupon lists lose the copy ids.
  UPDATE public.coupons co
     SET applicable_to = pg_temp.s163r_drop_copy_ids(co.applicable_to),
         exclude_items = pg_temp.s163r_drop_copy_ids(co.exclude_items)
   WHERE pg_temp.s163r_drop_copy_ids(co.applicable_to) IS DISTINCT FROM co.applicable_to
      OR pg_temp.s163r_drop_copy_ids(co.exclude_items) IS DISTINCT FROM co.exclude_items;

  -- 3e. Products that stay (originals and products made after the split) use
  -- the original category and brand rows again.
  UPDATE public.products p SET seller_category_id = c.old_id
    FROM s163r_copy c
   WHERE c.entity = 'seller_category' AND c.new_id = p.seller_category_id
     AND p.id NOT IN (SELECT new_id FROM s163r_copy WHERE entity = 'product');
  UPDATE public.products p SET seller_brand_id = c.old_id
    FROM s163r_copy c
   WHERE c.entity = 'seller_brand' AND c.new_id = p.seller_brand_id
     AND p.id NOT IN (SELECT new_id FROM s163r_copy WHERE entity = 'product');

  -- 3f. Cross-sells: copies go, originals get their ids (and NULL store) back.
  DELETE FROM public.product_cross_sells x
   USING s163r_copy c WHERE c.entity = 'cross_sell' AND c.new_id = x.id;
  UPDATE public.product_cross_sells x SET product_id = c.old_id
    FROM s163r_copy c WHERE c.entity = 'product' AND c.new_id = x.product_id;
  UPDATE public.product_cross_sells x SET offer_product_id = c.old_id
    FROM s163r_copy c WHERE c.entity = 'product' AND c.new_id = x.offer_product_id;
  UPDATE public.product_cross_sells x SET offer_variant_id = c.old_id
    FROM s163r_copy c WHERE c.entity = 'variant' AND c.new_id = x.offer_variant_id;
  UPDATE public.product_cross_sells x SET store_id = NULL
    FROM public.product_store_split m
   WHERE m.entity = 'cross_sell' AND m.kind = 'kept' AND m.prev_status = 'every_store' AND m.old_id = x.id;

  -- 3g. Positions of products made after the split, in a copied category, go
  -- to the original category (0163's own position copies are deleted with
  -- the copies).
  INSERT INTO public.seller_category_product_positions (seller_category_id, product_id, seller_id, position, updated_at)
  SELECT c.old_id, pos.product_id, pos.seller_id, pos.position, pos.updated_at
    FROM public.seller_category_product_positions pos
    JOIN s163r_copy c ON c.entity = 'seller_category' AND c.new_id = pos.seller_category_id
   WHERE pos.product_id NOT IN (SELECT new_id FROM s163r_copy WHERE entity = 'product')
  ON CONFLICT (seller_category_id, product_id) DO NOTHING;

  -- 3h. Builder JSON, per store, copy ids → original ids.
  CREATE TEMP TABLE s163r_pairs ON COMMIT DROP AS
    SELECT store_id, jsonb_object_agg(new_id::text, old_id::text) AS pairs
    FROM s163r_copy GROUP BY store_id;
  UPDATE public.store_pages sp
     SET draft_content = x.doc, draft_version = sp.draft_version + 1
    FROM (SELECT sp2.id, pg_temp.s163r_replace_ids(sp2.draft_content, p.pairs) AS doc
            FROM public.store_pages sp2 JOIN s163r_pairs p ON p.store_id = sp2.store_id) x
   WHERE x.id = sp.id AND x.doc IS DISTINCT FROM sp.draft_content;
  UPDATE public.saved_blocks b
     SET content = x.doc
    FROM (SELECT b2.id, pg_temp.s163r_replace_ids(b2.content, p.pairs) AS doc
            FROM public.saved_blocks b2 JOIN s163r_pairs p ON p.store_id = b2.store_id) x
   WHERE x.id = b.id AND x.doc IS DISTINCT FROM b.content;
  UPDATE public.template_installs ti
     SET previous_draft = x.doc
    FROM (SELECT t2.id, pg_temp.s163r_replace_ids(t2.previous_draft, p.pairs) AS doc
            FROM public.template_installs t2 JOIN s163r_pairs p ON p.store_id = t2.store_id
           WHERE t2.previous_draft IS NOT NULL) x
   WHERE x.id = ti.id AND x.doc IS DISTINCT FROM ti.previous_draft;
  UPDATE public.stores st
     SET shared_header = x.h, shared_footer = x.f, settings = x.s, chrome_version = st.chrome_version + 1
    FROM (SELECT st2.id,
                 pg_temp.s163r_replace_ids(st2.shared_header, p.pairs) AS h,
                 pg_temp.s163r_replace_ids(st2.shared_footer, p.pairs) AS f,
                 pg_temp.s163r_replace_ids(st2.settings, p.pairs) AS s
            FROM public.stores st2 JOIN s163r_pairs p ON p.store_id = st2.id) x
   WHERE x.id = st.id
     AND (x.h IS DISTINCT FROM st.shared_header OR x.f IS DISTINCT FROM st.shared_footer OR x.s IS DISTINCT FROM st.settings);
  FOR v_s IN
    SELECT st.id AS store_id, rev.schema_version, rev.template_key, rev.snapshot, p.pairs
    FROM public.stores st
    JOIN s163r_pairs p ON p.store_id = st.id
    JOIN public.store_site_revisions rev ON rev.id = st.published_revision_id
  LOOP
    v_snap := pg_temp.s163r_replace_ids(v_s.snapshot, v_s.pairs);
    IF v_snap IS DISTINCT FROM v_s.snapshot THEN
      INSERT INTO public.store_site_revisions (store_id, revision_number, schema_version, template_key, snapshot, published_by)
      VALUES (v_s.store_id,
              (SELECT coalesce(max(revision_number), 0) + 1 FROM public.store_site_revisions WHERE store_id = v_s.store_id),
              v_s.schema_version, v_s.template_key, v_snap, NULL)
      RETURNING id INTO v_rev;
      UPDATE public.stores SET published_revision_id = v_rev WHERE id = v_s.store_id;
    END IF;
  END LOOP;

  -- 4. Orphans get their old status back while the seller has not changed it.
  UPDATE public.categories cat
     SET product_count = cat.product_count + x.n
    FROM (SELECT p.category_id, count(*) AS n
            FROM public.product_store_split m JOIN public.products p ON p.id = m.old_id
           WHERE m.entity = 'product' AND m.kind = 'orphan' AND m.prev_status = 'active' AND p.status = 'draft'
             AND p.deleted_at IS NULL AND p.purged_at IS NULL
           GROUP BY p.category_id) x
   WHERE cat.id = x.category_id;
  UPDATE public.products p
     SET status = m.prev_status::public.product_status
    FROM public.product_store_split m
   WHERE m.entity = 'product' AND m.kind = 'orphan' AND m.old_id = p.id
     AND m.prev_status IS NOT NULL AND m.prev_status <> 'draft' AND p.status = 'draft'
     AND p.deleted_at IS NULL AND p.purged_at IS NULL;

  -- 5. Tallaby category counters lose the active copies.
  UPDATE public.categories cat
     SET product_count = GREATEST(0, cat.product_count - x.n)
    FROM (SELECT p.category_id, count(*) AS n
            FROM s163r_copy c JOIN public.products p ON p.id = c.new_id
           WHERE c.entity = 'product' AND p.status = 'active' AND p.deleted_at IS NULL AND p.purged_at IS NULL
           GROUP BY p.category_id) x
   WHERE cat.id = x.category_id;

  -- Nothing that stays may still use a copied category or brand.
  SELECT count(*) INTO v_n FROM public.products p
   WHERE p.id NOT IN (SELECT new_id FROM s163r_copy WHERE entity = 'product')
     AND (p.seller_category_id IN (SELECT new_id FROM s163r_copy WHERE entity = 'seller_category')
          OR p.seller_brand_id IN (SELECT new_id FROM s163r_copy WHERE entity = 'seller_brand'));
  IF v_n > 0 THEN RAISE EXCEPTION 'rollback: % product(s) still use a copied category or brand', v_n; END IF;

  -- 6. Delete the copies (children go by CASCADE), then the copied taxonomy.
  DELETE FROM public.products p USING s163r_copy c WHERE c.entity = 'product' AND c.new_id = p.id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'rollback: % copied product(s) deleted', v_n;
  DELETE FROM public.seller_product_categories t USING s163r_copy c WHERE c.entity = 'seller_category' AND c.new_id = t.id;
  DELETE FROM public.seller_product_brands t USING s163r_copy c WHERE c.entity = 'seller_brand' AND c.new_id = t.id;
  -- Copied reviews/questions/quantity offers went with their product; be sure.
  DELETE FROM public.reviews t USING s163r_copy c WHERE c.entity = 'review' AND c.new_id = t.id;
  DELETE FROM public.product_questions t USING s163r_copy c WHERE c.entity = 'question' AND c.new_id = t.id;
  DELETE FROM public.product_quantity_offers t USING s163r_copy c WHERE c.entity = 'quantity_offer' AND c.new_id = t.id;

  SELECT count(*) INTO v_n FROM public.products p
   WHERE p.id IN (SELECT new_id FROM s163r_copy WHERE entity = 'product');
  IF v_n > 0 THEN RAISE EXCEPTION 'rollback: % copy(ies) still present', v_n; END IF;

  -- 8. The map goes last.
  DELETE FROM public.product_store_split;
END $$;

-- ── 7. Unique keys back to per seller (idempotent) ──────────────────────
DROP INDEX IF EXISTS public.unique_product_store_sku_idx;
CREATE UNIQUE INDEX IF NOT EXISTS unique_product_seller_sku_idx ON public.products (seller_id, sku);

DROP INDEX IF EXISTS public.seller_product_categories_store_name_key;
DROP INDEX IF EXISTS public.seller_product_categories_store_source_key;
DROP INDEX IF EXISTS public.seller_product_brands_store_name_key;
DROP INDEX IF EXISTS public.seller_product_brands_store_source_key;
DROP INDEX IF EXISTS public.seller_product_categories_store_idx;
DROP INDEX IF EXISTS public.seller_product_brands_store_idx;
CREATE UNIQUE INDEX IF NOT EXISTS seller_product_categories_name_key
  ON public.seller_product_categories (seller_id, lower(btrim(name)));
CREATE UNIQUE INDEX IF NOT EXISTS seller_product_categories_source_key
  ON public.seller_product_categories (seller_id, source_category_id) WHERE source_category_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS seller_product_brands_name_key
  ON public.seller_product_brands (seller_id, lower(btrim(name)));
CREATE UNIQUE INDEX IF NOT EXISTS seller_product_brands_source_key
  ON public.seller_product_brands (seller_id, source_brand_id) WHERE source_brand_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.platform_switches WHERE key = 'stores_catalog_split' AND enabled) THEN
    RAISE EXCEPTION 'rollback: the switch is still on';
  END IF;
  IF EXISTS (SELECT 1 FROM public.product_store_split) THEN
    RAISE EXCEPTION 'rollback: product_store_split is not empty';
  END IF;
  RAISE NOTICE 'rollback: done. stores_catalog_split is off; purge the storefront cache tags (verify script result set 4, saved before the rollback) or wait an hour.';
END $$;

COMMIT;
