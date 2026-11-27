# Automatic emails

Owner's words, 2026-11-04: "work on the Order Notification and integrate the emails with it and pause the automatic emails, keep only the one email to sellers that Store is ready, and we will integrate the MersalSMS to the Order notifications later".

Every email leaves through the backend (`apps/backend`). The states live in one list, `EMAIL_RULES` in `packages/lib/src/emails/email-policy.lib.ts`. To turn one back on, change its line to `"keep"`.

**When it applies:** only once `usd_live` is true. Before the USD switch, everything sends as it did. The backend must be deployed for any of this to apply.

**Skipped means:** a `skipped` result, no delivery claim and no failed caller. Bell and push notifications are separate and don't change.

## Every store order (`store_order`)

Owner, 2026-11-08: the order confirmation is in every plan. It sends for every store order with a customer email, subscribed or not; it is free for a store not subscribed to Order notifications (a subscribed store still pays its 1 cent per order on it, as before) and never counts against the campaign email allowance. An order with no store doesn't send; a test order (F-76) doesn't either. Checkout's optional email field (F-64) shows on every store, for a guest or a customer with no real email.

| Email | Type | Trigger |
| --- | --- | --- |
| Order confirmation | `order_confirmation` | Order placed |

## Order notifications app

These send only for a store subscribed to the app (catalog key `customer_notifications`). An order with no store doesn't send. A card order waiting for its payment isn't charged, so an abandoned payment costs nothing. The order pays 1 cent once, on the first order email that really goes out (usually the confirmation).

| Email | Type | Trigger |
| --- | --- | --- |
| Order shipped | `order_shipped` | Order event |
| Order delivered | `order_delivered` | Order event |
| Order cancelled | `order_cancelled` | Order event |
| Refund issued | `refund_issued` | Refund, Kashier webhook |

## Kept

