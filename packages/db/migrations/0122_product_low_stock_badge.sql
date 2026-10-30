-- 0122: the product form's "Show a low-stock alert" checkbox (ROADMAP.md F-34).
--
-- `products.show_low_stock_badge` (off by default, like show_live_views)
-- turns on the store product page's urgency badge ("Only 2 left, order
-- before it's gone") and a "N left" tag on the store's product cards, once
-- the real stock is at or below the threshold. Never a made-up number.
--
-- `products.low_stock_threshold` is that threshold, 1-99; null means 5. F-10
-- will reuse it for the seller's own low-stock alerts.
--
-- Additive: old code never reads either column. The product queries select
-- every column, so apply this before deploying the code that reads them.
-- Idempotent.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS show_low_stock_badge boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_low_stock_threshold_check') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_low_stock_threshold_check
      CHECK (low_stock_threshold IS NULL OR low_stock_threshold BETWEEN 1 AND 99);
  END IF;
END $$;
