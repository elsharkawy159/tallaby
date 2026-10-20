-- 0061_store_wallet_opening_balances.sql (PLAN.md §11.10, P6-05)
--
-- Owner decision 2026-10-17: a wallet whose balance differs from the sum of
-- its ledger entries keeps its balance; one `adjustment` entry records the
-- difference as the opening balance, so balance = sum(entries) from here on.
-- (Staging had one: seller "Tallaby", 538.20 with no entries.)
--
-- Separate from 0060 because 'adjustment' is added there and an enum value
-- cannot be used in the transaction that adds it. Idempotent: the reference
-- (admin, opening_balance) is unique per seller and type.

INSERT INTO wallet_transactions
  (seller_id, type, amount, currency, description, reference_type, reference_id,
   balance_before, balance_after, metadata)
SELECT w.seller_id,
       'adjustment',
       w.balance - coalesce(l.total, 0),
       'EGP',
       'Opening balance at store-wallet switch-over',
       'admin',
       'opening_balance',
       coalesce(l.total, 0),
       w.balance,
       jsonb_build_object('reason', 'opening_balance', 'migration', '0061')
FROM seller_wallet w
LEFT JOIN (SELECT seller_id, sum(amount) AS total FROM wallet_transactions GROUP BY seller_id) l
  ON l.seller_id = w.seller_id
WHERE w.balance <> coalesce(l.total, 0)
ON CONFLICT DO NOTHING;
