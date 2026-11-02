-- Read-only check that migrations 0134 (user delete cascade), 0135 (duplicate
-- FKs) and 0136 (guest users without auth accounts) are applied.
-- Paste into the Supabase SQL editor. Every row should show ok = true.

SELECT c.conname,
       CASE c.confdeltype WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL'
                          WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' END AS on_delete,
       e.expected,
       CASE c.confdeltype WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL'
                          WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' END = e.expected AS ok
FROM (VALUES
  ('users_referred_by_fkey',                       'SET NULL'),
  ('wallet_transactions_order_id_orders_id_fk',    'SET NULL'),
  ('orders_cart_id_carts_id_fk',                   'SET NULL'),
  ('coupons_seller_id_sellers_id_fk',              'CASCADE'),
  ('affiliates_coupon_id_coupons_id_fk',           'CASCADE'),
  ('order_items_product_id_products_id_fk',        'CASCADE'),
  ('referral_commissions_referred_seller_id_fkey', 'CASCADE'),
  ('shipments_rider_id_users_id_fk',               'SET NULL')
) AS e(conname, expected)
LEFT JOIN pg_constraint c ON c.conname = e.conname
ORDER BY e.conname;

-- 0136 replaces users_id_auth_users_fk with a trigger so temporary guest users
-- can exist without an auth.users account. Auth user deletion still deletes the
-- matching public profile, which cascades to the profile's owned rows.
SELECT EXISTS (
  SELECT 1
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'auth'
    AND c.relname = 'users'
    AND t.tgname = 'delete_public_user_after_auth_delete'
    AND NOT t.tgisinternal
) AS auth_delete_trigger_exists,
NOT EXISTS (
  SELECT 1
  FROM pg_constraint
  WHERE conname = 'users_id_auth_users_fk'
) AS guest_users_allowed_without_auth;

-- 0135: no column may have two foreign keys to the same parent.
-- This should return NO rows. Any row is a duplicate link (see 0135_drop_duplicate_fks.sql).
SELECT conrelid::regclass::text AS child_table,
       confrelid::regclass::text AS parent_table,
       string_agg(conname || ' = ' || confdeltype::text, ', ') AS duplicate_fks
FROM pg_constraint
WHERE contype = 'f' AND connamespace = 'public'::regnamespace
GROUP BY conrelid, confrelid, conkey
HAVING count(*) > 1;
