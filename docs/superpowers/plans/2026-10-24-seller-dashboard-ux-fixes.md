# Seller Dashboard UX Fixes (batches 1–3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the broken actions, unsafe destructive actions, first-run dead ends and money-copy problems found in the 2026-10-24 seller dashboard UX review.

**Architecture:** Small, local edits to existing dashboard pages, plus two shared pieces: `ConfirmActionDialog` (one confirm dialog for every destructive action) and `useUnsavedChangesGuard` (warn before leaving a dirty form). Pure decisions (heard-about-us timing, wallet KPI state, amount tone) live in `*.lib.ts` files with vitest tests.

**Tech Stack:** Next.js 16.3 App Router, React 19, next-intl (ar default + en), Tailwind, `@workspace/ui` (shadcn), vitest (node env, `*.test.ts` only), Supabase auth.

**Spec:** The UX review in this session (2026-10-24). Batches: 1 = bugs and safety, 2 = first-run flow, 3 = money clarity, plus the shared unsaved-changes guard from batch 4. Navigation changes (store switcher position, mobile bottom bar, slimmer Website group) are **out of scope** until the owner approves them.

## Global Constraints

- Every new string goes in both `apps/dashboard/messages/ar.json` and `en.json` (Arabic first-class; brand طلبي).
- Logical CSS only (`ms-/me-/ps-/pe-/start-/end-`); flip directional icons with `rtl:rotate-180`.
- Never discard or overwrite the owner's uncommitted edits; edit those files in place (`design.client.tsx`, `store-general.client.tsx` are already modified).
- **No commits** (owner asked to work on the current branch, which holds uncommitted owner work). Leave changes in the working tree.
- Do not change money or ledger logic; money tasks are display only. The fee is a flat EGP 5 (`STANDARD_FEE_MIN_PIASTRES = 500`) per delivered order, 7-day trial (`FEE_TRIAL_DAYS`).
- `packages/ui` is shared with admin: keep its English defaults; pass translated labels from the dashboard.
- Verify per task with `pnpm --filter dashboard typecheck` and `pnpm --filter dashboard test`; at the end, also `pnpm --filter dashboard lint`.

## Review Focus

1. A confirm dialog whose action fails must stay open and show the error, not close silently (every `ConfirmActionDialog` use).
2. Arabic UI: no English left in the tables touched (orders, delivery, reviews) — check `noResults`, pager, search placeholder.
3. A seller whose wallet is negative on their first visit must see at most one modal (negative-wallet wins; heard-about-us waits).
4. The unsaved-changes guard must not fire after a successful save or on the save's own redirect.
5. Login in production: server-action errors are masked by Next, so error text must be *returned*, not thrown.

---

### Task 1: `ConfirmActionDialog` + delivery confirmations

**Files:**
- Create: `apps/dashboard/components/layout/confirm-action-dialog.client.tsx`
- Modify: `apps/dashboard/app/(main)/orders/delivery/status-actions.client.tsx` (menu items for `cancelled` / `returned`)
- Modify: `apps/dashboard/app/(main)/orders/delivery/shipping-workspace.client.tsx` (bulk "Mark delivered")
- Modify: `messages/{ar,en}.json` → `shipping.actions.confirm.{cancelledTitle,returnedTitle,description,bulkDeliveredTitle,bulkDeliveredDescription}`, `common.confirm`

**Interfaces:**
- Produces: `ConfirmActionDialog(props: { open: boolean; onOpenChange(open: boolean): void; title: string; description?: React.ReactNode; confirmLabel: string; cancelLabel?: string; destructive?: boolean; pending?: boolean; onConfirm(): void })` — built on `@workspace/ui/components/alert-dialog`; the action button calls `e.preventDefault()` then `onConfirm()`, so the caller closes it on success; red button when `destructive`; spinner + disabled while `pending`.

- [ ] Step 1: Create the component.
- [ ] Step 2: In `StatusActions`, selecting `cancelled` or `returned` sets `confirming: ShippingStatus | null`; the dialog confirms then calls `apply(status)` and closes on success. `failed` keeps its reason dialog.
- [ ] Step 3: Bulk "Mark delivered" opens the dialog with the count; confirm runs `runBulk(..., "delivered")`.
- [ ] Step 4: `pnpm --filter dashboard typecheck` → no new errors.

### Task 2: Confirm before disconnecting apps, removing a domain, publishing from Design

