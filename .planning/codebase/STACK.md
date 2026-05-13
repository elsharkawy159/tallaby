# Technology Stack

**Analysis Date:** 2026-05-14

## Languages

**Primary:**
- TypeScript 5.9.3 - All apps and packages (strict mode via shared tsconfig)

**Secondary:**
- CSS / Tailwind - Styling across all Next.js apps

## Runtime

**Environment:**
- Node.js >=20 (enforced via `engines` field in root `package.json`)

**Package Manager:**
- pnpm 10.4.1
- Lockfile: `pnpm-lock.yaml` (present)

## Monorepo

**Orchestrator:**
- Turborepo 2.7.2 — task pipeline (build, dev, lint)
- Config: `turbo.json`
- Workspace definition: `pnpm-workspace.yaml`

**Workspace layout:**
- `apps/*` — runnable applications
- `packages/*` — shared internal packages

**Apps:**
| App | Purpose |
|-----|---------|
| `apps/ecommerce` | Customer-facing storefront (Next.js) |
| `apps/admin` | Platform admin dashboard (Next.js) |
| `apps/dashboard` | Seller/vendor dashboard (Next.js) |
| `apps/backend` | Internal API server (Hono on Node) |

**Shared Packages:**
| Package | Purpose |
|---------|---------|
| `packages/db` | Database client, Drizzle schema, Supabase clients |
| `packages/lib` | Shared utility functions |
| `packages/ui` | Shared UI component library (Shadcn-based) |
| `packages/emails` | React Email templates |
| `packages/eslint-config` | Shared ESLint config |
| `packages/typescript-config` | Shared TypeScript config |

## Frameworks

**Core (storefront, admin, dashboard):**
- Next.js 16.1.1 — App Router, Server Actions, Server Components
- React 19.2.3 / React DOM 19.2.3

**Backend API:**
- Hono 4.11.3 — lightweight edge-ready web framework
- `@hono/node-server` 1.19.8 — Node.js adapter (deployed on Vercel via `handle(app)`)

**Internationalization:**
- next-intl 4.6.1 — used in `apps/ecommerce` and `apps/dashboard`

**Theming:**
- next-themes 0.4.6 — dark/light mode

## UI Libraries

- Tailwind CSS 4.1.18 — utility-first CSS (configured per-app)
- Shadcn UI components — via `packages/ui` (class-variance-authority, Radix UI primitives)
- `lucide-react` 0.562.0 — icon set
- `@radix-ui/react-icons` 1.3.2 — supplemental icons (admin only)
- `embla-carousel-react` 8.6.0 — carousel (ecommerce)
- `recharts` 3.6.0 — charts (admin, dashboard)
- `@tanstack/react-table` 8.21.3 — data tables (admin, dashboard)
- `@hello-pangea/dnd` 18.0.1 — drag and drop (admin, dashboard)
- `react-dropzone` 14.3.8 — file uploads (admin, dashboard)
- `sonner` 2.0.7 — toast notifications
- `sweetalert2` 11.26.17 — modal dialogs (ecommerce)
- Leaflet 1.9.4 + `@googlemaps/react-wrapper` — maps (ecommerce)

## Data Fetching & State

- `@tanstack/react-query` 5.90.14 — server state management (ecommerce, admin, dashboard)
- `zustand` 5.0.9 — client state (ecommerce, dashboard)
- Next.js Server Actions — primary mutation pattern

## Forms & Validation

- `react-hook-form` 7.69.0 — form management
- `@hookform/resolvers` 5.2.2 — validation adapters
- `zod` 4.2.1 — schema validation (all apps and backend)

## Database & ORM

- PostgreSQL — hosted on Supabase (AWS eu-central-1)
- Drizzle ORM 0.45.1 — ORM (pinned via root pnpm override)
- `drizzle-kit` 0.31.8 — migrations and studio
- `postgres` 3.4.7 — raw pg driver used by Drizzle
- Schema location: `packages/db/src/drizzle/schema.ts`
- Relations: `packages/db/src/drizzle/relations.ts`
- Migrations output: `packages/db/migrations/`
- Drizzle config: `packages/db/drizzle.config.ts`

## Email

- `react-email` 5.2.1 + `@react-email/components` 1.0.4 — email template rendering
- `@react-email/render` 2.0.2 — HTML rendering for send
- Email templates: `packages/emails/src/`

## Security

- `bcryptjs` 3.0.3 — password hashing (ecommerce)
- `nanoid` 5.1.6 — ID generation (ecommerce)

## Utilities

- `date-fns` 4.1.0 — date formatting (admin, dashboard)
- `slugify` 1.6.6 — URL slug generation (admin, dashboard)
- `clsx` 2.1.1 + `tailwind-merge` 3.4.0 — className utilities
- `xlsx` 0.18.5 — Excel export (dashboard)
- `cheerio` 1.1.2 — HTML parsing (dashboard)
- `dotenv` 17.2.3 — environment loading (backend, db)

## Build & Dev Tooling

- Turbopack — used in dev mode (`next dev --turbopack`) for ecommerce, admin, dashboard
- `tsx` 4.21.0 — TypeScript execution for backend (`tsx watch`)
- ESLint 9.39.2 — linting with `eslint-config-next`
- Prettier 3.7.4 — formatting (`**/*.{ts,tsx,md}`)

## Configuration Files

- Root: `turbo.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `package.json`
- Per-app: `next.config.mjs` / `next.config.ts`, `tsconfig.json`, `eslint.config.js`
- DB: `packages/db/drizzle.config.ts`

## Platform Requirements

**Development:**
- Node.js >=20
- pnpm 10.4.1

**Production:**
- Vercel (inferred from `@hono/node-server/vercel` adapter and Next.js build output)
- Supabase project: `sakwqwocbccpyrmwjowq` (AWS eu-central-1)

---

*Stack analysis: 2026-05-14*
