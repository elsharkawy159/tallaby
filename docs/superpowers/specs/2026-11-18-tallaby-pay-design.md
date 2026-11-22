# Tallaby Pay: online payments collected by Tallaby (ROADMAP.md F-39f → F-100)

Design note, 2026-11-18. **Design only:** nothing here is built, no migration file exists, and nothing was committed.
Status: **waiting for owner approval** (`CLAUDE.md` rule 4: this adds a new fee, a new money ledger, and money that
Tallaby holds for sellers). Owner request and decisions: §12.

## 0. In short

- **Tallaby Pay** is a store app. The seller presses **Turn on**: no account, no keys. The store's checkout then shows
  **"Pay online (Tallaby Pay)" / «ادفع أونلاين (طلبي باي)»**, and the shopper pays on **Tallaby's own EasyKash
  account** (cards, mobile wallets, Meeza, Apple Pay, Fawry, Aman).
- The money lands in Tallaby's EasyKash account. Tallaby keeps **3%** (a setting, default 300 basis points, snapshotted on
  each order), and the seller gets **97% of the paid amount** in a new, separate **Tallaby Pay earnings wallet**.
  EasyKash's own fee comes out of Tallaby's 3%. Example: an order of EGP 100.00 → seller +97.00, Tallaby fee 3.00.
- Earnings start as **pending**. They become **available** once the order is **delivered** and a short return window has
  passed (proposed **7 days**, owner question Q1). The seller asks for a **withdrawal** (InstaPay, bank, or mobile wallet, above a
  minimum). It shows in Admin, the owner pays by hand and marks it paid. This is the same pattern as affiliate payouts (0117).
- **Refunds (v1, manual):** the seller asks for one, or an admin starts one. The admin refunds the buyer in EasyKash and marks it
  refunded. The seller's 97 is taken back (the earnings wallet may go negative **only** for this), and Tallaby's 3 is reversed
  too, so Tallaby keeps nothing on a refunded order.
- **Recommended ledger:** one earnings wallet **per store** (stores are fully separate, owner 2026-11-10), with
  **pending / available / reserved** buckets, an append-only entry ledger and one **sale row per paid order** that holds
  gross, fee, net and status. That row is both the idempotency claim and the "Fees box". It never touches the store
  wallet (`postStoreWalletEntry`), `wallet_transactions` or the customer `user_wallets`.
- **Env:** `TALLABY_EASYKASH_API_KEY` (ecommerce, backend, admin) and `TALLABY_EASYKASH_HMAC_SECRET` (backend only).
  Callback URL `https://<backend>/api/webhooks/tallaby-pay/easykash`, set once in Tallaby's EasyKash Integration
  Settings.
- **Migrations:** `0175_tallaby_pay.sql` (tables, settings, provider, launch switch) and `0176_tallaby_pay_notifications.sql`
  (bell types and admin triggers). Both are additive and idempotent. The feature ships **dark** behind the
  `tallaby_pay_live` platform switch.
- **Blocking risk:** holding and paying out other people's money in Egypt may need a payment-facilitator arrangement
  with the Central Bank of Egypt (through EasyKash or a bank), and EasyKash's written permission to collect for a
  marketplace. **The owner must confirm with EasyKash and a lawyer before the switch is turned on** (§9).

---

## 1. How it differs from the EasyKash seller gateway (F-98)

| | EasyKash seller gateway (F-98, live) | Tallaby Pay (this note) |
|---|---|---|
| EasyKash account | The seller's own | **Tallaby's** (one account for every store) |
| Keys | Seller pastes API key and HMAC secret, encrypted per store | **Env vars**, never in the DB |
| Callback URL | Per seller: `/api/webhooks/store-payments/easykash/:sellerId` | One for the platform: `/api/webhooks/tallaby-pay/easykash` |
| Who holds the money | The seller, straight away | **Tallaby**, until payout |
| `orders.metadata.paymentCollector` | `'seller'` | **`'tallaby'`** |
| Seller sees the money | In their EasyKash account | In the **Tallaby Pay earnings wallet** (pending → available → withdrawn) |
| Refunds | The seller, in EasyKash | **Tallaby admin**, in EasyKash, plus a ledger debit |
| Tallaby's take | The plan order fee only (Free $0.03, Pro none) | 3% of the paid amount (plus the plan fee, Q4) |

What we reuse as it is: `packages/lib/src/easykash/easykash.lib.ts` (signature string, `verifyEasykashSignature` with
a timing-safe compare, `readEasykashCallback`, `buildEasykashPayBody`, `easykashAmountToPiastres`, `parseEasykashInquiry`,
`isEasykashPaidStatus`, voucher reading) and `easykash.server.ts` (`createEasykashPayLink`, `inquireEasykashPayment`,
timeouts, no body logging). Their unit tests already prove the docs example. Nothing in the EasyKash API changes. See
`docs/easykash.md` §1 for the API.

Not touched: Tallaby's own Kashier and Paymob checkout for marketplace orders, the Kashier (and InstaPay) store wallet
top-ups, `chargeOrderPlacementFee`, `creditSellerOnDelivery`, the seller gateways (Paymob, Kashier, EasyKash), and the
customer wallet.

---

## 2. How it plugs in

### 2.1 A store app with no keys

- `packages/apps/src/manifests/tallaby-pay.ts` already exists (`status: "coming_soon"`, `installMode: "connect"`,
  `settingsRoute: null`). It moves to `status: "available"` once the switch is on, and `settingsRoute: "gateway"`.
  **Its copy is wrong today:** it says "the money goes to your store wallet". New copy (content-writer skill): «ادفع
  أونلاين من غير حساب بوابة. الفلوس توصل لمحفظة أرباح طلبي باي وتسحبها لحسابك.» / "Online payments with no gateway account.
  The money goes to your Tallaby Pay earnings and you withdraw it to your account." The same fix applies to the comment
  at the top of `store-gateways.lib.ts`.
- `packages/lib/src/integrations/catalog.ts` and `registry.ts`: `tallaby_pay` becomes `availability: "available"`, kind
  `gateway`, and `credentials: none`. The catalog test (`catalog.test.ts`) moves it out of the "soon" list.
- **Storage:** a `store_integrations` row with `provider = 'tallaby_pay'`, `credentials_encrypted = NULL` (the column is
  nullable), and `config = { mode: "live", termsVersion, termsAcceptedAt, enabledAt }`. This keeps the
  one-row-per-store-and-provider rule (`store_integrations_store_provider_key`), `store_settings_audit` on turn on and
  off, the Apps page state and `getStorefrontGateway`, all with no new table.
