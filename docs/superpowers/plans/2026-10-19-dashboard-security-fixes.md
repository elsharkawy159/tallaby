# Dashboard Security Fixes + No Product Approval — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the holes found in the 2026-10-19 dashboard code review (C1, C2, H1–H4, M1–M4), and remove admin approval of seller products (owner decision, same day).

**Architecture:** Each fix is small and lives where the bug is. New logic goes into pure, unit-tested `*.lib.ts` files under `apps/dashboard/lib/`, and the old `actions/*.ts` files only call them (CLAUDE.md rule 14: nothing new is added to `actions/products.ts`). Authorization moves the older `actions/` code onto the existing `requireSeller()` from `lib/auth/require-seller.server.ts`, and a source-scanning test keeps it there.

**Tech Stack:** Next.js 16.3.3 (App Router, server actions, route handlers), Drizzle, Supabase, zod, Vitest (`apps/dashboard/vitest.config.ts`, includes `app|lib|components/**/*.test.ts`).

**Spec:** The code review in this conversation (findings C1, C2, H1–H4, M1–M4, Low), plus the owner's decision on approval:
> "Admin (Me) don't have to approve the seller's products anymore, as the store owner (seller) can do whatever he wants on his website without my approval." Answers: go live **everywhere** (seller site + Tallaby marketplace), and new products go **live immediately**.

The decision is recorded in memory `no-product-approval`. Task 13 records it in `PLAN.md` §21/§23 as part of P9-04 (Security review).

## Global Constraints

- **Never stage other people's work (CLAUDE.md rule 16).** The working tree already has uncommitted owner edits in `PLAN.md`, `CLAUDE.md`, `apps/dashboard/messages/ar.json` and `apps/dashboard/messages/en.json`.
  - Commit with `git add <exact paths>` only. Never use `git add -A`, `git add .` or `git commit -a`.
  - Edit those four files, but **leave them unstaged** and list them in the final report.
- Branch: `feat/seller-saas`. End every commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **i18n:** every new or changed string goes into both `ar.json` and `en.json`. Arabic is the default. The Arabic brand name is **طلبي**.
- **Migrations:** hand-written, idempotent SQL in `packages/db/migrations/0071_*.sql`. Mirror it in `packages/db/src/drizzle/schema.ts`. Do not run `drizzle-kit generate`. **Write the migration only; do not apply it anywhere.**
- **Out of bounds:**
  - Do not touch `apps/admin`, `packages/lib/src/orders/place-order.ts`, or any wallet or ledger code.
  - Do not touch the Valorcy reference project.
- **Product status:**
  - Seller writes never set `"pending"` again. They produce `"active"`, `"draft"`, or keep `"rejected"`.
  - `"rejected"` now means an admin takedown and survives seller edits.
- **Seller gate:**
  - Gate reads with `requireSeller()` and mutations with `requireSeller({ forWrite: true })`.
  - `"approved"` and `"restricted"` sellers pass. Only `"approved"` sellers can make a product live.
- Verify after each task: `pnpm --filter dashboard typecheck`, `pnpm --filter dashboard lint`, `pnpm --filter dashboard test`. All three are green at baseline (226 tests, 32 files).
- Read `apps/dashboard/node_modules/next/dist/docs/` before changing route handler or server action APIs.

## Review Focus

1. **Edit form sends extra fields.** It submits the whole form (`isFeatured: false`, `isPlatformChoice: false`, `notes`, `productUrl`, …). Expected: unknown or forbidden keys are **dropped silently**, not rejected, so saving still works. Pinned in Task 6 (`drops forbidden keys without throwing`).
2. **Last image removed.** The seller deletes every image of a live product (the `product-image-upload.tsx` path sends `{ images: [] }`). Expected: the product drops to `"draft"` instead of staying live with no image. Pinned in Task 7 (`active product with no image becomes draft`).
3. **Restricted seller.** A restricted seller creates or edits a product. Expected: it never goes live. Pinned in Task 7 (`restricted seller cannot go live`).
4. **SSRF through redirects or mapped addresses.** A product link that redirects to `127.0.0.1`, or a host that resolves to `::ffff:10.0.0.1`. Expected: rejected. Pinned in Task 1 (`rejects a redirect to a private address`, `treats IPv4-mapped IPv6 as IPv4`).
5. **Legacy pending products.** Products still `"pending"` from the approval era. Expected: the seller can publish them with the existing toggle. Pinned in Task 7 (`pending product can be published`), plus the manual check in Task 7.

---

### Task 1: Safe outbound fetch library

**Files:**
- Create: `apps/dashboard/lib/net/url-guard.lib.ts`
- Create: `apps/dashboard/lib/net/url-guard.lib.test.ts`
- Create: `apps/dashboard/lib/net/safe-fetch.server.ts`
- Create: `apps/dashboard/lib/net/safe-fetch.server.test.ts`

