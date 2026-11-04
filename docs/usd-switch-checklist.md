# USD switch: go-live checklist

Turns on the USD store wallet, Free and Pro plans and AI credits together (`ROADMAP.md` F-55h; design: `docs/superpowers/specs/2026-11-03-usd-wallet-and-plans-design.md`). It needs the owner's go-ahead (`CLAUDE.md` rule 4). Until step 8, every screen and fee stays as it is today.

## Steps, in order

1. **Apply the migrations on production**, after staging: `0136_billing_usd.sql`, `0137_plans_and_ai_credits.sql`. Also apply these if they aren't on production yet: `0136_guest_users_without_auth_fk.sql`, `0138_products_track_stock.sql`, `0139_store_app_installs.sql` and any `0140`/`0141`. They are additive; the code reads the new columns, so they go first. Also `0142_top_up_wallets_and_privacy.sql`, `0143_store_app_requests.sql`, `0144_order_source_manual.sql`, `0145_cross_sell.sql`, `0146_email_packs.sql`, `0147`, `0148`, `0149` and `0150`: all are on staging only. `0145` and `0149` must land before the deploy, because store, cart and coupon queries read them, and `0150` must too, or an order in a store's own currency fails on the database check.
2. **Deploy every app that reads billing:** dashboard, admin, ecommerce and backend. Check the backend separately, as it can deploy on its own schedule. Deploying with `usd_live` false changes nothing for sellers.
3. **Confirm these are set:**
   - `CRON_SECRET` on the dashboard, for `/api/cron/exchange-rate` and `/api/cron/plan-renewals` (`apps/dashboard/vercel.json`).
   - `EXCHANGE_RATE_API_KEY` on the dashboard: a free ExchangeRate-API key. Without it the job uses the open endpoint, whose terms require a visible attribution link, and no such link exists.
   - **The backend must be deployed for the email pause to apply** (F-63, `docs/email-inventory.md`). After the switch, automatic emails stop except "your store is ready", and customer order emails send only for stores subscribed to Order notifications. `0142` and `0143` must be on production before deploying.
   - `ORDER_ACCESS_SECRET` on the dashboard, the same value as ecommerce: the Create order page signs the customer's confirm link with it (F-05c).
   - Card top-ups stay "Soon" (`CARD_TOP_UPS_ENABLED = false`, owner 2026-11-04). Only before turning them on: confirm Kashier's real maximum for an EGP payment. `$1,000` must fit (F-56d).
4. **Confirm a fresh rate exists.** Admin › Billing shows the latest rate and when it was fetched. If there is none, trigger the exchange-rate cron once, then check it again. Staging had no rate rows on 2026-11-03, so its cron hasn't run yet.
5. **Dry run.** Admin › Billing shows it, or run `packages/db/scripts/billing-usd-dry-run.sql` (read-only) with the rate on its first line. Review:
   - wallets to convert, and the positive and negative totals in EGP and USD
   - the positive balance that came from old order money
   - pending top-ups
   - gifts and unstarted trials that will end
6. **Owner go-ahead.** The owner approves the rate and the dry-run numbers, and picks a quiet hour.
7. **Terms.** Set `USD_SWITCH_DATE` in `(site)/terms/page.tsx` and update the Terms' last-updated date. The file is `apps/ecommerce/app/[locale]/(marketing)/(site)/terms/page.tsx`, and the date shows the clause "The move to US dollars", so it needs a deploy timed with the switch.
8. **Run the switch** on production, once, with the approved market rate (no margin):
   ```sql
   SELECT * FROM billing_switch_to_usd(<rate>);
   ```
   It runs in one transaction and returns the wallets converted and top-ups priced. A second run is refused.
9. **Verify right after** (read-only):
   ```sql
   SELECT usd_live, usd_live_at, conversion_rate FROM billing_settings;
   SELECT currency, count(*) FROM seller_wallet GROUP BY 1;                 -- only USD
   SELECT count(*) FROM seller_wallet w JOIN sellers s ON s.id = w.seller_id
    WHERE s.wallet_balance <> w.balance;                                    -- 0
   SELECT count(*) FROM wallet_transactions WHERE reference_type = 'usd_conversion';
   SELECT count(*) FROM sellers WHERE welcome_gift_eligible;                -- 0
   ```
   Admin › Wallets should show no ledger mismatches.
