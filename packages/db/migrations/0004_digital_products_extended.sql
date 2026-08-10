CREATE TYPE "public"."digital_access_action" AS ENUM('grant', 'download', 'view', 'resend', 'revoke', 'reinstate');--> statement-breakpoint
CREATE TYPE "public"."digital_delivery_method" AS ENUM('automatic', 'manual');--> statement-breakpoint
CREATE TYPE "public"."digital_fulfillment_status" AS ENUM('pending', 'delivered', 'downloaded', 'expired', 'revoked', 'failed');--> statement-breakpoint
CREATE TYPE "public"."digital_product_type" AS ENUM('digital_download', 'ebook', 'template', 'design_asset', 'audio', 'video', 'course', 'ai_prompt', 'software', 'font', 'printable', 'game_asset', 'gift_card', 'license_key', 'external_access', 'bundle');--> statement-breakpoint
CREATE TYPE "public"."license_key_status" AS ENUM('available', 'reserved', 'assigned', 'revoked');--> statement-breakpoint
CREATE TABLE "digital_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"digital_order_id" uuid NOT NULL,
	"action" "digital_access_action" NOT NULL,
	"actor_user_id" uuid,
	"ip_address" text,
	"user_agent" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "digital_bundle_items" (
	"bundle_product_id" uuid NOT NULL,
	"child_product_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "digital_bundle_items_bundle_product_id_child_product_id_pk" PRIMARY KEY("bundle_product_id","child_product_id")
);
--> statement-breakpoint
CREATE TABLE "digital_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"digital_product_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "license_keys" (
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
--> statement-breakpoint
ALTER TABLE "digital_products" ALTER COLUMN "file_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "digital_products" ALTER COLUMN "file_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "digital_products" ALTER COLUMN "file_size" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "digital_products" ALTER COLUMN "file_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "digital_orders" ADD COLUMN "order_item_id" uuid;--> statement-breakpoint
ALTER TABLE "digital_orders" ADD COLUMN "license_key_id" uuid;--> statement-breakpoint
ALTER TABLE "digital_orders" ADD COLUMN "fulfillment_status" "digital_fulfillment_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "digital_orders" ADD COLUMN "last_accessed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "digital_orders" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "digital_orders" ADD COLUMN "revoked_reason" text;--> statement-breakpoint
ALTER TABLE "digital_products" ADD COLUMN "digital_type" "digital_product_type" DEFAULT 'digital_download' NOT NULL;--> statement-breakpoint
ALTER TABLE "digital_products" ADD COLUMN "delivery_method" "digital_delivery_method" DEFAULT 'automatic' NOT NULL;--> statement-breakpoint
ALTER TABLE "digital_products" ADD COLUMN "external_url" text;--> statement-breakpoint
ALTER TABLE "digital_products" ADD COLUMN "access_instructions" text;--> statement-breakpoint
ALTER TABLE "digital_products" ADD COLUMN "course_content" jsonb;--> statement-breakpoint
ALTER TABLE "digital_products" ADD COLUMN "requires_license_key" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "digital_access_logs" ADD CONSTRAINT "digital_access_logs_digital_order_id_digital_orders_id_fk" FOREIGN KEY ("digital_order_id") REFERENCES "public"."digital_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_access_logs" ADD CONSTRAINT "digital_access_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_bundle_items" ADD CONSTRAINT "digital_bundle_items_bundle_product_id_digital_products_id_fk" FOREIGN KEY ("bundle_product_id") REFERENCES "public"."digital_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_bundle_items" ADD CONSTRAINT "digital_bundle_items_child_product_id_digital_products_id_fk" FOREIGN KEY ("child_product_id") REFERENCES "public"."digital_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_files" ADD CONSTRAINT "digital_files_digital_product_id_digital_products_id_fk" FOREIGN KEY ("digital_product_id") REFERENCES "public"."digital_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_digital_product_id_digital_products_id_fk" FOREIGN KEY ("digital_product_id") REFERENCES "public"."digital_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "license_keys" ADD CONSTRAINT "license_keys_assigned_to_order_id_orders_id_fk" FOREIGN KEY ("assigned_to_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "digital_access_logs_digital_order_id_idx" ON "digital_access_logs" USING btree ("digital_order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "digital_access_logs_action_idx" ON "digital_access_logs" USING btree ("action" enum_ops);--> statement-breakpoint
CREATE INDEX "digital_files_digital_product_id_idx" ON "digital_files" USING btree ("digital_product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "license_keys_digital_product_id_idx" ON "license_keys" USING btree ("digital_product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "license_keys_status_idx" ON "license_keys" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "license_keys_product_code_idx" ON "license_keys" USING btree ("digital_product_id" uuid_ops,"code" text_ops);--> statement-breakpoint
ALTER TABLE "digital_orders" ADD CONSTRAINT "digital_orders_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digital_orders" ADD CONSTRAINT "digital_orders_license_key_id_license_keys_id_fk" FOREIGN KEY ("license_key_id") REFERENCES "public"."license_keys"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "digital_orders_fulfillment_status_idx" ON "digital_orders" USING btree ("fulfillment_status" enum_ops);--> statement-breakpoint
CREATE INDEX "digital_products_digital_type_idx" ON "digital_products" USING btree ("digital_type" enum_ops);