# Dashboard performance: static shells (PPR), a lighter layout, a lighter bundle

Status: plan (2026-11-26), not started. It continues [`dashboard-static-shell.md`](dashboard-static-shell.md): Phases 0, 1.1–1.5 of that plan are done (Cache Components on, everything under `app/[locale]`, `revalidateDashboardPath`, `@/i18n/navigation`), and this plan replaces its Phases 2–5 with concrete steps based on the code as it is today and the Next 16.3.3 docs. Owner answers recorded in that plan (§5) still apply. Scope: `apps/dashboard`, plus small additive changes in `packages/lib` (billing read) and `packages/db` (none planned). Rules: CLAUDE.md 3, 4, 5, 8, 10, 14, 15, 16, 19, 21.

Goal: a seller opening or navigating the dashboard sees the frame (sidebar, header, page title, skeletons) at once, from a prerendered shell, and the seller data streams in. Today every byte waits for ~30 DB queries and two Supabase Auth round trips.

## 0. Where we are (verified 2026-11-26)

### 0.1 Cache Components is on, but nothing is prerendered
- `next.config.ts:17` `cacheComponents: true`; 92 `export const instant = false` (every page and layout, including `app/[locale]/layout.tsx:20`). No `use cache` in the app. No `partialPrefetching`, `staleTimes` or other perf flags.
- Docs (`02-guides/migrating-to-cache-components.md`, `route-segment-config/instant.md`): `instant = false` is a migration stage. It only turns off validation; the route is as slow as before. "A `false` higher in the tree takes precedence over any deeper `true`" and "setting `false` on the root layout disables static shell validation for the entire app".

