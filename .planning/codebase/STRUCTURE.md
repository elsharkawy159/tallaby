# Codebase Structure

**Analysis Date:** 2026-05-14

## Directory Layout

```
tallaby/                              # Turborepo monorepo root
├── apps/
│   ├── ecommerce/                    # Customer-facing Next.js storefront
│   │   ├── actions/                  # All server actions (data + mutations)
│   │   ├── app/                      # Next.js App Router
│   │   │   ├── (main)/               # Public layout group (navbar + footer)
│   │   │   │   ├── page.tsx          # Homepage
│   │   │   │   ├── products/         # Product listing + detail pages
│   │   │   │   ├── profile/          # User profile, addresses, orders
│   │   │   │   ├── search/           # Search results
│   │   │   │   ├── categories/       # Category browsing
│   │   │   │   ├── wishlist/
│   │   │   │   ├── orders/[orderId]/
│   │   │   │   └── (static pages: about, faq, help, terms, careers, contact)
│   │   │   ├── (protected)/          # Auth-required route group
│   │   │   ├── api/                  # Minimal Next.js API routes
│   │   │   │   ├── auth/callback/    # Supabase OAuth callback
│   │   │   │   └── revalidate/       # ISR revalidation webhook
│   │   │   ├── auth/                 # Auth page (login/signup)
│   │   │   ├── cart/                 # Cart page + checkout
│   │   │   │   └── checkout/         # Checkout flow
│   │   │   └── onboarding/           # New user onboarding
│   │   ├── components/               # Shared UI components (app-local)
│   │   │   ├── home/                 # Homepage sections (Hero, ProductsGrid)
│   │   │   ├── layout/               # Navbar, footer, breadcrumb
│   │   │   ├── product/              # Product card, gallery, etc.
│   │   │   ├── auth/                 # Auth forms
│   │   │   ├── address/              # Address UI
│   │   │   └── shared/               # Cross-feature shared components
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── i18n/                     # next-intl config
│   │   ├── lib/                      # Utilities, constants, validators
│   │   │   ├── validations/          # Zod schemas for forms
│   │   │   ├── get-current-user-id.ts
│   │   │   ├── guest-user.ts
│   │   │   ├── coupon-utils.ts
│   │   │   ├── radis.ts              # Upstash Redis client (note: typo in filename)
│   │   │   └── constants.ts
│   │   ├── messages/                 # i18n message files
│   │   │   ├── en.json
│   │   │   └── ar.json
│   │   ├── providers/                # React context providers
│   │   ├── supabase/                 # Supabase client factories + middleware
│   │   └── types/                    # App-level TypeScript types
│   │
│   ├── admin/                        # Internal admin Next.js app
│   │   ├── actions/                  # (minimal — most actions colocated)
│   │   ├── app/
│   │   │   ├── (dashboard)/          # Dashboard layout group
│   │   │   │   ├── layout.tsx        # Sidebar + Header shell
│   │   │   │   ├── page.tsx          # Dashboard home
│   │   │   │   ├── _components/      # Shared dashboard UI (charts, data-table, dialogs)
│   │   │   │   ├── _lib/             # Shared dashboard utils + validations
│   │   │   │   ├── analytics/
│   │   │   │   ├── brands/
│   │   │   │   ├── categories/
│   │   │   │   ├── customers/
│   │   │   │   │   └── [id]/         # Customer profile page
│   │   │   │   ├── orders/
│   │   │   │   │   └── [id]/         # Order detail page
│   │   │   │   ├── payments/
│   │   │   │   ├── products/
│   │   │   │   │   ├── create/
│   │   │   │   │   └── [productId]/edit/
│   │   │   │   ├── promotions/coupons/
│   │   │   │   ├── sellers/
│   │   │   │   ├── settings/
│   │   │   │   └── shipping/
│   │   │   └── login/
│   │   ├── components/               # App-level shared components
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── auth/                 # Admin auth helpers
│   │   │   └── validations/
│   │   └── supabase/
│   │
│   ├── dashboard/                    # Seller-facing Next.js dashboard
│   └── backend/                      # Hono API (Vercel serverless)
│       └── src/
│           ├── api/index.ts          # Hono app entry point
│           ├── routes/emails.ts      # Email sending routes
│           └── lib/
│               ├── middleware.ts     # Internal API auth
│               └── sender.ts        # Email dispatch logic
│
├── packages/
│   ├── db/                           # Shared database package
│   │   ├── src/
│   │   │   ├── drizzle/
│   │   │   │   ├── schema.ts         # All table definitions (pgTable)
│   │   │   │   ├── relations.ts      # Drizzle relation definitions
│   │   │   │   └── database.ts       # Drizzle client + re-exported operators
│   │   │   ├── supabase/
│   │   │   │   ├── server.ts         # SSR Supabase client factory
│   │   │   │   └── client.ts         # Browser Supabase client factory
│   │   │   └── index.ts              # Barrel: exports schema + supabase
│   │   └── migrations/               # Drizzle migration files
│   │
│   ├── ui/                           # Shared component library
│   │   └── src/
│   │       ├── components/           # shadcn/ui components + custom inputs
│   │       │   └── inputs/           # TextInput, SelectInput, DateInput, etc.
│   │       ├── hooks/                # Shared React hooks
│   │       ├── contexts/
│   │       └── styles/               # Global CSS / Tailwind base
│   │
│   ├── lib/                          # Shared server actions + utils
│   │   ├── actions/actions.ts        # Shared server actions
│   │   ├── src/utils/formatPrice.ts  # Price formatting utility
│   │   └── index.ts
│   │
│   ├── emails/                       # React Email templates
│   │   └── src/                      # Email component source
│   │
│   ├── eslint-config/                # Shared ESLint configuration
│   └── typescript-config/            # Shared tsconfig bases
│
├── package.json                      # Monorepo root (pnpm workspaces + turbo)
└── turbo.json                        # Turborepo pipeline config
```

