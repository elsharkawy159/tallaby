# Tallaby: Vercel → Hetzner + Cloudflare migration plan

Status: **Planned** (owner idea, 2026-11-19). Nothing below is built except §1.
Goal: run every Tallaby app on Hetzner (Coolify, Docker) to cut hosting cost, with Cloudflare for DNS, SSL, CDN and WAF. Supabase (DB, Auth, Storage), Resend, payment gateways and other external APIs stay where they are. The database does **not** move to the VPS.

This is a hosting change, not a business-model change, but it touches checkout, payments callbacks, crons that move money (`tallaby-pay-release`, `cod-deposits`, `plan-renewals`) and tenant routing, so CLAUDE.md rules 3, 5, 7, 8 and 10 apply to every step.

## 1. Done: DNS on Cloudflare (2026-11-18)

- Zone `tallaby.com` on Cloudflare Free, active since 2026-11-18 21:45Z. Namecheap nameservers: `ariadne.ns.cloudflare.com`, `jaime.ns.cloudflare.com`.
- All records copied from Vercel DNS, all **DNS only** (grey cloud): `@` and `*` CNAME `ab23bb2578e60837.vercel-dns-017.com`; `_acme-challenge` NS `ns1/ns2.vercel-dns.com` (Vercel renews the wildcard cert); MX `mx1/mx2.privateemail.com` (Namecheap Private Email, not Resend); SPF and Google verification TXT; Resend `resend._domainkey` TXT, `send` and `rsend` CNAMEs; CAA `letsencrypt.org`, `sectigo.com`, `pki.goog` (Cloudflare adds its own CAs on top).
- `dashboard`, `admin`, `api` and every store subdomain have no own record: the `*` wildcard covers them.
- Vercel DNS records were left untouched (rollback = set Vercel nameservers back at Namecheap).
- There is **no DMARC record**. Add `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:<inbox>` before tightening email.

## 2. What ties us to Vercel today (checked in code 2026-11-19)

