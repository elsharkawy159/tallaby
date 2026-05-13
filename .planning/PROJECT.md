# Tallaby — Digital Products Milestone

## What This Is

Tallaby is a multi-vendor digital marketplace platform. This milestone adds a complete Digital Products system to the existing physical-product Turborepo monorepo — covering digital file delivery, Stripe payments with Connect marketplace splits, a vendor onboarding wizard, and a seller wallet/ledger — all without disrupting the existing physical product flows.

## Core Value

Sellers can upload digital products, buyers can purchase them with Stripe, and files are delivered instantly and securely via signed download links.

## Context

**Existing platform (brownfield):**
- Turborepo monorepo: `apps/ecommerce` (Next.js storefront), `apps/admin` (Next.js admin), `apps/dashboard` (Next.js seller app), `apps/backend` (Hono on Vercel)
- Shared packages: `@workspace/db` (Drizzle ORM + Supabase PostgreSQL), `@workspace/ui` (shadcn/ui), `@workspace/lib`, `@workspace/emails`
- Auth: Supabase Auth (roles: customer, seller, creator, admin)
- Payments: Stripe npm package installed, NOT yet integrated
- File storage: Supabase Storage (used for product images)
- All DB mutations via `"use server"` actions — no REST API from Next.js apps
- Schema single source of truth: `packages/db/src/drizzle/schema.ts`
- Admin uses colocated feature pattern: `[feature].server.ts / .data.tsx / .client.tsx / .skeleton.tsx / .types.ts / .dto.ts`
- i18n: ecommerce + dashboard use next-intl (`en.json`, `ar.json`)

**Existing tech debt relevant to this milestone:**
- No DB transactions in `createOrder` — Stripe integration must fix this (order created as `pending` at session creation, confirmed via webhook in a transaction)
- Dashboard `actions/products.ts` is 1,687 lines — digital product actions must NOT be added there; use new colocated feature files
- Inventory deduction is commented out — leave alone for this milestone

## What We're Building (4 Feature Areas)

### 1. Digital Products System (core)
- New DB tables: `digitalProducts`, `digitalOrders`
- `productType` enum added to `products` table (`physical` | `digital`)
- Private Supabase Storage bucket `digital-products`
- Download delivery: token → validate → signed URL redirect
- Never expose raw Supabase Storage URLs

### 2. Dashboard: Add/Edit Product Flow (digital + physical)
- Product type selector in create/edit form
- Digital: react-dropzone file upload → private Supabase bucket → `digitalProducts` record
- Physical: existing fields (weight, dimensions, shipping)
- Shared fields: title, description, price, images, SEO, category, brand
- Follow dashboard colocated feature pattern (new files, not added to `products.ts`)

### 3. Vendor/Store Onboarding Flow
- 5-step wizard in `apps/dashboard`: store profile → categories → payout (Stripe Connect) → identity verification → review & launch
- Each step saves independently
- Admin approval flow in `apps/admin` sellers list
- Welcome email via Hono backend on approval
- New `sellers` table fields + `sellerCategories` join table

### 4. Stripe Integration: Payments + Vendor Wallet
- **Stripe Connect** (Express accounts): seller connects during onboarding
- **Stripe Checkout Sessions**: replace existing checkout (no PaymentIntent approach for MVP)
  - Mixed cart with multiple sellers → one Checkout Session per seller group, OR single session with post-payment transfers (decision: single session with platform as payee + transfers via webhook for MVP simplicity)
- **Stripe Webhooks**: in `apps/backend` Hono app (raw body required for `constructEvent` — Next.js auto-parses bodies)
- **Seller Wallet**: balance ledger + transaction history + withdrawal request

## Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Webhooks in Hono backend (not Next.js api route) | Stripe `constructEvent` needs raw body; Hono handles this cleanly; Next.js App Router auto-parses |
| Order created as `pending` at checkout, confirmed via webhook | Fixes existing anti-pattern of order-before-payment; prevents partial state |
| Single Checkout Session, platform collects, transfers to sellers via webhook | Simplest for MVP mixed carts; avoids multiple sessions complexity |
| Digital product actions in new colocated feature files | dashboard/actions/products.ts is already 1,687 lines |
| `productType` default = `'physical'` for migration safety | Existing products must not break |
| Signed URLs generated fresh on each download request | Never cache or store signed URLs; expiry is intentional |

## Requirements

### Validated

- ✓ Multi-vendor architecture — existing
- ✓ Supabase Auth with seller/customer roles — existing
- ✓ Physical product creation + management — existing
- ✓ Supabase Storage for file uploads — existing
- ✓ react-dropzone installed — existing
- ✓ nanoid installed — existing
- ✓ slugify installed — existing
- ✓ TanStack Table installed — existing
- ✓ react-hook-form + zod installed — existing

### Active

- [ ] Digital product schema (tables + enum migration)
- [ ] Private Supabase Storage bucket for digital files
- [ ] Digital product upload in seller dashboard
- [ ] Digital product edit in seller dashboard
- [ ] Secure download token generation and delivery
- [ ] Download link email after purchase
- [ ] Stripe Connect seller onboarding (Express accounts)
- [ ] Stripe Checkout Session integration (replaces existing checkout)
- [ ] Stripe webhook handler in Hono backend
- [ ] Seller wallet schema + ledger
- [ ] Dashboard wallet page (balance + transactions + withdrawal)
- [ ] 5-step vendor onboarding wizard in dashboard
- [ ] Admin seller approval + rejection actions
- [ ] Welcome email on seller approval
- [ ] i18n keys (en.json + ar.json) for all new user-facing strings

### Out of Scope

- Physical product shipping integration — separate milestone
- Subscription/recurring digital products — future milestone
- Seller analytics wiring (dashboard charts) — future milestone (existing tech debt)
- Admin role security fixes (middleware, registration) — separate security hardening phase
- Tax calculation — existing tech debt, separate milestone
- Inventory deduction fix — existing tech debt, leave alone

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Webhook handler in Hono backend | Raw body required; Next.js auto-parses | Decided |
| Single Checkout Session model | MVP simplicity; avoid multi-session complexity | Decided |
| Order status `pending` → `paid` via webhook | Correctness; prevents order-before-payment bug | Decided |
| Digital product actions in new files | Avoid 1,687-line monster file | Decided |
| `productType` default = `physical` | Migration safety for existing rows | Decided |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions

**After milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?

---
*Last updated: 2026-05-14 after initialization*
