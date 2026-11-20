-- Which provider serves each seller custom domain (docs/plans/hetzner-migration.md
-- §7.3 #3, owner 2026-11-20: option A, Cloudflare for SaaS).
--
--   seller_custom_domains.provider       'vercel' (every row so far: the domain
--                                        and its www. are attached to the
--                                        ecommerce Vercel project) or
--                                        'cloudflare' (custom hostnames on the
--                                        tallaby.com zone, fallback origin
--                                        shops.tallaby.com). New rows take the
--                                        provider from CUSTOM_DOMAIN_PROVIDER;
--                                        check, re-check and remove always use
--                                        the row's own provider, so both run side
--                                        by side while sellers move one by one.
--   seller_custom_domains.provider_meta  what the provider gave back on attach,
--                                        or null. Cloudflare:
--                                        {"hostnames": {"faster-eg.com": "<id>",
--                                        "www.faster-eg.com": "<id>"}}. Vercel
--                                        rows keep null. Optional: the code finds
--                                        a hostname by name when it is missing.
--
-- Additive and idempotent: safe to re-run. Existing rows become 'vercel', which
-- is what they are, so nothing changes until the env selects Cloudflare. Apply
-- BEFORE deploying the code that ships with it, since Drizzle selects every
-- seller_custom_domains column. Staging first, then production with owner
-- approval.

ALTER TABLE public.seller_custom_domains
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'vercel';

ALTER TABLE public.seller_custom_domains
  ADD COLUMN IF NOT EXISTS provider_meta jsonb;

DO $$ BEGIN
  ALTER TABLE public.seller_custom_domains ADD CONSTRAINT seller_custom_domains_provider_check
    CHECK (provider IN ('vercel', 'cloudflare'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.seller_custom_domains ADD CONSTRAINT seller_custom_domains_provider_meta_check
    CHECK (provider_meta IS NULL OR jsonb_typeof(provider_meta) = 'object');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
