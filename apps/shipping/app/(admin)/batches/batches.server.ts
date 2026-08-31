"use server";

import { alias } from "drizzle-orm/pg-core";
import {
  db,
  desc,
  eq,
  orders,
  shipmentBatchItems,
  shipmentBatches,
  shippingProviders,
  users,
} from "@workspace/db";

import { getTranslations } from "next-intl/server";

import { actionError, type ActionResult, type ListResult } from "@/lib/action-result";
import { requireShippingAdmin } from "@/lib/auth";
import { formatBatchLabel } from "../orders/batch.lib";
import { customer } from "../orders/orders.query";

export interface BatchRow {
  id: string;
  label: string;
  providerName: string;
  providerCode: string;
  orderCount: number;
  createdByName: string | null;
  createdAt: string | null;
  hasExport: boolean;
}

export async function getBatches(): Promise<ListResult<BatchRow>> {
  try {
    await requireShippingAdmin();

    const rows = await db
      .select({
        id: shipmentBatches.id,
        seq: shipmentBatches.seq,
        providerName: shippingProviders.name,
        providerCode: shippingProviders.code,
        orderCount: shipmentBatches.orderCount,
        exportFormat: shipmentBatches.exportFormat,
        createdAt: shipmentBatches.createdAt,
        createdByName: users.fullName,
      })
      .from(shipmentBatches)
      .innerJoin(shippingProviders, eq(shippingProviders.id, shipmentBatches.providerId))
      .leftJoin(users, eq(users.id, shipmentBatches.createdBy))
      .orderBy(desc(shipmentBatches.createdAt));

    return {
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        label: formatBatchLabel(row.seq ?? 0),
        providerName: row.providerName,
        providerCode: row.providerCode,
        orderCount: row.orderCount,
        createdByName: row.createdByName,
        createdAt: row.createdAt,
        hasExport: row.exportFormat !== null,
      })),
    };
  } catch (error) {
    return { success: false, error: actionError("getBatches", error), data: [] };
  }
}

export interface BatchDetailOrder {
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  totalAmount: string;
  riderName: string | null;
}

export interface BatchDetail {
  id: string;
  label: string;
  providerName: string;
  providerCode: string;
  orderCount: number;
  createdByName: string | null;
  createdAt: string | null;
  hasExport: boolean;
  orders: BatchDetailOrder[];
}

export async function getBatchDetail(batchId: string): Promise<ActionResult<BatchDetail>> {
  try {
    await requireShippingAdmin();
    const t = await getTranslations("batches");

    const [batch] = await db
      .select({
        id: shipmentBatches.id,
        seq: shipmentBatches.seq,
        providerName: shippingProviders.name,
        providerCode: shippingProviders.code,
        orderCount: shipmentBatches.orderCount,
        exportFormat: shipmentBatches.exportFormat,
        createdAt: shipmentBatches.createdAt,
        createdByName: users.fullName,
      })
      .from(shipmentBatches)
      .innerJoin(shippingProviders, eq(shippingProviders.id, shipmentBatches.providerId))
      .leftJoin(users, eq(users.id, shipmentBatches.createdBy))
      .where(eq(shipmentBatches.id, batchId))
      .limit(1);

    if (!batch) return { success: false, error: t("batchNotFound") };

    // Own alias — orders.query.ts's `rider` alias isn't imported here to
    // keep this file's join list self-contained and easy to read.
    const batchRider = alias(users, "batch_rider");

    const items = await db
      .select({
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        customerName: customer.fullName,
        totalAmount: orders.totalAmount,
        riderName: batchRider.fullName,
      })
      .from(shipmentBatchItems)
      .innerJoin(orders, eq(orders.id, shipmentBatchItems.orderId))
      .leftJoin(customer, eq(customer.id, orders.userId))
      .leftJoin(batchRider, eq(batchRider.id, shipmentBatchItems.riderId))
      .where(eq(shipmentBatchItems.batchId, batchId));

    return {
      success: true,
      data: {
        id: batch.id,
        label: formatBatchLabel(batch.seq ?? 0),
        providerName: batch.providerName,
        providerCode: batch.providerCode,
        orderCount: batch.orderCount,
        createdByName: batch.createdByName,
        createdAt: batch.createdAt,
        hasExport: batch.exportFormat !== null,
        orders: items,
      },
    };
  } catch (error) {
    return { success: false, error: actionError("getBatchDetail", error) };
  }
}
