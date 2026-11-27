# Product bundles (حزم المنتجات) — ROADMAP.md F-07f

Owner 2026-11-27: "let's work on bundles". Decisions the same day: bundle items
may be **draft** products (not Trash); v1 is **fixed variant per item, at most
10 items, no pre-order or digital items**; the migration may be applied on
**staging** when the code is ready, production only with a separate approval.

## 1. Model

- `products.is_bundle boolean NOT NULL DEFAULT false` (a flag, not a new `product_type` value).
- `product_bundle_items` (server-only, RLS on, no policies): `id`, `seller_id`, `store_id`,
  `bundle_product_id`, `item_product_id`, `item_variant_id` (nullable), `quantity` (1–99),
  `position`, `created_at`; unique `(bundle_product_id, item_product_id, item_variant_id)`
  NULLS NOT DISTINCT; FKs ON DELETE CASCADE.
- Guard triggers (pattern: 0171 `parent_guard`), not composite FKs:
  - item row: bundle has `is_bundle`, same seller and store; item same seller and store,
    not a bundle, not the bundle itself, not in Trash/purged; variant belongs to the item;
    an item with variants must name one;
  - `products`: can't turn `is_bundle` on for a product that is an item somewhere, can't
    turn it off while it still has items;
  - `product_variants`: no variants on a bundle;
  - AFTER DELETE of an item row caused by its product being deleted → the bundle goes `draft`.
- `order_items.bundle_items jsonb` (CHECK `jsonb_typeof = 'array'` when not null): the
  snapshot `[{productId, variantId, sku, name, variantName, quantity}]` written at order time.

## 2. Stock

- A bundle row never holds stock: a BEFORE trigger forces `track_stock = false` while
  `is_bundle` (like 0179 for pre-order), so code that doesn't know bundles treats it as
  unlimited and never throws.
- Availability is computed: `min(floor(item stock / item qty))`; untracked item = unlimited;
  trashed item, or an item with variants but none chosen = 0. `applyBundleAvailability`
  overlays `trackStock: true, quantity: available` on bundle rows wherever the storefront
  reads stock (badges, max quantity, JSON-LD, feeds).
- At order time the bundle line expands into its items (bundle qty × item qty, merged per
  stock row) and goes through the existing atomic `decrementStock`. `stock.ts` does not change.
- 0125's `order_items_link_stock_movement` is replaced (`CREATE OR REPLACE`, old match kept
  word for word) with one more UPDATE that also links movements of the items in
  `NEW.bundle_items`.
- Cancel/return restores from the order's snapshot (not the bundle's current items), through a
  shared helper used by every restore path. Idempotency stays with the existing status claims.

## 3. Cart, checkout, money

- The cart line is a normal line (`product_id` = the bundle, no variant). Price from the bundle
  on the server. Quantity offers, coupons, automatic discounts, cross-sell, customer fields treat
  the bundle as one product; `min_order_quantity` is the bundle's own. A bundle can't be a free gift.
- One `order_items` row per bundle line + `bundle_items` snapshot, so shipping, fulfillment,
  invoices, Sheets, CAPI, refunds and the fee base are unchanged. The fee is the flat per-order
  fee; no ledger code changes. Piastres as everywhere.
- Checkout refuses a bundle with no items or with an item outside the store.

## 4. Seller and shopper

- Product **edit** page: "This product is a bundle" section next to Quantity offers (item picker:
  this store's products, variant, quantity; shows each item's stock and the bundle's availability).
  Save replaces items and sets `is_bundle` in one transaction. Products list gets a bundle filter.
- App Center: `bundles` card (`settingsRoute: "feature_page"`, `opens: "bundles"`).
- Storefront: "What's in the bundle" block in the buy box (`product-hooks.client.tsx`, like
  quantity offers); the cart line shows "Includes: …"; the order detail and packing slip list
  the snapshot. Feeds get the availability and `is_bundle`. MCP `get_product` returns `isBundle`
  and its items, read-only.

## 5. Tasks (one reviewed commit each)

1. Migration `0188_product_bundles.sql` + `schema.ts`/`relations.ts` + CLAUDE.md rule 6;
   pure `packages/lib/src/products/bundles.lib.ts` (+ tests); `packages/db/src/inventory/order-lines.ts`
   (`orderLineStockLines`, `mergeStockLines`, + tests: a line without a snapshot gives exactly
   today's single line).
2. Restore paths use the helper (dashboard `orders.server.ts`, ecommerce `actions/order.ts`,
   `customer-order-actions.server.ts`, `cod-deposit.server.ts`, `manual-order.server.ts`) and
   checkout expands bundles (`place-order.ts`, `actions/cart.ts`, `cart-stock.lib.ts`). **Ship 2 as
   one unit** (a rollback of only one half leaks stock).
3. `bundles.server.ts` (load, availability, save with store ownership) + dashboard edit section +
   products filter + App Center card.
4. Storefront block, availability overlay in product/listing/feed loaders, cart line, order detail,
   packing slip, MCP read.
5. DB integration tests (`TEST_DATABASE_URL`): each item decremented; one item short rolls the
   order back; the same item as a line and inside a bundle; an unlimited item; movements linked;
   cancel restores from the snapshot after an edit; a test order takes no stock; guard triggers.

**Must not change (rule 3):** `stock.ts` logic, fee and ledger code, the old 0125 match,
non-bundle pricing, shipping quotes, `apps/dashboard/actions/products.ts`.

**Deploy:** 0188 lands on staging, then production (owner approval), **before** the code, since
Drizzle selects every `products` and `order_items` column.
