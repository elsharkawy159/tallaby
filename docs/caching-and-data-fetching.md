# Caching & Data Fetching Architecture

This document covers the production caching architecture for the three
Next.js 16.3.3 apps in this monorepo (`ecommerce`, `dashboard`, `admin`),
implemented in `packages/cache` and `packages/db/src/{inventory,coupons}`.

## 1. Architecture overview

`ecommerce`, `dashboard`, and `admin` are **three independently deployed
Next.js applications**, each with its own build, its own Data Cache, and its
own hostname (`www.tallaby.com`, `seller.tallaby.com`, an admin host). They
share one Postgres database (via `@workspace/db`) but **do not share a Next
cache** — a `revalidateTag()` call in one process has no effect on the
other two.

The architecture has three layers:

```
Server Action / Server Component
        ↓
data-access function (unstable_cache-wrapped via createCachedQuery)
        ↓
Drizzle → PostgreSQL
```

```
mutation
  ↓ db.transaction (writes)
  ↓ commit
  ↓ applyInvalidation(invalidation, { from, mode })
      ↓ locally: updateTag() (action) or revalidateTag(tag, "max") (route)
      ↓ broadcastInvalidation(): POST /api/revalidate on the other two apps
```

Everything lives in `@workspace/cache` (`packages/cache/src`):

| File | Responsibility |
|---|---|
| `tags.ts` | The complete, typed tag registry. The only place tag strings are written. |
| `profiles.ts` | TTL constants — the backstop, not the primary freshness mechanism. |
| `key.ts` | `stableKey()` — deterministic, order-independent cache key serialization. |
| `cached.ts` | `createCachedQuery()` — the only sanctioned wrapper around `unstable_cache`. |
| `invalidate.ts` | Pure mutation → `{tags, paths}` functions. No Next.js or DB imports — unit-testable. |
| `apply.ts` | `applyInvalidation()` — turns a descriptor into real local + cross-app invalidation. |
| `broadcast.ts` | The HTTP fan-out to the other two apps' `/api/revalidate`. |
| `handler.ts` | `createRevalidateRouteHandler()` — the receiving end of that webhook. |

## 2. Why the Data Cache, not the Full Route Cache (ISR)

The storefront cannot use Next's Full Route Cache today because two things
force every `(main)` page dynamic:

1. `apps/ecommerce/i18n/request.ts` reads `cookies()` to resolve locale, and
   the root layout awaits `getLocale()`.
2. Before this refactor, `Header`/`AuthLink` called `supabase.auth.getUser()`
   directly inside the shared `(main)` layout.

