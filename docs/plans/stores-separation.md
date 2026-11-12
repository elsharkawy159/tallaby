# Fully separate stores (ROADMAP.md F-87) — plan

> **Status:** Planned (owner request 2026-11-10). Planning only: no code changed and no migration run.
> **Owner decisions already given (2026-11-10)** are in §0. The open questions in §6 were **answered by the owner on 2026-11-10** (§6 "Decided"); the tasks and migrations below follow those answers.
> **Progress (2026-11-10):** Phase A is done and committed. F-87a: switch reader `isSwitchOn` (`packages/lib/src/stores/platform-switches.server.ts`, React `cache` wrappers in the dashboard and ecommerce apps), `primaryStoreId` / `storeOwnedBy` / `assertStoreProduct` (`packages/lib/src/stores/store-scope.server.ts`), unit tests, and the DB isolation suite skeleton `store-separation.integration.test.ts` (not run: no `TEST_DATABASE_URL`). F-87b: `0160_store_separation_columns.sql` and its drizzle mirror, **applied on staging and production 2026-11-10** (owner-approved; both switches off); `packages/db/scripts/stores-split-dry-run.sql` run read-only on both, totals in `ROADMAP.md` §7 (production: 59 copies to create, 0 orphans, 4 non-primary stores lose activation). Phase B: F-87c is complete and committed (slices 1–6, [`stores-separation-f87c-slices.md`](stores-separation-f87c-slices.md)). **F-87d (taxonomy per store) built 2026-11-10, uncommitted** (slices doc §10): every seller category and brand read and write goes through `taxonomyInStore`, dark behind `stores_catalog_split`; the `products_taxonomy_same_store` trigger is proposed for 0163 in §3.2 (after step 8), not written as a migration. **F-87m: `0163_store_catalog_split.sql` written 2026-11-10, NOT applied anywhere** (with `scripts/stores-split-rollback.sql`, `scripts/stores-split-verify.sql` and the code that must ship first; tested on a local throwaway PostgreSQL 18 only; §3.4, §3.5). Next: F-87e leftovers, then apply 0163 on staging.
> Money and ledger changes here are covered by the owner's request (CLAUDE.md rule 4). Every migration still goes to staging first, then to production with owner approval (rule 6).

## 0. What the owner asked for, and the decisions already made

Each store a seller owns becomes a **fully separate store**, with its own products, theme, design, shipping, domain/subdomain, payment methods, apps, currency, settings and **wallet balance**.

