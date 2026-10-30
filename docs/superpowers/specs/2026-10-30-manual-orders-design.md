# Manual orders (phone/WhatsApp sales): design note (ROADMAP.md F-05a)

**Status:** Draft for owner approval, 2026-10-30. No code has been written.
**Scope:** F-05b (create an order from the dashboard) and F-05c ("send order link").
**Short version:** a manual order goes through `placeOrderFromCart` (`packages/lib/src/orders/place-order.ts`) like every other order, so the fee, wallet, stock, shipping-zone and delivery rules stay the same. The fee and ledger formulas do not change. The changes are: a new order source `manual`; a **seller-funded** discount input (the existing admin discount override is Tallaby-funded and must not be reused); and the existing `metadata.paymentCollector = 'seller'` flag for "already paid".

---

## 1. Precedent: the admin external-order desk

Tallaby already creates orders on someone's behalf: `apps/admin/actions/external-orders.ts`. Its flow (`placeExternalOrder`, :550–747):

1. Resolve or create the customer: a global `users` lookup by phone, then by email, else a new Supabase auth user (:45–131).
2. Resolve the lines from the DB: the product must be active, the variant must belong to it, stock is checked, and the price comes from `getPriceFinal` (:153–258).
3. In one transaction, write the address, a new `carts` row and its `cart_items` (:589–668).
4. Call `placeOrderFromCart({ orderSource: 'external', skipCoupons: true, paymentOverrides, pricingOverrides })` (:686–697).
5. Invalidate the product inventory cache (:705).

The manual order copies steps 2–5. It changes **three** things, for tenant isolation and money reasons:

| Admin desk does | Manual order must do instead | Why |
|---|---|---|
| Looks up `users` across the whole platform by phone and creates an auth user (:68–131) | Creates a **new guest `users` row** for each order (`isGuest = true`, `email = manual_<uuid>@temp.local`, name and phone), the same shape as storefront guests (`apps/ecommerce/lib/guest-user.ts:129–135`). It never links to an existing Tallaby account. | A seller must never see or attach orders to another seller's or the marketplace's customer account (CLAUDE.md rule 5). The CRM groups customers by **phone within the store** (`packages/lib/src/customers/customers.lib.ts:76–91`, `customers.server.ts:48`), so a guest row per order is enough. |
| Lets the operator type a unit price (`unitPrice`, :232) | Takes prices from the DB only (`getPriceFinal`). A lower price is entered as a discount (§6). | This keeps one way to lower a price, and it is seller-funded. |
| `pricingOverrides.discountAmount` → `applyDiscountOverride` (`place-order.ts:189–224`) | A new seller-funded discount (§6) | The admin override adds an order-level `manual_adjustment` line but **does not reduce line totals**. The delivered `sale` credit is Σ line `total` (`packages/db/src/wallet/credit-seller-on-delivery.ts:147`), so for a Tallaby-collected order **Tallaby would pay** the seller's discount. |

The cart is created with an explicit `store_id` and `store_seller_id`. The admin desk's cart has neither, so its orders have no store.

## 2. Order source: smallest option

`orders.order_source` is a Postgres enum: `'website' | 'external' | 'storefront'` (`schema.ts:11`, migration `0020`). Two places treat `'storefront'` specially:

- The DB trigger `orders_fill_store_id` copies `carts.store_id` **only when `order_source = 'storefront'`** (`0050_seller_plans_and_stores.sql:353–369`). An order without `store_id` is invisible to the CRM (`customers.server.ts:48`), the store wallet's per-store entries (`credit-seller-on-delivery.ts:100–126`), the F-03 lead conversion (`0120`, `convert_store_checkout_lead` returns early when `store_id IS NULL`), Bosta and the risk badge.
- In `place-order.ts`, the blocklist (:306–315), the store's own shipping zones (:357–381) and the coupon channel (:489) are gated on `orderSource === 'storefront'`.

