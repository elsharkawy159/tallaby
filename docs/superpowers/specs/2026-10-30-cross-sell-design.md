# Cross-sell offers under the product: design note (ROADMAP.md F-32a)

**Status:** Draft for owner approval, 2026-10-30. No code has been written.
**Owner decisions already made (ROADMAP.md F-32, 2026-10-29):**
- On by default for every store, with a store-wide switch and an on/off switch per offer.
- The seller links offers in the product form. The discount defaults to 10 %; it can be a percentage or a fixed EGP amount.
- Offers show only for active, in-stock products of the same store and catalog.
- No automatic suggestions. If a product has no active offer, nothing is shown.
- A `cross-sell` element goes in the builder, with a fallback placement for stores whose product page lacks it.

**Short version:** the offer discount is a **seller-funded line discount**, computed in integer piastres inside `placeOrderFromCart` (`packages/lib/src/orders/place-order.ts`). It is applied only when the main product is in the same order. It uses the same mechanism as a seller coupon today: the line `total` goes down, and an order-level discount line keeps the totals consistent. Orders without an offer go through exactly the same code path and produce the same result. The fee formula does not change.

---

## 1. Money model

How `place-order.ts` builds an order today:

- Each line starts with `subtotal = total = price × qty`, `discountAmount = 0` (:411–456). `price` is the **cart snapshot** `cart_items.price`, written at add-to-cart from `getPriceFinal` (`apps/ecommerce/actions/cart.ts:321–323`).
- A **seller coupon** splits its discount over the eligible lines: `discountAmount = share` and `total = subtotal − share` (:542–556). It also adds an order-level `coupon` line to `orders.discounts` (:588–606). So `orders.subtotal` stays gross, and `totalAmount = subtotal + shipping − discount_amount` (:615).
- The fee is computed on the line totals after this (:562–586): a flat EGP 5, capped at the eligible total (`platform-fee.lib.ts`, `computePlatformFeePiastres`).
- On delivery, `sale` = Σ line `total` (`packages/db/src/wallet/credit-seller-on-delivery.ts:147`). So a discount that lowers line totals is paid by the seller.

**Cross-sell uses the same pattern.** A new pure function goes in `packages/lib/src/orders/cross-sell.lib.ts`, all in piastres:

```
applyCrossSellDiscounts(lines, offers) → per line { discountPiastres, discountedUnits, snapshot } + totalPiastres
```

Rules:

1. A line qualifies only when **all** of these hold:
   - its `cart_items.cross_sell_id` points to an offer that is `is_active`;
   - the store's `cross_sell_enabled` is on;
   - the offer belongs to this store's seller;
   - the offer's `offer_product_id` (and `offer_variant_id`, if set) matches the line;
   - **another line of the same order is the offer's main `product_id`** (any variant, quantity ≥ 1).
2. Discounted units = `min(offer line qty, main product qty)`: one discounted unit for each main unit (Q2).
3. Unit discount:
   - percent: `round(unitPiastres × pct / 100)`, with pct between 1 and 90;
   - fixed: `min(valuePiastres, unitPiastres − 1)`, so a unit never drops to 0 (Q4).
4. Line discount = unit discount × discounted units. It is applied in `place-order.ts` **after the lines are built (:456) and before coupons (:469)**: line `discountAmount += d`, `total −= d`.
5. Order discount line: `{ type: 'cross_sell', label: 'Bundle offer', amount: Σ d }`, inserted into `orders.discounts` next to the coupon lines, so that "Σ discounts = discount_amount" and :615 still hold. `'cross_sell'` is added to `OrderDiscountType` (`schema.ts:63–69`). This is TypeScript only; the jsonb parser keeps any type (`order-discounts.ts:147–180`).
6. Snapshot `order_items.metadata.crossSell = { offerId, mainProductId, discountType, discountValue, unitDiscountPiastres, discountedUnits }`. It sits next to the existing `metadata.platformFee` (:450, :585), and the code must merge into `metadata`, not overwrite it.
7. Never trust the client: the discount is recomputed from the DB at checkout. `cart_items.price` always stays the **full** price; an offer never writes a discounted price into the cart.

