# Tallaby Affiliate Program (F-37) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sellers earn 20 % of every succeeded store-wallet top-up by sellers they referred, track it on `/earn`, and withdraw in cash through an Admin payout flow.

**Architecture:** One migration (`0117`) adds referral columns on `sellers` plus two server-only ledgers (`referral_commissions`, `referral_payouts`). A pure lib (`packages/lib/src/referrals/referrals.lib.ts`) holds the math and rules; a server module posts commissions inside both top-up success transactions, attributes at `ensureSellerAccount`, and serves the seller page and Admin. Wallets are never touched.

**Tech Stack:** Next.js 16.3 (apps/dashboard, apps/admin, apps/ecommerce), Drizzle, Postgres (Supabase), vitest, next-intl (`ar.json`/`en.json`).

**Spec:** `docs/superpowers/specs/2026-10-29-affiliate-program-design.md`

## Global Constraints

- Commission = `floor(topUpPiastres × 20 / 100)` piastres, only on `seller_wallet_top_ups.status = 'succeeded'`, one row per `top_up_id` (`ON CONFLICT DO NOTHING`).
- Unlock: ≥ 10 successful referrals (referred, not excluded, ≥ 1 succeeded top-up) **and** ≥ 10 non-deleted stores of non-excluded referred sellers. `referral_unlocked_at` set once; only admin re-lock clears it.
- Withdrawal: whole available balance, ≥ EGP 500 (50 000 piastres), one `requested` payout at a time, referrer `sellers.status = 'approved'`.
- Cookie `tallaby_ref`, domain `.tallaby.com` in production (host-only locally), 60 days, first link wins, code regex `^[A-HJ-NP-Z2-9]{7}$` (7 chars, no `I O 0 1`).
- Money in integer piastres, stored `numeric(10,2)`. No change to any wallet table or `postStoreWalletEntry`.
- Every string in both `apps/dashboard/messages/ar.json` and `en.json`; Arabic default. Admin is English-only (existing convention).
- Seller ID always from `requireSeller()`; never from the client. Admin actions through `adminActorId(...)` + `writeAdminAudit`.
- Do not run `drizzle-kit generate`. Do not touch other sessions' uncommitted files beyond the lines this plan needs (signup files, `schema.ts`, `relations.ts`, notifications lib, messages, sidebar config are already modified by another session: edit surgically, never revert).

## Review Focus

1. Kashier webhook delivered twice → exactly one commission (integration test in Task 3).
2. A seller with an existing account clicking someone's link and "signing up" again → no referrer attached (Task 4 test).
3. Referrer and new seller share a phone → no referrer (Task 4 test).
4. Two withdraw clicks in parallel → one `requested` row (partial unique index; Task 5 test).
5. Payout rejected → balance returns; commission reversed after payout → balance negative and withdraw disabled (Task 1 unit test on `availablePiastres`).

---

### Task 1: Pure rules lib

**Files:**
- Create: `packages/lib/src/referrals/referrals.lib.ts`, `packages/lib/src/referrals/index.ts`
- Test: `packages/lib/src/referrals/referrals.lib.test.ts`
- Modify: `packages/lib/package.json` (exports `./referrals` and `./referrals/server`)

