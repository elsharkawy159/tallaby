-- Seller storefront subdomains: every seller gets {subdomain}.tallaby.com.
--
--   sellers.subdomain             the live subdomain. Filled automatically on
--                                 insert (from the slug) by a trigger, so every
--                                 code path that creates a seller gets one.
--   seller_subdomain_redirects    subdomains a seller used before. Old links
--                                 shared with customers keep working: the
--                                 storefront redirects them to the current one,
--                                 and nobody else can claim them.
--
-- The format/reserved rules mirror packages/lib/src/storefront/index.ts —
-- keep both in sync.
--
-- Idempotent, like 0009/0017/0025/0037. Server-side (Drizzle) access only.

ALTER TABLE sellers ADD COLUMN IF NOT EXISTS subdomain text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS subdomain_updated_at timestamptz;

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
    'preview', 'beta', 'demo', 'ns1', 'ns2', 'tallaby'
  ]);
$$;

CREATE TABLE IF NOT EXISTS seller_subdomain_redirects (
  subdomain text PRIMARY KEY,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seller_subdomain_redirects_seller_id_idx
  ON seller_subdomain_redirects (seller_id);

ALTER TABLE seller_subdomain_redirects ENABLE ROW LEVEL SECURITY;

-- A free, valid subdomain derived from `source` (normally the slug). Falls
-- back to store-<id prefix> when the source has too few latin characters
-- (e.g. an Arabic-only store name) or is reserved, then appends -2, -3, …
-- until it is not taken by another seller or another seller's old link.
CREATE OR REPLACE FUNCTION generate_seller_subdomain(source text, for_seller uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base text;
  candidate text;
  n integer := 1;
BEGIN
  base := lower(coalesce(source, ''));
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := trim(BOTH '-' FROM left(trim(BOTH '-' FROM base), 28));

  IF length(base) < 3 OR is_reserved_subdomain(base) THEN
    base := 'store-' || left(replace(for_seller::text, '-', ''), 8);
  END IF;

  candidate := base;
  WHILE EXISTS (SELECT 1 FROM sellers WHERE subdomain = candidate AND id <> for_seller)
     OR EXISTS (SELECT 1 FROM seller_subdomain_redirects WHERE subdomain = candidate AND seller_id <> for_seller)
  LOOP
    n := n + 1;
    candidate := base || '-' || n;
  END LOOP;

  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION sellers_assign_subdomain()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.subdomain IS NULL OR NEW.subdomain = '' THEN
    NEW.subdomain := generate_seller_subdomain(NEW.slug, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sellers_assign_subdomain ON sellers;
CREATE TRIGGER sellers_assign_subdomain
  BEFORE INSERT ON sellers
  FOR EACH ROW EXECUTE FUNCTION sellers_assign_subdomain();

-- Backfill existing sellers one row at a time, so each new subdomain is
-- visible to the collision check of the next one. Oldest sellers win ties.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT id, slug FROM sellers WHERE subdomain IS NULL ORDER BY created_at NULLS LAST, id
  LOOP
    UPDATE sellers SET subdomain = generate_seller_subdomain(r.slug, r.id) WHERE id = r.id;
  END LOOP;
END $$;

-- '' is a placeholder the trigger always replaces; it lets inserts omit the column.
ALTER TABLE sellers ALTER COLUMN subdomain SET DEFAULT '';
ALTER TABLE sellers ALTER COLUMN subdomain SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS sellers_subdomain_key ON sellers (subdomain);

DO $$ BEGIN
  ALTER TABLE sellers ADD CONSTRAINT sellers_subdomain_format CHECK (
    subdomain ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'
    AND position('--' IN subdomain) = 0
    AND NOT is_reserved_subdomain(subdomain)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
