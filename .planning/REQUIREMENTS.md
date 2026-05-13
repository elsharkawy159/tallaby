# Requirements — Tallaby Digital Products Milestone

## v1 Requirements

### Schema & Database (DB)

- [ ] **DB-01**: Schema defines `digitalProducts` table with all specified columns (id, productId FK, sellerId FK, fileUrl, fileName, fileSize, fileType, downloadLimit, downloadExpiryHours, price, currency, status, createdAt, updatedAt)
- [ ] **DB-02**: Schema defines `digitalOrders` table (id, orderId FK, digitalProductId FK, buyerId FK, downloadToken, downloadCount, maxDownloads, expiresAt, downloadedAt, createdAt)
- [ ] **DB-03**: `productType` pgEnum (`physical` | `digital`) added and column added to `products` table with default `physical`
- [ ] **DB-04**: `sellers` table extended with fields: stripeAccountId, stripeOnboardingComplete, payoutEnabled, storeSlug, storeBannerUrl, storeLogoUrl, storeDescription, identityVerified, identityDocsUrl, onboardingStep (int), onboardingComplete
- [ ] **DB-05**: `sellerCategories` join table created (sellerId FK, categoryId FK, primary key on both)
- [ ] **DB-06**: `sellerWallet` table created (id, sellerId FK, balance decimal, currency, updatedAt)
- [ ] **DB-07**: `walletTransactions` table created (id, sellerId FK, type enum sale/refund/withdrawal/fee, amount, currency, stripeTransferId nullable, orderId nullable FK, description, createdAt)
- [ ] **DB-08**: All new table relations added to `packages/db/src/drizzle/relations.ts`
- [ ] **DB-09**: Drizzle migration generated and placed in `packages/db/migrations/`
- [ ] **DB-10**: `orders` table has `status` column that supports `pending` state (add if missing)

### Storage (STG)

- [ ] **STG-01**: Private Supabase Storage bucket `digital-products` created (files not publicly accessible)
- [ ] **STG-02**: Signed URL generation is server-side only, never exposed to client directly
- [ ] **STG-03**: Signed URLs generated with short expiry (≤60 seconds) on each download request

### Digital Products — Dashboard Upload (DPU)

- [ ] **DPU-01**: Seller can select product type (Physical | Digital) at top of create product form in `apps/dashboard`
- [ ] **DPU-02**: Digital product form shows file upload step using react-dropzone targeting the private `digital-products` bucket
- [ ] **DPU-03**: File metadata (fileName, fileSize, fileType, fileUrl) stored in `digitalProducts` table on upload
- [ ] **DPU-04**: Physical product form shows weight, dimensions, shipping class fields (existing)
- [ ] **DPU-05**: Shared fields (title, description, price, category, brand, images, SEO) shown for both types
- [ ] **DPU-06**: Digital-only fields (downloadLimit, downloadExpiryHours) shown only for digital products
- [ ] **DPU-07**: Product can be saved as draft or published (status: draft → active)
- [ ] **DPU-08**: Edit product page loads existing `digitalProducts` record when `productType === 'digital'`
- [ ] **DPU-09**: New server action files follow colocated feature pattern (NOT added to `apps/dashboard/actions/products.ts`)
- [ ] **DPU-10**: Zod DTOs for all inputs in feature `.dto.ts` files; TypeScript types in `.types.ts` files

### Download Delivery (DLD)

- [ ] **DLD-01**: `GET /api/downloads/[token]` route in `apps/ecommerce` validates token exists and is not expired
- [ ] **DLD-02**: Download route checks `downloadCount < maxDownloads` before serving
- [ ] **DLD-03**: Download route increments `downloadCount` and sets `downloadedAt` on first download
- [ ] **DLD-04**: Download route returns a redirect to a freshly generated Supabase signed URL (≤60s expiry)
- [ ] **DLD-05**: Expired or exceeded download tokens return 404 or 410 with appropriate message
- [ ] **DLD-06**: Download link email sent to buyer after purchase (via Hono backend email route)

### Stripe Connect (STC)

- [ ] **STC-01**: Seller can initiate Stripe Connect onboarding during vendor onboarding step 3
- [ ] **STC-02**: `GET /api/stripe/connect/onboard` (in backend or ecommerce) creates Stripe Express account and returns onboarding URL; stores `stripeAccountId` in sellers table
- [ ] **STC-03**: `GET /api/stripe/connect/return` handles return from Stripe, sets `stripeOnboardingComplete = true`
- [ ] **STC-04**: `GET /api/stripe/connect/refresh` handles refresh/retry of onboarding
- [ ] **STC-05**: Seller can skip Stripe Connect during onboarding (payoutEnabled remains false)

### Stripe Checkout (CHK)

