-- 0060_store_wallet.sql (PLAN.md §11.10, §13.4, P6-05)
--
-- Upgrades the existing seller ledger (seller_wallet + wallet_transactions)
-- into the store wallet: one signed wallet per seller account, shared by its
-- stores, that may go negative (fees are never refused). Nothing is dropped
-- or renamed. Balances change only through postStoreWalletEntry
-- (packages/db/src/wallet/store-wallet.ts).
--
-- Read-only pre-checks (run 2026-10-17 on staging before applying):
--   duplicate sale rows per (seller_id, order_id)            -> 0
--   seller_wallet.balance <> sellers.wallet_balance          -> 0
--   seller_wallet.balance <> sum(wallet_transactions.amount) -> 1 (seller
--     "Tallaby", 538.20 with no ledger rows). Owner decision: post an opening
--     balance adjustment, done in 0061 (a new enum value cannot be used in
--     the transaction that adds it).
--
-- Idempotent. ALTER TYPE ... ADD VALUE needs PG 12+ and must not be used in
-- the same transaction: run this file without an explicit BEGIN (psql -f), or
-- apply the enum block on its own first.

-- ---------------------------------------------------------------------------
-- 1. Entry types (existing: sale, refund, withdrawal, fee)
-- ---------------------------------------------------------------------------
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'top_up';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'service_charge';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'adjustment';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'fee_reversal';

-- ---------------------------------------------------------------------------
-- 2. One wallet row per seller; signed balance (no balance >= 0 CHECK)
-- ---------------------------------------------------------------------------
ALTER TABLE seller_wallet ADD COLUMN IF NOT EXISTS status wallet_status NOT NULL DEFAULT 'active';
-- NULL = no limit for optional purchases (D21; the default policy is P6-08).
ALTER TABLE seller_wallet ADD COLUMN IF NOT EXISTS negative_limit numeric(10,2);

DO $$ BEGIN
  ALTER TABLE seller_wallet ADD CONSTRAINT seller_wallet_negative_limit_check
    CHECK (negative_limit IS NULL OR negative_limit >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO seller_wallet (seller_id, balance, currency)
SELECT s.id, coalesce(s.wallet_balance, 0), 'EGP'
FROM sellers s
WHERE NOT EXISTS (SELECT 1 FROM seller_wallet w WHERE w.seller_id = s.id);

-- ---------------------------------------------------------------------------
-- 3. Ledger hardening
-- ---------------------------------------------------------------------------
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
-- 'order' | 'top_up' | 'ad_request' | 'theme' | 'payout' | 'admin'
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS reference_type text;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS reference_id text;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS balance_before numeric(10,2);
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS balance_after numeric(10,2);
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE wallet_transactions ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id) ON DELETE SET NULL;

DO $$ BEGIN
  ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_reference_pair_check
    CHECK ((reference_type IS NULL) = (reference_id IS NULL));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_balance_math_check
    CHECK (balance_before IS NULL OR balance_after = balance_before + amount);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_reference_once
  ON wallet_transactions (seller_id, type, reference_type, reference_id)
  WHERE reference_type IS NOT NULL;
-- Legacy rows (no reference): at most one sale per seller and order.
CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_sale_once
  ON wallet_transactions (seller_id, order_id)
  WHERE type = 'sale' AND reference_type IS NULL;
CREATE INDEX IF NOT EXISTS wallet_transactions_store_id_idx ON wallet_transactions (store_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_order_id_idx ON wallet_transactions (order_id);

-- Append-only. Allowed exceptions: FK "SET NULL" clean-ups of store_id and
-- created_by, and the cascade when the seller account itself is deleted.
CREATE OR REPLACE FUNCTION wallet_transactions_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (to_jsonb(NEW) - 'store_id' - 'created_by') = (to_jsonb(OLD) - 'store_id' - 'created_by')
       AND (NEW.store_id IS NULL OR NEW.store_id IS NOT DISTINCT FROM OLD.store_id)
       AND (NEW.created_by IS NULL OR NEW.created_by IS NOT DISTINCT FROM OLD.created_by) THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF NOT EXISTS (SELECT 1 FROM sellers WHERE id = OLD.seller_id) THEN
      RETURN OLD;
    END IF;
  END IF;
  RAISE EXCEPTION 'wallet_transactions is append-only; post a compensating entry instead of %', TG_OP
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS wallet_transactions_immutable ON wallet_transactions;
CREATE TRIGGER wallet_transactions_immutable
  BEFORE UPDATE OR DELETE ON wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION wallet_transactions_immutable();

-- An entry's store must belong to the entry's seller.
CREATE OR REPLACE FUNCTION wallet_transactions_store_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.store_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM stores WHERE id = NEW.store_id AND seller_id = NEW.seller_id) THEN
    RAISE EXCEPTION 'wallet_transactions: store % does not belong to seller %', NEW.store_id, NEW.seller_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS wallet_transactions_store_owner ON wallet_transactions;
CREATE TRIGGER wallet_transactions_store_owner
  BEFORE INSERT ON wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION wallet_transactions_store_owner();

-- ---------------------------------------------------------------------------
-- 4. Store-wallet top-ups (wallet_top_ups is bound to user_wallets)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seller_wallet_top_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'EGP' CHECK (currency = 'EGP'),
  status wallet_top_up_status NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'kashier',
  -- Kashier merchantOrderId "stopup_<uuid>"
  provider_reference text,
  provider_transaction_id text,
  transaction_id uuid REFERENCES wallet_transactions(id) ON DELETE SET NULL,
  failure_reason text,
  metadata jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS seller_wallet_top_ups_provider_txn
  ON seller_wallet_top_ups (provider, provider_transaction_id) WHERE provider_transaction_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS seller_wallet_top_ups_provider_ref
  ON seller_wallet_top_ups (provider, provider_reference) WHERE provider_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS seller_wallet_top_ups_seller_idx ON seller_wallet_top_ups (seller_id, created_at DESC);

ALTER TABLE seller_wallet_top_ups ENABLE ROW LEVEL SECURITY;

-- Rollback: DROP TABLE seller_wallet_top_ups; DROP TRIGGER wallet_transactions_store_owner,
--   wallet_transactions_immutable ON wallet_transactions; DROP FUNCTION for both; DROP the two
--   unique and two plain indexes; DROP the two CHECKs and the seven new wallet_transactions
--   columns; DROP seller_wallet negative_limit/status. Enum values cannot be removed (harmless).
