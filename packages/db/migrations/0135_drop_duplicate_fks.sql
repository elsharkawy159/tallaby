-- 0135: drop duplicate foreign keys found on production (staging never had them).
--
-- Each column below had two foreign keys to the same parent under different names.
-- 0134 set the delete rule on the named *_fk constraint, but the old duplicate kept
-- its own rule, and Postgres applies both:
--   * wallet_transactions_order_id_fkey (CASCADE) still tried to delete store-wallet
--     ledger rows when an order or its user was deleted, so the delete failed with
--     "wallet_transactions is append-only".
--   * orders_cart_id_fkey (CASCADE) deleted an order when its cart was deleted.
--   * reviews_seller_id_fkey and shipments_seller_id_fkey were exact copies.
-- The constraints that stay are the ones in schema.ts (0134's rules).
-- Idempotent and safe where the duplicates do not exist.

ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_order_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_cart_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_seller_id_fkey;
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_seller_id_fkey;
