# F-87c — store-scoped catalog code, in slices

> Part of [`stores-separation.md`](stores-separation.md) §4 Phase B (ROADMAP.md F-87c). Written 2026-11-10.
> **Rule for every slice:** it can be committed on its own with **both switches off and no behaviour change** for a single-store seller or a multi-store seller in `catalog_mode = 'all'`. Each slice reads the `stores_catalog_split` switch and branches through the one shared condition `productInStore` (`packages/lib/src/stores/store-scope.server.ts`). No migration in F-87c.
> **Status:** slice 1 committed (31b21e5f); slice 2 committed (79b24d1d); slice 3 built 2026-11-10 (uncommitted, §5). Slices 4–6 planned.

Abbreviations: D = `apps/dashboard`, E = `apps/ecommerce`, L = `packages/lib/src`, B = `apps/backend/src`. Scope today: **S** = `seller_id`, **CM** = `stores.catalog_mode`, **SP** = `store_products`, **N** = none (id or status only). Line numbers are from the 2026-11-10 working tree, after slice 1.

## 0. The shared primitive

`productInStore(storeId, { catalogSplit, scope })` returns a Drizzle `SQL` condition on `products`:

| Switch | `scope: 'shown'` (default; storefront, agent) | `scope: 'managed'` (dashboard) |
|---|---|---|
| off | store not deleted, same seller, and `catalog_mode = 'all'` or a `store_products` row | store not deleted, same seller (today's account catalog) |
| on | `products.store_id = store` and same seller | same |

`storeHasProduct` / `assertStoreProduct` run it for one pair, so the single-row guard and the list/bulk WHERE clauses cannot drift. A malformed store id renders `false`. Why two scopes before the split: `/products` lists every account product whichever store is selected; checking "shown" would stop a seller editing a product that their selected store (or no store) shows. Production has 0 selected-mode stores today (dry run), but the rule must hold anyway.

## 1. Slices

| # | Slice | Contents | Done when |
|---|---|---|---|
| 1 | **Primitive + dashboard product writes** | `productInStore`; `storeHasProduct` on it; D `lib/products/product-store.server.ts` (`requireProductStore`, `requireStoreProduct`); explicit `storeId` on create, update, status, delete, trash, restore, purge, bulk edit (preview/apply/undo), bulk publish, URL/Excel/file import; `products.store_id` written on create; the store reaches clients through a `/products` layout provider (selected store). | Built 2026-11-10. |
| 2 | **Dashboard product pages + route move** | `/stores/[storeId]/products/*` (list, add, edit, trash, inventory, bulk edit, categories-brands, category order, excel update, from-file), redirects from `/products/*` to the selected store; the layout provider replaced by the `[storeId]` param; list/count/export/trash reads (`products-list.query.ts`, `listTrashedProducts`, `countTrashedProducts`, `getProduct`) filter with `productInStore(managed)`; sidebar count and dashboard search; `forWrite` (store read-only) decision for archived/suspended stores. | Built 2026-11-10 (79b24d1d). |
| 3 | **Dashboard secondary product features** | inventory restock, Excel update (SKU match per store), quantity offers, cross-sells (same store, not same seller), category order, social proof, reviews/questions answers, `createProductVariant`, AI source mark, manual order product search, coupons product search, ads product, reports, home queries, catalog share. | Built 2026-11-10 (§5). |
| 4 | **Storefront reads and caches** | `E/lib/storefront.server.ts` (`storeShowsProduct`, `storeHasProducts`, `getStorefrontCategories`), `E/actions/products.ts` (`getProducts`, `getProductBySlug` + related-products leak, slug lookup per store), store-site catalog/data, search, reviews/brands, reorder, back-in-stock, preview product, campaign product options; cache keys and tags gain `storeId` (new `productTags.store`; `ProductCacheSnapshot.storeId`; `invalidateProductInventory`). | With the switch on (test DB) store A never returns B's product. |
| 5 | **Cart and checkout** | `addToCart` / `storeSellsProduct`, `cartProductsOutsideStoreCatalog`, `place-order.ts` own `product.store_id = cart.store_id` check, line-discount gifts, cross-sell and quantity offers on the cart. | Checkout tests pass both ways. |
| 6 | **MCP, agent, AI builder, feeds, sitemap** | `agent-products.server.ts` (create in store, `skuTaken`/`uniqueSlug` per store, trash/restore pass `inStore`), MCP instruction text, `list_stores` count, AI builder `applyCatalog`/`activateProducts`, product feed, sitemaps, Meta catalog route, marketplace leftovers (`NOT EXISTS copy` rule, delete `E/actions/search.ts`). Overlaps F-87e: the agent part may be done there instead. | A grant limited to store A cannot read or write B. |

Order follows the plan: writes first (they carry the store id), then the reads that depend on the URL, then the shopper side. Slices 4 and 5 can run in parallel with 3.

## 2. Inventory

R = read, W = write. "Tag" = cache key/tag used (`createCachedQuery`/invalidation). Slice = where it is changed.

### 2.1 Dashboard

| Site | R/W | Scope today | Tag / invalidation | Slice |
|---|---|---|---|---|
| `D/actions/products.ts:757` `bulkInsertProductsAction` | W (via `createProduct`) | S | — | 1 ✔ |
| `D/actions/products.ts:875` `bulkCreateProductsAction` | W (via `createProduct`) | S | — | 1 ✔ |
| `D/actions/products.ts:944` `getProduct` | R | S | — | 2 |
| `D/actions/products.ts:1109` `createProduct` | W | S (+ `products.store_id` now) | `invalidateProduct` (`productTags.seller`) | 1 ✔ |
| `D/actions/products.ts:1351` `updateProduct` | R/W | S | `invalidateProduct` | 1 ✔ |
| `D/actions/products.ts:1631` `toggleProductStatus` | R | S | — (no callers) | 1 ✔ |
| `D/actions/products.ts:1659` `setProductPublished` | R/W | S | `invalidateProduct` | 1 ✔ |
| `D/actions/products.ts:1743` `createProductVariant` | W | S | — | 3 |
| `D/actions/products.ts:1804,1947+` questions/answers, `getSellerQuestions` | R/W | S | — | 3 |
| `D/actions/products.ts:1947` `deleteProduct` | W | S | `invalidateProduct` (no callers) | 1 ✔ |
| `D/actions/ads.ts:108,170` ad requests | R | S | — | 3 |
| `D/actions/coupons.ts:239,302` coupon product search/save | R | S | `couponTags.seller` | 3 (F-87k) |
| `D/actions/reviews.ts:99` `getProductReviews` | R | S | — | 3 |
| `D/actions/brands.ts:81,167`, `categories.ts:73,137` | R | N (global) | — | none (Tallaby taxonomy) |
| `products/_components/products-list.query.ts:39-291` list, ids, page, tab counts, categories, options | R | S | — (uncached) | 2 |
| `products-list.query.ts:269` `loadOwnProductStatuses` | R | S + `inStore` | — | 1 ✔ |
| `products-list.server.ts:32,46` export, list ids | R | S | — | 2 |
| `products-list.server.ts:62` `bulkSetPublishedAction` | W | S + `inStore` | via `setProductPublished` | 1 ✔ |
| `_components/product-store-links.data.ts:28-40` | R | CM/SP | — | 2 (removed after split) |
| `_components/product-views.data.ts:48-55` | R | S | — | 3 |
| `bulk-edit/bulk-edit.server.ts:102,190,203` load/write rows | R/W | S + `inStore` | `invalidateProduct`, `invalidateProductInventory` | 1 ✔ |
| `excel-update/excel-update.server.ts:103-301` | R/W | S (SKU per seller) | `invalidateProduct`, `invalidateProductInventory` | 3 |
| `inventory/inventory.server.ts:33-67` `restockAction` | R/W | S | `invalidateProductInventory` | 3 |
| `inventory/inventory.data.ts:59,117` | R | S | — | 2 |
| `category-order/category-order.server.ts:50-139` | R/W | S | `invalidateSellerProducts` | 3 (taxonomy part F-87d) |
| `categories-brands/categories-brands.data.ts:21,35,49` | R | S | — | F-87d |
| `categories-brands/categories-brands.server.ts:126-358` | R/W | S | `invalidateSellerProducts` | F-87d (`setProductSellerTaxonomy` product check: 3) |
| `social-proof/social-proof.data.ts:14`, `.server.ts:23,65` | R/W | S | `invalidateProduct`, `invalidateSellerProducts`, `reviewTags.seller/product` | 3 |
| `[productId]/edit/cross-sell.server.ts:41,81` | R/W | S / N | `invalidateStoreCrossSells` | 3 |
| `[productId]/edit/quantity-offers.server.ts:57` | R/W | S | `invalidateProductQuantityOffers` | 3 |
| `add/ai/ai-source.server.ts:29` `markProductAiAssisted` | W | S | — | 3 |
| `add/from-file/from-file-run.server.ts:235,354` SKU check, top category | R | S | — | 3 (SKU per store) |
| `add/from-file/from-file-run.server.ts:416` `runBulkBatch` | W (via `createProduct`, `setProductPublished`) | S | — | 1 ✔ |
| `add/from-file/from-file.server.ts` `addBatchAction` | W | S | `revalidatePath` | 1 ✔ |
| `trash/trash.server.ts:31,43,56` trash/restore/purge | W | S + `inStore` | `invalidateProduct` | 1 ✔ |
| `trash/page.tsx:23` `listTrashedProducts` | R | S | — | 2 |
| `orders/new/manual-order.server.ts:55-82` | R | S + CM/SP | `invalidateProductInventory` | 3 |
| `orders/orders.server.ts:235,272,505` stock on order changes | R/W | N / S | `invalidateProductInventory` | 5 (restock uses split map: F-87m) |
| `orders/pending-carts/pending-carts.query.ts:96` | R | N | — | none |
| `marketing/discounts/discount-rules.server.ts:54,61` | R | S | — | F-87d |
| `marketing/catalog/catalog-share.server.ts:33-120` | R | S + CM/SP | — | 3 |
| `reports/reports.server.ts:165,178` | R | S + CM/SP | `dashboard:store-report:v2`, `storeTags.reports(seller, store)` | 3 |
| `_components/home.queries.ts:42,141,334,434` | R | S | — | 3 |
| `stores/[storeId]/settings/catalog.*`, `settings/page.tsx:16,56` | R/W | CM/SP | `invalidateStoreCatalog` | removed in F-87n |
| `website/seo/seo.data.ts:55`, `seo/ai/ai-seo.server.ts:86`, `website/design/page.tsx:40` | R | CM | — | 4 |
| `(builder)/stores/[storeId]/editor/server/editor.data.ts:80,178`, `editor.server.ts:126`, `packages/store-editor/src/lib/editor-data.lib.ts:16` | R | S + CM/SP | — | 4 |
| `components/dashboard/sidebar.server.ts:50` | R | S | — | 2 |
| `components/layout/dashboard-search.server.ts:52` | R | S | — | 2 |
| `ai-builder/builder-items.server.ts:156` `applyFileBatch` | W (via `runBulkBatch`) | S | — | 1 ✔ (build's own store) |
| `ai-builder/builder-items.server.ts:173,216,311,357,380` | R/W | S + CM | — | 6 / F-87e |
| `ai-builder/builder-run.server.ts:296,343,366,599,672` | R/W | S + SP | `invalidateStoreCatalog` | 6 / F-87e |

### 2.2 Storefront (E)

| Site | R/W | Scope today | Tag | Slice |
|---|---|---|---|---|
| `E/lib/storefront.server.ts:128,178` `getStorefrontBySubdomain` (loads CM) | R | CM | storefront tags | 4 |
| `storefront.server.ts:368-389` `catalogStoreId`, `storeShowsProduct` | R | SP | `storefront-catalog-has-{store}-{product}`, `storeTags.catalog(seller, store)` | 4 |
| `storefront.server.ts:397-401` `storeHasProducts` → `L/stores/server.ts:559` | R | S + CM/SP | `storefront-has-products-{seller}-{store}`, `productTags.seller`, `storeTags.catalog` | 4 |
| `storefront.server.ts:421-441` `getStorefrontCategories` → `storeCategoryGroups` | R | S + SP | `storefront-categories-v2-{seller}[-{store}]`, `productTags.seller`, `categoryTags.all`, `storeTags.catalog` | 4 |
| `E/actions/products.ts:79-268` `getProducts` | R | S + SP | `ecommerce:products:list`, `productTags.seller`, `storeTags.catalog` (or `listing()`) | 4 (unscoped: 6) |
| `E/actions/products.ts:323-411` `getProductBySlug` + related (leak) | R | S | `ecommerce:products:by-slug`, `productTags.seller` | 4 |
| `E/actions/products.ts:458-985` variants, collections, by category/brand/seller, slugs, filters, questions | R | N / S | `productTags.listing`, `productTags.all` | 6 (marketplace leftovers) |
| `storefront/[subdomain]/products/[slug]/page.tsx:42,69,75` | R | S + SP | `storefront:product-paths:v1`, `productTags.seller` | 4 |
| `E/lib/product-translations.ts:86` `findActiveProductIdBySlug` | R | S | — | 4 (per store) |
| `storefront/[subdomain]/page.tsx`, `products/page.tsx`, `store-product-page.tsx`, `product-structured-data.tsx`, `storefront-catalog.tsx:121`, `store-site.tsx:125` | R | CM | via above | 4 |
| `E/lib/store-site/catalog.server.ts:152-285`, `store-data.server.ts:13-38` | R | S + SP | `storefront:store-sales:v1`, `storefront:seller-brands:v1`, `storefront:store-reviews:v1`, `storefront:store-review-stats:v1` (`productTags.seller`, `reviewTags.seller`, `storeTags.catalog`) | 4 |
| `E/actions/storefront-search.ts:37` | R | S + SP | via `getProducts` | 4 |
| `E/lib/catalog-share/catalog-share.server.ts:51-69` | R | S + SP | via `getProducts` | 4 |
| `store-thank-you.server.ts:65` | R | CM | — | 4 |
| `E/lib/reorder/reorder.server.ts:50-58` | R | S + CM/SP | — | 5 |
| `E/actions/seller.ts:89,137` (no callers) | R | S | `seller-store-categories-{seller}` | 6 (delete) |
| `E/actions/cart.ts:290,299,308,327,487` | R | S + `storeSellsProduct` | — (never cached) | 5 |
| `E/actions/order.ts:125,272,821` | R/W | CM/SP | `invalidateProductInventory` | 5 |
| `E/actions/cart-offers.ts:25,213,275` | R | N + `storeSellsProduct` | `storefront:quantity-offers:v1`, `productTags.quantityOffers(seller, product)` | 5 |
| `E/actions/cross-sell.ts:34-66` | R | N + `storeSellsProduct` | `storefront:cross-sell:v1`, `storeTags.crossSells`, `productTags.detail` | 5 |
| `E/actions/wishlist.ts`, `analytics.ts`, `recommendations.ts`, `search.ts`, `brands.ts`, `categories.ts`, `app/api/meta/catalog/route.ts:31`, `lib/meta/meta.product.ts` | R | N | various | 6 |
| `E/lib/product-feed/product-feed.server.ts:68-262` | R | S + SP | `store-feed:currency:v2`, `store-feed:page:v2` (`productTags.seller`, `storeTags.catalog`) | 6 |
| `E/lib/sitemap/sitemap.server.ts:30-113`, `store-sitemap.server.ts:99` | R | S + SP | sitemap tags | 6 |

### 2.3 packages/lib

| Site | R/W | Scope today | Tag | Slice |
|---|---|---|---|---|
| `L/orders/place-order.ts:295-312,384-391` cart products, active check | R | N | — | 5 |
| `L/orders/place-order.ts:914` `decrementStock` | W | N | `invalidateProductInventory` (callers) | 5 (no change before split) |
| `L/orders/line-discounts.server.ts:74,83,132` | R | N + `storeSellsProduct` | — | 5 |
| `L/orders/manual-order.server.ts:71-88` | R | `storeSellsProduct` | — | 5 |
| `L/stock-alerts/stock-alerts.server.ts:53-79,136-149` | R/W | S + CM/SP | — | 4 |
| `L/stores/catalog.server.ts:34-152` get/set catalog, `storeSellsProduct`, `cartProductsOutsideStoreCatalog` | R/W | CM/SP | `invalidateStoreCatalog` | 5 (`storeSellsProduct` on `productInStore('shown')` + active) |
| `L/stores/server.ts:559-570` `storeHasVisibleProducts` | R | S + CM/SP | — | 4 |
| `L/stores/store-scope.server.ts` `productInStore`, `storeHasProduct`, `assertStoreProduct` | R | the primitive | — | 1 ✔ |
| `L/store-sites/catalog-data.server.ts:18-202` sales, brands, categories, reviews | R | S + SP | (callers cache) | 4 |
| `L/store-sites/preview-product.server.ts:35-108` | R | S + CM/SP | — | 4 |
| `L/products/product-slug.server.ts:31-41` `resolveProductSlug` | R | S (advisory lock per seller) | — | 2 (per store, with the split) |
| `L/products/trash.server.ts:122,142` list/count | R | S | — | 2 |
| `L/products/trash.server.ts:151,210,267` trash/restore/purge | W | S + optional `inStore` | `invalidateProduct` | 1 ✔ |
| `L/products/trash.server.ts:292` `purgeExpiredTrash` (cron) | W | N | — | none |
| `L/email-campaigns/email-campaigns.server.ts:256-264` | R | S + CM/SP | — | 4 |
| `L/integrations/shopify-import.server.ts:257,293,383` | R/W | S (conflict `[sellerId, sku]`) | — | 3 (writes `store_id`) |
| `L/store-wallet/welcome-gift.server.ts:49` | R | S | — | none (gift ended) |

### 2.4 MCP and agent

| Site | R/W | Scope today | Tag | Slice |
|---|---|---|---|---|
| `B/mcp/server.ts:8` instruction text | — | "products belong to the account" | — | 6 / F-87e |
| `B/mcp/tools/account.ts:19-73` `list_stores` count | R | S + CM/SP | — | 6 |
| `B/mcp/tools/products.ts:31-167` tools pass `args.storeId` | R/W | via lib | — | 6 |
| `L/products/agent-products.server.ts:121-829` load store, `storeShowsProduct`, `requireProduct`, categories, `uniqueSlug` (global), `skuTaken`, create (writes SP), update, status, trash/restore, search, get | R/W | S + CM/SP | `invalidateProduct`, `invalidateSellerProducts`, `invalidateStoreCatalog` | 6 / F-87e |
| `packages/agent/src/skills/products.ts:35-159` (passes `ctx.storeId`) | R/W | via lib | — | 6 |

## 3. Slice 1 — what was built

- **Primitive:** `productInStore` + `ProductStoreScope` in `L/stores/store-scope.server.ts`; `storeHasProduct` now one `SELECT … FROM products WHERE id AND productInStore(…)`, with an optional `scope`. Unit tests `L/stores/product-in-store.test.ts` (rendered SQL and params in both modes, malformed ids) and `store-scope.test.ts`.
- **Dashboard guard:** `D/lib/products/product-store.server.ts`: `requireProductStore(storeId)` = `requireStore` (session seller; foreign, deleted, forged or non-uuid store → `not_found`) + switch read + `inStore` condition (scope `managed`); `requireStoreProduct(storeId, productId)` adds the pair check → `not_found`. Unit test `product-store.server.test.ts`.
- **Actions with an explicit `storeId`:** `createProduct(storeId, data, options)` (writes `products.store_id = store.id`, set after the payload spread so the client can't pick it; still no `store_products` row, as before), `updateProduct(storeId, productId, data)` (also strips `sellerId`/`storeId` from the client's data: before, a client could send `sellerId` in the update payload), `setProductPublished(storeId, …)`, `toggleProductStatus(storeId, …)`, `deleteProduct(storeId, …)`, `bulkInsertProductsAction(storeId, …)`, `bulkCreateProductsAction(storeId, …)`, `trashProductsAction`/`restoreProductsAction`/`deleteProductsForeverAction(storeId, ids)` (lib trash functions take `{ inStore }` in every read and write), `previewBulkEditAction`/`applyBulkEditAction`/`undoBulkEditAction(storeId, …)` (`inStore` in `loadRows` and `writeValues`), `bulkSetPublishedAction(storeId, …)` (`inStore` in `loadOwnProductStatuses`), `addBatchAction(storeId, …)` → `runBulkBatch(…, { storeId })`. The AI builder's file batch passes the build's own store (`requireStoreOf`).
- **Callers:** `D/app/(main)/products/layout.tsx` puts the sidebar's selected store (`getSellerStores().selected`, only ever one of the session seller's stores) into `ProductStoreProvider`; client components read `useProductStoreId()` and send it. The server never trusts it.
- **No duplicate action exists** for products today (nothing to change).
- **Tests (DB):** `L/stores/store-separation.integration.test.ts`: S1 (stores A, B) cannot update, set status, trash, restore or bulk edit S2's product through A or B; a forged S2 store id is refused even with S1's own product ids; before the split store B (selected mode) still manages every S1 product (today's rule) while `shown` follows its picks; with `catalogSplit: true` a store A product can't be changed through store B and a bulk edit through B touches only B's product.

### Deferred or uncertain (from slice 1)

- **Reads not scoped yet:** `getProduct`, list/count/export/ids, trash list/count, sidebar count, search → slice 2.
- **Store read-only:** the actions call `requireStore` without `forWrite`, so an archived or admin-suspended store doesn't block product writes (same as today, when only the seller was checked). Decide in slice 2 with the route move.
- **Cache tags unchanged:** `invalidateProduct` still tags per seller; `ProductCacheSnapshot` has no `storeId` → slice 4.
- **Bulk-edit Undo token** is bound to the seller, not the store; undo through another store only touches products of that store (`inStore`), the rest count as conflicts.
- **`products.store_id` is now written on create** (the selected store) while nothing reads it. **0163 must not assume `store_id IS NULL`** for every existing row: a product created after this deploy already names a store, which may be a store that doesn't show it (a selected-mode store). 0163 should overwrite `store_id` from its own kept/copy rule, or keep it only when that store shows the product.
- **Integration tests not run here** (no `TEST_DATABASE_URL`). `lib/products/product-slug.integration.test.ts` now stubs the store guard (its sellers have no store).

## 4. Slice 2 — what was built

- **Route move:** `D/app/(main)/products/*` → `D/app/(main)/stores/[storeId]/products/*` (every page, `_components` and feature folder; imports `@/app/(main)/stores/[storeId]/products/…`). The layout runs `loadStorePage(storeId)` and puts the checked id into `ProductStoreProvider`; each page also runs `loadProductStorePage(storeId)` (`D/lib/products/product-store.server.ts`: `requireProductStore(…, { read: true })`, AccessError → login / signup / `notFound()`).
- **Old URLs:** `D/app/(main)/products/[[...path]]/page.tsx` redirects (307) to `legacyProductsTarget(selected.id, path, searchParams)` (`D/lib/products/product-routes.lib.ts`: same sub-path, each segment re-encoded, `.`/`..` dropped, query kept, repeated keys too). No store: `/products` still renders the account list (`VendorProductsData storeId={null}`, seller scope as before); any `/products/<sub>` goes to `/stores`.
- **Reads on `productInStore(managed)`:** list page, tab counts, category filter, export and "select all" ids (`products-list.query.ts` / `.server.ts`, actions now take `storeId`), `getProduct(storeId, productId)` + edit page, Trash list (`listTrashedProducts`/`countTrashedProducts` take `{ inStore }`), inventory low-stock and product history (`EXISTS` on the bare `products` table for the aliased SQL), sidebar product count and header search (selected store; none = account). `loadProductStoreLinks` prefers the URL store. Bulk edit already read with `inStore` (slice 1). Categories page: store checked, list still per seller (F-87d).
- **Store status:** `requireProductStore` asks for an active store (`forWrite`) on writes only when `stores_catalog_split` is on; reads never. Before the split a suspended primary store would otherwise lock the seller out of the whole account catalog.
- **Links:** sidebar (`[storeId]` hrefs; the Products label falls back to `/products` with no store via `noStoreHref`), `DASHBOARD_ROUTES` (header back-link gets the path's store; edit route; palette keeps the Products pages, filled with the selected store), command palette, home attention/top products/setup steps, reports, AI builder issues and review, help, setup-prompt form guard, agent router, store-editor data actions, seller emails (store created; low stock uses the order's store), `low_stock` bell (uses `data.storeId` when present), all `revalidatePath` calls (route patterns with a type).
- **Left on the old path on purpose (the redirect handles them):** stored bell rows (`low_stock` rows carry no store), the push fallback URL, the paid-ads product picker (no store on that page), admin app links (admin's own `/products`). Storefront `/products/<slug>` paths are a different app and unchanged.

## 5. Slice 3 — what was built

Every action below takes an explicit `storeId`, checked with `requireProductStore` (session seller; a foreign, deleted, forged or non-uuid store is refused). Each product is checked with `requireStoreProduct`, or with the guard's `inStore` (`productInStore`, scope `managed`) in the same WHERE as the read or write. A product outside the store gets the feature's own "not found" answer. With the switch off, `managed` means "same seller", so behaviour is unchanged.

| Feature | Files (D = `apps/dashboard`, P = `D/app/(main)/stores/[storeId]/products`) | How it authorizes now |
|---|---|---|
| Quantity offers (F-07b) | `P/[productId]/edit/quantity-offers.server.ts` + `.client.tsx`, edit `page.tsx` | `listQuantityOffers(storeId, productId)`, `saveQuantityOffers({ storeId, … })`: `requireStoreProduct`, plus `inStore` on the price read before the tiers are replaced. |
| Cross-sells (F-32c) | `P/[productId]/edit/cross-sell.server.ts` + `.client.tsx` | `requireStoreProduct` on the product. **Both** products are read with `inStore` (the count must be 2), so after the split an offer can't pair two stores. Toggle and remove now also need the row's `product_id` to be the checked product (before, the row id + seller was enough). |
| Inventory restock (F-10c) | `P/inventory/inventory.server.ts` + `.client.tsx` | `restockAction(storeId, input)`: `inStore` in the locked product read; `store_read_only` → `readOnly`, `not_found` → `notFound`. |
| Excel update (F-24c) | `P/excel-update/excel-update.server.ts` + `.client.tsx` | preview, apply and export take `storeId`; `loadProducts` and `writeEdit` add `inStore`, so a product id, SKU or variant from another store matches nothing (the row says "not found"). |
| Category product order (F-24d) | `P/category-order/category-order.server.ts` + `.client.tsx` | load, save and reset take `storeId`. The category's products are filtered with `inStore`. Save and reset delete only the positions of this store's products (`storePositions`), so one store never clears another's order. Categories stay per seller (F-87d). |
| Social proof + seller-added reviews (0111) | `P/social-proof/social-proof.server.ts`, `.data.ts`, `P/add/add-product.tsx`, edit `page.tsx` | `saveProductSocialProof(storeId, productId, input)`: `inStore` on the product UPDATE that gates every review write. `loadProductSocialProof(sellerId, productId, inStore)`. |
| AI source mark (0112) | `P/add/ai/ai-source.server.ts`, `add-product.tsx` | `markProductAiAssisted(storeId, productId, mode)`: `inStore` in the UPDATE. |
| Product taxonomy link | `P/categories-brands/categories-brands.server.ts` (`setProductSellerTaxonomy`), `add-product.tsx` | `setProductSellerTaxonomy(storeId, productId, input)`: `inStore` in the UPDATE (the lists themselves: F-87d). |
| Product views and orders (F-15b) | `P/_components/product-views.data.ts`, `vendor-products.data.tsx`, edit `page.tsx` | `loadProductViewStats(storeId, ids)`: slugs and the order count are filtered with `inStore` (`null` = the old account page). |
| `createProductVariant`, `getProductReviews` (no callers) | `D/actions/products.ts`, `D/actions/reviews.ts` | take `storeId`; `requireStoreProduct` + `inStore`. |
| Product Q&A answers | `D/actions/products.ts` (`answerProductQuestion`, `updateProductAnswer`, the form wrappers, `getSellerQuestions`, `getSellerUnansweredQuestions`), `D/app/(main)/reviews/*`, home `unanswered-questions.*` | Answer and update take `storeId` (form field `storeId`): the question's product is read with `inStore`, and an answer is updated only when its question is on a product of the store (subquery). The lists take an optional `storeId` (none = the account). |
| Coupon product targets + picker | `D/actions/coupons.ts`, `D/app/(main)/coupons/_components/*` | `searchCouponProducts({ storeId, … })` filters with `inStore` (the cross-sell form uses it too, with its page's store). `saveSellerCoupon(storeId, input, id)` checks product targets with `inStore`: a refused store or a product outside it is `invalid_products` (the existing "pick them again" message; `not_found` there means "coupon gone"). A coupon without product targets needs no store, as before. The coupon row stays per seller (F-87k). Totals and checkout untouched. |
| Discount rule gift products (F-13a) | `D/app/(main)/marketing/discounts/discount-rules.server.ts`, `.data.tsx` | gift products are checked with `productInStore(rule's store, managed)` (the store was already explicit; `requireStore` forWrite unchanged); the gift picker gets the rule's store. |
| Paid-ads product | `D/actions/ads.ts`, `D/app/(main)/marketing/_components/advertise.data.tsx`, `payment-panel.tsx`, `P/_components/products-list.query.ts` (`listSellerProductOptions(…, inStore?)`) | `createAdRequest({ storeId, … })`: `requireProductStore` + `inStore` on the product read → `product_not_found`. Price, request row and wallet charge unchanged. |
| Manual order picker (F-05) | `D/app/(main)/orders/new/manual-order.server.ts` | the product search adds `productInStore(store, shown)` in SQL (what the store sells, as checkout sees it), so the 15-row limit counts only sellable products; `storeSellsProduct` stays. `createManualOrder`, prices and totals untouched (slice 5). |
| Catalog share (F-11c) | `D/app/(main)/marketing/catalog/catalog-share.server.ts` | the products link uses `productInStore(store, shown)` instead of its own `store_products` check (same rows before the split). Category links still use `storeCategoryGroups` (slice 4). |
| Reports (worst sellers) | `D/app/(main)/reports/reports.server.ts` | `worstCandidates` uses `productInStore(store, shown)` instead of its own `catalog_mode`/`store_products` check; the switch is part of the `dashboard:store-report:v2` cache key. |
| Home attention + setup | `D/app/(main)/_components/home.queries.ts` | setup "has a product", the low-stock count, the unanswered-question count and list are the selected store's (`productInStore(managed)` as an `EXISTS` on the bare `products` table); no store = the account. |
| Shopify import | `packages/lib/src/integrations/shopify-import.server.ts` | writes `products.store_id` = the import's (already checked) store, as `createProduct` does. |

**Still on the selected store** (pages with no store in their URL; the server checks the id again on every call, and the cookie is never a write target): `/coupons` (picker and product targets), `/marketing` paid ads (picker and `createAdRequest`), `/reviews` Q&A list and answers, and on the home page the attention counts, setup flags, unanswered questions and their answer box. `/marketing/discounts` uses its store param, else the selected store (unchanged).

**Tests:** `P/store-scope-features.server.test.ts` (16 unit tests, fake db that never connects): each action asks the guard for the named store and product, gives its not-found answer without touching the database when the guard refuses, and puts `inStore` in the WHERE it uses (quantity offers, cross-sells including an offered product outside the store, restock including `store_read_only`, social proof, AI mark, coupon picker and targets, paid ads). `social-proof.integration.test.ts` stubs the new store guard. `L/stores/store-separation.integration.test.ts` gains three cases that run the actions' statements on real rows: across sellers and through a forged S2 store nothing is written for quantity offers, cross-sells, restock, seller reviews or coupon targets; before the split store B (selected mode) still manages every S1 product; with `catalogSplit: true` a store A product gets nothing through B and a cross-sell can't pair A and B. DB tests not run here (no `TEST_DATABASE_URL`).

### Deferred or uncertain (from slice 3)

- **SKU uniqueness stays per seller** (index `[seller_id, sku]`): `findExistingSkus` (from-file), Shopify's "already imported" check and the Excel plan's "SKU taken" are per seller, as the index is. After the split, an Excel row naming a SKU used in another store reads as not found, and changing a SKU to one used in another store fails the write (`generic`). Per-store SKUs need a migration (with 0163 or later).
- **Reviews page lists and replies** (`getSellerReviews`, `replyToReview`, `getReviewStats`, home "new reviews") stay per seller; store reviews have no product. They move with per-store reviews (slice 4).
- **Ad requests list** (`getSellerAdRequests`) stays per seller (the account's billing history).
- **Home top products** stays order-based (filtered by the home channel's store, as before).
- **`sellerTopCategory`** (from-file fallback category) stays per seller: a heuristic, not authorization.
- **Coupon and cross-sell rows** have no store yet (`coupons.store_id` is F-87k; `product_cross_sells.store_id` stays null); only their product targets are store-checked.
- **A seller with no store** can no longer answer questions or set coupon product targets (the guard needs a store). Not checked how many such sellers production has; slice 2 kept `/products` working for them, these features don't.
