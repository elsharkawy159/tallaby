# Supabase egress audit (2026-10-25)

The org is on the Free Plan (5 GB uncached egress per month, shared by staging
and production) and used 12 GB this cycle, almost all uncached. This file ranks
what drives it and the fixes, highest impact first.

## How it was measured

- `pg_stat_statements` on both projects, read-only (`begin transaction read only`
  over the pooler). Production stats were last reset **2025-09-05**, so call counts
  are cumulative over 13 months and mix in code that no longer exists (the
  marketplace category and product pages, removed in `ebdfa1bd`). Staging was
  reset 2026-10-17. pg_stat_statements counts rows, not bytes, so bytes are
  `rows × average column size as text`, measured with `octet_length(col::text)`:

  | Column | Avg as text (prod) |
  |---|---|
  | `template_versions.config` | 95 KB |
  | `templates.draft_config` | 115 KB |
  | `store_site_revisions.snapshot` | 114 KB (max 149 KB) |
  | `template_installs.previous_draft` | 113 KB |
  | `store_pages.draft_content` | 15.5 KB |
  | `library_sections.tree` | 5.7 KB |
  | `templates.meta` | 5.6 KB |
  | `product_translations.content` / `description` | 0.6 KB each |

- API, edge and storage logs (`query_logs`) were **not yet read**: the Supabase
  MCP server needs OAuth first. Bot share, top paths and storage objects are
  still open (see "Still to measure").
- A code sweep of `apps/ecommerce`, `apps/dashboard`, `apps/admin` and `packages/*`.

## Ranked findings

Estimates are for production unless noted. "Measured" means rows × size from
pg_stat_statements; "est." means from the code.

### 1. Template gallery reads every template's full config: ≈ 11 GB measured

About 102 rows per call × (95 KB config + 5.6 KB meta) ≈ **10 MB per call**.
The 111 templates exist only since `0090` (10-21) and `0095` (10-23). The
average of 102 rows per call means nearly all of these calls happened in the
last few days.

| Query | Where | Calls | Egress |
|---|---|---|---|
| tallaby.com gallery `marketing:template-catalog:v2` | `apps/ecommerce/lib/marketing/templates.server.ts:21` | 877 (+109 at an older shape) | ≈ 9.0 + 0.4 GB |
| `listStoreTemplates`, not cached | `packages/lib/src/store-sites/templates.server.ts:166` | 137 + 32 | ≈ 1.6 GB |
| the same, on staging | | 40 | ≈ 0.4 GB |

- The marketing gallery *is* cached, but it refills about 440 times a day for two reasons:
  - **Every sign-in empties the whole ecommerce Data Cache** (finding 2).
  - The `listing` TTL is 900 s.
- The configs are only parsed to get the page outline, form kinds and palette, a
  few KB per template.
- `listStoreTemplates` runs on every store-editor open (dashboard and admin), on
  each page or filter of the dashboard Templates gallery (it loads everything and
  pages in memory), and on the admin store Website tab.
- The editor also calls `getStoreTemplateConfig` (one more 95 KB config, uncached).
  The template preview reads by key are another ≈ 170 MB (1,675 calls).

**Fix (no migration):**
- Build the template *cards* once in a global `createCachedQuery`, tagged
  `templateTags.catalog()` with a long TTL. Templates are admin-authored and
  global, so there's no seller data in it.
