-- Fully separate stores: read-only check after 0163_store_catalog_split.sql
-- (ROADMAP.md F-87m; docs/plans/stores-separation.md §3.2 step 9, §3.4).
-- Run it on staging and production right after 0163, and again any time:
--
--   psql "$DATABASE_URL" -X -f packages/db/scripts/stores-split-verify.sql
--
-- It changes nothing (READ ONLY transaction, rolled back). Result sets:
--   1. checks: one row per invariant, `failures` must be 0 where must_be_zero.
--      Rows marked `right_after_apply` compare the copies with their source or
--      with the pre-split catalog rule; once sellers edit their stores those
--      numbers drift on purpose (a copy is its own product).
--   2. per seller, 3. per store,
--   4. the storefront cache tags to purge after apply (and after a rollback),
--      as the JSON body of the apps' POST /api/revalidate:
--        curl -X POST "$ECOMMERCE_URL/api/revalidate" -H "x-revalidate-secret: $REVALIDATE_SECRET" \
--             -H 'content-type: application/json' --data @tags.json
--      (and the same to DASHBOARD_URL). Without it the caches expire within an hour.
-- (The Supabase SQL editor shows only the last result set; run each SELECT on its own there.)

BEGIN READ ONLY;
SET LOCAL statement_timeout = '120s';

