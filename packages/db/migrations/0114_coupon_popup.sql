-- 0114: show a seller coupon as a pop-up on the seller's store website.
--
-- `popup_trigger` is when the pop-up opens for a visitor: 'enter' (soon after
-- they arrive), 'exit' (when they move to leave the page) or 'random' (at a
-- random moment while browsing). NULL means no pop-up (every existing coupon).
--
-- `popup_duration_minutes` is how long the visitor has to use the code,
-- counted from the moment the pop-up appeared for them. The product page
-- shows it as a countdown ("ينتهي العرض في …"). It never runs past the
-- coupon's own `expires_at`.
--
-- Additive, but the dashboard and storefront select every `coupons` column,
-- so apply it BEFORE deploying the code that reads these columns. Idempotent.

ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS popup_trigger text;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS popup_duration_minutes integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coupons_popup_check') THEN
    ALTER TABLE public.coupons ADD CONSTRAINT coupons_popup_check CHECK (
      (popup_trigger IS NULL AND popup_duration_minutes IS NULL)
      OR (
        popup_trigger IN ('enter', 'exit', 'random')
        AND popup_duration_minutes BETWEEN 1 AND 43200
      )
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS coupon_seller_popup_idx
  ON public.coupons (seller_id)
  WHERE popup_trigger IS NOT NULL;
