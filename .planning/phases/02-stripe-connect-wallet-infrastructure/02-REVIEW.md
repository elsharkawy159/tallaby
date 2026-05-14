---
phase: 02-stripe-connect-wallet-infrastructure
reviewed: 2026-05-14T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - packages/lib/src/stripe.ts
  - packages/lib/index.ts
  - apps/backend/src/routes/stripe.ts
  - apps/backend/src/api/index.ts
  - apps/backend/.env.example
findings:
  critical: 4
  warning: 4
  info: 2
  total: 10
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-14T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

This phase implements Stripe Connect onboarding and seller wallet creation. The core flow is structurally sound but has four critical defects: unauthenticated access to /connect/onboard enabling account takeover on any sellerId; a race condition in wallet creation; missing Stripe account verification on return; and URL injection via unsanitized sellerId concatenation. Four warnings cover missing DASHBOARD_URL startup validation, a currency mismatch, silent overwrite of existing Stripe accounts, and HTTP 400 returned for server errors.

---

## Critical Issues

### CR-01: Unauthenticated /connect/onboard allows account takeover on any sellerId

**File:** `apps/backend/src/routes/stripe.ts:7`

**Issue:** The /stripe/connect/onboard route is exempted from internalApiAuth in apps/backend/src/api/index.ts line 21 via path.startsWith("/stripe/connect/"), which covers ALL /stripe/connect/* routes including /onboard. Any unauthenticated caller can pass an arbitrary sellerId, causing the backend to create a new Stripe Express account and overwrite sellers.stripeAccountId, destroying the existing Stripe account and its payout history.

**Fix:** Narrow the exemption to only redirect-facing endpoints:
```typescript
if (path === "/" || path === "/stripe/connect/return" || path === "/stripe/connect/refresh") {
  return next();
}
```
The /onboard endpoint must require authentication proving the caller owns the sellerId.

---

### CR-02: Race condition in /connect/return produces broken seller state

**File:** `apps/backend/src/routes/stripe.ts:66-82`

**Issue:** The stripeOnboardingComplete guard at line 66 is read outside the transaction at line 72. Two concurrent return redirects both pass the guard before either commits. Both enter the transaction; the second sellerWallet insert violates the unique index on seller_id and throws, returning a 400 and leaving the seller with stripeOnboardingComplete: true but no wallet.

**Fix:** Enforce idempotency at the DB level:
```typescript
await tx.insert(sellerWallet)
  .values({ sellerId, balance: "0.00", currency: "usd" })
  .onConflictDoNothing();
```

---

### CR-03: Return URL trusted without verifying Stripe account is active

**File:** `apps/backend/src/routes/stripe.ts:49`

**Issue:** Stripe documents that return_url fires when the user leaves the onboarding UI regardless of completion -- the account may still lack charges_enabled. The handler marks stripeOnboardingComplete: true and creates the wallet unconditionally. Any party knowing a valid sellerId can navigate directly to /stripe/connect/return?seller=<id> to gain a wallet and complete status without ever finishing Stripe onboarding.

**Fix:** Retrieve the account and gate on charges_enabled:
```typescript
const account = await stripe.accounts.retrieve(seller.stripeAccountId);
if (!account.charges_enabled) {
  return c.redirect(DASHBOARD_URL + "/onboarding?step=3&stripe=incomplete");
}
```

---

### CR-04: URL injection via unsanitized sellerId string concatenation

**File:** `apps/backend/src/routes/stripe.ts:32-35, 67-68, 84, 111-116`

**Issue:** sellerId is taken from a query parameter and concatenated into Stripe accountLinks.create URLs and c.redirect() targets without validation or encoding. A crafted sellerId containing & or # can manipulate query strings. When DASHBOARD_URL is unset the literal string "undefined" is prepended to all URLs, causing Stripe to reject account link creation with a 400 that surfaces as an opaque 500.

**Fix:**
1. Validate sellerId is a UUID before any use:
```typescript
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!sellerId || !UUID_RE.test(sellerId)) return c.json({ error: "Invalid sellerId" }, 400);
```
2. Use encodeURIComponent(sellerId) when building URL strings.
3. Validate DASHBOARD_URL at startup (see WR-01).

---

## Warnings

### WR-01: DASHBOARD_URL never validated at startup

**File:** `apps/backend/src/routes/stripe.ts:14, 56, 98`

**Issue:** DASHBOARD_URL is read inside each handler but never checked for existence. When unset all Stripe account link URLs and redirects embed the literal string "undefined", causing Stripe to return 400 errors surfacing as confusing 500s. STRIPE_SECRET_KEY correctly throws at module load; DASHBOARD_URL must follow the same pattern.

**Fix:**
```typescript
if (!process.env.DASHBOARD_URL) throw new Error("DASHBOARD_URL is not set");
export const DASHBOARD_URL = process.env.DASHBOARD_URL;
```

---

### WR-02: Currency mismatch -- code hardcodes usd, schema default is EGP

**File:** `apps/backend/src/routes/stripe.ts:79`

**Issue:** The wallet insert hardcodes currency: "usd" while the sellerWallet schema (packages/db/src/drizzle/schema.ts line 1226) declares default("EGP"). If the platform operates in EGP, Stripe Connect payouts denominated in USD will fail or incur unexpected conversion errors.

**Fix:** Align code and schema on a single currency. Define it as a named constant rather than magic strings in two places that contradict each other.

---

### WR-03: Existing stripeAccountId silently overwritten on repeat onboarding

**File:** `apps/backend/src/routes/stripe.ts:16-27`

**Issue:** /connect/onboard unconditionally creates a new Stripe Express account and overwrites sellers.stripeAccountId without checking for an existing one. A seller who navigates to onboard twice creates an orphaned Stripe account and loses prior verification progress.

**Fix:** Fetch the seller record first and reuse an existing stripeAccountId:
```typescript
const seller = await db.query.sellers.findFirst({ where: eq(sellers.id, sellerId) });
const accountId = seller?.stripeAccountId
  ?? (await stripe.accounts.create({ type: "express", capabilities: { card_payments: { requested: true }, transfers: { requested: true } } })).id;
if (!seller?.stripeAccountId) {
  await db.update(sellers).set({ stripeAccountId: accountId }).where(eq(sellers.id, sellerId));
}
```

---

### WR-04: /connect/return catch block returns 400 for server-side failures

**File:** `apps/backend/src/routes/stripe.ts:86`

**Issue:** The catch block returns HTTP 400 for all errors including DB transaction failures and Stripe API errors. These are server-side faults that must return 500. Returning 400 incorrectly signals the request was malformed and suppresses retries.

**Fix:**
```typescript
return c.json({ error: "Failed to process onboarding return" }, 500);
```

---

## Info

### IN-01: console.error exposes full error objects including stack traces in production

**File:** `apps/backend/src/routes/stripe.ts:44, 86, 124`

**Issue:** All three catch blocks log the raw error object to console.error, exposing stack traces and internal path names in production log aggregators.

**Fix:** Use a structured logger, or log only the error message string in non-development environments.

---

### IN-02: INTERNAL_API_SECRET missing from .env.example

**File:** `apps/backend/.env.example`

**Issue:** The internalApiAuth middleware requires INTERNAL_API_SECRET but this variable is absent from .env.example. A developer bootstrapping from the example file receives opaque 500 errors on all protected routes with no indication of the cause.

**Fix:** Add to .env.example:
```
INTERNAL_API_SECRET=REPLACE_WITH_A_RANDOM_SECRET
```

---

_Reviewed: 2026-05-14T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
