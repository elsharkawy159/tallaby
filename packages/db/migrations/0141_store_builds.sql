-- 0141_store_builds.sql (ROADMAP.md F-54b–d; design:
-- docs/superpowers/specs/2026-11-03-ai-store-builder-design.md)
--
-- The AI Store Builder's saved conversation, its build steps and the one free
-- build per account. Additive and idempotent. All three tables are server-only
-- (RLS on, no policies).

BEGIN;

CREATE TABLE IF NOT EXISTS store_builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  -- Set once the build has a store. A deleted store leaves the history.
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'collecting'
    CHECK (status IN ('collecting', 'building', 'review', 'abandoned')),
  -- True once this build holds the account's free claim.
  free boolean NOT NULL DEFAULT false,
  -- The conversation: answers, messages and products (builder.dto.ts).
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  chat_turns integer NOT NULL DEFAULT 0 CHECK (chat_turns >= 0),
  site_copy_runs integer NOT NULL DEFAULT 0 CHECK (site_copy_runs >= 0),
  -- Why model steps stopped: 'budget', 'credits', 'cap', 'store_limit'…
  stop_reason text,
  -- A lease, so two tabs never run the same build at once.
  lock_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE store_builds ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS store_builds_seller_idx ON store_builds (seller_id, created_at DESC);
-- One conversation or running build per seller. It also makes "spend since this
-- build started" in ai_usage_logs exact.
CREATE UNIQUE INDEX IF NOT EXISTS store_builds_one_open_idx
  ON store_builds (seller_id) WHERE status IN ('collecting', 'building');

-- One row per build step; a step that is done is never run again.
CREATE TABLE IF NOT EXISTS store_build_items (
  build_id uuid NOT NULL REFERENCES store_builds(id) ON DELETE CASCADE,
  key text NOT NULL CHECK (char_length(key) BETWEEN 1 AND 80),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'done', 'failed', 'skipped')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  -- Generated copy saved before it is applied (a retry doesn't pay twice), and the outcome.
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (build_id, key)
);
ALTER TABLE store_build_items ENABLE ROW LEVEL SECURITY;

-- The free build: one per seller, ever, and one per phone number.
CREATE TABLE IF NOT EXISTS store_build_claims (
  seller_id uuid PRIMARY KEY REFERENCES sellers(id) ON DELETE CASCADE,
  build_id uuid REFERENCES store_builds(id) ON DELETE SET NULL,
  -- Normalized (01XXXXXXXXX). Not verified: it only stops casual repeats.
  phone_key text,
  -- A hash, never the address.
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE store_build_claims ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS store_build_claims_phone_idx
  ON store_build_claims (phone_key) WHERE phone_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS store_build_claims_ip_idx
  ON store_build_claims (ip_hash, created_at DESC) WHERE ip_hash IS NOT NULL;

-- The platform's daily budget sums these rows on each new free build.
CREATE INDEX IF NOT EXISTS ai_usage_logs_store_builder_idx
  ON ai_usage_logs (created_at) WHERE feature LIKE 'store_builder_%';

COMMIT;
