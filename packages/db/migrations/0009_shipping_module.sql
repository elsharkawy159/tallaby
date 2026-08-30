-- Shipping module: platform-fulfilled last-mile delivery.
--
-- The `shipments` / `shipment_items` / `deliveries` tables already existed but
-- had no live reader or writer anywhere in the codebase (the only file that
-- touched them, apps/dashboard/actions/shipping.ts, had zero call sites and
-- referenced columns that do not exist). This migration repurposes `shipments`
-- as the single shipping record per order rather than adding a parallel table.
--
-- Every statement is written to be safely re-runnable: this project's
-- drizzle.__drizzle_migrations table is out of sync with migrations/meta (it
-- records a squashed baseline rather than each file), so a migration that is
-- already applied can be attempted again.
DO $$ BEGIN
	CREATE TYPE "public"."shipment_status" AS ENUM('pending', 'assigned', 'out_for_delivery', 'delivered', 'failed', 'returned', 'cancelled');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shipping_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "shipping_providers_code_unique" UNIQUE("code")
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipping_providers_active_idx" ON "shipping_providers" USING btree ("is_active" bool_ops);--> statement-breakpoint
-- Seed the three launch providers. Real carrier API integrations are wired up
-- later behind the adapter layer in apps/shipping, keyed off `code`.
INSERT INTO "shipping_providers" ("name", "code") VALUES
	('Bosta', 'bosta'),
	('ShipBlu', 'shipblu'),
	('Egypt Post', 'egypt_post')
ON CONFLICT ("code") DO NOTHING;--> statement-breakpoint
-- A platform-fulfilled delivery carries the whole order, so it is not tied to
-- a single seller.
ALTER TABLE "shipments" ALTER COLUMN "seller_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "provider_id" uuid;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "rider_id" uuid;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "assigned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "failure_reason" text;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "shipments" ADD CONSTRAINT "shipments_provider_id_shipping_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."shipping_providers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "shipments" ADD CONSTRAINT "shipments_rider_id_users_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
-- `status` was free-text with no CHECK. Normalize anything that exists before
-- the cast so the ALTER TYPE cannot fail on a stray value. The whole block is
-- skipped once the column is already the enum — the legacy comparisons below
-- would themselves be invalid against an enum column.
DO $$ BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name = 'shipments' AND column_name = 'status' AND data_type = 'text'
	) THEN
		UPDATE "shipments" SET "status" = 'out_for_delivery' WHERE "status" IN ('shipped', 'in_transit');
		UPDATE "shipments" SET "status" = 'pending' WHERE "status" IS NULL OR "status" NOT IN ('pending', 'assigned', 'out_for_delivery', 'delivered', 'failed', 'returned', 'cancelled');
		ALTER TABLE "shipments" ALTER COLUMN "status" DROP DEFAULT;
		ALTER TABLE "shipments" ALTER COLUMN "status" TYPE "public"."shipment_status" USING ("status"::"public"."shipment_status");
		ALTER TABLE "shipments" ALTER COLUMN "status" SET DEFAULT 'pending';
		ALTER TABLE "shipments" ALTER COLUMN "status" SET NOT NULL;
	END IF;
END $$;--> statement-breakpoint
-- Exactly one shipping record per order. This is what makes the shipping app's
-- assign actions idempotent (INSERT ... ON CONFLICT (order_id) DO UPDATE), and
-- it can be dropped later if per-seller split shipments are ever needed.
-- The (created_at, id) tuple is a total order, so this keeps exactly one row
-- per order even when two rows share a timestamp.
DELETE FROM "shipments" a USING "shipments" b WHERE a."order_id" = b."order_id" AND (a."created_at", a."id") > (b."created_at", b."id");--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_unique" UNIQUE("order_id");
EXCEPTION
	WHEN duplicate_table THEN null;
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipment_rider_id_idx" ON "shipments" USING btree ("rider_id" uuid_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipment_status_idx" ON "shipments" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipment_provider_id_idx" ON "shipments" USING btree ("provider_id" uuid_ops);
