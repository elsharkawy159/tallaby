-- 0158_agent_runtime.sql (ROADMAP.md F-83a; design:
-- docs/superpowers/specs/2026-11-08-ai-store-builder-v2-design.md §14.2)
--
-- Durable state for the agent core (packages/agent), so it works across
-- serverless instances:
--
--   1. agent_tool_calls: in-app and store-builder tool runs land here too.
--      grant_id becomes nullable (MCP rows keep it), a `source` column says who
--      ran the tool ('mcp' | 'in_app' | 'builder', default 'mcp' so the MCP
--      writer keeps working unchanged), and a check keeps every MCP row tied to
--      its grant (added NOT VALID, then validated: every existing row is MCP and
--      has a grant).
--   2. agent_pending_actions: a proposed write waiting for the seller's
--      Confirm (plan, then confirm). The id is the opaque `act_…` id the
--      dashboard holds. Confirm claims it with
--      `UPDATE … SET status = 'running' WHERE status = 'pending'`, so a double
--      click runs the tool once; a later confirm replays the stored result.
--   3. agent_read_counts: the daily cap on direct agent reads, one row per
--      seller per Cairo day, incremented with one atomic upsert.
--      (agent_rate_windows from 0133 is keyed by a NOT NULL grant_id in its
--      primary key, so it cannot hold in-app counters.)
--
-- Every new table is server-only (RLS on, no policies). Idempotent and
-- guarded. The app selects every agent_tool_calls column, so apply this on
-- production BEFORE deploying any code from main after it.

BEGIN;

-- 1 ────────────────────────────────────────────────────────────────────────
ALTER TABLE public.agent_tool_calls ALTER COLUMN grant_id DROP NOT NULL;

ALTER TABLE public.agent_tool_calls ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'mcp';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_tool_calls_source_check') THEN
    ALTER TABLE public.agent_tool_calls
      ADD CONSTRAINT agent_tool_calls_source_check CHECK (source IN ('mcp', 'in_app', 'builder'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_tool_calls_mcp_grant_check') THEN
    ALTER TABLE public.agent_tool_calls
      ADD CONSTRAINT agent_tool_calls_mcp_grant_check CHECK (source <> 'mcp' OR grant_id IS NOT NULL) NOT VALID;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_tool_calls_mcp_grant_check' AND NOT convalidated) THEN
    ALTER TABLE public.agent_tool_calls VALIDATE CONSTRAINT agent_tool_calls_mcp_grant_check;
  END IF;
END $$;

-- 2 ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_pending_actions (
  id text PRIMARY KEY,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  -- The user who proposed it (owner or staff); kept when the user is deleted.
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  source text NOT NULL,
  tool text NOT NULL,
  -- Already validated by the tool's schema.
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- The confirm card built in code (i18n keys and params).
  card jsonb NOT NULL DEFAULT '{}'::jsonb,
  credits integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  result jsonb,
  error_code text,
  -- AI credit claim reference(s) of the run, comma separated.
  credit_claim_id text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_pending_actions_id_check') THEN
    ALTER TABLE public.agent_pending_actions
      ADD CONSTRAINT agent_pending_actions_id_check CHECK (id ~ '^act_[A-Za-z0-9_-]{24}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_pending_actions_status_check') THEN
    ALTER TABLE public.agent_pending_actions
      ADD CONSTRAINT agent_pending_actions_status_check
      CHECK (status IN ('pending', 'running', 'done', 'failed', 'cancelled', 'expired'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_pending_actions_source_check') THEN
    ALTER TABLE public.agent_pending_actions
      ADD CONSTRAINT agent_pending_actions_source_check CHECK (source IN ('mcp', 'in_app', 'builder'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_pending_actions_tool_length') THEN
    ALTER TABLE public.agent_pending_actions
      ADD CONSTRAINT agent_pending_actions_tool_length CHECK (char_length(tool) BETWEEN 1 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_pending_actions_credits_check') THEN
    ALTER TABLE public.agent_pending_actions
      ADD CONSTRAINT agent_pending_actions_credits_check CHECK (credits BETWEEN 0 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_pending_actions_error_code_length') THEN
    ALTER TABLE public.agent_pending_actions
      ADD CONSTRAINT agent_pending_actions_error_code_length CHECK (error_code IS NULL OR char_length(error_code) <= 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_pending_actions_credit_claim_length') THEN
    ALTER TABLE public.agent_pending_actions
      ADD CONSTRAINT agent_pending_actions_credit_claim_length CHECK (credit_claim_id IS NULL OR char_length(credit_claim_id) <= 2000);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS agent_pending_actions_seller_created_idx
  ON public.agent_pending_actions (seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_pending_actions_expires_idx
  ON public.agent_pending_actions (expires_at);

ALTER TABLE public.agent_pending_actions ENABLE ROW LEVEL SECURITY;

-- 3 ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_read_counts (
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  -- The Cairo calendar day.
  day date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  CONSTRAINT agent_read_counts_pkey PRIMARY KEY (seller_id, day)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_read_counts_count_check') THEN
    ALTER TABLE public.agent_read_counts
      ADD CONSTRAINT agent_read_counts_count_check CHECK (count >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS agent_read_counts_day_idx
  ON public.agent_read_counts (day);

ALTER TABLE public.agent_read_counts ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Rollback:
--   DROP TABLE agent_read_counts, agent_pending_actions;
--   DELETE FROM agent_tool_calls WHERE grant_id IS NULL;
--   ALTER TABLE agent_tool_calls DROP CONSTRAINT agent_tool_calls_mcp_grant_check,
--     DROP CONSTRAINT agent_tool_calls_source_check, DROP COLUMN source,
--     ALTER COLUMN grant_id SET NOT NULL;