- **Turn on:** the sheet shows the terms in plain words: 3% per paid order, money held until delivery plus N days,
  withdrawals by hand with a minimum, refunds taken back from earnings. The seller ticks **"I agree"** and presses
  **Turn on**. The server checks that:
  - the session's seller owns the store (rule 5), and the store is EGP (v1);
  - the `tallaby_pay_live` switch is on;
  - no other gateway is connected (§2.2).
  It then writes the row, the audit entry and the terms version. Turning it off sets `status = 'disconnected'` (the row is
  **kept**, unlike the seller gateways, so in-flight orders still settle; §4.3). Earnings and withdrawals keep working
  after turning it off.

### 2.2 One gateway per store: Tallaby Pay counts as the store's card gateway

**Recommended: yes, Tallaby Pay is the store's single online gateway in v1.** It cannot run next to the seller's own
Paymob, Kashier or EasyKash.

Why: checkout has one `online_payment` row and one `metadata.paymentGateway` snapshot (`place-order.ts:880–956`,
`store-methods.ts:392–425`). Two gateways need the "one per slot" work from the F-39g design (§6, task G-9), which is
not built. `connectStoreGateway` already refuses a second gateway, and turning Tallaby Pay on uses the same check
("Disconnect Kashier first"). Coexistence can come with G-9 later, when a shopper can pick between named rows.

### 2.3 Tallaby's EasyKash account and env vars

| Env var | Apps | Used for |
|---|---|---|
| `TALLABY_EASYKASH_API_KEY` | **ecommerce** (Pay link at checkout; Inquiry for the cash voucher on the order page; sweeper cron), **backend** (Inquiry confirm in the callback), **admin** ("Check payment" on the refund and sale pages) | `authorization` header of Pay and Inquiry |
| `TALLABY_EASYKASH_HMAC_SECRET` | **backend only** | Verifying callbacks |

- Both are server-only (rule 10): never `NEXT_PUBLIC_*`, never logged, never sent to a client. The dashboard needs
  neither.
- The callback base reuses `STORE_PAYMENTS_WEBHOOK_BASE_URL`, or `BACKEND_API_URL` (public https), which are already set for F-39.
- If either key is missing, `tallaby_pay` reports "not configured". The app card stays "Soon", turning it on is refused,
  and checkout hides the row. A missing key never makes a store look broken.
