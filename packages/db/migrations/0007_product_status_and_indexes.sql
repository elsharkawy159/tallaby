CREATE TYPE "public"."product_status" AS ENUM('draft', 'pending', 'active', 'rejected');--> statement-breakpoint
-- Backfill existing products as 'active' so nothing currently live on the
-- storefront disappears; only products created/edited from here on start
-- 'pending' (the app sets status explicitly on every write, but the
-- column default below is the safety net for any write that doesn't).
ALTER TABLE "products" ADD COLUMN "status" "product_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
-- is_commission_exempt is already added by migration 0006 (idempotent via
-- IF NOT EXISTS); intentionally not repeated here.
CREATE INDEX "category_slug_idx" ON "categories" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "category_parent_id_idx" ON "categories" USING btree ("parent_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "product_translations_locale_slug_idx" ON "product_translations" USING btree ("locale" text_ops,"slug" text_ops);--> statement-breakpoint
CREATE INDEX "product_variants_product_id_idx" ON "product_variants" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "product_status_active_idx" ON "products" USING btree ("status" enum_ops,"is_active" bool_ops);--> statement-breakpoint
CREATE INDEX "product_created_at_idx" ON "products" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "product_rating_idx" ON "products" USING btree ("average_rating" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "product_price_final_idx" ON "products" USING btree ((((price ->> 'final'::text))::numeric));--> statement-breakpoint
CREATE INDEX "review_product_status_idx" ON "reviews" USING btree ("product_id" uuid_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "seller_status_idx" ON "sellers" USING btree ("status" enum_ops);--> statement-breakpoint
-- Clamp any existing negative stock before the CHECK constraints below make
-- writing one impossible going forward (inventory decrement was disabled
-- until this refactor, so no negative values are expected, but a stale or
-- manually-edited row could exist).
UPDATE "products" SET "quantity" = 0 WHERE "quantity" < 0;--> statement-breakpoint
UPDATE "product_variants" SET "stock" = 0 WHERE "stock" < 0;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_stock_non_negative" CHECK (stock >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_quantity_non_negative" CHECK (quantity >= 0);
