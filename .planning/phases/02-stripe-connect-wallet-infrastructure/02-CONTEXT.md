# Phase 2: Stripe Connect & Wallet Infrastructure - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

## Phase Boundary

Implement the Stripe Connect OAuth flow as Hono backend routes — creating Express accounts, handling Stripe's return/refresh redirects, and initializing the seller wallet row on onboarding completion. No seller-facing UI in this phase (that's Phase 6). No webhook handling in this phase (that's Phase 5). This phase delivers working backend routes that the onboarding wizard (Phase 6) will call.

## Implementation Decisions

### Connect Route Location
- **D-01:** All Stripe Connect routes (`/api/stripe/connect/onboard`, `/api/stripe/connect/return`, `/api/stripe/connect/refresh`) go in `apps/backend` Hono app — consistent with the project-level architectural decision to put all Stripe server logic in Hono (raw body, clean middleware control, see PROJECT.md Architectural Decisions).
- **D-02:** The `internalApiAuth` middleware must be patched to **exclude** `/api/stripe/connect/*` from auth. These are public OAuth redirect endpoints — Stripe calls them directly. Pattern: same as the existing `/api/` root exclusion (path check in `index.ts`).

### Stripe Client Setup
- **D-03:** Initialize the Stripe client as a singleton in `@workspace/lib` — consistent with how `@workspace/db` is shared. Export as `stripe` from `packages/lib/src/stripe.ts`. All apps import from `@workspace/lib`.
- **D-04:** `STRIPE_SECRET_KEY` env var lives in `apps/backend/.env`. The singleton reads from `process.env.STRIPE_SECRET_KEY`.

### Return & Refresh URL Destinations
- **D-05:** `return_url` → `apps/dashboard` onboarding wizard at `/onboarding?step=4&stripe=success`. Seller lands on step 4 (Identity verification) after Connect.
- **D-06:** `refresh_url` → `/onboarding?step=3&stripe=retry`. Seller lands back on step 3 (Payout setup) to retry.

### Wallet Row Initialization
- **D-07:** Create the `sellerWallet` row inside the `/api/stripe/connect/return` handler, immediately after setting `stripeOnboardingComplete = true`. Both writes in a single DB transaction.
- **D-08:** Initial wallet state: `balance = 0.00`, `currency = 'usd'`. Sellers without completed Connect have no wallet row — intentional.

### Claude's Discretion
- Connect account type: Express (locked in PROJECT.md).
- Stripe account capabilities: `card_payments` and `transfers` — standard for marketplace sellers.
- Error handling on `/connect/return` if account lookup fails: return 400, log, do not create wallet row.

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Decisions
- `.planning/PROJECT.md` — Architectural decisions: Stripe logic in Hono, single Checkout Session model
- `.planning/REQUIREMENTS.md` — STC-01 through STC-05 (this phase's requirements)

### Existing Backend
- `apps/backend/src/api/index.ts` — Hono entry point; add Stripe route registration and middleware exclusion here
- `apps/backend/src/lib/middleware.ts` — `internalApiAuth` — add `/stripe/connect/*` path exclusion
- `apps/backend/src/routes/emails.ts` — Reference route file implementation

### Shared Packages
- `packages/lib/` — New Stripe singleton goes here (`packages/lib/src/stripe.ts`)
- `packages/db/src/drizzle/schema.ts` — `sellers` table fields + `sellerWallet` table (Phase 1 complete)

## Existing Code Insights

### Reusable Assets
- `apps/backend/src/lib/sender.ts` — Pattern for a backend lib utility
- `apps/backend/src/routes/emails.ts` — Hono route file pattern to follow
- `packages/db/src/drizzle/database.ts` — Singleton pattern to mirror for Stripe client

### Established Patterns
- Middleware exclusion: root `/api/` excluded via path check in `index.ts` — extend for `/api/stripe/connect/*`
- DB import: `import { db, sellers, eq } from "@workspace/db"` — Stripe follows same: `import { stripe } from "@workspace/lib"`
- Server action return shape: `{ success: boolean, data?: T, error?: string }`

### Integration Points
- `apps/backend/src/api/index.ts` → new `app.route("/stripe", stripe)` registration
- `packages/lib/package.json` → export the new `stripe.ts` module
- `packages/db` → `sellers` and `sellerWallet` tables already defined (Phase 1)

## Specific Ideas

- Both `return_url` and `refresh_url` target the dashboard onboarding wizard with query params — no standalone pages needed
- Wallet initialized atomically with `stripeOnboardingComplete = true` in same DB transaction

## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 2-Stripe Connect & Wallet Infrastructure*
*Context gathered: 2026-05-14*
