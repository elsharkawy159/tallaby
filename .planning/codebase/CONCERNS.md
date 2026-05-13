# Codebase Concerns

**Analysis Date:** 2026-05-14

## Tech Debt

**Inventory deduction disabled at order creation:**
- Issue: The block of code that decrements product/variant stock when an order is placed is commented out entirely.
- Files: `apps/ecommerce/actions/order.ts` (lines 274-295)
- Impact: Product quantities in the database are never decremented when orders are created. Customers can purchase items that are effectively sold out, causing oversell. Inventory counts shown in the admin are meaningless.
- Fix approach: Uncomment and integrate the deduction block inside a database transaction so that stock update and order creation are atomic.

**Tax calculation hardcoded to zero:**
- Issue: `tax = 0` is set as a literal constant across all checkout-related server actions. Commented-out code shows a 14% tax was planned.
- Files: `apps/ecommerce/actions/order.ts` (line 92), `apps/ecommerce/actions/checkout.ts` (line 89), `apps/ecommerce/actions/coupons.ts` (lines 134, 191, 306)
- Impact: All orders are stored with zero tax. If tax must be collected, every historic order record will be incorrect and financial reporting will be wrong.
- Fix approach: Implement a tax calculation utility and pass the result through to order creation, coupon validation, and checkout summary.

**Flat shipping cost from env var with no carrier integration:**
- Issue: Shipping cost is read as `Number(process.env.NEXT_PUBLIC_SHIPPING_COST) || 50` — a single global flat fee. The `calculateShipping` function generates fake per-seller options (standard/express/overnight) with hardcoded costs (25 / 50 / 100) but these are never actually used during checkout.
- Files: `apps/ecommerce/actions/checkout.ts` (line 90), `apps/ecommerce/actions/order.ts` (line 93), `apps/ecommerce/actions/coupons.ts` (line 179)
- Impact: Every order pays the same flat rate regardless of weight, location, or seller. The `calculateShipping` endpoint is dead code.
- Fix approach: Either integrate a real carrier API or add per-seller shipping rules; remove or replace the dead `calculateShipping` function.

**Coupon code not persisted on the cart:**
- Issue: `applyCouponToCart` validates the coupon and returns the discount data but explicitly states "Since carts table doesn't have couponId, we'll return the validated data." The coupon code is held only in client state.
- Files: `apps/ecommerce/actions/coupons.ts` (lines 261-264)
- Impact: If a user refreshes the page or switches devices, the applied coupon is lost. There is also no server-side enforcement that the same coupon code used during validation is actually the one submitted at order creation time; a malicious user could substitute a different code.
- Fix approach: Add a `couponCode` column to the `carts` table (or a separate `cartCoupons` junction), persist the validated coupon server-side, and verify it matches at order creation.

**No database transactions around multi-step order creation:**
- Issue: `createOrder` performs multiple sequential `db.insert` / `db.update` / `db.delete` calls (order, order items, coupon usage, coupon count, cart items, cart status) without wrapping them in a transaction.
- Files: `apps/ecommerce/actions/order.ts` (lines 221-314)
- Impact: A failure partway through (e.g., coupon usage insert fails) leaves the database in a partial state — order exists but cart is not cleared, or coupon count is not incremented.
- Fix approach: Wrap the entire sequence in `db.transaction(async (tx) => { ... })` using Drizzle's transaction API.

**Admin role check missing from login flow:**
- Issue: The `login` server action contains `// TODO: Add role checking logic here or in middleware`. Any Supabase user (including regular shoppers) can log in to the admin panel if they know the URL.
- Files: `apps/admin/actions/auth.ts` (line 73)
- Impact: Non-admin users are authenticated into the admin app. The middleware only checks that a session exists — it does not verify the user has an admin role.
- Fix approach: After `signInWithPassword`, query the `users` table for the role and reject login if the role is not in `["admin", "super_admin", "moderator"]`.

**Admin middleware does not enforce roles:**
- Issue: `apps/admin/supabase/middleware.ts` only checks `!user` (unauthenticated), never the user's role. The elaborate `AdminGuard` component system (`apps/admin/lib/auth/index.ts`) exists but is used only in the single example file `admin-dashboard-example.tsx` and nowhere in the actual dashboard routes.
- Files: `apps/admin/supabase/middleware.ts`, `apps/admin/app/(dashboard)/dashboard/admin-dashboard-example.tsx`
- Impact: Any authenticated Supabase session — including regular customer accounts — bypasses all admin authorization.
- Fix approach: In `updateSession`, after `supabase.auth.getUser()`, query the `users` table for the role. Redirect non-admin users to `/login?error=forbidden`.

