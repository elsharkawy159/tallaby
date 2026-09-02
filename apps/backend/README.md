# Backend (Hono)

API service for emails, Paymob webhooks, and Resend delivery events.

## Local development

```bash
# from repo root
pnpm --filter backend dev
```

Listens on `http://localhost:4000` (see `PORT`).

## Build

```bash
# from apps/backend or via turbo
pnpm build
# or from repo root:
pnpm turbo build --filter=backend
```

This typechecks, then bundles workspace packages with esbuild into Vercel Build Output API artifacts under `.vercel/output`.

## Vercel

1. Create a project with **Root Directory** `apps/backend`.
2. Framework preset: **Other** (`framework: null` in `vercel.json`).
3. Install/build commands come from `vercel.json`.
4. Set env vars from `.env.example`.

Health check: `GET /api` → JSON welcome message.
