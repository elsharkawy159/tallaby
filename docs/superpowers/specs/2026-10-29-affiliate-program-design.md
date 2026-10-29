# Tallaby affiliate program (F-37) — design

Date: 2026-10-29 · Owner request · `ROADMAP.md` F-37 (this note is F-37a)

## Why

Grow Tallaby through its own sellers, like EasyOrders' "اربح معنا بالتسويق بالعمولة". A seller shares a link; every seller who signs up through it and tops up their store wallet earns the referrer **20 % of every top-up, for life**, paid **in cash** by the Tallaby team, never as wallet balance.

## Decisions (owner, 2026-10-29)

| Question | Answer |
|---|---|
| Commission | 20 % of every **succeeded** store-wallet top-up (`seller_wallet_top_ups.status = 'succeeded'`) by a referred seller, for life |
| Paid how | Cash (bank account or Vodafone Cash), by an admin. Never wallet credit |
| Successful referral | A referred seller whose **first top-up has succeeded** |
| Unlock withdrawal | **Two separate counts, both ≥ 10:** 10 successful referrals **and** 10 stores created by referred sellers (one referred seller with 3 stores = 3) |
| Minimum withdrawal | **EGP 500** |
| Hold period | **None.** Top-ups are never refunded, so a commission is withdrawable as soon as it is posted |
| Who gets a link | **Seller accounts only** |

Business model (`PLAN.md` §13): unchanged except for this added payout. The EGP 5 per delivered order fee and the trial are not touched. Record the addition in §13.

## Goals

- A referral link per seller, attribution at signup, commissions posted with the top-up, a seller page to track and withdraw, and an Admin screen to pay and audit.
- Its own ledger. It never touches `seller_wallets`, `store_wallet_entries`, `user_wallets` or `postStoreWalletEntry`.

## Non-goals

