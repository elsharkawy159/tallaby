-- What a seller's store sells, shown beside its location on the storefront
-- ({subdomain}.tallaby.com), e.g. "Mobile Accessories" / "إكسسوارات موبايل".
-- Free text in both languages, like categories.name / categories.name_ar.
--
-- Idempotent. Server-side (Drizzle) access only.

ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS store_category text,
  ADD COLUMN IF NOT EXISTS store_category_ar text;

UPDATE sellers
SET store_category = 'Mobile Accessories',
    store_category_ar = 'إكسسوارات موبايل'
WHERE slug = 'faster' AND store_category IS NULL;