10. **Smoke checks**, with a test seller:
   - **Dashboard:** the header, home wallet KPI, `/wallet`, `/financial` and the negative-balance pop-up all show `$`. Old ledger rows keep their EGP label.
   - **Top-up:** card top-ups stay Soon, so test a manual InstaPay or Vodafone Cash top-up: it shows USD and the EGP total, and once approved in Admin the bell and the email show the USD credit.
   - **Order:** a Free store order takes `$0.03`, and `order_items.metadata.platformFee` has `feeUsdCents`. On Pro it takes nothing.
   - **Plans:** upgrade charges `$29`. An AI autofill uses credits. Buying 100 credits charges `$1`.
   - **Copy:** the product form's "you receive" takes about `$0.03` in EGP, and Help shows the new fee and top-up answers.
   - **Ads:** paying from the wallet shows the USD price and takes the same amount.
   - **Admin:** the sellers list, seller page, store page, person card and home KPIs show the right currency. Settings shows the new fee.
   - **New signup:** `welcome_gift_eligible` is false, and finishing setup grants nothing.
11. **Next day:** check the exchange-rate, plan-renewals, welcome-gifts and fee-trial-reminders crons in the logs.
12. **Publish what's waiting on the owner** (below), then mark F-55h done and rewrite `PLAN.md` §13 as live.

## What can't be undone

There is no reverse function. Treat the switch as one-way.

- **Balances:** they are converted and rounded to cents, and `negative_limit` converts too. Going back would need a new ledger migration and wouldn't restore the exact EGP amounts.
- **Uncharged EGP fees:** held fees and card orders from before the switch that have no `feeUsdCents` are never charged (owner's decision).
- **Gifts and trials:** unstarted ones end for good (`welcome_gift_eligible`, `fee_trial_eligible`, and the gift column's default). Running trials finish, and open gifts move to USD and expire as planned.
- **Pending top-ups:** they are priced at the market rate with no margin, and the saved credit never changes after that.
- **Orders placed after the switch:** their fee snapshots and USD ledger entries stay.

## Waiting on the owner

Static copy to check at the switch. It isn't gated. The groups in `apps/ecommerce/messages/marketing/` already use the new prices. The strings still in the base files (`apps/ecommerce/messages/{ar,en}.json`) still promise the old ones.

- **Public pricing page and homepage** (F-55g, the owner's redesign): `components/marketing/pricing`, `lib/marketing/pricing.lib.ts`, and `apps/ecommerce/messages/marketing/{pricing,home}.{ar,en}.json`.
- **Terms:** approve `docs/terms-usd-wallet-draft.md`, then edit the `fees` section of the terms in `apps/ecommerce/messages/marketing/legal.{ar,en}.json`.
- **Other tallaby.com copy, all static pages.** A live `usd_live` check would make them dynamic, so these need a copy edit timed with the switch:
  - the public help centre and FAQ: `messages/marketing/faq.{ar,en}.json`
  - the about page: `messages/marketing/about.{ar,en}.json`
  - the blog pricing post and its price tool: `messages/marketing/blog.{ar,en}.json` and `lib/marketing/blog-calculator.lib.ts`, which adds the fee as `FREE_PLAN_FEE_EGP`
  - the seller FAQ ("no monthly fee", commission wording): base files, `pages.sell`
  - the affiliates FAQ sentence "The EGP 100 welcome gift isn't a top-up": base files, `affiliates.faq`
- **Internal docs:** `MARKETING_PROJECT.md`, `docs/wallet.md`, `docs/admin-saas.md`, `PLAN.md` §13.
- **Referral program copy stays EGP on purpose:** commissions are worked out on the EGP paid, before tax.

## Stays in EGP by design

- Customer order prices, and `orders` and `order_items` amounts.
- `commission_amount`, which holds the fee's EGP equivalent for order reports.
- `seller_wallet_top_ups.amount` (the EGP paid).
- Referral commissions and payouts.
- Ad package prices. A USD wallet pays the equivalent at the market rate.
- The Admin home "Platform fees" tile and chart. USD fees are shown in EGP at the switch rate so they stay comparable with GMV. Admin › Wallets and Admin › Billing show USD.