**Admin registration admin code validation is trivial:**
- Issue: The admin code check only verifies `adminCode.length >= 3`. Any 3-character string registers a new admin user.
- Files: `apps/admin/actions/auth.ts` (lines 24-29)
- Impact: Anyone who finds the registration page can create an admin account with any short string as the "code."
- Fix approach: Validate against a server-side secret stored in an environment variable (compare with `process.env.ADMIN_REGISTRATION_CODE`).

**`dashboard` app seller-facing analytics/financial components use inline static data:**
- Issue: `AdvancedAnalytics.tsx`, `FinancialDashboard.tsx`, `MarketingDashboard.tsx`, `PerformancMetrics.tsx` and others in `apps/dashboard/components/dashboard/` define their chart data as inline static arrays inside the component file.
- Files: `apps/dashboard/components/dashboard/AdvancedAnalytics.tsx`, `apps/dashboard/components/dashboard/FinancialDashboard.tsx`, `apps/dashboard/components/dashboard/MarketingDashboard.tsx`
- Impact: Sellers see fabricated numbers. Dashboards are cosmetically complete but not wired to real data.
- Fix approach: Replace inline arrays with server action fetches or React Query hooks that query real order/analytics data from Drizzle.

## Known Bugs

**Product inventory table update is UI-only:**
- Symptoms: Clicking "Update inventory" in the admin product inventory table modifies the local React state but does not call any server action. Changes vanish on page reload.
- Files: `apps/admin/app/(dashboard)/products/_components/product-inventory-table.tsx` (lines 274-300)
- Trigger: Open any product's inventory tab, change a quantity, click update.
- Workaround: None — actual inventory must be edited directly in the database.

**Dead shipping options in `calculateShipping`:**
- Symptoms: The function returns three hard-coded shipping options per seller but they are never consumed during checkout — checkout uses the flat env-var rate instead.
- Files: `apps/ecommerce/actions/checkout.ts` (lines 265-319)
- Trigger: Any checkout flow.
- Workaround: N/A — users always pay the flat rate.

## Security Considerations

**Admin panel accessible to all authenticated users:**
- Risk: Any user with a valid Supabase session (including shoppers) can access the full admin dashboard.
- Files: `apps/admin/supabase/middleware.ts`, `apps/admin/actions/auth.ts`
- Current mitigation: None beyond session presence check.
- Recommendations: Add role verification in middleware; add role check to login action; apply `AdminGuard` components to all dashboard routes.

**Admin registration accepts weak admin codes:**
- Risk: Anyone who discovers `/login` (or a register endpoint) can self-register as an admin with any 3+ character string.
- Files: `apps/admin/actions/auth.ts` (lines 24-29)
- Current mitigation: None.
- Recommendations: Validate `adminCode` against `process.env.ADMIN_REGISTRATION_CODE` using `timingSafeEqual`; disable open registration in production.

**`NEXT_PUBLIC_` prefix on shipping cost exposes server config:**
- Risk: `NEXT_PUBLIC_SHIPPING_COST` is readable by any browser user, revealing internal pricing config. It is also used in server-side calculations, so changes require a rebuild.
- Files: `apps/ecommerce/actions/checkout.ts` (line 90), `apps/ecommerce/actions/order.ts` (line 93), `apps/ecommerce/actions/coupons.ts` (line 179)
- Current mitigation: Value is not sensitive on its own, but pattern leaks that all pricing is controlled by a single env var.
- Recommendations: Move to a non-public env var (`SHIPPING_COST`) read only on the server, or store the value in the database.

**Coupon validation duplication creates race condition:**
- Risk: Coupon validation logic is duplicated in `validateCoupon` (coupons.ts) and inline in `createOrder` (order.ts). `usageCount` is incremented non-atomically — a user can submit two simultaneous checkout requests and exceed `usageLimit`.
- Files: `apps/ecommerce/actions/order.ts` (lines 148-207), `apps/ecommerce/actions/coupons.ts`
- Current mitigation: None.
- Recommendations: Consolidate coupon logic into one function; use an atomic `UPDATE ... WHERE usageCount < usageLimit RETURNING id` instead of read-then-write.

## Performance Bottlenecks

**`getAvailableCoupons` runs N per-user queries inside a loop:**
- Problem: After fetching all active coupons, the function loops over each one and executes a separate `SELECT count(*)` query to check per-user usage.
- Files: `apps/ecommerce/actions/coupons.ts` (lines 362-382)
- Cause: N+1 query pattern.
- Improvement path: Join or subquery `couponUsage` grouped by `couponId` in a single query, then filter in memory.