| Topic | Decision (owner, 2026-11-10) |
|---|---|
| Existing products | Each store keeps exactly the products it shows today. A product shown in N stores becomes N independent copies (own stock, prices, variants, translations, images, SEO). History stays on the original row id. A mapping table `product_store_split` (old → new) lets links and carts be remapped. |
| New action | "Copy to store" on dashboard /products (single and bulk) for sellers with 2+ stores. It copies everything with the **same stock numbers**, and the copy starts with the original's status (see risk R2 / Q2). |
| Per store | Wallet balance; activation (each store needs its own top-up, or a balance above 0 at some point, before its orders show); seller categories and brands. |
| Per account (unchanged) | Pro plan, AI credits, store limit (Free = 3). Account-level charges (Pro $29/month, AI credit packs, campaign email packs) are paid from the **primary** store's wallet. |
| Wallet migration | The current seller balance, negative ones included, moves to the primary store's wallet. Other stores start at 0. |
| Where entries go | Order fees ($0.03 on Free) and top-ups → the wallet of the store the order or top-up belongs to. Referral commissions and admin adjustments → the primary store's wallet. Ad charges and their refunds → the wallet of the promoted product's store (Q3). |
| Activation on migration day (Q1) | **Only the primary store** of an activated seller stays activated. Every other existing store starts not activated and needs its own top-up (or a balance above 0 at some point in that store's own wallet). Non-primary stores get a banner explaining it (F-87o). |
| Deleting a store with money (Q6) | The balance, positive or negative, moves to the primary store's wallet first (a pair of `postStoreWalletEntry` entries, one claim per deleted store), then the delete goes on. The primary store cannot be deleted while other stores exist. |
| Reviews and questions (Q4) | Copied to each copy during the split only. "Copy to store" never copies them. |

## 1. Current state (checked in code 2026-11-10)

Schema references are to `packages/db/src/drizzle/schema.ts` (written `schema:N`).

### 1.1 What is already per store

These need no data change, only confirmation tests (§4, F-87a):

| Item | Evidence |
|---|---|
| Design, pages, revisions, saved blocks, forms, CMS | `store_design_systems` keyed by `store_id` (schema:2706); `store_pages` unique (store, slug) (schema:2723, 2740); `store_site_revisions.store_id` (schema:2756); `saved_blocks`, `store_forms`, `cms_*` (schema:2879–2996); `stores.template_key`, `shared_header/footer`, `published_revision_id` (schema:2625–2660). |
| Shipping zones | `store_shipping_zones.store_id` (schema:3125); query `packages/lib/src/stores/server.ts:714`; COD per zone (`server.ts:765`). |
| Payment methods | `stores.settings.payments` (read `packages/lib/src/stores/server.ts:578-582`, written `:610-627` with an audit row; parsed by `packages/lib/src/payments/store-methods.ts`). |
| Paymob / Kashier / pixels / Bosta / Wassalha / Sheets / Meta | `store_integrations` unique (store, provider) (schema:3050–3068); `packages/lib/src/integrations/store-integrations.server.ts`, `packages/lib/src/payments/store-gateways.server.ts:210`. |
| App installs | `store_app_installs.store_id` NOT NULL (schema:3211); `packages/lib/src/billing/app-billing.server.ts:70`. |
| Currency (F-61b) | `stores.settings.currency` (written `packages/lib/src/stores/server.ts:365-367`); carts and orders carry the store currency (0150). |
| Settings, contact, SEO, checkout form, thank-you, sales pop-up, PWA, win-back, WhatsApp templates, AI brand memory | `stores.settings` / `contact` / `seo` / `agent_profile` (schema:2641–2654); `store_settings_audit.store_id` (schema:3093). |
| Customers and notes, blocked phones, checkout leads, campaigns, win-back sends, discount rules | `store_customer_notes`, `store_blocked_phones`, `store_checkout_leads`, `store_email_campaigns*`, `store_winback_sends`, `store_discount_rules` all have `store_id` NOT NULL (schema:3664, 3772, 3793, 3980–4080, 4413); customer list grouped by `o.store_id` (`packages/lib/src/customers/customers.server.ts:82-84`). |
| Orders and carts | `orders.store_id` (schema:1679, NULL = marketplace); `carts.store_id` filled by `orders_fill_store_id` / `carts_fill_store_id` (0050:315–370). |
| MCP grants | `agent_grants.all_stores` + `store_ids[]` (schema:4145-4146), owned stores checked in `packages/lib/src/agents/oauth.server.ts:218-227`. Each tool already takes a `storeId`. |

### 1.2 Still account level, and should move to per store

| Item | Evidence | Change |
|---|---|---|
| **Products** and all children | `products.seller_id` NOT NULL, no `store_id` (schema:1529); store membership = `stores.catalog_mode` (`all` / `selected`) + `store_products` (schema:2650, 2685); `store_products_same_seller` trigger (0050:213). | §2.1, §3 (F-87b…d). |
| **SKU uniqueness** | `unique_product_seller_sku_idx` (seller_id, sku) (schema:1590). A copy in the same account would break it. | Becomes unique (store_id, sku). |
| **Seller categories and brands** | `seller_product_categories` / `seller_product_brands` unique (seller, lower(name)) (schema:1455-1500); `products_seller_taxonomy_same_seller` checks seller only (0068:91-120); `seller_categories` PK (seller, category) (schema:1960); `seller_category_product_positions` (schema:3948). | Per store (owner). |
| **Store wallet** | `seller_wallet` unique `seller_id` (schema:1979–1990); `wallet_transactions` claims unique (seller, type, reference_type, reference_id) (schema:2017); `sellers.wallet_balance` mirror; `postStoreWalletEntry` updates `WHERE seller_id = …` (`packages/db/src/wallet/store-wallet.ts:168-243`). `wallet_transactions.store_id` exists but is reporting only (0060). | §2.2, §3 (F-87f…h). |
| **Top-ups** | `seller_wallet_top_ups` has no `store_id` (schema:3295). | Gets `store_id`. |
| **Activation** | `isActivated` / `orderLockState` (`packages/lib/src/billing/order-lock.lib.ts:67-123`) take seller-level `hasTopUp`, `hasHadPositiveBalance`, `firstOrders`; `loadOrderLock(sellerId)` and every `require*Orders*` guard (`apps/dashboard/lib/auth/require-seller.server.ts:116-198`). | Per store (owner). |
| **Coupons** | `coupons.seller_id`, no `store_id`; `code` unique platform-wide (schema:222, 256); `applicable_to.productIds` (`packages/lib/src/orders/coupon-scope.lib.ts:29-42`). Queries: `apps/dashboard/actions/coupons.ts:172, 184, 336`; storefront `packages/lib/src/store-sites/catalog-data.server.ts:234, 272`. | `coupons.store_id` (§2.1). |
| **Policies** | `sellers.privacy_policy` / `return_policy` / `shipping_policy` (schema:407-409, 0142); storefront reads them from `sellers` (`apps/ecommerce/lib/store-site/store-policy.server.ts:12`); edited at `apps/dashboard/app/(main)/settings/policies.server.ts:16`. ROADMAP F-46 already asks for "each store's own policies". | `stores.settings.policies` with a fallback to the seller text (F-87k). |
| **Custom domain** | `seller_custom_domains` has `store_id` but also unique `seller_id` (schema:562-565): one domain per account; UI under account settings (`apps/dashboard/app/(main)/settings/custom-domain.client.tsx:79`). | One domain per store (F-87k). |
| **Reviews, questions** | `reviews` (schema:975) and `product_questions` (schema:699) have no `store_id`; they follow the product. | Follow the product copy (§2.1.4). |
| Media library | `media_assets.store_id` nullable; NULL rows are shared by every store (`packages/lib/src/media/server.ts:112-113`). | Keep. Shared old uploads are harmless (R7). |

Account level and staying there: plan, `max_stores_override`, AI credits (`seller_ai_credits`), email credits (`seller_email_credits`), referral code and ledgers, legal identity, push subscriptions, riders, fulfillment profile (Q5).

### 1.3 Product and wallet code paths

Abbreviations: D = `apps/dashboard`, E = `apps/ecommerce`, L = `packages/lib/src`, B = `apps/backend/src`.

**Dashboard: how the store is chosen.** `D/lib/stores/current-store.server.ts:12-35` resolves the `tallaby_store` cookie (falls back to primary, then first store); it is navigation only and never a write target. The cookie is set at `D/components/dashboard/store-switcher.server.ts:19` and `D/app/(main)/stores/stores.server.ts:87`. `/stores/[storeId]/…` pages take the id from the URL and call `requireStore()`. **`/products/*` has no store id**, so it must move under `/stores/[storeId]/products` (with redirects from `/products/*` to the selected store), so that every product write carries an explicit store id (rule 5).

**Dashboard products (all filter by `sellerId` today → add `store_id`).**
- List `D/app/(main)/products/_components/products-list.query.ts:39`. `D/actions/products.ts`: `createProduct` 1107 (insert 1172), `getProduct` 945, `updateProduct` 1458, `toggleProductStatus` 1627, `setProductPublished` 1651, `createProductVariant` 1745, questions 1811/2014/2028/2080, `deleteProduct` 1938/1953, bulk imports 406/756/874. Rule 14 forbids adding to this file, so the store parameter goes in, and new helpers go in `products/*.server.ts`.
- Store links `_components/product-store-links.data.ts:19-57` (catalog_mode logic → `product.store_id`); views `product-views.data.ts:28-59`; bulk edit `products/bulk-edit/bulk-edit.server.ts:77,93,175`; Excel update `excel-update.server.ts:84,104,263` (SKU match per store); trash `L/products/trash.server.ts:116-262` and its callers; inventory `products/inventory/inventory.server.ts:32-56`, `inventory.data.ts:62,120`; home `_components/home.queries.ts:42,142,144,148,440`; quantity offers `[productId]/edit/quantity-offers.server.ts:58`; cross-sells `cross-sell.server.ts:82` (same store, not same seller); discount gifts `marketing/discounts/discount-rules.server.ts:62`; category order `products/category-order/category-order.server.ts:58,159`; categories/brands `categories-brands.data.ts:19,33`, `categories-brands.server.ts:148,152,360`; reviews `D/actions/reviews.ts:102`, social proof `social-proof.server.ts:24,67`; from-file `add/from-file/from-file-run.server.ts:236,355,581`; AI source `add/ai/ai-source.server.ts:31`; add form `add/add-product.tsx:309`; sidebar count `components/dashboard/sidebar.server.ts:51`; search `components/layout/dashboard-search.server.ts:59`; coupons `actions/coupons.ts:235,303`; ads `actions/ads.ts:171`; manual order `orders/new/manual-order.server.ts:58,77`, `L/orders/manual-order.server.ts:74,80`; Shopify import `L/integrations/shopify-import.server.ts:293,303,384` (`onConflictDoNothing` target `[sellerId, sku]`); reports `reports/reports.server.ts:165,181-185`.
- Removed after the split: catalog settings `stores/[storeId]/settings/catalog.server.ts:20-25`, `catalog.data.ts`, `catalog.client.tsx`, `store-general.client.tsx:386`, `STORE_CATALOG_MAX_PRODUCTS` (`settings/page.tsx:56`); editor/SEO/catalog-share `catalogMode` branches (`(builder)/stores/[storeId]/editor/server/editor.data.ts:80-86,181-183,214`, `website/seo/seo.data.ts:28,55`, `seo/ai/ai-seo.server.ts:86`, `marketing/catalog/catalog-share.server.ts:33-120`, `packages/store-editor/src/lib/editor-data.lib.ts:16-21`).
- No plan-based product limit exists. The only cap is `BULK_LIMITS.maxProducts` = 500 (`from-file.dto.ts:27`).

**Storefront.**
- Product set: `E/lib/storefront.server.ts:128,178` (loads `catalogMode`), `catalogStoreId()` 368, `storeShowsProduct()` 373-389, `storeHasProducts()` 397 → `L/stores/server.ts:559-570`, `getStorefrontCategories()` 421-444. All become `p.store_id = :store`.
- Lists `E/actions/products.ts:79-142,198`. Product page `getProductBySlug(sellerId, slug)` 323-342 → `E/lib/product-translations.ts:58-70` (lookup **by store**). Related products 408-413 already **leak**: they ignore `selected` mode today; fixed by the store filter. Page `storefront/[subdomain]/products/[slug]/page.tsx:45,69,75`.
- Categories and reviews `L/store-sites/catalog-data.server.ts:81-106, 144-202` (and callers in `storefront/[subdomain]/page.tsx`, `products/page.tsx`, `storefront-catalog.tsx`, `store-product-page.tsx`, `store-site.tsx`, `product-structured-data.tsx`); `E/lib/store-site/catalog.server.ts:134-279`; `E/actions/seller.ts:140-152`.
- Search `E/actions/storefront-search.ts:37-39`. Sitemap `E/lib/sitemap/sitemap.server.ts:24-37`, `store-sitemap.server.ts:99-101`. Feeds `E/lib/product-feed/product-feed.server.ts:127-154,247-262`. Catalog share `E/lib/catalog-share/catalog-share.server.ts:51-69`. Thank-you `store-thank-you.server.ts:65`. Reorder `E/lib/reorder/reorder.server.ts:50-51`. Back in stock `L/stock-alerts/stock-alerts.server.ts:53-72,136-145`. Preview `L/store-sites/preview-product.server.ts:35,64-73`. Campaign products `L/email-campaigns/email-campaigns.server.ts:262-264`.
- Cart and checkout: `E/actions/cart.ts:297-302` → `storeSellsProduct` `L/stores/catalog.server.ts:110-127`; `E/actions/order.ts:125` → `cartProductsOutsideStoreCatalog` `L/stores/catalog.server.ts:135-152`. `L/orders/place-order.ts:384-391` checks only `status = 'active'`, so it gains its own `product.store_id = cart.store_id` check. Gifts and offers `L/orders/line-discounts.server.ts:70-78`, `E/actions/cross-sell.ts:34-66`, `E/actions/cart-offers.ts:25-34,219`.

**Marketplace.** The tallaby.com marketplace listing and search pages were removed (PLAN.md:3387). Left over: unscoped `getProducts` without a seller (`E/actions/products.ts:92`, tag `productTags.listing()`), `components/home/*` (`hero-banner.tsx:50`, `ProductsGrid.tsx:40`, `deal-of-the-day.tsx:61`, `ProductsList.tsx:77`), the header `search-bar.tsx:59`, and the unused `E/actions/search.ts:55`. Admin product/store views: `apps/admin/app/(dashboard)/products/[productId]/product-store-link.server.ts:23-36`, `stores/[storeId]/store-sections.tsx:127,476-478`, `L/admin/stores-admin.server.ts:109-138,239,329-331`, `sellers/sellers-export.server.ts:171-174,260`, the admin editor mirror.

**Caches (rule 8).** `packages/cache/src/tags.ts`: `productTags.seller` 28 (main storefront list tag), `quantityOffers(seller, id)` 21, `storeTags.catalog(seller, store)` 80 (obsolete after the split), `reviewTags.seller` 96, `couponTags.seller` 101, `sellerTags.storefront` 59. `packages/cache/src/invalidate.ts`: `invalidateProduct` 106, `invalidateProductInventory` 207 (`ProductCacheSnapshot` needs `storeId`), `invalidateSellerProducts` 215, `invalidateStoreCatalog` 272. Seller-keyed keys: `E/lib/storefront.server.ts:387-388,400-401,439-441`, `E/actions/products.ts:95-96,331,762`, `products/[slug]/page.tsx:45`, `E/lib/store-site/store-data.server.ts:13-57` (brands, reviews, review stats, coupons), `E/actions/seller.ts:150-152`, `E/actions/cart-offers.ts:28`, product feed `:72,247-252`, `E/lib/store-seo/offer-shipping.server.ts:15`, `D/.../social-proof/social-proof.server.ts:28`. New: `productTags.store(storeId)`, plus `storeId` in every key above. Global category/brand pack tags need no change.

**MCP and AI builder.** MCP lives in `B/mcp`: the instruction text `B/mcp/server.ts:8` ("Products belong to the seller's account…"), tools `B/mcp/tools/products.ts:31-175`, `list_stores` count `B/mcp/tools/account.ts:19-25,73`. Logic `L/products/agent-products.server.ts`: `storeShowsProduct` 133-141, `skuTaken` 357-364 (per seller), `uniqueSlug` 338-355 (global, unlike the dashboard), `agentCreateProduct` 383-479 (writes `store_products` 459-468), update 550, status 612-633, trash/restore 636-655, search 676-684, get 742. Agent skills `packages/agent/src/skills/products.ts:35-159` already pass `ctx.storeId`. Builder `D/app/(main)/ai-builder/builder-run.server.ts`: SKU dedupe by seller 298, `applyCatalog` 365-376 calls `setStoreCatalog(…, 'selected', ids)` (removed), `otherStoresShowAll` 615-621 (removed), `activateProducts` 672-688; v2 `builder-items.server.ts:174,217,358,380`.

**Database.** `store_products_same_seller` (0050:213-234; SQL test `packages/db/sql-tests/stores_invariants.sql:113-118`); `products_seller_taxonomy_same_seller` (0068:91-120); `notify_admin_product_created` finds the store through `store_products` (0116:71-77; NULL for `all` mode, so it switches to `NEW.store_id`); `record_stock_movement` (0125:111-148) and product triggers (0125:194-285, 0138:81-100) can take `products.store_id`; positions (0128:23-37); cross-sells (0145:13-33, unique includes `coalesce(store_id)`); quantity offers unique (seller, product, min_quantity) (0147:25); discount rules (0148:14-27, no FK on `gift_product_ids`).

**Constraints that break on a copy in the same account.** `unique_product_seller_sku_idx` (schema:1589, 0000:773) and every per-seller SKU check (agent `skuTaken`, builder 298, from-file 236, excel 104, the Shopify conflict target). Slugs: no DB unique index, but `L/products/product-slug.server.ts:23-51` makes them unique per seller (advisory lock at 36), so a copy would get `-2`; this becomes per store. Also check that the old `product_slug_idx` from 0000:771 is really gone on the live databases (the dry run lists `pg_indexes WHERE tablename IN ('products','product_translations')`). No conflict: quantity offers, cross-sells and positions keys include `product_id`.

**Wallet primitive callers** (`packages/db/src/wallet/store-wallet.ts`: lazy insert 178-182, `UPDATE … WHERE seller_id` 191-193, mirror 230-233, `getStoreWalletSummary` 259/268). Target wallet after the split:

| Caller | storeId today | Wallet after |
|---|---|---|
| Order fee `packages/db/src/wallet/credit-seller-on-delivery.ts:54-131` (`postOrderFees`, post at 118, store only if owned at 120, currency per seller 24-32). Placement: `place-order.ts:1107`, `L/orders/manual-order.server.ts:366`, `apps/admin/actions/orders.ts:230`. Delivery (held fees): `apps/shipping/lib/apply-shipment-status.ts:208`, `L/shipping/apply-seller-shipment.server.ts:140`. Card paid: `B/routes/paymob.ts:252`, `B/routes/kashier.ts:222`, `L/payments/store-gateways.server.ts:672` | sometimes | `orders.store_id` (NULL legacy marketplace order → primary) |
| Kashier top-up `L/store-wallet/top-up.server.ts:62-115` (insert 76-84, webhook credit 181, referral 197); manual `manual-top-up.server.ts:38,86`; admin approval `L/admin/top-ups.server.ts:89`; dashboard `D/app/(main)/wallet/top-up.server.ts:40,83` (rate limits per seller 33,76) | no | `seller_wallet_top_ups.store_id` |
| Pro plan `L/billing/plan-billing.server.ts:26,117,175`; cron `D/app/api/cron/plan-renewals/route.ts:14-15`; start Pro `settings/plan/plan.server.ts:40` | no | primary |
| AI packs `L/billing/ai-credits.server.ts:196` (`plan.server.ts:55`); email packs `L/email-campaigns/email-campaigns.server.ts:378` (`marketing/emails/email-campaigns.server.ts:147`) | no | primary |
| Store apps `L/billing/app-billing.server.ts:99` (renewal summary 347 by seller), per-order `chargeStoreAppsForOrder` 286 | yes | that store |
| Ads `D/actions/ads.ts:201` (`enforceNegativeLimit`), refund `L/store-wallet/ads.server.ts:52` | no | the product's store; the refund goes to the **same `wallet_id` as the charge** (read from the original entry) |
| Admin adjustment `L/admin/overrides.server.ts:366-413` (UI store picker `wallets/store-wallet-actions.client.tsx:60,82`, "account level" = null) | optional | chosen store, null → primary |
| Welcome gift `L/store-wallet/welcome-gift.server.ts:124,287` (ended at the USD switch) | setup store | primary (any expiry must hit the same wallet as its grant) |
| Referral commission `L/referrals/referrals.server.ts:4-9` | — | no wallet entry at all (own ledger, unique per `top_up_id`); no change |

**Fee path.** The fee snapshot `place-order.ts:715-744` and `FREE_ORDER_FEE_USD_CENTS` (`L/billing/billing.lib.ts:7`, `L/orders/platform-fee.lib.ts:142-175`) stay per seller; held fees (`place-order.ts:853-866`, `fee-hold.lib.ts:179`) need no change. Test orders: nothing passes `testOrder` any more (F-84). `orderPaysPlatformFee` is at `db/src/wallet/test-order.lib.ts:11`.

**Activation.** `L/billing/order-lock.server.ts:20-100` (`getOrderLock(sellerId)`: top-ups 37-43, `top_up` ledger 44-48, balance 49-54, pending manual 40, `loadGraceOrders` 84-100 by `order_items.seller_id`). Consumers: `currentOrderLock` on home (`(main)/page.tsx:51`, `home-header.data.tsx:46`, `attention.data.tsx:29`, `recent-orders.data.tsx:45`), `financial/page.tsx:10`, `reports/page.tsx:30`, every `orders/*` page; `requireOrders*` in actions payouts, notifications, coupons, sidebar, print, financial, product views, plan, wallet, inventory, orders, payment proof, scan returns; direct `getOrderLock` in `actions/orders.ts:18-269`, `actions/shipping.ts:62`, `dashboard-search.server.ts:41`, `api/cron/google-sheets/route.ts:27`, `push/push-alerts.server.ts:169`. AI allowance `ai-credits.server.ts:97,119`. Email holds `L/email-campaigns/email-campaigns.server.ts:431,612-630` → `email-campaigns-send.server.ts:97`. 0159 trigger `notify_seller_first_order_top_up` (0159:43-146, dedupe 55). Admin copy of the rule `apps/admin/app/(dashboard)/sellers/seller-message.server.ts:85-96`.

**Admin.** Negative limit `overrides.server.ts:239-254` (upsert on `sellerWallet.sellerId`); views `wallet-view.server.ts:98-128` (mirror check), `:190-251`, `:294-346`, `:393`, `:478-520` (already groups ledger rows by `store_id`); seller displays `seller-wallet-overview.tsx:91`, `seller-detail.client.tsx:270`, `sellers.server.ts:104-738`, `sellers-export.server.ts:147,232`; store page `stores-admin.server.ts:249-250`, `store-sections.tsx:132-136`; KPIs `overview.server.ts:37-38`, `billing-admin.server.ts:75,94`. Freeze is not built (status is display only).

**Dashboard wallet UI.** `D/app/(main)/wallet/store-wallet.server.ts:35,102,148`, `store-wallet.data.tsx:60-66`; header badge and negative dialog `(main)/layout.tsx:59-106` → `dashboard-header.client.tsx:123-137`, `negative-wallet-dialog.client.tsx:27`; home KPI reads the mirror (`home.queries.ts:129,160`); financial `financial.data.tsx:76`; payouts `actions/payouts.ts:151-158`; plan affordability `settings/plan/page.tsx:168,185`, `plan-live.client.tsx:58-60` (→ primary wallet); ad wallet `actions/ads.ts:74-92`; ≈ EGP formatters `lib/billing/egp-rate.server.ts:10`, `components/egp-rate.client.tsx:13` (unchanged).

**DB.** 0060 (status, negative limit, `wallet_transactions.store_id` 51, claims 72-78, append-only trigger 84-109 / 0134:98, `wallet_transactions_store_owner` 112-130, top-ups table 135-159); 0061 opening entries; 0136 `billing_wallet_currency()` 52-58 and `billing_switch_to_usd` 62-107 (per seller wallet loop, already run); 0140 index (seller, created_at); 0098/0142 top-up notify triggers.

## 2. Target data model

### 2.1 Catalog

#### 2.1.1 Products

- `products.store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE` (owned row, same as 0134). `seller_id` **stays** (account, RLS read path, the `order_items.seller_id` join, admin lists) and a trigger keeps `seller_id = stores.seller_id` (`products_store_same_seller`, BEFORE INSERT OR UPDATE OF store_id, seller_id).
- Indexes: `products_store_status_idx (store_id, status) WHERE deleted_at IS NULL`, `products_store_created_idx (store_id, created_at DESC)`, `products_store_trashed_idx (store_id, deleted_at) WHERE deleted_at IS NOT NULL AND purged_at IS NULL`.
- SKU: drop `unique_product_seller_sku_idx`, add `unique_product_store_sku_idx (store_id, sku)`.
- Slugs stay app-enforced (`product_translations_locale_slug_idx` is non-unique, schema:1770), but the uniqueness check and `getProductIdBySlug` become **per store** (copies keep the same slug on purpose, so links on each store's domain keep working).
- `stores.catalog_mode` and `store_products` are **read-only after the split** and dropped in the cleanup migration (F-87n). The storefront catalog becomes `WHERE p.store_id = :storeId`.
- Children keyed by `product_id` need **no new column**: `product_variants`, `product_translations`, `digital_products`, `product_quantity_offers`, `seller_category_product_positions`, `stock_movements` (already has a nullable `store_id`), `store_stock_subscriptions` (has `store_id`; add a check that it equals the product's store).

#### 2.1.2 The split map

```sql
CREATE TABLE product_store_split (
  entity      text NOT NULL CHECK (entity IN ('product','variant','seller_category','seller_brand',
                                              'cross_sell','quantity_offer','coupon','review','question')),
  old_id      uuid NOT NULL,
  store_id    uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  new_id      uuid NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('kept','copy','orphan')),
  prev_status text,                -- orphans only: the status before it was set to draft
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity, old_id, store_id)
);
CREATE UNIQUE INDEX product_store_split_new_key ON product_store_split (entity, new_id);
ALTER TABLE product_store_split ENABLE ROW LEVEL SECURITY;   -- server-only, no policies
```

`kind = 'kept'` rows (old_id = new_id) record which store kept the original row, so every lookup "this old id, in store X" is one indexed read. "Copy to store" (F-87j) writes `kind = 'copy'` rows too, so the dashboard can show "copied from".

#### 2.1.3 Categories and brands

- `seller_product_categories.store_id`, `seller_product_brands.store_id` NOT NULL FK CASCADE; unique keys become (store_id, lower(btrim(name))) and (store_id, source_*_id).
- `seller_categories` (Tallaby category picks): add `store_id`, PK becomes (store_id, category_id). `seller_id` stays as a denormalised column.
- `products_seller_taxonomy_same_seller` (0068) is replaced by `products_taxonomy_same_store`: the category or brand must have `store_id = NEW.store_id`.
- `store_discount_rules.category_ids[]` and `gift_product_ids[]` are remapped to the store's ids during the split.

#### 2.1.4 Other product-linked rows: what happens to the copies

| Row | Rule in the split | Why |
|---|---|---|
| `order_items`, `stock_movements`, `ad_campaign_requests`, `store_build_items`, `wallet_transactions.order_id` | **Stay on the original id.** | History. The dashboard resolves an old order line to "this store's copy" through the split map, for the link only. |
| Stock restock on cancel/return of an order placed **before** the split on store B | Restocks **B's copy** (lookup by `orders.store_id` + split map), not the kept row. | Otherwise a store B return would add stock to store A (R3). |
| `product_variants`, `product_translations`, `digital_products` | Copied with each product copy (variant ids mapped in the split map). | Part of the product. |
| `product_quantity_offers` | Copied per product copy. | Per product. |
| `product_cross_sells` | Today `store_id` NULL means every store. For each store that has both the product and the offer product: one row with both ids mapped to that store; `store_id` becomes NOT NULL. A rule whose offer product is not in that store is not copied there. | It could not show there before either. |
| `store_discount_rules` | Already per store; remap `gift_product_ids` / `category_ids` to that store's ids; drop ids not in the store. | Same. |
| `cart_items` of open carts with `carts.store_id = B` | `product_id`, `variant->>id`, `cross_sell_id`, `gift_rule_id` remapped to B's ids. Marketplace carts (`store_id` NULL) keep the original. | Carts keep working after the split. |
| `store_stock_subscriptions` | Remapped to the subscription's `store_id` copy. | It is already per store. |
| `seller_category_product_positions` | Follows the category copy and product copy of the same store. | — |
| `reviews` (approved, both sources) and `product_questions` + `product_answers` | **Copied** to every copy (split map rows `review` / `question`); `average_rating`, `review_count`, `total_questions` copied as they are. | Each store's product page keeps showing what it shows today (owner: "each store keeps exactly what it shows today"). New reviews belong to one store only. See Q4. |
| `wishlist_items` | Stay on the original id. | Wishlists are per user, not per store; a storefront wishlist resolves through the split map. |
| `coupons` | `coupons.store_id` nullable FK. Existing coupons stay `store_id NULL` ("every store", legacy), and their `applicable_to.productIds` gain the mapped copy ids. New coupons need a store. **Built differently (F-87k, owner 2026-11-12):** new coupons may still be "All stores" (`store_id` NULL) or one store, picked in the form's "Apply on"; a coupon with a product list needs one store. Every store-host read and checkout use `couponInStore(storeId)` (`store_id IS NULL OR store_id = store`). `code` stays unique platform-wide. | A code cannot be copied (global unique). |
| Builder trees (`store_pages.draft/published` trees, `store_site_revisions` snapshots, `saved_blocks`, `stores.shared_header/footer`) with `props.productIds`, `props.categoryId(s)` (`packages/store-sections/src/elements/data.ts:93-112, 205`) | For every non-kept store: replace mapped ids inside its own jsonb (a `jsonb_replace_ids(doc, map)` SQL function from the split map). Live revisions are rewritten in place too, so the live site keeps its picks. | Otherwise store B's "featured products" section would point at store A's rows and render empty (R4). |
| `store_email_campaigns.product_ids[]` | Remapped per campaign store. | — |

#### 2.1.5 Marketplace (tallaby.com listings)

The marketplace listing and search pages are already gone (PLAN.md:3387), so no live page changes. The leftover cross-seller code (`getProducts` without a seller, `components/home/*`, the header `search-bar.tsx`) would show every copy as its own product. **Proposal:** any cross-seller listing, today's leftovers and a future marketplace alike, reads only products with **no `copy` row** in `product_store_split`, which means the kept rows plus products created directly in a store. A product never appears twice on tallaby.com. The rule is one `NOT EXISTS` in `getProducts` when `sellerId` is absent. Deleting the unused `E/actions/search.ts` is part of F-87c.

### 2.2 Wallet

- `seller_wallet.store_id uuid NOT NULL REFERENCES stores(id) ON DELETE RESTRICT`, unique; the unique `seller_wallet_seller_id_idx` is dropped and replaced by a plain index. `seller_id` stays (admin, mirror). **RESTRICT** because a wallet with history must never disappear with a hard-deleted store (stores are soft-deleted; see Q6).
- `wallet_transactions.wallet_id uuid NOT NULL REFERENCES seller_wallet(id)`: the wallet a row moved. `store_id` stays the **reporting** store ("which store was this fee for"), so history keeps saying "store B's order" while the money sat in the one old wallet, now the primary store's. `getStoreWalletSummary` sums `WHERE wallet_id = …`, so ledger = balance holds per wallet from day one.
- Claims: `wallet_transactions_reference_once (seller_id, type, reference_type, reference_id)` **stays per seller**. Every reference id is either globally unique (order, top-up, app charge, `admin:<uuid>`) or account-level and always posted to the primary wallet (`plan:<seller>:<period>`, packs). No reference is ever charged to two stores, so a per-seller claim is stricter than a per-wallet one and still correct. The order fee stays one `order:<orderId>` claim per seller per order. `wallet_transactions_store_owner` (0060:112-130) keeps checking that the reporting store belongs to the seller, and a new check adds that `wallet_id` belongs to the seller too.
- `sellers.wallet_balance` mirror = **sum of the seller's store wallets** (`balance = balance + amount` in the same transaction). Admin lists keep working.
- `seller_wallet_top_ups.store_id uuid NOT NULL` FK (existing rows → primary store).
- `stores.activated_at timestamptz`: set once, by the top-up success path or by `postStoreWalletEntry` when a USD wallet's `balance_after > 0`. `isActivated` reads it instead of scanning the ledger.
- `postStoreWalletEntry` input: `storeId` becomes **required** and is the wallet target. A new helper `primaryStoreId(tx, sellerId)` (one indexed read on `stores_one_primary`) is used by the account-level callers: plan, AI pack, email pack, admin adjustment without a store, any expiry of an old welcome gift. Referral commissions never touch a wallet (own ledger), so they need nothing. A store-level caller passes the store: order fee, held-fee-on-delivery, store app charge, top-up, ad request (Q3; the refund reuses the charge's `wallet_id`).
- Lazy wallet creation becomes `INSERT … (seller_id, store_id, currency = billing_wallet_currency(), status = <primary wallet status>) ON CONFLICT (store_id) DO NOTHING`.
- Negative limit and status (`active` / frozen) are **per wallet**. An admin freeze on the account freezes every store wallet (one admin action, N rows).
- **Store delete with a balance (owner, Q6).** Before a store's `deleted_at` is set, `closeStoreWallet(tx, sellerId, storeId)` moves its whole balance to the primary store's wallet with two `adjustment` entries through `postStoreWalletEntry`: `store_closure_out` on the deleted store's wallet (amount = −balance) and `store_closure_in` on the primary wallet (amount = +balance), both with reference id = the deleted store id. The per-seller claim (seller, type, reference_type, reference_id) is unique for each side, so a retry posts nothing twice; a balance of exactly 0 posts nothing. Both entries and the delete run in one transaction with the deleted store's wallet row locked (`FOR UPDATE`), so no fee can land between the move and the delete. The primary store can never be deleted while the seller has another non-deleted store. *Today's rule (checked 2026-11-10):* there is no store delete in the apps at all; a seller can only archive a non-primary store, and `archiveStore` refuses the primary with `primary_store` (`packages/lib/src/stores/server.ts:376-389`); nothing sets `stores.deleted_at` outside tests. The rule stays, and any future delete path (seller or Admin) must call `closeStoreWallet` first. Archiving keeps the wallet as it is.

### 2.3 Activation per store

`ActivationInput` gains `store: { activatedAt }` and `isActivated = usdLive off OR Pro active (account) OR store.activated_at IS NOT NULL`. The grace window (`orderGraceStart`) starts at `max(stores.created_at, ORDER_GRACE_START_FLOOR)` and counts the **store's** first two real orders (`orders.store_id`). `loadOrderLock(sellerId, storeId)`, and the guards `requireOrdersStore`, `requireOrderSeller(orderId)` (store from the order) and `requireOrdersView(storeId)` take the store.

- **AI allowance (20 a month when not activated):** account level, so "activated" = **any** of the seller's stores activated, or Pro.
- **Campaign and win-back emails:** per store (the campaign has a store).
- **0159 `first_order_top_up` bell:** dedupe key becomes `first_order_top_up:<store>`, and the condition becomes "the store is not activated" (new trigger body in the migration of F-87h).
- **Backfill (Q1, owner 2026-11-10):** at the wallet split (`0164`), only the **primary** store of a seller who is activated today gets `activated_at = now()` (the money and its history sit in that wallet). Every other existing store starts **not activated**: it needs its own top-up, or a balance above 0 at some point in its own wallet. Its grace window starts at `max(stores.created_at, ORDER_GRACE_START_FLOOR)` as for any store, so an older store whose window has passed shows only its first order until it is topped up. Stores created after the migration need their own top-up too. Non-primary stores show a banner that explains this (F-87o). Pro still activates every store. The dry run lists the stores that lose activation (§3.0).

### 2.4 Server-only tables and drizzle

`product_store_split` and `platform_switches` (below) get RLS on with no policies. Every new column and table is mirrored in `schema.ts` and `relations.ts` (`products ↔ stores`, `sellerWallet ↔ stores`, `walletTransactions ↔ sellerWallet`, `sellerWalletTopUps ↔ stores`, `coupons ↔ stores`, taxonomy ↔ stores). No `drizzle-kit generate`.

`platform_switches (key text PRIMARY KEY, enabled boolean NOT NULL DEFAULT false, changed_at timestamptz, changed_by uuid)` holds two one-way switches read by the code: `stores_catalog_split` and `stores_wallet_split`. This is the same pattern as `billing_settings.usd_live` and the USD switch: code ships dark, the migration does the data move and turns the switch on as its last statement.

## 3. Migrations

Next number `0160`. All hand-written, idempotent (`IF NOT EXISTS`, guarded `DO $$` blocks), staging first, then production with owner approval. Two independent tracks, **catalog** (0160 → 0163 → 0165) and **wallet** (0161 → 0164), each with a dark-code deploy between its additive and data steps.

### 3.0 Read-only dry-run report (run on staging and production before anything)

`packages/db/scripts/stores-split-dry-run.sql` (added in F-87b; read-only: it runs inside `BEGIN READ ONLY … ROLLBACK`). It prints seven result sets: per seller (products, orphans, multi-store products and copies to create, wallet and mirror balances, activated or not, stores that lose activation), per store (visible products, copies it receives, activated after the split or not), totals, sellers whose primary-store count is not 1, mirror mismatches, cart statuses in use, and the product indexes still on the database. Run it with `psql "$DATABASE_URL" -f packages/db/scripts/stores-split-dry-run.sql` (or paste it into the Supabase SQL editor). The query sketch below was the starting point:

```sql
-- Store membership today: 'all' = every product of the seller; 'selected' = store_products.
WITH s AS (
  SELECT id, seller_id, is_primary, catalog_mode, created_at FROM stores WHERE deleted_at IS NULL
), member AS (
  SELECT s.id AS store_id, p.id AS product_id, p.seller_id
    FROM s JOIN products p ON p.seller_id = s.seller_id
   WHERE s.catalog_mode = 'all' AND p.purged_at IS NULL AND p.deleted_at IS NULL
  UNION
  SELECT s.id, sp.product_id, s.seller_id
    FROM s JOIN store_products sp ON sp.store_id = s.id
    JOIN products p ON p.id = sp.product_id AND p.deleted_at IS NULL AND p.purged_at IS NULL
   WHERE s.catalog_mode = 'selected'
), per_product AS (
  SELECT p.id, p.seller_id, count(m.store_id) AS stores
    FROM products p LEFT JOIN member m ON m.product_id = p.id
   WHERE p.purged_at IS NULL AND p.deleted_at IS NULL
   GROUP BY p.id, p.seller_id
)
SELECT se.id AS seller_id,
       (SELECT count(*) FROM s WHERE s.seller_id = se.id)                      AS stores,
       (SELECT count(*) FROM s WHERE s.seller_id = se.id AND s.is_primary)     AS primary_stores,   -- must be 1
       count(pp.id)                                                            AS products,
       count(*) FILTER (WHERE pp.stores = 0)                                   AS orphans,
       count(*) FILTER (WHERE pp.stores = 1)                                   AS single_store,
       count(*) FILTER (WHERE pp.stores > 1)                                   AS multi_store,
       coalesce(sum(greatest(pp.stores - 1, 0)), 0)                            AS copies_to_create,
       (SELECT count(*) FROM product_variants v JOIN per_product q ON q.id = v.product_id
         WHERE q.seller_id = se.id AND q.stores > 1)                           AS variants_on_multi,
       (SELECT count(*) FROM products t WHERE t.seller_id = se.id AND t.deleted_at IS NOT NULL) AS trashed,
       (SELECT count(*) FROM seller_product_categories c WHERE c.seller_id = se.id) AS categories,
       (SELECT count(*) FROM seller_product_brands b WHERE b.seller_id = se.id)     AS brands,
       (SELECT count(*) FROM coupons c WHERE c.seller_id = se.id)                   AS coupons,
       (SELECT count(*) FROM product_cross_sells x WHERE x.seller_id = se.id AND x.store_id IS NULL) AS cross_sells_all_stores,
       (SELECT count(*) FROM carts c WHERE c.store_seller_id = se.id AND c.status = 'active') AS open_store_carts,
       w.balance AS wallet_balance, w.currency AS wallet_currency, w.status AS wallet_status,
       se.wallet_balance AS mirror_balance,                                    -- must equal w.balance
       (SELECT count(*) FROM seller_wallet_top_ups t WHERE t.seller_id = se.id AND t.status = 'succeeded') AS top_ups
  FROM sellers se
  LEFT JOIN per_product pp ON pp.seller_id = se.id
  LEFT JOIN seller_wallet w ON w.seller_id = se.id
 GROUP BY se.id, w.balance, w.currency, w.status, se.wallet_balance
HAVING count(pp.id) > 0 OR w.balance IS NOT NULL
 ORDER BY copies_to_create DESC;
-- Plus totals: sum(copies_to_create), sum(wallet_balance), sellers with primary_stores <> 1,
-- sellers whose mirror_balance <> wallet_balance, and status values actually used by carts.
```

The owner reviews the totals (copies to create, orphans, balances to move) before 0163 / 0164 run.

### 3.1 Sequence

| # | File | Kind | Apply | What |
|---|---|---|---|---|
| 1 | `0160_store_separation_columns.sql` | additive | **BEFORE** deploying any F-87 code (product, taxonomy, coupon and top-up queries select every column) | `platform_switches` (+ two rows, off); `products.store_id` nullable FK + indexes; `product_store_split`; `store_id` nullable on `seller_product_categories`, `seller_product_brands`, `seller_categories`, `coupons`, `seller_wallet_top_ups`; `stores.activated_at`; widen `stock_movements_reason_check` with `'copy'` (live definition, guarded). Nothing reads them yet. |
| 2 | `0161_store_wallet_columns.sql` | additive + safe backfill | **BEFORE** deploying F-87f | `seller_wallet.store_id` nullable FK RESTRICT, backfilled to the primary store, plus a **partial** unique index on `store_id`; `wallet_transactions.wallet_id` nullable FK, backfilled to the seller's one wallet; a BEFORE INSERT compat trigger fills `wallet_id` (the seller's only wallet) and `seller_wallet_top_ups.store_id` (primary) when old code omits them; backfill top-ups → primary. No activation backfill here (it moved to 0164, Q1). One wallet per seller still, so old code keeps working unchanged. |
| 3 | deploy dark code | — | — | F-87a…e and F-87f…g with both switches off: the code reads `store_id` paths only when a switch is on, and writes `store_id` on new rows either way. |
| 4 | `0163_store_catalog_split.sql` | **data** | **AFTER** the dark deploy; low-traffic hour; owner approval on production | The catalog split (§3.2). Last statement: `stores_catalog_split = true`. |
| 5 | `0164_store_wallet_split.sql` | **data/constraint** | **AFTER** the dark deploy (can run before or after 0163) | Assert `seller_wallet.store_id` and `wallet_transactions.wallet_id` have no NULLs; drop `seller_wallet_seller_id_idx`, add plain index; make the `store_id` unique index full; NOT NULL on `seller_wallet.store_id`, `wallet_transactions.wallet_id`, `seller_wallet_top_ups.store_id`; drop the compat trigger; replace the 0159 trigger body with the per-store one (`first_order_top_up:<store>`); **activation backfill (Q1):** `UPDATE stores SET activated_at = now() WHERE is_primary AND deleted_at IS NULL AND activated_at IS NULL` for sellers who are activated by today's rule (succeeded top-up, `top_up` ledger entry, balance above 0 now, or a USD entry that ever left it above 0; the same rule as `getOrderLock`), and **no** other store; one `store_needs_top_up` bell row per non-primary store of those sellers (F-87o); last statement `stores_wallet_split = true`. **No balance moves**: the existing row simply is the primary store's wallet. Other stores' wallets are created lazily at 0. |
| 6 | `0165_store_separation_cleanup.sql` | contract | **AFTER** two weeks with both switches on and the dashboards checked | Drop `store_products`, `stores.catalog_mode`, `store_products_same_seller`; `products.store_id`, taxonomy `store_id`, `product_cross_sells.store_id` NOT NULL (already enforced by checks in 0163, here as constraints); drop the old taxonomy trigger; remove the switch reads from code in the same deploy. |

`0162` is left free for a fix between steps.

### 3.2 `0163_store_catalog_split.sql`, step by step

Runs in **one transaction** (the dry run gives the size; on production today it is a few thousand rows). If the dry run shows more than ~50k copies, it switches to one transaction per seller, driven by a `DO` loop that skips sellers already in `product_store_split`. Steps:

1. **Guards:** abort if `stores_catalog_split` is already true; abort if any seller with products has `count(primary) <> 1`; `LOCK TABLE products, store_products, stores IN SHARE ROW EXCLUSIVE MODE` (writes wait, reads go on).
2. **Snapshot the before state** into a temp table: `before_visible(store_id, product_id)` = the membership query of §3.0 (active, non-trashed), plus `before_counts(store_id, n_active)`.
3. **Pick the kept store** per product: the primary store if it is a member; else the oldest member store; for orphans (no member) the primary store, with `status = 'draft'` and `prev_status` saved (Q2-b); trashed products go to the store that listed them in `store_products`, else the primary store (they stay in that store's Trash only, no copies); purged products go to the primary store, no copies. `UPDATE products SET store_id = kept`. Insert `kept` / `orphan` rows in the map.
4. **Categories and brands:** for each store, a copy of every seller category/brand used by that store's products (or, simpler and recommended, **every** category/brand to every store, so empty stores keep the seller's list); the primary store keeps the original rows. Map rows `seller_category` / `seller_brand`. Same for `seller_categories` picks.
5. **Product copies:** for each (product, non-kept member store): `INSERT INTO products SELECT … gen_random_uuid(), store_id = :store, seller_category_id/brand_id mapped, same quantity, status`, then variants, translations, digital rows, quantity offers, category positions; map rows `product` / `variant`. Stock movements are written with reason `'copy'` through `set_config('tallaby.stock_reason','copy', true)`.
6. **Cross-sells, discount rules, coupons, reviews, questions:** per §2.1.4.
7. **Remap references:** open carts and cart items, back-in-stock subscriptions, email campaigns, builder jsonb (`jsonb_replace_ids` on drafts, live revisions, saved blocks, shared header/footer) for every store whose ids changed.
8. **Constraints:** drop `unique_product_seller_sku_idx`, create `unique_product_store_sku_idx`; install `products_store_same_seller` and `products_taxonomy_same_store` (proposed SQL below, F-87d); `CHECK (store_id IS NOT NULL) NOT VALID` then `VALIDATE`.

   **Taxonomy in 0163 (F-87d, 2026-11-10).** Notes for steps 4, 8 and 9, from the code built in F-87d:

   - **`store_id` is already set on new taxonomy rows.** Since the F-87d deploy every new seller category and brand is written with `store_id` = the store it was added from (Products › Categories / Brands, the product form, the file import, the AI Store Builder, the MCP and in-app agent). Nothing reads it while the switch is off. Step 4 must **not assume `store_id IS NULL`**: the kept row of a category or brand goes to its own `store_id` when that store is not deleted, else to the primary store; then step 4 copies it to every other store. Rows with `store_id` NULL (made before F-87d) go to the primary store, as planned. The same applies to `products.store_id` (§3 of the slices doc).
   - **CASCADE before the split.** `seller_product_categories.store_id` and `seller_product_brands.store_id` are `ON DELETE CASCADE` (0160). The apps only soft-delete stores, so nothing hard-deletes one today, but a hard store delete before 0163 would now remove a category the whole seller shares. Any hard delete of a store must wait for 0163, or set these columns to NULL first.
   - **Unique keys.** `seller_product_categories_name_key` / `_source_key` and the brand pair stay `(seller_id, …)` until 0163 replaces them with `(store_id, lower(btrim(name)))` and `(store_id, source_*_id)` (§2.1.3). Until then two stores can't hold the same name (as today: one list).
   - **`seller_categories`** (Tallaby category picks, PK `(seller_id, category_id)`) has no reader or writer in the app code (checked 2026-11-10: only the schema names it). Step 4 can copy it per store or leave it; no code depends on it.
   - The app already refuses a cross-store category or brand with the switch on (`taxonomyItemsInStore` in `setProductSellerTaxonomy`, `assertProductTaxonomyInStore` in `createProduct` / `updateProduct`, `resolveCategories` in the agent). The trigger below makes the database refuse it for every writer.

   Proposed SQL. Place it in `0163_store_catalog_split.sql` **after** step 7, once every product and taxonomy row has its store. The 0068 trigger `products_seller_taxonomy_same_seller` stays until 0165 (both pass after the split). The rollback script drops these triggers and functions first.

   ```sql
   -- A product may only use its own store's seller category and brand (F-87d).
   -- Replaces 0068's same-seller check (that one is dropped in 0165).
   CREATE OR REPLACE FUNCTION public.products_taxonomy_same_store()
   RETURNS trigger
   LANGUAGE plpgsql
   SET search_path = public
   AS $$
   BEGIN
     IF NEW.seller_category_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM seller_product_categories c
       WHERE c.id = NEW.seller_category_id
         AND c.seller_id = NEW.seller_id
         AND c.store_id = NEW.store_id          -- a NULL store on either side fails
     ) THEN
       RAISE EXCEPTION 'products: seller category % is not in store %', NEW.seller_category_id, NEW.store_id
         USING ERRCODE = 'check_violation';
     END IF;
     IF NEW.seller_brand_id IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM seller_product_brands b
       WHERE b.id = NEW.seller_brand_id
         AND b.seller_id = NEW.seller_id
         AND b.store_id = NEW.store_id
     ) THEN
       RAISE EXCEPTION 'products: seller brand % is not in store %', NEW.seller_brand_id, NEW.store_id
         USING ERRCODE = 'check_violation';
     END IF;
     RETURN NEW;
   END;
   $$;

   DROP TRIGGER IF EXISTS products_taxonomy_same_store ON public.products;
   CREATE TRIGGER products_taxonomy_same_store
     BEFORE INSERT OR UPDATE OF seller_category_id, seller_brand_id, seller_id, store_id ON public.products
     FOR EACH ROW EXECUTE FUNCTION public.products_taxonomy_same_store();

   -- The other direction: a category or brand can't move to another store (or seller)
   -- while a product of a different store still uses it.
   CREATE OR REPLACE FUNCTION public.seller_taxonomy_store_in_use()
   RETURNS trigger
   LANGUAGE plpgsql
   SET search_path = public
   AS $$
   BEGIN
     IF NEW.store_id IS DISTINCT FROM OLD.store_id OR NEW.seller_id IS DISTINCT FROM OLD.seller_id THEN
       IF (TG_TABLE_NAME = 'seller_product_categories' AND EXISTS (
             SELECT 1 FROM products p
             WHERE p.seller_category_id = OLD.id
               AND (p.store_id IS DISTINCT FROM NEW.store_id OR p.seller_id <> NEW.seller_id)))
          OR (TG_TABLE_NAME = 'seller_product_brands' AND EXISTS (
             SELECT 1 FROM products p
             WHERE p.seller_brand_id = OLD.id
               AND (p.store_id IS DISTINCT FROM NEW.store_id OR p.seller_id <> NEW.seller_id))) THEN
         RAISE EXCEPTION '%: % is used by products of another store', TG_TABLE_NAME, OLD.id
           USING ERRCODE = 'check_violation';
       END IF;
     END IF;
     RETURN NEW;
   END;
   $$;

   DROP TRIGGER IF EXISTS seller_product_categories_store_in_use ON public.seller_product_categories;
   CREATE TRIGGER seller_product_categories_store_in_use
     BEFORE UPDATE OF store_id, seller_id ON public.seller_product_categories
     FOR EACH ROW EXECUTE FUNCTION public.seller_taxonomy_store_in_use();
   DROP TRIGGER IF EXISTS seller_product_brands_store_in_use ON public.seller_product_brands;
   CREATE TRIGGER seller_product_brands_store_in_use
     BEFORE UPDATE OF store_id, seller_id ON public.seller_product_brands
     FOR EACH ROW EXECUTE FUNCTION public.seller_taxonomy_store_in_use();

   -- Step 9, one more invariant: no product uses another store's category or brand.
   DO $$
   BEGIN
     IF EXISTS (
       SELECT 1 FROM products p
       LEFT JOIN seller_product_categories c ON c.id = p.seller_category_id
       LEFT JOIN seller_product_brands b ON b.id = p.seller_brand_id
       WHERE (p.seller_category_id IS NOT NULL AND c.store_id IS DISTINCT FROM p.store_id)
          OR (p.seller_brand_id IS NOT NULL AND b.store_id IS DISTINCT FROM p.store_id)
     ) THEN
       RAISE EXCEPTION '0163: a product uses a category or brand of another store';
     END IF;
   END $$;

   -- Rollback (first lines of 0163_rollback.sql):
   --   DROP TRIGGER IF EXISTS products_taxonomy_same_store ON public.products;
   --   DROP TRIGGER IF EXISTS seller_product_categories_store_in_use ON public.seller_product_categories;
   --   DROP TRIGGER IF EXISTS seller_product_brands_store_in_use ON public.seller_product_brands;
   --   DROP FUNCTION IF EXISTS public.products_taxonomy_same_store();
   --   DROP FUNCTION IF EXISTS public.seller_taxonomy_store_in_use();
   ```

   Add an SQL test with it (`packages/db/sql-tests/stores_invariants.sql`): a store B product can't take a store A category or brand (insert and update), and a store A category that a store A product uses can't be moved to store B.
9. **Invariant checks** (each `RAISE EXCEPTION` rolls everything back):
   - every product has a `store_id`, and `products.seller_id = stores.seller_id`;
   - for every store: the set of `(store, product)` visible after (active, not trashed, `store_id = store`, resolved through the map back to old ids) **equals** `before_visible`; `before_counts` equal;
   - every product has exactly as many variants and translations as its source;
   - `sum(quantity)` per store over its products equals the before sum over its members (same stock numbers);
   - no cart item points at a product of another store than its cart;
   - no category or brand is shared across stores.
10. `UPDATE platform_switches SET enabled = true … WHERE key = 'stores_catalog_split'`.

**Rollback.** Before the switch flips, the transaction rolls back by itself. After it flips: (a) turn the switch off (the code falls back to `catalog_mode` reads, which still work because `store_products` and `catalog_mode` are kept until 0165); (b) a prepared `0163_rollback.sql` deletes the `copy` rows (`DELETE FROM products WHERE id IN (SELECT new_id FROM product_store_split WHERE entity='product' AND kind='copy')`, cascading to their children), restores orphan statuses from `prev_status`, rewrites carts and jsonb back through the map, drops the new indexes and restores the SKU index. Orders placed on copies in between keep their `order_items.product_id`. Their product then becomes a purged-style "missing" product, so rollback after real orders on copies needs owner approval. **After 0165, there is no rollback.**

### 3.3 `0164_store_wallet_split.sql` invariants

Before and after, in the same transaction: `sum(seller_wallet.balance)` per seller unchanged; `activated_at` is set on primary stores only, on exactly the primaries of sellers activated before the migration (the count equals the dry run's `activated_sellers`); `sellers.wallet_balance = sum(balance)` per seller; every `seller_wallet` row has a store, and it is the primary store; per wallet, `balance = sum(amount) WHERE wallet_id = w.id AND currency = w.currency`; the number of `wallet_transactions` rows unchanged. **Rollback:** before 0165 nothing else depends on the wallet split, so switch off, then recreate the seller unique index. That only works while each seller still has one wallet, so any lazily created store wallets at 0 with no rows are deleted first. A store wallet with entries cannot be rolled back automatically (owner decision).

### 3.4 `0163`: status, how it was built, apply steps, E2E

**Status (2026-11-11): applied on staging (2026-11-10 23:12Z) and production (2026-11-11, after deploying `9e2ae0ee`); `stores_catalog_split` is ON; verify all 0 on both (ROADMAP.md §7). Manual E2E below not yet walked through.** Before that: written, not applied. `packages/db/migrations/0163_store_catalog_split.sql` (≈68 KB, one transaction), `packages/db/scripts/stores-split-rollback.sql`, `packages/db/scripts/stores-split-verify.sql` (read-only). Tested only on a local throwaway PostgreSQL 18 cluster with a stub schema (two sellers; an 'all' primary, a 'selected' store, a deleted store; orphan, trashed product, variants, translations, digital rows, reviews, questions, cross-sells, a quantity offer, a discount rule, a coupon, open carts, a back-in-stock alert, a campaign, drafts, a live revision, a saved block): run 1 passes; run 2 is a no-op; verify all ok; rollback refused with an order on a copy, then passes and restores every compared table exactly; rollback again is a no-op; 0163 again passes; an injected fault (a copy losing its translations) and a seller without a primary both abort with nothing changed; the real `restoreStock` / `decrementStock` route a pre-split store B order to B's copy.

**Where the file differs from §3.2 (decisions, 2026-11-10):**

- **Kept store:** the product's own `products.store_id` when that store shows it, else the primary store when it shows it, else the oldest store that shows it (slices doc §3: rows made since slice 1 already name a store). Copy counts are the same as the dry run's.
- **Live sites get a new revision** (published_by NULL, number max + 1), as the 2026-10-24 product-page backfill did, instead of rewriting a revision in place: `store_site_revisions` is append-only (0051 trigger). Drafts bump `draft_version`, shared header/footer bump `chrome_version`, so an open builder tab gets a conflict instead of saving old ids. The replace also covers `template_installs.previous_draft` and `stores.settings`. The replace is a text replace of each copied id (uuids, so it can only hit that id).
- **Taxonomy:** every category and brand is copied to every live store of the seller (§3.2 step 4 "recommended"); the per-seller unique keys become per store **inside 0163** (needed before the copies). `seller_categories` picks (no reader) go to the primary store, no copies, PK unchanged.
- **Cross-sells:** a NULL-store row becomes one row per store that shows both products; the original row goes to the store where both ids are the kept rows (else the first such store, primary first), and its map row has `prev_status = 'every_store'` so the rollback can put NULL back. A store-specific twin wins over the NULL row. A row whose products never met in one store is left as it was (verify check 12 lists them; 0165 can delete them).
- **Discount rules, campaigns:** an id with no row in the rule's store is kept as it is (it was unusable there before too), not dropped, so the rollback is exact.
- **Coupons:** `applicable_to.productIds` and `exclude_items.productIds` gain the copy ids; coupons stay `store_id` NULL.
- **Reviews and questions:** approved reviews (both sources) and approved questions with all their answers are copied; votes and review comments are not.
- **Positions:** each store's category copy gets the same position for that store's product copy; the original rows are not touched (a stale cross-store original row is harmless).
- **Notifications:** `products_notify_admin_created`, `products_start_fee_trial_insert`, `reviews_notify_seller`, `product_questions_notify_seller` are disabled for the copy inserts only (inside the transaction), so no bell, push webhook or fee-trial start fires for copies.
- **Also in 0163:** `record_stock_movement` accepts `'copy'` and falls back to the product's store; `products_store_same_seller` fills a NULL store from the primary store (old writers) and refuses another seller's store; NOT NULL checks on products and taxonomy `store_id`; `notify_admin_product_created` reads `products.store_id` first; `categories.product_count` +1 per active copy, −1 per active orphan.
- **Invariants asserted (RAISE EXCEPTION):** 9.1 every product in a live store of its seller; 9.2 each store's visible set (active, live) equals the before set, no duplicates, same counts; 9.3 each store's live set equals its memberships (orphans in the primary as drafts); 9.4 every copy has the source's quantity, status, variant count and stock, translations, digital rows, quantity offers; 9.5 per-store stock sums unchanged; 9.6 no open store cart line on another store's row (product or cross-sell) when its store has its own; 9.7 no product uses another store's category/brand, copies kept their category/brand, every store has the whole list, no taxonomy row outside a live store of its seller; 9.8 every planned cross-sell pairs rows of its own store; 9.9 each copy has the source's approved reviews and questions; 9.10 one map row per product, copies = memberships − 1; 9.11 positions copied; 9.12 no discount rule or builder document names an id copied into its store; 9.13 **no money moved** (wallet sum and count, ledger rows and sum, mirror sum, orders, order items unchanged); 9.14 the transaction wrote only `'copy'` stock movements, each in its product's store; 9.15 notification triggers back on.

**Code that must be deployed before 0163** (done in this task, uncommitted): `STOCK_MOVEMENT_REASONS` has `'copy'` (`packages/db/src/inventory/stock-context.ts`; dashboard `inventory.lib.ts` + `ar.json`/`en.json` label); `restoreStock` / `decrementStock` / `ensureStockAtLeast` send a pre-split order's lines to the copy in the order's store through `product_store_split` (`packages/db/src/inventory/stock.ts`, one query only when the context names an order; results keep the caller's ids); the Shopify import's `onConflictDoNothing()` has no target (the SKU key changes from seller to store); the drizzle mirror (`schema.ts`: per-store SKU and taxonomy keys, the checks). Everything else already reads the switch (F-87c/d).

**Apply on staging** (owner runs; never production without approval):

1. Deploy `main` with the code above to staging (switch still off). Confirm the staging project ref first (the dashboard and ecommerce `.env` are staging; admin is production).
2. `psql "$STAGING_DB" -X -f packages/db/scripts/stores-split-dry-run.sql > dry-run-staging.txt` and keep the totals.
3. `psql "$STAGING_DB" -X -v ON_ERROR_STOP=1 -f packages/db/migrations/0163_store_catalog_split.sql` (expect `NOTICE: 0163: split done: …`, `UPDATE 1`, `COMMIT`; any `ERROR` means nothing changed).
4. `psql "$STAGING_DB" -X -f packages/db/scripts/stores-split-verify.sql > verify-staging.txt`: every `must_be_zero` row is `ok`; per-store copies match the dry run's `copies_received`.
5. Save result set 4 as `tags.json` and purge: `curl -X POST "$ECOMMERCE_URL/api/revalidate" -H "x-revalidate-secret: $REVALIDATE_SECRET" -H 'content-type: application/json' --data @tags.json` (and the same to `$DASHBOARD_URL`), or wait an hour (TTL).
6. The E2E below, logged in `PLAN.md` §23.
7. Production: owner approval, low-traffic hour (Cairo night), same steps 2–5 against production.

**Staging E2E checklist (seeded multi-store seller: primary 'all' + one 'selected' store, a product in both):**

- [ ] Each store's storefront shows the same products, categories, brands, reviews and Q&A as before; a shared slug opens each store's own copy.
- [ ] Featured-products and category sections of the non-primary store still show their products (live site and builder drafts).
- [ ] An open cart on the non-primary store from before the split still checks out (variant and cross-sell discount kept), and the order's lines name that store's copy.
- [ ] Cancel and return a pre-split order of the non-primary store: the stock goes back to that store's copy, not the primary's (Inventory history shows the movement in that store).
- [ ] Stock of the copy changes on its own (sell one in store B; store A's number stays).
- [ ] Dashboard: `/stores/A/products` and `/stores/B/products` list only their own rows; editing B's copy never changes A's; same SKU allowed in both stores, refused twice in one.
- [ ] Categories & brands page per store; assigning another store's category is refused.
- [ ] Coupon with a product list works in both stores; discount-rule gift and category rule work in store B.
- [ ] Back-in-stock alert on B's copy is sent when B restocks.
- [ ] No new bells or admin notifications from the split; no wallet entry changed (verify check / wallet page).
- [ ] MCP `list_stores` counts and `search_products` per store.

### 3.5 `0163` rollback (before 0165 only)

`psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -f packages/db/scripts/stores-split-rollback.sql` (owner approval on production). One transaction. It **refuses**, changing nothing, when: an order line points at a copied product or variant (deleting the copy would CASCADE it); an ad request points at a copy; a customer review or question was written on a copy; the map has rows not written by 0163 ("Copy to store"); or restoring the per-seller unique keys would fail (two products of one seller now share a SKU, or two categories/brands a name or source). Otherwise: switch off; drop the 0163 triggers and checks; point carts (any status), back-in-stock alerts, campaigns, discount rules, coupon lists, products' categories and brands, cross-sells (original ids and NULL store back), positions of post-split products, and the builder JSON back at the original rows (a live site naming a copy gets a new revision); orphans get their old status while still draft; category counters; delete the copies and copied taxonomy; per-seller unique keys back; empty the map. It leaves `products.store_id` and taxonomy `store_id` as 0163 set them (unread with the switch off). Idempotent: with an empty map it only ensures the switch is off and the keys are back. Purge the cache tags (verify result set 4, saved before) afterwards.

## 4. Code changes by phase

Every task: lint, typecheck, test (rule 15), `ROADMAP.md` §6/§7 updated, DB tests where `TEST_DATABASE_URL` is set.

### Phase A — Foundations (no behaviour change)

- **F-87a · P1 · deps: —** `platform_switches` reader (`isSwitchOn(key)`, per-request `cache`, never cached across requests), `primaryStoreId(tx, sellerId)`, `storeOwnedBy(sellerId, storeId)` helpers; one shared `assertStoreProduct(storeId, productId)` guard. Tests: unit tests plus a tenant-isolation suite skeleton (DB): seller S1 with stores A and B, and seller S2. *Accept:* nothing user-visible changes; the suite runs.
- **F-87b · P1 · deps: F-87a** Migration `0160` + drizzle mirror; dry-run script `packages/db/scripts/stores-split-dry-run.sql`; run it read-only on staging and production and paste the totals into `ROADMAP.md` §7. *Accept:* the owner has seen copies-to-create and balances.

### Phase B — Store-scoped catalog code (dark until `stores_catalog_split`)

- **F-87c · P1 · deps: F-87b** Move `/products/*` to `/stores/[storeId]/products/*` (old URLs redirect to the selected store), so every product action takes an explicit `storeId` and calls `requireStore`. Catalog reads behind the switch: storefront catalog, product page, slug lookup, category pages, search, sitemap, feeds, back-in-stock, cart add, `place-order.ts` product/store checks, the cross-seller listing rule (§2.1.5); cache keys and tags gain `storeId` (rule 8) for every product, category and brand query; dashboard /products, inventory, low stock, trash, bulk edit, import, export, reviews/questions, quantity offers, cross-sells, discount rules, category positions use `storeId` from the URL or explicit argument (the `tallaby_store` cookie only picks where links go, `apps/dashboard/lib/stores/current-store.server.ts:7-29`); writes set `store_id`. *Accept:* with the switch off, all existing tests pass; with it on (test DB), store A never returns store B's product. *Tests:* tenant isolation: read, update, trash, restore, bulk edit, import, offer and cross-sell create across stores are refused (`not_found`), including forged `storeId`/`productId` pairs.
- **F-87d · P1 · deps: F-87c** Taxonomy per store: category and brand lists, pickers, the product form, AI autofill category matching, discount rule scope, category positions. *Accept/tests:* a product in A cannot use B's category (trigger + action). **Built 2026-11-10 (uncommitted):** the action side and its tests ([slices doc §10](stores-separation-f87c-slices.md)); the trigger is the proposed SQL in §3.2 and lands with 0163 (F-87m).
- **F-87e · P1 · deps: F-87c** MCP and agent: product tools filter by `store_id` and create in the given store; the MCP server instructions (`apps/backend/src/mcp/server.ts:8`) say "products belong to one store" (today: "Products belong to the seller's account; a store shows all of them or only its picks"); AI Store Builder `activateProducts` and the builder's product writes set `store_id`, never `store_products`. *Tests:* a grant limited to store A cannot read or write B's products.
- **F-87m · P1 · deps: F-87c** Migration `0163` (+ rollback script) on staging; full manual E2E on a seeded multi-store seller (§23 PLAN.md): every store shows the same products as before, carts survive, a return on a pre-split store B order restocks B's copy. Production with owner approval.

### Phase C — Per-store wallet (dark until `stores_wallet_split`)

- **F-87f · P1 · deps: F-87a** `postStoreWalletEntry` requires `storeId` (wallet target); `UPDATE seller_wallet … WHERE store_id = :store` when the switch is on, `WHERE seller_id` when off (always the primary store then); `wallet_id` on every insert; the mirror stays a sum; `getStoreWalletSummary(storeId)`. Every caller passes the right store: order fee and held fee → `orders.store_id` (marketplace order → primary); store app charge → its store; top-up → `seller_wallet_top_ups.store_id`; ad request → the promoted product's store, refund → the charge's `wallet_id` (owner, Q3); `closeStoreWallet` before any store delete (§2.2, Q6), refused for the primary while another store exists; plan, AI pack, email pack, admin adjustment without a store → `primaryStoreId`; the plan page's "can afford" checks read the primary wallet. *Tests (DB):* idempotency per claim (replay = no change, any store); a store delete moves a positive and a negative balance to the primary, a retry moves nothing, and deleting the primary while another store is open is refused; a fee for a store B order moves only B's wallet; an account charge moves only the primary; concurrent fees on A and B; the mirror equals the sum; the currency guard per wallet; negative limit per wallet.
- **F-87g · P1 · deps: F-87f** Top-ups choose a store: Kashier and manual top-up creation take `storeId` (`requireStore`), the webhook and the admin approval credit that store's wallet and set `stores.activated_at`; the referral commission still posts once per top-up. Activation per store (§2.3): `loadOrderLock(sellerId, storeId)`, the guards, the grace banner, AI allowance = any store activated, campaign/win-back hold per store. Existing non-primary stores are **not** activated by the migration (Q1); they activate with their own top-up or their own wallet going above 0. *Tests:* store A top-up activates A only; a non-primary store of a seller activated before the split stays locked until its own top-up; Pro activates every store; the grace window per store; a forged storeId on a top-up is refused.
- **F-87o · P1 · deps: F-87g; ships with F-87h** Activation notice on non-primary stores (owner, Q1): on every dashboard page of a non-primary store that is not activated (seller not on Pro), a banner: "{store} is a separate store with its own wallet. Top up this store to keep seeing its new orders." with a "Top up {store}" button (opens the top-up dialog for that store). Sellers who were activated before the split also get a one-time bell row per affected store (`store_needs_top_up`, dedupe `store_needs_top_up:<store>`, written by `0164`). Strings in `ar.json` and `en.json`. *Tests:* the banner shows for a not-activated non-primary store, never for the primary, an activated store or a Pro seller.
- **F-87h · P1 · deps: F-87g** Migrations `0161` (before the deploy) and `0164` (after); admin app: wallet per store on the seller page, adjustments choose the store (default primary), negative limit and freeze per wallet, top-up review shows the store, totals by account. Staging, then production with owner approval.

### Phase D — UX

- **F-87i · P1 · deps: F-87c, F-87g** Dashboard: the store switcher scopes /products, inventory, categories, brands, coupons and wallet; the wallet page shows the selected store's balance, entries and top-up button, plus an "All stores" total line and a note on which store pays account charges ("Pro and AI packs are paid from your main store, {name}"); activation and grace banners per store (the non-primary notice itself is F-87o); F-86 setup steps per store; new-store empty states ("This store has no products yet. Add a product or copy from {other store}."). Strings in `ar.json` and `en.json`.
- **F-87j · P1 · deps: F-87m** "Copy to store" (single row action and bulk bar on /products, shown only with 2+ stores): dialog picks one or more target stores; reviews and questions are never copied (owner, Q4); server action `copyProductsToStores(sourceStoreId, productIds, targetStoreIds)` checks both stores are the seller's, caps 200 products per call, copies product + variants + translations + digital + quantity offers + images (same URLs) + SEO, maps the category/brand by name into the target store (creating it if missing), same stock, status per Q2, SKU clash → suffix `-2` (reported), writes `copy` map rows and a `'copy'` stock movement. Cross-sells and reviews are not copied. *Tests:* tenant isolation (a foreign source or target is refused), idempotent re-run (no duplicate on retry: the action's own claim `copy:<source>:<target>` in the map), the SKU clash, the category mapping, the currency warning.
- **F-87k · P2 · deps: F-87c** Remaining account-level settings per store: `coupons.store_id` for new coupons (**built 2026-11-12, differs:** "Apply on" in the coupon form, All stores = NULL allowed by owner request, the list stays at /coupons filtered by the selected store; ROADMAP.md §7), policies per store (`stores.settings.policies` with a fallback to `sellers.*_policy`, closes F-46), one custom domain per store (drop the `seller_id` unique index; UI under Website › Domain).
- **F-87l · P2 · deps: F-87k** Fulfillment profile per store (Q5), only if the owner says yes.

### Phase E — Cleanup

- **F-87n · P2 · deps: F-87m, F-87h, +2 weeks** Migration `0165`; remove the switch branches, `catalog_mode` UI (the "Show all / selected products" control) and `store_products` code; docs: `docs/wallet.md`, `docs/fulfillment.md` (no change expected), `PROJECT.md`, CLAUDE.md rule 5/7 wording ("one wallet per store").

## 5. UX notes

- **Store switcher:** today it decides where sidebar links go. After the split it also decides which store's products, wallet and categories appear. Every list page shows the store name in its header ("Products — {store}"), so a seller with several stores is never unsure which store they are looking at. Writes still take the store id from the URL or form, never from the cookie (rule 5).
- **Products list:** no "In stores" column any more. A small "Copied from {store}" tag on copies (from the map) for the first 30 days.
- **Wallet:** balance per store; the top-up dialog defaults to the selected store and shows the store name on the pay button ("Top up {store}"); the account charges line names the primary store; Admin shows per-store rows and an account total.
- **Activation banners:** per store. "{store} isn't activated yet: top up this store to keep seeing its new orders." Pro sellers never see it.
- **Copy-to-store dialog:** target store checkboxes; a line "Stock is copied as is: {n} units now in both stores; they no longer share stock" (R1); a warning when the target store's currency differs (prices are copied as numbers, never converted: F-61b), with the copy saved as draft (Q2); a result list (copied, SKU renamed, failed).
- **One-time notice after the split** (sellers with `multi_store > 0`): "Your stores are now separate. {n} products that were in several stores now have their own copy in each store, with their own stock." Links to /products.

## 6. Risks and open questions

**Risks**

- **R1 Stock doubles.** A product shared by 2 stores today has one stock (say 10). After the split each copy has 10, so 20 can be sold. This follows the owner's "same stock" rule. Mitigation: the one-time notice and the copy dialog line.
- **R2 Copying an active product publishes it at once.** It goes live on the target store with full stock, and if the target store sells in another currency, the copy shows a wrong price. Mitigation: Q2.
- **R3 Restock of pre-split orders.** Handled by the split-map lookup (§2.1.4). Covered by an E2E check in F-87m.
- **R4 Builder picks.** Featured-product and category sections on non-primary stores point at old ids. Handled by the jsonb remap in 0163, which needs a careful test on real trees (live revisions are rewritten in place).
- **R5 Duplicate content.** The same product text on two store domains. Each store has its own canonical URL. Low risk, the same as today.
- **R6 Big migration.** Locks product writes for its duration. Run it at a low-traffic hour; the dry run gives the size first.
- **R7 Shared media.** Old uploads with `media_assets.store_id` NULL stay visible in every store's library. Harmless: they are the seller's own files.

**Decided (owner, 2026-11-10)**

1. **Q1 Activation on migration day:** only the **primary** store keeps the activated status. Every other existing store of an activated seller starts **not activated** and needs its own top-up (or a balance above 0 at some point in that store's own wallet). *Changes:* the backfill moved from 0161 to 0164 and covers primaries only (§2.3, §3.1, §3.3); F-87g tests it; new task F-87o (banner on non-primary stores, plus a one-time bell). The plan had recommended keeping every store activated.
2. **Q6 Deleting a store with a non-zero balance:** the balance, positive or negative, moves to the primary store's wallet through a pair of `postStoreWalletEntry` entries (`store_closure_out` / `store_closure_in`, reference id = the deleted store id, so the claim is unique per deleted store and a retry posts nothing), then the delete goes on. The primary store cannot be deleted while other stores exist (today no delete exists and the primary cannot even be archived; kept). *Changes:* §2.2, F-87f.
3. **Q3 Ads:** charged to, and refunded to, the promoted product's store wallet (as recommended).
4. **Q4 Reviews and questions:** copied to each copy during the split only; "Copy to store" never copies them (as recommended).
5. **Q2, Q5 and the rest:** accepted as recommended. A copy keeps the original's status, but is saved as draft when the target store's currency differs (or the seller ticks "Save as draft"); products in no store go to the primary store as draft with the old status kept in the map; the fulfillment profile stays per account.

**Open questions as first written (with the recommendations; superseded by "Decided" above)**

1. **Q1 Existing stores of activated sellers.** Should they need a new top-up per store? *Recommend:* no. At the migration, every current store of an activated seller is marked activated (`stores.activated_at`). Only stores created afterwards need their own top-up. Otherwise sellers lose visible orders on deploy day.
2. **Q2 Status of a copy.** *Recommend:* keep the original's status (the owner's rule), with two exceptions where the copy is saved as **draft**: (a) the target store's currency differs from the source's; (b) the target store is published and the seller ticks "Save as draft" (unticked by default). Orphans in the migration (products in no store today) go to the primary store as draft, with the old status kept in the map.
3. **Q3 Ad requests paid from the wallet** (`D/actions/ads.ts:201`). These were not on the owner's list of account charges. *Recommend:* charge the wallet of the store the advertised product belongs to, and refund to the same wallet.
4. **Q4 Reviews and questions on copies.** *Recommend:* copy approved reviews and answered questions to every copy at the split only, so each store page looks as it does today. "Copy to store" later does not copy reviews, which belong to the store where the buyer wrote them.
5. **Q5 Fulfillment profile** (pickup address, `seller_fulfillment_profiles` keyed by seller, `docs/fulfillment.md`). *Recommend:* keep it per account now. Make it per store later (F-87l) only if sellers ship stores from different places.
6. **Q6 Deleting a store with money.** *Recommend:* refuse deleting (soft delete) a non-primary store whose wallet is not 0, with the message "Move or spend this store's balance first". A wallet transfer between one's own stores is **not** in this plan (it would be a new money flow; ask separately if wanted). A negative balance on a deleted store would otherwise disappear.

## 7. Effort (one developer-agent with review)

| Phase | Tasks | Estimate |
|---|---|---|
| A Foundations | F-87a, F-87b | 1 day |
| B Catalog | F-87c (largest: storefront, dashboard, caches), F-87d, F-87e, F-87m (0163 + E2E) | 6–8 days |
| C Wallet | F-87f, F-87g, F-87h (0161/0164 + admin), F-87o | 4–5 days |
| D UX | F-87i, F-87j, F-87k (F-87l optional +2) | 4–5 days |
| E Cleanup | F-87n | 1 day + 2 weeks wait |
| **Total** | | **≈ 16–20 working days**, plus staging soak |

Order of work: A → B (to the dark deploy) → C (to the dark deploy) → run 0163 → run 0164 → D → E. Phases B and C touch different files and can run in parallel with two agents after A.
