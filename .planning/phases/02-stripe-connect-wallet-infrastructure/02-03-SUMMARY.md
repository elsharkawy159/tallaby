---
phase: 02-stripe-connect-wallet-infrastructure
plan: "03"
subsystem: backend/stripe
tags: [stripe-connect, onboarding, security, gap-closure]
dependency_graph:
  requires: ["02-02"]
  provides: ["charges_enabled gate on /connect/return"]
  affects: ["apps/backend/src/routes/stripe.ts"]
tech_stack:
  added: []
  patterns: ["Stripe accounts.retrieve() for server-side account state verification"]
key_files:
  modified:
    - apps/backend/src/routes/stripe.ts
decisions:
  - charges_enabled retrieved from Stripe API server-side; cannot be spoofed by seller
  - Incomplete onboarding redirects to step=3&stripe=incomplete to allow seller to resume
  - Already-onboarded sellers bypass the retrieve call via idempotency guard (no extra API call)
metrics:
  duration: "10 minutes"
  completed: "2026-05-14"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 02 Plan 03: charges_enabled Gate on /connect/return Summary

Gate `/connect/return` on `charges_enabled` before writing onboarding state — prevents partial Stripe Express account setup from falsely advancing seller status.

## What Was Done

Closed verification gap CR-03 (SC-2 PARTIAL). Inserted `stripe.accounts.retrieve()` + `charges_enabled` check into the `/connect/return` handler between the idempotency guard and the DB transaction. If `charges_enabled` is false, the handler now redirects to `/onboarding?step=3&stripe=incomplete` without touching the database.

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Gate /connect/return on charges_enabled | c0e6540 | apps/backend/src/routes/stripe.ts |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

All acceptance criteria confirmed:
- `stripe.accounts.retrieve(seller.stripeAccountId)` present (line 72)
- `charges_enabled` checked (line 73)
- `stripe=incomplete` redirect present (line 75)
- Idempotency guard (`stripeOnboardingComplete`) still appears before the retrieve call (line 66)
- `db.transaction(` still appears after the `charges_enabled` check (line 79)

TypeScript check: pre-existing schema errors in packages/db (unrelated to this change); the stripe.ts change is type-correct per Stripe SDK typings (`Stripe.Account.charges_enabled: boolean`).

## Known Stubs

None.

## Threat Flags

No new threat surface introduced. The `charges_enabled` value is retrieved from the Stripe API using the server-side secret key — it cannot be supplied or manipulated by the seller. This closes T-02-09 (Elevation of Privilege — premature onboarding completion).

## Self-Check: PASSED

- [x] apps/backend/src/routes/stripe.ts modified with charges_enabled gate
- [x] Commit c0e6540 exists
- [x] VERIFICATION.md updated: status changed to verified, score 5/5, truth #2 changed to VERIFIED
