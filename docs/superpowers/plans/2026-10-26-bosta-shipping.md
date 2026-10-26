# Bosta shipping integration — design and implementation plan

**Branch:** `feat/bosta-shipping` · **Date:** 2026-10-26 · **Status:** Planned (nothing built)
**Owner request:** a seller links their own Bosta account (API key) from the dashboard, and new orders ship with Bosta automatically according to the store's shipping settings. The connection flow walks the seller through it step by step.

Sources read for this plan:

- Bosta docs: <https://docs.bosta.co/docs/how-to/get-your-api-key>, *create your first delivery*, *get delivery status via webhook*, *format Bosta address*, *create your first pickup location*, *create your first pickup*, *print AWBs*, *whitelisting*.
- The full OpenAPI spec behind the API reference page: `https://docs.bosta.co/api/api.yaml` (OpenAPI 3.0.1, "Bosta Server APIs" v2.0.0).
- Repo code (paths below).

---

## 1. What Bosta's API gives us (verified from the docs and spec)

| Need | Bosta API | Notes |
|---|---|---|
| Auth | Header `Authorization: <API_KEY>` (no `Bearer`), `Content-Type: application/json` | Base URL `https://app.bosta.co/api/v2`. **No sandbox or staging environment is documented.** |
| Key scopes | **Read only**: GET. **Read/Write**: GET/POST/PUT/PATCH. **Full access**: also DELETE | The seller creates the key in the Bosta dashboard: *Settings › API Integration › Request OTP › Create API key › name + scope › copy (shown once)*. |
| Verify the key + list pickup locations | `GET /pickup-locations` → `data.list[] { _id, locationName, address{ firstLine, city{_id,name}, district }, contactPerson, isDefault }` | Doubles as the connection test. The list is empty for an account without a pickup location; delivery creation then fails with error `1073`. |
| Create a delivery | `POST /deliveries?apiVersion=1` | Body: `type` (10 = Deliver), `cod` (required; ≥0, max 30 000 EGP), `specs{ packageType, size, packageDetails{ itemsCount, description } }`, `dropOffAddress`, `receiver{ firstName*, lastName, phone*, secondPhone, email }`, `businessReference`, **`uniqueBusinessReference`** (unique across all orders, so it protects against duplicates), `notes`, `businessLocationId`, `allowToOpenPackage` (+ `deliveryImages` of type `ALLOW_TO_OPEN_THE_PACKAGE` with 1–10 image URLs, error `2150` without them), `goodsInfo.amount` (item value, used for insurance), `webhookUrl`, `webhookCustomHeaders{ Authorization }`, `escrowInfo{ isExcluded }`. Response `data{ _id, trackingNumber, state{code,value} }`. |
| Drop-off address | `{ city (name)*, firstLine* (>5 chars), districtId \| (districtName + cityId), zoneId?, secondLine, buildingNumber, floor, apartment, isWorkAddress }` | Errors `3001`–`3004` and `3009` mean an unknown city, zone or district. |
| Geography | `GET /cities` and `GET /cities/getAllDistricts` (**public, no auth**) | Cities have `_id`, `name`, `nameAr`, `code` (`EG-01`…), `dropOffAvailability`. A district has `zoneId/zoneName/zoneOtherName`, `districtId/districtName/districtOtherName` (Arabic) and `dropOffAvailability`. Egypt only. |
| Track | `GET /deliveries/business/{trackingNumber}` → `state{code,value}`, `maskedState`, addresses, `cod` | Used for the fallback sync. Re-checking with this call also confirms each webhook. |
| Status push | Per-delivery `webhookUrl` + `webhookCustomHeaders` (or one account-wide webhook in the Bosta dashboard) | Bosta POSTs on **status changes only**: `{ _id, trackingNumber, state, type, cod, timeStamp, exceptionCode, exceptionReason, businessReference, numberOfAttempts, … }`. **There is no signature; the only auth is the custom header. Retries are not documented.** |
| Cancel | `DELETE /deliveries/business/{trackingNumber}/terminate` | **Needs a Full access key** (DELETE). |
| Label (AWB) | `POST /deliveries/mass-awb { trackingNumbers: "a,b", requestedAwbType: "A4"\|"A6", lang: "ar"\|"en" }` | Returns a base64 PDF for up to 50 AWBs; above 50, Bosta emails the file instead. Up to 1000 AWBs per call. Only printable orders. |
| Pickup scheduling | `POST /pickups { scheduledDate, businessLocationId, contactPerson, numberOfParcels }` | No Fridays, no holidays, cut-off for same day, one pickup per day per location. **Phase 2** (most sellers have a recurring pickup in Bosta). |
| Whitelisting | Bosta's outbound IPs `34.89.199.241`, `35.246.223.19` | Only matters if our webhook endpoint filters by IP. Vercel doesn't, so we keep it as an extra optional check. |

**State codes → our `shipment_status`** (`pending | assigned | out_for_delivery | delivered | failed | returned | cancelled`):

| Bosta state | Meaning | Ours | Order effect |
|---|---|---|---|
| 10, 11, 20 | Created / waiting for route / route assigned | `assigned` | items `shipping_soon` |
| 21, 24, 30, 41 | Picked up / at warehouse / in transit / out for delivery | `out_for_delivery` | order `out_for_delivery`, `shipped_at` |
| 47 | Exception (NDR) | stays `out_for_delivery`; `failure_reason` = Bosta reason, shown to the seller | none (Bosta retries) |
| 45 | Delivered | `delivered` | existing delivered path (wallet credit, EGP 5 fee, emails, affiliates) |
| 46, 60 | Returned to business / to stock | `returned` | order `returned` |
| 48, 100, 101 | Terminated / lost / damaged | `failed` | none; the seller decides |
| 49 | Canceled | `cancelled` | order `cancelled` |
| 102, 103, 105 | Investigation / awaiting your action / on hold | unchanged + "needs attention" flag | none |
| 104 | Archived | ignored | — |