| #   | Dependency                                                                                                              | Where                                                                                                                                                                                                                                                                                                                                               | What replaces it                                                                                                                                                                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Seller custom domains** attached through the Vercel API, Vercel issues their SSL                                      | `packages/lib/src/storefront/vercel-domains.ts` (`STOREFRONT_VERCEL_TOKEN`, `STOREFRONT_VERCEL_PROJECT_ID`), `packages/lib/src/admin/domains-admin.server.ts`, admin `domains`, dashboard `custom-domain.client.tsx` and `website/domain/domain-dns.lib.ts` (tells sellers `76.76.21.21` / `cname.vercel-dns.com`), ecommerce cron `custom-domains` | Cloudflare for SaaS (Custom Hostnames: seller CNAME → our fallback origin, Cloudflare issues SSL and applies our WAF; first 100 free, then ~$0.10/hostname/month), or Caddy on-demand TLS on the VPS. Code change behind a provider switch, and **every existing seller must change their DNS** |
| 2   | **22 Vercel crons** (UTC)                                                                                               | `apps/ecommerce/vercel.json` (14, incl. `tallaby-pay-release`, `cod-deposits`), `apps/dashboard/vercel.json` (7, incl. `plan-renewals`, `exchange-rate`, `top-up-reminders`), `apps/admin/vercel.json` (1)                                                                                                                                          | Coolify scheduled tasks or one cron container that calls each route with `CRON_SECRET`, same schedules in UTC. Must be live the moment an app moves, or money and reminder jobs stop silently                                                                                                   |
| 3   | **Client IP** from `x-forwarded-for` / `x-real-ip` (fake-order protection, rate limits)                                 | ~20 call sites in `apps` and `packages`                                                                                                                                                                                                                                                                                                             | Read `CF-Connecting-IP` first behind Cloudflare; one shared helper. Origin firewall must accept 80/443 **only from Cloudflare IP ranges**, else the header can be forged                                                                                                                        |
| 4   | **Country** from `x-vercel-ip-country`                                                                                  | `apps/ecommerce/proxy.ts`, `apps/ecommerce/app/api/geo/route.ts`, `lib/marketing/visitor-country.lib.ts`                                                                                                                                                                                                                                            | `CF-IPCountry` (Cloudflare IP Geolocation, on by default), same helper as #3                                                                                                                                                                                                                    |
| 5   | `VERCEL`, `VERCEL_URL`, `VERCEL_GIT_COMMIT_SHA`, `VERCEL_DEPLOYMENT_ID`                                                 | a few call sites                                                                                                                                                                                                                                                                                                                                    | Our own env (`APP_URL`, `GIT_SHA`, `DEPLOYMENT_ID`) set at build/run time                                                                                                                                                                                                                       |
| 6   | **Backend** (`apps/backend`, Hono + MCP server, `api.tallaby.com`) builds to `.vercel/output` via `src/vercel-entry.ts` | `apps/backend/scripts/build.mjs`                                                                                                                                                                                                                                                                                                                    | Node container from the existing `@hono/node-server` entry (`src/dev-server.ts` pattern)                                                                                                                                                                                                        |
| 7   | Next.js apps have no `output: "standalone"`                                                                             | `apps/*/next.config.*`                                                                                                                                                                                                                                                                                                                              | Add standalone output + one Dockerfile per app                                                                                                                                                                                                                                                  |
| 8   | Git deploys of `main` and `stage`                                                                                       | `apps/*/vercel.json`                                                                                                                                                                                                                                                                                                                                | GitHub Actions builds images per app (turbo-ignore style), pushes to GHCR, Coolify pulls; `stage` → Hetzner staging                                                                                                                                                                             |
| 9   | Vercel firewall, DDoS, image optimization, previews                                                                     | platform                                                                                                                                                                                                                                                                                                                                            | Cloudflare WAF/DDoS (after orange cloud); `next/image` runs on our CPU (`sharp`); no previews unless we add them                                                                                                                                                                                |

Already portable: `after()` works when self-hosted; the cross-app cache broadcast (`packages/cache/src/broadcast.ts`) posts to `ECOMMERCE_URL` / `DASHBOARD_URL` / `ADMIN_URL` `/api/revalidate`, so it keeps working. It assumes **one instance per app**: running two replicas of an app needs a shared cache handler (e.g. Redis) first.

## 3. Apps to host

| App              | Domain                                              | Notes                                                                  |
| ---------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| `apps/ecommerce` | `*.tallaby.com` storefronts + seller custom domains | Highest risk: checkout, tenant by host, custom domains. Moves **last** |
| `apps/dashboard` | `dashboard.tallaby.com`                             | 7 crons, OAuth/MCP endpoints, payment and Supabase webhooks            |
| `apps/admin`     | `admin.tallaby.com`                                 | 1 cron, admin push webhook                                             |
| `apps/backend`   | `api.tallaby.com`                                   | Hono + MCP, no Next.js cache of its own                                |
| `apps/marketing` | tallaby.com marketing                               | confirm its domain before moving                                       |
| `apps/shipping`  | (deployed by hand today)                            | decide whether it moves                                                |

## 4. Server

- **Size:** CX23 (4 GB) is too small for 5–6 Node apps plus Coolify. Start at **CX33/CX43** and measure. Never build on the production VPS: build in CI.
- **Location:** next to the Supabase region (Falkenstein or Nuremberg for Frankfurt). Every DB query crosses that link; it matters more than distance to Egypt.
- **Reliability (one VPS = one point of failure):** Coolify health checks and zero-downtime deploys, Hetzner backups/snapshots, uptime alerts, unattended security updates, SSH keys only, Hetzner firewall allowing 80/443 from Cloudflare only and 22 from our IPs. Later: a second VPS behind a Hetzner load balancer (needs the shared cache from §2).
- **Secrets:** Coolify env only (rule 10). `NEXT_PUBLIC_*` are build-time, so they are build args per app image.

