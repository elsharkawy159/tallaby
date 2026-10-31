-- 0133: AI assistants connect to a seller's stores over MCP (ROADMAP.md F-29b,
-- docs/superpowers/specs/2026-10-30-mcp-agent-connection-design.md §9).
--
-- Tallaby runs its own small OAuth 2.1 server in the dashboard; the MCP server
-- (apps/backend, mcp.tallaby.com) checks the access tokens it issues.
--
-- 1. `oauth_clients`: one row per assistant app. `client_id` is a random id
--    from Dynamic Client Registration (kind 'dcr'), the https URL of a Client
--    ID Metadata Document (kind 'cimd', cached copy of the document), or the
--    built-in personal-token client (kind 'pat').
-- 2. `agent_grants`: one row per "Allow" on the consent page: which seller,
--    which user approved (the owner; staff later), which stores (or all of
--    them, new ones included) and which scopes. Revoking a grant kills every
--    token under it.
-- 3. `oauth_auth_codes`: one-time authorization codes (60 s, PKCE S256). Only
--    the sha256 of the code is stored.
-- 4. `agent_tokens`: access (1 h), refresh (30 days, rotated on every use;
--    `family_id` links a rotation chain so a reused refresh token revokes the
--    grant) and personal access tokens. Only the sha256 is stored.
-- 5. `agent_tool_calls`: the activity log (90 days) and the idempotency store
--    for create tools (unique grant + key).
-- 6. `agent_rate_windows`: durable per-grant rate-limit counters.
-- 7. `seller_notifications` type `agent_connected` (F-29d bell).
--
-- Every new table is server-only (RLS on, no policies). Additive and
-- idempotent; no existing code reads these tables.

-- 1 ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.oauth_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  kind text NOT NULL,
  name text NOT NULL,
  redirect_uris text[] NOT NULL DEFAULT '{}',
  client_uri text,
  logo_url text,
  software_id text,
  metadata_fetched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  disabled_at timestamptz,
  CONSTRAINT oauth_clients_client_id_key UNIQUE (client_id),
  CONSTRAINT oauth_clients_kind_check CHECK (kind IN ('dcr', 'cimd', 'pat')),
  CONSTRAINT oauth_clients_client_id_length CHECK (char_length(client_id) BETWEEN 8 AND 2000),
  CONSTRAINT oauth_clients_name_length CHECK (char_length(name) BETWEEN 1 AND 200),
  CONSTRAINT oauth_clients_redirect_uris_count CHECK (cardinality(redirect_uris) <= 20),
  CONSTRAINT oauth_clients_urls_length CHECK (
    (client_uri IS NULL OR char_length(client_uri) <= 2000)
    AND (logo_url IS NULL OR char_length(logo_url) <= 2000)
    AND (software_id IS NULL OR char_length(software_id) <= 200)
  )
);

ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;

-- 2 ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.oauth_clients(id) ON DELETE CASCADE,
  client_label text NOT NULL,
  all_stores boolean NOT NULL DEFAULT false,
  store_ids uuid[] NOT NULL DEFAULT '{}',
  scopes text[] NOT NULL,
  resource text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  CONSTRAINT agent_grants_scopes_check CHECK (
    cardinality(scopes) BETWEEN 1 AND 20
    AND 'store.read' = ANY (scopes)
    AND scopes <@ ARRAY[
      'store.read', 'customers.read', 'products.write', 'orders.write', 'orders.refund',
      'website.write', 'website.publish', 'settings.write', 'products.purge', 'stores.create'
    ]::text[]
  ),
  CONSTRAINT agent_grants_stores_check CHECK (all_stores OR cardinality(store_ids) BETWEEN 1 AND 100),
  CONSTRAINT agent_grants_client_label_length CHECK (char_length(client_label) BETWEEN 1 AND 200),
  CONSTRAINT agent_grants_resource_length CHECK (resource IS NULL OR char_length(resource) <= 2000),
  CONSTRAINT agent_grants_revoked_reason_check CHECK (
    revoked_reason IS NULL
    OR revoked_reason IN ('seller', 'client', 'code_reuse', 'refresh_reuse', 'seller_blocked', 'password_changed', 'admin')
  )
);

CREATE INDEX IF NOT EXISTS agent_grants_seller_idx
  ON public.agent_grants (seller_id, created_at DESC);

ALTER TABLE public.agent_grants ENABLE ROW LEVEL SECURITY;

-- 3 ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.oauth_auth_codes (
  code_hash text PRIMARY KEY,
  grant_id uuid NOT NULL REFERENCES public.agent_grants(id) ON DELETE CASCADE,
  redirect_uri text NOT NULL,
  code_challenge text NOT NULL,
  resource text,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT oauth_auth_codes_hash_length CHECK (char_length(code_hash) = 64),
  CONSTRAINT oauth_auth_codes_challenge_length CHECK (char_length(code_challenge) BETWEEN 43 AND 128),
  CONSTRAINT oauth_auth_codes_redirect_length CHECK (char_length(redirect_uri) <= 2000)
);