**Interfaces — Produces:**
- `REFERRAL_RATE_PERCENT = 20`, `REFERRAL_MIN_PAYOUT_PIASTRES = 50_000`, `REFERRAL_UNLOCK_REFERRALS = 10`, `REFERRAL_UNLOCK_STORES = 10`, `REFERRAL_COOKIE = "tallaby_ref"`, `REFERRAL_COOKIE_MAX_AGE = 60 * 24 * 60 * 60`, `REFERRAL_CODE_RE`.
- `toPiastres(amount: string | number): number`, `fromPiastres(p: number): string` ("123.45").
- `commissionPiastres(topUpAmount: string): number`.
- `availablePiastres(input: { earned: number; requestedOrPaid: number }): number`.
- `isUnlocked(input: { successfulReferrals: number; stores: number; unlockedAt: string | null }): boolean`.
- `withdrawBlockReason(input: { unlocked: boolean; available: number; hasOpenRequest: boolean; sellerStatus: string }): null | "locked" | "below_minimum" | "open_request" | "suspended"`.
- `normalizeReferralCode(raw: unknown): string | null` (trim, upper-case, regex).
- `generateReferralCode(random?: () => number): string`.
- `payoutRequestSchema` (zod): `{ method: "bank", holderName, bankName, accountNumber } | { method: "vodafone_cash", holderName, phone (Egyptian 01xxxxxxxxx) }`, strings capped (holder ≤ 100, bank ≤ 100, account 6–34 alnum).
- `maskDestination(d): string` (last 4 visible).
- `referralShareUrl(code: string, base = "https://tallaby.com"): string` → `${base}/?ref=${code}`.

- [ ] **Step 1:** Write tests: `commissionPiastres("100.00") === 2000`, `("0.03") === 0`, `("99.99") === 1999`; `availablePiastres({earned: 60000, requestedOrPaid: 0}) === 60000`, reversal-after-payout case `({earned: 10000, requestedOrPaid: 50000}) === -40000`; `isUnlocked` true at 10/10, false at 10/9, true at 0/0 with `unlockedAt` set; `withdrawBlockReason` order: suspended → locked → open_request → below_minimum, null at exactly 50 000; `normalizeReferralCode(" ab3cdef ")` = `"AB3CDEF"`, rejects `"ABC0DEF"`, `"ABCDEF"`, non-strings; `generateReferralCode()` matches regex 100 times; `payoutRequestSchema` accepts both shapes, rejects phone `"0123"`; `maskDestination` hides all but last 4.
- [ ] **Step 2:** `pnpm --filter @workspace/lib test referrals` → FAIL.
- [ ] **Step 3:** Implement. `index.ts` re-exports the lib only (client-safe).
- [ ] **Step 4:** Tests PASS.

### Task 2: Migration 0117 + Drizzle mirror

**Files:**
- Create: `packages/db/migrations/0117_referral_program.sql`
- Modify: `packages/db/src/drizzle/schema.ts`, `packages/db/src/drizzle/relations.ts`, `packages/lib/src/notifications/notifications.lib.ts` (+ its test)

SQL contents (idempotent, header comment in the 0115 style):
- `ALTER TABLE sellers ADD COLUMN IF NOT EXISTS referral_code text, referred_by_seller_id uuid REFERENCES sellers(id) ON DELETE SET NULL, referred_at timestamptz, referral_unlocked_at timestamptz, referral_excluded_at timestamptz`; unique index `sellers_referral_code_key` on `referral_code` where not null; check `sellers_referral_code_format` (`referral_code ~ '^[A-HJ-NP-Z2-9]{7}$'`), check `sellers_not_self_referred` (`referred_by_seller_id <> id`), index on `referred_by_seller_id`.
- `referral_commissions` as spec (`status` CHECK in `('earned','reversed')`, `top_up_id` UNIQUE FK `ON DELETE RESTRICT`, referrer/referred FKs `ON DELETE RESTRICT`, index `(referrer_seller_id, created_at DESC)`, `(referred_seller_id)`).
- `referral_payouts` as spec (`method` CHECK, `status` CHECK `requested|paid|rejected`, `amount >= 500`, partial unique index `referral_payouts_one_open` on `(referrer_seller_id) WHERE status = 'requested'`, `reference` required when paid via CHECK).
- RLS enabled on both, no policies.
- Admin types: guarded widen of `admin_notifications_type_check` to 0116's list + `referral_payout_requested` (guard on `LIKE '%referral_payout_requested%'`); trigger `referral_payouts_notify_admin` AFTER INSERT (dedupe `referral_payout_requested:<id>`, data `{ amount, storeName }`, same exception-swallowing body as 0115).
- Seller types: re-create `seller_notifications_type_check` with 0106's list + `referral_commission_earned`, `referral_payout_paid`, `referral_payout_rejected` (guarded the same way).
- Rollback comment block.

