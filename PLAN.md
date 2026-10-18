# Tallaby Seller SaaS — Implementation Plan

> **Status:** Implementation started 2026-10-17 on branch `feat/seller-saas`. Phase 0 is done except P0-01's remaining audit, P0-04 (d)–(e) and P0-06. Phase 1 is done except P1-06's upload test; migrations `0049`–`0057` are applied to the **staging** project (`cxqjrwjianxskhzmrkla`) and, except `0049`, **not yet to production** (see §22/§23). **Owner decisions applied 2026-10-17** (see §21.3): **a seller can own several stores (Free plan = max 3; `sellers.plan` default `free`, subscriptions later); Supabase is prepared early for all builder, CMS, forms, templates and media tables (§11);** the fee applies to all sellers; there is a store wallet that can go negative; the trial is for new sellers; the default theme is live from signup; refunds and the domain move are deferred; Kashier is the first payment provider.
> **Audit date:** 2026-10-17 (repository at commit `62fd3ed` plus uncommitted work, see §2.9).
> **Authority:** This is the main roadmap for turning Tallaby into a multi-tenant seller store platform. It replaces the milestone plans in `.planning/` (Digital Products / Stripe), which are out of date. See §21.4.
> **Companion docs:** [`CLAUDE.md`](CLAUDE.md) (durable rules), [`PROJECT.md`](PROJECT.md) (technical architecture), [`PROJECT_DESCRIPTION.md`](PROJECT_DESCRIPTION.md) (product), [`docs/wallet.md`](docs/wallet.md), [`docs/fulfillment.md`](docs/fulfillment.md), [`docs/caching-and-data-fetching.md`](docs/caching-and-data-fetching.md).

**Labels used throughout:**

| Label | Meaning |
|---|---|
| **[Verified]** | Seen in the repository during the audit, with a file path. |
| **[Proposed]** | Recommended design. It does not exist yet. |
| **[Assumption]** | Believed true but not proven from the repository. It must be checked before anyone relies on it. |
| **[Decision]** | Open question for the product owner. See §21.3. |

---

## 0. Rules for the implementation session (read first)

A new Claude Code session that runs this plan **must**:

1. Read `CLAUDE.md`, `PROJECT.md`, `PROJECT_DESCRIPTION.md` and this `PLAN.md` before changing anything.
2. Re-read the source files a task names before editing them. Do not assume the repository is unchanged since 2026-10-17. Run `git status` and `git log -5` first.
3. Follow task dependencies (§19). Do not start a task until its dependencies are marked done.
4. Work in small steps. Do not rewrite large parts of the codebase. Each task should be one reviewable change.
5. Keep the existing marketplace (`www.tallaby.com`), checkout, wallets, ledger, shipping and fulfillment working. Every phase has regression checks.
6. Reuse the reference builder where it fits (§5). The reference is Valorcy (valorcy.com), the owner's own project: GitHub `elsharkawy159/saas`, local checkout **`D:\programming projects\saas\apps\dashboard`** (confirmed 2026-10-17). **Never modify the reference project.** Read it only: builder, forms, templates/themes, media library, public-site rendering.
7. Run the verification commands (§18.1) after every task. Do not move to the next phase while the current one has failing checks.
8. Update this file as work happens: tick tasks in §22, add a dated note under the task when the code differs from what the plan expected, and move resolved decisions out of §21.3.
9. **Stop and ask the user** before anything that would change the agreed business model (§13), need a destructive migration (dropping or renaming columns or tables, rewriting money columns), or put financial data integrity at risk.
10. Never treat a **[Proposed]** item as already built. Check the code first.
11. Write database changes as hand-written, idempotent SQL in `packages/db/migrations/NNNN_name.sql`, and mirror them in `packages/db/src/drizzle/schema.ts` and `relations.ts`. **Do not run `drizzle-kit generate`.** Its journal stops at `0033` (`packages/db/migrations/meta/_journal.json`), while migrations `0034`–`0048` were written and applied by hand, so a generate would produce a wrong diff. Do not apply migrations to the production database without the user's approval.
12. Next.js in this repo is **16.3.3**, and `proxy.ts` replaces `middleware.ts`. Each app's `AGENTS.md` says to read `node_modules/next/dist/docs/` before writing Next.js code. Follow that.

---

## 1. Executive summary

Tallaby is a pnpm/Turborepo monorepo for an Egyptian multi-vendor marketplace: Next.js storefront, seller dashboard, admin app, shipping/rider app, and a Hono backend for webhooks and email. Supabase provides Postgres and Auth, and Drizzle is the ORM.

**The most important finding is that much of the multi-tenant foundation already exists.**

- Every seller already has a storefront at `{subdomain}.tallaby.com`. Migration `0044` added unique, format-checked, reserved-word-protected subdomains with redirect history. Migration `0048` added verified custom domains with a Vercel integration, a re-check cron and a cross-domain auth handoff.
- The ecommerce `proxy.ts` already routes requests by host. Storefront carts are separated from the marketplace cart by `carts.store_seller_id` (migration `0045`), and storefront orders are tagged `order_source = 'storefront'`.
- Today one `sellers` row per user (`sellers.id = users.id`) acts as the tenant: one storefront per seller. **Owner decision (2026-10-17): a seller can own several stores** (Free plan: up to 3). The plan adds a `stores` table as the tenant, backfilled 1:1 from existing sellers so nothing changes for them.
- Fulfillment is already modelled as optional (migration `0040`, `docs/fulfillment.md`). A missing row falls back to "the seller handles it".
- The existing storefront design in `apps/ecommerce/app/[locale]/storefront/[subdomain]/` is the **existing default template** that must be kept.

**What is missing:**

1. **Minimal signup.** Today's signup is a 5-step wizard (`apps/ecommerce/components/onboarding/`) that asks for legal address, fulfillment model and operational details.
2. **A website builder.** Builder code from the Valorcy reference project was copied into `apps/dashboard` (untracked). It is **incomplete and cannot compile**: about 120 missing local modules (`lib/builder`, `lib/ai`, Valorcy actions), 12 npm packages the dashboard does not have, and a different database schema (`projects`, `websites`, `website_pages`, `design_systems`).
3. **Draft/publish storage for storefront designs.** No tables exist for this yet.
4. **The new fee model.** Today `packages/lib/src/orders/place-order.lib.ts` hard-codes a 5% commission (`PLATFORM_COMMISSION_RATE = 0.05`) and ignores the per-seller `commission_rate` and `is_commission_exempt` columns. There is no trial. **Decided:** 2% with an EGP 5 minimum for **all** sellers and orders, plus a 30-day trial for new sellers.
5. **A store wallet.** The seller ledger (`seller_wallet` / `wallet_transactions`) has no idempotency index, no top-ups, no balance-before/after audit columns, and only one writer. **Decided:** each seller has a store wallet that can be negative or positive. It updates automatically (earnings, fees, ad and theme purchases, top-ups) and the seller can top it up at any time.
6. **Per-seller integrations.** Meta Pixel and CAPI exist, but only for the marketplace, and they also load on seller storefronts.
7. **Sidebar groups** for Website Design and Apps.

**Recommended approach:** split the **account** (`sellers`: plan, wallet, fee trial, legal data) from the **tenant** (`stores`: subdomain, domain, branding, pages, theme, integrations, forms, CMS). Backfill one primary store per existing seller. Get Supabase ready early with all builder tables, mirroring the Valorcy reference (`store_pages`, `store_design_systems`, `templates`, `cms_*`, `store_forms`, `media_*`, `saved_blocks`), plus `store_site_revisions` for atomic publish. Add `sellers.plan` (default `free`) with code-defined limits (Free = 3 stores; AI and advanced settings later). Put the curated, renderable section library in a shared package so the dashboard can edit pages and the ecommerce app can render them. Wrap the existing storefront components as the default "Tallaby Classic" template. It is live for every store from creation with the store info, shows an empty-catalog state until products exist, and is unchanged for stores that never use the builder.

Add the 2% / EGP 5 minimum fee as a pure, tested function used by `placeOrderFromCart` for **every** order. Turn the existing seller ledger into the **store wallet**, one per seller account and shared by all of that seller's stores: signed balance, append-only entries tagged with `store_id`, idempotent posting, Kashier top-ups. Start the 30-day trial for new sellers atomically on their first "go live" event (§13.5).

---

## 2. Verified current-state architecture

### 2.1 Monorepo [Verified]

| Item | Value | Source |
|---|---|---|
| Package manager | pnpm 10.4.1, workspaces `apps/*`, `packages/*` | `package.json`, `pnpm-workspace.yaml` |
| Orchestrator | Turborepo (`turbo build/dev/lint/typecheck/test`) | `turbo.json` |
| Node | `>=20` | `package.json` |
| Next.js | 16.3.3 (ecommerce, dashboard, admin, shipping) | `apps/*/package.json` |
| React | 19.2.8 | `apps/*/package.json` |
| TypeScript | root devDependency `7.0.2` (apps use `tsc --noEmit`) | `package.json` |
| ORM | drizzle-orm 0.45.1 (pinned by pnpm override) | `pnpm-workspace.yaml` |
| i18n | next-intl, `ar` default + `en` (ecommerce, dashboard, shipping); admin has no i18n | `apps/dashboard/i18n/config.ts` |
| Tests | Vitest 3.2.4 in `apps/dashboard`, `apps/ecommerce`, `packages/{db,lib,cache,emails}`. No Playwright, no CI config in the repo. | `package.json` scripts, `git ls-files '*.test.ts'` |
| Deploy | Vercel (`vercel.json` per app; ecommerce cron `/api/cron/custom-domains`) | `apps/ecommerce/vercel.json` |

Apps:

| App | Port | Role |
|---|---|---|
| `apps/ecommerce` | 3000 | Marketplace (`www.tallaby.com`), seller storefronts (`{sub}.tallaby.com` and custom domains), checkout, seller signup wizard (`/onboarding`), seller landing page (`/sell`) |
| `apps/admin` | 3001 | Platform admin: sellers, orders, payments, wallets, fulfillment plans, affiliates, analytics |
| `apps/dashboard` | 3002 | Seller dashboard (products, orders, shipping, financial, coupons, reviews, marketing ads, settings, fulfillment) |
| `apps/shipping` | 3003 | Dispatch admin and rider app |
| `apps/backend` | — | Hono on Vercel: `/emails/*`, `/paymob/*`, `/kashier/*`, `/webhooks/resend` (`apps/backend/src/api/hono-app.ts`) |

Packages: `@workspace/db` (schema, Drizzle client, Supabase clients, wallet/inventory/coupon/affiliate primitives), `@workspace/lib` (orders, payments, shipping, fulfillment, storefront helpers, Paymob, Kashier), `@workspace/cache` (tag registry, cross-app invalidation), `@workspace/ui` (shadcn), `@workspace/emails`, `@workspace/tiptap`, plus eslint/typescript configs.

### 2.2 Conventions [Verified]

- Data access goes through `"use server"` actions and server-only modules calling Drizzle (`import { db, sellers, eq } from "@workspace/db"`). Server code connects as the database owner, so it **bypasses RLS and must do its own authorization** (`docs/wallet.md` §9).
- Feature files are split by role: `*.server.ts`, `*.data.tsx`, `*.client.tsx`, `*.skeleton.tsx`, `*.types.ts`, `*.dto.ts`, `*.lib.ts` (admin and dashboard settings, for example `apps/dashboard/app/(main)/settings/`).
- Results are returned as `{ success, data?, error? }`. Error codes are translated through i18n keys.
- Caching uses `createCachedQuery` and tags from `packages/cache/src/tags.ts`. Private data (orders, carts, wallets, seller financials) is never cached. Each app has its own Next cache, and invalidation is broadcast to the others through `/api/revalidate` (`docs/caching-and-data-fetching.md`).
- Money is stored as `numeric(10,2)` and read back as strings. The user wallet code does its arithmetic in integer cents (`packages/db/src/wallet/user-wallet.ts`).

### 2.3 Auth and tenancy [Verified]

- Supabase Auth runs in every app. Session cookies are set on `.${NEXT_PUBLIC_ROOT_DOMAIN}` (`apps/dashboard/supabase/middleware.ts`), so one session works across Tallaby subdomains.
- The dashboard `proxy.ts` sends any unauthenticated request outside `/login` to `/login`. There is no signup route in the dashboard.
- Dashboard access is decided by the `sellers` row, not by the user's role (`apps/dashboard/lib/auth/seller-access.ts`). `approved` and `restricted` are allowed, `pending` and `suspended` are blocked. The "no seller" screen links to `${STOREFRONT_URL}/onboarding` (`apps/dashboard/components/layout/seller-access-blocked.tsx`).
- The tenant is `sellers.id` (primary key and foreign key to `users.id`). There is exactly one store per user and no team or member model.
- `users` rows for authenticated users: no `insert(users)` exists for normal signup in app code. Migration `0025` refers to a `handle_new_user()` trigger, but that trigger is **not in the repo's migrations**. **[Assumption]** It exists in the live Supabase project. Task P0-04 checks this.
- The admin app checks roles in its proxy (`apps/admin/supabase/middleware.ts`, roles admin/super_admin/moderator plus `is_verified`). `.planning/codebase/CONCERNS.md` reports weak admin self-registration (`apps/admin/actions/auth.ts` `adminCode`). The code still has an `adminCode` branch, so this needs re-checking (P9-04).

### 2.4 Current seller signup [Verified]

- Route: `apps/ecommerce/app/[locale]/onboarding/page.tsx` → `components/onboarding/onboarding-form.client.tsx`.
- Steps (`WIZARD_STEPS`): **business** (name, type, description, logo, banner, support email, required Egyptian mobile), **legal address**, **fulfillment model and services**, **operational details**, **review and terms**. A draft is kept in localStorage (`use-onboarding-draft.ts`).
- Server: `become-seller.server.ts` `submitSellerApplication`. It validates, checks for an existing seller, makes the slug unique in a loop, and then in one transaction inserts `sellers` (`status: "approved"`, `onboardingComplete: true`), promotes the user's role from customer to `seller`, and calls `createSellerFulfillmentSetup`. Afterwards it sets `user_metadata.is_seller`.
- `sellers` NOT NULL columns without defaults: `business_name`, `display_name`, `slug`, `business_type`, `legal_address` (jsonb), `support_email`. `subdomain` is filled by trigger `sellers_assign_subdomain` from `slug` (migration `0044`).
- Sellers are **auto-approved**. A storefront is shown only for `status = 'approved'` (`getStorefrontBySubdomain`).

### 2.5 Storefronts and routing [Verified]

- `apps/ecommerce/proxy.ts`:
  - `{sub}.tallaby.com`: redirects (308) to the seller's custom domain if one is active, otherwise `routeStorefrontRequest`.
  - Any non-platform host is looked up as a custom domain (in-memory memo, `lib/custom-domain-lookup.ts`). Unknown hosts get 404.
  - The marketplace host returns 404 for the internal `/storefront/*` paths, then runs next-intl routing.
- `apps/ecommerce/lib/storefront-routing.ts` rewrites `/` → `/{locale}/storefront/{sub}`, `/cart`, and `/products/{slug}`. Checkout, auth, orders, profile, payment and the policy pages pass through. Everything else redirects to the marketplace.
- Rules in `packages/lib/src/storefront/index.ts` (edge-safe): `validateSubdomain`, `RESERVED_SUBDOMAINS` (includes `store`, `dashboard`, `seller`, `admin`, `www`…), `storeUrl`, `isPlatformHost`, custom-domain normalisation. These mirror the SQL CHECK in `0044` and `0048`.
- Server resolvers in `apps/ecommerce/lib/storefront.server.ts`: `getStorefrontBySubdomain` (cached, tags `sellers` + `sellerTags.subdomain`), `getRenamedStoreSubdomain`, `getCartStoreSellerId`, `activeCartWhere(userId, storeSellerId)`, `getStorefrontCategories`.
- **Existing default template** (must be kept): `apps/ecommerce/app/[locale]/storefront/[subdomain]/`. It has `layout.tsx` (per-store metadata, canonical, hreflang, OG, favicon from logo), `page.tsx` (hero, category circles, catalog with search/sort/pagination), `products/[slug]/page.tsx`, `cart/page.tsx`, `_components/` (header, hero, footer, catalog, category circles and carousel, cart sheet, mobile cart bar, share, language switch, "by Tallaby" badge, font), and `storefront.module.css` (674 lines). About 1,700 lines in total.
- Seller-facing settings already in the dashboard: subdomain change (`actions/seller.ts` `checkStoreSubdomain` / `updateStoreSubdomain`, `settings/store-link.client.tsx`) and custom domain add/verify/remove (`actions/custom-domain.ts`, `settings/custom-domain.client.tsx`).

**Gaps found:**

- `apps/ecommerce/app/robots.ts` and `app/sitemap.xml/route.ts` do not check the host. Storefront hosts serve the marketplace robots and sitemap.
- `MetaPixel` (marketplace pixel, `NEXT_PUBLIC_META_PIXEL_ID`) is mounted in `app/[locale]/layout.tsx`, which also wraps `storefront/[subdomain]`. Tallaby's pixel therefore fires on seller storefronts.

### 2.6 Orders, payments, commission, wallets [Verified]

- One shared order pipeline: `packages/lib/src/orders/place-order.ts` `placeOrderFromCart`. It uses atomic stock decrement and coupon claim, wallet payment and partial wallet payment, affiliate commission snapshots, shipping by governorate, and seller free-delivery discounts. Storefront orders use the same pipeline with `orderSource: 'storefront'`, and storefront carts hold only one seller's products.
- **Commission today:** each line gets `commissionAmount = lineSubtotal × 0.05` (`PLATFORM_COMMISSION_RATE` in `place-order.lib.ts`), and seller-funded coupon lines are recomputed on the net amount. **`sellers.commission_rate` (default 5, migration `0047`) and `sellers.is_commission_exempt` are not read by order placement.** Only the admin UI and the dashboard price preview use them (`apps/dashboard/lib/utils/product-pricing.lib.ts`).
- `order_items` stores `commission_amount`, `commission_rate`, `seller_earning`, `metadata jsonb`, and refund fields. `orders` stores `subtotal`, `shipping_cost`, `discount_amount`, `discounts jsonb`, `order_source`, `payment_status` and `metadata`.
- Order statuses (enum `order_status`): `pending, payment_processing, confirmed, shipping_soon, shipped, out_for_delivery, delivered, cancelled, refund_requested, refunded, returned`.
- Payments: Paymob (intention + HMAC webhook, status-guarded claims) and Kashier webhooks in `apps/backend/src/routes/{paymob,kashier}.ts`. Cash on delivery is supported (not allowed when shipping is above 90 EGP). The `stripe` package is installed in `@workspace/lib` but is not the active provider.
- **Seller ledger (older system):** `seller_wallet`, `wallet_transactions` (enum `transaction_type`: sale, refund, withdrawal, fee), and `sellers.wallet_balance`. `creditSellerOnDelivery` (`packages/db/src/wallet/credit-seller-on-delivery.ts`) credits `sum(seller_earning)` of delivered, non-refunded items on delivery. It is idempotent only through a read-then-check (no unique index), and it is called from `apps/shipping/lib/apply-shipment-status.ts` and `apps/dashboard/lib/shipping/apply-seller-shipment.ts`. **The admin "set status = delivered" path (`apps/admin/actions/orders.ts`) does not call it.** No seller wallet reversal exists for refunds.
- **User wallet (newer system):** `user_wallets`, `user_wallet_transactions` (append-only, unique idempotency claim), top-ups, payouts (`docs/wallet.md`). Sellers are paid through `seller_payouts`, not user-wallet payouts. Merging the two wallet systems is listed as deferred work in `docs/wallet.md` §12.
- Payouts: `seller_payouts` / `seller_payout_items`. The dashboard financial page is `apps/dashboard/app/(main)/financial/page.tsx` with `actions/payouts.ts`.

### 2.7 Fulfillment [Verified]

`fulfillment_plans`, `seller_fulfillment_profiles`, `seller_fulfillment_services` (`requested_*` vs `active_*`), `seller_fulfillment_agreements`. Logic is in `packages/lib/src/fulfillment/`. **Invariant:** read behaviour through `resolveEffectiveFulfillment`. A missing or paused row falls back to the baseline (the seller stores, packs and handles customers; Tallaby standard delivery). Admin UI is at `apps/admin/app/(dashboard)/fulfillment/`, seller view at `apps/dashboard/app/(main)/settings/fulfillment/`. Deferred items are listed in `docs/fulfillment.md` §5.

### 2.8 Integrations and analytics [Verified]

- Meta Pixel (marketplace-wide, client) in `apps/ecommerce/components/meta/meta-pixel.tsx`. Meta CAPI and catalog feed in `apps/ecommerce/lib/meta/*` and `app/api/meta/catalog`. Env: `META_PIXEL_ID`, `META_CONVERSIONS_API_ACCESS_TOKEN`.
- PostHog for admin analytics (`apps/admin/lib/analytics/posthog.server.ts`).
- No Google Tag Manager, GA4, Google Sheets or Shopify integration exists. Only legacy traces: `0027_drop_categories_shopify_id.sql`, and a product-from-URL scraper at `apps/dashboard/app/api/fetch-product/route.ts` (cheerio).
- Seller ad packages: `ad_campaign_requests` (paid by Vodafone Cash, reviewed manually) at `apps/dashboard/app/(main)/marketing/`.

### 2.9 Uncommitted work at audit time [Verified]

`git status` showed:

- Modified: `MARKETING_PROJECT.md` (large user rewrite), `apps/ecommerce/app/[locale]/(main)/sell/page.tsx` (+3 Arabic keywords), `apps/ecommerce/messages/ar.json`.
- **Untracked builder import** in `apps/dashboard`: `app/(builder)/`, `components/{cms,design,dnd,navigation,sections,website,website-builder,websites}/`. Size: about 935 files and roughly 189k lines; `components/sections` alone is 356 files / ~145k lines.

This plan did not touch any of these files. The implementation session must not delete or overwrite them without the user's agreement (see P0-02).

---

## 3. Target-state architecture [Proposed]

```
                 ┌──────────────────────────────── Supabase Postgres (single DB) ────────────────────────────────┐
                 │ users (1) ── (1) sellers  [account: plan='free', fee trial, store wallet, business/legal data] │
                 │                   │                                                                            │
                 │                   ├── (n ≤ plan.maxStores) stores  [TENANT: subdomain, custom domain, identity] │
                 │                   │        ├─ store_design_systems (1)   ├─ store_pages (draft/published)      │
                 │                   │        ├─ store_site_revisions (n)   ├─ store_integrations (n)             │
                 │                   │        ├─ cms_collections → cms_items → cms_item_revisions                  │
                 │                   │        ├─ store_forms → store_form_submissions                              │
                 │                   │        ├─ saved_blocks, store_products (catalog selection)                 │
                 │                   │        └─ carts.store_id / orders.store_id (storefront traffic)             │
                 │                   ├── products (seller catalog, shared by the seller's stores) — existing       │
                 │                   ├── media_folders / media_assets (seller library, optional store_id)         │
                 │                   ├── seller_wallet + wallet_transactions (store wallet, entries tagged store) │
                 │                   └── seller_fulfillment_* (optional) — existing                               │
                 │ templates → template_versions, template_installs (global, admin-authored)                      │
                 └────────────────────────────────────────────────────────────────────────────────────────────────┘
        ▲ edit (auth, store ownership checked)                         ▲ read published only (public, host → store)
┌───────┴─────────────────────────┐   shared package   ┌──────────────┴────────────────────────────────────────┐
│ apps/dashboard                  │◀─────────────────▶│ apps/ecommerce                                          │
│  /signup → seller + first store │ @workspace/       │  proxy.ts host routing → store                          │
│  store switcher, /stores        │ store-sections    │  storefront/[subdomain] → published revision, or the    │
│  /stores/[storeId]/{templates,  │ (schema, render,  │   default theme (legacy path) when none exists          │
│   editor,settings,apps,forms,   │  classic template)│  marketplace (unchanged)                                │
│   cms}; products/orders/wallet  │                   │                                                         │
└─────────────────────────────────┘                   └─────────────────────────────────────────────────────────┘
```

Key choices:

1. **The account and the tenant are now separate (owner decision, 2026-10-17).** The `sellers` row (1:1 with `users`) is the **account**: plan, wallet, fee trial, legal and business data, marketplace identity. The new **`stores`** table is the **tenant**: subdomain, custom domain, branding, pages, theme, integrations, forms, CMS. A seller can own several stores, up to `plan.maxStores`. That is **3 on the Free plan**, and everyone is on Free for now.
2. **Plans.** Add `sellers.plan` (`'free'` default) and a code registry of plan limits modelled on Valorcy's `packages/plans` (`hasFeature`, `getLimit`, `isWithinLimit`). Free = `maxStores: 3`; AI and advanced settings off. Paid subscriptions (AI usage, more stores, advanced settings) are **later**. Every limit check goes through one helper, so adding subscriptions means adding plans, not touching callers.
3. **Existing sellers keep working unchanged.** A backfill creates one **primary store** per existing seller from their current `subdomain`, custom domain, logo, banner, description and policies (catalog mode `all`). The legacy `sellers.subdomain` stays as a mirror of the primary store's subdomain. Old links, redirects and custom domains keep resolving.
4. **Catalog is per seller, shown per store.** Products stay owned by the seller (`products.seller_id`, unchanged). Each store either shows **all** the seller's active products (default, which is today's behaviour) or a **selected** list (`store_products`) ([Decision] D24).
5. **Store-scoped URLs in the dashboard.** Everything that belongs to one store lives under `/stores/[storeId]/…`. Every server action takes `storeId` explicitly and checks that the store belongs to the session's seller. There is no hidden "current store" cookie on writes, so two tabs editing two stores cannot overwrite each other. A store switcher remembers the last store only for navigation.
6. **Builder tables mirror the reference so the Valorcy code ports cleanly.** Valorcy `projects`+`websites` → `stores`; `website_pages` → `store_pages`; `design_systems` → `store_design_systems`; `templates`/`template_versions`/`template_installs` → same names; `cms_*` → same names (store-scoped); `forms` + `business_leads` → `store_forms` + `store_form_submissions`; `media_*`, `saved_blocks` → same names. Tallaby adds `store_site_revisions` (immutable publish snapshots) for atomic multi-page publish and rollback. Valorcy's commerce tables (`store_orders`, `store_carts`, …) are **not** copied; Tallaby commerce stays.
7. **Drafts and published content are stored separately.** Page drafts live in `store_pages`. Publishing writes a full-store snapshot to `store_site_revisions` and moves `stores.published_revision_id` in one transaction. Public rendering reads only that revision.
8. **Shared rendering package** `packages/store-sections` (name proposed): a versioned Zod site schema, the section registry with an `edit | public` mode, curated commerce-focused sections, and the Tallaby Classic template.
9. **Default template kept.** "Tallaby Classic" is the existing storefront (`apps/ecommerce/app/[locale]/storefront/[subdomain]/`), with its data source switched from the seller row to the store row (same values after backfill, so nothing changes visually). It is live for every store from creation (D7), with an empty-catalog state until products exist.
10. **Fee engine:** a pure function `computePlatformFee` (integer piastres) used by `placeOrderFromCart` for all orders of all sellers (D1), snapshotted per line. It becomes a store-wallet `fee` entry when the order is delivered.
11. **Store wallet = one wallet per seller account** (D10). It holds all of the seller's stores' money, so fees and top-ups are not split. Entries carry an optional `store_id` for per-store reporting. It is the existing `seller_wallet` / `wallet_transactions`, upgraded (§11.10).
12. **Integrations, forms, CMS and SEO are per store.** Tracking scripts render only on that store's host.
13. **Domains:** keep the current hosts. The marketplace move to `store.tallaby.com` waits for the Fulfillment work (D8). Payments: Kashier first for new payment work; Paymob stays.

---

## 4. Repository audit findings (file-level)

| # | Finding | Evidence | Impact |
|---|---|---|---|
| F1 | Storefront subdomains, custom domains, store-scoped carts and storefront order source already exist | `migrations/0044`, `0045`, `0048`; `apps/ecommerce/proxy.ts`; `lib/storefront*.ts` | Phase 1 is much smaller than the brief assumed; reuse all of it |
| F2 | The existing default storefront template lives in ecommerce | `app/[locale]/storefront/[subdomain]/**` | Must become "Tallaby Classic" without visual change |
| F3 | Signup is a 5-step wizard in ecommerce and collects fulfillment choices | `components/onboarding/*`, `become-seller.server.ts` | Replace with minimal signup (Phase 2) |
| F4 | `sellers` requires `business_type`, `legal_address`, `support_email` | `schema.ts` `sellers` | Minimal signup must supply safe defaults (P2-01) |
| F5 | Builder code copied into the dashboard does not compile (missing `@/lib/builder/*` ×62 modules, `@/lib/ai/*` ×22, Valorcy actions, `@workspace/{kits,i18n,analytics,currency,tiptap-editor}`, `@dnd-kit/*`, `ai`, `@ai-sdk/react`, `framer-motion`, `@acme/sdk`; missing UI components `input-group`, `theme-provider`, `valorcy-logo`; uses Valorcy `schema.projects/websites/...`) | import scan of untracked dirs | `pnpm --filter dashboard typecheck`/`build` very likely broken until it is quarantined (P0-02) |
| F6 | Commission is hard-coded at 5% and ignores per-seller rate and exemption | `place-order.lib.ts`, `place-order.ts` lines ~317–466 | New fee engine for all sellers (Phase 6, D1). `commission_rate` becomes legacy; exemption kept as an admin override (D12b) |
| F7 | Seller "sale" credit idempotency is read-then-insert with no unique index | `credit-seller-on-delivery.ts` | Race risk. Store-wallet unique reference index (P6-05) |
| F8 | Admin "delivered" status change does not credit the seller wallet | `apps/admin/actions/orders.ts` `updateOrderStatus` | Inconsistent ledger. All delivered paths post store-wallet entries (P6-05) |
| F9 | No seller-side ledger entry for refunds or returns | grep `walletTransactions` writes | Refunds deferred by the owner (D3), to be handled with the Kashier work (P6-12) |
| F10 | Robots and sitemap ignore the host | `app/robots.ts`, `app/sitemap.xml/route.ts` | Storefront SEO leak (P5-04) |
| F11 | Marketplace Meta Pixel loads on seller storefronts | `app/[locale]/layout.tsx` mounts `MetaPixel` | Privacy/isolation issue (P5-05) |
| F12 | `users` provisioning trigger is not in the repo migrations | reference in `0025` comment | Verify before signup work (P0-04) |
| F13 | `products` introspected policy `"Public full access"` for `all` to `public` | `schema.ts` `products` pgPolicy | If live, anon clients could write products. Verify in P0-04 |
| F14 | No E2E framework or CI | repo root | Choose a tool (D15). Until then, use manual E2E checklists |
| F15 | `.planning/` milestone docs (Stripe Checkout, 5-step onboarding) are out of date; payments are Paymob/Kashier | `.planning/PROJECT.md`, `ROADMAP.md`, `turbo.json` env | Superseded by this plan (§21.4) |
| F16 | Dashboard host differs between docs (`seller.tallaby.com` in caching doc vs `dashboard.tallaby.com` in marketing doc) | `docs/caching-and-data-fetching.md`, `MARKETING_PROJECT.md` | Check in Vercel (P0-04) |
| F17 | Seller-delivered cash-on-delivery orders still credit `seller_earning` to the seller wallet on delivery, although the seller collected the cash | `apply-seller-shipment.ts` | **Resolved by D10:** the store wallet records who collected the money (§13.4). For seller-collected cash only the `fee` is debited (balance may go negative) |
| F19 | Wallet top-ups exist only for user wallets via Paymob. `wallet_top_ups.wallet_id` has an FK to `user_wallets`. Kashier handles order payments only | `schema.ts` `walletTopUps`; `apps/backend/src/lib/wallet-top-up.ts`; `apps/backend/src/routes/kashier.ts` | Store-wallet top-ups need their own table and a Kashier flow (P6-09, P6-10) |
| F21 | One storefront per seller is built into the schema: `sellers.subdomain`, `seller_custom_domains` unique on `seller_id`, `carts.store_seller_id`, storefront resolvers return the seller | `0044`, `0045`, `0048`, `apps/ecommerce/lib/storefront.server.ts` | Multi-store (owner decision) needs a `stores` tenant + backfill + compatibility layer (P1-02, P1-07, P5-00) |
| F20 | The seller ledger has a single writer | `packages/db/src/wallet/credit-seller-on-delivery.ts` (only `update(sellerWallet)` in the repo) | Centralising the store-wallet primitive is low-risk |
| F18 | `MARKETING_PROJECT.md` and the `/sell` copy state a "5% commission" and a 10-minute signup | `MARKETING_PROJECT.md` L186, `messages/*.json pages.sell` | Update to the decided fee (2%, min EGP 5) and new-seller trial (Phase 10 content tasks) |

---

## 5. Reference builder audit and integration mapping

### 5.1 What was found

- **Copied code (inside this repo, untracked):** listed in §2.9. File dates are around 2026-10-05.
- **Closest reference project on disk:** `F:\Programming Projects\saas-templates-redo` ("Valorcy — AI Website Builder SaaS", last commit 2026-08-25). An older copy is at `F:\Programming Projects\saas` (2026-05-20). The copied code is **newer than both**: `website-builder` differs from `saas-templates-redo` in 65 entries (for example, `planner/` and `ai-builder/website-overview.tsx` exist only in the copy), and `sections` differs in 288 entries. `cms`, `design`, `website` and `websites` match `saas-templates-redo` exactly.
- **Resolved (D9, 2026-10-17):** the authoritative reference is **`D:\programming projects\saas\apps\dashboard`** (Valorcy, GitHub `elsharkawy159/saas`, last commit `e8030772` 2026-10-15). `diff -rq` shows the copied directories (`components/{website-builder,sections,dnd,cms,design,navigation,website,websites}`) are **identical** to it, and `app/(builder)` differs by one entry. Missing modules the copy needs (for example `lib/builder/*`, 109 files) are present there. `saas-templates-redo` and `F:\…\saas` are older copies and can be ignored. Valorcy's builder routes live under `app/[locale]/(main)/(builder)` and public sites under `app/[locale]/(public)/sites/[slug]` (with per-site `robots.txt` and `sitemap.xml`, a useful model for P5-04). `packages/website-builder` in that repo is an empty folder.
- **Also useful in the reference** (read-only; inspect in P0-01):
  - `components/forms/*`: form builder, custom form renderer, contact and lead forms. Candidate for a store "contact us" section, posting to a Tallaby endpoint, not Valorcy's.
  - `components/templates/*` + `actions/template-actions.ts`, `template-install-actions.ts`, `template-studio-actions.ts`: template gallery, cards, device frame, install flow. Model for P4-05 and a future theme store.
  - `components/media-library/*`.
  - `components/storefront/*`: Valorcy's own cart and checkout. **Do not use**; Tallaby commerce stays.

### 5.2 Reference architecture (first audited in `saas-templates-redo`; the same structure exists in the authoritative `D:\programming projects\saas\apps\dashboard`, which P0-01 re-checks)

