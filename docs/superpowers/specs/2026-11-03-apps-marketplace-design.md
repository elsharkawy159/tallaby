# Apps marketplace

Roadmap: `ROADMAP.md` F-47 (F-47a). Extends the one apps catalog (F-41); money follows the USD wallet design (`2026-11-03-usd-wallet-and-plans-design.md`).

No paid app is launching. Every catalog app is free today, and the engine below is built and tested ahead of the first paid one.

Apps are built by Tallaby only: a catalog entry is code in this repo, with no seller or third-party code (CLAUDE.md rule 9).

## Catalog

`STORE_APPS` (`packages/lib/src/integrations/catalog.ts`) stays the single list. Each entry gets:

- **Category:** the existing `group`. Shipping and Payment methods already read it, so a second field would only drift.
- **`pricing`:** see below.
- **`defaultInstalled`:** the app comes with every store and needs no connecting (today: AI assistants).

## Installed

The page works out "installed" from three sources: `defaultInstalled`, a `store_integrations` row (connected, unchanged) or a live `store_app_installs` row. So existing connect flows need no install row, and every connected app shows up without a backfill.

Explore lists the whole catalog, including "coming soon" entries. Product feeds, which aren't a catalog app, stay under the Installed list.

## Pricing data

`AppPricing` (`packages/lib/src/billing/app-pricing.lib.ts`) is a union on `model`. A new model adds a member, and the compiler points at each place that must handle it.

| Model | Fields | Charged |
| --- | --- | --- |
| `free` | none | never |
| `one_time` | `usdCents` | at install |
| `monthly` | `usdCents` | at install, then each month |
| `per_order` | `usdCents` | once per order |
| `usage` | `usdCents`, `unit` (action, minute, hour, day) | once per usage event |

Prices are integer US cents.

## Install state

`store_app_installs` (0139) is per store, because apps act on one store's site and orders. Two stores with the same paid app pay twice, from the one account wallet. There's one live row per store and app; history stays.

The row keeps the price the seller agreed to. A later catalog price change applies to new installs only, so a wallet is never charged more than the seller accepted.

Every engine function takes an explicit `storeId` and filters on both seller and store. The server actions get both from `requireStore` (CLAUDE.md rule 5).

## Charges

All charges are `service_charge` entries through `postStoreWalletEntry`, with `currency: "USD"` and reference type `store_app`.

| Model | Claim (`reference_id`) |
| --- | --- |
| `one_time` | `<store>:<app>` |
| `monthly` | `<store>:<app>:<period start>` |
| `per_order` | `<store>:<app>:order:<order>` |
| `usage` | `<store>:<app>:usage:<event>` |

The `one_time` claim is per store and app rather than per install row, so removing and reinstalling a bought app doesn't charge again.

Paid installs refuse with `not_live` while `getBillingState().usdLive` is false. Below that check, the charging functions don't read the switch, so tests can run them on a USD-wallet fixture. An EGP wallet refuses any charge through the `currency` check.

### No app charge goes negative

Every app charge sets `enforceNegativeLimit: true`, including `per_order`.

The platform fee may go negative because the platform has to collect it. An app is optional, so it shouldn't put a seller in debt. The brief left `per_order` to judgment, with no negative as the default for anything optional.

`per_order` runs after the sale, so it must never fail the order. `chargeStoreAppsForOrder` swallows wallet refusals: Tallaby forgives that order's charge and the app enters grace. A later successful charge ends grace. Forgiven charges aren't collected later.

`usage` runs before the action. If the wallet can't pay, the caller gets `insufficient_balance` and must not run the action. The install stays as it is.

## Renewal and removal

`renewDueApps` runs from the plan-renewals cron and does nothing before the switch. It follows the Pro plan:

- **Monthly due:** charge, then move the period forward.
- **Wallet short:** 3 days' grace (`PLAN_GRACE_DAYS`) with a notification, and the app keeps working. A charge that succeeds during grace clears it.
- **Grace over:** the app is uninstalled (`payment_failed`) with a notification.
- **`per_order` grace over:** the wallet is checked first. If it can now pay for one order, grace ends; otherwise the app is uninstalled.
- **Retired app** (gone from the catalog): uninstalled with no charge (`retired`).

Removing an app:

- **Monthly in a paid period:** stays until the period ends, no refund. Installing it again before then undoes the removal with no charge.
- **Everything else, and monthly in grace:** removed right away.

## Not wired yet

- `chargeStoreAppsForOrder` isn't called from the order flow. No per-order app exists, and the order path is money code to change only when one does. The hook belongs next to `postOrderFees`, in the same transaction.
- `chargeAppUsage` has no caller, for the same reason.
- A paid app with its own panel adds its Remove button there, using the same server action.
- There's no refund flow. Admin can refund through a wallet adjustment.
