-- 0085_store_chrome_version.sql (admin website builder, 2026-10-20)
--
-- stores.chrome_version: optimistic-concurrency counter for the draft
-- header/footer (shared_header, shared_footer), like store_pages.draft_version
-- and store_design_systems.version. Every writer of those columns bumps it.
-- stores.site_edited_by_admin_at: set when an admin saves a store's site
-- drafts, so the seller's editor can tell it changed elsewhere.
--
-- Idempotent. Existing columns/RLS/policies on stores are unchanged.

ALTER TABLE stores ADD COLUMN IF NOT EXISTS chrome_version integer NOT NULL DEFAULT 1;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS site_edited_by_admin_at timestamptz;
