# Staff accounts & permissions: design note and security review (F-09a)

**Status:** Draft for owner review (2026-10-30). Documents only: no code, migration or roadmap change has been made.
**Roadmap:** `ROADMAP.md` §4 F-09 (F-09a this note; F-09b migration; F-09c invite flow, roles and checks). F-17a (API keys) depends on this note.
**Central rule:** `CLAUDE.md` rule 5 (tenant isolation). Rules 6 (migrations), 7 (money), 8 (caching), 10 (secrets) and 14 (file split) also apply.

---

## 1. What exists today (checked in code, 2026-10-30)

| Piece | Where | What it does today |
| --- | --- | --- |
| Session | `apps/dashboard/lib/auth/require-seller.server.ts` `loadSession` | `supabase.auth.getUser()` → `userId`. Memoized per request with React `cache()`. |
| Account | same file, `loadSeller(userId)` | Reads `sellers` **by `sellers.id = userId`**. The account **is** the signed-in user. |
| `requireSeller(opts)` | same file | No session → `unauthorized`; no sellers row → `no_seller`; status not `approved`/`restricted` → `seller_blocked`. Returns `SellerContext { userId, sellerId, status, plan, maxStoresOverride }`. Today `userId === sellerId` always. |
| `requireStore(storeId, opts)` | same file | `requireSeller` + uuid check + `stores.id = storeId AND stores.seller_id = sellerId AND deleted_at IS NULL`. `forWrite`/`forPublish` add `store_read_only` / `publish_blocked`. A foreign store is `not_found`. Policy is pure in `access.lib.ts` (unit-tested). |
| Layout gates | `app/(main)/layout.tsx`, `app/(builder)/layout.tsx` | `getSellerAccess(user.id)` (`lib/auth/seller-access.ts`); `no_seller` → **redirect to `/signup`**. Header wallet balance, welcome gift and "heard about us" all read `user.id` as the seller id. |
| Legacy actions | `actions/{orders,payouts,products,reviews,coupons,ads,seller}.ts`, `components/layout/dashboard-search.server.ts`, `components/dashboard/sidebar.server.ts`, `app/api/fetch-product`, `app/api/import-product-images` | Call `getUser()` (`actions/auth.ts`) or `supabase.auth.getUser()` and use **`session.user.id` directly as the seller id** (e.g. `products.seller_id = session.user.id`). |
| "Current store" | `lib/stores/current-store.server.ts` (`tallaby_store` cookie), `store-switcher.server.ts` `selectStore` | Navigation preference only; writes take an explicit `storeId` (rule 5). |
| Proxy | `apps/dashboard/proxy.ts` | Refreshes the Supabase session, locale and referral cookies. **No authorization** (and `/api/*` is excluded from its matcher). |
| Crons | `app/api/cron/{bosta-sync,google-sheets,seller-push}` | `Authorization: Bearer CRON_SECRET`. No user session. |
| OAuth | `app/api/integrations/google/{start,callback}` | `requireStore(…, {forWrite})` + signed state bound to `sellerId`+`storeId`+nonce cookie; callback re-checks `seller.sellerId === state.sellerId`. |
| Realtime | `0023`, `0098` | Seller nudges are sent on **`user:<seller_id>`**; policy `user_reads_own_topic` lets only `auth.uid()` listen. Payload is `{type}` only. |
| Push (F-06) | `0124`, `settings/push-alerts.server.ts`, `cron/seller-push` | `seller_push_subscriptions` keyed by `seller_id` (unique `endpoint`), no `user_id`. |
| Storage RLS | `0053` (`store-media`), `0066` (`store-top-up-proofs`) | Client uploads allowed only under `'{auth.uid()}/…'`. Media paths are built from `seller.sellerId` (`buildMediaPath`), so **a staff user's direct upload to the owner's folder is refused by storage RLS**. `seller-upload.server.ts` already uses service-role signed upload URLs. |
| Actor columns already present | `stock_movements.actor_user_id`, `seller_wallet_top_ups.created_by`, `products.deleted_by`, `admin_audit_log.actor_id`; 22 call sites pass `seller.userId` into `@workspace/lib` (e.g. `updateStorePaymentMethod(sellerId, userId, …)`) | Because `userId === sellerId` today, nobody has had to tell them apart. That is the main hook this design uses. |
| Scoping shape of data | schema | Seller-wide (no `store_id`): `products` (linked to stores through `store_products`), `coupons`, seller taxonomy, `reviews`, riders, `order_items.seller_id`. Store-scoped: `orders.store_id` (**nullable**: marketplace orders have none), `store_*` tables, `media_assets.store_id` (nullable = shared), customers notes, leads, blocklist, integrations, site/builder. |

**Consequence:** every one of the ~76 files that call `requireSeller`/`requireStore` and the ~15 that call `getUser()` assumes "signed-in user = account owner". Staff support therefore cannot be added by making `requireSeller()` return the owner's id for a staff user: that would silently open wallet, payouts, plan, affiliate, legal data and account settings to every staff member. The design below makes the existing helpers **owner-only** and adds a separate, permission-checked path for staff (§4).

---

## 2. Identity model: actor vs account

### 2.1 Terms

- **Actor**: the real signed-in user (`auth.uid()`), always `ctx.userId`. Recorded in every audit or actor column.
- **Account**: the `sellers` row whose data is being acted on, `ctx.sellerId`. For an owner, `sellerId = userId`; for staff, the owner's id taken from `store_staff.seller_id`.
- **Membership**: one `store_staff` row (§5) with `status = 'active'`, a `role`, and a store scope (`all_stores` or `store_ids`).

### 2.2 Resolution (per request, never cached across requests)

```
userId ← supabase.auth.getUser()                 (unchanged, React cache())
own    ← sellers WHERE id = userId               (unchanged)
member ← store_staff WHERE user_id = userId AND status = 'active'
         JOIN sellers s ON s.id = store_staff.seller_id   (owner status checked too)
```