**Interfaces:**
- Produces:
  - `isPublicIp(address: string): boolean`
  - `parsePublicHttpUrl(raw: string): URL | null`
  - `class UnsafeUrlError extends Error`
  - `class ResponseTooLargeError extends Error`
  - `type LookupFn = (hostname: string) => Promise<string[]>`
  - `type SafeFetchResult = { ok: boolean; status: number; finalUrl: string; contentType: string; body: Uint8Array }`
  - `safeFetch(rawUrl: string, opts: { headers?: Record<string, string>; maxBytes: number; timeoutMs: number; maxRedirects?: number; lookup?: LookupFn }): Promise<SafeFetchResult>`

- [ ] **Step 1: Write the failing tests** in `url-guard.lib.test.ts`:
  - `isPublicIp` is `false` for:
    - IPv4: `127.0.0.1`, `10.1.2.3`, `172.16.0.1`, `172.31.255.255`, `192.168.1.1`, `169.254.169.254`, `100.64.0.1`, `0.0.0.0`, `224.0.0.1`, `255.255.255.255`
    - IPv6: `::1`, `::`, `fe80::1`, `fd00::1`, `::ffff:127.0.0.1`, `::ffff:10.0.0.1`
    - Not an IP: `"not-an-ip"`
  - `isPublicIp` is `true` for `8.8.8.8`, `172.32.0.1`, `100.128.0.1`, `2606:4700:4700::1111`.
  - Test name `treats IPv4-mapped IPv6 as IPv4` covers the two `::ffff:` cases.
  - `parsePublicHttpUrl` returns `null` for `file:///etc/passwd`, `ftp://example.com/`, `http://localhost/`, `http://shop.localhost/`, `http://user:pw@example.com/`, `http://example.com:8080/`, `http://169.254.169.254/latest`, `http://[::1]/`.
  - `parsePublicHttpUrl` returns a `URL` for `https://www.amazon.eg/dp/B0TEST` and `http://example.com/`.

- [ ] **Step 2: Write the failing tests** in `safe-fetch.server.test.ts`. Stub `fetch` with `vi.stubGlobal` and pass a fake `lookup`.
  - `rejects a host that resolves to a private address`: lookup gives `["10.0.0.5"]`, so `UnsafeUrlError` is thrown and `fetch` is never called.
  - `rejects a redirect to a private address`: the first response is a 302 with `location: http://127.0.0.1/`, so `UnsafeUrlError` is thrown.
  - `follows a redirect to a public host`: 302, then 200 with body `"ok"`. Expect `finalUrl` to be the second URL and `new TextDecoder().decode(body)` to be `"ok"`.
  - `stops after maxRedirects`: four 302s with `maxRedirects: 3`, so `UnsafeUrlError` is thrown.
  - `rejects by content-length before reading`: header `content-length: 5000` with `maxBytes: 1000`, so `ResponseTooLargeError` is thrown.
  - `rejects a streamed body over maxBytes`: three 1000-byte chunks, no content-length, `maxBytes: 2500`, so `ResponseTooLargeError` is thrown.

- [ ] **Step 3: Run the tests to confirm they fail**
  - Run: `pnpm --filter dashboard exec vitest run lib/net`
  - Expected: FAIL, modules not found.

- [ ] **Step 4: Implement `url-guard.lib.ts`**
  - **`isPublicIp`:** use `node:net` (`isIP`, `BlockList`). Turn `::ffff:a.b.c.d` into IPv4 before checking. Block these ranges:
    - IPv4: `0/8`, `10/8`, `100.64/10`, `127/8`, `169.254/16`, `172.16/12`, `192.0.0/24`, `192.168/16`, `198.18/15`, `224/4`, `240/4`
    - IPv6: `::/128`, `::1/128`, `fc00::/7`, `fe80::/10`, `ff00::/8`
  - **`parsePublicHttpUrl`:** allow only `http:` or `https:`, with no username or password. The port must be empty, `80` or `443`. The hostname must not be `localhost`, end in `.localhost`, `.local` or `.internal`, or be an IP literal for which `isPublicIp` is false. Strip the brackets from IPv6 literals before checking.

- [ ] **Step 5: Implement `safe-fetch.server.ts`**
  - Add `import "server-only"` if the package is already a dependency. Check `package.json` first and skip the import if it isn't.
  - Default `lookup`: `dns.promises.lookup(host, { all: true })`, mapped to addresses.
  - Loop up to `maxRedirects` (default 3) + 1 times:
    1. Parse the URL with `parsePublicHttpUrl`. If it returns `null`, throw `UnsafeUrlError`.
    2. Unless the hostname is an IP literal, resolve it. Every resolved address must pass `isPublicIp`, otherwise throw `UnsafeUrlError`.
    3. Call `fetch` with `redirect: "manual"` and `signal: AbortSignal.timeout(timeoutMs)`.
    4. On a 3xx with a `location` header, resolve that location against the current URL and continue the loop.
    5. Otherwise read the body: reject first by `content-length`, then stream with a running byte count and cancel the reader past `maxBytes`.
  - Put a comment in the file about the remaining DNS-rebinding window: `fetch` resolves the host again on its own. That is accepted, and the comment should say so.

