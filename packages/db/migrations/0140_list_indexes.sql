-- 0140: indexes for seller lists (docs/dashboard-performance-audit.md P5, F-43g).
--
-- Today these lists read every row of the seller or store, then sort:
--   order_items: home recent orders, sales chart, top products, financial, reports.
--   orders: customers, campaigns and reports by store (orders has no created_at index).
--   wallet_transactions: wallet and financial statement lists.
--
-- Additive and idempotent. A plain CREATE INDEX blocks writes to the table while
-- it builds, so on production run each statement by hand with CONCURRENTLY
-- (outside a transaction) instead of running this file as it is.

CREATE INDEX IF NOT EXISTS order_items_seller_created_idx
  ON public.order_items (seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS orders_store_created_idx
  ON public.orders (store_id, created_at DESC) WHERE store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS wallet_transactions_seller_created_idx
  ON public.wallet_transactions (seller_id, created_at DESC);
