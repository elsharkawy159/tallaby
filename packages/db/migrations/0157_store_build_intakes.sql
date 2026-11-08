-- 0157_store_build_intakes.sql (ROADMAP.md F-82c; design:
-- docs/superpowers/specs/2026-11-08-ai-store-builder-v2-design.md §9)
--
-- AI Store Builder v2 data:
--
--   * store_build_intakes: what a guest typed in the tallaby.com hero composer
--     (prompt, colour, logo, file) kept for 48 h before signup, with no model
--     call (decision D2). Server-only (RLS on, no policies). The browser holds
--     the raw token; only its hash is stored. Claimed by the seller at signup
--     (seller_id, store_id, claimed_at). The cleanup cron reads expires_at.
--   * store-build-intake: a PRIVATE bucket with NO storage policies. The server
--     signs uploads into `guest/<intakeId>/` and moves them under `<sellerId>/`
--     when the intake is claimed. 5 MB, CSV/XLSX/XLS/PNG/JPEG/WebP.
--   * store_builds: intake_id, target_store_id (the store the build is bound to;
--     replaces v1's findPristineStore guess), source (hero | dashboard) and
--     published_at.
--   * ai_usage_logs.ref_id: the builder writes its build id, so a build's spend
--     is summed by id instead of by time.
--   * stores.agent_profile: the store's brand memory for the agent system
--     (F-83, §14.3): brand voice, audience, style words, tagline, photo
--     keywords. Written by the builder, read by every skill.
--
-- Additive, idempotent and guarded (named constraints are added only when
-- missing). Nothing deployed reads these yet; apply on staging, then
-- production BEFORE deploying the v2 builder code that reads them.

BEGIN;

CREATE TABLE IF NOT EXISTS public.store_build_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- sha256 of the token the browser keeps (cookie / signup metadata).
  token_hash text NOT NULL,
  prompt text NOT NULL DEFAULT '',
  primary_color text,
  -- Paths in the private store-build-intake bucket.
  logo_path text,
  file_path text,
  -- Code-read summary of the file: rows, valid, missing prices, headers.
  file_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  locale text NOT NULL DEFAULT 'ar',
  -- A hash, never the address (rate limit: intakes per IP per day).
  ip_hash text,
  seller_id uuid REFERENCES public.sellers(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_build_intakes_token_hash_key') THEN
    ALTER TABLE public.store_build_intakes
      ADD CONSTRAINT store_build_intakes_token_hash_key UNIQUE (token_hash);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_build_intakes_prompt_check') THEN
    ALTER TABLE public.store_build_intakes
      ADD CONSTRAINT store_build_intakes_prompt_check CHECK (char_length(prompt) <= 1000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_build_intakes_primary_color_check') THEN
    ALTER TABLE public.store_build_intakes
      ADD CONSTRAINT store_build_intakes_primary_color_check
        CHECK (primary_color IS NULL OR primary_color ~ '^#[0-9a-fA-F]{6}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_build_intakes_locale_check') THEN
    ALTER TABLE public.store_build_intakes
      ADD CONSTRAINT store_build_intakes_locale_check CHECK (locale IN ('ar', 'en'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS store_build_intakes_expires_idx ON public.store_build_intakes (expires_at);
CREATE INDEX IF NOT EXISTS store_build_intakes_seller_idx ON public.store_build_intakes (seller_id);
CREATE INDEX IF NOT EXISTS store_build_intakes_ip_idx ON public.store_build_intakes (ip_hash, created_at);

ALTER TABLE public.store_build_intakes ENABLE ROW LEVEL SECURITY;

-- Private bucket, no storage policies: only the service role reads or signs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-build-intake', 'store-build-intake', false, 5242880,
  ARRAY[
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- store_builds: the bound store, the intake and where the build started.
ALTER TABLE public.store_builds
  ADD COLUMN IF NOT EXISTS intake_id uuid REFERENCES public.store_build_intakes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'dashboard',
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_builds_source_check') THEN
    ALTER TABLE public.store_builds
      ADD CONSTRAINT store_builds_source_check CHECK (source IN ('hero', 'dashboard'));
  END IF;
END $$;

-- ai_usage_logs: the builder's build id, so spend is summed per build.
ALTER TABLE public.ai_usage_logs ADD COLUMN IF NOT EXISTS ref_id uuid;
CREATE INDEX IF NOT EXISTS ai_usage_logs_ref_idx
  ON public.ai_usage_logs (ref_id) WHERE ref_id IS NOT NULL;

-- stores: the brand memory every agent skill reads (F-83).
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS agent_profile jsonb;

COMMIT;

-- Rollback (only before any v2 code reads these):
--   ALTER TABLE public.stores DROP COLUMN IF EXISTS agent_profile;
--   DROP INDEX IF EXISTS public.ai_usage_logs_ref_idx;
--   ALTER TABLE public.ai_usage_logs DROP COLUMN IF EXISTS ref_id;
--   ALTER TABLE public.store_builds DROP CONSTRAINT IF EXISTS store_builds_source_check,
--     DROP COLUMN IF EXISTS published_at, DROP COLUMN IF EXISTS source,
--     DROP COLUMN IF EXISTS target_store_id, DROP COLUMN IF EXISTS intake_id;
--   DROP TABLE IF EXISTS public.store_build_intakes;
--   DELETE FROM storage.buckets WHERE id = 'store-build-intake' (only when empty).
