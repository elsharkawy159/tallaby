# Phase 1: Schema & Migrations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 1-Schema & Migrations
**Areas discussed:** sellers table collisions, walletBalance vs sellerWallet, downloadToken indexing, DB-10 orders.status check

---

## sellers table collisions

### Question 1 — storeSlug vs. existing slug

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse existing slug | Skip adding storeSlug — the existing slug column IS the store slug | ✓ |
| Add storeSlug as a new column | Keep slug as-is and add a separate storeSlug column (nullable migration) | |
| You decide | Claude picks the safest approach | |

**User's choice:** Reuse existing slug (recommended)
**Notes:** Avoids column duplication and a migration hazard.

### Question 2 — storeLogoUrl / storeBannerUrl vs. existing logoUrl / bannerUrl

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse existing logoUrl & bannerUrl | Skip adding new columns — same fields | ✓ |
| Add new storeLogoUrl / storeBannerUrl columns | Keep old fields, add new ones (existing rows get null) | |
| You decide | Claude picks | |

**User's choice:** Reuse existing logoUrl & bannerUrl (recommended)

### Question 3 — stripeAccountId handling

| Option | Description | Selected |
|--------|-------------|----------|
| Keep existing stripeAccountId, add new columns only | Only add: stripeOnboardingComplete, payoutEnabled, identityVerified, identityDocsUrl, onboardingStep, onboardingComplete, storeDescription | ✓ |
| You decide | Claude picks the cleanest approach | |

**User's choice:** Keep existing stripeAccountId, add the new columns only (recommended)

---

## walletBalance vs sellerWallet

### Question 1 — Coexistence strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Keep both — sellerWallet is authoritative | sellerWallet.balance is source of truth; sellers.walletBalance is a denormalized cache | ✓ |
| Ignore sellers.walletBalance going forward | Add sellerWallet table but let walletBalance go stale | |
| Drop sellers.walletBalance in this migration | Remove the column, use only the new table | |

**User's choice:** Keep both — sellerWallet is authoritative (recommended)

### Question 2 — Balance semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Available balance only | balance = amount ready to withdraw (settled, after platform fee) | ✓ |
| Total lifetime balance | Running total of all credits; eligibility computed at query time | |
| You decide | Claude picks the standard approach | |

**User's choice:** Available balance only (recommended)

---

## downloadToken indexing

### Question 1 — Unique index

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — unique index | Fast O(log n) lookups; unique constraint prevents token collisions | ✓ |
| No index, just a column | Index can be added later | |
| You decide | Claude picks | |

**User's choice:** Yes — unique index (recommended)

---

## DB-10 orders.status check

### Question 1 — No-op confirmation

| Option | Description | Selected |
|--------|-------------|----------|
| Treat as verified — no migration needed | orders.status already uses orderStatus enum with 'pending' | ✓ |
| Add a Stripe-specific status value | Add 'awaiting_payment' or 'stripe_pending' to the enum | |
| You decide | Claude decides based on webhook phase needs | |

**User's choice:** Treat as verified — no migration needed (recommended)
**Notes:** DB-10 is already satisfied by the existing schema.

---

## Claude's Discretion

None — all decisions were made by the user.

## Deferred Ideas

None — discussion stayed within phase scope.
