# syntax=docker/dockerfile:1
#
# Production image for apps/admin (admin.tallaby.com), self-hosted on Hetzner
# through Coolify (docs/plans/hetzner-migration.md §6 step 2.1). Built in CI
# (.github/workflows/admin-image.yml), never on the server.
#
# Build context = repo root:
#   docker build -f apps/admin/Dockerfile --build-arg NEXT_PUBLIC_SUPABASE_URL=... .
#
# Only NEXT_PUBLIC_* values are build args (they ship to the browser anyway).
# Server secrets (DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ...) are runtime env
# set in Coolify, never build args (CLAUDE.md rule 10).

ARG NODE_IMAGE=node:24-slim

# ---- 1. Prune the monorepo to admin and the workspace packages it uses ----
FROM ${NODE_IMAGE} AS pruner
WORKDIR /repo
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
COPY . .
# turbo comes from the root devDependencies (pinned in pnpm-lock.yaml).
RUN TURBO_VERSION="$(node -p "require('./package.json').devDependencies.turbo")" \
  && npx --yes "turbo@${TURBO_VERSION}" prune admin --docker

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

# ---- 3. Build admin ----
COPY --from=pruner /repo/out/full/ ./

# Public, browser-visible values inlined at build time.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_PROJECT_ID
ARG NEXT_PUBLIC_SUPABASE_ADMIN_AUTH_COOKIE_NAME
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_ROOT_DOMAIN
ARG NEXT_PUBLIC_ECOMMERCE_URL
ARG NEXT_PUBLIC_ECOMMERCE_DOMAIN
ARG NEXT_PUBLIC_META_PIXEL_ID
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL} \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY} \
    NEXT_PUBLIC_SUPABASE_PROJECT_ID=${NEXT_PUBLIC_SUPABASE_PROJECT_ID} \
    NEXT_PUBLIC_SUPABASE_ADMIN_AUTH_COOKIE_NAME=${NEXT_PUBLIC_SUPABASE_ADMIN_AUTH_COOKIE_NAME} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_ROOT_DOMAIN=${NEXT_PUBLIC_ROOT_DOMAIN} \
    NEXT_PUBLIC_ECOMMERCE_URL=${NEXT_PUBLIC_ECOMMERCE_URL} \
    NEXT_PUBLIC_ECOMMERCE_DOMAIN=${NEXT_PUBLIC_ECOMMERCE_DOMAIN} \
    NEXT_PUBLIC_META_PIXEL_ID=${NEXT_PUBLIC_META_PIXEL_ID}

# Built with pnpm directly rather than `turbo build`: no workspace package has
# a build step, and turbo's strict env mode would drop NEXT_OUTPUT and the
# NEXT_PUBLIC_* values not listed in turbo.json.
ENV NEXT_OUTPUT=standalone
RUN pnpm --filter admin build

# ---- 4. Runtime: only the traced standalone output ----
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# The official image ships an unprivileged `node` user (uid 1000).
COPY --from=builder --chown=node:node /repo/apps/admin/.next/standalone ./
COPY --from=builder --chown=node:node /repo/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder --chown=node:node /repo/apps/admin/public ./apps/admin/public

USER node
EXPOSE 3000

# /manifest.webmanifest skips proxy.ts (no Supabase call), so it only checks the server is up.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/manifest.webmanifest').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "apps/admin/server.js"]
