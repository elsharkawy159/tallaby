/**
 * Test orders (0155, ROADMAP.md F-76): placed by a seller who isn't activated
 * yet, on their own store, from the browser holding the store's preview pass.
 * Pure rules, shared by the fee code (here) and the order code (packages/lib).
 */

type MaybeTestOrder = { isTest?: boolean | null } | null | undefined;

/** A test order never pays the platform fee: not when placed, not when paid, not when delivered. */
export function orderPaysPlatformFee(order: MaybeTestOrder): boolean {
  return order?.isTest !== true;
}

/** A test order never took stock, so nothing is put back when it's cancelled or returned. */
export function orderMovesStock(order: MaybeTestOrder): boolean {
  return order?.isTest !== true;
}
