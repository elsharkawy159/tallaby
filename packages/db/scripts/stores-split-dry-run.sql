-- Fully separate stores: read-only dry-run report (ROADMAP.md F-87b,
-- docs/plans/stores-separation.md §3.0). Run it on staging and production
-- BEFORE 0163/0164, and show the owner the totals (result set 3).
--
--   psql "$DATABASE_URL" -f packages/db/scripts/stores-split-dry-run.sql
--
-- (The Supabase SQL editor shows only the last result set; run each SELECT on
-- its own there.) It changes nothing: everything runs inside a READ ONLY
-- transaction that is rolled back. It reads only what exists today, so it runs
-- on a database WITHOUT 0160 (no store_id, platform_switches or activated_at).
--
-- Rules it mirrors (keep in step with the plan):
-- - Store membership today: catalog_mode 'all' = every non-trashed,
--   non-purged product of the store's seller (any status); 'selected' = its
--   store_products rows. Only non-deleted stores.
-- - Kept store (0163 step 3): the primary store if it is a member, else the
--   oldest member store. Every other member store receives a copy.
-- - Orphan: a non-trashed product no store shows; the primary keeps it as a draft.
-- - Activated today (getOrderLock / 0159): USD switch off, or active Pro, or a
--   succeeded top-up, a `top_up` ledger entry, a balance above 0 now, or a USD
--   ledger entry with balance_after above 0. `money_activated` is the same
--   rule without the switch and Pro shortcuts.
-- - Activated after the split (owner Q1): switch off, or active Pro, or the
--   store is the primary store of a money-activated seller. Every other store of
--   an activated seller loses activation until its own top-up.
--
-- Result sets: 1 per seller, 2 per store, 3 totals, 4 sellers whose primary-store
-- count is not 1, 5 wallet mirror and ledger mismatches, 6 cart statuses in use,
-- 7 product indexes on this database.

BEGIN READ ONLY;
SET LOCAL statement_timeout = '120s';