| Email | Type | Why |
| --- | --- | --- |
| "Your store is ready on Tallaby" | `seller_store_created` | The one seller email the owner kept. Always sends. |
| Store offline, top up (Arabic) | `seller_store_offline` | Owner, 2026-11-26 (ROADMAP.md F-113): once per seller, ever, when a seller who isn't activated reaches the end of the trial days and every store goes offline (`storeOffline`), sent only while that is at most 7 days ago. Says the store is offline, links to the wallet top-up, and explains the wallet in three lines. No opt-out. Always sends. |
| Weekly store insights (Arabic) | `seller_weekly_insights` | Owner, 2026-11-26 (ROADMAP.md F-113): activated sellers, once per finished week counted from signup (week 1 replaces the first-week email). Per store: visits, real orders, sales and the 3 best sellers, with last week's numbers. One-click opt-out (`seller_email_opt_outs`, 0183). Always sends. |
| First-week store insights (Arabic) | `seller_first_week` | F-104, **no longer sent** since F-113 (2026-11-26); its delivery rows still mark week 1 as sent. |
| Theme request ready / declined | `theme_request_ready`, `theme_request_declined` | Owner, 2026-11-06 (ROADMAP.md F-77): the seller asked for it. Always sends, once per request and outcome. |
| Store setup reminders (Arabic) | `seller_setup_reminder_day1`, `seller_setup_reminder_day7` | Owner, 2026-11-13 (ROADMAP.md F-94): 24 hours and 7 days after signup while the store is not set up; once each per seller (own claim table `seller_setup_reminders`, 0170, not `email_deliveries`), capped 40 a Cairo day and 10 a run, one-click opt-out. Always sends. |
| Customer: digital delivery (Arabic or English) | `digital_delivery` | Owner, 2026-11-27 (ROADMAP.md F-108c): after an online payment (Paymob, Kashier, other gateways, Admin marking an order paid), `fulfillDigitalOrderItems` posts `{ orderId, digitalOrderIds }` to `POST /api/emails/digital-delivery`. One `account.<root>/d/<token>` link per digital order line that is `delivered` (a manual-delivery line waits), each opening once and expiring after 7 days. Sent under the store's name and colours for a store order, in the buyer's language (else the store's default). Goes to the order's own email, else the account's real one; a buyer with neither is skipped (`no_email`), as is a test order. Once per set of links (reference derived from their tokens), so a repeated webhook sends nothing and a new link mails again. Needs `BACKEND_API_URL` and `INTERNAL_API_SECRET` on the caller. Always sends, never charged. |

## Not automatic, unchanged

| Email | Type | Why |
| --- | --- | --- |
| Store email campaign | `store_campaign` | A seller chooses to send it |
| Campaign test send | `store_campaign_test` | A seller clicks send test |
| Sign-up confirmation, password reset | Supabase Auth | Not sent by this code |

## Paused

| Email | Type | Trigger | Queue |
| --- | --- | --- | --- |
| Seller: new order | `seller_new_order` | Order event, card webhooks | Not sent later |
| Seller: order cancelled | `seller_order_cancelled` | Order event | Not sent later |
| Seller: low stock | `seller_low_stock` | Order event | Not sent later |
| Seller: wallet top-up | `seller_wallet_top_up` | Top-up approved or paid | Not sent later |
| Seller: fee trial reminder | `fee_trial_reminder_t7`, `fee_trial_reminder_t1` | Daily cron | Not sent later |
| Customer: abandoned cart | `abandoned_cart` | Daily cron | Cron stops first. Carts age out after 7 days. |
| Customer: back in stock | `back_in_stock` | Daily cron | Cron stops before claiming, so alerts wait |
| Customer: win-back | `store_winback` | Campaign cron | Cron stops before planning, so nothing is queued |
| Customer: welcome | `welcome` | Backend route, no caller in this repo | Not sent later |

## Enforcement

`sendEmail` in `apps/backend/src/lib/resend.ts` requires a send decision, so a new call site doesn't compile without asking `decideEmail`. `sendOnce` asks before taking a delivery claim.

## Store offline and weekly insights (F-113)

The hourly ecommerce job `GET /api/cron/seller-first-week` (path kept from F-104, `CRON_SECRET`) sends an empty `POST /api/emails/seller-insights` to the backend with `INTERNAL_API_SECRET`. The backend keeps `POST /api/emails/seller-first-week` as an alias, so deploy the backend first. The response is `{ offline: { sent, failed, skipped }, weekly: { sent, failed, skipped } | { status: "migration_missing" | "not_configured" } }`; counts only, no emails or names. One kind failing doesn't stop the other; both failing returns HTTP 500 (502 from the cron).

- **Order and caps** (Resend's free plan: 100 a day for every email together): the store-offline email first, at most 5 a run and 15 a Cairo day; then the weekly email, at most 5 a run and 20 a Cairo day (`packages/lib/src/emails/seller-insights.lib.ts`). With the setup reminders' 40 that leaves about 25 a day for every other email.
- **Store offline** (`seller_store_offline`, reference = seller id): the query narrows to sellers who aren't activated, have no manual top-up in review and whose trial days ended in the last 7 days; each is confirmed with `readOrderLockStrict` (an error skips the seller for that run, never a guess). The fee line follows the `fee_on_delivery` switch.
- **Weekly insights** (`seller_weekly_insights`, reference = `md5('seller_weekly_insights:<seller id>:<week start>')` as a uuid, metadata `{ sellerId, weekStart }`): week N covers the Cairo days [signup + 7(N−1), signup + 7N); only the latest finished week is sent, never older ones. Week 1 is skipped for a seller who already got `seller_first_week`. A not-activated seller never gets it (they get the store-offline email at the end of the trial instead). Every live store of the seller (up to 10): GA4 sessions for all of them in one report (shown as "not available" when GA4 isn't set up or fails), real orders (not test, not `payment_processing`), sales in the store's currency (the seller's line totals not cancelled, refunded or returned, as on the Reports page) and the 3 best sellers by quantity, each with last week's number.
- **Opt-out:** `List-Unsubscribe` + one-click POST to the dashboard's `/api/email/weekly-insights/unsubscribe?token=…` (GET only confirms). The token is the seller id with an HMAC-SHA256 tag whose key is derived (HKDF) from `INTEGRATIONS_ENCRYPTION_KEY`, so the backend and the dashboard need the same value; without it the weekly email reports `not_configured` and sends nothing. Without migration 0183 the weekly email reports `migration_missing` and sends nothing; the store-offline email doesn't need it.

Configure `GA4_PROPERTY_ID`, `GA4_SERVICE_ACCOUNT_EMAIL` and `GA4_SERVICE_ACCOUNT_PRIVATE_KEY` on the backend (the dashboard's storefront GA4 setup) for visits.
