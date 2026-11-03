-- 0136_billing_usd.sql (owner, 2026-11-03; ROADMAP.md F-56; design:
-- docs/superpowers/specs/2026-11-03-usd-wallet-and-plans-design.md)
--
-- Additive: nothing changes until billing_switch_to_usd() is called. Adds the
-- billing settings and exchange-rate history (server-only: RLS on, no policies),
-- what each top-up credits, and the one-time switch function.
-- Idempotent. Rollback before the switch: drop the function, the default and
-- the new table and columns.

BEGIN;

CREATE TABLE IF NOT EXISTS billing_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  usd_live boolean NOT NULL DEFAULT false,
  usd_live_at timestamptz,
  conversion_rate numeric(12, 4),
  margin_bps integer NOT NULL DEFAULT 200 CHECK (margin_bps BETWEEN 0 AND 2000),
  rate_override numeric(12, 4) CHECK (rate_override IS NULL OR rate_override > 0),
  tax_enabled boolean NOT NULL DEFAULT false,
  tax_rate_bps integer NOT NULL DEFAULT 1400 CHECK (tax_rate_bps BETWEEN 0 AND 5000),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL
);
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO billing_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_rate numeric(12, 4) NOT NULL CHECK (market_rate > 0),
  source text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS exchange_rates_fetched_idx ON exchange_rates (fetched_at DESC);

-- `amount` stays the EGP paid; these say what the wallet receives.
ALTER TABLE seller_wallet_top_ups
  ADD COLUMN IF NOT EXISTS credit_amount numeric(10, 2),
  ADD COLUMN IF NOT EXISTS credit_currency text,
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(12, 4),
  ADD COLUMN IF NOT EXISTS tax_amount numeric(10, 2);

-- The ledger and wallet may now hold USD (the EGP-only checks came from 0008).
ALTER TABLE seller_wallet DROP CONSTRAINT IF EXISTS seller_wallet_currency_egp_only;
ALTER TABLE seller_wallet DROP CONSTRAINT IF EXISTS seller_wallet_currency_store_wallet;
ALTER TABLE seller_wallet ADD CONSTRAINT seller_wallet_currency_store_wallet CHECK (currency IN ('EGP', 'USD'));
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_currency_egp_only;
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_currency_store_wallet;
ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_currency_store_wallet CHECK (currency IS NULL OR currency IN ('EGP', 'USD'));

-- The currency a brand new wallet starts in.
CREATE OR REPLACE FUNCTION billing_wallet_currency() RETURNS text
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT CASE WHEN coalesce((SELECT usd_live FROM billing_settings WHERE id), false) THEN 'USD' ELSE 'EGP' END
$$;
ALTER TABLE seller_wallet ALTER COLUMN currency SET DEFAULT billing_wallet_currency();

-- The one-time switch. One transaction: it all happens or none of it does.
-- p_market_rate is EGP per USD, with no margin (owner, 2026-11-03).
CREATE OR REPLACE FUNCTION billing_switch_to_usd(p_market_rate numeric)
RETURNS TABLE (wallets_converted integer, top_ups_priced integer)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  w record;
  usd numeric(10, 2);
  converted integer := 0;
  priced integer := 0;
BEGIN
  IF p_market_rate IS NULL OR p_market_rate < 10 OR p_market_rate > 500 THEN
    RAISE EXCEPTION 'billing_switch_to_usd: rate % looks wrong', p_market_rate;
  END IF;
  IF (SELECT usd_live FROM billing_settings WHERE id FOR UPDATE) THEN
    RAISE EXCEPTION 'billing_switch_to_usd: already switched';
  END IF;

  FOR w IN SELECT seller_id, balance, negative_limit FROM seller_wallet WHERE currency <> 'USD' FOR UPDATE LOOP
    usd := round(w.balance / p_market_rate, 2);
    IF w.balance <> 0 THEN
      INSERT INTO wallet_transactions
        (seller_id, type, amount, currency, description, reference_type, reference_id, balance_before, balance_after, metadata)
      VALUES
        (w.seller_id, 'adjustment', -w.balance, 'EGP', 'Wallet moved to USD', 'usd_conversion', w.seller_id || ':egp',
         w.balance, 0, jsonb_build_object('rate', p_market_rate));
    END IF;
    IF usd <> 0 THEN
      INSERT INTO wallet_transactions
        (seller_id, type, amount, currency, description, reference_type, reference_id, balance_before, balance_after, metadata)
      VALUES
        (w.seller_id, 'adjustment', usd, 'USD', 'Wallet moved to USD', 'usd_conversion', w.seller_id || ':usd',
         0, usd, jsonb_build_object('rate', p_market_rate));
    END IF;
    UPDATE seller_wallet
       SET balance = usd,
           currency = 'USD',
           negative_limit = CASE WHEN w.negative_limit IS NULL THEN NULL ELSE round(w.negative_limit / p_market_rate, 2) END,
           updated_at = now()
     WHERE seller_id = w.seller_id;
    UPDATE sellers SET wallet_balance = usd WHERE id = w.seller_id;
    converted := converted + 1;
  END LOOP;

  -- Pending top-ups have no USD price yet: market rate, no margin (owner).
  UPDATE seller_wallet_top_ups
     SET credit_amount = round(amount / p_market_rate, 2),
         credit_currency = 'USD',
         exchange_rate = p_market_rate,
         updated_at = now()
   WHERE status IN ('pending', 'processing') AND credit_amount IS NULL;
  GET DIAGNOSTICS priced = ROW_COUNT;

  -- Open gifts move with the wallet (billing_convert_open_gifts, 0137).
  PERFORM billing_convert_open_gifts(p_market_rate);

  -- Gifts and trials that haven't started end today (owner). Running ones finish.
  UPDATE sellers SET welcome_gift_eligible = false WHERE welcome_gift_eligible;
  UPDATE sellers SET fee_trial_eligible = false WHERE fee_trial_eligible AND fee_trial_started_at IS NULL;
  ALTER TABLE sellers ALTER COLUMN welcome_gift_eligible SET DEFAULT false;

  UPDATE billing_settings
     SET usd_live = true, usd_live_at = now(), conversion_rate = p_market_rate, updated_at = now()
   WHERE id;

  RETURN QUERY SELECT converted, priced;
END;
$$;
REVOKE ALL ON FUNCTION billing_switch_to_usd(numeric) FROM PUBLIC, anon, authenticated;

COMMIT;
