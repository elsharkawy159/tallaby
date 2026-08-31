-- Bulk provider assignment: one row per "Assign" / "Assign all" action from
-- the shipping app's Confirmed tab, plus the orders (and, for Tallaby, the
-- rider) each batch covers. Lets a past Egypt Post sheet be re-downloaded and
-- gives every bulk assignment an audit trail.
--
-- Every statement is written to be safely re-runnable, matching 0009/0011's
-- convention — this project's drizzle.__drizzle_migrations table is out of
-- sync with migrations/meta.

CREATE TABLE IF NOT EXISTS "shipment_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seq" integer GENERATED ALWAYS AS IDENTITY,
	"provider_id" uuid NOT NULL,
	"created_by" uuid,
	"order_count" integer NOT NULL,
	"export_format" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipment_batches_created_at_idx" ON "shipment_batches" USING btree ("created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipment_batches_provider_id_idx" ON "shipment_batches" USING btree ("provider_id" uuid_ops);--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "shipment_batches" ADD CONSTRAINT "shipment_batches_provider_id_shipping_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."shipping_providers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "shipment_batches" ADD CONSTRAINT "shipment_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "shipment_batch_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"rider_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "shipment_batch_items_batch_id_order_id_unique" UNIQUE("batch_id", "order_id")
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipment_batch_items_order_id_idx" ON "shipment_batch_items" USING btree ("order_id" uuid_ops);--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "shipment_batch_items" ADD CONSTRAINT "shipment_batch_items_batch_id_shipment_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."shipment_batches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "shipment_batch_items" ADD CONSTRAINT "shipment_batch_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "shipment_batch_items" ADD CONSTRAINT "shipment_batch_items_rider_id_users_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Our own delivery fleet, addressable through the same provider adapter
-- layer as Bosta/ShipBlu/Egypt Post. Its adapter (apps/shipping/providers/
-- tallaby.ts) splits a batch across on-duty riders instead of exporting a
-- sheet, so `shipment_batches.export_format` stays null for its batches.
INSERT INTO "shipping_providers" ("name", "code") VALUES
	('Tallaby', 'tallaby')
ON CONFLICT ("code") DO NOTHING;
