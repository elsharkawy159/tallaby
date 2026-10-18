# Tallaby (طلبي) — Product Description

> Updated 2026-10-17. This replaces the January 2026 description, which described Tallaby only as an Amazon-style marketplace.
> **Live** = in production code today. **Planned** = in the roadmap ([`PLAN.md`](PLAN.md)), not built yet.
> Technical details are in [`PROJECT.md`](PROJECT.md). Brand and marketing voice are in `MARKETING_PROJECT.md`.

## 1. Purpose and positioning

Tallaby (Arabic brand name **طلبي**, never "تالابي") is an Egyptian commerce platform that helps independent sellers sell online. It offers three things, which must always be presented separately:

1. **Your own online stores.** Each seller gets a store at `yourstore.tallaby.com`, or on their own domain. Customers see the store's brand, products, cart and checkout. *Planned:* a seller can run **several stores** (for example, different brands) from one account. The **Free plan** allows up to **3 stores**, and everyone is on Free for now. Paid plans may later add more stores, AI features and advanced settings.
   - *Live:* every seller has a storefront with the default Tallaby design, plus subdomain changes and custom domains. New sellers' stores will be visible from signup with their store info, and show an empty catalog until they add products.
   - *Planned:* a visual website builder and templates.
2. **The Tallaby marketplace.** A shared shopping site (`www.tallaby.com` today) where customers buy from many sellers in one cart. *Live.* A move to `store.tallaby.com` is planned for after the Tallaby Fulfillment service work.
3. **Tallaby Fulfillment (optional).** Tallaby can handle storage, packaging, delivery, customer service and returns. *Live as a request-and-agree process.* Nothing is charged at signup, and terms are agreed with the team.

Tallaby also runs its own last-mile delivery operation with riders and cash on delivery. It handles payments through Paymob and Kashier, cash on delivery and a customer wallet.

## 2. Target sellers

- Small and medium Egyptian businesses and individual sellers, often already selling through social media and WhatsApp. They want a real store link without technical work.
- Arabic-first users on mobile. English is supported.
- Sellers who may want to hand off operations (warehousing, delivery) as they grow.

## 3. Main seller workflows

| Workflow | Status |
|---|---|
| Sign up and get a store | **Live:** a 5-step wizard (business details, legal address, fulfillment choices, operational details, review). The seller is approved immediately. **Planned:** choose a store address, create an account (email/password or Google) and a phone number, then go straight to the dashboard in under a minute. Everything else moves to a setup checklist in the dashboard |
| Add and manage products | **Live:** create and edit physical and digital products, variants, images, Excel import, import from URL |
| Manage orders and shipping | **Live:** order list, shipping status, seller riders, Tallaby delivery |
| Get paid / store wallet | **Live:** net earnings credited to the seller wallet on delivery, payout records, account statements. **Planned:** a store wallet that can go negative, with automatic fee and earning entries, Kashier top-ups and paying for ads from the wallet |
| Promote | **Live:** seller coupons (marketplace and/or storefront), paid ad-package requests, reviews |
| Store settings | **Live:** business profile, logo, banner, policies, store subdomain, custom domain with DNS instructions. **Planned:** a Store Settings page with branding, favicon, theme, SEO, social links and contact |
| Design the store | **Planned:** a "Website Design / تصميم المتجر" sidebar section with Templates, Website Editor and Store Settings |
| Get paid by customers | **Live:** marketplace checkout with cash on delivery, card (Paymob/Kashier), customer wallet and manual transfers to Tallaby. **Planned (per store):** cash on delivery on by default; the seller can switch on **Vodafone Cash, e& Cash, WE Pay, Orange Cash and InstaPay** paid straight to their own number/InstaPay address (they confirm receipt in the dashboard); card, Fawry, installments, Apple/Google Pay shown as "Soon" |
| Shipping | **Live:** Tallaby delivery at fixed governorate rates, seller free-delivery offers, seller riders and delivery-status updates. **Planned (per store):** choose Tallaby delivery or own delivery with zones (price per governorate group, free-over amount, delivery time, COD per zone); orders and delivery tracking grouped under "Orders & Shipping" |
| Website extras | **Planned (per store):** domain & SEO page, social media links shown automatically in the website footer, a blog wired automatically into blog sections, forms with a submissions inbox, media library |
| Connect apps | **Planned:** an "Apps / التكاملات" section. First Meta Pixel, Google Analytics 4 and Google Tag Manager. Later Meta Conversions API, Google Sheets order export and Shopify product import |
| Request fulfillment services | **Live:** chosen during signup and activated by admins. **Planned:** requested any time from the dashboard instead of at signup |

## 4. Store creation and onboarding (planned experience)

1. Type the store address you want (e.g. `faster`), and see straight away whether it is available.
2. Sign up with email and password, or continue with Google.
3. Enter a mobile number. The Tallaby team contacts sellers on WhatsApp. Whether this stays at signup is decision D6.
4. Land in the dashboard. A checklist guides the rest: logo, first product, contact details, policies, publishing the store, payout details, and optional apps and fulfillment.

Signup never asks for templates, fulfillment, store description, categories, shipping, payment setup or a wallet deposit.

## 5. Website builder and templates (planned)

