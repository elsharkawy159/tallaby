# Unlimited stock (ROADMAP.md F-51)

A "don't track stock" setting for digital, made-to-order and service products. Migration `0138`.

## Decisions

- **`products.track_stock boolean NOT NULL DEFAULT true`.** Not a magic quantity. Every existing row stays tracked and behaves as before.
- **Stored counts are never touched.** `products.quantity` (NOT NULL, `>= 0`) and `product_variants.stock` keep their values. Switching tracking back on carries on from the old count.
- **Variants inherit from the product.** There is no per-variant switch: a seller selling a service in two sizes doesn't count either. `product_variants.stock IS NULL` keeps its existing meaning on a tracked product (`restoreStock` skips it, `decrementStock` refuses it). This is unchanged, so a NULL-stock variant is not "unlimited" for shoppers: the setting is the only way to get that.
- **In memory, unlimited is `Infinity`** (`productPricing().stock`, reorder, preview). Never stored and never sent as JSON feed data. Every `stock > 0`, `stock <= N` and `max={stock}` then reads right with no extra branch, and `lowStockLeft` already returns null for it. Only code that prints the number needs a check.
- **Saved through `saveProductSocialProof`**, next to the low-stock alert, so `actions/products.ts` stays untouched (CLAUDE.md rule 14). A new product is therefore inserted tracked and flipped straight after: its first stock history row can exist, as a true record of the entered count.
- **The stock primitives enforce it**, so a caller can't forget. `decrementStock`, `restoreStock` and `ensureStockAtLeast` guard the UPDATE with `track_stock`. When a guarded UPDATE misses, one read tells "untracked" (skip, no result) from "short" (throw), so tracked orders cost no extra query. No result means no stock cache invalidation, and nothing changed.
- **Turning tracking off fires open back-in-stock alerts**, since the product can now be bought.

## Every stock reader

| Reader | Where | Unlimited behaviour |
| --- | --- | --- |
| Stock primitives | `packages/db/src/inventory/stock.ts` | No write, no result, never `InsufficientStockError` |
| Stock history, low-stock bell | triggers `products_stock_movement`, `product_variants_stock_movement` (0138 replaces 0125's) | Write nothing |
| Other DB functions | checked on staging: only those triggers and `notify_seller_low_stock` read stock | — |
| Checkout | `place-order.ts` through `decrementStock` | Order goes through, no write |
| Cart, checkout validation | `apps/ecommerce/actions/cart.ts`, `checkout.ts` | Never short |
| Cancel | `apps/ecommerce/actions/order.ts`, dashboard `cancelOrder` through `restoreStock` | No write |
| Order flow | `orders.server.ts` `takeStockAgain`, `applyStockMove`, `loadStockShortage` | Primitives skip it; never listed as short |
| Reorder | `apps/ecommerce/lib/reorder/*` | No cap, never "out of stock" |
| Store and marketplace product page | `product-page.lib.ts` `productPricing`, `variantHasStock`, badges, pickers, buy boxes, restock form | Never out of stock, no count, no restock form |
| Store cards, catalog | `catalog.server.ts` `toSummary`, `product-detail.lib.ts`, `store-sections` elements | `inStock`, no "N left" |
| Marketplace cards, cart stepper | `product-card-actions.tsx`, `storefront-cart.client.tsx` | No cap |
| Marketplace filter | `actions/search.ts` `inStock` | Included |
| SEO | `product-structured-data.tsx`, `structured-data.ts` | `InStock`, no stock count |
| Low-stock badge (F-34) | `store-sections/core/low-stock.ts` | Null for `Infinity`; the form hides the setting |
| Low-stock mail | `apps/backend/.../seller-emails.ts` | Skipped |
| Back-in-stock (F-23) | `stock-alerts.lib.ts`, `stock-alerts.server.ts` | Subscribe refused as "in stock"; open alerts are claimed |
| Inventory page (F-10) | `inventory.data.ts`, `inventory.server.ts` | Not listed, restock refused; the history panel shows the existing "not tracked" line |
| Dashboard tabs, sort | `products-list.query.ts` | Not in low or out tabs; last in "stock: lowest first" |
| Dashboard card, table | `StockBadge` | "Unlimited" |
| Dashboard home | `home.queries.ts` low-stock count | Not counted |
| Bulk edit (F-24) | `bulk-edit.lib.ts` | Stock change is "no change" |
| Excel update | `excel-update.lib.ts` | Stock cells exported empty and ignored on upload |
| Excel export | `lib/product-excel.ts` | Quantity empty |
| Product feed, Meta catalog | `product-feed.*`, `app/api/meta/catalog/route.ts` | "in stock" |
| MCP tools | `agent-products.*`, `apps/backend/src/mcp/tools/products.ts` | `trackStock` on create, update, get, search; `maxStock` never matches it |
| Store editor preview, picker | `preview-product.*`, `editor.data.ts`, admin editor data | In stock |
| Admin | `external-orders.ts`, `products-list.ts` stock filter | Orders allowed, "Unlimited" in the picker, filter correct |
| Product form | `inventory-section.tsx`, `variants-editor.tsx`, `social-proof-section.client.tsx` | A switch; hides quantity, variant stock and the low-stock alert |

## Left as is

- **Bulk create from Excel, and AI or Shopify import** create tracked products. A sheet has no tracking column; `actions/products.ts` is closed to additions.
- **Admin product detail and analytics** still print the stored count (read only, staff screens).
- **The MCP `quantity` input** may still write the stored count of an unlimited product. It has no effect until tracking is back on, and no history row is written.

## Deploy

Apply `0138` before deploying (the product queries select every column), staging then production.
