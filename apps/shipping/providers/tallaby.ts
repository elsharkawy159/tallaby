import {
  ProviderNotImplementedError,
  type BulkAssignContext,
  type BulkAssignPlan,
  type CreateShipmentResult,
  type EligibleRider,
  type ProviderTracking,
  type ShippingProviderAdapter,
} from "./types";

/**
 * Our own delivery fleet. Assignment doesn't hand off to an external system —
 * it splits the batch across on-duty riders, weighted by each rider's
 * current open-delivery count, so a rider already carrying more work gets
 * fewer of this batch.
 */
function splitAcrossRiders(
  orders: BulkAssignContext["orders"],
  riders: EligibleRider[]
): BulkAssignPlan {
  if (riders.length === 0) {
    return {
      riderByOrderId: {},
      export: null,
      errors: orders.map((order) => ({
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        reason: "No Tallaby driver available",
      })),
    };
  }

  // Seeded from each rider's existing open deliveries, so someone already
  // carrying work receives fewer of this batch than a rider starting at zero.
  const load = new Map(riders.map((rider) => [rider.id, rider.activeDeliveries]));
  const riderByOrderId: Record<string, string> = {};

  for (const order of orders) {
    // Lowest current load wins each round; ties break by name so the split
    // is deterministic for a given rider set and order list.
    const rider = [...riders].sort((a, b) => {
      const diff = (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0);
      return diff !== 0 ? diff : (a.fullName ?? "").localeCompare(b.fullName ?? "");
    })[0]!;

    riderByOrderId[order.orderId] = rider.id;
    load.set(rider.id, (load.get(rider.id) ?? 0) + 1);
  }

  return { riderByOrderId, export: null, errors: [] };
}

export const tallabyAdapter: ShippingProviderAdapter = {
  code: "tallaby",

  async createShipment(): Promise<CreateShipmentResult> {
    return { trackingNumber: null, labelUrl: null };
  },

  async trackShipment(): Promise<ProviderTracking | null> {
    throw new ProviderNotImplementedError("tallaby", "trackShipment");
  },

  async cancelShipment(): Promise<void> {
    throw new ProviderNotImplementedError("tallaby", "cancelShipment");
  },

  planBulkAssign(ctx: BulkAssignContext): BulkAssignPlan {
    return splitAcrossRiders(ctx.orders, ctx.riders);
  },
};
