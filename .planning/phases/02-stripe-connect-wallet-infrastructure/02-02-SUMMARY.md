---
plan: 02-02
phase: 02-stripe-connect-wallet-infrastructure
status: complete
completed: 2026-05-14
subsystem: backend/stripe
tags: [stripe-connect, hono, routes, wallet, auth-middleware]
dependency_graph:
  requires: [02-01]
  provides: [stripe-connect-routes]
  affects: [apps/backend/src/api/index.ts]
tech_stack:
  added: []
  patterns: [hono-route-file, db-transaction, idempotency-guard]
key_files:
  created:
    - apps/backend/src/routes/stripe.ts
  modified:
    - apps/backend/src/api/index.ts
decisions:
  - Auth exclusion uses path.startsWith("/stripe/connect/") without /api prefix (Hono strips basePath)
  - currency explicitly "usd" in sellerWallet insert (schema default is EGP)
  - Idempotency guard checks stripeOnboardingComplete before DB transaction to prevent unique constraint violation on repeated /connect/return calls
metrics:
  duration: ~10min
  tasks_completed: 2
  files_modified: 2
---

# Phase 02 Plan 02: Stripe Connect Route Handlers Summary

## What Was Built

Three Hono GET route handlers for the Stripe Connect onboarding flow (`/connect/onboard`, `/connect/return`, `/connect/refresh`) in `apps/backend/src/routes/stripe.ts`, plus auth middleware exclusion and route registration in `apps/backend/src/api/index.ts`. Delivers STC-01 through STC-04 end-to-end: sellerId in, Stripe Express account created, sellerWallet row initialised with `currency: "usd"`, seller redirected.

## Tasks Completed

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| Task 1: Create Stripe Connect route handlers | Complete | 2bde744 | stripe.ts with all 3 handlers, idempotency guard, db.transaction |
| Task 2: Register routes and patch auth middleware | Complete | e09e949 | import, auth exclusion, app.route |

## Key Files

- `apps/backend/src/routes/stripe.ts` — Three handlers: onboard (creates Express account + returns URL), return (idempotency guard + db.transaction + wallet insert), refresh (new account link)
- `apps/backend/src/api/index.ts` — stripeRoutes import, `/stripe/connect/` auth exclusion, `app.route("/stripe", stripeRoutes)`

## Deviations from Plan

None - plan executed exactly as written.

## Threat Model Coverage

| Threat | Mitigation Applied |
|--------|-------------------|
| T-02-03: Spoofing via sellerId | DB lookup validates seller exists before creating Stripe account |
| T-02-04: Spoofing via seller param on return | DB lookup validates seller + stripeAccountId before any writes |
| T-02-05: Elevation via public connect routes | Accepted — wallet insert gated on full Stripe onboarding flow |

## Known Stubs

None - all handlers wire to real Stripe API and real DB.

## Threat Flags

None - no new network endpoints beyond the three planned /stripe/connect/* routes.

## Self-Check: PASSED

- apps/backend/src/routes/stripe.ts: FOUND
- apps/backend/src/api/index.ts contains stripeRoutes import: FOUND
- apps/backend/src/api/index.ts contains path.startsWith("/stripe/connect/"): FOUND
- apps/backend/src/api/index.ts contains app.route("/stripe", stripeRoutes): FOUND
- Commit 2bde744: FOUND
- Commit e09e949: FOUND
- tsc --noEmit (main repo install): exit 0
