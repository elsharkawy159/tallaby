# syntax=docker/dockerfile:1
#
# Production image for apps/ecommerce (seller storefronts: every
# {sub}.tallaby.com store, account.tallaby.com, preview.tallaby.com and the
# sellers' own domains), self-hosted on Hetzner through Coolify
# (docs/plans/hetzner-migration.md §7). Built in CI
# (.github/workflows/ecommerce-image.yml), never on the server. Vercel keeps
# building this app as before (it never sets NEXT_OUTPUT).
#
# Build context = repo root:
#   docker build -f apps/ecommerce/Dockerfile \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
#     --secret id=database_url,env=DATABASE_URL .
#
# Only NEXT_PUBLIC_* values are build args (they ship to the browser anyway).
# `next build` prerenders the tallaby.com marketing pages that still live in
# this app (home logo strip, store directory, compare/alternatives/templates/
# features/industries/integrations/solutions/tools pages: they read stores,
# blog posts, the USD/EGP rate and platform switches). That build-time
# DATABASE_URL (and the optional EXCHANGE_RATE_API_KEY) come in as BuildKit
# secret mounts, exported only for the build command: never ARG/ENV, so they
# are in no image layer or history (CLAUDE.md rule 10). Every such read has a
# timeout and a fallback, so the build also works without them (those pages
# then bake the fallbacks until their revalidate time or the next deploy).
# Store pages are rendered per request and read nothing at build time.
# Runtime server env lives in Coolify.

ARG NODE_IMAGE=node:24-slim

# ---- 1. Prune the monorepo to ecommerce and the workspace packages it uses ----
FROM ${NODE_IMAGE} AS pruner
WORKDIR /repo
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
COPY . .
# turbo comes from the root devDependencies (pinned in pnpm-lock.yaml).
RUN TURBO_VERSION="$(node -p "require('./package.json').devDependencies.turbo")" \
  && npx --yes "turbo@${TURBO_VERSION}" prune ecommerce --docker

# ---- 2. Install dependencies (cached while no package.json/lockfile changes) ----
FROM ${NODE_IMAGE} AS builder
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# pnpm version from the root package.json "packageManager" field.
COPY --from=pruner /repo/package.json ./package.json
RUN corepack enable && corepack install
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# ---- 3. Build ecommerce ----
COPY --from=pruner /repo/out/full/ ./

# Public, browser-visible values inlined at build time (every NEXT_PUBLIC_*
# read through process.env by apps/ecommerce and the workspace packages it
# imports).
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_PROJECT_ID
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_ROOT_DOMAIN
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_DASHBOARD_URL
ARG NEXT_PUBLIC_META_PIXEL_ID
ARG NEXT_PUBLIC_SUPPORT_WHATSAPP
ARG NEXT_PUBLIC_SHIPPING_COST
ARG NEXT_PUBLIC_SHIPPING_FALLBACK_BASE
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
    NEXT_PUBLIC_SUPABASE_PROJECT_ID=${NEXT_PUBLIC_SUPABASE_PROJECT_ID} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_ROOT_DOMAIN=${NEXT_PUBLIC_ROOT_DOMAIN} \
    NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL} \
    NEXT_PUBLIC_DASHBOARD_URL=${NEXT_PUBLIC_DASHBOARD_URL} \
    NEXT_PUBLIC_META_PIXEL_ID=${NEXT_PUBLIC_META_PIXEL_ID} \
    NEXT_PUBLIC_SUPPORT_WHATSAPP=${NEXT_PUBLIC_SUPPORT_WHATSAPP} \
    NEXT_PUBLIC_SHIPPING_COST=${NEXT_PUBLIC_SHIPPING_COST} \
    NEXT_PUBLIC_SHIPPING_FALLBACK_BASE=${NEXT_PUBLIC_SHIPPING_FALLBACK_BASE}

# Built with pnpm directly rather than `turbo build`: no workspace package has
# a build step, and turbo's strict env mode would drop NEXT_OUTPUT and the
# NEXT_PUBLIC_* values not listed in turbo.json.
ENV NEXT_OUTPUT=standalone
# Commit SHA from CI: the deploy id of `perDeploy` cache keys
# (packages/cache DEPLOY_ID), here for prerendering and in the runner at run time.
ARG DEPLOY_ID
ENV DEPLOY_ID=${DEPLOY_ID}
# Build-time server data (see the header): each secret is optional and is
# exported only for this command when its file is present and not empty.
RUN --mount=type=secret,id=database_url,required=false \
    --mount=type=secret,id=exchange_rate_api_key,required=false \
    if [ -s /run/secrets/database_url ]; then \
      DATABASE_URL="$(cat /run/secrets/database_url)"; export DATABASE_URL; \
    else echo "ecommerce build: no database_url secret, prerendered pages use their fallbacks"; fi \
  && if [ -s /run/secrets/exchange_rate_api_key ]; then \
      EXCHANGE_RATE_API_KEY="$(cat /run/secrets/exchange_rate_api_key)"; export EXCHANGE_RATE_API_KEY; \
    fi \
  && pnpm --filter ecommerce build

# ---- 4. Runtime: only the traced standalone output ----
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ARG DEPLOY_ID
ENV DEPLOY_ID=${DEPLOY_ID}
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# The official image ships an unprivileged `node` user (uid 1000).
# public/ is ~86 MB (mostly template-previews).
COPY --from=builder --chown=node:node /repo/apps/ecommerce/.next/standalone ./
COPY --from=builder --chown=node:node /repo/apps/ecommerce/.next/static ./apps/ecommerce/.next/static
COPY --from=builder --chown=node:node /repo/apps/ecommerce/public ./apps/ecommerce/public

# Image optimizer and ISR cache. Mount a persistent Coolify volume at
# /app/apps/ecommerce/.next/cache so optimized `next/image` sizes survive
# redeploys (docs/plans/hetzner-migration.md §7.4 #3, §7.8). The directory is
# created here owned by `node`, so a new (empty) named volume is writable too.
RUN mkdir -p /app/apps/ecommerce/.next/cache && chown -R node:node /app/apps/ecommerce/.next/cache

USER node
EXPOSE 3000

# /store-sw.js is a static file in public/ and is excluded from the proxy.ts
# matcher, so it does no Supabase session call, no host/store lookup and no
# database work, and answers 200 on any Host. (/manifest.webmanifest does not
# qualify here: it reads the request host and looks up the store.)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/store-sw.js').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "apps/ecommerce/server.js"]
