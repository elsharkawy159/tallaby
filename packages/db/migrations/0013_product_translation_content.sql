ALTER TABLE product_translations
  ADD COLUMN IF NOT EXISTS content text;