## Directory Purposes

**`apps/ecommerce/actions/`:**
- Purpose: All server-side data fetching and mutations for the storefront
- Contains: One file per domain (`cart.ts`, `checkout.ts`, `products.ts`, `auth.ts`, `order.ts`, `wishlist.ts`, `coupons.ts`, `customer.ts`, etc.)
- Key files: `apps/ecommerce/actions/cart.ts`, `apps/ecommerce/actions/checkout.ts`, `apps/ecommerce/actions/auth.ts`

**`apps/admin/app/(dashboard)/*/` (feature directories):**
- Purpose: Self-contained feature modules; each contains data, server, client, skeleton, types, dto, and lib files colocated
- Contains: `*.server.ts` (server actions), `*.data.tsx` (async RSC), `*.client.tsx` (interactive UI), `*.skeleton.tsx` (loading state), `*.types.ts`, `*.dto.ts`, `*.lib.ts`
- Key files: `apps/admin/app/(dashboard)/sellers/sellers.server.ts`, `apps/admin/app/(dashboard)/orders/orders.data.tsx`

**`packages/db/src/drizzle/schema.ts`:**
- Purpose: Single file containing all Drizzle table definitions for the entire platform
- Contains: All `pgTable`, `pgEnum`, and column definitions; enums include `orderStatus`, `userRole`, `couponType`, `sellerStatus`, etc.

**`packages/ui/src/components/`:**
- Purpose: Reusable UI component library shared across all apps
- Contains: shadcn/ui wrappers (button, dialog, card, table, etc.) plus custom inputs (`inputs/` subdirectory)

## Key File Locations

**Entry Points:**
- `apps/ecommerce/app/(main)/page.tsx`: Storefront homepage
- `apps/admin/app/(dashboard)/page.tsx`: Admin dashboard home
- `apps/backend/src/api/index.ts`: Hono API server
- `apps/ecommerce/app/cart/checkout/page.tsx`: Checkout flow entry

