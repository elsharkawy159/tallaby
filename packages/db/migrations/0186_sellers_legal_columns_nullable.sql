-- 0186: let sellers.business_type and sellers.legal_address be NULL.
--
-- WHY (owner, 2026-11-27): the seller account page /settings was removed, and
--   the code no longer collects or writes the business type or legal address.
--   Both columns are NOT NULL with no default, so seller sign-up
--   (ensureSellerAccount) would fail on the new code. 0187 drops them (and
--   seller_documents and sellers.payment_details) after the deploy.
--
-- DEPLOY ORDER: apply BEFORE deploying the code that ships with it. Safe on
--   the old code too: it still writes both columns, and nothing reads a NULL.
--   Staging first, then production with owner approval (CLAUDE.md rules 4, 6).
--   Additive: no row changes. Idempotent: DROP NOT NULL is a no-op when the
--   column is already nullable, and the guard skips a column that is gone.

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'sellers' AND column_name = 'business_type') THEN
    ALTER TABLE public.sellers ALTER COLUMN business_type DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'sellers' AND column_name = 'legal_address') THEN
    ALTER TABLE public.sellers ALTER COLUMN legal_address DROP NOT NULL;
  END IF;
END $$;

COMMIT;
