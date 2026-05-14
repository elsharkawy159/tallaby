-- Supplemental migration: sellers onboarding columns + product_type enum/column
-- These DDL statements were omitted from 0002_digital_commerce.sql because the columns
-- were pre-applied to the development database via a synthetic Drizzle snapshot.
-- This migration makes the history a complete record and is safe to run against any
-- database state (IF NOT EXISTS guards prevent errors on already-applied DBs).

DO $$ BEGIN
  CREATE TYPE "public"."product_type" AS ENUM ('physical', 'digital');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "product_type" "product_type" DEFAULT 'physical';
--> statement-breakpoint

ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "stripe_onboarding_complete" boolean DEFAULT false;
--> statement-breakpoint

ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "payout_enabled" boolean DEFAULT false;
--> statement-breakpoint

ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "identity_verified" boolean DEFAULT false;
--> statement-breakpoint

ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "identity_docs_url" text;
--> statement-breakpoint

ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "onboarding_step" integer DEFAULT 0;
--> statement-breakpoint

ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "onboarding_complete" boolean DEFAULT false;
--> statement-breakpoint

ALTER TABLE "sellers" ADD COLUMN IF NOT EXISTS "store_description" text;