- The store-specific parts (`ownStore`, last install) stay uncached.
- Cache `getStoreTemplateConfig` by template key the same way.
- The marketing gallery gets the long TTL too.
- Optional later step (needs a migration, so I'll ask first): a precomputed
  summary column so even a refill doesn't pull the configs.

Expected: from about 10 MB × hundreds a day down to about 10 MB × (deploys + admin publishes).

### 2. `revalidatePath("/", "layout")` on every ecommerce sign-in

- Where: `apps/ecommerce/app/api/auth/callback/route.ts:71,106,113` and
  `apps/ecommerce/app/api/auth/handoff/route.ts:39`.
- The Next 16 docs (`revalidatePath.md`, "Revalidating all data") say this
  "invalidate[s] all cached data". So every login, OAuth return, email
  verification and cross-domain handoff marks every `unstable_cache` entry stale,
  and the next visitors refill them from the database: the gallery (10 MB),
  storefront profiles, sites and products.
- This multiplies finding 1 and every storefront read.
- Fix: drop these calls. Private pages are already `force-dynamic`, and the
  navbar re-reads the user through `/api/auth/me`.
- Estimate: it is the main reason the gallery refilled that often. It's an
  uncounted share of everything else.
- The dashboard has the same calls (`settings/account.server.ts:21`,
  `stores.server.ts:44`, `store-settings.server.ts:20`, `actions/seller.ts:234`,
  `actions/locale.ts:13`), but they only purge the dashboard's own small cache.

### 3. Store-editor open reads the whole published site plus all drafts: est. 150–300 KB per open

- `getStoreSiteStatus` (`packages/lib/src/store-sites/server.ts:777`) selects
  `store_site_revisions.snapshot` (114 KB) and every `store_pages.draft_content`,
  only to compare them as strings in JavaScript.
- Measured: 614 snapshot reads ≈ 70 MB on prod, plus about 1,200 draft-list reads.
- Callers: the dashboard and admin editor pages, and the Website overview, which
  also reads the drafts through `getStoreForEditor`.
- `getStoreForEditor` (`server.ts:112`) loads `draftContent` for callers that only
  need names or the design system (`website.data.ts:27`, `website/design/page.tsx:32`,
  `setup-publish.server.ts:22`).
- Fix: a lean page-list query without `draftContent` for those callers. Do the
  "unpublished changes?" check without shipping the snapshot (compare
  `max(store_pages.updated_at)` against `last_published_at`, or a hash computed in SQL).

### 4. Order page polls `router.refresh()` every 15 s: est. tens of KB per refresh per open tab

- Where: `apps/ecommerce/app/[locale]/(shop)/(main)/orders/[orderId]/_components/order-polling.tsx:28`.
- Each refresh runs the order query with `productTranslations: true` (full content
  in both languages), then one reviews query per item, one store-review query per
  seller, and the guest `users` lookup. That's about 240 refreshes an hour per open tab.
- Fix: 60 s or more, stop once the order is final, and select only `title` and
  `slug` from translations.

### 5. Cart and product reads load full translations: est. 3–5 KB per cart item or card

- `getCartItems` (`apps/ecommerce/actions/cart.ts:137`): runs about every 60 s in
  an active cart session, not cached. It loads the whole product row plus both
  locales' content and description.
- `getProducts` (`actions/products.ts:228`): cached, but each miss is 150–250 KB,
  and search and offset create many keys.
- `getProductBySlug` (`:297`) has **unbounded reviews with votes**. A popular
  product could pass the 2 MB Data Cache item limit and then never cache.
- Fix: card columns only, translations `{locale, title, slug}`, reviews limited to about 10.

### 6. Over-broad product tags: est. multiplies storefront misses

- `getProducts` always carries the global `productTags.listing()` tag, which is
  bumped by any seller's product create, delete, price change or out-of-stock
  order (`packages/cache/src/invalidate.ts:140,157,204`).
- `getStorefrontCategories` is tagged `categoryTags.all()`.
- So one seller's change refills every storefront's listings.
- Fix: seller-scoped tags only (`productTags.seller`, `storeTags.catalog`).

### 7. Admin categories page: N+1 queries plus up to 1,000 full rows

- `getAllCategories` (`apps/admin/actions/categories.ts:52`) does 2 count queries
  per row (the 163k `parent_id` count and 24k recursive CTE stats) and reads up to
  4,400 full rows per call. That's about 1.3 MB plus about 8,800 round trips per view.
- Fix: one grouped count query, only the shown columns, about 50 rows per page.

### 8. Bulk product import loads all 10,676 categories per row

- `findBestCategoryMatch` (`apps/dashboard/actions/products.ts:114`), called for
  each imported row with no known category. About 2.5 MB per row, so about 300 MB
  for a 100-row file. This is the `categories.name is not null` statement: 2.1M
  rows ≈ 300 MB measured.
- Fix: load `{id, name}` once per import.

### 9. Images: optimizer TTL and upload cacheControl

- No app sets `images.minimumCacheTTL`. With the Next 16 default (about 4 h), the
  optimizer re-fetches each size from Supabase Storage every few hours.
- Uploads use `cacheControl: "3600"` even though every path is unique.

  | App | Upload sites |
  |---|---|
  | Dashboard | `use-seller-upload.ts`, `product-image-upload.tsx`, `image-upload.tsx`, `content-section.tsx`, `import-product-images/route.ts`, `shopify-import.server.ts`, `explore.server.ts` |
  | Ecommerce | `seller-image-upload.ts`, avatars in `actions/auth.ts`, `order-item-review-form.tsx` |
  | Admin | `image-upload-cell.tsx`, `forms/image-upload.tsx`, `blog-upload.client.ts` |

- Raw or unoptimized images:
  - the store logo `<img>` (`packages/store-sections/src/elements/render.tsx:607`)
  - review media `unoptimized` at 1,200 px (`product-tabs.tsx:977`)
- Fix: `minimumCacheTTL: 31536000`, `cacheControl: "31536000"` for new uploads
  (existing objects unchanged), and route those images through the optimizer.
- Size: unknown until the storage logs are read.

### 10. Polling and refresh loops (small each, constant)

- Notification bells (admin and dashboard) poll every 60 s and on focus, even
  with realtime connected. In admin, each poll also pays 2 Auth calls plus 2
  PostgREST calls in the proxy.
- Admin orders and pending carts `router.refresh()` every 10 minutes, even in hidden tabs.
- The store-editor draft watch runs every 30 s, even in hidden tabs.
- The ecommerce `AddressProvider` runs on every `(shop)` page with
  `staleTime: 0` and focus refetch. `QueryClient` is re-created on every render.
- Realtime isn't opened for anonymous visitors.
- Fix: poll only when realtime isn't `SUBSCRIBED`, skip hidden tabs, and use
  longer stale times.

### 11. Auth and PostgREST per request (small bytes, very many calls)

- Auth server: about 346k `getUser` lookups.
- Admin proxy: PostgREST `users.role, is_verified` lookup (43k calls).
- Dashboard: up to 4 `getUser()` calls per navigation.
- Fix later: `getClaims()` (local JWT check) for reads. This is a separate
  auth change, so I'll ask before doing it.

### 12. Smaller items

| Item | Fix |
|---|---|
| `countMediaUsage` reads every page's `draft_content::text` per media dialog | count in SQL |
| Meta catalog feed (`api/meta/catalog`) reads all products with descriptions; `force-dynamic` overrides its `revalidate` | drop `force-dynamic` or page the query |
| `getSellerProducts` (dashboard) has no limit and loads full translations and variants | paginate, lean select |
| Admin `getProductFilterOptions` / `getProductFormOptions` read the whole category and brand tables, uncached | cache them |
| Lists with no limit: admin customer orders, `exportOrders`, pending products, dashboard coupons and reviews | add limits |

Not a problem now: the 25M-row `pg_type` introspection stat is history. The
current client sets `fetch_types: false`, and no other Postgres client exists in
the apps.

## Bots and robots

- Store-host `robots.txt` (`apps/ecommerce/lib/sitemap/robots.lib.ts`) allows
  `?search=`, `?q=`, `?sort=` and `?page=`. Every combination is a new cache key,
  so crawlers can turn each URL into a database read.
- Dashboard and admin are noindexed, but the admin proxy doesn't exclude
  `robots.txt`, so crawlers get redirected to login, with a `getUser()` each time.
- Proposal, which needs owner approval before any blocking:
  - `Disallow: /*?search=`, `/*?q=` and `/*?sort=` on store hosts
  - `noindex` on filtered or paginated storefront URLs
  - exclude `robots.txt` from the admin proxy matcher
- Bot share is not measured yet (logs).

## Still to measure

- API, edge and storage logs, once the Supabase MCP is authorized: top paths,
  user agents and storage object paths.
- After the fixes ship, reset `pg_stat_statements` on both projects (with owner
  approval) and re-rank by calls for one week.

## Fix order (Phase 2)

1. Template cards: global cache plus long TTL (finding 1).
2. Drop `revalidatePath("/", "layout")` from the ecommerce auth routes (finding 2).
3. Editor site status and lean page lists (finding 3).
4. Order polling and lean order, cart and product selects (findings 4–5).
5. Seller-scoped product and category tags (finding 6).
6. Image `minimumCacheTTL` and upload `cacheControl` (finding 9).
7. Admin categories N+1, import category matcher, polling intervals (findings 7, 8, 10).
8. Owner decisions: robots changes, `getClaims()`, summary column (migration).
