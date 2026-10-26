import { SHIPPING_TRANSITIONS } from "../shipment-status.lib";
import type { BostaShipmentStatus } from "./bosta.types";

/**
 * Bosta delivery state code → what it means for the Tallaby shipment
 * (state table in https://docs.bosta.co/docs/how-to/get-delivery-status-via-webhook).
 *
 * - `status`: the shipment status to move to, or null to leave it as is.
 * - `attention`: the seller should look at the order (exception, on hold, …).
 */
export type BostaStateEffect = {
  status: BostaShipmentStatus | null;
  attention: boolean;
};

const EFFECTS: Record<number, BostaStateEffect> = {
  // Created / waiting for route / route assigned.
  10: { status: "assigned", attention: false },
  11: { status: "assigned", attention: false },
  20: { status: "assigned", attention: false },
  // Picked up from business / at warehouse / between hubs / out for delivery.
  21: { status: "out_for_delivery", attention: false },
  24: { status: "out_for_delivery", attention: false },
  30: { status: "out_for_delivery", attention: false },
  41: { status: "out_for_delivery", attention: false },
  // Exception (NDR): Bosta retries, the seller is told why.
  47: { status: null, attention: true },
  45: { status: "delivered", attention: false },
  // Returned to business / returned to stock.
  46: { status: "returned", attention: false },
  60: { status: "returned", attention: false },
  // Terminated / lost / damaged.
  48: { status: "failed", attention: true },
  100: { status: "failed", attention: true },
  101: { status: "failed", attention: true },
  49: { status: "cancelled", attention: false },
  // Investigation / awaiting your action / on hold.
  102: { status: null, attention: true },
  103: { status: null, attention: true },
  105: { status: null, attention: true },
  // Archived.
  104: { status: null, attention: false },
};

const UNKNOWN: BostaStateEffect = { status: null, attention: false };

export function bostaStateEffect(code: number): BostaStateEffect {
  return EFFECTS[code] ?? UNKNOWN;
}

/** Codes after which Bosta sends no further updates. */
const FINAL_CODES = new Set([45, 46, 48, 49, 60, 100, 101, 104]);

export function isFinalBostaState(code: number): boolean {
  return FINAL_CODES.has(code);
}

/** Before pickup: the only states a business can still terminate. */
export function canCancelBostaState(code: number): boolean {
  return code === 10 || code === 11 || code === 20;
}

/** How far along a shipment is; Bosta updates never move it backwards. */
const RANK: Record<BostaShipmentStatus, number> = {
  pending: 0,
  assigned: 1,
  out_for_delivery: 2,
  failed: 3,
  delivered: 4,
  returned: 4,
  cancelled: 4,
};

/**
 * The shipment moves needed to reach `target` from `current`, one legal step
 * at a time (there is no pending → delivered edge), as the shortest path in
 * the transition graph. Empty when the target is not ahead of the current
 * status: Bosta can deliver states out of order, and we never go back.
 */
export function bostaStatusPath(current: BostaShipmentStatus, target: BostaShipmentStatus): BostaShipmentStatus[] {
  if (current === target || RANK[target] < RANK[current]) return [];

  const previous = new Map<BostaShipmentStatus, BostaShipmentStatus>();
  const queue: BostaShipmentStatus[] = [current];
  const seen = new Set<BostaShipmentStatus>([current]);
  while (queue.length > 0) {
    const status = queue.shift()!;
    if (status === target) break;
    for (const next of SHIPPING_TRANSITIONS[status]) {
      // Never step backwards on the way, e.g. out_for_delivery → assigned.
      if (seen.has(next) || RANK[next] < RANK[status]) continue;
      seen.add(next);
      previous.set(next, status);
      queue.push(next);
    }
  }
  if (!previous.has(target)) return [];

  const path: BostaShipmentStatus[] = [];
  for (let step: BostaShipmentStatus | undefined = target; step && step !== current; step = previous.get(step)) {
    path.unshift(step);
  }
  return path;
}
