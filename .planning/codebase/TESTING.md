# Testing Patterns

**Analysis Date:** 2026-05-14

## Test Framework

**Runner:** None installed

No test framework (Jest, Vitest, Playwright, Cypress, etc.) is present in any `package.json` across the monorepo. There are no test configuration files (`jest.config.*`, `vitest.config.*`, `playwright.config.*`) anywhere in the project.

**Run Commands:**
```bash
# No test commands defined — no test runner installed
pnpm lint       # Only quality check available
pnpm typecheck  # Type-checking via tsc --noEmit (ecommerce app only)
```

## Test File Organization

**Location:** None — no test files exist in the project source.

A search across `apps/` and `packages/` found zero `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files. All spec files discovered belong to `node_modules` dependencies only.

## Test Structure

**Suite Organization:** Not established.

**Patterns:** Not established.

## Mocking

**Framework:** None configured.

**Patterns:** Not established.

## Fixtures and Factories

**Test Data:** Not established.

**Location:** No `__fixtures__`, `__mocks__`, or `factories/` directories exist.

## Coverage

**Requirements:** None enforced — no coverage tooling configured.

**Coverage Command:** Not available.

## Test Types

**Unit Tests:** Not present.

**Integration Tests:** Not present.

**E2E Tests:** Not present.

## Current Quality Enforcement

The only automated quality gates in place are:

**TypeScript type checking:**
- `pnpm typecheck` runs `tsc --noEmit` in the ecommerce app
- Strict mode enabled (`"strict": true`) in `packages/typescript-config/base.json`
- `noUncheckedIndexedAccess: true` adds runtime safety at the type level

**ESLint linting:**
- `pnpm lint` runs ESLint across all workspaces via Turborepo
- Configured in `packages/eslint-config/` (base, next.js, react-internal configs)
- All violations are warnings (via `eslint-plugin-only-warn`) — not hard failures

**Manual verification only** for behavior correctness — no automated test suite exists.

## Recommended Starting Point

When adding tests, the following setup is suggested based on the existing stack:

**Framework choice:** Vitest (compatible with the ESM-first, TypeScript-strict setup)

**Install in relevant packages:**
```bash
pnpm add -D vitest @vitest/coverage-v8 -w
```

**Config file location:** `vitest.config.ts` at repo root or per-package

**High-priority test targets (no tests currently):**
- `apps/ecommerce/actions/cart.ts` — complex business logic, price resolution, race condition handling
- `apps/ecommerce/actions/checkout.ts` — order calculation, coupon validation
- `apps/ecommerce/lib/utils.ts` — `resolvePrice`, `resolvePrimaryImage` utility functions
- `apps/ecommerce/lib/coupon-utils.ts` — coupon validation logic
- `packages/lib/src/` — shared utility functions used across all apps

**Naming convention to adopt:**
- Co-located test files: `[filename].test.ts` / `[filename].test.tsx`
- Or grouped: `__tests__/[filename].test.ts`

---

*Testing analysis: 2026-05-14*
