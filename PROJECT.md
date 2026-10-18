# Tallaby (طلبي) — Technical Project Overview

> Last reviewed against the code: 2026-10-17.
> Labels: **[Current]** = exists in the repository; **[Planned]** = in [`PLAN.md`](PLAN.md), not built yet.
> Product view: [`PROJECT_DESCRIPTION.md`](PROJECT_DESCRIPTION.md). Working rules: [`CLAUDE.md`](CLAUDE.md).

## 1. What the system is

**[Current]** Tallaby is an Egyptian multi-vendor commerce platform with three parts:

- a marketplace at `www.tallaby.com`;
- an independent storefront for every seller at `{subdomain}.tallaby.com` or on the seller's own domain;
- a seller dashboard, an admin panel, and a shipping/rider app.

**[Planned]** Tallaby becomes a seller SaaS. Sellers sign up in under a minute, design their storefront with a visual builder and templates, connect marketing apps, and pay a per-order platform fee after a 30-day trial. The marketplace keeps working alongside this.

## 2. Monorepo

**[Current]** pnpm 10.4.1 workspaces with Turborepo. Node `>=20`.

| Path | Kind | Responsibility |
|---|---|---|
| `apps/ecommerce` | Next.js 16.3.3 | Marketplace, seller storefronts (host-routed), cart and checkout, `/sell` landing page, legacy seller signup wizard (`/onboarding`), Meta Pixel and CAPI, custom-domain cron |
| `apps/dashboard` | Next.js 16.3.3 | Seller dashboard: products, orders, shipping, financial, coupons, reviews, ad requests, settings (subdomain, custom domain), fulfillment view |
| `apps/admin` | Next.js 16.3.3 | Platform operations: sellers, products, orders, payments, wallets, fulfillment plans, affiliates, external orders, analytics (PostHog) |
| `apps/shipping` | Next.js 16.3.3 | Dispatch admin and rider app (cash-on-delivery collection, shipment status → delivery credit) |
| `apps/backend` | Hono on Vercel | Paymob and Kashier webhooks, wallet top-up webhook, transactional email (Resend) |
| `packages/db` | Drizzle 0.45.1 | `schema.ts`, `relations.ts`, Supabase clients, primitives for stock, coupons, wallets and affiliates |
| `packages/lib` | TS | Order placement, payments, shipping rates, fulfillment, storefront host/domain rules, Paymob, Kashier |
| `packages/cache` | TS | Cache-tag registry, `createCachedQuery`, cross-app invalidation |
| `packages/ui` | React | Shared shadcn/Radix components |
| `packages/emails`, `packages/tiptap` | React | Email templates, rich-text editor |

**[Planned]** `packages/store-sections`: the site-config schema, the section registry and renderer, and the "Tallaby Classic" template. Both the dashboard editor and the ecommerce storefront use it.

Commands: `pnpm lint`, `pnpm typecheck`, `pnpm test` (Vitest), `pnpm build`, and per package `pnpm --filter <name> <script>`. The repository has no E2E runner and no CI configuration.

## 3. Technology stack [Current]

| Area | Technology |
|---|---|
| Web framework | Next.js 16.3.3 App Router, React 19.2.8, Server Components, Server Actions, `proxy.ts` (replaces `middleware.ts`) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4, shadcn/ui, CSS modules for the storefront |
| Data | Supabase Postgres (eu-central-1), Drizzle ORM. Hand-written idempotent SQL migrations in `packages/db/migrations/` (latest `0048`) |
| Auth | Supabase Auth (email/password, Google OAuth). Cookies are scoped to `.${NEXT_PUBLIC_ROOT_DOMAIN}`. Auth handoff codes carry sessions to custom domains |
| i18n | next-intl, Arabic default plus English (ecommerce, dashboard, shipping) |
| State | Zustand, TanStack Query, react-hook-form with Zod |
| Payments | Paymob (intention + HMAC webhook), Kashier, cash on delivery, user wallet. The `stripe` package is installed but not active |
| Caching | Next Data Cache through `@workspace/cache`. Upstash Redis env vars are declared in `turbo.json`, but no Redis client is used in app code |
| Email | Resend through the Hono backend, with delivery tracking in `email_deliveries` |
| Hosting | Vercel (one project per app; wildcard and custom domains on ecommerce) |

## 4. Domain model [Current]

