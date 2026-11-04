-- 0146: extra campaign emails bought from the store wallet (owner, 2026-11-04; ROADMAP.md F-69).
--
-- $1.50 per 1,000 emails. The monthly allowance is worked out from
-- store_email_campaigns; this holds only what was bought and not used yet,
-- which carries over. The purchase itself is a wallet ledger entry.
--
-- Additive and idempotent. Server-only: RLS on, no policies.

CREATE TABLE IF NOT EXISTS public.seller_email_credits (
  seller_id uuid PRIMARY KEY REFERENCES public.sellers (id) ON DELETE CASCADE,
  purchased_remaining integer NOT NULL DEFAULT 0 CHECK (purchased_remaining >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_email_credits ENABLE ROW LEVEL SECURITY;

-- Rollback: DROP TABLE public.seller_email_credits (loses bought emails not used yet).
