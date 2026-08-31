# Shipping — Order Stages & Bulk Provider Assignment

## Context

`apps/shipping` (port 3003) is the operations tool. Today its `/orders` page is a **single flat list** with a status dropdown; every assignment is **one order at a time** from the order detail page (`assignProvider` / `assignRider`), and no carrier integration exists — `providers/egypt-post.ts` just spreads `manualAdapter`.

You've contracted **Wassalha Egypt Post**, who have no API. Their handover is a `.xlsx` sheet on a fixed 16-column template uploaded to their dashboard. You also run your own riders ("Tallaby"), who should be load-balanced automatically.

This plan turns `/orders` into a **staged pipeline** with **bulk assignment**, and makes the provider adapter layer do provider-specific work at assign time — an Egypt Post sheet export, or a Tallaby rider split.

**Outcome:** select (or "Assign all") confirmed orders → pick a provider → Egypt Post downloads a ready-to-upload sheet, Tallaby splits them evenly across on-duty riders and shows you each rider's contact details. Every batch is recorded and its sheet re-downloadable.

---

## Decisions taken (confirmed with you)

| | |
|---|---|
| Stage flow | Pending → *mark confirmed* → Confirmed → *assign* → Shipped → *out for delivery* → Out for Delivery → *delivered* → Delivered |
| Assign lives on | The **Confirmed** tab only |
| Prepaid orders | Never appear in Pending — auto-confirmed by derivation (see below) |
| Tallaby rider pool | `role='driver' AND is_available AND NOT is_suspended` |
| City column | `normalizeGovernorate()` → Egypt Post label. **Any unmappable order blocks the whole batch** with a per-order error list |
| Weight / volume | Defaults `1` kg / `Small`, overridable per batch in the dialog; `shipments.package_weight` wins when set |
| Package_Serial / Ref / Post_Id | `1..N` row counter / our `order_number` / `1017575` |
| HasPOD | Always `FALSE` |
| SellerName | Single-seller order → seller's `business_name`; mixed → `Tallaby` |
| Batch history | Yes — new `shipment_batches` + `shipment_batch_items`, with a `/batches` page and re-download |

---

## Stage model — derived, no `orders` schema change

`order_status` already has `pending | confirmed | shipped | out_for_delivery | delivered`, and `shipment_status` has `pending | assigned | out_for_delivery | delivered`. Stages are a **predicate over the existing join**, added to `buildWhere()` in `apps/shipping/app/(admin)/orders/orders.server.ts:61`.

| Tab | Predicate (on top of the existing `SHIPPABLE` guard) | Bulk actions |
|---|---|---|
| **Pending** | `orders.status='pending'` **AND** `payment_status NOT IN ('paid','collected')` | Mark confirmed |
| **Confirmed** | `(orders.status='confirmed' OR (orders.status='pending' AND payment_status IN ('paid','collected')))` **AND** `(shipments.id IS NULL OR shipments.status='pending')` | **Assign / Assign all** |
| **Shipped** | `shipments.status='assigned'` | Mark out for delivery |
| **Out for Delivery** | `shipments.status='out_for_delivery'` | Mark delivered |
| **Delivered** | `shipments.status='delivered'` | — |
| **All** | existing free `?status=` filter, unchanged | — (keeps `failed`/`returned`/`cancelled` reachable) |

The Confirmed predicate's second disjunct is what makes **prepaid orders auto-confirmed** with no cron and no writes: a paid order skips Pending entirely. When Stripe lands (roadmap Phase 4/5) it works with zero further change. `bulkAssignProvider` normalises such an order to `status='confirmed'` in the same transaction it assigns it.

Reuse `isSettled()` (`apps/shipping/lib/shipping-status.ts:131`) for the settled test rather than re-writing the SQL predicate inline.

---

## 1 · Database

**`packages/db/src/drizzle/schema.ts`** + **`relations.ts`**, migration **`packages/db/migrations/0017_shipment_batches.sql`**.

