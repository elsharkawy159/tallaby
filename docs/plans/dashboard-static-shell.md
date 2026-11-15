# Dashboard: static per-locale shells with client-side data

Status: plan (2026-11-15), not started. Owner decisions (2026-11-15): static shell per locale + client data (not a full SPA); `[locale]` with `localePrefix: 'as-needed'` (Arabic keeps today's URLs, English gets `/en/...`); good storefront ↔ dashboard freshness. Scope: `apps/dashboard`, plus small additive changes in `packages/cache` and the ecommerce revalidation receiver. Rules: CLAUDE.md 3, 4, 5, 8, 10, 13, 14, 15, 16, 21. Add as a feature to `ROADMAP.md` §5 intake before Phase 0 (rule 19).

## 0. What the code does today (verified 2026-11-15)

- **74 `page.tsx`**; 55 files mention `force-dynamic` = 34 pages + 20 route handlers (incl. `.well-known/oauth-authorization-server/route.ts:4`, every `api/cron/*`, `api/oauth/*`) + one comment (`app/layout.tsx:53-55`). No `revalidate`/`fetchCache`/`runtime`/`instant` exports.
- **Why every route is dynamic:**
  1. Root layout `app/layout.tsx:62` calls `getLocale()`, which reads the `locale` cookie (`i18n/request.tsx:12-13`). This alone makes all 74 routes dynamic.
  2. `(main)/layout.tsx:38-71` awaits `getSessionUser()`, `getSellerAccess()` (`redirect("/signup")` / `<SellerAccessBlocked>`), wallet, heard-about-us, welcome gift, store link, account money, `getSellerStores()` (reads `tallaby_store` cookie), `getEgpPerUsd()`, plus `SidebarData` counts. `(builder)/layout.tsx:16-22` repeats the gate.
  3. Pages await `searchParams`/`params` at the top (e.g. `(main)/page.tsx:49-58`, `orders/page.tsx:20-23`, `stores/[storeId]/products/page.tsx:14`; products layout `:19-20`); loaders read `cookies()` (page size, `vendor-products.data.tsx:30-36`); DB reads are uncached (correct under rule 8).
- **i18n:** `ar` (default) / `en` (`i18n/config.ts`), cookie only, no `[locale]`; `proxy.ts:19-25` resets unknown cookie values; switcher → `setLocale` (`actions/locale.ts:7-14`: cookie + `revalidatePath("/", "layout")`) → `router.refresh()`. `typescript.ignoreBuildErrors: true` (`next.config.ts:6`).
- **Auth in proxy:** `updateSession` (`supabase/middleware.ts:55-73`): public `/login*`, `/signup*`, `/roadmap`, `/.well-known/*`; signed-out → `/login` (keeps `next` for `/oauth/authorize`, `/ai-builder`). Matcher skips `api/`, `_next`, `sw.js`, manifest, robots, sitemap, images. So a static shell never reaches a signed-out user.
- **Ownership guards:** `requireSeller`, `requireStore` (`lib/auth/require-seller.server.ts:84-115`), `requireOrdersView` (`:154-161`, F-84 order lock). Every new data endpoint must call them.
- **React Query:** provider in root layout (`providers/use-query.tsx`, staleTime 60 s, browser singleton); only Website › Templates uses it (keys include `storeId`, fetcher is a server action that calls `requireStore`): the in-repo precedent.
- **Realtime:** the bell subscribes to private `user:<id>`, event `seller_notification` (`components/layout/notification-bell.client.tsx:35-85`), polls 60 s only while unsubscribed, refetches on focus. Payload is only `{type}` (migration `0098`). Types in `packages/lib/src/notifications/notifications.lib.ts:31-67`.
- **`@workspace/cache`:** `createCachedQuery` wraps `unstable_cache` (`packages/cache/src/cached.ts`); `tags.ts:9-13` has no order/cart/wallet tags; `storeTags` carry the seller id; `applyInvalidation` → `updateTag` (action) or `revalidateTag(tag, "max")` + broadcast (`apply.ts:271-287`); receiver `handler.ts:233-234`. ~50 dashboard files call `applyInvalidation`.
- **Storefront → dashboard today:** `createOrder` broadcasts inventory tags only (`apps/ecommerce/actions/order.ts:290-293`, cancel `:870-873`); new orders reach the dashboard only via the `order_created` bell + realtime nudge.
- **Migration surface:** 120 unprefixed `revalidatePath(` in 63 files; 113 `router.refresh()`; 85 `@/app/...` imports; 20 server-action files call `getTranslations`/`getLocale`; 9 client files use `useSearchParams`.
- **Reference in repo:** `apps/ecommerce` already runs next-intl with `[locale]`, `as-needed`, `localeDetection: false` (`i18n/routing.ts`), `i18n/request.ts` (explicit locale → `next/root-params` → legacy `requestLocale` for actions/handlers), `app/global-not-found.tsx`, `[locale]/[...rest]`, and a proxy chaining `createMiddleware(routing)` into `updateSession(request, response)` (`apps/ecommerce/proxy.ts:28,114-118`). **Copy it; don't invent a new pattern.**
- Docs read: `node_modules/next/dist/docs/01-app/02-guides/{migrating-to-cache-components,authentication-with-cache-components,internationalization}.md`, `route-segment-config/instant.md`, `functions/{next-root-params,revalidateTag}.md`, route handlers; next-intl routing + root-params (`setRequestLocale` deprecated for `next/root-params` in Next 16.3).

## 1. Target architecture

```
Browser ─► proxy.ts
  1. next-intl middleware (ar default, as-needed, localeDetection off, cookie "locale" 1y)
       /orders → rewrite /ar/orders · /en/orders passes · /ar/orders → 307 /orders
  2. Old-preference rule: unprefixed GET page nav with locale=en → 307 /en/<path><search>
     (not server actions, RSC requests or POSTs)
  3. updateSession(request, i18nResponse): Supabase cookies; signed-out → /login or /en/login
     with ?next=; public-path checks on the de-prefixed path
  4. api/, .well-known/, sw.js, manifest, robots, sitemap, images skip the locale step
─► Static shell per locale (prerendered, CDN)
  app/[locale]/layout.tsx: <html lang dir>, fonts, NextIntlClientProvider, Theme, Query, Toaster;
    generateStaticParams → ar, en
  app/[locale]/(main)/layout.tsx: static frame + sidebar/header skeletons; seller parts behind <Suspense>
  page: static header/tabs/labels/skeletons; params/searchParams/cookies only below <Suspense>
─► Data, per area:
  A. Streamed server component (existing *.data.tsx loaders, uncached) for forms/settings
  B. React Query for fresh lists (orders, home KPIs, products, inventory, sidebar counts):
     useQuery(qk.<area>(storeId|"account", filters)) → GET /api/dashboard/... handler
     → requireSeller/requireStore/requireOrdersView (never a client-sent sellerId)
     → existing *.query.ts → JSON, Cache-Control: private, no-store
     Mutations stay server actions → applyInvalidation(mode "action") + client invalidateQueries
─► Freshness
  Server: dashboard action → updateTag + broadcast → ecommerce /api/revalidate
  Client: one SellerRealtimeBridge on user:<id>; seller_notification {type} → invalidate per §4.1;
    focus refetch everywhere; orders/home staleTime 10 s + 30 s interval while realtime is down;
    queryClient.clear() on sign-out / user change
```

- **Query keys** (`lib/query/keys.lib.ts`): `[area, storeId | "account", ...params]`. The `storeId` only keys the cache; the handler re-checks it (rule 5).
- **Reads via route handlers** (GET, parallel, abortable, real status codes). Server actions may run one at a time per client (**not verified for 16.3**; check in the Phase 2 spike). Handlers can't use `next/root-params`, so they take a validated `?locale=` (`hasLocale`) or return locale-neutral values.

## 2. What may be cached where

| Data | Server cache | Client (React Query) | Notes |
|---|---|---|---|
| Shell (layouts, labels, messages, nav) | Prerendered per locale | n/a | No seller data in the shell, ever. |
| Platform data (templates, rate, platform categories, roadmap) | Allowed (existing `createCachedQuery`) | optional | Keep `unstable_cache`; don't rewrite. |
| Existing seller-keyed caches (reports, GA4 views, product views) | Keep as is | yes | No new server caches. |
| Products, categories, brands, coupons, settings, website | Not server-cached in the dashboard | staleTime 60 s | Invalidate on mutations and `low_stock`. |
| **Orders, carts, wallets, top-ups, builder drafts, secrets** | **Never** (rule 8) | staleTime 0–10 s, realtime + focus | `private, no-store`; keep `data-clarity-mask`. |
| Session | Never | — | `use cache: private` would need owner approval. |

Owner approval needed for: any new `use cache` over seller data (none proposed); `use cache: private`; the realtime migration (4.4); `experimental.globalNotFound` and Turbopack for `next dev`.

## 3. Phased rollout

Every task is its own reviewed commit on `main` (rule 21), running `pnpm --filter dashboard lint`, `typecheck`, `test` and `next build`, with manual E2E logged in `PLAN.md` §23. **Always run `typecheck` explicitly: `ignoreBuildErrors` hides type errors from `next build`.** Check `git status` first; the codemod refuses a dirty tree, so wait for a clean tree or insert opt-outs by hand (rule 16).

### Phase 0: Cache Components on, nothing changes for users (M)
- **0.1 Baseline (S):** record the build route table (all `ƒ`), Lighthouse mobile Arabic for `/`, `/orders`, `/stores/<id>/products` (LCP/FCP/TTFB), Vercel build time.
- **0.2 One atomic commit (M):** `cacheComponents: true`; remove the 54 `dynamic` exports; give request-free GET handlers `await connection()` (notably `.well-known/oauth-authorization-server`, which would otherwise freeze at build); run `npx @next/codemod@latest cache-components-instant-false ./app` (expect ~74 pages + 9 layouts with `instant = false`); fix `useSearchParams` outside Suspense (9 files, e.g. `login/page.tsx:38`); check `createCachedQuery` on `/reports` and analytics. **Accept:** build passes; behaviour unchanged; E2E login/logout, orders action, product edit → storefront, editor publish, `.well-known` issuer, a cron run, wallet top-up return.

### Phase 1: `[locale]`, `as-needed`, root params (L, in steps)
- **1.1 (S):** `i18n/routing.ts` (`defineRouting`: ar/en, default ar, as-needed, detection off, cookie `locale` 1y, same name so English sellers keep their choice), `i18n/navigation.ts`; `config.ts` re-exports.
- **1.2 Atomic move (L):** `git mv` `(main)`, `(builder)`, `login`, `signup`, `oauth`, `print`, `roadmap`, `layout.tsx`, `not-found.tsx` into `app/[locale]/`; keep `api/`, `.well-known/`, manifest, robots, sitemap, favicon, globals at the root. Locale layout: `generateStaticParams`, `hasLocale` → `notFound()`, `lang`/`dir`/font from the param. Add `[locale]/[...rest]` + `global-not-found.tsx`. `request.tsx` copies ecommerce's resolution order (the `requestLocale` fallback keeps the 20 server-action files working). Proxy: `updateSession(request, response)`, de-prefixed public checks, prefixed login redirects, old-preference redirect, `.well-known` excluded. Fix the 85 `@/app/...` imports. **Accept:** every old URL renders the same Arabic page (incl. `/oauth/authorize?…`, `/print/orders?ids=`, `/roadmap`, editor, `/wallet/top-up?…`); `/en/orders` is English `dir="ltr"`; `/ar/orders` → `/orders`; `/orders` with `locale=en` → `/en/orders` with the query kept; `/api/*`, `.well-known`, `sw.js`, manifest, robots, sitemap byte-identical; MCP OAuth end to end; login with `?next=`.
- **1.3 (M):** `revalidateDashboardPath()` helper revalidating each locale (or `/[locale]` patterns); replace the 120 calls area by area; drop `revalidatePath("/", "layout")` from `setLocale`.
- **1.4 (S):** switchers call `setLocale` then `router.replace(pathname, { locale })` from `@/i18n/navigation`.
- **1.5 (L, ~10 small commits):** move `next/link` (84 files), `redirect` (16), `useRouter` (35), `usePathname` to `@/i18n/navigation`. Until done, English users take one extra 307 hop; nothing breaks.
- **1.6 (S):** emails/backend keep unprefixed links (old-preference redirect handles English); optionally prefix push URLs by subscription locale (`push-alerts.lib.ts:218`); `sw.js` and `manifest start_url "/"` unchanged.

### Phase 2: shell foundation and pilot (L)
- **2.0 Static `(main)` + root layouts (L, the critical step):** root layout reads no request data. `(main)`: static frame; `<Suspense fallback={<SidebarSkeleton/>}><SidebarData/></Suspense>` (later a static `SidebarFrame` from `sidebar.config`); header frame with streamed wallet/store link; seller gate in `<Suspense fallback={null}><SellerGate/></Suspense>` (redirect or full overlay), `children` outside it; money providers take promises + `use()`; dialogs/SetupPrompts/Clarity behind Suspense. `(builder)` keeps `instant = false` with a reason. Data foundation: `lib/query/keys.lib.ts`, `lib/query/fetch-json.lib.ts` (401 → login, 403 → blocked, 404 → not found), focus refetch, `components/layout/seller-realtime.client.tsx` (one shared `user:<id>` channel refactored from the bell, not a second channel), clear cache on auth change. **Accept:** `(main)` routes `◐`; on Slow 4G first paint shows frame + heading; blocked/no-seller, welcome gift, negative wallet, heard-about-us still work; no CLS.
- **2.1 Pilot `/stores/[storeId]/products`** (dynamic param, filters, cookie, layout guard, storefront revalidation, no money). **2.1a (S):** pass `params`/`searchParams` promises into Suspense children, move `loadStorePage` into a child; spike whether a `[storeId]` route gets a fallback shell without `generateStaticParams` (**not verified**; decide then, never a fake id silently). **2.1b (M):** `app/api/dashboard/stores/[storeId]/products/route.ts` (GET, `requireStore`, zod filters + validated locale, reuse `products-list.query.ts`, `private, no-store`); client list with `useQuery`, `keepPreviousData`, next-page prefetch (copy `templates.client.tsx:106-135`); invalidate `qk.products(storeId)` after actions (wiring next to callers, not in `actions/products.ts`, rule 14). **Accept:** foreign/forged `storeId` → API 404 + UI 404 (integration test); edit updates list now and storefront within one request; filters/paging in URL; LCP before/after.

### Phase 3: roll out by area (S/M each)

| Order | Area | Pattern | Notes |
|---|---|---|---|
| 3a | Rest of Products (inventory, trash, categories, brands, add/edit, from-file, bulk-edit) | A forms, B lists | |
| 3b | Orders (list, delivery, missed, pending-carts, customers, riders, cross-sell, new, scan) | B | Handlers call `requireOrdersView`/`requireOrdersStore`/`requireOrderSeller` (F-84); staleTime 10 s; never server-cached; order lock notice streams. |
| 3c | Home | B KPIs/chart/recent orders, A rest | `order_created` → `home`. |
| 3d | Customers, reviews, marketing, earn | A, B long lists | |
| 3e | Settings, website, apps, shipping, analytics, reports | A | Templates already B. |
| 3f | Wallet, top-up, financial, plan | A or B staleTime 0 | Never server-cached; payment return keeps `instant = false` unless it streams cleanly. |
| 3g | Login, signup, roadmap | static shell | `/oauth/authorize`, `/print/orders` keep `instant = false` with a reason. |
| 3h | Builder, ai-builder | excluded | Dynamic with a reason; drafts never cached. |

### Phase 4: storefront ↔ dashboard freshness (M)
- **4.1 Event map** (`lib/query/realtime-invalidation.lib.ts`, unit-tested): `order_created` → orders, home, sidebar-counts, products, inventory; `deposit_*` → orders, home; `first_order_top_up` → orders, wallet, home; customer cancel → orders, inventory (**no bell row today: focus/interval only**); missed orders → focus/interval; `question_received`/`review_received` → reviews; `low_stock` → inventory, products; `carrier_*` → orders, delivery; `top_up_*`/`plan_*`/`app_*`/`welcome_gift_*`/`referral_*` → wallet, account, sidebar-counts, earn; `theme_request_updated` → theme-requests; dashboard writes → matching key in the same tab (server side already via `applyInvalidation`).
- **4.2 (S each):** add missing `applyInvalidation` with `tags.ts` builders: review moderation (`actions/reviews.ts`, ecommerce caches `reviewTags.seller`); check shipping zones, discount rules, blocked phones, product questions (**not verified**).
- **4.3 (S, additive):** optional `expire: 0` / `urgent` on the broadcast payload (`broadcast.ts`, `handler.ts:233`) for seller-visible edits; old receivers ignore it.
- **4.4 (owner approval + migration):** `store_id` in the realtime payload; `orders` AFTER UPDATE trigger → `seller_orders_changed` for cancellations/payments. Without it, focus/interval bounds the delay to ~30 s.
- **4.5 (S, optional):** `BroadcastChannel` relays invalidations across tabs.

### Phase 5: measure and clean up (S)
Route table target: `◐` for all `(main)` routes; only builder, `oauth/authorize`, `print`, payment return stay opted out with reasons; no `TODO: Cache Components adoption` left; Lighthouse and build time before/after; optional `@next/playwright` `instant()` tests; remove dead cookie-locale code and redundant `router.refresh()`; update `PLAN.md` §23, `ROADMAP.md`, `docs/caching-and-data-fetching.md`.

## 4. Risks and mitigations
1. **Tenant isolation (rule 5):** every GET handler re-checks from the session; `storeId` is a cache key only; integration test per handler with a foreign store; cache cleared on sign-out; `private, no-store`; `api/` skips the proxy so handlers self-authenticate.
2. **Auth flash:** signed-out never sees the shell (proxy redirect). Blocked/no-seller briefly sees frame + skeletons, then the overlay/redirect; endpoints refuse, so no data leaks (Q3).
3. **OAuth/MCP/payment callbacks:** URLs kept (Arabic rewrite); English redirect only on GET page navs with the query kept; `/api/oauth/*` and `.well-known` outside `[locale]`; `.well-known` needs `connection()`.
4. **Service worker / push:** unprefixed links still resolve; `sw.js` and headers unchanged.
5. **RTL/LTR:** `dir` + fonts from the param, one shell per locale; check `DirectionProvider` and toaster in both.
6. **Builder:** stays dynamic; its `revalidatePath` calls need the 1.3 helper.
7. **Build time:** ~74 × 2 shells, mostly fallback shells; measure in 0.1 and 5.
8. **`ignoreBuildErrors`:** run `typecheck` every task; removing the flag is a separate task.
9. **Actions/handlers lack `next/root-params`:** `requestLocale` fallback; handlers take a validated locale.
10. **next-intl `as-needed` cookie:** opening an `/en` link saves English as the preference (Q1).
11. **Shared packages:** ecommerce/admin don't run Cache Components; keep `createCachedQuery`; broadcast change is additive.
12. **Others' uncommitted work vs the codemod:** clean tree or manual opt-outs (rule 16).

## 5. Open questions for the owner
1. Should an unprefixed link (email/push) send an English-preferring seller to `/en/...` (plan: yes)? And should opening an `/en/...` link save English as the preference (next-intl default) or only the switcher (today's rule)?
2. Approve the Phase 4.4 realtime migration (`store_id` in payload + order-status event)? Without it, cancellations reach an open dashboard via focus/interval (~30 s).
3. Is a brief empty frame acceptable for blocked / not-yet-seller accounts before the blocked screen or `/signup` redirect? (The alternative keeps `(main)` blocking and gives up the static shell.)
4. May we enable `experimental.globalNotFound` and switch `next dev` from `--webpack` to Turbopack (needed by the adoption verification tool)?

## 6. Sizes and order

| Phase | Size | Order |
|---|---|---|
| 0 Enable Cache Components | M | 1 |
| 1 `[locale]` (1.5 can run alongside Phase 2) | L | 2 |
| 2 Shell foundation + pilot | L | 3 |
| 4.1–4.3 Freshness | M | 4 (with 3b orders) |
| 3 Area rollout 3a → 3h | L | 5 |
| 4.4 Realtime migration (if approved) | S + migration | after Q2 |
| 5 Measure and clean up | S | last |

Each step ships alone and can be reverted: the flag lands fully opted out, URLs change with no rendering change, then the shared shell, one pilot, then area by area.
