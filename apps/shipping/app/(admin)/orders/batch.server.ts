"use server";

import {
  db,
  and,
  eq,
  inArray,
  orders,
  shipments,
  shippingProviders,
} from "@workspace/db";

import { getTranslations } from "next-intl/server";

import { actionError, type ActionResult } from "@/lib/action-result";
import { applyBulkAssign } from "@/lib/apply-bulk-assign";
import { applyShipmentStatus } from "@/lib/apply-shipment-status";
import { requireShippingAdmin } from "@/lib/auth";
import { translateShippingStatus } from "@/lib/rider-labels";
import { canTransition, type ShippingStatus } from "@/lib/shipping-status";
import { formatBatchLabel } from "./batch.lib";
import {
  bulkAssignProviderSchema,
  bulkConfirmOrdersSchema,
  bulkUpdateShipmentStatusSchema,
} from "./batch.dto";
import { loadEligibleRiders, resolveConfirmedOrderIds } from "./batch.query";
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

    const outcome = await applyBulkAssign({
      providerId: provider.id,
      orderIds,
      weightKg,
      volume,
      createdBy: admin.id,
    });

    if (!outcome.ok) {
      if (outcome.code === "plan_blocked") {
        return { success: false, error: t("someCouldNotAssign"), invalid: outcome.invalid };
      }
      return {
        success: false,
        error: outcome.code === "provider_not_found" ? t("providerNotFound") : t("noConfirmedOrders"),
      };
    }

    revalidateShipping();

    const { batchId, seq, assigned, providerCode, providerName, hasExport, riderSplit } = outcome.data;

    return {
      success: true,
      data: {
        batchId,
        seq,
        batchLabel: formatBatchLabel(seq),
        assigned,
        providerCode,
        providerName,
        exportUrl: hasExport ? `/batches/${batchId}/export` : null,
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
