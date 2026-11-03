# Dashboard performance audit (ROADMAP.md F-43c, F-43d)

Date: 2026-11-03. Scope: `apps/dashboard` data loading, and the shared loaders it calls.

## How far to trust this

**Nothing here was timed.** No browser or dev server was used, and staging is too small to show load problems (`order_items` about 15 rows, `products` 97, largest seller 51 products). F-43d asks for before-and-after timings; those are still owed (see P8).

- **Measured** means read on staging with read-only queries: payload sizes, index lists, plan shapes. Plan shapes show which index is used and that a sort is needed. They do not show cost at scale.
- **Counted** means counted from the code: queries or auth calls per page.
- **Reasoned** means an estimate for a seller with thousands of rows. Treat those numbers as orders of magnitude.

## Fixed in this audit

All are behaviour-preserving. Tenant checks are unchanged. Only reads changed: no write, ledger or checkout code.

| Fix | Effect | Evidence |
|---|---|---|
| One Supabase Auth call per render: new `lib/auth/session.server.ts` (React `cache()`), used by `actions/auth.getUser`, `requireSeller`, the home loaders, the signup pixel, the builder layout and the roadmap | Auth calls during a render, not counting the proxy: `/financial` 9 to 2, `/reviews` 6 to 2, `/coupons` and home 4 to 2 (each 1 once `layout.tsx` is switched, see P1) | Counted. Each call is a network trip to Supabase Auth; the time saved is not measured |
| `getSellerAccess` and `requireSeller` share one read of the `sellers` row | 1 query fewer on every page | Counted |
| `/financial`: `getDashboardAnalytics` ran 5 queries, only the sales figures were read. Removed top products, repeat customers (a join and group over all of the seller's order items), review ranking and daily trend | Page queries 13 to 8, and the costliest aggregate is gone | Counted; effect reasoned |
| `/financial`: `getSellerPayouts` loaded every payout item with its order and order item for 10 payouts, none of it shown. Now 6 columns. Also dropped an unread count, narrowed wallet transactions, ran payout stats in parallel | Payout-item load gone | Counted |
| `/reviews`: dropped `reviewVotes` (never read), full reply rows (only "has a reply" is read), all review columns not shown, and two unread counts | 2 queries fewer, and no votes loaded for up to 200 reviews | Counted |
| Product edit: `getProduct` loaded every question with its answers (no limit), 10 reviews and the brand; none reach the form | Removes an unbounded relation on a page opened often | Counted |
| Category tree: 6 columns instead of all, on the prop sent to the product form | 165 KB to 106 KB of JSON (541 categories), about 36% | **Measured** on staging, column data only |
| Category tree: a database failure was cached as `{ success: false }` for 24 hours, so sellers saw no categories until the entry expired or admin purged it. Now it throws inside the cache and the failure is returned uncached. New key `dashboard:categories:tree:v2` | Correctness | Read from code |
| Coupon picker: only one title and one photo leave the database, not every translation and the whole image array | Database-to-server payload down; the client prop is unchanged and still lists the whole catalog (see P3) | Reasoned |
| Orders list, print and shipping: named address and shipment columns instead of every column | Small: about 558 bytes per address on staging, some of it now skipped. Also stops loading personal fields nothing shows | Measured size; small effect |

## Fixed after the audit (2026-11-03)

- **P1 layout:** `getSessionUser()` and `Promise.all`, done. Streaming the sidebar badges is still open.
- **P2 customers (F-43e):** the page groups in SQL with server paging (`listStoreCustomersPage`), no 5,000-order cut-off, and the drawer filters by key in SQL. `customers.integration.test.ts` holds SQL equal to `aggregateStoreCustomers` and `selectStoreCustomers`, Arabic-digit phones included. Audiences and campaigns still use `listStoreCustomers` (5,000 cap).
- **P3 pickers (F-43f):** the coupon picker loads 40 products as the seller types. The ad picker reads one title and one photo per product but still lists the whole catalog, so it is lighter, not capped.
- **P4 orders (F-43g):** `/orders` filters, sorts, counts and pages on the server (`orders-list.query.ts`), with risks only for the visible page. `orders-list.integration.test.ts` holds the SQL stage, counts and search equal to the rows over every order, payment and shipment status mix. Select all, export, print, Bosta and Wassalha work across pages.
- **P5 indexes:** `0140_list_indexes.sql`, staging only. On production run each statement with `CONCURRENTLY`. The `EXPLAIN ANALYZE` on seeded data (P8) is still owed.

Nothing above was timed or checked in a browser.

**New finding:** in a one-table `db.select({...})`, drizzle strips the table name from a field's top-level columns, so `(SELECT ... WHERE t.product_id = ${products.id})` becomes `t.product_id = "id"`, reads the inner table's id and returns NULL. The coupon picker title had this bug (fixed by nesting the SQL). `stores/[storeId]/settings/catalog.data.ts` and `(builder)/.../editor/server/editor.data.ts` have the same shape and were not changed, so check their titles.

## Not fixed, ranked by likely impact

### P1. Lead to apply: `app/(main)/layout.tsx` (another agent's file)

Runs on every full load and every `revalidatePath("/", "layout")`. It has no Suspense around the sidebar, so all of this blocks the first byte.

- Line 29 still calls `supabase.auth.getUser()` directly. Use `getSessionUser()` from `@/lib/auth/session.server` (one line, saves one network trip on every page).
- Wallet balance, heard-about-us, welcome gift and store link are awaited one after another. They are independent, so they can run in `Promise.all` (four sequential reads become about one).

Other per-request work in the layout: `SidebarData` runs 7 counts plus the store list. Each is indexed by seller, but counting `order_items` reads all of that seller's index entries. Worth a follow-up: stream the sidebar badges so counts do not block the page. Reasoned: small under a thousand rows, noticeable at 100k.

### P2. Customers page: up to 5,000 orders per load, and a silent cut-off

`listStoreCustomers` (`packages/lib/src/customers/customers.server.ts`) reads the newest 5,000 orders with three joins and a per-row `EXISTS`, aggregates in JS, and sends every customer to a client component. Opening one customer's drawer (`getStoreCustomer`) reads the same 5,000 rows again to filter one key. Above 5,000 orders, older customers and totals are wrong with no warning.

**Proposed task F-43e:** aggregate in SQL with server pagination like `/products`, and filter the drawer by key in SQL. Note `customerKey` normalises phones in JS, so it needs a stored normalised phone (see P5) or a superset prefilter plus the JS check; test Arabic-digit phones. Estimated effect (reasoned): 5,000 rows per load to about 30, and a drawer query about 100 times smaller.

### P3. Whole-catalog pickers sent to the browser

- `/coupons` (`getSellerCouponsPage`): every product. Reasoned: about 220 bytes each, so about 1 MB of props at 5,000 products.
- `/marketing` ad picker (`listSellerProductOptions` in `products-list.query.ts`, another agent's file): every product with all translations and the whole image array, no limit. It should get the same narrowing as coupons; the client wants only a title and one image.

**Proposed task F-43f:** a search-as-you-type picker action (20 results), loading already-chosen products by id. This changes the UI flow, so it was not done here. Other pickers are already capped: store catalog 1,000, editor 300, link builder 200, low stock 300.

### P4. Orders list: 200 rows, all relations, filtered in the browser

Noted as asked, not rewritten. `LIST_LIMIT = 200` with client filtering means search and filters **silently miss older orders** for a seller over 200 orders. Each load also sends a large row per order, including a rendered WhatsApp message for new ones. Reasoned: about 2 KB a row, so 300 to 500 KB of props.

`loadStoreOrderRisks` also runs on each load and filters on `right(regexp_replace(...))` over phones. **Measured plan shape:** the expression is a filter after joining every order of the store, so no index can help. Cost grows with the store's total orders, not with the 200 shown.

**Proposed task F-43g:** server pagination for `/orders` (same pattern as F-43a) and risks only for the visible page, ideally through P5.

### P5. Indexes to propose (no migration run)

Staging has too few rows for plans to justify these by cost. The shape is what was measured: `order_items_seller_id_idx` is scanned and then **sorted**, so every order of the seller is read to return 6.

```sql
-- Home recent orders, sales chart, top products, financial, reports.
CREATE INDEX CONCURRENTLY IF NOT EXISTS order_items_seller_created_idx
  ON order_items (seller_id, created_at DESC);
-- Customers, campaigns and reports by store. orders has no created_at index at all.
CREATE INDEX CONCURRENTLY IF NOT EXISTS orders_store_created_idx
  ON orders (store_id, created_at DESC) WHERE store_id IS NOT NULL;
-- Wallet and financial statement lists (today: seller index, then sort).
CREATE INDEX CONCURRENTLY IF NOT EXISTS wallet_transactions_seller_created_idx
  ON wallet_transactions (seller_id, created_at DESC);
```

Estimated effect (reasoned): at 50,000 order items, home recent orders reads about 6 rows instead of 50,000. These replace nothing, and add a small write cost at checkout, which the owner should weigh. Before adopting them, run `EXPLAIN ANALYZE` on seeded data (P8).

A later step for P2 and P4: a stored normalised phone on `user_addresses` with an index. It needs a backfill, so it is its own task.

### P6. Smaller items

- `getPendingEarnings`: `NOT IN (SELECT order_item_id FROM seller_payout_items)` hashes that whole table across **all sellers** on each `/financial` load (**measured plan shape**). `order_item_id` is NOT NULL, so `NOT EXISTS` is equivalent. Add an index on `order_item_id` if payouts stay in use. Left alone because it feeds an earnings figure, and rule 4 asks to check first.
- `getProductInventory` (`inventory.data.ts`, another agent's file): three sequential reads could be a `Promise.all`.
- `listLowStock`: the `owned` CTE computes a title subquery for **every** product before the low-stock filter and limit. Reasoned: 5,000 subqueries per inventory load. Filter first, then fetch titles.
- `getSellerProfile`: selects every `sellers` column for 5 fields on product add and edit. Low.
- `getSellerAdRequests`: all columns and no limit, but sellers have few rows. Low.
- `/reviews` and questions load 100 of each with no paging, so older ones cannot be reached.
- No `next/dynamic` anywhere in the app: `recharts` loads eagerly for the home chart, `reports` and store `analytics`. Worth checking with a bundle analyser in a browser session.

### P7. Dead server actions

These exports have no caller. They are still public endpoints because they sit in `"use server"` files, and several run heavy queries: `getRevenueAnalytics`, `getPayoutDetails`, `getOrderStats`, `getSellerOrders`, `getOrderDetails`, `getReviewStats`, `getUnrepliedReviews`, `getProductReviews`, `getSellerMetrics`, `getAllBrands`. All are scoped to the session seller where they read seller data. Suggest deleting them.

### P8. Timings still owed (F-43d)

**Proposed task F-43h:** seed a local or throwaway database (5,000 products, 50,000 order items, 20,000 customers), run `EXPLAIN ANALYZE` on the queries above before and after P5, and time `/`, `/orders`, `/orders/customers`, `/coupons`, `/financial` in a browser. Do not seed staging without the owner's approval. Record the results in ROADMAP.md §7.

## Caching review (F-43c, rule 8)

Every `createCachedQuery` in the app was read:

| Query | Key has seller? | Verdict |
|---|---|---|
| `store-report`, `store-campaigns` | Yes, plus store | Order **aggregates** only (counts and sums), 5 minutes. No rows. Rule 8 says never cache orders; the code documents this as sums only (F-15a). **Owner may want to confirm this reading.** |
| `home-traffic`, `product-views`, `store-views` | Yes | GA4 numbers, 5 minutes, errors not cached. Fine |
| `categories:tree`, `brands:all` | Shared data | Fine. `brands:all` still caches a failure for 24 hours (same bug as categories), but it has no caller (P7) |
| `templates`, `pexels` | Not seller data | Fine |

Nothing caches carts, wallets, orders as rows, drafts or secrets. Wallet reads and seller lists are fresh on each request. React `cache()` is per request, so it shares nothing between sellers.

Gaps:

- `docs/caching-and-data-fetching.md` §10 says never to call `revalidatePath` directly, yet the dashboard has 94 calls. They are local paths and work, so the doc should say so rather than the code change.
- Seven actions call `revalidatePath("/", "layout")`, which re-runs the whole layout. Most are rare (settings, locale). `stores.server.ts` is worth narrowing.
- The doc still names `seller.tallaby.com` (the site is `dashboard.tallaby.com`) and `apps/ecommerce/lib/orders/place-order.ts` (now in `packages/lib`).
- `proxy.ts` calls `auth.getUser()` on every matched request, including prefetches, on top of the render. `getClaims()` verifies the token locally if the project uses asymmetric JWT keys. That is an auth change, so it was not touched: **proposed task F-43i**, with a security review.

## Noticed, not performance

- `/reviews`: `mapReviewRows` reads `product.title`, `product.slug` and `user.avatar`, which the query never returns (it has `productTranslations` and `avatarUrl`). So the product name never shows; the row falls back to the order number, and avatars never show.
- `getSellerQuestions` joins only the English title, so an Arabic-only product shows no title.
- Sidebar "Orders" counts order items, not orders.
- Home `low_stock` tests `quantity < 10`. Check it against the unlimited-stock work (0138), which is another agent's area.
