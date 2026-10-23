-- 0099_seller_heard_about_us.sql (admin people pages, 2026-10-23)
--
-- Where a seller first heard about Tallaby, asked once by a pop-up on the
-- seller dashboard and shown in Admin › Sellers, so ad spend can follow the
-- channels that bring sellers.
--   heard_about_us        facebook | instagram | youtube | tiktok | google | friend | other
--   heard_about_us_other  free text when the answer is 'other' (optional, max 120)
--   heard_about_us_at     when the seller answered; NULL = not asked yet
--
-- Idempotent. Server-only writes (dashboard server action through Drizzle);
-- RLS and policies on sellers are unchanged.

ALTER TABLE sellers ADD COLUMN IF NOT EXISTS heard_about_us text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS heard_about_us_other text;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS heard_about_us_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sellers_heard_about_us_check' AND conrelid = 'public.sellers'::regclass
  ) THEN
    ALTER TABLE sellers ADD CONSTRAINT sellers_heard_about_us_check CHECK (
      heard_about_us IS NULL
      OR heard_about_us IN ('facebook', 'instagram', 'youtube', 'tiktok', 'google', 'friend', 'other')
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sellers_heard_about_us_other_check' AND conrelid = 'public.sellers'::regclass
  ) THEN
    ALTER TABLE sellers ADD CONSTRAINT sellers_heard_about_us_other_check CHECK (
      heard_about_us_other IS NULL OR char_length(heard_about_us_other) <= 120
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS sellers_heard_about_us_idx ON sellers (heard_about_us)
  WHERE heard_about_us IS NOT NULL;