| Subsystem | Location (reference) | Facts |
|---|---|---|
| Editor state | `apps/dashboard/lib/builder/store.ts` (2,473 lines) | Zustand + `immer` + `zundo` temporal undo/redo, snapshots debounced at 350 ms. Holds pages, active page, section instances, selection, device mode, save status, shared chrome. **Not copied into Tallaby.** |
| Page model | `components/sections/registry.types.ts` | `PageContent { sections: SectionInstance[] … }`. `SectionInstance { id, sectionId, version, props, translations?, style?, breakpointStyles?, animation?, componentTree?, slots? }` |
| Section definition | `components/sections/define-section.ts`, `schema/compile-schema` | Schema-first sections compile to `propDefinitions`, `itemCollections`, `editableElements` and `defaultProps`. `migrateProps` per version (`lib/builder/section-migrations.ts`) |
| Section library | `components/sections/**` | 23 categories (navbar, hero, features, pricing, booking, listings, menu, auth…). `AUDIT.md`: 257 sections (127 keep / 114 refactor / 16 merge). **No product, catalog or cart sections.** 290 of 307 `.tsx` files are client components that import editor modules (`@/components/website-builder` ×93, `@/lib/builder` ×111) |
| Free-form nodes | `lib/builder/component-node.ts`, `website-builder/component-tree-renderer.tsx` | Node types include `customCode`, `form`, `map`, `video`. `customCode` renders seller HTML on the published site, which is **not allowed in Tallaby** |
| DnD | `website-builder/dnd/*`, `components/dnd/*` | `@dnd-kit/react`, `@dnd-kit/dom`, `@dnd-kit/abstract`, `@dnd-kit/collision` (new dependencies for Tallaby; Tallaby uses `@hello-pangea/dnd` elsewhere) |
| Autosave | `website-builder/use-builder-autosave.ts` (copied) | 1.5 s debounce. `updateWebsitePageDraft(projectId, pageId, websiteId, {…content, clientVersion})` with a version conflict check (`VERSION_CONFLICT`) |
| Draft/publish | `actions/website-page-actions.ts` `updateWebsitePageDraft`, `publishWebsitePage`; `actions/website-actions.ts` `publishWebsite`, `schedulePublish` | Draft and published content are columns on the same `website_pages` row. Publish copies draft to published, inlining shared header and footer. There is no immutable revision history except `template_versions` |
| Persistence | `packages/db/src/db/schema.ts` | `websites` (subdomain, custom domain, shared header/footer, status), `website_pages` (draft/published jsonb, version), `design_systems` (colors/typography/spacing/customCss), `templates` (+ Template Studio) |
| Public rendering | `app/(public)/sites/[slug]/**`, `website-builder/public-sections-renderer.tsx`, `public-site-context.tsx`, `site-theme.tsx` | Renders `publishedContent` with theme CSS variables. Valorcy has its **own** commerce (storefront cart/checkout actions), which Tallaby must not use |
| AI | `website-builder/ai-builder/*`, `planner/*`, `generation-progress/*`, `lib/ai/*` | Vercel AI SDK + Gemini + Inngest, conversation history, site planner |
| Plans/billing | `requirePlan`, `@workspace/plans`, Polar | Premium section gating. Not applicable to Tallaby |

### 5.3 Mapping table — copied directories → Tallaby

Legend: **Reuse** = use with small changes; **Adapt** = keep the structure, rewrite the data and auth wiring; **Reference** = read for ideas, do not ship; **Exclude** = not for launch.

| Copied path (`apps/dashboard/…`) | Purpose | Verdict | Dependencies / risks | Tallaby integration point |
|---|---|---|---|---|
| `app/(builder)/website-builder/edit/[websiteId]/page.tsx` | Loads website + project + design system, checks project role, renders `BuilderEditor` | **Adapt** | Valorcy `schema.*`, `requireUser`, `getProjectOwnerAndRole`, `@workspace/kits` | New `app/(builder)/stores/[storeId]/editor/page.tsx` [Proposed]. Checks store ownership with `requireStore(storeId)` (Valorcy `getProjectOwnerAndRole` → Tallaby `stores.seller_id`), then loads `stores` + `store_design_systems` + `store_pages` |
| `app/(builder)/website-builder/{preview,live-preview}/…` | Draft preview routes | **Adapt** | Same | Dashboard draft preview + signed storefront preview (P4-08) |
| `app/(builder)/website-builder/{ai,new,start}/…` | AI generation and new-site wizard | **Exclude** (D13) | `ai`, Gemini, Inngest | — |
| `components/website-builder/builder-editor.tsx`, `builder-workspace.tsx`, `builder-canvas.tsx`, `builder-navbar.tsx`, `builder-left-sidebar.tsx`, `builder-right-sidebar.tsx`, `builder-tab-rail.tsx` | Editor shell, canvas, toolbars | **Adapt** | Needs `lib/builder/store.ts` (port from reference), `framer-motion`; navbar links to Valorcy routes | Editor UI. Remove project/team/plan/AI controls, add Publish + "View store" (`storeUrl`) |
| `components/website-builder/canvas/*`, `controls/*`, `insert/*`, `preview/*`, `element-popover/*`, `inline-editable.tsx`, overlays (`element-resize-overlay`, `flex-gap-overlay`, `canvas-grid-overlay`) | Canvas interaction, property controls, device preview | **Reuse** (controls/canvas/insert/preview have no Valorcy-action dependencies); element-popover needs `framer-motion` | `framer-motion` dependency | Same role |
| `components/website-builder/panels/*` (29 files) | Properties and content panels | **Adapt** | `@/actions/{form,media,website-ai-section,website-page}-actions`, `@/lib/cms/*`, `@dnd-kit/react` | Panels for text, images, colors, spacing, product pickers (P4-07). Drop CMS bindings |
| `components/website-builder/dnd/*`, `components/dnd/*` | Drag-and-drop | **Reuse** after adding `@dnd-kit/*` | 4 new packages, React 19 compatibility to confirm | Section reordering and insertion |
| `components/website-builder/use-builder-autosave.ts`, `use-builder-shortcuts.ts`, `keyboard-shortcuts-dialog.tsx` | Autosave, undo/redo keys | **Adapt** | Calls Valorcy actions | Calls Tallaby `saveStorePageDraft` (P4-04) |
| `components/website-builder/media/*` | Media library | **Adapt** | `@/actions/media-actions` | Use the existing seller upload path `components/inputs/use-seller-upload.ts` / `image-upload.tsx` (Supabase `sellers` bucket) |
| `components/website-builder/design-system/*`, `site-theme.tsx`, `components/design/*` (palette presets, font pairings, brand preview) | Theme tokens → CSS variables | **Adapt** | `@workspace/i18n` in `design/*`; AI design actions | Theme panel + Store Settings → "Theme" (P4-01, P3-03) |
| `components/website-builder/public-sections-renderer.tsx`, `public-site-context.tsx`, `injected-children-public-layer.tsx` | Public renderer | **Adapt → move to shared package** | Imports editor modules | `packages/store-sections` renderer used by ecommerce (P4-02, P5-01) |
| `components/website-builder/component-tree-renderer.tsx` | Free-form element tree | **Adapt with restrictions** | `customCode`, `form`, `map` node types | Remove `customCode`. Allow only a fixed safe node list. Sanitize rich text |
| `components/website-builder/ai-builder/*`, `planner/*`, `generation-progress/*`, `explore/*`, `translate-to-arabic-button.tsx`, `use-auto-section-refactor.ts` | AI features | **Exclude** (D13) | `ai`, `@ai-sdk/react`, `lib/ai/*` | — |
| `components/website-builder/save-template-dialog.tsx`, `publish-template-version-button.tsx`, `template-thumbnail-uploader.tsx`, `generate-thumbnail-button.tsx` | Template Studio authoring | **Reference** (admin, later, D14) | Valorcy templates tables | Possible future admin template authoring |
| `components/website-builder/page-view-beacon.tsx`, `cms-pagination.tsx` | Valorcy analytics, CMS pagination | **Exclude** | `@workspace/analytics`, CMS | — |
| `components/sections/registry.types.ts`, `define-section.ts`, `schema/*`, `section-root.tsx`, `section-container.tsx`, `section-surface.ts`, `ds-padding.ts`, `_primitives/*` | Section contract and building blocks | **Reuse → move to shared package** | `_primitives` use `@workspace/i18n` (replace with next-intl or plain props) | `packages/store-sections/src/core/*` [Proposed] |
| `components/sections/_chrome/*` (navbar/footer renderers, `use-storefront-chrome.ts`) | Shared header/footer with cart count | **Adapt** | Calls Valorcy `getCart` | Wire to the Tallaby storefront cart (`apps/ecommerce/actions/cart.ts`, scoped by host) |
| `components/sections/{hero,features,about,testimonials,faq,cta,gallery,logo-cloud,stats,social-proof,contact,content,footer,navbar}/*` | Marketing sections | **Curate**: pick about 20–30 marked "Keep" in `AUDIT.md` that suit stores | Size (145k lines). Client-heavy | Optional sections for store pages |
| `components/sections/{booking,menu,listings,pricing,blog,team,timeline,auth}/*`, `components/auth-blocks` refs | Non-commerce verticals | **Exclude** at launch | — | — |
| `components/cms/*` | Valorcy CMS collections, API keys, CSV import | **Reference only** | Valorcy CMS | Tallaby's catalog is `products`/`categories`, so no CMS |
| `components/navigation/*` | Valorcy project/global sidebars | **Reference only** | — | Tallaby keeps `components/dashboard/Sidebar.tsx` |
| `components/website/*` (pages list, add/manage page, design-system editor, schedule publish, subdomain form) | Website management | **Adapt**: pages list, add page, design-system editor. **Exclude**: subdomain form (Tallaby has `store-link.client.tsx`) and schedule publish (later) | Valorcy actions | Website Editor page manager (P4-06) |
| `components/websites/*` (projects browser, website cards, domain sheet, DNS instructions) | Multi-site browser | **Adapt** (cards and browser) / **Reference** (domain sheet, DNS) | `@/actions/{project,website,domain}-actions`, `@/lib/plan-client`, `framer-motion` | `/stores` page (P3-02): store cards with preview, status and host; plan usage "N of 3" (Valorcy `plan-client` → Tallaby plans module). Domains keep the existing `settings/custom-domain.client.tsx` |

### 5.4 Builder audit tasks still open

P0-01 covers these, which must be checked against the authoritative reference: AI dependency boundaries in `lib/builder/store.ts`; the section migration framework (`section-migrations.ts`); `normalize-page-content.ts` / `has-unpublished-changes.ts`; i18n/RTL handling (`lib/builder/i18n/*`, RTL codemods in `scripts/rtl-*.mjs`); and the reference Vitest suite (`D:\programming projects\saas\apps\dashboard\__tests__`) plus the repo-level Playwright setup, if present in `D:\programming projects\saas`, as a model for editor tests.

**Audit results (2026-10-17, read-only, scan script kept in the session scratchpad):**

- **Dependency scan.** The 590 quarantined files use 579 distinct `@/…` specifiers: 417 resolve inside the copy, 162 resolve in the D: reference, **0 are missing**. By import count the D:-only modules are `lib/builder` (373), `lib/ai` (69, excluded by D13), `lib/utils` (44), `components/auth-blocks` (24, excluded), `services/toast` (19 → `sonner`), `i18n/navigation` (18 → next-intl), `lib/server` (17), `actions/cms`+`types/cms`+`lib/cms` (38, excluded at launch), `actions/website-page-actions` (9 → P4-04), `actions/media-actions` (7 → P4-09), and ~40 single-use action/component modules (projects, billing, templates, translation, AI) that are excluded or replaced.
- **Packages the copy needs that Tallaby's dashboard lacks:** `@dnd-kit/react` (18 imports), `@dnd-kit/dom` (4), `@dnd-kit/abstract` (4), `@dnd-kit/collision` (1), `framer-motion` (9), `zundo` + `zustand/middleware/immer` (store), `nanoid`; Valorcy workspace packages `@workspace/i18n` (14 → next-intl), `@workspace/kits` (3, types only → drop), `@workspace/currency` (2 → Tallaby formatters), `@workspace/tiptap-editor` (2), `@workspace/analytics` (1, excluded); AI SDKs `ai`, `@ai-sdk/react` (excluded). **These new dependencies are the owner approval P4-01 waits for.**
- **`lib/builder/store.ts`** is now 2,744 lines (Zustand + `immer` + `zundo` + `subscribeWithSelector`/`devtools`, `nanoid`). AI/CMS boundaries to cut when porting: the transient per-section "running AI op" map (line ~167), `replaceSections` for AI full-page generation (~285), the `valorcy:auto-fill-new-sections-ai` localStorage flag (~1656), and `syncCanvasCollectionToCms` from `@/actions/cms/section-binding-actions` (~520). `DEFAULT_LOCALE` from `@workspace/i18n` → `"ar"`. `KitSectionGroup` (type only) → drop.
- **Migrations:** `lib/builder/section-migrations.ts` (37 lines) is a pure `applyMigrations(instance, def)`: bump to `def.version` through `def.migrateProps(props, fromVersion)`, unchanged when no definition or no migrator (dev warning). Port as-is into `packages/store-sections` next to the section registry.
- **`normalize-page-content.ts` (103 lines) / `has-unpublished-changes.ts` (138):** stable-stringify comparison of draft vs published after inlining shared chrome and canonicalising generated node ids. It imports the `WebsitePageRow` type from `store.ts`; re-type it against `store_pages` when porting. Tallaby already answers "unpublished changes" from `store_pages.draft_version` vs the published revision (P1-04), so this is only needed for a per-section diff badge.
- **i18n/RTL:** content translation is an overlay: `props` holds the default-locale content and `translations[locale]` a partial overlay merged by `resolveSectionForLocale` (identity when nothing to merge; arrays merge by index). SiteConfig v1 already has `translations`. Tallaby's default locale is Arabic, so the overlay holds English. RTL in components was converted with `scripts/rtl-logical-codemod.mjs` (logical CSS properties) and `rtl-icon-codemod.mjs` (mirrored icons); run them on ported files when needed.
- **Tests:** `lib/builder/__tests__` has 8 pure unit tests worth porting with the modules (design-system CSS vars/fonts, font pairings, navbar links, store clipboard, lorem-ar, industry content, CMS policy — the last is excluded). `apps/dashboard/__tests__` is mostly AI. The repo has Playwright (`playwright.config.ts`, `tests/e2e`, two web servers) — a model for P0-06 if approved.
- **Forms:** `components/forms/{custom-form-renderer,public-contact-form,lead-form,booking-form}.tsx` + a `builder/` subfolder; submissions go through Valorcy hooks (`use-contact-submit`). For P4-10 reuse the renderer only and post to a Tallaby endpoint (`store_form_submissions`).
- **Template install:** `actions/template-install-actions.ts` (320 lines): `applyTemplateToExistingWebsite` and `createSiteFromTemplate`; UI in `components/templates/*` (card, device frame, options menu, empty/skeleton states). Model for P4-05; Tallaby writes `template_installs` and a new draft instead.

**Remaining unknowns: none** for porting. The open item is the owner's approval of the new packages (P4-01).

---

## 6. Seller signup and onboarding (Phase 2 design)

### 6.1 Target flow [Proposed]

1. **Store address:** a single field, `__________.tallaby.com`, with a live availability check.
2. **Account:** email and password, or "Continue with Google".
3. **Phone:** one mobile field (Egyptian format, `EGYPT_MOBILE_REGEX`), **no OTP**. It is kept only because the current operations rule needs it ("the admin team reaches new sellers on WhatsApp", `become-seller.dto.ts`). [Decision] D6 decides whether to move it to the checklist.
4. The server creates the seller and store records **idempotently**.
5. Redirect to the dashboard home, which shows the setup checklist (P3-02).

Not asked: store description, logo, categories, legal address, business type, fulfillment, shipping, payment, template, wallet balance.

### 6.2 Where it lives

The new route is `apps/dashboard/app/signup/page.tsx` [Proposed]. The dashboard is the main product surface and its session cookie is shared across `.tallaby.com`.

- `apps/dashboard/supabase/middleware.ts` must let `/signup` and `/api/auth/callback` through without a session, and send signed-in users who have no seller row to `/signup` instead of the blocked screen.
- The `/sell` CTAs and `seller-access-blocked.tsx` should point to the new signup.
- The legacy `apps/ecommerce/.../onboarding` route stays working until the new flow is verified in production. It then redirects to the new signup ([Decision] D16). Its code is removed in a separate approved task.

### 6.3 Data written at signup

Signup creates the **account** and the seller's **first store** (the primary store) in one transaction.

| Record / column | Value |
|---|---|
| `sellers.id` | `auth.users.id` |
| `sellers.slug`, `sellers.subdomain` | the chosen slug (legacy mirror of the primary store; `sellers.slug` is also the marketplace `/stores/[slug]` URL) |
| `sellers.business_name`, `display_name` | slug turned into a title (for example `faster-eg` → `Faster Eg`), editable later |
| `sellers.business_type` | `'individual'` (existing option value in `BUSINESS_TYPE_OPTIONS`) |
| `sellers.legal_address` | `{"country":"EG"}`. The column is NOT NULL jsonb, so no migration is needed. Check that readers handle missing keys: `storefront.server.ts` reads `.state` with optional chaining (verified). Admin seller detail and shipping origin need checking in P2-01 |
| `sellers.support_email` / `support_phone` | the auth email / the phone entered (D6) |
| `sellers.status` | `'approved'` (same as today) |
| `sellers.onboarding_complete` | `false` (now means "setup checklist incomplete") |
| `sellers.plan` | `'free'` (column default) |
| `sellers.fee_trial_eligible` | `true` (D5). The trial *starts* later (§13.5) |
| `users.role` | promote `customer`/NULL to `seller` only (same rule as `become-seller.server.ts`) |
| `stores` row | `seller_id`, `subdomain = slug`, `name = display_name`, `is_primary = true`, `status = 'active'`, `catalog_mode = 'all'`, `template_key = 'tallaby-classic'` |
| `store_design_systems` row | defaults from the Tallaby Classic template |
| `seller_wallet` row | balance `0`, `status = 'active'`. **No top-up or deposit required** |
| fulfillment rows | **none**. `resolveEffectiveFulfillment` falls back to the baseline (`docs/fulfillment.md` §2.3) |

### 6.4 Slug and subdomain rules (signup and "create store")

- Normalise with `normalizeSubdomain` and validate with `validateSubdomain` (`packages/lib/src/storefront/index.ts`): 3–32 characters, `[a-z0-9-]`, no `--`, not reserved.
- After the stores migration, `stores.subdomain` is the source of truth. Check availability against `stores.subdomain` and `seller_subdomain_redirects.subdomain`. During the transition, also check `sellers.subdomain`.
- Database enforcement: unique index + format CHECK on `stores.subdomain` (same rules as `sellers_subdomain_format` from `0044`). A race is caught as a unique violation and shown as "taken" (reuse `uniqueViolationConstraint` from `@workspace/lib/fulfillment/server`).
- Rate-limit the availability check. Upstash env vars are declared in `turbo.json` and `@upstash/redis` appears in the `pnpm-workspace.yaml` overrides, but **no Redis client exists in app code** (verified by grep). Adding one is a new dependency and needs approval. Otherwise use a per-IP in-memory limiter and accept that it is per instance.

### 6.5 Idempotency and OAuth

- `ensureSellerAccount()` [Proposed, `packages/lib/src/sellers/ensure-seller-account.ts`] runs in one transaction:
  - `INSERT INTO sellers … ON CONFLICT (id) DO NOTHING RETURNING id`.
  - If it was inserted: create the primary store, design system and wallet (each `ON CONFLICT DO NOTHING` on its unique key: `stores_one_primary`, `store_design_systems.store_id`, `seller_wallet.seller_id`).
  - If the seller already existed: return `{ created: false }` and create nothing new. Never a second primary store, never a slug change.
  - Running it again (retried callback, double submit) causes no duplicates.
- **Creating more stores later** is a separate action, `createStore(sellerId, {name, subdomain})`, with the plan limit (§11.2).
- Google OAuth: before redirecting to Google, store the chosen slug and phone in a short-lived **signed, httpOnly** cookie. Use HMAC with a new server secret, for example `SIGNUP_INTENT_SECRET` [Proposed env]. Do not put them in the `next` query parameter. The dashboard callback (`apps/dashboard/app/api/auth/callback/route.ts`) exchanges the code, verifies the cookie, calls `ensureSellerAccount`, clears the cookie and redirects to `/`. If the cookie is missing or invalid, a signed-in user with no seller row goes to `/signup` with the account step already done.
- Account linking: Supabase links identities that share a verified email depending on project settings. **[Assumption]** Check under Auth → Providers in P0-04. Never link accounts in application code by matching email.
- Email confirmation: if confirmation is on, `signUp` returns no session. The seller row is then created at the callback after verification, from the signed intent cookie. The verification email must link to the dashboard callback.

### 6.6 Progressive onboarding

The dashboard home checklist (P3-02) is computed from data, not stored as booleans:

- Logo set
- At least 1 active product
- Store published
- Contact info (support phone/email)
- Policies (return/shipping)
- Legal address (`legal_address.state` present)
- Payout details (`payment_details` present)
- Optional: "Top up your store wallet" (shown when the balance is negative or low)

Optional cards: "Connect Meta Pixel", "Explore Tallaby Fulfillment".

---

## 7. Seller dashboard information architecture (sitemap)

### 7.1 Principles

- **Two scopes.**
  - **Account** pages (the seller: products, wallet, plan, fulfillment) keep their current URLs.
  - **Store** pages (one store: website, domain, SEO, social, blog, payments, shipping) live under `/stores/[storeId]/…`.
  - The store switcher at the top of the sidebar decides which store the store-scoped links open. Writes always carry the explicit `storeId` (§3 item 5).
- **Dropdown groups** in the sidebar (collapsible, like the existing Products group). Each page has **tabs** for closely related settings instead of more sidebar items.
- **Reuse before building.** Every existing page keeps working at its URL. Moved pages get a redirect from the old path. Existing components are re-pointed, not rewritten.
- Labels are AR/EN; the Arabic brand name is **طلبي**. Items for unreleased features are hidden behind the rollout flag, or shown with a **"Soon / قريباً"** badge where noted.

### 7.2 Sidebar map

Status: **Existing** (works today), **Extend** (existing page gets new parts), **New**, **Soon** (visible but disabled).

```
[Store switcher: logo · name · host ▾  — other stores · + Create store (N of 3)]

Home — الرئيسية                                   /                                   Account+store   Extend
Orders & Shipping — الطلبات والشحن ▾
  ├─ All orders — كل الطلبات                       /orders                             Account (store filter)   Extend
  ├─ Delivery tracking — متابعة التوصيل             /orders/delivery                    Account (store filter)   Extend (moved from /shipping)
  ├─ Riders — المندوبون                            /orders/riders                      Account                  Extend (from /shipping dialogs)
  └─ Shipping settings — إعدادات الشحن              /stores/[storeId]/shipping          Store                    New
Products — المنتجات ▾
  ├─ All products — كل المنتجات                    /products                           Account                  Existing
  ├─ Add product — إضافة منتج                      /products/add                       Account                  Existing
  └─ Reviews — التقييمات                           /reviews                            Account                  Existing (moved into group)
Website — الموقع ▾                                                                     (all Store scope)
  ├─ Overview — نظرة عامة                          /stores/[storeId]/website           New
  ├─ Website builder — محرر الموقع                 /stores/[storeId]/editor            New (full screen)
  ├─ Templates — القوالب                           /stores/[storeId]/website/templates New
  ├─ Design system — الهوية والتصميم               /stores/[storeId]/website/design    New
  ├─ Pages — الصفحات                               /stores/[storeId]/website/pages     New
  ├─ Domain & SEO — النطاق وتحسين الظهور           /stores/[storeId]/website/domain    New (reuses existing domain components)
  ├─ Social media — التواصل الاجتماعي              /stores/[storeId]/website/social    New
  ├─ Blog — المدونة                                /stores/[storeId]/website/blog      New
  ├─ Forms — النماذج                               /stores/[storeId]/website/forms     New
  └─ Media library — مكتبة الوسائط                 /stores/[storeId]/website/media     New
Marketing — التسويق ▾
  ├─ Coupons — الكوبونات                           /coupons                            Account                  Existing
  └─ Advertise products — إعلانات المنتجات         /marketing                          Account                  Existing (+ pay from wallet, P6-11)
Apps — التكاملات                                   /stores/[storeId]/apps              Store                    New
Finance — المالية ▾
  ├─ Store wallet — محفظة المتجر                   /financial                          Account                  Extend (P6-06)
  ├─ Payouts & statements — المدفوعات والكشوف       /financial/statements               Account                  Extend (from current /financial)
  └─ Reports — التقارير                            /reports                            Account (store filter)   Existing
Store settings — إعدادات المتجر ▾                                                     (Store scope)
  ├─ General — عام                                 /stores/[storeId]/settings          New (absorbs store fields of /settings)
  ├─ Payment methods — طرق الدفع                   /stores/[storeId]/settings/payments New (COD on; wallets + InstaPay; others Soon)
  └─ Policies — السياسات                           /stores/[storeId]/settings/policies New
Account — الحساب ▾
  ├─ My stores — متاجري                            /stores                             Account                  New
  ├─ Business & account — النشاط والحساب            /settings                           Account                  Existing (store fields move out)
  ├─ Plan & usage — الباقة والاستخدام               /settings/plan                      Account                  New (Free · N of 3 stores)
  ├─ Fulfillment services — خدمات طلبي اللوجستية    /settings/fulfillment               Account                  Existing (+ requests, P8-01)
  └─ Help & feedback — المساعدة                     /help                               Account                  Existing
```

Redirects:
- `/shipping` → `/orders/delivery`. The existing `shipping-workspace.client.tsx`, `status-actions.client.tsx`, `assign-rider-dialog.client.tsx` and `rider-form-dialog.client.tsx` move with it, unchanged at first.
- Old settings anchors for subdomain and custom domain → `/stores/[primary]/website/domain`.

`DASHBOARD_ROUTES` (`components/layout/dashboard-routes.lib.ts`) gains every route above, so the command palette and breadcrumbs work. Store routes show the breadcrumb `Store name › Section › Page`.

### 7.3 Page details (tabs and contents)

| Page | Tabs / contents | Data | Reuse |
|---|---|---|---|
| **Home** `/` | KPIs (orders, revenue, pending deliveries) with a store filter · setup checklist for the selected store (§6.6) · trial banner (days left) · wallet balance card (warning if negative) · quick links (add product, open builder, view store) | existing dashboard actions + stores + wallet | `app/(main)/page.tsx`, `components/layout/GuidanceWidget.tsx` |
| **All orders** | Filters: store, source (marketplace / storefront), status, payment. The order detail dialog shows the delivery timeline and payment | `orders`, `order_items`, `orders.store_id` | `orders/vendor-orders.data.tsx`, `order-details-dialog.client.tsx` |
| **Delivery tracking** | One row per shipment: status, rider, address, COD amount. **Status actions update the order's delivery status directly**: assigned → out for delivery → delivered / failed / returned / cancelled, through `applySellerShipmentStatus`, which already updates the shipment, order, items, store wallet and affiliate hooks in one transaction. The customer sees the same status on their order-tracking page. Bulk actions and an "orders delivered by Tallaby" read-only view (Tallaby riders update those) | `shipments`, `seller_riders` | `shipping/*` (verified), `lib/shipping/apply-seller-shipment.ts`, `lib/shipping/shipping-status.ts` |
| **Riders** | List, add/edit rider, availability | `seller_riders` | `rider-form-dialog.client.tsx` |
| **Shipping settings** (store) | Tabs: **Delivery method** (Tallaby delivery vs own delivery, §8.7) · **Zones & prices** (governorate groups, price, free-over threshold, delivery time, COD on/off) · **Rules** (handling time, weight surcharge, free-shipping offers) · **Preview** (what a customer in each governorate pays) | `store_shipping_zones`, `stores.settings.shipping` | `packages/lib/src/shipping/*` (governorate list, rates) |
| **Website › Overview** | Live preview thumbnail, live URL (copy / open / share), site status (draft / published / unpublished changes), last published, buttons **Edit · Preview · Publish**, cards linking to design, domain & SEO, pages, blog, social; revision history | `stores`, `store_site_revisions` | reference `components/website/{website-detail,website-summary-card}.tsx` |
| **Website builder** | Full-screen editor (§8.2) | `store_pages`, `store_design_systems` | reference builder |
| **Templates** | Gallery + preview + apply (§8.1) | `templates`, `template_versions`, `template_installs` | reference `components/templates/*` |
| **Design system** | Tabs: **Colors** (palette presets + custom) · **Typography** (font pairings, AR/EN fonts) · **Brand** (logo, favicon, banner) · **Buttons & radius** · live brand preview | `store_design_systems`, `stores` | reference `components/website/design-system-editor.tsx`, `components/design/*` |
| **Pages** | Page list (home, custom, CMS pages), add/rename/reorder/delete, page SEO (title, description, OG image), show in navigation | `store_pages` | reference `components/website/{website-pages-list,add-page-dialog,manage-page-sheet}.tsx` |
| **Domain & SEO** | Tabs: **Domain** (Tallaby subdomain + custom domain with DNS steps; old addresses that redirect) · **SEO** (store title template, meta description, default share image, indexing switch, Google Search Console verification token) · **Sitemap & robots** (read-only URLs + status) | `stores`, `seller_custom_domains`, `seller_subdomain_redirects`, `stores.seo` | existing `settings/store-link.client.tsx`, `settings/custom-domain.client.tsx`, `actions/{seller,custom-domain}.ts`, `components/websites/dns-instructions.tsx` (reference) |
| **Social media** | Platform list (§8.8): enable, link/handle, order. Preview of the footer icons. Used automatically by the builder's header/footer social icons and the storefront footer | `stores.contact.social` | reference `components/sections/_chrome/social-options.ts` |
| **Blog** | Posts list (draft/published/scheduled), editor (title, cover, excerpt, rich body, tags, SEO), categories/tags. Automatically wired to blog sections and `/blog` pages (§8.9) | `cms_collections` (system `blog`), `cms_items`, `cms_item_revisions` | `@workspace/tiptap`, reference `components/cms/*`, `sections/blog/*` |
| **Forms** | Forms list, field editor, submissions inbox (§8.4) | `store_forms`, `store_form_submissions` | reference `components/forms/*` |
| **Media library** | Folders, upload, alt text, usage | `media_assets`, `media_folders` | reference `components/media-library/*` |
| **Apps** | Integration catalog per store (§9) | `store_integrations` | — |
| **Store wallet** | Balance (positive/negative), entries with filters (store, type), top-up (Kashier), fee explanation, trial card | seller ledger (§11.10) | `financial/*` |
| **Store settings › General** | Store name, store category, description, contact (phone, email, WhatsApp), default language and supported languages, currency (EGP, read-only), catalog (all products vs selected), store status (active / archive) | `stores` | parts of `settings/seller-settings.*` |
| **Store settings › Payment methods** | Method cards with logos (§8.6): **Cash on delivery** enabled by default; **Vodafone Cash, e& Cash, WE Pay, Orange Cash** (wallet number + holder name) and **InstaPay** (holder name + IPA / mobile / bank account or IBAN, optional link and QR), each activated with its required details; card, Fawry, installments, Apple/Google Pay, bank transfer, Tallaby wallet shown as **Soon** with "Notify me". Checkout preview | `stores.settings.payments` | `apps/ecommerce/lib/manual-payment-methods.ts`, `cart/checkout/payment/_components/manual-payment-instructions.tsx`, logos in `apps/ecommerce/public/payment-method/` |
| **Store settings › Policies** | Return, shipping, privacy, terms text (AR/EN), defaulting from the seller's existing policies | `stores.policies` | existing policy fields |
| **My stores** | §8.0 | `stores` | reference `components/websites/*` |
| **Business & account** | Business name, type, legal address, documents, support contact, payout details | `sellers`, `seller_documents` | existing `/settings` |
| **Plan & usage** | Current plan (Free), store usage "N of 3", feature list (AI, advanced settings: "Not on your plan"), placeholder for future upgrades (no prices shown until they exist) | `sellers.plan` + plans module | — |

### 7.4 Navigation implementation notes

- `Sidebar.tsx` turns the fixed arrays into a config of groups (`{ key, icon, items[], scope }`) so dropdowns render generically. Store-scoped `href`s are built from the selected store id.
- Badge counts (`sidebar.server.ts`) gain "pending deliveries" and "new form submissions".
- Mobile drawer: same groups. The switcher sits at the top.
- Empty states: store pages show a "Create your first store" card if the seller has none, which cannot happen after signup but can after an admin action.

---

## 8. Website Design: Stores, Templates, Website Editor, Store Settings, Forms & CMS

### 8.0 Stores [Proposed]

- **`/stores`:** a list of the seller's stores and a **Create store** dialog with name and subdomain (§6.4 rules).
- **`createStore`** runs in one transaction:
  1. Lock the seller row (`SELECT … FOR UPDATE`).
  2. Count the seller's non-deleted stores and compare with `getLimit(plan, 'maxStores')` (Free = 3). If at the limit, fail with `store_limit_reached`.
  3. Insert the store + design system.
- Every new store starts on Tallaby Classic, live with the empty-catalog state (D7). Catalog mode is `all` by default.
- **Archive** a store: `status = 'archived'`. The storefront returns 404, the subdomain stays reserved for the seller, and archived stores still count toward the limit (D26). **Delete** is admin-only and soft (`deleted_at`). The subdomain is freed only after a grace period (D26).
- The primary store cannot be archived while it is the only store. Changing which store is primary is out of scope for now (it would need the `sellers.subdomain` mirror to move).

### 8.1 Templates [Proposed]

- **Source:** the `templates` / `template_versions` tables (global, admin-authored, mirroring the Valorcy reference; D14 updated). They are seeded from code with **Tallaby Classic** as the only template and `is_default = true`. Each version is a validated `SiteConfig` (theme + pages + section instances). Columns `is_premium` and `price` are reserved for the future theme store, which will be paid from the store wallet as a `service_charge`.
- **No new default template is designed in this phase.** More templates are added only when the owner provides or approves them. The gallery must handle a single template gracefully.
- **Gallery** `/stores/[storeId]/website/templates`: cards with preview, description and category filter (hidden while there is one category). "Preview" renders with this store's products. "Use template" calls `applyTemplate(storeId, templateId)`.
- **`applyTemplate` is non-destructive.** It writes only this store's **drafts** (`store_pages`, `store_design_systems` draft) and keeps text and image overrides where section IDs match. It never touches products, orders, settings, domains, integrations, forms, CMS or other stores. The published revision stays live until the seller publishes. It records a `template_installs` row and `stores.previous_template_key` for "Undo template change". Earlier revisions can always be restored.

### 8.2 Website Editor [Proposed]

- **Route:** `apps/dashboard/app/(builder)/stores/[storeId]/editor/page.tsx`, full screen with no sidebar. The `(builder)` group gets its own layout with the auth and seller gate.
- **Loading:** `getStoreForEditor(sellerId, storeId)` checks `stores.seller_id = session seller`, then loads the store, design system and `store_pages` (draft + `draft_version`). It runs `migrateSiteConfig` and hydrates the Zustand store ported from the reference `lib/builder/store.ts`. Every autosave and publish call sends `storeId` and the server re-checks ownership.
- **Features:**
  - Add, remove and reorder sections from the curated registry.
  - Edit text (ar/en via section `translations`), images (media library), colors, typography, spacing.
  - Desktop/mobile device modes. Undo/redo (zundo).
  - Autosave with optimistic concurrency, plus an error/retry banner.
  - Explicit **Publish**, "Discard draft", and "Revision history" (restore any revision as the draft).
- **Commerce sections** [Proposed, new]:
  - Product grid (by category, manual selection, newest, best-rated, featured)
  - Single product spotlight
  - Category circles / carousel (existing components)
  - Catalog with search/sort (existing `StorefrontCatalog`)
  - Store hero (existing `StorefrontHero`)
  - Announcement bar
  - Rich text (sanitized)
  - Image banner
  - Trust badges / store info
  - Contact form (bound to a `store_forms` row, P4-10)
  - CMS list/detail (bound to a `cms_collections` row, P4-11)
- **Product binding:** sections store product **IDs** and query descriptors (`{source:'category', categoryId, limit, sort}`), never product snapshots. The renderer resolves them server-side with `seller_id = store.seller_id AND status = 'active'`, plus `store_products` when the store's catalog mode is `selected`. IDs from another seller resolve to nothing. The picker lists only products this store can show (reuse read functions; do **not** add to the 1,687-line `actions/products.ts`).
- **Disallowed:** `customCode` nodes, arbitrary HTML, script/iframe embeds, external CSS. Rich text uses a strict allow-list and is sanitized server-side on save **and** on publish.

### 8.3 Store settings and website settings split [Proposed]

Settings are split by what they affect (sitemap §7.2):

- **Store settings › General / Payment methods / Policies** (`/stores/[storeId]/settings…`): how the store operates. These apply **immediately** (no publish step), like today's profile fields.
  - Name, store category, description, contact (phone/email/WhatsApp), default and supported languages, currency (EGP, read-only), catalog mode (all vs selected), store status.
  - Payment methods (§8.6).
  - Return, shipping, privacy and terms text.
- **Website › Design system / Domain & SEO / Social media / Pages** (`/stores/[storeId]/website/…`): how the website looks and is found.
  - Theme, logo and favicon (Design system): saved as draft, live on **Publish**.
  - Subdomain and custom domain (Domain): immediate, as today. Reuse `store-link.client.tsx` and `custom-domain.client.tsx`, re-pointed from seller to store (`actions/seller.ts` `updateStoreSubdomain` and `actions/custom-domain.ts` gain a `storeId`).
  - SEO defaults: immediate (metadata is read live by the storefront layout).
  - Social links: immediate (§8.8).