- **Templates.** A gallery of store designs. At launch the only template is **Tallaby Classic**, the current default storefront design. No new default design is created until the owner provides or approves one. Applying a template changes only the design draft. It never touches products, orders or settings.
- **Website Editor.** Drag-and-drop sections such as hero, product grids, categories, catalog, banners, text, trust badges and header/footer. Sellers can edit text in Arabic and English, images, colors, fonts and spacing, preview on desktop and mobile, and use undo/redo and autosave.
- **Publishing.** Changes go live only when the seller presses **Publish**. Earlier versions can be restored. Product sections always show the seller's real, active products.
- **Safety.** Sellers cannot add custom code. Tracking tools are added only through supported Apps.

## 6. Product and order management (live)

Catalog with categories, brands, variants (with per-variant price, images and discount expiry), stock, merchandising flags and digital products. Orders go through these statuses: pending → payment processing / confirmed → shipping soon → shipped / out for delivery → delivered, plus cancelled, refund requested, refunded and returned. Payment methods are online payment (Paymob, Kashier), cash on delivery (limited when shipping is high), wallet and wallet-plus-remainder. Storefront orders are tagged so sellers and admins can tell them apart from marketplace orders.

## 7. Apps and integrations (planned)

| App | What it does for the seller |
|---|---|
| Meta Pixel | Track visits, add-to-cart and purchases on *your* store for Facebook/Instagram ads |
| Google Analytics 4 | Traffic and sales reports for your store |
| Google Tag Manager | Use your own tag container on your store (subject to decision D18) |
| Meta Conversions API | Server-side purchase events for better ad tracking |
| Google Sheets | Export your orders to your own spreadsheet |
| Shopify import | Bring your existing Shopify products into Tallaby (import only) |
| WhatsApp button | Let customers chat with you from your store |

Each seller's tracking runs only on that seller's store, never on the marketplace or on other stores.

## 8. Platform fee, 30-day trial and store wallet (agreed business model, planned implementation)

- Creating an account and a store is **free**, and no deposit is required to sign up, publish or sell.
- **Fee for all sellers, old and new:** on each successful order, **2% of the seller's product subtotal with a minimum of EGP 5**. Shipping is excluded. Examples: EGP 100 → 5, EGP 250 → 5, EGP 500 → 10, EGP 1,000 → 20. Payment-provider fees and fulfillment charges are separate. Separate fees for future services (fulfillment, ads, themes) will be designed later.
- **New sellers: no platform fee for 30 days**, starting when their store first goes live (first publish or first product, see PLAN D20). Preparing the store does not use up trial days. Republishing or changing templates does not restart the trial. Existing sellers have no trial.
- **Store wallet:** every seller has a wallet that can be positive or negative. It updates automatically: earnings from delivered orders that Tallaby collected the money for are added, the platform fee is subtracted, and purchases such as product ads (and later themes and other services) are subtracted. Sellers can **top it up at any time** (through Kashier first). When a seller collects the cash themselves, only the fee is subtracted, which can make the balance negative until they top up or earn more.
- **Refunds** are handled later, together with the Kashier integration work.
- Still open (PLAN §21.3): how discounts affect the fee base (D2), the negative-balance limit (D21), and the minimum per seller on multi-seller marketplace orders (D22).
- *Today (live):* orders carry a fixed 5% commission. The marketing copy and `MARKETING_PROJECT.md` still say "5% by default" and must be updated when the new fee ships.

## 9. Optional fulfillment

Sellers can sell and publish without Tallaby Fulfillment. If they want it, they request services such as storage at the Tallaby warehouse (the seller drops off stock), packaging, delivery, customer service and returns. The Tallaby team agrees terms and activates them. Until something is activated, orders work as before: the seller stores and packs, and Tallaby delivers at standard rates. Fulfillment billing is separate from the platform fee.

## 10. Public marketplace (live)

Customers browse categories, brands, deals, trending and seasonal collections, search, compare sellers, use coupons and affiliate codes, check out as a guest or signed in, track orders, request returns, and manage their wallet and wishlist. The marketplace stays fully operational throughout the SaaS transformation.

## 11. Platform operations (live, with planned additions)

The admin panel manages sellers (status, commission settings, documents), products, orders (including external phone orders), payments, wallets and payouts, fulfillment plans and agreements, affiliates, coupons and analytics. The shipping app runs dispatch and the rider app. **Planned admin additions:** each seller's store site status and revisions, a moderation unpublish, trial dates, fee plan and overrides with an audit trail, and integration status.

## 11b. Plans (planned)

- Every seller account is on the **Free** plan: up to **3 stores**, all current features, no AI builder features, no advanced settings.
- Each seller has one account-level wallet, fee trial and payout setup, shared by all their stores. Products are one shared catalog, and each store can show all of them or a selection.
- **Later (not built yet):** paid subscriptions could raise the store limit and unlock AI usage and advanced settings. The system stores each seller's plan from day one so this can be added without restructuring.

## 12. Boundaries and future opportunities

- **Not planned now:** separate deployments per seller, seller-supplied code, per-seller payment gateways, AI site generation, team/staff accounts per store, Shopify storefront sync, and a monthly subscription.
- **Future options:** more templates (once designs are approved), AI-assisted content, staff accounts, scheduled publishing, admin template authoring, an optional pre-funded seller wallet, automated payouts, and moving the marketplace to `store.tallaby.com` with `tallaby.com` as the seller acquisition site.