(2) is fixed — every auth check on the server now goes through
`apps/ecommerce/lib/auth/current-user.ts:getAuthUser` (React `cache()`),
so a page performs **one** Supabase auth round-trip per request instead of
6+. (1) remains: locale is cookie-driven by design, so the shell will not
statically prerender without a larger `/[locale]/` URL migration — a
decision explicitly deferred (see the plan's ISR-depth decision).

The win taken instead: **every catalog query is served from the Next Data
Cache** (`unstable_cache`, via `createCachedQuery`). On a warm cache entry,
a product listing or detail page performs **zero** Postgres queries — only
the per-user islands (cart count, wishlist state, notifications) hit the
database, and those are Suspense-isolated so they don't block the cached
content.

## 3. Dynamic / private data — never cached

The following are **never** wrapped in `createCachedQuery` / `unstable_cache`,
and there are no tag builders for them in `tags.ts`. This is the
enforcement mechanism: if you find yourself wanting a tag for one of these,
the data should not be cached in the first place.

- Session/auth state, cart, wishlist contents, addresses, orders, order
  history, notifications, payment methods, seller financials/payouts,
  admin dashboards.
- Anything read inside a Server Action that also mutates in the same call.

`createCachedQuery`'s underlying `unstable_cache` already throws if
`cookies()`/`headers()` are read inside its callback — that's Next's own
guardrail against a session leaking into a shared cache entry. Do not work
around it.

## 4. Cache-tag hierarchy

All tags are namespaced `domain:dimension[:value]` and built only via
`packages/cache/src/tags.ts`:

```
product:all                      product:id:<id>
product:slug:<locale>:<slug>     product:inventory:<id>
product:listing                  product:category:<categoryId>
product:brand:<brandId>          product:seller:<sellerId>
product:featured                 product:best-selling
product:deals                    product:new-arrivals
product:filter-options

category:all   category:id:<id>   category:slug:<slug>   category:tree
brand:all      brand:id:<id>      brand:slug:<slug>      brand:popular  brand:featured
seller:id:<id> seller:slug:<slug> seller:storefront:<id>
review:product:<productId>       review:seller:<sellerId>
coupon:available                 coupon:seller:<sellerId>
search:suggestions                search:trending
```

There is **no tag for orders, carts, wishlists, addresses, profiles,
notifications, or payouts** — see §3.

## 5. Cache keys

`stableKey()` (`packages/cache/src/key.ts`) replaces the old
`` `products-${JSON.stringify(filters)}` `` pattern, which had two bugs: two
calls with the same filters in different property order missed each
other's cache entry, and `undefined` vs. absent keys serialized
inconsistently. `stableKey()` recursively sorts object keys and drops
`undefined` before serializing. Every parameter that affects a query's
result — pagination, search, sort, filters, category, brand, seller,
availability, locale — must flow through the cached function's arguments,
which `createCachedQuery` folds into the key automatically.

## 6. Mutation → invalidation matrix

The rules live as code in `packages/cache/src/invalidate.ts` and are
covered by `packages/cache/src/invalidate.test.ts`.

| Mutation | Tags emitted |
|---|---|
| Product create | `detail`, `slug`(new), `seller`, `category`, `brand`, `listing`, `filterOptions`, `all`, `newArrivals`(+ any true flags) |
| Product delete | Same as create, computed from the **captured-before-delete** snapshot |
| Activate / deactivate (`isActive` flip) | `detail`, `listing`, `filterOptions`, `all` |
| Verify / publish (`status` transition) | Same as activate — any visibility change (`status !== status` or `isActive !== isActive`) triggers the structural set |
| Price change | `detail`, `listing`, both old/new `category`, both old/new `brand` — **not** `filterOptions`/`all` |
| Category A → B | `category(A)` **and** `category(B)`, plus the structural set |
| Brand change | `brand(old)` **and** `brand(new)` |
| Slug change | `slug(old)` **and** `slug(new)` — and note `slug(current)` is emitted on **every** mutation, not just renames, which is what lets `getProductBySlug`'s cache (tagged only by slug, since the id isn't known until the lookup runs) get purged by any change |
| Featured / best-selling / deal toggle | Only the specific collection tag (`featured`/`bestSelling`/`deals`) — never the general `listing` tag |
| Inventory decrement/restore | `inventory(id)`, `detail(id)` always; `listing`/`category`/`brand` **only** when the atomic decrement's `RETURNING` value shows the in-stock boundary was actually crossed |
| Category/Brand/Seller admin mutations | Their own `*Tags.all()`/`detail()`/`slug()` |

**Rule enforced by the inventory case**: changing product stock must never
invalidate customer profiles or unrelated seller settings — it doesn't,
because there is no tag for them, and it doesn't even bump the general
product listing cache unless the change actually flips availability.

## 7. Cross-application invalidation

Mechanism: a server-to-server HTTP webhook with a shared secret — the same
shape `apps/dashboard/lib/revalidate-ecommerce.ts` +
`apps/ecommerce/app/api/revalidate/route.ts` already had, generalized to
all three apps and hardened:

- **POST only** — the previous route also accepted `GET`, putting the
  secret in a URL (browser history, server logs, proxies).
- **Header-only secret** (`x-revalidate-secret`) — the previous route also
  accepted `?secret=` as a query param.
- **Constant-time comparison** (`packages/cache/src/handler.ts`) via a
  SHA-256 digest + `crypto.timingSafeEqual`, avoiding both a timing leak
  and `timingSafeEqual`'s length-mismatch throw.