**Option A: no migration (smallest).** Use `orderSource: 'storefront'` and record `orders.metadata.manualOrder = { createdBy, createdAt, paidVia? }`. Every store rule then applies automatically. Downsides: reports and the admin "source" filter (`apps/admin/actions/orders-list.ts:95`) count manual orders as website orders, and `source = manual` (and `pos` later, F-39) has to be read from JSON.

**Option B (recommended): one additive migration.** Migration `NNNN_order_source_manual.sql` (next free number at build time; `0126` today, since `0124` and `0125` already exist in the worktree):

```sql
ALTER TYPE public.order_source ADD VALUE IF NOT EXISTS 'manual';
-- in a separate statement or file (a new enum value cannot be used in the transaction that adds it):
CREATE OR REPLACE FUNCTION orders_fill_store_id() ... IF NEW.store_id IS NULL
  AND NEW.order_source IN ('storefront', 'manual') AND NEW.cart_id IS NOT NULL THEN ...
```

Then, in `place-order.ts`, a local `const isStoreOrder = orderSource === 'storefront' || orderSource === 'manual'` replaces the check at :309 (blocklist) and :358 (zones). The coupon channel at :489 is untouched because manual orders pass `skipCoupons: true`. Mirror the change in `schema.ts:11` and `OrderSource` (`place-order.ts:94`). The migration is additive and old code ignores the new value, so it can be applied before the deploy. Admin labels need one new key (`apps/admin/app/(dashboard)/orders/orders.types.ts`).