---

## 2. What already exists in the repo (verified 2026-10-26)

- **Per-store integrations framework.** `store_integrations` (`schema.ts:2994`, unique on `(store_id, provider)`, RLS on, no policies), AES-256-GCM `encryptCredentials` / `decryptCredentials` with AAD `store_integrations:{storeId}:{provider}` (`packages/lib/src/integrations/crypto.server.ts`), registry `packages/lib/src/integrations/registry.ts`, provider CHECK in `0056`. **Meta CAPI is the template to copy** (paste a secret, keep the saved one on an empty field, test, record the last result): `packages/lib/src/integrations/meta-capi.server.ts` + `apps/dashboard/app/(main)/stores/[storeId]/apps/meta-capi.{server,client}.tsx`.
- **Apps page**: `apps/dashboard/app/(main)/stores/[storeId]/apps/` (catalog, Google Sheets and Shopify flows as further examples).
- **Shipping page**: `apps/dashboard/app/(main)/stores/[storeId]/shipping/` with `stores.settings.shipping.method: "tallaby" | "own"` (`packages/lib/src/shipping/store-zones.ts:57`) and zones that bill the customer.
- **Shipments**: `shipments` (one per order, `shipments_order_id_unique`, `carrier`, `tracking_number`, `shipping_label_url`, `failure_reason`, `status`) plus a `deliveries` event log.
- **Seller status primitive**: `applySellerShipmentStatus` (`apps/dashboard/lib/shipping/apply-seller-shipment.ts`). It runs one transaction that moves the shipment, order, items, seller wallet (`creditSellerOnDelivery`), affiliate commissions and emails, guarded by `expectedFromStatus`. It currently lives in the dashboard app, and only creates `carrier: "seller"` shipments.
- **Bosta stub**: `apps/shipping/providers/bosta.ts` (`{ ...manualAdapter, code: "bosta" }`) for the **admin** shipping app (platform account, not per seller). `shipping_providers` has a `bosta` row (`0009`).
- **Order placement**: `packages/lib/src/orders/place-order.ts`; the storefront caller `apps/ecommerce/actions/order.ts` already schedules post-order work with Next `after()` (store Meta CAPI at :200). Card and wallet orders become paid later through the Kashier webhook (`apps/backend/src/routes/kashier.ts`).
- **Crons**: `apps/dashboard/vercel.json` → `/api/cron/google-sheets` (loops over connected stores, `CRON_SECRET`); this is the model for the sync cron.
- **Places**: `packages/lib/src/places/` (`EG/CAIRO/nasr-city` keys, Arabic and English names, `resolveAddressPlace`). The address has `city` and `state` (governorate) as text and **no district column**.

---

## 3. Product design

### 3.1 Where it lives (two entry points, one source of truth)

1. **Apps › Bosta** (`/stores/[storeId]/apps/bosta`) is the connect wizard and its settings. The Bosta card goes under a new **Shipping** category in the Apps catalog.
2. **Shipping settings** (`/stores/[storeId]/shipping`) gains a **"Delivery partner"** card above the zones:
   - **Not connected:** "Ship your orders with Bosta automatically" + **Connect Bosta** (opens the wizard).
   - **Connected:** Bosta logo, pickup location, and the **"Create Bosta shipments"** choice: **Manually** (default; the seller presses "Ship with Bosta" on each order) or **Automatically when I confirm an order**. Saving it updates the integration's `config.autoShip`. There are also **Change Bosta settings** (opens Apps › Bosta) and **Disconnect**.
   - Bosta only appears when the store delivers itself (`method = "own"`). When `method = "tallaby"`, the card says Bosta needs "Own delivery".
   - Zones keep billing the customer as today. Bosta's price to the seller is between the seller and Bosta.

The integration row (`store_integrations`, provider `bosta`) holds the key and the Bosta options. `stores.settings.shipping` is not duplicated.

### 3.2 Connect wizard (stepper, Arabic first, RTL-safe, mobile-first)

A full page with a 4-step progress bar at the top, a "Need help?" link to Bosta's guide, and steps the seller can go back to.

**Step 1: Bosta account.**
- "Do you have a Bosta business account?" with two cards:
  - **Yes, I have one** → next step.
  - **Not yet** → opens `https://bosta.co/business` (sign-up) in a new tab, plus a short checklist: *create the account → verify your phone → add a pickup location (the address Bosta collects orders from)*.
- Each checklist item is a small illustrated row. The seller ticks "Done, continue".

**Step 2: Create your API key.** A numbered visual guide with a screenshot or illustration per step, using Bosta's wording in both languages:
1. Open the Bosta dashboard → **Settings** → **API Integration** (button "Open Bosta settings" → `https://business.bosta.co/settings/api-integration`[^1]).
2. Click **Request OTP** and enter the code sent to your phone.
3. Click **Create API key** and name it `Tallaby`.
4. Choose a permission:
   - **Read/Write** (recommended).
   - **Full access** only if you want to cancel Bosta shipments from Tallaby. We explain why in one line.
5. **Copy the key now.** Bosta shows it only once.

**Step 3: Paste and verify.**
- A password-style input with paste and show/hide buttons, then **Verify key**.
- The server calls `GET /pickup-locations` with the key:
  - Success: "Connected ✓, we found 2 pickup locations".
  - `401`/`1028`: "This key is not valid or was disabled in Bosta".
  - Empty list: "Add a pickup location in Bosta first" + link, and we stay on the step.
- The key is encrypted at rest and never sent back to the browser. After saving, the field shows `••••1234` and a **Replace key** action.

**Step 4: Shipping preferences.** Every field has a sensible default, so the seller can just press **Finish**.
- **Pickup location:** radio cards from Bosta, with Bosta's default preselected.
- **When to create the Bosta shipment** (the same choice as on the Shipping settings card):
  - **Manually** (default): a "Ship with Bosta" button on each order, plus a bulk action.
  - **Automatically when I confirm the order.**
