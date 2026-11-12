# Tallaby App Center: registry, manifests and the public catalog

Owner request 2026-11-12 (ROADMAP.md F-93): one hub for every Tallaby app and
integration, built so a separate apps.tallaby.com (and later third-party
developers) can grow out of it.

## 1. Pieces

| Piece | Where | What it holds |
| --- | --- | --- |
| Registry | `packages/apps` (`@workspace/apps`) | One manifest per app. Pure data: no secrets, no store data, no server code. |
| Catalog adapter | `packages/lib/src/integrations/catalog.ts` | The old `STORE_APPS` shape, built from the manifests, for the install engine (`billing/app-billing.server.ts`), app requests and the Shipping / Payment methods pages. |
| Install state | DB: `store_app_installs` (0139), `store_integrations` (0056+), `store_app_requests` (0143), `agent_grants` (0133) | Per store. Read only through `@workspace/lib` server code that filters by seller and store. |
| Secrets, connect and install logic | `packages/lib/src/integrations/*.server.ts`, `packages/lib/src/billing/` | Never in the registry. |
| App Center UI | `apps/dashboard/app/(main)/stores/[storeId]/apps/` | List, app page `[slug]`, settings `[slug]/settings`. |
| Public catalog API | `apps/ecommerce/app/api/apps/catalog/` | Read-only JSON for tallaby.com and apps.tallaby.com. |

## 2. Manifest format

Schema: `packages/apps/src/manifest.ts` (`appManifestSchema`, strict: unknown keys fail).

