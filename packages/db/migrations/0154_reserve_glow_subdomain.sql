-- Reserve the subdomain `glow` in the database too.
--
-- tallaby.com's home page shows `glow.tallaby.com` as its demo store, so no
-- seller may claim it. The app already rejects it (commit 9f967de5,
-- RESERVED_SUBDOMAINS in packages/lib/src/storefront/index.ts); this adds it
-- to is_reserved_subdomain(), which the sellers_subdomain_format (0044) and
-- stores_subdomain_format (0050) CHECK constraints and
-- generate_seller_subdomain() (0050) call.
--
-- The list below is 0044's list (the only definition; staging's live
-- pg_get_functiondef matched it on 2026-11-06) plus 'glow', nothing removed.
-- Matching stays exact on purpose, like 0044: both CHECKs require
-- ^[a-z0-9-]+$, so an upper-case value never reaches the list, and
-- generate_seller_subdomain() lower-cases its input first.
--
-- Existing rows: Postgres never re-checks existing rows when a function used
-- by a CHECK changes, so replacing the function cannot fail here. But a row
-- that already used 'glow' would fail its CHECK on its next UPDATE (any
-- column), so the guard below aborts the whole migration, before anything
-- changes, if any seller, store or old-link redirect uses it. None did on
-- staging or production (read-only check, 2026-11-06).
--
-- Idempotent: safe to run again. Server-side only; no app code depends on it.

DO $$
DECLARE
  hits text;
BEGIN
  SELECT string_agg(src, ', ') INTO hits FROM (
    SELECT 'sellers ' || id::text AS src FROM sellers WHERE lower(subdomain) = 'glow'
    UNION ALL
    SELECT 'stores ' || id::text FROM stores WHERE lower(subdomain) = 'glow'
    UNION ALL
    SELECT 'seller_subdomain_redirects (seller ' || seller_id::text || ')'
      FROM seller_subdomain_redirects WHERE lower(subdomain) = 'glow'
  ) t;
  IF hits IS NOT NULL THEN
    RAISE EXCEPTION '0154: subdomain glow is already used by %; move it first', hits;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION is_reserved_subdomain(sub text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT sub = ANY (ARRAY[
    'www', 'api', 'app', 'admin', 'dashboard', 'seller', 'sellers', 'shipping',
    'driver', 'drivers', 'store', 'stores', 'shop', 'shops', 'mail', 'email',
    'smtp', 'imap', 'pop', 'ftp', 'cdn', 'static', 'assets', 'media', 'img',
    'images', 'files', 'blog', 'help', 'support', 'docs', 'status', 'auth',
    'login', 'account', 'accounts', 'checkout', 'cart', 'pay', 'payment',
    'payments', 'billing', 'affiliate', 'affiliates', 'dev', 'staging', 'test',
    'preview', 'beta', 'demo', 'ns1', 'ns2', 'tallaby',
    'glow'
  ]);
$$;
