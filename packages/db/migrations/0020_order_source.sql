CREATE TYPE "public"."order_source" AS ENUM('website', 'external');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_source" "order_source" DEFAULT 'website' NOT NULL;
