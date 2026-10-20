/* Constants shared by the home page server and client code (no server imports here). */

/** Periods the home page can report on. */
export const HOME_RANGES = [7, 30, 90] as const;
export type HomeRange = (typeof HOME_RANGES)[number];

export function parseHomeRange(value: string | string[] | undefined): HomeRange {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (HOME_RANGES as readonly number[]).includes(n) ? (n as HomeRange) : 7;
}

/** Set when the seller hides the setup checklist. */
export const SETUP_DISMISS_COOKIE = "tl-home-setup-dismissed";

/**
 * Which sales the home page reports (PLAN.md P3-04): everything, marketplace
 * orders only, or one store's storefront orders (`?channel=<storeId>`).
 */
export type HomeChannel = "all" | "marketplace" | (string & {});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseHomeChannel(value: string | string[] | undefined): HomeChannel {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === "marketplace") return "marketplace";
  return v && UUID.test(v) ? v : "all";
}

/** A store channel is kept only when it is one of the seller's own stores. */
export function resolveHomeChannel(channel: HomeChannel, sellerStoreIds: string[]): HomeChannel {
  if (channel === "all" || channel === "marketplace") return channel;
  return sellerStoreIds.includes(channel) ? channel : "all";
}