**No offer means no change:** if no line has a `cross_sell_id`, the function returns zeros, no `cross_sell` discount line is added, and every number is identical. A snapshot test proves this (PLAN.md §14).

## 2. Fee base, payout and `sale` credit

- **Fee:** the formula does not change. It is still a flat EGP 5 per seller per delivered order (PLAN.md §13.1), computed on the line totals after the seller's own discounts, as D2 already says for seller coupons (§13.2). The only effect is the existing cap: an order whose net total is under EGP 5 pays its net total.
- **`sale` credit (Tallaby-collected orders):** Σ net line totals, so the seller funds the offer. For seller-collected orders (COD by the seller's rider or Bosta), only the fee is posted, as today (`collection-party.ts`).
- Affiliate commission keeps using the order's gross `subtotal` (`place-order.ts:801–808`), unchanged (Q6).
- Refunds stay deferred (D3). A later line refund should use the line's net `total`.

## 3. Coupons and other interactions

- **Coupon stacking (proposal): coupons apply on top, on the net price.** Seller coupons today compute on `item.subtotal` and **overwrite** `total` (:499–501, :550–555). That would erase the offer discount. Change it so that:
  - eligibility and the percentage use `item.total` (the net after the offer);
  - `discountAmount = offer + coupon share`;
  - `total = subtotal − discountAmount`.
  Orders without offers give the same numbers, because `total == subtotal` there. A platform coupon (`sellerId` null) does not lower line totals and is not affected.
  Alternatives for the owner (Q3): "no coupon on offer lines", or "the better of the two".
- **Quantity changes:** the discounted unit count is recomputed at every summary and at checkout (rule 2).
- **Main product removed:** the offer line stays in the cart at full price. The cart sheet shows "Add <main> again to get −10 %". `cross_sell_id` is kept, so adding the main product back restores the discount.
- **Offer product out of stock, trashed or inactive:** the card is not shown. At checkout, existing rules refuse a product that is not active (:297–304; a trashed product is `draft`) and stock that is short (`decrementStock`, :698). If the **offer row** is turned off or deleted (`ON DELETE SET NULL`) between add and checkout, the line is charged at full price; the summary shows this before placing.
- **Variants:** `offer_variant_id` null means any variant of the offer product (the card shows the variant picker, and the price shown is the chosen variant's). If it is set, only that variant qualifies. The main product matches on any variant.
- **Duplicate lines:** `addToCart` merges the same product + variant into one line (`cart.ts:334–363`). Accepting an offer on an item already in the cart sets `cross_sell_id` on that line; the units cap (rule 2) still limits the discount.
- **Several offers on one main product:** each offer line is evaluated on its own. Two main products offering the same item: take the bigger discount, then cap by the combined main quantity (tested).
- **Multi-store catalogs:** a cart belongs to one store (`carts.store_id`, `store_seller_id`), so offers are checked against the cart's store. Both products must be in that store's catalog (`storeSellsProduct` / `cartProductsOutsideStoreCatalog`, already called at `apps/ecommerce/actions/order.ts:107–112`).
- **Marketplace (tallaby.com):** out of scope in v1. The function runs only when `orderSource === 'storefront'` and `cart.storeId` is set (Q5).
- **Manual orders (F-05):** not applied in v1; manual orders have their own discount.

## 4. Data model and migration sketch

Migration `NNNN_cross_sell.sql` (next free number at build time; `0126`+ today). It is additive and idempotent. Apply it on staging, then on production **before** the deploy, because the Drizzle queries on `stores` and `cart_items` select every column.

```sql
CREATE TABLE IF NOT EXISTS public.product_cross_sells (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id        uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  store_id         uuid REFERENCES stores(id) ON DELETE CASCADE,   -- NULL = every store of the seller (Q1)
  product_id       uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  offer_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  offer_variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  discount_type    text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value   numeric(10,2) NOT NULL CHECK (discount_value > 0),
  is_active        boolean NOT NULL DEFAULT true,
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_cross_sells_not_self CHECK (product_id <> offer_product_id),
  CONSTRAINT product_cross_sells_percent CHECK (discount_type <> 'percent' OR discount_value <= 90)
);
CREATE UNIQUE INDEX IF NOT EXISTS product_cross_sells_unique
  ON product_cross_sells (seller_id, coalesce(store_id, '00000000-0000-0000-0000-000000000000'::uuid),
                          product_id, offer_product_id,
                          coalesce(offer_variant_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX IF NOT EXISTS product_cross_sells_product_idx
  ON product_cross_sells (product_id) WHERE is_active;
ALTER TABLE product_cross_sells ENABLE ROW LEVEL SECURITY;   -- server-only, no policies (rule 6)

ALTER TABLE stores     ADD COLUMN IF NOT EXISTS cross_sell_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS cross_sell_id uuid
  REFERENCES product_cross_sells(id) ON DELETE SET NULL;
```

- **Deviations from the ROADMAP F-32b sketch** (Q1):
  - It adds `seller_id` and makes `store_id` nullable. The product form is seller-level, not per store, and a product can be in several stores' catalogs.
  - The order item gets **no new column**: the snapshot goes in the existing `order_items.metadata` (rule 6 above). The F-32f report can read the JSON, or add a column later.
- A per-row trigger (or the server-action check) makes sure both products have `seller_id = product_cross_sells.seller_id`.
- Mirror everything in `schema.ts` and `relations.ts` (rule 6). Do not run `drizzle-kit generate`.

## 5. Display: order, invoice/print, export

- **Storefront order confirmation and the dashboard order panel:** the line shows `price × qty`, then "Bundle offer −X" (from `metadata.crossSell` / `discountAmount`) and the net. The totals show a "Bundle offer" row taken from `orders.discounts`. The order query (`apps/dashboard/app/(main)/orders/orders.query.ts`) must also select `orderItems.discountAmount`.
- **Invoice** (`apps/dashboard/app/print/orders/print-documents.tsx:115–190`): today it prints `price` and line `total` (:166–169) and one order `discount` row (:186). A seller coupon line already shows total < price × qty with no explanation. Add `discountAmount` to `PrintOrderLine` (`print-orders.types.ts:15–23`, filled in `print-orders.server.ts:159`) and print "−X (offer)" under the price. This also fixes the coupon case. The packing slip has no prices and does not change. The door amount (`amountToCollect`) is `totalAmount`, already net.
- **Export** (`apps/dashboard/app/(main)/orders/orders-export.lib.ts:92`): the order `discount` column already includes the offer. Optionally add an "offer discount" column.
- **Seller wallet history:** no new entry type. The `sale` row is net, as with coupons.

These print and export files currently have other agents' uncommitted changes, so this work must start after those are committed.

## 6. Storefront placement

- **Builder element (rule 17):** a new product element `productCrossSell` in `PRODUCT_ELEMENT_TYPES` (`packages/store-sections/src/elements/product-elements.tsx:27–39`), with a host hook `renderProductCrossSell` in `RenderContext` (`core/types.ts:455–466`, next to `renderProductBuyBox`). Its still rendering shows a sample card in the editor; in public mode it renders nothing when the hook returns nothing (no offers). It is added to the product-page templates (`templates/classic/product.ts`, `templates/atelier/product.ts`, …) under the buy box, with a stable `props.field`, the `EXPECTED` and field-name snapshots updated, and authored by the tree-sections spec §6.
- **Fallback:** existing stores keep their own copies of the product page, and a code change never changes them (rule 17). So, like `renderLiveViews` and `renderOfferCountdown` today (:737–752), the buy box draws the cross-sell block **below itself** when the page's tree has no `productCrossSell` node. A flag on the render context, set when a page contains the node, prevents drawing it twice.
- **Cart sheet:** under each main product line, show its not-yet-added offers (one row each, "Add −10 %"). Lines that already carry an offer show the discount, or the "add main again" hint.
- **Checkout summary:** `buildBaseSummary` (`apps/ecommerce/actions/checkout.ts:123–150`) and the coupon summary (`validateCoupon`, `apps/ecommerce/actions/coupons.ts:87`; `buildSummaryWithCoupon`, `lib/coupon-utils.ts:315`) must call the same `applyCrossSellDiscounts`, so the price shown is the price charged.
- **Add action:** `addToCart({ productId, variantId, crossSellId })`. The server checks that the offer belongs to the cart's store seller, is active and points at this product or variant; otherwise the item is added with no offer. Both languages (ar/en) in `apps/ecommerce/messages`.

## 7. Caching

- The offers shown on a product page (offer product summary, price, stock) use `createCachedQuery` with a new tag `storeTags.crossSells(sellerId, storeId)` in `packages/cache/src/tags.ts` (rule 8: the seller id is in every key and tag). They also take `productTags.inventory(offerProductId)` and `productTags.detail(offerProductId)`, so price and stock changes refresh them.
- The dashboard offer edits and the store switch invalidate `storeTags.crossSells` for every store of the seller (the offer may be for all stores).
- The checkout and cart computations are **never** cached (rule 8).

## 8. Dashboard

- Product form "Frequently bought with": pick a product or variant (only the seller's own active products), set the discount (10 % prefilled, or a fixed EGP amount), on/off, order. Server action in `products/[productId]/edit/cross-sell.server.ts` (do not add to `actions/products.ts`, rule 14). It checks that **both** products belong to the session seller and, if a store is chosen, that the store is the seller's.
- Store settings: a "Cross-sell offers" switch (`stores.cross_sell_enabled`), using `requireStore(storeId, { forWrite: true })`.

## 9. Tests

- **Unit (`cross-sell.lib.test.ts`):**
  - no offers → zero;
  - percent and fixed rounding in piastres;
  - discounted units = min(offer qty, main qty);
  - main product removed → 0;
  - offer inactive, store switch off, wrong seller, wrong variant → 0;
  - fixed discount never reaches 0 per unit;
  - two offers for the same product.
- **`place-order` integration (staging):**
  - an order without offers gives identical numbers (snapshot);
  - with an offer: line `total`, `discountAmount`, `orders.discounts` contains `cross_sell`, `totalAmount`, and the fee is still 500 piastres (or capped);
  - offer + seller coupon stack on the net and Σ discounts = `discount_amount`;
  - the main product removed between summary and order → full price;
  - offer product out of stock → order refused (existing);
  - offer product trashed → refused;
  - a client sending a lower `price` or a foreign `crossSellId` → ignored.
- **Delivery credit:** Tallaby-collected → `sale` = Σ net; seller-collected → fee only.
- **Summary parity:** `buildBaseSummary` and the coupon summary match `placeOrderFromCart` for the same cart.
- **Store sections:** the element still renders in the editor, renders nothing in public with no offers, the fallback draws once, and the `EXPECTED` and field-name snapshots are updated.
- **Cache keys:** contain the seller id.

## 10. Tasks (after approval)

- [ ] F-32b Migration plus `schema.ts`/`relations.ts`. Staging first, then production before the deploy.
- [ ] F-32e-1 `cross-sell.lib.ts` plus unit tests.
- [ ] F-32e-2 `place-order.ts`: apply the offers before coupons; coupons on the net; `cross_sell` discount line; metadata merge; snapshot test.
- [ ] F-32e-3 Checkout and coupon summaries use the same function.
- [ ] F-32c Dashboard product form and store switch, with ownership checks.
- [ ] F-32d Storefront: cached offer query, `productCrossSell` element and template updates, buy-box fallback, cart sheet, `addToCart` with `crossSellId`, i18n.
- [ ] Display: order panel, confirmation page, invoice line discount, export.
- [ ] ROADMAP.md §6/§7, PLAN.md §23 manual E2E (phone and desktop, ar and en).
- [ ] F-32f Report (P2, later).

## 11. Questions for the owner

1. **Offer scope:** one offer list per **seller** that applies in every store, with an optional single store (this note), or strictly per store as written in ROADMAP F-32b?
2. **How many units are discounted:** one discounted offer unit per main unit (buy 2 power banks → 2 cheaper cables), or only one discounted unit per order?
3. **Coupons:** may a store coupon stack on top of an offer (calculated on the discounted price; recommended), or is it either one or the other?
4. **Discount limits:** a percentage between 1 and 90 % and a fixed amount below the item price (no free gifts), or should a 100 % "free gift" be allowed?
5. **Where it shows:** store websites only in v1 (recommended), or also on tallaby.com product pages?
6. **Affiliate commission** stays on the order's gross subtotal (today's rule). Keep it?
7. **If an offer is turned off** after the customer added it, the item is charged at full price, and the checkout summary shows this before the order is placed. OK?