- **Owner setup in Tallaby's EasyKash account** (Settings › Integration Settings), once:
  1. Ask EasyKash to turn on Direct Payment, and get their **written OK** to collect for marketplace sellers (§9).
  2. Callback URL: `https://<backend>/api/webhooks/tallaby-pay/easykash` (it answers GET with 200 for EasyKash's check).
  3. Payment options: only the methods whose EasyKash fee is below 3% (Q3).
  4. **Fees are paid by the merchant (Tallaby), not added to the buyer**, so the paid amount always equals the order total
     (exact-amount rule, `docs/easykash.md` §4.5 option A).
  5. Copy the API Key and the HMAC Secret Key into the env of the apps above.

### 2.4 Checkout

- **Storefront row:** "Pay online (Tallaby Pay)" / «ادفع أونلاين (طلبي باي)», with the card, wallet, Meeza, Fawry
  and Aman logos (`GATEWAY_FOOTER_KEYS.tallaby_pay`). Strings go in `apps/ecommerce/messages/{ar,en}.json` (rule 13).
- **Reference:** `tpay_<orderId>_<suffix>`, a new one for each attempt. The `tpay_` prefix keeps Tallaby Pay references apart from
  anything else that may later use Tallaby's EasyKash account (for example top-ups). Its length (about 49 characters) is an E2E check
  (`docs/easykash.md` §1.10).
- **Pay body:** `buildEasykashPayBody` with `amount` = order total (or the deposit) from integer piastres, `currency: "EGP"`,
  `cashExpiry: 24`, the buyer's name, phone and email (or `no-reply@tallaby.com`), `redirectUrl` =
  `https://<store host>/api/store-payments/return/<orderId>` (the existing path form), and **`paymentOptions` set
  explicitly** to the list from Q3 (unlike F-98, where the seller's account decides).
- `lastReference` is saved in `orders.metadata.paymentGateway.lastReference` (or `deposit.gateway.lastReference`), as for EasyKash.
- `apps/ecommerce/actions/payment.ts` already sends any order with `readOrderGateway(metadata)` to
  `createStoreGatewayCheckout` rather than Tallaby's Kashier or Paymob. `actions/kashier.ts:36` and `actions/paymob.ts:76` already refuse
  such orders. Tallaby Pay orders carry a `paymentGateway` snapshot, so this keeps working once `readOrderGateway`
  accepts `tallaby_pay`. A test pins it.

---

## 3. Order metadata

At placement (`place-order.ts`, storefront orders only, `online_payment` or a COD deposit):

```jsonc
{
  "paymentCollector": "tallaby",            // explicit; today absence means "tallaby" too (collection-party.ts)
  "paymentGateway": { "provider": "tallaby_pay", "integrationId": "<row id>", "lastReference": "tpay_…" },
  "tallabyPay": { "feeBps": 300, "holdDays": 7, "termsVersion": "2026-11-18" }
}
```

- **Collector by provider:** a new pure helper, `gatewayCollector(provider)`, returns `'tallaby'` for `tallaby_pay` and
  `'seller'` for the others. `sellerCollected` in `place-order.ts` becomes `(sellerGateway && gatewayCollector(...) === 'seller') ||
  sellerTransfer`, so `paymentCollector: 'seller'` is never written for a Tallaby Pay order, and
  `storeShipping.collector` follows `storeShippingCollector('online_payment')` as for Tallaby-collected orders.
  The other providers behave as they do today.
- **Snapshot (§4.4 rule):** `feeBps` and `holdDays` are read from `billing_settings` **once, at placement**, and copied
  to the sale row at payment. A later change of the rate never alters an order already placed. The rate the seller agreed
  to when the shopper ordered is the rate they pay.
- **Deposit (F-21):** a COD order with a deposit on a Tallaby Pay store gets `deposit.gateway = { provider: "tallaby_pay",
  integrationId }` and the same `tallabyPay` snapshot.
- **Store wallet:** `resolveCollectionParty` already returns `'tallaby'` for these orders, and since 2026-10-31 no `sale`
  entry is ever posted to the store wallet, so the store wallet still gets only the plan order fee. **No store wallet code
  changes.**

---

## 4. The earnings ledger

### 4.1 Shape (recommended)

```
stores (1) ── (1) tallaby_pay_wallets ──┬── (n) tallaby_pay_sales     ← one per paid order (or deposit): gross, fee, net, status
                                        ├── (n) tallaby_pay_entries   ← append-only ledger of every balance move
                                        └── (n) tallaby_pay_payouts   ← withdrawal requests
```

**Per store, not per account.** The owner made stores fully separate on 2026-11-10 (per-store products, wallet and
activation; `docs/plans/stores-separation.md` §2.2). The store wallet split (F-87h, `0161`/`0164`) is planned but not built. A new
ledger should start in the target shape rather than migrate later. Each store has its own balance, sales list and
withdrawals, and `seller_id` is kept on every row for Admin and for the rule 5 checks. A seller with three stores makes three withdrawals.
That is simple to explain ("each store's money"), and nothing is ever moved between stores.

All money is EGP, `numeric(10,2)`, computed in integer piastres (rule 7). It is not the USD store wallet.

### 4.2 Tables (migration `0175`, server-only, RLS on, no policies)

**`tallaby_pay_wallets`**: one per store, created lazily on the first sale (`INSERT … ON CONFLICT (store_id) DO NOTHING`).

| Column | Notes |
|---|---|
| `id` uuid PK | |
| `store_id` uuid NOT NULL UNIQUE → `stores` ON DELETE RESTRICT | Money owed never disappears with a store |
| `seller_id` uuid NOT NULL → `sellers` ON DELETE RESTRICT | Same precedent as `referral_payouts`: an account holding money can't be deleted silently |
| `currency` text NOT NULL DEFAULT 'EGP', CHECK = 'EGP' | |
| `pending` numeric(10,2) NOT NULL DEFAULT 0, CHECK ≥ 0 | Paid, not yet withdrawable |
| `available` numeric(10,2) NOT NULL DEFAULT 0 | **May be negative**, only after a refund or chargeback |
| `reserved` numeric(10,2) NOT NULL DEFAULT 0, CHECK ≥ 0 | Held by the open withdrawal |
| `status` text NOT NULL DEFAULT 'active', CHECK IN ('active','frozen') | Frozen blocks withdrawals only |
| `frozen_reason`, `frozen_by`, `frozen_at`, `created_at`, `updated_at` | |

**`tallaby_pay_sales`**: one per paid order and purpose. It is the idempotency claim, the seller's sales list and the Fees box.

| Column | Notes |
|---|---|
| `id` uuid PK; `wallet_id`, `store_id`, `seller_id` | `store_id` = the order's store |
| `order_id` uuid NOT NULL → `orders` ON DELETE RESTRICT | |
| `purpose` text CHECK IN ('order','deposit') | **UNIQUE (`order_id`, `purpose`)**: one credit per order or deposit |
| `easykash_ref` text NOT NULL **UNIQUE** | A second payment for the same order can't be credited twice |
| `customer_reference`, `payment_method` (EasyKash's name) | |
| `gross`, `fee`, `net` numeric(10,2) | CHECK `gross = fee + net`, `fee ≥ 0`, `net ≥ 0` |
| `fee_bps` int, `hold_days` int | Snapshot from the order (§3) |
| `status` CHECK IN ('pending','available','refunded') | |
| `paid_at`, `release_at` (set by the release job from `orders.delivered_at + hold_days`), `released_at` | |
| `refund_state` CHECK IN (NULL,'requested','declined'), `refund_requested_at/_by`, `refund_reason` | |
| `refunded_at`, `refunded_by`, `refund_reference` (EasyKash or bank ref), `refund_reason_admin` | |

Indexes: `(store_id, paid_at DESC)`, a partial index on `status = 'pending'` for the release job, and a partial index on
`refund_state = 'requested'` for the Admin queue.

**`tallaby_pay_entries`**: append-only (a trigger rejects UPDATE and DELETE, like `user_wallet_transactions`).

| Column | Notes |
|---|---|
| `id`, `wallet_id`, `store_id`, `seller_id`, `sale_id` (nullable), `payout_id` (nullable) | |
| `kind` CHECK IN ('sale','release','refund','payout','payout_reversal','adjustment') | |
| `pending_delta`, `available_delta` numeric(10,2) | A release moves both in one row |
| `pending_after`, `available_after` numeric(10,2) | From the `UPDATE … RETURNING`, never a re-read |
| `reference_type`, `reference_id` text NOT NULL | **UNIQUE (`kind`, `reference_type`, `reference_id`)** |
| `description`, `metadata` jsonb, `created_by`, `created_at` | `adjustment` needs a reason (CHECK on metadata) |

**`tallaby_pay_payouts`**: the `referral_payouts` shape (0117), per store.

| Column | Notes |
|---|---|
| `id`, `wallet_id`, `store_id`, `seller_id` | |
| `amount` numeric(10,2), CHECK ≥ minimum floor 1.00 | The real minimum is a setting, checked in code |
| `method` CHECK IN ('instapay','bank','mobile_wallet') | |
| `destination` jsonb | InstaPay address or phone; bank holder, bank, IBAN or account; wallet provider and phone. Server-only, masked in lists |
| `status` CHECK IN ('requested','paid','rejected','cancelled','reversed') | `reversed` = the transfer came back after "paid" |
| `reference` (required when paid), `rejection_reason` (required when rejected), `reviewed_by`, `reviewed_at`, `created_at` | |
| **UNIQUE (`store_id`) WHERE status = 'requested'** | One open request per store; a double submit loses on this index |

**`billing_settings`** gets three columns: `tallaby_pay_fee_bps int NOT NULL DEFAULT 300 CHECK 0–2000`,
`tallaby_pay_hold_days int NOT NULL DEFAULT 7 CHECK 0–60`, and `tallaby_pay_min_payout numeric(10,2) NOT NULL DEFAULT 500`.
They are edited in Admin › Billing settings, and every change is audited in `admin_audit_log`.

### 4.3 The primitive

`packages/db/src/tallaby-pay/ledger.ts` with `postTallabyPayEntry(tx, input)`, modelled on `user-wallet.ts` and
`store-wallet.ts`. It is the **only** code that may change `pending`, `available` or `reserved`.

```sql
UPDATE tallaby_pay_wallets
SET pending = pending + :p, available = available + :a, reserved = reserved + :r, updated_at = now()
WHERE id = :walletId
  AND pending + :p >= 0
  AND reserved + :r >= 0
  AND (:kind IN ('refund','adjustment') OR available + :a >= reserved + :r)   -- only refunds may push below
RETURNING pending, available, reserved
```

It then inserts the entry inside a savepoint. A duplicate claim raises `DuplicateTallabyPayEntryError`, which callers treat as
"already applied", and the caller's transaction stays usable. Zero rows updated throws, so the whole transaction rolls back.
Amounts are 2 dp strings built from integer piastres, with no floats.

### 4.4 Fee math (pure, `packages/lib/src/tallaby-pay/fee.lib.ts`)

```ts
// paid and results in integer piastres; feeBps from the order snapshot.
export function splitTallabyPay(paidPiastres: number, feeBps: number) {
  const fee = Math.floor((paidPiastres * feeBps + 5_000) / 10_000); // round half up, integers only
  return { gross: paidPiastres, fee, net: paidPiastres - fee };
}
```

| Paid | Fee (3%) | Seller |
|---|---|---|
| 100.00 | 3.00 | 97.00 |
| 250.00 | 7.50 | 242.50 |
| 99.99 | 3.00 (299.97 → 300) | 96.99 |
| 33.33 | 1.00 (99.99 → 100) | 32.33 |
| 0.50 | 0.02 (1.5 → 2) | 0.48 |

The seller amount is always `paid − fee`, so the two always add up to the paid amount. Tests pin this table.

### 4.5 Entry kinds

| Event | Entry | pending | available | reserved | Claim |
|---|---|---|---|---|---|
| Payment confirmed | `sale` | **+net** | | | `sale:<saleId>`; the sale row's UNIQUE (order, purpose) and `easykash_ref` come first |
| Delivered + hold days passed | `release` | −net | **+net** | | `release:<saleId>` |
| Refund before release | `refund` | −net | | | `refund:<saleId>` |
| Refund after release | `refund` | | −net (may go < 0) | | `refund:<saleId>` |
| Withdrawal requested | none (reservation only) | | | +amount | the open-request index |
| Withdrawal paid | `payout` | | −amount | −amount | `payout:<payoutId>` |
| Withdrawal rejected or cancelled | none | | | −amount | status-guarded update |
| Paid withdrawal bounced | `payout_reversal` | | +amount | | `payout_reversal:<payoutId>` |
| Admin correction | `adjustment` | ± | ± | | `admin:<uuid>`, reason required |

**Tallaby's fee is not an entry in the seller's wallet.** It never belongs to the seller, so it is recorded on the
sale row (`fee`, `fee_bps`). The **Fees box** is `sum(fee) WHERE status <> 'refunded'`. A refund sets the sale to
`refunded`, which takes its fee out of the total (the 3% is reversed, owner decision 4). This gives one source of truth
and no second ledger that could disagree.

**Check that holds at all times (integration-tested):** for each wallet, `pending = Σ pending_delta`,
`available = Σ available_delta`, and `pending + available = Σ net of non-refunded sales − Σ paid payouts + Σ reversals ±
adjustments`.

### 4.6 Who pays the fee (F-100j, owner 2026-11-22)

Each store chooses who pays the fee: **`seller`** (the default, everything above, unchanged) or **`customer`**. The
choice is `feePayer` in the store's `tallaby_pay` `store_integrations.config` (no column; a missing key is `seller`, so
every row written before F-100j keeps the old behaviour; turning Tallaby Pay off and on keeps the choice). The seller
sets it on the Tallaby Pay card; `setTallabyPayFeePayer` checks the store belongs to the session seller and audits
`tallaby_pay_fee_payer_changed`. It applies to the next order only.

When the store's customers pay it **and the shopper pays the whole order with Tallaby Pay** (never COD, a deposit, or
another gateway), `placeOrderFromCart` reads `billing_settings.tallaby_pay_fee_bps` fresh (the same reader Admin edits;
not cached) and adds, in integer piastres:

```
fee     = round_half_up(base × bps / 10000)   // customerTallabyPayFee: same rounding as splitTallabyPay
charged = base + fee                           // base = subtotal + shipping + tax − discounts
```

| Stored on the order | Value |
|---|---|
| `orders.total_amount` | `charged` (what the shopper pays: the EasyKash amount, the paid claim's exact-amount check, the refund, the customer's "spent", Meta/TikTok/Snap Purchase value) |
| `orders.payment_fee_amount` (0178) | `fee` (0 on every other order) |
| `metadata.tallabyPay` | `{ feeBps, holdDays, termsVersion, feePayer: 'customer', customerFeePiastres: fee }` (seller-pays snapshots have no new keys) |

Settlement (`tallabyPaySaleSplit`) never recomputes it: gross = paid, **fee = `customerFeePiastres`**, net = paid − fee
= base. 100 EGP at 3%: the shopper pays 103, the sale is gross 103 / fee 3 / net 100, pending +100, Fees box +3. A
customer-pays snapshot without a readable surcharge is "no snapshot" (500, never a guessed split). Refunds need no new
code: a refund sets the sale `refunded` (its fee leaves the Fees box) and posts `refund −net`; Admin refunds the whole
gross in EasyKash, so the customer gets back everything they paid and Tallaby earns nothing. The plan's per-order fee
($0.03) and the store wallet are untouched; the seller's revenue figures come from order lines, never the fee.

Checkout shows the live rate as a summary line «رسوم الدفع الإلكتروني (3%)» / "Online payment fee (3%)" while Tallaby
Pay is selected (display only; the server recomputes). The order page, the customer confirmation email, the dashboard
order panel and Admin's order detail show the fee line from `payment_fee_amount`. An Admin price edit keeps the fee in
the total.

**COD deposits stay seller-pays.** A deposit's amount is a percent of the order total, rounded up to 5
(`splitDeposit`), and `total − deposit` is what the carrier collects in cash; the deposit claim checks the paid amount
against `deposit_amount`. A surcharge on the deposit would need a second fee field on the deposit, a deposit amount
that is no longer "percent of total", and changes to the COD amount shown to riders and carriers, so it is left out.

---

## 5. State machine

```
                 shopper pays (EasyKash callback + Inquiry PAID, exact amount)
order: payment_processing ───────────────────────────────▶ paid / confirmed
sale:                                                     pending  (+net to pending)
                                                            │
             order delivered (orders.delivered_at)          │  release job: status still 'delivered'
             and delivered_at + hold_days ≤ now,            │  and no refund requested
             wallet any status                              ▼
                                                          available (pending → available)
                                                            │ seller requests withdrawal (reserve)
                                                            ▼
                                                          withdrawn (payout paid; −available, −reserved)

refund (any time before or after release) ──▶ refunded (−net from pending or available; fee reversed)
```

- **Delivered** means the order's status is `delivered`, set through any of the existing delivered paths (the seller's own shipment
  updates in `apply-seller-shipment.server.ts`, Bosta, the shipping app, Admin). **The release job reads it.** It adds
  no code to those paths, so fulfillment stays as it is (rule 3, `docs/fulfillment.md`).
