# Tallaby Seller Features — Roadmap

> **Status:** Created 2026-10-28; EasyOrders dashboard and public roadmap added the same day (§2.3, §2.4, F-21 … F-31; all 88 EasyOrders roadmap ideas mapped). No roadmap feature is started yet. The owner will add more feature requests in chat; each one is added here (§5 intake, then a feature in §4).
> **Scope:** New **seller features** only, mostly in the seller dashboard (`apps/dashboard`) and the store website (`apps/ecommerce` storefront). Platform work (multi-store, builder, templates, fees, wallets, admin) stays in [`PLAN.md`](PLAN.md).
> **Authority:** [`CLAUDE.md`](CLAUDE.md) durable rules apply to every task here (tenant isolation, money, migrations, i18n, caching, verification). `PLAN.md` §13 (business model) is never changed from this file.
> **Companion docs:** [`PROJECT.md`](PROJECT.md), [`PROJECT_DESCRIPTION.md`](PROJECT_DESCRIPTION.md), [`PLAN.md`](PLAN.md), [`docs/wallet.md`](docs/wallet.md), [`docs/fulfillment.md`](docs/fulfillment.md).

**Labels:**

| Label                | Meaning                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **[Live]**           | Built and on `main` (with a file path).                                                                                     |
| **[Planned]**        | In this roadmap, not built.                                                                                                 |
| **[In progress]**    | A session is working on it (say which branch).                                                                              |
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

| Area             | What sellers have today                                                                                                                                                              | Where                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Account & stores | Signup (email/Google), up to 3 stores on Free, store switcher, plan & usage page, heard-about-us                                                                                     | `app/signup`, `app/(main)/stores`, `settings/plan`              |
| Products         | Add/edit physical & digital products, variants, images, Excel import, import from URL, seller categories & brands, social proof (seller-added reviews, live views)                   | `app/(main)/products/**`                                        |
| AI               | Add/Edit product with AI (photos, PDF, text → both languages, SEO), daily cap, AI usage tab                                                                                          | `products/add/ai`, `packages/ai`                                |
| Store catalog    | Choose which products each store shows                                                                                                                                               | `stores/[storeId]/catalog`                                      |
| Orders           | Order list, stages, order details, WhatsApp/call buttons, Bosta ship + bulk ship                                                                                                     | `app/(main)/orders/**`                                          |
| Delivery         | Delivery tracking, own riders, store shipping zones (places, free-over, COD per zone), Tallaby delivery, Bosta app                                                                   | `orders/delivery`, `orders/riders`, `stores/[storeId]/shipping` |
| Payments         | COD; the seller chooses which methods the store shows (InstaPay, Vodafone Cash, e& Cash), but those transfers still go to **Tallaby's** accounts. Paying the seller's own numbers with seller confirmation is PLAN.md P3-07 Part B, not built (corrected 2026-10-29) | `stores/[storeId]/settings/payments`                            |
| Money            | Store wallet (can go negative), top-ups, account statements, reports, flat EGP 5 fee per delivered order, 7-day trial                                                                | `wallet`, `financial`, `reports`                                |
| Marketing        | Coupons (marketplace/store, product picker, store pop-up with trigger + countdown), paid ad packages, reviews & Q&A                                                                  | `coupons`, `marketing`, `reviews`                               |
| Website          | Builder (element trees), 100+ templates, design system, pages, product page template, blog, forms + submissions, media library, domain & SEO, sitemap, social links, offline/publish | `app/(builder)`, `stores/[storeId]/website/**`                  |
| Apps             | Meta Pixel, Meta CAPI, GA4, GTM, TikTok Pixel, Snapchat Pixel, Google Sheets order export, Shopify import, Bosta                                                                     | `stores/[storeId]/apps`                                         |
| Analytics        | Store views (GA4 via Tallaby GTM)                                                                                                                                                    | `stores/[storeId]/analytics`, `docs/store-views.md`             |
| Notifications    | Seller notification inbox (orders, top-ups, questions, reviews)                                                                                                                      | `seller_notifications` (0098)                                   |
| Fulfillment      | Request Tallaby fulfillment services                                                                                                                                                 | `settings/fulfillment`                                          |
| Help             | Help center, floating WhatsApp support, install-as-app button                                                                                                                        | `help`, `components/layout`                                     |

### 2.2 Missing (compared with Shopify and EasyOrders)

| Feature                                               | Shopify        | EasyOrders    | Tallaby                                                                                     |
| ----------------------------------------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------- |
| Customers list / CRM, segments                        | Yes            | Partial       | **No**                                                                                      |
| Fake-order blocker (phone/IP blocklist)               | Via apps       | **Yes, core** | **No**                                                                                      |
| Abandoned checkout recovery (seller-visible)          | Yes            | Yes (leads)   | Marketplace email cron only (`apps/ecommerce/app/api/cron/abandoned-carts`), no seller view |
| Manual / draft orders                                 | Yes            | Yes           | **No**                                                                                      |
| Invoices & packing slips                              | Yes            | Yes           | **No**                                                                                      |
| Order export / bulk status                            | Yes            | Yes           | Google Sheets app only                                                                      |
| Upsell, cross-sell, downsell, quantity offers         | Apps / bundles | **Yes, core** | **No**                                                                                      |
| Automatic discounts (BXGY, free shipping)             | Yes            | Partial       | Coupons only                                                                                |
| Product landing page + quick COD checkout             | Apps           | **Yes, core** | Product page template only                                                                  |
| Staff accounts & permissions                          | Yes (5–15)     | Unclear       | **No**                                                                                      |
| Inventory alerts & stock history                      | Yes            | Partial       | **No**                                                                                      |
| Many shipping carriers                                | Yes            | 100+          | Bosta only                                                                                  |
| Product feeds (Meta catalog, Google Shopping, TikTok) | Yes            | Yes           | **No**                                                                                      |
| New-order push alerts / mobile app                    | Yes            | Yes (app)     | Install-as-app only, no push                                                                |
| Customer WhatsApp/SMS order notifications             | Apps           | Partial       | **No**                                                                                      |
| Email campaigns & automations                         | Yes            | No            | Newsletter forms only                                                                       |
| Gift cards / store credit                             | Yes            | No            | **No**                                                                                      |
| Loyalty points                                        | Apps           | No            | **No**                                                                                      |
| Public API & webhooks                                 | Yes            | Yes           | **No**                                                                                      |
| Store affiliates / marketers                          | Apps           | No            | Marketplace affiliates only                                                                 |
| Advanced reports (product, funnel, customers)         | Yes            | AI analysis   | Basic                                                                                       |
| International / multi-currency                        | Markets        | 10+ countries | Egypt only                                                                                  |

