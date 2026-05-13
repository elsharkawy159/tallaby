# External Integrations

**Analysis Date:** 2026-05-14

## APIs & External Services

**Email Delivery:**
- Resend — transactional email sending
  - SDK/Client: `resend` ^6.7.0
  - Used in: `apps/backend/src/lib/sender.ts`
  - Auth env var: `RESEND_API_KEY`
  - From address env vars: `EMAIL_FROM_NAME`, `EMAIL_FROM`
  - Templates rendered via `@react-email/render` before sending

**Maps:**
- Google Maps — address/location display (ecommerce storefront)
  - SDK/Client: `@googlemaps/react-wrapper` ^1.2.0
- Leaflet — alternative/supplemental map rendering (ecommerce)
  - SDK/Client: `leaflet` ^1.9.4

## Data Storage

**Primary Database:**
- PostgreSQL via Supabase
  - Supabase project ID: `sakwqwocbccpyrmwjowq` (eu-central-1 AWS region)
  - Connection env var: `DATABASE_URL`
  - Client: Drizzle ORM (`packages/db/src/drizzle/database.ts`)
  - Direct postgres driver: `postgres` package

**File / Image Storage:**
- Supabase Storage — product images and uploads
  - Referenced via `https://sakwqwocbccpyrmwjowq.supabase.co` in Next.js `remotePatterns`
  - Also configured in admin app next config

**Caching:**
- Upstash Redis — server-side caching (ecommerce)
  - SDK/Client: `@upstash/redis` ^1.36.0
  - Client instantiation: `apps/ecommerce/lib/radis.ts`
  - Auth env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - Note: filename is `radis.ts` (typo for `redis.ts`)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - SDK/Client: `@supabase/supabase-js` ^2.89.0, `@supabase/ssr` ^0.8.0
  - Browser client: `packages/db/src/supabase/client.ts` (uses `createBrowserClient`)
  - Server client: `packages/db/src/supabase/server.ts` (uses `createServerClient` + Next.js cookies)
  - Auth env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Supports: email/password login, OAuth (code exchange flow), email verification
  - Auth callback route: `apps/ecommerce/app/api/auth/callback/route.ts`
  - Supported roles: customer, seller, creator, admin

**Password Hashing:**
- `bcryptjs` 3.0.3 — used within ecommerce app for local password operations

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, Datadog, or similar)

**Logs:**
- `console.log` / `console.error` — used in backend sender and route handlers

## Internal API (Backend App)

**Service:** `apps/backend` — Hono API server deployed on Vercel
- Base path: `/api`
- Auth: internal API auth middleware (`apps/backend/src/lib/middleware.ts`)
- CORS: enabled for all routes via `hono/cors`
- Current routes:
  - `POST /api/emails/welcome` — sends a welcome email via Resend
- Adapter: `@hono/node-server/vercel` — bridges Hono to Vercel's serverless runtime

**Internal API security:**
- Custom `internalApiAuth` middleware applied to all non-root routes
- Implementation: `apps/backend/src/lib/middleware.ts`

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from Hono Vercel adapter and `.next` build output in turbo.json)

**CI Pipeline:**
- Not detected (no GitHub Actions, CircleCI, etc. config found)

## Webhooks & Callbacks

**Incoming:**
- `GET /api/auth/callback` (`apps/ecommerce/app/api/auth/callback/route.ts`) — Supabase OAuth and email verification callback

**Outgoing:**
- None detected

## Cache Invalidation

- `GET /api/revalidate` (`apps/ecommerce/app/api/revalidate/route.ts`) — Next.js on-demand revalidation endpoint

## Environment Configuration

**Required env vars (ecommerce app):**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- `UPSTASH_REDIS_REST_URL` — Upstash Redis REST endpoint
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis auth token

**Required env vars (backend app):**
- `RESEND_API_KEY` — Resend email API key
- `EMAIL_FROM` — sender email address
- `EMAIL_FROM_NAME` — sender display name

**Required env vars (db package):**
- `DATABASE_URL` — PostgreSQL connection string (Supabase pooler)

**Secrets location:**
- `.env` files per-app (e.g., `apps/ecommerce/.env`) — not committed
- `dotenv` loaded explicitly in backend and db package

---

*Integration audit: 2026-05-14*
