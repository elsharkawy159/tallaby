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
4. **Migrations:** hand-written, idempotent SQL in `packages/db/migrations/NNNN_name.sql`, mirrored in `packages/db/src/drizzle/schema.ts` and `relations.ts`. Check the next free number in `CLAUDE.md` rule 6 and in `packages/db/migrations/` (at 2026-10-30 the next is **`0127`**). New server-only tables: RLS on, no policies. Record every new migration in CLAUDE.md rule 6 and here. Apply to staging first; production only with owner approval. Never run `drizzle-kit generate`.
5. Every store-scoped table has `store_id` (and a check that the store belongs to the session seller). Every new string goes in both `ar.json` and `en.json` (Arabic first). Use the feature file split (`*.server.ts`, `*.data.tsx`, `*.client.tsx`, `*.dto.ts`, `*.types.ts`, `*.lib.ts`).
6. Verify each task with `pnpm lint`, `pnpm typecheck`, `pnpm test` (or `--filter`), and record manual E2E checks in §7.
7. All work happens on `main` in the main worktree (owner, 2026-10-28), unless the owner says otherwise.

---

## 1. Summary

Tallaby already gives Egyptian sellers a full store: products, orders, delivery (Tallaby, own riders, Bosta), a visual builder with 100+ templates, coupons, ads, wallets, analytics apps and AI product autofill. The biggest gaps against **Shopify** and **EasyOrders** (the Egyptian COD-first platform) are on the **order and customer side**: there is no customers list, no fake-order protection, no way for a seller to see and recover unfinished checkouts, no manual (phone/WhatsApp) orders, no invoices, and no upsell/quantity offers. These hit sales directly for COD sellers, so they lead the roadmap. Staff accounts, more carriers, product feeds and automation follow.

---

## 2. Current seller features (inventory, checked in code 2026-10-28)

### 2.1 Live

| Area             | What sellers have today                                                                                                                                                                                                                                              | Where                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Account & stores | Signup (email/Google), up to 3 stores on Free, store switcher, plan & usage page, heard-about-us                                                                                                                                                                     | `app/signup`, `app/(main)/stores`, `settings/plan`              |
| Products         | Add/edit physical & digital products, variants, images, Excel import, import from URL, seller categories & brands, social proof (seller-added reviews, live views)                                                                                                   | `app/(main)/products/**`                                        |
| AI               | Add/Edit product with AI (photos, PDF, text → both languages, SEO), daily cap, AI usage tab                                                                                                                                                                          | `products/add/ai`, `packages/ai`                                |
| Store catalog    | Choose which products each store shows                                                                                                                                                                                                                               | `stores/[storeId]/catalog`                                      |
| Orders           | Order list, stages, order details, WhatsApp/call buttons, Bosta ship + bulk ship, missed orders (Not completed: WhatsApp/call, contacted, reminder email shown)                                                                                                      | `app/(main)/orders/**`                                          |
| Delivery         | Delivery tracking, own riders, store shipping zones (places, free-over, COD per zone), Tallaby delivery, Bosta app                                                                                                                                                   | `orders/delivery`, `orders/riders`, `stores/[storeId]/shipping` |
| Payments         | COD; the seller chooses which methods the store shows (InstaPay, Vodafone Cash, e& Cash), but those transfers still go to **Tallaby's** accounts. Paying the seller's own numbers with seller confirmation is PLAN.md P3-07 Part B, not built (corrected 2026-10-29) | `stores/[storeId]/settings/payments`                            |
| Money            | Store wallet (can go negative), top-ups, account statements, reports, flat EGP 5 fee per delivered order, 7-day trial (sellers before 0119), EGP 100 welcome gift for new sellers on finishing setup (30 days, pop-up)                                               | `wallet`, `financial`, `reports`, `store-wallet/welcome-gift.*` |
| Marketing        | Coupons (marketplace/store, product picker, store pop-up with trigger + countdown), paid ad packages, reviews & Q&A                                                                                                                                                  | `coupons`, `marketing`, `reviews`                               |
| Website          | Builder (element trees), 100+ templates, design system, pages, product page template, blog, forms + submissions, media library, domain & SEO, sitemap, social links, offline/publish                                                                                 | `app/(builder)`, `stores/[storeId]/website/**`                  |
| Apps             | Meta Pixel, Meta CAPI, GA4, GTM, TikTok Pixel, Snapchat Pixel, Google Sheets order export, Shopify import, Bosta                                                                                                                                                     | `stores/[storeId]/apps`                                         |
| Analytics        | Store views (GA4 via Tallaby GTM)                                                                                                                                                                                                                                    | `stores/[storeId]/analytics`, `docs/store-views.md`             |
| Notifications    | Seller notification inbox (orders, top-ups, questions, reviews, welcome gift)                                                                                                                                                                                        | `seller_notifications` (0098)                                   |
| Fulfillment      | Request Tallaby fulfillment services                                                                                                                                                                                                                                 | `settings/fulfillment`                                          |
| Help             | Help center, floating WhatsApp support, install-as-app button                                                                                                                                                                                                        | `help`, `components/layout`                                     |

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