Follow the house convention of `0009_shipping_module.sql` / `0011_shipping_cod_and_crud.sql`: **re-runnable** (`CREATE TABLE IF NOT EXISTS`, `DO $$ … EXCEPTION`), because `drizzle.__drizzle_migrations` is out of sync with `migrations/meta`. Edit only `src/drizzle/schema.ts` — `packages/db/migrations/schema.ts` is a stale duplicate.

```
shipment_batches
  id            uuid pk default random
  seq           integer generated always as identity   -- rendered as BATCH-00007
  provider_id   uuid  -> shipping_providers.id
  created_by    uuid  -> users.id
  order_count   integer not null
  export_format text  null           -- 'egypt_post_xlsx' | null
  metadata      jsonb                -- { weightKg, volume, merchantCode, warehouseName }
  created_at    timestamptz default now()
  index on (created_at desc), (provider_id)

shipment_batch_items
  id         uuid pk
  batch_id   uuid -> shipment_batches.id ON DELETE CASCADE
  order_id   uuid -> orders.id ON DELETE CASCADE
  rider_id   uuid -> users.id null     -- set for Tallaby batches
  unique (batch_id, order_id)
  index on (order_id)
```

Same migration seeds the Tallaby provider (idempotent):
`INSERT INTO shipping_providers (name, code) VALUES ('Tallaby','tallaby') ON CONFLICT (code) DO NOTHING;`

No change to `orders`, `shipments`, or any enum.

---

## 2 · Egypt Post sheet mapping — `packages/lib`

Put the **pure** mapping next to `normalizeGovernorate()`, which already handles English, Arabic and misspelled governorates (`packages/lib/src/shipping/governorate.lib.ts`) — and where `vitest` is already configured.

**New `packages/lib/src/shipping/egypt-post.lib.ts`** (exported from `packages/lib/src/shipping/index.ts`):

- `EGYPT_POST_COLUMNS` — the 16 headers **verbatim and in order**, including the literal `"Package_Ref. Number"` (dot + space) and `"Total_Weight"`:
  `Package_Serial, Description, Total_Weight, Package_volume, COD_Value, Item_Special_Notes, Customer_Name, Mobile_No, Street, City, Package_Ref. Number, Merchant_Name, Warehouse_Name, HasPOD, SellerName, Post_Id`
- `EGYPT_POST_GOVERNORATES: Record<canonical, string>` — maps our 27 canonical keys onto their enum spellings. All 27 map, and the differences are exactly:
  `BEHEIRA→BEHIRA · MONUFIA→MONOUFIA · DAMIETTA→DOMITTA · BENI SUEF→BANI SWEIF · MINYA→MENIA · SOHAG→SOUHAGE · LUXOR→LOUXOR · NEW VALLEY→NEW VALLLEY · NORTH SINAI→NOURTH SINAI` (their typos preserved deliberately — the sheet must match their enum, not correct it)
- `PACKAGE_VOLUMES = ['Small','medium','Large']` — their casing, verbatim
- `toEgyptPostRow(order, index, config)` → `{ row }` or `{ error }`
- `normalizeEgyptianMobile(raw)` → `01XXXXXXXXX`, stripping `+20`/`0020`/spaces/dashes; returns null when it can't produce 11 digits starting `01`

Column derivation:

| Column | Source |
|---|---|
| `Package_Serial` | `index + 1` |
| `Description` | `order_items` joined `"2× Product name"`, truncated to 200 chars |
| `Total_Weight` | `shipments.package_weight` if set, else the batch default (`1`) |
| `Package_volume` | batch default (`Small`) |
| `COD_Value` | `isSettled(payment_status) ? 0 : Number(orders.total_amount)` — mirrors `orders.server.ts:553` |
| `Item_Special_Notes` | `user_addresses.delivery_instructions` + `orders.notes`, joined ` — ` |
| `Customer_Name` | `user_addresses.full_name` ?? `users.full_name` |
| `Mobile_No` | `normalizeEgyptianMobile(address.phone ?? users.phone)` — **error if null** |
| `Street` | `address_line1` + `", " + address_line2` when present |
| `City` | `EGYPT_POST_GOVERNORATES[normalizeGovernorate(address.state ?? address.city)]` — **error if unmapped** |
| `Package_Ref. Number` | `orders.order_number` |
| `Merchant_Name` | `Tallaby` (config) |
| `Warehouse_Name` | `المطريه القاهره` (config) |
| `HasPOD` | `FALSE` |
| `SellerName` | one distinct `sellers.business_name` → that name; otherwise `Tallaby` |
| `Post_Id` | `1017575` (config) |