- F-18 (a seller's own marketers for their store) and the marketplace customer `affiliates` / `affiliate_commissions` tables: untouched.
- Multi-level (referrer of the referrer) commissions.
- Automatic payouts (Kashier or bank API). An admin pays by hand and records it.
- F-37g, the tallaby.com marketing page: later (P2), not in this round. *(my call)*

## Anti-goals (a failure even if it "works")

- A commission posted twice for one top-up, or posted for a failed or pending top-up.
- A wallet balance changed by anything in this feature.
- A seller choosing or changing their referrer after signup, or referring themselves.
- The referred seller's phone, email or payout details shown to the referrer.

## Data (migration `0117_referral_program.sql`, hand-written, idempotent)

Check the next free number first: `0113`, `0115` and `0116` exist in other sessions' uncommitted work.

- `sellers.referral_code text UNIQUE` (nullable, created on demand), `sellers.referred_by_seller_id uuid REFERENCES sellers(id) ON DELETE SET NULL`, `sellers.referred_at timestamptz`, `sellers.referral_unlocked_at timestamptz`. `CHECK (referred_by_seller_id <> id)`.
- `referral_commissions`: `id`, `referrer_seller_id`, `referred_seller_id`, `top_up_id UNIQUE REFERENCES seller_wallet_top_ups(id)`, `top_up_amount numeric(10,2)`, `amount numeric(10,2) CHECK (amount >= 0)`, `status` `earned | reversed`, `reversed_at`, `reversed_by`, `reversal_reason`, `created_at`. RLS on, no policies.
- `referral_payouts`: `id`, `referrer_seller_id`, `amount numeric(10,2) CHECK (amount >= 500)`, `method` `bank | vodafone_cash`, `destination jsonb` (account holder name, bank name and account/IBAN, or wallet phone; full value, server-only), `status` `requested | paid | rejected`, `reference` (admin's transfer reference), `reviewed_by`, `reviewed_at`, `rejection_reason`, `created_at`. A partial unique index allows only **one `requested` payout per referrer**. RLS on, no policies.
- Widen `admin_notifications_type_check` with `referral_payout_requested`, and add an AFTER INSERT trigger on `referral_payouts` that feeds the admin bell, the same way `0115`/`0116` do it.
- Mirror everything in `schema.ts` / `relations.ts`. New migration: staging first, then production with owner approval. The new code reads the new columns, so apply it before deploying.

The roadmap sketch had commission statuses `pending | available | paid`. With no hold and balance-based payouts (below) they are not needed. *(my call)*

## Balance

`available = Σ commissions.amount (status earned) − Σ payouts.amount (status requested or paid)`

Everything is computed in integer piastres. A rejected payout drops out of the sum, so its money comes back. A reversal after a payout can make the balance negative; future commissions pay it off first. *(my call)*

## Commission posting (F-37d)

- `postReferralCommission(tx, topUp)` in `packages/lib/src/referrals/`. It runs **inside the same transaction** that marks the top-up succeeded, on **both** success paths: `applyStoreTopUpWebhook` (Kashier, `store-wallet/top-up.server.ts`) and `reviewManualStoreTopUp` (admin-approved transfer, `admin/top-ups.server.ts`). Admin balance adjustments are not top-ups and earn nothing.
- If the seller has no `referred_by_seller_id`, it does nothing. Otherwise it inserts with `ON CONFLICT (top_up_id) DO NOTHING`. Amount = `floor(top_up_piastres × 20 / 100)` piastres. *(rounding down is my call)*
- If the commission insert fails, the transaction rolls back and the top-up stays retryable, which is the existing webhook behaviour. *(my call: one transaction, so commissions can't be missed silently)*
- Unlock check: after posting, or when the page loads, if the referrer now has ≥ 10 referred sellers with a succeeded top-up **and** ≥ 10 non-deleted stores owned by referred sellers, set `referral_unlocked_at` once. Withdrawal stays open after that, even if stores are later deleted.

## Attribution (F-37c)

- Link: `https://tallaby.com/?ref=<code>`. The dashboard signup also accepts `?ref=`.
- The `proxy.ts` of `apps/ecommerce` and `apps/dashboard` checks the code format and sets a first-party cookie `tallaby_ref` on `.tallaby.com` for 60 days. The **first link wins**: an existing cookie is never overwritten.
- Email signup copies the code into `user_metadata.signup_ref` (like `signup_subdomain`), so confirming in another browser keeps it.
- `ensureSellerAccount` gets an optional `referralCode`. It resolves to a seller **only when the account is being created** (never on an existing seller). It is ignored when the code is unknown, belongs to the same user, or the referrer's `support_phone` equals the new seller's phone. In those cases the account is still created, just without a referrer. Both `completeSignup` files pass it. `become-seller.server.ts` (customer → seller) passes it too, if it has a request context. *(builder: check)*
- Nobody can set or change `referred_by_seller_id` after creation. No action exposes it.

## Seller page "اربح معنا" / "Earn with us" (F-37e)

Route `/earn` in the dashboard, under Account & help in the sidebar, Arabic and English strings.

- Header text and the explanation (20 % for life, paid in cash).
- Cards: total earned, available to withdraw, already paid (EGP).
- The link with Copy, WhatsApp and Facebook share. The code is created on first visit: 7 characters, no look-alike characters. *(my call)*
- Progress: "X / 10 successful referrals", "X / 10 stores", with the rule written under them, and the EGP 500 minimum.
- Referrals list: store name (primary store's name), signup date, store count, total topped up, the referrer's commission. No contact details.
- Withdraw: enabled only when unlocked, available ≥ EGP 500 and no open request. The seller picks bank or Vodafone Cash and enters the details. The request is for the **whole available balance**, so there are no partial amounts. *(my call)* It shows the open request's status and offers "Contact support on WhatsApp".
- Every action takes the seller from the session and never a seller ID from the client (rule 5).

## Admin (F-37f)

`Admin › Referrals`:

- Referrers table: code, referred sellers, successful referrals, stores, earned, paid, balance, unlocked.
- Payout requests: full destination shown, "Mark paid" (needs a transfer reference) and "Reject" (needs a reason). Status-guarded update, written to `admin_audit_log`.
- Per referrer: list of referred sellers and commissions. "Reverse" a commission or all of one referred seller's commissions (fake account), with a reason, audited.
- Suspicious flag shown in the list: the referred seller has the same phone as the referrer or as another referred seller, or many referred accounts topped up only the minimum. Display only; an admin decides. *(my call)*

## Edge rules (from the builder check, all *my call*)

- **Fake accounts:** in Admin, "Reverse all" on a referred seller also sets `sellers.referral_excluded_at` on that seller. Excluded sellers and their stores stop counting toward the 10 + 10. An admin can also clear a referrer's `referral_unlocked_at` (re-lock), with a reason, audited. The unlock only sticks against **store deletions**, not against admin fraud decisions.
- **Suspended referrer** (`sellers.status` not `approved`): commissions are still recorded, but the referrer can't request a withdrawal and the page shows why. An admin can still pay or reject an open request.
- **Payout destination:** no automatic ownership rule. Admin sees the referrer's legal name and phone next to the destination and checks by hand before "Mark paid".
- **Customer → seller** (`become-seller.server.ts`): attributed like any new seller account, from the `tallaby_ref` cookie. "Seller accounts only" applies to who **gets a link**, not to who can be referred.
- **Referrer deleted:** `referral_commissions.referrer_seller_id` and `referral_payouts.referrer_seller_id` are `ON DELETE RESTRICT`, so money records are never silently lost. `referred_seller_id` is also `RESTRICT`. The builder checks whether any seller-delete flow exists and, if it does, makes it say so clearly.
- **Seller notifications** (widen `seller_notifications` type check in `0117`): `referral_commission_earned` (grouped per referrer per day), `referral_payout_paid` and `referral_payout_rejected`, with Arabic and English strings. No email or WhatsApp.

## Tests

- Unit: commission rounding, balance math, unlock rules, code format, cookie first-wins.
- Integration (`TEST_DATABASE_URL`): posting is idempotent (two webhook deliveries → one commission), no commission for unreferred sellers or failed top-ups, both success paths post, self-referral and same-phone are ignored, an existing seller can't gain a referrer, only one open payout, and a rejected payout returns the balance.
- Manual E2E logged in `PLAN.md` §23: open the link, sign up, top up on staging, commission shows, admin pays.

## Docs to update in the same change

`ROADMAP.md` (F-37 status, §6 checklist, §7 log), `PLAN.md` §13 (added payout) and §23, `CLAUDE.md` rule 6 (next migration number and `0117` status), `docs/wallet.md` (a note that referral commissions are a separate ledger).