| #   | ID   | Feature                                                    | Priority | Migration          | Approval                                    |
| --- | ---- | ---------------------------------------------------------- | -------- | ------------------ | ------------------------------------------- |
| 1   | F-02 | Fake-order protection (blocklist, WhatsApp confirm, risk)  | P0       | yes                | —                                           |
| 2   | F-03 | Missed orders (abandoned checkouts) + reminders            | P0       | yes                | —                                           |
| 3   | F-01 | Customers list (store CRM)                                 | P0       | maybe (notes/tags) | —                                           |
| 4   | F-04 | Invoices, packing slips & order export                     | P0       | no                 | —                                           |
| 5   | F-05 | Manual orders (phone/WhatsApp sales)                       | P0       | maybe              | **Needs approval** (order creation path)    |
| 6   | F-21 | Deposit (عربون) before shipping a COD order                | P1       | yes                | **Needs approval** (money, checkout)        |
| 7   | F-32 | Cross-sell offers under the product (on by default)        | P1       | yes                | Owner asked; design note OK (checkout)      |
| 8   | F-34 | Low-stock urgency badge (product checkbox)                 | P1       | yes (small)        | —                                           |
| 9   | F-35 | Product trash (restore within 30 days)                     | P1       | yes (small)        | —                                           |
| 10  | F-36 | Store app (PWA with the store's name and logo)             | P1       | no (expected)      | —                                           |
| 11  | F-37 | Tallaby affiliate program (20 % of referred top-ups, cash) | P1       | yes (0117)         | Approved 2026-10-29; built, 0117 on staging |
| 12  | F-38 | MersalSMS: OTP and order confirmation SMS                  | P1       | yes                | Provider cost (who pays)                    |
| 12a | F-41 | One store apps catalog (Apps, carriers, gateways)              | P1       | no                 | Built 2026-10-30                            |
| 12b | F-39 | Seller's own card gateway (Paymob, Kashier)                 | P1       | yes (0130)         | Approved 2026-10-30; built, 0130 applied 2026-10-30 |
| 13  | F-25 | Checkout form & thank-you page settings                    | P1       | yes                | —                                           |
| 14  | F-08 | Funnels: quick-order landing pages                         | P1       | maybe              | **Needs approval** (checkout)               |
| 15  | F-07 | Quantity offers, bundles, upsell                           | P1       | yes                | **Needs approval** (checkout pricing)       |
| 16  | F-22 | Sales pop-up (real recent orders)                          | P1       | no                 | —                                           |
| 17  | F-24 | Bulk product editing (prices by category, stock, status)   | P1       | no                 | —                                           |
| 18  | F-15 | Reports upgrade + per-product views                        | P1       | no                 | —                                           |
| 19  | F-06 | New-order push alerts (PWA)                                | P1       | yes                | —                                           |
| 20  | F-11 | Product feeds (Meta, Google Merchant, TikTok) + catalog    | P1       | no                 | —                                           |
| 21  | F-09 | Staff accounts & permissions                               | P1       | yes                | — (security review)                         |
| 22  | F-10 | Inventory alerts & stock history                           | P1       | yes                | —                                           |
| 23  | F-12 | More shipping carriers (Wassalha built; Mylerz, J&T, Aramex soon) | P1 | yes (0130)    | —                                           |
| 24  | F-13 | Automatic discounts, min order, free gift                  | P2       | yes                | **Needs approval** (checkout pricing)       |
| 25  | F-14 | Customer order messages (WhatsApp/SMS, confirm link)       | P2       | yes                | Provider cost                               |
| 26  | F-16 | Campaigns: email, WhatsApp, retargeting audiences          | P2       | yes                | Provider cost                               |
| 27  | F-23 | Back-in-stock alerts & pre-orders                          | P2       | yes                | —                                           |
| 28  | F-26 | Campaign tracking (UTM links, orders per campaign)         | P2       | yes                | —                                           |
| 29  | F-17 | Public API & webhooks                                      | P2       | yes                | — (security review)                         |
| 30  | F-18 | Store affiliates / referral links                          | P3       | yes                | **Needs approval** (payouts)                |
| 31  | F-19 | Gift cards & customer store credit                         | P3       | yes                | **Needs approval** (ledger)                 |
| 32  | F-20 | Loyalty points                                             | P3       | yes                | **Needs approval**                          |
| 33  | F-27 | A/B tests                                                  | P3       | yes                | —                                           |
| 34  | F-28 | Wholesale pricing                                          | P3       | yes                | **Needs approval** (checkout pricing)       |
| 35  | F-29 | AI agent connection (MCP)                                  | P3       | no                 | — (after F-17)                              |
| 36  | F-30 | Ad tracking upgrades (Purchase on delivery, event toggles) | P2       | maybe              | —                                           |
| 37  | F-31 | POS and cashier                                            | P3       | yes                | **Needs approval** (order creation path)    |

AI features (field helpers, bulk products, credits, store-build agent) stay in `PLAN.md` §22 (AI-2 … AI-5) and are not repeated here.

---

## 4. Features and tasks

Task format: **ID · Priority · deps** — what to do. Files are proposals; re-check the code first.

### F-01 Customers list (store CRM) — P0

**Why:** Sellers sell to the same people again on WhatsApp. Today they cannot see who bought, how often, or for how much.
**What:** A Customers page per store: name, phone, governorate, order count, total spent, last order, COD success rate (delivered vs refused/returned), link to orders, WhatsApp button, notes and tags, CSV export.
**Status:** [In progress] F-01a built 2026-10-30 on `main` (uncommitted, no migration). It lives in `packages/lib/src/customers/` (`@workspace/lib/customers`, `/customers/server`), not the dashboard folder, so F-02d can reuse it. `listStoreCustomers(sellerId, storeId)` and `getStoreCustomer(sellerId, storeId, key)` join `stores` on the session seller. A customer is a store's orders with the same phone (normalised like the blocklist, so it matches F-02), or the same user when there is no usable phone. Delivered = order `delivered`; refused = order `returned` or a `failed`/`returned` shipment; cancelled/refunded are left out of spend and success rate. Reads the newest 5000 orders per store. F-01b built 2026-10-30 (uncommitted): Orders › Customers (`/orders/customers`, `app/(main)/orders/customers/`), one store at a time (URL `?store=` if it is the seller's, else the sidebar's selected store). It has search (name, email, phone in any spelling), filters (all, repeat buyers, refused an order), sort (last order, most orders, most spent), three counters, and a table showing 100 rows plus "Show more". The drawer has stats, WhatsApp, Call, Block/Unblock (the F-02 blocklist actions), and the order history linking to `/orders?order=<id>`. Phone E2E is not done yet. F-01c built 2026-10-30 (uncommitted; 0121 on staging, production pending owner approval): notes and tags in the customer drawer, tags under the name in the table, a tag filter, and search also matches notes and tags. F-01d built 2026-10-30 (uncommitted, no migration): "Export (N)" downloads the rows on screen as .xlsx. F-01e store side built 2026-10-30 (uncommitted): "Order again" on the store's order page. Left: the dashboard "repeat order" (with F-05), the browser E2E.

- **F-01a · P0 · deps: —** Data: a server query that groups the store's orders by customer phone (and user id when signed in), filtered by `store_id` and the session seller. No new table. `app/(main)/stores/[storeId]/customers/customers.server.ts`.
- **F-01b · P0 · deps: F-01a** Page: table with search, sort, filters (repeat buyers, refused orders), customer drawer with order history. Sidebar entry under Orders. Both languages.
- **F-01c · P1 · deps: F-01b** Notes and tags: migration `store_customer_notes` (`store_id`, `phone`, `note`, `tags text[]`, unique per store + phone; RLS on, no policies).
- **F-01d · P1 · deps: F-01b** CSV/Excel export of the filtered list.
- **F-01e · P2 · deps: F-01b** Repeat order: from a customer, start a manual order (F-05) prefilled with their last order; on the store, a "Order again" button in the customer's order page (EasyOrders roadmap, 7 votes).
- Acceptance: a seller with two stores sees only each store's customers; another seller's IDs in the URL return nothing (isolation test).

### F-02 Fake-order protection — P0

**Why:** Refused COD orders cost sellers shipping both ways. EasyOrders sells this as a core feature.
**What:** Block a phone number from ordering on a store (phone only for now, owner 2026-10-29; IP blocking later if needed); flag risky orders (many refusals across the store, same phone many orders in minutes); optional "confirm order" step where the seller marks an order confirmed before shipping.
**Status:** [In progress] F-02a–c built 2026-10-29 on `main` (0118 on staging and production, production 2026-10-30): `packages/lib/src/stores/blocked-phones.{lib,server}.ts`, Store settings › Order protection (blocklist), "Block this customer" in the order panel, checkout refusal in `place-order.ts`. F-02g built the same day (WhatsApp "Ask to confirm" on new orders, per-store message in Order protection, 24 h unconfirmed highlight). F-02d built 2026-10-30 (uncommitted, no migration): "Refused N orders" and "Possible duplicate" chips on the order card and in the table, and a note in the order panel. F-02e built 2026-10-30 (uncommitted): per-store checkout limits per IP, phone and user, in memory per server instance (Upstash left). Left: F-02f (after F-38b).

- **F-02a · P0 · deps: —** Migration `store_blocked_phones` (`store_id`, `phone` normalised to `+20…`, `reason`, `created_at`; unique per store + phone; RLS on, no policies). Phone only (owner, 2026-10-29).
- **F-02b · P0 · deps: F-02a** Storefront checkout check: refuse a blocked phone (compared after normalising, so `010…`, `+2010…` and `2010…` all match) with a neutral message before the order is created. Touches the store-website checkout path only, not money logic; re-read `packages/lib/src/orders/place-order.ts` and keep its behaviour.
- **F-02c · P0 · deps: F-02a** Dashboard: "Block customer" on an order and on a customer (F-01), and a blocklist page under store settings.
- **F-02d · P1 · deps: F-01a** Risk badge on orders: refusal history for that phone in this store, duplicate orders within 10 minutes.
- **F-02e · P2 · deps: F-02b** Rate limit per IP/phone on store checkout (Upstash).
- **F-02g · P0 · deps: —** Confirm by WhatsApp, **no API or provider needed**: the order page in the dashboard gets a "Ask to confirm" button that opens WhatsApp (`wa.me`) to the customer with a prefilled message (order number, items, total, address; editable template per store), and a "Confirmed" action that moves the order to the existing confirmed stage. Optional: the store's thank-you page shows "Confirm on WhatsApp", which opens a prefilled message to the seller's number. Orders not confirmed after N hours are highlighted.
- **F-02f · P2 · Provider chosen: MersalSMS (F-38, owner 2026-10-30). deps: F-02a, F-38b** OTP check at store checkout: the seller lists phones (or turns on "all first-time phones" / "phones with a refusal") that must enter a code before the order is placed (EasyOrders "الأرقام المحظورة OTP"). Code sent by SMS or WhatsApp; attempts limited; table `store_checkout_otps` (hashed code, expiry; RLS on, no policies).

### F-03 Missed orders (abandoned checkouts) + reminders — P0

**Why:** Many COD buyers fill name and phone, then leave. Sellers can call them and win the sale.
**What:** When a visitor enters a phone at store checkout, save a lead with the cart. The seller sees a "Not completed" list with phone, items, total and a WhatsApp button prefilled with a message; leads that turn into orders drop off.
**Status:** [Done] 2026-10-29 on `main` (0120 on staging and production, production 2026-10-30; design `docs/superpowers/specs/2026-10-29-missed-orders-design.md`). Owner choices: WhatsApp + Call buttons; consent line «ممكن نتواصل معاك بخصوص طلبك», no checkbox; the existing once-a-day store-branded cart email is the reminder (signed-in customers only, no email field for guests), shown on the lead as "Reminder email sent". Leads are saved when a shipping address is picked or added (not per keystroke). Automatic WhatsApp stays with F-14.

- **F-03a · P0 · deps: —** Migration `store_checkout_leads` (`store_id`, `phone`, `name`, `governorate`, `items jsonb`, `subtotal numeric(10,2)`, `order_id`, `contacted_at`, timestamps; RLS on, no policies; unique open lead per store + phone).
- **F-03b · P0 · deps: F-03a** Storefront: save/update the lead (debounced) once a valid phone is typed; link `order_id` when the order is placed. Consent text on the checkout form.
- **F-03c · P0 · deps: F-03b** Dashboard list under Orders: filter by date, mark contacted, WhatsApp message template (editable per store).
- **F-03d · P2 · deps: F-03c** Auto-delete leads after 30 days (cron).
- **F-03f · P1 · deps: F-03b** Show the shipping cost and total (not only the subtotal) on each missed order.
- **F-03e · P1 · deps: F-03b** Reminders (EasyOrders roadmap, 17 votes): one-click WhatsApp reminder from the list now; an automatic email reminder when the lead has an email (same claim pattern as the marketplace `abandoned-carts` cron, once per lead); automatic WhatsApp later with F-14.

### F-04 Invoices, packing slips & order export — P0

**Why:** Sellers print a slip for each parcel and share invoices with customers.
**What:** Printable A4 invoice and A6 packing slip (store logo, order, items, COD amount, barcode), bulk print selected orders, CSV/Excel export of orders, bulk status change.
**Status:** [In progress] F-04a built 2026-10-30 on `main` (uncommitted, no migration): `/print/orders?doc=invoice|slip&ids=…&lang=ar|en` in `apps/dashboard/app/print/orders/`, opened from a Print menu in the order panel and a "Print (N)" menu on the orders list (the orders on screen, at most 50). Barcode left to F-04e. F-04b built 2026-10-30 (uncommitted, no migration): "Export (N)" on the orders list downloads the orders on screen as .xlsx. Browser E2E of both pending. F-04c built 2026-10-30 (uncommitted, no migration): select orders on the list (card checkboxes, "Select all", table checkboxes) for a bar with Confirm, Out for delivery, Delivered, Cancel, Print and Export of the selection. F-04d built 2026-10-30 (uncommitted, no migration): "Picking list (A4)" in the list's Print menu (`doc=picking`), one sheet adding up the printed orders' items. F-04e built 2026-10-30 (uncommitted, no migration): Code 128 order barcode on invoices and slips, Orders › Scan returns (`/orders/scan`). Left: browser E2E.

- **F-04a · P0 · deps: —** Print views (HTML + print CSS, Arabic RTL and English) for one or many orders; store-branded.
- **F-04b · P0 · deps: —** Orders CSV/Excel export with current filters.
- **F-04c · P1 · deps: —** Bulk actions on the orders list: change stage (only the transitions the seller may already make), print, export.
- **F-04d · P1 · deps: —** Picking list: for a day or the selected orders, total quantity per product, variant and colour to prepare (EasyOrders seller: "ضروري جدا"). Printable.
- **F-04e · P2 · deps: F-04a** Barcode on slips; scan a returned parcel's barcode (phone camera) to open the order and mark it returned.

### F-05 Manual orders (phone/WhatsApp sales) — P0 · Needs approval

**Why:** Much of the sales happen in chat. Sellers want those orders in the same list, shipped the same way.
**What:** "Create order" in the dashboard: pick products/variants, customer name, phone, address, shipping zone, discount, payment (COD or already paid). The order is tagged `source = manual` and follows the normal stages, shipping and fee rules.
**Status:** [Planned] F-05a design note written 2026-10-30 (`docs/superpowers/specs/2026-10-30-manual-orders-design.md`); waiting on owner approval and answers.

- **F-05a · P0 · deps: owner approval** Design note: how a manual order goes through the existing order creation (`place-order.ts`) without changing money logic; fee and wallet behaviour equal to a storefront COD order. Get the owner's OK.
- **F-05b · P0 · deps: F-05a** Migration if needed (an order `source` value), then the create-order form and server action (`requireStore`, stock check).
- **F-05c · P1 · deps: F-05b** "Send order link" option: create a pending order and send the customer a link to confirm/pay.

### F-06 New-order push alerts (PWA) — P1

**Why:** EasyOrders and Shopify have apps that ping on every order; Tallaby sellers find out late.
**What:** Web push for the installed dashboard PWA (and browser): new order, order refused, low stock. Settings per type.
**Status:** [Live, uncommitted] F-06a/b built 2026-10-30 (Settings › Phone alerts; 0124 on staging). Needs VAPID env + a Supabase webhook on `seller_notifications` INSERT (see §7). Browser E2E pending.

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
**Status:** [Planned] F-09a design note + security review written 2026-10-30 (`docs/superpowers/specs/2026-10-30-staff-accounts-design.md`); waiting on the owner's answers (§10 of the note) before F-09b.

- **F-09a · P1 · deps: —** Design note: how `requireSeller`/`requireStore` resolve a staff member to the owner's seller id, and every action that must check the role. Security review before code.
- **F-09b · P1 · deps: F-09a** Migration `store_staff` (`seller_id`, `user_id`, `store_ids`, `role`, invite token, status) and audit log entries.
- **F-09c · P1 · deps: F-09b** Invite flow, accept page, staff list, role-gated sidebar and server checks.

### F-10 Inventory alerts & stock history — P1

**What:** Low-stock threshold per product/variant, alert in notifications (and push, F-06), stock change history (who/why: order, manual edit, import, return).
**Status:** [Live, uncommitted] F-10a–c built 2026-10-30 (`stock_movements` + triggers, `low_stock` bell/push, Products › Inventory; 0125 on staging). Browser E2E pending.

- **F-10a · P1 · deps: —** Migration: `low_stock_threshold` on products/variants and `stock_movements` (RLS on, no policies).
- **F-10b · P1 · deps: F-10a** Write movements on order, cancel/return, edit and import; low-stock notification type.
- **F-10c · P2 · deps: F-10b** Inventory page: low-stock list, quick restock, history.

### F-11 Product feeds (Meta, Google, TikTok) — P1

**What:** A public, per-store product feed URL (CSV/XML) for Meta Commerce catalog, Google Merchant Center and TikTok catalog, with an Apps card explaining setup.
**Status:** [Live, uncommitted] F-11a/b built 2026-10-30 (feed URLs `/api/feeds/products.{xml,csv}` on the store host, Store › Apps cards). Browser E2E and feed validators pending. F-11c built 2026-10-30 (uncommitted, no migration): signed catalog links `/catalog/<token>` on the store host with a print/PDF view.

- **F-11a · P1 · deps: —** Feed route on the storefront host (published store, active products only, cached with seller-scoped tags).
- **F-11b · P1 · deps: F-11a** Apps cards with the feed URL and steps, both languages (Meta catalog, Google Merchant, TikTok). Include the product video when there is one, and map store categories to Google/Meta categories.
- **F-11c · P2 · deps: —** Shareable catalog ("Easy Catalog"): a link and a PDF of chosen products with prices and order buttons, for sending on WhatsApp.

### F-12 More shipping carriers — P1

**What:** After Bosta, add J&T Express, Mylerz and Aramex the same way (`store_integrations` provider, `shipments` carrier columns, webhook events), and Egypt Post through Wassalha's upload sheet (no API).
**Status:** [In progress] F-12c and F-12d built 2026-10-30 (local `main`, 0130 applied 2026-10-30). Mylerz, J&T Express and Aramex show as "Soon" in the catalog until F-12a/b.

- **F-12a · P1 · deps: —** Pick the next API carrier with the owner (Mylerz, J&T, Aramex); migration extends `store_integrations_provider_check` and the catalog entry gets its `provider`. Order stages update automatically from carrier webhooks, as with Bosta.
- **F-12b · P1 · deps: F-12a** Integration following `docs/fulfillment.md` and the Bosta code.
- **F-12c · P1 · Built 2026-10-30** Wassalha (Egypt Post): Store › Apps › Wassalha saves the account printed on every row (store ID = `Post_Id`, merchant, warehouse, sender, proof of delivery, package size, note; provider `wassalha`, public `config` only, 0130). Orders › "Export for Wassalha" (one order on its card / panel, or every waiting order of one store from the toolbar) downloads Wassalha's exact template (`EGYPT_POST_COLUMNS`, Sheet1) through `exportWassalhaOrders` (`packages/lib/src/shipping/wassalha-export.server.ts`, reusing `toEgyptPostRows` from the ops app): weight from the products' weights, else 998 g; COD = order total unless paid; governorate in Wassalha's spelling; bad phone / unknown governorate / not waiting / another carrier are left out and listed. Exported orders get a `shipments` row with carrier `wassalha` (Bosta can still take them over; the seller moves them to shipped/delivered by hand).
- **F-12d · P1 · Built 2026-10-30** Shipping › "Shipping companies" card: every carrier from the store apps catalog (F-41) with its state and page; Bosta keeps its "create shipments" choice there.
- **F-12e · P2** Wassalha tracking numbers: upload Wassalha's result file (or paste a number) to fill `shipments.tracking_number`, and a tracking link on the order page.

### F-13 Automatic discounts — P2 · Needs approval

**What:** Store-wide rules without a code: free shipping over X, buy X get Y, % off a category, time-limited sale.
**Status:** [In progress] F-13b minimum order built 2026-10-30 (uncommitted, Store settings › Checkout; no migration). Free-shipping threshold waits for owner approval. F-13a/F-13c need F-07a.

- **F-13a · P2 · deps: F-07a** Rules model + checkout application (server-side, one engine with coupons).
- **F-13b · P1 · deps: —** Store-wide minimum order value (checkout refuses below it, with a clear message) and a store-wide free-shipping threshold on top of the per-zone free-over that exists. **Free-shipping part built 2026-10-30 (owner asked):** Shipping › Delivery settings › Free delivery = none / free over an amount / free on every order (`settings.shipping.freeShippingOver`: null / X / 0), applied in `resolveStorefrontShipping` to zones without their own free-over (a zone's own amount wins; Tallaby's rates for uncovered places are never made free). No store had the old field set (checked on production). The minimum order value is still to do.
- **F-13c · P2 · deps: F-13a** Show available coupons in the cart and let the customer pick a free gift when a rule allows it (EasyOrders roadmap, 9 votes).

### F-14 Customer order notifications (WhatsApp/SMS) — P2

**What:** Automatic messages to the buyer: order received (with confirm link, helps F-02), shipped, out for delivery. Needs a WhatsApp Business API / SMS provider and a cost model.
**Status:** [Planned]

- **F-14a · P2 · deps: F-38b (SMS via MersalSMS); WhatsApp provider still open** Provider integration and message templates.
- **F-14b · P2 · deps: F-14a** Per-store settings and a message log table.

### F-15 Reports upgrade + per-product views — P1

**What:** Best and worst products, refusal rate by governorate, sales by source (store/marketplace/manual), conversion funnel (views → checkout → order) using store views + leads, and visits per product (EasyOrders is building this, 20 votes).
**Status:** [Live, uncommitted] F-15b (2026-10-30): "Views (30 days)" on the products table and edit page. F-15a (2026-10-30): `/reports` per store (funnel, sources, refusal by governorate, best/worst products). No migration. Browser and GA4 E2E pending.

- **F-15a · P2 · deps: F-03** Report queries (cached per seller + store) and charts.
- **F-15b · P1 · deps: —** Per-product views: read GA4 `page_path` for product pages from the existing store-views report (`apps/dashboard/lib/analytics/`, `docs/store-views.md`), show views and views → orders on the products list and product page. No migration.

### F-16 Campaigns: email, WhatsApp, retargeting — P2

**What:** Send a branded email to store subscribers and past customers (new products, sale), with unsubscribe and limits; WhatsApp broadcasts through the F-14 provider; export customer audiences for Meta/TikTok retargeting.
**Status:** [In progress] F-16d subscribers list and F-16b audience export built 2026-10-30 (uncommitted, no migration; Marketing › Newsletter subscribers, Orders › Customers › Export audience). F-16a email campaigns and F-16e win-back email built 2026-10-30 (uncommitted; Marketing › Email campaigns `/marketing/emails`; `0129` on staging, production pending; dashboard needs `BACKEND_API_URL` + `INTERNAL_API_SECRET`; E2E pending). Left: F-16c (WhatsApp, no provider yet; F-16e's WhatsApp part waits for it).

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
**Status:** [Done, E2E pending] F-22a–b built 2026-10-30 (uncommitted, no migration; settings in `stores.settings.salesPopup`). Store settings › Sales pop-up. Browser E2E on staging pending.

- **F-22a · P1 · deps: —** Public, cached, store-scoped endpoint returning the last N orders as `{product, governorate, minutesAgo}` only; hidden when there are fewer than 3 recent orders.
- **F-22b · P1 · deps: F-22a** Storefront toast element + setting; respects reduced motion; off on checkout.

### F-23 Back-in-stock alerts & pre-orders — P2

**What:** "Notify me" on out-of-stock products and variants (phone or email); a message when stock returns. Optional pre-order: accept orders for an out-of-stock product with an expected date. The `popup-restock` design exists but is static.
**Status:** [In progress] F-23a back-in-stock email alerts built 2026-10-30 (uncommitted; 0126 on staging; daily cron). Left: F-23b pre-orders.

- **F-23a · P2 · deps: F-10b** Migration `store_stock_subscriptions` (RLS on, no policies), storefront form, send on restock.
- **F-23b · P3 · deps: F-23a** Pre-order flag and date on products; order stage label.

### F-24 Bulk product editing — P1

**Why:** Sellers change prices often (EasyOrders waitlist, 7 votes: "raise every product in a category at once").
**What:** Select products (or a whole category) and change price by % or amount, set discount, stock, status or store visibility in one action, with a preview and undo. Product Excel export already exists (`products/_components/import-export-button.client.tsx`).
**Status:** [In progress] F-24a–b built 2026-10-30 (uncommitted, no migration): "Edit selected" on Products with preview and 10-minute Undo. Store visibility left out (Catalog settings covers it). F-24d built 2026-10-30 (uncommitted; 0128 on staging, production pending): Products › Categories › "Arrange products" drag-to-sort, used as the "Featured" default sort of store category pages and builder category lists. F-24c built 2026-10-30 (uncommitted, no migration): Products › Import/Export › "Update products from Excel" (download, edit, preview, apply). Left: browser E2E.

- **F-24a · P1 · deps: —** Server action that applies a change to many of the seller's products/variants in one transaction (ownership checked per row), plus cache purge.
- **F-24b · P1 · deps: F-24a** UI on the products list: selection (including "select all"), "Edit selected", preview table, undo for 10 minutes.
- **F-24c · P2 · deps: —** Update existing products from the Excel sheet (match by SKU or product id), including variant prices and stock. Check what the import does today first.
- **F-24d · P2 · deps: —** Manual product order inside a category (drag to sort), used by the store's category pages. Check what exists first.

### F-25 Checkout form & thank-you page settings — P1.

**Why:** EasyOrders "نموذج الشراء" (planned, 17 votes) and "تعديل صفحة الشكر". COD sellers want a short form and a thank-you page that keeps the customer.
**What:** Per store: which checkout fields show and are required (email, second phone, area, notes, custom question), field order, governorate/area as dropdowns; a thank-you page with the seller's message, WhatsApp button, suggested products and pixel events kept.
**Status:** [Live, uncommitted] F-25a/b built 2026-10-30 (Store settings › Checkout; answers go into the order notes; thank-you message, WhatsApp confirm button, suggested products). No migration. Browser E2E pending.

- **F-25a · P1 · deps: —** Store setting (jsonb on `stores` or a `store_checkout_settings` table) + dashboard page; validated server-side at checkout (phone and the delivery address stay required).
- **F-25b · P1 · deps: F-25a** Thank-you page settings and rendering on the store order-confirmation page.

### F-26 Campaign tracking (UTM links) — P2

**What:** A link builder for ads and influencers (`utm_source/medium/campaign`), store the first-touch UTM on the order, and show orders and revenue per campaign.
**Status:** [Live, uncommitted] F-26a built 2026-10-30 (no migration): first-touch UTM cookie on the store host, stored in `orders.metadata.utm` (not a new column), Reports › Campaigns link builder and report.

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
**Status:** [Live, uncommitted] F-30a/b built 2026-10-30 (no migration; settings in the store's `meta_pixel` config): Purchase at order or on delivery (CAPI), per-event toggles in Store › Apps › Meta Pixel. Real Meta test event pending.

- **F-30a · P2 · deps: —** Store setting + server event on the delivered transition (idempotent, one event per order, same `event_id` rules as today's CAPI code in `stores/[storeId]/apps/meta-capi.server.ts`).
- **F-30b · P2 · deps: F-30a** Event toggles in the Apps page.

### F-32 Cross-sell offers under the product — P1 · owner request

**Why:** Owner, 2026-10-29: a customer buying a power bank sees, under the product, "add a charging cable for 10 % off". It raises order value with one tap.
**What:** On the store's product page (under the buy box) and in the cart, show one or a few offers: "Add <product> − X %". The customer ticks it or taps "Add"; both go into the cart and the discount is applied **server-side at checkout** only while the main product is in the cart. **On by default for every store; the seller can turn it off at any time** (store-wide switch, plus per-offer on/off).

- The seller links offers in the product form ("Frequently bought with"): pick a product/variant and a discount (10 % prefilled, % or fixed EGP).
- Offers show only for active, in-stock products of the same store (and in that store's catalog).
- Fits the builder: a `cross-sell` element in the product-page template (tree element, CLAUDE.md rule 17), with a fallback placement for stores whose product page lacks it.
- **Decided (owner, 2026-10-29): when the seller has set no offer for a product, show nothing.** No automatic suggestions; the cross-sell block renders only when the product has at least one active offer whose product is active and in stock.
  **Status:** [Planned] F-32a design note written 2026-10-30 (`docs/superpowers/specs/2026-10-30-cross-sell-design.md`); waiting on owner OK and answers.

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
  **Status:** [In progress] F-34a–c built 2026-10-30 on `main` (uncommitted; 0122 on staging, production pending owner approval before the deploy). Checkbox + threshold in the product form's "Reviews, live views and stock alert" section; the store product page's stock element becomes the urgency badge (follows the selected variant) and the store's generic product card shows "N left". F-34d built 2026-10-30 (uncommitted): `productStockBadge` builder element. Left: browser E2E.

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
  **Status:** [In progress] F-35a–e built 2026-10-30 on `main` (uncommitted; 0123 on staging, production pending owner approval before the deploy). Delete on Products moves to Trash with an Undo toast; Products › Trash restores or deletes forever; a daily cron purges after 30 days. Trashed products are hidden by setting status `draft` (see the §7 log for what that covers). Left: browser E2E, a Trash count in the sidebar, admin lists marking "in trash".

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
  **Status:** [In progress] F-36a–e built 2026-10-29 on `main` (uncommitted, no migration). Owner changes (2026-10-29): icons come from the store **favicon** first (then logo, then initials), and the timed install prompt became a **"Download application" button in every store footer**, hideable in Store settings › App. Left: custom app name/short name and brand theme colour (later), phone E2E (Android install + iPhone guide).

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
  **Decided (owner, 2026-10-29, design note `docs/superpowers/specs/2026-10-29-affiliate-program-design.md`):** a successful referral = the referred seller's first top-up succeeded; 10 referrals and 10 stores are two separate counts (stores of referred sellers, deleted ones excluded); minimum withdrawal EGP 500 (the whole balance per request); no hold (top-ups are never refunded), so commissions are withdrawable at once; only seller accounts get links. ~~Open decisions:~~ what counts as a "successful referral" (signed up / published a store / first top-up / first delivered order)? Are "10 referrals" and "10 stores" two separate counts? Is 20 % on top-ups sustainable against the EGP 5-per-order fee (PLAN.md §13)? Minimum payout and how often? Do customers (non-sellers) get links too?
  **Status:** [Built, 2026-10-29] F-37a–f done (plan `docs/superpowers/plans/2026-10-29-affiliate-program.md`); 0117 applied on staging and production (production 2026-10-30); browser QA and the attribution integration test (needs 0113 on staging) still to do. F-37g built 2026-10-30 (uncommitted): `tallaby.com/affiliates`.

- **F-37a · P1 · deps: owner approval** Design note: the open decisions above, the commission ledger, fraud rules, and confirmation that the business model (PLAN.md §13) is changed only by adding this payout.
- **F-37b · P1 · deps: F-37a** Migration: `sellers.referral_code` (unique), `sellers.referred_by_seller_id`, `sellers.referred_at`; server-only `referral_commissions` (`referrer_seller_id`, `referred_seller_id`, `top_up_id` unique, `amount numeric(10,2)`, `status` pending | available | paid | reversed, timestamps) and `referral_payouts` (`referrer_seller_id`, `amount`, `method` bank | vodafone_cash, masked destination, `reference`, `paid_by`, `paid_at`); RLS on, no policies. Mirror in `schema.ts` / `relations.ts`.
- **F-37c · P1 · deps: F-37b** Attribution: `?ref=` on tallaby.com and the dashboard signup, kept in a 60-day first-party cookie, saved once in `ensureSellerAccount`; tests for self-referral and overwrite attempts.
- **F-37d · P1 · deps: F-37b** Commission posting on succeeded top-ups (same transaction as the top-up confirmation or a follow-up idempotent job), reversal on refund, pending → available after the hold.
- **F-37e · P1 · deps: F-37d** Dashboard page "اربح معنا" (both languages, sidebar entry under Account & help), share buttons, progress bars, referrals list, withdrawal request.
- **F-37f · P1 · deps: F-37d** Admin: referrals overview, commissions per referrer, flagged/suspicious, withdrawal requests, "mark paid" with reference (audited in `admin_audit_log`).
- **F-37g · P2 · deps: F-37e** Marketing page on tallaby.com explaining the program + terms (Arabic first).

### F-38 MersalSMS: OTP and order confirmation SMS — P1 · owner request · Provider cost

**Why:** Tallaby had no SMS or OTP provider, so checkout OTP (F-02f) and automatic order messages (F-14) were blocked. The owner chose [MersalSMS](https://mersalsms.com) (2026-10-30).
**What:** A server-only SMS client for MersalSMS. It sends checkout OTP codes and order-confirmation SMS from the store's name (sender ID). Every send is logged and capped. According to its home page (read 2026-10-30), MersalSMS offers an SMS API for OTP and transactional messages and unlimited sender IDs. It does not mention WhatsApp. Prices and API docs are not public (portal: portal.mersalsms.com).
**Status:** [Planned]

- **F-38a · P1 · deps: owner** Account and decisions: get the API docs and credentials from the MersalSMS portal; price per SMS; who pays (Tallaby, or a charge on the store wallet through `postStoreWalletEntry`, which needs approval, rule 7 / `PLAN.md` §13); sender ID per store or one "Tallaby" sender; daily caps per store.
- **F-38b · P1 · deps: F-38a** `packages/lib/src/sms/mersal.server.ts`: send (with a timeout, no retry loops, no phone or code in logs). Credentials only in server env (rule 10). Migration `sms_messages` (store_id, phone, kind `otp` | `order_confirm` | …, status, provider id, cost piastres, created_at; RLS on, no policies) for the log and caps.
- **F-38c · P1 · deps: F-38b** Order confirmation SMS: on a new store order, send the customer a message with the order number and a confirm link; the link moves the order to `confirmed` (the same stage as F-02g's "Confirmed" button). Per-store switch and template in Store settings › Order protection.
- **F-38d · P1 · deps: F-38b** Unblocks **F-02f** (checkout OTP over SMS) and **F-14a** (order status SMS: shipped, out for delivery).
- Acceptance: no secret in client code or logs; a store over its daily cap sends nothing more that day; a confirm link works only for its own order and store.

### F-39 Seller's own card gateway (Paymob, Kashier) — P1 · owner request · Approved 2026-10-30

**Why:** Sellers with their own Paymob or Kashier account want card payment on their store, paid straight to them. Until now storefronts offered no card payment (Tallaby's card checkout is marketplace-only).
**What:** Store settings › Payment methods › **Online card payments**: the seller connects their own Paymob (secret key, public key, HMAC secret, card integration ID, optional wallet integration ID) or Kashier (Merchant ID, Payment API key, secret key, test/live) account. One gateway per store. Keys are checked with a 1 EGP checkout that is never paid, then stored AES-256-GCM in `store_integrations` (providers `paymob`, `kashier`, 0130). Checkout then offers card payment (`online_payment`); the order gets `metadata.paymentCollector = 'seller'` (fee-only on delivery, `PLAN.md` §13.4) and `metadata.paymentGateway`. The payment page opens the seller's gateway; the gateway posts to `POST /api/webhooks/store-payments/:integrationId` (apps/backend), checked with that store's keys, and only that store's orders that name that integration can change. **PayPal** and **Tallaby Pay** (internal: card money to the store wallet through Tallaby's Kashier) show as "Soon".
**Owner decisions (2026-10-30):** external gateways now, internal later; PayPal "Soon" (no EGP, Egyptian accounts often can't receive); fee-only like other seller-collected payments. This changes `PLAN.md` §9.2's non-goal "per-seller payment gateways".
**Status:** [Built, 2026-10-30, local `main` (also on branch `feat/store-payment-gateways`)] F-39a–d done; the gateways card now reads the store apps catalog (F-41), so Paymob and Kashier also show on the Apps page (Payments tab, linking here). 0130 applied 2026-10-30 (staging first, then production with owner approval). Needs `STORE_PAYMENTS_WEBHOOK_BASE_URL` or `BACKEND_API_URL` (public https backend) on the dashboard, ecommerce and backend, and `INTEGRATIONS_ENCRYPTION_KEY` on all three. Manual E2E with Paymob and Kashier test accounts still to do (F-39e).

- **F-39a · P1** Migration 0130 (providers `paymob`, `kashier`), registry + public details, `packages/lib/src/payments/store-gateways.{lib,server}.ts` (validation, key check, encrypted save, audit in `store_settings_audit`, disconnect, checkout, webhook) + unit tests.
- **F-39b · P1 · deps: F-39a** Dashboard: "Online card payments" card on Store settings › Payment methods (connect sheet per gateway, update keys, disconnect, "waiting for first payment" until a signed webhook arrives), both languages.
- **F-39c · P1 · deps: F-39a** Storefront: card option when the store has a gateway, seller-collected order metadata in `place-order.ts`, payment page on the seller's gateway, `/api/store-payments/return`; Tallaby's own Kashier/Paymob actions refuse these orders.
- **F-39d · P1 · deps: F-39a** Backend webhook route `/api/webhooks/store-payments/:integrationId` (paid → digital fulfilment and seller emails, same as Tallaby's routes).
- **F-39e · P1 · deps: 0130 on staging** Manual E2E with Paymob and Kashier test keys: connect, wrong keys, pay, fail, replayed webhook, webhook signed by another store's keys, disconnect mid-payment. Record in §7.
- **F-39f · P2** Later: Tallaby Pay (internal), PayPal (USD), refunds from Tallaby, unpaid card orders auto-cancel (shared with Tallaby's card checkout today).
- Acceptance: no key in client code, config, logs or responses; a webhook for store A's integration can never change store B's order; a paid amount that differs from the order total never confirms it.

### F-41 One store apps catalog (Apps, Shipping companies, Payment methods) — P1 · owner request · Built 2026-10-30

**Why:** Apps, carriers and payment gateways were listed in three places with their own lists, logos and names.
**What:** `STORE_APPS` in `packages/lib/src/integrations/catalog.ts` is the single list: key, group (tracking, shipping, payments, data), kind, the `store_integrations` provider when built, and the page that manages it. The Apps page (tabs per group, "Soon" cards), Shipping › Shipping companies and Payment methods › Online card payments all render from it with one `AppLogo` (`apps/app-logo.tsx`) and one brand table (`apps-brand.lib.ts`, keyed by catalog key); names come from `storeApps.providers.*`. Adding a carrier or gateway = one catalog line, one brand line and its strings; a "soon" entry needs no migration. A test keeps the catalog and the provider registry (= DB CHECK) in step. Admin uses one provider-name map for its pages and the bell.
**Status:** [Built, 2026-10-30, local `main`]

### F-31 POS and cashier — P3

**What:** Sell in a physical shop from a phone or tablet with the same products and stock; orders tagged `source = pos`. Needs F-05 (manual orders) first.
**Status:** [Planned]

### F-29 AI agent connection (MCP) — P3

**What:** An official MCP server so a seller's AI assistant can read orders and manage products (EasyOrders planned, 14 votes). Built on F-17 keys and scopes.
**Status:** [Planned]

---

## 5. Owner feature requests (intake)

Add each new request here first, with the date and the owner's words, then turn it into a §4 feature and place it in §3.

| Date       | Request (owner's words)                                                                                                                                                                                                                                                                                                                                               | Feature ID                                                                                       | Status                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| 2026-10-30 | "gather everything we discussed: Tallaby Apps, Shipping Companies, Payment methods … build them in the best-practice way, with clean code structure and DRY logic" (+ earlier the same day: Egypt Post as "Wassalha Egypt Post" with their template, store ID and name on enabling, export one or many orders; weight 998 g when unknown; shipping page with any carrier, rate templates, free delivery, free over an amount) | F-41, F-12c, F-12d, F-13b (free delivery), F-39 | Built (local `main`, 0130 applied 2026-10-30) |
| 2026-10-30 | "I need also to integrate payment methods, Payment methods will be Internal (Kashier, payments go to store's wallet) and Externals (User integrate his payment method gateway himself … like Paymob, Kashier, Paypal)" → "Let's build the External methods only for now and keep internal Soon" (PayPal: Soon; fee-only) | F-39 | Built (uncommitted, 0130 applied 2026-10-30) |
| 2026-10-30 | "For the categories sections on the storefront, integrate the section with seller_product_categories table, and check where do we use this seller_categories as I see it's empty?" | Storefront store categories (no feature ID) | Done (uncommitted) |
| 2026-10-30 | "Integrate https://mersalsms.com MersalSMS for OTP and Orders confirmations"                                                                                                                                                                                                                                                                                          | F-38 (unblocks F-02f, F-14a)                                                                     | Planned (needs price + who pays)                                                       |
| 2026-10-29 | "let's built the gift 100EGP for new users, user get the gift after publishing his store directly with a celebrating Pop-up … Pause the 7 days free for new users … 100EGP for users who setup their ecommerce only (choose theme, add a product, publish the website) and valid for 30 days only" (+ only sellers who sign up after launch; unspent part disappears) | Welcome gift (no feature ID; PLAN.md §13.1, 0119)                                                | Done (0119 on staging and production, production 2026-10-30)                           |
| 2026-10-29 | "making the Tallaby seller wallet deducts from it on using AI, so for example if adding a product with AI costs 0.25EGP so deduct it from the Wallet … Specially when I provide them 100EGP free gift for new users for 1 month"                                                                                                                                      | PLAN.md AI-4 (AI credits; wallet charge for AI deferred by owner) + welcome gift                 | AI charge: later (owner testing AI use first); gift: see next row                      |
| 2026-10-29 | Public seller roadmap page at `/roadmap` (sellers suggest ideas and vote, the team moves cards between Waiting, Planned, In progress and Launched; EasyOrders roadmap as the model)                                                                                                                                                                                   | Seller roadmap page (no feature ID)                                                              | Done (uncommitted, 0115 not applied)                                                   |
| 2026-10-29 | "can I manage the roadmap requests and columns from Admin project ? … build it, make me manage it from admin project"                                                                                                                                                                                                                                                 | Admin › Seller roadmap (no feature ID)                                                           | Done (uncommitted, 0115 not applied)                                                   |
| 2026-10-29 | "On the website builder > Add > Templates tab, show the related templates industry only, on dashboard and admin, And on Admin project, on Change theme to a store, show the theme reusable card on the dialog to see the theme"                                                                                                                                       | Builder templates by industry + admin live theme cards (no feature ID)                           | Done (uncommitted)                                                                     |
| 2026-10-29 | "on /products/add if form has draft data, add clear button to clear it beside \"Save as draft\""                                                                                                                                                                                                                                                                      | Product form clear-draft button (no feature ID)                                                  | Done (uncommitted)                                                                     |
| 2026-10-29 | "Seller dashboard homepage new design, make good linking for everything if link of related title exists" (Claude Design: Seller Dashboard v2) + WhatsApp channel link                                                                                                                                                                                                 | Dashboard home redesign (no feature ID)                                                          | Done (uncommitted)                                                                     |
| 2026-10-29 | "Affiliate program for Tallaby … عمولة 20% من اي مبلغ يقومون بشحنه … كاش وليس رصيد في المحفظة … سحب عمولتك بعد تحقيق 10 إحالات ناجحة على الأقل وإنشاء 10 متاجر" (EasyOrders' page text as the model)                                                                                                                                                                  | F-37                                                                                             | Planned (needs approval)                                                               |
| 2026-10-29 | "work on the PWA mobile application for stores, and add a button for each template/store on the footer \"Download Application\", user can hide this button from dashboard setting; ensure that the store application takes the store's favicon and name"                                                                                                              | F-36 (footer button replaces the timed prompt of F-36c; icons from the favicon first)            | Done (uncommitted)                                                                     |
| 2026-10-29 | "Improve the Next.js PWA to make the application with the store name and logo"                                                                                                                                                                                                                                                                                        | F-36 (replaces F-06c)                                                                            | Planned                                                                                |
| 2026-10-29 | "when a user delete a product, it goes to Trash for 30 days so user can restore the product back"                                                                                                                                                                                                                                                                     | F-35                                                                                             | Planned                                                                                |
| 2026-10-29 | "the deposit roundup automatically to nearest 5"                                                                                                                                                                                                                                                                                                                      | F-21 (rounding rule)                                                                             | Planned                                                                                |
| 2026-10-29 | Deposit: who receives it? → "Seller's own number"                                                                                                                                                                                                                                                                                                                     | F-21 (+ F-21p = PLAN.md P3-07 Part B)                                                            | Planned                                                                                |
| 2026-10-29 | "a checkbox on the product /add or edit page to show a badge for user on low stock … فاضل قطعتين والوقت قرب يخلص"                                                                                                                                                                                                                                                     | F-34                                                                                             | Planned                                                                                |
| 2026-10-29 | "I need to add Downsell feature, which is when a user removes an item from cart, shows a similar item but with discount or lower price popup" (+ phone mockup)                                                                                                                                                                                                        | F-33                                                                                             | **Removed** 2026-10-29 ("we have similar one already on live": the exit coupon pop-up) |
| 2026-10-29 | "We need to add Cross-selling feature too … العميل مثلا هيشتري باور بانك … هيلاقي تحت المنتج عرض وصلة شاحن بخصم 10٪ … enabled by default and store owner can disable it anytime"                                                                                                                                                                                      | F-32                                                                                             | Planned                                                                                |
| 2026-10-28 | "analyze the Easy orders features too … find the most important that we should have" (pasted EasyOrders sidebar + roadmap.easyorders.ai)                                                                                                                                                                                                                              | §2.3, §2.4; new F-21 … F-29; tasks added to F-01, F-02, F-03, F-07, F-08, F-11, F-13, F-15, F-16 | Planned                                                                                |

---

## 6. Checklist

`[ ]` not started · `[~]` in progress (date, branch) · `[x]` done (date, commit)

**P0**

- [x] F-01a Customers query (2026-10-30, uncommitted; `packages/lib/src/customers/`)
- [x] F-01b Customers page (2026-10-30, uncommitted; Orders › Customers; phone E2E pending)
- [x] F-02a Blocklist migration (2026-10-29, uncommitted; 0118 on staging)
- [x] F-02b Checkout block check (2026-10-29, uncommitted)
- [x] F-02c Block from dashboard + blocklist page (2026-10-29, uncommitted)
- [x] F-03a Leads migration (2026-10-29; 0120 on staging)
- [x] F-03b Storefront lead capture (2026-10-29)
- [x] F-03c Leads list in dashboard (2026-10-29; Orders › Not completed)
- [x] F-04a Invoice + packing slip print (2026-10-30, uncommitted; `/print/orders`; browser E2E pending)
- [x] F-04b Orders export (2026-10-30, uncommitted; .xlsx of the orders on screen; browser E2E pending)
- [~] F-05a Manual orders design (owner approval) (2026-10-30; note written, owner approval pending)
- [ ] F-05b Create order form

**P1**

- [x] F-01c Customer notes & tags (2026-10-30, uncommitted; 0121 on staging)
- [x] F-01d Customers export (2026-10-30, uncommitted; .xlsx of the filtered list)
- [x] F-02d Risk badge (2026-10-30, uncommitted; card, table and order panel)
- [x] F-02g Confirm by WhatsApp link (no API) — P0 (2026-10-29, uncommitted; thank-you page link added with F-25b on 2026-10-30)
- [ ] F-02f Checkout OTP (SMS via MersalSMS, after F-38b)
- [ ] F-38a MersalSMS account, price and who pays (owner)
- [ ] F-38b MersalSMS client + `sms_messages` log migration
- [ ] F-38c Order confirmation SMS with confirm link
- [ ] F-38d Hook up F-02f and F-14a
- [x] F-39a Gateway library, migration 0130 (not applied), tests (2026-10-30, uncommitted)
- [x] F-39b Payment methods › Online card payments (2026-10-30, uncommitted)
- [x] F-39c Storefront card checkout on the seller's gateway (2026-10-30, uncommitted)
- [x] F-39d Backend webhook route (2026-10-30, uncommitted)
- [ ] F-39e Manual E2E with Paymob and Kashier test accounts (needs 0130 on staging)
- [ ] F-39f Tallaby Pay, PayPal, refunds, unpaid card order auto-cancel
- [x] F-41 One store apps catalog for Apps, Shipping companies and Payment methods (2026-10-30, local `main`)
- [x] F-12c Wassalha (Egypt Post) settings + Excel export (2026-10-30, local `main`; 0130 applied 2026-10-30)
- [x] F-12d Shipping › Shipping companies card (2026-10-30, local `main`)
- [ ] F-12e Wassalha tracking numbers (result file upload, tracking link)
- [x] F-13b Store-wide free delivery (none / over an amount / every order) (2026-10-30, local `main`; minimum order value still open)
- [x] F-03e Missed-order reminders (2026-10-29; one-click WhatsApp + the existing daily store cart email shown on the lead; automatic WhatsApp with F-14)
- [x] F-04c Orders bulk actions (2026-10-30, uncommitted; selection bar on /orders; browser E2E pending)
- [ ] F-05c Send order link
- [ ] F-21p Seller-collected payments (PLAN.md P3-07 Part B) — needed by the deposit
- [ ] F-21a Deposit design (owner approval)
- [ ] F-21b Deposit migration + settings
- [ ] F-21c Deposit checkout + seller confirm
- [x] F-25a Checkout form settings (2026-10-30, uncommitted; no migration; browser E2E pending)
- [x] F-25b Thank-you page settings (2026-10-30, uncommitted; browser E2E pending)
- [ ] F-07f Bundles
- [~] F-32a Cross-sell design note (owner OK) (2026-10-30; note written, owner OK pending)
- [ ] F-32b Offers migration (`product_cross_sells`, `stores.cross_sell_enabled` default on)
- [ ] F-32c Cross-sell in product form + store switch
- [ ] F-32d Cross-sell on the store product page and cart
- [ ] F-32e Cross-sell discount at checkout
- [x] F-34a Low-stock badge migration (`show_low_stock_badge`, `low_stock_threshold`) (2026-10-30, uncommitted; 0122 on staging)
- [x] F-34b Checkbox + threshold in the product form (2026-10-30, uncommitted)
- [x] F-34c Badge on the store product page and cards (2026-10-30, uncommitted; browser E2E pending)
- [x] F-35a Trash migration (`products.deleted_at`, `deleted_by`) (2026-10-30, uncommitted; 0123 on staging)
- [x] F-35b Hide trashed products everywhere (2026-10-30, uncommitted; status `draft` + `deleted_at` filters on seller lists)
- [x] F-35c Trash / restore / delete-forever actions (2026-10-30, uncommitted)
- [x] F-35d Trash page + undo toast (2026-10-30, uncommitted; browser E2E pending)
- [x] F-35e 30-day purge job (2026-10-30, uncommitted; `/api/cron/product-trash`)
- [x] F-36a Store manifest per host (2026-10-29, uncommitted)
- [x] F-36b App icons from the store favicon/logo (2026-10-29, uncommitted)
- [x] F-36c "Download application" footer button (2026-10-29, uncommitted)
- [x] F-37a Affiliate design note + open decisions (owner approval)
- [x] F-37b Affiliate migration (referral code, commissions, payouts)
- [x] F-37c Referral attribution at signup
- [x] F-37d Commission on succeeded top-ups
- [x] F-37e "اربح معنا" dashboard page
- [x] F-37f Admin referrals + payouts
- [~] F-13b Minimum order + store free-shipping threshold (2026-10-30: minimum built, uncommitted, browser E2E pending; threshold needs owner approval)
- [x] F-22a Recent orders endpoint (2026-10-30, uncommitted; server-side feed, no public endpoint)
- [x] F-22b Sales pop-up on the store (2026-10-30, uncommitted; browser E2E pending)
- [x] F-24a Bulk edit server action (2026-10-30, uncommitted; no migration)
- [x] F-24b Bulk edit UI (2026-10-30, uncommitted; browser E2E pending)
- [x] F-15b Per-product views (2026-10-30, uncommitted; GA4 E2E pending)
- [x] F-03f Shipping cost on missed orders (2026-10-29)
- [x] F-04d Picking list (2026-10-30, uncommitted; `/print/orders?doc=picking`; browser E2E pending)
- [x] F-06a Push subscriptions migration (2026-10-30, uncommitted; 0124 on staging)
- [x] F-06b Push alerts (2026-10-30, uncommitted; needs VAPID env + DB webhook; browser E2E pending)
- [ ] F-07a Quantity offers design (owner approval)
- [ ] F-07b Quantity offers in product form
- [ ] F-07c Quantity offers on storefront
- [ ] F-08a Inline order form (owner approval)
- [ ] F-08b Landing page designs
- [x] F-09a Staff design + security review (2026-10-30, note written; owner answers pending)
- [ ] F-09b Staff migration
- [ ] F-09c Staff invite + roles
- [x] F-10a Inventory migration (2026-10-30, uncommitted; 0125 on staging)
- [x] F-10b Stock movements + low-stock alert (2026-10-30, uncommitted)
- [x] F-11a Product feed route (2026-10-30, uncommitted; `/api/feeds/products.{xml,csv}`)
- [x] F-11b Feed apps cards (2026-10-30, uncommitted; browser E2E pending)
- [ ] F-12a Next carrier chosen
- [ ] F-12b Carrier integration

**P2 / P3**

- [x] F-02e Checkout rate limit (2026-10-30, uncommitted; in-memory per server instance, Upstash left)
- [x] F-03d Lead cleanup cron (2026-10-29; `/api/cron/checkout-leads`)
- [x] F-01e Repeat order (2026-10-30, uncommitted; store "Order again" button; the dashboard half waits on F-05)
- [ ] F-07d Upsell / cross-sell
- [ ] F-08c Funnel steps
- [x] F-10c Inventory page (2026-10-30, uncommitted; `/products/inventory`; browser E2E pending)
- [x] F-11c Shareable catalog (2026-10-30, uncommitted; Marketing › Shareable catalog + "Share catalog" on selected products; browser E2E pending)
- [ ] F-13a Automatic discounts
- [ ] F-13c Coupons in cart + free gift
- [ ] F-14a / F-14b Customer notifications
- [x] F-15a Reports upgrade (2026-10-30, uncommitted; `/reports`; browser E2E pending)
- [x] F-16a Email campaigns (2026-10-30, uncommitted; 0129 on staging; `/marketing/emails`; dashboard backend env + real-send E2E pending)
- [x] F-16b Retargeting audiences (2026-10-30, uncommitted; Meta/TikTok upload test pending)
- [ ] F-16c WhatsApp broadcasts
- [x] F-16d Subscribers list (2026-10-30, uncommitted; `/marketing/subscribers`; browser E2E pending)
- [ ] F-17a Public API & webhooks
- [x] F-23a Back-in-stock alerts (2026-10-30, uncommitted; 0126 on staging; email E2E pending)
- [ ] F-23b Pre-orders
- [x] F-26a Campaign tracking (UTM) (2026-10-30, uncommitted; `orders.metadata.utm`, no migration; Reports › Campaigns)
- [ ] F-18 Store affiliates / referral links
- [ ] F-19 Gift cards & store credit
- [ ] F-20 Loyalty points
- [ ] F-27 A/B tests
- [ ] F-28 Wholesale pricing
- [ ] F-29 AI agent connection (MCP)
- [x] F-04e Returns barcode scan (2026-10-30, uncommitted; `/orders/scan`; camera needs BarcodeDetector, typing elsewhere)
- [x] F-36d Store service worker + offline page (2026-10-29, uncommitted)
- [x] F-36e Store settings › App (2026-10-29, uncommitted; switch + preview only)
- [x] F-37g Affiliate program page on tallaby.com (2026-10-30, uncommitted; `/affiliates`)
- [x] F-16e Win-back messages (2026-10-30, uncommitted; 0129 on staging; email only, WhatsApp waits for F-14/F-16c; cron E2E pending)
- [x] F-24c Update products from Excel (2026-10-30, uncommitted; browser E2E pending)
- [x] F-24d Product order in category (2026-10-30, uncommitted; 0128 on staging; browser E2E pending)
- [x] F-30a Purchase on delivery (CAPI) (2026-10-30, uncommitted; real Meta test event pending)
- [x] F-30b Pixel event toggles (2026-10-30, uncommitted; Store › Apps › Meta Pixel)
- [ ] F-31 POS and cashier
- [ ] F-32f Cross-sell report
- [x] F-34d Stock badge builder element (2026-10-30, uncommitted; `productStockBadge`, editor E2E pending)

**Done outside the feature list (owner requests, §5)**

- [x] Welcome gift: EGP 100 for new sellers, 7-day trial paused for them (2026-10-29, `a7d36530`; 0119 on staging and production, production 2026-10-30)
- [x] tallaby.com copy: flat EGP 5 only, no free days or gift on pricing, home and Terms (2026-10-29, `8150c0bc`, `44b926fd`)
- [ ] Welcome gift: manual phone E2E (new account → template → product → publish → pop-up, ar/en)
- [ ] Welcome gift: "unspent gift" note on Admin wallet screens

---

## 7. Log

### 2026-10-30 — Merged, migrated and deployed (owner)

- **Merge:** local `main` merged `origin/main` (F-39 card gateways, F-12c Wassalha, F-41 apps catalog). The upstream `0122_store_gateways_and_wassalha.sql` clashed with `0122_product_low_stock_badge.sql` (already on staging), so it was renamed **`0130_store_gateways_and_wassalha.sql`**. Next migration: **0131**. Conflicts were in checkout/order actions (both sides kept: the gateway card check first, then the rate limit, minimum order and checkout form), the integrations validator, the dashboard messages (three-way JSON merge, no real conflicts) and the docs.
- **Migrations, 2026-10-30:**
  - Staging: 0112, 0113, 0114, 0115 and 0130 applied (0116–0129 were already there).
  - Production: dry run with rollback, then one transaction for 0117 (re-run: 0116 had dropped `referral_payout_requested` from the admin type check), 0122, 0123, 0124, 0125, 0126, 0128, 0129 and 0130. Each file was run twice to prove it is idempotent.
  - Both databases now have every migration through 0130. The 9 new server-only tables have RLS on and no policies.
- **Deploy:** pushed `e89c0985`. Vercel built ecommerce, dashboard, backend and admin to production. `tallaby-shipping` has Git deploys turned off (`vercel.json`), so its F-30a change (delivered Purchase from riders) needs a manual deploy.
  - Smoke test: tallaby.com, `/affiliates`, dashboard `/login` and `/roadmap`, the API, and two live stores (home, products, cart, a product page, the product feed) all return 200.
- **Env:** `BACKEND_API_URL=https://api.tallaby.com` (no `/api`; the code adds it) and one shared `INTERNAL_API_SECRET` on backend, ecommerce and dashboard, checked on Vercel. Before this, ecommerce had `…/api` and a different secret, so its backend emails were rejected.
- **/roadmap cards (staging and production):**
  - Launched: F-01, F-03, F-04, F-10, F-11, F-15, F-22, F-24, F-25, F-26, F-34, F-35, F-36.
  - In progress: F-02, F-06, F-12, F-13, F-16, F-23.
  - New cards: F-37 and F-30 (launched), F-39 (in progress), F-32 (planned).
- **Still to do:**
  - web push: VAPID env + the Supabase Database Webhook on `seller_notifications` INSERT
  - Resend plan and sender for campaigns
  - browser E2E of the batch
  - fixing `pnpm lint`

### 2026-10-30 — Batch 4 closed: F-02e, F-01e, F-11c, F-26a, F-04e, F-37g, F-24c, F-30a/b, F-34d

These were built by parallel subagents in the previous session, which stopped before logging them. A read-only review on 2026-10-30 checked each against the code. None needs a migration (0127 was never used: F-26a went into `orders.metadata.utm` instead of a new column). Next migration: 0130.

- **F-02e** `apps/ecommerce/lib/order-rate-limit.{lib,server}.ts`, in `createOrder` before the minimum-order and form checks, store-website checkout only, keys scoped per store: 5 orders / 10 min per IP, 3 / hour per shipping phone (normalised like the blocklist), 5 / 10 min per user. Only placed orders count; fail-open. **In memory per server instance**, so it is easy to get around on Vercel; Upstash is left.
- **F-01e** (store side) "Order again" on the store's order page (`actions/reorder.ts`, `lib/reorder/`): the server checks that the order belongs to this user and this host's store, and that the store is online, then re-adds the lines still sold, at today's price, capped by stock. The dashboard half waits on F-05.
- **F-11c** Marketing › Shareable catalog (`/marketing/catalog`) and "Share catalog" in the products selection bar: one category, the newest products (up to 48) or the picked products. Signed token (HMAC with HKDF from `INTEGRATIONS_ENCRYPTION_KEY`, tied to seller + store; nothing stored). `/catalog/<token>` on the store host (noindex, offline page when offline, live prices, add to cart) plus `?print=1` for PDF. This session fixed: the missing dashboard `catalogShare` strings (ar/en), the missing sidebar/route entry, and the unmounted products-list dialog.
- **F-26a** `packages/lib/src/campaigns/utm.lib.ts`: sanitised first-touch cookie `tallaby_utm` (30 days, store host only; click ids recorded as present, never their value), merged into `orders.metadata.utm` after the order commits. Reports › Campaigns (`/reports/campaigns`): UTM link builder plus orders, delivered and revenue (piastres) per source/medium/campaign, cached with `storeTags.reports(seller, store)`.
- **F-04e** Code 128 order barcode on invoices and A6 slips; Orders › Scan returns (`/orders/scan`): camera scan through `BarcodeDetector` (Chrome/Android; iPhone Safari and Firefox type the number), finds only orders with the seller's lines, and "Mark returned" goes through the existing `updateSellerOrder("return")`; Bosta orders are marked.
- **F-37g** `tallaby.com/affiliates` (hero, 20 % for life, steps, terms, FAQ with FAQPage JSON-LD, CTA to the dashboard Earn page), in the footer and sitemap.
- **F-24c** Products › Import/Export › "Update products from Excel": download a sheet (the products on screen or all live ones), upload it for a before/after preview, apply. Rows match by product id, SKU, variant id or variant SKU; price, sale price, stock, status and SKU can change. Applied in one transaction with `FOR UPDATE` and a re-plan; stock changes are logged as `import` movements (0125); trashed products are never written; seller-scoped; caches invalidated. This session fixed a dashboard type error and the missing `excelUpdate` strings and menu label (ar/en).
- **F-30a/b** The store's `meta_pixel` config gets `tracking`: per-event toggles (ViewContent, AddToCart, InitiateCheckout, Purchase, Lead; Lead off by default) and `purchaseOn: order | delivered` (`delivered` works only with CAPI connected). A delivered order sends one Purchase (`event_id` = order id, conditional-UPDATE claim) from `applySellerShipmentStatus` (Bosta too), riders and admin; the `bosta-sync` daily sweep retries failures up to 3 times. The browser pixel drops blocked events (tracking cache v2). Known gaps: a crash between the claim and the Graph call leaves that order marked as sent; orders already deferred stay unsent if CAPI is later disconnected.
- **F-34d** `productStockBadge` builder element (registry, allowed types, editor icon, `@workspace/store-sections/low-stock`). It shows the low-stock alert on the product page (follows the variant) and "N left" in list cards. While a page has the badge, the stock line stops showing the alert. No code template places it yet.
- Checks (whole repo, 2026-10-30): typecheck clean except the 16 known ecommerce `profile.chunks.tsx` errors. Tests all pass except the known `starter-forms` failure; `storefront-events` and `store-payments` time out in the full parallel run but pass alone. **`pnpm lint` crashes before checking any file** (`scopeManager.addGlobals is not a function`, ESLint 10.9.1 against typescript-eslint); this needs its own fix. Browser E2E pending for all of these.

### 2026-10-30 — F-16a Email campaigns and F-16e Win-back email built

- Migration `0129_store_email_campaigns.sql`: `store_email_campaigns` (draft → scheduled → sending → sent / cancelled; subject ≤ 150, plain-text body ≤ 5000, optional button text, ≤ 4 product ids, audience `subscribers | buyers | all | inactive` + inactive days 7–730, locale, counts), `store_email_campaign_recipients` (snapshot, one row per lower-cased email per campaign, claim status, random unsubscribe token), `store_email_unsubscribes` (per-store opt-out list), `store_winback_sends` (unique store + email + last order date = once per quiet period). Win-back settings live in `stores.settings.winback` (no column). RLS on, no policies on all four. Additive, idempotent, mirrored in `schema.ts`/`relations.ts`. **Applied on staging 2026-10-30 and re-run to prove idempotency (4 tables, RLS on, 0 policies, column counts match); production pending owner approval, before the deploy** (the dashboard page reads it).
- Dashboard: Marketing › Email campaigns (`/marketing/emails`, sidebar + routes, `requireStore()` on every action, ids from the browser only pick rows inside that seller's store). Campaign list with status and sent / failed / skipped counts, stop sending (unsent rows → skipped), delete drafts. Composer: subject, text (blank line = paragraph, `**bold**`, "- " lists; links refused in subject, text and button; never HTML), button text, up to 4 of the store's live products, audience picker with live recipient count (unsubscribed, guest placeholders, blocked phones (F-02) and the plan cap left out), send now or schedule (5 min to 30 days ahead), preview (backend-rendered HTML in a sandboxed iframe), test send to the seller's own account email. Win-back card: on/off, days (30–365), optional subject/text (empty = default copy in the store's language), preview, test.
- Caps (`EMAIL_CAMPAIGN_LIMITS`, Free plan): 1 campaign queued per store per rolling 24 h (checked under a lock on the store row), 500 recipients per campaign, 5 tests per campaign + 10 tests per store per 24 h (backend, counted in `email_deliveries`), win-back 50 per store per day, only customers with a delivered order whose last order is N–365 days old, never twice within N days. Only published, active stores can send.
- Sending: "Send now" snapshots recipients and starts a run for that campaign in `after()` (page `maxDuration` 300); new ecommerce cron `/api/cron/email-campaigns` (`vercel.json`, daily 08:00 UTC, `CRON_SECRET`) plans win-back, starts scheduled campaigns, claims batches of 20 (4 parallel, `FOR UPDATE SKIP LOCKED`, stale claims re-claimed after 30 min, failed after 3 tries, max 1500 per run). Backend endpoints `store-campaign`, `store-winback`, `store-campaign-preview`, `store-campaign-test` (`apps/backend/src/lib/emails/store-campaign-email.ts`): re-check campaign still sending, store live and the seller's, address not unsubscribed, then send once through the `email_deliveries` claim (new types `store_campaign`, `store_winback`, `store_campaign_test`), store-branded `StoreCampaignEmail`, products and button link to the store's own site. Logs counts only, never an email.
- Unsubscribe: every email links to `/api/email/unsubscribe?token=` on the store host. GET shows a confirm button (link scanners can't unsubscribe); POST adds the email to the store's list and skips its unsent campaign and win-back rows there. Strings in ecommerce `emailUnsubscribe` (ar + en).
- Files: `packages/lib/src/email-campaigns/` (lib + 13 new tests, server, send), `packages/emails/src/StoreCampaignEmail.tsx`, `kit/plain-text.ts` (+ test), email copy in `i18n/transactional.ts`; `apps/backend/src/lib/emails/store-campaign-email.ts`, `routes/emails.ts`, `lib/email-delivery.ts`; `apps/dashboard/app/(main)/marketing/emails/` (`page.tsx`, `email-campaigns.data.tsx`, `.client.tsx`, `.server.ts`, `.types.ts`), sidebar config, routes, messages (`emailCampaigns`, both languages); `apps/ecommerce/app/api/cron/email-campaigns/route.ts`, `app/api/email/unsubscribe/route.ts`, `vercel.json`, messages.
- Checks: `tsc` clean for dashboard, lib, emails and backend; ecommerce the same 16 existing errors in `profile.chunks.tsx`. Tests: lib 775 pass (13 new) + the known `starter-forms` failure (someone else's Arabic contact-form copy edit); emails 14; dashboard 450; ecommerce 238. `eslint` still crashes before linting (toolchain).
- Pending / owner: (1) **dashboard Vercel env needs `BACKEND_API_URL` and `INTERNAL_API_SECRET`** (preview, test send and "send now" call the backend; without them they show "not available", and queued campaigns still go out with the daily ecommerce cron); (2) the cron is daily (Hobby); scheduled campaigns go out at the first run after their time, and the cron should be hourly if the plan allows; (3) `0129` on production; (4) E2E: compose → test → send now → inbox (ar/en, phone width) → unsubscribe page → next campaign skips that email; win-back with a staging customer whose last delivered order is > N days old.

### 2026-10-30 — F-24d Manual product order inside a category built

- Migration `0128_category_product_order.sql`: `seller_category_product_positions` (seller category + product primary key, seller, position ≥ 0, updated at; cascade on category, product and seller delete; product and seller indexes). RLS on, no policies. Additive, idempotent, mirrored in `schema.ts`/`relations.ts`. **Applied on staging 2026-10-30 and re-run to prove idempotency (RLS on, 0 policies, 3 indexes); production pending owner approval, before the deploy** (the storefront "Featured" order reads it).
- Dashboard: Products › Categories rows have an "Arrange products" button (list icon) that opens a dialog with the category's products (the same rule as the store category page: linked to it, plus unlinked products of the Tallaby category it was picked from; trashed ones left out; up to 1000). Drag by the handle (pointer or keyboard, dnd-kit) or "move to top", then Save; "Reset to newest first" forgets the order. Server actions (`category-order.server.ts`) take the seller from the session, check the category is theirs and every product id is one of that category's products (else nothing is written), and rewrite the rows in one transaction. Saving clears `productTags.seller` and `sellerTags.storefront` (seller-scoped) through `invalidateSellerProducts`.
- Storefront: `getProducts` has a new `sortBy: "featured"` (placed products by position, then newest first, then id). A seller category on the store catalog page (`/products?category=`) opens on it, with a new "Featured / المميزة" option in the sort select there only; every other sort and the marketplace pages are unchanged. Builder product lists with source "category" on their "default" sort use it too; other lists keep newest first. Rules in `apps/ecommerce/lib/store-site/featured-sort.lib.ts` (4 tests); the dashboard order helpers have 5 tests.
- Not changed: the builder editor preview (`selectProducts` in store-sections) does not use the manual order; catalog share (`lib/catalog-share`) still lists a category newest first.
- Checks: `tsc` clean for dashboard, db and lib; ecommerce the same 16 existing errors in `profile.chunks.tsx`. Tests: dashboard 450, ecommerce 238. The Featured order SQL ran on staging. `eslint` crashes before linting in both apps (ESLint 10.9.1 against typescript-eslint: `scopeManager.addGlobals is not a function`), a toolchain problem that has nothing to do with this change. Pending: browser E2E (drag, save, the store category page order, ar/en, phone).

### 2026-10-30 — F-23a Back-in-stock alerts built

- Migration `0126_store_stock_subscriptions.sql`: `store_stock_subscriptions` (store, seller, product, nullable variant, lower-cased email, locale, random unsubscribe token, created/notified/cancelled at; cascade on product/variant delete; one open alert per store + product + variant + email). RLS on, no policies. Additive, idempotent, mirrored in `schema.ts`/`relations.ts`. **Applied on staging 2026-10-30** (re-run clean); **production pending owner approval, before the deploy** (the Inventory page reads it).
- Storefront: "بلّغني لما يرجع" email form under the out-of-stock buy box (inside the existing buy-box tree element, follows the selected variant; no new element type), store hosts and active products only. Server action: store from the host, online check, honeypot, 6 tries / 10 min per visitor and 300 per store, product owned by that store's seller, live, not trashed, out of stock now, variant belongs to the product; duplicates show success; max 30 open alerts per email per store; email never logged. The static `popup-restock` design is left as it is.
- Sending: cron `/api/cron/stock-alerts` (ecommerce `vercel.json`, daily 09:00 UTC, `CRON_SECRET`) claims up to 100 alerts per run whose product/variant has stock again (`notified_at`, `FOR UPDATE SKIP LOCKED`), only for published active stores and active, non-trashed products still in the store catalog, never older than 180 days; a failed send releases the claim. Store-branded email (`BackInStockEmail`, subscriber's language) through the backend's one-email-per-alert guard, link to the product on the store's own site, unsubscribe link → a confirm page on the store host (a button, so link scanners can't cancel) that cancels that email's open alerts on the store. **Daily cron = up to a day's delay; switch to hourly if the Vercel plan allows.**
- Dashboard: Products › Inventory lines show "N waiting" with a tooltip (seller-scoped count).
- Checks: `tsc` clean for db, lib, emails, dashboard, backend; ecommerce the same 16 existing errors. Tests: lib 722 (9 new) + the known `starter-forms` failure; db 11; emails 9; dashboard 406; ecommerce 216. Integration test on staging: 3/3 pass, cleaned up. Email preview renders. Pending: browser test of the form (phone/desktop, variants, ar/en); end-to-end email (restock → cron → email → unsubscribe).

### 2026-10-30 — F-15a Reports upgrade built

- `/reports` (was an empty stub) is now a per-store report, back in the sidebar under Wallet. `?store=` (only the seller's own stores, re-checked with `requireStore()`, foreign id → 404) and `?range=7|30|90` Cairo days (default 30).
- Shows: store sales, orders, average order value, delivery, refusal and cancel rates; conversion funnel (GA4 visits from the hourly store-views cache → checkouts started = orders + open `store_checkout_leads` → orders → delivered; without GA4 it starts at checkouts; rates capped at 100 %; 90-day note that leads are kept 30 days); sales by source (this store's website, the seller's other stores, marketplace, manual = `order_source = 'external'`); refusal and cancel rate by governorate (raw address states merged per governorate, top 8 chart + full table; refusal = refused ÷ (delivered + refused), same rules as Customers); best 5 and worst products (active, non-trashed, linked to edit). recharts.
- Money summed in SQL as integer piastres. Cached 5 min per seller + store + period start + locale (`createCachedQuery`, new tag `storeTags.reports(sellerId, storeId)` in `packages/cache/src/tags.ts`); only counts, sums and product titles/images cached, no order, customer or wallet rows; nothing purges the tag (numbers up to 5 min old). No migration.
- Files: `apps/dashboard/app/(main)/reports/` (`reports.lib.ts` + 17 tests, `reports.server.ts`, `reports.data.tsx`, `reports.client.tsx`, `page.tsx`), `packages/cache/src/tags.ts`, sidebar config, messages (`reports`, 24 keys).
- Checks: dashboard `tsc` clean, 406 tests pass; `packages/cache` `tsc` clean, 41 pass. Staging read-only: 5 parallel queries ~135–165 ms each (no store-website orders on staging yet). Browser E2E pending (phone + desktop, ar/en, RTL chart axes, funnel with and without GA4; real visits need `GA4_*`).

### 2026-10-30 — F-16d Subscribers list and F-16b Export audience built

- **F-16d** Marketing › Newsletter subscribers (`/marketing/subscribers`, sidebar + routes): from `store_form_submissions` of the store's own sign-up forms (a form counts when it asks for an email and has no long-text field; only the ready-made newsletter form matches among the starters, unit-tested). The platform `newsletter_subscribers` (tallaby.com blog) is never read. One row per email per store (phone when no email) with sign-up count and first/last dates; spam never shown. No status column exists, so unsubscribe sets that email's submissions to `archived` (**also archives them in the Forms inbox**) and "subscribe again" sets `read`; a new sign-up after unsubscribing counts as subscribed. Store picker, status filter, search, 50 per page, bulk unsubscribe / resubscribe / delete forever (confirm), .xlsx export of the current filter.
- **F-16b** Orders › Customers › "Export audience": segments buyers (delivered), all customers, refused/cancelled, missed orders (open `store_checkout_leads` without an order), subscribed newsletter contacts. Phones to E.164 (`+20…`, Arabic digits too, unmatched dropped), emails lower-cased, guest placeholders dropped, de-duplicated, max 20,000, formula characters stripped. Blocked phones (F-02) left out of every segment except refused/cancelled. Formats (plain, platforms hash on upload, no BOM): Meta customer list CSV `email,phone,fn,ln,ct,country`; TikTok one identifier type per file, one value per line, no header (from memory of TikTok's docs; check with a first real upload). `requireStore`, validated segment/format, every query scoped to seller + store. No migration.
- Files: `packages/lib/src/audiences/` and `packages/lib/src/store-forms/subscribers.*` (lib, server, tests, integration test), `apps/dashboard/app/(main)/marketing/subscribers/`, `orders/customers/audience.server.ts`, `audience-export.client.tsx`.
- Checks: `tsc` clean for dashboard and lib; lib 722 pass (25 new) + the known `starter-forms` failure; dashboard 406 pass. EXPLAIN of the subscribers and leads queries on staging (read-only) OK. Not run: `subscribers.integration.test.ts` (writes to the DB). Pending: browser check ar/en at phone width; a real Meta and TikTok upload.

### 2026-10-30 — F-13b Store minimum order value built (minimum only)

- Store settings › Checkout › "Minimum order" card (on/off + EGP amount, Arabic digits accepted, amount kept when turned off), saved by its own `saveStoreMinOrder` (`requireStore(storeId, { forWrite: true })`, explicit `storeId`, rate-limited, update filtered by store and seller, merges only `stores.settings.minOrder = { enabled, amountPiastres }`, clears the storefront cache). Off by default; an invalid stored amount turns it off. No migration.
- Subtotal rule: sum of cart lines' unit price (after the product's own discount) × quantity, in integer piastres, **before any coupon** and without shipping, so a coupon never blocks a cart that qualified and the cart page shows the same number as checkout; exactly the minimum passes.
- Enforced server-side in `createOrder` on store websites only (store from the request host, minimum read fresh, subtotal from the session user's cart rows), before the F-25 checks and `placeOrderFromCart`, with a localized refusal. Checkout, cart page and cart sheet show "Add X more to order" and disable the button (the cart reads `minOrder` from the storefront profile; cache key bumped `storefront-v13` → `v14`). Marketplace checkout and `place-order.ts` unchanged.
- **Not built:** the store-wide free-shipping threshold (changes the shipping fee; owner approval).
- Files: `packages/lib/src/stores/min-order.lib.ts` (+ test, export `./stores/min-order`), `apps/dashboard/app/(main)/stores/[storeId]/settings/checkout/min-order.{dto,dto.test,server,client}`, ecommerce `actions/order.ts`, `actions/checkout.ts`, `lib/storefront-checkout-form.server.ts` (`getStorefrontMinOrder`), `lib/storefront.server.ts`, checkout data, store cart page, cart sheet, storefront cart and shell.
- Checks: `tsc` clean for dashboard and lib, ecommerce the same 16 existing errors. Tests: lib 722 pass (9 new) + the known `starter-forms` failure; dashboard 406 (8 new); ecommerce 216. Browser E2E pending: settings on/off ar/en (and F-25 still saves), cart/sheet/checkout below and at the minimum, direct `/cart/checkout` refused by the server, coupon below the minimum still orders, marketplace and builder preview unchanged.

### 2026-10-30 — F-05a Manual orders and F-32a Cross-sell design notes written

- Notes: [`docs/superpowers/specs/2026-10-30-manual-orders-design.md`](docs/superpowers/specs/2026-10-30-manual-orders-design.md) and [`docs/superpowers/specs/2026-10-30-cross-sell-design.md`](docs/superpowers/specs/2026-10-30-cross-sell-design.md). No code.
- **F-05:** the seller's order goes through `placeOrderFromCart` like the admin external-order desk (`apps/admin/actions/external-orders.ts`), always as a new guest customer, prices from the DB only. The admin `applyDiscountOverride` can't be reused (it doesn't lower line totals, so Tallaby would pay the discount through the `sale` credit); a `sellerDiscount` input works like a seller coupon. "Already paid" = new payment method `seller_collected` + `metadata.paymentCollector = 'seller'` (fee only on delivery; the ledger already reads the flag), no P3-07 Part B needed. Order source: recommended additive migration (`manual` in `order_source` + widen the `orders_fill_store_id` trigger, else CRM, missed orders, Bosta and store wallet entries miss the order); a no-migration metadata alternative is described. Fee and wallet as a storefront COD order; stock reason `order` with the seller as actor; F-05c = pending order the customer confirms + auto-cancel.
- **F-32:** seller-paid line discount in piastres inside `place-order.ts` before coupons, lowering line `total`/`discountAmount` plus an order-level `cross_sell` discount line (like seller coupons); orders without offers byte-identical (snapshot test). Fee unchanged (EGP 5); the `sale` credit is net, so the seller pays the offer. Max offer units = main units; removing the main product returns the item to full price. Coupons stack on the net price (needs one fix: the seller-coupon code overwrites line `total`). Migration sketch differs from F-32b: `product_cross_sells` gets `seller_id` and a nullable `store_id`; `cart_items.cross_sell_id`; offer details in `order_items.metadata`. Storefront `productCrossSell` builder element + fallback under the buy box; invoice gains per-line discounts (also fixes seller-coupon line printing).
- **Waiting on the owner:** 7 questions per note (in each note's questions section). Build after the current print/export work is committed (shared files). Next free migration after F-23a's `0126` is `0127`.

### 2026-10-30 — F-09a Staff accounts design note + security review written

- Note: [`docs/superpowers/specs/2026-10-30-staff-accounts-design.md`](docs/superpowers/specs/2026-10-30-staff-accounts-design.md). No code.
- Key finding: every guard assumes the signed-in user is the owner (`requireSeller` loads `sellers` by user id; older `actions/*.ts` use the user id as the seller id), so staff can't simply resolve to the owner's id without opening wallet, payouts, plan and affiliate earnings. Design: deny by default (`requireSeller`/`requireStore` become owner-only), new `resolveActor` / `requirePermission` / `requireStorePermission(storeId, perm)`; actor (`userId`, for audit) vs account (`sellerId`, for filtering). Roles `orders`, `products`, `manager` + optional wallet view; store scope `all_stores` or `store_ids` (products, coupons, reviews, riders and marketplace orders have no `store_id`, so all-stores in v1). Migration sketch: `store_staff` (sha256 invite token, 7-day expiry), `seller_audit_log`, `seller_push_subscriptions.user_id`. Media uploads must move to server-signed URLs (storage RLS is `{auth.uid()}/`).
- Inventory: 64 action files / 213 exports, 189 need a check (36 owner-only, 153 staff), 6 of 11 route handlers, the push cron fan-out, ~50 pages and 31 data loaders. Security review: 17 threats with mitigation + test each (incl. a static test that fails on an unguarded `"use server"` export). Top risks: wallet data via side doors (header balance, charts, search, counts, bell, push), user-id-as-seller-id actions, invite token leakage, stale access after removal, wallet refunds via order cancel.
- **Waiting on the owner:** 12 questions in §10 of the note (one seller per staff user, roles, store scope, seat count on Free, owner-only settings, cancel of wallet-paid orders, realtime vs 60 s bell, per-staff "seen", roadmap votes, invite expiry/notifications, audit retention, wallet top-up). Re-run the action counts at F-09c time; check the `product-images` bucket policy in Supabase first.

### 2026-10-30 — F-10a–c Stock history, low-stock alert and Inventory page built

- Migration `0125_stock_movements.sql`: server-only `stock_movements` (RLS on, no policies): seller, store, product, variant (no FK, so a deleted variant's history keeps its id), `delta` (never 0), `stock_after`, `reason` (`order`|`cancel`|`return`|`edit`|`bulk_edit`|`import`|`other`), `order_id`, `actor_user_id`, `created_at`; four indexes. Triggers on `products.quantity` and tracked `product_variants.stock` (NULL = not tracked; a product with variants records only its variants; unchanged values skipped), and an `order_items` insert trigger that fills the order, store and buyer on checkout rows (checkout takes stock before the order exists). New `seller_notifications` type `low_stock` (type check rebuilt with every existing type, guarded): fires when stock goes from above the threshold to at or below it, product active and not trashed, threshold `products.low_stock_threshold` (null = 5, also used for variants; no per-variant threshold), at most once per product/variant per Cairo day. Every trigger catches its own errors and only warns, so history or alerts never block a sale or a save. **Applied on staging 2026-10-30; production pending owner approval** (not needed before the deploy: without it nothing is recorded). Mirrored in `schema.ts`/`relations.ts`.
- Reason and actor come from `setStockContext` (`@workspace/db/inventory`, transaction-local settings read by the trigger; default `other`): checkout `decrementStock` → `order` (buyer); customer cancel (`apps/ecommerce/actions/order.ts`) and seller cancel (`orders.server.ts`) → `cancel`; product form → `edit`; Excel/URL bulk import and Shopify import → `import`; bulk edit apply/undo → `bulk_edit`; Inventory quick restock → `edit`. `place-order.ts` unchanged. It differs from CLAUDE.md rule 14: `apps/dashboard/actions/products.ts` got two one-line context calls and an optional `{ stockReason: "import" }` argument on `createProduct` (no other way to label form edits and imports). Admin edits and `createProductVariant` record `other`; `return` is never written (nothing restocks returns today).
- Dashboard: Products › Inventory (`/products/inventory`): low and out-of-stock list (up to 300, emptiest first) with atomic "+N" restock (store cache refreshed), and with `?product=<id>` that product's stock lines and last 100 changes linked to orders. Every query scoped to the session seller, trashed and purged products left out. Reached from the sidebar, routes list/command palette, the product edit header ("Stock history") and the bell (`low_stock` row with name, variant and stock, plural forms in ar/en). F-06 push already maps `low_stock` with the same data keys. No Admin change.
- Checks: `tsc` clean for dashboard, `packages/db`, `packages/lib`; ecommerce the same 16 existing errors. Dashboard 381 pass, 7 skipped; `packages/lib` 679 pass + the known `starter-forms.lib.test.ts` failure; `packages/db` unit tests pass. The new trigger integration test (`stock-movements.integration.test.ts`) fails in setup on staging because staging lacks 0113 (`sellers.admin_contacted_at`), the known gap; instead the migration ran twice in rolled-back transactions on staging and confirmed reasons (unknown → `other`), actor, variant rows, once-a-day low-stock alert and order/buyer linking. Browser E2E pending: sidebar, Inventory page, restock, bell, push.

### 2026-10-30 — F-06a/b New-order push alerts built

- Migration `0124_seller_push_subscriptions.sql`: `seller_push_subscriptions` (endpoint unique, p256dh/auth keys, user agent, locale) and `seller_push_settings` (per-type switches, no row = all on), both RLS on with no policies, plus `seller_notifications.pushed_at` (the dispatcher's claim; existing rows older than an hour marked handled). Additive, idempotent, mirrored in `schema.ts`/`relations.ts`. **Applied on staging** (re-run 2026-10-30: every statement skipped cleanly); **production pending owner approval** (code selects named columns, so it can land before or after the deploy, but before push is turned on).
- Dashboard: Settings › Phone alerts (`#push-alerts`): turn on for this device, send a test alert, turn off; three switches for all devices (new orders; order problems = `carrier_shipment_failed` / `carrier_needs_attention`, which is where refused deliveries arrive (no separate "refused" type); low stock = F-10's `low_stock`). iPhone/iPad Safari gets "install the app first" help (iOS 16.4+). The card shows only when VAPID keys are set. The bell popover links "Get new orders on your phone" when push is supported and never asked. No Admin change needed.
- Sending (`apps/dashboard/lib/push/`): each run claims recent `seller_notifications` rows (`pushed_at`, `FOR UPDATE SKIP LOCKED`), never twice; rows older than 60 min are dropped; a seller's rows go only to that seller's devices; texts carry the order number (and amount for store orders), no customer data. 404/410 endpoints are deleted; only FCM, Mozilla, WNS and Apple endpoints are accepted. `sw.js` handles push and notification clicks only (no fetch handler, no caching), opens dashboard pages only; served no-cache with a strict CSP from `next.config.ts`; `proxy.ts` skips it.
- **Needed before it works:** env `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`npx web-push generate-vapid-keys`), `CRON_SECRET`; and a **Supabase Database Webhook** on INSERT into `seller_notifications` → POST `https://dashboard.tallaby.com/api/cron/seller-push` with `Authorization: Bearer <CRON_SECRET>` (staging, then production). It's not in the migration because the secret would go into git. The Vercel cron `/api/cron/seller-push` (`45 4 * * *`) only cleans up; without the webhook alerts almost never arrive.
- Checks: dashboard `tsc` clean; dashboard vitest 375 pass, 7 skipped (19 push tests); `packages/db` 7 pass (rest skipped, no `TEST_DATABASE_URL`); `packages/lib` 679 pass, 1 known failure (`starter-forms.lib.test.ts`). Dispatcher ran once on staging with throwaway keys: `{enabled:true, claimed:0, sent:0}`. New deps `web-push`, `@types/web-push`. Browser E2E pending: real push on Android Chrome, desktop Chrome/Edge/Firefox, installed iOS app; tap opens the order; turn off per device; dead endpoint cleanup.

### 2026-10-30 — F-25a/b Checkout form and thank-you page settings built

- Store settings › Checkout (`/stores/[storeId]/settings/checkout`, tab + sidebar entry + route registered): email, second phone, one custom question and order notes, each hidden / optional / required, with field order and a live preview. Saved in `stores.settings.checkoutForm` and `stores.settings.thankYou` (other keys kept). No migration. Name, phone and address stay outside the setting: they come from the customer's address, which `place-order.ts` already requires; governorate and area were already dropdowns.
- Checkout validation: `createOrder` (`apps/ecommerce/actions/order.ts`) reads the form of the store from the request host only, checked against its seller; `applyCheckoutAnswers` (`packages/lib/src/stores/checkout-form.lib.ts`) ignores hidden fields, enforces required ones, validates email, normalises the second phone to `01XXXXXXXXX`, caps the custom answer at 300 and the customer note at 1,000 characters (`CHECKOUT_NOTES_MAX`). Answers are written into `orders.notes` as labelled lines, so Orders, print-outs and export show them with no new column. With no saved form, notes pass through exactly as before. `place-order.ts` and money logic untouched; marketplace checkout and order page unchanged (every new path returns null without a store host).
- Thank-you page (store host only): the seller's message (plain text, max 500), a "Confirm on WhatsApp" `wa.me` button with the store number and order number while the order is `pending` (this is the F-02g thank-you link), and up to 4 in-stock products of the same store (best sellers, then newest, without the ordered ones). Pixels (`MetaPurchase`, `HostStoreTracking`, server-side Meta Purchase) untouched. A failing thank-you lookup is logged and the page renders as before.
- Dashboard save `saveStoreCheckoutSettings(storeId, input)`: explicit `storeId`, `requireStore(..., { forWrite: true })`, update filtered by `stores.sellerId`, rate-limited, zod + shared sanitisers; a shown custom question without a label is refused. Settings are read fresh from the store row, so no storefront profile key bump.
- Checks: `checkout-form.lib.test.ts` 15/15, `checkout-settings.dto.test.ts` 3/3; `packages/lib` 678 pass, 1 known failure (`starter-forms.lib.test.ts`); `tsc` clean for lib and dashboard, ecommerce the same 16 existing errors. DB integration tests skipped (no `TEST_DATABASE_URL`). Browser E2E pending: each field mode at checkout (and a form change mid-checkout), notes in Orders/print/export, thank-you message + WhatsApp button + suggestions, Purchase pixel fires once, the Checkout tab in ar/en.

### 2026-10-30 — F-11a/b Product feeds built

- One public feed per store for Meta catalog, Google Merchant Center and TikTok catalog: `https://<store host>/api/feeds/products.xml` (RSS 2.0 with `g:` fields) and `/api/feeds/products.csv` (same columns, UTF-8 BOM); `?lang=ar|en`, default the store's first language. The store comes only from the request host (subdomain or active custom domain); tallaby.com, unknown hosts and offline stores get 404, a renamed subdomain gets 308. Active, non-trashed products of that store's catalog (selected mode respected), newest first, max 5,000 items; one item per variant (`item_group_id`, `?variant=` link); price and sale price in the store currency, up to 10 extra images, brand, colour/size, gallery video, `google_product_category` from a code-only slug map (falls back to the parent; all 19 staging roots covered). XML escaped, CSV quoted, public catalog data only.
- Cached with `@workspace/cache`, tags with seller + store ids (product edits and catalog picks clear it; currency cache keyed on `sellerTags.subdomain`, key `store-feed:currency:v2`), plus 15 min CDN cache.
- Dashboard: Store › Apps › "Product feeds" section (All tab) with Meta, Google and TikTok cards: feed URL, copy button, English URL when the store has English, four setup steps, a note when the site isn't published. No sidebar change (existing Apps route); no Admin change needed. No migration.
- Files: `apps/ecommerce/app/api/feeds/[file]/route.ts`, `apps/ecommerce/lib/product-feed/` (lib, server, google-category, tests), `apps/dashboard/app/(main)/stores/[storeId]/apps/product-feeds.{client.tsx,lib.ts,lib.test.ts}`.
- Checks: ecommerce feed tests 25 and dashboard 2 pass; dashboard `tsc` clean, ecommerce the same 16 existing errors. Read-only feed query on staging OK (51 products, ~300 ms; the only published staging store has 0 products). Browser E2E and Meta/Google/TikTok feed validators pending. Production needs `0123` before this deploys (already the rule).

### 2026-10-30 — F-22, F-24a/b and F-15b built (three parallel subagents)

- **F-22 Sales pop-up.** Small toasts on the store website built from that store's real recent orders ("Someone from Giza ordered …, 12 minutes ago"): product, governorate and time only, no names or phones. Feed: last 7 days, newest 10 non-cancelled orders, scoped by seller and the store from the request host (`packages/lib/src/stores/sales-popup.{lib,server}.ts`); hidden with fewer than 3; cached 5 minutes per seller, store and language (`storeTags.recentOrders`), with the age worked out on each render. It differs from the plan: no public HTTP endpoint (the feed is loaded server-side with the page), and the toast is part of the store shell, not a builder element. Store settings › Sales pop-up: off by default, delay 3–120 s, pages (home, products, product pages, other); never on cart, checkout, account, sign-in or wishlist pages, offline stores or the builder preview; follows reduced motion. Settings in `stores.settings.salesPopup`; storefront profile cache key bumped to v13. No migration. The feed query ran read-only on staging (0 rows there).
- **F-24a/b Bulk product editing.** New `app/(main)/products/bulk-edit/` (dto, lib + 28 tests, signed undo token, server actions, dialog); nothing added to `actions/products.ts`. One transaction, rows locked and scoped by seller, trashed products skipped; price by % or amount in piastres (regular, sale and variant prices move together; whole-pound rounding on by default; a product is skipped if any price would reach 0); discount %/amount/remove with an optional end date; stock set/add/take (never below 0); publish/draft with the Publish switch rules; category counts and caches cleared. Preview shows before → after per product and variant with skip reasons. Undo for 10 minutes with an HMAC-signed token (key derived from `INTEGRATIONS_ENCRYPTION_KEY`, bound to the seller), only for products still holding the edited values. Products list: selection bar in both views with "Select all N" (the filtered list, so a whole category) and "Edit selected"; max 500 per edit. Store visibility left out (catalog all/selected modes; Catalog settings covers it).
- **F-15b Per-product views.** One GA4 report per seller (page path, `store_id` in the seller's stores, product-page paths), cached 1 h under the store-views tags so Store views › Refresh clears it (`lib/analytics/product-views.{lib,server}.ts`). Paths map to the seller's own non-trashed products by slug (page locale first). Views → orders = store-website orders with the product (not cancelled, last 30 Cairo days) ÷ views, only when views > 0; orders aren't cached. Products table: "Views (30 days)" column, streamed, "—" without GA4; edit page: header badge. Grid cards don't show it yet (one-line follow-up in `vendor-products.section.tsx`).
- No migrations. Checks after all three: `tsc` clean for dashboard, lib, cache, db, admin, store-sections; ecommerce has the same 16 existing errors. Tests: dashboard 352, lib 663 (1 existing failure in `starter-forms.lib.test.ts`, unrelated), cache 41, store-sections 10011, ecommerce 191 — all pass. Message files parse; edits were insertions only. ESLint still crashes (tooling). Browser E2E pending for all three; F-15b also needs `GA4_*` set to see real numbers.

### 2026-10-30 — F-35 Product trash built

- Migration `0123_product_trash.sql`: `products.deleted_at`, `deleted_by`, `trashed_status` (`product_status`) and `purged_at`, plus partial index `products_trashed_idx (seller_id, deleted_at) WHERE deleted_at IS NOT NULL AND purged_at IS NULL`. Additive, idempotent. **Applied on staging 2026-10-30** (re-run: notices only); **production pending owner approval, before the deploy** (the product queries select every column). Mirrored in `schema.ts`.
- It differs from the plan (F-35b): instead of adding a `notDeleted` filter to every product read, trashing sets `status = 'draft'` and keeps the old status in `trashed_status`. An audit of every product read (2026-10-30) found that storefront, marketplace, search, sitemaps, feeds, recommendations, store catalogs and `place-order.ts` already require `active`, so they hide trashed products with no change. The reads that don't (cart page, checkout summary, coupon subtotal, missed-order lead, abandoned-cart email) all go through `cart_items`, so trashing removes the product from shoppers' carts. Seller lists that show drafts got an explicit `deleted_at IS NULL`: `getSellerProducts` (list, count, Excel export, ad picker), sidebar product count, dashboard search, coupon product picker, store catalog picker, category/brand counts. `updateProduct`, `toggleProductStatus` and `setProductPublished` refuse a trashed product, and its edit URL redirects to Trash.
- Server (`packages/lib/src/products/trash.{lib,server}.ts`, exported as `@workspace/lib/products/trash` and `/products/trash/server`): `trashProducts`, `restoreProducts` (puts the old status back; a live product returns as draft when it has no photo or the seller can't publish, like the Publish switch), `deleteTrashedProductsForever`, `purgeExpiredTrash`, `listTrashedProducts`, `countTrashedProducts`. Every seller function takes the session seller and scopes each write by it; ids are validated and capped at 100. Category counts and cache invalidation run on trash and restore.
- Deleting for good: `order_items`, `cart_items`, `reviews` and `search_logs` reference `products` with no cascade, so today's hard `deleteProduct` already failed for any product that was ever ordered or reviewed. Now the cart lines and reviews are removed, search click links set to null, and the row deleted; when orders still point to it, the row stays (stamped `purged_at`, out of Trash, still `draft`) so order history keeps it.
- Dashboard: `app/(main)/products/trash/` (`trash.server.ts` actions, `page.tsx`, `trash.client.tsx`). Products' row delete, bulk delete and table bulk delete call `trashProductsAction`, the dialog says it stays in Trash for 30 days, and the toast has Undo. Products › Trash (sidebar entry, route registered) lists photo, name, deleted date and days left, with Restore and Delete forever (confirm), single or selected. Strings: `products.trash`, `products.list.{undo,restored,restoreFailed}` and the new delete copy, `nav.productTrash`, in ar and en. The old `deleteProduct` in `actions/products.ts` has no callers now (left in place).
- Cron: `apps/ecommerce/app/api/cron/product-trash` (daily 04:00 UTC in `vercel.json`, `CRON_SECRET`), up to 500 per run, returns `{ deleted, kept }`.
- Not done: no Trash count badge in the sidebar; admin product lists show trashed products as drafts (no "in trash" mark); wishlists still list a trashed product, as they already do for unpublished ones.
- Checks: 5 unit tests (`trash.lib.test.ts`) and 5 integration tests on staging (`trash.integration.test.ts`: trash hides and empties carts, restore, can't-publish restore, another seller refused everywhere, sold vs unsold delete forever, purge after 30 days only) pass. `tsc` clean for dashboard, lib, db, admin; ecommerce has the same 16 existing errors. Dashboard tests pass (314). `packages/lib`: 652 pass, 1 fails, and it already failed without these changes (`starter-forms.lib.test.ts`: the dashboard's Arabic contact-form success text was reworded to Egyptian Arabic, "وهنرد عليك قريب", and the starter copy wasn't updated). ESLint still crashes (tooling). Browser E2E pending.

### 2026-10-30 — F-34a–c Low-stock alert built

- Migration `0122_product_low_stock_badge.sql`: `products.show_low_stock_badge boolean NOT NULL DEFAULT false` and `products.low_stock_threshold integer` (CHECK 1–99; null = 5), idempotent. **Applied on staging 2026-10-30** (re-run is a no-op); **production pending owner approval, before the deploy** (the product queries select every column). Mirrored in `schema.ts`.
- One rule for all apps: `lowStockLeft(stock, { show, threshold })` and `lowStockAlertText` in `packages/store-sections/src/core/low-stock.ts`, exported as `@workspace/store-sections/low-stock` (a small subpath, so the product form doesn't pull in the templates). Real stock only; nothing at 0 (sold out shows instead) or above the threshold.
- Dashboard: "Show a low-stock alert" checkbox with "Show when stock is at or below" (empty = 5) in the product form section, renamed "Reviews, live views and stock alert". Saved through `saveProductSocialProof` (the 0111 path, not `actions/products.ts`), which takes `showLowStockBadge` and `lowStockThreshold` and checks the product is the session seller's. Not offered to AI autofill.
- Storefront: on the store product page the stock element (`StoreProductStock`) shows `StoreLowStockAlert` instead of the "Only N left" pill when the alert applies, following the selected variant's stock (flame icon that pulses only with motion allowed, the store's danger colour, `storeProduct.lowStockAlert` ICU plurals in ar/en). The deal countdown keeps showing in the price block when the offer has an end date. Store cards built by `toSummary` (`catalog.server.ts`) get `stockLeft`, and the generic `ProductCardView` shows a "باقي N" / "N left" tag. The editor's still `productStock` element shows the same badge when `ProductDetail.lowStockAlert` is set. The marketplace product page is unchanged.
- It differs from the plan: cards drawn by tree templates (bound nodes) don't show the tag yet; that comes with F-34d's builder element. The builder preview's product data (`preview-product.lib.ts`) doesn't carry the setting (it doesn't carry live views either).
- Checks: 5 new `low-stock` unit tests, 2 new element/card tests; store-sections (10011), dashboard products/orders/print (153) and ecommerce store-site/product-page (28) tests pass; `tsc` clean for dashboard, store-sections, lib, db and store-editor; ecommerce shows the same 16 existing errors before and after. A new case in `social-proof.integration.test.ts` (save/load, out-of-range threshold refused by zod and the DB CHECK, another seller refused) **could not run on staging**: staging lacks `0112` (`products.ai_source`), so the fixture's product insert fails; it runs once staging has 0112. ESLint still crashes (tooling). Browser E2E pending (form ar/en, product page with variants at 1/2/threshold, cards).

### 2026-10-30 — F-04d Picking list built

- Third document on the F-04a print route: `/print/orders?doc=picking&ids=…&lang=ar|en`, one A4 sheet for all the printed orders (`PickingDocument` in `app/print/orders/print-documents.tsx`). Each product and variant appears once (grouped by `product_id` + `variant_id`, else by name, variant and SKU for old lines) with a tick box, the variant and SKU, the total quantity in large type, and the order numbers it goes into. The header shows the order and piece counts and when it was printed; the store's name and logo appear only when every order is from the same store. The footer lists the included orders with the customer name. Rows are sorted by product name, then variant, so one product's sizes and colours sit together (`pickingList` in `print-orders.lib.ts`).
- Entry point: "Picking list (A4)" in the "Print (N)" menu on the orders list and in the bulk bar (F-04c), not in a single order's menu. The toolbar on the print page switches between invoice, slip and picking list.
- Same isolation as F-04a: `loadPrintOrders` reads only the session seller's orders and only their lines (now with `productId`/`variantId` too), at most 50 orders.
- It differs from the plan: "for a day" is the orders list's filters plus the selection (pick a tab and store, select, print), not a separate date picker.
- Strings: `orders.print.{picking,unitsCount,printedAt,picked,inOrders,includedOrders}` and `orders.printActions.picking` in `ar.json` and `en.json`.
- No migration. Checks: 3 new `pickingList` unit tests and 2 server-render tests of the sheet (`print-documents.test.ts`); dashboard `tsc` clean; dashboard orders + print tests pass (46). ESLint still crashes (tooling). Browser print preview (ar/en, A4, many rows across pages) pending with the F-04a E2E.

### 2026-10-30 — F-04c Orders bulk actions built

- /orders now has a selection: a checkbox on each order card plus "Select all (N)" above the cards, and the table's own row checkboxes (`TableSection` takes optional controlled `rowSelection`/`onRowSelectionChange` and keys rows by `id`; other tables keep their internal state). Only orders still on screen count as selected. While something is selected, `OrdersBulkBar` (`app/(main)/orders/orders-bulk.client.tsx`) shows the count, Clear, a button per stage move that fits at least one selected order (with how many), and Print / Export of the selection (the F-04a/F-04b buttons).
- Bulk stage moves: confirm, out for delivery, delivered, cancel (`BULK_ORDER_ACTIONS` in `orders-bulk.lib.ts`). "Delivery failed" (needs a reason per order) and "Mark returned" stay on the order. Every bulk move asks first; the dialog says how many selected orders don't fit and will stay as they are.
- Server: `bulkUpdateSellerOrders({ orderIds, action })` in `orders.server.ts` (at most 50 UUIDs per call; the client sends bigger selections in chunks). Each order runs through `runSellerOrderAction`, now shared with the single-order `updateSellerOrder`: session seller, the order must have one of their lines, the move must be one `resolveSellerOrderFlow` allows right now, and the same guarded writes, stock restore, emails, Bosta auto-ship and fee path. An order that changed meanwhile or isn't the seller's is skipped and counted ("N updated, M skipped"). No money or ledger logic changed.
- Strings: `orders.bulk` in `ar.json` and `en.json` (full Arabic plurals).
- No migration. Checks: 4 new unit tests (`orders-bulk.lib.test.ts`); dashboard `tsc` clean; dashboard orders + print tests pass (41); `packages/ui` `tsc` shows the same 19 existing errors (other apps' path aliases) before and after. ESLint still crashes (tooling, see F-01b). Browser E2E pending (staging seller: select on cards and table, bulk confirm on a Bosta auto-ship store, bulk cancel restocks, a mixed selection skips the orders that don't fit).
### 2026-10-30 — Store apps catalog, Wassalha, free delivery (owner)

- The owner asked to bring together everything discussed today (apps, shipping companies, payment methods) in one clean, DRY structure. Built on local `main` (not pushed):
  - **F-41 catalog:** `STORE_APPS` drives the Apps page (new Payments tab; Wassalha, Paymob, Kashier live; Mylerz, J&T Express, Aramex, PayPal, Tallaby Pay "Soon"), Shipping › Shipping companies and Payment methods › Online card payments. Shared `AppLogo` and `AppPageHeader`; the gateways card's own badges and catalog were removed; admin's two provider-name maps are now one.
  - **F-12c Wassalha:** provider `wassalha` (settings kind, no secret) in 0130 (renamed `0130_store_gateways_and_wassalha.sql`, still **not applied**); Store › Apps › Wassalha page; "Export for Wassalha" on the order card, order panel and the orders toolbar (one store picked). Reuses the ops app's `toEgyptPostRows` (now with optional sender, POD and note, and error codes) and the dashboard's `downloadXlsx`. Products' weights, else 998 g.
  - **F-12d:** the Shipping page's "Delivery partner" card became "Shipping companies" (all catalog carriers; Bosta's create-shipments choice kept).
  - **F-13b (free delivery):** none / over an amount / every order, applied to zones without their own free-over. Production check: no store had `freeShippingOver` set, so nothing changes for live stores.
- Checks: lib 685 pass (only the existing `starter-forms.lib.test.ts` failure), new tests for the catalog, Wassalha settings/rows, item weights and the store-wide free delivery; dashboard 305, ecommerce 191, admin 69 pass. Typecheck clean for lib, dashboard, admin, backend, shipping; ecommerce only the baseline `profile.chunks.tsx` errors. Lint still crashes (baseline).
- Deploy order: apply 0130 (staging, then production) before deploying: saving Wassalha or a gateway writes the new providers.

### 2026-10-30 — F-39 Seller's own card gateway built (owner)

- The owner asked for payment methods in two kinds: internal (Tallaby's Kashier, money to the store wallet) and external (the seller's own Paymob, Kashier or PayPal). Decided: build external now, internal "Soon"; PayPal "Soon" (no EGP); seller-gateway orders are fee-only (`PLAN.md` §13.4). Added as F-39.
- Built: migration `0130_store_gateways_and_wassalha.sql` (providers `paymob`, `kashier`; **not applied**), `packages/lib/src/payments/store-gateways.{lib,server}.ts`, the "Online card payments" card on Store settings › Payment methods, storefront card checkout on the seller's gateway, `apps/ecommerce/app/api/store-payments/return`, `apps/backend/src/routes/store-payments.ts`. Connects and disconnects are audited in `store_settings_audit` (`gateway_connected` / `gateway_updated` / `gateway_disconnected`, key hint only).
- Checks: lib tests pass except the existing `starter-forms.lib.test.ts` failure (fails on `main` too); 28 new tests in `store-gateways.lib.test.ts`. Dashboard 305, ecommerce 191 tests pass. Typecheck clean for lib, dashboard, backend, admin; ecommerce only the baseline errors (`profile.chunks.tsx`). Lint still crashes (baseline).
- Independent review fixes: storefront card orders were refused by `createOrder`'s marketplace card switch (now only the store's gateway decides there); payment rows are keyed `store:<integrationId>:<provider>:<id>` and matched with the order, so a seller who signs fake webhooks can't claim or block another store's payment; a cancelled order is never confirmed by a late payment (kept as pending for refund); test-mode warning on the connected gateway. Open (F-39f): disconnecting or changing keys drops in-flight payment results; footers don't list card.
- On branch `feat/store-payment-gateways` (not merged to `main`), so unreviewed money code doesn't auto-deploy.
- Deploy order: apply 0130 (staging, then production) **before** deploying, because connecting writes the new providers. Set `STORE_PAYMENTS_WEBHOOK_BASE_URL` (or `BACKEND_API_URL`) to the public https backend on dashboard, ecommerce and backend.

### 2026-10-30 — Migrations 0117–0121 on production; work committed

- Owner applied `0118`–`0121` on production on 2026-10-30. A read-only check the same day found `0117` (referral program) on production too, along with `0118` (`store_blocked_phones`), `0119` (welcome gift), `0120` (`store_checkout_leads`) and `0121` (`store_customer_notes`). `0112` and `0113` are also on production but not on staging. CLAUDE.md rule 6 and the Status lines are updated.
- All the uncommitted work went into one commit to `main` and was pushed: F-01 (customers), F-02 (protection), F-04a/b (print, export), F-36 (store app), plus the template and section work in the tree.

### 2026-10-30 — Public /roadmap cards updated (production)

- Owner-approved write to production `feature_requests` (one transaction, guarded on the old status, exactly 6 rows): F-01, F-02, F-03, F-04 and F-36 `planned` → `in_progress` (built, not live yet: their migrations are staging-only); `L-coupon-popup` `in_progress` → `launched` (`launched_at` 2026-10-30; `coupons.popup_trigger` is on production).
- `feature_requests` exists on **production only**; staging has no 0115 (CLAUDE.md rule 6 still says "not applied yet").
- No cards yet for the welcome gift, F-37 affiliates or F-38 SMS; add them from Admin › Seller roadmap if wanted. When a feature deploys, move its card to `launched` with the date.

### 2026-10-30 — F-04b Orders export built

- "Export (N)" button on the orders list, beside Print. It downloads exactly the orders on screen (sales channel, tab, search and the Bosta attention filter applied) as `orders-<date>.xlsx`, built in the browser with the existing `downloadXlsx` (SheetJS loaded only on click), like the F-01d customers export. No server call and no migration: the rows are already this seller's, loaded by `/orders`.
- It differs from the plan: .xlsx only, not CSV too; and the page loads the newest 200 orders (`LIST_LIMIT` in `orders.query.ts`), so the export covers at most those. A date-range export of older orders needs a server query (later, with F-04c if sellers ask).
- Columns come from `ORDER_EXPORT_COLUMNS` and `orderExportRow` in `app/(main)/orders/orders-export.lib.ts`: order number, date (`YYYY-MM-DD HH:mm`, Cairo time), sales channel (store name or Tallaby marketplace), status (stage label), customer, phone (text, keeps the leading 0), email, address, area, items (`name (variant) × qty`, this seller's lines only), quantity, your items total, shipping, discount, order total, payment method and status (translated), amount to collect (`amountToCollect`, same rule as the print slip), Bosta tracking number, notes. Money cells are numbers in EGP. Headers in `orders.export` in `ar.json` and `en.json` (20 columns in both).
- Checks: 4 new unit tests (`orders-export.lib.test.ts`); dashboard `tsc` clean; dashboard orders + print tests pass (37). ESLint still crashes (tooling, see F-01b). Browser E2E pending: `apps/dashboard/.env` points at production, so it needs staging overrides and a signed-in staging seller.

### 2026-10-30 — F-04a Invoice and packing slip print built

- New print route `apps/dashboard/app/print/orders/` (outside `(main)`, so no dashboard chrome): `/print/orders?doc=invoice|slip&ids=<uuid,…>&lang=ar|en&print=1`. A4 invoice and A6 packing slip, one sheet per order with a page break between them, Arabic RTL or English (defaults to the dashboard language; the toolbar switches document and language). `print=1` opens the print dialog once fonts and the logo have loaded. `force-dynamic`, noindex, never cached (customer data).
- Isolation: `loadPrintOrders(sellerId, ids)` reads only orders that have at least one of the session seller's `order_items`, prints only that seller's lines, and reads a store (name, logo, website or active custom domain, contact phone) only when `stores.seller_id` is the seller's. Unknown or foreign ids are dropped. Ids are validated as UUIDs, deduped and capped at 50 (`PRINT_MAX_ORDERS`).
- The sender is the order's store; a marketplace order prints in Tallaby's name. The courier box shows the order total for an unpaid COD order (`amountToCollect`), else "Nothing to collect". When another seller's lines share the order, the printout shows only "Your items" and no order totals or amount to collect.
- Entry points: `PrintOrdersButton` (`app/(main)/orders/print-orders-button.client.tsx`) in the order panel header (Invoice / Packing slip) and on the orders list ("Print (N)" for the orders on screen). Strings: `orders.print` and `orders.printActions` in `ar.json` and `en.json` (35 + 7 keys, same in both).
- It differs from the plan: no barcode yet (left to F-04e).
- No migration. Checks: dashboard `tsc` clean; dashboard orders + print tests pass (33, including 7 new in `print-orders.lib.test.ts`). ESLint still crashes before linting (tooling, see F-01b). Browser E2E (ar/en, A4 and A6 print preview, a store logo, a mixed-seller marketplace order) pending.

### 2026-10-30 — Storefront categories from the seller's own list

- Storefront category lists, the catalog filter (`/products?category=`), category product lists and the product breadcrumb now use the seller's categories (`seller_product_categories`, 0068) instead of Tallaby root categories. One rule, `storeCategoryGroups` in `packages/lib/src/store-sites/catalog-data.server.ts`: a product sits in its `seller_category_id`; an unlinked product sits in the seller category picked from its Tallaby category (`source_category_id`); anything else (products made before 0068) falls back to its Tallaby root as before. Order: the seller's categories in their order, then roots by size. The seller's category photo is used first, then the best-rated product photo. `getProducts` takes a matching `storeCategory` filter. The dashboard and admin builder previews use the same groups, so a category picked in the builder is the same key the storefront uses. Related products still match on the Tallaby category (`relatedCategoryId`). Adding a category picked from a Tallaby one now clears the seller's storefront cache.
- `seller_categories` (0002) is dead: 0 rows on staging, and no code reads or writes it (only the Drizzle schema and relations). It can be dropped in a later migration (owner approval needed). On staging, none of the 97 products had `seller_category_id` (all were made before the product form linked one), so every store still shows root categories until the seller picks or saves categories.
- No migration. Checks: the query ran on staging read-only, and in a rolled-back transaction with a picked and an own category; store-sections tests (205 + 1 new), store-editor tests (143) and ecommerce `lib/store-site` tests (19, breadcrumb tests rewritten) pass; `tsc` is clean apart from the existing `profile.chunks.tsx` errors in ecommerce. ESLint still crashes (tooling). Browser E2E pending.

### 2026-10-30 — F-01d Customers export built

- "Export (N)" button on Orders › Customers, beside Sort. It downloads exactly the rows on screen (search, filter, tag and sort applied) as `customers-<date>.xlsx`, built in the browser with the existing `downloadXlsx` (`lib/product-excel.ts`, SheetJS loaded only on click). No server call and no migration: the rows are already this seller's, loaded by the page.
- It differs from the plan: .xlsx only, not CSV too (opens in Excel and Google Sheets; Arabic shows correctly without a BOM).
- Columns come from `CUSTOMER_EXPORT_COLUMNS` and `customerExportRow` in `packages/lib/src/customers/customers.lib.ts`: name, phone (text, keeps the leading 0), email, governorate, city, orders, delivered, refused or returned, cancelled, spent (number in EGP), delivered %, first and last order (`YYYY-MM-DD HH:mm`, Cairo time), tags, note. Headers in `customers.export` in `ar.json` and `en.json`.
- Checks: 2 new unit tests (17 in `customers.lib.test.ts`); dashboard `tsc` clean; dashboard orders, sidebar and product-excel tests pass (59). ESLint still crashes (see F-01b). Opening a real export in Excel is part of the pending browser E2E.

### 2026-10-30 — F-01c Customer notes and tags built

- Migration `0121_store_customer_notes.sql`: server-only `store_customer_notes` (`store_id`, `customer_key`, `note` ≤ 2000 chars, `tags text[]` ≤ 10, `updated_by`; unique per store + key; RLS on, no policies). **Applied on staging 2026-10-30; production pending owner approval, before the deploy** (the Customers page reads it). Mirrored in `schema.ts` and `relations.ts`.
- It differs from the plan: the row is keyed by the Customers page's `customer_key` (`p:<phone>` or `u:<user id>`), not by `phone`, so customers without a usable phone can have notes too.
- Server: `listStoreCustomerNotes` and `saveStoreCustomerNote` in `packages/lib/src/customers/customers.server.ts` (both join `stores` on the session seller; an empty note and no tags delete the row). Dashboard action `saveCustomerNote` in `app/(main)/orders/customers/customers.server.ts` (`requireStore(..., { forWrite: true })`).
- UI: "Notes and tags" box in the customer drawer (tags added with Enter or a comma, suggestions from the store's other tags, Save button), tags and a note icon under the name in the table, a tag filter row, and the search matches note and tag text. Strings: `customers.notes` in `ar.json` and `en.json`.
- Checks: dashboard `tsc` clean; 15 unit and 4 integration tests in `customers` pass with `TEST_DATABASE_URL` = staging (the F-01c test checks another seller can neither read nor delete A's note); dashboard orders and sidebar tests pass (55). ESLint still crashes (see F-01b). Browser check (ar/en, phone width) pending.

### 2026-10-30 — F-02d Order risk badge built

- `loadStoreOrderRisks(sellerId, orders)` and the pure `computeOrderRisks` are in `packages/lib/src/customers/`. For the orders on `/orders`, the query reads only the seller's stores' orders whose phone ends in the same 10 digits, then matches the exact customer key in code (same phone rule as the blocklist and Customers). No migration.
- **Refused:** the customer's other orders on the same store that were returned, or had a `failed`/`returned` shipment (delivered count shown alongside).
- **Possible duplicate:** another still-open order from the same phone on the same store within 10 minutes. Delivered, refused and cancelled orders are not duplicates.
- UI: `order-risk.client.tsx` (chips on the order card and in the table's customer column; a note in the order panel with a link to Orders › Customers). New strings: `orders.risk` in `ar.json` and `en.json`. New field `SellerOrderRow.risk`.
- Checks: 14 unit and 3 integration tests in `customers`, including the case where another seller's session sees no risk for A's orders. They pass with `TEST_DATABASE_URL` = staging. Dashboard orders and sidebar tests pass (55). `tsc` is clean except for uncommitted `store-sections/src/templates/vella` errors from another session (font "Jost"). ESLint still can't run (see the F-01b entry). Browser check is pending.

### 2026-10-30 — F-01b Customers page built

- Orders › Customers at `/orders/customers` (sidebar under Orders, after Not completed; the old "Customers belongs here" comment in `sidebar.config.ts` is removed). Files: `app/(main)/orders/customers/{page,customers.data,customers.server,customers.client}.tsx|ts`. Strings are in `customers` and `nav.customers` in `ar.json` and `en.json`. No migration.
- It differs from the plan: the page is under Orders with a store picker (like Not completed), not `stores/[storeId]/customers`. The drawer action `loadCustomerOrders` takes an explicit storeId through `requireStore`.
- Search, filter and sort run in the browser on the loaded list, using `selectStoreCustomers` in `packages/lib/src/customers/customers.lib.ts` (4 new unit tests, 12 in total).
- Checks: `tsc` is clean for `@workspace/lib` and the dashboard; the dashboard sidebar tests (26) and the customers unit and integration tests pass. **ESLint could not run**: ESLint 10.9.1 crashes loading `@typescript-eslint/utils` 8 ("Class extends value undefined"), a toolchain problem that affects the whole repo. Manual check in the browser (ar/en, phone width) is still to do.

### 2026-10-30 — MersalSMS request (owner)

- The owner asked to integrate MersalSMS for OTP and order confirmations. Added as F-38 (P1, #12 in §3). F-02f is no longer blocked on a provider, and F-14a's SMS part depends on F-38b. WhatsApp automation (F-14, F-16c) still has no provider.
- Open for the owner (F-38a): API docs and credentials, price per SMS, who pays, sender ID per store or one shared.

### 2026-10-30 — F-01a Customers query built

- `packages/lib/src/customers/customers.{lib,server}.ts` plus exports in `packages/lib/package.json`. No migration. It uses the uncommitted `stores/blocked-phones.lib.ts` (F-02) for phone normalisation.
- It differs from the plan: the code is in `packages/lib`, not `app/(main)/stores/[storeId]/customers/`, so F-01b and F-02d can share it.
- Tests: `customers.lib.test.ts` (8 unit tests) and `customers.integration.test.ts` (grouping, refused shipment, two stores of one seller kept apart, another seller's store id returns nothing). Both pass with `TEST_DATABASE_URL` = staging. `tsc` on `@workspace/lib` is clean; the package has no lint script.

Newest first. One entry per finished task or decision: date, task, what changed, migrations (number, staging/production status), verification, notes.

### 2026-10-29 — F-03 Missed orders built (owner)

- **Capture** (`apps/ecommerce/actions/checkout-lead.ts`): on a store host, once the checkout has a shipping address (on load with a default, or when one is picked/added), the server saves a lead from the host's store, the session's cart and that user's own address: name, phone (`01XXXXXXXXX`), governorate, city, a cart snapshot, subtotal, shipping (the same quote the checkout shows) and total; a signed-in customer's real email (never the guest placeholder). One open lead per store + phone; rate-limited; never blocks the checkout. Consent line under the address: «ممكن نتواصل معاك بخصوص طلبك» / "We may contact you about your order".
- **Drop off**: an `AFTER INSERT` trigger on `orders` converts the store's open lead for the same cart, user or phone (a guest with a new cookie still drops off); no change to the checkout or order code (F-02's uncommitted files untouched).
- **Dashboard** `/orders/missed` ("طلبات لم تكتمل / Not completed", Orders sidebar group): all the seller's stores (store filter), date and contacted filters, cards with items, subtotal/shipping/total, "left X ago", "Reminder email sent" (the cart's existing daily store-branded email) and "Contacted" badges; WhatsApp (store's message, placeholders {name} {products} {total} {store} {link}), Call, Mark contacted/Undo; WhatsApp message editor per store (`stores.settings.missedOrders.whatsappTemplate`, default in the store's language).
- **Migration 0120** (`store_checkout_leads`, RLS on, no policies; conversion trigger): **applied on staging 2026-10-29 (twice, idempotent); production pending owner approval, before the deploy.** Daily cleanup cron `/api/cron/checkout-leads` (03:45 UTC, 30 days).
- Verified: `checkout-leads.lib.test.ts` 6/6; `checkout-leads.integration.test.ts` 4/4 on staging (one lead per phone, conversion by cart/phone, tenant isolation for list/contacted/template, cleanup), cleanup verified; dashboard tests 294 pass; typecheck clean (ecommerce: only the existing `profile.chunks.tsx` errors). Manual E2E (store checkout as guest → address → leave → seller list → WhatsApp) not run yet.

### 2026-10-29 — Welcome gift: EGP 100 for new sellers, 7-day trial paused for them (owner)

- **Rule** (PLAN.md §13.1): a seller created after 0119 gets EGP 100 in the store wallet once they chose a template themselves, have an active product and published the website; once per account; valid 30 days, then the unspent part is removed (fees and ad charges spend it first; never the seller's own money). No 7-day trial for them; existing sellers keep theirs and never get the gift. Not a top-up, so no F-37 commission.
- **Pop-up**: the owner's image (`apps/dashboard/public/100EGP gift.png`) with confetti, after Publish (after the "store is live" pop-up closes) or on the next dashboard page; Close / Go to wallet; shown once (`popup_seen_at`). Wallet page shows the gift left and its end date; seller bell rows on grant, 3 days before the end and at the end.
- **Migration 0119** (`seller_welcome_gifts`, `sellers.welcome_gift_eligible`, `fee_trial_eligible` default false, bell types): **applied on staging 2026-10-29; production pending owner approval, before the deploy.** Daily cron `/api/cron/welcome-gifts` (ecommerce, 05:15 UTC).
- Verified: `welcome-gift.integration.test.ts` 5/5 on staging; lib/dashboard unit tests; typecheck. Manual phone E2E not run yet. Design: `docs/superpowers/specs/2026-10-29-welcome-gift-design.md`.
- **Commits** on `main`: `a7d36530` (feature), `8150c0bc` (pricing page: flat EGP 5 only, owner: "don't mention 7 days free neither 100EGP free"), `44b926fd` (home page wallet + FAQ and Terms §4 without free days; Terms "last updated" 2026-10-29). The gift is not advertised on tallaby.com (owner).

### 2026-10-29 — F-36 Store app (PWA) built (owner)

- **Manifest per host** (`apps/ecommerce/app/manifest.ts`, request-time): a published store's subdomain or custom domain gets its own app (`name` = store name, `short_name` ≤ 12 chars via `appShortName`, `id`/`start_url`/`scope` `/`, standalone, `lang`/`dir` from the store's first language, icons 192/512 + maskable 512). tallaby.com and offline/unpublished stores keep the Tallaby manifest (`getRequestStoreApp`, `apps/ecommerce/lib/store-app.server.ts`).
- **Icons** (`apps/ecommerce/app/app-icon/[file]/route.tsx`, `next/og`): `/app-icon/{180,192,512}.png` on the store host, drawn from the **favicon** (owner), else the logo, else initials on dark (a bag icon for non-Latin names; the built-in font has no Arabic). `.ico`/`.webp` fall through to the next image. `?v=` = hash of image + name (`appIconVersion`), so a new favicon is a new URL (immutable cache). Store pages get `apple-touch-icon` and `apple-mobile-web-app-title` (`buildStoreMetadata`).
- **Footer button** (owner: "Download Application" on every template/store footer): new drawn element type `appInstall` (store-sections `schema.ts`, `registry.ts` (not in the palette), `render.tsx`, `ctx.renderAppInstall`); `drawChrome(…, "footer", { appInstall })` adds it to the footer tools row, never saved, so every template and every existing store footer gets it with no data change. Also in the default (non-builder) footer and the credit-only footer. Client `store-app-install.client.tsx`: Chrome/Edge/Android use the browser install dialog (`beforeinstallprompt`, caught at chunk load); iPhone and other browsers get a two-step guide; hidden inside the installed app.
- **Service worker** `public/store-sw.js` (registered by the button on production builds): caches nothing; a failed page navigation shows a bilingual offline page. Served with the Next.js PWA guide headers (`next.config.mjs`) and skipped by the proxy matcher.
- **Dashboard**: Store settings › **App** (`stores/[storeId]/settings/app/`, sidebar + command palette): home-screen preview (icon + short name, says whether it comes from favicon/logo/initials, link to Website › Design to change it) and the **"Download application" button in the footer** switch (on by default). Saved in `stores.settings.app.showDownloadButton` (`parseStoreApp`, `packages/lib/src/stores/store-app.lib.ts`); invalidates the storefront cache (profile cache key → `storefront-v12`). No migration.
- Verified: store-sections header tests 990 pass (new: every one of the 138 templates' footers gets exactly one button when allowed, none when hidden, never in the header); `store-app.lib.test.ts` (5); dashboard 294, ecommerce 190, store-editor 143 pass; typecheck clean for lib, store-sections, store-editor, dashboard, admin (ecommerce: only the old `profile.chunks.tsx` errors). Local run against staging (`qa-owner-store.localhost`): store manifest with the store name and versioned icons; `/app-icon/192.png` and the maskable 512 return PNGs (initials "QO", no favicon on that store); tallaby.com manifest unchanged and `/app-icon` 404 there; the home page has the apple-touch-icon, the app title and «حمّل التطبيق» in the footer; `/store-sw.js` served with no-store. The full store-sections run has 2 failures (`product-main` snapshot, `zz-survey`) from another session's uncommitted product-page/header work in the same tree, not from this change. Phone E2E (Android install, iPhone guide, a store with a PNG favicon) to do.

### 2026-10-29 — F-02g Confirm by WhatsApp (no API) built

- New store-website orders (stage "new", with a phone) get **Ask to confirm** in the order panel and on the order card: it opens `wa.me` to the customer with a prefilled message (name, order number, items with variant × qty, total, address, store name). The seller then uses the existing **Confirm order** action, so no new order state or migration.
- The message is per store: Store settings › **Order protection** › WhatsApp order confirmation message (live WhatsApp-style preview; placeholders `{name} {number} {items} {total} {address} {store}`; max 1,000 chars). Saved in `stores.settings.orderConfirm.template` (other keys kept); empty or the default text = the built-in default in the store's default language (Arabic or English). Logic in `apps/dashboard/app/(main)/orders/order-confirm.lib.ts`; the text is rendered on the server in `orders.query.ts` (`confirmMessage`).
- New orders not confirmed after **24 h** (`UNCONFIRMED_AFTER_HOURS`) are highlighted (amber border + "Not confirmed for N h") on the card and in the panel (`unconfirmedHours`, computed on the server).
- Not built (optional in the plan): "Confirm on WhatsApp" on the store's thank-you page; it belongs with F-25b.
- Navigation: sidebar › Store settings › **Order protection** (`sidebar.config.ts`) and the command palette (`dashboard-routes.lib.ts`, `ShieldCheck` icon), next to General and Payment methods.
- Verified: dashboard typecheck clean; dashboard suite 294 pass (incl. `order-confirm.lib.test.ts`, 6). Browser QA to do: `apps/dashboard/.env` is the production DB (no 0118 yet), so local QA needs staging env and a staging seller.

- Migration **`0118_store_blocked_phones`** (**applied on staging 2026-10-29**, re-run is a no-op; **production pending owner approval, before the deploy**: checkout and `/orders` read it): server-only `store_blocked_phones` (`store_id` → stores ON DELETE CASCADE, `phone`, `reason` ≤ 300, `created_by`, unique store + phone; RLS on, no policies). Mirrored in `schema.ts` / `relations.ts`.
- **Differs from the plan:** phones are stored in the local form `01XXXXXXXXX` (CHECK `^01[0-9]{9}$`), not `+20…`; `normalizeBlockedPhone` (`packages/lib/src/stores/blocked-phones.lib.ts`) maps `010…`, `+2010…`, `2010…`, `002010…`, spaces/dashes and Arabic digits to it.
- F-02b: `placeOrderFromCart` refuses a `storefront` order whose shipping-address phone is blocked on the cart's store (`storeCustomerBlocked`), right after the product checks and before any stock, coupon, wallet or fee code. The store website shows the neutral `checkout.orderNotAccepted` ("We can't accept this order right now. Please contact the store directly."). Marketplace orders and the seller's other stores are unaffected.
- F-02c: Store settings › **Order protection** tab (`stores/[storeId]/settings/protection/`, blocklist card: add phone + private reason, list, unblock; `requireStore(forWrite)`, rate-limited, phone never logged). The order panel's customer card gets **Block this customer / Unblock** (store-website orders only; reason "From order #…"), and `/orders` rows carry `customerBlocked`. The F-01 customer drawer will reuse the same actions.
- Verified: lib/db/dashboard typecheck clean (ecommerce has 16 errors only in the untouched `profile.chunks.tsx`); `blocked-phones.lib.test.ts` (4); lib suite 615 pass, 1 failure that was already there (`starter-forms.lib.test.ts` reads `store-editor` messages); dashboard suite 288 pass. Constraints exercised on staging in a rolled-back transaction (upsert keeps one row and updates the reason; a `+20…` value is rejected). New integration test `place-order-blocked-phone.integration.test.ts` (refusal in any spelling, no order row, other store + marketplace still order, per-store unblock) **cannot run on staging yet**: the shared isolation fixture inserts `sellers.admin_contacted_at` from another session's unapplied `0113`. ESLint crashes in its own setup (as before). Browser QA to do.

### 2026-10-29 — F-37 Tallaby affiliate program built (owner)

- Owner decisions (F-37a): referral = first succeeded top-up; 10 referrals **and** 10 stores (separate counts); EGP 500 minimum, whole balance per request; no hold; seller accounts only. Design: `docs/superpowers/specs/2026-10-29-affiliate-program-design.md`; plan: `docs/superpowers/plans/2026-10-29-affiliate-program.md`.
- Migration **`0117_referral_program`** (**applied on staging 2026-10-29; production pending owner approval**, before the deploy: the code reads the new `sellers` columns): `sellers.referral_code/referred_by_seller_id/referred_at/referral_unlocked_at/referral_excluded_at`; server-only `referral_commissions` (unique `top_up_id`, earned | reversed) and `referral_payouts` (requested | paid | rejected, one open per referrer, ≥ EGP 500); admin bell type `referral_payout_requested` (+ trigger); seller bell types `referral_commission_earned/payout_paid/payout_rejected`. **0116 rebuilds the admin type check without a guard: re-run 0117 after applying 0116.**
- Code: `packages/lib/src/referrals/` (rules + server); commission posted inside both top-up success transactions (Kashier webhook, admin-approved manual top-up); attribution in `ensureSellerAccount` and `become-seller` from the 60-day `tallaby_ref` cookie set by the ecommerce and dashboard proxies (`REFERRAL_COOKIE_DOMAIN=.tallaby.com`), kept in `user_metadata.signup_ref` for email confirmation in another browser; ignored for unknown codes, the referrer's phone, or an existing seller. Dashboard `/earn` ("اربح معنا", Account & help). Admin › Money › Referrals (requests, paid/rejected, referrers, referrer detail with Reverse and Lock again; all audited).
- Verified: lib/db/dashboard/admin typecheck clean; referrals unit tests (13), notifications, sidebar (29); integration on staging 5/6 (duplicate webhooks → one commission, none for unreferred or failed top-ups, none after an admin excluded the account, unlock + double-click payout → one request, EGP 500 minimum and suspended referrer); the attribution test fails only because staging lacks 0113's `admin_contacted_at` (another session). ESLint crashes in its own setup (as before). Browser QA to do.

### 2026-10-29 — Public seller roadmap page (owner)

- New public page `dashboard.tallaby.com/roadmap` (`apps/dashboard/app/roadmap/`): Board (four columns) and List views, search with Arabic normalisation, category filter, sort by votes or newest, "Mine" and "Voted" tabs, a detail sheet shareable as `?idea=<id>`, and a "Suggest an idea" dialog that shows similar ideas first. Anyone can read it; only an active seller can vote or suggest (session only, max 5 ideas a day; votes close once a card is In progress). Guests get a sign-in prompt, and `/login?next=/roadmap` comes back here (`safeNextPath`). The proxy lets `/roadmap` through without a session. Linked from the sidebar (Account & help › Roadmap & ideas) and the command palette.
- Migration **`0115_feature_requests`** (**not applied yet**): `feature_requests` and `feature_request_votes` (RLS on, no policies; one vote per seller per card, counts computed). Seeded insert-only by `roadmap_ref`: 8 launched or in-progress items, the P0/P1 features as Planned, P2/P3 as Waiting. It also adds the `feature_request_created` admin notification (type check widened, AFTER INSERT trigger on seller ideas). Apply on staging, then production, before deploying (the page reads both tables).
- **Admin › Seller roadmap** (`apps/admin/app/(dashboard)/roadmap/`, owner 2026-10-29): a four-column board of every card (hidden ones behind a switch) with vote counts and the suggesting store. Drag a card or use its menu to move it; Launched sets today as the launch date (or the date the admin picks). Edit any card (Arabic and English text, category, ROADMAP.md id), add team cards, hide or show cards. Filters: search, category, seller ideas or team cards. Every change is audited (`create_/update_feature_request`, `set_feature_request_status`, `hide_/unhide_feature_request`, target `feature_request`). New seller ideas show in the admin bell and lead to `/roadmap`. Logic in `packages/lib/src/admin/roadmap-admin.{lib,server}.ts`.
- Verified: dashboard, admin and lib typecheck; dashboard roadmap.lib tests (6), dashboard sidebar tests (29), lib roadmap-admin + notifications + admin.lib tests (25), admin layout tests (12), eslint on the admin roadmap folder; ar/en key parity (98 keys). Browser QA waits for 0115 on staging.

### 2026-10-29 — Builder templates by industry, admin live theme cards (owner)

- Add › Templates in the builder (dashboard and admin) lists only the store's industry templates (`templatesForIndustry` in `packages/store-editor/src/lib/industries.lib.ts`). If the industry has none, it shows the related industries' templates. With no known industry it shows every template. The store's current template always stays. `RELATED_INDUSTRIES` moved there from the dashboard's `templates.lib.ts`. Website › Templates (the gallery page) is unchanged.
- Admin › Store › Website › Change theme: every theme card without an uploaded image draws its home page live with its demo store. It uses the shared `TemplateLiveThumbnail` (`@workspace/store-editor/preview/template-live-thumbnail.client`, now also used by the dashboard gallery), loaded through admin's access-checked `templatePreview`.
- No migration. Verified: store-editor typecheck and tests (143), dashboard and admin typecheck, dashboard templates.lib tests (12). Lint still crashes inside ESLint. Browser QA still to do.

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