- `/settings` keeps account, business, legal, documents and payout details. `/settings/plan` shows the plan.

**Compatibility:** while both exist, the store row is the source of truth for its storefront. The seller's `logo_url` and `description` remain for marketplace listings. Never write the same field in two places; P1-07 documents which surface reads which field.

### 8.4 Forms [Proposed] (P4-10)

- **Scope:** per store. Tables `store_forms` and `store_form_submissions` (§11.6), modelled on the reference `forms` + `business_leads` and `components/forms/*` (form builder, `custom-form-renderer.tsx`, `public-contact-form.tsx`).
- **Field types:** a fixed set (text, email, phone, textarea, select, checkbox).
- **Submission path:** an ecommerce server action resolves the store **from the host** (never from the body). It checks that the form belongs to that store, validates fields against the form definition, then applies a honeypot + rate limit per IP/store, stores a hashed IP, and optionally notifies the store email via the backend email route. **No anon RLS insert policy.**
- **Dashboard:** forms list, editor, submissions inbox (status new/read/archived), CSV export.
- **Privacy:** submissions contain customer PII. They are visible only to the store owner and kept for a retention period ([Decision] D28).

### 8.5 CMS [Proposed] (P4-11, P2 priority)

- **Scope:** per store. `cms_collections` (fields jsonb schema), `cms_items` (draft/published, `data`, `seo`, slug unique per collection), `cms_item_revisions`. Mirrors the reference so its CMS UI (`components/cms/*`) and section bindings (`lib/cms/section-bindings`) can be adapted.
- **Use cases:** blog/news, FAQ, lookbook, size guides. Public pages at `/{collection}/{slug}` on the store host (reserved-slug rules, §10).
- **Not included:** the Valorcy CMS API keys (`cms_api_keys`) and CSV import (later, if needed).
- **The catalog is never stored in the CMS.** Products remain Tallaby `products`.

### 8.6 Payment methods [Proposed] (P3-07)

**Current state [Verified].** Checkout (`apps/ecommerce/app/[locale]/cart/checkout/payment/*`) offers:

- cash on delivery (`cash_on_delivery`, refused when billed shipping > 90 EGP, `packages/lib/src/orders/payment.lib.ts`);
- online card payment (`online_payment` via Paymob/Kashier);
- the customer wallet and wallet-plus-remainder;
- **manual transfers** (`instapay`, `vodafone_cash`, `e_cash`).

Manual transfers are configured in `apps/ecommerce/lib/manual-payment-methods.ts`: logos in `apps/ecommerce/public/payment-method/` (`Instapay_logo.png`, `Vodafone_logo.png`, `Eand_logo.png`, an InstaPay QR) and **Tallaby's own** receiving account details hard-coded. After ordering, the customer marks "I've paid" (`reportManualPaymentSent` in `apps/ecommerce/actions/order.ts` sets `orders.metadata.paymentSelfReported`). Admins confirm (labels in `apps/admin/app/(dashboard)/orders/orders.lib.ts`). Storefront checkout uses the same page, so storefronts currently offer all of these, paid to Tallaby.

**Target.** Each store chooses its storefront payment methods on **Store settings › Payment methods**. The Apps page also lists them under a "Payments" category that links to this page. Every method shows its **logo**.

| Method | Key | Collected by | Status | Required details when activated |
|---|---|---|---|---|
| Cash on delivery — الدفع عند الاستلام | `cod` | Delivery party (Tallaby rider or the seller) | **Live, enabled by default** | none. Optional: COD fee (EGP, default 0), min/max order, note to customer |
| Vodafone Cash — فودافون كاش | `vodafone_cash` | **Seller**, by manual transfer | **Live**, off by default | **Wallet mobile number** (Egyptian mobile) + account holder name |
| e& Cash — اتصالات كاش | `e_cash` | Seller | **Live**, off by default | Wallet mobile number + account holder name |
| WE Pay (WE Cash) — وي باي | `we_pay` | Seller | **Live**, off by default | Wallet mobile number + account holder name |
| Orange Cash — أورنج كاش | `orange_cash` | Seller | **Live**, off by default | Wallet mobile number + account holder name |
| InstaPay — إنستاباي | `instapay` | Seller | **Live**, off by default | Account holder name + **at least one** receiving identifier: InstaPay address (IPA, `name@instapay`, email-like), **mobile number**, or **bank account number / IBAN** (`EG` + 27 digits). Optional: InstaPay payment link (`https://ipn.eg/…`) and a QR image |
| Debit/credit card (Visa, Mastercard, Meeza) | `card` | Tallaby (Kashier) | **Soon** | — |
| Fawry | `fawry` | Tallaby | **Soon** | — |
| Installments (valU, Sympl, Souhoola, Aman, Contact) | `installments` | Tallaby | **Soon** | — |
| Apple Pay / Google Pay | `apple_google_pay` | Tallaby | **Soon** | — |
| Bank transfer | `bank_transfer` | Seller | **Soon** | — |
| Tallaby customer wallet | `tallaby_wallet` | Tallaby | **Soon** | — |

**Catalog and logos.**
- `packages/lib/src/payments/store-methods.ts` [Proposed] lists each method: key, AR/EN labels, logo path, status (`live | soon`), collector (`seller | tallaby | delivery`), and a Zod schema for its details.
- Logos move to a shared location both apps can serve, e.g. `packages/ui/src/assets/payment-methods/`, or copied into each app's `public/payment-method/`.
- Existing: Vodafone, e&, InstaPay. **Needed: Orange Cash, WE Pay**, plus card/Fawry/valU/Apple Pay/Google Pay for the Soon rows. Use official brand assets and follow each brand's logo guidelines.

**Activation flow (dashboard).**
1. The seller switches a method on. A sheet opens and asks for the required details above.
2. Validation:
   - Egyptian mobile format (`EGYPT_MOBILE_REGEX` exists in `@workspace/lib/fulfillment`).
   - IBAN `EG` + 27 digits with checksum.
   - IPA `^[a-z0-9._-]+@instapay$`.
   - Payment link must be on `ipn.eg`.
   - QR is an image upload to `store-media`.
   - Show an operator-prefix *hint* (010 Vodafone, 011 e&, 012 Orange, 015 WE) as a warning only, because numbers can be ported between operators.
3. The method cannot be enabled until the details validate.
4. A preview shows exactly what the customer will see at checkout.

**Storage and safeguards.**
- `stores.settings.payments = { cod: {enabled:true, fee:0, …}, vodafone_cash: {enabled:false, details:{phone, holderName}}, instapay: {enabled:false, details:{holderName, ipa?, phone?, iban?, paymentLink?, qrMediaId?}}, … }`, Zod-validated on every write. At least one live method stays enabled. COD cannot be turned off while it is the only one.
- These details are **shown to customers** at checkout, so they are not secrets, but they are payment destinations. Changing them is a fraud target after an account takeover, so:
  - every change is audit-logged (who/when, old value masked);
  - the seller gets an email "Your payment details changed";
  - changes are rate-limited;
  - details are never logged in full.