-- ── 1. Checks ────────────────────────────────────────────────────────────
WITH sw AS (
  SELECT coalesce((SELECT enabled FROM public.platform_switches WHERE key = 'stores_catalog_split'), false) AS split_on
), split_at AS (
  SELECT min(created_at) AS at FROM public.product_store_split WHERE kind IN ('kept', 'orphan')
), cp AS (
  SELECT m.old_id, m.store_id, m.new_id FROM public.product_store_split m WHERE m.entity = 'product' AND m.kind = 'copy'
), pm AS (  -- this old product id, in store X
  SELECT m.old_id, m.store_id, m.new_id FROM public.product_store_split m WHERE m.entity = 'product'
), s AS (
  SELECT st.id, st.seller_id, st.catalog_mode FROM public.stores st WHERE st.deleted_at IS NULL
), orig AS (  -- the original rows (kept or orphan), as they are now
  SELECT p.* FROM public.products p
  JOIN public.product_store_split m ON m.entity = 'product' AND m.kind IN ('kept', 'orphan') AND m.new_id = p.id
), member AS (  -- the pre-split catalog rule, on the original rows
  SELECT s.id AS store_id, o.id AS product_id FROM s JOIN orig o ON o.seller_id = s.seller_id
   WHERE s.catalog_mode = 'all' AND o.deleted_at IS NULL AND o.purged_at IS NULL
  UNION
  SELECT s.id, o.id FROM s JOIN public.store_products sp ON sp.store_id = s.id
    JOIN orig o ON o.id = sp.product_id AND o.seller_id = s.seller_id
   WHERE s.catalog_mode = 'selected' AND o.deleted_at IS NULL AND o.purged_at IS NULL
), before_visible AS (
  SELECT m.store_id, m.product_id FROM member m JOIN orig o ON o.id = m.product_id
   WHERE o.status = 'active'
), after_visible AS (
  SELECT p.store_id, m.old_id AS product_id
    FROM public.products p JOIN pm m ON m.new_id = p.id AND m.store_id = p.store_id
   WHERE p.status = 'active' AND p.deleted_at IS NULL AND p.purged_at IS NULL
), pairs AS (
  SELECT store_id, old_id::text AS old_id FROM public.product_store_split WHERE kind = 'copy'
), checks AS (
  SELECT 1 AS n, 'stores_catalog_split is on' AS check_name,
         CASE WHEN (SELECT split_on FROM sw) THEN 0 ELSE 1 END::bigint AS failures, true AS must_be_zero, false AS right_after_apply
  UNION ALL
  SELECT 2, 'products without a live store of their seller',
         (SELECT count(*) FROM public.products p LEFT JOIN public.stores st ON st.id = p.store_id
           WHERE p.store_id IS NULL OR st.seller_id IS DISTINCT FROM p.seller_id OR st.deleted_at IS NOT NULL), true, false
  UNION ALL
  SELECT 3, 'split map rows whose product is missing or in another store',
         (SELECT count(*) FROM pm LEFT JOIN public.products p ON p.id = pm.new_id
           WHERE p.id IS NULL OR p.store_id <> pm.store_id), true, false
  UNION ALL
  SELECT 4, '(store, product) visible now vs the pre-split rule (both directions)',
         (SELECT count(*) FROM ((SELECT * FROM after_visible EXCEPT SELECT * FROM before_visible)
                                UNION ALL (SELECT * FROM before_visible EXCEPT SELECT * FROM after_visible)) d), true, true
  UNION ALL
  SELECT 5, 'copies whose status, stock, variants, translations or offers differ from the source',
         (SELECT count(*) FROM cp
            JOIN public.products src ON src.id = cp.old_id JOIN public.products c ON c.id = cp.new_id
           WHERE c.quantity IS DISTINCT FROM src.quantity OR c.status IS DISTINCT FROM src.status
              OR (SELECT count(*) FROM public.product_variants v WHERE v.product_id = c.id)
                 <> (SELECT count(*) FROM public.product_variants v WHERE v.product_id = src.id)
              OR (SELECT coalesce(sum(v.stock), 0) FROM public.product_variants v WHERE v.product_id = c.id)
                 <> (SELECT coalesce(sum(v.stock), 0) FROM public.product_variants v WHERE v.product_id = src.id)
              OR (SELECT count(*) FROM public.product_translations t WHERE t.product_id = c.id)
                 <> (SELECT count(*) FROM public.product_translations t WHERE t.product_id = src.id)
              OR (SELECT count(*) FROM public.product_quantity_offers q WHERE q.product_id = c.id)
                 <> (SELECT count(*) FROM public.product_quantity_offers q WHERE q.product_id = src.id)), true, true
  UNION ALL
  SELECT 6, 'copies with fewer approved reviews or questions than the source',
         (SELECT count(*) FROM cp
           WHERE (SELECT count(*) FROM public.reviews r WHERE r.product_id = cp.new_id AND r.status = 'approved')
                 < (SELECT count(*) FROM public.reviews r WHERE r.product_id = cp.old_id AND r.status = 'approved')
              OR (SELECT count(*) FROM public.product_questions q WHERE q.product_id = cp.new_id AND q.status = 'approved')
                 < (SELECT count(*) FROM public.product_questions q WHERE q.product_id = cp.old_id AND q.status = 'approved')), true, true
  UNION ALL
  SELECT 7, 'products using a category or brand of another store',
         (SELECT count(*) FROM public.products p
            LEFT JOIN public.seller_product_categories c ON c.id = p.seller_category_id
            LEFT JOIN public.seller_product_brands b ON b.id = p.seller_brand_id
           WHERE (p.seller_category_id IS NOT NULL AND c.store_id IS DISTINCT FROM p.store_id)
              OR (p.seller_brand_id IS NOT NULL AND b.store_id IS DISTINCT FROM p.store_id)), true, false
  UNION ALL
  SELECT 8, 'categories/brands without a store of their seller',
         (SELECT count(*) FROM public.seller_product_categories c LEFT JOIN public.stores st ON st.id = c.store_id
           WHERE st.seller_id IS DISTINCT FROM c.seller_id)
         + (SELECT count(*) FROM public.seller_product_brands b LEFT JOIN public.stores st ON st.id = b.store_id
           WHERE st.seller_id IS DISTINCT FROM b.seller_id), true, false
  UNION ALL
  SELECT 9, 'open store cart lines on another store''s row while their store has its own',
         (SELECT count(*) FROM public.cart_items ci JOIN public.carts c ON c.id = ci.cart_id
            JOIN public.products p ON p.id = ci.product_id
           WHERE c.status = 'active' AND c.store_id IS NOT NULL AND p.store_id <> c.store_id
             AND EXISTS (SELECT 1 FROM pm WHERE pm.old_id = ci.product_id AND pm.store_id = c.store_id)), true, false
  UNION ALL
  SELECT 10, 'open store cart lines on another store''s product (stale, checkout refuses them)',
         (SELECT count(*) FROM public.cart_items ci JOIN public.carts c ON c.id = ci.cart_id
            JOIN public.products p ON p.id = ci.product_id
           WHERE c.status = 'active' AND c.store_id IS NOT NULL AND p.store_id <> c.store_id), false, false
  UNION ALL
  SELECT 11, 'store cross-sells pairing products of another store',
         (SELECT count(*) FROM public.product_cross_sells x
            JOIN public.products a ON a.id = x.product_id JOIN public.products o ON o.id = x.offer_product_id
           WHERE x.store_id IS NOT NULL AND (a.store_id <> x.store_id OR o.store_id <> x.store_id)), false, false
  UNION ALL
  SELECT 12, 'cross-sells still "every store" (their products never met in one store)',
         (SELECT count(*) FROM public.product_cross_sells x WHERE x.store_id IS NULL), false, false
  UNION ALL
  SELECT 13, 'discount rules naming an id that was copied into their store',
         (SELECT count(*) FROM public.store_discount_rules r
           WHERE EXISTS (SELECT 1 FROM unnest(r.category_ids || r.gift_product_ids) e(id)
                           JOIN public.product_store_split m ON m.kind = 'copy' AND m.old_id = e.id AND m.store_id = r.store_id)), true, false
  UNION ALL
  SELECT 14, 'stores whose live site, drafts, saved blocks or header/footer name a copied id',
         (SELECT count(DISTINCT pr.store_id) FROM pairs pr
            JOIN public.stores st ON st.id = pr.store_id
            LEFT JOIN public.store_site_revisions rev ON rev.id = st.published_revision_id
           WHERE position(pr.old_id IN coalesce(rev.snapshot::text, '')) > 0
              OR position(pr.old_id IN coalesce(st.shared_header::text, '') || coalesce(st.shared_footer::text, '')) > 0
              OR EXISTS (SELECT 1 FROM public.store_pages sp WHERE sp.store_id = pr.store_id AND position(pr.old_id IN sp.draft_content::text) > 0)
              OR EXISTS (SELECT 1 FROM public.saved_blocks b WHERE b.store_id = pr.store_id AND position(pr.old_id IN b.content::text) > 0)), true, false
  UNION ALL
  SELECT 15, 'campaigns or open back-in-stock alerts on an id copied into their store',
         (SELECT count(*) FROM public.store_email_campaigns ec
           WHERE ec.status IN ('draft', 'scheduled', 'sending')
             AND EXISTS (SELECT 1 FROM unnest(ec.product_ids) e(id) JOIN cp ON cp.old_id = e.id AND cp.store_id = ec.store_id))
         + (SELECT count(*) FROM public.store_stock_subscriptions x JOIN cp ON cp.old_id = x.product_id AND cp.store_id = x.store_id
             WHERE x.notified_at IS NULL AND x.cancelled_at IS NULL), true, false
  UNION ALL
  SELECT 16, 'indexes: per-store SKU and taxonomy keys present, per-seller ones gone',
         (CASE WHEN to_regclass('public.unique_product_store_sku_idx') IS NULL THEN 1 ELSE 0 END
          + CASE WHEN to_regclass('public.unique_product_seller_sku_idx') IS NOT NULL THEN 1 ELSE 0 END
          + CASE WHEN to_regclass('public.seller_product_categories_store_name_key') IS NULL THEN 1 ELSE 0 END
          + CASE WHEN to_regclass('public.seller_product_brands_store_name_key') IS NULL THEN 1 ELSE 0 END
          + CASE WHEN to_regclass('public.seller_product_categories_name_key') IS NOT NULL THEN 1 ELSE 0 END
          + CASE WHEN to_regclass('public.seller_product_brands_name_key') IS NOT NULL THEN 1 ELSE 0 END)::bigint, true, false
  UNION ALL
  SELECT 17, 'triggers and checks of 0163 missing',
         (SELECT 4 - count(*) FROM pg_trigger t
           WHERE NOT t.tgisinternal AND t.tgname IN ('products_store_same_seller', 'products_taxonomy_same_store',
                 'seller_product_categories_store_in_use', 'seller_product_brands_store_in_use'))
         + (SELECT 3 - count(*) FROM pg_constraint c
             WHERE c.convalidated AND c.conname IN ('products_store_id_not_null', 'seller_product_categories_store_id_not_null',
                   'seller_product_brands_store_id_not_null')), true, false
  UNION ALL
  SELECT 18, 'notification triggers left disabled',
         (SELECT count(*) FROM pg_trigger t
           WHERE t.tgenabled = 'D' AND t.tgname IN ('products_notify_admin_created', 'products_start_fee_trial_insert',
                 'reviews_notify_seller', 'product_questions_notify_seller')), true, false
  UNION ALL
  SELECT 19, 'stock movements written by the split (reason copy)',
         (SELECT count(*) FROM public.stock_movements WHERE reason = 'copy'), false, false
)
SELECT n, check_name, failures, must_be_zero, right_after_apply,
       CASE WHEN must_be_zero AND failures > 0 THEN 'FAIL' WHEN failures > 0 THEN 'info' ELSE 'ok' END AS result,
       (SELECT at FROM split_at) AS split_at