- `own` present → **owner context** (`kind: 'owner'`, all permissions, every own store).
- else `member` present → **staff context** (`kind: 'staff'`, `sellerId = member.seller_id`, permissions from role, scope from the row). The owner's `sellers.status` is checked with the same `checkSellerAccess` rule: a suspended or pending owner blocks their staff too; `restricted` keeps the same limits as for the owner.
- else → `no_seller` (today's behaviour: the layout sends them to `/signup`; F-09c must check membership **before** that redirect).

### 2.3 One user, several accounts

v1 recommendation (simplest safe rule, owner to confirm, Q1):

- A user has **at most one active membership** (partial unique index on `user_id WHERE status = 'active'`).
- A user who **owns a `sellers` row cannot accept an invite** (and an owner cannot be invited into their own account). The accept page tells them to use another email.
- Because the account is then a pure function of the session, no "current account" cookie exists and rule 5 ("never use a current-store cookie as the target of a write") is not bent.

v2 (only if the owner wants agencies serving several sellers): an account switcher whose choice is a navigation preference only; every action then takes an explicit `storeId` (seller derived from `stores.seller_id`) or an explicit `accountId` that is re-validated against `store_staff` on every call. Not in scope for F-09b/c.

### 2.4 Store scoping

- `all_stores = true` → every current **and future** store of the account (needed for managers).
- otherwise `store_ids uuid[]` (1..N of the owner's stores). Store deletion does not have to clean the array: the check always intersects with the owner's live stores (`stores.seller_id = sellerId AND deleted_at IS NULL`).
- **Seller-wide resources** (products, coupons, seller taxonomy, reviews, riders, marketplace orders with `store_id IS NULL`, wallet-adjacent reports) have no single store. v1 rule: permissions on seller-wide resources **require `all_stores = true`**. A store-limited staff member can work only on store-scoped areas (orders and customers of their stores, website, store settings). Q3 asks whether the owner wants per-store product access later (it would mean: visible when linked to an allowed store; editable only when *every* `store_products` link is in scope).

### 2.5 Lifecycle cases

| Case | Behaviour |
| --- | --- |
| Invite | Owner (only) enters email, role, scope. Row `status='invited'`, `invite_token_hash = sha256(token)`, `invite_expires_at = now() + 7 days`. Email via the transactional mail kit (Resend), link `https://dashboard.tallaby.com/staff/accept#t=<token>` (fragment, see T4). |
| Accept | Invitee signs in or signs up (plain `users` row, **no `sellers` row**). The accept page posts the token; the server hashes it, finds a row with `status='invited'`, not expired, `lower(invited_email) = lower(session email)` and the session email confirmed; then sets `user_id`, `status='active'`, `accepted_at`, clears the hash. Single use. |
| Invite expiry | Expired invites fail closed ("ask the owner for a new link"); owner can **Resend** (new token, new expiry, old hash overwritten) or **Revoke** (`status='revoked'`). |
| Removal | Owner sets `status='removed'` (row kept for audit). Takes effect on the staff member's **next request** because membership is read from the DB on every request (§4). Their push subscriptions are deleted in the same transaction; realtime see T6. |
| Role / scope change | Effective on the next request; audited with before/after. |
| Owner changes email | No effect: everything is keyed by `user_id` / `seller_id`, not email. Pending invites are keyed by the **invitee's** email. |
| Staff changes email | No effect on an active membership (keyed by `user_id`). |
| Staff is also a customer | Fine: the `users` row keeps `role='customer'`; staff status lives only in `store_staff`, never in `users.role` or `user_metadata` (metadata is a cache that can drift, see `seller-access.ts`). |
| Staff wants their own shop | Not via `/signup` while a membership is active (v1, Q1). `signUpWithEmail`/`createStoreForCurrentUser` must refuse for a user with an active membership. |
| Owner deletes account / seller row removed | `ON DELETE CASCADE` from `sellers` removes memberships and invites. |
| Owner suspended / pending | Staff blocked (owner status is checked in every staff resolution). |
| Plan limit | Seat limit per plan in the code plans module (e.g. Free = 2 staff, Q4). Downgrade never deletes staff; it blocks new invites until under the limit. |

---

## 3. Roles and permissions

### 3.1 Permission keys (code constants in a new `lib/auth/permissions.lib.ts`, pure and unit-tested)

| Key | Meaning |
| --- | --- |
| `orders.view` | Orders list/details, shipments, delivery board, print. |
| `orders.manage` | Change order status, bulk status, cancel, ship with Bosta, assign riders, missed-order follow-up. |
| `orders.refund` | Refunds / cancelling a wallet-paid order (money back to customer wallet). |
| `customers.view` | Customer list, phones, addresses, form submissions, exports. (PII) |
| `customers.manage` | Customer notes/tags, phone blocklist. |
| `products.view` | Product list, product page, questions, reviews (read). |
| `products.manage` | Create/edit/trash/restore, bulk edit, social proof, inventory/restock, taxonomy, answers, review replies, AI autofill, imports. |
| `products.purge` | "Delete forever" from Trash. |
| `coupons.manage` | Coupons (seller-wide). |
| `website.manage` | Builder drafts, pages, blog, forms, templates, SEO, social links, media library. |
| `website.publish` | Publish / unpublish / restore revision (changes what customers see). |
| `store.settings` | Store general, checkout settings, sales pop-up, store app, catalog, shipping zones/fees, order-confirm template. |
| `integrations.manage` | Apps (Bosta key, Meta CAPI token, Google Sheets, Shopify import). Write-only for secrets. |
| `reports.view` | Store analytics, reports, revenue charts. |
| `media.manage` | Media library upload/rename/delete (granted with `website.manage` or `products.manage`). |
| `alerts.self` | Subscribe *this user's* devices to push alerts; see own filtered bell. |
| `wallet.view` | Optional grant: see store wallet balance and transactions (never top-up/payout). |

**Owner-only (never a permission key, cannot be granted in v1):** wallet top-up, payout details and withdrawal, affiliate earnings and withdrawal (`earn`), plan/billing, account/legal details and documents, fulfillment-service requests, ads wallet, seller profile, create/archive/restore stores, store subdomain change, custom domain, **store payment methods** (the account numbers customers pay into, Q5), staff management, account deletion, roadmap votes and the onboarding pop-ups (heard-about-us, welcome gift).

### 3.2 Roles

| Role | Grants | Scope |
| --- | --- | --- |
| `orders` | orders.view, orders.manage, customers.view, customers.manage, products.view, alerts.self | any (store-limited allowed) |
| `products` | products.view, products.manage, coupons.manage, media.manage, alerts.self | **all stores** required (seller-wide data, §2.4) |
| `manager` | everything in the table above except `wallet.view` (+ `orders.refund`, `products.purge`, `website.publish`, `integrations.manage`, `reports.view`) | any |
| optional add-on | `wallet.view` (ROADMAP: "never see wallet/payout unless allowed") | owner ticks it per member |

`website` (website.manage + website.publish + media.manage) can be a fourth role if the owner wants a designer seat (Q2).

### 3.3 Permission matrix

O = owner, M = manager, Or = orders role, P = products role. ✓ allowed, — denied, (s) only for stores in scope, (a) only with all-stores scope.

| Area | Action examples | O | M | Or | P |
| --- | --- | --- | --- | --- | --- |
| Orders | view, print, status, bulk, Bosta ship/cancel, riders | ✓ | ✓(s) | ✓(s) | — |
| Orders (marketplace, `store_id` null) | same | ✓ | ✓(a) | ✓(a) | — |
| Refund / cancel wallet-paid | `processRefund`, cancel with wallet refund | ✓ | ✓(s) | — (Q6) | — |
| Missed orders | view, contacted, template | ✓ | ✓(s) | ✓(s) | — |
| Customers | list, notes, tags, blocklist, export | ✓ | ✓(s) | ✓(s) | — |
| Products | view | ✓ | ✓(a) | ✓(a) read-only | ✓(a) |
| Products | create, edit, trash, bulk, social proof, AI, import | ✓ | ✓(a) | — | ✓(a) |
| Products | delete forever | ✓ | ✓(a) | — | — |
| Inventory | restock, stock history | ✓ | ✓(a) | — | ✓(a) |
| Reviews / questions | reply, answer, delete comment | ✓ | ✓(a) | — | ✓(a) |
| Coupons | all | ✓ | ✓(a) | — | ✓(a) |
| Builder / website | drafts, pages, blog, forms, templates, SEO, social, media | ✓ | ✓(s) | — | media only (s) |
| Website publish | publish, unpublish, restore revision | ✓ | ✓(s) | — | — |
| Form submissions | view/export (PII) | ✓ | ✓(s) | ✓(s) | — |
| Store settings | general, checkout, sales pop-up, app, catalog, shipping | ✓ | ✓(s) | — | — |
| Store payment methods | receiving account numbers | ✓ | — (Q5) | — | — |
| Subdomain / custom domain | change, verify, remove | ✓ | — | — | — |
| Integrations / secrets | connect, test, disconnect; secrets write-only | ✓ | ✓(s) | — | — |
| Shopify import | | ✓ | ✓(a) | — | — |
| Google Sheets order export | | ✓ | ✓(s) | ✓(s) | — |
| Apps (store PWA) | | ✓ | ✓(s) | — | — |
| Analytics / reports / revenue | | ✓ | ✓(s) | — | — |
| Store wallet | view balance + ledger | ✓ | add-on | add-on | add-on |
| Store wallet | top-up | ✓ | — | — | — |
| Payouts / payout details | | ✓ | — | — | — |
| Affiliate earnings (`/earn`) | | ✓ | — | — | — |
| Ads wallet | | ✓ | — | — | — |
| Plan / billing | | ✓ | — | — | — |
| Stores | create, archive, restore | ✓ | — | — | — |
| Seller profile, legal, documents, fulfillment request | | ✓ | — | — | — |
| Staff management | invite, role, scope, remove | ✓ | — | — | — |
| Account deletion | | ✓ | — | — | — |
| Push alerts (own device) | subscribe, prefs, test | ✓ | ✓ | ✓ | ✓ |
| Bell feed | | all types | filtered (§6.2) | filtered | filtered |

---

## 4. Enforcement design

### 4.1 Principle: the old helpers become owner-only (deny by default)

1. `requireSeller()` and `requireStore()` keep their names and signatures but **fail with a new `AccessError("owner_only")` when the caller is staff**. Every existing caller (≈76 files) is therefore closed to staff the day staff can sign in, with zero edits. Only code that is deliberately migrated to the new helper opens up.
2. `getSellerAccess(user.id)` in the two layouts is replaced by `resolveActor()` so staff are not redirected to `/signup`; a staff member visiting an owner-only page gets `notFound()` (or a "no access" page), never data.
3. Legacy `getUser()` + `session.user.id` code paths: a staff user's `user.id` has no `sellers` row, so reads return nothing and inserts fail on `*_seller_id_fkey` (verified for `products` and `coupons`). That is fail-closed but accidental. F-09c adds `assertOwnerSession()` to `actions/auth.ts#getUser`'s callers in `actions/{orders,payouts,products,reviews,coupons,ads,seller}.ts` (or migrates each to the new helper), so the denial is explicit and tested.

### 4.2 New helpers (`apps/dashboard/lib/auth/require-access.server.ts`, policy in `access.lib.ts`)

```ts
type ActorContext = {
  userId: string;               // actor: audit and actor columns
  sellerId: string;             // account: every query filter
  kind: "owner" | "staff";
  staffId: string | null;
  role: "owner" | StaffRole;
  permissions: ReadonlySet<Permission>;
  storeScope: "all" | ReadonlySet<string>;
  status: string; plan: string; maxStoresOverride: number | null;   // owner's
};

resolveActor(): Promise<ActorContext>                 // React cache(); throws unauthorized / no_seller / seller_blocked
requirePermission(perm, opts?): Promise<ActorContext> // seller-wide action; throws forbidden; perms on seller-wide data also need storeScope === "all"
requireStorePermission(storeId, perm, opts?)          // store-scoped action
  : Promise<{ actor: ActorContext; store: StoreContext }>
requireOwner(opts?): Promise<ActorContext>            // explicit owner-only (what requireSeller becomes)
```

`requireStorePermission` = `resolveActor` → uuid check → `loadStore(actor.sellerId, storeId)` (same SQL as today) → `checkStoreAccess` (unchanged: read-only, publish) → `storeInScope(actor, storeId)` → `hasPermission(actor, perm)`. Foreign store, out-of-scope store and missing store all return **`not_found`** (never reveal which). Missing permission returns `forbidden`.

Rules for callers:
- The permission is a **literal in the action**, never derived from input.
- `sellerId` for queries always comes from `actor.sellerId` (or `store.sellerId` after the check); `userId` goes to every actor/audit column. Never the other way round.
- An action touching a row by id (order, product, coupon, shipment, form, media asset) still filters by `seller_id` **and**, for store-scoped staff, by `store_id IN scope` in the same SQL (not a pre-check followed by an unscoped update).
- Bulk actions check every id in SQL (`WHERE id = ANY($ids) AND seller_id = $s AND store_id = ANY($scope)`) and report the count actually changed.
- `requireStore(…)` stays as an owner-only alias so code that has not been migrated never opens by accident.

### 4.3 List and read filtering

Pages and `*.data.tsx` loaders call `resolveActor()` and pass `sellerId` **plus** `storeScope` into the query. Store-limited staff must never see:
- orders whose `store_id` is null or out of scope (orders list, counts, search, print, export, Google Sheets export, sidebar counts);
- customers aggregated from out-of-scope stores;
- wallet numbers in the header (`DashboardHeader walletBalance`) or the negative-wallet dialog unless `wallet.view`.

### 4.4 Sidebar, routes and UI (presentation only)

- `components/dashboard/sidebar.data.tsx` builds items from `actor.permissions`; the store switcher lists only stores in scope.
- Every owner-only page (`wallet`, `wallet/top-up`, `financial`, `financial/top-up`, `earn`, `settings` (account), `settings/plan`, `settings/fulfillment`, `marketing` (ads), `stores` (create/archive), staff page) calls `requireOwner()` itself and renders `notFound()` for staff.
- Hiding a link is never the check (rule 5): every action called from a hidden button is still checked by §4.2, and the tests in §8 call the actions directly.

### 4.5 Audit

New server-only `seller_audit_log` (§5). Written:
- always for staff management events (invite, resend, revoke, accept, role/scope change, remove) by owner or system;
- for every **write** performed by a staff actor (`requirePermission`/`requireStorePermission` with `forWrite`), with `action` = the server action name, `target_type/target_id`, `store_id`, and a small redacted `metadata` (never secrets, tokens, full addresses or phone numbers);
- existing actor columns (`stock_movements.actor_user_id`, `products.deleted_by`, `seller_wallet_top_ups.created_by`, the 22 `seller.userId` lib calls) receive `actor.userId`, so they show the real person.

The owner sees the log on the staff page ("Activity").

---

## 5. Migration sketch (F-09b; next free number at that time, `0126` as of writing)

Hand-written, idempotent, mirrored in `schema.ts` and `relations.ts`; no `drizzle-kit generate`; staging first, production with owner approval.

```sql
-- 01xx_store_staff.sql
CREATE TABLE IF NOT EXISTS public.store_staff (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id          uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  user_id            uuid REFERENCES public.users(id) ON DELETE CASCADE,       -- null until accepted
  invited_email      text NOT NULL CHECK (char_length(invited_email) <= 254),
  role               text NOT NULL CHECK (role IN ('orders','products','manager')),
  all_stores         boolean NOT NULL DEFAULT false,
  store_ids          uuid[] NOT NULL DEFAULT '{}',
  extra_permissions  text[] NOT NULL DEFAULT '{}' CHECK (extra_permissions <@ ARRAY['wallet.view']::text[]),
  status             text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','active','revoked','removed')),
  invite_token_hash  text,                                                       -- sha256 hex, never the token
  invite_expires_at  timestamptz,
  invited_by         uuid NOT NULL REFERENCES public.users(id),
  accepted_at        timestamptz,
  removed_at         timestamptz,
  removed_by         uuid REFERENCES public.users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_staff_scope CHECK (all_stores OR cardinality(store_ids) BETWEEN 1 AND 50),
  CONSTRAINT store_staff_products_all CHECK (role <> 'products' OR all_stores),
  CONSTRAINT store_staff_not_owner CHECK (user_id IS NULL OR user_id <> seller_id),
  CONSTRAINT store_staff_active_has_user CHECK (status <> 'active' OR user_id IS NOT NULL),
  CONSTRAINT store_staff_invite_token CHECK (status <> 'invited' OR (invite_token_hash IS NOT NULL AND invite_expires_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS store_staff_one_active_per_user ON public.store_staff (user_id) WHERE status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS store_staff_one_open_invite ON public.store_staff (seller_id, lower(invited_email)) WHERE status IN ('invited','active');
CREATE UNIQUE INDEX IF NOT EXISTS store_staff_token ON public.store_staff (invite_token_hash) WHERE invite_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS store_staff_seller_idx ON public.store_staff (seller_id);
ALTER TABLE public.store_staff ENABLE ROW LEVEL SECURITY;      -- server-only: no policies

CREATE TABLE IF NOT EXISTS public.seller_audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  store_id      uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  actor_kind    text NOT NULL CHECK (actor_kind IN ('owner','staff','system')),
  action        text NOT NULL CHECK (char_length(action) <= 80),
  target_type   text CHECK (char_length(target_type) <= 40),
  target_id     text CHECK (char_length(target_id) <= 80),
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(metadata) <= 4096),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS seller_audit_log_seller_idx ON public.seller_audit_log (seller_id, created_at DESC);
ALTER TABLE public.seller_audit_log ENABLE ROW LEVEL SECURITY; -- server-only: no policies

-- Push (F-06): who subscribed. NULL = owner (existing rows).
ALTER TABLE public.seller_push_subscriptions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Seller bell types: 'staff_joined', 'staff_invite_expired' (widen seller_notifications type check, guarded).
```

Notes:
- `store_ids` cannot carry a foreign key; the server always intersects it with live owner stores, and the save action validates every id belongs to the owner.
- No trigger writes the audit log (writes come from server code where the actor is known); the staff-management actions write it in the same transaction as the change.
- Realtime topic change (T6) is a separate statement in the same migration if Q7 picks option B.

---

## 6. Cross-cutting pieces

### 6.1 Caching (rule 8)

- Membership, role and scope are **never cached** beyond React `cache()` for one request (one indexed lookup per request). If profiling later demands it: `createCachedQuery` with tag `staff:seller:<sellerId>` and `staff:user:<userId>`, invalidated by every staff-management write, TTL ≤ 60 s.
- Existing seller-keyed caches (`productTags.seller`, `storeTags.*(sellerId, storeId)`, `couponTags.seller`, …) stay valid: staff read the same account data, filtered **after** the cache by scope. Never cache a result that was already filtered by a member's scope under a seller-only key.
- Carts, orders, wallets, drafts, integration secrets: still never cached.

### 6.2 Realtime and the bell

- Today the nudge goes to `user:<seller_id>` and only the owner can listen. Staff hear nothing until changed.
- Option A (v1, recommended): staff poll the bell feed (existing `getSellerNotificationFeed`, now filtered) every 60 s while the dashboard is open; no realtime change.
- Option B: also send to `seller:<seller_id>` and add a `realtime.messages` SELECT policy using a `SECURITY DEFINER` `public.is_active_staff(seller_id)` function. Payload stays `{type}` only (no PII), so a removed member whose socket is still open learns only "something happened" until disconnect; the data fetch is authorized per request.
- Feed filtering: staff see only types they have a permission for (order types → `orders.view` and `store_id` in scope; product question/review → `products.view`; wallet, top-up, welcome gift, referral, payout, plan → never). `read_at` is shared per row today; v1 staff get their own "unread since last open" marker (`store_staff.feed_seen_at`) instead of touching `read_at` (Q8).

### 6.3 Push alerts (F-06)

- Subscribing stores `seller_id = actor.sellerId`, `user_id = actor.userId`. Endpoint stays globally unique: a device moving from owner to staff overwrites the row (re-subscribe), which is correct.
- The `seller-push` cron, when fanning out a new-order alert, joins each subscription to its user's active membership and sends only if `orders.view` and the order's `store_id` is in scope (marketplace orders: all-stores only). Owner rows (`user_id IS NULL OR user_id = seller_id`) are unchanged.
- Removal deletes that user's subscriptions for the account in the same transaction; the cron's join is the second line of defence.
- Push text contains the order number and total only (as today); confirm no customer name/phone in the payload for staff (T9).

### 6.4 Media and uploads

- Storage RLS allows client uploads only under `'{auth.uid()}/'`, but media paths start with the owner's id. Staff media uploads must move to service-role **signed upload URLs** (the `seller-upload.server.ts` pattern), with the path built and checked server-side (`checkMediaPath(path, sellerId, storeId)`).
- Product image uploads that use the browser client (`product-image-upload.tsx`, `image-upload.tsx`, `use-content-image-upload.ts`, `ai-autofill.client.tsx`) need the same check of their bucket policy before staff can use them (bucket policy for `product-images` is not in the migrations folder; verify in Supabase before F-09c).
- `store-top-up-proofs` stays owner-only (top-up is owner-only).

### 6.5 Other apps

- `apps/ecommerce` builder preview: preview tokens are minted by `editor.server.ts#previewLink`; once that action requires `website.manage` for the store, staff previews work without ecommerce changes.
- `apps/admin`: show staff per seller (read-only) later; admin impersonation is out of scope.
- Crons, `/api/revalidate`, carrier/webhook handlers: authenticate by secret, not by user; unaffected (T10).

---

## 7. Inventory of entry points and the permission each needs

Counted from `"use server"` files and `route.ts` handlers in `apps/dashboard` on 2026-10-30 (other sessions are adding files; re-run the grep in F-09c).

Legend: **guard today** S = `requireSeller`, St = `requireStore`, U = `getUser()`/`auth.getUser()` with `user.id` as seller id, – = none.

### 7.1 Server actions (213 exports in 64 files)

| File | Exports | Guard today | Permission |
| --- | --- | --- | --- |
| `actions/ads.ts` | getAdWallet, getSellerAdRequests, createAdRequest | U | **owner** |
| `actions/auth.ts` | getUser, login, resetPassword, resendConfirmation, logout | – | none (auth) |
| `actions/brands.ts` | 7 public reads; createBrand | S (create) | none; createBrand `products.manage`(a) |
| `actions/categories.ts` | 4 public reads | – | none |
| `actions/coupons.ts` | getSellerCouponsPage, saveSellerCoupon, setSellerCouponActive, deleteSellerCoupon | U | `coupons.manage`(a) |
| `actions/custom-domain.ts` | get/add/verify/removeCustomDomain | St | **owner** (Q5) |
| `actions/locale.ts` | setLocale | – | none |
| `actions/notifications.ts` | getSellerNotificationFeed, markSellerNotificationsReadAction | S | any member, filtered (§6.2) |
| `actions/orders.ts` | getSellerOrders, getOrderDetails, getOrderStats; updateOrderItemStatus; processRefund | U | `orders.view`; `orders.manage`; `orders.refund` (legacy file: delete if unused) |
| `actions/payouts.ts` | getSellerPayouts, getPayoutDetails, getPendingEarnings, getWalletBalance, getWalletTransactions, getPayoutStats; getDashboardAnalytics, getRevenueAnalytics | U | 6 **owner**; 2 `reports.view` |
| `actions/products.ts` | getSellerProducts, getProduct, getSellerUnansweredQuestions, getSellerQuestions; 13 writes (create/update/toggle/publish/variant/bulk×3/answer×4/delete) | U | reads `products.view`(a); writes `products.manage`(a) |
| `actions/reviews.ts` | 4 reads; replyToReview, deleteReviewComment | U | `products.view`(a); `products.manage`(a) |
| `actions/seller.ts` | getSellerProfile, updateSellerProfile, getSellerDocuments, uploadSellerDocument; getSellerMetrics; checkStoreSubdomain, updateStoreSubdomain | U / St | 4 **owner**; `reports.view`; 2 **owner** |
| `actions/shipping.ts` | getShippingOverview; updateShipmentStatus, bulkUpdateShipmentStatus, assignRider; 4 rider CRUD | U + local `requireSellerId` | `orders.view`; `orders.manage`(s); riders `orders.manage`(a) |
| `(builder)/…/editor.server.ts` | 16 draft/page/form/revision/preview actions; publish, unpublish (restoreRevision too) | St (via helper) | `website.manage`(s); `website.publish`(s) |
| `(builder)/…/explore.server.ts` | searchStockPhotos, importStockPhoto | St | `website.manage`(s) / `media.manage` |
| `_components/setup-publish.server.ts` | publishStoreFromHome | St | `website.publish`(s) |
| `_components/unanswered-questions.server.ts` | handleAnswerQuestion | (via products) | `products.manage`(a) |
| `earn/earn.server.ts` | requestWithdrawal | S | **owner** |
| `orders/bosta-ship.server.ts` | previewShipWithBosta, shipWithBosta, cancelShipmentWithBosta; loadBostaTimeline | St | `orders.manage`(s); `orders.view`(s) |
| `orders/customers/customers.server.ts` | loadCustomerOrders; saveCustomerNote | St | `customers.view`(s); `customers.manage`(s) |
| `orders/missed/missed-orders.server.ts` | setLeadContacted, saveLeadTemplate | St | `orders.manage`(s) |
| `orders/orders.server.ts` | updateSellerOrder, bulkUpdateSellerOrders | S | `orders.manage` (per order `store_id` in scope; marketplace (a)); cancel of wallet-paid → `orders.refund` |
| `products/add/ai/ai-source.server.ts` | markProductAiAssisted | S | `products.manage`(a) |
| `products/bulk-edit/bulk-edit.server.ts` | preview/apply/undoBulkEditAction | S | `products.manage`(a) |
| `products/categories-brands/categories-brands.server.ts` | 7 taxonomy actions | S | `products.manage`(a) |
| `products/inventory/inventory.server.ts` | restockAction | S | `products.manage`(a) |
| `products/social-proof/social-proof.server.ts` | saveProductSocialProof | S | `products.manage`(a) |
| `products/trash/trash.server.ts` | trash, restore; deleteProductsForeverAction | S | `products.manage`(a); `products.purge`(a) |
| `settings/account.server.ts` | saveLegalDetails, savePayoutDetails | S | **owner** |
| `settings/fulfillment/fulfillment.server.ts` | requestFulfillmentServices | S | **owner** |
| `settings/push-alerts.server.ts` | save/remove subscription, prefs, test | S | `alerts.self` (actor's own devices) |
| `settings/seller-settings.server.ts` | fetchSellerSettings, handleUpdateSellerProfile, handleUploadDocument | (U) | **owner** |
| `stores/[storeId]/analytics/analytics.server.ts` | refreshStoreViews | St | `reports.view`(s) |
| `stores/[storeId]/apps/apps.server.ts` | connect/disconnectStoreApp | St | `integrations.manage`(s) |
| `stores/[storeId]/apps/bosta/bosta.server.ts` | verifyBostaKey, updateBostaSettings, testBosta, loadBostaPickupLocations | St | `integrations.manage`(s) |
| `stores/[storeId]/apps/google-sheets.server.ts` | createGoogleSheet; exportOrdersToGoogleSheet | St | `integrations.manage`(s); `orders.view`+`customers.view`(s) |
| `stores/[storeId]/apps/meta-capi.server.ts` | saveMetaCapi, testMetaCapi | St | `integrations.manage`(s) |
| `stores/[storeId]/apps/shopify-import.server.ts` | connect, preview, importShopifyBatch | St | `integrations.manage`(s) + `products.manage`(a) |
| `stores/[storeId]/settings/app/app.server.ts` | saveStoreAppSettings | St | `store.settings`(s) |
| `stores/[storeId]/settings/catalog.server.ts` | saveStoreCatalog | St | `store.settings`(s) |
| `stores/[storeId]/settings/checkout/checkout-settings.server.ts` | saveStoreCheckoutSettings | St | `store.settings`(s) |
| `stores/[storeId]/settings/payments/payments.server.ts` | saveStorePaymentMethod | St | **owner** (Q5) |
| `stores/[storeId]/settings/protection/protection.server.ts` | block/unblockCustomerPhone; saveOrderConfirmTemplate | St | `customers.manage`(s); `store.settings`(s) |
| `stores/[storeId]/settings/sales-popup/sales-popup.server.ts` | saveStoreSalesPopup | St | `store.settings`(s) |
| `stores/[storeId]/settings/store-settings.server.ts` | saveStoreGeneral | St | `store.settings`(s) |
| `stores/[storeId]/shipping/shipping.server.ts` | 4 shipping settings/zones | St | `store.settings`(s) |
| `stores/[storeId]/website/blog/blog.server.ts` | 4 post actions | St | `website.manage`(s) |
| `stores/[storeId]/website/domain/domain-seo.server.ts` | saveStoreSeo | St | `website.manage`(s) |
| `stores/[storeId]/website/forms/forms.server.ts` | create×2, save, delete; updateSubmissionsStatus, deleteSubmissions, exportSubmissions | St | `website.manage`(s); submissions `customers.view`(s) |
| `stores/[storeId]/website/social/social.server.ts` | saveStoreSocial | St | `website.manage`(s) |
| `stores/[storeId]/website/templates/templates.server.ts` | applyTemplate, listTemplatesPage, templatePreview, undoTemplate | St | `website.manage`(s) |
| `stores/stores.server.ts` | checkNewStoreSubdomain, create, archive, restore | S | **owner** |
| `wallet/top-up.server.ts` | startTopUp, submitManualTopUp | S | **owner** |
| `roadmap/roadmap.server.ts` | toggleFeatureVote, suggestFeature | S | owner (per-seller votes; Q9) |
| `signup/signup.server.ts` | 4 signup actions | U | self; refuse when user has an active membership |
| `components/dashboard/sidebar.server.ts` | getSidebarCounts | U | any member; counts filtered by scope/perm |
| `components/dashboard/store-switcher.server.ts` | selectStore | S | any member; store must be in scope |
| `components/inputs/seller-upload.server.ts` | createSellerUploadUrl | S | by bucket: top-up proofs **owner**; others the matching perm |
| `components/layout/dashboard-search.server.ts` | searchDashboard | U | any member; each result group filtered by perm/scope |
| `components/layout/heard-about-us.server.ts` | saveHeardAboutUs | S | **owner** |
| `components/layout/welcome-gift.server.ts` | check/dismissWelcomeGiftAction | S | **owner** |
| `components/media/media.server.ts` | 8 media actions | St | `media.manage`(s) |
| `supabase/server.ts` | createClient | – | none (helper; consider dropping `"use server"`) |

**Totals:** 213 exports. No check needed: 18 (auth 5, public brand/category reads 11, locale 1, createClient 1). Self-service without a permission: 6 (signup 4 with the membership refusal, roadmap 2 kept owner). **Need a permission or owner check: 189**, of which **36 owner-only** and **153 staff-eligible**.

### 7.2 Route handlers (11)

| Route | Guard today | Permission |
| --- | --- | --- |
| `api/ai/product-autofill` | S forWrite | `products.manage`(a); AI daily cap stays per **seller** (account), log actor (rule 20) |
| `api/bosta/labels` | St | `orders.view`(s); every shipment id filtered by store in SQL |
| `api/fetch-product` | U | `products.manage`(a) (SSRF guard unchanged) |
| `api/import-product-images` | U | `products.manage`(a); upload path built from `sellerId` server-side |
| `api/integrations/google/start` | St forWrite | `integrations.manage`(s); sign state with `sellerId`, `storeId` **and `userId`** |
| `api/integrations/google/callback` | St forWrite + state | same; also check `state.userId === actor.userId` |
| `api/auth/callback` | session exchange | none (must preserve `next` to `/staff/accept`, `safe-next.lib.ts`) |
| `api/cron/bosta-sync`, `cron/google-sheets`, `cron/seller-push` | CRON_SECRET | none; seller-push filters staff subscriptions (§6.3) |
| `api/revalidate` | shared secret | none |

**6 route handlers need a permission check** (plus the seller-push cron's fan-out filter).

### 7.3 Pages and data loaders

All ~50 `page.tsx` under `app/(main)`, the builder page and `app/print/orders/page.tsx`, plus 31 non-action files that call `requireSeller`/`requireStore`/`getSellerAccess` (layouts, `*.data.tsx`, `lib/stores/store-page.server.ts`, `current-store.server.ts`, `home.queries.ts`, `signup-pixel.data.tsx`). Each moves to `resolveActor` + the area's view permission, or `requireOwner()` for the owner-only pages listed in §4.4. `loadStorePage(storeId)` (20 store pages) gets a `perm` argument.

**Grand total for F-09c: 189 actions + 6 route handlers + the push fan-out = 196 server entry points, plus page/data loaders.** Because of §4.1 none of them is open to staff until migrated, so F-09c can open areas one at a time.

---

## 8. Security review

| # | Threat | Mitigation | Test |
| --- | --- | --- | --- |
| T1 | **Privilege escalation via client-sent ids**: staff passes another seller's `storeId`, `orderId`, `productId`, or a `role`/`sellerId` in an action payload. | Seller id only from `resolveActor()`; store checked with `stores.seller_id = actor.sellerId` + scope; row ids filtered by `seller_id` and `store_id` scope in the **same** SQL; permission literal in code. Role/scope can be changed only by `requireOwner()` actions, which validate `store_ids` ⊆ owner stores. | Unit: `access.lib.test.ts` matrix (role × perm × scope × store status). Integration: staff of seller A calls each migrated action with seller B's store/order/product ids → `not_found`, no row changed. Staff calls `updateStaffMember` → `owner_only`. |
| T2 | **Deny-by-default regression**: a new action uses `requireSeller()` expecting it to work for staff, or someone "fixes" it by returning the owner's id for staff. | `requireSeller`/`requireStore` throw `owner_only` for staff; a lint-style test scans `"use server"` files and fails if an exported action has no `requireOwner`/`requirePermission`/`requireStorePermission`/`requireSeller`/`requireStore` call or is not in an explicit allowlist (§7.1 "none" rows). | Test `server-actions-guarded.test.ts` (static scan). Integration: staff session against every owner-only action in §7.1 → `owner_only`. |
| T3 | **Wallet/payout/affiliate exposure through side doors**: header balance, negative-wallet dialog, financial charts, search, sidebar counts, bell types, push text, Google Sheets export columns. | Layout reads balance only for owner or `wallet.view`; search and counts filtered; bell types allowlisted per perm; owner-only pages call `requireOwner()`. | Render test of the layout for a staff context: no balance prop. Integration: `searchDashboard`, `getSidebarCounts`, `getSellerNotificationFeed` as staff never return wallet/referral/top-up items. |
| T4 | **Invite token leakage / replay**: token in logs, Referer, browser history, email forwarding; reuse after accept; brute force. | 256-bit random token; only `sha256` stored; link uses a URL **fragment** (`#t=`, never sent to servers or Referer), the accept page posts it in the body; `Referrer-Policy: no-referrer` on the page; single use (hash cleared on accept); 7-day expiry; bound to the invited email (session email must match and be confirmed); rate limit per IP and per user on accept; revoke/resend rotate the hash. Never log the token or the hash. | Integration: accept twice → second fails; accept after expiry fails; accept with a different signed-in email fails; accept with an unconfirmed email fails; resend invalidates the old token. Unit: token never appears in returned DTOs. |
| T5 | **Stale access after removal**: JWT is valid up to 1 h; React cache; cached membership. | Membership read from DB on every request (no cross-request cache); removal is a status change checked by `resolveActor`; push subscriptions deleted on removal; open browser tabs fail on next action. | Integration: remove member, then call an action with the same session → `no_seller`/forbidden. Cron fan-out test: removed member's subscription gets nothing. |
| T6 | **Realtime after removal / cross-seller topic listening**. | Option A: no realtime for staff (poll). Option B: `seller:<id>` topic with an RLS policy calling `is_active_staff`; payload `{type}` only, so an open socket leaks no data; data fetch is authorized. Staff can never join `user:<ownerId>` (existing policy). | SQL test (when B): a non-member JWT cannot `SELECT` from `realtime.messages` for `seller:<id>`. |
| T7 | **Cross-seller access via multi-membership**. | v1: one active membership per user (unique index); owners cannot accept invites; no account cookie. | Integration: second accept for the same user fails; seller accepting an invite fails. |
| T8 | **IDOR in route handlers** (`/api/bosta/labels?ids=…`, product autofill, image import, Google OAuth). | Each handler calls `requireStorePermission`/`requirePermission`; ids filtered in SQL; Google state also binds `userId`; `/api/*` is outside the proxy matcher, so the handler is the only guard. | Integration per handler: staff of another seller / out-of-scope store / missing perm → 404/403 and no data. |
| T9 | **PII over-exposure** (customer phones, addresses, form submissions, exports, push payloads) to roles that do not need it. | `customers.view` gates PII; products role never gets it; exports require `customers.view`; push text unchanged (order number + total). | Integration: products-role staff calling `loadCustomerOrders`, `exportSubmissions`, `exportOrdersToGoogleSheet` → forbidden. |
| T10 | **Crons and webhooks** accidentally gain or lose behaviour. | They authenticate by secret and never call the new helpers; only seller-push changes (fan-out filter). | Existing cron tests stay green; new seller-push test for staff filtering. |
| T11 | **Integration secret disclosure** to staff with `integrations.manage`. | Secrets stay write-only: actions accept new values and return masked status; no DTO includes decrypted values. | Unit: DTO snapshot of apps page data has no secret fields; integration: `verifyBostaKey` response has no key. |
| T12 | **Money via orders role**: cancelling wallet-paid orders refunds the customer wallet; marking delivered charges the EGP 5 fee. | Fee on delivered is normal operation (allowed). Refund/cancel of wallet-paid orders requires `orders.refund` (manager+owner by default; Q6). No ledger code changes (rule 7). | Integration: orders-role cancel of a wallet-paid order → forbidden; manager → allowed and ledger entry idempotent as today. |
| T13 | **Storage path abuse**: staff uploads to the owner's folder via signed URL for a path it chose. | Path built server-side from `actor.sellerId` and an allowed `storeId`; `checkMediaPath` before signing and before `recordUpload`. | Integration: request signed URL for another seller's folder or out-of-scope store → refused. |
| T14 | **Signup takeover / confusion**: staff visiting `/signup` creates a sellers row and becomes an owner; layout redirect loop. | `resolveActor` checks membership before the `no_seller` redirect; signup actions refuse when an active membership exists. | Integration: staff user calling `createStoreForCurrentUser` → refused. |
| T15 | **Owner lock-out / staff escalation to owner**: staff invites more staff or changes own role. | Staff management is owner-only (`requireOwner`); CHECK `user_id <> seller_id`; the owner can never be removed (owner is not a `store_staff` row). | Integration: manager calls invite/role actions → `owner_only`. |
| T16 | **Audit gaps / forged actor**. | Actor = `auth.uid()` from the session; audit written server-side in the same transaction for staff management, and after each staff write; no client field feeds `actor_user_id`. | Integration: a staff write produces one audit row with the staff user id and the owner's seller id. |
| T17 | **Plan/AI cost abuse**: staff run AI autofill without limit. | AI caps stay per seller (account) as in `docs/ai.md`; usage rows also record actor. | Unit: cap key uses `sellerId`. |

---

## 9. Phased tasks

### F-09b · Migration and pure policy (no UI, nothing opens for staff)

1. `packages/db/migrations/01xx_store_staff.sql` (§5): `store_staff`, `seller_audit_log`, `seller_push_subscriptions.user_id`, two seller bell types; RLS on, no policies.
2. `packages/db/src/drizzle/schema.ts`, `relations.ts`: mirror.
3. `apps/dashboard/lib/auth/permissions.lib.ts` (+ test): permission keys, role → permissions, `hasPermission`, `storeInScope`, seller-wide rule.
4. `apps/dashboard/lib/auth/access.lib.ts` (+ test): `owner_only`, `forbidden` codes; staff variant of `checkSellerAccess` using the owner's status.
5. `packages/lib/src/staff/staff.server.ts` (+ integration test): invite/accept/resend/revoke/remove/update with token hashing and audit rows; `packages/lib/src/staff/audit.server.ts` `writeSellerAudit`.
6. Plans module: `maxStaff` per plan.
7. Apply on staging; production with owner approval. Log in `ROADMAP.md` §7 and `CLAUDE.md` rule 6.

### F-09c · Resolution, invite flow and gradual opening

1. `lib/auth/require-seller.server.ts` → add `resolveActor`, `requireOwner`, `requirePermission`, `requireStorePermission`; make `requireSeller`/`requireStore` owner-only.
2. `app/(main)/layout.tsx`, `app/(builder)/layout.tsx`, `lib/auth/seller-access.ts`: membership before `/signup`; wallet balance, welcome gift and heard-about-us only for owner.
3. Owner pages `requireOwner()`: `wallet/*`, `financial/*`, `earn`, `settings` (account), `settings/plan`, `settings/fulfillment`, `marketing`, `stores`.
4. New: `app/(main)/settings/staff/{page.tsx, staff.data.tsx, staff.server.ts, staff.client.tsx, staff.dto.ts}` (list, invite, role/scope, remove, activity) and `app/staff/accept/{page.tsx, accept.server.ts, accept.client.tsx}`; email template in the transactional kit; `ar.json`/`en.json` strings.
5. `components/dashboard/sidebar.data.tsx`, `sidebar.server.ts`, `store-switcher.server.ts`, `lib/stores/current-store.server.ts`, `lib/stores/store-page.server.ts` (perm argument), `components/layout/dashboard-search.server.ts`, `actions/notifications.ts` (filtered feed).
6. Open area by area (each with its integration tests, in this order): **orders** (`orders/*.server.ts`, `orders/*.data.tsx`, `actions/shipping.ts`, `app/print/orders/page.tsx`, `api/bosta/labels`, `orders/bosta-ship.server.ts`, customers, missed), **products** (`products/**/**.server.ts`, `actions/products.ts`, `actions/reviews.ts`, `actions/coupons.ts`, `actions/brands.ts#createBrand`, `api/ai/product-autofill`, `api/fetch-product`, `api/import-product-images`, image upload components → signed URLs), **website** (`(builder)/…/editor.server.ts`, `explore.server.ts`, `website/**`, `components/media/media.server.ts` → signed uploads, `setup-publish.server.ts`), **settings/integrations** (`stores/[storeId]/settings/**` except payments, `stores/[storeId]/shipping`, `apps/**`, Google OAuth routes), **reports** (`analytics.server.ts`, `reports/page.tsx`, `actions/payouts.ts#get*Analytics`).
7. Legacy `actions/{orders,payouts,products,reviews,coupons,ads,seller}.ts`: explicit `requireOwner()` or migrate; delete dead exports.
8. Push: `settings/push-alerts.server.ts` (store `user_id`), `@workspace/lib` push fan-out used by `api/cron/seller-push`, removal cleanup.
9. `signup/signup.server.ts`: refuse with an active membership.
10. Static test `server-actions-guarded.test.ts`; manual E2E in `PLAN.md` §23 (owner invites orders-role staff to one of two stores; staff sees only that store's orders; cannot open wallet URL; removal kicks them out on next click).

---

## 10. Questions for the owner

1. **One account per staff user (v1)?** A user can be staff of only one seller, and a user who already has a Tallaby seller account cannot be staff (must use another email). OK, or do you need agencies serving several sellers from one login now?
2. **Roles:** `orders`, `products`, `manager` (+ optional "wallet view" tick). Do you also want a `website` (designer) role?
3. **Store-limited product staff:** v1 requires product/coupon staff to cover all stores (products and coupons are shared across a seller's stores). Acceptable?
4. **Seat limits:** how many staff on Free (suggest 2) and later plans?
5. **Payment methods and domains:** keep store payment methods (the numbers customers pay into), subdomain and custom domain **owner-only**, even for managers?
6. **Refunds:** may the `orders` role cancel orders that were paid from the customer wallet (which refunds the customer), or only managers/owner?
7. **Live updates for staff:** v1 with a 60-second refresh of the bell for staff (no realtime change), or realtime from day one (needs a new realtime policy)?
8. **Bell read state:** staff get their own "seen" marker and never mark the owner's notifications read. OK?
9. **Roadmap votes and feature ideas** (`dashboard.tallaby.com/roadmap`): owner only, or may staff vote too?
10. **Invite expiry:** 7 days OK? Should the owner get a bell/email when an invite is accepted or expires?
11. **Audit visibility:** owner sees a staff activity log on the staff page; how long to keep it (suggest 12 months)?
12. **Wallet top-up by staff:** stays owner-only (only *viewing* can be granted). Confirm.