- **Package size:** Small / Medium / Large (default Small) + **Allow customer to open the package** (default off). When on, we send the order's product photos automatically, which satisfies Bosta's image rule.
- **Note on every shipment** (optional, prefilled from the order note).
- **Summary + Finish** → success screen: "Bosta is connected. Press *Ship with Bosta* on any order" (or "…orders ship automatically when you confirm them", depending on the choice), with buttons **Go to orders** and **Shipping settings**.

**After connecting (same page = settings view):**
- Status badge: Connected / Error with the last error and time.
- **Test connection**, **Replace key**, preferences form, **Disconnect**. The confirm dialog says: "Shipments already sent to Bosta stay in Bosta, but Tallaby will stop updating their status."
- Disconnect deletes the credentials. Shipment rows and their history stay.

[^1]: Verify the exact Bosta dashboard URL during implementation; fall back to `https://business.bosta.co` + the written path.

### 3.3 Orders UX

- **Order list:** a small Bosta badge with the tracking number and Bosta status chip. There is a filter "Bosta: needs attention".
- **Order detail › Delivery card** (when Bosta is connected):
  - **Not shipped yet:** **Ship with Bosta** opens a confirm sheet that previews the address mapping (city/district resolved, COD amount, package size), with a district picker if we could not map it.
  - **Shipped:**
    - Tracking number (copy) + **Track on Bosta** (`https://bosta.co/tracking-shipments?shipment-number=<n>`).
    - Status timeline from the event log.
    - **Print label (A4 / A6)**.
    - **Cancel shipment**: only with a Full-access key, and only before pickup (states 10/11/20). Otherwise a hint says "cancel it from your Bosta dashboard".
  - **Failed to create:** a red box with the reason translated from Bosta's error code (`3001`–`3009` address, `1073` no pickup location, `1028` key, `2150` images), plus **Fix address** / **Retry**.
- **Bulk action** on the orders table: **Ship with Bosta** and **Print Bosta labels** for the selected orders. Labels for up to 50 orders come back as one PDF.
- **Seller notifications** (the `seller_notifications` table from 0098): "Bosta shipment failed for order #123", "Order #123 delivered by Bosta".

### 3.4 What gets sent to Bosta (mapping)

| Bosta field | From |
|---|---|
| `type` | `10` (Deliver) |
| `cod` | Cash on delivery → the order total in EGP (piastres ÷ 100, integer math). Prepaid (card/wallet paid) → `0`. COD above 30 000 EGP → refuse with a clear message. |
| `receiver` | Address `full_name` split into first and last name, `phone` normalised to `01XXXXXXXXX`, customer email if any |
| `dropOffAddress` | `firstLine` = `address_line1` (padded with the city name if it has ≤5 chars), `secondLine` = `address_line2` + `delivery_instructions`; `city` / `districtId` / `zoneId` from the **place → Bosta mapping** (§4.3) |
| `businessReference` | the order number (shown to the seller in Bosta) |
| `uniqueBusinessReference` | `tallaby:<orderId>`, so Bosta itself rejects a second shipment for the same order |
| `specs` | `packageType: "Parcel"`, `size` from settings, `packageDetails{ itemsCount: Σ quantity, description: first item names, ≤ 120 chars }` |
| `goodsInfo.amount` | items subtotal (insurance) |
| `notes` | settings note + the customer's order note |
| `businessLocationId` | chosen pickup location |
| `allowToOpenPackage` + `deliveryImages` | from settings; up to 10 product image URLs from the order items |
| `webhookUrl` / `webhookCustomHeaders.Authorization` | `https://<backend>/webhooks/bosta/<integrationId>` + `Bearer <per-store webhook token>` |
| `escrowInfo` | `{ isExcluded: true }`, so Bosta never asks the customer for an extra WhatsApp deposit on top of our checkout |

**Scope (MVP):** storefront orders (`orders.store_id = store`) of stores with `method = "own"`. Marketplace orders stay on Tallaby's delivery as today; they are a later phase.

---

## 4. Technical design

### 4.1 Data (migration `0106_bosta_shipping.sql`, hand-written, idempotent)

1. Recreate the `store_integrations_provider_check` constraint to add `'bosta'` (drop-if-exists + add, guarded).
2. `shipments`: add `external_id text`, `external_state_code smallint`, `external_state text`, `store_integration_id uuid null references store_integrations(id) on delete set null`, `last_synced_at timestamptz`, `needs_attention boolean not null default false`, `last_error text`. Add a partial unique index on `(carrier, external_id) where external_id is not null`.
3. New table **`shipment_carrier_events`** (server-only; RLS on, no policies). Its columns are `id`, `shipment_id` (fk cascade), `carrier`, `state_code`, `state_text`, `exception_code`, `exception_reason`, `occurred_at`, `payload jsonb`, `created_at`, with `UNIQUE (shipment_id, state_code, occurred_at)` so webhook replays dedupe. `deliveries` is rider-centric, so we keep it untouched.
4. Mirror everything in `packages/db/src/drizzle/schema.ts` and `relations.ts`. No `drizzle-kit generate`.
5. Rollout: staging first, then production with owner approval (CLAUDE.md rule 6). It is additive only, so the old code keeps working.

`store_integrations` for Bosta:
- `config`: `{ pickupLocationId, pickupLocationName, autoShip: "manual" | "on_confirm" (default "manual"), size: "SMALL" | "MEDIUM" | "LARGE", allowToOpenPackage, note, keyHint: "1234", canCancel: boolean }`.
- `credentials_encrypted`: `{ apiKey, webhookToken }`.
- `external_account_id`: the business id from the pickup-locations response (when present).

### 4.2 Code layout

