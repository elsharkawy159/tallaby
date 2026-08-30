-- Normalize existing rows to EGP
UPDATE public.carts SET currency = 'EGP' WHERE currency IS DISTINCT FROM 'EGP';
UPDATE public.payments SET currency = 'EGP' WHERE currency IS DISTINCT FROM 'EGP';
UPDATE public.seller_payouts SET currency = 'EGP' WHERE currency IS DISTINCT FROM 'EGP';
UPDATE public.orders SET currency = 'EGP' WHERE currency IS DISTINCT FROM 'EGP';
UPDATE public.order_items SET currency = 'EGP' WHERE currency IS DISTINCT FROM 'EGP';
UPDATE public.users SET default_currency = 'EGP' WHERE default_currency IS DISTINCT FROM 'EGP';
UPDATE public.seller_wallet SET currency = 'EGP' WHERE currency IS DISTINCT FROM 'EGP';
UPDATE public.wallet_transactions SET currency = 'EGP' WHERE currency IS DISTINCT FROM 'EGP';
UPDATE public.digital_products SET currency = 'EGP' WHERE currency IS DISTINCT FROM 'EGP';

-- Fix column defaults
ALTER TABLE public.carts ALTER COLUMN currency SET DEFAULT 'EGP';
ALTER TABLE public.payments ALTER COLUMN currency SET DEFAULT 'EGP';
ALTER TABLE public.seller_payouts ALTER COLUMN currency SET DEFAULT 'EGP';
ALTER TABLE public.orders ALTER COLUMN currency SET DEFAULT 'EGP';
ALTER TABLE public.order_items ALTER COLUMN currency SET DEFAULT 'EGP';
ALTER TABLE public.users ALTER COLUMN default_currency SET DEFAULT 'EGP';
ALTER TABLE public.seller_wallet ALTER COLUMN currency SET DEFAULT 'EGP';
ALTER TABLE public.wallet_transactions ALTER COLUMN currency SET DEFAULT 'EGP';
ALTER TABLE public.digital_products ALTER COLUMN currency SET DEFAULT 'EGP';

-- Enforce EGP-only at database level
ALTER TABLE public.carts DROP CONSTRAINT IF EXISTS carts_currency_egp_only;
ALTER TABLE public.carts ADD CONSTRAINT carts_currency_egp_only CHECK (currency = 'EGP');

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_currency_egp_only;
ALTER TABLE public.payments ADD CONSTRAINT payments_currency_egp_only CHECK (currency = 'EGP');

ALTER TABLE public.seller_payouts DROP CONSTRAINT IF EXISTS seller_payouts_currency_egp_only;
ALTER TABLE public.seller_payouts ADD CONSTRAINT seller_payouts_currency_egp_only CHECK (currency = 'EGP');

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_currency_egp_only;
ALTER TABLE public.orders ADD CONSTRAINT orders_currency_egp_only CHECK (currency = 'EGP');

ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_currency_egp_only;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_currency_egp_only CHECK (currency = 'EGP');

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_default_currency_egp_only;
ALTER TABLE public.users ADD CONSTRAINT users_default_currency_egp_only CHECK (default_currency = 'EGP');

ALTER TABLE public.seller_wallet DROP CONSTRAINT IF EXISTS seller_wallet_currency_egp_only;
ALTER TABLE public.seller_wallet ADD CONSTRAINT seller_wallet_currency_egp_only CHECK (currency = 'EGP');

ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_currency_egp_only;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_currency_egp_only CHECK (currency = 'EGP');

ALTER TABLE public.digital_products DROP CONSTRAINT IF EXISTS digital_products_currency_egp_only;
ALTER TABLE public.digital_products ADD CONSTRAINT digital_products_currency_egp_only CHECK (currency = 'EGP');
