# Roadmap — Tallaby Digital Products Milestone

## Phases

- [ ] **Phase 1: Schema & Migrations** - All new DB tables, enums, and column additions defined in Drizzle schema with migration generated
- [ ] **Phase 2: Stripe Connect & Wallet Infrastructure** - Sellers can connect Stripe during onboarding; Connect OAuth routes live
- [ ] **Phase 3: Digital Product Upload (Dashboard)** - Sellers can create and edit digital products with file uploads from the dashboard
- [ ] **Phase 4: Stripe Checkout Integration** - Buyers complete purchases via Stripe Checkout Sessions; orders created as pending
- [ ] **Phase 5: Webhooks & Download Delivery** - Stripe webhooks confirm payment; buyers receive secure download links via email
- [ ] **Phase 6: Vendor Onboarding Wizard** - New sellers complete 5-step guided onboarding and submit for admin approval
- [ ] **Phase 7: Admin Seller Approval & i18n** - Admins approve or reject sellers with email notification; all new strings translated

---

## Phase Details

### Phase 1: Schema & Migrations
**Goal**: All new DB tables, enums, and column additions are defined in the Drizzle schema with a migration generated — zero application code changed
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: DB-01, DB-02, DB-03, DB-04, DB-05, DB-06, DB-07, DB-08, DB-09, DB-10
**Success Criteria** (what must be TRUE):
  1. Running `drizzle-kit generate` produces a new migration file in `packages/db/migrations/` containing all new tables (`digitalProducts`, `digitalOrders`, `sellerWallet`, `walletTransactions`, `sellerCategories`) and the `productType` enum with no errors
  2. The `products` table in the migration has a `productType` column with default value `physical` so no existing product rows break
  3. The `orders` table migration adds or confirms a `status` column that accepts the value `pending`
  4. `packages/db/src/drizzle/relations.ts` contains relation definitions for every new table, and TypeScript compilation passes across all workspace packages
  5. Running the migration against the Supabase database succeeds with no constraint violations on the existing dataset
**Plans:** 3 plans

Plans:
- [ ] 01-01-PLAN.md — Add productType enum, products.productType column, and 7 new sellers onboarding columns
- [ ] 01-02-PLAN.md — Add digitalProducts, digitalOrders, sellerCategories, sellerWallet, walletTransactions tables
- [ ] 01-03-PLAN.md — Add relations for all new tables and generate migration file

### Phase 2: Stripe Connect & Wallet Infrastructure
**Goal**: Sellers can initiate Stripe Connect account creation during onboarding; Connect OAuth callback routes handle return and refresh; wallet schema is ready in the DB (covered by Phase 1)
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: STC-01, STC-02, STC-03, STC-04, STC-05
**Success Criteria** (what must be TRUE):
  1. A seller who clicks "Connect Stripe" during onboarding step 3 is redirected to the Stripe Express onboarding URL and a `stripeAccountId` is stored on their `sellers` row
  2. After completing Stripe onboarding, the return callback sets `stripeOnboardingComplete = true` on the seller record and redirects them back to the dashboard
  3. The refresh route allows a seller to restart Connect onboarding without creating a duplicate Stripe account
  4. A seller who clicks "Skip" during payout setup advances to the next onboarding step with `payoutEnabled` remaining `false`
  5. All three Connect route handlers (`/onboard`, `/return`, `/refresh`) return appropriate HTTP status codes and never expose raw Stripe API keys to the client
**Plans:** 2 plans

Plans:
- [ ] 02-01-PLAN.md -- Install Stripe SDK and create stripe singleton in @workspace/lib; wire env vars
- [ ] 02-02-PLAN.md -- Create Connect route handlers (onboard/return/refresh) and register with auth exclusion

### Phase 3: Digital Product Upload (Dashboard)
**Goal**: Sellers can create and edit digital products with file uploads to the private `digital-products` Supabase Storage bucket from the dashboard; colocated feature files follow the established pattern
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: STG-01, STG-02, DPU-01, DPU-02, DPU-03, DPU-04, DPU-05, DPU-06, DPU-07, DPU-08, DPU-09, DPU-10
**Success Criteria** (what must be TRUE):
  1. The create-product form in `apps/dashboard` has a product type selector at the top; choosing "Digital" reveals react-dropzone file upload and digital-only fields (`downloadLimit`, `downloadExpiryHours`); choosing "Physical" reveals weight, dimensions, and shipping fields
  2. Uploading a digital file succeeds: the file lands in the private `digital-products` Supabase bucket, a `digitalProducts` row is created with `fileName`, `fileSize`, `fileType`, and `fileUrl` populated, and the Storage URL is never returned to or displayed in the browser
  3. A seller can save a digital product as draft or publish it (`status: draft → active`) without errors
  4. Opening the edit page for an existing digital product loads the `digitalProducts` record and pre-populates all fields including the previously uploaded file name
  5. No new server action code is added to `apps/dashboard/actions/products.ts`; all digital product mutations live in new colocated feature files following the `.server.ts` / `.dto.ts` / `.types.ts` pattern
**Plans**: TBD
**UI hint**: yes