| Field | Meaning |
| --- | --- |
| `id` | Stable snake-case id (`APP_IDS`). Equals the old catalog key and, for integrations, the `store_integrations.provider`. Never rename it: install rows and wallet claims use it. |
| `slug` | URL segment, the id in kebab case (`size_chart` → `size-chart`). |
| `kind` | `app` (built by Tallaby, runs inside Tallaby) or `integration` (connects another company's service). |
| `category` | `ai`, `storefront`, `tracking`, `shipping`, `payments`, `data`, `messaging` (display order). |
| `mechanism` | How it works (`script`, `server`, `carrier`, `gateway`, `widget`, `feed` …), shown as a tag. |
| `name`, `vendor`, `summary`, `description`, `highlights[]` | `{ ar, en }`, both required. Summary is the card line; description and highlights fill the app page. |
| `keywords[]` | Latin names and synonyms for search. |
| `icon` | `background`, `foreground` (hex), `dark?`, `image?` (a path in the dashboard's `public/`, e.g. `/app-logos/bosta.png`). The SVG glyph is mapped in the dashboard (`apps-brand.lib.ts`). |
| `screenshots[]` | `{ src, alt }`, may be empty. |
| `pricing` | Same union as `AppPricing` (US cents): `free`, `one_time`, `monthly`, `per_order`, `usage`. The install engine charges from this. |
| `providerFees` | The other company charges its own fees on the seller's account with them. |
| `plans` | `free`, `pro`. Data only for now (every app is on both). |
| `developer` | Key of `APP_DEVELOPERS` (only `tallaby` today). |
| `status` | `live`, `beta`, `coming_soon`. |
| `installMode` | `toggle` (install engine, `store_app_installs`), `connect` (account, id or key), `request` (F-62), `builtin` (every store has it). |
| `settingsRoute` | Key in `APP_SETTINGS_ROUTES`, or null. The dashboard maps each key to a screen (`_settings/settings-routes.data.tsx`, typed `Record<AppSettingsRoute, …>`). |
| `surfaces[]` | Where it acts: `storefront.product_page`, `storefront.script`, `storefront.checkout`, `server.events`, `orders`, `orders.export`, `shipping`, `payments`, `catalog.import`, `catalog.feed`, `customer.messages`, `agent`. Data only today; the future permission model keys on it. |
| `requires[]` | Other app ids it needs first (data only). |
| `docsUrl` | Public https guide on tallaby.com. |
| `internal` | Server wiring, never public. `provider` = its `store_integrations.provider`. |

Rules the schema enforces: slug = kebab id; a coming-soon app has no settings
route; a live app is never `request`; an app cannot require itself; `docsUrl`
is https. The tests add: one manifest per id, unique slugs, Arabic text really
Arabic, every `requires` real, and every live app has settings or installs
with one click.

## 3. Adding an app

1. Add the id to `APP_IDS` and write `packages/apps/src/manifests/<id>.ts`
   with `defineApp({...})`; add it to `manifests/index.ts` in display order.
2. Integration with a DB row: add the provider to
   `packages/lib/src/integrations/registry.ts` and the `store_integrations`
   CHECK (a migration). A `toggle` app needs nothing in the DB.
3. Settings screen: add a key to `APP_SETTINGS_ROUTES` (or reuse one), then a
   loader in `apps/dashboard/.../apps/_settings/settings-routes.data.tsx`
   rendering the screen (`*.client.tsx` beside it, server actions that call
   `requireStore` and take an explicit `storeId`).
4. Glyph: add the id to `GLYPHS` in `apps-brand.lib.ts` (TypeScript asks).
5. Storefront surface, if any: render it on that store's host only (rule 9),
   gated on its install row, cached with a tag that includes the seller id.
6. Update `packages/lib/src/integrations/catalog.test.ts` (the pinned list)
   and ROADMAP.md.

## 4. Dashboard routes

| Path | What |
| --- | --- |
| `/stores/:storeId/apps` | App Center: search, category chips, All / Installed. `?tab=installed&category=shipping&q=…` keep the view. |
| `/stores/:storeId/apps/:slug` | App page: overview, price, plans, developer, main action. |
| `/stores/:storeId/apps/:slug/settings` | The app's settings screen (redirects to the app page when it has none). |

Old links: `/apps/bosta`, `/apps/wassalha`, `/apps/size-chart`,
`/apps/ai-assistants` keep their URL (now the app page); `/apps?google=…`
redirects to Google Sheets › Settings (`legacy-routes.lib.ts`, tested).
Store settings › Payment methods stays where it is (COD, transfer wallets,
deposit; the gateway card is shared with Paymob / Kashier settings).

## 5. Public catalog API

Served by the ecommerce app (it serves tallaby.com), no auth, no database.

- `GET /api/apps/catalog?locale=ar|en` → `{ "version": 1, "locale": "ar", "apps": [PublicApp, …] }`
- `GET /api/apps/catalog/:idOrSlug?locale=…` → `{ "version": 1, "locale": "en", "app": PublicApp }`, or 404 `{ "version": 1, "error": "not_found" }`

`PublicApp` (`packages/apps/src/public.ts`, an allow-list):
`id, slug, kind, category, name, vendor, summary, description, highlights[],
icon { background, foreground, imageUrl }, screenshots[{ url, alt }], pricing,
providerFees, plans, developer { id, name, url }, status, installMode,
surfaces, requires, docsUrl`. Never `internal`, `settingsRoute`, dashboard
paths or any store data. Locale defaults to Arabic. Image URLs are absolute on
`NEXT_PUBLIC_DASHBOARD_URL`.

Caching: `Cache-Control: public, max-age=300, s-maxage=3600,
stale-while-revalidate=86400` (the data changes only with a deploy).
CORS: `Access-Control-Allow-Origin` echoes `https://tallaby.com` or any
`https://*.tallaby.com` origin (`Vary: Origin`); localhost outside
production. A breaking change bumps `version` and keeps v1 for a while.

## 6. Toward apps.tallaby.com and third-party apps (design notes only)

Nothing below is built.

- **apps.tallaby.com** reads the public API for listings and app pages, and
  sends "Install" to `dashboard.tallaby.com/stores/<store>/apps/<slug>` after
  the seller picks a store (installs stay in the dashboard, per store).
- **Developer accounts:** a `developers` table (verified company, payout
  details); `APP_DEVELOPERS` becomes a lookup; manifests from developers live
  in the DB (same schema, `developer = <id>`, reviewed before `status` goes
  `live`), merged with the code manifests by id.
- **Permissions:** an install grants OAuth scopes derived from `surfaces`
  (e.g. `orders:read`, `products:write`, `storefront.script`), reusing the MCP
  OAuth tables (`oauth_clients`, `agent_grants`, `agent_tokens`, 0133) with a
  per-store grant, shown to the seller on install.
- **Webhooks:** per-install endpoint + signing secret (encrypted like other
  credentials), events such as `order.created`, `order.status_changed`,
  `app.uninstalled`; retries with an idempotency key.
- **Billing:** the install engine already charges by manifest pricing into the
  store wallet; revenue share and developer payouts are a separate ledger.
- **Storefront code:** still no seller- or developer-supplied scripts (rule 9):
  a third-party storefront surface would be a fixed Tallaby-rendered block fed
  by the app's API, or a sandboxed iframe on that store's host only.
