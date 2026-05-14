---
phase: 01-schema-migrations
plan: "01"
subsystem: db-schema
tags: [schema, drizzle, postgres, enum, digital-products, sellers, onboarding]
dependency_graph:
  requires: []
  provides: [productType-enum, products.productType, sellers-onboarding-columns]
  affects: [packages/db/src/drizzle/schema.ts]
tech_stack:
  added: []
  patterns: [pgEnum, drizzle-orm column definitions]
key_files:
  modified:
    - packages/db/src/drizzle/schema.ts
decisions:
  - "productType default set to 'physical' for migration safety — existing rows will not break"
  - "7 onboarding columns inserted after stripeAccountId; no D-01/D-02 columns added"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  files_modified: 1
requirements_satisfied: [DB-03, DB-04]
---

# Phase 1 Plan 1: Schema — productType Enum + Sellers Onboarding Columns Summary

**One-liner:** Added `productType` pgEnum (`physical`|`digital`) to schema.ts and 7 new sellers onboarding/Stripe columns, all with safe defaults, as the enum+column foundation for the digital-products milestone.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add productType pgEnum and products.productType column | d04b8bd | packages/db/src/drizzle/schema.ts |
| 2 | Add 7 new onboarding columns to sellers table | d04b8bd | packages/db/src/drizzle/schema.ts |

## What Was Built

### Task 1 — productType pgEnum + products column
- Exported `productType = pgEnum("product_type", ['physical', 'digital'])` in the enum block (after `userRole`)
- Added `productType: productType("product_type").default('physical')` to the `products` table, before the closing constraints array
- Default `'physical'` ensures existing rows are not broken when the migration runs (T-01-01 mitigated)

### Task 2 — Sellers onboarding columns
Added exactly 7 columns after `stripeAccountId` in the `sellers` table:

| Column | Type | Default |
|--------|------|---------|
| stripeOnboardingComplete | boolean | false |
| payoutEnabled | boolean | false |
| identityVerified | boolean | false |
| identityDocsUrl | text | null |
| onboardingStep | integer | 0 |
| onboardingComplete | boolean | false |
| storeDescription | text | null |

No forbidden columns (storeSlug, storeBannerUrl, storeLogoUrl) were added. `stripeAccountId` remains exactly once.

## Verification

- All 3 automated checks for Task 1 passed (pgEnum export, values, column with default)
- All 7 column presence checks for Task 2 passed
- `stripeAccountId` count = 1 (no duplicate)
- Forbidden columns = 0
- TypeScript errors in `packages/db` are all pre-existing (missing `drizzle-orm` in node_modules, pre-existing `any` parameter warnings in tsconfig) — none introduced by this plan

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Coverage

| Threat ID | Status |
|-----------|--------|
| T-01-01 (products.productType default) | Mitigated — `.default('physical')` applied |
| T-01-02 (identityDocsUrl disclosure) | Accepted — nullable text, application-layer security deferred to Phase 5/6 |

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or trust-boundary schema changes beyond the planned columns.

## Self-Check: PASSED

- `packages/db/src/drizzle/schema.ts` modified: confirmed
- Commit d04b8bd exists: confirmed
- `export const productType = pgEnum` present: confirmed
- All 7 sellers columns present: confirmed