- **Users and tenancy.** Each `users` row (role enum: customer, seller, admin, support, driver, marketing) can have at most one `sellers` row, with `sellers.id = users.id`. **Today the seller row is also the tenant (one storefront per seller).** Dashboard access is decided by `sellers.status` (`apps/dashboard/lib/auth/seller-access.ts`).
- **Storefront identity.**
  - `sellers.slug` is used by the marketplace store page.
  - `sellers.subdomain` is unique, format-checked and reserved-word protected, and is filled by a trigger (`0044`).
  - `seller_subdomain_redirects` keeps old subdomains working.
  - `seller_custom_domains` tracks custom domains, verified through Vercel (`0048`).
  - `auth_handoff_codes` carries sessions to custom domains.
- **Catalog.** `products` (has `seller_id`; `status` is draft/pending/active/rejected; `price` is jsonb; physical or digital), `product_variants`, `product_translations`, `categories`, `brands`, digital-product tables.
- **Carts and orders.**
  - `carts.store_seller_id` is NULL for the marketplace cart and set for a storefront cart (`0045`).
  - `orders` has `order_source` (website / external / storefront), `status`, `payment_status` and a `discounts` jsonb.
  - `order_items` stores per-line `commission_amount`, `commission_rate`, `seller_earning` and `metadata`.
- **Money.**
  - Seller ledger: `seller_wallet`, `wallet_transactions` and `sellers.wallet_balance`. The seller is credited the net earning on delivery.
  - User wallet: `user_wallets` and an append-only ledger (`docs/wallet.md`).
  - `seller_payouts` / `seller_payout_items`.
  - `affiliates` / `affiliate_commissions`.
- **Shipping.** `shipments`, `shipment_batches`, `deliveries`, `seller_riders`, `shipping_providers`, plus governorate rate logic in `packages/lib/src/shipping`.
- **Fulfillment.** `fulfillment_plans`, `seller_fulfillment_profiles`, `seller_fulfillment_services` (requested vs active), `seller_fulfillment_agreements` (`docs/fulfillment.md`).

**[Planned]** Multi-store, decided by the owner on 2026-10-17:

- `sellers` becomes the **account**: new columns `plan` (default `free`), `plan_started_at`, `plan_expires_at`, and the fee and trial columns.
- A new **`stores`** table is the **tenant**. A seller can own up to `plan.maxStores` stores: **3 on Free**, and everyone is Free for now. Subscriptions for AI usage, store limits and advanced settings come later.
- A backfill creates one primary store per existing seller. Legacy columns (`sellers.subdomain`, `carts.store_seller_id`, seller-keyed custom domains and redirects) are kept and mirrored.
- Per-store tables, mirroring the Valorcy reference so its builder code ports: `store_design_systems`, `store_pages` (drafts), `store_site_revisions` (immutable publish snapshots), `store_forms` + `store_form_submissions`, `cms_collections` / `cms_items` / `cms_item_revisions`, `saved_blocks`, `store_integrations`, `store_products` (catalog selection).
- Global and account tables: `templates` / `template_versions` / `template_installs` (global), `media_folders` / `media_assets` (seller library, optional `store_id`), Storage bucket `store-media`, `seller_wallet_top_ups`.
- `carts.store_id` and `orders.store_id` are added.
- The seller ledger becomes the store wallet: one per account, entries tagged with `store_id`.

No organizations or memberships tables. See `PLAN.md` §11, including Supabase readiness (§11.11).

## 5. Request routing [Current]

`apps/ecommerce/proxy.ts`:

1. **`{sub}.tallaby.com`.** If the store has an active custom domain, redirect there with a 308. Otherwise rewrite to `/{locale}/storefront/{sub}/…` (home, `/cart`, `/products/{slug}`). Checkout, auth, orders, profile, payment and policy pages pass through. Every other path redirects to the marketplace.
2. **Unknown host.** Look it up as an active custom domain, then route it like a storefront. If there is no match, return 404.
3. **Marketplace host.** next-intl routing. The internal `/storefront/*` paths return 404.

Cart, checkout and coupon lookups are scoped by host through `activeCartWhere(userId, storeSellerId)` in `apps/ecommerce/lib/storefront.server.ts`.

**[Planned]**
- Storefront pages render the seller's published builder revision when one exists. Otherwise the existing default pages render unchanged.
- `robots.txt` and the sitemap become host-aware.
- The marketplace pixel is kept off storefront hosts.
- New sellers' storefronts are live from signup with the default theme and an empty-catalog state until they add products.
- Later (Phase 10, after the Fulfillment work): `tallaby.com` becomes the seller landing page and the marketplace moves to `store.tallaby.com`. `store` is already a reserved subdomain.

## 6. Website builder integration strategy [Planned]