FROM checks ORDER BY n;

-- ── 2. Per seller ────────────────────────────────────────────────────────
SELECT se.id AS seller_id,
       se.business_name,
       (SELECT count(*) FROM public.stores st WHERE st.seller_id = se.id AND st.deleted_at IS NULL) AS stores,
       (SELECT count(*) FROM public.product_store_split m JOIN public.stores st ON st.id = m.store_id
         WHERE st.seller_id = se.id AND m.entity = 'product' AND m.kind = 'kept') AS originals_kept,
       (SELECT count(*) FROM public.product_store_split m JOIN public.stores st ON st.id = m.store_id
         WHERE st.seller_id = se.id AND m.entity = 'product' AND m.kind = 'orphan') AS orphans_to_draft,
       (SELECT count(*) FROM public.product_store_split m JOIN public.stores st ON st.id = m.store_id
         WHERE st.seller_id = se.id AND m.entity = 'product' AND m.kind = 'copy') AS product_copies,
       (SELECT count(*) FROM public.product_store_split m JOIN public.stores st ON st.id = m.store_id
         WHERE st.seller_id = se.id AND m.entity = 'variant' AND m.kind = 'copy') AS variant_copies,
       (SELECT count(*) FROM public.product_store_split m JOIN public.stores st ON st.id = m.store_id
         WHERE st.seller_id = se.id AND m.entity IN ('seller_category', 'seller_brand') AND m.kind = 'copy') AS taxonomy_copies,
       (SELECT count(*) FROM public.product_store_split m JOIN public.stores st ON st.id = m.store_id
         WHERE st.seller_id = se.id AND m.entity = 'cross_sell' AND m.kind = 'copy') AS cross_sell_copies,
       (SELECT count(*) FROM public.product_store_split m JOIN public.stores st ON st.id = m.store_id
         WHERE st.seller_id = se.id AND m.entity = 'review') AS review_copies,
       (SELECT count(*) FROM public.product_store_split m JOIN public.stores st ON st.id = m.store_id
         WHERE st.seller_id = se.id AND m.entity = 'question') AS question_copies,
       (SELECT count(*) FROM public.products p WHERE p.seller_id = se.id AND p.deleted_at IS NULL AND p.purged_at IS NULL) AS live_products_now,
       (SELECT count(*) FROM public.order_items oi
         WHERE oi.product_id IN (SELECT m.new_id FROM public.product_store_split m JOIN public.stores st ON st.id = m.store_id
                                  WHERE st.seller_id = se.id AND m.entity = 'product' AND m.kind = 'copy')) AS order_lines_on_copies
  FROM public.sellers se
 WHERE EXISTS (SELECT 1 FROM public.products p WHERE p.seller_id = se.id)
 ORDER BY product_copies DESC, stores DESC, se.id;