CREATE INDEX IF NOT EXISTS oauth_auth_codes_grant_idx
  ON public.oauth_auth_codes (grant_id);

ALTER TABLE public.oauth_auth_codes ENABLE ROW LEVEL SECURITY;

-- 4 ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid NOT NULL REFERENCES public.agent_grants(id) ON DELETE CASCADE,
  kind text NOT NULL,
  token_hash text NOT NULL,
  family_id uuid NOT NULL,
  expires_at timestamptz,
  used_at timestamptz,
  revoked_at timestamptz,
  name text,
  last_used_at timestamptz,
  last_used_ip text,
  last_used_ua text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_tokens_token_hash_key UNIQUE (token_hash),
  CONSTRAINT agent_tokens_kind_check CHECK (kind IN ('access', 'refresh', 'pat')),
  CONSTRAINT agent_tokens_hash_length CHECK (char_length(token_hash) = 64),
  CONSTRAINT agent_tokens_expiry_check CHECK (kind = 'pat' OR expires_at IS NOT NULL),
  CONSTRAINT agent_tokens_text_length CHECK (
    (name IS NULL OR char_length(name) <= 100)
    AND (last_used_ip IS NULL OR char_length(last_used_ip) <= 100)
    AND (last_used_ua IS NULL OR char_length(last_used_ua) <= 300)
  )
);

CREATE INDEX IF NOT EXISTS agent_tokens_grant_idx ON public.agent_tokens (grant_id);
CREATE INDEX IF NOT EXISTS agent_tokens_family_idx ON public.agent_tokens (family_id);

ALTER TABLE public.agent_tokens ENABLE ROW LEVEL SECURITY;

-- 5 ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_tool_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id uuid NOT NULL REFERENCES public.agent_grants(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  tool text NOT NULL,
  args_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL,
  error_code text,
  idempotency_key text,
  result_ref jsonb,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_tool_calls_status_check CHECK (status IN ('ok', 'error', 'denied', 'rate_limited')),
  CONSTRAINT agent_tool_calls_tool_length CHECK (char_length(tool) BETWEEN 1 AND 100),
  CONSTRAINT agent_tool_calls_error_code_length CHECK (error_code IS NULL OR char_length(error_code) <= 100),
  CONSTRAINT agent_tool_calls_idempotency_key_length CHECK (idempotency_key IS NULL OR char_length(idempotency_key) BETWEEN 1 AND 200),
  CONSTRAINT agent_tool_calls_duration_check CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_tool_calls_idempotency_key
  ON public.agent_tool_calls (grant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS agent_tool_calls_seller_created_idx
  ON public.agent_tool_calls (seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS agent_tool_calls_created_idx
  ON public.agent_tool_calls (created_at);

ALTER TABLE public.agent_tool_calls ENABLE ROW LEVEL SECURITY;

-- 6 ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_rate_windows (
  grant_id uuid NOT NULL REFERENCES public.agent_grants(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  CONSTRAINT agent_rate_windows_pkey PRIMARY KEY (grant_id, bucket, window_start),
  CONSTRAINT agent_rate_windows_bucket_length CHECK (char_length(bucket) BETWEEN 1 AND 50),
  CONSTRAINT agent_rate_windows_count_check CHECK (count >= 0)
);

CREATE INDEX IF NOT EXISTS agent_rate_windows_window_idx
  ON public.agent_rate_windows (window_start);

ALTER TABLE public.agent_rate_windows ENABLE ROW LEVEL SECURITY;

-- 7 ────────────────────────────────────────────────────────────────────────
-- Re-creates the check with every existing type (0098, 0106, 0117, 0119,
-- 0125, 0131) plus agent_connected. Guarded so a re-run never narrows a list
-- a later migration widened. A superset of 0131's list, so 0131's own guard
-- (LIKE '%admin_message%') skips if it runs after this one.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'seller_notifications_type_check'
      AND pg_get_constraintdef(oid) LIKE '%agent_connected%'
  ) THEN
    ALTER TABLE public.seller_notifications DROP CONSTRAINT IF EXISTS seller_notifications_type_check;
    ALTER TABLE public.seller_notifications ADD CONSTRAINT seller_notifications_type_check CHECK (type IN (
      'order_created', 'top_up_approved', 'top_up_rejected', 'question_received', 'review_received',
      'carrier_shipment_failed', 'carrier_needs_attention',
      'referral_commission_earned', 'referral_payout_paid', 'referral_payout_rejected',
      'welcome_gift_granted', 'welcome_gift_expiring', 'welcome_gift_expired',
      'low_stock',
      'admin_message',
      'agent_connected'
    ));
  END IF;
END $$;

-- Rollback:
--   DROP TABLE agent_rate_windows, agent_tool_calls, agent_tokens, oauth_auth_codes, agent_grants, oauth_clients;
--   re-run 0131's seller_notifications_type_check block (without agent_connected;
--   delete agent_connected rows first).