```
packages/lib/src/shipping/bosta/
  bosta.types.ts          request/response/webhook types (from api.yaml)
  bosta.client.server.ts  fetch wrapper: base URL, Authorization header, 15 s timeout,
                          typed errors (BostaError{ status, errorCode, message }), no key in logs
  bosta-states.lib.ts     state code → ShippingStatus / attention (pure, unit-tested)
  bosta-errors.lib.ts     Bosta errorCode → i18n key (pure)
  bosta-payload.lib.ts    order + address + settings → create-delivery body (pure, unit-tested)
  bosta-geo.data.ts       snapshot of GET /cities + /cities/getAllDistricts (generated)
  bosta-geo.lib.ts        place key / free-text city → { city, cityId, districtId, zoneId } (pure)
  (phone: reuses normalizeEgyptianMobile from shipping/egypt-post.lib.ts)
packages/lib/src/integrations/
  bosta.server.ts         saveBostaCredentials / getStoreBostaCredentials / testStoreBosta /
                          saveBostaSettings / recordBostaResult (copy of meta-capi.server.ts)
packages/lib/src/shipping/
  apply-seller-shipment.server.ts   MOVED from apps/dashboard/lib/shipping (same code, re-exported
                                    from the old path) so the webhook and cron can call it
  bosta-ship.server.ts    shipOrderWithBosta(storeId, orderId, trigger): claim → call → record
  bosta-sync.server.ts    applyBostaState(shipment, state, occurredAt, payload): event insert +
                          walk the allowed transitions through applySellerShipmentStatus
packages/lib/scripts/bosta-geo-snapshot.ts  pnpm --filter @workspace/lib bosta:geo → regenerates bosta-geo.data.ts
apps/dashboard/app/(main)/stores/[storeId]/apps/bosta/
  page.tsx · bosta-wizard.client.tsx · bosta-settings.client.tsx · bosta.server.ts (actions) ·
  bosta.dto.ts (zod) · bosta.types.ts
apps/dashboard/app/(main)/stores/[storeId]/shipping/delivery-partner.client.tsx
apps/dashboard/app/(main)/orders/…  Bosta delivery card, bulk actions, label route
apps/backend/src/routes/bosta.ts    POST /webhooks/bosta/:integrationId
apps/dashboard/app/api/cron/bosta-sync/route.ts  fallback poll (CRON_SECRET)
```

### 4.3 Address mapping (the hard part)

- **Geo snapshot.** `pnpm bosta:geo` fetches the public `/cities` and `/cities/getAllDistricts` and writes `bosta-geo.data.ts`. It is checked in and refreshed by hand, so there is no runtime dependency and the data stays testable.
- **Governorate → Bosta city.** A hand-checked table maps our 27 `EG/<GOV>` keys to Bosta city `_id`/`name`. A unit test asserts every governorate maps to a Bosta city with `dropOffAvailability`.
- **City/district → Bosta district.** Normalise Arabic and English names (strip "ال", hamza/ya/ta-marbuta variants, "qesm", digits) and match our place's names and aliases (`egypt.ts`) against `districtName` / `districtOtherName` / `zoneName` within that Bosta city. A generated alias table records manual fixes.
- **Fallbacks, in order:**
  1. Exact district match → `districtId`.
  2. Zone match → the first district of that zone.
  3. Send `cityId` + `districtName` (Format 2) with our city name and let Bosta resolve it.
  4. If Bosta answers `3001`–`3003`/`3009`, mark the shipment `needs_attention` and show the district picker (the Bosta district list for that city) in the order card. The seller's pick is saved as an alias for that store's future orders.
- **Checkout improvement (later, optional):** when the store has Bosta, the address form can store `place_key` on the address. That needs an address column and is not part of the MVP.

### 4.4 Auto-ship triggers

`shipOrderWithBosta(storeId, orderId, trigger)` is idempotent:

1. Load the order **scoped by `store_id` and the store's `seller_id`**, the integration row (`status = connected`) and the store shipping method (`own`).
2. **Claim:** insert or update the `shipments` row (`carrier = 'bosta'`, `status = 'pending'`, `store_integration_id`) with `ON CONFLICT (order_id)`. Skip if it already has an `external_id` or another carrier.
3. Call `POST /deliveries` with `uniqueBusinessReference = tallaby:<orderId>`.
4. **Success:**
   - Set `external_id`, `tracking_number`, `external_state_code = 10`.
   - `applySellerShipmentStatus(… status: "assigned")`, which sets items to `shipping_soon`.
   - Insert the first event.
5. **Failure:**
   - Set `last_error` and `needs_attention`.
   - Send a seller notification.
   - The order stays as it was, so the seller can retry.
   - A duplicate-reference error triggers a lookup with `GET /deliveries/search` by business reference, which repairs the link.

Callers:
- **`on_confirm`**: the seller confirm action in `apps/dashboard/app/(main)/orders/orders.server.ts` (the confirm path, ~:116). After the confirm commits, run it via `after()`; the order page shows "Creating Bosta shipment…" and refreshes.
  - It is skipped for orders that are not paid yet (online payment still processing or failed).
- **`manual`** (default) / retry / bulk: dashboard server actions with an explicit `storeId` (CLAUDE.md rule 5).
- Shipping when the order is placed is out of scope (owner, 2026-10-26).
- **Safety net:** the sync cron also picks up `pending` Bosta shipments with no `external_id` that are older than 10 minutes and retries them (max 3 tries, backoff), so a crashed `after()` doesn't lose an order.

### 4.5 Status updates

- **Webhook** `POST /webhooks/bosta/:integrationId` (Hono backend, public):
  1. Look up the integration and decrypt `webhookToken`. Compare it to the `Authorization` header with `timingSafeEqual`, and reject with 401 on a mismatch.
  2. Find the shipment by `(carrier='bosta', external_id=_id)` **and** `store_integration_id = integrationId`.
  3. **Don't trust the payload's state.** Re-fetch `GET /deliveries/business/{trackingNumber}` with the store's key and use the returned `state.code`. This defends against a leaked token and against out-of-order delivery.
  4. Call `applyBostaState`, then always answer `200` quickly. An unknown shipment also gets `200`, so Bosta doesn't retry forever.