- **Reference.** Valorcy (valorcy.com), the owner's own project: GitHub `elsharkawy159/saas`, local `D:\programming projects\saas\apps\dashboard` (read-only). It is also the reference for forms, templates/themes and the media library. A partial copy is untracked in `apps/dashboard/{app/(builder),components/*}` and is identical to the reference. It does not compile in Tallaby yet: about 120 missing local modules (present in the reference, e.g. `lib/builder`) and 12 missing npm packages, and it targets Valorcy's database schema.
- **Reused.** Editor shell, canvas, panels, drag-and-drop (`@dnd-kit/*`), Zustand + zundo undo/redo, autosave with version conflicts, and the section contract (`defineSection`, schema-first props, `migrateProps`).
- **Excluded.** AI generation, Valorcy CMS, plans and billing, multi-project browser, `customCode` HTML nodes, and non-commerce section verticals.
- **Default template.** The existing storefront (`apps/ecommerce/app/[locale]/storefront/[subdomain]/`) becomes the "Tallaby Classic" template with no visual change.
- **Storage.** Drafts are saved per page with optimistic version checks. Publishing writes an immutable full-site snapshot and moves a pointer to it in one transaction.

## 7. Authentication and tenant isolation principles

- **[Current]**
  - Server code connects as the database owner through Drizzle, which bypasses RLS, so **every query must filter by the session's seller**.
  - New server-only tables enable RLS with no policies, following the pattern of `0044` and `0048`.
  - The Supabase service-role key is used only in server code.
- **[Planned]**
  - A `requireSeller()` helper for every dashboard mutation.
  - No client-supplied seller IDs.
  - Public storefront code reads only published revisions.
  - Previews use HMAC-signed, short-lived tokens with `no-store` and `noindex`.
  - Cache keys and tags always include the seller ID.
  - Integration secrets are encrypted with AES-256-GCM in the application.
  - Integration scripts come only from fixed templates, never from seller-supplied JavaScript.
  - Isolation tests are required (`PLAN.md` §17).

## 8. Commission and trial model

- **[Current]** `placeOrderFromCart` (`packages/lib/src/orders/place-order.ts`) hard-codes a 5% commission per line (`PLATFORM_COMMISSION_RATE = 0.05`). It does not read `sellers.commission_rate` or `sellers.is_commission_exempt`. The seller wallet is credited the net amount on delivery. Admin "delivered" status changes do not credit the seller (known gap).
- **[Planned, owner-approved]**
  - The fee for **all sellers, old and new, on every order** is **max(EGP 5, 2% of the eligible subtotal)** per seller per order. Shipping is excluded. It is computed in integer piastres and snapshotted per line. Orders placed before the switch-over keep their 5% snapshots.
  - The fee is pending until delivery and then posted to the seller's **store wallet**.
  - **New sellers** get 30 days with no fee from when their store first goes live (first builder Publish or first active product, D20). The trial is set once and never restarted. Existing sellers get no trial.
  - **Store wallet:** the existing `seller_wallet` / `wallet_transactions` are upgraded into one signed ledger per seller (can be negative). It has append-only entries with unique references and a single posting primitive. Entries cover earnings (`sale`), platform fees (`fee`), Kashier top-ups (`top_up`), paid services such as product ads and themes (`service_charge`), payouts and admin adjustments. Refunds are deferred.
  - Kashier is the first provider for new payment work. See `PLAN.md` §13.

## 9. Fulfillment boundaries

- **[Current]** Fulfillment is optional by design. Sellers' requests write only `requested_*`. Admin activation is the only path to `active_*`. A missing row means the seller handles everything, with Tallaby standard delivery as the baseline.
- **[Planned]** Signup no longer collects fulfillment choices. Sellers request services from the dashboard later. Fulfillment billing stays separate from the platform fee.

## 10. Architectural constraints

1. Do not run `drizzle-kit generate`. The journal stops at `0033`. Write SQL migrations by hand, make them idempotent, and update `schema.ts` to match.
2. The marketplace, checkout, wallets, shipping and fulfillment must keep their current behaviour unless a change is explicitly approved.
3. The three Next.js apps have separate caches. Use `@workspace/cache` tags and the broadcast, never path purges across all stores.
4. Private data (carts, orders, wallets, drafts, integration secrets) is never cached.
5. Do not add to `apps/dashboard/actions/products.ts` (about 1,700 lines). Use colocated feature files instead.
6. Arabic is the default locale. Every new UI string goes in both `ar.json` and `en.json`. The Arabic brand name is **طلبي**.
7. Before writing Next.js code, read `node_modules/next/dist/docs/`, as each app's `AGENTS.md` instructs.