Either way, `orders.metadata.manualOrder` holds who created the order (the seller's user id) for audit.

## 3. Fee and wallet: same as a storefront COD order

Nothing in the fee or ledger code changes:

- **Fee:** `computeOrderLineFees` (`place-order.ts:562–586`) gives a flat EGP 5 per seller, capped at the seller's line totals, 0 in trial or when exempt. It is snapshotted per line and posted only on delivery (`credit-seller-on-delivery.ts:161–168`). PLAN.md §13 is unchanged.
- **Who collected the money** is `resolveCollectionParty` (`packages/db/src/wallet/collection-party.ts:14–30`):
  - COD delivered by the seller's rider or Bosta → `seller` → only the fee is posted.
  - COD delivered by a Tallaby rider → `tallaby` → `sale` (goods + billed own-shipping) + `fee`.
  This is exactly what a storefront COD order gets today.
- Refunds stay deferred (D3). Cancel and return restore stock through the existing paths.

## 4. Payment: COD vs "already paid"

| Choice | `paymentMethod` | `paymentStatus` / `status` | `metadata` | Ledger on delivery |
|---|---|---|---|---|
| COD | `cash_on_delivery` | `pending` / see Q5 | `manualOrder` | Same as storefront COD (§3) |
| Already paid to the seller (InstaPay, wallet, cash in person) | **new value `seller_collected`** | `paid` + `paidAt` / `confirmed` | `paymentCollector: 'seller'`, `manualOrder.paidVia: 'instapay' \| 'vodafone_cash' \| … \| 'cash'` | **Fee only** |

What "already paid" means for the ledger:

- It means the **seller** holds the money. Tallaby never received it, so no `sale` may ever be credited.
- `resolveCollectionParty` already returns `seller` when `metadata.paymentCollector === 'seller'` (`collection-party.ts:23`). That reader exists; **nothing writes the flag today**. P3-07 Part B was meant to be its first writer (PLAN.md:1837), so manual orders would be the first.
- **Do not** store `instapay` / `vodafone_cash` / `e_cash` as the `paymentMethod`. They are in `TALLABY_RECEIVED_METHODS` (`packages/lib/src/payments/store-methods.ts:60`), so `storeShippingCollector` would return `tallaby` (:78–84). The store-shipping snapshot would then credit the billed shipping to the seller as money Tallaby collected (`credit-seller-on-delivery.ts:21–30`). `seller_collected` falls through to `seller`.
- **Does it need P3-07 Part B? No.** Part B is store-website checkout with the seller's own receiving numbers, the customer's proof and `confirmManualPayment`. Here the seller states that they were paid, and only fee-only entries follow. `place-order.ts` needs a small new input to merge extra metadata into `baseOrderMetadata` (:668–670); today that holds only `storeShipping`.
- Do not set `recordPayment` (no `payments` row). That table records money Tallaby captured (`place-order.ts:840–880`).
- Downstream already handles a paid order: Bosta sends COD 0 (`bostaCollection`, `packages/lib/src/shipping/bosta/bosta-ship.lib.ts:20–24`), the printed slip shows nothing to collect (`amountToCollect`, `apps/dashboard/app/print/orders/print-orders.lib.ts:46–53`), and the seller cannot cancel a prepaid order (`order-flow.lib.ts:151`).
- Partial payment (a deposit plus COD) is out of scope (Q4).

## 5. Stock, catalog and blocklist

- **Lines:** in the server action, before any write. Products must belong to `seller.sellerId`, be `status = 'active'` (a trashed product is `draft`, so it is excluded) and be sold by this store (`storeSellsProduct`, `packages/lib/src/stores/server`). Variants must belong to their product. The price is `getPriceFinal(variant ?? product)`, never from the client.
- **Stock:** `placeOrderFromCart` already decrements stock atomically inside its transaction (`place-order.ts:698`, `packages/db/src/inventory/stock.ts:64–131`). An `InsufficientStockError` rolls the whole order back. An early check in the form only improves the message.
- **`setStockContext`:** `decrementStock` already sets reason `order` (`stock.ts:67,74`), and the `order_items_link_stock_movement` trigger (`0125`, :288–317) attaches the order id. Proposal: add an optional `stockContext` input to `placeOrderFromCart`, passed to `decrementStock` as `{ reason: 'order', actorId: sellerUserId, storeId }`, so the stock history shows who made the order. There is no new reason value, so no change to the `stock_movements_reason_check` (`0125`:48).
- **Blocklist (F-02):** with Option B, `isStorePhoneBlocked` runs in `place-order.ts:308–315` exactly as on the storefront. In the form, a blocked phone shows a warning before submit. Whether the seller may override it is Q3.
- **Missed orders (F-03):** the `0120` trigger converts the store's open lead with the same phone. A seller who calls a missed lead and enters the order closes the lead automatically. This is intended.

## 6. Shipping and discount

- **Shipping:** the guest address (governorate and place) is priced by the same path as the storefront. For an own-delivery store that is `resolveStorefrontShipping` with the store's zones (`place-order.ts:357–381`): it refuses places no zone covers, refuses COD on zones without COD (:641–645), and writes the `storeShipping` snapshot that the delivery credit needs. For a Tallaby-delivery store it is the rate table. v1 sends **no `pricingOverrides.shippingCost`**: an override skips the zone path (:360), so no `storeShipping` snapshot is written. Free shipping is given as a discount instead (Q2).
- **Discount (seller-funded):** a new optional input `sellerDiscount: { amountPiastres, label }`, applied right after the coupon block (:560) and before the fee (:562), using the same mechanism as a seller coupon (:542–556):
  1. Cap it at the seller's goods total: `min(amount, Σ line subtotal)`. It never touches shipping.
  2. Split it across lines with `allocateDiscountAcrossLines` (`coupon-scope.lib.ts:85`); each line gets `discountAmount` and `total = subtotal − share`.
  3. Add one order-level line `{ type: 'seller_discount', label, amount }` to `orders.discounts`, so that `totalAmount = subtotal + shipping − discount_amount` (:615) and "Σ discounts = discount_amount" still hold.

  The fee is then computed on the net line totals. It is still a flat EGP 5, and below EGP 5 it is capped as today. The `sale` credit is net, so the seller pays for their own discount. `'seller_discount'` is added to `OrderDiscountType` (`schema.ts:63–69`). This is TypeScript only, because the jsonb parser keeps any type (`order-discounts.ts:147–180`). Coupons are skipped for manual orders.

## 7. UI and server action

- Route: `apps/dashboard/app/(main)/orders/new/`, opened from a "Create order" button on Orders and from a customer in Orders › Customers (F-01e "order again" later). The store comes from the URL (`?store=<id>`). With several stores the page asks for one first. There is never a "current store" cookie.
- Files, using the feature split (rule 14):
  - `manual-order.dto.ts`: zod schema for lines (`productId`, `variantId?`, `qty` 1–99, max 30 lines), customer (name, phone, optional second phone), address (governorate, place or area, line 1, notes), `discountEgp`, `payment: 'cod' | 'paid'`, `paidVia`, `notes`, `requestId` (uuid).
  - `manual-order.lib.ts`: a pure preview of the totals, with tests.
  - `manual-order.server.ts`: `previewManualOrder(storeId, input)` and `createManualOrder(storeId, input)`.
  - `manual-order.client.tsx`: the form. Product search covers only this store's catalog. The customer lookup reads this store's customers (`listStoreCustomers`) to prefill the name and the last address, never global `users`.
  - Strings in `ar.json` and `en.json`.
- `createManualOrder(storeId, input)`:
  1. `requireStore(storeId, { forWrite: true })` (`apps/dashboard/lib/auth/require-seller.server.ts:102`). This rejects a foreign, archived or non-UUID store.
  2. Parse with zod and normalise the phone (`normalizeBlockedPhone`).
  3. Resolve the lines (§5) and compute `sellerDiscount` in piastres.
  4. **Idempotency:** create the cart with `id = requestId`, using `ON CONFLICT DO NOTHING`. On a conflict, return the existing order with that `cart_id` if its store is this store; otherwise refuse. This needs no migration and prevents a double click from creating two orders.
  5. In one transaction: the guest user, the address and the cart (`store_id`, `store_seller_id`) with its items.
  6. Call `placeOrderFromCart({ orderSource: 'manual', skipCoupons: true, sendConfirmationEmail: false, paymentOverrides, sellerDiscount, stockContext, orderMetadata, locale })`.
  7. If it fails, set the cart's status to `abandoned`, so no reminder job picks it up and it does not linger as `active`. Map the error keys (`storeShippingNotCovered`, `storeShippingNoCod`, `storeCustomerBlocked`, insufficient stock) to translated messages.
  8. Call `applyInvalidation(invalidateProductInventory(inventoryItems))` and refresh Orders.
- Notifications: `sendConfirmationEmail: false` skips the customer email (a guest has no real email) and the seller's own "new order" email (`place-order.ts:921–936`). The bell and push triggers (`0098`, F-06) still fire, and so does the low-stock bell (`0125`). Whether the seller should also be notified about an order they created themselves is part of Q5.

## 8. F-05c "Send order link"

The proposal reuses the order created above. It does not build a second checkout:

- On "Send link instead", the seller creates the same manual order with `status = 'pending'` and `metadata.manualOrder.awaitingCustomer = true`. Stock is reserved at once.
- The dashboard opens WhatsApp (`wa.me`, as in F-02g) with the store-host order page link (`buildOrderPagePath`, `apps/ecommerce/lib/order-access-token.ts`). The page shows the items, the total and a **Confirm** button that moves the order to `confirmed`, the same transition as F-02g "Confirmed" and F-38c.
- An order that is not confirmed is cancelled after N hours by a cron, which restores stock with reason `cancel`. Without that, stock stays held.
- **Pay online from the link is out of scope.** Online card payment is behind `isOnlineCardPaymentEnabled` (`apps/ecommerce/actions/order.ts:95–100`) and is marketplace-collected.
- Alternative (no new order state): send a link that fills a cart on the store and let the customer finish the normal checkout. This is simpler for stock, but the seller's discount cannot travel with it. See Q6.

## 9. Risks

1. **Discount funded by the wrong party** if anyone reuses `pricingOverrides.discountAmount`. Mitigation: a dedicated input, plus a test that `sale` = Σ net line totals.
2. **Double sale credit on "already paid"** if the method is stored as `instapay`/`vodafone_cash`, or `paymentCollector` is missing. Mitigation: `seller_collected` plus the flag, and a ledger integration test (delivered by a Tallaby rider → fee only).
3. **Cross-tenant data:** the global users/phone lookup must not be copied from the admin desk. Mitigation: a guest per order, and a customer search limited to this store.
4. **Fake orders to inflate numbers:** each one costs the seller EGP 5 on delivery, so the risk is low. Manual orders are labelled in lists and reports.
5. **Orphan rows** (guest, address, cart) if `placeOrderFromCart` fails after step 5. The admin desk has the same issue. Mitigation: mark the cart `abandoned`; the guest rows are harmless.
6. **Enum migration timing:** `ADD VALUE` must be committed before the trigger refers to it. Use two statements and apply on staging, then production, before the deploy.

## 10. Tasks (after approval)

- [ ] F-05b-1 Migration (Option B): enum value plus trigger. Mirror in `schema.ts` and the `OrderSource` type. Staging first, then production with owner approval.
- [ ] F-05b-2 `place-order.ts`: `isStoreOrder` gate; optional `sellerDiscount`, `stockContext`, `orderMetadata`; `'seller_discount'` discount type. Snapshot test: storefront and marketplace orders without the new inputs give identical results (PLAN.md §14).
- [ ] F-05b-3 `manual-order.{dto,lib,server,client}` and the route. `requireStore` on every action. Store-only product and customer search. Idempotent `requestId`.
- [ ] F-05b-4 Labels: the `manual` source badge in the order list, panel, export and print; `seller_collected` / `paidVia` in the dashboard and admin payment labels; i18n.
- [ ] F-05b-5 Tests:
  - lib: the totals preview equals the `placeOrderFromCart` result; discount cap and split.
  - integration (staging): a foreign `storeId` is refused; a product outside the catalog is refused; insufficient stock rolls back; a blocked phone is refused; a zone without COD is refused; a repeated `requestId` returns the same order; stock movement has reason `order` with the actor and the order id; `store_id` is set and the order appears in Customers; delivered COD by a seller rider posts fee only; delivered COD by a Tallaby rider posts `sale` = net + `fee`; "already paid" + Tallaby rider posts **fee only**.
- [ ] F-05c Send link: order page Confirm, WhatsApp share, auto-cancel cron (needs Q6).
- [ ] Update ROADMAP.md §6/§7, PLAN.md §23 manual E2E log.

## 11. Questions for the owner

1. **Order source:** Option B (new enum value `manual`, one small migration), or Option A (no migration; stored as a website order with a `manual` tag in metadata)?
2. **Shipping price:** may the seller type a different shipping price, or only the zone/rate price plus a "free shipping" discount? (Recommended for v1: zone price only, discount allowed.)
3. **Blocked phone:** if the seller enters a phone they blocked, refuse (they unblock first), or warn and let them continue?
4. **Payment:** are "COD" and "already paid to me" (fee only, Tallaby never holds the money) enough for v1? Are a deposit + COD split, and a later "pay online by link", out of scope?
5. **Starting stage:** should a manual order start as **Confirmed** (the seller has already spoken to the customer; Bosta auto-ship-on-confirm would then run at once), or as **New** like a website order? Should the seller still get the bell and push for orders they created themselves?
6. **Send order link (F-05c):** a pending order the customer confirms (stock held, auto-cancel after how many hours?), or a link that fills a cart so the customer checks out normally (no seller discount)?
7. **Fee:** confirm that manual orders pay the normal EGP 5 per delivered order (they follow §13 like every order; nothing changes in the fee code).