**Files:**
- Modify: `app/(main)/stores/[storeId]/apps/{apps,google-sheets,meta-capi,shopify-import}.client.tsx` — the Disconnect button opens `ConfirmActionDialog`; confirm calls the existing `remove`.
- Modify: `app/(main)/settings/custom-domain.client.tsx:134` — replace `window.confirm` with the dialog (title uses existing `removeConfirm` text); wrap `copy` in try/catch with an error toast.
- Modify: `app/(main)/stores/[storeId]/website/design/design.client.tsx` (Publish button) — confirm with "This publishes all draft changes to your live site".
- Modify: messages → `storeApps.disconnectConfirm.{title,description}` (+ per-provider description for Google Sheets and Meta CAPI), `design.publishConfirm.{title,description}`, `customDomain.copyFailed` (use the files' existing namespaces).

- [ ] Step 1: Apply to each file. - [ ] Step 2: typecheck.

### Task 3: Product row Delete works; bulk delete gives feedback

**Files:** Modify `app/(main)/products/_components/vendor-products.section.tsx:285-291,339-341`; messages `products.list.{deleteTitle,deleteDescription,deleted,deleteFailed,bulkDeleted}`.

**Interfaces:** Consumes `deleteProduct(productId): Promise<{ success: boolean; error?: string }>` (`actions/products.ts:1965`).

- [ ] Step 1: Row "Delete" opens `ConfirmActionDialog` (destructive); confirm calls `deleteProduct`, toasts, `router.refresh()`.
- [ ] Step 2: `onDeleteSelected` counts failures from the results, toasts success/failure, then `router.refresh()`.
- [ ] Step 3: typecheck.

### Task 4: Translated table labels; Reviews search works; wallet ledger link

**Files:**
- Modify: `app/(main)/orders/orders-chunks.tsx`, `orders/delivery/shipping-workspace.client.tsx`, `reviews/reviews.chunks.tsx` — pass `labels={useTableSectionLabels()}` (from `@/lib/i18n/table-labels`).
- Modify: `reviews/reviews.chunks.tsx` — `review` column gets `accessorFn: (r) => [r.title, r.content, r.customerName].filter(Boolean).join(" ")` (use the row type's real field names).
- Modify: `app/(main)/wallet/store-wallet.data.tsx:221` — link to `/orders?order=${entry.orderId}` (same as `recent-orders.data.tsx:93`).
- Modify: `orders/delivery/shipping-workspace.client.tsx:388` — when there are no orders, show only the empty message (with a link to `/orders`), not the table too.

- [ ] Step 1: Edits. - [ ] Step 2: typecheck.

### Task 5: Auth errors returned, resend confirmation, a11y copy

**Files:**
- Modify: `apps/dashboard/actions/auth.ts` — `login` and `resetPassword` return `{ error: string | null; code?: "emailNotConfirmed" }` instead of throwing; add `resendConfirmation(email: string): Promise<{ error: string | null }>` using `supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${NEXT_PUBLIC_SITE_URL}/api/auth/callback?next=/` } })`, rate limited with `createRateLimiter` (`@/lib/rate-limit.lib`, 3 per 10 min per IP).
- Modify: `apps/dashboard/app/login/page.tsx` — read the result; on `code === "emailNotConfirmed"` show a "Resend confirmation email" button under the form.
- Modify: `apps/dashboard/app/signup/signup.client.tsx` — confirm screen gets "Resend email" (disabled 60 s after each send) and "Use a different email" (back to the form).
- Modify: `app/login/auth-field.client.tsx:491` — aria-label from `auth.showPassword` / `auth.hidePassword`.
- Modify: messages `auth.{showPassword,hidePassword,resendConfirmation,resendSent,resendFailed}`, `signup.{resend,resendSent,useDifferentEmail}`; English case fixes ("Sign in", "Back to sign in", "Check your email", "Reset password", "Try another email", "Send reset link").

- [ ] Step 1: Edits (other callers of `login`/`resetPassword`: none besides `login/page.tsx`). - [ ] Step 2: typecheck.

### Task 6: Honest signup message and a welcome moment

**Files:**
- Modify: messages `signup.created` → "Your store is ready. Publish it when you're ready to go live." (ar equivalent).
- Modify: `app/(main)/page.tsx` — read `welcome` from `searchParams`; when `"1"`, render `WelcomeBanner` above the setup slot.
- Create: `app/(main)/_components/welcome-banner.client.tsx` — card: title "Welcome to Tallaby", text "Your store is offline until you publish it. Follow the steps below to get your first order.", close button that `router.replace("/")`.
- Messages `home.welcome.{title,description,close}`.

- [ ] Step 1: Edits. - [ ] Step 2: typecheck.

### Task 7: Heard-about-us waits a day and never stacks with the wallet dialog

**Files:**
- Create: `components/layout/heard-about-us.lib.ts` + `heard-about-us.lib.test.ts`
- Modify: `components/layout/heard-about-us.data.ts` (select `feeTrialStartedAt`), `app/(main)/layout.tsx` (pass `show={askHeardAboutUs && !(walletBalance != null && walletBalance < 0)}`).

**Interfaces:** Produces `shouldAskHeardAboutUs(input: { answeredAt: string | Date | null; firstStoreAt: string | Date | null; now?: Date }): boolean` — true only when unanswered and `firstStoreAt` is at least 24 h before `now`. `sellers.fee_trial_started_at` is the first store's `created_at` (0067).

- [ ] Step 1: Tests: unanswered + first store 25 h ago → true; 2 h ago → false; answered → false; `firstStoreAt` null → false.
- [ ] Step 2: Run `pnpm --filter dashboard test heard-about-us` → FAIL. - [ ] Step 3: Implement. - [ ] Step 4: PASS.

### Task 8: After creating a store, go to it

**Files:** Modify `app/(main)/stores/stores.client.tsx:298-308`.

**Interfaces:** Consumes `createStoreAction(input) → { success: true; data: { id } }`, `selectStore(id)` (`components/dashboard/store-switcher.server.ts`; navigation-only selection, never a write target).

- [ ] Step 1: On success: `await selectStore(result.data.id)`, then `router.push(`/stores/${id}/website`)`. Also show the hover-only "open store" button on touch screens (`max-sm:opacity-100`, line ~184).
- [ ] Step 2: typecheck.

### Task 9: Money copy — home wallet KPI, Financial colours, Plan pricing

**Files:**
- Create: `app/(main)/_components/wallet-kpi.lib.ts` + `.test.ts` — `walletKpiState(balance: number): "negative" | "positive" | "zero"`.
- Modify: `app/(main)/_components/home-kpis.data.tsx:47-60` — label `home.kpis.storeWallet` ("Store wallet"); footer: negative → destructive link "Below zero — top up" to `/wallet?topup=1`; positive → "View wallet" to `/wallet`; zero → "Platform fees are paid from this wallet". Drop the "Withdraw" link (the store wallet pays fees; there is no withdrawal).
- Modify: `app/(main)/financial/financial.chunks.tsx:213` — amount colour by sign (`text-success` ≥ 0, `text-destructive` < 0) with a `+` for credits; when last month is 0, hide the delta.
- Modify: `app/(main)/settings/plan/page.tsx` — new "Fees" row: "EGP 5 per delivered order, paid from your store wallet" + trial state from `getFeeTrialStatus` (load the seller's fee-trial fields with a small query; reuse `getHomeSnapshot` fields if simpler) + link to `/wallet`. Values from `STANDARD_FEE_MIN_PIASTRES` / `FEE_TRIAL_DAYS` (`@workspace/lib/orders`), not hard-coded.
- Messages: `home.kpis.{storeWallet,walletNegative,walletView,walletZero}`, `planUsage.{fees,feeLine,trialActive,trialEnded,trialNotStarted,viewWallet}`.

- [ ] Step 1: Tests for `walletKpiState(-0.01) = "negative"`, `(0) = "zero"`, `(12.5) = "positive"`. - [ ] Step 2: FAIL. - [ ] Step 3: Implement + edits. - [ ] Step 4: PASS + typecheck.

### Task 10: `useUnsavedChangesGuard`

**Files:**
- Create: `apps/dashboard/hooks/use-unsaved-changes-guard.ts`
- Modify: `app/(main)/products/add/add-product.tsx` (edit mode: `form.formState.isDirty`), `app/(main)/stores/[storeId]/settings/store-general.client.tsx` (its dirty flag).
- Messages `common.unsavedChanges` ("You have unsaved changes. Leave anyway?").

**Interfaces:** Produces `useUnsavedChangesGuard(dirty: boolean, message: string): void` — while `dirty`: `beforeunload` handler, plus a capture-phase `click` listener on `document` that, for same-origin `<a>` clicks without modifier keys and a different pathname, calls `window.confirm(message)` and cancels the click when declined.

- [ ] Step 1: Create hook; apply to the two forms. - [ ] Step 2: typecheck.

### Task 11: Record and verify

- [ ] Step 1: PLAN.md — Phase 9D tasks UX-01…UX-10 (§19), checklist (§22), log entry (§23) with checks run and manual checks still to do.
- [ ] Step 2: `pnpm --filter dashboard typecheck`, `pnpm --filter dashboard test`, `pnpm --filter dashboard lint` — record results.
