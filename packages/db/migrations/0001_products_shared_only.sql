-- products table: keep only shared data; localized content lives in product_translations
-- Make title, slug nullable so products can be created without duplicating content

ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_slug_unique";
ALTER TABLE "products" ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "products" ALTER COLUMN "slug" DROP NOT NULL;
