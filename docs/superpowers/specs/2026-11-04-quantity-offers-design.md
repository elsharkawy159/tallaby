# Quantity offers: design note (ROADMAP.md F-07a)

**Status:** Going ahead on the recommended settings (owner, 2026-11-04). Follows the cross-sell note, `2026-10-30-cross-sell-design.md`, and its code.

**Short version:** a quantity tier is a **seller-funded line discount**, computed in integer piastres on the server inside `placeOrderFromCart`. It uses the mechanism cross-sell already uses: the line's `price` and `subtotal` stay full, `discountAmount` goes up, `total` goes down, and `orders.discounts` gets a line, so "sum of discounts = `discount_amount`" and `totalAmount = subtotal + shipping − discount_amount` still hold. An order with no offer goes through the same code and gets the same numbers.

## 1. How a tier applies

- A product has tiers such as "2 = −10%, 3 = −20%". A tier is a percentage (1 to 90) or a fixed EGP amount per unit, which must be below the price.
- **Units count across variants:** 1 red + 1 blue of the same product reaches the "2" tier. Each line's discount is worked out on its own unit price.
- **The highest tier reached wins**, and it covers **every unit** of that product in the order, not only the units above the threshold. "Buy 2, save 10%" means both are 10% off.
- **Unit discount:** percent is `round(unitPiastres × pct / 100)`; fixed is the amount in piastres. Either way it stops at `unitPiastres − 1`, so a unit never reaches 0 (same as `crossSellUnitDiscountPiastres`). Fixed tiers can be checked against the price only when saved, and a variant or a later price change can be cheaper, so this cap is what actually holds at checkout.
- **Read fresh at every summary and at placement, never cached and never from the client.** The cart stores the customer's quantity and the full price, never a tier. So a tier that was turned off, changed or deleted after the customer added the item charges the **current** tier, or the full price if there is none. The checkout summary shows this before the order is placed.
- **Ownership:** a tier counts only when its `seller_id` is the store's seller. A row pointing at this product from another seller is ignored.

## 2. Where it runs

- Store website orders only (`orderSource === 'storefront'` with `cart.storeId`), like F-32. The marketplace is out of scope.
- **Manual orders (F-05) do not get tiers.** They use `orderSource === 'manual'` and the seller's own `sellerDiscount`, which they keep.
- **Stock and unlimited stock (F-51):** a tier changes no stock logic. `decrementStock` still takes the line's quantity, and refuses when short. An untracked product skips it as today. The picker hides tiers above the selected variant's stock.
- **Simple checkout (F-64f):** changing an item count on checkout already re-prices through `recalculateCheckoutSummary`, so the tier follows the new count. `updateCartItem` checks stock, and the server decides again at placement.

## 3. Stacking order

1. **Full price:** the cart's price snapshot × quantity. This is `orders.subtotal`.
2. **One line offer per line, the biggest:** a line takes the single biggest of its quantity tier and its cross-sell discount. They do not add up. Ties go to the quantity tier. A seller who set both never gives away more than they set on one, and the customer always gets the better one.
3. **Seller coupon on the net price:** as F-32 does today, the coupon's eligibility, minimum and percentage use the line `total` after step 2, and `discountAmount` is the offer plus the coupon's share.
4. **Manual seller discount** and **admin overrides** stay as they are. Neither runs with offers: manual orders get no offers, and the override keeps coupon lines and replaces the rest of the coupon-side total. Line offers sit beside it, as cross-sell does.

Shipping thresholds (zone free-over, store free delivery, Tallaby's cart threshold), the store's minimum order (F-13b) and `isStorefrontCheckoutMethodAllowed`'s COD limit keep what they read today: thresholds and the minimum read the gross items subtotal, and the COD limit reads the final total. Cross-sell already works this way.

## 4. Fee and seller earning

- **The platform fee stays flat per seller per order** (`PLAN.md` §13.1; F-55 after the USD switch). `computeOrderLineFees` already takes line totals after the seller's own discounts, and only uses them for the existing cap (an order whose net is under the fee pays its net) and to split the fee over the lines. **Offers do not change the fee formula.**
- **Seller earning** is the line `total` less that line's share of the fee, as with a coupon or a cross-sell offer.
- **Affiliate commission** stays on the order's gross `subtotal` (`place-order.ts`, unchanged, same as F-32 Q6).
- **Customer wallet** pays `totalAmount`, unchanged. **Refunds** stay deferred (`PLAN.md` D3).

Nothing here changes money beyond the line discount. No ledger, wallet or fee code changes.

## 5. Showing it

- `orders.discounts` gets `{ type: 'quantity_offer', label: 'Quantity offer', amount }`. `'quantity_offer'` is added to `OrderDiscountType` (TypeScript only; the jsonb parser keeps any type).
- `order_items.metadata.quantityOffer = { offerId, minQuantity, discountType, discountValue, unitDiscountPiastres, units }`, merged next to `platformFee`.
- Checkout summary and order pages show the line with a translated label by type. The same server function prices the cart sheet, the checkout summary, the coupon summary and the order, so the number shown is the number charged.

## 6. Data

Migration `0147_product_quantity_offers.sql`: `product_quantity_offers` (`seller_id`, `product_id`, `min_quantity` ≥ 2, `discount_type`, `discount_value`, `is_active`, `sort_order`), unique per seller, product and quantity, RLS on with no policies. The storefront reads it through Drizzle on the server, so it needs no policy.

## 7. Tests

Pure: tier choice, validation, unit discount, best-of with cross-sell. Integration on staging through the real `placeOrderFromCart`: no offer gives the same numbers, a tier applies, a tampered client value, a foreign seller's tier, a coupon on top, a changed tier, a tier off, unlimited stock, and an order total that matches the summary for the same cart.
