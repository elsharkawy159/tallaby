-- 0123: product Trash (ROADMAP.md F-35). Deleting a product moves it to
-- Trash for 30 days instead of erasing it; the seller can restore it, and a
-- daily job deletes it for good after 30 days.
--
-- A trashed product gets `status = 'draft'`, so every storefront,
-- marketplace, search, cart and checkout read that already requires
-- 'active' hides it with no change. `trashed_status` keeps the status it had,
-- so Restore puts it back as it was. `deleted_at` marks it trashed (the
-- seller's own lists filter on it); `deleted_by` is who trashed it.
-- `purged_at` marks a product deleted for good that orders still point to:
-- order_items needs the row, so it stays (hidden everywhere, out of Trash).
--
-- Additive: old code never reads these columns. The product queries select
-- every column, so apply this before deploying the code that reads them.
-- Idempotent.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_by uuid;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS trashed_status public.product_status;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS purged_at timestamptz;

-- The Trash list (per seller) and the purge job (oldest first).
CREATE INDEX IF NOT EXISTS products_trashed_idx
  ON public.products (seller_id, deleted_at)
  WHERE deleted_at IS NOT NULL AND purged_at IS NULL;
