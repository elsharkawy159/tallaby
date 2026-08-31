"use server";

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

import { getTranslations } from "next-intl/server";

import { actionError, type ActionResult } from "@/lib/action-result";
import { applyShipmentStatus } from "@/lib/apply-shipment-status";
import { requireShippingAdmin } from "@/lib/auth";
import { translateShippingStatus } from "@/lib/rider-labels";
import { canTransition, type ShippingStatus } from "@/lib/shipping-status";
import { getProviderAdapter } from "@/providers";
import {
  EGYPT_POST_MERCHANT_CODE,
  EGYPT_POST_MERCHANT_NAME,
  EGYPT_POST_WAREHOUSE_NAME,
} from "@/providers/egypt-post.constants";
import { formatBatchLabel } from "./batch.lib";
import {
  bulkAssignProviderSchema,
  bulkConfirmOrdersSchema,
  bulkUpdateShipmentStatusSchema,
} from "./batch.dto";
import {
  buildRiderSplit,
  loadBulkAssignOrders,
  loadEligibleRiders,
  resolveConfirmedOrderIds,
} from "./batch.query";
import type {
  BulkAssignResult,
  BulkConfirmResult,
  BulkStatusFailure,
  BulkStatusResult,
} from "./batch.types";
import { revalidateShipping } from "./orders.query";

/**
 * Assigns a batch of Confirmed-stage orders to one provider. All-or-nothing:
 * if the provider's adapter reports any error (an unmappable governorate for
 * Egypt Post, no on-duty rider for Tallaby), nothing is written — a
 * half-uploadable sheet or a half-split batch is worse than none.
 */
export async function bulkAssignProvider(input: unknown): Promise<BulkAssignResult> {
  try {
    const admin = await requireShippingAdmin();
    const t = await getTranslations("orders");
    const { providerId, target, weightKg, volume } = bulkAssignProviderSchema.parse(input);

    const [provider] = await db
      .select({ id: shippingProviders.id, code: shippingProviders.code, name: shippingProviders.name })
      .from(shippingProviders)
      .where(and(eq(shippingProviders.id, providerId), eq(shippingProviders.isActive, true)))
      .limit(1);

    if (!provider) {
      return { success: false, error: t("providerNotFound") };
    }

    const orderIds = await resolveConfirmedOrderIds(target);

    if (orderIds.length === 0) {
      return { success: false, error: t("noConfirmedOrders") };
    }

    // A posted id that no longer qualifies (someone else assigned it,
    // a customer cancelled) is reported, not silently dropped.
    if (target.mode === "ids") {
      const missingIds = target.orderIds.filter((id) => !orderIds.includes(id));
      if (missingIds.length > 0) {
        const missingOrders = await db
          .select({ id: orders.id, orderNumber: orders.orderNumber })
          .from(orders)
          .where(inArray(orders.id, missingIds));
        const orderNumberById = new Map(missingOrders.map((order) => [order.id, order.orderNumber]));

        return {
          success: false,
          error: t("someIneligible"),
          invalid: missingIds.map((id) => ({
            orderId: id,
            orderNumber: orderNumberById.get(id) ?? id,
            reason: t("notConfirmedStage"),
          })),
        };
      }
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

    if (plan.errors.length > 0) {
      return { success: false, error: t("someCouldNotAssign"), invalid: plan.errors };
    }

    const now = new Date().toISOString();

    const batch = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(shipmentBatches)
        .values({
          providerId: provider.id,
          createdBy: admin.id,
          orderCount: orderIds.length,
          exportFormat: plan.export?.format ?? null,
          metadata: { weightKg, volume, providerCode: provider.code },
        })
        .returning({ id: shipmentBatches.id, seq: shipmentBatches.seq });

      if (!inserted) throw new Error(t("batchCreateFailed"));

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

    revalidateShipping();

    const riderSplit = riders.length > 0 ? buildRiderSplit(plan.riderByOrderId, riders) : null;

    return {
      success: true,
      data: {
        batchId: batch.id,
        seq: batch.seq ?? 0,
        batchLabel: formatBatchLabel(batch.seq ?? 0),
        assigned: orderIds.length,
        providerCode: provider.code,
        providerName: provider.name,
        exportUrl: plan.export ? `/batches/${batch.id}/export` : null,
        riderSplit,
      },
    };
  } catch (error) {
    return { success: false, error: actionError("bulkAssignProvider", error) };
  }
}

/** Pending-stage only. A prepaid order is never in Pending, so this never touches one. */
export async function bulkConfirmOrders(input: unknown): Promise<BulkConfirmResult> {
  try {
    await requireShippingAdmin();
    const { orderIds } = bulkConfirmOrdersSchema.parse(input);

    const now = new Date().toISOString();
    const updated = await db
      .update(orders)
      .set({ status: "confirmed", updatedAt: now })
      .where(and(inArray(orders.id, orderIds), eq(orders.status, "pending")))
      .returning({ id: orders.id });

    revalidateShipping();
    return { success: true, confirmed: updated.length };
  } catch (error) {
    return { success: false, error: actionError("bulkConfirmOrders", error) };
  }
}

/**
 * Drives "Mark out for delivery" / "Mark delivered" on the Shipped / Out for
 * Delivery tabs. Each order gets its own applyShipmentStatus() transaction —
 * matching the shared writer used everywhere else in this app — so one bad
 * row (a stale status, a concurrent update) doesn't roll back the rest.
 */
export async function bulkUpdateShipmentStatus(input: unknown): Promise<BulkStatusResult> {
  try {
    await requireShippingAdmin();
    const t = await getTranslations("orders");
    const tStatus = await getTranslations("status");
    const { orderIds, status } = bulkUpdateShipmentStatusSchema.parse(input);

    const targets = await db
      .select({
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        shipmentId: shipments.id,
        shipmentStatus: shipments.status,
      })
      .from(orders)
      .leftJoin(shipments, eq(shipments.orderId, orders.id))
      .where(inArray(orders.id, orderIds));

    const failed: BulkStatusFailure[] = [];
    let succeeded = 0;

    for (const target of targets) {
      const from = (target.shipmentStatus ?? "pending") as ShippingStatus;

      if (!canTransition(from, status)) {
        failed.push({
          orderNumber: target.orderNumber,
          reason: t("cannotMove", {
            from: translateShippingStatus(tStatus, from),
            to: translateShippingStatus(tStatus, status),
          }),
        });
        continue;
      }

      try {
        await applyShipmentStatus({
          orderId: target.orderId,
          status,
          existingId: target.shipmentId,
          expectedFromStatus: target.shipmentStatus ?? undefined,
        });
        succeeded += 1;
      } catch (error) {
        failed.push({
          orderNumber: target.orderNumber,
          reason: error instanceof Error ? error.message : t("failedToUpdate"),
        });
      }
    }

    revalidateShipping();
    return { success: true, succeeded, failed };
  } catch (error) {
    return { success: false, error: actionError("bulkUpdateShipmentStatus", error) };
  }
}

/** Powers the assign dialog's "N riders on duty" preview when Tallaby is selected. */
export async function getEligibleRiderCount(): Promise<ActionResult<number>> {
  try {
    await requireShippingAdmin();
    const riders = await loadEligibleRiders();
    return { success: true, data: riders.length };
  } catch (error) {
    return { success: false, error: actionError("getEligibleRiderCount", error) };
  }
}
