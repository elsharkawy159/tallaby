# Automatic emails

Owner's words, 2026-11-04: "work on the Order Notification and integrate the emails with it and pause the automatic emails, keep only the one email to sellers that Store is ready, and we will integrate the MersalSMS to the Order notifications later".

Every email leaves through the backend (`apps/backend`). The states live in one list, `EMAIL_RULES` in `packages/lib/src/emails/email-policy.lib.ts`. To turn one back on, change its line to `"keep"`.

**When it applies:** only once `usd_live` is true. Before the USD switch, everything sends as it did. The backend must be deployed for any of this to apply.

**Skipped means:** a `skipped` result, no delivery claim and no failed caller. Bell and push notifications are separate and don't change.

## Order notifications app

These send only for a store subscribed to the app (catalog key `customer_notifications`). An order with no store doesn't send. A card order waiting for its payment isn't charged, so an abandoned payment costs nothing. The order pays 1 cent once, on the first email that really goes out.

| Email | Type | Trigger |
| --- | --- | --- |
| Order confirmation | `order_confirmation` | Order placed |
| Order shipped | `order_shipped` | Order event |
| Order delivered | `order_delivered` | Order event |
| Order cancelled | `order_cancelled` | Order event |
| Refund issued | `refund_issued` | Refund, Kashier webhook |

## Kept

| Email | Type | Why |
| --- | --- | --- |
| "Your store is ready on Tallaby" | `seller_store_created` | The one seller email the owner kept. Always sends. |
| Theme request ready / declined | `theme_request_ready`, `theme_request_declined` | Owner, 2026-11-06 (ROADMAP.md F-77): the seller asked for it. Always sends, once per request and outcome. |

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
| Customer: digital delivery | `digital_delivery` | Backend route, no caller in this repo | Not sent later. Digital products are delayed for now (owner, 2026-11-04) |

## Enforcement

`sendEmail` in `apps/backend/src/lib/resend.ts` requires a send decision, so a new call site doesn't compile without asking `decideEmail`. `sendOnce` asks before taking a delivery claim.
