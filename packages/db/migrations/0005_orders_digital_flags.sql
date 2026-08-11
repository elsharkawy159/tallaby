ALTER TABLE "orders" ADD COLUMN "has_digital_items" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_digital_only" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "paid_at" timestamp with time zone;