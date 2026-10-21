# Store shipping: seller prices at checkout, places, templates

Date: 2026-10-21 · Status: for owner review · Builds on `PLAN.md` §8.7 (P3-08 Part A is built; this is Part B plus a redesign of the seller page).

## 1. Why

Sellers on Tallaby deliver their own orders (Tallaby delivery is disabled, `TALLABY_SERVICES_ENABLED = false`). The shipping page at `/stores/[storeId]/shipping` already stores zones, but checkout ignores them and bills Tallaby's governorate rate table for every order. A seller cannot set what their own customers pay. The zone sheet is also awkward (the days inputs overflow the free-delivery field), places are limited to Egypt's 27 governorates picked from a checkbox grid, and the per-kg price is noise: sellers know their products' weight and set one price.

Success: a seller opens the shipping page, applies a template or builds zones for any country, governorate, city or area (searching by name in Arabic or English), and a customer on that store's website pays exactly that price at checkout, with the price shown before they pay equal to the price charged. The shipping money the customer paid reaches the seller.

## 2. Goals

1. **Seller prices are charged on the store website.** Storefront orders (`orderSource = 'storefront'`, store host) are priced from the store's zones. Marketplace orders (`www.tallaby.com`) are unchanged.
2. **Templates.** Tallaby's rates are offered as a template the seller can apply and then edit, alongside a few simple presets, or the seller starts from scratch.
3. **Places at any level, searchable.** A zone covers any mix of countries, regions (governorates, emirates, provinces) and cities/areas. One search box finds any place by Arabic or English name. **Egypt first** everywhere: in search results, browse lists, defaults and data depth.
4. **Large built-in place data** (code constants, no DB table): every country; for Egypt all governorates and their cities and main areas; for Saudi Arabia, the other Gulf states and the rest of the Arab world their regions and main cities. Arabic and English names for every entry.
5. **Simpler zone sheet.** Flat price, optional free-delivery-over, delivery days, COD on/off, zone on/off. No per-kg price. Layout fixed (each field gets a full row; days are "1 to 3 days" on one line).
6. **Shipping money goes to the seller** on store-website orders (§6.8).
7. **Keep it simple for the seller.** Sensible defaults, plain words, a live "what the customer pays" example, and a "Check a price" tool on the page.

## 3. Non-goals

- **Multi-currency.** Riyal-paying customers are a separate, later project (owner, 2026-10-21). All prices stay in the store's currency, which is EGP for every store today. New types should not hard-code EGP beyond what the existing money helpers do, so a later currency column slots in.
- **Non-Egypt addresses at checkout** (owner: Egypt only until multi-currency). Sellers may already put other countries in zones; checkout does not use them yet.
- Marketplace shipping, Tallaby's rate table, fulfillment (D31 switch to `provider = seller`), collection-party rules and the EGP 5 fee. None change. The one ledger change is §6.8.
- Weight-based pricing, carrier integrations, pickup points, cut-off times.
- Changing the default template's design.

## 4. Anti-goals

- A shown price that differs from the charged price.
- A seller-facing page that needs a manual to use.
- Breaking any existing storefront checkout that works today.
- A ledger entry posted twice, or shipping credited to a seller who already holds the cash.

## 5. Decisions (owner, 2026-10-21)

- Seller zone prices are what storefront customers pay.
- Tallaby's rates are shown to the seller as a template to use or edit; the seller can also build a new system.
- Remove the per-kg price.
- Search across countries, regions, cities and areas; big constants dataset; Egypt has priority in lists and everything.
- Multi-currency is out of scope for now.
- The mockup (shipping page + zone sheet, `.superpowers/brainstorm/…/shipping-page.html`) is the approved direction.
- **Uncovered places:** a per-store switch "Other places": *use Tallaby's rates* (default, for new and existing stores, so nothing that checks out today starts refusing) or *don't deliver* ("We don't deliver here yet", order refused).
- **Shipping money to the seller:** on store-website orders the seller delivers, so the shipping the customer paid is credited to the store wallet when Tallaby collected the payment (ledger work, approved as part of this project, §6.8).
- **Checkout is Egypt-only for now.** Foreign place data is regions + main cities.
- **Address form pickers everywhere**, marketplace and store websites.

## 6. The design

### 6.1 Place data (`packages/lib/src/places/`)

