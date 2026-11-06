import { createCachedQuery, sellerTags } from "@workspace/cache";
import { getOrderLock } from "./order-lock.server";

/**
 * Whether a seller's published stores are private (ROADMAP.md F-76): the order
 * lock (F-68, `getOrderLock`) read for the storefront, which asks on every page.
 *
 * Cached as a yes/no only (no balance, no wallet row) for a short time, keyed and
 * tagged by seller id (CLAUDE.md rule 8). Activation clears the tag (top-up
 * approved, Kashier top-up, admin credit, Pro), so the store goes public at once;
 * anything else is bounded by the TTL. Dashboard pages and order creation read
 * `getOrderLock` fresh instead. `getOrderLock` already answers "not locked"
 * without further queries while the USD switch is off, and on any error.
 */
const ACTIVATION_TTL_SECONDS = 30;

const cachedLocked = createCachedQuery({
  name: "seller:activation-locked",
  ttl: ACTIVATION_TTL_SECONDS,
  tags: (sellerId: string) => [sellerTags.activation(sellerId)],
  query: async (sellerId: string) => (await getOrderLock(sellerId)).locked,
});

export async function isSellerActivationLocked(sellerId: string): Promise<boolean> {
  try {
    return await cachedLocked(sellerId);
  } catch {
    // Same as getOrderLock: an error must never take a store offline.
    return false;
  }
}