-- ── 1. Per seller ────────────────────────────────────────────────────────
WITH bs AS (
  SELECT coalesce((SELECT b.usd_live FROM public.billing_settings b LIMIT 1), false) AS usd_live
), s AS (
  SELECT st.id, st.seller_id, st.is_primary, st.catalog_mode, st.status, st.created_at
  FROM public.stores st WHERE st.deleted_at IS NULL
), lp AS (
  SELECT p.id, p.seller_id, p.status FROM public.products p WHERE p.deleted_at IS NULL AND p.purged_at IS NULL
), member AS (
  SELECT s.id AS store_id, lp.id AS product_id FROM s JOIN lp ON lp.seller_id = s.seller_id WHERE s.catalog_mode = 'all'
  UNION
  SELECT s.id, lp.id FROM s
    JOIN public.store_products sp ON sp.store_id = s.id
    JOIN lp ON lp.id = sp.product_id AND lp.seller_id = s.seller_id
   WHERE s.catalog_mode = 'selected'
), pp AS (
  SELECT lp.id, lp.seller_id, lp.status, count(m.store_id) AS n_stores,
         (SELECT count(*) FROM public.product_variants v WHERE v.product_id = lp.id) AS n_variants,
         (SELECT count(*) FROM public.product_translations t WHERE t.product_id = lp.id) AS n_translations
    FROM lp LEFT JOIN member m ON m.product_id = lp.id
   GROUP BY lp.id, lp.seller_id, lp.status
), per_seller AS (
  SELECT seller_id,
         count(*) AS products,
         count(*) FILTER (WHERE n_stores = 0) AS orphans,
         count(*) FILTER (WHERE n_stores = 0 AND status = 'active') AS orphans_active_to_draft,
         count(*) FILTER (WHERE n_stores = 1) AS single_store,
         count(*) FILTER (WHERE n_stores > 1) AS multi_store,
         coalesce(sum(greatest(n_stores - 1, 0)), 0) AS copies_to_create,
         coalesce(sum(greatest(n_stores - 1, 0) * n_variants), 0) AS variants_to_copy,
         coalesce(sum(greatest(n_stores - 1, 0) * n_translations), 0) AS translations_to_copy
    FROM pp GROUP BY seller_id
), act AS (
  SELECT se.id AS seller_id,
         (se.plan = 'pro' AND coalesce(greatest(se.plan_expires_at, se.plan_grace_until), 'infinity'::timestamptz) > now()) AS pro_active,
         (EXISTS (SELECT 1 FROM public.seller_wallet_top_ups t WHERE t.seller_id = se.id AND t.status = 'succeeded')
          OR EXISTS (SELECT 1 FROM public.wallet_transactions x WHERE x.seller_id = se.id AND x.type = 'top_up')
          OR EXISTS (SELECT 1 FROM public.seller_wallet w WHERE w.seller_id = se.id AND w.balance > 0)
          OR EXISTS (SELECT 1 FROM public.wallet_transactions x WHERE x.seller_id = se.id AND x.currency = 'USD' AND x.balance_after > 0)
         ) AS money_activated
    FROM public.sellers se
)
SELECT se.id AS seller_id,
       se.business_name,
       se.plan,
       (SELECT count(*) FROM s WHERE s.seller_id = se.id) AS stores,
       (SELECT count(*) FROM s WHERE s.seller_id = se.id AND s.is_primary) AS primary_stores,   -- must be 1
       (SELECT count(*) FROM s WHERE s.seller_id = se.id AND s.catalog_mode = 'selected') AS selected_mode_stores,
       coalesce(ps.products, 0) AS products,
       coalesce(ps.orphans, 0) AS orphans,
       coalesce(ps.orphans_active_to_draft, 0) AS orphans_active_to_draft,
       coalesce(ps.single_store, 0) AS single_store,
       coalesce(ps.multi_store, 0) AS multi_store,
       coalesce(ps.copies_to_create, 0) AS copies_to_create,
       coalesce(ps.variants_to_copy, 0) AS variants_to_copy,
       coalesce(ps.translations_to_copy, 0) AS translations_to_copy,
       (SELECT count(*) FROM public.products t WHERE t.seller_id = se.id AND t.deleted_at IS NOT NULL AND t.purged_at IS NULL) AS trashed,
       (SELECT count(*) FROM public.seller_product_categories c WHERE c.seller_id = se.id) AS categories,
       (SELECT count(*) FROM public.seller_product_brands b WHERE b.seller_id = se.id) AS brands,
       (SELECT count(*) FROM public.seller_categories c WHERE c.seller_id = se.id) AS category_picks,
       (SELECT count(*) FROM public.coupons c WHERE c.seller_id = se.id) AS coupons,
       (SELECT count(*) FROM public.product_cross_sells x WHERE x.seller_id = se.id AND x.store_id IS NULL) AS cross_sells_all_stores,
       (SELECT count(*) FROM public.carts c WHERE c.store_seller_id = se.id AND c.status = 'active') AS open_store_carts,
       w.balance AS wallet_balance,
       w.currency AS wallet_currency,
       w.status AS wallet_status,
       se.wallet_balance AS mirror_balance,                                                    -- must equal wallet_balance
       (SELECT count(*) FROM public.seller_wallet_top_ups t WHERE t.seller_id = se.id AND t.status = 'succeeded') AS top_ups,
       a.pro_active,
       a.money_activated,
       (NOT bs.usd_live OR a.pro_active OR a.money_activated) AS activated_today,
       CASE WHEN bs.usd_live AND NOT a.pro_active AND a.money_activated
            THEN (SELECT count(*) FROM s WHERE s.seller_id = se.id AND NOT s.is_primary)
            ELSE 0 END AS stores_losing_activation
  FROM public.sellers se
  JOIN act a ON a.seller_id = se.id
  CROSS JOIN bs
  LEFT JOIN per_seller ps ON ps.seller_id = se.id
  LEFT JOIN public.seller_wallet w ON w.seller_id = se.id
 WHERE ps.products IS NOT NULL OR w.id IS NOT NULL OR EXISTS (SELECT 1 FROM s WHERE s.seller_id = se.id)
 ORDER BY copies_to_create DESC, stores DESC, se.id;

