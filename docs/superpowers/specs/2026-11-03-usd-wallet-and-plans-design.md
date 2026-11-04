# USD store wallet, Free and Pro plans, AI credits

Owner decisions: `ROADMAP.md` §4, "Business update 2026-11-03". This note covers how it is built (F-56a, F-55a).

## One switch, per wallet

Everything ships dark. `billing_settings.usd_live` is false until `SELECT billing_switch_to_usd(<market rate>)` runs, in one transaction. Before that, all behaviour is today's: EGP wallet, EGP 5 fee, no plans screen, daily AI cap.

Code follows two facts rather than a deploy order:

- **Each wallet's own `seller_wallet.currency`.** Money code reads it in the same transaction as the write, so a fee can't land in the wrong currency even if an order is mid-flight during the switch.
- **`billing_settings.usd_live`.** Screens and new features (pricing, plans, credits) read it.

So the code can be deployed safely before the switch, and the switch needs no deploy.

## Ledger

`wallet_transactions` is append-only with `balance_after = balance_before + amount`, and its `currency` column already exists.

Each wallet's conversion writes two `adjustment` entries, reference type `usd_conversion`:

1. EGP: `-balance`, from `balance` to 0 (`<seller>:egp`).
2. USD: `+usd`, from 0 to `usd` (`<seller>:usd`).

A zero amount skips its entry. Old rows are never changed and keep their EGP label. `sellers.wallet_balance` mirrors the USD balance. `negative_limit` converts too.

## Rates

- `exchange_rates`: history of market rates (EGP per USD), from a server cron every 3 hours. A failed fetch keeps the last rate.
- `billing_settings`: optional Admin override, tax switch (off, 14%). `margin_bps` is no longer read (owner, 2026-11-04).
- **Market rate** = override, else the latest fetch. Used for estimates, the conversion and top-ups.
- **Top-up rate** = market rate, no margin. The EGP total is rounded down to a whole pound (owner, 2026-11-04).

## Top-ups

`seller_wallet_top_ups.amount` stays the **EGP paid** (the existing Kashier and proof checks keep working). New columns: `credit_amount`, `credit_currency`, `exchange_rate`, `tax_amount`.

The credit uses the saved amount, so a late webhook or approval can't change it. Rows with no credit amount are old EGP top-ups; the switch fills pending ones at the market rate, with no margin (owner).

Tax, when turned on, is added once to the EGP paid. Wallet spending isn't taxed again. Referral commission uses the EGP before tax.

## Order fee

`computeSellerPlatformFee` gets a billing input. When live:

| Seller | Fee |
| --- | --- |
| Free | 3 US cents |
| Pro (active at order creation) | 0 |
| Trial or exempt | 0 |

The snapshot in `order_items.metadata.platformFee` records `feeUsdCents` and the rate. `commission_amount` stays the EGP equivalent, for order reports.

`postOrderFees` posts from the snapshot. A USD wallet with an order that has no `feeUsdCents` (created before the switch) posts nothing: uncharged old fees are cancelled (owner).

## Plans

`sellers.plan` is the source. `plan_expires_at` is the end of the paid period. New columns: `plan_cancel_at_period_end`, `plan_grace_until`, `plan_admin_granted`.

- **Upgrade:** charge $29 now (`service_charge`, claim `plan:<seller>:<period start>`), can't go below zero, starts a new month.
- **Downgrade:** stays Pro until period end, no refund.
- **Renewal (daily cron):** charge; if the balance is short, 3 days' grace with a notification, then Free.
- **Admin grant:** free until a date, never charged, not counted as income.

A Pro seller whose period has ended counts as Free, even before the cron runs. The check is on the dates, not only the column.

## AI credits

`seller_ai_credits` holds the balance (one row per account), `ai_credit_ledger` is the idempotent history.

- Monthly: 100 on Free, reset on the 1st of the Cairo month. 2,000 on Pro, reset on renewal. No carry-over.
- Bought credits don't expire and are spent after monthly ones.
- Claim atomically before the AI call, give back on failure or cache hit, so parallel calls can't overspend.
- Failing to check credits blocks the call.

Before the switch, routes keep today's daily cap and don't touch credits.