- [ ] **CHK-01**: Existing checkout flow replaced with Stripe Checkout Session creation
- [ ] **CHK-02**: Order created with status `pending` when Checkout Session is created
- [ ] **CHK-03**: Stripe Checkout Session line items built from cart contents with correct prices
- [ ] **CHK-04**: Mixed cart (physical + digital) supported in a single Checkout Session
- [ ] **CHK-05**: Checkout success redirects to `/orders/[orderId]/confirmation`
- [ ] **CHK-06**: Checkout cancelled returns user to cart with session preserved

### Stripe Webhooks (WHK)

- [ ] **WHK-01**: `POST /api/stripe/webhook` implemented in `apps/backend` Hono app (raw body, no auto-parsing)
- [ ] **WHK-02**: Webhook signature validated via `stripe.webhooks.constructEvent()` with webhook secret
- [ ] **WHK-03**: `checkout.session.completed` → marks order `paid`, generates download tokens for digital items, sends confirmation email
- [ ] **WHK-04**: `account.updated` → syncs seller Stripe Connect status (`stripeOnboardingComplete`, `payoutEnabled`)
- [ ] **WHK-05**: `transfer.created` → records entry in `walletTransactions` ledger
- [ ] **WHK-06**: `payment_intent.payment_failed` → marks order `failed`
- [ ] **WHK-07**: Webhook handler wrapped in DB transaction for `checkout.session.completed` (order update + token generation + wallet update are atomic)

### Seller Wallet (WAL)

- [ ] **WAL-01**: Dashboard wallet page displays current balance (available vs pending breakdown)
- [ ] **WAL-02**: Transaction history table (TanStack Table) shows all wallet transactions with type, amount, date
- [ ] **WAL-03**: Seller can submit a withdrawal request (minimum threshold enforced)
- [ ] **WAL-04**: Withdrawal request creates a `walletTransactions` entry with type `withdrawal`

### Vendor Onboarding Wizard (ONB)

- [ ] **ONB-01**: 5-step wizard UI in `apps/dashboard`; each step saves independently to DB before advancing
- [ ] **ONB-02**: Step 1 — Store profile: store name, description, logo upload, banner image, slug (auto-generated via slugify, editable)
- [ ] **ONB-03**: Step 2 — Store categories: seller selects product categories they will sell in (writes to `sellerCategories`)
- [ ] **ONB-04**: Step 3 — Payout setup: connect Stripe (triggers Stripe Connect flow) or skip
- [ ] **ONB-05**: Step 4 — Identity verification: upload national ID / business docs to Supabase Storage (stored in `sellers.identityDocsUrl`)
- [ ] **ONB-06**: Step 5 — Review & launch: summary screen, submit for admin approval (sets `onboardingComplete = true`, `status = pending_review`)
- [ ] **ONB-07**: Wizard remembers progress via `onboardingStep` — seller can resume from where they left off

### Admin Seller Approval (ADM)

- [ ] **ADM-01**: Admin sellers list page has "Approve" and "Reject" actions per seller
- [ ] **ADM-02**: Approving a seller updates their status to `active` (or approved equivalent)
- [ ] **ADM-03**: Welcome email sent to seller via Hono backend email route on approval
- [ ] **ADM-04**: Rejecting a seller updates their status with a reason

### i18n (I18N)

- [ ] **I18N-01**: All new user-facing strings in `apps/ecommerce` added to `messages/en.json` and `messages/ar.json`
- [ ] **I18N-02**: All new user-facing strings in `apps/dashboard` added to its `en.json` and `ar.json`
- [ ] **I18N-03**: No hardcoded user-visible strings in new components

---

## v2 Requirements (Deferred)

- Subscription/recurring digital products (separate product type + billing model)
- Multiple file bundles per digital product
- Seller analytics wired to real data (existing static chart debt)
- Download analytics per product (seller view)
- Refund flow for digital purchases
- Withdrawal auto-processing via Stripe payouts API
- Coupon support for digital products
- Product preview (free sample file)

---

## Out of Scope

