<!-- refreshed: 2026-05-14 -->
# Architecture

**Analysis Date:** 2026-05-14

## System Overview

```text
┌────────────────────────────────────────────────────────────────────┐
│                        Turborepo Monorepo                          │
├──────────────┬───────────────┬───────────────┬─────────────────────┤
│  ecommerce   │    admin      │   dashboard   │      backend        │
│  (Next.js)   │  (Next.js)    │  (Next.js)    │  (Hono / Vercel     │
│  storefront  │  admin panel  │  seller dash  │   Edge API)         │
└──────┬───────┴───────┬───────┴───────┬───────┴──────────┬──────────┘
       │               │               │                  │
       ▼               ▼               ▼                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                     Shared Packages                                │
│  @workspace/db  ·  @workspace/ui  ·  @workspace/lib               │
│  @workspace/emails  ·  @workspace/eslint-config                    │
│  @workspace/typescript-config                                       │
└────────────────────────────────────────────────────────────────────┘
       │
       ▼
┌────────────────────────────────────────────────────────────────────┐
│  Data Layer                                                        │
│  Supabase (PostgreSQL + Auth)  ←→  Drizzle ORM                    │
│  Upstash Redis (caching / sessions)                               │
└────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | Root Path |
|-----------|----------------|-----------|
| `apps/ecommerce` | Customer-facing storefront with cart, checkout, product browsing | `apps/ecommerce/` |
| `apps/admin` | Internal admin dashboard: manage products, orders, sellers, analytics | `apps/admin/` |
| `apps/dashboard` | Seller-facing dashboard (own Next.js app) | `apps/dashboard/` |
| `apps/backend` | Internal Hono API on Vercel — handles email dispatch | `apps/backend/` |
| `packages/db` | Shared Drizzle schema, migrations, Supabase clients | `packages/db/` |
| `packages/ui` | Shared shadcn/ui component library consumed by all apps | `packages/ui/` |
| `packages/lib` | Shared server actions and utilities (formatPrice, etc.) | `packages/lib/` |
| `packages/emails` | React Email templates (e.g., WelcomeEmail) | `packages/emails/` |

## Pattern Overview

**Overall:** Turborepo monorepo with Next.js App Router applications sharing a Drizzle + Supabase data layer. Each app uses the React Server Component (RSC) model with colocated server actions as the data-fetching and mutation layer. No separate REST API is used from the Next.js apps — all DB access goes through server actions.

**Key Characteristics:**
- Server Actions replace API routes for all CRUD operations in Next.js apps
- RSC async server components fetch data before render; client components handle interactivity
- Shared schema: all apps import from `@workspace/db` which is the single source of truth
- Supabase handles authentication; Drizzle ORM handles all DB queries on top of PostgreSQL
- Guest users are first-class: stored in `users` table with `isGuest = true`, tracked via `guest_uid` cookie

## Layers

**Routing / Page Layer:**
- Purpose: Define pages, layouts, and route segments
- Location: `apps/*/app/`
- Contains: `page.tsx`, `layout.tsx`, `loading.tsx`, route group folders
- Depends on: Server Actions, shared components
- Used by: Next.js router

**Server Actions Layer:**
- Purpose: All data fetching and mutations (replaces API routes)
- Location: `apps/ecommerce/actions/`, `apps/admin/app/(dashboard)/*/sellers.server.ts` (colocated)
- Contains: `"use server"` files that call Drizzle directly via `@workspace/db`
- Depends on: `@workspace/db`, Supabase auth client
- Used by: Server components and client components via `useTransition` / `startTransition`

**Data / Async RSC Layer:**
- Purpose: Async RSC components that fetch data, wrap in `<Suspense>`, pass to presentational children
- Location: `apps/admin/app/(dashboard)/*/*.data.tsx`
- Contains: Components like `SellersData`, `SellersDataWrapper` that orchestrate data fetching
- Depends on: Server Actions layer
- Used by: Page layer

**Client Components Layer:**
- Purpose: Interactivity — filters, forms, state
- Location: `apps/*/app/**/*.client.tsx`, `apps/*/components/`
- Contains: `"use client"` marked components
- Depends on: `@workspace/ui`, server actions (called from client via forms or event handlers)
- Used by: Page and Data layers

**Shared Database Layer:**
- Purpose: Single source of truth for schema, queries, and DB clients
- Location: `packages/db/src/`
- Contains: `schema.ts` (all tables), `relations.ts`, `database.ts` (Drizzle + postgres-js client), `supabase/server.ts`, `supabase/client.ts`
- Depends on: PostgreSQL via Supabase
- Used by: All apps

**Shared UI Layer:**
- Purpose: Reusable shadcn/ui-based components
- Location: `packages/ui/src/components/`
- Contains: Buttons, forms, dialogs, inputs, charts, etc.
- Depends on: Radix UI primitives, Tailwind CSS
- Used by: All Next.js apps via `@workspace/ui/components/*`

## Data Flow

### Primary Storefront Request (Product Page)

1. User requests `/products/[slug]` — Next.js App Router resolves `apps/ecommerce/app/(main)/products/[slug]/page.tsx`
2. Page component (RSC) calls `getProductBySlug(slug, locale)` from `apps/ecommerce/actions/products.ts`
3. Server action queries `@workspace/db` (Drizzle) against Supabase PostgreSQL
4. Data returned to page, rendered as RSC; client component `ProductDisplay` receives data as props
5. ISR applied: `export const revalidate = 600` caches page for 10 minutes

### Cart Add Flow

1. Client component fires server action `addToCart()` from `apps/ecommerce/actions/cart.ts`
2. `getOrCreateCurrentUserId()` checks Supabase auth; falls back to guest cookie; creates guest user in `users` table if none exists
3. `ensureCart()` finds or creates active `carts` row for user
4. Item inserted into `cartItems` table
5. `revalidatePath` invalidates relevant cached pages

### Admin Data Flow

1. Admin page renders `*.data.tsx` RSC wrapped in `<Suspense fallback={<*.skeleton.tsx />}>`
2. Data component calls `*.server.ts` functions (e.g., `getSellers()`) marked `"use server"`
3. Server functions query Drizzle directly, return typed results
4. `*.client.tsx` handles interactive mutations (status changes, etc.)
5. Mutations call same server functions, call `revalidatePath("/sellers")`

### Email Flow

1. App calls the `apps/backend` Hono API at `/api/emails/welcome`
2. `internalApiAuth` middleware validates the request
3. Route handler calls `sendEmail()` from `apps/backend/src/lib/sender.ts` with a `@workspace/emails` React Email template
4. Email delivered via configured email provider

**State Management:**
- Server-side state: Drizzle queries + `revalidatePath`/`revalidateTag` for cache invalidation
- Client-side state: React `useState` / `useReducer` in client components; no global state library detected
- Cart state: persisted in database (not local storage); guest users tracked via `guest_uid` cookie
- Auth state: Supabase session managed via `apps/*/supabase/server.ts` and `middleware.ts`

## Key Abstractions

**Server Actions (`"use server"` files):**
- Purpose: Data access and mutation boundary
- Examples: `apps/ecommerce/actions/cart.ts`, `apps/ecommerce/actions/checkout.ts`, `apps/admin/app/(dashboard)/sellers/sellers.server.ts`
- Pattern: Always return `{ success: boolean, data?: T, error?: string }` shape

**`*.data.tsx` RSC wrappers (admin):**
- Purpose: Async server component that owns data fetching + Suspense boundary
- Examples: `apps/admin/app/(dashboard)/sellers/sellers.data.tsx`, `apps/admin/app/(dashboard)/orders/orders.data.tsx`
- Pattern: Export two components: `*Data` (async RSC) and `*DataWrapper` (wraps in `<Suspense>`)

**`*.server.ts` files (admin):**
- Purpose: Server-only data and mutation functions for a given feature
- Examples: `apps/admin/app/(dashboard)/sellers/sellers.server.ts`
- Pattern: Colocated with the feature directory; all functions tagged `"use server"`

**`*.dto.ts` files:**
- Purpose: Zod validation schemas for inputs to server actions
- Examples: `apps/admin/app/(dashboard)/sellers/sellers.dto.ts`, `apps/admin/app/(dashboard)/customers/customers.dto.ts`
- Pattern: Export Zod schemas and inferred TypeScript types

**`*.types.ts` files:**
- Purpose: TypeScript type definitions for a feature domain
- Examples: `apps/admin/app/(dashboard)/sellers/sellers.types.ts`, `apps/admin/app/(dashboard)/orders/orders.types.ts`

**`@workspace/db` re-exports:**
- Purpose: All apps import schema tables and Drizzle operators from `@workspace/db` rather than individual drizzle-orm imports
- Example: `import { db, sellers, users, eq, desc } from "@workspace/db"`

## Entry Points

**Ecommerce App:**
- Location: `apps/ecommerce/app/(main)/page.tsx`
- Triggers: HTTP request to root URL
- Responsibilities: Renders homepage with Hero + ProductsGrid

**Admin App:**
- Location: `apps/admin/app/(dashboard)/page.tsx`
- Triggers: HTTP request to admin root
- Responsibilities: Dashboard overview; layout wraps all pages with sidebar + header

**Hono API Backend:**
- Location: `apps/backend/src/api/index.ts`
- Triggers: HTTP request to `/api/*` (Vercel serverless)
- Responsibilities: Routes requests to feature handlers; enforces internal API auth

**Auth Middleware:**
- Location: `apps/ecommerce/supabase/middleware.ts`, `apps/admin/supabase/middleware.ts`
- Triggers: Every request (Next.js middleware)
- Responsibilities: Validates Supabase session; redirects unauthenticated users from protected routes

## Architectural Constraints

- **Threading:** Single-threaded Node.js/Next.js event loop per app. No worker threads in use.
- **Global state:** `db` singleton defined in `packages/db/src/drizzle/database.ts`; `redis` singleton in `apps/ecommerce/lib/radis.ts`
- **Circular imports:** None detected, but `@workspace/db` is imported by all apps — changes to schema affect every app simultaneously
- **Guest users:** Guest identity is stored in the `users` DB table (not just cookies), meaning DB cleanup of stale guests needs to be considered
- **i18n:** Ecommerce app supports `en` and `ar` (Arabic); locale resolved from cookie; handled via `next-intl`. Admin app has no i18n.

## Anti-Patterns

### Dead-code commented blocks in pages

**What happens:** Many homepage and product page sections are commented out with `// import` and JSX blocks left in place (e.g., `apps/ecommerce/app/(main)/page.tsx` has 6+ commented component blocks)
**Why it's wrong:** Increases noise, makes it unclear what features are active vs. abandoned
**Do this instead:** Remove unused imports and components; track planned features in issue tracker instead

### `any` type cast in server responses

**What happens:** Pages cast server action responses with `as any` (e.g., `apps/ecommerce/app/cart/checkout/page.tsx` line 43: `const checkoutData = result.data as any`)
**Why it's wrong:** Defeats TypeScript safety at the component boundary
**Do this instead:** Define and export the return type from the server action; use `*.types.ts` pattern already established in the admin app

## Error Handling

**Strategy:** All server actions return a discriminated union `{ success: true, data: T } | { success: false, error: string }`. Callers check `.success` before accessing `.data`.

**Patterns:**
- Server actions wrap all DB calls in `try/catch`; errors logged via `console.error` and returned as `{ success: false, error: "..." }`
- Pages handle `!result.success` by rendering fallback UI or calling `notFound()`
- Admin data components throw on error (caught by Next.js error boundaries): `throw new Error(result.error)`

## Cross-Cutting Concerns

**Logging:** `console.error` throughout; no structured logging library detected
**Validation:** Zod schemas in `*.dto.ts` files (admin) and `lib/validations/` (ecommerce); validated at server action entry points
**Authentication:** Supabase Auth in all apps; admin app additionally checks `userRole` from the `users` table against `['admin', 'super_admin', 'moderator']` in `apps/admin/lib/auth/admin-auth.ts`

---

*Architecture analysis: 2026-05-14*
