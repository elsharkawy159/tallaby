import type { OrderLock } from "./order-lock.lib";

/**
 * Who may see a published store whose seller isn't activated yet (ROADMAP.md
 * F-76, owner 2026-11-06). The one definition of "not activated" is
 * `orderLockState` (order-lock.lib.ts): it is never locked while the USD switch
 * is off, for Pro, or once a top-up or a positive balance happened, so all of
 * this is a no-op then.
 *
 *   public        → everyone sees the store, orders are real;
 *   owner_preview → the seller's own browser (a valid pass for this store and
 *                   its seller): the store with a small "only you" banner, and
 *                   its orders are test orders;
 *   private       → everyone else: the store-offline page, no checkout.
 *
 * A store that is offline for another reason (never published, switched off)
 * keeps its own rules (store-site/offline.server.ts in the ecommerce app); the
 * pass never opens it.
 */
export type ActivationAccess = "public" | "owner_preview" | "private";

export function activationAccess(lock: Pick<OrderLock, "locked">, hasValidOwnerPass: boolean): ActivationAccess {
  if (!lock.locked) return "public";
  return hasValidOwnerPass ? "owner_preview" : "private";
}

/** An order placed now is a test order: only the seller can check out on a store that isn't activated. */
export function isTestOrderAccess(access: ActivationAccess): boolean {
  return access === "owner_preview";
}
