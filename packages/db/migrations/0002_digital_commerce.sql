CREATE TYPE "public"."transaction_type" AS ENUM('sale', 'refund', 'withdrawal', 'fee');
--> statement-breakpoint
CREATE TABLE "digital_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"digital_product_id" uuid NOT NULL,
	"buyer_id" uuid NOT NULL,
	"download_token" text NOT NULL,
	"download_count" integer DEFAULT 0,
	"max_downloads" integer DEFAULT 5,
	"expires_at" timestamp with time zone,
	"downloaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);

--> statement-breakpoint
CREATE TABLE "digital_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" text NOT NULL,
	"download_limit" integer DEFAULT 5,
	"download_expiry_hours" integer DEFAULT 72,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'EGP',
	"status" text DEFAULT 'draft',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

--> statement-breakpoint
CREATE TABLE "seller_categories" (
	"seller_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "seller_categories_seller_id_category_id_pk" PRIMARY KEY("seller_id","category_id")
);

--> statement-breakpoint
CREATE TABLE "seller_wallet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'EGP' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);

--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'EGP',
	"stripe_transfer_id" text,
	"order_id" uuid,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now()
);

--> statement-breakpoint
ALTER TABLE "digital_orders" ADD CONSTRAINT "digital_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "digital_orders" ADD CONSTRAINT "digital_orders_digital_product_id_digital_products_id_fk" FOREIGN KEY ("digital_product_id") REFERENCES "public"."digital_products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "digital_orders" ADD CONSTRAINT "digital_orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "digital_products" ADD CONSTRAINT "digital_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "digital_products" ADD CONSTRAINT "digital_products_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "seller_categories" ADD CONSTRAINT "seller_categories_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "seller_categories" ADD CONSTRAINT "seller_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "seller_wallet" ADD CONSTRAINT "seller_wallet_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "digital_orders_download_token_idx" ON "digital_orders" USING btree ("download_token" text_ops);
--> statement-breakpoint
CREATE INDEX "digital_orders_order_id_idx" ON "digital_orders" USING btree ("order_id" uuid_ops);
--> statement-breakpoint
CREATE INDEX "digital_orders_buyer_id_idx" ON "digital_orders" USING btree ("buyer_id" uuid_ops);
--> statement-breakpoint
CREATE INDEX "digital_products_product_id_idx" ON "digital_products" USING btree ("product_id" uuid_ops);
--> statement-breakpoint
CREATE INDEX "digital_products_seller_id_idx" ON "digital_products" USING btree ("seller_id" uuid_ops);
--> statement-breakpoint
CREATE UNIQUE INDEX "seller_wallet_seller_id_idx" ON "seller_wallet" USING btree ("seller_id" uuid_ops);
--> statement-breakpoint
CREATE INDEX "wallet_transactions_seller_id_idx" ON "wallet_transactions" USING btree ("seller_id" uuid_ops);
--> statement-breakpoint
CREATE INDEX "wallet_transactions_type_idx" ON "wallet_transactions" USING btree ("type" enum_ops);