-- ── 3. Per store ─────────────────────────────────────────────────────────
SELECT st.id AS store_id,
       st.seller_id,
       st.name,
       st.subdomain,
       st.is_primary,
       st.catalog_mode,
       st.site_status,
       (SELECT count(*) FROM public.products p WHERE p.store_id = st.id AND p.deleted_at IS NULL AND p.purged_at IS NULL) AS live_products,
       (SELECT count(*) FROM public.products p WHERE p.store_id = st.id AND p.status = 'active' AND p.deleted_at IS NULL AND p.purged_at IS NULL) AS active_products,
       (SELECT count(*) FROM public.product_store_split m WHERE m.store_id = st.id AND m.entity = 'product' AND m.kind = 'kept') AS originals_kept,
       (SELECT count(*) FROM public.product_store_split m WHERE m.store_id = st.id AND m.entity = 'product' AND m.kind = 'copy') AS copies_received,
       (SELECT count(*) FROM public.product_store_split m WHERE m.store_id = st.id AND m.entity = 'product' AND m.kind = 'orphan') AS orphans,
       (SELECT count(*) FROM public.seller_product_categories c WHERE c.store_id = st.id) AS categories,
       (SELECT count(*) FROM public.seller_product_brands b WHERE b.store_id = st.id) AS brands,
       (SELECT count(*) FROM public.cart_items ci JOIN public.carts c ON c.id = ci.cart_id
         WHERE c.store_id = st.id AND c.status = 'active') AS open_cart_lines,
       EXISTS (SELECT 1 FROM public.store_site_revisions rev
                WHERE rev.id = st.published_revision_id AND rev.published_by IS NULL
                  AND rev.created_at = (SELECT min(created_at) FROM public.product_store_split)) AS live_site_rewritten
  FROM public.stores st
 WHERE st.deleted_at IS NULL
   AND EXISTS (SELECT 1 FROM public.stores o WHERE o.seller_id = st.seller_id AND o.deleted_at IS NULL AND o.id <> st.id)
 ORDER BY st.seller_id, st.is_primary DESC, st.created_at;

