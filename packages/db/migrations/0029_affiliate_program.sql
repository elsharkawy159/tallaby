-- Tallaby Affiliate Program.
--
-- One affiliate per registered user, one permanent reusable 10%-off coupon per
-- affiliate. Attribution and the commission figures are snapshotted onto
-- affiliate_commissions at order-creation time (status 'pending') rather than
-- re-derived from the coupon later, so a future change to the coupon or
-- affiliate can never rewrite a historical commission.
--
-- Financial invariants enforced here, mirroring 0025_user_wallet.sql:
--   1. affiliate_commissions is append-only in effect: a reversal is a NEW row
--      (type='reversal'), never a mutation of the original commission.
--   2. Idempotency: at most one 'commission' row per order (partial unique
--      index), and at most one 'reversal' row per commission being reversed.
--      Together with user_wallet_transactions' own (type, reference_type,
--      reference_id) idempotency claim, a retried delivery/return event can
--      never double-credit or double-reverse the wallet.
--   3. commission_amount is always a positive magnitude; `type` carries the
--      direction. The wallet ledger is still the one place a signed amount is
--      stored (via postWalletTransaction's direction parameter).
--   4. RLS: owners may SELECT their own affiliate account and commissions and
--      nothing else. No insert/update/delete policy — every mutation goes
--      through server code connecting as the database owner, same posture as
--      the user wallet tables.
--
-- Written to be safely re-runnable, matching this project's convention (see
-- 0025's note that drizzle.__drizzle_migrations is out of sync with
-- migrations/meta).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $do$ BEGIN
	CREATE TYPE "public"."affiliate_status" AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN null; END $do$;--> statement-breakpoint

DO $do$ BEGIN
	CREATE TYPE "public"."affiliate_commission_type" AS ENUM ('commission', 'reversal');
EXCEPTION WHEN duplicate_object THEN null; END $do$;--> statement-breakpoint

DO $do$ BEGIN
	CREATE TYPE "public"."affiliate_commission_status" AS ENUM ('pending', 'earned', 'reversed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $do$;--> statement-breakpoint

-- Additive value on the existing user-wallet enum (0025 reserved 'commission'
-- for exactly this phase's earn side; this is the one new value needed for the
-- debit side of a reversed/returned affiliate order).
-- NOTE: like 0025's 'marketing' addition, this cannot be followed by a
-- statement that USES the new value in the same transaction. Nothing below
-- references it, so running this file as one script is safe.
ALTER TYPE "public"."wallet_transaction_type" ADD VALUE IF NOT EXISTS 'commission_reversal';--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- affiliates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "affiliates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"coupon_id" uuid NOT NULL,
	"status" "affiliate_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "affiliates_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "affiliates_coupon_id_unique" UNIQUE("coupon_id")
);--> statement-breakpoint

ALTER TABLE "affiliates" DROP CONSTRAINT IF EXISTS "affiliates_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliates" DROP CONSTRAINT IF EXISTS "affiliates_coupon_id_coupons_id_fk";--> statement-breakpoint
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "affiliates_status_idx" ON "affiliates" USING btree ("status");--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- affiliate_commissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "affiliate_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"affiliate_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"coupon_id" uuid NOT NULL,
	"type" "affiliate_commission_type" DEFAULT 'commission' NOT NULL,
	"status" "affiliate_commission_status" DEFAULT 'pending' NOT NULL,
	"order_eligible_amount" numeric(10, 2) NOT NULL,
	"shipping_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"commission_rate" real DEFAULT 0.1 NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"parent_commission_id" uuid,
	"wallet_transaction_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "affiliate_commissions_amount_positive" CHECK ("commission_amount" > 0),
	CONSTRAINT "affiliate_commissions_order_amount_non_negative" CHECK ("order_eligible_amount" >= 0),
	CONSTRAINT "affiliate_commissions_shipping_non_negative" CHECK ("shipping_amount" >= 0),
	CONSTRAINT "affiliate_commissions_reversal_has_parent" CHECK (("type" = 'reversal') = ("parent_commission_id" IS NOT NULL))
);--> statement-breakpoint

ALTER TABLE "affiliate_commissions" DROP CONSTRAINT IF EXISTS "affiliate_commissions_affiliate_id_affiliates_id_fk";--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_affiliate_id_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commissions" DROP CONSTRAINT IF EXISTS "affiliate_commissions_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commissions" DROP CONSTRAINT IF EXISTS "affiliate_commissions_order_id_orders_id_fk";--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commissions" DROP CONSTRAINT IF EXISTS "affiliate_commissions_coupon_id_coupons_id_fk";--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commissions" DROP CONSTRAINT IF EXISTS "affiliate_commissions_parent_commission_id_fk";--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_parent_commission_id_fk" FOREIGN KEY ("parent_commission_id") REFERENCES "public"."affiliate_commissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commissions" DROP CONSTRAINT IF EXISTS "affiliate_commissions_wallet_transaction_id_fk";--> statement-breakpoint
ALTER TABLE "affiliate_commissions" ADD CONSTRAINT "affiliate_commissions_wallet_transaction_id_fk" FOREIGN KEY ("wallet_transaction_id") REFERENCES "public"."user_wallet_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "affiliate_commissions_affiliate_id_idx" ON "affiliate_commissions" USING btree ("affiliate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_commissions_user_id_idx" ON "affiliate_commissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_commissions_order_id_idx" ON "affiliate_commissions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_commissions_status_idx" ON "affiliate_commissions" USING btree ("status");--> statement-breakpoint

-- Idempotency (invariant: "an order must never generate affiliate commission
-- more than once"): at most one 'commission' row per order...
CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_commissions_order_commission_idx" ON "affiliate_commissions" USING btree ("order_id") WHERE "type" = 'commission';--> statement-breakpoint
-- ...and at most one reversal per commission being reversed.
CREATE UNIQUE INDEX IF NOT EXISTS "affiliate_commissions_reversal_parent_idx" ON "affiliate_commissions" USING btree ("parent_commission_id") WHERE "type" = 'reversal';--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Row Level Security — SELECT-only, owner-scoped, same posture as the user
-- wallet tables (0025): no insert/update/delete policy anywhere, so the anon
-- key can read its own affiliate data and can do nothing else. Every mutation
-- goes through server code connecting as the database owner.
-- ---------------------------------------------------------------------------
ALTER TABLE "affiliates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "Users can read their own affiliate account" ON "affiliates";--> statement-breakpoint
CREATE POLICY "Users can read their own affiliate account" ON "affiliates"
	AS PERMISSIVE FOR SELECT TO "authenticated"
	USING ("user_id" = (SELECT auth.uid()));--> statement-breakpoint

ALTER TABLE "affiliate_commissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "Users can read their own affiliate commissions" ON "affiliate_commissions";--> statement-breakpoint
CREATE POLICY "Users can read their own affiliate commissions" ON "affiliate_commissions"
	AS PERMISSIVE FOR SELECT TO "authenticated"
	USING ("user_id" = (SELECT auth.uid()));