- **JSON body** `{ tags, paths, from, ts }` instead of a comma-joined query
  string.

Each app's `app/api/revalidate/route.ts` is one line:

```ts
export const { POST } = createRevalidateRouteHandler();
```

`applyInvalidation()` calls `revalidateTag`/`updateTag` locally, then
`broadcastInvalidation()` fans the same tags out via `Promise.allSettled`
with a 3s timeout and one retry per peer. **It never throws into the
mutation** — a dropped broadcast is bounded by the query's TTL
(`packages/cache/src/profiles.ts`), not by the broadcast succeeding.
Failures are logged (`console.error`), never silently swallowed.

**Required env vars**, one set per app:

```
ECOMMERCE_URL=https://www.tallaby.com
DASHBOARD_URL=https://seller.tallaby.com
ADMIN_URL=https://admin.tallaby.com
REVALIDATE_SECRET=<shared secret, same value in all three apps>
```

`ECOMMERCE_DOMAIN` is still read as a fallback for the ecommerce peer URL
(the variable the existing deployment already has set). Each app's proxy
excludes `/api/revalidate` from its auth matcher — the route authenticates
itself via the secret, not a user session.

## 8. Inventory & order transaction strategy

`apps/ecommerce/lib/orders/place-order.ts` (invoked by
`actions/order.ts:createOrder`) and `packages/db/src/inventory/stock.ts`:

- **No read-then-write, anywhere.** `decrementStock`/`restoreStock` are a
  single `UPDATE ... WHERE quantity >= $n RETURNING`. The `WHERE` clause
  *is* the concurrency guard — Postgres serializes concurrent updates to
  the same row, so two simultaneous orders for the last unit cannot both
  succeed. The loser gets `InsufficientStockError`, thrown inside the
  transaction, rolling back everything.
- **Coupon claims are atomic** (`packages/db/src/coupons/claim.ts`):
  `UPDATE coupons SET usage_count = usage_count + 1 WHERE usage_count <
  usage_limit RETURNING id`, replacing a read-`usageCount`-then-write race
  that could let concurrent checkouts jointly exceed `usageLimit`.
- **Deadlock avoidance**: multi-line orders sort their stock lines by
  `(kind, id)` before applying, so two orders touching the same two
  products always acquire row locks in the same order.
- **A non-negative `CHECK` constraint** on `products.quantity` and
  `product_variants.stock` (migration `0007`) is the last line of defense
  behind the atomic guard — nothing should ever reach it, but if it does,
  the write fails loudly instead of corrupting inventory.
- The whole `createOrder` sequence (decrement → coupon claim → insert order
  → insert order items → insert coupon usage → clear cart) is one
  `db.transaction`. `cancelOrder` mirrors this, restocking via
  `restoreStock`, and is made idempotent by transitioning the order with
  `WHERE status IN (cancellable) RETURNING` — a concurrent double-cancel
  finds zero rows the second time and never double-restocks.

## 9. Adding a new cached query

```ts
import { cacheProfiles, createCachedQuery, productTags } from "@workspace/cache";

export const getSomething = createCachedQuery({
  name: "ecommerce:something:by-id",       // stable key prefix, unique per query shape
  ttl: cacheProfiles.detail,                // pick the closest existing profile
  tags: (id: string) => [productTags.detail(id)],
  query: async (id: string) => {
    // plain Drizzle read — no cookies()/headers(), Next throws if you do
  },
});
```

Rules:
- Never call `unstable_cache` directly — always through `createCachedQuery`.
- Every tag must come from `packages/cache/src/tags.ts`. Add a new builder
  there if you need one; never hand-write a tag string.
- If the query can't be tagged precisely (e.g. the entity id isn't known
  until after a lookup, like `getProductBySlug`), check whether
  `invalidateProduct`'s "always" tags already cover your case before
  reaching for a broader tag.

## 10. Adding a new mutation

