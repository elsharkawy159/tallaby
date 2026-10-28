# Tallaby Seller Features — Roadmap

> **Status:** Created 2026-10-28. No roadmap feature is started yet. The owner will add more feature requests in chat; each one is added here (§5 intake, then a feature in §4).
> **Scope:** New **seller features** only, mostly in the seller dashboard (`apps/dashboard`) and the store website (`apps/ecommerce` storefront). Platform work (multi-store, builder, templates, fees, wallets, admin) stays in [`PLAN.md`](PLAN.md).
> **Authority:** [`CLAUDE.md`](CLAUDE.md) durable rules apply to every task here (tenant isolation, money, migrations, i18n, caching, verification). `PLAN.md` §13 (business model) is never changed from this file.
> **Companion docs:** [`PROJECT.md`](PROJECT.md), [`PROJECT_DESCRIPTION.md`](PROJECT_DESCRIPTION.md), [`PLAN.md`](PLAN.md), [`docs/wallet.md`](docs/wallet.md), [`docs/fulfillment.md`](docs/fulfillment.md).

**Labels:**

| Label | Meaning |
|---|---|
| **[Live]** | Built and on `main` (with a file path). |
| **[Planned]** | In this roadmap, not built. |
| **[In progress]** | A session is working on it (say which branch). |
| **[Needs approval]** | Touches money, checkout, the ledger, the business model or a destructive migration. Ask the owner first (CLAUDE.md rule 4). |

**Priority:** **P0** = do next, highest seller impact · **P1** = soon · **P2** = later · **P3** = idea, not scheduled.

---

## 0. Rules for sessions working on this roadmap (read first)

1. Read `CLAUDE.md`, then this file, then the feature you are working on. Check the code before trusting any status here (CLAUDE.md rule 1).
2. Work top-down by priority (§3 order) unless the owner names a feature. Respect each task's `deps`.
3. **Keep this file up to date — it is part of every task:**
   - When you start a task: mark it `[~]` in §6 with the date and branch.
   - When you finish a task: mark it `[x]` with the date and commit, update the feature's **Status** line in §4, and add a dated entry to §7 (what was built, migrations, verification, anything that differed from the plan).
   - When something blocks a task: write the blocker under the task and in §7.
   - When the owner asks for a new feature: add it to §5 (intake) the same turn, then turn it into a §4 feature with tasks and place it in the §3 priority order.
   - Move a feature in §2 (inventory) from "missing" to "live" when it ships.
4. **Migrations:** hand-written, idempotent SQL in `packages/db/migrations/NNNN_name.sql`, mirrored in `packages/db/src/drizzle/schema.ts` and `relations.ts`. Check the next free number in `CLAUDE.md` rule 6 and in `packages/db/migrations/` (at 2026-10-28 the next is **`0115`**). New server-only tables: RLS on, no policies. Record every new migration in CLAUDE.md rule 6 and here. Apply to staging first; production only with owner approval. Never run `drizzle-kit generate`.
5. Every store-scoped table has `store_id` (and a check that the store belongs to the session seller). Every new string goes in both `ar.json` and `en.json` (Arabic first). Use the feature file split (`*.server.ts`, `*.data.tsx`, `*.client.tsx`, `*.dto.ts`, `*.types.ts`, `*.lib.ts`).
6. Verify each task with `pnpm lint`, `pnpm typecheck`, `pnpm test` (or `--filter`), and record manual E2E checks in §7.
7. All work happens on `main` in the main worktree (owner, 2026-10-28), unless the owner says otherwise.

---

## 1. Summary

Tallaby already gives Egyptian sellers a full store: products, orders, delivery (Tallaby, own riders, Bosta), a visual builder with 100+ templates, coupons, ads, wallets, analytics apps and AI product autofill. The biggest gaps against **Shopify** and **EasyOrders** (the Egyptian COD-first platform) are on the **order and customer side**: there is no customers list, no fake-order protection, no way for a seller to see and recover unfinished checkouts, no manual (phone/WhatsApp) orders, no invoices, and no upsell/quantity offers. These hit sales directly for COD sellers, so they lead the roadmap. Staff accounts, more carriers, product feeds and automation follow.

---

## 2. Current seller features (inventory, checked in code 2026-10-28)

