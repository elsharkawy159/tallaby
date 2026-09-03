# User Wallet

The centralized wallet every non-guest Tallaby user has, added by migration
`0025_user_wallet.sql`. This document is the contract; the code that enforces it
is `packages/db/src/wallet/user-wallet.ts`.

> **Not the seller wallet.** `seller_wallet`, `wallet_transactions` (seller-scoped)
> and `sellers.wallet_balance` are a separate, older system that credits sellers on
> delivery. Nothing here touches it. Converging the two is future work — see
> "Deferred" below.

## 1. Shape

```
users (1) ── (1) user_wallets ──┬── (n) user_wallet_transactions   ← the ledger
                                ├── (n) wallet_top_ups
                                └── (n) wallet_payout_requests
```

| Table | Purpose |
|---|---|
| `user_wallets` | `balance`, `reserved_balance`, `currency`, `status`. One row per non-guest user. |
| `user_wallet_transactions` | Append-only ledger. Signed `amount`, generated `direction`, `balance_before`/`balance_after`, `reference_type`/`reference_id`, `metadata`. |
| `wallet_top_ups` | A top-up intent and its provider state. |
| `wallet_payout_requests` | A payout request and its review state. |

All money is `numeric(10, 2)` and read back as a **string** by postgres-js.
Currency is pinned to EGP by CHECK, matching `0008_egp_only_currency`.

## 2. Invariants

1. **The ledger is the source of truth.** `user_wallets.balance` is a running
   total that only `packages/db/src/wallet/user-wallet.ts` may move. No other
   file writes it — not a server action, not a route handler, not the admin app.
2. **`available = balance - reserved_balance`.** A pending payout *reserves*;
   it never deducts. Only completion debits.
3. **CHECK constraints are the backstop**: `balance >= 0`,
   `reserved_balance >= 0`, `reserved_balance <= balance`, and
   `balance_after = balance_before + amount`. Nothing should ever reach them —
   if one fires, the write fails loudly instead of corrupting a balance. Same
   role `products_quantity_non_negative` (0007) plays for stock.
4. **The ledger is append-only.** A trigger rejects UPDATE and DELETE.
   Corrections are made by posting a compensating transaction.
5. **`(type, reference_type, reference_id)` is a unique idempotency claim.** A
   second attempt to apply the same domain event raises a unique violation,
   which rolls the whole transaction back. A retried webhook cannot credit twice
   and cannot credit partially. A companion CHECK forces `reference_type` and
   `reference_id` to be set together — NULLs compare as distinct in a unique
   index, so a half-filled reference would silently escape the guard.
6. **Only trusted server-side code credits a wallet.** There is no
   client-reachable path that adds money.

## 3. Concurrency

Every balance change is a single `UPDATE ... WHERE ... RETURNING` — no
read-then-write anywhere, the same discipline as
`packages/db/src/inventory/stock.ts` and `coupons/claim.ts`. The `WHERE` clause
*is* the guard:

```sql
UPDATE user_wallets
SET balance = balance + :delta,
    reserved_balance = reserved_balance + :reservedDelta
WHERE id = :id
  AND status = 'active'
  AND balance + :delta >= 0
  AND reserved_balance + :reservedDelta >= 0
  AND balance + :delta >= reserved_balance + :reservedDelta
RETURNING balance
```

Postgres serializes concurrent updates to the same row, so N simultaneous
debits for the last EGP cannot both succeed. Zero rows updated means the wallet
is missing, frozen, or the movement would break an invariant; the primitive
throws and the caller's transaction rolls back.

