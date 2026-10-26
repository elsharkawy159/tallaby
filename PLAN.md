# Tallaby Seller SaaS — Implementation Plan

> **Status:** Implementation started 2026-10-17 on branch `feat/seller-saas`. Phase 0 is done except P0-01's remaining audit, P0-04 (d)–(e) and P0-06. Phase 1 is done except P1-06's upload test; migrations `0049`–`0073` are applied to the **staging** project (`cxqjrwjianxskhzmrkla`) **and to production** (`sakwqwocbccpyrmwjowq`, 2026-10-20, see §23), so production is ready for the `feat/seller-saas` merge. **Owner decisions applied 2026-10-17** (see §21.3): **a seller can own several stores (Free plan = max 3; `sellers.plan` default `free`, subscriptions later); Supabase is prepared early for all builder, CMS, forms, templates and media tables (§11);** the fee applies to all sellers; there is a store wallet that can go negative; the trial is for new sellers; the default theme is live from signup; refunds and the domain move are deferred; Kashier is the first payment provider.
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
- Admin analytics read only our own database (`apps/admin/lib/analytics/commerce.server.ts`). PostHog and the Elfsight support chat were removed on 2026-10-24 (§23).
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
(Store switcher: the sidebar footer, next to sign-out — logo · name · host ▴ — other stores · + Create store (N of 3).
 WhatsApp support: a floating circle in the bottom-left corner of every page.)

Home — الرئيسية                                   /                                   Account+store   Extend
Orders & Shipping — الطلبات والشحن ▾
  ├─ All orders — كل الطلبات                       /orders                             Account (store filter)   Extend
  ├─ Delivery tracking — متابعة التوصيل             /orders/delivery                    Account (store filter)   Extend (moved from /shipping)
  ├─ Riders — المندوبون                            /orders/riders                      Account                  Extend (from /shipping dialogs)
  └─ Shipping settings — إعدادات الشحن              /stores/[storeId]/shipping          Store                    New
Products — المنتجات ▾
  ├─ All products — كل المنتجات                    /products                           Account                  Existing
  ├─ Add product — إضافة منتج                      /products/add                       Account                  Existing
  ├─ Store catalog — المنتجات المعروضة             /stores/[storeId]/catalog           Store                    Moved from Store settings (2026-10-18)
  └─ Reviews — التقييمات                           /reviews                            Account                  Existing (moved into group)
Website — الموقع ▾                                                                     (all Store scope)
  ├─ Overview — نظرة عامة                          /stores/[storeId]/website           New
  ├─ Website builder — محرر الموقع                 /stores/[storeId]/editor            New (full screen)
  ├─ Templates — القوالب                           /stores/[storeId]/website/templates New
  ├─ Design system — الهوية والتصميم               /stores/[storeId]/website/design    New
  ├─ Domain & SEO — النطاق وتحسين الظهور           /stores/[storeId]/website/domain    New (reuses existing domain components)
  └─ Social media — التواصل الاجتماعي              /stores/[storeId]/website/social    New
Content — المحتوى ▾                                                                    (all Store scope; split out of Website 2026-10-18)
  ├─ Pages — الصفحات                               /stores/[storeId]/website/pages     New
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
  └─ Payment methods — طرق الدفع                   /stores/[storeId]/settings/payments New (COD on; wallets + InstaPay; others Soon)
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

### 8.7 Shipping settings [Part A built, Part B built on `feat/store-shipping` 2026-10-21, not merged] (P3-08)

**Status 2026-10-21.** Part B is built (spec `docs/superpowers/specs/2026-10-21-store-shipping-design.md`, plan `docs/superpowers/plans/2026-10-21-store-shipping.md`): storefront checkout bills the seller's zones (`apps/ecommerce/lib/shipping.server.ts` over `packages/lib/src/shipping/store-quote.ts`), zones cover places at any level (`packages/lib/src/places/`, migration `0093`), the shipping page has templates, an "Other places" switch (Tallaby rates or don't deliver) and a price check, the per-kg price is gone, the address form has place pickers, and the shipping the customer paid is folded into the seller's `sale` entry. The D31 fulfillment switch and the Tallaby-delivery option stay as they were (Tallaby delivery is still hidden). `0093` is on staging only; the text below is the original proposal.

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
> **Changed by the owner on 2026-10-18 (migration `0067`).** This replaces the 2%/min 5 fee and the 30-day trial below wherever they still appear in this plan: Tallaby's only profit per order is a **flat EGP 5 per seller per order** (fee plan `flat_5`), taken from the store wallet **when the order is delivered**. The wallet keeps going down at 0 or below (−5, −10, …). **Every seller account** gets **7 free days counted from its first store's `created_at`**. Whether an order is free depends on when it was **placed** (D4): an order placed on day 6 and delivered on day 9 is free. Orders placed from day 8 pay EGP 5. 0067 applied the rule to all existing sellers too, ending running 30-day trials. A negative wallet opens a top-up pop-up in the dashboard once per session.

- **Every seller** gets 7 days with no platform fee, from the `created_at` of their first store (§13.5, changed 2026-10-18). The trial is not restarted by later stores, republishing, unpublishing, changing templates or retried callbacks.
- **Fee for every seller, old and new, on every order** (D1): **fee = a flat EGP 5** per successful (delivered) order, per seller (changed 2026-10-18, was max(EGP 5, 2%)). It is capped at the seller's eligible subtotal for orders under EGP 5. Payment-provider fees and fulfillment charges are separate. Per-service fees (fulfillment, ads, themes…) will be designed later. The plan keeps one fee plan key so more can be added.
- Examples (tests cover these): EGP 100 → 5.00; EGP 250 → 5.00; EGP 500 → 5.00; EGP 1,000 → 5.00. Edge cases: 3.00 → 3.00 (cap); 0 → 0 (no order).
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

> **Current rule (0067, owner 2026-10-18):** the trial is 7 days per seller account, from the first store's `created_at`. A `stores` AFTER INSERT trigger calls `start_fee_trial_if_needed`, which always writes `[min(stores.created_at), + 7 days)` once (trigger value `store_created`). The publish and product-active callers below still exist but are no-ops once the trial is set. The T-7 reminder is gone; only the T-1 email is sent. The text below describes the earlier 30-day design.

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
  - The Website group needs `STORE_BUILDER_SELLER_IDS` (`all` or a comma list of seller ids). It is a new server env var, unset = hidden. *(2026-10-18: default flipped, unset now = all sellers; see §23.)*
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

### Phase 4B — Website editor upgrade (owner request 2026-10-18)

The full design and task list are in [`docs/website-builder.md`](docs/website-builder.md). In short: make the editor work like the Valorcy reference (tab rail, Add panel, Layers, Content/Style inspector, canvas hover/selection/inline editing, shortcuts). Keep **one pre-built section per category**, with layout variants and a shared section style. Add **elements** and a `custom-section` that renders the existing `componentTree` field safely. Tasks **P4B-01 … P4B-14**. There is no migration (all data fits in `SiteConfig` v1) and no change to Tallaby Classic. `@dnd-kit` (already approved) is added only after the P4B-12 spike.

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

### Phase 9B — Admin SaaS alignment (owner request 2026-10-18)

The full design and task list are in [`docs/admin-saas.md`](docs/admin-saas.md). In short, make `apps/admin` show and manage everything sellers create in the dashboard:

- Remove Pricing calculator and External orders from the sidebar (code kept in comments).
- Group the sidebar from a tested config, with Sellers directly above Customers.
- Show one fulfillment row per seller, with a detail page that has a tab per service (Storage, Packaging, Delivery, Customer service, Returns).
- Show all coupons (platform, sellers, affiliates).
- Add a stores directory and a tabbed store detail (website, catalog, payments and shipping, integrations, forms, blog and CMS, media, audit).
- Make the seller detail tabbed, loading only the open tab.
- Add pages for integrations, templates, domains, ad campaigns (closes the P6-11 gap) and the audit log, plus an action centre with SaaS KPIs on the home page.

Performance comes from streaming, one SQL round-trip per list and per-tab loading. Only reference data is Data-Cached; every admin write is audited and broadcasts its invalidation tags. There is one migration, `0069_admin_saas.sql`: `admin_audit_log.seller_id` becomes nullable, plus target columns and indexes. It needs owner approval before it goes to staging. Tasks are **P9B-01 … P9B-14**. Decisions D-A1…D-A6 are in that doc's §6.

---

### Phase 9C — Admin website builder (owner request 2026-10-20)

Design: `docs/superpowers/specs/2026-10-20-admin-website-builder-design.md`. Plan: `docs/superpowers/plans/2026-10-20-admin-website-builder.md`. Admins edit any store's website, the library sections and the templates with the same builder sellers use.

- The seller editor moved out of `apps/dashboard` into `packages/store-editor`. It talks to its host only through an `EditorAdapter` (data, save, publish, media, links, capabilities). The dashboard, the admin store editor, the library-section editor and the template editor each supply an adapter.
- Library sections (`library_sections`, `0086`) and templates (`0087` drafts and meta) are now mastered in the database. The code seeds are insert-only, so an admin edit is never overwritten by a deploy.
- Every admin write to a store's site is audited and sets `site_edited_by_admin_at` (`0085`); the seller sees an "admin updated" banner. A chrome (header/footer) version check stops two editors overwriting each other.
- A new store takes the database default template.

Tasks **AB-01 … AB-15** map to plan Tasks 1–15: AB-01 package and adapter contract; AB-02 move pure logic; AB-03 move the UI behind the adapter; AB-04 chrome version check (`0085`); AB-05 external-change detection; AB-06 admin store-site guard and audit; AB-07 admin store editor; AB-08 photo slots and `instantiateTemplate`; AB-09 `library_sections` (`0086`); AB-10 section palette from the database; AB-11 admin library-section editor; AB-12 template drafts and meta (`0087`); AB-13 default template from the database; AB-14 template studio lib; AB-15 admin template editor.

### Phase 9D — Seller dashboard UX fixes (owner request 2026-10-24)

Plan: `docs/superpowers/plans/2026-10-24-seller-dashboard-ux-fixes.md`, from the 2026-10-24 UX review of the seller dashboard and signup flow (desktop and mobile). Batches 1–3 (bugs and safety, first-run flow, money copy) plus the shared unsaved-changes guard. Display and flow only: no schema, money or ledger changes. Navigation changes (store switcher at the top, mobile bottom bar, slimmer Website group) wait for the owner's approval.

