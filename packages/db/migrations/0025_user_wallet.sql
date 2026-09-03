-- Centralized user wallet: one wallet per non-guest user, with a transaction
-- ledger as the source of truth for every balance movement.
--
-- Scope note: this is deliberately SEPARATE from the pre-existing seller wallet
-- (seller_wallet / wallet_transactions / sellers.wallet_balance). That system
-- stays untouched; converging the two is a later phase.
--
-- Financial invariants enforced here:
--   1. user_wallet_transactions is append-only and is the source of truth.
--      user_wallets.balance is a running total that only the atomic ledger
--      primitive (packages/db/src/wallet/user-wallet.ts) may move.
--   2. available = balance - reserved_balance. A pending payout RESERVES funds;
--      it never deducts them. Only completion debits.
--   3. balance >= 0, reserved_balance >= 0, reserved_balance <= balance. These
--      CHECKs are the last line of defence behind the atomic UPDATE ... WHERE
--      guard, exactly as products_quantity_non_negative (0007) is for stock.
--   4. balance_after = balance_before + amount, checked by the database.
--   5. (type, reference_type, reference_id) is a unique idempotency claim - the
--      same top-up or payout event cannot be applied twice. Same idiom as
--      email_deliveries_type_reference_idx (0024).
--   6. RLS: owners may SELECT their own rows and nothing else. There is NO
--      insert/update/delete policy on any of these tables, so the anon key can
--      never write a financial row. Server code reaches them through Drizzle as
--      the database owner, the same posture 0021 documents for shipments.
--
-- Every statement is written to be safely re-runnable, matching 0009/0011/0017/
-- 0021's convention - this project's drizzle.__drizzle_migrations table is out
-- of sync with migrations/meta.

-- ---------------------------------------------------------------------------
-- Roles
--
-- Riders map onto the existing 'driver' value. 'marketing' is new and is the
-- second payout-eligible role. Additive enum value: existing rows and readers
-- of user_role are unaffected.
--
-- NOTE: ALTER TYPE ... ADD VALUE cannot be followed by a statement that USES
-- the new value inside the same transaction. Nothing below references
-- 'marketing', so running this file as one script is safe. If your client still
-- objects, run this single statement on its own first.
-- ---------------------------------------------------------------------------
ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'marketing';--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Enums
--
-- CREATE TYPE has no IF NOT EXISTS, hence the duplicate_object guard.
-- The transaction types are deliberately broader than what phase 1 writes:
-- commission / order_payment are reserved for the next phases so the ledger
-- never needs a breaking change to accept them.
-- ---------------------------------------------------------------------------
DO $do$ BEGIN
	CREATE TYPE "public"."wallet_status" AS ENUM ('active', 'frozen', 'closed');
EXCEPTION WHEN duplicate_object THEN null; END $do$;--> statement-breakpoint

DO $do$ BEGIN
	CREATE TYPE "public"."wallet_transaction_type" AS ENUM ('top_up', 'payout', 'commission', 'order_payment', 'refund', 'adjustment', 'bonus');
EXCEPTION WHEN duplicate_object THEN null; END $do$;--> statement-breakpoint

DO $do$ BEGIN
	CREATE TYPE "public"."wallet_transaction_status" AS ENUM ('pending', 'completed', 'failed', 'reversed');
EXCEPTION WHEN duplicate_object THEN null; END $do$;--> statement-breakpoint

DO $do$ BEGIN
	CREATE TYPE "public"."wallet_top_up_status" AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $do$;--> statement-breakpoint

DO $do$ BEGIN
	CREATE TYPE "public"."wallet_payout_status" AS ENUM ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $do$;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- user_wallets
--
-- Money is numeric(10,2) throughout, matching every other money column in this
-- schema (and read back as a string by postgres-js - never a JS float).
-- currency is pinned to EGP by CHECK, matching 0008_egp_only_currency.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"reserved_balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'EGP' NOT NULL,
	"status" "wallet_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_wallets_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_wallets_balance_non_negative" CHECK ("balance" >= 0),
	CONSTRAINT "user_wallets_reserved_non_negative" CHECK ("reserved_balance" >= 0),
	CONSTRAINT "user_wallets_reserved_within_balance" CHECK ("reserved_balance" <= "balance"),
	CONSTRAINT "user_wallets_currency_egp" CHECK ("currency" = 'EGP')
);--> statement-breakpoint

