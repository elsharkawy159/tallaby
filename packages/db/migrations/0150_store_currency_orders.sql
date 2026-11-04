-- 0150: a store's currency on its carts, orders and payments, and foreign phones
-- (ROADMAP.md F-61b, F-61e).
--
-- 0008 limited carts, orders, order_items and payments to EGP. A store can now
-- sell in its own currency (stores.settings.currency), one per store, never
-- converted. The list is STORE_CURRENCY_CODES in packages/lib/src/utils/formatPrice.ts.
-- The default stays EGP, and marketplace carts and orders stay EGP in the code.
-- Tallaby's own money does not follow: seller_wallet and wallet_transactions (EGP
-- or USD, 0136), user_wallets and user_wallet_transactions (EGP) keep their checks.
--
-- Missed orders and the phone blocklist also take a foreign number, stored in
-- international form (+9665XXXXXXXX). Egyptian numbers stay 01XXXXXXXXX.
--
-- Only widens checks, so it is safe before the deploy. NOT VALID, then VALIDATE:
-- writes are not blocked while old rows are checked. Idempotent.

ALTER TABLE public.carts DROP CONSTRAINT IF EXISTS carts_currency_egp_only;
ALTER TABLE public.carts DROP CONSTRAINT IF EXISTS carts_currency_store_list;
ALTER TABLE public.carts ADD CONSTRAINT carts_currency_store_list
  CHECK (currency IN ('EGP', 'SAR', 'AED', 'KWD', 'QAR', 'BHD', 'OMR', 'USD', 'EUR', 'GBP')) NOT VALID;
ALTER TABLE public.carts VALIDATE CONSTRAINT carts_currency_store_list;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_currency_egp_only;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_currency_store_list;
ALTER TABLE public.orders ADD CONSTRAINT orders_currency_store_list
  CHECK (currency IN ('EGP', 'SAR', 'AED', 'KWD', 'QAR', 'BHD', 'OMR', 'USD', 'EUR', 'GBP')) NOT VALID;
ALTER TABLE public.orders VALIDATE CONSTRAINT orders_currency_store_list;

ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_currency_egp_only;
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_currency_store_list;
ALTER TABLE public.order_items ADD CONSTRAINT order_items_currency_store_list
  CHECK (currency IN ('EGP', 'SAR', 'AED', 'KWD', 'QAR', 'BHD', 'OMR', 'USD', 'EUR', 'GBP')) NOT VALID;
ALTER TABLE public.order_items VALIDATE CONSTRAINT order_items_currency_store_list;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_currency_egp_only;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_currency_store_list;
ALTER TABLE public.payments ADD CONSTRAINT payments_currency_store_list
  CHECK (currency IN ('EGP', 'SAR', 'AED', 'KWD', 'QAR', 'BHD', 'OMR', 'USD', 'EUR', 'GBP')) NOT VALID;
ALTER TABLE public.payments VALIDATE CONSTRAINT payments_currency_store_list;

ALTER TABLE public.store_checkout_leads DROP CONSTRAINT IF EXISTS store_checkout_leads_phone_format;
ALTER TABLE public.store_checkout_leads ADD CONSTRAINT store_checkout_leads_phone_format
  CHECK (phone ~ '^(01[0125][0-9]{8}|\+[1-9][0-9]{7,14})$') NOT VALID;
ALTER TABLE public.store_checkout_leads VALIDATE CONSTRAINT store_checkout_leads_phone_format;

ALTER TABLE public.store_blocked_phones DROP CONSTRAINT IF EXISTS store_blocked_phones_phone_check;
ALTER TABLE public.store_blocked_phones ADD CONSTRAINT store_blocked_phones_phone_check
  CHECK (phone ~ '^(01[0-9]{9}|\+[1-9][0-9]{7,14})$') NOT VALID;
ALTER TABLE public.store_blocked_phones VALIDATE CONSTRAINT store_blocked_phones_phone_check;

-- Rollback (only once no row uses another currency or a foreign phone):
--   restore the 0008 checks (currency = 'EGP') and the 0118 and 0120 phone checks.