Notifications lib: add `"referral_payout_requested"` to `ADMIN_NOTIFICATION_TYPES` → href `/referrals`; add the three seller types → href `/earn`. Add test cases next to the existing ones.

- [ ] **Step 1:** Add the href test cases; run → FAIL.
- [ ] **Step 2:** Write SQL, schema/relations mirror (`referralCommissions`, `referralPayouts`, sellers columns), notifications lib.
- [ ] **Step 3:** `pnpm --filter @workspace/lib test notifications` PASS; `pnpm --filter @workspace/db typecheck` PASS.
- [ ] **Step 4:** Apply `0117` to **staging** (owner pre-approval needed for production; ask before production).

### Task 3: Commission posting

**Files:**
- Create: `packages/lib/src/referrals/referrals.server.ts`, `packages/lib/src/referrals/server.ts`
- Modify: `packages/lib/src/store-wallet/top-up.server.ts` (in `applyStoreTopUpWebhook`, after the succeeded update), `packages/lib/src/admin/top-ups.server.ts` (in `reviewManualStoreTopUp`, after the succeeded update)
- Test: `packages/lib/src/referrals/referrals.integration.test.ts` (skipped without `TEST_DATABASE_URL`)

**Interfaces — Produces:** `postReferralCommission(tx: Tx, topUp: { id: string; sellerId: string; amount: string }): Promise<{ posted: boolean }>`; `refreshReferralUnlock(q: Queryable, referrerId: string): Promise<boolean>`; `getReferralCounts(q, referrerId): Promise<{ successfulReferrals: number; stores: number }>`. Plus a seller notification upsert `referral_commission_earned`, dedupe `referral_commission_earned:<YYYY-MM-DD Cairo>` that increments `data.count` and `data.amount` (piastres-safe string) — `ON CONFLICT (seller_id, dedupe_key) DO UPDATE`.

- [ ] **Step 1:** Integration tests: referred seller Kashier success → one commission of 20 %; same webhook again → still one; unreferred seller → none; failed top-up → none; manual approve path → commission; 10 referred sellers each with a succeeded top-up and 10 stores → `referral_unlocked_at` set.
- [ ] **Step 2:** Implement; call `postReferralCommission(tx, topUp)` inside both transactions (any throw rolls back the top-up — intended).
- [ ] **Step 3:** Run `pnpm --filter @workspace/lib test` (integration with staging-like `TEST_DATABASE_URL` if available) PASS; existing `top-up.integration.test.ts` and `manual-top-up.integration.test.ts` still PASS.

### Task 4: Attribution

**Files:**
- Modify: `packages/lib/src/sellers/ensure-seller-account.ts` (`EnsureSellerAccountInput.referralCode?: string | null`; resolve inside the create transaction; set `referredBySellerId`, `referredAt`), test in `ensure-seller-account.integration.test.ts`
- Modify: `apps/dashboard/proxy.ts`, `apps/ecommerce/proxy.ts` (set cookie when `?ref=` valid and no cookie yet; domain from `REFERRAL_COOKIE_DOMAIN` env, else host-only)
- Modify: both `signup-complete.server.ts` (read cookie or `user_metadata.signup_ref`, pass `referralCode`), both `signup.server.ts` email signup (copy cookie into `user_metadata.signup_ref`), become-seller flow if it calls a seller-creation path with a request context
- Modify: both `.env.example` (`REFERRAL_COOKIE_DOMAIN=.tallaby.com`)

**Interfaces — Consumes:** `normalizeReferralCode`, `REFERRAL_COOKIE`, `REFERRAL_COOKIE_MAX_AGE`.

- [ ] **Step 1:** Integration tests: new seller with valid code → `referred_by_seller_id` set; unknown code → created, null; own code impossible (new user) but referrer's phone equal → null; existing seller called again with a code → unchanged.
- [ ] **Step 2:** Implement (referrer lookup: `sellers.referral_code = code`, `id <> userId`, `support_phone <> phone`).
- [ ] **Step 3:** Unit test for the proxy helper `referralCookieToSet(searchRef, existingCookie): string | null` in `referrals.lib.ts` (first wins). PASS.