### 2.1 Live

| Area | What sellers have today | Where |
|---|---|---|
| Account & stores | Signup (email/Google), up to 3 stores on Free, store switcher, plan & usage page, heard-about-us | `app/signup`, `app/(main)/stores`, `settings/plan` |
| Products | Add/edit physical & digital products, variants, images, Excel import, import from URL, seller categories & brands, social proof (seller-added reviews, live views) | `app/(main)/products/**` |
| AI | Add/Edit product with AI (photos, PDF, text → both languages, SEO), daily cap, AI usage tab | `products/add/ai`, `packages/ai` |
| Store catalog | Choose which products each store shows | `stores/[storeId]/catalog` |
| Orders | Order list, stages, order details, WhatsApp/call buttons, Bosta ship + bulk ship | `app/(main)/orders/**` |
| Delivery | Delivery tracking, own riders, store shipping zones (places, free-over, COD per zone), Tallaby delivery, Bosta app | `orders/delivery`, `orders/riders`, `stores/[storeId]/shipping` |
| Payments | COD + per-store wallet payments (Vodafone Cash, InstaPay …, seller confirms) | `stores/[storeId]/settings/payments` |
| Money | Store wallet (can go negative), top-ups, account statements, reports, flat EGP 5 fee per delivered order, 7-day trial | `wallet`, `financial`, `reports` |
| Marketing | Coupons (marketplace/store, product picker, store pop-up with trigger + countdown), paid ad packages, reviews & Q&A | `coupons`, `marketing`, `reviews` |
| Website | Builder (element trees), 100+ templates, design system, pages, product page template, blog, forms + submissions, media library, domain & SEO, sitemap, social links, offline/publish | `app/(builder)`, `stores/[storeId]/website/**` |
| Apps | Meta Pixel, Meta CAPI, GA4, GTM, TikTok Pixel, Snapchat Pixel, Google Sheets order export, Shopify import, Bosta | `stores/[storeId]/apps` |
| Analytics | Store views (GA4 via Tallaby GTM) | `stores/[storeId]/analytics`, `docs/store-views.md` |
| Notifications | Seller notification inbox (orders, top-ups, questions, reviews) | `seller_notifications` (0098) |
| Fulfillment | Request Tallaby fulfillment services | `settings/fulfillment` |
| Help | Help center, floating WhatsApp support, install-as-app button | `help`, `components/layout` |

### 2.2 Missing (compared with Shopify and EasyOrders)

| Feature | Shopify | EasyOrders | Tallaby |
|---|---|---|---|
| Customers list / CRM, segments | Yes | Partial | **No** |
| Fake-order blocker (phone/IP blocklist) | Via apps | **Yes, core** | **No** |
| Abandoned checkout recovery (seller-visible) | Yes | Yes (leads) | Marketplace email cron only (`apps/ecommerce/app/api/cron/abandoned-carts`), no seller view |
| Manual / draft orders | Yes | Yes | **No** |
| Invoices & packing slips | Yes | Yes | **No** |
| Order export / bulk status | Yes | Yes | Google Sheets app only |
| Upsell, cross-sell, downsell, quantity offers | Apps / bundles | **Yes, core** | **No** |
| Automatic discounts (BXGY, free shipping) | Yes | Partial | Coupons only |
| Product landing page + quick COD checkout | Apps | **Yes, core** | Product page template only |
| Staff accounts & permissions | Yes (5–15) | Unclear | **No** |
| Inventory alerts & stock history | Yes | Partial | **No** |
| Many shipping carriers | Yes | 100+ | Bosta only |
| Product feeds (Meta catalog, Google Shopping, TikTok) | Yes | Yes | **No** |
| New-order push alerts / mobile app | Yes | Yes (app) | Install-as-app only, no push |
| Customer WhatsApp/SMS order notifications | Apps | Partial | **No** |
| Email campaigns & automations | Yes | No | Newsletter forms only |
| Gift cards / store credit | Yes | No | **No** |
| Loyalty points | Apps | No | **No** |
| Public API & webhooks | Yes | Yes | **No** |
| Store affiliates / marketers | Apps | No | Marketplace affiliates only |
| Advanced reports (product, funnel, customers) | Yes | AI analysis | Basic |
| International / multi-currency | Markets | 10+ countries | Egypt only |

