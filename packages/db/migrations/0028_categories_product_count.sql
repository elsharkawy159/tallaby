ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS product_count integer NOT NULL DEFAULT 0;

UPDATE categories c
SET product_count = (
  SELECT COUNT(*)::integer
  FROM products p
  WHERE p.category_id = c.id AND p.status = 'active'
);

CREATE INDEX IF NOT EXISTS category_product_count_idx
  ON categories (product_count DESC)
  WHERE product_count > 0;
