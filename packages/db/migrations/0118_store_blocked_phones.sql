-- 0118: store phone blocklist (ROADMAP.md F-02a, fake-order protection).
--
-- A seller blocks a customer phone on one store; that store's website checkout
-- then refuses orders whose shipping phone matches (F-02b). Phones are stored
-- in the local mobile form `01XXXXXXXXX` (normalizeBlockedPhone in
-- packages/lib/src/stores/blocked-phones.lib.ts), so `010…`, `+2010…`,
-- `2010…` and `002010…` all match one row. Phone only (owner, 2026-10-29).
--
-- Server-only (RLS on, no policies): the dashboard reads and writes it through
-- Drizzle after checking the store belongs to the session seller. Additive and
-- idempotent; nothing reads it until the code is deployed.

CREATE TABLE IF NOT EXISTS public.store_blocked_phones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  phone text NOT NULL,
  reason text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_blocked_phones_store_phone_key UNIQUE (store_id, phone),
  CONSTRAINT store_blocked_phones_phone_check CHECK (phone ~ '^01[0-9]{9}$'),
  CONSTRAINT store_blocked_phones_reason_check CHECK (reason IS NULL OR char_length(reason) <= 300)
);

CREATE INDEX IF NOT EXISTS store_blocked_phones_store_created_idx
  ON public.store_blocked_phones (store_id, created_at DESC);

ALTER TABLE public.store_blocked_phones ENABLE ROW LEVEL SECURITY;