-- ── 2. Per store ─────────────────────────────────────────────────────────
WITH bs AS (
  SELECT coalesce((SELECT b.usd_live FROM public.billing_settings b LIMIT 1), false) AS usd_live
), s AS (
  SELECT st.id, st.seller_id, st.is_primary, st.catalog_mode, st.status, st.created_at, st.name, st.subdomain
  FROM public.stores st WHERE st.deleted_at IS NULL
), lp AS (
  SELECT p.id, p.seller_id, p.status FROM public.products p WHERE p.deleted_at IS NULL AND p.purged_at IS NULL
), member AS (
  SELECT s.id AS store_id, lp.id AS product_id FROM s JOIN lp ON lp.seller_id = s.seller_id WHERE s.catalog_mode = 'all'
  UNION
  SELECT s.id, lp.id FROM s
    JOIN public.store_products sp ON sp.store_id = s.id
    JOIN lp ON lp.id = sp.product_id AND lp.seller_id = s.seller_id
   WHERE s.catalog_mode = 'selected'
), kept AS (
  SELECT DISTINCT ON (m.product_id) m.product_id, m.store_id
    FROM member m JOIN s ON s.id = m.store_id
   ORDER BY m.product_id, s.is_primary DESC, s.created_at, s.id
), orphans AS (
  SELECT lp.seller_id, count(*) AS n
    FROM lp WHERE NOT EXISTS (SELECT 1 FROM member m WHERE m.product_id = lp.id)
   GROUP BY lp.seller_id
), act AS (
  SELECT se.id AS seller_id,
         (se.plan = 'pro' AND coalesce(greatest(se.plan_expires_at, se.plan_grace_until), 'infinity'::timestamptz) > now()) AS pro_active,
         (EXISTS (SELECT 1 FROM public.seller_wallet_top_ups t WHERE t.seller_id = se.id AND t.status = 'succeeded')
          OR EXISTS (SELECT 1 FROM public.wallet_transactions x WHERE x.seller_id = se.id AND x.type = 'top_up')
          OR EXISTS (SELECT 1 FROM public.seller_wallet w WHERE w.seller_id = se.id AND w.balance > 0)
          OR EXISTS (SELECT 1 FROM public.wallet_transactions x WHERE x.seller_id = se.id AND x.currency = 'USD' AND x.balance_after > 0)
         ) AS money_activated
    FROM public.sellers se
), per_store AS (
  SELECT s.id AS store_id,
         count(m.product_id) AS member_products,
         count(m.product_id) FILTER (WHERE lp.status = 'active') AS visible_products,
         count(k.product_id) AS kept_here
    FROM s
    LEFT JOIN member m ON m.store_id = s.id
    LEFT JOIN lp ON lp.id = m.product_id
    LEFT JOIN kept k ON k.product_id = m.product_id AND k.store_id = s.id
   GROUP BY s.id
)
SELECT s.id AS store_id,
       s.seller_id,
       s.name,
       s.subdomain,
       s.is_primary,
       s.status,
       s.catalog_mode,
       ps.member_products,
       ps.visible_products,
       ps.kept_here,
       ps.member_products - ps.kept_here AS copies_received,
       CASE WHEN s.is_primary THEN coalesce(o.n, 0) ELSE 0 END AS orphans_landing_as_draft,
       (NOT bs.usd_live OR a.pro_active OR a.money_activated) AS activated_now,
       (NOT bs.usd_live OR a.pro_active OR (s.is_primary AND a.money_activated)) AS activated_after_split,
       (bs.usd_live AND NOT a.pro_active AND a.money_activated AND NOT s.is_primary) AS loses_activation
  FROM s
  JOIN per_store ps ON ps.store_id = s.id
  JOIN act a ON a.seller_id = s.seller_id
  CROSS JOIN bs
  LEFT JOIN orphans o ON o.seller_id = s.seller_id
 ORDER BY copies_received DESC, s.seller_id, s.is_primary DESC, s.created_at;