- [ ] **Step 6: Run the tests to confirm they pass**
  - Run: `pnpm --filter dashboard exec vitest run lib/net`
  - Expected: PASS.

- [ ] **Step 7: Commit**
  ```bash
  git add apps/dashboard/lib/net
  git commit -m "feat(dashboard): safe outbound fetch with private-address and size guards"
  ```

### Task 2: Lock down `/api/fetch-product` (C1)

**Files:**
- Modify: `apps/dashboard/app/api/fetch-product/route.ts:546-586` (the `POST` head, up to `const $ = load(html)`)

**Interfaces:**
- Consumes: `safeFetch`, `UnsafeUrlError`, `ResponseTooLargeError` (Task 1); `requireSeller`, `isAccessError` (`lib/auth/require-seller.server.ts`); `createRateLimiter` (`lib/rate-limit.lib.ts`).

- [ ] **Step 1: Add the gate, the rate limit and `safeFetch`**
  - Gate with `requireSeller({ forWrite: true })`. An `AccessError` returns `401 { error: "Unauthorized" }`.
  - Define a module-level `createRateLimiter({ limit: 60, windowMs: 10 * 60_000 })`, keyed `fetch-product:${sellerId}`. Over the limit returns `429 { error: "Too many requests" }`.
  - Replace the `fetch` with `safeFetch(url, { headers: <the existing headers>, maxBytes: 3 * 1024 * 1024, timeoutMs: 10_000 })`.
  - Get the page text with `html = new TextDecoder().decode(result.body)` and use `finalUrl = result.finalUrl`.
  - `UnsafeUrlError` returns `400 { error: "URL not allowed" }`. `ResponseTooLargeError` returns `400 { error: "Page too large" }`.
  - Keep the rest of the parser unchanged.

- [ ] **Step 2: Verify**
  - Run typecheck, lint and test (Global Constraints).
  - Manual check with `pnpm --filter dashboard dev`:
    - Signed out, `curl -X POST localhost:3002/api/fetch-product -H 'content-type: application/json' -d '{"url":"https://example.com"}'` returns 401.
    - Signed in, Products › Add › import from a real product link still fills the form.
    - Signed in, a `http://127.0.0.1:3002/` link shows an error.

- [ ] **Step 3: Commit**
  ```bash
  git add apps/dashboard/app/api/fetch-product/route.ts
  git commit -m "fix(dashboard): require seller, rate-limit and SSRF-guard product link import"
  ```

### Task 3: Lock down `/api/import-product-images` (M1)

**Files:**
- Modify: `apps/dashboard/app/api/import-product-images/route.ts:46-108`

**Interfaces:**
- Consumes: Task 1 exports, plus `requireSeller` and `createRateLimiter`.

- [ ] **Step 1: Apply the same pattern as Task 2**
  - Replace `getUser` with `requireSeller({ forWrite: true })`, returning 401 on `AccessError`.
  - Add a limiter `{ limit: 30, windowMs: 10 * 60_000 }`, keyed `import-images:${sellerId}`, returning 429.
  - Download with `safeFetch(url, { maxBytes: MAX_BYTES, timeoutMs: 10_000 })`. Read `contentType` from the result.
  - The upload path becomes `${sellerId}/${getTodayDate()}/${uuid}.${ext}`.
  - Per-item skip reasons: `UnsafeUrlError` gives `"URL not allowed"`; `ResponseTooLargeError` gives `"Image is larger than 2MB"`.