- A place has a stable **key** that is a path: `EG` (country, ISO 3166-1 alpha-2), `EG/CAIRO` (region), `EG/CAIRO/nasr-city` (city or area). Three levels only: country → region → city/area. *(Builder call: Egypt's "city or area" level mixes real cities like 6th of October and Cairo districts like Nasr City, which is how customers name where they live.)*
- **Egypt region keys reuse today's governorate keys** (`CAIRO`, `GIZA`, `KAFR EL SHEIKH`…, from `CAIRO_ORIGIN_RATES`), so existing zones and `normalizeGovernorate` map 1:1 (`EG/<governorate>`).
- Each entry: `key`, `nameAr`, `nameEn`, optional `aliases` (other spellings in both scripts, including geocoder forms like "Al Qalyubiya", "Cairo Governorate").
- Countries: every ISO country, with Arabic and English names stored in the data (not `Intl.DisplayNames`, whose output varies by runtime).
- Depth: Egypt all governorates + their cities/markaz towns + main areas of Cairo, Giza and Alexandria (reuse and extend the area list in `apps/admin/.../customer-paste.lib.ts`); Saudi Arabia 13 regions + main cities; UAE, Kuwait, Qatar, Bahrain, Oman, Jordan, Iraq, Lebanon, Palestine, Syria, Yemen, Libya, Sudan, Tunisia, Algeria, Morocco: regions + main cities. Other countries: country level only.
- Pure helpers: `getPlace(key)`, `placeLabel(key, locale)` (with parent, e.g. "Nasr City · Cairo"), `parentsOf(key)`, `childrenOf(key)`, `searchPlaces(query, { locale, limit, country? })` with Arabic normalisation (strip tashkeel, unify أ/إ/آ→ا, ة→ه, ى→ي) and English case/hyphen folding; ranking: exact > prefix > contains, **Egypt before other countries**, then country > region > city.
- The data module is large; browser code loads it only where needed (zone sheet, "Check a price", address pickers) with a dynamic import. Server code imports it normally.

### 6.2 Zones

- A zone covers `places: string[]` (place keys, 1..200) instead of `governorates`. Fields: name AR/EN, places, price, freeOver (nullable), deliveryDaysMin/Max, codEnabled, enabled. `perKgSurcharge` is dropped from the schema, form and quote.
- **Most specific place wins.** A customer in Nasr City matches a zone with `EG/CAIRO/nasr-city` before a zone with `EG/CAIRO`, before a zone with `EG`. The same exact place may not sit in two enabled zones (the new overlap rule, replacing "no governorate in two zones").
- Max 30 zones per store stays.
- Store settings gain `otherPlaces: 'tallaby_rates' | 'refuse'` (default `'tallaby_rates'`; missing = default) next to `method`, `handlingDays`, `freeShippingOver`.

### 6.3 Migration `0093_store_shipping_places.sql` (idempotent)

- `ALTER TABLE store_shipping_zones ADD COLUMN IF NOT EXISTS places text[] NOT NULL DEFAULT '{}'`.
- Backfill `places = array(select 'EG/' || g from unnest(governorates) g)` where `places = '{}'`.
- Add check `cardinality(places) > 0` (guarded); drop the `governorates` cardinality check and give `governorates` default `'{}'` (kept, no longer written; not dropped, so older code can still read it).
- Leave `per_kg_surcharge` in place, no longer read or written. *(Builder call: non-destructive.)*
- Mirror in `schema.ts`. Staging first; production with owner approval.

### 6.4 Customer address → place

- New pure `resolveAddressPlace({ country, state, city, addressLine1 })` → the most specific place key it can find, or null:
  - country: free text or ISO → country key; empty → `EG` (the address default is Egypt).
  - region: `normalizeGovernorate` for Egypt, alias match for other countries.
  - city/area: alias match of `city`, then of the area part of `addressLine1` ("street, area"), within the matched region.
- **Address form** (shared by marketplace and storefront): the governorate and city/area fields become searchable pickers fed by the same place data (Egypt first), still allowing free typing. The map pin keeps pre-filling them. Stored values stay plain text names (in the customer's language), so marketplace pricing (`normalizeGovernorate`) keeps working unchanged. Both `components/shared/address-dialog-steps/address-form-step.tsx` and `components/address/address-form.tsx`.

### 6.5 Checkout integration (one quote function)

- New `packages/lib/src/shipping/store-quote.ts`: `quoteStoreShipping({ settings, zones, place, subtotal })` → `{ kind: 'zone', zone, amountPiastres, free, daysMin, daysMax, codEnabled }` | `{ kind: 'tallaby_rates' }` (no zones, or uncovered with `otherPlaces = 'tallaby_rates'`) | `{ kind: 'not_covered' }` | `{ kind: 'outside_egypt' }`.
- A server loader `getStoreShippingForCheckout(storeId)` reads settings + enabled zones by store id. The store id comes from `getCartScope()` / `cart.storeId`, never from the client. Not cached (rule 8).
- **One entry point used everywhere** a storefront shipping price is computed or shown: `actions/checkout.ts` (`getCheckoutData`, `recalculateCheckoutSummary`), `actions/coupons.ts` (both recomputations) and `placeOrderFromCart`. In `placeOrderFromCart` the storefront branch uses `cart.storeId` when `orderSource === 'storefront'`. `tallaby_rates` falls through to today's `calculateLocationShippingCost` path unchanged.
- **Not covered** with `otherPlaces = 'refuse'`: a "not delivered here" error before the order is created; checkout shows "We don't deliver here yet" and disables Place order.
- **Outside Egypt** (address country resolves to anything but `EG`): refused on store websites with "We deliver inside Egypt only for now". Marketplace unchanged.
- Discounts on zone-priced orders: the zone's `freeOver` decides free delivery; product and seller free-delivery flags and free-shipping coupons still apply as today; Tallaby's platform cart threshold does not apply. *(Builder call.)*
- COD on zone-priced orders: refused when the zone has `codEnabled = false`; the store's `codMaxOrder` still applies; the 90 EGP cap (a Tallaby-rider rule) does not apply. It still applies to the Tallaby-rates fallback and the marketplace. *(Builder call.)*
- Checkout shows the delivery estimate for zone-priced orders: "Arrives in X–Y days" = handlingDays + zone days. *(Builder call.)*
- Orders store the real shipping cost as today (`orders.shippingCost`), plus a snapshot on every store-website order placed while `method = 'own'`: `orders.metadata.storeShipping = { method: 'own', pricedBy: 'zone' | 'tallaby_rates', zoneId?, zoneName?, place, billedPiastres }`. `billedPiastres` = shipping cost minus the shipping discount actually applied, i.e. what the customer paid for delivery. This snapshot drives §6.8.

### 6.6 Seller page (`/stores/[storeId]/shipping`)

Following the approved mockup:

1. Intro card: "Customers on your website pay these prices."
2. **Templates** (shown when no zones; otherwise behind a "Templates" button; applying one when zones exist asks to replace them):
   - Tallaby's rates (existing `defaultZoneGroups`, flat, no per-kg).
   - One price for all Egypt (asks for one price; one zone `EG`).
   - Cairo & Giza only (one zone, Tallaby's Cairo price).
   - Start from scratch (opens an empty zone sheet).
   Templates are built server-side; the client sends only the template id, names and (for "one price") the price.
3. **Zones list**: name, place chips (with parent: "New Cairo · Cairo"), price, free-over, days, COD badge, an "overrides <zone>" hint when a more specific zone sits inside another; edit/delete; a "Not covered" summary for Egypt's governorates that says what happens there (Tallaby's rates or not delivered).
4. **Check a price**: place search + order total → matched zone (or the fallback), price, days. Uses the same quote function.
5. **Settings card**: "Other places" switch (use Tallaby's rates / don't deliver) and preparation time (handlingDays).

Zone sheet: names AR/EN; places (search box with grouped results, Egypt first; chips; "browse Egypt's governorates" list; places already in another zone labelled); price (pre-filled with Tallaby's rate for the chosen places until the seller types); free-over; delivery days "min to max days"; COD switch; zone-on switch; live example. Full-width rows, no overflow at any width, RTL correct.

### 6.7 Strings, isolation, verification

- Every string in `ar.json` and `en.json` (dashboard and ecommerce). Brand طلبي.
- All writes keep `requireStore(storeId, { forWrite: true })`; zone queries filter by `store_id`.
- Tests: unit (place search ranking/normalisation, `resolveAddressPlace`, `quoteStoreShipping` precedence and fallbacks, zone schema, templates); integration on staging (zone CRUD with places, overlap, storefront place-order charging the zone price / refusing / COD off / outside Egypt, and §6.8); `pnpm lint`, `typecheck`, `test`; manual E2E logged in `PLAN.md` §23.

### 6.8 Shipping credited to the seller (ledger)

- In `creditSellerOnDelivery` (`packages/db/src/wallet/credit-seller-on-delivery.ts`): when the order has `metadata.storeShipping.method = 'own'`, the seller is the order's store owner, and the collection party is `tallaby`, the seller's **existing `sale` entry** for the order includes `billedPiastres` (amount = line totals + billed shipping; entry `metadata.shippingPiastres` records the part). It uses the same single claim (`order:<orderId>`), so it stays idempotent and replay-safe: no new entry type, enum or reference type.
- When the seller collected (own-rider COD, `paymentCollector = 'seller'`), nothing extra is posted: the seller already holds the shipping cash.
- Orders without the snapshot (marketplace, older storefront orders) are untouched. The EGP 5 fee is unchanged and never computed on shipping.
- Refunds: no seller-wallet reversal exists today for any part of an order; unchanged.
- Integration tests on staging: a Tallaby-collected storefront order credits goods + shipping once (a replayed delivery posts nothing); seller-collected posts only the fee; a free-delivery order credits no shipping; a marketplace order is unchanged.

## 7. Rollout

- Existing zones go live on deploy, but every store starts with "Other places: use Tallaby's rates", so an address a store doesn't cover is priced exactly as today. Existing zones lose their per-kg part (flat price only), as the owner asked.
- Before the production deploy, run a read-only count on production (stores with zones, zones with a non-zero `per_kg_surcharge`) and record it in `PLAN.md` §23.
- Migration `0093`: staging, then production with owner approval.

## 8. Left to the builder

Exact component split, data file layout, search ranking weights, copy wording, the list of Egypt areas beyond those named above, and anything marked *(Builder call)*.