**`dashboard/actions/products.ts` is 1,687 lines:**
- Problem: Extremely large server action file covering product CRUD, variants, images, Excel import, inventory, and more.
- Files: `apps/dashboard/actions/products.ts`
- Cause: No separation of concerns — all product-related server logic in one file.
- Improvement path: Split into domain-specific modules: `products.actions.ts`, `variants.actions.ts`, `images.actions.ts`, `inventory.actions.ts`.

## Fragile Areas

**Multiple pages with `@ts-ignore` + `@ts-nocheck` at file level:**
- Files: `apps/admin/app/(dashboard)/payments/page.tsx`, `apps/admin/app/(dashboard)/shipping/page.tsx`, `apps/admin/app/(dashboard)/promotions/coupons/page.tsx`, `apps/admin/app/(dashboard)/products/_components/product-inventory-table.tsx`, `apps/admin/app/(dashboard)/categories/_components/columns.tsx`
- Why fragile: TypeScript is fully disabled in these files. Type errors, incorrect prop types, and API shape mismatches will not be caught at build time.
- Safe modification: Any change to these files must be manually verified at runtime. Adding real type annotations should be done as soon as the underlying type issues are resolved.
- Test coverage: None.

**Order creation comments out stock deduction — any re-enable risks crash:**
- Files: `apps/ecommerce/actions/order.ts` (lines 274-295)
- Why fragile: The commented code references `item.variant` which is typed as `any` and may not be structured correctly. Re-enabling without checking the actual query shape will cause runtime errors.
- Safe modification: Verify the query includes `variant` in its `with` clause before re-enabling; add a transaction.

## Scaling Limits

**Single flat shipping rate via env var:**
- Current capacity: Works for any order volume but is commercially incorrect.
- Limit: Cannot differentiate by geography, weight, or seller.
- Scaling path: Introduce a `shippingZones` or `sellerShippingRules` table, or integrate a shipping API (e.g., Shippo, EasyPost).

## Dependencies at Risk

**No version pinning on `nanoid` alphabet usage:**
- Risk: `customAlphabet` is used to generate order numbers. If nanoid changes its API in a major version, order number generation silently breaks.
- Impact: Duplicate or malformed order numbers.
- Files: `apps/ecommerce/actions/order.ts` (line 217)
- Migration plan: Pin nanoid version in package.json; add a uniqueness constraint on `orders.orderNumber` in the schema.

## Missing Critical Features

**No real payment processor integration:**
- Problem: Payment method selection in checkout accepts a `paymentMethod` string (e.g., `"cash_on_delivery"`) but there is no payment gateway (Stripe, PayMob, etc.) integration.
- Blocks: Actual money collection. The payments admin page uses entirely static mock data.
- Files: `apps/admin/app/(dashboard)/payments/page.tsx`, `apps/ecommerce/actions/order.ts`

**No email/notification sent on order placement:**
- Problem: `createOrder` does not trigger any email or push notification to the buyer or seller. The `apps/backend` service has an email route, and `packages/emails` exists, but neither is called from order creation.
- Blocks: Buyers receive no confirmation; sellers are not notified of new orders.
- Files: `apps/ecommerce/actions/order.ts`, `apps/backend/src/routes/emails.ts`

**Seller dashboard analytics are entirely static:**
- Problem: All chart components in `apps/dashboard/components/dashboard/` display hardcoded sample data, not real seller metrics.
- Blocks: Sellers cannot make data-driven decisions. Revenue figures shown are fabricated.
- Files: `apps/dashboard/components/dashboard/AdvancedAnalytics.tsx`, `apps/dashboard/components/dashboard/FinancialDashboard.tsx`, `apps/dashboard/components/dashboard/MarketingDashboard.tsx`, `apps/dashboard/components/dashboard/OrdersManagement.tsx`

## Test Coverage Gaps

**Zero automated tests across all apps:**
- What's not tested: Every server action, all checkout logic, coupon calculation, order creation, auth flows, and UI components.
- Files: All files under `apps/ecommerce/actions/`, `apps/admin/actions/`, `apps/dashboard/actions/`.
- Risk: Any refactor or dependency update can silently break critical paths (checkout, order creation, coupon application) with no automated catch.
- Priority: High — start with `apps/ecommerce/actions/order.ts` and `apps/ecommerce/actions/coupons.ts` as they contain the most business-critical and currently duplicated logic.

---

*Concerns audit: 2026-05-14*
