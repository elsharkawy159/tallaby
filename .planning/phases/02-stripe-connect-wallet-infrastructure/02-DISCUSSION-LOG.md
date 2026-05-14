# Phase 2: Stripe Connect & Wallet Infrastructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 2-stripe-connect-wallet-infrastructure
**Areas discussed:** Stripe client setup, Return URL destination, Wallet row creation

---

## Stripe Client Setup

| Option | Description | Selected |
|--------|-------------|----------|
| @workspace/lib (Recommended) | Shared package — consistent with how @workspace/db is shared. All apps import from one place. Single source for STRIPE_SECRET_KEY env var. | ✓ |
| Per-app (backend only) | Initialize Stripe only in apps/backend since that's where all Stripe server logic lives. | |
| You decide | Capture Claude's choice in context | |

**User's choice:** @workspace/lib (Recommended)
**Notes:** Consistent with the @workspace/db singleton pattern already established.

---

## Return URL Destination

### return_url

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard onboarding wizard | Return to apps/dashboard onboarding step 4 (/onboarding?step=4&stripe=success). Seller never leaves the wizard flow. | ✓ |
| Dedicated callback page | A standalone /stripe/connect/complete page in apps/dashboard. | |
| You decide | Capture Claude's choice | |

**User's choice:** Dashboard onboarding wizard
**Notes:** No standalone pages needed — query params on the wizard URL carry the state.

### refresh_url

| Option | Description | Selected |
|--------|-------------|----------|
| Same — back to wizard step 3 | refresh_url returns to step 3 (payout setup) so seller can retry Connect. | ✓ |
| Separate retry page | A dedicated /stripe/connect/retry page. | |

**User's choice:** Same — back to wizard step 3
**Notes:** Both return_url and refresh_url use the same wizard with different step/param values.

---

## Wallet Row Creation

| Option | Description | Selected |
|--------|-------------|----------|
| On Connect complete (Recommended) | Create wallet row when stripeOnboardingComplete = true is set in /connect/return handler. | ✓ |
| On seller registration | Create wallet row when seller account is first created. | |
| Lazily on first transaction | Create wallet row on first sale webhook. | |

**User's choice:** On Connect complete (Recommended)
**Notes:** Initial balance 0.00 confirmed. Wallet row atomic with stripeOnboardingComplete flag in same DB transaction.

---

## Claude's Discretion

- **Connect route location:** Hono backend with `internalApiAuth` patched to exclude `/api/stripe/connect/*`. Not discussed by user — decided by Claude based on PROJECT.md architectural decision (Stripe logic in Hono) and existing middleware exclusion pattern.
- **Stripe account capabilities:** `card_payments` and `transfers` — standard marketplace setup.
- **Error handling on /connect/return failure:** 400 + log, no wallet row created.

## Deferred Ideas

None.