ALTER TABLE "user_wallets" DROP CONSTRAINT IF EXISTS "user_wallets_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "user_wallets_status_idx" ON "user_wallets" USING btree ("status");--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- user_wallet_transactions - the ledger
--
-- `amount` is SIGNED: positive credits, negative debits. `direction` is a
-- generated mirror of that sign so admin filters and reports do not have to
-- re-derive it. balance_before/balance_after are written by the ledger
-- primitive from the atomic UPDATE's RETURNING value, so they are always the
-- true pre/post figures rather than a re-read.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user_wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "wallet_transaction_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"direction" text GENERATED ALWAYS AS (CASE WHEN "amount" >= 0 THEN 'credit'::text ELSE 'debit'::text END) STORED,
	"balance_before" numeric(10, 2) NOT NULL,
	"balance_after" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'EGP' NOT NULL,
	"status" "wallet_transaction_status" DEFAULT 'completed' NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_wallet_tx_amount_non_zero" CHECK ("amount" <> 0),
	CONSTRAINT "user_wallet_tx_balance_arithmetic" CHECK ("balance_after" = "balance_before" + "amount"),
	CONSTRAINT "user_wallet_tx_balance_non_negative" CHECK ("balance_after" >= 0),
	CONSTRAINT "user_wallet_tx_currency_egp" CHECK ("currency" = 'EGP'),
	-- The idempotency index below is on (type, reference_type, reference_id),
	-- and NULLs compare as distinct in a unique index. A row carrying a
	-- reference_id but no reference_type would therefore never conflict with
	-- anything, silently disabling the duplicate guard. Force the two to travel
	-- together so that cannot happen.
	CONSTRAINT "user_wallet_tx_reference_pair" CHECK (("reference_id" IS NULL) = ("reference_type" IS NULL))
);--> statement-breakpoint

