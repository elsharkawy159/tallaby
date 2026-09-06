-- Backfill of 0004_digital_products_extended that was skipped by the
-- baseline-pre-0007 migration marker. Idempotent: safe if already applied.

DO $$ BEGIN
  CREATE TYPE "public"."digital_access_action" AS ENUM('grant', 'download', 'view', 'resend', 'revoke', 'reinstate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."digital_delivery_method" AS ENUM('automatic', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."digital_fulfillment_status" AS ENUM('pending', 'delivered', 'downloaded', 'expired', 'revoked', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."digital_product_type" AS ENUM('digital_download', 'ebook', 'template', 'design_asset', 'audio', 'video', 'course', 'ai_prompt', 'software', 'font', 'printable', 'game_asset', 'gift_card', 'license_key', 'external_access', 'bundle');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."license_key_status" AS ENUM('available', 'reserved', 'assigned', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "digital_access_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "digital_order_id" uuid NOT NULL,
  "action" "digital_access_action" NOT NULL,
  "actor_user_id" uuid,
  "ip_address" text,
  "user_agent" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "digital_bundle_items" (
  "bundle_product_id" uuid NOT NULL,
  "child_product_id" uuid NOT NULL,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "digital_bundle_items_bundle_product_id_child_product_id_pk" PRIMARY KEY("bundle_product_id","child_product_id")
);

CREATE TABLE IF NOT EXISTS "digital_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "digital_product_id" uuid NOT NULL,
  "file_name" text NOT NULL,
  "file_url" text NOT NULL,
  "file_size" integer NOT NULL,
  "file_type" text NOT NULL,
  "sort_order" integer DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "license_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "digital_product_id" uuid NOT NULL,
  "code" text NOT NULL,
  "status" "license_key_status" DEFAULT 'available' NOT NULL,
  "batch_label" text,
  "assigned_to_order_id" uuid,
  "assigned_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "digital_products" ALTER COLUMN "file_url" DROP NOT NULL;
ALTER TABLE "digital_products" ALTER COLUMN "file_name" DROP NOT NULL;
ALTER TABLE "digital_products" ALTER COLUMN "file_size" DROP NOT NULL;
ALTER TABLE "digital_products" ALTER COLUMN "file_type" DROP NOT NULL;

ALTER TABLE "digital_orders" ADD COLUMN IF NOT EXISTS "order_item_id" uuid;
ALTER TABLE "digital_orders" ADD COLUMN IF NOT EXISTS "license_key_id" uuid;
ALTER TABLE "digital_orders" ADD COLUMN IF NOT EXISTS "fulfillment_status" "digital_fulfillment_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "digital_orders" ADD COLUMN IF NOT EXISTS "last_accessed_at" timestamp with time zone;
ALTER TABLE "digital_orders" ADD COLUMN IF NOT EXISTS "revoked_at" timestamp with time zone;
ALTER TABLE "digital_orders" ADD COLUMN IF NOT EXISTS "revoked_reason" text;

ALTER TABLE "digital_products" ADD COLUMN IF NOT EXISTS "digital_type" "digital_product_type" DEFAULT 'digital_download' NOT NULL;
ALTER TABLE "digital_products" ADD COLUMN IF NOT EXISTS "delivery_method" "digital_delivery_method" DEFAULT 'automatic' NOT NULL;
ALTER TABLE "digital_products" ADD COLUMN IF NOT EXISTS "external_url" text;
ALTER TABLE "digital_products" ADD COLUMN IF NOT EXISTS "access_instructions" text;
ALTER TABLE "digital_products" ADD COLUMN IF NOT EXISTS "course_content" jsonb;
ALTER TABLE "digital_products" ADD COLUMN IF NOT EXISTS "requires_license_key" boolean DEFAULT false;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paid_at" timestamp with time zone;

DO $$ BEGIN
  ALTER TABLE "digital_access_logs" ADD CONSTRAINT "digital_access_logs_digital_order_id_digital_orders_id_fk" FOREIGN KEY ("digital_order_id") REFERENCES "public"."digital_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "digital_access_logs" ADD CONSTRAINT "digital_access_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "digital_bundle_items" ADD CONSTRAINT "digital_bundle_items_bundle_product_id_digital_products_id_fk" FOREIGN KEY ("bundle_product_id") REFERENCES "public"."digital_products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "digital_bundle_items" ADD CONSTRAINT "digital_bundle_items_child_product_id_digital_products_id_fk" FOREIGN KEY ("child_product_id") REFERENCES "public"."digital_products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "digital_files" ADD CONSTRAINT "digital_files_digital_product_id_digital_products_id_fk" FOREIGN KEY ("digital_product_id") REFERENCES "public"."digital_products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_digital_product_id_digital_products_id_fk" FOREIGN KEY ("digital_product_id") REFERENCES "public"."digital_products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_assigned_to_order_id_orders_id_fk" FOREIGN KEY ("assigned_to_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "digital_orders" ADD CONSTRAINT "digital_orders_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "digital_orders" ADD CONSTRAINT "digital_orders_license_key_id_license_keys_id_fk" FOREIGN KEY ("license_key_id") REFERENCES "public"."license_keys"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "digital_access_logs_digital_order_id_idx" ON "digital_access_logs" USING btree ("digital_order_id");
CREATE INDEX IF NOT EXISTS "digital_access_logs_action_idx" ON "digital_access_logs" USING btree ("action");
CREATE INDEX IF NOT EXISTS "digital_files_digital_product_id_idx" ON "digital_files" USING btree ("digital_product_id");
CREATE INDEX IF NOT EXISTS "license_keys_digital_product_id_idx" ON "license_keys" USING btree ("digital_product_id");
CREATE INDEX IF NOT EXISTS "license_keys_status_idx" ON "license_keys" USING btree ("status");
CREATE UNIQUE INDEX IF NOT EXISTS "license_keys_product_code_idx" ON "license_keys" USING btree ("digital_product_id","code");
CREATE INDEX IF NOT EXISTS "digital_orders_fulfillment_status_idx" ON "digital_orders" USING btree ("fulfillment_status");
CREATE INDEX IF NOT EXISTS "digital_products_digital_type_idx" ON "digital_products" USING btree ("digital_type");