-- ── 3. Totals (for the owner) ────────────────────────────────────────────
WITH bs AS (
  SELECT coalesce((SELECT b.usd_live FROM public.billing_settings b LIMIT 1), false) AS usd_live
), s AS (
  SELECT st.id, st.seller_id, st.is_primary, st.catalog_mode FROM public.stores st WHERE st.deleted_at IS NULL
), lp AS (
  SELECT p.id, p.seller_id, p.status FROM public.products p WHERE p.deleted_at IS NULL AND p.purged_at IS NULL
), member AS (
  SELECT s.id AS store_id, lp.id AS product_id FROM s JOIN lp ON lp.seller_id = s.seller_id WHERE s.catalog_mode = 'all'
  UNION
  SELECT s.id, lp.id FROM s
    JOIN public.store_products sp ON sp.store_id = s.id
    JOIN lp ON lp.id = sp.product_id AND lp.seller_id = s.seller_id
   WHERE s.catalog_mode = 'selected'
), pp AS (
  SELECT lp.id, lp.seller_id, lp.status, count(m.store_id) AS n_stores,
         (SELECT count(*) FROM public.product_variants v WHERE v.product_id = lp.id) AS n_variants,
         (SELECT count(*) FROM public.product_translations t WHERE t.product_id = lp.id) AS n_translations
    FROM lp LEFT JOIN member m ON m.product_id = lp.id
   GROUP BY lp.id, lp.seller_id, lp.status
), act AS (
  SELECT se.id AS seller_id,
         (se.plan = 'pro' AND coalesce(greatest(se.plan_expires_at, se.plan_grace_until), 'infinity'::timestamptz) > now()) AS pro_active,
         (EXISTS (SELECT 1 FROM public.seller_wallet_top_ups t WHERE t.seller_id = se.id AND t.status = 'succeeded')
          OR EXISTS (SELECT 1 FROM public.wallet_transactions x WHERE x.seller_id = se.id AND x.type = 'top_up')
          OR EXISTS (SELECT 1 FROM public.seller_wallet w WHERE w.seller_id = se.id AND w.balance > 0)
          OR EXISTS (SELECT 1 FROM public.wallet_transactions x WHERE x.seller_id = se.id AND x.currency = 'USD' AND x.balance_after > 0)
         ) AS money_activated
    FROM public.sellers se
)
SELECT
  (SELECT usd_live FROM bs) AS usd_live,
  (SELECT count(DISTINCT seller_id) FROM pp) AS sellers_with_products,
  (SELECT count(*) FROM s) AS stores,
  (SELECT count(*) FROM s WHERE catalog_mode = 'selected') AS selected_mode_stores,
  (SELECT count(*) FROM (SELECT seller_id FROM s GROUP BY seller_id HAVING count(*) > 1) x) AS sellers_with_several_stores,
  (SELECT count(*) FROM pp) AS products,
  (SELECT count(*) FROM pp WHERE n_stores = 0) AS orphans,
  (SELECT count(*) FROM pp WHERE n_stores = 0 AND status = 'active') AS orphans_active_to_draft,
  (SELECT count(*) FROM pp WHERE n_stores > 1) AS multi_store_products,
  (SELECT coalesce(sum(greatest(n_stores - 1, 0)), 0) FROM pp) AS copies_to_create,
  (SELECT coalesce(sum(greatest(n_stores - 1, 0) * n_variants), 0) FROM pp) AS variants_to_copy,
  (SELECT coalesce(sum(greatest(n_stores - 1, 0) * n_translations), 0) FROM pp) AS translations_to_copy,
  (SELECT count(*) FROM public.products p WHERE p.deleted_at IS NOT NULL AND p.purged_at IS NULL) AS trashed,
  (SELECT count(*) FROM public.products p WHERE p.purged_at IS NOT NULL) AS purged,
  (SELECT count(*) FROM public.product_cross_sells x WHERE x.store_id IS NULL) AS cross_sells_all_stores,
  (SELECT count(*) FROM public.coupons c WHERE c.seller_id IS NOT NULL) AS seller_coupons,
  (SELECT count(*) FROM public.carts c WHERE c.store_id IS NOT NULL AND c.status = 'active') AS open_store_carts,
  (SELECT count(*) FROM public.seller_wallet) AS wallets,
  (SELECT coalesce(sum(balance) FILTER (WHERE balance > 0), 0) FROM public.seller_wallet) AS positive_balance_total,
  (SELECT coalesce(sum(balance) FILTER (WHERE balance < 0), 0) FROM public.seller_wallet) AS negative_balance_total,
  (SELECT count(*) FROM public.seller_wallet WHERE balance < 0) AS negative_wallets,
  (SELECT string_agg(DISTINCT currency, ', ') FROM public.seller_wallet) AS wallet_currencies,
  (SELECT count(*) FROM public.seller_wallet_top_ups) AS top_ups_to_backfill,
  -- 0164 sets activated_at on exactly this many primary stores (plan §3.3).
  (SELECT count(*) FROM act WHERE money_activated) AS activated_sellers,
  (SELECT count(*) FROM act WHERE pro_active) AS pro_active_sellers,
  (SELECT count(*) FROM s JOIN act a ON a.seller_id = s.seller_id
    WHERE (SELECT usd_live FROM bs) AND NOT a.pro_active AND a.money_activated AND NOT s.is_primary) AS stores_losing_activation;

