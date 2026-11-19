# syntax=docker/dockerfile:1
#
# Production image for apps/backend (api.tallaby.com, mcp.tallaby.com: Hono API
# + MCP server), self-hosted on Hetzner through Coolify
# (docs/plans/hetzner-migration.md §6 step 2.1). Built in CI
# (.github/workflows/backend-image.yml), never on the server.
#
# Build context = repo root:
#   docker build -f apps/backend/Dockerfile .
#
# No build args carry config: the backend has no NEXT_PUBLIC_* build-time
# values. Every secret (DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
# INTERNAL_API_SECRET, ...) is runtime env set in Coolify (CLAUDE.md rule 10).
#
# Vercel keeps building the same app with `pnpm build` (scripts/build.mjs);
# this image uses `build:node` (scripts/build-node.mjs → dist/server.mjs).

ARG NODE_IMAGE=node:24-slim

# ---- 1. Prune the monorepo to backend and the workspace packages it uses ----
FROM ${NODE_IMAGE} AS pruner
WORKDIR /repo
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
COPY . .
# turbo comes from the root devDependencies (pinned in pnpm-lock.yaml).
RUN TURBO_VERSION="$(node -p "require('./package.json').devDependencies.turbo")" \
  && npx --yes "turbo@${TURBO_VERSION}" prune backend --docker

# ---- 2. Install dependencies (cached while no package.json/lockfile changes) ----
FROM ${NODE_IMAGE} AS builder
WORKDIR /repo
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# pnpm version from the root package.json "packageManager" field.
COPY --from=pruner /repo/package.json ./package.json
RUN corepack enable && corepack install
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# ---- 3. Bundle backend into one file ----
COPY --from=pruner /repo/out/full/ ./
RUN pnpm --filter backend build:node

# ---- 4. Runtime: only the bundle (it inlines every dependency, no node_modules) ----
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
# Commit SHA from CI, like the admin image: the deploy id of `perDeploy` cache
# keys (packages/cache DEPLOY_ID). The bundle does not read it today; it is set
# so a later `@workspace/cache/cached` import behaves like on the Next apps.
ARG DEPLOY_ID
ENV DEPLOY_ID=${DEPLOY_ID}
ENV NODE_ENV=production \
    PORT=3000

# The official image ships an unprivileged `node` user (uid 1000).
COPY --from=builder --chown=node:node /repo/apps/backend/dist/server.mjs ./dist/server.mjs

USER node
EXPOSE 3000

# GET /api is the public welcome route: no auth, no database, so it only checks the server is up.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "dist/server.mjs"]