### Task 5: Seller page `/earn`

**Files:**
- Create: `apps/dashboard/app/(main)/earn/page.tsx`, `earn.data.tsx`, `earn.client.tsx`, `earn.server.ts` (`"use server"` actions), `earn.dto.ts`
- Modify: `apps/dashboard/components/dashboard/sidebar.config.ts` (+ test), `apps/dashboard/components/layout/dashboard-routes.lib.ts`, `ar.json`/`en.json` (`earn.*`, `sidebar.earn`, three `notifications.seller.referral_*`)
- Lib: in `referrals.server.ts`: `getOrCreateReferralCode(sellerId)`, `getReferralOverview(sellerId): Promise<{ code; earned; paid; available; counts; unlocked; openPayout; referrals: Array<{ storeName; signedUpAt; stores; toppedUp; commission }> }>`, `requestReferralPayout(sellerId, input): Promise<{ success: true } | { success: false; error: WithdrawError }>` (in one transaction: lock seller row `FOR UPDATE`, recompute balance, check `withdrawBlockReason`, insert `requested` with amount = available).

- [ ] **Step 1:** Integration tests for `requestReferralPayout`: locked → error `locked`; unlocked with 499.99 → `below_minimum`; ≥ 500 → row with the whole balance; second call → `open_request`; suspended → `suspended`.
- [ ] **Step 2:** Implement lib + page (cards, link with Copy/WhatsApp/Facebook, two progress bars, referrals table, withdraw dialog, open request status, WhatsApp support link from existing support constant).
- [ ] **Step 3:** Sidebar config test updated; `pnpm --filter dashboard typecheck lint test` PASS.

### Task 6: Admin › Referrals

**Files:**
- Create: `apps/admin/app/(dashboard)/referrals/page.tsx`, `referrals.server.ts`, `referrals-admin.client.tsx`, `[sellerId]/page.tsx`
- Create: `packages/lib/src/admin/referrals-admin.server.ts` (+ export in `admin/server.ts`)
- Modify: `apps/admin/app/(dashboard)/_components/layout/sidebar.config.ts`, `notification-bell.lib.ts` (`referral_payout_requested` text)

**Interfaces — Produces:** `listReferrersForAdmin()`, `listReferralPayoutsForAdmin(status?)`, `getReferrerDetailForAdmin(sellerId)`, `markReferralPayoutPaid(actorId, { payoutId, reference })`, `rejectReferralPayout(actorId, { payoutId, reason })`, `reverseReferralCommissions(actorId, { referredSellerId, reason })` (reverses all earned rows of that seller and sets `referral_excluded_at`), `relockReferrer(actorId, { sellerId, reason })`. Each status-guarded, writes `admin_audit_log` (`action`: `referral_payout_paid`, `referral_payout_rejected`, `referral_commissions_reversed`, `referral_relocked`), and paid/rejected also insert the seller notification. Suspicious flag: referred seller's `support_phone` equals referrer's or another referred seller's.

- [ ] **Step 1:** Integration tests: mark paid twice → second `already_reviewed`; reject → balance back; reverse → commissions reversed + excluded + counts drop.
- [ ] **Step 2:** Implement lib, actions (`adminActorId("canManageFinance")` or the closest existing permission), pages.
- [ ] **Step 3:** `pnpm --filter admin typecheck lint` PASS.

### Task 7: Docs + verification

- [ ] `ROADMAP.md`: F-37 status, §6 checklist (a–f done or in progress), §7 log (0117). `PLAN.md` §13 (payout added), §23 log + manual E2E. `CLAUDE.md` rule 6: next migration `0118`, `0117` status. `docs/wallet.md`: separate ledger note.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`: all PASS (report any pre-existing failures from other sessions' work separately).