- **`applyBostaState`**:
  - Insert the event (`ON CONFLICT DO NOTHING`).
  - Map the code to the target status. If the target is "behind" the current one, ignore it, because states can arrive out of order.
  - Walk the legal transitions one by one (`assigned → out_for_delivery → delivered`) through `applySellerShipmentStatus`, with its `expectedFromStatus` guard. `delivered` therefore runs the **existing** wallet, fee and email path once, with no new money code.
  - Exception (47) sets `failure_reason` + `needs_attention` without a status move.
- **Fallback cron** `/api/cron/bosta-sync` (every 30 min) handles shipments that are not final and not synced in the last 2 h. For each it calls `GET /deliveries/business/{tn}` and then `applyBostaState`. It runs in batches per store with a concurrency cap and stops on `401`, marking the integration `error`. This covers lost webhooks, since Bosta's retries are undocumented.

### 4.6 Money and ledgers (no new money logic)

- A Bosta order is an **own-delivery, seller-collected** COD order. Bosta pays the seller directly, and Tallaby never touches that cash.
- The only Tallaby effect is the existing **EGP 5 fee per delivered order** plus the existing store-wallet path, triggered by `delivered` through `applySellerShipmentStatus` → `creditSellerOnDelivery`.
- **Check before building:** `creditSellerOnDelivery` / `resolveCollectionParty` must treat `carrier = 'bosta'` exactly like `carrier = 'seller'`. If they branch on the carrier, the fix is a one-line carrier list. That change is still a money-logic change, so it **needs owner sign-off** (rule 4).
- Bosta's shipping fee to the seller is not recorded in Tallaby.

### 4.7 Security checklist