Sources: [Shopify pricing](https://www.shopify.com/pricing), [EasyOrders](https://www.easyorders.eg/) (both read 2026-10-28).

### 2.3 EasyOrders seller dashboard, item by item (owner pasted their sidebar, 2026-10-28)

| EasyOrders menu item                                                       | What it is                                           | Tallaby today                                                   | Roadmap              |
| -------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- | -------------------- |
| لوحة الإحصائيات (stats)                                                    | Sales dashboard                                      | Live (home KPIs, reports)                                       | F-15                 |
| كل الطلبات (all orders)                                                    | Order list                                           | Live                                                            | —                    |
| الطلبات المفقودة (missed orders)                                           | Checkouts left after typing a phone                  | **Missing**                                                     | **F-03**             |
| الأرقام المحظورة من الطلب (blocked numbers)                                | Phone blocklist                                      | **Missing**                                                     | **F-02**             |
| الأرقام المحظورة OTP                                                       | Numbers that must pass an OTP before ordering        | **Missing**                                                     | **F-02f**            |
| NewsLetter                                                                 | Subscriber list                                      | Forms + submissions (no list view)                              | F-16                 |
| كل المنتجات / الأقسام / التقييمات                                          | Products, categories, reviews                        | Live                                                            | —                    |
| Product Feed                                                               | Meta/Google/TikTok catalog feed                      | **Missing**                                                     | **F-11**             |
| Easy Catalog                                                               | Shareable product catalog (link/PDF for WhatsApp)    | **Missing**                                                     | F-11c                |
| A/B Tests                                                                  | Test two versions of a product/landing page          | **Missing**                                                     | F-27                 |
| الثيمات / تعديل الصفحة الرئيسية / الصفحات / UI Blocks / رفع ملفات التصاميم | Themes, home editor, pages, blocks, design uploads   | Live (builder, 100+ templates, library sections, media library) | —                    |
| نموذج الشراء (checkout form)                                               | Choose and order checkout fields                     | **Missing**                                                     | **F-25**             |
| تعديل صفحة الشكر (thank-you page)                                          | Edit the order-confirmation page                     | **Missing**                                                     | **F-25**             |
| Funnels                                                                    | Landing page → upsell → thank-you flows              | **Missing**                                                     | **F-08**             |
| إعدادات البيكسل / Conversion API / Google Tag                              | Tracking                                             | Live (Meta Pixel + CAPI, GA4, GTM, TikTok, Snapchat)            | —                    |
| CROSS SELLING / Downsell                                                   | Extra offers in cart / lower offer when leaving      | Exit coupon pop-up only (`coupons.popup_trigger`, 0114)         | **F-07**             |
| الكوبونات (coupons)                                                        | Coupons                                              | Live                                                            | —                    |
| إعادة الاستهداف (retargeting)                                              | Customer audiences for ads                           | **Missing**                                                     | F-16b                |
| Whatsapp Marketing                                                         | WhatsApp API broadcasts and order messages           | **Missing**                                                     | F-14, F-16c          |
| وثق طلباتك مع Top MB                                                       | Third-party order confirmation (call/WhatsApp)       | **Missing**                                                     | F-14a (confirm link) |
| تتبع نتائج الحملات الإعلانية (UTM builder)                                 | Campaign links and orders per campaign               | **Missing**                                                     | F-26                 |
| Google Merchant                                                            | Google Shopping feed                                 | **Missing**                                                     | F-11                 |
| Sales Popup                                                                | "Someone just ordered …" toasts                      | **Missing**                                                     | **F-22**             |
| إنشاء روابط الإحالة (referral links)                                       | Marketer links with commission                       | Marketplace affiliates only                                     | F-18                 |
| الحد الأدنى للشحن المجاني وللطلب                                           | Store-wide minimum order and free-shipping threshold | Free-over per shipping zone only                                | F-13b                |
| محفظتك (wallet, transactions)                                              | Prepaid balance                                      | Live (store wallet)                                             | —                    |
| التطبيقات (plugins)                                                        | App store                                            | Live (Apps page)                                                | —                    |

### 2.4 EasyOrders public roadmap — what their sellers ask for ([roadmap.easyorders.ai](https://roadmap.easyorders.ai/ar), read 2026-10-28)

All 88 ideas read on 2026-10-28 (the 66 waitlist items expanded in the browser; 12 planned, 4 in progress, 6 done). Votes in brackets.

| Their item (status)                                                               | Tallaby                                                                                                                           | Roadmap                    |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Deposit as a % of the order, e.g. 20 % (waitlist, **38**, top request)            | **Missing**                                                                                                                       | **F-21**                   |
| Per-product visit stats (in progress, 20)                                         | Store-level views only                                                                                                            | **F-15b**                  |
| Customer login on the store (in progress, 19 + 13; "Customer account" 1)          | Live: store account button (`storefront/[subdomain]/_components/store-account-button.client.tsx`) with the shared Tallaby account | —                          |
| Print invoice (waitlist, 18)                                                      | **Missing**                                                                                                                       | **F-04a**                  |
| Checkout form (planned, 17)                                                       | **Missing**                                                                                                                       | **F-25**                   |
| Abandoned cart reminders (waitlist, 17)                                           | Marketplace email only                                                                                                            | **F-03e**                  |
| Order of product properties (waitlist, 17)                                        | Variant types are ordered in the form                                                                                             | check                      |
| Official MCP for AI agents (planned, 14)                                          | **Missing**                                                                                                                       | F-29                       |
| Bundles (planned, 13)                                                             | **Missing**                                                                                                                       | F-07f                      |
| Meta description for store/category pages (planned, 13)                           | Store SEO live; category pages to check                                                                                           | check                      |
| Export products to Excel (waitlist, 13)                                           | Live (`products/_components/import-export-button.client.tsx`)                                                                     | —                          |
| Customer store credit / wallet (waitlist, 13)                                     | Marketplace customer wallet only                                                                                                  | F-19                       |
| Pre-order & waitlist (planned, 12)                                                | **Missing**                                                                                                                       | F-23                       |
| Notify me when restocked (planned, 10)                                            | Static `popup-restock` design only                                                                                                | F-23                       |
| Coupons in cart + free-gift choice (waitlist, 9)                                  | Coupons at checkout                                                                                                               | F-13c                      |
| Payment by transfer-receipt image (planned, 9)                                    | Per-store wallet payments with seller confirmation                                                                                | check proof upload in F-21 |
| Wholesale vs retail price (waitlist, 8)                                           | **Missing**                                                                                                                       | F-28                       |
| Bulk price change for a category (waitlist, 7)                                    | **Missing**                                                                                                                       | **F-24**                   |
| Repeat customer order (planned, 7)                                                | **Missing**                                                                                                                       | F-01e                      |
| Variant out-of-stock indicators (planned, 7)                                      | Stock line on product page                                                                                                        | check                      |
| Mobile + checkout preview, show/hide section in builder (planned, 5)              | Mobile preview live; hide section to check                                                                                        | check                      |
| Block customer phones (waitlist, 4)                                               | **Missing**                                                                                                                       | F-02                       |
| Deleted orders visible (waitlist, 4)                                              | Cancelled stage live                                                                                                              | —                          |
| Blog, two languages, offers page, send to carrier from order page (done or asked) | Live (blog, AR/EN, Bosta ship from order)                                                                                         | —                          |

**The rest of the waitlist (1–3 votes each), grouped:**

| Their items                                                                                                                                         | Tallaby                                                                                                                   | Roadmap                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Deposit again: "take a deposit and calculate it", "الديبوزت", deposit for custom-made products (+3 more requests, so deposit is ~41 votes in total) | Missing                                                                                                                   | **F-21** (per-product deposit for custom items)                                   |
| Special price when bought with another product; cross-sell for big catalogs                                                                         | Missing                                                                                                                   | F-07d                                                                             |
| Buy X get Y coupon                                                                                                                                  | Coupons are % / amount only                                                                                               | F-13a                                                                             |
| Edit products by Excel sheet; variant prices in the upload sheet; select all products                                                               | Import creates products; updating existing rows to check                                                                  | **F-24c**, F-24                                                                   |
| Order of products inside each category                                                                                                              | to check                                                                                                                  | F-24d                                                                             |
| Inventory settings                                                                                                                                  | Stock per product/variant                                                                                                 | F-10                                                                              |
| Daily list of ordered products and colours on the stats page ("ضروري جدا")                                                                          | Missing                                                                                                                   | **F-04d** (picking list)                                                          |
| Barcode scanner to receive returns                                                                                                                  | Missing                                                                                                                   | F-04e                                                                             |
| Change order status, orders page, advanced fulfillment workflow                                                                                     | Order stages live                                                                                                         | F-04c (bulk), F-02 (confirm step)                                                 |
| Abandoned cart notifications; shipping cost on missed orders                                                                                        | Missing                                                                                                                   | F-03                                                                              |
| Send Purchase to the pixel when the order is delivered; control pixel events                                                                        | Pixel + CAPI live, purchase sent at order time                                                                            | **F-30**                                                                          |
| Message customers who have not bought for 90 days; ask email/WhatsApp at checkout for retargeting                                                   | Missing                                                                                                                   | F-16e, F-25, F-16b                                                                |
| WhatsApp; Telegram as a contact link                                                                                                                | WhatsApp buttons live                                                                                                     | F-14; Telegram link in social settings (small)                                    |
| Affiliate and influencer marketing                                                                                                                  | Marketplace affiliates only                                                                                               | F-18                                                                              |
| Mobile app update                                                                                                                                   | Install-as-app, no push                                                                                                   | F-06                                                                              |
| Auto order updates from the carrier; Egypt Post                                                                                                     | Bosta webhooks live                                                                                                       | F-12                                                                              |
| Fawry gateway, more payment methods (VPAY)                                                                                                          | Fawry shown as "Soon"                                                                                                     | PLAN.md payments (not a roadmap item)                                             |
| Customer tracks the order                                                                                                                           | Live (store order page)                                                                                                   | —                                                                                 |
| Mark sold-out products                                                                                                                              | Live (stock line, buy box)                                                                                                | —                                                                                 |
| Multi-country and currency                                                                                                                          | Egypt only                                                                                                                | not planned                                                                       |
| Store as an installable app (PWA)                                                                                                                   | Missing                                                                                                                   | F-06c (P3)                                                                        |
| POS and cloud cashier                                                                                                                               | Missing                                                                                                                   | F-31 (P3)                                                                         |
| Advanced filters, product categorisation, smarter collections, brand per product, own domain, change link, extra language                           | Live (catalog filters, categories, brands, custom domain, subdomain change, AR/EN)                                        | —                                                                                 |
| AI to edit product looks                                                                                                                            | AI product entry live                                                                                                     | PLAN.md AI-2                                                                      |
| AI integration – ChatGPT & Gemini (11)                                                                                                              | Gemini product autofill live (`packages/ai`)                                                                              | PLAN.md AI-2 … AI-5                                                               |
| Newsletter pop-up designed per theme (9)                                                                                                            | Pop-up designs in the builder (`packages/store-sections/src/designs/popups`); check that one collects newsletter sign-ups | check; F-16d lists the sign-ups                                                   |
| Governorate areas as a dropdown (8)                                                                                                                 | Shipping zones store areas (`store_shipping_zones.places`)                                                                | F-25a (area dropdown at checkout)                                                 |
| "تعديل المنتجات" (6), "المدفوعات" (6), "الكتابة" (1)                                                                                                | Titles too vague to map                                                                                                   | —                                                                                 |
| Date filters in freelancer showcase analytics (5)                                                                                                   | Not a Tallaby product                                                                                                     | —                                                                                 |
| Done there: unified advanced settings for all products (6)                                                                                          | Missing                                                                                                                   | F-24 (bulk edit)                                                                  |
| Done there: upsell shown on a separate landing page (3)                                                                                             | Missing                                                                                                                   | F-07d, F-08c                                                                      |
| Done there: product comparisons (2); offers page (2)                                                                                                | Marketplace compare and deals live; no store offers page                                                                  | check (store offers page could be a builder page with a discounted-products list) |
| Done there: video in product feed, auto category mapping to Meta (1)                                                                                | Missing                                                                                                                   | F-11b                                                                             |

**What this tells us:** EasyOrders sellers' biggest pains are COD risk (deposit, blocked numbers, OTP, confirmation), recovering lost orders (missed orders, cart reminders), selling more per order (bundles, upsell, downsell, quantity offers, checkout form, funnels) and day-to-day order work (invoices, bulk edits, per-product stats). Those lead the priority order in §3. Tallaby is already ahead on store design (builder, templates), tracking apps, blog, two languages, AI product entry and wallets.

---

## 3. Priority order

Updated 2026-10-28 after the EasyOrders dashboard and roadmap review (§2.3, §2.4). IDs never change; only the order does.

| #   | ID   | Feature                                                    | Priority | Migration          | Approval                                 |
| --- | ---- | ---------------------------------------------------------- | -------- | ------------------ | ---------------------------------------- |
| 1   | F-02 | Fake-order protection (blocklist, WhatsApp confirm, risk)  | P0       | yes                | —                                        |
| 2   | F-03 | Missed orders (abandoned checkouts) + reminders            | P0       | yes                | —                                        |
| 3   | F-01 | Customers list (store CRM)                                 | P0       | maybe (notes/tags) | —                                        |
| 4   | F-04 | Invoices, packing slips & order export                     | P0       | no                 | —                                        |
| 5   | F-05 | Manual orders (phone/WhatsApp sales)                       | P0       | maybe              | **Needs approval** (order creation path) |
| 6   | F-21 | Deposit (عربون) before shipping a COD order                | P1       | yes                | **Needs approval** (money, checkout)     |
| 7   | F-32 | Cross-sell offers under the product (on by default)        | P1       | yes                | Owner asked; design note OK (checkout)   |
| 8   | F-34 | Low-stock urgency badge (product checkbox)                 | P1       | yes (small)        | —                                        |
| 9   | F-35 | Product trash (restore within 30 days)                     | P1       | yes (small)        | —                                        |
| 10  | F-36 | Store app (PWA with the store's name and logo)             | P1       | no (expected)      | —                                        |
| 11  | F-37 | Tallaby affiliate program (20 % of referred top-ups, cash) | P1       | yes                | **Needs approval** (money, business model) |
| 12  | F-25 | Checkout form & thank-you page settings                    | P1       | yes                | —                                        |
| 13  | F-08 | Funnels: quick-order landing pages                         | P1       | maybe              | **Needs approval** (checkout)            |
| 14  | F-07 | Quantity offers, bundles, upsell                           | P1       | yes                | **Needs approval** (checkout pricing)    |
| 15  | F-22 | Sales pop-up (real recent orders)                          | P1       | no                 | —                                        |
| 16  | F-24 | Bulk product editing (prices by category, stock, status)   | P1       | no                 | —                                        |
| 17  | F-15 | Reports upgrade + per-product views                        | P1       | no                 | —                                        |
| 18  | F-06 | New-order push alerts (PWA)                                | P1       | yes                | —                                        |
| 19  | F-11 | Product feeds (Meta, Google Merchant, TikTok) + catalog    | P1       | no                 | —                                        |
| 20  | F-09 | Staff accounts & permissions                               | P1       | yes                | — (security review)                      |
| 21  | F-10 | Inventory alerts & stock history                           | P1       | yes                | —                                        |
| 22  | F-12 | More shipping carriers                                     | P1       | small              | —                                        |
| 23  | F-13 | Automatic discounts, min order, free gift                  | P2       | yes                | **Needs approval** (checkout pricing)    |
| 24  | F-14 | Customer order messages (WhatsApp/SMS, confirm link)       | P2       | yes                | Provider cost                            |
| 25  | F-16 | Campaigns: email, WhatsApp, retargeting audiences          | P2       | yes                | Provider cost                            |
| 26  | F-23 | Back-in-stock alerts & pre-orders                          | P2       | yes                | —                                        |
| 27  | F-26 | Campaign tracking (UTM links, orders per campaign)         | P2       | yes                | —                                        |
| 28  | F-17 | Public API & webhooks                                      | P2       | yes                | — (security review)                      |
| 29  | F-18 | Store affiliates / referral links                          | P3       | yes                | **Needs approval** (payouts)             |
| 30  | F-19 | Gift cards & customer store credit                         | P3       | yes                | **Needs approval** (ledger)              |
| 31  | F-20 | Loyalty points                                             | P3       | yes                | **Needs approval**                       |
| 32  | F-27 | A/B tests                                                  | P3       | yes                | —                                        |
| 33  | F-28 | Wholesale pricing                                          | P3       | yes                | **Needs approval** (checkout pricing)    |
| 34  | F-29 | AI agent connection (MCP)                                  | P3       | no                 | — (after F-17)                           |
| 35  | F-30 | Ad tracking upgrades (Purchase on delivery, event toggles) | P2       | maybe              | —                                        |
| 36  | F-31 | POS and cashier                                            | P3       | yes                | **Needs approval** (order creation path) |

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
- **F-01e · P2 · deps: F-01b** Repeat order: from a customer, start a manual order (F-05) prefilled with their last order; on the store, a "Order again" button in the customer's order page (EasyOrders roadmap, 7 votes).
- Acceptance: a seller with two stores sees only each store's customers; another seller's IDs in the URL return nothing (isolation test).

### F-02 Fake-order protection — P0

**Why:** Refused COD orders cost sellers shipping both ways. EasyOrders sells this as a core feature.
**What:** Block a phone number from ordering on a store (phone only for now, owner 2026-10-29; IP blocking later if needed); flag risky orders (many refusals across the store, same phone many orders in minutes); optional "confirm order" step where the seller marks an order confirmed before shipping.
**Status:** [Planned]

- **F-02a · P0 · deps: —** Migration `store_blocked_phones` (`store_id`, `phone` normalised to `+20…`, `reason`, `created_at`; unique per store + phone; RLS on, no policies). Phone only (owner, 2026-10-29).
- **F-02b · P0 · deps: F-02a** Storefront checkout check: refuse a blocked phone (compared after normalising, so `010…`, `+2010…` and `2010…` all match) with a neutral message before the order is created. Touches the store-website checkout path only, not money logic; re-read `packages/lib/src/orders/place-order.ts` and keep its behaviour.
- **F-02c · P0 · deps: F-02a** Dashboard: "Block customer" on an order and on a customer (F-01), and a blocklist page under store settings.
- **F-02d · P1 · deps: F-01a** Risk badge on orders: refusal history for that phone in this store, duplicate orders within 10 minutes.
- **F-02e · P2 · deps: F-02b** Rate limit per IP/phone on store checkout (Upstash).
- **F-02g · P0 · deps: —** Confirm by WhatsApp, **no API or provider needed**: the order page in the dashboard gets a "Ask to confirm" button that opens WhatsApp (`wa.me`) to the customer with a prefilled message (order number, items, total, address; editable template per store), and a "Confirmed" action that moves the order to the existing confirmed stage. Optional: the store's thank-you page shows "Confirm on WhatsApp", which opens a prefilled message to the seller's number. Orders not confirmed after N hours are highlighted.
- **F-02f · P2 · Blocked: Tallaby has no OTP / WhatsApp API / SMS service yet (owner, 2026-10-29). deps: F-02a, owner decision (provider, who pays)** OTP check at store checkout: the seller lists phones (or turns on "all first-time phones" / "phones with a refusal") that must enter a code before the order is placed (EasyOrders "الأرقام المحظورة OTP"). Code sent by SMS or WhatsApp; attempts limited; table `store_checkout_otps` (hashed code, expiry; RLS on, no policies).

### F-03 Missed orders (abandoned checkouts) + reminders — P0

**Why:** Many COD buyers fill name and phone, then leave. Sellers can call them and win the sale.
**What:** When a visitor enters a phone at store checkout, save a lead with the cart. The seller sees a "Not completed" list with phone, items, total and a WhatsApp button prefilled with a message; leads that turn into orders drop off.
**Status:** [Planned]

- **F-03a · P0 · deps: —** Migration `store_checkout_leads` (`store_id`, `phone`, `name`, `governorate`, `items jsonb`, `subtotal numeric(10,2)`, `order_id`, `contacted_at`, timestamps; RLS on, no policies; unique open lead per store + phone).
- **F-03b · P0 · deps: F-03a** Storefront: save/update the lead (debounced) once a valid phone is typed; link `order_id` when the order is placed. Consent text on the checkout form.
- **F-03c · P0 · deps: F-03b** Dashboard list under Orders: filter by date, mark contacted, WhatsApp message template (editable per store).
- **F-03d · P2 · deps: F-03c** Auto-delete leads after 30 days (cron).
- **F-03f · P1 · deps: F-03b** Show the shipping cost and total (not only the subtotal) on each missed order.
- **F-03e · P1 · deps: F-03b** Reminders (EasyOrders roadmap, 17 votes): one-click WhatsApp reminder from the list now; an automatic email reminder when the lead has an email (same claim pattern as the marketplace `abandoned-carts` cron, once per lead); automatic WhatsApp later with F-14.

### F-04 Invoices, packing slips & order export — P0

**Why:** Sellers print a slip for each parcel and share invoices with customers.
**What:** Printable A4 invoice and A6 packing slip (store logo, order, items, COD amount, barcode), bulk print selected orders, CSV/Excel export of orders, bulk status change.
**Status:** [Planned]

- **F-04a · P0 · deps: —** Print views (HTML + print CSS, Arabic RTL and English) for one or many orders; store-branded.
- **F-04b · P0 · deps: —** Orders CSV/Excel export with current filters.
- **F-04c · P1 · deps: —** Bulk actions on the orders list: change stage (only the transitions the seller may already make), print, export.
- **F-04d · P1 · deps: —** Picking list: for a day or the selected orders, total quantity per product, variant and colour to prepare (EasyOrders seller: "ضروري جدا"). Printable.
- **F-04e · P2 · deps: F-04a** Barcode on slips; scan a returned parcel's barcode (phone camera) to open the order and mark it returned.

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
- **F-06c** Moved to **F-36** (owner, 2026-10-29).

### F-07 Quantity offers, upsell & cross-sell — P1 · Needs approval

**Why:** "Buy 2, save 15%" and "add this for EGP 50" raise order value; this is the top EasyOrders feature.
**What:** Per product: quantity tiers (2 = −10%, 3 = −20%). Upsell after "Order now" (offer a second product at a special price); cross-sell items in the cart.
**Status:** [Planned]

- **F-07a · P1 · deps: owner approval** Pricing rules design: how tiers apply in checkout and how the fee base is computed (PLAN.md D2).
- **F-07b · P1 · deps: F-07a** Migration `product_quantity_offers` + editor in the product form.
- **F-07c · P1 · deps: F-07b** Storefront: tier picker on the product page (builder element), applied at checkout server-side.
- **F-07d · P2 · deps: F-07c** Upsell offers after "Order now" and in checkout. Cross-sell on the product page moved to its own feature, **F-32** (owner, 2026-10-29).
- **F-07e** Downsell: not planned. The live exit coupon pop-up covers it (owner, 2026-10-29; F-33 removed).
- **F-07f · P1 · deps: F-07a** Bundles (EasyOrders planned, 13 votes): a bundle product made of other products/variants at one price; stock taken from each item.

### F-08 Quick-order landing pages — P1 · Needs approval

**Why:** COD sellers run ads to one product page with the order form on the page (no cart). EasyOrders is built around this.
**What:** A landing page type in the builder with an inline order form (name, phone, governorate, address, quantity/offer) that creates the order in one step.
**Status:** [Planned]

- **F-08a · P1 · deps: F-02b, owner approval** Inline order form element (tree element, `defineDesign` rules) posting to the store checkout with a one-item cart.
- **F-08b · P1 · deps: F-08a** Landing page designs (code-only, CLAUDE.md rule 17) and "Create landing page from product".
- **F-08c · P2 · deps: F-08a, F-07d, F-25b** Funnel steps: landing page → optional upsell → thank-you page, with step counts (views, orders) per funnel.

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
- **F-11b · P1 · deps: F-11a** Apps cards with the feed URL and steps, both languages (Meta catalog, Google Merchant, TikTok). Include the product video when there is one, and map store categories to Google/Meta categories.
- **F-11c · P2 · deps: —** Shareable catalog ("Easy Catalog"): a link and a PDF of chosen products with prices and order buttons, for sending on WhatsApp.

### F-12 More shipping carriers — P1

**What:** After Bosta, add J&T Express, Mylerz and Aramex the same way (`store_integrations` provider, `shipments` carrier columns, webhook events).
**Status:** [Planned]

- **F-12a · P1 · deps: —** Pick the next carrier with the owner (J&T, Mylerz, Aramex, Egypt Post "وصلها"); migration extends `store_integrations_provider_check`. Order stages update automatically from carrier webhooks, as with Bosta.
- **F-12b · P1 · deps: F-12a** Integration following `docs/fulfillment.md` and the Bosta code.

### F-13 Automatic discounts — P2 · Needs approval

**What:** Store-wide rules without a code: free shipping over X, buy X get Y, % off a category, time-limited sale.
**Status:** [Planned]

- **F-13a · P2 · deps: F-07a** Rules model + checkout application (server-side, one engine with coupons).
- **F-13b · P1 · deps: —** Store-wide minimum order value (checkout refuses below it, with a clear message) and a store-wide free-shipping threshold on top of the per-zone free-over that exists. Validation only for the minimum; the threshold touches the shipping fee, so check with the owner.
- **F-13c · P2 · deps: F-13a** Show available coupons in the cart and let the customer pick a free gift when a rule allows it (EasyOrders roadmap, 9 votes).

### F-14 Customer order notifications (WhatsApp/SMS) — P2

**What:** Automatic messages to the buyer: order received (with confirm link, helps F-02), shipped, out for delivery. Needs a WhatsApp Business API / SMS provider and a cost model.
**Status:** [Planned]

- **F-14a · P2 · deps: owner decision (provider, who pays)** Provider integration and message templates.
- **F-14b · P2 · deps: F-14a** Per-store settings and a message log table.

### F-15 Reports upgrade + per-product views — P1

**What:** Best and worst products, refusal rate by governorate, sales by source (store/marketplace/manual), conversion funnel (views → checkout → order) using store views + leads, and visits per product (EasyOrders is building this, 20 votes).
**Status:** [Planned]

- **F-15a · P2 · deps: F-03** Report queries (cached per seller + store) and charts.
- **F-15b · P1 · deps: —** Per-product views: read GA4 `page_path` for product pages from the existing store-views report (`apps/dashboard/lib/analytics/`, `docs/store-views.md`), show views and views → orders on the products list and product page. No migration.

### F-16 Campaigns: email, WhatsApp, retargeting — P2

**What:** Send a branded email to store subscribers and past customers (new products, sale), with unsubscribe and limits; WhatsApp broadcasts through the F-14 provider; export customer audiences for Meta/TikTok retargeting.
**Status:** [Planned]

- **F-16a · P2 · deps: F-01** Audience, composer, send through the existing email service, `store_email_campaigns` table, daily caps.
- **F-16b · P2 · deps: F-01** Retargeting audiences: export a segment (buyers, refused, leads from F-03) as a Meta/TikTok custom-audience CSV (phones normalised to E.164). Only the seller's own customers.
- **F-16c · P3 · deps: F-14a** WhatsApp broadcasts to opted-in customers (template messages, opt-out, per-day cap).
- **F-16d · P2 · deps: —** Subscribers list: a page listing newsletter sign-ups from the store's newsletter forms, with export.
- **F-16e · P2 · deps: F-16a** Win-back: an automatic message (email now, WhatsApp with F-14) to customers who have not ordered for N days (default 90), once per period.

### F-17 Public API & webhooks — P2

**What:** Per-store API keys (hashed) and webhooks (order created/updated) for sellers' own tools.
**Status:** [Planned]

- **F-17a · P2 · deps: F-09a** Key model, scopes, rate limits, signed webhooks; security review.

### F-18 Store affiliates / marketers — P3 · Needs approval

**What:** Sellers give marketers a referral link/code (EasyOrders "روابط الإحالة") and pay them a commission per delivered order. Payouts touch money.
**Status:** [Planned]

### F-19 Gift cards & customer store credit — P3 · Needs approval

**What:** Sell gift cards and give store credit on returns (EasyOrders waitlist, 13 votes). Needs its own ledger design (separate from both wallets).
**Status:** [Planned]

### F-20 Loyalty points — P3 · Needs approval

**What:** Points per order, redeem at checkout, per store.
**Status:** [Planned]

### F-21 Deposit (عربون) before shipping a COD order — P1 · Needs approval

**Why:** The most-voted EasyOrders request (38). A small prepayment stops most fake and refused COD orders.
**What:** Per store (and optionally per product): require X % (or a fixed amount) paid before the order ships. The customer pays the deposit with the store's wallet payments (Vodafone Cash, InstaPay … with a transfer-receipt upload) or a card when available; the rest is collected on delivery. The order waits in "awaiting deposit" until the seller confirms; the COD amount sent to the carrier is the remainder.
- **Rounding (owner, 2026-10-29): a percentage deposit is always rounded UP to the nearest EGP 5**, so customers transfer a clean amount. Examples at 20 %: order 1,200 → 240; 1,199 → 239.80 → 240; 1,213 → 242.60 → 245; 1,226 → 245.20 → 250. Computed in integer piastres (`ceil(piastres / 500) * 500`), never more than the order total; the remainder is total − deposit. A fixed-amount deposit is used as the seller typed it.
**Status:** [Planned]

- **Found in code (2026-10-29):** storefront InstaPay / Vodafone Cash / e& Cash payments are a filter on methods that still pay **Tallaby's** accounts (`storefrontCheckoutMethods` in `packages/lib/src/payments/store-methods.ts`); seller-collected payment with seller confirmation is PLAN.md **P3-07 Part B**, waiting for owner approval. Checkout already supports split payments (customer wallet + manual-transfer remainder, `payment.lib.ts`) and a COD-collector rule, which the deposit can reuse. **Decided (owner, 2026-10-29): the deposit goes to the seller's own number** (Vodafone Cash / e& Cash / WE Pay / Orange Cash / InstaPay set in Store settings › Payment methods), and the seller confirms it. So **PLAN.md P3-07 Part B is built first, as part of F-21** (task F-21p below); its design is PLAN.md §8.6 "Customer flow on the store host" and "Money flow".
- **F-21p · P1 · deps: —** PLAN.md P3-07 Part B, as written in §8.6: storefront checkout shows the store's own payment details (snapshot in `orders.metadata`, `paymentCollector: 'seller'`), the customer taps "I've paid" with an optional reference and a transfer screenshot, the seller confirms in the dashboard (`confirmManualPayment(storeId, orderId)`, store-scoped, status-guarded, idempotent), unpaid orders auto-cancel after 48 h (D32), every change to payment details is audited, emailed and rate-limited. Money: seller-collected payments post only the EGP 5 `fee` on delivery, no `sale` (PLAN.md §13.4). Existing stores keep Tallaby-collected methods until the owner decides D30. Full-amount transfers work with this alone; the deposit builds on it.
- **F-21a · P1 · deps: F-21p design, owner approval** Design note (seller-collected deposit; the remainder is COD collected by whoever delivers: Tallaby rider → Tallaby credits only the remainder as `sale`; seller's own delivery or Bosta → nothing credited, fee only): order fields (deposit amount, paid, proof), how the remainder flows to COD, Bosta COD amount, refunds when cancelled, the fee base (PLAN.md §13 unchanged). Money in integer piastres.
- **F-21b · P1 · deps: F-21a** Migration (additive order/store columns, proof bucket reuse) + store setting + product override.
- **F-21c · P1 · deps: F-21b** Checkout step with receipt upload, seller confirm/reject in the order page, carrier COD = remainder.

### F-22 Sales pop-up (real recent orders) — P1

**Why:** Social proof raises conversion; EasyOrders has it as a marketing tool.
**What:** Small toasts on the store: "Someone from Giza ordered <product> 12 minutes ago". **Only real orders of that store** (no made-up data, in line with the owner's real-reviews rule, 2026-10-27), no names or phones, governorate only. On/off, delay and pages in the builder or store settings.
**Status:** [Planned]

- **F-22a · P1 · deps: —** Public, cached, store-scoped endpoint returning the last N orders as `{product, governorate, minutesAgo}` only; hidden when there are fewer than 3 recent orders.
- **F-22b · P1 · deps: F-22a** Storefront toast element + setting; respects reduced motion; off on checkout.

### F-23 Back-in-stock alerts & pre-orders — P2

**What:** "Notify me" on out-of-stock products and variants (phone or email); a message when stock returns. Optional pre-order: accept orders for an out-of-stock product with an expected date. The `popup-restock` design exists but is static.
**Status:** [Planned]

- **F-23a · P2 · deps: F-10b** Migration `store_stock_subscriptions` (RLS on, no policies), storefront form, send on restock.
- **F-23b · P3 · deps: F-23a** Pre-order flag and date on products; order stage label.

### F-24 Bulk product editing — P1

**Why:** Sellers change prices often (EasyOrders waitlist, 7 votes: "raise every product in a category at once").
**What:** Select products (or a whole category) and change price by % or amount, set discount, stock, status or store visibility in one action, with a preview and undo. Product Excel export already exists (`products/_components/import-export-button.client.tsx`).
**Status:** [Planned]

- **F-24a · P1 · deps: —** Server action that applies a change to many of the seller's products/variants in one transaction (ownership checked per row), plus cache purge.
- **F-24b · P1 · deps: F-24a** UI on the products list: selection (including "select all"), "Edit selected", preview table, undo for 10 minutes.
- **F-24c · P2 · deps: —** Update existing products from the Excel sheet (match by SKU or product id), including variant prices and stock. Check what the import does today first.
- **F-24d · P2 · deps: —** Manual product order inside a category (drag to sort), used by the store's category pages. Check what exists first.

### F-25 Checkout form & thank-you page settings — P1.

**Why:** EasyOrders "نموذج الشراء" (planned, 17 votes) and "تعديل صفحة الشكر". COD sellers want a short form and a thank-you page that keeps the customer.
**What:** Per store: which checkout fields show and are required (email, second phone, area, notes, custom question), field order, governorate/area as dropdowns; a thank-you page with the seller's message, WhatsApp button, suggested products and pixel events kept.
**Status:** [Planned]

- **F-25a · P1 · deps: —** Store setting (jsonb on `stores` or a `store_checkout_settings` table) + dashboard page; validated server-side at checkout (phone and the delivery address stay required).
- **F-25b · P1 · deps: F-25a** Thank-you page settings and rendering on the store order-confirmation page.

### F-26 Campaign tracking (UTM links) — P2

**What:** A link builder for ads and influencers (`utm_source/medium/campaign`), store the first-touch UTM on the order, and show orders and revenue per campaign.
**Status:** [Planned]

- **F-26a · P2 · deps: —** Additive order column (`utm jsonb`), capture on the storefront, link builder page, report by campaign.

### F-27 A/B tests — P3

**What:** Two versions of a product page or landing page (title, price display, hero image); traffic split; orders per version.
**Status:** [Planned]

### F-28 Wholesale pricing — P3 · Needs approval

**What:** A wholesale price with a minimum quantity next to the retail price (EasyOrders waitlist, 8 votes).
**Status:** [Planned]

### F-30 Ad tracking upgrades — P2

**Why:** COD orders that are refused still count as purchases in Meta/TikTok, so ads optimise for the wrong buyers (EasyOrders waitlist: "send Purchase when delivered", "control pixel events").
**What:** Per store, choose when Purchase is sent to Meta CAPI (and later TikTok Events API): at order (today) or when delivered; send a cancellation signal for refused orders where the platform allows it; switch individual events on or off; abandoned-checkout event from F-03.
**Status:** [Planned]

- **F-30a · P2 · deps: —** Store setting + server event on the delivered transition (idempotent, one event per order, same `event_id` rules as today's CAPI code in `stores/[storeId]/apps/meta-capi.server.ts`).
- **F-30b · P2 · deps: F-30a** Event toggles in the Apps page.

### F-32 Cross-sell offers under the product — P1 · owner request

**Why:** Owner, 2026-10-29: a customer buying a power bank sees, under the product, "add a charging cable for 10 % off". It raises order value with one tap.
**What:** On the store's product page (under the buy box) and in the cart, show one or a few offers: "Add <product> − X %". The customer ticks it or taps "Add"; both go into the cart and the discount is applied **server-side at checkout** only while the main product is in the cart. **On by default for every store; the seller can turn it off at any time** (store-wide switch, plus per-offer on/off).
- The seller links offers in the product form ("Frequently bought with"): pick a product/variant and a discount (10 % prefilled, % or fixed EGP).
- Offers show only for active, in-stock products of the same store (and in that store's catalog).
- Fits the builder: a `cross-sell` element in the product-page template (tree element, CLAUDE.md rule 17), with a fallback placement for stores whose product page lacks it.
- **Decided (owner, 2026-10-29): when the seller has set no offer for a product, show nothing.** No automatic suggestions; the cross-sell block renders only when the product has at least one active offer whose product is active and in stock.
**Status:** [Planned]

- **F-32a · P1 · deps: —** Design note: the discount as an order-item line adjustment computed in piastres at checkout (`place-order.ts` behaviour kept for orders without offers), how it shows on the order and invoice, and the fee base (PLAN.md §13 unchanged: flat EGP 5 per delivered order, so no fee change). Owner OK on the note.
- **F-32b · P1 · deps: F-32a** Migration `product_cross_sells`: `store_id`, `product_id`, `offer_product_id`, `offer_variant_id`, `discount_type` ('percent' | 'fixed'), `discount_value`, `is_active`, `sort_order`; unique per store + product + offer; RLS on, no policies. Plus `stores.cross_sell_enabled boolean NOT NULL DEFAULT true`. The cart item keeps the accepted `offer_id` so checkout can re-check it. Mirror in `schema.ts` / `relations.ts`.
- **F-32c · P1 · deps: F-32b** Dashboard: "Frequently bought with" in the product form (picker, discount, on/off) and the store-wide switch in store settings. Ownership checked for both products.
- **F-32d · P1 · deps: F-32b** Storefront: offer card under the buy box + in the cart sheet, both languages, `cross-sell` element added to the product-page templates; cached per seller + store.
- **F-32e · P1 · deps: F-32a, F-32d** Checkout: apply the discount server-side only when the main product is in the same order; never trust the client's price; tests for removing the main product, quantity changes and out-of-stock offers.
- **F-32f · P2 · deps: F-32d** Report: how many offers were shown, added and ordered (F-15).

### F-33 Downsell pop-up on cart remove — Removed (owner, 2026-10-29)

Removed: the store already shows a coupon pop-up when a visitor is leaving (`coupons.popup_trigger = exit`, migration `0114`), which covers downsell. The ID is retired and not reused.

### F-34 Low-stock urgency badge (product checkbox) — P1 · owner request

**Why:** Owner, 2026-10-29: "لو في منتج قرب يخلص ممكن نحط تحته … فاضل قطعتين والوقت قرب يخلص، ده بيستعجل العميل وبيحسسه إن المنتج مطلوب."
**What:** A checkbox in the product form (Add and Edit), next to "Show live views": **"Show a low-stock alert"** (off by default, like `show_live_views`), with a threshold "show when stock is at or below N" (default 5). When ticked and the stock of the chosen variant (or the product) is at or below N, the store's product page shows an urgency badge under the price, e.g. "🔥 فاضل قطعتين بس — اطلب قبل ما يخلص", and a small "باقي X" tag on product cards.
- **Real stock only:** the number is the product's (or selected variant's) real stock, never a made-up number, in line with the owner's real-reviews rule (2026-10-27). Hidden at 0 (the sold-out state shows instead) and for products without stock tracking.
- **"Time running out":** when the product has a discount with an end date, the existing deal countdown (`DealCountdown` in `store-product-info.client.tsx`) shows beside the badge. No fake timers.
- Today every store already shows a small automatic pill "متبقٍ N فقط" at stock ≤ 5 (`LOW_STOCK_THRESHOLD` in `apps/ecommerce/components/product-page/product-page.lib.ts`, `StoreStockLine`). The new badge is the seller-controlled, more visible version; when it is on, it replaces that pill on the product so the message is not shown twice. The pill stays as it is for products without the checkbox.
- Arabic number wording ("قطعة واحدة", "قطعتين", "3 قطع", "11 قطعة") through ICU plurals in both `ar.json` and `en.json`.
**Status:** [Planned]

- **F-34a · P1 · deps: —** Migration (additive): `products.show_low_stock_badge boolean NOT NULL DEFAULT false` and `products.low_stock_threshold integer` (1–99, null = 5; shared with F-10a, which later uses it for seller alerts). The product queries select every column, so apply on staging, then production, **before** deploying. Mirror in `schema.ts`.
- **F-34b · P1 · deps: F-34a** Product form: checkbox + threshold in the same block as "Show live views" (`products/add`, edit, `add-product.schema.ts`), saved through the existing product save path (not `actions/products.ts`).
- **F-34c · P1 · deps: F-34a** Storefront: badge on the product page (follows the selected variant's stock), tag on product cards, store theme colours, RTL/EN, reduced motion; tests for 0, 1, 2, threshold and above.
- **F-34d · P2 · deps: F-34c** Builder: a `stock-badge` element in the product-page templates so sellers can move or style it (tree element rules).

### F-35 Product trash (restore within 30 days) — P1 · owner request

**Why:** Owner, 2026-10-29: a deleted product should go to a Trash for 30 days so the seller can restore it. Today a delete is permanent: `deleteProduct` in `apps/dashboard/actions/products.ts` runs a hard `DELETE` on `products` (found in code 2026-10-29).
**What:**
- **Delete → Trash.** Deleting a product (row action or bulk) moves it to Trash instead of erasing it. It disappears at once from every store, the marketplace, search, sitemaps, feeds, carts and offers, as if deleted. The confirm dialog says "It stays in Trash for 30 days".
- **Trash page** in the dashboard (Products › Trash, with a count): photo, name, deleted date, days left, **Restore** and **Delete forever** (with a confirm). Restore brings the product back with everything as it was (status, variants, images, reviews, store catalogs, category counts).
- **After 30 days** a daily job deletes it permanently (the same cleanup as today's delete: category counts, cache invalidation).
- Products in Trash do not count against any product limit, and their slug stays reserved so a restore never clashes.
**Status:** [Planned]

- **F-35a · P1 · deps: —** Migration (additive): `products.deleted_at timestamptz` and `products.deleted_by uuid`, partial index `WHERE deleted_at IS NOT NULL` for the Trash list and the purge job. The product queries select every column, so apply on staging, then production, **before** deploying. Mirror in `schema.ts`.
- **F-35b · P1 · deps: F-35a** Hide trashed products everywhere: one shared filter (`notDeleted`) used by every product read (storefront, marketplace, search, sitemaps, store catalog, coupons, cross-sell, feeds, admin lists marked "in trash"); carts drop trashed items at checkout (server-side). Grep every `from(products)` / `query.products` and add a test that a trashed product never appears.
- **F-35c · P1 · deps: F-35a** Trash and restore actions in the products feature folder (`trash.server.ts`, not in `actions/products.ts`, CLAUDE.md rule 14): seller-scoped `trashProduct`, `restoreProduct`, `deleteProductForever`; category counts and cache invalidation on each; the product row "Delete" and bulk delete call `trashProduct`.
- **F-35d · P1 · deps: F-35c** Trash page + "Restore" toast with undo right after a delete; both languages.
- **F-35e · P1 · deps: F-35c** Daily purge job (cron, like `apps/ecommerce/app/api/cron/abandoned-carts`, `CRON_SECRET`) deleting products trashed more than 30 days ago in batches; idempotent; logs counts only.

### F-36 Store app (PWA with the store's name and logo) — P1 · owner request

**Why:** Owner, 2026-10-29: improve the Next.js PWA so that installing a store website gives an app with **the store's name and logo**. Today every host of `apps/ecommerce` (the marketplace, every `*.tallaby.com` store and custom domains) serves one static manifest, `apps/ecommerce/app/manifest.ts`: "Tallaby.com – Online Shopping in Egypt" with the Tallaby logo, so a customer who adds a store to the home screen gets a Tallaby icon (found in code 2026-10-29). There is no service worker.
**What:**
- **Per-store manifest.** On a store host (subdomain or custom domain), `/manifest.webmanifest` returns the store's own app: `name` = store name, `short_name` = a short version (≤ 12 characters, editable), the store's logo as icons, `theme_color` / `background_color` from the store's design colours, `lang` / `dir` from the store's default language, `start_url` and `scope` = `/`, `display: standalone`, a stable `id` per store. The marketplace keeps today's Tallaby manifest. `manifest.ts` becomes dynamic by reading the request host (a request-time API; see `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` and the manifest file-convention docs).
- **Icons from the logo.** 192 px, 512 px, a maskable 512 px (logo on a padded square in the brand colour) and a 180 px Apple touch icon, generated from the store logo with `next/og` `ImageResponse`, cached per seller + store and refreshed when the logo changes. No logo → a clean initials icon in the store's colour. The page `<head>` also gets the store's `apple-touch-icon`, `theme-color` and `apple-mobile-web-app-title`.
- **Install button on the store.** A small, store-styled "Install our app / ثبّت التطبيق" prompt on phones: Android/Chrome uses the browser's install event; iPhone shows the two-step "Share → Add to Home Screen" guide. Shown after some browsing, dismissible, not again for 30 days. Never on checkout.
- **Offline page.** A minimal service worker (scope `/` on the store host) that shows a branded "You're offline" page and caches only static assets and the store logo; **never** carts, checkout, orders or account pages (CLAUDE.md rule 8). Optional later: `experimental.useOffline` for retrying navigations.
- **Dashboard settings:** Store settings › App: app name and short name (default from the store name), icon preview on Android and iPhone, install prompt on/off (on by default).
- Offline and unpublished stores (CLAUDE.md rule 12) serve no store manifest. Push notifications to customers stay with F-14 (needs a provider).
- The seller dashboard's own install button (`install-app-button.client.tsx`) keeps the Tallaby brand; not part of this feature.
**Status:** [Planned]

- **F-36a · P1 · deps: —** Host-aware `manifest.ts`: resolve the store from the host the same way storefront pages do (subdomain and custom domain, published only); Tallaby manifest otherwise; tests for marketplace, subdomain, custom domain, offline store. Check `proxy.ts`, which today skips `manifest.webmanifest`.
- **F-36b · P1 · deps: F-36a** Icon route (`/app-icon/[size]`, `next/og`) from the store logo, maskable variant, initials fallback, seller-scoped cache tag purged on logo or name change; `<head>` icon and theme tags on store pages.
- **F-36c · P1 · deps: F-36a** Install prompt component (Android event + iPhone guide), store theme colours, Arabic and English, 30-day dismissal.
- **F-36d · P2 · deps: F-36a** Service worker + branded offline page, with the security headers from the Next.js PWA guide; never caches cart, checkout, order or account routes.
- **F-36e · P2 · deps: F-36a** Store settings › App (name, short name, previews, prompt switch); stored in the existing store settings JSON, so no migration expected (check first).

### F-37 Tallaby affiliate program (sellers refer sellers) — P1 · owner request · Needs approval (money)

**Why:** Owner, 2026-10-29: grow Tallaby through its own sellers, like EasyOrders' "اربح معنا بالتسويق بالعمولة". A seller (or anyone with a Tallaby seller account) shares their referral link; when the people they bring sign up and **top up their store wallet**, the referrer earns **20 % of every top-up, for life**, paid **in cash** (bank account or Vodafone Cash), **not** as wallet balance.
Not the same as F-18 (a seller's own marketers for their store) and not the marketplace customer affiliates (`affiliates` / `affiliate_commissions` tables), which stay untouched.
**What (seller dashboard page "اربح معنا" / "Earn with us"):**
- Header: "اربح معنا بالتسويق بالعمولة" and the explanation: share your link with your referral code and earn 20 % for life of any amount the sellers you bring top up; paid in cash, not wallet credit.
- **Your commission:** total earned, available to withdraw, already paid (EGP).
- **Your link:** `https://tallaby.com/?ref=<code>` (opens signup with the code kept), with Copy, WhatsApp and Facebook share buttons. Short, readable code per seller.
- **Progress to unlock withdrawal:** "X / 10 successful referrals" and "X / 10 stores created through your link" (owner rule, copied from the EasyOrders text: withdrawal opens after **at least 10 successful referrals and 10 stores**).
- **Your referrals:** list of referred sellers (store name only, masked contact), sign-up date, stores, total topped up, your commission.
- **Withdraw:** "Request withdrawal" (bank account or Vodafone Cash details) → the Tallaby team pays and marks it paid in Admin; until then it also offers "Contact support on WhatsApp". Minimum withdrawal amount: to decide.
**Money rules (to confirm in F-37a):**
- Commission is earned only on **succeeded** top-ups (`seller_wallet_top_ups.status = 'succeeded'`, Kashier webhook or admin-approved manual top-up), at 20 % computed in integer piastres, one ledger row per top-up (unique claim on `top_up_id`, `ON CONFLICT DO NOTHING`, CLAUDE.md rule 7).
- It is **its own ledger**, separate from the store wallet and the customer wallet; it never changes any wallet balance. Paid out only by an admin action that records the payout.
- A reversed or refunded top-up reverses its commission. Self-referral (same person, same phone/card, same device) and fake accounts are blocked or held for review; commissions stay "pending" for N days before they become withdrawable.
- Attribution: the code is saved at signup (link opened in the last 60 days, first link wins); a seller cannot change their referrer later, cannot refer themselves.
**Open decisions for the owner (F-37a):** what counts as a "successful referral" (signed up / published a store / first top-up / first delivered order)? Are "10 referrals" and "10 stores" two separate counts? Is 20 % on top-ups sustainable against the EGP 5-per-order fee (PLAN.md §13)? Minimum payout and how often? Do customers (non-sellers) get links too?
**Status:** [Planned]

- **F-37a · P1 · deps: owner approval** Design note: the open decisions above, the commission ledger, fraud rules, and confirmation that the business model (PLAN.md §13) is changed only by adding this payout.
- **F-37b · P1 · deps: F-37a** Migration: `sellers.referral_code` (unique), `sellers.referred_by_seller_id`, `sellers.referred_at`; server-only `referral_commissions` (`referrer_seller_id`, `referred_seller_id`, `top_up_id` unique, `amount numeric(10,2)`, `status` pending | available | paid | reversed, timestamps) and `referral_payouts` (`referrer_seller_id`, `amount`, `method` bank | vodafone_cash, masked destination, `reference`, `paid_by`, `paid_at`); RLS on, no policies. Mirror in `schema.ts` / `relations.ts`.
- **F-37c · P1 · deps: F-37b** Attribution: `?ref=` on tallaby.com and the dashboard signup, kept in a 60-day first-party cookie, saved once in `ensureSellerAccount`; tests for self-referral and overwrite attempts.
- **F-37d · P1 · deps: F-37b** Commission posting on succeeded top-ups (same transaction as the top-up confirmation or a follow-up idempotent job), reversal on refund, pending → available after the hold.
- **F-37e · P1 · deps: F-37d** Dashboard page "اربح معنا" (both languages, sidebar entry under Account & help), share buttons, progress bars, referrals list, withdrawal request.
- **F-37f · P1 · deps: F-37d** Admin: referrals overview, commissions per referrer, flagged/suspicious, withdrawal requests, "mark paid" with reference (audited in `admin_audit_log`).
- **F-37g · P2 · deps: F-37e** Marketing page on tallaby.com explaining the program + terms (Arabic first).

### F-31 POS and cashier — P3

**What:** Sell in a physical shop from a phone or tablet with the same products and stock; orders tagged `source = pos`. Needs F-05 (manual orders) first.
**Status:** [Planned]

### F-29 AI agent connection (MCP) — P3

**What:** An official MCP server so a seller's AI assistant can read orders and manage products (EasyOrders planned, 14 votes). Built on F-17 keys and scopes.
**Status:** [Planned]

---

## 5. Owner feature requests (intake)

Add each new request here first, with the date and the owner's words, then turn it into a §4 feature and place it in §3.

| Date       | Request (owner's words)                                                                                                                  | Feature ID                                                                                       | Status  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------- |
| 2026-10-29 | "on /products/add if form has draft data, add clear button to clear it beside \"Save as draft\"" | Product form clear-draft button (no feature ID) | Done (uncommitted) |
| 2026-10-29 | "Seller dashboard homepage new design, make good linking for everything if link of related title exists" (Claude Design: Seller Dashboard v2) + WhatsApp channel link | Dashboard home redesign (no feature ID) | Done (uncommitted) |
| 2026-10-29 | "Affiliate program for Tallaby … عمولة 20% من اي مبلغ يقومون بشحنه … كاش وليس رصيد في المحفظة … سحب عمولتك بعد تحقيق 10 إحالات ناجحة على الأقل وإنشاء 10 متاجر" (EasyOrders' page text as the model) | F-37 | Planned (needs approval) |
| 2026-10-29 | "Improve the Next.js PWA to make the application with the store name and logo" | F-36 (replaces F-06c) | Planned |
| 2026-10-29 | "when a user delete a product, it goes to Trash for 30 days so user can restore the product back" | F-35 | Planned |
| 2026-10-29 | "the deposit roundup automatically to nearest 5" | F-21 (rounding rule) | Planned |
| 2026-10-29 | Deposit: who receives it? → "Seller's own number" | F-21 (+ F-21p = PLAN.md P3-07 Part B) | Planned |
| 2026-10-29 | "a checkbox on the product /add or edit page to show a badge for user on low stock … فاضل قطعتين والوقت قرب يخلص" | F-34 | Planned |
| 2026-10-29 | "I need to add Downsell feature, which is when a user removes an item from cart, shows a similar item but with discount or lower price popup" (+ phone mockup) | F-33 | **Removed** 2026-10-29 ("we have similar one already on live": the exit coupon pop-up) |
| 2026-10-29 | "We need to add Cross-selling feature too … العميل مثلا هيشتري باور بانك … هيلاقي تحت المنتج عرض وصلة شاحن بخصم 10٪ … enabled by default and store owner can disable it anytime" | F-32 | Planned |
| 2026-10-28 | "analyze the Easy orders features too … find the most important that we should have" (pasted EasyOrders sidebar + roadmap.easyorders.ai) | §2.3, §2.4; new F-21 … F-29; tasks added to F-01, F-02, F-03, F-07, F-08, F-11, F-13, F-15, F-16 | Planned |

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
- [ ] F-02g Confirm by WhatsApp link (no API) — P0
- [ ] F-02f Checkout OTP — **blocked: no OTP/WhatsApp API/SMS provider yet**
- [ ] F-03e Missed-order reminders
- [ ] F-04c Orders bulk actions
- [ ] F-05c Send order link
- [ ] F-21p Seller-collected payments (PLAN.md P3-07 Part B) — needed by the deposit
- [ ] F-21a Deposit design (owner approval)
- [ ] F-21b Deposit migration + settings
- [ ] F-21c Deposit checkout + seller confirm
- [ ] F-25a Checkout form settings
- [ ] F-25b Thank-you page settings
- [ ] F-07f Bundles
- [ ] F-32a Cross-sell design note (owner OK)
- [ ] F-32b Offers migration (`product_cross_sells`, `stores.cross_sell_enabled` default on)
- [ ] F-32c Cross-sell in product form + store switch
- [ ] F-32d Cross-sell on the store product page and cart
- [ ] F-32e Cross-sell discount at checkout
- [ ] F-34a Low-stock badge migration (`show_low_stock_badge`, `low_stock_threshold`)
- [ ] F-34b Checkbox + threshold in the product form
- [ ] F-34c Badge on the store product page and cards
- [ ] F-35a Trash migration (`products.deleted_at`, `deleted_by`)
- [ ] F-35b Hide trashed products everywhere
- [ ] F-35c Trash / restore / delete-forever actions
- [ ] F-35d Trash page + undo toast
- [ ] F-35e 30-day purge job
- [ ] F-36a Store manifest per host
- [ ] F-36b App icons from the store logo
- [ ] F-36c Install prompt on the store
- [ ] F-37a Affiliate design note + open decisions (owner approval)
- [ ] F-37b Affiliate migration (referral code, commissions, payouts)
- [ ] F-37c Referral attribution at signup
- [ ] F-37d Commission on succeeded top-ups
- [ ] F-37e "اربح معنا" dashboard page
- [ ] F-37f Admin referrals + payouts
- [ ] F-13b Minimum order + store free-shipping threshold
- [ ] F-22a Recent orders endpoint
- [ ] F-22b Sales pop-up on the store
- [ ] F-24a Bulk edit server action
- [ ] F-24b Bulk edit UI
- [ ] F-15b Per-product views
- [ ] F-03f Shipping cost on missed orders
- [ ] F-04d Picking list
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
- [ ] F-01e Repeat order
- [ ] F-07d Upsell / cross-sell
- [ ] F-08c Funnel steps
- [ ] F-10c Inventory page
- [ ] F-11c Shareable catalog
- [ ] F-13a Automatic discounts
- [ ] F-13c Coupons in cart + free gift
- [ ] F-14a / F-14b Customer notifications
- [ ] F-15a Reports upgrade
- [ ] F-16a Email campaigns
- [ ] F-16b Retargeting audiences
- [ ] F-16c WhatsApp broadcasts
- [ ] F-16d Subscribers list
- [ ] F-17a Public API & webhooks
- [ ] F-23a Back-in-stock alerts
- [ ] F-23b Pre-orders
- [ ] F-26a Campaign tracking (UTM)
- [ ] F-18 Store affiliates / referral links
- [ ] F-19 Gift cards & store credit
- [ ] F-20 Loyalty points
- [ ] F-27 A/B tests
- [ ] F-28 Wholesale pricing
- [ ] F-29 AI agent connection (MCP)
- [ ] F-04e Returns barcode scan
- [ ] F-36d Store service worker + offline page
- [ ] F-36e Store settings › App
- [ ] F-37g Affiliate program page on tallaby.com
- [ ] F-16e Win-back messages
- [ ] F-24c Update products from Excel
- [ ] F-24d Product order in category
- [ ] F-30a Purchase on delivery (CAPI)
- [ ] F-30b Pixel event toggles
- [ ] F-31 POS and cashier
- [ ] F-32f Cross-sell report
- [ ] F-34d Stock badge builder element

---

## 7. Log

Newest first. One entry per finished task or decision: date, task, what changed, migrations (number, staging/production status), verification, notes.

### 2026-10-29 — Website publish fix + celebration, product form "Clear" draft (owner)

- Bug: `storeTemplateChosen` (packages/lib/src/store-sites/template-choice.server.ts) always returned false for a never-published store: in a one-table select Drizzle renders columns unqualified, so the EXISTS subquery compared `"store_id" = "id"` inside `template_installs`. Website › Overview kept showing "Choose a template" and Publish refused with `templateNotChosen` after a template was applied. The subquery now qualifies its columns. Same pattern still in `packages/lib/src/admin/coupons-admin.server.ts` (`isAffiliateCoupon` on one-table selects), not changed.
- Website › Overview: going live opens the "Your store is live!" confetti pop-up (shared `publish-celebration.client.tsx`, also used by the home checklist).
- /products/add: a "Clear" button beside "Save draft" (header and mobile bar) while a local draft is stored; it asks first, then empties the form and the stored draft. New strings in ar + en.
- No migration. Verified: dashboard typecheck, dashboard tests, products/add tests; the fixed query checked against the dashboard DB. Lint still crashes inside ESLint. Browser QA still to do.

### 2026-10-29 — Dashboard home redesign (Seller Dashboard v2, owner)

- Home page rebuilt to the Claude Design `Seller Dashboard v2` layout: setup guide as numbered step cards with a progress bar; KPIs = sales, orders, **store visits**, **conversion** (each with a sparkline and period delta); a metrics strip (average order, new customers, store wallet, rating); sales chart + **customer journey** (visits → carts → orders, coupon tip on drop-off); attention / top products / **traffic sources**; recent orders; questions; **community card** (WhatsApp channel `https://whatsapp.com/channel/0029Vb9CWoJInlqNOoVPaN2X` + Tallaby socials).
- Every card and metric links to its page: sales → `/financial`, orders and new customers → `/orders`, visits/conversion/journey/sources → `/stores/[id]/analytics`, wallet → `/wallet` (top-up when negative), rating → `/reviews`, drop-off tip → `/coupons`, no-traffic state → the store's social links page.
- Visits and sources come from Tallaby's storefront GA4 (sessions; `apps/dashboard/lib/analytics/home-traffic.*`, cached 1 h per seller + stores, purged by Store views › Refresh). Carts and orders come from the DB, store websites only. Left out because there is no data or page for them yet: per-step tutorial videos, payments/SEO setup steps, abandoned-cart count (F-03).
- No migration. Verified: dashboard typecheck, vitest (home + analytics, 30 tests), new SQL run on staging. `pnpm lint` crashes inside ESLint itself (ESLint 10 / typescript-eslint) before linting any file. Manual browser QA with a seller login is still to do.

### 2026-10-29 — Tallaby affiliate program request (owner)

- New F-37 (P1, after F-36, **needs approval**): sellers share a referral link and earn 20 % of every succeeded store-wallet top-up by the sellers they bring, for life, paid in cash by the Tallaby team; withdrawal unlocks after 10 successful referrals and 10 stores. Own ledger (`referral_commissions`, `referral_payouts`), never touches wallets. Separate from F-18 and from the marketplace `affiliates` tables. Open decisions listed in F-37; no migration written.

### 2026-10-29 — Store app (PWA) request (owner)

- New F-36 (P1, after F-35), replacing F-06c: installing a store website gives an app with the store's name, logo and colours. Found in code: one static Tallaby manifest (`apps/ecommerce/app/manifest.ts`) serves every host, and there is no service worker. Next 16 docs checked: `manifest.ts` turns dynamic when it uses a request-time API, so it can read the host. No migration expected.

### 2026-10-29 — Product trash request (owner)

- New F-35 (P1, after F-34): deleted products go to a Trash for 30 days and can be restored; a daily job deletes them for good after that. Found in code: today's `deleteProduct` (`apps/dashboard/actions/products.ts`) is a hard delete. Planned migration: `products.deleted_at`, `deleted_by` (before deploy, since product queries select every column). Not written yet.

### 2026-10-29 — Downsell removed (owner)

- F-33 removed: the live exit coupon pop-up (`coupons.popup_trigger = 'exit'`, 0114) already covers it. Its row, tasks and checklist items are gone, the ID is retired, and the mockup file is deleted. F-32b is back to a cross-sell-only table (`product_cross_sells`, `stores.cross_sell_enabled`).

### 2026-10-29 — Deposit check (owner question)

- Corrected §2.1: storefront wallet/InstaPay payments go to Tallaby's accounts today; seller-collected payment is PLAN.md P3-07 Part B (not built). F-21 now notes this dependency and the split-payment code it can reuse.
- Owner: a percentage deposit rounds **up** to the nearest EGP 5 (piastres, capped at the order total); unit tests must cover the examples in F-21.
- Owner decided: the deposit goes to the **seller's own number**. Added F-21p (= PLAN.md P3-07 Part B, built first inside F-21) and noted it in PLAN.md §22.

### 2026-10-29 — Low-stock badge request (owner)

- New F-34 (P1, after F-33): a product-form checkbox (off by default) and threshold that show an urgency badge on the store when real stock is low, plus the existing deal countdown when a discount has an end date.
- Found in code: stores already show an automatic "متبقٍ N فقط" pill at stock ≤ 5 (`LOW_STOCK_THRESHOLD = 5`, `StoreStockLine`); the badge replaces it when ticked. Migration planned (two `products` columns), not written; `low_stock_threshold` is shared with F-10a.

### 2026-10-29 — Downsell request (owner)

- New F-33 (P1, right after F-32): a pop-up when an item is removed from the cart, offering a similar cheaper product or a discount. Owner mockup saved as `docs/roadmap/f-33-downsell-popup-mockup.webp`. Same rules as cross-sell: on by default, switchable off, nothing shown without an offer. F-07e now points here.
- F-32b's planned table is now `product_offers` with `kind` ('cross_sell' | 'downsell'), so both features share one table, one admin UI pattern and one checkout check. Still no migration written.
- Note for the build: the struck-through "old price" must be the offer product's own price, or say "instead of" the removed product's price.

### 2026-10-29 — Cross-sell request (owner)

- New F-32 (P1, right after the deposit): an offer under the product such as "charging cable −10 %" when buying a power bank, on by default (`stores.cross_sell_enabled DEFAULT true`), switchable off by the seller store-wide or per offer. Cross-sell moved out of F-07d. Migration planned (`product_cross_sells`), not written yet. Decided the same day (owner): no offer set → show nothing (no automatic suggestions).

### 2026-10-29 — No OTP service (owner)

- Owner: block by phone number only for now; F-02a is a `store_blocked_phones` table (no IP column).
- Owner: Tallaby has no OTP / WhatsApp message service. F-02f (checkout OTP) is now P2 and blocked until a provider is chosen; F-14 and F-16c (automatic WhatsApp) wait for the same decision. Added F-02g (P0): confirm orders through a prefilled `wa.me` WhatsApp link, which needs no API.

### 2026-10-29 — EasyOrders list cross-check (owner pasted all 88 items)

- The owner's list matches the one read in the browser. Ten items had no row in §2.4 (AI integration, newsletter pop-up per theme, area dropdown, vague titles, the freelancer-analytics item, and the done items: unified product settings, separate-page upsell, comparisons, offers page, video in feed); they are now mapped. No new feature IDs; priorities unchanged.

### 2026-10-28 — EasyOrders roadmap, full list (owner: "recheck the screenshot it has all things")

- The screenshot was too low-resolution to read, so the page was opened in the browser and "show more" expanded: all 88 ideas (66 waitlist) read and mapped in §2.4.
- Deposit is asked 5 separate times (~41 votes), so F-21 stays the top P1. Checked in code: customer login on store sites, sold-out marking and store order tracking are live.
- Added F-30 ad tracking (Purchase on delivery, event toggles), F-31 POS; tasks F-03f, F-04d picking list, F-04e returns scan, F-06c store PWA, F-16e win-back, F-24c Excel update, F-24d product order in category; F-12 now lists Egypt Post and auto status updates.

### 2026-10-28 — EasyOrders deep-dive (owner request)

- Mapped every item of the EasyOrders seller sidebar (pasted by the owner) to Tallaby (§2.3) and read their public roadmap ([roadmap.easyorders.ai/ar](https://roadmap.easyorders.ai/ar)); only 42 items load without JavaScript, 46 waitlist items were not visible (§2.4).
- Checked in code before calling something missing: product Excel export is live (`import-export-button.client.tsx`); the restock and sale pop-ups are static designs only; exit-intent coupon pop-up exists (0114); no OTP, deposit, UTM, checkout-field or thank-you settings found.
- Added F-21 deposit, F-22 sales pop-up, F-23 back-in-stock/pre-orders, F-24 bulk edit, F-25 checkout form + thank-you page, F-26 UTM tracking, F-27 A/B tests, F-28 wholesale, F-29 MCP; new tasks in F-01, F-02 (OTP), F-03 (reminders), F-07 (bundles, downsell), F-08 (funnels), F-11 (catalog), F-13 (minimum order, free gift), F-15 (per-product views), F-16 (retargeting, WhatsApp, subscribers). Re-ordered §3: COD risk and missed orders first.
- Still to check in code: customer login on store sites, order of product properties, category meta descriptions, hide-section in the builder, variant out-of-stock display.
- No migration written.

### 2026-10-28 — Roadmap created

- Inventory of live seller features checked in code (`apps/dashboard/app/(main)/**`, `components/layout/dashboard-routes.lib.ts`, `store_integrations_provider_check` in `0106`, `packages/ai`).
- Compared with Shopify (pricing page) and EasyOrders (easyorders.eg), 2026-10-28.
- No migration yet: each feature writes its own when its task starts. Next free number: `0115`.
