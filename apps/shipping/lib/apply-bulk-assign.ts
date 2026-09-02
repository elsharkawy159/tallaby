import {
  db,
  and,
  eq,
  inArray,
  orderItems,
  orders,
  shipmentBatches,
  shipmentBatchItems,
  shipments,
  shippingProviders,
} from "@workspace/db";
import type { PackageVolume } from "@workspace/lib/shipping";

import { buildRiderSplit, loadBulkAssignOrders, loadEligibleRiders } from "@/app/(admin)/orders/batch.query";
import type { BulkInvalidOrder, RiderSplitEntry } from "@/app/(admin)/orders/batch.types";
import { getProviderAdapter } from "@/providers";
import {
  EGYPT_POST_MERCHANT_CODE,
  EGYPT_POST_MERCHANT_NAME,
  EGYPT_POST_WAREHOUSE_NAME,
} from "@/providers/egypt-post.constants";

/**
 * The bulk-assign transaction, shared by the admin's "Assign" / "Assign all"
 * Server Action and the headless Auto Assign webhook.
 *
 * Deliberately NOT a "use server" module, and deliberately free of both
 * `requireShippingAdmin()` and `getTranslations()`: the two callers
 * authenticate differently (a user session vs. a shared secret) and only one
 * of them has a locale. Outcomes are returned as codes so the caller decides
 * how — or whether — to phrase them for a human.
 *
 * Splitting it out this way is what keeps automation from becoming a second
 * implementation of assignment. The all-or-nothing guarantee, the batch row,
 * and the per-order upsert live here once.
 */

export interface ApplyBulkAssignInput {
  providerId: string;
  /** Already resolved and stage-checked by the caller. */
  orderIds: string[];
  weightKg: number;
  volume: PackageVolume;
  /** Null for the automation webhook, which acts on no admin's behalf. */
  createdBy: string | null;
}

export interface ApplyBulkAssignSuccess {
  batchId: string;
  seq: number;
  assigned: number;
  providerCode: string;
  providerName: string;
  hasExport: boolean;
  riderSplit: RiderSplitEntry[] | null;
}

export type ApplyBulkAssignOutcome =
  | { ok: true; data: ApplyBulkAssignSuccess }
  | { ok: false; code: "provider_not_found" | "no_orders" }
  | { ok: false; code: "plan_blocked"; invalid: BulkInvalidOrder[] };

export async function applyBulkAssign({
  providerId,
  orderIds,
  weightKg,
  volume,
  createdBy,
}: ApplyBulkAssignInput): Promise<ApplyBulkAssignOutcome> {
  if (orderIds.length === 0) {
    return { ok: false, code: "no_orders" };
  }

  const [provider] = await db
    .select({ id: shippingProviders.id, code: shippingProviders.code, name: shippingProviders.name })
    .from(shippingProviders)
    .where(and(eq(shippingProviders.id, providerId), eq(shippingProviders.isActive, true)))
    .limit(1);

  if (!provider) {
    return { ok: false, code: "provider_not_found" };
  }

  const bulkOrders = await loadBulkAssignOrders(orderIds);
  const riders = provider.code === "tallaby" ? await loadEligibleRiders() : [];

  const adapter = getProviderAdapter(provider.code);
  const plan = adapter.planBulkAssign
    ? adapter.planBulkAssign({
        orders: bulkOrders,
        riders,
        defaults: {
          weightKg,
          volume,
          merchantCode: EGYPT_POST_MERCHANT_CODE,
          merchantName: EGYPT_POST_MERCHANT_NAME,
          warehouseName: EGYPT_POST_WAREHOUSE_NAME,
        },
      })
    : { riderByOrderId: {}, export: null, errors: [] };

  // All-or-nothing: a half-uploadable sheet or a half-split batch is worse
  // than none. For Tallaby this is also what makes "no rider on duty" a clean
  // no-op rather than a batch of unassigned shipments.
  if (plan.errors.length > 0) {
    return { ok: false, code: "plan_blocked", invalid: plan.errors };
  }

  const now = new Date().toISOString();

  const batch = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(shipmentBatches)
      .values({
        providerId: provider.id,
        createdBy,
        orderCount: orderIds.length,
        exportFormat: plan.export?.format ?? null,
        metadata: { weightKg, volume, providerCode: provider.code, ...(createdBy ? {} : { source: "automation" }) },
      })
      .returning({ id: shipmentBatches.id, seq: shipmentBatches.seq });

    if (!inserted) throw new Error("Failed to create batch");

    await tx.insert(shipmentBatchItems).values(
      orderIds.map((orderId) => ({
        batchId: inserted.id,
        orderId,
        riderId: plan.riderByOrderId[orderId] ?? null,
      }))
    );

    // One upsert per order rather than a single multi-row statement, so
    // the existing `onConflictDoUpdate({ target: shipments.orderId })`
    // idempotency guarantee (also used by the single-order assignProvider/
    // assignRider actions) applies identically here.
    for (const order of bulkOrders) {
      const riderId = plan.riderByOrderId[order.orderId] ?? null;
      const weightToWrite = (order.packageWeightKg ?? weightKg).toFixed(2);

      await tx
        .insert(shipments)
        .values({
          orderId: order.orderId,
          providerId: provider.id,
          carrier: provider.code,
          riderId,
          status: "assigned",
          packageWeight: weightToWrite,
          assignedAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: shipments.orderId,
          set: {
            providerId: provider.id,
            carrier: provider.code,
            riderId,
            status: "assigned",
            packageWeight: weightToWrite,
            assignedAt: now,
            updatedAt: now,
          },
        });
    }

    await tx.update(orders).set({ status: "shipped", updatedAt: now }).where(inArray(orders.id, orderIds));

    // Matches ORDER_ITEM_STATUS_BY_SHIPMENT.assigned in apply-shipment-status.ts.
    await tx
      .update(orderItems)
      .set({ status: "shipping_soon", updatedAt: now })
      .where(inArray(orderItems.orderId, orderIds));

    return inserted;
  });

  return {
    ok: true,
    data: {
      batchId: batch.id,
      seq: batch.seq ?? 0,
      assigned: orderIds.length,
      providerCode: provider.code,
      providerName: provider.name,
      hasExport: plan.export !== null,
      riderSplit: riders.length > 0 ? buildRiderSplit(plan.riderByOrderId, riders) : null,
    },
  };
}