`balance_before` is derived from the `RETURNING` value in integer cents, never
from a re-read (which could observe another transaction's write) and never from
float arithmetic.

## 4. Public API — `@workspace/db/wallet`

| Export | Effect |
|---|---|
| `getOrCreateUserWallet(client, userId)` | Backstop for the provisioning trigger. Concurrency-safe. |
| `postWalletTransaction(tx, input)` | Moves the balance and writes the ledger row. |
| `reservePayoutAmount(tx, walletId, amount)` | Holds funds. No ledger row — the balance did not move. |
| `releasePayoutReservation(tx, walletId, amount)` | Frees a hold. |
| `settlePayout(tx, input)` | Debit + release + ledger row, atomically. |
| `toWalletAmount(value)` | Normalizes to a 2-dp string; rejects NaN, ≤ 0, sub-cent precision, overflow. |
| `parseTopUpReference(reference)` | Recognises a provider reference as a top-up. |

Errors: `WalletNotFoundError`, `WalletNotActiveError`,
`InsufficientWalletBalanceError`, `DuplicateWalletTransactionError`,
`InvalidWalletAmountError`.

Every mutator takes the caller's `tx`, so a failure later in the caller's
transaction rolls the movement back with it.

## 5. Provisioning

An `AFTER INSERT` trigger on `public.users` creates a wallet for every non-guest
user, plus an `AFTER UPDATE OF is_guest` trigger for guest→registered
conversion. Guests deliberately get no wallet: a guest row is a checkout
artefact, not an account that can hold money. Existing users were backfilled by
the migration. `getOrCreateUserWallet()` is the application-side backstop.

## 6. Top-up flow (Paymob)

```
storefront  createWalletTopUp()            → wallet_top_ups row (pending)
                                           → Paymob intention, special_reference = "topup_<uuid>"
                                           → returns checkoutUrl
buyer       pays on Paymob
Paymob      POST /api/paymob/webhook?hmac=…
backend     verifyPaymobTransactionHmac()  → handleWalletTopUpWebhook()
                                           → amount check
                                           → claim: UPDATE … WHERE status IN ('pending','processing')
                                           → postWalletTransaction(type='top_up')
```

- The storefront **cannot** mark a top-up successful. The only credit path is
  the HMAC-verified webhook.
- The credited figure is the amount we recorded, not the amount in the payload.
  A mismatch fails the top-up rather than crediting the wrong number.
- Two independent replay guards: the status-guarded claim, and the ledger's
  unique reference index for anything that races past it.
- Paymob gives one reference field, so top-ups namespace theirs with the
  `topup_` prefix; order payments keep the raw order uuid.

## 7. Payout flow

| Transition | Balance | Reserved | Ledger |
|---|---|---|---|
| create → `pending` | — | **+amount** (fails if available < amount) | — |
| → `approved` / `processing` | — | — | — |
| → `completed` | **−amount** | **−amount** | `payout`, negative |
| → `rejected` / `cancelled` / `failed` | — | **−amount** | — |

Completion is an admin action recording an `external_reference` for a transfer
sent outside Tallaby; there is no automated bank integration yet.

A partial unique index caps each user at one open request
(`pending`/`approved`/`processing`) — without it, stacked requests could jointly
exceed the available balance even though each reserved successfully.

## 8. Permissions

Payout eligibility is `PAYOUT_ELIGIBLE_ROLES = ['driver', 'marketing']`, read
from `users.role`. Riders map onto the existing `driver` value —
`apps/shipping` keys entirely off it, so there is no separate rider role.
`marketing` was added by 0025.

| Role | Wallet | Top up | Request payout |
|---|---|---|---|
| customer | ✅ | ✅ | ❌ |
| seller | ✅ | ✅ | ❌ (paid via `seller_payouts`) |
| driver (rider) | ✅ | ✅ | ✅ |
| marketing | ✅ | ✅ | ✅ |
| support / admin | ✅ | ✅ | ❌ |
| guest | ❌ | ❌ | ❌ |

Enforced server-side in every payout write. Hiding the button is presentation,
not a control. An admin cannot action their own payout request.

## 9. RLS

All four tables have RLS enabled with a **SELECT-only**, owner-scoped policy for
`authenticated` (`user_id = (SELECT auth.uid())`). There is deliberately **no**
insert/update/delete policy on any of them, so a client holding the anon key can
read its own balance and history and nothing else.

Server code reaches these tables through Drizzle as the database owner, which
bypasses RLS and performs its own authorization — the same posture
`0021_shipping_realtime.sql` documents for `shipments`.

## 10. Caching

Wallet data is per-user and is **never** cached. Per
`docs/caching-and-data-fetching.md` §3 there is no cache tag for it and
`createCachedQuery` must not be used. Mutations call `revalidatePath` only.

## 11. Testing

`packages/db/src/wallet/user-wallet.integration.test.ts` runs against a real
Postgres and is skipped unless `TEST_DATABASE_URL` is set. It covers
provisioning, ledger arithmetic, insufficient-balance refusal, the CHECK
backstops, concurrent credits and debits, duplicate-reference idempotency,
rollback on downstream failure, reserve/release/settle, ledger immutability and
the one-open-request index. Setup notes are in the file's header.

`apps/ecommerce/.../wallet.lib.test.ts` pins payout eligibility for every role
and the amount validation bounds.

## 12. Deferred

- Wallet as a checkout payment method (`order_payment` type exists; no wiring).
- Marketing commission accrual (`commission` type exists; nothing writes it).
- Automated external payout execution.
- Admin manual credit/adjustment UI (`adjustment` type and the primitive exist).
- Converging `seller_wallet` onto `user_wallets`.
