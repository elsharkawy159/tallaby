-- 0170: Store setup reminder emails (ROADMAP.md F-94).
--
-- A seller whose store isn't set up (the dashboard home's four steps: a
-- product, the store design, payments, shipping; see
-- packages/lib/src/sellers/store-setup.lib.ts) gets at most two Arabic emails:
-- `day1` 24 hours after the seller account was made and `day7` after 7 days.
-- One row per (seller, kind), claimed with INSERT … ON CONFLICT before the email
-- is sent, so two cron runs never send twice. A failed send is marked `failed`
-- and retried by a later run until `attempts` reaches the code's limit.
--
-- `opt_out` is the seller's "stop these reminders" click (one-click link in
-- both emails, found by `token`); it stops every later reminder.
--
-- Additive and idempotent. Server-only (RLS on, no policies). The cron and the
-- Admin seller page read it, so apply on staging, then production, BEFORE
-- deploying (Admin degrades to "could not be loaded" without it).

CREATE TABLE IF NOT EXISTS public.seller_setup_reminders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  kind        text NOT NULL,
  status      text NOT NULL DEFAULT 'sending',
  attempts    smallint NOT NULL DEFAULT 1,
  -- Opt-out link token (random hex, written by the code); null on opt_out rows.
  token       text,
  resend_id   text,
  error       text,
  claimed_at  timestamptz NOT NULL DEFAULT now(),
  sent_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT seller_setup_reminders_kind_check CHECK (kind IN ('day1', 'day7', 'opt_out')),
  CONSTRAINT seller_setup_reminders_status_check CHECK (status IN ('sending', 'sent', 'failed', 'opted_out')),
  CONSTRAINT seller_setup_reminders_attempts_check CHECK (attempts BETWEEN 0 AND 100),
  CONSTRAINT seller_setup_reminders_token_check CHECK (token IS NULL OR token ~ '^[0-9a-f]{32,128}$'),
  CONSTRAINT seller_setup_reminders_error_check CHECK (error IS NULL OR char_length(error) <= 500),
  CONSTRAINT seller_setup_reminders_seller_kind_key UNIQUE (seller_id, kind)
);

CREATE UNIQUE INDEX IF NOT EXISTS seller_setup_reminders_token_key
  ON public.seller_setup_reminders (token) WHERE token IS NOT NULL;
-- The per-Cairo-day send cap counts today's claims.
CREATE INDEX IF NOT EXISTS seller_setup_reminders_claimed_idx
  ON public.seller_setup_reminders (claimed_at) WHERE kind <> 'opt_out';

-- Server-only.
ALTER TABLE public.seller_setup_reminders ENABLE ROW LEVEL SECURITY;

-- Rollback: DROP TABLE public.seller_setup_reminders;
