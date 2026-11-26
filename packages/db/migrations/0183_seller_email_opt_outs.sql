-- 0183: Seller email opt-outs (ROADMAP.md F-113).
--
-- One row per (seller, kind) the seller turned off with the one-click link in
-- the email. The only kind today is `weekly_insights` (the weekly store
-- insights email); the store-offline email has no opt-out and doesn't read
-- this table. Rows are written by the dashboard's unsubscribe route
-- (`/api/email/weekly-insights/unsubscribe`, HMAC-signed token) and read by
-- the backend's weekly batch.
--
-- Additive and idempotent. Server-only (RLS on, no policies). Not applied
-- anywhere yet; owner approval needed for production. Without it the weekly
-- batch sends nothing and reports `migration_missing`, and the unsubscribe
-- page says the link isn't working; the store-offline email still sends.

CREATE TABLE IF NOT EXISTS public.seller_email_opt_outs (
  seller_id   uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  kind        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seller_email_opt_outs_pkey PRIMARY KEY (seller_id, kind),
  CONSTRAINT seller_email_opt_outs_kind_check CHECK (kind IN ('weekly_insights'))
);

-- Server-only.
ALTER TABLE public.seller_email_opt_outs ENABLE ROW LEVEL SECURITY;

-- Rollback: DROP TABLE public.seller_email_opt_outs;
