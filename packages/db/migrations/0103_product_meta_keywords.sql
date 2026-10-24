-- 0103_product_meta_keywords.sql (product form SEO keywords, 2026-10-24)
--
-- Search keywords a seller enters as tags in the product form's SEO section,
-- per language, emitted as <meta name="keywords"> on the product page.
--
-- Idempotent and additive. Apply BEFORE deploying the code that selects
-- product_translations.meta_keywords (every product page read needs it).
-- RLS and policies on product_translations are unchanged.

ALTER TABLE product_translations
  ADD COLUMN IF NOT EXISTS meta_keywords text[] NOT NULL DEFAULT '{}';
