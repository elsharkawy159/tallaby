# Seller top-up rules

Owner decision, 2026-11-17. This file is the source of truth for what a seller
gets before their first top-up and what happens when the trial ends. It replaces
the earlier rules (F-84 grace of 2026-11-09, the short window of 2026-11-15 and
"old sellers never go offline"). The code lives in
`packages/lib/src/billing/order-lock.lib.ts`.

These rules apply only while the USD switch is on (`billing_settings.usd_live`,
live on production since 2026-11-06). They change no money or ledger logic.

## 1. Activation

A seller is **activated** as soon as one of these is true, and stays activated
for good:

- one approved wallet top-up (online or manual);
- the store wallet balance was ever above zero, which includes balance an admin
  adds by hand from the Admin project;
- an active Pro plan.

Everything below describes a seller who is **not activated**.

## 2. The trial

| Seller | Trial length | Counted from |
|---|---|---|
| Signed up before 2026-11-16 00:00 Cairo | 14 days | sign-up, but never before 2026-11-09 00:00 Cairo |
| Signed up on or after 2026-11-16 00:00 Cairo | 7 days | sign-up |

So the first 14-day trials end on 2026-11-23 00:00 Cairo.

The trial ends on its last day only. The number of orders received does not
shorten it.

## 3. During the trial

- The store is online and takes orders (once published, rule 12 in `CLAUDE.md`).
- Orders, customers and sales totals are hidden in the dashboard. The bell and
  push only say a new order arrived, with no details; the home shows how many
  orders came in.
- Campaign and win-back emails are held.
- AI: 20 requests (`AI_CREDITS_MONTHLY_NOT_ACTIVATED`).
- The dashboard shows how many days are left before the store goes offline.

## 4. When the trial ends without a top-up

- **Every store of the seller goes offline**: all storefront routes show the
  store-offline page (noindex) and checkout refuses new orders, the same as an
  unpublished store. Marketplace listings follow the same rule they follow for
  an unpublished store.
- **AI stops**: 0 requests until the seller is activated.
- Orders, customers and sales totals stay hidden; emails stay held.
- The seller **cannot bring the store back online** by any switch or button.
  When they try (the "Website live" switch, Publish, or any other action that
  would put the store online), the dashboard sends them to the wallet top-up
  page with the message: top up your wallet to bring your store back online.
- The dashboard, the builder and the product pages keep working, so the seller
  can keep preparing the store.

## 5. Coming back

- Activation (section 1) brings every store back online at once, shows the
  hidden orders, releases the held emails and restores the full AI allowance.
- A manual top-up waiting for review keeps the stores online (or brings them
  back) while it is reviewed. If it is rejected and the trial is over, the
  stores go offline again.

## 6. What does not change

- An activated seller is never affected, whatever their balance later (the
  wallet may go negative, `CLAUDE.md` rule 7).
- A store the seller unpublished themselves stays offline until they publish it.
- A never-published store still needs a template and one published product, or
  the seller's Publish button, to go live (`CLAUDE.md` rule 12).
