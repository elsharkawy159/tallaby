# Seller Fulfillment

How a seller's operational services (storage, packaging, delivery, customer
service, returns) are split between the seller and Tallaby. Added by
migrations `0040_seller_fulfillment.sql` and `0041_seller_fulfillment_backfill.sql`.
Pure logic lives in `packages/lib/src/fulfillment/`, persistence in
`packages/lib/src/fulfillment/server.ts` (`@workspace/lib/fulfillment/server`).

## 1. Shape

```
fulfillment_plans                 admin catalog (Tallaby plans only; price/limits nullable)
sellers (1) ── (1) seller_fulfillment_profiles    onboarding answers, pickup address, terms
        (1) ── (5) seller_fulfillment_services    one row per service: requested_* + active_*
        (1) ── (n) seller_fulfillment_agreements  negotiated commercial terms
```

Service **types** are an enum (code branches on them). Only **plans** are data.
A composite FK `(plan_id, service_type) -> fulfillment_plans (id, service_type)`
makes it impossible to attach, say, a packaging plan to the storage row, and a
CHECK forbids a plan on a seller-handled service.

## 2. Invariants

1. **Onboarding is a request, not a purchase.** Nothing is charged; a null
   `pricing` renders as "Pricing will be discussed with our team" — never
   "0 EGP" or "Free".
2. **`requested_*` never affects orders.** Sellers (onboarding, later change
   requests) write only `requested_*`. `activateSellerService` is the single
   code path that copies requested -> active.
3. **Read behavior through `resolveEffectiveFulfillment`**, never from the
   table directly. It reads only `active_*`; a missing or `paused` row falls
   back to the baseline.
4. **Baseline = today's behavior**: seller stores, packs, answers customers and
   handles returns; delivery is Tallaby `delivery_standard` (checkout bills
   Tallaby's governorate rates, the shipping app dispatches). New sellers get the
   baseline as `active_*`, so their orders behave exactly like existing sellers'
   until an admin activates something.
5. **Agreements are separate from requests.** Recording one charges nothing and
   changes no order; activation may link one.

## 3. Inventory drop-off vs pickup

Tallaby never collects inventory. A seller on Tallaby storage brings their
stock to the Tallaby warehouse themselves (the team shares the address and
books a drop-off), and orders ship from the warehouse — so no seller pickup
address is collected (`requiresInventoryDropOff`). A pickup address is
required only when the seller keeps the stock and Tallaby packs, delivers, or
brings returns back (`requiresPickupAddress`).

## 4. Product-level `fulfillment_type`

Unchanged and still per product. Seller storage -> `seller_fulfilled`
(the dashboard default); Tallaby storage active -> products may be
`platform_fulfilled`. `fba` is unused (treat as `platform_fulfilled`).
Actual order handling = seller's effective config + product `fulfillment_type`.

## 5. Deferred

- Seller change requests from Settings (write `requested_*`, admin approves).
- Shipping wiring: the shipping app should skip orders whose effective delivery
  is `seller` and must not auto-assign seller riders; shipment origin from the
  pickup address or the warehouse (today hard-coded to Cairo).
- Billing: agreement rates -> `wallet_transactions` rows of type `fee` on
  delivery. Note `place-order.ts` still hard-codes a 10% commission.
- A `warehouses` table (one warehouse today, via `EGYPT_POST_WAREHOUSE_NAME`).