ALTER TABLE "user_wallet_transactions" DROP CONSTRAINT IF EXISTS "user_wallet_transactions_wallet_id_user_wallets_id_fk";--> statement-breakpoint
ALTER TABLE "user_wallet_transactions" ADD CONSTRAINT "user_wallet_transactions_wallet_id_user_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."user_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wallet_transactions" DROP CONSTRAINT IF EXISTS "user_wallet_transactions_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "user_wallet_transactions" ADD CONSTRAINT "user_wallet_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- The idempotency claim (invariant 5). An insert that conflicts means the same
-- domain event was already applied, so a webhook retry, a double-submit or a
-- concurrent worker cannot credit the wallet twice.
CREATE UNIQUE INDEX IF NOT EXISTS "user_wallet_tx_reference_idx" ON "user_wallet_transactions" USING btree ("type", "reference_type", "reference_id") WHERE "reference_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_wallet_tx_wallet_created_idx" ON "user_wallet_transactions" USING btree ("wallet_id", "created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_wallet_tx_user_created_idx" ON "user_wallet_transactions" USING btree ("user_id", "created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_wallet_tx_type_idx" ON "user_wallet_transactions" USING btree ("type");--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- wallet_top_ups
--
-- A top-up row is created BEFORE the buyer is sent to the provider, and is only
-- ever moved to 'succeeded' by a signature-verified provider webhook. There is
-- deliberately no path that lets a client assert its own top-up succeeded.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "wallet_top_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'EGP' NOT NULL,
	"status" "wallet_top_up_status" DEFAULT 'pending' NOT NULL,
	"provider" text DEFAULT 'paymob' NOT NULL,
	"provider_reference" text,
	"provider_transaction_id" text,
	"transaction_id" uuid,
	"failure_reason" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_top_ups_amount_positive" CHECK ("amount" > 0),
	CONSTRAINT "wallet_top_ups_currency_egp" CHECK ("currency" = 'EGP')
);--> statement-breakpoint

ALTER TABLE "wallet_top_ups" DROP CONSTRAINT IF EXISTS "wallet_top_ups_wallet_id_user_wallets_id_fk";--> statement-breakpoint
ALTER TABLE "wallet_top_ups" ADD CONSTRAINT "wallet_top_ups_wallet_id_user_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."user_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_top_ups" DROP CONSTRAINT IF EXISTS "wallet_top_ups_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "wallet_top_ups" ADD CONSTRAINT "wallet_top_ups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_top_ups" DROP CONSTRAINT IF EXISTS "wallet_top_ups_transaction_id_fk";--> statement-breakpoint
ALTER TABLE "wallet_top_ups" ADD CONSTRAINT "wallet_top_ups_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."user_wallet_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Second, independent replay guard: one provider transaction can back at most
-- one top-up row. (The ledger's reference index is the first.)
CREATE UNIQUE INDEX IF NOT EXISTS "wallet_top_ups_provider_txn_idx" ON "wallet_top_ups" USING btree ("provider", "provider_transaction_id") WHERE "provider_transaction_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_top_ups_user_created_idx" ON "wallet_top_ups" USING btree ("user_id", "created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_top_ups_status_idx" ON "wallet_top_ups" USING btree ("status");--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- wallet_payout_requests
--
-- Creating a request reserves funds, it does not deduct them; only 'completed'
-- writes a debit to the ledger. Rejection/cancellation/failure releases the
-- reservation. See packages/db/src/wallet/user-wallet.ts.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "wallet_payout_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'EGP' NOT NULL,
	"status" "wallet_payout_status" DEFAULT 'pending' NOT NULL,
	"method" text NOT NULL,
	"destination" jsonb,
	"admin_notes" text,
	"rejection_reason" text,
	"external_reference" text,
	"transaction_id" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_payout_requests_amount_positive" CHECK ("amount" > 0),
	CONSTRAINT "wallet_payout_requests_currency_egp" CHECK ("currency" = 'EGP')
);--> statement-breakpoint

ALTER TABLE "wallet_payout_requests" DROP CONSTRAINT IF EXISTS "wallet_payout_requests_wallet_id_fk";--> statement-breakpoint
ALTER TABLE "wallet_payout_requests" ADD CONSTRAINT "wallet_payout_requests_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."user_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_payout_requests" DROP CONSTRAINT IF EXISTS "wallet_payout_requests_user_id_fk";--> statement-breakpoint
ALTER TABLE "wallet_payout_requests" ADD CONSTRAINT "wallet_payout_requests_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_payout_requests" DROP CONSTRAINT IF EXISTS "wallet_payout_requests_reviewed_by_fk";--> statement-breakpoint
ALTER TABLE "wallet_payout_requests" ADD CONSTRAINT "wallet_payout_requests_reviewed_by_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_payout_requests" DROP CONSTRAINT IF EXISTS "wallet_payout_requests_transaction_id_fk";--> statement-breakpoint
ALTER TABLE "wallet_payout_requests" ADD CONSTRAINT "wallet_payout_requests_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."user_wallet_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- At most one open request per user. Without this, a user could stack requests
-- until the sum exceeded their balance even though each one individually
-- reserved successfully.
CREATE UNIQUE INDEX IF NOT EXISTS "wallet_payout_open_request_idx" ON "wallet_payout_requests" USING btree ("user_id") WHERE "status" IN ('pending', 'approved', 'processing');--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_payout_requests_user_created_idx" ON "wallet_payout_requests" USING btree ("user_id", "created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_payout_requests_status_idx" ON "wallet_payout_requests" USING btree ("status");--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Ledger immutability (invariant: append-only)
--
-- A financial ledger that can be edited in place is not an audit trail. Status
-- corrections are made by posting a compensating 'reversed'/'adjustment' row,
-- never by rewriting history.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_wallet_transactions_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
	RAISE EXCEPTION 'user_wallet_transactions is append-only; post a compensating transaction instead of %', TG_OP
		USING ERRCODE = 'restrict_violation';
END;
$fn$;--> statement-breakpoint

DROP TRIGGER IF EXISTS "user_wallet_transactions_immutable" ON "user_wallet_transactions";--> statement-breakpoint
CREATE TRIGGER "user_wallet_transactions_immutable"
	BEFORE UPDATE OR DELETE ON "user_wallet_transactions"
	FOR EACH ROW EXECUTE FUNCTION public.user_wallet_transactions_immutable();--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Wallet provisioning
--
-- Every non-guest user gets exactly one wallet. Guests deliberately get none -
-- a guest row is a checkout artefact, not an account that can hold money; the
-- wallet is created when the guest converts (is_guest flips to false).
--
-- SECURITY DEFINER + SET search_path = '' mirrors handle_new_user().
-- packages/db/src/wallet/user-wallet.ts also exposes getOrCreateUserWallet() as
-- an application-side backstop for rows that predate this trigger.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_user_wallet_provision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $fn$
BEGIN
	IF NEW.is_guest IS TRUE THEN
		RETURN NEW;
	END IF;

	INSERT INTO public.user_wallets (user_id)
	VALUES (NEW.id)
	ON CONFLICT (user_id) DO NOTHING;

	RETURN NEW;
END;
$fn$;--> statement-breakpoint

DROP TRIGGER IF EXISTS "users_provision_wallet_on_insert" ON "users";--> statement-breakpoint
CREATE TRIGGER "users_provision_wallet_on_insert"
	AFTER INSERT ON "users"
	FOR EACH ROW EXECUTE FUNCTION public.handle_user_wallet_provision();--> statement-breakpoint

DROP TRIGGER IF EXISTS "users_provision_wallet_on_guest_conversion" ON "users";--> statement-breakpoint
CREATE TRIGGER "users_provision_wallet_on_guest_conversion"
	AFTER UPDATE OF "is_guest" ON "users"
	FOR EACH ROW WHEN (OLD."is_guest" IS DISTINCT FROM NEW."is_guest" AND NEW."is_guest" IS FALSE)
	EXECUTE FUNCTION public.handle_user_wallet_provision();--> statement-breakpoint

-- Backfill for users that already exist.
INSERT INTO "user_wallets" ("user_id")
SELECT "id" FROM "users" WHERE "is_guest" IS FALSE
ON CONFLICT ("user_id") DO NOTHING;--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- SELECT-only, owner-scoped. There is intentionally NO insert/update/delete
-- policy on any wallet table: a client holding the anon key can read its own
-- balance and history and can do nothing else. Every mutation goes through
-- server-side code connecting as the database owner, which bypasses RLS and
-- performs its own authorization (see the wallet server actions).
--
-- (SELECT auth.uid()) rather than auth.uid() so the initplan is evaluated once
-- per query instead of once per row - the pattern 0021 uses.
-- ---------------------------------------------------------------------------
ALTER TABLE "user_wallets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "Users can read their own wallet" ON "user_wallets";--> statement-breakpoint
CREATE POLICY "Users can read their own wallet" ON "user_wallets"
	AS PERMISSIVE FOR SELECT TO "authenticated"
	USING ("user_id" = (SELECT auth.uid()));--> statement-breakpoint

ALTER TABLE "user_wallet_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "Users can read their own wallet transactions" ON "user_wallet_transactions";--> statement-breakpoint
CREATE POLICY "Users can read their own wallet transactions" ON "user_wallet_transactions"
	AS PERMISSIVE FOR SELECT TO "authenticated"
	USING ("user_id" = (SELECT auth.uid()));--> statement-breakpoint

ALTER TABLE "wallet_top_ups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "Users can read their own top ups" ON "wallet_top_ups";--> statement-breakpoint
CREATE POLICY "Users can read their own top ups" ON "wallet_top_ups"
	AS PERMISSIVE FOR SELECT TO "authenticated"
	USING ("user_id" = (SELECT auth.uid()));--> statement-breakpoint

ALTER TABLE "wallet_payout_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "Users can read their own payout requests" ON "wallet_payout_requests";--> statement-breakpoint
CREATE POLICY "Users can read their own payout requests" ON "wallet_payout_requests"
	AS PERMISSIVE FOR SELECT TO "authenticated"
	USING ("user_id" = (SELECT auth.uid()));
