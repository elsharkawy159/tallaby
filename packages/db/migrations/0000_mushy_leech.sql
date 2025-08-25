-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."address_type" AS ENUM('shipping', 'billing', 'both');--> statement-breakpoint
CREATE TYPE "public"."coupon_type" AS ENUM('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping');--> statement-breakpoint
CREATE TYPE "public"."deal_type" AS ENUM('daily_deal', 'lightning_deal', 'deal_of_the_day', 'best_deal', 'clearance');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_type" AS ENUM('seller_fulfilled', 'platform_fulfilled', 'fba', 'digital');--> statement-breakpoint
CREATE TYPE "public"."item_condition" AS ENUM('new', 'renewed', 'refurbished', 'used_like_new', 'used_very_good', 'used_good', 'used_acceptable');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('order_update', 'shipment_update', 'price_drop', 'review_response', 'marketing');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'payment_processing', 'confirmed', 'shipping_soon', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'refund_requested', 'refunded', 'returned');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."promotion_type" AS ENUM('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping');--> statement-breakpoint
CREATE TYPE "public"."return_reason" AS ENUM('defective', 'damaged', 'wrong_item', 'not_as_described', 'better_price', 'no_longer_needed', 'unauthorized_purchase', 'other');--> statement-breakpoint
CREATE TYPE "public"."seller_status" AS ENUM('pending', 'approved', 'suspended', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."shipping_speed" AS ENUM('standard', 'expedited', 'priority', 'one_day', 'same_day');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'seller', 'admin', 'support', 'driver');--> statement-breakpoint
CREATE TABLE "review_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"seller_id" uuid,
	"comment" text NOT NULL,
	"is_anonymous" boolean DEFAULT false,
	"status" text DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "review_comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"seller_id" uuid NOT NULL,
	"listing_id" uuid,
	"sku" text NOT NULL,
	"product_name" text NOT NULL,
	"variant_name" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0',
	"shipping_cost" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"commission_rate" real NOT NULL,
	"seller_earning" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"condition" "item_condition" DEFAULT 'new',
	"fulfillment_type" "fulfillment_type" DEFAULT 'seller_fulfilled',
	"status" "order_status" DEFAULT 'pending',
	"is_reviewed" boolean DEFAULT false,
	"is_returned" boolean DEFAULT false,
	"is_refunded" boolean DEFAULT false,
	"refund_amount" numeric(10, 2),
	"refund_reason" text,
	"refunded_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text,
	"is_default" boolean DEFAULT false,
	"payment_data" jsonb,
	"nickname" text,
	"expiry_month" text,
	"expiry_year" text,
	"last4" text,
	"billing_address_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "payment_methods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rma_number" text,
	"status" text DEFAULT 'requested',
	"return_reason" "return_reason" NOT NULL,
	"return_type" text DEFAULT 'refund',
	"additional_details" text,
	"total_amount" numeric(10, 2) NOT NULL,
	"return_shipping_paid" boolean DEFAULT false,
	"return_shipping_label" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"received_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	CONSTRAINT "returns_rma_number_unique" UNIQUE("rma_number")
);
--> statement-breakpoint
ALTER TABLE "returns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"address_type" "address_type" DEFAULT 'both',
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"company" text,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_business_address" boolean DEFAULT false,
	"delivery_instructions" text,
	"access_code" text,
	"latitude" real,
	"longitude" real,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"avatar" text,
	"is_verified" boolean DEFAULT false,
	"is_suspended" boolean DEFAULT false,
	"last_login_at" timestamp with time zone,
	"timezone" text,
	"preferred_language" text DEFAULT 'en',
	"referral_code" text,
	"referred_by" uuid,
	"default_currency" text DEFAULT 'EGP',
	"receive_marketing_emails" boolean DEFAULT true,
	"has_two_factor_auth" boolean DEFAULT false,
	"two_factor_method" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "coupon_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"discount_amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "coupon_usage" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"tracking_number" text,
	"carrier" text,
	"service_level" text,
	"shipping_label_url" text,
	"package_weight" numeric(10, 2),
	"weight_unit" text DEFAULT 'kg',
	"dimensions" jsonb,
	"cost" numeric(10, 2) DEFAULT '0',
	"status" text DEFAULT 'pending',
	"estimated_delivery_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "shipments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text DEFAULT 'My Wishlist' NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"is_public" boolean DEFAULT false,
	"share_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "wishlists" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"description" text,
	"website" text,
	"is_verified" boolean DEFAULT false,
	"is_official" boolean DEFAULT false,
	"average_rating" real,
	"review_count" integer DEFAULT 0,
	"product_count" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" text,
	"status" text DEFAULT 'active',
	"currency" text DEFAULT 'USD',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"last_activity" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "carts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"method" text NOT NULL,
	"currency" text DEFAULT 'USD',
	"status" "payment_status" DEFAULT 'pending',
	"transaction_id" text,
	"payment_method_id" uuid,
	"payment_data" jsonb,
	"error_message" text,
	"authorized_at" timestamp with time zone,
	"captured_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"discount_type" "coupon_type" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"minimum_purchase" numeric(10, 2),
	"maximum_discount" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"is_one_time_use" boolean DEFAULT false,
	"usage_limit" integer,
	"usage_count" integer DEFAULT 0,
	"per_user_limit" integer,
	"applicable_to" jsonb,
	"exclude_items" jsonb,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "coupons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"return_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"reason" text NOT NULL,
	"refund_method" text NOT NULL,
	"status" text DEFAULT 'pending',
	"transaction_id" text,
	"notes" text,
	"refunded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "refunds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "seller_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"document_type" text NOT NULL,
	"file_url" text NOT NULL,
	"status" text DEFAULT 'pending',
	"notes" text,
	"expiry_date" date,
	"uploaded_at" timestamp with time zone DEFAULT now(),
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid
);
--> statement-breakpoint
ALTER TABLE "seller_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sellers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"business_name" text NOT NULL,
	"display_name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"logo_url" text,
	"banner_url" text,
	"tax_id" text,
	"business_type" text NOT NULL,
	"registration_number" text,
	"legal_address" jsonb NOT NULL,
	"status" "seller_status" DEFAULT 'pending',
	"verification_details" jsonb,
	"return_policy" text,
	"shipping_policy" text,
	"is_verified" boolean DEFAULT false,
	"approved_categories" jsonb,
	"support_email" text NOT NULL,
	"support_phone" text,
	"commission_rate" real DEFAULT 15 NOT NULL,
	"fee_structure" jsonb,
	"tax_information" jsonb,
	"payment_details" jsonb,
	"store_rating" real,
	"positive_rating_percent" real,
	"total_ratings" integer DEFAULT 0,
	"product_count" integer DEFAULT 0,
	"fulfillment_options" jsonb,
	"payout_schedule" text DEFAULT 'biweekly',
	"last_payout_date" timestamp with time zone,
	"last_payout_amount" numeric(10, 2),
	"wallet_balance" numeric(10, 2) DEFAULT '0',
	"stripe_account_id" text,
	"external_ids" jsonb,
	"seller_level" text DEFAULT 'standard',
	"join_date" timestamp with time zone DEFAULT now(),
	"seller_metrics" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sellers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "sellers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"device_name" text,
	"device_type" text,
	"last_ip" text,
	"last_user_agent" text,
	"last_location" jsonb,
	"is_trusted" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"last_used_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_devices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wishlist_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"added_at" timestamp with time zone DEFAULT now(),
	"notes" text,
	"quantity" integer DEFAULT 1,
	"priority" integer DEFAULT 0
);
--> statement-breakpoint
ALTER TABLE "wishlist_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"saved_for_later" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"variant" jsonb
);
--> statement-breakpoint
ALTER TABLE "cart_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"bullet_points" jsonb,
	"brand_id" uuid,
	"main_category_id" uuid NOT NULL,
	"average_rating" real,
	"review_count" integer DEFAULT 0,
	"total_questions" integer DEFAULT 0,
	"is_active" boolean DEFAULT false,
	"is_platform_choice" boolean DEFAULT false,
	"is_most_selling" boolean DEFAULT false,
	"tax_class" text DEFAULT 'standard',
	"meta_title" text,
	"meta_description" text,
	"meta_keywords" text,
	"search_keywords" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"images" jsonb,
	"seller_id" uuid NOT NULL,
	"sku" text NOT NULL,
	"condition" "item_condition" DEFAULT 'new',
	"condition_description" text,
	"quantity" integer DEFAULT 25 NOT NULL,
	"fulfillment_type" "fulfillment_type" DEFAULT 'seller_fulfilled',
	"handling_time" integer DEFAULT 1,
	"max_order_quantity" integer,
	"is_featured" boolean DEFAULT false,
	"dimensions" jsonb,
	"variants" jsonb,
	"price" jsonb,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"user_id" uuid NOT NULL,
	"cart_id" uuid,
	"subtotal" numeric(10, 2) NOT NULL,
	"shipping_cost" numeric(10, 2) DEFAULT '0',
	"tax" numeric(10, 2) DEFAULT '0',
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"gift_wrap_cost" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"status" "order_status" DEFAULT 'pending',
	"payment_status" "payment_status" DEFAULT 'pending',
	"payment_method" text NOT NULL,
	"shipping_address_id" uuid,
	"billing_address_id" uuid,
	"is_gift" boolean DEFAULT false,
	"gift_message" text,
	"coupon_code" text,
	"notes" text,
	"is_business_order" boolean DEFAULT false,
	"customer_ip" text,
	"customer_user_agent" text,
	"referral_source" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"processed_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"question" text NOT NULL,
	"is_anonymous" boolean DEFAULT false,
	"status" text DEFAULT 'pending',
	"vote_count" integer DEFAULT 0,
	"is_answered" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "product_questions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "seller_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"fee" numeric(10, 2) DEFAULT '0',
	"tax_withheld" numeric(10, 2) DEFAULT '0',
	"net_amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD',
	"status" text DEFAULT 'pending',
	"method" text NOT NULL,
	"reference" text,
	"destination_account" jsonb,
	"scheduled_for" timestamp with time zone NOT NULL,
	"processed_at" timestamp with time zone,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"order_count" integer NOT NULL,
	"statement_url" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "seller_payouts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"image_url" text,
	"icon_url" text,
	"level" integer DEFAULT 1 NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"show_in_menu" boolean DEFAULT true,
	"show_in_home_slider" boolean DEFAULT false,
	"meta_title" text,
	"meta_description" text,
	"meta_keywords" text,
	"attributes" jsonb,
	"commission_rate" real,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"driver_id" uuid,
	"status" text DEFAULT 'pending',
	"delivery_notes" text,
	"attempt_count" integer DEFAULT 0,
	"recipient_name" text,
	"proof_of_delivery" jsonb,
	"received_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"seller_id" uuid,
	"answer" text NOT NULL,
	"is_anonymous" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"vote_count" integer DEFAULT 0,
	"status" text DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "product_answers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "review_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"is_helpful" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "review_votes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "return_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"reason" "return_reason" NOT NULL,
	"condition" text NOT NULL,
	"details" text,
	"refund_amount" numeric(10, 2),
	"status" text DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "return_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "search_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" text,
	"query" text NOT NULL,
	"filters" jsonb,
	"sort" text,
	"result_count" integer,
	"clicked_product_id" uuid,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "search_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid,
	"seller_id" uuid,
	"order_id" uuid,
	"order_item_id" uuid,
	"rating" integer NOT NULL,
	"title" text,
	"comment" text,
	"images" jsonb,
	"is_verified_purchase" boolean DEFAULT false,
	"is_anonymous" boolean DEFAULT false,
	"status" text DEFAULT 'pending',
	"helpful_count" integer DEFAULT 0,
	"unhelpful_count" integer DEFAULT 0,
	"report_count" integer DEFAULT 0,
	"review_type" text DEFAULT 'product',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "shipment_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "shipment_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "seller_payout_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payout_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"commission" numeric(10, 2) NOT NULL,
	"refund" numeric(10, 2) DEFAULT '0',
	"net_amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "seller_payout_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_categories" (
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false,
	CONSTRAINT "product_categories_product_id_category_id_pk" PRIMARY KEY("product_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "product_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_billing_address_id_user_addresses_id_fk" FOREIGN KEY ("billing_address_id") REFERENCES "public"."user_addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_users_id_fk" FOREIGN KEY ("referred_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_refunded_by_users_id_fk" FOREIGN KEY ("refunded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_return_id_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_documents" ADD CONSTRAINT "seller_documents_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_documents" ADD CONSTRAINT "seller_documents_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_wishlists_id_fk" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_main_category_id_categories_id_fk" FOREIGN KEY ("main_category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_billing_address_id_user_addresses_id_fk" FOREIGN KEY ("billing_address_id") REFERENCES "public"."user_addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_user_addresses_id_fk" FOREIGN KEY ("shipping_address_id") REFERENCES "public"."user_addresses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_payouts" ADD CONSTRAINT "seller_payouts_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_answers" ADD CONSTRAINT "product_answers_question_id_product_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."product_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_answers" ADD CONSTRAINT "product_answers_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_answers" ADD CONSTRAINT "product_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_id_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."returns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_clicked_product_id_products_id_fk" FOREIGN KEY ("clicked_product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_payout_items" ADD CONSTRAINT "seller_payout_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_payout_items" ADD CONSTRAINT "seller_payout_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_payout_items" ADD CONSTRAINT "seller_payout_items_payout_id_seller_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."seller_payouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_comments_review_id_idx" ON "review_comments" USING btree ("review_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "order_items_seller_id_idx" ON "order_items" USING btree ("seller_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "order_items_status_idx" ON "order_items" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "payment_methods_user_id_idx" ON "payment_methods" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "return_order_id_idx" ON "returns" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "return_status_idx" ON "returns" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "return_user_id_idx" ON "returns" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "address_user_id_idx" ON "user_addresses" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "user_name_idx" ON "users" USING btree ("full_name" text_ops);--> statement-breakpoint
CREATE INDEX "coupon_usage_coupon_id_idx" ON "coupon_usage" USING btree ("coupon_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "coupon_usage_user_id_idx" ON "coupon_usage" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "shipment_order_id_idx" ON "shipments" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "shipment_seller_id_idx" ON "shipments" USING btree ("seller_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "shipment_tracking_number_idx" ON "shipments" USING btree ("tracking_number" text_ops);--> statement-breakpoint
CREATE INDEX "wishlist_user_id_idx" ON "wishlists" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "brand_name_idx" ON "brands" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "brand_slug_idx" ON "brands" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "cart_session_id_idx" ON "carts" USING btree ("session_id" text_ops);--> statement-breakpoint
CREATE INDEX "cart_user_id_idx" ON "carts" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "payment_order_id_idx" ON "payments" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payments" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "coupon_code_idx" ON "coupons" USING btree ("code" text_ops);--> statement-breakpoint
CREATE INDEX "coupon_seller_id_idx" ON "coupons" USING btree ("seller_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "refund_order_id_idx" ON "refunds" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "refund_return_id_idx" ON "refunds" USING btree ("return_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "seller_docs_seller_id_idx" ON "seller_documents" USING btree ("seller_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "seller_business_name_idx" ON "sellers" USING btree ("business_name" text_ops);--> statement-breakpoint
CREATE INDEX "seller_display_name_idx" ON "sellers" USING btree ("display_name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "seller_slug_idx" ON "sellers" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "user_devices_device_id_idx" ON "user_devices" USING btree ("device_id" text_ops);--> statement-breakpoint
CREATE INDEX "user_devices_user_id_idx" ON "user_devices" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "unique_wishlist_item_idx" ON "wishlist_items" USING btree ("wishlist_id" uuid_ops,"product_id" uuid_ops,"variant_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "wishlist_items_product_id_idx" ON "wishlist_items" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "wishlist_items_wishlist_id_idx" ON "wishlist_items" USING btree ("wishlist_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items" USING btree ("cart_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "cart_items_product_id_idx" ON "cart_items" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "cart_items_seller_id_idx" ON "cart_items" USING btree ("seller_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "product_brand_id_idx" ON "products" USING btree ("brand_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "product_main_category_id_idx" ON "products" USING btree ("main_category_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "product_seller_id_idx" ON "products" USING btree ("seller_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "product_sku_idx" ON "products" USING btree ("sku" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "product_slug_idx" ON "products" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "product_title_idx" ON "products" USING btree ("title" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "unique_product_seller_sku_idx" ON "products" USING btree ("seller_id" text_ops,"sku" text_ops);--> statement-breakpoint
CREATE INDEX "order_number_idx" ON "orders" USING btree ("order_number" text_ops);--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "orders" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "order_user_id_idx" ON "orders" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "question_product_id_idx" ON "product_questions" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "question_user_id_idx" ON "product_questions" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "payouts_seller_id_idx" ON "seller_payouts" USING btree ("seller_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "payouts_status_idx" ON "seller_payouts" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "category_name_idx" ON "categories" USING btree ("name" text_ops);--> statement-breakpoint
CREATE INDEX "category_parent_id_idx" ON "categories" USING btree ("parent_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "category_slug_idx" ON "categories" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "delivery_driver_id_idx" ON "deliveries" USING btree ("driver_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "delivery_shipment_id_idx" ON "deliveries" USING btree ("shipment_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "notification_type_idx" ON "notifications" USING btree ("type" enum_ops);--> statement-breakpoint
CREATE INDEX "notification_user_id_idx" ON "notifications" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "answer_question_id_idx" ON "product_answers" USING btree ("question_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "answer_user_id_idx" ON "product_answers" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "review_vote_user_idx" ON "review_votes" USING btree ("review_id" uuid_ops,"user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "review_votes_review_id_idx" ON "review_votes" USING btree ("review_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "return_items_order_item_id_idx" ON "return_items" USING btree ("order_item_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "return_items_return_id_idx" ON "return_items" USING btree ("return_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "search_logs_created_at_idx" ON "search_logs" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "search_logs_query_idx" ON "search_logs" USING btree ("query" text_ops);--> statement-breakpoint
CREATE INDEX "search_logs_user_id_idx" ON "search_logs" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "review_product_id_idx" ON "reviews" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "review_seller_id_idx" ON "reviews" USING btree ("seller_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "review_user_id_idx" ON "reviews" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "shipment_items_order_item_id_idx" ON "shipment_items" USING btree ("order_item_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "shipment_items_shipment_id_idx" ON "shipment_items" USING btree ("shipment_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "payout_items_order_id_idx" ON "seller_payout_items" USING btree ("order_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "payout_items_payout_id_idx" ON "seller_payout_items" USING btree ("payout_id" uuid_ops);--> statement-breakpoint
CREATE POLICY "Enable insert for authenticated users only" ON "users" AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = id));--> statement-breakpoint
CREATE POLICY "Users can update own profile" ON "users" AS PERMISSIVE FOR UPDATE TO public;--> statement-breakpoint
CREATE POLICY "Users can view own profile" ON "users" AS PERMISSIVE FOR SELECT TO public;--> statement-breakpoint
CREATE POLICY "Users can manage own profile" ON "users" AS PERMISSIVE FOR ALL TO "authenticated";--> statement-breakpoint
CREATE POLICY "Admins can view all users" ON "users" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Allow authenticated read access" ON "products" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Allow authenticated insert access" ON "products" AS PERMISSIVE FOR INSERT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Public full access" ON "products" AS PERMISSIVE FOR ALL TO public;--> statement-breakpoint
CREATE POLICY "Users can view their own rows" ON "orders" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = auth.uid()));--> statement-breakpoint
CREATE POLICY "Users can insert their own rows" ON "orders" AS PERMISSIVE FOR INSERT TO "authenticated";
*/