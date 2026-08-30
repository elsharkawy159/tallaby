-- Shipping v2: COD collection audit, provider/rider CRUD fields.
--
-- Every statement is written to be safely re-runnable, matching 0009's
-- convention — this project's drizzle.__drizzle_migrations table is out of
-- sync with migrations/meta.

-- 'collected' distinguishes "rider took cash on delivery" from 'paid'
-- (prepaid via a payment gateway). Additive enum value: existing rows and
-- readers of payment_status are unaffected.
ALTER TYPE "public"."payment_status" ADD VALUE IF NOT EXISTS 'collected';--> statement-breakpoint

ALTER TABLE "shipping_providers" ADD COLUMN IF NOT EXISTS "logo_url" text;--> statement-breakpoint
ALTER TABLE "shipping_providers" ADD COLUMN IF NOT EXISTS "contact_name" text;--> statement-breakpoint
ALTER TABLE "shipping_providers" ADD COLUMN IF NOT EXISTS "contact_phone" text;--> statement-breakpoint
ALTER TABLE "shipping_providers" ADD COLUMN IF NOT EXISTS "contact_email" text;--> statement-breakpoint
ALTER TABLE "shipping_providers" ADD COLUMN IF NOT EXISTS "website" text;--> statement-breakpoint
ALTER TABLE "shipping_providers" ADD COLUMN IF NOT EXISTS "notes" text;--> statement-breakpoint

-- Rider on/off-duty toggle, distinct from is_suspended (admin-controlled
-- account access). Defaults true so existing rider rows start available.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_available" boolean DEFAULT true;