- **Release job:** an ecommerce cron, `/api/cron/tallaby-pay-release` (hourly, `CRON_SECRET`, like the other crons). For each
  `pending` sale whose order is `delivered`, it sets `release_at = delivered_at + hold_days` once. When `release_at ≤ now()`,
  the order is still `delivered`, and `refund_state IS NULL`, it posts `release` and sets `status = 'available'` in one transaction.
  The claim makes a rerun a no-op.
- **Returned after delivery, before release** (a carrier return, or the seller's scan return): the order is no longer
  `delivered`, so nothing releases. The seller sees "Returned: refund the buyer or tell us why not". An admin then
  refunds, or, for a COD deposit kept under the store's policy, releases by adjustment (Q5).
- **Cancelled before delivery:** a paid order can't be cancelled from the seller's order actions today (`cancelOrder`
  refuses `paid`). For Tallaby Pay, the order page gets **"Cancel and refund"**. It cancels the order, restocks it and opens a
  refund request (`refund_state = 'requested'`). The money stays pending until an admin refunds the buyer in EasyKash.
- **Paid after the order was already cancelled** (`applyGatewayEvent`'s "Paid after cancelled" branch): the money is in
  Tallaby's account, so the sale row is written with `status = 'pending'`, `refund_state = 'requested'` and reason `paid_after_cancel`,
  and it goes straight to the Admin refund queue. It can never release.
- **Never delivered:** a sale that is still pending 30 days after `paid_at` with no delivery appears in Admin › Tallaby Pay ›
  "Stuck" for follow-up. Nothing is released automatically.
- **COD deposit (F-21) paid by Tallaby Pay:** a sale row with `purpose = 'deposit'`, gross = the deposit, and 3% of it as the fee. It
  releases like an order sale once the order is delivered. **Recommended (Q5):** if the buyer refuses or cancels after paying the
  deposit, the deposit is the seller's under the store's deposit policy (that is what a deposit is for), so it releases at
  `cancelled_at`/return time + hold days unless a refund was requested. The remaining COD cash is collected by the seller
  and never touches this ledger.
- **Two payments for one order** (an old Fawry voucher paid after a card payment): the second `easykash_ref` finds the
  order already paid. It writes a sale row for review with `refund_state = 'requested'` and reason `paid_twice`, and never credits the seller twice.
- **Chargeback:** an admin records it like a refund (reason `chargeback`). The net comes back from pending or available, and the
  fee is reversed. Whether Tallaby also passes on EasyKash's chargeback fee is Q8.

---

## 6. Callback and settlement

### 6.1 Route (backend)

`apps/backend/src/routes/tallaby-pay.ts`:

- `GET /api/webhooks/tallaby-pay/easykash` with no callback fields → `200 { ok: true }` (EasyKash's URL check).
- `GET` with fields in the query, or `POST` with JSON or a form body → `handleTallabyPayCallback(fields)` in
  `packages/lib/src/tallaby-pay/settle.server.ts`.

### 6.2 `handleTallabyPayCallback`

1. Read the fields. If `customerReference` or `signatureHash` is missing → 400.
2. **Verify the HMAC** with `TALLABY_EASYKASH_HMAC_SECRET` (`verifyEasykashSignature`, timing-safe). If it's wrong → 401 and a log line
   with no body (the body has buyer data). This comes first, because the secret is global, not per store.
3. Parse `tpay_<orderId>_<suffix>` and load the order. If it's unknown, not a storefront order, or its (deposit) snapshot isn't
   `tallaby_pay` → 200 ignored. **It does not require the integration row to be connected**: the money is in Tallaby's account
   either way, so a seller who turned Tallaby Pay off mid-payment is still credited.
4. **Confirm with Inquiry** (`TALLABY_EASYKASH_API_KEY`, same reference). Act only on `PAID`/`DELIVERED`, using Inquiry's amount.
   If Inquiry fails → 500 (EasyKash may retry; the sweeper is the safety net).
5. Require the store to be EGP and the amount to equal the order total (or the deposit) **exactly**. A mismatch is recorded in `payments` as
   `pending` with an error, never confirmed, and shows in Admin.
6. In **one transaction**, under the same advisory lock on `tallaby_pay:<easykashRef>`:
   - the existing order claim (`payment_status → paid`, `status → confirmed`, guarded on the current state), the `payments` row
     (`collector: "tallaby"`, `provider: "tallaby_pay"`), and `chargeOrderPlacementFee` (unchanged, Q4);
   - the sale row (gross, fee, net from `splitTallabyPay(paid, snapshot.feeBps)`), and `postTallabyPayEntry(kind 'sale', +net pending)`.
   Either everything commits or nothing does, so an order is never marked paid without its earnings, or the other way round.
7. After the commit: the same paid side effects as the other gateways (digital fulfilment, the seller's new-order and low-stock emails).
   A duplicate → 200.

**Code shape:** the paid branch of `applyGatewayEvent` (`store-gateways.server.ts:945–984`) is extracted into a shared
`claimGatewayPayment(tx, order, event, { collector, onPaid })`, so Paymob, Kashier and EasyKash keep the same lines and tests,
and Tallaby Pay passes an `onPaid` that writes the sale. Adding `tallaby_pay` to `STORE_GATEWAY_PROVIDERS` makes every
`switch` with a `never` check fail to compile until it is handled. That is intended. `validateGatewayInput` and
`verifyGatewayKeys` return "no credentials" for it.

### 6.3 Sweeper and return route

- The return route (`/api/store-payments/return/[orderId]`) writes nothing, as today. The order page shows the cash
  voucher through Inquiry with Tallaby's key.
- The P2 sweeper from F-98g (`/api/cron/easykash-sync`) also covers Tallaby Pay orders still in `payment_processing`
  with a `lastReference` from the last 48 hours. It hands paid ones to the backend (same path as a callback, so side effects run
  once).

---

## 7. Withdrawals

- **Who:** the store owner (session seller = `stores.seller_id`). The `storeId` comes from the route and is checked on the server
  (rule 5).
- **Request:** amount ≥ `tallaby_pay_min_payout` (proposed EGP 500, the same as affiliate payouts, Q2) and ≤ `available −
  reserved`. The default is the whole withdrawable amount. Method and destination: InstaPay (address or phone), bank (holder name, bank,
  IBAN or account number), or mobile wallet (Vodafone Cash, e& Cash, Orange Cash, WE Pay and phone). The holder name must match the
  seller's legal name on the account (Q6, KYC). The request is refused while the wallet is frozen or `available ≤ 0`.
- **One open request per store** (partial unique index). The seller may cancel their own open request.
- **One transaction:** lock the wallet row, check, insert the payout, then `postTallabyPayEntry` with `reserved +amount` and no entry.
- **Admin › Tallaby Pay › Withdrawals:** the queue oldest first, with the full destination (server-only), the store's earnings
  summary, its refunds and its negative history.
  - **Mark paid** needs a transfer reference. It posts `payout` (−available, −reserved) and needs `available ≥ amount` at that moment;
    otherwise the admin must reject it.
  - **Reject** needs a reason and releases the reservation.
  - **Reversed:** if a paid transfer comes back, a `payout_reversal` entry is posted.
  An admin cannot act on a store they own. Every action is written to `admin_audit_log`.
- **Bells and emails:**
  - Admin bell `tallaby_pay_payout_requested` (AFTER INSERT trigger, 0117 pattern) and `tallaby_pay_refund_requested`.
  - Seller bells `tallaby_pay_payout_paid`, `tallaby_pay_payout_rejected` and `tallaby_pay_refunded`, inserted by the admin action in the same
    transaction with a `dedupe_key`.
  - Seller emails for paid, rejected and refunded, from the existing transactional email kit (Arabic first, both languages).
  - No bell per sale: the existing new-order bell already says the order was paid.

---

## 8. Screens

**Dashboard (both languages, rule 13; content-writer skill for the copy):**
- **Apps › Tallaby Pay** (`stores/[storeId]/apps/tallaby-pay`): what it is, the fee ("3% of each paid order, including the
  payment company's fee"), when money becomes available, the terms checkbox, Turn on or Turn off, and the "Disconnect Kashier first"
  message when needed.
- **Tallaby Pay earnings** (`stores/[storeId]/earnings`, linked from the app page and the store's money menu once the store has ever had a
  sale):
  - three totals, **Pending**, **Available** and **Withdrawn**, with a red note when Available is negative ("Refunds were more than your
    earnings; new sales will cover it");
  - a sales list: order number (link), date, gross, fee, net, status (Pending until <date>, Waiting for delivery,
    Available, Refunded, Refund requested), and payment method;
  - a withdraw form, the open request with Cancel, and the withdrawal history;
  - a CSV export.
- **Order page:** a "Paid with Tallaby Pay: you get EGP 97.00 after delivery + 7 days" line, and the **Cancel and refund** and
  **Request refund** buttons.
- Earnings data is never cached (rule 8). Mutations call `revalidatePath` only.

**Storefront:** the checkout row (§2.4), the cash voucher on the order page (as in F-98), and the store's footer payment logos.

**Admin (`apps/admin/app/(dashboard)/tallaby-pay/`):**
- **Overview:** gross collected, **Fees box** (total fee, this month, all time), owed to sellers (pending + available −
  reserved), paid out, refunded, and the stuck and negative wallets.
- **Sales:** filter by store, status and date; "Check payment" (Inquiry).
- **Withdrawals queue**, **Refunds queue** (mark refunded with the EasyKash reference, or decline with a reason), and **Wallets**
  (per store, with freeze and unfreeze plus reason).
- **Settings:** fee bps, hold days and minimum payout, in Admin › Billing settings.
- A sidebar count for open withdrawals and refunds.

---

## 9. Risks the owner must clear

**Update 2026-11-18 (owner):** EasyKash confirmed that Tallaby may use its gateway behind Tallaby Pay (collecting on sellers' behalf). Keep their written confirmation on file. Still open: the legal/CBE check (§9.1) and the accountant's answer on VAT (§9.7).

1. **Licensing (blocking).** Collecting buyers' money for many sellers and paying it out later is what payment
   facilitators do. In Egypt that is regulated by the Central Bank of Egypt. Tallaby may need to work under EasyKash's (or a
   bank's) licence as a sub-merchant aggregator, or get its own arrangement. **Before launch, the owner needs:** (a) EasyKash's
   written OK that their merchant terms allow collecting for marketplace sellers, and on what conditions (seller KYC,
   limits, per-seller sub-merchant IDs); and (b) a lawyer's opinion on holding seller funds, the seller terms, and whether the held
   money must sit in a separate bank account. The `tallaby_pay_live` switch stays off until both are in hand.
2. **Settlement timing.** EasyKash pays Tallaby's bank on its own schedule (ask: T+how many days, minus which fees). A
   seller can ask for a payout as soon as money is available. If the hold is shorter than EasyKash's settlement, Tallaby pays sellers from its
   own cash. The hold (Q1) should be at least the settlement delay, and the owner reconciles the EasyKash statement against
   the Fees box monthly (a CSV export from Admin, P2).
3. **Seller-marked delivery.** Sellers with their own riders mark "delivered" themselves. A dishonest seller could mark it
   at once and withdraw after the hold, before the buyer complains. Mitigations: manual payouts (the owner sees every withdrawal), freeze per
   store, refunds that push the wallet negative so they offset future sales, and optionally a longer hold for sellers without a
   carrier-confirmed delivery or for a store's first 30 days (Q7).
4. **Negative balances that never recover.** If a seller is refunded after withdrawing and then stops selling, Tallaby has
   already refunded the buyer and carries the loss. The seller terms should let Tallaby recover it (Q9). In v1 there is no automatic
   recovery from the store wallet (separate ledgers, rule 7).
5. **Chargebacks** arrive weeks later and may carry an EasyKash fee (Q8).
6. **EasyKash fees above 3%.** Some methods (instalments such as ValU, Souhoula and bank plans) can cost more than 3%. Tallaby would then lose money on
   every such order. Hence the explicit `paymentOptions` list (Q3).
7. **Tax and invoices.** Tallaby's 3% is a service fee to the seller. VAT (14%) and Egyptian e-invoicing may apply to
   it, and sellers may ask for monthly fee invoices. `billing_settings.tax_enabled` is off today. This needs the accountant's
   answer before launch (Q10).
8. **Refunds outside the API.** The EasyKash docs list a `REFUNDED` status but no refund API. Confirm with EasyKash how a refund
   is made in their dashboard, how long it takes, and whether EasyKash returns its fee.

---

## 10. Security and tenant isolation

- **Rule 5:** every dashboard read and write takes an explicit `storeId` and checks `stores.seller_id = session seller`,
  and every earnings query filters by `store_id`. Withdrawal destinations are read only by the owning seller (masked) and by
  admins. No seller, store, amount or fee ever comes from the client. The fee and hold come from the order snapshot, and the amount
  comes from Inquiry.
- **Callback:** HMAC with Tallaby's secret proves it came from EasyKash. Inquiry proves the payment is `PAID` and gives the amount.
  The order and store come from our own reference and the order row. Replays are stopped by the advisory lock, the guarded
  order claim, the unique `easykash_ref` and the unique (order, purpose).
- **Amount:** exact match against the server total, EGP only, and Tallaby's account is set to "fees on the merchant".
- **Ledger:** one primitive, guarded `UPDATE … RETURNING`, CHECK backstops, an append-only trigger, and claims with `ON CONFLICT`
  or unique violation inside a savepoint (rule 7).
- **Secrets (rule 10):** two env vars, server-only, on the apps listed in §2.3. Callback bodies are not logged.
- **Admin:** only platform admins (`is_platform_admin`). Mark paid and mark refunded are audited, with the reference required.
- **Launch switch:** `platform_switches.tallaby_pay_live`, read fresh per request. While it is off, turning the app on is refused and
  checkout hides the row, but callbacks for orders already placed still settle.

---

## 11. Migrations

Next free number: **`0175`** (`0174_store_gateway_easykash.sql` is the last file). Both are hand-written, idempotent
(`IF NOT EXISTS`, guarded `DO $$` blocks), mirrored in `schema.ts` and `relations.ts`, with no `drizzle-kit generate` (rule 6).

| # | File | Contents |
|---|---|---|
| 0175 | `0175_tallaby_pay.sql` | `store_integrations_provider_check` rebuilt as a superset of its **live** definition (0174's list) plus `tallaby_pay`, guarded; `billing_settings` columns `tallaby_pay_fee_bps`, `tallaby_pay_hold_days`, `tallaby_pay_min_payout`; `platform_switches` row `tallaby_pay_live` = false (`ON CONFLICT DO NOTHING`); tables `tallaby_pay_wallets`, `tallaby_pay_sales`, `tallaby_pay_entries` (+ append-only trigger), `tallaby_pay_payouts`, with CHECKs, unique claims and indexes from §4.2; RLS enabled, no policies |
| 0176 | `0176_tallaby_pay_notifications.sql` | `admin_notifications_type_check` and `seller_notifications_type_check` widened **from their live definition** (so it must run after `0173`, which is not applied anywhere yet) with the five types in §7, guarded; AFTER INSERT trigger on `tallaby_pay_payouts` and AFTER UPDATE OF `refund_state` trigger on `tallaby_pay_sales` for the admin bell (0117 pattern) |

**Order:** staging: `0173` (if still pending) → `0175` → `0176`; deploy the code (dark, switch off); E2E (§13). Production, with owner
approval: the same three **before** deploying, since Drizzle selects every `billing_settings` column and the new code
reads the new tables. Turning on `tallaby_pay_live` on production is a separate owner step, after §9.1. Rollback before any sale: drop the
four tables, the three columns and the switch row, and restore both checks. After a sale, never drop anything.

---

## 12. Owner request and decisions

**Request (2026-11-18, verbatim):** "Tallaby Pay is an app that integratable by sellers for their stores so customers pay online
using Tallaby Pay. Sellers have a separated Tallaby Earning wallet for that tallaby pay so any order got paid by Tallaby pay, the
order amount will be on Tallaby earning wallet. Tallaby Platform for now is 3% (I may increase it in the future). So if order amount
is 100 EGP and customer paid already (money on my Easy Kash account), seller's earning wallet should be toped up with 97 EGP and 3
EGP on Fees box. I can add the Tallaby easy cash variables account in .env."

**Decided 2026-11-18:**
1. Payouts: the seller requests, Admin shows it, the owner pays by hand and marks it paid (as affiliate payouts).
2. Hold: pending at payment, available after delivery plus a short return window.
3. EasyKash's fee is inside Tallaby's 3%: the seller always gets 97%.
4. Refunds in v1 are manual. The 97 is taken back (negative allowed only for this), and the 3% is reversed.

When this is approved, `PLAN.md` §13.1 gets the 3% Tallaby Pay fee as an agreed rule (rule 4), and `ROADMAP.md` gets F-100
with the tasks below and a §7 log entry (rule 19).

---

## 13. Tasks (ROADMAP.md F-100)

| Task | P | Depends on | What |
|---|---|---|---|
| F-100-0 | P1 | owner | EasyKash written OK, lawyer and accountant answers (§9.1, §9.7), Tallaby's EasyKash account set up (§2.3), env on staging |
| F-100a | P1 | approval | Migration 0175 on staging; schema mirror; `postTallabyPayEntry`; `splitTallabyPay`; settings reader; unit + DB integration tests |
| F-100b | P1 | F-100a | Gateway plumbing: `tallaby_pay` provider, `gatewayCollector`, `place-order.ts` metadata and snapshot, Turn on/off actions with terms, launch switch, checkout through Tallaby's EasyKash (`tpay_` reference, payment options); every Paymob/Kashier/EasyKash test still green |
| F-100c | P1 | F-100b | Backend callback route, `handleTallabyPayCallback`, `claimGatewayPayment` extraction, sale credit in the same transaction, deposit path |
| F-100d | P1 | F-100c | Release cron, Cancel and refund, refund requests, the paid-after-cancel and paid-twice paths |
| F-100e | P1 | F-100a | Withdrawals: request, cancel, reserve; Admin mark paid, reject, reverse; audit |
| F-100f | P1 | F-100c, F-100e | Dashboard: app page, earnings page, order page lines, both languages; manifest and catalog copy fixed |
| F-100g | P1 | F-100d, F-100e | Admin: overview, Fees box, sales, withdrawals, refunds, wallets with freeze, settings; 0176 (bells); seller emails |
| F-100h | P1 | 0175/0176 on staging, F-100a–g, F-100-0 | Manual E2E on staging with Tallaby's EasyKash account, using small real payments (below) |
| F-100i | P2 | F-100h | Sweeper coverage, EasyKash reconciliation CSV, stuck-sale report, tallaby.com page, optional "move earnings to store wallet" (Q11) |

Each task follows rule 21 (a brief to a subagent, strict diff review, `pnpm lint`, `pnpm typecheck` and `pnpm test` filtered to the touched packages, one commit on `main`).

**Unit tests:** `splitTallabyPay` (the table in §4.4, 0 bps, 2000 bps, 1 piastre); `gatewayCollector`; reference build and parse with the
`tpay_` prefix; withdrawal validation (minimum, more than withdrawable, frozen, negative); release eligibility (not delivered, returned, refund
requested, `release_at` in the future); `readOrderGateway` accepts `tallaby_pay`, and Tallaby's Kashier and Paymob actions refuse those orders.

**DB integration tests (`TEST_DATABASE_URL`):**
- a signed callback credits once; a replay and a concurrent duplicate credit nothing more;
- a wrong HMAC changes nothing; Inquiry `NEW` changes nothing; a wrong amount is never paid;
- the order paid and the sale credit commit together or not at all;
- release twice → one entry; a refund before and after release; negative available blocks withdrawals and is covered by the next sale;
- two simultaneous withdrawal requests → one wins; mark paid with too little available is refused;
- store A's seller can't read or withdraw store B's earnings;
- the ledger-equals-balance check after every scenario;
- a fee rate change after placement leaves the order's fee unchanged.

**Manual E2E (F-100h), recorded in ROADMAP.md §7 and `docs/launch-test-checklist.md`:**
1. Turn on in a store that has Kashier connected → refused; disconnect, turn on → the row shows at checkout.
2. Pay EGP 10 by card → the order is paid, pending +9.70, Fees box +0.30, one $0.03 plan fee (if Q4 = yes).
3. Fawry voucher paid later; another one expired.
4. Mark delivered → available after the hold (set it to 0 days on staging).
5. Withdraw → Admin marks it paid → balances and emails are correct.
6. Refund before and after release, in EasyKash and in Admin → available goes negative, and the next sale covers it.
7. Cancel and refund a paid order before delivery.
8. Replay a real callback → nothing more is credited; change one field → 401.
9. A COD deposit paid by Tallaby Pay.
10. Turn off mid-payment → still credited.
11. Arabic and English, phone and desktop.

---

## 14. Questions for the owner

**Answered by the owner, 2026-11-18 (these override the recommendations below and the matching parts of §4–§8):**
1. **Hold days = 0.** The seller's net goes to **available as soon as the order is delivered** (no hold). If the order is cancelled or returned *after* delivery, the **seller refunds the customer himself**; Tallaby changes nothing in the Earnings wallet. A refund *before* delivery stays as designed (admin refund, the sale's net and fee reversed).
2. **Minimum withdrawal: EGP 500.**
3. **Instalment methods stay on** (no `paymentOptions` filter) so they can be tested.
4. **Yes:** the plan order fee (Free $0.03) is separate from the Tallaby Pay fee and still applies.
5. Not answered: the recommendation (release a kept COD deposit to the seller) applies.
6. **Yes:** KYC (legal name + national ID or commercial register, destination in the same name) before the first withdrawal.
7. Not answered: no longer hold for risky stores in v1 (recommendation).
8. **Seller pays chargeback fees** (an `adjustment` entry with the reason).
9–11. Not answered: the recommendations apply (future earnings only; no invoices yet; move-to-store-wallet later).
12. **Name OK:** «طلبي باي» / Tallaby Pay. **Use the Tallaby logo** for it, and **show it first** among the payment gateways (Apps › Payments and the store's online payment options, checkout row first).

1. **Hold days:** how many days after delivery until money is available? **Recommended: 7**, and never shorter than EasyKash's
   settlement delay to Tallaby's bank. Egyptian consumer law allows returns for 14 days, and the affiliate hold in the code is 14
   (`RETURN_WINDOW_DAYS`). Choose 14 if returns matter more than speed.
2. **Minimum withdrawal:** **Recommended EGP 500** (the same as affiliate payouts; fewer manual transfers). EGP 200 is friendlier.
3. **Payment methods:** offer only methods whose EasyKash fee is under 3%? **Recommended: card, mobile wallet, Meeza,
   Apple Pay, Fawry and Aman; no instalments** until EasyKash's fee per method is known. Please send EasyKash's fee table.
4. **The plan order fee on top of 3%:** should Free stores also pay $0.03 per Tallaby Pay order from the store wallet? **Recommended:
   yes**, unchanged (the 3% is for the payment service, the $0.03 is the plan fee; no special case in fee code). Pro pays no order fee as today.
5. **COD deposit kept after a refusal:** release it to the seller (the deposit's purpose) unless a refund is requested?
   **Recommended: yes.**
6. **KYC before the first withdrawal:** require the account's legal name and national ID or commercial register, with the
   destination in the same name? **Recommended: yes** (and probably required by EasyKash or the CBE).
7. **Longer hold for risky stores:** for example 14 days when the seller marked delivery themselves, or during a store's first 30 days?
   **Recommended: not in v1**, since manual payouts already let you review; revisit after the first month.
8. **Chargeback fees:** if EasyKash charges a fee on a chargeback, does the seller pay it? **Recommended: yes**, as an
   `adjustment` with the reason, stated in the seller terms.
9. **Recovering a negative balance:** may Tallaby take it from future earnings only (v1), or also from the store
   wallet or by invoice? **Recommended: future earnings only in v1**; the terms reserve the right to claim it.
10. **VAT and invoices on the 3%:** ask the accountant. Until then, no invoices, and the fee shows as "Tallaby Pay fee".
11. **Moving earnings into the store wallet** (paying the plan fee or Pro from earnings instead of a top-up): later (P2), if wanted?
12. **Name:** «طلبي باي» / Tallaby Pay, and the checkout row «ادفع أونلاين (طلبي باي)». OK?

---

## 15. Sources

- `docs/easykash.md` (EasyKash API, F-98 design and what the docs don't say), `packages/lib/src/easykash/*`
- `packages/lib/src/payments/store-gateways.{lib,server}.ts` (`applyGatewayEvent` 895–1002, the EasyKash callback 808–880,
  `getStorefrontGateway` 418), `packages/lib/src/payments/store-methods.ts`
- `packages/lib/src/orders/place-order.ts` 876–956 (collector, gateway and deposit snapshots), `cod-deposit.lib.ts`
- `packages/db/src/wallet/{store-wallet,credit-seller-on-delivery,collection-party,user-wallet}.ts`, `docs/wallet.md`
- `packages/db/migrations/0117_*.sql`, `packages/lib/src/referrals/referrals.server.ts` (the payout pattern)
- `packages/lib/src/shipping/apply-seller-shipment.server.ts`, `apps/dashboard/app/[locale]/(main)/orders/orders.server.ts` (delivered and cancel paths)
- `packages/apps/src/manifests/tallaby-pay.ts`, `packages/lib/src/integrations/catalog.ts`
- `PLAN.md` §13, `docs/plans/stores-separation.md` §2.2, `ROADMAP.md` F-39, F-21, F-87h