-- ── 4. Sellers whose primary-store count is not 1 ────────────────────────
-- 0163 aborts if any seller with products is listed here.
SELECT se.id AS seller_id,
       se.business_name,
       count(st.id) AS stores,
       count(st.id) FILTER (WHERE st.is_primary) AS primary_stores,
       (SELECT count(*) FROM public.products p WHERE p.seller_id = se.id) AS products
  FROM public.sellers se
  LEFT JOIN public.stores st ON st.seller_id = se.id AND st.deleted_at IS NULL
 GROUP BY se.id, se.business_name
HAVING count(st.id) FILTER (WHERE st.is_primary) <> 1
   AND (count(st.id) > 0 OR EXISTS (SELECT 1 FROM public.products p WHERE p.seller_id = se.id))
 ORDER BY products DESC, se.id;

-- ── 5. Wallet mirror and ledger mismatches ───────────────────────────────
-- 0164 checks mirror = balance and, per wallet, balance = ledger sum in its currency.
SELECT se.id AS seller_id,
       se.business_name,
       w.balance AS wallet_balance,
       w.currency AS wallet_currency,
       se.wallet_balance AS mirror_balance,
       l.ledger_sum,
       (coalesce(se.wallet_balance, 0) <> w.balance) AS mirror_mismatch,
       (coalesce(l.ledger_sum, 0) <> w.balance) AS ledger_mismatch
  FROM public.seller_wallet w
  JOIN public.sellers se ON se.id = w.seller_id
  LEFT JOIN LATERAL (
    SELECT sum(t.amount) AS ledger_sum
      FROM public.wallet_transactions t
     WHERE t.seller_id = w.seller_id AND coalesce(t.currency, 'EGP') = w.currency
  ) l ON true
 WHERE coalesce(se.wallet_balance, 0) <> w.balance OR coalesce(l.ledger_sum, 0) <> w.balance
 ORDER BY abs(w.balance - coalesce(se.wallet_balance, 0)) DESC, se.id;

-- ── 6. Cart statuses in use ──────────────────────────────────────────────
SELECT coalesce(c.status, '(null)') AS status,
       count(*) AS carts,
       count(*) FILTER (WHERE c.store_id IS NOT NULL) AS store_carts,
       max(c.last_activity) AS last_activity
  FROM public.carts c
 GROUP BY 1
 ORDER BY carts DESC;

-- ── 7. Product indexes on this database ──────────────────────────────────
-- Check that product_slug_idx (0000) is gone and unique_product_seller_sku_idx is present.
SELECT tablename, indexname, indexdef
  FROM pg_indexes
 WHERE schemaname = 'public' AND tablename IN ('products', 'product_translations')
 ORDER BY tablename, indexname;

ROLLBACK;