- The API key and webhook token are encrypted with AAD bound to `store_integrations:{storeId}:bosta`. They are never selected into client props, never logged, never put in `NEXT_PUBLIC_*`, and errors are redacted before `last_error`.
- Every action takes an explicit `storeId` and checks `stores.seller_id = session seller`. Child rows are filtered by `store_id`.
- The webhook is per-integration (id in the path + secret header + re-fetch with the store's own key). One store's token can never move another store's shipment.
- Outbound calls go only to the fixed host `app.bosta.co`, with a timeout. There is no URL from the seller (no SSRF).
- Rate-limit the dashboard "Verify key" action (5/min per store) to stop key-guessing through us.
- Nothing about Bosta is cached (rule 8: orders and secrets are never cached). The Apps catalog status uses the existing `storeIntegrations(storeId)` tag.

### 4.8 i18n

All new strings go in `apps/dashboard/messages/ar.json` + `en.json` (namespace `apps.bosta`, `shipping.partner`, `orders.bosta`), plus the Bosta error-code texts and state labels. Arabic is the default and the brand is **طلبي**. The wizard copy uses Bosta's Arabic UI terms so the seller recognises the screens.

---

## 5. Tasks (in order; each ends with `pnpm lint`, `pnpm typecheck`, `pnpm test` for the touched packages)

| # | Task | Depends | Done when |
|---|---|---|---|
| **BS-01** | **Bosta client + pure libs**: types from `api.yaml`, `bosta.client.server.ts`, states, errors, phone, payload builder | — | Unit tests cover the state map (every documented code), the error map, phone normalisation, COD (cash vs prepaid, 30 000 cap) and firstLine padding |
| **BS-02** | **Geo snapshot + mapping**: `pnpm bosta:geo`, `bosta-geo.data.ts`, governorate table, name normaliser, matcher with fallbacks | BS-01 | All 27 governorates map; a sample of Cairo/Giza/Alexandria districts from `egypt.ts` resolves; the unmatched list is written to the plan log |
| **BS-03** | **Migration `0106`** + schema/relations mirror (provider `bosta`, shipment columns, `shipment_carrier_events`) | — | SQL is idempotent (runs twice cleanly on a local DB); `0106` applied to **staging** only; CLAUDE.md "next number" bumped to `0107` |
| **BS-04** | **Move `applySellerShipmentStatus` to `packages/lib`** (re-export from the old path; behaviour unchanged) + let it accept `carrier: 'bosta'`; check `creditSellerOnDelivery` for carrier branching (**stop and ask** if money code must change) | — | Existing shipping tests are green; the dashboard rider flow works unchanged |
| **BS-05** | **Integration server code** `integrations/bosta.server.ts` (save/test/settings/record) + registry entry (`category: "shipping"`, `kind: "credentials"`) + `DETAIL_KEYS` | BS-01, BS-03 | An integration test (with `TEST_DATABASE_URL`) proves the encrypted round trip, that an empty key keeps the old one, and that store B can't read store A's key |
| **BS-06** | **Connect wizard UI** `/stores/[storeId]/apps/bosta` (4 steps, settings view, disconnect) + catalog card + "Shipping" category | BS-05 | Manual E2E on staging with a real Bosta key: verify, choose location, finish, reload shows settings; AR + EN, mobile width |
| **BS-07** | **Shipping page "Delivery partner" card** with the Manual (default) / On confirm choice | BS-06 | The card reflects connected/not and `own` vs `tallaby`; saving the choice updates `config.autoShip` with an explicit `storeId` |
| **BS-08** | **`shipOrderWithBosta`** (claim → create → record, idempotent) + manual **Ship with Bosta** on the order detail, with an address-preview sheet and district picker | BS-02, BS-04, BS-05 | A double click or a retry never creates two Bosta deliveries (unit test of the claim + `uniqueBusinessReference`); address errors land in `needs_attention` |
| **BS-09** | **Auto-ship on confirm** (dashboard confirm action, `after()`) + retry sweep in the cron | BS-08 | With `on_confirm`, confirming ships once; with `manual`, confirming never ships; unpaid orders never ship |
| **BS-10** | **Webhook route** (backend) + `applyBostaState` (event dedupe, re-fetch, transition walk, delivered via the existing path) | BS-04, BS-08 | Tests: a replayed webhook is a no-op; out-of-order states are ignored; a wrong token gets 401; delivered credits the wallet and fee exactly once |
| **BS-11** | **Fallback sync cron** `/api/cron/bosta-sync` + `vercel.json` entry | BS-10 | The cron updates a shipment whose webhook was dropped |
| **BS-12** | **Order UX**: list badge/filter, timeline, track link, AWB print (single + bulk ≤ 50), cancel (Full access, pre-pickup only), seller notifications | BS-10 | Manual E2E: create → print A6 label → cancel on staging |
| **BS-13** | **Docs + plan bookkeeping**: `docs/fulfillment.md` (Bosta = own delivery via carrier), `PLAN.md` §8.7/§9.2 row + §22 checklist + §23 log, `apps/shipping/README.md` note that per-store Bosta is separate from the admin adapter | all | Docs match the code |
| *Phase 2* | Pickup scheduling (`POST /pickups`) from the dashboard; marketplace orders for own-delivery sellers; customer-facing tracking on the storefront order page; Bosta pricing estimate in the zone editor | — | — |

---

## 6. Decisions (owner, 2026-10-26)

1. **When shipments are created:** the seller chooses in Shipping settings (and in the wizard) between **Manually** (the default for now) and **Automatically when the order is confirmed**. There is no ship-on-placed option.
2. **Key permission:** the wizard recommends **Read/Write**. **Full access** is optional and only unlocks "Cancel shipment" from Tallaby; with Read/Write the seller cancels in the Bosta dashboard.
3. **Orders in scope:** only orders from the seller's own store website. Marketplace orders are excluded.
4. **Bosta customer deposit:** always excluded (`escrowInfo.isExcluded: true`).
5. **Testing:** left to the implementer. Use a Bosta account the owner controls and cancel each test shipment right after creating it; ask Bosta engineering for a sandbox key if one is available.

## 7. Risks

- **No sandbox:** real test shipments may be billed or picked up. Mitigation: decision 5, plus cancelling tests right after creation.
- **Address quality:** free-text city with no district column. Mitigation: the §4.3 fallbacks, the seller-picked aliases, and later a place key on the address.
- **Undocumented webhook retries and no signature:** mitigated by the secret header, the re-fetch and the polling cron.
- **The Bosta API changes:** the client is isolated in one module; `pnpm bosta:geo` refreshes the geography.
- **Money path:** `delivered` reuses the existing primitive; any carrier branching in wallet code is a stop-and-ask (BS-04).

---

## 8. Progress log

- **2026-10-26: BS-01 done** (`0e77e4a2`). `packages/lib/src/shipping/bosta/`: `bosta.types.ts`, `bosta.client.server.ts` (pickup locations, create, get, search by reference, terminate, mass AWB; fixed host, 15 s timeout, key redacted from errors), `bosta-states.lib.ts` (state → status, shortest legal status path that never goes backwards), `bosta-errors.lib.ts`, `bosta-payload.lib.ts` (COD from integer piastres, 30 000 EGP cap, `uniqueBusinessReference = tallaby:<orderId>`, escrow excluded, product photos when the package may be opened). Phone normalisation reuses `normalizeEgyptianMobile`. Exports: `@workspace/lib/shipping/bosta` (pure) and `@workspace/lib/shipping/bosta/server`. 41 unit tests.
- **2026-10-26: BS-02 done.** `pnpm --filter @workspace/lib bosta:geo` (script in `packages/lib/scripts/`) writes `bosta-geo.data.ts` (28 Bosta cities, 3 580 districts, ~420 KB, server-only, exported as `@workspace/lib/shipping/bosta/geo`). `bosta-geo.lib.ts` resolves a place key or free-text address: zone match (then the district named in the address line), district match, and "split" districts such as Sidi Beshr Bahri/Qebli. **Where the code differs from the plan:**
  - Bosta files Giza's urban areas (Mohandessin, Agouza) and Obour under its "Cairo" city, and Esna under "Qena". Neighbouring Bosta cities are therefore searched after the governorate's own (`NEIGHBOUR_CODES`).
  - When nothing matches, we do **not** send `districtName` (Format 2) to Bosta. The seller picks the district instead (`district_needed`), which avoids a failed API call.
  - **Coverage of our 323 Egyptian areas:** 297 match (92%); 18 are outside Bosta's drop-off coverage; 8 need a manual pick: Hadayek El Kobba (EN only), King Mariout, Itay El Barud, Sers El Layan, Port Said City, Nasr El Nuba, El Zeiniya, Balat, Nuweiba.
- **2026-10-26: BS-03 written, not applied.** `packages/db/migrations/0106_bosta_shipping.sql` plus the `schema.ts` / `relations.ts` mirror. It also adds `shipments.create_attempts` (for the retry sweep) and the `seller_notifications` types `carrier_shipment_failed` / `carrier_needs_attention`, so BS-12 needs no second migration. It is additive and idempotent. **Waiting for the owner's go-ahead to apply it to staging.**
- **2026-10-26: BS-04 done.**
  - **No money change needed.** `resolveCollectionParty` (`packages/db/src/wallet/collection-party.ts`) doesn't branch on the carrier: a cash-on-delivery shipment with `seller_id` = the seller is seller-collected, so a delivered Bosta COD order posts only the fee, and a prepaid one still credits the sale.
  - The status model moved to `packages/lib/src/shipping/shipment-status.lib.ts` (`@workspace/lib/shipping/shipment-status`), and the Bosta state map now uses its graph instead of a copy.
  - `applySellerShipmentStatus` moved to `packages/lib/src/shipping/apply-seller-shipment.server.ts` (`@workspace/lib/shipping/seller-shipment`). The dashboard files re-export them, with labels and badges kept in the dashboard. Behaviour is unchanged: dashboard 225 tests and lib shipping 132 tests pass.
  - `pnpm lint` in apps/dashboard crashes inside ESLint (10.9.1 vs typescript-eslint 8: "Class extends value undefined"). This is an existing tooling issue that no dependency change here caused.
- **2026-10-26: `0106` applied on staging and production** (owner: "feel free to merge to stage and main as we don't have many sellers"). Both DBs had the exact `0056` provider check and `0098` notification check that `0106` recreates. Staging: applied in one transaction, then re-run (only "already exists" notices). Production: dry run in a rolled-back transaction, then applied at 2026-10-26T15:02:30Z. Verified on both: 8 new `shipments` columns, RLS on `shipment_carrier_events`, `bosta` in the provider check. The branch merges into `stage` and `main` as tasks land.
- **2026-10-26: BS-05 done.** `packages/lib/src/integrations/bosta.lib.ts` (pure: settings type, defaults, `readBostaSettings`, key and settings validation, tracking URL) and `bosta.server.ts`:
  - `saveBostaKey` checks the key with `GET /pickup-locations` **before** saving (outside the transaction, so a slow Bosta holds no lock). An empty key re-checks the saved one. It preselects Bosta's default pickup location (or the only one), and creates the webhook token once, keeping it when the key is replaced.
  - Also `saveBostaSettings` (partial; a new pickup location is checked against the account's list), `getBostaOverview`, `listStoreBostaPickupLocations`, `getStoreBostaAccount` (active store only), `getBostaAccountByIntegrationId` (for the webhook; works for a paused store too), `recordBostaResult` and `testStoreBosta`.
  - Registry: `bosta` with the new `shipping` category. Its public details are `keyHint`, `pickupLocationName` and `autoShip`.
  - **Where the code differs from the plan:** `canCancel` is the seller's own "my key has Full access" switch, because Bosta has no read-only call that tells a key's permission. A cancel with a Read/Write key gets Bosta's 403 and a hint.
  - Tests: `bosta.lib.test.ts` (9) and `bosta.integration.test.ts` (7, run with `TEST_DATABASE_URL` = staging, against a faked Bosta) cover the encrypted round trip, the key never stored in plain text, an empty key keeping the old one, the webhook token surviving a key change, store B unable to read, test, change or use store A's key, a revoked key recorded as an error with the key redacted, and disconnect. lib: 590 tests pass, typecheck clean.
- **2026-10-26: BS-06 done (UI; manual E2E with a real Bosta key still to do).**
  - Apps catalog: a new **Shipping** group with the Bosta card. The mark is a parcel on Bosta red, because Simple Icons has no Bosta logo. The card opens `/stores/[storeId]/apps/bosta` instead of a side sheet.
  - The page (`apps/bosta/`: `page.tsx`, `bosta.client.tsx`, `bosta-wizard.client.tsx`, `bosta-preferences.client.tsx`, `bosta.server.ts`) shows the 4-step wizard (account, create key, paste and verify, preferences) and then a done screen. Once connected it shows the settings view (status, key ••••hint, Test connection, Replace key, preferences, Disconnect). A saved key without a pickup location reopens the wizard.
  - Pickup locations load after the page renders, so a slow Bosta never blocks it. "Verify key" is limited to 5 a minute per store.
  - Strings: `storeApps.bosta.*`, `storeApps.providers.bosta`, `groups.shipping`, `kinds.carrier` and 6 `storeApps.errors` keys, in en and ar (MSA, like the rest of the dashboard).
  - **Where the code differs from the plan:**
    - Bosta's docs give no direct settings URL, so the guide links `https://bosta.co/dashboard` and spells out Settings › API Integration.
    - The "needs own delivery" state is dropped, because `parseStoreShipping` turns every method into `own` (every store delivers itself).
- **2026-10-26: BS-07 done.** `shipping/delivery-partner.client.tsx` sits on the Shipping page above the zones.
  - Not connected (or the wizard was left before a pickup location): "Ship your orders with Bosta" with **Connect Bosta** / **Finish Bosta setup**.
  - Connected: logo, status, pickup location, **Bosta settings**, and the Manually (default) / Automatically-on-confirm choice. It saves `config.autoShip` right away through `updateBostaSettings` with the page's explicit `storeId`, and rolls back on error.
  - **Where the code differs from the plan:** Disconnect lives only on the Bosta settings page, to keep one place for it.
  - Strings: `storeShipping.partner.*` (en, ar). Typecheck clean.
- **2026-10-26: BS-08 done.**
  - **`packages/lib/src/shipping/bosta-ship.server.ts`** (`@workspace/lib/shipping/bosta-ship`):
    - `shipOrderWithBosta(storeId, orderId, { trigger, sellerId?, overrides? })` loads the order **only when it was placed on that store and every line is the store owner's**.
    - Order: blocker check, claim, resolve address, build the payload, call Bosta, record the result.
    - **Claim:** an `INSERT … ON CONFLICT (order_id) DO UPDATE … WHERE external_id IS NULL AND status = 'pending' AND carrier IN ('seller','bosta') AND rider_id IS NULL AND not already 'creating'`. A claim older than 2 min counts as crashed.
    - **Success:** links `external_id`/`tracking_number`, inserts the first `shipment_carrier_events` row, then `applySellerShipmentStatus(pending → assigned)`, so items become `shipping_soon`.
    - **Failure:** sets `needs_attention` and `last_error = "<reason>: <Bosta message>"`, sends a `carrier_shipment_failed` seller notification, and leaves the order as it was.
    - **Duplicate reference:** looks the delivery up and links it.
    - **Key errors:** recorded on the integration.
    - `previewBostaShipment` returns the matched district (or the picker for the match's city or the candidate cities), the COD, items, size and the last error.
    - `listBostaRetryCandidates` is for the BS-09 sweep. It skips address and data errors, which need the seller.
  - **`bosta/bosta-ship.lib.ts`** (pure):
    - `bostaCollection`: settled orders send COD 0; `cash_on_delivery`/`cash` collect the full total; any other unpaid method gets `awaiting_payment`. A wallet part-payment always pairs with an online remainder, never cash.
    - `bostaShipBlocker`.
    - `bostaWebhookUrl`: `BOSTA_WEBHOOK_BASE_URL` or `BACKEND_API_URL` + `/api/webhooks/bosta/<integrationId>`, https only, so local dev sends none.
  - **Dashboard:**
    - Order flow: `carrierManaged` (the shipment has an `external_id`) means no manual moves. `updateSellerOrder` enforces the same.
    - Order rows carry `bostaConnected` and `bosta`, from `listSellerBostaStoreIds`.
    - `orders/bosta-ship.server.ts` holds the preview and ship actions, each taking the order's `storeId` and checked with `requireStore`.
    - `orders/bosta-ship.client.tsx`: the **Ship with Bosta** button opens a dialog with receiver, address, matched area (or a searchable district picker), COD, items, size and pickup location, plus a Bosta card (state, tracking number with copy, Track on Bosta, the attention reason).
    - Notifications: `carrier_shipment_failed` / `carrier_needs_attention` added to the seller types, linking to the order.
    - Strings: `orders.bosta.*` (every error reason and Bosta state) and `orders.notes.carrierManaged`, in en and ar.
  - **Where the code differs from the plan:** the seller's district pick is per order and not yet saved as a store alias (phase 2).
  - **Tests:** `bosta-ship.lib.test.ts` (7) and `bosta-ship.integration.test.ts` (6, staging + fake Bosta). They cover one delivery per order, a double click while in flight making a single request, COD 0 for prepaid orders, unpaid online orders waiting, an unmatched address giving needs_attention plus a notification and then shipping after a district pick, a lost response re-linked, and other seller / other store / marketplace orders refused. Dashboard 227 tests, flow tests for `carrierManaged`. Typecheck clean.
- **2026-10-26: BS-09 done.**
  - `updateSellerOrder` "confirm": after the confirm commits, `after(() => autoShipOrderWithBosta(storeId, orderId, sellerId))`. It ships only when the store's Bosta `autoShip` is `on_confirm`; unpaid online orders are refused before any claim, and it never throws.
  - The orders client shows "Sending order #N to Bosta…" and refreshes after 4 s (rows carry `bostaAutoShip`). The Bosta card refreshes every 3 s while a create is in flight.
  - `runBostaRetrySweep` (called by the BS-11 cron) retries claims with no delivery that are older than 10 min, up to 3 attempts. It skips address and data errors.
  - **Where the code differs from the plan:** prepaid orders skip the seller's confirm (they arrive at "to ship"), so `on_confirm` never fires for them. They keep the **Ship with Bosta** button. Auto-shipping on payment would need a hook in the payment webhooks, which is left for phase 2.
  - Tests: 2 more integration tests (auto-ship only when `on_confirm`, never for unpaid or another seller; the sweep re-ships a Bosta 500 failure but not an address error), 8/8 on staging. Typecheck clean.
- **2026-10-26: BS-10 done.**
  - **`packages/lib/src/shipping/bosta-sync.server.ts`** (`@workspace/lib/shipping/bosta-sync`):
    - `applyBostaState` inserts the event once per (shipment, state, time); a replay with the same code changes nothing.
    - It maps the code with `bostaStateEffect` and updates `external_state_code`, `needs_attention` and `last_error`, sending a `carrier_needs_attention` notification for exceptions, investigations and holds.
    - It walks `bostaStatusPath` one legal step at a time through `applySellerShipmentStatus` (guarded by `expectedFromStatus`), so it never moves backwards and `delivered` runs the existing wallet, fee, affiliate and email path.
    - **Cancelled or terminated (49/48) before pickup** clears the Bosta link and returns the shipment to `pending`, with `last_error = bosta_cancelled`. The order stays confirmed, and the seller can ship again or deliver it.
  - `handleBostaWebhook(integrationId, authorization, body)`:
    - Checks the per-store token with `timingSafeEqual`; a bad token or unknown integration gets 401.
    - Finds the shipment by (carrier, `external_id`, `store_integration_id`).
    - **Re-reads the state from Bosta with the store's key.** The payload's state is never trusted.
    - Every other outcome answers 200.
  - `syncBostaShipments` is for BS-11.
  - **Backend:** `apps/backend/src/routes/bosta.ts`, mounted at `/api/webhooks/bosta/:integrationId`, which is already public through the `/api/webhooks/` prefix. Errors are logged by name only, never the body. **The backend needs `INTEGRATIONS_ENCRYPTION_KEY`** (the same value as the dashboard) to decrypt the webhook token.
  - Dashboard strings: `bosta_cancelled`, `exception`, `attention`.
  - Tests: `bosta-sync.integration.test.ts` (7, staging + fake Bosta):
    - A wrong token or unknown integration gets 401.
    - The payload says delivered but Bosta says 41, so the shipment goes to out_for_delivery.
    - A replayed event adds no row.
    - An out-of-order state is ignored.
    - Delivered walks assigned → out_for_delivery → delivered and posts **no sale and at most one fee row**, and replays post nothing.
    - An exception sets needs_attention and sends a notification.
    - A Bosta cancel before pickup gives the order back, and it can ship again.
    - The sync catches a dropped webhook.
  - An earlier run left rows on staging, because the ledger is append-only. They were deleted (only the test seller tag `daaf8720` and its buyer), and the teardown now deletes the sellers before the orders.
