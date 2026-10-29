# Missed orders (F-03): design

Date: 2026-10-29. Owner answers in chat. ROADMAP.md F-03 (P0, #2 in §3).

## 1. Why

Many cash-on-delivery buyers on a store website fill in their name and phone, then leave without pressing "Order". If the seller can see them, they can send a WhatsApp message or call and win the sale. EasyOrders sellers ask for this a lot (17 votes for reminders).

## 2. What the owner decided

1. The seller follows up with **WhatsApp** (prefilled message) **and** a **Call** button.
2. Consent is a short line, no checkbox: «ممكن نتواصل معاك بخصوص طلبك» / "We may contact you about your order".
3. Tallaby also sends **one reminder email** when the customer has an email, and the seller **sees that the email was sent** (with the time).
4. The rest of the playback was approved: a "Not completed" list under Orders (name, phone, items, subtotal, shipping and total when known, time since they left), "Mark contacted", a date filter, an editable WhatsApp message per store, leads drop off when the order is placed, deleted after 30 days, store websites only (not the marketplace).

## 3. What exists today (checked in code)

- Store-website checkout is the shared `/cart/checkout` page on the store host. The cart is server-side (`carts` with `store_id`, `cart_items`), and the customer picks or adds a **saved address** (`AddressSelectorDialog`) that holds full name, phone, governorate (`state`) and city. Guests get a guest user. Email is only real for signed-in customers: every guest user gets a fake `guest_<uid>@temp.local` (`apps/ecommerce/lib/guest-user.ts`), so the lead takes `users.email` only when `users.is_guest` is false.
- `orders` has `store_id` and `user_id`. Placing the order goes through `apps/ecommerce/actions/order.ts` → `packages/lib/src/orders/place-order.ts`. **Another session has uncommitted work in both files (F-02)**, so this design does not touch them.
- A store-branded "you left something in your cart" email already exists: the daily cron `apps/ecommerce/app/api/cron/abandoned-carts` → backend `sendAbandonedCart` (store brand via `loadStoreEmailContext`), once per cart (`email_deliveries` claim), stamping `carts.reminder_sent_at`. It skips guests and customers who turned marketing mail off. It sends 1–7 days after the cart went quiet.
- All Vercel crons in this repo run once a day.

## 4. Design

### 4.1 Data (migration `0120_store_checkout_leads.sql`)

Server-only table `store_checkout_leads` (RLS on, no policies):

- `id`, `store_id` (FK stores, cascade), `seller_id` (FK sellers; for the tenant check), `user_id` (the checkout user, guest or signed in), `cart_id` (FK carts, set null).
- `full_name`, `phone` (normalised `01XXXXXXXXX`, same helper as F-02 blocked phones), `email` (nullable), `governorate`, `city`.
- `items jsonb` (snapshot: product id, title, variant label, quantity, unit price, image), `subtotal numeric(10,2)`, `shipping numeric(10,2) NULL`, `total numeric(10,2) NULL`.
- `order_id` (FK orders, set null) and `converted_at`; `contacted_at`, `contacted_by`; `email_sent_at`.
- `created_at`, `updated_at`.
- **One open lead per store and phone:** unique partial index on `(store_id, phone) WHERE order_id IS NULL`.
- Index `(store_id, updated_at DESC) WHERE order_id IS NULL` for the list.
- Per-store WhatsApp message: `stores.settings->'missedOrders'->>'whatsappTemplate'` (no new column; empty = default text).

### 4.2 Capture (storefront)

- A server action `saveCheckoutLead({ addressId })` in `apps/ecommerce` runs when, on a **store host** checkout, the selected shipping address is set or changes (on load with a default address, and after the customer adds or picks one). The server derives the store from the host, the user and cart from the session, and reads the address only if it belongs to that user. It never trusts ids or prices from the client: items and subtotal come from the server cart, shipping from the existing storefront shipping quote for that address when available.
- Upsert on `(store_id, phone)` while open: refresh name, items, totals, `updated_at`; keep `contacted_at`.
- Skips: marketplace checkout, offline stores, empty carts, phones that fail normalisation, phones on the store's F-02 blocklist (when that table exists).
- Debounced/limited: at most one save per cart per 10 seconds (rate limiter), so changing addresses doesn't spam writes.
- The consent line shows under the shipping address block on store-host checkout only.
- *Builder's call / my call:* capture happens when an address is saved or chosen, not on each keystroke inside the address form (the form is shared with the marketplace and saves the address only when complete). A visitor who closes the address form half-way is not captured; noted as a limitation.

### 4.3 Drop off when the order is placed

An `AFTER INSERT` trigger on `orders` (in 0120) marks the open lead converted when it is the same store and **any** of: same cart (`NEW.cart_id`), same user, or the same normalised phone as the order's shipping address (`user_addresses.phone` via `NEW.shipping_address_id`). So a guest who comes back with a new cookie, or signs in before ordering, still drops off. `orders.store_id` is filled by the 0050 BEFORE INSERT trigger, so it is set when this runs. No change to the checkout or order code. Converted leads leave the list (kept until cleanup for reporting later).

### 4.4 Reminder email

Reuse the existing store-branded abandoned-cart email (one per cart, respects marketing opt-out, skips guests). When it is sent, the lead shows "Email sent · <time>": the list reads `carts.reminder_sent_at` through `cart_id` (and copies it to `email_sent_at` for the lead row). See §6 Q1 about timing.

### 4.5 Seller list (dashboard)

- New page `/orders/missed` ("لم تكتمل / Not completed") in the Orders sidebar group. Like the existing Orders page it lists **all of the seller's stores**, each row labelled with its store, with a store filter (*my call*). Every query filters by `seller_id = session seller` and joins stores owned by that seller.
- Each row: name, phone, governorate, items (thumbnails + count), subtotal / shipping / total, "left X ago", badges "Email sent · time" and "Contacted".
- Actions: **WhatsApp** (opens `wa.me/20…` with the store's template filled: `{name}`, `{products}`, `{total}`, `{store}`, `{link}`); `{link}` is the plain store home URL (*my call*: no cart-recovery token, which would need its own security work; guest carts live on a cookie), **Call** (`tel:`), **Mark contacted / Undo** (server action with explicit `storeId`, re-checked).
- Filters: date range (today, 7 days, 30 days), contacted / not contacted.
- "WhatsApp message" editor on the same page with a store picker (textarea, placeholders, preview, reset to default), saved per store with explicit `storeId`, re-checked on the server.
- Empty state explaining how leads appear.

### 4.6 Cleanup

The same daily cron (new `/api/cron/checkout-leads` in ecommerce) deletes leads older than 30 days (converted or not).

## 5. Constraints

CLAUDE.md rules 5 (tenant isolation), 6 (migration 0120, mirrored in schema/relations, RLS on), 8 (never cache leads), 13 (ar + en), 14 (file split), 16 (don't touch F-02's uncommitted files: `actions/order.ts`, `place-order.ts`, orders list files). Phones are personal data: never logged, never cached, only shown to that store's seller.

## 6. Owner answers after review (2026-10-29)

- **Email timing:** keep the existing once-a-day job (the email goes out 1–2 days after the cart went quiet). No hourly cron.
- **Guests:** no email field at checkout; the reminder email reaches signed-in customers only. WhatsApp and calls cover guests.

## 7. Done means

Tests: lead upsert/normalisation/skip rules (unit), trigger converts the lead on order insert, tenant isolation (another seller can't list or mark), cleanup (integration on staging). Dashboard page in ar/en at 360 px. ROADMAP F-03 tasks a–c, d, f, e(part) updated; PLAN.md §23 log; CLAUDE.md rule 6 note for 0120.
