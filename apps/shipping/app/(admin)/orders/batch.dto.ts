import { z } from "zod";
import { PACKAGE_VOLUMES } from "@workspace/lib/shipping";

import { shippingFiltersSchema } from "./orders.dto";

/**
 * Which orders to assign. "ids" is an explicit checkbox selection (capped —
 * a bulk action button is not meant to move an unbounded number of rows in
 * one request). "filters" is "Assign all": the server re-runs the same
 * query the Confirmed tab is showing, so the action covers every matching
 * order rather than just the current page.
 */
export const bulkAssignTargetSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("ids"), orderIds: z.array(z.uuid()).min(1).max(1000) }),
  z.object({ mode: z.literal("filters"), filters: shippingFiltersSchema }),
]);

export const bulkAssignProviderSchema = z.object({
  providerId: z.uuid(),
  target: bulkAssignTargetSchema,
  weightKg: z.coerce.number().min(0.1).max(100).default(1),
  volume: z.enum(PACKAGE_VOLUMES).default("Small"),
});

export type BulkAssignTarget = z.infer<typeof bulkAssignTargetSchema>;
export type BulkAssignProviderInput = z.infer<typeof bulkAssignProviderSchema>;

export const bulkConfirmOrdersSchema = z.object({
  orderIds: z.array(z.uuid()).min(1).max(1000),
});

/**
 * The only two transitions a bulk action drives. `failed`/`returned`/
 * `cancelled` need a per-order reason and stay single-order actions on the
 * order detail page.
 */
export const BULK_SHIPMENT_STATUSES = ["out_for_delivery", "delivered"] as const;

export const bulkUpdateShipmentStatusSchema = z.object({
  orderIds: z.array(z.uuid()).min(1).max(1000),
  status: z.enum(BULK_SHIPMENT_STATUSES),
});