Tasks **UX-01 … UX-10**: UX-01 `ConfirmActionDialog` + delivery confirms; UX-02 confirms for app disconnect, domain removal, Design publish; UX-03 product row Delete; UX-04 translated table labels, Reviews search, wallet ledger link; UX-05 auth errors returned, resend confirmation; UX-06 honest signup copy + welcome banner; UX-07 heard-about-us timing; UX-08 open a store after creating it; UX-09 money copy (home wallet KPI, Financial, Plan fees); UX-10 `useUnsavedChangesGuard`.

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
- [x] P1-02 Migrations `0050`–`0057` (stores + backfill, builder core, templates, media, forms, CMS, integrations, shipping zones) + Drizzle mirror — 2026-10-17, `6d2287c` (+ `0051` fix in `5e5ac5e`); applied on staging; **on production 2026-10-20**
- [x] P1-03 `requireSeller` / `requireStore` — 2026-10-17, `19e6a72`
- [x] P1-04 Stores + store-sites data access (plan-limited `createStore`) — 2026-10-17, `5e5ac5e`
- [x] P1-05 Isolation harness (multi-store) — 2026-10-17, `59b1f4f` (tests 1, 2, 3, 5, 11)
- [ ] P1-06 Supabase readiness (branch, advisors, `store-media` bucket + policies, backups) _(staging copy instead of a branch: done; bucket + policies on staging and production: done; pre-apply production backup (`pg_dump`): done 2026-10-20; advisor-style lint by SQL (prod = staging): done, MCP `get_advisors` not run; upload test: open)_
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
- [~] P3-07 Payment methods (COD default; Vodafone Cash, e& Cash, WE Pay, Orange Cash, InstaPay with details; others Soon) — Part A (settings page) 2026-10-17, `f65ecfb`; **storefront checkout filter** 2026-10-20 (owner: filter only, see §23); **Part B (seller-collected payment to the seller's own details, seller confirmation, fee-only delivery entry) waits for owner approval**
- [~] P3-08 Shipping settings (Tallaby vs own delivery, zones) — Part A (settings + zones) 2026-10-17, `ba8e783`; **Part B: checkout charge from the seller's zones, places, templates, seller credit of shipping built 2026-10-21 on `feat/store-shipping` (`3bdb35f0..fe6d1af2`, `0093` on staging, production (apply before deploying) and the manual E2E pending); the D31 fulfillment switch stays with P6-05**

**Phase 4**
- [x] P4-01 Editor core (Tallaby-native, no new deps) — 2026-10-18, `3983b6d`
- [x] P4-02 Shared section library — 2026-10-17, `d2a1fa6`
- [x] P4-03 Tallaby Classic (no visual change) + template seed — 2026-10-17, `ed282f2` (`0062` on staging and production)
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

**Phase 4B** (website editor upgrade, [`docs/website-builder.md`](docs/website-builder.md))
- [x] P4B-01 Element model + style whitelist (2026-10-18; part styles in `instance.style.parts`, see §23)
- [x] P4B-02 Element renderer + `custom-section` (2026-10-18; store elements and video deferred)
- [x] P4B-03 Editor shell like Valorcy (rail, panels, Content/Style inspector) (2026-10-18)
- [x] P4B-04 Selection + canvas overlays (2026-10-18)
- [~] P4B-05 Section library: style, layouts and presets (owner's section library brief, 2026-10-18; **built as presets over layout variants**, see §23). Phase 1 foundations `64ef692`, phase 2 library UI + inspector `264be31` done; owner's interim step done: one designed section per category (`sections/library/`) and an accordion Add panel; phase 3 (real data, empty states, refresh), phases 4–5 (layouts for all 15 categories, ~70 presets) and phase 6 (templates, docs) still to do
- [x] P4B-06 Add panel with live previews (2026-10-18, owner request: an accordion per library category with every insertable section drawn live; no layout variants yet, see §23)
- [x] P4B-07 Elements palette + layout presets (2026-10-18)
- [x] P4B-08 Layers navigator (2026-10-18; no drag and no virtualisation yet)
- [x] P4B-09 Style panel (per-device) (2026-10-18)
- [x] P4B-10 Inline editing + image replace (2026-10-18)
- [x] P4B-11 Clipboard, context menu, shortcuts, quick insert (2026-10-18)
- [x] P4B-12 Drag and drop (2026-10-18: one `@dnd-kit/core` 6.3.1 + `sortable` 10.0.0 context for Add › Elements/Sections, Explore, Images, Layers and canvas moves; canvas targets from the frame's markers; see §23. Owner still to do a real-mouse/touch check)
- [ ] P4B-13 Convert section to custom (**deferred** to the sections plan)
- [x] P4B-14 Brand panel in the editor (2026-10-18; themes, colours, fonts, radius/width/spacing on the same draft as Website › Design system, see §23)
- [x] P4B-15 Templates, Explore and Forms tabs in the editor (2026-10-18, owner request; not in the original plan, see §23)
- [x] Storefront templates from Claude Design (owner request 2026-10-19; not in the original plan, see §23): 01 **Atelier** (`0070`) and the library-built templates 02–38 (`0074`–`0083`, 2026-10-20) and 49–100 (`0090` + `0092`, 2026-10-21) on staging and production. All 90 templates of the design registry are live.
- [~] Tallaby Classic as the default template, rebuilt as element trees (owner request 2026-10-19, see §23): built; every never-published store starts from it in its drafts; `0071` not applied; awaiting the owner's review
- [x] P4B-16 Movable parts in pre-built sections: slots + item drag for the Content sections (2026-10-18, owner request; not in the original plan, see §23)

**Phase 5**
- [x] P5-00 Host → store resolution — 2026-10-17, `dd46b73` (catalog `selected` filtering deferred with the picker, see note)
- [x] P5-01 Published rendering + custom page routes — 2026-10-17, `72d9432` (CMS routes come with P4-11)
- [x] P5-02 Catalog resolvers — 2026-10-17, `72d9432`; store catalog mode 2026-10-18 with P4-07 (`f59a774`)
- [x] P5-03 Cache tags — 2026-10-17, `2e1e904` + `72d9432`
- [x] P5-04 Host robots/sitemap — 2026-10-18, `bfc82e0` (with P4-14)
- [x] P5-05 Marketplace tracking off storefronts — 2026-10-17, `cb63997` (Meta pixel + CAPI, GA4, PostHog, Elfsight chat)

**Phase 6**
- [x] P6-01 Fee function — 2026-10-17, `468fd4e`
- [x] P6-02 `0059` fee columns — 2026-10-17, `49d4c34`; applied on staging; **on production 2026-10-20**
- [x] P6-03 Trial on first publish or first active product — 2026-10-17, `9765188`
- [x] P6-04 Order placement integration — 2026-10-17, `8a78df4` (staging; production schema ready 2026-10-20, the code goes live with the merge)
- [x] P6-05 Store wallet core (`0060`+`0061`, primitive, delivery entries) — 2026-10-17, `6de2d1d`; staging, and production 2026-10-20
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
- [x] P9-02 Admin overrides + audit — 2026-10-18, `ee63c27` (`0063`, staging and production)
- [x] P9-03 Monitoring — 2026-10-18, `ee63c27` (structured `[fee]`/`[publish]`/`[integration]` logs; no external service)
- [ ] P9-04 Security review
- [ ] P9-05 Pilot rollout
- [ ] P9-06 Docs updated

**Phase 9B** (admin SaaS alignment, [`docs/admin-saas.md`](docs/admin-saas.md))
- [x] P9B-01 Hide Pricing calculator and External orders — 2026-10-18 (uncommitted)
- [x] P9B-02 Grouped sidebar config (Sellers above Customers) — 2026-10-18 (uncommitted)
- [x] P9B-03 Admin infra: `0069`, tags, invalidation descriptors, shared queue counts — 2026-10-18 (`0069` written, not applied)
- [x] P9B-04 Fulfillment: one row per seller + per-service detail — 2026-10-18
- [x] P9B-05 Coupons: platform, seller and affiliate coupons — 2026-10-18
- [x] P9B-06 Stores directory + store detail — 2026-10-18
- [x] P9B-07 Seller detail tabs + sellers list columns — 2026-10-18
- [x] P9B-08 Integrations hub — 2026-10-18
- [x] P9B-09 Ad campaigns admin — 2026-10-18
- [x] P9B-10 Domains — 2026-10-18 (needs `STOREFRONT_VERCEL_*` in the admin env)
- [x] P9B-11 Templates — 2026-10-18 (writes need `0069`)
- [x] P9B-12 Action centre + SaaS KPIs — 2026-10-18
- [x] P9B-13 Audit log page — 2026-10-18
- [x] P9B-14 Security pass on the new admin surface — 2026-10-18 (grep checks; full P9-04 review still open)

**Phase 9C** (admin website builder, [spec](docs/superpowers/specs/2026-10-20-admin-website-builder-design.md); commit ranges from base `245d4a9`)
- [x] AB-01 `packages/store-editor` scaffold and `EditorAdapter` contract — 2026-10-20 (`245d4a9..2110473`)
- [x] AB-02 Editor pure logic moved into the package — 2026-10-20 (`2110473..3b76247`)
- [x] AB-03 Editor UI moved behind the adapter — 2026-10-20 (`3b76247..7a6568c`; browser E2E pending)
- [x] AB-04 Chrome version check, `0085` — 2026-10-20 (`7a6568c..ce694cd`; applied staging and production)
- [x] AB-05 External draft change detection — 2026-10-20 (`ce694cd..c17645c`)
- [x] AB-06 Admin store-site guard and audit — 2026-10-20 (`c17645c..6c9ab5c`)
- [x] AB-07 Admin edits and publishes a store's website — 2026-10-20 (`6c9ab5c..6ccce5e`; browser E2E pending)
- [x] AB-08 Photo slots and `instantiateTemplate` — 2026-10-20 (`6ccce5e..4890ec0`)
- [x] AB-09 `library_sections`, `0086` — 2026-10-20 (`4890ec0..2e813c3`; applied staging and production)
- [x] AB-10 Section palette from `library_sections` — 2026-10-20 (`2e813c3..97b797c`)
- [x] AB-11 Admin library-section management and editor — 2026-10-20 (`97b797c..8a37895`; browser E2E pending)
- [x] AB-12 Template drafts and meta, `0087`, insert-only seeds — 2026-10-20 (`8a37895..132ac4e`; applied staging and production)
- [x] AB-13 Default template and template meta from the database — 2026-10-20 (`132ac4e..e7062ef`)
- [x] AB-14 Template studio lib — 2026-10-20 (`e7062ef..f565c3b`)
- [x] AB-15 Admin template editor — 2026-10-20 (`f565c3b..8b94f62`; browser E2E pending)

**Template product pages (owner request 2026-10-23; spec `docs/superpowers/specs/2026-10-23-template-product-page-design.md`, plan `docs/superpowers/plans/2026-10-23-template-product-page.md`, branch `feat/template-product-page`)**
- [x] TPP-01 `kind` on store pages and the site config, `0100` (`store_pages.kind`, one product page per store, slug reserved)
- [x] TPP-02 Product scope and product elements in `store-sections` (gallery, title, price, rating, variants, buy box, content, details, tabs, reviews, related), host hooks, `0101` product-page library sections
- [x] TPP-03 Related-products source; shared `productPageSpec` builder and a product page for all 111 templates (code); product page in seed, apply and template preview
- [x] TPP-04 Storefront renders the store product page from the site; the builder edits it (preview product, product-page-only library category)
- [x] TPP-05 `0102` adds the product page to the DB templates; `backfill:product-pages` script for existing stores
- [x] TPP-06 Visual QA of all 111 template product pages (desktop 1280, 4 at 520); template-specific demo product
- [x] TPP-07 (done 2026-10-24, staging and production) Staging, then production with the owner's go-ahead: run `check-unscoped-bound-nodes.sql`; apply `0096`–`0100`; deploy; apply `0101`, `0102`; run `backfill:product-pages` (dry run, then `--apply`)
- [ ] TPP-08 Run the DB integration tests with `TEST_DATABASE_URL`; manual E2E on staging (storefront product page, builder edit and publish, apply template, undo)
- [x] TPP-09 (done 2026-10-24: staging 27 stores; production 19 added, 2 already had one, 4 new live revisions) Backfill dry run, then `--apply`, on staging, then on production with the owner's go-ahead

**Phase 9D — Seller dashboard UX fixes (owner request 2026-10-24; plan `docs/superpowers/plans/2026-10-24-seller-dashboard-ux-fixes.md`; uncommitted on `main`)**
- [x] UX-01 `ConfirmActionDialog`; cancel/return shipment and bulk "Mark delivered" ask first — 2026-10-24
- [x] UX-02 Confirm before app Disconnect (4 sheets), custom-domain removal (was `window.confirm`), Design › Publish — 2026-10-24
- [x] UX-03 Product row Delete works (was a no-op); bulk delete reports results — 2026-10-24
- [x] UX-04 Orders, delivery and reviews tables in the active locale; Reviews search filters; wallet ledger order link (was a 404); ledger amounts aligned in RTL — 2026-10-24
- [x] UX-05 Login/reset errors returned, not thrown (masked in production); resend confirmation on login and on signup's "check your email" — 2026-10-24
- [x] UX-06 Signup no longer says the store is live; welcome banner on `/?welcome=1` — 2026-10-24
- [x] UX-07 "Where did you hear about us" waits a day after the first store, and never shows with the negative-wallet dialog — 2026-10-24
- [x] UX-08 After creating a store, open its website overview; "Manage store" on each store card — 2026-10-24
- [x] UX-09 Home "Store wallet" KPI (top-up link when negative, no "Withdraw"); Financial amounts coloured by sign; Plan › Fees (EGP 5 per delivered order, trial state) — 2026-10-24
- [x] UX-10 `useUnsavedChangesGuard` on product edit and store General settings — 2026-10-24
- [ ] UX-11 Manual check in a browser (desktop and phone, ar and en) — see §23 2026-10-24 entry

**Phase 10**
- [ ] P10-01 `/sell` rewrite
- [ ] P10-02 `MARKETING_PROJECT.md` facts
- [ ] P10-03 Domain repositioning (separate plan)

**Supabase egress (2026-10-25, branch `perf/supabase-egress`, `docs/egress-audit.md`)**
- [x] EG-01 Template gallery cards and configs cached globally (`templateTags.catalog()`, 24 h backstop) in dashboard and admin; tallaby.com gallery TTL 15 min → 24 h — 2026-10-25
- [x] EG-02 No `revalidatePath("/", "layout")` in the ecommerce auth callback/handoff or the dashboard auth callback — 2026-10-25
- [x] EG-03 Guest order page polls every 60 s and never once final; order items and cart load only title/slug of translations — 2026-10-25
- [x] EG-04 Seller-scoped product listings tagged by seller, not `productTags.listing()`; stock-boundary invalidation bumps the seller tag — 2026-10-25
- [x] EG-05 `images.minimumCacheTTL` 30 days; new uploads `cacheControl: "31536000"` — 2026-10-25
- [x] EG-06 Notification bells poll only without realtime; draft watch and admin orders skip hidden tabs; one `QueryClient` per mount — 2026-10-25
- [x] EG-07 Admin categories counts in two grouped queries; bulk import loads categories once; `countMediaUsage` counts in SQL — 2026-10-25
- [ ] EG-08 Owner decisions: robots.txt rules for store hosts and the admin proxy, `pg_stat_statements_reset()` then one clean week of stats, `getClaims()` for auth reads, `updated_at` triggers for a cheap editor "unpublished changes" check (migration), Supabase MCP logs (bots, storage paths)
- [x] TR-01 Templates store library sections as refs (`libraryRef: { key, patch }`), built from the library's current tree when read (gallery, previews, Studio, new-store default, "Use template"), so a library edit reaches every template using it; the store gets plain trees on apply — 2026-10-25
- [ ] TR-02 Run `backfill:template-refs` on staging, then production with owner approval (AFTER deploying TR-01). **Superseded by TR-04's run** (it now writes named-field refs; never run in the TR-01 patch form)
- [x] TR-03 Library sections name every node (`props.field`, `templates/library-fields.ts`): seeded trees, library save (`prepareLibraryTree`), the section editor and read-time alignment with the code design; `backfill:library-fields` stores the names in existing rows — 2026-10-26
- [x] TR-04 Template refs are `libraryRef: { key, props, styles?, form?, corners?, plain? }`: values per named field (`applyLibraryProps`, `libraryValuesFromTree`); every code template (all 2139 sections) is stored this way and rebuilds exactly; the earlier `patch` form still builds — 2026-10-26
- [x] TR-05 Classic and Atelier designs are library sections (0105, hidden) and their templates are `plain` refs, no visual change — 2026-10-26
- [x] TR-06 Admin template screen is section by section (`apps/admin/app/(builder)/templates/[id]/editor/`): section list per page with header/footer, live preview, a values form per section (copy ar/en, photos, links, lists), add/move/remove/replace, colours & fonts, pages; the full builder stays at `editor/advanced` for one release — 2026-10-26
- [x] TR-07 Rollout: merged to `main` (`9b666a11`) and deployed → 0105 on staging and production → `backfill:library-fields` on both → `backfill:template-refs` on staging (111) and production (109; Classic and Souq skipped, they have admin drafts) — 2026-10-26
- [ ] TR-08 Convert Classic and Souq on production once their admin drafts are published or discarded (re-run `backfill:template-refs`, or open and save them in the new screen); manual E2E of the new screen; then remove `editor/advanced`

**Global confirmations (from the planning brief)**
- [x] The existing default storefront template is kept (§3.6, §8.1, P4-03). No new default template is designed.
- [x] Signup is minimal and asks for no fulfillment choice (§6).
- [x] ~~The 30-day trial is for new sellers (D5) … first builder Publish or first active product (D20).~~ **Replaced 2026-10-18 (0067):** a 7-day trial for every seller account, from the first store's `created_at`, never restarted (§13.1, §13.5).
- [x] ~~The fee is max(EGP 5, 2% of the eligible subtotal).~~ **Replaced 2026-10-18 (0067):** a flat EGP 5 per seller per order, taken from the store wallet on delivery, for all old and new sellers (§13.1, D1).
- [x] A negative store wallet opens a top-up pop-up in the dashboard once per session (2026-10-18).
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
- **Copy differs from §13 on purpose:** the owner chose to ship the design's "flat 5 EGP per order, no percentage" copy (2026-10-18). Fee code is unchanged (`platform-fee.lib.ts` still max(5, 2%)). `lib/pricing.lib.ts` only drives the page calculators. Revisit before launch so the site and the charge match. **Resolved 2026-10-18:** the fee code is now the flat EGP 5 too (0067).
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

### 2026-10-18 — Dashboard sidebar remap and floating WhatsApp support (owner request)

- **Sidebar remap** (`components/dashboard/sidebar.config.ts`, `components/layout/dashboard-routes.lib.ts`, §7.2):
  - The 10-item Website group is split in two. **Website** keeps Overview, Builder, Templates, Design system, Domain & SEO and Social media. A new **Content** group (`nav.content`, AR المحتوى) holds Pages, Blog, Forms and Media library.
  - **Store catalog** (المنتجات المعروضة) moved from the Store settings tabs to the Products group. Its URL changed from `/stores/[storeId]/settings/catalog` to `/stores/[storeId]/catalog`, with no redirect from the old one. It now renders its own `StorePageHeader`, and the sitemap "no products" hint and `revalidatePath` point at the new URL.
  - `DASHBOARD_ROUTES` now follows the sidebar order, and each page's parent matches its sidebar group. Fulfillment is now under Account rather than Settings. Two new config tests enforce both rules.
- **Store switcher** moved from the top of the sidebar to the footer, replacing the seller name/email card next to sign-out. Its menu opens upward. A seller with no store still sees the seller card.
- **WhatsApp support** is no longer a sidebar button. It is now a floating green circle (`SupportWhatsAppButton`) in the bottom-left corner of every `(main)` page, with the same pre-filled message. In LTR on desktop it sits just past the sidebar, and it is hidden when printing. The Help page and the command palette keep their links.
- **Checks:** dashboard typecheck is clean and dashboard tests pass (115). Lint is still blocked by the baseline ESLint crash.
- **Manual browser check (owner):**
  - In AR and EN, expanded and collapsed: the footer switcher opens upward and switches store.
  - The WhatsApp circle sits bottom-left and does not cover the sidebar.
  - Products › Store catalog saves.
  - On mobile pages with a fixed bottom bar (add or edit product), check that the circle doesn't hide a button.

### 2026-10-18 — Store settings › Policies removed (owner request)

- **Why:** a store's return, shipping, privacy and terms pages are now built as website-builder pages, so the separate Policies page goes.
- **Removed:**
  - The `/stores/[storeId]/settings/policies` page, its tab, its sidebar link and its `DASHBOARD_ROUTES` entry.
  - `saveStorePolicies`, `updateStorePolicies` and `storePoliciesSchema`, plus their tests.
  - The "policies" setup-checklist step.
  - The message keys `nav.policies`, `storeSettings.policies`, `storeSettings.errors.policyTooLong` and `home.setup.tasks.policies`.
  - The shipping and return policy accordions in the Tallaby Classic footer. The footer keeps the "About" text. The storefront cache key was bumped to `storefront-v7`.
- **Migration `0065_drop_store_policies.sql` (destructive, applied on staging only):**
  - Rewrites `sellers_create_primary_store`, `sellers_sync_primary_store_profile` and `stores_sync_seller_profile` so they no longer reference policies.
  - Drops `stores.policies`.
  - It ran twice on staging without errors and `sql-tests/stores_invariants.sql` passes. Before the drop, only 2 primary stores had policies, and both were already mirrored in `sellers`.
- **Kept:** `sellers.return_policy` and `sellers.shipping_policy`, which the marketplace store page, checkout and admin read. The primary store no longer syncs into them, and no dashboard page edits them now. A decision is open on whether to drop them too.
- **Checks:**
  - Typecheck: db, lib, dashboard and admin are clean; ecommerce has only the baseline errors.
  - Tests: lib 563 (with staging integration), dashboard 115, ecommerce 126 and store-sections 154 all pass.
- **Production:** needs `0065` after `0050`–`0064`.

### 2026-10-18 — Payments design, EGP currency, brand fields, wallet page (owner requests)

- **Store settings › Payment methods** now follows the Claude design "Dashboard/Seller Payments":
  - A **Cash** card and a **Wallets & instant transfer** card. Rows show a status tag (not set up / on / off) and a masked details line.
  - **Set up** (accent) or **Edit** plus a switch. The last method that is on can't be switched off.
  - The existing **Soon** card is kept.
  - At the owner's request, there is no page title and no customer-preview box.
  - The sheet has the design's "how it works" steps.
  - COD gets an optional **maximum order value** (`codSettingsSchema.maxOrder`, cleared with `null`). It isn't enforced anywhere yet, because storefront checkout doesn't use these methods (P6-05).
- **EGP:**
  - `CurrencyInput` / `CurrencyAddon` (`apps/dashboard/components/form/currency-input.tsx`) show a static "EGP" on the left of every amount field: payments, product price and discount, coupons, top-up and shipping.
  - `formatPricePlain`, `formatPrice` and `formatCurrency` now print `300 EGP` in both languages, with Western digits.
  - Dashboard and marketing Arabic copy says EGP instead of ج.م.
  - **Store settings › General › Currency** sets `stores.settings.currencyLabel` to "EGP" (default), "جنيهاً" or "ج.م". The store's site (Classic product card, product page, cart sheet, storefront cart, builder sections) reads it through `CurrencyLabelProvider`; the storefront cache key is `storefront-v8`. Checkout pages on the store host and the marketplace keep EGP.
  - **Not changed:** `apps/ecommerce/messages/ar.json` still has ج.م strings, because that file has the owner's uncommitted edits.
- **Brand fields:**
  - For sellers with the website builder, logo and banner are no longer in Store settings › General. They are edited in Website › Design system, and General shows a link there.
  - Sellers without the builder flag keep both fields in General, because the Design page is gated by the flag.
  - The `banner_url` column stays, since the marketplace store page uses it.
- **Wallet:**
  - The store wallet (balance, ledger, top-up) moved from `/financial` to a new `/wallet` page.
  - `/financial` keeps the account statements. `/financial/top-up` forwards Kashier returns from before the move to `/wallet/top-up`, and new top-ups return to `/wallet/top-up`.
  - The header shows a **"رصيد المحفظة: 300 EGP"** box linking to `/wallet`. On small screens it shows only the amount, in red when negative. The balance is read fresh in the `(main)` layout.
  - Finance › Wallet was added to the sidebar and to `DASHBOARD_ROUTES`.
- **Checks:**
  - Typecheck: dashboard, lib, store-sections, shipping and marketing are clean; ecommerce and admin have only the baseline errors.
  - Tests pass: lib 394 (unit), dashboard 115, ecommerce 126, store-sections 154.
- **Manual browser check (owner):**
  - Payments: set up a wallet, switch it off and on, and confirm the last method stays locked. Edit COD's fee and max order.
  - Pick "جنيهاً" in Store settings and check the storefront prices.
  - Click the header wallet box, then do a Kashier test top-up and confirm it returns to `/wallet/top-up`.

### 2026-10-18 — Sidebar regrouped into 9 sections (owner request)

- **New order** (`components/dashboard/sidebar.config.ts`, `components/layout/dashboard-routes.lib.ts`): Dashboard · Orders (Orders, Delivery tracking) · Products · Website & Content (flag-gated; the Website and Content groups merged back into one) · Marketing · Fulfillment & Shipping (Riders, Shipping settings, Fulfillment) · Finance & Reports · Apps · Settings (Store settings, Payment methods, My stores, Account settings, Plan & usage, Help).
- No URL, badge, icon or flag logic changed. Group keys renamed: `ordersShipping`→`ordersGroup`, `website`+`content`→`websiteContent`, `storeSettings`+`account`→`settingsGroup`, new `fulfillmentShipping`; the Store settings link now uses `nav.storeSettings` instead of `nav.general`. Messages updated in AR and EN.
- **Active link:** new `findActiveHref` picks the single most specific matching link, so `/settings/plan` lights Plan & usage (not Settings) and only one group auto-opens.
- **Kept outside the spec:** Finance › Wallet (`/wallet`), which the spec didn't list but is an existing page.
- **Checks:** dashboard typecheck clean; dashboard tests 120 pass (sidebar config 20). Lint still blocked by the baseline ESLint crash (`Class extends value undefined`, typescript-eslint vs ESLint 10).
- **Manual browser check (owner):** AR/RTL and EN, desktop and mobile sheet, collapsed rail; flag on and off; `/orders/delivery` highlights only Delivery tracking.

### 2026-10-18 — Store builder released to all sellers (owner request)

- `storeBuilderEnabled` (`components/dashboard/sidebar.config.ts`) now treats an unset `STORE_BUILDER_SELLER_IDS` as `"all"`, so every current and future seller gets Website & Content, the editor and the website pages in every environment without extra config. The flag still works as an override: a comma list limits it, an empty value switches it off.
- Side effect, by design of the existing flag: Store settings no longer shows the brand fields (`brandInSettings`); they live in the builder.
- Documented in `apps/dashboard/.env.example`; 2 new tests in `sidebar.config.test.ts`.
- **Check on deploy:** make sure no environment sets `STORE_BUILDER_SELLER_IDS` to an empty or old list, or it overrides the new default.

### 2026-10-18 — Manual wallet top-ups: Vodafone Cash / InstaPay with receipt and admin approval (owner request)

- **Seller (`/wallet` › Top up wallet):**
  - A three-step dialog (`sm:max-w-[560px]`, no autofocus):
    1. Amount and method: the large EGP field with `min=100` and presets, then Vodafone Cash or InstaPay.
    2. Transfer slip: the exact amount and Tallaby's number, each with a copy button, plus the owner-provided masked holder name. Steps to follow, and an optional "number you sent from".
    3. Receipt: pick or drop a JPG/PNG/WEBP up to 5 MB, with a preview, then **Send for review**.
  - The wallet page shows a "{amount} under review" chip on the balance and a **Top-up requests** list (under review, added, or rejected with the admin's reason).
  - Accounts are in `TALLABY_TOP_UP_ACCOUNTS`: Vodafone Cash 01003272830, InstaPay 01152372358.
- **Money rules:**
  - Submitting records a `seller_wallet_top_ups` row (provider `vodafone_cash`/`instapay`, status `pending`) and credits nothing.
  - Only `reviewManualStoreTopUp` (`@workspace/lib/admin`) credits the wallet. In one locked transaction it re-checks the admin, moves the row out of `pending` once, posts `top_up` through `postStoreWalletEntry` (claim `top_up:<id>`) and writes `admin_audit_log` (`approve_top_up` / `reject_top_up`).
  - A rejection requires a reason.
  - Up to 3 open requests per seller. One request per receipt file.
  - The minimum top-up is now **EGP 100** (`STORE_TOP_UP_MIN_EGP`), for Kashier as well.
- **Receipts:**
  - Stored in the private bucket `store-top-up-proofs` (migration `0066`, applied on staging and idempotent). Sellers can upload into their own `{sellerId}/` folder and read their own files; they can't overwrite or delete.
  - The server action checks the path shape and that the file exists before recording the request.
  - Admins see receipts through 30-minute signed URLs.
- **Admin:** a new **Store top-ups** page (`/store-top-ups`) with a sidebar badge for pending requests. It shows a receipt card per request with Approve (note optional) or Reject (reason required), plus a Reviewed tab.
- **Not used in the UI:** the Kashier card top-up code is kept, but the dialog no longer offers it.
- **Checks:**
  - Typecheck: dashboard, admin and lib are clean apart from the baseline errors.
  - Tests: lib 576 of 578 pass with staging integration. The new `manual-top-up.integration.test.ts` proves that submitting credits nothing, a non-admin is refused, approval credits once with one audit row, a replay is refused, and a rejection needs a reason. The 2 failures are in `seller-setup.integration.test.ts`; they pass when run alone (7/7), so they are flaky under full-suite load on the shared staging database. Dashboard 122 pass.
- **Manual browser check (owner):**
  - Top up 100 EGP by InstaPay with a screenshot and confirm it shows as under review.
  - Approve it in admin › Store top-ups and confirm the balance rises once.
  - Reject a second one with a reason and confirm the seller sees it.
- **Production:** needs `0066`.

### 2026-10-18 — Website editor upgrade planned (Phase 4B, owner request)

- Plan written in `docs/website-builder.md`; no code changed.
- Findings:
  - `SiteConfig` already stores `componentTree`, node `style` and `breakpointStyles`, and sanitizes them, but nothing renders or edits them yet.
  - The editor selects whole sections only.
  - Categories hold 1–6 sections each.
- Planning calls (listed in §8 of the doc, owner can override):
  - Pre-built sections stay prop-based, with "convert to custom" for full control.
  - Superseded sections are hidden from the Add panel, not deleted.
  - There is no map element and there are no raw form inputs.
  - YouTube/Vimeo embeds use a fixed template.
  - Interactive elements are CSS-only.
  - `@dnd-kit` is added only after a spike.

### 2026-10-18 — Flat EGP 5 fee, 7-day trial from the first store, negative-wallet pop-up (owner decision)

- **Business model changed by the owner** (§13.1 note):
  - Tallaby's only profit per order is a **flat EGP 5 per seller per order**, taken from the store wallet when the order is delivered. A wallet at 0 or below keeps going down (−5, −10, …).
  - **7 free days** per seller account, counted from the first store's `created_at`.
- **Owner answers:**
  - The trial is per account (later stores don't restart it).
  - The order's **placed** date decides whether it is free (D4 kept).
  - The new rule applies to **all** sellers: 0067 ends running 30-day trials and admin extensions.
  - The pop-up shows **once per browser session** and can be closed.
- **Code:**
  - `platform-fee.lib.ts`: plan `flat_5` (`rateBps 0`, `minPiastres 500`). The fee is still capped at the seller's line total under EGP 5, and `FEE_TRIAL_DAYS = 7`. Unknown or old plan keys resolve to `flat_5`.
  - `creditSellerOnDelivery` is unchanged: it already posts the `fee` entry on delivery, and negative balances are allowed.
  - Migration **`0067_flat_fee_7_day_trial.sql`** (written, **not applied**):
    - Moves `fee_plan` to `flat_5` (CHECK and DEFAULT).
    - Adds the trigger value `store_created`.
    - Rewrites `start_fee_trial_if_needed` to always use `[min(stores.created_at), +7 days)`.
    - Adds a `stores` AFTER INSERT trigger.
    - Backfills every seller with a store (eligible = true, new window).
  - Schema mirror updated.
  - Trial reminders: the T-7 stage is no longer sent (it would fire on day one); the T-1 email is kept, and the cron selects only the last day.
  - Dashboard:
    - `NegativeWalletDialog` (`components/layout/negative-wallet-dialog.client.tsx`) in the `(main)` layout. It is hidden on `/wallet`, and its **Top up now** button goes to `/wallet?topup=1`, which opens the top-up dialog (`TopUpButton defaultOpen`).
    - Copy updated in `ar.json`/`en.json` (home trial card, wallet "how the fee works", the new `negativeWalletDialog` strings), the trial reminder emails and the admin labels.
  - Docs: `PROJECT.md` §8, `CLAUDE.md` rules 6–7, this plan §13.1, §13.5 and §22.
- **Checks:**
  - Unit tests: lib 400 pass (fee and trial tests rewritten for flat 5 and 7 days), dashboard 122 pass, ecommerce 126 pass, emails and db pass.
  - DB integration tests (`fee-trial`, `place-order-fee`, `admin`, `ensure-seller-account`) are updated but **were not run**: no `TEST_DATABASE_URL` in this session, and 0067 must be applied to the test database first.
  - Typecheck: lib and dashboard are clean. admin (`app/layout.tsx`) and ecommerce (`product-details.tsx`, `profile.chunks.tsx`) fail only on existing errors in files this change didn't touch.
- **Manual check (owner):**
  - Apply 0067 on staging.
  - Place an order with a store created more than 7 days ago, mark it delivered, and confirm the wallet drops by exactly 5.00.
  - With a 0 balance, confirm it reaches −5.00 and the pop-up opens once per session.
  - **Top up now** should open the top-up dialog.
- **Production:** needs `0067`. Sellers on a 30-day trial lose its remaining days when it is applied.

### 2026-10-18 — Sidebar reordered: operations | grow & configure | account & help (owner request)

- **New order** (`components/dashboard/sidebar.config.ts`, `components/layout/dashboard-routes.lib.ts`): Dashboard · Products · Orders · Shipping & Fulfillment · Wallet (Balance & top-ups, Account statements, Reports) · *divider* · Website & Content (flag-gated) · Promotions & Discounts (Coupons, Marketing campaigns) · Apps & integrations · Store settings (General, Payment methods) · *divider* · Account & help (My stores, Business & account, Plan & usage, Help).
- New `{ kind: "divider" }` sidebar entry; `resolveSidebar` drops leading, trailing and doubled dividers (e.g. a seller with no store).
- Account-wide pages left the store settings group for the new `accountHelp` group. Store settings now holds only `[storeId]` pages (a test enforces it).
- Labels: group `finance` → "Wallet"; `/wallet` link → new `nav.walletBalance`; `/coupons` → `nav.coupons` ("Coupons"); `/marketing` → new `nav.campaigns` (`nav.advertiseProducts` stays as that page's heading); store General settings → `nav.general`; `nav.apps` → "Apps & integrations". AR and EN updated. The header breadcrumb and command palette follow `DASHBOARD_ROUTES`.
- No URL, badge, icon (besides the new group's `CircleUserRound`), flag or permission logic changed.
- **Customers:** not added. There is no customers route or page in the dashboard; a comment in the config marks where it goes.
- **Checks:** sidebar config tests 25 pass, dashboard suite passes. Dashboard typecheck: my files are clean; the only errors are in `editor.client.tsx` from the uncommitted `editor.store.ts` work. Lint still blocked by the baseline ESLint crash.
- **Manual browser check (owner):** AR/RTL and EN, desktop, mobile drawer and collapsed rail (dividers show as short rules); flag on and off; a seller with no store; `/settings/plan` lights only Plan & usage and opens Account & help.
- **Follow-up:** the groups now work as an accordion. Opening one closes the others; navigating opens the current page's group (state lifted from `SidebarGroup` into `SidebarContent` in `Sidebar.tsx`).

### 2026-10-18 — Categories & brands per seller; the catalog choice moves to Store settings (owner request)

- **Owner decisions:** move the "all products / selected products" choice into Store settings › General; sellers can pick from the Tallaby pack *or* create their own; the lists are extra fields (marketplace `category_id` / `brand_id` unchanged); lists are per seller, shared by all their stores.
- **Migration `0068_seller_categories_brands.sql`** (written, **not applied**):
  - New `seller_product_categories` and `seller_product_brands` (seller-owned; `source_category_id` / `source_brand_id` remember the pack item, `ON DELETE SET NULL`). Unique per seller on `lower(btrim(name))` and on the source item. RLS on, no policies.
  - `products.seller_category_id` / `seller_brand_id` (nullable, FK `ON DELETE SET NULL`), plus trigger `products_seller_taxonomy_same_seller` so a product can only point at its own seller's items.
  - Schema and relations mirrored.
- **Dashboard `/products/categories-brands`** (`app/(main)/products/categories-brands/`): Categories and Brands tabs. Add = type to search the pack (`categories` incl. Arabic names and parent, `brands`), click a match to copy it in, or "Create “…”" with an optional Arabic name. Rename and delete (products keep everything else). 300 items per list. Never cached (seller data).
- **Product form:** optional "My category" / "My brand" selects in the Basic section (add and edit). They're stripped from the `createProduct` / `updateProduct` payload (those spread form keys into the row) and saved by `setProductSellerTaxonomy`, which checks the product and both items belong to the session's seller. `defaultValues` leave them unset so bulk URL import is unaffected. `actions/products.ts` untouched.
- **Catalog:** the D24 form moved into `stores/[storeId]/settings/` and renders under the General form (saves on its own). `/stores/[storeId]/catalog` now redirects to `…/settings#catalog-mode`; the sitemap "no products" hint links there. Sidebar Products › Catalog → Categories & brands.
- **Not done yet:** the storefronts don't use the seller lists (e.g. Tallaby Classic category circles still use marketplace categories); no quick-add from inside the product form; no drag-to-reorder (a `position` column is ready).
- **Checks:** dashboard tests 147 pass (new `categories-brands.lib.test.ts`, sidebar tests updated); db tests pass; typecheck clean for dashboard (except the existing `editor.client.tsx` errors from the uncommitted editor work), db and lib; ecommerce/admin only have their existing errors. Lint still blocked by the baseline ESLint crash. Not run against a database.
- **Deploy order:** apply `0068` **before** deploying any app. Drizzle lists every `products` column in `select()` / `returning()`, so code with the new columns fails against a database without them.
- **Manual check (owner, after 0068 on staging):** add a pack category (Arabic UI shows the Arabic name), add your own brand, try a duplicate (error), rename, delete one used by a product; set My category on a new product and on an edit, then clear it; Store settings › General shows the catalog section and `/catalog` redirects there.

### 2026-10-18 — Phase 4B editor first: P4B-01…04, 07…11 (owner request: editor functions and UI; one section per category, reused as-is)

- **Scope agreed with the owner:** reuse the existing sections (one per category in the Add panel; `featured-product`, `spacer`, `contact-info`, `blog-featured-post` get `insertable: false` and keep rendering on old pages); include elements and custom sections; defer variants, previews and "convert to custom" (P4B-05/06/13) to the owner's sections/templates plan.
- **`@workspace/store-sections`:**
  - `elements/style.ts`: style whitelist (enums, theme tokens or `COLOR_RE` colors, bounded numbers), `collectPageCss` → one scoped block per page with tablet/phone `max-width` overrides; `hidden` is per device (exact ranges, never inherited); in the editor hidden items are faded, not removed. `PageStyles` renders it (storefront `store-site.tsx` page + chrome, editor canvas).
  - **Differs from the plan doc §4.6 and from Valorcy:** part styles live on the instance (`style.parts[partKey]`, `breakpointStyles.{tablet,mobile}.parts`), not page-level `elementStyles`, so duplicate, copy/paste and header/footer keep them.
  - Editable parts: `partOf(instance.id)(key)` adds `data-part="<id>::<key>"` to titles, texts, buttons, images and item fields of the 15 sections (32 parts). Markup was compared with HEAD for every section: identical apart from the attribute. `LinkProps` gained `data-part` (both hosts forward it).
  - `elements/registry.ts` (19 element types: layout, text, basic), `elements/render.tsx` (server-renderable, links through `SmartLink`/`safeHref`, text never parsed as HTML), `elements/tree.ts` (pure tree ops with link-in-link and list rules), `elements/presets.ts` (the six screenshot layouts), `custom-section` (category `custom`). Node types `divider`, `spacer`, `badge` added (additive, schema version unchanged). Node text overlays: `node.props.translations[locale]`, resolved in `resolveSectionForLocale`.
  - Sanitizer keeps only whitelisted style keys for sections and nodes; validator adds `tree_too_large` (> 300 elements per section).
- **Dashboard editor** (`app/(builder)/stores/[storeId]/editor/`): split into `editor-topbar`, `editor-rail`, `panels/{add,layers,media,pages,brand}-panel`, `editor-sidebar` (Content | Style, "Selected element only / Show all", character counters), `style-panel` + `controls/`, `canvas/{editor-overlay,element-popover}`, `editor-dialogs` (Ctrl+K quick insert, `?` shortcuts), `use-editor-shortcuts`; pure `editor-{commands,selection,style,palette}.lib.ts`. Store: selection with `part`/`nodeId`, rail/tabs, and coalesced undo (same edit key within 1 s = one step). `MediaPicker` gained an optional controlled mode (`open`, `onOpenChange`, `hideTrigger`). Strings added to AR and EN (`storeEditor`); the old `panels`/`sections` keys were removed.
- **Checks:** store-sections 209 tests, dashboard 138, ecommerce 126, lib 400 pass; typecheck clean for store-sections, lib and my dashboard files (the only dashboard errors are in the in-progress `categories-brands.client.tsx`; ecommerce keeps its existing `product-details`/`profile` errors). Lint still blocked by the baseline ESLint crash.
- **Manual browser check (Claude, dev server, Tester store draft, AR, 1000px window):** inserted a hero from Sections; clicked the subtitle → part outline, "عنصر" badge and TEXT popover; LG + Bold applied; double-click title edited in place, Enter committed, undo restored it; Two Column layout created a custom section; Layers tree, auto-expand and auto-scroll; right-click menu Duplicate; Ctrl+K; sidebar Content/Style; phone override wrote a `max-width:767px` rule only. Fixed during the check: swatches had no colors (store `--sf-*` tokens now also set on the editor root), popover covered its element (now above/below), auto-scroll threshold, popover shown for off-screen elements. Test sections were removed again; nothing was published.
- **Owner still to check:** a wide screen (right sidebar shows from 1024px; my window could not be resized), English editing, image double-click → media library, publish → storefront shows part styles at desktop and phone widths, a store published before this work looks unchanged.
- **Not done:** drag and drop (P4B-12), Brand panel fonts/button style (P4B-14), Layers virtualisation, store elements (product card, add to cart) and video.

### 2026-10-18 — Editor: Brand tab (P4B-14), Sections previews + drag and drop (P4B-06, part of P4B-12), Templates / Explore / Forms tabs (owner request)

- **Brand tab** (`panels/brand-panel.client.tsx`, like Valorcy `design-system/brand-panel.tsx`): header with "back to Classic" (confirm), groups for Themes (palette + font pairing + radius, `THEME_PRESETS` in `website/design/design.lib.ts`), Colours (palettes + 7 hex fields), Typography (pairings + heading/body selects limited to `STORE_FONTS`), Buttons & layout (radius, page width, section spacing; numbers kept inside the schema bounds), and a link to logo/favicon/cover on the Design system page. Every change goes through `editDesign` (one undo step; typing coalesces) and autosaves with `saveDesignSystem`, so it is the **same draft** as Website › Design system. **Differs from Valorcy:** no custom CSS, base size, scale ratio or Arabic font (not in `designSystemSchema` / not rendered); no AI palette.
- **Bug fixed (existed before this work):** the canvas, `SitePreview` and the new thumbnails set the Classic `--sf-*` tokens **inline**, which beat `SiteTheme`'s `.sf-site {…}` stylesheet, so colour edits never showed in the editor or the Design page preview. The design-system tokens are now merged into the inline tokens. The canvas also loads the store fonts (`storeFontVariables`) and the heading-font rule, so typography shows too. The storefront (CSS-module tokens, not inline) is unchanged.
- **Sections tab** (P4B-06): a plain collapsible group per library category (no trigger background, count, chevron; searching opens all matches), each insertable section drawn live by `panels/section-thumbnail.client.tsx` (real renderer at 1280px scaled down, `inert`, store theme/products/fonts; Classic parts use `SitePreview`'s stand-ins) with a centred name, "in use" for header/footer, and a zoom dialog with "Add section". Still one section per type: layout variants (P4B-05) are not done.
- **Drag and drop** (part of P4B-12): section cards are `draggable` (`SECTION_DRAG_TYPE`); the canvas frame handles native `dragover`/`drop` (same-origin iframe), shows a drop line between sections, auto-scrolls near the edges and inserts with `addSectionAt` at `dropIndex(...)` (one undo step). Header/footer cards are click-only. No `@dnd-kit` added. Moving existing sections by drag and Layers drag are still open.
- **Templates tab** (`panels/templates-panel.client.tsx`, `template-preview-dialog.client.tsx`): the Website › Templates gallery (`toTemplateCardViews` now shared in `templates/templates.lib.ts`). A card opens a dialog with the template rendered live (page tabs, AR/EN, desktop/phone) with the store's products, details (pages/sections/version, colour swatches, fonts), pages with their sections, and what is kept. "Use template" saves pending edits first, runs the existing `applyTemplate` (drafts only), then reloads the editor. New read-only action `templatePreview` → lib `getStoreTemplateConfig` (ownership checked; active templates only).
- **Explore tab** (`panels/explore-panel.client.tsx`, `explore.server.ts`, `lib/stock-photos/*`): Pexels search (key `PEXELS_API_KEY`, server only, added to `apps/dashboard/.env` and as an empty entry in `.env.example`), cached a day with `createCachedQuery` (new tag `searchTags.stockPhotos()`, public data, no seller id). Suggestions come from the store's industry. Clicking a photo **imports** it: the server looks the photo up by id (never a client URL), downloads only from `https://images.pexels.com`, checks type and the 5 MB limit, uploads to `store-media` under the seller's own folder with the seller's session, records it with `recordMediaAsset`, then the editor uses it like the Images tab. "Photos provided by Pexels" and photographer links are shown.
- **Store industry:** no migration. Store settings › General has an Industry picker (`lib/stores/industries.lib.ts`, 17 industries) that fills the existing `store_category` / `store_category_ar` fields; Explore maps them back to English searches (else the English category, else general terms).
- **Forms tab** (`panels/forms-panel.client.tsx`, like Valorcy `forms-panel.tsx`): the store's forms with field/message counts, "new" badge, "On this page", edit link, search, refresh (also on tab focus). "Add to page" inserts a `contact-form` section bound to the form (`commands.addFormSection`); "New" creates the same starter form as Website › Forms and adds it. Forms are now editor state, so the canvas and inspector see fresh forms. New action `listForms`.
- **Checks:** dashboard `tsc` clean; dashboard tests 159 pass (new: `design.lib.test.ts`, `industries.lib.test.ts`, `stock-photos.lib.test.ts`, `editor-palette.lib.test.ts`, forms command test); `packages/lib` and `packages/cache` `tsc` clean; new lib integration test for `getStoreTemplateConfig` (runs only with `TEST_DATABASE_URL`, not run here). ESLint did not run: it crashes on start (`@typescript-eslint/utils` FlatESLint "Class extends value undefined"), a tooling problem not caused by this change. All new i18n keys exist in `ar.json` and `en.json` (422 uses checked).
- **Manual browser check (Claude, dev server :3002, Tester store, AR):** all 8 rail tabs show; Sections accordion with live previews; drag-and-drop simulated with real `DragEvent`s (synthetic mouse drags can't start native DnD): drop line shown, hero inserted at index 1, line cleared, then undone; Ocean theme set `--sf-brand #0b5cad`, Cairo font and 8px radius on the canvas, then undone; template dialog renders the live preview and details; Explore listed Pexels photos and one import landed in `store-media/<seller>/<store>/…` and on the canvas (the page change was undone; **the imported file stays in Tester's media library**); Forms tab shows its empty state; Industry chips show in Store settings. Not clicked: "Use template" (rewrites drafts) and "New form" (creates a form).
- **Owner still to check:** a real mouse drag from Sections to the canvas; "Use template" on a test store; "New form" / "Add to page" and the form on the storefront; Explore after choosing an industry; English UI.

### 2026-10-18 — Editor drag and drop on `@dnd-kit` (P4B-12) and page templates in Add (owner request)

- **Library:** `@dnd-kit/core` 6.3.1, `@dnd-kit/sortable` 10.0.0, `@dnd-kit/utilities` 3.2.2 (approved for P4-01). Chose the stable line over the new `@dnd-kit/react` 0.5.x (Valorcy uses 0.5.0; 0.5.1 was 3 days old). The native HTML5 section drag was replaced with the same behaviour (drop line, `dropIndex`, edge auto-scroll, header/footer click-only).
- **Architecture** (`editor/dnd/`): one `EditorDndProvider` (sensors: mouse 6 px, touch 200 ms hold, keyboard for Layers); `dnd.types.ts` (payloads, probe, plans); `drop-plan.lib.ts` (pure planner + `applyDropPlan`); `canvas-geometry.lib.ts` (reading-order insertion index and lines, RTL); `canvas-probe.client.ts` (reads the iframe's `data-section-id`/`data-node-id`/`data-part` markers, since store-sections can't hold editor hooks). The frame is one droppable; during a canvas drag it gets `pointer-events: none` and the target is resolved once per animation frame. Every drop is one command (`applyDrop`), so one undo step, autosaved; drops re-plan against the current page, so a stale target writes nothing.
- **Built differently from §4.10 / the brief:** pre-built sections are prop-based and `injectedChildren` is not rendered, so elements dropped on a pre-built section go into a **new custom section** before or after it (nothing is stored that the renderer can't show). Layers sorts elements among siblings only; moves into another container are done on the canvas (checked with `canContain`). An Image element dropped on another image of the page replaces its picture and leaves its old place (one step). The Images tab uses a new `tileWrapper` prop on `MediaLibrary`, whose grids now use container queries (2 columns in the 300 px panel).
- **Templates:** the Templates rail tab moved into Add (Elements · Sections · Templates). "This page" lists the matching page of each template (home ↔ home, otherwise the same slug; no aliases invented) and applies it to that page only (`applyTemplatePage`: deep copy, new section/element ids, header/footer sections dropped, one undo step; design system, header, footer and other pages untouched). "Whole site" is the existing gallery. Creating a page opens Add › Templates. `templatePreview` now also returns each page's full `content`.
- **Checks:** dashboard `tsc` clean; dashboard tests 194 pass (new: `drop-plan.lib.test.ts`, `canvas-geometry.lib.test.ts`, `editor-templates.lib.test.ts`, drop commands); `next build` (dashboard) passes. `pnpm lint` **crashes before linting** (`TypeError: Class extends value undefined` in `@typescript-eslint/utils` 8.50 under ESLint 10.9.1; pre-existing, not from this change).
- **Not checked in a browser** by Claude this time. Owner to check: drag an element, preset, section, Explore photo and Images tile onto the canvas (AR and EN, desktop/mobile widths, touch); move a section and an element with the toolbar grip; sort Layers by mouse and keyboard; create `/about` and apply a template page, then confirm Home and the header are unchanged.

### 2026-10-18 — Content sections: movable parts and items (P4B-16, owner request)

- **What:** in the Content sections (image with text, text, call to action, highlights, FAQ) every part is selectable, styled through the existing inspector/popover, and can be dragged on the canvas (toolbar grip) or stepped with the toolbar ↑/↓: reordered within its container, or moved to another container of the same section that accepts it (image with text: image column ↔ text column). Highlight cards and FAQ questions drag as whole items. Each move is one undo step and autosaves; the inspector shows "Reset layout" when the order differs from the default.
- **Reusable contract:** `SectionDefinition.slots` (`packages/store-sections/src/core/slots.ts`: `parts` = default parts, `accepts` = parts from other slots). Layout is stored in the existing `instance.slots[key].order` (schema field from the reference, unused until now), so **no migration**, and sections saved without it render in the same order as before. Sections render through `PartSlot` (`data-slot` marker; an emptied slot is a dashed drop area in the editor and nothing on the storefront) and mark items with `itemOf` (`data-item`). Any section opts in by declaring `slots` / using `itemOf`; nothing section-specific in the editor.
- **Editor:** `editor-slots.lib.ts` (part/item moves; moving an item carries its translations and its `style.parts["items.N.*"]` styles), `dnd/part-drop.lib.ts` + `dnd/part-probe.client.ts` (slot under or nearest the pointer, insertion line from `canvas-geometry.lib.ts`), new `move-part` / `move-item` payloads and plans in the shared DnD (`dnd.types.ts`, `planDrop`, `sampleCanvas`, `markerOf`, `applyDrop`). Parts never leave their section; elsewhere the drop is refused. The inspector's item ↑/↓ now uses the same move (styles follow).
- **Built differently:** no free nesting of parts (parts are props, not nodes): "containers" are the declared slots. Full element nesting stays in custom sections (P4B-13 eject is still deferred).
- **Checks:** store-sections tests 229 pass (new `core/slots.test.ts`, `render/slots.test.tsx`), `tsc` clean; dashboard tests 197 pass (new `editor-slots.lib.test.ts`, `dnd/part-drop.lib.test.ts`, part/item cases in `drop-plan.lib.test.ts` and `editor-commands.lib.test.ts`), `tsc` clean. Ecommerce `tsc` has 19 pre-existing errors in `product-details.tsx` and `profile.chunks.tsx` (files not touched). `pnpm lint` still crashes (ESLint 10.9.1 vs `@typescript-eslint/utils` 8, see above).
- **Browser check (Claude, Tester store, AR, desktop, draft only, not published):** inserted Image with text, set the button text/link in the inspector, selected the title on the canvas and coloured it, dragged it into the image column (drop line on the column's edge), dragged the button above the paragraph, inserted Highlights and dragged the first card to the end and back, used ↑/↓, saved, reloaded: layout, title colour, button and card order all persisted. Synthetic mouse events were used (the browser tool's single-jump drag doesn't reach dnd-kit's 6 px activation). Owner to check with a real mouse and touch, in EN, and on tablet/mobile widths.

### 2026-10-18 — Section library, phases 1–2 (P4B-05, owner's section library brief)

- **Owner decisions (asked before building):** presets over variants (about 22 section definitions with `layout` props; the library lists ~70 presets = section + layout + props + style, so switching design keeps content and data); newsletter/lead capture bind to `store_forms` (no new table); brands read `seller_product_brands` (0068, owner applies it to staging first) with manual logos as a fallback; phased delivery, a commit per phase. The earlier uncommitted P4B editor work was committed first as its own baseline (`8e3e3f5`, builder files only; the other ~70 uncommitted changes were left untouched).
- **Phase 1 (`64ef692`, `packages/store-sections`):** `src/library/` is the one category tree (15 categories with subcategories), `SectionPreset`, presets for today's layouts (one file per category), search with Arabic spelling folding, capability filters and `instantiatePreset`. The section shell `instance.style.shell` (`elements/shell.ts`: scheme, paddingY, width, background image + overlay, anchor, CSS-only reduced-motion-safe entrance) is applied by `SectionRenderer` on the existing wrapper: CSS variables plus an `<img>` layer, no seller CSS, and **no shell renders byte-identical** (new snapshot test of every section's defaults, AR/EN × edit/public × with/without data). Data contract: new product sources (best-sellers, trending, discounted), sort, brands/reviews/coupon queries and summaries, payment methods, `editorData` (state + host-drawn empty-state actions, so no dashboard route lives in the package), `catalog.counts`, wishlist/account/countdown renderers, new field types (categories, coupon, datetime, layout) and the `data` group. `DataEmpty`/`EmptySection` render editor-only empty, loading and error states (error never says "Add products").
- **Phase 2 (`264be31`, editor):** Add › Sections is the library (`panels/section-library.client.tsx`). It lists the categories; opening one or searching widens the panel (not a flyout over the canvas, so drop targets stay free) to a two-column grid of lazily mounted live previews with subcategory chips, capability filters, a real-count data chip, preview, click-to-insert and drag (`presetId` in the drag payload). Header/footer presets restyle the shared chrome and keep its content; card presets restyle the selected product section. Inspector groups: Design (preset switcher + visual layout picker), Data, Content, Options, plus `showWhen`. Style tab: Section group for the shell. `editor-library.lib.ts` holds the pure rules (design props never include data or content props).
- **Built differently from the brief/§4.3:** layouts are presets of a few sections, not separate section types; `insertable: false` no longer gates the library (a preset may start from a hidden section, e.g. contact details).
- **Checks:** store-sections 321 tests pass, `tsc` clean; dashboard 216 tests pass, `tsc` clean; ecommerce `tsc` unchanged (19 pre-existing errors, none in store-site). `pnpm lint` still crashes before linting (pre-existing).
- **Browser check (Claude, after the owner signed in; EN UI, desktop, Tester store, draft only, not published):** the category list (empty categories hidden), opening Products (wider panel, subcategory chips, capability filters, real-count chips), Arabic search across categories (واتساب → Contact details), inserting Hero › Centered title (selected, inspector Design chips + groups), the Style tab Section group. Found and fixed: switching back to a preset that relies on the defaults (Full-width image) changed nothing; it now resets unset design props to the defaults (test added). Also fixed a dnd-kit hydration mismatch in the Add panel (fixed `DndContext` id). The test section was deleted again. Seen, to improve later: dynamic previews still show the old tiny "no products" text until phase 3, the data chip counts all products even for Featured, and short sections look thin at the 1280px preview width. Owner to check drag with a real mouse, AR UI, tablet/mobile.

### 2026-10-18 — Section library: one designed section per category, accordion panel (P4B-05, owner request)

- **Owner brief:** pre-built sections like the reference "Footprint" (`about-stats`), fully customizable; one section per category for now (more designs will come from Claude Design); Add › Sections back to simple accordions without a trigger background.
- **New sections** (`packages/store-sections/src/sections/library/`, registered after the existing ones, additive): `header-bar`, `footer-columns` (chrome), `hero-split`, `category-tiles`, `product-showcase` (grid/carousel, 3 card designs), `brand-logos` (store brands or uploaded), `promo-split` (coupon or manual code, countdown), `feature-grid`, `testimonial-cards` (written quotes or real reviews + rating summary), `about-story`, `stats-cards` (port of the reference Footprint), `faq-split`, `newsletter-card` and `contact-split` (bound to `store_forms`). Shared `_parts.tsx`: an intro block (eyebrow/title/subtitle) in a reorderable part slot, buttons, product card, rail. Every text, image and item is a marked part (`data-part`/`data-item`), so inline editing, part styles, item drag and the section shell (scheme, padding, width, background, animation) apply. New copy keys `verifiedBuyer`, `whatsappChat`.
- **Built differently from the reference:** no block schema or AI hints; the existing Tallaby contract (props + item collections + slots + shell) already gives the same editing, so no second framework.
- **Library:** `SECTION_PRESETS` now lists 15 presets, one per category (`library/presets/library.ts`; product cards = a "Minimal card" preset on `product-showcase`). The earlier presets are `LEGACY_PRESETS`: not listed, but `getPreset`/`presetsForSection` still resolve them, so saved drags and the design switcher on old sections keep working. Old sections still render on existing pages (nothing removed, no migration).
- **Editor:** `panels/section-library.client.tsx` is a plain accordion per category (icon, name, chevron, no background; any number open, Hero open first; search opens every match). Subcategory chips, capability filters and the wide two-column panel were removed.
- **Checks:** store-sections `tsc` clean, 371 tests pass (14 new default-render snapshots; tests updated for the new list, plus one-per-category and legacy-resolution tests); dashboard `tsc` clean, 230 tests pass; ecommerce `tsc` unchanged (19 existing errors in `product-details.tsx`/`profile.chunks.tsx`). `pnpm lint` still crashes (existing). **No browser check** (the Chrome extension was not connected). Owner to check: each section in the editor AR/EN, desktop/mobile, inserting header/footer, the Minimal card preset, a coupon in Promo banner, and a published page.
- **Folder layout (2026-10-19, owner request, matches the Valorcy `components/sections/` layout):** `sections/library/` is one folder per library category id (`headers/`, `hero/`, `categories/`, `products/`, `brands/`, `promotions/`, `features/`, `testimonials/`, `about/`, `statistics/`, `content/`, `forms/`, `contact/`, `footers/`), one file per section (`hero/hero-split.tsx` …) and an `index.ts` per folder exporting `<CATEGORY>_SECTIONS`. Shared helpers (`uuid`, `INTRO_ONLY`, `ViewAll`, menu link fields, `formId`/`FormArea`) moved into `library/_parts.tsx`. Code moved unchanged; section ids, order and exports are the same. Checks: store-sections `tsc` clean, 371 tests pass (snapshots unchanged).

### 2026-10-19 — Section library: the Claude Design "Modular" set, 93 more tree designs (owner request)

- **Owner brief:** build the sections newly added to the Claude Design "Website Builder Sections" pack (`sx-1…4.js`, the "Modular" direction: ruled cells, bento tiles, dot labels, big numbers) that our collection does not have yet.
- **Built (`packages/store-sections/src/designs/`):** 93 `defineDesign` trees, appended after the existing designs in each folder's `index.ts`. Headers: `header-ruled`, `header-chips`, `header-brand-bar`, `header-departments`. Hero: `hero-bento`, `hero-halves`, `hero-big-word`, `hero-search`. Categories: `categories-ruled`, `-chips`, `-feature-list`, `-big-type`. Products: `products-tabbed`, `-bento`, `-rows`, `-panel-rail`. Promotions: `promo-twin`, `-shipping`, `-percent`, `-tiers`, `-sticker`. Features: `features-ruled`, `-bento`, `-side-title`, `-ticker`, `-compare`, `-orbit`. Stats: `stats-ruled`, `-band`, `-sentence`, `-rating`, `-milestones`. Image with text: `about-list`, `-wide`, `-inset`, `-stories`, `-circle`. Video: `video-vertical`, `-grid`, `-chapters`, `-film`, `-shop`. Gallery: `gallery-captioned`, `-slider`, `-prints`, `-bento`, `-side`. Brands: `brands-ruled`, `-cards`, `-az`, `-quotes`, `-bubbles`. Testimonials: `testimonials-ruled`, `-chat`, `-bento`, `-products`, `-videos`. FAQ: `faq-columns`, `-panel`, `-numbered`, `-chat`, `-topics`. Blog: `blog-dated`, `-bento`, `-rail`, `-tabbed`, `-headline`. Newsletter: `newsletter-ruled`, `-big`, `-interests`, `-sticker`, `-letter`. Contact: `contact-hours`, `-bento`, `-big`, `-router`, `-team`. Rich text: `text-steps`, `-lead`, `-statement`, `-terms`, `-note`. Page header: `page-toolbar`, `-brand`, `-split`, `-centered`, `-count`. Product page (new folder `product-page/`): `product-perks`. Footers: `footer-ruled`, `-signoff`, `-panel`, `-help`, `-links`. Shared Modular pieces live in `designs/_modular.ts`.
- **Store data:** categories designs and the chip header use `categoryList`; hero bento/big word, product designs, the flash sticker (its sticker shows the product's own discount), shop-the-video and the page-header photo rows use `productList`; blog designs use `postList`; newsletter designs and the floating footer use `storeForm`. Lists with `optional` keep the section when they are empty.
- **Data nodes:** `productList` and `categoryList` now honour `offset` like `postList` (query asks for `limit + offset`, the list skips `offset`), so a lead tile and "the rest" never repeat a record. A product list also now stops at its `limit`; this changed the `products-feature` snapshot, which had shown 2 products in its 1-product lead slot.
- **Not built:** Product page Image grid, Spec sheet, Reviews block and Variant tiles (they need the current product's data on the product page, which no data node gives yet). Drawn as still layouts: tabs (chips that link), tickers and carousels (still rows), the chapter list (no seeking), the shipping-goal bar (no live cart total, so the strip states the goal), tilted stickers and prints (no rotation style), the cart total in the brand header.
- **Checks:** store-sections `tsc` clean, 1650 tests pass (93 new snapshots; new offset test in `data.test.tsx`; `designs.test.tsx` data-category set and `library.test.tsx` hero-split/product-page expectations updated). Dashboard `tsc` clean, 226 tests pass. Visual check of every new design at 1280px and 390px (AR) from a headless-Chrome static render; not checked in the editor. Owner to check: insert a few from each category in the editor, AR and EN, desktop and mobile.

### 2026-10-19 — Data nodes: Products, Blog and Newsletter designs; store-data integration map (owner request)

- **Owner brief:** keep showing the categories that need store records, with an "add records" button on the section that opens a new tab. List every part that should come from the backend and propose the UX.
- **Data nodes** (`store-sections/src/elements/data.ts`, tree-sections spec §5.3, first step):
  - New nodes: `productList`, `categoryList`, `postList`, `storeForm` and `addToCart`. They are added to the schema, the registry (palette group "Store data") and the renderer.
  - A list repeats its children once per record. Template nodes bind record fields with `props.bind`.
  - Queries are collected per node id in `collectCatalogQueries`, `collectContentQueries` and `collectFormIds`, so the storefront needed no change.
  - A section with an empty required list or form is not drawn publicly. In the editor it shows the existing `DataEmpty` with its new-tab action, and the editor refreshes the data on return.
  - Lists never nest in lists. Props are checked and clamped.
- **Designs:**
  - Products: 6 (Classic plus P-a…P-e).
  - Blog: 5 (B-a…B-e).
  - Newsletter: 4 (N-a, N-b, N-c, N-e).
  - Footer with sign-up (Z-d).
  - Product-page sections still need page templates, so that category stays hidden.
- **Presets:** designs with data nodes are `dynamic` and carry `dataNeeds`, so the Add panel shows its data chip.
- **Editor:**
  - It now loads the store's published blog posts (`loadEditorPosts`; it never creates the blog) and fills post lists on the canvas and in the Add panel previews.
  - The inspector hides fields whose `showWhen` doesn't match and explains list templates and bound fields.
  - AR/EN strings added.
- **Integration map:** `docs/website-builder-integrations.md` lists every part of the 20 categories that should use store data, with status, gaps and one UX pattern. Main gaps:
  - Header and footer nodes are missing (logo, menu, social, contact, payments, policies).
  - Categories, brands, reviews and coupons are still typed.
  - Address and hours are not in `StoreProfile`, and payment methods are not filled.
  - There are no product-page or category-page templates.
- **Checks:**
  - store-sections: `tsc` clean, 923 tests pass (new `elements/data.test.tsx`; design tests render with sample store data and check the empty states).
  - dashboard: `tsc` clean, 221 tests pass.
  - ecommerce: `tsc` shows one error in `profile.chunks.tsx` (address form), not touched here.
  - Visual check of the new designs with sample data (AR, 1280px) and of the empty editor states in headless Chrome. No in-app check.

### 2026-10-19 — Section library uses the Claude Design categories (owner request)

- **Owner brief:** split FAQ and content apart and put each section in its own category, sticking with the Claude Design categories and sections.
- **Categories (`library/types.ts`, `library/categories.ts`):** the library now has the 20 Claude Design categories, in the same order and with the same names: headers, hero, categories, products, promotions, features, stats (`statistics`), image with text (`image-text`), video, gallery, brands, testimonials, FAQ, blog, newsletter, contact, rich text and policies (`rich-text`), page header and banner (`page-header`), product page (`product-page`), footer (`footers`). Removed: `product-cards`, `about`, `content` and `forms`. The Add panel hides a category until it has a design, so products, blog, newsletter and product page stay hidden for now.
- **Designs:** `designs/content/` is split into `faq/`, `video/`, `gallery/`, `rich-text/` and `page-header/`, and `about/` became `image-text/`. Design ids did not change. Preset ids are now `<category>.<rest of id>` everywhere, e.g. `faq.classic`, `video.wide`, `rich-text.policy`, `page-header.banner`, `image-text.classic`. New editor icons for video, gallery, FAQ, blog, page header and product page.
- **Checks:** store-sections `tsc` clean, 772 tests pass (a new test checks designs follow library category order); dashboard `tsc` clean, 221 tests pass.

### 2026-10-19 — Section library from Claude Design: 78 tree designs (owner request)

- **Owner brief:** build the Claude Design "Section Library" (20 categories, about 100 sections) as element-tree sections like the trial designs, replace the three trial designs, and use Pexels photos that depend on the store industry.
- **Built (`packages/store-sections/src/designs/`):** 78 designs, each a `defineDesign` tree with Classic first in its folder (`headers` 6, `hero` 6, `categories` 6, `brands` 5, `promotions` 5, `features` 4, `testimonials` 5, `about` 5, `statistics` 5, `content` 24 (FAQ, page headers, rich text and policy, video, gallery), `contact` 5, `footers` 4). Shared pieces live in `_kit.ts` and per-folder `_shared.ts`. `hero-split`, `about-story` and `stats-cards` are removed.
- **Presets:** `library/presets/library.ts` now derives one preset per design (`hero-classic` → `hero.classic`; content keeps the full id, e.g. `content.faq-classic`). New subcategories: headers `floating`, hero `sale`, promotions `coupon`, brands `press`, content `video`, `page-header` and `policy`.
- **Industry photos:** `designs/stock-photos.ts` holds 10 Pexels photos per industry (the same ids as the dashboard's `STORE_INDUSTRIES`, plus `general`) and 10 people photos. These are picked through the Pexels API and are hotlinked from `images.pexels.com`. `t.photo(i)` and `t.person(i)` are resolved at insert. `instantiateDesign`, `instantiatePreset` and the editor's `presetInstance` take `industry`, the editor store gets `industry` from the store category (`findIndustry`), and Add-panel previews use it too.
- **Elements:** 23 icons added (search, user, menu, plus, quote, chat, instagram, facebook, youtube, play, rotate, package, image, copy, globe, award, zap, users, store, percent, calendar, headphones, send). The `arrow` icon now flips in LTR.
- **Not built (no data or form nodes yet, Plan 2):** Products (P-a…e and Classic), Product page (Pd-*), Blog (B-*) and Newsletter (N-*), plus the newsletter footer (Z-d) and the shoppable photo (G-d). Showing invented products, prices or posts would break rule 6. Countdown, carousels, marquees, tabs and video players are drawn as still layouts: a deal panel with an end date, side-by-side slides, still logo rows, grouped questions, and a poster with a play link.
- **Known limits:** link blocks put their style on an inner span, so `width` and `order` on a link do not move it in a flex row; designs wrap such links in a sized stack. Header search and cart are links to `/products` and `/cart`. There is no account link, because store hosts have no account page.
- **Checks:** store-sections `tsc` clean, 772 tests pass (snapshots regenerated); dashboard `tsc` clean, 218 tests pass. Visual check of every design at 1280px (AR) and 390px (sample) from a headless-Chrome static render with Tailwind's browser build; no in-app browser check. Owner to check: insert each category in the editor with a store industry set, in AR and EN, on desktop and mobile.

### 2026-10-19 — Tree sections: every section is an element tree; coded sections and Tallaby Classic removed (owner request)

- **Owner decisions:** every section and template is built as an element tree so every element, parent and child, is selectable, styleable and movable (CLAUDE.md rule 17); keep only the three trialled designs (hero-split, about-story, stats-cards); remove the old coded sections entirely, Classic included ("Remove Classic too": new stores start empty until rebuilt). Design: [`docs/superpowers/specs/2026-10-19-tree-sections-design.md`](docs/superpowers/specs/2026-10-19-tree-sections-design.md); plan: [`docs/superpowers/plans/2026-10-19-tree-sections-plan-1-foundation.md`](docs/superpowers/plans/2026-10-19-tree-sections-plan-1-foundation.md) (Tasks 1–7 done, 8–10 open).
- **Built:** `defineDesign` builder + `instantiateDesign` (`packages/store-sections/src/designs/`); `section` root, `card`, `pattern`, `accordion`/`accordionItem` elements; styles for position/inset/z-index/overflow, display sizes, letter spacing, text case, gradients, grid span, order and a hover layer; limits 400 nodes / depth 12; presets with `designId`; new element sections get a `section` root; Layers labels follow the UI language.
- **Removed:** every coded section (`sections/{blog,chrome,classic,commerce,content,engagement}.tsx`, `sections/library/`, the `contact-form` section; `FormFieldsView`/`formCopy` stay for storefront forms), all legacy presets, the Tallaby Classic template (`templates/tallaby-classic.ts`, `classic-sql.ts`, the `classic:sql` script), `RenderContext.renderClassic` and its editor/storefront/website-preview wiring. Store scaffold now creates an empty home page and no header/footer. Migrations untouched (0062 stays applied on staging; its template rows reference removed sections and render nothing).
- **Kept:** the storefront fallback for stores without a published builder site (hero, categories, catalog straight from ecommerce components), so unpublished stores still sell.
- **Not removed yet (dead with no coded sections; next step):** part slots (`core/slots.ts`, `PartSlot`, `editor-slots.lib.ts`, `part-drop.lib.ts`), the prop design switcher / chrome and card presets in `editor-library.lib.ts`, item collections and prop inspector forms, the Forms tab insert (returns false until a `storeForm` node exists, Plan 2).
- **Sections list (owner request):** one category open at a time, no category or section descriptions, centred section titles, previews now include element styles so they match the canvas.
- **Checks:** store-sections `tsc` clean, 231 tests; dashboard `tsc` clean, 214 tests; lib `tsc` clean, 421 tests; ecommerce 138 tests, `tsc` unchanged (19 existing errors); admin `tsc` shows 1 existing error in `app/layout.tsx` (not touched). Backup of the removed files: session scratchpad `backup-before-section-removal/files.tar`.

### 2026-10-18 — Admin SaaS alignment planned (Phase 9B, owner request)

- **Owner brief:** bring admin up to date with the dashboard (website, stores, integrations, templates, etc.); hide Pricing calculator and External orders (comment them out); coupons must include all seller coupons; fulfillment must be one row per seller, with Storage, Returns, CS, Packaging and Delivery inside the request page; reorder the sidebar (Customers and Sellers together); full, advanced integrations while keeping performance, caching and revalidation good.
- **Audit findings:**
  - The admin sidebar is a flat, untested array.
  - Admin coupons show only platform coupons (`seller_id IS NULL`).
  - Admin fulfillment lists one row per service.
  - There is no admin view of stores across sellers, templates, domains, forms, CMS, media or ad requests (the P6-11 gap is confirmed).
  - The seller page loads every panel in one `Promise.all`.
  - `admin_audit_log.seller_id` is `NOT NULL`, which blocks platform-wide audit entries.
  - `orders/[id]/invoice` imports the external-orders types, so that folder must stay.
- **Plan:** [`docs/admin-saas.md`](docs/admin-saas.md), tasks P9B-01…14, decisions D-A1…A6 (defaults chosen there). No code changed yet.

### 2026-10-18 — Admin `/wallets`: seller (store) wallets (owner request, outside the task list)

- **Owner brief:** the seller wallet is the most important ledger; `/wallets` in admin must show everything about it (top-up requests, updating the wallet, transactions, balances).
- **Found:** admin `/wallets` only covered the customer `user_wallets` ledger. The store wallet appeared only on the seller page (latest 50 entries, 20 top-ups) and on `/store-top-ups` (manual top-ups only).
- **Built (no migration, no new money logic):**
  - `packages/lib/src/admin/wallet-view.{lib,server}.ts`: strict filter schemas and read models. Platform totals (held, owed, negative count, top-ups to review, 30-day fees net of reversals, top-ups and sales, ledger check that counts wallets whose balance ≠ sum of entries or ≠ the `sellers.wallet_balance` mirror), a paged list of every seller's wallet, the paged ledger across sellers (type, direction, Cairo date range, search), paged top-ups (Kashier + manual, status, method), a per-seller breakdown (by type, by store, seller identity) and the wallet audit trail (`wallet_adjustment`, `set_negative_limit`, `approve_top_up`, `reject_top_up`). Read-only, never cached. Stores are joined only when `stores.seller_id` matches the entry's seller.
  - Admin `/wallets` now opens on **Seller wallets** (tabs: Wallets · Top-ups · Transactions · Admin log, with KPI cards). The customer wallet tabs are unchanged under `?scope=customers`.
  - New `/wallets/sellers/[sellerId]`: balance, status, ledger and mirror checks, negative limit, fee plan and trial, totals by type and by store, and paged Transactions / Top-ups / Admin log.
  - Writes reuse the existing audited actions only: `walletAdjustmentAction` → `adjustStoreWalletByAdmin` → `postStoreWalletEntry` (credit/debit toggle, idempotency key per form), `sellerOverrideAction` (`set_negative_limit`) and `reviewStoreTopUpAction` → `reviewManualStoreTopUp` (the `/store-top-ups` dialog is exported and reused, with a receipt link signed for 30 min). These actions now also revalidate `/wallets`. The seller page wallet card uses the shared adjust button and links to the full wallet.
- **Not built (needs owner approval, rule 4):** freezing/closing a store wallet. `postStoreWalletEntry` refuses entries on a non-active wallet, so a frozen wallet would make delivery fees fail to post. This needs a decision first.
- **Checks:** `@workspace/lib` `tsc` clean, `src/admin` tests 12 pass (new `wallet-view.lib.test.ts`), integration tests skipped (no `TEST_DATABASE_URL`). Admin `tsc`: only the existing `app/layout.tsx` `DirectionProvider` error, plus `vitest/config` not found from another session's in-progress admin vitest setup (`apps/admin/vitest.config.ts`, `package.json`; not mine, left untouched). `pnpm lint` still crashes before linting (pre-existing). No browser check yet. Owner to check against staging data.

### 2026-10-18 — Categories and Brands on separate pages, with ordering and images (owner request, outside the task list)

- **Pages:** `/products/categories` and `/products/brands` (thin `page.tsx` files; shared `categories-brands/taxonomy-page.data.tsx` and `TaxonomyManager`). `/products/categories-brands` now redirects to `/products/categories`. Sidebar, the route list and the editor's data links (`editor-data.lib.ts`) point at the new pages; the nav key `categoriesBrands` is now `sellerCategories` / `sellerBrands`. The product form links to both pages.
- **Ordering:** drag handle on each row (`@dnd-kit`, pointer and keyboard) plus a "Sort A–Z" action (asks first; sorts by the label shown in the current locale). New action `reorderTaxonomyItems(kind, ids)` takes the seller's full id list, refuses a stale list (`notFound`) and writes `position` in one `UPDATE … CASE`. Dragging is off while the filter is in use. No migration: `position` already exists (0068).
- **Images:** an image field in the Edit dialog (was Rename) and in the "create your own" form. Uses `useSellerUpload` (bucket `sellers`, folder `logos/`, which its policies already allow). The server accepts only `null` or a public URL in that folder of this project's storage (`isSellerTaxonomyImage`). Leaving the image out keeps the current one, so pack image paths are unchanged.
- **Checks:** dashboard `tsc` clean; vitest for categories-brands, sidebar and editor-data: 46 pass (new tests for the image check, A–Z sort and the reorder/image schemas). Lint still crashes before linting (pre-existing). Not run against a database or in a browser.
- **Manual check (owner, after 0068):** on both pages: drag to reorder, reload, and the order is kept; Sort A–Z in Arabic and English; upload, change and remove an image on a pack item and on your own item; the old URL redirects; the product form's "Manage categories" and "Manage brands" links work.

### 2026-10-18 — Phase 9B admin SaaS alignment built (P9B-01…14, owner request "Implement")

- **What changed (admin):**
  - The sidebar is a tested config (`_components/layout/sidebar.config.ts`) with 7 groups; Sellers sit directly above Customers. External orders and Pricing calculator are hidden: their `page.tsx` now calls `notFound()`, with the old code kept in comments.
  - The sidebar has 4 new badge counts in the same single query; that query is React-`cache()`d and shared with the new home action centre.
  - Fulfillment shows one row per seller (`listFulfillmentSellerQueue`, one SQL with `jsonb_agg`). `/fulfillment/[sellerId]` has the profile, a tab per service and previous/next seller. The old 738-line seller panel was split into `fulfillment/[sellerId]/*`, and the seller page shows a summary card instead.
  - `/coupons` has Platform, Sellers and Affiliates tabs. Seller coupons can be deactivated or reactivated with a reason (audited, broadcasts `couponTags.seller`).
  - New pages: `/stores` (directory) and `/stores/[storeId]` (9 URL tabs; only the open tab loads), `/integrations` (overview / connections / errors; `/integration-errors` redirects here), `/ad-requests`, `/domains`, `/templates` and `/audit`.
  - The seller page has 8 URL tabs, each with its own loader. The sellers list gains stores/plan, fee trial and last order columns.
  - The home page has an action centre and SaaS KPIs (one query, not cached).
- **Library:** new `packages/lib/src/admin/{saas.lib,coupons-admin,stores-admin,integrations-admin,ads-admin,domains-admin,templates-admin,audit-view,overview}*.ts` and `fulfillment/queue*.ts`. Every write re-checks the admin in the database, writes `admin_audit_log` in the same transaction, then calls `applyInvalidation(from: "admin")`.
- **Cache:** new `templateTags`, `fulfillmentTags` and `adminTags` plus their descriptors (tested). Only the template list (5 min) and the integration summary (60 s) are Data-Cached. Queues, wallets, coupons, audit and KPIs are not.
- **Migration `0069_admin_saas.sql` (written, not applied anywhere):**
  - `admin_audit_log.seller_id` becomes nullable, with `target_type` / `target_id` and their checks; the guard trigger is updated so platform rows can never be deleted.
  - Indexes: `admin_audit_log_created_idx` and `store_integrations_error_idx`.
  - Until it is applied, template writes return "Apply migration 0069 first". All other features work without it: seller audit rows do not send the new columns, and the audit page reads them through `to_jsonb`. Owner approval is needed before applying it to staging.
- **Built differently from `docs/admin-saas.md`:**
  - Platform coupon CRUD stayed in `actions/coupons.ts`; it was not moved.
  - Fulfillment plans are not Data-Cached (nothing reads them cached yet), but plan saves already broadcast `fulfillmentTags.plans()`.
  - A domain re-check is not audited, because it changes no setting.
  - Ad rejection runs the P6-11 refund after the status change commits, because the refund reads the committed status in its own transaction. A failed refund shows "Not refunded" with a "Retry refund" button (the refund is idempotent).
  - Admin gained `vitest` (`apps/admin/vitest.config.ts`, `test` script; 3 lines in the lockfile).
  - One-line type cast in the untracked `wallet-view.server.ts` (`seller_id` is now nullable).
- **Checks:**
  - `tsc`: lib clean, db clean. Admin is clean except the pre-existing `app/layout.tsx` `DirectionProvider dir` error (file not touched). Use `--incremental false` once, because the stale `tsbuildinfo` lists the deleted panel.
  - Tests: lib 421 passed (new `saas.lib.test.ts`, `fulfillment/queue.test.ts`); cache 38 passed (3 new); admin 8 passed (new `sidebar.config.test.ts`).
  - New `admin/admin-saas.integration.test.ts` (fulfillment aggregate, seller coupon toggle + audit, integration disconnect, store directory scoping) was **not run**: `TEST_DATABASE_URL` is not set here. The existing admin integration tests `select()` whole audit rows, so they need `0069` on the test database.
  - `pnpm lint` still crashes before linting (pre-existing).
- **Not done:**
  - Browser check (Claude does not sign in to admin). Owner to check: the sidebar, `/fulfillment` → a seller → each service tab and previous/next, coupon tabs + deactivate, `/stores` and every store tab, `/integrations` disconnect, `/ad-requests` approve/reject (wallet refund), `/domains` re-check, `/templates` (after `0069`), `/audit`, and the home action centre.
  - Nothing is committed.

### 2026-10-18 — Editor folder reorganised by role (owner request, outside the task list)

- **What:** `apps/dashboard/app/(builder)/stores/[storeId]/editor/` had about 40 files at its top level. They are now grouped by role, and no file was renamed or changed apart from its import paths: `server/` (`editor.{server,data,dto}.ts`, `explore.server.ts`), `state/` (`editor.store.ts`, `use-*` hooks), `lib/` (every `editor*.lib.ts` and its test), `shell/` (topbar, rail, dialogs), `canvas/` (now also `editor-canvas.client.tsx`), `inspector/` (sidebar, inspector, style panel, `controls/`), `panels/` (rail tabs) with `panels/add/` (add panel, section library, thumbnails, page templates, templates gallery and preview), and `dnd/` (unchanged). The folder map is in the editor's `README.md`.
- The moves used `git mv`, so staged and unstaged edits stay where they were. The Website pages in `(main)` that import editor actions, loaders and the preview hook now import them from `editor/server/…` and `editor/state/…`.
- **Checks:** dashboard `tsc` is clean; tests: 31 files and 230 passed, the same as before the move. `pnpm lint` still crashes before linting (pre-existing). Nothing is committed.

### 2026-10-19 — Marketing site moved into apps/ecommerce; marketplace pages removed (owner request, replaces P10-03's marketplace move)

- **What:** the owner pointed the tallaby.com Vercel project at the marketing site and asked for one app: tallaby.com serves the marketing pages, `*.tallaby.com` and custom domains serve seller storefronts, and the marketplace pages (`/products`, `/stores`, `/categories`, `/brands`, `/search`, `/wishlist`, `/sell`, `/affiliate`, `/help`, `/sitemap`, the marketplace home, `/cart`, `/onboarding`, the marketplace sitemaps) are gone. URLs of everything kept are unchanged.
- **Layout:** `app/[locale]/layout.tsx` is a bare shell (fonts, intl, Tallaby pixel/GA). `app/[locale]/(marketing)/` holds the copied marketing pages (`(site)/…`, `follow-us`) with their own `marketing.css` (its palette overrides Tailwind colors, so the groups never share a stylesheet). `app/[locale]/(shop)/` holds storefronts and the customer pages they pass through to (checkout, auth, orders, payment, profile, returns/shipping/cookies) with the old root layout's CSS, providers and metadata. Marketing code lives in `components/marketing/*` and `lib/marketing/*`; messages were merged (marketing `footer` → `siteFooter`).
- Storefront components the deleted routes owned moved to `components/product-page`, `components/products-list`, `components/store-page`.
- Marketing signup callback is `/api/auth/signup-callback` (`/api/auth/callback` stays the customer sign-in callback). Needs `SIGNUP_INTENT_SECRET` in the ecommerce env, and the URL in Supabase Auth redirect URLs.
- Store hosts: `/privacy` and `/terms` are no longer pass-through; they serve the store's own builder page of that slug, or redirect to tallaby.com's. Root `app/not-found.tsx` became `app/global-not-found.tsx` (`experimental.globalNotFound`) plus `app/[locale]/[...rest]` for a localized 404; `/sell` and `/become-seller` redirect to `/`.
- `apps/marketing` was then deleted (owner request) after checking that every file was carried over, including its uncommitted edits (components and messages compared; only the `siteFooter` rename differs). Its `SIGNUP_INTENT_SECRET` was copied into the local `apps/ecommerce/.env`. The tallaby.com Vercel project must build `apps/ecommerce`. Local port stays 3000 for tallaby.com and `{store}.localhost:3000`.
- **Checks:** ecommerce tests 138 passed; `tsc` only shows 3 errors in `components/product-page/product-details.tsx`, which was moved unchanged from HEAD (pre-existing). `pnpm lint` still crashes before linting (pre-existing). Dev server smoke test: all marketing pages 200 (ar + en); `/products`, `/stores` 404; checkout/auth/orders/returns 200; `bein-sport.localhost:3000` home/cart/checkout 200, `/privacy` → tallaby.com/privacy. Pre-existing: `/returns` logs a FORMATTING_ERROR (`costFreeBody` is missing `{days}`). Nothing is committed.

### 2026-10-19 — Responsive editing cues in the editor (owner request, outside the task list)

- **What:** when the canvas shows a tablet or phone, the editor now says clearly that style edits go to that device only. Per-device storage (`breakpointStyles`, desktop base, tablet → phone cascade) was already in place, and no data shape changed.
  - **Canvas strip** (`canvas/device-banner.client.tsx`) above the frame on tablet/phone: what the edit applies to, an info tooltip ("text, images, links and adding/moving/deleting apply to every device; hide to remove from this device only"), and a Desktop button. The frame gets a ring and the active top-bar device button a fill in the device colour (tablet violet, phone amber; `lib/editor-devices.lib.ts`).
  - **Per-field marks** (`inspector/controls/style-override.client.tsx`, provided by the Style tab and the element popover): a coloured dot by a control's label when the edited device sets the value itself (click to drop it and inherit again). A small tablet/phone icon appears when a smaller device keeps its own value, so an edit here won't reach it. Spacing-box cells are tinted (own value) or dashed (kept below). Logic: `overrideState`, `hasDeviceOverrides`, `clearDeviceOverrides` in `lib/editor-style.lib.ts` (tested).
  - **Style tab header** is tinted per device with clearer text, plus "Clear all {device} styles in this section" (the section, its parts and elements).
  - **Delete on tablet/phone** (`state/use-device-commands.client.ts`, which wraps `commands.remove`): the delete still runs on every device, then a toast offers "Hide on {device} only" (undo + hide). The offer lapses after any other edit. This replaces the earlier idea of asking before deleting, which would block every delete.
  - **Layers:** sections with tablet/phone styles show a coloured dot. Rows hidden on the shown device keep an eye-off icon visible.
  - Strings are in `storeEditor.responsive`, `storeEditor.style.editing`, `style.resetSectionDevice` and `layers.hiddenHere/styledHere` (ar + en). `style.editingDesktop/editingDevice` were removed.
- **Checks:** dashboard `tsc` is clean, and the dashboard tests pass (31 files, 221 tests, including 3 new ones in `editor-style.lib.test.ts`). `pnpm lint` still crashes before linting (pre-existing).
- **Not done:** the browser check. The owner should check: switch to phone and see the strip, the ring and the amber device button. Set padding on a section in phone view and see the dot, then click it to reset. Back on desktop, the padding cells should be dashed with a phone icon. Delete an element in phone view and use "Hide on phone only". Check the layers dots, and check RTL and dark mode. Nothing is committed.

### 2026-10-19 — Ready-made forms in the builder's Forms tab; leads inbox (owner request, outside the task list)

- **What:** the Forms tab (and Website › Forms › "New form") now offers 10 ready-made forms: contact, newsletter sign-up, call-back, quote, appointment booking, product question, wholesale, customer feedback, return/exchange and custom order. One click creates the form in the seller's language and, in the editor, adds it to the page.
  - Catalogue: `packages/lib/src/store-forms/form-templates.lib.ts` (fixed field lists, labels from `storeForms.templates.<id>.*`). The server action `createFormFromTemplate(storeId, templateId)` in `website/forms/forms.server.ts` builds the fields on the server and goes through `createForm`, so `requireStore`, the rate limit, the 50-form limit and Zod validation all apply. The client sends only the template id.
  - **Storage:** forms are rows in `store_forms` and every submission is a row in `store_form_submissions` (0054), which is the agreed design (§11.6), not `cms_collections`: submissions are PII with 12-month retention (D28) and their own inbox. No migration.
  - **Leads:** the inbox (Website › Forms, second tab) is now titled **Leads / العملاء المحتملون**. The Forms tab has a "Leads" button, each form's submission count links to its leads, and the "added" toast has a "Leads" action.
  - **Bug fixed:** "Add to page" in the Forms tab called `storeSectionRegistry.get("contact-form")`, which no longer exists since the tree-sections change, so it always failed. It now inserts the new tree design **`contact-form`** (`designs/contact/contact-form.ts`, library Contact › Forms) with the `storeForm` node bound to the form and the title set to the form's name (`formSectionInstance` in `editor-library.lib.ts`). "On this page" now uses `collectFormIds` (tree nodes).
  - Strings in ar + en: `storeForms.templates`, `storeForms.list.templates`, new `storeEditor.forms` keys; `storeForms.starter`, `storeEditor.forms.new/create` were removed.
- **Checks:** typecheck is clean for dashboard, lib and store-sections. Tests: dashboard 223, lib 434 (13 new template tests), store-sections 932 (new design and its snapshot). `elements.test.tsx > renders every palette element` failed in 1 of 4 runs on the `video` element (intermittent; video/YouTube files were being edited in parallel by other work, not touched here). `pnpm lint` still crashes before linting (pre-existing).
- **Not done:** the browser check. The owner should check: in the editor's Forms tab, click a ready-made form; it should appear on the page with its fields. Publish, submit it on the storefront, and see the lead in Website › Forms › Leads. Check RTL. Nothing is committed.

### 2026-10-19 — YouTube video element, richer right sidebar, AI assistant input (owner request, outside the task list)

- **Video element** (`video`, palette group Basic; `packages/store-sections/src/elements/youtube.ts` + registry + `render.tsx`): the seller pastes a YouTube link (watch, youtu.be, Shorts, embed, live). Only the 11-character id is kept, and the player is a fixed `youtube-nocookie.com` embed (rule 9). Options in Content: thumbnail (from YouTube / my image / none), thumbnail image, title for screen readers, and under Advanced: autoplay (always muted, and it drops the thumbnail), muted, loop, player controls, start and end seconds. Publicly, a thumbnail is a small `srcdoc` page in the frame, so YouTube loads only on click. On the canvas the video is a still, so a click selects it instead of starting the player. With no valid link, nothing renders publicly and the editor shows a hint. Style uses the image group (ratio, radius) without Fit.
- **Video designs:** `video-wide`, `video-split` (portrait, for Shorts), `video-cinema` (title now above the player) and `video-playlist` (main player) use `t.video` and are now version 2. Their 4 snapshots were updated on their own (`-t video-`), so other entries stayed. Reels and the playlist rows are still posters that link out. `_video.ts` lost `playButton`.
- **Package additions:** `PropFieldType` `youtube`, `PropDefinition.hint`, `hideWhen`, group `advanced`, and `isFieldShown()`. Copy `videoEmpty/videoTitle/videoAutoplay`.
- **Right sidebar:**
  - New header (`inspector/sidebar-header.client.tsx`): element icon and name, a clickable path (Section › … › element), and quick actions (select parent, duplicate, hide on this device, delete).
  - Tabs have icons, and the empty state is clearer.
  - Fields (`FieldRow` in `editor-inspector.client.tsx`): hints under fields, switches on the label's line, and short selects as button groups.
  - Element fields are split into main, Data, and a collapsible **Advanced** section with the element's options plus **Layer name**.
  - The YouTube field checks the link live (still, "found"/"Short" note, open link).
  - Style-only elements get an "Open the Style tab" link.
- **AI assistant** (`inspector/agent-dock.client.tsx`, `lib/editor-agent.lib.ts`): this is UI only. An input at the foot of the sidebar is marked **Soon** and can be collapsed, and Send is disabled with a tooltip. The selection is attached as an @mention chip (element name · section), which can be removed and comes back on a new selection. `AgentMention` holds only ids (ref, nodeId, part). The future agent must re-read the element and check that the store belongs to the seller before editing.
- Strings are added in ar and en (`storeEditor.agent`, `inspector.youtube`, `inspector.advanced…`, `sidebar.actions…`).
- **Checks:** dashboard `tsc` is clean and its tests pass (32 files, incl. new `editor-agent.lib.test.ts`). The store-sections `tsc` is clean and its tests pass (20 files, incl. new `youtube.test.ts` and a video render test). The ecommerce `tsc` only shows errors in files these changes don't touch (`profile.chunks.tsx`, `product-details.tsx`). `pnpm lint` still crashes before linting (pre-existing).
- **Not done:** the browser check. The owner should check: insert a Video design, paste a link, toggle autoplay/thumbnail/loop/controls/start, publish and play it on the storefront. Also check the sidebar path, the quick actions, Advanced and Layer name, the assistant chip following the selection, and RTL. Nothing is committed.

### 2026-10-19 — Videos from any site, working playlist and reels (owner follow-up to the entry above)

- **Any video link:** `elements/youtube.ts` was replaced by `elements/video.ts` (`parseVideoUrl`, `videoLinkProblem`, `VIDEO_CAPABILITIES`, `videoEmbedUrl`, `videoFacadeDoc`, `videoStillUrl`, `videoPageUrl`).
  - Supported: YouTube (privacy-enhanced embed), Vimeo (`dnt=1`), TikTok (`/player/v1`), Instagram posts and reels (`/embed/`), Facebook videos and reels (`plugins/video.php`), and `https` `.mp4/.webm/.mov/.m4v` files (native `<video>`).
  - Each is a fixed address built from a regex-checked id (rule 9). Share short links (vm.tiktok.com, fb.watch) are explained in the field rather than accepted.
  - Options a site can't do are hidden in the inspector (`ElementDefinition.hideField`) and dropped by `readVideoOptions`.
  - The field type was renamed from `youtube` to `video`. The new 9:16 `story` aspect ratio is in the style whitelist and the Style tab.
- **Playlist:** new `videoPlaylist` (container, `childTypes: ["videoItem"]`, list beside, before or below; always below on phones) and `videoItem` (link, title, length, thumbnail; not in the palette, only inside a playlist; `canContain` rule).
  - Publicly each row is a link whose `target` is the playlist's named frame, so a click plays that video in the player with no script.
  - The playlist counts as a link type, so it never nests in links.
  - "Add Playlist video" sits in its Content tab. The `video-playlist` design (v3) uses `t.playlist`.
- **Reels:** `video-reels` (v2) is now five 9:16 `video` elements with a caption under each. `designs/video/_video.ts` was removed (unused).
- **Sidebar:** elements with no content fields open on Style without changing the tab other elements open on. Layer name was removed from Advanced, and Advanced shows only when an element has advanced options.
- **Checks:** store-sections `tsc` is clean, and its tests pass (20 files: new `video.test.ts`, a playlist render test; only the `video-playlist` and `video-reels` snapshots were updated). Dashboard `tsc` is clean and its tests pass (32 files). The ecommerce `tsc` shows the same 19 errors as before, all in files this work doesn't touch. `pnpm lint` still crashes before linting (pre-existing).
- **Not done:** the browser check. Owner to check: links from each site in a Video element, autoplay/loop per site, a Playlist (click rows, Add video, list position), Reels with TikTok/Instagram links at 9:16, and a spacer/divider opening on Style. Nothing is committed.

### 2026-10-19 — Storefront template 01 "Atelier" (owner request, outside the task list)

- **Source:** Claude Design project "Storefront Templates" (`Templates.html`, `registry.js`, `templates/atelier/*`, `tpl-core.js`). The owner asked for the first template only, until it is reviewed and tested. Templates 02–10 are not started.
- **Built as element trees (rule 17).** `packages/store-sections/src/templates/atelier/`:
  - `chrome.ts`: Centered crest header (announcement bar, menu split around the store name, search / wishlist / account / cart icons, a menu row on tablet and phone) and Centered links footer.
  - `home.ts`, in the design's section map: Inline type hero (its chips are the store's categories), Side-title rail, Feature and four, Wide photo caption, Clean grid (`all`, sorted by rating), Overlap card, Photo split newsletter.
  - `pages.ts`: The house (`about`), Contact (details and the contact form) and FAQ (accordion).
  - Products and categories come from data nodes; nothing about a product is typed into the template.
  - **Deviation from rule 17's path:** these designs live with the template, not in `designs/<category>/`, so they don't show in the Add panel. `getTemplateDesign` resolves their names, and the template test plays the role of `EXPECTED`.
- **Look:** a design system with an ivory, ink, shelf and gold palette, radius 0 and a 1280px container. Headings use **Amiri**, the body uses Noto Kufi Arabic. Amiri is a new store font and pairing (`core/fonts.ts`), loaded in the ecommerce `storefront-font.ts` and the dashboard `store-fonts.ts`.
- **Images:** Pexels photos, each checked by eye. They show clothes on hangers, folded knitwear, bags, fabric and the workshop, with no people, bodies or mannequins (owner rule).
- **New package pieces:**
  - `wishlistButton` element (data group; inside product lists, through the existing `ctx.renderWishlistButton`).
  - `fontFamily` style key (`heading` | `body` tokens only).
  - `t.storeForm({ formTemplate })` and `t.wishlistButton()`.
  - `templates/catalog.ts`: `CODE_TEMPLATES`, `getCodeTemplate`, `templateSeedSql`, run with `pnpm --filter @workspace/store-sections template:sql atelier <file>`.
  - `templates/prepare.ts`: `templateFormNeeds` and `prepareTemplateForStore`.
  - `templateOutline` now lists a tree section's `source`.
- **"Use template"** (`applyStoreTemplate`) now fits the template to the store before the existing draft-only merge:
  - The newsletter and contact forms are created in the store's default language (`formInput`, built from the dashboard's `storeForms.templates.*`), or reused when the store has a form of the same name, and bound to the form nodes.
  - The store's name goes into the header, footer and copyright line.
  - An English-default store gets English first.
  - New pages get names in both languages.
  - Undo leaves the created forms in place: they are ordinary forms.
- **Templates page:** each card shows a live, scaled home-page thumbnail and the palette. **Preview** shows every page with the template's demo store (12 fashion products, 5 categories; preview only, never written), in AR or EN, on desktop or phone, with "Use template" inside. The confirm dialog says when forms will be added. The editor's template preview falls back to the demo store when the store has no products.
- **Storefront links:** builder stores had no shop page, because `/products` redirected home and category links pointed at `/?category=` on the builder home, which ignores them.
  - `/products` (and `/search`) now render the existing catalog (search, categories, sort, pages) inside the site's header and footer.
  - A store without a builder site still lands on its home catalog, as before.
  - Category hrefs are now `/products?category=…`.
  - Wishlist hearts on cards use the real wishlist actions. A guest gets the sign-in dialog (`store-wishlist-button.client.tsx`).
  - Cart, checkout, sign-in, orders and wishlist pages are the existing pass-through pages. They still use Tallaby's own header (pre-existing, not changed, rule 3).
- **Migration `0070_atelier_template.sql`** (generated; a test keeps it in sync). It adds the `atelier` template row, never as the default, plus version 1. It is idempotent. **Not applied anywhere.**
- **Checks:** typecheck is clean for store-sections, lib and dashboard. Ecommerce `tsc` shows the same 19 pre-existing errors in `profile.chunks.tsx` and `product-details.tsx`. Tests: store-sections 1660 (new `atelier.test.tsx`: validity, links, translations, forms, English-first, render with cart and wishlist, seed sync), dashboard 226, lib 434 (a new Atelier integration case runs once `0070` is on the test database), ecommerce 139 (routing tests updated). `pnpm lint` still crashes before linting (pre-existing).
- **Visual check:** every page was rendered with the real renderer and the demo store, then viewed in Chrome. Desktop AR, phone EN and Contact were checked. Fixed during the check: the phone number's digit order in RTL, and the featured demo piece showing twice.
- **Not done:** the in-app check, which needs `0070` on staging. The owner should check: Website › Templates shows Atelier's thumbnail; Preview (pages, AR/EN, phone); Use template, then the editor shows the four pages, Website › Forms has the two new forms, and Publish works. Then on the store: menu links, a category card → `/products?category=`, add to cart → checkout, heart signed out (sign-in dialog) and signed in (wishlist), newsletter and contact submissions in Leads, and `/en`. Nothing is committed.

### 2026-10-19 — Tallaby Classic v3, the default template (owner request, outside the task list)

- **Source:** Claude Design "Tallaby Classic Template" (`store-data.js`, `store.js` sections, `store.css` tokens, page files). The owner asked for Classic as a template and as every new store's default, built as trees and fully customisable.
- **Built as element trees (rule 17)** in `packages/store-sections/src/templates/classic/`, same pattern as Atelier (designs live with the template, ids `tallaby-*`):
  - `chrome.ts`: header (announcement bar, logo mark with the store's first letter, pill menu, search box, account / wishlist / cart; a wrapped menu row on tablet and phone) and a four-column footer (brand and social, Shop, Help, Contact; legal links and payment chips).
  - `home.ts`: hero (tinted panel, arch photo, amber circle), perks, category circles, top picks (`all` sorted by rating), two offer cards, new arrivals, reviews band, blog (the store's posts), newsletter panel with the store's newsletter form.
  - `pages.ts`: About (story, numbers, values, visit us), Contact (contact form card and contact lines), FAQ (grouped accordions and a help card), Privacy and Terms (policy text).
  - Every colour is a design-system token (`white` for cards, as in the design), so the seller's design system restyles all of it. Font: Readex Pro (the storefront face; the design's Montserrat is not a store font).
- **Deviations from the design (on purpose):**
  - Copy is generic ("Everything you need, in one place"), because Classic is the default for every kind of store; the design's gadget catalog is the preview demo store only.
  - No "Offers" link: the catalog has no on-sale filter, so those links go to New arrivals (`/products?sort=newest`) or the shop.
  - Shipping and Returns are the store's system pages (`/shipping`, `/returns`, with its real fees), not template pages.
  - System pages (product, cart, checkout, payment, order, track, auth, account, 404, unavailable) are the existing ecommerce pages, already wired to the backend (rule 3).
- **Images:** Pexels, each checked by eye (gift boxes, shopping bags, parcels, a shop front, a map, and gadgets for the demo). No people or bodies.
- **Default for new stores:** `ensureStoreSiteScaffold` (store creation, signup, first editor open) now calls `seedStarterSite` (`packages/lib/src/stores/starter-site.server.ts`) for an active, never-published store with no home page. In one transaction it claims the home page, creates the newsletter and contact forms in the store's language (`store-forms/starter-forms.lib.ts`; a test keeps the copy equal to the dashboard messages), fits the template (store name, first letter, copyright, English first), and writes the design system (only for a new design-system row), header, footer and six page drafts. Existing stores and published stores are not touched. The live site changes only on Publish.
- **Templates:** `tallaby-classic` key kept (stores' `template_key` already defaults to it), so it shows as the current template. `TemplateDefinition` gained `isDefault` and `folder`; the seed generator writes the default's row as `is_default` and gives a version rollback instead of a row delete. Atelier's `0070` output is unchanged (its sync test passes).
- **Migration `0071_tallaby_classic_template_v3.sql`** (generated; a test keeps it in sync): updates the `tallaby-classic` row (name, description, default), adds version 3 and makes it current; clears any other default. Idempotent. **Not applied anywhere.** Without it the gallery still shows v2 (removed coded sections), but new stores already get v3 from code.
- **Tests updated for the new start:** scaffold (Classic drafts, forms bound, still unpublished), signup (six pages), builder (creates "team", since "about" now exists; reorder lists every page), templates (apply/undo on v3, skipped until `0071` is applied; Atelier fills existing pages). DB tests were not run here (no `TEST_DATABASE_URL`).
- **Checks:** store-sections `tsc` clean, 1670 tests (new `classic.test.tsx`); lib `tsc` clean, 436 passed / 182 skipped; dashboard `tsc` clean, 226 tests; ecommerce the same 19 pre-existing `tsc` errors, 139 tests. `pnpm lint` still fails in `@workspace/ui` (pre-existing).
- **Visual check:** all six pages rendered with the real renderer and the demo store; desktop AR home viewed in Chrome; phone (390px) home/contact/FAQ viewed and measured: no horizontal scroll, desktop menu hidden and phone menu shown on every page. Fixed: the store name wrapping in the phone header.
- **Not done:** the in-app check. The owner should: apply `0071` on staging; create a new store and open Website › Editor (Classic pages, header, footer, forms in Website › Forms); Publish and check the store (add to cart, wishlist, sign in, checkout, contact and newsletter submissions in Leads); Website › Templates shows Classic as current, with Preview. Nothing is committed.

### 2026-10-19: Tallaby fulfillment "Soon", centred header search, Reports hidden (owner requests)

- **"Let Tallaby handle fulfillment" is "Soon":** `TALLABY_FULFILLMENT_ENABLED = false` in `packages/lib/src/fulfillment/constants.ts`. The card is disabled with a Soon badge in the dashboard request form and the onboarding wizard; `collectRequestIssues` rejects `tallaby_fulfillment` (`model:tallaby_fulfillment_unavailable`), so the server refuses it too. New sellers start as `seller_managed` (`recommendedDefaults`). Single Tallaby services (for example standard delivery) under "I want to manage fulfillment" still work. Flip the flag to restore.
- **Header search** is centred on desktop (`md+`): title, search and actions are three equal `flex-1` columns in `dashboard-header.client.tsx`.
- **Reports & Analytics** is commented out of the sidebar (`sidebar.config.ts`); the `/reports` route still exists.
- **Checks:** lib and dashboard `tsc` clean; ecommerce has only the pre-existing `tsc` errors (none in touched files); fulfillment, onboarding and sidebar unit tests pass. `pnpm lint` fails to start (`@typescript-eslint` load error, pre-existing). No in-app check yet.

### 2026-10-19 — Ad plans and store website currency

- **Ad packages (`/marketing`):** removed the "Shown in Featured Products" feature from every package (`apps/dashboard/lib/ad-packages.ts`, `campaign-plan.tsx`, `advertise.package.features*.featured` strings), since the marketplace homepage that showed it is gone. The estimates are unchanged.
- **Website currency (Store settings › General):** `stores.settings.currency` (ISO code) is new, next to the existing `currencyLabel` (the symbol). Ten currencies with fixed symbol lists in `STORE_CURRENCIES` (`packages/lib/src/utils/formatPrice.ts`): EGP (default), SAR, AED, KWD, QAR, BHD, OMR, USD, EUR, GBP. This is display only: amounts are not converted, and the dashboard, wallet and shipping fees stay in EGP. Symbols are presets, never free text, because `formatPrice` puts the label into HTML. `parseStoreCurrency(settings)` replaces `parseCurrencyLabel`, and stores that only have an old EGP label read as EGP. `storeGeneralSettingsSchema` requires `currency` and `currencyLabel` together, and the label must belong to the currency. The UI is a grouped dropdown (Egypt and the Gulf / International) followed by symbol cards. The section title is "Website currency". The settings layout dropped `max-w-4xl`, and General is two columns on `lg` (identity | contact, languages, currency), with the catalog full width below. No migration (jsonb key).
- **Checks:** formatPrice and stores.lib unit tests pass (19); dashboard and lib `tsc` clean; ecommerce and admin `tsc` have only the pre-existing errors in untouched files; `pnpm lint` fails to start (pre-existing). The in-app check could not be done because the browser tab froze while capturing a screenshot.

### 2026-10-19 — tallaby.com: blog, templates and newsletter on Supabase, go-live review (owner request)

- **Blog (CMS source, owner choice):** `/blog` and `/blog/[slug]` read published posts from the dashboard blog (P4-16) of the platform store named by `MARKETING_BLOG_STORE_SUBDOMAIN` (`apps/ecommerce/lib/marketing/blog.server.ts`, cached under `storeTags.cms`, so dashboard saves show without a deploy). Tags `lang:ar` / `lang:en` limit a post to one locale; a category tag (`guides`, `growth`, `stories`, `payments`, `product`) files it. Bodies are re-sanitized (`sanitizeArticleHtml`). Unset variable, unknown store or no posts for the locale → the static posts in `blog.data.ts`. Sitemap lists posts per locale and skips noindex ones.
- **Templates (DB + previews, owner choice):** the gallery joins the hand-made previews with active `templates` rows (`templates.server.ts`, `templateTags.catalog()`). Classic (new preview, key `tallaby-classic`) and Atelier are available; the other previews show "Coming soon" without signup CTAs. Active templates without a preview get a card from `thumbnail_url` (https only). New category `ge` (General). The home hero/fan still use `TEMPLATES` unchanged.
- **Newsletter:** migration `0072_newsletter_subscribers.sql` (RLS on, no policies; **not applied anywhere**), schema mirrored; rate-limited action with honeypot, same answer for new and existing addresses.
- **Review fixes:** `X-Content-Type-Options` + `Referrer-Policy` headers and `poweredByHeader: false` (no frame headers: the dashboard iframes storefronts); `SITE_URL` falls back to `https://www.tallaby.com` in production instead of localhost; removed browser `console.log`s of customer addresses; `formatLongDate` accepts timestamps.
- **Checks:** ecommerce `next build` passes; 150 tests pass (new `blog.lib`, `templates.lib` tests); db `tsc` clean; ecommerce `tsc` has only the 19 pre-existing errors (`profile.chunks.tsx`, `product-details.tsx`); `pnpm lint` crashes in ESLint 10.9.1 (`scopeManager.addGlobals`, pre-existing). ar/en key sets identical.
- **To go live:** apply `0072`; set `NEXT_PUBLIC_SITE_URL`; manual E2E of blog, templates, newsletter, contact and signup not yet done. (Blog source superseded the same day: see "Platform blog managed from admin" below; apply `0073` instead of creating a platform store.)

### 2026-10-19 — Dashboard Help & support page rebuilt (owner request)

- **What:** `/help` (`apps/dashboard/app/(main)/help/`: `help.lib.ts`, `help.data.tsx`, `help.client.tsx`) replaces `components/dashboard/HelpSupport.tsx` (deleted). Its placeholder content is gone: PayPal/Apple Pay, "24/7 live chat", EST phone hours and made-up video view counts.
- **Contact:** only WhatsApp `0100 327 2830` (pre-filled with store name/link via `useSupportWhatsAppUrl`) and `tallabycommerce@gmail.com` (mailto with subject; copy buttons). New `SUPPORT_PHONE_DISPLAY` / `SUPPORT_EMAIL` in `lib/constants.ts`; `WhatsAppIcon` exported from `support-chat-link.client.tsx`.
- **FAQ:** 13 answers checked against code (EGP 5 per delivered order + 7-day trial, Free = 3 stores, no product review, manual top-up EGP 100–20,000 by Vodafone Cash/InstaPay, live store payment methods, Classic template + Publish). Each answer links to the real page; store-scoped links use the selected store (navigation only) or fall back to `/stores`; builder links respect `STORE_BUILDER_SELLER_IDS`. Client-side search with Arabic normalisation. Video tutorials shown as "Coming soon" with planned titles.
- **Checks:** `help.lib.test.ts` (3 tests, incl. ar/en key parity) passes; dashboard `tsc` has no errors in the touched files. `pnpm --filter dashboard lint` crashes before linting (`TypeError: Class extends value undefined` in `@typescript-eslint/utils`, a tooling problem). Manual E2E in a signed-in browser not done yet.

### 2026-10-19 — Platform blog managed from admin (owner request)

- **What:** the tallaby.com blog (`/blog`, `/blog/[slug]`) now has its own table, separate from store blogs, and is written in the admin app (Tallaby site › Blog, `apps/admin/app/(dashboard)/blog/`). This replaces the platform-store CMS source (`MARKETING_BLOG_STORE_SUBDOMAIN` removed). Owner choices: one post holds Arabic and English (a locale with an empty title does not show the post), store-CMS source replaced, static posts in `blog.data.ts` kept as the fallback while the table has no post for the locale.
- **Migration `0073_platform_blog_posts.sql` (not applied anywhere):** `platform_blog_posts` (slug unique, category check, `*_ar`/`*_en` title/excerpt/body, cover, author, tags, reading minutes, `seo` jsonb, `status` draft|published + `published_at`; a future date schedules), RLS on with no policies; public `platform-blog` bucket (2 MB, jpeg/png/webp/avif) with insert/update/delete policies gated on new `public.is_platform_admin()` (verified, unsuspended `role='admin'`). Schema and relations mirrored.
- **Code:** `@workspace/lib/platform-blog` (zod input schema, state/locale helpers) and `/platform-blog/server` (live-post reads); audited writes in `packages/lib/src/admin/platform-blog-admin.server.ts` (platform audit rows, `target_type 'blog_post'`, new actions `create/update/delete_blog_post`; bodies sanitized with `sanitizeArticleHtml` on save and render). New tag `marketingBlogTags.posts()` + `invalidateMarketingBlog()`, broadcast from admin actions. Ecommerce `blog.server.ts`/`blog.lib.ts` read the table (`platformPostToMarketing`). Admin editor reuses `@workspace/tiptap` (added to admin), uploads from the browser to `platform-blog`; delete asks for an audit reason. Admin "View" links use `ECOMMERCE_URL`.
- **Checks:** lib (447), cache (39), ecommerce blog (20) and admin blog/sidebar (13) tests pass; db, cache, lib `tsc` clean; admin `tsc` only has the pre-existing `app/layout.tsx` `DirectionProvider` error; ecommerce `tsc` only the pre-existing `profile.chunks.tsx` / `product-details.tsx` errors. `pnpm lint` still crashes in ESLint 10.9.1 before linting (pre-existing).
- **To go live:** apply `0073` (after `0069`, which allows platform audit rows); manual E2E not done yet: create draft (not on /blog) → publish Arabic-only (on `/ar/blog`, not `/en/blog`, no redeploy) → schedule (hidden until due) → edit → delete with reason (audit rows) → empty table shows static posts → non-admin cannot upload to `platform-blog`.
- **Fix (2026-10-20):** an `admin` could not save or delete posts. The actions required `canManageSettings`, which only the app-level `super_admin` role has, and `super_admin` is not in the DB `user_role` enum. The blog now uses `canManageProducts`, like stores, coupons and ads; the lib still re-checks for a verified, unsuspended admin in the transaction. 0073 also gains the table policy `"platform_blog_posts: admins manage"` (FOR ALL TO authenticated, gated on `is_platform_admin()`), applied to the dev DB. Note: `templates.server.ts` has the same `canManageSettings` gate and is unreachable for the same reason.

### 2026-10-19 — tallaby.com /templates shows the real templates (owner request)
- **Supabase (read-only):** `templates` has 2 active rows, `tallaby-classic` (default, v3, 6 pages) and `atelier` (v1, 4 pages), both without `thumbnail_url`/`preview_url`. The gallery had 7 hand-made mocks; 5 (Volt, Glow, Nook, Charm, Tick) were not real templates.
- **Change:** the gallery lists only active templates with a valid current version (`lib/marketing/templates.{server,lib}.ts`), default first. Mock cards removed (owner); `templates.data.ts` keeps only the decorative mocks used by the home hero, builder studio and fan. A card shows `thumbnail_url`, or else the template's real home page live: new frame route `app/[locale]/(template-preview)/template-preview/[key]/[[...page]]` (own route group: storefront CSS only, noindex, inert links) rendered with the tree-section renderer and the code template's demo store (`resolveDemoCatalog`, new in `@workspace/store-sections/templates`), config from `getPublicTemplateConfig` (new, `@workspace/lib/store-sites/server`, no store involved), cached under `templateTags.catalog()`. `/templates/[id]` (id = template key) shows every real page in an iframe stage with page tabs and a desktop/phone toggle; details show page count, palette and price. Tallaby tracking skips iframes (`useIsMarketplaceHost`). Mock-only `templates.items.*`, `soon` and detail keys removed from `ar.json`/`en.json`; `detail.pageCount`/`detail.colors` added.
- **Checks:** store-sections templates (27) and ecommerce `lib/marketing` (20) tests pass; lib and store-sections `tsc` clean; ecommerce `tsc` only the pre-existing `profile.chunks.tsx` / `product-details.tsx` errors; `pnpm lint` still crashes in ESLint 10.9.1 (pre-existing). Dev server: `/templates`, `/en/templates`, `/templates/atelier` 200; `/templates/volt` and `/template-preview/nope` 404; the Atelier and Classic frames render correctly in Chrome (screenshots). Not checked in a browser: the card iframe scaling and stage toggles (Chrome here could not open `localhost`, and Next dev blocks hydration on `127.0.0.1`).

### 2026-10-20 — Admin: real Settings/Payments/Shipping, sortable tables, site links (owner request)

- **Mock data removed:** Settings, Payments and Shipping were hard-coded demo pages (fake customers, `example.com` emails), and the sidebar footer showed "Admin User / admin@example.com". All now read Supabase through new read models in `packages/lib/src/admin/platform-admin.server.ts`:
  - **Settings:** the signed-in admin, the admin team (`users.role = 'admin'`), platform counts, the default template, seller plans (`@workspace/lib/plans`), the EGP 5 fee and the 7-day trial (`platform-fee.lib.ts`), and whether each service env var is set. No secret values are shown; only `ECOMMERCE_URL` and `DASHBOARD_URL` are printed. Read-only; each rule links to where it is changed.
  - **Payments:** order payments by method and status (`orders`), the latest 100 gateway transactions (`payments`, empty today) and store top-ups by status. Grouping is in `payments.lib.ts`.
  - **Shipping:** providers with shipment counts, the shipping app's automation switches, shipments by status, the latest 100 shipments and the store shipping zones count.
  - The user menu's dead links (`/settings/profile`, `/financial`) and the placeholder "Notifications · Soon" button are removed.
- **Reusable table:** `_components/admin-table/` (`AdminTable` and `admin-table.lib.ts`) has one column config, sortable headers and an empty state.
  - **`url` mode** (Stores, Domains, Audit) writes `?sort=id.asc|desc`, goes back to page 1, and the query sorts through an allow-list (`adminOrderBy` in `list-sort.server.ts`; `STORE_SORT_IDS`, `DOMAIN_SORT_IDS`, `AUDIT_SORT_IDS`).
  - **`client` mode** sorts the rows given to it: Templates, Payments, Shipping, Settings, Fulfillment, Ad campaigns, Integrations, seller coupons and the store detail tabs. On paginated lists (Fulfillment, Ad campaigns, Integrations, coupons) it sorts the current page only.
  - The TanStack `DataTable` lists already sorted.
  - Not converted: Blog (others' uncommitted work) and the affiliate order history (paged through a server action).
- **Links:**
  - On `/stores`, the Host is a link to `storeUrl()` that opens in a new tab.
  - On `/templates`, a shown template's name opens `<ecommerce>/templates/<key>` in a new tab (`lib/site-urls.ts`; `getStorefrontBaseUrl` now uses it).
- **Fix:** template edit and "Make default" required `canManageSettings`, which no DB role has (same bug as the blog). They now use `canManageProducts`, and the lib still re-checks for a verified, unsuspended admin.
- **Checks:**
  - Admin tests (23, including new `admin-table.lib` and `payments.lib`) and lib admin tests (21) pass.
  - The new SQL ran read-only against Supabase.
  - lib `tsc` is clean. Admin `tsc` only has the pre-existing `app/layout.tsx` `DirectionProvider` error.
  - ESLint still crashes before linting (pre-existing).
- **Not checked:** the admin pages in a signed-in browser (manual E2E pending). Locally, `apps/admin/.env` has `ECOMMERCE_DOMAIN=http://localhost:3001`, which is the admin itself, so template links need `ECOMMERCE_URL=http://localhost:3000` there.

### 2026-10-20 — Production database migrated to `0073` (owner-approved)

- **Owner request:** "make production supabase fully ready for our merge to production". After the dry run, the owner chose "Apply now".
- **Approach:** production keeps its own data, because it is the source of truth; staging was only the test bed. Migrations `0050`–`0073` were replayed on production (`sakwqwocbccpyrmwjowq`) with `psql` through the session pooler. Staging data was **not** copied.
- **Staging first:** `0072` was applied to staging (twice, idempotent). `0069`, `0070`, `0071` and `0073` were re-run on staging with no errors. Staging is now at `0073`.
  - Finding: `0050` cannot be re-run **after** `0065`, because its backfill `INSERT` names the dropped `stores.policies` column. A fresh in-order apply is fine. Do not re-run `0050` on a database that already has `0065`.
- **Read-only production pre-checks:** 0 duplicate sale rows, 0 `seller_wallet` vs `sellers.wallet_balance` mismatches, 0 bad or NULL subdomains, 0 storefront orders, 7 storefront carts, 0 custom domains. One balance vs ledger mismatch: seller "Tallaby", 538.20 with no ledger rows, the same case staging had, handled by `0061` (owner decision 2026-10-17).
- **Compatibility of the live `main` code with the new schema:**
  - The changes add things only: new tables and nullable or defaulted columns.
  - The only column dropped is `stores.policies`, which `0065` adds and drops in the same chain.
  - `main`'s only ledger write (`credit-seller-on-delivery`) inserts a `sale` once per seller and order, which the new append-only trigger and `wallet_transactions_sale_once` allow.
  - The fee is computed in code, so `main` keeps its 5% commission until the merge is deployed.
- **Dry run:** the whole chain (without `0061`, because an enum value can't be used in the transaction that adds it) ran on production in one transaction, then ROLLBACK. There were no errors and all post-checks passed. Afterwards production was confirmed unchanged.
- **Backup:** `pg_dump -Fc` of `public`, `auth`, `storage`, `shipping_realtime` and `drizzle` (1.6 MB, 106 table-data entries), taken 2026-10-20T03:05:25Z and kept locally on the owner's machine, not in the repo. PITR status was not checked: no Supabase MCP or dashboard access in this session.
- **Apply** ran as three transactions with `lock_timeout` 5s, all rc=0:
  - `0050`–`0060`: 03:09:38–03:09:52Z
  - `0061`: 03:09:52–03:09:53Z
  - `0062`–`0073`: 03:09:53–03:09:59Z
- **Fee switch-over:**
  - `0059`/`0067` stamp `fee_plan_effective_at` with the apply time (2026-10-20 ≈03:10Z). The EGP 5 fee only starts with the deploy of this branch, so **record the deploy time here as the real fee switch-over**.
  - `0067` set every seller's trial to [first store `created_at`, +7 days). The 4 sellers created 2026-10-14…16 are still inside it; everyone else pays from their next order once the code is live.
- **Post-checks on production (all pass):**
  - 11 sellers → 11 primary stores, subdomains equal.
  - 0 redirects, domains, storefront carts or storefront orders without `store_id`.
  - 11 wallets, 0 balance vs ledger mismatches, and one ledger row: `adjustment 538.20 (admin:opening_balance)`.
  - Every seller is on `flat_5`.
  - Current templates: `atelier` v1, `tallaby-classic` v3.
  - Buckets `store-media`, `store-top-up-proofs` and `platform-blog` were added with 9 policies.
  - 0 `public` tables without RLS.
  - `stores_invariants.sql`: ALL STORE INVARIANTS PASSED (rolled back).
- **Parity:** `pg_dump -s -n public` of production and staging are **identical** (0 diff lines). The advisor-style SQL lint gives the same counts on both: 70 unindexed FKs, which on the new tables are mostly audit `created_by`/`*_by` columns that are not filtered on (§11.11.5), and 8 functions without a fixed `search_path`, all pre-existing. MCP `get_advisors` was not run.
- **Still to do at merge time (owner):**
  1. Deploy all apps from the branch and record the deploy time above.
  2. Set Vercel env vars for production: `NEXT_PUBLIC_DASHBOARD_URL` if not the default, cron secrets, Kashier keys, and `STORE_BUILDER_SELLER_IDS` if the builder should be gated.
  3. Check the Vault `shipping_automation` webhook config. Vault is untouched by this work.
  4. Repoint the local `.env` files deliberately. `apps/admin/.env` now points at staging too.
  5. Smoke test: one checkout with the fee in admin order detail, a storefront render and a builder publish.
  6. Run `get_advisors` from the Supabase dashboard.

### 2026-10-20 — Storefront templates 02–38: library-built, Fashion batch live (owner request)

- **Owner decisions (2026-10-20, in chat):**
  - Build the 37 remaining Claude Design templates in batches by store category.
  - Keep the app's real cart, checkout, account and order pages, themed through the design system. Don't rebuild them per template.
  - Template-seed migrations go to production after tests, a render check, staging and a rolled-back production dry run, without asking again per batch. This covers new template rows only: never the default, never Atelier or Classic.
- **Approach:** the section library already has the sections each template's map names, so templates 02–38 are made from library designs instead of hand-written trees. Every section is still an element tree (rule 17).
  - `templates/_library.ts` `fromLibrary(templateKey, design, patch)` returns the template's own design (`<key>-<library id>`), changing:
    - copy, by exact Arabic match, in both languages;
    - photos, by `photo(i)` / `person(i)` slot;
    - fixed links, all occurrences or one per occurrence;
    - data-list settings.
  - Strict: a swap that doesn't match, or a photo slot without a template photo, throws, so library stock photos never reach a template.
  - It also gives the library's placeholder name the `storeName` / `storeInitial` / `copyright` roles, binds `storeForm`s to the `newsletter` / `contact` ready-made forms, and clamps corner radii to the template's (`corners`).
  - Inside `accent` blocks it turns muted text and accent marks to `foreground`, because library designs assume a light accent.
  - `templates/library-template.ts`: `libraryTemplate(spec)` (look, chrome, pages → `TemplateDefinition`), `demoStore`, `pexels`, and `handle()` (keeps `@name` left-to-right in RTL).
  - `designs/builder.ts`: `createTreeBuilder(industry, photos?)`, an optional photo set read before stock photos. Library behaviour is otherwise unchanged.
  - `catalog.ts`: `LIBRARY_TEMPLATES`, and `templatesSeedSql` (one migration per batch: `template:sql key1,key2 <file>`).
- **Fonts:** 10 Arabic+Latin Google fonts the designs name were added to `STORE_FONTS` and both loaders (ecommerce `storefront-font.ts`, dashboard `store-fonts.ts`): Rubik, Noto Sans Arabic, Alexandria, Changa, Noto Naskh Arabic, Lalezar, Aref Ruqaa, Reem Kufi, Baloo Bhaijaan 2, Lemonada. None are preloaded.
- **Template previews (tallaby.com gallery, `template-preview/[key]`):** a section with an unbound form is hidden publicly, so footers with a sign-up and every newsletter or contact section were missing from previews (Atelier's too). The preview now binds the template's ready-made forms the way "Use template" does and draws still versions of them (`starterPreviewForm`, new export `@workspace/lib/store-forms/starter`).
- **Fashion batch (`0074_fashion_templates.sql`):**
  - **02 Mode** ("Sayra Studio", Readex Pro, 14px corners).
  - **03 Streetwear** ("Hara Supply", Rubik, square corners).
  - **04 Kasr** ("Kasr Studio", Amiri / Noto Sans Arabic, square corners).
  - Each has home, about, contact and FAQ pages and a 10–12 product demo store.
  - Photos are Pexels, checked by eye on contact sheets: no people, bodies, mannequins or third-party logos.
  - Design gaps are kept as in the registry notes. There is no sale filter on `/products`, so sale links use `?sort=popularity`, and category tiles link to `/products`.
- **Checks:**
  - `library-templates.test.tsx` runs per template: valid config, own designs only, fonts the storefront loads, Arabic copy translated, no placeholder copy, no stock photos, store-only links, forms/name/copyright bound, every section renders, demo store, seed in sync.
  - `_library.test.ts` (5) covers the helper's strictness.
  - store-sections 1706/1706 pass. store-sections, lib and dashboard `tsc` are clean. Ecommerce `tsc` only has the 16 pre-existing `profile.chunks.tsx` errors. lib store-forms tests pass.
  - **Visual:** ecommerce dev server against staging, Chrome at `127.0.0.1:3000/template-preview/<key>` (`localhost` returns 431 because of large local cookies). Checked Mode home, about and English contact, Streetwear home and Kasr home.
  - Fixed during the check: low-contrast copy on strong accent tiles, rounded corners in square templates, `@handle` order in RTL, and the footer missing from previews.
  - Phone width wasn't checked: the window wouldn't resize below desktop in this browser. The sections are library designs that were already checked at phone width.
- **Rollout:** staging applied twice (idempotent), then a production dry run in a rolled-back transaction, then production at 2026-10-20T03:59:07Z. Config hashes are identical on both.
- **Incident (production write by mistake, fixed):**
  - A `mode` row (v1, an earlier build of the template) appeared on production at 03:31:25Z, when the first `0074` (Mode only) was applied, which was meant to be staging only. The cause was not found: the env files point where they should, there's no replication between the projects, and nothing in the apps seeds templates.
  - Nothing referenced it (0 installs, 0 stores). It was deleted in the same transaction that applied the current `0074`.
  - Every scripted write now goes through guards that check the project ref and a staging-only marker (the `qa-owner-store` store) before running.
- **Electronics batch (`0075_electronics_templates.sql`), 2026-10-20:**
  - **05 TechHub** ("Volta Store", Cairo / IBM Plex Sans Arabic, search-first).
  - **06 Volt** ("Shahn Mobile", Alexandria, industry `mobile-accessories`).
  - **07 Arcade** and **08 Arena** (dark mode, Changa).
  - New shared helpers: `templates/_pages.ts` (`pageHeader`, `aboutStory`, `contactPage`, `faqPage`).
  - **Renderer fix:** the `light` button variant was `bg-white text-(--sf-ink)`, which made white text on a white button in dark themes. It is now `bg-white text-neutral-900`. Light themes look the same (their ink is near-black). Two library snapshots were updated; only that class changed.
  - The test's link check now also allows `tel:` (the help-first footer's call link).
  - Gaps kept: "Bought together" (Volt) has no library design, so it was left out. Video sections show no player until the seller pastes a link (existing behaviour). The library's sample phone numbers stay for the seller to edit.
  - Checks: store-sections 1743/1743, `tsc` clean. Visual check of all four homes (Arcade and Arena in dark mode).
  - Staging applied twice, then production through the scripted push (refuses existing keys or the default; dry run; apply; config hashes compared): applied 2026-10-20T04:09:42Z, hashes match.
- **Beauty batch (`0076_beauty_templates.sql`), 2026-10-20:**
  - **09 Pure** ("Nabta Skin", Noto Naskh Arabic / Almarai).
  - **10 Glow** ("Wardi Beauty", Lalezar / Tajawal).
  - **11 Élixir** ("Oud & Rose", Aref Ruqaa / Noto Kufi Arabic).
  - **12 Botanica** ("Nile Botanics", Noto Naskh Arabic / IBM Plex Sans Arabic).
  - Photos are products and plants only: no faces, hands or brand labels. The design's model and face shots were replaced.
  - Left out: Botanica's "Big headline" blog section, because a store without posts would hide it.
  - Checks: store-sections 1780/1780, `tsc` clean. Visual check of the Glow and Élixir homes.
  - Production: 2026-10-20T04:16:25Z, hashes match staging.
- **Home & Kitchen batch (`0077_home_kitchen_templates.sql`), 2026-10-20:**
  - **13 Nest** ("Sakan Home", Reem Kufi / Noto Sans Arabic, industry `home`).
  - **14 Daily** ("Matbakhna", Baloo Bhaijaan 2, `kitchen`).
  - **15 Hearth** ("Hearth & Co.", Readex Pro, `kitchen`).
  - **16 Clay** ("Copper & Clay", Reem Kufi / Almarai, `kitchen`).
  - Gaps kept: Nest's "Shoppable photo" has no library design, so it was left out. Clay's recipe "Post bento" was left out (hidden without posts). Clay's "shop by material" uses the brand tiles with material names that search the catalog.
  - Checks: suite and `tsc` pass. Visual check of Nest and Clay.
  - Production: 2026-10-20T04:22:47Z, hashes match staging.
- **Groceries & Food batch (`0078_food_templates.sql`), 2026-10-20:**
  - **17 Sizzle** ("Sekka Grill", Lalezar / Almarai).
  - **18 Harvest** ("Souq Akhdar", Tajawal).
  - **19 Loaf** ("Loaf & Co.", Lalezar / Tajawal).
  - **20 Roast** ("Bunn House", Lalezar / Tajawal).
  - All use industry `food`. Photos are food and produce only: no hands or brand marks.
  - Gaps kept: no live countdown timer (the deal card shows a fixed end date the seller edits). Loaf's subscription is an ordinary product, with no recurring billing.
  - Checks: store-sections 1854/1854, `tsc` clean. Visual check of Sizzle and Roast.
  - Production: 2026-10-20T04:28:45Z, hashes match staging.
- **Furniture & Decor batch (`0079_furniture_templates.sql`), 2026-10-20:**
  - **21 Verdant**, **22 Loft**, **23 Oak**, **24 Sakan**, all with industry `home`.
  - The link test now also allows `mailto:` and Google Maps (the contact bento).
  - Gaps kept: the "Shoppable photo" sections (Verdant, Loft) have no library design and were left out.
  - Checks: store-sections 1891/1891, `tsc` clean. No visual check for this batch: the usage limit was reached.
  - Production: 2026-10-20T04:33:29Z, hashes match staging.
- **Jewelry batch (`0080_jewelry_templates.sql`), 2026-10-20:**
  - **25 Lumière** ("Dahab House", Aref Ruqaa / Noto Kufi Arabic).
  - **26 Karat** ("Zeina Accessories", Lalezar / Tajawal).
  - **27 Fadda** ("Fadda Studio", Readex Pro).
  - All use industry `jewelry`. Photos show pieces on stands, trays and in boxes: no hands, ears, necks or neck-shaped busts.
  - Left out: Fadda`s "Big headline" blog section (hidden without posts).
  - The seed check now has a 60s timeout, since building every template takes longer as the list grows.
  - Checks: 1919/1919, `tsc` clean. Visual check of Lumière, Fadda, and Verdant from the Furniture batch.
  - Production: 2026-10-20T05:47:35Z, hashes match staging.
- **Toys, Kids & Baby batch (`0081_kids_templates.sql`), 2026-10-20:**
  - **28 Playroom** (Lemonada / Tajawal).
  - **29 Bambino** (Baloo Bhaijaan 2).
  - **30 Doodle** (Lemonada / Tajawal).
  - **31 Hekaya** (Baloo Bhaijaan 2).
  - Industry `kids`, except Hekaya, which uses `books`.
  - The design`s photos show children; under the no-people rule they were replaced with toys, blocks, blankets and books only.
  - Left out: Hekaya`s "Post bento" blog section.
  - Checks: 1956/1956, `tsc` clean. Visual check of Playroom and Hekaya.
  - Production: 2026-10-20T05:53:11Z, hashes match staging.
- **Sports batch (`0082_sports_templates.sql`), 2026-10-20:**
  - **32 Pace** (Changa), **33 Stride** (Alexandria), **34 Core** (Cairo, square corners), **35 Basecamp** (Changa). Industry `sports`.
  - Basecamp opens with `hero-poster` instead of the design's `video-film`: a video node with no link renders nothing on the storefront, so the opening had no image. **Follow-up:** Arena, Kasr and Clay (already on production) use `video-film`; check whether their films look empty and, if so, ship a v2 with a photo opening.
  - Left out: library stock photo 6740821 at 1280px (the test rejects stock photos); Nike/branded and person photos from the contact sheets.
  - Checks: 1992 store-sections tests plus 316/316 template tests, `tsc` clean. Visual check of all four.
  - Production: 2026-10-20T06:10:39Z, hashes match staging.
- **Automotive batch (`0083_auto_templates.sql`), 2026-10-20:**
  - **36 Garage** (Changa), **37 Drive** (IBM Plex Sans Arabic), **38 Moto** (Changa). Industry `auto`, matching `STORE_INDUSTRIES` (not `automotive`).
  - Left out: Drive's "Bought together" (a product-page section, as in Volt). Drive's home FAQ is `as: "driver-questions"` so its ids do not clash with the FAQ page's `faq-columns`.
  - Photos: no car badges, product labels (Motul, Chemical Guys and others), riders or hands. Garage and Moto brand names (Apex Helmets, Ridgeline…) are made up.
  - Checks: 2021/2021 store-sections tests, `tsc` clean. Visual check of all three.
  - Production: 2026-10-20T06:18:46Z, hashes match staging. **All 38 Claude Design templates are now on staging and production.**
- **Owner decision needed:** a `video` node with no link renders nothing on a live storefront (`render-video.tsx`), so Arena's, Kasr's and Clay's `video-film` / `video-shop` blocks show only their text until the seller adds a link. One option is to show the poster photo, with no play button, when there is no link. This changes live storefront behaviour, so it was not done.
- **Tallaby Classic sites for the current production sellers (owner request), 2026-10-20 ~06:30Z:**
  - Production had 11 active stores, all approved and never published, with no pages, design systems, forms or store catalogs. Every store uses `catalog_mode = 'all'`.
  - **What was done:** the app's own `ensureStoreSiteScaffold`, then `publishStoreSite` for stores with active products, run in one transaction against production. A rolled-back dry run came first, and the site tables were backed up first (`pg_dump --data-only`).
  - **All 11 stores:** Classic v3 in their builder drafts: 6 pages (home, about, contact, faq, privacy, terms), newsletter and contact forms, the design system, and the store name in the header and footer. This is what the builder does automatically on first open.
  - **Published (revision 1):** Faster (52 active products), Tallaby `store-b61a4987` (3), Qavero (1) and Sherin Handmade (1). `publishedBy` is the seller's own user id.
  - **Drafts only:** Bein Sport, Abdelrahman Mahmoud, Apex-multi, Mohamed Ayman, Adham Elagnaby, A D Cosmetics and جاليري وانتيكا. None has an active product, and a published site with empty product sections would look broken. They can publish from the builder once they add products.
  - **Categories and brands:** no data changes. The storefront builds categories (with cover images) from the global categories of a seller's active products (`getStorefrontCategories`), and product sections read the catalog. The per-seller lists from `0068` are empty for every seller; filling them is a dashboard-only tidy-up and was left to the sellers.
  - **No money effect:** every seller's fee trial had already started from their first store's `created_at` (`start_fee_trial_if_needed` is a no-op), and the trial dates were checked before and after.
  - **No live effect yet:** `main` (deployed) never reads `published_revision_id`, so customers see these sites only after `feat/seller-saas` is merged and deployed.
  - **Rollback:** for the 11 stores, delete their `store_site_revisions`, `store_pages`, `store_forms` and `store_design_systems` rows. Then set `published_revision_id`, `first_published_at`, `last_published_at`, `shared_header` and `shared_footer` to NULL and `site_status = 'draft'`.
- **Faster (`faster.tallaby.com`) moved to TechHub, with Faster's own content (owner request), 2026-10-20 ~08:40Z, production:**
  - The app's `applyStoreTemplate` (`techhub`, install `ca73122d-…`, previous template `tallaby-classic`, so Website › Templates › Undo works), then text and link edits to the drafts, then `publishStoreSite` (revision 2; revision 3 changed the audio rail). A rolled-back dry run came first. The store's forms were reused. Products were not changed.
  - Content is from faster-eg.com: brand red `#cf141b` as primary (accent `#ffd0d2`), the slogan "إكسسوارات تعكس أسلوبك", the phone and WhatsApp number `+20 120 734 1113`, the address (10 Al-Tarjuman St., Ataba, Cairo) and `info@faster-eg.com`. Search chips and the header menu point at the store's real kinds (earbuds, power banks, chargers, smartwatches). Brand tiles show the store's real brands (Anker, Oraimo, Joyroom, Majentik, HainoTeko, VMax, Senator, itel). The deal block features the store's own Anker R50i NC, without a discount badge or countdown. About stats use real counts. Payment badges match the methods used on orders (COD, InstaPay, Vodafone Cash, online). The FAQ warranty answer says warranty varies by product.
  - Left out on purpose: faster-eg.com's free shipping over EGP 1,250 and the `faster2026` code. Neither exists on Tallaby (no coupon, no free-shipping threshold). The template's 2-year warranty, 24-hour delivery and installment claims were removed too, because some products are sold without a warranty. The placeholder social links were removed. The footer's `/shipping` and `/returns` now point to `/faq` and `/terms`.
  - **Found:** a `productList` with `source: "category"` resolves a leaf category to its **root** store category (`apps/ecommerce/lib/store-site/catalog.server.ts`), so a headphones list showed every Electronics product. The audio rail now uses `selected` with the 8 newest headphone products. New headphones won't show there unless the seller edits the rail.
  - The cache was invalidated through the ecommerce `/api/revalidate` webhook (`store:site:…`, `seller:subdomain:faster`). Checked live by eye: home, about and brand search.
  - Rollback: Undo in Website › Templates, then Publish. A pre-change JSON backup of the store's site rows was in the session scratchpad (temporary).
  - **Logo (owner request, revision 4):** the header and footer text marks ("F" box + store name) are now an `image` node with Faster's transparent PNG (140px wide in the header, 130px in the footer, smaller on mobile). It is **linked from faster-eg.com** (owner's choice), not hosted on Tallaby, so it breaks if that WordPress file goes away. `stores.logo_url` (the brand logo in Website › Design) was left as the seller's uploaded screenshot, because pages showing it through `next/image` only allow Supabase, Unsplash and Pexels hosts. Proper fix: upload the PNG in Website › Design, then point both image nodes at the Supabase URL.
- **Still to do (next session):**
  - Owner: decide on the link-less video behaviour (above).
  - After the merge to production: open the four published stores on their live hosts and check them by eye. The seven draft-only stores publish from the builder once they add products.

### 2026-10-20 — Templates category labels translated; Brand section spacing reaches tree sections (owner request)

- **Website › Templates:** the category chips showed raw keys (`electronics`, `auto`…) because `websiteTemplates.categories` only had `general` and `fashion`. Added every category used by the seeded templates (`0070`–`0083`) to `ar.json` and `en.json`: electronics, mobile-accessories, beauty, home, kitchen, food, jewelry, kids, books, sports, auto. A new template category needs a key here too.
- **Brand › Section spacing did nothing on tree sections:** a tree section's root `section` node carries its own `paddingTop/Bottom` (registry default 64, mobile 40), emitted as plain px, so `--sf-section-y` was never read. `collectPageCss` now writes a section root's vertical padding as `calc(var(--sf-section-y,64px) * N/64)`. With no spacing set the output is the same pixels as before (no visual change for existing sites). With spacing set, every section scales in proportion, and 0 stays 0. Inner elements keep plain px. Side effect: a seller who types a section padding in the inspector sees it scaled while a Brand spacing is set.
  - Presets: "Airy" is now 96 (was 72, barely different from the 64 tree default); the editor placeholder shows 64.
- **Brand › Container width:** the code path is correct. Containers use `max-w-(--sf-max-width,1200px)`, no template container overrides `maxWidth`, and the class is in the dashboard and storefront CSS. The editor's desktop canvas is only as wide as the pane (`DEVICE_WIDTH.desktop = "100%"`), so on most screens it is narrower than 1200–1440px and Standard/Wide look the same there. On the storefront they differ. No code change; a scaled real-width desktop preview would be a separate task.
- Checks: store-sections 2022/2022 and dashboard 229/229 tests pass, both `tsc` clean. `pnpm --filter dashboard lint` crashes inside ESLint at load (`Class extends value undefined`, @typescript-eslint), separate from this change. Not checked in the browser: the dashboard needs a login.

### 2026-10-20 — No header padding-y on mobile; every template re-seeded (`0084`, owner request)

- **Cause:** the `section` element's registry default is 64px top and bottom, and 40px on mobile (`elements/registry.ts`). Every header design set its desktop padding (0, or 16 for Pill and 14 for Ruled) but never its mobile padding, so `withDefaults` (`designs/builder.ts`) kept the 40px. That put a 40px band above and below every header on phones.
- **Fix:** each header's root section now sets `mobile` to its own desktop padding-y: 0 for the flush headers, 16 for Pill and 14 for Ruled. This covers the 10 library headers (`designs/headers/`), plus `classic/chrome.ts` and `atelier/chrome.ts`. A new test in `designs.test.tsx` checks that every header keeps its padding-y on mobile.
- **Templates:** seeds are insert-only, so every template's version was bumped: Classic v4, Atelier and the 37 library templates v2. They are all in one generated migration, `0084_mobile_header_padding.sql`. The seed tests now check `0084` (with `toContain`, because one file holds all the batches). `0070`, `0071` and `0074`–`0083` are left as applied history. For a non-default template above v1, the generator's rollback comment now says to restore the previous version, not `DELETE FROM templates`.
- **Applied:** staging, then a rolled-back production dry run, then production at 2026-10-20T09:23:55Z (owner-approved). The current-version config hash `d090cf4d…` matches across staging, the dry run and production. Classic is still the default.
- **Not changed:** sites already stored for stores (the 11 production stores' Classic v3 drafts and published revisions) keep their headers. The fix reaches them only when a seller re-applies a template or re-adds a header. Changing them would be a separate data migration on seller content.
- Checks: store-sections 2014/2014 tests, `tsc` clean; `@workspace/lib` 447 passed and 183 skipped when run alone (out of memory under the parallel `pnpm test`). Existing failures not caused by this change: the `ecommerce` typecheck (`profile.chunks.tsx`, react-hook-form resolver types) and the `@workspace/ui` lint (`eslint` not installed). Not checked in the browser.

### 2026-10-20 — Storefront checkout follows the store's payment methods (P3-07, owner request)

- **Owner decisions (in chat):** (1) *filter only*: a storefront checkout shows only the methods the store enabled in Store settings › Payment methods, but the money flow is unchanged, so enabled wallets and InstaPay still pay to Tallaby's numbers (`apps/ecommerce/lib/manual-payment-methods.ts`). Paying to the seller's own details is still Part B. (2) Card and the customer wallet are hidden on storefronts, because they are "soon" in store settings. This also settles D30: stores with no saved payments settings get the default, which is COD only.
- **Rule:** `storefrontCheckoutMethods` / `isStorefrontCheckoutMethodAllowed` in `packages/lib/src/payments/store-methods.ts`. COD → `cash_on_delivery` (with its `maxOrder` and `note`); InstaPay, Vodafone Cash and e& Cash → the same manual methods. **WE Pay and Orange Cash map to nothing**, because Tallaby has no account for them. A store with only those enabled shows "no payment method available".
- **Server:** `getStorefrontCheckoutPayments()` (`apps/ecommerce/lib/storefront.server.ts`) resolves the store from the request host and reads `stores.settings` fresh, not from the cached storefront profile. `createOrder` passes the result to `placeOrderFromCart` (new optional `storefrontPayments`), which refuses any other method, and refuses COD above `maxOrder` judged on the order total. Marketplace and admin flows don't pass it, so they are unchanged.
- **UI:** `checkout.data.tsx` hides groups and manual children the store hasn't enabled, defaults to the first allowed method, shows the COD note, and labels COD above the store limit (`codUnavailableAboveMax`, plus `noPaymentMethodsAvailable`, in `ar.json` and `en.json`).
- **Not done:** the COD fee (`cod.fee`) is still not charged, because adding it changes order totals and money.
- Checks: `store-methods.test.ts` 14/14 (3 new); `@workspace/lib` 450 passed, 183 skipped. The `ecommerce` typecheck has errors only in the existing `profile.chunks.tsx`. The `ecommerce` lint crashes inside ESLint 10 (`scopeManager.addGlobals is not a function`) for the whole app, so it isn't caused by this change. Not checked in the browser.


### 2026-10-20 — tallaby.com home page matched to Claude Design "Home v3"

- **What:** the home page now follows `Marketing Website/Home v3.html` (+ `features-v3.css/js`, `home-v3.js`). Hero, how it works, templates, builder studio and final CTA were already built from this design; the differences were in the features, builder, pricing and FAQ sections.
- **Features ("Inside the dashboard"):** `components/marketing/home/feature-tour.client.tsx` + `feature-tour.module.css` replace `dashboard-tour.client.tsx` (deleted). Six tabs (dashboard, add product, delivery follow-up, wallet, apps & integrations, website & social) auto-advance every 8s with a progress bar, pause on hover or when out of view, and each mock panel acts out its task (count-ups, typing, courier assignment, wallet ledger rows with the app-bar balance in sync, integrations connecting, social links + publish). Arrow keys move between tabs. Reduced motion shows each panel's end state and stops the autoplay. Below it, an "Also in your dashboard" grid of 8 areas (server-rendered in `home-sections.tsx`).
- **Builder:** five feature rows (sections library, visual editing, AR/EN, devices, AI assistant "coming soon") instead of four. **Pricing:** 8th item "First 7 days with no fees". **FAQ (`faq.home`):** three new answers (how the fee is collected, own couriers, Meta Pixel / GA). Checked against code: rider delivery tracking, and the Meta Pixel, CAPI, GA4, GTM, TikTok and Google Sheets integrations, all exist in the dashboard.
- **Where the code differs from the design:** Arabic copy keeps "EGP", not "ج.م" (owner rule). The chart draws the revenue area under the order bars (in the design the area hid them). The demo WhatsApp number is a placeholder (`01012345678`). Hero and steps copy kept "من غير كود" where the design says "من غير برمجة".
- **Messages:** `home.features` was rewritten and `home.builder.f1–f5`, `home.pricing.i8` and `faq.home` were updated, in both `ar.json` and `en.json` (edited in place, other formatting untouched).
- **Checks:** the `ecommerce` typecheck has errors only in the existing `profile.chunks.tsx`. The `ecommerce` lint crashes inside ESLint 10 for every file (`scopeManager.addGlobals is not a function`). Marketing vitest 26/26. Manual check in Chrome (RTL, desktop): all panels play through, autoplay advances, and the wallet balance syncs. Not checked at phone width. Pre-existing dev warning: missing `key` in `TemplateGallery`'s heading prop.


### 2026-10-20 — Admin website builder (Phase 9C, AB-01…15, owner request)

- **What:** the seller editor moved to `packages/store-editor` behind an `EditorAdapter`. Admins edit any store's website (`apps/admin/app/(builder)/stores/[storeId]/editor`), the library sections (`/sections`, `/sections/[id]/editor`) and the templates (`/templates/[id]/editor`), all audited. New stores take the database default template. Spec and plan: `docs/superpowers/specs/2026-10-20-admin-website-builder-design.md`, `docs/superpowers/plans/2026-10-20-admin-website-builder.md`. Commits `245d4a9..8b94f62` on `feat/seller-saas`.
- **Migrations (all applied to staging `cxqjrwjianxskhzmrkla`, then production `sakwqwocbccpyrmwjowq`, 2026-10-20, each production run after a rolled-back dry run, owner pre-approved):**
  - `0085` (chrome version check, `site_edited_by_admin_at`): two columns verified on both; re-run idempotent on staging.
  - `0086` (`library_sections` + `library-media` bucket): 190 rows = `DESIGNS.length` and the bucket present on both; re-run idempotent on staging.
  - `0087` (template drafts and meta): meta filled 39/39 templates on both; re-run idempotent on staging.
- **Template seeds are insert-only (controller check on staging, rolled-back transaction):** the seed does nothing for an existing template key; a new key inserts the template, its version and `current_version_id`; there is a single default. So a deploy never overwrites an admin edit.
- **Tests (Step 1, 2026-10-20):** `pnpm test` exit 0, all green: store-sections 2237, store-editor 127, lib 469 passed (208 skipped), db 7 passed (52 skipped), ecommerce 153 passed (2 skipped), admin 82, dashboard 142, cache 40, emails 3. Integration tests skip because `TEST_DATABASE_URL` is not set (R12). `pnpm typecheck`: 11 of 12 packages clean; the only failure is the existing `apps/ecommerce` `profile.chunks.tsx` (R8), no other errors. `pnpm lint` is broken by the toolchain (R6: dashboard ESLint crashes in `@typescript-eslint/utils`; tiptap and ui have no ESLint), so it was not run.
- **Still pending (needs a login):** browser E2E is pending for all admin and editor flows (store editor, seller "admin updated" notice, library-section editor, template editor), per R9, and the production smoke check (an admin opens one real store's editor without publishing; Sections and Templates pages load).
- **Where the code differed from the plan (rulings):**
  - R1: the T1 adapter has `saveChrome(part, instance, clientVersion)`; the seller adapter ignored clientVersion until T4.
  - R2: `draftVersions` is optional on `EditorAdapter`; hosts without it (templates, sections) need no watch.
  - R3: `instantiateTemplate` takes `keepSlots?` (default false); the section editor keeps photo slots in the saved tree.
  - R4: `useDraftWatch` takes its baseline from the first `draftVersions()` fetch, not from `EditorInitial`.
  - R5: adapter return types match the dashboard action return types exactly.
  - R6: `pnpm lint` is broken by the toolchain; typecheck and tests are the gate.
  - R7: C: was full, so shells use `TEMP`/`TMP` = `F:/tmp-claude`.
  - R8: the `apps/ecommerce` `profile.chunks.tsx` typecheck failure is existing and out of scope.
  - R9: the browser E2E could not be run by the implementers, so it stays pending for an owner login.
  - R10: new required `EditorAdapter.media.uploadFile(path, file)`.
  - R11: runtime imports of pure client-safe `@workspace/lib` subpaths (`media.lib`, `store-forms.lib`) are allowed in the package.
  - R12: integration tests are written but skip without `TEST_DATABASE_URL`, and never run against staging or production.
  - R13: implementers write migrations, the controller applies them (staging, rolled-back production dry run, production).
  - R14: the DB preset source uses the row key (= design id), `${key}@${version}`.
  - R15: new or duplicated library sections start at version 0, and sellers see only version above 0.
  - R16: the HTML sanitizer now keeps `ch` units, so an admin save does not change seeded sections.
  - R17: because of R16 the applied seeds `0071` and `0084` are frozen (sha256 pins in tests); no re-seed, so live templates keep their `ch`-less styles until an admin edits them.
  - R18: publishing a template does not change `is_active`; activation stays the Templates-page toggle, and cache invalidation is left to the admin actions.
  - R19: this `PLAN.md` carries the owner's uncommitted edits, so it was edited in place and not committed.
- **Also noted:** the owner's staged deletion of `dashboard-tour.client.tsx` went into commit `3b76247` (replaced by their untracked `feature-tour.client.tsx`). `CLAUDE.md` rule 6 still says `0049`–`0073` are the applied range; it should now read `0085`–`0087` as applied and `0088` as next (not changed here).

### 2026-10-21 — Section library: the nine new Claude Design categories, 68 tree designs (owner request)

- **Owner brief:** add the remaining categories and sections of the Claude Design "Section Library" (`Website Builder Sections/Section Library.html`, 29 categories) to the builder.
- **Categories (`library/types.ts`, `library/categories.ts`):** 29 now, in the design's order. New: `bundles`, `finder`, `payment`, `popups`, `loyalty`, `services`, `about`, `tracking`, `cart`, each with subcategories and an editor icon (`editor-icons.lib.ts`). The design's `collection` category is our `page-header` (`sf-classic.js` renames it; the 10 designs already match), so no new category. The design's `product` category is our `product-page`.
- **Built (`designs/<folder>/`, all `defineDesign` trees, design order, first = default):** bundles 11 (`bundle-*`, O-a…k), finder 11 (`finder-*`, E-a…k), payment 10 (`pay-*`, U-a…k without U-h), popups 3 (`popup-welcome`, `popup-app`, `popup-sale-end`), loyalty 2 (`rewards-gift`, `rewards-birthday`; named "Gifts & occasions"), services 11 (`service-*`, W-a…k), about 10 (`team-*`, Y-a…j; `about-*` ids already belong to image-text), tracking 6 (`track-*`), cart 3 (`cart-extras`, `cart-free-delivery`, `cart-coupon`), product page +1 (`product-shipping`). Icon `wrench` added.
- **Store data:** products come only from `productList`/`addToCart`, posts from `postList`, forms from `storeForm`. Bundle prices and savings, zones, methods, plans and steps are seller-typed text. Interactive parts are still layouts (tabs as linked chips, quiz answers and finder buttons as links, switch panes side by side, no countdown).
- **Skipped (would need data or systems we don't have, or would mislead):** U-h installment table (computed per price); popups PU-b exit intent, PU-c cookie bar, PU-e recent purchase toast, PU-f floating WhatsApp, PU-g back in stock, PU-i region switcher, PU-j scratch card; tracking D-c/d/e/h/i (one live order); loyalty A-a/b/d/e/f/h/i/j/k (no points, tiers, referrals or gift-card balances); cart J-a/b/d/f/g/h/i (cart contents, checkout and order pages aren't builder pages); product page a, c–h, j (need a current-product data node). Follow-up: a product-page data node, cart/order data nodes and a loyalty system would unlock most of these.
- **Migration:** `0088_library_sections_new_categories.sql` (generated by `section:sql --new-only`, insert-only, 68 rows). **Not applied yet.** Until it is, the Add panel (which reads `library_sections`) does not list the new designs.
- **Checks:** store-sections `tsc` clean, 2836 tests pass (68 new snapshots); store-editor 127, lib 473 (DB tests skipped), dashboard 142 pass; `tsc` clean for store-editor, lib, dashboard and admin. Visual check of all 68 at 1280 and 390 (AR, 8 also EN) from a headless-Chrome static render with Tailwind's browser build; 22 designs had layout fixes (stretched rows, squeezed discs, mobile padding). Not checked in the editor. Owner to check: insert a few from each new category in the editor after `0088` is applied.

### 2026-10-21 — Section library: the rest of the Claude Design sections, 0088 + 0089 live (owner request)

- **Owner brief:** make sure every section of the Claude Design "Section Library" is in the website builder. The design has 296 sections in 29 categories; 257 were built. Owner chose to build only the missing ones that work with the existing nodes, and to leave the data-bound ones as a follow-up.
- **Applied `0088`** (the 68 designs of the entry above) to staging, then a rolled-back dry run and the real apply on production (pre-approved for this feature). Both now list them in the Add panel.
- **Built (8 `defineDesign` trees, in design order):** `gallery-shoppable` (G-d: photo with movable hotspot markers beside featured products), `newsletter-channels` (N-d: WhatsApp and email cards over the form), `pay-installment-table` (U-h: providers × terms with typed rates, not per-product monthly amounts), `popup-exit` (PU-b "Before you go": brand band back to `/cart`, no exit trigger or cart thumbnails), `popup-whatsapp` (PU-f: bubble and round button inline at the end side), `popup-restock` (PU-g: notify card with the store form, names no product), `popup-reward` (PU-j as a revealed reward card with a typed code), `cart-empty` (J-b: bag circle, shop button, categories as chips, `optional`). New subcategories: popups `reminders`, `chat`; cart `empty`. J-j was already `cart-coupon`.
- **Migration `0089_library_sections_more.sql`** (`section:sql --new-only`, 8 inserts, `sort_order` set by hand between the live rows). Applied to staging and production. `popup-exit` (light button) and `popup-restock` (full-width form) were fixed after that first apply, so the file also has two guarded `UPDATE`s (`version = 1`, no draft, no `updated_by`); re-run on both, 2 rows refreshed each.
- **Still not built (31), because they would mislead without data or systems:** PU-c cookie bar (no consent store), PU-e recent-purchase toast (no order feed), PU-i region and language (a builder link cannot switch the storefront back to Arabic: the next-intl `Link` keeps the current locale); tracking D-c/d/e/h/i; loyalty A-a/b/c/d/e/f/h/i/j/k (no points, tiers, referrals or gift cards); cart J-a/d/f/g/h/i; product page Pd-a…h, j. Follow-up: a current-product data node with the product page as a builder page, cart and order data nodes, a locale-switch link, and a business decision on loyalty and gift cards.
- **Checks:** store-sections `tsc` clean, 2908 tests pass (8 new snapshots); store-editor 127 pass; `tsc` clean for admin. Dashboard `tsc` fails only in `components/dashboard/sidebar.config.test.ts`, against the uncommitted sidebar changes already in the tree (not touched here). Visual check of the 8 at 1280 and 390 (AR and EN) from a headless-Chrome static render with Tailwind's browser build; fixed the reminder button's invisible label and the restock form width. Not checked in the editor.

### 2026-10-21 — Seller dashboard: website offline switch, signup redesign, mobile pass (owner request)
- **Website offline (behaviour change, owner):** Unpublish used to fall back to the Tallaby Classic page. Now `site_status = 'unpublished'` means offline: every `storefront/[subdomain]` route (layout + each page), `/cart/checkout` on the store host, robots and sitemap show the store-offline page or drop the store (`_components/store-offline.tsx`, `lib/store-site/offline.server.ts`, noindex). `createOrder` refuses carts of an offline store (`isCartStoreOffline`; `place-order.ts` untouched). A verified builder preview still sees the draft. Never-published stores keep the Classic fallback, and marketplace listings are unaffected. `getStorefrontBySubdomain` returns `siteStatus` (cache key `storefront-v9`). No migration. Store form submissions on an offline host are not guarded server-side (unreachable from the UI).
- **Website tab:** the Publish/Unpublish buttons became a "Website live" switch (off asks for confirmation). "Publish changes" and "Discard" stay when the live site has unpublished changes. Copy updated in dashboard ar/en and the admin force-unpublish dialog.
- **Signup:** `/signup` (including the signed-in store-only step) uses `AuthShell` like `/login`, with shared `app/login/auth-ui.tsx`. Phone inputs (`AuthField type="tel"`, `TextInput type="tel"` in `packages/ui`) are `dir="ltr"` with the icon on the physical left, which fixes the RTL overlap.
- **Home:** the sales channel and 7/30/90-day period are two dropdowns sharing one row on phones. The plan button is removed from the trial banner.
- **Settings:** the store logo is the first field in Identity, with a link to Design system under it.
- **Mobile:**
  - `TabsList` is `w-full sm:w-fit` and `SegmentedControl` fills the row on phones, as do the hand-built tab rows.
  - `DialogContent` is capped at the viewport height and scrolls.
  - `TableSection` supports `meta.hideOnMobile`; orders, products, wallet and financial tables hide secondary columns on phones.
  - The header puts install, language and theme behind a ⋯ menu below sm. The sidebar drawer locks page scroll.
  - Product edit and bulk import save bars wrap and clear the sidebar on lg. The WhatsApp button moves or hides where fixed bars are.
- **Builder on phones (`packages/store-editor`):** below lg, panels open as bottom sheets and the inspector is a bottom sheet with an Edit button. Below md, the rail is a bottom tab bar. The topbar puts extra actions under "More" below sm, the element popover clamps to the canvas, and tapping to insert closes the sheet. Desktop is unchanged.
- **Checks:**
  - Tests all pass (dashboard 144, ecommerce 157, store-editor 127, admin 94, lib 473, store-sections 2836).
  - Typecheck is clean except for errors that predate this work in unmodified files: `apps/dashboard/components/dashboard/sidebar.config.test.ts` (2) and `apps/ecommerce/.../profile/_components/profile.chunks.tsx` (16).
  - `pnpm lint` crashes in ESLint itself (`Class extends value undefined` in `@typescript-eslint/utils` under ESLint 10.9.1), so lint was not run.
  - **No manual browser check yet.** Owner to check at 390px: website switch off/on (subdomain and a product URL), signup phone field in ar, home dropdowns, builder add/select/edit/publish, settings logo, header ⋯ menu.

### 2026-10-21 — Publish step on the home checklist; seller-only fulfillment (owner request)

- **Home "Get your store ready" checklist:** new step "Publish your store" (`setup-checklist.lib.ts` key `publish`, done when the selected store's `site_status = 'published'`), after legal details. Its "Publish now" button unlocks once the store profile, first product and legal details are done (`publishReady`) and calls `publishStoreFromHome` (`app/(main)/_components/setup-publish.server.ts`): `requireStore(forPublish)`, ensures the draft scaffold, then the builder's `publish`. On success a dialog shows the live address (`storeHostname`) with Copy and Visit, over a full-screen canvas confetti burst (skipped for reduced motion). The home page refreshes when the dialog closes.
- **Add product:** "Import from link" in the basic section is now a solid primary button with its label on every screen size.
- **Seller-only fulfillment:** new `TALLABY_SERVICES_ENABLED = false` (`packages/lib/src/fulfillment/constants.ts`). Settings › Fulfillment: no Tallaby plan is offered, every service shows "Tallaby · Soon" and starts as the seller's, copy reads as the seller's own setup, and `requestFulfillmentServices` refuses any `provider: 'tallaby'` (`tallaby_service_unavailable`). Product form: "Fulfilled by Tallaby" is disabled with a "Soon" tag; editing a `platform_fulfilled` product saves it as `seller_fulfilled`, and text imports map "platform" to seller. Store › Shipping: "Tallaby delivery" shows "Soon"; a store already on it keeps it (checkout unchanged), but no store can switch to it (`updateStoreShippingSettings` → `tallaby_unavailable`). Not changed (owner chose "keep existing"): stores' default shipping method (`tallaby` when unset), existing `platform_fulfilled` products until edited, the CSV bulk import path in `actions/products.ts`, the ecommerce onboarding wizard, and admin-activated Tallaby services.
- **Checks:** dashboard typecheck clean, dashboard tests 146 pass, lib tests 473 pass, lib and admin typecheck clean; ecommerce typecheck only has the older `profile.chunks.tsx` errors. Lint not run (ESLint crash above). **No manual browser check yet:** publish from home (confetti, dialog, link), fulfillment settings, product shipping card, store shipping method.

### 2026-10-21 — Botanica template renamed to Sage (owner request)

- The Beauty library template "Botanica / بوتانيكا" is now shown as **"Sage / سيج"** (`templates/botanica/index.ts` `name`). Only the display name changed: the key stays `botanica`, so `stores.template_key`, installs and the `/templates/botanica` URL are untouched (owner chose name only).
- `0091_rename_botanica_sage.sql`: a guarded `UPDATE templates SET name` (only while the name is still the seeded one), applied on **staging and production** 2026-10-21 (`UPDATE 1` on each). `0090` (another session's untracked file) was skipped and not applied by this change.
- **Checks:** store-sections tests 3378 pass. The marketing gallery cache (`marketing` template queries, 15 min TTL) shows the new name after it expires or the next template revalidation.

### 2026-10-21 — Storefront templates 49–100 from Claude Design, `0090` + `0092` live (owner request)

- **Owner brief:** sync the Claude Design "Storefront Templates" registry (`Templates.html` / `registry.js`) with Supabase and build every template not there yet, from the pre-built library sections so everything stays editable, with no photos of people or body parts. Production had Classic + 01–38; the registry now lists 90 (01–38 and 49–100). The folders 39–48 in the design project (Fixit … Ghorza) are not in the registry, so they were not built.
- **Built (52, `fromLibrary` like Moto, v1, `sortOrder` = registry number × 10, home/about/contact/faq pages, demo catalog):** Fashion 49–54 Kettan, Zay, Sitara, Shanta, Tasfya, Layali · Electronics 55–59 Kabl, Sada, Zaki, Saa, Tany · Beauty 60–64 Nada, Kohl, Oud, Sabon, Barber · Home & Kitchen 65–69 Matbakh, Fokhar, Tawla, Tanzim, Qahwa · Food 70–75 Khodar, Lahma, Halawa, Atara, Dokan, Bunn · Furniture 76–80 Mobilia, Zarea, Nour, Mafrash, Rokn · Jewelry 81–85 Zahra, Nuqra, Lulu, Saat, Mahr · Kids 86–90 Lego (generic "Tarkib Toys", no LEGO marks), Mama, Madrasa, Hikaya, Ahlam · Sports 91–95 Yoga, Koora, Darraga, Sabaha, Boxing · Auto 96–100 Tyre, Zeina, Kahraba, Safar, Garagy. Registered in `catalog.ts` (`LIBRARY_TEMPLATES`) in registry order.
- **Section mapping:** every registry section is the library design of the same name (e.g. Split screen = `hero-halves`, Installment calculator = `pay-installments`, Track form = `track-ask`). **Rewards gap:** the library has no points, tier, gift-card or referral designs (see the 0089 entry), so How points work → `text-steps`, Tier ladder → `promo-tiers`, Gift card → `promo-coupon`, Refer a friend → `popup-reward`, all copy only (Nada, Kohl, Oud, Sitara, Mama, Hikaya, Mafrash, Rokn, Zahra, Zeina, Bunn, Garagy). **Price drop band** (`bundle-price-drop`) fails the render check (its products have no links), so Lahma and Madrasa use Plus row instead; the library design needs a fix. Head to head's second side shows the newest product (Sada, Saat): with the default offset it vanishes in a one-product store.
- **Other deviations:** `#anchor` buttons go to `/contact` or a search (anchors are not allowed links); "On sale" tabs use top rated (no sale sort); bundle and kit totals are typed text; a reused design on two pages uses `as` (`faq-home`); team grids and founder notes use initials; Yoga's booking section uses the contact form (the others keep `booking`, which "Use template" creates from `FORM_TEMPLATES`). Fonts: the design's Latin display fonts are not store fonts, so each template uses its Arabic pair (or the closest `STORE_FONTS` name). New gallery categories `shoes-bags` (Shanta), `handmade` (Fokhar) and `sweets` (Halawa, Bunn) were added to `websiteTemplates.categories` in store-editor `ar.json`/`en.json`.
- **Photos:** 612 Pexels photos. Almost every design photo with a model, hands or a logo was replaced; each was checked by eye by the batch builders, then all 612 on contact sheets. That pass found two more: Koora's jersey (a printed player name) and Sabaha's beach towel (cartoon swimmers in its print). Both were swapped for photos already used elsewhere (18199559 folded blank shirts, 30982093 striped towel).
- **Migrations:** `0090_library_templates_49_100.sql` (`template:sql` for the 52 keys + `templatesMetaSql` for their meta; insert-only, never the default). Staging, re-run (no change), production dry run (91 templates, 1 default, rolled back), production at 2026-10-20T23:35:31Z; prod and staging hashes match. Frozen in `frozen-seeds.test-utils.ts` and listed in the seed test's `SEEDS`. `0092_template_photo_fixes.sql` (written as `0091`, renumbered because a parallel session's `0091_rename_botanica_sage.sql` came first; applied by psql, so only the file name changed): guarded `meta` rewrite for Koora and Sabaha (the two photos were only in the demo catalog); staging, re-run (no change), production dry run, production at 2026-10-20T23:45:43Z. After both, all 52 templates' config, meta, version, category and sort order equal the code on staging and production (jsonb compare). Rollback: `DELETE FROM templates WHERE key IN (…)` (cascades to versions and installs).
- **Checks:** store-sections `tsc` clean, 3376 tests pass (the 52 × 9 template checks included); store-editor `tsc` clean, 127 tests pass. **No browser visual check** of the 52 rendered templates; the owner should look through the gallery previews. Lint not run (ESLint crash noted in the entry above).

### 2026-10-21 — Seller products go live without admin review (owner request; plan `docs/superpowers/plans/2026-10-19-dashboard-security-fixes.md` Task 7)
- **Where the code differed:** the owner decided this on 2026-10-19, but Task 7 had never been built. `createProduct` still wrote `pending` (or whatever `status` the client sent), `updateProduct` sent every edit back to `pending`, and `toggleProductStatus` published drafts to `pending`.
- **Change:** new `apps/dashboard/lib/products/product-status.lib.ts` (`nextProductStatus`, `hasProductImage`) with table tests. Create: a product with an image from an `approved` seller is `active`, otherwise `draft`, and the category count is bumped when it is active. Edit: a live product stays live (or drops to draft if all images are removed), a draft stays draft, and `rejected` (admin takedown) sticks. `setProductPublished` now also publishes legacy `pending` rows, refuses `rejected` rows, and refuses restricted sellers. `toggleProductStatus` (unused) delegates to it. Publish toggle enabled for everything except `rejected`; the create toast says "saved as a draft" for imageless products; copy is `pending` → "Not published" / "غير منشور" and `rejected` → "Removed by Tallaby" / "أزالته طلبي". Bulk import goes through `createProduct`, so its `isActive` column is now ignored.
- **Not done:** existing `pending` rows in the DB are not auto-published (no migration; the plan's data migration needs owner approval for production). Sellers can publish them with the toggle. Task 8 (bulk-import admin-only columns) is still open.
- **Checks:** dashboard `tsc` clean, 22 files / 155 tests pass. Lint not run (the same ESLint crash). No manual browser check yet.

### 2026-10-21 — Dashboard batch: product form, legal docs, offline note, coupons, checklist, top-up dialog, shipping (owner request)
- **Product form:** the edit page now reuses the add page's form (`add-product.tsx` `edit` prop; the old 3-step wizard is gone, `steps/*` kept for bulk import). Stock uses the − / + `NumberStepper` with a typeable number (Arabic digits accepted), for product and variant stock. The save button is never disabled for validation; clicking it shows the errors and scrolls to the first one.
- **Legal documents:** business license and tax certificate are optional at `/settings` (they were only required there, in the UI; no schema change).
- **Offline note:** `components/stores/store-site-status-note.tsx` next to every store link (page header, switcher, store cards, website overview, settings, apps). `unpublished` = offline; `draft` = "not published yet, visitors see a basic default storefront".
- **Coupons:** the marketplace ("سوق طلبي") scope is removed; `actions/coupons.ts` accepts store-only coupons. Old marketplace coupons become store-only when saved.
- **Setup checklist:** 4 steps: product, choose template (`template_installs` not undone, or the site was ever published), shipping (`settings.shipping` or a zone), publish. Publish is gated on the product step only (it was profile + product + legal).
- **Top-up dialog:** capped at the viewport with only the body scrolling, so the footer buttons always stay visible.
- **Shipping:** Tallaby delivery is hidden (commented out in `stores/[storeId]/shipping/shipping.client.tsx`, behind `TALLABY_SERVICES_ENABLED`). `defaultStoreShipping`/`parseStoreShipping` read every store as seller delivery while the flag is off, and the server refuses `tallaby`. Default seller rates come from `CAIRO_ORIGIN_RATES` (first kg = what checkout bills; EGP 8 per extra kg; 6 zones by price), with a "Use these rates" seed. No migration. **Checkout still charges Tallaby's governorate rates for every store** (P3-08 Part B, zone pricing at checkout, is unbuilt), so seller-set zone prices are saved but not charged yet. `apps/shipping` still lists all orders (P8-02).
- **Checks:** dashboard and lib `tsc` clean; dashboard 22 files / 156 tests and lib 475 tests pass (DB integration tests skipped, including the rewritten `shipping.integration.test.ts`). Lint not run (the ESLint crash). No browser checks yet.

### 2026-10-21 — Design preview, templates gallery, empty-box hint (owner request)
- **Design page preview was blank:** `website/design/design.client.tsx` built its preview from the old coded section ids (`hero-banner`, `product-grid`, `features`, `cta-banner`, `store-header`, `store-footer`), which no longer exist since sections became element trees (rule 17), so nothing rendered. It now draws the store's own draft home page, shared header and footer (passed from `design/page.tsx`).
- **Templates gallery** (`website/templates/templates.client.tsx`): 1 / 2 / 3 / 4 columns (sm / lg / xl), compact cards (2-line description, two full-width buttons), and a category bar that scrolls sideways on phones.
- **"اسحب عناصر إلى هنا" removed:** an empty container in edit mode (editor and template previews) now keeps only an invisible `min-h-6` drop area (`store-sections/src/elements/render.tsx`); the `emptyContainer` copy is gone. The empty-accordion hint stays.
- **Checks:** dashboard and store-sections `tsc` clean; tests pass: dashboard 156, store-sections 3378, store-editor 127. No browser check.

### 2026-10-21 — Template thumbnails for all 91 templates, live on production (owner request)
- **Images:** one 7:6 card per template, 350×300 and `@2x` 700×600 PNG. The background is the template's `designSystem.colors.primary`, with a glow from its accent color. On it, a desktop window (top of the live `/template-preview/<key>` at 1440×1229) and a phone (390×844), both captured from tallaby.com. The files are in `apps/ecommerce/public/templates-thumbnail/` (`<key>.png`, `<key>@2x.png`). The generator script was a one-off (Playwright) and is not in the repo.
- **Production (owner: "push to production directly", staging skipped):** the 91 `@2x` files were uploaded to the public `library-media` bucket as `templates/<key>.png`, and all 91 public URLs were checked (200, `image/png`). `templates.thumbnail_url` was set to `…/storage/v1/object/public/library-media/templates/<key>.png?v=20261021` by a guarded `UPDATE` that only fills NULL or this script's own URLs (`UPDATE 91`; 91/91 active templates now have one). Production had 0 thumbnails before. Staging got the same SQL afterwards, pointing at the same public production files (`UPDATE 91`, 91/91); no staging upload was needed. Rollback (each project): `UPDATE templates SET thumbnail_url = NULL WHERE thumbnail_url LIKE '%/library-media/templates/%'`.
- **UI** (already read `thumbnail_url`; only the frames changed to 7:6): the tallaby.com card (`components/marketing/templates/template-card.tsx`) drops its own browser bar when it has an image, because the image already has one. The dashboard gallery (`TemplateThumbnail`), the editor's Templates panel (`store-editor/src/panels/add/templates-panel.client.tsx`) and the Admin list thumbnail now use 7:6. The /templates hero fan (`template-fan.client.tsx`) shows the Atelier, Glow and Kasr thumbnails, falling back to the drawn mini stores when fewer than three templates have one. Two places stay live on purpose: the editor's Page templates list (it shows a specific page in the store's own look) and the home hero fan (it previews the visitor's own store link). **Until ecommerce is deployed,** live tallaby.com shows the new images in the old 4:3 frame (cropped at the bottom).
- **Checks:** `tsc` clean for dashboard, admin and store-editor. Ecommerce `tsc` has 16 errors, all in `profile.chunks.tsx`, which was not changed here. Ecommerce `templates.lib.test.ts` 7/7 pass. ESLint and turbo could not run locally (the ESLint crash; pnpm 10.4.1 missing). No browser check.
- **Secret:** the owner added `PROD_SUPABASE_SERVICE_ROLE_KEY` (an `sb_secret_` key) to `apps/ecommerce/.env` for the upload. It is server-only and not used by app code. Remove or rotate it once it is no longer needed.

### 2026-10-21 — next/image for template thumbnails, seller storefronts and app images (owner request)
- **Storefronts (seller sites and tallaby.com template previews):** `RenderContext.optimizeImage` (optional, `store-sections/src/core/types.ts`, with `imageSource()` and `IMAGE_SIZES`). The shared renderer keeps a plain `<img>` (no next imports), and the host fills in `src`/`srcSet`/`sizes`. Covered: product cards (`SectionImage`), the image element, section background images, and video stills. Ecommerce passes `optimizeStoreImage` (`lib/store-site/optimize-image.lib.ts`, built on next/image `getImageProps`) in `store-site.tsx` and the template-preview page. The store blog and CMS images (`store-content.tsx`) use it too. Only our Supabase Storage and Pexels/Unsplash are optimized; any other host (imported product images), SVG and GIF are served as is. The editor canvas and previews do not pass the hook, so they are unchanged. `/_next/image` is outside the `proxy.ts` matcher, so it works on store hosts and custom domains.
- **App images → next/image:** template thumbnails (the tallaby.com card, the /templates hero fan, the dashboard gallery, the editor's Templates panel, the Admin list). Dashboard: coupon picker, URL import, product preview, variant thumbnails, category/brand packs, catalog, blog list and cover, image upload tiles, through `components/media/remote-image.tsx` (`isOptimizableImage` now skips SVG/GIF). Store-editor: media library, Explore panel, inspector previews, through `src/media/editor-image.tsx`. Admin: blog list and cover, templates list, through a new `lib/image-hosts.ts`, which `next.config.ts` now uses for `remotePatterns`, plus `components/media/remote-image.tsx`.
- **Kept as plain `<img>` on purpose:**
  - private top-up receipts (expiring signed links; the optimizer would keep cached copies) in the admin top-ups list and the dashboard top-up dialog;
  - the dashboard Design favicon preview (ICO/SVG);
  - the editor's drag ghost (it reuses an already-loaded thumbnail);
  - the admin Arabic invoice logo (exported with `html-to-image`);
  - `packages/ui` ProductCard's default renderer (callers pass their own).
- **Checked locally** (ecommerce dev on port 3015 against staging): `/template-preview/kasr` has 29/29 images with `srcSet`, and a 640w request returns WebP 12 KB. `/templates` sends all 91 thumbnails through `/_next/image`, and Kasr at 640w is WebP 18 KB, down from the 302 KB PNG.
- **Checks:** `tsc` clean for store-sections, store-editor, dashboard, admin and ecommerce (apart from ecommerce's 16 errors in `profile.chunks.tsx`, which were already there). Tests: store-sections 3378 + 4 new (`core/image-source.test.tsx`), store-editor 127, dashboard 156, ecommerce `optimize-image.lib.test.ts` 4 new. ESLint not run (local crash).
- **Cost note:** every storefront image is now a Vercel Image Optimization transformation, cached per URL and width. The `next.config` comments record a past 402 once the included quota was used up. Watch the Vercel image usage after deploy.

### 2026-10-21 — Templates sorted by store industry, gallery pagination (owner request)
- **Industry first:** `sortByIndustry` in the dashboard `website/templates/templates.lib.ts`. `toTemplateCardViews` takes the store's category, maps it to an industry with `findIndustry`, and puts templates whose `category` equals that industry id first. The sort is stable, so each group keeps the DB order (default first, then `sort_order`). Applies to Website › Templates and the editor's Templates tab (both pages pass `store.storeCategory`/`storeCategoryAr`), and the gallery's category chips follow the same order. A store with no industry, or a free-text category, keeps the old order. Admin's builder is unchanged.
- **Pagination:** Website › Templates shows 12 cards per page, with Previous/Next and "Page x of y" (`websiteTemplates.pagination.*` in store-editor `ar.json`/`en.json`). Changing the category goes back to page 1. The editor's Templates panel still scrolls (it is a narrow side list).
- **Checks:** dashboard `tsc` clean. Dashboard tests 158 (2 new in `templates.lib.test.ts`). ESLint not run (local crash). No manual browser check yet.

### 2026-10-21 — New (never-published) stores are offline until published (owner request)
- **Change:** `isStorefrontOffline` (ecommerce `lib/storefront.server.ts`) is now `siteStatus !== "published"`, so a `draft` store (every new store) shows the store-offline page (noindex) on every storefront route like an `unpublished` one, instead of the old hero/categories/catalog fallback. `isCartStoreOffline` uses the same check, so `createOrder` refuses carts of never-published stores. A verified builder preview still sees the draft. Marketplace listings are unaffected. Dashboard draft-status strings (`storeSiteStatus.draft`, `statusHint.draft`, ar/en) now say visitors see the "store unavailable" page. CLAUDE.md rule 12 updated.
- **Checks:** `offline.server.test.ts` 6/6 (2 new draft cases). Ecommerce `tsc`: 16 errors, all already there before this change (none in touched files). ESLint not run (local crash). No manual browser check yet.

### 2026-10-21 — Admin entity relations, grouped sidebar, flat-fee display (owner request)
- **Change:** admin pages now link to each other through shared `apps/admin/app/(dashboard)/_components/entity/` pieces (`docs/admin-saas.md` §2.1a): customer ↔ seller account ↔ stores ↔ wallet, order → customer/store/sellers/products, product → seller/owner/stores, owner cards on store and seller pages. `/orders` gained `seller`/`store`/`customer` filters and a store column. The sidebar is regrouped into nine collapsible groups (Overview pinned). `/sellers` no longer shows the legacy 5% `commission_rate`: the fee column and seller pages show "EGP 5 per delivered order" / trial / exempt; `commissionRate` was dropped from the admin seller DTO, types and queries (DB column untouched). Broken links fixed: seller menus' `/sellers/[id]/edit|orders|payouts` and `/products/new`. Read queries and UI only: no migration, no money or ledger change.
- **Checks:** admin `tsc` clean; admin tests 105/105 (new `entity-href.lib.test.ts`, `platform-fee.lib.test.ts`, more `sidebar.config.test.ts` cases). ESLint not run (local crash, same as baseline). Dev server compiled; manual browser check not done (admin login needed).

### 2026-10-21 — Store shipping Part B: seller zones charged at checkout, places, templates (owner request)
- **Built** on `feat/store-shipping` (`3bdb35f0..3c94e359`, final fixes included), fast-forward merged into `main` on 2026-10-22. Places dataset and search (`packages/lib/src/places/`, `0244aea1`, `d59768fe`); zones on places, "Other places" setting, templates, storefront quote (`5c3cd89a`); migration `0093` plus the zone loader `stores/shipping-context.server.ts` and the legacy-row fix (`d79ac48c`, `47dcc471`); store-website checkout bills the seller's zones, the quote snapshot goes in `orders.metadata.storeShipping` (`8bd63a0e`, ecommerce side in `apps/ecommerce/lib/shipping.server.ts`); shipping credited to the seller inside the existing `sale` entry (`0c25bb45`); dashboard shipping page (`38f8202f`); searchable governorate/city fields in the address form (`92af0302`, `875306c1`, `fe6d1af2`).
- **Migration `0093`:** `store_shipping_zones.places text[]` backfilled from `governorates`, per-kg left in the column but unused, overlap trigger compares `places` plus `EG/<governorate>` of the legacy column. No `cardinality(places) > 0` CHECK (spec §6.3 said to add one): older code still running during the deploy window inserts zones without places; zod enforces 1..200 places. Applied on **staging** (twice, idempotent). **Not on production: awaiting owner approval** (dry-run in a rolled-back transaction first, then apply).
- **Money:** a Tallaby-collected storefront order with `storeShipping.method = 'own'` credits goods + billed shipping in the one `sale` entry (same `order:<orderId>` claim; `metadata.shippingPiastres`). Seller-collected orders post nothing extra; the EGP 5 fee never includes shipping; marketplace orders are unchanged. Collection-party rules for goods are the existing ones (a COD own order with no seller shipment row resolves to `tallaby`, as for goods today; changing that is a separate owner-approved task). **Final-review fix:** the snapshot also carries `collector` (`storeShippingCollector` in `packages/lib/src/payments/store-methods.ts`: cash paid to the deliverer (COD, or a wallet-partial with a COD remainder) is `seller`; online / card / customer wallet and the manual transfers InstaPay / Vodafone Cash / e& Cash, which storefronts still route to Tallaby's own accounts, are `tallaby`; anything unknown is `seller`. It deliberately ignores the catalogue `collector`; P3-07 Part B must switch the receiving methods to `seller` when the money goes to the seller's own numbers), and shipping is credited only when it is `tallaby`, so a seller who already holds the cash is never credited the shipping again.
- **Final-review fixes (2026-10-21):** digital-only carts get no zone quote in the checkout display (`getStorefrontShippingQuote`, matching `placeOrderFromCart`); unit tests for `getCheckoutShipping` (`apps/ecommerce/lib/shipping.server.test.ts`); translated place-search placeholders in `components/address/address-form.tsx`; the `template_applied` audit row records the replaced zones in full.
- **Production read-only count** (apps/shipping env, `BEGIN READ ONLY`): `store_shipping_zones` has **1 store** and **6 zones with `per_kg_surcharge > 0`**. Those 6 lose their per-kg part when the owner applies the change (the flat price is kept).
- **Checks (HEAD `fe6d1af2`):** `pnpm typecheck`: 11/12 packages pass; ecommerce fails with the same 16 errors, all in `profile.chunks.tsx` (pre-existing). `pnpm lint`: still crashes repo-wide (`Class extends value undefined`, same as the baseline; not run). `pnpm test`: ecommerce 163, dashboard 157/158, lib 507, db 7, store-editor 127, cache 40, emails 3 pass; the one dashboard failure is `product-data-format-doc.test.ts` (pre-existing); `store-sections` `catalog-seed.test.ts` timed out under load and `admin` died with a Windows `VirtualAlloc` error in the parallel run, both pass alone (8/8 and 105/105). Integration against staging: the new tests all pass (`credit-seller-shipping` 5, store shipping zones, checkout shipping 9, 24 with fee+shipping). Failures elsewhere: `@workspace/lib` 19 failed / 680 passed in 10 files (`stores.integration` 5 timeouts, also failing when run alone; `fee-trial` "rejects inconsistent trial dates"; `admin*` and `templates-studio` (staging has no `moderator` role value and similar); `store-sites`, `builder`, `preview`, `store-forms`, `library-sections-admin`), `@workspace/db` 10 failed / 54 passed (`user-wallet` 9, `stock.integration` 3 concurrency cases, `affiliate-commission`). None of those files or the code they test were touched by this branch (only `stores/server.ts`, `place-order.ts`, `credit-seller-on-delivery.ts`, `schema.ts` were, and their own tests pass); they were not re-run on `3bdb35f0` (no second install possible offline), so "pre-existing" is by reasoning plus the earlier notes for `stores`/`user-wallet`.
- **Pending:** manual E2E not run: the shipping page (apply a template, edit a zone, price check, Other places switch), storefront checkout (price shown = price charged, uncovered address with each Other-places mode, free-over threshold, COD flag), and the address form pickers on marketplace and store sites. Production `0093`, **which must be applied BEFORE this branch is deployed**: `getStorefrontShippingContext` selects `store_shipping_zones.places`, so deploying first breaks every store-website checkout. Lint is broken repo-wide.

### 2026-10-21 — Financial page: where sales came from (owner request)
- **Change:** `/financial` has a new "Where your sales came from" card (`apps/dashboard/app/(main)/financial/sales-sources.client.tsx`). It shows the seller's earnings for this month or all time, split by sales channel (Tallaby marketplace = `orders.store_id IS NULL`, the same rule as the orders-page channel filter, or each of the seller's stores) and by payment method (`cash`/`cod`/`cash_on_delivery` → COD, `wallet_*` split checkouts → wallet). It uses the same rows as the "This month sales" card (every order item of the seller by `created_at`, `seller_earning`), grouped in one seller-scoped query in `financial.data.tsx`. Store names come from `getSellerStores`. Shaping is in `financial.lib.ts`, summed in integer piastres. `getDashboardAnalytics` now starts the month at midnight on the 1st. Before, it used the current time of day, and on day 31 its last-month date could skip a month.
- **Checks:** dashboard `tsc` clean; dashboard tests 163/163 (new `financial.lib.test.ts`). ESLint not run (local crash, same as baseline). Manual browser check not done.

### 2026-10-21 — Admin coupons: seller coupons grouped by seller (owner request)
- **Change:** the Sellers tab of admin `/coupons` now opens **By seller**: one card per seller (10 sellers per page, most active coupons first). Each card shows the seller (linked), email, stores (linked to `/stores/[id]`), totals (coupons, active, uses, discount given) and a table of that seller's coupons with the deactivate/reactivate action. The old flat list stays as **All coupons** (`?view=list`), and `?seller=` still opens one seller's list. State filter and search apply to both views. New read model `listSellerCouponGroupsForAdmin` in `packages/lib/src/admin/coupons-admin.server.ts` (4 queries per page). The UI is in `seller-coupons.data.tsx`.
- **Data note:** on the DB in `apps/admin/.env` (read-only check, 2026-10-21), every coupon has `seller_id` NULL: 61 platform and 57 affiliate. No seller has created a coupon yet, so the tab shows its empty state until one does.
- **Checks:** admin and lib `tsc` clean. The new query was run read-only against that DB with no errors. ESLint not run (local crash, same as baseline). Manual browser check not done (no seller coupons to show).

### 2026-10-22 — Store websites: cart sheet on add, store chrome on shared pages, order cancel (owner request)
- **Add to cart:** a successful "Add to cart" (not "Buy now") fires `notifyCartItemAdded()` (`providers/cart-provider.tsx`); the storefront `CartSheet` listens and opens, so the shopper sees the item was added. Only store hosts mount a `CartSheet`.
- **Store chrome on shared pages:** the storefront layout's chrome moved into `StorefrontShell` (`storefront/[subdomain]/_components/storefront-shell.tsx`, same output as before). `StoreHostShell` (`components/storefront/store-host-shell.tsx`) wraps the pages a store host shares with the marketplace, `(main)` (orders, profile, payment, policies), `cart/` (checkout) and `auth/`, in the host store's header, footer and design system; tallaby.com keeps Tallaby's header/footer. The store comes from the request host only. In shared mode an offline store still shows the page (a shopper can view or cancel an order) without its chrome, and the shell adds no tracking or cart bar (orders and checkout already load `HostStoreTracking`). `/auth` on a store host drops the Tallaby logo and artwork.
- **Order and profile pages:** hard-coded green/blue/gray classes became theme tokens (`primary`, `foreground`, `muted-foreground`, `border`, `background`), so they follow each store's design system; status badges and success greens are unchanged. "Need help?" on a store host links to the store's WhatsApp (or phone), and is hidden if it has neither; it was Tallaby's WhatsApp.
- **Cancel order:** the button was shown only to signed-in owners, so guests on the emailed `?access=` link never saw it. It is now shown to anyone who can see the order while the order can be cancelled (`pending`, `payment_processing`, `confirmed`), and hidden from `shipping_soon` (shipment booked) onward. It is no longer shown disabled. `cancelOrder` (`actions/order.ts`) now accepts the owner (signed in or the guest cookie, through `getCurrentUserId`) or a valid order access token. The status rule, stock restore, affiliate and wallet refund logic are unchanged.
- **Checks:** ecommerce `tsc`: the same 16 pre-existing errors in `profile.chunks.tsx`, no new ones. ecommerce tests 168 pass, 2 skipped. ESLint crashes on every file (`scopeManager.addGlobals is not a function`), same as baseline. Manual check not done: the local dev server on :3015 returned 500 on every store route because its build workers had crashed (Jest worker exceptions, EPIPE).
- **Pending manual E2E:** on a store host, add to cart (sheet opens); open `/orders/{id}?access=…` as a guest (store chrome, cancel visible while confirmed, gone once shipping_soon/shipped); `/profile/orders`, `/auth` and checkout show the store chrome; tallaby.com pages unchanged.

### 2026-10-22 — Admin: assign a custom domain to a store (owner request)

- **What:** the admin store page (`/stores/{id}`, Overview) has a "Custom domain" block. With no domain, admins and super admins see **Assign custom domain** (domain + audited reason, `assign-domain.client.tsx` → `assignDomainAction` in `domains/domains.server.ts` → `assignDomainForAdmin` in `packages/lib/src/admin/domains-admin.server.ts`). It runs the seller's connect flow: normalizes and validates the domain, attaches the apex and its `www.` 308 redirect to the ecommerce Vercel project (detached again on failure), inserts the `seller_custom_domains` row as `pending` with an `assign_domain` audit row in one transaction, then fills Vercel's verification records. A pending domain shows the DNS records to set (A, `www` CNAME, TXT). Re-check and Remove are also on the store page now (same `domainAdminAction` as `/domains`).
- **Rules kept:** still one custom domain per seller (`seller_custom_domains_seller_id_key`, P3-03b not done), so assigning fails with a clear message when the seller already has a domain on another store; any store of the seller may receive it (the seller dashboard still only lets the primary store connect one). The domain serves only once active, with the store active and the seller approved (unchanged lookup). No migration (`assign_domain` passes the 0063 action check). Needs the `STOREFRONT_VERCEL_*` env vars in the admin app, like `/domains`.
- **Checks:** lib and admin `tsc` clean; lib tests 512 pass (224 skipped), admin 105 pass. ESLint crashes on load (`Class extends value undefined`), same as baseline.
- **Pending manual E2E:** on staging admin, assign a test domain to a store without one → row pending with DNS records, audit row present; set DNS → Re-check → active, storefront served on the domain; Remove → store back on its subdomain.

### 2026-10-22 — Store sitemap.xml was a 500 on every store in production (owner report)

- **Symptom:** `https://faster-egy.com/sitemap.xml` (and every `{store}.tallaby.com/sitemap.xml`, drafts included) returned a Next.js 500 page on Vercel; `robots.txt` on the same hosts worked. Local `next dev` and `next start` both served it fine.
- **Cause:** the store sitemap lived in a route folder named `sitemap.xml` (`storefront/[subdomain]/sitemap.xml/route.ts`). Next.js treats that name as a metadata route and the build flattens its dynamic segments (`/-/storefront/-/sitemap.xml` in the route table), so on Vercel the proxy's rewrite to `/ar/storefront/{sub}/sitemap.xml` matched no function.
- **Fix:** the folder is now `storefront/[subdomain]/sitemap-index`, and `routeStoreCrawlFile` rewrites `/sitemap.xml` to it (`STORE_CRAWL_ROUTES` in `apps/ecommerce/lib/storefront-routing.ts`). Public URLs are unchanged (`/sitemap.xml`, `/sitemaps/{n}.xml`); the build now lists `/[locale]/storefront/[subdomain]/sitemap-index` as a normal dynamic route.
- **Checks:** `next build` route table as above; `next start` serves a store host's `/sitemap.xml` as `application/xml` 200 and tallaby.com's own sitemap 200; ecommerce tests 170 pass (2 new for the crawl-file rewrite), 2 skipped; `tsc` only the 16 pre-existing `profile.chunks.tsx` errors.
- **Pending manual E2E after deploy:** `https://faster-egy.com/sitemap.xml` returns XML listing the home, published pages and products; submit it in Google Search Console.

### 2026-10-23 — Storefront templates 39–48 and 101–110, Banner carousel, flush mobile header (`0094` + `0095` live; owner request)
- **Owner brief:** build the templates and sections of the Claude Design "Storefront Templates" registry that were still missing, and make sure the header has no vertical padding on phones ("an issue repeated"). The registry now lists 110: 39–48 (Fixit … Ghorza, built on the sixth-batch sections) and 101–110 (Mawsem … Tarik, opening with the new Banner carousel) were missing.
- **Mobile header (why it repeated):** `0084` fixed each header *design*, but (a) Floating pill and Ruled bar kept 16/14px on mobile, (b) store sites saved before `0084` still carry the section's 40px mobile default, and (c) DB templates and `library_sections` are now the master copy, so a code fix never reaches them. **Fix:** `flushHeaderOnMobile` (`store-sections/src/config/header.ts`) sets the header root section's mobile padding-top/bottom to 0. It runs in `sanitizeSiteConfig` (every save, publish and template apply) and wherever a header is drawn: storefront chrome, `/template-preview`, the editor canvas, the editor preview, the template thumbnail and `PageRenderer`. Desktop and tablet padding are kept. Pill and Ruled designs now set mobile 0; `designs.test.tsx` requires 0 for every header, and `config/header.test.ts` checks the helper, the sanitizer and that all 111 code templates are already flush. No data migration.
- **Carousel element (new, additive):** `carousel` (slides only) and `slide` element types (`elements/registry.ts`, `ALLOWED_NODE_TYPES`, `canContain`). Server markup is a scroll-snap track (`elements/render-carousel.tsx`), so phones swipe without script. `CarouselRuntime` (`@workspace/store-sections/client`, mounted in the storefront shell, the template preview, and the editor preview's frame document) adds autoplay (props `autoplay`, `interval` 3–15 s, default 5), progress dots, pause and arrows (desktop only). It pauses on mouse hover, keyboard focus, the pause button, a hidden tab or when off-screen, and starts paused with reduced motion. Hidden slides are `inert`. The canvas has no runtime: the track scrolls so every slide can be edited. New aspect ratio `banner` (21:9). Editor icons, style kind and ratio labels (ar/en) added.
- **Section:** `hero-carousel` (Banner carousel: 3 photo slides with a dark fade, eyebrow, headline, line and button), the only new library design. `0094_library_hero_carousel.sql` (`section:sql --new-only`, sort 200 after the last hero). **Rewards** (points, tiers, gift card, referral) stay stand-ins (owner, 2026-10-23): `text-steps`, `promo-tiers`, `promo-coupon`, `popup-reward`, as in 49–100.
- **Templates (20, `fromLibrary`, v1, sortOrder = number × 10, home/about/contact/faq, demo catalog):** 39 Fixit, 40 Bashra, 41 Sufra, 42 Sabaho, 43 Dar, 44 Shabka, 45 Hadaya, 46 Rep, 47 Pitstop, 48 Ghorza, 101 Mawsem, 102 Shasha, 103 Ward, 104 Beity, 105 Souq, 106 Salon, 107 Kholkhal, 108 Farha, 109 Nashat, 110 Tarik. Built by four parallel agents; per-template deviations are in each `index.ts` top comment. Main ones: anchors → `/contact` or a search; price drop band → `bundle-plus`; Fixit's Buying guides → `text-steps` (`finder-guides` renders empty without posts in the render check); fixed-row tables (zones, price menu) got extra rows; bundle totals are typed; design copy slips fixed (Mawsem's "Why Kettan", Souq's "Gamal"); trademark-like product names renamed (Shasha).
- **Photos:** every photo was viewed by eye on 2026-10-23. Most design photos with models, children, hands, legs, car badges or printed brands were replaced, mostly with checked photos from sibling templates. Pitstop's floor mat 28055130 was dropped (a small "borcol" brand label). **Flagged for the owner, not changed (live templates, DB is master):** 28055130 is also in Garagy, Zeina and Kahraba; 17037530 (Zeina, teddy air freshener with printed text) and 4889719 (Zahra, a coin pendant with a face in profile) may break the photo rule. 12369534 (Zeina) was checked: no emblem visible.
- **Migration `0095_library_templates_39_48_101_110.sql`:** `template:sql` for the 20 keys + their `templatesMetaSql` (insert-only, never the default). Staging, re-run (no change), production dry run (111 templates, 1 default, rolled back), production at 2026-10-23T11:14:06Z (`0094` just before). After both, all 20 templates' config, meta, category, sort order and version equal the code on staging and production. Frozen in `frozen-seeds.test-utils.ts`; listed in the seed test's `SEEDS`. Rollback: `DELETE FROM templates WHERE key IN (…)`; `DELETE FROM library_sections WHERE key = 'hero-carousel'`. **The owner asked to push to production before the deploy ("we have no users yet"):** until the new code is deployed, the live app does not know the `carousel`/`slide` types, so templates 101–110 fail validation there.
- **Thumbnails:** 20 new 700×600 cards (template primary colour with an accent glow, desktop and phone captures of the local `/template-preview/<key>` against staging), uploaded to production `library-media/templates/<key>.png`, all 20 URLs 200 `image/png`. `thumbnail_url` set (`?v=20261023`, only where NULL) on production and staging: 111/111 active templates have one.
- **Checks:** store-sections `tsc` clean, 3691 tests pass (the 20 × 9 template checks and the carousel tests included); store-editor `tsc` clean, 127 tests pass; admin and dashboard `tsc` clean; ecommerce `tsc` has only the 16 known `profile.chunks.tsx` errors. **Browser (local dev against staging, Playwright):** `/template-preview/mawsem` at 1440 px shows the pill header with 16px padding and at 390 px with 0; the carousel autoplays in RTL (slide 3 of 3 after 14 s), labels slides "n / 3", marks hidden slides inert and shows dots, pause and arrows (arrows hidden on phones). The 20 thumbnails were checked by eye. ESLint not run (the known local crash).

### 2026-10-23 — Seller dashboard fixes: phone numbers, Search Console field, product link host

- **Phone numbers (owner: "99% of sellers are Egyptian, make it easy"):** the old checks failed on Arabic-Indic digits (٠١٢…) and on the invisible direction marks phones add on paste. New `phoneDigits` / `formatPhone` / `toLatinDigits` in `packages/store-sections/src/social/platforms.ts` (`whatsappDigits` is now an alias). `01…`, `1…` (10 digits), `20…`, `+20 …`, `0020…`, `2001…`, and Egyptian landlines `0[2-9]…` all read as Egypt; other numbers with a country code are kept. Used by Social media › WhatsApp (via `normalizeSocialLink`), Store settings › Contact (client check) and `storeContactSchema` (server), which now **saves** Egyptian numbers as `01xxxxxxxxx` and others as `+<digits>`. Error texts no longer ask for the country code (ar + en).
- **Domain & SEO › Google Search Console:** the meta-tag field is hidden when the store has an active custom domain (verify the domain in Search Console with its DNS TXT record instead; the subdomain stores still need the tag because sellers can't add DNS records on tallaby.com). A saved token is kept and still emitted. The SEO preview shows the custom domain host. New `loadLiveDomain` in `domain-seo.data.ts` (also used by the crawl status).
- **Add/Edit product link preview:** shows `<custom-domain>/products/<slug>` when the seller's domain is active (`loadProductLinkHost`, filtered by the session's seller), else the Tallaby host as before.
- **Checks:** dashboard and lib `tsc` clean; dashboard tests 163 pass, lib 512 pass, store-sections social tests 45 pass (new Egypt cases). Ecommerce `tsc` has only the known `profile.chunks.tsx` errors. ESLint not run (the known local crash). Not checked in a browser.

### 2026-10-23 — Seller dashboard: Save button in one place (owner request)

- **Owner: "keep the save button on the top left so it is easy for the seller to find."** New `PageActionBar` (`apps/dashboard/components/layout/page-action-bar.tsx`): a bar stuck under the dashboard header (`sticky top-16`) with the page's Save / Publish buttons at the inline end, which is **top-left in Arabic** (top-right in English, mirrored like the rest of the RTL layout), the same spot as the add/edit product header. Pages moved to it: Store settings › General (was a bottom sticky bar), Domain & SEO (bottom bar), Website › Design (Discard / Save draft / Publish, was a bottom bar; the preview now parks at `lg:top-36`), Blog post editor (bottom bar), Form editor (top row, now sticky), Social media (end of page), Shipping (Save was at the bottom of the settings card; its state moved to `useSettingsForm` so the page bar can save it). The old bottom bars also sat under the WhatsApp support button (bottom-left in RTL).
- **Not moved, by design:** Save in dialogs and side sheets (coupons, payment methods, shipping zones, website pages, riders, categories/brands, apps) stays in the sheet footer; Account settings' legal and payout cards keep their own Save (two separate forms, one with Cancel); seller settings autosave.
- **Checks:** dashboard `tsc` clean; dashboard tests 163 pass. ESLint not run (the known local crash). Not checked in a browser.

### 2026-10-23 — Hero carousels first in Add › Sections, new photo-only carousel (owner request)

- **Owner: "make the Carousel banners section the first hero section, with carousel items by default" and "another carousel as the second one, plain images without any content, swiping automatically."** `hero-carousel` (Banner carousel) already ships three slides (photo, eyebrow, title, line, button). New `hero-carousel-images` (Photo carousel, `designs/hero/hero-carousel-images.ts`): three full-width photo slides, no text, autoplay every 5 s with the same pause rules. `HERO_DESIGNS` now starts with the two carousels (nothing reads its first entry as a default; the Classic template imports `heroClassic` directly).
- **`0096_library_hero_carousels_first.sql`:** inserts `hero-carousel-images` at sort_order 98 (hand-set, the generator gave its code index 110) and moves `hero-carousel` 200 → 96, guarded on 200. The editor lists by `sort_order`, so this needs the migration, not only a deploy. **Not applied yet** (staging, then production with owner approval).
- **Checks:** store-sections `tsc` clean; store-sections tests: the new design's snapshot added; 40 snapshot failures are the uncommitted social-link `href` change in `elements/render.tsx` / `social/platforms.ts` (video, gallery, faq, popup, services designs), not this task; `catalog-seed` "clears another default" timed out once under load and passes alone. Lib library-sections tests pass. Not checked in a browser.

### 2026-10-23 — Language switcher in the header of translated stores (owner request)

- **Owner: "If the seller's store is translated, add the translation switcher on the navbar by default; the seller can hide it from the website builder › Navbar."** "Translated" = `stores.supported_locales` holds more than one language (Store settings › Languages).
- **New element `languageSwitcher`** (additive in `ALLOWED_NODE_TYPES` and the element registry, not in the palette). It renders `ctx.renderLanguageSwitcher` (storefront: `StorefrontLanguageSwitcher variant="site"`, which picks up the header's colours and shows only the globe on phones), or a static copy in the editor.
- **Never saved, added where the header is drawn:** `withLanguageSwitcher(header, translated)` (`packages/store-sections/src/config/header.ts`) puts it before the cart link, else after the menu, else after the logo, else at the end of the header. It leaves out stores with one language, headers with `props.languageSwitcher === false`, and headers that already hold one. So every template and existing site gets it **with no migration**. Every code template places it before the cart (test). Used by `StoreSiteChrome` and the editor canvas. Template previews (`SitePreview`) are unchanged.
- **Builder:** select the header → Content shows a **Navbar › Language switcher** switch (translated stores only). Off stores `languageSwitcher: false` on the header instance, and on removes the key. The default `StorefrontHeader` also shows its switcher only for translated stores. `getStorefrontBySubdomain` now selects `supportedLocales` (cache key `storefront-v10`). Saving store settings already invalidates it.
- **Checks:** `tsc` clean in store-sections, store-editor, ecommerce and dashboard (ecommerce's existing `profile.chunks.tsx` react-hook-form errors are not from this task). Tests pass: store-sections 3831, store-editor 127, ecommerce 170. Lint clean on touched files. Manual E2E not run yet.

### 2026-10-23 — Section options in the sidebar's Content tab (owner request)

- **Owner: "for any section with options like carousel images, autoplay, interval, add them to the Content tab."** Review of every element type: the ones with settings rather than on-page text are `carousel` (autoplay, interval, slide photos), `video` (link, thumbnail, playback), `videoPlaylist` (list position, controls, videos), `productList`, `categoryList`, `postList` (data source, limits) and `storeForm` (form). Before, they were only reachable by clicking the inner element, which a carousel's slides cover.
- **Now:** with a whole tree section selected (page sections, header, footer), Content shows **Section options**: one card per such element in reading order, with the element's own fields and a "Select on page" button. A carousel card also lists its slides with each slide's photo (media picker and alt text), **Add slide** (copies the last slide, new ids) and remove (never the last). Selecting a carousel element shows the same card. Elements inside a data list's card template are skipped. `store-editor/src/lib/section-settings.lib.ts` (+ tests), `inspector/section-settings.client.tsx`, `editor-sidebar.client.tsx`; strings in both `ar.json` and `en.json`. The misleading "shows your store's details" line no longer shows on custom sections.
- **Checks:** store-editor tests 131 pass (4 new); store-editor, dashboard and admin `tsc` clean except `store-sections/src/elements/render.tsx:449`, which is in the uncommitted social-link work, not this task. Not checked in a browser (no dev server running).

### 2026-10-23 — Live cart count and working header search on store websites (owner request)

- **Owner: "Make the cart icon in the navbar show a small badge counting the cart items, updated on every add; make the header search bar a real search input in every header, listing the live store's products as you type."**
- **Renderer (`packages/store-sections/src/elements/render.tsx`), no saved-data change and no migration:** two optional host hooks on `RenderContext`: `renderCartBadge` and `renderSearch`. A `linkBlock` to `/cart` (or `role: "cart"`) holding an icon gets the badge inside its box (a footer's text-only "Cart" link does not). A `linkBlock` to `/products` holding exactly one `search` icon and at most one text (nothing but rows, icon and text) is drawn by the host in the link's own box (node id kept, so its border, padding and colours still apply): a search box when it has a placeholder text, else a search button. The editor passes neither hook, so the canvas is unchanged; design snapshots are unchanged. Every header design has a cart count and, except Pill (no search), a live search (`elements/header-tools.test.tsx`); the 110 library templates use these headers, Classic's chrome matches too.
- **Storefront (`store-site.tsx`):** `StoreCartBadge` reads `useCart` (host-scoped cart, refreshed on every add/remove/update). `StoreSearchBox` (inline input, results dropdown under it) and `StoreSearchButton` (search panel from the top, `Sheet`) list up to 6 matches as the shopper types (250 ms debounce, stale replies dropped), with "See all results" and Enter going to `/products?search=…`. Results come from the new server action `searchStorefrontProducts` (`apps/ecommerce/actions/storefront-search.ts`): the store is resolved from the request host only, an offline store (unless a verified preview) and the marketplace get nothing, the catalog rules apply (`catalogStoreId`, D24) through the existing cached `getProducts`. Strings in both `ar.json` and `en.json` (`storefront.search*`).
- **Checks:** `tsc` clean in store-sections and on the touched ecommerce files (ecommerce's existing `profile.chunks.tsx` errors are not from this task). Tests pass: store-sections 3844 (13 new), ecommerce 170. ecommerce `eslint` crashes inside ESLint for every file (`scopeManager.addGlobals is not a function`), so lint was not run. Manual E2E not run yet (no dev server).

### 2026-10-23 — Builder links to the custom domain; no custom-domain redirect on localhost (owner request)

- **Owner: "the store link in the builder header should be the custom domain if the store has one; on localhost don't redirect me to the custom domain, keep `tallabya.localhost:3000`."**
- **Builder:** the dashboard and admin editor pages (`app/(builder)/stores/[storeId]/editor/page.tsx`) now load the store's active custom domain (`findActiveCustomDomainForSubdomain`) and pass `storeUrl(subdomain, customDomain)` as the top bar's link and the render context's store URL.
- **Local development:** `storeUrl` / `storeHostname` (`packages/lib/src/storefront/index.ts`) keep the `*.localhost` subdomain when `NEXT_PUBLIC_ROOT_DOMAIN` is localhost (a call with no subdomain, e.g. the domain settings card, still links to the domain). New `isLocalHost(host)`; `apps/ecommerce/proxy.ts` skips the subdomain → custom domain 308 for `*.localhost` hosts. Production behaviour unchanged.
- **Checks:** lib storefront tests 47 pass (2 new); `tsc` clean in lib, dashboard, admin and ecommerce. The running dev server still redirected until it reloads `proxy.ts`; browsers cache the old 308.

### 2026-10-23 — Every template's home page has a product grid (owner request)

- **Owner: "Ensure that all templates homepage we have to have at least one products grid section."** Audit of all 111 code templates (`CODE_TEMPLATES`: Classic, Atelier and the 109 library ones): every home page held a `productList` except **Sage (`botanica`)** and **Zaki (`zaki`)**.
- **Fix:** both get the library `products-grid` design on the home page. Sage v3: "Best sellers" (`best-sellers`, 4), after the promise bento. Zaki v2: "Devices we install" (`featured`, 4), after the technician cards. New test "every code template's home page … has at least one product grid" in `templates/library-templates.test.tsx` keeps it that way for new templates.
- **`0097_template_home_products.sql`:** a new `template_versions` row for each (config from `templateConfigJson`) made current, guarded: no `draft_config`, current version still the seeded one (botanica v2, zaki v1) and no later version, so an admin-edited template is left alone. Stores that already applied either template are not touched. **Applied on staging and production 2026-10-23** (owner: "apply to both"). Production already had it (14:07:57Z, applied outside this session); staging applied by psql, and a re-run updates 0 rows. Current botanica v3 / zaki v2 configs are identical on both (md5 compared).
- **Checks:** store-sections `tsc` clean; store-sections tests 3955 pass (one suite failed to load: `src/__footer_social.test.tsx`, another session's temp file that was gone by the end of the run). No lint script in store-sections. Not checked in a browser.
### 2026-10-23 — Header notification bells for admin and sellers (owner request)

- **Owner: notification bells in the admin header (new seller, store published, …) and the seller dashboard header (new order, …), each backed by its own table.** The existing `notifications` table was **kept as is**: it is the live storefront customer bell (returns, affiliate commissions, shipment updates, 0023's realtime trigger), so repurposing it would break that bell. Two new tables instead.
- **`0098_admin_seller_notifications.sql`:** `admin_notifications` (one shared inbox for the admin team: `read_at`/`read_by`) and `seller_notifications` (`seller_id`, optional `store_id`). Both have RLS on with no policies, `type` CHECK lists, and a unique `dedupe_key` (`(seller_id, dedupe_key)` for sellers) written with `ON CONFLICT DO NOTHING`. Rows hold `type` + `data`; each app renders the text (dashboard in ar/en). Filled by AFTER triggers, so every write path is covered and a rolled-back write leaves nothing. Each event function swallows its own errors, so a notification can never block the write that caused it:
  - admin: `seller_created` (INSERT `sellers`), `store_created` (INSERT non-primary `stores`), `store_published` (`first_published_at` NULL → set; republishing is not announced), `top_up_requested` (INSERT pending Vodafone Cash / InstaPay top-up).
  - seller: `order_created` (one per order and seller, from `order_items` INSERT; online-payment orders only once they leave `payment_processing`, never when cancelled), `top_up_approved` / `top_up_rejected` (manual top-up reviewed), `question_received`, `review_received`.
  - realtime: a content-free broadcast on insert. Admin: topic `admin:notifications`, new `realtime.messages` policy "admins_read_admin_topic" (`is_platform_admin()`). Seller: event `seller_notification` on the seller's `user:<id>` topic (0023's policy). The bells refetch through session-scoped server actions and also poll every 60 s while visible.
  - **Not yet applied anywhere.** Staging first, then production with owner approval.
- **Code:** `packages/lib/src/notifications` (`notifications.lib.ts`: types, hrefs, id validation; `notifications.server.ts`: list + mark-read, seller queries scoped by the session's seller id). Admin: `actions/notifications.ts` (behind `getCurrentAdminUser`), `_components/layout/notification-bell.tsx` + `.lib.ts`, mounted in `header.tsx`. Dashboard: `actions/notifications.ts` (behind `requireSeller`), `components/layout/notification-bell.client.tsx`, mounted in `dashboard-header.client.tsx`; `notifications` strings in `ar.json`/`en.json`. Drizzle `adminNotifications`/`sellerNotifications` + relations.
- **Checks:** `tsc` clean in db, lib, admin and dashboard. Tests: lib 522 pass (8 new in `notifications.lib.test.ts`), admin 105, dashboard 163. Lint still cannot run (ESLint crashes on load, §23 baseline). Migration not run against a database, and the bells not checked in a browser.


### 2026-10-23 — Admin store page: one page by category, and apply a theme (owner request)

- **What:** `/stores/[storeId]` in Admin is one page instead of nine `?tab=` tabs, grouped as Store, Website, Products, Payments & shipping, Integrations, Forms & content (forms, blog/CMS, media) and Activity. A sticky "jump to" list (a scrolling row on phones) marks the section in view; each group streams in behind its own Suspense. Section ids are the old tab keys, so `storeHref(id, tab)` now gives `/stores/<id>#<tab>` and an old `?tab=` link scrolls to its section.
- **Theme:** Website opens with the current theme (palette band, thumbnail, when it was applied), **Change theme** (gallery with search, category filter and palettes; premium themes disabled) and **Undo theme change**. Applying goes through the admin editor's audited `applyTemplate` (reason required, drafts only, `apply_store_template` audit row); "Publish now" is offered, and honoured on the server, only when the site is already published, so an offline store never goes live from here.
- **Code:** `apps/admin/app/(dashboard)/stores/[storeId]/`: `page.tsx`, `store-tabs.tsx` renamed to `store-sections.tsx` (the Template fact left Overview; the duplicate force-unpublish button left Overview, Website keeps it), new `store-section-nav.client.tsx`, `store-theme.client.tsx`, `applyStoreThemeAction`/`undoStoreThemeAction` in `website-actions.server.ts`. `STORE_DETAIL_TABS` in `@workspace/lib/admin` is no longer used by the page.
- **Checks:** admin `tsc` clean; admin tests 107 pass (2 new for the theme actions, `storeHref` test updated). Lint still cannot run (ESLint crashes on load). Not checked in a browser: the connected Chrome could not reach localhost.

### 2026-10-23 — Template product pages: every template designs its own product page (owner request; `0100`–`0102` not applied anywhere)

- **What:** The store product page is now a builder page (`kind = 'product'`, slug `product`, one per store, cannot be deleted or have its slug changed, never in the menu on apply) made of element trees, so sellers edit it like any other page. New product elements and a product scope in `packages/store-sections` (gallery, title, price, rating, variant picker, buy box with `variant` solid/outline, content, details, tabs, reviews, related products with a `related` source), host hooks that the storefront fills with cart, wishlist and reviews, and a `product-page` library category offered only while editing the product page. All 111 templates carry their own product page, built by a shared `productPageSpec` builder (surface, corners, headings, buy-box style, related/reviews copy in AR and EN); the `tracking` axis was dropped because letter-spacing breaks joined Arabic. The storefront (`apps/ecommerce`) renders the site's product page and falls back to the old layout when a store has none; empty product sections are hidden in public, but sections with seller content stay. Builder previews use `getStorePreviewProduct` (`packages/lib`); template previews use a template-specific demo product (`templateDemoProduct`). Product content HTML is sanitised by the host (`sanitizeRichTextHtml`) and printed as is by the element.
- **Migrations (hand-written, idempotent; none applied anywhere):** `0100` `store_pages.kind`; `0101` the product-page library sections (insert-only); `0102` template product pages (about 3.3 MB; adds a new current version with the product page to each DB template and bumps `draft_version` where a draft exists; generated by `pnpm template:product-page-sql ../db/migrations/0101_template_product_pages.sql` in `packages/store-sections`). **Required apply order: `0096` → `0097` → `0098` → `0099` → `0100` → `0101` → `0102`.** **Deploy order for `feat/template-product-page`: apply `0096` → `0097` → `0098` → `0099` → `0100` BEFORE deploying the branch (its code selects `store_pages.kind`, so every store page read breaks without `0100`); deploy; then apply `0101` and `0102` (their trees use the new product element types, which the old app rejects); then run `backfill:product-pages` (only after `0102`, else stores created in the gap fall back to Classic's code product page). Before deploying, run the read-only `packages/db/scripts/check-unscoped-bound-nodes.sql` (a bound node outside a list or the product page now renders nothing in public).** `0102` must run after `0097`: `0097` only touches Sage and Zaki while they are still at their seeded version, and `0102` adds a new version, so running it first makes `0097` skip them. Staging first; production only with the owner's go-ahead (rule 4).
- **Dry run:** the full `0102` was run on PGlite by the controller: a template without a draft (classic) gets a new current version with one product page plus `meta`; a template with a draft (atelier) also gets the page appended to the draft and `draft_version` 1 to 2; a soft-deleted template is untouched; a second run changes nothing.
- **Visual QA:** all 111 template product pages rendered at desktop width (1280), and 4 at 520, on a dev server pointed at staging with an uncommitted code-template preview patch (not committed). Findings led to the template-specific demo product and a full-width brand-band reviews panel (bunn, loaf, streetwear re-checked). Noted for the owner, not part of this feature: broken demo-catalog photos in the related cards of clay, bambino, moto and tarik.
- **Backfill (existing stores):** `packages/lib/scripts/backfill-product-pages.ts`, idempotent, one transaction per store, dry run by default, never reads `DATABASE_URL` from a file, prints only the host. Dry run: `DATABASE_URL=postgres://... pnpm --filter @workspace/lib backfill:product-pages`. Write: the same with `--apply` (needs `REVALIDATE_SECRET` and `ECOMMERCE_URL` to broadcast cache tags, else the cache clears by TTL). Staging first; production needs the owner's go-ahead.
- **Final-review fixes (2026-10-23):** the backfill no longer updates a revision's snapshot (the `0051` trigger makes revisions append-only, so that rolled back every published store; the dry run hid it). It now inserts a new revision (number max + 1 under the store lock, the live revision's `schema_version` and `template_key`, `published_by` NULL; snapshot = live snapshot + the product page) and repoints `stores.published_revision_id`; the old revision is untouched and the dry run reports the same outcome and revision number. Checked on PGlite with the real `0051` trigger: the old UPDATE raises "append-only", the new insert + repoint succeeds. A seller-placed `addToCart` on the product page draws nothing for a product with variants (it would add one without a variant). A product section pasted onto a normal page is hidden in public. Template undo keeps the product page. The phone buy bar on store hosts docks at the bottom edge with safe-area padding (store hosts have no bottom nav). **Pre-deploy data check:** `packages/db/scripts/check-unscoped-bound-nodes.sql` (read-only, `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/db/scripts/check-unscoped-bound-nodes.sql` or the Supabase SQL editor) counts bound nodes outside any `productList`/`categoryList`/`postList` and outside product pages in store page drafts, store header/footer, live revision snapshots, library sections and template configs/drafts; every count should be 0 (the `product-page` library category is reported on its own row). Checked on PGlite with sample rows; not yet run on staging or production.
- **Open items:** the DB integration tests (migrations, `createStorePage` guards, backfill, `getStorePreviewProduct`) have never run (no `TEST_DATABASE_URL`); manual E2E on staging (storefront product page, builder edit and publish, apply template, undo); owner go-ahead for production; deferred minors are in `.superpowers/sdd/2026-10-23-template-product-page/progress.md`.
- **Checks:** `pnpm typecheck`: every package clean except ecommerce, whose 16 errors are all in `app/[locale]/(shop)/(main)/profile/_components/profile.chunks.tsx` (react-hook-form resolver types; file untouched by this branch, `git diff 8f57ded0..HEAD` empty). `pnpm test`: all packages pass (store-sections 41 files, store-editor 138 tests, lib 45 files with 33 DB-integration files skipped, db 5 skipped, ecommerce 22, admin 18) except dashboard `product-data-format-doc.test.ts` (PRODUCT_DATA_FORMAT.md example, CRLF; not touched by this branch). `pnpm lint` cannot run here: ESLint crashes with `scopeManager.addGlobals is not a function` (ecommerce) and `eslint` is not installed for tiptap and ui in this worktree; the same environment issue as the §23 baseline.


### 2026-10-23 — Template apply keeps only the hero and store-data sections; template order in Add › Sections; paginated home grid (owner request)

- **Apply:** "Use template" (seller gallery and Admin) now writes only `templateEssentials(config)` into the drafts. Home page: the first `hero` section (else the page's first section) plus every section with a `productList`, `categoryList` or `postList`; the first product grid after the hero gets `paginate: true` and `limit: 12`. Other pages are still created and filled, but keep only their `page-header` sections and sections with store data or a store form (Contact keeps its form; About and FAQ get just their header). Header and footer are applied as before. Forms are made only for the sections kept, so the home newsletter form is no longer created. The gallery and template preview still show the full template. Owner decisions (2026-10-23): filtered pages are still created, the newsletter is dropped, and only the main grid is paginated. **Not changed:** a new store's starter site (`seedStarterSite`) still gets full Classic, and stores that applied a template earlier keep their drafts.
- **Add › Sections order:** the editor (dashboard and Admin) puts the library designs of the store's current template (`stores.template_key`, current version) first in each category, in template order (`getStoreTemplateLibraryKeys` → `preferTemplatePresets`). Template copies of library designs now carry `libraryId` (`fromLibrary`), so `as:` renames still map back.
- **Pagination:** the `productList` element has a `paginate` switch ("Split into pages"). The storefront home page and builder pages read `?page=N`; `resolveStoreCatalog` fetches that page with its total (`productPages`), and the list draws page links (`ProductPager` in `elements/render.tsx`). A paginated list ignores the `offset` lead. Ranked sources (best sellers, trending) page through at most 96 products. The editor canvas shows page 1, with page links estimated from the store's product count. No migration and no change to stored templates: pagination is set when a template is applied, and a seller can switch it on for any list.
- **Code:** `packages/store-sections/src/templates/{essentials,library-order}.ts` (+ `essentials.test.ts`, 114 tests), `elements/{data,registry,render}.ts(x)`, `core/types.ts`, `designs/builder.ts`; `packages/lib/src/store-sites/templates.server.ts` (+ integration test expectations); `apps/ecommerce/lib/store-site/catalog.server.ts`, storefront `store-site.tsx`, home and `[pageSlug]` pages; both `editor/page.tsx`.
- **Checks:** `tsc` clean in store-sections, lib, store-editor, dashboard and admin. In ecommerce the only `tsc` errors are the 16 already in `profile.chunks.tsx` (file unchanged). Tests: store-sections 4073 and lib 522 pass. In the parallel run one test in each package timed out at 5s; both pass alone. store-editor 132 and ecommerce 170 pass. DB integration tests not run (no `TEST_DATABASE_URL`). Lint still cannot run (ESLint crashes on load). Not checked in a browser.

### 2026-10-23 — Admin people pages: customers only shoppers, sellers with store and source, store KPIs; "where did you hear about us" pop-up (`0099` live; owner request)

- **Definitions (owner, 2026-10-23):** Customers = shoppers (registered users and guest-checkout accounts) who order from stores; Sellers = customers who became sellers; Stores = the sellers' stores.
- **Customers (`/customers`):** only `users.role = 'customer'` with no `sellers` row (sellers, admins and drivers are gone from the list, the stats and the tab counts). The Role column and filter are replaced by **Came from** (the store of the customer's first order, from `orders.store_id`, with a green dot when its website is published; else "Marketplace" or "No orders yet"; filter `origin` = store / marketplace / none, plus `?store=<uuid>`) and **Account** (Registered / Guest). No storefront signup records a store, so a customer with no orders has no store. New KPI cards: customers (+today, this month, guests), came from a seller's store, avg spend, AOV.
- **Sellers (`/sellers`):** columns are Seller (owner name, email and phone from `users`), Store (primary store with the published/grey dot, admin link and storefront link, "+N more"), Heard from, Status, Products, Platform fee, Last order, Balance, Joined. Removed: Fee exempt and Free delivery toggles (still on the seller page), Rating. Filters: `source` (the seven answers + not answered) and `site` (published / not published) replace the fee and delivery filters. Search also matches owner name/email/phone and store name/subdomain. KPI cards: sellers (+today), website published, selling in the last 30 days, in free trial (+negative wallets), plus a ranked "Where sellers heard about us" bar list (each row filters the table).
- **Stores (`/stores`):** KPI cards (stores +today, websites published/drafts/off, custom domains, store orders and revenue in the last 30 days) from `getStoreDirectoryStats` in `packages/lib/src/admin/stores-admin.server.ts`.
- **Sidebar:** the Sellers badge is now "New sellers today" (`newSellers`, Cairo day) like Customers; "New customers today" now counts only real customers. `pendingSellers` stays for the home action centre.
- **Pop-up (seller dashboard):** `HeardAboutUsDialog` in `app/(main)/layout.tsx` asks once (Facebook, Instagram, YouTube, TikTok, Google, Friend, Other + optional text). "Later" hides it for the browser session; it shows until answered. `saveHeardAboutUs` takes the seller from the session and writes only while `heard_about_us_at IS NULL` (first answer wins). Strings in ar/en (`heardAboutUsDialog`). Shared values: `packages/lib/src/sellers/heard-about-us.lib.ts` (+ test).
- **Migration `0099_seller_heard_about_us.sql`:** `sellers.heard_about_us` (CHECK on the seven values), `heard_about_us_other` (≤120 chars), `heard_about_us_at`, partial index. Applied on staging (run twice, idempotent) and, after a rolled-back dry run, on production on 2026-10-23 (owner asked for both in the request). `0098` is still not applied anywhere. The admin sellers page and the dashboard read these columns, so `0099` must be on a database before this code is deployed against it.
- **Checks:** `tsc` clean in admin, dashboard, lib and db. Tests: admin 107, dashboard 163, lib admin+sellers 77 pass. The new customers, sellers, sidebar and store-stats queries were run against staging through a throwaway vitest with admin auth mocked (445 customers after excluding 20 sellers + staff; seller rows carry their stores). Lint still cannot run (ESLint crashes on load). Not checked in a browser.

### 2026-10-24 — PostHog and the Elfsight chat removed (owner request, for performance)

- **PostHog:** `posthog-js` uninstalled from ecommerce; `instrumentation-client.ts` (its only content was the PostHog init) deleted; every `posthog.capture/identify/reset` call removed (cart, checkout, wishlist, coupons, auth, address, reviews, wallet, affiliate, onboarding, order cancel, share popover). The share popover lost its tracking-only `productId` prop (and `ProductImages`/`product-hero` stopped passing it). The PostHog wizard skill in `apps/ecommerce/.claude/` was deleted.
- **Admin analytics simplified:** `apps/admin/lib/analytics/posthog.server.ts` deleted (it was already switched off); `getAdminAnalytics` returns the database `CommerceAnalytics` only; the commented-out PostHog card and its types are gone; the PostHog row left the Settings env check. `POSTHOG_*` removed from `turbo.json` and both `.env.example` files. The PostHog env vars can be deleted from Vercel.
- **Elfsight:** `components/chatbot/elfsight-chatbot.tsx` (and the unused `zolai-chatbot.tsx`) deleted, unmounted from the `(shop)` layout; the `data-chat-avoid` markers on the bottom nav and sticky add-to-cart bar removed.
- **Kept:** Tallaby's Meta Pixel + CAPI and GA4 on the marketplace, and sellers' own Pixel/GA4/GTM on storefronts.
- **Checks:** `tsc` clean in admin; ecommerce only has the 16 known errors in `profile.chunks.tsx`. Tests: ecommerce 170, admin 107 pass. Lint still cannot run. Not checked in a browser.

### 2026-10-24 — Template product pages applied on staging and production (owner: "apply everything to staging and production")

- **State before:** production had `0096`–`0099`; staging had `0097` and `0099`. `main` (with this feature) was already deployed to production by Vercel (~22:33Z), so `store_pages.kind` was missing for a few minutes until `0100` landed.
- **Applied:** staging `0100`, `0096`, `0098`, `0101`, `0102` (each re-run once: no change); production `0100` (after a rolled-back dry run), then `0101` and `0102` (after a rolled-back dry run of both). Result on both: the 4 product-page library sections, 111 templates whose current version has exactly one product page (154 → 265 template versions).
- **Check:** `check-unscoped-bound-nodes.sql` on both: no seller content affected (only the product-page library section's own bound title).
- **Backfill:** staging 27 stores added (1 published store got a new live revision); production 19 added, 2 skipped (`tallabya`, `helmetledli` already had a product page from applying a template after the deploy; their live sites get it when they publish), 4 published stores (faster, qavero, sherin-handmade, fsala) got a new live revision with the page. Re-runs: nothing left. Cache broadcast sent to https://tallaby.com.
- **Live check:** `faster.tallaby.com/products/vibra-v5-earbuds` and a sherin-handmade product render the template product page (gallery, price, buy box, details, reviews and questions). Follow-up fix `8bd961d6`: descriptions with `&nbsp;` entities are decoded on the product page.
- **Still open:** TPP-08 (DB integration tests with `TEST_DATABASE_URL`, manual builder E2E).

### 2026-10-24 — Header/footer options, one-page Website screens, carousel width (owner request)

- **Header/footer options (builder Content tab):** selecting the whole header or footer shows Store logo, Store name next to the logo, Language switcher (translated stores), Light/dark mode and Sign in. Stored on the instance's props only when different from the default (header: logo, name, language on; footer: logo, name on) and drawn by `drawChrome` (`packages/store-sections/src/config/header.ts`) in the canvas, the site preview and the storefront, never saved into the tree. New drawn-only element types `storeLogo`, `themeToggle`, `accountLink` (additive, not in the palette). The store logo from Website › Design replaces the design's mark in every header's logo link (else goes before the store name) and before a footer's store-name heading; all code templates are covered by `header.test.ts`.
- **Dark mode:** a site whose header or footer has the toggle gets `siteDarkCss` (surface/text tokens turn dark, brand and accent kept) and an init script restoring the visitor's choice (`localStorage` `sf-theme`) before paint. Sign in opens the sign-in dialog, or links to `/profile` when signed in.
- **Website › Design:** one page with a jump bar and titled sections (Brand first, Colors in two groups, Fonts, Buttons & corners, Page layout) beside a tall sticky preview; full width. **Store settings:** builder sellers no longer see (or send) the logo there, only a link to Design; sellers outside the builder rollout keep logo and banner in Settings.
- **Domain & SEO, Forms:** single pages with anchored sections instead of tabs; old `/domain/seo`, `/domain/sitemap`, `/forms/submissions` URLs redirect (query kept).
- **Templates:** fetched a page at a time (12) with React Query (`listTemplatesPage`), `?page=` and `?category=` in the URL, skeleton cards, next page prefetched; a `QueryClientProvider` is now mounted in the dashboard root layout. The server action still loads the whole template list before slicing.
- **Carousel:** keeps playing under the mouse. A section holding a carousel is full width by default; Style › Width Contained/Wide now box it to the page container (`data-shell-width` on the section; an explicit `contained` is now kept by `normalizeShell`). Footer social icons are fixed circles with a soft tint and never shrink.
- **Checks:** `tsc` clean in store-sections, store-editor and dashboard (apart from stale `.next/types` for the deleted domain layout); ecommerce only has the 16 known `profile.chunks.tsx` errors. Tests: store-sections 4623, store-editor 138, dashboard 168, ecommerce 183 pass. Lint still cannot run. **Not checked in a browser** (to do: header/footer toggles in the builder, dark mode and sign-in on a store, carousel widths, Design/Domain/Forms/Templates pages).

### 2026-10-24 — Seller dashboard UX fixes (Phase 9D, UX-01…10, owner request)

- **Source:** UX review of the seller dashboard and signup flow (desktop and mobile). Plan: `docs/superpowers/plans/2026-10-24-seller-dashboard-ux-fixes.md`. Work is uncommitted on `main`, beside the owner's own uncommitted changes.
- **Where the code differed from the review:** `sellers.wallet_balance` mirrors the store wallet (`postStoreWalletEntry`, `store-wallet.ts:204`), so the home KPI is the store wallet, not separate earnings: relabelled "Store wallet", "Withdraw" removed. The Reports page is already hidden in the sidebar. Bulk product delete already had TableSection's confirm; only feedback was missing.
- **Behaviour changes:** auth actions (`actions/auth.ts`) return `{ error, code? }` instead of throwing (Next masks thrown server-action messages in production), and unknown Supabase errors show the translated generic text; new `resendConfirmation` (3 per 10 min per IP, per instance). Heard-about-us now waits 24 h after `fee_trial_started_at` (the first store's `created_at`). The custom-domain DNS section opens by default while the domain is pending. Arabic "Mark {count} delivered" typo fixed (`كتم` → `تأكيد توصيل`).
- **Checks:** dashboard `tsc --noEmit` has no new errors (only the 4 stale `.next/types` errors for the deleted domain layout); `vitest run` 175/175 (7 new: `heard-about-us.lib`, `wallet-kpi.lib`). ESLint still cannot run (ESLint 10 vs `@typescript-eslint/utils` FlatESLint import).
- **Not checked in a browser (UX-11):** delivery cancel/return/bulk-delivered confirms; app disconnect confirm; domain remove; Design publish confirm; product row delete; Arabic table labels on orders/delivery/reviews; reviews search; wallet ledger order link; login wrong password and unconfirmed email + resend (production build, to see the returned errors); signup confirm screen resend cooldown; `/?welcome=1` banner; store create → website overview; Store wallet KPI negative/zero/positive; Plan › Fees; unsaved-changes prompt on product edit and store General (link click and reload). Phones at 390 px in Arabic.

### 2026-10-24 — tallaby.com marketing site UX fixes (owner request, before staging/production push)

- **Source:** UX review of the marketing site in `apps/ecommerce` (`(marketing)` routes, Arabic and English, 1440 px and 390 px, local dev on staging). Uncommitted on `main`, beside the owner's own uncommitted changes (`messages/{ar,en}.json` edited by targeted value replacement only; their hand formatting kept).
- **Broken images:** commit `9cd7d9ed` deleted `public/banner*.jpg` (old marketplace sale banners with models and brand logos) but About, the blog, the CMS blog fallback and the home builder demo still used them. Now product-only photos (`accessories.jpg`, `cosmetics.jpg`, `fashion.png`) and `/og-image.jpg` as the cover fallback.
- **Blog:** static posts without an article are no longer listed, served or in the sitemap (only `pricing-products` remains); CMS posts without a body are `noindex` and left out of the sitemap; blog post hreflang gets `x-default` back.
- **WhatsApp:** `https://wa.me/@tallaby` was not a valid link. The number is now `NEXT_PUBLIC_SUPPORT_WHATSAPP` (digits, e.g. `2010…`, in `.env.example`); **while it is unset every WhatsApp button and link is hidden — set it in Vercel before the push.** The floating button moved to the bottom end corner (left in Arabic) and hides while a dialog locks the page (it covered the signup submit button on phones).
- **Copy (owner's business model, `PLAN.md` §13):** fees come from the store wallet, not "payouts"; "delivered order" instead of "successful order"; Free plan = up to 3 stores; trial = orders *placed* in the first 7 days after the first store (`isTrialActive`); "returned orders aren't charged" narrowed to orders cancelled or refused at delivery, because nothing posts a `fee_reversal` when a delivered order is returned (`credit-seller-on-delivery.ts`); Terms §4 and §6 rewritten to match; "24/7 support" claims replaced (office hours are Sun–Thu); Arabic marketing copy says جنيه instead of EGP (the shared `common.egp` unit label used by the shop is unchanged); Pricing card lists the 3-store limit and the trial.
- **Flows:** signup "check your email" step has resend (60 s cooldown, `resendSignupConfirmation`, 3 per 10 min per IP, per instance) and "use a different email"; signup focuses the first invalid field; contact form errors linked with `aria-describedby` and focus moves to the "sent" heading; templates page shows 12 at a time with "Show more" (the phone page was ~54,000 px); "Use this template" / "Start blank" relabelled "Create your store" with a hint to apply the template from the dashboard (signup doesn't carry the template).
- **Also:** `packages/ui` `DialogContent` takes an optional `closeLabel` (default "Close"); placeholder map/photo boxes removed from Contact and Careers; React key warning on the home template gallery fixed; breadcrumbs labelled; fee calculators announce only results; storefront order "Need help?" `tel:` link kept the digits (`/[^d+]/` → `/[^\d+]/`).
- **Checks:** ecommerce `tsc` only the 16 known `profile.chunks.tsx` errors; `vitest run` 183 passed, 2 skipped; ESLint still cannot run. Browser (headless Chrome, staging data, dummy WhatsApp number): no broken images on Home/About/Blog; WhatsApp button left in Arabic and hidden with the signup dialog; dialog close label "إغلاق"; templates 12 → 24 on Show more; Terms fees text; no key warning on `/` and `/en`.
- **Not checked:** signup resend against real Supabase email; the English pages beyond Home and Pricing; production build.

### 2026-10-24 — Product form SEO keywords (owner request)

- **Change:** a Keywords tags input under Meta description in the product form SEO section, per language (Enter or comma adds, Backspace removes, pasted lists split; up to 15 keywords of 40 characters, case-insensitive repeats dropped). Stored in the new `product_translations.meta_keywords text[]` (`0103_product_meta_keywords.sql`, additive, default `{}`); cleaned again in the create/update server actions (`meta-keywords.lib.ts`). The store product page now uses the seller meta title, meta description and keywords in its metadata (it used the name and short description before).
- **Deploy order:** apply `0103` on staging, then production (owner approval), BEFORE deploying: the storefront translation query selects `meta_keywords`, so every product page breaks without it. **Not applied anywhere yet.**
- **Checks:** dashboard typecheck (only stale `.next` types for the deleted domain layout), ecommerce typecheck (only the 16 known `profile.chunks.tsx` errors), dashboard vitest 178 passed (new `meta-keywords.lib.test.ts`). **Not checked:** the field in a browser and a save round trip (needs `0103` on staging).

### 2026-10-24 — Builder logo uploader + image upload check (owner request)

- **Change:** while a store has no logo, the website builder canvas shows an "Upload logo" button in the logo's place in the header and footer (`drawChrome` option `logoPlaceholder`, `RenderContext.renderLogoUploader`, `storeLogo` renders it in edit mode only; the storefront and the preview are unchanged). The file goes into the store's media library (same signed `store-media` upload as every editor image), then the new optional `EditorAdapter.saveLogo` saves its URL as `stores.logo_url` through `saveStoreGeneral`, so the logo shows in the canvas header and footer at once and on the live site. Hosts without `saveLogo` (admin template/section editing) and read-only stores show no uploader. Media library usage now counts the store logo.
- **Upload check:** production storage holds recent PNG logo uploads in `sellers` (the uploads went through; the files were never saved to a store or seller), and an anon PNG upload to `sellers` on staging succeeds. Locally, `apps/dashboard/.env` has no `SUPABASE_SERVICE_ROLE_KEY`, so `createSellerUploadUrl` fails and every builder/media-library upload shows "Upload failed"; the key is now listed in `apps/dashboard/.env.example`. **Security note (not changed):** the `sellers` bucket's storage policies let `public` (anon) insert, update and delete any object.
- **Checks:** store-sections (new `header.test.ts` case), store-editor and lib vitest pass; typecheck passes except the stale `.next` types for the deleted domain layout; dashboard `eslint` crashes on its own config (`@typescript-eslint` with ESLint 10). **Not checked:** the uploader in a browser.

### 2026-10-24 — Domain & SEO page crash fix + logo replaces the store name (owner request)

- **Domain page (production):** `/stores/<id>/website/domain` and `/settings/plan` failed to render: the server components `section-group.tsx` and `settings/plan/page.tsx` passed a lucide icon component (`icon={Globe}`) into the `'use client'` `SectionIcon`/`SectionCard` (`components/form/form-ui.tsx`), and a component can't be serialized to a client component. `SectionIcon`/`SectionCard` now also take a rendered icon element (`icon={<Gem />}`), which the server callers pass.
- **Header/footer brand:** with an uploaded logo the logo now replaces the store name (`storeName` option defaults to off, so the seller can turn the name back on). Without a drawn logo (none uploaded, or the logo option off), `drawChrome` drops the design's mark (the boxed initial before the store name), so the brand is the store name alone. All render-time; no migration.
- **Checks:** store-sections (4736), store-editor (138) and dashboard (178) vitest pass, including a new per-template check that no header/footer keeps `storeInitial` without a logo; dashboard `tsc` passes after regenerating the stale `.next` route types; `eslint` still crashes before linting (baseline tooling issue). Not yet checked in a browser on production.

### 2026-10-24 — Add product form UX: typed category/brand, discount switch, expiry picker, stock 12 (owner request)

- **My category / My brand** (`categories-brands/seller-taxonomy-fields.client.tsx`): the two Selects are now comboboxes. The seller picks from their list or types a name; Enter, "Add “…”" or leaving the field selects a matching item (English or Arabic name, case-insensitive) or adds the name to their list through the new `ensureTaxonomyItem` server action (session seller only; reuses `addTaxonomyItem`, so the 300-item limit and unique index still apply; a duplicate race falls back to the existing row). The provider now keeps the lists in state so new items show at once.
- **Discount type:** the native `<select>` (%/EGP) is a segmented radio switch inside the input group (main price and variant rows).
- **Discount expiry:** replaced `DateTimeInput` with quick picks (tomorrow, 3, 7, 14, 30 days, ending 23:59), a full-width date button with calendar and a time field styled like the form inputs, plus an "ends in N days" / past-time hint.
- **Stock:** the add form's default quantity is 12 (was 0). URL/bulk import keeps its own default (25); new variant rows still start at 0.
- **Checks:** dashboard `tsc` and products vitest (51) pass; `eslint` still crashes before linting (baseline tooling issue). Not yet checked in a browser.

### 2026-10-25 — Transactional email library (Claude Design `Emails/*`), sent through Resend (owner request)

- **Templates** (`packages/emails`): a table-based kit (`src/kit/`) built from the Claude Design email library, plus 13 templates. Customer: order confirmation (rewritten, same props + `brand`/`isCashOnDelivery`), shipped, delivered + review, cancelled, refund issued, abandoned cart, welcome/verify, password reset. Seller: new order, order cancelled, wallet top-up, payout sent, low stock, store created. Arabic and English copy in `src/i18n/transactional.ts`. Previews in `emails/*.tsx`; `pnpm --filter @workspace/emails render:previews <dir>` writes static HTML.
- **Store branding:** customer mail for a storefront order (`orders.store_id`, `carts.store_id` for abandoned carts) uses the store's name, logo, PUBLISHED design-system primary/accent colours and font (`apps/backend/src/lib/emails/store-brand.ts`; derived tints, readable text colours, invalid values fall back to Tallaby). Links point at the store host, the sender name is the store and replies go to `sellers.support_email`. Marketplace orders, seller mail and auth mail stay Tallaby-branded.
- **Seller mail** ends with a help line: support email + WhatsApp (`https://wa.me/@tallaby`, `EMAIL_WHATSAPP_URL`).
- **Sending** (`apps/backend/src/routes/emails.ts`): new `/order-event` (placed/shipped/delivered/cancelled), `/refund-issued`, `/store-wallet-top-up`, `/store-created`, `/abandoned-cart`. Each email goes out once through `sendOnce` (`email_deliveries` claim, new `email_type`s, + Resend idempotency key; no migration, `email_type` is free text). Seller per-order mail uses the seller's first `order_items.id` as reference. Callers use the best-effort triggers in `@workspace/lib/orders` (`notify.ts`) after their transaction commits.
- **Hooked into:** `placeOrderFromCart` (seller new order + low stock); Kashier/Paymob pay webhooks (same, once the order leaves `payment_processing`); shipping app `applyShipmentStatus`, dashboard `applySellerShipmentStatus`, admin `updateOrderStatus` (out_for_delivery/shipped → shipped, delivered, cancelled); ecommerce `cancelOrder` (customer cancel + wallet refund mail); Kashier refund webhook (card refund); Kashier store top-up + admin manual top-up approval; `createStoreAction` and both `completeSignup`s; new daily cron `/api/cron/abandoned-carts` (17:00 UTC, carts idle 1–7 days, respects `users.receive_marketing_emails`, stamps `carts.reminder_sent_at`).
- **Where the code differs from the designs:** welcome/verify shows a confirm button, not a 6-digit code (signup confirms by link; no code-entry screen). Low stock uses the dashboard's fixed threshold 10 and alerts only when an order crosses it (no per-product threshold exists). **Payout sent is template-only** — seller payouts are not built (docs/wallet.md §8). Shipment tracking numbers are empty today (provider adapters return null), so the shipped email hides that cell. The delivered email's stars open the order page's review form with that rating preselected (`?review=<item>&rating=<n>`, read in `order-item-review-form.tsx`). `emailPathPrefix` fixed: Arabic (site default, `as-needed`) has no prefix, English gets `/en`.
- **Supabase auth templates:** `confirm-signup.ar.html` and `reset-password.ar.html` are now generated from `src/AuthEmails.tsx` (`pnpm --filter @workspace/emails supabase:auth`); **not yet pasted into the Supabase dashboard** (staging or production).
- **Checks:** `tsc` passes in emails, lib, db, backend, shipping, admin, dashboard; ecommerce `tsc` fails only in the untouched `profile.chunks.tsx` (pre-existing). emails vitest (9) and lib vitest (533) pass; `eslint` still crashes before linting (baseline tooling issue). All 14 previews rendered and checked in a browser (Arabic, Tallaby + sample store brand). Not yet sent through Resend end to end.

### 2026-10-25 — Admin: store shown on pending carts and customers (owner request)

- **Pending carts** (`apps/admin/actions/pending-carts.ts`, `/pending-carts`): each cart now shows its **Store** (`carts.store_id` → `stores`, with the store's active custom domain) through the shared `StoreSiteLink`: the store name links to the admin store page, and the host opens the live storefront. A cart with no store is shown as **Marketplace**. A new **Store** filter (`source=store|marketplace`) was added, search now also matches store name and subdomain, and the quick-view dialog shows the store too.
- **Customers** (`apps/admin/actions/customers-list.ts`, `/customers`): "Came from" was the store of the first order only. It now falls back to the store of the customer's **first cart** when the customer has no orders (guests and sign-ups who only filled a cart), labelled "Cart only, no orders yet". The storefront link uses the active custom domain. The "from stores" stat card still counts buyers only, so its "% of buyers" stays correct. Customers with no orders and no cart cannot be linked to a store, because sign-up does not record the store (a `users` signup-store column would need a migration; not done).
- **No migration.** Read-only check on staging: 63 active carts (7 from a store); 5 customers with no orders now get a store from their cart.
- **Checks:** admin `tsc` passes; admin vitest 108/108; `eslint` still crashes before linting (baseline tooling issue). Not yet checked by hand in the admin UI.

### 2026-10-25 — Tallaby Classic v6: template rules (owner request)

Owner asked to apply `docs/template-rules.md` (still DRAFT v0.1) to Tallaby Classic with a fresh, simple design and a hero carousel inside the container with rounded corners. The request counts as the CLAUDE.md rule 12 approval for Classic.

- **Home** (`packages/store-sections/src/templates/classic/home.ts`), in the §2 order, 7 sections: hero carousel (3 slides on shelf / brand / amber, each a headline, one line, one button and the photo in Classic's white arch; carousel radius 28, 20 on phones; links `/products`, `?sort=newest`, `?sort=popularity`), categories, **best sellers** (new `tallaby-best-sellers`, source `best-sellers`, 8), **offers** (dark banner + `discounted` products, 4; hides with no discounts), new arrivals (4), trust strip (one white strip, was four cards), newsletter. Removed from home: reviews and the blog section (§2: at most one of reviews/newsletter; blog is not in the standard home). Section rhythm 64/40px (§6). Eyebrows no longer uppercase/tracked.
- **Rise on scroll** (§6a): every home section but the hero gets `style.shell.animation = "rise"` (existing CSS-only shell animation, so Firefox shows the page without animation). The IntersectionObserver runtime, the Theme switch and the element Animation group (G7) are **not built**.
- **Footer**: Shop / Help / Policies columns (contact column with placeholder phone and e-mail removed), and **"مدعوم من طلبي / Powered by Tallaby"** linking to `https://tallaby.com`. **G2 done**: `footerCreditsTallaby(footer)` (`config/header.ts`) and `StorefrontShell` skips `ByTallabyBadge` when the published footer links to tallaby.com. Header: announcement copy only.
- **G5 (part)**: `src/templates/template-rules.test.ts` checks Classic against §2, §3, §4.1/4.3 (Powered by), §5 and §6a. Bottom navigation (G1), brands (G3) and the offers catalog filter (G4) are **not built**; offer buttons go to `/products` until G4.
- **Migration `0104_classic_template_rules.sql`**: Classic v6 as a new current version, guarded on "no admin draft and the current version is 0102's 'product page'". Dry run on staging inside `BEGIN … ROLLBACK`: guard matched (v5 → v6, 7 pages, 7 home sections). **Applied on staging and production 2026-10-25** (owner request; both were at v5 `product page`, now v6 with 7 home sections). Existing stores' sites are untouched; new stores and "Use template" get v6.
- **Checks:** store-sections `tsc` passes, vitest 43 files / 4742 tests pass. ecommerce `tsc` only shows the existing errors in `profile/_components/profile.chunks.tsx` (untouched). Looked at it by eye through `/template-preview/tallaby-classic` (code config, local only) at 1366px and in a 375px frame; the slides 2 and 3 and the carousel dots were not checked in a browser (dev hot reload is blocked from 127.0.0.1, so the carousel script did not run).

### 2026-10-25 — Footers show the store's real payment methods (owner request)

Every footer's payment chips ("VISA", "Mastercard", "Meeza", "InstaPay", "الدفع عند الاستلام"…) were fixed text. They now show the methods the store's checkout really offers.

- **Renderer** (`packages/store-sections/src/elements/render.tsx`, `store-payments.ts`): a `role: "payments"` row draws one chip per method from `ctx.store.paymentMethods`, each a copy of the row's first chip (same node id, so the scoped style applies), named in the page language (cash on delivery, InstaPay, Vodafone Cash, e& Cash). No data from the host: the row stays as authored. A store with no methods: no row publicly, the demo stays in the editor. A test checks that the payment chips of all 112 code template footers sit in a `payments` row (412 chips), so DB copies and published sites made from them are covered with no migration.
- **Hosts**: the storefront profile (`lib/storefront.server.ts`, cache key `storefront-v11`) and the dashboard/admin editors and Website › Design read `stores.settings.payments` through the new `storeProfilePaymentMethods` (`@workspace/lib/payments/store-methods`), the same list as storefront checkout (`storefrontCheckoutMethods`): cash on delivery alone by default. The template preview shows cash on delivery only (what a new store gets). Saving a payment method now also clears the storefront cache (`invalidateStorefront`), so the footer changes at once.
- **Checks:** store-sections 44 files / 4747 tests; lib payments 18; ecommerce lib 161; `tsc` clean for store-sections, lib, dashboard and admin; ecommerce only the existing `profile.chunks.tsx` errors. Classic footer checked by eye in the template preview (staging DB): one "الدفع عند الاستلام" chip.

### 2026-10-25 — Supabase egress audit and fixes (branch `perf/supabase-egress`)

Free Plan (5 GB uncached egress per month, staging + production) used 12 GB this cycle. Findings, method and per-item estimates are in `docs/egress-audit.md`.

- **Measured** (read-only `pg_stat_statements` + `octet_length` of the heavy columns on both projects): the template gallery queries returned ~102 rows × (95 KB `template_versions.config` + 5.6 KB `meta`) ≈ 10 MB per call. tallaby.com gallery 877 calls ≈ 9 GB, dashboard/admin `listStoreTemplates` (uncached) ≈ 1.6 GB, staging ≈ 0.4 GB: about 11 of the 12 GB, nearly all since templates 49–110 were seeded (0090, 0095). The cached gallery refilled ~440 times a day because every ecommerce sign-in ran `revalidatePath("/", "layout")`, which purges the whole Data Cache (Next 16 docs, `revalidatePath.md`). Production stats were last reset 2025-09-05, so call counts span 13 months.
- **Fixed** (one commit each): EG-01 … EG-07 in §22. Expected effect: the template gallery drops from ~10 MB × hundreds of refills a day to ~10 MB × (deploys + admin template publishes), which alone brings usage back under the 5 GB quota; the other fixes are each well under 1 GB a month (estimates in the audit).
- **Where the code differed from the plan:** `getStoreSiteStatus` (editor "unpublished changes") still reads the snapshot and drafts. A timestamp shortcut is unsafe because `updated_at` is set by hand and not by every writer; it needs triggers (migration, owner approval). Product-page reviews are not limited (the page lists them all). `pending-carts.client.tsx` and the store logo `<img>` in `render.tsx` were left alone because another session has uncommitted edits in them.
- **Not done (owner approval):** robots.txt changes, `pg_stat_statements_reset()`, `getClaims()`, the API/edge/storage logs (Supabase MCP not authorized in the session).
- **Checks:** `tsc` passes for lib, cache, store-editor, dashboard and admin; ecommerce only the existing `profile.chunks.tsx` errors. vitest: lib 533, cache 40, store-editor 138, dashboard 178, admin 108, ecommerce 183, all pass. `eslint` still crashes before linting in every app (baseline tooling issue). The grouped admin category counts and the SQL `countMediaUsage` were compared with the old logic on staging and production data (read-only): no differences. Not yet checked by hand in a browser.

### 2026-10-25 — Migration status check, `0103` applied on staging

Owner asked to apply `0104` and any missing migrations to staging and production. There is no tracking table for the hand-written migrations, so each was checked by its effect (read-only):

| Migration | Staging | Production |
|---|---|---|
| `0093` `store_shipping_zones.places` (old governorates check dropped) | applied | applied (docs said staging only) |
| `0094`–`0102` (library sections, 111 templates, notifications, `heard_about_us`, `store_pages.kind`, product-page sections, product pages) | applied | applied |
| `0103` `product_translations.meta_keywords` | **was missing, applied 2026-10-25** (192 rows, all `'{}'`) | already applied (docs said not applied) |
| `0104` Tallaby Classic v6 | applied (current version v6) | applied (current version v6) |

- `0104` was not re-run: its guard (current version `product page`) no longer matches on either project, so a re-run would be a no-op. Production's Classic now has an admin draft (`draft_config` set); staging's does not.
- Column definitions of `meta_keywords` match on both (`text[] NOT NULL DEFAULT '{}'`). CLAUDE.md rule 6 updated.
### 2026-10-25 — Templates as section refs (owner request)

Owner asked that templates be "just section ids with data" until a seller applies one, so an edit of a library section improves every template that uses it.

- **Format** (`packages/store-sections/src/config/schema.ts`, `templates/library-ref.ts`): a template section may be `libraryRef: { key, patch }` with no `componentTree`. `key` is the `library_sections` key; `patch` is the template's photos (`photo`/`person` by slot index), copy swaps (`text`, Arabic → both languages), `links`, `lists`, per-layer `nodes` patches, `form` and `corners`, i.e. exactly what `fromLibrary` takes. The template's own designs (Classic, Atelier, Essentials…) stay inline.
- **One patch implementation**: `fromLibrary` now builds its tree as `applyLibraryPatch(designSlotTree(design), patch, { strict: true })`, and stored refs go through the same function (lenient: a copy/link/layer the library no longer has is skipped and reported, a slot with no template photo gets the industry stock photo). All 111 code templates build byte-identical JSON before and after this refactor.
- **Reads** (`packages/lib/src/store-sites/template-refs.server.ts`): `expandTemplateConfig(s)` builds refs from the published `library_sections.tree` (hidden and soft-deleted rows still count; a missing row falls back to the code design), one query per call. Used by `loadDefaultTemplate`, `getPublicTemplate`, `listTemplateCards`, `loadOfferedTemplateConfig`, `applyStoreTemplate`, the product-page backfill, the tallaby.com gallery and the Template Studio. A store's drafts always get built trees, so later library edits never change a seller's site.
- **Template Studio**: opens with refs built and kept on each section; a save stores a section that is still exactly what its ref builds (after the sanitizer) as the ref again, and an edited one as its own tree without the ref (it stops following the library).
- **Cache**: `invalidateLibrarySections()` now also purges `templateTags.catalog()`.
- **Seeds**: `templateConfigJson` (the `template:sql` generator) writes refs. Stored size of all 111 code templates: ~9.8 MB → ~1.4 MB (Zaki ~95 KB → 13 KB), which also helps the egress audit above.
- **Existing DB templates** are converted by `pnpm --filter @workspace/lib backfill:template-refs` (dry run by default, `--apply` writes): a new current version per template where only sections that are exact copies of their seed become refs; sections an admin edited stay as they are; templates with an admin draft are skipped; verified before each write. No SQL migration. **Deploy the code first** (an older app renders a ref section as empty). Rollback: make the previous version current. **Not run anywhere yet.** After it runs, templates pick up any library edits admins have already published.
- **Checks:** `tsc` passes for store-sections, lib, admin and dashboard; ecommerce only the existing `profile.chunks.tsx` errors. vitest: store-sections 4754 pass, with 1 failure that also fails on the base commit (`render/boundaries.test.ts`, `carousel-runtime.client.tsx`); lib 533, cache 40, admin 108 pass. New `templates/library-ref.test.ts` (every code template round-trips; a library edit reaches the template; lenient misses; Studio compaction; seed conversion). `eslint` still crashes before linting (baseline). Not checked by hand in the UI.

### 2026-10-26 — Templates as a library key plus named-field props; admin edits templates section by section (owner request)

Owner asked that templates take "the section id and data as props only, not full JSON of the sections", and that opening a template in Admin show its sections one by one so the admin edits each section (not the template as a whole). Owner decisions: named fields; a section edit changes this template's values only (structure stays in Admin › Sections); the screen also keeps add/remove/reorder sections, colours/fonts/radius and pages; Classic and Atelier move into the library with no visual change.

- **Field names (TR-03)** (`packages/store-sections/src/templates/library-fields.ts`): every library tree node carries `props.field` (`heading`, `text-2`, `image`, `cta`…), from its role or type, in tree order. `assignFieldNames` is idempotent: it keeps unique names and renames the later copy of a duplicate. `alignFieldNames` copies the code design's names onto a DB tree where type and place still match. Names are inert (`field` is in `NOT_COPY`, nothing renders it) and built template sections drop them. They are assigned in: the seed (`section-seed.ts`, `codeLibraryTree`), library save (`prepareLibraryTree`), the section editor loader and `loadLibraryTrees`. `backfill:library-fields` (`packages/lib/src/admin/backfill-library-fields.server.ts`, dry run by default) stores them in existing rows, with no version bump. A snapshot test (`library-fields.test.ts`) guards code designs against renamed fields.
- **Ref format (TR-04)** (`config/schema.ts` `libraryRefSchema`): `{ key, props?, styles?, form?, corners?, plain?, patch? }`.
  - `props["<field>"]` sets the node's main prop (`PRIMARY_PROP`: a heading's text, an image's src, a button's label). `props["<field>.<prop>"]` sets another prop (`cta.href`, `image.alt`, `products.limit`).
  - Copy values are `{ ar, en }` or one string; `null` removes a prop. `role`/`bind`/`translations`/`field`/`formTemplate` are refused.
  - `styles` per field replaces `patch.nodes`. `patch` (TR-01) is read-only and is never mixed with `props`.
  - `applyLibraryProps` follows the same steps, in the same order, as `applyLibraryPatch`. `applyLibraryRef` dispatches between the two, so `resolveTemplateRefs`/`compactTemplateConfig`/`expandTemplateConfig` read both forms.
  - **Code templates keep their authoring code** (`fromLibrary` Arabic-keyed patches, strict). `libraryValuesFromTree` turns each built section into values and checks they rebuild exactly; `designRef` (memoized) feeds `templateRefConfig`/`storedTemplateRefConfig`.
  - Result: all 2139 sections of the 111 code templates are props refs, none stays a tree, and none uses `patch`. Total config size is ~1.2 MB (Ahlam's hero, for example, is the key plus 9 values).
- **Classic and Atelier (TR-05)**: `TEMPLATE_OWN_DESIGNS` (47 designs) are library sections keyed by their design ids. `0105_template_library_sections.sql` (generated with `section:sql --new-only`, which now also writes them `is_hidden`, sort order 10000+) is insert-only. Their refs are `{ key, plain: true }` (no accent or role adaptation). The round-trip test shows no visual change.
- **Backfill**: `backfill:template-refs` now writes named-field refs (patch refs are rebuilt and converted too, via `resolveTemplateRefs(..., { patchOnly: true })`). Changelog: "library sections as named-field refs". TR-02 (patch form) never ran and is superseded.
- **Admin screen (TR-06)** (`apps/admin/app/(builder)/templates/[id]/editor/`):
  - `page.tsx` loads `getTemplateForSections` (`packages/lib/src/admin/templates-sections-admin.server.ts`): the stored form, with exact seed copies converted to refs in memory, plus the named library rows. It also loads `listTemplateLibraryEntries`.
  - `template-sections.client.tsx` lays out the screen:
    - **Left:** page select, then header, the page's sections and footer. Each row offers select, move up/down, remove and replace (header/footer); "Add section" opens a library picker filtered by category.
    - **Centre:** `SitePreview` built client-side with `resolveTemplateRefs` (new lean exports `@workspace/store-sections/library-ref` and `/library-fields`), with AR/EN and desktop/phone switches.
    - **Right:** `section-props-form.client.tsx`, with copy fields in ar and en, photo upload to `library-media`, links, product lists, videos and a reset per field. Fields inside data cards are hidden. Saved values the library section no longer has show as a warning with "Drop them".
    - **Panels:** colours & fonts and pages (`template-settings.client.tsx`).
  - Changes are pure (`template-sections.lib.ts`: `applySectionChange` plus the existing `applyEditorChange`). Autosave (800 ms debounce, one at a time) goes through the existing `saveTemplateDraftAction` (optimistic `draft_version`; ref-only sections pass compaction unchanged). Publish and Versions/Restore reuse the existing actions. `templateLibraryRowAction` loads a row on add.
  - Sections that are not refs (admin-edited trees) are labelled "custom" and can be moved, removed or replaced.
  - The old full builder is at `editor/advanced` (unlinked, one release).
- **Where the code differed from the plan:**
  - Design and Pages are small admin panels, not store-editor's `BrandPanel`/`PagesPanel` (those need the editor store and context).
  - The screen works on the stored form and builds previews client-side instead of sending built trees.
  - `designSlotTree` itself stays unnamed. Names are added by `codeLibraryTree` and the seed, so the code templates' own trees are unchanged.
  - Admin strings are English like the rest of the admin app.
- **Checks:**
  - `tsc` passes for store-sections, lib, admin and dashboard. ecommerce has only the existing `profile.chunks.tsx` errors.
  - vitest: all 10 packages pass (store-sections 46 files, lib 46 plus 33 skipped (DB), admin 19, dashboard 27, store-editor 25, ecommerce 22).
  - `eslint` still crashes on load (`@typescript-eslint` against ESLint 10), as before.
  - No manual E2E yet.
- **Rollout (TR-07, done 2026-10-26, owner request "merge all edits to supabase staging and production, and merge with main"):**
  1. Merged into `main` (`9b666a11`, together with TR-01 `c2cff511`) and pushed. The five Vercel production deployments of `9b666a11` completed before any template was converted.
  2. `0105` on staging; on production a dry run in a rolled-back transaction, then applied. Both have 47 hidden rows at version 1.
  3. `backfill:library-fields --apply`: staging and production each named 272 rows (the 47 from 0105 were already named). A re-run names 0.
  4. `backfill:template-refs`:
     - Staging converted 111 templates (10.2 MB → 1.7 MB of config; 2049 of 2139 sections as refs; the other 90 no longer match their seed and stay trees).
     - Production converted 109 (10.0 MB → 1.7 MB). **Tallaby Classic and Souq were skipped: they have admin drafts** (TR-08).
     - A re-run converts 0.
  5. Check, on both: each converted template's new version, built the way readers build it (`expandTemplateConfig`, DB library rows), equals its previous version, for 111 of 111 (staging) and 109 of 109 (production). The only difference is that the `product-main` library rows (seeded 0101) lack the buy box's `variant: "solid"`, which is the renderer's default, so nothing changes visually.
  6. The template catalog cache was not broadcast (no `REVALIDATE_SECRET`/`ECOMMERCE_URL` in the shell); it clears by TTL, and the content is the same.
  7. Not done yet: a manual E2E of the new screen, and removing `editor/advanced` (TR-08).

**2026-10-26: Add product form refactor (Shopify-style, Claude Design "Seller Add Product v3"), branch `ccr-a4222c47-bv1upn` (owner request, no migration):**
  1. Order: Basics (name + slug, rich-text description, photos, category), Price, then four collapsible sections with a one-line summary (highlights + short description, inventory & variants, shipping, promotion & SEO). A collapsed section opens itself on an error and when the checklist/chips scroll to it (`OPEN_SECTION_EVENT` in `add-product.lib.ts`). The separate Photos card is gone (merged into Basics).
  2. Category: one box (`category-field.tsx`, ranking in `category-search.lib.ts`). It lists the store's categories (`seller_product_categories`) first, then Tallaby's (suggested from the product name when empty), or "Add «…»" for a new name (form field `sellerCategoryName`, never sent to createProduct). On save, `ensureTaxonomyItem` finds or adds the store category: by name, or by `sourceId` for a Tallaby pick, so the store list grows with the categories in use. `products.category_id` stays required: a store/new category with no Tallaby source is matched to the closest Tallaby category (editable under "Tallaby marketplace section"). The box opens as a bottom sheet on phones. Bulk import shows Tallaby categories only (`WithoutSellerTaxonomy`).
  3. Brand: the brand input, the "My category / My brand" fields and the Products › Brands page are gone (`/products/brands` redirects to Categories; sidebar and route list updated). Existing `brand_id` / `seller_brand_id` values are kept on edit, not cleared.
  4. Price: product price plus a Discount switch; on, a sale price (`price.final`) with a "خصم N%" badge. The discount is stored as an amount off. The schema now rejects a sale price above the price (`product.salePriceBelowPrice`). The discount end date only shows when the product already has one.
  5. SEO: meta title/description fill from the name and the short description (else the description text), clipped at 60/160 characters at a word break, marked "Auto"; once the seller edits one it stays theirs ("Restore automatic"). Submit applies the same fallback (`autoMetaTitle` / `autoMetaDescription` in `prepare-product-submit.lib.ts`).
  6. Checks: `pnpm --filter dashboard typecheck` passes; `pnpm --filter dashboard test` 28 files / 186 tests pass, plus the new `category-search.lib.test.ts` (6). `pnpm lint` crashes inside ESLint 10.9.1 / `@typescript-eslint/utils` ("Class extends value undefined"), a tooling problem not caused by this change. **Not done:** a manual E2E in the browser (the Chrome extension was not connected, and `apps/dashboard/.env` does not point at staging).


### 2026-10-26 — Old template versions deleted (owner request)

Owner asked to keep only the current version of each template in `template_versions`.

- Before deleting, each project's old rows were exported to a CSV in the session scratchpad (temporary). That export is the only rollback.
- Ran `DELETE FROM template_versions v USING templates t WHERE t.id = v.template_id AND v.id <> t.current_version_id` in one transaction per project:
  - staging: 377 → 111 rows
  - production: 375 → 111 rows (about 8 MB of configs)
- Afterwards every template still has its current version.
- **Effects:**
  - `template_installs.template_version_id` is `ON DELETE SET NULL`. On production 11 of 13 installs now have it null. Nothing reads that column, so "Undo template change" still works (it restores `previous_draft`).
  - The admin "Versions" list now shows only the current version, so the named-field conversion can no longer be rolled back by restoring a version.
  - Production Classic and Souq keep their current (full-tree) version and their admin drafts.
  - New publishes continue numbering from the current version.
  7. Same day, follow-ups (owner):
     - **Short description is rich text** and sits under the name in Basics; it is the "Description" accordion on the product page (marketplace `product-details.tsx` and the store website's `productDetails` element). The detailed description (`content`) stays rich text in "Detailed description & highlights". `product_translations.description` now holds HTML for new saves and plain text for older products; `@workspace/tiptap/plain-text` (`richTextToPlainText`, `plainTextToRichText`, `isRichTextHtml`) reads both. `mergeProductWithTranslation` returns `description` as plain text (meta tags, structured data, share text, Meta catalog feed, order snapshot, Excel export) plus a server-sanitised `descriptionHtml`; `ProductDetail.descriptionHtml` is the store-website equivalent (the boundaries test allows exactly that second `dangerouslySetInnerHTML`).
     - **No price rounding anywhere** (owner chose "everywhere"): `roundPriceUpToNearestFive` became `normalizePrice` (kept to the piastre) in `packages/lib/src/utils/round-price.ts`, so `parsePriceJson` (storefront, cart snapshot, checkout), the dashboard/admin save actions, the form and the Shopify import keep the price as typed. Prices already stored rounded don't change; any older unrounded row now shows and charges its real price. The rounding hint and "you receive" line under the price are gone. Shipping-fee rounding (`shipping.lib`) is unchanged.
     - Weight is optional (schema, checklist, shipping summary). The fulfillment-method choice is commented out in `shipping-section.tsx` (every seller handles their own delivery; products keep `seller_fulfilled`).
     - The "customer preview" card (`product-preview.tsx`) is removed.
     - Product link: the host is a fixed prefix and only the slug is edited (spaces become dashes as you type; Enter saves, Esc cancels). A product that already has a link keeps it when renamed; "From product name" regenerates it.
     - The "Tallaby marketplace section" picker is removed from the category box: a store/new category is matched silently to the closest Tallaby category, else a catch-all one ("Other"/"أخرى"…, else the first leaf), because `products.category_id` is still NOT NULL. Making it nullable needs a migration (not done).
     - Arabic wording: "التصنيفات" → "الفئات" in the sidebar, the Categories page and the help FAQ (which no longer mentions the removed Brands page).
     - Checks: dashboard, ecommerce, admin, `packages/lib` and `packages/store-sections` typecheck clean except 16 existing errors in `apps/ecommerce/.../profile.chunks.tsx` (untouched); tests pass (dashboard 191, ecommerce 183, admin 117, lib 532, store-sections 4773; one store-sections header test timed out under the full run and passes alone). Manual E2E still not done.

### 2026-10-26 — Powered by Tallaby in every footer, product page fixes (owner request)

- The floating "By Tallaby" badge is removed. `drawChrome` (`packages/store-sections/src/config/header.ts`) now draws «مدعوم من **طلبي**» / "Powered by **Tallaby**" in every footer tree, with "Tallaby" underlined and linking to https://tallaby.com, beside the copyright line (`role: "copyright"` or a text containing ©/حقوق/rights reserved). If there is no copyright line, it goes in its own centered row at the end of the footer. It is never saved, so the builder cannot remove it. A credit the tree carries itself (any tallaby.com link or `role: "poweredBy"`, e.g. Classic v6) is dropped so it shows once. The default footer, footers that are not trees and sites without a footer get `PoweredByTallaby` (`storefront.poweredBy` in both message files). Template rules §4.3 and G2 are updated, and open question 2 is answered: the credit can't be removed.
- Store product page: the mobile sticky buy bar (quantity, Add to cart, Buy now) is portaled to the site root (`SiteDock` in `product-hooks.client.tsx`). Before, it sat inside its section's `relative isolate` stacking context, so later sections painted over it. Larger screens keep the inline buttons.
- `ProductTabs`: the reviews block is hidden when the product has no reviews. With no questions, only the "هل لديك سؤال؟" ask box is shown.
- Checks: store-sections 4885, store-editor 138 and ecommerce 183 tests pass (new drawChrome credit tests, including one per code template). Typecheck: store-sections and store-editor pass; ecommerce fails only in the existing `profile.chunks.tsx` react-hook-form errors. Lint: still the pre-existing ESLint 10.9.1 crash. Manual E2E not run yet.
  8. Later the same day: the link line shows only once the product has a name; the header's import icon is gone (the Basics card keeps "Import from link"); the page header has no max width and uses the form's side padding; the meta title/description length bars show only once the field has text. **Name and short description are required in one language, Arabic or English** (was: English name required): Basics counts 4 items (name, short description, photos, category); the link comes from the English name, else the Arabic one in Latin letters (slugify); on save a missing English version takes the Arabic text (`prepareProductForSubmit`), so the English store never shows "Untitled". Side effect: saving an older product, or a bulk import, without a short description now asks for one.

### 2026-10-26 — Seller products page: card grid (Claude Design `Seller Dashboard/Seller Products.html`)

- `/products` opens as a card grid; a grid/table switch (saved in `localStorage` `tl-prod-view`) brings back the table. No page title (the header already has it). Status tabs with counts (All, Published, Draft, Low stock under 10, Out of stock), search by name or SKU, category and sort selects, Import/Export and Add product in the tab row. Cards show image, discount badge, stock badge, category, name, price (sale + struck base), Published/Draft switch, Edit and a more menu; selection gives a bulk bar (publish, draft, delete). Filtering runs in memory (`products/_components/products-view.lib.ts`, tested); export uses the filtered list. The table gains a Discount column and the stock badge; its own search box is hidden (`TableSection` `hideSearch`).
- Shared UI: `Switch` has `size="sm"`; the `Toaster` in every app is bottom-centre, dark (#1f2a2e) with white text, no close button (the dashboard and shipping position overrides are gone).
- Checks: dashboard typecheck passes; dashboard tests 201/201. Lint still crashes (pre-existing). Not checked in a browser yet (extension not connected).
- Same day: product names, descriptions (export) and categories on `/products` follow the dashboard language (ar/en), falling back to the other one. Every `(main)` page gets `pb-24` so the floating WhatsApp button never covers the end of the page (`components/dashboard/support-fab.lib.ts`, tested; add/edit product keep their own bar padding, marketing pads from lg; the builder has no button). Shared `--border`/`--input`/`--sidebar-border` now match the design (`#e7e9e8`/`#d9dddc`, dark `#22343b`/`#2c434b`), replacing the rose `#e2cbcb`: this changes the marketplace, admin and shipping; seller storefronts set their own border from the store theme. Dashboard tests 203/203.

### 2026-10-26 — Seller wallet page: inline top-up (Claude Design `Seller Dashboard/Seller Wallet.html`)

- `/wallet` has no page title (the header breadcrumb names it), a line about the flat fee, the balance card, and the fee card, which now has a runway bar ("covers about N orders" = balance ÷ EGP 5, full at 200). The amount is chosen **on the page**: presets 100/250/500 ("most chosen")/1000/2000, each showing about how many orders it covers, a typed amount with ±50 steppers (kept within 100–20,000), live limit errors, the methods line, and a summary column (amount, free fee, you transfer, balance after, Top up now, trust lines). Below lg the column is hidden and a fixed bottom bar (flush at bottom-0, no safe-area padding, owner) carries the amount and the button; the WhatsApp button moves above it there (`support-fab.lib.ts`).
- The dialog steps are now Method → Transfer → Receipt → done (the amount step left the dialog; "Change amount" closes it and focuses the field). The sender label depends on the method; the receipt step shows a recap (amount, method, from) and a "picture must show the amount and date" note; Submit stays disabled until a picture is chosen. `/wallet?topup=1` still opens the dialog (at Method, EGP 250). The submit path (upload to the private bucket, `submitManualTopUp`, admin approval) is unchanged, so are the requests list and the ledger.
- `TopUpButton` → `TopUpPanel` (`wallet/top-up.client.tsx`); helpers in `wallet/store-wallet.lib.ts` (tested). Strings: `storeWallet.pageDescription|runway`, `manualTopUp.panel.*|changeAmount|cancel|recap.*`, `methods.*.sender`, `receipt.clarity`, `steps.method`; removed `amountLabel`, `senderLabel`, `receipt.reviewNote`, `steps.amount`.
- Checks: dashboard typecheck passes; dashboard tests 207/207. Lint still crashes (pre-existing). Not checked in a browser yet.

### 2026-10-26 — Seller orders page: sellers ship their own orders (owner request)

- `/orders` lists **one row per order** (was one per line item), carrying only the seller's lines: number + date, customer + area, item thumbnails, **order total** (`orders.total_amount`) + payment method, a stage badge and the next-step button. Work-queue tabs with counts: All, To confirm, To ship, Out for delivery (incl. failed attempts), Delivered, Cancelled & returned; opens on To confirm when there are new orders. Search matches order number, customer name or phone. Channel chips stay.
- The order panel no longer fetches (`getOrderDetails` is unused now): progress track Placed → Confirmed → Out for delivery → Delivered (failed attempt shown on step 3; cancelled/returned/refund show a note), the actions, Call/WhatsApp/Maps for the customer, items, payment method/status and the order total. **"Your items total" and "Your earnings" are gone** (owner: show the order total only).
- Item links go to the product page on the **store the order was placed on** (active custom domain, else subdomain, via `storeUrl`); marketplace orders use the first of the seller's stores that shows the product (`loadProductStoreLinks`), tallaby.com only when none does.
- Status changes without a rider (`orders/order-flow.lib.ts`, tested; `orders/orders.server.ts` `updateSellerOrder`, re-checks the flow server-side from the stored order): Confirm (pending COD → confirmed), Mark out for delivery, Mark delivered, Delivery failed (reason), Mark returned, Send out again, Cancel. Shipment moves go through `applySellerShipmentStatus`, which now creates the seller's `carrier: "seller"` shipment inside its own transaction when none exists (so no half-made `pending` shipment sits in apps/shipping's Confirmed tab). Delivered keeps the existing fee/affiliate/email hooks; no money logic changed.
- Cancel (new path): only before the order leaves and **only when nothing was prepaid** (payment not paid/collected and no wallet `order_payment` debit); restocks the lines, cancels pending affiliate commission, invalidates product inventory caches, emails the customer. Prepaid orders show "contact Tallaby support" (refunds stay with Tallaby). View-only: multi-seller orders, platform-fulfilled lines, shipments owned by Tallaby, digital orders.
- Riders stay optional: `/orders/delivery` is unchanged and linked from the panel ("Assign one of your riders instead").
- Not changed / open: the delivery workspace's own cancel/return still doesn't restock (pre-existing); seller "Mark delivered" doesn't record a COD collection (`payments` row / `collected`), same as before; apps/shipping still lists every order (P8-02).
- Strings: `orders.subtitle|tabs.*|stage.*|empty.*|progress.*|actions.*|notes.*|errors.*`, `orders.table.items|next|moreItems|qty`, `orders.details.placedOn|lastAttempt|useRider|riderAssigned|sku|payment|call|whatsapp|whatsappText|openMap`; removed `orders.details.placed|loading|loadFailed|unavailable|yourItemsTotal|yourEarnings`.
- Checks: dashboard typecheck passes; dashboard tests 218/218. Lint still crashes (pre-existing). List query run read-only on staging. Not checked in a browser (the dashboard `.env` is not staging); manual E2E on staging still to do: confirm → out for delivery → delivered on a COD store order, cancel a COD order (stock back), a prepaid order shows no cancel.
