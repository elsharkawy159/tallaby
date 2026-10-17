/**
 * Pure access rules for the seller account and its stores (PLAN.md P1-03,
 * CLAUDE.md rule 5). No I/O: `require-seller.server.ts` loads the rows and
 * calls these. Kept separate so every rule is unit-tested.
 */

export type AccessCode =
  | "unauthorized"      // no session
  | "no_seller"         // signed in, but no sellers row
  | "seller_blocked"    // pending / suspended account
  | "not_found"         // missing, deleted or someone else's store (never reveal which)
  | "store_read_only"   // archived or admin-suspended store
  | "publish_blocked";  // restricted seller trying to publish (A5)

export type AccessResult = { ok: true } | { ok: false; code: AccessCode };

export type AccessOptions = {
  forWrite?: boolean;
  forPublish?: boolean;
};

export type StoreRecord = {
  id: string;
  sellerId: string;
  status: string;
  deletedAt: string | null;
};

const ALLOWED_SELLER_STATUSES = new Set(["approved", "restricted"]);

export function checkSellerAccess(status: string | null | undefined, _options: AccessOptions): AccessResult {
  if (status === null || status === undefined) return { ok: false, code: "no_seller" };
  // "restricted" keeps the dashboard (e.g. to ship open orders); see seller-access.ts.
  return ALLOWED_SELLER_STATUSES.has(status) ? { ok: true } : { ok: false, code: "seller_blocked" };
}

export function checkStoreAccess(
  store: StoreRecord | null,
  sellerId: string,
  sellerStatus: string,
  options: AccessOptions,
): AccessResult {
  if (!store || store.sellerId !== sellerId || store.deletedAt !== null) {
    return { ok: false, code: "not_found" };
  }
  const writing = options.forWrite || options.forPublish;
  if (writing && store.status !== "active") return { ok: false, code: "store_read_only" };
  if (options.forPublish && sellerStatus !== "approved") return { ok: false, code: "publish_blocked" };
  return { ok: true };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Store ids arrive from URLs and client calls: reject anything that is not a uuid before querying. */
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