**Customer flow on the store host** (adapts the existing manual-transfer UI):
1. Checkout lists only the store's enabled live methods, with logos.
2. The order is created with `payment_method = <key>`, `payment_status = 'pending'`, `status = 'pending'`. `orders.metadata` gets `paymentCollector: 'seller'` and a **snapshot** of the details shown (for disputes, even if the seller edits them later).
3. The payment page (generalise `manual-payment-instructions.tsx` to read the store's details instead of `MANUAL_PAYMENT_METHODS`) shows the logo, amount, order number to use as the transfer reference, the number / IPA / IBAN with copy buttons, and the InstaPay link and QR when set.
4. The customer taps "I've paid" (reuse `reportManualPaymentSent`, now also accepting an optional transaction reference).
5. **The seller confirms.** The dashboard order shows "Payment reported" with **Confirm payment received** / **Not received** actions (new server action `confirmManualPayment(storeId, orderId)`). It is store-scoped, status-guarded (`payment_status = 'pending'` → `paid`, set `paid_at`) and idempotent. Admin cannot confirm seller-collected payments except as a support override (audited).
6. Unpaid manual orders auto-cancel after a configurable window, default 48 h, to release stock ([Decision] D32).

**Checkout enforcement (ecommerce).** On a store host, the storefront checkout action rejects any method the store has not enabled (server-side, not just hidden UI). The COD fee is stored as a separate charge in order metadata/discount lines, **not** in the product subtotal, so it is excluded from the platform fee (confirm under D2). Marketplace checkout and its Tallaby-account manual methods are unchanged.

**Money flow.** Seller-collected methods (all manual transfers, and COD on own delivery) never pass through Tallaby. At delivery, the store wallet posts only the `fee` entry (no `sale`), exactly like seller-collected COD (§13.4). `resolveCollectionParty` uses `orders.metadata.paymentCollector`.

**Existing stores ([Decision] D30).** Backfilled primary stores currently show all Tallaby methods on their storefront. Recommended: new stores start with COD only (the seller can then activate wallets and InstaPay). Existing stores keep their current Tallaby-collected methods until the owner decides, so live stores don't silently lose online payment.

### 8.7 Shipping settings [Proposed] (P3-08)

**Current state [Verified].**

- Customer shipping is computed by Tallaby's governorate rate table from Cairo (`packages/lib/src/shipping/shipping-rates.ts`: base rate per governorate, +7 EGP/kg extra, ×1.14 fee, rounded to 5; fallback 110), seller `free_delivery` waivers and an optional cart threshold (`shipping.lib.ts`).
- Fulfillment decides who delivers (`resolveEffectiveFulfillment`; baseline = Tallaby `delivery_standard`).
- Sellers can also deliver with their own riders (`seller_riders`, delivery tracking page).

**Target.** Per-store shipping settings with two delivery methods:

1. **Tallaby delivery** (default, today's behaviour). Prices come from Tallaby's rate table, shown read-only per governorate. The seller can add **offers they pay for**: free delivery for the whole store, or free delivery over an order amount (extends the existing `sellers.free_delivery` idea to the store). Delivery-time estimates are Tallaby's.
2. **Own delivery** (the seller delivers with their own riders or courier). The seller defines **zones**:
   - Zone = a name + a set of governorates (optionally cities later).
   - Price per zone (flat). Optional per-kg surcharge.
   - Free-over threshold per zone.
   - Delivery time (min–max days, AR/EN text).
   - COD allowed per zone.
   - Enabled flag.
   - Governorates not covered by any zone show "We don't deliver here yet" at checkout.

- **Store-level rules:** handling/preparation time (days), cut-off time, default delivery estimate, pickup option (later).
- **Data:** table `store_shipping_zones` (§11.8b) + `stores.settings.shipping = { method: 'tallaby' | 'own', handlingDays, freeShippingOver, … }`.
- **Checkout integration** (`placeOrderFromCart` shipping step):
  - For **storefront orders** of a store with `method = 'own'`, the shipping cost comes from the matching zone instead of `calculateLocationShippingCost`.
  - Marketplace orders and stores on Tallaby delivery are unchanged.
  - The cart and checkout display use the same function, so the shown price equals the charged price.
- **Delivery method and fulfillment ([Decision] D31):** switching to "own delivery" means the seller delivers. Recommended: the seller may switch on their own (it needs no Tallaby agreement). This goes through a dedicated fulfillment function that sets the delivery service to `provider = seller` as active, extending the "only admins activate" invariant to cover *seller-handled* services. `docs/fulfillment.md` must be updated. Switching back to Tallaby delivery is a fulfillment request (admin), unless it is the baseline.
- **Wallet effect:** own-delivery COD orders are seller-collected, so only the fee is debited (§13.4). `resolveCollectionParty` uses the delivery method.

### 8.8 Social media [Proposed] (P4-15)

- **Platforms** (code list `packages/store-sections/src/social/platforms.ts`, extending the reference `components/sections/_chrome/social-options.ts`): Facebook, Instagram, TikTok, WhatsApp, X (Twitter), YouTube, Snapchat, Telegram, LinkedIn, Pinterest, Threads. Each has an icon, AR/EN label, input type (URL or handle or phone) and a URL validator restricted to the platform's domains (WhatsApp → `https://wa.me/<digits>`).
- **Storage:** `stores.contact.social = [{ platform, value, enabled, order }]`.
- **Builder integration:** the shared header/footer chrome and a "social icons" element/section read the store's social list from the site context **at render time** (not from the publish snapshot), so links update without republishing. The editor shows them live and links to the Social media page. A section may override with a local list if the seller chooses.
- The Tallaby Classic footer (`storefront-footer.tsx`) also renders them.

### 8.9 Blog [Proposed] (P4-16)

- Built on the CMS tables (§8.5, §11.7). Each store gets a **system collection** `blog` (`kind = 'blog'`, `is_system = true`), created lazily on first use or at store creation. It has fixed fields: title, slug, excerpt, cover image, body (rich text via `@workspace/tiptap`, sanitized), tags, author name, reading time, SEO.
- **Dashboard** (`/stores/[storeId]/website/blog`): post list with filters (draft/published/scheduled), editor, tags, preview. Publishing a post is per post (`cms_items.status = 'published'`, `published_at`) and **does not need a site publish**.
- **Automatic builder integration:**
  - Blog sections are curated from the reference `components/sections/blog/*` (e.g. card list, featured post, latest posts). They are pre-bound to the store's `blog` collection, so the seller never connects data manually. Section props are presentation only (count, layout, show excerpt).
  - Adding the first blog section, or creating the first post, ensures a `blog` page exists in `store_pages`.
- **Public routes** (store host): `/blog` (list, paginated, tag filter) and `/blog/[slug]` (post with Article structured data). Both are added to the store sitemap. RSS is optional (`/blog/rss.xml`). They render with the store's published theme and header/footer.
- **Isolation:** posts are filtered by `store_id`. Drafts and scheduled posts are never public.

---

## 9. Apps and integrations (Phase 7)

### 9.1 Framework [Proposed]

- **Table `store_integrations`** (§11.8):
  - `id`, `store_id` (FK, cascade), `seller_id` (owner, for checks), `provider` (text + CHECK list), `status` (`connected | error | disconnected`), `config` jsonb (public identifiers and options only)
  - `credentials_encrypted` text (AES-256-GCM, app-side, key `INTEGRATIONS_ENCRYPTION_KEY` [Proposed env]; never `NEXT_PUBLIC_`), `scopes text[]`, `external_account_id`
  - `last_error`, `last_synced_at`, `connected_by`, timestamps
  - `UNIQUE (store_id, provider)`, RLS enabled with **no** policies
- Integrations are **per store**: each store can have its own Pixel, GA4, GTM.
- **Code:** `packages/lib/src/integrations/{registry,crypto,validate}.ts` [Proposed]. Each provider defines its validator, connect flow, disconnect and storefront injection.
- **Dashboard:** `/stores/[storeId]/apps` catalog (cards with status), `/stores/[storeId]/apps/[provider]` detail (connect, test, disconnect, last error). AR/EN copy.
- **Injection:** the ecommerce storefront layout loads the **resolved store's** connected, public config (cached per store with tag `storeIntegrations(storeId)`) and renders fixed script templates. IDs are validated by regex before storage **and** before rendering. They are never rendered on the marketplace host or on any other store's host, including the same seller's other stores.

### 9.2 Per-integration analysis

| Integration | Use case | Type | Auth | Scopes / approval | Storage | Sync / events | UI | Disconnect | Priority |
|---|---|---|---|---|---|---|---|---|---|
| **Meta Pixel** | Retargeting, ad attribution | Seller-facing tracking | Identifier (Pixel ID, 15–16 digits) | None | `config.pixelId` | Client events: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase (Purchase fired on the order confirmation page, deduped by `event_id = order id`) | ID field + test-event hint | Delete row → script stops rendering after cache invalidation | **P1** |
| **Meta Conversions API** | Server-side purchase events | Seller-facing | Access token from the seller's Events Manager (system user token) | Business verification on the seller's side | `credentials_encrypted` | Server: Purchase on order placed/confirmed. Reuse `apps/ecommerce/lib/meta/meta.server.ts` with per-seller credentials | Token field, test-event code, last error | Delete credentials | **P2** |
| **Google Tag Manager** | Seller's own tags | Seller-facing tracking | Identifier `GTM-XXXXXXX` | None | `config.containerId` | Push a `dataLayer` ecommerce schema (view_item, add_to_cart, begin_checkout, purchase) | ID field. Warning that GTM lets the seller's own container run scripts the seller configures. **[Decision] D18:** allowing GTM means allowing seller-controlled scripts via GTM. Recommendation: allow it, but only on the seller's own storefront host, with a clear warning in the terms | Same as Pixel | **P1** (after D18) |
| **Google Analytics 4** | Traffic/sales analytics | Seller-facing tracking | Identifier `G-XXXXXXXXXX` | None | `config.measurementId` | gtag ecommerce events (same as above) | ID field | Same | **P1** |
| **Google Sheets** | Export orders (and optionally products) to the seller's sheet for bookkeeping | Export tool | Google OAuth 2.0 (offline refresh token) | `https://www.googleapis.com/auth/drive.file` (recommended, non-restricted) or `spreadsheets` (sensitive → Google verification). Needs a Google Cloud project, OAuth consent screen and verification | Refresh token encrypted, `config.spreadsheetId` | MVP: on-demand "Export orders" + optional daily append via cron (Vercel cron pattern exists). Idempotency per order id column | Connect with Google, choose/create sheet, export button, last sync | Revoke the token at Google (`oauth2/revoke`) + delete row | **P2** |
| **Shopify** | **Import** a seller's existing Shopify catalog into Tallaby products (one-way). **Not** a storefront integration: the Tallaby storefront replaces Shopify's | Import tool | MVP: seller-created custom app Admin API access token. Later: public app OAuth (needs Shopify Partner app + review) | `read_products` (+ `read_inventory`) | Token encrypted, `config.shopDomain` | Batch import job: GraphQL Admin API products → Tallaby `products`/`product_variants`/translations, images re-uploaded to the Supabase `sellers` bucket. Mapping to categories required (`categoryId` NOT NULL). Re-runs match on `external_ids` (`sellers.external_ids` exists; products need a mapping — store in product metadata or SKU) | Connect, preview count, import progress, error report | Delete token. Imported products stay | **P2/P3** |
| **WhatsApp click-to-chat** | Floating chat button | Seller-facing | Phone number | None | `config.phone` | — | Phone field | Delete | **P2** (justified: sellers are reached by WhatsApp today) |
| **TikTok Pixel** | Ads in Egypt | Seller-facing tracking | Identifier | None | `config.pixelId` | Same event map | ID field | Delete | **P3** (optional, only if requested) |

Non-goals: generic "paste your script" fields, per-seller payment gateways (all payments stay on Tallaby's Paymob/Kashier accounts), Shopify storefront sync.

### 9.3 Consent and privacy

The marketplace has a cookie policy page (`/cookies`). **[Decision] D19:** whether storefront tracking needs a consent banner. Egypt's PDPL, Law 151/2020, may require consent. Recommendation: add a minimal consent banner on storefronts before loading third-party pixels. Until then, launch pixel support with a legal check.

---

## 10. Multi-tenant storefront routing (Phase 5)

Most of the routing exists (§2.5). What changes is that **a host now resolves to a store**, not a seller.

1. **Host → store** (P5-00):
   - `{sub}.tallaby.com` → `stores.subdomain` (status `active`, `deleted_at IS NULL`, owner seller `approved`). Old subdomains go through `seller_subdomain_redirects` (now with `store_id`) to the store's current subdomain. Custom domains go through `seller_custom_domains.store_id`.
   - `getStorefrontBySubdomain` becomes `getStoreBySubdomain` and returns `{ store, seller }`, cached with tags `store:id:<id>` + `store:subdomain:<sub>`. `storeSubdomainFromHost`, `proxy.ts` and `storefront-routing.ts` keep their logic. The internal route stays `/[locale]/storefront/[subdomain]`.
   - Carts: `activeCartWhere(userId, storeId)` uses `carts.store_id`. `carts.store_seller_id` is still written (= store owner) for compatibility. Storefront orders get `orders.store_id`.
   - Catalog: products where `seller_id = store.seller_id AND status = 'active'`, filtered by `store_products` when `catalog_mode = 'selected'`. The cart and checkout must also refuse products the store does not show (server-side check in add-to-cart).
2. **Published site rendering** (P5-01) in `storefront/[subdomain]/page.tsx` and `layout.tsx`:
   - `getPublishedStoreSite(storeId)` (cached, tag `storeSite:published:<storeId>`) returns the revision snapshot or null.
   - If null, render the **existing** page code (Tallaby Classic, reading store fields).
   - If present, render the home page sections through the shared renderer. Header/footer come from the snapshot. Product detail and cart keep the existing pages, themed with the snapshot theme.
   - Custom pages and CMS pages at `/{slug}` and `/{collection}/{slug}` need new rewrites in `storefront-routing.ts` (P5-01b). Unknown paths keep redirecting to the marketplace. **Reserved slugs:** `cart`, `products`, `checkout`, `auth`, `orders`, `profile`, `payment`, `privacy`, `terms`, `returns`, `shipping`, `cookies`, `search`, `api`.
3. **Before the first publish / before products** (**decided, D7**):
   - Every store is **live from creation** with the default theme, showing the store's info and settings.
   - With no active products in the store's catalog, the catalog area shows a friendly empty state ("Products coming soon" in AR/EN). Add an `EmptyCatalog` state to `storefront-catalog.tsx` without changing the populated design.
   - `noindex` while the store shows zero products.
   - Archived or suspended stores → 404.
4. **SEO:** reuse the existing `generateMetadata` in the storefront layout, fed by store fields. Snapshot SEO settings override title and description. Canonical = `storeUrl(store.subdomain, customDomain)`. Host-aware `robots.ts` and `sitemap.xml` (P5-04): each store host gets its own sitemap (home, pages, published CMS items, the store's products). The reference `app/[locale]/(public)/sites/[slug]/{robots.txt,sitemap.xml}` is a model.
5. **Caching:**
   - Published snapshots are cached per **store id** with tags. Drafts are **never** cached.
   - Preview responses are `dynamic`, `noindex`, `Cache-Control: private, no-store`.
   - Product data uses the existing product tags (`productTags.seller(id)`); store catalog selection adds `store:catalog:<storeId>`.
   - Cache keys always include `storeId`.
6. **Invalidation:** publish/settings/catalog/integration mutations emit only that store's tags (added to `packages/cache/src/tags.ts`: `storeTags.{id,subdomain,catalog}`, `storeSiteTags.published(storeId)`, `storeIntegrationTags(storeId)`). They are broadcast to ecommerce through the existing `/api/revalidate`.
7. **Isolation:** every storefront query filters by the store resolved from the **host**. Never use a store or seller id from the request body.
8. **No seller JavaScript:** enforced by the section allow-list (§8.2) and the fixed integration templates (§9.1).
9. **Separate deployments are not needed.** All stores are served by the single ecommerce deployment.

---

## 11. Database schema, Supabase readiness and migration plan

All migrations are hand-written idempotent SQL in `packages/db/migrations/`, mirrored in `schema.ts` + `relations.ts` and exported from `packages/db/src/index.ts`. Existing numbering already has duplicate prefixes (`0031`–`0033`). **Re-check the next free number before creating each file.** Column lists below are the intended shape. The implementing session may adjust names to match reference code it ports, but must update this section when it does.

### 11.1 Migration order

> **Renumbered 2026-10-17:** the security fix took `0049`, so every planned migration in this plan moved up by one (`0050`–`0059`). **Again 2026-10-17:** P3-07 added `0058_store_settings_audit.sql`, so the fee migration is now `0059` and the store wallet `0060`.

| # | File [Proposed] | Contents | Phase / task |
|---|---|---|---|
| 0 | `0049_secure_users_products_contacts_rls.sql` **(applied to production 2026-10-17, `49d8cb5`)** | Security fix from P0-04 (b): drop self-update/self-insert and read-all policies on `users`, revoke client writes on `users`/`products`, drop the `products` insert policies and the `contacts` read-all policy | P0-04 follow-up |
| 1 | `0050_seller_plans_and_stores.sql` | `sellers.plan`; `stores`; backfill one primary store per seller; `store_id` on `seller_subdomain_redirects`, `seller_custom_domains`, `carts`, `orders`; `store_products` | P1-02 |
| 2 | `0051_store_builder_core.sql` | `store_design_systems`, `store_pages`, `store_site_revisions` | P1-02 |
| 3 | `0052_templates.sql` | `templates`, `template_versions`, `template_installs` + Tallaby Classic seed | P1-02 |
| 4 | `0053_store_media.sql` | `media_folders`, `media_assets`, `saved_blocks`, Storage bucket `store-media` + policies | P1-06 |
| 5 | `0054_store_forms.sql` | `store_forms`, `store_form_submissions` | P1-02 |
| 6 | `0055_store_cms.sql` | `cms_collections`, `cms_items`, `cms_item_revisions` | P1-02 |
| 7 | `0056_store_integrations.sql` | `store_integrations` | P1-02 (UI in Phase 7) |
| 8 | `0057_store_shipping.sql` | `store_shipping_zones` | P1-02 (UI P3-08) |
| 8b | `0058_store_settings_audit.sql` | `store_settings_audit` (append-only, masked) | P3-07 (added 2026-10-17) |
| 9 | `0059_seller_platform_fee.sql` | fee plan + trial columns | P6-02 |
| 10 | `0060_store_wallet.sql` | store-wallet ledger upgrade + `seller_wallet_top_ups` | P6-05 |

Tables 1–8 are created **early** (Phase 1) so that Supabase is ready for the builder, CMS, forms, templates and media from the start. Their UIs arrive in later phases. Creating unused tables is harmless and keeps later phases free of schema churn.

### 11.2 `0050_seller_plans_and_stores.sql`

```sql
-- Account plan (owner decision: everyone Free now; subscriptions later)
ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_started_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz;          -- NULL for free; used by future subscriptions
-- CHECK plan IN ('free')  -- widen when paid plans exist. Limits live in code (packages/lib/src/plans).

CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  name text NOT NULL,
  subdomain text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',            -- active | archived | suspended
  deleted_at timestamptz,                           -- soft delete (admin)
  logo_url text, favicon_url text, banner_url text,
  description text, store_category text, store_category_ar text,
  default_locale text NOT NULL DEFAULT 'ar',
  supported_locales text[] NOT NULL DEFAULT ARRAY['ar','en'],
  contact jsonb NOT NULL DEFAULT '{}',              -- phone, email, whatsapp, social
  policies jsonb NOT NULL DEFAULT '{}',             -- return/shipping/privacy (fallback: sellers.*)
  seo jsonb NOT NULL DEFAULT '{}',
  settings jsonb NOT NULL DEFAULT '{}',
  catalog_mode text NOT NULL DEFAULT 'all',         -- all | selected
  template_key text NOT NULL DEFAULT 'tallaby-classic',
  previous_template_key text,
  site_status text NOT NULL DEFAULT 'draft',        -- draft | published | unpublished (builder site)
  schema_version integer NOT NULL DEFAULT 1,
  shared_header jsonb, shared_footer jsonb,         -- draft chrome (reference: websites.shared_*)
  published_revision_id uuid,                       -- FK added in 0051
  first_published_at timestamptz, last_published_at timestamptz,
  subdomain_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT stores_status_check CHECK (status IN ('active','archived','suspended')),
  CONSTRAINT stores_catalog_mode_check CHECK (catalog_mode IN ('all','selected')),
  CONSTRAINT stores_site_status_check CHECK (site_status IN ('draft','published','unpublished')),
  CONSTRAINT stores_subdomain_format CHECK (
    subdomain ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$' AND position('--' IN subdomain) = 0
    AND NOT is_reserved_subdomain(subdomain))           -- function from 0044
);
CREATE UNIQUE INDEX IF NOT EXISTS stores_subdomain_key ON stores (subdomain);
CREATE UNIQUE INDEX IF NOT EXISTS stores_one_primary ON stores (seller_id) WHERE is_primary;
CREATE INDEX IF NOT EXISTS stores_seller_idx ON stores (seller_id) WHERE deleted_at IS NULL;

-- Backfill: one primary store per existing seller, same subdomain and identity → zero visible change.
INSERT INTO stores (seller_id, name, subdomain, is_primary, logo_url, banner_url, description,
                    store_category, store_category_ar, contact, policies, subdomain_updated_at, created_at)
SELECT s.id, s.display_name, s.subdomain, true, s.logo_url, s.banner_url,
       COALESCE(s.store_description, s.description), s.store_category, s.store_category_ar,
       jsonb_strip_nulls(jsonb_build_object('email', s.support_email, 'phone', s.support_phone)),
       jsonb_strip_nulls(jsonb_build_object('return', s.return_policy, 'shipping', s.shipping_policy)),
       s.subdomain_updated_at, s.created_at
FROM sellers s
WHERE NOT EXISTS (SELECT 1 FROM stores t WHERE t.seller_id = s.id AND t.is_primary);

-- Existing per-seller rows gain a store reference (nullable now, backfilled to the primary store).
ALTER TABLE seller_subdomain_redirects ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE seller_custom_domains     ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE carts                     ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE orders                    ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE SET NULL;
-- UPDATE … SET store_id = primary store of seller_id / store_seller_id (one statement each).
-- orders: only rows with order_source = 'storefront' (cart → store_seller_id → primary store);
--         marketplace orders keep store_id NULL.
CREATE UNIQUE INDEX IF NOT EXISTS seller_custom_domains_store_id_key ON seller_custom_domains (store_id);
CREATE INDEX IF NOT EXISTS carts_user_store_id_status_idx ON carts (user_id, store_id, status);
CREATE INDEX IF NOT EXISTS orders_store_id_idx ON orders (store_id) WHERE store_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS store_products (           -- used only when stores.catalog_mode = 'selected'
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (store_id, product_id)
);
-- Integrity: a store may only list its own seller's products → enforce in app + trigger
-- (BEFORE INSERT: products.seller_id = stores.seller_id, else raise).

-- RLS enabled on stores, store_products; no policies (server-only Drizzle access), like 0044/0048.
```

**Not changed in this migration (needs separate approval):** `seller_custom_domains_seller_id_key` (one custom domain per seller) stays until custom domains for a second store are actually needed. Dropping it is an index change, scheduled in P3-03b. The legacy `sellers.subdomain` trigger and unique index stay. The application keeps `sellers.subdomain` equal to the primary store's subdomain (single update path in `updateStoreSubdomain`).

**Plan limits (code, not DB)** — `packages/lib/src/plans/index.ts` [Proposed], modelled on Valorcy `packages/plans/src/{service,types}.ts`:

```ts
export const PLANS = {
  free: { maxStores: 3, aiCreditsMonthly: 0, advancedSettings: false, customDomain: true, removeTallabyBadge: false },
} as const satisfies Record<string, PlanLimits>;
export function getPlanLimits(plan: string): PlanLimits;          // unknown plan → free (safe default)
export function canCreateStore(plan: string, currentCount: number): boolean;
export function hasFeature(plan: string, feature: keyof PlanFeatures): boolean;
```

`customDomain: true` keeps today's behaviour, since custom domains are already available to every seller. Later subscriptions add `subscription_plans` / `seller_subscriptions` tables and a billing integration. Callers keep using these helpers.

### 11.3 `0051_store_builder_core.sql`

```sql
CREATE TABLE IF NOT EXISTS store_design_systems (       -- reference: design_systems (per project)
  store_id uuid PRIMARY KEY REFERENCES stores(id) ON DELETE CASCADE,
  colors jsonb NOT NULL DEFAULT '{}', typography jsonb NOT NULL DEFAULT '{}',
  spacing jsonb NOT NULL DEFAULT '{}',
  version integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);  -- no custom_css column: seller CSS is not allowed

CREATE TABLE IF NOT EXISTS store_pages (                -- reference: website_pages
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  slug text NOT NULL,                                   -- 'home' for the home page
  is_home boolean NOT NULL DEFAULT false,
  name jsonb NOT NULL DEFAULT '{}',                     -- {ar, en}
  seo jsonb NOT NULL DEFAULT '{}',
  draft_content jsonb NOT NULL DEFAULT '{"sections":[]}',
  draft_version integer NOT NULL DEFAULT 1,
  use_shared_header boolean NOT NULL DEFAULT true,
  use_shared_footer boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_pages_slug_format CHECK (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$')
);
CREATE UNIQUE INDEX IF NOT EXISTS store_pages_store_slug_key ON store_pages (store_id, slug);
CREATE UNIQUE INDEX IF NOT EXISTS store_pages_one_home ON store_pages (store_id) WHERE is_home;

CREATE TABLE IF NOT EXISTS store_site_revisions (       -- Tallaby addition: immutable publish snapshots
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  revision_number integer NOT NULL,
  schema_version integer NOT NULL,
  template_key text NOT NULL,
  snapshot jsonb NOT NULL,          -- validated SiteConfig: design system, header, footer, settings, pages[]
  published_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS store_site_revisions_store_number_key ON store_site_revisions (store_id, revision_number);
-- FK stores.published_revision_id -> store_site_revisions(id) ON DELETE SET NULL (DO-block, idempotent)
-- Append-only trigger on store_site_revisions (reject UPDATE/DELETE except cascade), like 0025.
-- RLS enabled, no policies.
```

Why the separate revisions table, which the reference does not have: a single pointer swap makes multi-page publishes atomic, history and rollback come free, public reads touch one row, and drafts can never leak, because the public path cannot read `store_pages`.

### 11.4 `0052_templates.sql`

```sql
CREATE TABLE IF NOT EXISTS templates (                  -- reference: templates (trimmed)
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,                             -- 'tallaby-classic'
  name jsonb NOT NULL, description jsonb NOT NULL DEFAULT '{}',
  category text NOT NULL DEFAULT 'general',
  thumbnail_url text, preview_url text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  is_premium boolean NOT NULL DEFAULT false,            -- future theme store
  price numeric(10,2),                                  -- future theme store (paid from store wallet)
  sort_order integer NOT NULL DEFAULT 0,
  current_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS templates_one_default ON templates (is_default) WHERE is_default;
CREATE TABLE IF NOT EXISTS template_versions (          -- reference: template_versions
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  version integer NOT NULL,
  schema_version integer NOT NULL,
  config jsonb NOT NULL,                                -- SiteConfig (pages + design system)
  changelog text, published_by uuid REFERENCES users(id) ON DELETE SET NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);
CREATE TABLE IF NOT EXISTS template_installs (          -- reference: template_installs
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  template_version_id uuid REFERENCES template_versions(id) ON DELETE SET NULL,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  installed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  installed_at timestamptz NOT NULL DEFAULT now()
);
-- Seed: 'tallaby-classic' (is_default) + version 1 generated from packages/store-sections templates
--       (the seed SQL is produced by a script in P4-03; until then the row exists with config = minimal valid SiteConfig).
-- RLS enabled; SELECT policy for active templates is unnecessary (server reads) → no policies.
```

### 11.5 `0053_store_media.sql` (tables + Storage)

```sql
CREATE TABLE IF NOT EXISTS media_folders (              -- reference: media_folders
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,   -- NULL = shared across the seller's stores
  parent_id uuid REFERENCES media_folders(id) ON DELETE CASCADE,
  name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS media_assets (               -- reference: media_assets
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  folder_id uuid REFERENCES media_folders(id) ON DELETE SET NULL,
  bucket text NOT NULL DEFAULT 'store-media',
  storage_path text NOT NULL,                           -- '{seller_id}/{store_id|shared}/{uuid}.{ext}'
  filename text NOT NULL, mime_type text NOT NULL, bytes bigint NOT NULL,
  width integer, height integer, alt_text jsonb NOT NULL DEFAULT '{}',
  content_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, storage_path)
);
CREATE TABLE IF NOT EXISTS saved_blocks (               -- reference: saved_blocks
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name varchar(200) NOT NULL, description text,
  block_type varchar(40) NOT NULL DEFAULT 'section',
  content jsonb NOT NULL, thumbnail_url text,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
-- Indexes on seller_id/store_id/folder_id. RLS enabled, no policies.

-- Supabase Storage: public-read bucket for storefront imagery
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('store-media', 'store-media', true, 5242880,
        ARRAY['image/jpeg','image/png','image/webp','image/avif','image/gif','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;
-- svg: only if sanitized server-side; otherwise drop 'image/svg+xml' (decide in P1-06).
-- storage.objects policies (authenticated), mirroring the existing client-side upload pattern
-- (apps/dashboard/components/inputs/use-seller-upload.ts uploads from the browser):
--   INSERT/UPDATE/DELETE on bucket 'store-media' only when (storage.foldername(name))[1] = auth.uid()::text
-- Public SELECT is implicit for public buckets. Each uploaded object must also get a media_assets row,
-- written by a server action after upload (dashboard), which validates path prefix, size and type.
```

### 11.6 `0054_store_forms.sql`

```sql
CREATE TABLE IF NOT EXISTS store_forms (                -- reference: forms
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  key text NOT NULL,                                    -- stable id used by sections, e.g. 'contact'
  name text NOT NULL, description text,
  fields jsonb NOT NULL DEFAULT '[]',                   -- validated field definitions (fixed types)
  settings jsonb NOT NULL DEFAULT '{}',                 -- notify email, success message, redirect page slug
  status text NOT NULL DEFAULT 'active',                -- active | disabled
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, key)
);
CREATE TABLE IF NOT EXISTS store_form_submissions (     -- reference: business_leads
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES store_forms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL, -- signed-in shopper, if any
  name text, email text, phone text, message text,
  data jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'new',                   -- new | read | archived | spam
  source_url text, ip_hash text, user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS store_form_submissions_store_created_idx ON store_form_submissions (store_id, created_at DESC);
-- RLS enabled, no policies (public submissions go through a server action, never the anon key).
```

### 11.7 `0055_store_cms.sql`

```sql
CREATE TABLE IF NOT EXISTS cms_collections (            -- reference: cms_collections
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'custom',                  -- custom | blog | faq | …
  name text NOT NULL, slug varchar(128) NOT NULL, description text, icon text,
  fields jsonb NOT NULL DEFAULT '[]', primary_field_key text, slug_field_key text,
  settings jsonb NOT NULL DEFAULT '{}', is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);
CREATE TABLE IF NOT EXISTS cms_items (                  -- reference: cms_items
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES cms_collections(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  slug varchar(200) NOT NULL,
  status text NOT NULL DEFAULT 'draft',                 -- draft | published | archived
  data jsonb NOT NULL DEFAULT '{}', seo jsonb NOT NULL DEFAULT '{}',
  published_at timestamptz, order_index integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (collection_id, slug)
);
CREATE INDEX IF NOT EXISTS cms_items_store_collection_status_idx ON cms_items (store_id, collection_id, status, order_index);
CREATE TABLE IF NOT EXISTS cms_item_revisions (         -- reference: cms_item_revisions
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES cms_items(id) ON DELETE CASCADE,
  data jsonb NOT NULL, reason text NOT NULL DEFAULT 'manual',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Integrity trigger: cms_items.store_id must equal its collection's store_id.
-- RLS enabled, no policies.
```

### 11.8 `0056_store_integrations.sql`

As described in §9.1, keyed by **`store_id`** with `UNIQUE (store_id, provider)`. Also store `seller_id` for ownership checks and audit. Secrets are encrypted in the application.

### 11.8b `0057_store_shipping.sql` (§8.7)

```sql
CREATE TABLE IF NOT EXISTS store_shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name jsonb NOT NULL,                                  -- {ar, en}
  governorates text[] NOT NULL,                         -- canonical keys from packages/lib/src/shipping (governorate.lib.ts)
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  per_kg_surcharge numeric(10,2) NOT NULL DEFAULT 0 CHECK (per_kg_surcharge >= 0),
  free_over numeric(10,2),                              -- NULL = never free
  delivery_days_min integer NOT NULL DEFAULT 1, delivery_days_max integer NOT NULL DEFAULT 3,
  cod_enabled boolean NOT NULL DEFAULT true,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (delivery_days_max >= delivery_days_min)
);
CREATE INDEX IF NOT EXISTS store_shipping_zones_store_idx ON store_shipping_zones (store_id);
-- A governorate may belong to only one enabled zone per store: enforced in the app (and by a
-- constraint trigger checking overlap of governorates arrays among enabled zones of the same store).
-- RLS enabled, no policies.
```

Store-level shipping rules (method `tallaby | own`, handling days, store-wide free-over offer) live in `stores.settings.shipping` (Zod-validated). Payment method settings and details live in `stores.settings.payments` (§8.6). Neither needs its own table.

### 11.9 `0059_seller_platform_fee.sql` (P6-02)

```sql
ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS fee_plan text NOT NULL DEFAULT 'standard_2pct_min5',
  ADD COLUMN IF NOT EXISTS fee_trial_eligible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fee_trial_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS fee_trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS fee_plan_effective_at timestamptz;
-- CHECK fee_plan IN ('standard_2pct_min5')   -- one plan now; per-service fees later (D1)
-- CHECK (fee_trial_started_at IS NULL) = (fee_trial_ends_at IS NULL)
```

- `fee_plan` (what Tallaby charges per order) is separate from `plan` (the subscription tier that sets limits). Both live on the seller account.
- **D1 (decided):** every seller, old and new, moves to `standard_2pct_min5`. Only orders **placed after the switch-over** use it. Existing orders keep their 5% snapshots. The switch-over moment is recorded in `fee_plan_effective_at`. Old sellers do **not** get the trial (D5).
- `fee_trial_eligible = true` is set by signup for every new seller (D5). The trial is **per seller account**. A second or third store does not start a new trial (D25).
- Trial dates are written once: `UPDATE sellers SET fee_trial_started_at = now(), fee_trial_ends_at = now() + interval '30 days' WHERE id = :id AND fee_trial_eligible AND fee_trial_started_at IS NULL` (trigger events in §13.5).
- `sellers.commission_rate` becomes legacy (no longer read by order placement; kept, not dropped). `is_commission_exempt` stays an admin override (fee 0). **[Assumption]** Confirm with the owner (D12b).

### 11.10 `0060_store_wallet.sql` (P6-05, needs approval before applying)

This upgrades the existing seller ledger into the store wallet (D10). It is **one wallet per seller account**, shared by all of that seller's stores. It adds to and hardens what exists; nothing is dropped or renamed.

```sql
-- 0. Read-only pre-checks (run first; STOP and report if any return rows):
--    duplicate sale rows per (seller_id, order_id); sellers whose seller_wallet.balance
--    differs from sum(wallet_transactions.amount) or from sellers.wallet_balance.

-- 1. Enum values (each ADD VALUE commits separately; app must not use them in the same tx)
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'top_up';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'service_charge';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'adjustment';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'fee_reversal';
-- existing: sale, refund, withdrawal, fee

-- 2. Wallet row per seller, signed balance (no balance >= 0 CHECK — negative is allowed by design)
ALTER TABLE seller_wallet
  ADD COLUMN IF NOT EXISTS status wallet_status NOT NULL DEFAULT 'active',   -- enum exists (0025)
  ADD COLUMN IF NOT EXISTS negative_limit numeric(10,2);                      -- NULL = no limit (D21)
INSERT INTO seller_wallet (seller_id, balance, currency)
  SELECT s.id, COALESCE(s.wallet_balance, 0), 'EGP' FROM sellers s
  WHERE NOT EXISTS (SELECT 1 FROM seller_wallet w WHERE w.seller_id = s.id);

-- 3. Ledger hardening
ALTER TABLE wallet_transactions
  ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE SET NULL,  -- per-store reporting
  ADD COLUMN IF NOT EXISTS reference_type text,     -- 'order' | 'top_up' | 'ad_request' | 'theme' | 'payout' | 'admin'
  ADD COLUMN IF NOT EXISTS reference_id text,
  ADD COLUMN IF NOT EXISTS balance_before numeric(10,2),
  ADD COLUMN IF NOT EXISTS balance_after numeric(10,2),
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id) ON DELETE SET NULL;
-- CHECK (reference_type IS NULL) = (reference_id IS NULL)
-- CHECK (balance_before IS NULL OR balance_after = balance_before + amount)
CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_reference_once
  ON wallet_transactions (seller_id, type, reference_type, reference_id)
  WHERE reference_type IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_sale_once        -- legacy rows (no reference)
  ON wallet_transactions (seller_id, order_id) WHERE type = 'sale' AND reference_type IS NULL;
-- Append-only trigger rejecting UPDATE/DELETE (pattern from user_wallet_transactions, 0025).
-- RLS: SELECT-only owner policy (seller_id = auth.uid()) or none — confirm current state in P0-04.

-- 4. Store-wallet top-ups (wallet_top_ups is FK-bound to user_wallets, so it cannot be reused)
CREATE TABLE IF NOT EXISTS seller_wallet_top_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'EGP' CHECK (currency = 'EGP'),
  status wallet_top_up_status NOT NULL DEFAULT 'pending',              -- enum exists (0025)
  provider text NOT NULL DEFAULT 'kashier',
  provider_reference text,          -- e.g. Kashier merchantOrderId "stopup_<uuid>"
  provider_transaction_id text,
  transaction_id uuid REFERENCES wallet_transactions(id) ON DELETE SET NULL,
  failure_reason text, metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS seller_wallet_top_ups_provider_txn
  ON seller_wallet_top_ups (provider, provider_transaction_id) WHERE provider_transaction_id IS NOT NULL;
-- RLS enabled, no policies.
```

`sellers.wallet_balance` stays as a mirror that the primitive updates in the same transaction, because existing readers (admin, dashboard) use it.

### 11.11 Supabase readiness (task P1-06)

Everything the Supabase project needs before builder work starts:

1. **Environment.** Apply every migration first to a **Supabase branch** (the Supabase MCP has `create_branch` / `apply_migration` / `merge_branch`) or a local stack. Never apply to production first. Check that point-in-time recovery or a fresh backup exists before the production apply. Production applies need the owner's approval (§0 rule 11).
2. **Verification after each migration:**
   - Run the Supabase **security and performance advisors** (`get_advisors`) and fix new warnings, e.g. RLS disabled or unindexed foreign keys.
   - Run `list_tables` to confirm the shape.
   - Run the backfill checks: every seller has exactly one primary store; `stores.subdomain` equals `sellers.subdomain` for primary stores; every active custom domain and redirect has a `store_id`; storefront carts and orders have a `store_id`.
3. **RLS posture.** RLS is enabled on every new table. No policies for server-only tables (Drizzle runs as the owner and authorizes itself). Policies only where the browser talks to Supabase directly, which today is **Storage uploads**. Also re-check existing policies (F13) and report.
4. **Storage.** Create the `store-media` bucket with size and MIME limits and path-prefix policies (§11.5). Confirm the existing buckets' policies (`sellers`, `products`, `avatars`, `digital-products`) in P0-04. Template thumbnails go in a `templates` bucket, written by admins only (server-side with the service role).
5. **Indexes.** A btree index on every FK column used in WHERE clauses (all `store_id`, `seller_id`, `collection_id`, `form_id`). **No GIN indexes on page jsonb** (the reference has them, but Tallaby never queries inside drafts). Add them only if a query needs one.
6. **Size guards.** App-level limits: page draft ≤ 1 MB, revision snapshot ≤ 5 MB, form submission ≤ 32 KB, CMS item ≤ 256 KB. Validate before writing.
7. **Integrity triggers.**
   - `store_products` and `cms_items` store-ownership consistency.
   - Append-only `store_site_revisions` and `wallet_transactions`.
   - `stores.updated_at` touch triggers, if the project uses them (check the existing pattern).
8. **Drizzle mirror.** Add all tables to `schema.ts` and `relations.ts` (stores ↔ seller, pages, revisions, design system, forms, cms, media, integrations). Export them from `@workspace/db`. Run `pnpm typecheck` across apps.
9. **Seeds.** The Tallaby Classic template row and version (P4-03 script). No demo data in production.
10. **Docs.** Add `docs/store-builder.md` (data contract) and update `PROJECT.md` §4.

### 11.12 Not creating (and why)

- `organizations`, `store_memberships`, `project_members`: the seller account owns its stores; staff/team access is deferred (D11).
- Valorcy commerce tables (`store_orders`, `store_carts`, `store_wallets`, `store_coupons`, …): Tallaby commerce and the upgraded seller ledger already cover these.
- `cms_api_keys`, AI tables (`ai_*`, `generation_*`), chatbot, bookings, website auth/users tables: not in scope.
- `subscription_plans`, `seller_subscriptions`: later, when paid plans exist. `sellers.plan` + code limits cover Free now.
- A separate fee ledger or a new wallet system: the fee is snapshotted in `order_items` and posted to the upgraded seller ledger. `user_wallets` is not reused (it forbids negative balances and is per user).

### 11.13 Rollback and compatibility

- Builder, CMS, forms, media, template and integration tables can be dropped without affecting existing features. The storefront falls back to the legacy path when a store has no published revision.
- The `stores` backfill is additive. The legacy columns (`sellers.subdomain`, `carts.store_seller_id`, seller-keyed custom domains and redirects) keep being written during the transition, so reverting the code keeps working. Rollback = revert code, then drop the new columns and tables (no data loss in pre-existing columns).
- The fee switch-over changes money for every seller (D1, approved). Rollback is a code revert: the 5% constant returns for new orders. Already-placed orders keep their snapshots.
- The store-wallet migration only adds columns, indexes, enum values and one table. Rollback drops the new table and indexes. The added enum values stay unused (Postgres cannot drop enum values).

---

## 12. Draft, publish and rendering lifecycle

All steps are **per store**. Every function takes `(sellerId, storeId)` and checks `stores.seller_id = sellerId` before anything else.

| # | Step | Mechanism [Proposed] |
|---|---|---|
| 1 | Editor state initialised | `getStoreForEditor(sellerId, storeId)`. If the store has no `store_pages` yet (backfilled or brand-new store), seed draft pages idempotently from the default template's current version, filled with the store's data (logo, banner, description). The live storefront is unchanged until publish |
| 2 | Editor loads the store | Load the store + `store_design_systems` + `store_pages`. `migrateSiteConfig(raw, fromVersion)` upgrades older drafts in memory; the upgraded draft is saved on the next autosave |
| 3 | Product sections reference products | IDs and query descriptors only. Resolved at render with the store's catalog rules (§10.1). Missing products are skipped on the public site and flagged in the editor |
| 4 | Drafts persisted | `saveStorePageDraft(sellerId, storeId, pageId, content, clientVersion)` validates with the `SiteConfig` page schema (Zod) and sanitizes rich text. `UPDATE store_pages SET draft_content, draft_version = draft_version + 1 WHERE id = :pageId AND store_id = :storeId AND draft_version = :clientVersion RETURNING`, behind the ownership check. Zero rows means conflict → "reload" banner |
| 5 | Publish validates and snapshots | `publishStoreSite(sellerId, storeId)` in one transaction: lock the `stores` row (`FOR UPDATE`); build the `SiteConfig` from drafts + design system + header/footer + store settings; validate strictly (schema version, allowed section ids and versions, allowed node types, product ids belong to the store's catalog, media paths belong to the seller, form and CMS references belong to the store, URLs limited to http/https/mailto/tel); insert `store_site_revisions` with `revision_number = max + 1`; update `stores` (`published_revision_id`, `site_status = 'published'`, `last_published_at`, `first_published_at = COALESCE(first_published_at, now())`); call `startFeeTrialIfNeeded(tx, sellerId, 'publish')` (§13.5); commit; then `applyInvalidation` |
| 6 | Public storefront renders the published version | `getPublishedStoreSite(storeId)` reads `stores.published_revision_id` → the snapshot (cached by tag). The shared renderer in public mode renders server components where possible, and client islands for cart, carousels and forms |
| 7 | Safe cache invalidation | Tags for this store only (§10.6). Never path-based purges across all stores |
| 8 | Older configurations | Each snapshot stores `schema_version`; each section instance stores its `version`. The renderer runs read-only migrations (`migrateProps`) at render time, so old revisions render without being rewritten. Unknown section ids render nothing (logged) and never throw |
| 9 | Default template available | `tallaby-classic` stays in `templates` with `is_default`. Stores without a published revision use the legacy code path, which is the same design |
| 10 | Changing template preserves data | `applyTemplate` changes only this store's drafts (§8.1). Products, orders, settings, domains, integrations, forms, CMS and other stores are never touched. Publish is explicit. Previous revisions remain restorable |

Unpublish ([Proposed], P4-04): sets `site_status = 'unpublished'` and keeps `published_revision_id`. The storefront falls back to the default theme (D7 behaviour). This does **not** reset `first_published_at` or the seller's trial dates, so the trial is never restarted.

---

## 13. Platform fee, trial and store wallet

### 13.1 Agreed rules (do not change without the user)

- Account and store creation are free. No wallet deposit is required to register, create a store, publish or sell.
- **New sellers** get 30 days with no platform fee, starting when the store first goes live (§13.5). The trial is not restarted by republishing, unpublishing, changing templates or retried callbacks. **Existing sellers do not get a trial** (D5).
- **Fee for every seller, old and new, on every order** (D1): **fee = max(EGP 5, 2% × eligible subtotal)** per successful order, per seller. Shipping is excluded. Payment-provider fees and fulfillment charges are separate. Per-service fees (fulfillment, ads, themes…) will be designed later. The plan keeps one fee plan key so more can be added.
- Examples (tests must cover these): EGP 100 → 5.00; EGP 250 → 5.00; EGP 500 → 10.00; EGP 1,000 → 20.00. Edge cases: 250.00 → exactly 5.00; 251.00 → 5.02; 0 → 0 (no order).
- Each seller has a **store wallet** that can be positive or negative. It updates automatically. Sellers can top it up at any time (Kashier first) to cover fees and future paid services (product ads, theme store, …) (D10).
- **Refunds are deferred** (D3). They will be handled together with the Kashier integration work. Until then, refunds keep today's behaviour, and no automatic wallet or fee adjustment is built.

### 13.2 Calculation [Proposed] (P6-01)

`packages/lib/src/orders/platform-fee.lib.ts`:

```ts
// All amounts in integer piastres (1 EGP = 100).
export const STANDARD_FEE_RATE_BPS = 200;      // 2.00%
export const STANDARD_FEE_MIN_PIASTRES = 500;  // EGP 5
export function computePlatformFeePiastres(eligibleSubtotalPiastres: number): number {
  if (eligibleSubtotalPiastres <= 0) return 0;
  const pct = Math.round((eligibleSubtotalPiastres * STANDARD_FEE_RATE_BPS) / 10_000); // half-up for positives
  return Math.max(STANDARD_FEE_MIN_PIASTRES, pct);
}
```

**Eligible subtotal (D2, plain-language explanation).** This is simply *"which amount do we take the 2% of?"*. Everyone agrees on "product prices, not shipping". The open part is **discounts**. Take a product listed at EGP 100:

| Case | Customer pays for the product | Seller gets for the product | Recommended fee base |
|---|---|---|---|
| No discount | 100 | 100 | 100 → fee 5 |
| **Seller's own coupon** (seller gives 20 off) | 80 | 80 | **80** (what the seller actually sold for) |
| **Tallaby coupon** (Tallaby pays the 20) | 80 | 100 (Tallaby covers the gap) | **100** (the seller still sold for 100) |

The plan uses this recommendation (fee on the seller's real selling price after the seller's own discounts) until the owner says otherwise. It matches how `place-order.ts` already computes commission on seller-coupon lines. One more edge case: if the fee would be more than the eligible subtotal (an order worth under EGP 5), the fee is capped at the subtotal.

- **Per seller per order.** A marketplace order with products from 3 sellers creates 3 fees, each with its own EGP 5 minimum, because each seller is charged on their own part. **[Assumption]** Confirm (D22).
- The fee is split across that seller's lines in proportion to their totals, using the existing `allocateDiscountAcrossLines` (`coupon-scope.lib.ts`), so `sum(line.commissionAmount) == fee` exactly.
- Per line: `commissionAmount` = the line's share, `commissionRate` = effective rate (display only), `sellerEarning = total − commissionAmount`, and `metadata.platformFee = { plan, rateBps, minPiastres, eligiblePiastres, feePiastres, trial, exempt, computedAt }` for audit.
- Trial: the trial is active if the order's `created_at` is within the seller's trial window (D4, recommended) → fee 0, `trial: true`. `is_commission_exempt` → fee 0, `exempt: true`.
- Orders placed before the switch-over (`fee_plan_effective_at`) keep their 5% snapshots. Snapshots are never recomputed.

### 13.3 When the fee is earned

- At order placement the fee is only **calculated and snapshotted** (pending).
- At **delivery** (the moment `creditSellerOnDelivery` runs today, from the shipping app and the seller's own shipment updates, and after P6-05 also from the admin "delivered" status) the fee becomes **earned** and is posted to the store wallet.
- Cancelled or never-delivered orders never post anything, so no fee is charged.
- Webhook retries cannot duplicate anything: payment webhooks don't post wallet entries, and delivery entries have unique references.

### 13.4 Store wallet [Proposed] (D10)

**One wallet per seller, built on the existing seller ledger** (`seller_wallet` + `wallet_transactions`, upgraded by `0060`, §11.10). Entries carry an optional `store_id` so each store's earnings and fees can be reported separately. It is not a parallel system and does not reuse `user_wallets`, whose CHECK constraints forbid negative balances and which is per user, not per store.

**Primitive.** `packages/db/src/wallet/store-wallet.ts` [Proposed], modelled on `user-wallet.ts`:

- `postStoreWalletEntry(tx, { sellerId, type, amount /* signed decimal string */, referenceType, referenceId, orderId?, description, metadata?, createdBy? })`.
- It is a single `UPDATE seller_wallet SET balance = balance + :amount WHERE seller_id = :id AND status = 'active' [AND negative-limit guard for debits that are allowed to be refused] RETURNING balance`, then an `INSERT` into the ledger with `balance_before` / `balance_after`, then the `sellers.wallet_balance` mirror. It runs in the caller's transaction.
- The unique reference index makes replays fail safely (`DuplicateStoreWalletEntryError` → treated as "already applied").
- It is the **only** code allowed to change a store balance. `creditSellerOnDelivery` is rewritten on top of it.

**Automatic entries.** New orders, after the switch-over:

| Event | Entries | Reference |
|---|---|---|
| Order delivered, **Tallaby collected the money** (online payment or Tallaby rider cash on delivery) | `sale` + (seller's share of goods = Σ line `total`); `fee` − (platform fee, 0 in trial) | `order:<orderId>` (one `sale` and one `fee` per seller) |
| Order delivered, **seller collected the money** (seller riders / seller delivery) | `fee` − only. No `sale`, because the seller already holds the cash | `order:<orderId>` |
| Seller tops up (Kashier) | `top_up` + | `top_up:<topUpId>` (webhook-confirmed only) |
| Seller buys a product ad package / theme / future service | `service_charge` − | `ad_request:<id>`, `theme:<id>` … |
| Payout to the seller (positive balance) | `withdrawal` − | `payout:<sellerPayoutId>` |
| Admin correction | `adjustment` ± with a required reason | `admin:<uuid>` |
| Refunds | **Deferred (D3)**. Enum values `refund` / `fee_reversal` are reserved for that work | — |

- **Who collected the money** is decided from data that already exists. Seller-owned manual methods (Vodafone Cash, e& Cash, WE Pay, Orange Cash, InstaPay, §8.6) set `orders.metadata.paymentCollector = 'seller'`, which always means fee-only. Otherwise: the order's payment method/status plus whether the shipment was delivered by a Tallaby rider or by the seller (`shipments` / `seller_riders`, `resolveEffectiveFulfillment(...).delivery`). Put this in one helper, `resolveCollectionParty(order, shipment)`, with tests.
- **Legacy compatibility:** orders delivered before the switch-over keep the existing single net `sale` row. New orders use the gross `sale` + separate `fee` model. Both appear correctly in the history because each row stands alone.

**Negative balance policy.** **[Decision] D21.** Recommended:

- Fees are **always** posted, even if this takes the balance below zero. Fees are never refused.
- Optional service purchases (ads, themes) paid from the wallet need `balance − price ≥ −negative_limit`.
- The dashboard shows a warning banner below zero and a stronger one past a threshold.
- Positive balances from later `sale` entries automatically pay off a negative balance (same ledger).
- Payouts are only allowed from a positive available balance.
- No automatic store suspension. Admins see negative wallets in the admin list and decide.

**Top-ups.** Kashier first (P6-09, P6-10):

1. The dashboard creates a `seller_wallet_top_ups` row (`pending`) and a Kashier payment with `merchantOrderId = "stopup_<uuid>"`.
2. The seller pays on Kashier.
3. The Kashier webhook (`apps/backend/src/routes/kashier.ts`, signature verified by the existing `kashier.lib.ts`) recognises the `stopup_` prefix and claims the top-up (`UPDATE … WHERE status IN ('pending','processing')`).
4. It checks that the paid amount equals the recorded amount.
5. It calls `postStoreWalletEntry(type='top_up')` in the same transaction.

The client can never mark a top-up as paid. The same idea is already proven for user wallets with Paymob (`apps/backend/src/lib/wallet-top-up.ts`, `docs/wallet.md` §6). Paymob top-ups can be added later with the same table (`provider = 'paymob'`).

**Ads paid from the wallet.** `ad_campaign_requests` today records Vodafone Cash payments. Add a `wallet` payment method option where submitting the request posts a `service_charge` (reference `ad_request:<id>`). Rejection by an admin posts a compensating `adjustment` (refund of the charge) until the refunds work replaces it. Vodafone Cash stays available.

### 13.5 Trial lifecycle (P6-03, P6-07)

- **Eligibility (D5, decided):** all new sellers (`fee_trial_eligible = true` at signup). Existing sellers are not eligible. Admins may grant eligibility manually before a trial starts.
- **Start.** The brief says "when the seller first publishes". Under D7 a new seller's store is live from signup, and they can sell as soon as they add a product even if they never open the builder. If the trial started only on a builder Publish, a seller who never uses the builder would never start the trial, and so would never pay fees. **Recommended rule ([Decision] D20):** the trial starts at the **first of** (a) the first builder Publish, or (b) the first moment the seller has an active product (store becomes sellable). Implement one function, `startFeeTrialIfNeeded(tx, sellerId, trigger)`, using the conditional update in §11.9. The trial is per **seller account**: the first store to go live starts it, and later stores do not start a new one (D25). Call it from `publishStoreSite` and from the product-status transitions to `active` (dashboard product actions and admin product approval). Changing the rule then only means changing which callers run it.
- **Status helper:** `isTrialActive(seller, at)` is used by checkout, dashboard and admin.
- **Notifications:** daily cron (pattern: `apps/ecommerce/vercel.json` crons) sends a dashboard notification and an email at T-7 and T-1 days. Idempotent through the `email_deliveries` unique claim. A dashboard banner shows the days left.

---

## 14. Checkout, wallet and ledger compatibility

| Area | Rule |
|---|---|
| `placeOrderFromCart` | Keep the single pipeline. Replace the hard-coded 5% with `computePlatformFeePiastres` per seller group for **all** order sources (D1), applying trial and exemption. The rest of the order calculation (shipping, discounts, totals, stock, coupons, affiliates) must produce identical results. Prove it with a snapshot test that compares everything except the commission fields |
| Coupons | Seller-funded coupon recomputation (lines ~449–466) must call the same fee function on the net totals, then re-split |
| Customer wallet payments | Untouched (`user_wallets`, `docs/wallet.md`). The customer wallet and the store wallet are separate ledgers |
| Affiliates | Untouched (`createPendingAffiliateCommission` uses the order subtotal) |
| Paymob/Kashier order webhooks | Untouched. They change payment status only. Store-wallet entries are posted at delivery with unique references, so payment retries cannot duplicate fees. The Kashier webhook gains a `stopup_` branch for store-wallet top-ups (P6-10) |
| Delivery credit | `creditSellerOnDelivery` is rewritten on `postStoreWalletEntry` (gross `sale` + `fee`, or `fee` only when the seller collected the cash) and called from all three delivered paths (shipping app, seller shipment, admin) |
| Refunds | Deferred (D3). Existing refund flows keep working unchanged and post no store-wallet entries yet |
| Payouts | `seller_payouts` remain. Completing a payout posts a `withdrawal` entry. Payouts require a positive balance |
| Reporting | The dashboard store-wallet page shows balance (it can be negative), entries, fee per order, trial status and a top-up button. Admin shows balances (including negative), fee totals and wallet adjustments |
| Money types | Keep `numeric(10,2)` columns. Compute in integer piastres and format with `formatDecimal` |

---

## 15. Optional fulfillment (Phase 8)

- Signup no longer creates fulfillment rows. Baseline behaviour is automatic (`resolveEffectiveFulfillment`).
- **New dashboard flow** "Tallaby Fulfillment" (reuse the route `apps/dashboard/app/(main)/settings/fulfillment/`):
  - Explains the services.
  - Lets the seller **request** services. This writes only `requested_*` through a new server function that reuses `fulfillmentRequestSchema` and `createSellerFulfillmentSetup` (or an "upsert request" variant for sellers who already have rows).
  - Shows request status.
  - Activation stays admin-only (`activateSellerService`), as documented.
- Move or reuse the onboarding step UI (`apps/ecommerce/components/onboarding/steps/fulfillment-step.tsx`, `fulfillment-choices.lib.ts`) into the dashboard. Do not rebuild it.
- Billing stays separate from the platform fee. Agreement rates become `wallet_transactions` of type `fee` with a fulfillment-specific description/reference, never mixed into `order_items.commission_amount`. This is deferred, per `docs/fulfillment.md` §5.
- Publishing a store **never** requires fulfillment.

---

## 16. Marketing website and positioning

Current state [Verified]: `tallaby.com`/`www.tallaby.com` is the marketplace home (`apps/ecommerce/app/[locale]/(main)/page.tsx`). The seller landing page is `/sell` (`sell/page.tsx` + `sell.chunks.tsx`, copy in `messages/*.json` → `pages.sell`). It currently promotes free signup, "commission only when you sell", a fulfillment-choice board, a 4-step "about 10 minutes" process, and a requirements list that includes legal documents.

Required content changes (Phase 10 content tasks; **do not ship claims before the features exist**):

1. **Three clearly separated offers:** (a) build and run your own store at `yourstore.tallaby.com` or your domain; (b) also sell on the Tallaby marketplace; (c) optional Tallaby Fulfillment.
2. Replace "Commission only when you sell" details with the agreed fee (2%, min EGP 5, shipping excluded) and the 30-day no-fee period for new sellers from the store going live (§13.5), plus the store wallet and top-ups once they ship.
3. Replace the "10 minutes" step list with: choose your store address → create account → you're in your dashboard. Move fulfillment to an "optional services" section.
4. Show the builder and template gallery only after Phase 4–5 ship. Integrations only for those actually live.
5. Update `MARKETING_PROJECT.md` ("5% by default", lines ~186, 809) after decisions. That file had uncommitted user edits at audit time and was **not** modified by this plan.
6. Domain repositioning (`tallaby.com` → seller landing, marketplace → `store.tallaby.com`) is Phase 10. Per D8 it waits until the Tallaby Fulfillment service work. It needs 301 maps for every marketplace URL, sitemap/canonical updates (`SITEMAP_BASE_URL`, `NEXT_PUBLIC_SITE_URL`), Meta catalog feed URLs, OAuth redirect allow-lists in Supabase, email links, the dashboard `STOREFRONT_URL`, and Search Console migration.

---

## 17. Security and tenant isolation

| Control | Requirement |
|---|---|
| Tenant authorization | Every dashboard action derives `sellerId` from `supabase.auth.getUser()` + `getSellerAccess`. Every store-scoped action takes `storeId` and runs `requireStore(storeId)`, which checks `stores.seller_id = sessionSeller AND deleted_at IS NULL`. **Never** trust `sellerId`, page, revision, form, CMS item, media or integration ownership from the client. Every child-table query also filters by `store_id`. Hiding UI is not authorization |
| Plan limits | Enforced server-side (`createStore` locks the seller row and counts stores). The UI count is display only. Admin plan changes are audited |
| Seller status | Builder writes and publish require `approved` (restricted sellers may edit but not publish, [Assumption] A5). Suspended sellers' stores → 404 |
| RLS | RLS enabled on every new table, with no policies (server-only), matching `0044`/`0048`. Policies exist only for direct browser access (Storage uploads to `store-media`, path prefix = `auth.uid()`). P0-04 checks live policies on `products` (F13), `orders`, `users`, and the existing Storage buckets, and reports. Changing existing policies needs approval |
| Service role | `SUPABASE_SERVICE_ROLE_KEY` only in server code (`packages/db/src/supabase/service.ts`). Never in `NEXT_PUBLIC_*` or client bundles |
| OAuth / signup | Signed httpOnly intent cookie; `safeNextPath`-style redirect validation (pattern in `apps/ecommerce/lib/auth-handoff.server.ts`); idempotent `ensureSellerAccount`; no account linking in app code |
| Subdomains | DB unique + CHECK on `stores.subdomain`, reserved list, redirects reserved per store, rate-limited availability check |
| Draft vs published | Public code paths read only `store_site_revisions` via `stores.published_revision_id`. Preview uses HMAC-signed, short-lived (≤15 min) tokens bound to `storeId`, rendered `no-store` + `noindex` |
| Cache isolation | Cache keys and tags include `storeId`. Never read `cookies()`/`headers()` inside cached functions |
| Content safety | Section allow-list; no `customCode`; rich-text sanitizer server-side; URL schemes limited to `http`, `https`, `mailto`, `tel`, `whatsapp`; images only from `store-media` / existing Tallaby buckets / the allow-list (`apps/dashboard/lib/image-hosts.ts`) |
| Payment details | Store payment destinations (wallet numbers, InstaPay IPA/IBAN) are validated, snapshotted per order, audit-logged on change with an email to the seller, rate-limited, never logged in full. Checkout rejects methods the store has not enabled. Only the store owner confirms seller-collected payments |
| Forms | Public submissions only through a server action that resolves the store from the host. Honeypot + rate limit, field validation against the form definition, IP stored hashed, no anon insert policy, PII visible only to the owner |
| Integrations | Secrets AES-256-GCM encrypted app-side; never logged; never sent to the client (UI shows "connected" + last 4 characters); IDs regex-validated; scripts from fixed templates; per store |
| Webhooks | Existing HMAC verification (Paymob) and status-guarded claims stay. Kashier signature verification for store-wallet top-ups. New crons use a secret header (pattern: `/api/cron/custom-domains`) |
| Rate limiting | Signup, subdomain check, create store, publish (e.g. 10/min/store), form submissions, integration connect |
| Ledger / store wallet | Only `postStoreWalletEntry` moves a store balance; unique reference claims; append-only entries; top-ups credited only by a signature-verified Kashier webhook with an amount check; single transaction for publish + trial start; no client path can change fees, balances, plan or trial dates |
| Migrations | Additive only; idempotent; applied to a Supabase branch first with advisors checked; backup before production (§11.11) |

**Mandatory isolation tests** (P1-05, extended in later phases). Sellers A and B; A owns stores A1 and A2:

1. A cannot load B's store in the editor, or any of B's page/revision/form/CMS/media ids.
2. A cannot save a draft to B's page id, nor to A1's page id while passing `storeId = A2` (cross-store mismatch → 0 rows).
3. A cannot publish B's store or restore B's revision.
4. A1's product section containing B's product ids renders none of them. With `catalog_mode = 'selected'`, A2 shows only its selected products, and adding an unselected product to A2's cart is refused.
5. Drafts never appear on any public host before publish. A1's published site never appears on A2's host.
6. B's host (and A2's) never renders A1's integrations/pixels. The marketplace host renders no store pixels.
7. A cannot read or modify B's integrations (and never sees decrypted secrets).
7b. A cannot read B's store wallet, create a top-up for B, or pay for a service from B's wallet.
8. A preview token for A1 does not render A2 or B. Expired or tampered tokens are rejected.
9. Cache: publishing A1 invalidates only A1's tags.
10. A form submission on A1's host cannot target A2's or B's form id.
11. Creating a 4th store on the Free plan fails, including 2 concurrent creates at count 2 (exactly one succeeds).
12. Storage: A cannot upload to `store-media/{B's id}/…`.
13. A cannot confirm payment for, or read the payment details snapshot of, B's orders. A2's checkout never shows A1's wallet numbers.
14. A1's shipping zones never price an A2 or marketplace order.

---

## 18. Testing and rollout

### 18.1 Commands (verified from package scripts)

| Purpose | Command |
|---|---|
| All lint | `pnpm lint` |
| All typecheck | `pnpm typecheck` |
| All unit tests | `pnpm test` |
| One app | `pnpm --filter dashboard test` / `pnpm --filter ecommerce test` / `pnpm --filter dashboard typecheck` |
| Packages | `pnpm --filter @workspace/lib test`, `pnpm --filter @workspace/db test`, `pnpm --filter @workspace/cache test` |
| DB integration tests | set `TEST_DATABASE_URL` (see header of `packages/db/src/wallet/user-wallet.integration.test.ts`), then `pnpm --filter @workspace/db test` |
| Sitemap audit | `pnpm --filter ecommerce audit:sitemap` |
| Build | `pnpm build` (concurrency 2) |

There is no E2E runner and no CI ([Decision] D15). Recommendation: add Playwright (the reference project has `playwright.config.ts` and a suite to learn from). Until then, every phase ships with a written manual E2E checklist (below) that is run and recorded in this file.

### 18.2 Test plan by area

| Area | Tests |
|---|---|
| Baseline (P0-03) | Record current `lint`/`typecheck`/`test` results per package before any change |
| Signup | Unit: slug validation and availability; `ensureSellerAccount` idempotency (call twice, concurrent calls → one seller, one primary store); `createStore` plan limit (3) incl. concurrency; intent cookie sign/verify/expiry. Integration (DB): unique violation → "taken". Manual E2E: email signup < 60 s; Google signup; retry callback; existing customer becomes seller |
| Isolation | §17 list (integration tests against a test DB) |
| Multi-store / plans | Backfill checks (§11.11.2); `createStore` limit incl. concurrency; cross-store id mismatch rejected; store switcher never changes the target of a write; archived store → 404 |
| Builder | Unit: `SiteConfig` schema, migrations, sanitizer, allowed nodes, applyTemplate non-destructive merge, publish validation. Integration: optimistic concurrency, atomic publish (simulate failure mid-transaction), revision restore |
| Storefront | Host → store resolution for every existing subdomain/redirect/custom-domain case; legacy path renders identically for backfilled primary stores (screenshot/DOM comparison of `/`, `/products/[slug]`, `/cart`); published path renders sections; unknown section skipped; host robots/sitemap; metadata/canonical per host; custom domain path |
| Commission & trial | Unit: fee table (§13.1) + rounding + allocation sums; trial boundary (order at `ends_at − 1s` vs `+1s`); exempt sellers; seller-funded coupon path. Integration: first publish sets trial once (publish twice, unpublish, republish); concurrent publishes; store-wallet posting idempotency (double call / concurrent), negative balances, collection-party rules, Kashier top-up webhook replay and amount mismatch. Refund adjustments deferred (D3) |
| Checkout/webhooks | Paymob webhook replay does not change fees; marketplace order commission unchanged (snapshot test against current output) |
| Fulfillment regression | `packages/lib/src/fulfillment/*.test.ts` stay green; new seller without fulfillment rows gets baseline in `resolveEffectiveFulfillment`; shipping app flows unchanged |
| SEO/perf | Lighthouse on a storefront (classic vs published); cache hit after publish; no `cookies()` in cached functions |

### 18.3 Rollout

1. **Internal:** feature-flag the Website Design and Apps groups with an allow-list (`STORE_BUILDER_SELLER_IDS` env [Proposed]; no flag system exists). Signup changes ship behind a flag that switches the `/sell` CTA.
2. **Pilot:** 3–5 test sellers (including one with a custom domain, one Arabic-only store name, one with seller-collected cash on delivery). Run all manual checklists and watch logs.
3. **Gradual:** open signup to all. Builder for all new sellers. Existing sellers opt in from the dashboard (their storefront is unchanged until they publish).
4. **Rollback:** remove the flag, and sellers fall back to the legacy storefront (revisions stay in the DB). Rollback per §11.13.

---

## 19. Phases, dependencies and tasks

### 19.1 Dependency graph

```
P0 (audit, quarantine, decisions)
 └─▶ P1 (Supabase readiness: stores + backfill, builder/CMS/forms/templates/media tables, plans, site schema pkg, isolation harness)
      ├─▶ P2 (signup: account + primary store)  ──▶ P3 (store switcher, /stores, nav, checklist, store settings)
      ├─▶ P5-00 (host → store resolution; can ship right after P1 to prove the backfill)
      └─▶ P4 (builder port, sections pkg, classic template, editor, templates) ──▶ P5 (storefront render, SEO, cache)
P2 ──▶ P6 (fee for all sellers + store wallet + Kashier top-ups + trial)
          └─ only the "trial starts on builder Publish" hook (part of P6-03) waits for P4-04
P3 ──▶ P7 (integrations; storefront injection needs P5)
P1 ──▶ P8 (fulfillment request flow; independent of builder)
P5,P6,P7 ──▶ P9 (admin, security review, rollout)
P9 + D8 (after Fulfillment work) ──▶ P10 (domain repositioning + marketing content)
```

Order changes compared with the brief, and why:

- Phase 6 (fee, wallet, trial) can run **in parallel with the builder** right after signup (P2), because D1 makes the fee apply to all orders and D20 lets the trial also start on the first active product. Recommended: run P6 early, since it changes money for every seller and benefits from a longer pilot.
- Phase 8 can run in parallel after Phase 1.
- A new Phase 10 separates the risky domain move from the launch and waits for the Fulfillment work (D8).

### 19.2 Task format

Each task lists: **ID · Priority · Depends on**, then Files (existing → verified; new → [Proposed]), Requirements, DB/API, Security, Tests, Acceptance, Rollback.

---

### Phase 0 — Audit completion and architecture decisions

**Phase acceptance:**

- The remaining open decisions in §21.3 (especially D2, D20, D21, D22) are answered or explicitly accepted at their recommended default.
- The dashboard builds and typechecks with the untracked builder code quarantined.
- Baseline test results are recorded.
- Live-DB facts (F12, F13, F16) are confirmed.

**P0-01 · P0 · deps: —** Confirm the builder reference and finish the builder audit.
- Files: `apps/dashboard/components/website-builder/**`, `components/sections/**` (copied); `D:\programming projects\saas\apps\dashboard\{lib\builder,actions,components\forms,components\templates,app\[locale]\(public)\sites}\**` (read-only).
- Requirements: D9 is resolved (§5.1). Repeat the §5.3 dependency scan against the D: reference so every missing `@/…` module of the copy has a known source. Document `lib/builder/store.ts` actions, the migration framework, i18n/RTL, the AI boundaries, the forms renderer and the template install flow. Update §5 of this file.
- Tests: none (documentation).
- Acceptance: §5 lists the final source for every adapted file, and the remaining unknowns are zero or listed.

**P0-02 · P0 · deps: —** Quarantine the copied builder code so the dashboard compiles. **Ask the user before moving files.**
- Files: `apps/dashboard/tsconfig.json` (verified), the untracked directories in §2.9.
- Requirements: run `pnpm --filter dashboard typecheck` to confirm the expected breakage. Recommended: move the untracked import to a non-compiled location inside the repo (for example `reference/valorcy-builder/`, excluded by tsconfig/eslint, **committed** so it is not lost), or exclude the paths in `tsconfig.json` and the ESLint config. Do not delete anything.
- Acceptance: `pnpm --filter dashboard typecheck` and `pnpm --filter dashboard build` pass or are back to the pre-import baseline. The copied code is preserved byte-for-byte (`git diff --stat` shows a pure move).
- Rollback: move back.
- **Done 2026-10-17 (`4fcb815`).** Moved to `reference/valorcy-builder/apps/dashboard/…` (with a README and `.gitattributes * -text`). The SHA-1 of every file is identical before and after. The copy was **591 files**; the §2.9 estimate of ~935 was wrong. Dashboard `tsc --noEmit`: 1,501 errors before (all inside the copied dirs), 0 after. `pnpm --filter dashboard build` was not run (needs env). `lint` cannot run in any package (§23 baseline).

**P0-03 · P0 · deps: P0-02** Baseline verification.
- Requirements: run §18.1 commands. Record pass/fail per package in a new §23 "Baseline log" in this file. Do not fix unrelated failures. Note them.
- Acceptance: baseline recorded with date and commit.

**P0-04 · P0 · deps: —** Verify live platform facts (read-only).
- Requirements: through Supabase (dashboard or the read-only MCP `list_tables` / `execute_sql` SELECTs; **no** migrations), confirm:
  - (a) `handle_new_user` trigger on `auth.users` and its body;
  - (b) live RLS policies for `products`, `orders`, `users`, `sellers`, `carts`;
  - (c) migrations `0044`–`0048` applied (columns/tables exist);
  - (d) Auth settings: email confirmation on/off, Google provider, identity linking behaviour, redirect URL allow-list;
  - (e) Vercel: dashboard production host (F16), wildcard `*.tallaby.com` on ecommerce;
  - (f) Upstash env availability per app.
- Acceptance: results recorded in §23. Security problems (e.g. F13) are reported to the user, not fixed silently.

**P0-05 · P0 · deps: —** Resolve decisions. Present §21.3 to the user. Record the answers.

**P0-06 · P2 · deps: P0-05 (D15)** E2E tooling. If approved, add Playwright to one app with a smoke test of the marketplace home and a storefront host (use `*.localhost` per `storeSubdomainFromHost`).

---

### Phase 1 — Multi-store foundation and Supabase readiness

**Phase acceptance:**

- All builder/CMS/forms/templates/media/integrations tables and the `stores` backfill exist on a Supabase branch (and on production after approval), with advisors clean.
- Every existing seller has exactly one primary store that resolves exactly like before.
- The `SiteConfig` package builds with tests.
- Plan limits work. The isolation harness runs.
- No user-visible change.

**P1-01 · P0 · deps: P0-02** _(Done 2026-10-17, `3289639`; see the note below.)_ Create the shared package `packages/store-sections` [Proposed name] with the site-config core only.
- Files [Proposed]: `packages/store-sections/package.json` (`@workspace/store-sections`), `src/config/schema.ts` (Zod `SiteConfigV1 { schemaVersion:1, designSystem, header, footer, settings, pages:[{slug,isHome,name,seo,content:{sections: SectionInstance[]}}] }`), `src/config/{migrate,validate,sanitize}.ts`, `src/index.ts`, plus tests.
- Requirements: `SectionInstance` compatible with the reference. Node allow-list excludes `customCode`. No React in `config/*`. Form and CMS references are typed ids validated at publish.
- Tests: schema accepts the classic template, rejects unknown node types, strips script/iframe, migrates a fixture.
- Acceptance: `pnpm --filter @workspace/store-sections test` + `typecheck` pass. Added as a workspace dependency of the dashboard and ecommerce.
- **Note 2026-10-17 (as built):** files are `src/config/{schema,migrate,validate,sanitize,url}.ts` + 4 test files (49 tests). Differences from the plan:
  1. The node allow-list also excludes **`map`**, because it renders a third-party iframe.
  2. `designSystem.customCss` is **stripped**: no seller CSS.
  3. `header` and `footer` are each a single `SectionInstance | null`.
  4. Version 0 means anything without `schemaVersion`: a bare reference `PageContent` or a `{pages}` list.
  5. `validateSiteConfig(raw, { allowedSections })` takes the section registry as a parameter, because the registry arrives with P4-02.
  6. Reserved page slugs (`products`, `cart`, `checkout`, `api`, …) block pages that would shadow storefront routes.
  7. The HTML sanitizer is `sanitize-html`, already used by `@workspace/tiptap`.

  Publish checks that need the DB (product, media, form and CMS ownership) stay in the publish action (P1-04/P4-04).

**P1-02 · P0 · deps: P0-04, P0-05** Migrations `0050`–`0057` (§11.2–§11.8b) + Drizzle mirror.
- Files [Proposed]: `packages/db/migrations/0050_seller_plans_and_stores.sql` … `0056_store_integrations.sql`; `packages/db/src/drizzle/schema.ts`, `relations.ts`, `packages/db/src/index.ts` (verified).
- Requirements: idempotent; RLS enabled; integrity and append-only triggers; backfill inside `0050`; no change to existing unique indexes.
- Tests: apply twice on a test DB; integration tests for unique primary store, subdomain CHECK, `store_products` cross-seller rejection, CMS store consistency, revision append-only.
- Acceptance: `pnpm typecheck` passes in all apps; the backfill checks in §11.11.2 return no anomalies.
- Rollback: drop the new tables and columns (the legacy columns are untouched).
- **Done 2026-10-17 (`6d2287c`, fix in `5e5ac5e`). Applied on staging, not on production.** Differences from §11:
  - `sellers.max_stores_override` (D27) added in `0050`.
  - `store_pages.show_in_nav` added in `0051`.
  - **No SVG** in `store-media`.
  - Each cross-tenant rule is a trigger: `store_products`, `media_*`, form submissions, CMS items, integrations, published revision belongs to the store.
  - `store_shipping_zones` overlap is a deferred constraint trigger.
  - Two circular FKs (`stores.published_revision_id`, `templates.current_version_id`) exist in SQL but are not declared in Drizzle, because they break type inference.
  - The `0051` append-only trigger first blocked deleting a user who had published (`ON DELETE SET NULL` on `published_by`). Clearing `published_by` alone is now allowed. The integration test caught this.
  - Behaviour checks: `packages/db/sql-tests/stores_invariants.sql` (rolls back).

**P1-03 · P0 · deps: P1-02** Auth helpers for the dashboard.
- Files: extend `apps/dashboard/lib/auth/seller-access.ts` (verified) or [Proposed] `apps/dashboard/lib/auth/require-seller.ts`.
- Requirements: `requireSeller({ forWrite })` → `{ userId, sellerId, status, plan }`; `requireStore(storeId, { forWrite, forPublish })` → `{ seller, store }` after the ownership check (`deleted_at IS NULL`; archived stores are read-only). Both use React `cache()`.
- Tests: unit per status; foreign store → `NotFound` (never reveal existence).
- **Done 2026-10-17 (`19e6a72`).** `apps/dashboard/lib/auth/access.lib.ts` holds the pure policy (13 tests) and `require-seller.server.ts` the per-request memoized loaders. Store ids that are not uuids → `not_found` before any query. Existing actions still use their own `getUser()` checks; they move to `requireSeller` as each page is touched (Phase 3).

**P1-04 · P0 · deps: P1-02** Data access for stores and sites (server-only).
- Files [Proposed]: `packages/lib/src/stores/{server.ts,index.ts}` (`listStores`, `getStore`, `createStore`, `archiveStore`, `updateStoreSettings`, `getStoreBySubdomain`), `packages/lib/src/store-sites/server.ts` (`getStoreForEditor`, `saveStorePageDraft`, `publishStoreSite`, `restoreRevisionToDraft`, `getPublishedStoreSite`).
- Requirements: every function takes `(sellerId, storeId)` and filters every child query by `store_id`. `createStore` locks the seller row and enforces `canCreateStore`. Publish per §12 step 5 (the trial hook is a no-op until P6-03).
- Tests: integration for each function; concurrency (two saves with the same version → one fails; two creates at the limit → one fails).
- **Done 2026-10-17 (`5e5ac5e`).** Exports `@workspace/lib/stores` (pure: schemas, `subdomainCandidates`), `@workspace/lib/stores/server` and `@workspace/lib/store-sites/server`. Differences from the plan:
  - Also added `getPrimaryStore`, `restoreStore` (un-archive), `updateStoreSubdomain`, `listStoreRedirects` and `ensureStoreSiteScaffold` (design system + home page; backfilled stores get it on first editor load).
  - `checkStoreSubdomain` (P2-02's shared check) lives here, with up to 3 suggestions.
  - The primary store cannot be archived.
  - Publish is blocked for `restricted` sellers (A5).
  - Restoring a revision never deletes draft pages that are not in it.
  - `@workspace/store-sections` gained `validatePageContent` for autosave.
  - 26 integration tests run against staging.

**P1-05 · P0 · deps: P1-04** Tenant isolation test harness.
- Files [Proposed]: `packages/lib/src/stores/isolation.integration.test.ts` + a fixtures helper (seller A with stores A1/A2, seller B).
- Requirements: §17 tests 1–3, 5 and 11 now; the others in later phases. Skipped without `TEST_DATABASE_URL`.
- **Done 2026-10-17 (`59b1f4f`).** `packages/lib/src/stores/isolation.{fixtures,integration.test}.ts`: 5 tests pass on staging.

**P1-06 · P0 · deps: P1-02** Supabase readiness (§11.11).
- Requirements: branch-first rollout; advisors; Storage bucket `store-media` + policies (`0053`); audit existing bucket policies; record the backup or PITR status; record everything in §23. Production apply only after owner approval.
- Acceptance: advisors show no new security warnings; an upload test as seller A to `store-media/{A}/…` succeeds and one to `store-media/{B}/…` fails.

**P1-07 · P0 · deps: P1-02** Seller-to-store compatibility layer.
- Requirements: one write path keeps the legacy mirrors in sync (`sellers.subdomain` ← primary store subdomain; `carts.store_seller_id` ← store owner; custom domains and redirects keep `seller_id` + `store_id`). Document in `docs/store-builder.md` which surface reads which field (storefront → store; marketplace `/stores/[slug]` → seller).
- Tests: changing the primary store's subdomain updates both and adds a redirect with `store_id`.
- **Done 2026-10-17 with DB triggers instead of one app write path** (`0050` section 6). The legacy writers (the ecommerce `/onboarding` wizard, admin, the dashboard `updateStoreSubdomain` in `actions/seller.ts`) keep writing `sellers` and still produce correct store data:
  - a new seller automatically gets its primary store;
  - `sellers.subdomain` and the primary store's subdomain stay equal in both directions;
  - `store_id` is filled on new redirects, custom domains, storefront carts and storefront orders.

  `docs/store-builder.md` is not written yet (moved to P9-06).

**P1-08 · P0 · deps: —** Plans module.
- Files [Proposed]: `packages/lib/src/plans/{index.ts,plans.test.ts}`.
- Requirements: §11.2 registry (Free: `maxStores 3`, AI off, advanced settings off); `getPlanLimits`, `hasFeature`, `canCreateStore`; an unknown plan falls back to Free. A single place for future subscriptions.
- Tests: limits, the fallback, the boundary (2 → allowed, 3 → refused).
- **Done 2026-10-17 (`06fe285`).** Exported as `@workspace/lib/plans` (12 tests). Added beyond the plan: `resolvePlanId`, `getMaxStores`, and an optional `{ maxStoresOverride }` on `canCreateStore` for the D27 admin override. The column or settings key for the override comes in P1-02.

---

### Phase 2 — Simple seller signup

**Phase acceptance:**

- A new seller completes signup (email or Google) in under 60 seconds with only a slug + account (+ phone per D6).
- They get a seller account (`plan = 'free'`) and one primary store that is live with the default theme, and they land on the dashboard home.
- Retries create no duplicates.
- The old wizard still works until D16.

**P2-01 · P0 · deps: P1-02, P1-04** `ensureSellerAccount` (idempotent creation of account + primary store).
- Files [Proposed]: `packages/lib/src/sellers/ensure-seller-account.ts` (+ test). Reference: `apps/ecommerce/components/onboarding/become-seller.server.ts` (verified) for the role-promotion rule and error mapping.
- Requirements: §6.3 / §6.5. One transaction. Unique violations on the subdomain map to `slug_taken`. Afterwards, set `user_metadata.is_seller` best-effort (existing pattern). Check that `legal_address` readers handle `{"country":"EG"}`. Once P6-02 exists, also set `fee_trial_eligible = true`.
- Security: user id only from the session.
- Tests: create; call twice; concurrent calls → one seller and one primary store; a slug race between two users → one gets `slug_taken`.
- **Done 2026-10-17 (`5a05995`).** `@workspace/lib/sellers` (pure `signupInputSchema`, `displayNameFromSubdomain`) and `@workspace/lib/sellers/server` (`ensureSellerAccount`). Differences from the plan:
  - The primary store comes from the `0050` trigger, not from this function.
  - **No `seller_wallet` row:** wallets are created on the first ledger entry (`credit-seller-on-delivery.ts`), so signup does not touch ledger code.
  - The error code is `taken`, not `slug_taken`.
  - When an older seller's slug equals the new subdomain, the slug gets a suffix instead of failing (D17).
  - `fee_trial_eligible` waits for P6-02.
  - Every `legal_address` reader was checked (admin seller detail, storefront, `actions/seller.ts`); all handle `{"country":"EG"}`.
  - 7 integration tests on staging, including both races.

**P2-02 · P0 · deps: P2-01** Subdomain availability (shared by signup and "create store").
- Files [Proposed]: `packages/lib/src/stores/subdomain.ts` (`checkStoreSubdomain`) + `apps/dashboard/app/signup/signup.server.ts`.
- Requirements: §6.4. Returns `available | taken | tooShort | tooLong | invalid | reserved`. Rate limited. Suggests up to 3 alternatives.
- Acceptance: never reports available for a subdomain in `stores` or `seller_subdomain_redirects`.
- **Done 2026-10-17.** The check lives in `@workspace/lib/stores/server` (`checkStoreSubdomain`). The dashboard action `checkSignupSubdomain` (`app/signup/signup.server.ts`) adds a per-IP limit of 60/min. The limiter is in-memory per instance (`lib/rate-limit.lib.ts`), because no Redis exists (A4).

**P2-03 · P0 · deps: P2-02** Signup page + auth wiring.
- Files: `apps/dashboard/supabase/middleware.ts` (allow `/signup`; signed-in users without a seller row → `/signup` when the flag is on), `apps/dashboard/app/api/auth/callback/route.ts` (call `ensureSellerAccount` when the intent cookie is present), `apps/dashboard/components/auth/o-auth.tsx` (all verified); [Proposed] `apps/dashboard/app/signup/{page.tsx,signup.client.tsx,signup-intent.ts}`; messages `apps/dashboard/messages/{ar,en}.json` (`signup.*`).
- Requirements: one screen with slug, email+password or Google, and phone (D6). Inline check, clear errors, RTL-first. After success → `/` with a welcome toast and a link to the live store.
- Security: intent cookie httpOnly, `SameSite=Lax`, `Secure`, 15-minute expiry, HMAC; open-redirect-safe `next`.
- Tests: intent cookie unit tests. Manual E2E: email signup (confirmation on/off per P0-04), Google signup, refresh during callback, back button, an existing seller visiting `/signup` → `/`.
- Acceptance: timed run < 60 s; no duplicate rows after a forced callback retry; the new store URL shows the default theme with the empty-catalog state.
- **Code done 2026-10-17 (`5a5eda8`); manual E2E not done yet.** Files: `apps/dashboard/app/signup/{page.tsx,signup.client.tsx,signup.server.ts,signup.dto.ts,signup-intent.{lib,server}.ts,signup-complete.server.ts}` and the reusable `components/stores/subdomain-field.client.tsx`. Differences from the plan:
  - Email signup also stores the choices in `user_metadata` (`signup_subdomain`, `phone`). Confirming the email in another browser still completes the store, and `handle_user_update` copies the phone to `users.phone`.
  - The sellerless redirect lives in the `(main)` layout, not the proxy (it needs a DB lookup).
  - The callback also fixes an **open redirect** in `next` (`lib/auth/safe-next.lib.ts`) and the old `/auth` targets, which don't exist (now `/login`).
  - New env var `SIGNUP_INTENT_SECRET` (server-only, ≥ 32 characters): added to `.env.example` and to the local `apps/dashboard/.env`. **It must also be set in Vercel.**
  - Verified on staging: `/signup` renders (AR, 200) and `/` still redirects to `/login`. Dashboard 65 unit tests and typecheck pass.

**P2-04 · P1 · deps: P2-03** Existing customers becoming sellers: `apps/dashboard/components/layout/seller-access-blocked.tsx` (verified) links to `/signup` (the account step is skipped).

**P2-05 · P1 · deps: P2-03, D16** Point acquisition entry points to the new signup.
- Files: `apps/ecommerce/app/[locale]/(main)/sell/sell.chunks.tsx`, `apps/ecommerce/messages/{ar,en}.json` (**ar.json had uncommitted user edits — merge carefully**), `apps/ecommerce/app/[locale]/onboarding/page.tsx` (verified).
- Requirements: CTA → dashboard `/signup` (env name to be confirmed). `/onboarding` → redirect only after D16. The wizard code is kept.
- **Done 2026-10-17 (`36cc7fa`).**
  - The CTA logic lives in `apps/ecommerce/lib/seller/seller-cta.lib.ts` (used by `sell-cta.tsx`, the home seller band and the header), not in `sell.chunks.tsx`. No message changes were needed, so `ar.json` was not touched.
  - Guests and customers clicking the sell-page / home-band CTA go to `SELLER_SIGNUP_URL` = `NEXT_PUBLIC_DASHBOARD_URL` (default `https://dashboard.tallaby.com/`) + `signup`. The header link still goes to `/sell`; sellers still open the dashboard in a new tab. 3 unit tests.
  - Env name confirmed: `NEXT_PUBLIC_DASHBOARD_URL` (added to `.env.example`). **Owner:** set it in Vercel for previews/staging; production can rely on the default.
  - **Deploy order:** ship the dashboard `/signup` (and migrations `0050`+) before or with this ecommerce change, otherwise the CTA lands on a 404.
  - `/onboarding` is unchanged and still reachable (D16).

---

### Phase 3 — Seller dashboard foundation (sitemap, multi-store, store operations)

**Phase acceptance:**

- The sidebar matches §7.2 (groups, store switcher, redirects) in AR/EN on desktop and mobile.
- `/stores` allows creating up to 3 stores.
- Store settings (General, Payment methods, Policies) and Shipping settings save per store and are enforced at storefront checkout.
- Delivery tracking updates order delivery status for customers.
- Existing pages keep working.

**P3-01 · P0 · deps: P0-02, P1-04** Sidebar restructure + store switcher (§7).
- Files: `apps/dashboard/components/dashboard/Sidebar.tsx`, `sidebar.server.ts`, `sidebar.types.ts`, `components/layout/dashboard-routes.lib.ts`, `messages/{ar,en}.json` (all verified); [Proposed] `components/dashboard/{sidebar.config.ts,store-switcher.client.tsx,store-switcher.data.tsx}`.
- Requirements:
  - Config-driven dropdown groups (§7.4); store-scoped hrefs from the selected store; the last store id in a cookie for navigation only.
  - Redirects `/shipping` → `/orders/delivery`.
  - Breadcrumbs and command palette include all routes.
  - Flag-gated groups (`STORE_BUILDER_SELLER_IDS` or "all"); unreleased items hidden.
- Tests: `lib/i18n/messages.test.ts` key parity; a unit test that every sidebar href exists in `DASHBOARD_ROUTES`.
- Acceptance: every existing page is reachable; the old URLs redirect.
- **Done 2026-10-17 (`ee1678d`).** `components/dashboard/sidebar.config.ts` holds the §7.2 sitemap as data, with items marked `live | soon | planned`:
  - `planned` items stay hidden until their task ships, so no link leads to a 404. Each task flips its items to `live`.
  - The Website group needs `STORE_BUILDER_SELLER_IDS` (`all` or a comma list of seller ids). It is a new server env var, unset = hidden.
  - The store switcher (`store-switcher.{client,server}.tsx`) stores the choice in the `tallaby_store` cookie, which is **navigation only**. `selectStore` accepts only the seller's own stores, and `lib/stores/current-store.server.ts` ignores unknown ids.
  - `DASHBOARD_ROUTES` supports `[storeId]` patterns. The command palette skips them.
  - Tests: every live sidebar link is in `DASHBOARD_ROUTES`, every label exists in AR/EN, and every existing page is still reachable.
  - Deviation: the `/shipping` → `/orders/delivery` redirect is done in P3-06 together with the page move. The dead "Give us your feedback" `#` link was dropped (Help covers it).

**P3-02 · P0 · deps: P1-04, P1-08** `/stores` page (§8.0).
- Files [Proposed]: `apps/dashboard/app/(main)/stores/{page.tsx,stores.{server,data,client,dto}.ts(x)}`; adapt the reference `components/websites/*` cards.
- Requirements: list, create (live subdomain check, usage "N of 3"), archive.
- Tests: §17 test 11.
- Acceptance: a 4th store is refused on the server.
- **Done 2026-10-17 (`02b3bb2`).** Files: `app/(main)/stores/{page,stores.data,stores.client,stores.server,stores.dto,stores.skeleton}`, plus the shared `components/stores/{subdomain-field,store-logo}.client.tsx`.
  - Cards are adapted from the reference `components/websites/website-card.tsx` (gradient thumbnail, badges, menu). They show the active custom domain when there is one.
  - Actions: open, copy link, manage (selects the store), archive with confirmation, restore. The primary store cannot be archived.
  - Create dialog: `?create=1` opens it.
  - Server limits: `createStore` (plan lock), with rate limits for create (10/h) and the check (60/min).
  - The "4th store refused" acceptance is covered by integration tests (`stores.integration.test.ts`, isolation test 11).

**P3-03 · P1 · deps: P1-02, P3-01** Store settings › General + Policies.
- Files [Proposed]: `apps/dashboard/app/(main)/stores/[storeId]/settings/{page.tsx,policies/page.tsx,store-settings.{server,data,client,dto}.ts(x)}`. Reuse the field components from `settings/seller-settings.client.tsx` (verified).
- Requirements: §8.3 / §7.3 contents. Changes apply immediately. Store-scoped cache invalidation (`storeTags`).
- Tests: DTO tests; integration: the update is scoped to the store.
- **Done 2026-10-17 (`6122753`).** `app/(main)/stores/[storeId]/settings/{layout,page,store-general.client,store-settings.{server,dto},store-settings-tabs.client}` and `policies/{page,store-policies.client}`. Shared `components/stores/brand-image-fields.client.tsx` holds `LogoField` and `BannerField` (same UI as the identity section of `/settings`). `lib/stores/store-page.server.ts` turns a missing, foreign or invalid store into a 404.
  - Differences from the plan:
    - Policies are single-language texts (`return`, `shipping`, `privacy`, `terms`), like today's seller policies, not AR/EN pairs.
    - The catalog mode (`all` / `selected`) is not in the form yet; it needs the product picker (P4-07 / D24). **2026-10-18:** shipped as its own Store settings › Catalog tab (P4-07).
    - Store status (archive) lives on `/stores`.
  - **Storefront compatibility:** the storefront still reads `sellers` until P5-00. So `0050` (re-applied on staging) gained a **two-way trigger sync** between the primary store's profile and the seller row: name, description, logo, banner, category, contact email/phone, return/shipping policy. Saves show up immediately, and edits from admin or the old `/settings` reach the store. Invariant 3b covers it.
  - The lib now replaces contact phone/WhatsApp/email as a set (other keys are kept). Its phone rule matches the seller settings, and it accepts existing bucket paths for logo/banner.
  - Checked on staging with a QA seller session: own store General/Policies/`/stores` render with the right data. Another seller's store id and an invalid id render the not-found UI with none of that store's data. The HTTP status is 200 because the dashboard layout is already streaming.
- **Gap until P5-00:** stores created on `/stores` (non-primary) are **not reachable on the storefront yet**. The ecommerce proxy still resolves hosts through `sellers.subdomain`, which is the primary store only. P5-00 (host → store resolution) should come early.

**P3-03b · P2 · deps: P4-14, owner approval** Custom domains for non-primary stores: replace the unique `seller_custom_domains_seller_id_key` with `store_id` uniqueness (index change, so ask first). Update `packages/lib/src/storefront/custom-domains.server.ts` and the custom-domain cron.

**P3-04 · P1 · deps: P2-01** Home page: KPIs with a store filter, setup checklist (§6.6), trial banner, wallet card.
- Files: `apps/dashboard/app/(main)/page.tsx` (verified); [Proposed] `_components/setup-checklist.{data,client}.tsx`, `setup-checklist.lib.ts`.
- **Done 2026-10-17 (`a0b1e6a`, account steps in `fc88c48`).** The home page already had KPIs, a chart, a wallet card and a checklist, so this task extended them.
  - **Sales channel filter** `?channel=all|marketplace|<storeId>`: sales KPIs, chart and top products filter order items through `orders.store_id`. A store id counts only if it is one of the seller's stores (`resolveHomeChannel`), and it is passed as a bound parameter.
  - **Checklist per selected store** (`setup-checklist.lib.ts`, tested): profile (logo + description), active product, contact, return + shipping policies, legal details, payout account, coupon, campaign.
  - Fulfillment is no longer a required step, because minimal signup doesn't ask for it.
  - Still missing: "store published" (needs the builder, P4) and the trial banner (P6).

**P3-05 · P2 · deps: P2-01** `/settings` (business & account) without store fields + `/settings/plan` (plan, "N of 3 stores", features not on the plan; no prices).
- **Done 2026-10-17 (`fc88c48`).**
  - **Store fields removed from `/settings`:** display name, logo, banner, description and policies are gone from the autosave form *and its payload*, so it cannot overwrite store values. A card links to the main store's settings.
  - **New sections, each with explicit save** (`account-sections.client.tsx`, `account.server.ts`):
    - Legal details: business type and registered address, with the governorate list.
    - Payout account: InstaPay, mobile wallet or bank IBAN. Strict schema; shown masked (last 4) only.
  - The lib side is `@workspace/lib/sellers` (`account.lib`) and `/server` (`account.server`), with 5 integration tests.
  - `payment_details` holds the seller's *preferred* payout account; admin still records the actual destination per payout.
  - `/settings/plan` shows the plan from `@workspace/lib/plans`, store usage and features, with no prices.
  - The `/settings` nav label is now "Business & account" (النشاط والحساب).
  - The store link and custom domain stay on `/settings` until Domain & SEO (P4-14) exists.

**P3-06 · P0 · deps: P3-01** Orders & Shipping group: orders + delivery tracking + riders.
- Files: `apps/dashboard/app/(main)/orders/*`, `shipping/*` (moved to `orders/delivery/*` and `orders/riders/*`), `lib/shipping/{apply-seller-shipment,shipping-status}.ts` (all verified).
- Requirements:
  - Store and source filters on orders (needs `orders.store_id`, P5-00).
  - Delivery tracking keeps the existing status actions, which already update shipment + order + items + wallet hooks atomically.
  - Add bulk status updates (each one a separate guarded transaction).
  - The customer's order page (`apps/ecommerce/app/[locale]/(main)/orders/[orderId]`) shows a status timeline with timestamps (`shippedAt`, `deliveredAt`, failure reason) — verify what it shows today and extend it.
  - Tallaby-delivered shipments are read-only for the seller.
- Tests: transition rules (`canTransition`); a double-submit guard (existing `expectedFromStatus`).
- Acceptance: a status change in the dashboard is visible on the customer's tracking page on reload.
- **Done 2026-10-17 (`73e0197`).**
  - `shipping/*` moved to `orders/delivery/*` (git mv); `/shipping` permanently redirects. New `orders/riders` page.
  - Bulk "out for delivery" / "delivered" in `actions/shipping.ts` (`bulkUpdateShipmentStatus`): each shipment goes through the same guarded `applyStatusChange` transaction as the single action; Tallaby-delivered shipments are skipped.
  - Orders list gets the channel filter (marketplace / a store).
  - Customer order page: `delivery-timeline.tsx` with placed / assigned / out for delivery / delivered / failed (+ reason) timestamps.

**P3-07 · P0 · deps: P1-02, P3-03** Payment methods (§8.6).
- Files [Proposed]: `packages/lib/src/payments/store-methods.ts` (+ test), `apps/dashboard/app/(main)/stores/[storeId]/settings/payments/*`, logos in a shared assets location (add Orange Cash and WE Pay). Ecommerce: generalise `apps/ecommerce/lib/manual-payment-methods.ts` and `cart/checkout/payment/_components/manual-payment-instructions.tsx` to read the store's details on store hosts; extend `reportManualPaymentSent` (`apps/ecommerce/actions/order.ts`) with an optional reference. Dashboard `confirmManualPayment(storeId, orderId)`. Add the new keys to the admin labels (`apps/admin/app/(dashboard)/orders/orders.lib.ts`, `wallets/wallets.lib.ts`).
- Requirements:
  - COD on by default for new stores.
  - Wallet methods (Vodafone Cash, e& Cash, WE Pay, Orange Cash) require a phone + holder name; InstaPay requires a holder name + IPA, phone or IBAN.
  - Soon rows disabled with "Notify me".
  - Details snapshot into `orders.metadata`; change audit + email notification.
  - Server-side enforcement on store-host checkout; unpaid manual orders auto-cancel (D32).
  - Marketplace unchanged. Existing stores per D30.
- Security: store-scoped; details validated; rate-limited changes; never log full details.
- Tests: schema validation per method; checkout rejects a disabled method; the snapshot is kept after the seller edits details; confirm is idempotent; an order on store A cannot be confirmed from store B.
- Acceptance: on a store host the customer sees only the enabled methods with logos and the seller's numbers; the seller confirms payment; the order moves to paid.
- **Part A done 2026-10-17 (`f65ecfb`): catalog + Store settings › Payment methods.**
  - `packages/lib/src/payments/store-methods.ts` (export `@workspace/lib/payments/store-methods`, 10 unit tests): catalog with logo or brand-initials badge, strict detail schemas (Egyptian mobile; IPA `name@instapay`; IBAN `EG`+27 digits with mod-97 check; payment link only `https://ipn.eg/…`), operator-prefix hint (hint only, numbers can be ported), "at least one method on", COD default.
  - `updateStorePaymentMethod` / `getStorePayments` in `@workspace/lib/stores/server`: row lock, store-scoped, archived stores read-only, details kept when a method is only switched off. 6 integration tests on staging (foreign store → `not_found`, last method, archived, masked audit, append-only).
  - **New migration `0058_store_settings_audit.sql`** (applied on staging only): append-only, RLS on with no policies, `seller_id` must own `store_id`. Phone/IBAN/IPA are stored masked (last 4).
  - Dashboard `/stores/[storeId]/settings/payments`: toggles, details sheet with field errors from the shared schemas, customer preview, COD fee/note. Rate limit 30 changes / 10 min per seller (in-memory, A4). Sidebar item and tab are live.
  - A notice on the page says store checkout does not use these settings yet.
  - **Deviations:** no "Notify me" on Soon rows (nothing would store or send it; add with notifications later). No email notification on change yet (no seller-notification sender exists; audit row only). Orange Cash / WE Pay use brand-initials badges until official logo files are added (owner).
  - **Part B not started (needs owner approval, tied to P6-05):** store-host checkout reading these settings, order-metadata snapshot, `reportManualPaymentSent` reference, `confirmManualPayment(storeId, orderId)`, D32 auto-cancel, admin labels. Seller-collected payments must not be credited as `seller_earning` on delivery, which needs the collector-aware store wallet.

**P3-08 · P1 · deps: P1-02, P3-03, D31** Shipping settings (§8.7).
- Files [Proposed]: `apps/dashboard/app/(main)/stores/[storeId]/shipping/*`, `packages/lib/src/shipping/store-zones.ts` (+ test). Changes to `packages/lib/src/orders/place-order.ts` (shipping step) and the storefront cart/checkout shipping display.
- Requirements:
  - Tallaby delivery (read-only rates + seller-funded free-delivery offers) vs own delivery (zones).
  - No governorate in two enabled zones.
  - Checkout uses one function for display and charge; uncovered governorate → cannot check out.
  - Per-zone COD flag respected.
  - Switching delivery method follows D31 and `docs/fulfillment.md`.
- Tests: zone matching, free-over, per-kg, uncovered governorate; marketplace orders unchanged (snapshot); shown price = charged price.
- Acceptance: a storefront order for an own-delivery store is charged the zone price, and only the fee is debited from the wallet on delivery.
- **Part A done 2026-10-17 (`ba8e783`): settings + zones.**
  - `packages/lib/src/shipping/store-zones.ts` (export `@workspace/lib/shipping/store-zones`, 10 unit tests): strict zone schema (canonical governorates, no duplicates, money with ≤ 2 decimals, min ≤ max days), store settings `{ method, handlingDays, freeShippingOver }` in `stores.settings.shipping`, `findZoneOverlap`, `findZoneForGovernorate` (normalises aliases), `uncoveredGovernorates`, and `quoteZone` (first kg flat + per started extra kg, free at/over threshold, integer piastres) — the one function checkout must use for display and charge.
  - `getStoreShipping`, `saveStoreShippingZone`, `deleteStoreShippingZone`, `updateStoreShippingSettings` in `@workspace/lib/stores/server`: store row lock, archived = read-only, foreign store/zone = `not_found`, overlap refused in the app (and by the 0057 deferred trigger), max 30 zones, "own" needs ≥ 1 enabled zone (and the last enabled zone can't be deleted/disabled while "own"). Audit rows in `store_settings_audit` (section `shipping`). 7 integration tests on staging.
  - Dashboard `/stores/[storeId]/shipping` (sidebar "Shipping settings" is live): method choice, preparation days, seller-funded free delivery (Tallaby method), Tallaby's first-kg rate per governorate (read-only), zone list + sheet editor (governorates already in another enabled zone are disabled), uncovered governorates, example quote. `StorePageHeader` extracted and shared with Store settings.
  - **Finding:** the 0057 overlap trigger is `DEFERRABLE INITIALLY DEFERRED`; a single autocommit statement through postgres-js did **not** surface its error (the row stayed). Inside an explicit transaction it fires at COMMIT as intended. All zone writes go through transactions, so this only matters for ad-hoc writes.
  - **Part B not started (owner approval):** `placeOrderFromCart` shipping step for own-delivery storefront orders, cart/checkout display via `quoteZone`, per-zone COD flag, "we don't deliver here yet", the D31 fulfillment function (`provider = seller`) + `docs/fulfillment.md`, and the fee-only debit (§13.4, P6-05). Until then the method choice is stored only, and the page says so.

---

### Phase 4 — Website Design (builder, templates, forms, CMS)

**Phase acceptance:**

- A pilot seller can open the editor for any of their stores and change sections, text, images and theme, with autosave and undo/redo, then preview desktop and mobile, publish, and restore an older revision. The other store is unaffected.
- Tallaby Classic published with default content looks the same as the legacy storefront.
- No `customCode` or HTML injection is possible.

**P4-01 · P0 · deps: P0-01, P1-01, P1-04** Port the editor core into the dashboard.
- Files: from the quarantine location (P0-02) and `D:\programming projects\saas\apps\dashboard\lib\builder\*` (read-only source) → [Proposed] `apps/dashboard/lib/store-builder/**`, `apps/dashboard/components/store-builder/**` (adapted per §5.3). New dependencies (approval needed): `zundo`, `immer` (check zustand), `@dnd-kit/react`, `@dnd-kit/dom`, `@dnd-kit/abstract`, `@dnd-kit/collision`, `framer-motion` (or remove its use), `nanoid` (check).
- Requirements: remove project/team/plan-billing/AI/CMS-API/analytics code paths (keep plan **checks** through P1-08 helpers where the reference gates features). `@workspace/i18n` → next-intl. Media → the P4-09 library. Valorcy actions → thin dashboard actions calling P1-04 with an explicit `storeId`. Keep undo/redo, autosave, device modes, shortcuts and RTL.
- Tests: port the relevant reference unit tests; store reducer tests.
- Acceptance: `pnpm --filter dashboard typecheck/test/build` pass.

**P4-02 · P0 · deps: P1-01** Shared, renderable section library.
- Files [Proposed]: `packages/store-sections/src/{core,sections,render}/**`, adapted from the copied `components/sections/{registry.types.ts,define-section.ts,schema/*,_primitives/*,_chrome/*}` + curated sections.
- Requirements: a render-mode context (`edit | public`). Public mode imports no editor modules. ≤30 curated sections + commerce sections (§8.2). Each section has an id, version, Zod props schema and `migrateProps`. Chrome cart widgets call an injected `cartAdapter` (ecommerce provides the host-scoped cart; the editor provides a mock).
- Acceptance: ecommerce renders a section without pulling in dashboard code (check the bundle).
- **Done 2026-10-17 (`d2a1fa6`), written Tallaby-native rather than copied.** The reference sections import editor modules in 290 of 307 files, so porting them would drag the editor into the storefront. Instead `@workspace/store-sections/render` keeps the reference contract the editor panels read (`defaultProps`, `propDefinitions`, `itemCollections`, `version`, `migrateProps`, `Component`) with AR/EN labels, without AI metadata.
  - Core (`src/core`): `types.ts` (`SectionDefinition` + zod `propsSchema`, `catalogQuery`, `chrome`, `RenderContext`), `registry.ts` (`createSectionRegistry`, `allowedSections()` for `validateSiteConfig`, `applyMigrations` ported, `resolveSectionProps`, `collectCatalogQueries` for P4-07/P5-02), `locale.ts` (reference translation overlay, ported), `theme.ts` (design system → the Classic `--sf-*` tokens, so a store without a design system looks like Classic), `copy.ts` (fixed AR/EN strings), `links.ts` (`safeHref`: http(s), paths, anchors, tel, mailto; `whatsappHref`).
  - Renderer (`src/render/render.tsx`): `SectionRenderer` (skips unknown sections, migrates, applies the locale overlay, validates props), `PageRenderer` (header → sections → footer), `SiteTheme` (`<style>` scoped to `.sf-site`). No hooks: server-renderable.
  - **16 sections:** chrome `store-header`, `store-footer`; hero `hero-banner`; commerce `product-grid` (newest / featured / category / selected), `featured-product`, `category-grid`; content `features`, `image-with-text`, `rich-text`, `faq`, `cta-banner`, `spacer`; social proof `testimonials`, `logo-cloud`; media `image-gallery`; contact `contact-info` (details from the store profile).
  - Commerce sections only declare a `catalogQuery`; the host resolves products/categories and passes them in `ctx.catalog` (keyed by instance id). The cart button and add-to-cart come from `ctx.renderCartButton` / `renderAddToCart` (the `cartAdapter` of the plan).
  - Safety: seller text is always escaped (no HTML), links pass `safeHref`, images go through `ctx.imageUrl`, a field of the wrong type is dropped (the rest renders). Tailwind scans the package (`@source` added to `packages/ui/src/styles/globals.css`).
  - Tests: 84 in the package (32 new: defaults valid for every section, AR/EN render of each, unknown skipped, `javascript:` dropped, HTML escaped, overlay, host Link vs external anchor, catalog queries, products + cart slot, empty states, page order, theme mapping + injection guard; and a boundary test that nothing imports `@/`, `next/`, `@workspace/db|lib|cache` or editor code, and no hooks in sections/renderer).
  - Not yet: the Tallaby Classic sections (P4-03) and wiring into ecommerce (P5-01).

**P4-03 · P0 · deps: P4-02, P1-02** Tallaby Classic = the existing default template.
- Files: move or extract `apps/ecommerce/app/[locale]/storefront/[subdomain]/_components/*` and `storefront.module.css` (verified) into `packages/store-sections/src/templates/tallaby-classic/**` **without visual change**, re-exported so the legacy pages keep using them. Switch their data source from seller fields to store fields. Add a seed script that generates the `templates` / `template_versions` rows.
- Tests: DOM/screenshot comparison of the legacy page before and after (a backfilled store must render identically); template config validates.
- Rollback: revert the move.
- **Done 2026-10-17 (`ed282f2`), without moving the components.** The Classic pieces depend on ecommerce internals (server translations, the marketplace product cards, search/sort/paging state), so moving them risked visual drift. Instead:
  - `@workspace/store-sections` has five Classic sections (`classic-header`, `classic-hero`, `classic-categories`, `classic-catalog`, `classic-footer`; the first and last are `chrome`). Their `Component` calls `ctx.renderClassic(part, props)`; the storefront host (P5-01) maps each part to its **existing, unchanged** component, so Classic renders identically by construction. The editor supplies previews (P4-01/P4-06). The legacy storefront page is untouched.
  - `tallabyClassicConfig()` (`@workspace/store-sections/templates`) = classic header + footer + home `[classic-hero, classic-categories, classic-catalog]`. **`0062_tallaby_classic_template_v2.sql`** seeds it as `template_versions` v2 and makes it current; it is generated by `pnpm --filter @workspace/store-sections classic:sql`, and a test fails if the file and the package disagree. Applied on staging twice (current = v2, 3 home sections).
  - `ensureStoreSiteScaffold` now gives a **never-published** store the classic header/footer (`stores.shared_header/footer`) and fills an empty home draft with the classic home, so the first Publish reproduces today's storefront. Published stores and non-empty drafts are never touched.
  - Tests: template valid against the registry, structure, migration in sync (3); scaffold integration (3: unpublished store gets Classic, published store and an emptied published draft untouched, idempotent); the store-sites tests now validate against the real registry. lib 398/398 on staging, store-sections 92.
  - The DOM comparison test moves to P5-01, where the published Classic page is rendered next to the legacy page.

**P4-04 · P0 · deps: P1-04, P4-01** Builder server actions.
- Files [Proposed]: `apps/dashboard/app/(builder)/stores/[storeId]/editor/{editor.server.ts,editor.dto.ts}`.
- Requirements: `loadEditor(storeId)`, `saveDraft(storeId, pageId, content, version)`, `saveDesignSystem/header/footer(storeId, …)`, `createPage/renamePage/deletePage/reorderPages` (home page cannot be deleted; reserved slugs blocked), `publish(storeId)`, `unpublish(storeId)`, `discardDraft(storeId)`, `listRevisions(storeId)`, `restoreRevision(storeId, id)`. All go through `requireStore`. Publish is rate-limited.
- Tests: isolation tests 1–3 including cross-store ids.
- **Done 2026-10-17 (`2068c58`).**
  - New in `@workspace/lib/store-sites/server`: `saveStoreDesignSystem` (validated tokens, optimistic `version`), `saveStoreChrome(header|footer)` (validated + sanitized like page content; `null` removes), `createStorePage` / `updateStorePage` / `deleteStorePage` / `reorderStorePages` (slug format + reserved slugs, `slug_taken`, `MAX_PAGES`, the home page keeps its slug and cannot be deleted, reorder must list exactly the store's pages), `unpublishStoreSite` (storefront falls back to Classic), `discardStoreDrafts` (drafts ← live revision), `listStoreRevisions` (live marked), `getStoreSiteStatus` (**unpublished changes = validated drafts ≠ live snapshot**, so store-settings edits that touch the `stores` row never count).
  - Dashboard actions `app/(builder)/stores/[storeId]/editor/editor.{server,dto}.ts`: `saveDraft`, `saveDesignSystem`, `saveChrome`, `createPage`, `updatePage`, `deletePage`, `reorderPages`, `publish` (`forPublish`, 20/10 min, invalidates the store's storefront tag), `unpublish`, `discardDraft`, `listRevisions`, `restoreRevision`, `siteStatus`. Saves are rate-limited 240/10 min. All validate against `storeSectionRegistry.allowedSections()`. `loadEditor` is the existing `getStoreForEditor`, called by the editor page (P4-06).
  - Tests: `builder.integration.test.ts` 7/7 on staging (design system concurrency + invalid token, chrome from the library only, page CRUD + slug rules + cross-store page ids → `not_found`, unpublished-changes logic, discard, revisions, unpublish), plus isolation of every new function for seller B.

**P4-05 · P1 · deps: P4-03, P4-04** Templates gallery + apply: `apps/dashboard/app/(main)/stores/[storeId]/website/templates/*` [Proposed]; §8.1; writes `template_installs`.
- Tests: the merge keeps text overrides; product, order and other-store rows are untouched.
- **Done 2026-10-18.**
  - Pure merge `mergeTemplateIntoDraft` (`@workspace/store-sections/templates`). A section with the same instance id and section id keeps the seller's content props (`contentOverrideKeys`, also per translation). The home page lands on the store's home page and other pages match by slug. Missing pages are created, other store pages are never deleted, and the design system becomes the template's.
  - `@workspace/lib/store-sites/server` (`templates.server.ts`):
    - `listStoreTemplates`: active templates with a valid current version, plus the last install.
    - `applyStoreTemplate`: locks the store and writes **drafts only**, then `stores.template_key` / `previous_template_key` and a `template_installs` row. Premium templates are refused until the theme store exists.
    - `undoStoreTemplate`: only the latest install, once.
  - **Deviation:** undo restores the exact pre-apply drafts, saved in `template_installs.previous_draft` (**`0064_template_install_undo.sql`**, staging only; it was `0071` in the worktree), instead of re-applying `previous_template_key`. Edits made after the apply are replaced too, and the confirm dialog says so.
  - Dashboard `website/templates`: gallery that works with one template (category filter hidden with one category; outline preview when there's no thumbnail), "Use template" / "Reset to this template" with a confirm dialog, and the undo banner. Actions are rate-limited 20/10 min and don't invalidate the storefront (drafts only).
  - "Preview with my products" is not in the gallery yet; P4-08's "Preview on my store" covers the draft after applying.
  - Tests: `templates.integration.test.ts` (keeps text in a matching section, A1 and the live revision untouched, undo exact and once, foreign store and unknown key refused); store-sections `apply.test.ts`.

**P4-06 · P0 · deps: P4-01, P4-04** Editor route + page manager.
- Files [Proposed]: `apps/dashboard/app/(builder)/layout.tsx` (replace the copied pass-through with the auth/seller gate + `NextIntlClientProvider`), `apps/dashboard/app/(builder)/stores/[storeId]/editor/page.tsx`. Adapt `components/website/{website-pages-list,add-page-dialog,manage-page-sheet}.tsx`.
- Requirements: the store id is in the URL; "View live store" uses `storeUrl`; unsaved-changes guard; error recovery.
- Acceptance: with A1 and A2 open in two tabs, edits stay in their own store.
- **P4-01 + P4-06 done 2026-10-18 (`3983b6d`), as a Tallaby-native editor instead of a port.** Valorcy's store/canvas is built around its own schema-compiled sections and free-form element trees; with the Tallaby section library (P4-02) a focused editor on the same contract was smaller and safer. The reference shaped the design (immutable store, snapshot undo, 1.5 s autosave with a version check). **No new dependencies were needed** (uses the existing `zustand` and `@hello-pangea/dnd`; undo is a snapshot stack), so the approved `zundo`/`immer`/`@dnd-kit`/`nanoid`/`framer-motion` were not added.
  - Route `app/(builder)/stores/[storeId]/editor` (+ `(builder)/layout.tsx`: same seller gate as the dashboard, no sidebar). `page.tsx` uses `loadStorePage` (404 for foreign stores) and the `STORE_BUILDER_SELLER_IDS` flag; sidebar "Website editor" is now `live` (still behind the flag).
  - Files: `editor.store.ts` (one zustand store per mount, so two tabs/stores never share state), `editor.lib.ts` (pure ops + canvas catalog), `use-editor-autosave.client.ts` (drains dirty pages, header/footer, theme; stops on `versionConflict` with a reload banner; `beforeunload` guard; `flush()` before publish), `editor-canvas.client.tsx` (iframe + portal so tablet/phone widths hit real breakpoints; links/forms inert; click selects), `editor-inspector.client.tsx` (field per `PropDefinition` type, item collections, product/products/category pickers = **P4-07 picker**), `editor.client.tsx` (top bar: page, AR/EN, device, undo/redo, save state, view store, publish; panels: sections with drag/insert/duplicate/delete and header/footer, pages (create, menu visibility, delete), theme colors + radius), `editor.data.ts` (seller's active products/categories for previews). Classic parts show labelled placeholders in the canvas.
  - English editing writes `translations.en` only for translatable fields; non-translatable fields and item add/remove are locked outside Arabic.
  - Tests: `editor.lib.test.ts` 9 (ops, locale overlay incl. item move/remove, canvas catalog, store dirty/undo/redo); dashboard 99. **Checked over HTTP on staging** with the QA seller (session via a fresh random password set on the staging-only QA account): `/stores/<id>/editor` → 200, Arabic UI, canvas iframe, Classic placeholders, no error boundary or missing messages. The `STORE_BUILDER_SELLER_IDS=all` line was added to the local `.env` only for the check and removed.
  - **Manual browser check still to do (owner; the Chrome extension was not connected):** with `STORE_BUILDER_SELLER_IDS` set, open the editor, add a hero, edit its title (status → "Saved"), switch to EN and translate it, undo/redo, change the primary color, publish, then see it on the store. Open A1 and A2 in two tabs and confirm edits stay in their own store.

**P4-07 · P0 · deps: P4-02, P4-06** Catalog-bound sections and product picker.
- Files [Proposed]: `apps/dashboard/app/(builder)/stores/[storeId]/editor/catalog.server.ts`; `packages/store-sections/src/sections/commerce/*`; a `CatalogResolver` interface implemented in ecommerce (P5-02) and the dashboard.
- Requirements: §8.2 product binding with the store catalog mode.
- Tests: isolation test 4.
- **Done 2026-10-18 (`f59a774`).** The pickers and commerce sections came with `d2a1fa6`/`3983b6d`. This commit adds the **store catalog mode** (D24):
  - `@workspace/lib/stores`: `storeCatalogInputSchema` (`all | selected`, ≤ 1,000 ids, deduped, order kept, strict). `@workspace/lib/stores/server` (`stores/catalog.server.ts`):
    - `getStoreCatalog` / `setStoreCatalog(sellerId, storeId, …)` lock the seller's active store, check every id is this seller's product (any status) → `invalid_product`, and replace `store_products` with `position` = the seller's order. `selected` with no products → `empty_selection`. Switching back to `all` keeps the selection.
    - `storeSellsProduct(storeId, productId)` is public, keyed by the host's store: an active product of the store's seller and, in `selected` mode, a pick.
    - `cartProductsOutsideStoreCatalog(cartId)` is the checkout guard.
  - Cache: `storeTags.catalog(sellerId, storeId)` + `invalidateStoreCatalog` (also purges the store profile, which carries the mode).
  - Dashboard: new tab **Store settings › Catalog** (`/stores/[storeId]/settings/catalog`, `saveStoreCatalog`). It has a mode radio and a searchable product checklist (picks first, status badge for non-active products, "select/clear shown"), and is registered in `DASHBOARD_ROUTES`. The editor's product/category pickers (`loadEditorCatalog`) list only the store's picks in `selected` mode.
  - Storefront (ecommerce):
    - `getProducts` gained a `catalogStoreId` filter (`EXISTS store_products`, tagged `store:catalog`). `catalogStoreId(store)` is set only in `selected` mode. It is used by the legacy catalog, the Classic catalog part, builder sections (`resolveStoreCatalog`) and `getStorefrontCategories` (counts only picks).
    - The storefront product page sends an unpicked product to the marketplace (like another seller's product).
    - `addToCart` refuses products the cart's store doesn't sell. `createOrder` refuses a storefront cart holding a product the store dropped after it was added, **before** `placeOrderFromCart`, so `place-order.ts` is unchanged.
  - **Deviation:** the catalog mode is on its own **Catalog** tab, not inside General (§7.3), because the product checklist is too large for the General form. No migration was needed (`store_products` and `catalog_mode` come from `0050`); there is no audit row (the `store_settings_audit` section CHECK has no `catalog`).
  - Tests: `catalog.integration.test.ts` 7/7 on staging (isolation test 4: B's products never sell on A's stores, A can't pick B's products, B can't read or change A2's catalog, A2 sells only its active picks while A1 stays `all`; order/replace/keep-on-`all`; checkout guard; empty selection and archived store refused). `stores.lib` schema test, cache `invalidateStoreCatalog` test. lib 413/413 on staging.
  - **Checked on staging** (ecommerce dev server): `faster` (51 products) switched to `selected` with 2 picks, then the revalidate webhook. Home lists exactly the 2 picks, a picked product page → 200, an unpicked one → 307 to the marketplace. Restored to `all` (0 rows); home is back to 21 cards per page. The first request after the webhook is still stale (the existing `revalidateTag(tag, "max")` stale-while-revalidate).
  - **Manual browser check still to do (owner):** on `/stores/<id>/settings/catalog` switch a second store to "selected", pick 2 products, save, and check the storefront. Try to add an unpicked product from an old cart link (refused). Switch back to "all".

**P4-08 · P1 · deps: P4-06, P5-01** Preview: canvas preview, plus "Preview on my store" with an HMAC token (`STORE_PREVIEW_SECRET` [Proposed env], ≤15 min, bound to the store id + draft versions).
- Tests: isolation test 8.

**P4-09 · P1 · deps: P1-06, P4-01** Media library.
- Files: adapt the reference `components/media-library/media-library-client.tsx` and `website-builder/media/*`; reuse the upload pattern of `components/inputs/use-seller-upload.ts` against the `store-media` bucket (path `{sellerId}/{storeId|shared}/…`).
- Requirements: a server action records each upload in `media_assets` after validating path, size and type; folders; shared vs per-store assets; delete removes the object and the row.
- Tests: isolation test 12.

**P4-10 · P2 · deps: P1-02, P4-02** Forms (§8.4).
- Files: adapt the reference `components/forms/*` + `actions/form-actions.ts` (read-only source) → [Proposed] `apps/dashboard/app/(main)/stores/[storeId]/website/forms/*`, a contact-form section in `packages/store-sections`, and an ecommerce submission action `apps/ecommerce/lib/store-forms/submit.server.ts`.
- Requirements: §8.4 (host-resolved store, honeypot, rate limit, validation, hashed IP, optional notification email through the backend).
- Tests: isolation test 10; replay and flood handling.

**P4-11 · P2 · deps: P1-02, P4-02, P5-01** CMS (§8.5).
- Files: adapt the reference `components/cms/*` (collections overview, schema editor, record editor/table) without API keys or CSV → [Proposed] `apps/dashboard/app/(main)/stores/[storeId]/website/content/*`; CMS list/detail sections; ecommerce routes for `/{collection}/{slug}` (P5-01b).
- Requirements: draft/published items, revisions on save, SEO per item; published items only on public hosts.
- Tests: store isolation; a draft item is never public.

**P4-12 · P1 · deps: P4-04** Website › Overview (`/stores/[storeId]/website`): preview, live URL, site status / unpublished changes, Edit · Preview · Publish, revision history, cards to the other website pages. Adapt the reference `components/website/{website-detail,website-summary-card}.tsx`.

**P4-13 · P1 · deps: P4-01** Website › Design system (`/stores/[storeId]/website/design`): colors, typography (AR/EN font pairings), brand (logo, favicon, banner), buttons and radius, live preview. Writes the `store_design_systems` draft (live on publish). Adapt the reference `components/website/design-system-editor.tsx` and `components/design/*`.

**P4-14 · P1 · deps: P5-00** Website › Domain & SEO (`/stores/[storeId]/website/domain`): domain tab (re-pointed `store-link.client.tsx` + `custom-domain.client.tsx` with `storeId`; old-address redirects list), SEO tab (title template, description, share image, indexing switch, Search Console verification token validated as `[A-Za-z0-9_-]{10,100}` and rendered as a meta tag only), sitemap/robots tab (read-only).
- Tests: the verification token cannot inject markup; SEO changes invalidate only this store.

**P4-15 · P1 · deps: P4-02** Website › Social media (§8.8): platform list with icons, validation per platform, ordering; the builder chrome and Classic footer render them live.
- Tests: URL validators per platform; links render on this store only.

**P4-16 · P1 · deps: P1-02, P4-02, P5-01** Website › Blog (§8.9): system `blog` collection, post editor (tiptap, sanitized), pre-bound blog sections, `/blog` and `/blog/[slug]` routes on the store host, sitemap entries, Article structured data. Can ship before the generic CMS UI (P4-11).
- Tests: draft and scheduled posts are not public; store isolation; a blog section with no posts shows an empty state.

**P4-17 · P2 · deps: P4-06** Website › Pages (`/stores/[storeId]/website/pages`): page list outside the editor (rename, reorder, SEO, navigation visibility), sharing the P4-04 actions.

---

### Phase 5 — Independent storefront rendering (host → store)

**Phase acceptance:**

- Every host resolves to the right store; existing subdomains, custom domains and redirects work unchanged.
- Stores with a published revision render it; others render the default theme.
- SEO per host is correct.
- Publishing updates only that store within seconds.

**P5-00 · P0 · deps: P1-02, P1-07** Host → store resolution.
- Files: `apps/ecommerce/lib/storefront.server.ts`, `lib/custom-domain-lookup.ts`, `packages/lib/src/storefront/custom-domains.server.ts`, `apps/ecommerce/proxy.ts`, cart/checkout actions using `activeCartWhere` (all verified).
- Requirements: §10.1. The store is the scope of cart, catalog and order (`orders.store_id`), with `store_seller_id` still written.
- Tests: regression on every existing subdomain type (current, renamed → redirect, custom domain, inactive domain 404); a second store of the same seller has its own cart; adding a non-selected product is refused.
- **Done 2026-10-17 (`dd46b73`), done early (right after P3-03), because stores created on `/stores` were otherwise unreachable.**
  - `getStorefrontBySubdomain` reads `stores` (active, not deleted, seller approved) and returns the **same shape** as before. `id` is still the owning seller (products and categories are per seller), plus `storeId`, `isPrimaryStore` and `catalogMode`. Profile fields come from the store: name, description, logo, banner, contact, policies, category. Ratings and governorate come from the seller.
  - Renamed subdomains resolve through `seller_subdomain_redirects.store_id`. Custom domains resolve through `seller_custom_domains.store_id` (`packages/lib/src/storefront/custom-domains.server.ts`, plus an integration test with a domain on a non-primary store).
  - Carts: `getCartScope()` (from the host only) and `activeCartWhere(userId, scope)` filter by `carts.store_id`. `store_seller_id` is still written. Guest-cart merge keeps the scope. Orders get `store_id` from their cart via the `0050` trigger; `place-order.ts` is unchanged.
  - The cache key moved to `storefront-v4`, with the same tags. Dashboard create/archive/restore invalidate the store's subdomain tag, because a cached "not found" would otherwise hide a new store for up to an hour.
  - **Deviation:** `catalog_mode = 'selected'` filtering (listing, product page, add-to-cart guard) is **not implemented yet**. Instead `catalogMode` was removed from the settable settings, so no store can enter that mode before the product picker (P4-07 / D24) and the filter ship together. Every store shows the seller's whole catalog (the D24 default). **Resolved 2026-10-18 by P4-07** (listing, categories, product page, add-to-cart and checkout guards).
  - **Checked on staging** (ecommerce dev server, `*.localhost:3000` hosts):
    - backfilled store `bein-sport`: home and cart 200, unchanged content;
    - primary `qa-owner-store`: 200;
    - **second store `qa-owner-two`: 200 with its own name and description;**
    - renamed `qa-owner-old` → 307 `qa-owner-two`;
    - archived `qa-owner-archived` → 404; unknown subdomain → 404; `/storefront/*` on the marketplace host → 404.
    - "A second store has its own cart" is enforced by the `store_id` cart filter. The click-through (add to cart on two stores of one seller) is still manual.

**P5-01 · P0 · deps: P4-03, P4-04, P5-00** Published rendering + custom/CMS page routes (P5-01b).
- Files: `apps/ecommerce/app/[locale]/storefront/[subdomain]/{layout.tsx,page.tsx}`, `lib/storefront-routing.ts` (verified).
- Requirements: §10.2–10.3.
- Tests: legacy DOM unchanged for backfilled stores; published render; unpublished → default theme; zero products → empty state + noindex; archived → 404; unknown section skipped.
- **Done 2026-10-17 (`72d9432`).**
  - Storefront layout: with a published revision (`getCachedPublishedSite`, `lib/store-site/published-site.server.ts`), the header/footer come from the snapshot (`StoreSiteChrome`), the root gets `sf-site` + `SiteTheme`; otherwise the legacy header/footer exactly as before. Home page: the published home page (`StoreSitePage`) or the legacy page. **Builder pages** `/{slug}` (P5-01b): `lib/storefront-routing.ts` rewrites a single lowercase slug to `storefront/[subdomain]/pages/[pageSlug]`; a slug that is not a published page **redirects to the marketplace**, as unknown paths did before. SEO title/description/noindex/OG image per page.
  - Classic parts are drawn by the existing components (`renderClassic` in `_components/store-site.tsx`), with the legacy spacing reproduced.
  - **Checked on staging** (dev server, `qa-owner-store`): legacy HTML vs published Tallaby Classic — **identical visible text and class lists**, except the added `sf-site` root class and the catalog wrapper (same spacing). Custom page `/about` (rich-text + product grid + highlights) renders between the classic header/footer; `/deals` still redirects to the marketplace. On `faster` (51 products) a published product grid showed the 4 newest products with storefront links and category cards; the store was **unpublished and its draft restored afterwards** (its `first_published_at` stays set on staging).
  - Tests: routing (4: home/cart/products, builder slugs incl. `/en/...`, old redirects kept, shared pages untouched); ecommerce 115. Renderer behaviour (unknown section skipped, empty states) is covered in `@workspace/store-sections`.
  - Not done: noindex for a store with zero products (moves to P5-04 with robots/sitemap); store policy pages for the new footer (the `policies` list is empty until a store policy route exists); social links in the context (P4-15).

**P5-02 · P0 · deps: P5-01, P4-07** Catalog resolvers in ecommerce (`apps/ecommerce/lib/store-sections/catalog-resolver.server.ts` [Proposed]), using the store catalog rules and existing product tags plus `store:catalog:<id>`.
- **Mostly done 2026-10-17 (`72d9432`)**, as `apps/ecommerce/lib/store-site/catalog.server.ts` `resolveStoreCatalog(sellerId, queries, locale)`: newest / featured / category (store category keys or ids) / selected (new optional `productIds` filter on the shared `getProducts`, order kept), only this seller's active products, so a picked product of another seller never shows. Products that need a variant choice get no quick add-to-cart (the card links to the product page). Categories from `getStorefrontCategories`. Uses the existing product tags (`getProducts` is cached per filter). ~~**Open:** `catalog_mode = 'selected'` (store-level catalog, D24) and the `store:catalog:<id>` tag come with the product picker (P4-07).~~ **Done 2026-10-18 with P4-07:** `resolveStoreCatalog(sellerId, catalogStoreId, …)`, tag `store:catalog:<sellerId>:<storeId>`.

**P5-03 · P0 · deps: P5-01** Cache tags + invalidation (`packages/cache/src/{tags.ts,invalidate.ts}` + `invalidate.test.ts`, verified). Add store-scoped tags; mutations emit only their store's tags.
- Tests: isolation test 9.
- **Done 2026-10-17 (`2e1e904`, `72d9432`).** `storeTags = { integrations(sellerId, storeId), site(sellerId, storeId) }` (seller id in every tag, CLAUDE.md rule 8), `invalidateStoreIntegrations`, `invalidateStoreSite(sellerId, storeId, subdomain)` (+ tests that a sibling store's tag is never emitted = isolation test 9 at the descriptor level). Editor publish/unpublish and the Apps page use them. The storefront profile keeps its existing `seller:subdomain:<sub>` tag (per store already). Checked live: after publish + the revalidate webhook, the next request served the new site.

**P5-04 · P1 · deps: P5-01** Host-aware robots and sitemap (`apps/ecommerce/app/robots.ts`, `app/sitemap.xml/route.ts`, `app/sitemaps/[file]`, `lib/sitemap/*` — verified). Per-store sitemap; no-product stores excluded; marketplace output unchanged.
- Tests: extend `sitemap.lib.test.ts`; run `audit:sitemap`.

**P5-05 · P0 · deps: —** Keep marketplace tracking off storefronts (`apps/ecommerce/app/[locale]/layout.tsx`, `components/meta/meta-pixel.tsx` — verified).
- Acceptance: storefront HTML contains no Tallaby pixel.
- **Done 2026-10-17.** Broader than the plan: besides the Meta pixel, Tallaby's **GA4** tag (was hard-coded in `components/layout/structured-data.tsx`, now `components/layout/google-analytics.tsx`), **PostHog** (`instrumentation-client.ts`) and the **Elfsight** support chat also load only on the marketplace host.
  - `isMarketplaceHost(host)` in `@workspace/lib/storefront` (+ tests) = a platform host without a store subdomain.
  - Client components use `useIsMarketplaceHost()` (`lib/marketplace/marketplace-host.client.ts`), which renders nothing on the server, so the shared root layout stays static and storefront HTML carries no Tallaby tag. The pixel's `<noscript>` image fallback was dropped for the same reason.
  - Server Meta CAPI events (AddToCart in `actions/cart.ts`, Purchase in `actions/order.ts`, InitiateCheckout in `actions/meta.ts`) are skipped on storefront hosts via `isMarketplaceRequest()`.
  - Checked on the local dev server against staging: `qa-owner-store.localhost:3000` HTML has no `fbevents`, `G-ET1FTMXB9X`, `posthog` or `elfsight`. Tallaby's JSON-LD (WebSite/Organization) still renders on storefronts; it is SEO, handled with P5-01/P5-04.

---

### Phase 6 — Platform fee, trial and store wallet

**Phase acceptance:**

- Orders placed after the switch-over carry correct fee snapshots for every seller (0 during a new seller's trial).
- Delivery posts the right store-wallet entries exactly once (gross `sale` + `fee`, or `fee` only when the seller collected the cash).
- The trial starts exactly once (§13.5).
- Sellers can top up with Kashier and see a signed balance.
- Ads can be paid from the wallet.
- Non-commission order maths is unchanged.

**P6-01 · P0 · deps: P0-05** Fee function + tests.
- Files [Proposed]: `packages/lib/src/orders/platform-fee.lib.ts`, `platform-fee.lib.test.ts`; export from `packages/lib/src/orders/index.ts` (verified).
- Requirements: §13.2. Pure and integer-based. Includes `allocateFeeAcrossLines` (reuse `allocateDiscountAcrossLines`), `isTrialActive(seller, at)` and `eligibleSubtotalForSeller(lines)` (D2 rule).
- Tests: §13.1 table, boundaries, cap under EGP 5, allocation sums exactly, trial and exempt cases.
- Acceptance: 100% branch coverage of the module.
- **Done 2026-10-17 (`468fd4e`).** `packages/lib/src/orders/platform-fee.lib.ts` (27 tests), also exported as the pure subpath `@workspace/lib/orders/platform-fee` for UI code. Additions: a `FEE_PLANS` registry + `resolveFeePlan` (unknown → standard), `toPiastres`, `computeSellerPlatformFee(seller, lines, at)` returning the fee, per-line split, effective rate (for `order_items.commission_rate`) and the `metadata.platformFee` snapshot. The fee is capped at the eligible subtotal. Branch coverage was checked by reading the tests: `@vitest/coverage-v8` is not installed, and adding it needs approval.

**P6-02 · P0 · deps: P6-01, P2-01** Migration `0059_seller_platform_fee.sql` + schema mirror (§11.9). `ensureSellerAccount` sets `fee_trial_eligible = true`. Record the switch-over date. Rollback: the code ignores the columns if reverted (5% constant still in git history).
- **Done 2026-10-17 (`49d4c34`). Applied on staging twice (idempotent), not on production.** Differences from §11.9:
  - `fee_trial_eligible` is added with `DEFAULT false` (so the 12 existing staging sellers are not eligible, D5) and then switched to `DEFAULT true`, so **every** new seller is eligible, including sellers still created by the legacy `/onboarding` wizard. `ensureSellerAccount` also sets it explicitly (integration test extended).
  - `fee_plan_effective_at` defaults to `now()`, so for existing sellers it records when the migration ran. **Apply `0059` on production together with the P6-04 deploy** and record that time in §23 as the switch-over.
  - Extra CHECK: `fee_trial_ends_at > fee_trial_started_at`.

**P6-03 · P0 · deps: P6-02 (the Publish hook also needs P4-04; add it when P4-04 lands)** Trial start.
- Requirements: `startFeeTrialIfNeeded(tx, sellerId, trigger)` called from `publishStoreSite` (P1-04) and from every product transition to `status = 'active'` (find the call sites in `apps/dashboard/actions/products.ts` — call only; do not add logic there — and admin product approval in `apps/admin`). The rule is per D20.
- Tests: publish twice; product activated then publish; unpublish + republish; concurrent triggers; template change → trial dates unchanged; old seller (not eligible) → never starts.
- Acceptance: `fee_trial_started_at` set once.
- **Done 2026-10-17 (`9765188`), with a DB trigger instead of calls in the product actions** (same approach as P1-07):
  - The rule is the SQL function `start_fee_trial_if_needed(seller, trigger)` in `0059` (conditional UPDATE, 30 days, returns true only for the call that started it; EXECUTE revoked from `anon`/`authenticated`).
  - Triggers `products_start_fee_trial_insert/_update` call it when a product is created `active` or first changes to `active`. This covers the dashboard (`setProductPublished`, create), admin approval (`apps/admin/actions/products.ts`) and any import, so `apps/dashboard/actions/products.ts` is untouched.
  - `publishStoreSite` calls `startFeeTrialIfNeeded(tx, sellerId, "publish")` (`@workspace/lib/sellers/server`) in its transaction.
  - New column `sellers.fee_trial_start_trigger` (`publish | product_active | admin`) records what started it.
  - 8 integration tests on staging: publish twice, unpublish + republish, template change, product then publish, product created active, second store, 6 concurrent triggers → started once, ineligible seller never starts, inconsistent dates rejected.

**P6-04 · P0 · deps: P6-01, P6-02** Order placement integration.
- Files: `packages/lib/src/orders/place-order.ts`, `place-order.lib.ts` (verified).
- Requirements: load `sellers.{fee_plan, fee_trial_*, is_commission_exempt}` for the cart's sellers (one query). Compute the fee per seller group for all order sources. Write line fields + `metadata.platformFee`. Remove the use of `PLATFORM_COMMISSION_RATE` from placement (keep the constant exported only if something else imports it; check first).
- Tests: snapshot test that every non-commission field is unchanged versus the current code for marketplace, storefront and external orders; fee cases for one seller and several sellers (D22); trial; exempt; seller coupon; COD and wallet payments unaffected.
- Acceptance: tests pass, and a manual checkout on staging shows the correct fee in admin order detail.
- **Done 2026-10-17 (`8a78df4`).**
  - `placeOrderFromCart` loads `fee_plan`, the trial dates and `is_commission_exempt` for the cart's sellers in one query, after the coupon step, and applies `computeOrderLineFees` (new in `platform-fee.lib.ts`): per seller, per order (D22), on line totals after the seller's own coupon (D2). Each line gets `commission_amount` (its share, exact sum), `commission_rate` (effective rate, display only: 0.02 normally, up to 1 when the fee is capped at a sub-EGP 5 order), `seller_earning = total − share` and `order_items.metadata.platformFee` (the §13.2 snapshot). `orders.metadata` is not touched (the wallet path overwrites it).
  - `PLATFORM_COMMISSION_RATE` is no longer used by placement; it stays exported for legacy orders in the admin price editor.
  - **Extra (not in the plan):** the admin order price editor (`apps/admin/actions/orders.ts` `updateOrderPricing`) recharges orders that carry a `platformFee` snapshot with the same rules as of the order date; older orders keep scaling their 5% rate. The dashboard product form's "You receive" estimate (`lib/utils/product-pricing.lib.ts`) now uses the fee for a one-unit order and the trial (4 tests).
  - Tests: `place-order-fee.integration.test.ts` (3, staging) runs the real `placeOrderFromCart`: 5 sellers (regular, trial, exempt, EGP 3 order) and seller vs Tallaby coupons. Its subtotal, shipping, tax, discount and total were recorded from the pre-change code with the same cart and pinned, so non-fee maths is proven unchanged. COD/wallet payment code is untouched by this change and not re-tested. lib suite on staging 337/337, dashboard 90.
  - Manual check still to do (owner): a checkout on staging, then the fee in admin order detail.
  - **Delivery credit is unchanged:** `creditSellerOnDelivery` still credits the summed `seller_earning` (net), so the store wallet sees the new fee through the existing single `sale` row until P6-05 splits it into `sale` + `fee`.

**P6-05 · P0 · deps: P6-04, user approval** Store wallet core.
- Files: `packages/db/migrations/0060_store_wallet.sql` [Proposed]; `packages/db/src/wallet/store-wallet.ts` [Proposed] + `store-wallet.integration.test.ts`; rewrite `packages/db/src/wallet/credit-seller-on-delivery.ts`; call it from `apps/admin/actions/orders.ts` (delivered) as well as the existing shipping and seller paths.
- Requirements: §11.10 and §13.4. Entries carry `store_id` (from `orders.store_id` for storefront orders; NULL for marketplace orders and account-level entries). Run the read-only pre-checks first; if they find problems, stop and report. Add `resolveCollectionParty` + tests. Keep the legacy single-row behaviour for orders delivered before the switch-over.
- Tests: integration: double and concurrent delivery → entries once; negative balance allowed for `fee`; replay of the same reference → no change; balance equals the sum of entries; append-only trigger blocks UPDATE/DELETE.
- Acceptance: tests pass with `TEST_DATABASE_URL`. Pre-check output recorded in §23.
- **Done 2026-10-17 (`6de2d1d`), staging only (owner-approved).**
  - Pre-checks (§23) found one wallet with a balance but no entries; owner chose an opening-balance `adjustment`, written by a separate **`0061_store_wallet_opening_balances.sql`** (a new enum value cannot be used in the transaction that adds it). Next migration number is now `0062`.
  - `0060` as §11.10, plus: a store-owner trigger on ledger inserts (an entry's `store_id` must belong to its seller), `negative_limit >= 0` CHECK, an extra unique `(provider, provider_reference)` and `created_by` on `seller_wallet_top_ups`, and indexes on `store_id`/`order_id`. The append-only trigger allows only FK `SET NULL` clean-ups and the cascade when the seller account itself is deleted.
  - `packages/db/src/wallet/store-wallet.ts`: `postStoreWalletEntry` (type/sign validation, lazy wallet row, single `UPDATE … RETURNING` with optional negative-limit guard, ledger insert with before/after, `sellers.wallet_balance` mirror, all inside a savepoint so a duplicate leaves the caller's transaction usable → `DuplicateStoreWalletEntryError`), `postStoreWalletEntryOnce`, `getStoreWalletSummary`.
  - `collection-party.ts` `resolveCollectionParty`: `seller` when `metadata.paymentCollector = 'seller'`, or cash on delivery with the seller's own shipment (`shipments.seller_id` = that seller, which only dashboard rider shipments set); otherwise `tallaby`. Wallet-partial remainders are Tallaby manual methods, so no mixed case exists today.
  - `creditSellerOnDelivery` rewritten: fee-snapshot orders → gross `sale` + `fee` (or `fee` only); pre-P6-04 orders → the legacy single net `sale`; never posts on top of a legacy unreferenced `sale` row. Storefront orders carry `store_id`.
  - Admin `updateOrderStatus('delivered')` now marks open lines delivered and calls `creditSellerOnDelivery` (it credited nothing before).
  - Tests: `store-wallet.integration.test.ts` 11/11 on staging (gross + fee once, 5 concurrent deliveries, seller-collected fee-only going negative, Tallaby-rider COD, paymentCollector, multi-seller, legacy net sale, legacy row guard, replay in a usable transaction, validation, negative limit / fee ignores it / frozen wallet, append-only + cross-store store id). Cleanup leaves no rows.
  - **Not done here:** readers that label entry types (dashboard `/financial`, admin) still only know `sale|refund|withdrawal|fee`; P6-06 reworks the wallet page.

**P6-06 · P1 · deps: P6-05** Dashboard store-wallet page.
- Files: `apps/dashboard/app/(main)/financial/page.tsx`, `actions/payouts.ts` (verified; new read functions in new colocated files, e.g. `financial/store-wallet.{server,data,client}.tsx` [Proposed]).
- Requirements: balance (positive or negative, colour-coded), entries with filters, fee per order, trial card, "Top up" button, explanation of the fee (2%, min EGP 5, shipping excluded). AR/EN.
- Acceptance: numbers equal the ledger sums.
- **Done 2026-10-17 (`69fc584`).** A store-wallet section at the top of `/financial` (the existing earnings/payout cards stay below it). Files `financial/store-wallet.{server.ts,data.tsx}` and `page.tsx` (now `requireSeller`).
  - Shows the signed balance (green/red), this month's sales and fees (Cairo month), a below-zero notice, the trial (days left or "starts when your store goes live"), how the fee works (2%, min EGP 5, shipping excluded), and every entry with filters (all / sales / fees / top-ups / other), store (or "Account"), linked order, amount and balance after. Paging uses a `(created_at, id)` cursor, because a delivery's sale and fee share one timestamp.
  - Reads are fresh (no cache) and scoped to the session seller; the store join re-checks the store's owner.
  - Smoke-tested on staging: the "Tallaby" seller shows 538.20, ledger total 538.20, one opening-balance entry; filters and the cursor work.
  - The "Top up" button comes with P6-09. Labels for `service_charge` / `fee_reversal` added to `status.transaction`.

**P6-07 · P1 · deps: P6-03** Trial notifications + banner (§13.5). Idempotent via `email_deliveries`.
- **Done 2026-10-17 (`96499f1`).**
  - Pure `getFeeTrialStatus` / `feeTrialReminderStage` in `@workspace/lib/sellers` (16 tests). Stage `t7` in the last 7 days, `t1` in the last day; a missed run is caught up the next day, and a seller already in the last day only gets `t1`.
  - Dashboard home: `TrialBannerData` above the setup checklist (days left + end date, accent tone in the last week; or "your trial starts when your store goes live" for eligible sellers not started yet). Nothing for old sellers or after the end. AR/EN `home.trial.*`. This also covers the P3-04 trial banner.
  - Email: `FeeTrialReminderEmail` in `@workspace/emails` (AR/EN copy). The backend route `POST /api/emails/fee-trial-reminder` re-reads the seller, sends only if the stage is due now, and claims `fee_trial_reminder_t7|t1` per seller in `email_deliveries` (+ Resend idempotency key).
  - Cron: `apps/ecommerce/app/api/cron/fee-trial-reminders` daily at 07:00 UTC (`vercel.json`), `CRON_SECRET`, uses the existing `BACKEND_API_URL`/`INTERNAL_API_SECRET`. New optional backend env `DASHBOARD_URL` (defaults to `https://dashboard.tallaby.com/`).
  - Deviation: there is no dashboard notifications inbox (the `notifications` table is customer-facing and unused by the dashboard), so the "dashboard notification" is the banner.
  - Not run live: no staging seller is within 7 days of a trial end, and the local `BACKEND_API_URL` points at production. Manual check (owner): set a staging seller's `fee_trial_ends_at` to tomorrow, call the cron with the secret, confirm one email and a second call → `duplicate`.

**P6-08 · P1 · deps: P6-05, D21** Negative-balance policy: warning banners, `negative_limit` check for optional purchases, admin list filter "negative wallets".
- **Done 2026-10-17 (`9945527`), D21 at the recommended default.** Fees always post. Optional purchases (`enforceNegativeLimit`) may not go below `-negative_limit`, and **`NULL` means 0** (`DEFAULT_NEGATIVE_LIMIT`; changed from "no limit" in §11.10, so nobody overdraws for ads unless an admin sets a limit). Dashboard: a notice below 0 and a stronger one at or below EGP −500 (`NEGATIVE_ALERT_EGP`). Admin sellers list: a "Wallet" filter (negative / zero or positive), and negative balances in red. Setting `negative_limit` per seller is left to the P9-02 admin overrides.

**P6-09 · P0 · deps: P6-05** Kashier store-wallet top-up (create).
- Files: reuse `packages/lib/src/kashier/*` (verified) for building the payment. [Proposed] `apps/dashboard/app/(main)/financial/top-up.server.ts`.
- Requirements: amount limits (min/max, D23); create `seller_wallet_top_ups` (`pending`, provider `kashier`, reference `stopup_<uuid>`); redirect to Kashier; return page shows "processing" until the webhook confirms.
- Security: `requireSeller({forWrite:true})`. Amount from server validation only.

**P6-10 · P0 · deps: P6-09** Kashier webhook branch.
- Files: `apps/backend/src/routes/kashier.ts` (verified), new `apps/backend/src/lib/store-wallet-top-up.ts` [Proposed] modelled on `wallet-top-up.ts`.
- Requirements: verify the signature (existing), detect `stopup_`, claim with a status guard, check the amount, call `postStoreWalletEntry(top_up)` in one transaction. Failure states update the row. Order-payment handling is unchanged.
- Tests: replayed webhook → one credit; amount mismatch → failed, no credit; unknown reference → ignored with 200.
- **P6-09 + P6-10 done 2026-10-17 (`4fd5783`).**
  - D23 taken at the suggested default: **EGP 50 to 20,000** per top-up (`STORE_TOP_UP_*` in `@workspace/lib/store-wallet`; owner can change).
  - `@workspace/lib/store-wallet/server`: `startStoreTopUp` (pending row, `merchantOrderId = stopup_<topUpId>`, one Kashier session per row, session id in metadata; a session failure marks the row failed), `applyStoreTopUpWebhook` (row `FOR UPDATE`, only from pending/processing; SUCCESS checks amount in piastres and currency EGP, then `postStoreWalletEntry(top_up, reference top_up:<id>)` and `succeeded`; mismatch → `failed` with the reason, no credit; FAILURE → failed; PENDING → processing; unknown id → ignored), `getStoreTopUp` (own seller only).
  - Backend `routes/kashier.ts`: after the existing signature check, `stopup_` references go to `applyStoreTopUpWebhook` (non-`pay` events acked as ignored; duplicate → 409 ack, like orders). The order-payment code path is unchanged; `parseKashierOrderReference` never matches a `stopup_` reference (tested).
  - Dashboard: a "Top up" button + dialog on the wallet card (`financial/top-up.{client,server}`), rate-limited 10/10 min, `requireSeller({ forWrite })`; return page `/financial/top-up?topUp=<id>` shows only the stored status (processing / received / failed). AR/EN `storeWallet.topUp.*`. Kashier env vars added to `apps/dashboard/.env.example` (**set them in Vercel for the dashboard**; `KASHIER_WEBHOOK_URL` = backend `/api/kashier/webhook`).
  - Tests: 4 unit + 5 integration on staging (3 concurrent identical webhooks → 1 credit + 2 duplicates; mismatch; wrong currency; pending → success; failure; unknown id).
  - Not run end to end: no Kashier test credentials in this environment. Manual check (owner, Kashier test mode): top up EGP 50, pay with a test card, see "Top-up received" and a `top_up` row in the wallet.

**P6-11 · P1 · deps: P6-05** Pay ads from the wallet: add a `wallet` payment option to `apps/dashboard/app/(main)/marketing/` (`ad_campaign_requests`); post a `service_charge` on submit; post a compensating `adjustment` on admin rejection. The `/marketing` Vodafone Cash flow stays.
- **Done 2026-10-17 (`9945527`).** The payment step offers Vodafone Cash or Store wallet (balance and balance-after shown; wallet-specific consent text and success toast). `createAdRequest` inserts the request and posts `service_charge −price` (reference `ad_request:<id>`, `enforceNegativeLimit`) in one transaction; errors `insufficient_balance` / `wallet_not_active`. `refundRejectedWalletAdRequest(requestId, actorId)` (`@workspace/lib/store-wallet/server`) posts the compensating `adjustment` once.
  - **Gap found:** there is **no admin screen for ad requests** (only the dashboard creates them; status changes happen outside the apps). Whatever rejects a wallet-paid request must call `refundRejectedWalletAdRequest`. Proposed: a small admin ad-requests page in Phase 9.
  - Tests: 3 integration on staging (charge and roll back with the request when it would overdraw, refund once, no refund for Vodafone Cash or unknown ids) + the store-wallet limit test (`NULL` limit = no overdraft).

**P6-12 · P2 · deps: D3, Kashier refunds work** Refund handling (deferred by the owner). This placeholder only reserves `refund` / `fee_reversal`. Plan it together with the Kashier integration.

---

### Phase 7 — Apps and integrations

**Phase acceptance:**

- Sellers can connect/disconnect Meta Pixel, GA4 and (per D18) GTM.
- Events fire only on their storefront.
- Secrets are encrypted.
- Isolation tests 6–7 pass.

**P7-01 · P0 · deps: P1-02, P1-03** (table already created by `0056_store_integrations.sql` in P1-02) `packages/lib/src/integrations/{registry,crypto,validate}.ts` [Proposed] + tests (encrypt/decrypt round-trip, wrong key fails, ID regexes).
- **Done 2026-10-17 (`dc3095b`).** `@workspace/lib/integrations` (pure: `registry.ts`, `validate.ts`) and `@workspace/lib/integrations/server` (`crypto.server.ts`), 23 tests.
  - Registry = the 0056 CHECK list. `available`: Meta Pixel, GA4, GTM (D18 accepted: GTM allowed with a seller-scripts warning). `soon`: Meta CAPI, TikTok, Snapchat, Google Sheets, Shopify import. **WhatsApp click-to-chat (§9.2) is not in the 0056 CHECK**, so it needs a migration when it is built.
  - IDs: Pixel `^\d{15,16}$`, GA4 `^G-[A-Z0-9]{6,12}$`, GTM `^GTM-[A-Z0-9]{5,10}$`, TikTok `^[A-Z0-9]{20}$`, Snapchat uuid. `validateIdentifierConfig` normalises pasted ids; `readIntegrationId` re-checks a stored config before rendering.
  - Crypto: AES-256-GCM, `v1.<iv>.<tag>.<ct>`, key `INTEGRATIONS_ENCRYPTION_KEY` (hex or base64, 32 bytes; added to `apps/dashboard/.env.example`). The store id and provider are the AAD, so a ciphertext moved to another row fails.

**P7-02 · P0 · deps: P7-01, P3-01** Apps catalog UI per store: `apps/dashboard/app/(main)/stores/[storeId]/apps/{page.tsx,[provider]/page.tsx}` + `apps.server.ts` [Proposed]. Status, connect, test, disconnect. AR/EN.
- **Done 2026-10-17 (`2e1e904`).** `app/(main)/stores/[storeId]/apps/{page,apps.client,apps.server,apps.dto}`; sidebar "Apps" flipped to `live` and added to `DASHBOARD_ROUTES`.
  - Differences from the plan: no `[provider]` detail route. Each card opens a sheet (ID field with format hint, GTM warning, save, disconnect). There is no "test" button yet: identifier apps have nothing to test server-side (it comes with Meta CAPI, P7-05).
  - Data access in `@workspace/lib/integrations/server` (`store-integrations.server.ts`): `listStoreIntegrations`, `connectIdentifierIntegration` (upsert on `(store_id, provider)`, validated id only, store must be active), `disconnectStoreIntegration` (deletes the row), `getStorefrontTracking(storeId)` for P7-03. Credentials are never selected.
  - Cache: new `storeTags.integrations(sellerId, storeId)` and `invalidateStoreIntegrations` in `@workspace/cache` (+ test). Actions call it with `applyInvalidation(…, { from: "dashboard", mode: "action" })`.
  - Tests: 7 integration tests on staging, including **§17 isolation test 6** (A1's ids never reach A2 or B1), B cannot read/connect/disconnect A's apps, bad ids, unreleased providers, archived store read-only. Dashboard 90 tests, typecheck clean.
  - Manual check (owner): open Apps on a store, connect a Pixel, see "Connected" and the id; disconnect.

**P7-03 · P0 · deps: P7-01, P5-01** Storefront injection: `apps/ecommerce/app/[locale]/storefront/[subdomain]/_components/seller-tracking.tsx` [Proposed]. Fixed templates for Pixel/GA4/GTM. The config is loaded by the **store** resolved from the host (`store_integrations.store_id`) (cached with tag). Consent per D19.
- **Done 2026-10-17 (`54e7e94`), before P5-01:** it is mounted in the existing storefront layout (`storefront/[subdomain]/layout.tsx`), which every store host already uses; P5-01 keeps it when the published renderer lands.
  - `lib/storefront-tracking.server.ts`: `createCachedQuery` keyed and tagged by `storeTags.integrations(sellerId, storeId)` (TTL `cacheProfiles.seller`), calling `getStorefrontTracking(storeId)` for the store resolved from the host.
  - `_components/seller-tracking.client.tsx`: fixed templates (Pixel PageView, GA4 config, GTM loader). Each id is re-checked with `isValidIntegrationId` before it goes into a template.
  - **Consent (D19, recommended default):** nothing loads until the visitor presses Accept on a small banner. The choice is kept in `localStorage` per store host; the banner only appears when the store has a connected app. AR/EN `storefront.consent.*`. No `<noscript>` fallbacks (they would bypass consent).
  - Only my 6 lines were committed to `apps/ecommerce/messages/ar.json`; the owner's uncommitted brand-name edits there are still unstaged.
  - **Checked live on staging** (dev server restarted with owner approval; the old one failed every page with a "Jest worker" error): with a test Pixel on `qa-owner-store`, its HTML carries the id only as the client component's prop and no `fbevents` script (consent pending); `qa-owner-two` (same seller), `bein-sport` (other seller) and the marketplace host carry no trace of it. The test row was deleted. Still manual (owner, browser): press Accept and see `fbevents.js` load.

**P7-04 · P1 · deps: P7-03** Storefront event bridge: a single `trackStorefrontEvent(name, payload)` client helper used by product page, add to cart, checkout start and the order confirmation page (Purchase with `event_id = orderId`, fired once). Reuse event shapes from `apps/ecommerce/lib/meta/*`.
- **Done 2026-10-17 (`54c10df`).** The helper is `trackCommerceEvent` (`apps/ecommerce/lib/storefront-events.client.ts`), used by the four existing call sites (`meta-view-content`, `add-to-cart-button`, `meta-initiate-checkout`, `meta-purchase`) in place of `trackMetaEvent`.
  - Marketplace host: unchanged (Tallaby's Meta pixel only; Tallaby's GA4 gets no new events).
  - Store host: Meta Pixel + GA4 `gtag('event', view_item | add_to_cart | begin_checkout | purchase)` + GTM `dataLayer` ecommerce push (`transaction_id` = order id for Purchase). Events are queued in memory until the visitor accepts and the trackers' queues exist (`markStoreTrackingReady`, polled ≤ 10 s), so a Purchase on first paint is not lost. Declined = never sent.
  - **Found and fixed:** checkout and order confirmation on a store host run outside the storefront layout, so the store's trackers were not on those pages. `components/storefront/host-store-tracking.tsx` (store from the request host via `getCartScope`) now mounts there.
  - Tests: 3 unit (marketplace passthrough, queue + GA4/GTM mapping, server no-op); ecommerce 111.

**P7-05 · P2 · deps: P7-04** Meta CAPI per seller (server, encrypted token, reuse `meta.server.ts` with injected credentials; never log tokens).

**P7-06 · P2 · deps: P7-01** Google Sheets order export (§9.2). Needs a Google Cloud OAuth app (external dependency: consent screen / verification).

**P7-07 · P2/P3 · deps: P7-01** Shopify product import (§9.2). Category mapping UI. Background batches (no job system exists; use chunked server actions or a cron, documented).

---

### Phase 8 — Optional fulfillment

**Phase acceptance:**

- A seller with no fulfillment rows can publish and sell.
- From the dashboard they can request Tallaby services (requested_* only).
- Admin activation flow unchanged.

**P8-01 · P1 · deps: P1-03** Request flow.
- Files: `apps/dashboard/app/(main)/settings/fulfillment/page.tsx` (verified); reuse `packages/lib/src/fulfillment/{validate,server}.ts` (verified); move or reuse `apps/ecommerce/components/onboarding/steps/fulfillment-step.tsx` (verified) into the dashboard.
- Requirements: §15. A new upsert-request server function for sellers with or without existing rows. Never writes `active_*`.
- Tests: extend `seller-setup.integration.test.ts`.
- Acceptance: admin sees the request in `apps/admin/app/(dashboard)/fulfillment/`.

**P8-02 · P2 · deps: —** Shipping wiring (deferred in `docs/fulfillment.md` §5): skip Tallaby dispatch for orders whose effective delivery is the seller. Only after confirming the current shipping-app behaviour. Regression tests on the shipping flows.

**P8-03 · P3** Fulfillment billing as `fee` transactions with distinct references (after agreements are in use).

---

### Phase 9 — Admin, quality and launch

**Phase acceptance:**

- Admins can see and manage site status, trial and fee plan with an audit trail.
- The security checklist is complete.
- Pilot done.
- Docs updated.

**P9-01 · P1 · deps: P5-01, P6-02** Admin seller detail additions.
- Files: `apps/admin/app/(dashboard)/sellers/[id]/*`, `sellers.server.ts` (verified).
- Requirements: the seller's **plan** and **stores list** (status, host, custom domain, site status, template, first publish, revisions view-only, force-unpublish or suspend a single store with a reason), trial dates and eligibility, fee plan, integrations status (no secrets), **store wallet** (balance including negative, entries, top-ups) and an admin `adjustment` action with a required reason.

**P9-02 · P1 · deps: P9-01** Admin overrides with audit: change subscription `plan` (only `free` exists now) and per-seller store limit exceptions (D27), change fee plan, extend or revoke trial (before start), exempt. Each change is logged (new `admin_audit_log` table [Proposed] or `sellers.verification_details` notes — decide in task; prefer a small table).

**P9-03 · P1** Monitoring: structured `console.error` with a context prefix for publish, fee and integration failures (no logging library exists). Admin view of integration errors.

**P9-04 · P0 · deps: all prior** Security review: run §17 checklist. Re-check admin self-registration (`apps/admin/actions/auth.ts`), F13 policies, secret exposure (`grep NEXT_PUBLIC_` for new secrets), bundle check for the service-role key. Use the `/security-review` skill if available.

**P9-05 · P0 · deps: P9-04** Pilot rollout per §18.3. Record results in §23.

**P9-06 · P1** Update `PROJECT.md`, `PROJECT_DESCRIPTION.md`, `docs/fulfillment.md`, `docs/wallet.md` and add `docs/store-builder.md` (contract for site configs, mirroring the style of `docs/wallet.md`).

---

### Phase 10 — Domain repositioning and marketing content (gated by D8)

**P10-01 · P2** `/sell` content rewrite per §16 (AR first, brand **طلبي**; no unsupported claims).
**P10-02 · P2** Update `MARKETING_PROJECT.md` facts (fee, trial, builder, signup) after the user confirms. The user had uncommitted edits there, so coordinate first.
**P10-03 · P3** Marketplace to `store.tallaby.com`, `tallaby.com` → seller landing. Full redirect map, canonical/sitemap/feeds/OAuth/emails/env updates (§16 item 6), staged with monitoring. Needs its own plan before execution.

---

## 20. Acceptance criteria summary

Each phase above has a **Phase acceptance** block, and every task has its own acceptance line. A phase is done only when:

1. All its tasks are accepted.
2. `pnpm lint`, `pnpm typecheck` and `pnpm test` are no worse than the P0-03 baseline.
3. The phase's manual E2E checklist is recorded in §23.
4. This file is updated.

---

## 21. Risks, assumptions and decisions

### 21.1 Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Builder port turns into a rewrite (189k lines, heavy coupling) | High | High | Curate: port the editor core + ≤30 sections; exclude AI/CMS/verticals; shared package boundary (P4-02) |
| Legacy storefront regressions when extracting the classic template | Medium | High | Pure-move commit, DOM/screenshot diff, legacy fallback path kept (P4-03) |
| Financial bugs in the fee change | Medium | High | Pure function with full tests; snapshot test proving non-commission order maths unchanged; switch-over date recorded; old orders never recomputed; approval gates (P6-04/05) |
| Duplicate seller credits / wallet entries | Low (today) | High | Unique reference index + single primitive (P6-05) |
| Negative store-wallet balances never recovered | Medium | Medium | Earnings net against debt automatically; warnings; D21 limit for optional purchases; admin visibility (P6-08) |
| Wrong "who collected the money" leads to double-charging | Medium | High | One `resolveCollectionParty` helper with tests over every payment/delivery combination (P6-05) |
| Cross-tenant data leak via cache | Low | High | Seller-scoped tags/keys; isolation tests 5, 9 |
| Seller scripts via GTM | Medium | Medium | D18; restrict to own host; terms |
| Unverified live DB state (trigger, RLS) | Medium | High | P0-04 before Phase 2 |
| Copied builder code lost | Low | High | P0-02 commits it in a quarantine path |
| Seller→store backfill breaks existing storefronts, carts or custom domains | Medium | High | Additive migration, legacy columns kept and mirrored (P1-07), branch-first with backfill checks (§11.11), P5-00 regression on every host type before builder work |
| Writes hitting the wrong store (multi-tab, switcher cookie) | Medium | High | Store id always explicit in URL + action; `requireStore` on every call; isolation test 2 |
| Plan limit bypass by concurrent creates | Low | Medium | Seller row lock in `createStore`; isolation test 11 |
| Domain move SEO loss | Medium | High | Separate Phase 10 with its own plan |
| No CI/E2E | High | Medium | D15; manual checklists recorded |

### 21.2 Assumptions (to verify)

- A1: `handle_new_user` creates `public.users` rows for new auth users (P0-04).
- A2: Supabase identity linking for Google and email is configured safely (P0-04).
- A3: Wildcard `*.tallaby.com` points at the ecommerce Vercel project (P0-04). Implied by the existing storefront code.
- A4: Upstash Redis is available to the dashboard for rate limiting (P0-04). **False (2026-10-17):** no `UPSTASH_*`/`REDIS*`/`KV_*` variable exists in any app's `.env` or code. Rate limiting for P2-02/P3-07 needs either Upstash added (owner) or a Postgres-backed limiter.
- A5: Restricted sellers may edit but not publish (confirm with the user).
- A6: The dashboard production host is the one in Vercel (F16).

### 21.3 Decisions

**Resolved by the owner (2026-10-17):**

| ID | Decision |
|---|---|
| D1 | The fee is **2% with an EGP 5 minimum per order for all old and new sellers**, on every order. Per-service fees (fulfillment, ads, themes…) will be designed later |
| D3 | **Refunds are deferred.** They will be handled with the Kashier integration. Kashier is the first payment provider; Paymob stays for now |
| D5 | **All new sellers get the trial.** Existing sellers do not |
| D7 | Before publishing / uploading products, the store shows the **normal default theme with the seller's store info and settings** (no "opening soon" page). The catalog shows an empty state until products exist |
| D8 | The marketplace move to `store.tallaby.com` waits until the Tallaby Fulfillment service is worked on (Phase 10) |
| D9 | The builder reference is Valorcy (the owner's project), GitHub `elsharkawy159/saas`, local `D:\programming projects\saas\apps\dashboard` (forms, themes and templates too). Read-only |
| D10 | **Store wallet per seller**, positive or negative, updated automatically, top-up any time, used for fees and future services (product ads, theme store, …) |
| D12 | Superseded by D1 (one fee for everyone). The per-seller `commission_rate` becomes legacy |

**Accepted at the recommended default by the owner (2026-10-17, P0-05).** The owner accepted every recommendation below as the decision. Any of them can still be overridden later; record the change here.

| ID | Question | Decision (recommended default, accepted) |
|---|---|---|
| D2 | Eligible subtotal: which amount the 2% is taken from when there are discounts (explained with an example in §13.2) | Seller's actual selling price: after the seller's own coupons, before Tallaby-funded coupons, without shipping; fee capped at the subtotal for orders under EGP 5 |
| D4 | Trial counts by order creation time or by delivery time | Order creation time |
| D6 | Collect phone at signup (no OTP) or move it to the checklist | Collect it at signup (the WhatsApp ops requirement exists) |
| D11 | Staff/team accounts per store | Defer (subscriptions may unlock it later) |
| D12b | Does `is_commission_exempt` still make a seller fee-free? | Yes, as an admin override |
| D13 | AI builder features at launch | Exclude |
| D14 | Templates storage | **Updated:** DB tables `templates` / `template_versions` / `template_installs` (created in P1-02, seeded from code), ready for the future theme store |
| D15 | Add Playwright E2E + CI | Yes (P0-06) |
| D16 | When to redirect the legacy `/onboarding` wizard | After the pilot confirms the new signup |
| D17 | Should changing the store subdomain later also change `sellers.slug`? | Keep them independent after signup |
| D18 | Allow GTM (seller-controlled scripts) on storefronts | Allow, only on the seller's own host, with terms |
| D19 | Consent banner before third-party pixels | Yes (legal check) |
| D20 | **Trial start under D7:** the store is live and sellable before any builder Publish. Start the trial at the first of {first builder Publish, first active product}? | Yes. Otherwise sellers who never use the builder would never start the trial and never pay fees |
| D21 | Negative store-wallet limit and consequences | Fees always post (can go negative); optional paid services blocked below `−negative_limit`; warnings; no automatic suspension |
| D22 | Marketplace orders with several sellers: EGP 5 minimum per seller part? | Yes, per seller (each seller pays on their own part) |
| D23 | Top-up minimum/maximum amounts | e.g. min EGP 50, max EGP 20,000 (owner to set) |
| D24 | Products across a seller's stores: one shared catalog with per-store selection, or separate products per store? | Shared catalog (`products.seller_id` unchanged); each store shows all products or a selected list (`store_products`). Stock is shared across stores |
| D25 | Fee trial per seller account or per store? | Per seller account (first store to go live starts it). Prevents a new trial by creating another store |
| D26 | Do archived stores count toward the 3-store limit, and when is a deleted store's subdomain freed? | Archived counts; deleted (admin, soft) does not; subdomain freed after 90 days |
| D27 | Can admins grant a Free seller more than 3 stores before subscriptions exist? | Yes, via an audited per-seller override (`sellers.settings.maxStoresOverride` or a column) |
| D28 | Form-submission retention period (customer PII) | 12 months, then auto-delete; owner can export earlier |
| D29 | Should storefront coupons and seller coupons be per store? | Keep coupons per seller for now (existing `channel` scope); per-store coupons later |
| D30 | Existing (backfilled) stores currently offer all Tallaby-collected payment methods on their storefront. Keep them, or switch to the new per-store settings (COD + seller wallets/InstaPay)? | New stores: COD only by default. Existing stores keep current methods until the owner decides |
| D31 | Can a seller switch their store to "own delivery" without admin approval? | Yes, self-service for seller-handled delivery (extends the fulfillment invariant; update `docs/fulfillment.md`). Switching back to Tallaby delivery stays a request |
| D32 | Auto-cancel window for unpaid manual-transfer orders (wallets/InstaPay) | 48 hours, configurable per store later |
| D33 | Is the COD fee (and any shipping) excluded from the 2% fee base? | Yes, the fee base is product prices only (consistent with D2) |

### 21.4 Reconciled documentation conflicts

- `.planning/PROJECT.md`, `ROADMAP.md`, `STATE.md` describe a Stripe Checkout milestone and a 5-step onboarding wizard. The live code uses Paymob/Kashier and auto-approval, and this plan replaces the wizard with minimal signup. **Decision:** `.planning/` is kept as history with a "superseded" note. `PLAN.md` is authoritative.
- `.planning/codebase/TESTING.md` says no tests exist. Vitest suites exist (§2.1). A note was added there.
- `PROJECT_DESCRIPTION.md` (Jan 2026) listed older versions and a pure-marketplace positioning. It has been rewritten.
- `MARKETING_PROJECT.md` states a 5% commission. It is **not edited** (uncommitted user changes). It must be updated to the decided fee and trial (P10-02).

---

## 22. Implementation checklist

Tick each box when its acceptance is met, and add the date and commit.

**Phase 0**
- [x] P0-01 Builder reference confirmed, §5 final — 2026-10-17 (§5.4 audit results; 0 unresolved modules; new packages need owner approval for P4-01)
- [x] P0-02 Copied builder code quarantined; dashboard typechecks — 2026-10-17, `4fcb815`
- [x] P0-03 Baseline recorded (§23) — 2026-10-17
- [ ] P0-04 Live facts verified (§23) _(a, b, c, f done 2026-10-17; d Auth settings and e Vercel hosts still open)_
- [x] P0-05 Decisions recorded (§21.3) — 2026-10-17, all recommended defaults accepted
- [ ] P0-06 E2E tooling (if approved)

**Phase 1**
- [x] P1-01 `@workspace/store-sections` config core — 2026-10-17, `3289639`
- [x] P1-02 Migrations `0050`–`0057` (stores + backfill, builder core, templates, media, forms, CMS, integrations, shipping zones) + Drizzle mirror — 2026-10-17, `6d2287c` (+ `0051` fix in `5e5ac5e`); applied on staging, **not on production**
- [x] P1-03 `requireSeller` / `requireStore` — 2026-10-17, `19e6a72`
- [x] P1-04 Stores + store-sites data access (plan-limited `createStore`) — 2026-10-17, `5e5ac5e`
- [x] P1-05 Isolation harness (multi-store) — 2026-10-17, `59b1f4f` (tests 1, 2, 3, 5, 11)
- [ ] P1-06 Supabase readiness (branch, advisors, `store-media` bucket + policies, backups) _(staging copy instead of a branch: done; bucket + policies on staging: done; upload test, advisors on staging and backup status: open)_
- [x] P1-07 Seller-to-store compatibility layer — 2026-10-17, `6d2287c` (DB triggers in `0050`, see the P1-07 note)
- [x] P1-08 Plans module (Free = 3 stores) — 2026-10-17, `06fe285`

**Phase 2**
- [x] P2-01 `ensureSellerAccount` (account + primary store) — 2026-10-17, `5a05995`
- [x] P2-02 Subdomain availability — 2026-10-17, `5e5ac5e` (`checkStoreSubdomain`) + `5a5eda8` (rate-limited action)
- [ ] P2-03 Signup page + OAuth _(code done 2026-10-17, `5a5eda8`; manual E2E blocked: see §23 "service_role key in NEXT_PUBLIC")_
- [x] P2-04 Existing customers → seller — 2026-10-17, `5a5eda8`
- [x] P2-05 Entry points switched — 2026-10-17, `36cc7fa` (`/onboarding` redirect waits for D16)

**Phase 3**
- [x] P3-01 Sidebar restructure (§7) + store switcher + redirects — 2026-10-17, `ee1678d` (the `/shipping` → `/orders/delivery` redirect moves to P3-06, where the page moves)
- [x] P3-02 `/stores` page (create ≤ 3, archive) — 2026-10-17, `02b3bb2`
- [x] P3-03 Store settings › General + Policies — 2026-10-17, `6122753`
- [ ] P3-03b Custom domains for non-primary stores (approval)
- [x] P3-04 Home (KPIs, checklist, trial, wallet) — 2026-10-17, `a0b1e6a` (trial banner waits for P6)
- [x] P3-05 Business & account + Plan & usage — 2026-10-17, `fc88c48`
- [x] P3-06 Orders & Shipping group (orders, delivery tracking, riders, customer timeline) — 2026-10-17, `73e0197`
- [~] P3-07 Payment methods (COD default; Vodafone Cash, e& Cash, WE Pay, Orange Cash, InstaPay with details; others Soon) — Part A (settings page) 2026-10-17, `f65ecfb`; **Part B (store checkout, seller confirmation) waits for owner approval** with P6-05
- [~] P3-08 Shipping settings (Tallaby vs own delivery, zones) — Part A (settings + zones) 2026-10-17, `ba8e783`; **Part B (checkout charge, D31 fulfillment switch, fee-only debit) waits for owner approval** with P6-05

**Phase 4**
- [x] P4-01 Editor core (Tallaby-native, no new deps) — 2026-10-18, `3983b6d`
- [x] P4-02 Shared section library — 2026-10-17, `d2a1fa6`
- [x] P4-03 Tallaby Classic (no visual change) + template seed — 2026-10-17, `ed282f2` (`0062` on staging only)
- [x] P4-04 Builder actions (store-scoped) — 2026-10-17, `2068c58`
- [x] P4-05 Templates gallery — 2026-10-18, `91830db` (merge + `0064` in `d24f6da`; see the task note)
- [x] P4-06 Editor route + pages — 2026-10-18, `3983b6d` (browser check pending)
- [x] P4-07 Catalog sections + store catalog mode (D24) — pickers/sections `d2a1fa6`, `3983b6d`; catalog mode 2026-10-18, `f59a774` (see the task note)
- [x] P4-08 Preview — 2026-10-18, `34b6684` (needs `STORE_PREVIEW_SECRET` set; browser check pending)
- [x] P4-09 Media library — 2026-10-18, `b0335fe`
- [x] P4-10 Forms — 2026-10-18, `b6b36b6`
- [~] P4-11 CMS — storefront side (routes, sections, `@workspace/lib/cms`) 2026-10-18, `643feae`; **dashboard collections/schema/record UI still to do**
- [x] P4-12 Website overview — 2026-10-18, `34b6684`
- [x] P4-13 Design system page — 2026-10-18, `d24f6da`
- [x] P4-14 Domain & SEO page — 2026-10-18, `bfc82e0`
- [x] P4-15 Social media — 2026-10-18, `d24f6da`
- [x] P4-16 Blog — 2026-10-18, `643feae`
- [x] P4-17 Pages list — 2026-10-18, `34b6684`

**Phase 5**
- [x] P5-00 Host → store resolution — 2026-10-17, `dd46b73` (catalog `selected` filtering deferred with the picker, see note)
- [x] P5-01 Published rendering + custom page routes — 2026-10-17, `72d9432` (CMS routes come with P4-11)
- [x] P5-02 Catalog resolvers — 2026-10-17, `72d9432`; store catalog mode 2026-10-18 with P4-07 (`f59a774`)
- [x] P5-03 Cache tags — 2026-10-17, `2e1e904` + `72d9432`
- [x] P5-04 Host robots/sitemap — 2026-10-18, `bfc82e0` (with P4-14)
- [x] P5-05 Marketplace tracking off storefronts — 2026-10-17, `cb63997` (Meta pixel + CAPI, GA4, PostHog, Elfsight chat)

**Phase 6**
- [x] P6-01 Fee function — 2026-10-17, `468fd4e`
- [x] P6-02 `0059` fee columns — 2026-10-17, `49d4c34`; applied on staging, **not on production**
- [x] P6-03 Trial on first publish or first active product — 2026-10-17, `9765188`
- [x] P6-04 Order placement integration — 2026-10-17, `8a78df4` (staging; production waits for `0050`–`0059`)
- [x] P6-05 Store wallet core (`0060`+`0061`, primitive, delivery entries) — 2026-10-17, `6de2d1d`; staging only
- [x] P6-06 Dashboard store-wallet page — 2026-10-17, `69fc584`
- [x] P6-07 Trial notifications + banner — 2026-10-17, `96499f1`
- [x] P6-08 Negative-balance policy — 2026-10-17, `9945527`
- [x] P6-09 Kashier top-up (create) — 2026-10-17, `4fd5783`
- [x] P6-10 Kashier top-up webhook — 2026-10-17, `4fd5783`
- [x] P6-11 Pay ads from the wallet — 2026-10-17, `9945527` (no admin ad review screen exists; see note)
- [ ] P6-12 Refunds (deferred, D3)

**Phase 7**
- [x] P7-01 Integrations table + crypto — 2026-10-17, `dc3095b`
- [x] P7-02 Apps UI — 2026-10-17, `2e1e904`
- [x] P7-03 Storefront injection (with consent banner) — 2026-10-17, `54e7e94`
- [x] P7-04 Event bridge — 2026-10-17, `54c10df`
- [x] P7-05 Meta CAPI — 2026-10-18, `5ca12d9`
- [x] P7-06 Google Sheets — 2026-10-18, `5ca12d9` (needs Google OAuth env + the daily cron)
- [x] P7-07 Shopify import — 2026-10-18, `5ca12d9`

**Phase 8**
- [x] P8-01 Fulfillment request flow — 2026-10-18, `7e98443` (docs part in `14b2cd0`)
- [ ] P8-02 Shipping wiring
- [ ] P8-03 Fulfillment billing

**Phase 9**
- [x] P9-01 Admin seller site/fee view — 2026-10-18, `ee63c27`
- [x] P9-02 Admin overrides + audit — 2026-10-18, `ee63c27` (`0063`, staging only)
- [x] P9-03 Monitoring — 2026-10-18, `ee63c27` (structured `[fee]`/`[publish]`/`[integration]` logs; no external service)
- [ ] P9-04 Security review
- [ ] P9-05 Pilot rollout
- [ ] P9-06 Docs updated

**Phase 10**
- [ ] P10-01 `/sell` rewrite
- [ ] P10-02 `MARKETING_PROJECT.md` facts
- [ ] P10-03 Domain repositioning (separate plan)

**Global confirmations (from the planning brief)**
- [x] The existing default storefront template is kept (§3.6, §8.1, P4-03). No new default template is designed.
- [x] Signup is minimal and asks for no fulfillment choice (§6).
- [x] The 30-day trial is for new sellers (D5), per seller account, starts when their first store goes live, and is never restarted (§11.9, §12, §13.5, P6-03). The exact trigger is D20: first builder Publish or first active product.
- [x] The fee is max(EGP 5, 2% of the eligible subtotal), shipping excluded, for all old and new sellers (§13, D1).
- [x] There is a store wallet per seller that can go negative, with automatic entries and Kashier top-ups (§11.10, §13.4, P6-05 to P6-11).
- [x] Website Design and Apps sidebar groups are specified (§7).
- [x] The reference builder (`D:programming projectssaasappsdashboard`, identical to the copied components) was inspected (§5, D9 resolved).

---

## 23. Baseline and verification log

### 2026-10-17 — P0-03 baseline (branch `feat/seller-saas`, after `4fcb815`)

Commands: `pnpm turbo run typecheck|lint|test --continue`.

| Check | Result | Notes |
|---|---|---|
| typecheck | **8/10 pass**. `admin` and `ecommerce` fail (20 errors, pre-existing, not fixed) | `admin/app/layout.tsx:61`: `DirectionProvider` needs `dir`. `ecommerce`: `products/[slug]/_components/product-details.tsx` (null vs undefined) and `profile/_components/profile.chunks.tsx` (react-hook-form `Resolver` types). The dashboard passes after P0-02 |
| lint | **0/6 run**. Every package crashes before linting | `TypeError: Class extends value undefined` in `@typescript-eslint/utils` `FlatESLint.js` with ESLint 10.9.1. This is a pre-existing tooling version mismatch. Until it is fixed, "lint no worse than baseline" cannot be measured |
| test | **7/7 pass** | |

After P1-08 and P1-01 (`3289639`), typecheck and test match the baseline. `@workspace/store-sections` (typecheck + 49 tests) and the `@workspace/lib` plans tests (12) are green.

### 2026-10-17 — P0-04 live facts (Supabase project `sakwqwocbccpyrmwjowq` "e-commerce", read-only SELECTs)

- **(a)** The `auth.users` triggers exist (A1 confirmed):
  - `on_auth_user_created` → `public.handle_new_user()`. It inserts `id, email, full_name, avatar_url`, is `SECURITY DEFINER` and sets `search_path ''`.
  - `on_auth_user_updated` → `handle_user_update()`. On every auth update it **overwrites** `full_name`, `phone`, `avatar_url` and `referral_code` from `raw_user_meta_data`, and `is_verified` from `confirmed_at`.

  So signup (P2) must also write the phone to auth metadata, or the trigger overwrites it.
- **(c)** Migrations `0044`–`0048` are applied (`sellers.subdomain`, `seller_subdomain_redirects`, `carts.store_seller_id`, `sellers.commission_rate`, `seller_custom_domains`). `stores` and `sellers.plan` do not exist yet. There are 11 sellers, all with a subdomain.
- **(f)** No Upstash/Redis env var exists in any app (A4 false, see §21.2).
- **(d)** Auth settings (email confirmation, Google, identity linking, redirect allow-list) and **(e)** Vercel hosts are **not checked yet**. They need the Supabase and Vercel dashboards.
- **(b) RLS and grants: security problems found.** Reported to the owner, not fixed: the rules forbid silent fixes, and a production change needs approval.
  1. **Critical: privilege escalation.** `public.users` has the policy "Users can update own profile." (`UPDATE` to `public`, `USING auth.uid() = id`, no `WITH CHECK`). `anon` and `authenticated` also have table-level `UPDATE` grants on every column, including `role`, `is_verified` and `is_suspended`. A signed-in user can therefore set their own `role` through the public REST API, and the admin app grants access by `users.role` + `is_verified` (`apps/admin/supabase/middleware.ts`).
  2. **High: PII exposure.** `public.users` has `SELECT` policies with `USING true` for `public` ("Enable read access for all users", "Public users are viewable by everyone."). The anon key can read every user's email and phone.
  3. **High (F13 confirmed in part).** The `products` policy "Enable insert for authenticated users only" (`WITH CHECK true`) lets any signed-in user insert products for any `seller_id` through REST. "Public full access" (`ALL`, no expressions) and "Allow authenticated insert access" have no expressions and grant nothing.
  4. **Advisors.**
     - ERROR: `security_definer_view` on `public.user_points`.
     - `handle_new_user`, `handle_user_update`, `handle_user_wallet_provision` and `update_user_metadata_on_seller_approval` are `SECURITY DEFINER` and can be executed by `anon`/`authenticated` via `/rest/v1/rpc`.
     - 8 functions have a mutable `search_path`.
     - `pg_net` is installed in `public`.
     - Leaked-password protection is off.
     - `rls_enabled_no_policy` (INFO) on 59 tables is expected, since access is server-only through Drizzle.

  **Fixed 2026-10-17 (owner-approved).** Migration `0049_secure_users_products_contacts_rls.sql` (`49d8cb5`) was applied to production with `apply_migration`. It also drops the `contacts` read-all policy, which a follow-up sweep found: any signed-in user could read every contact-form submission.
  - Verified afterwards: the only policies left on these tables are `users` "Users can read their own profile", `contacts` "Enable insert access for all users" (the contact form) and the inert `products` SELECT policy. `anon` and `authenticated` have 0 INSERT/UPDATE/DELETE grants on `users`/`products`.
  - The admin `resetPassword` now uses Drizzle (same commit). It **only works again after admin is redeployed from this branch**.
  - Still open for P9-04: item 4 (advisors), and removing the unused admin `register(adminCode)` and `updateAdminProfile` actions.

### 2026-10-17 — Supabase test environment for P1-02

- Branching is **not available**. The org `tallaby` is on the Free plan, and the project's migration history is incomplete: 29 ad-hoc entries, while the repo migrations `0000`–`0048` were applied by hand and never recorded. A branch would therefore not reproduce the schema.
- **Owner decision:** test P1-02 on a **second free Supabase project** (staging), loaded with prod's schema only plus synthetic sellers. No customer data.

### 2026-10-17 — Staging copy and Phase 1 verification

- **Staging project** `cxqjrwjianxskhzmrkla` is on a second Supabase account, so the Supabase MCP here cannot reach it. It is reached with `psql`/`pg_dump` 17 through the session pooler (port 5432), using the `DATABASE_URL` in `apps/dashboard/.env`.
  - `apps/dashboard`, `apps/ecommerce` and `packages/db` `.env` files now point at **staging**. `apps/admin`, `apps/shipping` and `apps/backend` still point at production.
  - `.env.staging` is gitignored.
- **Copy:** production was dumped in sections (pre-data, data, post-data) and restored into staging. It covers `public`, `shipping_realtime` and `drizzle`, the `auth.users`/`auth.identities` data, `storage.buckets`, the triggers on `auth.users`, and the `storage`/`realtime` policies.
  - Row counts are identical for all 74 tables (41 auth users, 11 sellers, 97 products, 19 orders). Policy, trigger, function and index counts match.
  - The only restore errors were 12 harmless `supabase_admin` default-privilege statements.
  - Not copied: Storage files (images still load from production URLs) and Vault secrets (the `shipping_automation` webhook config must be set on staging by hand if needed).
- **Migrations `0049`–`0057` applied on staging twice** (idempotent), with no errors.
- **Backfill checks:** all 0 anomalies (11 sellers → 11 primary stores, subdomains equal, no NULL `store_id` on redirects, domains or storefront carts). Staging has no storefront orders, so that backfill had nothing to process.
- **RLS:** enabled on every new table with 0 policies, and on every `public` table. 0 client write grants on `users`/`products`.
- `stores_invariants.sql`: 15 checks pass (rolled back).
- `packages/lib` with `TEST_DATABASE_URL` = staging: **all 209 tests pass**. This includes the pre-existing fulfillment integration test, which runs for the first time.
- **Deployment rule (important):** the Drizzle schema on this branch lists the new columns (`sellers.plan`, `carts.store_id`, …). **No app built from `feat/seller-saas` may run against production until `0050`–`0057` are applied there.** The admin password-reset fix (`49d8cb5`) can be cherry-picked on its own.
- **Security notes for P9-04** (copied unchanged to staging):
  - Production Storage has policies that allow `public` INSERT/UPDATE/DELETE on some buckets ("Anyone can upload an avatar.", "Public 1c6vs24_1/2/3", "Public lfwun0_1/2/3", "Public wpu2fo_2/3", "Public00 wpu2fo_0").
  - The existing `sellers` bucket uploads are not scoped per seller.
  - Change the staging DB password: it was shared in chat and equals the project ref.

### 2026-10-17 — SECURITY: service_role key in NEXT_PUBLIC_SUPABASE_ANON_KEY (staging env files)

- **Found:** `apps/dashboard/.env`, `apps/ecommerce/.env` and `packages/db/.env` (the files switched to staging) set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the staging project's **`service_role`** JWT, found by decoding the role claim (the value was not printed).
  - `NEXT_PUBLIC_*` values are bundled into browser JavaScript, so anyone who loads these apps gets a key that bypasses RLS on the staging copy, which holds production customer data.
  - Production files (`apps/admin`, `apps/shipping`) correctly use the `anon` key.
- **Exposure:** only local dev servers. The dashboard dev server I started at 14:50 served it on `localhost:3002` and the LAN address `192.168.1.45:3002` for a few minutes. It was stopped when this was found.
- **Owner action:**
  1. Put the staging **anon** (publishable) key in those three files.
  2. Rotate the staging service_role key (Project Settings → API).
  3. Never put a service key in a `NEXT_PUBLIC_*` variable (CLAUDE.md rule 10).
- **Owner approvals 2026-10-17 (later, in chat):** (1) P6-05 store wallet: write and apply `0060` on **staging only**, with the read-only pre-checks first (stop and report on any finding); production untouched. (2) P4-01 new dashboard dependencies approved: `zundo`, `immer`, `@dnd-kit/react`, `@dnd-kit/dom`, `@dnd-kit/abstract`, `@dnd-kit/collision`, `nanoid`, `framer-motion`. (3) Restarting the stuck local ecommerce dev server.
- **Update 2026-10-17 (later):** all three files now hold a `sb_publishable_…` key (checked by prefix, value not printed), so item 1 is done. Rotating the old staging service_role key (item 2) can't be checked from here.
- Manual signup E2E (P2-03) waits for this. With a service key in the browser client, auth and RLS behaviour isn't representative anyway.
- Also noted: the root layout's `getSiteData` logs "Auth session missing!" on every signed-out page (`/login`, `/signup`). This is pre-existing log noise, harmless.

### 2026-10-17 — Signed-in HTTP checks on staging (dashboard dev server)

- A QA **customer** account `qa-seller@tallaby.test` was created on staging only, directly in `auth.users` + `auth.identities` with a random password. The `handle_new_user` trigger created its `public.users` row as `customer`. Credentials stay outside the repo.
- With its session cookie:
  - `/` → 307 `/signup` (P2-04).
  - `/signup` → 200 in signed-in mode (`signedInEmail` set; account fields hidden).
  - `/login` → 307 `/`.
- **Still manual (owner, in a browser):** submit the store step, then check the sidebar, the store switcher and `/stores` (create, archive, restore, limit at 3). Server Actions can't be driven over curl, and the assistant does not type passwords into sign-in forms of remote identity providers.

### 2026-10-17 — Second QA account (staging)

- `qa-owner@tallaby.test` (staging only) was made a seller with `ensureSellerAccount`: primary store `qa-owner-store`, store id `36f79fac-6709-472e-91b6-95bf180084ca`. It is used for HTTP smoke tests of the seller pages.
- `qa-seller@tallaby.test` stays a plain customer for the manual signup click-through.

### 2026-10-17 — Full integration run on staging (TEST_DATABASE_URL = staging)

- `packages/lib` 239/239, `apps/ecommerce` 105/105, `apps/dashboard` 78/78, `packages/store-sections` 52/52.
- My `ensureSellerAccount` test was order-dependent (the race winner is random), so it now uses fresh users. 3 consecutive green runs.
- **`packages/db`: 40/43.** The 3 failures are **pre-existing tests running against a real DB for the first time**, not this work:
  - `user-wallet.integration`: the duplicate claim surfaces as a raw query error instead of `DuplicateWalletTransactionError`, and the payout test fails with `InsufficientWalletBalanceError`.
  - `inventory`: "coupon usageLimit is never exceeded under concurrent claims" fails.
  - `affiliate-commission` and `user-wallet` cleanup: `DELETE FROM users` is blocked by the `user_wallet_transactions` append-only trigger (`0025`), so their test users stay on staging.

  **These touch money/ledger code (CLAUDE.md rule 4/7) and need an owner-approved task.** The coupon concurrency failure may be a real over-redemption bug and should be looked at first.

### 2026-10-17 — Integration failures diagnosed

- **Coupon `usageLimit` concurrency test: infrastructure, not a bug.** It fails with `EMAXCONNSESSION` (the Supabase session pooler allows 15 clients) only when test files run in parallel. In isolation and serially it passes. `packages/{db,lib}/vitest.config.ts` now run files serially when `TEST_DATABASE_URL` is set (`f2f2260`).
- **Wallet duplicate detection: real bug, fix needs owner approval** (CLAUDE.md rule 4/7).
  - `packages/db/src/wallet/user-wallet.ts` `isUniqueViolation()` checks `error.code`. Drizzle 0.45 wraps the Postgres error in `DrizzleQueryError`, with the code in `error.cause.code`.
  - So a duplicate `(type, reference)` claim throws a generic error instead of `DuplicateWalletTransactionError`.
  - The unique index still prevents double credits, so balances are safe. But the callers that treat that error as "already processed" see a failure instead: `apps/backend/src/lib/wallet-top-up.ts` (top-up webhook), `apps/ecommerce/actions/order.ts` and the admin wallets screens.
  - Proposed fix (about two lines): also check `(error as any)?.cause?.code === "23505"`.
  - This explains both failing tests in `user-wallet.integration.test.ts`. Their cleanup is also blocked by the append-only trigger, so their test users remain on staging.

### 2026-10-17 — P3-06 and P3-07 Part A

- P3-06 committed as `73e0197` (see the task note).
- P3-07 Part A committed as `f65ecfb`. `0058_store_settings_audit.sql` applied on staging twice (idempotent). Planned migrations renumbered: fee → `0059`, store wallet → `0060`.
- Checks: lib 205 tests pass (+6 payments integration on staging), dashboard 86, lib/db/dashboard typecheck clean. Signed-in GET of `/stores/<id>/settings/payments` on the staging dev server returns 200 with the Arabic labels and logos.
- Manual E2E still to do (owner, browser): turn on Vodafone Cash with a 012 number (operator warning shows), save; try to turn COD off when it is the only method (error); InstaPay with a wrong IBAN check digit (field error).

### 2026-10-17 — P3-08 Part A

- Committed as `ba8e783`. No migration needed (`store_shipping_zones` is from 0057, audit table from 0058).
- Checks: lib 215 tests pass (+7 shipping integration on staging), dashboard 86, typecheck clean. Signed-in GET of `/stores/<id>/shipping` returns 200 with the Arabic labels; a store of another seller renders the 404 page.
- Manual E2E still to do (owner, browser): add a zone with Cairo + Giza, add a second zone and confirm Cairo is disabled there, switch to own delivery, try to delete the only zone (error), check the example quote.
- **Phase 3 status:** every task has its settings/dashboard part done. P3-03b (custom domains for non-primary stores) and the checkout halves of P3-07/P3-08 wait for owner approval.

### 2026-10-17 — Session 2: P5-05, Phase 6 (fee, trial, store wallet), Phase 7 start

- Commits: `cb63997` P5-05, `468fd4e` P6-01, `49d4c34` P6-02, `9765188` P6-03, `8a78df4` P6-04, `96499f1` P6-07, `dc3095b` P7-01, `2e1e904` P7-02, `54e7e94` P7-03, `6de2d1d` P6-05. Details are under each task.
- **Migrations on staging only:** `0059` (fee + trial columns, trial function and products trigger), `0060` (store wallet), `0061` (opening balances). Each applied twice (idempotent). **Production now needs `0050`–`0061`** before any app from this branch runs there; apply `0059` with the P6-04 deploy and record that time as the fee switch-over.
- **P6-05 read-only pre-checks (staging, before `0060`):** duplicate sale rows per (seller, order) = 0; `seller_wallet.balance` ≠ `sellers.wallet_balance` = 0; wallets or ledgers without the other = 0; **`seller_wallet.balance` ≠ sum(ledger) = 1**: seller "Tallaby" (`b61a4987-…`), 538.20 with no ledger rows (staging has no `wallet_transactions` at all). Reported; **owner decision: opening-balance `adjustment`** (`0061`). After `0060`/`0061`: 12 wallets, 0 mismatches, one row `adjustment 538.20 (admin:opening_balance)`. Production is very likely the same; re-run the pre-checks there before applying.
- **Pre-existing test failures, not from this work:** `packages/db` `user-wallet.integration.test.ts` now fails 9/21 on staging, with the pre-session schema files as well (checked by swapping them back). The database still rejects a duplicate `(type, reference_type, reference_id)` (checked in SQL), so the failures sit in the app-level error mapping and test state (the `isUniqueViolation` bug above, plus about 430 leftover rows from earlier runs whose users can't be deleted). `inventory` concurrency tests also fail when the full suite shares the pooler. Needs its own owner-approved task (money code).
- **Security note resolved:** the three staging `.env` files now use `sb_publishable_…` keys (checked by prefix only).
- **Dev server:** the old ecommerce dev server (PID 12436) crashed every page with "Jest worker encountered 2 child process exceptions"; restarted with owner approval.
- Test totals at this point: lib 337+ (staging), db store-wallet 11/11, dashboard 90, cache 32, ecommerce 108, emails 3. Typecheck: lib, db, dashboard, admin (baseline error only), ecommerce (baseline errors only), backend, shipping clean.

### 2026-10-18 — P4-07 store catalog mode (D24)

- No migration (`store_products`, `stores.catalog_mode` are from `0050`, already on staging; **production still needs `0050`–`0062`**).
- Checks: lib **413/413 with `TEST_DATABASE_URL` = staging** (new `catalog.integration.test.ts` 7/7, isolation test 4), cache 34, dashboard 99, ecommerce 115. Typecheck: lib, cache, dashboard clean; ecommerce only the baseline errors (`product-details.tsx`, `profile.chunks.tsx`). Lint still can't run (baseline ESLint crash).
- HTTP check on the already-running ecommerce dev server against staging: `faster` in `selected` mode with 2 picks → home shows exactly those 2, unpicked product page 307 → marketplace, picked one 200. Restored to `all` with 0 `store_products` rows.
- The dashboard dev server was not running; the Catalog tab was not opened in a browser (see the P4-07 manual check).

### 2026-10-18 — Marketing website (`apps/marketing`, owner request, outside the task list)

- New Next.js 16.3.3 app `apps/marketing` (port 3004, `[locale]` routing, Arabic default, shared `@workspace/ui`), ported from the Claude Design project "Marketing Website": home, templates + template detail, pricing, blog + post, about, careers, contact, FAQ, terms, privacy, follow-us, sitemap/robots. Owner chose a separate app over reusing ecommerce routes (ecommerce already has /about, /contact, /faq, …; `/sell` had someone else's uncommitted edits and was not touched).
- **Copy differs from §13 on purpose:** the owner chose to ship the design's "flat 5 EGP per order, no percentage" copy (2026-10-18). Fee code is unchanged (`platform-fee.lib.ts` still max(5, 2%)). `lib/pricing.lib.ts` only drives the page calculators. Revisit before launch so the site and the charge match.
- **Signup:** the "Create your store" dialog creates the account and primary store with the same flow as the dashboard signup (`ensureSellerAccount`, signed `SIGNUP_INTENT_SECRET` cookie, phone required per D6, Google via `/api/auth/callback` on the marketing host), then sends the seller to the dashboard. The live link check uses `checkStoreSubdomain`. Intent helpers are copied from `apps/dashboard/app/signup` (keep in sync). Dashboard `/signup` now also accepts `?subdomain=` to prefill.
- Contact form writes to `contacts` (same table as the marketplace form). Newsletter is UI only (no table). Careers has no roles listed (owner request).
- Env / config to finish: `NEXT_PUBLIC_SITE_URL` in `apps/marketing/.env` points at the dashboard; set it to the marketing origin. Add the marketing `/api/auth/callback` URL to the Supabase redirect allow-list. Optional `NEXT_PUBLIC_DASHBOARD_URL`, `NEXT_PUBLIC_MARKETPLACE_URL`.
- Store-preview product photos `assets/store/p*.png` from the design could not be exported (binary); previews use existing Supabase product images instead. Facebook/LinkedIn links were placeholders in the design and are not shown.
- Checks: typecheck clean and pricing tests 5/5 before the signup/footer/WhatsApp changes. Final typecheck and tests (incl. the copied intent-token test) **not yet run**: the machine ran out of memory and the runs were stopped. Lint blocked by the baseline ESLint 10 crash (ecommerce crashes the same way). No browser check yet.
  - **Update (same day, later):** marketing typecheck clean and tests 11/11 in the full run below.

### 2026-10-18 — Agent worktrees merged into `feat/seller-saas`, P4-05

- **Source.** Nine `.claude/worktrees/agent-*` worktrees from an earlier session held uncommitted work. They were all at `f59a774` with no commits, the agents had stopped by about 03:16, and none of it was in this plan. Each worktree's diff was applied here with a 3-way merge and committed per task group:

  | Commit | Tasks |
  |---|---|
  | `7e98443` | P8-01 |
  | `ee63c27` | P9-01, P9-02, P9-03 |
  | `5ca12d9` | P7-05, P7-06, P7-07 |
  | `b0335fe` | P4-09 |
  | `d24f6da` | P4-13, P4-15 |
  | `34b6684` | P4-08, P4-12, P4-17 |
  | `bfc82e0` | P4-14, P5-04 |
  | `b6b36b6` | P4-10 |
  | `643feae` | P4-16, P4-11 storefront |

  `48ac7b0` holds the typecheck and routing fixes. The worktrees themselves were left in place, unchanged.
- **Gaps the agents left (filled here):**
  - Missing message namespaces, now in AR + EN: `websiteDesign`, `websiteSocial`, `domainSeo` (plus 4 Arabic store-link/custom-domain errors), `websiteBlog`.
  - The blog post editor (`post-editor.client.tsx`), imported by the new/edit pages but never written.
  - The sidebar Forms badge (`countNewFormSubmissions`).
  - Blog nav entries, and the blog rollout-flag gate.
  - The P4-05 server function and gallery: only the pure merge and the migration existed.
  - **Still missing:** the generic CMS dashboard UI (P4-11).
- **Migrations.** The worktree `0071_template_install_undo.sql` was renumbered to **`0064`** (next free number after the admin `0063`). Both were already present on staging: the columns and table exist, checked read-only. **Production is untouched and now needs `0050`–`0064`.**
- **Merge notes:**
  - The storefront cache key went to `storefront-v6` (seo + social).
  - The storefront metadata keeps the preview noindex and the favicon.
  - `@workspace/db/log` casts fixed, `isAdminWriteRole` is now a type guard, and the cached CMS queries' `tags` take the full argument list.
  - Store-host rewrites no longer keep a trailing slash: `/blog/?page=2` failed the routing test.
- **Uncommitted owner work was left alone:**
  - The owner committed `14b2cd0` from GitHub Desktop during the merge. It included `docs/fulfillment.md` with the P8-01 doc change, which was staged at that moment.
  - The owner's own edits to `docs/fulfillment.md` and `apps/ecommerce/messages/ar.json` were set aside during the merge and restored, still uncommitted.
  - The owner's in-progress login files (`apps/dashboard/app/login/*`, `components/auth/o-auth.tsx`) were never staged.
- **Checks:**

  | Check | Result |
  |---|---|
  | Typecheck | db, lib, store-sections, cache, dashboard, backend, shipping and marketing are clean. Ecommerce and admin show only the baseline errors (`product-details.tsx`, `profile.chunks.tsx`, `admin/app/layout.tsx`) |
  | Unit tests | lib 392, store-sections 154, ecommerce 126, dashboard 113, cache 35, marketing 11, db 7, emails 3: all pass |
  | lib integration (`TEST_DATABASE_URL` = staging) | 569 tests, all pass after two test-only fixes: 60 s timeouts on the CMS and media suites, and the media helper sending `metadata` as a jsonb string |

  Lint is still blocked by the baseline ESLint 10 crash. `packages/db` integration tests were not re-run (known wallet failures, §23 2026-10-17).
- **Manual browser checks still to do (owner):**
  - Templates: "Use template" on a second store, then edit, undo and publish.
  - Design system: preset, font and radius, then publish and check the storefront.
  - Social links on the Classic footer.
  - Domain & SEO: save, then check the page source, `robots.txt` and `sitemap.xml`.
  - Forms: add a contact form section, submit on the store, check the inbox.
  - Media: upload, pick it in the editor, delete.
  - Blog: draft, schedule, publish, then `/blog`.
  - Preview on my store (set `STORE_PREVIEW_SECRET`).
  - Admin seller page overrides.
  - Fulfillment request.
