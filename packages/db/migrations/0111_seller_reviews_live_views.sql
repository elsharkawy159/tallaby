-- 0111: reviews a seller adds from the product form, and the product page's live views counter.
--
-- Seller-added reviews are reviews the seller really received elsewhere
-- (WhatsApp, social media, an old store) and types in. They have no customer
-- account, so `user_id` becomes nullable and the reviewer's name is stored on
-- the row. `source` tells them apart from customer reviews: customer rows keep
-- a user, seller rows need a name. Existing rows are all customer reviews.
--
-- `products.show_live_views` turns on the "N people are viewing this now"
-- line on the product page (off by default; the seller ticks it per product).
--
-- Additive: old code never writes `source` (default 'customer') and never
-- reads `show_live_views`. Idempotent.

ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_name text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'customer';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_source_check') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_source_check CHECK (
      (source = 'customer' AND user_id IS NOT NULL)
      OR (source = 'seller' AND user_id IS NULL AND char_length(btrim(coalesce(reviewer_name, ''))) BETWEEN 1 AND 80)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS review_product_seller_source_idx
  ON public.reviews (product_id)
  WHERE source = 'seller';

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS show_live_views boolean NOT NULL DEFAULT false;

-- The seller wrote these reviews themselves: no "review received" notification.
CREATE OR REPLACE FUNCTION public.notify_seller_review_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
BEGIN
  IF new.source = 'seller' THEN
    RETURN NULL;
  END IF;
  BEGIN
    INSERT INTO public.seller_notifications (seller_id, type, data, dedupe_key)
    SELECT
      coalesce(new.seller_id, p.seller_id),
      'review_received',
      jsonb_build_object('rating', new.rating, 'productId', p.id),
      'review_received:' || new.id::text
    FROM (SELECT 1) AS one
    LEFT JOIN public.products p ON p.id = new.product_id
    WHERE coalesce(new.seller_id, p.seller_id) IS NOT NULL
    ON CONFLICT (seller_id, dedupe_key) DO NOTHING;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'notify_seller_review_received: %', sqlerrm;
  END;
  RETURN NULL;
END;
$fn$;
