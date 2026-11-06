-- 0155: Test orders (ROADMAP.md F-76).
--
-- `orders.is_test` (default false): the order was placed on the store of a Free
-- seller who is not activated yet (no approved top-up, never a positive store
-- wallet balance, not Pro; `orderLockState` in packages/lib/src/billing), by the
-- seller's own browser with its private preview pass. The server sets it when the
-- order is created, never from the client. A test order pays no platform fee,
-- moves no stock, sends the buyer nothing and stays out of every total. It stays
-- a test order after the seller is activated.
--
-- Only takes effect once the USD switch is on: before that no order is ever a
-- test order. Every existing row gets false and behaves as before.
--
-- Additive, but the order queries select every column, so apply it on staging,
-- then production, BEFORE deploying the code that selects it. Idempotent.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_test boolean NOT NULL DEFAULT false;

-- Test orders are rare: a small partial index for the dashboard's "test orders only" list.
CREATE INDEX IF NOT EXISTS orders_is_test_idx ON public.orders (store_id, created_at DESC) WHERE is_test;

COMMENT ON COLUMN public.orders.is_test IS
  'Placed on a not-yet-activated store by its seller (F-76): no fee, no stock change, no buyer messages, out of all totals.';
