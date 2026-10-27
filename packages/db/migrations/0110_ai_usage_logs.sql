-- 0110_ai_usage_logs.sql: one row per AI model call (PLAN.md AI-0).
--
-- Feeds the per-seller daily caps (AI-1 product autofill) and, later, the AI
-- credit ledger and admin cost view (AI-4). No prompt text or file content is
-- stored: only the feature, model, token counts, cost and outcome.
--
-- Server-only: RLS on with no policies. Additive and idempotent.

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  feature text NOT NULL,
  model text NOT NULL,
  input_tokens integer,
  cached_input_tokens integer,
  output_tokens integer,
  cost_micro_usd bigint NOT NULL DEFAULT 0,
  latency_ms integer,
  status text NOT NULL,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_usage_logs_status_check CHECK (status IN ('ok', 'error', 'blocked'))
);

CREATE INDEX IF NOT EXISTS ai_usage_logs_seller_feature_created_idx
  ON ai_usage_logs (seller_id, feature, created_at DESC);

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
