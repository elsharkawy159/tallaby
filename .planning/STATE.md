# State — Tallaby Digital Products Milestone

## Project Reference

**Core value**: Sellers can upload digital products, buyers can purchase them with Stripe, and files are delivered instantly and securely via signed download links.

**Milestone**: Digital Products
**Roadmap**: `.planning/ROADMAP.md`
**Requirements**: `.planning/REQUIREMENTS.md`

---

## Current Position

**Current phase**: Not started
**Current plan**: -
**Status**: Roadmap created, awaiting phase 1 planning

### Progress Bar

```
Phase 1 [          ] 0%
Phase 2 [          ] 0%
Phase 3 [          ] 0%
Phase 4 [          ] 0%
Phase 5 [          ] 0%
Phase 6 [          ] 0%
Phase 7 [          ] 0%
```

**Overall**: 0 / 7 phases complete

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Phases defined | 7 |
| Requirements mapped | 47 / 47 |
| Phases complete | 0 |
| Plans generated | 0 |

---

## Accumulated Context

### Key Decisions (Locked)

| Decision | Rationale |
|----------|-----------|
| Webhook handler in Hono backend (`apps/backend`) | Stripe `constructEvent` needs raw body; Next.js App Router auto-parses request bodies |
| Order created as `pending` at Checkout Session creation, confirmed via webhook | Prevents order-before-payment bug; fixes existing tech debt in `createOrder` |
| Single Checkout Session, platform collects, transfers to sellers via webhook | MVP simplicity; avoids multi-session complexity for mixed carts |
| Digital product server actions in new colocated feature files | `dashboard/actions/products.ts` is already 1,687 lines; must not grow further |
| `productType` column default = `'physical'` | Migration safety: existing product rows must not break |
| Signed download URLs generated fresh on each request, never stored | Intentional expiry; raw Storage URLs must never be exposed |
| Webhook `checkout.session.completed` handler wrapped in a single DB transaction | Order update + token generation + wallet credit must be atomic |

### Architecture Constraints

- Schema single source of truth: `packages/db/src/drizzle/schema.ts`
- Relations file: `packages/db/src/drizzle/relations.ts`
- Migrations output: `packages/db/migrations/`
- All DB access in Next.js apps via `"use server"` actions; no REST calls from Next.js to Hono
- Hono backend (`apps/backend`) handles: webhook events, email dispatch
- Colocated feature pattern (admin + dashboard): `[feature].server.ts` / `.data.tsx` / `.client.tsx` / `.skeleton.tsx` / `.types.ts` / `.dto.ts`
- i18n applies to: `apps/ecommerce` and `apps/dashboard` (en.json + ar.json); `apps/admin` has no i18n

### Tech Debt to Avoid Touching

- Do NOT fix inventory deduction (commented out in `apps/ecommerce/actions/order.ts`) — separate milestone
- Do NOT fix admin role security (middleware, registration) — separate security phase
- Do NOT add to `apps/dashboard/actions/products.ts` — use new colocated files
- Do NOT wire seller analytics dashboard charts to real data — future milestone

### Known Risks

- Webhook idempotency: `checkout.session.completed` may fire more than once; handler must be idempotent (check if order is already `paid` before processing)
- Supabase Storage signed URL generation is server-side only; any client-side exposure is a bug
- Drizzle migration must set `productType` default before touching existing `products` rows

---

## Session Continuity

**Last updated**: 2026-05-14
**Last action**: Roadmap created

### Resume Instructions

1. Run `/gsd-plan-phase 1` to generate the execution plan for Phase 1: Schema & Migrations
2. All phase goals and success criteria are in `.planning/ROADMAP.md`
3. All requirements with IDs are in `.planning/REQUIREMENTS.md`

---

*State initialized: 2026-05-14*