```ts
"use server";
import { applyInvalidation, invalidateProduct } from "@workspace/cache";

export async function updateThing(id: string, data: Patch) {
  await requireAuth(); // or requireAdmin() in admin
  const before = await toSnapshot(id);   // BEFORE any write — required for deletes
  await db.transaction(async (tx) => {
    // all writes for this mutation
  });
  const after = await toSnapshot(id);    // null for a delete
  await applyInvalidation(invalidateProduct(before, after), {
    from: "ecommerce" /* or "dashboard" / "admin" */,
    mode: "action",    // "route" only inside a Route Handler
  });
}
```

Rules:
- **For a delete, capture the snapshot before the delete statement runs.**
  There is nothing left to read afterward, and the invalidation needs
  `categoryId`/`brandId`/`slugs` to purge the right caches.
- Wrap multi-statement mutations in `db.transaction` — a mutation that
  writes to more than one table without a transaction is exactly the bug
  class this refactor fixed in `createOrder`/`updateProduct`.
- `mode: "action"` inside a Server Action (uses `updateTag` — the mutating
  user sees their own change immediately). `mode: "route"` inside a Route
  Handler (uses `revalidateTag(tag, "max")` — `updateTag` can only be
  called from a Server Action).
- Never call `revalidateTag`/`updateTag`/`revalidatePath` directly outside
  `packages/cache` — always through `applyInvalidation`, so the cross-app
  broadcast isn't accidentally skipped.

## 11. Rules that prevent regressions

1. **Never read `cookies()`/`headers()` inside a `createCachedQuery`
   callback.** Next enforces this at runtime for `unstable_cache`; don't
   try to route around it.
2. **No tag exists for user-scoped data.** If a query needs one, that's a
   sign it shouldn't be cached — not a sign to add the tag.
3. **Always capture a `before` snapshot ahead of a delete.** Deleted rows
   can't be re-read for invalidation afterward.
4. **`revalidateTag` in Next 16 requires a second argument.** Use `"max"`
   (route context) via `applyInvalidation` — don't call the single-argument
   form; it's a TypeScript error against this Next version.
5. **Don't invalidate more than the mutation actually affects.** A stock
   change is not a reason to bump `product:listing` unless the in-stock
   boundary was crossed (see §6); a flag toggle bumps only its own
   collection tag.
6. **Cross-app changes go through `applyInvalidation`, never a manual
   `fetch()` to a peer's URL.** The retry/timeout/secret handling lives in
   one place (`packages/cache/src/broadcast.ts`) — don't reimplement it.
7. **`unstable_cache` entries persist across deploys and instances** on a
   host with a durable incremental cache (e.g. Vercel). Self-hosting with
   multiple instances and no shared cache handler means each instance
   builds its own cache independently — configure a
   [custom cache handler](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers)
   if that's the deployment target.

## Known gaps not addressed by this refactor

- `apps/ecommerce/actions/{search,recommendations,coupons,seller}.ts` still
  use `unstable_cache` directly with their original ad-hoc tag strings
  (`"trending-products"`, `"available-coupons"`, etc.) rather than the
  registry in `tags.ts`. They are not reachable by the cross-app broadcast
  and should be migrated following §9/§10 the next time they're touched.
- Per-user reads (`getWishlistItems()`) still run inline inside
  `ProductsList`/`ProductsGrid`'s render path rather than as a separate
  Suspense-isolated client island. The cached catalog data itself is
  correct and fast; the wishlist heart icons still cost a request.
- `AuthLink`/`NotificationButton` are not wrapped in `<Suspense>` (only
  `WishlistCount` already was).
- Returns/refunds: `initiateReturn` records the request and is now
  transaction-wrapped, but stock is intentionally **not** restored at
  request time (the item hasn't physically come back yet). There is no
  existing "return received/approved" transition in either app to hang a
  restock on — adding one is a new feature, out of this refactor's scope.
- The product-detail query (`getProductBySlug`) still issues a separate
  `getProductIdBySlug` lookup rather than a single joined query, and still
  fetches the full reviews/Q&A payload inline rather than a separate
  paginated, `review:product:<id>`-tagged query.