-- ── 4. Cache tags to purge (POST /api/revalidate body) ───────────────────
-- Every store of a seller with two or more stores, plus the marketplace lists.
WITH st AS (
  SELECT s.id, s.seller_id, s.subdomain FROM public.stores s
   WHERE s.deleted_at IS NULL
     AND s.seller_id IN (SELECT seller_id FROM public.stores WHERE deleted_at IS NULL GROUP BY seller_id HAVING count(*) > 1)
), tags AS (
  SELECT 'store:site:' || seller_id || ':' || id AS tag FROM st
  UNION SELECT 'product:store:' || seller_id || ':' || id FROM st
  UNION SELECT 'store:catalog:' || seller_id || ':' || id FROM st
  UNION SELECT 'store:cross-sells:' || seller_id || ':' || id FROM st
  UNION SELECT 'seller:subdomain:' || subdomain FROM st
  UNION SELECT 'product:seller:' || seller_id FROM st
  UNION SELECT 'review:seller:' || seller_id FROM st
  UNION SELECT 'coupon:seller:' || seller_id FROM st
  UNION SELECT 'seller:storefront:' || seller_id FROM st
  UNION SELECT 'product:listing'
  UNION SELECT 'product:all'
)
SELECT jsonb_build_object(
         'tags', (SELECT jsonb_agg(tag ORDER BY tag) FROM tags),
         'paths', '[]'::jsonb,
         'from', 'admin',
         'ts', (extract(epoch FROM now()) * 1000)::bigint
       ) AS revalidate_body;

ROLLBACK;
