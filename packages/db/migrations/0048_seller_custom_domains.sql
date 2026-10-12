-- Seller custom domains: a seller can serve their storefront from a domain
-- they own (faster-eg.com) instead of {subdomain}.tallaby.com.
--
--   seller_custom_domains   one domain per seller. Stored as the apex, without
--                           `www.` (www is attached in Vercel as a redirect to
--                           the apex). `pending` until Vercel reports it
--                           verified with correct DNS, then `active`; the
--                           re-check cron moves it to `failed` if DNS breaks.
--   auth_handoff_codes      single-use codes that carry a session from
--                           tallaby.com (where OAuth and email links land) to a
--                           custom domain, whose cookies tallaby.com can't set.
--                           Rows live ~60 seconds and are deleted when used.
--
-- The domain format rules mirror packages/lib/src/storefront/index.ts — keep
-- both in sync.
--
-- Idempotent, like 0044. Server-side (Drizzle) access only.

CREATE TABLE IF NOT EXISTS seller_custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  domain text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  verification jsonb,
  last_error text,
  verified_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS seller_custom_domains_seller_id_key
  ON seller_custom_domains (seller_id);
CREATE UNIQUE INDEX IF NOT EXISTS seller_custom_domains_domain_key
  ON seller_custom_domains (domain);
CREATE INDEX IF NOT EXISTS seller_custom_domains_status_idx
  ON seller_custom_domains (status);

DO $$ BEGIN
  ALTER TABLE seller_custom_domains ADD CONSTRAINT seller_custom_domains_status_check
    CHECK (status IN ('pending', 'active', 'failed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE seller_custom_domains ADD CONSTRAINT seller_custom_domains_domain_format CHECK (
    length(domain) <= 253
    AND domain ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+([a-z]{2,63}|xn--[a-z0-9-]{1,59})$'
    AND domain NOT LIKE 'www.%'
    AND domain <> 'tallaby.com'
    AND domain NOT LIKE '%.tallaby.com'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE seller_custom_domains ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS auth_handoff_codes (
  code_hash text PRIMARY KEY,
  target_origin text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_handoff_codes_expires_at_idx
  ON auth_handoff_codes (expires_at);

ALTER TABLE auth_handoff_codes ENABLE ROW LEVEL SECURITY;