**Configuration:**
- `turbo.json`: Turborepo pipeline tasks
- `package.json`: Root workspaces config (pnpm)
- `apps/ecommerce/i18n/request.ts`: next-intl locale resolution
- `packages/db/src/drizzle/database.ts`: Drizzle client initialization

**Core Logic:**
- `packages/db/src/drizzle/schema.ts`: Database schema (all tables)
- `apps/ecommerce/lib/get-current-user-id.ts`: Unified auth/guest user identity resolution
- `apps/ecommerce/lib/guest-user.ts`: Guest user creation and cookie management
- `apps/admin/lib/auth/admin-auth.ts`: Admin role verification

**Shared Utilities:**
- `apps/ecommerce/lib/radis.ts`: Upstash Redis client singleton
- `apps/ecommerce/lib/coupon-utils.ts`: Coupon validation helpers
- `packages/lib/src/utils/formatPrice.ts`: Shared price formatter

## Naming Conventions

**Files:**
- Pages and layouts: `page.tsx`, `layout.tsx`, `loading.tsx` (Next.js conventions)
- Feature-colocated files (admin): `[feature].[role].tsx/ts` — e.g., `sellers.server.ts`, `sellers.data.tsx`, `sellers.client.tsx`, `sellers.skeleton.tsx`, `sellers.dto.ts`, `sellers.types.ts`, `sellers.lib.ts`
- Shared components: `kebab-case.tsx` — e.g., `product-images-gallery.tsx`, `customer-quick-view-dialog.tsx`
- Server action files: descriptive noun — e.g., `cart.ts`, `checkout.ts`, `products.ts`

**Directories:**
- Route groups: `(groupName)` — e.g., `(main)`, `(dashboard)`, `(protected)`
- Dynamic segments: `[paramName]` — e.g., `[slug]`, `[productId]`, `[id]`
- Private (colocated, non-routable): `_components`, `_lib`

**Component naming:**
- PascalCase for all React components
- Client components often suffixed with description: `ProductDisplay`, `SellersClient`, `CheckoutData`

## Where to Add New Code

**New storefront feature (page + data):**
- Page: `apps/ecommerce/app/(main)/[feature]/page.tsx`
- Server action: `apps/ecommerce/actions/[feature].ts` (add `"use server"` at top)
- Components: `apps/ecommerce/components/[feature]/`

**New admin feature:**
- Directory: `apps/admin/app/(dashboard)/[feature]/`
- Create these files in that directory:
  - `page.tsx` — route entry
  - `[feature].server.ts` — `"use server"` data/mutation functions
  - `[feature].data.tsx` — async RSC + Suspense wrapper
  - `[feature].client.tsx` — interactive client component
  - `[feature].skeleton.tsx` — loading skeleton
  - `[feature].types.ts` — TypeScript types
  - `[feature].dto.ts` — Zod validation schemas

**New shared UI component:**
- Implementation: `packages/ui/src/components/[component-name].tsx`
- Import in apps via: `import { ComponentName } from "@workspace/ui/components/[component-name]"`

**New database table:**
- Add table definition to: `packages/db/src/drizzle/schema.ts`
- Add relations to: `packages/db/src/drizzle/relations.ts`
- Generate migration with Drizzle Kit; place in: `packages/db/migrations/`

**New email template:**
- Implementation: `packages/emails/src/[TemplateName].tsx`
- Export from: `packages/emails/src/index.ts`

**New utility shared across apps:**
- Implementation: `packages/lib/src/[utility-name].ts`
- Export from: `packages/lib/index.ts`

## Special Directories

**`.planning/`:**
- Purpose: GSD planning documents
- Generated: No
- Committed: Yes

**`.next/` (per app):**
- Purpose: Next.js build output and cache
- Generated: Yes
- Committed: No

**`.turbo/` (per app and root):**
- Purpose: Turborepo task cache
- Generated: Yes
- Committed: No

**`packages/db/migrations/`:**
- Purpose: Drizzle ORM migration SQL files
- Generated: Yes (via `drizzle-kit`)
- Committed: Yes

**`apps/backend/dist/`:**
- Purpose: Compiled backend output
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-05-14*
