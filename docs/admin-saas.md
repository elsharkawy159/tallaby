# Admin SaaS alignment (Phase 9B)

> **Status:** Built 2026-10-18 (P9B-01…14). Migration `0069` is written but not applied. Where the code differs from this design, see the 2026-10-18 Phase 9B entry in `PLAN.md` §23.
> **Goal:** make `apps/admin` show and manage everything a seller can create in `apps/dashboard` (stores, websites, templates, domains, integrations, coupons, fulfillment, ads, wallets). Hide the pages that only made sense for the marketplace-only era. Keep admin fast with streaming, single-query counts and tagged invalidation across apps.
> **Rules:** `CLAUDE.md` applies in full. Most relevant: rule 5 (tenant isolation, with admin reads still scoped by explicit IDs), 7 (money only through approved primitives), 8 (caching), 10 (no secrets in UI), 16 (others' uncommitted work: `apps/admin/app/(dashboard)/sellers/[id]/*`, `store-top-ups/*` and `wallets/*` had uncommitted changes when this plan was written).

---

## 1. What exists today [Verified 2026-10-18]

### 1.1 Admin app

- **Sidebar:** a flat list of 18 links in `apps/admin/app/(dashboard)/_components/layout/sidebar.tsx` (`sidebarLinks` array). Badge counts come from one SQL round-trip in `sidebar.server.ts` (`getSidebarCounts`). It has no groups and no tests.
- **Pages:** Dashboard, Analytics, Customers, Pending carts, Orders, External orders, Products, Pricing calculator, Categories, Brands, Sellers, Integration errors, Fulfillment (+ Plans), Wallets, Store top-ups, Affiliates, Coupons, plus Settings, Shipping and Payments (routes exist; Settings, Shipping and Payments are not in the sidebar).
- **Rendering:** every page is `force-dynamic` with Suspense skeletons. Admin uses **no** `createCachedQuery`. Admin mutations already call `applyInvalidation` (brands, categories, coupons, products, external orders, sellers, seller overrides). `app/api/revalidate/route.ts` receives broadcasts from the other two apps.
- **Seller detail** (`sellers/[id]/page.tsx`) loads everything at once in one `Promise.all`: detail, account and plan, stores, store wallet, integrations, fulfillment and audit. This is one long page with no tabs.
- **Coupons** (`actions/coupons.ts`) lists only **platform** coupons (`seller_id IS NULL`, excluding affiliate coupons). Seller coupons are invisible to admin.
- **Fulfillment** (`fulfillment/page.tsx`, `getFulfillmentRequests`) lists **one row per service** (`seller_fulfillment_services`), so a seller who asks for 5 services appears 5 times. Per-seller review lives inside the seller page (`seller-fulfillment.client.tsx`, 738 lines).
- **Integration errors** is a separate page showing `store_integrations` in `error` (`listIntegrationErrors`, P9-03).
- **Admin audit:** `admin_audit_log` (0063) has `seller_id NOT NULL`, so it cannot record platform-wide actions (for example, a template change).
- **Library:** `packages/lib/src/admin/*` (`guard.server.ts` → `assertAdminActor`, `writeAdminAudit`; `overrides.server.ts` → `applySellerOverride`, `applyAdminStoreAction`, `adjustStoreWalletByAdmin`; `seller-view.server.ts`, `wallet-view.server.ts`, `top-ups.server.ts`).

### 1.2 What sellers can create in the dashboard that admin cannot see

| Dashboard area | Tables | Admin today |
|---|---|---|
| Stores (`/stores`) | `stores`, `store_products` | Only inside one seller's page. No list across all sellers. |
| Website: pages, publish, revisions | `store_pages`, `store_site_revisions`, `store_design_systems` | Site status only. |
| Templates | `templates`, `template_versions`, `template_installs` (seeded by `0052`, `0062`) | None. |
| Domain & SEO, sitemap | `seller_custom_domains`, `stores.seo*` | None. |
| Social, blog, CMS | `stores`, `cms_collections`, `cms_items` | None. |
| Forms & submissions | `store_forms`, `store_form_submissions` | None. |
| Media library | `media_assets`, `media_folders` | None. |
| Apps / integrations | `store_integrations` (registry: `packages/lib/src/integrations/registry.ts` — Meta Pixel, GA, GTM, Meta CAPI, TikTok/Snapchat (soon), Google Sheets, Shopify import) | Per-seller list and an error list. |
| Payment methods, shipping zones | `stores` payment config, `store_shipping_zones` | None. |
| Catalog lists (0068, not applied) | `seller_product_categories`, `seller_product_brands` | None. |
| Coupons | `coupons` with `seller_id` | Hidden (platform coupons only). |
| Campaigns (`/marketing`) | `ad_campaign_requests` | **No admin screen.** Status changes happen outside the apps, and wallet-paid rejections must call `refundRejectedWalletAdRequest` (P6-11 gap). |
| Settings audit | `store_settings_audit` | None. |

---

## 2. Target admin information architecture

### 2.1 Sidebar: config-driven, grouped, tested

Use the same approach as the seller dashboard (`apps/dashboard/components/dashboard/sidebar.config.ts`):

- Add a new `apps/admin/app/(dashboard)/_components/layout/sidebar.config.ts` with typed `sections` → `links` (`key`, `href`, `icon`, `countKey?`, `exact?`, `hidden?`). `sidebar.tsx` and `mobile-nav.tsx` only render it.
- Add pure helpers `isActiveHref` / `activeHref` (longest match wins) and a `sidebar.config.test.ts`: unique hrefs, every `countKey` exists in `SidebarCounts`, and no hidden link is rendered.
- Collapsed mode keeps section dividers (a thin rule), not headings.
- Section headings use English labels, the same as the rest of admin (admin has no i18n today).

**Proposed order.** Sellers sit directly above Customers, which the owner asked for. Work queues keep their badges inside their own group.

| # | Section | Links (badge) |
|---|---|---|
| 1 | **Overview** | Dashboard (action centre), Analytics |
| 2 | **People** | Sellers (pending sellers), Customers (new today), Affiliates |
| 3 | **Stores & websites** | Stores, Templates, Domains (failing domains), Integrations (errors) |
| 4 | **Commerce** | Orders (pending), Products (pending), Categories, Brands, Coupons, Pending carts (unreminded) |
| 5 | **Services** | Fulfillment (sellers with open requests), Ad campaigns (pending), Shipping |
| 6 | **Finance** | Store wallets, Store top-ups (pending), Payments |
| 7 | **System** | Audit log, Settings |
| — | *Hidden (commented out)* | External orders, Pricing calculator |

Why this order: overview → who → what they built → what they sell → services Tallaby provides → money → system. It reads in the same order as the seller dashboard (operations → grow & configure → account), so admins can move between the two apps without relearning the layout.

Badge counts stay in one SQL round-trip (`getSidebarCounts`), with 4 new subqueries: `fulfillment_open_sellers`, `pending_ad_requests`, `integration_errors`, `failing_domains`.

### 2.2 Hiding marketplace-only pages ("comment them for now")

- **Pricing calculator** and **External orders**: comment out their sidebar entries. Replace each `page.tsx` body with `notFound()` and keep the original code in a block comment marked `// Hidden 2026-10-18 (SaaS pivot), see docs/admin-saas.md §2.2`.
- Keep `actions/external-orders.ts` and `external-orders/external-orders.types.ts`. `orders/[id]/invoice/page.tsx` imports `PlacedExternalOrderResult` from there, so removing the folder would break the invoice page.
- **Not hidden:** Products, Categories, Brands, Orders and Pending carts. The marketplace (`www.tallaby.com`) still runs (CLAUDE.md rule 3).

---

## 3. Feature specs

### 3.1 Fulfillment: one row per seller (owner request)

**List `/fulfillment`.** One row per seller that has a `seller_fulfillment_profiles` row or at least one `seller_fulfillment_services` row. One SQL query: `GROUP BY seller_id` with `jsonb_agg` of `(service_type, status, requested_provider, active_provider, requested_at)`.

| Column | Source |
|---|---|
| Seller (name, store link, phone) | `sellers`, first store |
| Model + review status | `seller_fulfillment_profiles.model`, `review_status` |
| Services | 5 fixed chips in a stable order (Storage, Packaging, Delivery, Customer service, Returns). Each chip is coloured by status. Grey means not requested. |
| Open | count of `requested`, `under_review` and `awaiting_agreement` |
| Oldest open | min `requested_at` among open services (age, e.g. "3 d") |
| Updated | max `updated_at` |

- **Filters** (URL params, existing `data-table/search-params` helpers): `state=open|active|all` (default `open`), `service=` (sellers with that service in an open state), `review=`, `q=` (seller name, email or phone).
- **Sort:** oldest open first. Paginated on the server.
- The row opens the detail page. A `?service=` filter carries over so the detail page opens on that service.

**Detail `/fulfillment/[sellerId]`.**

- **Header:** seller, contact, model, pickup address, operational details, terms version and date, and profile review status with notes (`updateReview`).
- **Service tabs:** Storage · Packaging · Delivery · Customer service · Returns. Each tab shows requested vs active (provider, plan, config), status actions (`activateService`, `updateServiceStatus`) and the agreement editor (`saveAgreement`). A tab badge shows the service status. Services that were not requested show "Not requested".
- **Queue navigation:** "Previous / Next seller" in the current filter order, so an admin can work through the queue.
- **Reuse, do not rewrite:** move `sellers/[id]/seller-fulfillment.client.tsx` into `fulfillment/[sellerId]/` and split it per service (`fulfillment-service-tab.client.tsx`, `fulfillment-profile.client.tsx`, `fulfillment-agreement.client.tsx`). The seller page then shows a summary card that links to it.
- Server functions stay in `fulfillment.server.ts`. Add only `getFulfillmentSellerQueue(filters)` and `getFulfillmentSellerNeighbours(sellerId, filters)`. Activation stays admin-only and unchanged (`docs/fulfillment.md`).
- **Not cached:** this is an operational queue.

### 3.2 Coupons: every coupon (owner request)

**Tabs on `/coupons`:** **Platform** (today's CRUD, unchanged) · **Sellers** · **Affiliates** (read-only, links to `/affiliate/[id]`).

- **Seller coupons columns:** code, name, seller (link to seller), discount, minimum spend, usage `count/limit`, total discount given (`SUM(coupon_usage.discount_amount)`, aggregated in the same query through a lateral join), state (active, scheduled, expired, inactive), dates.
- **Filters:** `q` (code or seller), `seller=`, `state=`, `type=`. Stats chips per tab.
- **Scope:** coupons have no `store_id`; they are seller-wide [Verified]. The UI says "all stores of this seller". A per-store coupon is a dashboard feature, not part of this plan.
- **Admin powers on seller coupons** (default, see D-A1): **deactivate / reactivate only**, with a required reason. Logged to `admin_audit_log` (`action: 'coupon.deactivate'`). No editing of discount values.
- **Invalidation:** `couponTags.seller(sellerId)` + `couponTags.available()`, broadcast from `admin`.
- **Code layout:** split `actions/coupons.ts` into `coupons/coupons.server.ts` (platform CRUD, moved as-is) and `coupons/seller-coupons.server.ts` (list + toggle). `getAdminCoupons` takes `scope: 'platform' | 'seller' | 'affiliate'`. `isPlatformCoupon` stays the guard for platform writes, so seller coupons can never be edited through the platform form.

### 3.3 Stores directory and store detail (Website)

**`/stores`** lists every store across all sellers: name, seller, host (subdomain), primary custom domain + status, site status (draft, published, suspended), template, first publish, last publish, catalog mode, product count, plan. Filters: status, published, has custom domain, template, plan, `q`. One query with lateral counts.

**`/stores/[storeId]`** has tabs. Each tab is its own async Server Component inside its own `Suspense`, and only the active tab (`?tab=`) is fetched:

| Tab | Content | Admin actions |
|---|---|---|
| Overview | Host, domains, status, plan, seller, created, wallet balance, open storefront (new tab) | Suspend / force-unpublish with reason (existing `applyAdminStoreAction`) |
| Website | Pages (title, slug, published), revisions list (view only), installed template + version, design system tokens (read-only), SEO + sitemap crawl status, social links | Restore a revision: **deferred** (D-A4) |
| Catalog | Mode (D24), selected products count, seller categories and brands (0068, after it is applied) | — |
| Payments & shipping | Enabled methods (Kashier connected yes/no, never keys), shipping zones and rates | — |
| Integrations | Per provider: status, external account ID / public pixel ID, scopes, last sync, last error | Force-disconnect, clear error (§3.5) |
| Forms | Forms, submission counts, last submission | Submission contents hidden by default (D-A2) |
| Blog & CMS | Collections, items, published state | Unpublish an item with a reason (abuse) |
| Media | Asset count, total bytes, largest files | — |
| Audit | `store_settings_audit` + `admin_audit_log` for this store | — |

Every query takes an explicit `storeId` and joins `stores.seller_id`. No admin query trusts a seller ID from the client (rule 5).

### 3.4 Seller detail: tabs, loaded one at a time

Change `sellers/[id]/page.tsx` from a single `Promise.all` into tabs: **Overview** (detail + account + plan/trial/fee overrides) · **Stores** (links to `/stores/[id]`) · **Integrations** (all stores) · **Coupons** · **Wallet** · **Fulfillment** (summary + link) · **Ads** · **Audit**. Each tab loads only when it is opened, in the same way as §3.3. This keeps the seller page fast as more data is added. The existing panels (`seller-account`, `seller-stores`, `seller-wallet`, `seller-admin.chunks`) move into tabs unchanged.

### 3.5 Integrations hub

**`/integrations`** has tabs:

- **Overview:** one card per registry provider. Shows availability (from code), counts of connected, error and disconnected, and the last error time. One `GROUP BY provider, status` query.
- **Connections:** every `store_integrations` row. Filters: provider, status, seller, store. Shows public fields only: pixel/GA/GTM IDs, external account ID, scopes, last sync, last error. **Never** `credentials_encrypted` or secret config keys. A whitelist of display fields comes from the registry (`idField`).
- **Errors:** today's `/integration-errors` page moves here. The old route redirects (`redirect('/integrations?tab=errors')`).

**Admin actions:**

- **Force-disconnect:** sets `credentials_encrypted = NULL` and `status = 'disconnected'`, writes `last_error = 'disconnected by admin: <reason>'`, logs to audit and invalidates `storeTags.integrations(sellerId, storeId)` so the tracking script disappears from the storefront.
- **Clear error:** sets `status` back to `connected` if credentials exist, so the next sync retries.
- Both go through a new `packages/lib/src/integrations/admin.server.ts`, which reuses the existing store-integrations server functions (no duplicated SQL).
- **Deferred (D-A3):** a platform-wide provider kill switch. It needs a `platform_settings` table and would override `registry.availability` at runtime.

### 3.6 Templates

**`/templates`** lists `templates` with name (ar/en), category, thumbnail, default, premium, price, active, sort, current version, install count (`template_installs`) and stores currently on it.

- **Actions:** toggle active, set premium + price (`numeric(10,2)`, validated in piastres), change sort, set default (respects the `templates_one_default` partial unique index: clear the old default and set the new one in one transaction), view versions, preview (opens the dashboard template preview route).
- **Not in scope (D-A5):** editing template `SiteConfig` JSON in admin. Templates keep being authored as migrations / seed (`0052`, `0062`). A later task can add "upload a version JSON → validate with the `SiteConfig` schema → create `template_versions` row".
- Deactivating a template never changes installed stores; it only hides the template from the gallery.
- **Cache:** add `templateTags.catalog()` to `packages/cache/src/tags.ts`. If the dashboard gallery is cached (check `listStoreTemplates` in the task; it is not cached today), admin writes broadcast this tag.

### 3.7 Domains

**`/domains`** lists `seller_custom_domains`: domain, seller, store, status, last error, last checked, verified at. Filters: status, `q`. Badge = failing domains (`status <> 'active'` and `last_checked_at` older than 1 h, defined in the task).

- **Actions:** re-check (reuse `packages/lib/src/storefront/custom-domains.server.ts` and `vercel-domains.ts`, the same path the dashboard uses) and remove with a reason (audit, `sellerTags.customDomain(domain)` invalidation).

### 3.8 Ad campaigns (closes the P6-11 gap)

**`/ad-requests`** lists `ad_campaign_requests`: seller, product, package, amount, payment method (Vodafone Cash / wallet), status, dates. Status flow is `pending → approved → active → completed` or `→ rejected`.

- **Rejecting a wallet-paid request must call `refundRejectedWalletAdRequest(requestId, actorId)`.** This is already built and approved in P6-11, so it is not new money logic.
- Every status change is logged to audit.

### 3.9 Dashboard home: action centre and SaaS KPIs

- **Action centre** at the top of `/`: cards for each queue with a count and a link (pending sellers, pending top-ups, sellers with open fulfillment requests, pending ad requests, integration errors, failing domains, pending products). Uses the same one-query counts as the sidebar (shared `getAdminQueueCounts`, deduplicated per request with React `cache()`).
- **SaaS KPIs:** stores created (7 / 30 d), published sites, active sellers, sellers in trial vs past trial, fee revenue (EGP 5 × delivered orders, read from wallet entries of type `fee`), negative-balance wallets and their total. These are wallet-derived, so they are **not** Data-Cached (rule 8). They are one aggregate query behind `Suspense`.

### 3.10 Sellers and customers lists

- **Sellers list:** add stores count, plan, trial state (in trial / ended / exempt), wallet balance (red if negative), last order date.
- **Customers list:** no change.

### 3.11 Audit log page

**`/audit`** shows every `admin_audit_log` row. Filters: actor, seller, store, action, date. Read-only.

---

## 4. Performance, caching and revalidation architecture

### 4.1 Rendering

- Admin pages stay dynamic (auth on every request). Speed comes from:
  - **Streaming:** the page shell renders at once. Each panel or tab is an async Server Component in its own `Suspense` with a skeleton.
  - **Load only the active tab** (§3.3, §3.4): `?tab=` decides which loader runs.
  - **One round-trip per list:** rows + total + stats in one SQL statement where practical (the `getSidebarCounts` pattern). Lateral subqueries for counts, instead of N+1 queries.
  - **Server-side pagination and filters** through the existing `_components/data-table/search-params` helpers. URLs are shareable and the back button works.
  - **Per-request dedupe:** React `cache()` around the admin guard and the queue counts, so the layout, sidebar and home share one call.
  - **Parallel, not waterfalls:** independent loaders in one `Promise.all` inside a tab.

### 4.2 What may be Data-Cached in admin (`createCachedQuery`)

Only slow-changing reference data, with tags and a TTL as a backstop:

| Data | Tag | TTL profile |
|---|---|---|
| Template catalog + install counts | `templateTags.catalog()` | long (invalidated on write) |
| Fulfillment plans | `fulfillmentTags.plans()` (new) | long |
| Integration provider summary (counts only) | `adminTags.integrationSummary()` (new) | short (60 s) |

**Never cached** (rule 8 and §3 of `docs/caching-and-data-fetching.md`): orders, carts, wallets, top-ups, fee revenue, fulfillment queues, coupons usage, audit, form submissions, integration credentials. Every new tag goes in `packages/cache/src/tags.ts` and nowhere else. Store-scoped tags keep the seller ID (rule 8).

### 4.3 Revalidation from admin writes

Every admin mutation follows the existing pattern:

1. `assertAdminActor`
2. Transaction: write + `writeAdminAudit`
3. Commit
4. `applyInvalidation(descriptor, { from: 'admin' })`

Step 4 updates admin locally and broadcasts to `ecommerce` and `dashboard`. Pure descriptor functions go in `packages/cache/src/invalidate.ts`, with unit tests:

| Admin action | Tags |
|---|---|
| Suspend / unpublish store | `storeTags.site(s, st)`, `sellerTags.subdomain(sub)`, `sellerTags.customDomain(d)` for each domain |
| Coupon deactivate / reactivate | `couponTags.seller(s)`, `couponTags.available()` |
| Integration force-disconnect | `storeTags.integrations(s, st)` |
| Domain remove | `sellerTags.customDomain(d)` |
| Blog / CMS unpublish | `storeTags.cms(s, st)` |
| Template change | `templateTags.catalog()` |
| Fulfillment plan change | `fulfillmentTags.plans()` |

Dashboard and ecommerce writes already broadcast to admin through `/api/revalidate`, so admin's few cached items stay fresh without extra work.

### 4.4 Database

`0069_admin_saas.sql` (hand-written, idempotent; applied to staging only after owner approval):

- `admin_audit_log`: `ALTER COLUMN seller_id DROP NOT NULL`, and add `target_type text`, `target_id text` (nullable) for platform-wide actions such as templates. This is non-destructive.
- Indexes for the new admin lists, each one checked with `EXPLAIN` on staging first: `store_integrations (status, provider)`, `ad_campaign_requests (status, created_at desc)`, `seller_custom_domains (status)`, `seller_fulfillment_services (seller_id, status)`, `coupons (seller_id, is_active)`. Use `create index if not exists`.
- Mirror the changes in `schema.ts` and `relations.ts`. **No `drizzle-kit generate`.**

---

## 5. Tasks

Each task is one reviewable change. After each task run `pnpm --filter admin typecheck`, `pnpm --filter admin test`, `pnpm --filter @workspace/lib test`, `pnpm --filter @workspace/cache test`, and record a manual check in `PLAN.md` §23.

| ID | Pri | Deps | Task |
|---|---|---|---|
| **P9B-01** | P0 | — | **Hide marketplace-only pages** (§2.2): comment out sidebar entries; `page.tsx` → `notFound()` with the original code kept in comments; keep the external-orders types. |
| **P9B-02** | P0 | 01 | **Grouped sidebar config** (§2.1): `sidebar.config.ts` + tests; Sellers above Customers; sections; `mobile-nav` uses the same config; links to pages that do not exist yet stay `hidden: true` until their task ships. |
| **P9B-03** | P0 | — | **Admin infra:** `0069_admin_saas.sql` (§4.4, owner approval before staging), new tags (`templateTags`, `fulfillmentTags`, `adminTags`), invalidation descriptors + tests, `getAdminQueueCounts` shared by the sidebar and home. |
| **P9B-04** | P0 | 02 | **Fulfillment per seller** (§3.1): seller queue list, `/fulfillment/[sellerId]` with service tabs, split and move of `seller-fulfillment.client.tsx`, previous/next navigation, seller-page summary card. |
| **P9B-05** | P0 | 03 | **All coupons** (§3.2): tabs, seller coupon list with usage totals, deactivate/reactivate with audit + broadcast. |
| **P9B-06** | P1 | 03 | **Stores directory + store detail** (§3.3): list, tabs (Overview, Website, Catalog, Payments & shipping, Forms, Blog & CMS, Media, Audit). Integrations tab ships in P9B-08. |
| **P9B-07** | P1 | 06 | **Seller detail tabs** (§3.4) + sellers list columns (§3.10). |
| **P9B-08** | P1 | 03, 06 | **Integrations hub** (§3.5): overview, connections, errors (redirect old route), force-disconnect, clear error. |
| **P9B-09** | P1 | 03 | **Ad campaigns** (§3.8): list and status flow; wallet refund on rejection through `refundRejectedWalletAdRequest`. |
| **P9B-10** | P1 | 03 | **Domains** (§3.7): list, re-check, remove. |
| **P9B-11** | P2 | 03 | **Templates** (§3.6): list, metadata actions, default switch, versions view. |
| **P9B-12** | P2 | 03, 04, 08, 09, 10 | **Action centre + SaaS KPIs** on the home page (§3.9). |
| **P9B-13** | P2 | 03 | **Audit log page** (§3.11). |
| **P9B-14** | P0 | all | **Security pass** for the new admin surface: every query scoped by explicit IDs, no secrets rendered (grep the admin bundle for `credentials`), every write audited, every write broadcasts. Feeds P9-04. |

**Tests per task:** unit tests for pure `.lib.ts` code (filters, chip ordering, state derivation, invalidation descriptors) and DB integration tests (`TEST_DATABASE_URL`) for:

- the per-seller fulfillment aggregate (seller with 5 services → 1 row, correct open count and oldest date)
- seller coupon toggle (audit row written, platform form cannot touch seller coupons)
- integration force-disconnect (credentials nulled)
- ad rejection refund (exactly once)

---

## 6. Decisions (defaults used in this plan, owner can change them)

| ID | Question | Default in this plan |
|---|---|---|
| D-A1 | Can admin edit seller coupons? | No. Deactivate / reactivate with a reason only. |
| D-A2 | Can admin read form submission contents (customer PII)? | No by default: counts only. A "view" button with a logged reason could be added later. |
| D-A3 | Platform-wide integration kill switch? | Deferred (needs a `platform_settings` table). |
| D-A4 | Can admin restore a store revision? | Deferred: view only. |
| D-A5 | Template authoring in admin? | Metadata only. Content stays in migrations or seed until a validated JSON upload task exists. |
| D-A6 | Sidebar order | §2.1 (People: Sellers → Customers → Affiliates). |
