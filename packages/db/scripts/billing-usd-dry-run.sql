-- Read-only report before billing_switch_to_usd (ROADMAP.md F-56a). Set the rate
-- on the first line. Changes nothing, on any database.
WITH params AS (SELECT 50.0::numeric AS rate),
wallets AS (
  SELECT w.seller_id, w.balance, round(w.balance / p.rate, 2) AS usd
  FROM seller_wallet w CROSS JOIN params p
  WHERE w.currency <> 'USD'
),
old_sales AS (
  SELECT t.seller_id, sum(t.amount) AS sale_total
  FROM wallet_transactions t
  WHERE t.type = 'sale' AND coalesce(t.currency, 'EGP') = 'EGP'
  GROUP BY 1
)
SELECT
  (SELECT count(*) FROM wallets) AS wallets,
  (SELECT count(*) FROM wallets WHERE balance > 0) AS positive_wallets,
  (SELECT count(*) FROM wallets WHERE balance < 0) AS negative_wallets,
  (SELECT coalesce(sum(balance) FILTER (WHERE balance > 0), 0) FROM wallets) AS positive_egp,
  (SELECT coalesce(sum(balance) FILTER (WHERE balance < 0), 0) FROM wallets) AS negative_egp,
  (SELECT coalesce(sum(usd) FILTER (WHERE usd > 0), 0) FROM wallets) AS positive_usd,
  (SELECT coalesce(sum(usd) FILTER (WHERE usd < 0), 0) FROM wallets) AS negative_usd,
  -- For the owner's information: positive balance that came from old order money.
  (SELECT coalesce(sum(least(w.balance, o.sale_total)), 0)
     FROM wallets w JOIN old_sales o USING (seller_id) WHERE w.balance > 0) AS positive_egp_from_old_sales,
  (SELECT count(*) FROM seller_wallet_top_ups WHERE status IN ('pending', 'processing')) AS pending_top_ups,
  (SELECT count(*) FROM sellers WHERE welcome_gift_eligible) AS gifts_ending,
  (SELECT count(*) FROM sellers WHERE fee_trial_eligible AND fee_trial_started_at IS NULL) AS unstarted_trials_ending;