Sources: [Shopify pricing](https://www.shopify.com/pricing), [EasyOrders](https://www.easyorders.eg/) (both read 2026-10-28).

---

## 3. Priority order

| # | ID | Feature | Priority | Migration | Approval |
|---|---|---|---|---|---|
| 1 | F-01 | Customers list (store CRM) | P0 | maybe (notes/tags) | — |
| 2 | F-02 | Fake-order protection | P0 | yes | — |
| 3 | F-03 | Abandoned checkouts (leads) for sellers | P0 | yes | — |
| 4 | F-04 | Invoices, packing slips & order export | P0 | no | — |
| 5 | F-05 | Manual orders (phone/WhatsApp sales) | P0 | maybe | **Needs approval** (order creation path) |
| 6 | F-06 | New-order push alerts (PWA) | P1 | yes | — |
| 7 | F-07 | Quantity offers, upsell & cross-sell | P1 | yes | **Needs approval** (checkout pricing) |
| 8 | F-08 | Quick-order landing pages (one-page COD form) | P1 | maybe | **Needs approval** (checkout) |
| 9 | F-09 | Staff accounts & permissions | P1 | yes | — (security review) |
| 10 | F-10 | Inventory alerts & stock history | P1 | yes | — |
| 11 | F-11 | Product feeds (Meta, Google, TikTok) | P1 | no | — |
| 12 | F-12 | More shipping carriers | P1 | small | — |
| 13 | F-13 | Automatic discounts | P2 | yes | **Needs approval** (checkout pricing) |
| 14 | F-14 | Customer order notifications (WhatsApp/SMS) | P2 | yes | Provider cost |
| 15 | F-15 | Reports upgrade | P2 | no | — |
| 16 | F-16 | Email campaigns to subscribers & customers | P2 | yes | — |
| 17 | F-17 | Public API & webhooks | P2 | yes | — (security review) |
| 18 | F-18 | Store affiliates / marketers | P3 | yes | **Needs approval** (payouts) |
| 19 | F-19 | Gift cards & store credit | P3 | yes | **Needs approval** (ledger) |
| 20 | F-20 | Loyalty points | P3 | yes | **Needs approval** |

AI features (field helpers, bulk products, credits, store-build agent) stay in `PLAN.md` §22 (AI-2 … AI-5) and are not repeated here.

---

## 4. Features and tasks

Task format: **ID · Priority · deps** — what to do. Files are proposals; re-check the code first.

### F-01 Customers list (store CRM) — P0

**Why:** Sellers sell to the same people again on WhatsApp. Today they cannot see who bought, how often, or for how much.
**What:** A Customers page per store: name, phone, governorate, order count, total spent, last order, COD success rate (delivered vs refused/returned), link to orders, WhatsApp button, notes and tags, CSV export.
**Status:** [Planned]

- **F-01a · P0 · deps: —** Data: a server query that groups the store's orders by customer phone (and user id when signed in), filtered by `store_id` and the session seller. No new table. `app/(main)/stores/[storeId]/customers/customers.server.ts`.
- **F-01b · P0 · deps: F-01a** Page: table with search, sort, filters (repeat buyers, refused orders), customer drawer with order history. Sidebar entry under Orders. Both languages.
- **F-01c · P1 · deps: F-01b** Notes and tags: migration `store_customer_notes` (`store_id`, `phone`, `note`, `tags text[]`, unique per store + phone; RLS on, no policies).
- **F-01d · P1 · deps: F-01b** CSV/Excel export of the filtered list.
- Acceptance: a seller with two stores sees only each store's customers; another seller's IDs in the URL return nothing (isolation test).

### F-02 Fake-order protection — P0

**Why:** Refused COD orders cost sellers shipping both ways. EasyOrders sells this as a core feature.
**What:** Block a phone number or IP from ordering on a store; flag risky orders (many refusals across the store, same phone many orders in minutes); optional "confirm order" step where the seller marks an order confirmed before shipping.
**Status:** [Planned]

- **F-02a · P0 · deps: —** Migration `store_order_blocklist` (`store_id`, `kind` 'phone' | 'ip', `value`, `reason`, `created_at`; unique per store + kind + value; RLS on, no policies).
- **F-02b · P0 · deps: F-02a** Storefront checkout check: refuse a blocked phone/IP with a neutral message before the order is created. Touches the store-website checkout path only, not money logic; re-read `packages/lib/src/orders/place-order.ts` and keep its behaviour.
- **F-02c · P0 · deps: F-02a** Dashboard: "Block customer" on an order and on a customer (F-01), and a blocklist page under store settings.
- **F-02d · P1 · deps: F-01a** Risk badge on orders: refusal history for that phone in this store, duplicate orders within 10 minutes.
- **F-02e · P2 · deps: F-02b** Rate limit per IP/phone on store checkout (Upstash).

### F-03 Abandoned checkouts (leads) for sellers — P0

**Why:** Many COD buyers fill name and phone, then leave. Sellers can call them and win the sale.
**What:** When a visitor enters a phone at store checkout, save a lead with the cart. The seller sees a "Not completed" list with phone, items, total and a WhatsApp button prefilled with a message; leads that turn into orders drop off.
**Status:** [Planned]

- **F-03a · P0 · deps: —** Migration `store_checkout_leads` (`store_id`, `phone`, `name`, `governorate`, `items jsonb`, `subtotal numeric(10,2)`, `order_id`, `contacted_at`, timestamps; RLS on, no policies; unique open lead per store + phone).
- **F-03b · P0 · deps: F-03a** Storefront: save/update the lead (debounced) once a valid phone is typed; link `order_id` when the order is placed. Consent text on the checkout form.
- **F-03c · P0 · deps: F-03b** Dashboard list under Orders: filter by date, mark contacted, WhatsApp message template (editable per store).
- **F-03d · P2 · deps: F-03c** Auto-delete leads after 30 days (cron).

### F-04 Invoices, packing slips & order export — P0

**Why:** Sellers print a slip for each parcel and share invoices with customers.
**What:** Printable A4 invoice and A6 packing slip (store logo, order, items, COD amount, barcode), bulk print selected orders, CSV/Excel export of orders, bulk status change.
**Status:** [Planned]

- **F-04a · P0 · deps: —** Print views (HTML + print CSS, Arabic RTL and English) for one or many orders; store-branded.
- **F-04b · P0 · deps: —** Orders CSV/Excel export with current filters.
- **F-04c · P1 · deps: —** Bulk actions on the orders list: change stage (only the transitions the seller may already make), print, export.

### F-05 Manual orders (phone/WhatsApp sales) — P0 · Needs approval

**Why:** Much of the sales happen in chat. Sellers want those orders in the same list, shipped the same way.
**What:** "Create order" in the dashboard: pick products/variants, customer name, phone, address, shipping zone, discount, payment (COD or already paid). The order is tagged `source = manual` and follows the normal stages, shipping and fee rules.
**Status:** [Planned]

- **F-05a · P0 · deps: owner approval** Design note: how a manual order goes through the existing order creation (`place-order.ts`) without changing money logic; fee and wallet behaviour equal to a storefront COD order. Get the owner's OK.
- **F-05b · P0 · deps: F-05a** Migration if needed (an order `source` value), then the create-order form and server action (`requireStore`, stock check).
- **F-05c · P1 · deps: F-05b** "Send order link" option: create a pending order and send the customer a link to confirm/pay.

### F-06 New-order push alerts (PWA) — P1

**Why:** EasyOrders and Shopify have apps that ping on every order; Tallaby sellers find out late.
**What:** Web push for the installed dashboard PWA (and browser): new order, order refused, low stock. Settings per type.
**Status:** [Planned]

- **F-06a · P1 · deps: —** Migration `seller_push_subscriptions` (`seller_id`, endpoint, keys, user agent; RLS on, no policies). VAPID keys in server env only.
- **F-06b · P1 · deps: F-06a** Service worker + "Turn on alerts" prompt; send from the existing `seller_notifications` trigger flow.

### F-07 Quantity offers, upsell & cross-sell — P1 · Needs approval

**Why:** "Buy 2, save 15%" and "add this for EGP 50" raise order value; this is the top EasyOrders feature.
**What:** Per product: quantity tiers (2 = −10%, 3 = −20%). Upsell after "Order now" (offer a second product at a special price); cross-sell items in the cart.
**Status:** [Planned]

- **F-07a · P1 · deps: owner approval** Pricing rules design: how tiers apply in checkout and how the fee base is computed (PLAN.md D2).
- **F-07b · P1 · deps: F-07a** Migration `product_quantity_offers` + editor in the product form.
- **F-07c · P1 · deps: F-07b** Storefront: tier picker on the product page (builder element), applied at checkout server-side.
- **F-07d · P2 · deps: F-07c** Upsell/cross-sell offers (`store_upsell_offers`) and checkout UI.

### F-08 Quick-order landing pages — P1 · Needs approval

**Why:** COD sellers run ads to one product page with the order form on the page (no cart). EasyOrders is built around this.
**What:** A landing page type in the builder with an inline order form (name, phone, governorate, address, quantity/offer) that creates the order in one step.
**Status:** [Planned]

- **F-08a · P1 · deps: F-02b, owner approval** Inline order form element (tree element, `defineDesign` rules) posting to the store checkout with a one-item cart.
- **F-08b · P1 · deps: F-08a** Landing page designs (code-only, CLAUDE.md rule 17) and "Create landing page from product".

### F-09 Staff accounts & permissions — P1

**Why:** Sellers with a team share one password today.
**What:** Invite staff by email to one or more stores with roles (orders only, products, full). Staff never see wallet/payout unless allowed.
**Status:** [Planned]

- **F-09a · P1 · deps: —** Design note: how `requireSeller`/`requireStore` resolve a staff member to the owner's seller id, and every action that must check the role. Security review before code.
- **F-09b · P1 · deps: F-09a** Migration `store_staff` (`seller_id`, `user_id`, `store_ids`, `role`, invite token, status) and audit log entries.
- **F-09c · P1 · deps: F-09b** Invite flow, accept page, staff list, role-gated sidebar and server checks.

### F-10 Inventory alerts & stock history — P1

**What:** Low-stock threshold per product/variant, alert in notifications (and push, F-06), stock change history (who/why: order, manual edit, import, return).
**Status:** [Planned]

- **F-10a · P1 · deps: —** Migration: `low_stock_threshold` on products/variants and `stock_movements` (RLS on, no policies).
- **F-10b · P1 · deps: F-10a** Write movements on order, cancel/return, edit and import; low-stock notification type.
- **F-10c · P2 · deps: F-10b** Inventory page: low-stock list, quick restock, history.

### F-11 Product feeds (Meta, Google, TikTok) — P1

**What:** A public, per-store product feed URL (CSV/XML) for Meta Commerce catalog, Google Merchant Center and TikTok catalog, with an Apps card explaining setup.
**Status:** [Planned]

- **F-11a · P1 · deps: —** Feed route on the storefront host (published store, active products only, cached with seller-scoped tags).
- **F-11b · P1 · deps: F-11a** Apps cards with the feed URL and steps, both languages.

### F-12 More shipping carriers — P1

**What:** After Bosta, add J&T Express, Mylerz and Aramex the same way (`store_integrations` provider, `shipments` carrier columns, webhook events).
**Status:** [Planned]

- **F-12a · P1 · deps: —** Pick the next carrier with the owner; migration extends `store_integrations_provider_check`.
- **F-12b · P1 · deps: F-12a** Integration following `docs/fulfillment.md` and the Bosta code.

### F-13 Automatic discounts — P2 · Needs approval

**What:** Store-wide rules without a code: free shipping over X, buy X get Y, % off a category, time-limited sale.
**Status:** [Planned]

- **F-13a · P2 · deps: F-07a** Rules model + checkout application (server-side, one engine with coupons).

### F-14 Customer order notifications (WhatsApp/SMS) — P2

**What:** Automatic messages to the buyer: order received (with confirm link, helps F-02), shipped, out for delivery. Needs a WhatsApp Business API / SMS provider and a cost model.
**Status:** [Planned]

- **F-14a · P2 · deps: owner decision (provider, who pays)** Provider integration and message templates.
- **F-14b · P2 · deps: F-14a** Per-store settings and a message log table.

### F-15 Reports upgrade — P2

**What:** Best and worst products, refusal rate by governorate, sales by source (store/marketplace/manual), conversion funnel (views → checkout → order) using store views + leads.
**Status:** [Planned]

- **F-15a · P2 · deps: F-03** Report queries (cached per seller + store) and charts.

### F-16 Email campaigns — P2

**What:** Send a branded email to store subscribers and past customers (new products, sale), with unsubscribe and limits.
**Status:** [Planned]

- **F-16a · P2 · deps: F-01** Audience, composer, send through the existing email service, `store_email_campaigns` table, daily caps.

### F-17 Public API & webhooks — P2

**What:** Per-store API keys (hashed) and webhooks (order created/updated) for sellers' own tools.
**Status:** [Planned]

- **F-17a · P2 · deps: F-09a** Key model, scopes, rate limits, signed webhooks; security review.

### F-18 Store affiliates / marketers — P3 · Needs approval

**What:** Sellers give marketers a link/code and pay them a commission per delivered order. Payouts touch money.
**Status:** [Planned]

### F-19 Gift cards & store credit — P3 · Needs approval

**What:** Sell gift cards and give store credit on returns. Needs its own ledger design (separate from both wallets).
**Status:** [Planned]

### F-20 Loyalty points — P3 · Needs approval

**What:** Points per order, redeem at checkout, per store.
**Status:** [Planned]

---

## 5. Owner feature requests (intake)

Add each new request here first, with the date and the owner's words, then turn it into a §4 feature and place it in §3.

| Date | Request (owner's words) | Feature ID | Status |
|---|---|---|---|
| — | _(waiting for the owner's list)_ | — | — |

---

## 6. Checklist

`[ ]` not started · `[~]` in progress (date, branch) · `[x]` done (date, commit)

**P0**
- [ ] F-01a Customers query
- [ ] F-01b Customers page
- [ ] F-02a Blocklist migration
- [ ] F-02b Checkout block check
- [ ] F-02c Block from dashboard + blocklist page
- [ ] F-03a Leads migration
- [ ] F-03b Storefront lead capture
- [ ] F-03c Leads list in dashboard
- [ ] F-04a Invoice + packing slip print
- [ ] F-04b Orders export
- [ ] F-05a Manual orders design (owner approval)
- [ ] F-05b Create order form

**P1**
- [ ] F-01c Customer notes & tags
- [ ] F-01d Customers export
- [ ] F-02d Risk badge
- [ ] F-04c Orders bulk actions
- [ ] F-05c Send order link
- [ ] F-06a Push subscriptions migration
- [ ] F-06b Push alerts
- [ ] F-07a Quantity offers design (owner approval)
- [ ] F-07b Quantity offers in product form
- [ ] F-07c Quantity offers on storefront
- [ ] F-08a Inline order form (owner approval)
- [ ] F-08b Landing page designs
- [ ] F-09a Staff design + security review
- [ ] F-09b Staff migration
- [ ] F-09c Staff invite + roles
- [ ] F-10a Inventory migration
- [ ] F-10b Stock movements + low-stock alert
- [ ] F-11a Product feed route
- [ ] F-11b Feed apps cards
- [ ] F-12a Next carrier chosen
- [ ] F-12b Carrier integration

**P2 / P3**
- [ ] F-02e Checkout rate limit
- [ ] F-03d Lead cleanup cron
- [ ] F-07d Upsell / cross-sell
- [ ] F-10c Inventory page
- [ ] F-13a Automatic discounts
- [ ] F-14a / F-14b Customer notifications
- [ ] F-15a Reports upgrade
- [ ] F-16a Email campaigns
- [ ] F-17a Public API & webhooks
- [ ] F-18 Store affiliates
- [ ] F-19 Gift cards & store credit
- [ ] F-20 Loyalty points

---

## 7. Log

Newest first. One entry per finished task or decision: date, task, what changed, migrations (number, staging/production status), verification, notes.

### 2026-10-28 — Roadmap created

- Inventory of live seller features checked in code (`apps/dashboard/app/(main)/**`, `components/layout/dashboard-routes.lib.ts`, `store_integrations_provider_check` in `0106`, `packages/ai`).
- Compared with Shopify (pricing page) and EasyOrders (easyorders.eg), 2026-10-28.
- No migration yet: each feature writes its own when its task starts. Next free number: `0115`.
