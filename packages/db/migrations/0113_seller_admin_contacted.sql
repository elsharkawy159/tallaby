-- 0113_seller_admin_contacted.sql (admin sellers table, 2026-10-28)
--
-- Admin › Sellers has a WhatsApp button on every row. Clicking it opens the
-- chat and records that the seller was contacted, so the button turns gray.
-- The button keeps working; each new contact moves the time forward.
--   admin_contacted_at  last time an admin opened WhatsApp for this seller; NULL = never
--   admin_contacted_by  that admin's users row (NULL if the account is gone)
--
-- Idempotent and additive. Server-only writes (admin server action through
-- Drizzle); RLS and policies on sellers are unchanged.

ALTER TABLE sellers ADD COLUMN IF NOT EXISTS admin_contacted_at timestamptz;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS admin_contacted_by uuid
  REFERENCES users(id) ON DELETE SET NULL;
