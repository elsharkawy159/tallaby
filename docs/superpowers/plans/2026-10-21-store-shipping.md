# Store Shipping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store-website checkout charges the seller's own shipping zones (places at country/region/city level, searchable, Egypt first), the seller page is redesigned with templates, and the shipping the customer paid is credited to the seller.

**Architecture:** A pure place dataset + search in `@workspace/lib/places`; zones store place keys; one pure quote (`resolveStorefrontShipping`) is used by the checkout display, coupon recomputation and `placeOrderFromCart`; orders carry a `metadata.storeShipping` snapshot that `creditSellerOnDelivery` reads to add billed shipping to the seller's existing `sale` entry.

**Tech Stack:** TypeScript, Next.js 16.3.3 (read `node_modules/next/dist/docs/` before Next code), Drizzle + Postgres (Supabase), zod, vitest, next-intl, shadcn (`@workspace/ui`).

**Spec:** `docs/superpowers/specs/2026-10-21-store-shipping-design.md` (read it first; this plan argues from it).

## Global Constraints

- Project rules in `CLAUDE.md` apply (tenant isolation rule 5, migrations rule 6, money rule 7, caching rule 8, i18n rule 13, file split rule 14, verification rule 15, never touch others' uncommitted work rule 16).
- Money: compute in integer piastres; store in existing `numeric(10,2)` columns.
- Ledger: no new entry type, enum value or reference type. Shipping joins the existing `sale` entry under claim `order:<orderId>`.
- Every new string in both `ar.json` and `en.json` of the app that shows it. Arabic is default; brand طلبي.
- Egypt first: in search ranking, browse lists, defaults.
- Marketplace (`orderSource !== 'storefront'`) pricing, COD 90 EGP cap and coupons are unchanged.
- Store with no zones: shipping exactly as today.
- Default `otherPlaces = 'tallaby_rates'` (also for stored settings that lack the key).
- No caching of shipping quotes or zones on the customer side.
- Migration number `0093`; do not run `drizzle-kit generate`. Staging first; production only with owner approval.
- Verification per task: `pnpm --filter @workspace/lib test`, plus `pnpm lint` / `pnpm typecheck` for touched packages/apps. DB integration tests need `TEST_DATABASE_URL` (staging, `packages/db/.env`).

## Review Focus

1. **Arabic and geocoder spellings** ("القاهره", "Cairo Governorate", "Al Qalyubiya", "6 أكتوبر", "6th of October City") must resolve to the same place as the canonical names. Pinned in Task 1 (`searchPlaces`/`resolveAddressPlace` tests).
2. **A seller whose zones cover only part of Egypt, with `otherPlaces` missing from stored settings** must keep checking out at Tallaby's rates. Pinned in Task 2 (`parseStoreShipping` default) and Task 4 (place-order integration).
3. **Shown price = charged price** when a coupon or the seller free-delivery flag is involved on a zone-priced order. Pinned in Task 4 (`resolveStorefrontShipping` tests used by both paths, plus the integration test comparing `recalculateCheckoutSummary`-equivalent quote with the order).
4. **Replayed delivery** (status set to delivered twice, or from two apps) must credit shipping once. Pinned in Task 5.
5. **Zone sheet at 360px width and RTL**: no input overflow, chips wrap. Pinned in Task 6 as a manual check logged in `PLAN.md` §23.

---

### Task 1: Place dataset, search and address resolution

**Files:**
- Create: `packages/lib/src/places/places.types.ts`, `packages/lib/src/places/data/countries.ts`, `packages/lib/src/places/data/egypt.ts`, `packages/lib/src/places/data/arab-world.ts`, `packages/lib/src/places/places.lib.ts`, `packages/lib/src/places/index.ts`
- Modify: `packages/lib/package.json` (add export `"./places": { "types": "./src/places/index.ts", "default": "./src/places/index.ts" }`)
- Test: `packages/lib/src/places/places.lib.test.ts`

**Interfaces:**
- Produces:
  - `type PlaceLevel = 'country' | 'region' | 'city'`
  - `type Place = { key: string; level: PlaceLevel; nameAr: string; nameEn: string; aliases?: string[] }`
  - Keys: country = ISO alpha-2 (`EG`, `SA`); region = `<CC>/<REGION>`; city/area = `<CC>/<REGION>/<slug>`. **Egypt region codes are exactly the keys of `CAIRO_ORIGIN_RATES`** (`EG/CAIRO`, `EG/KAFR EL SHEIKH`, …). City slugs are lowercase kebab-case ASCII.
  - `getPlace(key: string): Place | undefined`
  - `placeChain(key: string): string[]` — self then ancestors: `placeChain('EG/CAIRO/nasr-city')` → `['EG/CAIRO/nasr-city','EG/CAIRO','EG']`
  - `childrenOf(key: string): Place[]` (sorted by name in Arabic order for `EG`, as listed otherwise)
  - `placeLabel(key: string, locale: string): string` — city: `"<city> · <region>"`; non-Egypt region: `"<region> · <country>"`; Egypt region and countries: the name alone. Arabic names when `locale` starts with `ar`.
  - `normalizePlaceText(s: string): string` — lowercase, trim, strip tashkeel and tatweel, أ/إ/آ→ا, ة→ه, ى→ي, hyphens/underscores/dots → space, collapse spaces; strip leading "al "/"el " and "ال" only for matching (keep both variants indexed).
  - `searchPlaces(query: string, opts?: { limit?: number; within?: string; levels?: PlaceLevel[] }): Place[]` — default limit 20; `within` restricts to descendants of that key.
  - `resolveAddressPlace(addr: { country?: string | null; state?: string | null; city?: string | null; addressLine1?: string | null }): string | null`
  - `EGYPT = 'EG'`

- [ ] **Step 1: Write the failing tests** (`places.lib.test.ts`)

```ts
it("every Egypt governorate rate key is a region place", () => {
  for (const g of Object.keys(CAIRO_ORIGIN_RATES)) expect(getPlace(`EG/${g}`)?.level).toBe("region");
});
it("keys are unique and every parent exists", () => { /* iterate all places: placeChain(k).slice(1).every(getPlace) */ });
it("has Arabic and English names everywhere", () => { /* nameAr && nameEn non-empty */ });
it("covers the countries and depth the spec names", () => {
  expect(getPlace("SA/RIYADH")).toBeDefined(); // or the region code chosen; assert childrenOf("SA").length === 13
  expect(childrenOf("EG").length).toBe(27);
  expect(childrenOf("EG/CAIRO").length).toBeGreaterThanOrEqual(25);
  expect(childrenOf("EG/GIZA").length).toBeGreaterThanOrEqual(12);
  expect(childrenOf("EG/ALEXANDRIA").length).toBeGreaterThanOrEqual(12);
  for (const cc of ["AE","KW","QA","BH","OM","JO","IQ","LB","PS","SY","YE","LY","SD","TN","DZ","MA"]) expect(childrenOf(cc).length).toBeGreaterThan(0);
  expect(allCountries().length).toBeGreaterThanOrEqual(240); // export allCountries(): Place[] from places.lib.ts
});
it("search ranks Egypt first", () => {
  expect(searchPlaces("nas")[0]!.key.startsWith("EG")).toBe(true);
  expect(searchPlaces("مدينة نصر")[0]!.key).toBe("EG/CAIRO/nasr-city");
  expect(searchPlaces("القاهره")[0]!.key).toBe("EG/CAIRO");
});
it("search finds countries in both languages", () => {
  expect(searchPlaces("saudi")[0]!.key).toBe("SA");
  expect(searchPlaces("السعودية")[0]!.key).toBe("SA");
});
it("within restricts to descendants", () => {
  expect(searchPlaces("a", { within: "EG/GIZA" }).every((p) => p.key.startsWith("EG/GIZA/"))).toBe(true);
});
it("resolves geocoder and typed spellings", () => {
  expect(resolveAddressPlace({ state: "Cairo Governorate", city: "Nasr City" })).toBe("EG/CAIRO/nasr-city");
  expect(resolveAddressPlace({ state: "Al Qalyubiya", city: "" })).toBe("EG/QALIUBIA");
  expect(resolveAddressPlace({ state: "الجيزة", city: "6 أكتوبر" })).toBe("EG/GIZA/6th-of-october");
  expect(resolveAddressPlace({ state: "القاهرة", city: "x", addressLine1: "شارع عباس العقاد, مدينة نصر" })).toBe("EG/CAIRO/nasr-city");
  expect(resolveAddressPlace({ country: "", state: "", city: "" })).toBe("EG");
  expect(resolveAddressPlace({ country: "Saudi Arabia", state: "Riyadh", city: "Riyadh" })?.startsWith("SA")).toBe(true);
  expect(resolveAddressPlace({ country: "Egypt", state: "Nowhere", city: "" })).toBe("EG");
});
it("placeLabel shows the parent", () => {
  expect(placeLabel("EG/CAIRO/nasr-city", "en")).toBe("Nasr City · Cairo");
  expect(placeLabel("EG/CAIRO", "ar")).toBe("القاهرة");
});
```

- [ ] **Step 2: Run** `pnpm --filter @workspace/lib exec vitest run src/places` — expect FAIL (module missing).
- [ ] **Step 3: Write the data files.** `countries.ts`: every ISO 3166-1 country, `nameAr`/`nameEn`, Egypt first in the array. `egypt.ts`: 27 governorates (reuse the Arabic/English names and the aliases already in `packages/lib/src/shipping/governorate.lib.ts`; import nothing from shipping except `CAIRO_ORIGIN_RATES` keys for the test), every governorate's cities/markaz towns, plus main areas of Cairo (≥25, e.g. Nasr City, Heliopolis, New Cairo, Maadi, Zamalek, Downtown, Shubra, Ain Shams, Mokattam, Helwan, El Marg, El Salam, Madinaty, El Shorouk, Badr, El Rehab, Obour…), Giza (≥12: Dokki, Mohandessin, Haram, Faisal, 6th of October, Sheikh Zayed, Imbaba, Agouza, Hadayek El Ahram, Badrashin, Hawamdia, Atfih…), Alexandria (≥12). Fold in the area aliases from `apps/admin/app/(dashboard)/external-orders/_components/customer-paste.lib.ts` (`AREA_GOVERNORATE`). Each city gets common alternate spellings as `aliases` ("6 أكتوبر", "6th of October City", "October"). `arab-world.ts`: regions + main cities for SA (13 regions), AE, KW, QA, BH, OM, JO, IQ, LB, PS, SY, YE, LY, SD, TN, DZ, MA.
- [ ] **Step 4: Implement `places.lib.ts`.** Build a `Map<key, Place>` and a search index once at module load (each place's normalised nameAr, nameEn, aliases). Ranking score: exact (3) > prefix (2) > contains (1); ties by Egypt-first, then level (country > region > city), then name length. `resolveAddressPlace`: country text → country by search (`levels: ['country']`) or ISO code, default `EG`; region → for EG use `normalizeGovernorate` from `../shipping/governorate.lib` then `EG/<key>`, else best region match within the country; city → exact/alias match of `city` within the region, then of each comma-separated part of `addressLine1`; if no region, try a city match within the country and take its region. Returns the most specific key found.
- [ ] **Step 5: Run** the tests — expect PASS. Run `pnpm --filter @workspace/lib typecheck`.
- [ ] **Step 6: Commit** `feat(places): place dataset, search and address resolution`

---

### Task 2: Zone model on places, settings, templates, the quote

**Files:**
- Modify: `packages/lib/src/shipping/store-zones.ts`
- Create: `packages/lib/src/shipping/store-quote.ts`
- Modify: `packages/lib/package.json` (export `"./shipping/store-quote"`)
- Test: `packages/lib/src/shipping/store-zones.test.ts` (rewrite for places), `packages/lib/src/shipping/store-quote.test.ts`

**Interfaces:**
- Consumes: Task 1 `getPlace`, `placeChain`, `resolveAddressPlace`, `EGYPT`.
- Produces (store-zones.ts):
  - `zoneInputSchema` fields: `nameAr`, `nameEn?`, `places: string[]` (1..200, unique, each `getPlace(k)` defined), `price` (money ≤ 10_000), `freeOver` (money ≤ 1_000_000, nullable), `deliveryDaysMin/Max` (int 0..60, max ≥ min), `codEnabled`, `enabled`. `.strict()`. No `governorates`, no `perKgSurcharge`.
  - `storeShippingSettingsSchema` adds `otherPlaces: z.enum(['tallaby_rates','refuse'])`. `parseStoreShipping(raw)` fills `otherPlaces: 'tallaby_rates'` when missing (parse with the key optional, then default). `defaultStoreShipping()` → `{ method: 'own', handlingDays: 1, freeShippingOver: null, otherPlaces: 'tallaby_rates' }`.
  - `type ZoneForQuote = { id: string; nameAr: string; nameEn: string | null; places: string[]; price: number; freeOver: number | null; deliveryDaysMin: number; deliveryDaysMax: number; codEnabled: boolean; enabled: boolean }`
  - `findZoneOverlap(zones: Pick<ZoneForQuote,'id'|'places'|'enabled'>[]): { place: string; zoneIds: [string, string] } | null` — same exact key in two enabled zones.
  - `findZoneForPlace<Z extends Pick<ZoneForQuote,'places'|'enabled'>>(zones: Z[], place: string | null): { zone: Z; matched: string } | null` — walk `placeChain(place)` most specific first.
  - `uncoveredGovernorates(zones): string[]` — Egypt governorate keys (as today, `CAIRO`…) where no enabled zone has `EG` or `EG/<g>`.
  - `quoteZone(zone: Pick<ZoneForQuote,'price'|'freeOver'>, subtotal: number): { amountPiastres: number; free: boolean }`
  - `defaultZoneGroups(): { price: number; places: string[] }[]` (no per-kg; places `EG/<g>`). Remove `DEFAULT_PER_KG_SURCHARGE`.
  - `SHIPPING_TEMPLATES = ['tallaby_rates', 'egypt_flat', 'cairo_giza'] as const`; `type ShippingTemplate`.
  - `templateZones(template: ShippingTemplate, opts: { price?: number }): { price: number; places: string[] }[]` — `tallaby_rates` = `defaultZoneGroups()`; `egypt_flat` = `[{ price: opts.price, places: ['EG'] }]` (throws/returns [] without a valid price); `cairo_giza` = `[{ price: defaultRateForGovernorate('CAIRO'), places: ['EG/CAIRO','EG/GIZA'] }]`.
- Produces (store-quote.ts):
  - `type ShippingAddress = { country?: string | null; state?: string | null; city?: string | null; addressLine1?: string | null }`
  - ```ts
    type StorefrontShipping =
      | { kind: 'zone'; shippingCost: number; free: boolean; zoneId: string; zoneName: { ar: string; en: string | null }; place: string; daysMin: number; daysMax: number; codEnabled: boolean }
      | { kind: 'tallaby_rates'; shippingCost: number; place: string | null }
      | { kind: 'not_covered'; place: string | null }
      | { kind: 'outside_egypt'; place: string };
    ```
  - `resolveStorefrontShipping(input: { settings: StoreShippingSettings; zones: ZoneForQuote[]; address: ShippingAddress; items: ShippingCartItem[]; subtotal: number; tallabyRate: (state: string | null) => number }): StorefrontShipping` — `shippingCost` in EGP (piastres / 100). Order of checks: resolve place; country ≠ `EG` → `outside_egypt`; no enabled zones → `tallaby_rates`; zone match → `zone` (cost from `quoteZone`; daysMin/Max = `settings.handlingDays` + zone days); else `otherPlaces === 'refuse'` → `not_covered`, else `tallaby_rates`. `tallabyRate` is injected so the function stays pure (callers pass a wrapper over `calculateLocationShippingCost`).
  - `zoneSellerFreeDeliveryDiscount(result: StorefrontShipping, items): number` — for `kind: 'zone'`, `result.shippingCost` when `cartFullyCoveredBySellerFreeDelivery(items)` (from `./shipping.lib`), else 0; for other kinds 0 (callers keep the existing seller discount path for `tallaby_rates`).

- [ ] **Step 1: Write failing tests.** In `store-zones.test.ts`: schema accepts `places: ['EG/CAIRO','EG/GIZA/dokki']`, rejects unknown key, empty list, duplicates, `perKgSurcharge` key (strict); overlap only on identical keys (`EG/CAIRO` and `EG/CAIRO/nasr-city` in two zones is allowed); `findZoneForPlace` picks `EG/CAIRO/nasr-city` zone over `EG/CAIRO` zone over `EG` zone, skips disabled; `parseStoreShipping({ method:'own', handlingDays:2, freeShippingOver:null })` → `otherPlaces: 'tallaby_rates'`; `templateZones('tallaby_rates', {})` covers all 27 governorates once; `templateZones('egypt_flat', { price: 60 })` → `[{ price: 60, places: ['EG'] }]`; `quoteZone({ price: 55, freeOver: 1000 }, 1000)` → `{ amountPiastres: 0, free: true }`, at 999.99 → `5500`. In `store-quote.test.ts`: the five outcomes (outside Egypt for a Riyadh address; no zones → tallaby_rates using the injected rate; zone match with days = handling + zone; uncovered + refuse → not_covered; uncovered + default → tallaby_rates); seller free-delivery discount equals cost for a fully flagged cart.
- [ ] **Step 2: Run** `pnpm --filter @workspace/lib exec vitest run src/shipping` — expect FAIL.
- [ ] **Step 3: Implement** the changes above. Update the file header comment (zones are now used at checkout).
- [ ] **Step 4: Run** tests — PASS. `pnpm --filter @workspace/lib typecheck` will fail in `stores/server.ts` and the dashboard; that is fixed in Tasks 3 and 6 — note it, don't patch around it here.
- [ ] **Step 5: Commit** `feat(shipping): zones on places, other-places setting, templates, storefront quote`

---

### Task 3: Migration 0093, schema, store server functions

**Files:**
- Create: `packages/db/migrations/0093_store_shipping_places.sql`
- Modify: `packages/db/src/drizzle/schema.ts` (`storeShippingZones`: add `places: text().array().default([]).notNull()`, `governorates` default `'{}'`, checks per migration)
- Modify: `packages/lib/src/stores/server.ts` (shipping section, lines ~604–870)
- Test: `packages/lib/src/stores/shipping.integration.test.ts`

**Interfaces:**
- Consumes: Task 2 schemas and helpers.
- Produces:
  - `StoreShippingZone` = `ZoneForQuote` (re-export the type; `places` replaces `governorates`; no `perKgSurcharge`).
  - `getStoreShipping(sellerId, storeId, q?)` unchanged signature, settings include `otherPlaces`.
  - `getStorefrontShippingContext(storeId: string, q?: Queryable): Promise<{ settings: StoreShippingSettings; zones: StoreShippingZone[] } | null>` — customer-side loader by store id only (enabled zones, sort order); callers pass a server-trusted store id.
  - `saveStoreShippingZone`, `deleteStoreShippingZone`, `updateStoreShippingSettings` — same signatures; writes `places` (and `governorates: []`), overlap via the new `findZoneOverlap`.
  - `applyStoreShippingTemplate(sellerId, actorId, storeId, input: unknown, q?): Promise<StoreResult<StoreShippingZone[], StoreShippingError | 'zones_exist'>>` with input schema `{ template: ShippingTemplate; names: { nameAr; nameEn? }[]; price?: number; replace: boolean }` (`names.length` must equal `templateZones(...).length`). With `replace` it deletes the store's zones first, in the same transaction. Audit action `template_applied` with the template id. Replaces `seedDefaultStoreShippingZones` (remove it).

- [ ] **Step 1: Write the migration** (idempotent): add `places` column; backfill `UPDATE store_shipping_zones SET places = ARRAY(SELECT 'EG/' || g FROM unnest(governorates) g) WHERE places = '{}'`; `ALTER COLUMN governorates SET DEFAULT '{}'`; drop constraint `store_shipping_zones_governorates_check` if exists; add `store_shipping_zones_places_check CHECK (cardinality(places) > 0)` guarded by a `DO $$ … IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = …)` block. Leave `per_kg_surcharge` alone.
- [ ] **Step 2: Apply to staging** with psql using the URL in `packages/db/.env` (run the file twice to prove idempotence). Expected: second run makes no changes, no errors.
- [ ] **Step 3: Update the integration tests** to the new shape: zones with `places`; overlap refused only for identical keys; a nested zone (`EG/CAIRO/nasr-city` inside `EG/CAIRO`) is accepted; settings round-trip `otherPlaces: 'refuse'`; `applyStoreShippingTemplate` with `replace: false` on a store with zones → `zones_exist`, with `replace: true` → exactly the template zones; `getStorefrontShippingContext` returns only enabled zones of that store and `null` for an unknown id; store B's seller cannot write store A's zones (`not_found`). Run with `TEST_DATABASE_URL` — expect FAIL.
- [ ] **Step 4: Implement** schema.ts and server.ts changes.
- [ ] **Step 5: Run** `pnpm --filter @workspace/lib exec vitest run src/stores/shipping.integration.test.ts` (with `TEST_DATABASE_URL`) and `pnpm --filter @workspace/db typecheck` — PASS.
- [ ] **Step 6: Commit** `feat(shipping): 0093 zone places + template apply + checkout loader`

---

### Task 4: Store-website checkout uses the quote

**Files:**
- Modify: `packages/lib/src/orders/place-order.ts` (shipping step ~249–330, COD check ~553–568, insert metadata ~620–660)
- Modify: `apps/ecommerce/lib/shipping.ts` (new `getStorefrontShippingQuote`)
- Modify: `apps/ecommerce/actions/checkout.ts` (`getDestinationState` → full address; `recalculateCheckoutSummary`, `getCheckoutData`)
- Modify: `apps/ecommerce/actions/coupons.ts` (`resolveDestinationState` → full address; both shipping recomputations ~239 and ~413)
- Modify: `apps/ecommerce/lib/coupon-utils.ts` (`CheckoutSummary.storeShipping`)
- Modify: `apps/ecommerce/app/[locale]/(shop)/cart/checkout/_components/checkout.data.tsx` (COD gate, refusal message, ETA line) and `order-summary` shipping row if it needs the ETA
- Modify: `apps/ecommerce/messages/{ar,en}.json`
- Test: `packages/lib/src/orders/place-order-storefront-shipping.integration.test.ts` (new)

**Interfaces:**
- Consumes: Task 2 `resolveStorefrontShipping`, `zoneSellerFreeDeliveryDiscount`; Task 3 `getStorefrontShippingContext`.
- Produces:
  - `CheckoutSummary.storeShipping?: { kind: 'zone' | 'tallaby_rates' | 'not_covered' | 'outside_egypt'; daysMin?: number; daysMax?: number; codEnabled?: boolean } | null` (null on the marketplace).
  - `getStorefrontShippingQuote(storeId: string, address: ShippingAddress | null, items: OrderShippingCartItem[]): Promise<StorefrontShipping | null>` in `apps/ecommerce/lib/shipping.ts` — null when `address` is null; `tallabyRate` wraps `calculateOrderShippingCost`.
  - Order metadata `storeShipping = { method: 'own'; pricedBy: 'zone' | 'tallaby_rates'; zoneId?: string; zoneName?: { ar: string; en: string | null }; place: string | null; billedPiastres: number }` on every storefront order when `settings.method === 'own'`.
  - New `placeOrderFromCart` errors: `'storeShippingNotCovered'`, `'storeShippingOutsideEgypt'`, `'storeShippingNoCod'` (message keys the ecommerce order action maps to strings).

- [ ] **Step 1: Write the failing integration test** (`describe.skipIf(!TEST_DATABASE_URL)`, reuse `createIsolationWorld` from `packages/lib/src/stores/isolation.fixtures.ts` and the order fixtures used by `place-order-fee.integration.test.ts`). Cases: (a) storefront cart, zone `EG/CAIRO` 55 EGP, address state "القاهرة" → `orders.shippingCost = '55.00'`, metadata `storeShipping.pricedBy = 'zone'`, `billedPiastres = 5500`; (b) subtotal ≥ zone `freeOver` → shippingCost `'0.00'`, `billedPiastres = 0`; (c) address in Aswan, no zone, `otherPlaces` missing → Tallaby rate (equal to `calculateLocationShippingCost` for the same items), `pricedBy = 'tallaby_rates'`; (d) same with `otherPlaces: 'refuse'` → `{ success: false, error: 'storeShippingNotCovered' }`, no order row; (e) country "Saudi Arabia" → `storeShippingOutsideEgypt`; (f) zone `codEnabled: false` + COD → `storeShippingNoCod`; (g) zone price 120 + COD on a zone with COD on → accepted (90 EGP cap not applied); (h) the same cart as a marketplace order (`orderSource: 'website'`) → unchanged Tallaby rate and no `storeShipping` metadata; (i) store with no zones → Tallaby rate, `pricedBy = 'tallaby_rates'`. Run — FAIL.
- [ ] **Step 2: Implement in `placeOrderFromCart`.** Widen the `shippingAddress` type to the row fields used (`state, city, country, addressLine1`). When `orderSource === 'storefront' && cart.storeId && pricingOverrides?.shippingCost == null && !isDigitalOnlyCart`: load `getStorefrontShippingContext(cart.storeId)`, call `resolveStorefrontShipping`; refusals return the errors above before any write; `kind: 'zone'` sets `calculatedShippingCost` and replaces `sellerFreeDeliveryDiscount` with `zoneSellerFreeDeliveryDiscount`. COD: on `kind: 'zone'`, skip `isCodEligibleForShipping` and refuse when `!codEnabled`. Merge `storeShipping` into `insertMetadata` (keep `walletPaidAmount`/`paymentMix` when present); `billedPiastres = Math.round(billedShipping * 100)`.
- [ ] **Step 3: Run** the integration test — PASS. Run the existing `place-order-fee.integration.test.ts` — still PASS.
- [ ] **Step 4: Wire the display.** `checkout.ts` and `coupons.ts` load the full address (`state, city, country, addressLine1`) and, when `getCartScope()` is non-null, call `getStorefrontShippingQuote(scope.storeId, …)`: `zone`/`tallaby_rates` give `shippingCost` (and the zone seller-free-delivery discount), refusals give `shippingCost: null` and `summary.storeShipping.kind`. Marketplace path untouched. `checkout.data.tsx`: when `storeShipping.kind` is `not_covered`/`outside_egypt`, show the message and disable Place order; when `zone`, COD availability = `codEnabled` (and the store `codMaxOrder`) instead of the 90 EGP check, and show "Arrives in {min}–{max} days". Map the three new order errors in `apps/ecommerce/actions/order.ts`.
- [ ] **Step 5: Strings** (ecommerce `ar.json`/`en.json`, in the checkout namespace): `notDeliveredHere` "We don't deliver to this address yet." / "لا نوصّل إلى هذا العنوان حاليًا."; `egyptOnly` "We deliver inside Egypt only for now." / "نوصّل داخل مصر فقط حاليًا."; `zoneNoCod` "Cash on delivery isn't available for this address." / "الدفع عند الاستلام غير متاح لهذا العنوان."; `arrivesIn` "Arrives in {min}–{max} days" / "يصل خلال {min}–{max} أيام".
- [ ] **Step 6: Run** `pnpm --filter ecommerce typecheck`, `pnpm --filter ecommerce lint`, `pnpm --filter @workspace/lib test` — PASS.
- [ ] **Step 7: Commit** `feat(checkout): store websites charge the seller's shipping zones`

---

### Task 5: Credit billed shipping to the seller on delivery

**Files:**
- Modify: `packages/db/src/wallet/credit-seller-on-delivery.ts`
- Test: `packages/db/src/wallet/credit-seller-shipping.integration.test.ts` (new; reuse the setup in `packages/db/src/wallet/store-wallet.integration.test.ts`)

**Interfaces:**
- Consumes: order `metadata.storeShipping.billedPiastres` from Task 4.
- Produces: the `sale` entry amount = Σ line totals + `billedPiastres` when all hold: `metadata.storeShipping.method === 'own'`, `billedPiastres > 0`, `store?.sellerId === sellerId`, party `tallaby`. Entry metadata `{ collectedBy, shippingPiastres }`.

- [ ] **Step 1: Write failing tests.** (a) storefront order, online/Tallaby-collected, `billedPiastres = 5500`, goods 300 → one `sale` of `355.00` with `metadata.shippingPiastres = 5500` and the fee entry unchanged; (b) call `creditSellerOnDelivery` twice → still one `sale` and one `fee`; (c) COD delivered by the seller's own rider shipment → no `sale`, only `fee`; (d) `billedPiastres = 0` → `sale` = goods only; (e) marketplace order without the snapshot → `sale` = goods only (unchanged); (f) wallet balance equals ledger sum after each case. Run with `TEST_DATABASE_URL` — FAIL.
- [ ] **Step 2: Implement** — read the snapshot defensively (object, numeric, integer ≥ 0; anything else → 0). Update the function's doc comment.
- [ ] **Step 3: Run** the new test and the existing wallet integration tests in `packages/db` — PASS (note in the log any failures that pre-date this work, per `PLAN.md` §23).
- [ ] **Step 4: Commit** `feat(wallet): credit store-website shipping to the seller on delivery`

---

### Task 6: Seller shipping page redesign

**Files:**
- Modify: `apps/dashboard/app/(main)/stores/[storeId]/shipping/page.tsx`, `shipping.server.ts`, `shipping.dto.ts`, `shipping.client.tsx` (page shell, zones list, settings card)
- Create: `apps/dashboard/app/(main)/stores/[storeId]/shipping/zone-sheet.client.tsx`, `place-picker.client.tsx`, `templates.client.tsx`, `check-price.client.tsx`
- Modify: `apps/dashboard/messages/{ar,en}.json` (`storeShipping` namespace)

**Interfaces:**
- Consumes: Task 1 (`searchPlaces`, `placeLabel`, `childrenOf`, `getPlace` via `await import('@workspace/lib/places')` in client components), Task 2 (`zoneInputSchema`, `templateZones`, `findZoneForPlace`, `quoteZone`, `uncoveredGovernorates`), Task 3 server functions.
- Produces:
  - Server actions: `saveShippingSettings(storeId, input)`, `saveShippingZone(storeId, zoneId | null, input)`, `deleteShippingZone(storeId, zoneId)`, `applyShippingTemplate(storeId, input: { template; names; price?; replace })` — all via the existing `run()` wrapper (requireStore forWrite, rate limiter, error map + `zonesExist`).
  - `ZoneFormValues` = `{ nameAr; nameEn; places: string[]; price; freeOver; deliveryDaysMin; deliveryDaysMax; codEnabled; enabled }`; `toZoneInput` updated.
  - `<PlacePicker value: string[]; onChange(keys: string[]); takenBy: Map<string, string> (place → other zone name) />` — one search input (debounced ~150ms), results grouped "Egypt" / "Other countries", each row `placeLabel` + level word; selected chips with remove; a "Browse Egypt's governorates" toggle listing `childrenOf('EG')` as checkable rows.

- [ ] **Step 1: Write the UI** following the approved mockup (`.superpowers/brainstorm/5565-1792601638/content/shipping-page.html`) and spec §6.6. Page order: notice ("Customers on your website pay these prices"), templates (empty state; otherwise a "Templates" button opening a sheet; replacing asks to confirm with an AlertDialog), zones list (chips with `placeLabel`, price, free-over, days, COD badge, "overrides {zone}" when one of its places has an ancestor in another enabled zone; "Not covered" line from `uncoveredGovernorates` saying "These use Tallaby's rates" or "You don't deliver here" by `otherPlaces`), Check a price (PlacePicker in single-select mode + order total → `findZoneForPlace` + `quoteZone`, or the fallback text), settings card (Other places: two `ChoiceCard`s from `@workspace/ui/components/choice-card`; preparation days). Zone sheet: every field full-width; delivery time as one row `[min] to [max] days`; price pre-fills with `Math.max(defaultRateForGovernorate(region of each place))` until typed (country `EG` → Cairo rate is wrong; use the highest governorate rate for `EG`); live example "A customer in {place} with an order of EGP 300 pays {amount}". Remove all per-kg UI and the commented Tallaby-delivery blocks' references to per-kg (keep the Tallaby-disabled comment block itself).
- [ ] **Step 2: Strings.** Replace per-kg, governorate-only copy in both files (`zoneSheetDescription` → "A place can be in only one zone that's on. A more specific place wins: a New Cairo zone beats a Cairo zone."; `fields.places` "Places this zone covers"; `searchPlaces` "Search a country, governorate, city or area"; `templates.*` titles/descriptions for the 4 templates; `otherPlaces.tallabyRates` / `otherPlaces.refuse`; `checkPrice.*`; `errors.overlap` "A place you chose is already in another zone that's on."). Remove unused keys. Arabic first-class, not machine-literal.
- [ ] **Step 3: Run** `pnpm --filter dashboard typecheck` and `pnpm --filter dashboard lint` — PASS.
- [ ] **Step 4: Manual check** with the dashboard dev server (`pnpm --filter dashboard dev`, port 3002) on a staging store: apply each template, add/edit/delete a zone with a city and a country, Check a price for Nasr City / Aswan / Riyadh, toggle Other places, at 360px and 1280px, Arabic and English. Record the result in `PLAN.md` §23.
- [ ] **Step 5: Commit** `feat(dashboard): shipping page with places, templates and price check`

---

### Task 7: Searchable governorate and city fields in the address form

**Files:**
- Create: `apps/ecommerce/components/address/place-combobox.tsx`
- Modify: `apps/ecommerce/components/shared/address-dialog-steps/address-form-step.tsx` (fields at ~213–227), `apps/ecommerce/components/address/address-form.tsx` (~215–225)
- Modify: `apps/ecommerce/messages/{ar,en}.json`

**Interfaces:**
- Consumes: Task 1 via `await import('@workspace/lib/places')`.
- Produces: `<PlaceCombobox value: string; onChange(text: string); level: 'region' | 'city'; within?: string /* place key */; locale; placeholder />` — a combobox (shadcn `Popover` + `Command`, check `@workspace/ui` for existing ones first) listing `searchPlaces(input, { within, levels: [level] })`; picking a result writes the place name in the current locale as plain text; typing free text is kept on blur. The governorate field uses `within = country key || 'EG'`; the city field uses `within = resolveAddressPlace({ country, state })` when it resolves to a region.

- [ ] **Step 1: Implement** the combobox and swap the two text inputs in both forms; map-pin pre-fill still writes into the same form values.
- [ ] **Step 2: Strings**: `searchGovernorate` "Search governorate" / "ابحث عن المحافظة", `searchCity` "Search city or area" / "ابحث عن المدينة أو المنطقة", `noPlaceMatch` "No match. You can keep what you typed." / "لا نتائج. يمكنك الإبقاء على ما كتبته.".
- [ ] **Step 3: Run** `pnpm --filter ecommerce typecheck`, `pnpm --filter ecommerce lint` — PASS.
- [ ] **Step 4: Manual check** on marketplace and a store host: new address via typing, via picking, via map pin; marketplace checkout price for that address unchanged. Record in `PLAN.md` §23.
- [ ] **Step 5: Commit** `feat(address): searchable governorate and city fields`

---

### Task 8: Docs, full verification, rollout data

**Files:**
- Modify: `PLAN.md` (§8.7 status, §22 checklist P3-08 Part B, §23 log entry), `CLAUDE.md` (rule 6: next migration `0094`, describe `0093`; note `0093` applied on staging), `docs/fulfillment.md` only if a statement there is now false, `docs/wallet.md` (shipping in the `sale` entry for store-website orders), `.gitignore` (add `.superpowers/`)

- [ ] **Step 1:** Run `pnpm lint`, `pnpm typecheck`, `pnpm test` at the root; with `TEST_DATABASE_URL` run the integration tests of `@workspace/lib` and `@workspace/db`. Expected: all pass except failures already recorded in `PLAN.md` §23 as pre-existing.
- [ ] **Step 2:** Read-only production count (URL per memory: `apps/shipping/.env`): `SELECT count(DISTINCT store_id) AS stores, count(*) FILTER (WHERE per_kg_surcharge > 0) AS per_kg_zones FROM store_shipping_zones;` Record in §23. Do not write to production.
- [ ] **Step 3:** Update the docs listed above (edit `PLAN.md` with the Edit tool, never a `String.replace` script).
- [ ] **Step 4: Commit** `docs: store shipping Part B log and rules`
- [ ] **Step 5:** Ask the owner to approve applying `0093` on production (dry-run in a rolled-back transaction first, then apply).
