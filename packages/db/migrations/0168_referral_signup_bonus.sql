-- 0168: affiliate sign-up bonus (ROADMAP.md F-37h, owner 2026-11-12).
--
-- The affiliate program now pays a flat EGP 100 once per referred seller
-- account, earned by the succeeded store-wallet top-up that makes that
-- seller's total cross from below $5 to $5 or more. The 25 % commission per
-- top-up is switched off in code (REFERRAL_PROGRAM in
-- packages/lib/src/referrals/referrals.lib.ts), not deleted.
--
-- Both kinds live in `referral_commissions`, so balances, payouts and the
-- admin "reverse a fake account" action keep working unchanged:
--   - `kind` 'percent' (every existing row, the default) or 'signup_bonus';
--   - a bonus row keeps the crossing top-up in `top_up_id` (still UNIQUE) and
--     its EGP base in `top_up_amount`;
--   - at most one bonus per referred seller (partial unique index), so a
--     repeated Kashier event or two top-ups racing post it once.
--
-- Additive and idempotent. Apply BEFORE deploying the code that inserts
-- `kind` (the Drizzle schema names the column on every insert and select).
-- No row is changed; no money moves.

ALTER TABLE public.referral_commissions
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'percent';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referral_commissions_kind_check') THEN
    ALTER TABLE public.referral_commissions
      ADD CONSTRAINT referral_commissions_kind_check CHECK (kind IN ('percent', 'signup_bonus'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS referral_commissions_one_signup_bonus
  ON public.referral_commissions (referred_seller_id) WHERE kind = 'signup_bonus';

-- Rollback (only while no 'signup_bonus' row exists, or after deleting them):
--   DROP INDEX IF EXISTS public.referral_commissions_one_signup_bonus;
--   ALTER TABLE public.referral_commissions DROP CONSTRAINT IF EXISTS referral_commissions_kind_check;
--   ALTER TABLE public.referral_commissions DROP COLUMN IF EXISTS kind;