### 0.2 Why the first byte is slow
1. **`(main)/layout.tsx` awaits everything before rendering anything** (no `<Suspense>` in the root or `(main)` layout; `(main)/loading.tsx` sits *below* the layout so it can't help):
   - wait 1 `:46-48`: `getSessionUser()` → `getSellerAccess()`;
   - wait 2 `:63-81`: `Promise.all` of 8 loaders, several of which chain on `getSellerStores` internally;
   - after it `:84-88`: `loadSeller`, `loadOrderLock`;
   - wait 3 (render): `SidebarData` (async server component, `:97`) and `SiteDataProvider` calling `use(getSiteData())` with no boundary (`providers/site-data.tsx:25`), and `getSiteData()` only starts after waits 1–2.
2. **≈ 28 DB queries per layout render (≈ 31 worst case)**, competing with the page's own queries for a pool of `max: 4` on Vercel (`packages/db/src/drizzle/database.ts:38`; 20 self-hosted). Duplicates: `sellers` read 4+ times, `stores` 3 times, `billing_settings` + `exchange_rates` 2–3 times (`getBillingState` is not `cache()`d, `packages/lib/src/billing/billing.server.ts:9-13`), custom domain looked up twice (`getSelectedStoreLink` and `getSiteData`), 7 separate sidebar count queries (`components/dashboard/sidebar.server.ts:47-87`).
3. **Two Supabase Auth round trips per request on the server**: `proxy.ts:42` → `supabase/middleware.ts:71-73` `auth.getUser()`, then `lib/auth/session.server.ts:12` `auth.getUser()` again in the render (React `cache()` can't share the proxy's result). Plus one more in the browser from the bell (`notification-bell.client.tsx:64`). `getClaims()` is unused; `docs/egress-audit.md` lists it as an owner decision.
4. **Page waterfalls**: orders list `vendor-orders.data.tsx` runs 5 sequential waits (~15–20 queries); products layout awaits `params` + `loadStorePage` (2 queries, one uncached `select *`) before children start; products list runs count → ids → rows sequentially (`products-list.query.ts:215-226`).
5. **Wrong skeleton**: `(main)/loading.tsx` renders `HomeSkeleton`, so every `(main)` page without its own `loading.tsx` (wallet, stores, website, apps, analytics, …; only 13 have one) flashes the home skeleton.
6. **Security note found on the way**: `getSiteData()` → `getSellerProfile()` (`actions/seller.ts:24-44`) loads the **full `sellers` row** and sends it to the browser through `SiteDataProvider`. Must be narrowed to the columns the UI reads (rule 10 spirit; fix in A3).

### 0.3 Client bundle
- 287 `"use client"` files, **0 `next/dynamic`**. `recharts` is static in the home page (`_components/sales-chart.client.tsx`), reports and analytics. `@hello-pangea/dnd` ships with the products list (`manage-columns-dialog.client.tsx`), `@dnd-kit` with categories/brands pages, `@workspace/tiptap` with the product form. `xlsx`, `pdf-lib`, `qrcode` already use `import()`.
- Every `(main)` page pulls: the 820-line client `Sidebar.tsx`; the `@/stores` barrel (re-exports `add-product-form.store.ts` → the 453-line `add-product.schema.ts`) via `Sidebar.tsx:36`, `main-content-wrapper.tsx:4`, `dashboard-header.client.tsx:10`, `store-switcher.client.tsx:11`; `cmdk` (command palette); Supabase browser client + Realtime (bell); `MetaPixel` importing the whole `@workspace/lib/integrations` barrel (Shopify, Bosta, Wassalha, Google Sheets, Meta CAPI…; no `sideEffects` field anywhere, so tree-shaking is unverified); `NextIntlClientProvider` with **all** messages (`app/[locale]/layout.tsx:101`).

### 0.4 What the docs say we can use (Next 16.3.3, `node_modules/next/dist/docs/`)
- **PPR is the default under Cache Components**: `<Suspense>` fallbacks, module code and `use cache` results go in the prerendered shell; anything reading `cookies()`, `headers()`, `searchParams`, unknown `params`, `connection()` or uncached DB becomes a streamed hole at the nearest `<Suspense>` (`08-caching.md`, `streaming.md`). "A top-level `await` on the session in a layout holds the whole segment, including `{children}`" (`authentication-with-cache-components.md`).
- **Dynamic params without `generateStaticParams`** (our `[storeId]`, `[productId]`): "Next.js prerenders a static shell for the unknown params and streams the rest" ("served from Next.js 16.3"). `usePathname`/`useParams` **suspend** in such routes wherever the component sits — the sidebar, bottom nav and Meta Pixel must sit inside `<Suspense>` or the build fails.
- **`io()`** (`next/cache`, 16.3) for "now"/random values: suspends only during prerender, unlike `connection()` which also blocks prefetches.
- **`instant = true`** on a page validates both page load and client navigation in dev (overlay insight `blocking-route` names the blocking component). Build-time validation doesn't exist yet; the `○ / ◐ / ƒ` symbols in `next build` show the real result.
- **Prefetching**: with CC on and `partialPrefetching` off, a plain `<Link>` prefetches the cached (shell) render. `partialPrefetching: true` (top-level key, default false) shares one App Shell per route; `prefetch = 'force-disabled'` per segment for rarely-visited pages. Prefetch inlining is on by default since 16.3.
- **Self-hosting**: PPR works with `next start` / standalone Docker as origin-only streaming; every hop (Coolify/Traefik, Cloudflare) must not buffer or compress-buffer. Authenticated pages are sent `private, no-store`, so no CDN caching of HTML (matches rule 8 and `hetzner-migration.md` §"Cache only static assets").
- **Client data**: the docs' default is "pass a Promise and unwrap it with `use()`"; React Query only for shared client caches (polling, focus refetch), via route handlers.
- **Tools**: dev overlay insights + Navigation Inspector; `next build --debug-prerender`; `NEXT_PRIVATE_DEBUG_CACHE=1`; `@next/playwright` `instant()`; `pnpm next experimental-analyze` (Turbopack build) or `@next/bundle-analyzer` (webpack).

## 1. Target

```
request ─► proxy.ts  (next-intl + updateSession: ONE auth check, see A1)
        ─► prerendered shell for /[locale]/<route>   (same bytes for every seller)
             <html lang dir>, fonts, providers
             (main) frame: sidebar nav skeleton, header skeleton, page title, page skeleton
        ─► streamed holes, in parallel, each behind its own <Suspense>:
             <SellerGate/>     session → access → redirect /signup | <SellerAccessBlocked/> overlay
             <SidebarData/>    store list, counts, lock (one counts query)
             <HeaderData/>     wallet, store link, setup step, live dot
             <ShellDialogs/>   negative wallet, heard-about-us, welcome gift, Clarity identify
             page content      existing *.data.tsx loaders (uncached, rule 8)
```

- **No seller data in the shell, ever.** No `use cache` over seller data; `use cache: private` only with owner approval (§5).
- Page loaders keep calling `requireSeller`/`requireStore`/`requireOrdersView`; they already enforce access (`lib/auth/require-seller.server.ts:86-115`), so a blocked seller's page hole throws while the gate overlay renders (accepted by the owner, static-shell plan §5 Q3).

## 2. Phases

Each numbered step is its own reviewed commit on `main` (rule 21): `pnpm --filter dashboard lint`, `typecheck` (always: `ignoreBuildErrors` hides type errors), `test`, `next build` (compare the route table), manual E2E logged in `PLAN.md` §23. `git status` first (rule 16).

### Phase M: measure first (S)
- **M1 Baseline.** For `/`, `/orders`, `/stores/<id>/products`, `/wallet`, Arabic, mobile Slow 4G, signed in on production: TTFB, FCP, LCP, INP (Lighthouse + WebPageTest or Chrome trace), and client JS per route (`@next/bundle-analyzer`, or `next experimental-analyze` on a Turbopack build). Server: log layout wall time and query count once per request in dev (a temporary counter around `db`, not committed), and `next build` route table (expect all `ƒ`). Record in `PLAN.md` §23.
- **M2 Check streaming end to end** (before Phase B pays off): run `streaming.md`'s stream-observer script against the self-hosted dashboard through Cloudflare + Coolify. Chunks must arrive spread out; if they arrive together, fix proxy buffering/compression first (Traefik, Cloudflare settings). On Vercel streaming works.

### Phase A: quick wins, no rendering-model change (each S)
Independent of PPR; they make both the shell's holes and today's blocking render faster.

- **A1 One server auth round trip per request.** Proxy keeps refreshing the session cookie but checks the user with `supabase.auth.getClaims()` (local JWT verification against the project's JWKS; needs asymmetric JWT signing keys on the Supabase project, **verify on staging**), falling back to `getUser()` when claims are absent. Render keeps one cached `getUser()` (authoritative, still one per request). Saves one network trip on every page, prefetch and server action. **Owner decision** (listed as open in `egress-audit.md` §11). Also drop the bell's browser `auth.getUser()` (`notification-bell.client.tsx:64`) by passing the user id from the server.
- **A2 Fewer, parallel layout queries** (target ≤ 12):
  - wrap `getBillingState` in React `cache()` (`packages/lib/src/billing/billing.server.ts`; per-request only, no cross-request cache; ecommerce/admin unaffected in behaviour);
  - one SQL with `count(*) FILTER (...)`/sub-selects for the 7 sidebar counts (`sidebar.server.ts:47-87`), keeping the lock rules;
  - `getSiteData` reuses `getSelectedStoreLink`'s custom-domain result instead of a second lookup (check that they mean the same store: today one uses `sellers.subdomain`, the other the selected store; keep the current meaning, document it);
  - `cache()` `getStoreWalletBalance`, `needsHeardAboutUs`, `loadWelcomeGiftWatch`, `getSidebarCounts`, `getStore` (per-request dedupe only; wallet stays uncached across requests, rule 8);
  - start `getSiteData()` with the other loaders, not after them.
  - **Accept:** query counter shows ≤ 12 layout queries for an approved USD seller; same UI.
- **A3 Narrow the seller profile sent to the client** (`actions/seller.ts:24-44`): select only the columns `SiteDataProvider` consumers read. Security fix; ship early.
- **A4 Right skeletons.** Move `HomeSkeleton` from `(main)/loading.tsx` into a `(main)/(home)` group or the home page's own boundary, and give `(main)/loading.tsx` a neutral page skeleton (title bar + card). Add `loading.tsx` to the heavy routes missing one (wallet, stores, website, apps, analytics, settings sub-pages).
- **A5 Page waterfalls.** Orders: run `loadOrderRowContext` alongside the tab counts, and the id queries alongside `loadOrdersOverview` where inputs allow (`vendor-orders.data.tsx:25-64`). Products: run the count in parallel with ids (`products-list.query.ts:215-226`); stop selecting `*` in `getStore` for the layout. No query-semantics change.
- **A6 Bundle diet:**
  - `next/dynamic` for `SalesChart` (home), the reports and analytics charts (recharts), `ManageColumnsDialog` (`@hello-pangea/dnd`), the command palette body (`cmdk`, load on first ⌘K/click), and the tiptap editor in the product form (client components; skeleton as `loading`);
  - replace `@/stores` barrel imports in the shell (`Sidebar.tsx`, `main-content-wrapper.tsx`, `dashboard-header.client.tsx`, `store-switcher.client.tsx`) with direct file imports so the product-form schema leaves the shell;
  - `MetaPixel` imports `@workspace/lib/integrations/meta-pixel.lib` directly, not the barrel;
  - pass only the namespaces the client needs to `NextIntlClientProvider` (`messages={pick(...)}`) if M1 shows messages are a large share of the payload;
  - add `@workspace/ui` / `simple-icons` to `experimental.optimizePackageImports` only if the analyzer shows a gain (recharts, lucide-react, date-fns are already on the default list).
  - **Accept:** shell JS for `/orders` down measurably vs M1; no visual change.
- **A7 (optional, owner) DB pool on Vercel.** `max: 4` queues ~30 layout + page queries. Once A2 lands, re-measure; raise to 6–8 only if the Supabase pooler limits allow. Moot once the dashboard runs on Hetzner (`max: 20`).

### Phase B: static shells (the PPR work) (L, in steps)

- **B1 Root layout prerenders (S).** `app/[locale]/layout.tsx` reads only `params` (covered by `generateStaticParams`), so remove its `instant = false`. Wrap `MetaPixel` (uses `usePathname`) in `<Suspense fallback={null}>`; check `ClarityScript`, `ZodLocale`, `ThemeProvider` for request reads. `generateMetadata` reads only the locale param: fine. **Accept:** `next build` passes; pages unchanged (they still opt out below).
- **B2 `(main)` layout becomes a static frame (L, the critical step).** No top-level `await` in the layout:
  - `<Suspense fallback={null}><SellerGate/></Suspense>`: async server component doing today's `getSessionUser` → `getSellerAccess` → `redirect({ href: "/signup" })` or a full-screen `<SellerAccessBlocked/>` overlay, plus the restricted banner. `children` render outside it.
  - `<Suspense fallback={<SidebarSkeleton/>}><SidebarData/></Suspense>`. Split `Sidebar.tsx` into a static nav (from `sidebar.config`, no data) and streamed parts (store switcher, counts, active state via `usePathname` inside the boundary).
  - `<Suspense fallback={<HeaderSkeleton/>}><HeaderData/></Suspense>`: wallet, store link, live dot, setup step, the props `DashboardHeader` takes today. Same for `BottomNav` (`storeId`).
  - Providers that pages read (`SiteDataProvider`, `EgpRateProvider`, `AccountMoneyProvider`) take **promises** created inside a server component under the boundary and consumers `use()` them under Suspense (pattern in `authentication-with-cache-components.md` §"Share it"). Audit every consumer for a Suspense ancestor.
  - Dialogs (`NegativeWalletDialog`, `HeardAboutUsDialog`, `WelcomeGiftDialog`, `StoreLiveCelebration`, `ClarityIdentify`) move into one `<Suspense fallback={null}><ShellDialogs/></Suspense>` that keeps today's "one pop-up at a time" logic.
  - Skeleton sizes match the real sidebar/header to avoid CLS.
  - Remove `instant = false` from `(main)/layout.tsx`; every page under it still has its own `instant = false`, so nothing else changes yet.
  - `(builder)/layout.tsx` keeps `instant = false` with a written reason (drafts, editor; static-shell plan 3h).
  - **Accept:** E2E: approved seller, restricted (banner), blocked (overlay, no page data visible), customer account (→ `/signup`), signed out (proxy → `/login`), negative wallet dialog, welcome gift, heard-about-us, store switch, English `/en/...` RTL/LTR. No CLS in Lighthouse. Query count unchanged or lower.
- **B3 Pages adopt the shell, cheapest path first (M, area by area).** With B2 done, a page whose data sits under a `loading.tsx` (or its own `<Suspense>`) already has a shell: frame + skeleton. Per page:
  1. remove `instant = false`, set `export const instant = true` (dev validation of load + navigation);
  2. fix what the overlay reports: move top-level `await searchParams`/`params`/`cookies()`/`currentOrderLock()` into the Suspense child (pass the promise down; `orders/page.tsx:19-22`, `(main)/page.tsx:55-64`); replace `new Date()` outside Suspense with `io()` or move it under a boundary;
  3. render the page title, tabs and static labels outside the boundary so they're in the shell;
  4. `next build` shows `◐` for the route.

  Order (by traffic and risk): home → orders (list, delivery, missed, pending-carts, customers, riders, cross-sell) → products (B4) → reviews, coupons, marketing → settings, financial, reports, analytics, apps, website → wallet / top-up / plan (money pages: stream only, never cached; payment return keeps `instant = false` if it can't stream cleanly) → login, signup, roadmap (fully static). Kept dynamic with a reason: `(builder)`, `ai-builder`, `oauth/authorize`, `print/*`.
- **B4 `[storeId]` routes (M).** `stores/[storeId]/products/layout.tsx` stops awaiting `params` + `loadStorePage`: the store header/tabs become a Suspense child taking `params` as a promise; `requireStore` still runs in that child and in the page loader (rule 5; a foreign id still 404s). Check in the build that Next serves the App Shell for unlisted `storeId` (docs: 16.3 behaviour) — never add a fake id to `generateStaticParams`. Same for `apps/[slug]`, `settings`, `website/blog`, `website/forms` layouts and `[productId]/edit`.
- **B5 Clean up.** No `TODO: Cache Components adoption` left except the documented exceptions; update `docs/caching-and-data-fetching.md` (add a dashboard section; fix the `seller.tallaby.com` host name), mark the static-shell plan's phases.

### Phase C: faster navigation (S/M, after B3 covers the main areas)
- **C1** Leave `<Link>` prefetch on default: it now prefetches the shared shell (cheap, no DB). Set `export const prefetch = 'force-disabled'` only on rarely-used heavy routes if prefetch traffic shows up in server logs.
- **C2** Try `partialPrefetching: true` behind measurement (one App Shell per route, `instant-navigation.md` adoption order: CC first, then Partial Prefetching; codemod `remove-partial-prefetch` exists). Accept only if navigation INP/time-to-shell improves and server invocations don't rise.
- **C3** `experimental.staleTimes.dynamic` stays 0 (orders and wallet must be fresh; server-action revalidation clears the client cache anyway). Revisit only with owner approval.
- **C4 (owner approval)** `use cache: private` (browser memory only, never on the server) for the session-derived shell data that isn't money: seller profile, store list, nav. It gives a per-session App Shell on navigation (`stale` ≥ 5 min for the App Shell, `cacheLife.md`). Wallet, orders and counts stay uncached (rule 8). Needs owner approval (static-shell plan §2).
- **C5** Trim `router.refresh()` (122 calls in 71 files): after a server action that already calls `revalidateDashboardPath`/`updateTag`, the extra refresh doubles the render. Remove area by area, with E2E per area.

### Phase D: fresher lists without full re-renders (optional, M; from the static-shell plan Phases 2.1/3/4)
Only where M1/B3 show it's worth it (orders list, home KPIs, sidebar counts): React Query + GET route handlers under `app/api/dashboard/...` that call `requireStore`/`requireOrdersView` from the session (never a client-sent seller id; integration test with a foreign store), `Cache-Control: private, no-store`, query keys `[area, storeId, ...]`, one shared realtime bridge on `user:<id>` invalidating keys per the event map in the static-shell plan §4.1, cache cleared on sign-out. Everything else keeps streamed server components, per the docs' default.

### Phase E: self-hosted specifics (S, with the Hetzner move)
- Streaming verified through Cloudflare + Coolify (M2); no HTML caching rule at Cloudflare.
- `deploymentId` / `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` set so version skew after deploys triggers a clean reload (`self-hosting.md`).
- One replica per app (as `hetzner-migration.md` already assumes); no shared cache handler needed since there is no server `use cache` over seller data.

## 3. Expected gains (to confirm with M1)
| Change | What improves |
|---|---|
| A1 | −1 Supabase Auth round trip (≈ 50–150 ms) on every request, prefetch and action |
| A2, A5 | layout ≈ 28 → ≤ 12 queries; fewer pool waits on Vercel's 4 connections; hole TTFB down |
| A6 | less JS before the shell is interactive (charts, dnd, editor, cmdk, form schema out of the shared chunk) |
| B1–B4 | first paint no longer waits for any DB/auth work: FCP ≈ TTFB of a prerendered page + CSS; LCP when the first hole lands |
| C | near-instant tab switches from a prefetched shell |

## 4. Risks
1. **Tenant isolation (rule 5):** moving guards into Suspense children must not drop one; each page loader keeps its `require*` call; review every diff for it. The shell holds no seller data.
2. **Blocked/unapproved sellers** briefly see the frame; page holes refuse (`AccessError`), overlay covers. Accepted (static-shell plan §5 Q3). E2E each status.
3. **`redirect()` inside Suspense** after streaming starts becomes a client-side redirect: check `/signup` redirect for customer accounts and the `next` param.
4. **Client hooks in dynamic routes** (`usePathname`, `useParams`) suspend: sidebar, bottom nav, breadcrumbs, Meta Pixel must sit under Suspense, or the build fails (that's the safety net).
5. **CLS** from skeletons that don't match: size skeletons from the real components.
6. **`getClaims()`** trusts a JWT until it expires (a revoked session stays valid for up to its lifetime in the proxy only; the render still calls `getUser()`). Owner decision.
7. **Streaming buffered by a proxy** would hide every gain on self-hosting: M2 first.
8. **`ignoreBuildErrors`:** run `typecheck` every step.

## 5. Owner decisions needed
1. **A1:** use `getClaims()` in the proxy (render keeps `getUser()`)?
2. **A7:** raise the Vercel pool size if still needed after A2?
3. **C4:** allow `use cache: private` for non-money shell data (seller profile, store list, nav)?
4. **D:** keep the React Query + route-handler conversion as optional (only orders/home/sidebar counts), instead of every list as the static-shell plan proposed? Recommended: yes; the docs' default (streamed server components, promises + `use()`) gives the first-load gain with far less code.

## 6. Order and sizes
| Step | Size | Depends on |
|---|---|---|
| M1, M2 | S | — |
| A3 (security) | S | — |
| A2, A4, A5 | S each | M1 |
| A6 | M | M1 |
| A1 | S | owner Q1 |
| B1 | S | — |
| B2 | L | B1, A2 helps |
| B3 home, orders | M | B2 |
| B4 products / `[storeId]` | M | B2 |
| B3 rest, B5 | L (many S) | B2 |
| C1–C3, C5 | S each | B3 main areas |
| C4 | S | owner Q3 |
| D | M | owner Q4 |
| E | S | Hetzner move |

Each step ships alone and can be reverted. Before B2 nothing changes for users except speed; from B2 on, the frame appears before the data.