- [ ] **Step 2: Verify**
  - Run typecheck, lint and test.
  - Manual check: import a product link that has images; the images upload and show in the form.
  - **If the upload fails** because of a `products` bucket policy (the policy is not in the repo's migrations), go back to the old path, keep the other changes, and record this in §23 for the owner. Do not change Storage policies.

- [ ] **Step 3: Commit**
  ```bash
  git add apps/dashboard/app/api/import-product-images/route.ts
  git commit -m "fix(dashboard): seller-gate, rate-limit and SSRF-guard product image import"
  ```

### Task 4: Delete unreachable legacy actions (M4)

**Files:**
- Modify: `apps/dashboard/actions/brands.ts`, `categories.ts`, `orders.ts`, `payouts.ts`, `products.ts`, `reviews.ts`, `seller.ts`

**Interfaces:**
- Produces: these 22 exports no longer exist. Later tasks must not reference them.
  - `brands.ts`: `getBrandBySlug`, `getPopularBrands`, `getFeaturedBrands`, `getBrandsByCategory`, `getAlphabeticalBrands`
  - `categories.ts`: `getCategoryBySlug`, `getTopCategories`, `getCategoriesWithProducts`
  - `orders.ts`: `updateOrderItemStatus`, `getOrderStats`, `processRefund`
  - `payouts.ts`: `getPayoutDetails`, `getRevenueAnalytics`
  - `products.ts`: `toggleProductStatus`, `createProductVariant`, `getSellerUnansweredQuestions`
  - `reviews.ts`: `getProductReviews`, `replyToReview`, `getReviewStats`, `getUnrepliedReviews`, `deleteReviewComment`
  - `seller.ts`: `getSellerMetrics`
- Keep `updateProductAnswer`. `updateProductAnswerAction` uses it.

- [ ] **Step 1: Confirm each export is still unreferenced**
  - For each name, run `grep -rnw <name> apps/dashboard --include=*.ts --include=*.tsx`, excluding `node_modules` and `.next`.
  - Expected: only its own definition. Skip any name that now has a caller and note it in the report.

- [ ] **Step 2: Delete them**, along with any helper functions or imports that become unused.

- [ ] **Step 3: Verify**
  - Run typecheck, lint and test.
  - Expected: green, with no new unused-variable warnings.

- [ ] **Step 4: Commit**
  ```bash
  git add apps/dashboard/actions
  git commit -m "chore(dashboard): remove unreachable legacy actions (incl. unguarded order status/refund)"
  ```

### Task 5: Seller gate for every legacy action (H4)

**Files:**
- Modify: `apps/dashboard/actions/ads.ts`, `coupons.ts`, `orders.ts`, `payouts.ts`, `products.ts`, `reviews.ts`, `seller.ts`, `shipping.ts`
- Create: `apps/dashboard/lib/auth/actions-gate.test.ts`

**Interfaces:**
- Consumes: `requireSeller(options?: { forWrite?: boolean }): Promise<SellerContext>`, where `SellerContext` has `{ userId, sellerId, status, plan, maxStoresOverride }`.
- Produces:
  - Inside the actions, the seller id is `seller.sellerId`.
  - `shipping.ts` keeps `requireSellerId(): Promise<string>`, now built on `requireSeller`. Task 10 uses it.
  - `products.ts` actions keep a `seller: SellerContext` in scope, which Task 7 uses for `seller.status`.
  - `updateSellerProfile` narrows to `(data: { businessName?: string; supportEmail?: string; supportPhone?: string })`.

- [ ] **Step 1: Write the failing guard test** `lib/auth/actions-gate.test.ts`. It reads `../../actions/*.ts` with `fs`.
  - `no action module uses getUser`: every file except `auth.ts` fails `/\bgetUser\b/`.
  - `every exported action function checks the seller`:
    - Find each `export async function (\w+)` and take its body up to the next top-level `export`.
    - Skip `locale.ts:setLocale` and `brands.ts:searchBrands` (public reads), and `products.ts:answerProductQuestionAction` and `products.ts:updateProductAnswerAction` (delegate to gated actions).
    - Every other body must match `/\b(requireSeller|requireStore|requireSellerId|getSellerId|currentStore)\(/`.
    - On failure, print the names that fail.

- [ ] **Step 2: Run the test to confirm it fails**
  - Run: `pnpm --filter dashboard exec vitest run lib/auth/actions-gate.test.ts`
  - Expected: FAIL, listing the `getUser` files and `brands.ts:createBrand`.

- [ ] **Step 3: Replace `getUser()` with the seller gate in every listed file**
  - Read functions call `requireSeller()`. Functions that write call `requireSeller({ forWrite: true })`. Replace `session.user.id` with `seller.sellerId`.
  - The existing `catch` blocks already turn errors into `{ success: false, error }`. `AccessError.message` is the access code, which is fine to return.
  - `coupons.ts` `getSellerId()`: `requireSeller().then((s) => s.sellerId).catch(() => null)`.
  - `shipping.ts` `requireSellerId()`: map `AccessError` to `ShippingError("unauthorized")`.
  - `brands.ts` `createBrand` is gated here with `requireSeller({ forWrite: true })`. Task 9 adds the rest of its fix.
  - `seller.ts` `updateSellerProfile`: narrow the parameter type and `.set({ businessName, supportEmail, supportPhone, updatedAt })` explicitly, with no spread.

- [ ] **Step 4: Run the tests to confirm they pass**, then run typecheck and lint.

- [ ] **Step 5: Manual check**
  - Set a test seller's `sellers.status` to `suspended` on a local or staging database.
  - From an already-open dashboard tab, saving a product fails with no change written.
  - Set the status back to `approved`.

- [ ] **Step 6: Commit**
  ```bash
  git add apps/dashboard/actions apps/dashboard/lib/auth/actions-gate.test.ts
  git commit -m "fix(dashboard): gate all legacy actions on seller status, not just a session"
  ```

### Task 6: Product field allowlist (C2)

**Files:**
- Create: `apps/dashboard/lib/products/seller-product-input.lib.ts`
- Create: `apps/dashboard/lib/products/seller-product-input.lib.test.ts`
- Modify: `apps/dashboard/actions/products.ts`, in `createProduct` (the `productPayload` at ~1199-1206) and `updateProduct` (the `.set({...productData...})` at ~1459-1464)

**Interfaces:**
- Produces:
  - `sellerProductFieldsSchema` (zod object, `.partial()`, unknown keys stripped)
  - `type SellerProductFields = z.infer<typeof sellerProductFieldsSchema>`
  - `pickSellerProductFields(input: unknown): SellerProductFields`, which throws `ZodError` on a bad type

The allowed fields, with these exact types:

| Field | Type |
|---|---|
| `brandId` | `z.string().uuid().nullable()` |
| `categoryId` | `z.string().uuid()` |
| `sku` | `z.string().trim().max(100)` |
| `condition` | `z.enum(itemCondition.enumValues)` (from `@workspace/db`) |
| `conditionDescription` | `z.string().max(1000).nullable()` |
| `quantity` | `z.coerce.number().int().min(0).transform(String)` |
| `handlingTime` | `z.coerce.number().int().min(0).transform(String)` |
| `maxOrderQuantity` | `z.coerce.number().int().positive().nullable()` |
| `fulfillmentType` | `z.enum(["seller_fulfilled", "platform_fulfilled"])` |
| `isTrending`, `isSeasonal`, `freeDelivery` | `z.boolean()` |
| `taxClass` | `z.string().max(50)` |
| `dimensions` | `z.record(z.string(), z.unknown()).nullable()` |
| `price` | `z.unknown()` |
| `images` | `z.array(z.string())` |

`sellerCategoryId` and `sellerBrandId` are deliberately excluded. `setProductSellerTaxonomy` sets them after an ownership check.

- [ ] **Step 1: Write the failing tests**
  - `drops forbidden keys without throwing`: the input holds every allowed field plus `status: "active"`, `sellerId`, `id`, `averageRating: "5"`, `reviewCount: 999`, `totalQuestions: 3`, `isPlatformChoice`, `isMostSelling`, `isFeatured`, `sponsored`, `directCheckout` (all `true`), `productType: "digital"`, `createdAt`, `notes`, `productUrl`. Expect none of these extra keys in `Object.keys(result)`.
  - `coerces numeric strings`: `{ quantity: "5", handlingTime: 2 }` gives `{ quantity: "5", handlingTime: "2" }`.
  - `keeps a partial patch partial`: `{ images: ["a.jpg"] }` gives exactly `{ images: ["a.jpg"] }`.
  - `rejects fba fulfillment`: `{ fulfillmentType: "fba" }` throws.
  - `rejects negative quantity`: `{ quantity: -1 }` throws.

- [ ] **Step 2: Run the tests to confirm they fail**
  - Run: `pnpm --filter dashboard exec vitest run lib/products`
  - Expected: FAIL.

- [ ] **Step 3: Implement the lib**, then run the tests again. Expected: PASS.

- [ ] **Step 4: Wire it into `products.ts`**
  - **`createProduct`:** build the insert from `{ ...pickSellerProductFields(sharedOnly), sku, sellerId: seller.sellerId, status: <Task 7 sets this; until then "pending"> }`.
  - **`updateProduct`:** use `.set({ ...pickSellerProductFields(productData), status: <unchanged until Task 7>, updatedAt })`.
  - Keep `normalizeProductPricePayload` applied to `price` after picking.
  - A `ZodError` returns `{ success: false, error: "Invalid product data" }`.

- [ ] **Step 5: Verify**
  - Run typecheck, lint and test.
  - Manual check: add a product, edit it (all steps of the form), and change its images from the products table. All three save.

- [ ] **Step 6: Commit**
  ```bash
  git add apps/dashboard/lib/products apps/dashboard/actions/products.ts
  git commit -m "fix(dashboard): only write seller-editable product fields on create/update"
  ```

### Task 7: Products go live without admin approval (owner decision)

**Files:**
- Create: `apps/dashboard/lib/products/product-status.lib.ts`
- Create: `apps/dashboard/lib/products/product-status.lib.test.ts`
- Modify: `apps/dashboard/actions/products.ts` (`createProduct`, `updateProduct`, `setProductPublished` ~1674-1745, and remove the local `hasProductImage` at 1670)
- Modify: `apps/dashboard/app/(main)/products/_components/product-publish-toggle.client.tsx:48`
- Modify: `apps/dashboard/app/(main)/products/add/add-product.tsx` (~line 132, the create toast)
- Modify (leave unstaged): `apps/dashboard/messages/en.json`, `apps/dashboard/messages/ar.json`

**Interfaces:**
- Consumes: `seller: SellerContext` (Task 5); `pickSellerProductFields` (Task 6).
- Produces:
  - `type ProductStatus = "draft" | "pending" | "active" | "rejected"`
  - `hasProductImage(images: unknown): boolean`, moved unchanged
  - `nextProductStatus(input: { previous: ProductStatus | null; hasImage: boolean; canPublish: boolean }): ProductStatus`

The status rules:

| `previous` | Result |
|---|---|
| `"rejected"` | `"rejected"` (admin takedown sticks) |
| `"draft"` | `"draft"` (an edit does not publish a hidden product) |
| `null`, `"pending"` or `"active"` | `hasImage && canPublish ? "active" : "draft"` |

- [ ] **Step 1: Write the failing tests** (table-driven):
  - `new product with image goes live`: `{ previous: null, hasImage: true, canPublish: true }` gives `"active"`.
  - `new product without image is a draft`: `{ previous: null, hasImage: false, canPublish: true }` gives `"draft"`.
  - `active product with no image becomes draft`: `{ previous: "active", hasImage: false, canPublish: true }` gives `"draft"`.
  - `draft stays draft on edit`: `{ previous: "draft", hasImage: true, canPublish: true }` gives `"draft"`.
  - `rejected stays rejected`: `{ previous: "rejected", hasImage: true, canPublish: true }` gives `"rejected"`.
  - `pending product can be published`: `{ previous: "pending", hasImage: true, canPublish: true }` gives `"active"`.
  - `restricted seller cannot go live`: `{ previous: null, hasImage: true, canPublish: false }` gives `"draft"`.
  - `hasProductImage`: `[]` gives false, `["a"]` gives true, `null` gives false.

- [ ] **Step 2: Run the tests to confirm they fail, implement the lib, then run them again to confirm they pass.**
  - Run: `pnpm --filter dashboard exec vitest run lib/products/product-status.lib.test.ts`

- [ ] **Step 3: Wire it into `products.ts`.** In each case `canPublish = seller.status === "approved"`.
  - **`createProduct`:**
    - Set `status: nextProductStatus({ previous: null, hasImage: hasProductImage(fields.images), canPublish })`.
    - After the transaction, when the created product is `"active"`, call `syncCategoryProductCountForProductChange({ categoryId: created.categoryId, previousStatus: null, nextStatus: created.status })`. Today create never counts, because products started `"pending"`.
  - **`updateProduct`:**
    - Extend the ownership read so it also returns the current `status` and `images`.
    - Set `status: nextProductStatus({ previous: before.status, hasImage: hasProductImage(fields.images ?? currentImages), canPublish })`.
    - Update the comment at ~1457, which still says edits go "back to review".
    - The existing `syncCategoryProductCountForProductMutation` at ~1586 already handles the status change.
  - **`setProductPublished`:**
    - Allow `previous` to be `"active"`, `"draft"` or `"pending"`. `"rejected"` keeps its error.
    - Publishing also requires `canPublish`, otherwise it returns `{ success: false, error: "Your account can't publish products right now" }`.
  - Bulk import goes through `createProduct`, so it follows these rules automatically.

- [ ] **Step 4: Update the UI and copy**
  - `product-publish-toggle.client.tsx:48`: `canToggle = currentStatus !== "rejected"`.
  - `add-product.tsx`: after a successful create, when `result.data.status === "draft"`, show `toast.info(tToast("productSavedAsDraft"))` instead of the success toast.
  - Messages, in both files:

    | Key | en | ar |
    |---|---|---|
    | `status.product.pending` | `Not published` | `غير منشور` |
    | `status.product.rejected` | `Removed by Tallaby` | `أزالته طلبي` |
    | add `toast.productSavedAsDraft` | `Product saved as a draft. Add an image to publish it.` | `تم حفظ المنتج كمسودة. أضف صورة لنشره.` |
    | delete `toast.productSubmittedForReview` (unused) | | |

- [ ] **Step 5: Verify**
  - Run typecheck, lint and test (`lib/i18n/messages.test.ts` checks that `ar` and `en` match).
  - Manual checks:
    - (a) Add a product with an image as an approved seller. It shows **Active** and appears on the seller's storefront and the marketplace.
    - (b) Add one without an image. It shows **Draft** with the new toast.
    - (c) Edit (a). It stays Active.
    - (d) A `pending` product created before this change shows "Not published" and its toggle publishes it.
    - (e) Category product counts on the marketplace go up by one for (a).

- [ ] **Step 6: Commit** (messages stay unstaged)
  ```bash
  git add apps/dashboard/lib/products apps/dashboard/actions/products.ts "apps/dashboard/app/(main)/products/_components/product-publish-toggle.client.tsx" "apps/dashboard/app/(main)/products/add/add-product.tsx"
  git commit -m "feat(dashboard): seller products go live without admin approval (owner 2026-10-19)"
  ```

### Task 8: Bulk import cleanup (H1)

**Files:**
- Modify: `apps/dashboard/actions/products.ts` (`bulkUploadProductsAction` ~586-592 and ~742-760; `bulkInsertProductsAction` ~841-890)
- Modify: `apps/dashboard/lib/product-import-headers.ts:37-44`

- [ ] **Step 1: Stop reading admin-only columns**
  - Remove the `isactive`, `isfeatured` and `isplatformchoice` header aliases.
  - Remove the `importStatus`, `isFeatured` and `isPlatformChoice` parsing, and the fields they feed in the preview record and in `bulkInsertProductsAction`'s `createProduct` call. `createProduct` decides status now.

- [ ] **Step 2: Imported Q&A uses the normal defaults**
  - Delete `status: "approved" as any` from both the `productQuestions` and `productAnswers` inserts, so both default to `'pending'`.
  - Keep `isVerified: true` on the answer. That matches `answerProductQuestion` (~1849).

- [ ] **Step 3: Verify**
  - Run typecheck, lint and test. `lib/product-excel.test.ts` and `product-data-format-doc.test.ts` may pin these headers. Update the expectations, and if the format doc lists `isActive`/`isFeatured`, remove those lines from it.
  - Manual check: import a sheet with `isActive=yes` and `isFeatured=yes`. Products follow the Task 7 rules and are not featured.

- [ ] **Step 4: Commit**
  ```bash
  git add apps/dashboard/actions/products.ts apps/dashboard/lib/product-import-headers.ts <any changed test/doc files>
  git commit -m "fix(dashboard): bulk import ignores admin-only columns and self-approved Q&A"
  ```

### Task 9: `createBrand` hardening (H2)

**Files:**
- Modify: `apps/dashboard/actions/brands.ts:206-256`

**Interfaces:**
- Consumes: `applyInvalidation`, `invalidateBrand(id, slug)` from `@workspace/cache` (same call as `apps/admin/actions/brands.ts:168`).

- [ ] **Step 1: Harden the function** (the gate came in Task 5)
  - Add a limiter `{ limit: 20, windowMs: 60 * 60_000 }`, keyed `create-brand:${sellerId}`, returning `{ success: false, error: "Too many requests" }`.
  - Names over 100 characters return `{ success: false, error: "Brand name is too long" }`.
  - Cap the slug loop at 20 tries, then return the existing failure.
  - After the insert, call `applyInvalidation(invalidateBrand(newBrand.id, newBrand.slug), { from: "dashboard", mode: "action" })`.

- [ ] **Step 2: Verify**
  - Run typecheck, lint and test.
  - Manual check: add a new brand from the product form's brand search. It shows up in search right away.

- [ ] **Step 3: Commit**
  ```bash
  git add apps/dashboard/actions/brands.ts
  git commit -m "fix(dashboard): rate-limit and invalidate on seller brand creation"
  ```

### Task 10: `createSellerRider` hardening (H3)

**Files:**
- Modify: `apps/dashboard/actions/shipping.ts:511-555`
- Modify (leave unstaged): `apps/dashboard/messages/{en,ar}.json`, adding `shipping.errors.rateLimited`

- [ ] **Step 1: Harden the function**
  - Add a limiter `{ limit: 10, windowMs: 60 * 60_000 }`, keyed `create-rider:${sellerId}`. Over the limit, throw `ShippingError("rateLimited")`.
  - Wrap the `db.transaction` in a `try`. On any error, call `supabase.auth.admin.deleteUser(riderId).catch(() => undefined)`, then rethrow.
  - Add the message key:
    - en: `Too many attempts. Try again later.`
    - ar: `محاولات كثيرة. حاول مرة أخرى لاحقًا.`

- [ ] **Step 2: Verify**
  - Run typecheck, lint and test.
  - Manual check: Orders › Delivery › add a rider. It still works and the rider appears.

- [ ] **Step 3: Commit**
  ```bash
  git add apps/dashboard/actions/shipping.ts
  git commit -m "fix(dashboard): rate-limit rider creation and remove orphan auth users on failure"
  ```

### Task 11: Orders truncation notice and lighter product list (M2, M3)

Full server-side pagination is **out of scope**. Both tables filter on the client, so moving them to the server is a UX decision for a separate plan. This task makes the current limits honest and cheaper.

**Files:**
- Modify: `apps/dashboard/app/(main)/orders/vendor-orders.data.tsx:23-55`
- Modify: `apps/dashboard/app/(main)/orders/orders-chunks.tsx` (`VendorOrdersTable` props and render)
- Modify: `apps/dashboard/actions/products.ts:162-171` (`getSellerProducts` `with`)
- Modify (leave unstaged): `apps/dashboard/messages/{en,ar}.json`

- [ ] **Step 1: Orders page**
  - Pass `total={res.success ? res.totalCount : 0}` and `loadFailed={!res.success}` to `VendorOrdersTable`.
  - When `loadFailed` is set, render an error block in place of the empty table.
  - When `total > rows.length`, render a muted notice above the table.
  - Add the keys:

    | Key | en | ar |
    |---|---|---|
    | `orders.truncatedNotice` | `Showing the latest {shown} of {total} order lines.` | `يتم عرض أحدث {shown} من أصل {total} من بنود الطلبات.` |
    | `orders.loadFailed` | `We couldn't load your orders. Refresh the page to try again.` | `تعذّر تحميل طلباتك. حدّث الصفحة وحاول مرة أخرى.` |

- [ ] **Step 2: Products query**
  - In `getSellerProducts`, remove `productVariants: true`. Neither caller (`vendor-products.data.tsx` or `marketing/_components/advertise.data.tsx`) reads variants.
  - Narrow the related columns:
    - `brand: { columns: { name: true } }`
    - `category: { columns: { name: true, nameAr: true } }`
    - `productTranslations: { columns: { locale: true, title: true, slug: true, description: true } }`

- [ ] **Step 3: Verify**
  - Run typecheck (this catches any field a caller still reads), lint and test.
  - Manual check: the Products table, its Excel export and Marketing › Advertise still show titles, brands, categories and images. The Orders page shows the notice for a seller with more than 100 order lines.

- [ ] **Step 4: Commit**
  ```bash
  git add "apps/dashboard/app/(main)/orders/vendor-orders.data.tsx" "apps/dashboard/app/(main)/orders/orders-chunks.tsx" apps/dashboard/actions/products.ts
  git commit -m "fix(dashboard): show order truncation/load errors; trim seller product list query"
  ```

### Task 12: Migration 0071 for products left waiting on approval

**Files:**
- Create: `packages/db/migrations/0071_products_without_approval.sql`
- Modify: `packages/db/src/drizzle/schema.ts:1432` (the `products` table's `status: productStatus("status").default('pending')` becomes `.default('draft')`)

- [ ] **Step 1: Write the idempotent SQL**, in one transaction, with a header comment citing the owner decision of 2026-10-19:
  1. `ALTER TABLE products ALTER COLUMN status SET DEFAULT 'draft'::product_status;`
  2. Convert products that were waiting for approval:
     ```sql
     UPDATE products
     SET status = (CASE WHEN jsonb_typeof(images) = 'array' AND jsonb_array_length(images) > 0
                        THEN 'active' ELSE 'draft' END)::product_status,
         updated_at = now()
     WHERE status = 'pending'
       AND seller_id IN (SELECT id FROM sellers WHERE status = 'approved');
     ```
     Pending products of non-approved sellers stay `pending`, which the UI shows as "Not published".
  3. Recount categories, so the result matches the `+1/-1` logic in `packages/db/src/categories/product-count.ts`:
     ```sql
     UPDATE categories c
     SET product_count = (SELECT count(*) FROM products p
                          WHERE p.category_id = c.id AND p.status = 'active');
     ```

- [ ] **Step 2: Mirror the default change** in `schema.ts`, then run `pnpm --filter @workspace/db typecheck` (or the repo-wide `pnpm typecheck`) to confirm it is green.

- [ ] **Step 3: Do not apply it.** Note in §23: apply on staging first, check the counts, then production with the owner's approval. Product caches refresh within their TTL, or immediately via the admin "revalidate" path if one exists.

- [ ] **Step 4: Commit**
  ```bash
  git add packages/db/migrations/0071_products_without_approval.sql packages/db/src/drizzle/schema.ts
  git commit -m "feat(db): 0071 publish products left waiting on approval (not applied)"
  ```

### Task 13: Record the work

**Files (leave all unstaged; they hold owner edits):** `PLAN.md`, `CLAUDE.md`

- [ ] **Step 1: Update `PLAN.md`**
  - §21.3: add the decision "Seller products publish without admin approval, on the store and marketplace (owner, 2026-10-19). `rejected` = admin takedown."
  - §22: under P9-04, add a sub-note "dashboard review fixes done 2026-10-19 (commits …)". Leave P9-04 unticked.
  - §23: add an entry listing the findings fixed, the manual checks and their results, the deferred items (server-side pagination; the Low findings: rollout flag in editor actions, auth-callback `verifyOtp`, duplicate seller-status rule), and that 0071 is not applied.

- [ ] **Step 2: Update `CLAUDE.md` rule 6**: the next migration number is `0072`, and `0071` publishes pending products and changes the default to draft (not applied yet).

- [ ] **Step 3: Final verification**
  - Run: `pnpm lint && pnpm typecheck && pnpm test` from the repo root.
  - Expected: green, apart from the pre-existing ecommerce errors noted in §23 (19 in `profile.chunks.tsx` / `product-details.tsx`). Report any other failure verbatim.