### Phase 4: Stripe Checkout Integration
**Goal**: Buyers complete purchases via Stripe Checkout Sessions; an order row is created with status `pending` at session creation time, before any payment is confirmed
**Mode:** mvp
**Depends on**: Phase 1, Phase 3
**Requirements**: CHK-01, CHK-02, CHK-03, CHK-04, CHK-05, CHK-06
**Success Criteria** (what must be TRUE):
  1. Clicking "Checkout" in the cart creates a Stripe Checkout Session and redirects the buyer to the Stripe-hosted payment page; the existing non-Stripe checkout flow is replaced
  2. An `orders` row with `status = 'pending'` exists in the database at the moment the buyer is redirected to Stripe — before they enter any payment details
  3. A cart containing both physical and digital items produces a single Checkout Session with one line item per product at the correct price
  4. After successful payment, Stripe redirects the buyer to `/orders/[orderId]/confirmation`
  5. If the buyer cancels at the Stripe page, they are returned to their cart with all items still present and the session preserved
**Plans**: TBD
**UI hint**: yes

### Phase 5: Webhooks & Download Delivery
**Goal**: Stripe webhooks confirm payment, generate download tokens, and buyers receive secure download links via email; the webhook handler is in the Hono backend with raw body parsing and full DB transaction atomicity
**Mode:** mvp
**Depends on**: Phase 1, Phase 4
**Requirements**: WHK-01, WHK-02, WHK-03, WHK-04, WHK-05, WHK-06, WHK-07, DLD-01, DLD-02, DLD-03, DLD-04, DLD-05, DLD-06, STG-03, WAL-01, WAL-02, WAL-03, WAL-04
**Success Criteria** (what must be TRUE):
  1. A `POST /api/stripe/webhook` route in `apps/backend` (Hono) validates the Stripe signature via `stripe.webhooks.constructEvent()` using the raw request body; an invalid signature returns 400 without processing
  2. When `checkout.session.completed` fires, the following happen atomically inside a single DB transaction: the order status changes from `pending` to `paid`, a `digitalOrders` row with a unique download token is created for each digital item, and the buyer's `sellerWallet` balance is updated — if any step throws, the entire transaction rolls back
  3. A buyer receives an email (via Hono backend) containing download links within seconds of payment confirmation; clicking a valid link redirects them to a freshly generated Supabase signed URL (≤60 seconds expiry) and increments `downloadCount`
  4. A download token that has reached `maxDownloads` or whose `expiresAt` is in the past returns a 404 or 410 response with a human-readable message; the signed Storage URL is never stored in the database or returned before validation passes
  5. The dashboard wallet page shows the seller's current balance, a paginated transaction history (TanStack Table) with type, amount, and date, and a withdrawal request form that enforces a minimum threshold and creates a `walletTransactions` entry with type `withdrawal`
**Plans**: TBD

### Phase 6: Vendor Onboarding Wizard
**Goal**: New sellers complete a 5-step guided onboarding wizard in `apps/dashboard` and submit for admin approval; progress is persisted so sellers can resume from where they left off
**Mode:** mvp
**Depends on**: Phase 1, Phase 2
**Requirements**: ONB-01, ONB-02, ONB-03, ONB-04, ONB-05, ONB-06, ONB-07
**Success Criteria** (what must be TRUE):
  1. A seller who starts onboarding sees a 5-step wizard UI; each step (Store Profile, Categories, Payout, Identity, Review) saves its data independently to the database before advancing to the next step
  2. Step 1 saves store name, description, logo, banner, and a slug (auto-generated from store name via slugify, editable by the seller) to the `sellers` table
  3. Step 2 saves the seller's selected product categories to the `sellerCategories` join table
  4. Step 4 allows uploading national ID or business documents to Supabase Storage and stores the URL in `sellers.identityDocsUrl`
  5. A seller who closes the browser mid-wizard and returns later resumes at the step stored in `sellers.onboardingStep`; completing Step 5 sets `onboardingComplete = true` and `status = pending_review`
**Plans**: TBD
**UI hint**: yes

### Phase 7: Admin Seller Approval & i18n
**Goal**: Admins can approve or reject sellers with email notification sent on approval; all new user-facing strings across ecommerce and dashboard are present in both `en.json` and `ar.json`
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: ADM-01, ADM-02, ADM-03, ADM-04, I18N-01, I18N-02, I18N-03
**Success Criteria** (what must be TRUE):
  1. The admin sellers list page shows an "Approve" and a "Reject" action for each seller in `pending_review` status
  2. Approving a seller updates their status to `active` and triggers a welcome email sent via the Hono backend email route; the seller receives the email within a reasonable delay
  3. Rejecting a seller updates their status with a rejection reason that the admin provides; the seller record reflects the reason in the database
  4. Every user-visible string introduced in this milestone (download pages, wallet UI, onboarding wizard, product type selector) has corresponding keys in both `en.json` and `ar.json` for the ecommerce and dashboard apps; no hardcoded English strings remain in new components
**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Schema & Migrations | 0/3 | Not started | - |
| 2. Stripe Connect & Wallet Infrastructure | 0/? | Not started | - |
| 3. Digital Product Upload (Dashboard) | 0/? | Not started | - |
| 4. Stripe Checkout Integration | 0/? | Not started | - |
| 5. Webhooks & Download Delivery | 0/? | Not started | - |
| 6. Vendor Onboarding Wizard | 0/? | Not started | - |
| 7. Admin Seller Approval & i18n | 0/? | Not started | - |

---

*Roadmap created: 2026-05-14*
