-- 0126: Back-in-stock alerts (ROADMAP.md F-23a).
--
-- A store-website visitor leaves an email on an out-of-stock product (or one
-- of its variants) with "Notify me when it's back". A daily cron
-- (apps/ecommerce/app/api/cron/stock-alerts) finds subscriptions whose
-- product/variant has stock again, claims them (notified_at set with
-- FOR UPDATE SKIP LOCKED) and sends one store-branded email each in the
-- subscriber's locale; a failed send clears notified_at again.
--
-- * One open subscription per store + product + variant + email
--   (`store_stock_subscriptions_open_key`, partial: not notified, not
--   cancelled); after it is notified the visitor can subscribe again.
-- * `unsubscribe_token`: random, unique; the email's unsubscribe link cancels
--   that visitor's open alerts on the store (cancelled_at).
-- * Email only for now: SMS/WhatsApp alerts wait for F-38/F-14.
-- * variant_id NULL = the product itself (no variants). A deleted variant or
--   product removes its subscriptions (cascade).
--
-- Server-only (RLS on, no policies): the storefront action and the cron write
-- it through Drizzle (store from the request host); the dashboard Inventory
-- page counts waiting subscribers by the session seller. Additive and
-- idempotent; nothing reads it until the code is deployed, but the dashboard
-- Inventory page does once it is, so apply before deploying.

CREATE TABLE IF NOT EXISTS public.store_stock_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  email text NOT NULL,
  locale text NOT NULL DEFAULT 'ar',
  unsubscribe_token text NOT NULL
    DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  cancelled_at timestamptz,
  CONSTRAINT store_stock_subscriptions_locale_check CHECK (locale IN ('ar', 'en')),
  CONSTRAINT store_stock_subscriptions_email_check CHECK (
    char_length(email) BETWEEN 3 AND 254 AND email = lower(email) AND position('@' IN email) > 1
  ),
  CONSTRAINT store_stock_subscriptions_token_check CHECK (char_length(unsubscribe_token) >= 32)
);

CREATE UNIQUE INDEX IF NOT EXISTS store_stock_subscriptions_token_key
  ON public.store_stock_subscriptions (unsubscribe_token);

-- One open alert per store, product, variant (NULL = product) and email.
CREATE UNIQUE INDEX IF NOT EXISTS store_stock_subscriptions_open_key
  ON public.store_stock_subscriptions
    (store_id, product_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid), email)
  WHERE notified_at IS NULL AND cancelled_at IS NULL;

-- The cron scan and the dashboard's waiting counts (open alerts only).
CREATE INDEX IF NOT EXISTS store_stock_subscriptions_open_product_idx
  ON public.store_stock_subscriptions (product_id, variant_id)
  WHERE notified_at IS NULL AND cancelled_at IS NULL;
CREATE INDEX IF NOT EXISTS store_stock_subscriptions_seller_open_idx
  ON public.store_stock_subscriptions (seller_id)
  WHERE notified_at IS NULL AND cancelled_at IS NULL;

ALTER TABLE public.store_stock_subscriptions ENABLE ROW LEVEL SECURITY;