**New `packages/lib/src/shipping/egypt-post.lib.test.ts`** — mirrors `shipping.lib.test.ts`. Cover: every governorate maps; Arabic `"الدقهلية"` → `DAKAHLIA`; `+201012345678` → `01012345678`; unmapped governorate and bad phone both produce errors; COD 0 for `paid`/`collected`; multi-seller → `Tallaby`.

**Config** — `apps/shipping/providers/egypt-post.constants.ts`, env-overridable, added to `apps/shipping/.env.example`:
`EGYPT_POST_MERCHANT_CODE=1017575`, `EGYPT_POST_MERCHANT_NAME=Tallaby`, `EGYPT_POST_WAREHOUSE_NAME=المطريه القاهره`.

---

## 3 · Provider adapters — one new optional capability

`apps/shipping/providers/types.ts` gains an **optional** `planBulkAssign` so `manual`/`bosta`/`shipblu` need no edits:

```ts
export interface BulkAssignContext {
  orders: BatchOrder[];                  // order + address + items + seller, already loaded
  riders: EligibleRider[];               // on-duty, sorted by activeDeliveries asc
  defaults: { weightKg: number; volume: PackageVolume };
}

export interface BulkAssignPlan {
  riderByOrderId: Record<string, string>;                       // {} for carriers
  export: { format: "egypt_post_xlsx"; rows: EgyptPostRow[] } | null;
  errors: { orderId: string; orderNumber: string; reason: string }[];
}

export interface ShippingProviderAdapter {
  // …existing createShipment / trackShipment / cancelShipment
  planBulkAssign?(ctx: BulkAssignContext): BulkAssignPlan;
}
```