## 5. Cloudflare after an app moves (orange cloud)

- SSL **Full (strict)** with a Cloudflare Origin CA wildcard cert (`tallaby.com`, `*.tallaby.com`) on the VPS proxy. Universal SSL already covers both names.
- Remove the `_acme-challenge` NS delegation to Vercel once nothing on `*.tallaby.com` is served by Vercel.
- **Cache only static assets.** No "Cache Everything" on HTML: carts, orders, wallets, builder drafts and dashboards must never be cached (rule 8).
- **WAF skip rules** for every machine caller: EasyKash, Kashier, Paymob callbacks; Bosta; Supabase database webhooks (`/api/cron/seller-push`, admin `/api/cron/admin-push`); cron routes; MCP and OAuth (`/oauth/*`, `/api/oauth/*`, `/.well-known/*`, `/mcp`). Keep **Bot Fight Mode off** (Free plan cannot exempt paths).
- Rate-limit rules on login, checkout and OTP endpoints.

## 6. Order of work

1. ✅ DNS on Cloudflare (§1).
2. **Code prep, no behaviour change on Vercel** (one commit each, reviewed per rule 21):
   1. Standalone output + Dockerfiles for each app; backend Node entry. **Started 2026-11-19: admin** (see "Admin image" below); dashboard, ecommerce, marketing, shipping and backend still to do.
   2. Shared client-IP and country helper (`CF-Connecting-IP`, `CF-IPCountry`, falling back to today's headers).
   3. Replace `VERCEL_*` env reads.
   4. Custom-domain provider interface: Vercel (today) and Cloudflare for SaaS (new), chosen by env; dashboard DNS instructions follow the provider.
   5. Cron runner config listing all 22 jobs with their UTC schedules.
   6. CI: build and push images per app. **Started 2026-11-19: admin** (`.github/workflows/admin-image.yml`); the other apps still to do.
3. **Hetzner staging** on the `stage` branch against staging Supabase. Test: sign-in on every app, card and wallet payments with callbacks, store isolation by host, cache invalidation across apps, images, emails, every cron, MCP/OAuth.
4. **Move production one app at a time**, lowest risk first: admin → dashboard → `api` → marketing → storefronts. For each: point its Cloudflare record at the VPS, turn on the orange cloud, watch errors for a day. Keep the Vercel project running.
5. **Seller custom domains:** switch new domains to Cloudflare for SaaS, ask existing sellers to change their DNS (dashboard banner + email), keep Vercel's ecommerce project until the last one moves.
6. **Retire Vercel** after two stable weeks. Rollback until then = repoint the Cloudflare record at Vercel (instant for proxied records).

### Admin image (step 2.1 + 2.6, started 2026-11-19)

- `apps/admin/next.config.ts` turns on `output: "standalone"` and `outputFileTracingRoot` (repo root) **only** when `NEXT_OUTPUT=standalone`; Vercel never sets it, so Vercel builds are unchanged.
- `apps/admin/Dockerfile` (context = repo root; the root `.dockerignore` keeps every `.env*` out): `turbo prune admin --docker` → `pnpm install --frozen-lockfile` → `pnpm --filter admin build` → `node:24-slim` runner as user `node`, `node apps/admin/server.js` on port 3000, health check on `/manifest.webmanifest`.
- `.github/workflows/admin-image.yml` pushes `ghcr.io/<owner>/tallaby-admin:main` and `:sha-<short sha>` (linux/amd64) on pushes to `main` that touch admin, `packages/**`, the lockfile or the build files, or when run by hand.
- **GitHub repository variables** (Actions › Variables, not secrets; build args inlined in the bundle): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PROJECT_ID`, `NEXT_PUBLIC_SUPABASE_ADMIN_AUTH_COOKIE_NAME`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`, `NEXT_PUBLIC_ECOMMERCE_URL`, `NEXT_PUBLIC_ECOMMERCE_DOMAIN`, `NEXT_PUBLIC_META_PIXEL_ID`. One set of variables = one environment; a staging image needs its own set.
- **Coolify runtime env** (names only; values come from the admin Vercel project):
  - Required: `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` again (Settings › Services reads them at run time), `REVALIDATE_SECRET`, `ECOMMERCE_URL`, `DASHBOARD_URL`, `ADMIN_URL`, `ECOMMERCE_DOMAIN`, `CRON_SECRET`.
  - Per feature: `STOREFRONT_VERCEL_TOKEN`, `STOREFRONT_VERCEL_PROJECT_ID`, `STOREFRONT_VERCEL_TEAM_ID` (custom domains, until §2 #1 changes); `GOOGLE_GENERATIVE_AI_API_KEY`, `AI_ENABLED`, `AI_MODEL_SMART`, `AI_MODEL_FALLBACKS`, `AI_ADMIN_PRODUCT_AUTOFILL_DAILY_LIMIT` (AI); `VAPID_PUBLIC_KEY` (or `NEXT_PUBLIC_VAPID_PUBLIC_KEY`), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (admin push); `TALLABY_EASYKASH_API_KEY` (Tallaby Pay); `EXCHANGE_RATE_API_KEY` (only if the admin billing page refreshes the rate).
  - Set by the image: `NODE_ENV`, `PORT=3000`, `HOSTNAME=0.0.0.0`. Still read, replaced in step 2.3: `VERCEL_URL` (`app/layout.tsx` metadata base, falls back to `http://localhost:3000` when unset), `VERCEL`, `VERCEL_GIT_COMMIT_SHA`, `VERCEL_DEPLOYMENT_ID`.
- Not done yet: the admin cron (`/api/cron/admin-push`, step 2.5), a first real image build in CI, the Coolify app on the VPS.

### Admin live on Hetzner (2026-11-19)

- Server `tallaby-prod-1` (Hetzner CPX22, Nuremberg, 2.28.78.10, Ubuntu 26.04): SSH key only, unattended upgrades, fail2ban, 4 GB swap, backups on, firewall `tallaby-prod` (22, 80, 443, ICMP open; 8000 from the owner's IP only, to be closed now that Coolify is at `deploy.tallaby.com`).
- Coolify v4.7.5 at `https://deploy.tallaby.com`. Project "Tallaby" › production › app `tallaby-admin` (`ghcr.io/elsharkawy159/tallaby-admin:main`, port 3000), domains `admin.tallaby.com` and `admin-hz.tallaby.com`, 17 runtime env vars (Vercel's admin production list), scheduled task `admin-push` at `50 4 * * *` UTC. The server pulls from GHCR with a `read:packages` token (expires 2027-11-18).
- CI: `admin-image.yml` redeploys through Coolify's API after each push of `:main` (secret `COOLIFY_ADMIN_DEPLOY_TOKEN`, Deploy + Read on that app only; Coolify API open to every IP, token-protected).
- DNS: Cloudflare A `admin.tallaby.com` → 2.28.78.10 (DNS only, TTL 60) overrides the `*` wildcard. **Rollback = delete that record** (traffic goes back to the Vercel admin project, which stays deployed). The first Let's Encrypt try failed because Traefik asked before DNS pointed at the server; restarting `coolify-proxy` fixed it. For the next app: add the DNS record first, then the Coolify domain.
- No Supabase database webhook calls `/api/cron/admin-push` on production (checked), and admin push has no VAPID keys on Vercel either, so `CRON_SECRET` only has to match the Coolify task.

## 7. Before deciding

- Compare the real Vercel bill with Hetzner + Cloudflare for SaaS + the ops time a self-managed server needs.
- Owner decisions: custom-domain provider (Cloudflare for SaaS vs Caddy), where staging runs, whether `apps/shipping` moves.