- Physical product shipping integration — separate milestone
- Tax calculation — existing tech debt, separate milestone
- Admin role security hardening (middleware, registration weakness) — separate security phase
- Inventory deduction fix — existing tech debt, leave alone
- CI/CD pipeline — infrastructure concern, separate
- Stripe Radar / fraud prevention — post-MVP

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 1: Schema & Migrations | Pending |
| DB-02 | Phase 1: Schema & Migrations | Pending |
| DB-03 | Phase 1: Schema & Migrations | Pending |
| DB-04 | Phase 1: Schema & Migrations | Pending |
| DB-05 | Phase 1: Schema & Migrations | Pending |
| DB-06 | Phase 1: Schema & Migrations | Pending |
| DB-07 | Phase 1: Schema & Migrations | Pending |
| DB-08 | Phase 1: Schema & Migrations | Pending |
| DB-09 | Phase 1: Schema & Migrations | Pending |
| DB-10 | Phase 1: Schema & Migrations | Pending |
| STC-01 | Phase 2: Stripe Connect & Wallet Infrastructure | Pending |
| STC-02 | Phase 2: Stripe Connect & Wallet Infrastructure | Pending |
| STC-03 | Phase 2: Stripe Connect & Wallet Infrastructure | Pending |
| STC-04 | Phase 2: Stripe Connect & Wallet Infrastructure | Pending |
| STC-05 | Phase 2: Stripe Connect & Wallet Infrastructure | Pending |
| STG-01 | Phase 3: Digital Product Upload (Dashboard) | Pending |
| STG-02 | Phase 3: Digital Product Upload (Dashboard) | Pending |
| DPU-01 | Phase 3: Digital Product Upload (Dashboard) | Pending |
| DPU-02 | Phase 3: Digital Product Upload (Dashboard) | Pending |
| DPU-03 | Phase 3: Digital Product Upload (Dashboard) | Pending |
| DPU-04 | Phase 3: Digital Product Upload (Dashboard) | Pending |
| DPU-05 | Phase 3: Digital Product Upload (Dashboard) | Pending |
| DPU-06 | Phase 3: Digital Product Upload (Dashboard) | Pending |
| DPU-07 | Phase 3: Digital Product Upload (Dashboard) | Pending |
| DPU-08 | Phase 3: Digital Product Upload (Dashboard) | Pending |
| DPU-09 | Phase 3: Digital Product Upload (Dashboard) | Pending |
| DPU-10 | Phase 3: Digital Product Upload (Dashboard) | Pending |
| CHK-01 | Phase 4: Stripe Checkout Integration | Pending |
| CHK-02 | Phase 4: Stripe Checkout Integration | Pending |
| CHK-03 | Phase 4: Stripe Checkout Integration | Pending |
| CHK-04 | Phase 4: Stripe Checkout Integration | Pending |
| CHK-05 | Phase 4: Stripe Checkout Integration | Pending |
| CHK-06 | Phase 4: Stripe Checkout Integration | Pending |
| WHK-01 | Phase 5: Webhooks & Download Delivery | Pending |
| WHK-02 | Phase 5: Webhooks & Download Delivery | Pending |
| WHK-03 | Phase 5: Webhooks & Download Delivery | Pending |
| WHK-04 | Phase 5: Webhooks & Download Delivery | Pending |
| WHK-05 | Phase 5: Webhooks & Download Delivery | Pending |
| WHK-06 | Phase 5: Webhooks & Download Delivery | Pending |
| WHK-07 | Phase 5: Webhooks & Download Delivery | Pending |
| DLD-01 | Phase 5: Webhooks & Download Delivery | Pending |
| DLD-02 | Phase 5: Webhooks & Download Delivery | Pending |
| DLD-03 | Phase 5: Webhooks & Download Delivery | Pending |
| DLD-04 | Phase 5: Webhooks & Download Delivery | Pending |
| DLD-05 | Phase 5: Webhooks & Download Delivery | Pending |
| DLD-06 | Phase 5: Webhooks & Download Delivery | Pending |
| STG-03 | Phase 5: Webhooks & Download Delivery | Pending |
| WAL-01 | Phase 5: Webhooks & Download Delivery | Pending |
| WAL-02 | Phase 5: Webhooks & Download Delivery | Pending |
| WAL-03 | Phase 5: Webhooks & Download Delivery | Pending |
| WAL-04 | Phase 5: Webhooks & Download Delivery | Pending |
| ONB-01 | Phase 6: Vendor Onboarding Wizard | Pending |
| ONB-02 | Phase 6: Vendor Onboarding Wizard | Pending |
| ONB-03 | Phase 6: Vendor Onboarding Wizard | Pending |
| ONB-04 | Phase 6: Vendor Onboarding Wizard | Pending |
| ONB-05 | Phase 6: Vendor Onboarding Wizard | Pending |
| ONB-06 | Phase 6: Vendor Onboarding Wizard | Pending |
| ONB-07 | Phase 6: Vendor Onboarding Wizard | Pending |
| ADM-01 | Phase 7: Admin Seller Approval & i18n | Pending |
| ADM-02 | Phase 7: Admin Seller Approval & i18n | Pending |
| ADM-03 | Phase 7: Admin Seller Approval & i18n | Pending |
| ADM-04 | Phase 7: Admin Seller Approval & i18n | Pending |
| I18N-01 | Phase 7: Admin Seller Approval & i18n | Pending |
| I18N-02 | Phase 7: Admin Seller Approval & i18n | Pending |
| I18N-03 | Phase 7: Admin Seller Approval & i18n | Pending |

---

*Requirements defined: 2026-05-14*