- **`providers/egypt-post.ts`** — implements `planBulkAssign`: `toEgyptPostRow` over every order, collecting `errors`. Its `createShipment` stays the manual no-op (there's still no API).
- **`providers/tallaby.ts`** (new, registered in `providers/index.ts`) — implements `planBulkAssign`: returns `errors: [{ reason: "No Tallaby driver available" }]` when `riders` is empty; otherwise **round-robin weighted by current load** — repeatedly pick the rider with the lowest `activeDeliveries + assignedThisBatch`, ties broken by name. 10 orders / 2 riders → 5 each; 10 / 3 → 4/3/3, and a rider already carrying 4 open deliveries gets fewer.
- **`providers/index.ts`** — add `tallabyAdapter` to `ADAPTERS`.

---

## 4 · Bulk server actions

**New `apps/shipping/app/(admin)/orders/batch.server.ts`** (`"use server"`), so `orders.server.ts` doesn't grow past readability. Every export starts with `await requireShippingAdmin()` and returns the existing `ActionResult` envelope via `actionError()`.

### `bulkAssignProvider(input)`
`batch.dto.ts`:
```ts
z.object({
  providerId: z.uuid(),
  target: z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("ids"), orderIds: z.array(z.uuid()).min(1).max(1000) }),
    z.object({ mode: z.literal("filters"), filters: shippingFiltersSchema }),   // "Assign all"
  ]),
  weightKg: z.coerce.number().min(0.1).max(100).default(1),
  volume: z.enum(PACKAGE_VOLUMES).default("Small"),
})
```
`mode: "filters"` is what makes **"Assign all" cover every matching order, not just the visible page** — it re-runs `buildWhere()` server-side with `stage: "confirmed"` forced, so the client never posts 500 ids and can't race a filter change.

Flow:
1. Resolve provider (must exist **and** be active).
2. Load candidate orders in **one query** — orders + shipment + `user_addresses` + `users` + `order_items` + `sellers.business_name` — re-applying the Confirmed-stage predicate. Any posted id that fails it is reported, not silently skipped.
3. For `tallaby`, load eligible riders (`role='driver' AND is_available AND NOT is_suspended`) with their `activeDeliveries` count — reuse the correlated-subquery shape in `getRiders()` (`orders.server.ts:401`), **keeping its fully-literal SQL identifiers**; the comment there explains why drizzle 0.45.1 breaks otherwise.
4. `getProviderAdapter(code).planBulkAssign?.(ctx)`.
5. **If `plan.errors.length > 0` → return `{ success:false, invalid: plan.errors }` and write nothing.** All-or-nothing: a half-uploaded Egypt Post sheet is worse than none.
6. One `db.transaction`:
   - insert `shipment_batches` (+ `shipment_batch_items` with `rider_id` where planned),
   - `insert … onConflictDoUpdate({ target: shipments.orderId })` per order — `providerId`, `carrier = provider.code`, `riderId` from the plan, `status='assigned'`, `assignedAt=now`, `packageWeight` when not already set,
   - `orders.status='shipped'`, `updatedAt=now`,
   - `order_items.status='shipping_soon'` — matching `ORDER_ITEM_STATUS_BY_SHIPMENT` in `lib/apply-shipment-status.ts:9`.
7. `revalidateShipping()` (extend it with `/batches`).
8. Return `{ batchId, seq, assigned, exportUrl?, riderSplit? }` where `riderSplit` is `[{ riderId, fullName, phone, email, avatarUrl, orderCount }]`.

### `bulkConfirmOrders(orderIds)`
Pending-stage only. Single `UPDATE orders SET status='confirmed' WHERE id = ANY(...) AND status='pending'`; returns the affected count.

### `bulkUpdateShipmentStatus(orderIds, status)`
For *Mark out for delivery* / *Mark delivered*. Loops **`applyShipmentStatus()`** (`lib/apply-shipment-status.ts`) per order — do **not** reimplement it: it is the single writer that mirrors onto the order, writes the `deliveries` audit row and calls `creditSellerOnDelivery` on delivered. Each order gets its own transaction; collect per-order failures and return `{ succeeded, failed: [{orderNumber, reason}] }` so one bad row doesn't roll back 40 good ones.

---

## 5 · Sheet download

Add **`xlsx@^0.18.5`** to `apps/shipping/package.json` (same version already used at `apps/dashboard/actions/products.ts:32`).

**New `apps/shipping/app/(admin)/batches/[batchId]/export/route.ts`** — a route handler, not a server action, so the same URL serves both the post-assign download and the re-download from `/batches`:
- `requireShippingAdmin()`,
- load the batch + its orders, re-run `toEgyptPostRow` (rows are regenerated from live data rather than stored — the batch's `metadata` pins the weight/volume/merchant config used),
- `XLSX.utils.json_to_sheet(rows, { header: EGYPT_POST_COLUMNS })` → `XLSX.write(wb, { type:"buffer", bookType:"xlsx" })`,
- respond with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and `Content-Disposition: attachment; filename="egypt-post-BATCH-00007.xlsx"`,
- 404 when `export_format` is null (a Tallaby batch has no sheet).

Client triggers it with `window.location.href = exportUrl` after a successful assign.

---

## 6 · UI

### Tabs
- `orders.dto.ts` — `ORDER_STAGES = ['pending','confirmed','shipped','out_for_delivery','delivered','all'] as const`; add `stage` to `shippingFiltersSchema` (default `'pending'`) and to `parseFilters()`, following its existing degrade-independently `pick()` idiom.
- **New `_components/stage-tabs.tsx`** (client) — `@workspace/ui/components/tabs` styling over `<Link>`s that set `?stage=` and drop `page`, each with a count badge.
- `orders.server.ts` — new `getStageCounts()`: one row of `count(*) filter (where …)` per stage, same shape as the existing `getShippingStats()`.
- `orders/page.tsx` — the `<Suspense key>` already serialises all params, so a stage switch re-suspends correctly with no change.

### Selection
`_components/orders-table.tsx` becomes `"use client"` with two new optional props — `selectable` and `stage`. It's currently pure presentational markup, so converting is cheap and avoids forking a second table. The dashboard's "Recent activity" usage (`app/(admin)/page.tsx:162`) passes neither and renders exactly as today.

- Selection state is a plain `Set<string>` in the table — **do not add `@tanstack/react-table`**; it isn't a dependency of `apps/shipping`, and `TableSection`'s in-memory pagination fights the server-side `?page=` pagination this list uses.
- Header checkbox = select-all-on-page (`@workspace/ui/components/checkbox`), indeterminate when partial.
- A sticky action bar appears once anything is selected: `N selected · [primary action] · Clear`, where the primary action is per stage (Mark confirmed / **Assign** / Mark out for delivery / Mark delivered).
- The Confirmed tab additionally shows **`Assign all (M)`** in the toolbar, always enabled — it posts `mode:"filters"`.

### Assign dialog
**New `_components/assign-dialog.tsx`** (client, `@workspace/ui/components/dialog`), following the `provider-form-dialog.tsx` + `useTransition` + `toast` + `router.refresh()` idiom already used in `[orderId]/_components/shipping-actions.tsx:61`:
- header states the count and whether it's "all matching orders" or "N selected",
- provider `Select` fed by `getActiveProviders()`,
- **Egypt Post selected** → reveals default weight + volume fields,
- **Tallaby selected** → shows the eligible-rider count, or a disabled submit with *"No Tallaby driver available"* when zero,
- submit → `bulkAssignProvider`. On failure with `invalid[]`, the dialog **stays open** and renders a scrollable per-order error list (`TLB-100234 — governorate "Al Daqahleya X" not recognised`) so you can fix the addresses.
- On success it switches to a **result view** before closing:
  - Egypt Post → "42 orders assigned · Batch BATCH-00007" + a Download button (also auto-triggered),
  - Tallaby → a rider card per driver with **avatar, full name, phone, email and order count** — the "full account info, especially contact info" you asked for — each linking to `/riders/[riderId]`.

### Batches page
- **New `app/(admin)/batches/page.tsx`** + `batches.server.ts` — reference, provider, order count, creator, date, and a download link for `egypt_post_xlsx` batches.
- **New `app/(admin)/batches/[batchId]/page.tsx`** — the batch's orders and, for Tallaby, the rider each went to.
- Add `{ title: "Batches", href: "/batches", icon: FileSpreadsheet }` to `_components/layout/sidebar.tsx` and `mobile-nav.tsx`.
.
### Copy
Admin surface strings are hardcoded English (only `rider`/`status` keys exist in `messages/*.json`) — keep new admin copy hardcoded and consistent with that. No i18n work.

---

## Files

**New**
```
packages/db/migrations/0017_shipment_batches.sql
packages/lib/src/shipping/egypt-post.lib.ts
packages/lib/src/shipping/egypt-post.lib.test.ts
apps/shipping/providers/tallaby.ts
apps/shipping/providers/egypt-post.constants.ts
apps/shipping/app/(admin)/orders/batch.server.ts
apps/shipping/app/(admin)/orders/batch.dto.ts
apps/shipping/app/(admin)/orders/_components/stage-tabs.tsx
apps/shipping/app/(admin)/orders/_components/assign-dialog.tsx
apps/shipping/app/(admin)/orders/_components/bulk-action-bar.tsx
apps/shipping/app/(admin)/batches/{page.tsx,batches.server.ts,[batchId]/page.tsx}
apps/shipping/app/(admin)/batches/[batchId]/export/route.ts
```

**Modified**
```
packages/db/src/drizzle/{schema.ts,relations.ts}      + 2 tables
packages/lib/src/shipping/index.ts                    + egypt-post exports
apps/shipping/package.json                            + xlsx
apps/shipping/.env.example                            + EGYPT_POST_*
apps/shipping/providers/{types.ts,index.ts,egypt-post.ts}
apps/shipping/app/(admin)/orders/orders.dto.ts        + stage
apps/shipping/app/(admin)/orders/orders.server.ts     + stage predicates, getStageCounts, revalidate /batches
apps/shipping/app/(admin)/orders/orders.data.tsx      + tabs, selectable table
apps/shipping/app/(admin)/orders/_components/orders-table.tsx   → client + selection
apps/shipping/app/(admin)/_components/layout/{sidebar.tsx,mobile-nav.tsx}
```

## Reused, not rebuilt

- `normalizeGovernorate()` — `packages/lib/src/shipping/governorate.lib.ts` (Arabic + misspelling aliases already covered)
- `applyShipmentStatus()` — `apps/shipping/lib/apply-shipment-status.ts` (the only sanctioned status writer; handles order mirroring, `deliveries` audit, `creditSellerOnDelivery`)
- `isSettled()`, `getStatusColor()`, `getStatusLabel()` — `apps/shipping/lib/shipping-status.ts`
- `getProviderAdapter()` — `apps/shipping/providers/index.ts`
- `requireShippingAdmin()` — `apps/shipping/lib/auth.ts`
- `ActionResult` / `actionError()` — `apps/shipping/lib/action-result.ts`
- `getRiders()`'s literal-SQL correlated subqueries — `orders.server.ts:401`
- `shipments_order_id_unique` — makes every assignment upsert idempotent
- shadcn `dialog`, `checkbox`, `tabs`, `select`, `table` from `@workspace/ui`

---

## Build order

1. Schema + migration + Tallaby seed; `pnpm --filter @workspace/db typecheck`.
2. `egypt-post.lib.ts` + its vitest suite — green before any UI exists.
3. Adapter contract, `egypt-post.planBulkAssign`, `tallaby.ts`.
4. `batch.dto.ts` / `batch.server.ts` bulk actions.
5. Export route handler.
6. Stage tabs + counts + selection table.
7. Assign dialog + bulk action bar.
8. `/batches` pages + nav.

---

## Verification

**Automated**
- `pnpm --filter @workspace/lib test` — the Egypt Post mapping suite (all 27 governorates, Arabic input, phone normalisation, COD zeroing, multi-seller).
- `pnpm typecheck` and `pnpm lint` across the workspace.

**Manual — `pnpm --filter shipping dev` (http://localhost:3003), signed in as a verified admin**
1. **Stages** — each tab shows only its predicate's orders and the badge counts match the rows. A COD order sits in Pending; manually set one order's `payment_status='paid'` in SQL and confirm it jumps to Confirmed without any write from the app.
2. **Confirm** — select 3 pending orders → *Mark confirmed* → they move to Confirmed and `orders.status='confirmed'` in the DB.
3. **Egypt Post, partial selection** — check 5 orders on Confirmed → *Assign* → Egypt Post → submit. Expect: `.xlsx` downloads; open it and verify the header row matches the template **exactly** (including `Package_Ref. Number`), `Package_Serial` is 1–5, `City` values are all from their enum, `COD_Value` is 0 for the prepaid one, `Post_Id` is `1017575`, `Warehouse_Name` is `المطريه القاهره`. Upload it to the Wassalha dashboard as the real acceptance test.
4. **Blocked batch** — set one order's `user_addresses.state` to `"Nowhere"` and assign it. Expect: dialog stays open listing that order, **nothing written** — verify no new `shipment_batches` row and the order is still in Confirmed.
5. **Assign all** — filter Confirmed by COD, click *Assign all (M)* with more than one page of results, and confirm the sheet contains all M rows, not just the visible 20.
6. **Tallaby, no riders** — set every driver `is_available=false` → assign to Tallaby → *"No Tallaby driver available"*, nothing written.
7. **Tallaby split** — turn 2 riders on, assign 10 orders → 5/5, dialog shows both riders with phone and email; verify in `shipment_batch_items.rider_id`. Repeat with 3 riders → 4/3/3. Give one rider 4 pre-existing open deliveries and confirm they receive fewer.
8. **Rider app** — log in as an assigned rider at `/rider`; the orders appear in their queue.
9. **Downstream stages** — from Shipped, *Mark out for delivery* on several, then *Mark delivered*; confirm `orders.status`, `order_items.status`, the `deliveries` audit rows, and that `creditSellerOnDelivery` credited the seller wallet.
10. **Batches** — `/batches` lists both batches; re-download the Egypt Post sheet and diff it against the original; the Tallaby batch offers no download.
11. **Idempotency** — re-run an assign on already-assigned orders and confirm they're rejected as out-of-stage rather than duplicated (`shipments_order_id_unique`).
