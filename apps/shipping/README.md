# Shipping

Last-mile delivery management. Runs on **port 3003**.

Two surfaces in one app, split by role:

| Route | Role | Purpose |
|---|---|---|
| `/`, `/orders`, `/riders`, `/providers` | `admin` | See orders needing shipping, pick a provider, assign a rider, track status |
| `/rider`, `/rider/[shipmentId]` | `driver` | A rider's own deliveries only |

## Setup

```bash
cp .env.example .env      # fill in from another app's .env
pnpm install              # from the repo root
pnpm --filter @workspace/db db:migrate
pnpm --filter shipping dev
```

## Creating a rider account

Riders are ordinary platform users with `users.role = 'driver'` — there is no
separate auth system, and this app does not create users. Promote an existing
account:

```sql
UPDATE users SET role = 'driver', is_verified = true WHERE email = 'rider@example.com';
```

Admins need `role = 'admin'` and `is_verified = true`.

## Data model

There is no `shipping_orders` table. A shipping record is a row in the existing
`shipments` table, one per order (`shipments_order_id_unique`):

- `provider_id` → `shipping_providers` (Bosta, ShipBlu, Egypt Post — seeded by migration `0009`)
- `rider_id` → `users` (a `driver`)
- `status` → the `shipment_status` enum: `pending | assigned | out_for_delivery | delivered | failed | returned | cancelled`

Status changes mirror onto `orders.status` / `shipped_at` / `delivered_at` in
the same transaction. `shipment_items` and `deliveries` are untouched and stay
available for split shipments and per-attempt proof-of-delivery later.

## Adding a real carrier integration

Providers are database records; carrier APIs live behind an adapter keyed by
`shipping_providers.code`:

```
providers/
├── types.ts        ShippingProviderAdapter: createShipment / trackShipment / cancelShipment
├── manual.ts       default — no API calls, rider drives the status
├── bosta.ts        }
├── shipblu.ts      } spread manualAdapter today
├── egypt-post.ts   }
└── index.ts        getProviderAdapter(code), falls back to manual
```

To wire up Bosta, implement `providers/bosta.ts`. Nothing else changes —
`assignProvider` already calls through `getProviderAdapter(code).createShipment()`
and stores whatever tracking number and label come back.

## Notes

- **Nothing here is cached.** Shipping state is the most dynamic data on the
  platform, and `docs/caching-and-data-fetching.md` §3 rules out caching orders.
  This app has no `@workspace/cache` dependency and no `/api/revalidate` route.
- **Authorization is enforced server-side**, in `lib/auth.ts` guards called at
  the top of every action, plus an ownership filter in the `where` clause of
  every rider query. `proxy.ts` redirects but is not the boundary — Drizzle
  connects as the database owner and bypasses RLS.
