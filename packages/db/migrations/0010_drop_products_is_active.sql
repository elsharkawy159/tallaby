-- Preserve seller-hidden approved products before dropping is_active
UPDATE products
SET status = 'draft'
WHERE status = 'active' AND is_active = false;
--> statement-breakpoint
ALTER TABLE products ALTER COLUMN status SET DEFAULT 'pending';
--> statement-breakpoint
DROP INDEX IF EXISTS product_status_active_idx;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS product_status_idx ON products USING btree (status);
--> statement-breakpoint
ALTER TABLE products DROP COLUMN IF EXISTS is_active;
